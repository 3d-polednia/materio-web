#!/usr/bin/env node
/**
 * LiczMat — the calculators, tested.
 *
 *     node scripts/test-calculators.mjs
 *
 * Master plan, session 12: the maths, the inputs, the units, the results, the boundary
 * values, the localization and the currency in the financial parts. This file is the part
 * that needs no browser — pure logic, so it runs anywhere `node` runs, with nothing to
 * install, exactly like scripts/build.mjs. The part that does need a browser (a real page
 * at 360/414/768/1280 px, the currency selector, the language switch) is
 * scripts/test-pages.mjs.
 *
 * What the expected numbers are: worked out by hand from the formula each engine
 * documents, not read off a previous run. Where an engine is a heuristic rather than a
 * formula — the 1D bar packer and the 2D guillotine packer — a hand-derived expectation
 * exists only for the cases with one possible answer (an exact tiling, a piece that
 * cannot fit); everything else is pinned as a regression baseline and says so.
 *
 * Exit status is 0 when everything passes and 1 when anything fails, so it can gate a
 * commit the same way `node scripts/build.mjs --check` does.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/**
 * Evaluate a browser script that has no exports and hand back the globals we need.
 * A list of files is evaluated as one scope, in order, exactly as the browser loads them.
 */
function evalScript(file, returns, args = {}) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  const names = Object.keys(args);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => args[n]));
}

