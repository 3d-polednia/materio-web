#!/usr/bin/env node
/**
 * LiczMat — /moje-materialy/ clicked through in a real browser.
 *
 *     node scripts/test-own-materials-page.mjs
 *
 * Session 59, item **C6** of the parity audit. The logic half is
 * scripts/test-own-materials.mjs and needs nothing installed; this is the half only a
 * browser can answer — that the form the build wrote is wired, that the five field groups
 * swap with the application, that a price typed into a row lands in the history, and that
 * the undo strip gives a deleted material back.
 *
 * **Nothing is stubbed.** The page loads no Firebase: the rows are this browser's own, in
 * localStorage, which is what makes the screen work signed out. So the test starts with an
 * empty browser and produces every row by clicking.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-own-materials-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlOwnMaterials } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  console.log("test-own-materials-page: Playwright not installed — skipping the browser tests.");
  console.log("                        See the header of this file for the one-line install.");
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


/* ------------------------------------------------------------------ the browser, once */

/** A context that cannot leave the machine: the analytics tag is not under test. */
async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}


/** Open the page in a browser that has never seen it, with the language chosen. */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const plant = { "materio-lang": opts.lang === undefined ? "pl" : opts.lang, ...(opts.storage || {}) };
  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);
  await page.goto(base + url, { waitUntil: "load" });
  page.errors = errors;
  return page;
}

/** Fill the "new material" form and submit it. */
async function addMaterial(page, fields) {
  for (const [name, value] of Object.entries(fields)) {
    const sel = `[data-omat-form] [data-omat-in="${name}"]`;
    const el = await page.$(sel);
    if (!el) continue;
    const tag = await el.evaluate((n) => n.tagName);
    if (tag === "SELECT") await el.selectOption(String(value));
    else await el.fill(String(value));
  }
  await page.click("[data-omat-form] button[type=submit]");
  await page.waitForTimeout(60);
}

const rows = (page) => page.$$eval("[data-omat-row]", (els) => els.map((e) => e.dataset.omatRow));
const names = (page) => page.$$eval("[data-omat-row] h3", (els) => els.map((e) => e.textContent.trim()));
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-materials-v1") || "null"));

const ctx = await context();
const PL = urlOwnMaterials("pl");

/* ================================================================== 1. an empty browser */

head("1. a browser that has never been here");
{
  const page = await open(ctx, PL);
  eq("no rows", (await rows(page)).length, 0);
  check("the empty state is on the screen",
    await page.$eval("[data-omat-empty]", (e) => !e.hidden));
  check("the form is there before any script ran on it",
    Boolean(await page.$("[data-omat-form]")));
  check("nothing was written to storage by merely opening it", (await store(page)) === null);
  eq("and no script errored", page.errors.join(" | "), "");
  await page.close();
}

/* ================================================================== 2. adding one */

head("2. a material typed in by hand");
{
  const page = await open(ctx, PL);
  await addMaterial(page, {
    name: "Gres od Kowalskiego 60×60",
    application: "WALL_FLOOR_COVERING",
    widthMm: "600", lengthMm: "600", packageAreaM2: "1,44", wastePercent: "7",
    priceMajor: "45,99",
  });

  eq("one row", (await rows(page)).length, 1);
  eq("with its name on it", (await names(page))[0], "Gres od Kowalskiego 60×60");
  check("the empty state is gone", await page.$eval("[data-omat-empty]", (e) => e.hidden));

  const saved = (await store(page)).materials[0];
  eq("the price is minor units", saved.priceMinor, 4599);
  eq("a comma was read as a decimal point", saved.packageAreaM2, 1.44);
  eq("the currency in force stamped it", saved.currencyCode, "PLN");
  eq("and the first price seeded the history", saved.prices.length, 1);

  check("the amount is on the screen in that currency",
    /45,99/.test(await page.$eval("[data-omat-row] .omat-price", (e) => e.textContent)));

  // The form empties itself, or the next material is typed on top of the last one.
  eq("the name field is empty again",
    await page.$eval('[data-omat-form] [data-omat-in="name"]', (e) => e.value), "");
  eq("no script errored", page.errors.join(" | "), "");
  await page.close();
}

