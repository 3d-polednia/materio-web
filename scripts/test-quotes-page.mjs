#!/usr/bin/env node
/**
 * LiczMat — quotes, in a real browser.
 *
 *     node scripts/test-quotes-page.mjs
 *
 * Master plan, session 24, in the half that needs a browser: chapter XXII clicked
 * through — a quote added against a project, labour typed onto it as quantity × rate and
 * as a lump sum, a line corrected and removed, a margin moved, the project attached and
 * detached, the quote deleted and undeleted — plus chapter XXIV's path read backwards
 * from the quote, chapter XXV's notice, the four languages, the currency switch, the
 * widths chapter XXVIII names and the no-script variant. The pure logic half is
 * scripts/test-quotes.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** /wyceny/ touches no network: the quotes are localStorage in this
 * browser and the projects are the same local workspace every other page uses. So the test
 * opens the real page, clicks what a visitor clicks, and reads both what was drawn and
 * what went into storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-quotes-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlQuotes, urlJobs, urlClients } from "../src/site.mjs";

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
  console.log("test-quotes-page: Playwright not installed — skipping the browser tests.");
  console.log("                  See the header of this file for the one-line install.");
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

/** Two projects; the first holds a calculation (749,85) and a hand-typed cost (1 200). */
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
      line("e2", "p1", "Wywóz gruzu", 1, "usł.", 120000, T0 + 2 * DAY, true),
    ],
    shoppingItems: [],
  };
}

/* The five figures the fixture comes to, so a broken one names itself rather than
   turning up as an unexplained number in a diff. */
const MATERIALS = 74985;
const OTHER = 120000;
const LABOUR = 160000;               // 20 m² × 80,00
const SUBTOTAL = MATERIALS + OTHER + LABOUR;
const MARGIN = Math.round(SUBTOTAL * 0.15);
const TOTAL = SUBTOTAL + MARGIN;

/** One client, one job and one quote — chapter XXIV's chain, already whole. */
const crm = (over = {}) => ({
  clients: [{
    id: "c1", name: "Jan Kowalski", phone: "600 100 200", email: "jan@example.com",
    address: "ul. Piękna 3", note: "", projectIds: ["p1"], archived: false,
    ...sync(T0 + 4 * DAY),
  }],
  jobs: [{
    id: "j1", name: "Łazienka na Pięknej", clientId: "c1", projectId: "p1",
    status: "active", description: "", note: "", dueDate: "2026-09-30",
    valueMinor: 1250000, currencyCode: "PLN", ...sync(T0 + 4 * DAY),
  }],
  quotes: [{
    id: "q1", name: "Łazienka — wycena", projectId: "p1",
    labour: [{ id: "l1", name: "Układanie gresu", quantity: 20, unit: "m²", amountMinor: LABOUR }],
    marginPct: 15, note: "Materiał kupuje klient.", currencyCode: "PLN",
    ...sync(T0 + 6 * DAY),
  }],
  ...over,
});

/** The same store with no quote in it, for the empty state and the add form. */
const crmNoQuotes = () => ({ ...crm(), quotes: [] });

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
  /* Session 27 put a paywall in front of the Pro modules, and session 28 removed the
     preview that used to be the door through it — with a price on the wall, a local
     switch that opens the modules for free is the wall contradicting itself.
     So a test that wants the tool rather than the wall says so by planting the level
     itself: `liczmat-signed-in` is what assets/paywall.js reads (lmReadLevel()), and
     "pro" is what a real Pro account writes there. `pro: false` looks at the wall. */
  if (opts.pro !== false && !opts.level) plant["liczmat-signed-in"] = "pro";

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  if (opts.ready !== false) await page.waitForSelector(opts.ready || "html[data-quotes-ready]");
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-crm-v1") || "{}"));
const liveQuotes = async (page) => ((await store(page)).quotes || []).filter((q) => !q.deletedAt);
const digits = (s) => String(s).replace(/\D/g, "");
/* A rendered amount back as minor units. "1 064,96 zł" is 106496 — and "0,00 zł" is 0,
   which a string comparison against "0" would miss. */
const minor = (s) => Number(digits(s));

