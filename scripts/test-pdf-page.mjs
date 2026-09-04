#!/usr/bin/env node
/**
 * LiczMat — the PDF export of a project, clicked through in a real browser.
 *
 *     node scripts/test-pdf-page.mjs
 *
 * Session 59, the second half of item **C6**. The logic half is scripts/test-pdf.mjs and
 * needs nothing installed; this is the half only a browser can answer — that the
 * configurator the build wrote is wired, that the document fills with the project's own
 * figures, that the investor block appears only for the investor estimate, and that the
 * page comes back afterwards.
 *
 * **The print dialog is never opened.** `window.print()` blocks in a headless browser and
 * would hang the suite, so it is replaced by a spy before the click: what is under test is
 * the document that would be printed and the flag that hides the rest of the page, not
 * Chromium's own dialog.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-pdf-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlProjects } from "../src/site.mjs";

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
  console.log("test-pdf-page: Playwright not installed — skipping the browser tests.");
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
  if (opts.level) plant["liczmat-signed-in"] = opts.level;
  /* Every price on these screens, and the PDF export, became LiczMat Pro on 2026-09-03:
     `costs` and `pdf` are PRO in LM_FEATURES, so a guest gets chapter XXV’s wall where the
     amounts used to be. A test that is about the priced behaviour has to say which level
     it is testing, and it says it the way scripts/test-quotes-page.mjs already does:
     `liczmat-signed-in` is what assets/paywall.js reads (lmReadLevel()) and "pro" is what
     a real Pro account writes there. `pro: false` looks at the wall instead — and there is
     a section below that does exactly that, so the free half stays covered too. */
  if (opts.pro !== false && !opts.level) plant["liczmat-signed-in"] = "pro";
  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);
  await page.goto(base + url, { waitUntil: "load" });
  page.errors = errors;
  return page;
}


/* ------------------------------------------------------------------ the fixture */

const T0 = Date.UTC(2026, 7, 1);
const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });

/**
 * One project with money in all three places wsProjectCosts() counts it: a material on the
 * shopping list, a calculation nothing on that list came from, and a hand-typed cost.
 * The document has to add up to the same total the screen above it shows.
 */
const WORKSPACE = {
  projects: [{ id: "p1", name: "Łazienka Kowalski", archived: false, ...sync(T0) }],
  rooms: [],
  estimations: [
    {
      id: "e1", projectId: "p1", name: "Gres 60×60", calculationType: "SURFACE_WASTE",
      materialCategory: "TILES", requiredUnits: 15, unitLabel: "opak.",
      totalCostMinor: 74985, wastePercentage: 7, wasteCostMinor: 4900,
      currencyCode: "PLN", inputJson: "{}", ...sync(T0),
    },
    {
      id: "e2", projectId: "p1", name: "Klej C2", calculationType: "SURFACE_COVERAGE",
      materialCategory: "CHEMICALS", requiredUnits: 6, unitLabel: "worki",
      totalCostMinor: 21000, wastePercentage: 0, wasteCostMinor: 0,
      currencyCode: "PLN", inputJson: "{}", ...sync(T0),
    },
    {
      id: "e3", projectId: "p1", name: "Wywóz gruzu", calculationType: "SURFACE_COVERAGE",
      materialCategory: "OTHER", requiredUnits: 1, unitLabel: "",
      totalCostMinor: 30000, wastePercentage: 0, wasteCostMinor: 0,
      currencyCode: "PLN", inputJson: JSON.stringify({ manual: true }), ...sync(T0),
    },
  ],
  // The material carries the same money as e1, so counting both whole would double the bill.
  shoppingItems: [{
    id: "s1", projectId: "p1", estimationId: "e1", name: "Gres 60×60",
    materialCategory: "TILES", quantity: 15, unit: "opak.", estimatedCostMinor: 74985,
    currencyCode: "PLN", isPurchased: false, note: "", ...sync(T0),
  }],
};

