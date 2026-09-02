#!/usr/bin/env node
/**
 * LiczMat — what a page actually weighs, tested.
 *
 *     node scripts/test-perf.mjs
 *
 * Master plan, session 33 (PERFORMANCE): "Optymalizacja: ładowania, JS, CSS, obrazów,
 * fontów, bundle. Szczególnie sprawdzić assety flag, logo i ikon."
 *
 * Performance is the one quality on this site that nothing else notices. A page can be
 * correct in ten languages, pass every mobile width, carry a perfect canonical and still
 * make somebody on a phone at the back of a builders' merchant wait for 300 kB of
 * dictionaries they will never read. Nothing in the other eighteen suites fails when a
 * file doubles, so a file doubles.
 *
 * So this one reads the same files a browser would fetch — the page, then every local
 * asset its markup asks for — and adds them up, raw and gzipped, against a budget written
 * down per page type. Numbers, not adjectives. The budgets are the measurement taken on
 * the day they were written with headroom on top, so an honest new feature fits and a
 * regression does not.
 *
 * gzip because that is what GitHub Pages serves: judging a dictionary by its 68 kB on
 * disk when 23 kB cross the wire would put the effort in the wrong place. Both are
 * printed, and both are checked — the raw size is what the browser parses.
 *
 * What it deliberately does NOT measure: how long anything takes. A timing on this
 * machine is a fact about this machine. Bytes, requests and what stands on the render
 * path are properties of the build, they are the same everywhere, and they are what the
 * session could change.
 *
 * Dependency-free, plain `node`, exit 1 on failure — the same shape as the other logic
 * suites. Run it after adding a script or a stylesheet to a page, after changing what
 * the build emits into assets/, or after touching the <head> in src/template.mjs.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, DEFAULT_LANG } from "../src/site.mjs";

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

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

/* ------------------------------------------------------------------ the pages */

/** Every .html file in the published tree. The four stripped directories are skipped. */
function collect(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if ([".git", "node_modules", "docs", "src", "scripts", "assets"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { collect(full, out); continue; }
    if (name.endsWith(".html")) out.push(full.slice(ROOT.length + 1));
  }
  return out;
}

const PAGES = collect().sort();

/** Every URL the markup asks a browser to fetch before the page is finished. */
function requests(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) out.push({ kind: "script", url: m[1] });
  for (const m of html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)) out.push({ kind: "style", url: m[1] });
  for (const m of html.matchAll(/<link\b[^>]*\brel="icon"[^>]*\bhref="([^"]+)"/g)) out.push({ kind: "icon", url: m[1] });
  for (const m of html.matchAll(/<link\b[^>]*\brel="apple-touch-icon"[^>]*\bhref="([^"]+)"/g)) out.push({ kind: "touch-icon", url: m[1] });
  return out;
}

/** The page plus every local asset it names, raw and gzipped. Third parties are counted
    as requests and not as bytes: their size is theirs to change, not this repo's. */
