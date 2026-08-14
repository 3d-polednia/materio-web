#!/usr/bin/env node
/**
 * LiczMat — the calculator pages, tested in a real browser.
 *
 *     node scripts/test-pages.mjs
 *
 * Master plan, session 12: the half of the test that a browser has to answer — the page
 * on a phone, the four languages, the currency selector, the form and the result panel as
 * the visitor actually meets them. The arithmetic itself is scripts/test-calculators.mjs,
 * which needs nothing installed and should be the first thing you run.
 *
 * The one dependency is Playwright, and it deliberately lives OUTSIDE this repository —
 * the site ships no package manager and no node_modules (see CLAUDE.md). Install it
 * anywhere and point this script at it with LM_PLAYWRIGHT. (NODE_PATH would not do: it
 * is ignored by ESM resolution, which is what an `import()` here goes through.)
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-pages.mjs
 *
 * A Chromium is found automatically under PLAYWRIGHT_BROWSERS_PATH (or /opt/pw-browsers);
 * LM_CHROMIUM=/path/to/chrome overrides it. Without a browser the script says so and
 * exits 0 — a machine with no Chromium must not fail a commit for the pure-logic tests.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, CALC_SLUG, urlCalc, urlHome } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ the browser */

let chromium;
try {
  // LM_PLAYWRIGHT may name the package directory or the entry file; either way it has to
  // become a file: URL, because a plain path is not a valid ESM specifier.
  let specifier = "playwright";
  if (process.env.LM_PLAYWRIGHT) {
    const given = process.env.LM_PLAYWRIGHT;
    const entry = existsSync(join(given, "index.mjs")) ? join(given, "index.mjs") : given;
    specifier = pathToFileURL(entry).href;
  }
  const mod = await import(specifier);
  chromium = mod.chromium || (mod.default && mod.default.chromium);
  if (!chromium) throw new Error("no chromium export");
} catch {
  console.log("test-pages: Playwright not installed — skipping the browser tests.");
  console.log("            See the header of this file for the one-line install.");
  process.exit(0);
}

/** The Chromium to drive: an explicit override, else the newest one Playwright unpacked. */
function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const b of builds) {
    const exe = join(base, b, "chrome-linux", "chrome");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

/* ------------------------------------------------------------------ the site */

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain",
};

/** The repo root served as-is — the same thing GitHub Pages does. */
function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = decodeURIComponent(req.url.split("?")[0]);
      if (path.endsWith("/")) path += "index.html";
      const file = join(ROOT, path);
      if (!file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404, { "content-type": MIME[".html"] });
        res.end(readFileSync(join(ROOT, "404.html")));
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

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
function eq(name, got, want) {
  return check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

/* ------------------------------------------------------------------ the tests */

const exe = findChromium();
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

/**
 * A browser context that cannot leave the machine.
 *
 * Every page carries Google Analytics and the Google Play badge, and neither is what this
 * file tests: on a machine with no route to Google they hang until the navigation times
 * out, and on one with a route they would make the test depend on somebody else's uptime.
 * Anything not served by the local server is refused, and a refusal is not counted as a
 * page error — the site is built to work when the consent banner keeps GA out anyway.
 */
async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route("**", (route) => {
    if (route.request().url().startsWith(base)) return route.continue();
    return route.abort();
  });
  return ctx;
}

/** Open a page, collecting console errors and uncaught exceptions for the caller to check. */
async function open(ctx, url) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    // A blocked third-party script logs a network failure; that is the route above doing
    // its job, not the page misbehaving.
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base + url, { waitUntil: "domcontentloaded" });
  // The calculators are wired on DOMContentLoaded and the wiring runs the engine once, so
  // the flag below is the point at which the panel holds a live result rather than markup.
  await page.waitForSelector('.calc[data-wired="1"]', { timeout: 5000 }).catch(() => {});
  page.lmErrors = errors;
  return page;
}

/** The big number and its unit, as the visitor reads them. */
const readResult = (page) => page.evaluate(() => {
  const box = document.querySelector(".calc [data-result]");
  if (!box) return null;
  return {
    text: box.innerText.trim(),
    big: (box.querySelector(".big") || {}).innerText || "",
    rows: [...box.querySelectorAll(".rows > div")].map((d) => d.innerText.trim()),
    error: box.classList.contains("err"),
  };
});

