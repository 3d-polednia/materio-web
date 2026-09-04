#!/usr/bin/env node
/**
 * LiczMat — the final QA walk: the whole product, end to end, in a real browser.
 *
 *     node scripts/test-qa.mjs
 *
 * Master plan, session 36 (FINALNY QA). The chapter does not ask for another module
 * test — sessions 13 to 35 wrote one for every module there is. It asks for the one
 * thing none of them can answer, because each of them plants a store and opens a
 * screen: whether the *path* holds when nobody plants anything.
 *
 *     GOŚĆ → kalkulator → wynik → rejestracja → LICZMAT → projekt → kalkulacja
 *          → materiały → koszty → LICZMAT PRO → klient → zlecenie → projekt
 *          → wycena → historia
 *
 * So this test starts with an empty browser and never writes to storage again: every row
 * it later reads back was produced by clicking the product. A defect that lives in the
 * seam between two modules — a link pointing at the wrong language, a currency stamped
 * from the wrong place, a project the next screen cannot find — is invisible to a test
 * that hands the next screen its input, and is exactly what the last session is for.
 *
 * The chapter also names what to vary: Polish, Ukrainian, German and English; PLN, EUR,
 * USD and UAH; the dark theme and the light one; mobile and desktop. Those are four
 * independent axes, and the whole path is walked in each of five configurations that
 * cover every value of every axis — plus one that deliberately breaks the pairing
 * (German with PLN, chapter VI's "waluta to nie język") so a walk cannot pass by a
 * language and a currency agreeing with each other.
 *
 * **Only /app/ is stubbed, and only because it cannot be reached.** `assets/app.js`
 * imports the Firebase SDK from gstatic.com, which the agent container's egress proxy
 * resets; scripts/fake-firebase.mjs answers those three imports. Everything else in the
 * walk — the calculators, the projects, the materials, the costs and the four Pro
 * screens — touches no network at all and is the real code with real storage under it.
 *
 * The one thing the walk cannot do for itself is become LiczMat Pro. `users/{uid}.plan`
 * is server-only and nothing writes it (FIRESTORE_SYNC §9.2), so the walk meets the wall
 * as a free account first — which is the state the site ships in — and then signs in
 * against a profile the fake backend already says is `premium`. Planting the *server's*
 * answer is the only honest way to see the other side of the wall.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-qa.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  urlHome, urlCalcIndex, urlCalc, urlProjects, urlClients, urlJobs, urlQuotes,
  URL_APP,
} from "../src/site.mjs";
import { FAKE_APP, FAKE_AUTH, FAKE_STORE } from "./fake-firebase.mjs";

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
  console.log("test-qa: Playwright not installed — skipping the final QA walk.");
  console.log("         See the header of this file for the one-line install.");
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

/** A context that cannot leave the machine, and answers the Firebase imports itself. */
async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route("**", (route) => {
    const url = route.request().url();
    if (url.includes("/firebasejs/") && url.endsWith("firebase-app.js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_APP });
    }
    if (url.includes("/firebasejs/") && url.endsWith("firebase-auth.js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_AUTH });
    }
    if (url.includes("/firebasejs/") && url.endsWith("firebase-firestore.js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_STORE });
    }
    return url.startsWith(base) ? route.continue() : route.abort();
  });
  return ctx;
}

/* ------------------------------------------------------------------ the walk's tools */

/** Which "the page is wired" mark to wait for, chosen by the address being opened. */
function readyMark(lang, url) {
  const path = url.split("?")[0];
  if (path === urlProjects(lang)) return "html[data-ws-ready]";
  if (path === urlClients(lang)) return "html[data-crm-ready]";
  if (path === urlJobs(lang)) return "html[data-jobs-ready]";
  if (path === urlQuotes(lang)) return "html[data-quotes-ready]";
  if (path.startsWith(urlCalcIndex(lang)) && path !== urlCalcIndex(lang)) {
    return '.calc[data-wired="1"]';
  }
  return null;
}

/** Every console error a page produced, minus the ones a blocked request makes. */
function watch(page) {
  page.lmErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) {
      page.lmErrors.push(m.text());
    }
  });
  page.on("pageerror", (e) => page.lmErrors.push(String(e)));
  return page;
}

const visible = (page, sel) => page.locator(sel).isVisible();
const textOf = (page, sel) => page.locator(sel).innerText();
const digits = (s) => String(s).replace(/\D/g, "");
/* A formatted amount, read back in minor units. Every currency this walk uses has two
   decimal places, so the digits of "1 080,00 zł" ARE 108000 — which is what the document
   stores, and comparing the two needs no locale knowledge and no rounding of its own. */
const minorOf = (s) => Number(digits(s) || "0");
const store = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("materio-workspace-v1") || "{}"));
const crmStore = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-crm-v1") || "{}"));
const level = (page) => page.evaluate(() => localStorage.getItem("liczmat-signed-in"));
const overflow = (page) => page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* ------------------------------------------------------------------ the walk */

/**
 * One visitor, one browser, one journey: chapter XXXVI's path from end to end.
 *
 * @param {object} cfg
 * @param {string} cfg.lang    the language every page is opened in
 * @param {string} cfg.cur     the currency picked before anything is counted
 * @param {string} cfg.theme   "light" or "dark"
 * @param {number} cfg.width   the viewport width — 390 is a phone, 1280 a desktop
 */
