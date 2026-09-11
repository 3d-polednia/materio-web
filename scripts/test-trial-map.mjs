#!/usr/bin/env node
/**
 * LiczMat — okres próbny (trial), sprawdzony bez chmury.
 *
 *     node scripts/test-trial-map.mjs
 *
 * Logika decyzyjna okresu próbnego w `functions/trial-map.mjs`. Sprawdzana zwykłym
 * `node`, bez Firebase Admin, bez sieci i bez zewnętrznych zależności.
 *
 * Sprawdzane jest to:
 *   1. świeże konto — dostaje plan premium, planRenews false, planSource trial;
 *   2. data ważności — dokładnie stały znacznik czasu plus 14 dni, liczona ze stałej, nigdy Date.now();
 *   3. istniejący zapis grantu — odmowa already-granted bez klucza write;
 *   4. profil już na planie Pro — odmowa has-plan (i również bez klucza write);
 *   5. świeże konto w każdym wydaniu — null, pusty obiekt {} oraz plan free wszystkie kwalifikują się do triala;
 *   6. dokument audytowy trialGrantDoc — uid, grantedAt, until, days 14 i source signup;
 *   7. kontrakt zapisu trialWrite — dokładnie cztery klucze i ani jednego więcej.
 *
 * ─── DLACZEGO planRenews = false ────────────────────────────────────────────
 * Okres próbny nie jest subskrypcją. Nic go automatycznie nie odnowi, gdy minie
 * `planValidUntil`, a `lmPlanStatus()` w `assets/plan.js` sam wyłącza Pro po upływie
 * daty ważności. Flaga `true` byłaby obietnicą odnowienia, której nikt nie złożył
 * i której żaden proces w tle nie spełni.
 *
 * ─── PO CO ISTNIEJE planSource ──────────────────────────────────────────────
 * Bez `planSource: "trial"` kod w `assets/plan.js` nie potrafi odróżnić okresu próbnego
 * od anulowanej subskrypcji Stripe. W obu przypadkach profil ma `plan: "premium"` oraz
 * `planRenews: false`. Dzięki `planSource` interfejs wie, że użytkownik testuje aplikację
 * za darmo, nie oferuje portalu klienta Stripe (gdzie nie ma żadnej subskrypcji)
 * i wyświetla komunikat zachęcający do zakupu.
 *
 * Bez zależności, plain `node`, wyjście 1 przy błędzie.
 */

import {
  TRIAL_DAYS,
  TRIAL_MS,
  TRIAL_SOURCE,
  trialDecision,
  trialGrantDoc,
  trialUntil,
  trialWrite,
} from "../functions/trial-map.mjs";

import { DELETE_FIELD, PLAN_FREE, PLAN_PRO, planWrite } from "../functions/stripe-map.mjs";

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

/* Stały znacznik czasu: 11 września 2026, godz. 10:00:00 UTC */
const FIXED_NOW = Date.UTC(2026, 8, 11, 10, 0, 0);

/* ================================================================== 1. fresh account gets premium, planRenews false, planSource trial */

head("1. fresh account gets plan premium, planRenews false, planSource trial");
{
  /* Świeże konto bez wcześniejszego grantu otrzymuje decyzję pozytywną */
  const decision = trialDecision(null, null, FIXED_NOW);
  eq("decision grants trial", decision.grant, true);
  eq("reason is null on grant", decision.reason, null);
  check("decision carries write object", Boolean(decision.write) && typeof decision.write === "object");

  /* Dlaczego plan: "premium" — to jest kontraktowe słowo na Pro używane w całym projekcie */
  eq("plan is premium", decision.write.plan, PLAN_PRO);
  eq("plan is the exact string premium", decision.write.plan, "premium");

  /* Dlaczego planRenews zostaje false: trial to nie jest subskrypcja, nic go nie odnowi,
     a assets/plan.js sam wyłącza Pro po minięciu planValidUntil. */
  eq("planRenews is false", decision.write.planRenews, false);

  /* Po co istnieje planSource: bez niego assets/plan.js nie odróżni okresu próbnego
     od anulowanej subskrypcji, bo oba stany to Pro, które się nie odnawia. */
  eq("planSource is trial", decision.write.planSource, TRIAL_SOURCE);
  eq("TRIAL_SOURCE is the exact string trial", TRIAL_SOURCE, "trial");

  /* To samo bezpośrednio z funkcji pomocniczej trialWrite */
  const write = trialWrite(FIXED_NOW);
  eq("trialWrite plan is premium", write.plan, "premium");
  eq("trialWrite planRenews is false", write.planRenews, false);
  eq("trialWrite planSource is trial", write.planSource, "trial");
}

