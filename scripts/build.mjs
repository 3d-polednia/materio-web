#!/usr/bin/env node
/* LiczMat website — the page generator.
 *
 *   node scripts/build.mjs            build everything
 *   node scripts/build.mjs --check    validate the dictionaries and exit
 *
 * No package.json, no dependencies, no node_modules: plain Node reading the same
 * assets/i18n.js and assets/calculators.js the browser used to load, so a calculator
 * or a translation is authored exactly once.
 *
 * What it writes (everything else in the repo is hand-authored):
 *   index.html, <lang>/index.html
 *   <section>/index.html and <section>/<slug>/index.html for calculators and guides
 *   assets/i18n.<lang>.js         one flat dictionary per language
 *   sitemap.xml
 *
 * The worked example on every calculator page is produced by running the real engine
 * over the form's default values. It cannot drift from the code: if the engine changes,
 * the number on the page changes with the next build.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASE, LANGS, DEFAULT_LANG, HREFLANG, SECTION, GUIDES, CALC_SLUG, URL_APP, URL_SHARE,
  URL_DASHBOARD, RETIRED_LANGS,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores, urlMaterials,
  urlProjects, urlEstimate, urlAndroid, urlCookies, urlClients, urlJobs, urlQuotes,
  urlCalendar,
} from "../src/site.mjs";
import {
  livePaths, validateIA, validateCalcHub, accountLevelKeys, HOME_DOORS, CALC_CATEGORIES,
  route, STATUS, navRoutes, ROUTES, LEVEL, LEVEL_ORDER,
} from "../src/ia.mjs";
import { validateTokens } from "../src/tokens.mjs";
import { FLAG, LANG_NAME } from "../src/flags.mjs";
import { DEFAULT_CURRENCY } from "../src/currency.mjs";
import { page, calcIcon } from "../src/template.mjs";
import {
  homeMain, calcHubMain, calcPageMain, guideIndexMain, guideMain, storesMain,
  materialsMain, projectsMain, estimateMain, androidMain, cookiesMain, clientsMain, jobsMain,
  quotesMain, calendarMain,
  renderFormula, FAQ_KEYS,
} from "../src/pages.mjs";
import { CALC_META } from "../src/calc-meta.mjs";
import { appMain, shareMain, dashboardMain, dashboardKeys, appProKeys } from "../src/app-pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Cache-busting stamp for /assets/*. Bump it whenever a shipped asset changes. */
const STAMP = "20260819e";

/* ------------------------------------------------------------------ load sources */

/**
 * Evaluate a browser script that has no exports and hand back the globals we need.
 *
 * `file` may be a list, in which case they are evaluated as one scope, in order — which is
 * what the browser does with two classic <script> tags and what assets/calculators.js
 * needs from assets/units.js.
 */
function evalScript(file, returns) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  return new Function(`${src}\nreturn {${returns.join(",")}};`)();
}

const { I18N, LANGS: LANG_META_RAW } = evalScript("assets/i18n.js", ["I18N", "LANGS"]);

/**
 * What the browser gets to know about the languages: the code, the name in that language
 * and the flag, in the order the picker shows them. The flag travels with the entry so
 * /app/ and /p/, which build their picker at runtime, draw the same rows the generator
 * writes into every other page.
 */
const LANG_META = LANGS.map((code) => ({
  code,
  label: (LANG_META_RAW.find((l) => l.code === code) || {}).label || LANG_NAME[code],
  flag: FLAG[code],
}));
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);
const { CALCS, ENGINES, localizeRow, unitLabel } = evalScript(
  ["assets/units.js", "assets/calculators.js"],
  ["CALCS", "ENGINES", "localizeRow", "unitLabel"]);
/**
 * Session 21's permission table. assets/plan.js reads LM_LEVEL and lmAllows() from
 * assets/account.js, exactly as the browser does — the two are evaluated as one scope so
 * the shipped file is the one that is checked, not a copy of it.
 */
const { LM_FEATURES, LM_PLAN } = evalScript(
  ["assets/account.js", "assets/plan.js"], ["LM_FEATURES", "LM_PLAN"]);

const CATALOG = evalScript("assets/materials.js", [
  "MATERIALS", "MAT_CATS_USED", "materialsForCalc", "matName", "matNote", "primaryCalcFor",
]);

/** The merged dictionary: the base keys, the sub-page keys and the material names. */
const DICT = {};
for (const lang of LANGS) {
  DICT[lang] = {
    ...(I18N[lang] || {}),
    ...(I18N_PAGES[lang] || {}),
    ...(I18N_MATERIALS[lang] || {}),
  };
}

/**
 * What the page templates get to see of the catalogue. `src/pages.mjs` is plain ESM and
 * assets/materials.js is a browser script, so the bridge is built here rather than
 * imported: one object with the lookups the pages need, nothing else.
 */
