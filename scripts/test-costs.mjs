#!/usr/bin/env node
/**
 * LiczMat — what a project costs, tested.
 *
 *     node scripts/test-costs.mjs
 *
 * Master plan, session 19: "KOSZTY PROJEKTU — ceny materiałów, koszty, waluty,
 * podsumowanie", and chapter XVII under it:
 *
 *     Materiały mogą mieć ceny.        Klej | 7 × 35 PLN | = 245 PLN
 *     Waluta powinna być zgodna z wybraną przez użytkownika.
 *     Projekt może pokazywać: koszt materiałów, inne koszty, sumę projektu.
 *     Nie buduj z tego systemu księgowego.
 *
 * This file is the half that needs no browser:
 *
 *   1. the unit price — derived from the total the contract keeps, never stored beside it;
 *   2. the write — a price typed per unit becomes the product, and the currency rule that
 *      goes with it (chapter VI: nothing is ever converted at a rate);
 *   3. the summary — material cost, other costs and the sum, with every amount in the
 *      project counted exactly once;
 *   4. "inne koszty" — the estimate lines nothing calculated, and the project they land in;
 *   5. the frame the build writes, and the copy in four languages.
 *
 * The other half — clicking it through in Chromium — is scripts/test-costs-page.mjs.
 *
 * The document being asserted is not this repository's invention: `ShoppingItemEntity` in
 * the app's Room database has one money column, `estimatedCostMinor`, and no unit price;
 * `validShoppingItem()` in `config/firebase/firestore.rules` validates the same; and
 * `ShoppingCsvExporter` prints the same. All three in `3d-polednia/Materio`, read rather
 * than remembered. That is why the price here is a division and not a field.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on a failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { projectsMain, estimateMain } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");

function evalScript(file, returns, globals = {}) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);
const DICT = {};
for (const lang of LANGS) {
  DICT[lang] = {
    ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}), ...(I18N_MATERIALS[lang] || {}),
  };
}
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

const { MAT_CATS } = evalScript("assets/materials.js", ["MAT_CATS"], { module: undefined });
/* The permission table as the browser has it. Since 2026-09-03 /projekty/ and
   /kosztorys/ draw chapter XXV’s wall in front of the money on them, and proGate()
   builds that wall out of LM_FEATURES — so a page builder called without it would be
   checking a page the build never writes. */
const FEATURES = evalScript(["assets/account.js", "assets/plan.js"], ["LM_FEATURES"]).LM_FEATURES;


/**
 * What pwAllows() answers inside the shipped store, for the length of one check.
 *
 * assets/workspace.js and assets/crm.js ask it before they store a typed amount or write
 * a quote (the owner’s decision of 2026-09-03). True is the ordinary case and is what the
 * arithmetic below is written against; a test that wants the refusal sets it to false and
 * puts it back.
 */
let PW_ALLOW = true;

