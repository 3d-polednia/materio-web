#!/usr/bin/env node
/**
 * LiczMat — the unit converter, tested.
 *
 *     node scripts/test-converter.mjs
 *
 * Session 57, item C1 of the parity audit in docs/MASTER_PLAN.md: the converter was the
 * largest thing the Android app had and the website did not. The engine is a port of
 * core/calculation/UnitConverter.kt, so this file asks it the two questions a port has to
 * answer — does it hold the same units, and does it give the same numbers — and then asks
 * the page the questions every page here is asked.
 *
 * THE EXPECTATIONS ARE DERIVED, NEVER COPIED FROM THE TABLE. Reading a factor out of
 * assets/converter.js and asserting the same factor tests nothing: it would pass with
 * every number in the file wrong by the same amount. So §2 works in relations that exist
 * outside this repository — an inch is 2.54 cm, a mile is 1760 yards, an acre is 4840
 * square yards, a nautical mile is 1852 m, a foot cubed is 28.316846592 litres — and the
 * factors have to produce them. That is the lesson session 47 wrote down in the app repo
 * after MaterialCatalogCalculationTest agreed with a rounding bug because its expectation
 * had been derived with the same broken line of code.
 *
 * The halves:
 *
 *   1. the table — eleven categories, their units, and what a unit must be;
 *   2. the arithmetic, against relations this file did not get from the table;
 *   3. temperature, the one category a factor cannot express;
 *   4. what the engine refuses, and that it refuses with null rather than with a zero;
 *   5. convFormat() — a whole number stays whole, and the language writes it;
 *   6. the route in src/ia.mjs and the ten slugs;
 *   7. the ten pages the build wrote, read back;
 *   8. the copy in ten languages, and the module's one name.
 *
 * Dependency-free, plain `node`, exit 1 on failure. Run it after touching
 * assets/converter.js, converterMain() in src/pages.mjs, the `converter` route or a
 * conv_* key.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, SECTION, urlConverter, urlCalcIndex } from "../src/site.mjs";
import { LEVEL, STATUS, route, navRoutes, validateIA } from "../src/ia.mjs";
import { CONV_COPY, CONV_COPY_KEYS } from "../src/conv-copy.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");

/** Every .html file the repo serves, which is every .html file in it. */
function walkHtml(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "docs") continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, out);
    else if (e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function evalScript(file, returns) {
  return new Function(`${read(file)}\nreturn {${returns.join(",")}};`)();
}

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);

/* The engine as the page loads it: assets/currency.js first, because convFormat() asks it
   for the language's number locale — the same pair scripts/build.mjs evaluates. */
const { CONV_CATS, convCat, convFactor, convConvert, convFormat, convNum } = evalScript(
  ["assets/currency.js", "assets/converter.js"],
  ["CONV_CATS", "convCat", "convFactor", "convConvert", "convFormat", "convNum"]);

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

/**
 * Two numbers the same to within a part in 10¹².
 *
 * Binary floating point cannot hold 0.1 or 2.54, so `1 in → cm` lands a crumb away from
 * 2.54 and an exact comparison would fail on arithmetic that is right. The tolerance is
 * relative, so it means the same thing for a millimetre and for a terabyte.
 */
const near = (name, got, want, tol = 1e-12) => check(name,
  typeof got === "number" && isFinite(got) && Math.abs(got - want) <= tol * Math.abs(want || 1),
  `expected ${want}, got ${got}`);

/* ================================================================== 1. the table */

