#!/usr/bin/env node
/**
 * LiczMat — the material list of a project, tested.
 *
 *     node scripts/test-materials.mjs
 *
 * Master plan, session 17: "LISTY MATERIAŁÓW — materiały w projektach", and chapter XVI
 * under it: KALKULATOR → WYNIK → DODAJ DO PROJEKTU → **MATERIAŁ TRAFIA DO LISTY**, with the
 * example "Płytki | 26,4 m², Klej | 7 worków, Fuga | 4 kg".
 *
 * This file is the half that needs no browser:
 *
 *   1. the document — every field the sync contract names, nothing else, inside the limits
 *      the deployed security rules validate;
 *   2. the arrow — a saved calculation puts exactly one material on the list of exactly the
 *      project it landed in, linked back to it by `estimationId`;
 *   3. the list — reading it, ticking it off, taking a row off it, and the cascade when the
 *      project itself goes (plus the undo that has to bring the materials back with it);
 *   4. the copy, in all four languages.
 *
 * The other half — clicking it through in Chromium and reading the project screen back —
 * is scripts/test-materials-page.mjs.
 *
 * The shape being asserted here is not invented by this repository. It is
 * `ShoppingItemEntity` in the app's Room database, `SyncContract.shoppingItemToDoc()` on the
 * wire and `validShoppingItem()` in `config/firebase/firestore.rules`, all three in
 * `3d-polednia/Materio`, and §2 of `docs/FIRESTORE_SYNC.md` describes it. The constants
 * below were read out of those files, not remembered.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on a failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { projectsMain } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

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

/** assets/workspace.js in Node, on a store that starts out however the test wants it. */
function loadWorkspace(seed) {
  const backing = new Map(Object.entries(seed || {}));
  const clock = { now: 1_760_000_000_000 };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const api = evalScript("assets/workspace.js", [
    "WS_SCHEMA", "wsLoad",
    "wsProjects", "wsProject", "wsAddProject", "wsArchiveProject",
    "wsDeleteProject", "wsRestoreProject",
    "wsActiveProjectId", "wsSetActiveProject",
    "wsEstimations", "wsAddEstimation", "wsAddManualEstimation", "wsDeleteEstimation",
    "wsItems", "wsItem", "wsAddItem", "wsAddOwnItem", "wsUpdateItem",
    "wsSetItemPurchased", "wsDeleteItem", "wsItemsTotal", "WS_NOTE_MAX",
    "wsExport", "wsImport",
  ], {
    localStorage,
    document: { dispatchEvent: () => {} },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: { now: () => clock.now },
    lmCurrency: () => clock.currency || "PLN",
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("materio-workspace-v1") || "{}"),
    tick: (ms) => { clock.now += ms || 1000; },
    now: () => clock.now,
    setCurrency: (c) => { clock.currency = c; },
  };
}

/** One save, exactly as assets/workspace-ui.js performs it after a calculation. */
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
/** Row `i` of a list, or an empty object — so a missing row fails a check, not the run. */
const at = (rows, i) => rows[i || 0] || {};

/* ------------------------------------------------------- 1. the contract document */

