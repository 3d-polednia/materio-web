#!/usr/bin/env node
/**
 * LiczMat — /projekty/ and /projekty/?id=<id>, tested in a real browser.
 *
 *     node scripts/test-projects-page.mjs
 *
 * Master plan, session 15 ("CRUD projektów"), in the half that needs a browser: the two
 * screens the one page holds, the four writes done by clicking rather than by calling,
 * the undo the delete offers, the four languages, the currency switch, the widths
 * chapter XXVIII names by hand, and the variant with JavaScript off. The pure-logic half
 * is scripts/test-projects.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** /projekty/ loads no Firebase: it reads and writes localStorage,
 * which is what lets it work without an account at all (FIRESTORE_SYNC §1.2). So the test
 * plants the store, opens the page, clicks what a visitor clicks and reads both what was
 * drawn and what ended up back in storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-projects-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlProjects, urlEstimate } from "../src/site.mjs";

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
  console.log("test-projects-page: Playwright not installed — skipping the browser tests.");
  console.log("                    See the header of this file for the one-line install.");
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
      // Already put aside: it belongs under the archive, not in the list above it.
      { id: "p3", name: "Garaż", archived: true, ...sync(T0 + 2 * DAY) },
      // A tombstone is not a row, on either screen.
      { id: "p4", name: "Skasowany", archived: false, ...sync(T0), deletedAt: T0 + DAY },
    ],
    rooms: [
      { id: "r1", name: "Łazienka", lengthM: 2.4, widthM: 3.2, heightM: 2.5, projectId: "p1", ...sync(T0) },
    ],
    estimations: [
      line("e1", "p1", "Gres 60×60", 15, "opak.", 74985, T0 + 1 * DAY),
      line("e2", "p1", "Klej C2", 6, "worki", 21000, T0 + 2 * DAY),
      line("e3", "p2", "Farba biała", 3, "opak.", 18900, T0 + 3 * DAY),
      // Priced in another currency: the project total must say so rather than add up.
      line("e4", "p2", "Grunt", 1, "opak.", 4500, T0 + 4 * DAY, "EUR"),
      line("e5", "p3", "Płyta GK", 11, "płyt", 33000, T0 + 5 * DAY),
      // A line of the deleted project. It went with it and must stay gone.
      line("e6", "p4", "Nieistotne", 1, "szt.", 100, T0, "PLN"),
    ],
  };
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
 * Open the page with the workspace already in it.
 *
 * @param {object} [opts.workspace] the store, or nothing for a browser that has none
 * @param {string} [opts.active]    the id in `materio-active-project`
 * @param {string} [opts.lang]      the saved language choice
 * @param {string} [opts.currency]  the saved currency choice
 */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  // A request the route above aborted is a console error the page did not cause. Same
  // filter as scripts/test-pages.mjs.
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const plant = { "materio-lang": opts.lang === undefined ? "pl" : opts.lang };
  if (opts.workspace) plant["materio-workspace-v1"] = JSON.stringify(opts.workspace);
  if (opts.active) plant["materio-active-project"] = opts.active;
  if (opts.currency) plant["liczmat-currency"] = opts.currency;

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  // The page says when it is wired, so a click cannot land on a button nobody listens to.
  await page.waitForSelector("html[data-ws-ready]");
  page.errors = errors;
  return page;
}

/* textContent, not innerText: the archive is a folded-away <details>, and innerText is
   empty for anything the browser is not currently rendering. What is on screen is
   asserted separately, by `shown()` and by the widths section. */
const rows = (page, sel) => page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const text = (page, sel) => page.$eval(sel, (n) => n.innerText.trim());
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}"));
const activeId = (page) => page.evaluate(() => localStorage.getItem("materio-active-project"));
const shown = (page, sel) => page.$eval(sel, (n) => !n.hidden && n.offsetParent !== null);