const CAT = {
  all: CATALOG.MATERIALS,
  total: CATALOG.MATERIALS.length,
  categories: CATALOG.MAT_CATS_USED,
  byCategory: (c) => CATALOG.MATERIALS.filter((m) => m.c === c),
  countFor: (calcId) => CATALOG.materialsForCalc(calcId).length,
  primary: (m) => CATALOG.primaryCalcFor(m),
  name: (m, lang, t) => CATALOG.matName(m, lang, (k) => t(k)),
  note: (m, lang, t) => CATALOG.matNote(m, lang, (k) => t(k)),
  fold: (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
};

/* ------------------------------------------------------------------ validation */

const problems = [];

function validate() {
  const reference = Object.keys(DICT[DEFAULT_LANG]);

  for (const lang of LANGS) {
    if (!DICT[lang]) { problems.push(`language "${lang}" is missing entirely`); continue; }
    const missing = reference.filter((k) => !(k in DICT[lang]));
    const extra = Object.keys(DICT[lang]).filter((k) => !reference.includes(k));
    if (missing.length) problems.push(`${lang}: missing ${missing.length} key(s): ${missing.join(", ")}`);
    if (extra.length) problems.push(`${lang}: ${extra.length} key(s) absent from ${DEFAULT_LANG}: ${extra.join(", ")}`);
  }

  // Every calculator needs a slug and a "how we calculate" entry in every language.
  for (const calc of CALCS) {
    if (!CALC_SLUG[calc.id]) { problems.push(`calculator "${calc.id}" has no slug (src/site.mjs)`); continue; }
    if (!CALC_META[calc.id]) problems.push(`calculator "${calc.id}" has no formula (src/calc-meta.mjs)`);
    for (const lang of LANGS) {
      if (!CALC_SLUG[calc.id][lang]) problems.push(`calculator "${calc.id}" has no ${lang} slug`);
    }
    if (!(`note_${calc.id}` in DICT[DEFAULT_LANG])) problems.push(`calculator "${calc.id}" has no note_ key`);
  }
  for (const g of GUIDES) {
    for (const lang of LANGS) if (!g.slug[lang]) problems.push(`guide "${g.id}" has no ${lang} slug`);
  }

  // A formula must never use one word for two different things. "pokrycie = ..." next
  // to a field labelled "Powierzchnia" is fine; next to one labelled "Fläche" while the
  // identifier also renders as "Fläche" it is nonsense, and only shows up in that one
  // language. Compare the rendered identifiers with the rendered labels, per formula.
  for (const calc of CALCS) {
    const meta = CALC_META[calc.id];
    if (!meta) continue;
    for (const lang of LANGS) {
      const t = translator(lang);
      const lines = renderFormula(meta.formula, lang, t);
      const labels = new Set(calc.fields.map((f) => bareLabel(t(f.label)).toLowerCase()));
      for (const line of lines) {
        const m = line.match(/^\s*([^=<>≈]+?)\s*[=≈]/);
        if (!m) continue;
        const ident = m[1].trim().toLowerCase();
        if (labels.has(ident)) {
          problems.push(`${calc.id}/${lang}: formula defines "${m[1].trim()}" but a field is ` +
            `also called that — rename it in src/calc-meta.mjs`);
        }
      }
    }
  }

  // Every material needs a name in every language, and a calculator to open from the
  // catalogue page. A term key that nobody translated would otherwise render as "m_gres".
  for (const m of CATALOG.MATERIALS) {
    if (!(m.t in DICT[DEFAULT_LANG])) problems.push(`material "${m.id}" has no term key "${m.t}"`);
    if (m.layer && !(m.layer in DICT[DEFAULT_LANG])) problems.push(`material "${m.id}" has no layer key "${m.layer}"`);
    if (!CATALOG.primaryCalcFor(m)) problems.push(`material "${m.id}" (kind "${m.k}") has no primary calculator`);
    if (!CATALOG.MAT_CATS_USED.includes(m.c)) problems.push(`material "${m.id}" has unknown category "${m.c}"`);
  }
  for (const c of CATALOG.MAT_CATS_USED) {
    if (!(`cat_${c}` in DICT[DEFAULT_LANG])) problems.push(`category "${c}" has no cat_ key`);
  }
  const matIds = new Set();
  for (const m of CATALOG.MATERIALS) {
    if (matIds.has(m.id)) problems.push(`duplicate material id "${m.id}"`);
    matIds.add(m.id);
  }

  // The architecture itself: levels, the page tree, the navigation, the user flows.
  problems.push(...validateIA());

  // The three access levels are rendered from ACCOUNT_LEVELS, and a key nobody wrote
  // would render as "acc_pro_3" on the account page in that one language.
  for (const key of accountLevelKeys()) {
    for (const lang of LANGS) {
      if (!(key in DICT[lang])) problems.push(`account level key "${key}" is missing in ${lang}`);
    }
  }

  // The dashboard renders every one of its strings through t() in the browser, so a key
  // nobody translated does not fail any of the checks above — it ships as the literal
  // "dash_recent_empty" on the page, in that one language only.
  for (const key of dashboardKeys()) {
    for (const lang of LANGS) {
      if (!(key in DICT[lang])) problems.push(`dashboard key "${key}" is missing in ${lang}`);
    }
  }

  // Session 21: the Free/Pro model. The permission table is authored in assets/plan.js
  // because the browser has to read it, so nothing in src/ia.mjs can validate it — this
  // is where the two are made to agree. A Pro module that no route declares, or a route
  // at LEVEL.PRO that the table forgot, would ship as a page nobody can reach or a gate
  // nobody can see.
  {
    const ids = new Set();
    for (const f of LM_FEATURES) {
      if (ids.has(f.id)) problems.push(`feature "${f.id}" is declared twice`);
      ids.add(f.id);
      if (!LEVEL_ORDER.includes(f.level)) {
        problems.push(`feature "${f.id}" has level "${f.level}", which is not a level`);
      }
      if (f.route && !route(f.route)) {
        problems.push(`feature "${f.id}" points at route "${f.route}", which does not exist`);
      }
      if (f.route && f.level === LEVEL.PRO && route(f.route).level !== LEVEL.PRO) {
        problems.push(`feature "${f.id}" is PRO but route "${f.route}" is not`);
      }
      if (f.level === LEVEL.PRO && !f.key) {
        problems.push(`feature "${f.id}" is PRO and has no copy — a gate with no name`);
      }
    }
    for (const r of ROUTES) {
      if (r.level !== LEVEL.PRO) continue;
      // A view is a state of its parent page, not a module of its own: /klienci/?id=<id>
      // is the clients feature seen from the inside, and giving it a second entry in the
      // table would mean two rows to keep in step for one thing the visitor can do.
      if (r.view) continue;
      if (!LM_FEATURES.some((f) => f.route === r.id)) {
        problems.push(`route "${r.id}" is PRO and no feature in assets/plan.js covers it`);
      }
    }
    if (LM_PLAN.PRO !== "premium" || LM_PLAN.FREE !== "free") {
      problems.push(`LM_PLAN no longer matches the sync contract: ${JSON.stringify(LM_PLAN)}`);
    }
    // The Pro tab is translated in the browser like the rest of /app/, so a key nobody
    // wrote ships as the literal "feat_quotes_d" in that one language.
    for (const key of appProKeys(LM_FEATURES)) {
      for (const lang of LANGS) {
        if (!(key in DICT[lang])) problems.push(`Pro key "${key}" is missing in ${lang}`);
      }
    }
  }

  // The calculator hub: every calculator in exactly one of chapter XI's categories, and
  // a shortlist the guides actually back up. validateIA() cannot see CALCS or GUIDES.
  problems.push(...validateCalcHub(CALCS, GUIDES));

  // The hub's category names and the line under each of them. A missing one would ship
  // as the literal "cc_tiling_d" at the top of a group.
  for (const cat of CALC_CATEGORIES) {
    for (const key of [cat.key, `${cat.key}_d`]) {
      if (!(key in DICT[DEFAULT_LANG])) problems.push(`calculator category "${cat.id}" has no "${key}" in the dictionary`);
    }
  }

  // Each door of the home page needs its own strings. t() falls back to the key name, so
  // without this a missing translation ships as the literal "door_pro_q" on the front
  // page. Checking the reference language is enough — the loop above requires the other
  // three to carry exactly the same keys.
  for (const door of HOME_DOORS) {
    const keys = [`${door.key}_t`, `${door.key}_q`, `${door.key}_d`, `lvl_${door.level}`];
    if (route(door.route) && route(door.route).status === STATUS.LIVE) keys.push(`${door.key}_go`);
    for (const key of keys) {
      if (!(key in DICT[DEFAULT_LANG])) problems.push(`home door "${door.id}" has no "${key}" in the dictionary`);
    }
  }

  // The design system: the two themes in step, every var() defined, no literal
  // colour, radius or duration in a rule that should be spending a token.
  problems.push(...validateTokens());

  // Two pages must never claim the same URL.
  const seen = new Map();
  for (const lang of LANGS) {
    const urls = [urlHome(lang), urlCalcIndex(lang), urlGuideIndex(lang), urlStores(lang), urlMaterials(lang), urlProjects(lang), urlEstimate(lang), urlAndroid(lang), urlCookies(lang), urlClients(lang), urlJobs(lang), urlQuotes(lang), urlCalendar(lang)]
      .concat(CALCS.map((c) => urlCalc(lang, c.id)))
      .concat(GUIDES.map((g) => urlGuide(lang, g)));
    for (const u of urls) {
      if (seen.has(u)) problems.push(`URL collision: ${u} (${seen.get(u)} and ${lang})`);
      seen.set(u, lang);
    }
  }
}

/* ------------------------------------------------------------------ helpers */

/** Translator bound to one language; falls back en -> pl exactly like the browser does. */
const translator = (lang) => (key) =>
  (DICT[lang] && DICT[lang][key]) || DICT.en[key] || DICT[DEFAULT_LANG][key] || key;

/** "Powierzchnia (m²)" -> "Powierzchnia" — the form a field label takes inside a formula. */
const bareLabel = (label) => String(label).replace(/\s*\([^)]*\)\s*$/, "").trim();