head("1. the material is the contract's document and nothing else");
{
  const ws = loadWorkspace();
  save(ws);
  const [item] = ws.wsItems();
  // Everything below reads this row, so a missing one is a failure here rather than a
  // stack trace forty checks later.
  if (!check("saving a calculation produced a material at all", Boolean(item))) {
    failures.push("1. — the rest of this section could not run");
  } else {

  // FIRESTORE_SYNC §2, `shoppingItems/{itemId}` ← ShoppingItemEntity, plus the four sync
  // fields every synced document carries. `id` and `projectId` are the document id and its
  // path, which the local store has to keep as fields because it is flat.
  const CONTRACT = [
    "id", "projectId", "estimationId", "name", "materialCategory", "quantity", "unit",
    "estimatedCostMinor", "currencyCode", "isPurchased",
    "createdAt", "updatedAt", "deletedAt", "schemaVersion",
  ];
  /**
   * The one field beside the contract, and it is deliberate — chapter XVI's note, added in
   * session 18. It is listed here separately rather than folded into CONTRACT so that a
   * *second* invented field still fails this check.
   *
   * It survives the phone because `CloudSync.pushLocal()` writes every document with
   * `SetOptions.merge()`, and a merge leaves keys it was not handed alone. Sessions 15, 16
   * and 17 all said the opposite; the fixed map in `shoppingItemToDoc()` is real, but a
   * fixed map cannot erase what it does not mention when the write is a merge.
   */
  const EXTENSION = ["note"];
  const extra = Object.keys(item).filter((k) => !CONTRACT.includes(k));
  const missing = CONTRACT.filter((k) => !(k in item));
  eq("the only field beside the contract is the note", extra.join(","), EXTENSION.join(","));
  eq("and none of the contract's own missing", missing.join(","), "");
  eq("the note is a string, even when nobody wrote one", typeof item.note, "string");

  // The rules validate types before anything else does (validShoppingItem, deployed).
  eq("name is a string", typeof item.name, "string");
  eq("materialCategory is a string", typeof item.materialCategory, "string");
  eq("quantity is a number", typeof item.quantity, "number");
  eq("unit is a string", typeof item.unit, "string");
  eq("estimatedCostMinor is a whole number of minor units",
    item.estimatedCostMinor, Math.round(item.estimatedCostMinor));
  eq("isPurchased is a boolean", typeof item.isPurchased, "boolean");
  eq("schemaVersion is the contract's", item.schemaVersion, ws.WS_SCHEMA);
  check("createdAt and updatedAt are integers",
    Number.isInteger(item.createdAt) && Number.isInteger(item.updatedAt));
  eq("a live row has a null deletedAt", item.deletedAt, null);

  // A shopping item has no createdAt of its own in Room, so shoppingItemToDoc() puts
  // updatedAt in both fields. Ours start out equal for the same reason.
  eq("createdAt and updatedAt start out the same", item.createdAt, item.updatedAt);

  // Every length the rules cap. Over the cap the write is refused outright, so the store
  // has to be the one that clamps.
  const ws2 = loadWorkspace();
  const project = ws2.wsAddProject("P");
  const long = ws2.wsAddItem({
    projectId: project.id,
    estimationId: "x".repeat(200),
    name: "n".repeat(400),
    materialCategory: "c".repeat(90),
    quantity: -12,
    unit: "u".repeat(90),
    costMajor: -40,
    currencyCode: "PLN",
  });
  eq("name is cut to 120", long.name.length, 120);
  eq("materialCategory is cut to 40", long.materialCategory.length, 40);
  eq("unit is cut to 24", long.unit.length, 24);
  eq("estimationId is cut to 64", long.estimationId.length, 64);
  const noted = ws2.wsAddItem({
    projectId: project.id, name: "Klej", materialCategory: "CHEMICALS",
    quantity: 1, unit: "worek", costMajor: 1, currencyCode: "PLN",
    note: "n".repeat(2000),
  });
  eq("and the note to its own cap", noted.note.length, ws2.WS_NOTE_MAX);
  eq("a negative quantity is refused, not stored", long.quantity, 0);
  eq("and so is a negative cost", long.estimatedCostMinor, 0);
  }
}

/* ------------------------------------------------------------------ 2. the arrow */

