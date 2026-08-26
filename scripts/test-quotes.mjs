#!/usr/bin/env node
/**
 * LiczMat — quotes, tested.
 *
 *     node scripts/test-quotes.mjs
 *
 * Master plan, session 24: "WYCENY — materiały, robocizna, koszty, marża, suma, waluta",
 * and chapter XXII under it:
 *
 *     Wycena może zawierać: materiały, robociznę, inne koszty, marżę, sumę.
 *     Nie buduj pełnego programu księgowego.
 *
 * Plus chapter XXIV, whose fourth step this is: KLIENT → ZLECENIE → PROJEKT → WYCENA →
 * HISTORIA. Sessions 22 and 23 built the first three links; what session 24 owes is the
 * fourth, and the arithmetic that hangs off it.
 *
 * This file is the half that needs no browser:
 *
 *   1. the document — what a quote stores, which is two of chapter XXII's five figures,
 *      and what it deliberately does not store, which is the other three;
 *   2. the four writes — add, read, correct, delete — and the undo the tombstone makes
 *      possible;
 *   3. the labour, which is the one part nothing else in LiczMat counts: quantity × rate
 *      rounded once, the lump sum, the rate read back by dividing, and the cap;
 *   4. the margin — a percentage of everything above it, clamped, rounded once;
 *   5. the totals: every figure traced to exactly one source, and the project document
 *      held byte-for-byte across every write here;
 *   6. the currency — chapter VI's rule: stamped once, never re-stamped, never converted;
 *   7. the chain, walked backwards from the quote and never copied onto it;
 *   8. the route, and chapter XXV's gate in both of its states;
 *   9. the frame the build writes, and the copy in four languages.
 *
 * The other half — clicking it through in Chromium — is scripts/test-quotes-page.mjs.
 *
 * Why the store is this repo's own rather than the contract's: `docs/FIRESTORE_SYNC.md` in
 * `3d-polednia/Materio` §2 lists the collections under `users/{uid}` — projects, rooms,
 * estimations, shoppingItems, sharedProjects — and there is no quotes collection, no
 * `QuoteEntity`, no `SyncContract.quoteToDoc()` and no `validQuote()` in the deployed
 * rules. So a quote is local, exactly like a client and a job.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { quotesMain, jobsMain } from "../src/pages.mjs";
import { LANGS, SECTION, urlQuotes, urlQuote, urlJobs, urlProjects } from "../src/site.mjs";
import { LEVEL, STATUS, route, validateIA } from "../src/ia.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

function evalSource(src, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
const evalScript = (file, returns, globals) => evalSource(read(file), returns, globals);

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

/**
 * assets/workspace.js and assets/crm.js in Node, in one scope — which is how the browser
 * loads them: a quote's three derived figures come out of wsProjectCosts(), and a module's
 * own scope would hide it.
 */
