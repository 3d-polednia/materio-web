#!/usr/bin/env node
/**
 * LiczMat — the material list of a project, in a real browser.
 *
 *     node scripts/test-materials-page.mjs
 *
 * Master plan, session 17, in the half that needs a browser: chapter XVI's arrow clicked
 * end to end — a calculator page, a result, "Dodaj do projektu", and the material sitting
 * on the project's list one navigation later — plus ticking it off, taking it off, the four
 * languages, the currency switch, the widths chapter XXVIII names and the no-script
 * variant. The pure-logic half is scripts/test-materials.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** Neither the calculator nor /projekty/ touches the network: the
 * material list is `shoppingItems` in localStorage, in the Firestore document shape, and it
 * gets there without an account (FIRESTORE_SYNC §1.2). So the test opens the real pages,
 * clicks what a visitor clicks, and reads both what was drawn and what went into storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-materials-page.mjs
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
  console.log("test-materials-page: Playwright not installed — skipping the browser tests.");
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

/* ------------------------------------------------------------------ the fixture */

const DAY = 86400e3;
const T0 = Date.UTC(2026, 6, 1);

/**
 * A workspace with a project that already has a material list, in the document shape the
 * sync contract fixes (FIRESTORE_SYNC §2).
 */
function fixture() {
  const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });
  const item = (id, projectId, estimationId, name, cat, qty, unit, minor, at, currencyCode = "PLN") => ({
    id, projectId, estimationId, name, materialCategory: cat, quantity: qty, unit,
    estimatedCostMinor: minor, currencyCode, isPurchased: false, ...sync(at),
  });
  const line = (id, projectId, name, units, unit, minor, at, currencyCode = "PLN") => ({
    id, projectId, name, calculationType: "SURFACE_COVERAGE", materialCategory: "TILES",
    requiredUnits: units, unitLabel: unit, totalCostMinor: minor, wastePercentage: 0,
    wasteCostMinor: 0, currencyCode, inputJson: "{}", ...sync(at),
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
    ],
    shoppingItems: [
      // Chapter XVI's own example list: tiles, adhesive, grout.
      item("s1", "p1", "e1", "Gres 60×60", "TILES", 15, "opak.", 74985, T0 + 1 * DAY),
      item("s2", "p1", "e2", "Klej C2 25 kg", "CHEMICALS", 7, "worków", 21000, T0 + 2 * DAY),
      { ...item("s3", "p1", null, "Fuga", "CHEMICALS", 4, "kg", 6000, T0 + 3 * DAY),
        note: "antracyt, ten sam co w kuchni" },
      // Somebody else's project — it must not show up on this one.
      item("s4", "p2", null, "Farba biała", "PAINT", 3, "opak.", 18900, T0 + 4 * DAY),
      // A tombstone is not a row.
      { ...item("s5", "p1", null, "Skasowany", "OTHER", 1, "szt.", 100, T0), deletedAt: T0 + DAY },
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

const PROJECTS = urlProjects("pl");
const MATS = "#ws-project-materials";
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ------------------------------------------------------------------ 1. the list */

head("1. the list is on the project screen, and it is that project's");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  const list = await rows(page, MATS);
  eq("three materials, and neither the other project's nor the tombstone", list.length, 3);
  check("the deleted material is nowhere on the page",
    !(await page.content()).includes("Skasowany"));
  check("nor is the other project's", !(await page.innerText(MATS)).includes("Farba biała"));

  // Chapter XVI: Materiał | Ilość.
  check("a row names the material", list[0].includes("Gres 60×60"), list[0]);
  check("and how much of it to buy", /\b15 opak\./.test(list[0]), list[0]);
  check("the second row is the adhesive, in its own unit", /7 worków/.test(list[1]), list[1]);
  check("and the third the grout, in a third unit", /4 kg/.test(list[2]), list[2]);

  // The shop aisle is stored as the enum name and drawn through cat_*, so it reads in the
  // page's language rather than in the language it was saved in.
  check("a row says which aisle it is bought in", list[0].includes("Płytki i gres"), list[0]);
  check("and the two chemicals say theirs",
    list[1].includes("Chemia budowlana") && list[2].includes("Chemia budowlana"), list.join(" | "));
  check("no row prints a raw enum name at the visitor",
    !/\b(TILES|CHEMICALS|PAINT|OTHER)\b/.test(await page.innerText(MATS)));

  // The money is the one the calculation was priced at.
  check("a row carries what it costs",
    list[0].replace(/[\s  ]/g, " ").includes("749,85"), list[0]);

  eq("the tally counts the list", await text(page, "#ws-mat-tally"), "kupione 0 z 3");
  eq("nothing is ticked to begin with",
    await page.$$eval(`${MATS} input[data-buy]:checked`, (n) => n.length), 0);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. a project with no materials says so instead of showing nothing");
{
  const ws = fixture();
  ws.shoppingItems = ws.shoppingItems.filter((s) => s.projectId !== "p1");
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: ws, active: "p1" });
  const list = await rows(page, MATS);
  eq("one row, and it is the empty state", list.length, 1);
  check("which says how a material gets here", list[0].includes("Zapisz wynik kalkulatora"), list[0]);
  eq("and the tally says nothing rather than 0 of 0", await text(page, "#ws-mat-tally"), "");
  await page.close();
}