const PROJECTS = urlProjects("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ------------------------------------------------------------------ 1. the index */

head("1. the index, on a browser with nothing in it");
{
  const page = await open(ctx, PROJECTS);
  eq("the heading is the page's own", await text(page, "#ws-title"), "Projekty i pomieszczenia");
  eq("the list says what to do instead of showing nothing", (await rows(page, "#ws-project-list")).length, 1);
  check("and says it as an empty state",
    (await text(page, "#ws-project-list li")).includes("Nie ma jeszcze projektu"));
  eq("an empty archive is not a disclosure with nothing behind it",
    await page.$eval("#ws-archive", (n) => n.hidden), true);
  eq("nothing was deleted, so nothing is offered back",
    await page.$eval("#ws-undo", (n) => n.hidden), true);
  eq("the detail is not showing", await page.$eval("#ws-project", (n) => n.hidden), true);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2. the index, with projects in it");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });
  const list = await rows(page, "#ws-project-list");
  eq("the archived one and the deleted one are not in the list", list.length, 2);
  check("the most recently touched is first", list[0].startsWith("Łazienka"), list[0]);
  check("the deleted project is nowhere on the page",
    !(await page.content()).includes("Skasowany"));

  // Two lines: 749,85 + 210,00 zł.
  // Two of them: "2 pozycje", not the "2 pozycji" this row said until session 16 —
  // the inflection lives in assets/units.js now, where /projekty/ can reach it.
  check("a row says how many lines it holds", /\b2 pozycje\b/.test(list[0]), list[0]);
  check("and what they come to", list[0].replace(/[\s\u00a0\u202f]/g, " ").includes("959,85"), list[0]);
  check("the active project is marked", (await page.$$eval("#ws-project-list li.on b", (b) => b.map((n) => n.textContent)))[0] === "Łazienka");

  // Lines in two currencies do not add up and chapter VI forbids converting them.
  check("a project priced in two currencies is flagged rather than summed",
    await page.$("#ws-project-list li:nth-child(2) .chip.warn") !== null);

  eq("the archive is offered now", await page.$eval("#ws-archive", (n) => n.hidden), false);
  check("and says how many are in it", (await text(page, "#ws-archive-summary")).includes("(1)"),
    await text(page, "#ws-archive-summary"));
  const archived = await rows(page, "#ws-archive-list");
  eq("the archived project is in it", archived.length, 1);
  check("and it is the right one", archived[0].startsWith("Garaż"), archived[0]);

  check("every project name is a real link to its own address",
    (await page.$$eval("#ws-project-list .row-name a, #ws-archive-list .row-name a",
      (a) => a.map((n) => n.getAttribute("href")))).join(",") === "?id=p1,?id=p2,?id=p3");

  check("the rooms of session 20 are still there", (await rows(page, "#ws-room-list")).length === 1);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ 3. create */

head("3. create");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });
  await page.fill("#ws-project-name", "Remont poddasza");
  await page.click("#ws-project-form button[type=submit]");
  const list = await rows(page, "#ws-project-list");
  eq("the new project is listed", list.length, 3);
  check("at the top, as the one just touched", list[0].startsWith("Remont poddasza"), list[0]);
  eq("and it is the active one now", (await store(page)).projects.find((p) => p.name === "Remont poddasza").id,
    await activeId(page));
  eq("the field is cleared for the next one", await page.inputValue("#ws-project-name"), "");

  // required on the input: the browser refuses the submit, so nothing is written.
  await page.click("#ws-project-form button[type=submit]");
  eq("an empty name adds nothing", (await rows(page, "#ws-project-list")).length, 3);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ------------------------------------------------------------------ 4. read */

