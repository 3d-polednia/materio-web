#!/usr/bin/env node
/**
 * LiczMat — the CRM chain, in a real browser.
 *
 *     node scripts/test-crm-page.mjs
 *
 * Master plan, session 26 ("CRM — Połączenie: klient → zlecenie → projekt → wycena →
 * historia"), in the half that needs a browser: the path walked by clicking it. A
 * tradesman opens a job, follows it to the client, from the client to the quote their work
 * was priced in, and from the quote back to the job — and every step is a link somebody
 * has to be able to hit. The logic half is scripts/test-crm.mjs and needs nothing
 * installed.
 *
 * **Nothing is stubbed.** The three CRM screens touch no network: the clients, jobs and
 * quotes are localStorage in this browser and the projects are the same local workspace
 * every other page uses. So the test plants a store, opens the real pages and clicks.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-crm-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlQuotes, urlClients, urlProjects } from "../src/site.mjs";

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
  console.log("test-crm-page: Playwright not installed — skipping the browser tests.");
  console.log("               See the header of this file for the one-line install.");
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

const MATERIALS = 74985;
const OTHER = 120000;
const LABOUR = 160000;
const TOTAL = Math.round((MATERIALS + OTHER + LABOUR) * 1.15);

/** Two projects; the first holds a calculation and a hand-typed cost. */
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
      // p1 is what the job used to be: since the merge of 2026-09-21 the client, the
      // status, the deadline and the agreed amount are fields of the project itself.
      {
        id: "p1", name: "Remont łazienki", archived: false,
        clientId: "c1", status: "active", dueDate: "2026-09-30",
        valueMinor: 1250000, currencyCode: "PLN", note: "", color: "",
        ...sync(T0 + 5 * DAY),
      },
      {
        id: "p2", name: "Salon", archived: false,
        clientId: "", status: "new", dueDate: "", valueMinor: null,
        currencyCode: "", note: "", color: "",
        ...sync(T0 + 3 * DAY),
      },
    ],
    rooms: [],
    estimations: [
      line("e1", "p1", "Gres 60×60", 15, "opak.", MATERIALS, T0 + 1 * DAY),
      line("e2", "p1", "Wywóz gruzu", 1, "usł.", OTHER, T0 + 2 * DAY, true),
    ],
    shoppingItems: [],
  };
}

/** Chapter XXIV's chain, whole: one client, one project, one quote. */
const crm = (over = {}) => ({
  clients: [{
    id: "c1", name: "Jan Kowalski", phone: "600 100 200", email: "jan@example.com",
    address: "ul. Piękna 3", note: "", projectIds: ["p1"], archived: false,
    ...sync(T0 + 4 * DAY),
  }],
  quotes: [{
    id: "q1", name: "Łazienka — wycena", projectId: "p1",
    labour: [{ id: "l1", name: "Układanie gresu", quantity: 20, unit: "m²", amountMinor: LABOUR }],
    marginPct: 15, note: "", currencyCode: "PLN", ...sync(T0 + 6 * DAY),
  }],
  ...over,
});

/** The same store with the middle of the chain missing: a project nobody gave a client. */
const crmBare = () => {
  const store = crm();
  store.clients = [{ ...store.clients[0], projectIds: [] }];
  return store;
};

/** The workspace with p1 unlinked, which is what "no client yet" looks like now. */
const workspaceBare = () => {
  const ws = workspace();
  ws.projects = [{ ...ws.projects[0], clientId: "" }, ws.projects[1]];
  return ws;
};

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

/** Which page a URL belongs to, so open() knows which "ready" flag to wait for. */
const readyFor = (url) => {
  // The project page is the middle of the chain since 2026-09-21, and it is the workspace
  // page: its flag is the workspace's, not the CRM store's.
  if (url.includes(urlProjects("pl").slice(0, -1)) || /projekt|proekt|proiect|progett|proyect|projet/.test(url)) {
    return "html[data-ws-ready]";
  }
  return "html[data-crm-ready]";
};

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
  if (opts.ready !== false) await page.waitForSelector(opts.ready || readyFor(url));
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
/** The chain strip as it reads: one entry per step, with its href when it has one. */
const strip = (page, sel) => page.$$eval(`${sel} li`, (li) => li.map((n) => ({
  node: n.getAttribute("data-node"),
  text: n.textContent.replace(/\s+/g, " ").trim(),
  href: n.querySelector("a") ? n.querySelector("a").getAttribute("href") : "",
  on: n.classList.contains("on"),
  off: n.classList.contains("off"),
})));
const digits = (s) => String(s).replace(/\D/g, "");