const QUOTES = urlQuotes("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the index */

head("1. the quote list");
{
  const page = await open(ctx, QUOTES, { workspace: workspace(), crm: crm() });
  const list = await rows(page, "#quo-list");
  eq("the quote is on the page", list.length, 1);
  check("with its name", list[0].includes("Łazienka — wycena"), list[0]);
  check("the project it prices", list[0].includes("Remont łazienki"), list[0]);
  check("and what it comes to — computed, never stored",
    digits(list[0]).includes(String(TOTAL)), list[0]);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. an empty list says what to do about it");
{
  const page = await open(ctx, QUOTES, { workspace: workspace(), crm: crmNoQuotes() });
  const list = await rows(page, "#quo-list");
  eq("one row, and it is the empty state", list.length, 1);
  check("which asks for the first quote", /Dodaj|dodaj/.test(list[0]), list[0]);
  await page.close();
}

head("1c. a quote is added from the form, with the project beside the name");
{
  const page = await open(ctx, QUOTES, { workspace: workspace(), crm: crmNoQuotes() });
  const options = await page.$$eval("#quo-project option", (o) => o.map((n) => n.textContent.trim()));
  eq("the picker offers both projects, plus none", options.length, 3);
  check("and names them", options.join().includes("Remont łazienki"), options.join());

  await page.fill("#quo-name", "Wariant z gresem premium");
  await page.selectOption("#quo-project", { label: "Remont łazienki" });
  await page.click("#quo-form button[type=submit]");
  await page.waitForFunction(() => document.querySelectorAll("#quo-list > li").length === 1);

  const stored = await liveQuotes(page);
  eq("one quote is stored", stored.length, 1);
  eq("with the name typed", stored[0].name, "Wariant z gresem premium");
  eq("the project picked", stored[0].projectId, "p1");
  eq("no labour yet", stored[0].labour.length, 0);
  eq("no margin yet", stored[0].marginPct, 0);
  eq("and no currency, because there is no money on it yet", stored[0].currencyCode, "");
  eq("the form is emptied for the next one", await page.inputValue("#quo-name"), "");
  await page.close();
}

/* ---------------------------------------------------- 2. one quote */

head("2. opening a quote is an ordinary navigation");
{
  const page = await open(ctx, QUOTES, { workspace: workspace(), crm: crm() });
  await page.click("#quo-list a[data-open]");
  await page.waitForSelector("#quo-body:not([hidden])");
  check("the address carries the quote", page.url().includes("?id=q1"), page.url());
  eq("the heading is the quote", (await page.textContent("#quo-title")).trim(), "Łazienka — wycena");
  eq("the index is out of the way", await page.$eval("#quo-index", (n) => n.hidden), true);
  check("the trail gained the quote",
    (await page.textContent(".breadcrumbs")).includes("Łazienka — wycena"));

  await page.goBack();
  await page.waitForSelector("#quo-index:not([hidden])");
  eq("and Back returns to the list", await page.$eval("#quo-detail", (n) => n.hidden), true);
  await page.close();
}

head("2b. chapter XXII's five figures, on the page");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  const fig = async (id) => minor(await page.textContent(id));
  eq("materiały come from the project", await fig("#quo-fig-materials"), MATERIALS);
  eq("inne koszty as well", await fig("#quo-fig-other"), OTHER);
  eq("robocizna is the quote's own", await fig("#quo-fig-labour"), LABOUR);
  eq("razem is the three added", await fig("#quo-fig-sub"), SUBTOTAL);
  eq("marża is 15% of that", await fig("#quo-fig-margin"), MARGIN);
  eq("and the suma is the two", await fig("#quo-fig-total"), TOTAL);
  eq("the margin field carries what is stored", await page.inputValue("#quo-margin"), "15");
  eq("with nothing to warn about", await page.$eval("#quo-mixed", (n) => n.hidden), true);
  check("the note is on the page", (await page.textContent("#quo-note")).includes("klient"));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2c. chapter XXIV read backwards: the quote names its job and its client");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  // Session 26 draws the strip every CRM screen shares: chapter XXIV's four nodes in the
  // chapter's own order. The quote is the node the visitor is standing on, so it is a name
  // and not a link — a link to this page is a dead click — which leaves three.
  const links = await page.$$eval("#quo-chain-line a",
    (a) => a.map((n) => `${n.getAttribute("href")}|${n.textContent.trim()}`));
  eq("the three steps above this quote are there", links.length, 3);
  check("the client, linked to their own page",
    links[0].includes("c1") && links[0].includes("Jan Kowalski"), links[0]);
  check("and the job, linked to its own", links[1].includes("j1") && links[1].includes("Łazienka na Pięknej"), links[1]);
  check("and the project it is priced from", links[2].includes("p1"), links[2]);
  check("the client link is this language's address",
    links[0].startsWith(urlClients("pl")), links[0]);
  check("and so is the job's", links[1].startsWith(urlJobs("pl")), links[1]);
  eq("the quote itself is the step you are on, and links nowhere",
    await page.$eval("#quo-chain-line li.on b", (n) => n.textContent.trim()),
    "Łazienka — wycena");

  // Derived means derived: nothing about either is written onto the quote.
  const stored = (await liveQuotes(page))[0];
  eq("no clientId is stored on the quote", stored.clientId, undefined);
  eq("and no jobId either", stored.jobId, undefined);
  await page.close();
}

head("2d. the record is corrected in a form on the page");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  await page.click("#quo-edit");
  await page.waitForSelector("#quo-edit-form:not([hidden])");
  eq("the form opens filled with what is stored",
    await page.inputValue("#quo-edit-name"), "Łazienka — wycena");

  await page.fill("#quo-edit-name", "Łazienka i WC — wycena");
  await page.fill("#quo-edit-note", "Termin do końca miesiąca.");
  await page.click("#quo-edit-form button[type=submit]");
  await page.waitForFunction(() =>
    document.getElementById("quo-title").textContent.trim() === "Łazienka i WC — wycena");

  const stored = (await liveQuotes(page))[0];
  eq("the name is corrected", stored.name, "Łazienka i WC — wycena");
  eq("and the note is what was typed", stored.note, "Termin do końca miesiąca.");
  eq("the labour is untouched", stored.labour.length, 1);
  await page.close();
}

