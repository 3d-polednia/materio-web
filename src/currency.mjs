/* LiczMat website — the build's view of assets/currency.js.

   The browser file is the source of truth for which currencies exist and which one a
   language starts with; the header has to render the selector before any script runs, so
   the build reads the same two tables out of it instead of keeping a second copy. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "currency.js");

const { LM_CURRENCIES, LM_LANG_CURRENCY } = new Function(
  `${readFileSync(FILE, "utf8")}\nreturn { LM_CURRENCIES, LM_LANG_CURRENCY };`)();

/** ["PLN", "EUR", "USD", "UAH"] */
export const CURRENCIES = LM_CURRENCIES;

/** The currency a language starts with, until the visitor picks another one. */
export const DEFAULT_CURRENCY = LM_LANG_CURRENCY;