head("2. a saved result puts a material on the list (chapter XVI)");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const items = ws.wsItems(row.projectId);

  if (!eq("one saved calculation makes exactly one material", items.length, 1)) {
    failures.push("2. — the arrow is broken; the rest of this section could not run");
  } else {
  eq("on the list of the project the calculation went into", items[0].projectId, row.projectId);
  eq("linked back to the calculation by estimationId", items[0].estimationId, row.id);

  // The two screens of one project have to agree about how much to buy. The app writes its
  // shoppingQuantity from the same requiredUnits for the same reason.
  eq("the quantity is the number the result panel printed", items[0].quantity, row.requiredUnits);
  eq("the unit is the one it printed", items[0].unit, row.unitLabel);
  eq("the name is the line's name", items[0].name, row.name);
  eq("the aisle is the line's material category", items[0].materialCategory, row.materialCategory);
  eq("and the money is the same money", items[0].estimatedCostMinor, row.totalCostMinor);
  eq("in the same currency", items[0].currencyCode, row.currencyCode);
  eq("nothing is ticked off to begin with", items[0].isPurchased, false);

  // Two calculations, two materials — the list accumulates, it is not overwritten.
  ws.tick();
  save(ws, { name: "Klej C2 25 kg", materialCategory: "CHEMICALS", unitLabel: "worków", requiredUnits: 7 });
  const after = ws.wsItems(row.projectId);
  eq("a second calculation adds a second material", after.length, 2);
  eq("oldest first, the order the app reads them in", at(after).name, "Gres 60×60");
  eq("and the second one is the second one", at(after, 1).name, "Klej C2 25 kg");

  // Chapter XVI's own example is a mixed list: an area, a count of bags, a weight.
  eq("the second material keeps its own unit", at(after, 1).unit, "worków");
  eq("and its own aisle", at(after, 1).materialCategory, "CHEMICALS");

  // A material list belongs to its project and to no other.
  const other = ws.wsAddProject("Inny projekt");
  eq("another project's list is empty", ws.wsItems(other.id).length, 0);
  eq("and the first one is untouched", ws.wsItems(row.projectId).length, 2);

  // Quantity is a number in the contract, not an integer — which is what lets a material
  // say 26,4 m² where an estimate line can only ever say 26. Chapter XVI's first example.
  const tiles = ws.wsAddItem({
    projectId: other.id, name: "Płytki", materialCategory: "TILES",
    quantity: 26.4, unit: "m²", costMajor: 0, currencyCode: "PLN",
  });
  eq("a fractional quantity survives", tiles.quantity, 26.4);
  }
}

head("2b. a line typed by hand is not a material");
{
  // /kosztorys/ takes labour, delivery and a bag bought by eye. "Robocizna · 8 h" on a
  // shopping list is worse than a short shopping list.
  const ws = loadWorkspace();
  ws.wsAddProject("P");
  const manual = ws.wsAddManualEstimation({
    name: "Robocizna", requiredUnits: 8, unitLabel: "h", costMajor: 800,
  });
  eq("the estimate line is saved", ws.wsEstimations(manual.projectId).length, 1);
  eq("and the material list stays empty", ws.wsItems(manual.projectId).length, 0);
}

head("2c. an archived project takes no materials, exactly as it takes no lines");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Skończony");
  ws.wsArchiveProject(project.id, true);
  const refused = ws.wsAddItem({
    projectId: project.id, name: "Klej", materialCategory: "CHEMICALS",
    quantity: 1, unit: "worek", costMajor: 30, currencyCode: "PLN",
  });
  eq("the write is refused", refused, null);
  eq("and nothing landed", ws.wsItems(project.id).length, 0);

  // A project that never existed, and one that was deleted, are the same answer.
  eq("an unknown project takes nothing", ws.wsAddItem({ projectId: "nope", name: "x" }), null);
  eq("and so does no project at all", ws.wsAddItem({ name: "x" }), null);
}

/* ------------------------------------------------------------------ 3. the list */