head("4. one project — chapter XIV");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p2" });
  await page.click('#ws-project-list a[href="?id=p1"]');
  await page.waitForSelector("#ws-project-body:not([hidden])");

  eq("the heading becomes the project", await text(page, "#ws-title"), "Łazienka");
  eq("the index is put away", await page.$eval("#ws-index", (n) => n.hidden), true);
  eq("the breadcrumb ends on the project", await page.$eval(".breadcrumbs li[aria-current]", (n) => n.textContent), "Łazienka");
  check("and the trail above it is clickable again",
    await page.$('.breadcrumbs a[href="' + PROJECTS + '"]') !== null);

  // Chapter XIV asks a project to carry its history; the two stamps the sync contract
  // keeps are the whole of it today.
  const hist = await text(page, "#ws-project-hist");
  check("the history says when it was made and when it last moved",
    hist.includes("Utworzony") && hist.includes("Ostatnia zmiana") && hist.includes("2026"), hist);

  eq("the summary counts its lines", await text(page, "#ws-project-count"), "2");
  check("and totals them", (await text(page, "#ws-project-total")).replace(/ /g, " ").includes("959,85"),
    await text(page, "#ws-project-total"));
  eq("one currency, so no warning", await page.$eval("#ws-project-mixed", (n) => n.hidden), true);

  const lines = await rows(page, "#ws-project-lines");
  eq("the saved lines are listed", lines.length, 2);
  check("with the name, the quantity, the unit and the money",
    lines[0].includes("Gres 60×60") && lines[0].includes("15 opak."), lines[0]);
  check("and no line of another project", !lines.join(" ").includes("Farba"));

  eq("it is not the active project, so the button is offered",
    await page.$eval("#ws-project-activate", (n) => n.hidden), false);
  eq("the archive button offers the archive", await text(page, "#ws-project-archive"), "Przenieś do archiwum");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("5. one project — the empty and the mixed cases");
{
  const page = await open(ctx, PROJECTS + "?id=p2", { workspace: fixture(), active: "p2" });
  eq("the project opens straight from the address", await text(page, "#ws-title"), "Salon");
  eq("it is the active one, so there is nothing to press",
    await page.$eval("#ws-project-activate", (n) => n.hidden), true);
  eq("and it says so", await shown(page, "#ws-project-active"), true);
  eq("two currencies, so the total says it does not mean much",
    await page.$eval("#ws-project-mixed", (n) => n.hidden), false);

  const empty = await open(ctx, PROJECTS + "?id=p3", { workspace: fixture(), active: "p1" });
  eq("an archived project still opens", await text(empty, "#ws-title"), "Garaż");
  eq("and offers the way out of the archive", await text(empty, "#ws-project-archive"), "Przywróć z archiwum");
  eq("an archived project cannot be made active", await empty.$eval("#ws-project-activate", (n) => n.hidden), true);

  // An id nobody has is not an error page: the browser it was made in is the only one
  // that ever had it.
  const missing = await open(ctx, PROJECTS + "?id=nie-ma", { workspace: fixture() });
  eq("an id nobody has says exactly that", await text(missing, "#ws-title"), "Nie ma takiego projektu");
  eq("and shows no project", await missing.$eval("#ws-project-body", (n) => n.hidden), true);
  check("with the way back", await missing.$(`#ws-project a[href="${PROJECTS}"]`) !== null);

  // The tombstoned project is gone, not archived.
  const dead = await open(ctx, PROJECTS + "?id=p4", { workspace: fixture() });
  eq("a deleted project reads as one that is not there", await text(dead, "#ws-title"), "Nie ma takiego projektu");

  for (const pg of [page, empty, missing, dead]) {
    check("no error in the console", pg.errors.length === 0, pg.errors.join("\n      "));
    await pg.close();
  }
}

/* ------------------------------------------------------------------ 6. update */