/** 749,85 + 210,00 + 300,00 — the shopping list, the unpriced calculation, the typed cost. */
const TOTAL_MINOR = 74985 + 21000 + 30000;

const ctx = await context();
const URL_PL = `${urlProjects("pl")}?id=p1`;

/** Open the project with the workspace planted, and stop print() from blocking. */
async function openProject(lang = "pl") {
  const page = await open(ctx, lang === "pl" ? URL_PL : `${urlProjects(lang)}?id=p1`, {
    lang, storage: { "materio-workspace-v1": JSON.stringify(WORKSPACE) },
  });
  await page.evaluate(() => {
    window.__printed = 0;
    window.__printFlag = null;
    window.print = () => { window.__printed++; window.__printFlag = document.body.dataset.pdfPrint || null; };
  });
  await page.waitForSelector("#ws-pdf-form");
  return page;
}

/**
 * Open one of the configurator's disclosures.
 *
 * They ship closed, which is the point of them — the form has twelve controls and a
 * tradesperson printing a plain report touches none of the investor ones. So a test that
 * types into one has to open it first, exactly as a person does.
 */
async function openDetails(page, selector) {
  const el = await page.$(selector);
  if (!el) return false;
  const already = await el.evaluate((e) => e.open);
  if (!already) await el.evaluate((e) => { e.open = true; });
  return true;
}

/** Every disclosure that is on the screen, opened. */
async function openAll(page) {
  await page.$$eval("#ws-pdf-form details", (els) => els.forEach((e) => { if (!e.hidden) e.open = true; }));
  await page.waitForTimeout(60);
}

const docText = (page) => page.$eval("#ws-pdf-doc", (e) => e.textContent.replace(/\s+/g, " ").trim());
const shown = (page, row) => page.$eval(`#ws-pdf-doc [data-pdf-row="${row}"]`, (e) => !e.hidden);

/* ================================================================== 1. the block */

head("1. the configurator is on the project screen");
{
  const page = await openProject();
  check("the form is there", Boolean(await page.$("#ws-pdf-form")));
  check("and the document too", Boolean(await page.$("#ws-pdf-doc")));
  check("the document starts hidden", await page.$eval("#ws-pdf-doc", (e) => e.hidden));
  // `open()` plants a Pro session by default (see the note above it) — section 9 below is
  // the guest/free counterpart, and this is the half it mirrors: the configurator itself
  // is what a Pro session sees, not the wall.
  eq("the configurator is unlocked, not walled off", await page.locator("#pdf-tool").isHidden(), false);
  eq("and no wall is drawn in front of it", await page.locator("#pdf-gate").isHidden(), true);
  check("the investor block is closed while a technical report is chosen",
    await page.$eval("[data-pdf-investor]", (e) => e.hidden));
  // Every disclosure ships closed: the form has twelve controls and a plain report needs
  // none of the investor ones. One is opened here by clicking its summary, which is what
  // a person does; the rest of this file opens them directly.
  check("a disclosure opens when its summary is clicked",
    await (async () => {
      await page.click("#ws-pdf-form details:first-of-type summary");
      await page.waitForTimeout(80);
      return page.$eval("#ws-pdf-form details:first-of-type", (e) => e.open);
    })());
  check("and the checkbox inside it is reachable",
    await page.$eval('[data-pdf-opt="quantities"]', (e) => e.offsetParent !== null));
  eq("no script errored", page.errors.join(" | "), "");
  await page.close();
}

head("1b. choosing the investor estimate opens its block, and going back closes it");
{
  const page = await openProject();
  await page.check('input[name="pdf-type"][value="investor"]');
  await page.waitForTimeout(60);
  check("open", !(await page.$eval("[data-pdf-investor]", (e) => e.hidden)));
  await page.check('input[name="pdf-type"][value="technical"]');
  await page.waitForTimeout(60);
  check("and closed again", await page.$eval("[data-pdf-investor]", (e) => e.hidden));
  await page.close();
}

