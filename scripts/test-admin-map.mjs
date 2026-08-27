#!/usr/bin/env node
/**
 * LiczMat — panel administratora, sprawdzony bez chmury.
 *
 *     node scripts/test-admin-map.mjs
 *
 * Sesja 49. Cała decyzyjna część panelu siedzi w `functions/admin-map.mjs`, który poza
 * `functions/stripe-map.mjs` niczego nie importuje i niczego nie zapisuje — dlatego da się
 * ją sprawdzić zwykłym `node`, bez `npm install`, bez wdrożenia i bez konta w chmurze.
 * Sprawdzane jest to:
 *
 *   1. kontrakt — nazwa uprawnienia w trzech plikach, które muszą się co do znaku zgadzać,
 *      oraz te same dwa słowa planu i trzy pola, co reszta produktu;
 *   2. kto pyta — `admin: true` i wszystkie sposoby, na jakie coś może TYLKO wyglądać na
 *      prawdę, plus kolejność w funkcji: sprawdzenie uprawnienia przed czymkolwiek innym;
 *   3. o co pyta — cztery polecenia i każdy kształt żądania, który ma zostać odrzucony;
 *   4. miesiące — arytmetyka kalendarzowa i to, że liczy tak samo jak scripts/pro-admin.mjs;
 *   5. co jest zapisywane, a co kasowane, i dlaczego plan ręczny nigdy się nie odnawia;
 *   6. co panel pokazuje przy koncie — z planem wygasłym, którego nie wolno pokazać jako
 *      darmowego;
 *   7. i granice: że przeglądarka nie zapisuje planu, że /app/ nie wozi tego panelu w
 *      swoim kodzie, i że katalog funkcji nie jedzie na stronę.
 *
 * Bez zależności, plain `node`, wyjście 1 przy błędzie.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTIONS, ADMIN_CLAIM, DEFAULT_MONTHS, DELETE_FIELD, LIST_LIMIT, MAX_MONTHS,
  PLAN_FIELDS, PLAN_FREE, PLAN_PRO,
  accountRow, grantWrite, isAdmin, looksLikeEmail, monthsFromNow, normalizeEmail,
  parseRequest, planSummary, revokeWrite,
} from "../functions/admin-map.mjs";

import {
  ADMIN_CLAIM as CLI_CLAIM, adminAttributes, isAdminAttributes,
  monthsFromNow as cliMonthsFromNow,
} from "./pro-admin.mjs";

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

const FUNCTION = read("functions/index.js");
const PANEL = read("assets/admin.js");
const APP = read("assets/app.js");

/**
 * The same file with its commentary taken out.
 *
 * These files explain themselves at length, and half of what they explain is what they
 * deliberately do NOT do — `users/{uid}.plan`, private keys, addresses. A check reading the
 * whole file would fail on the sentence saying the thing is absent. Crude on purpose: it
 * is looking for a Firestore path, not parsing JavaScript.
 */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* ================================================================== 1. the contract */

head("1. the claim is one word, written in three files");
{
  /* The function decides on it, the CLI writes it, the browser looks for it before it
     fetches the panel. Three copies of five letters, and nothing but this test binds them. */
  eq("functions/ and scripts/ call it the same thing", ADMIN_CLAIM, CLI_CLAIM);
  eq("and it is the word Firebase carries in the token", ADMIN_CLAIM, "admin");
  check("assets/app.js looks for that exact claim",
    APP.includes(`const ADMIN_CLAIM = "${ADMIN_CLAIM}"`));
  check("and reads it off the token rather than off storage",
    APP.includes("getIdTokenResult") && !/localStorage[^\n]*admin/i.test(APP));

  /* The plan half is the contract every other copy already answers to. */
  eq("Pro is still the contract's word", PLAN_PRO, "premium");
  eq("and free is still free", PLAN_FREE, "free");
  eq("three plan fields, in the contract's order", PLAN_FIELDS.join(","),
    "plan,planValidUntil,planRenews");
  const plan = read("assets/plan.js");
  check("assets/plan.js reads the same three", PLAN_FIELDS.every((f) => plan.includes(f)));

  eq("four commands and no more", ACTIONS.join(","), "list,status,grant,revoke");
  eq("the default grant is a year", DEFAULT_MONTHS, 12);
  eq("and ten years is the ceiling", MAX_MONTHS, 120);
  check("a list is one page of accounts", LIST_LIMIT === 500);
}

