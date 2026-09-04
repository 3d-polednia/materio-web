#!/usr/bin/env node
/**
 * LiczMat — what a project costs, in a real browser.
 *
 *     node scripts/test-costs-page.mjs
 *
 * Master plan, session 19, in the half that needs a browser: chapter XVII clicked through —
 * a material priced per unit ("Klej | 7 × 35 PLN | = 245 PLN"), a cost nothing calculated
 * typed in beside it, and the three figures at the top of the project moving with both —
 * plus the four languages, the currency switch, the widths chapter XXVIII names and the
 * no-script variant. The pure-logic half is scripts/test-costs.mjs and needs nothing
 * installed.
 *
 * **Nothing is stubbed.** /projekty/ and the calculators touch no network: the project, its
 * materials and its costs are localStorage in the Firestore document shape, and they get
 * there without an account (FIRESTORE_SYNC §1.2). So the test opens the real pages, clicks
 * what a visitor clicks, and reads both what was drawn and what went into storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-costs-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlProjects, urlCalc } from "../src/site.mjs";

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
  console.log("test-costs-page: Playwright not installed — skipping the browser tests.");
  console.log("                 See the header of this file for the one-line install.");
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

/* ------------------------------------------------------------------ the fixture */

const DAY = 86400e3;
const T0 = Date.UTC(2026, 6, 1);

/**
 * A project with chapter XVI's own shopping list on it — tiles, adhesive, grout — and the
 * two calculations that put the first two there. Amounts are what the calculators produced:
 * 15 × 49,99 and 7 × 30,00.
 */
function fixture() {
  const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });
  const item = (id, projectId, estimationId, name, cat, qty, unit, minor, at, currencyCode = "PLN") => ({
    id, projectId, estimationId, name, materialCategory: cat, quantity: qty, unit,
    estimatedCostMinor: minor, currencyCode, isPurchased: false, note: "", ...sync(at),
  });
  const line = (id, projectId, name, units, unit, minor, at, inputJson = "{}") => ({
    id, projectId, name, calculationType: "SURFACE_COVERAGE", materialCategory: "TILES",
    requiredUnits: units, unitLabel: unit, totalCostMinor: minor, wastePercentage: 0,
    wasteCostMinor: 0, currencyCode: "PLN", inputJson, ...sync(at),
  });
  return {
    projects: [
      { id: "p1", name: "Łazienka", archived: false, ...sync(T0 + 5 * DAY) },
      { id: "p2", name: "Salon", archived: false, ...sync(T0 + 3 * DAY) },
    ],
    rooms: [],
    estimations: [
      line("e1", "p1", "Gres 60×60", 15, "opak.", 74985, T0 + 1 * DAY),
      line("e2", "p1", "Klej C2 25 kg", 7, "worków", 21000, T0 + 2 * DAY),
      // Chapter XVII's "inne koszty": a line nothing calculated. `manual` in inputJson is
      // what /kosztorys/ has written on a hand-typed line since that page existed.
      line("e3", "p1", "Robocizna", 8, "h", 120000, T0 + 3 * DAY, JSON.stringify({ manual: true })),
    ],
    shoppingItems: [
      item("s1", "p1", "e1", "Gres 60×60", "TILES", 15, "opak.", 74985, T0 + 1 * DAY),
      item("s2", "p1", "e2", "Klej C2 25 kg", "CHEMICALS", 7, "worków", 21000, T0 + 2 * DAY),
      // Priced by nobody yet — the row a price is typed onto below.
      item("s3", "p1", null, "Fuga", "CHEMICALS", 4, "kg", 0, T0 + 3 * DAY),
      item("s4", "p2", null, "Farba biała", "PAINT", 3, "opak.", 18900, T0 + 4 * DAY),
    ],
  };
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
  const ctx = await browser.newContext(options);
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

  const plant = { "materio-lang": opts.lang === undefined ? "pl" : opts.lang };
  if (opts.workspace) plant["materio-workspace-v1"] = JSON.stringify(opts.workspace);
  if (opts.active) plant["materio-active-project"] = opts.active;
  if (opts.currency) plant["liczmat-currency"] = opts.currency;
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
  if (opts.ready !== false) await page.waitForSelector(opts.ready || "html[data-ws-ready]");
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const text = (page, sel) => page.$eval(sel, (n) => n.innerText.trim());
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}"));
const items = async (page) => (await store(page)).shoppingItems || [];
/**
 * Digits only. An amount is written four ways in four languages — "2 159,85 zł",
 * "PLN 2,159.85", "2.159,85 PLN" — and what a check here is about is the number, not the
 * notation, so the separators go and 215985 is compared with 215985.
 */
