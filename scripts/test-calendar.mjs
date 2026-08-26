#!/usr/bin/env node
/**
 * LiczMat — the terminarz, tested.
 *
 *     node scripts/test-calendar.mjs
 *
 * Master plan, session 25: "TERMINARZ — Terminy zleceń", and chapter XXIII under it:
 *
 *     Prosty terminarz zleceń. Powinien pozwolić zobaczyć: terminy, zlecenia, podstawowe
 *     informacje. Nie buduj pełnego odpowiednika Google Calendar.
 *
 * The whole session turns on one decision, and most of this file guards it: **the module
 * stores nothing**. A deadline is chapter XXI's `termin`, a field of the job, so the
 * terminarz is a reading of the jobs rather than a collection beside them. A second home
 * for a date is a date free to disagree with itself — the same argument that keeps a cost
 * off a job and a unit price off a shopping item.
 *
 * The halves:
 *
 *   1. the store — unchanged, byte for byte, by everything this module does;
 *   2. the day arithmetic — a calendar day is not an instant, and "today" is the
 *      visitor's own, which is checked under a real non-UTC timezone;
 *   3. the five buckets and their boundaries, including the closed jobs that are in none;
 *   4. crmSchedule() — the order, the counts, the closed half, and what a changed
 *      deadline or status does to them;
 *   5. the one write, which is the job's own;
 *   6. the route, and chapter XXV's gate in both of its states;
 *   7. the frame the build writes, and the copy in four languages.
 *
 * The other half — clicking it through in Chromium — is scripts/test-calendar-page.mjs.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on failure.
 */

/* Set before anything reads a date: Node picks the zone up per operation, and the point of
   §2 is that a calendar day computed in UTC is the wrong day for half of every evening.
   Europe/Warsaw is the site's own first market and is never UTC. */
process.env.TZ = "Europe/Warsaw";

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { calendarMain, jobsMain } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG, SECTION, urlCalendar, urlJobs } from "../src/site.mjs";
import { LEVEL, STATUS, route, validateIA } from "../src/ia.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

function evalSource(src, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
const evalScript = (file, returns, globals) => evalSource(read(file), returns, globals);

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);
const DICT = {};
for (const lang of LANGS) {
  DICT[lang] = {
    ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}), ...(I18N_MATERIALS[lang] || {}),
  };
}
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/**
 * assets/workspace.js and assets/crm.js in Node, in one scope — which is how the browser
 * loads them.
 *
 * The clock is stubbed in both directions here, unlike in the other suites: `Date.now()`
 * for the stored timestamps, and `new Date()` with no arguments for crmToday(), which
 * reads the local calendar day out of it. Without the second one "today" would be the day
 * the test happens to run on and every boundary below would be untestable.
 */
function loadCrm({ now = Date.parse("2026-08-19T09:00:00+02:00") } = {}) {
  const backing = new Map();
  const clock = { now, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const api = evalScript(["assets/workspace.js", "assets/crm-store.js", "assets/crm.js"], [
    "wsAddProject", "wsProject", "wsProjects", "wsExport",
    "crmAddClient", "crmClient",
    "crmAllJobs", "crmOpenJobs", "crmClosedJobs", "crmJob", "crmAddJob", "crmUpdateJob",
    "crmSetJobStatus", "crmDeleteJob", "crmRestoreJob",
    "crmDay", "crmToday", "crmDaysUntil", "crmJobBucket", "crmSchedule",
    "CAL_BUCKETS", "CAL_SOON_DAYS",
    "JOB_STATUS", "JOB_OPEN_STATUS", "CRM_KEY",
  ], {
    localStorage,
    document: { dispatchEvent: (e) => events.push(e.type) },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [clock.now])); }
      static now() { return clock.now; }
      static parse(v) { return Date.parse(v); }
    },
    lmCurrency: () => clock.currency,
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("liczmat-crm-v1") || "{}"),
    workspaceRaw: () => JSON.parse(backing.get("materio-workspace-v1") || "{}"),
    keys: () => [...backing.keys()],
    events,
    tick: (ms) => { clock.now += ms || 1000; },
    setNow: (v) => { clock.now = typeof v === "string" ? Date.parse(v) : v; },
  };
}