/* ------------------------------------------------------------------ 2. the arrow */

head("2. chapter XVI's arrow, clicked from a real calculator");
{
  // KALKULATOR → WYNIK → DODAJ DO PROJEKTU → MATERIAŁ TRAFIA DO LISTY, with a browser
  // that has never had a project: the button has to make one rather than lose the result.
  const page = await open(ctx, urlCalc("pl", "waste"), { ready: '.calc[data-wired="1"]' });
  await page.click("[data-run]");
  await page.waitForSelector("[data-ws-save]");
  await page.click("[data-ws-save]");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).length === 1;
  });

  const ws = await store(page);
  const item = ws.shoppingItems[0];
  const line = ws.estimations[0];
  eq("one click made one project", ws.projects.length, 1);
  eq("one estimate line", ws.estimations.length, 1);
  eq("and one material", ws.shoppingItems.length, 1);
  eq("on the list of the project the line went into", item.projectId, line.projectId);
  eq("linked back to the calculation", item.estimationId, line.id);
  eq("with the same name", item.name, line.name);
  eq("the same quantity the result panel printed", item.quantity, line.requiredUnits);
  eq("the same unit", item.unit, line.unitLabel);
  eq("the same money", item.estimatedCostMinor, line.totalCostMinor);
  eq("in the same currency", item.currencyCode, line.currencyCode);
  eq("and nothing bought yet", item.isPurchased, false);

  // The strip under the button leads to the project. Follow it and read the list back.
  const href = await page.$eval("[data-ws-saved] a", (a) => a.getAttribute("href"));
  await page.goto(base + href, { waitUntil: "load" });
  await page.waitForSelector("html[data-ws-ready]");
  const list = await rows(page, MATS);
  eq("the material is on the project's list one navigation later", list.length, 1);
  check("and it is the one that was just calculated", list[0].includes(item.name), list[0]);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2b. a second calculation adds a second material to the same project");
{
  const page = await open(ctx, urlCalc("pl", "waste"), {
    workspace: fixture(), active: "p1", ready: '.calc[data-wired="1"]',
  });
  await page.click("[data-run]");
  await page.waitForSelector("[data-ws-save]");
  await page.click("[data-ws-save]");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).filter((s) => s.projectId === "p1" && !s.deletedAt).length === 4;
  });
  const list = (await items(page)).filter((s) => s.projectId === "p1" && !s.deletedAt);
  eq("the list grew by one", list.length, 4);
  eq("the three that were there are untouched",
    list.slice(0, 3).map((s) => s.id).join(","), "s1,s2,s3");
  eq("and the other project is untouched too",
    (await items(page)).filter((s) => s.projectId === "p2").length, 1);
  await page.close();
}