const amount = (s) => String(s).replace(/\D/g, "");
/** The text as written, ignoring the upper-casing a label's style does to it. */
const label = (page, sel) => page.$eval(sel, (n) => n.textContent.replace(/\s+/g, " ").trim());

const PROJECTS = urlProjects("pl");
const MATS = "#ws-project-materials";
const OTHER = "#ws-project-other-list";
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------------- 1. the three figures */

head("1. chapter XVII's three figures stand at the top of the project");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });

  // 749,85 + 210,00 of materials; the grout has no price yet, so it adds nothing.
  eq("the material cost is the shopping list", amount(await text(page, "#ws-project-mat")), "95985");
  eq("the other costs are the line nothing calculated",
    amount(await text(page, "#ws-project-other")), "120000");
  eq("and the project is the two added", amount(await text(page, "#ws-project-total")), "215985");
  eq("the count still counts the saved lines", await text(page, "#ws-project-count"), "3");
  eq("one currency, so no warning", await page.$eval("#ws-project-mixed", (n) => n.hidden), true);

  // `open()` plants a Pro session by default (see the note above it) — section 9 below is
  // the guest/free counterpart, so this is where the other half is proven: the wall is
  // down and the figures are on screen for the level that reaches them, on both halves
  // of this page — the money and the PDF export beside it.
  eq("the figures sit in the open, not behind a wall", await page.locator("#cost-tool").isHidden(), false);
  eq("and no wall is drawn over them", await page.locator("#cost-gate").isHidden(), true);
  eq("the PDF configurator is unlocked too", await page.locator("#pdf-tool").isHidden(), false);
  eq("with no wall over it either", await page.locator("#pdf-gate").isHidden(), true);

  // The calculation and the material it produced are the same money. If the summary added
  // the estimate to the shopping list, this project would come to 3 119,70 of materials.
  check("the calculation and its material are not counted twice",
    !(await page.innerText("#ws-project-body")).includes("3 119,70"));

  const labels = await page.$$eval(".ws-project-figs .eyebrow", (n) => n.map((e) => e.textContent.trim()));
  check("the figures are labelled in words",
    labels.includes("Koszt materiałów") && labels.includes("Inne koszty")
    && labels.includes("Suma projektu"), labels.join(" | "));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. the calculations and the other costs are two lists, not one list twice");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  const calcs = (await rows(page, "#ws-project-lines")).join(" | ");
  const other = (await rows(page, OTHER)).join(" | ");
  check("the calculations are the calculated lines", calcs.includes("Gres 60×60") && calcs.includes("Klej"), calcs);
  check("and the hand-typed one is not among them", !calcs.includes("Robocizna"), calcs);
  check("the other costs are the hand-typed line", other.includes("Robocizna"), other);
  check("with what it costs", amount(other).includes("120000"), other);
  check("and no calculation among them", !other.includes("Gres 60×60"), other);
  await page.close();
}

head("1c. a project with no other costs says so instead of showing nothing");
{
  const ws = fixture();
  ws.estimations = ws.estimations.filter((e) => e.id !== "e3");
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: ws, active: "p1" });
  const list = await rows(page, OTHER);
  eq("one row, and it is the empty state", list.length, 1);
  check("which says what belongs there", list[0].includes("robociznę"), list[0]);
  eq("and the figure is zero rather than blank",
    amount(await text(page, "#ws-project-other")), "000");
  await page.close();
}

/* ------------------------------------------------------------ 2. pricing a material */

