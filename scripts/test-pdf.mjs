#!/usr/bin/env node
/**
 * LiczMat — the PDF export of a project, tested.
 *
 *     node scripts/test-pdf.mjs
 *
 * Session 59, the second half of item **C6** of the parity audit: "Eksport PDF i własne
 * materiały — tylko w aplikacji." The app has had `PdfConfigScreen` and
 * `AndroidProjectPdfExporter` since long before this site existed.
 *
 * What this checks, in the order it matters:
 *
 *   1. the arithmetic, against `PdfExportOptions.computeInvestorBreakdown()` in the app
 *      repo — layer for layer and rounding for rounding, because two products answering
 *      "what does this job come to" differently is the defect the audit exists to find;
 *   2. the rows, which are `wsProjectCosts()`'s own two halves and therefore add up to the
 *      total printed under them;
 *   3. the document, which ships in the markup rather than being built by a script;
 *   4. the words, which are the app's own — not a translation and not an invention;
 *   5. the two Android templates that keep their `%1$s`, so a sentence keeps its word
 *      order in ten languages;
 *   6. what the print does to the page, and what it undoes afterwards;
 *   7. the net session 41 and 57 both needed: no key printed where a visitor reads it.
 *
 * Dependency-free, plain `node`, exit 1 on failure.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { projectsMain } from "../src/pages.mjs";
import { PDF_COPY, PDF_COPY_KEYS, pdfSplit } from "../src/pdf-copy.mjs";
import { LANGS, DEFAULT_LANG } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");

function evalSource(src, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}
const evalScript = (file, returns, globals) => evalSource(read(file), returns, globals);

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);

/* The permission table as the browser has it. The export became Pro on 2026-09-03, so
   pdfBlock() now draws chapter XXV's wall beside the configurator and proGate() builds it
   out of LM_FEATURES — a builder called without it would be checking a page the build
   never writes. */
const FEATURES = evalScript(["assets/account.js", "assets/plan.js"], ["LM_FEATURES"]).LM_FEATURES;

const DICT = {};
for (const lang of LANGS) {
  DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}), ...(I18N_MATERIALS[lang] || {}) };
}
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/**
 * assets/pdf-export.js in Node — only the pure half; the DOM half is the page test.
 *
 * `allow` is what pwAllows() answers, feature by feature: `null` leaves the function off
 * the page entirely, which is the case the export has to close on rather than open on.
 * `doc` is the one element pdfFill() writes into, so a refusal can be checked for what it
 * did NOT do.
 */