/* ================================================================== 2. planValidUntil is exactly a fixed timestamp plus 14 days, computed from a constant, never Date.now() */

head("2. planValidUntil is exactly a fixed timestamp plus 14 days, computed from a constant, never Date.now()");
{
  /* Stałe czasowe okresu próbnego */
  eq("TRIAL_DAYS is 14", TRIAL_DAYS, 14);
  const expectedMs = 14 * 24 * 60 * 60 * 1000;
  eq("TRIAL_MS is exactly 14 days in milliseconds", TRIAL_MS, expectedMs);
  eq("TRIAL_MS equals 1209600000 ms", TRIAL_MS, 1209600000);

  /* Data ważności wyliczana ze stałej względem stałego znacznika, nigdy Date.now() */
  const expectedUntil = FIXED_NOW + TRIAL_MS;
  eq("trialUntil(FIXED_NOW) is exactly FIXED_NOW + 14 days",
    trialUntil(FIXED_NOW), expectedUntil);
  eq("difference is exactly TRIAL_MS",
    trialUntil(FIXED_NOW) - FIXED_NOW, TRIAL_MS);

  /* trialWrite(FIXED_NOW) wstawia tę samą obliczoną datę */
  const write = trialWrite(FIXED_NOW);
  eq("trialWrite(FIXED_NOW).planValidUntil is exactly FIXED_NOW + TRIAL_MS",
    write.planValidUntil, expectedUntil);

  /* trialDecision(profile, grant, FIXED_NOW) zwraca spójne until i write.planValidUntil */
  const decision = trialDecision(null, null, FIXED_NOW);
  eq("decision.until matches FIXED_NOW + TRIAL_MS", decision.until, expectedUntil);
  eq("decision.write.planValidUntil matches decision.until",
    decision.write.planValidUntil, decision.until);

  /* Przejście przez przełom miesiąca: 25 sierpnia + 14 dni to 8 września */
  const augustNow = Date.UTC(2026, 7, 25, 12, 0, 0);
  const augustEnd = trialUntil(augustNow);
  eq("August end date string", new Date(augustEnd).toISOString().slice(0, 10), "2026-09-08");
  eq("August diff is exactly TRIAL_MS", augustEnd - augustNow, TRIAL_MS);

  /* Przejście przez przełom roku: 25 grudnia + 14 dni to 8 stycznia następnego roku */
  const decNow = Date.UTC(2026, 11, 25, 12, 0, 0);
  const decEnd = trialUntil(decNow);
  eq("Year-boundary date string", new Date(decEnd).toISOString().slice(0, 10), "2027-01-08");
  eq("Year-boundary diff is exactly TRIAL_MS", decEnd - decNow, TRIAL_MS);
}

/* ================================================================== 3. an existing trialGrants document is refused with reason already-granted and carries no write key */

head("3. an existing trialGrants document is refused with reason already-granted and carries no write key");
{
  const existingGrant = {
    uid: "user-1",
    grantedAt: FIXED_NOW - 86400000,
    until: FIXED_NOW + TRIAL_MS - 86400000,
    days: 14,
    source: "signup",
  };

  /* Świeże konto, ale z istniejącym dokumentem w trialGrants/{uid} */
  const resNull = trialDecision(null, existingGrant, FIXED_NOW);
  eq("refused when grant exists (profile null)", resNull.grant, false);
  eq("reason is already-granted (profile null)", resNull.reason, "already-granted");
  check("carries no write key (profile null)", !("write" in resNull));
  eq("write property is undefined", resNull.write, undefined);

  /* Pusty obiekt profilu z istniejącym grantem */
  const resEmpty = trialDecision({}, existingGrant, FIXED_NOW);
  eq("refused when grant exists (profile {})", resEmpty.grant, false);
  eq("reason is already-granted (profile {})", resEmpty.reason, "already-granted");
  check("carries no write key (profile {})", !("write" in resEmpty));

  /* Profil z darmowym planem z istniejącym grantem */
  const resFree = trialDecision({ plan: PLAN_FREE }, existingGrant, FIXED_NOW);
  eq("refused when grant exists (profile plan: free)", resFree.grant, false);
  eq("reason is already-granted (profile plan: free)", resFree.reason, "already-granted");
  check("carries no write key (profile plan: free)", !("write" in resFree));

  /* Kolejność: jeśli konto ma i grant, i plan Pro, to grant jest sprawdzany PIERWSZY */
  const resPro = trialDecision({ plan: PLAN_PRO }, existingGrant, FIXED_NOW);
  eq("grant check takes precedence over plan check", resPro.reason, "already-granted");
  check("carries no write key when both present", !("write" in resPro));

  /* Dowolny prawdziwy (truthy) obiekt grantu odrzuca żądanie */
  const resSimple = trialDecision(null, { uid: "user-simple" }, FIXED_NOW);
  eq("truthy grant object refused", resSimple.grant, false);
  eq("truthy grant reason is already-granted", resSimple.reason, "already-granted");
  check("truthy grant carries no write key", !("write" in resSimple));
}

