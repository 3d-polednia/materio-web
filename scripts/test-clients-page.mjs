#!/usr/bin/env node
/**
 * LiczMat — clients, in a real browser.
 *
 *     node scripts/test-clients-page.mjs
 *
 * Master plan, session 22, in the half that needs a browser: chapter XX clicked through —
 * a client added, corrected, given a project, read back with what that project has cost,
 * archived, deleted and undeleted — plus chapter XXV's notice, the four languages, the
 * currency switch, the widths chapter XXVIII names and the no-script variant. The pure
 * logic half is scripts/test-clients.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** /klienci/ touches no network: the clients are localStorage in
 * this browser and the projects they link to are the same local workspace every other page
 * uses. So the test opens the real page, clicks what a visitor clicks, and reads both what
 * was drawn and what went into storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-clients-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlClients, urlProjects } from "../src/site.mjs";

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
  console.log("test-clients-page: Playwright not installed — skipping the browser tests.");
  console.log("                   See the header of this file for the one-line install.");
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

/** Two projects, one of them with a calculation and a hand-typed cost already in it. */
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

/** One client, with the first project already filed under them. */
const clients = () => ({
  clients: [{
    id: "c1", name: "Jan Kowalski", phone: "600 100 200", email: "jan@example.com",
    address: "ul. Piękna 3", note: "Klucze u sąsiada.", projectIds: ["p1"], archived: false,
    ...sync(T0 + 4 * DAY),
  }],
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
  if (opts.clients) plant["liczmat-crm-v1"] = JSON.stringify(opts.clients);
  if (opts.currency) plant["liczmat-currency"] = opts.currency;
  if (opts.level) plant["liczmat-signed-in"] = opts.level;

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  if (opts.ready !== false) await page.waitForSelector(opts.ready || "html[data-crm-ready]");
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-crm-v1") || "{}"));
const liveClients = async (page) => ((await store(page)).clients || []).filter((c) => !c.deletedAt);

const CLIENTS = urlClients("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the index */

head("1. the client list");
{
  const page = await open(ctx, CLIENTS, { workspace: workspace(), clients: clients() });
  const list = await rows(page, "#crm-client-list");
  eq("the client is on the page", list.length, 1);
  check("with their name", list[0].includes("Jan Kowalski"), list[0]);
  check("and the number worth calling", list[0].includes("600 100 200"), list[0]);
  // p1 holds a calculation (749,85) and a hand-typed cost (1200,00) — 1949,85 in total,
  // counted by wsProjectCosts() and summed for the client.
  check("the row says what their work comes to", list[0].includes("1949,85"), list[0]);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. an empty list says what to do about it");
{
  const page = await open(ctx, CLIENTS, { workspace: workspace() });
  const list = await rows(page, "#crm-client-list");
  eq("one row, and it is the empty state", list.length, 1);
  check("which asks for the first client", /Dodaj|dodaj/.test(list[0]), list[0]);
  await page.close();
}

head("1c. a client is added from the form, with the details typed beside the name");
{
  const page = await open(ctx, CLIENTS, { workspace: workspace() });
  await page.fill("#crm-client-name", "Biuro Nowak");
  await page.fill("#crm-client-phone", "500 400 300");
  await page.fill("#crm-client-email", "biuro@example.com");
  await page.click("#crm-client-form button[type=submit]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#crm-client-list > li[data-id]").length === 1);

  const saved = (await liveClients(page))[0];
  eq("the name went in", saved.name, "Biuro Nowak");
  eq("so did the phone", saved.phone, "500 400 300");
  eq("and the e-mail", saved.email, "biuro@example.com");
  eq("the form is cleared for the next one", await page.inputValue("#crm-client-name"), "");
  await page.close();
}

/* ---------------------------------------------------- 2. one client */

head("2. opening a client shows chapter XX's record");
{
  const page = await open(ctx, CLIENTS, { workspace: workspace(), clients: clients() });
  await page.click("#crm-client-list a[data-open]");
  await page.waitForSelector("#crm-client-body:not([hidden])");

  eq("the heading is the client", (await page.textContent("#crm-title")).trim(), "Jan Kowalski");
  const contact = (await page.textContent("#crm-contact")).replace(/\s+/g, " ");
  check("the contact details are drawn", contact.includes("600 100 200"), contact);
  check("with the e-mail", contact.includes("jan@example.com"), contact);
  check("and the address", contact.includes("ul. Piękna 3"), contact);
  eq("the phone dials", await page.getAttribute("#crm-contact a[href^='tel:']", "href"), "tel:600100200");
  eq("the e-mail opens a mail", await page.getAttribute("#crm-contact a[href^='mailto:']", "href"),
    "mailto:jan@example.com");

  eq("one project is filed under them", (await page.textContent("#crm-fig-projects")).trim(), "1");
  check("and what it has cost is on the page",
    (await page.textContent("#crm-fig-total")).includes("1949,85"),
    await page.textContent("#crm-fig-total"));
  check("the note is shown as it was typed",
    (await page.textContent("#crm-note")).includes("Klucze u sąsiada"));

  const projects = await rows(page, "#crm-client-projects");
  check("the project is listed", projects[0].includes("Remont łazienki"), projects[0]);
  eq("and links back to the project page",
    await page.getAttribute("#crm-client-projects a", "href"), `${urlProjects("pl")}?id=p1`);

  // Session 26 made the history chapter XXIV's, not only chapter XX's: the client's own
  // row is in it beside the two saved lines, and a job or a quote would be too.
  const history = await rows(page, "#crm-history");
  eq("both saved lines are in the history, and the client's own row with them",
    history.length, 3);
  check("newest first", history[0].includes("Jan Kowalski"), history.join(" | "));
  check("a saved line names the project it happened in",
    history[1].includes("Remont łazienki"), history[1]);
  check("and says which of the two it was",
    history[1].includes("Dopisano koszt") && history[2].includes("Zapisano kalkulację"),
    history.join(" | "));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2b. the address opens the client directly, and Back returns to the list");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`, { workspace: workspace(), clients: clients() });
  eq("the detail is what is shown", await page.$eval("#crm-client", (n) => n.hidden), false);
  eq("and the index is not", await page.$eval("#crm-index", (n) => n.hidden), true);
  await page.click("[data-crm-back]");
  await page.waitForSelector("#crm-index:not([hidden])");
  eq("the list is back", await page.$eval("#crm-client", (n) => n.hidden), true);

  const page2 = await open(ctx, CLIENTS, { workspace: workspace(), clients: clients() });
  await page2.click("#crm-client-list a[data-open]");
  await page2.waitForSelector("#crm-client-body:not([hidden])");
  await page2.goBack();
  await page2.waitForSelector("#crm-index:not([hidden])");
  eq("the browser's own Back works too", await page2.$eval("#crm-index", (n) => n.hidden), false);
  await page.close();
  await page2.close();
}

head("2c. an address for a client that is not here says so instead of failing silently");
{
  const page = await open(ctx, `${CLIENTS}?id=nope`, { workspace: workspace(), clients: clients() });
  eq("the missing block is shown", await page.$eval("#crm-client-missing", (n) => n.hidden), false);
  eq("and the record is not", await page.$eval("#crm-client-body", (n) => n.hidden), true);
  await page.close();
}

/* ---------------------------------------------------- 3. correcting, archiving, deleting */

head("3. the record is corrected in the form on the page");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`, { workspace: workspace(), clients: clients() });
  await page.click("#crm-client-edit");
  await page.waitForSelector("#crm-edit-form:not([hidden])");
  eq("the form opens filled in", await page.inputValue("#crm-edit-name"), "Jan Kowalski");

  await page.fill("#crm-edit-name", "Jan Kowalski — dom");
  await page.fill("#crm-edit-phone", "600 100 999");
  await page.fill("#crm-edit-note", "Klucze u sąsiada.\nWjazd od podwórza.");
  await page.click("#crm-edit-form button[type=submit]");
  await page.waitForSelector("#crm-edit-form", { state: "hidden" });

  const saved = (await liveClients(page))[0];
  eq("the name is corrected", saved.name, "Jan Kowalski — dom");
  eq("the phone with it", saved.phone, "600 100 999");
  check("and the note keeps the line the visitor typed", saved.note.includes("\n"), saved.note);
  eq("the heading follows", (await page.textContent("#crm-title")).trim(), "Jan Kowalski — dom");
  check("the note is redrawn", (await page.textContent("#crm-note")).includes("podwórza"));
  check("the projects are untouched by an edit",
    (await page.evaluate(() => JSON.parse(localStorage.getItem("materio-workspace-v1")).projects
      .map((p) => p.name).join())) === "Remont łazienki,Salon");
  await page.close();
}

head("3b. archiving takes a client out of the list without losing them");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`, { workspace: workspace(), clients: clients() });
  await page.click("#crm-client-archive");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("liczmat-crm-v1")).clients[0].archived === true);
  await page.click("[data-crm-back]");
  await page.waitForSelector("#crm-index:not([hidden])");
  const list = await rows(page, "#crm-client-list");
  eq("the working list is empty", list.length, 1);
  check("and says so", /Dodaj|dodaj/.test(list[0]), list[0]);
  eq("the archive is offered", await page.$eval("#crm-archive", (n) => n.hidden), false);
  const archived = await rows(page, "#crm-archive-list");
  check("with the client in it", archived[0].includes("Jan Kowalski"), archived[0]);

  // The archive is a <details>, folded away until it is asked for.
  await page.click("#crm-archive > summary");
  await page.click("#crm-archive-list [data-unarchive]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#crm-client-list > li[data-id]").length === 1);
  eq("and one click brings them back", (await liveClients(page))[0].archived, false);
  await page.close();
}

