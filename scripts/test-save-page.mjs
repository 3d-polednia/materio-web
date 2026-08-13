#!/usr/bin/env node
/**
 * LiczMat — saving a calculation, tested in a real browser.
 *
 *     node scripts/test-save-page.mjs
 *
 * Master plan, session 16, in the half that needs a browser: the whole of
 * "KALKULATOR → WYNIK → DODAJ DO PROJEKTU → PROJEKT" done by clicking, and then the
 * project screen read back to see whether the line can still say where its number came
 * from. Including the case the design exists for: saved in Polish, read in German.
 *
 * The pure-logic half is scripts/test-save.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** Neither a calculator page nor /projekty/ touches the network:
 * both read and write localStorage, which is what lets counting work with no account at
 * all (FIRESTORE_SYNC §1.2). So the test opens the real page, clicks what a visitor
 * clicks, and reads both what was drawn and what ended up in storage.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-save-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlCalc, urlProjects } from "../src/site.mjs";

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
  console.log("test-save-page: Playwright not installed — skipping the browser tests.");
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

const TILES = urlCalc("pl", "waste");
const PROJECTS = urlProjects("pl");
/** /projekty/ in every language: the two page types wait for different marks. */
const PROJECT_PATHS = LANGS.map((l) => urlProjects(l));

/** Open a page, optionally planting the store first. */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  if (opts.plant) {
    await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
    await page.evaluate((entries) => {
      localStorage.clear();
      Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
    }, opts.plant);
  }
  await page.goto(base + url, { waitUntil: "load" });
  // Each page says when it is wired, so a click cannot land on a button nobody listens to.
  await page.waitForSelector(PROJECT_PATHS.some((path) => url.startsWith(path))
    ? "html[data-ws-ready]" : '.calc[data-wired="1"]');
  page.errors = errors;
  return page;
}

const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}"));
const lines = async (page) => (await store(page)).estimations || [];
/** The snapshot, with the flat field map beside it — the two halves of `inputJson`. */
const snapshotOf = (row) => {
  const data = JSON.parse(row.inputJson);
  return { ...data._lm, input: data };
};
const text = (page, sel) => page.$eval(sel, (n) => n.innerText.trim());
const shown = (page, sel) => page.$eval(sel, (n) => !n.hidden && n.offsetParent !== null);

/* ------------------------------------------------------------------ 1. one click */

head("1. a result goes into a project in one click, from a browser with nothing in it");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await open(ctx, TILES, { plant: { "materio-lang": "pl" } });

  eq("with no project yet, there is nothing to pick between",
    await shown(page, "[data-ws-project]"), false);
  eq("and the page says so", await text(page, "[data-ws-note]"), "Brak aktywnego projektu");
  eq("nothing is claimed to be saved before anything is",
    await page.$eval("[data-ws-saved]", (n) => n.hidden), true);

  await page.click("[data-ws-save]");
  const saved = await lines(page);
  eq("one line is saved", saved.length, 1);
  const data = await store(page);
  eq("into a project made for it", data.projects.length, 1);
  eq("named in the page's language", data.projects[0].name, "Mój projekt");
  eq("and the line is in that project", saved[0].projectId, data.projects[0].id);

  // Chapter XV's arrow ends at the project, so the project is a click away.
  eq("the page says where it went", await text(page, "[data-ws-saved]"),
    `Zapisano w projekcie: Mój projekt Otwórz projekt`);
  const href = await page.$eval("[data-ws-saved] a", (a) => a.getAttribute("href"));
  eq("with a link to that project, in this language", href,
    `${PROJECTS}?id=${encodeURIComponent(data.projects[0].id)}`);

  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ 2. the snapshot */