/** assets/plan.js as the browser loads it: after assets/account.js, in one scope. */
function loadPlan({ open = false } = {}) {
  let src = read(["assets/account.js", "assets/plan.js"]);
  if (open) {
    const before = src;
    src = src.replace("var LM_PRO_LOCKED = true;", "var LM_PRO_LOCKED = false;");
    if (src === before) throw new Error("LM_PRO_LOCKED is no longer one line in assets/plan.js");
  }
  return evalSource(src, [
    "LM_LEVEL", "LM_FEATURES", "LM_PRO_LOCKED", "lmFeature", "lmCan", "lmFeatureState", "lmPaywall",
  ], { document: undefined, localStorage: undefined });
}

/* The permission table as the browser has it, for the page builders: proGate() renders
   the wall out of LM_FEATURES, so a test that called clientsMain() without it would be
   checking a page the build never writes. */
const FEATURES = loadPlan().LM_FEATURES;

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

/* ================================================================== 1. it stores nothing */

head("1. the terminarz is a reading of the jobs, not a collection beside them");
{
  const crm = loadCrm();
  crm.crmAddJob({ name: "Łazienka", dueDate: "2026-08-25" });
  const before = JSON.stringify(crm.raw());
  const sched = crm.crmSchedule();

  eq("reading the schedule writes nothing", JSON.stringify(crm.raw()), before);
  eq("the Pro store still holds exactly its three collections",
    Object.keys(crm.raw()).sort().join(), "clients,jobs,quotes");
  check("and no calendar or events collection has appeared",
    !Object.keys(crm.raw()).some((k) => /calendar|event|schedule|termin/i.test(k)),
    Object.keys(crm.raw()).join());
  eq("no key of its own is written either", crm.keys().sort().join(), "liczmat-crm-v1");

  // A deadline has exactly one home, and it is the job's own field.
  const job = crm.crmAllJobs()[0];
  eq("the date the schedule reports is the job's own", sched.buckets.soon[0].dueDate, job.dueDate);
  eq("which is chapter XXI's `dueDate`", job.dueDate, "2026-08-25");
  const dates = Object.keys(job).filter((k) => /due|deadline|termin/i.test(k));
  eq("and the job carries exactly one field for it", dates.join(), "dueDate");

  // wsExport() is what /app/ uploads. Nothing about the terminarz may reach it.
  const exported = crm.wsExport();
  eq("wsExport() carries no schedule", exported.schedule, undefined);
  eq("nor any events", exported.events, undefined);
  eq("and the workspace store is untouched by all of it",
    JSON.stringify(crm.workspaceRaw()), JSON.stringify(loadCrm().workspaceRaw()));
}

/* ================================================================== 2. the day arithmetic */

head("2. today is the visitor's own calendar day, never UTC's");
{
  // 2026-08-20, 00:30 in Warsaw — which is still 2026-08-19 in UTC. A terminarz that
  // reckoned in UTC would file a job due on the 20th as "due tomorrow" at half past
  // midnight on the 20th, and one due on the 19th as still open. It is wrong every
  // evening between 22:00 and midnight, which is when the day's paperwork gets done.
  const crm = loadCrm({ now: Date.parse("2026-08-20T00:30:00+02:00") });
  eq("today is the local day", crm.crmToday(), "2026-08-20");
  eq("and UTC would have said the day before",
    new Date(Date.parse("2026-08-20T00:30:00+02:00")).toISOString().slice(0, 10), "2026-08-19");

  const noon = loadCrm({ now: Date.parse("2026-08-19T12:00:00+02:00") });
  eq("a plain midday reads as itself", noon.crmToday(), "2026-08-19");
  check("and the string is exactly ten characters", /^\d{4}-\d{2}-\d{2}$/.test(noon.crmToday()));
}

