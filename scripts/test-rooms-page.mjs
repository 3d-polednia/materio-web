#!/usr/bin/env node
/**
 * LiczMat — rooms, in a real browser.
 *
 *     node scripts/test-rooms-page.mjs
 *
 * Master plan, session 20, in the half that needs a browser: chapter XVIII clicked through
 * — a room added to a project and corrected in place, its dimensions turned into floor,
 * walls and volume, a calculator filled from it, a result filed under it, and the same
 * result moved to another room and taken out of all of them — plus the four languages, the
 * currency switch, the widths chapter XXVIII names and the no-script variant. The pure
 * logic half is scripts/test-rooms.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** /projekty/ and the calculators touch no network: the projects,
 * the rooms and the saved lines are localStorage in the Firestore document shape, and they
 * get there without an account (FIRESTORE_SYNC §1.2). So the test opens the real pages,
 * clicks what a visitor clicks, and reads both what was drawn and what went into storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-rooms-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlProjects, urlCalc } from "../src/site.mjs";

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
  console.log("test-rooms-page: Playwright not installed — skipping the browser tests.");
  console.log("                 See the header of this file for the one-line install.");
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

/**
 * Chapter XVIII's own example: the project "Remont łazienki", the room "Łazienka" and the
 * dimensions 2,4 × 3,2 × 2,5 m — plus a second room in the same project, a room in another
 * project, and one calculation already filed under the first room.
 */
function fixture() {
  const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });
  const room = (id, projectId, name, L, W, H, at) => ({
    id, projectId, name, lengthM: L, widthM: W, heightM: H, ...sync(at),
  });
  const line = (id, projectId, name, units, unit, minor, at, inputJson = "{}") => ({
    id, projectId, name, calculationType: "SURFACE_COVERAGE", materialCategory: "TILES",
    requiredUnits: units, unitLabel: unit, totalCostMinor: minor, wastePercentage: 0,
    wasteCostMinor: 0, currencyCode: "PLN", inputJson, ...sync(at),
  });
  return {
    projects: [
      { id: "p1", name: "Remont łazienki", archived: false, ...sync(T0 + 5 * DAY) },
      { id: "p2", name: "Salon", archived: false, ...sync(T0 + 3 * DAY) },
    ],
    rooms: [
      room("r1", "p1", "Łazienka", 2.4, 3.2, 2.5, T0 + 1 * DAY),
      room("r2", "p1", "Przedpokój", 1.4, 4, 2.5, T0 + 2 * DAY),
      room("r3", "p2", "Salon", 5, 4.2, 2.7, T0 + 3 * DAY),
      // A room nobody assigned — what a room pulled off the phone looks like, because
      // SyncContract.roomToDoc() has no projectId to send.
      room("r4", null, "Garaż", 6, 3, 2.4, T0 + 4 * DAY),
    ],
    estimations: [
      line("e1", "p1", "Gres 60×60", 15, "opak.", 74985, T0 + 1 * DAY,
        JSON.stringify({ area: "7.68", _room: "r1" })),
      line("e2", "p1", "Klej C2 25 kg", 7, "worków", 21000, T0 + 2 * DAY,
        JSON.stringify({ area: "7.68" })),
    ],
    shoppingItems: [],
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
  if (opts.active) plant["materio-active-project"] = opts.active;
  if (opts.currency) plant["liczmat-currency"] = opts.currency;

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  if (opts.ready !== false) await page.waitForSelector(opts.ready || "html[data-ws-ready]");
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}"));
const roomsOf = async (page) => ((await store(page)).rooms || []).filter((r) => !r.deletedAt);
/** The room one saved line is filed under, read out of `inputJson` the way the page does. */
async function lineRoom(page, id) {
  const data = await store(page);
  const row = (data.estimations || []).find((e) => e.id === id);
  try { return JSON.parse(row.inputJson)._room || ""; } catch (e) { return ""; }
}
/** Digits only: an area is written differently in four languages, the number is not. */
const digits = (s) => String(s).replace(/\D/g, "");

const PROJECTS = urlProjects("pl");
const ROOMS = "#ws-project-rooms";
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the rooms of a project */