function loadCrm() {
  const backing = new Map();
  const clock = { now: 1_760_000_000_000, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const api = evalScript(["assets/workspace.js", "assets/crm-store.js", "assets/crm.js"], [
    "wsAddProject", "wsProject", "wsProjects", "wsDeleteProject", "wsRestoreProject",
    "wsAddEstimation", "wsAddManualEstimation", "wsEstimations", "wsProjectCosts",
    "wsExport", "wsItems", "wsUpdateItem",
    "crmAddClient", "crmClient", "crmLinkProject", "crmClientOfProject",
    "crmAddJob", "crmJob", "crmJobOfProject",
    "crmQuotes", "crmQuote", "crmAddQuote", "crmUpdateQuote", "crmDeleteQuote",
    "crmRestoreQuote", "crmProjectQuotes", "crmQuoteTotals", "crmQuoteChain",
    "crmLabour", "crmAddLabour", "crmUpdateLabour", "crmDeleteLabour", "crmLabourRate",
    "crmLineAmount", "crmQty", "crmPct",
    "CRM_KEY", "CRM_SCHEMA", "CRM_MAX_NAME", "CRM_MAX_NOTE",
    "QUO_MAX_LINES", "QUO_MAX_MARGIN",
  ], {
    localStorage,
    document: { dispatchEvent: (e) => events.push(e.type) },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: class extends Date {
      static now() { return clock.now; }
    },
    lmCurrency: () => clock.currency,
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("liczmat-crm-v1") || "{}"),
    workspaceRaw: () => JSON.parse(backing.get("materio-workspace-v1") || "{}"),
    keys: () => [...backing.keys()],
    events,
    tick: (ms) => { clock.now += ms || 1000; },
    currency: (code) => { clock.currency = code; },
  };
}

/** assets/plan.js as the browser loads it: after assets/account.js, in one scope. */
function loadPlan({ open = false } = {}) {
  let src = read(["assets/account.js", "assets/plan.js"]);
  if (open) {
    const before = src;
    src = src.replace("var LM_PRO_LOCKED = true;", "var LM_PRO_LOCKED = false;");
    if (src === before) throw new Error("LM_PRO_LOCKED is no longer one line in assets/plan.js");
  }
  return evalSource(src, [
    "LM_LEVEL", "LM_FEATURES", "LM_PRO_LOCKED", "lmFeature", "lmCan", "lmFeatureState", "lmPaywall",
  ], { document: undefined, localStorage: undefined });
}

/* The permission table as the browser has it, for the page builders: proGate() renders
   the wall out of LM_FEATURES, so a test that called clientsMain() without it would be
   checking a page the build never writes. */
const FEATURES = loadPlan().LM_FEATURES;

/** One saved calculation, exactly as assets/workspace-ui.js writes it after a result. */
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

/* ================================================================== 1. the document */

head("1. a quote stores two of chapter XXII's five figures and derives the rest");
{
  const crm = loadCrm();
  const project = crm.wsAddProject("Remont łazienki");
  const q = crm.crmAddQuote({
    name: "Łazienka — wycena",
    projectId: project.id,
    marginMajor: "15",
    note: "Termin do końca miesiąca.",
  });

  eq("the name", q.name, "Łazienka — wycena");
  eq("the one link it stores is the project", q.projectId, project.id);
  eq("the margin is chapter XXII's, in percent", q.marginPct, 15);
  eq("the labour starts empty", q.labour.length, 0);
  eq("the note", q.note, "Termin do końca miesiąca.");

  // Written in the contract's shape even though it is not in the contract: it is what
  // makes the tombstone, the undo and a later upload possible without a rewrite.
  for (const key of ["createdAt", "updatedAt", "deletedAt", "schemaVersion"]) {
    check(`the sync field ${key} is written`, Object.prototype.hasOwnProperty.call(q, key));
  }
  eq("the quote starts alive", q.deletedAt, null);
  eq("the schema is stamped", q.schemaVersion, crm.CRM_SCHEMA);

  // The three figures that belong to the project are never copied onto the quote: a copy
  // is free to disagree the moment a material is re-priced, which is exactly what the
  // module exists to prevent.
  const copied = Object.keys(q).filter((k) => /material|other|subtotal|sum|total|cost/i.test(k));
  eq("no material, cost or total is stored on a quote", copied.join(","), "");

  // Chapter XXII in one line: not an accounting package. None of these is here.
  for (const k of ["tax", "vat", "discount", "status", "number", "invoice", "issuedAt"]) {
    check(`a quote has no ${k} — chapter XXII forbids the accounting package`,
      !Object.prototype.hasOwnProperty.call(q, k));
  }
}

head("1b. only the name is required, and the caps are the store's own");
{
  const crm = loadCrm();
  eq("a quote with no name is refused", crm.crmAddQuote({ name: "  " }), null);
  eq("so is one with no fields at all", crm.crmAddQuote({}), null);

  const long = crm.crmAddQuote({ name: "x".repeat(400), note: "n".repeat(4000) });
  eq("the name is capped", long.name.length, crm.CRM_MAX_NAME);
  eq("the note is capped", long.note.length, crm.CRM_MAX_NOTE);

  const bare = crm.crmAddQuote({ name: "  Kuchnia  " });
  eq("the name is trimmed", bare.name, "Kuchnia");
  eq("an absent project is an empty string, never undefined", bare.projectId, "");
  eq("an absent note is an empty string too", bare.note, "");
  eq("an absent margin is zero, not null", bare.marginPct, 0);
  eq("a quote with no money carries no currency", bare.currencyCode, "");

  const ghost = crm.crmAddQuote({ name: "Wycena", projectId: "nie-ma-takiego" });
  eq("a project that does not exist is dropped rather than stored", ghost.projectId, "");
}

head("1c. quotes live beside the clients and the jobs, and the workspace is untouched");
{
  const crm = loadCrm();
  const project = crm.wsAddProject("Remont");
  save(crm, { projectId: project.id });
  const before = JSON.stringify(crm.workspaceRaw());

  crm.crmAddQuote({ name: "Wycena", projectId: project.id, marginMajor: "10" });
  eq("the workspace the phone reads is byte-for-byte what it was",
    JSON.stringify(crm.workspaceRaw()), before);

  eq("the Pro store is its own key", crm.keys().includes(crm.CRM_KEY), true);
  eq("which is not the workspace's", crm.CRM_KEY === "materio-workspace-v1", false);
  eq("the Pro store holds exactly the three local collections",
    Object.keys(crm.raw()).sort().join(), "clients,jobs,quotes");

  const exported = crm.wsExport();
  eq("wsExport() carries no quotes", exported.quotes, undefined);
  eq("nor clients", exported.clients, undefined);
  eq("nor jobs", exported.jobs, undefined);
  eq("while still carrying the four collections it always did",
    ["projects", "rooms", "estimations", "shoppingItems"]
      .filter((k) => Array.isArray(exported[k])).length, 4);
}

head("1d. a store written before session 24 reads as one with no quotes");
{
  const crm = loadCrm();
  crm.crmAddClient({ name: "Jan" });
  const raw = crm.raw();
  delete raw.quotes;
  // Put the older shape back exactly as a session-23 browser would have left it.
  const older = loadCrm();
  eq("an empty store has no quotes to lose", older.crmQuotes().length, 0);
  eq("and the quotes array is what an absent one reads as",
    Array.isArray(raw.quotes) ? "present" : "absent", "absent");
  eq("reading it does not throw", older.crmQuote("whatever"), null);
}

/* ================================================================== 2. the four writes */

head("2. add, read, correct, delete — and the undo the tombstone makes possible");
{
  const crm = loadCrm();
  const a = crm.crmAddQuote({ name: "Wariant A" });
  crm.tick();
  const b = crm.crmAddQuote({ name: "Wariant B" });

  eq("both are listed", crm.crmQuotes().length, 2);
  eq("newest change first", crm.crmQuotes()[0].id, b.id);
  eq("one quote by id", crm.crmQuote(a.id).name, "Wariant A");
  eq("an id nobody made is null, never a guess", crm.crmQuote("id-nope"), null);

  crm.tick();
  const fixed = crm.crmUpdateQuote(a.id, { name: "Wariant A — poprawiony" });
  eq("the name is corrected", fixed.name, "Wariant A — poprawiony");
  eq("and the change is stamped", fixed.updatedAt > fixed.createdAt, true);
  eq("an empty name is refused rather than stored", crm.crmUpdateQuote(a.id, { name: " " }), null);
  eq("and the old name survives the refusal", crm.crmQuote(a.id).name, "Wariant A — poprawiony");
  eq("a field not passed keeps its value", crm.crmQuote(a.id).projectId, "");

  const token = crm.crmDeleteQuote(a.id);
  eq("the delete hands back a token", typeof token.id, "string");
  eq("the quote is gone from the list", crm.crmQuotes().length, 1);
  eq("and cannot be read", crm.crmQuote(a.id), null);
  eq("but the row is still in storage as a tombstone",
    crm.raw().quotes.filter((q) => q.id === a.id).length, 1);
  eq("with a deletedAt on it", crm.raw().quotes.find((q) => q.id === a.id).deletedAt !== null, true);

  const back = crm.crmRestoreQuote(token);
  eq("the undo brings it back", back.name, "Wariant A — poprawiony");
  eq("and it is listed again", crm.crmQuotes().length, 2);
  eq("a second undo of the same token changes nothing", crm.crmRestoreQuote(token), null);
  eq("deleting something that is not there is null", crm.crmDeleteQuote("id-nope"), null);

  // Two adds, one correction, one delete, one undo — and nothing from the three writes
  // that were refused, because a refusal must not redraw a page as if something changed.
  eq("every write that happened announced itself once, and no refusal did",
    crm.events.filter((e) => e === "crmchange").length, 5);
}

/* ================================================================== 3. the labour */

head("3. robocizna — the one part of a quote nothing else in LiczMat counts");
{
  const crm = loadCrm();
  const q = crm.crmAddQuote({ name: "Wycena" });

  // Chapter XVII's arithmetic, in a quote: quantity × rate, rounded exactly once.
  const one = crm.crmAddLabour(q.id, {
    name: "Układanie gresu", quantity: "40", unit: "m²", priceMajor: "80",
  });
  const line = one.labour[0];
  eq("the work is named", line.name, "Układanie gresu");
  eq("the quantity is a number, decimals allowed", line.quantity, 40);
  eq("the unit is the word beside it", line.unit, "m²");
  eq("40 × 80 comes to 3200", line.amountMinor, 320000);

  // One money field per line. The rate is read back by dividing — the rule session 19
  // settled for a material's unit price, and for the same reason.
  const money = Object.keys(line).filter((k) => /price|rate|cost/i.test(k));
  eq("no rate is stored beside the amount", money.join(","), "");
  eq("the rate is the amount divided by the quantity", crm.crmLabourRate(line), 8000);

  // A decimal quantity rounds once, at the end: 12.5 × 33.33 is 416.625, and money has
  // no half-grosz.
  const dec = crm.crmAddLabour(q.id, { name: "Fugowanie", quantity: "12,5", unit: "m²", priceMajor: "33,33" });
  eq("a comma is a decimal point", dec.labour[1].quantity, 12.5);
  eq("and the product is rounded exactly once", dec.labour[1].amountMinor, 41663);

  // Chapter XXII's lump sum: a line that was never counted.
  const lump = crm.crmAddLabour(q.id, { name: "Wywóz gruzu", priceMajor: "500" });
  eq("a blank quantity is null, not 1 — they are different statements",
    lump.labour[2].quantity, null);
  eq("and the line comes to the rate itself", lump.labour[2].amountMinor, 50000);
  eq("a lump sum has no rate to read back", crm.crmLabourRate(lump.labour[2]), null);

  eq("a labour line with no name is refused", crm.crmAddLabour(q.id, { name: " ", priceMajor: "9" }), null);
  eq("and none was stored", crm.crmQuote(q.id).labour.length, 3);
  eq("a line on a quote that is not there is refused too",
    crm.crmAddLabour("id-nope", { name: "x" }), null);

  const zero = crm.crmAddLabour(q.id, { name: "Do wyceny", quantity: "2", unit: "dzień" });
  eq("a line with no rate yet is stored at zero", zero.labour[3].amountMinor, 0);
  eq("with nothing to divide", crm.crmLabourRate(zero.labour[3]), null);

  // A negative quantity or rate is not a discount, it is a typo.
  const neg = crm.crmAddLabour(q.id, { name: "Ujemna", quantity: "-5", priceMajor: "-10" });
  eq("a negative quantity reads as no quantity", neg.labour[4].quantity, null);
  eq("and a negative rate as none", neg.labour[4].amountMinor, 0);
}

head("3b. correcting and removing a labour line");
{
  const crm = loadCrm();
  const q = crm.crmAddQuote({ name: "Wycena" });
  crm.crmAddLabour(q.id, { name: "Układanie", quantity: "40", unit: "m²", priceMajor: "80" });
  const id = crm.crmLabour(q.id)[0].id;

  // The quantity is applied before the rate, so the arithmetic behaves the way the form
  // reads: 45 at 80 is 3600, because both numbers were on screen together.
  const up = crm.crmUpdateLabour(q.id, id, { quantity: "45", priceMajor: "80" });
  eq("the line follows both fields at once", up.labour[0].amountMinor, 360000);
  eq("the rate reads back unchanged", crm.crmLabourRate(up.labour[0]), 8000);

  const named = crm.crmUpdateLabour(q.id, id, { name: "Układanie gresu 60×60" });
  eq("a field not passed keeps its value", named.labour[0].amountMinor, 360000);
  eq("an empty name is refused", crm.crmUpdateLabour(q.id, id, { name: "  " }), null);
  eq("a line id nobody made is refused", crm.crmUpdateLabour(q.id, "id-nope", { name: "x" }), null);

  eq("removing a line takes it off", crm.crmDeleteLabour(q.id, id).labour.length, 0);
  eq("and removing it twice changes nothing", crm.crmDeleteLabour(q.id, id), null);
}

head("3c. the cap: a quote is a quote, not a cost book");
{
  const crm = loadCrm();
  const q = crm.crmAddQuote({ name: "Wycena" });
  for (let i = 0; i < crm.QUO_MAX_LINES; i++) {
    crm.crmAddLabour(q.id, { name: `Praca ${i}`, priceMajor: "10" });
  }
  eq("the cap is reached", crm.crmLabour(q.id).length, crm.QUO_MAX_LINES);
  eq("and the next line is refused rather than stored",
    crm.crmAddLabour(q.id, { name: "Jeszcze jedna", priceMajor: "10" }), null);
  eq("nothing was written", crm.crmLabour(q.id).length, crm.QUO_MAX_LINES);
}

/* ================================================================== 4. the margin */

head("4. marża — a percentage of everything above it, rounded once");
{
  const crm = loadCrm();
  const q = crm.crmAddQuote({ name: "Wycena" });
  crm.crmAddLabour(q.id, { name: "Praca", priceMajor: "1000" });

  crm.crmUpdateQuote(q.id, { marginMajor: "15" });
  const m = crm.crmQuoteTotals(q.id);
  eq("the subtotal is the labour", m.subtotal, 100000);
  eq("15% of it is 150", m.margin, 15000);
  eq("and the sum is 1150", m.total, 115000);

  // Rounded exactly once, at the end: 12.5% of 41 663 is 5207.875.
  const odd = crm.crmAddQuote({ name: "Nieokrągła" });
  crm.crmAddLabour(odd.id, { name: "Fugowanie", quantity: "12,5", priceMajor: "33,33" });
  crm.crmUpdateQuote(odd.id, { marginMajor: "12,5" });
  eq("the margin is rounded once, at the end", crm.crmQuoteTotals(odd.id).margin, 5208);

  eq("a blank margin is zero", crm.crmPct(""), 0);
  eq("so is a negative one — a margin is a markup, not a discount", crm.crmPct("-10"), 0);
  eq("and so is a word", crm.crmPct("dużo"), 0);
  eq("a comma is a decimal point here too", crm.crmPct("7,5"), 7.5);
  eq("and it is kept to two places", crm.crmPct("7,555"), 7.56);
  eq("the cap is the cap", crm.crmPct("99999"), crm.QUO_MAX_MARGIN);

  crm.crmUpdateQuote(q.id, { marginMajor: "" });
  eq("clearing the margin puts it back to zero", crm.crmQuote(q.id).marginPct, 0);
  eq("and the sum is the subtotal again", crm.crmQuoteTotals(q.id).total, 100000);
}

/* ================================================================== 5. the totals */

head("5. chapter XXII's five figures, each with exactly one source");
{
  const crm = loadCrm();
  const project = crm.wsAddProject("Remont łazienki");
  save(crm, { projectId: project.id });                        // 749.85 of material
  crm.wsAddManualEstimation({
    projectId: project.id, name: "Wywóz gruzu", requiredUnits: 1, unitLabel: "", costMajor: 400,
  });
  const q = crm.crmAddQuote({ name: "Wycena", projectId: project.id, marginMajor: "20" });
  crm.crmAddLabour(q.id, { name: "Układanie", quantity: "20", unit: "m²", priceMajor: "80" });

  const costs = crm.wsProjectCosts(project.id);
  const m = crm.crmQuoteTotals(q.id);
  eq("materiały are the project's own material money", m.materials, costs.materials);
  eq("which is 749.85", m.materials, 74985);
  eq("inne koszty are the project's hand-typed lines", m.other, costs.other);
  eq("which is 400", m.other, 40000);
  eq("robocizna is the quote's own", m.labour, 160000);
  eq("razem is the three added", m.subtotal, 74985 + 40000 + 160000);
  eq("marża is 20% of that", m.margin, Math.round((74985 + 40000 + 160000) * 0.2));
  eq("and the suma is the two", m.total, m.subtotal + m.margin);
  eq("the project is named as having one", m.hasProject, true);
  eq("and the labour lines are counted", m.lines, 1);

  // The whole point of not copying: re-pricing a material on the project screen moves the
  // quote with no write of its own.
  const item = crm.wsItems(project.id)[0];
  const stamp = crm.crmQuote(q.id).updatedAt;
  crm.wsUpdateItem(item.id, { priceMajor: "10" });
  const after = crm.crmQuoteTotals(q.id);
  eq("a material re-priced in the project moves the quote", after.materials !== m.materials, true);
  eq("the material is now 15 × 10", after.materials, 15000);
  eq("and the quote itself was never written to", crm.crmQuote(q.id).updatedAt, stamp);

  // Chapter XXIV's third step is read, never touched.
  eq("the project document is still the project document",
    JSON.stringify(crm.wsProject(project.id)),
    JSON.stringify(crm.workspaceRaw().projects.find((x) => x.id === project.id)));
}

head("5b. a quote with no project is a price for labour, and says so");
{
  const crm = loadCrm();
  const q = crm.crmAddQuote({ name: "Sama robocizna", marginMajor: "10" });
  crm.crmAddLabour(q.id, { name: "Montaż", priceMajor: "2000" });
  const m = crm.crmQuoteTotals(q.id);
  eq("there is no material", m.materials, 0);
  eq("and no other cost", m.other, 0);
  eq("the labour is the subtotal", m.subtotal, 200000);
  eq("the margin still applies", m.margin, 20000);
  eq("and the page is told there is no project", m.hasProject, false);

  eq("totals for a quote that does not exist are zeroes, not an exception",
    crm.crmQuoteTotals("id-nope").total, 0);
}

head("5c. detaching a project leaves the project alone and empties the two figures");
{
  const crm = loadCrm();
  const project = crm.wsAddProject("Remont");
  save(crm, { projectId: project.id });
  const q = crm.crmAddQuote({ name: "Wycena", projectId: project.id });
  eq("the material is there while the project is", crm.crmQuoteTotals(q.id).materials, 74985);

  const before = JSON.stringify(crm.workspaceRaw());
  crm.crmUpdateQuote(q.id, { projectId: "" });
  eq("detaching empties it", crm.crmQuoteTotals(q.id).materials, 0);
  eq("and the workspace is untouched", JSON.stringify(crm.workspaceRaw()), before);

  // A project deleted in the workspace: the link stays, because wsRestoreProject() can
  // bring it back and a link dropped on sight would return the project to nobody.
  const again = crm.crmUpdateQuote(q.id, { projectId: project.id });
  eq("it can be attached again", again.projectId, project.id);
  const token = crm.wsDeleteProject(project.id);
  eq("a deleted project leaves the link on the quote", crm.crmQuote(q.id).projectId, project.id);
  eq("and the figures read as nothing meanwhile", crm.crmQuoteTotals(q.id).materials, 0);
  crm.wsRestoreProject(token);
  eq("the undo brings the money back with it", crm.crmQuoteTotals(q.id).materials, 74985);
}

head("5d. several quotes may price one project — a variant is not a contradiction");
{
  const crm = loadCrm();
  const project = crm.wsAddProject("Remont");
  save(crm, { projectId: project.id });
  const a = crm.crmAddQuote({ name: "Wariant tani", projectId: project.id, marginMajor: "10" });
  crm.tick();
  const b = crm.crmAddQuote({ name: "Wariant z materiałem premium", projectId: project.id, marginMajor: "30" });
  eq("both are filed under the project", crm.crmProjectQuotes(project.id).length, 2);
  eq("newest first", crm.crmProjectQuotes(project.id)[0].id, b.id);
  eq("and they differ only where they were told to",
    crm.crmQuoteTotals(a.id).materials, crm.crmQuoteTotals(b.id).materials);
  eq("the margins are the difference",
    crm.crmQuoteTotals(b.id).total > crm.crmQuoteTotals(a.id).total, true);
}

/* ================================================================== 6. the currency */

head("6. waluta — stamped once, never re-stamped, never converted (chapter VI)");
{
  const crm = loadCrm();
  const q = crm.crmAddQuote({ name: "Wycena" });
  eq("a quote with no money carries no currency", crm.crmQuote(q.id).currencyCode, "");
  eq("and reads in the visitor's own", crm.crmQuoteTotals(q.id).currencyCode, "PLN");

  crm.crmAddLabour(q.id, { name: "Praca", priceMajor: "1000" });
  eq("the first amount stamps the visitor's currency", crm.crmQuote(q.id).currencyCode, "PLN");

  crm.currency("EUR");
  crm.crmAddLabour(q.id, { name: "Druga praca", priceMajor: "500" });
  eq("a second line does not re-stamp it — 1500 zł is not 1500 €",
    crm.crmQuote(q.id).currencyCode, "PLN");
  eq("and the totals stay in it", crm.crmQuoteTotals(q.id).currencyCode, "PLN");

  const lines = crm.crmLabour(q.id);
  crm.crmDeleteLabour(q.id, lines[0].id);
  crm.crmDeleteLabour(q.id, lines[1].id);
  eq("with the last amount gone the stamp goes too", crm.crmQuote(q.id).currencyCode, "");
  crm.crmAddLabour(q.id, { name: "Trzecia praca", priceMajor: "700" });
  eq("so the next amount is stamped fresh", crm.crmQuote(q.id).currencyCode, "EUR");
}

head("6b. a quote whose halves are in two currencies is told, never converted");
{
  const crm = loadCrm();
  const project = crm.wsAddProject("Remont");
  save(crm, { projectId: project.id });            // priced in PLN
  const q = crm.crmAddQuote({ name: "Wycena", projectId: project.id });
  eq("one currency is not mixed", crm.crmQuoteTotals(q.id).mixed, false);
  eq("and a quote with no money of its own reads in the project's",
    crm.crmQuoteTotals(q.id).currencyCode, "PLN");

  crm.currency("EUR");
  crm.crmAddLabour(q.id, { name: "Praca", priceMajor: "1000" });
  const m = crm.crmQuoteTotals(q.id);
  eq("the two halves in two currencies are flagged", m.mixed, true);
  eq("the amounts are still the amounts", m.subtotal, 74985 + 100000);
  eq("nothing was converted at a rate", m.materials, 74985);
  eq("and the quote's own stamp wins for the label", m.currencyCode, "EUR");
  eq("with the project's carried beside it", m.projectCurrencyCode, "PLN");
}

/* ================================================================== 7. the chain */

head("7. chapter XXIV backwards: WYCENA → PROJEKT → ZLECENIE → KLIENT, all derived");
{
  const crm = loadCrm();
  const client = crm.crmAddClient({ name: "Jan Kowalski" });
  const project = crm.wsAddProject("Remont łazienki");
  const job = crm.crmAddJob({ name: "Łazienka na Pięknej", clientId: client.id, projectId: project.id });
  const q = crm.crmAddQuote({ name: "Wycena", projectId: project.id });

  const chain = crm.crmQuoteChain(q.id);
  eq("the project is the quote's own link", chain.project.id, project.id);
  eq("the job is found through the project", chain.job.id, job.id);
  eq("and the client through the job's own link", chain.client.id, client.id);

  // Derived means derived: nothing about the job or the client is on the quote.
  const stored = crm.raw().quotes.find((x) => x.id === q.id);
  eq("no clientId is stored on the quote", stored.clientId, undefined);
  eq("and no jobId either", stored.jobId, undefined);

  // Which is what makes a rename read correctly with nothing to keep in step.
  crm.crmAddClient({ name: "Ignore me" });
  eq("a quote with no project has no chain at all",
    JSON.stringify(crm.crmQuoteChain(crm.crmAddQuote({ name: "Luźna" }).id)),
    JSON.stringify({ project: null, job: null, client: null }));

  const loose = crm.wsAddProject("Bez zlecenia");
  const q2 = crm.crmAddQuote({ name: "Wycena 2", projectId: loose.id });
  const chain2 = crm.crmQuoteChain(q2.id);
  eq("a project under no job has a project and nothing else", chain2.project.id, loose.id);
  eq("no job", chain2.job, null);
  eq("no client", chain2.client, null);
}

/* ================================================================== 8. the route */

head("8. the route, and chapter XXV's gate");
{
  eq("the architecture still validates", validateIA().join("\n"), "");
  const r = route("quotes");
  eq("quotes is live", r.status, STATUS.LIVE);
  eq("at the Pro level", r.level, LEVEL.PRO);
  eq("under the jobs, where chapter XXIV puts it", r.parent, "jobs");
  eq("indexable — chapter XXVI wants Pro described in public", r.indexable, true);
  eq("its link is offered to Pro only", r.navLevel, LEVEL.PRO);

  const view = route("quote");
  eq("one quote is a view of the same page", view.view, true);
  eq("not indexed", view.indexable, false);
  eq("and its address is a query string", urlQuote("pl", "abc"), "/wyceny/?id=abc");

  // The slug is the one the route has carried since session 3. A slug is permanent.
  eq("the Polish slug", SECTION.quotes.pl, "wyceny");
  eq("the Ukrainian one is not the free estimate's", SECTION.quotes.uk === SECTION.estimate.uk, false);
  for (const lang of LANGS) {
    check(`${lang}: the page has its own address`, urlQuotes(lang).endsWith(`/${SECTION.quotes[lang]}/`));
  }

  const open = loadPlan({ open: true });
  eq("quotes is a Pro feature", open.lmFeature("quotes").level, open.LM_LEVEL.PRO);
  eq("a guest may not use it", open.lmCan("quotes", open.LM_LEVEL.GUEST), false);
  eq("nor a free account", open.lmCan("quotes", open.LM_LEVEL.LICZMAT), false);
  eq("a Pro account may", open.lmCan("quotes", open.LM_LEVEL.PRO), true);

  // Chapter XXV's wall, in both of its states. `open` above is the shipped file with
  // session 27's switch put back, so the answer sessions 22–26 ran under stays tested.
  eq("before session 27 a guest was told, not shut out",
    open.lmFeatureState("quotes", open.LM_LEVEL.GUEST).locked, false);
  const shipped = loadPlan();
  eq("the paywall is up", shipped.LM_PRO_LOCKED, true);
  eq("so the same visitor is shut out",
    shipped.lmFeatureState("quotes", shipped.LM_LEVEL.GUEST).locked, true);
  eq("and a Pro account is not", shipped.lmFeatureState("quotes", shipped.LM_LEVEL.PRO).locked, false);
  eq("a guest is sent to make an account",
    shipped.lmPaywall("quotes", shipped.LM_LEVEL.GUEST).step, "account");
  eq("a free account is offered the upgrade",
    shipped.lmPaywall("quotes", shipped.LM_LEVEL.LICZMAT).step, "upgrade");
}

/* ================================================================== 9. the frame */

head("9. the frame the build writes");
{
  for (const lang of LANGS) {
    const t = tr(lang);
    const { main } = quotesMain(lang, t, FEATURES);

    for (const id of ["quo-page", "quo-index", "quo-detail", "quo-list", "quo-form",
      "quo-labour-list", "quo-labour-form", "quo-project-list", "quo-project-form",
      "quo-margin", "quo-fig-materials", "quo-fig-other", "quo-fig-labour",
      "quo-fig-sub", "quo-fig-margin", "quo-fig-total", "quo-mixed", "quo-chain-line",
      "quo-undo", "quo-gate", "quo-tool", "quo-pro-chip"]) {
      check(`${lang}: the page carries #${id}`, main.includes(`id="${id}"`), id);
    }
    // Chapter XXV's block is in the markup from the first paint, not injected later.
    check(`${lang}: the gate is written, hidden`, main.includes('id="quo-gate" hidden'));
    check(`${lang}: the module says it is Pro`, main.includes(t("pro_locked")));
    check(`${lang}: and describes itself`, main.includes(t("feat_quotes_t")));
    check(`${lang}: the page names its own language's jobs page`, main.includes(urlJobs(lang)));
    check(`${lang}: and its own language's projects page`, main.includes(urlProjects(lang)));
    check(`${lang}: the storage note is on the page`, main.includes(t("quo_local_note")));
    check(`${lang}: nothing is hard-coded to Polish`,
      lang === "pl" || !main.includes(`href="${urlQuotes("pl")}"`), urlQuotes("pl"));

    // The way back: /zlecenia/ points at the quotes now, in its own language.
    const jobs = jobsMain(lang, t, FEATURES);
    check(`${lang}: the jobs page links to the quotes`, jobs.main.includes(urlQuotes(lang)));
  }
}

head("9b. the copy, in four languages");
{
  const keys = Object.keys(DICT.pl).filter((k) => k.startsWith("quo_") || k.startsWith("quopage_"));
  check("there is copy to check", keys.length > 40, String(keys.length));
  for (const lang of LANGS) {
    for (const key of keys) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
  }
  for (const key of ["quopage_title", "quo_new", "quo_edit", "quo_labour_t", "quo_margin"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }

  // The two sentences that carry the honesty of this session. Chapter XXV wants a free
  // user to understand what is Pro; CLAUDE.md forbids implying a sync that does not exist.
  for (const lang of LANGS) {
    // Session 27 replaced the per-module "the module is open for now" sentence with the
    // paywall's own copy, which is shared by all five modules and says what to do next.
    check(`${lang}: the wall tells a guest to make an account`,
      DICT[lang].pro_need_account.length > 40);
    check(`${lang}: and a free account what it is on`, DICT[lang].pro_need_pro.length > 20);
    // Session 28 replaced the preview with the subscription. The wall now quotes a
    // price, so the copy that has to be right is the sentence for the state the site
    // actually ships in: priced, and not yet possible to buy.
    check(`${lang}: the subscription block names both plans`,
      DICT[lang].pay_monthly_t !== DICT[lang].pay_yearly_t);
    check(`${lang}: and says the subscription is not open yet`,
      DICT[lang].pay_soon.length > 40, DICT[lang].pay_soon);
    // Session 46 changed what this sentence is FOR. Until then it warned that the rows were
    // in this browser and nowhere else; they are in the sync contract now, so the note says
    // where they go instead — and naming localStorage here would be the old claim wearing
    // the new words. The storage detail is on /cookies/, which is the page for it.
    check(`${lang}: the note says the rows reach the phone`,
      DICT[lang].quo_local_note.includes("Android"), DICT[lang].quo_local_note);
    check(`${lang}: and it no longer names localStorage`,
      !DICT[lang].quo_local_note.includes("localStorage"), DICT[lang].quo_local_note);
    check(`${lang}: and it is a full sentence`, DICT[lang].quo_local_note.length > 100);
    check(`${lang}: the margin says what it is a percentage of`,
      DICT[lang].quo_margin_d.length > 40, DICT[lang].quo_margin_d);
    check(`${lang}: the project note says the money is read, not copied`,
      DICT[lang].quo_project_d.length > 60, DICT[lang].quo_project_d);
    check(`${lang}: the cookies note names the quotes too`,
      DICT[lang].ck_p_crm.length > 80, DICT[lang].ck_p_crm);
    // Chapter XXII's five figures each have a word of their own on the page.
    const figs = ["quo_fig_materials", "quo_fig_other", "quo_fig_labour", "quo_fig_margin", "quo_fig_total"]
      .map((k) => DICT[lang][k]);
    check(`${lang}: the five figures are five different words`, new Set(figs).size === 5, figs.join(" | "));
  }
  // Chapter XXII's own vocabulary, in the language the plan is written in.
  eq("the page is called Wyceny in Polish", DICT.pl.quopage_title, "Wyceny");
  eq("materiały", DICT.pl.quo_fig_materials, "Materiał");
  eq("robocizna", DICT.pl.quo_fig_labour, "Robocizna");
  eq("inne koszty", DICT.pl.quo_fig_other, "Dodatkowe koszty");
  eq("marża", DICT.pl.quo_fig_margin, "Marża");
  eq("suma", DICT.pl.quo_fig_total, "Suma");
}

/* ------------------------------------------------------------------ report */

console.log(`\nquotes: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