head("2b. a material with no name is refused, out loud");
{
  const page = await open(ctx, PL);
  await addMaterial(page, { name: "   " });
  eq("nothing was added", (await rows(page)).length, 0);
  check("and the refusal is on the screen",
    await page.$eval("[data-omat-err]", (e) => !e.hidden && e.textContent.trim().length > 0));
  // A screen reader hears it because the element is a live region, not because it is red.
  eq("in a live region", await page.$eval("[data-omat-err]", (e) => e.getAttribute("role")), "alert");
  await page.close();
}

/* ================================================================== 3. the field groups */

head("3. the five field groups swap with the application");
{
  const page = await open(ctx, PL);
  const shown = () => page.$$eval("[data-omat-group]",
    (els) => els.filter((e) => !e.hidden).map((e) => e.dataset.omatGroup));

  eq("one group is open on load", (await shown()).length, 1);
  eq("and it is the first", (await shown())[0], "WALL_FLOOR_COVERING");

  await page.selectOption('[data-omat-form] [data-omat-in="application"]', "LINEAR_STOCK");
  await page.waitForTimeout(40);
  eq("choosing a profile shows the profile's fields", (await shown()).join(), "LINEAR_STOCK");

  /* Three of the five groups have a width and three have a length, so the same
     `data-omat-in` name is in the document more than once. Reading them all means the last
     one in the DOM wins — whichever group happens to be furthest down rather than the one
     somebody typed into — so a width typed into the covering group and then abandoned must
     not follow the visitor into the profile they actually saved. This is the browser half
     of that: the covering's width is filled first, while it is the visible group. */
  await page.selectOption('[data-omat-form] [data-omat-in="application"]', "WALL_FLOOR_COVERING");
  await page.waitForTimeout(40);
  await page.fill('[data-omat-group="WALL_FLOOR_COVERING"] [data-omat-in="widthMm"]', "600");
  await page.selectOption('[data-omat-form] [data-omat-in="application"]', "LINEAR_STOCK");
  await page.waitForTimeout(40);
  await addMaterial(page, { name: "Profil CD" });
  await page.fill('[data-omat-group="LINEAR_STOCK"] [data-omat-in="lengthMm"]', "3000");
  await page.fill('[data-omat-group="LINEAR_STOCK"] [data-omat-in="kerfMm"]', "3");
  await page.fill('[data-omat-form] [data-omat-in="name"]', "Profil CD");
  await page.click("[data-omat-form] button[type=submit]");
  await page.waitForTimeout(60);
  const saved = (await store(page)).materials.find((m) => m.lengthMm === 3000) || {};
  eq("the profile kept its length", saved.lengthMm, 3000);
  eq("and its kerf", saved.kerfMm, 3);
  eq("but not a width the application does not use", saved.widthMm, null);
  eq("nor a package area", saved.packageAreaM2, null);
  await page.close();
}

/* ================================================================== 4. the price history */

head("4. a price typed onto a row lands in the history");
{
  const page = await open(ctx, PL);
  await addMaterial(page, { name: "Klej C2", application: "COATING", coveragePerUnitM2: "5", priceMajor: "39,99" });

  await page.fill("[data-omat-row] [data-omat-newprice]", "45,99");
  await page.click("[data-omat-row] [data-omat-save-price]");
  await page.waitForTimeout(60);

  const saved = (await store(page)).materials[0];
  eq("two points", saved.prices.length, 2);
  eq("the newest is the one just typed", saved.prices[0].priceMinor, 4599);
  eq("the material carries it", saved.priceMinor, 4599);

  const history = await page.$$eval(".omat-hist li", (els) => els.map((e) => e.textContent.trim()));
  eq("both are on the screen", history.length, 2);
  check("newest first", /45,99/.test(history[0]) && /39,99/.test(history[1]));

  const trend = await page.$eval(".omat-trend", (e) => e.textContent.trim());
  check("and the trend says which way it went", trend.length > 0 && /6,00/.test(trend), trend);
  eq("no script errored", page.errors.join(" | "), "");
  await page.close();
}