head("3c. deleting asks first, keeps the projects, and offers the client back");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`, { workspace: workspace(), clients: clients() });
  await page.click("#crm-client-delete");
  await page.waitForSelector("#crm-delete-ask:not([hidden])");
  check("the question is asked on the page", Boolean((await page.textContent("#crm-delete-q")).trim()));

  await page.click("#crm-delete-no");
  await page.waitForSelector("#crm-delete-ask", { state: "hidden" });
  eq("saying no changes nothing", (await liveClients(page)).length, 1);

  await page.click("#crm-client-delete");
  await page.waitForSelector("#crm-delete-ask:not([hidden])");
  await page.click("#crm-delete-yes");
  await page.waitForSelector("#crm-index:not([hidden])");
  eq("the client is gone", (await liveClients(page)).length, 0);
  eq("the projects are not", await page.evaluate(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).projects.filter((p) => !p.deletedAt).length), 2);
  eq("and the address bar is back on the list", new URL(page.url()).search, "");

  eq("the undo strip is offered", await page.$eval("#crm-undo", (n) => n.hidden), false);
  await page.click("#crm-undo-go");
  await page.waitForFunction(() =>
    document.querySelectorAll("#crm-client-list > li[data-id]").length === 1);
  const back = (await liveClients(page))[0];
  eq("the client is back", back.name, "Jan Kowalski");
  eq("with their project still filed under them", back.projectIds.join(), "p1");
  await page.close();
}

/* ---------------------------------------------------- 4. the projects of a client */

head("4. a project is filed under a client, and taken off again");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`, { workspace: workspace(), clients: clients() });
  // p1 is already filed, so the picker offers p2 and nothing else.
  const options = await page.$$eval("#crm-project-pick option", (o) => o.map((n) => n.textContent));
  eq("the picker offers the project nobody has filed", options.join(), "Salon");

  await page.click("#crm-project-form button[type=submit]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#crm-client-projects > li").length === 2);
  eq("both projects are now the client's", (await liveClients(page))[0].projectIds.join(), "p1,p2");
  eq("the count follows", (await page.textContent("#crm-fig-projects")).trim(), "2");
  eq("and the picker has nothing left to offer",
    await page.$eval("#crm-project-form", (n) => n.hidden), true);
  check("which it says out loud",
    Boolean((await page.textContent("#crm-project-none")).trim()));

  await page.click("#crm-client-projects li:last-child [data-unlink]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#crm-client-projects > li").length === 1);
  eq("taking one off leaves the other", (await liveClients(page))[0].projectIds.join(), "p1");
  eq("and the project itself is untouched", await page.evaluate(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).projects.length), 2);
  await page.close();
}