function write(relPath, contents) {
  const full = p(relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
  written.push(relPath);
}
const written = [];

/** Map of every language's URL for one logical page, for hreflang and the switcher. */
const alternatesFor = (fn) => Object.fromEntries(LANGS.map((l) => [l, fn(l)]));

/**
 * Every page carrying a calculator form needs the engines and the material picker — and,
 * since session 14, the one-line note that this tool was used, which is what the
 * dashboard's "ostatnio używane narzędzia" reads.
 */
const CALC_SCRIPTS = [
  "/assets/units.js", "/assets/calculators.js", "/assets/materials.js", "/assets/materials-ui.js",
  "/assets/workspace.js", "/assets/workspace-ui.js", "/assets/recent.js",
];

/**
 * The workspace pages need the store and its interface, but no calculation engine — and
 * since session 16 they print saved results, so they need the words that go next to a
 * number (assets/units.js), which is the reason that file exists apart from the engines.
 */
const WS_SCRIPTS = ["/assets/units.js", "/assets/workspace.js", "/assets/workspace-ui.js"];

/**
 * /klienci/ (session 22). The client store, its page, and the two files it reads:
 * assets/workspace.js for the projects a client is linked to and what they cost, and
 * assets/plan.js for the one question chapter XXV asks — is this visitor on Pro. No
 * engine and no catalogue: the page prints saved figures and calculates nothing.
 *
 * assets/account.js is already on every page (src/template.mjs) and plan.js reads its
 * globals, so the order below is the order the browser needs.
 */
const CRM_SCRIPTS = [
  "/assets/workspace.js", "/assets/plan.js", "/assets/crm.js", "/assets/crm-ui.js",
];

/**
 * /zlecenia/ (session 23). The same four files with the job page's own interface in place
 * of the client one: the store is shared (assets/crm.js holds both collections), and the
 * job screen reads a project's costs through assets/workspace.js exactly as the client
 * screen does. No engine and no catalogue — the page prints saved figures and one typed
 * amount, and calculates nothing.
 */
const JOBS_SCRIPTS = [
  "/assets/workspace.js", "/assets/plan.js", "/assets/crm.js", "/assets/jobs-ui.js",
];

/**
 * /wyceny/ (session 24). The same four files again, with the quote page's own interface:
 * the store is shared (assets/crm.js holds all three collections), and three of chapter
 * XXII's five figures are read out of a project through assets/workspace.js — the quote
 * copies none of them. No engine and no catalogue: the page multiplies a quantity by a
 * rate and adds a percentage, and calculates nothing else.
 */
const QUOTES_SCRIPTS = [
  "/assets/workspace.js", "/assets/plan.js", "/assets/crm.js", "/assets/quotes-ui.js",
];

/**
 * /terminarz/ (session 25). The same four files once more. assets/workspace.js is still
 * here even though the terminarz counts no money: assets/crm.js reads the workspace
 * through its globals — crmProjectId() and the job's own costs — and loading the store
 * without it would leave those answering for a workspace that is not there.
 */
const CALENDAR_SCRIPTS = [
  "/assets/workspace.js", "/assets/plan.js", "/assets/crm.js", "/assets/schedule-ui.js",
];

/* ------------------------------------------------------------------ worked examples */

/**
 * Run one engine over its own default values so the page can show a real result.
 * Returns the same shape the browser renders, already localized.
 */
function workedExample(calc, lang, t) {
  const input = Object.fromEntries(calc.fields.map((f) => [f.k, f.def]));
  const res = ENGINES[calc.engine](input);
  if (res.err) throw new Error(`calculator "${calc.id}" fails on its own defaults: ${res.err}`);

  const locale = { pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-US" }[lang];
  const number = (v) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);

  // The engines emit numbers as |n:…| tokens; the language is only known here.
  const rows = (res.rows || []).map(([k, v]) => [t(k), localizeRow(v, locale, t)]);

  // The unit is inflected for the count the page opens on — "4 worki", not "4 worków".
  return { tobuy: number(res.tobuy), unit: unitLabel(res.unit, res.tobuy, lang, t), rows };
}

/* ------------------------------------------------------------------ schema.org */

/**
 * The home page is a website, not an Android app.
 *
 * It used to declare itself a MobileApplication with a Play Store downloadUrl — accurate
 * when the page was an advert for the app, wrong since session 6 made it the way into the
 * web product. The MobileApplication entity still exists, on /aplikacja/, which is the
 * page that is actually about the app.
 */
const siteLd = (lang, t) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LiczMat",
  url: BASE + urlHome(lang),
  inLanguage: lang,
  description: t("meta_desc"),
  image: `${BASE}/assets/og-image.jpg`,
  // Free in every currency, so the visitor's own choice — which only the browser knows —
  // cannot make this wrong.
  offers: { "@type": "Offer", price: "0", priceCurrency: DEFAULT_CURRENCY[lang] },
  publisher: { "@type": "Organization", name: "LiczMat", url: BASE + "/" },
});