/* ---------------------------------------------------- 3. the labour */

head("3. robocizna: quantity × rate, typed onto the quote");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  const first = await rows(page, "#quo-labour-list");
  eq("the line that is already there", first.length, 1);
  check("named", first[0].includes("Układanie gresu"), first[0]);
  check("with its quantity and unit", first[0].includes("20 m²"), first[0]);
  check("the rate read back by dividing", digits(first[0]).includes("8000"), first[0]);
  check("and the amount", digits(first[0]).includes(String(LABOUR)), first[0]);

  await page.fill("#quo-labour-name", "Fugowanie");
  await page.fill("#quo-labour-qty", "20");
  await page.fill("#quo-labour-unit", "m²");
  await page.fill("#quo-labour-price", "25");
  // Chapter XVII's running line, in a quote: the number that will be saved is on screen
  // before it is saved.
  const running = await page.textContent("#quo-labour-run");
  check("the product is shown as it is typed", digits(running).includes("50000"), running);

  await page.click("#quo-labour-form button[type=submit]");
  await page.waitForFunction(() => document.querySelectorAll("#quo-labour-list > li").length === 2);

  const stored = (await liveQuotes(page))[0];
  eq("the line is stored", stored.labour.length, 2);
  eq("with the work named", stored.labour[1].name, "Fugowanie");
  eq("the quantity as a number", stored.labour[1].quantity, 20);
  eq("the unit as the word beside it", stored.labour[1].unit, "m²");
  eq("and 20 × 25 rounded once", stored.labour[1].amountMinor, 50000);
  eq("no rate is stored beside it",
    Object.keys(stored.labour[1]).filter((k) => /price|rate/i.test(k)).join(), "");

  const sub = MATERIALS + OTHER + LABOUR + 50000;
  eq("and the sum moved with it", minor(await page.textContent("#quo-fig-total")),
    sub + Math.round(sub * 0.15));
  await page.close();
}

head("3b. a lump sum is a line with no quantity, and says so");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  await page.fill("#quo-labour-name", "Wywóz i sprzątanie");
  await page.fill("#quo-labour-price", "500");
  await page.click("#quo-labour-form button[type=submit]");
  await page.waitForFunction(() => document.querySelectorAll("#quo-labour-list > li").length === 2);

  const stored = (await liveQuotes(page))[0];
  eq("the quantity is null, not one", stored.labour[1].quantity, null);
  eq("and the line comes to the rate itself", stored.labour[1].amountMinor, 50000);
  const list = await rows(page, "#quo-labour-list");
  check("the row says it is a lump sum", /rycza/i.test(list[1]), list[1]);
  await page.close();
}

