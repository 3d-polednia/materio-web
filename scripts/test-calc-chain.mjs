#!/usr/bin/env node
/** LiczMat - follow-up calculator mapping, translations and built pages. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CALC_SLUG, LANGS, urlCalc } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = (...files) => files.map((file) => readFileSync(join(ROOT, file), "utf8")).join("\n");
const loaded = new Function(`${source("assets/units.js", "assets/calculators.js", "assets/materials.js", "assets/calc-chain.js")}
  return { CALCS, MATERIALS, calcChainArea, calcChainTargets };`)();
const pages = new Function(`${source("assets/i18n-pages.js")}\nreturn I18N_PAGES;`)();

let passed = 0;
const failures = [];
function eq(name, got, want) {
  const actual = JSON.stringify(got);
  const expected = JSON.stringify(want);
  if (actual === expected) passed++;
  else failures.push(`${name}: expected ${expected}, got ${actual}`);
}
function check(name, condition, detail = "") {
  if (condition) passed++;
  else failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}
const compact = (targets) => targets.map(({ calc, m, area }) => ({ calc, ...(m ? { m } : {}), ...(area !== undefined ? { area } : {}) }));
const targets = (calc, material, values = { area: "20" }) => compact(loaded.calcChainTargets(calc, material, values));

eq("gres goes to grout and C2", targets("waste", "gres-30x60"), [
  { calc: "grout", m: "gres-30x60", area: 20 }, { calc: "mortar", m: "klej-c2-25", area: 20 },
]);
eq("glaze chooses C1", targets("waste", "glaz-30x60"), [
  { calc: "grout", m: "glaz-30x60", area: 20 }, { calc: "mortar", m: "klej-c1-25", area: 20 },
]);
eq("wood-look gres stays on tile path", targets("waste", "gres-deska-20x120"), [
  { calc: "grout", m: "gres-deska-20x120", area: 20 }, { calc: "mortar", m: "klej-c2-25", area: 20 },
]);
eq("floor panel gets skirting and membrane", targets("waste", "panel-ac4"), [
  { calc: "linear", m: "listwa-mdf-2_5" }, { calc: "coverage", m: "folia-paro", area: 20 },
]);
eq("wall panel has no follow-up", targets("waste", "panel-scienny"), []);
eq("G-K board workflow", targets("waste", "gk-zwykla-2600"), [
  { calc: "studwall" }, { calc: "coverage", m: "welna-10", area: 20 },
  { calc: "coverage", m: "gladz-gips-20", area: 20 },
]);
eq("paint workflow", targets("coverage", "farba-scienna-10"), [
  { calc: "coverage", m: "grunt-gleb-5", area: 20 },
  { calc: "coverage", m: "gladz-gips-20", area: 20 },
]);
eq("primer workflow", targets("coverage", "grunt-gleb-5"), [
  { calc: "coverage", m: "farba-scienna-10", area: 20 },
]);
eq("plaster workflow", targets("coverage", "tynk-gips-30"), [
  { calc: "coverage", m: "gladz-gips-20", area: 20 }, { calc: "coverage", m: "farba-scienna-10", area: 20 },
]);
eq("skim workflow", targets("coverage", "gladz-gips-20"), [
  { calc: "coverage", m: "grunt-gleb-5", area: 20 }, { calc: "coverage", m: "farba-scienna-10", area: 20 },
]);
eq("facade adhesive workflow", targets("coverage", "klej-styro-25"), [
  { calc: "coverage", m: "grunt-kwarc-5", area: 20 }, { calc: "coverage", m: "tynk-silik-25", area: 20 },
]);
eq("facade insulation workflow", targets("coverage", "styropian-fasada-10"), [
  { calc: "coverage", m: "klej-styro-25", area: 20 }, { calc: "coverage", m: "tynk-silik-25", area: 20 },
]);
eq("screed coating returns to surface", targets("coverage", "wylewka-samop-25"), [{ calc: "waste", area: 20 }]);
eq("unrelated coating has no follow-up", targets("coverage", "emalia-0_75"), []);
eq("bare coverage follows paint workflow", targets("coverage", ""), [
  { calc: "coverage", m: "grunt-gleb-5", area: 20 }, { calc: "coverage", m: "gladz-gips-20", area: 20 },
]);
eq("profile workflow", targets("linear", "cd60-3", {}), [
  { calc: "waste", m: "gk-zwykla-2600" }, { calc: "coverage", m: "welna-10" },
]);
eq("decking workflow", targets("linear", "deska-taras-3", {}), [
  { calc: "linear", m: "lata-4x5-4" }, { calc: "coverage", m: "olej-taras-2_5" },
]);
eq("rebar workflow", targets("linear", "pret-8-12", {}), [{ calc: "concrete" }]);
eq("wallpaper workflow", targets("wallpaper", "tapeta-standard", { wallW: "4", wallH: "2,5" }), [
  { calc: "coverage", m: "grunt-gleb-5", area: 10 },
]);
eq("grout workflow", targets("grout", "gres-30x60"), [{ calc: "mortar", m: "klej-c2-25", area: 20 }]);
eq("adhesive workflow", targets("mortar", "klej-c1-25"), [{ calc: "grout", area: 20 }]);
eq("non-adhesive mortar has no follow-up", targets("mortar", "tynk-cw-30"), []);
eq("masonry workflow", targets("masonry", ""), [
  { calc: "concrete" }, { calc: "coverage", m: "tynk-cw-30", area: 20 },
]);
eq("screed workflow", targets("screed", ""), [
  { calc: "waste", area: 20 }, { calc: "coverage", m: "folia-paro", area: 20 },
]);
eq("dry lining workflow", targets("drylining", "", { area: "12" }), [
  { calc: "coverage", m: "gladz-gips-20", area: 12 },
]);
eq("stud wall workflow", targets("studwall", "", { width: "4", height: "2.5" }), [
  { calc: "coverage", m: "welna-10", area: 10 },
]);
eq("ceiling workflow", targets("ceiling", "", { mode: "dims", width: "4", length: "5" }), [
  { calc: "coverage", m: "welna-10", area: 20 },
]);
for (const calc of ["concrete", "sheet", "sheathing", "insulation"]) {
  eq(`${calc} has no follow-up`, targets(calc, ""), []);
}
eq("dimensions produce net area", loaded.calcChainArea("waste", { mode: "dims", width: "4", length: "5" }), 20);
eq("Polish comma is parsed", loaded.calcChainArea("studwall", { width: "4,5", height: "2" }), 9);
eq("typed area wins over bought result", loaded.calcChainArea("waste", { mode: "area", area: "20", tobuy: "22" }), 20);

const ids = [...new Set([...source("assets/calc-chain.js").matchAll(/m:\s*"([^"]+)"/g)].map((match) => match[1]))];
const known = new Set(loaded.MATERIALS.map((material) => material.id));
ids.forEach((id) => check(`mapping material exists: ${id}`, known.has(id)));
LANGS.forEach((lang) => check(`calc_chain translated: ${lang}`, Boolean(pages[lang] && pages[lang].calc_chain)));
for (const calc of loaded.CALCS) {
  for (const lang of LANGS) {
    const file = join(ROOT, urlCalc(lang, calc.id).replace(/^\//, ""), "index.html");
    const html = readFileSync(file, "utf8");
    check(`${lang}/${calc.id} loads calc-chain`, /\/assets\/calc-chain\.min\.js\?v=/.test(html), file);
    check(`${lang}/${calc.id} carries calculator URLs`, html.includes("data-calc-urls="), file);
  }
}

const total = passed + failures.length;
console.log(`calc chain: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.log(`  x ${failure}`));
  process.exit(1);
}
