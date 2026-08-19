#!/usr/bin/env node
/**
 * LiczMat — the terminarz, in a real browser.
 *
 *     node scripts/test-calendar-page.mjs
 *
 * Master plan, session 25, in the half that needs a browser: chapter XXIII clicked
 * through — five buckets filled from real jobs, a deadline typed onto an undated one and
 * the row moving because of it, a row opening the job it stands for, the closed half, the
 * Pro notice, four languages, the currency switch, the widths chapter XXVIII names and the
 * no-script variant. The pure logic half is scripts/test-calendar.mjs and needs nothing
 * installed.
 *
 * **Nothing is stubbed.** /terminarz/ touches no network: the jobs are localStorage in
 * this browser. So the test opens the real page, clicks what a visitor clicks, and reads
 * both what was drawn and what went into storage.
 *
 * The fixture's deadlines are computed against the day the test runs, because the page
 * measures against the day the visitor is on. Node and the browser are both pinned to
 * Europe/Warsaw so the two agree on which day that is — which is also the point session
 * 25 makes about crmToday().
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-calendar-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

process.env.TZ = "Europe/Warsaw";

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlCalendar, urlJobs } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TZ = "Europe/Warsaw";

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
  console.log("test-calendar-page: Playwright not installed — skipping the browser tests.");
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
const T0 = Date.UTC(2026, 6, 1);
const sync = (at) => ({ createdAt: at, updatedAt: at, deletedAt: null, schemaVersion: 1 });

/** A calendar day `offset` days from today, in the timezone both sides are pinned to. */
function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** One project, so a job has something to be done in. */
const workspace = () => ({
  projects: [{ id: "p1", name: "Remont łazienki", archived: false, ...sync(T0) }],
  rooms: [], estimations: [], shoppingItems: [],
});

/**
 * One job in each of chapter XXIII's five buckets, plus the two closed states: one that
 * had a deadline and one that never did. The dates move with the day the test runs on,
 * because the page measures against the day the visitor is on.
 */
const crm = () => ({
  clients: [{
    id: "c1", name: "Jan Kowalski", phone: "600 100 200", email: "", address: "",
    note: "", projectIds: ["p1"], archived: false, ...sync(T0),
  }],
  jobs: [
    job("j-late", "Zaległa hydraulika", day(-3), "active", 1_250_000),
    job("j-today", "Malowanie dziś", day(0), "new", null),
    job("j-soon", "Gres w tym tygodniu", day(3), "active", null),
    job("j-later", "Poddasze za miesiąc", day(30), "new", null),
    job("j-none", "Altana bez daty", "", "new", null),
    job("j-done", "Skończona łazienka", day(-10), "done", null),
    job("j-cancel", "Anulowana weranda", "", "cancelled", null),
  ],
  quotes: [],
});

function job(id, name, dueDate, status, valueMinor) {
  return {
    id, name, clientId: "c1", projectId: id === "j-late" ? "p1" : "",
    status, description: "", note: "", dueDate,
    valueMinor, currencyCode: valueMinor === null ? "" : "PLN",
    ...sync(T0 + 1 * DAY),
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
  const ctx = await browser.newContext({ timezoneId: TZ, ...options });
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
  if (opts.ready !== false) await page.waitForSelector(opts.ready || "html[data-schedule-ready]");
  page.errors = errors;
  return page;
}

const rows = (page, sel) =>
  page.$$eval(`${sel} > li`, (li) => li.map((n) => n.textContent.replace(/\s+/g, " ").trim()));
const ids = (page, sel) => page.$$eval(`${sel} > li`, (li) => li.map((n) => n.dataset.id));
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("liczmat-crm-v1") || "{}"));
const jobById = async (page, id) => ((await store(page)).jobs || []).find((j) => j.id === id);

const CAL = urlCalendar("pl");
const ctx = await context({ viewport: { width: 1280, height: 900 } });

/* ---------------------------------------------------- 1. the buckets */

head("1. every job lands in the bucket its deadline puts it in");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  eq("the late one", (await ids(page, "#cal-list-late")).join(), "j-late");
  eq("the one due today", (await ids(page, "#cal-list-today")).join(), "j-today");
  eq("the one due this week", (await ids(page, "#cal-list-soon")).join(), "j-soon");
  eq("the one further out", (await ids(page, "#cal-list-later")).join(), "j-later");
  eq("and the one nobody dated", (await ids(page, "#cal-list-none")).join(), "j-none");

  eq("the count of late jobs is on the page", (await page.textContent("#cal-fig-late")).trim(), "1");
  eq("and of today's", (await page.textContent("#cal-fig-today")).trim(), "1");
  eq("and of this week's", (await page.textContent("#cal-fig-soon")).trim(), "1");
  check("each heading carries its own count",
    (await page.textContent("#cal-h-late")).includes("(1)"),
    await page.textContent("#cal-h-late"));
  check("today's date is said out loud",
    (await page.textContent("#cal-today")).trim().length > 5,
    await page.textContent("#cal-today"));
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