head("3c. a line is corrected in the row it belongs to, and removed from it");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  await page.click('#quo-labour-list [data-line-edit]');
  await page.waitForSelector("#quo-labour-list [data-line-form]");
  eq("the form opens with the work in it",
    await page.inputValue('[data-line-form] [data-f="name"]'), "Układanie gresu");
  eq("the quantity as it was typed",
    await page.inputValue('[data-line-form] [data-f="quantity"]'), "20");
  eq("and the rate divided back out",
    await page.inputValue('[data-line-form] [data-f="priceMajor"]'), "80");

  await page.fill('[data-line-form] [data-f="quantity"]', "25");
  const sum = await page.textContent("[data-line-sum]");
  check("the row shows what it will come to", digits(sum).includes("200000"), sum);
  await page.click("[data-line-form] button[type=submit]");
  await page.waitForSelector("#quo-labour-list [data-line-form]", { state: "detached" });

  let stored = (await liveQuotes(page))[0];
  eq("25 × 80 is 2 000", stored.labour[0].amountMinor, 200000);
  eq("and the quantity followed", stored.labour[0].quantity, 25);

  await page.click("#quo-labour-list [data-line-del]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#quo-labour-list > li.ws-mat").length === 0);
  stored = (await liveQuotes(page))[0];
  eq("removing the line takes it off the quote", stored.labour.length, 0);
  eq("and with the last amount gone the currency stamp goes too", stored.currencyCode, "");
  eq("the labour figure is zero", minor(await page.textContent("#quo-fig-labour")), 0);
  await page.close();
}

/* ---------------------------------------------------- 4. the margin */

head("4. marża: one field, and the sum follows it");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  await page.fill("#quo-margin", "30");
  await page.dispatchEvent("#quo-margin", "change");
  await page.waitForFunction((want) =>
    document.getElementById("quo-fig-margin").textContent.replace(/\D/g, "") === want,
  String(Math.round(SUBTOTAL * 0.3)));

  const stored = (await liveQuotes(page))[0];
  eq("the margin is stored in percent", stored.marginPct, 30);
  eq("the sum is the subtotal plus it",
    minor(await page.textContent("#quo-fig-total")), SUBTOTAL + Math.round(SUBTOTAL * 0.3));

  await page.fill("#quo-margin", "");
  await page.dispatchEvent("#quo-margin", "change");
  await page.waitForFunction((want) =>
    document.getElementById("quo-fig-total").textContent.replace(/\D/g, "") === want,
  String(SUBTOTAL));
  eq("clearing it puts the margin back to nothing", (await liveQuotes(page))[0].marginPct, 0);
  eq("and the sum back to the subtotal",
    minor(await page.textContent("#quo-fig-total")), SUBTOTAL);
  await page.close();
}

/* ---------------------------------------------------- 5. the project */

head("5. the project is read, never written — and it can be detached and attached");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  const before = await page.evaluate(() => localStorage.getItem("materio-workspace-v1"));
  const project = await rows(page, "#quo-project-list");
  eq("the project is listed", project.length, 1);
  check("by name", project[0].includes("Remont łazienki"), project[0]);
  check("with what it has cost", digits(project[0]).includes(String(MATERIALS + OTHER)), project[0]);

  await page.click("#quo-project-list [data-unlink]");
  await page.waitForFunction(() =>
    Number(document.getElementById("quo-fig-materials").textContent.replace(/\D/g, "")) === 0);
  eq("detaching empties the two derived figures",
    minor(await page.textContent("#quo-fig-other")), 0);
  eq("and the labour is untouched", minor(await page.textContent("#quo-fig-labour")), LABOUR);
  // With no project there is nothing above the quote any more, so every step of the strip
  // is the way to make one: the section's own index, with no ?id= behind it.
  eq("no step of the chain resolves any more",
    await page.$$eval("#quo-chain-line a[href*='?id=']", (a) => a.length), 0);
  eq("and each one offers the page that would fill it",
    await page.$$eval("#quo-chain-line li.off a", (a) => a.length), 3);

  await page.selectOption("#quo-project-pick", { label: "Remont łazienki" });
  await page.click("#quo-project-form button[type=submit]");
  await page.waitForFunction((want) =>
    document.getElementById("quo-fig-materials").textContent.replace(/\D/g, "") === want,
  String(MATERIALS));
  eq("attaching it brings the money back",
    minor(await page.textContent("#quo-fig-total")), TOTAL);

  eq("and the workspace the phone reads was never written to",
    await page.evaluate(() => localStorage.getItem("materio-workspace-v1")), before);
  await page.close();
}

/* ---------------------------------------------------- 6. delete and undo */

