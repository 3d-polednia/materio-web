#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "functions/index.js"), "utf8");
let passed = 0;
const failures = [];
function check(name, condition) { if (condition) passed++; else failures.push(name); }
const block = (start, end) => source.slice(source.indexOf(start), end ? source.indexOf(end, source.indexOf(start)) : source.length);

for (const name of ["lifecycleMails", "mailLink", "mailPrefs", "adminMail"]) check(`exports ${name}`, source.includes(`export const ${name} =`));
check("imports onSchedule", source.includes('from "firebase-functions/v2/scheduler"'));
check("live flag defaults false", /defineString\("LIFECYCLE_LIVE",\s*\{\s*default:\s*"false"\s*\}\)/s.test(source));
const schedule = block("export const lifecycleMails", "export const mailLink");
check("daily schedule", schedule.includes('schedule: "0 10 * * *"'));
check("Warsaw timezone", schedule.includes('timeZone: "Europe/Warsaw"'));
check("schedule secret", schedule.includes("secrets: [SMTP_PASSWORD]"));
check("16 day candidates", schedule.includes('where("grantedAt", ">=", now - 16 * DAY)'));
check("dry run does not claim", schedule.includes('logger.info("lifecycle: dry-run", { uid, step: decision.send })'));
check("transaction claim", schedule.includes("runTransaction") && schedule.includes('status: "sending"'));
const link = block("export const mailLink", "export const mailPrefs");
check("mailLink request", link.includes("onRequest("));
check("mailLink CORS", link.includes("cors: MAIL_CORS") && source.includes('"https://liczmat.com"') && source.includes('"https://www.liczmat.com"') && source.includes("localhost"));
check("token checked", link.includes("tokenMatches("));
check("answer uses pure parser", link.includes("parseSurveyAnswer(input)"));
check("answer stores nullable use", link.includes("use: answer.use"));
check("answer stores optional missing", link.includes("missing: answer.missing"));
const prefs = block("export const mailPrefs", "export const adminMail");
check("prefs callable", prefs.includes("onCall("));
check("prefs auth", prefs.includes("request.auth"));
const admin = block("export const adminMail");
check("admin callable", admin.includes("onCall("));
check("admin secret", admin.includes("secrets: [SMTP_PASSWORD]"));
check("admin verifies claim", admin.includes("isAdmin(request.auth.token)"));
check("sendMail accepts headers", /async function sendMail\(\{ to, subject, text, html, headers \}\)/.test(source));
check("sendMail forwards headers", /to, subject, text, html, headers/.test(source));

if (failures.length) {
  console.error(`\nlifecycle wiring: ${failures.length} FAILED, ${passed} passed\n`);
  for (const failure of failures) console.error(`  x ${failure}`);
  process.exit(1);
}
console.log(`lifecycle wiring: ${passed}/${passed} checks pass`);