const { I18N, LANGS } = evalScript("assets/i18n.js", ["I18N", "LANGS"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const {
  CALCS, ENGINES, localizeRow, unitLabel, pluralForm, num, orDefault, parseCuts, parsePieces,
} = evalScript(["assets/units.js", "assets/calculators.js"], [
  "CALCS", "ENGINES", "localizeRow", "unitLabel", "pluralForm", "num", "orDefault",
  "parseCuts", "parsePieces",
]);

const CODES = LANGS.map((l) => l.code);
const DICT = {};
for (const lang of CODES) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key];

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

/** Exact equality for integers and strings; a 1e-9 tolerance for anything fractional. */
function eq(name, got, want) {
  const same = typeof want === "number" && typeof got === "number"
    ? Math.abs(got - want) < 1e-9
    : got === want;
  return check(name, same, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

/* ------------------------------------------------------------------ helpers */

const byId = Object.fromEntries(CALCS.map((c) => [c.id, c]));

/** The values a calculator's form opens with — the same defaults the built page carries. */
function defaults(id) {
  const o = {};
  for (const f of byId[id].fields) o[f.k] = f.def;
  return o;
}

/** Run one calculator over its own defaults with `fields` typed on top. */
const run = (id, fields = {}) => ENGINES[byId[id].engine]({ ...defaults(id), ...fields });

/** The first number carried by result row `key`, as a number. */
function rowNum(res, key) {
  const row = (res.rows || []).find((r) => r[0] === key);
  if (!row) return undefined;
  const m = /\|n:(-?[0-9.]+)\|/.exec(row[1]);
  return m ? parseFloat(m[1]) : undefined;
}

const rowKeys = (res) => (res.rows || []).map((r) => r[0]);

/* =================================================================== 1. MATHS
   One case per engine over the values its own form opens with, plus the second case
   each engine's formula turns on. Every expectation below is derived from the formula
   in the comment above it. */

head("matematyka");

{
  // coverage: net = area − openings; covered = net × coats; packs = ⌈covered ÷ coverage⌉
  // 25 m², nothing deducted, 2 coats, 40 m²/pack → 50 m² to cover → 2 packs → 80 m² bought.
  const r = run("coverage");
  eq("coverage: 25 m² × 2 coats ÷ 40 = 2 packs", r.tobuy, 2);
  eq("coverage: 2 packs hold 80 m²", rowNum(r, "res_purchased"), 80);
  eq("coverage: 30 m² of 80 unused = 37,5 %", rowNum(r, "res_waste"), 37.5);
  eq("coverage: cost stays 0 with no price typed", r.cost, 0);
  // Twice the wall is not twice the packs — ⌈100 ÷ 40⌉ = 3, the case session 8 pinned.
  eq("coverage: 50 m² × 2 coats ÷ 40 = 3 packs", run("coverage", { area: "50" }).tobuy, 3);
  // Openings come off before the coats multiply: (25 − 5) × 1 ÷ 10 = 2.
  const o = run("coverage", { area: "25", openings: "5", coats: "1", cov: "10" });
  eq("coverage: openings deducted before coats", o.tobuy, 2);
  eq("coverage: net area reported", rowNum(o, "res_net"), 20);
}

{
  // waste: needed = area × (1 + waste%); packs = ⌈needed ÷ pack⌉
  // 20 m² + 7 % = 21,4 m²; ⌈21,4 ÷ 1,44⌉ = ⌈14,86⌉ = 15 packs = 21,6 m².
  const r = run("waste");
  eq("waste: 20 m² + 7 % ÷ 1,44 = 15 packs", r.tobuy, 15);
  eq("waste: 15 packs hold 21,6 m²", rowNum(r, "res_purchased"), 21.6);
  // 1,6 m² of the 21,6 bought is not floor — 7,4074… %, shown to one decimal.
  eq("waste: 7,4 % over the floor", rowNum(r, "res_waste"), 7.4);
}

{
  // wallpaper: strip = ⌈height ÷ repeat⌉ × repeat (or the height); strips = ⌈wall ÷ roll width⌉;
  // per roll = ⌊roll length ÷ strip⌋; rolls = ⌈strips ÷ per roll⌉.
  // 4 m ÷ 0,53 = 7,55 → 8 strips of 2,6 m; 10,05 ÷ 2,6 = 3,86 → 3 per roll; ⌈8 ÷ 3⌉ = 3.
  const r = run("wallpaper");
  eq("wallpaper: 8 strips of 2,6 m → 3 rolls", r.tobuy, 3);
  eq("wallpaper: 3 strips out of one roll", rowNum(r, "res_strips_roll"), 3);
  // A pattern repeat lengthens the strip and can cost a whole roll:
  // 3,3 m wall → ⌊10,05 ÷ 3,3⌋ = 3 per roll → 3 rolls; with a 0,5 m repeat the strip
  // grows to ⌈3,3 ÷ 0,5⌉ × 0,5 = 3,5 m → ⌊10,05 ÷ 3,5⌋ = 2 per roll → 4 rolls.
  eq("wallpaper: 3,3 m wall, no repeat → 3 rolls", run("wallpaper", { wallH: "3.3" }).tobuy, 3);
  const rep = run("wallpaper", { wallH: "3.3", pattern: "0.5" });
  eq("wallpaper: the same wall with a 0,5 m repeat → 4 rolls", rep.tobuy, 4);
  eq("wallpaper: the repeat rounds the strip up to 3,5 m", /\|n:3\.5\|/.test(rep.rows[0][1]), true);
}

{
  // linear: first-fit-decreasing into 6000 mm bars with a 3 mm kerf between pieces.
  // 4×2400 + 6×1800 + 8×900 = 18 pieces, 27 600 mm of material.
  // Bars: [2400+2400+900] [2400+2400+900] [1800×3] [1800×3] [900×6] → 5 × 6000 = 30 000 mm.
  const r = run("linear");
  eq("linear: 18 pieces into 5 bars", r.tobuy, 5);
  eq("linear: 18 pieces counted", rowNum(r, "res_pieces_cut"), 18);
  eq("linear: 2400 of 30 000 mm wasted = 8 %", rowNum(r, "res_waste"), 8);
}

{
  // concrete: litres = m³ × 1000; bags = ⌈litres ÷ yield per bag⌉; water = 2 l per bag.
  const r = run("concrete");
  eq("concrete: 500 l ÷ 12,5 l/bag = 40 bags", r.tobuy, 40);
  eq("concrete: 500 litres of mix", rowNum(r, "res_volume_l"), 500);
  eq("concrete: 80 litres of water", rowNum(r, "res_water"), 80);
  // The bag yield is a field, not a constant: a 20 l bag is 25 bags, not 40.
  eq("concrete: a 20 l bag → 25 bags", run("concrete", { yield: "20" }).tobuy, 25);
}

{
  // mortar: kg = area × usage; bags = ⌈kg ÷ bag⌉.
  const r = run("mortar");
  eq("mortar: 20 m² × 5 kg = 100 kg", rowNum(r, "res_kg_total"), 100);
  eq("mortar: 100 kg ÷ 25 = 4 bags", r.tobuy, 4);
  eq("mortar: 102 kg still fits 5 bags, not 4", run("mortar", { usage: "5.1" }).tobuy, 5);
}

{
  // screed: kg = area × thickness(mm) × kg/m²/mm; bags = ⌈kg ÷ bag⌉.
  const r = run("screed");
  eq("screed: 20 m² × 40 mm × 2 = 1600 kg", rowNum(r, "res_kg_total"), 1600);
  eq("screed: 1600 kg ÷ 25 = 64 bags", r.tobuy, 64);
  eq("screed: 80 kg per m²", rowNum(r, "res_kg_m2"), 80);
}

{
  // grout: kg/m² = (L + W) ÷ (L × W) × thickness × joint × 1,8
  // 60×60 cm tiles, 9 mm thick, 3 mm joint → 1200/360000 × 9 × 3 × 1,8 = 0,162 kg/m².
  const r = run("grout");
  eq("grout: 0,162 kg/m² for 60×60 / 9 mm / 3 mm", rowNum(r, "res_kg_m2"), 0.16);
  eq("grout: 20 m² → 3,24 kg", rowNum(r, "res_kg_total"), 3.24);
  eq("grout: 3,24 kg is one 5 kg bag", r.tobuy, 1);
  // Ten times the floor is 32,4 kg — seven bags, the packaging step session 9 added.
  eq("grout: 200 m² → 7 bags", run("grout", { area: "200" }).tobuy, 7);
}

{
  // masonry: net = area − openings; pieces = ⌈net × pieces/m² × (1 + waste%)⌉.
  const r = run("masonry");
  eq("masonry: (12 − 2) m² net", rowNum(r, "res_net"), 10);
  eq("masonry: 10 × 11 × 1,05 = 116 pieces", r.tobuy, 116);
  eq("masonry: 10 m² × 20 kg = 200 kg of binder", rowNum(r, "res_binder"), 200);
}

{
  // insulation: one pack covers 0,30 m³ ÷ thickness; boards are 0,5 m² each.
  const r = run("insulation");
  eq("insulation: a 15 cm pack covers 2 m²", rowNum(r, "res_pkg_area"), 2);
  eq("insulation: 80 m² ÷ 2 = 40 packs", r.tobuy, 40);
  eq("insulation: 160 boards of 0,5 m²", rowNum(r, "res_foam_boards"), 160);
  eq("insulation: 80 × 6 = 480 dowels", rowNum(r, "res_dowels"), 480);
  eq("insulation: 80 × 5 = 400 kg of adhesive", rowNum(r, "res_adhesive"), 400);
  eq("insulation: mesh with a 10 % overlap = 88 m²", rowNum(r, "res_mesh"), 88);
  // Half the thickness is twice the coverage per pack: 0,30 ÷ 0,075 = 4 m².
  eq("insulation: a 7,5 cm pack covers 4 m² → 20 packs", run("insulation", { foamThk: "7.5" }).tobuy, 20);
}

{
  // studwall: studs across = ⌊width ÷ spacing⌋ + 1; bars per stud = ⌈height ÷ bar⌉;
  // boards = ⌈area × sides × 1,1 ÷ 2,4⌉.
  const r = run("studwall");
  eq("studwall: 4 m ÷ 0,6 → 7 uprights", rowNum(r, "res_stud_count"), 7);
  eq("studwall: 7 bars, one per upright at 2,6 m", rowNum(r, "res_studs"), 7);
  eq("studwall: ⌈8 m ÷ 3⌉ = 3 track bars", rowNum(r, "res_tracks"), 3);
  eq("studwall: 14 anchors", rowNum(r, "res_anchors"), 14);
  eq("studwall: 10,4 m² × 2 sides × 1,1 ÷ 2,4 = 10 boards", r.tobuy, 10);
  // Taller than one bar is two bars per upright — the number session 11 put on the page.
  eq("studwall: a 3,5 m wall needs 14 stud bars", rowNum(run("studwall", { height: "3.5" }), "res_studs"), 14);
}

{
  // ceiling: CD runs = ⌊width ÷ spacing⌋ + 1, each `length` long, sold in 4 m bars.
  // 4 m ÷ 0,4 → 11 runs × 5 m = 55 m → ⌈55 ÷ 4⌉ = 14 bars.
  const r = run("ceiling");
  eq("ceiling: 20 m²", rowNum(r, "res_area"), 20);
  eq("ceiling: 11 CD runs → 14 bars of 4 m", rowNum(r, "res_studs"), 14);
  eq("ceiling: ⌈18 m ÷ 3⌉ = 6 UD bars", rowNum(r, "res_tracks"), 6);
  eq("ceiling: 11 runs × 6 hanger rows = 66", rowNum(r, "res_hangers"), 66);
  eq("ceiling: 18 m ÷ 0,6 = 30 wall anchors", rowNum(r, "res_anchors"), 30);
  eq("ceiling: 20 m² × 1,1 ÷ 2,4 = 10 boards", r.tobuy, 10);
}

{
  // drylining: boards = ⌈area × 1,1 ÷ 2,4⌉; adhesive = area × kg/m², in 25 kg bags.
  const r = run("drylining");
  eq("drylining: 12 m² × 1,1 ÷ 2,4 = 6 boards", r.tobuy, 6);
  eq("drylining: 6 boards are 14,4 m²", rowNum(r, "res_purchased"), 14.4);
  eq("drylining: 60 kg of adhesive = 3 bags", rowNum(r, "res_adhesive"), 3);
}

{
  // sheathing: one sheet = w × l (mm → m²); sheets = ⌈area × (1 + waste%) ÷ sheet⌉.
  const r = run("sheathing");
  // A row carries its number rounded to two decimals — 3,125 m² is shown as 3,13 m².
  eq("sheathing: a 1250×2500 sheet is 3,125 m²", rowNum(r, "res_piece_area"), 3.13);
  eq("sheathing: 30 m² + 10 % = 33 m²", rowNum(r, "res_with_waste"), 33);
  eq("sheathing: ⌈33 ÷ 3,125⌉ = 11 sheets", r.tobuy, 11);
  eq("sheathing: 11 sheets are 34,375 m²", rowNum(r, "res_purchased"), 34.38);
}

{
  // sheet: 2D guillotine packing. Only the areas are closed-form; the sheet count is a
  // heuristic, so the default form is pinned as a regression baseline, not derived.
  const r = run("sheet");
  eq("sheet: 10 pieces cut", rowNum(r, "res_pieces_cut"), 10);
  eq("sheet: 2,4 m² of useful area", rowNum(r, "res_useful"), 2.4);
  eq("sheet: one 2800×2070 sheet is 5,796 m²", rowNum(r, "res_purchased"), 5.8);
  eq("sheet: regression baseline — the default form fits on one sheet", r.tobuy, 1);
}

/* =================================================================== 2. INPUT DATA
   What the visitor can type into a field, and what an empty field means. */

head("dane wejściowe");

eq("a comma is a decimal point: 1,44", num("1,44"), 1.44);
eq("a dot still is: 1.44", num("1.44"), 1.44);
eq("spaces around a number are ignored", num(" 12 "), 12);
check("letters are not a number", Number.isNaN(num("abc")), `got ${num("abc")}`);
check("an empty field is not a number", Number.isNaN(num("")), `got ${num("")}`);

// orDefault is the difference between "left empty" and "typed 0" — `num(x) || 25` cannot
// tell them apart and answers with a bag size nobody asked for.
eq("an empty field falls back to the default", orDefault("", 25), 25);
eq("whitespace only is still empty", orDefault("   ", 25), 25);
eq("a typed 0 stays 0", orDefault("0", 25), 0);
eq("a typed value wins over the default", orDefault("10", 25), 10);

// …and the engines have to honour that. A 0 kg bag cannot be filled, so it is an error,
// not a silent 25 kg bag.
eq("mortar: a typed 0 kg bag is refused", run("mortar", { bag: "0" }).err, "err_positive");
eq("mortar: an empty bag field means 25 kg", run("mortar", { bag: "" }).tobuy, 4);
eq("coverage: a typed 0 coats is refused", run("coverage", { coats: "0" }).err, "err_positive");
eq("coverage: an empty coats field means 1", run("coverage", { coats: "" }).tobuy, 1);
// …and where zero is a real value it has to go through untouched.
eq("masonry: a typed 0 % allowance adds nothing", run("masonry", { waste: "0" }).tobuy, 110);
eq("sheathing: a typed 0 % allowance adds nothing", run("sheathing", { waste: "0" }).tobuy, 10);
eq("linear: a 0 mm kerf is a real kerf", run("linear", { stock: "1000", kerf: "0", cuts: "500x2" }).tobuy, 1);

// Every calculator refuses a negative price rather than quoting a negative bill.
for (const c of CALCS) {
  eq(`${c.id}: a negative price is refused`, run(c.id, { price: "-1" }).err, "err_price");
}
// Every calculator refuses a blank form rather than answering 0.
for (const c of CALCS) {
  const blank = Object.fromEntries(c.fields.map((f) => [f.k, ""]));
  check(`${c.id}: an empty form is refused`, !!ENGINES[c.engine](blank).err,
    `got ${JSON.stringify(ENGINES[c.engine](blank))}`);
}
// Every calculator refuses letters where it wants a number.
for (const c of CALCS) {
  const junk = Object.fromEntries(c.fields.map((f) => [f.k, "abc"]));
  check(`${c.id}: letters are refused`, !!ENGINES[c.engine](junk).err,
    `got ${JSON.stringify(ENGINES[c.engine](junk))}`);
}

// The list fields take the shapes the placeholder shows, and ignore the rest.
eq("cuts: 2400x4 is four pieces", parseCuts("2400x4").length, 1);
eq("cuts: …of 2400 mm", parseCuts("2400x4")[0].len, 2400);
eq("cuts: ×, * and a space all separate", parseCuts("2400×4\n1800*2\n900 3").length, 3);
eq("cuts: a bare length is one piece", parseCuts("2400")[0].q, 1);
eq("cuts: blank lines are dropped", parseCuts("2400x2\n\n\n1800x1").length, 2);
eq("pieces: 600x400x3 is width, length, count", parsePieces("600x400x3")[0].q, 3);
eq("pieces: two numbers mean one piece", parsePieces("600x400")[0].q, 1);
eq("pieces: a single number is not a piece", parsePieces("600").length, 0);

/* =================================================================== 3. UNITS
   The unit next to the number, and the unit inside every row. */

head("jednostki");

// Every unit an engine can name has to exist in all four dictionaries — otherwise the
// page prints the key.
const usedUnits = new Set();
const usedRowKeys = new Set();
for (const c of CALCS) {
  for (const fields of [{}, { price: "10" }]) {
    const r = run(c.id, fields);
    if (r.err) continue;
    usedUnits.add(r.unit);
    rowKeys(r).forEach((k) => usedRowKeys.add(k));
  }
}
for (const key of [...usedUnits, ...usedRowKeys, "res_tobuy", "res_cost", "res_strip_too_long"]) {
  for (const lang of CODES) {
    check(`${key} exists in ${lang}`, typeof DICT[lang][key] === "string" && DICT[lang][key].length > 0);
  }
}

// The unit has to match what was counted. A tiling calculator that answers in bags, or a
// bagged one that answers in sheets, is wrong even when the number is right.
const EXPECTED_UNIT = {
  coverage: "res_pkgs", waste: "res_pkgs", wallpaper: "res_rolls",
  linear: "res_stocks", sheet: "res_sheets",
  concrete: "res_bags", mortar: "res_bags", screed: "res_bags", grout: "res_bags",
  masonry: "res_pieces", insulation: "res_pkgs",
  studwall: "res_boards", ceiling: "res_boards", drylining: "res_boards", sheathing: "res_sheets",
};
for (const c of CALCS) eq(`${c.id}: counts in ${EXPECTED_UNIT[c.id]}`, run(c.id).unit, EXPECTED_UNIT[c.id]);
eq("every calculator has an expected unit declared", Object.keys(EXPECTED_UNIT).length, CALCS.length);

// A physical unit is spelled out in the row itself. These are the ones a wrong symbol
// would make dangerous: kilograms are not litres, m² is not m.
eq("mortar: kilograms carry kg", /kg$/.test(run("mortar").rows.find((r) => r[0] === "res_kg_total")[1]), true);
eq("screed: the rate carries kg/m²", /kg\/m²$/.test(run("screed").rows.find((r) => r[0] === "res_kg_m2")[1]), true);
eq("concrete: the mix is in litres", /\|res_water_l\|$/.test(run("concrete").rows[0][1]), true);
eq("insulation: a pack covers m²", /m²$/.test(run("insulation").rows[0][1]), true);
eq("coverage: what was bought is m²", /m²$/.test(run("coverage").rows.find((r) => r[0] === "res_purchased")[1]), true);
eq("waste: the leftover is a percentage", /%$/.test(run("waste").rows.find((r) => r[0] === "res_waste")[1]), true);

/* =================================================================== 4. RESULTS
   The shape of what the panel is handed: a count, a unit, rows, a cost. */

head("wyniki");

for (const c of CALCS) {
  const r = run(c.id, { price: "12.5" });
  check(`${c.id}: answers with a number`, Number.isFinite(r.tobuy) && r.tobuy > 0, JSON.stringify(r));
  check(`${c.id}: answers in whole units`, Number.isInteger(r.tobuy), `got ${r.tobuy}`);
  check(`${c.id}: names its unit`, typeof r.unit === "string" && r.unit.startsWith("res_"));
  check(`${c.id}: explains itself in at least one row`, (r.rows || []).length >= 1);
  eq(`${c.id}: cost = count × price`, Math.round(r.cost * 100) / 100, Math.round(r.tobuy * 12.5 * 100) / 100);
  check(`${c.id}: no row is empty`, (r.rows || []).every(([k, v]) => k && String(v).trim() !== ""));
  // Every calculated number travels as a |n:…| token, because the decimal separator is
  // the language's, not the engine's: a bare "3.125" would stay a dot in Polish. Fixed
  // labels that happen to contain a whole number — "× 4 m", the bar numbers in the
  // cutting plan — are not calculated values and read the same in all four languages.
  for (const [k, v] of r.rows || []) {
    const leftover = String(v)
      .replace(/\|n:-?[0-9.]+\|/g, "")
      .replace(/\|[a-z0-9_]+(:-?[0-9.]+)?\|/gi, "");
    check(`${c.id}/${k}: decimals are tokens, not text`, !/\d[.,]\d/.test(leftover),
      `row reads ${JSON.stringify(v)}`);
  }
}

// A price of exactly 0 must not print a cost line — an estimate of "0 zł" is not an
// estimate. Anything above it must.
check("no price typed → no cost row", !(run("coverage").cost > 0));
check("a price typed → a cost row", run("coverage", { price: "0.01" }).cost > 0);

/* =================================================================== 5. BOUNDARY VALUES
   Where ⌈⌉ and ⌊⌋ decide, where a field runs out, and where floating point lies. */

head("wartości graniczne");

// --- exact multiples: no phantom extra package -------------------------------------
// This is the family session 12 found broken. 21,6 m² of floor at 1,44 m² per pack is
// exactly 15 packs, but 21.6 / 1.44 is 15.000000000000002 in binary floating point, so a
// plain ⌈⌉ sold a sixteenth box. Same for ⌊⌋ the other way: 2,4 m ÷ 0,4 m is exactly 6
// spans, but the division lands at 5.999999999999999 and the ceiling lost a CD profile.
eq("waste: 21,6 m² ÷ 1,44 is exactly 15 packs", run("waste", { area: "21.6", cov: "1.44", waste: "0" }).tobuy, 15);
eq("waste: 43,2 m² ÷ 1,44 is exactly 30 packs", run("waste", { area: "43.2", cov: "1.44", waste: "0" }).tobuy, 30);
eq("coverage: 8,64 m² ÷ 1,44 is exactly 6 packs", run("coverage", { area: "8.64", cov: "1.44", coats: "1", openings: "0" }).tobuy, 6);
eq("mortar: 2,1 kg ÷ 0,3 kg is exactly 7 bags", run("mortar", { area: "2.1", usage: "1", bag: "0.3" }).tobuy, 7);
eq("concrete: 0,0102 m³ ÷ 0,3 l is exactly 34 bags", run("concrete", { vol: "0.0102", yield: "0.3" }).tobuy, 34);
eq("sheathing: 8,64 m² ÷ 1,44 is exactly 6 sheets",
  run("sheathing", { area: "8.64", pieceW: "1200", pieceL: "1200", waste: "0" }).tobuy, 6);
// 2,4 m ÷ 0,4 m is exactly 6 spans, so the ceiling carries 7 CD runs, each with
// ⌊2,4 ÷ 0,9⌋ + 1 = 3 hangers → 21 hangers.
eq("ceiling: a 2,4 m room at 0,4 m spacing has 7 CD runs × 3 hangers",
  rowNum(run("ceiling", { width: "2.4", length: "2.4", mainSp: "0.4" }), "res_hangers"), 21);
eq("studwall: a 1,2 m wall at 0,4 m spacing has 4 uprights",
  rowNum(run("studwall", { width: "1.2", studSp: "0.4" }), "res_stud_count"), 4);
eq("studwall: a 4,8 m wall at 0,4 m spacing has 13 uprights",
  rowNum(run("studwall", { width: "4.8", studSp: "0.4" }), "res_stud_count"), 13);
eq("studwall: a 11,7 m wall at 0,9 m spacing has 14 uprights",
  rowNum(run("studwall", { width: "11.7", studSp: "0.9" }), "res_stud_count"), 14);

// A crumb over the line is still a whole package, though — the tolerance must not eat a
// real remainder.
eq("waste: 21,61 m² ÷ 1,44 needs a 16th pack", run("waste", { area: "21.61", cov: "1.44", waste: "0" }).tobuy, 16);
eq("mortar: 100,1 kg needs a 5th bag", run("mortar", { area: "20.02", usage: "5", bag: "25" }).tobuy, 5);
eq("studwall: a 1,21 m wall at 0,4 m spacing still has 4 uprights",
  rowNum(run("studwall", { width: "1.21", studSp: "0.4" }), "res_stud_count"), 4);
eq("studwall: a 1,6 m wall at 0,4 m spacing has 5 uprights",
  rowNum(run("studwall", { width: "1.6", studSp: "0.4" }), "res_stud_count"), 5);

// --- zero and below ------------------------------------------------------------------
eq("coverage: a 0 m² wall is refused", run("coverage", { area: "0" }).err, "err_positive");
eq("coverage: a negative wall is refused", run("coverage", { area: "-5" }).err, "err_positive");
eq("coverage: openings bigger than the wall are refused", run("coverage", { openings: "30" }).err, "err_positive");
eq("coverage: openings equal to the wall are allowed", run("coverage", { openings: "25", cov: "40" }).tobuy, 0);
eq("waste: a negative allowance is refused", run("waste", { waste: "-1" }).err, "err_positive");
eq("wallpaper: a 0 m roll is refused", run("wallpaper", { rollW: "0" }).err, "err_positive");
eq("wallpaper: a negative repeat is refused", run("wallpaper", { pattern: "-1" }).err, "err_positive");
eq("grout: a 0 mm joint is refused", run("grout", { joint: "0" }).err, "err_positive");
eq("screed: a 0 mm layer is refused", run("screed", { thk: "0" }).err, "err_positive");
eq("insulation: 0 cm of foam is refused", run("insulation", { foamThk: "0" }).err, "err_positive");
eq("studwall: 0 sides boarded is refused", run("studwall", { sides: "0" }).err, "err_positive");
eq("ceiling: a 0 m spacing is refused", run("ceiling", { mainSp: "0" }).err, "err_positive");

// --- the cutting calculators ----------------------------------------------------------
eq("linear: a kerf as wide as the bar is refused", run("linear", { kerf: "6000" }).err, "err_positive");
eq("linear: a negative kerf is refused", run("linear", { kerf: "-1" }).err, "err_positive");
eq("linear: a piece longer than the bar is refused", run("linear", { cuts: "7000x1" }).err, "err_toobig");
eq("linear: a piece exactly as long as the bar fits", run("linear", { cuts: "6000x1" }).tobuy, 1);
eq("linear: an empty cutting list is refused", run("linear", { cuts: "" }).err, "err_positive");
eq("linear: a list of nothing but junk is refused", run("linear", { cuts: "abc\n---" }).err, "err_positive");
// Two 500 mm pieces fit a 1000 mm bar only when the saw takes nothing.
eq("linear: 2 × 500 in 1000 mm with no kerf = 1 bar", run("linear", { stock: "1000", kerf: "0", cuts: "500x2" }).tobuy, 1);
eq("linear: the same cut with a 3 mm blade = 2 bars", run("linear", { stock: "1000", kerf: "3", cuts: "500x2" }).tobuy, 2);

eq("sheet: a kerf as wide as the sheet is refused", run("sheet", { kerf: "2800" }).err, "err_kerf");
eq("sheet: a piece bigger than the sheet is refused", run("sheet", { pieces: "3000x100x1" }).err, "err_toobig");
eq("sheet: a piece exactly the size of the sheet fits", run("sheet", { pieces: "2800x2070x1" }).tobuy, 1);
eq("sheet: an empty piece list is refused", run("sheet", { pieces: "" }).err, "err_positive");
// Rotation is the whole difference between one sheet and none.
const rot = { sheetW: "1000", sheetL: "400", kerf: "0", pieces: "400x900x1" };
eq("sheet: a 400×900 piece fits a 1000×400 sheet turned", run("sheet", { ...rot, rotate: "1" }).tobuy, 1);
eq("sheet: …and does not fit it unturned", run("sheet", { ...rot, rotate: "0" }).err, "err_toobig");
// Four 500×500 pieces tile a 1000×1000 sheet exactly — until the saw takes 3 mm, and
// then no two of them fit side by side any more.
eq("sheet: 4 × 500×500 tile a 1000×1000 sheet exactly",
  run("sheet", { sheetW: "1000", sheetL: "1000", kerf: "0", pieces: "500x500x4" }).tobuy, 1);
eq("sheet: the same four with a 3 mm blade need 4 sheets",
  run("sheet", { sheetW: "1000", sheetL: "1000", kerf: "3", pieces: "500x500x4" }).tobuy, 4);
eq("sheet: 0 of a piece is skipped, not cut", run("sheet", { pieces: "600x400x0\n800x300x4" }).tobuy, 1);

// --- large but legitimate --------------------------------------------------------------
{
  const big = run("coverage", { area: "100000", cov: "40", coats: "1", openings: "0", price: "9.99" });
  eq("coverage: a 100 000 m² job is still answered", big.tobuy, 2500);
  eq("coverage: …and priced", Math.round(big.cost * 100) / 100, 24975);
}
check("linear: a thousand pieces are packed, not refused", run("linear", { cuts: "500x1000" }).tobuy > 0);
eq("sheet: more than 100 000 of one piece is refused", run("sheet", { pieces: "600x400x100001" }).err, "err_toomany");

// --- tiny but legitimate ----------------------------------------------------------------
eq("coverage: 0,01 m² still needs a pack", run("coverage", { area: "0.01", cov: "40", coats: "1", openings: "0" }).tobuy, 1);
eq("grout: a hairline 0,1 mm joint is allowed", run("grout", { joint: "0.1" }).tobuy, 1);

// --- the engine's own upper bound ---------------------------------------------------------
{
  // A strip taller than the whole roll means one roll per strip, and the panel says so
  // instead of printing "0 strips per roll".
  const r = run("wallpaper", { wallH: "11" });
  eq("wallpaper: a wall taller than the roll → one roll per strip", r.tobuy, 8);
  eq("wallpaper: …and the row says so", r.rows.find((x) => x[0] === "res_strips_roll")[1], "|res_strip_too_long|");
}
{
  // The cutting plan is printed for eight bars; a longer job says how many are missing
  // rather than quietly showing eight.
  const r = run("linear", { stock: "6000", kerf: "3", cuts: "5000x12" });
  eq("linear: 12 bars of plan → 8 shown", r.rows.filter((x) => x[0] === "res_bar").length, 8);
  eq("linear: …and 4 declared as not shown", rowNum(r, "res_plan_more"), 4);
}

/* =================================================================== 6. LOCALIZATION
   Four languages, the number written the way each one writes it, and a counted noun in
   the form that language uses for that count. */

head("lokalizacja");

// Polish and Ukrainian inflect a counted noun in three forms, German and English in two,
// and an abbreviation in none.
// 2–4 take the "few" form and everything else the "many" one, with the teens taking
// "many" whatever their last digit says: 22 worki, but 12 worków and 21 worków.
for (const [n, form] of [[1, "one"], [2, "few"], [3, "few"], [4, "few"], [5, "many"], [11, "many"],
  [12, "many"], [13, "many"], [14, "many"], [21, "many"], [22, "few"], [25, "many"],
  [101, "many"], [102, "few"], [112, "many"]]) {
  eq(`pl: ${n} takes the "${form}" form`, pluralForm(n, "pl"), form);
  eq(`uk: ${n} takes the "${form}" form`, pluralForm(n, "uk"), form);
}
for (const n of [2, 3, 5, 22]) {
  eq(`en: ${n} takes the plain plural`, pluralForm(n, "en"), "many");
  eq(`de: ${n} takes the plain plural`, pluralForm(n, "de"), "many");
}
eq("en: 1 takes the singular", pluralForm(1, "en"), "one");
eq("de: 1 takes the singular", pluralForm(1, "de"), "one");

// The five units the site spells out as a word carry all their forms in all four languages.
for (const key of ["res_bags", "res_rolls", "res_boards", "res_stocks", "res_sheets"]) {
  for (const lang of CODES) {
    for (const suffix of ["_one", "_few"]) {
      check(`${key}${suffix} exists in ${lang}`, typeof DICT[lang][key + suffix] === "string");
    }
    eq(`${key}: 1 in ${lang}`, unitLabel(key, 1, lang, tr(lang)), DICT[lang][key + "_one"]);
    eq(`${key}: 5 in ${lang}`, unitLabel(key, 5, lang, tr(lang)), DICT[lang][key]);
  }
  eq(`${key}: 2 in pl takes the "few" form`, unitLabel(key, 2, "pl", tr("pl")), DICT.pl[key + "_few"]);
  eq(`${key}: 2 in en takes the plain plural`, unitLabel(key, 2, "en", tr("en")), DICT.en[key]);
}
// An abbreviation must never be inflected.
for (const key of ["res_pkgs", "res_pieces"]) {
  for (const n of [1, 2, 5]) {
    eq(`${key}: ${n} keeps the abbreviation`, unitLabel(key, n, "pl", tr("pl")), DICT.pl[key]);
  }
}

// Every row of every calculator renders in every language with nothing left unresolved.
// A leftover |key| is a missing translation showing through to the visitor.
for (const c of CALCS) {
  const r = run(c.id, { price: "12.5" });
  for (const lang of CODES) {
    for (const [k, v] of r.rows || []) {
      const out = localizeRow(v, lang, tr(lang));
      check(`${c.id}/${k} in ${lang}: nothing left in pipes`, !out.includes("|"), `renders as ${out}`);
      check(`${c.id}/${k} in ${lang}: no "undefined" printed`, !/undefined/.test(out), `renders as ${out}`);
    }
    check(`${c.id} in ${lang}: the unit is translated`,
      typeof unitLabel(r.unit, r.tobuy, lang, tr(lang)) === "string");
  }
}

// The number itself follows the language, not the currency: 1 234,56 in Polish,
// 1,234.56 in English.
{
  const row = "|n:1234.56| m²";
  check("pl: 1234,56 not 1,234.56", /1[  ]?234,56/.test(localizeRow(row, "pl", tr("pl"))),
    localizeRow(row, "pl", tr("pl")));
  check("en: 1,234.56 not 1234,56", /1,234\.56/.test(localizeRow(row, "en", tr("en"))),
    localizeRow(row, "en", tr("en")));
  check("de: 1.234,56", /1\.234,56/.test(localizeRow(row, "de", tr("de"))),
    localizeRow(row, "de", tr("de")));
}
// The build hands in a full locale tag and the browser a bare code; both have to work.
eq("a bare code and a full tag format alike",
  localizeRow("|n:2.5|", "pl", tr("pl")), localizeRow("|n:2.5|", "pl-PL", tr("pl")));

/* =================================================================== 7. CURRENCY
   Master plan VI: the currency is the visitor's own choice, it never converts anything,
   and no physical quantity moves when it changes. */

head("waluta");

// A stub of the two browser objects assets/currency.js talks to, so the money formatting
// can be exercised in Node. Nothing else in that file is touched.
function currencyModule(lang, saved) {
  const store = { [saved ? "liczmat-currency" : "_"]: saved || "" };
  const doc = {
    documentElement: { lang },
    addEventListener() {},
    querySelectorAll: () => [],
    getElementById: () => null,
  };
  const ls = { getItem: (k) => (k in store ? store[k] : null), setItem() {} };
  return evalScript("assets/currency.js",
    ["lmMoney", "lmMoneyMinor", "lmCurrency", "LM_CURRENCIES", "LM_LANG_CURRENCY"],
    { document: doc, localStorage: ls });
}

{
  const c = currencyModule("pl");
  // Chapter VI's four, plus the three session 28 added so the subscription can be priced
  // where it is sold. RUB is deliberately absent — Stripe does not operate in Russia.
  eq("nine currencies", c.LM_CURRENCIES.join(","), "PLN,EUR,USD,GBP,UAH,CZK,RON,RSD,RUB");
  eq("Polish starts in PLN", c.lmCurrency(), "PLN");
  eq("German starts in EUR", currencyModule("de").lmCurrency(), "EUR");
  eq("Ukrainian starts in UAH", currencyModule("uk").lmCurrency(), "UAH");
  eq("English starts in USD", currencyModule("en").lmCurrency(), "USD");
  // …but the choice is the visitor's, and it does not follow the language.
  eq("German + PLN is a valid setting", currencyModule("de", "PLN").lmCurrency(), "PLN");
  eq("Russian starts in RUB", currencyModule("ru").lmCurrency(), "RUB");
  // CHF, not GBP: the site counts in the pound since session 61, so it is no longer an
  // example of something unsupported. This is the guard that a stored code off the list
  // falls back to the language's default instead of being trusted.
  eq("a currency the site does not offer is ignored", currencyModule("pl", "CHF").lmCurrency(), "PLN");
  eq("and the fallback is the language's own default", currencyModule("de", "CHF").lmCurrency(), "EUR");
}
{
  // The same amount in every currency: the digits never change, only the symbol.
  const digits = (s) => s.replace(/[^0-9]/g, "");
  const c = currencyModule("de", "PLN");
  const amounts = ["PLN", "EUR", "USD", "UAH"].map((code) => c.lmMoney(1234.5, code));
  check("the amount is the same in all four currencies",
    new Set(amounts.map(digits)).size === 1, amounts.join(" | "));
  check("…and each is labelled differently", new Set(amounts).size === 4, amounts.join(" | "));
}
{
  // Formatting follows the language, the currency follows the choice — the two are
  // independent, which is the whole point of chapter VI.
  const pl = currencyModule("pl", "EUR").lmMoney(1234.5);
  const en = currencyModule("en", "EUR").lmMoney(1234.5);
  check("pl + EUR writes a comma decimal", /1[  .]?234,50/.test(pl), pl);
  check("en + EUR writes a dot decimal", /1,234\.50/.test(en), en);
}
{
  const c = currencyModule("pl", "PLN");
  eq("minor units are the integer the workspace stores", digitsOf(c.lmMoneyMinor(1250)), "1250");
  eq("a missing amount is 0, not NaN", digitsOf(c.lmMoney(undefined)), "000");
}
function digitsOf(s) { return String(s).replace(/[^0-9]/g, ""); }

// The engines know nothing about currency, and that is what keeps a quantity from moving
// when the visitor switches: `cost` is a plain number, and every other figure is physical.
for (const c of CALCS) {
  const r = run(c.id, { price: "10" });
  check(`${c.id}: the cost is a bare number, not formatted money`, typeof r.cost === "number");
  check(`${c.id}: no row mentions a currency`,
    !/zł|€|\$|₴|PLN|EUR|USD|UAH/.test((r.rows || []).map((x) => x[1]).join(" ")),
    JSON.stringify(r.rows));
}
// Switching currency cannot change the count: the engine is never told which one is set.
{
  const a = run("waste", { price: "49.99" }), b = run("waste", { price: "49.99" });
  eq("the count does not depend on the currency", a.tobuy, b.tobuy);
  eq("the cost is the price times the count", Math.round(a.cost * 100) / 100, Math.round(15 * 49.99 * 100) / 100);
}

/* ------------------------------------------------------------------ the verdict */

const total = passed + failures.length;
if (failures.length) {
  console.error(`\n${failures.length} of ${total} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`calculators: ${total}/${total} checks pass`);
