#!/usr/bin/env node
/**
 * LiczMat — /liczmat-pro/ in a real browser.
 *
 *     node scripts/test-propage-page.mjs
 *
 * Master plan, session 29 (STRONA LICZMAT PRO), in the half that needs a browser: the
 * price in the visitor's own currency, the currency switched while the page is open, a
 * Pro account shown their plan instead of a price, the ten languages each carrying their
 * own addresses, the widths chapter XXVIII names — and the variant that matters most on
 * a page whose job is to be read: no JavaScript at all, where the amount is still on the
 * screen because the build wrote it into the HTML.
 *
 * The pure logic half is scripts/test-propage.mjs and needs nothing installed.
 *
 * **Nothing is stubbed.** The page touches no network: it loads assets/pay.js, which is
 * a table of fourteen hand-typed amounts, and assets/paywall.js, which prints one of
 * them. There is no account, no Firebase and no store to plant — the only thing this
 * page ever asks the browser is which currency and which level it was last told about.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-propage-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

process.env.TZ = "Europe/Warsaw";

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlHome, urlLiczmatPro, urlCalcIndex, urlProjects } from "../src/site.mjs";
import { DEFAULT_CURRENCY, MONEY_LOCALE } from "../src/currency.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TZ = "Europe/Warsaw";
const read = (file) => readFileSync(join(ROOT, file), "utf8");

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
  console.log("test-propage-page: Playwright not installed — skipping the browser tests.");
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

/* The price list, read the way the browser reads it — so this test knows what the page
   is supposed to be printing without a second copy of the fourteen amounts. */
const { lmPayPrice } = new Function(`${read("assets/pay.js")}\nreturn { lmPayPrice };`)();
const money = (minor, code, lang) => new Intl.NumberFormat(MONEY_LOCALE[lang], {
  style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(minor / 100);
const priceIn = (code, lang, planId) => money(lmPayPrice(planId, code), code, lang);
const digits = (s) => String(s).replace(/[^0-9]/g, "");

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
  const ctx = await browser.newContext({ timezoneId: TZ, ...options });
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

/**
 * Open the page with whatever this browser is supposed to remember.
 *
 * `level` is `liczmat-signed-in`, the copy hint assets/account.js keeps — the only thing
 * the page asks about the visitor, and it asks in order to stop quoting a price to
 * somebody who already pays it.
 */
async function open(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const plant = { "materio-lang": opts.lang === undefined ? "pl" : opts.lang };
  if (opts.currency) plant["liczmat-currency"] = opts.currency;
  if (opts.level) plant["liczmat-signed-in"] = opts.level;

  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    Object.entries(entries).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }, plant);

  await page.goto(base + url, { waitUntil: "load" });
  page.errors = errors;
  return page;
}