head("1. eleven categories, and what a unit has to be");
{
  const KOTLIN_ORDER = ["length", "area", "volume", "mass", "temperature", "speed",
    "time", "pressure", "energy", "power", "data"];
  eq("eleven categories, in the app's own order",
    CONV_CATS.map((c) => c.id).join(), KOTLIN_ORDER.join());

  for (const cat of CONV_CATS) {
    check(`${cat.id}: more than one unit`, cat.units.length >= 3, `${cat.units.length}`);

    const symbols = cat.units.map(([s]) => s);
    eq(`${cat.id}: no symbol appears twice`, new Set(symbols).size, symbols.length);
    for (const [sym, f] of cat.units) {
      check(`${cat.id}/${sym}: the symbol is a non-empty string`,
        typeof sym === "string" && sym.trim() === sym && sym.length > 0, JSON.stringify(sym));
      check(`${cat.id}/${sym}: the factor is a positive finite number`,
        typeof f === "number" && isFinite(f) && f > 0, String(f));
    }

    // A base unit whose factor is not exactly 1 is a category that cannot say what its
    // own numbers are relative to.
    check(`${cat.id}: the base unit ${cat.base} is in the list`, symbols.includes(cat.base));
    eq(`${cat.id}: the base unit's factor is exactly 1`, convFactor(cat.id, cat.base), 1);

    // `def` is the site's own field — the pair the page opens on. It has to name two
    // different units this category really has, or the form opens on nothing.
    check(`${cat.id}: opens on two of its own units`,
      cat.def.length === 2 && symbols.includes(cat.def[0]) && symbols.includes(cat.def[1]),
      cat.def.join(" → "));
    check(`${cat.id}: does not open converting a unit into itself`, cat.def[0] !== cat.def[1]);
  }

  // The units are symbols, not words: that is what lets the page ship ten languages with
  // eleven translated strings instead of ninety. A symbol with a letter that only one
  // language has would break the promise quietly.
  const nonNeutral = [];
  for (const cat of CONV_CATS) {
    for (const [sym] of cat.units) {
      if (!/^[A-Za-z°²³/ ]+$/.test(sym)) nonNeutral.push(`${cat.id}/${sym}`);
    }
  }
  eq("every symbol is language-neutral", nonNeutral.join(", "), "");
}

/* ================================================================== 2. the arithmetic */