/* ------------------------------------------------------------------ 3. the writes */

head("3. ticking a material off, and taking it off the list");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });

  await page.click(`${MATS} li[data-id="s1"] input[data-buy]`);
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.id === "s1" && s.isPurchased);
  });
  const bought = (await items(page)).find((s) => s.id === "s1");
  eq("the tick is written to the store", bought.isPurchased, true);
  check("and updatedAt moved, so a sync carries it up", bought.updatedAt > bought.createdAt);
  eq("the row survives the redraw ticked",
    await page.$eval(`${MATS} li[data-id="s1"] input[data-buy]`, (n) => n.checked), true);
  check("and is marked as done on screen",
    await page.$eval(`${MATS} li[data-id="s1"]`, (n) => n.classList.contains("done")));
  eq("the tally follows", await text(page, "#ws-mat-tally"), "kupione 1 z 3");
  eq("nothing else was ticked",
    await page.$$eval(`${MATS} input[data-buy]:checked`, (n) => n.length), 1);

  await page.click(`${MATS} li[data-id="s1"] input[data-buy]`);
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.id === "s1" && !s.isPurchased);
  });
  eq("un-ticking puts it back", await text(page, "#ws-mat-tally"), "kupione 0 z 3");

  await page.click(`${MATS} li[data-id="s2"] [data-del]`);
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.id === "s2" && s.deletedAt);
  });
  eq("a deleted material is off the list", (await rows(page, MATS)).length, 2);
  eq("the tally follows that too", await text(page, "#ws-mat-tally"), "kupione 0 z 2");
  const gone = (await items(page)).find((s) => s.id === "s2");
  check("but the row stays in storage as a tombstone", Number.isInteger(gone.deletedAt));
  eq("the calculation it came from is untouched",
    (await store(page)).estimations.filter((e) => !e.deletedAt).length, 2);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("3b. deleting the project takes the list, and the undo brings it back");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click("#ws-project-delete");
  await page.click("#ws-delete-yes");
  await page.waitForSelector("#ws-index:not([hidden])");
  eq("every material of the project went with it",
    (await items(page)).filter((s) => s.projectId === "p1" && !s.deletedAt).length, 0);
  eq("the other project's list is untouched",
    (await items(page)).filter((s) => s.projectId === "p2" && !s.deletedAt).length, 1);

  await page.click("#ws-undo-go");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).filter((s) => s.projectId === "p1" && !s.deletedAt).length === 3;
  });
  eq("the undo brings the whole list back",
    (await items(page)).filter((s) => s.projectId === "p1" && !s.deletedAt).length, 3);
  const back = (await items(page)).find((s) => s.id === "s5");
  check("and not the material that was deleted by hand earlier", Boolean(back.deletedAt));
  await page.close();
}

/* ------------------------------------------------------ 3c. session 18: editing */

