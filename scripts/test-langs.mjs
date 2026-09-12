#!/usr/bin/env node
/**
 * LiczMat — the thirteen languages, and what every picker on the site calls them.
 *
 *     node scripts/test-langs.mjs
 *
 * Session 41 of the repair plan: "sześć języków bez nazwy (`undefined` w wybieraku)".
 *
 * The defect it closes was one list kept in two places. `LANGS` in assets/i18n.js has
 * carried all ten names since the six languages came back on 2026-08-19; `LANG_NAME` in
 * src/flags.mjs was typed by hand and still named four. The generator writes that second
 * copy straight into the markup, so 370 of the 375 shipped pages said the word
 * "undefined" beside six flags — once in the header menu, once again in the footer — in
 * every one of the languages. Nothing looked broken to the build: every key was
 * present, every URL resolved, every test passed.
 *
 * So this file measures the one property none of the other suites owned: that a language
 * the site ships has a name, that the name is the language's own word for itself, and
 * that both pickers say it. The three pages with no language of their own (/app/,
 * /app/dashboard/, /p/) build their picker in the browser out of the generated dictionary
 * bundle, so §4 reads those bundles back and checks they carry the same ten.
 *
 * The owner's decision of 2026-08-21 is the rule §2 checks: the name of the LANGUAGE next
 * to the flag, never the name of a country. Ten languages are not ten countries — German
 * is spoken in four of them and Serbian is written in two scripts — and a picker that
 * says "Deutschland" is asking somebody in Vienna to pick a country they do not live in.
 *
 * Dependency-free, plain `node`, exit 1 on failure. Run it after touching LANGS in
 * assets/i18n.js, LANG_NAME in src/flags.mjs, langPicker() or the footer's language nav.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, HREFLANG, DEFAULT_LANG } from "../src/site.mjs";
import { FLAG, LANG_NAME } from "../src/flags.mjs";
import { MONEY_LOCALE } from "../src/currency.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => readFileSync(p(file), "utf8");

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

/** The same failure on 370 pages is one defect: print it once and say how many. */
function checkAll(name, list, ok, describe) {
  const bad = list.filter((item) => !ok(item));
  return check(name, bad.length === 0,
    bad.length ? `${bad.length} of ${list.length}, e.g. ${describe(bad[0])}` : "");
}

/* ------------------------------------------------------------------ the pages */

/**
 * Every .html file the Pages workflow publishes, with the two picker blocks pulled out.
 *
 * A flag is an inline SVG with text nodes of its own, so it goes before anything is read:
 * what is left of a block after the SVGs and the tags are gone is exactly the list of
 * names, in the order the visitor sees them.
 */