head("1. chapter XVIII's room stands on the project it belongs to");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  const list = await rows(page, ROOMS);
  eq("the project shows its two rooms and nothing else", list.length, 2);
  check("the chapter's own room is there", list.some((r) => r.includes("Łazienka")), list.join(" | "));
  check("and the second one", list.some((r) => r.includes("Przedpokój")), list.join(" | "));
  check("another project's room is not", !list.join(" ").includes("Salon"), list.join(" | "));
  check("nor the one nobody assigned", !list.join(" ").includes("Garaż"), list.join(" | "));

  // "Wymiary: 2,4 × 3,2 × 2,5 m" — the chapter's line, in the chapter's order.
  const bath = list.find((r) => r.includes("Łazienka"));
  check("the dimensions read as the chapter writes them", /2,4\s*×\s*3,2\s*×\s*2,5\s*m/.test(bath), bath);
  // 2,4 × 3,2 = 7,68 m² of floor; 2 × (2,4 + 3,2) × 2,5 = 28 m² of walls; 19,2 m³.
  check("the floor is worked out from them", bath.includes("7,68"), bath);
  check("so are the walls", bath.includes("28"), bath);
  check("and the volume", bath.includes("19,2"), bath);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. a project with no rooms says how one gets there");
{
  const ws = fixture();
  ws.rooms = ws.rooms.filter((r) => r.projectId !== "p1");
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: ws, active: "p1" });
  const list = await rows(page, ROOMS);
  eq("one row, and it is the empty state", list.length, 1);
  check("which says what to do about it", /Dodaj|dodaj/.test(list[0]), list[0]);
  await page.close();
}

/* ---------------------------------------------------- 2. adding and correcting */

head("2. a room is added to the project that is open");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click("#ws-room-add > summary");
  await page.fill("#ws-proj-room-name", "Kuchnia");
  await page.fill("#ws-proj-room-length", "3");
  await page.fill("#ws-proj-room-width", "4,2");
  await page.fill("#ws-proj-room-height", "2,6");

  // The running line under the fields, before anything is saved.
  const sum = (await page.textContent("#ws-proj-room-form [data-room-sum]")).replace(/\s+/g, " ");
  check("the three numbers are added up while they are typed", sum.includes("12,6"), sum);

  await page.click("#ws-proj-room-form button[type=submit]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#ws-project-rooms > li").length === 3);

  const saved = (await roomsOf(page)).find((r) => r.name === "Kuchnia");
  check("the room went into storage", Boolean(saved));
  eq("under the project that was open", saved.projectId, "p1");
  eq("with the length that was typed", saved.lengthM, 3);
  // A comma is the decimal separator in every language this site speaks.
  eq("and a comma read as a decimal point", saved.widthM, 4.2);
  eq("and the height", saved.heightM, 2.6);
  eq("the contract's sync fields are on it", typeof saved.schemaVersion, "number");

  // The name goes because it is about one room; the dimensions stay because the next room
  // in the same flat is usually a small edit away from this one.
  eq("the name field is cleared", await page.inputValue("#ws-proj-room-name"), "");
  eq("the dimensions are not", await page.inputValue("#ws-proj-room-width"), "4,2");

  await page.fill("#ws-proj-room-name", "   ");
  await page.click("#ws-proj-room-form button[type=submit]");
  eq("a room with no name is not added",
    (await page.$$eval("#ws-project-rooms > li", (li) => li.length)), 3);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2b. a room is corrected in the row it belongs to, not in a browser dialog");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  // Session 15 took prompt() and confirm() out of this file, and rooms did not bring them
  // back: a browser dialog cannot be styled, cannot be reached by the page's own
  // translation once it is open, and on a phone covers the thing being changed. The source
  // is checked in scripts/test-projects.mjs; this is the same claim from the outside — if
  // one opened, Playwright would report it here.
  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push(d.type()); d.dismiss(); });

  await page.click(`${ROOMS} li[data-id="r1"] [data-edit]`);
  await page.waitForSelector(`${ROOMS} li[data-id="r1"] form[data-room-edit]`);
  eq("only one row opens", await page.$$eval(`${ROOMS} form[data-room-edit]`, (f) => f.length), 1);
  eq("the form starts on the room's own name",
    await page.inputValue(`${ROOMS} [data-f="name"]`), "Łazienka");
  eq("and its own height", await page.inputValue(`${ROOMS} [data-f="heightM"]`), "2.5");

  await page.fill(`${ROOMS} [data-f="name"]`, "Łazienka na górze");
  await page.fill(`${ROOMS} [data-f="lengthM"]`, "2,6");
  const sum = (await page.textContent(`${ROOMS} [data-room-sum]`)).replace(/\s+/g, " ");
  check("the figures follow what is being typed", sum.includes("8,32"), sum);

  await page.click(`${ROOMS} button[type=submit]`);
  await page.waitForSelector(`${ROOMS} form[data-room-edit]`, { state: "detached" });
  const saved = (await roomsOf(page)).find((r) => r.id === "r1");
  eq("the name changed in storage", saved.name, "Łazienka na górze");
  eq("and the length", saved.lengthM, 2.6);
  eq("the project it belongs to is untouched", saved.projectId, "p1");
  const list = await rows(page, ROOMS);
  const row = list.find((r) => r.includes("Łazienka"));
  check("and the row redrew from what was written", row.includes("8,32"), row);

  // Abandoning an edit changes nothing.
  await page.click(`${ROOMS} li[data-id="r2"] [data-edit]`);
  await page.fill(`${ROOMS} [data-f="name"]`, "cokolwiek");
  await page.click(`${ROOMS} [data-cancel]`);
  await page.waitForSelector(`${ROOMS} form[data-room-edit]`, { state: "detached" });
  eq("the abandoned edit wrote nothing",
    (await roomsOf(page)).find((r) => r.id === "r2").name, "Przedpokój");
  eq("and no browser dialog was opened along the way", dialogs.join(","), "");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2c. a room is taken off the project, and the calculations stay");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  await page.click(`${ROOMS} li[data-id="r2"] [data-del]`);
  await page.waitForFunction(() =>
    document.querySelectorAll("#ws-project-rooms > li").length === 1);

  const data = await store(page);
  const stone = data.rooms.find((r) => r.id === "r2");
  check("the row is still in storage", Boolean(stone));
  check("carrying a deletedAt, so a sync can pass the deletion on", Boolean(stone.deletedAt));
  eq("the calculations are untouched", (data.estimations || []).filter((e) => !e.deletedAt).length, 2);
  eq("including the one filed under the other room", await lineRoom(page, "e1"), "r1");
  await page.close();
}