/* ================================================================== 2. the technical report */

head("2. the technical report prints the project");
{
  const page = await openProject();
  await page.click("#ws-pdf-form button[type=submit]");
  await page.waitForTimeout(120);

  eq("the browser was asked to print once", await page.evaluate(() => window.__printed), 1);
  eq("with the rest of the page taken out of the way",
    await page.evaluate(() => window.__printFlag), "1");
  // The dialog is stubbed, so `afterprint` has to be fired by hand — that is the path a
  // real browser takes, and the timer in §6 is only the belt for the ones that never do.
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.waitForTimeout(40);
  eq("and the flag is gone the moment the dialog closes",
    await page.evaluate(() => document.body.dataset.pdfPrint || null), null);

  const text = await docText(page);
  check("the project is named", text.includes("Łazienka Kowalski"), text.slice(0, 120));
  check("every row is on it",
    text.includes("Gres 60×60") && text.includes("Klej C2") && text.includes("Wywóz gruzu"));
  check("the total is the project's own", /1259,85/.test(text), text.slice(-200));
  // The waste of a PRICED calculation, which is printed as its material: carrying it over
  // is the difference between a technical report and a shopping list. The first run of
  // this file found it lost — every material anybody had priced came out with no waste.
  check("the waste behind a number is shown, because that is what makes it technical",
    text.includes("7 %"), text.slice(0, 200));
  check("and the waste total is the calculation's own, not zero",
    /49,00/.test(text), text.slice(-260));
  check("and no pricing block", !(await shown(page, "pricing")));

  const rows = await page.$$eval("#ws-pdf-doc tbody tr", (els) => els.length);
  eq("three rows, each amount counted once", rows, 3);
  await page.close();
}

head("2b. the total on the document is the total on the screen");
{
  const page = await openProject();
  const onScreen = await page.$eval("#ws-project-total", (e) => e.textContent.trim());
  await page.click("#ws-pdf-form button[type=submit]");
  await page.waitForTimeout(120);
  const onPaper = await page.$eval('#ws-pdf-doc [data-pdf="total"]', (e) => e.textContent.trim());
  eq("the same figure, to the character", onPaper, onScreen);
  check("and it is the fixture's own", onPaper.includes("1259,85"), onPaper);
  eq("which is what wsProjectCosts() says", TOTAL_MINOR, 125985);
  await page.close();
}

/* ================================================================== 3. the investor estimate */

head("3. the investor estimate layers labour, margin and VAT");
{
  const page = await openProject();
  await page.check('input[name="pdf-type"][value="investor"]');
  await page.waitForTimeout(60);
  await openAll(page);
  for (const name of ["labor", "margin", "vat"]) {
    await page.check(`[data-pdf-opt="${name}"]`);
  }
  await page.fill('[data-pdf-in="laborHours"]', "40");
  await page.fill('[data-pdf-in="laborRate"]', "80");
  await page.fill('[data-pdf-in="marginPercent"]', "10");
  await page.fill('[data-pdf-in="vatPercent"]', "23");
  await page.click("#ws-pdf-form button[type=submit]");
  await page.waitForTimeout(150);

  check("the pricing block is on the document", await shown(page, "pricing"));
  const read = (k) => page.$eval(`#ws-pdf-doc [data-pdf="${k}"]`, (e) => e.textContent.trim());
  check("materials are the project's total", (await read("materialsNet")).includes("1259,85"));
  check("labour is 40 × 80", (await read("labor")).includes("3200,00"));
  // 10 % of 1259,85 + 3200,00 = 445,985, rounded once, as the Kotlin rounds once.
  check("the margin is a percentage of both", (await read("margin")).includes("445,99"), await read("margin"));
  check("the net is everything above it", (await read("net")).includes("4905,84"), await read("net"));
  check("the VAT is 23 % of the net", (await read("vat")).includes("1128,34"), await read("vat"));
  check("and the gross is the two together", (await read("gross")).includes("6034,18"), await read("gross"));

  // A technical report shows the waste; an investor estimate does not — it is a price, not
  // a working. Same split the app's exporter makes.
  check("no waste line on an investor estimate", !(await shown(page, "waste")));
  eq("no script errored", page.errors.join(" | "), "");
  await page.close();
}

