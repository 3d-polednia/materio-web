#!/usr/bin/env node
/**
 * LiczMat — webhook Stripe'a, sprawdzony bez chmury.
 *
 *     node scripts/test-webhook-map.mjs
 *
 * Plan naprawczy, sesja 38. Cała decyzyjna część webhooka siedzi w
 * `functions/stripe-map.mjs`, który niczego nie importuje — dlatego da się ją sprawdzić
 * zwykłym `node`, bez `npm install`, bez wdrożenia i bez konta Stripe. Sprawdzane jest to:
 *
 *   1. kontrakt — dwie wartości planu i trzy pola, te same, co w scripts/pro-admin.mjs
 *      i assets/plan.js; to są trzy kopie i test jest jedyną rzeczą, która je wiąże;
 *   2. podpis — prawidłowy, cudzy, przeterminowany, z podmienionym ciałem, oraz nagłówek
 *      z dwoma podpisami, czyli tak, jak wygląda podmiana sekretu bez przerwy;
 *   3. koniec okresu rozliczeniowego, czytany z obu miejsc, w których Stripe go trzyma;
 *   4. status subskrypcji → plan, z anulowaniem, które NIE odbiera Pro od razu;
 *   5. co jest zapisywane, a co kasowane;
 *   6. decyzja dla każdego z czterech zdarzeń i dla tych, które mają być zignorowane;
 *   7. i granice wdrożenia: że katalog funkcji nie jedzie na stronę i że w repozytorium
 *      nie ma żadnego sekretu Stripe'a.
 *
 * Bez zależności, plain `node`, wyjście 1 przy błędzie.
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DELETE_FIELD, FREE_STATUSES, HANDLED, PLAN_FIELDS, PLAN_FREE, PLAN_PRO, PRO_STATUSES,
  customerIdOf, decide, emailOf, parseStripeSignature, periodEndMs, planFromSubscription,
  planWrite, signedPayload, timingSafeEqualHex, verifyStripeSignature,
} from "../functions/stripe-map.mjs";

import { PLAN_FIELDS as ADMIN_FIELDS, PLAN_FREE as ADMIN_FREE, PLAN_PRO as ADMIN_PRO }
  from "./pro-admin.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");

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
const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const hmac = (secret, payload) => createHmac("sha256", secret).update(payload, "utf8").digest("hex");

/* ================================================================== 1. the contract */

head("1. three copies of the contract, and they agree");
{
  eq("Pro is the same word as in pro-admin.mjs", PLAN_PRO, ADMIN_PRO);
  eq("free is the same word", PLAN_FREE, ADMIN_FREE);
  eq("the three fields are the same three", PLAN_FIELDS.join(","), ADMIN_FIELDS.join(","));
  eq("and they are the contract's own", PLAN_FIELDS.join(","), "plan,planValidUntil,planRenews");

  /* assets/plan.js is the third copy — the one the browser reads. */
  const plan = read("assets/plan.js");
  check("assets/plan.js still calls the Pro plan 'premium'", plan.includes('"premium"'));
  for (const field of PLAN_FIELDS) {
    check(`assets/plan.js reads ${field}`, plan.includes(field));
  }

  /* No status may be in both lists: one of them decides Pro, the other decides free. */
  for (const status of PRO_STATUSES) {
    check(`${status} is Pro and only Pro`, !FREE_STATUSES.includes(status));
  }
  check("past_due keeps the plan", PRO_STATUSES.includes("past_due"));
  check("canceled does not", FREE_STATUSES.includes("canceled"));
}

/* ================================================================== 2. the signature */

head("2. the signature: real, forged, stale, and rotated");
{
  const secret = "whsec_test_0123456789";
  const body = '{"id":"evt_1","type":"customer.subscription.updated"}';
  const now = Date.UTC(2026, 7, 21, 10, 0, 0);
  const t = Math.floor(now / 1000);
  const good = hmac(secret, signedPayload(t, body));

  const verify = (header, opts) =>
    verifyStripeSignature(body, header, secret, { hmac, now, ...opts });

  eq("a real signature passes", verify(`t=${t},v1=${good}`).ok, true);
  eq("a signature from another secret does not",
    verify(`t=${t},v1=${hmac("whsec_somebody_else", signedPayload(t, body))}`).reason, "mismatch");
  eq("a signature over another body does not",
    verify(`t=${t},v1=${hmac(secret, signedPayload(t, '{"id":"evt_2"}'))}`).reason, "mismatch");

  /* Five minutes, same as Stripe's own default. Without it a signed request captured a
     month ago and replayed would still be accepted. */
  const old = t - 301;
  eq("a signature older than the window is refused",
    verify(`t=${old},v1=${hmac(secret, signedPayload(old, body))}`).reason, "stale");
  const near = t - 299;
  eq("but one inside it is not",
    verify(`t=${near},v1=${hmac(secret, signedPayload(near, body))}`).ok, true);
  const future = t + 301;
  eq("and a timestamp from the future is refused too",
    verify(`t=${future},v1=${hmac(secret, signedPayload(future, body))}`).reason, "stale");

  /* Two v1 signatures is what a secret rotation looks like while both are live. */
  eq("either of two signatures is enough",
    verify(`t=${t},v1=deadbeef,v1=${good}`).ok, true);

  for (const bad of ["", "nonsense", `v1=${good}`, `t=${t}`, `t=abc,v1=${good}`, null, undefined]) {
    eq(`refuses header ${JSON.stringify(bad)}`, verify(bad).reason, "bad-header");
  }
  eq("refuses an empty secret",
    verifyStripeSignature(body, `t=${t},v1=${good}`, "", { hmac, now }).reason, "no-secret");

  eq("the payload is the timestamp, a dot, and the body verbatim",
    signedPayload(1, "{}"), "1.{}");
  check("a Buffer body is read as bytes, not as [object Object]",
    signedPayload(1, Buffer.from("{}")) === "1.{}");

  /* The comparison must not stop at the first differing character. */
  check("equal strings compare equal", timingSafeEqualHex("abcd", "abcd"));
  check("different ones do not", !timingSafeEqualHex("abcd", "abce"));
  check("and a length difference is not equal", !timingSafeEqualHex("abcd", "abcde"));
}