async function walk(cfg) {
  const { lang, cur, theme, width } = cfg;
  const who = `${lang}/${cur}/${theme}/${width}px`;
  const ctx = await context({ viewport: { width, height: 900 } });
  const page = watch(await ctx.newPage());

  /** Open an address in this walk and wait until the page is wired. */
  async function go(url) {
    await page.goto(base + url, { waitUntil: "load" });
    const mark = readyMark(lang, url);
    if (mark) await page.waitForSelector(mark, { timeout: 15000 });
    return page;
  }

  /**
   * Is a navigation link on offer to this visitor — really on offer, on this screen?
   *
   * Below 1060 px the row collapses into the drawer, so "visible" on a phone means
   * "visible once the menu is open"; a check that skipped that would pass on a desktop
   * and say nothing about the device most of this site is used on.
   */
  async function navOffered(href) {
    const collapsed = await page.locator("#menu-toggle").isVisible();
    if (collapsed) await page.click("#menu-toggle");
    const on = await page.locator(
      `.nav-list li[data-nav-level] a[href="${href}"]`).isVisible();
    if (collapsed) await page.click("#menu-toggle");
    return on;
  }

  /** Pick a currency the way a visitor does — on a phone that means opening the drawer. */
  async function pickCurrency(code) {
    const collapsed = await page.locator("#menu-toggle").isVisible();
    if (collapsed) await page.click("#menu-toggle");
    await page.selectOption("#currency-select", code);
    await page.waitForFunction((c) => localStorage.getItem("liczmat-currency") === c, code);
    if (collapsed) await page.click("#menu-toggle");
  }

  /** Follow a link that is already on the screen, then wait for the page behind it. */
  async function follow(sel, url) {
    await page.click(sel);
    await page.waitForURL((u) => u.pathname + u.search === url, { timeout: 15000 });
    await page.waitForLoadState("load");
    const mark = readyMark(lang, url);
    if (mark) await page.waitForSelector(mark, { timeout: 15000 });
  }

  /* The three settings a visitor makes before they count anything. The theme and the
     currency are real choices with real storage keys, so planting them is planting what
     the picker would have written — and nothing else is planted for the rest of the walk. */
  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate(([l, c, th]) => {
    localStorage.clear();
    localStorage.setItem("materio-lang", l);
    localStorage.setItem("liczmat-currency", c);
    localStorage.setItem("liczmat-theme", th);
  }, [lang, cur, theme]);

  /* ---------------------------------------------------------------- 1. GOŚĆ */

  head(`${who} — 1. GOŚĆ: the home page of a browser with nothing in it`);
  await go(urlHome(lang));
  eq("the page is in the language asked for",
    await page.getAttribute("html", "lang"), lang);
  eq("and in the theme asked for",
    await page.getAttribute("html", "data-theme"), theme);
  eq("the currency picker stands on the visitor's currency",
    await page.inputValue("#currency-select"), cur);
  eq("the header's account button carries no level, because nobody is signed in",
    await page.getAttribute(".nav-cta[data-account-cta]", "data-level"), null);
  /* A guest is the ABSENCE of the mark, not a value of it: src/template.mjs stamps
     `data-lm-level` only when `liczmat-signed-in` says something, and the stylesheet hides
     a LICZMAT link only when the level is known. No script means no `.js` class means the
     link stays, which is what keeps /projekty/ crawlable. */
  eq("nothing claims a level, because nobody is signed in",
    await page.getAttribute("html", "data-lm-level"), null);
  eq("so the projects link is not offered yet", await navOffered(urlProjects(lang)), false);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 2. kalkulator */

  head(`${who} — 2. kalkulator: found from the home page, not typed in`);
  await go(urlCalcIndex(lang));
  const CALC = urlCalc(lang, "waste");
  /* The hub names it twice on purpose — once in the "popular" strip and once in its
     category — so the count is "at least one" and the click is on the first of them. */
  check("the hub offers the calculator this walk uses",
    (await page.locator(`.calc-link[href="${CALC}"]`).count()) >= 1);
  await follow(`.calc-link[href="${CALC}"] >> nth=0`, CALC);
  eq("the calculator opened is the one that was clicked", new URL(page.url()).pathname, CALC);
  eq("it is wired", await page.locator('.calc[data-wired="1"]').count(), 1);
  eq("the calculator page kept the language", await page.getAttribute("html", "lang"), lang);
  eq("and the theme", await page.getAttribute("html", "data-theme"), theme);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 3. wynik */

  head(`${who} — 3. wynik: a number, in the visitor's currency`);
  await page.fill('[data-k="area"]', "24");
  await page.fill('[data-k="price"]', "50");
  await page.click("[data-run]");
  const result = (await textOf(page, "[data-result] .big")).trim();
  check("the result panel says something", result.length > 0, JSON.stringify(result));
  eq("and it is a live region, so it is announced rather than silently replaced",
    await page.getAttribute("[data-result]", "role"), "status");
  const money = (await textOf(page, "[data-result] .rows > div:first-child")).trim();
  check("the cost is on the screen", digits(money).length > 0, money);
  /* Read with the page's own ICU rather than Node's: the two disagree on UAH, where Node
     writes "₴" and Chromium "грн", and the question here is which *currency* the panel
     used — the visitor's, or the one the language would have defaulted to. */
  const curMark = await page.evaluate((c) => new Intl.NumberFormat(
    document.documentElement.lang, { style: "currency", currency: c })
    .formatToParts(1234.5).filter((p) => p.type === "currency").map((p) => p.value).join(""), cur);
  check("in the currency the visitor picked, not the one their language defaults to",
    money.includes(curMark), `${money} — expected ${curMark}`);
  eq("the save box is offered under the result", await visible(page, "[data-ws-save]"), true);
  eq("with no project to save into yet", await visible(page, "[data-ws-project]"), false);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 4. rejestracja */

  head(`${who} — 4. rejestracja: the way in is the sentence under the result`);
  const signupHref = await page.getAttribute(".ws-save-account a", "href");
  eq("the link opens the sign-up form and comes back here", signupHref,
    `${URL_APP}?mode=signup&next=${encodeURIComponent(CALC)}`);

  /* /app/ is the one page in the walk with a stub behind it, so it gets its own page —
     the fake SDK keeps its accounts on `window`, and a fresh window is a fresh backend. */
  const EMAIL = "qa@example.com";
  const PASSWORD = "sekret123";
  const app = watch(await ctx.newPage());
  await app.addInitScript(() => { window.__fbAccounts = {}; window.__fbSeed = {}; });
  await app.goto(base + signupHref, { waitUntil: "domcontentloaded" });
  await app.waitForSelector("html[data-app-ready]", { state: "attached", timeout: 15000 });
  eq("the sign-up view is the one that opened",
    await app.locator('[data-auth-view="signup"]').isVisible(), true);
  await app.fill("#signup-email", EMAIL);
  await app.fill("#signup-password", PASSWORD);
  await app.click("#signup-form button[type=submit]");
  await app.locator("#app-workspace").waitFor({ state: "visible", timeout: 10000 });

  /* ---------------------------------------------------------------- 5. LICZMAT */

  head(`${who} — 5. LICZMAT: the free account, and the way back to the calculation`);
  eq("the account is at the free level", await level(app), "liczmat");
  eq("the page says whose account it is", (await textOf(app, "#app-who")).trim(), EMAIL);
  eq("the way back is offered", await visible(app, "#app-next"), true);
  eq("and it points at the calculator the visitor came from",
    await app.getAttribute("#app-next-link", "href"), CALC);
  check("no error on the account page", app.lmErrors.length === 0, app.lmErrors.join("\n      "));
  await app.close();

  await go(CALC);
  eq("back on the calculator, the browser knows it is signed in now",
    await page.getAttribute("html", "data-lm-level"), "liczmat");
  eq("the header's account button says so too",
    await page.getAttribute(".nav-cta[data-account-cta]", "data-level"), "liczmat");
  eq("and the sentence under the result stops offering an account",
    await page.locator(".ws-save-account a").count(), 0);
  eq("and the header now offers the projects, which the guest was not shown",
    await navOffered(urlProjects(lang)), true);

  /* ---------------------------------------------------------------- 6. projekt */

  head(`${who} — 6. projekt: made by hand, on the projects screen`);
  await go(urlProjects(lang));
  eq("a new account has no projects yet", (await store(page)).projects, undefined);
  await page.fill("#ws-project-name", "Remont QA");
  await page.click("#ws-project-form button[type=submit]");
  await page.waitForSelector("#ws-project-list li");
  const made = (await store(page)).projects;
  eq("one project is made", made.length, 1);
  eq("under the name that was typed", made[0].name, "Remont QA");
  const PROJECT = made[0].id;
  check("and it is listed", (await textOf(page, "#ws-project-list")).includes("Remont QA"));
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 7. kalkulacja */

  head(`${who} — 7. kalkulacja: the result filed in that project`);
  await go(CALC);
  await page.fill('[data-k="area"]', "24");
  await page.fill('[data-k="price"]', "50");
  await page.click("[data-run]");
  eq("the project made a moment ago is offered", await visible(page, "[data-ws-project]"), true);
  const options = await page.$$eval("[data-ws-project] option", (o) =>
    o.map((n) => ({ value: n.value, label: n.textContent })));
  check("by name", options.some((o) => o.value === PROJECT && o.label === "Remont QA"),
    JSON.stringify(options));
  await page.selectOption("[data-ws-project]", PROJECT);
  await page.click("[data-ws-save]");
  await page.waitForSelector("[data-ws-saved]:not([hidden])");
  const afterSave = await store(page);
  eq("one calculation is saved", afterSave.estimations.length, 1);
  eq("into the project that was picked", afterSave.estimations[0].projectId, PROJECT);
  eq("stamped with the visitor's currency, not the language's",
    afterSave.estimations[0].currencyCode, cur);
  const openProject = `${urlProjects(lang)}?id=${encodeURIComponent(PROJECT)}`;
  eq("and the confirmation links to that project, in this language",
    await page.getAttribute("[data-ws-saved] a", "href"), openProject);

  /* ---------------------------------------------------------------- 8. materiały */

  head(`${who} — 8. materiały: the calculation put a material on the list`);
  await follow("[data-ws-saved] a", openProject);
  eq("the project screen opened the project that was saved into",
    (await textOf(page, "#ws-project-body h1, #ws-title")).includes("Remont QA"), true);
  const mats = await page.$$eval("#ws-project-materials > li[data-id]", (li) =>
    li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
  eq("one material is on the list", mats.length, 1);
  check("it names what the calculation was for", mats[0].length > 3, mats[0]);
  const shopping = (await store(page)).shoppingItems;
  eq("the document is in the project", shopping[0].projectId, PROJECT);
  eq("and carries the currency the calculation was stamped with",
    shopping[0].currencyCode, cur);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 9. koszty */

  /* The walk used to price the material here, on the free account, because until
     2026-09-03 it could. The owner moved every price, the quote and the PDF into LiczMat
     Pro, so this step is now the half of chapter XVII a free account keeps — the material
     list, with no money on it — and the pricing itself is step 10b, after the plan that
     opens it. The journey is the same journey; what changed is where the money starts. */
  head(`${who} — 9. koszty: what a free account sees where the money used to be`);
  const MATS = "#ws-project-materials";
  const matId = shopping[0].id;
  eq("the material is on the list, because the list is free",
    await page.locator(`${MATS} li[data-id="${matId}"]`).count(), 1);
  const freeRow = (await textOf(page, `${MATS} li[data-id="${matId}"]`)).replace(/\s+/g, " ");
  check("and it carries no amount", !/\d[\d\s., ]*(zł|PLN|€|EUR|\$|USD|£|GBP|₴|UAH|Kč|CZK|lei|RON|RSD|дин)/i
    .test(freeRow), freeRow);

  eq("the three figures are behind chapter XXV's wall",
    await page.locator("#cost-tool").isHidden(), true);
  eq("and the wall is what stands there instead",
    await page.locator("#cost-gate").isHidden(), false);
  eq("the rung offered is the upgrade, because there is an account to put it on",
    await page.locator('#cost-gate [data-pw-step="upgrade"]').first().isHidden(), false);
  eq('"inne koszty" is behind it too, being nothing but money',
    await page.locator("#cost-other-tool").isHidden(), true);
  eq("the PDF export is walled as well", await page.locator("#pdf-tool").isHidden(), true);
  eq("with its own wall in front of it", await page.locator("#pdf-gate").isHidden(), false);

  /* Never a dead control: the price field is not on the form at all, rather than sitting
     there taking a number nothing will store. */
  await page.click(`${MATS} li[data-id="${matId}"] [data-edit]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`);
  eq("the row still opens for editing — the name and the quantity are free",
    await page.locator(`${MATS} [data-f="quantity"]`).count(), 1);
  eq("and there is no price field on it", await page.locator(`${MATS} [data-f="priceMajor"]`).count(), 0);
  await page.click(`${MATS} form[data-mat-edit] [data-cancel]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`, { state: "detached" });
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 10. LICZMAT PRO */

  head(`${who} — 10. LICZMAT PRO: the wall, then the plan that opens it`);
  await go(urlClients(lang));
  eq("a free account meets the wall", await page.locator("#crm-gate").isHidden(), false);
  eq("and not the module", await page.locator("#crm-tool").isHidden(), true);
  eq("the strip above the module is hidden, because the wall says all of it",
    await page.locator("#crm-pro").isHidden(), true);
  eq("the rung offered is the upgrade, because there is an account to put it on",
    await page.locator('#crm-gate [data-pw-step="upgrade"]').first().isHidden(), false);
  eq("and not the sign-up rung",
    await page.locator('#crm-gate [data-pw-step="account"]').first().isHidden(), true);
  check("nothing on the wall takes money here",
    (await page.$$eval("#crm-gate a", (a) => a.map((n) => n.getAttribute("href"))))
      .every((h) => !/stripe/i.test(h || "")));
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* The plan is server-only and nothing in this repo writes it, so the walk signs in
     against a backend that already says premium — the same account, the same password,
     one field different on the profile document. */
  const pro = watch(await ctx.newPage());
  await pro.addInitScript(([email, password]) => {
    window.__fbAccounts = {
      [email]: {
        password,
        user: {
          uid: "uid-0", email, emailVerified: false, displayName: "",
          providerData: [{ providerId: "password" }],
        },
      },
    };
    window.__fbSeed = {
      "users/uid-0": {
        createdAt: 1, lastSeenAt: 1, appVersion: "web",
        plan: "premium", planValidUntil: Date.now() + 30 * 86400e3,
      },
    };
  }, [EMAIL, PASSWORD]);
  await pro.goto(base + URL_APP, { waitUntil: "domcontentloaded" });
  await pro.waitForSelector("html[data-app-ready]", { state: "attached", timeout: 15000 });
  await pro.evaluate(() => {
    Object.entries(window.__fbSeed || {}).forEach(([k, v]) => window.__fbDocs.set(k, v));
  });
  await pro.fill("#signin-email", EMAIL);
  await pro.fill("#signin-password", PASSWORD);
  await pro.click("#signin-form button[type=submit]");
  await pro.locator("#app-workspace").waitFor({ state: "visible", timeout: 10000 });
  await pro.waitForFunction(() => localStorage.getItem("liczmat-signed-in") === "pro",
    null, { timeout: 10000 });
  eq("the level is derived from the plan, not asserted by the browser", await level(pro), "pro");
  check("no error on the account page", pro.lmErrors.length === 0, pro.lmErrors.join("\n      "));
  await pro.close();

  /* ------------------------------------------------------------- 10b. koszty, opened */

  /* Chapter XVII, now that the plan reaches it: the same three figures the walk has always
     checked, in the same project, on the same material — moved down the journey rather
     than dropped from it. The wall step above and this one are the two halves of the
     owner's decision, and both are walked. */
  head(`${who} — 10b. koszty: the wall is down, and the money is on the screen`);
  await go(openProject);
  eq("the three figures are on the page now", await page.locator("#cost-tool").isHidden(), false);
  eq("and the wall is gone", await page.locator("#cost-gate").isHidden(), true);
  eq('"inne koszty" is back', await page.locator("#cost-other-tool").isHidden(), false);
  eq("and so is the PDF export", await page.locator("#pdf-tool").isHidden(), false);

  await page.click(`${MATS} li[data-id="${matId}"] [data-edit]`);
  await page.waitForSelector(`${MATS} [data-f="priceMajor"]`);
  check("the price field names the currency the row is priced in",
    (await page.innerText(`${MATS} form[data-mat-edit]`)).includes(`(${cur})`),
    await page.innerText(`${MATS} form[data-mat-edit]`));
  await page.fill(`${MATS} [data-f="priceMajor"]`, "60");
  await page.click(`${MATS} form[data-mat-edit] button[type=submit]`);
  await page.waitForSelector(`${MATS} form[data-mat-edit]`, { state: "detached" });

  await page.click("#ws-other-add summary");
  await page.fill("#ws-other-name", "Wywóz gruzu");
  await page.fill("#ws-other-cost", "400");
  await page.click("#ws-other-form button[type=submit]");
  await page.waitForFunction(() =>
    document.querySelectorAll("#ws-project-other-list > li[data-id]").length > 0);

  const priced = await store(page);
  const item = priced.shoppingItems.find((s) => s.id === matId);
  const qty = item.quantity;
  const materialsMinor = Math.round(qty * 6000);
  const OTHER_MINOR = 40000;
  eq("the price typed on the row became the total for it",
    item.estimatedCostMinor, Math.round(qty * 6000));
  const other = priced.estimations.find((e) => (e.inputJson || "").includes("manual"));
  eq("the hand-typed cost is a line of its own", other.totalCostMinor, OTHER_MINOR);
  eq("in the visitor's currency", other.currencyCode, cur);

  const figs = {
    mat: await textOf(page, "#ws-project-mat"),
    other: await textOf(page, "#ws-project-other"),
    total: await textOf(page, "#ws-project-total"),
  };
  eq("the material figure is the priced list", minorOf(figs.mat), materialsMinor);
  eq("the other-costs figure is the cost nobody calculated", minorOf(figs.other), OTHER_MINOR);
  eq("and the sum is the two added once",
    minorOf(figs.total), materialsMinor + OTHER_MINOR);
  eq("one currency in the project, so no warning",
    await page.locator("#ws-project-mixed").isHidden(), true);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 11. klient */

  head(`${who} — 11. klient: added, and the project filed under them`);
  await go(urlClients(lang));
  eq("the wall is down", await page.locator("#crm-gate").isHidden(), true);
  eq("the module is open", await page.locator("#crm-tool").isHidden(), false);
  check("and the chip says which plan opened it",
    (await page.locator("#crm-pro-chip").getAttribute("class") || "").includes("on"));
  await page.fill("#crm-client-name", "Jan Kowalski");
  await page.fill("#crm-client-phone", "600 100 200");
  await page.fill("#crm-client-email", "jan@example.com");
  await page.click("#crm-client-form button[type=submit]");
  await page.waitForSelector("#crm-client-list a[data-open]");
  const client = (await crmStore(page)).clients[0];
  eq("one client is stored", (await crmStore(page)).clients.length, 1);
  eq("under the name typed", client.name, "Jan Kowalski");

  const clientUrl = `${urlClients(lang)}?id=${encodeURIComponent(client.id)}`;
  await follow("#crm-client-list a[data-open]", clientUrl);
  await page.selectOption("#crm-project-pick", { label: "Remont QA" });
  await page.click("#crm-project-form button[type=submit]");
  await page.waitForSelector("#crm-client-projects li[data-id]");
  eq("the project is filed under the client",
    (await crmStore(page)).clients[0].projectIds.join(), PROJECT);
  const projectDoc = (await store(page)).projects[0];
  eq("and the project document is untouched by it",
    JSON.stringify(Object.keys(projectDoc).sort()),
    JSON.stringify(["archived", "createdAt", "deletedAt", "id", "name", "schemaVersion", "updatedAt"]));
  eq("what the client's work has cost is read from the project",
    minorOf(await textOf(page, "#crm-fig-total")), materialsMinor + OTHER_MINOR);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 12. zlecenie */

  head(`${who} — 12. zlecenie: the client's job, with a deadline and a value`);
  await go(urlJobs(lang));
  await page.fill("#job-name", "Łazienka QA");
  await page.selectOption("#job-client", { label: "Jan Kowalski" });
  await page.fill("#job-new-due", "2026-10-15");
  await page.click("#job-form button[type=submit]");
  await page.waitForSelector("#job-list a[data-open]");
  const job = (await crmStore(page)).jobs[0];
  eq("the job carries the client it was given", job.clientId, client.id);
  eq("and the deadline as a calendar day", job.dueDate, "2026-10-15");
  eq("a new job starts at the first of chapter XXI's four statuses", job.status, "new");

  const jobUrl = `${urlJobs(lang)}?id=${encodeURIComponent(job.id)}`;
  await follow("#job-list a[data-open]", jobUrl);
  await page.selectOption("#job-project-pick", { label: "Remont QA" });
  await page.click("#job-project-form button[type=submit]");
  await page.waitForSelector("#job-project-list li[data-id]");
  await page.click("#job-edit");
  await page.waitForSelector("#job-edit-form:not([hidden])");
  await page.fill("#job-edit-value", "12000");
  await page.click("#job-edit-form button[type=submit]");
  await page.waitForSelector("#job-edit-form", { state: "hidden" });
  const jobAfter = (await crmStore(page)).jobs[0];
  eq("the job carries the project", jobAfter.projectId, PROJECT);
  eq("what was agreed is the one figure typed by hand", jobAfter.valueMinor, 1200000);
  eq("stamped once with the currency it was typed in", jobAfter.currencyCode, cur);
  eq("and what it has cost is read from the project, not copied onto the job",
    minorOf(await textOf(page, "#job-fig-cost")), materialsMinor + OTHER_MINOR);
  eq("nothing added a cost field to the job", "costMinor" in jobAfter, false);
  /* The difference is computed, and only because both halves are in one currency —
     chapter VI forbids subtracting two currencies at a rate, and the page says so
     instead of doing it. */
  eq("what is left is the agreed amount minus what the work has run to",
    minorOf(await textOf(page, "#job-fig-left")), 1200000 - (materialsMinor + OTHER_MINOR));
  eq("with no currency warning, because there is nothing to convert",
    await page.locator("#job-mixed").isHidden(), true);

  /* ---------------------------------------------------------------- 13. projekt */

  head(`${who} — 13. projekt: reached from the job, along chapter XXIV's chain`);
  const steps = await page.$$eval("#job-chain li", (li) => li.map((n) => ({
    node: n.getAttribute("data-node"),
    href: n.querySelector("a") ? n.querySelector("a").getAttribute("href") : "",
  })));
  eq("the strip is the chapter's four steps in the chapter's order",
    steps.map((s) => s.node).join(), "client,job,project,quote");
  eq("the client step resolved to the client this walk made", steps[0].href, clientUrl);
  eq("and the project step to the project it saved into", steps[2].href, openProject);
  await follow('#job-chain li[data-node="project"] a', openProject);
  check("the project opened is the one with the walk's material in it",
    (await textOf(page, "#ws-project-materials")).length > 3);
  eq("still in this walk's language", await page.getAttribute("html", "lang"), lang);

  /* ---------------------------------------------------------------- 14. wycena */

  head(`${who} — 14. wycena: labour and a margin on top of what the project costs`);
  await go(urlQuotes(lang));
  await page.fill("#quo-name", "Łazienka QA — wycena");
  await page.selectOption("#quo-project", { label: "Remont QA" });
  await page.click("#quo-form button[type=submit]");
  await page.waitForSelector("#quo-list a[data-open]");
  const quote = (await crmStore(page)).quotes[0];
  eq("the quote stores the project and nothing else of the chain", quote.projectId, PROJECT);
  eq("it stores no material total", "materialsMinor" in quote, false);

  const quoteUrl = `${urlQuotes(lang)}?id=${encodeURIComponent(quote.id)}`;
  await follow("#quo-list a[data-open]", quoteUrl);
  await page.fill("#quo-labour-name", "Układanie");
  await page.fill("#quo-labour-qty", "24");
  await page.fill("#quo-labour-unit", "m²");
  await page.fill("#quo-labour-price", "80");
  await page.click("#quo-labour-form button[type=submit]");
  await page.waitForSelector("#quo-labour-list li[data-line]");
  /* The margin is applied on `change`, which is what a field a visitor types into and
     then leaves fires. Playwright's fill() does not leave it, so the event is sent. */
  const labourMinor = 24 * 8000;
  const sub = materialsMinor + OTHER_MINOR + labourMinor;
  const marginMinor = Math.round(sub * 0.10);
  await page.fill("#quo-margin", "10");
  await page.dispatchEvent("#quo-margin", "change");
  await page.waitForFunction((want) =>
    document.getElementById("quo-fig-margin").textContent.replace(/\D/g, "") === want,
  String(marginMinor));
  const five = {
    materials: await textOf(page, "#quo-fig-materials"),
    other: await textOf(page, "#quo-fig-other"),
    labour: await textOf(page, "#quo-fig-labour"),
    margin: await textOf(page, "#quo-fig-margin"),
    total: await textOf(page, "#quo-fig-total"),
  };
  eq("the material figure is the project's, not a copy", minorOf(five.materials), materialsMinor);
  eq("the other costs are the project's too", minorOf(five.other), OTHER_MINOR);
  eq("the labour is quantity × rate, rounded once", minorOf(five.labour), labourMinor);
  eq("the margin is a percentage of everything above it", minorOf(five.margin), marginMinor);
  eq("and the total is the four added once", minorOf(five.total), sub + marginMinor);
  eq("the quote is stamped with the currency its labour was typed in",
    (await crmStore(page)).quotes[0].currencyCode, cur);
  eq("no currency warning, because the whole chain is in one currency",
    await page.locator("#quo-mixed").isHidden(), true);
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ---------------------------------------------------------------- 15. historia */

  head(`${who} — 15. historia: the whole walk, read back off the documents`);
  await go(clientUrl);
  const jobs = await page.$$eval("#crm-client-jobs > li", (li) =>
    li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
  check("the client's job is listed", jobs.some((r) => r.includes("Łazienka QA")), jobs.join(" | "));
  const quotes = await page.$$eval("#crm-client-quotes > li", (li) =>
    li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
  check("the quote priced from their project is theirs",
    quotes.some((r) => r.includes("Łazienka QA — wycena")), quotes.join(" | "));
  check("and it carries the total the quote screen showed",
    quotes.some((r) => digits(r).includes(String(sub + marginMinor))), quotes.join(" | "));

  const history = await page.$$eval("#crm-history > li", (li) =>
    li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
  check("the history has a row for every document the walk wrote",
    history.length >= 5, `${history.length}: ${history.join(" | ")}`);
  check("the client is in it", history.some((r) => r.includes("Jan Kowalski")), history.join(" | "));
  check("the job is in it", history.some((r) => r.includes("Łazienka QA")), history.join(" | "));
  check("the quote is in it",
    history.some((r) => r.includes("Łazienka QA — wycena")), history.join(" | "));
  check("the saved calculation is in it, and the hand-typed cost beside it",
    history.some((r) => r.includes("Wywóz gruzu")), history.join(" | "));
  check("nothing scrolls sideways", (await overflow(page)) <= 1, `${await overflow(page)}px`);

  /* ------------------------------------------- 16. the four switches, mid-journey */

  /* The chapter's "dodatkowo sprawdzić" list is not four separate products — it is four
     switches a visitor throws while they are in the middle of something. So they are
     thrown here, on the screens the walk has just filled with data, rather than on an
     empty page where nothing can be lost. */

  head(`${who} — 16. the language switched with a quote open`);
  const second = lang === "pl" ? "de" : "pl";
  await go(quoteUrl);
  const beforeSwitch = minorOf(await textOf(page, "#quo-fig-total"));
  const otherQuoteUrl = `${urlQuotes(second)}?id=${encodeURIComponent(quote.id)}`;
  eq("the language link carries the quote across", 
    await page.getAttribute(`.foot-langs a[data-lang="${second}"]`, "href"), otherQuoteUrl);
  await follow(`.foot-langs a[data-lang="${second}"]`, otherQuoteUrl);
  eq("the other language opened", await page.getAttribute("html", "lang"), second);
  eq("the same quote is on the screen",
    (await textOf(page, "#quo-body")).includes("Łazienka QA — wycena"), true);
  eq("its total did not move because the words did",
    minorOf(await textOf(page, "#quo-fig-total")), beforeSwitch);
  eq("chapter VI: the currency is not the language, and did not follow it",
    await page.inputValue("#currency-select"), cur);
  await follow(`.foot-langs a[data-lang="${lang}"]`, quoteUrl);

  head(`${who} — 16b. the currency switched with a priced project open`);
  await go(openProject);
  const beforeCur = {
    qty: (await textOf(page, `${MATS} li[data-id="${matId}"]`)).replace(/\s+/g, " ").trim(),
    total: minorOf(await textOf(page, "#ws-project-total")),
  };
  const swap = cur === "EUR" ? "USD" : "EUR";
  await pickCurrency(swap);
  eq("an amount already stored keeps the currency it was saved in",
    (await store(page)).shoppingItems[0].currencyCode, cur);
  eq("so the project's sum is the same money it was",
    minorOf(await textOf(page, "#ws-project-total")), beforeCur.total);
  eq("and no physical quantity moved",
    (await textOf(page, `${MATS} li[data-id="${matId}"]`)).replace(/\s+/g, " ").trim(),
    beforeCur.qty);
  await pickCurrency(cur);

  head(`${who} — 16c. the theme switched by the button, not by a planted key`);
  // Three states since session 51, cycled in one order: system -> light -> dark -> system.
  // The walk starts on a planted light or dark, so one click lands on the next one along,
  // and the whole cycle brings it home. What is checked is the same thing as before —
  // that the button, and not a planted key, is what moves the page — plus the state that
  // used to be unreachable: "system", where nothing is stored at all.
  const CYCLE = ["system", "light", "dark"];
  const nextMode = (m) => CYCLE[(CYCLE.indexOf(m) + 1) % CYCLE.length];
  const waitMode = (m) => page.waitForFunction(
    (x) => document.documentElement.getAttribute("data-theme-mode") === x, m, { timeout: 5000 });

  eq("the planted theme reads back as a chosen mode",
    await page.getAttribute("html", "data-theme-mode"), theme);
  const stepped = nextMode(theme);
  await page.click("#theme-toggle");
  await waitMode(stepped);
  eq("the choice is remembered",
    await page.evaluate(() => localStorage.getItem("liczmat-theme")),
    stepped === "system" ? null : stepped);
  if (stepped === "system") {
    eq("and the system state stores nothing and stamps no theme",
      await page.getAttribute("html", "data-theme"), null);
  }
  await go(openProject);
  eq("and it survives a navigation", await page.getAttribute("html", "data-theme-mode"), stepped);
  // Round the rest of the cycle, back to where the walk planted it.
  for (let m = nextMode(stepped); ; m = nextMode(m)) {
    await page.click("#theme-toggle");
    await waitMode(m);
    if (m === theme) break;
  }
  eq("the cycle comes home", await page.getAttribute("html", "data-theme"), theme);

  head(`${who} — 16d. the Back button, walked back up chapter XXIV's chain`);
  await go(clientUrl);
  await follow("#crm-client-jobs li a", jobUrl);
  await page.goBack({ waitUntil: "load" });
  await page.waitForSelector("html[data-crm-ready]");
  eq("Back is the client the job was opened from",
    new URL(page.url()).pathname + new URL(page.url()).search, clientUrl);
  eq("with their name still on the screen",
    (await textOf(page, "#crm-client-body")).includes("Jan Kowalski"), true);

  head(`${who} — 16e. signed out again: the wall goes back up, the counting does not`);
  const out = watch(await ctx.newPage());
  await out.addInitScript(([email, password]) => {
    window.__fbAccounts = {
      [email]: {
        password,
        user: {
          uid: "uid-0", email, emailVerified: false, displayName: "",
          providerData: [{ providerId: "password" }],
        },
      },
    };
    window.__fbSeed = {};
  }, [EMAIL, PASSWORD]);
  await out.goto(base + URL_APP, { waitUntil: "domcontentloaded" });
  await out.waitForSelector("html[data-app-ready]", { state: "attached", timeout: 15000 });
  await out.fill("#signin-email", EMAIL);
  await out.fill("#signin-password", PASSWORD);
  await out.click("#signin-form button[type=submit]");
  await out.locator("#app-workspace").waitFor({ state: "visible", timeout: 10000 });
  await out.click("#app-signout");
  await out.locator("#app-auth").waitFor({ state: "visible", timeout: 10000 });
  eq("signing out clears the session hint", await level(out), null);
  await out.close();

  /* Chapter II and FIRESTORE_SYNC §1.2: counting never requires an account, and the
     workspace is this browser's. So the project and its material have to be exactly where
     they were — signing out is not a wipe.

     What signing out DOES take away, since 2026-09-03, is the money: `costs` is Pro, and
     the wall goes back up in front of the three figures. The two halves are checked apart
     on purpose. The amount is still in the store, byte for byte — a lapsed plan withholds
     a figure, it does not delete somebody's work — and it is no longer on the screen. */
  await go(openProject);
  eq("the project is still here", (await store(page)).projects.length, 1);
  eq("with its material still on the list",
    await page.locator(`${MATS} li[data-id="${matId}"]`).count(), 1);
  const kept = await store(page);
  eq("the price it was given is still in the store",
    kept.shoppingItems.find((s) => s.id === matId).estimatedCostMinor, materialsMinor);
  eq("and so is the cost nobody calculated",
    kept.estimations.find((e) => (e.inputJson || "").includes("manual")).totalCostMinor,
    OTHER_MINOR);
  eq("but the three figures are behind the wall again",
    await page.locator("#cost-tool").isHidden(), true);
  eq("with the wall in their place", await page.locator("#cost-gate").isHidden(), false);
  eq("and the total is not printed anywhere on the screen",
    await page.locator("#ws-project-total").isVisible(), false);
  eq("the PDF export is shut too", await page.locator("#pdf-tool").isHidden(), true);
  eq("the header's account button drops its mark",
    await page.getAttribute(".nav-cta[data-account-cta]", "data-level"), null);

  await go(urlClients(lang));
  eq("the Pro module is behind the wall again",
    await page.locator("#crm-gate").isHidden(), false);
  /* Chapter XXV's path has two rungs and one visitor stands on one of them. A guest is
     offered the account, never the upgrade: there is no account for a plan to sit on. */
  eq("a guest is offered the account rung",
    await page.locator('#crm-gate [data-pw-step="account"]').first().isHidden(), false);
  eq("and not the upgrade, which they have nowhere to put",
    await page.locator('#crm-gate [data-pw-step="upgrade"]').first().isHidden(), true);
  eq("the client rows were not deleted by any of it",
    (await crmStore(page)).clients.length, 1);

  /* ------------------------------------------------- what held for the whole walk */

  head(`${who} — 17. what has to have held at every step`);
  eq("the theme survived fifteen navigations",
    await page.getAttribute("html", "data-theme"), theme);
  eq("so did the language", await page.getAttribute("html", "lang"), lang);
  eq("and the currency", await page.inputValue("#currency-select"), cur);
  check("chapter VI: nothing on the site converted an amount at a rate",
    (await crmStore(page)).quotes[0].currencyCode === cur
    && (await store(page)).estimations.every((e) => e.currencyCode === cur));
  check("not one console error in the whole walk",
    page.lmErrors.length === 0, page.lmErrors.join("\n      "));

  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ the walks */

/**
 * Five journeys, chosen so every value of every axis chapter XXXVI names is walked from
 * end to end at least once: four languages, four currencies, both themes, both viewports.
 * The fifth pairs German with PLN on purpose — the other four pair each language with its
 * own default currency, and a walk where the two always agree cannot catch a screen that
 * reads the currency off the language.
 */
const WALKS = [
  { lang: "pl", cur: "PLN", theme: "light", width: 1280 },
  { lang: "uk", cur: "UAH", theme: "dark", width: 390 },
  { lang: "de", cur: "EUR", theme: "dark", width: 1280 },
  { lang: "en", cur: "USD", theme: "light", width: 390 },
  { lang: "de", cur: "PLN", theme: "light", width: 1280 },
];

for (const cfg of WALKS) await walk(cfg);

/* ------------------------------------------------------------------ report */

await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nfinal QA: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