head("3b. a layer switched off contributes nothing and the chain still holds");
{
  const page = await openProject();
  await page.check('input[name="pdf-type"][value="investor"]');
  await page.waitForTimeout(60);
  await openAll(page);
  await page.check('[data-pdf-opt="vat"]');
  await page.fill('[data-pdf-in="vatPercent"]', "8");
  await page.click("#ws-pdf-form button[type=submit]");
  await page.waitForTimeout(150);

  check("the labour row is not printed", !(await shown(page, "labor")));
  check("nor the margin", !(await shown(page, "marginRow")));
  // Nothing was layered on, so there is no meaningful subtotal to print between the two.
  check("nor a net total", !(await shown(page, "net")));
  check("the VAT is 8 % of the materials",
    (await page.$eval('#ws-pdf-doc [data-pdf="vat"]', (e) => e.textContent)).includes("100,79"));
  await page.close();
}

/* ================================================================== 4. the options */

head("4. every option changes the document");
{
  const page = await openProject();
  await openAll(page);
  await page.uncheck('[data-pdf-opt="prices"]');
  await page.uncheck('[data-pdf-opt="total"]');
  await page.uncheck('[data-pdf-opt="date"]');
  await page.check('[data-pdf-opt="contractor"]');
  await page.fill('[data-pdf-in="company"]', "Kowalski Remonty");
  await page.fill('[data-pdf-in="phone"]', "600 100 200");
  await page.check('[data-pdf-opt="estimateNumber"]');
  await page.fill('[data-pdf-in="estimateNumber"]', "12/2026");
  await page.check('[data-pdf-opt="notes"]');
  await page.fill('[data-pdf-in="notesText"]', "Materiał kupuje inwestor.");
  await page.click("#ws-pdf-form button[type=submit]");
  await page.waitForTimeout(150);

  const text = await docText(page);
  check("no prices when they are switched off", !/749,85/.test(text), text.slice(0, 200));
  check("no total either", !(await shown(page, "total")));
  check("no date", !(await shown(page, "date")));
  check("the contractor is on it", text.includes("Kowalski Remonty") && text.includes("600 100 200"));
  check("the estimate number too", text.includes("12/2026"));
  check("and the note", text.includes("Materiał kupuje inwestor."));
  // A column with nothing under it promises a figure that is not there.
  check("the value column is taken out of the header",
    await page.$eval('#ws-pdf-doc [data-pdf-col="value"]', (e) => e.hidden));
  await page.close();
}

/* ================================================================== 5. languages */

head("5. ten languages, and no key on any of them");
{
  for (const lang of LANGS) {
    const page = await openProject(lang);
    await page.check('input[name="pdf-type"][value="investor"]');
    await openAll(page);
    await page.check('[data-pdf-opt="vat"]');
    await page.click("#ws-pdf-form button[type=submit]");
    await page.waitForTimeout(120);
    const text = await docText(page);
    check(`${lang}: the document is written`, text.length > 60);
    check(`${lang}: no key is printed`, !/\b(pdf_[a-z_]+|pdfdoc_[a-z_]+)\b/.test(text), text.slice(0, 80));
    check(`${lang}: and no undefined`, !text.includes("undefined"), text.slice(0, 80));
    check(`${lang}: the project is named`, text.includes("Łazienka Kowalski"));
    eq(`${lang}: no script errored`, page.errors.join(" | "), "");
    await page.close();
  }
}

/* ================================================================== 6. the page comes back */

