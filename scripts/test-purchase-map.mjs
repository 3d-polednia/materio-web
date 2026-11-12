#!/usr/bin/env node
/** Purchase confirmation mapping and durable-medium content, without Firebase or SMTP. */

import assert from "node:assert/strict";

import {
  PURCHASE_LINKS, PURCHASE_URLS, purchaseDecision, purchaseLang, purchaseMail,
} from "../functions/purchase-map.mjs";
import { TERMS as GENERATED_TERMS } from "../functions/terms-data.mjs";
import { ENTITY } from "../functions/site-entity.mjs";
import { TERMS as SOURCE_TERMS } from "../src/terms/index.mjs";
import { LANGS, urlCancel, urlTerms, urlWithdraw } from "../src/site.mjs";

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const deep = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };

const MONTHLY = "plink_1UEQlvGmEsit3k9gVDOuLwjI";
const YEARLY = "plink_1UEQlyGmEsit3k9gairU58Jw";
const CREATED = 1_794_413_640;
const baseSession = {
  object: "checkout.session",
  id: "cs_live_purchase_1",
  livemode: true,
  payment_link: MONTHLY,
  customer_details: { email: "buyer@example.com" },
  customer_email: null,
  status: "complete",
  amount_total: 999,
  currency: "eur",
  created: CREATED,
  locale: "de",
};

{
  const decision = purchaseDecision(baseSession, { liveMode: true });
  eq(decision.send, true, "valid live monthly Checkout Session sends");
  eq(decision.plan, "monthly", "monthly Payment Link selects the monthly plan");
  eq(decision.sessionId, baseSession.id, "session id is preserved");
  eq(decision.email, "buyer@example.com", "customer_details email is used first");
  eq(decision.amountMinor, 999, "minor amount is preserved");
  eq(decision.currency, "eur", "Stripe currency is preserved");
  eq(decision.createdMs, CREATED * 1000, "Stripe seconds become milliseconds");
}

{
  const decision = purchaseDecision({ ...baseSession, payment_link: YEARLY }, { liveMode: true });
  eq(decision.send, true, "valid live yearly Checkout Session sends");
  eq(decision.plan, "yearly", "yearly Payment Link selects the yearly plan");
}

eq(purchaseDecision({ ...baseSession, livemode: false }, { liveMode: true }).send, false,
  "test-mode session does not send in live mode");
eq(purchaseDecision({ ...baseSession, payment_link: "plink_other" }, { liveMode: true }).send, false,
  "unknown Payment Link does not send");
eq(purchaseDecision({ ...baseSession, customer_details: {}, customer_email: null }, { liveMode: true }).send, false,
  "session without an email does not send");
eq(purchaseDecision({ ...baseSession, status: "open" }, { liveMode: true }).send, false,
  "present non-complete status does not send");
eq(purchaseDecision({ ...baseSession, object: "payment_intent" }, { liveMode: true }).send, false,
  "non-Checkout object does not send");
eq(purchaseDecision({ ...baseSession, id: "" }, { liveMode: true }).send, false,
  "Checkout Session without an id does not send");
eq(purchaseDecision({ ...baseSession, status: undefined }, { liveMode: true }).send, false,
  "a present undefined status is not complete");

{
  const fallback = purchaseDecision({
    ...baseSession, customer_details: {}, customer_email: "fallback@example.com",
  }, { liveMode: true });
  eq(fallback.send, true, "customer_email fallback sends");
  eq(fallback.email, "fallback@example.com", "customer_email is returned");
}

{
  const withoutStatus = { ...baseSession };
  delete withoutStatus.status;
  eq(purchaseDecision(withoutStatus, { liveMode: true }).send, true,
    "an absent status field is accepted");
}

deep(PURCHASE_LINKS, { [MONTHLY]: "monthly", [YEARLY]: "yearly" },
  "only the two live Payment Links are mapped");

eq(purchaseLang({ lang: "DE-de" }, { locale: "fr" }), "de",
  "profile language uses the welcomeLang two-letter rule");
eq(purchaseLang({ lang: "xx" }, { locale: "fr" }), "fr",
  "Stripe locale follows an unknown profile language");
eq(purchaseLang(null, { locale: "uk" }), "uk", "Stripe locale is used without a profile");
eq(purchaseLang(null, { locale: "de-DE" }), "pl", "Stripe locale must be one of the exact site codes");
eq(purchaseLang({ lang: "xx" }, { locale: "auto" }), "pl", "unknown languages fall back to Polish");

const PLAN_WORD = Object.freeze({
  pl: "miesięczny", uk: "щомісячний", de: "monatlich", en: "monthly",
  cs: "měsíční", sk: "mesačný", ro: "lunar", hr: "mjesečni", sr: "mesečni",
  it: "mensile", nl: "maandelijks", es: "mensual", fr: "mensuel",
});