/* ================================================================== 5. delete and undo */

head("5. the delete is a tombstone, and the undo gives it back");
{
  const page = await open(ctx, PL);
  await addMaterial(page, { name: "Zaprawa", application: "COATING", coveragePerUnitM2: "4", priceMajor: "20" });
  await page.click("[data-omat-row] [data-omat-delete]");
  await page.waitForTimeout(60);

  eq("the row is gone", (await rows(page)).length, 0);
  check("the strip offers it back",
    await page.$eval("[data-omat-undo]", (e) => !e.hidden));
  eq("and it is a live region",
    await page.$eval("[data-omat-undo]", (e) => e.getAttribute("role")), "status");
  const raw = await store(page);
  check("the row is still in storage, tombstoned", Boolean(raw.materials[0].deletedAt));

  await page.click("[data-omat-undo-go]");
  await page.waitForTimeout(60);
  eq("the undo brings it back", (await rows(page)).length, 1);
  eq("with its history", (await store(page)).materials[0].prices.length, 1);
  check("and the strip is gone", await page.$eval("[data-omat-undo]", (e) => e.hidden));
  await page.close();
}

/* ================================================================== 6. the picker */

head("6. an own material is offered in a calculator, beside the catalogue");
{
  const page = await open(ctx, PL);
  await addMaterial(page, {
    name: "Gres od Kowalskiego 60×60", application: "WALL_FLOOR_COVERING",
    packageAreaM2: "1,44", wastePercent: "7",
  });

  // The waste calculator is the one a covering fills. The store travels in localStorage,
  // so the calculator page picks it up with nothing planted by hand.
  await page.goto(`${base}/kalkulatory/plytki-panele-gres/`, { waitUntil: "load" });
  await page.click("[data-mat-open]");
  await page.waitForTimeout(120);
  const listed = await page.$$eval("#mat-list [data-mat]", (els) => els.map((e) => e.textContent.trim()));
  check("it is in the picker", listed.some((x) => x.includes("Gres od Kowalskiego")), listed.slice(0, 3).join(" | "));

  await page.click('#mat-list [data-mat*="own-"]');
  await page.waitForTimeout(150);
  const cov = await page.$eval('[data-k="cov"]', (e) => e.value);
  const waste = await page.$eval('[data-k="waste"]', (e) => e.value);
  eq("choosing it fills the package area", cov, "1.44");
  eq("and the allowance", waste, "7");
  check("and the page says which material went in",
    /Kowalskiego/.test(await page.$eval("[data-mat-chosen]", (e) => e.textContent)));
  await page.close();
}

/* ================================================================== 7. languages */