head("2b. the distance between two calendar days is a count of days");
{
  const crm = loadCrm();
  eq("today is zero days away", crm.crmDaysUntil("2026-08-19"), 0);
  eq("tomorrow is one", crm.crmDaysUntil("2026-08-20"), 1);
  eq("yesterday is minus one", crm.crmDaysUntil("2026-08-18"), -1);
  eq("a week out is seven", crm.crmDaysUntil("2026-08-26"), 7);
  eq("and it counts across a month", crm.crmDaysUntil("2026-09-19"), 31);

  // The end of daylight saving in Europe is a 25-hour local day. Measured locally the
  // difference would come to 7.04 days and round the wrong way at the boundary; the
  // function reads both days at UTC midnight, which never has an hour added to it.
  eq("and across the end of daylight saving",
    crm.crmDaysUntil("2026-11-01", "2026-10-25"), 7);
  eq("and across the start of it", crm.crmDaysUntil("2026-04-01", "2026-03-25"), 7);

  eq("a date that is not one answers null", crm.crmDaysUntil("wkrótce"), null);
  eq("an empty deadline likewise", crm.crmDaysUntil(""), null);
  eq("and a day that does not exist", crm.crmDaysUntil("2026-02-31"), null);
  eq("a full ISO instant is refused rather than truncated",
    crm.crmDaysUntil("2026-08-20T23:00:00Z"), null);
  eq("the day it is measured from can be given", crm.crmDaysUntil("2026-08-19", "2026-08-12"), 7);
  eq("and a nonsense one answers null too", crm.crmDaysUntil("2026-08-19", "nigdy"), null);
}

/* ================================================================== 3. the buckets */

head("3. the five buckets of chapter XXIII, and where each boundary falls");
{
  const crm = loadCrm();
  eq("there are five", crm.CAL_BUCKETS.length, 5);
  eq("in the order the page draws them", crm.CAL_BUCKETS.join(),
    "late,today,soon,later,none");
  eq("and 'soon' reaches a week", crm.CAL_SOON_DAYS, 7);

  const at = (day) => crm.crmJobBucket(crm.crmAddJob({ name: `x${day}`, dueDate: day }), "2026-08-19");
  eq("a deadline long past is late", at("2026-01-01"), "late");
  eq("yesterday is late", at("2026-08-18"), "late");
  eq("today is today", at("2026-08-19"), "today");
  eq("tomorrow is soon", at("2026-08-20"), "soon");
  eq("the seventh day out is still soon", at("2026-08-26"), "soon");
  eq("the eighth is later", at("2026-08-27"), "later");
  eq("next year is later", at("2027-01-01"), "later");
  eq("and no deadline at all is its own bucket", at(""), "none");
}

head("3b. a closed job is in no bucket — a finished job is not late");
{
  const crm = loadCrm();
  const j = crm.crmAddJob({ name: "Kuchnia", dueDate: "2026-01-01" });
  eq("while it is new it is late", crm.crmJobBucket(crm.crmJob(j.id), "2026-08-19"), "late");
  crm.crmSetJobStatus(j.id, "active");
  eq("in progress it is still late", crm.crmJobBucket(crm.crmJob(j.id), "2026-08-19"), "late");
  crm.crmSetJobStatus(j.id, "done");
  eq("finished it is in none of them", crm.crmJobBucket(crm.crmJob(j.id), "2026-08-19"), "");
  crm.crmSetJobStatus(j.id, "cancelled");
  eq("and cancelled likewise", crm.crmJobBucket(crm.crmJob(j.id), "2026-08-19"), "");
  eq("which is exactly chapter XXI's open half", crm.JOB_OPEN_STATUS.join(), "new,active");
  eq("nothing at all is in no bucket, safely", crm.crmJobBucket(null, "2026-08-19"), "");
}