/* ================================================================== 4. a profile already on premium is refused with reason has-plan */

head("4. a profile already on premium is refused with reason has-plan");
{
  /* Profil posiadający plan Pro bez wcześniejszego grantu */
  const proProfile = { plan: PLAN_PRO };
  const res = trialDecision(proProfile, null, FIXED_NOW);

  eq("refused when profile on premium", res.grant, false);
  eq("reason is has-plan", res.reason, "has-plan");
  check("has-plan carries no write key", !("write" in res));
  eq("write is undefined", res.write, undefined);

  /* Profil z pełną konfiguracją aktywnej subskrypcji Pro */
  const activeSub = {
    plan: "premium",
    planValidUntil: FIXED_NOW + (30 * 86400000),
    planRenews: true,
  };
  const resActive = trialDecision(activeSub, null, FIXED_NOW);
  eq("active premium subscription refused", resActive.grant, false);
  eq("reason is has-plan for active subscription", resActive.reason, "has-plan");
  check("active subscription carries no write key", !("write" in resActive));

  /* Profil z anulowaną subskrypcją Pro (jeszcze w trakcie trwania opłaconego okresu) */
  const cancelledSub = {
    plan: "premium",
    planValidUntil: FIXED_NOW + (5 * 86400000),
    planRenews: false,
  };
  const resCancelled = trialDecision(cancelledSub, null, FIXED_NOW);
  eq("cancelled premium refused", resCancelled.grant, false);
  eq("reason is has-plan for cancelled subscription", resCancelled.reason, "has-plan");
  check("cancelled subscription carries no write key", !("write" in resCancelled));
}

/* ================================================================== 5. null, empty object and plan free all grant */

head("5. null, empty object and plan free all grant");
{
  /* 1. null profile — konto tuż po rejestracji w Auth, zanim powstał dokument profilu */
  const resNull = trialDecision(null, null, FIXED_NOW);
  eq("null profile grants", resNull.grant, true);
  eq("null profile reason is null", resNull.reason, null);
  check("null profile carries write key", "write" in resNull);
  eq("null profile write plan is premium", resNull.write.plan, "premium");
  eq("null profile until is fixedNow + TRIAL_MS", resNull.until, FIXED_NOW + TRIAL_MS);

  /* 2. pusty obiekt {} — dokument profilu utworzony bez pól planu */
  const resEmpty = trialDecision({}, null, FIXED_NOW);
  eq("empty object profile grants", resEmpty.grant, true);
  eq("empty object reason is null", resEmpty.reason, null);
  check("empty object carries write key", "write" in resEmpty);
  eq("empty object write plan is premium", resEmpty.write.plan, "premium");
  eq("empty object write planRenews is false", resEmpty.write.planRenews, false);
  eq("empty object write planSource is trial", resEmpty.write.planSource, "trial");

  /* 3. plan: 'free' — profil z jawnym darmowym planem */
  const resFree = trialDecision({ plan: PLAN_FREE }, null, FIXED_NOW);
  eq("plan free grants", resFree.grant, true);
  eq("plan free reason is null", resFree.reason, null);
  check("plan free carries write key", "write" in resFree);
  eq("plan free write plan is premium", resFree.write.plan, "premium");
  eq("plan free write planRenews is false", resFree.write.planRenews, false);
  eq("plan free write planSource is trial", resFree.write.planSource, "trial");

  /* 4. undefined profile — brak argumentu profilu */
  const resUndef = trialDecision(undefined, null, FIXED_NOW);
  eq("undefined profile grants", resUndef.grant, true);
  eq("undefined profile reason is null", resUndef.reason, null);
  check("undefined profile carries write key", "write" in resUndef);

  /* 5. Profil posiadający inne pola (np. email, displayName), ale nie plan Pro */
  const resOther = trialDecision({ email: "klient@example.com", createdAt: FIXED_NOW }, null, FIXED_NOW);
  eq("profile with arbitrary fields but no Pro grants", resOther.grant, true);
  eq("arbitrary fields write plan is premium", resOther.write.plan, "premium");
}