head("6. printing does not leave the page hidden");
{
  const page = await openProject();
  await page.click("#ws-pdf-form button[type=submit]");
  await page.waitForTimeout(1400);
  eq("the flag is gone", await page.evaluate(() => document.body.dataset.pdfPrint || null), null);
  check("the document is hidden again", await page.$eval("#ws-pdf-doc", (e) => e.hidden));
  // The project screen is still usable: this is the check that a browser which never fires
  // `afterprint` does not leave somebody looking at a blank page.
  check("and the project screen is still there",
    await page.$eval("#ws-project-total", (e) => e.textContent.trim().length > 0));
  await page.close();
}

/* ================================================================== 7. the widths */

head("7. chapter XXVIII's widths");
{
  const page = await openProject();
  await openAll(page);
  for (const width of [320, 375, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(220);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(`${width} px: nothing scrolls sideways`, !over);
    const bad = await page.$$eval("#ws-pdf-form input, #ws-pdf-form select, #ws-pdf-form textarea",
      (els) => els
        .filter((e) => e.offsetParent !== null && e.type !== "checkbox" && e.type !== "radio")
        .filter((e) => {
          const s = getComputedStyle(e);
          return parseFloat(s.fontSize) < 16 || e.getBoundingClientRect().height < 44;
        })
        .map((e) => e.dataset.pdfIn || e.type));
    check(`${width} px: every field is 16 px of text in a 44 px box`, bad.length === 0, bad.join(", "));
  }
  await page.close();
}

/* ------------------------------------------------- the export belongs to LiczMat Pro */

/**
 * The owner's decision of 2026-09-03: a guest and a free account never produce a PDF.
 *
 * Every section above runs at the Pro level, which is what `open()` plants. This one runs
 * at the two levels that do not reach the export and asks three things: that the wall is
 * what stands there (never a dead control), that the configurator cannot be reached, and
 * that the document itself is empty — not built and hidden, but never built.
 */
head("9. a guest and a free account cannot produce the document");
for (const level of [undefined, "liczmat"]) {
  const who = level || "guest";
  const page = await open(ctx, URL_PL, {
    pro: false, level, storage: { "materio-workspace-v1": JSON.stringify(WORKSPACE) },
  });
  await page.evaluate(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
  });
  await page.waitForSelector("#pdf-gate");

  eq(`${who}: the configurator is shut`, await page.locator("#pdf-tool").isHidden(), true);
  eq(`${who}: and the wall is what stands there`,
    await page.locator("#pdf-gate").isHidden(), false);
  eq(`${who}: the wall names the export rather than leaving a bare heading`,
    (await page.innerText("#pdf-gate")).length > 20, true);
  eq(`${who}: the rung offered is the right one`,
    await page.locator(`#pdf-gate [data-pw-step="${level ? "upgrade" : "account"}"]`)
      .first().isHidden(), false);

  /* The form is in the markup, hidden. Submitting it anyway — which is what a script, or
     a devtools console, can still do — has to produce nothing: no document, no print. */
  await page.evaluate(() => {
    const form = document.getElementById("ws-pdf-form");
    if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  eq(`${who}: submitting the hidden form prints nothing`,
    await page.evaluate(() => window.__printed), 0);
  eq(`${who}: the document stays hidden`,
    await page.locator("#ws-pdf-doc").isHidden(), true);
  eq(`${who}: and empty — no row was ever written into it`,
    await page.$eval('#ws-pdf-doc [data-pdf="rows"]', (n) => n.innerHTML.trim()), "");
  eq(`${who}: no total either`,
    await page.$eval('#ws-pdf-doc [data-pdf="total"]', (n) => n.textContent.trim()), "");
  check(`${who}: and no amount anywhere inside it`,
    !/\d[\d\s., ]*(zł|PLN)/i.test(await page.$eval("#ws-pdf-doc", (n) => n.textContent)),
    await page.$eval("#ws-pdf-doc", (n) => n.textContent.replace(/\s+/g, " ").slice(0, 160)));
  check(`${who}: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\npdf page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
