#!/usr/bin/env node
/**
 * LiczMat — the unit converter in a real browser.
 *
 *     node scripts/test-converter-page.mjs
 *
 * Session 57, item C1 of the parity audit, in the half that needs a browser: the tool is
 * live as somebody types, the category picker rebuilds both unit lists under it, the swap
 * button turns the question round, an empty field says so instead of showing a zero — and
 * the one thing only a browser can be asked, which is that the answer the build wrote into
 * the markup and the answer the script computes are the same string, so a screen reader is
 * not read a result nobody asked for the moment the page loads.
 *
 * The pure logic half is scripts/test-converter.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** The page touches no network and has no account, no store and no
 * Firebase behind it: it is a table of factors and a form.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-converter-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

process.env.TZ = "Europe/Warsaw";

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlConverter, urlCalcIndex } from "../src/site.mjs";
import { CONV_COPY } from "../src/conv-copy.mjs";


const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TZ = "Europe/Warsaw";
const read = (file) => readFileSync(join(ROOT, file), "utf8");

/* The engine, in Node, so this file knows what the page is supposed to be printing
   without keeping a second copy of eighty-two factors. */
/* The module name is the one converter string that stayed in the dictionary: the footer
   link on every page of the site takes its label from the route, and a route label is a
   dictionary key. See the head of src/conv-copy.mjs. */
const { I18N_PAGES } = new Function(`${read("assets/i18n-pages.js")}\nreturn { I18N_PAGES };`)();
const titleOf = (lang) => I18N_PAGES[lang].convpage_title;

const { CONV_CATS, convConvert, convFormat } = new Function(
  `${read("assets/currency.js")}\n${read("assets/converter.js")}\n` +
  "return { CONV_CATS, convConvert, convFormat };")();

/* ------------------------------------------------------------------ the browser */

let chromium;
try {
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
  console.log("test-converter-page: Playwright not installed — skipping the browser tests.");
  console.log("                     See the header of this file for the one-line install.");
  process.exit(0);
}

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
const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const exe = findChromium();
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function context(options) {
  const ctx = await browser.newContext({ timezoneId: TZ, ...options });
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  /* Registered before any script of the page's own, so its DOMContentLoaded listener runs
     before the converter's and captures the result box exactly as the BUILD wrote it. §5
     compares the two. */
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const box = document.querySelector("[data-conv-result]");
      window.__atParse = box ? box.innerHTML : null;
    });
  });

  await page.goto(`${base}/404.html`, { waitUntil: "domcontentloaded" });
  await page.evaluate((lang) => {
    localStorage.clear();
    if (lang) localStorage.setItem("materio-lang", lang);
  }, opts.lang === undefined ? "pl" : opts.lang);

  await page.goto(base + url, { waitUntil: "load" });
  page.errors = errors;
  return page;
}

/**
 * The three things the answer is made of, read off the screen in one go.
 *
 * Read with evaluate() rather than with textContent(), which waits for a selector: when
 * the field holds no number the box has neither an eyebrow nor a big line, and that is
 * exactly the state §6 is about.
 */
const answer = (page) => page.evaluate(() => {
  const box = document.querySelector("[data-conv-result]");
  const text = (sel) => {
    const el = box && box.querySelector(sel);
    return el ? el.textContent.replace(/[\s\u00a0\u202f\u2009]+/g, " ").trim() : "";
  };
  return { eyebrow: text(".eyebrow"), big: text(".big"), err: Boolean(box && box.classList.contains("err")) };
});

/**
 * What the engine says the screen should read, for this language.
 *
 * Both sides go through norm(): Intl groups digits with a non-breaking space in six of
 * the ten languages, and a browser's textContent hands one back while a comparison
 * against a plain space quietly fails on a string that looks identical in the error.
 */
const norm = (s) => String(s).replace(/[\s\u00a0\u202f\u2009]+/g, " ").trim();
const want = (catId, from, to, v, lang = "pl") =>
  norm(`${convFormat(convConvert(catId, from, to, v), lang)} ${to}`);

