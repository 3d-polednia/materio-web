#!/usr/bin/env node
/** Quote sharing helpers, without a browser. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...parts) => join(ROOT, ...parts);
const read = (file) => readFileSync(p(file), "utf8");
function evalScript(file, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${read(file)}\nreturn {${returns.join(",")}};`)(
    ...names.map((name) => globals[name]),
  );
}

const document = {
  readyState: "loading",
  documentElement: { lang: "pl" },
  addEventListener() {},
};
const window = { addEventListener() {} };
const share = evalScript("assets/quotes-ui.js", [
  "quoSharePhone", "quoShareMailto", "quoShareWhatsApp", "quoShareSms",
], { document, window });
const { pdfQuoteLogo } = evalScript("assets/pdf-export.js", ["pdfQuoteLogo"], {
  document, window,
});

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

head("phone normalization");
for (const [lang, input, want] of [
  ["pl", "600 123 456", "48600123456"],
  ["pl", "+48 600-123-456", "48600123456"],
  ["pl", "0048 600123456", "48600123456"],
  ["de", "0171 1234567", "491711234567"],
  ["it", "06 1234567", "39061234567"],
  ["en", "07700 900123", ""],
  ["en", "+44 7700 900123", "447700900123"],
  ["pl", "", ""],
]) eq(`${lang} ${JSON.stringify(input)}`, share.quoSharePhone(input, lang), want);

head("email links");
{
  const href = share.quoShareMailto("jan@firma.pl", "Wycena łazienki & kuchni", "Dzień dobry,\noto wycena & link.");
  check("the address keeps @ unencoded", href.startsWith("mailto:jan@firma.pl?subject="), href);
  check("the subject is percent-encoded", href.includes("subject=Wycena%20%C5%82azienki%20%26%20kuchni"), href);
  check("the body encodes Polish letters, ampersand and newline",
    href.includes("body=Dzie%C5%84%20dobry%2C%0Aoto%20wycena%20%26%20link."), href);
  for (const bad of ["a b@c", "x?y@z", "bez-malpy"]) {
    check(`${JSON.stringify(bad)} produces an empty to`,
      share.quoShareMailto(bad, "s", "b").startsWith("mailto:?subject="));
  }
}

head("message links");
eq("WhatsApp with a phone", share.quoShareWhatsApp("48600123456", "Dzień & noc"),
  "https://wa.me/48600123456?text=Dzie%C5%84%20%26%20noc");
eq("WhatsApp without a phone", share.quoShareWhatsApp("", "Dzień & noc"),
  "https://wa.me/?text=Dzie%C5%84%20%26%20noc");
eq("SMS", share.quoShareSms("48600123456", "Dzień & noc"),
  "sms:48600123456?&body=Dzie%C5%84%20%26%20noc");

head("logo URLs");
for (const url of ["data:image/png;base64,iVBORw0KGgo=", "data:image/jpeg;base64,/9j/4AAQSkZJRg=="]) {
  eq(`accepts ${url.slice(0, 22)}`, pdfQuoteLogo(url), url);
}
for (const url of ["javascript:alert(1)", "data:image/svg+xml;base64,PHN2Zz4=", "http://example.com/logo.png", "x".repeat(400001)]) {
  eq(`rejects ${url.slice(0, 32)}`, pdfQuoteLogo(url), "");
}

const total = passed + failures.length;
console.log(`\nquote share: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.log(`  ✗ ${failure}`));
  process.exit(1);
}
