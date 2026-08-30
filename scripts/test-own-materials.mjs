#!/usr/bin/env node
/**
 * LiczMat — the visitor's own materials, tested.
 *
 *     node scripts/test-own-materials.mjs
 *
 * Session 59, item **C6** of the parity audit: "Eksport PDF i własne materiały — tylko
 * w aplikacji." The app has had `CustomMaterialsScreen` with a price history since before
 * this site existed; the browser had nothing, and the rows were outside the sync contract
 * because §5 called a material reference data. True of the bundled 161, false of a row
 * somebody typed in with the price their own supplier charges — so the same session put
 * `users/{uid}/materials` in the contract and this is the browser half of it.
 *
 * The halves:
 *
 *   1. the document — the exact field names, types and caps `validMaterial()` enforces and
 *      `SyncContract.materialToDoc()` writes, because a row here IS that document;
 *   2. the four writes plus the undo, and the tombstone that makes the undo possible;
 *   3. the price history — appended, never edited, capped at the newest sixty, and the
 *      trend derived from it rather than stored beside it;
 *   4. chapter VI's currency rule, in both directions;
 *   5. the measurements, which are null-or-a-number and never "present";
 *   6. the catalogue shape, which is what lets an own material fill a calculator through
 *      the machinery a bundled one already uses;
 *   7. the sync — export, import, last-write-wins, and the history that travels whole;
 *   8. the route and the ten slugs;
 *   9. the frame the build writes, and the copy in ten languages;
 *  10. the net session 41 and session 57 both needed: no `omat_*` key printed on a page.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on failure.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { ownMaterialsMain } from "../src/pages.mjs";
import { OMAT_COPY, OMAT_COPY_KEYS } from "../src/omat-copy.mjs";
import { LANGS, SECTION, urlOwnMaterials } from "../src/site.mjs";
import { LEVEL, STATUS, route } from "../src/ia.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");

function evalSource(src, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}
const evalScript = (file, returns, globals) => evalSource(read(file), returns, globals);

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);
const DICT = {};
for (const lang of LANGS) {
  DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}), ...(I18N_MATERIALS[lang] || {}) };
}
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/** assets/own-materials.js in Node, with the clock and the currency under control. */
function loadStore({ now = Date.parse("2026-08-30T09:00:00+02:00"), currency = "PLN" } = {}) {
  const backing = new Map();
  const clock = { now, currency };
  let ids = 0;
  const events = [];
  const api = evalScript("assets/own-materials.js", [
    "OM_KEY", "OM_SCHEMA", "OM_MAX_NAME", "OM_MAX_PRICE_POINTS", "OM_APPLICATIONS", "OM_MEASURES",
    "omMaterials", "omMaterial", "omHistory", "omTrend",
    "omAdd", "omUpdate", "omSetPrice", "omDelete", "omRestore",
    "omToCatalogRow", "omCatalogRows", "omExport", "omImport", "omApplication",
  ], {
    localStorage: {
      getItem: (k) => (backing.has(k) ? backing.get(k) : null),
      setItem: (k, v) => backing.set(k, String(v)),
      removeItem: (k) => backing.delete(k),
    },
    document: { dispatchEvent: (e) => events.push(e.type), documentElement: { lang: "pl" } },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [clock.now])); }
      static now() { return clock.now; }
      static parse(v) { return Date.parse(v); }
    },
    lmCurrency: () => clock.currency,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("liczmat-materials-v1") || "{}"),
    keys: () => [...backing.keys()],
    events,
    tick: (ms) => { clock.now += ms || 1000; },
    setCurrency: (c) => { clock.currency = c; },
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

const tile = (over = {}) => ({
  name: "Gres od Kowalskiego 60×60",
  application: "WALL_FLOOR_COVERING",
  category: "TILES",
  widthMm: 600, lengthMm: 600, packageAreaM2: 1.44, wastePercent: 7,
  ...over,
});

/* ================================================================== 1. the document */