head("2. the numbers, against relations this file did not read out of the table");
{
  const c = (cat, from, to, v = 1) => convConvert(cat, from, to, v);

  // Length. The metric ladder, then the definitions the imperial units are defined BY:
  // an inch is exactly 25.4 mm, a foot is 12 inches, a yard 3 feet, a mile 1760 yards,
  // and a nautical mile is 1852 m by international agreement.
  near("1 m = 100 cm", c("length", "m", "cm"), 100);
  near("1 m = 1000 mm", c("length", "m", "mm"), 1000);
  near("1 km = 1000 m", c("length", "km", "m"), 1000);
  near("1 in = 2.54 cm", c("length", "in", "cm"), 2.54);
  near("1 ft = 12 in", c("length", "ft", "in"), 12);
  near("1 yd = 3 ft", c("length", "yd", "ft"), 3);
  near("1 mi = 1760 yd", c("length", "mi", "yd"), 1760);
  near("1 nmi = 1852 m", c("length", "nmi", "m"), 1852);

  // Area. Each of these is the length relation squared, plus the two land measures.
  near("1 m² = 10000 cm²", c("area", "m²", "cm²"), 10000);
  near("1 a = 100 m²", c("area", "a", "m²"), 100);
  near("1 ha = 100 a", c("area", "ha", "a"), 100);
  near("1 km² = 100 ha", c("area", "km²", "ha"), 100);
  near("1 ft² = 144 in²", c("area", "ft²", "in²"), 144);
  near("1 yd² = 9 ft²", c("area", "yd²", "ft²"), 9);
  near("1 ac = 4840 yd²", c("area", "ac", "yd²"), 4840);
  near("1 mi² = 640 ac", c("area", "mi²", "ac"), 640);

  // Volume. The base is the litre, so a cubic metre is a thousand of them; the US liquid
  // gallon is 4 quarts, 8 pints and 128 fluid ounces.
  near("1 m³ = 1000 l", c("volume", "m³", "l"), 1000);
  near("1 l = 1000 ml", c("volume", "l", "ml"), 1000);
  near("1 gal = 4 qt", c("volume", "gal", "qt"), 4);
  near("1 gal = 8 pt", c("volume", "gal", "pt"), 8);
  // A gallon is 128 fluid ounces by definition, and this comes out at 127.9999998: the
  // app's `fl oz` is 0.0295735296 l, which is the exact 0.0295735295625 rounded at the
  // tenth digit. The port keeps the app's number — a website that rounded it differently
  // would answer the same question with a different figure — and the error is one part in
  // 10⁷, six places below anything convFormat() prints.
  near("1 gal = 128 fl oz, to a part in 10⁶", c("volume", "gal", "fl oz"), 128, 1e-6);
  near("1 ft³ = 28.316846592 l", c("volume", "ft³", "l"), 28.316846592);

  // Mass. A pound is exactly 0.45359237 kg, an ounce a sixteenth of it, a stone fourteen.
  near("1 kg = 1000 g", c("mass", "kg", "g"), 1000);
  near("1 t = 1000 kg", c("mass", "t", "kg"), 1000);
  near("1 kg = 100 dag", c("mass", "kg", "dag"), 100);
  near("1 lb = 16 oz", c("mass", "lb", "oz"), 16);
  near("1 st = 14 lb", c("mass", "st", "lb"), 14);
  near("1 lb = 0.45359237 kg", c("mass", "lb", "kg"), 0.45359237);

  // Speed. 1 m/s is 3.6 km/h by definition; a mile an hour is 1.609344 km/h for the same
  // reason a mile is 1609.344 m; a knot is a nautical mile an hour.
  near("3.6 km/h = 1 m/s", c("speed", "km/h", "m/s", 3.6), 1);
  near("1 mph = 1.609344 km/h", c("speed", "mph", "km/h"), 1.609344);
  near("1 ft/s = 0.3048 m/s", c("speed", "ft/s", "m/s"), 0.3048);

  // Time.
  near("1 h = 60 min", c("time", "h", "min"), 60);
  near("1 h = 3600 s", c("time", "h", "s"), 3600);
  near("1 d = 24 h", c("time", "d", "h"), 24);
  near("1 wk = 7 d", c("time", "wk", "d"), 7);
  near("1 s = 1000 ms", c("time", "s", "ms"), 1000);

  // Pressure. A bar is 100 kPa, an atmosphere 101325 Pa, and a millimetre of mercury is
  // 133.322387415 Pa exactly.
  near("1 bar = 1000 mbar", c("pressure", "bar", "mbar"), 1000);
  near("1 bar = 100 kPa", c("pressure", "bar", "kPa"), 100);
  near("1 atm = 101325 Pa", c("pressure", "atm", "Pa"), 101325);
  near("1 mmHg = 133.322387415 Pa", c("pressure", "mmHg", "Pa"), 133.322387415);
  // 760 mmHg is an atmosphere to within a part in 10⁶ and not exactly: the torr is
  // defined as atm/760, the millimetre of mercury as 133.322387415 Pa, and the two are
  // near-equal rather than equal. Both products carry the mmHg.
  near("760 mmHg is one atmosphere, to a part in 10⁶", c("pressure", "mmHg", "atm", 760), 1, 1e-6);

  // Energy. A kilowatt-hour is 3.6 MJ; the thermochemical calorie is 4.184 J.
  near("1 kWh = 3600 kJ", c("energy", "kWh", "kJ"), 3600);
  near("1 kWh = 1000 Wh", c("energy", "kWh", "Wh"), 1000);
  near("1 kcal = 1000 cal", c("energy", "kcal", "cal"), 1000);
  near("1 cal = 4.184 J", c("energy", "cal", "J"), 4.184);

  // Power. Mechanical horsepower and the metric one are different units and both are here,
  // which is the point: 1 hp is more than 1 KM.
  near("1 kW = 1000 W", c("power", "kW", "W"), 1000);
  near("1 MW = 1000 kW", c("power", "MW", "kW"), 1000);
  near("1 KM = 735.49875 W", c("power", "KM", "W"), 735.49875);
  check("1 hp is more than 1 KM", c("power", "hp", "KM") > 1, String(c("power", "hp", "KM")));

  // Data. The decimal prefixes and the binary ones are different sizes, which is the only
  // reason both are in the list.
  near("1 GB = 1000 MB", c("data", "GB", "MB"), 1000);
  near("1 TB = 1000 GB", c("data", "TB", "GB"), 1000);
  near("1 GiB = 1024 MiB", c("data", "GiB", "MiB"), 1024);
  near("1 MiB = 1024 KiB", c("data", "MiB", "KiB"), 1024);
  near("1 GiB = 1073741824 B", c("data", "GiB", "B"), 1073741824);
  check("a GiB is bigger than a GB", c("data", "GiB", "GB") > 1);

  // The three pairs that are the same size written two ways. The app lists both of each,
  // and a port that quietly dropped one would be deciding which of two correct questions
  // a reader is allowed to ask.
  near("1 l is 1 dm³", c("volume", "l", "dm³"), 1);
  near("1 ml is 1 cm³", c("volume", "ml", "cm³"), 1);
  near("1 hPa is 1 mbar", c("pressure", "hPa", "mbar"), 1);

  // A unit converted into itself is the value, and the walk out and back is the value.
  for (const cat of CONV_CATS) {
    if (cat.id === "temperature") continue; // §3 does the affine ones
    for (const [sym] of cat.units) {
      near(`${cat.id}: ${sym} → ${sym} is the value`, c(cat.id, sym, sym, 7), 7);
    }
    const [a, b] = cat.def;
    near(`${cat.id}: ${a} → ${b} → ${a} comes back`,
      c(cat.id, b, a, c(cat.id, a, b, 12.5)), 12.5);
  }

  // Zero and a negative value are values, not empty answers.
  eq("zero converts to zero", c("length", "m", "cm", 0), 0);
  near("a negative length converts", c("length", "m", "cm", -2), -200);
}