/* ================================================================== 3. the period end */

head("3. the end of the paid period, from either place Stripe keeps it");
{
  const seconds = 1818806400;
  eq("read off the subscription", periodEndMs({ current_period_end: seconds }), seconds * 1000);
  eq("read off the subscription item",
    periodEndMs({ items: { data: [{ current_period_end: seconds }] } }), seconds * 1000);
  eq("the subscription wins when both are there",
    periodEndMs({ current_period_end: seconds, items: { data: [{ current_period_end: 1 }] } }),
    seconds * 1000);
  for (const bad of [{}, { current_period_end: 0 }, { current_period_end: "later" },
    { items: { data: [] } }, null]) {
    eq(`no date in ${JSON.stringify(bad)}`, periodEndMs(bad), null);
  }
}

/* ================================================================== 4. status → plan */

head("4. the status, and the cancellation that does not take Pro away today");
{
  const end = 1818806400;
  const sub = (over) => ({ status: "active", current_period_end: end, ...over });

  const active = planFromSubscription(sub());
  eq("active is Pro", active.pro, true);
  eq("until the end of the paid period", active.validUntilMs, end * 1000);
  eq("and it renews", active.renews, true);

  eq("a trial is Pro too", planFromSubscription(sub({ status: "trialing" })).pro, true);

  /* The rule this whole file exists for: cancelling does not end the plan today. It ends
     the renewal. Taking the modules away the moment somebody clicks "cancel" would be
     taking back something they have paid for. */
  const cancelled = planFromSubscription(sub({ cancel_at_period_end: true }));
  eq("a cancelled subscription is still Pro", cancelled.pro, true);
  eq("still until the same date", cancelled.validUntilMs, end * 1000);
  eq("but it does not renew", cancelled.renews, false);

  /* past_due: the paid period is still running, the renewal charge failed. Stripe retries
     for days. Cutting access on the first failed charge cuts off somebody with a working
     card and one declined transaction. */
  const late = planFromSubscription(sub({ status: "past_due" }));
  eq("past_due keeps the plan", late.pro, true);
  eq("and promises no renewal", late.renews, false);

  for (const status of FREE_STATUSES) {
    eq(`${status} is not Pro`, planFromSubscription(sub({ status })).pro, false);
  }
  eq("a subscription with no date is not Pro either",
    planFromSubscription({ status: "active" }).pro, false);
  eq("and neither is nothing at all", planFromSubscription(null).pro, false);
}

/* ================================================================== 5. what is written */

head("5. what a write puts in the document, and what it takes out");
{
  const pro = planWrite({ pro: true, validUntilMs: 1818806400000, renews: true });
  eq("three fields", Object.keys(pro).sort().join(","), "plan,planRenews,planValidUntil");
  eq("the plan", pro.plan, PLAN_PRO);
  eq("the date, in millis", pro.planValidUntil, 1818806400000);
  eq("the renewal", pro.planRenews, true);

  /* Free deletes the two date fields rather than nulling them. A null planValidUntil
     reads as a plan that ended in 1970; an absent one reads as no plan, which is true.
     Same decision as `revoke` in scripts/pro-admin.mjs. */
  const free = planWrite({ pro: false, validUntilMs: null, renews: false });
  eq("free still names three fields", Object.keys(free).sort().join(","), "plan,planRenews,planValidUntil");
  eq("the plan is free", free.plan, PLAN_FREE);
  eq("the date is deleted", free.planValidUntil, DELETE_FIELD);
  eq("the renewal flag is deleted", free.planRenews, DELETE_FIELD);
  check("and nothing else is ever written",
    Object.keys(pro).every((k) => PLAN_FIELDS.includes(k))
    && Object.keys(free).every((k) => PLAN_FIELDS.includes(k)));
}

/* ================================================================== 6. the decision */