head("1. a row IS the contract's document");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: "45,99" }));

  // The exact field names of docs/FIRESTORE_SYNC.md §2, `materials/{materialId}`. A name
  // that differs by a character is a field the phone silently never reads.
  const FIELDS = [
    "id", "name", "category", "application",
    "widthMm", "lengthMm", "kerfMm", "coveragePerUnitM2", "packageAreaM2", "wastePercent",
    "priceMinor", "currencyCode", "priceUpdatedAt", "prices",
    "createdAt", "updatedAt", "deletedAt", "schemaVersion",
  ];
  eq("the document carries exactly the contract's fields",
    Object.keys(m).sort().join(","), FIELDS.slice().sort().join(","));

  eq("the money is minor units, never a float", m.priceMinor, 4599);
  eq("the application is the app's own enum name", m.application, "WALL_FLOOR_COVERING");
  eq("the category is the shop aisle", m.category, "TILES");
  check("createdAt, updatedAt and schemaVersion are the sync block",
    Number.isInteger(m.createdAt) && Number.isInteger(m.updatedAt) && m.schemaVersion === 1);
  eq("a live row has no deletedAt", m.deletedAt, null);
  eq("the store has one collection and it is `materials`",
    Object.keys(om.raw()).join(","), "materials");
  eq("under its own key, not the workspace's", om.keys().join(","), "liczmat-materials-v1");
  check("and a write announces itself", om.events.includes("ownmaterialschange"));
}

head("1b. the caps are the ones the deployed rules enforce");
{
  const om = loadStore();
  eq("a name is capped at 120", om.omAdd(tile({ name: "ę".repeat(400) })).name.length, 120);
  eq("the cap is the contract's own", om.OM_MAX_NAME, 120);
  eq("the history is capped at 60", om.OM_MAX_PRICE_POINTS, 60);

  // Read out of the app repo when it is beside this one, so the two numbers cannot drift
  // in silence. Skipped rather than failed when only this repo is checked out.
  const rules = p("..", "Materio", "config", "firebase", "firestore.rules");
  if (existsSync(rules)) {
    const validMaterial = readFileSync(rules, "utf8")
      .split("function validMaterial(d)")[1] || "";
    const size = /d\.prices\.size\(\) <= (\d+)/.exec(validMaterial);
    check("validMaterial() caps d.prices", Boolean(size), "not found in the rules");
    if (size) eq("and at the same number", Number(size[1]), om.OM_MAX_PRICE_POINTS);
    check("validMaterial() checks the name", validMaterial.includes("text(d.name, 120)"));
  }
}

head("1c. a material with no name is refused rather than stored blank");
{
  const om = loadStore();
  eq("no name", om.omAdd({ name: "  " }), null);
  eq("nothing was written", om.omMaterials().length, 0);
  eq("and renaming to nothing is refused too",
    (() => { const m = om.omAdd(tile()); return om.omUpdate(m.id, { name: " " }); })(), null);
  eq("the row keeps the name it had", om.omMaterials()[0].name, "Gres od Kowalskiego 60×60");
}

/* ================================================================== 2. the writes */

head("2. create, read, correct, delete — and the undo");
{
  const om = loadStore();
  const m = om.omAdd(tile());
  eq("one material", om.omMaterials().length, 1);
  eq("read back by id", om.omMaterial(m.id).name, m.name);

  om.tick(1000);
  const fixed = om.omUpdate(m.id, { name: "Gres 60×60 mat" });
  eq("the name is corrected in place", fixed.name, "Gres 60×60 mat");
  check("and updatedAt moved", fixed.updatedAt > m.updatedAt);
  eq("createdAt did not", fixed.createdAt, m.createdAt);

  const token = om.omDelete(m.id);
  eq("the list is empty", om.omMaterials().length, 0);
  eq("but the row is still in storage as a tombstone", om.raw().materials.length, 1);
  check("with a deletedAt on it", Boolean(om.raw().materials[0].deletedAt));

  const back = om.omRestore(token);
  check("the undo brings it back", Boolean(back));
  eq("and the list has it again", om.omMaterials().length, 1);
  eq("with the corrected name", om.omMaterials()[0].name, "Gres 60×60 mat");
  eq("a second undo of the same token does nothing", om.omRestore(token), null);
  eq("and an invented token does nothing", om.omRestore("nope"), null);
}

head("2b. the list is by name, which is how the app's own screen orders it");
{
  const om = loadStore();
  ["Zaprawa", "Gres", "Panel"].forEach((name) => om.omAdd(tile({ name })));
  eq("by name", om.omMaterials().map((m) => m.name).join(","), "Gres,Panel,Zaprawa");
}

/* ================================================================== 3. the price history */