head("3. reading the list, ticking it off, taking a row off it");
{
  const ws = loadWorkspace();
  const row = save(ws);
  ws.tick();
  save(ws, { name: "Klej", materialCategory: "CHEMICALS", requiredUnits: 7, costMajor: 210 });
  const pid = row.projectId;

  const total = ws.wsItemsTotal(pid);
  eq("the tally counts the list", total.count, 2);
  eq("nothing is bought yet", total.bought, 0);
  eq("and the money adds up", total.minor, 74985 + 21000);
  eq("in one currency, so it is not marked mixed", total.mixed, false);

  const first = ws.wsItems(pid)[0];
  if (!check("there is a material to work with", Boolean(first))) {
    failures.push("3. — the list is empty; the rest of this section could not run");
  } else {
  ws.tick();
  const ticked = ws.wsSetItemPurchased(first.id, true);
  eq("ticking one off writes it", ticked.isPurchased, true);
  check("and moves updatedAt, so the phone hears about it", ticked.updatedAt > ticked.createdAt);
  eq("the tally follows", ws.wsItemsTotal(pid).bought, 1);
  eq("un-ticking it puts it back", ws.wsSetItemPurchased(first.id, false).isPurchased, false);
  eq("and the tally follows that too", ws.wsItemsTotal(pid).bought, 0);

  // Deleting is a tombstone here as everywhere else: the row stays so a later sync can
  // carry the deletion up instead of the phone pushing the material straight back.
  ws.tick();
  ws.wsDeleteItem(first.id);
  eq("a deleted material is off the list", ws.wsItems(pid).length, 1);
  eq("but the row is still in storage, as a tombstone", ws.raw().shoppingItems.length, 2);
  const stone = ws.raw().shoppingItems.find((s) => s.id === first.id);
  check("with a deletedAt on it", Number.isInteger(stone.deletedAt));
  eq("and it cannot be ticked off any more", ws.wsSetItemPurchased(first.id, true), null);
  eq("nor deleted twice", ws.wsDeleteItem(first.id), null);

  // A material saved in one currency keeps it — chapter VI, nothing is ever converted.
  ws.setCurrency("EUR");
  ws.tick();
  save(ws, { name: "Fuga", materialCategory: "CHEMICALS", requiredUnits: 4, costMajor: 60 });
  const mixed = ws.wsItemsTotal(pid);
  eq("the older material still says PLN", at(ws.wsItems(pid)).currencyCode, "PLN");
  eq("the new one says EUR", at(ws.wsItems(pid), 1).currencyCode, "EUR");
  eq("and the total says so rather than adding unlike things", mixed.mixed, true);
  }
}

head("3b. deleting the project takes the materials, and the undo brings them back");
{
  const ws = loadWorkspace();
  const row = save(ws);
  ws.tick();
  save(ws, { name: "Klej", materialCategory: "CHEMICALS" });
  const pid = row.projectId;
  if (!eq("two materials to start with", ws.wsItems(pid).length, 2)) {
    failures.push("3b. — the list is not what it should be; the rest of this section could not run");
  } else {

  // One of them is deleted by hand first. The undo must not resurrect that one — the same
  // rule session 15 established for estimate lines, for the same reason.
  const byHand = ws.wsItems(pid)[1];
  ws.tick();
  ws.wsDeleteItem(byHand.id);

  ws.tick();
  const token = ws.wsDeleteProject(pid);
  check("the delete hands back what it tombstoned", Boolean(token));
  eq("naming the materials it took", token.items.length, 1);
  eq("and the lines", token.lines.length, 2);
  eq("the material list is gone with the project", ws.wsItems(pid).length, 0);
  check("every material is a tombstone",
    ws.raw().shoppingItems.every((s) => s.deletedAt));

  ws.tick();
  ws.wsRestoreProject(token);
  eq("the undo brings the project back", Boolean(ws.wsProject(pid)), true);
  eq("with the material it took", ws.wsItems(pid).length, 1);
  eq("and it is the right one", at(ws.wsItems(pid)).name, "Gres 60×60");
  eq("the one deleted by hand stays deleted", ws.wsItems(pid).some((s) => s.id === byHand.id), false);

  // A bare id is what a project with nothing in it restores by.
  const empty = ws.wsAddProject("Pusty");
  const bare = ws.wsDeleteProject(empty.id);
  eq("a project with no materials tombstones none", bare.items.length, 0);
  check("and still restores", Boolean(ws.wsRestoreProject(bare.id)));
  }
}

head("3c. deleting one calculation leaves its material, exactly as on the phone");
{
  // ProjectRepository.deleteEstimation() in the app writes a tombstone for the estimation
  // and touches no shopping item; only deleting the project cascades. Doing more here would
  // make a delete on the web mean something a delete on the phone does not.
  const ws = loadWorkspace();
  const row = save(ws);
  ws.tick();
  ws.wsDeleteEstimation(row.id);
  eq("the calculation is gone", ws.wsEstimations(row.projectId).length, 0);
  eq("the material it produced is still on the list", ws.wsItems(row.projectId).length, 1);
  eq("still pointing at the calculation that made it",
    at(ws.wsItems(row.projectId)).estimationId, row.id);
}

/* ------------------------------------------------ 3e-3h. session 18: editing */

