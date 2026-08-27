#!/usr/bin/env node
/**
 * LiczMat — the accessibility a file cannot show you: focus, the keyboard, both themes.
 *
 *     node scripts/test-a11y-page.mjs
 *
 * Master plan, session 34 (ACCESSIBILITY): "Dostępność całego produktu. Sprawdzić: oba
 * motywy, selektor języka, selektor waluty, formularze, focus, kontrast, keyboard
 * navigation."
 *
 * scripts/test-a11y.mjs reads the markup; this one drives it. Five of the chapter's seven
 * items only exist while something is running: where the focus goes when the skip link is
 * pressed, whether the ring is visible on the element that has it, whether Escape gets
 * out of the menu it opened, whether the answer to a calculation is announced, whether
 * the screenshots stop when the button says they will. Nothing is stubbed — the pages
 * load the same scripts a visitor gets, off a local server, with the network otherwise
 * cut off.
 *
 * The names are Chromium's own: `locator.ariaSnapshot()` is the accessibility tree the
 * browser built, so a control that reads as `- button` with nothing after it is a control
 * a screen reader announces as "button". That is the check no amount of reading the
 * markup can replace — half of these screens are drawn by a script from localStorage.
 *
 * Playwright, installed OUTSIDE the repo (this repo has no package.json and wants none):
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-a11y-page.mjs
 *
 * With no Playwright it skips itself and exits 0, the same as the other browser suites.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  console.log("test-a11y-page: Playwright not installed — skipping the browser tests.");
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
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".xml": "application/xml", ".txt": "text/plain",
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

/** Enough of a project that every screen has rows to draw, and every row has controls. */
const workspace = () => ({
  projects: [{ id: "p1", name: "Remont łazienki", archived: false, ...sync(T0 + 5 * DAY) }],
  rooms: [{
    id: "r1", projectId: "p1", name: "Łazienka",
    lengthCm: 320, widthCm: 240, heightCm: 250, ...sync(T0),
  }],
  estimations: [{
    id: "e1", projectId: "p1", name: "Gres 60×60", calculationType: "SURFACE_COVERAGE",
    materialCategory: "TILES", requiredUnits: 15, unitLabel: "opak.",
    totalCostMinor: 74985, wastePercentage: 0, wasteCostMinor: 0, currencyCode: "PLN",
    inputJson: JSON.stringify({ area: "21.6" }), ...sync(T0 + DAY),
  }],
  shoppingItems: [{
    id: "s1", projectId: "p1", name: "Gres 60×60", quantity: 26.4, unitLabel: "m²",
    materialCategory: "Płytki", estimatedCostMinor: 74985, currencyCode: "PLN",
    isPurchased: false, note: "", ...sync(T0 + DAY),
  }],
});

const crm = () => ({
  clients: [{
    id: "c1", name: "Jan Kowalski", phone: "600 100 200", email: "jan@example.com",
    address: "ul. Piękna 3", note: "", projectIds: ["p1"], archived: false, ...sync(T0 + 4 * DAY),
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

async function context(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: opts.width || 1280, height: opts.height || 900 },
    reducedMotion: opts.reducedMotion,
    colorScheme: opts.colorScheme,
  });
  // Nothing on this site may reach the network.
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

/** Which flag a screen raises when its script has finished drawing. */
function readyFor(url) {
  if (url.startsWith("/projekty/")) return "html[data-ws-ready]";
  if (url.startsWith("/klienci/")) return "html[data-crm-ready]";
  if (url.startsWith("/zlecenia/")) return "html[data-jobs-ready]";
  if (url.startsWith("/wyceny/")) return "html[data-quotes-ready]";
  if (url.startsWith("/terminarz/")) return "html[data-schedule-ready]";
  return null;
}

/** A page, with a store planted before it loads (the plant happens on /404.html). */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const plant = { "materio-lang": opts.lang || "pl" };
  if (opts.workspace !== false) plant["materio-workspace-v1"] = JSON.stringify(workspace());
  if (opts.crm) plant["liczmat-crm-v1"] = JSON.stringify(crm());
  if (opts.level) plant["liczmat-signed-in"] = opts.level;
  if (opts.theme) plant["liczmat-theme"] = opts.theme;

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

/** What has the focus, named the way a failure can be read: an id if it has one. */
const focused = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return "none";
  if (el.id) return `${el.tagName.toLowerCase()}#${el.id}`;
  const cls = String(el.getAttribute("class") || "").split(" ").filter(Boolean)[0];
  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
});