const faqLd = (t) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_KEYS.map((n) => ({
    "@type": "Question",
    name: t(`faq_q${n}`),
    acceptedAnswer: { "@type": "Answer", text: t(`faq_a${n}`) },
  })),
});

/** A calculator page is a small web app; declaring it as one is accurate and indexable. */
const calcLd = (calc, lang, t) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: t(`c_${calc.id}_t`),
  description: t(`c_${calc.id}_d`),
  url: BASE + urlCalc(lang, calc.id),
  applicationCategory: "UtilitiesApplication",
  browserRequirements: "Requires JavaScript",
  inLanguage: lang,
  isPartOf: { "@type": "WebSite", name: "LiczMat", url: BASE + "/" },
  offers: { "@type": "Offer", price: "0", priceCurrency: DEFAULT_CURRENCY[lang] },
});

/* ------------------------------------------------------------------ emit */

function buildDictionaries() {
  // One bundle carrying every language, for the two pages that translate in place.
  write("assets/i18n.all.js", `/* Generated by scripts/build.mjs — do not edit.
   Every language in one file, for the noindex pages (/app/, /p/) that have no
   per-language URLs and swap text in the DOM instead of navigating. */
const LANGS = ${JSON.stringify(LANG_META)};
const I18N = ${JSON.stringify(DICT)};
`);

  for (const lang of LANGS) {
    const body = `/* Generated by scripts/build.mjs — do not edit.
   Source: assets/i18n.js + assets/i18n-pages.js. Only the "${lang}" language is here;
   the language switcher navigates to the other languages' URLs instead of swapping text. */
const LANGS = ${JSON.stringify(LANG_META)};
const I18N = ${JSON.stringify({ [lang]: DICT[lang] })};
`;
    write(`assets/i18n.${lang}.js`, body);
  }
}