/* ================================================================== 4. the schedule */

head("4. crmSchedule() puts every job in one place, and only one");
{
  const crm = loadCrm();
  const rows = [
    ["Zaległa hydraulika", "2026-08-10"],
    ["Malowanie dziś", "2026-08-19"],
    ["Gres w piątek", "2026-08-21"],
    ["Poddasze we wrześniu", "2026-09-30"],
    ["Wycena bez daty", ""],
  ];
  rows.forEach(([name, dueDate]) => { crm.crmAddJob({ name, dueDate }); crm.tick(); });
  const closed = crm.crmAddJob({ name: "Skończona łazienka", dueDate: "2026-07-01" });
  crm.crmSetJobStatus(closed.id, "done");
  const closedUndated = crm.crmAddJob({ name: "Anulowana altana" });
  crm.crmSetJobStatus(closedUndated.id, "cancelled");

  const s = crm.crmSchedule();
  eq("today is the day it measured against", s.day, "2026-08-19");
  eq("one late", s.counts.late, 1);
  eq("one due today", s.counts.today, 1);
  eq("one within the week", s.counts.soon, 1);
  eq("one further out", s.counts.later, 1);
  eq("one with no date", s.counts.none, 1);
  eq("and one closed job that had a date", s.counts.closed, 1);
  eq("the closed job with no date is in nothing", s.total, 6);
  check("a closed, undated job is on none of the lists",
    !JSON.stringify(s).includes("Anulowana altana"));

  // Every open job appears exactly once. A row on two lists is a deadline counted twice.
  const seen = crm.CAL_BUCKETS.flatMap((b) => s.buckets[b].map((j) => j.id))
    .concat(s.closed.map((j) => j.id));
  eq("no job is on two lists", new Set(seen).size, seen.length);
}

head("4b. the nearest deadline is first, and the closed half reads backwards");
{
  const crm = loadCrm();
  ["2026-09-30", "2026-08-27", "2026-12-01"].forEach((d, i) => {
    crm.crmAddJob({ name: `L${i}`, dueDate: d });
    crm.tick();
  });
  const s = crm.crmSchedule();
  eq("the 'later' bucket is sorted by date, not by when it was typed",
    s.buckets.later.map((j) => j.dueDate).join(), "2026-08-27,2026-09-30,2026-12-01");

  const crm2 = loadCrm();
  ["2026-01-01", "2026-07-01", "2026-03-01"].forEach((d, i) => {
    const j = crm2.crmAddJob({ name: `Z${i}`, dueDate: d });
    crm2.crmSetJobStatus(j.id, "done");
    crm2.tick();
  });
  eq("the closed half puts the most recent deadline first",
    crm2.crmSchedule().closed.map((j) => j.dueDate).join(), "2026-07-01,2026-03-01,2026-01-01");

  // Nothing to sort an undated job by but the store's own order: newest change first,
  // which is what every other list in the Pro workspace uses.
  const crm3 = loadCrm();
  const a = crm3.crmAddJob({ name: "A" });
  crm3.tick();
  const b = crm3.crmAddJob({ name: "B" });
  eq("the undated bucket keeps the store's order",
    crm3.crmSchedule().buckets.none.map((j) => j.id).join(), `${b.id},${a.id}`);
}