head("2. what the saved line keeps (chapter XV)");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await open(ctx, TILES, { plant: { "materio-lang": "pl" } });

  // A number nobody would get by accident, so the assertions cannot pass by coincidence.
  await page.fill('[data-k="area"]', "43,2");
  await page.fill('[data-k="price"]', "49.90");
  await page.click("[data-run]");
  const onScreen = await text(page, "[data-result] .big");

  await page.click("[data-ws-save]");
  const [row] = await lines(page);
  const snap = snapshotOf(row);

  eq("the line names the calculator that produced it", snap.calc, "waste");
  eq("it keeps what the visitor typed, as it was typed", snap.input.area, "43,2");
  eq("it keeps the unit as a key", snap.unit, "res_pkgs");
  check("it keeps the result rows the panel showed", snap.rows.length === 2, JSON.stringify(snap.rows));
  check("and the moment it was calculated", snap.at > Date.now() - 60000 && snap.at <= Date.now(),
    String(snap.at));
  check("the number kept is the number on screen",
    onScreen.startsWith(String(snap.tobuy)), `${onScreen} vs ${snap.tobuy}`);
  eq("the document keeps the same number", row.requiredUnits, snap.tobuy);

  // Every field carries its dictionary key, not the Polish label that was on screen.
  const keys = snap.fields.map((f) => f.l).join(",");
  eq("every field is stored by key", keys, "fld_area,fld_pkg_cov,fld_waste,fld_price_pkg");

  // A second calculation is a second result: the strip about the first one is stale and
  // must stop claiming this number is saved.
  await page.fill('[data-k="area"]', "10");
  await page.click("[data-run]");
  eq("a new result withdraws the old confirmation",
    await page.$eval("[data-ws-saved]", (n) => n.hidden), true);
  await page.click("[data-ws-save]");
  const both = await lines(page);
  eq("and saves as a second line", both.length, 2);
  eq("with what was typed for it", snapshotOf(both[1]).input.area, "10");

  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ 3. the picker */

head("3. which project — the visitor's answer, not the last one used");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });
  const T0 = Date.UTC(2026, 6, 1);
  const workspace = {
    projects: [
      { id: "p1", name: "Łazienka", archived: false, ...sync(T0 + 2 * 86400e3) },
      { id: "p2", name: "Kuchnia", archived: false, ...sync(T0 + 86400e3) },
      { id: "p3", name: "Garaż", archived: true, ...sync(T0) },
    ],
    rooms: [], estimations: [],
  };
  const page = await open(ctx, TILES, {
    plant: {
      "materio-lang": "pl",
      "materio-workspace-v1": JSON.stringify(workspace),
      "materio-active-project": "p1",
    },
  });

  eq("the picker is there once there is a choice", await shown(page, "[data-ws-project]"), true);
  eq("and the note it replaces is not", await page.$eval("[data-ws-note]", (n) => n.hidden), true);
  const options = await page.$$eval("[data-ws-project] option", (o) => o.map((n) => n.textContent));
  eq("it offers the live projects and a new one", options.join("|"), "Łazienka|Kuchnia|+ Nowy projekt");
  eq("the archived project is not among them", options.includes("Garaż"), false);
  eq("the active project is the one preselected",
    await page.$eval("[data-ws-project]", (s) => s.value), "p1");

  await page.selectOption("[data-ws-project]", "p2");
  await page.click("[data-ws-save]");
  eq("the line lands in the project that was picked", (await lines(page))[0].projectId, "p2");
  eq("and picking it means picking it everywhere",
    await page.evaluate(() => localStorage.getItem("materio-active-project")), "p2");

  // A project that does not exist yet is the common case straight after a first result.
  await page.selectOption("[data-ws-project]", "__new");
  eq("choosing a new project asks for its name", await shown(page, "[data-ws-new]"), true);
  await page.fill("[data-ws-new-name]", "Poddasze");
  await page.click("[data-ws-save]");
  const data = await store(page);
  const made = data.projects.find((p) => p.name === "Poddasze");
  check("the project is made", Boolean(made), data.projects.map((p) => p.name).join(","));
  eq("the line is in it", (await lines(page))[1].projectId, made.id);
  eq("the name field is put away again", await shown(page, "[data-ws-new]"), false);
  eq("and the picker now shows the project the line went into",
    await page.$eval("[data-ws-project]", (s) => s.value), made.id);

  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ 4. read it back */

head("4. the project screen says where the number came from");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const calc = await open(ctx, TILES, { plant: { "materio-lang": "pl" } });
  await calc.fill('[data-k="area"]', "43.2");
  await calc.fill('[data-k="price"]', "49.90");
  await calc.click("[data-run]");
  await calc.click("[data-ws-save]");
  const link = await calc.$eval("[data-ws-saved] a", (a) => a.getAttribute("href"));
  await calc.close();

  const page = await open(ctx, link);
  eq("the project screen is the one showing", await page.$eval("#ws-project", (n) => n.hidden), false);
  eq("the line is on it", (await page.$$("#ws-project-lines > li")).length, 1);
  eq("with the working folded away rather than spread over the list",
    await page.$eval("#ws-project-lines details", (d) => d.open), false);
  eq("and the disclosure says what it holds",
    await text(page, "#ws-project-lines summary"), "Skąd ta liczba");

  await page.click("#ws-project-lines summary");
  const src = await text(page, "#ws-project-lines details");
  check("it names the calculator", src.includes("Płytki, panele, gres"), src);
  check("in this language's labels", src.includes("Powierzchnia (m²)"), src);
  check("with the value that was typed", src.includes("43,2"), src);
  check("it names the result", src.includes("opak."), src);
  check("with the rows the panel showed", src.includes("Odpad"), src);
  check("and when it was calculated", /\d{1,2}:\d{2}/.test(src), src);

  const href = await page.$eval("#ws-project-lines details a", (a) => new URL(a.href).pathname);
  eq("the calculator is a link back to itself", href, TILES);

  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ 5. another language */