head("3e. editing a material — chapter XVI's four writes");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const item = at(ws.wsItems(row.projectId));
  ws.tick();

  const done = ws.wsUpdateItem(item.id, {
    name: "Gres 60×60 szary",
    quantity: 26.4,
    unit: "m²",
    materialCategory: "FLOORING",
    note: "ten sam odcień co w kuchni",
  });
  eq("the name changes", done.name, "Gres 60×60 szary");
  eq("the quantity changes, and keeps its decimals", done.quantity, 26.4);
  eq("the unit changes", done.unit, "m²");
  eq("the aisle changes", done.materialCategory, "FLOORING");
  eq("the note is written", done.note, "ten sam odcień co w kuchni");
  check("and updatedAt moved, so the phone hears about it", done.updatedAt > done.createdAt);
  eq("createdAt did not move", done.createdAt, item.createdAt);

  // The price is chapter XVII, session 19. Changing the quantity must not silently
  // re-derive a cost from a unit price nobody has entered.
  eq("the cost is left exactly where it was", done.estimatedCostMinor, item.estimatedCostMinor);
  eq("and so is the currency", done.currencyCode, item.currencyCode);
  eq("the link back to the calculation survives an edit", done.estimationId, row.id);

  // Anything not passed keeps its value — the same rule as wsUpdateProject/wsUpdateEstimation.
  ws.tick();
  const partial = ws.wsUpdateItem(item.id, { quantity: 30 });
  eq("an edit of one field leaves the others", partial.name, "Gres 60×60 szary");
  eq("and the note", partial.note, "ten sam odcień co w kuchni");
  eq("while the one field moves", partial.quantity, 30);

  // The same clamps as a fresh row: the rules are the last gate and they refuse the rest.
  const clamped = ws.wsUpdateItem(item.id, {
    name: "n".repeat(400), unit: "u".repeat(90), quantity: -5, note: "x".repeat(2000),
  });
  eq("a long name is cut, not refused", clamped.name.length, 120);
  eq("a long unit too", clamped.unit.length, 24);
  eq("a negative quantity becomes zero", clamped.quantity, 0);
  eq("and the note is capped", clamped.note.length, ws.WS_NOTE_MAX);

  // A name is the only thing a row cannot do without: it is what the visitor shops by.
  eq("an empty name is refused outright", ws.wsUpdateItem(item.id, { name: "   " }), null);
  eq("and the row is untouched by the refusal", at(ws.wsItems(row.projectId)).name.length, 120);

  // Editing something that is not there, or is a tombstone, answers null rather than
  // resurrecting it.
  eq("an unknown material cannot be edited", ws.wsUpdateItem("nope", { name: "x" }), null);
  ws.wsDeleteItem(item.id);
  eq("nor can a deleted one", ws.wsUpdateItem(item.id, { name: "x" }), null);
}

head("3f. a material typed in by hand — chapter XVI's own material");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Łazienka");
  ws.tick();
  const own = ws.wsAddOwnItem({
    projectId: project.id,
    name: "Silikon sanitarny",
    materialCategory: "CHEMICALS",
    quantity: 2,
    unit: "szt.",
    note: "biały",
  });
  check("it lands on the list", Boolean(own));
  eq("on the right project", own.projectId, project.id);
  eq("with the name typed", own.name, "Silikon sanitarny");
  eq("the quantity typed", own.quantity, 2);
  eq("the unit typed", own.unit, "szt.");
  eq("the aisle chosen", own.materialCategory, "CHEMICALS");
  eq("and the note typed", own.note, "biały");

  // No calculator behind it, so there is no calculation to point at — the same answer
  // session 16 gave a hand-typed estimate line, for the same reason.
  eq("nothing calculated it, so it points at no calculation", own.estimationId, null);
  eq("and it costs nothing until session 19 gives it a price", own.estimatedCostMinor, 0);
  eq("it is not on the estimate", ws.wsEstimations(project.id).length, 0);

  // It is an ordinary material in every other way.
  ws.tick();
  eq("it ticks off like any other", ws.wsSetItemPurchased(own.id, true).isPurchased, true);
  eq("it edits like any other", ws.wsUpdateItem(own.id, { quantity: 3 }).quantity, 3);
  const token = ws.wsDeleteProject(project.id);
  eq("and it goes with the project", token.items.length, 1);
  ws.wsRestoreProject(token);
  eq("and comes back with it", ws.wsItems(project.id).length, 1);

  // A row with no name is a row nobody can shop for.
  eq("a nameless material is refused", ws.wsAddOwnItem({ projectId: project.id, name: "  " }), null);
  eq("nothing landed", ws.wsItems(project.id).length, 1);

  // Without a project named, it goes to the active one — the same fallback the save box uses.
  ws.wsSetActiveProject(project.id);
  const active = ws.wsAddOwnItem({ name: "Grunt", quantity: 1, unit: "szt." });
  eq("no project named means the active project", active.projectId, project.id);
  eq("and the aisle falls back to OTHER", active.materialCategory, "OTHER");
}