/* ---------------------------------------------------- 3. the assignment */

head("3. a calculation is filed under a room, moved, and taken out of all of them");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  const sel = '#ws-project-lines li[data-id="e1"] [data-line-room]';
  eq("the line the fixture filed shows its room", await page.inputValue(sel), "r1");
  eq("the line nobody filed shows none",
    await page.inputValue('#ws-project-lines li[data-id="e2"] [data-line-room]'), "");

  // Only the project's own rooms are on offer — a room belongs to a project.
  const options = await page.$$eval(`${sel} option`, (o) => o.map((e) => e.textContent.trim()));
  eq("the picker offers the two rooms plus no-room", options.length, 3);
  check("and none from another project", !options.join(" ").includes("Salon"), options.join(" | "));
  check("nor the unassigned one", !options.join(" ").includes("Garaż"), options.join(" | "));

  await page.selectOption('#ws-project-lines li[data-id="e2"] [data-line-room]', "r2");
  await page.waitForFunction(() => {
    const row = JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations
      .find((e) => e.id === "e2");
    return JSON.parse(row.inputJson)._room === "r2";
  });
  eq("the second line took the second room", await lineRoom(page, "e2"), "r2");

  await page.selectOption(sel, "r2");
  await page.waitForFunction(() => {
    const row = JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations
      .find((e) => e.id === "e1");
    return JSON.parse(row.inputJson)._room === "r2";
  });
  eq("the first line moved to the other room", await lineRoom(page, "e1"), "r2");
  const data = await store(page);
  const moved = data.estimations.find((e) => e.id === "e1");
  eq("and what was typed into the calculator survived the move",
    JSON.parse(moved.inputJson).area, "7.68");

  await page.selectOption(sel, "");
  await page.waitForFunction(() => {
    const row = JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations
      .find((e) => e.id === "e1");
    return !JSON.parse(row.inputJson)._room;
  });
  eq("and it can be taken out of every room", await lineRoom(page, "e1"), "");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("3b. a project with no rooms shows no picker on its lines");
{
  const ws = fixture();
  ws.rooms = ws.rooms.filter((r) => r.projectId !== "p1");
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: ws, active: "p1" });
  eq("nothing to file a line under, so nothing is offered",
    await page.$$eval("#ws-project-lines [data-line-room]", (n) => n.length), 0);
  check("but the lines are still there",
    (await rows(page, "#ws-project-lines")).join(" ").includes("Gres"));
  await page.close();
}