/* ================================================================== 3. temperature */

head("3. temperature, the one category a factor cannot express");
{
  const t = (from, to, v) => convConvert("temperature", from, to, v);

  near("0 °C = 32 °F", t("°C", "°F", 0), 32);
  near("100 °C = 212 °F", t("°C", "°F", 100), 212);
  near("37 °C = 98.6 °F", t("°C", "°F", 37), 98.6);
  near("−40 °C = −40 °F", t("°C", "°F", -40), -40);
  near("0 °C = 273.15 K", t("°C", "K", 0), 273.15);
  near("0 K = −273.15 °C", t("K", "°C", 0), -273.15);
  near("32 °F = 0 °C", t("°F", "°C", 32), 0);
  near("212 °F = 373.15 K", t("°F", "K", 212), 373.15);
  near("°C → °F → °C comes back", t("°F", "°C", t("°C", "°F", 21.5)), 21.5);

  // The defect the special case exists to prevent: every temperature unit carries a
  // factor of 1, so a converter that only multiplied would answer "0 °C is 0 °F".
  check("a factor-only conversion would be wrong, and this one is not",
    t("°C", "°F", 0) !== 0 * convFactor("temperature", "°C") / convFactor("temperature", "°F"));
  eq("a temperature unit converted into itself is the value", t("K", "K", 300), 300);
}

/* ================================================================== 4. what it refuses */

head("4. nothing to convert is null, and never a zero");
{
  eq("an unknown category", convConvert("colour", "m", "cm", 1), null);
  eq("an unknown unit on the left", convConvert("length", "parsec", "m", 1), null);
  eq("an unknown unit on the right", convConvert("length", "m", "parsec", 1), null);
  eq("a unit from another category", convConvert("length", "m", "kg", 1), null);
  eq("a value that is not a number", convConvert("length", "m", "cm", NaN), null);
  eq("an infinite value", convConvert("length", "m", "cm", Infinity), null);
  eq("an unknown category by unit lookup", convFactor("colour", "m"), null);
  eq("an unknown category object", convCat("colour"), undefined);

  // The distinction this section is for: a refusal is null, a real answer of zero is 0,
  // and a caller that confused the two would print "0 cm" for a question it cannot answer.
  check("a refusal and a zero are different values",
    convConvert("length", "m", "parsec", 1) === null && convConvert("length", "m", "cm", 0) === 0);

  // What the field hands the engine.
  eq("an empty field is not a number", Number.isNaN(convNum("")), true);
  eq("a comma is a decimal point", convNum("2,5"), 2.5);
  eq("a point is a decimal point too", convNum("2.5"), 2.5);
  eq("spaces around the number are ignored", convNum("  3 "), 3);
  eq("a word is not a number", Number.isNaN(convNum("dużo")), true);
  eq("a negative number is a number", convNum("-40"), -40);
}

/* ================================================================== 5. the formatting */