const PROJECTS = urlProjects("pl");
const CLIENTS = urlClients("pl");
const QUOTES = urlQuotes("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ------------------------------------------------ 1. the strip on a project */

head("1. the strip on a project: chapter XXIV's three steps, in the chapter's order");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: workspace(), crm: crm() });
  const steps = await strip(page, "#ws-chain");
  // Three since the merge of 2026-09-21: the job step and the project step were one row
  // described twice, so they are one step now.
  eq("three steps", steps.length, 3);
  eq("in the chapter's order", steps.map((s) => s.node).join(), "client,project,quote");

  check("the client is a link to their own page",
    steps[0].href === `${CLIENTS}?id=c1`, steps[0].href);
  check("and carries their name", steps[0].text.includes("Jan Kowalski"), steps[0].text);
  check("the project is the step you are standing on", steps[1].on, JSON.stringify(steps[1]));
  eq("so it links nowhere", steps[1].href, "");
  // A project's walk resolves no single quote — a project may carry several, and the
  // walker does not guess between them. The step is the way to the list instead.
  check("the quote step is the way to the quotes", steps[2].off, JSON.stringify(steps[2]));
  eq("which is the quotes page itself", steps[2].href, QUOTES);
  check("every step says which step it is",
    steps.every((s) => s.text.length > 2), JSON.stringify(steps.map((s) => s.text)));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. a step nobody has filled in is the page that would fill it");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`,
    { workspace: workspaceBare(), crm: crmBare() });
  const steps = await strip(page, "#ws-chain");
  check("the client is the step nobody filled in", steps[0].off, JSON.stringify(steps[0]));
  eq("and offers the clients page", steps[0].href, CLIENTS);
  check("the project is still the one you stand on", steps[1].on, JSON.stringify(steps[1]));
  check("the quote is not resolved either", steps[2].off, JSON.stringify(steps[2]));
  eq("no step of the chain pretends to have an id",
    await page.$$eval("#ws-chain a[href*='?id=']", (a) => a.length), 0);
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ---------------------------------------------------- 2. the two lists */

head("2. the quotes of a project, read off the link the quote carries");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: workspace(), crm: crm() });
  const quotes = await rows(page, "#ws-chain-quotes");
  eq("the quote is listed", quotes.length, 1);
  check("by name", quotes[0].includes("Łazienka — wycena"), quotes[0]);
  check("and with what it comes to, computed live",
    digits(quotes[0]).includes(String(TOTAL)), quotes[0]);
  eq("its name opens it", await page.getAttribute("#ws-chain-quotes a", "href"), `${QUOTES}?id=q1`);

  const history = await rows(page, "#ws-chain-history");
  // Still four: the job's own row went with the job, and the project's own creation row
  // took its place. Nothing here is logged — every row is a document that already carries
  // the date it was written on.
  check("the history carries the project, the quote and what was saved into the project",
    history.length === 4, history.join(" | "));
  check("newest first", history[0].includes("Łazienka — wycena"), history.join(" | "));
  check("a calculation is told apart from a cost",
    history.some((r) => r.includes("Zapisano kalkulację"))
    && history.some((r) => r.includes("Dopisano koszt")), history.join(" | "));
  check("and the note says what the history cannot know",
    (await page.textContent("#ws-project-body")).includes("Zmiana statusu"));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("2b. a project nobody has priced has no quotes, and says so");
{
  const page = await open(ctx, `${PROJECTS}?id=p2`, { workspace: workspace(), crm: crm() });
  const quotes = await rows(page, "#ws-chain-quotes");
  eq("one row, and it is the empty state", quotes.length, 1);
  check("which says there is no quote yet", /wyceny|Wycen/i.test(quotes[0]), quotes[0]);
  await page.close();
}

