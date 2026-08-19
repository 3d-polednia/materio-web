#!/usr/bin/env node
/**
 * LiczMat — jobs, in a real browser.
 *
 *     node scripts/test-jobs-page.mjs
 *
 * Master plan, session 23, in the half that needs a browser: chapter XXI clicked through —
 * a job added, given a client and a project, moved through the four statuses, given a
 * deadline and an agreed value, corrected, deleted and undeleted — plus chapter XXIV's
 * path read from both ends, chapter XXV's notice, the four languages, the currency switch,
 * the widths chapter XXVIII names and the no-script variant. The pure logic half is
 * scripts/test-jobs.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** /zlecenia/ touches no network: the jobs and the clients are
 * localStorage in this browser and the projects are the same local workspace every other
 * page uses. So the test opens the real page, clicks what a visitor clicks, and reads both
 * what was drawn and what went into storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-jobs-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlJobs, urlClients } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ the browser */

let chromium;
try {
  let specifier = "playwright";
  if (process.env.LM_PLAYWRIGHT) {
    const given = process.env.LM_PLAYWRIGHT;
    const entry = existsSync(join(given, "index.mjs")) ? join(given, "index.mjs") : given;
    specifier = pathToFileURL(entry).href;
  }
  const mod = await import(specifier);
  chromium = mod.chromium || (mod.default && mod.default.chromium);
  if (!chromium) throw new Error("no chromium export");
} catch {
  console.log("test-jobs-page: Playwright not installed — skipping the browser tests.");
  console.log("                See the header of this file for the one-line install.");
  process.exit(0);
}

function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const b of builds) {
    const exe = join(base, b, "chrome-linux", "chrome");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

/* ------------------------------------------------------------------ the site */

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain",
};

function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = decodeURIComponent(req.url.split("?")[0]);
      if (path.endsWith("/")) path += "index.html";
      const file = join(ROOT, path);
      if (!file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404, { "content-type": MIME[".html"] });
        res.end(readFileSync(join(ROOT, "404.html")));
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* ------------------------------------------------------------------ the fixture */

const DAY = 86400e3;
const T0 = Date.UTC(2026, 6, 1);
const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });

/** Two projects, the first with a calculation and a hand-typed cost already in it. */
function workspace() {
  const line = (id, projectId, name, units, unit, minor, at, manual = false) => ({
    id, projectId, name, calculationType: "SURFACE_COVERAGE", materialCategory: "TILES",
    requiredUnits: units, unitLabel: unit, totalCostMinor: minor, wastePercentage: 0,
    wasteCostMinor: 0, currencyCode: "PLN",
    inputJson: manual ? JSON.stringify({ manual: true }) : JSON.stringify({ area: "21.6" }),
    ...sync(at),
  });
  return {
    projects: [
      { id: "p1", name: "Remont łazienki", archived: false, ...sync(T0 + 5 * DAY) },
      { id: "p2", name: "Salon", archived: false, ...sync(T0 + 3 * DAY) },
    ],
    rooms: [],
    estimations: [
      line("e1", "p1", "Gres 60×60", 15, "opak.", 74985, T0 + 1 * DAY),
      line("e2", "p1", "Robocizna", 1, "usł.", 120000, T0 + 2 * DAY, true),
    ],
    shoppingItems: [],
  };
}

/** One client and one job: the job carries the client, the project and an agreed value. */
const crm = (over = {}) => ({
  clients: [{
    id: "c1", name: "Jan Kowalski", phone: "600 100 200", email: "jan@example.com",
    address: "ul. Piękna 3", note: "Klucze u sąsiada.", projectIds: ["p1"], archived: false,
    ...sync(T0 + 4 * DAY),
  }],
  jobs: [{
    id: "j1", name: "Łazienka na Pięknej", clientId: "c1", projectId: "p1",
    status: "active", description: "Skucie glazury, gres 60×60.", note: "Klucze u sąsiada.",
    dueDate: "2026-09-30", valueMinor: 1250000, currencyCode: "PLN",
    ...sync(T0 + 4 * DAY), ...over,
  }],
});

/** The same store with no job in it, for the empty state and the add form. */
const crmNoJobs = () => ({ clients: crm().clients, jobs: [] });

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