/* ================================================================== 2. who is asking */

head("2. the claim: literally true, or nothing");
{
  check("admin: true opens it", isAdmin({ admin: true }));
  check("the string \"true\" does not", !isAdmin({ admin: "true" }));
  check("1 does not", !isAdmin({ admin: 1 }));
  check("an object does not", !isAdmin({ admin: {} }));
  check("admin: false does not", !isAdmin({ admin: false }));
  check("a token without the claim does not", !isAdmin({ sub: "u1", email: "a@b.pl" }));
  check("no token at all does not", !isAdmin(null) && !isAdmin(undefined));
  check("a string is not a token", !isAdmin("admin"));

  /* The same reading, on the other side, out of Firebase Auth's customAttributes. */
  check("the CLI writes exactly {\"admin\":true}", adminAttributes(true) === '{"admin":true}');
  check("and clears it with an empty object", adminAttributes(false) === "{}");
  check("what it wrote reads back as admin", isAdminAttributes(adminAttributes(true)));
  check("what it cleared does not", !isAdminAttributes(adminAttributes(false)));
  check("broken JSON is not an administrator", !isAdminAttributes("{admin:true"));
  check("neither is an empty field", !isAdminAttributes("") && !isAdminAttributes(null));
  check("nor the string true", !isAdminAttributes('{"admin":"true"}'));

  /* Order matters more than the check itself: a function that reads the request, finds
     the account and only then asks who is calling has already told a stranger whether an
     address has an account here. */
  const guard = FUNCTION.indexOf("isAdmin(request.auth.token)");
  const parse = FUNCTION.indexOf("parseRequest(request.data)");
  const write = FUNCTION.indexOf("findUser(auth, parsed.email)");
  check("the function checks the claim before it reads the request", guard !== -1 && guard < parse);
  check("and long before it looks an account up", guard < write);
  check("a missing auth is refused with the same answer as a missing claim",
    FUNCTION.includes("!request.auth || !isAdmin(request.auth.token)"));
  check("the refusal is permission-denied", FUNCTION.includes('"permission-denied", "not-admin"'));
}

/* ================================================================== 3. the request */

head("3. four commands, and every shape that is refused");
{
  eq("list needs nothing else", parseRequest({ action: "list" }).action, "list");
  eq("status needs an address", parseRequest({ action: "status", email: "a@b.pl" }).email, "a@b.pl");
  eq("revoke too", parseRequest({ action: "revoke", email: "a@b.pl" }).action, "revoke");
  eq("grant defaults to a year", parseRequest({ action: "grant", email: "a@b.pl" }).months, 12);
  eq("and takes a number of months",
    parseRequest({ action: "grant", email: "a@b.pl", months: 3 }).months, 3);
  eq("a number typed into a text field is still a number",
    parseRequest({ action: "grant", email: "a@b.pl", months: "6" }).months, 6);

  eq("no action at all", parseRequest({}).error, "bad-action");
  eq("an action nobody wrote", parseRequest({ action: "delete" }).error, "bad-action");
  eq("nothing at all", parseRequest(null).error, "bad-action");
  eq("a string instead of a request", parseRequest("grant").error, "bad-action");
  eq("an address that is not one", parseRequest({ action: "status", email: "ktos" }).error, "bad-email");
  eq("an empty address", parseRequest({ action: "revoke", email: "" }).error, "bad-email");
  eq("no address", parseRequest({ action: "status" }).error, "bad-email");
  eq("an address with a space in it",
    parseRequest({ action: "status", email: "a b@c.pl" }).error, "bad-email");
  eq("zero months", parseRequest({ action: "grant", email: "a@b.pl", months: 0 }).error, "bad-months");
  eq("a negative", parseRequest({ action: "grant", email: "a@b.pl", months: -3 }).error, "bad-months");
  eq("half a month", parseRequest({ action: "grant", email: "a@b.pl", months: 1.5 }).error, "bad-months");
  eq("a word", parseRequest({ action: "grant", email: "a@b.pl", months: "rok" }).error, "bad-months");
  eq("more than the ceiling",
    parseRequest({ action: "grant", email: "a@b.pl", months: MAX_MONTHS + 1 }).error, "bad-months");
  eq("exactly the ceiling is allowed",
    parseRequest({ action: "grant", email: "a@b.pl", months: MAX_MONTHS }).months, MAX_MONTHS);

  /* The address as Firebase Auth keeps it. Without this the panel answers "no such
     account" to an address that is in the project, spelled with a capital letter. */
  eq("the address is lower-cased", normalizeEmail("Jan@Example.COM"), "jan@example.com");
  eq("and trimmed", normalizeEmail("  a@b.pl \n"), "a@b.pl");
  eq("normalization happens before validation",
    parseRequest({ action: "status", email: " KTOS@Example.com " }).email, "ktos@example.com");
  check("a plausible address passes", looksLikeEmail("a.b+c@x.example.co.uk"));
  check("254 characters is the limit", !looksLikeEmail(`${"a".repeat(250)}@b.pl`));
}

