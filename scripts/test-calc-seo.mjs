#!/usr/bin/env node
/**
 * LiczMat — the SEO of the 15 calculator pages, in all ten languages, tested.
 *
 *     node scripts/test-calc-seo.mjs
 *
 * Master plan, session 31 (SEO KALKULATORÓW): "Każdy kalkulator powinien być możliwie
 * dobrym landing page'em dla konkretnego zapytania użytkownika."
 *
 * Session 30 checked that the site's technical SEO is *well formed* — that a canonical
 * points at its own page, that a sitemap does not advertise a `noindex`. This suite
 * checks what the calculator pages *say*, which is the other half and the half a machine
 * cannot infer: a title that reads "Płytki, panele, gres — Kalkulatory | LiczMat" is
 * perfectly well formed and contains not one word of "ile płytek na m²".
 *
 * So it reads the 150 files that shipped and holds each of them against the copy in
 * src/calc-seo.mjs:
 *
 *   1. the title — the calculator's own, the length Google will actually show, and never
 *      the same sentence twice inside one language;
 *   2. the description — the same text in the <meta> and in the paragraph under the H1,
 *      because a snippet that promises something the page does not open with is the same
 *      defect seen from two sides;
 *   3. the H1 — one per page, and the title, not the site's label for the tool;
 *   4. the FAQ — both questions on the page, both answers on the page, and the FAQPage
 *      structured data saying exactly what the markup says and nothing more;
 *   5. chapter XII's order — the tool above the words. "Długie treści SEO, instrukcje
 *      i FAQ nie mogą zasłaniać kalkulatora" is a rule about position, so it is checked
 *      by position: H1, form, result, then the explanation, then the FAQ;
 *   6. chapter XXVI's "nie upychaj słów kluczowych" — the query word is in the title
 *      once, and the copy does not repeat it;
 *   7. that none of this copy reached the browser's dictionary, which every page on the
 *      site downloads.
 *
 * Dependency-free, plain `node`, exit 1 on failure. Run it after touching
 * src/calc-seo.mjs, calcPageMain() or buildCalculatorPages().
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, urlCalc } from "../src/site.mjs";
import { CALC_SEO, TITLE_MAX } from "../src/calc-seo.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => readFileSync(p(file), "utf8");
const evalScript = (file, returns) =>
  new Function(`${[].concat(file).map((f) => read(f)).join("\n")}\nreturn {${returns.join(",")}};`)();

const { CALCS } = evalScript(["assets/units.js", "assets/calculators.js"], ["CALCS"]);

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

/* ------------------------------------------------------------------ the pages */

const decode = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** One shipped calculator page, parsed down to the parts this suite reads. */
function load(lang, calc) {
  const url = urlCalc(lang, calc.id);
  const html = read(join(url.replace(/^\//, ""), "index.html"));
  const one = (re) => { const m = html.match(re); return m ? decode(m[1].trim()) : ""; };
  return {
    lang, id: calc.id, url, html,
    title: one(/<title>([\s\S]*?)<\/title>/),
    description: one(/<meta name="description" content="([^"]*)"/),
    h1s: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1].trim())),
    lead: one(/<p class="lead">([\s\S]*?)<\/p>/),
    summaries: [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => decode(m[1].trim())),
    jsonld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => m[1]),
  };
}

const PAGES = LANGS.flatMap((lang) => CALCS.map((calc) => load(lang, calc)));
const seoOf = (page) => CALC_SEO[page.id][page.lang];

/**
 * The word a person types when they are looking for one of these, per language. It is
 * what makes a title a landing page rather than a label, and it is checked rather than
 * assumed: German builds it into a compound (Farbrechner, Estrichrechner), so the test
 * looks for the stem, not for a standalone word.
 */
const TOOL_WORD = {
  pl: "kalkulator", uk: "калькулятор", de: "rechner", en: "calculator", cs: "kalkulačka",
  sk: "kalkulačka", ro: "calculator", hr: "kalkulator", sr: "kalkulator", ru: "калькулятор",
};