const CALC_IDS = Object.keys(CALC_SLUG);

/* --- 1. mobile: no page may scroll sideways ------------------------------------------ */

head("mobile");
{
  for (const width of [360, 414, 768, 1280]) {
    const ctx = await context({ viewport: { width, height: 800 } });
    for (const id of CALC_IDS) {
      const page = await open(ctx, urlCalc("pl", id));
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${id} at ${width}px does not scroll sideways`, overflow <= 0, `overflows by ${overflow}px`);
      check(`${id} at ${width}px logs no error`, page.lmErrors.length === 0, page.lmErrors.join(" / "));
      await page.close();
    }
    await ctx.close();
  }
}
{
  // The answer is the largest thing on the page (session 8) — and it has to stay reachable
  // on a phone, where the form pushes it down.
  const ctx = await context({ viewport: { width: 360, height: 800 } });
  const page = await open(ctx, urlCalc("pl", "waste"));
  const sizes = await page.evaluate(() => {
    const big = document.querySelector(".calc [data-result] .big");
    const h1 = document.querySelector("h1");
    return { big: parseFloat(getComputedStyle(big).fontSize), h1: parseFloat(getComputedStyle(h1).fontSize) };
  });
  check("the answer is set larger than the page title", sizes.big >= sizes.h1,
    `answer ${sizes.big}px, title ${sizes.h1}px`);
  // Every field has to be tappable: 44 px is the size session 4 fixed the controls at.
  const short = await page.evaluate(() =>
    [...document.querySelectorAll(".calc [data-k]")].filter((el) => el.getBoundingClientRect().height < 44).length);
  eq("every field is at least 44px tall", short, 0);
  await page.close();
  await ctx.close();
}

/* --- 2. the form and the result panel ------------------------------------------------- */

head("wyniki");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  for (const id of CALC_IDS) {
    const page = await open(ctx, urlCalc("pl", id));
    // The build writes the answer for the values the form opens with, so the panel holds a
    // real number before any script runs and before anything is typed.
    const before = await readResult(page);
    check(`${id}: opens on an answer, not an empty box`, !!before && /\d/.test(before.big), JSON.stringify(before));
    check(`${id}: opens without an error`, before && !before.error, JSON.stringify(before));
    check(`${id}: the unit next to the number is translated`, before && !/^\s*res_/.test(before.big) && !before.big.includes("|"),
      JSON.stringify(before && before.big));
    // Pressing the button recalculates and relabels itself, exactly as chapter XII asks.
    await page.click(".calc [data-run]");
    const after = await readResult(page);
    eq(`${id}: calculating again gives the same answer`, after.big, before.big);
    const label = await page.textContent(".calc [data-run]");
    check(`${id}: the button becomes "calculate again"`, /ponownie/i.test(label), label);
    await page.close();
  }
  await ctx.close();
}
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await open(ctx, urlCalc("pl", "waste"));
  // Editing a field must say the number no longer belongs to it.
  eq("the stale warning starts hidden", await page.isVisible(".calc [data-calc-stale]"), false);
  await page.fill('.calc [data-k="area"]', "40");
  eq("editing a field raises the stale warning", await page.isVisible(".calc [data-calc-stale]"), true);
  await page.click(".calc [data-run]");
  eq("calculating clears it", await page.isVisible(".calc [data-calc-stale]"), false);
  // …and the answer actually moved: 40 m² + 7 % ÷ 1,44 = ⌈29,72⌉ = 30 packs.
  const r = await readResult(page);
  check("40 m² answers 30 packs", /\b30\b/.test(r.big), r.big);
  // Enter in a field does the same as the button.
  await page.fill('.calc [data-k="area"]', "20");
  await page.press('.calc [data-k="area"]', "Enter");
  check("Enter recalculates", /\b15\b/.test((await readResult(page)).big), (await readResult(page)).big);
  // A refused input shows the message, not a number.
  await page.fill('.calc [data-k="area"]', "0");
  await page.click(".calc [data-run]");
  const err = await readResult(page);
  check("a 0 m² floor shows an error", err.error, JSON.stringify(err));
  check("…in Polish, not as a key", !/^err_/.test(err.text) && !err.text.includes("|"), err.text);
  await page.close();
  await ctx.close();
}

/* --- 3. localization: the same calculator in four languages --------------------------- */

head("lokalizacja");
{
  for (const lang of LANGS) {
    const ctx = await context({ viewport: { width: 1280, height: 900 } });
    for (const id of ["waste", "concrete", "ceiling"]) {
      const page = await open(ctx, urlCalc(lang, id));
      const r = await readResult(page);
      check(`${id}/${lang}: the panel holds an answer`, !!r && /\d/.test(r.big), JSON.stringify(r));
      check(`${id}/${lang}: nothing left in pipes`, r && !r.text.includes("|"), r && r.text);
      check(`${id}/${lang}: no untranslated key shows through`, r && !/\b(res|err|fld)_[a-z_]+/.test(r.text), r && r.text);
      check(`${id}/${lang}: no "undefined" printed`, r && !/undefined/i.test(r.text), r && r.text);
      check(`${id}/${lang}: the page declares its language`,
        (await page.getAttribute("html", "lang")) === lang);
      check(`${id}/${lang}: no console error`, page.lmErrors.length === 0, page.lmErrors.join(" / "));
      await page.close();
    }
    await ctx.close();
  }
  // The decimal separator follows the language. 20 m² of screed 40 mm thick is 1600 kg —
  // written 1 600 in Polish and 1,600 in English, never the other way round.
  for (const [lang, re] of [["pl", /1[  ]?600/], ["en", /1,600/], ["de", /1\.600/]]) {
    const ctx = await context({ viewport: { width: 1280, height: 900 } });
    const page = await open(ctx, urlCalc(lang, "screed"));
    const r = await readResult(page);
    check(`${lang}: 1600 kg is grouped the ${lang} way`, re.test(r.text), r.text);
    await page.close();
    await ctx.close();
  }
  // A counted noun takes the form the language uses for that count: 1 worek, 2 worki,
  // 64 worków — all three off the same calculator.
  {
    const ctx = await context({ viewport: { width: 1280, height: 900 } });
    const page = await open(ctx, urlCalc("pl", "mortar"));
    const forms = {};
    for (const [area, key] of [["5", "one"], ["10", "few"], ["100", "many"]]) {
      await page.fill('.calc [data-k="area"]', area);
      await page.click(".calc [data-run]");
      forms[key] = (await readResult(page)).big.trim();
    }
    check("1 worek", /\bworek\b/.test(forms.one), forms.one);
    check("2 worki", /\bworki\b/.test(forms.few), forms.few);
    check("20 worków", /\bworków\b/.test(forms.many), forms.many);
    await page.close();
    await ctx.close();
  }
}

/* --- 4. currency: it relabels the money and moves nothing else ------------------------- */

head("waluta");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await open(ctx, urlCalc("pl", "waste"));
  await page.fill('.calc [data-k="price"]', "49.99");
  await page.click(".calc [data-run]");

  const shot = async () => {
    const r = await readResult(page);
    return { big: r.big.trim(), cost: r.rows.find((x) => /koszt/i.test(x)) || "", rows: r.rows.slice(1) };
  };
  const pln = await shot();
  check("the price is charged in złoty to start with", /zł/.test(pln.cost), pln.cost);
  // 15 packs × 49,99 = 749,85 — the digits that must survive every switch.
  check("15 × 49,99 = 749,85", /749[,.]85/.test(pln.cost), pln.cost);

  for (const code of ["EUR", "USD", "UAH"]) {
    await page.selectOption("#currency-select", code);
    await page.waitForTimeout(50);
    const now = await shot();
    eq(`${code}: the count does not move`, now.big, pln.big);
    check(`${code}: the physical rows do not move`, JSON.stringify(now.rows) === JSON.stringify(pln.rows),
      `${JSON.stringify(pln.rows)} → ${JSON.stringify(now.rows)}`);
    check(`${code}: the amount is not converted`, /749[,.]85/.test(now.cost), now.cost);
    check(`${code}: only the symbol changed`, !/zł/.test(now.cost), now.cost);
  }
  // The choice survives a reload, and it is not the language that decides it.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  eq("the chosen currency survives a reload", await page.inputValue("#currency-select"), "UAH");
  await page.close();
  await ctx.close();
}
{
  // A German page starts in euro and an English one in dollars — until somebody chooses.
  for (const [lang, code] of [["pl", "PLN"], ["uk", "UAH"], ["de", "EUR"], ["en", "USD"]]) {
    const ctx = await context({ viewport: { width: 1280, height: 900 } });
    const page = await open(ctx, urlCalc(lang, "waste"));
    eq(`${lang} starts in ${code}`, await page.inputValue("#currency-select"), code);
    await page.close();
    await ctx.close();
  }
}

/* --- 5. the page without JavaScript ---------------------------------------------------- */

head("bez javascriptu");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  for (const id of CALC_IDS) {
    const page = await ctx.newPage();
    await page.goto(base + urlCalc("pl", id), { waitUntil: "domcontentloaded" });
    const r = await readResult(page);
    // The build wrote the answer into the markup, so a crawler and a visitor with no
    // JavaScript both read a real number rather than an empty green rectangle.
    check(`${id}: shows a server-rendered answer`, !!r && /\d/.test(r.big), JSON.stringify(r));
    check(`${id}: and it is not a token`, r && !r.text.includes("|"), r && r.text);
    await page.close();
  }
  await ctx.close();
}

/* --- 7. the header row, with five links ----------------------------------------------- */

head("nagłówek");
{
  // Session 5 put the ceiling at four links after measuring German wrapping between 900px
  // and 1080px; the owner asked for a fifth ("Aplikacja") after session 20. This is the
  // measurement that decides whether the fifth is allowed, in the language with the
  // longest labels and at every width where the row is still a row.
  //
  // Below 900px the navigation is a drawer and cannot wrap. Above 1160px the tightening in
  // assets/styles.css stops applying, so both sides of that breakpoint are checked. The
  // guest view is the honest one to measure at four visible links AND at five: the fifth,
  // "Projekty", comes back the moment somebody signs in.
  for (const width of [900, 1000, 1160, 1280]) {
    const ctx = await context({ viewport: { width, height: 800 } });
    for (const lang of LANGS) {
      for (const signedIn of [false, true]) {
        const page = await ctx.newPage();
        await page.goto(`${base}/404.html`, { waitUntil: "domcontentloaded" });
        await page.evaluate((on) => {
          localStorage.clear();
          if (on) localStorage.setItem("liczmat-signed-in", "liczmat");
        }, signedIn);
        await page.goto(base + urlHome(lang), { waitUntil: "load" });

        const who = `${lang} at ${width}px${signedIn ? " signed in" : ""}`;
        const row = await page.evaluate(() => {
          const nav = document.querySelector(".nav");
          const items = [...document.querySelectorAll(".nav-list li")]
            .filter((li) => getComputedStyle(li).display !== "none");
          const tops = new Set(items.map((li) => Math.round(li.getBoundingClientRect().top)));
          const cta = document.querySelector(".nav-cta").getBoundingClientRect();
          return {
            shown: items.length,
            lines: tops.size,
            navBottom: Math.round(nav.getBoundingClientRect().bottom),
            ctaRight: Math.round(cta.right),
            width: document.documentElement.clientWidth,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });

        eq(`${who}: the links a visitor sees`, row.shown, signedIn ? 5 : 4);
        eq(`${who}: they are all on one line`, row.lines, 1);
        check(`${who}: the account button is inside the viewport`,
          row.ctaRight <= row.width, `button ends at ${row.ctaRight} of ${row.width}`);
        check(`${who}: the page does not scroll sideways`, row.overflow <= 0,
          `overflows by ${row.overflow}px`);
        await page.close();
      }
    }
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ the verdict */

await browser.close();
server.close();

const total = passed + failures.length;
if (failures.length) {
  console.error(`\n${failures.length} of ${total} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`pages: ${total}/${total} checks pass`);