function collect(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if ([".git", "node_modules", "docs", "src", "scripts", "assets", "functions", "hosting"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { collect(full, out); continue; }
    if (!name.endsWith(".html")) continue;
    const html = readFileSync(full, "utf8");
    // Windows joins with a backslash; every path in this file is written with "/".
    out.push({ file: full.slice(ROOT.length + 1).split(sep).join("/"), html });
  }
  return out;
}

/** The visible words of a fragment: SVGs dropped, tags dropped, blanks dropped. */
const words = (html) => html
  .replace(/<svg[\s\S]*?<\/svg>/g, "\n")
  .replace(/<[^>]+>/g, "\n")
  .split("\n").map((s) => s.trim()).filter(Boolean);

const between = (html, open, close) => {
  const i = html.indexOf(open);
  if (i < 0) return null;
  const j = html.indexOf(close, i);
  return j < 0 ? null : html.slice(i, j + close.length);
};

const PAGES = collect();

/** The three that translate in place: the container is in the markup and is empty. */
const IN_PLACE = ["app/index.html", "app/dashboard/index.html", "p/index.html"];
/** The two the generator does not write at all. */
const HAND_WRITTEN = ["404.html", "privacy-policy.html"];

/** The 370 per-language pages: the ones whose picker the generator filled in. */
const WITH_PICKER = PAGES.filter((x) => x.html.includes('<span class="lang-btn-name">'));

/* ------------------------------------------------------------------ §1 one list */

head("§1 the list is in one place");

check("assets/i18n.js is the list, and src/flags.mjs reads it rather than repeating it",
  !/export const LANG_NAME = \{/.test(read("src/flags.mjs")),
  "LANG_NAME is typed out in src/flags.mjs again — that is the second copy this session deleted");

{
  const src = read("assets/i18n.js");
  const meta = new Function(`${src}\nreturn LANGS;`)();
  check("assets/i18n.js names every language the site ships",
    LANGS.every((l) => meta.some((m) => m.code === l)),
    `missing: ${LANGS.filter((l) => !meta.some((m) => m.code === l)).join(", ") || "none"}`);
  check("and offers no language the site does not ship",
    meta.every((m) => LANGS.includes(m.code)),
    `extra: ${meta.filter((m) => !LANGS.includes(m.code)).map((m) => m.code).join(", ") || "none"}`);
  check("in the order the picker shows them",
    meta.map((m) => m.code).join(",") === LANGS.join(","),
    `${meta.map((m) => m.code).join(",")} vs ${LANGS.join(",")}`);
  checkAll("every entry carries a non-empty label", meta,
    (m) => typeof m.label === "string" && m.label.trim() === m.label && m.label.length > 0,
    (m) => `${m.code}: ${JSON.stringify(m.label)}`);
}

checkAll("LANG_NAME answers for every language", LANGS,
  (l) => typeof LANG_NAME[l] === "string" && LANG_NAME[l].length > 0,
  (l) => `${l} → ${LANG_NAME[l]}`);

// The word the defect actually printed. It is a real string in JavaScript, so nothing
// downstream threw, and it is what 370 pages carried.
checkAll("and never the word a missing entry renders as", LANGS,
  (l) => LANG_NAME[l] !== "undefined" && LANG_NAME[l] !== "null",
  (l) => `${l} → ${LANG_NAME[l]}`);

check("the build refuses to generate a page for a language with no name",
  read("scripts/build.mjs").includes("has no name"),
  "validate() in scripts/build.mjs no longer checks LANG_NAME");

/* ------------------------------------------------------------------ §2 the names */

head("§2 the name is the language's own, and never a country's");

// The owner's decision, 2026-08-21. Each of these is the country a picker would name if
// it named countries — several of them belong to more than one of the languages, and
// none of them is a language.
const COUNTRY = [
  "Polska", "Poland", "Україна", "Ukraine", "Deutschland", "Germany", "Österreich",
  "England", "United Kingdom", "USA", "Česko", "Česká republika", "Czechia",
  "Slovensko", "Slovakia", "România", "Romania", "Hrvatska", "Croatia",
  "Србија", "Srbija", "Serbia", "Россия", "Russia",
].map((s) => s.toLowerCase());

checkAll("no label is the name of a country", LANGS,
  (l) => !COUNTRY.includes(String(LANG_NAME[l]).toLowerCase()),
  (l) => `${l} → ${LANG_NAME[l]}`);

// "Română" is not "Romanian": the picker is read by somebody who does not read the
// language the page is currently in, so each name has to be written in its own language.
const OWN_NAME = {
  pl: "Polski", uk: "Українська", de: "Deutsch", en: "English", cs: "Čeština",
  sk: "Slovenčina", ro: "Română", hr: "Hrvatski", sr: "Srpski",
  it: "Italiano", nl: "Nederlands", es: "Español", fr: "Français",
};
checkAll("each language is called what it calls itself", LANGS,
  (l) => LANG_NAME[l] === OWN_NAME[l],
  (l) => `${l}: ${LANG_NAME[l]} — expected ${OWN_NAME[l]}`);

check("and no two languages share a name",
  new Set(LANGS.map((l) => LANG_NAME[l])).size === LANGS.length,
  "two rows of the picker would be indistinguishable");

// A Cyrillic language written in Latin letters is a transliteration, which is a fifth
// thing to keep in step with nothing to check it against.
checkAll("the Cyrillic name is written in Cyrillic", ["uk"],
  (l) => /[Ѐ-ӿ]/.test(LANG_NAME[l]), (l) => `${l} → ${LANG_NAME[l]}`);

/* ------------------------------------------------------------------ §3 the pages */

head("§3 every shipped page, both pickers");

check("380 of the 385 pages carry a picker the generator filled in",
  WITH_PICKER.length === PAGES.length - 5,
  `${WITH_PICKER.length} of ${PAGES.length}`);

checkAll("the five without one are exactly the five that cannot have one", PAGES,
  (x) => x.html.includes('<span class="lang-btn-name">')
    || IN_PLACE.includes(x.file) || HAND_WRITTEN.includes(x.file),
  (x) => x.file);

// Empty on purpose: those three have no language in their URL, so drawLangPicker() in
// assets/i18n-runtime.js fills the container from the dictionary bundle §4 reads back. A
// picker the generator half-wrote there would name DEFAULT_LANG to everybody.
checkAll("and the three that translate in place ship the container empty", IN_PLACE,
  (f) => (PAGES.find((x) => x.file === f) || {}).html
    ?.includes('<div class="lang-picker" id="lang-picker"></div>'),
  (f) => f);

// The button. It names the language the visitor is reading right now, so this is the one
// name on the page that is not a choice — and the one that was "undefined" on six pages
// in every directory.
checkAll("the picker's button names the page's own language", WITH_PICKER,
  (x) => {
    const m = x.html.match(/<span class="lang-btn-name">([^<]*)<\/span>/);
    const lang = (x.html.match(/<html lang="([^"]+)"/) || [])[1];
    const code = LANGS.find((l) => HREFLANG[l] === lang) || DEFAULT_LANG;
    return m && m[1] === LANG_NAME[code];
  },
  (x) => `${x.file}: ${(x.html.match(/<span class="lang-btn-name">([^<]*)<\/span>/) || [])[1]}`);

const namesIn = (block) => words(block).filter((w) => w !== "");

checkAll("the header menu lists all ten, in order, by name", WITH_PICKER,
  (x) => {
    const menu = between(x.html, '<ul class="lang-menu"', "</ul>");
    return menu && namesIn(menu).join("|") === LANGS.map((l) => LANG_NAME[l]).join("|");
  },
  (x) => `${x.file}: ${namesIn(between(x.html, '<ul class="lang-menu"', "</ul>") || "").join(", ")}`);

checkAll("the footer's language list says the same ten, in the same order", WITH_PICKER,
  (x) => {
    const nav = between(x.html, '<nav class="foot-langs"', "</nav>");
    if (!nav) return false;
    // The first word is the section heading ("Język" / "Sprache" / …); the rest are names.
    return namesIn(nav).slice(1).join("|") === LANGS.map((l) => LANG_NAME[l]).join("|");
  },
  (x) => `${x.file}: ${namesIn(between(x.html, '<nav class="foot-langs"', "</nav>") || "").slice(1).join(", ")}`);

checkAll("every language link carries the hreflang of the language it names", WITH_PICKER,
  (x) => LANGS.filter((l) => l !== DEFAULT_LANG).every((l) => {
    const m = x.html.match(new RegExp(`hreflang="${HREFLANG[l]}" lang="${HREFLANG[l]}" data-lang="${l}"`));
    return Boolean(m);
  }),
  (x) => x.file);

// The net. A name that goes missing again does not throw, does not break a URL and does
// not fail any other suite — it prints one word, and this is the word.
checkAll("no shipped page contains the word \"undefined\" where a visitor can read it",
  PAGES,
  (x) => !words(x.html.replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")).some((w) => /\bundefined\b/.test(w)),
  (x) => x.file);

/* --------------------------------------------------- §4 the runtime picker */

head("§4 the picker /app/, /app/dashboard/ and /p/ build for themselves");

// Those three have no language in their URL, so they draw their own picker out of the
// dictionary bundle. Two pickers built from two lists is how this defect existed at all:
// the runtime one was right for a week while the generated one was wrong.
for (const lang of LANGS) {
  const file = `assets/i18n.${lang}.js`;
  const src = read(file);
  const meta = new Function(`${src}\nreturn LANGS;`)();
  check(`${file} carries all ${LANGS.length} languages with the same names`,
    meta.length === LANGS.length
      && meta.every((m, i) => m.code === LANGS[i] && m.label === LANG_NAME[LANGS[i]]),
    meta.map((m) => `${m.code}=${m.label}`).join(" "));
}

{
  const flags = read("assets/flags.js");
  const LM_FLAGS = new Function(`${flags}\nreturn LM_FLAGS;`)();
  checkAll("assets/flags.js carries a flag for every language", LANGS,
    (l) => typeof LM_FLAGS[l] === "string" && LM_FLAGS[l].includes("<svg"),
    (l) => l);
  check("and no more than the ten", Object.keys(LM_FLAGS).length === LANGS.length,
    Object.keys(LM_FLAGS).join(", "));
}

/* ------------------------------------------------------------------ §5 the flags */

head("§5 the flag beside the name");

checkAll("every language has a real vector flag, not an emoji", LANGS,
  (l) => FLAG[l] && FLAG[l].startsWith("<svg") && FLAG[l].includes('aria-hidden="true"'),
  (l) => `${l}: ${String(FLAG[l]).slice(0, 40)}`);

// Chapter V of the master plan rules out emoji flags: they render differently on every
// platform and are missing entirely on some Androids.
checkAll("and no page smuggles one in beside the picker", WITH_PICKER,
  (x) => {
    const menu = between(x.html, '<ul class="lang-menu"', "</ul>") || "";
    return !/[\u{1F1E6}-\u{1F1FF}]/u.test(menu);
  },
  (x) => x.file);

/* ------------------------------------------------------------------ §6 counted nouns */

head("§6 the catalogue count takes the language's own form");

/**
 * Every home page prints "<n> calculators · <n> materials in the catalogue". The two
 * nouns came out of the dictionary in one fixed form whatever the number was, so the
 * Ukrainian page said "161 матеріалів у каталозі" where a number ending in 1 takes the
 * plain singular — "161 матеріал". The forms themselves are measured by
 * scripts/test-calculators.mjs; what this section owns is that the shipped page uses them.
 */
const HOME_META = PAGES
  .filter((x) => x.html.includes('<p class="door-meta">'))
  .map((x) => ({ file: x.file.split(sep).join("/"), meta: between(x.html, '<p class="door-meta">', "</p>") || "" }));

check("every language's home page carries the count", HOME_META.length >= LANGS.length,
  `${HOME_META.length} pages have a door-meta`);
checkAll("no dictionary key is left showing through in pipes", HOME_META,
  (x) => !x.meta.includes("|"), (x) => `${x.file}: ${x.meta}`);
checkAll("both counts are a number followed by a word", HOME_META,
  (x) => /^\d+\s+\S.*·\s*\d+\s+\S/.test(words(x.meta).join(" ")), (x) => `${x.file}: ${x.meta}`);

{
  const uk = HOME_META.find((x) => x.file === "uk/index.html");
  if (check("the Ukrainian home page is there", Boolean(uk))) {
    const m = words(uk.meta).join(" ").match(/(\d+)\s+(матеріал\S*)/);
    if (check("it says how many materials are in the catalogue", Boolean(m), uk.meta)) {
      const n = Number(m[1]), last = n % 10, teens = n % 100;
      const want = last === 1 && teens !== 11 ? "матеріал"
        : last >= 2 && last <= 4 && !(teens >= 12 && teens <= 14) ? "матеріали"
        : "матеріалів";
      check(`${n} materials is written "${n} ${want}"`, m[2] === want, `the page says "${m[2]}"`);
    }
  }
}

/* ------------------------------------------------------ §7 every key that reaches a screen */

head("§7 every key handed to t() is a key somebody translated");

/**
 * `t()` falls back to the key itself (assets/i18n-runtime.js), which is the kindest thing
 * it can do at runtime and the reason a missing key is invisible until a user reads
 * "crm_phone" off the screen. That has now happened twice: `crm_phone` in src/app-pages.mjs,
 * and `ws_save_failed`, which is the banner shown when the browser refuses to save — so the
 * one message about work being lost was itself unreadable, in all thirteen languages, from
 * the audit of 2026-09-04 until session G found it.
 *
 * Nothing asked the question until here. The dictionaries are checked against the calls
 * rather than against each other, because the languages are NOT expected to hold the same
 * keys: `calc_count_few` and `mat_count_label_few` exist for the seven languages with a
 * "few" plural and for no others, and a parity test would demand they be invented.
 */
const BUNDLE = {};
for (const lang of LANGS) {
  const src = readFileSync(join(ROOT, "assets", `i18n.${lang}.js`), "utf8");
  const m = src.match(/I18N\["[a-z]{2}"\] = (\{[\s\S]*?\});\s*$/m);
  BUNDLE[lang] = m ? new Set(Object.keys(JSON.parse(m[1]))) : null;
  check(`the ${lang} bundle is one object this can read`, Boolean(BUNDLE[lang]));
}
const KNOWN = LANGS.filter((l) => BUNDLE[l]);

/** Every browser script and every generator module — the minified twins are copies. */
function sources(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name.includes(".min.") || name.startsWith("i18n")) continue;
    if (/\.(js|mjs)$/.test(name)) out.push(`${dir}/${name}`);
  }
  return out;
}
const SOURCES = sources("assets", sources("src"));

/* Two shapes, and they are asked two different questions.

   `t("app_sync_pulled")` names one key, and that key has to exist in all thirteen.

   `t("job_st_" + j.status)` names a family — the statuses of a job, the colours of a
   calendar entry, the two names of a theme. Which member is asked for is only known while
   somebody is clicking, so what can be checked is that the family exists everywhere it is
   drawn: a status translated into Polish alone is the same bug arriving in twelve
   languages at once. */
const literal = new Map(), family = new Map();
const note = (map, key, file) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(file);
};
for (const file of SOURCES) {
  const src = readFileSync(join(ROOT, file), "utf8");
  for (const m of src.matchAll(/\b[tT]\(\s*(["'])([a-z0-9][a-z0-9_]*)\1(\s*\+)?/g)) {
    note(m[3] ? family : literal, m[2], file);
  }
}
// The markup asks for its own, through `data-i18n` and its sisters on title and aria-label.
for (const page of PAGES) {
  for (const m of page.html.matchAll(/data-i18n(?:-[a-z]+)?="([a-z0-9][a-z0-9_]*)"/g)) {
    note(literal, m[1], "the markup");
  }
}

check("there are calls to check", literal.size > 400, `${literal.size} keys named outright`);
check("and families among them", family.size > 0, `${family.size} keys built by hand`);

const absent = (key) => KNOWN.filter((l) => !BUNDLE[l].has(key));
checkAll("every key named outright is in all thirteen dictionaries", [...literal.keys()],
  (key) => absent(key).length === 0,
  (key) => `${key} is missing from ${absent(key).join(", ")} — used in ${[...literal.get(key)].join(", ")}`);

const familyGaps = (prefix) => {
  const members = (lang) => [...BUNDLE[lang]].filter((k) => k.startsWith(prefix) && k !== prefix);
  const inPl = new Set(members(DEFAULT_LANG));
  return KNOWN.filter((l) => members(l).length !== inPl.size
    || members(l).some((k) => !inPl.has(k)));
};
checkAll("and every family built by hand is the same family in all thirteen", [...family.keys()],
  (prefix) => familyGaps(prefix).length === 0,
  (prefix) => `${prefix}* differs in ${familyGaps(prefix).join(", ")} — used in ${[...family.get(prefix)].join(", ")}`);
checkAll("no family is empty", [...family.keys()],
  (prefix) => [...BUNDLE[DEFAULT_LANG]].some((k) => k.startsWith(prefix) && k !== prefix),
  (prefix) => `${prefix}* names nothing — used in ${[...family.get(prefix)].join(", ")}`);

/* --------------------------------------------- §8 a locale for every one of the thirteen */

head("§8 no language is formatted in the build machine's locale");

/**
 * `new Intl.NumberFormat(undefined, …)` does not mean "no locale". It means the locale of
 * whoever is running node, which for a generator is the laptop of whoever last built the
 * site — so the Czech calculator pages shipped "0 CZK" and "1600 kg" because this machine
 * is Polish, and the same source built on ubuntu produced "0 Kč" and "1 600 kg". Nine of
 * the thirteen languages were in that state until session G, and what found it was CI
 * building the pages somewhere else and asking git whether they matched.
 *
 * `LM_LOCALE` in assets/currency.js is the one map with all thirteen in it. The rule is
 * that nothing keeps a second one.
 */
for (const lang of LANGS) {
  check(`${lang} has a locale to format with`,
    typeof MONEY_LOCALE[lang] === "string" && MONEY_LOCALE[lang].includes("-"),
    String(MONEY_LOCALE[lang]));
}
for (const file of ["src/pages.mjs", "scripts/build.mjs", "src/template.mjs", "src/pro.mjs"]) {
  const src = readFileSync(join(ROOT, file), "utf8");
  /* A map from language code to BCP 47 tag written out by hand. The one in
     assets/currency.js is the exception this rule exists to point at, and it is not in
     this list. */
  const own = src.match(/\{[^{}]*\bpl:\s*"pl-PL"[^{}]*\}/);
  check(`${file} does not keep a locale map of its own`, own === null,
    own ? own[0].slice(0, 120) : "");
}
/* And the formatting really does differ between them, so the map above is load-bearing
   rather than thirteen names for one behaviour. */
{
  const fmt = (lang) => new Intl.NumberFormat(MONEY_LOCALE[lang], { maximumFractionDigits: 2 }).format(1600.5);
  const shapes = new Set(LANGS.map(fmt));
  check("and the thirteen do not all format a number the same way", shapes.size > 1,
    [...shapes].join(" | "));
}

/* ------------------------------------------------------------------ the report */

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n${passed} passed, ${failures.length} failed.\n`);
  process.exit(1);
}
console.log(`OK — ${passed} checks: ${LANGS.length} languages, ${WITH_PICKER.length} pages with a picker, ` +
  `${LANGS.length} dictionary bundles.`);