head("6. a quote is deleted with a question, and offered back");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  await page.click("#quo-delete");
  await page.waitForSelector("#quo-delete-ask:not([hidden])");
  check("the question says what survives",
    (await page.textContent("#quo-delete-q")).includes("Projekt"));

  await page.click("#quo-delete-no");
  eq("saying no changes nothing", (await liveQuotes(page)).length, 1);

  await page.click("#quo-delete");
  await page.click("#quo-delete-yes");
  await page.waitForSelector("#quo-index:not([hidden])");
  eq("the quote is gone", (await liveQuotes(page)).length, 0);
  eq("the tombstone is still in storage",
    ((await store(page)).quotes || []).length, 1);
  eq("and the address is the index again", new URL(page.url()).search, "");
  check("the strip offers it back",
    (await page.textContent("#quo-undo-text")).includes("Łazienka — wycena"));

  await page.click("#quo-undo-go");
  await page.waitForFunction(() => document.querySelectorAll("#quo-list > li").length === 1);
  const back = await liveQuotes(page);
  eq("the undo brings it back", back.length, 1);
  eq("with its labour", back[0].labour.length, 1);
  eq("and its margin", back[0].marginPct, 15);
  await page.close();
}

/* ---------------------------------------------------- 7. chapter XXV, languages, widths */

head("7. chapter XXV's paywall: the wall, the two rungs and the one door through it");
{
  /* The wall, with nothing planted: a guest gets the paywall instead of the tool. */
  const guest = await open(ctx, QUOTES, { workspace: workspace(), crm: crm(), pro: false });
  eq("the module is replaced by the wall", await guest.$eval("#quo-tool", (n) => n.hidden), true);
  eq("and the wall is on screen", await guest.$eval("#quo-gate", (n) => n.hidden), false);
  eq("the strip above it is gone — the wall says all of it",
    await guest.$eval("#quo-pro", (n) => n.hidden), true);
  // Chapter XXV's Free → Pro path, one rung: a guest has no account for a plan to sit on.
  eq("a guest is sent to make an account",
    await guest.$eval('#quo-gate [data-pw-step="account"]', (n) => n.hidden), false);
  eq("and is not offered an upgrade they cannot put anywhere",
    await guest.$eval('#quo-gate [data-pw-step="upgrade"]', (n) => n.hidden), true);
  check("the sign-up link comes back to this page",
    await guest.$eval('#quo-gate [data-pw-step="account"] a', (n) => n.getAttribute("href"))
      === `/app/?mode=signup&next=${encodeURIComponent(QUOTES)}`);
  await guest.close();

  /* A free account meets the same wall and the other rung. */
  const free = await open(ctx, QUOTES, { workspace: workspace(), crm: crm(), level: "liczmat", pro: false });
  eq("the wall stands for a free account too",
    await free.$eval("#quo-gate", (n) => n.hidden), false);
  eq("and it is told its plan rather than told to sign up",
    await free.$eval('#quo-gate [data-pw-step="upgrade"]', (n) => n.hidden), false);

  /* Session 28: the wall quotes a price instead of offering a way round itself. The
     amounts come from assets/pay.js in the visitor's currency, and no Payment Link is
     configured, so the page says the subscription is not open yet — and offers no
     button that would take money. */
  eq("the monthly plan is priced", await free.$eval('#quo-gate [data-pw-plan="monthly"]', (n) => n.hidden), false);
  eq("and the yearly one", await free.$eval('#quo-gate [data-pw-plan="yearly"]', (n) => n.hidden), false);
  check("with a real amount in it",
    /[0-9]/.test(await free.$eval('#quo-gate [data-pw-plan="monthly"] [data-pw-price]', (n) => n.textContent)),
    await free.$eval('#quo-gate [data-pw-plan="monthly"] [data-pw-price]', (n) => n.textContent));
  eq("the site says the subscription is not open yet",
    await free.$eval("#quo-gate [data-pw-soon]", (n) => n.hidden), false);
  eq("and offers nothing to click that would charge",
    await free.$eval("#quo-gate [data-pw-buy]", (n) => n.hidden), true);
  check("no Stripe link stands on this page",
    (await free.content()).indexOf("stripe.com") === -1);
  /* The wall stays up. Nothing on this page can open it — the level is the only input,
     and it comes from Firebase by way of /app/. */
  eq("the wall is still standing", await free.$eval("#quo-gate", (n) => n.hidden), false);
  eq("and the module is still behind it", await free.$eval("#quo-tool", (n) => n.hidden), true);
  await free.close();

  /* A Pro account walks straight in, and is told which plan opened it. */
  const pro = await open(ctx, QUOTES, { workspace: workspace(), crm: crm(), level: "pro", pro: false });
  eq("no wall for a Pro account", await pro.$eval("#quo-gate", (n) => n.hidden), true);
  eq("the module is there", await pro.$eval("#quo-tool", (n) => n.hidden), false);
  check("the chip names the plan they are on",
    (await pro.textContent("#quo-pro-chip")).includes("Pro"));
  eq("the chip is the one that marks a plan somebody has",
    await pro.$eval("#quo-pro-chip", (n) => n.classList.contains("on")), true);
  /* A paying account is shown the plan and nothing else: no price, and nothing offering
     to sell them what they already have. */
  /* The whole wall is hidden for them, so the price it carries is hidden with it:
     nothing offers to sell somebody what they are already paying for. */
  eq("and is not quoted a price for what they already pay for",
    await pro.locator('#quo-gate [data-pw-plan="monthly"]').isVisible(), false);
  await pro.close();
}