function loadPdf({ allow = undefined, doc = null } = {}) {
  const globals = {
    document: { readyState: "complete", addEventListener() {}, getElementById: (id) => (id === "ws-pdf-doc" ? doc : null),
      documentElement: { lang: "pl" }, querySelector: () => null, querySelectorAll: () => [] },
    window: { addEventListener() {}, removeEventListener() {}, print() {} },
    location: { search: "" },
    setTimeout: () => 0,
    URLSearchParams: class { get() { return null; } },
    Intl,
    wsProject: () => ({ id: "p1", name: "Łazienka" }),
  };
  if (allow !== undefined) globals.pwAllows = (feature) => Boolean(allow && allow[feature]);
  return evalScript("assets/pdf-export.js",
    ["pdfNum", "pdfBreakdown", "pdfHasPricing", "pdfAllowed", "pdfFill"], globals);
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

/* ================================================================== 1. the arithmetic */

head("1. the investor breakdown is the app's, layer for layer");
{
  const { pdfBreakdown, pdfNum, pdfHasPricing } = loadPdf();
  const all = { labor: true, margin: true, vat: true, type: "investor" };

  // 10 000,00 of materials, 40 h at 80,00, 10 % margin, 23 % VAT.
  const b = pdfBreakdown({ ...all, laborHours: "40", laborRate: "80", marginPercent: "10", vatPercent: "23" }, 1_000_000);
  eq("labour is hours × rate, rounded once", b.labor, 320_000);
  eq("the margin is a percentage of materials PLUS labour", b.margin, 132_000);
  eq("the net is everything above it", b.net, 1_452_000);
  eq("the VAT is a percentage of the net", b.vat, 333_960);
  eq("and the gross is net plus VAT", b.gross, 1_785_960);

  // Each layer off contributes zero, and the chain under it still holds.
  const noLabour = pdfBreakdown({ ...all, labor: false, marginPercent: "10", vatPercent: "23" }, 1_000_000);
  eq("no labour is zero labour", noLabour.labor, 0);
  eq("and the margin is then a percentage of the materials alone", noLabour.margin, 100_000);
  eq("the net follows", noLabour.net, 1_100_000);

  const vatOnly = pdfBreakdown({ ...all, labor: false, margin: false, vatPercent: "23" }, 1_000_000);
  eq("VAT alone applies to the materials", vatOnly.vat, 230_000);
  eq("and the gross is the materials plus it", vatOnly.gross, 1_230_000);

  const none = pdfBreakdown({ type: "investor" }, 1_000_000);
  eq("nothing switched on changes nothing", none.gross, 1_000_000);

  // A blank or nonsense field is zero — `toDecimalOrNull() ?: 0.0` on the phone — rather
  // than a refusal to print the document.
  eq("a blank is zero", pdfNum(""), 0);
  eq("a word is zero", pdfNum("dużo"), 0);
  eq("a comma is a decimal point", pdfNum("1,5"), 1.5);
  eq("and a point still is", pdfNum("1.5"), 1.5);

  const blank = pdfBreakdown({ ...all, laborHours: "", laborRate: "80", marginPercent: "", vatPercent: "" }, 500_000);
  eq("a labour line with no hours costs nothing", blank.labor, 0);
  eq("and the total is what it was", blank.gross, 500_000);

  // Rounding happens once per layer, and it is the layer's own. 33,33 h at 33,33.
  const odd = pdfBreakdown({ ...all, laborHours: "33,33", laborRate: "33,33", marginPercent: "7,5", vatPercent: "8" }, 12_345);
  eq("labour rounds once", odd.labor, Math.round(33.33 * 33.33 * 100));
  eq("the margin rounds once, on the sum above it", odd.margin, Math.round(((12_345 + odd.labor) * 7.5) / 100));
  eq("and the VAT rounds once, on the net", odd.vat, Math.round((odd.net * 8) / 100));

  eq("a technical report prints no pricing block",
    pdfHasPricing({ type: "technical", labor: true, margin: true, vat: true }), false);
  eq("an investor estimate with nothing ticked prints none either",
    pdfHasPricing({ type: "investor" }), false);
  eq("one layer is enough", pdfHasPricing({ type: "investor", vat: true }), true);
}

head("1b. the same numbers as the Kotlin, read out of the app repo");
{
  // Read when the app is beside this repo, so the two implementations cannot drift in
  // silence. Skipped rather than failed when only this repo is checked out.
  const kotlin = p("..", "Materio", "app", "src", "main", "java", "pl", "materio", "app",
    "core", "export", "ProjectPdfExporter.kt");
  if (existsSync(kotlin)) {
    const src = readFileSync(kotlin, "utf8");
    check("labour is hours × rate × 100, rounded",
      /\(\(hours \* rate\) \* 100\.0\)\.roundToLong\(\)/.test(src));
    check("the subtotal is materials + labour",
      /val subtotal = materialsNetMinor \+ laborMinor/.test(src));
    check("the margin applies to the subtotal",
      /\(\(subtotal \* \(marginPercent[\s\S]{0,60}?\)\) \/ 100\.0\)\.roundToLong\(\)/.test(src));
    check("the net is subtotal + margin", /val netTotal = subtotal \+ marginMinor/.test(src));
    check("the VAT applies to the net",
      /\(\(netTotal \* \(vatPercent[\s\S]{0,60}?\)\) \/ 100\.0\)\.roundToLong\(\)/.test(src));
    check("and 23 is the default rate on both",
      /vatPercent: String = "23"/.test(src) && read("src/pages.mjs").includes('"vatPercent", "pdf_vat_percent", "23"'));
    check("the two document types are the app's two",
      /TECHNICAL_REPORT/.test(src) && /INVESTOR_ESTIMATE/.test(src));
  }
}

/* ================================================================== 2. the rows */

head("2. the rows are what wsProjectCosts() counts, and they add up to it");
{
  // The document must not disagree with the screen it was printed from, so the table is
  // built out of the same two halves the project's own total is: the material list, plus
  // the calculations nothing on that list came from, plus the hand-typed costs.
  const src = read("assets/pdf-export.js");
  check("the material list is one half", /wsItems\(projectId\)/.test(src));
  check("the calculations nothing priced are the other",
    /!wsIsManualLine\(r\) && !priced\.has\(r\.id\)/.test(src));
  check("and the hand-typed costs are counted once", /lines\.filter\(wsIsManualLine\)/.test(src));
  check("the printed total is wsProjectCosts()'s own", /wsProjectCosts\(projectId\)/.test(src));
  check("and nothing here re-adds the two collections whole",
    !/items\.concat\(lines\)/.test(src));

  // The same rule the store follows: a priced calculation is on the shopping list already.
  const ws = read("assets/workspace.js");
  check("workspace.js excludes the same rows the same way",
    ws.includes("!wsIsManualLine(r) && !priced.has(r.id)"));
}

/* ================================================================== 3. the document */

head("3. the document is markup, not a script's output");
{
  const { main } = projectsMain(DEFAULT_LANG, tr(DEFAULT_LANG), ["TILES", "OTHER"], FEATURES);
  check("the block is on the project screen", main.includes('id="ws-pdf"'));
  check("the document ships in the page", main.includes('id="ws-pdf-doc"'));
  check("and starts hidden", /id="ws-pdf-doc"[^>]*hidden/.test(main));
  check("the configurator is there too", main.includes('id="ws-pdf-form"'));
  check("both document types are offered",
    main.includes('value="technical"') && main.includes('value="investor"'));
  check("the investor block starts hidden, because a technical report has none",
    /data-pdf-investor hidden/.test(main));
  check("the table has scoped headers", (main.match(/<th scope="col"/g) || []).length >= 3);
  check("every pricing row is in the markup",
    ["materialsNet", "labor", "margin", "net", "vat", "gross"]
      .every((k) => main.includes(`data-pdf="${k}"`)));
  check("a number is typed on a numeric keypad, never a spinner",
    !main.includes('type="number"'));
  check("and every field carries a name",
    !/<input(?![^>]*(?:aria-label|type="(?:checkbox|radio)"))[^>]*>(?![\s\S]{0,200}?<\/label>)/.test(main));

  const script = read("assets/pdf-export.js");
  check("the script writes numbers, not headings",
    !/pdfdoc_|Materiały|Robocizna|VAT"/.test(script.replace(/\/\*[\s\S]*?\*\//g, "")));
  check("it reads the two subtitles off the element rather than holding them",
    script.includes("dataset.subTechnical") && script.includes("dataset.subInvestor"));
  check("and the build stamps them there",
    main.includes('data-technical=') && main.includes('data-investor='));
}

/* ================================================================== 4. the words */

head("4. every string is the app's own");
{
  for (const lang of LANGS) {
    check(`${lang}: copy exists`, Boolean(PDF_COPY[lang]));
    for (const key of PDF_COPY_KEYS) {
      const value = (PDF_COPY[lang] || {})[key];
      check(`${lang}: ${key} is written`, Boolean(value) && String(value).trim().length > 0);
      check(`${lang}: ${key} is not its own key`, value !== key);
    }
  }
  eq("51 keys", PDF_COPY_KEYS.length, 51);

  // Compared against the app's own resources when they are beside this repo. This is the
  // whole point of the module: one concept, one name on the two products.
  const values = (lang) => p("..", "Materio", "app", "src", "main", "res",
    lang === "pl" ? "values" : `values-${lang}`, "strings.xml");
  if (existsSync(values("pl"))) {
    for (const lang of LANGS) {
      const xml = readFileSync(values(lang), "utf8");
      let same = 0;
      for (const key of PDF_COPY_KEYS) {
        const m = new RegExp(`<string name="${key}"[^>]*>([\\s\\S]*?)</string>`).exec(xml);
        if (!m) { check(`${lang}: ${key} exists in the app`, false); continue; }
        const app = m[1].replace(/\\'/g, "'").replace(/\\"/g, '"')
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
          .trim();
        if (app === PDF_COPY[lang][key]) same++;
        else check(`${lang}: ${key} says what the app says`, false,
          `app ${JSON.stringify(app)} vs site ${JSON.stringify(PDF_COPY[lang][key])}`);
      }
      check(`${lang}: all ${PDF_COPY_KEYS.length} strings match the app`, same === PDF_COPY_KEYS.length);
    }
  }

  // And none of it reached the dictionary every page on the site downloads.
  for (const lang of LANGS) {
    const leaked = PDF_COPY_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(DICT[lang], k));
    check(`${lang}: no PDF key is in the dictionary bundle`, leaked.length === 0, leaked.join(", "));
  }
}

head("5. the three templates keep their hole");
{
  for (const lang of LANGS) {
    for (const key of ["pdfdoc_project", "pdfdoc_date", "pdfdoc_estimate_no"]) {
      const value = PDF_COPY[lang][key];
      check(`${lang}: ${key} still has its %1$s`, value.includes("%1$s"), value);
      const { before, after } = pdfSplit(value);
      check(`${lang}: ${key} splits into two halves`, `${before}%1$s${after}` === value);
    }
    // Romanian and Ukrainian do not put the value where Polish does, which is the whole
    // reason the build writes a span between the halves rather than gluing a label on.
    const { main } = projectsMain(lang, tr(lang), ["TILES"], FEATURES);
    check(`${lang}: the project line has a slot rather than a glued label`,
      main.includes('<span data-pdf="projectName"></span>'));
  }
  eq("a string with no token is all `before`", pdfSplit("x").before, "x");
  eq("and nothing after it", pdfSplit("x").after, "");
}

/* ================================================================== 6. the print */

head("6. what printing does to the page, and what it undoes");
{
  const script = read("assets/pdf-export.js");
  const css = read("assets/styles.css");
  check("the flag is set for the length of one print",
    script.includes('document.body.dataset.pdfPrint = "1"'));
  check("and removed afterwards", script.includes("delete document.body.dataset.pdfPrint"));
  check("on afterprint", script.includes('addEventListener("afterprint"'));
  // Some browsers never fire afterprint. Leaving the page with everything but the document
  // hidden would be worse than printing nothing at all.
  check("and on a timer, because some browsers never fire it", /setTimeout\(done,/.test(script));
  check("the document is hidden again", /doc\.hidden = true/.test(script));

  check("the print rules hide by visibility, not display",
    css.includes("body[data-pdf-print] * { visibility: hidden; }"));
  // A display:none ancestor takes the document down with it, and the document is nested
  // six levels inside the project screen.
  check("and show the document back", css.includes("body[data-pdf-print] #ws-pdf-doc, body[data-pdf-print] #ws-pdf-doc * { visibility: visible; }"));
  check("the configurator is never part of the document", css.includes("#ws-pdf-form"));
  check("the block is inside the print media query",
    css.indexOf("body[data-pdf-print]") > css.indexOf("@media print"));
}

/* ================================================================== 7. the net */

head("7. no key is printed where a visitor can read it");
{
  const KEY = /\b(pdf_[a-z_]+|pdfdoc_[a-z_]+)\b/;
  let dirty = 0;
  for (const lang of LANGS) {
    const file = lang === DEFAULT_LANG ? "projekty/index.html" : null;
    const { main } = projectsMain(lang, tr(lang), ["TILES", "OTHER"], FEATURES);
    const text = main.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]*>/g, " ");
    if (KEY.test(text)) { dirty++; check(`${lang} prints a key`, false, KEY.exec(text)[0]); }
    if (file && existsSync(p(file))) {
      const html = readFileSync(p(file), "utf8")
        .replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]*>/g, " ");
      check(`${file} prints no key`, !KEY.test(html), KEY.test(html) ? KEY.exec(html)[0] : "");
      check(`${file} has no \`undefined\` on it`, !html.includes("undefined"));
    }
  }
  check("no language prints one", dirty === 0);
}