head("3c. editing a material, in the row it belongs to");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });

  // Chapter XVI's note reads on the row when there is one, and takes no space when there
  // is not — the first two materials of the fixture have none.
  const drawn = await rows(page, MATS);
  check("a material with a note shows it", drawn[2].includes("antracyt"), drawn[2]);
  check("one without does not invent an empty line",
    !drawn[0].includes("Notatka"), drawn[0]);

  await page.click(`${MATS} li[data-id="s1"] [data-edit]`);
  await page.waitForSelector(`${MATS} li[data-id="s1"] form[data-mat-edit]`);
  eq("the form opens on that row and no other",
    await page.$$eval(`${MATS} form[data-mat-edit]`, (f) => f.length), 1);
  eq("it opens with the material's own name",
    await page.$eval(`${MATS} [data-f="name"]`, (n) => n.value), "Gres 60×60");
  eq("its own quantity", await page.$eval(`${MATS} [data-f="quantity"]`, (n) => n.value), "15");
  eq("its own unit", await page.$eval(`${MATS} [data-f="unit"]`, (n) => n.value), "opak.");
  eq("and its own aisle selected",
    await page.$eval(`${MATS} [data-f="materialCategory"]`, (n) => n.value), "TILES");
  // Chapter XVII, added by session 19: the money is edited per unit, and the field opens
  // holding the price the calculator was given — 749,85 for 15 packs is 49,99 each.
  eq("the price is the price of one unit",
    await page.$eval(`${MATS} [data-f="priceMajor"]`, (n) => n.value), "49.99");
  eq("and there is no field for the total, which is the product of the two",
    await page.$$eval(`${MATS} [data-f="cost"]`, (n) => n.length), 0);
  // Session 15 took prompt() out of this page; it must not come back through this door.
  check("and no browser dialog is involved",
    !(await page.content()).includes("prompt("));

  await page.fill(`${MATS} [data-f="name"]`, "Gres 60×60 szary");
  await page.fill(`${MATS} [data-f="quantity"]`, "26,4");
  await page.fill(`${MATS} [data-f="unit"]`, "m²");
  await page.selectOption(`${MATS} [data-f="materialCategory"]`, "FLOORING");
  await page.fill(`${MATS} [data-f="note"]`, "ten sam odcień co w kuchni");
  await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.id === "s1" && s.name === "Gres 60×60 szary");
  });

  const saved = (await items(page)).find((s) => s.id === "s1");
  eq("the name is written", saved.name, "Gres 60×60 szary");
  // A comma is the decimal point in three of these four languages.
  eq("the quantity is read as a decimal", saved.quantity, 26.4);
  eq("the unit is written", saved.unit, "m²");
  eq("the aisle is written", saved.materialCategory, "FLOORING");
  eq("the note is written", saved.note, "ten sam odcień co w kuchni");
  // Chapter XVII: the quantity and the price are on screen together, so the cost is the
  // two multiplied — 26,4 × 49,99. Session 19; before it, the cost stayed at 749,85.
  eq("and the cost follows the quantity at the same unit price",
    saved.estimatedCostMinor, 131974);
  eq("and the link back to the calculation survives", saved.estimationId, "e1");

  const back = await rows(page, MATS);
  eq("the form closed", await page.$$eval(`${MATS} form[data-mat-edit]`, (f) => f.length), 0);
  check("and the row reads what was saved", back[0].includes("Gres 60×60 szary"), back[0]);
  check("with the new quantity and unit", /26,4 m²/.test(back[0]), back[0]);
  check("the new aisle", back[0].includes("Podłogi"), back[0]);
  check("and the note under it", back[0].includes("ten sam odcień"), back[0]);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("3d. an edit can be abandoned");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click(`${MATS} li[data-id="s1"] [data-edit]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`);
  await page.fill(`${MATS} [data-f="name"]`, "Coś zupełnie innego");
  await page.click(`${MATS} form[data-mat-edit] [data-cancel]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`, { state: "detached" });
  eq("nothing was written", (await items(page)).find((s) => s.id === "s1").name, "Gres 60×60");
  check("and the row reads what it always did",
    (await rows(page, MATS))[0].includes("Gres 60×60"));

  // A material cannot lose its name: it is what the visitor shops by.
  await page.click(`${MATS} li[data-id="s1"] [data-edit]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`);
  await page.fill(`${MATS} [data-f="name"]`, "   ");
  await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
  eq("an empty name does not save", (await items(page)).find((s) => s.id === "s1").name, "Gres 60×60");

  // Leaving the project ends the edit — it belongs to a row on a screen being left.
  await page.click("[data-ws-back]");
  await page.waitForSelector("#ws-index:not([hidden])");
  await page.goBack();
  await page.waitForSelector("#ws-project-body:not([hidden])");
  eq("and it is not still open on the way back",
    await page.$$eval(`${MATS} form[data-mat-edit]`, (f) => f.length), 0);
  await page.close();
}