const expectedPrice = (lang, amountMinor, currency) => {
  const formatter = new Intl.NumberFormat(lang, { style: "currency", currency });
  return formatter.format(amountMinor / (10 ** formatter.resolvedOptions().maximumFractionDigits));
};

for (const lang of LANGS) {
  const urls = {
    terms: `https://liczmat.com${urlTerms(lang)}`,
    cancel: `https://liczmat.com${urlCancel(lang)}`,
    withdraw: `https://liczmat.com${urlWithdraw(lang)}`,
  };
  deep(PURCHASE_URLS[lang], urls, `${lang} functions URL table matches src/site.mjs`);

  const mail = purchaseMail({
    lang, plan: "monthly", amountMinor: 123456, currency: "EUR",
    createdMs: CREATED * 1000, email: "buyer@example.com",
  });
  const price = expectedPrice(lang, 123456, "EUR");
  const withdrawal = SOURCE_TERMS[lang].sections.find((section) => section.id === "widerruf");
  ok(mail.subject.length > 0, `${lang} subject exists`);
  ok(mail.text.length > 0, `${lang} plain text exists`);
  ok(mail.html.length > 0, `${lang} HTML exists`);
  for (const [kind, content] of [["text", mail.text], ["html", mail.html]]) {
    ok(content.includes(price), `${lang} ${kind} contains the formatted price`);
    ok(content.includes(PLAN_WORD[lang]), `${lang} ${kind} contains the plan word`);
    for (const field of [ENTITY.name, ENTITY.address, ENTITY.taxId, ENTITY.email]) {
      ok(content.includes(field), `${lang} ${kind} contains seller field ${field}`);
    }
    for (const url of Object.values(urls)) {
      ok(content.includes(url), `${lang} ${kind} contains ${url}`);
    }
    ok(content.includes(withdrawal.h), `${lang} ${kind} contains the withdrawal heading`);
  }
  eq(mail.attachments.length, lang === "de" ? 1 : 2,
    `${lang} has the required number of terms attachments`);

  const allVisible = [mail.subject, mail.text, mail.html,
    ...mail.attachments.flatMap((attachment) => [attachment.filename, attachment.content, attachment.contentType])]
    .join("\n");
  ok(!/[\u2013\u2014]/u.test(allVisible), `${lang} mail and attachments contain no long dash`);

  mail.attachments.forEach((attachment, index) => {
    const attachmentLang = index === 0 ? lang : "de";
    eq(attachment.contentType, "text/html; charset=utf-8",
      `${lang} attachment ${index + 1} has the nodemailer HTML content type`);
    ok(attachment.filename.endsWith(".html"), `${lang} attachment ${index + 1} has an HTML filename`);
    for (const section of SOURCE_TERMS[attachmentLang].sections) {
      ok(attachment.content.includes(section.h),
        `${lang} attachment ${index + 1} contains heading ${section.h}`);
    }
  });
}

{
  const mail = purchaseMail({
    lang: "en", plan: "yearly", amountMinor: 1234, currency: "JPY",
    createdMs: CREATED * 1000, email: "buyer@example.com",
  });
  ok(mail.text.includes(expectedPrice("en", 1234, "JPY")),
    "zero-decimal currencies are not divided by 100");
  ok(mail.text.includes("yearly"), "yearly mail contains the yearly plan word");
}

{
  const mail = purchaseMail({
    lang: "en", plan: "monthly", amountMinor: 1234, currency: "KWD",
    createdMs: CREATED * 1000, email: "buyer@example.com",
  });
  ok(mail.text.includes(expectedPrice("en", 1234, "KWD")),
    "three-decimal currencies use their real minor unit");
}

{
  const email = "<script>x</script>@a.b";
  const mail = purchaseMail({
    lang: "de", plan: "monthly", amountMinor: 999, currency: "EUR",
    createdMs: CREATED * 1000, email,
  });
  ok(mail.text.includes(email), "plain text preserves the customer email");
  ok(mail.html.includes("&lt;script&gt;x&lt;/script&gt;@a.b"), "HTML escapes the customer email");
  ok(!mail.html.includes(email), "HTML contains no raw customer markup");
}

{
  const projected = Object.fromEntries(Object.entries(SOURCE_TERMS).map(([lang, terms]) => [lang, {
    lang: terms.lang,
    title: terms.title,
    updated: terms.updated,
    binding: terms.binding,
    sections: terms.sections.map(({ id, h, html }) => ({ id, h, html })),
  }]));
  deep(GENERATED_TERMS, projected,
    "functions/terms-data.mjs is the exact deployable projection of src/terms");
}

console.log(`purchase map: ${checks}/${checks} checks pass`);
