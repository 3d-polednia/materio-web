/* LiczMat website — the flag next to every language name.

   The master plan (chapter V) rules out emoji flags: 🇵🇱 renders differently on every
   platform, is missing entirely on some Androids and cannot be styled. So each flag is a
   real vector asset in assets/flags/<lang>.svg, and this module inlines it at build time.

   Inlining rather than <img src> is deliberate: four small shapes cost less than four
   requests, they cannot flash in late, and they survive with the page when the network
   is gone — which is the point of an offline-first calculator. The same markup is written
   into the generated dictionary bundles (assets/i18n.<lang>.js) so /app/ and /p/, which
   switch language in place, draw exactly the same picker. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS } from "./site.mjs";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "flags");

/** The flag markup for one language, ready to drop into HTML. */
const read = (lang) => readFileSync(join(DIR, `${lang}.svg`), "utf8").trim();

/** { pl: "<svg …>", uk: … } — every language the site ships. */
export const FLAG = Object.fromEntries(LANGS.map((l) => [l, read(l)]));

/** The language's own name, as it is written in that language. */
export const LANG_NAME = {
  pl: "Polski",
  uk: "Українська",
  de: "Deutsch",
  en: "English",
};