/** assets/workspace.js in Node, on a store that starts out however the test wants it. */
function loadWorkspace(seed) {
  const backing = new Map(Object.entries(seed || {}));
  const clock = { now: 1_760_000_000_000, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const api = evalScript("assets/workspace.js", [
    "wsLoad", "wsProjects", "wsProject", "wsAddProject", "wsArchiveProject",
    "wsDeleteProject", "wsRestoreProject", "wsActiveProjectId", "wsSetActiveProject",
    "wsEstimations", "wsAddEstimation", "wsAddManualEstimation", "wsUpdateEstimation",
    "wsDeleteEstimation", "wsIsManualLine", "wsOtherCosts", "wsCalcLines", "wsCanPrice",
    "wsItems", "wsItem", "wsAddItem", "wsAddOwnItem", "wsUpdateItem", "wsDeleteItem",
    "wsUnitPriceMinor", "wsItemCostMinor", "wsItemsTotal", "wsProjectTotal", "wsProjectCosts",
    "wsSumsText",
    "wsMinor", "wsExport", "wsImport",
  ], {
    localStorage,
    document: { dispatchEvent: () => {} },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: { now: () => clock.now },
    lmCurrency: () => clock.currency,
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
    // What the paywall answers inside the store. `costs` and `quotes` became PRO on
    // 2026-09-03 and the writes that take a typed amount ask before they store it, so the
    // default here is an account that reaches them — otherwise every section below would be
    // testing the refusal instead of the arithmetic. The section that IS about the refusal
    // sets PW_ALLOW to false itself.
    pwAllows: () => PW_ALLOW,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("materio-workspace-v1") || "{}"),
    tick: (ms) => { clock.now += ms || 1000; },
    setCurrency: (c) => { clock.currency = c; },
  };
}

/**
 * One save, exactly as assets/workspace-ui.js performs it after a calculation: 15 packs at
 * 49.99 each. Every engine in assets/calculators.js computes `cost = units × price`, which
 * is what makes the unit price recoverable by division.
 */
const save = (ws, over = {}) => ws.wsAddEstimation({
  calcId: "waste",
  name: "Gres 60×60",
  materialCategory: "TILES",
  requiredUnits: 15,
  unitLabel: "opak.",
  costMajor: 749.85,
  wastePercent: 7,
  input: { area: "21.6" },
  projectName: "Mój projekt",
  ...over,
});

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
const at = (rows, i) => rows[i || 0] || {};

/* ------------------------------------------------- 1. the unit price is a division */

head("1. the unit price is derived from the total, never stored beside it");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Łazienka");

  // Chapter XVII's own example, in the chapter's own numbers.
  const glue = ws.wsAddItem({
    projectId: project.id, name: "Klej", materialCategory: "CHEMICALS",
    quantity: 7, unit: "worków", costMajor: 245, currencyCode: "PLN",
  });
  eq("7 × 35 PLN is kept as 245 PLN", glue.estimatedCostMinor, 24500);
  eq("and reads back as 35 PLN each", ws.wsUnitPriceMinor(glue), 3500);

  // The site's own arrow: the calculator priced 15 packs at 49.99, so that is what the
  // material has to say it costs each. `cost = units × price` in every engine.
  const row = save(ws, { projectId: project.id });
  const tiles = ws.wsItems(project.id).find((s) => s.estimationId === row.id);
  eq("a calculated material gives back the price typed into the calculator",
    ws.wsUnitPriceMinor(tiles), 4999);

  // Nothing to divide is not a price of zero — it is no price, and the row says so rather
  // than printing "0,00 each" next to a material nobody has priced.
  const bare = ws.wsAddItem({
    projectId: project.id, name: "Fuga", materialCategory: "CHEMICALS",
    quantity: 4, unit: "kg", costMajor: 0,
  });
  eq("an unpriced material has no unit price at all", ws.wsUnitPriceMinor(bare), null);
  const none = ws.wsUpdateItem(bare.id, { quantity: 0, priceMajor: 12 });
  eq("nor has a material with no quantity", ws.wsUnitPriceMinor(none), null);
  eq("and dividing by it was never attempted", none.estimatedCostMinor, 0);

  // A material has a fractional quantity — 26,4 m² is chapter XVI's own example — so the
  // division has to answer in fractions of a minor unit rather than round silently.
  const area = ws.wsAddItem({
    projectId: project.id, name: "Gres", materialCategory: "TILES",
    quantity: 26.4, unit: "m²", costMajor: 1188,
  });
  eq("a fractional quantity divides exactly", ws.wsUnitPriceMinor(area), 4500);
}

head("1b. the price adds no field to the document");
{
  // The contract has one money field on a shopping item and the deployed rules validate the
  // shape of it. A unit price kept beside it would survive the sync — session 18 proved that
  // with `note` — but it would be free to disagree with the money after the phone edited the
  // quantity, and a price that contradicts the total is worse than no price.
  const ws = loadWorkspace();
  const row = save(ws);
  const item = at(ws.wsItems(row.projectId));
  ws.wsUpdateItem(item.id, { priceMajor: 40 });

  const CONTRACT = [
    "id", "projectId", "estimationId", "name", "materialCategory", "quantity", "unit",
    "estimatedCostMinor", "currencyCode", "isPurchased",
    "createdAt", "updatedAt", "deletedAt", "schemaVersion",
    // The one field beside the contract, and the report of session 18 explains why.
    "note",
  ];
  const keys = Object.keys(at(ws.raw().shoppingItems)).sort();
  eq("a priced material still carries exactly the contract's fields",
    keys.join(","), [...CONTRACT].sort().join(","));
  check("and nothing that looks like a stored unit price",
    !keys.some((k) => /price/i.test(k)), keys.join(","));
}

/* ------------------------------------------------------------ 2. writing a price */

