#!/usr/bin/env node
/**
 * LiczMat — generator iCalendar sprawdzony bez chmury.
 *
 *     node scripts/test-calendar-ics.mjs
 *
 * Sprawdzane jest to:
 *   1. wyłącznie CRLF i fizyczne linie po najwyżej 75 oktetów;
 *   2. składanie UTF-8 nie rozcina znaków, a rozwinięcie przywraca treść;
 *   3. escaping backslash, średnika, przecinka i nowych linii;
 *   4. filtrowanie i sortowanie otwartych terminów;
 *   5. DTEND jest następnym dniem także na końcach miesięcy, roku i w roku przestępnym;
 *   6. stabilny UID, opis klienta i poprawny pusty kalendarz;
 *   7. walidacja 43-znakowego tokenu base64url;
 *   8. serwerowa i przeglądarkowa kopia dają byte-identyczny wynik.
 *
 * Plain node, bez Firebase, sieci i zewnętrznych zależności; exit 1 przy błędzie.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildIcs, icsProjects, looksLikeFeedToken } from "../functions/calendar-ics.mjs";

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) { passed++; return; }
  failures.push(`${name}${detail ? `\n    ${detail}` : ""}`);
}
function eq(name, got, want) {
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

const NOW = Date.UTC(2026, 9, 5, 12, 34, 56);
const base = { id: "projekt-1", name: "Łazienka", status: "active", dueDate: "2026-10-07" };
const longNote = "Zażółć gęślą jaźń; ".repeat(12) + "koniec";
const longCalendar = buildIcs([{ ...base, note: longNote }], { calName: "LiczMat", now: NOW });

check("1. no bare LF", !/(^|[^\r])\n/.test(longCalendar));
for (const line of longCalendar.slice(0, -2).split("\r\n")) {
  check("1. physical line <= 75 octets", Buffer.byteLength(line, "utf8") <= 75, line);
}
check("2. UTF-8 remains decodable", !longCalendar.includes("�"));
const unfolded = longCalendar.replace(/\r\n /g, "");
const wantedDescription = `DESCRIPTION:${longNote.replace(/\\/g, "\\\\").replace(/;/g, "\\;")}`;
check("2. unfolding restores long logical line", unfolded.includes(wantedDescription));

const escaped = buildIcs([{ ...base, name: "A\\B; C,D", note: "pierwsza\r\ndruga\rtrzecia" }],
  { calName: "K,alendarz; \\", now: NOW }).replace(/\r\n /g, "");
check("3. summary escapes text", escaped.includes("SUMMARY:A\\\\B\\; C\\,D\r\n"));
check("3. description normalizes and escapes newlines",
  escaped.includes("DESCRIPTION:pierwsza\\ndruga\\ntrzecia\r\n"));
check("3. calendar name escapes text", escaped.includes("X-WR-CALNAME:K\\,alendarz\\; \\\\\r\n"));

const candidates = [
  { ...base, id: "b", name: "Beta" }, { ...base, id: "a", name: "Alfa" },
  { ...base, id: "deleted", deletedAt: 1 }, { ...base, id: "archived", archived: true },
  { ...base, id: "done", status: "done" }, { ...base, id: "cancelled", status: "cancelled" },
  { ...base, id: "empty", dueDate: "" }, { ...base, id: "shape", dueDate: "07-10-2026" },
  { ...base, id: "fake", dueDate: "2026-02-30" },
];
eq("4. only open valid dates remain", icsProjects(candidates).map((p) => p.id).join(","), "a,b");

for (const [day, next] of [["2026-01-31", "20260201"], ["2026-12-31", "20270101"],
  ["2028-02-28", "20280229"], ["2028-02-29", "20280301"]]) {
  const out = buildIcs([{ ...base, dueDate: day }], { calName: "LiczMat", now: NOW });
  check(`5. next day after ${day}`, out.includes(`DTEND;VALUE=DATE:${next}\r\n`));
}

const rich = buildIcs([{ ...base, clientId: "c1", note: "Notatka", updatedAt: NOW }],
  { calName: "LiczMat", clientsById: { c1: "Klient" }, now: 0 }).replace(/\r\n /g, "");
check("6. stable UID", rich.includes("UID:projekt-1@liczmat.com\r\n"));
check("6. client and note in description", rich.includes("DESCRIPTION:Klient\\nNotatka\r\n"));
const located = buildIcs([{ ...base, clientId: "c1", note: "Opis zostaje" }], {
  calName: "LiczMat",
  clientsById: { c1: {
    name: "Klient", street: "Długa 1, lokal 2; oficyna\\A", postalCode: "00-001",
    city: "Bardzo Długie Miasto Żółtej Gęśli", country: "PL",
  } },
  now: NOW,
});
const locatedUnfolded = located.replace(/\r\n /g, "");
check("6. location escapes address punctuation", locatedUnfolded.includes(
  "LOCATION:Długa 1\\, lokal 2\\; oficyna\\\\A\\, 00-001 Bardzo Długie Miasto Żółtej Gęśli\\, PL\r\n"));
check("6. long escaped location is folded", /LOCATION:[^\r\n]+\r\n [^\r\n]+/.test(located));
check("6. location does not replace description", locatedUnfolded.includes("DESCRIPTION:Klient\\nOpis zostaje\r\n"));
const empty = buildIcs([], { calName: "LiczMat", now: NOW });
check("6. empty calendar has boundaries", empty.startsWith("BEGIN:VCALENDAR\r\n")
  && empty.endsWith("END:VCALENDAR\r\n") && !empty.includes("BEGIN:VEVENT"));

check("7. valid token", looksLikeFeedToken("A".repeat(42) + "_"));
check("7. rejects short token", !looksLikeFeedToken("A".repeat(42)));
check("7. rejects non-base64url token", !looksLikeFeedToken("A".repeat(42) + "+"));

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browserCode = readFileSync(join(root, "assets/calendar-ics.js"), "utf8");
const context = { window: {}, Date, TextEncoder };
vm.createContext(context);
vm.runInContext(browserCode, context);
const parityInputs = [[], [{ ...base }], [{ ...base, note: longNote, clientId: "c1" }], candidates];
for (const projects of parityInputs) {
  const options = { calName: "LiczMat, terminarz", clientsById: { c1: { name: "Żaneta" } }, now: NOW };
  eq("8. browser/server byte parity", context.window.lmIcs.buildIcs(projects, options),
    buildIcs(projects, options));
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} failure(s), ${passed} check(s) passed`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}
console.log(`OK: ${passed} calendar iCalendar checks passed`);
