#!/usr/bin/env node
/**
 * LiczMat — saving a calculation, tested.
 *
 *     node scripts/test-save.mjs
 *
 * Master plan, session 16: "KALKULATOR → WYNIK → DODAJ DO PROJEKTU → PROJEKT", and the
 * demand under it — a saved line must still answer, later, which calculator produced it,
 * what was typed into it, what came out, in what unit and when. "Nie zapisuj tylko samej
 * liczby, jeśli później nie będzie wiadomo, skąd się wzięła."
 *
 * This file is the half that needs no browser: the snapshot document written into
 * `inputJson`, the size limit it has to live inside, which project a saved line lands in,
 * the keys the build puts on every field so the snapshot can be read back in another
 * language, and the copy in all four languages. The other half — clicking through the
 * whole arrow in Chromium and reading the project screen afterwards — is
 * scripts/test-save-page.mjs.
 *
 * Same shape as scripts/test-projects.mjs: no dependencies, plain `node`, exit 1 on a
 * failure so it can gate a commit.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { calcCard } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG, urlProjects, urlCalc } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/**
 * Evaluate a browser script that has no exports and hand back the globals we need.
 * A list of files is evaluated as one scope, in order, exactly as the browser loads them.
 */
function evalScript(file, returns, globals = {}) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const DICT = {};
for (const lang of LANGS) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

const { CALCS, ENGINES, unitLabel } = evalScript(
  ["assets/units.js", "assets/calculators.js"],
  ["CALCS", "ENGINES", "unitLabel"], { document: undefined, window: {} });