head("3g. the note survives the round trip");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("P");
  const own = ws.wsAddOwnItem({
    projectId: project.id, name: "Fuga", materialCategory: "CHEMICALS",
    quantity: 4, unit: "kg", note: "antracyt",
  });

  // The note is always on the document, empty or not: the push is a merge, so the only way
  // to *clear* one remotely is to send the empty string. A key left out stays put.
  const plain = ws.wsAddOwnItem({ projectId: project.id, name: "Klej", quantity: 1, unit: "szt." });
  eq("a material with no note still carries the field", plain.note, "");
  ws.tick();
  eq("a note can be cleared", ws.wsUpdateItem(own.id, { note: "" }).note, "");
  eq("and written again", ws.wsUpdateItem(own.id, { note: "antracyt" }).note, "antracyt");
  eq("and it is trimmed on the way in", ws.wsUpdateItem(own.id, { note: "  szary  " }).note, "szary");

  const dump = ws.wsExport();
  const fresh = loadWorkspace();
  fresh.wsImport(dump);
  eq("an exported and re-imported note is the same note",
    at(fresh.wsItems(project.id)).note, "szary");
}

head("3h. the units a hand-typed material is offered");
{
  // Chapter XVI asks for the unit to be changeable, so the field is free text and the list
  // is only a suggestion. What it suggests has to exist in every language, or a German
  // visitor is offered a Polish abbreviation.
  for (const lang of LANGS) {
    for (const key of ["mu_pkg", "mu_pc"]) {
      check(`${lang}: ${key} is a real word`, Boolean(DICT[lang][key]) && DICT[lang][key] !== key,
        DICT[lang][key]);
    }
  }
  const { main } = projectsMain(DEFAULT_LANG, tr(DEFAULT_LANG), MAT_CATS);
  check("the page carries the suggestion list", main.includes('id="ws-mat-units"'));
  for (const unit of ["m²", "kg", "l"]) {
    check(`it offers ${unit}`, main.includes(`value="${unit}"`), unit);
  }
  check("and the unit field points at it", /data-|list="ws-mat-units"/.test(main)
    || main.includes('list="ws-mat-units"'));
}

head("3d. the store carries materials in and out with everything else");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const dump = ws.wsExport();
  check("the export has a materials collection", Array.isArray(dump.shoppingItems));
  eq("with the material in it", dump.shoppingItems.length, 1);

  // The import is what /app/'s "pull" does with a downloaded account. Before session 17 it
  // dropped shoppingItems on the floor: downloadAccount() has always fetched them.
  const fresh = loadWorkspace();
  fresh.wsImport(dump);
  eq("an imported account brings its materials", fresh.wsItems(row.projectId).length, 1);
  eq("with the link back to the calculation intact",
    at(fresh.wsItems(row.projectId)).estimationId, row.id);

  // Last-write-wins on updatedAt, ties to the incoming copy — SyncContract.remoteWins().
  const remote = ws.wsExport();
  at(remote.shoppingItems).isPurchased = true;
  at(remote.shoppingItems).updatedAt += 5000;
  fresh.wsImport(remote);
  eq("a newer remote copy wins", at(fresh.wsItems(row.projectId)).isPurchased, true);

  // A workspace written before session 17 has no shoppingItems key at all.
  const old = loadWorkspace({
    "materio-workspace-v1": JSON.stringify({ projects: [], rooms: [], estimations: [] }),
  });
  eq("a store from before this session reads as an empty list", old.wsItems().length, 0);
  const before = old.wsAddProject("P");
  check("and takes a material straight away",
    Boolean(old.wsAddItem({
      projectId: before.id, name: "Klej", materialCategory: "CHEMICALS",
      quantity: 7, unit: "worków", costMajor: 210, currencyCode: "PLN",
    })));
}

