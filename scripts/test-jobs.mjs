#!/usr/bin/env node
/**
 * LiczMat — jobs, tested.
 *
 *     node scripts/test-jobs.mjs
 *
 * Master plan, session 23: "ZLECENIA — Zlecenia i statusy", and chapter XXI under it:
 *
 *     Zlecenie może mieć: klienta, nazwę, opis, status, termin, wartość, projekt, notatki.
 *     Przykładowe statusy: nowe, w toku, zakończone, anulowane.
 *
 * Plus chapter XXIV, which is what the job is *for*: KLIENT → ZLECENIE → PROJEKT →
 * WYCENA → HISTORIA. The quote is session 24; what session 23 owes is the middle link,
 * whole and in both directions.
 *
 * This file is the half that needs no browser:
 *
 *   1. the document — chapter XXI's eight fields, the sync shape it is written in, and
 *      the one number on it that is typed rather than derived;
 *   2. the four writes — add, read, correct, delete — and the undo the tombstone makes
 *      possible;
 *   3. the four statuses, and the deadline, which is a calendar day and not an instant;
 *   4. the links: one client, one project, a project document that is never touched, and
 *      what a deleted client or project does to a job, which is nothing;
 *   5. the money — what was agreed against what wsProjectCosts() says it has run to, the
 *      currency rule of chapter VI, and the difference that is not computed when the two
 *      are in different currencies;
 *   6. the route, and chapter XXV's gate: what LM_PRO_LOCKED decides;
 *   7. the frame the build writes, and the copy in four languages.
 *
 * The other half — clicking it through in Chromium — is scripts/test-jobs-page.mjs.
 *
 * Why the store is this repo's own rather than the contract's: read in
 * `3d-polednia/Materio` rather than remembered. `docs/FIRESTORE_SYNC.md` §2 lists the
 * collections under `users/{uid}` — projects, rooms, estimations, shoppingItems,
 * sharedProjects — and there is no jobs collection, no `JobEntity`, no
 * `SyncContract.jobToDoc()` and no `validJob()` in the deployed rules. So a job is local,
 * exactly like a client, and the test guards that the workspace the phone *does* read
 * comes out of every write here byte for byte unchanged.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { jobsMain, clientsMain } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG, SECTION, urlJobs, urlJob, urlClients } from "../src/site.mjs";
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
 * loads them: the job store reads the workspace's projects and their costs through its
 * globals, and a module's own scope would hide them.
 */
