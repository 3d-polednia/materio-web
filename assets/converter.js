/* LiczMat website — the unit converter, ported 1:1 from the Kotlin app
   (core/calculation/UnitConverter.kt in 3d-polednia/Materio).

   Session 57, item C1 of the parity audit: the converter was the largest thing the app
   had and the site did not. Everything below the "the site's own half" line is the port
   — the eleven categories, their units and their factors, in the same order and to the
   same digits, because two products that answer "how many inches is a metre" differently
   are two products. The rest of the file is what a page needs and a screen does not.

   Every category has a base unit and every unit its factor to that base, so
   `value_in_base = value * toBase` and a conversion inside a category is
   `value * from.toBase / to.toBase`. Temperature is the one exception: °C → °F is a
   shift as well as a scale, so it cannot be a factor and is handled on its own.

   Unit symbols are language-neutral (mm, ha, km/h, °C), exactly as in the app, so the
   picker needs no per-unit translation and only the eleven category names are in the
   dictionary. That is a decision the port inherits, not one this session took. */

/**
 * The eleven categories, their units and the factor of each unit to the category's base.
 *
 * `def` is the pair the page opens on, and it is the ONE thing here that is not the
 * app's: the app opens every category on its first two units (mm → cm), which is what a
 * list gives you rather than what anybody came to convert. Which pair a *page* opens on
 * is a website decision, so it lives here beside the units rather than in the markup —
 * the same split as CALC_CATEGORIES in src/ia.mjs, which groups the calculators for the
 * hub without touching the engines.
 *
 * `l` and `dm³` carry the same factor, and so do `ml` and `cm³`, `hPa` and `mbar`. They
 * are the same size written two ways and the app lists both; dropping one here would be
 * the port deciding which of two correct answers a reader is allowed to ask for.
 */
const CONV_CATS = [
  {
    id: "length", base: "m", def: ["m", "cm"],
    units: [
      ["mm", 0.001], ["cm", 0.01], ["dm", 0.1],
      ["m", 1], ["km", 1000],
      ["in", 0.0254], ["ft", 0.3048], ["yd", 0.9144],
      ["mi", 1609.344], ["nmi", 1852],
    ],
  },
  {
    id: "area", base: "m²", def: ["m²", "ft²"],
    units: [
      ["mm²", 1e-6], ["cm²", 1e-4], ["dm²", 1e-2],
      ["m²", 1], ["a", 100], ["ha", 10000], ["km²", 1e6],
      ["in²", 0.00064516], ["ft²", 0.09290304], ["yd²", 0.83612736],
      ["ac", 4046.8564224], ["mi²", 2589988.110336],
    ],
  },
  {
    id: "volume", base: "l", def: ["l", "m³"],
    units: [
      ["ml", 0.001], ["cl", 0.01], ["l", 1],
      ["m³", 1000], ["cm³", 0.001], ["dm³", 1],
      ["gal", 3.785411784], ["qt", 0.946352946], ["pt", 0.473176473],
      ["fl oz", 0.0295735296], ["ft³", 28.316846592],
    ],
  },
  {
    id: "mass", base: "kg", def: ["kg", "t"],
    units: [
      ["mg", 1e-6], ["g", 1e-3], ["dag", 1e-2],
      ["kg", 1], ["t", 1000],
      ["oz", 0.028349523125], ["lb", 0.45359237], ["st", 6.35029318],
    ],
  },
  {
    /* The three carry a factor of 1 and none of them uses it: a temperature scale has an
       offset as well, so convTo() below is what actually converts them. The factor stays
       in the table because the app's table has it and the shape is the port. */
    id: "temperature", base: "°C", def: ["°C", "°F"],
    units: [["°C", 1], ["°F", 1], ["K", 1]],
  },
  {
    id: "speed", base: "m/s", def: ["km/h", "mph"],
    units: [
      ["m/s", 1], ["km/h", 1 / 3.6], ["mph", 0.44704],
      ["kn", 0.514444], ["ft/s", 0.3048],
    ],
  },
  {
    id: "time", base: "s", def: ["h", "min"],
    units: [
      ["ms", 0.001], ["s", 1], ["min", 60],
      ["h", 3600], ["d", 86400], ["wk", 604800],
    ],
  },
  {
    id: "pressure", base: "Pa", def: ["bar", "psi"],
    units: [
      ["Pa", 1], ["hPa", 100], ["kPa", 1000],
      ["bar", 100000], ["mbar", 100], ["atm", 101325],
      ["psi", 6894.757293], ["mmHg", 133.322387415],
    ],
  },
  {
    id: "energy", base: "J", def: ["kWh", "kJ"],
    units: [
      ["J", 1], ["kJ", 1000], ["cal", 4.184],
      ["kcal", 4184], ["Wh", 3600], ["kWh", 3600000],
    ],
  },
  {
    id: "power", base: "W", def: ["kW", "KM"],
    units: [
      ["W", 1], ["kW", 1000], ["MW", 1000000],
      ["hp", 745.699872], ["KM", 735.49875],
    ],
  },
  {
    id: "data", base: "B", def: ["GB", "GiB"],
    units: [
      ["B", 1], ["kB", 1000], ["MB", 1e6],
      ["GB", 1e9], ["TB", 1e12],
      ["KiB", 1024], ["MiB", 1048576], ["GiB", 1073741824],
    ],
  },
];

/** One category by id, or undefined. */
function convCat(id) {
  for (let i = 0; i < CONV_CATS.length; i++) if (CONV_CATS[i].id === id) return CONV_CATS[i];
  return undefined;
}