function weigh(file) {
  const html = readFileSync(p(file));
  let raw = html.length;
  let gz = gzipSync(html, { level: 9 }).length;
  const missing = [];
  let external = 0;
  // An icon is a request a browser may or may not make and never blocks anything, so it
  // is listed but left out of the total the budgets are written against.
  const fetched = requests(html.toString()).filter((r) => r.kind === "script" || r.kind === "style");
  for (const r of fetched) {
    if (/^https?:/.test(r.url)) { external += 1; continue; }
    const asset = r.url.replace(/^\//, "").split("?")[0];
    if (!existsSync(p(asset))) { missing.push(r.url); continue; }
    const bytes = readFileSync(p(asset));
    raw += bytes.length;
    gz += gzipSync(bytes, { level: 9 }).length;
  }
  return { file, html: html.toString(), raw, gz, missing, external, requests: fetched.length + 1 };
}

/**
 * One page of each kind, and the budget it has to fit inside.
 *
 * `[raw kB, gzip kB]`, measured after session 33 with roughly a tenth of headroom. A page
 * type that is not here is covered by the ceiling in §1c, which every page has to clear.
 */
const BUDGET = {
  "index.html": [215, 62],
  "kalkulatory/index.html": [235, 66],
  "kalkulatory/plytki-panele-gres/index.html": [360, 112],
  // 63 rather than 62 since 2026-09-02: the language picker is drawn twice on every page
  // (the header menu and the footer's list) and it went from ten rows to thirteen. That is
  // three names and three inlined flags each time, and this page had the least slack.
  "konwerter-jednostek/index.html": [220, 63],
  "poradniki/ile-farby-na-pokoj/index.html": [212, 61],
  "sklepy/index.html": [220, 65],
  "materialy/index.html": [320, 81],
  "projekty/index.html": [355, 106],
  "kosztorys/index.html": [345, 104],
  "liczmat-pro/index.html": [235, 71],
  "klienci/index.html": [405, 126],
  "zlecenia/index.html": [405, 126],
  "wyceny/index.html": [410, 128],
  "terminarz/index.html": [385, 118],
  // Raised in session 59 from [355, 110], measured at 376.6 kB / 116.5 kB gz. /app/ is the
  // one page that carries every store the account syncs, and session 59 gave it a third:
  // assets/own-materials.js, 16.8 kB raw and 6.0 kB gzipped, plus the sixteen runtime
  // `omat_*` keys in the dictionary bundle. The page's own copy did not grow. The number
  // is the CRM pages' budget, which leaves the same headroom they have and stays under the
  // CEILING below — the store half only is already the cheap option: assets/crm.js is
  // 47 kB of screens /app/ never draws, and assets/own-materials-ui.js is not here either.
  "app/index.html": [405, 126],
  "app/dashboard/index.html": [290, 89],
  "p/index.html": [200, 62],
};

/**
 * No page on the site, in any language, may cross this.
 *
 * Raised from [420, 130] on 2026-09-02, measured at 420.4 kB raw on /uk/koshtorysy-pro/,
 * which is the heaviest page there is: Ukrainian is two UTF-8 bytes a letter and the quote
 * screen carries the whole Pro store. What pushed it over is the picker going from ten
 * rows to thirteen, twice per page. Gzipped it is 121.9 kB, so that half did not move.
 */
const CEILING = [425, 130];

/**
 * And no single asset may, either — one file is one thing a browser waits for.
 *
 * The number is set by the biggest dictionary, Ukrainian: Cyrillic is two UTF-8 bytes a
 * letter, so it is half again the size of the Latin ones and there is nothing to be done
 * about it short of not shipping the language.
 */
const ASSET_CEILING = [100, 28];

/** The two pages the build does not generate and never overwrites. */
const HAND_WRITTEN = ["privacy-policy.html", "404.html"];

const WEIGHED = new Map(PAGES.map((f) => [f, weigh(f)]));

/* ------------------------------------------------------------------ 1. the weight */

head("1. what a page weighs");
{
  for (const [file, budget] of Object.entries(BUDGET)) {
    const w = WEIGHED.get(file);
    if (!check(`${file} is a page that shipped`, !!w)) continue;
    check(`${file} is inside its raw budget`, w.raw <= budget[0] * 1024,
      `${kb(w.raw)} against ${budget[0]} kB`);
    check(`${file} is inside its gzip budget`, w.gz <= budget[1] * 1024,
      `${kb(w.gz)} against ${budget[1]} kB`);
  }
}

head("1b. every asset a page names is on disk");
{
  for (const w of WEIGHED.values()) {
    check(`${w.file} asks for nothing that is missing`, w.missing.length === 0,
      w.missing.join(", "));
  }
}

head("1c. the ceiling, on all 510 pages rather than on the samples");
{
  for (const w of WEIGHED.values()) {
    check(`${w.file} is under the ceiling raw`, w.raw <= CEILING[0] * 1024, kb(w.raw));
    check(`${w.file} is under the ceiling gzipped`, w.gz <= CEILING[1] * 1024, kb(w.gz));
  }
}

head("1d. no single asset is a download of its own");
{
  for (const name of readdirSync(p("assets"))) {
    const full = p("assets", name);
    if (statSync(full).isDirectory()) continue;
    if (!/\.(js|css)$/.test(name)) continue;
    const bytes = readFileSync(full);
    // assets/i18n.js and the two dictionaries beside it are build input: the browser has
    // never downloaded them, and the Pages artifact keeps them only because the repo root
    // is the site root. Anything the browser does fetch is held to the ceiling.
    if (/^i18n(-pages|-materials)?\.js$/.test(name)) continue;
    check(`assets/${name} is under the asset ceiling`, bytes.length <= ASSET_CEILING[0] * 1024,
      kb(bytes.length));
    check(`assets/${name} is under it gzipped`,
      gzipSync(bytes, { level: 9 }).length <= ASSET_CEILING[1] * 1024,
      kb(gzipSync(bytes, { level: 9 }).length));
  }
}

/* ------------------------------------------------------------------ 2. the stylesheet */

head("2. the stylesheet ships without its own documentation");
{
  const authored = read("assets/styles.css");
  const shipped = read("assets/styles.min.css");

  check("the authored stylesheet still explains itself", authored.includes("/*"));
  check("the shipped one says where it came from",
    shipped.startsWith("/* Generated by scripts/build.mjs from assets/styles.css"));
  // Its own banner is the one comment allowed: a generated file that does not say it is
  // generated gets edited by hand exactly once.
  const body = shipped.slice(shipped.indexOf("*/") + 2);
  check("and it is the only comment in it", !body.includes("/*"),
    body.slice(body.indexOf("/*"), body.indexOf("/*") + 80));
  check("it is smaller than the file it came from", shipped.length < authored.length,
    `${kb(shipped.length)} against ${kb(authored.length)}`);

  // Same rules in the same order: this is a comment strip, not a minifier, so every
  // declaration and every brace has to survive it exactly.
  const rules = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
  check("and it is the same stylesheet underneath", rules(authored) === rules(shipped));
  check("with the same number of braces",
    (authored.match(/\{/g) || []).length === (shipped.match(/\{/g) || []).length,
    `${(authored.match(/\{/g) || []).length} against ${(shipped.match(/\{/g) || []).length}`);

  for (const w of WEIGHED.values()) {
    check(`${w.file} links the shipped stylesheet`, w.html.includes("/assets/styles.min.css?v="));
    check(`${w.file} does not link the authored one`, !/href="\/assets\/styles\.css/.test(w.html));
    const sheets = requests(w.html).filter((r) => r.kind === "style");
    check(`${w.file} has exactly one stylesheet`, sheets.length === 1,
      sheets.map((s) => s.url).join(", "));
  }
}

/* ------------------------------------------------------------------ 3. the dictionary */

head("3. a page downloads one language");
{
  check("the all-languages bundle is gone", !existsSync(p("assets/i18n.all.js")));

  for (const w of WEIGHED.values()) {
    // The two hand-written pages carry no script at all — they are a policy and a 404.
    if (HAND_WRITTEN.includes(w.file)) continue;
    const bundles = [...w.html.matchAll(/\/assets\/(i18n\.[a-z]+\.js)/g)].map((m) => m[1]);
    check(`${w.file} loads exactly one dictionary`, bundles.length === 1, bundles.join(", "));
    check(`${w.file} loads no all-languages bundle`, !w.html.includes("i18n.all.js"));
  }

  // The three pages with no language of their own get DEFAULT_LANG and fetch a second
  // bundle only when somebody picks another language. That is the whole saving, so it is
  // checked from both ends: the markup asks for one, and the runtime can ask for more.
  for (const bare of ["app/index.html", "app/dashboard/index.html", "p/index.html"]) {
    const w = WEIGHED.get(bare);
    if (!check(`${bare} shipped`, !!w)) continue;
    check(`${bare} starts in ${DEFAULT_LANG}`, w.html.includes(`/assets/i18n.${DEFAULT_LANG}.js?v=`));
  }
  const runtime = read("assets/i18n-runtime.js");
  check("the runtime can fetch a language it was not given", runtime.includes("function ensureLang("));
  check("and it builds the URL from the bundle it already has",
    runtime.includes('"/assets/i18n." + lang + ".js"'));
  check("carrying the stamp the page was built with, so the two agree",
    runtime.includes("LM_ASSET_QUERY"));
  check("a bundle that never arrives leaves the page in the language it is in",
    runtime.includes("el.onerror = finish"));

  // Every bundle has to be additive, or a second one would collide with the first.
  for (const lang of LANGS) {
    const src = read(`assets/i18n.${lang}.js`);
    check(`assets/i18n.${lang}.js merges rather than declares`,
      src.includes('var I18N = (typeof I18N === "object" && I18N) || {};'));
    check(`assets/i18n.${lang}.js carries only ${lang}`,
      (src.match(/^I18N\[/gm) || []).length === 1);
    check(`assets/i18n.${lang}.js still lists all ten languages for the picker`,
      LANGS.every((l) => src.includes(`"code":"${l}"`)));
  }
}

/* ------------------------------------------------------------------ 4. flags, logo, icons */

head("4. flags, logo and icons — the assets chapter XXXII names by hand");
{
  // Flags are inlined and never requested: ten shapes of 222 to 523 bytes cost less than
  // ten requests, cannot flash in late and survive when the network is gone.
  for (const w of WEIGHED.values()) {
    check(`${w.file} fetches no flag`, !/\/assets\/flags\/[a-z]{2}\.svg/.test(w.html));
  }
  const home = WEIGHED.get("index.html");
  check("the home page draws its flags from the markup",
    (home.html.match(/<span class="flag">\s*<svg/g) || []).length >= LANGS.length,
    String((home.html.match(/<span class="flag">\s*<svg/g) || []).length));

  // …and the shapes are therefore NOT in the dictionary every page downloads.
  for (const lang of LANGS) {
    check(`assets/i18n.${lang}.js carries no flag markup`, !read(`assets/i18n.${lang}.js`).includes("<svg"));
  }
  check("they live in one file instead", existsSync(p("assets/flags.js")));
  const flags = read("assets/flags.js");
  check("which holds every language", LANGS.every((l) => flags.includes(`"${l}":`)));
  check("and is small enough to be worth one request", flags.length < 6 * 1024, kb(flags.length));

  // Only the three pages that build their own picker download it.
  for (const w of WEIGHED.values()) {
    if (HAND_WRITTEN.includes(w.file)) continue;
    const wants = w.html.includes("/assets/flags.js?v=");
    const bare = ["app/index.html", "app/dashboard/index.html", "p/index.html"].includes(w.file);
    check(`${w.file} ${bare ? "loads" : "does not load"} assets/flags.js`, wants === bare);
  }

  // Two icons in the <head>, not three: a browser picking the largest declared icon used
  // to fetch 5.4 kB to draw a 16 px tab. 192 and 512 are declared in site.webmanifest,
  // which is where a size that big is actually wanted.
  const manifest = JSON.parse(read("site.webmanifest"));
  check("the manifest declares the install icons",
    manifest.icons.map((i) => i.sizes).sort().join(",") === "192x192,512x512");
  for (const w of WEIGHED.values()) {
    const icons = requests(w.html).filter((r) => r.kind === "icon");
    // rel="icon" only. The apple-touch-icon is 180 px by definition and is fetched when
    // somebody adds the site to a home screen, never to draw a tab.
    check(`${w.file} declares no icon over 2 kB`,
      icons.every((i) => {
        const f = i.url.replace(/^\//, "").split("?")[0];
        return !existsSync(p(f)) || readFileSync(p(f)).length <= 2 * 1024;
      }),
      icons.map((i) => i.url).join(", "));
    const allIcons = requests(w.html).filter((r) => r.kind === "icon" || r.kind === "touch-icon");
    check(`${w.file} stamps every icon it declares`, allIcons.every((i) => i.url.includes("?v=")),
      allIcons.map((i) => i.url).join(", "));
  }

  // The logo is geometry in the markup for the same reason the flags are.
  check("the logo is drawn rather than fetched", !home.html.includes("/assets/logo-mark.svg"));
}

/* ------------------------------------------------------------------ 5. the render path */

head("5. what stands between the visitor and the first paint");
{
  for (const w of WEIGHED.values()) {
    if (HAND_WRITTEN.includes(w.file)) continue;
    // The analytics library is fetched by the inline tag after load, so there is no
    // third-party <script src> in the markup competing with the stylesheet.
    check(`${w.file} makes no third-party request while it parses`, w.external === 0,
      String(w.external));
    // /p/ is the exception, and it is the security decision of session 35 rather than a
    // performance one: the token in its address is the credential, and GA4 reports
    // `page_location`. A page with no tag has nothing to set consent for, so the two
    // checks below are the ones it has to fail — what it must not do is carry half a tag.
    const tagged = w.html.includes("googletagmanager.com/gtag/js");
    if (!tagged) {
      check(`${w.file} carries no analytics at all, not half of it`,
        !w.html.includes("gtag(") && !w.html.includes("dataLayer")
        && !w.html.includes("dns-prefetch"));
    } else {
      check(`${w.file} still sets consent before anything can read a cookie`,
        w.html.indexOf("gtag('consent', 'default'") < w.html.indexOf("googletagmanager.com/gtag/js"));
      check(`${w.file} waits for load before fetching the tag`,
        w.html.includes("window.addEventListener('load'"));
    }
    check(`${w.file} opens no connection it will not use during the render`,
      !w.html.includes('rel="preconnect"'));
  }
}

head("5b. every asset is cache-busted, and by one stamp");
{
  const stamps = new Set();
  for (const w of WEIGHED.values()) {
    for (const m of w.html.matchAll(/"\/assets\/[^"]+"/g)) {
      const url = m[0].slice(1, -1);
      // og-image.jpg and the screenshots are content, addressed absolutely elsewhere and
      // never re-cut in place; everything the page executes or paints with is stamped.
      if (/\.(jpg|webp|png)$/.test(url) && !/favicon|icon-|apple-touch/.test(url)) continue;
      check(`${w.file} stamps ${url}`, url.includes("?v="));
      const at = url.indexOf("?v=");
      if (at >= 0) stamps.add(url.slice(at + 3));
    }
  }
  check("and it is one stamp across the whole site", stamps.size === 1, [...stamps].join(", "));
}

/* ------------------------------------------------------------------ 6. images */

head("6. images reserve their space and load when they are reached");
{
  for (const w of WEIGHED.values()) {
    const imgs = [...w.html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    imgs.forEach((img, i) => {
      check(`${w.file} image ${i + 1} declares its width and height`,
        /\bwidth="\d+"/.test(img) && /\bheight="\d+"/.test(img), img.slice(0, 90));
      check(`${w.file} image ${i + 1} decodes off the main thread`,
        img.includes('decoding="async"'), img.slice(0, 90));
      // The first image on a page may be what the visitor came to see; the rest wait.
      if (i > 0) {
        check(`${w.file} image ${i + 1} waits to be scrolled to`, img.includes('loading="lazy"'),
          img.slice(0, 90));
      }
    });
  }
  // Photographs are WebP; nothing on the site ships a JPEG or a PNG into a page body.
  for (const w of WEIGHED.values()) {
    check(`${w.file} shows no unconverted photograph`,
      !/<img\b[^>]*src="[^"]+\.(jpe?g|png)"/.test(w.html));
  }
}

/* ------------------------------------------------------------------ 7. the markup */

head("7. the markup ships without the narrative that explains it");
{
  for (const w of WEIGHED.values()) {
    // src/*.mjs explains itself next to the block it describes; the visitor gets the
    // block. Generated pages only — privacy-policy.html and 404.html are hand-written.
    if (["privacy-policy.html", "404.html"].includes(w.file)) continue;
    check(`${w.file} carries no HTML comment`, !w.html.includes("<!--"),
      w.html.slice(w.html.indexOf("<!--"), w.html.indexOf("<!--") + 80));
  }
  // And the source still does, or the argument for every decision has quietly gone.
  check("src/template.mjs still explains itself", read("src/template.mjs").includes("<!--"));
  check("src/pages.mjs too", read("src/pages.mjs").includes("<!--"));
}

/* ------------------------------------------------------------------ 8. the scripts */

head("8. a page downloads the code it runs and no more");
{
  // Session 33 cut assets/workspace-ui.js in two. A calculator page needs the room bar
  // and the save box; it does not need the /projekty/ screen, and 150 of the site's 373
  // pages are calculator pages.
  check("the calculator half exists", existsSync(p("assets/workspace-calc.js")));
  const calc = WEIGHED.get("kalkulatory/plytki-panele-gres/index.html");
  check("a calculator page loads it", calc.html.includes("/assets/workspace-calc.js?v="));
  check("and not the two screens", !calc.html.includes("/assets/workspace-ui.js?v="));

  const projects = WEIGHED.get("projekty/index.html");
  check("the projects page loads both halves",
    projects.html.includes("/assets/workspace-calc.js?v=")
    && projects.html.includes("/assets/workspace-ui.js?v="));
  check("in that order, because they are plain scripts in one scope",
    projects.html.indexOf("workspace-calc.js") < projects.html.indexOf("workspace-ui.js"));
  check("the calculator half is the smaller one",
    readFileSync(p("assets/workspace-calc.js")).length
      < readFileSync(p("assets/workspace-ui.js")).length);

  // Nothing loads an engine it cannot use: /projekty/ prints saved results and never
  // calculates one, so it takes assets/units.js and leaves assets/calculators.js.
  check("the projects page loads no calculation engine",
    !projects.html.includes("/assets/calculators.js"));
  check("but does load the words that go next to a number",
    projects.html.includes("/assets/units.js"));

  // No page loads the same file twice — an easy mistake once a page's scripts come from
  // two lists, and one the browser will not warn about.
  for (const w of WEIGHED.values()) {
    const urls = requests(w.html).filter((r) => r.kind === "script")
      .map((r) => r.url.split("?")[0]);
    check(`${w.file} names no script twice`, new Set(urls).size === urls.length,
      urls.filter((u, i) => urls.indexOf(u) !== i).join(", "));
  }
}

/* ------------------------------------------------------------------ 9. fonts */

head("9. fonts");
{
  // There are none, and that is the optimisation: the design system spends the font the
  // device already has. A web font is a render-blocking download in every weight, and on
  // the connection this site is used on it is the most expensive thing a page can want.
  const css = read("assets/styles.css");
  check("no @font-face anywhere in the design system", !css.includes("@font-face"));
  for (const w of WEIGHED.values()) {
    check(`${w.file} fetches no font`, !/\.(woff2?|ttf|otf|eot)\b/.test(w.html));
    check(`${w.file} opens no connection to a font host`,
      !/fonts\.(googleapis|gstatic)\.com/.test(w.html));
  }
}

/* ------------------------------------------------------------------ the summary */

const total = passed + failures.length;
if (failures.length) {
  console.error(`\nperformance: ${failures.length} of ${total} checks FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

// The numbers themselves, so a session that changes something can see what it changed.
const sample = Object.keys(BUDGET).filter((f) => WEIGHED.has(f));
const widest = Math.max(...sample.map((f) => f.length));
console.log("");
for (const file of sample) {
  const w = WEIGHED.get(file);
  const [rb, gb] = BUDGET[file];
  console.log(`  ${file.padEnd(widest)}  ${String(w.requests).padStart(2)} req  ` +
    `${kb(w.raw).padStart(9)} / ${kb(w.gz).padStart(8)} gz   (budget ${rb} / ${gb})`);
}
const all = [...WEIGHED.values()];
const heaviest = all.reduce((a, b) => (b.gz > a.gz ? b : a));
console.log(`\n  ${all.length} pages, heaviest ${heaviest.file} at ${kb(heaviest.gz)} gzipped`);
console.log(`\nperformance: ${passed}/${total} checks pass`);