function buildHome() {
  const alt = alternatesFor(urlHome);
  for (const lang of LANGS) {
    const t = translator(lang);
    write(join(urlHome(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: t("meta_title"),
      description: t("meta_desc"),
      path: urlHome(lang),
      alternates: alt,
      main: homeMain(lang, t, CALCS, CAT),
      jsonld: [siteLd(lang, t), {
        "@context": "https://schema.org", "@type": "Organization",
        name: "LiczMat", url: BASE + "/", logo: `${BASE}/assets/icon-512.png`,
      }, faqLd(t)],
      // No scripts of its own since session 6: the home page leads to the calculators
      // instead of carrying one, so the engines, the catalogue, the material picker and
      // the workspace load on the pages that use them. Everything left on it — the
      // menu, the pickers, the theme switch, the consent banner — is in main.js, which
      // every page gets.
    }));
  }
}

function buildCalculatorPages() {
  const hubAlt = alternatesFor(urlCalcIndex);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = calcHubMain(lang, t, CALCS, GUIDES);
    write(join(urlCalcIndex(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("calchub_title")} — LiczMat`,
      description: t("calchub_meta"),
      path: urlCalcIndex(lang),
      alternates: hubAlt,
      main,
      jsonld: [ld, {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: t("calchub_title"),
        numberOfItems: CALCS.length,
        itemListElement: CALCS.map((c, i) => ({
          "@type": "ListItem", position: i + 1,
          name: t(`c_${c.id}_t`), url: BASE + urlCalc(lang, c.id),
        })),
      }],
      // The hub's search and category filter. Everything it filters is already in the
      // markup, so the page is complete without it — see assets/calc-hub.js.
      scripts: ["/assets/calc-hub.js"],
    }));
  }

  for (const calc of CALCS) {
    const alt = alternatesFor((l) => urlCalc(l, calc.id));
    for (const lang of LANGS) {
      const t = translator(lang);
      const name = t(`c_${calc.id}_t`);
      const description = t("calc_meta_pattern")
        .replace("{name}", name)
        .replace("{desc}", t(`c_${calc.id}_d`));
      const { main, ld } = calcPageMain(calc, lang, t, {
        example: workedExample(calc, lang, t),
        formula: renderFormula(CALC_META[calc.id].formula, lang, t),
        materials: CAT.countFor(calc.id),
        guides: GUIDES,
      });
      write(join(urlCalc(lang, calc.id), "index.html").replace(/^\//, ""), page({
        lang, t, stamp: STAMP,
        title: `${name} — ${t("calchub_title")} | LiczMat`,
        description,
        path: urlCalc(lang, calc.id),
        alternates: alt,
        main,
        jsonld: [ld, calcLd(calc, lang, t)],
        scripts: CALC_SCRIPTS,
      }));
    }
  }
}

function buildGuides() {
  const indexAlt = alternatesFor(urlGuideIndex);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = guideIndexMain(lang, t, GUIDES);
    write(join(urlGuideIndex(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("guides_title")} — LiczMat`,
      description: t("guides_meta"),
      path: urlGuideIndex(lang),
      alternates: indexAlt,
      main, jsonld: [ld],
    }));
  }

  for (const guide of GUIDES) {
    const alt = alternatesFor((l) => urlGuide(l, guide));
    for (const lang of LANGS) {
      const t = translator(lang);
      const { main, ld } = guideMain(guide, lang, t);
      write(join(urlGuide(lang, guide), "index.html").replace(/^\//, ""), page({
        lang, t, stamp: STAMP,
        title: `${t(`g_${guide.id}_t`)} — LiczMat`,
        description: t(`g_${guide.id}_d`),
        path: urlGuide(lang, guide),
        alternates: alt,
        main, jsonld: ld,
      }));
    }
  }
}

function buildMaterials() {
  const alt = alternatesFor(urlMaterials);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = materialsMain(lang, t, CAT);
    write(join(urlMaterials(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("matpage_title")} — LiczMat`,
      description: t("matpage_meta"),
      path: urlMaterials(lang),
      alternates: alt,
      main, jsonld: ld,
      scripts: ["/assets/materials.js", "/assets/materials-ui.js"],
    }));
  }
}

function buildCookiesPage() {
  const alt = alternatesFor(urlCookies);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = cookiesMain(lang, t);
    write(join(urlCookies(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("cookiepage_title")} \u2014 LiczMat`,
      description: t("cookiepage_meta"),
      path: urlCookies(lang),
      alternates: alt,
      main, jsonld: [ld],
    }));
  }
}