head("4c. the schedule moves when the job does, because it is the same row");
{
  const crm = loadCrm();
  const j = crm.crmAddJob({ name: "Elewacja", dueDate: "2026-08-30" });
  eq("it starts further out", crm.crmSchedule().counts.later, 1);

  crm.crmUpdateJob(j.id, { dueDate: "2026-08-21" });
  eq("a nearer date moves it into the week", crm.crmSchedule().counts.soon, 1);
  eq("and out of the one it was in", crm.crmSchedule().counts.later, 0);

  crm.crmUpdateJob(j.id, { dueDate: "" });
  eq("clearing the date moves it to the undated list", crm.crmSchedule().counts.none, 1);

  crm.crmUpdateJob(j.id, { dueDate: "2026-08-01" });
  eq("a date in the past makes it late", crm.crmSchedule().counts.late, 1);
  crm.crmSetJobStatus(j.id, "done");
  eq("finishing it takes it off the late list", crm.crmSchedule().counts.late, 0);
  eq("and into the closed half", crm.crmSchedule().counts.closed, 1);

  const token = crm.crmDeleteJob(j.id);
  eq("a deleted job is on no list at all", crm.crmSchedule().total, 0);
  crm.crmRestoreJob(token);
  eq("and the undo puts it back where it was", crm.crmSchedule().counts.closed, 1);
}

head("4d. an empty store is an empty schedule, not a crash");
{
  const crm = loadCrm();
  const s = crm.crmSchedule();
  eq("no jobs at all", s.total, 0);
  eq("every bucket is a list", crm.CAL_BUCKETS.filter((b) => Array.isArray(s.buckets[b])).length, 5);
  eq("the closed half too", Array.isArray(s.closed), true);
  eq("and the day is still today", s.day, "2026-08-19");

  // The tests pass a day in; the page does not, and gets crmToday(). A nonsense one
  // falls back rather than filing every job under a date that does not exist.
  eq("a given day is used", crm.crmSchedule("2026-01-01").day, "2026-01-01");
  eq("a nonsense one falls back to today", crm.crmSchedule("kiedyś").day, "2026-08-19");
}

/* ================================================================== 5. the one write */

head("5. the only thing the terminarz writes is the job's own deadline");
{
  const crm = loadCrm();
  const client = crm.crmAddClient({ name: "Jan Kowalski" });
  const project = crm.wsAddProject("Remont łazienki");
  const j = crm.crmAddJob({
    name: "Łazienka", clientId: client.id, projectId: project.id,
    status: "active", description: "Skucie glazury.", note: "Klucze u sąsiada.",
    valueMajor: "12500",
  });
  const wsBefore = JSON.stringify(crm.workspaceRaw());
  crm.tick();

  const after = crm.crmUpdateJob(j.id, { dueDate: "2026-08-21" });
  eq("the date is stored", after.dueDate, "2026-08-21");
  eq("the name is untouched", after.name, "Łazienka");
  eq("the status too", after.status, "active");
  eq("the client link", after.clientId, client.id);
  eq("the project link", after.projectId, project.id);
  eq("the description", after.description, "Skucie glazury.");
  eq("the note", after.note, "Klucze u sąsiada.");
  eq("the agreed value", after.valueMinor, 1_250_000);
  eq("and its currency", after.currencyCode, "PLN");
  check("updatedAt moved, because the row did", after.updatedAt > j.updatedAt);
  eq("the project document is byte-for-byte what it was",
    JSON.stringify(crm.workspaceRaw()), wsBefore);

  // The same validation as /zlecenia/, because it is the same call: a date that is not a
  // calendar day is refused rather than half-stored.
  eq("a nonsense date clears the field instead of storing itself",
    crm.crmUpdateJob(j.id, { dueDate: "za tydzień" }).dueDate, "");
  eq("a day that does not exist likewise",
    crm.crmUpdateJob(j.id, { dueDate: "2026-02-31" }).dueDate, "");
  eq("and a full ISO instant is not truncated into one",
    crm.crmUpdateJob(j.id, { dueDate: "2026-08-21T23:00:00Z" }).dueDate, "");
  eq("a real one still goes in", crm.crmUpdateJob(j.id, { dueDate: "2026-02-28" }).dueDate,
    "2026-02-28");
  eq("a leap day is a real day", crm.crmUpdateJob(j.id, { dueDate: "2028-02-29" }).dueDate,
    "2028-02-29");
}

/* ================================================================== 6. the route */