head("5. a whole number stays whole, and the language writes it");
{
  const digits = (s) => s.replace(/[^0-9]/g, "");

  // The reason the whole-number case is first: six significant digits would turn a GiB
  // into 1 073 740 000 bytes, which is a wrong answer rather than a rounded one.
  eq("a GiB in bytes keeps every digit",
    digits(convFormat(convConvert("data", "GiB", "B", 1), "pl")), "1073741824");
  eq("a hundred centimetres is 100", convFormat(100, "en"), "100");
  eq("zero is zero", convFormat(0, "en"), "0");

  // Six significant digits for anything that is not whole — the app's own rule.
  eq("a third, to six significant digits", convFormat(1 / 3, "en"), "0.333333");
  eq("the same third in Polish", convFormat(1 / 3, "pl"), "0,333333");
  check("a long fraction is cut to six significant digits",
    digits(convFormat(1 / 7, "en")).replace(/^0+/, "").length <= 6, convFormat(1 / 7, "en"));

  // The language decides the separators and nothing else: the digits are the same.
  const third = LANGS.map((l) => digits(convFormat(1 / 3, l)));
  eq("every language writes the same digits", new Set(third).size, 1);
  check("Polish and English do not write them the same way",
    convFormat(1234.5, "pl") !== convFormat(1234.5, "en"),
    `${convFormat(1234.5, "pl")} / ${convFormat(1234.5, "en")}`);

  eq("nothing to show is a dash, not a NaN", convFormat(NaN, "pl"), "—");
  eq("infinity is a dash too", convFormat(Infinity, "pl"), "—");
  eq("null is a dash", convFormat(null, "pl"), "—");
}

/* ================================================================== 6. the route */

head("6. the route, and the ten slugs");
{
  eq("the architecture is consistent", validateIA().join("\n"), "");

  const r = route("converter");
  if (check("the route is declared in src/ia.mjs", Boolean(r))) {
    eq("it is live", r.status, STATUS.LIVE);
    eq("it needs no account", r.level, LEVEL.GUEST);
    eq("it is indexable", r.indexable, true);
    eq("it has one URL per language", r.localized, true);
    eq("it hangs under the calculators", r.parent, "calculators");
    check("it is a page of its own, not a view", !r.view);
    check("it has no Pro gate to describe", !r.gate);
    check("it is in the footer", Boolean(r.footer));
    check("it is not in the header — that row is full at five", !r.header);
    check("nothing hides its link", !r.navLevel);
  }

  check("the footer offers it beside the calculators",
    navRoutes("footer", "product").map((x) => x.id).slice(0, 2).join() === "calculators,converter",
    navRoutes("footer", "product").map((x) => x.id).join());

  const taken = new Map();
  for (const [name, seg] of Object.entries(SECTION)) {
    for (const lang of LANGS) {
      const key = `${lang}:${seg[lang]}`;
      check(`no two sections claim ${key}`, !taken.has(key), `also ${taken.get(key)}`);
      taken.set(key, name);
    }
  }
  for (const lang of LANGS) {
    const slug = SECTION.converter[lang];
    check(`${lang}: the slug is ASCII, lower case, hyphen separated`,
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug), slug);
  }
  eq("ten distinct addresses", new Set(LANGS.map(urlConverter)).size, LANGS.length);
  eq("Polish sits at the root", urlConverter("pl"), "/konwerter-jednostek/");
  eq("every other language sits under its prefix",
    LANGS.filter((l) => l !== "pl").every((l) => urlConverter(l).startsWith(`/${l}/`)), true);
}

/* ================================================================== 7. the pages */