head("1b. a row carries chapter XXIII's basic information and nothing more");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  const late = (await rows(page, "#cal-list-late"))[0];
  check("the job's name", late.includes("Zaległa hydraulika"), late);
  check("who it is for", late.includes("Jan Kowalski"), late);
  check("which of the four states it is in", late.includes("W toku"), late);
  check("and what was agreed for it", /12\s?500/.test(late), late);

  // The distance to the deadline, in words, from the browser's own locale data.
  const rel = await page.textContent("#cal-list-late .cal-rel");
  check("the row says how far past the deadline it is", rel.trim().length > 0, rel);
  check("and marks it as late rather than only colouring it",
    await page.$eval("#cal-list-late .cal-rel", (n) => n.classList.contains("job-due-late")));
  const soonRel = await page.textContent("#cal-list-soon .cal-rel");
  check("a job that is not late is not marked as one",
    !(await page.$eval("#cal-list-soon .cal-rel", (n) => n.classList.contains("job-due-late"))),
    soonRel);
  await page.close();
}

head("1c. the closed half holds the finished job that had a date, and only that");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  eq("the disclosure is there", await page.$eval("#cal-closed", (n) => n.hidden), false);
  eq("with the one closed job that carried a deadline",
    (await ids(page, "#cal-closed-list")).join(), "j-done");
  check("a closed job with no date is on no list at all",
    !(await page.content()).includes("Anulowana weranda"));
  check("and a finished job is never counted as late",
    (await page.textContent("#cal-fig-late")).trim() === "1");
  // A closed job is a record: its date is text, not a control that invites an edit.
  eq("the closed row carries no date input",
    await page.$$eval("#cal-closed-list .cal-due", (n) => n.length), 0);
  await page.close();
}

head("1d. an empty store says what it is waiting for");
{
  const page = await open(ctx, CAL, { workspace: workspace() });
  eq("the note is shown", await page.$eval("#cal-empty", (n) => n.hidden), false);
  for (const b of ["late", "today", "soon", "later", "none"]) {
    eq(`the "${b}" bucket is absent rather than empty`,
      await page.$eval(`#cal-sec-${b}`, (n) => n.hidden), true);
  }
  eq("and so is the closed half", await page.$eval("#cal-closed", (n) => n.hidden), true);
  await page.close();
}

/* ---------------------------------------------------- 2. the one write */

head("2. a deadline typed here is the job's own field");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  const target = day(2);
  await page.fill("#cal-list-none .cal-due", target);
  await page.waitForFunction((id) => {
    const el = document.querySelector("#cal-list-soon");
    return el && [...el.children].some((li) => li.dataset.id === id);
  }, "j-none");

  const stored = await jobById(page, "j-none");
  eq("the date is on the job", stored.dueDate, target);
  eq("the job's name is untouched", stored.name, "Altana bez daty");
  eq("its status too", stored.status, "new");
  eq("and its client", stored.clientId, "c1");
  eq("the undated bucket is empty now", await page.$eval("#cal-sec-none", (n) => n.hidden), true);
  eq("and the week's bucket holds two", (await ids(page, "#cal-list-soon")).length, 2);
  await page.close();
}

head("2b. clearing a date puts the job back on the undated list");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  await page.fill("#cal-list-later .cal-due", "");
  await page.waitForFunction((id) => {
    const el = document.querySelector("#cal-list-none");
    return el && [...el.children].some((li) => li.dataset.id === id);
  }, "j-later");
  eq("the field is empty on the job too", (await jobById(page, "j-later")).dueDate, "");
  eq("and the bucket it left is gone", await page.$eval("#cal-sec-later", (n) => n.hidden), true);
  await page.close();
}

head("2c. the control shows the date it is holding");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  eq("the late job's own deadline is in its field",
    await page.inputValue("#cal-list-late .cal-due"), day(-3));
  eq("and an undated job's field is empty",
    await page.inputValue("#cal-list-none .cal-due"), "");
  await page.close();
}

/* ---------------------------------------------------- 3. the row opens the job */

head("3. a row is a job, and its name opens the page that owns it");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm() });
  const href = await page.$eval("#cal-list-late a", (a) => a.getAttribute("href"));
  check("the link carries the job's id", href.includes("j-late"), href);
  check("and points at the jobs page", href.includes(urlJobs("pl")), href);

  await page.click("#cal-list-late a");
  await page.waitForSelector("#job-body:not([hidden])");
  eq("which opens that job", (await page.textContent("#job-title")).trim(), "Zaległa hydraulika");
  eq("with the same deadline on it", await page.inputValue("#job-due"), day(-3));
  await page.close();
}

