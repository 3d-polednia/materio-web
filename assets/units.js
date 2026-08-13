/* LiczMat website — how a number and the word next to it are written out.
 *
 * Three functions, shared by everything that prints a counted thing:
 *
 *   assets/calculators.js   the result panel on a calculator page
 *   assets/workspace-ui.js  /projekty/ and /kosztorys/
 *   assets/dashboard.js     /app/dashboard/
 *   scripts/build.mjs       the worked example the build writes into every calculator page
 *
 * They lived in assets/calculators.js until session 16, which is the file holding the
 * engines — 25 kB of arithmetic that /projekty/ has no reason to download. So the three
 * pages that only show a saved result printed "1 pozycji" and "1 worków" while the
 * calculator two clicks away printed "1 pozycja" and "1 worek": the mechanism existed and
 * was out of reach. Nothing here calculates anything; it is presentation only.
 */

/* -------- the unit standing next to the number --------
   The result panel used to read "4 worków". Polish and Ukrainian inflect a counted noun
   in three forms — 1 / 2–4 / 5 and up, with the teens taking the last one — German and
   English in two, and a symbol or an abbreviation (kg, m², opak., szt.) in none at all.

   Only the keys listed here carry the extra forms; every other unit renders from its
   single key exactly as before. An abbreviation must not be inflected, which is why
   res_pkgs ("opak.") and res_pieces ("szt.") are absent and always will be — the rest are
   every result unit the site spells out as a word, plus ws_lines, which is the same
   sentence one screen further on: a project row saying "1 pozycji". */
const PLURAL_UNITS = new Set([
  "res_bags", "res_rolls", "res_boards", "res_stocks", "res_sheets", "ws_lines",
]);
const SLAVIC_PLURAL = new Set(["pl", "uk"]);

/**
 * "one" | "few" | "many" for `n` in `lang`. The base key holds the "many" form, so a
 * language or a unit with nothing extra declared keeps working unchanged.
 *
 * A fraction falls back to "many": every unit with forms is counted in whole packages,
 * so the case cannot arise today, and guessing at "3,5 worka" would need a fourth form.
 */
function pluralForm(n, lang) {
  if (!Number.isInteger(n)) return "many";
  if (n === 1) return "one";
  if (!SLAVIC_PLURAL.has(lang)) return "many";
  const last = n % 10, teens = n % 100;
  return last >= 2 && last <= 4 && !(teens >= 12 && teens <= 14) ? "few" : "many";
}

/** The unit label for `n` of them. `tr` is the page's translator, bound to `lang`. */
function unitLabel(key, n, lang, tr) {
  if (!PLURAL_UNITS.has(key)) return tr(key);
  const form = pluralForm(Number(n), String(lang).slice(0, 2));
  return form === "many" ? tr(key) : tr(`${key}_${form}`);
}

/**
 * Replace every |n:…| number and every |key| word in a row value with localized text.
 *
 * The word form started as the single `|res_water_l|` litre token. Sessions 10 and 11 need
 * more of them — "160 płyt", "6 worków", "480 szt." — so any dictionary key inside pipes is
 * translated, and a plain `|res_bags:6|` inflects that word for the number in front of it.
 * Same reason as the number token: the engines run at build time and in the browser, and
 * neither knows the page's language at the point a row is built.
 */
function localizeRow(value, lang, translate) {
  const fmt = (x) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(x);
  // Intl wants a language tag; the plural rules want the bare code, and both forms reach
  // this function ("pl-PL" from the build, "pl" from the browser).
  const code = String(lang).slice(0, 2);
  return String(value)
    .replace(/\|n:(-?[0-9.]+)\|/g, (_, n) => fmt(parseFloat(n)))
    .replace(/\|([a-z0-9_]+):(-?[0-9.]+)\|/gi, (_, key, n) =>
      unitLabel(key, parseFloat(n), code, translate))
    .replace(/\|([a-z0-9_]+)\|/gi, (_, key) => translate(key));
}
