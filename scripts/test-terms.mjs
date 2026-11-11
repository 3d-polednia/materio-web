#!/usr/bin/env node
/** Built terms, cancellation and withdrawal pages. Run after scripts/build.mjs. */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE, LANGS, urlCancel, urlTerms, urlWithdraw,
} from "../src/site.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
let checks = 0;
const check = (condition, message) => {
  if (condition) checks += 1;
  else failures.push(message);
};
const fileFor = (url) => join(ROOT, url.replace(/^\//, ""), "index.html");
const visible = (html) => html
  .replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1\s*>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;|&#34;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const groups = [
  ["terms", urlTerms],
  ["cancel", urlCancel],
  ["withdraw", urlWithdraw],
];

for (const [kind, url] of groups) {
  for (const lang of LANGS) {
    const path = fileFor(url(lang));
    check(existsSync(path), `missing ${kind} page for ${lang}: ${path}`);
    if (!existsSync(path)) continue;
    const html = readFileSync(path, "utf8");
    check((html.match(/<h1\b/gi) || []).length === 1,
      `${kind} page for ${lang} must contain exactly one h1`);
    for (const legalUrl of [urlTerms(lang), urlCancel(lang), urlWithdraw(lang)]) {
      check(html.includes(`href="${legalUrl}"`),
        `${kind} page for ${lang} footer is missing ${legalUrl}`);
    }
    const text = visible(html);
    check(!/[—–]/.test(text), `${kind} page for ${lang} contains U+2014 or U+2013 in visible text`);
  }
}

const germanTermsPath = fileFor(urlTerms("de"));
if (existsSync(germanTermsPath)) {
  check(readFileSync(germanTermsPath, "utf8").includes('data-binding="true"'),
    "German terms page is not marked as binding");
}
for (const lang of LANGS.filter((lang) => lang !== "de")) {
  const path = fileFor(urlTerms(lang));
  if (existsSync(path)) {
    check(readFileSync(path, "utf8").includes(`href="${urlTerms("de")}"`),
      `terms page for ${lang} does not link to the binding German terms`);
  }
}

for (const [url, required] of [
  [urlCancel("de"), ["Verträge hier kündigen", "jetzt kündigen"]],
  [urlWithdraw("de"), ["Vertrag hier widerrufen", "Widerruf bestätigen"]],
]) {
  const path = fileFor(url);
  if (!existsSync(path)) continue;
  const text = visible(readFileSync(path, "utf8"));
  for (const exact of required) check(text.includes(exact), `${url} is missing exact text: ${exact}`);
}

const sitemapPath = join(ROOT, "sitemap.xml");
check(existsSync(sitemapPath), `missing sitemap: ${sitemapPath}`);
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  for (const [, url] of groups) for (const lang of LANGS) {
    check(sitemap.includes(`<loc>${BASE}${url(lang)}</loc>`),
      `sitemap.xml is missing ${BASE}${url(lang)}`);
  }
}

if (failures.length) {
  console.error(`terms pages: ${failures.length} FAILED, ${checks} passed\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`terms pages: ${checks}/${checks} checks pass`);