head("2. a price is typed per unit and stored as the product");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const item = at(ws.wsItems(row.projectId));
  ws.tick();

  const priced = ws.wsUpdateItem(item.id, { priceMajor: 52.5 });
  eq("15 × 52,50 is 787,50", priced.estimatedCostMinor, 78750);
  eq("and the quantity did not move", priced.quantity, 15);
  check("updatedAt moved, so the phone hears about it", priced.updatedAt > item.updatedAt);

  // Chapter XVII's arithmetic as the form reads it: both numbers are on screen together, so
  // the quantity is applied first and the price multiplies the new one.
  ws.tick();
  const more = ws.wsUpdateItem(item.id, { quantity: 16, priceMajor: 52.5 });
  eq("16 × 52,50 is 840,00", more.estimatedCostMinor, 84000);

  // Money is minor units and an integer, rounded exactly once (the Money rule).
  ws.tick();
  const odd = ws.wsUpdateItem(item.id, { quantity: 2.5, priceMajor: 0.99 });
  eq("2,5 × 0,99 rounds once, to whole grosze", odd.estimatedCostMinor, 248);
  check("and stays an integer", Number.isInteger(odd.estimatedCostMinor));

  ws.tick();
  const cleared = ws.wsUpdateItem(item.id, { priceMajor: 0 });
  eq("a price of nothing empties the cost", cleared.estimatedCostMinor, 0);
  eq("and the material has no unit price again", ws.wsUnitPriceMinor(cleared), null);

  ws.tick();
  const nonsense = ws.wsUpdateItem(item.id, { priceMajor: -20 });
  eq("a negative price is not a price", nonsense.estimatedCostMinor, 0);

  // Session 18's rule is unchanged: the quantity on its own still leaves the money alone.
  ws.tick();
  const repriced = ws.wsUpdateItem(item.id, { priceMajor: 10, quantity: 4 });
  const moved = ws.wsUpdateItem(item.id, { quantity: 8 });
  eq("a quantity without a price does not re-multiply anything",
    moved.estimatedCostMinor, repriced.estimatedCostMinor);
}

head("2b. the currency follows the visitor into an unpriced row and never converts one");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Łazienka");
  const own = ws.wsAddOwnItem({
    projectId: project.id, name: "Silikon", materialCategory: "CHEMICALS",
    quantity: 2, unit: "szt.",
  });
  eq("a material typed in without a price costs nothing", own.estimatedCostMinor, 0);

  // Chapter XVII: "Waluta powinna być zgodna z wybraną przez użytkownika." A row that has
  // never held money takes the currency in force when it finally gets some.
  ws.setCurrency("EUR");
  ws.tick();
  const eur = ws.wsUpdateItem(own.id, { priceMajor: 12 });
  eq("pricing it uses the currency the visitor chose", eur.currencyCode, "EUR");
  eq("and the amount is what was typed", eur.estimatedCostMinor, 2400);

  // Chapter VI: nothing is converted at a rate. So a row that already holds 24,00 € keeps
  // euros when the visitor switches to złoty — re-stamping it would turn 24 € into 24 zł
  // without anybody typing a number.
  ws.setCurrency("PLN");
  ws.tick();
  const same = ws.wsUpdateItem(own.id, { priceMajor: 15 });
  eq("a priced row keeps the currency it was priced in", same.currencyCode, "EUR");
  eq("even though the amount changed", same.estimatedCostMinor, 3000);

  // The same rule the arrow from a calculator has always followed.
  ws.tick();
  const row = save(ws, { projectId: project.id });
  eq("a calculated material is stamped with the current currency",
    at(ws.wsItems(project.id).filter((s) => s.estimationId === row.id)).currencyCode, "PLN");
}

head("2c. a material typed in by hand can be priced as it is typed");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Łazienka");
  const own = ws.wsAddOwnItem({
    projectId: project.id, name: "Klej", materialCategory: "CHEMICALS",
    quantity: 7, unit: "worków", priceMajor: 35, note: "biały",
  });
  eq("7 × 35 lands as 245", own.estimatedCostMinor, 24500);
  eq("which reads back as 35 each", ws.wsUnitPriceMinor(own), 3500);
  eq("nothing calculated it, so it points at no calculation", own.estimationId, null);
  eq("and it is still not on the estimate", ws.wsEstimations(project.id).length, 0);
}

/* --------------------------------------------------- 3. the three figures */

head("3. koszt materiałów, inne koszty, suma projektu");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const project = ws.wsProject(row.projectId);

  // One calculation is one estimate line **and** one material, carrying the same money.
  // Adding the two lists together would bill this project twice.
  const one = ws.wsProjectCosts(project.id);
  eq("the material cost is the calculation, once", one.materials, 74985);
  eq("no other costs yet", one.other, 0);
  eq("and the sum is not double the line", one.total, 74985);
  eq("which is also what the estimate says the lines come to",
    ws.wsProjectTotal(project.id).minor, 74985);

  // Chapter XVII's other costs: what no calculator produces.
  ws.tick();
  ws.wsAddManualEstimation({
    projectId: project.id, name: "Robocizna", requiredUnits: 8, unitLabel: "h", costMajor: 1200,
  });
  const two = ws.wsProjectCosts(project.id);
  eq("labour is an other cost", two.other, 120000);
  eq("not a material", two.materials, 74985);
  eq("and the project comes to the two added", two.total, 194985);
  eq("one other cost is counted", two.others, 1);
  eq("and one material", two.items, 1);

  // Re-pricing the material moves the project, because the shopping list is the side
  // chapter XVII lets the visitor price.
  ws.tick();
  const item = at(ws.wsItems(project.id));
  ws.wsUpdateItem(item.id, { priceMajor: 40 });
  const three = ws.wsProjectCosts(project.id);
  eq("the new price is the material cost", three.materials, 60000);
  eq("and the project follows it", three.total, 180000);
  eq("while the calculation keeps what it was calculated at",
    ws.wsProjectTotal(project.id).minor, 74985 + 120000);
}