/** assets/workspace.js in Node, on a fresh store — the same stand-ins test-projects uses. */
function loadWorkspace(seed) {
  const backing = new Map(Object.entries(seed || {}));
  const clock = { now: 1_760_000_000_000 };
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const api = evalScript("assets/workspace.js", [
    "WS_SCHEMA", "WS_SNAPSHOT", "WS_INPUT_MAX", "wsLoad",
    "wsProjects", "wsProject", "wsAddProject", "wsArchiveProject",
    "wsActiveProjectId", "wsSetActiveProject",
    "wsEstimations", "wsAddEstimation", "wsAddManualEstimation",
    "wsInputJson", "wsLineSnapshot",
  ], {
    localStorage,
    document: { dispatchEvent: () => {} },
    crypto: { randomUUID: () => `id-${backing.size}-${Math.random().toString(36).slice(2, 10)}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: { now: () => clock.now },
    lmCurrency: () => "PLN",
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return { ...api, tick: (ms) => { clock.now += ms || 1000; }, now: () => clock.now };
}

/**
 * One save, as assets/workspace-ui.js performs it: the flat field map that has been in
 * `inputJson` since the beginning, plus the snapshot session 16 added beside it.
 */
function save(ws, over = {}) {
  const input = over.input || { area: "21.6", cov: "1.44", waste: "7", price: "49.90" };
  return ws.wsAddEstimation({
    calcId: over.calcId || "waste",
    name: "Gres 60×60",
    requiredUnits: 15,
    unitLabel: "opak.",
    costMajor: 749.85,
    wastePercent: 7,
    input,
    snapshot: over.snapshot === undefined ? {
      v: ws.WS_SNAPSHOT,
      calc: "waste",
      at: ws.now(),
      fields: [
        { k: "area", l: "fld_area" }, { k: "cov", l: "fld_pkg_cov" },
        { k: "waste", l: "fld_waste" }, { k: "price", l: "fld_price_pkg" },
      ],
      unit: "res_pkgs",
      tobuy: 15,
      rows: [["res_purchased", "|n:21.6| m²"], ["res_waste", "|n:7|%"]],
    } : over.snapshot,
    ...(over.projectId !== undefined ? { projectId: over.projectId } : {}),
    projectName: "Mój projekt",
  });
}

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

/* ------------------------------------------------------------------ 1. the snapshot */

head("1. the saved line explains itself (chapter XV)");
{
  const ws = loadWorkspace();
  const row = save(ws);
  const stored = JSON.parse(row.inputJson);

  // The five questions chapter XV names, in the order it names them.
  const snap = ws.wsLineSnapshot(row);
  check("the line carries a snapshot", Boolean(snap));
  eq("which calculator produced it", snap.calc, "waste");
  eq("what was typed into it", snap.input.area, "21.6");
  eq("what came out", snap.tobuy, 15);
  eq("in what unit", snap.unit, "res_pkgs");
  eq("and when it was calculated", snap.at, ws.now());

  // The coarse enum is why the snapshot exists: eleven of the fifteen calculators write
  // the same calculationType, so the document alone cannot name the tool that produced it.
  const engineOf = (calc) => save(ws, {
    calcId: calc,
    input: { area: "20" },
    snapshot: { v: ws.WS_SNAPSHOT, calc, at: 1, fields: [], unit: "res_bags", tobuy: 4, rows: [] },
  });
  const mortar = engineOf("mortar");
  const screed = engineOf("screed");
  eq("mortar and screed are the same type on the document",
    `${mortar.calculationType}=${screed.calculationType}`, "SURFACE_COVERAGE=SURFACE_COVERAGE");
  check("but their snapshots tell them apart",
    ws.wsLineSnapshot(mortar).calc !== ws.wsLineSnapshot(screed).calc);

  // Nothing was invented at the top level of the document: a field the sync contract does
  // not carry is erased by the phone's next push, without a word (see session 15).
  const CONTRACT = [
    "id", "projectId", "name", "calculationType", "materialCategory", "requiredUnits",
    "unitLabel", "totalCostMinor", "wastePercentage", "wasteCostMinor", "currencyCode",
    "inputJson", "createdAt", "updatedAt", "deletedAt", "schemaVersion",
  ];
  const extra = Object.keys(row).filter((k) => !CONTRACT.includes(k));
  eq("the estimate document gained no field of its own", extra.join(","), "");

  // The flat map was there before session 16 and stays exactly where it was: anything
  // reading inputJson.area keeps working.
  eq("the field values stay at the top of inputJson", stored.area, "21.6");
  eq("and the snapshot sits beside them", typeof stored._lm, "object");

  // Text is never frozen into storage: a field travels as its dictionary key, so the line
  // reads correctly in a language nobody had chosen when it was saved.
  const labels = snap.fields.map((f) => f.l);
  check("a field is stored as its key, not as its label",
    labels.every((l) => /^fld_/.test(l)), labels.join(","));
  for (const lang of LANGS) {
    check(`${lang}: every stored field key translates`,
      labels.every((l) => DICT[lang][l]), labels.join(","));
    check(`${lang}: every stored result row key translates`,
      snap.rows.every(([k]) => DICT[lang][k]), snap.rows.map(([k]) => k).join(","));
  }
}

head("2. reading a snapshot back, defensively");
{
  const ws = loadWorkspace();

  // The string travels through Firestore and through another application. Nothing that
  // reads it may assume a shape.
  eq("a line saved before session 16 has none",
    ws.wsLineSnapshot({ inputJson: '{"area":"20"}' }), null);
  eq("a line typed by hand on /kosztorys/ has none",
    ws.wsLineSnapshot(ws.wsAddManualEstimation({ name: "Robocizna", requiredUnits: 1, unitLabel: "szt.", costMajor: 500 })), null);
  eq("broken JSON answers null instead of throwing",
    ws.wsLineSnapshot({ inputJson: "{not json" }), null);
  eq("so does an empty line", ws.wsLineSnapshot({}), null);
  eq("a snapshot from a later version is not guessed at",
    ws.wsLineSnapshot({ inputJson: JSON.stringify({ _lm: { v: 99, calc: "waste" } }) }), null);
  eq("nor is one with no calculator in it",
    ws.wsLineSnapshot({ inputJson: JSON.stringify({ _lm: { v: ws.WS_SNAPSHOT } }) }), null);

  const odd = ws.wsLineSnapshot({
    inputJson: JSON.stringify({ _lm: { v: ws.WS_SNAPSHOT, calc: "waste", fields: "nope", rows: 7 } }),
  });
  check("wrong types inside a snapshot come back as empty lists",
    Array.isArray(odd.fields) && odd.fields.length === 0 && Array.isArray(odd.rows) && odd.rows.length === 0);
}

/* ------------------------------------------------------------------ 3. the size cap */

head("3. inputJson stays inside the contract's 20 000 characters, and stays JSON");
{
  const ws = loadWorkspace();
  eq("the cap is the one the security rules enforce", ws.WS_INPUT_MAX, 20000);

  const fits = ws.wsInputJson({ area: "20" }, { v: 1, calc: "waste" });
  check("a normal line keeps both halves",
    JSON.parse(fits).area === "20" && Boolean(JSON.parse(fits)._lm));

  // A cutting list is free text: a thousand pieces is a real, if rare, list. Slicing the
  // JSON to length would leave a string nothing can parse, so the snapshot goes first.
  // The list below is as long as it can be without the snapshot, and too long with it.
  const room = ws.WS_INPUT_MAX - JSON.stringify({ cuts: "", stock: "6000" }).length - 4;
  const huge = { cuts: "2400x4;".repeat(Math.floor(room / 7)), stock: "6000" };
  const trimmed = ws.wsInputJson(huge, { v: 1, calc: "linear", rows: [["res_waste", "3%"]] });
  check("an oversized line is still valid JSON", (() => {
    try { JSON.parse(trimmed); return true; } catch (e) { return false; }
  })(), trimmed.slice(-40));
  check("it is inside the limit", trimmed.length <= ws.WS_INPUT_MAX, String(trimmed.length));
  eq("the values the visitor typed are what survives", JSON.parse(trimmed).stock, "6000");
  eq("and the snapshot is what went", JSON.parse(trimmed)._lm, undefined);

  const enormous = ws.wsInputJson({ cuts: "x".repeat(30000) }, { v: 1, calc: "linear" });
  check("an input map that cannot fit on its own still leaves JSON behind", (() => {
    try { JSON.parse(enormous); return true; } catch (e) { return false; }
  })());
  check("and it is inside the limit", enormous.length <= ws.WS_INPUT_MAX);

  // The line still saves. A result that cannot be kept because the cutting list was long
  // would be the one case where counting silently fails.
  const row = save(ws, { input: huge });
  check("the line itself is saved either way", ws.wsEstimations().length === 1);
  check("and its inputJson parses", (() => {
    try { JSON.parse(row.inputJson); return true; } catch (e) { return false; }
  })());
}

/* ------------------------------------------------------------------ 4. which project */

head("4. the arrow ends in the project the visitor picked");
{
  const ws = loadWorkspace();
  const bath = ws.wsAddProject("Łazienka");
  ws.tick();
  const kitchen = ws.wsAddProject("Kuchnia");
  eq("the newest project is the active one", ws.wsActiveProjectId(), kitchen.id);

  const picked = save(ws, { projectId: bath.id });
  eq("a picked project takes the line, not the active one", picked.projectId, bath.id);
  eq("and the active project is left alone", ws.wsActiveProjectId(), kitchen.id);

  eq("no pick means the active project", save(ws, { projectId: "" }).projectId, kitchen.id);
  eq("an id nobody has means the active project too",
    save(ws, { projectId: "id-that-never-existed" }).projectId, kitchen.id);

  // An archived project takes no new lines — that is what archiving it meant. A picker
  // left open while the project was archived in another tab must not file the result away.
  ws.wsArchiveProject(bath.id, true);
  eq("an archived project does not take the line", save(ws, { projectId: bath.id }).projectId,
    kitchen.id);

  // Counting never requires an account, and it must not require housekeeping either: a
  // first result on a first visit has nowhere to go and makes itself somewhere.
  const fresh = loadWorkspace();
  const first = save(fresh, { projectId: "" });
  eq("with no projects at all, one is made", fresh.wsProjects().length, 1);
  eq("and the line lands in it", first.projectId, fresh.wsProjects()[0].id);
  eq("named by the page, in the page's language", fresh.wsProjects()[0].name, "Mój projekt");
}

/* ------------------------------------------------------------------ 5. the card */

head("5. the calculator card carries the keys the snapshot is made of");
{
  const t = tr(DEFAULT_LANG);
  for (const calc of CALCS) {
    const example = { tobuy: "1", unit: "opak.", rows: [] };
    const html = calcCard(calc, t, { materials: 0, example, projectsUrl: urlProjects(DEFAULT_LANG) });

    // Every control that carries a value carries the key of its label next to it. Without
    // it the snapshot would have to freeze "Powierzchnia" into storage, and a line saved
    // in Polish would read as Polish on a German page for ever.
    const controls = html.match(/data-k="[^"]+"[^>]*/g) || [];
    eq(`${calc.id}: every field is in the markup`, controls.length, calc.fields.length);
    for (const f of calc.fields) {
      check(`${calc.id}/${f.k}: the field carries its label key`,
        html.includes(`data-k="${f.k}" data-lk="${f.label}"`), controls.join("\n      "));
      for (const lang of LANGS) {
        check(`${calc.id}/${f.k}: that key translates into ${lang}`, Boolean(DICT[lang][f.label]));
      }
    }

    // A dropdown's answer is the word, not the "1" behind it — unless the word is the
    // number: "Strony do płytowania: 2" needs no dictionary and declares no key.
    for (const f of calc.fields.filter((x) => x.sel)) {
      for (const [value, , key] of f.sel) {
        if (!key) {
          check(`${calc.id}/${f.k}: the option "${value}" is its own answer`,
            html.includes(`<option value="${value}"`) && !html.includes(`value="${value}" data-ok`));
          continue;
        }
        check(`${calc.id}/${f.k}: the option "${key}" carries its own key`,
          html.includes(`data-ok="${key}"`), html);
        for (const lang of LANGS) {
          check(`${calc.id}/${f.k}: "${key}" translates into ${lang}`, Boolean(DICT[lang][key]));
        }
      }
    }
  }

  // The way to the project, written by the build because the script has no site map.
  for (const lang of LANGS) {
    const calc = CALCS[0];
    const html = calcCard(calc, tr(lang), {
      materials: 0, example: { tobuy: "1", unit: "opak.", rows: [] },
      projectsUrl: urlProjects(lang),
    });
    check(`${lang}: the actions slot knows where the projects live`,
      html.includes(`data-calc-actions data-projects-url="${urlProjects(lang)}"`), html);
  }
}

/* ------------------------------------------------------------------ 6. the page's map */

head("6. /projekty/ is handed one address per calculator, in its own language");
{
  for (const lang of LANGS) {
    const file = join(urlProjects(lang).replace(/^\//, ""), "index.html");
    const built = readFileSync(p(file), "utf8");
    const m = built.match(/window\.LM_PROJ = (\{.*?\});<\/script>/s);
    if (!check(`${lang}: the page carries the map`, Boolean(m))) continue;
    const data = JSON.parse(m[1]);
    eq(`${lang}: one address per calculator`, Object.keys(data.calcs).length, CALCS.length);
    for (const calc of CALCS) {
      eq(`${lang}: ${calc.id} points at this language's page`, data.calcs[calc.id],
        urlCalc(lang, calc.id));
    }
  }
}