head("3. a price is appended to the history, never edited");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: 39.99 }));
  eq("the first price seeds the first point", om.omHistory(m.id).length, 1);
  eq("and it is the price", om.omHistory(m.id)[0].priceMinor, 3999);

  om.tick(86400000);
  om.omSetPrice(m.id, "45,99");
  const points = om.omHistory(m.id);
  eq("a second price is a second point", points.length, 2);
  eq("newest first", points[0].priceMinor, 4599);
  eq("and the older one is untouched", points[1].priceMinor, 3999);
  eq("the material carries the latest", om.omMaterial(m.id).priceMinor, 4599);
  check("and says when", om.omMaterial(m.id).priceUpdatedAt > m.createdAt);
}

head("3b. clearing the price clears the stamp and keeps the history");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: 39.99 }));
  om.omSetPrice(m.id, "");
  eq("no price", om.omMaterial(m.id).priceMinor, null);
  eq("no currency to be wrong about", om.omMaterial(m.id).currencyCode, "");
  eq("and no date", om.omMaterial(m.id).priceUpdatedAt, null);
  // What a material used to cost is still true after somebody stops tracking what it
  // costs now. Deleting the history here would lose a fact nothing else records.
  eq("the history survives", om.omHistory(m.id).length, 1);
}

head("3c. the history is capped at the newest sixty");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: 1 }));
  for (let i = 2; i <= 100; i++) { om.tick(1000); om.omSetPrice(m.id, i); }
  const points = om.omHistory(m.id);
  eq("sixty points", points.length, 60);
  eq("the newest is kept", points[0].priceMinor, 100_00);
  eq("the oldest kept is the sixtieth back", points[59].priceMinor, 41_00);
  check("and the stored row is capped too, or the rules would refuse the write",
    om.raw().materials[0].prices.length === 60);
}

head("3d. the trend is derived, and two currencies are not subtracted");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: 40 }));
  eq("one point is no trend", om.omTrend(m.id), null);

  om.tick(1000);
  om.omSetPrice(m.id, 50);
  const up = om.omTrend(m.id);
  eq("the difference", up.diffMinor, 1000);
  eq("as a percentage of the first price", Math.round(up.pct), 25);
  eq("and it is not stored anywhere",
    Object.keys(om.raw().materials[0]).includes("trend"), false);

  // A material priced in two currencies. Chapter VI: nothing is converted at a rate, so
  // the two amounts are not subtracted and the page says so instead of printing a figure.
  const om2 = loadStore();
  const b = om2.omAdd(tile({ priceMajor: 40 }));
  const row = om2.raw();
  row.materials[0].prices.push({ priceMinor: 900, currencyCode: "EUR", recordedAt: Date.now() + 5000 });
  om2.omImport(row);
  eq("mixed currencies are refused rather than subtracted", om2.omTrend(b.id).mixed, true);
}

head("3e. a malformed point is dropped and the rest survive");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: 40 }));
  const row = om.raw();
  row.materials[0].prices = [
    { priceMinor: 100, currencyCode: "PLN", recordedAt: 2000 },
    "not an object",
    { priceMinor: 200, currencyCode: "PLN" },
    { currencyCode: "PLN", recordedAt: 3000 },
    { priceMinor: 300, currencyCode: "PLN", recordedAt: 4000 },
  ];
  om.omImport(row);
  eq("two points survive", om.omHistory(m.id).map((x) => x.recordedAt).join(","), "4000,2000");
  eq("a missing prices array reads as no history",
    (() => { const r = om.raw(); delete r.materials[0].prices; om.omImport(r); return om.omHistory(m.id).length; })(), 0);
}

/* ================================================================== 4. the currency rule */

head("4. chapter VI: a price keeps the currency it was entered in");
{
  const om = loadStore({ currency: "PLN" });
  const m = om.omAdd(tile({ priceMajor: 40 }));
  eq("stamped with the currency in force", om.omMaterial(m.id).currencyCode, "PLN");

  om.setCurrency("EUR");
  om.tick(1000);
  om.omSetPrice(m.id, 45);
  eq("a re-price keeps the stamp rather than re-stamping it",
    om.omMaterial(m.id).currencyCode, "PLN");
  eq("and so does the new history point", om.omHistory(m.id)[0].currencyCode, "PLN");

  // Cleared, then priced again: the next stamp is fresh, which is the same rule a job's
  // agreed amount follows.
  om.omSetPrice(m.id, "");
  om.tick(1000);
  om.omSetPrice(m.id, 45);
  eq("a fresh price takes the currency now in force", om.omMaterial(m.id).currencyCode, "EUR");

  const unpriced = om.omAdd(tile({ name: "Bez ceny" }));
  eq("a material nobody priced carries no currency", unpriced.currencyCode, "");
  eq("and no price", unpriced.priceMinor, null);
  eq("and no history", unpriced.prices.length, 0);
}