head("7. ten languages, with a row on the screen in each");
{
  /* Planted rather than clicked, because what is under test here is the language and not
     the form. A row HAS to be on the screen: the five application names and the six field
     labels are build-time copy (src/omat-copy.mjs), so a script that reached for them
     through t() prints the key — and the first run of this file found exactly that,
     `omat_app_WALL_FLOOR_COVERING`, in a paragraph a visitor reads. An empty page cannot
     show it. This is session 41's defect with a new name and this is its net. */
  const planted = JSON.stringify({
    materials: [{
      id: "m-1", name: "Gres od Kowalskiego", category: "TILES",
      application: "WALL_FLOOR_COVERING",
      widthMm: 600, lengthMm: 600, kerfMm: null, coveragePerUnitM2: null,
      packageAreaM2: 1.44, wastePercent: 7,
      priceMinor: 4599, currencyCode: "PLN", priceUpdatedAt: 1756000000000,
      prices: [
        { priceMinor: 4599, currencyCode: "PLN", recordedAt: 1756000000000 },
        { priceMinor: 3999, currencyCode: "PLN", recordedAt: 1755000000000 },
      ],
      createdAt: 1755000000000, updatedAt: 1756000000000, deletedAt: null, schemaVersion: 1,
    }],
  });
  for (const lang of LANGS) {
    const page = await open(ctx, urlOwnMaterials(lang), {
      lang, storage: { "liczmat-materials-v1": planted },
    });
    eq(`${lang}: the row is drawn`, (await rows(page)).length, 1);
    const spec = await page.$eval("[data-omat-row] .omat-spec", (e) => e.textContent.trim());
    check(`${lang}: the spec is words, not keys`, spec.length > 0 && !/omat_/.test(spec), spec);
    const app = await page.$eval("[data-omat-row] p.muted", (e) => e.textContent.trim());
    check(`${lang}: the application is named`, app.length > 0 && !/^[A-Z_]+$/.test(app), app);
    const summary = await page.$eval(".omat-hist-box summary", (e) => e.textContent.trim());
    check(`${lang}: the history has a heading`, summary.length > 0, summary);
    check(`${lang}: the trend is written`,
      /\S/.test(await page.$eval(".omat-trend", (e) => e.textContent)));
    eq(`${lang}: the document says so`,
      await page.$eval("html", (e) => e.getAttribute("lang")), lang);
    const h1 = await page.$eval("h1", (e) => e.textContent.trim());
    check(`${lang}: the heading is written`, h1.length > 0 && !/^omat/.test(h1), h1);
    const text = await page.$eval("main", (e) => e.textContent);
    check(`${lang}: no key is printed`, !/\bomat_[a-z_]+/.test(text));
    check(`${lang}: and no undefined`, !text.includes("undefined"));
    eq(`${lang}: no script errored`, page.errors.join(" | "), "");
    await page.close();
  }
}

/* ================================================================== 8. the widths */

head("8. chapter XXVIII's widths");
{
  const page = await open(ctx, PL);
  await addMaterial(page, { name: "Gres 60×60", packageAreaM2: "1,44", wastePercent: "7", priceMajor: "45,99" });
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    /* Two frames and then the settle the mobile suite uses. A resize is not a paint: the
       first run of this file measured a field mid-reflow and reported it under 44 px at a
       different width on each run, which is a test about timing rather than about the
       page. scripts/test-mobile.mjs sidesteps it by opening the page fresh at each width;
       this one resizes, because the row on the screen has to survive the resize. */
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(220);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(`${width} px: nothing scrolls sideways`, !over);
    // Every field is 16 px of text in a 44 px box, or iOS Safari zooms the page on focus.
    const bad = await page.$$eval("main input, main select, main textarea", (els) => els
      .filter((e) => e.offsetParent !== null && e.type !== "checkbox" && e.type !== "radio")
      .filter((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.fontSize) < 16 || e.getBoundingClientRect().height < 44;
      })
      .map((e) => e.dataset.omatIn || e.name || e.type));
    check(`${width} px: every field is 16 px of text in a 44 px box`, bad.length === 0, bad.join(", "));
  }
  await page.close();
}

/* ================================================================== 9. no JavaScript */

head("9. with no JavaScript");
{
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + PL, { waitUntil: "domcontentloaded" });
  const text = await page.$eval("main", (e) => e.textContent);
  check("the page still says what it is for", text.length > 200);
  check("the form is there", Boolean(await page.$("[data-omat-form]")));
  check("the empty state reads as empty rather than broken",
    await page.$eval("[data-omat-empty]", (e) => e.textContent.trim().length > 0));
  // The document is the same one a crawler reads, so it must not be a key or a blank.
  check("and no key is printed", !/\bomat_[a-z_]+/.test(text));
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nown materials page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