head("7b. the same quote reads in four languages");
{
  for (const lang of LANGS) {
    const page = await open(ctx, `${urlQuotes(lang)}?id=q1`,
      { workspace: workspace(), crm: crm(), lang });
    eq(`${lang}: the quote is the same record`,
      (await page.textContent("#quo-title")).trim(), "Łazienka — wycena");
    eq(`${lang}: and comes to the same sum`,
      minor(await page.textContent("#quo-fig-total")), TOTAL);
    check(`${lang}: nothing shows a raw dictionary key`,
      !(await page.content()).includes("quo_fig_"), lang);
    check(`${lang}: the job link is this language's address`,
      (await page.$$eval("#quo-chain-line a", (a) => a.map((n) => n.getAttribute("href"))))
        .some((h) => h.startsWith(urlJobs(lang))), lang);
    check(`${lang}: no error in the console`, page.errors.length === 0,
      page.errors.join("\n      "));
    await page.close();
  }
}

head("7c. switching language on an open quote keeps the quote");
{
  const page = await open(ctx, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
  const link = await page.$eval('a[hreflang="de"]', (a) => a.getAttribute("href"));
  check("the language link carries the id", link.includes("id=q1"), link);
  await page.close();
}

head("7d. the currency is the visitor's, and a priced quote keeps the one it was priced in");
{
  const page = await open(ctx, `${QUOTES}?id=q1`,
    { workspace: workspace(), crm: crm(), currency: "EUR" });
  const total = await page.textContent("#quo-fig-total");
  // Chapter VI: nothing is converted. The labour was priced in PLN, so the whole quote
  // stays PLN even for a visitor whose own currency is the euro.
  check("the sum stays in the currency it was priced in", /zł|PLN/.test(total), total);
  check("and is the same number", digits(total).includes(String(TOTAL)), total);
  await page.close();
}

head("7e. chapter XXVIII: the page holds together at every width it names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const narrow = await context({ viewport: { width, height: 900 } });
    const page = await open(narrow, `${QUOTES}?id=q1`, { workspace: workspace(), crm: crm() });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing spills sideways`, overflow <= 1, `${overflow}px over`);
    check(`${width}px: the quote is on screen`,
      await page.$eval("#quo-body", (n) => n.getBoundingClientRect().width > 0));
    await page.close();
    await narrow.close();
  }
}

/* ---------------------------------------------------- 8. no JavaScript */

head("8. with JavaScript off the page is still an honest page");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + QUOTES, { waitUntil: "load" });
  const html = await page.content();
  check("the module is named", html.includes("Wyceny"));
  check("and said to be LiczMat Pro — chapter XXV", html.includes("LiczMat Pro"));
  check("the list is in the markup", html.includes('id="quo-list"'));
  check("with its form", html.includes('id="quo-form"'));
  for (const word of ["Materiał", "Robocizna", "Marża", "Suma"]) {
    check(`chapter XXII's "${word}" is readable without a script`, html.includes(word));
  }
  eq("the detail is hidden, because a quote comes out of storage",
    await page.$eval("#quo-detail", (n) => n.hidden), true);
  eq("and nothing is drawn into the list",
    await page.$$eval("#quo-list > li", (li) => li.length), 0);
  check("the footer still names the page for a crawler",
    (await page.$$eval('a[href$="/wyceny/"]', (a) => a.length)) > 0);
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nquotes page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