/** The factor of one unit inside one category, or null when nobody declared it. */
function convFactor(catId, symbol) {
  const cat = convCat(catId);
  if (!cat) return null;
  for (let i = 0; i < cat.units.length; i++) if (cat.units[i][0] === symbol) return cat.units[i][1];
  return null;
}

/* Temperature, the one category a factor cannot express. Both directions go through
   Celsius, exactly as toCelsius()/fromCelsius() do in the Kotlin. */
function convToCelsius(symbol, v) {
  if (symbol === "°F") return (v - 32) * 5 / 9;
  if (symbol === "K") return v - 273.15;
  return v;
}
function convFromCelsius(symbol, c) {
  if (symbol === "°F") return c * 9 / 5 + 32;
  if (symbol === "K") return c + 273.15;
  return c;
}

/**
 * `value` in `from`, expressed in `to`, inside `category`.
 *
 * Answers null — never a number — when the category or either unit is unknown, so a
 * caller cannot mistake "nothing to convert" for a result of zero.
 */
function convConvert(catId, from, to, value) {
  const a = convFactor(catId, from), b = convFactor(catId, to);
  if (a === null || b === null || !isFinite(value)) return null;
  if (catId === "temperature") return convFromCelsius(to, convToCelsius(from, value));
  return value * a / b;
}

/* ------------------------------------------------------------------ the site's own half */

/** What somebody typed, as a number. A comma is a decimal point here, as everywhere. */
function convNum(v) {
  const s = String(v === undefined || v === null ? "" : v).trim();
  if (s === "") return NaN;
  const n = parseFloat(s.replace(",", "."));
  return isFinite(n) ? n : NaN;
}

/**
 * A converted value, written the way the page's language writes numbers.
 *
 * The app's own format() keeps an integer whole and otherwise rounds to six significant
 * digits; this does the same, and hands the digit grouping and the decimal mark to Intl
 * so a Polish page says 1 073 741 824 and an English one 1,073,741,824. Rounding an
 * integer to six digits would turn one GiB into 1 073 740 000 bytes, which is why the
 * whole-number case is first — and why it is capped: past 2^53 an integer is no longer
 * exactly what it says it is.
 */
function convFormat(v, lang) {
  if (typeof v !== "number" || !isFinite(v)) return "—";
  const loc = typeof lmLocale === "function" ? lmLocale(lang) : "pl-PL";
  if (v === Math.round(v) && Math.abs(v) < 1e15) {
    return new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(v);
  }
  return new Intl.NumberFormat(loc, { maximumSignificantDigits: 6 }).format(v);
}

/* ------------------------------------------------------------------ the page */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const root = document.querySelector("[data-converter]");
    if (root) convWire(root);
  });
}

function convEsc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Put new markup into the result box — unless it already says the same thing.
 *
 * The box is `role="status"`, which is what tells a screen reader the answer when the
 * visitor types. The price of that is this function: the build writes the answer for the
 * values the form opens with, and the run on load recomputes it, so writing identical
 * content into a live region would read the answer out to somebody who never asked for
 * one. Same mechanism, and the same reason, as writeResult() in assets/calculators.js —
 * copied rather than shared because that file is 40 kB of engines this page never loads.
 */
function convWrite(box, html) {
  const words = (s) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (words(html) !== words(box.innerHTML)) box.innerHTML = html;
}

function convWire(root) {
  const catSel = root.querySelector("[data-conv-cat]");
  const valueEl = root.querySelector("[data-conv-value]");
  const fromSel = root.querySelector("[data-conv-from]");
  const toSel = root.querySelector("[data-conv-to]");
  const swapBtn = root.querySelector("[data-conv-swap]");
  const box = root.querySelector("[data-conv-result]");
  if (!catSel || !valueEl || !fromSel || !toSel || !box) return;
  const lang = document.documentElement.lang || "pl";

  const fill = (sel, cat, chosen) => {
    sel.innerHTML = cat.units
      .map(([s]) => `<option value="${convEsc(s)}"${s === chosen ? " selected" : ""}>${convEsc(s)}</option>`)
      .join("");
    sel.value = chosen;
  };

  const run = () => {
    const cat = convCat(catSel.value) || CONV_CATS[0];
    const v = convNum(valueEl.value);
    const out = convConvert(cat.id, fromSel.value, toSel.value, v);
    if (out === null) {
      box.classList.add("err");
      convWrite(box, `<div>${convEsc(t("conv_bad", lang))}</div>`);
      return;
    }
    box.classList.remove("err");
    convWrite(box, `<div class="muted eyebrow">${convEsc(convFormat(v, lang))} ${convEsc(fromSel.value)}</div>
      <div class="big">${convEsc(convFormat(out, lang))} <span class="figure-line">${convEsc(toSel.value)}</span></div>`);
  };

  catSel.addEventListener("change", () => {
    const cat = convCat(catSel.value) || CONV_CATS[0];
    fill(fromSel, cat, cat.def[0]);
    fill(toSel, cat, cat.def[1]);
    run();
  });
  [valueEl, fromSel, toSel].forEach((el) => {
    el.addEventListener("input", run);
    el.addEventListener("change", run);
  });
  if (swapBtn) swapBtn.addEventListener("click", () => {
    const a = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = a;
    run();
  });
  // The form arrives from the build already holding its answer; this turns that markup
  // into a live one, and writes nothing when the two say the same thing.
  run();
}