/* ---------------------------------------------------- 5. chapter XXV's notice */

head("5. the page says it is LiczMat Pro, whoever is reading it");
{
  const guest = await open(ctx, CLIENTS, { workspace: workspace(), clients: clients() });
  check("a guest is told the module is Pro",
    (await guest.textContent("#crm-pro-chip")).includes("Pro"),
    await guest.textContent("#crm-pro-chip"));
  eq("with the sentence that explains why it is open",
    await guest.$eval("#crm-pro-note", (n) => n.hidden), false);
  eq("and the module itself is there", await guest.$eval("#crm-tool", (n) => n.hidden), false);
  eq("with no gate in the way", await guest.$eval("#crm-gate", (n) => n.hidden), true);
  await guest.close();

  const pro = await open(ctx, CLIENTS, { workspace: workspace(), clients: clients(), level: "pro" });
  check("a Pro account is told which plan it is on",
    (await pro.textContent("#crm-pro-chip")).includes("Pro"));
  eq("and is not told the module is open to everybody",
    await pro.$eval("#crm-pro-note", (n) => n.hidden), true);
  eq("the chip is the one that marks a plan somebody has",
    await pro.$eval("#crm-pro-chip", (n) => n.classList.contains("on")), true);
  await pro.close();
}

head("5b. the footer offers the module to a Pro account only, and never to a crawler-less guest");
{
  // Only the footer's navigation link is in question here. Two other links on this very
  // page point at /klienci/ and are supposed to: the breadcrumb (the trail of the page
  // being read) and the Polish entry in the language picker (this page, in this language).
  const footLink = 'footer.site a[href$="/klienci/"]:not([data-lang])';
  const guest = await open(ctx, CLIENTS, { workspace: workspace() });
  const shown = await guest.$$eval(footLink, (a) =>
    a.filter((n) => n.getBoundingClientRect().height > 0).length);
  eq("a guest is not offered the link", shown, 0);
  check("though the markup still carries it, which is what a crawler reads",
    (await guest.$$eval(footLink, (a) => a.length)) > 0);
  await guest.close();

  const pro = await open(ctx, CLIENTS, { workspace: workspace(), level: "pro" });
  const proShown = await pro.$$eval(footLink, (a) =>
    a.filter((n) => n.getBoundingClientRect().height > 0).length);
  check("a Pro account is", proShown > 0, String(proShown));
  await pro.close();
}