head("3b. the terminarz has no screen of its own to open");
{
  // The module stores nothing, so there is no row it owns — an id in the address is
  // meaningless here and must not produce a second, half-drawn screen.
  const page = await open(ctx, `${CAL}?id=j-late`, { workspace: workspace(), crm: crm() });
  eq("an id in the address changes nothing", (await ids(page, "#cal-list-late")).join(), "j-late");
  eq("the buckets are still all there", (await ids(page, "#cal-list-none")).join(), "j-none");
  check("no error in the console", page.errors.length === 0, page.errors.join("\n      "));
  await page.close();
}

/* ---------------------------------------------------- 4. chapter XXV */

head("4. chapter XXV's paywall: the wall, the two rungs and the one door through it");
{
  /* The wall, with nothing planted: a guest gets the paywall instead of the tool. */
  const guest = await open(ctx, CAL, { workspace: workspace(), crm: crm(), pro: false });
  eq("the module is replaced by the wall", await guest.$eval("#cal-tool", (n) => n.hidden), true);
  eq("and the wall is on screen", await guest.$eval("#cal-gate", (n) => n.hidden), false);
  eq("the strip above it is gone — the wall says all of it",
    await guest.$eval("#cal-pro", (n) => n.hidden), true);
  // Chapter XXV's Free → Pro path, one rung: a guest has no account for a plan to sit on.
  eq("a guest is sent to make an account",
    await guest.$eval('#cal-gate [data-pw-step="account"]', (n) => n.hidden), false);
  eq("and is not offered an upgrade they cannot put anywhere",
    await guest.$eval('#cal-gate [data-pw-step="upgrade"]', (n) => n.hidden), true);
  check("the sign-up link comes back to this page",
    await guest.$eval('#cal-gate [data-pw-step="account"] a', (n) => n.getAttribute("href"))
      === `/app/?mode=signup&next=${encodeURIComponent(CAL)}`);
  await guest.close();

  /* A free account meets the same wall and the other rung. */
  const free = await open(ctx, CAL, { workspace: workspace(), crm: crm(), level: "liczmat", pro: false });
  eq("the wall stands for a free account too",
    await free.$eval("#cal-gate", (n) => n.hidden), false);
  eq("and it is told its plan rather than told to sign up",
    await free.$eval('#cal-gate [data-pw-step="upgrade"]', (n) => n.hidden), false);

  /* Session 28: the wall quotes a price instead of offering a way round itself. The
     amounts come from assets/pay.js in the visitor's currency, and no Payment Link is
     configured, so the page says the subscription is not open yet — and offers no
     button that would take money. */
  eq("the monthly plan is priced", await free.$eval('#cal-gate [data-pw-plan="monthly"]', (n) => n.hidden), false);
  eq("and the yearly one", await free.$eval('#cal-gate [data-pw-plan="yearly"]', (n) => n.hidden), false);
  check("with a real amount in it",
    /[0-9]/.test(await free.$eval('#cal-gate [data-pw-plan="monthly"] [data-pw-price]', (n) => n.textContent)),
    await free.$eval('#cal-gate [data-pw-plan="monthly"] [data-pw-price]', (n) => n.textContent));
  eq("the site says the subscription is not open yet",
    await free.$eval("#cal-gate [data-pw-soon]", (n) => n.hidden), false);
  eq("and offers nothing to click that would charge",
    await free.$eval("#cal-gate [data-pw-buy]", (n) => n.hidden), true);
  check("no Stripe link stands on this page",
    (await free.content()).indexOf("stripe.com") === -1);
  /* The wall stays up. Nothing on this page can open it — the level is the only input,
     and it comes from Firebase by way of /app/. */
  eq("the wall is still standing", await free.$eval("#cal-gate", (n) => n.hidden), false);
  eq("and the module is still behind it", await free.$eval("#cal-tool", (n) => n.hidden), true);
  await free.close();

  /* A Pro account walks straight in, and is told which plan opened it. */
  const pro = await open(ctx, CAL, { workspace: workspace(), crm: crm(), level: "pro", pro: false });
  eq("no wall for a Pro account", await pro.$eval("#cal-gate", (n) => n.hidden), true);
  eq("the module is there", await pro.$eval("#cal-tool", (n) => n.hidden), false);
  check("the chip names the plan they are on",
    (await pro.textContent("#cal-pro-chip")).includes("Pro"));
  eq("the chip is the one that marks a plan somebody has",
    await pro.$eval("#cal-pro-chip", (n) => n.classList.contains("on")), true);
  /* A paying account is shown the plan and nothing else: no price, and nothing offering
     to sell them what they already have. */
  /* The whole wall is hidden for them, so the price it carries is hidden with it:
     nothing offers to sell somebody what they are already paying for. */
  eq("and is not quoted a price for what they already pay for",
    await pro.locator('#cal-gate [data-pw-plan="monthly"]').isVisible(), false);
  await pro.close();
}

