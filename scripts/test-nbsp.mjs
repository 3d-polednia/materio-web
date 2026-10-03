#!/usr/bin/env node
/**
 * Polish typography: non-breaking spaces for one-letter words (sierotki).
 *
 *     node scripts/test-nbsp.mjs
 *
 * Dependency-free, plain node, exit 1 on failure.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { nbspHtml, nbspShortWords } from "../src/nbsp.mjs";

/* ------------------------------------------------------------------ the runner */

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };

function check(name, cond, detail) {
  try {
    assert.ok(cond, detail || name);
    passed++;
    return true;
  } catch (err) {
    failures.push(`${section}: ${name}${detail ? `\n      ${detail}` : ""}`);
    return false;
  }
}

const eq = (name, got, want) => {
  try {
    assert.strictEqual(got, want);
    passed++;
    return true;
  } catch (err) {
    failures.push(`${section}: ${name}\n      expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
    return false;
  }
};

/* ================================================================== 1. Polish sentence with prepositions */

head("1. pl: prepositions in a sentence become non-breaking spaces");
{
  const input = "Kalkulatory działają też w telefonie, bez internetu, i zapisują wynik w projekcie.";
  const want = "Kalkulatory działają też w\u00a0telefonie, bez internetu, i\u00a0zapisują wynik w\u00a0projekcie.";
  eq("spaces after w, i, w become U+00A0 and nothing else changes", nbspShortWords(input, "pl"), want);
}

/* ================================================================== 2. Polish preposition followed by diacritics */

head("2. pl: projekt z tą datą binds z to tą");
{
  eq("z is bound to tą", nbspShortWords("projekt z tą datą", "pl"), "projekt z\u00a0tą datą");
}

/* ================================================================== 3. Consecutive short words chain and uppercase */

head("3. pl chain: consecutive short words and uppercase at string start");
{
  eq("i w domu chains both prepositions", nbspShortWords("i w domu", "pl"), "i\u00a0w\u00a0domu");
  eq("W domu binds uppercase W at string start", nbspShortWords("W domu", "pl"), "W\u00a0domu");
  eq("A to binds uppercase A at string start", nbspShortWords("A to", "pl"), "A\u00a0to");
  eq("three short words chain: a i w domu", nbspShortWords("a i w domu", "pl"), "a\u00a0i\u00a0w\u00a0domu");
  eq("uppercase chain: I w domu", nbspShortWords("I w domu", "pl"), "I\u00a0w\u00a0domu");
}

/* ================================================================== 4. Words ending in short letter */

head("4. pl: words ending in short letter are untouched");
{
  eq("dom i has no trailing space after i", nbspShortWords("dom i", "pl"), "dom i");
  eq("kawa contains letters from list but is untouched", nbspShortWords("kawa", "pl"), "kawa");
  eq("ewa i has a at end of word and i at end of string", nbspShortWords("ewa i", "pl"), "ewa i");
  eq("kawa i herbata binds only i", nbspShortWords("kawa i herbata", "pl"), "kawa i\u00a0herbata");
  eq("żółw ends in w preceded by ł and is untouched", nbspShortWords("żółw i zając", "pl"), "żółw i\u00a0zając");
  eq("jeża ends in a preceded by ż and is untouched", nbspShortWords("jeża i lisa", "pl"), "jeża i\u00a0lisa");
  eq("tabs are untouched", nbspShortWords("w\tdomu", "pl"), "w\tdomu");
  eq("newlines are untouched", nbspShortWords("w\ndomu", "pl"), "w\ndomu");
}

/* ================================================================== 5. Opening quote and bracket */

head("5. pl: short words after opening quote or bracket");
{
  eq("after Polish opening quote: „w domu”", nbspShortWords("„w domu”", "pl"), "„w\u00a0domu”");
  eq("after opening parenthesis: (z kartonu)", nbspShortWords("(z kartonu)", "pl"), "(z\u00a0kartonu)");
  eq("after ASCII double quote: \"w domu\"", nbspShortWords('"w domu"', "pl"), '"w\u00a0domu"');
  eq("after opening square bracket: [w domu]", nbspShortWords("[w domu]", "pl"), "[w\u00a0domu]");
}

/* ================================================================== 6. Czech and Slovak */

head("6. cs and sk: single-letter prepositions bound");
{
  eq("cs: v Praze a k domu binds all three", nbspShortWords("v Praze a k domu", "cs"), "v\u00a0Praze a\u00a0k\u00a0domu");
  eq("sk: v Praze a k domu binds all three", nbspShortWords("v Praze a k domu", "sk"), "v\u00a0Praze a\u00a0k\u00a0domu");
  eq("cs: other short words k o s u z", nbspShortWords("k lesu o víkendu s bratrem u rybníka z lásky", "cs"),
    "k\u00a0lesu o\u00a0víkendu s\u00a0bratrem u\u00a0rybníka z\u00a0lásky");
  eq("hr: binds a i k o s u v but not z", nbspShortWords("u kući i u vrtu z bratom", "hr"), "u\u00a0kući i\u00a0u\u00a0vrtu z bratom");
  eq("sr: binds a i k o s u v but not z", nbspShortWords("u kući i u gradu z bratom", "sr"), "u\u00a0kući i\u00a0u\u00a0gradu z bratom");
}

/* ================================================================== 7. Other languages */

head("7. en, de and other languages: returned unchanged");
{
  eq("en: a car unchanged", nbspShortWords("a car", "en"), "a car");
  eq("en: I am unchanged", nbspShortWords("I am", "en"), "I am");
  eq("de: in der Schule unchanged", nbspShortWords("in der Schule", "de"), "in der Schule");
  eq("de: a car and o unchanged", nbspShortWords("a car and o", "de"), "a car and o");
  for (const lang of ["uk", "ro", "it", "nl", "es", "fr"]) {
    eq(`${lang}: short words unchanged`, nbspShortWords("a i o u w z", lang), "a i o u w z");
  }
}

/* ================================================================== 8. Idempotency */

head("8. idempotent: applying twice equals applying once");
{
  const text1 = "Kalkulatory działają też w telefonie, bez internetu, i zapisują wynik w projekcie.";
  eq("sentence idempotent", nbspShortWords(nbspShortWords(text1, "pl"), "pl"), nbspShortWords(text1, "pl"));
  const text2 = "i w domu";
  eq("chain idempotent", nbspShortWords(nbspShortWords(text2, "pl"), "pl"), nbspShortWords(text2, "pl"));
  const text3 = "v Praze a k domu";
  eq("cs chain idempotent", nbspShortWords(nbspShortWords(text3, "cs"), "cs"), nbspShortWords(text3, "cs"));
}

/* ================================================================== 9. Non-string inputs */

head("9. non-string input returned unchanged");
{
  eq("null", nbspShortWords(null, "pl"), null);
  eq("undefined", nbspShortWords(undefined, "pl"), undefined);
  eq("number 42", nbspShortWords(42, "pl"), 42);
  eq("number 0", nbspShortWords(0, "pl"), 0);
  eq("boolean false", nbspShortWords(false, "pl"), false);
  const obj = { text: "w domu" };
  eq("object reference", nbspShortWords(obj, "pl"), obj);
}

/* ================================================================== 10. URL in plain text */

head("10. text containing a URL: documented behavior");
{
  /* Input is plain text (not HTML and not URL-parsed). The slash preceding "a" acts as a
     word boundary, so the space directly following "a" is bound to "b". Callers never pass
     URLs to this helper, so this behavior is acceptable and pinned by this test. */
  const url = "https://liczmat.com/a b";
  const expected = "https://liczmat.com/a\u00a0b";
  eq("slash before a acts as word boundary and binds trailing space", nbspShortWords(url, "pl"), expected);
}

/* ================================================================== 11. runtime table parity */

head("11. browser runtime keeps the same language tables");
{
  const runtime = readFileSync(new URL("../assets/i18n-runtime.js", import.meta.url), "utf8");
  const match = runtime.match(/var LM_SHORT_WORDS = (\{[\s\S]*?\n\});/);
  check("runtime table is present", match);
  if (match) {
    const table = Function(`return (${match[1]})`)();
    const expected = {
      pl: ["a", "i", "o", "u", "w", "z"],
      cs: ["a", "i", "k", "o", "s", "u", "v", "z"],
      sk: ["a", "i", "k", "o", "s", "u", "v", "z"],
      hr: ["a", "i", "k", "o", "s", "u", "v"],
      sr: ["a", "i", "k", "o", "s", "u", "v"],
    };
    eq("runtime table matches src/nbsp.mjs", JSON.stringify(table), JSON.stringify(expected));
  }
}

head("12. a whole page: text between tags only");
{
  const N = " ";
  const page = [
    "<html lang=\"pl\"><head><title>Farba i grunt</title>",
    "<script>if (a < b && c) { x = \"w domu\"; }</script><style>a i { color: red }</style></head>",
    "<body><p class=\"a b\" title=\"w domu\">Wynik zapisujesz w projekcie, <b>z pomieszczeniami</b> i listą.</p>",
    "<textarea>w domu</textarea><pre>i tak</pre><a href=\"/a b\">o tym</a></body></html>",
  ].join("");
  const out = nbspHtml(page, "pl");
  check("prose in a paragraph is bound", out.includes(`zapisujesz w${N}projekcie`) && out.includes(`</b> i${N}listą`));
  check("text right after a tag is bound", out.includes(`<b>z${N}pomieszczeniami`) && out.includes(`>o${N}tym<`));
  check("the title is bound", out.includes(`<title>Farba i${N}grunt</title>`));
  check("attributes are untouched", out.includes(`class="a b" title="w domu"`) && out.includes(`href="/a b"`));
  check("script content is untouched", out.includes(`x = "w domu"`));
  check("style content is untouched", out.includes("a i { color: red }"));
  check("textarea and pre are untouched", out.includes("<textarea>w domu</textarea>") && out.includes("<pre>i tak</pre>"));
  eq("only spaces changed, nothing else", out.replace(/\u00a0/g, " "), page);
  eq("a language without the rule is returned as is", nbspHtml(page, "en"), page);
  eq("idempotent on a page", nbspHtml(out, "pl"), out);
}

/* ------------------------------------------------------------------ report */

const total = passed + failures.length;
console.log(`\nnbsp: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