/* ---------------------------------------------------- 6. languages, currency, widths */

head("6. the same client reads in four languages");
{
  for (const lang of LANGS) {
    const page = await open(ctx, `${urlClients(lang)}?id=c1`,
      { workspace: workspace(), clients: clients(), lang });
    eq(`${lang}: the client is the same record`,
      (await page.textContent("#crm-title")).trim(), "Jan Kowalski");
    const headings = await page.$$eval("#crm-client-body h2", (h) =>
      h.map((n) => n.textContent.trim()).filter(Boolean));
    check(`${lang}: every section is headed`, headings.length >= 3, headings.join(" | "));
    check(`${lang}: nothing shows a raw dictionary key`,
      !(await page.content()).includes("cli_"), lang);
    check(`${lang}: no error in the console`, page.errors.length === 0,
      page.errors.join("\n      "));
    await page.close();
  }
}

head("6b. the currency is the visitor's, and a saved amount keeps the one it was saved in");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`,
    { workspace: workspace(), clients: clients(), currency: "EUR" });
  const total = await page.textContent("#crm-fig-total");
  // Chapter VI: nothing is converted. The lines were saved in PLN, so they stay PLN even
  // for a visitor whose own currency is the euro.
  check("the saved amounts stay in the currency they were saved in",
    /zł|PLN/.test(total), total);
  check("and the figure is the same number", total.replace(/\D/g, "").includes("194985"), total);
  await page.close();
}

head("6c. chapter XXVIII: the page holds together at every width it names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const narrow = await context({ viewport: { width, height: 900 } });
    const page = await open(narrow, `${CLIENTS}?id=c1`,
      { workspace: workspace(), clients: clients() });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing spills sideways`, overflow <= 1, `${overflow}px over`);
    check(`${width}px: the record is on screen`,
      await page.$eval("#crm-client-body", (n) => n.getBoundingClientRect().width > 0));
    await page.close();
    await narrow.close();
  }
}

/* ---------------------------------------------------- 7. no JavaScript */

head("7. with JavaScript off the page is still an honest page");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + CLIENTS, { waitUntil: "load" });
  const html = await page.content();
  check("the module is named", html.includes("Klienci"));
  check("and said to be LiczMat Pro — chapter XXV", html.includes("LiczMat Pro"));
  check("the list is in the markup", html.includes('id="crm-client-list"'));
  check("with its form", html.includes('id="crm-client-form"'));
  eq("the detail is hidden, because a client comes out of storage",
    await page.$eval("#crm-client", (n) => n.hidden), true);
  eq("and nothing is drawn into the list",
    await page.$$eval("#crm-client-list > li", (li) => li.length), 0);
  // The footer link is what a crawler follows: the page is indexable, and the hiding is
  // done by a stylesheet rule that needs the .js class to apply.
  check("the footer still names the page for a crawler",
    (await page.$$eval('a[href$="/klienci/"]', (a) => a.length)) > 0);
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nclients page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