/* ================================================================== 4. the months */

head("4. months: calendar arithmetic, and the same answer as the terminal tool");
{
  const now = Date.UTC(2026, 7, 27, 12, 0, 0);
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  eq("a year is the same day next year", day(monthsFromNow(12, now)), "2027-08-27");
  eq("a month is the same day next month", day(monthsFromNow(1, now)), "2026-09-27");
  eq("thirteen months crosses the year", day(monthsFromNow(13, now)), "2027-09-27");
  eq("refuses zero", monthsFromNow(0, now), null);
  eq("refuses a fraction", monthsFromNow(2.5, now), null);
  eq("refuses more than the ceiling", monthsFromNow(MAX_MONTHS + 1, now), null);

  /* Two copies of one calculation: functions/ is deployed on its own and cannot import
     scripts/. The only thing keeping them in step is this comparison. */
  for (const months of [1, 2, 3, 6, 11, 12, 13, 24, 36, MAX_MONTHS]) {
    eq(`${months} months: the function agrees with scripts/pro-admin.mjs`,
      monthsFromNow(months, now), cliMonthsFromNow(months, now));
  }
  for (const bad of [0, -1, 1.5, MAX_MONTHS + 1, "x", null]) {
    eq(`and refuses ${JSON.stringify(bad)} the same way`,
      monthsFromNow(bad, now), cliMonthsFromNow(bad, now));
  }
}

/* ================================================================== 5. the write */

head("5. what a grant writes, and what a revoke deletes");
{
  const now = Date.UTC(2026, 7, 27, 12, 0, 0);
  const grant = grantWrite(12, now);
  eq("three fields, and only three", Object.keys(grant).sort().join(","),
    [...PLAN_FIELDS].sort().join(","));
  eq("the plan is Pro", grant.plan, PLAN_PRO);
  eq("valid until a year from now", new Date(grant.planValidUntil).toISOString().slice(0, 10),
    "2027-08-27");
  eq("and it does NOT renew", grant.planRenews, false);
  check("a manual grant never promises renewal",
    [1, 6, 12, 120].every((m) => grantWrite(m, now).planRenews === false));
  eq("months the parser would refuse write nothing", grantWrite(0, now), null);

  const revoke = revokeWrite();
  eq("a revoke names the same three fields", Object.keys(revoke).sort().join(","),
    [...PLAN_FIELDS].sort().join(","));
  eq("the plan goes back to free", revoke.plan, PLAN_FREE);
  eq("the date is deleted, not nulled", revoke.planValidUntil, DELETE_FIELD);
  eq("and so is the renewal flag", revoke.planRenews, DELETE_FIELD);

  /* Without merge the write replaces the whole document and takes createdAt with it —
     the account's own birthday, which nothing can reconstruct afterwards. */
  check("the function writes with merge",
    /adminPlan[\s\S]*\.set\(toFirestore\(write\), \{ merge: true \}\)/.test(FUNCTION));
  check("the delete marker is turned into a real one",
    FUNCTION.includes("FieldValue.delete()"));
}

/* ================================================================== 6. what it shows */

