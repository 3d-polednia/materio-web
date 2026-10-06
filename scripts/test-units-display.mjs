#!/usr/bin/env node
/* Display-time translation of persisted unit text. No dependencies. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(root, name), "utf8");
const api = new Function(`${read("assets/unit-map.js")}
${read("assets/i18n.js")}
${read("assets/i18n-pages.js")}
${read("assets/i18n-materials.js")}
const DICTS = Object.fromEntries(Object.keys(I18N).map((lang) => [lang,
  {...I18N[lang], ...I18N_PAGES[lang], ...I18N_MATERIALS[lang]}]));
function t(key, lang) { return (DICTS[lang] || DICTS.pl)[key] || key; }
${read("assets/units.js")}
return { UNIT_MAP, unitText, DICTS };`)();

let passed = 0;
const eq = (label, got, want) => {
  if (got !== want) throw new Error(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  passed += 1;
};
const has = (label, spelling) => {
  if (!api.UNIT_MAP[spelling.trim().toLowerCase()]) throw new Error(`${label}: ${spelling} missing`);
  passed += 1;
};

for (const spelling of ["opak.", "szt.", "op.", "Pack.", "Stk.", "упак."])
  has("generated map", spelling);
eq("Polish packages display in German", api.unitText("opak.", 7, "de"), api.DICTS.de.res_pkgs);
eq("Polish pieces display in English", api.unitText("szt.", 5, "en"), api.DICTS.en.res_pieces);
eq("Polish pieces stay Polish", api.unitText("szt.", 5, "pl"), "szt.");
eq("free-text unit survives", api.unitText("palety", 3, "de"), "palety");
eq("Ukrainian bag singular", api.unitText("worków", 1, "uk"), api.DICTS.uk.res_bags_one);
eq("Ukrainian bag few", api.unitText("worków", 3, "uk"), api.DICTS.uk.res_bags_few);
eq("Ukrainian bag many", api.unitText("worków", 5, "uk"), api.DICTS.uk.res_bags);

console.log(`OK: ${passed} unit-display checks; generated map has ${Object.keys(api.UNIT_MAP).length} spellings.`);