/* ------------------------------------------------------------------ 4. the page */

head("4. the build writes the frame the list is drawn into");
{
  const { main } = projectsMain(DEFAULT_LANG, tr(DEFAULT_LANG), MAT_CATS);
  const needs = [
    "ws-project-materials", "ws-mat-tally",
    // Session 18: the form that types a material in by hand.
    "ws-mat-add", "ws-mat-form", "ws-mat-name", "ws-mat-qty", "ws-mat-unit",
    "ws-mat-cat", "ws-mat-note", "ws-mat-units",
  ];
  for (const id of needs) check(`the frame has #${id}`, main.includes(`id="${id}"`));
  check("the list is a .data-list, the component every other list on the page uses",
    /id="ws-project-materials" class="data-list"/.test(main));
  check("the heading is the material list's own",
    main.includes(tr(DEFAULT_LANG)("proj_mat_t")));
  check("and it sits inside the project detail, not the index",
    main.indexOf("ws-project-materials") > main.indexOf('id="ws-project-body"')
    && main.indexOf("ws-project-materials") < main.indexOf('id="ws-index"'));

  // The aisle picker is filled by the build rather than by loading the 12 kB catalogue on
  // a page that needs fifteen words out of it.
  for (const cat of MAT_CATS) {
    check(`the aisle picker offers ${cat}`, main.includes(`<option value="${cat}">`), cat);
  }
  check("with the aisle named in words, not as the enum",
    main.includes(`>${tr(DEFAULT_LANG)("cat_TILES")}<`));

  // The frame is server-rendered in every language, so the section exists with the script
  // off; what is missing then is the rows, which come out of this browser's own storage.
  for (const lang of LANGS) {
    const built = projectsMain(lang, tr(lang), MAT_CATS).main;
    check(`${lang}: the section is in the page`, built.includes('id="ws-project-materials"'));
    check(`${lang}: with the heading in that language`, built.includes(tr(lang)("proj_mat_t")));
    check(`${lang}: and the add form in that language`, built.includes(tr(lang)("proj_mat_add")));
    check(`${lang}: nothing in the frame shows a raw key`,
      !/\b(proj_mat_[a-z_]+|cat_[A-Z]+|ws_col_[a-z]+)\b/.test(built));
  }
}

head("5. the copy exists in all four languages");
{
  const KEYS = [
    "proj_mat_t", "proj_mat_d", "proj_mat_empty", "proj_mat_tally", "proj_mat_buy",
    // Session 18.
    "proj_mat_add", "proj_mat_aisle", "proj_mat_note", "proj_mat_note_ph",
    "proj_mat_edit", "proj_mat_edit_t", "proj_mat_phone",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
    // The tally is a pattern; both slots have to survive translation or the sentence loses
    // one of its two numbers.
    const tally = DICT[lang].proj_mat_tally || "";
    check(`${lang}: the tally keeps {bought}`, tally.includes("{bought}"), tally);
    check(`${lang}: the tally keeps {count}`, tally.includes("{count}"), tally);
  }

  // The aisle is stored as the enum name and rendered through cat_*, which is what lets a
  // material saved in Polish read in German. Every category the catalogue can hand over
  // has to translate, in every language, or a row would print "TILES" at somebody.
  for (const lang of LANGS) {
    const missing = MAT_CATS.filter((c) => !DICT[lang][`cat_${c}`]);
    eq(`${lang}: every shop aisle translates`, missing.join(","), "");
  }
  // Plus the fallback the store writes when a calculation had no material picked.
  for (const lang of LANGS) {
    check(`${lang}: the OTHER aisle translates`, Boolean(DICT[lang].cat_OTHER));
  }
}

/* ------------------------------------------------------------------ report */

console.log(`\nmaterials: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
