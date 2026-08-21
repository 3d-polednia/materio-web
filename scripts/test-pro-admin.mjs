#!/usr/bin/env node
/**
 * LiczMat — nadawanie planu Pro, sprawdzone.
 *
 *     node scripts/test-pro-admin.mjs
 *
 * Plan naprawczy, sesja 37. scripts/pro-admin.mjs jest jedyną rzeczą w tym repozytorium,
 * która pisze do cudzego konta — i jedyną, której nie da się uruchomić na próbę, bo
 * potrzebuje klucza konta serwisowego i żywej bazy. Wszystko, co da się sprawdzić bez
 * tego klucza, jest sprawdzone tutaj:
 *
 *   1. kontrakt — trzy pola planu i dwie wartości, te same, które czyta assets/plan.js;
 *   2. co idzie w zapisie — typowane wartości Firestore REST, i maska, która ogranicza
 *      zapis do trzech pól; bez niej PATCH kasuje datę założenia konta;
 *   3. `revoke`, który kasuje dwa pola przez to, że ich NIE wysyła;
 *   4. arytmetyka miesięcy, łącznie z tym, czego nie wolno przyjąć;
 *   5. odczyt planu z dokumentu, w tym konta, które profilu jeszcze nie mają;
 *   6. asercja JWT — kształt, czas życia i podpis, zweryfikowany kluczem publicznym;
 *   7. klucz z innego projektu, który musi zostać odrzucony;
 *   8. i to, czego ten skrypt robić NIE może: pisać po repozytorium ani wysyłać zapisu
 *      pod inny adres niż ten z maską.
 *
 * Bez zależności, plain `node`, wyjście 1 przy błędzie — ten sam kształt, co pozostałe
 * zestawy logiczne. Uruchom po każdej zmianie w scripts/pro-admin.mjs albo w polach planu
 * w assets/plan.js.
 */

import { createVerify, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MAX_MONTHS, PLAN_FIELDS, PLAN_FREE, PLAN_PRO, SCOPES,
  dayText, docUrl, jwtAssertion, keyProblem, looksLikeEmail, monthsFromNow,
  patchUrl, planFields, planFromDoc, planText, siteProjectId,
} from "./pro-admin.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");

const evalScript = (file, returns) =>
  new Function(`${read(file)}\nreturn {${returns.join(",")}};`)();

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

/* ================================================================== 1. the contract */

head("1. the contract: the same two words and the same three fields as the product");
{
  const { LM_PLAN_PRO } = evalScript("assets/account.js", ["LM_PLAN_PRO"]);
  eq("Pro is the contract's own word", PLAN_PRO, LM_PLAN_PRO);
  eq("and it is 'premium', not 'pro'", PLAN_PRO, "premium");
  eq("free is the other one", PLAN_FREE, "free");

  /* The three fields, named the way assets/plan.js reads them. A rename on one side and
     not the other is a plan granted into a field nothing looks at. */
  const plan = read("assets/plan.js");
  for (const field of PLAN_FIELDS) {
    check(`assets/plan.js reads ${field}`, plan.includes(`.${field}`) || plan.includes(`"${field}"`));
  }
  eq("three fields and no more", PLAN_FIELDS.length, 3);
  eq("in the order plan.js reads them",
    PLAN_FIELDS.join(","), "plan,planValidUntil,planRenews");

  /* The scopes are the two APIs this touches and nothing wider. cloud-platform would
     hand a leaked token the whole project. */
  check("no blanket cloud-platform scope", !SCOPES.includes("auth/cloud-platform"), SCOPES);
  check("identitytoolkit is asked for", SCOPES.includes("auth/identitytoolkit"));
  check("datastore is asked for", SCOPES.includes("auth/datastore"));
}

/* ================================================================== 2. what a grant writes */

