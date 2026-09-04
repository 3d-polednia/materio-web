#!/usr/bin/env node
/**
 * LiczMat — the whole site on a phone.
 *
 *     node scripts/test-mobile.mjs
 *
 * Master plan, session 32 (MOBILE QA) and chapter XXVIII, which names the widths by hand:
 * 320, 375, 390, 430, tablet, desktop. The per-module browser tests each check their own
 * screen at those widths; this is the sweep across all of them at once, and it is the one
 * test that asks the questions chapter XXVIII asks instead of the questions a module asks:
 *
 *   1. no page scrolls sideways — every page type, every one of the ten languages,
 *   2. the same with the modules full of data: projects, materials, costs, rooms, the
 *      estimate, the dashboard and the four Pro screens,
 *   3. every control a finger has to hit is at least 44 px tall,
 *   4. every field is at least 16 px of text (under that, iOS Safari zooms the page the
 *      moment it is touched) and at least 44 px tall,
 *   5. a table scrolls inside its own box and never takes the page with it,
 *   6. a number is typed on a numeric keypad: `inputmode="decimal"`, never `type="number"`,
 *   7. the three switches chapter XXXII names — language, currency, theme — work at 320 px,
 *   8. and a calculation can actually be made on a 320 px screen.
 *
 * What it found the first time it ran is in the report for session 32; the short version
 * is that a Romanian button label pushed the page 103 px sideways, nine controls in the
 * Pro modules were 13 px text in a 19 px box, the estimate table took the page with it,
 * and the header row did not fit a signed-in Russian visitor below about 1050 px.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-mobile.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  LANGS, urlHome, urlCalc, urlCalcIndex, urlConverter, urlGuideIndex, urlStores, urlMaterials,
  urlProjects, urlEstimate, urlClients, urlJobs, urlQuotes, urlCalendar,
  urlLiczmatPro, urlCookies, urlAndroid, urlGuide, GUIDES,
} from "../src/site.mjs";

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
  console.log("test-mobile: Playwright not installed — skipping the browser tests.");
  console.log("             See the header of this file for the one-line install.");
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

/** A project with everything chapter XXVIII names in it: rooms, materials, costs. */
const workspace = () => ({
  projects: [
    { id: "p1", name: "Remont łazienki", archived: false, ...sync(T0 + 5 * DAY) },
    { id: "p2", name: "Salon", archived: false, ...sync(T0 + 3 * DAY) },
  ],
  rooms: [{
    id: "r1", projectId: "p1", name: "Łazienka na poddaszu",
    lengthCm: 320, widthCm: 240, heightCm: 250, ...sync(T0),
  }],
  estimations: [
    {
      id: "e1", projectId: "p1", name: "Gres 60×60", calculationType: "SURFACE_COVERAGE",
      materialCategory: "TILES", requiredUnits: 15, unitLabel: "opak.",
      totalCostMinor: 74985, wastePercentage: 0, wasteCostMinor: 0, currencyCode: "PLN",
      inputJson: JSON.stringify({ area: "21.6" }), ...sync(T0 + DAY),
    },
    {
      id: "e2", projectId: "p1", name: "Wywóz gruzu", calculationType: "SURFACE_COVERAGE",
      materialCategory: "OTHER", requiredUnits: 1, unitLabel: "usł.",
      totalCostMinor: 120000, wastePercentage: 0, wasteCostMinor: 0, currencyCode: "PLN",
      inputJson: JSON.stringify({ manual: true }), ...sync(T0 + 2 * DAY),
    },
  ],
  shoppingItems: [{
    id: "s1", projectId: "p1", name: "Gres 60×60", quantity: 26.4, unitLabel: "m²",
    materialCategory: "Płytki", estimatedCostMinor: 74985, currencyCode: "PLN",
    isPurchased: false, note: "", ...sync(T0 + DAY),
  }],
});