head("6. update — renaming happens on the page, not in a browser dialog");
{
  const page = await open(ctx, PROJECTS + "?id=p1", { workspace: fixture(), active: "p1" });
  eq("the rename form is closed", await page.$eval("#ws-rename-form", (n) => n.hidden), true);

  await page.click("#ws-project-rename");
  eq("pressing rename opens it", await page.$eval("#ws-rename-form", (n) => n.hidden), false);
  eq("with the name already in it", await page.inputValue("#ws-rename-name"), "Łazienka");
  eq("and the button it replaced put away", await page.$eval("#ws-project-rename", (n) => n.hidden), true);

  await page.click("[data-ws-rename-cancel]");
  eq("cancelling closes it", await page.$eval("#ws-rename-form", (n) => n.hidden), true);
  eq("and changes nothing", await text(page, "#ws-title"), "Łazienka");

  await page.click("#ws-project-rename");
  await page.fill("#ws-rename-name", "  Łazienka na górze  ");
  await page.click("#ws-rename-form button[type=submit]");
  eq("saving renames the project", await text(page, "#ws-title"), "Łazienka na górze");
  eq("the surrounding spaces go", (await store(page)).projects.find((p) => p.id === "p1").name, "Łazienka na górze");
  eq("the form closes", await page.$eval("#ws-rename-form", (n) => n.hidden), true);
  eq("its lines are untouched", (await rows(page, "#ws-project-lines")).length, 2);

  // The rename went into the document the phone reads, and into nothing else.
  const doc = (await store(page)).projects.find((p) => p.id === "p1");
  eq("the document still carries exactly the fields the contract knows",
    Object.keys(doc).sort().join(","), "archived,createdAt,deletedAt,id,name,schemaVersion,updatedAt");

  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("7. update — the archive");
{
  const page = await open(ctx, PROJECTS + "?id=p1", { workspace: fixture(), active: "p1" });
  eq("it starts as the active project", await activeId(page), "p1");

  await page.click("#ws-project-archive");
  eq("the button now offers the way back", await text(page, "#ws-project-archive"), "Przywróć z archiwum");
  eq("the store says archived", (await store(page)).projects.find((p) => p.id === "p1").archived, true);
  // Every new line lands in the active project, so it can never be one just put away.
  eq("and the active project moved to the one still in use", await activeId(page), "p2");

  await page.click(`#ws-project a[href="${PROJECTS}"]`);
  await page.waitForSelector("#ws-index:not([hidden])");
  const list = await rows(page, "#ws-project-list");
  check("it is out of the list above", !list.join(" ").includes("Łazienka"), list.join(" | "));
  const archived = await rows(page, "#ws-archive-list");
  eq("and in the archive with the one that was already there", archived.length, 2);

  // The archive is folded away — it is the finished part of the list. Unfolding it is
  // one press, and taking a project back out is one more, from the row itself.
  eq("the archive is closed until it is asked for", await page.$eval("#ws-archive", (n) => n.open), false);
  await page.click("#ws-archive-summary");
  eq("and opens on the summary", await page.$eval("#ws-archive", (n) => n.open), true);
  await page.click("#ws-archive-list li[data-id='p1'] [data-unarchive]");
  eq("the row is back in the list above", (await rows(page, "#ws-project-list")).length, 2);
  eq("the archive is back to one", (await rows(page, "#ws-archive-list")).length, 1);
  eq("and it did not steal the active flag back", await activeId(page), "p2");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("8. update — making a project the active one");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });
  await page.click("#ws-project-list li[data-id='p2'] [data-activate]");
  eq("the row asked for is the active one", await activeId(page), "p2");
  eq("and it is marked", await page.$eval("#ws-project-list li[data-id='p2']", (n) => n.classList.contains("on")), true);
  eq("the one before it is not", await page.$eval("#ws-project-list li[data-id='p1']", (n) => n.classList.contains("on")), false);
  await page.close();
}

/* ------------------------------------------------------------------ 9. delete */

