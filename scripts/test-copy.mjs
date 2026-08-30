#!/usr/bin/env node
/**
 * LiczMat — stop slop: what the site is allowed to say, and how much of it.
 *
 *     node scripts/test-copy.mjs
 *
 * Sessions 44 and 45 of the repair plan. The owner's decision of 2026-08-21 is one line
 * long: "stop slop" means SHORTEN, plus a test that keeps it short. So the rules below are
 * not a style opinion — they are the master plan's own chapters, turned into something a
 * machine can measure:
 *
 *   XXVII  "Nie chcemy: marketingowego «krzyku», ścian tekstu, powtarzających się CTA."
 *   XXVI   "Nie upychaj słów kluczowych."
 *   XII    the long SEO text may not stand between the visitor and the calculator
 *   CLAUDE.md  "No claims nobody can verify."
 *
 * The narrative — why each rule is the rule, and what it is allowed to cost — is
 * docs/COPY.md. This file is the enforcement, the way src/tokens.mjs is the enforcement
 * of docs/DESIGN_SYSTEM.md.
 *
 * WHAT IT READS. Every string a visitor can read: the two dictionaries, the material
 * names, the per-calculator SEO copy — and, for §7, the shipped HTML itself, because a
 * page is a wall of text by how much of it there is, not by how long any one of its
 * paragraphs is.
 *
 * EVERY RULE HAD TO CATCH SOMETHING. A rule that has never fired on this repository is a
 * rule nobody has tested, so each section names in its comment what it found on the day it
 * was added. Two of them (§5, and half of §4) found nothing and say so: those are nets
 * under the next session rather than reports about this one.
 *
 * THE LANGUAGE SPLIT. Session 44 cleaned pl, uk, de and en; session 45 cleaned cs, sk, ro,
 * hr, sr and ru. Between the two commits `CLEAN` named only the four and the six were
 * skipped — a test that fails for work nobody has done yet is a test the next session
 * learns to ignore. It is all ten now, and §1 fails if a language is ever added to the
 * site without its copy going through these rules.
 *
 * A NOTE ON WORD BOUNDARIES, because it is the trap this file lives inside of.
 * JavaScript's `\b` is defined against `\w`, which is ASCII: in `/\bbest\b/` the boundary
 * after "best" matches inside the German "Bestätige", because "ä" is not a `\w`. The first
 * draft of §4 reported five superlatives on this site and all five were that. `word()`
 * below builds the boundary out of `\p{L}\p{N}` instead, which is what copy in ten
 * languages, six of them with diacritics and two in Cyrillic, actually needs.
 *
 * Dependency-free, plain `node`, exit 1 on failure. Run it after touching assets/i18n.js,
 * assets/i18n-pages.js, assets/i18n-materials.js, src/calc-seo.mjs, or anything that
 * changes how much prose a page carries.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, GUIDES } from "../src/site.mjs";
import { liveRoutes } from "../src/ia.mjs";
import { CALC_SEO } from "../src/calc-seo.mjs";
import { CONV_COPY } from "../src/conv-copy.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => readFileSync(p(file), "utf8");

/** The browser scripts have no exports; evaluate them the way scripts/build.mjs does. */
function evalScript(file, returns) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  return new Function(`${src}\nreturn {${returns.join(",")}};`)();
}

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);
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

/**
 * One rule over many strings. The same slop in ten languages is one defect with ten
 * bodies, so a failure says how many there are and shows the first three.
 */
function checkMany(name, bad, describe, total) {
  return check(name, bad.length === 0,
    bad.length
      ? `${bad.length}${total ? ` of ${total}` : ""}:\n      ` +
        bad.slice(0, 3).map(describe).join("\n      ") +
        (bad.length > 3 ? `\n      … and ${bad.length - 3} more` : "")
      : "");
}

/* ------------------------------------------------------------------ §1 the copy */

head("§1 the copy the site ships");

/**
 * Which languages the rules are enforced on. See "THE LANGUAGE SPLIT" above: this held
 * four names for exactly one commit and holds all ten now, so §1 guards it.
 */
const CLEAN = ["pl", "uk", "de", "en", "cs", "sk", "ro", "hr", "sr", "ru"];

const NOT_CLEAN = LANGS.filter((l) => !CLEAN.includes(l));