head("2. a material is priced per unit, and the row reads like chapter XVII");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  const grout = `${MATS} li[data-id="s3"]`;
  await page.click(`${grout} [data-edit]`);
  await page.waitForSelector(`${MATS} [data-f="priceMajor"]`);

  eq("an unpriced material opens with an empty price",
    await page.$eval(`${MATS} [data-f="priceMajor"]`, (n) => n.value), "");
  check("and the field says which currency it is in",
    (await page.innerText(`${MATS} form[data-mat-edit]`)).includes("Cena jednostkowa (PLN)"));

  // The line under the fields is the arithmetic being typed: 4 kg × 12,50 = 50,00.
  await page.fill(`${MATS} [data-f="priceMajor"]`, "12,50");
  await page.waitForFunction(() =>
    document.querySelector("#ws-project-materials [data-mat-sum]").textContent.trim() !== "");
  const sum = await text(page, `${MATS} [data-mat-sum]`);
  check("the running total multiplies the two numbers on screen",
    amount(sum).includes("5000") && sum.includes("×"), sum);

  await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.id === "s3" && s.estimatedCostMinor === 5000);
  });

  const saved = (await items(page)).find((s) => s.id === "s3");
  eq("the total is what was stored", saved.estimatedCostMinor, 5000);
  eq("in the currency in force", saved.currencyCode, "PLN");
  check("and no unit price was stored beside it",
    !Object.keys(saved).some((k) => /price/i.test(k)), Object.keys(saved).join(","));

  const row = (await rows(page, MATS)).find((r) => r.includes("Fuga"));
  check("the row shows the price of one unit", amount(row).includes("1250"), row);
  check("and what the line comes to", amount(row).includes("5000"), row);
  check("as multiplication, not as two unrelated numbers", /×/.test(row) && /=/.test(row), row);

  eq("the material cost has moved", amount(await text(page, "#ws-project-mat")), "100985");
  eq("and so has the project", amount(await text(page, "#ws-project-total")), "220985");
  eq("the other costs did not", amount(await text(page, "#ws-project-other")), "120000");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2b. changing the quantity re-prices the line at the same unit price");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click(`${MATS} li[data-id="s2"] [data-edit]`);
  await page.waitForSelector(`${MATS} [data-f="priceMajor"]`);
  eq("the adhesive opens at 30,00 a bag",
    await page.$eval(`${MATS} [data-f="priceMajor"]`, (n) => n.value), "30");

  await page.fill(`${MATS} [data-f="quantity"]`, "9");
  await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.id === "s2" && s.quantity === 9);
  });
  const saved = (await items(page)).find((s) => s.id === "s2");
  eq("9 × 30,00 is 270,00", saved.estimatedCostMinor, 27000);

  // The calculation behind it is a record of what was calculated and is left alone.
  const line = (await store(page)).estimations.find((e) => e.id === "e2");
  eq("the calculation keeps what it was calculated at", line.totalCostMinor, 21000);
  await page.close();
}

head("2c. a material typed in by hand can be priced as it is typed");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click("#ws-mat-add summary");
  await page.fill("#ws-mat-name", "Silikon sanitarny");
  await page.fill("#ws-mat-qty", "2");
  await page.fill("#ws-mat-unit", "szt.");
  await page.fill("#ws-mat-price", "24,99");
  const sum = await text(page, "#ws-mat-form [data-mat-sum]");
  check("the form says what it will come to", amount(sum).includes("4998"), sum);

  await page.click("#ws-mat-form button[type=submit]");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.name === "Silikon sanitarny");
  });
  const made = (await items(page)).find((s) => s.name === "Silikon sanitarny");
  eq("2 × 24,99 is 49,98", made.estimatedCostMinor, 4998);
  eq("nothing calculated it", made.estimationId, null);
  eq("the price field is cleared for the next material",
    await page.inputValue("#ws-mat-price"), "");
  eq("and the quantity, which is usually the same, is not",
    await page.inputValue("#ws-mat-qty"), "2");
  eq("the material cost took it in", amount(await text(page, "#ws-project-mat")), "100983");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------- 3. the other costs */