/** Whether the element with the focus is drawing a ring somebody can see. */
const ring = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el);
  const px = parseFloat(s.outlineWidth) || 0;
  const border = s.borderColor;
  return {
    width: px,
    style: s.outlineStyle,
    colour: s.outlineColor,
    // A field marks focus with its border as well; either one on its own is enough.
    border,
    ok: (px >= 2 && s.outlineStyle !== "none" && !/rgba\(0, 0, 0, 0\)/.test(s.outlineColor)),
  };
});

/* ------------------------------------------------------------------ 1. the skip link */

head("1. the skip link, pressed");
{
  const ctx = await context();
  const page = await open(ctx, "/");

  await page.keyboard.press("Tab");
  eq("the first Tab lands on it", await focused(page), "a.skip-link");

  const shown = await page.evaluate(() => {
    const el = document.querySelector(".skip-link");
    return el.getBoundingClientRect().left >= 0;
  });
  check("and it comes on screen when it has the focus", shown);
  check("with a ring on it", (await ring(page)).ok);

  await page.keyboard.press("Enter");
  eq("Enter moves the focus into the page", await focused(page), "main#main");

  // The point of the whole thing: the next Tab is inside the content, not back in the
  // header. Before session 34 the target was not focusable and this walked into the logo.
  await page.keyboard.press("Tab");
  const inside = await page.evaluate(() => {
    const el = document.activeElement;
    return Boolean(el.closest("main"));
  });
  check("and the next Tab is inside <main>", inside, await focused(page));
  await ctx.close();
}

/* ------------------------------------------------------------------ 2. names */

/* Chromium's own accessibility tree. A control with no name reads as "- button" with
   nothing after it — which is what a screen reader would announce: "button". */
head("2. every control the browser sees has a name");
{
  const NAMELESS = /^\s*-\s*(button|link|textbox|combobox|checkbox|radio|slider|searchbox|menuitem)\s*:?\s*$/;
  const screens = [
    ["/", {}],
    ["/kalkulatory/", {}],
    ["/kalkulatory/plytki-panele-gres/", {}],
    ["/projekty/", {}],
    ["/projekty/?id=p1", {}],
    ["/kosztorys/", {}],
    ["/materialy/", {}],
    ["/sklepy/", {}],
    ["/app/dashboard/", { level: "liczmat" }],
    ["/klienci/", { crm: true, level: "pro" }],
    ["/zlecenia/", { crm: true, level: "pro" }],
    ["/wyceny/", { crm: true, level: "pro" }],
    ["/terminarz/", { crm: true, level: "pro" }],
    ["/liczmat-pro/", {}],
  ];
  const ctx = await context();
  for (const [url, opts] of screens) {
    const page = await open(ctx, url, opts);
    const tree = await page.locator("body").ariaSnapshot();
    const bad = tree.split("\n").filter((line) => NAMELESS.test(line));
    check(`${url}: nothing in the tree is nameless`, bad.length === 0,
      bad.slice(0, 3).map((s) => s.trim()).join(" | "));
    await page.close();
  }
  await ctx.close();
}

/* ------------------------------------------------------------------ 3. focus */

/* WCAG 2.4.7. The ring is one rule in the stylesheet, spent on every control — so the
   thing to check is that nothing has taken it away, on the two screens that carry the
   most controls of their own. */
head("3. the focus is visible, wherever it is");
{
  const ctx = await context();
  for (const url of ["/kalkulatory/plytki-panele-gres/", "/projekty/?id=p1"]) {
    const page = await open(ctx, url);
    const seen = [];
    let missing = null;
    for (let i = 0; i < 45 && !missing; i++) {
      await page.keyboard.press("Tab");
      const what = await focused(page);
      if (what === "body" || what === "html") break;
      seen.push(what);
      const r = await ring(page);
      if (r && !r.ok) missing = `${what}: outline ${r.width}px ${r.style} ${r.colour}`;
    }
    check(`${url}: every stop on the way through has a ring`, !missing, missing);
    check(`${url}: and the walk got somewhere`, seen.length > 8, `${seen.length} stops`);
    await page.close();
  }
  await ctx.close();
}

/* ------------------------------------------------------------------ 4. no trap */

head("4. the keyboard gets all the way through");
{
  const ctx = await context();
  const page = await open(ctx, "/kalkulatory/plytki-panele-gres/");
  let reachedFooter = false;
  for (let i = 0; i < 120 && !reachedFooter; i++) {
    await page.keyboard.press("Tab");
    reachedFooter = await page.evaluate(() => Boolean(document.activeElement.closest("footer")));
  }
  check("Tab reaches the footer without being caught on the way", reachedFooter);
  await ctx.close();
}