/* ------------------------------------------------------------------ 7. the copy */

head("7. the copy, in four languages");
{
  const KEYS = [
    "ws_saved_in", "ws_new_project_opt", "proj_open",
    "proj_src_t", "proj_src_calc", "proj_src_input", "proj_src_result", "proj_src_when",
    "ws_lines", "ws_lines_one", "ws_lines_few",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: "${key}" exists and is not the key`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key);
    }
  }
  for (const key of ["ws_saved_in", "proj_src_t", "proj_open"]) {
    /* Croatian and Serbian are two standards of one language and agree exactly on 46% of
       the dictionary — a short UI string coming out identical in both is correct, not a
       copy-paste. So they count as one voice here; every other language must still be
       distinct, which is what catches a block pasted from its neighbour. */
    const values = new Set(LANGS.filter((l) => l !== "sr").map((l) => DICT[l][key]));
    eq(`"${key}" says something different in each language`, values.size, LANGS.length - 1);
  }
  // The strip reads "<sentence> <name>", so the sentence has to end where a name follows.
  for (const lang of LANGS) {
    check(`${lang}: "ws_saved_in" is written to be followed by a name`,
      DICT[lang].ws_saved_in.endsWith(":"));
  }

  // "1 pozycji" is what three screens said until session 16: the inflection existed and
  // lived in the file with the engines, which none of those three pages loads.
  const forms = {
    pl: ["1 pozycja", "2 pozycje", "5 pozycji", "12 pozycji", "22 pozycje"],
    uk: ["1 позиція", "2 позиції", "5 позицій", "12 позицій", "22 позиції"],
    de: ["1 Zeile", "2 Zeilen", "5 Zeilen", "12 Zeilen", "22 Zeilen"],
    en: ["1 line", "2 lines", "5 lines", "12 lines", "22 lines"],
    /* The five languages brought back after session 28 that are still here, and the four
       added on 2026-09-02. Four different plural rules run through this table, which is
       the whole reason it is written out by hand:
       - hr and sr follow the Polish rule, so 22 takes the "few" form;
       - cs and sk give "few" to 2, 3 and 4 only, so 22 reads like 25 — writing
         "22 položky" here would be the bug this row exists to catch;
       - ro keeps "few" all the way to 19 and past it (101), and switches at 20;
       - it, nl, es and fr have one and other, like de and en, so every row but the
         first is the same word. Romanian is the odd Romance language here, not the rule. */
    cs: ["1 položka", "2 položky", "5 položek", "12 položek", "22 položek"],
    sk: ["1 položka", "2 položky", "5 položiek", "12 položiek", "22 položiek"],
    ro: ["1 poziție", "2 poziții", "5 poziții", "12 poziții", "22 poziții"],
    hr: ["1 stavka", "2 stavke", "5 stavki", "12 stavki", "22 stavke"],
    sr: ["1 stavka", "2 stavke", "5 stavki", "12 stavki", "22 stavke"],
    it: ["1 voce", "2 voci", "5 voci", "12 voci", "22 voci"],
    nl: ["1 regel", "2 regels", "5 regels", "12 regels", "22 regels"],
    es: ["1 partida", "2 partidas", "5 partidas", "12 partidas", "22 partidas"],
    fr: ["1 ligne", "2 lignes", "5 lignes", "12 lignes", "22 lignes"],
  };
  for (const lang of LANGS) {
    [1, 2, 5, 12, 22].forEach((n, i) => {
      eq(`${lang}: ${n} lines`, `${n} ${unitLabel("ws_lines", n, lang, tr(lang))}`, forms[lang][i]);
    });
  }
}

/* ------------------------------------------------------------------ 8. end to end */

head("8. a real result, saved and read back");
{
  const ws = loadWorkspace();
  const calc = CALCS.find((c) => c.id === "waste");
  const input = Object.fromEntries(calc.fields.map((f) => [f.k, f.def]));
  input.price = "49.90";
  const res = ENGINES[calc.engine](input);

  const row = ws.wsAddEstimation({
    calcId: calc.id,
    name: "Gres 60×60",
    requiredUnits: res.tobuy,
    unitLabel: unitLabel(res.unit, res.tobuy, "pl", tr("pl")),
    costMajor: res.cost,
    wastePercent: 7,
    input,
    snapshot: {
      v: ws.WS_SNAPSHOT, calc: calc.id, at: ws.now(),
      fields: calc.fields.map((f) => ({ k: f.k, l: f.label })),
      unit: res.unit, tobuy: res.tobuy,
      rows: (res.rows || []).map(([k, v]) => [k, String(v)]),
    },
    projectName: "Mój projekt",
  });

  const snap = ws.wsLineSnapshot(row);
  eq("the number in the snapshot is the number the engine gave", snap.tobuy, res.tobuy);
  eq("the money on the document is the money it gave",
    row.totalCostMinor, Math.round(res.cost * 100));
  eq("every input the engine read is in the snapshot", snap.fields.length, calc.fields.length);
  eq("every result row is there too", snap.rows.length, (res.rows || []).length);

  // A line can be corrected on /kosztorys/. The snapshot is what the calculator said and
  // does not follow the correction — that is the point of keeping it.
  eq("the unit label on the document is inflected for the count", row.unitLabel,
    unitLabel(res.unit, res.tobuy, "pl", tr("pl")));
  check("and the snapshot keeps the unit as a key, so it can be read in any language",
    snap.unit === res.unit && /^res_/.test(snap.unit));
  for (const lang of LANGS) {
    check(`${lang}: the kept unit renders`,
      unitLabel(snap.unit, snap.tobuy, lang, tr(lang)) !== snap.unit);
  }
}

/* ------------------------------------------------------------------ report */

console.log(`\nsave: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