head("3. a cost nothing calculated is typed on the project it belongs to");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p2" });
  await page.click("#ws-other-add summary");
  await page.fill("#ws-other-name", "Wywóz gruzu");
  await page.fill("#ws-other-cost", "400");
  await page.click("#ws-other-form button[type=submit]");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.estimations || []).some((e) => e.name === "Wywóz gruzu");
  });

  const made = (await store(page)).estimations.find((e) => e.name === "Wywóz gruzu");
  // The active project is the other one; the cost belongs to the project on screen.
  eq("it lands on the project that is open, not the active one", made.projectId, "p1");
  eq("with the amount typed", made.totalCostMinor, 40000);
  check("and it is marked as a line nothing calculated",
    JSON.parse(made.inputJson).manual === true, made.inputJson);

  const list = (await rows(page, OTHER)).join(" | ");
  check("it is on the list", list.includes("Wywóz gruzu"), list);
  check("but not among the calculations",
    !(await page.innerText("#ws-project-lines")).includes("Wywóz gruzu"));
  check("and not on the shopping list either — it is not a material",
    !(await page.innerText(MATS)).includes("Wywóz gruzu"));

  eq("the other costs went up", amount(await text(page, "#ws-project-other")), "160000");
  eq("so did the project", amount(await text(page, "#ws-project-total")), "255985");
  eq("the material cost did not", amount(await text(page, "#ws-project-mat")), "95985");
  eq("the name is cleared for the next one", await page.inputValue("#ws-other-name"), "");

  // And it comes off again.
  const id = made.id;
  await page.click(`${OTHER} li[data-id="${id}"] [data-del]`);
  await page.waitForFunction((gone) => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.estimations || []).some((e) => e.id === gone && e.deletedAt);
  }, id);
  eq("deleting it takes it out of the project", amount(await text(page, "#ws-project-other")), "120000");
  check("a deleted cost is a tombstone, not a missing row",
    (await store(page)).estimations.some((e) => e.id === id));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ----------------------------------------------------- 4. the whole arrow, priced */

head("4. calculator → result → project → priced material → project total");
{
  const page = await open(ctx, urlCalc("pl", "waste"), { ready: '.calc[data-wired="1"]' });
  // The price field starts empty on purpose: this site never invents a price. Type one, and
  // it is the price that has to come back out of the material by division.
  await page.fill('[data-k="price"]', "89");
  await page.click("[data-run]");
  await page.waitForSelector("[data-ws-save]");
  await page.click("[data-ws-save]");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).length === 1;
  });

  const href = await page.$eval("[data-ws-saved] a", (a) => a.getAttribute("href"));
  await page.goto(base + href, { waitUntil: "load" });
  await page.waitForSelector("html[data-ws-ready]");

  const item = (await items(page))[0];
  const line = (await store(page)).estimations[0];
  const mat = amount(await text(page, "#ws-project-mat"));
  const total = amount(await text(page, "#ws-project-total"));
  eq("a project made of one calculation costs that calculation once", mat, total);
  eq("and that is what the line was priced at",
    item.estimatedCostMinor, line.totalCostMinor);

  // The unit price the calculator was given comes back out of the division.
  const row = (await rows(page, MATS))[0];
  check("the material row shows a unit price", /×/.test(row), row);
  check("and it is the one typed into the calculator", amount(row).includes("8900"), row);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ 5. languages */

