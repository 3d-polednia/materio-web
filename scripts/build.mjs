#!/usr/bin/env node
/* Materio website — the page generator.
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
  BASE, LANGS, DEFAULT_LANG, SECTION, GUIDES, CALC_SLUG, URL_APP, URL_SHARE,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores,
} from "../src/site.mjs";
import { page } from "../src/template.mjs";
import {
  homeMain, calcHubMain, calcPageMain, guideIndexMain, guideMain, storesMain,
  renderFormula, FAQ_KEYS,
} from "../src/pages.mjs";
import { CALC_META } from "../src/calc-meta.mjs";
import { appMain, shareMain } from "../src/app-pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Cache-busting stamp for /assets/*. Bump it whenever a shipped asset changes. */
const STAMP = "20260807a";

/* ------------------------------------------------------------------ load sources */

/** Evaluate a browser script that has no exports and hand back the globals we need. */
function evalScript(file, returns) {
  const src = readFileSync(p(file), "utf8");
  return new Function(`${src}\nreturn {${returns.join(",")}};`)();
}

const { I18N, LANGS: LANG_META } = evalScript("assets/i18n.js", ["I18N", "LANGS"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { CALCS, ENGINES } = evalScript("assets/calculators.js", ["CALCS", "ENGINES"]);

/** The merged dictionary: the original keys plus the ones only sub-pages use. */
const DICT = {};
for (const lang of LANGS) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };

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

  // Two pages must never claim the same URL.
  const seen = new Map();
  for (const lang of LANGS) {
    const urls = [urlHome(lang), urlCalcIndex(lang), urlGuideIndex(lang), urlStores(lang)]
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

/* ------------------------------------------------------------------ worked examples */

/**
 * Run one engine over its own default values so the page can show a real result.
 * Returns the same shape the browser renders, already localized.
 */
function workedExample(calc, lang, t) {
  const input = Object.fromEntries(calc.fields.map((f) => [f.k, f.def]));
  const res = ENGINES[calc.engine](input);
  if (res.err) throw new Error(`calculator "${calc.id}" fails on its own defaults: ${res.err}`);

  const locale = { pl: "pl-PL", en: "en-US", de: "de-DE", cs: "cs-CZ", sk: "sk-SK",
    ro: "ro-RO", hr: "hr-HR", sr: "sr-RS", uk: "uk-UA", ru: "ru-RU" }[lang];
  const number = (v) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);

  const rows = (res.rows || []).map(([k, v]) => [
    t(k),
    String(v).replace("|res_water_l|", t("res_water_l")),
  ]);

  return { tobuy: number(res.tobuy), unit: t(res.unit), rows };
}

/* ------------------------------------------------------------------ schema.org */

const appLd = (lang, t) => ({
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Materio",
  operatingSystem: "Android 7.0+",
  applicationCategory: "UtilitiesApplication",
  inLanguage: LANGS,
  url: BASE + urlHome(lang),
  downloadUrl: "https://play.google.com/store/apps/details?id=pl.materio.app",
  installUrl: "https://play.google.com/store/apps/details?id=pl.materio.app",
  image: `${BASE}/assets/og-image.jpg`,
  description: t("hero_lead"),
  offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
  author: { "@type": "Organization", name: "Materio" },
  publisher: { "@type": "Organization", name: "Materio" },
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
  isPartOf: { "@type": "WebSite", name: "Materio", url: BASE + "/" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
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
      main: homeMain(lang, t, CALCS),
      jsonld: [appLd(lang, t), {
        "@context": "https://schema.org", "@type": "Organization",
        name: "Materio", url: BASE + "/", logo: `${BASE}/assets/icon-512.png`,
      }, faqLd(t)],
      scripts: ["/assets/calculators.js"],
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
      title: `${t("calchub_title")} — Materio`,
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
      });
      write(join(urlCalc(lang, calc.id), "index.html").replace(/^\//, ""), page({
        lang, t, stamp: STAMP,
        title: `${name} — ${t("calchub_title")} | Materio`,
        description,
        path: urlCalc(lang, calc.id),
        alternates: alt,
        main,
        jsonld: [ld, calcLd(calc, lang, t)],
        scripts: ["/assets/calculators.js"],
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
      title: `${t("guides_title")} — Materio`,
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
        title: `${t(`g_${guide.id}_t`)} — Materio`,
        description: t(`g_${guide.id}_d`),
        path: urlGuide(lang, guide),
        alternates: alt,
        main, jsonld: ld,
      }));
    }
  }
}

function buildStores() {
  const alt = alternatesFor(urlStores);
  for (const lang of LANGS) {
    const t = translator(lang);
    const { main, ld } = storesMain(lang, t);
    write(join(urlStores(lang), "index.html").replace(/^\//, ""), page({
      lang, t, stamp: STAMP,
      title: `${t("storespage_title")} — Materio`,
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
    title: `${t("app_title")} — Materio`,
    description: t("app_lead"),
    path: URL_APP,
    main: appMain(t),
    scripts: ["/assets/app.js"],
  }));

  write("p/index.html", page({
    ...common,
    title: `${t("share_title")} — Materio`,
    description: t("share_lead"),
    path: URL_SHARE,
    main: shareMain(t),
    scripts: ["/assets/share.js"],
  }));
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  const add = (loc, priority, changefreq) => urls.push({ loc, priority, changefreq });

  for (const lang of LANGS) {
    add(urlHome(lang), lang === DEFAULT_LANG ? "1.0" : "0.8", "monthly");
    add(urlCalcIndex(lang), "0.9", "monthly");
    add(urlGuideIndex(lang), "0.7", "monthly");
    add(urlStores(lang), "0.7", "monthly");
    for (const c of CALCS) add(urlCalc(lang, c.id), "0.8", "monthly");
    for (const g of GUIDES) add(urlGuide(lang, g), "0.6", "monthly");
  }
  add("/privacy-policy.html", "0.3", "yearly");

  // /app/ and /p/ stay out: they are noindex, and a sitemap entry contradicts that.
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
  write("sitemap.xml", body);
}

/** Remove generated directories so a renamed slug cannot leave an orphan page behind. */
function clean() {
  const dirs = new Set();
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
buildStores();
buildPrivatePages();
buildSitemap();

const pages = written.filter((f) => f.endsWith(".html")).length;
console.log(`Built ${pages} pages and ${written.length - pages} assets ` +
  `(${LANGS.length} languages, ${CALCS.length} calculators, ${GUIDES.length} guides), stamp ${STAMP}.`);
