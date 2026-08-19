#!/usr/bin/env node
/**
 * LiczMat — the CRM chain, tested.
 *
 *     node scripts/test-crm.mjs
 *
 * Master plan, session 26: "CRM — Połączenie: klient → zlecenie → projekt → wycena →
 * historia", and chapter XXIV under it:
 *
 *     CRM LiczMat Pro ma być lekki. Główna relacja:
 *     KLIENT → ZLECENIE → PROJEKT → WYCENA → HISTORIA
 *     Celem jest szybkie zarządzanie pracą fachowca. Nie tworzymy ogromnego systemu ERP.
 *
 * Sessions 22–25 built the four modules and each of the links between them. Session 26
 * builds none of that again: it walks the links that are already stored, from any end, and
 * derives the history the chapter ends on. So what this file checks is mostly what the
 * session did **not** do —
 *
 *   1. it stores nothing: the Pro store still holds exactly three collections, the
 *      workspace is byte-for-byte what it was, and reading a chain writes no key;
 *   2. the walk, from all four ends, and the same answer from each of them;
 *   3. the two lists that were missing — a client's quotes and a job's quotes — and the
 *      one project that must not appear in either;
 *   4. the history: which documents make a row, the order, the scope, and the change that
 *      deliberately leaves no trace because nothing dates it;
 *   5. the feature: `crm` is PRO and has no route, and chapter XXV's gate in both states;
 *   6. the frame the build writes for all three screens, the one link map that replaced
 *      four, and the copy in four languages.
 *
 * The other half — clicking the path through in Chromium — is scripts/test-crm-page.mjs.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { clientsMain, jobsMain, quotesMain } from "../src/pages.mjs";
import {
  LANGS, DEFAULT_LANG, urlClients, urlJobs, urlQuotes, urlProjects, urlCalendar,
} from "../src/site.mjs";
import { LEVEL, route } from "../src/ia.mjs";

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

/** assets/workspace.js and assets/crm.js in one scope, which is how the browser has them. */
function loadCrm() {
  const backing = new Map();
  const clock = { now: 1_760_000_000_000, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const api = evalScript(["assets/workspace.js", "assets/crm.js"], [
    "wsAddProject", "wsProject", "wsProjects", "wsDeleteProject", "wsRestoreProject",
    "wsAddEstimation", "wsAddManualEstimation", "wsEstimations", "wsProjectCosts", "wsExport",
    "crmAddClient", "crmClient", "crmDeleteClient", "crmRestoreClient", "crmLinkProject",
    "crmClientProjects", "crmClientJobs", "crmClientQuotes", "crmClientCosts",
    "crmAddJob", "crmJob", "crmUpdateJob", "crmSetJobStatus", "crmDeleteJob", "crmRestoreJob",
    "crmJobOfProject", "crmJobQuotes",
    "crmAddQuote", "crmQuote", "crmQuotes", "crmDeleteQuote", "crmProjectQuotes",
    "crmQuoteTotals", "crmQuoteChain", "crmAddLabour",
    "crmChain", "crmHistory", "CRM_CHAIN", "CRM_HISTORY_KINDS", "CRM_KEY",
  ], {
    localStorage,
    document: { dispatchEvent: () => {} },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    // A real Date with a fixed "now": crmDay() parses a deadline, and a Date that is
    // only { now } cannot be constructed.
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
    tick: (ms) => { clock.now += ms || 1000; },
    currency: (code) => { clock.currency = code; },
  };
}

/** assets/crm-chain.js on its own: the maps it declares, with no page under it. */
function loadChain() {
  return evalScript("assets/crm-chain.js", ["CHN_SECTION", "CHN_HISTORY_SECTION", "CHN_FALLBACK"], {
    window: undefined, document: undefined, t: undefined,
  });
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

/**
 * Chapter XXIV's whole path, built the way a tradesman builds it: the client first, then
 * the job, then the project the job is done in, then the price.
 */
function buildChain(crm) {
  const client = crm.crmAddClient({ name: "Jan Kowalski", phone: "600 100 200" });
  crm.tick(60_000);
  const project = crm.wsAddProject("Łazienka");
  const job = crm.crmAddJob({
    name: "Remont łazienki", clientId: client.id, projectId: project.id,
    dueDate: "2026-09-01", valueMajor: 12_000,
  });
  crm.tick(60_000);
  const quote = crm.crmAddQuote({ name: "Wariant A", projectId: project.id });
  return { client, project, job, quote };
}

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

head("1. the chain is walked, never stored");
{
  const crm = loadCrm();
  const { client, job, project, quote } = buildChain(crm);
  const before = JSON.stringify(crm.raw());
  const wsBefore = JSON.stringify(crm.workspaceRaw());

  crm.crmChain("client", client.id);
  crm.crmChain("job", job.id);
  crm.crmChain("project", project.id);
  crm.crmChain("quote", quote.id);
  crm.crmHistory({ clientId: client.id });
  crm.crmClientQuotes(client.id);
  crm.crmJobQuotes(job.id);

  eq("walking the whole chain writes nothing to the Pro store", JSON.stringify(crm.raw()), before);
  eq("and nothing to the workspace", JSON.stringify(crm.workspaceRaw()), wsBefore);
  eq("the Pro store still holds exactly its three collections",
    Object.keys(crm.raw()).sort().join(), "clients,jobs,quotes");
  check("no chain, link, graph or history collection has appeared",
    !Object.keys(crm.raw()).some((k) => /chain|link|graph|history|event|log/i.test(k)),
    Object.keys(crm.raw()).join());
  eq("and no key of its own is written", crm.keys().sort().join(),
    // The third is the workspace's own "which project is active", written by wsAddProject().
    "liczmat-crm-v1,materio-active-project,materio-workspace-v1");

  // The links themselves are still the four rows sessions 22–25 wrote, in their places.
  const stored = crm.raw();
  eq("the client keeps the project", stored.clients[0].projectIds.join(), project.id);
  eq("the job keeps the client", stored.jobs[0].clientId, client.id);
  eq("and the project", stored.jobs[0].projectId, project.id);
  eq("the quote keeps the project and nothing else", stored.quotes[0].projectId, project.id);
  check("the quote carries no client or job of its own",
    stored.quotes[0].clientId === undefined && stored.quotes[0].jobId === undefined,
    Object.keys(stored.quotes[0]).join());

  // wsExport() is what /app/ uploads. Nothing about the chain may reach it.
  const exported = crm.wsExport();
  check("wsExport() carries nothing of the CRM",
    exported.clients === undefined && exported.jobs === undefined
    && exported.quotes === undefined && exported.chain === undefined,
    Object.keys(exported).join());
}

/* ================================================================== 2. the walk */

head("2. the same path, whichever end it is walked from");
{
  const crm = loadCrm();
  const { client, project, job, quote } = buildChain(crm);

  for (const [kind, id] of [["job", job.id], ["project", project.id], ["quote", quote.id]]) {
    const chain = crm.crmChain(kind, id);
    eq(`from a ${kind}: the client`, chain.client && chain.client.id, client.id);
    eq(`from a ${kind}: the job`, chain.job && chain.job.id, job.id);
    eq(`from a ${kind}: the project`, chain.project && chain.project.id, project.id);
    eq(`from a ${kind}: the quotes of that project`,
      chain.quotes.map((q) => q.id).join(), quote.id);
    eq(`from a ${kind}: `.concat("`from` says where it started"), chain.from, kind);
  }
  eq("only a walk that started at a quote resolves one",
    crm.crmChain("quote", quote.id).quote.id, quote.id);
  eq("a walk from a job resolves none", crm.crmChain("job", job.id).quote, null);

  // Downwards the chain is not a single path, and the walker refuses to guess: one client
  // has many jobs, so the client's own walk stops at them and the page lists them instead.
  const second = crm.crmAddJob({ name: "Kuchnia", clientId: client.id });
  const fromClient = crm.crmChain("client", client.id);
  eq("from a client: the client", fromClient.client.id, client.id);
  eq("from a client: no job is guessed at", fromClient.job, null);
  eq("nor a project", fromClient.project, null);
  eq("but their quotes are all there", fromClient.quotes.map((q) => q.id).join(), quote.id);
  eq("and the second job did not change that", crm.crmClientJobs(client.id).length, 2);
  eq("the second job has no project, so its chain stops there",
    crm.crmChain("job", second.id).project, null);
  eq("and it still knows its client", crm.crmChain("job", second.id).client.id, client.id);

  // The order of the nodes is the chapter's own, and the walker knows exactly four.
  eq("the chain has chapter XXIV's four nodes in its order",
    crm.CRM_CHAIN.join(), "client,job,project,quote");
}

head("2b. a walk that cannot start answers empty rather than guessing");
{
  const crm = loadCrm();
  const { job } = buildChain(crm);
  for (const [kind, id, why] of [
    ["job", "nope", "an id nobody has"],
    ["quote", "", "no id at all"],
    ["client", "nope", "a client who never existed"],
    ["room", job.id, "a kind that is not on the path"],
  ]) {
    const chain = crm.crmChain(kind, id);
    check(`${why}: every node is null`,
      !chain.client && !chain.job && !chain.project && !chain.quote && chain.quotes.length === 0,
      JSON.stringify(chain));
  }

  // A deleted node is gone from the walk on the next read — nothing cached it.
  const crm2 = loadCrm();
  const { client, quote } = buildChain(crm2);
  const token = crm2.crmDeleteClient(client.id);
  eq("a deleted client drops out of the chain", crm2.crmChain("quote", quote.id).client, null);
  crm2.crmRestoreClient(token);
  eq("and the undo puts them back", crm2.crmChain("quote", quote.id).client.id, client.id);
}

head("2c. crmQuoteChain() is the same walker, so /wyceny/ cannot disagree with /zlecenia/");
{
  const crm = loadCrm();
  const { client, project, job, quote } = buildChain(crm);
  const back = crm.crmQuoteChain(quote.id);
  eq("the client is the same row", back.client.id, client.id);
  eq("the job is the same row", back.job.id, job.id);
  eq("the project is the same row", back.project.id, project.id);
  const walked = crm.crmChain("quote", quote.id);
  eq("and it is crmChain() underneath", JSON.stringify(back),
    JSON.stringify({ project: walked.project, job: walked.job, client: walked.client }));

  // A job carries the client it was typed with; the project's own filing is the fallback,
  // and the two agree because crmAddJob() files the project under that client.
  eq("the project is filed under the client the job named",
    crm.crmClientProjects(client.id).map((x) => x.id).join(), project.id);
}

/* ================================================================== 3. the two lists */

head("3. a client's quotes and a job's quotes, neither of them stored");
{
  const crm = loadCrm();
  const { client, project, job, quote } = buildChain(crm);
  crm.tick(60_000);
  const second = crm.crmAddQuote({ name: "Wariant B", projectId: project.id });

  eq("both quotes of the project are the client's",
    crm.crmClientQuotes(client.id).map((q) => q.name).sort().join(), "Wariant A,Wariant B");
  eq("and the job's", crm.crmJobQuotes(job.id).map((q) => q.name).sort().join(),
    "Wariant A,Wariant B");
  eq("newest change first", crm.crmClientQuotes(client.id)[0].id, second.id);

  // Somebody else's project is nobody else's quote.
  const other = crm.wsAddProject("Cudzy projekt");
  crm.crmAddQuote({ name: "Nie moja", projectId: other.id });
  eq("a quote on a project this client does not own is not theirs",
    crm.crmClientQuotes(client.id).length, 2);
  eq("nor the job's", crm.crmJobQuotes(job.id).length, 2);

  // A quote with no project belongs to nobody's list — it is a price for work with no
  // material behind it, which session 24 allows on purpose.
  crm.crmAddQuote({ name: "Sama robocizna" });
  eq("a quote with no project is in no client's list", crm.crmClientQuotes(client.id).length, 2);

  const bare = crm.crmAddJob({ name: "Bez projektu", clientId: client.id });
  eq("a job with no project has no quotes", crm.crmJobQuotes(bare.id).length, 0);
  eq("and an id nobody has, none either", crm.crmJobQuotes("nope").length, 0);

  eq("nothing about either list is stored on the client",
    Object.keys(crm.raw().clients[0]).filter((k) => /quote/i.test(k)).join(), "");
  eq("nor on the job", Object.keys(crm.raw().jobs[0]).filter((k) => /quote/i.test(k)).join(), "");
  eq("the quote is still the only end of the link", crm.raw().quotes[0].projectId, project.id);
}

/* ================================================================== 4. the history */

head("4. the history is derived from the documents and their dates");
{
  const crm = loadCrm();
  const { client, project, job, quote } = buildChain(crm);
  crm.tick(60_000);
  const line = save(crm, { projectId: project.id, name: "Gres" });
  crm.tick(60_000);
  const cost = crm.wsAddManualEstimation({
    name: "Robocizna", requiredUnits: 1, unitLabel: "usł.", costMajor: 2000,
    projectId: project.id,
  });

  const rows = crm.crmHistory({ clientId: client.id });
  eq("every document is one row", rows.length, 5);
  eq("newest first", rows.map((r) => r.kind).join(), "cost,calc,quote,job,client");
  eq("the client's own row is the oldest", rows[4].id, client.id);
  eq("a saved calculation names the project it happened in", rows[1].project.id, project.id);
  eq("a cost is told apart from a calculation", rows[0].kind, "cost");
  eq("and both carry the line itself", rows[0].line.id, cost.id);
  eq("the job row carries the job", rows[3].job.id, job.id);
  eq("the quote row carries the quote", rows[2].quote.id, quote.id);
  eq("every kind the history can carry is declared",
    crm.CRM_HISTORY_KINDS.join(), "client,job,quote,calc,cost");
  check("every row has a date", rows.every((r) => r.at > 0), JSON.stringify(rows.map((r) => r.at)));
  eq("the limit is honoured", crm.crmHistory({ clientId: client.id }, 2).length, 2);
  eq("and it takes the newest", crm.crmHistory({ clientId: client.id }, 1)[0].id, cost.id);

  // The scopes: one job, and one project.
  const jobRows = crm.crmHistory({ jobId: job.id });
  eq("a job's history is the job and what its project holds",
    jobRows.map((r) => r.kind).join(), "cost,calc,quote,job");
  check("and never the client's own row", !jobRows.some((r) => r.kind === "client"));
  const projectRows = crm.crmHistory({ projectId: project.id });
  eq("a project's history is what was saved into it, plus the job it is done under",
    projectRows.map((r) => r.kind).join(), "cost,calc,quote,job");

  eq("an empty scope answers nothing", crm.crmHistory({}).length, 0);
  eq("an unknown client too", crm.crmHistory({ clientId: "nope" }).length, 0);
  eq("an unknown job too", crm.crmHistory({ jobId: "nope" }).length, 0);
  eq("reading it wrote nothing", crm.raw().jobs.length, 1);

  // Somebody else's project is not this client's history, exactly as it is not their cost.
  const other = crm.wsAddProject("Cudzy projekt");
  save(crm, { projectId: other.id, name: "Nie moje" });
  eq("a line in a project this client does not own is not their history",
    crm.crmHistory({ clientId: client.id }).length, 5);
  check("the line itself is still there to be read", crm.wsEstimations(other.id).length === 1);
  eq("and the one that is theirs is the one they saved",
    crm.crmHistory({ clientId: client.id })[1].id, line.id);
}

head("4b. what the history deliberately does not claim");
{
  const crm = loadCrm();
  const { client, job } = buildChain(crm);
  const before = crm.crmHistory({ clientId: client.id }).length;

  // A status moved and a deadline pushed are the two changes a tradesman makes most often,
  // and neither leaves a dated trace anywhere in the store: a row carries one `updatedAt`,
  // which says when it last changed and never what changed. Claiming them would need an
  // event log, which is the ERP chapter XXIV forbids in its last line.
  crm.tick(60_000);
  crm.crmSetJobStatus(job.id, "active");
  crm.crmUpdateJob(job.id, { dueDate: "2026-10-01" });
  const after = crm.crmHistory({ clientId: client.id });
  eq("a status change adds no row", after.length, before);
  eq("nor does a deadline moved", after.filter((r) => r.kind === "job").length, 1);
  eq("the job's row still reads from the job", after.find((r) => r.kind === "job").job.status,
    "active");
  eq("and it is dated when the job was created, not when it changed",
    after.find((r) => r.kind === "job").at, crm.crmJob(job.id).createdAt);
  check("which is earlier than its last change",
    crm.crmJob(job.id).createdAt < crm.crmJob(job.id).updatedAt);

  // Deleting a row removes its history, because the history *is* the rows. A log would
  // have kept an entry for something nobody can open any more.
  const token = crm.crmDeleteJob(job.id);
  eq("a deleted job leaves no row behind",
    crm.crmHistory({ clientId: client.id }).filter((r) => r.kind === "job").length, 0);
  crm.crmRestoreJob(token);
  eq("and the undo brings its row back",
    crm.crmHistory({ clientId: client.id }).filter((r) => r.kind === "job").length, 1);
}

/* ================================================================== 5. the feature */

head("5. `crm` is a Pro feature with no page of its own");
{
  const plan = loadPlan();
  const feature = plan.lmFeature("crm");
  check("the feature exists", Boolean(feature));
  eq("it is PRO", feature.level, LEVEL.PRO);
  eq("and it has no route, because chapter XXIV is a path and not a page", feature.route, null);
  eq("it is session 26", feature.session, 26);
  eq("a guest cannot use it", plan.lmCan("crm", "guest"), false);
  eq("nor a free account", plan.lmCan("crm", "liczmat"), false);
  eq("a Pro account can", plan.lmCan("crm", "pro"), true);

  // The path runs through the four modules, and every one of them is a Pro feature too —
  // otherwise a chain link would open a page a free account is not offered.
  for (const id of ["clients", "jobs", "quotes", "calendar"]) {
    eq(`${id} is PRO as well`, plan.lmFeature(id).level, LEVEL.PRO);
  }

  // Chapter XXV's wall, in both of its states. Session 27 threw the switch; `open` is
  // the same file with it put back, so the answer sessions 22–26 ran under stays tested.
  eq("the paywall is up", plan.LM_PRO_LOCKED, true);
  eq("a free account is shut out", plan.lmFeatureState("crm", "liczmat").locked, true);
  check("and is told what it is", plan.lmFeatureState("crm", "liczmat").gated);
  eq("and a Pro account is not", plan.lmFeatureState("crm", "pro").locked, false);
  const open = loadPlan({ open: true });
  eq("before session 27 the same account saw the module",
    open.lmFeatureState("crm", "liczmat").locked, false);
}

/* ================================================================== 6. the frame */

head("6. the frame the build writes, and the one link map behind it");
{
  const t = tr(DEFAULT_LANG);
  const client = clientsMain(DEFAULT_LANG, t, FEATURES).main;
  const job = jobsMain(DEFAULT_LANG, t, FEATURES).main;
  const quote = quotesMain(DEFAULT_LANG, t, FEATURES).main;

  for (const [where, html, ids] of [
    ["/klienci/", client, ["crm-client-quotes", "crm-history"]],
    ["/zlecenia/", job, ["job-chain", "job-quotes", "job-history"]],
    ["/wyceny/", quote, ["quo-chain-line"]],
  ]) {
    for (const id of ids) {
      check(`${where} carries #${id} for the script to fill`, html.includes(`id="${id}"`), id);
    }
  }
  check("the strip is a <nav> on /zlecenia/", /<nav class="crm-chain" id="job-chain"/.test(job));
  check("and on /wyceny/", /<nav class="crm-chain" id="quo-chain-line"/.test(quote));
  check("both label it for a screen reader",
    job.includes(`aria-label="${t("crm_chain_t")}"`)
    && quote.includes(`aria-label="${t("crm_chain_t")}"`));
  check("the history says out loud what it leaves out",
    client.includes(t("crm_hist_note")) && job.includes(t("crm_hist_note")));
  check("the quotes block links to the whole list", client.includes(urlQuotes(DEFAULT_LANG)));

  // The four Pro pages share one link map — four maps each holding half the site map is
  // one moved slug away from disagreeing.
  const build = read("scripts/build.mjs");
  eq("no page writes a map of its own any more",
    /LM_CRM|LM_JOBS|LM_QUOTES|LM_CAL\b/.test(build), false);
  eq("the build writes window.LM_LINKS four times",
    (build.match(/window\.LM_LINKS/g) || []).length, 4);
  for (const file of ["assets/crm-ui.js", "assets/jobs-ui.js", "assets/quotes-ui.js",
    "assets/schedule-ui.js", "assets/crm-chain.js"]) {
    check(`${file} reads that one map`, read(file).includes("LM_LINKS"), file);
  }

  // The three screens that draw the chain load the file that draws it; the terminarz draws
  // none, so it does not download it.
  for (const [page, wants] of [["buildClientsPages", true], ["buildJobsPages", true],
    ["buildQuotesPages", true], ["buildCalendarPages", false]]) {
    const list = { buildClientsPages: "CRM_SCRIPTS", buildJobsPages: "JOBS_SCRIPTS",
      buildQuotesPages: "QUOTES_SCRIPTS", buildCalendarPages: "CALENDAR_SCRIPTS" }[page];
    const decl = build.slice(build.indexOf(`const ${list} = [`));
    const has = decl.slice(0, decl.indexOf("];")).includes("crm-chain.js");
    eq(`${list} ${wants ? "loads" : "does not load"} assets/crm-chain.js`, has, wants);
  }

  // Every page the map names is a page this site really has, in every language.
  const chain = loadChain();
  eq("the strip knows which section owns each node",
    Object.keys(chain.CHN_SECTION).join(), "client,job,project,quote");
  eq("and the history knows it for every kind it can draw",
    Object.keys(chain.CHN_HISTORY_SECTION).sort().join(), "calc,client,cost,job,quote");
  const fallback = {
    clients: urlClients(DEFAULT_LANG), jobs: urlJobs(DEFAULT_LANG),
    projects: urlProjects(DEFAULT_LANG), quotes: urlQuotes(DEFAULT_LANG),
    calendar: urlCalendar(DEFAULT_LANG),
  };
  for (const key of Object.keys(fallback)) {
    eq(`the fallback address for ${key} is ${DEFAULT_LANG}'s own`,
      chain.CHN_FALLBACK[key], fallback[key]);
  }

  // The built pages carry the map in their own language, so a German visitor's chain
  // links to /de/… and never back to the Polish slug.
  for (const lang of LANGS) {
    const html = read(join(urlJobs(lang).replace(/^\//, ""), "index.html"));
    check(`${lang}: /zlecenia/ carries the map`, html.includes("window.LM_LINKS"));
    check(`${lang}: and it names this language's clients page`,
      html.includes(`"clients":"${urlClients(lang)}"`), urlClients(lang));
    check(`${lang}: and this language's quotes page`,
      html.includes(`"quotes":"${urlQuotes(lang)}"`), urlQuotes(lang));
    check(`${lang}: the page loads assets/crm-chain.js`, html.includes("/assets/crm-chain.js"));
  }
  check("the route the chapter has no page for still has no page", route("crm") === null
    || route("crm") === undefined, "there must be no `crm` route in src/ia.mjs");
}

/* ================================================================== 7. the copy */

head("7. the words, in four languages");
{
  const KEYS = [
    "crm_chain_t", "crm_chain_d",
    "crm_node_client", "crm_node_job", "crm_node_project", "crm_node_quote", "crm_node_none",
    "crm_quotes_t", "crm_quotes_d", "crm_quotes_empty", "crm_quotes_all",
    "crm_hist_t", "crm_hist_d", "crm_hist_empty", "crm_hist_note",
    "crm_ev_client", "crm_ev_job", "crm_ev_quote", "crm_ev_calc", "crm_ev_cost",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
    // The four node labels are the four modules, and each one has to be its own word:
    // a strip that said "Projekt → Projekt" would be unreadable.
    const nodes = ["client", "job", "project", "quote"].map((n) => DICT[lang][`crm_node_${n}`]);
    eq(`${lang}: the four nodes have four different words`, new Set(nodes).size, 4);
    // And each is the word that page already uses for itself.
    eq(`${lang}: the client node is the clients page's own word`,
      DICT[lang].crm_node_client, DICT[lang].job_client);
    check(`${lang}: the history note explains what is missing`,
      DICT[lang].crm_hist_note.length > 80, DICT[lang].crm_hist_note);
    check(`${lang}: the five events are five different sentences`,
      new Set(["client", "job", "quote", "calc", "cost"]
        .map((k) => DICT[lang][`crm_ev_${k}`])).size === 5);
  }
  for (const key of ["crm_chain_t", "crm_node_job", "crm_hist_t", "crm_quotes_t"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }
  // Chapter XXIV's own vocabulary, in the language the plan is written in.
  eq("the path is klient → zlecenie → projekt → wycena",
    ["client", "job", "project", "quote"].map((n) => DICT.pl[`crm_node_${n}`]).join(" → "),
    "Klient → Zlecenie → Projekt → Wycena");
  eq("and it ends in Historia", DICT.pl.crm_hist_t, "Historia");
}

/* ------------------------------------------------------------------ report */

console.log(`\ncrm: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