function buildAndroidPage() {
  const alt = alternatesFor(urlAndroid);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = androidMain(lang, t, CALCS, CAT);
    write(join(urlAndroid(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("apppage_title")} \u2014 LiczMat`,
      description: t("apppage_meta"),
      path: urlAndroid(lang),
      alternates: alt,
      main, jsonld: ld,
    }));
  }
}

function buildWorkspacePages() {
  const projAlt = alternatesFor(urlProjects);
  const estAlt = alternatesFor(urlEstimate);
  for (const lang of LANGS) {
    const t = translator(lang);

    const projects = projectsMain(lang, t, CAT.categories);
    write(join(urlProjects(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("wspage_title")} \u2014 LiczMat`,
      description: t("wspage_meta"),
      path: urlProjects(lang),
      alternates: projAlt,
      main: projects.main, jsonld: [projects.ld],
      // A saved line names the calculator it came from (session 16, chapter XV) and links
      // back to it. The script draws that line and has no site map, so the build hands it
      // this page's own language's address for every calculator \u2014 one short map, written
      // before the script that reads it.
      headExtra: `<script>window.LM_PROJ = ${JSON.stringify({
        calcs: Object.fromEntries(CALCS.map((c) => [c.id, urlCalc(lang, c.id)])),
        // The shop aisles, for the material the visitor edits or types in by hand
        // (session 18). The page does not load assets/materials.js — 12 kB of catalogue
        // to render a fifteen-item <select> — so the build hands it the list instead.
        aisles: CAT.categories,
      })};</script>`,
      scripts: WS_SCRIPTS,
    }));

    const estimate = estimateMain(lang, t);
    write(join(urlEstimate(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("estpage_title")} \u2014 LiczMat`,
      description: t("estpage_meta"),
      path: urlEstimate(lang),
      alternates: estAlt,
      main: estimate.main, jsonld: estimate.ld,
      scripts: WS_SCRIPTS,
    }));
  }
}

/**
 * /klienci/ — the client list of LiczMat Pro. Session 22, chapter XX.
 *
 * The page has two screens in one file, exactly like /projekty/: the index, and one
 * client at ?id=<clientId>. Only the frame is written here; every figure on it comes out
 * of the browser's own store.
 */
function buildClientsPages() {
  const alt = alternatesFor(urlClients);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = clientsMain(lang, t);
    write(join(urlClients(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("clipage_title")} \u2014 LiczMat`,
      description: t("clipage_meta"),
      path: urlClients(lang),
      alternates: alt,
      main, jsonld: [ld],
      // A client's projects link back to /projekty/?id=<id>, and the script has no site
      // map — so the build hands it this page's own language's address for that page.
      // A client's projects link back to /projekty/?id=<id> and their jobs to
      // /zlecenia/?id=<id>; the script has no site map, so the build hands it this
      // language's address for both.
      headExtra: `<script>window.LM_CRM = ${JSON.stringify({
        projects: urlProjects(lang), jobs: urlJobs(lang),
      })};</script>`,
      scripts: CRM_SCRIPTS,
    }));
  }
}

/**
 * /zlecenia/ — the job list of LiczMat Pro. Session 23, chapter XXI.
 *
 * Two screens in one file again: the index, and one job at ?id=<jobId>. Only the frame is
 * written here; the client, the project, the status and the money all come out of the
 * browser's own store.
 */
function buildJobsPages() {
  const alt = alternatesFor(urlJobs);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = jobsMain(lang, t);
    write(join(urlJobs(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("jobpage_title")} \u2014 LiczMat`,
      description: t("jobpage_meta"),
      path: urlJobs(lang),
      alternates: alt,
      main, jsonld: [ld],
      headExtra: `<script>window.LM_JOBS = ${JSON.stringify({
        projects: urlProjects(lang), clients: urlClients(lang),
      })};</script>`,
      scripts: JOBS_SCRIPTS,
    }));
  }
}

/**
 * /wyceny/ — the quotes of LiczMat Pro. Session 24, chapter XXII.
 *
 * Two screens in one file again: the index, and one quote at ?id=<quoteId>. Only the frame
 * is written here; the material, the other costs, the labour, the margin and the total are
 * all computed in the browser, and three of the five come out of a project rather than out
 * of the quote.
 */
function buildQuotesPages() {
  const alt = alternatesFor(urlQuotes);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = quotesMain(lang, t);
    write(join(urlQuotes(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("quopage_title")} \u2014 LiczMat`,
      description: t("quopage_meta"),
      path: urlQuotes(lang),
      alternates: alt,
      main, jsonld: [ld],
      // A quote links back to its project, and — through it — to the job and the client
      // chapter XXIV's path runs through. The script has no site map, so the build hands
      // it this language's address for all three.
      headExtra: `<script>window.LM_QUOTES = ${JSON.stringify({
        projects: urlProjects(lang), jobs: urlJobs(lang), clients: urlClients(lang),
      })};</script>`,
      scripts: QUOTES_SCRIPTS,
    }));
  }
}

/**
 * /terminarz/ — the schedule of LiczMat Pro. Session 25, chapter XXIII.
 *
 * One page per language and no view beside it: a row here opens the job it belongs to, on
 * /zlecenia/. The build writes the five bucket headings and five empty lists; the rows,
 * the counts and today's date are all filled in by the browser, because the jobs are in
 * one browser and nothing about them can be server-rendered.
 */