head("3b. every amount is counted exactly once, including the ones with no material");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Łazienka");

  // A line saved before session 17 — the site wrote the estimate and no material at all.
  // Its money still has to be in the project, or the sum would quietly shrink.
  const legacy = ws.wsAddEstimation({
    calcId: "coverage", projectId: project.id, name: "Farba", materialCategory: "PAINT",
    requiredUnits: 3, unitLabel: "opak.", costMajor: 189, wastePercent: 0, input: {},
  });
  ws.wsDeleteItem(at(ws.wsItems(project.id).filter((s) => s.estimationId === legacy.id)).id);
  const bare = ws.wsProjectCosts(project.id);
  eq("a calculation with no material on the list still counts", bare.materials, 18900);
  eq("and it is not filed under other costs", bare.other, 0);
  eq("the material list itself is empty", bare.items, 0);

  // And it stops being counted twice the moment the material comes back.
  ws.tick();
  ws.wsAddItem({
    projectId: project.id, estimationId: legacy.id, name: "Farba", materialCategory: "PAINT",
    quantity: 3, unit: "opak.", costMajor: 200,
  });
  const back = ws.wsProjectCosts(project.id);
  eq("the material's price wins over the calculation's", back.materials, 20000);
  eq("and the calculation is not added a second time", back.total, 20000);
}

head("3c. an empty project costs nothing and says so without a NaN");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Pusty");
  const costs = ws.wsProjectCosts(project.id);
  eq("materials", costs.materials, 0);
  eq("other", costs.other, 0);
  eq("total", costs.total, 0);
  eq("not mixed", costs.mixed, false);
  eq("and the currency is the visitor's", costs.currencyCode, "PLN");
}

/* H4 of the audit of 2026-09-04: the flag was raised and the sum was handed out anyway, so
   a project holding 749,85 zł and 50 € answered "what does this cost" with "799,85 zł".
   There is now no single figure to print in that case at all — the three come back null
   and the money lives in `byCurrency`, one bucket per currency, converted by nothing. */
head("3d. two currencies are flagged, and there is no single sum to print");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const project = ws.wsProject(row.projectId);
  const one = ws.wsProjectCosts(project.id);
  eq("one currency is not mixed", one.mixed, false);
  eq("and it has its one total", one.total, 74985);
  eq("in one bucket", one.byCurrency.length, 1);
  eq("which is the same figure", one.byCurrency[0].total, 74985);
  eq("in the currency it was saved in", one.byCurrency[0].currencyCode, "PLN");

  ws.setCurrency("EUR");
  ws.tick();
  ws.wsAddManualEstimation({
    projectId: project.id, name: "Dostawa", requiredUnits: 1, unitLabel: "", costMajor: 50,
  });
  const costs = ws.wsProjectCosts(project.id);
  eq("a second currency is flagged", costs.mixed, true);
  eq("there is no total", costs.total, null);
  eq("no materials figure", costs.materials, null);
  eq("no other figure", costs.other, null);
  eq("and no currency to label one with", costs.currencyCode, "");
  eq("the money is in two buckets", costs.byCurrency.length, 2);
  const pln = costs.byCurrency.find((b) => b.currencyCode === "PLN");
  const eur = costs.byCurrency.find((b) => b.currencyCode === "EUR");
  check("and nothing was converted", pln.materials === 74985 && eur.other === 5000);
  eq("each bucket sums only its own", pln.total, 74985);
  eq("and so does the other", eur.total, 5000);

  // What the interface prints: one figure per currency, never joined with a plus.
  eq("the words are per currency",
    ws.wsSumsText(costs.byCurrency, "total"), "749.85 PLN · 50.00 EUR");
  check("and the sum of the two is nowhere in them",
    !ws.wsSumsText(costs.byCurrency, "total").includes("799"));
}

