/**
 * LiczMat — test biletu do kasy (znalezisko M1 audytu 2026-09).
 *
 * Sprawdza sześć rzeczy:
 *   1. że bilet wystawiony przez nas czyta się z powrotem na ten sam uid;
 *   2. że **nic** innego się nie czyta — goły uid, cudzy podpis, przestawione pole,
 *      obca wersja, bilet po terminie;
 *   3. że sekret naprawdę decyduje: ten sam bilet pod innym sekretem jest niczym;
 *   4. że żadne wejście nie rzuca wyjątkiem, bo po drugiej stronie jest webhook, który
 *      ma odpowiedzieć Stripe'owi, a nie wywrócić się na 500;
 *   5. że sam bilet nie niesie nic poza uidem i datą;
 *   6. że webhook i callable w functions/index.js są spięte z tym modułem, a przeglądarka
 *      nie wozi sekretu.
 *
 * Bez zależności, plain `node`, wyjście 1 przy błędzie.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TICKET_TTL_MS, looksLikeTicket, mintTicket, readTicket,
} from "../functions/pay-ticket.mjs";

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

const SECRET = "test-secret-not-the-real-one";
const OTHER = "test-secret-somebody-elses";
const UID = "aBc123_uid-XYZ";
const NOW = Date.UTC(2026, 8, 9, 12, 0, 0);

/* ================================================================== 1. there and back */

head("1. a ticket we minted reads back as the account that asked for it");
{
  const t = mintTicket(UID, SECRET, NOW);
  check("minting gives a string", typeof t === "string");
  eq("and it reads back as the same uid", readTicket(t, SECRET, NOW), UID);
  eq("an hour later it still does", readTicket(t, SECRET, NOW + 3600e3), UID);
  eq("a minute before it lapses it still does",
    readTicket(t, SECRET, NOW + TICKET_TTL_MS - 60e3), UID);
}

/* ================================================================== 2. and nothing else */

head("2. nothing that is not our ticket reads as an account");
{
  const t = mintTicket(UID, SECRET, NOW);
  const parts = t.split(".");

  eq("a raw uid in the URL is not an account any more", readTicket(UID, SECRET, NOW), null);
  eq("nor is somebody else's raw uid", readTicket("someoneElsesUid", SECRET, NOW), null);
  eq("a ticket signed with another secret is nothing",
    readTicket(mintTicket(UID, OTHER, NOW), SECRET, NOW), null);
  eq("and our own ticket read under another secret is nothing",
    readTicket(t, OTHER, NOW), null);

  eq("a swapped uid keeps the old signature, so it fails",
    readTicket(`v1.${Buffer.from("victimUid").toString("base64url")}.${parts[2]}.${parts[3]}`,
      SECRET, NOW), null);
  eq("a stretched expiry fails the same way",
    readTicket(`v1.${parts[1]}.${Number(parts[2]) + 999999}.${parts[3]}`, SECRET, NOW), null);
  eq("a truncated signature fails", readTicket(parts.slice(0, 3).join("."), SECRET, NOW), null);
  eq("so does one extra field", readTicket(`${t}.x`, SECRET, NOW), null);
  eq("an unknown version is refused", readTicket(t.replace(/^v1\./, "v2."), SECRET, NOW), null);
  eq("the day after, the ticket is over", readTicket(t, SECRET, NOW + TICKET_TTL_MS + 1), null);
  eq("exactly at the second it lapses, it is over",
    readTicket(t, SECRET, Math.ceil((NOW + TICKET_TTL_MS) / 1000) * 1000), null);
}

/* ================================================================== 3. nothing throws */

head("3. every shape of rubbish answers null, none of it throws");
{
  const rubbish = [
    undefined, null, 0, 1, true, {}, [], "", ".", "v1", "v1.", "v1...", "v1.a.b.c",
    "v1.@@@.1788000000.@@@", `v1.${"a".repeat(5000)}.1788000000.zz`,
    "v1.YQ.1788000000.", "v1.YQ..zz", "v1.YQ.-1.zz", "v1.YQ.1e9.zz",
  ];
  let threw = null;
  for (const value of rubbish) {
    try {
      if (readTicket(value, SECRET, NOW) !== null) threw = `read ${JSON.stringify(value)}`;
    } catch (e) { threw = `threw on ${JSON.stringify(value)}: ${e.message}`; }
  }
  check("no input reads as an account and none throws", threw === null, threw);

  eq("minting refuses a uid outside the Firebase alphabet",
    mintTicket("nie uid", SECRET, NOW), null);
  eq("minting refuses an empty secret", mintTicket(UID, "", NOW), null);
  eq("minting refuses a non-string uid", mintTicket({ uid: UID }, SECRET, NOW), null);
  eq("minting refuses a ttl of zero", mintTicket(UID, SECRET, NOW, 0), null);

  check("looksLikeTicket tells a ticket from a raw uid",
    looksLikeTicket(mintTicket(UID, SECRET, NOW)) && !looksLikeTicket(UID));
}

/* ================================================================== 4. what it carries */

head("4. the ticket carries the uid and the date, and nothing else");
{
  const t = mintTicket(UID, SECRET, NOW);
  check("the secret is not in it", !t.includes(SECRET));
  check("no e-mail address could be in it", !t.includes("@"));
  eq("the expiry is seconds, not milliseconds",
    Number(t.split(".")[2]), Math.floor((NOW + TICKET_TTL_MS) / 1000));
  eq("the uid is the only payload",
    Buffer.from(t.split(".")[1], "base64url").toString("utf8"), UID);
  check("a day is what Stripe keeps a Checkout session open for",
    TICKET_TTL_MS === 24 * 60 * 60 * 1000);
}

/* ================================================================== 5. wired in */

head("5. the webhook reads the ticket, and the browser never sees the secret");
{
  const FUNCTION = read("functions/index.js");
  const PAY = read("assets/pay.js");
  const APP = read("assets/app.js");

  check("functions/index.js reads tickets through this module",
    FUNCTION.includes("pay-ticket.mjs") && FUNCTION.includes("readTicket("));
  check("and mints them in a callable of its own",
    FUNCTION.includes("mintTicket(") && FUNCTION.includes("export const payTicket"));
  check("the secret is a Secret Manager entry, not a literal",
    FUNCTION.includes('defineSecret("PAY_TICKET_SECRET")')
    && !/PAY_TICKET_SECRET\s*=\s*"[^"]{8,}"/.test(FUNCTION));

  /* The deploy note in assets/pay.js names the secret, because the owner reads that note
     before running `firebase functions:secrets:set`. Naming it in prose is not carrying it,
     so the check reads the code with the commentary taken out — the same crude strip
     scripts/test-admin-map.mjs uses for the same reason. */
  const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check("no browser code names the secret",
    !code(PAY).includes("PAY_TICKET_SECRET") && !code(APP).includes("PAY_TICKET_SECRET"));
  check("and no browser file signs anything itself",
    !PAY.includes("createHmac") && !APP.includes("createHmac"));
  check("no browser file mints a ticket",
    !PAY.includes("mintTicket") && !APP.includes("mintTicket"));
  check("the checkout URL carries the ticket, not the uid",
    PAY.includes("client_reference_id") && /o\.ref/.test(PAY) && !/o\.uid/.test(PAY));
  check("and the account page asks the cloud for it",
    APP.includes('"payTicket"'));
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\npay ticket: ${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`pay ticket: ${passed}/${passed} checks pass`);