function buildCalendarPages() {
  const alt = alternatesFor(urlCalendar);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = calendarMain(lang, t);
    write(join(urlCalendar(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("calpage_title")} \u2014 LiczMat`,
      description: t("calpage_meta"),
      path: urlCalendar(lang),
      alternates: alt,
      main, jsonld: [ld],
      // Every row links to the job it stands for. The script has no site map, so the
      // build hands it this language's address for the page that owns those rows.
      headExtra: `<script>window.LM_CAL = ${JSON.stringify({
        jobs: urlJobs(lang), clients: urlClients(lang), projects: urlProjects(lang),
      })};</script>`,
      scripts: CALENDAR_SCRIPTS,
    }));
  }
}

function buildStores() {
  const alt = alternatesFor(urlStores);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = storesMain(lang, t);
    write(join(urlStores(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("storespage_title")} — LiczMat`,
      description: t("storespage_meta"),
      path: urlStores(lang),
      alternates: alt,
      main, jsonld: [ld],
      scripts: ["/assets/stores.js"],
    }));
  }
}

/**
 * The two noindex pages. One copy each, in every language at once — see src/app-pages.mjs.
 *
 * /p/<token> cannot be a real directory (the token is unbounded), and GitHub Pages has
 * no rewrite rules, so 404.html forwards /p/<token> to /p/?t=<token>. Both shapes work.
 */
function buildPrivatePages() {
  const t = translator(DEFAULT_LANG);
  // The navigation, per language, for the pages that have no language of their own. They
  // render DEFAULT_LANG's addresses and assets/i18n-runtime.js swaps in the right ones on
  // `langchange`, keyed by the `data-nav-route` src/template.mjs writes on each link.
  // Before this, /app/ carried one hard-coded Polish link because a second one could not
  // have been right in German — the owner reported the result: signing in emptied the menu.
  const navData = Object.fromEntries([
    ...navRoutes("header"),
    // The Pro modules that have been built. Their cards on /app/ link to them
    // (src/pro.mjs), and /app/ has no language of its own to derive an address from.
    ...LM_FEATURES
      .filter((f) => f.level === LEVEL.PRO && f.route && route(f.route)
        && route(f.route).status === STATUS.LIVE)
      .map((f) => route(f.route)),
  ]
    .filter((r) => r.localized)
    .map((r) => [r.id, alternatesFor(r.path)]));
  const navScript = `<script>window.LM_NAV = ${JSON.stringify(navData).replace(/</g, "\\u003c")};</script>`;

  const common = {
    lang: DEFAULT_LANG, t, stamp: STAMP, bare: true, noindex: true,
    alternates: {}, moduleScripts: true,
  };

  write("app/index.html", page({
    ...common,
    title: `${t("app_title")} — LiczMat`,
    description: t("app_lead"),
    path: URL_APP,
    main: appMain(t, LM_FEATURES),
    headExtra: navScript,
    // workspace.js is a classic script on purpose: /app/ reads the browser workspace
    // through its globals, which a module's own scope would hide.
    // plan.js before app.js: the Pro tab reads the permission table and the plan status
    // through its globals, which a module's own scope would hide.
    classicScripts: ["/assets/workspace.js", "/assets/plan.js"],
    scripts: ["/assets/app.js"],
  }));

  // The dashboard has no per-language URL either, so it cannot render a link to
  // /kalkulatory/ as HTML and be right in German. The build hands it every address it
  // might need, per language, plus the icon of each calculator — the same calcIcon() the
  // hub uses, so a tile on the dashboard cannot drift from the tile on /kalkulatory/.
  const dashData = {
    urls: {
      calculators: alternatesFor(urlCalcIndex),
      projects: alternatesFor(urlProjects),
      estimate: alternatesFor(urlEstimate),
    },
    calcs: Object.fromEntries(CALCS.map((c) => [c.id, {
      url: alternatesFor((l) => urlCalc(l, c.id)),
      icon: calcIcon(c.id),
    }])),
  };

  write("app/dashboard/index.html", page({
    ...common,
    title: `${t("dash_title")} — LiczMat`,
    description: t("dash_lead"),
    path: URL_DASHBOARD,
    main: dashboardMain(t),
    // A page's own data, before any script that reads it. JSON.stringify cannot emit a
    // literal "</script>"; the icons are SVG markup, so the escape is not optional.
    headExtra: `${navScript}\n<script>window.LM_DASH = ${JSON.stringify(dashData).replace(/</g, "\\u003c")};</script>`,
    // Classic scripts, in this order and not modules: the dashboard reads the workspace
    // and the recents through their globals, which a module's own scope would hide.
    classicScripts: [
      "/assets/units.js", "/assets/workspace.js", "/assets/recent.js", "/assets/dashboard.js",
    ],
  }));

  write("p/index.html", page({
    ...common,
    title: `${t("share_title")} — LiczMat`,
    description: t("share_lead"),
    path: URL_SHARE,
    main: shareMain(t),
    scripts: ["/assets/share.js"],
  }));
}