head("3e. the estimate sheet's own total follows the same rule");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const project = ws.wsProject(row.projectId);
  eq("one currency has a total", ws.wsProjectTotal(project.id).minor, 74985);

  ws.setCurrency("EUR");
  ws.tick();
  ws.wsAddManualEstimation({
    projectId: project.id, name: "Dostawa", requiredUnits: 1, unitLabel: "", costMajor: 50,
  });
  const total = ws.wsProjectTotal(project.id);
  eq("two currencies have none", total.minor, null);
  eq("and no currency either", total.currencyCode, "");
  eq("the lines are still counted", total.count, 2);
  eq("and each currency keeps its own sum", total.byCurrency.length, 2);
}

/* ------------------------------------------------------- 4. what "other" means */

head("4. a hand-typed line is an other cost; a calculated one is not");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const project = ws.wsProject(row.projectId);
  const manual = ws.wsAddManualEstimation({
    projectId: project.id, name: "Wywóz gruzu", requiredUnits: 1, unitLabel: "", costMajor: 400,
  });

  eq("the calculated line is not manual", ws.wsIsManualLine(row), false);
  eq("the typed one is", ws.wsIsManualLine(manual), true);
  eq("a line with no inputJson at all is not manual", ws.wsIsManualLine({}), false);
  eq("neither is a broken one", ws.wsIsManualLine({ inputJson: "{oops" }), false);
  eq("nor a calculation whose fields happen to be named oddly",
    ws.wsIsManualLine({ inputJson: JSON.stringify({ manual: "1" }) }), false);

  eq("other costs are the typed ones", ws.wsOtherCosts(project.id).length, 1);
  eq("and they are that one", at(ws.wsOtherCosts(project.id)).id, manual.id);
  eq("calculations are the rest", ws.wsCalcLines(project.id).length, 1);
  eq("and they are that one", at(ws.wsCalcLines(project.id)).id, row.id);
  eq("the two halves are the whole estimate",
    ws.wsOtherCosts(project.id).length + ws.wsCalcLines(project.id).length,
    ws.wsEstimations(project.id).length);

  // Session 17's rule, unchanged: a line typed by hand never reaches the shopping list.
  eq("no material was made for it", ws.wsItems(project.id).length, 1);

  // Deleting it takes it out of the sum, because a tombstone is not a row.
  ws.tick();
  ws.wsDeleteEstimation(manual.id);
  eq("a deleted other cost is gone from the list", ws.wsOtherCosts(project.id).length, 0);
  eq("and out of the project's cost", ws.wsProjectCosts(project.id).other, 0);
}

head("4b. an other cost is filed in the project it was typed on");
{
  const ws = loadWorkspace();
  const a = ws.wsAddProject("Łazienka");
  const b = ws.wsAddProject("Salon"); // the newest project is the active one
  eq("the second project is active", ws.wsActiveProjectId(), b.id);

  const named = ws.wsAddManualEstimation({
    projectId: a.id, name: "Robocizna", requiredUnits: 1, unitLabel: "", costMajor: 800,
  });
  eq("the cost lands on the project it names, not the active one", named.projectId, a.id);
  eq("so the other project is untouched", ws.wsProjectCosts(b.id).other, 0);
  eq("and this one carries it", ws.wsProjectCosts(a.id).other, 80000);

  // /kosztorys/ names no project: it is about the active one, which is what that page means.
  const active = ws.wsAddManualEstimation({
    name: "Dostawa", requiredUnits: 1, unitLabel: "", costMajor: 100,
  });
  eq("a cost with no project named goes to the active project", active.projectId, b.id);

  // An archived project takes no new lines — that is what archiving it meant.
  ws.tick();
  ws.wsArchiveProject(a.id, true);
  const refused = ws.wsAddManualEstimation({
    projectId: a.id, name: "Późna dostawa", requiredUnits: 1, unitLabel: "", costMajor: 60,
  });
  check("an archived project takes no other cost either", refused.projectId !== a.id,
    refused.projectId);
}

head("4c. deleting the project takes its costs and materials with it, and the undo brings them back");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const project = ws.wsProject(row.projectId);
  ws.wsAddManualEstimation({
    projectId: project.id, name: "Robocizna", requiredUnits: 1, unitLabel: "", costMajor: 500,
  });
  const before = ws.wsProjectCosts(project.id).total;
  eq("the project costs both halves", before, 74985 + 50000);

  ws.tick();
  const token = ws.wsDeleteProject(project.id);
  eq("nothing is left to cost", ws.wsProjectCosts(project.id).total, 0);
  ws.tick();
  ws.wsRestoreProject(token);
  eq("and the undo brings the whole bill back", ws.wsProjectCosts(project.id).total, before);
}

/* ------------------------------------------------------------------ 5. the page */