const countOf = (haystack, needle) => haystack.toLowerCase().split(needle).length - 1;

head("0. the tree this suite is reading");
{
  check("150 calculator pages: 15 calculators × 10 languages",
    PAGES.length === CALCS.length * LANGS.length, `found ${PAGES.length}`);
  check("every calculator has copy in every language",
    CALCS.every((c) => CALC_SEO[c.id] && LANGS.every((l) => CALC_SEO[c.id][l])));
  check("and the copy declares no calculator the site does not have",
    Object.keys(CALC_SEO).every((id) => CALCS.some((c) => c.id === id)),
    Object.keys(CALC_SEO).filter((id) => !CALCS.some((c) => c.id === id)).join(", "));
}

/* ------------------------------------------------------------------ 1. the title */

head("1. the title: this calculator's own, and short enough to be shown");
{
  for (const page of PAGES) {
    const seo = seoOf(page);
    check(`${page.url}: the title is the one written for it`,
      page.title === `${seo.title} | LiczMat`, page.title);
    check(`${page.url}: it fits a result row (≤ 60)`, page.title.length <= 60,
      `${page.title.length}: ${page.title}`);
    check(`${page.url}: the copy leaves room for the brand (≤ ${TITLE_MAX})`,
      seo.title.length <= TITLE_MAX, `${seo.title.length}`);
    check(`${page.url}: it says what the page is`,
      page.title.toLowerCase().includes(TOOL_WORD[page.lang]), page.title);
  }
  // Inside one language two identical titles are two pages competing for one result;
  // across languages hreflang explains the pair, so a repeat there is not a defect.
  for (const lang of LANGS) {
    const seen = new Map();
    for (const page of PAGES.filter((x) => x.lang === lang)) {
      check(`${page.url}: its title is unique within ${lang}`, !seen.has(page.title),
        `also ${seen.get(page.title)}`);
      seen.set(page.title, page.url);
    }
  }
}

/* ------------------------------------------------------------------ 2. the description */

head("2. the description: one sentence, in the <meta> and on the page");
{
  const seen = new Map();
  for (const page of PAGES) {
    const seo = seoOf(page);
    check(`${page.url}: the description is the one written for it`,
      page.description === seo.desc, page.description);
    // Past ~160 characters the snippet is cut off mid-sentence; under 50 it says nothing.
    check(`${page.url}: it fits a snippet (50–160)`,
      seo.desc.length >= 50 && seo.desc.length <= 160, `${seo.desc.length}`);
    // The snippet is a promise about what the page opens with, so it is the same text.
    check(`${page.url}: the page opens with it`, page.lead === seo.desc, page.lead);
    check(`${page.url}: its description is its own`, !seen.has(seo.desc),
      `also ${seen.get(seo.desc)}`);
    seen.set(seo.desc, page.url);
  }
}

/* ------------------------------------------------------------------ 3. the H1 */

head("3. the H1: one per page, and the sentence somebody searched for");
{
  for (const page of PAGES) {
    if (!check(`${page.url}: exactly one H1`, page.h1s.length === 1, `${page.h1s.length}`)) continue;
    check(`${page.url}: the H1 is the title`, page.h1s[0] === seoOf(page).title, page.h1s[0]);
  }
}

/* ------------------------------------------------------------------ 4. the FAQ */