/** Chapter XXIV's chain, whole, so every Pro screen has something to draw. */
const crm = () => ({
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
    labour: [{ id: "l1", name: "Układanie gresu", quantity: 20, unit: "m²", amountMinor: 160000 }],
    marginPct: 15, note: "", currencyCode: "PLN", ...sync(T0 + 6 * DAY),
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

/**
 * Is this a phone? 560px is the breakpoint assets/styles.css calls one, and it is where
 * the design system's mouse sizes stop applying. Chapter XXVIII's four phone widths
 * (320, 375, 390, 430) are all under it and its two other widths are over it.
 */
const phone = (page) => page.viewportSize().width <= 560;

/** Nothing on this site may reach the network, and a phone test least of all. */
async function context(width, height = 780) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

/** Which flag a screen raises when its script has finished drawing. */
function readyFor(url) {
  if (/\/(projekty|proekty|projekte|projects|proiecte|projekti)\//.test(url)) return "html[data-ws-ready]";
  if (/\/(klienci|kliienty|kunden|clients|klienti|clienti|klijenti|klijenty)\//.test(url)) return "html[data-crm-ready]";
  if (/\/(zlecenia|zamovlennya|auftraege|jobs|zakazky|lucrari|poslovi|zakazy)\//.test(url)) return "html[data-jobs-ready]";
  if (/\/(wyceny|koshtorysy|angebote|quotes|nabidky|ponuky|oferte|ponude|smety)\//.test(url)) return "html[data-quotes-ready]";
  if (/\/(terminarz|hrafik|termine|schedule|kalendar|calendar|raspored|rozvrh)\//.test(url)) return "html[data-schedule-ready]";
  return null;
}

/**
 * A page, with a store planted before it loads.
 *
 * The plant happens on /404.html, which is on the same origin and loads nothing: a
 * localStorage written after the page has already read it is a store the page never saw.
 */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const plant = { "materio-lang": opts.lang || "pl" };
  if (opts.workspace) plant["materio-workspace-v1"] = JSON.stringify(workspace());
  if (opts.crm) plant["liczmat-crm-v1"] = JSON.stringify(crm());
  if (opts.active) plant["materio-active-project"] = opts.active;
  if (opts.level) plant["liczmat-signed-in"] = opts.level;
  if (opts.currency) plant["liczmat-currency"] = opts.currency;

  await page.goto(`${base}/404.html`, { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  const ready = opts.ready === undefined ? readyFor(url) : opts.ready;
  if (ready) await page.waitForSelector(ready, { timeout: 15000 });
  else await page.waitForTimeout(220);
  return page;
}

/**
 * What a phone screen is asked. One evaluate per page, because a round trip per element
 * would make a sweep of 200 pages take longer than anybody will wait for.
 *
 * `overflow` is the whole question of "does it scroll sideways"; `culprits` is the answer
 * to "what made it", so a failure names the element instead of a number.
 */
const AUDIT = (phone) => {
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  const w = de.clientWidth;
  const seen = (el) => {
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };
  const name = (el) => {
    const cls = String(el.getAttribute("class") || "").split(" ").filter(Boolean).slice(0, 2).join(".");
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls ? `.${cls}` : ""}`;
  };

  const culprits = [];
  if (overflow > 0) {
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      // An element parked off the left edge (the skip link) is not what widens a page.
      if (b.width === 0 || b.left < -100) continue;
      if (b.right > w + 0.5) culprits.push(`${name(el)} +${Math.round(b.right - w)}px`);
    }
  }

  /* A field: 16 px of text and a 44 px box. Under 16 px iOS Safari zooms the page on
     focus and the visitor has to pinch back out to see the form they are filling in. */
  const fields = [];
  for (const el of phone ? document.querySelectorAll("input, select, textarea") : []) {
    if (!seen(el) || el.type === "checkbox" || el.type === "radio") continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const box = el.getBoundingClientRect().height;
    if (size < 15.9 || box < 43.5) fields.push(`${name(el)} ${size}px text in a ${Math.round(box)}px box`);
  }

  /* A tap target: 44 px, the number the token block itself declares. Anything a finger
     lands on counts — a button, a link that looks like one, a chip, a disclosure. */
  const taps = [];
  for (const el of phone ? document.querySelectorAll("button, a.btn, a.chip, summary, .chip") : []) {
    if (!seen(el)) continue;
    // A chip that reports rather than offers is a label with a border, not a target.
    if (getComputedStyle(el).cursor === "default") continue;
    const box = el.getBoundingClientRect().height;
    if (box < 43.5) taps.push(`${name(el)} ${Math.round(box)}px "${(el.textContent || "").trim().slice(0, 24)}"`);
  }

  /* A table is wider than a phone by nature; it scrolls inside its own box. */
  const tables = [];
  for (const t of document.querySelectorAll("table")) {
    if (!seen(t)) continue;
    const box = getComputedStyle(t.parentElement).overflowX;
    if (box !== "auto" && box !== "scroll") tables.push(`${name(t)} in ${name(t.parentElement)}`);
  }

  /* A number is typed on a numeric keypad. `type="number"` is not it: it brings spinners
     nobody can hit and refuses the comma half of Europe types a decimal with. */
  const keypad = [];
  for (const el of document.querySelectorAll("input")) {
    if (!seen(el)) continue;
    if (el.type === "number") keypad.push(`${name(el)} is type="number"`);
  }

  return { phone, overflow, culprits: culprits.slice(0, 6), fields, taps, tables, keypad };
};

/**
 * Every audit a page has to pass, reported as one check each so a failure is legible.
 *
 * The two size rules are asked **on a phone only** (560px and under, the breakpoint
 * assets/styles.css uses), because above it the design system's small sizes are
 * deliberate: 36px for the header's two icon buttons and the two pickers, 40px for
 * .btn-sm in a dense desktop row. Demanding 44px of them at 1280px would not be a mobile
 * test — it would be session 4 rewritten by a session that was asked about phones.
 */
function audit(where, r) {
  check(`${where}: does not scroll sideways`, r.overflow <= 0,
    `overflows by ${r.overflow}px — ${r.culprits.join(" | ")}`);
  check(`${where}: every table scrolls inside its own box`, r.tables.length === 0,
    r.tables.join(" | "));
  check(`${where}: no number is typed on a spinner`, r.keypad.length === 0, r.keypad.join(" | "));
  if (!r.phone) return; // the two size rules below are phone rules; see above
  check(`${where}: every field is 16px text in a 44px box`, r.fields.length === 0,
    r.fields.join(" | "));
  check(`${where}: every tap target is 44px tall`, r.taps.length === 0,
    [...new Set(r.taps)].join(" | "));
}

/* ---------------------------------------------- 1. every page, ten languages, 320 px */

head("1. the tightest width, in every language");
{
  // 320 px is the narrowest phone chapter XXVIII names and the width where a long word
  // decides the layout. Ten languages, because the site is one layout with ten sets of
  // words in it: Romanian and Russian are the ones that do not fit, and neither of them
  // is the language anybody develops in.
  const ctx = await context(320);
  for (const lang of LANGS) {
    const pages = [
      ["home", urlHome(lang)],
      ["the calculator hub", urlCalcIndex(lang)],
      ["a calculator", urlCalc(lang, "waste")],
      ["a cutting calculator", urlCalc(lang, "sheet")],
      ["the converter", urlConverter(lang)],
      ["the guides", urlGuideIndex(lang)],
      ["a guide", urlGuide(lang, GUIDES[0])],
      ["the store finder", urlStores(lang)],
      ["the material catalogue", urlMaterials(lang)],
      ["the Android page", urlAndroid(lang)],
      ["the projects", urlProjects(lang)],
      ["the estimate", urlEstimate(lang)],
      ["the Pro page", urlLiczmatPro(lang)],
      ["the cookies page", urlCookies(lang)],
    ];
    for (const [what, url] of pages) {
      const page = await open(ctx, url, { lang });
      audit(`${lang} ${what} at 320px`, await page.evaluate(AUDIT, phone(page)));
      await page.close();
    }
  }
  await ctx.close();
}

/* ------------------------------------------------- 2. the six widths chapter XXVIII names */

head("2. the six widths, phone to desktop");
{
  // Polish is the language the site is written in and Ukrainian is the widest of the
  // thirteen; between them they bracket what the layout has to survive. It was Russian until
  // 2026-09-02, when that language left — measured again rather than guessed: at 1280 px the
  // header nav is 804 px in Ukrainian, 791 in Dutch and 720 in Polish.
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const ctx = await context(width, width >= 768 ? 900 : 780);
    for (const lang of ["pl", "uk"]) {
      for (const url of [urlHome(lang), urlCalcIndex(lang), urlCalc(lang, "waste"),
        urlConverter(lang), urlMaterials(lang), urlEstimate(lang), urlLiczmatPro(lang)]) {
        const page = await open(ctx, url, { lang });
        audit(`${lang} ${url} at ${width}px`, await page.evaluate(AUDIT, phone(page)));
        await page.close();
      }
    }
    await ctx.close();
  }
}

/* ---------------------------------------------------- 3. the modules, with data in them */

head("3. the modules a phone actually works in");
{
  // Chapter XXVIII lists the screens by name — dashboard, projects, materials, CRM — and
  // every one of them is empty until something is put in it. An empty list fits any width.
  for (const width of [320, 390]) {
    const ctx = await context(width);
    const pro = { workspace: true, crm: true, level: "pro" };
    const screens = [
      ["the projects index", urlProjects("pl"), { workspace: true }],
      ["one project", `${urlProjects("pl")}?id=p1`, { workspace: true }],
      // The estimate raises no ready flag of its own — its rows are what says it drew.
      ["the estimate", urlEstimate("pl"),
        { workspace: true, active: "p1", ready: "#ws-estimate-rows tr" }],
      ["the dashboard", "/app/dashboard/", { workspace: true, ready: "#dash-projects" }],
      /* /app/ is audited as the markup it ships with, not as the signed-in screen: the
         Chromium in the agent container cannot reach gstatic.com, so the Firebase SDK
         never answers and `data-app-ready` never appears (CLAUDE.md). That markup is
         also what a real visitor looks at until the SDK does answer, and the screen
         behind it is scripts/test-account-page.mjs's job, with the SDK stubbed. */
      ["the account", "/app/", { ready: null }],
      ["the clients", urlClients("pl"), pro],
      ["one client", `${urlClients("pl")}?id=c1`, pro],
      ["the jobs", urlJobs("pl"), pro],
      ["one job", `${urlJobs("pl")}?id=j1`, pro],
      ["the quotes", urlQuotes("pl"), pro],
      ["one quote", `${urlQuotes("pl")}?id=q1`, pro],
      ["the terminarz", urlCalendar("pl"), pro],
      ["the wall a guest meets", urlClients("pl"), { workspace: true, crm: true }],
    ];
    for (const [what, url, opts] of screens) {
      const page = await open(ctx, url, opts);
      audit(`${what} at ${width}px`, await page.evaluate(AUDIT, phone(page)));
      await page.close();
    }
    await ctx.close();
  }
}

/* ------------------------------------------------------------- 4. the numeric keypad */

head("4. a number is typed on a numeric keypad");
{
  const ctx = await context(390);

  // A calculator is nothing but numbers, so every field on one is the keypad question.
  const page = await open(ctx, urlCalc("pl", "waste"));
  const calc = await page.$$eval(".calc-form .field input", (els) =>
    els.map((el) => ({ id: el.id, type: el.type, mode: el.getAttribute("inputmode") })));
  check("a calculator has fields to type in", calc.length >= 2, String(calc.length));
  check("every one of them opens the decimal keypad",
    calc.every((f) => f.mode === "decimal" && f.type === "text"),
    JSON.stringify(calc.filter((f) => f.mode !== "decimal" || f.type !== "text")));
  await page.close();

  // And so is every money or quantity field the workspace and the Pro modules put on a
  // row: those are the ones a later session adds one at a time and forgets.
  for (const [what, url, opts] of [
    ["the project", `${urlProjects("pl")}?id=p1`, { workspace: true }],
    ["the estimate", urlEstimate("pl"), { workspace: true }],
    ["a quote", `${urlQuotes("pl")}?id=q1`, { workspace: true, crm: true, level: "pro" }],
  ]) {
    const p = await open(ctx, url, opts);
    const numeric = await p.$$eval("input[inputmode]", (els) =>
      els.map((el) => `${el.id || el.className}:${el.getAttribute("inputmode")}:${el.type}`));
    check(`${what} types its numbers on a keypad`, numeric.length > 0, "no numeric field at all");
    check(`${what} asks for decimals, not a spinner`,
      numeric.every((s) => s.endsWith(":decimal:text")), numeric.filter((s) => !s.endsWith(":decimal:text")).join(" | "));
    await p.close();
  }
  await ctx.close();
}

/* ------------------------------------------------- 5. the three switches, at 320 px */

head("5. language, currency and theme, on a 320px screen");
{
  const ctx = await context(320);

  /* The drawer. Below the header's breakpoint the five links live behind one button, so
     the button is the navigation: if it does not open, nothing else on this list matters. */
  {
    const page = await open(ctx, urlHome("pl"));
    const shut = await page.isVisible("#nav-links");
    check("the drawer starts shut", !shut);
    await page.click("#menu-toggle");
    check("the burger opens it", await page.isVisible("#nav-links"));
    eq("and says so", await page.getAttribute("#menu-toggle", "aria-expanded"), "true");
    const links = await page.$$eval("#nav-links .nav-list li a", (a) => a.length);
    check("with every header link inside it", links >= 4, String(links));
    audit("the open drawer at 320px", await page.evaluate(AUDIT, phone(page)));

    /* The language menu is inside the drawer here, and it is the one place on the site
       that has to show ten of anything on a 320 px screen. */
    await page.click("#lang-toggle");
    // Ten entries, nine of them links: the language being read is a span with
    // aria-current, because a link to the page you are on is not a way anywhere.
    eq("the language menu offers all ten",
      await page.$$eval("#lang-menu .lang-item", (n) => n.length), LANGS.length);
    eq("nine of them are ways out of this one",
      await page.$$eval("#lang-menu a[hreflang]", (n) => n.length), LANGS.length - 1);
    eq("each with a flag beside its name",
      await page.$$eval("#lang-menu .lang-item .flag svg", (n) => n.length), LANGS.length);
    const off = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll("#lang-menu a")]
        .filter((a) => { const b = a.getBoundingClientRect(); return b.right > w + 0.5 || b.left < -0.5; }).length;
    });
    eq("and none of the ten hangs off the screen", off, 0);

    await Promise.all([
      page.waitForURL(`**${urlHome("de")}`),
      page.click(`#lang-menu a[hreflang="de"]`),
    ]);
    eq("picking one lands on that language's own URL",
      new URL(page.url()).pathname, urlHome("de"));
    await page.close();
  }

  /* The currency. It is a select inside the drawer at this width, and it is a separate
     axis from the language (chapter VI): Polski + EUR is a setting somebody may want. */
  {
    const page = await open(ctx, urlLiczmatPro("pl"));
    const before = (await page.innerText("[data-pw-price]")).trim();
    check("the Pro page quotes a price", /\d/.test(before), before);
    await page.click("#menu-toggle");
    await page.selectOption("#currency-select", "EUR");
    await page.waitForFunction((was) => {
      const el = document.querySelector("[data-pw-price]");
      return el && el.textContent.trim() !== was;
    }, before);
    const after = (await page.innerText("[data-pw-price]")).trim();
    check("switching the currency changes what the page asks for", after !== before,
      `${before} → ${after}`);
    eq("and the language does not move with it", await page.getAttribute("html", "lang"), "pl");
    audit("the Pro page after a currency switch at 320px", await page.evaluate(AUDIT, phone(page)));
    await page.close();

    /* And what it must NOT change: an estimate line keeps the currency it was saved
       with (chapter VI). Switching the selector is a choice about what to quote next,
       not a conversion of money that has already been written down.

       At the Pro level, because since 2026-09-03 there is no money on this screen at any
       other one: `costs` is PRO, and a guest gets chapter XXV's wall where the figures
       were. What is being asked here is what happens to an amount the page prints, so the
       page has to be printing one. */
    const proj = await open(ctx, `${urlProjects("pl")}?id=p1`,
      { workspace: true, currency: "EUR", level: "pro" });
    const money = await proj.innerText("#ws-project");
    check("a line saved in złoty still reads in złoty under EUR",
      money.includes("zł") || /PLN/.test(money), money.slice(0, 200));
    audit("the project read under another currency at 320px", await proj.evaluate(AUDIT, phone(proj)));
    await proj.close();
  }

  /* The theme. One button, outside the drawer on purpose, and the choice has to survive
     the next page load or it is a light that turns itself back on. */
  {
    const page = await open(ctx, urlHome("pl"));
    const first = await page.getAttribute("html", "data-theme");
    await page.click("#theme-toggle");
    const second = await page.getAttribute("html", "data-theme");
    check("the theme switch changes the theme", second && second !== first, `${first} → ${second}`);
    check("and writes the choice down",
      (await page.evaluate(() => localStorage.getItem("liczmat-theme"))) === second);
    await page.reload({ waitUntil: "load" });
    eq("which is still in force on the next page", await page.getAttribute("html", "data-theme"), second);
    audit(`the ${second} theme at 320px`, await page.evaluate(AUDIT, phone(page)));
    await page.close();
  }
  await ctx.close();
}

/* ------------------------------------------------- 6. a calculation, on a 320px screen */

head("6. a calculation on the narrowest phone there is");
{
  const ctx = await context(320);
  const page = await open(ctx, urlCalc("pl", "waste"));
  await page.waitForSelector('.calc[data-wired="1"]');

  const fields = await page.$$(".calc-form .field input");
  check("the form has fields to fill in", fields.length > 0);
  await fields[0].fill("21,6");
  const before = await page.innerText(".calc-out [data-result]");
  await page.click("[data-run]");
  await page.waitForFunction((was) => {
    const out = document.querySelector(".calc-out [data-result]");
    return out && out.innerText.trim() !== was;
  }, before);

  const out = await page.evaluate(() => {
    const el = document.querySelector(".calc-out");
    const b = el.getBoundingClientRect();
    return { text: el.innerText.trim().slice(0, 200), left: b.left, right: b.right,
      w: document.documentElement.clientWidth };
  });
  check("a result comes back", out.text.length > 20, out.text);
  check("and the whole of it is on the screen",
    out.left >= -0.5 && out.right <= out.w + 0.5, `${out.left}..${out.right} of ${out.w}`);
  audit("the calculator with a result at 320px", await page.evaluate(AUDIT, phone(page)));

  // Chapter XVI's arrow starts here, and on a phone it is the box under the result.
  check("the way into a project is offered under the result",
    await page.isVisible("[data-calc-actions] [data-ws-save-box]"));

  /* The material picker is a dialog over the page, and a dialog is the one thing on a
     phone that can be wider than the phone without the page underneath admitting it:
     the audit reads the whole document, so an overlay off the side shows up here. */
  await page.click("[data-mat-open]");
  await page.waitForSelector(".mat-dialog");
  check("the material picker opens over the calculator", await page.isVisible(".mat-dialog"));
  audit("the material picker at 320px", await page.evaluate(AUDIT, phone(page)));
  const dlg = await page.evaluate(() => {
    const d = document.querySelector(".mat-dialog");
    const b = d.getBoundingClientRect();
    return { left: b.left, right: b.right, w: document.documentElement.clientWidth };
  });
  check("and fits the screen it opened on",
    dlg.left >= -0.5 && dlg.right <= dlg.w + 0.5, `${dlg.left}..${dlg.right} of ${dlg.w}`);
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ the verdict */

await browser.close();
server.close();

if (failures.length) {
  console.log(`\nmobile: ${passed}/${passed + failures.length} checks pass\n`);
  console.log(`${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`mobile: ${passed}/${passed} checks pass`);