const PL = urlConverter("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the tool as it opens */

head("1. the page a visitor lands on");
{
  const page = await open(ctx, PL);
  eq("the H1 is the module's name", await page.textContent("h1"), titleOf("pl"));
  eq("the value field opens on 1", await page.inputValue("#conv-value"), "1");
  eq("it opens converting metres", await page.inputValue("#conv-from"), "m");
  eq("into centimetres", await page.inputValue("#conv-to"), "cm");
  eq("the category is length", await page.inputValue("#conv-cat"), "length");

  const a = await answer(page);
  eq("the answer is on the screen", a.big, want("length", "m", "cm", 1));
  eq("and it says what it was computed from", a.eyebrow, "1 m");
  eq("it is not an error", a.err, false);
  eq("nothing on the page threw", page.errors.join(" | "), "");
  await page.close();
}

/* ---------------------------------------------------- 2. it converts as you type */

head("2. typing a number converts it, with no button to press");
{
  const page = await open(ctx, PL);

  await page.fill("#conv-value", "2.5");
  eq("2.5 m is 250 cm", (await answer(page)).big, want("length", "m", "cm", 2.5));

  // A comma is a decimal point on this site, everywhere a number is typed.
  await page.fill("#conv-value", "2,5");
  eq("and so is 2,5 m", (await answer(page)).big, want("length", "m", "cm", 2.5));

  await page.fill("#conv-value", "0");
  eq("zero converts to zero", (await answer(page)).big, want("length", "m", "cm", 0));

  await page.fill("#conv-value", "-3");
  eq("a negative value converts", (await answer(page)).big, want("length", "m", "cm", -3));

  // Changing either unit re-reads the value that is already in the field.
  await page.fill("#conv-value", "1");
  await page.selectOption("#conv-to", "mm");
  eq("1 m is 1000 mm", (await answer(page)).big, want("length", "m", "mm", 1));
  await page.selectOption("#conv-from", "in");
  eq("and an inch is 25.4 mm", (await answer(page)).big, want("length", "in", "mm", 1));
  eq("the eyebrow follows the unit it was asked about", (await answer(page)).eyebrow, "1 in");
  await page.close();
}

/* ---------------------------------------------------- 3. the category picker */

head("3. picking a category rebuilds both lists under it");
{
  const page = await open(ctx, PL);

  for (const cat of CONV_CATS) {
    await page.selectOption("#conv-cat", cat.id);
    const [from, to] = cat.def;
    eq(`${cat.id}: opens on ${from}`, await page.inputValue("#conv-from"), from);
    eq(`${cat.id}: converting into ${to}`, await page.inputValue("#conv-to"), to);

    const options = await page.locator("#conv-from option").allTextContents();
    eq(`${cat.id}: the whole list is offered`,
      options.join(","), cat.units.map(([s]) => s).join(","));
    eq(`${cat.id}: and the same list on the other side`,
      (await page.locator("#conv-to option").allTextContents()).join(","), options.join(","));

    await page.fill("#conv-value", "1");
    eq(`${cat.id}: 1 ${from} converts`, (await answer(page)).big, want(cat.id, from, to, 1));
  }

  // Temperature is the one that a factor cannot express, so it is asked by hand as well:
  // a converter that only multiplied would say 0 °C is 0 °F.
  await page.selectOption("#conv-cat", "temperature");
  await page.fill("#conv-value", "0");
  eq("0 °C is 32 °F", (await answer(page)).big, want("temperature", "°C", "°F", 0));
  await page.fill("#conv-value", "100");
  eq("100 °C is 212 °F", (await answer(page)).big, want("temperature", "°C", "°F", 100));
  await page.selectOption("#conv-to", "K");
  eq("and 373,15 K", (await answer(page)).big, want("temperature", "°C", "K", 100));
  await page.close();
}

/* ---------------------------------------------------- 4. the swap */

head("4. the swap turns the question round");
{
  const page = await open(ctx, PL);
  await page.fill("#conv-value", "2");
  eq("2 m is 200 cm", (await answer(page)).big, want("length", "m", "cm", 2));

  await page.click("[data-conv-swap]");
  eq("the units changed places", await page.inputValue("#conv-from"), "cm");
  eq("both of them", await page.inputValue("#conv-to"), "m");
  eq("and the answer followed", (await answer(page)).big, want("length", "cm", "m", 2));
  eq("the value that was typed is still there", await page.inputValue("#conv-value"), "2");

  await page.click("[data-conv-swap]");
  eq("swapping twice is where it started", (await answer(page)).big, want("length", "m", "cm", 2));
  await page.close();
}

/* ---------------------------------------------------- 5. the live region */

head("5. the answer is announced when it changes, and never on load");
{
  const page = await open(ctx, PL);

  // The whole point of convWrite(): the build already put the right answer in the box, so
  // the run on load must not write it again. Writing identical content into a live region
  // reads it out to somebody who never asked.
  const atParse = await page.evaluate(() => window.__atParse);
  const now = await page.evaluate(() =>
    document.querySelector("[data-conv-result]").innerHTML);
  check("the box holds an answer before any script ran", Boolean(atParse) && atParse.includes("100"));
  eq("and the script did not rewrite it", now, atParse);

  eq("the box is a live region", await page.getAttribute("[data-conv-result]", "role"), "status");

  // …and it does write when the answer really changes.
  await page.fill("#conv-value", "3");
  check("a new answer replaces the old one",
    (await page.evaluate(() => document.querySelector("[data-conv-result]").innerHTML)) !== now);
  await page.close();
}

/* ---------------------------------------------------- 6. nothing to convert */

head("6. a field with no number in it says so");
{
  const page = await open(ctx, PL);

  await page.fill("#conv-value", "");
  let a = await answer(page);
  eq("the box says what to do", a.err, true);
  eq("in this page's language", (await page.textContent("[data-conv-result]")).trim(),
    (await page.evaluate(() => t("conv_bad", document.documentElement.lang))));
  eq("and shows no number", a.big, "");

  await page.fill("#conv-value", "dużo");
  eq("a word is not a number either", (await answer(page)).err, true);

  await page.fill("#conv-value", "4");
  a = await answer(page);
  eq("typing a number clears it", a.err, false);
  eq("and the answer is back", a.big, want("length", "m", "cm", 4));
  await page.close();
}

/* ---------------------------------------------------- 7. ten languages */

head("7. ten languages, each with its own address and its own numbers");
{
  for (const lang of LANGS) {
    const page = await open(ctx, urlConverter(lang), { lang });
    eq(`${lang}: the H1 is the module's name`,
      await page.textContent("h1"), titleOf(lang));
    eq(`${lang}: the document says which language it is in`,
      await page.getAttribute("html", "lang"), lang);

    // A big number is where the languages differ: the digits are the same and the
    // grouping is not, because the number belongs to the language and the unit does not.
    await page.selectOption("#conv-cat", "data");
    await page.fill("#conv-value", "1");
    await page.selectOption("#conv-from", "GiB");
    await page.selectOption("#conv-to", "B");
    const shown = (await answer(page)).big;
    eq(`${lang}: a GiB in bytes`, shown, want("data", "GiB", "B", 1, lang));
    eq(`${lang}: and every digit of it is there`,
      shown.replace(/[^0-9]/g, ""), "1073741824");

    // The categories are the only translated thing on the tool.
    const cats = await page.locator("#conv-cat option").allTextContents();
    eq(`${lang}: the eleven categories are named in this language`,
      cats.join(","), CONV_CATS.map((c) => CONV_COPY[lang][`conv_c_${c.id}`]).join(","));

    eq(`${lang}: nothing threw`, page.errors.join(" | "), "");
    await page.close();
  }
}

/* ---------------------------------------------------- 8. the widths of chapter XXVIII */

head("8. the six widths, phone to desktop");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const c = await context({ viewport: { width, height: width >= 768 ? 900 : 780 } });
    for (const lang of ["pl", "ru"]) {
      const page = await open(c, urlConverter(lang), { lang });
      const wide = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      check(`${lang} at ${width}px: nothing scrolls sideways`, !wide);

      // A converter somebody cannot use on a phone is a converter for a desk.
      await page.fill("#conv-value", "3");
      eq(`${lang} at ${width}px: it still converts`,
        (await answer(page)).big, want("length", "m", "cm", 3, lang));
      await page.close();
    }
    await c.close();
  }
}