/* ================================================================== 5. the measurements */

head("5. a measurement is null or a number, never `present`");
{
  const om = loadStore();
  const profile = om.omAdd({
    name: "Profil CD", application: "LINEAR_STOCK", lengthMm: 3000, kerfMm: 3,
  });
  // A profile has a kerf and no package area. Filling the blanks with zeroes would hand
  // the calculator a 0 m² package, which divides.
  eq("an unused field is null, not zero", profile.packageAreaM2, null);
  eq("and so is one nobody filled in", profile.widthMm, null);
  eq("the ones it uses are numbers", profile.lengthMm, 3000);

  const junk = om.omAdd({
    name: "Śmieci", application: "WALL_FLOOR_COVERING",
    widthMm: "sześćset", lengthMm: -5, packageAreaM2: "1,44", wastePercent: 1e9,
  });
  eq("a word is not a measurement", junk.widthMm, null);
  eq("a negative one is not either", junk.lengthMm, null);
  eq("a comma is a decimal point in most of these languages", junk.packageAreaM2, 1.44);
  eq("and an absurd one is clamped to what the rules accept",
    junk.wastePercent, om.OM_MEASURES.wastePercent);

  // Changing what a material is for re-reads its measurements: a covering turned into a
  // profile keeping a package area would carry a number nothing reads to the phone.
  const m = om.omAdd(tile());
  const turned = om.omUpdate(m.id, { application: "LINEAR_STOCK" });
  eq("the package area goes with the application", turned.packageAreaM2, null);
  eq("and the waste allowance with it", turned.wastePercent, null);
  eq("the length it shares stays", turned.lengthMm, 600);
}

head("5b. the five applications are the app's own, and no sixth is invented");
{
  const om = loadStore();
  eq("five", om.OM_APPLICATIONS.length, 5);
  eq("the app's enum names", om.OM_APPLICATIONS.map((a) => a.id).join(","),
    "WALL_FLOOR_COVERING,DRYWALL_BOARDING,COATING,PANEL_CUTTING,LINEAR_STOCK");
  // An unknown name is not an error: the row is worth keeping, and this is the same
  // tolerance SyncContract.applicationOf() has on the phone.
  eq("an unknown one falls back rather than throwing",
    om.omApplication("SOMETHING_ELSE").id, "WALL_FLOOR_COVERING");
  eq("and so does an absent one", om.omApplication(undefined).id, "WALL_FLOOR_COVERING");
}

/* ================================================================== 6. the catalogue shape */

head("6. an own material fills a calculator through the catalogue's own machinery");
{
  const om = loadStore();
  const m = om.omAdd(tile());
  const row = om.omToCatalogRow(m);
  eq("it carries the kind the calculators filter on", row.k, "tile");
  eq("its own name rather than a term key", row.name, m.name);
  check("and is marked as the visitor's own", row.own === true);
  eq("the id cannot collide with a catalogue id", row.id, `own-${m.id}`);
  eq("the numbers the waste engine wants are there", `${row.pkg},${row.waste}`, "1.44,7");

  const bar = om.omToCatalogRow(om.omAdd({
    name: "Profil", application: "LINEAR_STOCK", lengthMm: 3000, kerfMm: 3,
  }));
  eq("a bar is a bar", bar.k, "bar");
  eq("and the linear engine's stock length is its length", bar.len, 3000);

  // matName() must print the name rather than looking up a term key that does not exist.
  const { matName, matNote } = evalScript("assets/materials.js",
    ["matName", "matNote"], { module: undefined });
  eq("matName prints an own material's name", matName(row, "pl", () => "WRONG"), m.name);
  check("and matNote builds its spec out of the numbers it has",
    matNote(row, "pl", (k) => k).includes("1,44"));
  eq("a bundled row is unaffected",
    matName({ t: "term", s: "60×60" }, "pl", (k) => (k === "term" ? "Gres" : k)), "Gres 60×60");
}

/* ================================================================== 7. the sync */