head("2. a grant writes three typed fields, and the mask names exactly those three");
{
  const until = Date.UTC(2027, 7, 21, 12, 0, 0);
  const fields = planFields({ pro: true, validUntilMs: until, renews: false });

  eq("the field set", Object.keys(fields).sort().join(","), "plan,planRenews,planValidUntil");
  eq("plan is a string", fields.plan.stringValue, "premium");
  eq("the date is an integerValue", typeof fields.planValidUntil.integerValue, "string");
  eq("and it is the millis it was handed", Number(fields.planValidUntil.integerValue), until);
  eq("renews is a boolean", fields.planRenews.booleanValue, false);

  /* A hand-granted plan must never claim it will renew: nothing renews it, and
     lmSubscription() would then word it "Odnawia się" until the day it silently did not. */
  const asked = planFields({ pro: true, validUntilMs: until, renews: true });
  eq("renews:true is carried when asked for", asked.planRenews.booleanValue, true);

  const url = patchUrl("materio-502513", "uid-1");
  for (const field of PLAN_FIELDS) {
    check(`the mask names ${field}`, url.includes(`updateMask.fieldPaths=${field}`), url);
  }
  eq("the mask names three fields and no more",
    (url.match(/updateMask\.fieldPaths=/g) || []).length, 3);
  check("it points at the profile document",
    url.startsWith(docUrl("materio-502513", "uid-1") + "?"), url);
  check("the document address is the account's own profile",
    docUrl("p", "u").endsWith("/databases/(default)/documents/users/u"), docUrl("p", "u"));
  check("a uid with a slash in it cannot climb out of users/",
    !docUrl("p", "a/b").includes("users/a/b"), docUrl("p", "a/b"));
}

/* ================================================================== 3. what a revoke writes */

head("3. a revoke sends one field and deletes the other two by omission");
{
  const fields = planFields({ pro: false });
  eq("only plan is sent", Object.keys(fields).join(","), "plan");
  eq("and it says free", fields.plan.stringValue, "free");

  /* This is the whole mechanism: a field named in updateMask and missing from the body is
     deleted by Firestore. Sending planValidUntil: null instead would store a null and
     leave lmPlanStatus() reading a plan that ended at the epoch. */
  const url = patchUrl("materio-502513", "uid-1");
  check("the mask still names the two fields being deleted",
    url.includes("planValidUntil") && url.includes("planRenews"), url);
}

/* ================================================================== 4. months */

head("4. months: calendar arithmetic, and what is refused");
{
  const from = Date.UTC(2026, 7, 21, 10, 0, 0);
  eq("twelve months is the same day next year",
    dayText(monthsFromNow(12, from)), "2027-08-21");
  eq("one month", dayText(monthsFromNow(1, from)), "2026-09-21");
  check("the longest plan is allowed", monthsFromNow(MAX_MONTHS, from) !== null);

  for (const bad of [0, -1, MAX_MONTHS + 1, 1.5, "rok", "", null, undefined, NaN, Infinity]) {
    eq(`refuses ${JSON.stringify(bad)}`, monthsFromNow(bad, from), null);
  }
  check("a number in a string still counts", monthsFromNow("12", from) !== null);
  check("the end is in the future", monthsFromNow(1, from) > from);
}

/* ================================================================== 5. reading a plan back */

head("5. reading a plan out of a Firestore document");
{
  const free = planFromDoc(null);
  eq("no document at all reads as free", free.plan, PLAN_FREE);
  eq("with no date", free.validUntil, null);
  eq("and no renewal", free.renews, false);

  eq("a profile with no plan field is free", planFromDoc({ fields: {} }).plan, PLAN_FREE);
  eq("an unknown plan value is not Pro",
    planFromDoc({ fields: { plan: { stringValue: "gold" } } }).plan, PLAN_FREE);

  const doc = {
    fields: {
      plan: { stringValue: "premium" },
      planValidUntil: { integerValue: "1790000000000" },
      planRenews: { booleanValue: true },
      createdAt: { integerValue: "1750000000000" },
    },
  };
  const pro = planFromDoc(doc);
  eq("premium reads as Pro", pro.plan, PLAN_PRO);
  eq("the date comes back as a number", pro.validUntil, 1790000000000);
  eq("renewal is read", pro.renews, true);

  /* The words the terminal prints. They are the only place the owner sees the state, so
     an expired plan has to say so rather than looking like a live one. */
  const now = Date.UTC(2026, 7, 21);
  check("a live plan names its end date",
    planText({ plan: PLAN_PRO, validUntil: Date.UTC(2027, 7, 21), renews: false }, now)
      .includes("2027-08-21"));
  check("an expired plan says it expired",
    planText({ plan: PLAN_PRO, validUntil: Date.UTC(2025, 7, 21), renews: false }, now)
      .includes("wygasł"));
  eq("a free plan is one word",
    planText({ plan: PLAN_FREE, validUntil: null, renews: false }, now), "free");
  eq("no date at all", dayText(null), "—");
}

/* ================================================================== 6. the assertion */