head("5. saved in Polish, read in German");
{
  // This is the whole reason the snapshot keeps keys instead of the words on screen.
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const calc = await open(ctx, TILES, { plant: { "materio-lang": "pl" } });
  await calc.fill('[data-k="area"]', "43.2");
  await calc.click("[data-run]");
  await calc.click("[data-ws-save]");
  const id = (await lines(calc))[0].projectId;
  await calc.close();

  const polish = await open(ctx, `${PROJECTS}?id=${encodeURIComponent(id)}`);
  // The switch is done the way a visitor does it, from the picker in the header — which
  // until session 16 dropped the project on the way and landed on the list of projects.
  await polish.click("#lang-toggle");
  const to = await polish.$eval('.lang-item[data-lang="de"]', (a) => a.getAttribute("href"));
  eq("the language link keeps the project in the address", to,
    `${urlProjects("de")}?id=${encodeURIComponent(id)}`);
  await polish.click('.lang-item[data-lang="de"]');
  await polish.waitForURL(`**${urlProjects("de")}?id=${encodeURIComponent(id)}`);
  await polish.waitForSelector("html[data-ws-ready]");
  const page = polish;

  await page.click("#ws-project-lines summary");
  const src = await text(page, "#ws-project-lines details");
  check("the disclosure is in German", src.includes("Woher diese Zahl kommt"), src);
  check("the calculator is named in German", src.includes("Fliesen"), src);
  check("the labels are German", src.includes("Fläche"), src);
  check("the result rows are German", src.includes("Verschnitt"), src);
  check("and the number is written the German way", src.includes("43,2"), src);
  check("nothing is left as a raw key", !/\b(fld_|res_|c_[a-z]+_t)/.test(src), src);
  check("no unsubstituted token is left either", !src.includes("|"), src);

  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ 6. the widths */

head("6. the widths chapter XXVIII names, with the working open");
{
  const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });
  const T0 = Date.UTC(2026, 6, 1);
  const snapshot = {
    v: 1, calc: "waste", at: T0,
    fields: [{ k: "area", l: "fld_area" }, { k: "cov", l: "fld_pkg_cov" },
      { k: "waste", l: "fld_waste" }, { k: "price", l: "fld_price_pkg" }],
    unit: "res_pkgs", tobuy: 15,
    rows: [["res_purchased", "|n:21.6| m²"], ["res_waste", "|n:7|%"]],
  };
  const workspace = {
    projects: [{ id: "p1", name: "Łazienka", archived: false, ...sync(T0) }],
    rooms: [],
    estimations: [{
      id: "e1", projectId: "p1", name: "Gres 60×60", calculationType: "SURFACE_WITH_WASTE",
      materialCategory: "TILES", requiredUnits: 15, unitLabel: "opak.", totalCostMinor: 74985,
      wastePercentage: 7, wasteCostMinor: 5249, currencyCode: "PLN",
      inputJson: JSON.stringify({ area: "21.6", cov: "1.44", waste: "7", price: "49.90", _lm: snapshot }),
      ...sync(T0),
    }],
  };
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const ctx = await context({ viewport: { width, height: 900 } });
    const page = await open(ctx, `${PROJECTS}?id=p1`, {
      plant: { "materio-lang": "pl", "materio-workspace-v1": JSON.stringify(workspace) },
    });
    await page.click("#ws-project-lines summary");
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing runs off the side`, over <= 0, `${over}px over`);
    check(`${width}px: no error in the console`, page.errors.length === 0, page.errors.join("\n      "));
    await page.close();
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ 7. no JavaScript */

head("7. with JavaScript off");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + TILES, { waitUntil: "load" });

  // Saving is a thing this browser cannot do — the store is written by a script — so the
  // button must not be there at all. Chapter XXV: no control with nothing behind it.
  eq("there is no save button to press", (await page.$$("[data-ws-save]")).length, 0);
  // The result the build wrote is still the real answer for the values in the form.
  const big = await page.$eval("[data-result] .big", (n) => n.textContent.trim());
  check("and the result panel still stands", /\d/.test(big), big);
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ report */

await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nsave page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