head("9. delete — asked on the page, and taken back");
{
  const page = await open(ctx, PROJECTS + "?id=p1", { workspace: fixture(), active: "p1" });
  eq("the question is not asked before it is asked for",
    await page.$eval("#ws-delete-ask", (n) => n.hidden), true);

  await page.click("#ws-project-delete");
  eq("pressing delete asks", await page.$eval("#ws-delete-ask", (n) => n.hidden), false);
  eq("in the visitor's own language", await text(page, "#ws-delete-q"), "Usunąć projekt razem z jego pozycjami?");
  await page.click("#ws-delete-no");
  eq("saying no closes the question", await page.$eval("#ws-delete-ask", (n) => n.hidden), true);
  eq("and deletes nothing", (await store(page)).projects.find((p) => p.id === "p1").deletedAt, null);

  await page.click("#ws-project-delete");
  await page.click("#ws-delete-yes");
  await page.waitForSelector("#ws-index:not([hidden])");
  eq("the address goes back to the index without a reload",
    new URL(page.url()).pathname + new URL(page.url()).search, PROJECTS);
  eq("the project is gone from the list", (await rows(page, "#ws-project-list")).length, 1);

  // FIRESTORE_SYNC §3: a delete is a tombstone, so a phone that syncs later is told
  // about the deletion instead of putting the project back.
  const after = await store(page);
  check("the row is still in storage, marked deleted",
    Number.isInteger(after.projects.find((p) => p.id === "p1").deletedAt));
  eq("and so are its two lines",
    after.estimations.filter((e) => e.projectId === "p1" && e.deletedAt).length, 2);
  // A room is a physical place and outlives the project it was measured for.
  eq("the room survives the project", after.rooms.filter((r) => !r.deletedAt).length, 1);
  eq("the active project moved on", await activeId(page), "p2");

  const strip = (await text(page, "#ws-undo")).replace(/\s+/g, " ");
  check("the delete is offered back, by name", strip.startsWith("Projekt usunięty: Łazienka"), strip);

  await page.click("#ws-undo-go");
  eq("undoing puts the project back", (await rows(page, "#ws-project-list")).length, 2);
  const back = await store(page);
  eq("with its lines", back.estimations.filter((e) => e.projectId === "p1" && !e.deletedAt).length, 2);
  eq("the tombstone is cleared", back.projects.find((p) => p.id === "p1").deletedAt, null);
  check("and the strip says so instead of offering the same thing twice",
    (await text(page, "#ws-undo")).includes("Projekt przywrócony"));
  eq("there is nothing left to press", await page.$eval("#ws-undo-go", (n) => n.hidden), true);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("10. delete — the offer is not left lying around");
{
  const page = await open(ctx, PROJECTS + "?id=p2", { workspace: fixture(), active: "p2" });
  await page.click("#ws-project-delete");
  await page.click("#ws-delete-yes");
  await page.waitForSelector("#ws-index:not([hidden])");
  eq("the strip is up", await page.$eval("#ws-undo", (n) => n.hidden), false);

  await page.fill("#ws-project-name", "Coś nowego");
  await page.click("#ws-project-form button[type=submit]");
  eq("starting a new project drops the offer", await page.$eval("#ws-undo", (n) => n.hidden), true);
  eq("and the deleted one stays deleted", (await rows(page, "#ws-project-list")).length, 2);
  await page.close();
}

/* ------------------------------------------------------------------ 11. navigation */

head("11. the two screens are addresses, not tabs");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });
  await page.click('#ws-project-list a[href="?id=p1"]');
  await page.waitForSelector("#ws-project-body:not([hidden])");
  eq("opening a project is an ordinary navigation",
    new URL(page.url()).search, "?id=p1");

  await page.goBack();
  await page.waitForSelector("#ws-index:not([hidden])");
  eq("so the back button returns to the index", new URL(page.url()).search, "");
  eq("and the index is drawn again", (await rows(page, "#ws-project-list")).length, 2);
  eq("the heading is the page's own again", await text(page, "#ws-title"), "Projekty i pomieszczenia");
  eq("and the breadcrumb no longer names a project",
    await page.$eval(".breadcrumbs li[aria-current]", (n) => n.textContent), "Projekty i pomieszczenia");

  await page.goForward();
  await page.waitForSelector("#ws-project-body:not([hidden])");
  eq("forward opens it again", await text(page, "#ws-title"), "Łazienka");

  // /kosztorys/ is about the active project, so the link does both things.
  await page.click("#ws-project-estimate");
  await page.waitForURL(`**${urlEstimate("pl")}`);
  eq("opening the estimate makes this the project it is about", await activeId(page), "p1");
  await page.close();
}

/* ------------------------------------------------------------------ 12. languages */