/* ------------------------------------------------------------------ 5. the pickers */

head("5. the language picker, by keyboard");
{
  const ctx = await context();
  const page = await open(ctx, "/");

  await page.focus("#lang-toggle");
  eq("it can be focused", await focused(page), "button#lang-toggle");
  await page.keyboard.press("Enter");
  eq("Enter opens it", await page.getAttribute("#lang-toggle", "aria-expanded"), "true");
  check("and the menu is on screen", await page.isVisible("#lang-menu"));

  await page.keyboard.press("ArrowDown");
  const inMenu = await page.evaluate(() => Boolean(document.activeElement.closest("#lang-menu")));
  check("ArrowDown walks into it", inMenu, await focused(page));

  await page.keyboard.press("Escape");
  eq("Escape shuts it", await page.getAttribute("#lang-toggle", "aria-expanded"), "false");
  eq("and hands the focus back to the button", await focused(page), "button#lang-toggle");
  await ctx.close();
}

head("6. the currency selector");
{
  const ctx = await context();
  const page = await open(ctx, "/kalkulatory/plytki-panele-gres/");
  const name = await page.locator("#currency-select").ariaSnapshot();
  check("it is a native select with a name", /combobox "[^"]+"/.test(name), name.trim());

  await page.selectOption("#currency-select", "EUR");
  await page.waitForTimeout(150);
  const stored = await page.evaluate(() => localStorage.getItem("liczmat-currency"));
  eq("choosing a currency is remembered", stored, "EUR");
  await ctx.close();
}

/* ------------------------------------------------------------------ 7. both themes */

head("7. both themes, from the keyboard");
{
  const ctx = await context();
  const page = await open(ctx, "/");
  await page.focus("#theme-toggle");

  // Three states since session 51, the same three the app offers. A visitor who never
  // chose starts on "system", and the label — not aria-pressed, which cannot describe
  // three — is what says so and what a screen reader hears change.
  const mode = () => page.getAttribute("html", "data-theme-mode");
  const label = () => page.getAttribute("#theme-toggle", "aria-label");
  eq("a visitor who never chose is on the system theme", await mode(), "system");
  const first = await label();
  check("the toggle's name says which mode is in force", /:/.test(first || ""), first);

  const seen = [await mode()];
  const labels = [first];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    seen.push(await mode());
    labels.push(await label());
  }
  eq("three presses walk system → light → dark and back", seen.join(" → "),
    "system → light → dark → system");
  check("and the name moves with every one of them", new Set(labels.slice(0, 3)).size === 3,
    labels.slice(0, 3).join(" | "));
  eq("the last press hands the choice back to the device", 
    await page.evaluate(() => { try { return localStorage.getItem("liczmat-theme"); } catch (e) { return "throw"; } }), null);
  eq("and takes data-theme off the document with it", await page.getAttribute("html", "data-theme"), null);

  // Land on dark for the ring check below: two more presses from "system".
  await page.keyboard.press("Enter");
  await page.waitForTimeout(60);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  const theme = await page.getAttribute("html", "data-theme");
  eq("the page follows the mode", theme, "dark");

  // The ring has to be visible in the theme that is now on: it is a token, and both
  // themes carry it (scripts/check-contrast.mjs measures the ratio).
  await page.keyboard.press("Tab");
  check(`the focus ring survives the ${theme} theme`, (await ring(page)).ok);
  await ctx.close();
}

/* ------------------------------------------------------------------ 8. the calculator */

