#!/usr/bin/env node
/**
 * LiczMat — /app/pulpit/, the dashboard, tested in a real browser.
 *
 *     node scripts/test-dashboard-page.mjs
 *
 * Master plan, session 14, in the half that needs a browser: the four lists drawn from a
 * planted localStorage, the level strip, the language switch, the currency switch and the
 * widths chapter XXVIII names by hand — 320, 375, 390, 430, tablet, desktop. The
 * pure-logic half is scripts/test-dashboard.mjs and needs nothing installed.
 *
 * **Nothing is stubbed here.** Unlike scripts/test-account-page.mjs, this page never
 * loads Firebase: it reads the workspace and the recents out of localStorage, which is
 * exactly what makes it openable at the speed of a calculator. So the test plants the
 * store, opens the page and reads what it drew.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-dashboard-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { urlCalc, urlCalcIndex, urlEstimate, urlProjects } from "../src/site.mjs";

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
  console.log("test-dashboard-page: Playwright not installed — skipping the browser tests.");
  console.log("                     See the header of this file for the one-line install.");
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
const T0 = Date.UTC(2026, 6, 1); // a fixed clock: the page prints dates, the test reads them

/** A workspace in the shape assets/workspace.js keeps — the Firestore document shape. */
function fixture() {
  const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });
  const line = (id, projectId, name, units, unit, minor, at, currencyCode = "PLN") => ({
    id, projectId, name, calculationType: "SURFACE_COVERAGE", materialCategory: "OTHER",
    requiredUnits: units, unitLabel: unit, totalCostMinor: minor, wastePercentage: 0,
    wasteCostMinor: 0, currencyCode, inputJson: "{}", ...sync(at),
  });
  return {
    projects: [
      { id: "p1", name: "Łazienka", archived: false, ...sync(T0 + 5 * DAY) },
      { id: "p2", name: "Salon", archived: false, ...sync(T0 + 3 * DAY) },
      { id: "p3", name: "Garaż", archived: false, ...sync(T0 + 2 * DAY) },
      { id: "p4", name: "Poddasze", archived: false, ...sync(T0 + 1 * DAY) },
      { id: "p5", name: "Piwnica", archived: false, ...sync(T0) },
      // A deleted project is a tombstone, not a row: it must not reach the dashboard.
      { id: "p6", name: "Skasowany", archived: false, ...sync(T0), deletedAt: T0 + DAY },
    ],
    rooms: [],
    estimations: [
      line("e1", "p1", "Gres 60×60", 15, "opak.", 74985, T0 + 1 * DAY),
      line("e2", "p1", "Klej C2", 6, "worki", 21000, T0 + 2 * DAY),
      line("e3", "p2", "Farba biała", 3, "opak.", 18900, T0 + 3 * DAY),
      line("e4", "p2", "Grunt", 1, "opak.", 4500, T0 + 4 * DAY),
      line("e5", "p3", "Płyta GK", 11, "płyt", 33000, T0 + 5 * DAY),
      line("e6", "p3", "Profil CW", 8, "szt.", 9600, T0 + 6 * DAY),
      line("e7", "p4", "Styropian", 20, "opak.", 60000, T0 + 7 * DAY),
    ],
  };
}

const RECENTS = [
  { id: "waste", at: T0 + 6 * DAY },
  { id: "grout", at: T0 + 5 * DAY },
  { id: "coverage", at: T0 + 4 * DAY },
  { id: "mortar", at: T0 + 3 * DAY },
  { id: "ceiling", at: T0 + 2 * DAY },
];

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

/** A context that cannot leave the machine: the analytics tag is not under test. */
async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

/**
 * Open a page with the workspace already in it.
 *
 * The dashboard has no per-language URL and picks its language from the saved choice,
 * else from navigator.language — Chromium here reports en-US, so the choice is planted or
 * this file would assert English copy on the page the owner reads in Polish.
 *
 * @param {object} [opts.workspace] the store, or null for a browser that has none
 * @param {object[]} [opts.recents] the used-tools list
 * @param {object} [opts.storage]  anything else to plant
 * @param {string} [opts.lang]     the saved language choice
 */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  // The analytics tag is aborted by the route above, and a blocked request is a console
  // error the page did not cause. Same filter as scripts/test-pages.mjs.
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const plant = { "materio-lang": opts.lang === undefined ? "pl" : opts.lang, ...(opts.storage || {}) };
  if (opts.workspace) plant["materio-workspace-v1"] = JSON.stringify(opts.workspace);
  if (opts.recents) plant["liczmat-recent-calcs"] = JSON.stringify(opts.recents);

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  page.errors = errors;
  return page;
}