/* ---------------------------------------------------- 9. with no script at all */

head("9. with no JavaScript — the page still answers a question");
{
  const c = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await c.newPage();
  await page.goto(base + PL, { waitUntil: "load" });

  eq("the page is there", await page.textContent("h1"), titleOf("pl"));
  eq("the worked answer is on the screen", (await answer(page)).big, want("length", "m", "cm", 1));

  // The inventory is what this page has to say to a crawler and to a reader with no
  // script: eleven categories and every unit under them.
  const text = await page.textContent("main");
  for (const cat of CONV_CATS) {
    check(`${cat.id}: its units are readable`, text.includes(cat.units.map(([s]) => s).join(", ")));
  }
  await page.close();
  await c.close();
}

/* ---------------------------------------------------- 10. how somebody gets here */

head("10. the site points at the page");
{
  const hub = await open(ctx, urlCalcIndex("pl"));
  const link = hub.locator(`main a[href="${PL}"]`);
  eq("the calculator hub offers it", await link.count(), 1);
  eq("and it is visible", await link.first().isVisible(), true);

  // Not inside the filtered list, whose counter says how many of the fifteen calculators
  // are showing — a sixteenth row would make that number wrong.
  eq("it is outside the filtered list",
    await hub.locator(`#calc-hub a[href="${PL}"]`).count(), 0);
  await hub.click(`main a[href="${PL}"]`);
  await hub.waitForURL(`**${PL}`);
  eq("clicking it opens the converter", await hub.textContent("h1"), titleOf("pl"));
  await hub.close();

  const page = await open(ctx, PL);
  eq("the footer offers it on every page",
    await page.locator(`footer.site a[href="${PL}"]`).first().isVisible(), true);
  await page.close();
}

/* ------------------------------------------------------------------ the result */

await ctx.close();
await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`converter page: ${passed}/${passed} checks pass`);