head("6. the route says what the page is, and the architecture still validates");
{
  eq("the IA has nothing to complain about", validateIA().join("\n"), "");

  const r = route("calendar");
  eq("/terminarz/ is built", r.status, STATUS.LIVE);
  eq("it is a Pro page", r.level, LEVEL.PRO);
  check("and says what a free user sees instead", Boolean(r.gate) && r.gate.length > 40);
  eq("the link is offered at Pro", r.navLevel, LEVEL.PRO);
  check("it is in the footer, so it is linked from every page", Boolean(r.footer));
  eq("and indexable — chapter XXVI", r.indexable, true);
  eq("it sits under the jobs, whose dates it shows", r.parent, "jobs");

  // The one shape difference from the other three Pro modules, and it follows from the
  // module storing nothing: there is no row of its own to open.
  eq("there is no `calendar` view route", route("calendarEntry"), undefined);
  check("and the route declares no id-carrying path", r.path.length <= 1, String(r.path.length));

  for (const lang of LANGS) {
    check(`${lang}: the section has a slug`, Boolean(SECTION.calendar[lang]));
    check(`${lang}: and the page is a directory, with no query on it`,
      urlCalendar(lang).endsWith("/") && !urlCalendar(lang).includes("?"), urlCalendar(lang));
  }
  // A slug is permanent, and these are the ones the route has carried as `plannedSlug`
  // since session 3. Turning the page on moves them; it does not rename them.
  eq("the Polish slug", SECTION.calendar.pl, "terminarz");
  eq("the German one", SECTION.calendar.de, "termine");
  eq("the English one", SECTION.calendar.en, "schedule");
  eq("and the transliterated Ukrainian one", SECTION.calendar.uk, "kalendar");
}

head("6b. chapter XXV's paywall, in both of its states");
{
  // The shipped value since session 27. `open` below is the same file with the switch
  // put back, so the answer the module ran under for sessions 22–26 stays tested.
  const shipped = loadPlan();
  eq("the paywall is up", shipped.LM_PRO_LOCKED, true);
  const open = loadPlan({ open: true });

  const guest = open.lmFeatureState("calendar", open.LM_LEVEL.GUEST);
  eq("a guest is not allowed the module", guest.allowed, false);
  eq("so the page says it is Pro", guest.gated, true);
  eq("but the module still runs", guest.locked, false);
  eq("and the state names the feature it is about", guest.feature.id, "calendar");

  const pro = open.lmFeatureState("calendar", open.LM_LEVEL.PRO);
  eq("a Pro account is allowed it", pro.allowed, true);
  eq("with nothing to say about a gate", pro.gated, false);

  const later = shipped.lmFeatureState("calendar", shipped.LM_LEVEL.LICZMAT);
  eq("with the paywall up the same visitor is gated", later.gated, true);
  eq("and the module is replaced by the wall", later.locked, true);
  eq("while Pro is unaffected", shipped.lmFeatureState("calendar", shipped.LM_LEVEL.PRO).locked, false);

  // Chapter XXV's "przejście Free → Pro", one rung per level: a guest has no account for
  // a plan to sit on, so they are sent to make one; a free account is offered the upgrade.
  eq("a guest is sent to make an account",
    shipped.lmPaywall("calendar", shipped.LM_LEVEL.GUEST).step, "account");
  eq("a free account is offered the upgrade",
    shipped.lmPaywall("calendar", shipped.LM_LEVEL.LICZMAT).step, "upgrade");
  eq("and a Pro account has nothing left to do",
    shipped.lmPaywall("calendar", shipped.LM_LEVEL.PRO).step, "none");
  eq("with the module open for them", shipped.lmPaywall("calendar", shipped.LM_LEVEL.PRO).open, true);

  eq("the calendar feature is PRO", open.lmFeature("calendar").level, open.LM_LEVEL.PRO);
  eq("built by session 25", open.lmFeature("calendar").session, 25);
  eq("a free account still cannot claim it", open.lmCan("calendar", open.LM_LEVEL.LICZMAT), false);
  eq("and it points at the route that was just turned on",
    open.lmFeature("calendar").route, "calendar");
}