const exe = findChromium();
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const plant = { "materio-lang": opts.lang === undefined ? "pl" : opts.lang };
  if (opts.workspace) plant["materio-workspace-v1"] = JSON.stringify(opts.workspace);
  if (opts.crm) plant["liczmat-crm-v1"] = JSON.stringify(opts.crm);
  if (opts.currency) plant["liczmat-currency"] = opts.currency;
  if (opts.level) plant["liczmat-signed-in"] = opts.level;

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  if (opts.ready !== false) await page.waitForSelector(opts.ready || "html[data-jobs-ready]");
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-crm-v1") || "{}"));
const liveJobs = async (page) => ((await store(page)).jobs || []).filter((j) => !j.deletedAt);

const JOBS = urlJobs("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the index */

head("1. the job list");
{
  const page = await open(ctx, JOBS, { workspace: workspace(), crm: crm() });
  const list = await rows(page, "#job-list");
  eq("the job is on the page", list.length, 1);
  check("with its name", list[0].includes("Łazienka na Pięknej"), list[0]);
  check("the client it is for — chapter XXIV's first step",
    list[0].includes("Jan Kowalski"), list[0]);
  check("its status in words", list[0].includes("W toku"), list[0]);
  check("its deadline", /wrz|09/.test(list[0]), list[0]);
  check("and what was agreed for it", list[0].includes("12500") || list[0].includes("12 500"), list[0]);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. an empty list says what to do about it");
{
  const page = await open(ctx, JOBS, { workspace: workspace(), crm: crmNoJobs() });
  const list = await rows(page, "#job-list");
  eq("one row, and it is the empty state", list.length, 1);
  check("which asks for the first job", /Dodaj|dodaj/.test(list[0]), list[0]);
  eq("and the closed half is absent while nothing is closed",
    await page.$eval("#job-closed", (n) => n.hidden), true);
  await page.close();
}

head("1c. a job is added from the form, with the client and the date beside the name");
{
  const page = await open(ctx, JOBS, { workspace: workspace(), crm: crmNoJobs() });
  const options = await page.$$eval("#job-client option", (o) => o.map((n) => n.textContent.trim()));
  eq("the client picker offers the one client, plus none", options.length, 2);
  check("and names them", options.join().includes("Jan Kowalski"), options.join());

  await page.fill("#job-name", "Kuchnia u Nowaków");
  await page.selectOption("#job-client", { label: "Jan Kowalski" });
  await page.fill("#job-new-due", "2026-10-15");
  await page.click("#job-form button[type=submit]");
  await page.waitForFunction(() => document.querySelectorAll("#job-list > li").length === 1);

  const stored = await liveJobs(page);
  eq("one job is stored", stored.length, 1);
  eq("with the name typed", stored[0].name, "Kuchnia u Nowaków");
  eq("the client picked", stored[0].clientId, "c1");
  eq("the deadline as a calendar day", stored[0].dueDate, "2026-10-15");
  eq("and chapter XXI's first status", stored[0].status, "new");
  eq("the form is emptied for the next one", await page.inputValue("#job-name"), "");
  await page.close();
}

/* ---------------------------------------------------- 2. one job */

head("2. opening a job is an ordinary navigation");
{
  const page = await open(ctx, JOBS, { workspace: workspace(), crm: crm() });
  await page.click("#job-list a[data-open]");
  await page.waitForSelector("#job-body:not([hidden])");
  check("the address carries the job", page.url().includes("?id=j1"), page.url());
  eq("the heading is the job", (await page.textContent("#job-title")).trim(), "Łazienka na Pięknej");
  eq("the index is out of the way", await page.$eval("#job-index", (n) => n.hidden), true);
  check("the trail gained the job",
    (await page.textContent(".breadcrumbs")).includes("Łazienka na Pięknej"));

  await page.goBack();
  await page.waitForSelector("#job-index:not([hidden])");
  eq("and Back returns to the list", await page.$eval("#job-detail", (n) => n.hidden), true);
  await page.close();
}

head("2b. the job says who it is for and what it is being counted in");
{
  const page = await open(ctx, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
  check("the client is a link to their page",
    (await page.$eval("#job-client-line a", (a) => a.getAttribute("href"))).includes("c1"));
  check("named", (await page.textContent("#job-client-line")).includes("Jan Kowalski"));

  const project = await rows(page, "#job-project-list");
  eq("the project is listed", project.length, 1);
  check("by name", project[0].includes("Remont łazienki"), project[0]);

  // Two figures answering two different questions: 12 500,00 agreed, 1 949,85 spent.
  const value = await page.textContent("#job-fig-value");
  const cost = await page.textContent("#job-fig-cost");
  const left = await page.textContent("#job-fig-left");
  check("the agreed value is what was typed", value.replace(/\D/g, "").includes("1250000"), value);
  check("the cost is what the project has run to", cost.replace(/\D/g, "").includes("194985"), cost);
  check("and the difference is the two subtracted", left.replace(/\D/g, "").includes("1055015"), left);
  eq("with nothing to warn about", await page.$eval("#job-mixed", (n) => n.hidden), true);

  check("the description is on the page", (await page.textContent("#job-desc")).includes("gres"));
  check("and the note", (await page.textContent("#job-note")).includes("sąsiada"));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2c. the record is corrected in a form on the page");
{
  const page = await open(ctx, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
  await page.click("#job-edit");
  await page.waitForSelector("#job-edit-form:not([hidden])");
  eq("the form opens filled with what is stored",
    await page.inputValue("#job-edit-name"), "Łazienka na Pięknej");
  eq("the agreed value in the units it was typed in",
    await page.inputValue("#job-edit-value"), "12500");

  await page.fill("#job-edit-name", "Łazienka i WC");
  await page.fill("#job-edit-value", "13800,50");
  await page.fill("#job-edit-note", "Materiał kupuje klient.");
  await page.click("#job-edit-form button[type=submit]");
  await page.waitForFunction(() =>
    document.getElementById("job-title").textContent.trim() === "Łazienka i WC");

  const stored = (await liveJobs(page))[0];
  eq("the name is corrected", stored.name, "Łazienka i WC");
  eq("the amount is stored in minor units, rounded once", stored.valueMinor, 1380050);
  eq("the currency it was agreed in is kept", stored.currencyCode, "PLN");
  eq("and the note is what was typed", stored.note, "Materiał kupuje klient.");
  eq("the form closes after saving", await page.$eval("#job-edit-form", (n) => n.hidden), true);
  await page.close();
}

/* ---------------------------------------------------- 3. statuses and the date */

head("3. chapter XXI's statuses move in one gesture");
{
  const page = await open(ctx, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
  const options = await page.$$eval("#job-status option", (o) => o.map((n) => n.value));
  eq("all four are offered", options.join(), "new,active,done,cancelled");
  eq("and the job's own is selected", await page.inputValue("#job-status"), "active");

  await page.selectOption("#job-status", "done");
  await page.waitForFunction(() =>
    (JSON.parse(localStorage.getItem("liczmat-crm-v1")).jobs[0] || {}).status === "done");
  eq("the status is stored", (await liveJobs(page))[0].status, "done");

  await page.click("[data-job-back]");
  await page.waitForSelector("#job-index:not([hidden])");
  eq("a finished job leaves the working list",
    await page.$$eval("#job-list > li", (li) => li.length), 1);
  check("which is now the empty state",
    (await rows(page, "#job-list"))[0].includes("Dodaj"), (await rows(page, "#job-list"))[0]);
  eq("and the closed half appears", await page.$eval("#job-closed", (n) => n.hidden), false);
  const closed = await rows(page, "#job-closed-list");
  check("with the job in it", closed[0].includes("Łazienka na Pięknej"), closed[0]);
  check("marked as finished", closed[0].includes("Zakończone"), closed[0]);
  await page.close();
}

head("3b. the deadline is typed into a calendar control and stored as a day");
{
  const page = await open(ctx, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
  eq("the control is a date input", await page.$eval("#job-due", (n) => n.type), "date");
  eq("filled with the stored day", await page.inputValue("#job-due"), "2026-09-30");

  await page.fill("#job-due", "2026-11-02");
  await page.waitForFunction(() =>
    (JSON.parse(localStorage.getItem("liczmat-crm-v1")).jobs[0] || {}).dueDate === "2026-11-02");
  eq("the day is stored as it was typed", (await liveJobs(page))[0].dueDate, "2026-11-02");
  await page.close();
}

head("3c. a deadline that has passed is marked, and only while the job is open work");
{
  const past = crm({ dueDate: "2020-01-01" });
  const page = await open(ctx, JOBS, { workspace: workspace(), crm: past });
  eq("an overdue open job is marked",
    await page.$$eval("#job-list .job-due-late", (n) => n.length), 1);
  await page.close();

  const done = crm({ dueDate: "2020-01-01", status: "done" });
  const closed = await open(ctx, JOBS, { workspace: workspace(), crm: done });
  eq("a finished one is not — the date is history, not a warning",
    await closed.$$eval("#job-closed-list .job-due-late", (n) => n.length), 0);
  await closed.close();
}

/* ---------------------------------------------------- 4. the project link */

head("4. chapter XXIV: ZLECENIE → PROJEKT, attached and detached");
{
  const page = await open(ctx, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
  // p1 is the job's own project, so the picker offers p2 and nothing else.
  const options = await page.$$eval("#job-project-pick option", (o) => o.map((n) => n.textContent));
  eq("the picker offers the project no job has taken", options.join(), "Salon");

  await page.click("#job-project-list [data-unlink]");
  await page.waitForFunction(() =>
    !(JSON.parse(localStorage.getItem("liczmat-crm-v1")).jobs[0] || {}).projectId);
  eq("detaching leaves the job with none", (await liveJobs(page))[0].projectId, "");
  eq("and the project itself is untouched", await page.evaluate(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).projects.length), 2);
  check("the cost figure says there is nothing to count yet",
    (await page.textContent("#job-fig-cost")).length > 0);

  await page.selectOption("#job-project-pick", { label: "Salon" });
  await page.click("#job-project-form button[type=submit]");
  await page.waitForFunction(() =>
    (JSON.parse(localStorage.getItem("liczmat-crm-v1")).jobs[0] || {}).projectId === "p2");
  eq("attaching another files it under the job", (await liveJobs(page))[0].projectId, "p2");
  // Chapter XXIV's chain in one write: the project follows the job to the job's client.
  const client = (await store(page)).clients.find((c) => c.id === "c1");
  check("and under the job's client too", client.projectIds.includes("p2"), client.projectIds.join());
  await page.close();
}

head("4b. the client's own page shows their jobs, read-only");
{
  const page = await open(ctx, `${urlClients("pl")}?id=c1`,
    { workspace: workspace(), crm: crm(), ready: "html[data-crm-ready]" });
  const list = await rows(page, "#crm-client-jobs");
  eq("the job is on the client's page", list.length, 1);
  check("by name", list[0].includes("Łazienka na Pięknej"), list[0]);
  check("with its status", list[0].includes("W toku"), list[0]);
  check("and it opens the job", (await page.$eval("#crm-client-jobs a", (a) =>
    a.getAttribute("href"))).includes("j1"));
  eq("nothing on this page writes a job",
    await page.$$eval("#crm-client-jobs button", (b) => b.length), 0);
  await page.close();
}

/* ---------------------------------------------------- 5. delete and undo */

head("5. a job is deleted with a question, and offered back afterwards");
{
  const page = await open(ctx, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
  await page.click("#job-delete");
  await page.waitForSelector("#job-delete-ask:not([hidden])");
  check("the question is asked on the page", Boolean((await page.textContent("#job-delete-q")).trim()));
  await page.click("#job-delete-no");
  eq("and can be answered no", await page.$eval("#job-delete-ask", (n) => n.hidden), true);
  eq("with the job still there", (await liveJobs(page)).length, 1);

  await page.click("#job-delete");
  await page.click("#job-delete-yes");
  await page.waitForSelector("#job-index:not([hidden])");
  eq("saying yes removes it", (await liveJobs(page)).length, 0);
  eq("the tombstone stays in storage", (await store(page)).jobs.length, 1);
  eq("and the strip offers it back", await page.$eval("#job-undo", (n) => n.hidden), false);
  check("naming it", (await page.textContent("#job-undo-text")).includes("Łazienka na Pięknej"));

  await page.click("#job-undo-go");
  await page.waitForFunction(() =>
    document.querySelectorAll("#job-list > li").length === 1
      && !document.querySelector("#job-list li.empty"));
  eq("the undo puts it back", (await liveJobs(page)).length, 1);
  eq("with its client", (await liveJobs(page))[0].clientId, "c1");
  eq("and its project", (await liveJobs(page))[0].projectId, "p1");
  await page.close();
}

/* ---------------------------------------------------- 6. chapter XXV's notice */

head("6. the page says it is LiczMat Pro, whoever is reading it");
{
  const guest = await open(ctx, JOBS, { workspace: workspace(), crm: crm() });
  check("a guest is told the module is Pro",
    (await guest.textContent("#job-pro-chip")).includes("Pro"),
    await guest.textContent("#job-pro-chip"));
  eq("with the sentence that explains why it is open",
    await guest.$eval("#job-pro-note", (n) => n.hidden), false);
  eq("and the module itself is there", await guest.$eval("#job-tool", (n) => n.hidden), false);
  eq("with no gate in the way", await guest.$eval("#job-gate", (n) => n.hidden), true);
  await guest.close();

  const pro = await open(ctx, JOBS, { workspace: workspace(), crm: crm(), level: "pro" });
  check("a Pro account is told which plan it is on",
    (await pro.textContent("#job-pro-chip")).includes("Pro"));
  eq("and is not told the module is open to everybody",
    await pro.$eval("#job-pro-note", (n) => n.hidden), true);
  eq("the chip is the one that marks a plan somebody has",
    await pro.$eval("#job-pro-chip", (n) => n.classList.contains("on")), true);
  await pro.close();
}

head("6b. the footer offers the module to a Pro account only");
{
  const footLink = 'footer.site a[href$="/zlecenia/"]:not([data-lang])';
  const guest = await open(ctx, JOBS, { workspace: workspace() });
  const shown = await guest.$$eval(footLink, (a) =>
    a.filter((n) => n.getBoundingClientRect().height > 0).length);
  eq("a guest is not offered the link", shown, 0);
  check("though the markup still carries it, which is what a crawler reads",
    (await guest.$$eval(footLink, (a) => a.length)) > 0);
  await guest.close();

  const pro = await open(ctx, JOBS, { workspace: workspace(), level: "pro" });
  const proShown = await pro.$$eval(footLink, (a) =>
    a.filter((n) => n.getBoundingClientRect().height > 0).length);
  check("a Pro account is", proShown > 0, String(proShown));
  await pro.close();
}

/* ---------------------------------------------------- 7. languages, currency, widths */

head("7. the same job reads in four languages");
{
  for (const lang of LANGS) {
    const page = await open(ctx, `${urlJobs(lang)}?id=j1`,
      { workspace: workspace(), crm: crm(), lang });
    eq(`${lang}: the job is the same record`,
      (await page.textContent("#job-title")).trim(), "Łazienka na Pięknej");
    const statuses = await page.$$eval("#job-status option", (o) => o.map((n) => n.textContent.trim()));
    eq(`${lang}: the four statuses are worded`, new Set(statuses).size, 4);
    check(`${lang}: nothing shows a raw dictionary key`,
      !(await page.content()).includes("job_st_"), lang);
    check(`${lang}: no error in the console`, page.errors.length === 0,
      page.errors.join("\n      "));
    await page.close();
  }
}

head("7b. the currency is the visitor's, and an agreed amount keeps the one it was agreed in");
{
  const page = await open(ctx, `${JOBS}?id=j1`,
    { workspace: workspace(), crm: crm(), currency: "EUR" });
  const value = await page.textContent("#job-fig-value");
  // Chapter VI: nothing is converted. The value was agreed in PLN, so it stays PLN even
  // for a visitor whose own currency is the euro.
  check("the agreed value stays in the currency it was agreed in", /zł|PLN/.test(value), value);
  check("and is the same number", value.replace(/\D/g, "").includes("1250000"), value);
  await page.close();
}

head("7c. chapter XXVIII: the page holds together at every width it names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const narrow = await context({ viewport: { width, height: 900 } });
    const page = await open(narrow, `${JOBS}?id=j1`, { workspace: workspace(), crm: crm() });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing spills sideways`, overflow <= 1, `${overflow}px over`);
    check(`${width}px: the record is on screen`,
      await page.$eval("#job-body", (n) => n.getBoundingClientRect().width > 0));
    await page.close();
    await narrow.close();
  }
}

/* ---------------------------------------------------- 8. no JavaScript */

head("8. with JavaScript off the page is still an honest page");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + JOBS, { waitUntil: "load" });
  const html = await page.content();
  check("the module is named", html.includes("Zlecenia"));
  check("and said to be LiczMat Pro — chapter XXV", html.includes("LiczMat Pro"));
  check("the list is in the markup", html.includes('id="job-list"'));
  check("with its form", html.includes('id="job-form"'));
  for (const word of ["Nowe", "W toku", "Zakończone", "Anulowane"]) {
    check(`chapter XXI's "${word}" is readable without a script`, html.includes(word));
  }
  eq("the detail is hidden, because a job comes out of storage",
    await page.$eval("#job-detail", (n) => n.hidden), true);
  eq("and nothing is drawn into the list",
    await page.$$eval("#job-list > li", (li) => li.length), 0);
  check("the footer still names the page for a crawler",
    (await page.$$eval('a[href$="/zlecenia/"]', (a) => a.length)) > 0);
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\njobs page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