head("6. the JWT assertion: shape, life and signature");
{
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const sa = {
    client_email: "admin@materio-502513.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
    project_id: "materio-502513",
    token_uri: "https://oauth2.googleapis.com/token",
  };
  const now = Date.UTC(2026, 7, 21, 10, 0, 0);
  const jwt = jwtAssertion(sa, { now });
  const parts = jwt.split(".");
  eq("three parts", parts.length, 3);

  const decode = (s) => JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  const header = decode(parts[0]);
  const claims = decode(parts[1]);
  eq("signed RS256", header.alg, "RS256");
  eq("typed JWT", header.typ, "JWT");
  eq("issued by the service account", claims.iss, sa.client_email);
  eq("addressed to the token endpoint", claims.aud, sa.token_uri);
  eq("carrying the two scopes", claims.scope, SCOPES);
  eq("issued now", claims.iat, Math.floor(now / 1000));
  eq("and living exactly an hour", claims.exp - claims.iat, 3600);

  const ok = createVerify("RSA-SHA256")
    .update(`${parts[0]}.${parts[1]}`)
    .verify(publicKey, Buffer.from(parts[2], "base64url"));
  check("the signature verifies against the public key", ok);

  const tampered = `${parts[0]}.${Buffer.from(JSON.stringify({ ...claims, iss: "somebody@else" }))
    .toString("base64url")}.${parts[2]}`;
  const bad = createVerify("RSA-SHA256")
    .update(tampered.split(".").slice(0, 2).join("."))
    .verify(publicKey, Buffer.from(parts[2], "base64url"));
  check("and does not verify a rewritten claim set", !bad);
}

/* ================================================================== 7. the key */

head("7. the key has to belong to this project");
{
  const good = { client_email: "a@b", private_key: "x", project_id: "materio-502513" };
  eq("the right key passes", keyProblem(good, "materio-502513"), null);

  const other = keyProblem({ ...good, project_id: "somebody-else" }, "materio-502513");
  check("a key from another project is refused", typeof other === "string" && other.length > 0, String(other));
  check("and the message names both projects",
    String(other).includes("somebody-else") && String(other).includes("materio-502513"), String(other));

  for (const field of ["client_email", "private_key", "project_id"]) {
    const missing = { ...good };
    delete missing[field];
    check(`a key with no ${field} is refused`, keyProblem(missing, null) !== null);
  }
  check("and so is something that is not an object", keyProblem(null, null) !== null);

  eq("the project the site talks to is read out of the config",
    siteProjectId(), "materio-502513");
  eq("read from the source it is handed",
    siteProjectId('projectId: "other-project",'), "other-project");
}

/* ================================================================== 8. e-mail, and the limits */

head("8. the address, and what the script refuses before it opens a connection");
{
  for (const good of ["polednia@gmail.com", "a.b+c@sub.example.co.uk"]) {
    check(`accepts ${good}`, looksLikeEmail(good));
  }
  for (const bad of ["", "polednia", "a@b", "a b@c.pl", "@example.com", "a@@b.pl", null, 7]) {
    check(`refuses ${JSON.stringify(bad)}`, !looksLikeEmail(bad));
  }
  check("and refuses an address longer than an address can be",
    !looksLikeEmail(`${"a".repeat(250)}@example.com`));
}

/* ================================================================== 9. what it may not do */

head("9. the script writes to one place, and the repository is not it");
{
  const src = read("scripts/pro-admin.mjs");

  /* It reads two files — the key and assets/firebase-config.js — and writes none. A tool
     that edits the repository while holding an admin credential is a tool nobody can
     review by reading its output. */
  for (const forbidden of ["writeFileSync", "appendFileSync", "createWriteStream", "mkdirSync", "rmSync", "unlinkSync"]) {
    check(`never calls ${forbidden}`, !src.includes(forbidden));
  }
  eq("one PATCH in the whole file", (src.match(/method: "PATCH"/g) || []).length, 1);
  check("and it goes to the masked address", /patchUrl\(projectId, uid\), \{\s*method: "PATCH"/.test(src), "writePlan()");
  check("no DELETE anywhere", !src.includes('method: "DELETE"'));

  /* Every address it talks to, named here so a new one has to be added on purpose. */
  const hosts = [...src.matchAll(/https:\/\/([a-z0-9.-]+)\//g)].map((m) => m[1]);
  const allowed = ["firestore.googleapis.com", "identitytoolkit.googleapis.com",
    "oauth2.googleapis.com", "www.googleapis.com"];
  for (const host of new Set(hosts)) {
    check(`talks only to Google: ${host}`, allowed.includes(host), host);
  }

  check("the key never has a default path in the source",
    !/LM_SA_KEY[^\n]*\|\|\s*"[^"]+"/.test(src));
  check("and no key is committed beside it",
    !src.includes("BEGIN PRIVATE KEY") && !src.includes("BEGIN RSA PRIVATE KEY"));
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`pro-admin: ${passed}/${passed} checks pass`);