head("6. the plan a panel shows, including the one that ran out");
{
  const now = Date.UTC(2026, 7, 27, 12, 0, 0);
  const noDoc = planSummary(null, now);
  eq("an account with no profile is free", noDoc.state, "free");
  eq("and its plan says so", noDoc.plan, PLAN_FREE);
  eq("a profile with no plan is free too", planSummary({ createdAt: 1 }, now).state, "free");

  const live = planSummary(
    { plan: PLAN_PRO, planValidUntil: now + 86400000, planRenews: false }, now);
  eq("a valid plan is Pro", live.state, "pro");
  eq("and says it does not renew", live.renews, false);

  const renewing = planSummary({ plan: PLAN_PRO, planValidUntil: now + 86400000 }, now);
  check("a plan with no planRenews field is renewing", renewing.renews === true);

  const gone = planSummary(
    { plan: PLAN_PRO, planValidUntil: now - 1, planRenews: false }, now);
  eq("a plan past its date is expired, not free", gone.state, "expired");
  eq("and it keeps the date, so the panel can say when", gone.validUntil, now - 1);
  eq("expiring exactly now is expired",
    planSummary({ plan: PLAN_PRO, planValidUntil: now }, now).state, "expired");
  eq("a plan with no date at all is open-ended",
    planSummary({ plan: PLAN_PRO }, now).validUntil, null);

  /* One row of the list is exactly what the panel prints, and nothing else about a
     person: whatever is in here has been published to whoever is holding the panel. */
  const row = accountRow({ uid: "u1", email: "a@b.pl", admin: true }, { plan: PLAN_PRO }, now);
  eq("a row carries six keys", Object.keys(row).sort().join(","),
    "admin,email,plan,renews,state,uid,validUntil".split(",").sort().join(","));
  check("no password, phone or provider leaks into it",
    !("passwordHash" in row) && !("phoneNumber" in row) && !("providerData" in row));
  eq("a missing address is an empty string, never undefined", accountRow({}, null, now).email, "");
}

/* ================================================================== 7. the boundaries */

head("7. the browser writes no plan, /app/ carries no panel, functions/ is not published");
{
  /* The whole point of the session: the plan is written on the server. */
  const panelCode = code(PANEL);
  check("the panel never addresses the profile collection",
    !panelCode.includes('"users"') && !panelCode.includes("users/"));
  check("it imports no Firestore",
    !panelCode.includes("firebase-firestore") && !panelCode.includes("setDoc"));
  check("it calls the function and nothing else", PANEL.includes('httpsCallable') &&
    PANEL.includes('"adminPlan"'));
  check("in the region the functions are deployed to",
    PANEL.includes('"europe-central2"') && FUNCTION.includes('"europe-central2"'));
  check("everything it prints goes through an escape",
    PANEL.includes("esc(acc.email)") && PANEL.includes("esc(planLine(acc))"));
  check("and the destructive button asks first", PANEL.includes("confirm("));

  /* Nobody but an administrator downloads it, and no page names it in its markup. */
  check("assets/app.js fetches it, and only for the claim",
    /claims\[ADMIN_CLAIM\] !== true\) return;\s*\n\s*const mod = await import\("\.\/admin\.js"\)/
      .test(APP));
  check("signing out takes the panel away again", APP.includes("unmountAdmin()"));
  const shipped = read("app/index.html");
  check("/app/ ships no admin markup",
    !shipped.includes("panel-admin") && !shipped.includes("admin.js"));
  check("and no other page links it either",
    !read("app/dashboard/index.html").includes("admin.js")
    && !read("index.html").includes("admin.js"));

  /* The repo root IS the site root, so anything not stripped is world-readable. */
  const pages = read(".github/workflows/pages.yml");
  const dropped = (pages.match(/rm -rf ([^\n]+)/) || [])[1] || "";
  check("functions/ is dropped from the published site",
    dropped.split(/\s+/).includes("functions"), dropped);
  check("the admin function carries no service-account key",
    !FUNCTION.includes("private_key") && !FUNCTION.includes("BEGIN PRIVATE KEY"));
  check("and no e-mail address is hard-coded as the administrator",
    !/@[a-z0-9-]+\.(com|pl|net)/i.test(code(FUNCTION)));
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\nadmin panel: ${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`admin panel: ${passed}/${passed} checks pass`);