head("7. export, import and last-write-wins");
{
  const om = loadStore();
  const m = om.omAdd(tile({ priceMajor: 40 }));
  const out = om.omExport();
  eq("the export carries the collection", out.materials.length, 1);
  check("and says when and what version", Boolean(out.exportedAt) && out.schemaVersion === 1);

  om.omDelete(m.id);
  check("a tombstone is exported too — a delete has to travel",
    om.omExport().materials[0].deletedAt !== null);

  // Two devices. The newer row wins whole, its history with it: merging two histories
  // would build a price trend that happened on neither device.
  const a = loadStore();
  const one = a.omAdd(tile({ name: "Gres", priceMajor: 40 }));
  const incoming = {
    materials: [{
      ...one,
      name: "Gres z chmury",
      priceMinor: 5500,
      prices: [{ priceMinor: 5500, currencyCode: "PLN", recordedAt: one.updatedAt + 10_000 }],
      updatedAt: one.updatedAt + 10_000,
    }],
  };
  a.omImport(incoming);
  eq("the newer row replaces the local one", a.omMaterial(one.id).name, "Gres z chmury");
  eq("its history replaces the local one whole", a.omHistory(one.id).length, 1);
  eq("and it is the incoming history", a.omHistory(one.id)[0].priceMinor, 5500);

  const b = loadStore();
  const mine = b.omAdd(tile({ name: "Mój", priceMajor: 40 }));
  b.omImport({ materials: [{ ...mine, name: "Starszy", updatedAt: mine.updatedAt - 10_000 }] });
  eq("an older row does not win", b.omMaterial(mine.id).name, "Mój");

  const c = loadStore();
  c.omImport({ materials: [{ ...tile(), id: "from-the-phone", updatedAt: 1, prices: [] }] });
  eq("a row this browser has never seen is added", c.omMaterials().length, 1);
  c.omImport({ materials: [null, {}, "nonsense"] });
  eq("and nonsense is ignored rather than stored", c.omMaterials().length, 1);
}