check("every name in CLEAN is a language the site actually ships",
  CLEAN.length > 0 && CLEAN.every((l) => LANGS.includes(l)),
  `not a language: ${CLEAN.filter((l) => !LANGS.includes(l)).join(", ") || "none"}`);

check("and every language the site ships has been through these rules",
  NOT_CLEAN.length === 0, `not cleaned: ${NOT_CLEAN.join(", ")}`);

/**
 * Every visitor-facing string, tagged with where it came from.
 *
 * The values of assets/i18n-materials.js are mostly single nouns and will never trip a
 * length rule, but they go in anyway: a net with a hole in it is a hole somebody writes
 * into. What stays out is what a visitor never reads — the formula identifiers of
 * src/calc-meta.mjs are scripts/test-calculators.mjs's business.
 */
const COPY = [];
const collect = (src, dict) => {
  for (const [lang, keys] of Object.entries(dict)) {
    if (!CLEAN.includes(lang)) continue;
    for (const [key, text] of Object.entries(keys)) {
      if (typeof text === "string" && text.trim()) COPY.push({ lang, src, key, text });
    }
  }
};
collect("i18n", I18N);
collect("i18n-pages", I18N_PAGES);
collect("i18n-materials", I18N_MATERIALS);
// Session 57's converter page. Its words live in src/ rather than in a dictionary — the
// same page-weight argument src/calc-seo.mjs makes — and a rule that stopped at the
// dictionaries would be a rule with a page-shaped hole in it.
collect("conv-copy", CONV_COPY);

for (const [id, byLang] of Object.entries(CALC_SEO)) {
  for (const [lang, o] of Object.entries(byLang)) {
    if (!CLEAN.includes(lang)) continue;
    COPY.push({ lang, src: "calc-seo", key: `${id}.title`, text: o.title });
    COPY.push({ lang, src: "calc-seo", key: `${id}.desc`, text: o.desc });
    o.faq.forEach(([q, a], i) => {
      COPY.push({ lang, src: "calc-seo", key: `${id}.faq${i + 1}.q`, text: q });
      COPY.push({ lang, src: "calc-seo", key: `${id}.faq${i + 1}.a`, text: a });
    });
  }
}

check("there is copy to read", COPY.length > 400 * CLEAN.length, `${COPY.length} strings`);

const where = (r) => `${r.lang} ${r.src}:${r.key}`;

/** A sentence, roughly: split after a full stop, a question mark or a bang. */
const sentences = (text) =>
  text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

const words = (s) => s.split(/\s+/).filter(Boolean).length;

/**
 * `needle` as a whole word inside `hay`, with a boundary that knows about the letters
 * this site is written in. See the note at the top: `\b` is ASCII and gets this wrong in
 * six of the ten languages.
 */
