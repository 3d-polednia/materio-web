#!/usr/bin/env node
/** Contract notice validation and mail copy, checked without Firebase or the network. */

import assert from "node:assert/strict";
import {
  CONTRACT_LANGS, customerMail, limitDecision, ownerMail, validateNotice,
} from "../functions/contract-map.mjs";
import { ENTITY } from "../src/site.mjs";

const NOW = Date.UTC(2026, 10, 11, 12, 34, 0);
const baseCancel = {
  kind: "cancel", lang: "de", name: " Erika Beispiel ", email: " ERIKA@EXAMPLE.COM ",
  mode: "ordinary", reason: "", effective: "asap", orderDate: "", website: "",
};
const baseWithdraw = {
  kind: "withdraw", lang: "pl", name: "Jan Kowalski", email: "jan@example.com",
  mode: "invalid-but-ignored", reason: "", effective: "invalid-but-ignored",
  orderDate: "2026-11-05", website: "",
};

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

{
  const result = validateNotice(baseCancel, NOW);
  eq(result.ok, true, "valid cancellation passes");
  eq(result.notice.name, "Erika Beispiel", "name is trimmed");
  eq(result.notice.email, "erika@example.com", "email is trimmed and lowercased");
  eq(result.notice.lang, "de", "known language stays unchanged");
}

{
  const result = validateNotice(baseWithdraw, NOW);
  eq(result.ok, true, "valid withdrawal passes");
  eq(result.notice.mode, null, "withdrawal ignores mode");
  eq(result.notice.effective, null, "withdrawal ignores effective date");
}

for (const [label, patch, error] of [
  ["missing name", { name: "" }, "name"],
  ["short name", { name: "A" }, "name"],
  ["missing email", { email: "" }, "email"],
  ["bad email", { email: "not-an-email" }, "email"],
  ["unknown kind", { kind: "pause" }, "kind"],
  ["filled honeypot", { website: "robot" }, "spam"],
  ["extraordinary without reason", { mode: "extraordinary", reason: "" }, "reason"],
  ["past effective date", { effective: "2026-11-10" }, "effective"],
]) {
  const result = validateNotice({ ...baseCancel, ...patch }, NOW);
  eq(result.ok, false, `${label} is rejected`);
  eq(result.error, error, `${label} has a stable error`);
}

{
  const result = validateNotice({ ...baseCancel, lang: "xx" }, NOW);
  eq(result.ok, true, "unknown language does not reject a notice");
  eq(result.notice.lang, "de", "unknown language falls back to German");
}

{
  const extra = validateNotice({
    ...baseCancel, mode: "extraordinary", reason: " Wichtiger Grund ", effective: "2026-11-12",
  }, NOW);
  eq(extra.ok, true, "extraordinary cancellation with a reason passes");
  eq(extra.notice.reason, "Wichtiger Grund", "reason is trimmed");
}

{
  eq(limitDecision({ emailToday: 2, ipHour: 9 }).mailCustomer, true,
    "third e-mail and tenth IP request are allowed");
  eq(limitDecision({ emailToday: 3, ipHour: 0 }).mailCustomer, false,
    "fourth e-mail in a day is suppressed");
  eq(limitDecision({ emailToday: 0, ipHour: 10 }).mailCustomer, false,
    "eleventh IP request in an hour is suppressed");
}

{
  const notice = validateNotice(baseCancel, NOW).notice;
  const unknownEnd = customerMail(notice, NOW, null);
  ok(unknownEnd.text.includes("11. November 2026") && unknownEnd.text.includes("13:34"),
    "German customer mail contains Berlin receipt date and time");
  ok(unknownEnd.text.includes("zum nächstmöglichen Zeitpunkt"),
    "unknown plan end uses the exact German fallback");

  const knownEnd = customerMail(notice, NOW, Date.UTC(2027, 0, 10, 12));
  ok(knownEnd.text.includes("10. Januar 2027"), "known plan end is included");

  const later = validateNotice({ ...baseCancel, effective: "2027-02-15" }, NOW).notice;
  const chosenEnd = customerMail(later, NOW, Date.UTC(2027, 0, 10, 12));
  ok(chosenEnd.text.includes("15. Februar 2027"), "a later chosen date wins");
}

{
  const withdrawal = validateNotice(baseWithdraw, NOW).notice;
  const mail = ownerMail(withdrawal, NOW, { uid: "u1", plan: "premium" });
  ok(mail.text.toLocaleLowerCase("pl").includes("pełny zwrot"),
    "owner withdrawal mail says full refund plainly");
  ok(mail.text.includes("2026-11-11"), "owner withdrawal mail contains receipt date");

  const cancellation = validateNotice(baseCancel, NOW).notice;
  const yearly = ownerMail(cancellation, NOW, {
    uid: "u2", plan: "premium", planRenews: true,
    planValidUntil: NOW + 100 * 24 * 60 * 60 * 1000, planSource: null,
  });
  ok(yearly.text.toLocaleLowerCase("pl").includes("zwrot proporcjonalny"),
    "owner mail flags a proportional refund for a renewed yearly plan");
  ok(yearly.text.includes("Anuluj subskrypcję w Stripe (koniec okresu)"),
    "owner cancellation mail contains the Stripe instruction");
}

for (const lang of CONTRACT_LANGS) {
  for (const kind of ["cancel", "withdraw"]) {
    const input = kind === "cancel" ? { ...baseCancel, lang } : { ...baseWithdraw, lang };
    const notice = validateNotice(input, NOW).notice;
    const customer = customerMail(notice, NOW, null);
    const owner = ownerMail(notice, NOW, null);
    for (const [which, mail] of [["customer", customer], ["owner", owner]]) {
      ok(mail.subject.length > 0, `${lang} ${kind} ${which} subject exists`);
      ok(mail.text.length > 0, `${lang} ${kind} ${which} text exists`);
      ok(!/[—–]/.test(mail.subject + mail.text), `${lang} ${kind} ${which} has no long dash`);
    }
    ok(customer.text.includes(ENTITY.email), `${lang} ${kind} customer mail contains ENTITY.email`);
  }
}

console.log(`contract map: ${checks}/${checks} checks pass`);