/* ================================================================== 6. trialGrantDoc has uid, grantedAt, until, days 14 and source signup */

head("6. trialGrantDoc has uid, grantedAt, until, days 14 and source signup");
{
  const uid = "user_abc_789";
  const doc = trialGrantDoc(uid, FIXED_NOW);

  eq("trialGrantDoc has correct uid", doc.uid, uid);
  eq("trialGrantDoc has grantedAt", doc.grantedAt, FIXED_NOW);
  eq("trialGrantDoc until is grantedAt + TRIAL_MS", doc.until, FIXED_NOW + TRIAL_MS);
  eq("trialGrantDoc days is 14", doc.days, 14);
  eq("trialGrantDoc days equals constant TRIAL_DAYS", doc.days, TRIAL_DAYS);
  eq("trialGrantDoc source is signup", doc.source, "signup");

  /* Dokładnie te pięć kluczy i ani jednego więcej */
  const keys = Object.keys(doc).sort().join(",");
  eq("trialGrantDoc carries exactly the five keys", keys, "days,grantedAt,source,uid,until");
  eq("trialGrantDoc key count is 5", Object.keys(doc).length, 5);

  /* Domyślny timestamp, gdy `now` nie jest podane */
  const before = Date.now();
  const autoDoc = trialGrantDoc("user_auto");
  const after = Date.now();
  eq("autoDoc has uid", autoDoc.uid, "user_auto");
  check("autoDoc grantedAt is in current window", autoDoc.grantedAt >= before && autoDoc.grantedAt <= after);
  eq("autoDoc until is grantedAt + TRIAL_MS", autoDoc.until, autoDoc.grantedAt + TRIAL_MS);
  eq("autoDoc days is 14", autoDoc.days, 14);
  eq("autoDoc source is signup", autoDoc.source, "signup");
}

/* ================================================================== 7. trialWrite carries no key beyond plan, planValidUntil, planRenews, planSource */

head("7. trialWrite carries no key beyond plan, planValidUntil, planRenews, planSource");
{
  const write = trialWrite(FIXED_NOW);

  /* Dokładnie cztery klucze kontraktu */
  const keys = Object.keys(write).sort().join(",");
  eq("keys are plan, planRenews, planSource, planValidUntil", keys,
    "plan,planRenews,planSource,planValidUntil");
  eq("write carries exactly 4 keys", Object.keys(write).length, 4);

  check("carries plan", "plan" in write);
  check("carries planValidUntil", "planValidUntil" in write);
  check("carries planRenews", "planRenews" in write);
  check("carries planSource", "planSource" in write);

  /* Brak jakichkolwiek nadmiarowych pól */
  check("no uid field", !("uid" in write));
  check("no validUntilMs field", !("validUntilMs" in write));
  check("no pro field", !("pro" in write));
  check("no renews field", !("renews" in write));

  /* Wartości pól */
  eq("plan is premium", write.plan, PLAN_PRO);
  eq("planValidUntil is timestamp", write.planValidUntil, FIXED_NOW + TRIAL_MS);
  eq("planRenews is false", write.planRenews, false);
  eq("planSource is trial", write.planSource, "trial");

  /* Nadpisanie DELETE_FIELD: planWrite() zwraca planSource: DELETE_FIELD,
     a trialWrite() bezwzględnie zastępuje go wartością TRIAL_SOURCE */
  const rawWrite = planWrite({ pro: true, validUntilMs: FIXED_NOW + TRIAL_MS, renews: false });
  eq("raw planWrite sets planSource to DELETE_FIELD sentinel", rawWrite.planSource, DELETE_FIELD);
  eq("DELETE_FIELD sentinel is __delete__", DELETE_FIELD, "__delete__");
  check("trialWrite overwrites DELETE_FIELD sentinel", write.planSource !== DELETE_FIELD);
  eq("trialWrite planSource is TRIAL_SOURCE", write.planSource, TRIAL_SOURCE);
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\ntrial map: ${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`trial map: ${passed}/${passed} checks pass`);