head("7. the ten pages the build wrote");
{
  const files = Object.fromEntries(LANGS.map((lang) => {
    const file = `${urlConverter(lang).replace(/^\//, "")}index.html`;
    return [lang, existsSync(p(file)) ? read(file) : null];
  }));

  for (const lang of LANGS) {
    const html = files[lang];
    if (!check(`${lang}: the page shipped`, Boolean(html), urlConverter(lang))) continue;
    const dict = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}), ...CONV_COPY[lang] };

    check(`${lang}: its canonical is its own address`,
      html.includes(`rel="canonical" href="https://liczmat.com${urlConverter(lang)}"`));
    check(`${lang}: the H1 is the module's name`,
      html.includes(`<h1>${dict.convpage_title}</h1>`), dict.convpage_title);
    check(`${lang}: one H1`, (html.match(/<h1[ >]/g) || []).length === 1);
    check(`${lang}: a crawler is invited in`,
      html.includes('name="robots" content="index, follow'));

    // The six controls, each with a label of its own — a placeholder is not a name.
    for (const [id, key] of [["conv-cat", "conv_cat"], ["conv-value", "conv_value"],
      ["conv-from", "conv_from"], ["conv-to", "conv_to"]]) {
      check(`${lang}: ${id} carries its label`,
        html.includes(`<label for="${id}">${dict[key]}</label>`), dict[key]);
    }
    check(`${lang}: the swap button says what it does`, html.includes(dict.conv_swap));
    check(`${lang}: the result box is a live region`,
      html.includes('data-conv-result role="status"'));
    check(`${lang}: it loads the engine`, html.includes('src="/assets/converter.js'));

    // The answer for the values the form opens with, computed by the same functions the
    // page then loads. Without it the page is an empty form to anybody running no script.
    const [from, to] = CONV_CATS[0].def;
    const out = convFormat(convConvert(CONV_CATS[0].id, from, to, 1), lang);
    check(`${lang}: the worked answer is in the markup`,
      html.includes(`${out} <span class="figure-line">${to}</span>`), `${out} ${to}`);
    check(`${lang}: and the value it was computed from`,
      html.includes(`${convFormat(1, lang)} ${from}`));

    // Every category is offered, and every unit of every category is on the page — that
    // list is what a crawler and a reader with no JavaScript actually get.
    for (const cat of CONV_CATS) {
      check(`${lang}: ${cat.id} is in the category picker`,
        html.includes(`<option value="${cat.id}"`) && html.includes(dict[`conv_c_${cat.id}`]),
        dict[`conv_c_${cat.id}`]);
      const listed = cat.units.map(([s]) => s).join(", ");
      check(`${lang}: ${cat.id}'s units are written out`, html.includes(listed), listed);
    }

    // The hole this section is really here for. t() answers with the key when a key is
    // missing, and the build does not fail on it: the first draft of this page shipped
    // "conv_form_h" and "conv_result" as visible headings in all ten languages, exactly
    // the way six languages shipped the word "undefined" before session 41.
    const leaked = html.match(/>[^<>]*\b(conv|convpage)_[a-z_]+\b[^<>]*</g) || [];
    check(`${lang}: no dictionary key leaked into the page`, leaked.length === 0,
      leaked.slice(0, 3).join(" | "));
    check(`${lang}: the word "undefined" is nowhere a visitor can read it`,
      !/>[^<>]*\bundefined\b[^<>]*</.test(html));
  }

  // A page nobody links to is a page nobody reads. The footer is generated from the route,
  // so what has to be checked by hand is the hub: it is the page somebody looking for a
  // tool actually opens.
  for (const lang of LANGS) {
    const hub = `${urlCalcIndex(lang).replace(/^\//, "")}index.html`;
    if (!check(`${lang}: the calculator hub shipped`, existsSync(p(hub)))) continue;
    const html = read(hub);
    check(`${lang}: the hub links to the converter`,
      html.includes(`href="${urlConverter(lang)}"`), urlConverter(lang));
    // …and does it outside #calc-hub, whose filter counts [data-calc-row] and reports how
    // many of the fifteen calculators are showing. A sixteenth row would make that wrong.
    const filtered = html.slice(html.indexOf('id="calc-hub"'), html.indexOf('id="hub-conv-h"'));
    check(`${lang}: and not inside the filtered list`,
      filtered.length > 0 && !filtered.includes(`href="${urlConverter(lang)}"`));
  }

  // The net, widened to the whole site — because the first version of this file only
  // looked at the ten converter pages and the leak was somewhere else entirely: the footer
  // link's label comes from the route's `footer.key`, so moving `convpage_title` out of
  // the dictionary printed that key on all 383 footers, in every language, with every
  // suite still green. Session 41 is the same defect with a different key.
  {
    const leaks = [];
    for (const file of walkHtml(ROOT)) {
      const html = readFileSync(file, "utf8");
      for (const m of html.match(/>[^<>]*\b(conv|convpage)_[a-z_]+\b[^<>]*</g) || []) {
        leaks.push(`${file.slice(ROOT.length + 1)}: ${m.slice(0, 40)}`);
      }
    }
    check("no conv_ key is printed on any page of the site", leaks.length === 0,
      `${leaks.length} page(s), e.g. ${leaks.slice(0, 3).join(" | ")}`);
  }

  // sitemap.xml is read off src/ia.mjs, so this is a check that the route really made it
  // out of the generator rather than a second list.
  const sitemap = read("sitemap.xml");
  for (const lang of LANGS) {
    check(`${lang}: the address is in sitemap.xml`,
      sitemap.includes(`<loc>https://liczmat.com${urlConverter(lang)}</loc>`));
  }
}