head("3e. a material typed in by hand");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  const add = await page.$("#ws-mat-add");
  check("the page offers it", Boolean(add));
  eq("folded away, because the arrow from a result is the usual way in",
    await page.$eval("#ws-mat-add", (n) => n.open), false);

  await page.click("#ws-mat-add summary");
  await page.fill("#ws-mat-name", "Silikon sanitarny");
  await page.fill("#ws-mat-qty", "2");
  await page.fill("#ws-mat-unit", "szt.");
  await page.selectOption("#ws-mat-cat", "CHEMICALS");
  await page.fill("#ws-mat-note", "biały");
  await page.click("#ws-mat-form button[type=submit]");
  await page.waitForFunction(() => {
    const ws = JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}");
    return (ws.shoppingItems || []).some((s) => s.name === "Silikon sanitarny");
  });

  const own = (await items(page)).find((s) => s.name === "Silikon sanitarny");
  eq("it lands on the open project", own.projectId, "p1");
  eq("with the quantity typed", own.quantity, 2);
  eq("the unit typed", own.unit, "szt.");
  eq("the aisle chosen", own.materialCategory, "CHEMICALS");
  eq("the note typed", own.note, "biały");
  eq("and nothing calculated it", own.estimationId, null);
  eq("it is not on the estimate either",
    (await store(page)).estimations.filter((e) => !e.deletedAt).length, 2);

  eq("the list grew by one", (await rows(page, MATS)).length, 4);
  eq("the tally follows", await text(page, "#ws-mat-tally"), "kupione 0 z 4");

  // The name and the note are about one material; the unit and the aisle are usually the
  // same for the next two rows, so they stay and the next row is two fields of typing.
  eq("the name field is cleared for the next one",
    await page.$eval("#ws-mat-name", (n) => n.value), "");
  eq("and the note", await page.$eval("#ws-mat-note", (n) => n.value), "");
  eq("but the unit stays", await page.$eval("#ws-mat-unit", (n) => n.value), "szt.");
  eq("and the aisle stays", await page.$eval("#ws-mat-cat", (n) => n.value), "CHEMICALS");

  // A row with no name is a row nobody can shop for; the form is `required`, so the
  // browser refuses before anything is written.
  await page.click("#ws-mat-form button[type=submit]");
  eq("an empty name adds nothing", (await rows(page, MATS)).length, 4);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ 4. languages */

