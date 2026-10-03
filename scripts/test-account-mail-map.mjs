#!/usr/bin/env node
import assert from "node:assert";
import {
  ACCOUNT_MAIL_TYPES, TARGET_LIMIT, changeEmail, limitDecision, parseAccountMail,
  resetPassword, verifyEmail
} from "../functions/account-mail-map.mjs";
import { MAIL_LANGS, URL_CONTACT, URL_PRIVACY } from "../functions/mail-map.mjs";
import { urlContact, urlPrivacy } from "../src/site.mjs";

let passed = 0;
const failures = [];
const check = (name, value) => value ? passed++ : failures.push(name);
const eq = (name, got, want) => check(`${name}: ${JSON.stringify(got)} != ${JSON.stringify(want)}`, got === want);
const link = "https://example.test/action?x=1&y=2";

console.log("1. three messages in thirteen languages");
for (const lang of MAIL_LANGS) {
  const messages = {
    verify: verifyEmail({ lang, displayName: "Jan", link }),
    reset: resetPassword({ lang, link }),
    change: changeEmail({ lang, link, newEmail: "new@example.com" })
  };
  for (const [type, msg] of Object.entries(messages)) {
    check(`[${lang}/${type}] subject`, Boolean(msg.subject));
    check(`[${lang}/${type}] text`, Boolean(msg.text));
    check(`[${lang}/${type}] html`, Boolean(msg.html));
    check(`[${lang}/${type}] text link`, msg.text.includes(link));
    check(`[${lang}/${type}] html link`, msg.html.includes("https://example.test/action?x=1&amp;y=2"));
    check(`[${lang}/${type}] Outlook button`, msg.html.includes('bgcolor="#91d206"'));
    check(`[${lang}/${type}] Impressum`, msg.text.includes("Impressum") && msg.html.includes("Impressum"));
    for (const path of [URL_CONTACT[lang], URL_PRIVACY[lang]]) {
      check(`[${lang}/${type}] ${path}`, msg.text.includes(path) && msg.html.includes(path));
    }
    check(`[${lang}/${type}] no dash`, !/[\u2013\u2014]/.test(msg.subject + msg.text + msg.html));
    check(`[${lang}/${type}] no VAT`, !msg.text.includes("DE329791818") && !msg.html.includes("DE329791818"));
  }
  eq(`[${lang}] contact map`, URL_CONTACT[lang], urlContact(lang));
  eq(`[${lang}] privacy map`, URL_PRIVACY[lang], urlPrivacy(lang));
}

console.log("2. user values are escaped");
{
  const verify = verifyEmail({ lang: "pl", displayName: "<script>alert(1)</script>", link });
  const change = changeEmail({ lang: "pl", newEmail: "<script>@example.com", link });
  check("displayName escaped", verify.html.includes("&lt;script&gt;") && !verify.html.includes("<script>"));
  check("newEmail escaped", change.html.includes("&lt;script&gt;@example.com") && !change.html.includes("<script>"));
}

console.log("3. validation and fallback");
eq("verify", parseAccountMail({ type: "verify", lang: "de-DE" }).lang, "de");
eq("fallback", parseAccountMail({ type: "verify", lang: "xx" }).lang, "pl");
eq("unknown type", parseAccountMail({ type: "other" }).error, "bad-type");
eq("bad reset email", parseAccountMail({ type: "reset", email: "wrong" }).error, "bad-email");
eq("bad change email", parseAccountMail({ type: "change", newEmail: "wrong" }).error, "bad-email");
eq("normalized email", parseAccountMail({ type: "reset", email: " A@Example.COM " }).email, "a@example.com");
eq("three types", ACCOUNT_MAIL_TYPES.join(","), "verify,reset,change");

console.log("4. hourly limit");
{
  const now = 10_000_000;
  let timestamps = [];
  for (let i = 0; i < TARGET_LIMIT; i++) {
    const result = limitDecision(timestamps, now + i, TARGET_LIMIT);
    check(`mail ${i + 1} allowed`, result.allowed);
    timestamps = result.timestamps;
  }
  check("fourth refused", !limitDecision(timestamps, now + 3, TARGET_LIMIT).allowed);
  const expired = limitDecision([now - 3_600_001, now - 3_600_002, now - 3_600_003], now, TARGET_LIMIT);
  check("old timestamps expire", expired.allowed && expired.timestamps.length === 1);
}

if (failures.length) {
  console.error(`\naccount mail map: ${failures.length} FAILED, ${passed} passed`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}
assert.equal(failures.length, 0);
console.log(`account mail map: ${passed}/${passed} checks pass`);