const word = (hay, needle) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${needle}(?![\\p{L}\\p{N}])`, "iu").test(hay);

/* ------------------------------------------------------------------ §2 length */

head("§2 no wall of text");

/**
 * Chapter XXVII forbids "ściany tekstu" and the owner asked for shorter. Both caps are
 * the site as it was on 2026-08-26 and nothing else: before these two sessions 24
 * sentences ran past 25 words (the longest, `g_rozkroj_tip` in English, was 32) and 52
 * strings ran past 240 characters (the longest, `ck_p_signed_in` in German, was 326).
 * Every one of them was a true sentence saying three things at once, which is the only
 * kind of wall this site has ever had.
 *
 * 240 characters is about four lines on a 320 px phone, which is chapter XXVIII's
 * narrowest screen and the one scripts/test-phone.mjs measures.
 */
const SENTENCE_MAX_WORDS = 25;
const STRING_MAX_CHARS = 240;

const longSentences = [];
for (const r of COPY) {
  for (const s of sentences(r.text)) {
    if (words(s) > SENTENCE_MAX_WORDS) longSentences.push({ ...r, s });
  }
}
checkMany(`no sentence runs past ${SENTENCE_MAX_WORDS} words`, longSentences,
  (r) => `${where(r)} (${words(r.s)} words) | ${r.s.slice(0, 80)}…`);

const longStrings = COPY.filter((r) => r.text.length > STRING_MAX_CHARS);
checkMany(`no string runs past ${STRING_MAX_CHARS} characters`, longStrings,
  (r) => `${where(r)} (${r.text.length}) | ${r.text.slice(0, 70)}…`, COPY.length);

/* ------------------------------------------------------------------ §3 repetition */

head("§3 a calculator page does not say a thing twice");

/**
 * Chapter XXVII's "powtarzających się CTA", in the one place on this site where it was
 * true — a calculator page. It carries the caveat above the fold (`note_<id>` under "Jak to
 * liczymy") and the FAQ below it (src/calc-seo.mjs), and both were written by hand a
 * session apart. When this rule was added, 25 of the 150 calculator pages printed a
 * sentence of the note again, word for word, inside a FAQ answer — "Zapas 5–7% wystarcza
 * przy prostym układzie." twice on one screen, in Polish, English, German and Ukrainian.
 *
 * The FAQ is also published as FAQPage structured data, so a repeated sentence is a
 * repeated sentence in the search result too.
 *
 * The floor of 25 characters is here for the same reason it is everywhere in this file:
 * "Kupuj z jednej partii." is a sentence, and short sentences recurring is a vocabulary.
 */
const REPEAT_MIN_CHARS = 25;

const calcRepeats = [];
for (const c of CALCS) {
  for (const lang of CLEAN) {
    const seo = (CALC_SEO[c.id] || {})[lang];
    if (!seo) continue;
    const note = (I18N_PAGES[lang] || {})[`note_${c.id}`] || "";
    const noteSentences = new Set(sentences(note).filter((s) => s.length >= REPEAT_MIN_CHARS));
    for (const [q, a] of seo.faq) {
      for (const s of sentences(a)) {
        if (noteSentences.has(s)) calcRepeats.push({ lang, id: c.id, q, s });
      }
    }
  }
}
checkMany("no FAQ answer repeats a sentence of the note above it", calcRepeats,
  (r) => `${r.lang} ${r.id} | ${r.s.slice(0, 80)}`);

/* ------------------------------------------------------------------ §4 claims */

head("§4 nothing the site cannot back up");

/**
 * CLAUDE.md: "no claims nobody can verify". Two families, and one of them was on the site.
 *
 * A DATE THE SITE DOES NOT HAVE. `pay_soon` said "płatności uruchamiamy wkrótce" in all
 * ten languages while there was no Stripe account — a promise with no date behind it, on
 * the one page that asks for money. Ten hits, one per language, and the fix was to delete
 * the promise rather than to reword it: the sentence before it ("the subscription cannot
 * be bought yet") is the whole truth and needs no follow-up.
 *
 * A SUPERLATIVE. None the day this was written. That is the half of this rule that is a
 * net rather than a report.
 *
 * The lists are deliberately literal and short. A stemmed pattern ("ideal*") matches the
 * Romanian and Croatian words for "the same", and half of German — a clever regular
 * expression over ten languages is a false alarm in six of them.
 */
const UNVERIFIABLE = {
  pl: ["wkrótce", "niebawem", "najlepszy", "najlepsza", "najlepsze", "idealny", "idealna",
       "błyskawicznie", "rewolucyjny", "bez wysiłku"],
  uk: ["незабаром", "найкращий", "найкраща", "миттєво", "без зусиль", "революційний"],
  de: ["demnächst", "in Kürze", "bald", "der beste", "die beste", "das beste",
       "mühelos", "revolutionär", "blitzschnell"],
  en: ["soon", "shortly", "the best", "effortless", "effortlessly", "instantly",
       "revolutionary", "in seconds"],
  cs: ["brzy", "zanedlouho", "nejlepší", "bez námahy", "revoluční", "bleskově"],
  sk: ["čoskoro", "onedlho", "najlepší", "bez námahy", "revolučný", "bleskovo"],
  ro: ["în curând", "cel mai bun", "cea mai bună", "fără efort", "revoluționar", "instantaneu"],
  hr: ["uskoro", "najbolji", "najbolja", "bez napora", "revolucionaran", "munjevito"],
  sr: ["uskoro", "najbolji", "najbolja", "bez napora", "revolucionaran", "munjevito"],
  ru: ["скоро", "вскоре", "лучший", "лучшая", "без усилий", "революционный", "мгновенно"],
};

check("every language has a list of words it may not use",
  CLEAN.every((l) => Array.isArray(UNVERIFIABLE[l]) && UNVERIFIABLE[l].length),
  `missing: ${CLEAN.filter((l) => !UNVERIFIABLE[l]).join(", ") || "none"}`);

const claims = [];
for (const r of COPY) {
  for (const w of UNVERIFIABLE[r.lang] || []) if (word(r.text, w)) claims.push({ ...r, w });
}
checkMany("no promise and no superlative the site cannot back up", claims,
  (r) => `${where(r)} → "${r.w}" | ${r.text.slice(0, 70)}…`);

/* ------------------------------------------------------------------ §5 shouting */

head("§5 no marketing shouting");

/**
 * Chapter XXVII, "marketingowego «krzyku»". Zero on the site when this was written, both
 * halves, and that is worth nailing down anyway: an exclamation mark is one careless
 * commit away and the shouted word arrives the first time somebody writes DARMOWE in a
 * badge.
 *
 * The acronyms are the ones the product genuinely uses, listed rather than pattern-matched
 * so that a new one is a decision somebody makes here on purpose.
 */
const ACRONYMS = new Set([
  "OSB", "ETICS", "WDVS", "CSV", "PDF", "FAQ", "SEO", "CRM", "PLN", "EUR", "USD",
  "UAH", "CZK", "RON", "RSD", "JSON", "HTML", "SDK", "LICZMAT", "PRO",
  // Material designations out of assets/i18n-materials.js: what is printed on the
  // packaging, capitals for the same reason OSB is.
  "GKFI", "CETRIS", "PMMA",
]);

checkMany("no exclamation mark", COPY.filter((r) => r.text.includes("!")),
  (r) => `${where(r)} | ${r.text.slice(0, 70)}`);

const shouted = [];
for (const r of COPY) {
  for (const w of r.text.match(/\p{Lu}{4,}/gu) || []) {
    if (!ACRONYMS.has(w)) shouted.push({ ...r, w });
  }
}
checkMany("no word shouted in capitals", shouted, (r) => `${where(r)} → "${r.w}"`);

/* ------------------------------------------------------------------ §6 filler */

head("§6 no word that carries nothing");

/**
 * The intensifier and the throat-clearing opener: "po prostu", "naprawdę", "warto
 * pamiętać, że". Delete one and the sentence says exactly what it said before, which is
 * the test for whether it belonged. Eighteen hits when this was added, spread over five
 * languages, and every one of them read better with the word gone.
 *
 * "just" is not on the English list and cannot be: it is also "exactly" and "fair", and
 * this site writes "just under 5 mm". A word that has to be read in context is not a word
 * a regular expression may delete.
 */
const FILLER = {
  pl: ["po prostu", "naprawdę", "dosłownie", "warto pamiętać", "należy pamiętać", "oczywiście"],
  uk: ["просто кажучи", "справді", "звісно", "варто пам'ятати"],
  de: ["wirklich", "einfach nur", "natürlich", "selbstverständlich", "bitte beachten Sie"],
  en: ["actually", "simply", "literally", "of course", "please note", "keep in mind"],
  cs: ["opravdu", "jednoduše řečeno", "samozřejmě", "je třeba mít na paměti"],
  sk: ["naozaj", "jednoducho povedané", "samozrejme", "treba mať na pamäti"],
  ro: ["pur și simplu", "cu adevărat", "desigur", "trebuie reținut"],
  hr: ["jednostavno rečeno", "zaista", "naravno", "valja zapamtiti"],
  sr: ["jednostavno rečeno", "zaista", "naravno", "valja zapamtiti"],
  ru: ["попросту", "действительно", "конечно", "стоит помнить"],
};

check("every language has a filler list", CLEAN.every((l) => Array.isArray(FILLER[l])),
  `missing: ${CLEAN.filter((l) => !FILLER[l]).join(", ") || "none"}`);

const filler = [];
for (const r of COPY) {
  for (const w of FILLER[r.lang] || []) if (word(r.text, w)) filler.push({ ...r, w });
}
checkMany("no intensifier and no throat-clearing", filler,
  (r) => `${where(r)} → "${r.w}" | ${r.text.slice(0, 70)}…`);

/* ------------------------------------------------------------------ §7 the budget */

head("§7 how much prose a page carries");

/**
 * §2 caps one paragraph; this caps the page. Chapter XII already says the long SEO text
 * may not stand in front of the calculator and scripts/test-calc-seo.mjs checks that by
 * position — but a page can obey the order and still be a wall, by saying in six
 * paragraphs what two would carry. So the words inside <main> are counted per page type.
 *
 * Every budget below is the widest language of that page type as it stands, rounded up to
 * the next ten. There is no margin on purpose: a session that wants to say more comes
 * here, raises the number and has to say why in its report. That is the whole mechanism
 * the owner asked for — "skrócić plus test, który pilnuje".
 *
 * They did not move between sessions 44 and 45, and that is a measurement rather than an
 * oversight: the widest page of every one of the twenty types is the ENGLISH one, and
 * English was cleaned in session 44. Cutting the other six languages made those pages
 * shorter without touching a single ceiling.
 *
 * Two of them are lists rather than prose and are budgeted as lists: `materials` is the
 * 161-material catalogue and `privacy` is the privacy policy, which carries two complete
 * language versions in one file because Google Play requires one URL.
 *
 * Session 57 added `converter` at 280 (the English page, 274) and raised `calculators`
 * from 350 to 370 (the English hub, 362), and both are list rather than prose. The converter page's <main> is
 * eleven category names and the seventy-odd unit symbols under them — "Długość — mm, cm,
 * dm, m, km, in, ft, yd, mi, nmi" is ten words and one fact — which is what the page is
 * FOR, and it is also the only thing on it a reader with no JavaScript can use. Its prose
 * proper is four sentences. The hub grew by the one card that points at it.
 *
 * Session 59 added `own-materials` at 210 (the widest, English, is 204). Most of that is a
 * form: eleven field labels, five application names and fifteen shop aisles are 60-odd
 * words that are each one label on one control. The prose proper is six sentences — the
 * lead, the two notes saying what the price history does and does not record, the one
 * about the currency, and the two about where the rows live and how a calculator reaches
 * them. It is under the /projekty/ budget it most resembles.
 *
 * The same session raised `cookies` from 540 to 570 (the English page, 564). That page is a
 * table of every store this site writes, one row each, and session 59 added a store: the
 * row names the key and says what is in it. A budget that refused the row would be asking
 * for a store nobody can look up, which is the opposite of what the page is for.
 */
const BUDGET = {
  home: 370, calculators: 370, calculator: 400, converter: 280, guides: 280, guide: 220,
  "own-materials": 210,
  materials: 2280, stores: 150, android: 480, projects: 390, estimate: 190,
  clients: 500, jobs: 520, quotes: 460, calendar: 400, cookies: 570,
  "liczmat-pro": 450, account: 850, dashboard: 130, share: 40, privacy: 3800,
};

/** Every shipped page, with the route that produced it. */
const PAGES = [];
for (const r of liveRoutes()) {
  if (r.view) continue;
  const add = (path) => PAGES.push({
    id: r.id,
    file: `${path.replace(/^\//, "")}${path.endsWith(".html") ? "" : "index.html"}`,
  });
  if (r.generated === false || !r.localized) { add(r.path); continue; }
  for (const lang of LANGS) {
    if (r.each === "calculator") for (const c of CALCS) add(r.path(lang, c));
    else if (r.each === "guide") for (const g of GUIDES) add(r.path(lang, g));
    else add(r.path(lang));
  }
}

