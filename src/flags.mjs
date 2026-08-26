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

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");
const DIR = join(ASSETS, "flags");

/** The flag markup for one language, ready to drop into HTML. */
const read = (lang) => readFileSync(join(DIR, `${lang}.svg`), "utf8").trim();

/** { pl: "<svg …>", uk: … } — every language the site ships. */
export const FLAG = Object.fromEntries(LANGS.map((l) => [l, read(l)]));

/* The language's own name, as it is written in that language — read from
   assets/i18n.js rather than typed here a second time.

   It used to be typed here, and it named four languages while the site shipped ten. From
   the moment the six were restored (2026-08-19) every generated page wrote the word
   "undefined" next to six flags: once in the header picker's menu and again in the
   footer's language list, on 370 of the 375 pages. The browser half never had the defect
   — assets/i18n.js has carried all ten labels the whole time, and the three pages that
   build their picker at runtime read it — so this was one list with two copies, and the
   shorter copy was the one 370 pages were rendered from.

   Reading it means there is one copy. A language that still has no name is named by
   validate() in scripts/build.mjs, which aborts the build rather than shipping a word
   nobody wrote. */
export const LANG_NAME = readLangNames();

function readLangNames() {
  // The same trick scripts/build.mjs uses on every browser script it needs a value out
  // of: assets/i18n.js has no exports, so evaluate it and take the one global.
  const src = readFileSync(join(ASSETS, "i18n.js"), "utf8");
  const meta = new Function(`${src}\nreturn LANGS;`)();
  const names = {};
  for (const entry of Array.isArray(meta) ? meta : []) {
    if (entry && entry.code && typeof entry.label === "string" && entry.label.trim()) {
      names[entry.code] = entry.label.trim();
    }
  }
  return names;
}