head("6. one decision per event, and three possible answers");
{
  const session = (over) => ({
    type: "checkout.session.completed",
    data: { object: { mode: "subscription", customer: "cus_1",
      client_reference_id: "uid-1", customer_details: { email: "kto@example.com" }, ...over } },
  });

  const link = decide(session());
  eq("a completed checkout links a customer to an account", link.action, "link");
  eq("by the id the Payment Link carried", link.uid, "uid-1");
  eq("with the address as the fallback", link.email, "kto@example.com");
  eq("and the customer it belongs to", link.customerId, "cus_1");

  eq("an expanded customer object is the same customer",
    decide(session({ customer: { id: "cus_9" } })).customerId, "cus_9");
  eq("a one-off payment is not a subscription and is ignored",
    decide(session({ mode: "payment" })).action, "ignore");
  eq("a session with no customer is ignored",
    decide(session({ customer: null })).action, "ignore");
  eq("a session with neither an id nor an address is ignored",
    decide(session({ client_reference_id: null, customer_details: {} })).action, "ignore");
  eq("an address is enough on its own",
    decide(session({ client_reference_id: null })).action, "link");

  const subEvent = (type, object) => decide({ type, data: { object } });
  const running = subEvent("customer.subscription.updated",
    { customer: "cus_1", status: "active", current_period_end: 1818806400 });
  eq("a subscription event sets a plan", running.action, "plan");
  eq("on that customer", running.customerId, "cus_1");
  eq("and the plan is Pro", running.write.plan, PLAN_PRO);

  const gone = subEvent("customer.subscription.deleted", { customer: "cus_1", status: "canceled" });
  eq("a deleted subscription writes the free plan", gone.write.plan, PLAN_FREE);
  eq("and clears the date", gone.write.planValidUntil, DELETE_FIELD);

  eq("created is handled like updated",
    subEvent("customer.subscription.created",
      { customer: "cus_1", status: "active", current_period_end: 1818806400 }).action, "plan");

  for (const type of ["invoice.paid", "payment_intent.succeeded", "customer.created", ""]) {
    eq(`${type || "(no type)"} is ignored`, decide({ type, data: { object: {} } }).action, "ignore");
  }
  eq("and so is nothing at all", decide(null).action, "ignore");
  eq("four event types are handled and no more", HANDLED.length, 4);

  eq("a customer id is read off a string", customerIdOf({ customer: "cus_2" }), "cus_2");
  eq("or off an object", customerIdOf({ customer: { id: "cus_3" } }), "cus_3");
  eq("and is null when absent", customerIdOf({}), null);
  eq("an address needs an @", emailOf({ customer_details: { email: "nope" } }), null);
  eq("customer_email is read too", emailOf({ customer_email: "a@b.pl" }), "a@b.pl");
}

/* ================================================================== 7. the deployment */

head("7. the function is deployed, not published — and carries no secret");
{
  const index = read("functions/index.js");
  const map = read("functions/stripe-map.mjs");
  const pkg = JSON.parse(read("functions/package.json"));

  /* The repo root IS the site root, so anything not stripped is world-readable. */
  const pages = read(".github/workflows/pages.yml");
  const dropped = (pages.match(/rm -rf ([^\n]+)/) || [])[1] || "";
  for (const path of ["functions", "firebase.json", ".firebaserc"]) {
    check(`${path} is dropped from the published site`, dropped.split(/\s+/).includes(path), dropped);
  }
  check("the generator does not read functions/",
    !read("scripts/build.mjs").includes("functions/"));

  /* One secret, and it is fetched at runtime rather than written down. */
  check("the webhook secret is a Secret Manager parameter",
    index.includes('defineSecret("STRIPE_WEBHOOK_SECRET")'));
  for (const leak of ["whsec_", "sk_live_", "sk_test_", "rk_live_"]) {
    check(`no ${leak} value in the function`, !index.includes(leak) && !map.includes(leak));
  }

  /* It answers Stripe; it never calls Stripe. That is why there is no API key here. */
  check("the function makes no outbound request", !index.includes("fetch(") && !map.includes("fetch("));
  check("and needs no Stripe SDK", !Object.keys(pkg.dependencies || {}).includes("stripe"));
  check("it runs beside Firestore, in europe-central2", index.includes("europe-central2"));

  /* The pure half must stay pure, or scripts/test-webhook-map.mjs stops being runnable. */
  check("stripe-map.mjs imports nothing at all", !/^\s*import\s/m.test(map));

  /* Writes: the profile, merged, plus the one mapping collection. */
  check("the profile write merges", /collection\("users"\)[\s\S]{0,200}\{ merge: true \}/.test(index));
  check("the mapping lives in its own collection", index.includes('collection("stripeCustomers")'));
  check("a bad signature is a 400, so Stripe does not retry it",
    /bad signature/.test(index) && index.includes("status(400)"));
  check("an event that arrived too early is a 503, so Stripe does retry it",
    index.includes("status(503)"));
  check("and an unattributable payment is logged rather than dropped",
    index.includes("zapłata bez konta"));

  /* Nothing in the deployed function may write a plan a browser could ask for. */
  check("the function never trusts client_reference_id without checking it",
    index.includes("auth.getUser(intent.uid)"));
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`webhook: ${passed}/${passed} checks pass`);