head("2c. the same two lists on the client, from the other end of the chain");
{
  const page = await open(ctx, `${CLIENTS}?id=c1`, { workspace: workspace(), crm: crm() });
  const quotes = await rows(page, "#crm-client-quotes");
  eq("the quote priced from their project is theirs", quotes.length, 1);
  check("with the same total the project's page showed",
    digits(quotes[0]).includes(String(TOTAL)), quotes[0]);

  const history = await rows(page, "#crm-history");
  check("the history has the client, the project, the quote and both saved lines",
    history.length === 5, history.join(" | "));
  check("it starts with the newest", history[0].includes("Łazienka — wycena"), history[0]);
  // The order is the dates on the documents, not the shape of the chain: the fixture's
  // calculations were saved before the client was written down, and the list says so.
  check("the client's own row is in it",
    history.some((r) => r.includes("Dodano klienta")), history.join(" | "));
  check("and the oldest row is the oldest document",
    history[history.length - 1].includes("Gres 60×60"), history[history.length - 1]);
  check("a history row opens what it is about",
    (await page.getAttribute("#crm-history a", "href")).includes("?id="),
    await page.getAttribute("#crm-history a", "href"));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ---------------------------------------------------- 3. the walk, clicked */

head("3. the whole path, clicked: project → client → quote → project");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: workspace(), crm: crm() });

  // PROJEKT → KLIENT
  await page.click("#ws-chain li[data-node='client'] a");
  await page.waitForSelector("html[data-crm-ready]");
  await page.waitForSelector("#crm-client-body:not([hidden])");
  eq("the client opens", (await page.textContent("#crm-title")).trim(), "Jan Kowalski");
  check("and the project is listed under them",
    (await rows(page, "#crm-client-jobs"))[0].includes("Remont łazienki"));

  // KLIENT → WYCENA
  await page.click("#crm-client-quotes a");
  await page.waitForSelector("html[data-quotes-ready]");
  await page.waitForSelector("#quo-body:not([hidden])");
  eq("the quote opens", (await page.textContent("#quo-title")).trim(), "Łazienka — wycena");
  const steps = await strip(page, "#quo-chain-line");
  eq("its strip has the same three steps", steps.length, 3);
  check("the quote is the one you are standing on", steps[2].on, JSON.stringify(steps[2]));
  eq("and the project above it is the one we came from", steps[1].href, `${PROJECTS}?id=p1`);

  // WYCENA → PROJEKT, which closes the loop chapter XXIV draws.
  await page.click("#quo-chain-line li[data-node='project'] a");
  await page.waitForSelector("html[data-ws-ready]");
  await page.waitForSelector("#ws-project-body:not([hidden])");
  eq("the project opens again", (await page.textContent("#ws-title")).trim(), "Remont łazienki");
  check("the browser's Back button still works through all of it",
    page.url().includes("?id=p1"), page.url());
  await page.goBack();
  await page.waitForSelector("html[data-quotes-ready]");
  check("and lands back on the quote", page.url().includes("?id=q1"), page.url());
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("3b. nothing about the walk is written down");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`, { workspace: workspace(), crm: crm() });
  const before = await page.evaluate(() => localStorage.getItem("liczmat-crm-v1"));
  await page.click("#ws-chain li[data-node='client'] a");
  await page.waitForSelector("#crm-client-body:not([hidden])");
  await page.click("#crm-client-quotes a");
  await page.waitForSelector("#quo-body:not([hidden])");
  const after = await page.evaluate(() => localStorage.getItem("liczmat-crm-v1"));
  eq("the store is byte-for-byte what it was", after, before);
  await page.close();
}

/* ---------------------------------------------------- 4. four languages */

head("4. the path reads the same in four languages, and links inside its own");
{
  for (const lang of LANGS) {
    const page = await open(ctx, `${urlProjects(lang)}?id=p1`,
      { workspace: workspace(), crm: crm(), lang, ready: "html[data-ws-ready]" });
    const steps = await strip(page, "#ws-chain");
    eq(`${lang}: three steps`, steps.length, 3);
    check(`${lang}: the client link is this language's address`,
      steps[0].href === `${urlClients(lang)}?id=c1`, steps[0].href);
    check(`${lang}: the project is the step being stood on`, steps[1].on, steps[1].href);
    check(`${lang}: the quotes page too`, steps[2].href === urlQuotes(lang), steps[2].href);
    check(`${lang}: nothing shows a raw dictionary key`,
      !(await page.content()).includes("crm_node_") && !(await page.content()).includes("crm_ev_"),
      lang);
    const history = await rows(page, "#ws-chain-history");
    check(`${lang}: the history is written in it`, history.length === 4, history.join(" | "));
    check(`${lang}: no error in the console`, page.errors.length === 0,
      page.errors.join("\n      "));
    await page.close();
  }
}

head("4b. the currency the visitor chose is the one the derived figures speak");
{
  const page = await open(ctx, `${PROJECTS}?id=p1`,
    { workspace: workspace(), crm: crm(), currency: "EUR" });
  // The quote was stamped PLN when its labour was typed, and chapter VI forbids converting
  // it — so it keeps its own currency here exactly as it does on its own page.
  const quotes = await rows(page, "#ws-chain-quotes");
  check("a quote keeps the currency it was priced in", /zł|PLN/.test(quotes[0]), quotes[0]);
  await page.close();
}

/* ---------------------------------------------------- 5. the widths */

head("5. chapter XXVIII: the strip fits every width the chapter names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const narrow = await context({ viewport: { width, height: 900 } });
    const page = await open(narrow, `${PROJECTS}?id=p1`, { workspace: workspace(), crm: crm() });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: the page does not scroll sideways`, overflow <= 1, `overflow ${overflow}px`);
    const box = await page.$eval("#ws-chain", (n) => {
      const r = n.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    check(`${width}px: the strip stays inside the viewport`,
      box.left >= -1 && box.right <= width + 1, JSON.stringify(box));
    const tap = await page.$$eval("#ws-chain a", (a) =>
      a.map((n) => Math.round(n.getBoundingClientRect().height)));
    check(`${width}px: every step is a real tap target`, tap.every((h) => h >= 14),
      JSON.stringify(tap));
    await page.close();
    await narrow.close();
  }
}

/* ---------------------------------------------------- 6. no JavaScript */

head("6. without a script the chain is empty, and nothing is broken or half-said");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(`${base}${PROJECTS}?id=p1`, { waitUntil: "load" });
  const html = await page.content();
  check("the heading of the history is still readable", html.includes("Historia"));
  check("and the heading of the quotes", html.includes("Wyceny"));
  eq("the strip is drawn empty rather than wrongly",
    await page.$$eval("#ws-chain li", (li) => li.length), 0);
  eq("the detail is hidden, because a project comes out of storage",
    await page.$eval("#ws-project", (n) => n.hidden), true);
  check("no dictionary key leaks into the markup", !html.includes("crm_hist_"));
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\ncrm page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