/* ================================================================== 8. the copy */

head("8. the copy in ten languages, and the module's one name");
{
  const KEYS = ["convpage_lead", "convpage_meta", "conv_hub_d", "conv_open",
    "conv_cat", "conv_value", "conv_from", "conv_to", "conv_swap",
    "conv_units_t", "conv_how_d", "conv_temp_d",
    ...CONV_CATS.map((c) => `conv_c_${c.id}`)];

  eq("src/conv-copy.mjs declares exactly those keys",
    [...CONV_COPY_KEYS].sort().join(), [...KEYS].sort().join());

  for (const lang of LANGS) {
    const copy = CONV_COPY[lang] || {};
    for (const key of KEYS) {
      check(`${lang}: ${key}`, typeof copy[key] === "string" && copy[key].trim().length > 0);
    }
    // Two categories under one name is a picker with two identical rows in it.
    const names = CONV_CATS.map((c) => copy[`conv_c_${c.id}`]);
    eq(`${lang}: no two categories share a name`, new Set(names).size, names.length);

    // Two keys stay in the dictionary and both have a reason. `conv_bad` is written by
    // assets/converter.js in the browser, which cannot read src/ — it is stripped from the
    // Pages artifact. `convpage_title` is the footer link's label on all 383 pages, and
    // src/template.mjs takes that from the route's `footer.key`, which is a dictionary key.
    check(`${lang}: conv_bad is in the dictionary`,
      typeof (I18N_PAGES[lang] || {}).conv_bad === "string");
    check(`${lang}: and so is the footer's label`,
      typeof (I18N_PAGES[lang] || {}).convpage_title === "string");
  }

  // …and nothing else of this page's is, because every page on the site downloads that
  // bundle. Session 57 put the copy in the dictionary first and /app/ went past its raw
  // budget in scripts/test-perf.mjs by a kilobyte, which is what the budget is for.
  const inBundle = [];
  for (const lang of LANGS) {
    for (const key of Object.keys(I18N_PAGES[lang] || {})) {
      if (/^(conv_|convpage_)/.test(key) && !["conv_bad", "convpage_title"].includes(key)) {
        inBundle.push(`${lang}:${key}`);
      }
    }
  }
  eq("no build-time copy rides in the dictionary every page downloads", inBundle.join(", "), "");

  // The module has one name on the two products — session 53's rule, applied the other way
  // round: there it was the app copying the site's `cal_*` strings, here it is the site
  // taking the app's `converter_title`. The address follows the name, so the check is that
  // the slug is the title with the accents and the spaces taken out.
  const ascii = (s) => s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const lang of ["pl", "de", "en", "cs", "sk", "ro", "hr", "sr"]) {
    eq(`${lang}: the slug is the module's name`,
      SECTION.converter[lang], ascii(I18N_PAGES[lang].convpage_title));
  }

  // Unit symbols are not translated and must never be: eleven category names is what the
  // port buys instead of ninety units in ten languages.
  const symbols = new Set(CONV_CATS.flatMap((c) => c.units.map(([s]) => s)));
  const inDict = [];
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(CONV_COPY[lang] || {})) {
      if (key.startsWith("conv_c_") && symbols.has(value)) inDict.push(`${lang}:${key}`);
    }
  }
  eq("no unit symbol is a dictionary entry", inDict.join(", "), "");
}

/* ------------------------------------------------------------------ the report */

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n${passed} passed, ${failures.length} failed.\n`);
  process.exit(1);
}
console.log(`OK — ${passed} checks: ${CONV_CATS.length} categories, ` +
  `${CONV_CATS.reduce((n, c) => n + c.units.length, 0)} units, ` +
  `${LANGS.length} languages, ${LANGS.length} pages.`);