head("5. the build writes the frame the figures and the costs are drawn into");
{
  const { main } = projectsMain(DEFAULT_LANG, tr(DEFAULT_LANG), MAT_CATS, FEATURES);
  const needs = [
    // Chapter XVII's three figures, plus the count that was already there.
    "ws-project-count", "ws-project-mat", "ws-project-other", "ws-project-total",
    // The other costs: the list, the folded form and its two fields.
    "ws-project-other-list", "ws-other-add", "ws-other-form", "ws-other-name", "ws-other-cost",
    // The price on a material typed in by hand.
    "ws-mat-price",
  ];
  for (const id of needs) check(`the frame has #${id}`, main.includes(`id="${id}"`));

  check("the three figures are labelled in words",
    main.includes(tr(DEFAULT_LANG)("proj_cost_mat"))
    && main.includes(tr(DEFAULT_LANG)("proj_cost_other"))
    && main.includes(tr(DEFAULT_LANG)("proj_cost_sum")));
  check("the sum is the figure carrying the accent", main.includes("ws-project-sum"));
  check("the running total under the add form has somewhere to go",
    main.includes("data-mat-sum"));
  check("and the two numbers that make it are found by the same names the edit form uses",
    main.includes('data-f="quantity"') && main.includes('data-f="priceMajor"'));

  check("the other costs sit inside the project detail, not the index",
    main.indexOf("ws-project-other-list") > main.indexOf('id="ws-project-body"')
    && main.indexOf("ws-project-other-list") < main.indexOf('id="ws-index"'));
  check("and under the material list, which is what they are not",
    main.indexOf("ws-project-other-list") > main.indexOf("ws-project-materials"));

  for (const lang of LANGS) {
    const built = projectsMain(lang, tr(lang), MAT_CATS, FEATURES).main;
    check(`${lang}: the figures are in the page`, built.includes('id="ws-project-mat"'));
    check(`${lang}: labelled in that language`, built.includes(tr(lang)("proj_cost_sum")));
    check(`${lang}: the other costs form is in that language`, built.includes(tr(lang)("proj_other_add")));
    check(`${lang}: the price field is in that language`, built.includes(tr(lang)("proj_mat_price")));
    check(`${lang}: nothing in the frame shows a raw key`,
      !/\b(proj_cost_[a-z]+|proj_other_[a-z]+|proj_mat_price)\b/.test(built));
  }
}