/* ============================================== 8. the export belongs to LiczMat Pro */

head("8. a guest and a free account cannot produce a PDF");
{
  /* The owner's decision of 2026-09-03. The permission table is the one place it is
     written down, so it is read here rather than restated: `pdf` and `costs` are both PRO
     and the export needs both — the document is a list of amounts. */
  const { LM_FEATURES: FEAT, lmCan, LM_LEVEL } = evalScript(
    ["assets/account.js", "assets/plan.js"],
    ["LM_FEATURES", "lmCan", "LM_LEVEL"], { document: undefined, localStorage: undefined });

  const pdf = FEAT.find((f) => f.id === "pdf");
  check("the table has a feature for the export", Boolean(pdf));
  eq("and it is Pro", pdf.level, LM_LEVEL.PRO);
  eq("with a name and a line for the wall it puts up", `${pdf.key}_t`, "feat_pdf_t");
  eq("the money in the document is Pro too", FEAT.find((f) => f.id === "costs").level, LM_LEVEL.PRO);
  for (const level of [LM_LEVEL.GUEST, LM_LEVEL.LICZMAT]) {
    eq(`${level} may not export`, lmCan("pdf", level), false);
    eq(`${level} may not be shown an amount`, lmCan("costs", level), false);
  }
  eq("Pro may do both", lmCan("pdf", LM_LEVEL.PRO) && lmCan("costs", LM_LEVEL.PRO), true);

  /* pdfAllowed() is the browser's half of the same answer, and it fails closed: the file
     that decides is assets/paywall.js, and a page that lost it gets a refusal rather than
     a document. */
  eq("with no paywall on the page at all, the answer is no",
    loadPdf().pdfAllowed(), false);
  eq("the export alone is not enough — the amounts in it are Pro too",
    loadPdf({ allow: { pdf: true } }).pdfAllowed(), false);
  eq("nor are the amounts alone",
    loadPdf({ allow: { costs: true } }).pdfAllowed(), false);
  eq("both, and only both", loadPdf({ allow: { pdf: true, costs: true } }).pdfAllowed(), true);

  /* And the refusal is a document that was never built. pdfFill() is handed a real
     project and a document element that starts visible; what comes back is `false` and an
     element still hidden, with nothing written into it. */
  const slot = (extra) => ({ textContent: "4 500,00 zł", innerHTML: "<tr><td>Klej</td></tr>",
    hidden: false, ...extra });
  const filled = { rows: slot(), total: slot(), gross: slot() };
  const doc = {
    hidden: false,
    dataset: {},
    querySelector: (sel) => (sel === '[data-pdf="rows"]' ? filled.rows : null),
    querySelectorAll: (sel) => (sel === "[data-pdf]"
      ? [filled.rows, filled.total, filled.gross] : [filled.total, filled.gross]),
  };
  const refused = loadPdf({ allow: { pdf: false, costs: false }, doc });
  eq("pdfFill() refuses for a level that may not export", refused.pdfFill("p1", { type: "investor" }), false);
  eq("and leaves the document hidden", doc.hidden, true);

  /* Hiding it is not enough. The document is markup that stays on the page between
     prints, so one filled in while the account was Pro is still holding every row and
     every amount after the plan lapses or somebody signs out in another tab. */
  eq("the table is emptied", filled.rows.innerHTML, "");
  eq("so is the total", filled.total.textContent, "");
  eq("and the investor gross", filled.gross.textContent, "");
  eq("and every row of the document is taken off the page", filled.total.hidden, true);

  check("the redraw on a session change empties it too",
    read("assets/pdf-export.js")
      .includes('document.addEventListener("lm-session", () => { if (!pdfAllowed()) pdfClear(); })'));

  const src = read("assets/pdf-export.js");
  check("the flow asks before it writes anything",
    /if \(!pdfAllowed\(\)\) \{\s*[\r\n]+\s*pdfClear\(\);\s*[\r\n]+\s*return false;/.test(src));
  // Two guards on one button on purpose: the first is the path a visitor takes, the
  // second is the same function called from a console with the form already on screen.
  check("the submit listener asks twice — once before the document, once before printing",
    (src.match(/if \(!pdfAllowed\(\)\) return;/g) || []).length >= 2);
  check("and the print dialog is never opened before the second one",
    src.indexOf("if (!pdfAllowed()) return;") < src.indexOf("window.print()"));

  /* The markup half: the configurator ships shut and the wall ships beside it, both from
     the first paint. A form that is drawn open and then closed by a script is a form that
     was on the screen. */
  for (const lang of LANGS) {
    const { main } = projectsMain(lang, tr(lang), ["TILES"], FEATURES);
    check(`${lang}: the wall is in the page`, main.includes('id="pdf-gate"'));
    check(`${lang}: the configurator is wrapped and hidden`,
      main.includes('<div id="pdf-tool" hidden>'));
    check(`${lang}: the wall names the export`, main.includes(tr(lang)("feat_pdf_t")));
    check(`${lang}: and says what it is`, main.includes(tr(lang)("feat_pdf_d")));
  }

  /* /kosztorys/'s own print button is the second way to a PDF on this site, and it asks
     the same question. */
  const ui = read("assets/workspace-ui.js");
  check("the print button on /kosztorys/ asks before it prints",
    ui.includes("if (wsCanPdf()) window.print()"));
  check("and wsCanPdf() needs both halves, like pdfAllowed()",
    /const wsCanPdf = \(\) => wsCanCost\(\) &&[\s\S]{0,80}pwAllows\("pdf"\)/.test(ui));
}

/* ------------------------------------------------------------------ report */

console.log(`\npdf export: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