/**
 * sitemap.xml, with the hreflang set repeated on every entry.
 *
 * The HTML already carries <link rel="alternate" hreflang>, which is what Google reads
 * first; declaring the same set in the sitemap is the second supported channel and the
 * one that survives a page being fetched from cache. Every alternate group has to list
 * every member of the group, including the page itself — a one-way declaration is
 * ignored — so each URL carries the whole map plus x-default.
 */
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  const add = (loc, priority, changefreq, alternates) =>
    urls.push({ loc, priority, changefreq, alternates });

  for (const lang of LANGS) {
    add(urlHome(lang), lang === DEFAULT_LANG ? "1.0" : "0.8", "monthly", alternatesFor(urlHome));
    add(urlCalcIndex(lang), "0.9", "monthly", alternatesFor(urlCalcIndex));
    add(urlMaterials(lang), "0.8", "monthly", alternatesFor(urlMaterials));
    add(urlAndroid(lang), "0.8", "monthly", alternatesFor(urlAndroid));
    add(urlProjects(lang), "0.6", "monthly", alternatesFor(urlProjects));
    add(urlCookies(lang), "0.3", "yearly", alternatesFor(urlCookies));
    add(urlEstimate(lang), "0.7", "monthly", alternatesFor(urlEstimate));
    // Indexable, like every other page that describes what LiczMat does: what a crawler
    // sees is the module's name, what it is for and that it belongs to LiczMat Pro —
    // never a client, because every client row is in one browser's own storage.
    add(urlClients(lang), "0.5", "monthly", alternatesFor(urlClients));
    add(urlJobs(lang), "0.5", "monthly", alternatesFor(urlJobs));
    add(urlQuotes(lang), "0.5", "monthly", alternatesFor(urlQuotes));
    add(urlCalendar(lang), "0.5", "monthly", alternatesFor(urlCalendar));
    add(urlGuideIndex(lang), "0.7", "monthly", alternatesFor(urlGuideIndex));
    add(urlStores(lang), "0.7", "monthly", alternatesFor(urlStores));
    for (const c of CALCS) add(urlCalc(lang, c.id), "0.8", "monthly", alternatesFor((l) => urlCalc(l, c.id)));
    for (const g of GUIDES) add(urlGuide(lang, g), "0.6", "monthly", alternatesFor((l) => urlGuide(l, g)));
  }
  add("/privacy-policy.html", "0.3", "yearly");

  // /app/ and /p/ stay out: they are noindex, and a sitemap entry contradicts that.
  const alternateLinks = (map) => {
    if (!map) return "";
    return "\n" + LANGS
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${BASE}${map[l]}"/>`)
      .concat([`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${map[DEFAULT_LANG]}"/>`])
      .join("\n");
  };

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${alternateLinks(u.alternates)}
  </url>`).join("\n")}
</urlset>
`;
  write("sitemap.xml", body);
}

/**
 * Remove generated directories so a renamed slug cannot leave an orphan page behind.
 *
 * The six languages LiczMat dropped on 2026-08-12 are swept too: their pages were
 * generated into /cs/, /sk/ … and nothing else would ever delete them. 404.html sends
 * whatever still links to them to the home page.
 */
function clean() {
  const dirs = new Set(RETIRED_LANGS);
  for (const lang of LANGS) {
    if (lang !== DEFAULT_LANG) { dirs.add(lang); continue; }
    for (const section of Object.values(SECTION)) dirs.add(section[lang]);
  }
  dirs.add("app");
  dirs.add("p");
  for (const d of dirs) {
    const full = p(d);
    if (existsSync(full)) rmSync(full, { recursive: true, force: true });
  }
  for (const lang of RETIRED_LANGS) {
    const bundle = p(`assets/i18n.${lang}.js`);
    if (existsSync(bundle)) rmSync(bundle, { force: true });
  }
}

/* ------------------------------------------------------------------ main */

validate();
if (problems.length) {
  console.error("Build aborted — the dictionaries or the site map are inconsistent:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  console.log(`OK: ${Object.keys(DICT[DEFAULT_LANG]).length} keys × ${LANGS.length} languages, ` +
    `${CALCS.length} calculators, ${GUIDES.length} guides.`);
  process.exit(0);
}

clean();
buildDictionaries();
buildHome();
buildCalculatorPages();
buildGuides();
buildMaterials();
buildAndroidPage();
buildCookiesPage();
buildWorkspacePages();
buildClientsPages();
buildJobsPages();
buildQuotesPages();
buildCalendarPages();
buildStores();
buildPrivatePages();
buildSitemap();

/**
 * The pages that were written have to be exactly the pages the architecture declares.
 *
 * src/ia.mjs is the inventory: every route, its access level and its place in the tree.
 * Without this check it would be a document, and a document drifts — a new page could
 * ship undeclared, or a declared page could quietly stop being built. Comparing the two
 * sets makes that a build failure instead.
 */
function checkAgainstIA() {
  const declared = livePaths(CALCS, GUIDES);
  const built = new Set(written.filter((f) => f.endsWith(".html")));
  const mismatches = [
    ...[...built].filter((f) => !declared.has(f)).map((f) => `built but not declared: ${f}`),
    ...[...declared].filter((f) => !built.has(f)).map((f) => `declared but not built: ${f}`),
  ];
  // The two hand-written pages are declared too; they are never overwritten, only checked.
  for (const f of ["privacy-policy.html", "404.html"]) {
    if (!existsSync(p(f))) mismatches.push(`hand-written page is missing: ${f}`);
  }
  if (mismatches.length) {
    console.error("Build aborted — the pages do not match src/ia.mjs:\n");
    for (const m of mismatches.sort()) console.error(`  - ${m}`);
    process.exit(1);
  }
  return declared.size;
}

const declared = checkAgainstIA();
const pages = written.filter((f) => f.endsWith(".html")).length;
console.log(`Built ${pages} pages and ${written.length - pages} assets ` +
  `(${LANGS.length} languages, ${CALCS.length} calculators, ${GUIDES.length} guides), stamp ${STAMP}.`);
console.log(`Architecture: ${declared} pages declared in src/ia.mjs, all present.`);
