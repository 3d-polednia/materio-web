#!/usr/bin/env node
/**
 * LiczMat — the accessibility of everything that shipped, read back off disk.
 *
 *     node scripts/test-a11y.mjs
 *
 * Master plan, session 34 (ACCESSIBILITY): "Dostępność całego produktu. Sprawdzić: oba
 * motywy, selektor języka, selektor waluty, formularze, focus, kontrast, keyboard
 * navigation."
 *
 * Two of those seven are properties of the *markup* and are what this file measures: a
 * form control with no name, a heading level with a hole in it, an id claimed twice, an
 * `aria-controls` pointing at nothing, a control whose only label is the placeholder that
 * disappears when somebody types. None of them looks wrong on screen, all of them are
 * invisible to the eighteen other suites, and every one of them was in the 375 files that
 * shipped before this session.
 *
 * The other five need a browser or a colour calculation and have their own runners:
 *
 *   node scripts/check-contrast.mjs    the colour pairs, both themes, WCAG AA
 *   node scripts/test-a11y-page.mjs    focus, keyboard navigation, both themes, the two
 *                                      selectors — Chromium, nothing stubbed
 *
 * What this one deliberately does NOT do is score the site. There is no number here that
 * says "AA": a rule this file can check is a rule a generator can break, and the rules it
 * cannot check (is the alt text *true*, does the tab order match the reading order) are
 * the ones a person has to look at. Each check below is one defect that was real.
 *
 * Dependency-free, plain `node`, exit 1 on failure. Run it after touching src/pages.mjs,
 * src/template.mjs, src/app-pages.mjs, or any assets/*.js that writes markup.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, HREFLANG } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => readFileSync(p(file), "utf8");

/* ------------------------------------------------------------------ the runner */

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };

function check(name, cond, detail) {
  if (cond) { passed++; return true; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
  return false;
}

/** The same failure on 150 pages is one defect; print it once and say how many. */
function checkAll(name, list, ok, describe) {
  const bad = list.filter((item) => !ok(item));
  return check(name, bad.length === 0,
    bad.length ? `${bad.length} of ${list.length}, e.g. ${describe(bad[0])}` : "");
}

/* ------------------------------------------------------------------ the pages */

/**
 * Every .html file the Pages workflow publishes.
 *
 * `body` is the markup with <script> and <style> stripped: a selector inside a stylesheet
 * and an id inside a template literal are not elements, and counting them as such is how
 * a checker starts reporting defects that are not there.
 */
function collect(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if ([".git", "node_modules", "docs", "src", "scripts", "assets"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { collect(full, out); continue; }
    if (!name.endsWith(".html")) continue;
    const html = readFileSync(full, "utf8");
    const file = full.slice(ROOT.length + 1);
    out.push({
      file,
      html,
      body: html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
        // A comment is not an element either — and privacy-policy.html is hand-written,
        // so its comments are still in the file the browser gets.
        .replace(/<!--[\s\S]*?-->/g, ""),
      url: `/${file.replace(/index\.html$/, "")}`,
      lang: (html.match(/<html lang="([^"]*)"/) || [])[1] || null,
    });
  }
  return out;
}

const PAGES = collect();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};
const has = (tag, name) => new RegExp(`\\s${name}(=|\\s|>|$)`).test(tag);
/** The words a screen reader would read out of a fragment of markup. */
const words = (s) => s.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();
const ids = (page) => [...page.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

head("0. the tree this suite is reading");
{
  // 385 since session 57 put the converter in ten languages beside the 373.
  check("395 pages: 393 generated plus the two hand-written ones",
    PAGES.length === 395, `found ${PAGES.length}`);
  check("every page declares a language",
    PAGES.every((page) => page.lang), PAGES.filter((page) => !page.lang).map((x) => x.url).join(", "));
  const codes = new Set(LANGS.map((l) => HREFLANG[l]));
  checkAll("and it is one of the ten the site ships", PAGES,
    (page) => codes.has(page.lang), (page) => `${page.url} says lang="${page.lang}"`);
}

/* ------------------------------------------------------------------ 1. landmarks */

/* A screen reader's first move on a new page is to jump to a landmark, and a keyboard
   user's is the skip link. Both were on this site already; what was missing is the one
   attribute that makes the second one work. */
head("1. landmarks and the skip link");
{
  const chromed = PAGES.filter((page) => page.body.includes('class="skip-link"'));
  check("every page but 404 carries the skip link",
    chromed.length === PAGES.length - 1, `${chromed.length} of ${PAGES.length}`);

  checkAll("the skip link points at #main", chromed,
    (page) => /<a class="skip-link" href="#main"/.test(page.body), (page) => page.url);

  // Without tabindex the browser scrolls to the landmark and leaves the focus where it
  // was, so the next Tab walks back into the header the visitor asked to skip. This is
  // the whole reason the link was not doing anything.
  checkAll("and its target is focusable — <main id=\"main\" tabindex=\"-1\">", PAGES,
    (page) => /<main id="main"[^>]*tabindex="-1"/.test(page.body) || page.url === "/404.html",
    (page) => `${page.url}: ${(page.body.match(/<main[^>]*>/) || ["no <main>"])[0]}`);

  checkAll("the skip link is real text, not an icon", chromed,
    (page) => words((page.body.match(/<a class="skip-link"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || "").length > 3,
    (page) => page.url);

  checkAll("one <main> to a page", PAGES,
    (page) => (page.body.match(/<main\b/g) || []).length === 1, (page) => page.url);
  checkAll("a <header> and a <footer>", chromed,
    (page) => /<header\b/.test(page.body) && /<footer\b/.test(page.body), (page) => page.url);

  // Two navigations in one page need telling apart, and the way to do that is a name.
  checkAll("every <nav> is named", PAGES,
    (page) => [...page.body.matchAll(/<nav\b[^>]*>/g)]
      .every((m) => attr(m[0], "aria-label") || attr(m[0], "aria-labelledby")),
    (page) => `${page.url}: ${[...page.body.matchAll(/<nav\b[^>]*>/g)]
      .map((m) => m[0]).find((tag) => !attr(tag, "aria-label") && !attr(tag, "aria-labelledby"))}`);
}

/* ------------------------------------------------------------------ 2. headings */

/* The heading list is how a screen reader user reads a page they have not seen. A level
   that jumps from 2 to 4 is a hole in that list; two <h1>s is two documents. */
head("2. the heading outline");
{
  const outline = (page) => [...page.body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)]
    .map((m) => ({ level: +m[1], text: words(m[2]), at: m.index }));

  /**
   * The stretches of markup a script keeps hidden until it has something to put there.
   * An element inside one is not in the accessibility tree, so a heading there is not an
   * empty heading — it is a heading that does not exist yet. /p/ has the only one: the
   * name of a shared estimate, which nobody can write into the page at build time.
   */
  function hiddenRegions(body) {
    const out = [];
    for (const m of body.matchAll(/<(div|section|article)\b[^>]*\shidden(?=[\s>])[^>]*>/g)) {
      let depth = 0;
      const re = new RegExp(`<${m[1]}\\b|</${m[1]}>`, "g");
      re.lastIndex = m.index;
      for (let t = re.exec(body); t; t = re.exec(body)) {
        depth += t[0][1] === "/" ? -1 : 1;
        if (depth === 0) { out.push([m.index, t.index]); break; }
      }
    }
    return out;
  }
  const shown = (page, h) => !hiddenRegions(page.body).some(([a, b]) => h.at > a && h.at < b);

  checkAll("no heading a visitor can reach is empty", PAGES,
    (page) => outline(page).every((h) => h.text.length > 0 || !shown(page, h)),
    (page) => `${page.url}: an empty h${outline(page).find((h) => !h.text && shown(page, h)).level}`);

  // privacy-policy.html is two documents in one file — the Polish policy and the English
  // one, each in its own <article lang>. One <h1> to an article is exactly right there,
  // and it is the only page on the site built that way.
  const articles = (page) => (page.body.match(/<article\b[^>]*\slang="/g) || []).length || 1;
  checkAll("one <h1> per document", PAGES,
    (page) => outline(page).filter((h) => h.level === 1).length === articles(page),
    (page) => `${page.url}: ${outline(page).filter((h) => h.level === 1).length} of them`);

  checkAll("and it comes before every other heading", PAGES,
    (page) => outline(page).length === 0 || outline(page)[0].level === 1,
    (page) => `${page.url} opens with an h${outline(page)[0].level}`);

  // The footer's column headings were <h4> under a page full of <h2>s until session 34,
  // so this one failed on all 395 pages.
  checkAll("no level is skipped on the way down", PAGES, (page) => {
    let prev = 0;
    return outline(page).every((h) => { const ok = !prev || h.level <= prev + 1; prev = h.level; return ok; });
  }, (page) => {
    let prev = 0;
    const gap = outline(page).find((h) => { const bad = prev && h.level > prev + 1; prev = h.level; return bad; });
    return `${page.url}: something → h${gap.level} ("${gap.text}")`;
  });
}

/* ------------------------------------------------------------------ 3. forms */

/* Chapter XXVIII's fields, read the way a screen reader reads them: a control with no
   name is announced as "edit, blank", and a placeholder is not a name — it is gone the
   moment somebody types, and it was the only label on nine of these. */
head("3. every field has a name");
{
  const fields = (page) => [...page.body.matchAll(/<(input|select|textarea)\b[^>]*>/g)]
    .map((m) => ({ tag: m[0], at: m.index }))
    .filter((f) => attr(f.tag, "type") !== "hidden");

  const named = (page, f) => {
    if (attr(f.tag, "aria-label") || attr(f.tag, "aria-labelledby")) return true;
    const id = attr(f.tag, "id");
    if (id && page.body.includes(`for="${id}"`)) return true;
    // A <label> wrapping the control names it too, and that is how every row this site
    // draws at runtime is built.
    const before = page.body.slice(0, f.at);
    return before.lastIndexOf("<label") > before.lastIndexOf("</label>");
  };

  checkAll("no control is left without one", PAGES,
    (page) => fields(page).every((f) => named(page, f)),
    (page) => `${page.url}: ${fields(page).find((f) => !named(page, f)).tag}`);

  checkAll("and no name is only a placeholder", PAGES,
    (page) => fields(page).every((f) => !attr(f.tag, "placeholder") || named(page, f)),
    (page) => `${page.url}: ${fields(page).find((f) => attr(f.tag, "placeholder") && !named(page, f)).tag}`);

  checkAll("every <label for> points at a control that is on the page", PAGES,
    (page) => [...page.body.matchAll(/<label\b[^>]*\sfor="([^"]+)"/g)]
      .every((m) => ids(page).includes(m[1])),
    (page) => `${page.url}: for="${[...page.body.matchAll(/<label\b[^>]*\sfor="([^"]+)"/g)]
      .map((m) => m[1]).find((id) => !ids(page).includes(id))}"`);

  // Chapter XXVIII again, from the other side: a number typed on a phone wants a numeric
  // keypad, and type="number" was refused there for its spinner. Neither decision may
  // cost the field its name.
  const decimals = PAGES.flatMap((page) => [...page.body.matchAll(/<input\b[^>]*inputmode="decimal"[^>]*>/g)]
    .map((m) => ({ page, tag: m[0] })));
  check("the numeric fields are still type=text with inputmode",
    decimals.length > 0 && decimals.every((f) => attr(f.tag, "type") === "text"),
    `${decimals.length} fields`);
}

/* ------------------------------------------------------------------ 4. controls */

head("4. every control says what it is");
{
  // A button whose label the script writes ships empty and is `hidden` until it has one;
  // an element that is hidden is not in the accessibility tree, so it is not nameless —
  // it is absent. Everything else has to carry its name in the markup.
  const controls = (page) => [...page.body.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .filter((m) => !has(m[2], "hidden"))
    .map((m) => ({ tag: m[0], attrs: m[2], text: words(m[3]) }));

  const hasName = (c) => c.text.length > 0 || attr(c.attrs, "aria-label") || attr(c.attrs, "aria-labelledby")
    || attr(c.attrs, "title");

  checkAll("no nameless button or link", PAGES,
    (page) => controls(page).every(hasName),
    (page) => `${page.url}: ${controls(page).find((c) => !hasName(c)).tag.slice(0, 110)}`);

  checkAll("every <img> carries an alt", PAGES,
    (page) => [...page.body.matchAll(/<img\b[^>]*>/g)].every((m) => attr(m[0], "alt") !== null),
    (page) => `${page.url}: ${[...page.body.matchAll(/<img\b[^>]*>/g)].find((m) => attr(m[0], "alt") === null)[0]}`);

  // An icon inside a named control is decoration read out twice. Every <svg> this site
  // writes is one of those, so every one of them is hidden from the tree — and
  // focusable="false" for the one browser that put SVGs in the tab order.
  checkAll("every icon is hidden from the accessibility tree", PAGES,
    (page) => [...page.body.matchAll(/<svg\b[^>]*>/g)].every((m) => attr(m[0], "aria-hidden") === "true"),
    (page) => `${page.url}: ${[...page.body.matchAll(/<svg\b[^>]*>/g)]
      .find((m) => attr(m[0], "aria-hidden") !== "true")[0].slice(0, 90)}`);

  checkAll("nothing claims a place in the tab order for itself", PAGES,
    (page) => [...page.body.matchAll(/tabindex="(-?\d+)"/g)].every((m) => +m[1] <= 0),
    (page) => `${page.url}: tabindex="${[...page.body.matchAll(/tabindex="(-?\d+)"/g)]
      .map((m) => m[1]).find((v) => +v > 0)}"`);
}

/* ------------------------------------------------------------------ 5. references */

/* Every one of these is a promise about another element on the same page. A promise that
   points at nothing is worse than no promise: the browser does not fall back, it just
   announces nothing. */
head("5. ids and the attributes that point at them");
{
  checkAll("no id is claimed twice", PAGES, (page) => {
    const seen = new Set();
    return ids(page).every((id) => (seen.has(id) ? false : (seen.add(id), true)));
  }, (page) => {
    const seen = new Set();
    return `${page.url}: id="${ids(page).find((id) => (seen.has(id) ? true : (seen.add(id), false)))}"`;
  });

  const refs = (page) => [...page.body.matchAll(/\s(aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g)]
    .flatMap((m) => m[2].split(/\s+/).map((id) => ({ what: m[1], id })));

  checkAll("aria-controls / labelledby / describedby all resolve", PAGES,
    (page) => refs(page).every((r) => ids(page).includes(r.id)),
    (page) => `${page.url}: ${(() => { const r = refs(page).find((x) => !ids(page).includes(x.id)); return `${r.what}="${r.id}"`; })()}`);
}

/* ------------------------------------------------------------------ 6. live regions */

/* The one thing this site exists to do is put a number on the screen after a button is
   pressed — and nothing moves, nothing navigates and no focus changes when it happens.
   Without a live region a screen reader is told nothing at all about it. */
head("6. what changes on its own says so");
{
  const calcPages = PAGES.filter((page) => page.body.includes("data-result"));
  check("the 150 calculator pages are the ones with a result box",
    calcPages.length === 150, `found ${calcPages.length}`);
  checkAll("the result box is a live region", calcPages,
    (page) => /<div class="result show" data-result role="status">/.test(page.body),
    (page) => page.url);

  // assets/calculators.js runs the engine once on load to turn the build's markup into a
  // live result. Writing that into a live region would read the answer out unasked, so
  // the write is skipped when the words have not changed.
  const engine = read("assets/calculators.js");
  check("and the run on load does not write into it when nothing changed",
    /function writeResult\(box, html\)/.test(engine) && !/\bbox\.innerHTML = /.test(engine.replace(/if \(words\(html\) !== words\(box\.innerHTML\)\) box\.innerHTML = html;/, "")),
    "renderResult() must go through writeResult()");

  for (const [file, id] of [
    ["sklepy/index.html", "store-status"],
    ["projekty/index.html", "ws-undo"],
    ["klienci/index.html", "crm-undo"],
    ["zlecenia/index.html", "job-undo"],
    ["wyceny/index.html", "quo-undo"],
    ["app/index.html", "app-status"],
    // Session 42: the notice that says the connection is gone has its own line, and it
    // appears without anything moving or taking focus — so it has to announce itself.
    ["app/index.html", "app-offline"],
  ]) {
    const page = PAGES.find((x) => x.file === file);
    const tag = (page.body.match(new RegExp(`<[a-z]+[^>]*\\sid="${id}"[^>]*>`)) || [])[0] || "";
    check(`/${file.replace(/index\.html$/, "")} announces #${id}`,
      attr(tag, "role") === "status" || attr(tag, "aria-live") === "polite", tag);
  }
}

/* ------------------------------------------------------------------ 7. the switches */

/* Chapter XXXII's three switches, which are also three different kinds of control: a
   menu somebody opens, a native select, and a toggle that has a state. */
head("7. the language picker, the currency selector, the theme toggle");
{
  const chromed = PAGES.filter((page) => page.body.includes('id="lang-toggle"'));
  // Not on /app/, /app/dashboard/ or /p/ — those three build their own picker in the
  // browser (assets/i18n-runtime.js) — and not on the two hand-written files.
  check("the picker is on every page that has one in its markup",
    chromed.length === PAGES.length - 5, `${chromed.length} of ${PAGES.length}`);

  checkAll("it is a disclosure: aria-expanded plus aria-controls", chromed, (page) => {
    const btn = (page.body.match(/<button[^>]*id="lang-toggle"[^>]*>/) || [])[0] || "";
    return attr(btn, "aria-expanded") === "false" && attr(btn, "aria-controls") === "lang-menu";
  }, (page) => page.url);

  checkAll("and it is named, because its label is a flag and a code", chromed,
    (page) => Boolean(attr((page.body.match(/<button[^>]*id="lang-toggle"[^>]*>/) || [])[0] || "", "aria-label")),
    (page) => page.url);

  checkAll("the language you are on is marked", chromed,
    (page) => /class="lang-item is-current" aria-current="true"/.test(page.body), (page) => page.url);

  const cur = PAGES.filter((page) => page.body.includes('id="currency-select"'));
  checkAll("the currency selector is a native <select> with a name", cur,
    (page) => {
      const sel = (page.body.match(/<select[^>]*id="currency-select"[^>]*>/) || [])[0] || "";
      return /^<select/.test(sel) && Boolean(attr(sel, "aria-label"));
    }, (page) => page.url);

  const themed = PAGES.filter((page) => page.body.includes('id="theme-toggle"'));
  check("the theme toggle is on every page", themed.length === PAGES.length - 1,
    `${themed.length} of ${PAGES.length}`);
  checkAll("it is named — its label is three icons", themed,
    (page) => Boolean(attr((page.body.match(/<button[^>]*id="theme-toggle"[^>]*>/) || [])[0] || "", "aria-label")),
    (page) => page.url);

  // Session 51: three states, the same three the app offers. `aria-pressed` is gone with
  // the two-state model — a button that cycles through three is neither pressed nor
  // unpressed — and what a screen reader hears change is the name, which the script
  // rewrites to say which mode is in force. The three names have to be ON the button,
  // because the script that reads them is the same one on every page and has no
  // dictionary of its own.
  // The three names are not written onto the button: every page already downloads the
  // dictionary, so assets/main.js reads them with t() and the markup stays as it was.
  const DICT = new Function(`${read("assets/i18n.js")}\nreturn I18N;`)();
  check("the three mode names exist in every language", LANGS.every(
    (l) => ["theme_light", "theme_dark", "theme_system"].every((k) => Boolean(DICT[l] && DICT[l][k]))));
  checkAll("and the button carries all three glyphs, one per state", themed, (page) => {
    const tag = (page.body.match(/<button[^>]*id="theme-toggle"[\s\S]*?<\/button>/) || [])[0] || "";
    return ["ico-sun", "ico-moon", "ico-auto"].every((c) => tag.includes(c));
  }, (page) => page.url);
  check("and the script names the mode in force, in both places that draw the button",
    /data-theme-mode/.test(read("assets/main.js")) && /data-theme-mode/.test(read("privacy-policy.html")));
  // The prose in both files still explains why aria-pressed went; what must not come back
  // is the attribute being SET on a three-state control.
  const setsPressed = (f) => /setAttribute\(\s*['"]aria-pressed['"]/.test(read(f));
  check("nothing sets the two-state contract back (aria-pressed)",
    !setsPressed("assets/main.js") && !setsPressed("privacy-policy.html"));
}

/* ------------------------------------------------------------------ 8. motion */

/* WCAG 2.2.2: something that starts moving by itself and goes on for more than five
   seconds needs a way to stop it. The screenshots in the phone mockup advance every 3.5
   seconds and did not have one — and there is no pausing them with the keyboard by
   hovering, which is the answer a mouse gets by accident. */
head("8. the carousel can be stopped");
{
  const carousel = PAGES.filter((page) => page.body.includes("data-carousel"));
  // /aplikacja/ and its nine translations: the hero and the banner at the foot of it.
  check("the mockup is on the ten pages that show the app",
    carousel.length === 10, `${carousel.length} pages`);

  checkAll("every track has a stop button beside it", carousel, (page) => {
    const tracks = (page.body.match(/data-carousel(?=[\s>])/g) || []).length;
    const buttons = (page.body.match(/data-carousel-pause/g) || []).length;
    return tracks > 0 && buttons === tracks;
  }, (page) => `${page.url}: ${(page.body.match(/data-carousel(?=[\s>])/g) || []).length} tracks, ${(page.body.match(/data-carousel-pause/g) || []).length} buttons`);

  checkAll("the button carries both of its labels, in this page's language", carousel,
    (page) => [...page.body.matchAll(/<button[^>]*data-carousel-pause[\s\S]*?>/g)].every((m) =>
      attr(m[0], "aria-label") && attr(m[0], "data-label-pause") && attr(m[0], "data-label-play")
      && attr(m[0], "data-label-pause") !== attr(m[0], "data-label-play")),
    (page) => page.url);

  // It ships hidden and assets/main.js unhides it when it starts the timer: with no
  // script, and under prefers-reduced-motion, nothing moves and a stop button would be a
  // control that does nothing.
  checkAll("and it ships hidden, for the pages where nothing will move", carousel,
    (page) => [...page.body.matchAll(/<button[^>]*data-carousel-pause[\s\S]*?>/g)].every((m) => has(m[0], "hidden")),
    (page) => page.url);

  const main = read("assets/main.js");
  check("the script unhides it and switches the label with the state",
    /btn\.hidden = false/.test(main) && /labelPlay/.test(main) && /labelPause/.test(main));
  check("a visitor's pause outranks the tab coming back into view",
    /if \(!timer && !paused\)/.test(main));
  check("and prefers-reduced-motion still stops the carousel starting at all",
    /prefers-reduced-motion: reduce/.test(main));

  // Every id in the mockup went in session 34: /aplikacja/ carries two of these and they
  // shared one, so the second never moved and the page was invalid twice over.
  checkAll("the tracks are wired per element, not by a shared id", carousel,
    (page) => !page.body.includes('id="hero-shots"') && !page.body.includes('id="hero-dots"'),
    (page) => page.url);
}

/* ------------------------------------------------------------------ 9. tables */

head("9. tables");
{
  const tables = PAGES.flatMap((page) => [...page.body.matchAll(/<table\b[\s\S]*?<\/table>/g)]
    .map((m) => ({ page, html: m[0] })));
  check("there are tables to check", tables.length > 0, `${tables.length}`);
  checkAll("every one has header cells", tables, (t) => /<th\b/.test(t.html), (t) => t.page.url);
  checkAll("and every header cell says what it heads", tables,
    (t) => [...t.html.matchAll(/<th\b[^>]*>/g)].every((m) => attr(m[0], "scope")),
    (t) => `${t.page.url}: ${[...t.html.matchAll(/<th\b[^>]*>/g)].find((m) => !attr(m[0], "scope"))[0]}`);
}

/* ------------------------------------------------------------------ 10. the stylesheet */

/* Focus and contrast are decisions taken once, in the token block, and spent everywhere.
   scripts/check-contrast.mjs measures the colours; these are the rules that have to be
   there for the colours to reach the screen. */
head("10. focus and the rules under it");
{
  const css = read("assets/styles.css");
  const shipped = read("assets/styles.min.css");

  check(":focus-visible is styled once, for everything",
    /^:focus-visible \{/m.test(css));
  check("the ring is a token, not a colour typed in here",
    /:focus-visible \{[^}]*outline: var\(--focus-w\) solid var\(--focus\)/.test(css));
  check("nothing switches the outline off without putting something back",
    !/outline:\s*(none|0)\s*;/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")),
    "an `outline: none` anywhere in the stylesheet is a keyboard user losing their place");
  check("a field is 16px of text in a 44px box — under 16 iOS zooms the page on focus",
    /min-height: var\(--control-h\)/.test(css) && /--control-h: 44px/.test(css));
  check("the placeholder has a colour of its own, so it can be measured",
    /::placeholder \{ color: var\(--muted\)/.test(css));
  check("motion is switched off for anyone who asked for that",
    /@media \(prefers-reduced-motion: reduce\)/.test(css));
  check("and the shipped stylesheet carries all of it",
    shipped.includes("::placeholder") && shipped.includes(":focus-visible"));
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`a11y: ${passed}/${passed} checks pass`);