head("7b. /app/ pushes and pulls this collection");
{
  const app = read("assets/app.js");
  check("the push writes users/{uid}/materials", /proDoc\("materials",/.test(app));
  check("the pull reads it", /"clients", "jobs", "quotes", "materials"/.test(app));
  check("the pull merges it into this store", app.includes("omImport(incoming)"));
  check("the push is called beside the Pro one, not from inside it",
    /await pushProWorkspace\(\);[\s\S]{0,400}?await pushOwnMaterials\(\);/.test(app));
  // The rules are the last gate and a document they refuse fails the whole pass, so the
  // push clamps every field rather than sending what the store happens to hold.
  check("the pushed history is capped at the rules' sixty", /\.slice\(0, 60\)/.test(app));
  check("and the store is on the page that pushes it",
    read("scripts/build.mjs").includes('"/assets/own-materials.js"'));
  check("the device wipe names the key", app.includes('"liczmat-materials-v1"'));
}

/* ================================================================== 8. the route */

head("8. the route and the ten slugs");
{
  const r = route("own-materials");
  check("the route exists", Boolean(r));
  eq("it is LIVE", r.status, STATUS.LIVE);
  eq("GUEST, like /projekty/ and for the same reason", r.level, LEVEL.GUEST);
  eq("the link is offered to an account", r.navLevel, LEVEL.LICZMAT);
  check("indexable", r.indexable === true);
  eq("parented under the catalogue", r.parent, "materials");
  check("and it is in the footer, not the header",
    Boolean(r.footer) && !r.header);

  const slugs = LANGS.map((l) => SECTION.ownMaterials[l]);
  eq("ten slugs", slugs.filter(Boolean).length, 10);
  check("every one is lower-case ASCII", slugs.every((s) => /^[a-z0-9-]+$/.test(s)), slugs.join(","));
  // Two languages MAY share a segment — /materialy/ is "materialy" in four of them — and
  // they still get ten addresses, because every language but the default carries its own
  // prefix. What must be unique is the URL.
  eq("ten distinct addresses", new Set(LANGS.map(urlOwnMaterials)).size, 10);
  // Two sections may not claim one word: /materialy/ is the bundled catalogue and this is
  // not it, so no language may spell them the same.
  for (const lang of LANGS) {
    check(`${lang}: it is not the catalogue's own segment`,
      SECTION.ownMaterials[lang] !== SECTION.materials[lang]);
  }
  for (const lang of LANGS) {
    const url = urlOwnMaterials(lang);
    check(`${lang}: the URL ends in a slash`, url.endsWith("/"), url);
    check(`${lang}: and the file shipped`, existsSync(p(`${url.replace(/^\//, "")}index.html`)), url);
  }
}

/* ================================================================== 9. the page */

head("9. the frame the build writes, in ten languages");
{
  for (const lang of LANGS) {
    const t = tr(lang);
    const { main } = ownMaterialsMain(lang, t, ["TILES", "OTHER"], OMAT_COPY[lang]);
    check(`${lang}: one <h1>`, (main.match(/<h1>/g) || []).length === 1);
    check(`${lang}: <main> is focusable, or the skip link leaves the focus behind`,
      main.includes('id="main" tabindex="-1"'));
    check(`${lang}: the form is in the markup rather than built by a script`,
      main.includes("data-omat-form"));
    check(`${lang}: all five field groups ship`,
      (main.match(/data-omat-group=/g) || []).length === 5);
    check(`${lang}: four of them hidden`, (main.match(/data-omat-group="[A-Z_]+" hidden/g) || []).length === 4);
    check(`${lang}: the empty state ships with its text`, main.includes(t("omat_empty")));
    check(`${lang}: the undo strip is a live region`, main.includes('data-omat-undo role="status"'));
    check(`${lang}: the refusal is announced`, main.includes('data-omat-err role="alert"'));
    check(`${lang}: every field carries a name`,
      !/<input(?![^>]*aria-label)(?![^>]*data-omat-in)[^>]*>/.test(main));
    check(`${lang}: a number is typed on a numeric keypad, never a spinner`,
      !main.includes('type="number"') && main.includes('inputmode="decimal"'));
    check(`${lang}: the five applications are named`,
      ["WALL_FLOOR_COVERING", "DRYWALL_BOARDING", "COATING", "PANEL_CUTTING", "LINEAR_STOCK"]
        .every((id) => main.includes(OMAT_COPY[lang][`omat_app_${id}`])));
    check(`${lang}: it says what the history does not record`,
      main.includes(OMAT_COPY[lang].omat_hist_note));
    check(`${lang}: and where the rows live`, main.includes(OMAT_COPY[lang].omat_sync_note));
  }
}

head("9b. the copy exists in all ten languages and nothing is a key");
{
  for (const lang of LANGS) {
    check(`${lang}: copy exists`, Boolean(OMAT_COPY[lang]));
    for (const key of OMAT_COPY_KEYS) {
      const value = (OMAT_COPY[lang] || {})[key];
      check(`${lang}: ${key} is written`, Boolean(value) && String(value).trim().length > 0);
      check(`${lang}: ${key} is not its own key`, value !== key);
    }
    // The runtime half lives in the dictionary, because the browser picks these after the
    // page is served. `omatpage_title` is there for a third reason: it is the footer's
    // label on every page of the site.
    for (const key of ["omatpage_title", "omat_empty", "omat_undo", "omat_deleted",
      "omat_price_none", "omat_trend_up", "omat_trend_down", "omat_trend_mixed",
      "omat_own_group", "omat_name_needed"]) {
      const value = (DICT[lang] || {})[key];
      check(`${lang}: ${key} is in the dictionary`, Boolean(value) && value !== key);
    }
  }
  eq("the title is the page's own name in Polish", DICT.pl.omatpage_title, "Moje materiały");
}

/* ================================================================== 10. the net */

head("10. no key is printed where a visitor can read it");
{
  /* Session 41 shipped the word `undefined` beside six flags on 370 pages with every suite
     green; session 57 printed the literal `convpage_title` in every footer the same way.
     Both were one list read in two places. This is the same net for this session's keys:
     a page may contain an `omat_*` string in a `data-` attribute or a script, but never as
     text somebody reads. */
  const files = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      if ([".git", "node_modules", "docs", "src", "scripts", "assets", "functions"].includes(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".html")) files.push(full);
    }
  })(ROOT);

  const KEY = /\b(omat_[a-z_]+|omatpage_[a-z_]+)\b/;
  let dirty = 0;
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    // Only the text a reader sees: tags, attributes and scripts stripped out first.
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]*>/g, " ");
    if (KEY.test(text)) {
      dirty++;
      check(`${relative(ROOT, file)} prints a key`, false, KEY.exec(text)[0]);
    }
  }
  check(`no key printed on any of the ${files.length} shipped pages`, dirty === 0);
  check("and the word `undefined` is nowhere on this page either",
    !readFileSync(p("moje-materialy/index.html"), "utf8").includes("undefined"));
}

/* ------------------------------------------------------------------ report */

console.log(`\nown materials: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
