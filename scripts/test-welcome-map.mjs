#!/usr/bin/env node
/**
 * LiczMat — wiadomości powitalne (welcome mails), sprawdzone bez chmury.
 *
 *     node scripts/test-welcome-map.mjs
 *
 * Logika decyzyjna wiadomości powitalnej w `functions/welcome-map.mjs`. Sprawdzana
 * zwykłym `node`, bez firebase-admin i zewnętrznych bibliotek (nodemailer).
 *
 * Sprawdzane jest:
 * 1. welcomeLang: valid langs, "de-DE" -> "de", missing/unknown/null profile -> "pl".
 * 2. welcomeDecision: marker exists -> already-sent; no email -> no-email; otherwise send.
 * 3. welcomeMessage for EVERY language: subject, text and html non-empty; contains "14"; 
 *    contains the calculators URL for that language; contains https://liczmat.com/app/ 
 *    and the Play link, localized signature and legal links; contains no VAT id.
 * 4. No U+2014 and no U+2013 in any subject/text/html of any language.
 * 5. displayName "<script>alert(1)</script>" is escaped in html, unescaped in text.
 * 6. The calculators paths equal urlCalcIndex(lang) from src/site.mjs.
 * 7. Contact and privacy paths equal src/site.mjs.
 * 8. welcomeMarkerDoc shape: exactly the keys uid, lang, createdAt, status.
 */

import assert from "node:assert";
import {
  WELCOME_LANGS,
  welcomeLang,
  welcomeDecision,
  welcomeMessage,
  welcomeMarkerDoc
} from "../functions/welcome-map.mjs";
import { URL_CONTACT, URL_PRIVACY } from "../functions/mail-map.mjs";
import { urlCalcIndex, urlContact, urlPrivacy } from "../src/site.mjs";

const TEAM = {
  pl: "Zespół LiczMat", de: "Das LiczMat-Team", en: "The LiczMat team", uk: "Команда LiczMat",
  cs: "Tým LiczMat", sk: "Tím LiczMat", ro: "Echipa LiczMat", hr: "Tim LiczMat",
  sr: "Tim LiczMat", it: "Il team di LiczMat", nl: "Het LiczMat-team",
  es: "El equipo de LiczMat", fr: "L'équipe LiczMat"
};

let passed = 0;
const failures = [];

function head(text) {
  console.log(text);
}

function eq(label, act, exp) {
  if (act !== exp) failures.push(`${label}: exp ${exp}, act ${act}`);
  else passed++;
}

function check(label, cond) {
  if (!cond) failures.push(label);
  else passed++;
}

/* 1. welcomeLang */
head("1. welcomeLang");
{
  eq("null profile gives pl", welcomeLang(null), "pl");
  eq("missing lang gives pl", welcomeLang({}), "pl");
  eq("de-DE gives de", welcomeLang({ lang: "de-DE" }), "de");
  eq("EN gives en", welcomeLang({ lang: "EN" }), "en");
  eq("pl gives pl", welcomeLang({ lang: "pl" }), "pl");
  eq("unknown gives pl", welcomeLang({ lang: "xx" }), "pl");
}

/* 2. welcomeDecision */
head("2. welcomeDecision");
{
  const resAlready = welcomeDecision({ marker: { uid: "123" }, email: "test@test.com" });
  eq("marker exists -> already-sent", resAlready.send, false);
  eq("marker exists -> reason already-sent", resAlready.reason, "already-sent");

  const resNoEmail = welcomeDecision({ marker: null, email: null });
  eq("no email -> no-email", resNoEmail.send, false);
  eq("no email -> reason no-email", resNoEmail.reason, "no-email");

  const resSend = welcomeDecision({ marker: null, email: "test@test.com" });
  eq("otherwise -> send", resSend.send, true);
}

/* 3 & 4 & 6. welcomeMessage for EVERY language */
head("3, 4, 6. welcomeMessage checks");
{
  for (const lang of WELCOME_LANGS) {
    const msg = welcomeMessage({ lang, displayName: "Test User" });
    
    check(`[${lang}] subject non-empty`, msg.subject && msg.subject.length > 0);
    check(`[${lang}] text non-empty`, msg.text && msg.text.length > 0);
    check(`[${lang}] html non-empty`, msg.html && msg.html.length > 0);
    
    check(`[${lang}] text contains 14`, msg.text.includes("14"));
    check(`[${lang}] html contains 14`, msg.html.includes("14"));

    const calcUrl = urlCalcIndex(lang);
    check(`[${lang}] text contains calc URL ${calcUrl}`, msg.text.includes(calcUrl));
    check(`[${lang}] html contains calc URL ${calcUrl}`, msg.html.includes(calcUrl));

    check(`[${lang}] text contains app link`, msg.text.includes("https://liczmat.com/app/"));
    check(`[${lang}] html contains app link`, msg.html.includes("https://liczmat.com/app/"));

    check(`[${lang}] text contains Play link`, msg.text.includes("https://play.google.com/store/apps/details?id=pl.materio.app"));
    check(`[${lang}] html contains Play link`, msg.html.includes("https://play.google.com/store/apps/details?id=pl.materio.app"));

    for (const value of [TEAM[lang], `https://liczmat.com${URL_CONTACT[lang]}`,
      `https://liczmat.com${URL_PRIVACY[lang]}`]) {
      check(`[${lang}] text contains ${value}`, msg.text.includes(value));
      check(`[${lang}] html contains ${value}`, msg.html.includes(value));
    }
    check(`[${lang}] text has no VAT id`, !msg.text.includes("DE329791818"));
    check(`[${lang}] html has no VAT id`, !msg.html.includes("DE329791818"));

    // No em-dash or en-dash
    check(`[${lang}] no em-dash in subject`, !msg.subject.includes("\u2014"));
    check(`[${lang}] no en-dash in subject`, !msg.subject.includes("\u2013"));
    check(`[${lang}] no em-dash in text`, !msg.text.includes("\u2014"));
    check(`[${lang}] no en-dash in text`, !msg.text.includes("\u2013"));
    check(`[${lang}] no em-dash in html`, !msg.html.includes("\u2014"));
    check(`[${lang}] no en-dash in html`, !msg.html.includes("\u2013"));
  }
}

/* 5. displayName escaping */
head("5. displayName escaping");
{
  const msg = welcomeMessage({ lang: "pl", displayName: "<script>alert(1)</script>" });
  check("escaped in html", !msg.html.includes("<script>alert(1)</script>"));
  check("escaped entities present in html", msg.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  check("unescaped in text", msg.text.includes("<script>alert(1)</script>"));
}

/* 7. frozen legal paths equal src/site.mjs */
head("7. legal URL maps");
{
  for (const lang of WELCOME_LANGS) {
    eq(`[${lang}] contact`, URL_CONTACT[lang], urlContact(lang));
    eq(`[${lang}] privacy`, URL_PRIVACY[lang], urlPrivacy(lang));
  }
}

/* 8. welcomeMarkerDoc shape */
head("8. welcomeMarkerDoc shape");
{
  const doc = welcomeMarkerDoc("u123", 1000, "pl");
  const keys = Object.keys(doc).sort().join(",");
  eq("keys exactly uid, lang, createdAt, status", keys, "createdAt,lang,status,uid");
  eq("uid matches", doc.uid, "u123");
  eq("lang matches", doc.lang, "pl");
  eq("createdAt matches", doc.createdAt, 1000);
  eq("status is sending", doc.status, "sending");
}

/* result */
if (failures.length) {
  console.error(`\nwelcome map: ${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`welcome map: ${passed}/${passed} checks pass`);
