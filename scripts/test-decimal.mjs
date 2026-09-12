#!/usr/bin/env node
/**
 * LiczMat — every number a person types, read the same way.
 *
 *     node scripts/test-decimal.mjs
 *
 * Session K. The second round of the audit (session H) found `pdfNum()` in
 * assets/pdf-export.js reading the hourly rate "1 000" as 1, because the whole of its
 * parsing was `parseFloat(v.replace(",", "."))`: `String.replace` with a string pattern
 * swaps the FIRST comma only, and `parseFloat` stops at the first character it cannot use,
 * so a grouped thousand came out as a one. It was fixed there and nowhere else.
 *
 * It was never only there. The fields are `type="text" inputmode="decimal"` (src/pages.mjs)
 * on every screen of this site, so what arrives is whatever somebody's own keyboard
 * produced, and in most of the thirteen languages that is a space or a point for thousands
 * and a comma for the decimal. Nine more readers had the same one-comma parse:
 *
 *   - `num()`        assets/calculators.js — every dimension and every price in every engine
 *   - `num()`        assets/app.js         — rooms, shopping lists and quote lines on /app/
 *   - `convNum()`    assets/converter.js   — the unit converter's own input
 *   - `wsDecimal()`  assets/workspace-calc.js — the cost a person books against a project
 *   - `crmMinor()`, `crmQty()`, `crmPct()`   assets/crm.js — quote money, counts and margin
 *   - `omMeasure()`, `omMinor()`             assets/own-materials.js — a private catalogue
 *
 * The `parseFloat` half read "1 000" as 1 and said nothing. The `Number` half (crm and
 * own-materials) answered NaN, which those functions turn into null — the value is dropped
 * and the field refuses without saying why — and still read "1.000" as 1.
 *
 * The rule, one for all of them and the one `pdfNum()` already follows: drop every space
 * of every width, then let the LAST separator in the string be the decimal point and every
 * earlier one be grouping. What each reader does with the number afterwards is its own —
 * NaN, 0 or null for a blank, `Number`'s strictness where a store wants it — and section 2
 * pins every one of those down so the shared rule cannot quietly flatten them.
 *
 * Dependency-free, plain `node`, exit 1 on failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");

function evalScript(file, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${read(file)}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

/* The little that these files touch at load time. None of them needs a real DOM to answer
   what a typed string is worth. */
const STUBS = {
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { dispatchEvent() {}, addEventListener() {}, documentElement: { lang: "pl" } },
  window: { addEventListener() {} },
  crypto: { randomUUID: () => "id-1" },
  CustomEvent: class { constructor(type) { this.type = type; } },
  setTimeout: () => 0,
};

const { num: calcNum } = evalScript(["assets/units.js", "assets/calculators.js"], ["num"]);
const { convNum } = evalScript("assets/converter.js", ["convNum"]);
const { wsDecimal, wsFieldValue } = evalScript(
  ["assets/workspace.js", "assets/workspace-calc.js", "assets/workspace-ui.js"],
  ["wsDecimal", "wsFieldValue"], { ...STUBS, Intl, t: (k) => k });
const { crmMinor, crmQty, crmPct } = evalScript(
  ["assets/workspace.js", "assets/crm-store.js", "assets/crm.js"],
  ["crmMinor", "crmQty", "crmPct"], STUBS);
const { omMeasure, omMinor } = evalScript("assets/own-materials.js",
  ["omMeasure", "omMinor"], { ...STUBS, lmCurrency: () => "PLN" });
/* The reader session H already fixed, in the table with the rest: it is the reference, and
   a rule that has drifted away from it is a rule two documents disagree about. */
const { pdfNum } = evalScript("assets/pdf-export.js", ["pdfNum"], {
  ...STUBS,
  document: { ...STUBS.document, readyState: "complete", getElementById: () => null,
    querySelector: () => null, querySelectorAll: () => [] },
  window: { addEventListener() {}, removeEventListener() {}, print() {} },
  location: { search: "" },
  URLSearchParams: class { get() { return null; } },
  Intl,
});

/**
 * assets/app.js is an ES module and names ./firebase-config.js in an `import`, so it cannot
 * be handed to `new Function` whole. Its reader and the helper above it are lifted out by
 * name instead — and the lift is itself a check: either declaration renamed, moved apart or
 * deleted fails here loudly rather than dropping silently out of the table below.
 */
