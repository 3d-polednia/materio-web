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
  RETIRED_LANGS,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores, urlMaterials,
  urlProjects, urlEstimate, urlAndroid, urlCookies,
} from "../src/site.mjs";
import { livePaths, validateIA } from "../src/ia.mjs";
import { FLAG, LANG_NAME } from "../src/flags.mjs";
import { DEFAULT_CURRENCY } from "../src/currency.mjs";
import { page } from "../src/template.mjs";
import {
  homeMain, calcHubMain, calcPageMain, guideIndexMain, guideMain, storesMain,
  materialsMain, projectsMain, estimateMain, androidMain, cookiesMain, renderFormula, FAQ_KEYS,
} from "../src/pages.mjs";
import { CALC_META } from "../src/calc-meta.mjs";
import { appMain, shareMain } from "../src/app-pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Cache-busting stamp for /assets/*. Bump it whenever a shipped asset changes. */
const STAMP = "20260812b";

/* ------------------------------------------------------------------ load sources */

/** Evaluate a browser script that has no exports and hand back the globals we need. */
function evalScript(file, returns) {
  const src = readFileSync(p(file), "utf8");
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
const { CALCS, ENGINES, localizeRow } = evalScript("assets/calculators.js",
  ["CALCS", "ENGINES", "localizeRow"]);
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

  // Two pages must never claim the same URL.
  const seen = new Map();
  for (const lang of LANGS) {
    const urls = [urlHome(lang), urlCalcIndex(lang), urlGuideIndex(lang), urlStores(lang), urlMaterials(lang), urlProjects(lang), urlEstimate(lang), urlAndroid(lang), urlCookies(lang)]
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

/** Every page carrying a calculator form needs the engines and the material picker. */
const CALC_SCRIPTS = [
  "/assets/calculators.js", "/assets/materials.js", "/assets/materials-ui.js",
  "/assets/workspace.js", "/assets/workspace-ui.js",
];

/** The workspace pages need the store and its interface, but no calculation engine. */
const WS_SCRIPTS = ["/assets/workspace.js", "/assets/workspace-ui.js"];

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

  return { tobuy: number(res.tobuy), unit: t(res.unit), rows };
}

/* ------------------------------------------------------------------ schema.org */

const appLd = (lang, t) => ({
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "LiczMat",
  operatingSystem: "Android 7.0+",
  applicationCategory: "UtilitiesApplication",
  inLanguage: LANGS,
  url: BASE + urlHome(lang),
  downloadUrl: "https://play.google.com/store/apps/details?id=pl.materio.app",
  installUrl: "https://play.google.com/store/apps/details?id=pl.materio.app",
  image: `${BASE}/assets/og-image.jpg`,
  description: t("hero_lead"),
  // The app is free, so the currency only has to be a real one; the visitor's own choice
  // lives in the browser and cannot be known at build time.
  offers: { "@type": "Offer", price: "0", priceCurrency: DEFAULT_CURRENCY[lang] },
  author: { "@type": "Organization", name: "LiczMat" },
  publisher: { "@type": "Organization", name: "LiczMat" },
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
      jsonld: [appLd(lang, t), {
        "@context": "https://schema.org", "@type": "Organization",
        name: "LiczMat", url: BASE + "/", logo: `${BASE}/assets/icon-512.png`,
      }, faqLd(t)],
      scripts: CALC_SCRIPTS,
    }));
  }
}

function buildCalculatorPages() {
  const hubAlt = alternatesFor(urlCalcIndex);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = calcHubMain(lang, t, CALCS);
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

    const projects = projectsMain(lang, t);
    write(join(urlProjects(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("wspage_title")} \u2014 LiczMat`,
      description: t("wspage_meta"),
      path: urlProjects(lang),
      alternates: projAlt,
      main: projects.main, jsonld: [projects.ld],
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
  const common = {
    lang: DEFAULT_LANG, t, stamp: STAMP, bare: true, noindex: true,
    alternates: {}, moduleScripts: true,
  };

  write("app/index.html", page({
    ...common,
    title: `${t("app_title")} — LiczMat`,
    description: t("app_lead"),
    path: URL_APP,
    main: appMain(t),
    // workspace.js is a classic script on purpose: /app/ reads the browser workspace
    // through its globals, which a module's own scope would hide.
    classicScripts: ["/assets/workspace.js"],
    scripts: ["/assets/app.js"],
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