head("8. the calculation, announced");
{
  const ctx = await context();
  const page = await open(ctx, "/kalkulatory/plytki-panele-gres/");

  const role = await page.getAttribute("[data-result]", "role");
  eq("the result box is a live region", role, "status");

  const before = (await page.textContent("[data-result]")).replace(/\s+/g, " ").trim();
  await page.fill("#f-waste-area", "48");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const after = (await page.textContent("[data-result]")).replace(/\s+/g, " ").trim();
  check("Enter in a field calculates", after !== before, `${before} / ${after}`);

  // The silent run on load must not write into that region, or the answer is read out to
  // somebody who never asked for one. Counted with a MutationObserver installed before
  // any of the page's own scripts have run.
  const watcher = await ctx.newPage();
  await watcher.addInitScript(() => {
    window.__lmResultWrites = 0;
    // From DOMContentLoaded, not from document_start: the HTML parser inserting the
    // build's own markup is a mutation too, and counting those would measure the parser.
    // This listener is registered before any of the page's scripts exist, so the observer
    // is watching before assets/calculators.js does its silent run.
    document.addEventListener("DOMContentLoaded", () => {
      const box = document.querySelector("[data-result]");
      if (!box) return;
      new MutationObserver((records) => { window.__lmResultWrites += records.length; })
        .observe(box, { childList: true, subtree: true, characterData: true });
    });
  });
  await watcher.goto(`${base}/kalkulatory/plytki-panele-gres/`, { waitUntil: "load" });
  await watcher.waitForTimeout(400);
  eq("and nothing was written into it before the visitor asked",
    await watcher.evaluate(() => window.__lmResultWrites), 0);

  // And the guard is not simply a no-op: the moment the answer is a different answer, it
  // is written — which is the mutation that gets it announced.
  await watcher.fill("#f-waste-area", "48");
  await watcher.keyboard.press("Enter");
  await watcher.waitForTimeout(300);
  check("and it does write when the answer changes",
    (await watcher.evaluate(() => window.__lmResultWrites)) > 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ 9. the dialog */

head("9. the material dialog");
{
  const ctx = await context();
  const page = await open(ctx, "/kalkulatory/plytki-panele-gres/");
  await page.focus("[data-mat-open]");
  await page.keyboard.press("Enter");
  await page.waitForSelector("#mat-dialog[open]", { timeout: 5000 });
  check("it opens from the keyboard", await page.isVisible("#mat-dialog"));
  eq("and puts the focus in the search field", await focused(page), "input#mat-search");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  check("Escape closes it", !(await page.isVisible("#mat-dialog")));
  const back = await focused(page);
  check("and the focus comes back to what opened it", /mat-open|button/.test(back), back);
  await ctx.close();
}

/* ------------------------------------------------------------------ 10. the carousel */

/* WCAG 2.2.2 — the whole reason the button exists. */
head("10. the screenshots can be stopped");
{
  const ctx = await context();
  const page = await open(ctx, "/aplikacja/");

  const buttons = await page.locator("[data-carousel-pause]").count();
  eq("both mockups on this page have a stop button", buttons, 2);
  check("it is on screen once the script is running",
    await page.locator("[data-carousel-pause]").first().isVisible());

  const at = () => page.evaluate(() => document.querySelector("[data-carousel]").style.transform || "none");
  const first = await at();
  await page.waitForTimeout(4200);
  check("they move on their own", (await at()) !== first, `${first} → ${await at()}`);

  const btn = page.locator("[data-carousel-pause]").first();
  const labelBefore = await btn.getAttribute("aria-label");
  await btn.focus();
  await page.keyboard.press("Enter");
  const stopped = await at();
  await page.waitForTimeout(4200);
  eq("pressing it stops them", await at(), stopped);

  const labelAfter = await btn.getAttribute("aria-label");
  check("and the label now says what it will do next", labelAfter && labelAfter !== labelBefore,
    `${labelBefore} → ${labelAfter}`);

  await page.keyboard.press("Enter");
  await page.waitForTimeout(4200);
  check("pressing it again lets them go", (await at()) !== stopped);
  await ctx.close();
}

head("11. prefers-reduced-motion");
{
  const ctx = await context({ reducedMotion: "reduce" });
  const page = await open(ctx, "/aplikacja/");
  const first = await page.evaluate(() => document.querySelector("[data-carousel]").style.transform || "none");
  await page.waitForTimeout(4200);
  const later = await page.evaluate(() => document.querySelector("[data-carousel]").style.transform || "none");
  eq("nothing moves", later, first);
  // Nothing is moving, so a button offering to stop it would be a control that does
  // nothing — chapter XXV's rule, arrived at from the other direction.
  check("and there is no stop button to press",
    !(await page.locator("[data-carousel-pause]").first().isVisible()));
  await ctx.close();
}

/* ------------------------------------------------------------------ 12. the forms */

head("12. a form somebody fills in");
{
  const ctx = await context();
  const page = await open(ctx, "/projekty/");

  // The field that had nothing but a placeholder until session 34.
  const named = await page.locator("#ws-project-name").ariaSnapshot();
  check("the new-project field has a name", /textbox "[^"]+"/.test(named), named.trim());

  await page.focus("#ws-project-name");
  check("it has a visible focus state", (await ring(page)).ok);

  await page.keyboard.type("Kuchnia");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const listed = await page.locator("text=Kuchnia").count();
  check("and the whole form works from the keyboard alone", listed > 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ the result */

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`a11y (browser): ${passed}/${passed} checks pass`);