head("4. four languages");
{
  const WANT = {
    pl: ["Materiały", "Płytki i gres", "kupione 0 z 3", "Kupione", "Dodaj własny materiał"],
    en: ["Materials", "Tiles", "bought 0 of 3", "Bought", "Add your own material"],
    de: ["Material", "Fliesen", "gekauft 0 von 3", "Gekauft", "Eigenes Material hinzufügen"],
    uk: ["Матеріали", "Плитка", "куплено 0 з 3", "Куплено", "Додати власний матеріал"],
  };
  for (const lang of LANGS) {
    const page = await open(ctx, `${urlProjects(lang)}?id=p1`,
      { workspace: fixture(), active: "p1", lang });
    const body = await page.innerText("#ws-project");
    check(`${lang}: the section is headed in that language`, body.includes(WANT[lang][0]), WANT[lang][0]);
    check(`${lang}: the aisle is in that language`, body.includes(WANT[lang][1]), WANT[lang][1]);
    eq(`${lang}: so is the tally`, await text(page, "#ws-mat-tally"), WANT[lang][2]);
    check(`${lang}: and the tick`, (await page.innerText(MATS)).includes(WANT[lang][3]), WANT[lang][3]);
    check(`${lang}: nothing shows a key instead of a word`,
      !/\b(proj_mat_[a-z]+|cat_[A-Z]+)\b/.test(body), body.slice(0, 200));
    // The material's own name is text in the contract and is the visitor's own words —
    // it is the one thing on the row that does not translate, exactly as on the phone.
    check(`${lang}: the material's own name is left alone`, body.includes("Gres 60×60"));
    check(`${lang}: the add form is translated`, body.includes(WANT[lang][4]), WANT[lang][4]);
    // The note is the visitor's own words, so it is the other thing that does not translate.
    check(`${lang}: and so is the note they wrote`, body.includes("antracyt"));
    check(`${lang}: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    await page.close();
  }
}

head("4b. switching language on an open project redraws the list");
{
  // The rows are written by script, so they stay in the old language unless something
  // redraws them — the defect session 13 fixed on /app/ and session 16 on this page.
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  check("it starts in Polish", (await page.innerText(MATS)).includes("Płytki i gres"));

  // The switcher navigates — it does not rewrite the page — and since session 16 the link
  // carries the query string, which is what keeps the open project open.
  const href = await page.$eval('.foot-langs a[data-lang="en"]', (a) => a.getAttribute("href"));
  eq("the language link carries the open project", new URL(href, base).search, "?id=p1");
  await page.click('.foot-langs a[data-lang="en"]');
  await page.waitForSelector("html[data-ws-ready]");
  const body = await page.innerText(MATS);
  eq("and lands on the same project", new URL(page.url()).search, "?id=p1");
  check("the material is still there", body.includes("Gres 60×60"), body.slice(0, 120));
  check("and the aisle is drawn in the new language", body.includes("Tiles"), body.slice(0, 200));
  eq("so is the tally", await text(page, "#ws-mat-tally"), "bought 0 of 3");
  await page.close();
}

/* ------------------------------------------------------------------ 5. currency */

head("5. the currency relabels, it never converts");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1", currency: "PLN" });
  const before = (await rows(page, MATS)).join(" | ").replace(/[\s  ]+/g, " ");
  const picked = await page.$("#currency-select");
  if (picked) {
    await page.selectOption("#currency-select", "EUR");
    const after = (await rows(page, MATS)).join(" | ").replace(/[\s  ]+/g, " ");
    // Chapter VI: nothing is converted at a rate, and a material keeps the currency it was
    // saved with — so both the quantities and the amounts stand still.
    check("the quantities do not move", /15 opak\./.test(after) && /7 worków/.test(after), after);
    check("and neither do the amounts",
      after.replace(/[^\d,]/g, "") === before.replace(/[^\d,]/g, ""), `${before}\n      -> ${after}`);
  } else {
    check("the page has a currency picker", false, "no currency picker on /projekty/");
  }
  await page.close();
}

/* ------------------------------------------------------------------ 6. mobile */

head("6. the widths chapter XXVIII names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const c = await context({ viewport: { width, height: 800 } });
    const page = await open(c, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing runs off the side`, over <= 1, `${over}px wider than the viewport`);
    // The list is read in a shop, one-handed: the box has to be on screen and big enough
    // to hit. 24 px is the smallest target this page offers anywhere.
    const box = await page.$eval(`${MATS} input[data-buy]`, (n) => {
      const r = n.getBoundingClientRect();
      return { w: r.width, h: r.height, seen: r.width > 0 && r.height > 0 };
    });
    check(`${width}px: the tick box is on screen`, box.seen);
    check(`${width}px: and big enough to hit`, box.w >= 16 && box.h >= 16, JSON.stringify(box));
    check(`${width}px: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    await page.close();
    await c.close();
  }
}

/* ------------------------------------------------------------------ 7. no script */

head("7. with JavaScript off");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + PROJECTS, { waitUntil: "load" });

  // The frame is written by the build, so the heading is there; the rows are not, because
  // they come out of localStorage and nothing can read it. That is the honest state — and
  // the detail stays hidden rather than showing an empty material list to somebody who
  // could never have filled it.
  const html = await page.content();
  check("the section is in the markup", html.includes('id="ws-project-materials"'));
  check("with its heading", html.includes("Materiały"));
  eq("but the detail is hidden", await page.$eval("#ws-project", (n) => n.hidden), true);
  check("and no material list is drawn",
    (await page.$$eval(`${MATS} > li`, (li) => li.length)) === 0);
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nmaterials page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
