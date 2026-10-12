#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DAY, LIFECYCLE_STEPS, MAIL_LINK_URL, lifecycleDecision, lifecycleMessage,
  lifecycleStart, mailPageUrl, newMailToken, parseSurveyAnswer, tokenMatches,
} from "../functions/lifecycle-map.mjs";
import { MAIL_LANGS, escapeHtml } from "../functions/mail-map.mjs";

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };
function check(name, condition, detail = "") {
  if (condition) { passed++; return; }
  failures.push(`${section} - ${name}${detail ? `\n      ${detail}` : ""}`);
}
const eq = (name, got, want) => check(name, JSON.stringify(got) === JSON.stringify(want),
  `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const start = Date.UTC(2026, 9, 1, 10);
const until = start + 14 * DAY;
const base = {
  grant: { grantedAt: start },
  profile: { plan: "premium", planSource: "trial", planValidUntil: until },
  prefs: null, state: null, email: "ala@example.com", disabled: false,
};
const decide = (now, extra = {}) => lifecycleDecision({ ...base, now, ...extra });

head("decision boundaries");
eq("before survey", decide(start + 2 * DAY + 23 * 3600000), { send: null, reason: "nothing-due", skip: [] });
eq("survey begins", decide(start + 3 * DAY), { send: "survey", skip: [] });
eq("survey still due", decide(start + 6 * DAY), { send: "survey", skip: [] });
eq("tips supersedes survey", decide(start + 7 * DAY), { send: "tips", skip: ["survey"] });
eq("tips after survey sent", decide(start + 7 * DAY, { state: { steps: { survey: { status: "sent" } } } }), { send: "tips", skip: [] });
eq("tips until last millisecond", decide(until - 36 * 3600000 - 1), { send: "tips", skip: ["survey"] });
eq("reminder boundary", decide(until - 36 * 3600000), { send: "reminder", skip: ["survey", "tips"] });
eq("trial ended", decide(until), { send: null, reason: "nothing-due", skip: ["survey", "tips"] });
eq("sent reminder is not repeated", decide(until - 3600000, { state: { steps: { reminder: { status: "sent" } } } }), { send: null, reason: "nothing-due", skip: ["survey", "tips"] });
eq("paid account gets no reminder", decide(until - 3600000, { profile: { plan: "premium", planValidUntil: until } }), { send: null, reason: "paid", skip: ["survey", "tips"] });

head("guards and start");
eq("opted out", decide(start + 3 * DAY, { prefs: { optOut: true } }), { send: null, reason: "opted-out", skip: [] });
eq("no email", decide(start + 3 * DAY, { email: null }), { send: null, reason: "no-email", skip: [] });
eq("disabled", decide(start + 3 * DAY, { disabled: true }), { send: null, reason: "disabled", skip: [] });
eq("no trial", decide(start + 3 * DAY, { grant: null, profile: {} }), { send: null, reason: "no-trial", skip: [] });
eq("fallback start", lifecycleStart({ grant: null, profile: { planValidUntil: until } }), until - 14 * DAY);

head("tokens");
eq("new token is 32 hex chars", newMailToken((size) => Buffer.alloc(size, 0xab)), "ab".repeat(16));
eq("equal token", tokenMatches("ab".repeat(16), "ab".repeat(16)), true);
eq("different token", tokenMatches("ab".repeat(16), "ac".repeat(16)), false);
eq("different length", tokenMatches("ab", "abcd"), false);
eq("undefined", tokenMatches(undefined, "abcd"), false);

head("survey answers");
eq("use only", parseSurveyAnswer({ use: "home" }), { ok: true, use: "home", missing: "" });
eq("missing only", parseSurveyAnswer({ missing: "  More reports  " }), { ok: true, use: null, missing: "More reports" });
eq("both values", parseSurveyAnswer({ use: "business", missing: "Export" }), { ok: true, use: "business", missing: "Export" });
eq("both empty", parseSurveyAnswer({ use: "", missing: "  " }), { ok: false });
eq("wrong use type", parseSurveyAnswer({ use: 1, missing: "x" }), { ok: false });
eq("wrong missing type", parseSurveyAnswer({ use: "home", missing: 1 }), { ok: false });
eq("unknown use", parseSurveyAnswer({ use: "school" }), { ok: false });
eq("too long", parseSurveyAnswer({ missing: "x".repeat(1001) }), { ok: false });

head("messages");
eq("three lifecycle steps", LIFECYCLE_STEPS, ["survey", "tips", "reminder"]);
eq("thirteen languages", MAIL_LANGS.length, 13);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const lang of MAIL_LANGS) {
  for (const step of LIFECYCLE_STEPS) {
    const message = lifecycleMessage(step, {
      lang, displayName: "<b>Ala</b>", until, uid: "user 1", token: "ab".repeat(16),
    });
    check(`${lang}/${step} subject`, Boolean(message.subject));
    check(`${lang}/${step} text`, Boolean(message.text));
    check(`${lang}/${step} html`, Boolean(message.html));
    check(`${lang}/${step} escapes name`, message.html.includes(escapeHtml("<b>Ala</b>")) && !message.html.includes("<b>Ala</b>"));
    check(`${lang}/${step} no long dash`, !/[—–]/.test(message.subject + message.text + message.html));
    check(`${lang}/${step} unsubscribe header`, message.headers["List-Unsubscribe"].includes(MAIL_LINK_URL) && message.headers["List-Unsubscribe"].includes("mailto:contact@liczmat.com"));
    eq(`${lang}/${step} one-click header`, message.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    check(`${lang}/${step} unsubscribe page`, message.html.includes("a=unsub"));
    if (step === "survey") {
      check(`${lang} rating table`, message.html.includes('<table role="presentation"'));
      eq(`${lang} five rating cells`, (message.html.match(/border: 1px solid #91d206/g) || []).length, 5);
      for (let rating = 1; rating <= 5; rating++) check(`${lang} rating ${rating}`, message.html.includes(`a=rate&amp;u=user+1&amp;t=${"ab".repeat(16)}&amp;r=${rating}`));
    }
    if (step === "tips") {
      const withoutHrefs = message.html.replace(/(?:href|src)="[^"]*"/g, "");
      check(`${lang} no visible raw URL`, !withoutHrefs.includes("https://"));
    }
    if (step === "reminder") {
      const date = new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(until);
      check(`${lang} localized date`, message.text.includes(date));
    }
  }
  const links = lifecycleMessage("tips", { lang, displayName: null, until, uid: "u", token: "t" }).links;
  for (const path of Object.values(links)) check(`${lang} path exists: ${path}`, existsSync(join(root, path, "index.html")));
  check(`${lang} mail page prefix`, mailPageUrl(lang, { a: "unsub", u: "u", t: "t" }).includes(`${lang === "pl" ? "" : `/${lang}`}/maile/`));
}

const datePrepositions = { fr: " le ", it: " il ", es: " el ", ro: " pe ", nl: " op ", de: " am ", en: " on " };
for (const [lang, preposition] of Object.entries(datePrepositions)) {
  const reminder = lifecycleMessage("reminder", { lang, displayName: null, until, uid: "u", token: "t" });
  check(`${lang} reminder date preposition`, reminder.subject.toLowerCase().includes(preposition) && reminder.text.toLowerCase().includes(preposition));
}

// The owner, 2026-10-12: "Cześć, Michał Polednia." reads stiff; the greeting carries the first name only.
for (const step of LIFECYCLE_STEPS) {
  const message = lifecycleMessage(step, { lang: "pl", displayName: "Michał Polednia", until, uid: "u", token: "t" });
  check(`${step} greets by first name`, message.text.startsWith("Cześć, Michał.") && !message.text.includes("Polednia") && !message.html.includes("Polednia"));
}
const byAddress = lifecycleMessage("survey", { lang: "pl", displayName: "jan@example.com", until, uid: "u", token: "t" });
check("an e-mail address in place of a name is not used as a name", byAddress.text.startsWith("Cześć. "));
const spaced = lifecycleMessage("survey", { lang: "en", displayName: "  Anna   Maria Nowak ", until, uid: "u", token: "t" });
check("extra spaces around the name are ignored", spaced.text.startsWith("Hello, Anna."));

// On a phone the logo beside the text was wider than the screen and Gmail cut the right edge
// of every line (owner's screenshots, 2026-10-12). The signature stacks: logo, then text.
const stacked = lifecycleMessage("survey", { lang: "pl", displayName: "Michał", until, uid: "u", token: "t" }).html;
check("signature stacks the logo above the text", !stacked.includes("border-left") && stacked.indexOf("liczmat-logo.png") < stacked.indexOf("Zespół LiczMat"));

if (failures.length) {
  console.error(`\nlifecycle map: ${failures.length} FAILED, ${passed} passed\n`);
  for (const failure of failures) console.error(`  x ${failure}`);
  process.exit(1);
}
console.log(`lifecycle map: ${passed}/${passed} checks pass`);