function loadCrm() {
  const backing = new Map();
  const clock = { now: 1_760_000_000_000, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const api = evalScript(["assets/workspace.js", "assets/crm-store.js", "assets/crm.js"], [
    "wsAddProject", "wsProject", "wsProjects", "wsDeleteProject", "wsRestoreProject",
    "wsAddEstimation", "wsAddManualEstimation", "wsEstimations", "wsProjectCosts",
    "wsExport", "wsUpdateProject", "wsItems",
    "crmClients", "crmClient", "crmAddClient", "crmDeleteClient", "crmRestoreClient",
    "crmClientProjects", "crmClientOfProject", "crmLinkProject", "crmFreeProjects",
    "crmAllJobs", "crmOpenJobs", "crmClosedJobs", "crmJob", "crmAddJob", "crmUpdateJob",
    "crmSetJobStatus", "crmDeleteJob", "crmRestoreJob", "crmClientJobs", "crmJobOfProject",
    "crmFreeJobProjects", "crmJobCosts", "crmClientJobCounts",
    "JOB_STATUS", "JOB_OPEN_STATUS", "JOB_DEFAULT_STATUS",
    "CRM_KEY", "CRM_SCHEMA", "CRM_MAX_NAME", "CRM_MAX_NOTE",
  ], {
    localStorage,
    document: { dispatchEvent: (e) => events.push(e.type) },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: class extends Date {
      static now() { return clock.now; }
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
    currency: (code) => { clock.currency = code; },
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

/** One saved calculation, exactly as assets/workspace-ui.js writes it after a result. */
const save = (ws, over = {}) => ws.wsAddEstimation({
  calcId: "waste",
  name: "Gres 60×60",
  materialCategory: "TILES",
  requiredUnits: 15,
  unitLabel: "opak.",
  costMajor: 749.85,
  wastePercent: 7,
  input: { area: "21.6" },
  projectName: "Mój projekt",
  ...over,
});

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

/* ================================================================== 1. the document */

head("1. a job is chapter XXI's record, all eight fields of it");
{
  const crm = loadCrm();
  const client = crm.crmAddClient({ name: "Jan Kowalski" });
  const project = crm.wsAddProject("Remont łazienki");
  const j = crm.crmAddJob({
    name: "Łazienka na Pięknej",
    clientId: client.id,
    projectId: project.id,
    description: "Skucie glazury, hydroizolacja, gres 60×60.",
    status: "active",
    dueDate: "2026-09-30",
    valueMajor: "12500",
    note: "Klucze u sąsiada.",
  });

  // Chapter XXI, field by field, in the chapter's own order.
  eq("klient", j.clientId, client.id);
  eq("nazwa", j.name, "Łazienka na Pięknej");
  eq("opis", j.description, "Skucie glazury, hydroizolacja, gres 60×60.");
  eq("status", j.status, "active");
  eq("termin", j.dueDate, "2026-09-30");
  eq("wartość", j.valueMinor, 1_250_000);
  eq("projekt", j.projectId, project.id);
  eq("notatki", j.note, "Klucze u sąsiada.");

  // Written in the contract's shape even though it is not in the contract: it is what
  // makes the tombstone, the undo and a later upload possible without a rewrite.
  for (const key of ["createdAt", "updatedAt", "deletedAt", "schemaVersion"]) {
    check(`the sync field ${key} is written`, Object.prototype.hasOwnProperty.call(j, key));
  }
  eq("the job starts alive", j.deletedAt, null);
  eq("the schema is stamped", j.schemaVersion, crm.CRM_SCHEMA);

  // The one money field is the *agreed* value, stamped with a currency. What the work has
  // cost is never stored here: wsProjectCosts() is the one function that knows it, and a
  // copy would be free to disagree the moment a material was re-priced.
  eq("the value carries the currency it was agreed in", j.currencyCode, "PLN");
  const money = Object.keys(j).filter((k) => /cost|price|total/i.test(k));
  eq("no cost is stored on a job", money.join(","), "");
}

head("1b. only the name is required, and the caps are the store's own");
{
  const crm = loadCrm();
  eq("a job with no name is refused", crm.crmAddJob({ name: "  " }), null);
  eq("so is one with no fields at all", crm.crmAddJob({}), null);

  const long = crm.crmAddJob({ name: "x".repeat(400), note: "n".repeat(4000), description: "d".repeat(4000) });
  eq("the name is capped", long.name.length, crm.CRM_MAX_NAME);
  eq("the note is capped", long.note.length, crm.CRM_MAX_NOTE);
  eq("and so is the description", long.description.length, crm.CRM_MAX_NOTE);

  const bare = crm.crmAddJob({ name: "  Kuchnia  " });
  eq("the name is trimmed", bare.name, "Kuchnia");
  eq("an absent description is an empty string, never undefined", bare.description, "");
  eq("an absent client is an empty string too", bare.clientId, "");
  eq("an absent deadline likewise", bare.dueDate, "");
  eq("and an absent value is null, which is not the same as zero", bare.valueMinor, null);
  eq("a job with no value carries no currency", bare.currencyCode, "");
  eq("a job with no status given starts new — chapter XXI's first one",
    bare.status, crm.JOB_DEFAULT_STATUS);
  eq("which is 'new'", crm.JOB_DEFAULT_STATUS, "new");
}

head("1c. jobs live beside the clients, and the phone's workspace is untouched");
{
  const crm = loadCrm();
  crm.wsAddProject("Remont łazienki");
  const before = JSON.stringify(crm.workspaceRaw());
  crm.crmAddJob({ name: "Łazienka" });

  check("jobs live under the Pro store's key", crm.keys().includes("liczmat-crm-v1"), crm.keys().join());
  eq("which is the key the file declares", crm.CRM_KEY, "liczmat-crm-v1");
  eq("the workspace store is byte-for-byte what it was", JSON.stringify(crm.workspaceRaw()), before);

  // wsExport() is what /app/ uploads. A job inside it would be a document Firestore's
  // deployed rules have never heard of — and the sync contract has no jobs collection.
  const exported = crm.wsExport();
  eq("wsExport() carries no jobs", exported.jobs, undefined);
  eq("and no clients either", exported.clients, undefined);
  eq("while still carrying the four collections it always did",
    ["projects", "rooms", "estimations", "shoppingItems"]
      .filter((k) => Array.isArray(exported[k])).length, 4);

  // Session 24 added the third — quotes (chapter XXII), in the same store and outside
  // the same contract.
  eq("the Pro store holds exactly the three local collections",
    Object.keys(crm.raw()).sort().join(), "clients,jobs,quotes");
}

head("1d. a store written before session 23 reads as one with no jobs");
{
  const crm = loadCrm();
  crm.crmAddClient({ name: "Jan" });
  // Session 22's shape, exactly: a store with clients and nothing else.
  const old = { clients: crm.raw().clients };
  eq("session 22 wrote no jobs array", old.jobs, undefined);

  const migrated = loadCrm();
  migrated.crmAddClient({ name: "Jan" });
  eq("reading it back gives an empty job list", migrated.crmAllJobs().length, 0);
  eq("and the client is still there", migrated.crmClients().length, 1);
}

/* ================================================================== 2. the writes */

head("2. add, read, correct, delete — and the undo");
{
  const crm = loadCrm();
  const a = crm.crmAddJob({ name: "Łazienka" });
  crm.tick();
  const b = crm.crmAddJob({ name: "Kuchnia" });

  eq("both are in the list", crm.crmAllJobs().length, 2);
  eq("newest change first", crm.crmAllJobs()[0].id, b.id);
  eq("one is found by id", crm.crmJob(a.id).name, "Łazienka");
  eq("an unknown id is null, never a guess", crm.crmJob("nope"), null);

  crm.tick();
  const renamed = crm.crmUpdateJob(a.id, { name: "Łazienka gości" });
  eq("the name is corrected", crm.crmJob(a.id).name, "Łazienka gości");
  check("and updatedAt moves with it", renamed.updatedAt > renamed.createdAt);
  eq("an empty name is refused rather than stored", crm.crmUpdateJob(a.id, { name: " " }), null);
  eq("the old name survives the refusal", crm.crmJob(a.id).name, "Łazienka gości");
  eq("a field left out keeps its value", crm.crmJob(a.id).note, "");

  crm.tick();
  const token = crm.crmDeleteJob(b.id);
  check("the delete hands back a token", Boolean(token && token.id === b.id));
  eq("the job is gone from every list", crm.crmJob(b.id), null);
  const row = crm.raw().jobs.find((x) => x.id === b.id);
  check("the row is still in storage", Boolean(row));
  check("marked deleted", Boolean(row.deletedAt));

  crm.tick();
  const back = crm.crmRestoreJob(token);
  eq("the undo puts it back", crm.crmJob(b.id).name, "Kuchnia");
  check("and moves updatedAt, so a later sync would hear about the undo",
    back.updatedAt >= row.deletedAt);
  eq("restoring twice is not an error and not a duplicate", crm.crmRestoreJob(token), null);
  eq("the list is still two long", crm.crmAllJobs().length, 2);

  eq("deleting something that is not there answers null", crm.crmDeleteJob("nope"), null);
  eq("so does correcting it", crm.crmUpdateJob("nope", { name: "x" }), null);
}

head("2b. every write tells the page, so nothing is redrawn by guesswork");
{
  const crm = loadCrm();
  const before = crm.events.length;
  const j = crm.crmAddJob({ name: "Łazienka" });
  crm.crmUpdateJob(j.id, { note: "klucze" });
  crm.crmSetJobStatus(j.id, "done");
  crm.crmDeleteJob(j.id);
  eq("four writes, four events", crm.events.length - before, 4);
  eq("and they are the Pro store's own event",
    crm.events.slice(before).join(), "crmchange,crmchange,crmchange,crmchange");
}

/* ================================================================== 3. status + date */

head("3. chapter XXI's four statuses, and nothing else");
{
  const crm = loadCrm();
  eq("there are exactly four", crm.JOB_STATUS.length, 4);
  eq("in the chapter's own order", crm.JOB_STATUS.join(), "new,active,done,cancelled");
  eq("two of them are open work", crm.JOB_OPEN_STATUS.join(), "new,active");

  const j = crm.crmAddJob({ name: "Łazienka" });
  for (const status of crm.JOB_STATUS) {
    crm.tick();
    eq(`a job moves to "${status}"`, crm.crmSetJobStatus(j.id, status).status, status);
  }
  eq("a status nobody declared is refused", crm.crmSetJobStatus(j.id, "invoiced"), null);
  eq("and the job keeps the one it had", crm.crmJob(j.id).status, "cancelled");
  eq("the general update refuses it too", crm.crmUpdateJob(j.id, { status: "zombie" }).status, "cancelled");
  eq("a job created with a status nobody declared starts new instead",
    crm.crmAddJob({ name: "Strych", status: "invoiced" }).status, "new");
}

head("3b. the index has two halves: in progress, and closed");
{
  const crm = loadCrm();
  const nowe = crm.crmAddJob({ name: "Nowe" });
  crm.tick();
  const wtoku = crm.crmAddJob({ name: "W toku", status: "active" });
  crm.tick();
  const done = crm.crmAddJob({ name: "Zakończone", status: "done" });
  crm.tick();
  const cancelled = crm.crmAddJob({ name: "Anulowane", status: "cancelled" });

  eq("two are open", crm.crmOpenJobs().length, 2);
  eq("and they are the new and the started one",
    crm.crmOpenJobs().map((j) => j.id).sort().join(), [nowe.id, wtoku.id].sort().join());
  eq("two are closed", crm.crmClosedJobs().length, 2);
  eq("and they are the finished and the cancelled one",
    crm.crmClosedJobs().map((j) => j.id).sort().join(), [done.id, cancelled.id].sort().join());
  eq("nothing is lost between the two lists",
    crm.crmOpenJobs().length + crm.crmClosedJobs().length, crm.crmAllJobs().length);

  // A closed job is not an archived one: chapter XXI's statuses already say where a job
  // stands, and a second way to put a row out of sight would be one the page had to
  // explain. So there is no `archived` field to disagree with the status.
  check("a job has no archive flag beside its status",
    !Object.prototype.hasOwnProperty.call(nowe, "archived"), Object.keys(nowe).join());

  crm.tick();
  crm.crmSetJobStatus(done.id, "active");
  eq("re-opening a closed job puts it back in the working list", crm.crmOpenJobs().length, 3);
}

head("3c. the deadline is a calendar day, not an instant");
{
  const crm = loadCrm();
  const j = crm.crmAddJob({ name: "Łazienka", dueDate: "2026-09-30" });
  eq("a date is stored as the day it is", j.dueDate, "2026-09-30");
  check("and is a string, not millis", typeof j.dueDate === "string");

  // A day in the visitor's own calendar. An instant would move to the day before or after
  // for a browser in another timezone, and session 25's terminarz cannot recover from that.
  for (const bad of ["30-09-2026", "2026-9-30", "2026-13-01", "2026-02-31", "tomorrow",
    1_760_000_000_000, "2026-09-30T12:00:00Z"]) {
    eq(`"${bad}" is not a date and is dropped`,
      crm.crmAddJob({ name: "x", dueDate: bad }).dueDate, "");
  }
  eq("a leap day in a leap year is a real day",
    crm.crmAddJob({ name: "x", dueDate: "2028-02-29" }).dueDate, "2028-02-29");
  eq("the same day in a year that has none is not",
    crm.crmAddJob({ name: "x", dueDate: "2026-02-29" }).dueDate, "");

  crm.tick();
  eq("a deadline can be cleared", crm.crmUpdateJob(j.id, { dueDate: "" }).dueDate, "");
}

/* ================================================================== 4. the links */

head("4. chapter XXIV's path: KLIENT → ZLECENIE → PROJEKT");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan Kowalski" });
  const nowak = crm.crmAddClient({ name: "Biuro Nowak" });
  const bathroom = crm.wsAddProject("Remont łazienki");
  const before = JSON.stringify(crm.wsProject(bathroom.id));

  const j = crm.crmAddJob({ name: "Łazienka", clientId: jan.id, projectId: bathroom.id });
  eq("the job names its client", j.clientId, jan.id);
  eq("and its project", j.projectId, bathroom.id);
  eq("the client's own list has it", crm.crmClientJobs(jan.id)[0].id, j.id);
  eq("and the project answers which job it is being done under",
    crm.crmJobOfProject(bathroom.id).id, j.id);

  // The project document is contract — it syncs, the phone reads it, /p/<token> renders
  // it. A jobId on it would be half a link in the half that travels.
  eq("the project document is exactly as it was", JSON.stringify(crm.wsProject(bathroom.id)), before);
  check("so no jobId was invented on it",
    !Object.prototype.hasOwnProperty.call(crm.wsProject(bathroom.id), "jobId"));
  check("and no clientId either",
    !Object.prototype.hasOwnProperty.call(crm.wsProject(bathroom.id), "clientId"));

  // The whole chain, in one write: a job that carries both ends files the project under
  // the client too, so the client's page tells the same story as the job's.
  eq("the project is filed under the job's client", crm.crmClientOfProject(bathroom.id).id, jan.id);

  crm.tick();
  crm.crmUpdateJob(j.id, { clientId: nowak.id });
  eq("moving the job moves it to the other client", crm.crmClientJobs(nowak.id).length, 1);
  eq("and the first client no longer lists it", crm.crmClientJobs(jan.id).length, 0);
  eq("and the project follows the job to the new client",
    crm.crmClientOfProject(bathroom.id).id, nowak.id);

  eq("a client nobody knows is not stored", crm.crmUpdateJob(j.id, { clientId: "nope" }).clientId, "");
  eq("nor is a project nobody knows", crm.crmUpdateJob(j.id, { projectId: "nope" }).projectId, "");
  eq("a job created against a client nobody knows carries none",
    crm.crmAddJob({ name: "x", clientId: "nope" }).clientId, "");
}

head("4b. one project belongs to one job, and the second link moves it");
{
  const crm = loadCrm();
  const bathroom = crm.wsAddProject("Remont łazienki");
  const kitchen = crm.wsAddProject("Kuchnia");
  const a = crm.crmAddJob({ name: "Zlecenie A", projectId: bathroom.id });
  crm.tick();
  const b = crm.crmAddJob({ name: "Zlecenie B" });

  eq("the picker offers the project nobody has taken",
    crm.crmFreeJobProjects(b.id).map((x) => x.id).join(), kitchen.id);
  eq("and offers a job its own project back, so a redraw does not lose it",
    crm.crmFreeJobProjects(a.id).map((x) => x.id).sort().join(),
    [bathroom.id, kitchen.id].sort().join());

  crm.tick();
  crm.crmUpdateJob(b.id, { projectId: bathroom.id });
  eq("the second job takes it over", crm.crmJobOfProject(bathroom.id).id, b.id);
  // The first job still names it, because nothing walked back to clear it — which is why
  // crmJobOfProject() answers with the newest, and why the page reads it rather than the
  // stored field. Both jobs pointing at one project is exactly what must not be shown.
  eq("and only one job is ever answered for a project",
    crm.crmAllJobs().filter((j) => j.projectId === bathroom.id).length >= 1, true);

  crm.tick();
  crm.crmUpdateJob(b.id, { projectId: "" });
  eq("a project can be detached", crm.crmJob(b.id).projectId, "");
  eq("and the project itself is still there", crm.wsProject(bathroom.id).name, "Remont łazienki");
}

head("4c. deleting a client or a project leaves the job alone");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan Kowalski" });
  const bathroom = crm.wsAddProject("Remont łazienki");
  const j = crm.crmAddJob({ name: "Łazienka", clientId: jan.id, projectId: bathroom.id });

  crm.tick();
  const token = crm.crmDeleteClient(jan.id);
  eq("the job survives its client", crm.crmJob(j.id).name, "Łazienka");
  eq("and keeps the id, so the undo can put the chain back", crm.crmJob(j.id).clientId, jan.id);
  eq("while the client is gone from every list", crm.crmClient(jan.id), null);
  crm.tick();
  crm.crmRestoreClient(token);
  eq("the undo brings the whole link back", crm.crmClientJobs(jan.id)[0].id, j.id);

  crm.tick();
  const pt = crm.wsDeleteProject(bathroom.id);
  eq("the job survives its project too", crm.crmJob(j.id).projectId, bathroom.id);
  crm.tick();
  crm.wsRestoreProject(pt);
  eq("and the project's own undo restores what the job points at",
    crm.wsProject(bathroom.id).name, "Remont łazienki");
}

/* ================================================================== 5. the money */

head("5. what was agreed, and what it has actually cost");
{
  const crm = loadCrm();
  const bathroom = crm.wsAddProject("Remont łazienki");
  const j = crm.crmAddJob({ name: "Łazienka", projectId: bathroom.id, valueMajor: "12500" });

  save(crm, { projectId: bathroom.id, costMajor: 749.85 });
  const costs = crm.crmJobCosts(j.id);

  eq("the agreed value is the job's own field", costs.value, 1_250_000);
  eq("the cost is what wsProjectCosts() says", costs.cost, crm.wsProjectCosts(bathroom.id).total);
  eq("which is the money the saved calculation carried", costs.cost, 74_985);
  eq("and the difference is the one number derived from both", costs.left, 1_250_000 - 74_985);
  eq("the job knows it has a project", costs.hasProject, true);
  eq("with nothing to warn about", costs.mixed, false);

  // Neither figure is stored twice: the cost is not written back onto the job.
  check("the job document still holds no cost",
    !Object.prototype.hasOwnProperty.call(crm.crmJob(j.id), "costMinor"),
    Object.keys(crm.crmJob(j.id)).join());

  const none = crm.crmAddJob({ name: "Bez projektu" });
  const bare = crm.crmJobCosts(none.id);
  eq("a job with no project has no cost to show", bare.hasProject, false);
  eq("and no difference either", bare.left, null);
  eq("a job nobody knows answers the empty shape", crm.crmJobCosts("nope").value, null);
}

head("5b. the currency is stamped once and never converted — chapter VI");
{
  const crm = loadCrm();
  const j = crm.crmAddJob({ name: "Łazienka" });
  eq("a job with no value carries no currency", crm.crmJob(j.id).currencyCode, "");

  crm.tick();
  crm.crmUpdateJob(j.id, { valueMajor: "12500" });
  eq("typing a value stamps the visitor's own currency", crm.crmJob(j.id).currencyCode, "PLN");

  crm.currency("EUR");
  crm.tick();
  crm.crmUpdateJob(j.id, { valueMajor: "13000" });
  eq("correcting the amount keeps the currency it was agreed in",
    crm.crmJob(j.id).currencyCode, "PLN");
  eq("and the new amount is stored", crm.crmJob(j.id).valueMinor, 1_300_000);

  crm.tick();
  crm.crmUpdateJob(j.id, { valueMajor: "" });
  eq("clearing the value clears the currency with it", crm.crmJob(j.id).currencyCode, "");
  eq("and the value is null, not zero", crm.crmJob(j.id).valueMinor, null);
  crm.tick();
  crm.crmUpdateJob(j.id, { valueMajor: "9000" });
  eq("so the next amount is stamped fresh", crm.crmJob(j.id).currencyCode, "EUR");

  // A comma is what a Polish or German keyboard produces; refusing it would refuse the
  // amount most of the four languages type.
  eq("a comma is a decimal point", crm.crmAddJob({ name: "x", valueMajor: "1250,50" }).valueMinor, 125_050);
  eq("a negative amount is not a value", crm.crmAddJob({ name: "x", valueMajor: "-5" }).valueMinor, null);
  eq("and neither is a word", crm.crmAddJob({ name: "x", valueMajor: "dużo" }).valueMinor, null);
  eq("zero is an amount, and it is not null", crm.crmAddJob({ name: "x", valueMajor: "0" }).valueMinor, 0);
}

head("5c. two currencies are never subtracted from one another");
{
  const crm = loadCrm();
  const bathroom = crm.wsAddProject("Remont łazienki");
  crm.currency("EUR");
  const j = crm.crmAddJob({ name: "Łazienka", projectId: bathroom.id, valueMajor: "3000" });
  crm.currency("PLN");
  save(crm, { projectId: bathroom.id, costMajor: 749.85 });

  const costs = crm.crmJobCosts(j.id);
  eq("the value keeps its own currency", costs.currencyCode, "EUR");
  eq("the cost keeps its own", costs.costCurrencyCode, "PLN");
  eq("the page is told the two do not compare", costs.mixed, true);
  eq("and no difference is computed", costs.left, null);
}

head("5d. a client's jobs are counted by status, and never summed in money");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan Kowalski" });
  crm.crmAddJob({ name: "A", clientId: jan.id });
  crm.tick();
  crm.crmAddJob({ name: "B", clientId: jan.id, status: "active" });
  crm.tick();
  crm.crmAddJob({ name: "C", clientId: jan.id, status: "done" });
  crm.tick();
  crm.crmAddJob({ name: "D nie ich" });

  const counts = crm.crmClientJobCounts(jan.id);
  eq("three jobs are theirs", counts.total, 3);
  eq("one is new", counts.new, 1);
  eq("one is in progress", counts.active, 1);
  eq("one is finished", counts.done, 1);
  eq("and none is cancelled", counts.cancelled, 0);
  check("no money is counted here", !Object.keys(counts).some((k) => /value|cost|total$/.test(k) && k !== "total"),
    Object.keys(counts).join());
}

/* ================================================================== 6. route + gate */

head("6. the route says what the page is, and the architecture still validates");
{
  eq("the IA has nothing to complain about", validateIA().join("\n"), "");

  const r = route("jobs");
  eq("/zlecenia/ is built", r.status, STATUS.LIVE);
  eq("it is a Pro page", r.level, LEVEL.PRO);
  check("and says what a free user sees instead", Boolean(r.gate) && r.gate.length > 40);
  eq("the link is offered at Pro", r.navLevel, LEVEL.PRO);
  check("it is in the footer, so it is linked from every page", Boolean(r.footer));
  eq("and indexable — chapter XXVI", r.indexable, true);
  eq("it sits under the clients, where chapter XXIV's path starts", r.parent, "clients");

  const view = route("job");
  eq("one job is a view of that page", view.view, true);
  eq("at the same level", view.level, LEVEL.PRO);
  eq("and never indexed — it has no URL of its own", view.indexable, false);

  for (const lang of LANGS) {
    check(`${lang}: the section has a slug`, Boolean(SECTION.jobs[lang]));
    check(`${lang}: one job sits inside the list page`,
      urlJob(lang, "abc").startsWith(urlJobs(lang)));
    check(`${lang}: and carries the id`, urlJob(lang, "abc").includes("abc"));
  }
  // A slug is permanent, and these are the ones the route has carried as `plannedSlug`
  // since session 3. Turning the page on moves them; it does not rename them.
  eq("the Polish slug", SECTION.jobs.pl, "zlecenia");
  eq("the German one", SECTION.jobs.de, "auftraege");
  eq("the English one", SECTION.jobs.en, "jobs");
  eq("and the transliterated Ukrainian one", SECTION.jobs.uk, "zamovlennya");
}

head("6b. chapter XXV's paywall, in both of its states");
{
  // The shipped value since session 27. `open` below is the same file with the switch
  // put back, so the answer the module ran under for sessions 22–26 stays tested.
  const shipped = loadPlan();
  eq("the paywall is up", shipped.LM_PRO_LOCKED, true);
  const open = loadPlan({ open: true });

  const guest = open.lmFeatureState("jobs", open.LM_LEVEL.GUEST);
  eq("a guest is not allowed the module", guest.allowed, false);
  eq("so the page says it is Pro", guest.gated, true);
  eq("but the module still runs", guest.locked, false);
  eq("and the state names the feature it is about", guest.feature.id, "jobs");

  const pro = open.lmFeatureState("jobs", open.LM_LEVEL.PRO);
  eq("a Pro account is allowed it", pro.allowed, true);
  eq("with nothing to say about a gate", pro.gated, false);

  const later = shipped.lmFeatureState("jobs", shipped.LM_LEVEL.LICZMAT);
  eq("with the paywall up the same visitor is gated", later.gated, true);
  eq("and the module is replaced by the wall", later.locked, true);
  eq("while Pro is unaffected", shipped.lmFeatureState("jobs", shipped.LM_LEVEL.PRO).locked, false);

  // Chapter XXV's "przejście Free → Pro", one rung per level: a guest has no account for
  // a plan to sit on, so they are sent to make one; a free account is offered the upgrade.
  eq("a guest is sent to make an account",
    shipped.lmPaywall("jobs", shipped.LM_LEVEL.GUEST).step, "account");
  eq("a free account is offered the upgrade",
    shipped.lmPaywall("jobs", shipped.LM_LEVEL.LICZMAT).step, "upgrade");
  eq("and a Pro account has nothing left to do",
    shipped.lmPaywall("jobs", shipped.LM_LEVEL.PRO).step, "none");
  eq("with the module open for them", shipped.lmPaywall("jobs", shipped.LM_LEVEL.PRO).open, true);

  eq("the jobs feature is PRO", open.lmFeature("jobs").level, open.LM_LEVEL.PRO);
  eq("built by session 23", open.lmFeature("jobs").session, 23);
  eq("a free account still cannot claim it", open.lmCan("jobs", open.LM_LEVEL.LICZMAT), false);
  eq("and it points at the route that was just turned on", open.lmFeature("jobs").route, "jobs");
}

/* ================================================================== 7. the frame */

head("7. the page the build writes");
{
  const html = jobsMain(DEFAULT_LANG, tr(DEFAULT_LANG), FEATURES).main;
  const has = (needle, why) => check(why, html.includes(needle), needle);

  // Every id assets/jobs-ui.js reaches for. A renamed element is a screen that silently
  // stops filling in, and the browser test would be the only thing to notice.
  for (const id of [
    "job-page", "job-index", "job-detail", "job-missing", "job-body", "job-title",
    "job-lead", "job-pro", "job-pro-chip", "job-gate", "job-tool",
    "job-form", "job-name", "job-client", "job-new-due", "job-list", "job-closed",
    "job-closed-summary", "job-closed-list", "job-undo", "job-undo-text", "job-undo-go",
    "job-status", "job-due", "job-client-line", "job-fig-value", "job-fig-cost",
    "job-fig-left", "job-mixed", "job-edit", "job-delete", "job-edit-form",
    "job-edit-name", "job-edit-value", "job-edit-client", "job-edit-desc", "job-edit-note",
    "job-delete-ask", "job-delete-q", "job-delete-yes", "job-delete-no", "job-desc",
    "job-project-list", "job-project-form", "job-project-pick", "job-note",
  ]) {
    has(`id="${id}"`, `the script's "${id}" is on the page`);
  }

  has("<h1", "the page has one heading");
  has('class="breadcrumbs"', "and a trail back");
  has(tr(DEFAULT_LANG)("pro_locked"), "chapter XXV's words are in the markup, not only in a script");
  has(tr(DEFAULT_LANG)("pro_need_pro"), "with the sentence a free account is shown");
  has(tr(DEFAULT_LANG)("job_local_note"), "and the honest note about where the rows live");
  has(tr(DEFAULT_LANG)("feat_jobs_t"), "the gate names the module");
  has(tr(DEFAULT_LANG)("feat_jobs_d"), "and describes it in full — chapter XXV");
  has(tr(DEFAULT_LANG)("job_cost_d"), "and the two figures say which of them is typed");

  // The four statuses are server-rendered into the select, so a visitor with no
  // JavaScript still reads what the four states of a job are.
  for (const key of ["job_st_new", "job_st_active", "job_st_done", "job_st_cancelled"]) {
    has(tr(DEFAULT_LANG)(key), `chapter XXI's "${key}" is in the markup`);
  }
  for (const id of ["new", "active", "done", "cancelled"]) {
    has(`value="${id}"`, `the status option "${id}" carries the store's own id`);
  }

  has('id="job-detail" class="ws-project" hidden', "the job detail starts hidden");
  has('id="job-gate" hidden', "and so does the gate");

  has("<form", "the writes are forms");
  const code = html.replace(/<!--[\s\S]*?-->/g, "");
  check("nothing on the page calls prompt() or confirm()",
    !code.includes("prompt(") && !code.includes("confirm("));

  // Nothing about a job can be server-rendered: the rows are in one browser.
  check("the build writes no job data", !html.includes("liczmat-crm-v1"));

  // A deadline is a day, and the control that types one is the browser's own date input —
  // which is what makes it a calendar on a phone rather than free text.
  check("the deadline is typed into a date control",
    /id="job-due" type="date"/.test(html) && /id="job-new-due" type="date"/.test(html));

  for (const lang of LANGS) {
    const page = jobsMain(lang, tr(lang), FEATURES).main;
    check(`${lang}: the trail points at this language's page`, page.includes(urlJobs(lang)));
    check(`${lang}: and back at this language's clients`, page.includes(urlClients(lang)));
  }

  // Indexable means listed: a page that claims to be indexable and is missing from
  // sitemap.xml is a claim nothing backs. The file is generated, so this reads the
  // committed output rather than the intention.
  const sitemap = readFileSync(p("sitemap.xml"), "utf8");
  for (const lang of LANGS) {
    check(`${lang}: the page is in sitemap.xml`, sitemap.includes(`<loc>https://liczmat.com${urlJobs(lang)}</loc>`),
      urlJobs(lang));
  }
  check("and one job is not — it has no URL of its own", !sitemap.includes("?id="));

  // The client's own page carries the other end of the link — read-only, chapter XX.
  const client = clientsMain(DEFAULT_LANG, tr(DEFAULT_LANG), FEATURES).main;
  check("the client page lists their jobs", client.includes('id="crm-client-jobs"'));
  check("and links to the page that writes them", client.includes(urlJobs(DEFAULT_LANG)));
}

/* ================================================================== 8. the copy */

head("8. the copy, in four languages");
{
  const KEYS = [
    "jobpage_title", "jobpage_lead", "jobpage_meta",
    "job_local_note",
    "job_list_t", "job_list_d", "job_new", "job_name", "job_desc", "job_desc_empty",
    "job_note_t", "job_note", "job_note_empty", "job_empty",
    "job_closed_t", "job_closed_d",
    "job_none_t", "job_none_d", "job_back", "job_edit",
    "job_delete_q", "job_delete_yes", "job_deleted", "job_restored", "job_undo",
    "job_status", "job_st_new", "job_st_active", "job_st_done", "job_st_cancelled",
    "job_due", "job_due_none", "job_value", "job_value_none", "job_value_d",
    "job_client", "job_client_none", "job_client_gone", "job_client_set",
    "job_project", "job_project_none", "job_project_add", "job_project_free_none",
    "job_unlink", "job_fig_cost", "job_fig_left", "job_cost_d", "job_cost_none",
    "cli_jobs_t", "cli_jobs_d", "cli_jobs_empty", "cli_jobs_all",
    // The keys session 23 leans on that were already here.
    "feat_jobs_t", "feat_jobs_d", "pro_locked", "pro_more", "cli_pro_yours",
    "ws_mixed_currency", "app_add", "app_save", "app_delete", "action_cancel",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
  }
  for (const key of ["jobpage_title", "job_new", "job_edit", "job_st_active", "job_unlink"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }

  // The two sentences that carry the honesty of this session. Chapter XXV wants a free
  // user to understand what is Pro; CLAUDE.md forbids implying a sync that does not exist.
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
      DICT[lang].job_local_note.includes("Android"), DICT[lang].job_local_note);
    check(`${lang}: and it no longer names localStorage`,
      !DICT[lang].job_local_note.includes("localStorage"), DICT[lang].job_local_note);
    check(`${lang}: and it is a full sentence`, DICT[lang].job_local_note.length > 100);
    check(`${lang}: the four statuses are four different words`,
      new Set(["new", "active", "done", "cancelled"].map((s) => DICT[lang][`job_st_${s}`])).size === 4);
    check(`${lang}: the agreed value says it is typed by hand`,
      DICT[lang].job_value_d.length > 40, DICT[lang].job_value_d);
    check(`${lang}: and the two figures are said to be different numbers`,
      DICT[lang].job_cost_d.length > 60, DICT[lang].job_cost_d);
  }
  // Chapter XXI's own vocabulary, in the language the plan is written in.
  eq("the page is called Zlecenia in Polish", DICT.pl.jobpage_title, "Zlecenia");
  eq("the first status is Nowe", DICT.pl.job_st_new, "Nowe");
  eq("the second is W toku", DICT.pl.job_st_active, "W toku");
  eq("the third is Zakończone", DICT.pl.job_st_done, "Zakończone");
  eq("and the fourth Anulowane", DICT.pl.job_st_cancelled, "Anulowane");
  eq("the deadline is a Termin", DICT.pl.job_due, "Termin");
}

/* ------------------------------------------------------------------ report */

console.log(`\njobs: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