head("4b. the footer offers the page to a Pro account and to a crawler");
{
  const footLink = `footer.site a[href$="${urlCalendar("pl")}"]:not([data-lang])`;
  const guest = await open(ctx, CAL, { workspace: workspace() });
  const shown = await guest.$$eval(footLink, (a) =>
    a.filter((n) => n.getBoundingClientRect().height > 0).length);
  eq("a guest is not offered the link", shown, 0);
  check("though the markup still carries it, which is what a crawler reads",
    (await guest.$$eval(footLink, (a) => a.length)) > 0);
  await guest.close();

  const pro = await open(ctx, CAL, { workspace: workspace(), level: "pro" });
  const proShown = await pro.$$eval(footLink, (a) =>
    a.filter((n) => n.getBoundingClientRect().height > 0).length);
  check("a Pro account is", proShown > 0, String(proShown));
  await pro.close();
}

/* ---------------------------------------------------- 5. languages, currency, widths */

head("5. the same deadlines read in four languages");
{
  const phrases = [];
  for (const lang of LANGS) {
    const page = await open(ctx, urlCalendar(lang), { workspace: workspace(), crm: crm(), lang });
    eq(`${lang}: the buckets hold the same jobs`,
      (await ids(page, "#cal-list-late")).join(), "j-late");
    const headings = await page.$$eval(".cal-sec:not([hidden]) h2",
      (h) => h.map((n) => n.textContent.trim()));
    eq(`${lang}: five buckets are drawn`, headings.length, 5);
    check(`${lang}: nothing shows a raw dictionary key`,
      !(await page.content()).includes("cal_") && !(await page.content()).includes("job_st_"), lang);
    const rel = (await page.textContent("#cal-list-soon .cal-rel")).trim();
    check(`${lang}: the distance to the deadline is in words`, rel.length > 0, rel);
    phrases.push(rel);
    check(`${lang}: today's date is written the way this language writes one`,
      (await page.textContent("#cal-today")).trim().length > 5);
    check(`${lang}: no error in the console`, page.errors.length === 0,
      page.errors.join("\n      "));
    await page.close();
  }
  // Four languages, four wordings — the browser's own plural rules, not the dictionary's.
  check("and the wording really changes with the language", new Set(phrases).size > 1,
    phrases.join(" | "));
}

head("5b. the currency is the visitor's, and an agreed amount keeps its own");
{
  const page = await open(ctx, CAL, { workspace: workspace(), crm: crm(), currency: "EUR" });
  const late = (await rows(page, "#cal-list-late"))[0];
  // Chapter VI: nothing is converted. The value was agreed in PLN and stays PLN.
  check("the agreed value stays in the currency it was agreed in", /zł|PLN/.test(late), late);
  await page.close();
}

head("5c. chapter XXVIII: the page holds together at every width it names");
{
  for (const width of [320, 375, 390, 430, 768, 1280]) {
    const narrow = await context({ viewport: { width, height: 900 } });
    const page = await open(narrow, CAL, { workspace: workspace(), crm: crm() });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width}px: nothing spills sideways`, overflow <= 1, `${overflow}px over`);
    check(`${width}px: the late job is on screen`,
      await page.$eval("#cal-list-late > li", (n) => n.getBoundingClientRect().width > 0));
    check(`${width}px: and its date control with it`,
      await page.$eval("#cal-list-late .cal-due", (n) => n.getBoundingClientRect().width > 0));
    await page.close();
    await narrow.close();
  }
}

/* ---------------------------------------------------- 6. no JavaScript */

head("6. with JavaScript off the page is still an honest page");
{
  const noJs = await context({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await noJs.newPage();
  await page.goto(base + CAL, { waitUntil: "load" });
  const html = await page.content();
  check("the module is named", html.includes("Terminarz"));
  check("and said to be LiczMat Pro — chapter XXV", html.includes("LiczMat Pro"));
  for (const word of ["Po terminie", "Dziś", "W ciągu 7 dni", "Później", "Bez terminu"]) {
    check(`the bucket "${word}" is readable without a script`, html.includes(word));
  }
  check("the honest note about the store is there", html.includes("localStorage"));
  check("and the one saying the module stores nothing of its own",
    html.includes("Termin jest polem zlecenia"));
  eq("no row is drawn, because the jobs come out of storage",
    await page.$$eval("#cal-list-late > li", (li) => li.length), 0);
  check("the footer still names the page for a crawler",
    (await page.$$eval(`a[href$="${urlCalendar("pl")}"]`, (a) => a.length)) > 0);
  await page.close();
  await noJs.close();
}

/* ------------------------------------------------------------------ report */

await ctx.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nschedule page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