/* ---------------------------------------------------- 4. the calculator */

head("4. a calculator is filled from a room, and its result filed under it");
{
  const page = await open(ctx, urlCalc("pl", "waste"), {
    workspace: fixture(), active: "p1", ready: ".calc[data-wired=\"1\"]",
  });

  // The room bar the calculators have had all along, now feeding the picker below it.
  await page.waitForSelector("[data-ws-room]");
  await page.selectOption("[data-ws-room]", "r1");
  await page.selectOption("[data-ws-surface]", "floor");
  await page.click("[data-ws-apply]");
  await page.waitForSelector("[data-ws-save-box]");
  eq("the room's floor area landed in the form",
    await page.inputValue('[data-k="area"]'), "7.68");

  const pick = "[data-ws-room-pick]";
  eq("the save box offers the room the form was filled from",
    await page.inputValue(pick), "r1");
  const options = await page.$$eval(`${pick} option`, (o) => o.map((e) => e.textContent.trim()));
  check("with the project's other room beside it",
    options.some((o) => o.includes("Przedpokój")), options.join(" | "));
  check("and no room from another project", !options.join(" ").includes("Salon"), options.join(" | "));

  await page.click("[data-ws-save]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations.length === 3);
  const data = await store(page);
  const saved = data.estimations[data.estimations.length - 1];
  eq("the saved line went into the open project", saved.projectId, "p1");
  eq("and named the room", JSON.parse(saved.inputJson)._room, "r1");
  // Session 16's snapshot is still there, untouched by the room beside it.
  check("with the snapshot that says where the number came from",
    Boolean(JSON.parse(saved.inputJson)._lm));

  const said = (await page.textContent("[data-ws-saved]")).replace(/\s+/g, " ");
  check("and the confirmation names the project", said.includes("Remont łazienki"), said);
  check("and the room", said.includes("Łazienka"), said);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("4b. the room picked can be changed, and a project with no rooms offers none");
{
  const page = await open(ctx, urlCalc("pl", "waste"), {
    workspace: fixture(), active: "p1", ready: ".calc[data-wired=\"1\"]",
  });
  await page.fill('[data-k="area"]', "12");
  await page.click("[data-run]");
  await page.waitForSelector("[data-ws-save-box]");

  await page.selectOption("[data-ws-room-pick]", "r2");
  await page.click("[data-ws-save]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations.length === 3);
  let data = await store(page);
  eq("the result went into the room that was chosen",
    JSON.parse(data.estimations[2].inputJson)._room, "r2");

  // Another project is another set of rooms, and the one chosen a moment ago is not in it.
  await page.selectOption("[data-ws-project]", "p2");
  await page.waitForFunction(() => {
    const sel = document.querySelector("[data-ws-room-pick]");
    return sel && [...sel.options].some((o) => o.textContent.includes("Salon"));
  });
  eq("the room chosen for the other project is not carried across",
    await page.inputValue("[data-ws-room-pick]"), "");
  const options = await page.$$eval("[data-ws-room-pick] option", (o) => o.map((e) => e.textContent.trim()));
  check("the picker now offers this project's rooms", options.some((o) => o.includes("Salon")),
    options.join(" | "));
  check("and not the ones it left behind", !options.join(" ").includes("Przedpokój"),
    options.join(" | "));

  await page.click("[data-ws-save]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations.length === 4);
  data = await store(page);
  const last = data.estimations[3];
  eq("the line went into the other project", last.projectId, "p2");
  eq("and carries no room, because none was picked for it",
    JSON.parse(last.inputJson)._room, undefined);
  await page.close();
}

head("4c. a project with no rooms offers no picker at all");
{
  const ws = fixture();
  // Chapter XXV: no control with nothing behind it. A dropdown whose only entry is
  // "no room" is exactly that.
  ws.rooms = ws.rooms.filter((r) => r.projectId !== "p1");
  const page = await open(ctx, urlCalc("pl", "waste"), {
    workspace: ws, active: "p1", ready: ".calc[data-wired=\"1\"]",
  });
  await page.fill('[data-k="area"]', "12");
  await page.click("[data-run]");
  await page.waitForSelector("[data-ws-save-box]");
  eq("the room picker is not offered",
    await page.$eval("[data-ws-room-pick]", (n) => n.hidden), true);

  await page.click("[data-ws-save]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations.length === 3);
  const data = await store(page);
  eq("and the line is saved without one", JSON.parse(data.estimations[2].inputJson)._room, undefined);
  const said = (await page.textContent("[data-ws-saved]")).replace(/\s+/g, " ");
  check("the confirmation names the project and stops there",
    said.includes("Remont łazienki") && !said.includes("·"), said);
  await page.close();
}

/* ---------------------------------------------------- 5. the index */

head("5. the index says which project each room belongs to");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });
  const list = await rows(page, "#ws-room-list");
  eq("every room is on the index, assigned or not", list.length, 4);

  // The name column, not the whole row: the row also carries the picker that moves the
  // room, and every project's name is an option inside it.
  const named = (id) => page.$eval(`#ws-room-list li[data-id="${id}"] .row-name`,
    (n) => n.textContent.replace(/\s+/g, " ").trim());
  const bath = await named("r1");
  check("a room says the project it belongs to", bath.includes("Remont łazienki"), bath);
  const garage = await named("r4");
  check("a room with no project says nothing instead of guessing",
    !garage.includes("Remont łazienki") && !garage.includes("Salon"), garage);
  check("and the dimensions are still on the row", /6\s*×\s*3\s*×\s*2,4\s*m/.test(garage), garage);

  const href = await page.$eval('#ws-room-list li[data-id="r1"] a.ws-room-of',
    (a) => a.getAttribute("href"));
  eq("the project on a room row opens that project", href, "?id=p1");
  eq("and a room with no project has no such link",
    await page.$$eval('#ws-room-list li[data-id="r4"] a.ws-room-of', (a) => a.length), 0);
  await page.close();
}

/* -------------------------------- 5c. picking the project (fixes after session 20) */

head("5c. the project a room goes into is chosen, not guessed");
{
  const page = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });

  // Until the owner reported it, this form filed the room into whichever project happened
  // to be active and said nothing about it — so it looked like a room could not be
  // assigned at all.
  const picker = "#ws-room-project";
  eq("the form starts on the active project", await page.inputValue(picker), "p1");
  const options = await page.$$eval(`${picker} option`, (o) => o.map((e) => e.textContent.trim()));
  eq("it offers both projects and 'no project'", options.length, 3);
  check("including a real 'no project' answer", options[0].includes("bez projektu"), options.join(" | "));

  await page.selectOption(picker, "p2");
  await page.fill("#ws-room-name", "Sypialnia");
  await page.fill("#ws-room-length", "4");
  await page.fill("#ws-room-width", "3,5");
  await page.click("#ws-room-form button[type=submit]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).rooms.some((r) => r.name === "Sypialnia"));
  let saved = (await roomsOf(page)).find((r) => r.name === "Sypialnia");
  eq("the room went into the project that was picked", saved.projectId, "p2");
  eq("not the active one", await page.evaluate(() => localStorage.getItem("materio-active-project")), "p1");
  eq("with a comma read as a decimal point", saved.widthM, 3.5);

  // "No project" is an answer, not a missing one.
  await page.selectOption(picker, "");
  await page.fill("#ws-room-name", "Strych");
  await page.click("#ws-room-form button[type=submit]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).rooms.some((r) => r.name === "Strych"));
  eq("a room can be made with no project at all",
    (await roomsOf(page)).find((r) => r.name === "Strych").projectId, null);

  // And an existing room can be moved, from the row it is on.
  await page.selectOption('#ws-room-list li[data-id="r4"] [data-room-project]', "p1");
  await page.waitForFunction(() =>
    (JSON.parse(localStorage.getItem("materio-workspace-v1")).rooms
      .find((r) => r.id === "r4") || {}).projectId === "p1");
  saved = (await roomsOf(page)).find((r) => r.id === "r4");
  eq("the unassigned room was adopted", saved.projectId, "p1");
  await page.selectOption('#ws-room-list li[data-id="r4"] [data-room-project]', "");
  await page.waitForFunction(() =>
    !(JSON.parse(localStorage.getItem("materio-workspace-v1")).rooms
      .find((r) => r.id === "r4") || {}).projectId);
  eq("and can be taken back out of every project",
    (await roomsOf(page)).find((r) => r.id === "r4").projectId, null);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("5d. with no project at all, the form stops asking");
{
  const ws = fixture();
  ws.projects = [];
  ws.estimations = [];
  const page = await open(ctx, PROJECTS, { workspace: ws, active: "" });
  eq("the picker is not offered", await page.$eval("#ws-room-project", (n) => n.hidden), true);
  eq("nor is one on any row",
    await page.$$eval("#ws-room-list [data-room-project]", (n) => n.length), 0);
  // The form still works — a room with no project is still a room.
  await page.fill("#ws-room-name", "Garaż 2");
  await page.click("#ws-room-form button[type=submit]");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).rooms.some((r) => r.name === "Garaż 2"));
  eq("and the room is saved with no project",
    (await roomsOf(page)).find((r) => r.name === "Garaż 2").projectId, null);
  await page.close();
}

/* ------------------------- 5e. the "Projekty" link (fixes after session 20) */

head("5e. the Projekty link is offered to an account and shipped to everybody");
{
  const guest = await open(ctx, PROJECTS, { workspace: fixture(), active: "p1" });
  const item = '.site .nav-list li[data-nav-level="liczmat"]';
  eq("the item is in the markup for a guest too",
    await guest.$$eval(item, (n) => n.length), 1);
  eq("but it is not shown", await guest.$eval(item, (n) => getComputedStyle(n).display), "none");
  eq("and nothing stamped a level on the document",
    await guest.evaluate(() => document.documentElement.hasAttribute("data-lm-level")), false);
  // The page itself is not gated by any of this — that is the whole point of the split.
  check("the projects are on screen all the same",
    (await rows(guest, "#ws-project-list")).join(" ").includes("Remont łazienki"));
  await guest.close();

  const member = await ctx.newPage();
  await member.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await member.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("materio-lang", "pl");
    localStorage.setItem("liczmat-signed-in", "liczmat");
  });
  await member.goto(base + PROJECTS, { waitUntil: "load" });
  await member.waitForSelector("html[data-ws-ready]");
  eq("a signed-in browser is stamped before the first paint",
    await member.evaluate(() => document.documentElement.getAttribute("data-lm-level")), "liczmat");
  check("and the link is shown",
    (await member.$eval(item, (n) => getComputedStyle(n).display)) !== "none");
  // The value the key held before session 13 still reads as signed in.
  await member.evaluate(() => localStorage.setItem("liczmat-signed-in", "1"));
  await member.reload({ waitUntil: "load" });
  await member.waitForSelector("html[data-ws-ready]");
  check('the old "1" still counts as signed in',
    (await member.$eval(item, (n) => getComputedStyle(n).display)) !== "none");
  await member.close();

  // The stamp has to come from the script in <head>, not from assets/account.js at the end
  // of <body> — otherwise a signed-in visitor watches the link appear. Blocking that file
  // is the only way to tell the two apart from out here.
  const noAccountJs = await ctx.newPage();
  await noAccountJs.route("**/assets/account.js*", (r) => r.abort());
  await noAccountJs.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await noAccountJs.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("materio-lang", "pl");
    localStorage.setItem("liczmat-signed-in", "liczmat");
  });
  await noAccountJs.goto(base + PROJECTS, { waitUntil: "domcontentloaded" });
  eq("the head script stamps the level on its own",
    await noAccountJs.evaluate(() => document.documentElement.getAttribute("data-lm-level")), "liczmat");
  check("so the link is right from the first paint",
    (await noAccountJs.$eval(item, (n) => getComputedStyle(n).display)) !== "none");
  await noAccountJs.close();

  // No script: no `.js` on <html>, so the rule never fires. That is Googlebot's view, and
  // it is why /projekty/ keeps its place in the index and in sitemap.xml.
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const plain = await noJs.newPage();
  await plain.goto(base + PROJECTS, { waitUntil: "load" });
  check("without a script the link is visible",
    (await plain.$eval(item, (n) => getComputedStyle(n).display)) !== "none");
  await plain.close();
  await noJs.close();
}