function appNumFromSource() {
  const src = read("assets/app.js");
  const from = src.indexOf("\nconst typedDigits = ");
  const at = src.indexOf("\nconst num = ", from);
  if (from === -1 || at === -1) {
    throw new Error("assets/app.js no longer declares `const typedDigits =` then `const num =`");
  }
  const block = src.slice(from + 1, src.indexOf("\n", at + 1));
  return new Function(`${block}\nreturn num;`)();
}
const appNum = appNumFromSource();

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
/* Object.is, not ===, because NaN is one of the answers under test and NaN === NaN is false:
   with === a reader that stopped answering NaN would pass unnoticed. */
const eq = (name, got, want) =>
  check(name, Object.is(got, want), `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

/* ================================================================== 1. the shared rule */

/**
 * Every reader of a typed number, and what a plain value looks like coming out of it.
 *
 * `want` is how each one dresses the same number: minor units where money is stored in
 * minor units, a capped and twice-rounded percentage where the margin is capped. The rule
 * being tested is the parse, so the dressing is computed rather than written out.
 */
const READERS = [
  { label: "pdfNum (assets/pdf-export.js)", read: (v) => pdfNum(v), want: (x) => x },
  { label: "num (assets/calculators.js)", read: (v) => calcNum(v), want: (x) => x },
  { label: "num (assets/app.js)", read: (v) => appNum(v), want: (x) => x },
  { label: "convNum (assets/converter.js)", read: (v) => convNum(v), want: (x) => x },
  { label: "wsDecimal (assets/workspace-calc.js)", read: (v) => wsDecimal(v), want: (x) => x },
  { label: "crmQty (assets/crm.js)", read: (v) => crmQty(v), want: (x) => x },
  { label: "crmMinor (assets/crm.js)", read: (v) => crmMinor(v), want: (x) => Math.round(x * 100) },
  { label: "crmPct (assets/crm.js)", read: (v) => crmPct(v),
    want: (x) => Math.round(Math.min(x, 1000) * 100) / 100 },
  // A key OM_MEASURES does not know carries no ceiling, so the parse is what is measured.
  { label: "omMeasure (assets/own-materials.js)", read: (v) => omMeasure(v, "uncapped"), want: (x) => x },
  { label: "omMinor (assets/own-materials.js)", read: (v) => omMinor(v), want: (x) => Math.round(x * 100) },
];

const NBSP = String.fromCharCode(0x00a0);
const NNBSP = String.fromCharCode(0x202f);

/** One typed string and the number it means. */
const TYPED = [
  ["1,5", 1.5, "a comma is a decimal point"],
  ["1.5", 1.5, "and a point still is"],
  ["  3 ", 3, "spaces around the number are ignored"],
  ["1 000", 1000, "a grouped thousand is a thousand"],
  [`1${NBSP}000`, 1000, "even when the space is the one a spreadsheet pastes"],
  [`1${NNBSP}000,50`, 1000.5, "even when it is a narrow one"],
  ["1.000,50", 1000.5, "a point groups where a comma decides"],
  ["1,000.50", 1000.5, "and a comma groups where a point decides"],
  ["1 234 567,89", 1234567.89, "two groups still read as one number"],
  ["80,", 80, "a separator with nothing after it is the whole part"],
];

head("1. every reader of a typed number follows the same rule");
for (const r of READERS) {
  for (const [typed, value, why] of TYPED) {
    eq(`${r.label}: ${why} — ${JSON.stringify(typed)}`, r.read(typed), r.want(value));
  }
}

/* ================================================================== 2. and keeps its own */

head("2. a blank, a word and a negative are answered as each reader always answered them");
{
  // A calculator field: nothing typed is not a number, and every engine refuses NaN.
  eq("calculators: a blank is not a number", calcNum(""), NaN);
  eq("calculators: a word is not a number", calcNum("dużo"), NaN);
  // parseFloat's leniency is the site's: "12kg" out of a paste is twelve.
  eq("calculators: digits with a unit after them are the digits", calcNum("12kg"), 12);

  eq("app: a blank is zero", appNum(""), 0);
  eq("app: a word is zero", appNum("dużo"), 0);

  eq("converter: an empty field is not a number", convNum(""), NaN);
  eq("converter: a word is not a number", convNum("dużo"), NaN);

  eq("workspace: a blank cost is zero", wsDecimal(""), 0);
  eq("workspace: a word is zero", wsDecimal("dużo"), 0);

  /* The three stores are stricter on purpose: `Number()` refuses a string with anything
     left in it, so a typo is a refusal rather than half a number written into a quote. */
  eq("crm: a blank quantity is a lump sum, not a zero", crmQty(""), null);
  eq("crm: a word is no quantity", crmQty("dużo"), null);
  eq("crm: and neither is half a number", crmQty("12abc"), null);
  eq("crm: a negative quantity is refused", crmQty("-5"), null);
  eq("crm: a blank price is no price", crmMinor(""), null);
  eq("crm: a negative price is refused", crmMinor("-5"), null);
  eq("crm: a blank margin is no margin", crmPct(""), 0);
  eq("crm: a negative margin is no margin", crmPct("-5"), 0);
  eq("crm: and the margin is still capped", crmPct("5000"), 1000);

  eq("own materials: a blank measurement is null, never 0", omMeasure("", "widthMm"), null);
  eq("own materials: a word is null", omMeasure("dużo", "widthMm"), null);
  eq("own materials: half a number is null", omMeasure("12abc", "widthMm"), null);
  eq("own materials: a negative measurement is refused", omMeasure("-5", "widthMm"), null);
  eq("own materials: a number stays a number", omMeasure(2.5, "widthMm"), 2.5);
  eq("own materials: and the ceiling still holds", omMeasure("1 000 000", "widthMm"), 100000);
  eq("own materials: a blank price is no price", omMinor(""), null);
  eq("own materials: a negative price is refused", omMinor("-5"), null);
}

/* ================================================================== 3. the cutting list */

head("3. the cutting list keeps its own grammar, where a space separates two numbers");
{
  const { parseCuts, parsePieces } = evalScript(["assets/units.js", "assets/calculators.js"],
    ["parseCuts", "parsePieces"]);

  /* This one field is not a number: `parseCuts` splits a line on `[x×*, ]+` and only then
     reads each piece, so a space and a comma are separators here and never grouping. The
     shared rule must not reach past the split — "1200 4" is four boards of 1200 mm. */
  eq("a space is a separator, not a group", JSON.stringify(parseCuts("1200 4")),
    JSON.stringify([{ len: 1200, q: 4 }]));
  eq("so is a comma", JSON.stringify(parseCuts("1200,4")),
    JSON.stringify([{ len: 1200, q: 4 }]));
  eq("one piece with a count reads as one row", JSON.stringify(parseCuts("2400x3")),
    JSON.stringify([{ len: 2400, q: 3 }]));
  eq("three numbers make a rectangle and a count", JSON.stringify(parsePieces("600x400x3")),
    JSON.stringify([{ w: 600, l: 400, q: 3 }]));
}

/* ================================================================== 4. what the page shows */

head("4. /kosztorys/ writes back the number the engine read, not the keystrokes");
{
  /* wsFieldValue() decides whether a saved input is a number worth re-formatting in this
     page's language or free text to be shown as typed. It read "1 000" with the same broken
     parse, so the round-trip failed and the field was shown raw while the engine used 1000. */
  const field = { k: "lengthM" };
  const shown = (typed) => wsFieldValue(field, { input: { lengthM: typed } });
  const local = (n) => new Intl.NumberFormat("pl", { maximumFractionDigits: 2 }).format(n);

  eq("a grouped thousand is shown as a number", shown("1 000"), local(1000));
  eq("a decimal comma is shown as a number", shown("2,5"), local(2.5));
  eq("free text is shown as it was typed", shown("na oko"), "na oko");
  eq("a blank stays blank", shown("  "), "");
}

/* ================================================================== 5. no reader left behind */

head("5. no reader is left on the one-comma parse");
{
  /* The defect is a shape, not a place: `replace(",", ".")` swaps the first comma and
     leaves every space and every second separator where they were. Any new occurrence in a
     script the browser runs is the same bug arriving again, so it is named here rather than
     found by the next audit. `.min.js` is generated from these files and is not searched. */
  const FILES = [
    "assets/calculators.js", "assets/app.js", "assets/converter.js",
    "assets/workspace-calc.js", "assets/workspace-ui.js",
    "assets/crm.js", "assets/own-materials.js", "assets/pdf-export.js",
  ];
  /* Comment lines are skipped: pdf-export.js quotes the broken call in the note explaining
     why it no longer makes it, and a note about a defect is not the defect. */
  const isComment = (line) => /^\s*(\/\/|\/?\*)/.test(line);
  for (const f of FILES) {
    const lines = read(f).split("\n");
    const at = lines.findIndex((l) => !isComment(l) && l.includes('replace(",", ".")'));
    check(`${f} does not swap only the first comma`, at === -1,
      at === -1 ? "" : `line ${at + 1}: ${lines[at].trim()}`);
  }
}

/* ------------------------------------------------------------------ report */

console.log(`\ntyped numbers: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