head("5. four languages");
{
  const WANT = {
    pl: ["Koszt materiałów", "Inne koszty", "Suma projektu", "Cena jednostkowa", "Dodaj inny koszt"],
    en: ["Material cost", "Other costs", "Project total", "Unit price", "Add another cost"],
    de: ["Materialkosten", "Sonstige Kosten", "Projektsumme", "Einzelpreis", "Weitere Kosten hinzufügen"],
    uk: ["Вартість матеріалів", "Інші витрати", "Разом за проєктом", "Ціна за одиницю", "Додати іншу витрату"],
  };
  /* The table is the four languages somebody approved word for word. The ten-language
     restore after session 28 widened LANGS and left the table standing, so this section
     stopped checking anything and crashed on the fifth language instead (found in
     session 32). Loop what the table names; widening it to ten is a translation review,
     not a mobile sweep. */
  for (const lang of LANGS.filter((l) => WANT[l])) {
    const page = await open(ctx, `${urlProjects(lang)}?id=p1`,
      { workspace: fixture(), active: "p1", lang });
    const body = await label(page, "#ws-project");
    for (const word of WANT[lang]) {
      check(`${lang}: "${word}" is on the page`, body.includes(word), word);
    }
    check(`${lang}: nothing shows a key instead of a word`,
      !/\b(proj_cost_[a-z]+|proj_other_[a-z]+|proj_mat_price)\b/.test(body), body.slice(0, 200));
    // The amounts are the same amounts in every language; only the notation moves.
    check(`${lang}: the project still comes to 2159,85`,
      /2.?159[.,]85/.test(await text(page, "#ws-project-total")),
      await text(page, "#ws-project-total"));
    check(`${lang}: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    await page.close();
  }
}

head("5b. switching language on an open project redraws the figures");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click('.foot-langs a[data-lang="de"]');
  await page.waitForSelector("html[data-ws-ready]");
  eq("it lands on the same project", new URL(page.url()).search, "?id=p1");
  const body = await label(page, "#ws-project");
  check("the figures are relabelled", body.includes("Projektsumme"), body.slice(0, 200));
  check("and the amounts did not move", amount(await text(page, "#ws-project-total")).includes("215985"),
    await text(page, "#ws-project-total"));
  await page.close();
}

/* ------------------------------------------------------------------ 6. currency */

head("6. the currency relabels, it never converts");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1", currency: "PLN" });
  const before = amount(await text(page, "#ws-project-total"));
  const picked = await page.$("#currency-select");
  if (picked) {
    await page.selectOption("#currency-select", "EUR");
    // Chapter VI: nothing is converted at a rate, and every amount here was saved in złoty.
    eq("the project total stands still", amount(await text(page, "#ws-project-total")), before);
    eq("and so does the material cost", amount(await text(page, "#ws-project-mat")), "95985");

    // A row that has never been priced takes the currency the visitor is in now, because
    // that is the currency they are typing in — chapter XVII.
    await page.click(`${MATS} li[data-id="s3"] [data-edit]`);
    await page.waitForSelector(`${MATS} [data-f="priceMajor"]`);
    check("the price field offers the chosen currency",
      (await page.innerText(`${MATS} form[data-mat-edit]`)).includes("(EUR)"));
    await page.fill(`${MATS} [data-f="priceMajor"]`, "10");
    await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
    await page.waitForFunction(() => {
      const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
      return (ws.shoppingItems || []).some((s) => s.id === "s3" && s.estimatedCostMinor === 4000);
    });
    eq("and the row is stamped with it",
      (await items(page)).find((s) => s.id === "s3").currencyCode, "EUR");
    eq("the project now holds two currencies, and says so",
      await page.$eval("#ws-project-mixed", (n) => n.hidden), false);

    // The one that already held złoty keeps them: 245 zł is not 245 €.
    await page.click(`${MATS} li[data-id="s2"] [data-edit]`);
    await page.waitForSelector(`${MATS} [data-f="priceMajor"]`);
    check("a priced row still offers its own currency",
      (await page.innerText(`${MATS} form[data-mat-edit]`)).includes("(PLN)"));
  } else {
    check("the page has a currency picker", false, "no currency picker on /projekty/");
  }
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ 7. mobile */

head("7. the widths chapter XXVIII names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const c = await context({ viewport: { width, height: 800 } });
    const page = await open(c, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing runs off the side`, over <= 1, `${over}px wider than the viewport`);

    // The three figures are the answer to "what does this cost" and have to be readable
    // without sideways scrolling on the narrowest phone the chapter names.
    const figs = await page.$$eval(".ws-project-figs .ws-project-fig", (n) => n.map((e) => {
      const r = e.getBoundingClientRect();
      return { seen: r.width > 0 && r.height > 0, right: r.right };
    }));
    eq(`${width}px: all four figures are drawn`, figs.length, 4);
    check(`${width}px: and each is inside the viewport`,
      figs.every((f) => f.seen && f.right <= width + 1), JSON.stringify(figs));

    // The price field is typed into with a thumb, in a shop.
    await page.click(`${MATS} li[data-id="s3"] [data-edit]`);
    await page.waitForSelector(`${MATS} [data-f="priceMajor"]`);
    const box = await page.$eval(`${MATS} [data-f="priceMajor"]`, (n) => {
      const r = n.getBoundingClientRect();
      return { w: r.width, h: r.height, right: r.right };
    });
    check(`${width}px: the price field is on screen and big enough to hit`,
      box.h >= 24 && box.w >= 48 && box.right <= width + 1, JSON.stringify(box));
    check(`${width}px: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    await page.close();
    await c.close();
  }
}

/* ------------------------------------------------------------------ 8. no script */

head("8. with JavaScript off");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + PROJECTS, { waitUntil: "load" });

  const html = await page.content();
  check("the figures are in the markup", html.includes('id="ws-project-total"'));
  check("labelled by the build", html.includes("Suma projektu"));
  check("the other costs section too", html.includes('id="ws-project-other-list"'));
  eq("but the detail is hidden, because the numbers come out of storage",
    await page.$eval("#ws-project", (n) => n.hidden), true);
  eq("and no amount is drawn", await text(page, "#ws-project-total"), "");
  await page.close();
  await noJs.close();
}

/* --------------------------------------------------- the money belongs to Pro */

/**
 * The other half of every section above: what a guest and a free account get where the
 * money used to be.
 *
 * The owner's decision of 2026-09-03 — `costs` is PRO — is a product decision about a page
 * that stays open, so both halves have to be walked. Everything above this point runs at
 * the Pro level, which is what `open()` plants by default; this runs at the two levels
 * that do not reach it, and asks for the two things chapter XXV asks for: no amount
 * anywhere, and never a dead control.
 */
head("9. a guest and a free account see the project, and none of its money");
for (const level of [undefined, "liczmat"]) {
  const who = level || "guest";
  const page = await open(ctx, `${PROJECTS}?id=p1`,
    { workspace: fixture(), active: "p1", pro: false, level });

  eq(`${who}: the three figures are behind the wall`,
    await page.locator("#cost-tool").isHidden(), true);
  eq(`${who}: and the wall stands in their place`,
    await page.locator("#cost-gate").isHidden(), false);
  eq(`${who}: "inne koszty" is behind it too`,
    await page.locator("#cost-other-tool").isHidden(), true);
  eq(`${who}: and so is the PDF export`, await page.locator("#pdf-tool").isHidden(), true);
  eq(`${who}: with its own wall in front of it`,
    await page.locator("#pdf-gate").isHidden(), false);

  /* Chapter XXV's two rungs, and exactly the one this visitor stands on: a guest has no
     account for a plan to sit on, somebody signed in has. */
  eq(`${who}: the rung offered is the right one`,
    await page.locator(`#cost-gate [data-pw-step="${level ? "upgrade" : "account"}"]`)
      .first().isHidden(), false);
  eq(`${who}: and the other one is not offered`,
    await page.locator(`#cost-gate [data-pw-step="${level ? "account" : "upgrade"}"]`)
      .first().isHidden(), true);

  /* What is NOT withheld: chapter XVI's list, which is `shopping` and free. The material
     is on the screen with its name, its quantity and its aisle — everything but a price. */
  const list = await rows(page, MATS);
  eq(`${who}: every material is still on the list`, list.length, 3);
  check(`${who}: with the names and the quantities on them`,
    list.join(" | ").includes("Gres 60×60") && list.join(" | ").includes("15 opak."),
    list.join(" | "));
  check(`${who}: and not one amount among them`,
    !/\d[\d\s., ]*(zł|PLN)/i.test(list.join(" ")), list.join(" | "));
  eq(`${who}: the count of calculations is not money and is still shown`,
    await text(page, "#ws-project-count"), "3");

  /* Never a dead control. The price field is off the form rather than sitting there
     taking a number nothing is going to store. */
  await page.click(`${MATS} li[data-id="s3"] [data-edit]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`);
  eq(`${who}: the row still opens for editing`,
    await page.locator(`${MATS} [data-f="quantity"]`).count(), 1);
  eq(`${who}: and carries no price field`,
    await page.locator(`${MATS} [data-f="priceMajor"]`).count(), 0);

  /* And the store is untouched by a level that may not price anything: correcting the
     name of a row a Pro account had priced leaves the amount exactly where it was. */
  await page.fill(`${MATS} [data-f="name"]`, "Fuga szara");
  await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`, { state: "detached" });
  const saved = (await items(page)).find((s) => s.id === "s1");
  eq(`${who}: a priced row keeps the amount it was given`, saved.estimatedCostMinor, 74985);
  check(`${who}: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\ncosts page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