head("6. the copy exists in all four languages");
{
  const KEYS = [
    "proj_mat_price", "proj_cost_mat", "proj_cost_other", "proj_cost_sum",
    "proj_other_d", "proj_other_add", "proj_other_empty",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
  }
  // A label copied from another language is the failure this catches: three figures that
  // all say "Koszt materiałów" would be worse than three untranslated keys, because the
  // page would look finished.
  for (const lang of LANGS) {
    const labels = ["proj_cost_mat", "proj_cost_other", "proj_cost_sum"].map((k) => DICT[lang][k]);
    eq(`${lang}: the three figures are three different labels`,
      new Set(labels).size, 3);
  }
  for (const key of ["proj_cost_sum", "proj_mat_price"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }
}

/* ============================================ 7. the money belongs to LiczMat Pro */

/**
 * assets/workspace-ui.js in Node, with the paywall's answer handed in.
 *
 * The two screens are drawn by string builders, so the rows can be asked directly what
 * they put on the page for a given level. `allow` is what pwAllows() answers; `undefined`
 * leaves the function off the page, which is the case the screens have to close on.
 */
function loadUi(allow) {
  const globals = {
    document: { readyState: "complete", addEventListener() {}, getElementById: () => null,
      documentElement: { lang: "pl" }, querySelector: () => null, querySelectorAll: () => [] },
    window: { LM_PROJ: { aisles: ["TILES", "OTHER"] } },
    location: { search: "", pathname: "/projekty/" },
    URLSearchParams: class { get() { return null; } },
    Intl,
    lmCurrency: () => "PLN",
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
    t: (key) => key,
  };
  // Left off the page entirely when `allow` is undefined: that is the case the screens
  // have to close on, and a stub always present would never let it be tested.
  if (allow !== undefined) globals.pwAllows = (feature) => Boolean(allow[feature]);
  return evalScript(["assets/workspace.js", "assets/workspace-calc.js", "assets/workspace-ui.js"],
    ["wsCanCost", "wsCanPdf", "wsEstimateRow", "wsMaterialRow"], {
      ...globals,
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      crypto: { randomUUID: () => "id-1" },
      CustomEvent: class { constructor(type) { this.type = type; } },
    });
}

head("7. a guest and a free account see the list and none of the money");
{
  const plan = evalScript(["assets/account.js", "assets/plan.js"],
    ["LM_FEATURES", "lmCan", "LM_LEVEL"], { document: undefined, localStorage: undefined });

  // The owner's decision of 2026-09-03, read out of the one place it is written down.
  eq("costs is a Pro feature", plan.LM_FEATURES.find((f) => f.id === "costs").level, plan.LM_LEVEL.PRO);
  eq("a guest may not see a price", plan.lmCan("costs", plan.LM_LEVEL.GUEST), false);
  eq("nor may a free account", plan.lmCan("costs", plan.LM_LEVEL.LICZMAT), false);
  eq("Pro may", plan.lmCan("costs", plan.LM_LEVEL.PRO), true);
  // And the half that stays free is the half chapter XVI is about: what to carry out of
  // the shop. A gate that took that away would be gating the product, not the price.
  eq("the material list without prices is still free",
    plan.lmCan("shopping", plan.LM_LEVEL.GUEST), true);

  // No paywall on the page at all is a refusal, not a pass.
  eq("with nothing to ask, the screens show no money", loadUi().wsCanCost(), false);
  eq("and offer no PDF either", loadUi().wsCanPdf(), false);
  eq("a level that reaches costs sees them", loadUi({ costs: true }).wsCanCost(), true);
  eq("the PDF needs its own permission on top", loadUi({ costs: true }).wsCanPdf(), false);
  eq("and with both, it is offered", loadUi({ costs: true, pdf: true }).wsCanPdf(), true);

  /* The rows themselves. This is the assertion the whole session is for: not that the
     amount is covered up, but that it was never written. */
  const line = {
    id: "e1", name: "Gres 60×60", requiredUnits: 12, unitLabel: "opak.",
    totalCostMinor: 24500, currencyCode: "PLN",
  };
  const shut = loadUi({});
  const open = loadUi({ costs: true, pdf: true });

  const shutRow = shut.wsEstimateRow(line, 0);
  check("an estimate row carries the name", shutRow.includes("Gres 60×60"));
  check("and the quantity", shutRow.includes("opak."));
  check("and no amount at all", !shutRow.includes("245.00") && !shutRow.includes("PLN"));
  const openRow = open.wsEstimateRow(line, 0);
  check("the same row priced for a Pro account", openRow.includes("245.00 PLN"));
  // Four cells instead of five: the column goes with the values, so no header is left
  // promising a figure that is not under it.
  eq("the free row is one cell shorter", (shutRow.match(/<td/g) || []).length,
    (openRow.match(/<td/g) || []).length - 1);

  const item = {
    id: "s1", name: "Klej", quantity: 7, unit: "opak.", estimatedCostMinor: 24500,
    currencyCode: "PLN", materialCategory: "TILES", isPurchased: false, note: "",
  };
  const shutItem = shut.wsMaterialRow(item);
  check("a material row is still the row somebody shops from", shutItem.includes("Klej"));
  check("with the quantity on it", shutItem.includes("7 opak."));
  check("and no unit price", !shutItem.includes("35.00"));
  check("and no line value", !shutItem.includes("245.00"));
  check("the same material priced for a Pro account",
    open.wsMaterialRow(item).includes("245.00 PLN"));

  /* The frame: the wall is in the markup from the first paint and the priced blocks ship
     shut, on both pages. */
  for (const lang of LANGS) {
    const projects = projectsMain(lang, tr(lang), MAT_CATS, FEATURES).main;
    check(`${lang}: /projekty/ carries the wall`, projects.includes('id="cost-gate"'));
    check(`${lang}: its three figures ship shut`, projects.includes('<div id="cost-tool" hidden>'));
    check(`${lang}: and so does "inne koszty"`,
      projects.includes('<section class="dash-sec" id="cost-other-tool" hidden>'));
    check(`${lang}: the count of calculations is not behind it`,
      projects.indexOf('id="ws-project-count"') < projects.indexOf('id="cost-gate"'));

    const estimate = estimateMain(lang, tr(lang), FEATURES).main;
    check(`${lang}: /kosztorys/ carries the wall`, estimate.includes('id="cost-gate"'));
    check(`${lang}: the two exports ship shut`, estimate.includes('<span id="cost-tool" hidden>'));
    // The page itself is not gated: chapter II keeps counting free, and the list of what
    // was counted is `shopping`.
    check(`${lang}: the estimate itself is not hidden`,
      estimate.includes('<article id="ws-estimate" class="ws-estimate">'));
    check(`${lang}: and the project picker stays out of the wall`,
      estimate.indexOf('id="ws-estimate-project"') < estimate.indexOf('id="cost-tool"'));
  }

  /* Every screen that writes an amount asks first. Named one by one, because a new
     priced row added without the question is exactly the defect this section exists for. */
  const ui = read("assets/workspace-ui.js");
  for (const fn of ["wsProjectRow", "wsRenderProjectLines", "wsMaterialRow", "wsMatSum",
    "wsRenderOtherCosts", "wsRenderProject", "wsEstimateRow", "wsRenderEstimate"]) {
    const at = ui.indexOf(`function ${fn}(`);
    check(`${fn}() is where it says it is`, at >= 0);
    if (at < 0) continue;
    check(`${fn}() asks whether it may print money`,
      ui.slice(at, at + 2600).includes("wsCanCost()"));
  }
  check("the CSV of a priced estimate asks too", ui.includes("if (!wsCanCost()) return;"));
  check("and an unpriced level cannot zero a price it cannot see",
    ui.includes("if (wsCanCost()) fields.costMajor = wsDecimal(get(\"cost\"));"));
}

head("7b. the store refuses to write a price, not only the screen");
{
  /* A gate that lives at the call site is a gate a second call site walks round, and one
     line typed into a console walks round faster than that. assets/workspace.js asks
     wsCanPrice() itself, so the four writes that take a typed amount answer to the plan
     wherever they are called from. */
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Łazienka");
  ws.wsSetActiveProject(project.id);

  // While the account reaches `costs`, everything is as it always was.
  const priced = ws.wsAddManualEstimation({
    projectId: project.id, name: "Wywóz gruzu", requiredUnits: 1, unitLabel: "", costMajor: 400,
  });
  eq("a Pro account types an amount onto a line", priced.totalCostMinor, 40000);
  const item = ws.wsAddOwnItem({
    projectId: project.id, name: "Klej", quantity: 7, unit: "opak.", priceMajor: 35,
  });
  eq("and onto a material", item.estimatedCostMinor, 24500);

  PW_ALLOW = false;
  try {
    const free = ws.wsAddManualEstimation({
      projectId: project.id, name: "Wywóz gruzu", requiredUnits: 1, unitLabel: "", costMajor: 400,
    });
    check("a level without costs still gets the line", Boolean(free) && free.name === "Wywóz gruzu");
    eq("with no money on it", free.totalCostMinor, 0);

    const freeItem = ws.wsAddOwnItem({
      projectId: project.id, name: "Fuga", quantity: 3, unit: "opak.", priceMajor: 29,
    });
    check("and still gets the material", Boolean(freeItem) && freeItem.name === "Fuga");
    eq("with no price on it", freeItem.estimatedCostMinor, 0);

    /* And a refusal never destroys what a Pro account already stored. A plan that lapses
       must not empty somebody's project: the amount is withheld, not deleted. */
    ws.wsUpdateEstimation(priced.id, { name: "Wywóz gruzu i kontener", costMajor: 999 });
    const after = ws.wsEstimations(project.id).find((r) => r.id === priced.id);
    eq("a correction still writes the name", after.name, "Wywóz gruzu i kontener");
    eq("and leaves the stored amount exactly where it was", after.totalCostMinor, 40000);

    ws.wsUpdateItem(item.id, { name: "Klej elastyczny", priceMajor: 999 });
    const afterItem = ws.wsItem(item.id);
    eq("the same for a material's name", afterItem.name, "Klej elastyczny");
    eq("and for the price on it", afterItem.estimatedCostMinor, 24500);
  } finally {
    PW_ALLOW = true;
  }

  const store = read("assets/workspace.js");
  check("the store has one place it asks", store.includes("function wsCanPrice()"));
  check("and it fails closed when the deciding file is absent",
    store.includes('typeof pwAllows === "function" && pwAllows("costs")'));
  /* What is deliberately NOT gated: the calculator's own result, saved from a calculator
     page. Those pages load no paywall at all, chapter II keeps counting free, and the
     figure is the engine's rather than something typed at a form — it is stored and never
     shown. A gate there would empty a project the visitor made before they paid. */
  const add = store.slice(store.indexOf("function wsAddEstimation"),
    store.indexOf("function wsAddManualEstimation"));
  check("a saved calculation is not gated", !add.includes("wsCanPrice()"));
  check("and the session hint is still never read in the store",
    !store.includes("lmReadLevel") && !store.includes("liczmat-signed-in"));

  /* The other half of a plan that moves: what is already on the screen. Hiding the blocks
     leaves the amounts inside them, so the screen is drawn again for the level it has
     just become. */
  const ui = read("assets/workspace-ui.js");
  check("signing in or out redraws the whole workspace",
    /addEventListener\("lm-session", \(\) => \{\s*[\r\n]+\s*wsGateMoneyFields\(\);\s*[\r\n]+\s*wsRenderWorkspace\(\);/.test(ui));
  check("and /kosztorys/ is drawn again too",
    /addEventListener\("lm-session", \(\) => \{ wsGateMoneyFields\(\); wsRenderEstimate\(\); \}\)/.test(ui));
}

/* ------------------------------------------------------------------ report */

console.log(`\ncosts: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