head("5b. a room whose project was deleted keeps the room and drops the name");
{
  const ws = fixture();
  ws.projects[0].deletedAt = T0 + 6 * DAY;
  const page = await open(ctx, PROJECTS, { workspace: ws, active: "" });
  const list = await rows(page, "#ws-room-list");
  eq("the rooms survived the project", list.length, 4);
  const bath = list.find((r) => r.includes("Łazienka"));
  check("but the project's name is not printed from a tombstone",
    !bath.includes("Remont łazienki"), bath);
  await page.close();
}

/* ---------------------------------------------------- 6. four languages */

head("6. the rooms read in all four languages");
{
  for (const lang of LANGS) {
    const page = await open(ctx, `${urlProjects(lang)}?id=p1`, {
      workspace: fixture(), active: "p1", lang,
    });
    const list = await rows(page, ROOMS);
    eq(`${lang}: the two rooms are drawn`, list.length, 2);
    const bath = list.find((r) => r.includes("Łazienka"));
    // The name is the visitor's own words and never translates — the same rule an estimate
    // line and a material get. The figures beside it are numbers in the local notation.
    check(`${lang}: the room keeps the name it was given`, Boolean(bath), list.join(" | "));
    check(`${lang}: the floor area is there`, digits(bath).includes("768"), bath);
    check(`${lang}: no raw key on the row`, !/\b(room_floor|ws_surface_walls|proj_room_[a-z]+)\b/.test(bath), bath);
    const body = await page.innerText("#ws-project-body");
    check(`${lang}: no raw key anywhere on the screen`,
      !/\b(proj_room_[a-z]+|ws_room_no|ws_room)\b/.test(body));
    check(`${lang}: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    await page.close();
  }
}

head("6b. switching language on an open project keeps the project and its rooms");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });
  // The switch is done the way a visitor does it, from the picker in the header.
  await page.click("#lang-toggle");
  await page.click('.lang-item[data-lang="de"]');
  await page.waitForURL(`**${urlProjects("de")}?id=p1`);
  await page.waitForSelector("html[data-ws-ready]");
  eq("the German page is the same project", await page.url(),
    `${base}${urlProjects("de")}?id=p1`);
  const list = await rows(page, ROOMS);
  eq("with the same two rooms", list.length, 2);
  check("and the same dimensions", list.join(" ").includes("2,4"), list.join(" | "));
  await page.close();
}

/* ---------------------------------------------------- 7. the currency */

head("7. switching currency does not touch a dimension");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, {
    workspace: fixture(), active: "p1", currency: "PLN",
  });
  const before = await rows(page, ROOMS);
  await page.selectOption("#currency-select", "EUR");
  await page.waitForFunction(() => localStorage.getItem("liczmat-currency") === "EUR");
  const after = await rows(page, ROOMS);
  eq("the rooms read exactly as they did", after.join(" | "), before.join(" | "));
  const saved = await roomsOf(page);
  eq("and nothing was rewritten in storage", saved.find((r) => r.id === "r1").lengthM, 2.4);
  await page.close();
}

/* ---------------------------------------------------- 8. the widths */

head("8. the widths chapter XXVIII names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const small = await context({ viewport: { width, height: 900 } });
    const page = await open(small, `${PROJECTS}?id=p1`, { workspace: fixture(), active: "p1" });

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: the page does not scroll sideways`, overflow <= 1, `overflow ${overflow}px`);

    const box = await page.$eval(`${ROOMS} li`, (n) => {
      const r = n.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    check(`${width}px: the room row is on screen`, box.left >= -1 && box.right <= width + 1,
      JSON.stringify(box));

    // The edit form has to be usable at the narrowest width the plan names.
    await page.click(`${ROOMS} li[data-id="r1"] [data-edit]`);
    await page.waitForSelector(`${ROOMS} form[data-room-edit]`);
    const field = await page.$eval(`${ROOMS} [data-f="heightM"]`, (n) => {
      const r = n.getBoundingClientRect();
      return { w: r.width, h: r.height, right: r.right };
    });
    check(`${width}px: the height field is big enough to tap`, field.h >= 32 && field.w >= 40,
      JSON.stringify(field));
    check(`${width}px: and inside the viewport`, field.right <= width + 1, JSON.stringify(field));

    await page.close();
    await small.close();
  }
}

/* ---------------------------------------------------- 9. no JavaScript */

head("9. with the script off, the frame is there and no room is invented");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + `${PROJECTS}?id=p1`, { waitUntil: "load" });

  const html = await page.content();
  check("the rooms section is in the markup", html.includes('id="ws-project-rooms"'));
  check("with its add form", html.includes('id="ws-proj-room-form"'));
  check("and the three dimension fields", html.includes('id="ws-proj-room-height"'));
  check("the index keeps its own rooms form", html.includes('id="ws-room-form"'));
  eq("but the detail is hidden, because the rooms come out of storage",
    await page.$eval("#ws-project", (n) => n.hidden), true);
  eq("and no room is drawn", (await page.$$eval("#ws-project-rooms > li", (li) => li.length)), 0);
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nrooms page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