/* ================================================================== 7. the frame */

head("7. the page the build writes");
{
  const t = tr(DEFAULT_LANG);
  const html = calendarMain(DEFAULT_LANG, t, FEATURES).main;
  const has = (needle, why) => check(why, html.includes(needle), needle);

  // Every id assets/schedule-ui.js reaches for. A renamed element is a screen that
  // silently stops filling in, and the browser test would be the only thing to notice.
  for (const id of [
    "cal-page", "cal-pro", "cal-pro-chip", "cal-gate", "cal-tool",
    "cal-today", "cal-fig-late", "cal-fig-today", "cal-fig-soon", "cal-empty",
    "cal-closed", "cal-closed-summary", "cal-closed-list",
  ]) {
    has(`id="${id}"`, `the script's "${id}" is on the page`);
  }
  for (const b of ["late", "today", "soon", "later", "none"]) {
    has(`id="cal-sec-${b}"`, `the "${b}" bucket has a section`);
    has(`id="cal-h-${b}"`, `and a heading the count is written into`);
    has(`id="cal-list-${b}"`, `and a list the rows go in`);
    has(t(`cal_${b}_t`), `the "${b}" bucket is named in the markup`);
    has(t(`cal_${b}_d`), `and described there, for a reader with no JavaScript`);
  }

  has("<h1", "the page has one heading");
  has('class="breadcrumbs"', "and a trail back");
  has(t("pro_locked"), "chapter XXV's words are in the markup, not only in a script");
  has(t("pro_need_pro"), "with the sentence a free account is shown");
  has(t("cal_local_note"), "and the honest note about where the rows live");
  has(t("cal_source_note"), "and the one that says the module stores nothing");
  has(t("feat_calendar_t"), "the gate names the module");
  has(t("feat_calendar_d"), "and describes it in full — chapter XXV");
  has('id="cal-gate" hidden', "the gate starts hidden");
  has('id="cal-empty" hidden', "and so does the note for a browser with no jobs");

  const code = html.replace(/<!--[\s\S]*?-->/g, "");
  check("nothing on the page calls prompt() or confirm()",
    !code.includes("prompt(") && !code.includes("confirm("));
  // Nothing about a job can be server-rendered: the rows are in one browser.
  check("the build writes no job data", !html.includes("liczmat-crm-v1"));
  check("and no date of its own — 'today' is the visitor's, computed in their browser",
    !/\d{4}-\d{2}-\d{2}/.test(code));

  for (const lang of LANGS) {
    const page = calendarMain(lang, tr(lang), FEATURES).main;
    check(`${lang}: the trail leads back to this language's jobs`, page.includes(urlJobs(lang)));
    const file = readFileSync(p(join(urlCalendar(lang), "index.html").replace(/^\//, "")), "utf8");
    check(`${lang}: and the page claims its own address as canonical`,
      file.includes(`<link rel="canonical" href="https://liczmat.com${urlCalendar(lang)}">`),
      urlCalendar(lang));
  }

  // Indexable means listed: a page that claims to be indexable and is missing from
  // sitemap.xml is a claim nothing backs. The file is generated, so this reads the
  // committed output rather than the intention.
  const sitemap = readFileSync(p("sitemap.xml"), "utf8");
  for (const lang of LANGS) {
    check(`${lang}: the page is in sitemap.xml`,
      sitemap.includes(`<loc>https://liczmat.com${urlCalendar(lang)}</loc>`), urlCalendar(lang));
  }

  // The page the deadlines belong to offers the one that shows them.
  const jobs = jobsMain(DEFAULT_LANG, t, FEATURES).main;
  check("the jobs page links to the terminarz", jobs.includes(urlCalendar(DEFAULT_LANG)));

  // The script the page is served with, read out of the build rather than assumed.
  const build = readFileSync(p("scripts/build.mjs"), "utf8");
  check("the page is served assets/schedule-ui.js", build.includes("/assets/schedule-ui.js"));
  const built = readFileSync(p(join(urlCalendar(DEFAULT_LANG), "index.html").replace(/^\//, "")), "utf8");
  check("the written page loads it", built.includes("/assets/schedule-ui.js"));
  check("and the store beside it", built.includes("/assets/crm.js"));
  check("the page is not noindex — it describes a Pro module in public",
    built.includes('name="robots" content="index, follow'), "robots");
}

/* ================================================================== 8. the copy */

head("8. the copy, in four languages");
{
  const KEYS = [
    "calpage_title", "calpage_lead", "calpage_meta",
    "cal_local_note", "cal_source_note",
    "cal_today_is", "cal_empty", "cal_due", "cal_due_set", "cal_jobs_all",
    "cal_late_t", "cal_late_d", "cal_today_t", "cal_today_d", "cal_soon_t", "cal_soon_d",
    "cal_later_t", "cal_later_d", "cal_none_t", "cal_none_d",
    "cal_closed_t", "cal_closed_d",
    // The keys session 25 leans on that were already here.
    "feat_calendar_t", "feat_calendar_d", "pro_locked", "pro_more", "cli_pro_yours",
    "jobpage_title", "job_st_new", "job_st_active", "job_st_done", "job_st_cancelled",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
  }
  for (const key of ["calpage_title", "cal_late_t", "cal_none_t", "cal_due_set"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }

  for (const lang of LANGS) {
    // Session 27 replaced the per-module "the module is open for now" sentence with the
    // paywall's own copy, which is shared by all five modules and says what to do next.
    check(`${lang}: the wall tells a guest to make an account`,
      DICT[lang].pro_need_account.length > 40);
    check(`${lang}: and a free account what it is on`, DICT[lang].pro_need_pro.length > 20);
    // Session 28 replaced the preview with the subscription. The wall now quotes a
    // price, so the copy that has to be right is the sentence for the state the site
    // actually ships in: priced, and not yet possible to buy.
    check(`${lang}: the subscription block names both plans`,
      DICT[lang].pay_monthly_t !== DICT[lang].pay_yearly_t);
    check(`${lang}: and says the subscription is not open yet`,
      DICT[lang].pay_soon.length > 40, DICT[lang].pay_soon);
    // Session 46 changed what this sentence is FOR. Until then it warned that the rows were
    // in this browser and nowhere else; they are in the sync contract now, so the note says
    // where they go instead — and naming localStorage here would be the old claim wearing
    // the new words. The storage detail is on /cookies/, which is the page for it.
    check(`${lang}: the note says the rows reach the phone`,
      DICT[lang].cal_local_note.includes("Android"), DICT[lang].cal_local_note);
    check(`${lang}: and it no longer names localStorage`,
      !DICT[lang].cal_local_note.includes("localStorage"), DICT[lang].cal_local_note);
    check(`${lang}: and it is a full sentence`, DICT[lang].cal_local_note.length > 100);
    // The sentence this session turns on: the module stores nothing of its own.
    check(`${lang}: the source note is a full sentence`, DICT[lang].cal_source_note.length > 60);
    check(`${lang}: the five buckets are five different words`,
      new Set(["late", "today", "soon", "later", "none"]
        .map((b) => DICT[lang][`cal_${b}_t`])).size === 5);
  }
  // Chapter XXIII's own vocabulary, in the language the plan is written in.
  eq("the page is called Terminarz in Polish", DICT.pl.calpage_title, "Terminarz");
  eq("the first bucket is Po terminie", DICT.pl.cal_late_t, "Po terminie");
  eq("the undated one is Bez terminu", DICT.pl.cal_none_t, "Bez terminu");
  eq("a deadline is a Termin", DICT.pl.cal_due, "Termin");
}

/* ------------------------------------------------------------------ report */

console.log(`\nschedule: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