const PRO = urlLiczmatPro("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the page a guest reads */

head("1. what a visitor with no account sees");
{
  const page = await open(ctx, PRO);

  eq("the page is the one about Pro", await page.textContent("h1"), "LiczMat Pro");
  eq("the five modules are on it", await page.locator(".pro-mod").count(), 5);
  for (const name of ["Klienci", "Zlecenia", "Wyceny", "Terminarz", "Historia i CRM"]) {
    check(`${name} is named`, (await page.textContent("main")).includes(name));
  }

  // The price, in this language's currency, drawn by assets/paywall.js out of the amount
  // the build already wrote — the two agree, so nothing moves when the script runs.
  eq("the monthly price is the złoty one",
    (await page.textContent('[data-pw-plan="monthly"] [data-pw-price]')).trim(),
    priceIn("PLN", "pl", "monthly"));
  eq("and so is the yearly one",
    (await page.textContent('[data-pw-plan="yearly"] [data-pw-price]')).trim(),
    priceIn("PLN", "pl", "yearly"));
  eq("both plans are visible", await page.locator(".pw-plan:visible").count(), 2);

  // The subscription has not opened, so the page says so and offers no way to pay.
  eq("the page says the subscription is not open yet",
    await page.locator("[data-pw-soon]").isVisible(), true);
  eq("and offers no checkout", await page.locator("[data-pw-buy]").isVisible(), false);
  check("no Stripe address anywhere on it",
    !(await page.content()).includes("stripe.com"));

  // Nothing on a public page is withheld, and nothing on it is a wall.
  eq("there is no paywall on the page that explains the paywall",
    await page.locator(".pw-gate").count(), 0);
  eq("a guest is not told they already have Pro",
    await page.locator("#pro-yours").isVisible(), false);

  // The way in, and the way back to it.
  const signup = page.locator('a[href*="mode=signup"]');
  eq("the sign-up link is offered once", await signup.count(), 1);
  check("and it comes back to this page",
    (await signup.getAttribute("href")).includes(encodeURIComponent(PRO)));

  eq("no error in the console", page.errors.join(" | "), "");
  await page.close();
}

/* ---------------------------------------------------- 2. the currency */

head("2. the amount follows the currency, and nothing is converted");
{
  // Somebody reading the Polish page with the euro chosen sees the euro price — the
  // hand-typed one, not the złoty price divided by a rate.
  const page = await open(ctx, PRO, { currency: "EUR" });
  eq("the monthly price is the euro one",
    (await page.textContent('[data-pw-plan="monthly"] [data-pw-price]')).trim(),
    priceIn("EUR", "pl", "monthly"));
  check("which is not the złoty amount with a different symbol",
    priceIn("EUR", "pl", "monthly").replace(/\D/g, "") !== priceIn("PLN", "pl", "monthly").replace(/\D/g, ""));

  // Switched while the page is open: no reload, and the figure follows.
  await page.selectOption("#currency-select", "CZK");
  await page.waitForFunction((want) => {
    const el = document.querySelector('[data-pw-plan="monthly"] [data-pw-price]');
    return el && el.textContent.trim() === want;
  }, priceIn("CZK", "pl", "monthly"), { timeout: 3000 }).catch(() => {});
  eq("switching the currency rewrites the amount in place",
    (await page.textContent('[data-pw-plan="monthly"] [data-pw-price]')).trim(),
    priceIn("CZK", "pl", "monthly"));
  eq("and the yearly one with it",
    (await page.textContent('[data-pw-plan="yearly"] [data-pw-price]')).trim(),
    priceIn("CZK", "pl", "yearly"));
  eq("no error in the console", page.errors.join(" | "), "");
  await page.close();
}

/* ---------------------------------------------------- 3. somebody who already pays */

head("3. a Pro account is shown their plan, not a price");
{
  const page = await open(ctx, PRO, { level: "pro" });
  eq("the price block is hidden", await page.locator("#pro-pay").isVisible(), false);
  eq("and the plan is what stands there", await page.locator("#pro-yours").isVisible(), true);
  check("said as the chip that marks a plan somebody has",
    await page.$eval("#pro-yours .chip", (n) => n.classList.contains("on")));
  // Everything else about the product is still readable: this is the page that describes
  // Pro, and a subscriber is allowed to read what they are paying for.
  eq("the five modules are still described", await page.locator(".pro-mod").count(), 5);
  await page.close();

  // A free account is quoted the price, exactly like a guest: they are the visitor the
  // page is for.
  const free = await open(ctx, PRO, { level: "liczmat" });
  eq("a free account is shown the price", await free.locator("#pro-pay").isVisible(), true);
  eq("and is not told they have Pro", await free.locator("#pro-yours").isVisible(), false);
  await free.close();
}

/* ---------------------------------------------------- 4. ten languages */

head("4. ten languages, each with its own addresses and its own currency");
for (const lang of LANGS) {
  const url = urlLiczmatPro(lang);
  const page = await open(ctx, url, { lang });
  const code = DEFAULT_CURRENCY[lang];

  eq(`${lang}: the page is served`, page.url(), base + url);
  /* Compared as digits rather than as a string: Node and Chromium ship different ICU
     data, and for uk-UA one writes the hryvnia as "₴" and the other as "грн". The amount
     is the same amount, and it is the amount that has to be right — every one of the
     seven currencies has different digits, so this still catches a page priced in the
     wrong one. */
  eq(`${lang}: the price is the one for ${code}`,
    digits(await page.textContent('[data-pw-plan="monthly"] [data-pw-price]')),
    digits(priceIn(code, lang, "monthly")));
  check(`${lang}: and it is written as money, not as a bare number`,
    /[^\d\s.,\u00a0]/.test(await page.textContent('[data-pw-plan="monthly"] [data-pw-price]')),
    await page.textContent('[data-pw-plan="monthly"] [data-pw-price]'));

  // The links out of the page stay inside this language. A German page sending somebody
  // to /kalkulatory/ is the mistake a per-language URL exists to prevent.
  const hrefs = await page.$$eval("main a[href]", (a) => a.map((n) => n.getAttribute("href")));
  check(`${lang}: the calculators are linked in this language`, hrefs.includes(urlCalcIndex(lang)));
  check(`${lang}: the projects are linked in this language`, hrefs.includes(urlProjects(lang)));
  check(`${lang}: the breadcrumb goes home in this language`, hrefs.includes(urlHome(lang)));

  eq(`${lang}: no error in the console`, page.errors.join(" | "), "");
  await page.close();
}

head("4b. the language picker moves between the ten copies of this page");
{
  const page = await open(ctx, PRO);
  const links = await page.$$eval(".lang-menu a[data-lang], .lang-list a[data-lang], a[data-lang]",
    (a) => a.map((n) => [n.getAttribute("data-lang"), n.getAttribute("href")]));
  for (const lang of LANGS) {
    const found = links.find(([code]) => code === lang);
    check(`${lang} is offered`, Boolean(found), links.map((l) => l.join("=")).join(" "));
    if (found) eq(`${lang} points at its own copy of this page`, found[1], urlLiczmatPro(lang));
  }
  await page.close();
}

/* ---------------------------------------------------- 5. the widths */

head("5. chapter XXVIII: it fits every width without scrolling sideways");
for (const width of [320, 375, 390, 430, 768, 1280]) {
  const c = await context({ viewport: { width, height: 900 } });
  const page = await open(c, PRO);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${width}px: nothing sticks out sideways`, overflow <= 1, `${overflow}px over`);
  eq(`${width}px: the price is readable`,
    await page.locator('[data-pw-plan="monthly"] [data-pw-price]').isVisible(), true);
  eq(`${width}px: no error in the console`, page.errors.join(" | "), "");
  await page.close();
  await c.close();
}

/* ---------------------------------------------------- 6. no JavaScript */

head("6. with no script at all — the page still says what Pro is and what it costs");
{
  const c = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await c.newPage();
  await page.goto(base + PRO, { waitUntil: "load" });

  eq("the page is there", await page.textContent("h1"), "LiczMat Pro");
  eq("the five modules are there", await page.locator(".pro-mod").count(), 5);
  eq("the monthly price is in the markup and visible",
    (await page.textContent('[data-pw-plan="monthly"] [data-pw-price]')).trim(),
    priceIn("PLN", "pl", "monthly"));
  eq("and the yearly one",
    (await page.textContent('[data-pw-plan="yearly"] [data-pw-price]')).trim(),
    priceIn("PLN", "pl", "yearly"));
  eq("the sentence about the subscription not being open is visible",
    await page.locator("[data-pw-soon]").isVisible(), true);
  eq("nothing offers to take money", await page.locator("[data-pw-buy]").isVisible(), false);
  eq("and nobody is told they have a plan", await page.locator("#pro-yours").isVisible(), false);
  await page.close();
  await c.close();
}

/* ---------------------------------------------------- 7. how the site gets here */

head("7. the site points at the page from the two places chapter X and XXV name");
{
  const home = await open(ctx, urlHome("pl"));
  const door = home.locator('.door a[href="/liczmat-pro/"]');
  eq("the third door of the home page is a link now", await door.count(), 1);
  eq("and it is offered, not hidden", await door.isVisible(), true);
  eq("no door still says it is in preparation",
    await home.locator(".door .door-soon").count(), 0);
  await home.close();

  // The footer carries it for everybody — unlike the four modules, which are offered to a
  // Pro account only. A page that explains Pro, hidden from everybody without Pro, would
  // be explaining it to the people who already know.
  const guest = await open(ctx, PRO);
  const foot = guest.locator('footer.site a[href="/liczmat-pro/"]:not([data-lang])');
  eq("the footer offers it to a guest", await foot.first().isVisible(), true);
  await guest.close();
}

/* ------------------------------------------------------------------ the result */

await ctx.close();
await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`pro page: ${passed}/${passed} checks pass`);