/** What a reader sees inside <main>: tags, scripts and entities taken out. */
function prose(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/);
  if (!main) return null;
  return main[0]
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const overBudget = [];
let counted = 0;
for (const page of PAGES) {
  let html;
  try { html = read(page.file); } catch { continue; }
  const text = prose(html);
  if (text === null) continue;
  counted++;
  const n = text.split(" ").filter(Boolean).length;
  const cap = BUDGET[page.id];
  if (cap === undefined) { overBudget.push({ ...page, n, cap: "no budget declared" }); continue; }
  if (n > cap) overBudget.push({ ...page, n, cap });
}

checkMany("every page type has a declared prose budget and stays inside it", overBudget,
  (x) => `${x.file} (${x.id}): ${x.n} words, budget ${x.cap}`, counted);

check("the budgets were measured against real pages", counted > 300, `${counted} pages read`);

/* ------------------------------------------------------------------ the report */

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n${passed} passed, ${failures.length} failed.\n`);
  process.exit(1);
}
console.log(`OK — ${passed} checks: ${COPY.length} strings in ${CLEAN.length} languages, ` +
  `${counted} pages against ${Object.keys(BUDGET).length} budgets.`);
if (NOT_CLEAN.length) {
  console.log(`   §2–§6 skip ${NOT_CLEAN.join(", ")} — session 45's work. ` +
    `§7 measures every page, in all ${LANGS.length} languages.`);
}