const rows = (page, sel) => page.$$eval(`${sel} > li`, (li) => li.map((n) => n.innerText.trim()));
const text = (page, sel) => page.$eval(sel, (n) => n.innerText.trim());

const DASH = "/app/pulpit/";
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ------------------------------------------------------------------ 1. a guest */

head("1. a browser with nothing in it");
{
  const page = await open(ctx, DASH);
  eq("the level strip says guest", await text(page, "#dash-level"), "Gość");
  eq("the sign-up card is offered", await page.$eval("#dash-signup", (n) => n.hidden), false);

  for (const [id, what] of [["projects", "projekty"], ["recent", "kalkulacje"], ["tools", "narzędzia"]]) {
    const list = await rows(page, `#dash-${id}`);
    eq(`${what}: one row`, list.length, 1);
    check(`${what}: and it says what to do instead of showing nothing`,
      await page.$(`#dash-${id} [data-dash-empty]`) !== null);
  }
  eq("nothing to forget, so no button to forget it",
    await page.$eval("#dash-tools-forget", (n) => n.hidden), true);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ 2. the lists */

head("2. projekty");
{
  const page = await open(ctx, DASH, { workspace: fixture(), recents: RECENTS });
  const list = await rows(page, "#dash-projects");
  eq("a shortlist, not all five", list.length, 4);
  check("the most recently touched project is first", list[0].startsWith("Łazienka"), list[0]);
  check("a deleted project is not on it", !list.join("\n").includes("Skasowany"));
  check("the oldest one is left for the \"all projects\" link",
    !list.join("\n").includes("Piwnica"));

  // The count and the total are the project's own, counted from its lines.
  check("Łazienka shows its two lines", /2 pozycji/.test(list[0]), list[0]);
  check("and their total", /959,85/.test(list[0]), list[0]);
  eq("the link beside the heading goes to all of them",
    await page.$eval('#dash-projects-h ~ a, .dash-head [data-dash-url="projects"]', (a) => new URL(a.href).pathname),
    urlProjects("pl"));
  await page.close();
}

head("3. ostatnie kalkulacje");
{
  const page = await open(ctx, DASH, { workspace: fixture(), recents: RECENTS });
  const list = await rows(page, "#dash-recent");
  eq("five lines at most", list.length, 5);
  check("newest first", list[0].startsWith("Styropian"), list[0]);
  check("each says which project it is in", /Poddasze/.test(list[0]), list[0]);
  check("with the quantity and its unit", /20 opak\./.test(list[0]), list[0]);
  check("and what it cost", /600,00/.test(list[0]), list[0]);
  check("the oldest line is off the end", !list.join("\n").includes("Gres 60×60"));
  await page.close();
}

head("4. ostatnio używane narzędzia");
{
  const page = await open(ctx, DASH, { workspace: fixture(), recents: RECENTS });
  const list = await rows(page, "#dash-tools");
  eq("four tiles at most", list.length, 4);
  check("the last one used is first", list[0].includes("Płytki"), list[0]);
  const hrefs = await page.$$eval("#dash-tools a", (a) => a.map((n) => new URL(n.href).pathname));
  eq("the tile opens that calculator", hrefs[0], urlCalc("pl", "waste"));
  eq("and the next one", hrefs[1], urlCalc("pl", "grout"));
  check("every tile carries the icon the hub gives it",
    await page.$$eval("#dash-tools a svg", (s) => s.length) >= 4);

  // An id from an older version of the site has no page and no name.
  const page2 = await open(ctx, DASH, {
    recents: [{ id: "nosuchcalc", at: T0 }, { id: "waste", at: T0 - DAY }],
  });
  const list2 = await rows(page2, "#dash-tools");
  eq("a calculator that no longer exists is dropped, not rendered dead", list2.length, 1);
  check("and the real one survives", list2[0].includes("Płytki"), list2[0]);
  await page2.close();
  await page.close();
}

head("5. the visitor can delete their own history of tools");
{
  const page = await open(ctx, DASH, { recents: RECENTS });
  eq("there is something to forget", await page.$eval("#dash-tools-forget", (n) => n.hidden), false);
  await page.click("#dash-tools-forget");
  check("the list goes back to its empty state",
    await page.$("#dash-tools [data-dash-empty]") !== null);
  eq("the key is gone from storage",
    await page.evaluate(() => localStorage.getItem("liczmat-recent-calcs")), null);
  eq("and the button with it", await page.$eval("#dash-tools-forget", (n) => n.hidden), true);
  check("the projects are untouched — it is one list, not the workspace",
    await page.evaluate(() => localStorage.getItem("materio-workspace-v1")) === null);
  await page.close();
}

/* ------------------------------------------------------------------ 6. the session */

head("6. the level strip reads the hint, and gates nothing on it");
{
  const signed = await open(ctx, DASH, {
    workspace: fixture(), storage: { "liczmat-signed-in": "liczmat" },
  });
  eq("signed in, the chip names the level", await text(signed, "#dash-level"), "LiczMat");
  eq("and the sign-up card is gone", await signed.$eval("#dash-signup", (n) => n.hidden), true);
  eq("the projects are still there", (await rows(signed, "#dash-projects")).length, 4);
  await signed.close();

  const pro = await open(ctx, DASH, { storage: { "liczmat-signed-in": "pro" } });
  eq("Pro says Pro", await text(pro, "#dash-level"), "LiczMat Pro");
  await pro.close();

  // The hint can be stale — signed out in another tab, an expired token. Somebody's own
  // local projects must never be hidden because of it.
  const stale = await open(ctx, DASH, {
    workspace: fixture(), storage: { "liczmat-signed-in": "admin" },
  });
  eq("a value nobody writes reads as a guest", await text(stale, "#dash-level"), "Gość");
  eq("and the projects are still shown", (await rows(stale, "#dash-projects")).length, 4);
  await stale.close();
}

/* ------------------------------------------------------------------ 7. language */

head("7. switching language redraws everything JavaScript wrote");
{
  const page = await open(ctx, DASH, { workspace: fixture(), recents: RECENTS });
  eq("it opens in Polish", await text(page, "#dash-projects-h"), "Projekty");

  await page.click("#lang-toggle");
  await page.click('#lang-menu [data-lang="de"]');
  await page.waitForFunction(() => document.documentElement.lang === "de");

  eq("the headings follow", await text(page, "#dash-tools-h"), "Zuletzt benutzte Werkzeuge");
  eq("so does the level strip", await text(page, "#dash-level"), "Gast");
  const list = await rows(page, "#dash-projects");
  // A row drawn once and left alone would still say "2 pozycji" here.
  check("and so do the rows the script drew", /2 Zeilen/.test(list[0]), list[0]);
  check("including their dates", /Jul|Juli/.test(list[0]), list[0]);

  const tool = await page.$eval("#dash-tools a", (a) => new URL(a.href).pathname);
  eq("a tool tile points at the German calculator", tool, urlCalc("de", "waste"));
  const quick = await page.$eval('[data-dash-url="calculators"]', (a) => new URL(a.href).pathname);
  eq("and a quick action at the German hub", quick, urlCalcIndex("de"));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("8. a saved line keeps the currency it was priced in");
{
  // Chapter VI: nothing is ever converted at an exchange rate. A line stamped PLN stays
  // PLN after the visitor switches to EUR — relabelling it would silently restate
  // 600 złotych as 600 euro, which is the one thing a saved quote must never do.
  const page = await open(ctx, DASH, { workspace: fixture() });
  const before = (await rows(page, "#dash-recent"))[0];
  check("the line opens in the złoty it was saved in", /zł|PLN/.test(before), before);

  // selectOption dispatches `change`, assets/currency.js dispatches `currencychange` in
  // that handler and assets/dashboard.js redraws inside it, so the lists are already
  // rebuilt by the time this resolves — there is nothing to wait for.
  await page.selectOption("#currency-select", "EUR");
  const after = (await rows(page, "#dash-recent"))[0];
  check("switching the currency does not restate it", /zł|PLN/.test(after), after);
  check("the quantity does not move either", /20 opak\./.test(after), after);
  check("and neither does the amount", /600,00/.test(after), after);
  await page.close();

  // A project whose lines were priced in two currencies cannot be added up. The row says
  // so instead of printing a sum that means nothing.
  const ws = fixture();
  ws.estimations[1].currencyCode = "EUR";
  const mixed = await open(ctx, DASH, { workspace: ws });
  const row = (await rows(mixed, "#dash-projects"))[0];
  check("the mixed project is marked", /różne waluty/.test(row), row);
  const plain = (await rows(mixed, "#dash-projects"))[1];
  check("and a project in one currency is not", !/różne waluty/.test(plain), plain);
  await mixed.close();
}

/* ------------------------------------------------------------------ 9. the way out */

head("9. opening a project takes the visitor to it");
{
  const page = await open(ctx, DASH, { workspace: fixture(), storage: { "materio-active-project": "p2" } });
  const list = await rows(page, "#dash-projects");
  check("the active project is marked", list[1].includes("Aktywny"), list[1]);

  await Promise.all([
    page.waitForURL(`**${urlEstimate("pl")}`),
    page.click('#dash-projects li[data-id="p1"] [data-open]'),
  ]);
  eq("opening another one lands on the estimate", new URL(page.url()).pathname, urlEstimate("pl"));
  eq("and that project is the one the estimate is about",
    await page.evaluate(() => localStorage.getItem("materio-active-project")), "p1");
  eq("which is what the page shows", await text(page, "#ws-estimate-title"), "Łazienka");
  await page.close();
}

head("10. there are ways in that are not the address bar");
{
  // /app/ and the dashboard carry the minimal footer — one line, no site map — so the
  // footer link is checked where it actually renders: on a public page.
  const home = await open(ctx, "/");
  const foot = await home.$$eval('footer a[href="/app/pulpit/"]', (a) => a.map((n) => n.textContent.trim()));
  eq("the footer's account column has it, on every public page", foot.length, 1);
  eq("under its own name", foot[0], "Pulpit");
  await home.close();

  const app = await open(ctx, "/app/");
  check("and the account page carries a link to it",
    await app.$('#app-workspace a[href="/app/pulpit/"]') !== null);
  await app.close();
}

/* ------------------------------------------------------------------ 11. the tool list */

head("11. a calculator records itself when the visitor asks for a number");
{
  const page = await open(ctx, urlCalc("pl", "grout"));
  await page.waitForSelector('.calc[data-wired="1"]');
  eq("opening a calculator records nothing",
    await page.evaluate(() => localStorage.getItem("liczmat-recent-calcs")), null);

  await page.click(".calc[data-calc] [data-run]");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-recent-calcs") || "[]"));
  eq("pressing Oblicz records it", stored.length, 1);
  eq("as the calculator it is", stored[0].id, "grout");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();

  // …and the dashboard is the page that shows it. Same browser profile is not available
  // across contexts, so the store is carried over by hand.
  const dash = await open(ctx, DASH, { recents: stored });
  const list = await rows(dash, "#dash-tools");
  eq("and the dashboard lists it", list.length, 1);
  check("by name", list[0].includes("Fuga"), list[0]);
  await dash.close();
}

/* ------------------------------------------------------------------ 12. mobile */

head("12. the widths chapter XXVIII names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const small = await context({ viewport: { width, height: 800 } });
    const page = await open(small, DASH, { workspace: fixture(), recents: RECENTS });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing sticks out sideways`, over <= 0, `${over}px of overflow`);
    check(`${width}px: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    // The one thing a dashboard on a phone must not do is bury the lists under the frame.
    const quickTop = await page.$eval("#dash-quick-h", (n) => n.getBoundingClientRect().top);
    check(`${width}px: the quick actions are above the fold`, quickTop < 800, `${Math.round(quickTop)}px`);
    await page.close();
    await small.close();
  }
}

head("13. with JavaScript off the page is still a way somewhere");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + DASH, { waitUntil: "load" });
  const hrefs = await page.$$eval("[data-dash-url]", (a) => a.map((n) => new URL(n.href).pathname));
  eq("every quick action and every \"see all\" link is a real address", hrefs.length, 6);
  check("the calculator hub among them", hrefs.includes(urlCalcIndex("pl")));
  check("the projects too", hrefs.includes(urlProjects("pl")));
  check("and the estimate", hrefs.includes(urlEstimate("pl")));
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\ndashboard page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