head("12. four languages");
{
  const WANT = {
    pl: ["Wszystkie projekty", "Kalkulacje", "Archiwum", "Nie ma takiego projektu"],
    en: ["All projects", "Calculations", "Archive", "No such project"],
    de: ["Alle Projekte", "Berechnungen", "Archiv", "Dieses Projekt gibt es nicht"],
    uk: ["Усі проєкти", "Розрахунки", "Архів", "Такого проєкту немає"],
  };
  for (const lang of LANGS) {
    const url = urlProjects(lang);
    const page = await open(ctx, `${url}?id=p1`, { workspace: fixture(), active: "p1", lang });
    const body = await page.innerText("#ws-project");
    check(`${lang}: the way back is translated`, body.includes(WANT[lang][0]), body.slice(0, 120));
    check(`${lang}: so is the section chapter XIV names`, body.includes(WANT[lang][1]));
    check(`${lang}: nothing shows a key instead of a word`, !/\bproj_[a-z_]+/.test(body), body.slice(0, 200));
    // The heading is the project, and a project's name is the visitor's own words.
    eq(`${lang}: the project's own name is left alone`, await text(page, "#ws-title"), "Łazienka");

    const index = await open(ctx, url, { workspace: fixture(), active: "p1", lang });
    check(`${lang}: the archive is translated`, (await text(index, "#ws-archive-summary")).startsWith(WANT[lang][2]),
      await text(index, "#ws-archive-summary"));

    const missing = await open(ctx, `${url}?id=nie-ma`, { workspace: fixture(), lang });
    eq(`${lang}: so is the empty answer`, await text(missing, "#ws-title"), WANT[lang][3]);

    for (const pg of [page, index, missing]) {
      check(`${lang}: no error in the console`, pg.errors.length === 0, pg.errors.join("\n      "));
      await pg.close();
    }
  }
}

/* ------------------------------------------------------------------ 13. currency */

head("13. the currency relabels, it never converts");
{
  const page = await open(ctx, PROJECTS + "?id=p1", { workspace: fixture(), active: "p1", currency: "PLN" });
  const before = (await text(page, "#ws-project-total")).replace(/ /g, " ");
  const qty = (await rows(page, "#ws-project-lines"))[0];

  await page.selectOption("#currency-select", "EUR").catch(() => {});
  const picked = await page.$("#currency-select");
  if (picked) {
    const after = (await text(page, "#ws-project-total")).replace(/ /g, " ");
    // Chapter VI: nothing is converted at a rate, and a saved line keeps the currency it
    // was priced in — so the figures may not move at all.
    check("the amount does not change", after.replace(/[^\d,.]/g, "") === before.replace(/[^\d,.]/g, ""),
      `${before} -> ${after}`);
    eq("and neither does the quantity", (await rows(page, "#ws-project-lines"))[0], qty);
  } else {
    check("the page has a currency picker", false, "no currency picker on /projekty/");
  }
  await page.close();
}

/* ------------------------------------------------------------------ 14. mobile */

head("14. the widths chapter XXVIII names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const c = await context({ viewport: { width, height: 800 } });
    for (const url of [PROJECTS, PROJECTS + "?id=p1"]) {
      const page = await open(c, url, { workspace: fixture(), active: "p2" });
      const over = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${width}px ${url === PROJECTS ? "index" : "detail"}: nothing runs off the side`,
        over <= 1, `${over}px wider than the viewport`);
      check(`${width}px ${url === PROJECTS ? "index" : "detail"}: no error in the console`,
        page.errors.length === 0, page.errors.join("\n      "));
      await page.close();
    }
    await c.close();
  }
}

/* ------------------------------------------------------------------ 15. no script */

head("15. with JavaScript off");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + PROJECTS, { waitUntil: "load" });

  // Everything on both screens comes out of localStorage, so without a script there is
  // nothing to show — and the page says where the data lives instead of pretending.
  eq("the page still has its heading", await text(page, "#ws-title"), "Projekty i pomieszczenia");
  check("and says where the data is kept",
    (await page.innerText("main")).includes("localStorage"));
  eq("the detail is not shown to somebody who cannot fill it",
    await page.$eval("#ws-project", (n) => n.hidden), true);

  const hrefs = await page.$$eval(".ws-links a", (a) => a.map((n) => new URL(n.href).pathname));
  check("the way on is real links, not buttons", hrefs.includes(urlEstimate("pl")), hrefs.join(", "));
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nprojects page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