head("4. the FAQ: two questions on the page, and structured data that repeats them");
{
  for (const page of PAGES) {
    const seo = seoOf(page);
    const questions = seo.faq.map(([q]) => q);
    for (const [q, a] of seo.faq) {
      check(`${page.url}: "${q.slice(0, 32)}…" is on the page`, page.summaries.includes(q));
      check(`${page.url}: and its answer is too`, page.html.includes(a.replace(/&/g, "&amp;")));
    }
    check(`${page.url}: the page shows these two questions and no others`,
      page.summaries.length === 2 && questions.every((q) => page.summaries.includes(q)),
      page.summaries.join(" | "));

    const faqLd = page.jsonld
      .map((b) => { try { return JSON.parse(b); } catch (e) { return null; } })
      .find((n) => n && n["@type"] === "FAQPage");
    if (!check(`${page.url}: it carries FAQPage structured data`, Boolean(faqLd))) continue;
    check(`${page.url}: the structured data has the two entries`,
      Array.isArray(faqLd.mainEntity) && faqLd.mainEntity.length === 2);
    // An answer in the JSON-LD that is not in the markup is a page telling Google
    // something it does not tell a reader — which is what the guideline forbids.
    for (const entry of faqLd.mainEntity || []) {
      const pair = seo.faq.find(([q]) => q === entry.name);
      if (!check(`${page.url}: "${String(entry.name).slice(0, 32)}…" is a question on the page`,
        Boolean(pair), String(entry.name))) continue;
      check(`${page.url}: and carries the answer the page shows`,
        entry.acceptedAnswer && entry.acceptedAnswer.text === pair[1]);
    }
    // The WebApplication and the trail did not go anywhere when the FAQ arrived.
    check(`${page.url}: it still declares itself a WebApplication`,
      page.jsonld.some((b) => b.includes('"WebApplication"')));
    check(`${page.url}: and still carries its trail`,
      page.jsonld.some((b) => b.includes('"BreadcrumbList"')));
  }
}

/* ------------------------------------------------------------------ 5. the order */

head("5. chapter XII: the tool above the words");
{
  for (const page of PAGES) {
    const h1 = page.html.indexOf("<h1");
    const form = page.html.indexOf('id="calc-form-h"');
    const result = page.html.indexOf('id="calc-result-h"');
    const how = page.html.indexOf('id="hwc-h"');
    const faq = page.html.indexOf('id="cfaq-h"');
    check(`${page.url}: the title comes before the form`, h1 > 0 && h1 < form, `${h1} / ${form}`);
    check(`${page.url}: the form comes before the result`, form > 0 && form < result,
      `${form} / ${result}`);
    check(`${page.url}: the result comes before the explanation`, result < how,
      `${result} / ${how}`);
    check(`${page.url}: the FAQ is below the explanation, not above the tool`,
      faq > how && how > form, `form ${form}, how ${how}, faq ${faq}`);
  }
}

/* ------------------------------------------------------------------ 6. no stuffing */

head("6. chapter XXVI: „nie upychaj słów kluczowych”");
{
  for (const page of PAGES) {
    const seo = seoOf(page);
    const word = TOOL_WORD[page.lang];
    check(`${page.url}: the title names the tool once`,
      countOf(seo.title, word) === 1, seo.title);
    // The description is one sentence pair about the work, not a second title.
    check(`${page.url}: the description does not repeat it`,
      countOf(seo.desc, word) <= 1, seo.desc);
    for (const [q, a] of seo.faq) {
      check(`${page.url}: the question does not repeat it`, countOf(q, word) <= 1, q);
      check(`${page.url}: the answer does not repeat it`, countOf(a, word) <= 1, a);
    }
  }
}

/* ------------------------------------------------------------------ 7. the browser's copy */

head("7. none of this is in the dictionary every page downloads");
{
  for (const lang of LANGS) {
    const dict = read(`assets/i18n.${lang}.js`);
    const leaked = CALCS.filter((c) => dict.includes(CALC_SEO[c.id][lang].title));
    check(`assets/i18n.${lang}.js does not ship the SEO copy`, leaked.length === 0,
      leaked.map((c) => c.id).join(", "));
    // The pattern the copy replaced, and the generic sentence that followed every lead.
    check(`assets/i18n.${lang}.js has dropped calc_meta_pattern`,
      !dict.includes("calc_meta_pattern"));
    check(`assets/i18n.${lang}.js has dropped calc_page_lead`, !dict.includes("calc_page_lead"));
  }
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\ncalculator SEO: ${failures.length} failure(s), ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`calculator SEO: ${passed}/${passed} checks pass`);
