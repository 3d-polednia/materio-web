#!/usr/bin/env node
/**
 * LiczMat — panel administratora, kliknięty w Chromium.
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-admin-page.mjs
 *
 * Sesja 49. `scripts/test-admin-map.mjs` sprawdza decyzję — kto pyta, o co pyta i co ma
 * zostać zapisane. Tutaj sprawdzane jest to, czego z pliku źródłowego nie widać: że panel
 * w ogóle się pojawia, i tylko temu, komu ma; że wysyła to, co pokazuje formularz; że
 * rysuje to, co odpowiedziała funkcja, i to po polsku; i że po wylogowaniu znika.
 *
 * Firebase jest podstawiony (`scripts/fake-firebase.mjs`) — kontener nie sięga gstatic —
 * a odpowiedzi funkcji są **wstawiane**, nie liczone: druga implementacja `adminPlan` w
 * teście byłaby drugą implementacją, wolną od zgadzania się z tą, która jedzie na produkcję.
 *
 * Bez Playwrighta ten plik kończy się kodem 0 i mówi, że się pominął.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FAKE_APP, FAKE_AUTH, FAKE_FUNCTIONS, FAKE_STORE } from "./fake-firebase.mjs";

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
  console.log("test-admin-page: Playwright not installed — skipping the browser tests.");
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

const DAY = 86400000;
const NOW = Date.now();

/** An account as the stub keeps them: plain JSON, claims included. */
const account = (email, claims) => ({
  [email]: {
    password: "haslo123",
    user: {
      uid: `uid-${email}`, email, emailVerified: true, displayName: "",
      providerData: [{ providerId: "password" }],
      ...(claims ? { claims } : {}),
    },
  },
});

const ADMIN = account("szef@liczmat.com", { admin: true });
const PLAIN = account("ktos@example.com", null);

/**
 * A context that cannot leave the machine and answers the four Firebase imports itself.
 *
 * Every request for assets/admin.js is counted, because "who downloads this file" is half
 * of what the session decided: /app/ is the heaviest page on the site and this panel is a
 * tool for one account.
 */
async function context(options) {
  const ctx = await browser.newContext(options);
  ctx.__adminFetches = 0;
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
    if (url.includes("/firebasejs/") && url.endsWith("firebase-functions.js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_FUNCTIONS });
    }
    if (url.startsWith(base)) {
      if (url.includes("/assets/admin.js")) ctx.__adminFetches++;
      return route.continue();
    }
    return route.abort();
  });
  return ctx;
}

/** Open /app/, planting the accounts and the answers the callable will give. */
async function openApp(ctx, opts = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) {
      errors.push(m.text());
    }
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(([accounts, answers, lang]) => {
    window.__fbAccounts = accounts;
    window.__fnAnswers = answers;
    localStorage.setItem("materio-lang", lang);
  }, [opts.accounts || {}, opts.answers || {}, opts.lang || "pl"]);
  await page.goto(`${base}/app/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html[data-app-ready]", { timeout: 15000 });
  page.__errors = errors;
  return page;
}

/** Sign in and wait for the workspace — and, when asked, for the admin tab to arrive. */
async function signIn(page, email, { admin = false } = {}) {
  await page.fill("#signin-email", email);
  await page.fill("#signin-password", "haslo123");
  await page.click("#signin-form button[type=submit]");
  await page.waitForSelector("#app-workspace:not([hidden])", { timeout: 10000 });
  if (admin) await page.waitForSelector("#tab-admin", { timeout: 10000 });
}

const result = (page) => page.locator("#admin-result").innerText();
const lastCall = (page) => page.evaluate(() => (window.__fnCalls || []).slice(-1)[0] || null);

/* ================================================================== 1. who gets it */

head("1. the panel is fetched for one account and for no other");
{
  const ctx = await context();

  const plain = await openApp(ctx, { accounts: PLAIN });
  await signIn(plain, "ktos@example.com");
  await plain.waitForTimeout(400);
  eq("a plain account has five tabs", await plain.locator(".app-tab").count(), 5);
  eq("and no admin tab", await plain.locator("#tab-admin").count(), 0);
  eq("and never downloaded the panel", ctx.__adminFetches, 0);
  check("the token was asked for anyway, so a fresh claim would be seen",
    (await plain.evaluate(() => (window.__fbCalls || []).some(([n]) => n === "idToken"))));
  check("and it was asked for fresh, not out of the cache",
    (await plain.evaluate(() => (window.__fbCalls || []).some(([n, v]) => n === "idToken" && v === true))));
  await plain.close();

  const boss = await openApp(ctx, { accounts: ADMIN });
  await signIn(boss, "szef@liczmat.com", { admin: true });
  eq("an admin account has six", await boss.locator(".app-tab").count(), 6);
  eq("the sixth is the admin tab", await boss.locator(".app-tab").last().innerText(), "Admin");
  eq("and the file was fetched exactly once", ctx.__adminFetches, 1);
  eq("the panel is closed until it is asked for",
    await boss.locator("#panel-admin").isVisible(), false);
  eq("the functions live in the region they are deployed to",
    await boss.evaluate(() => window.__fnRegion), "europe-central2");
  await boss.close();
  await ctx.close();
}

/* ================================================================== 2. opening it */

head("2. the tab opens by mouse and by keyboard, like the other five");
{
  const ctx = await context();
  const page = await openApp(ctx, { accounts: ADMIN, answers: {} });
  await signIn(page, "szef@liczmat.com", { admin: true });

  await page.click("#tab-admin");
  eq("clicking it opens the panel", await page.locator("#panel-admin").isVisible(), true);
  eq("and closes the one that was open", await page.locator("#panel-projects").isVisible(), false);
  eq("the tab says it is selected",
    await page.locator("#tab-admin").getAttribute("aria-selected"), "true");
  eq("and it points at the panel it opened",
    await page.locator("#tab-admin").getAttribute("aria-controls"), "panel-admin");
  eq("which points back", await page.locator("#panel-admin").getAttribute("aria-labelledby"), "tab-admin");

  /* The strip promises arrow-key navigation. Before session 49 the tabs were captured in
     an array at boot, so a tab appended later was clickable and invisible to the arrows. */
  await page.locator("#tab-admin").focus();
  await page.keyboard.press("ArrowLeft");
  eq("ArrowLeft from the admin tab lands on the one before it",
    await page.evaluate(() => document.activeElement.dataset.tab), "account");
  await page.keyboard.press("ArrowRight");
  eq("and ArrowRight comes back", await page.evaluate(() => document.activeElement.dataset.tab), "admin");
  await page.keyboard.press("ArrowRight");
  eq("past the end it wraps to the first",
    await page.evaluate(() => document.activeElement.dataset.tab), "projects");
  await page.keyboard.press("End");
  eq("End reaches the new tab too",
    await page.evaluate(() => document.activeElement.dataset.tab), "admin");

  const heading = await page.locator("#panel-admin h2").innerText();
  eq("the panel names itself", heading, "Panel administratora");
  eq("every field on it has a label",
    await page.$$eval("#panel-admin input", (els) => els.filter((el) =>
      !el.labels.length && !el.getAttribute("aria-label")).length), 0);
  await page.close();
  await ctx.close();
}

/* ================================================================== 3. what it sends */

head("3. what the form sends");
{
  const ctx = await context();
  const page = await openApp(ctx, {
    accounts: ADMIN,
    answers: {
      status: { ok: true, action: "status", account: { email: "a@b.pl", plan: "free", state: "free", validUntil: null, renews: false, admin: false } },
      grant: { ok: true, action: "grant", account: { email: "a@b.pl", plan: "premium", state: "pro", validUntil: NOW + 30 * DAY, renews: false, admin: false } },
      revoke: { ok: true, action: "revoke", account: { email: "a@b.pl", plan: "free", state: "free", validUntil: null, renews: false, admin: false } },
    },
  });
  await signIn(page, "szef@liczmat.com", { admin: true });
  await page.click("#tab-admin");

  await page.fill("#admin-email", "  A.Kowalski@Example.COM ");
  await page.click("#admin-status");
  await page.waitForFunction(() => (window.__fnCalls || []).length > 0);
  let call = await lastCall(page);
  eq("the callable is the one the function exports", call[0], "adminPlan");
  eq("checking a plan sends `status`", call[1].action, "status");
  check("the address goes as typed — the trimming and the lower-casing are the server's",
    typeof call[1].email === "string" && call[1].email === "A.Kowalski@Example.COM", call[1].email);

  await page.fill("#admin-email", "a@b.pl");
  await page.fill("#admin-months", "3");
  await page.click("#admin-grant");
  await page.waitForFunction(() => (window.__fnCalls || []).length > 1);
  call = await lastCall(page);
  eq("granting sends `grant`", call[1].action, "grant");
  eq("with the months as a number", call[1].months, 3);

  /* The one destructive button asks first — and a dismissed question sends nothing. */
  page.once("dialog", (d) => d.dismiss());
  await page.click("#admin-revoke");
  await page.waitForTimeout(300);
  eq("a cancelled revoke sends nothing",
    (await page.evaluate(() => window.__fnCalls.length)), 2);
  page.once("dialog", (d) => d.accept());
  await page.click("#admin-revoke");
  await page.waitForFunction(() => (window.__fnCalls || []).length > 2);
  call = await lastCall(page);
  eq("a confirmed one does", call[1].action, "revoke");
  check("and carries no months", call[1].months === undefined);

  /* Nothing on this page addresses a document. The plan is written on the server. */
  const wrote = await page.evaluate(() => Object.keys(window.__fb.DOCS || {})
    .filter((k) => k.startsWith("users/")).length);
  check("the browser wrote no profile document", wrote <= 1, `${wrote} documents under users/`);
  await page.close();
  await ctx.close();
}

/* ================================================================== 4. what it draws */

head("4. what it draws, in Polish");
{
  const ctx = await context();
  const until = Date.UTC(2027, 2, 14, 12, 0, 0);
  const page = await openApp(ctx, {
    accounts: ADMIN,
    answers: {
      status: { ok: true, account: { email: "a@b.pl", plan: "premium", state: "pro", validUntil: until, renews: false, admin: false } },
      list: { ok: true, more: false, accounts: [
        { email: "jeden@example.com", plan: "premium", state: "pro", validUntil: until, renews: true, admin: false },
        { email: "dwa@example.com", plan: "premium", state: "expired", validUntil: until, renews: false, admin: false },
        { email: "<b>trzy</b>@example.com", plan: "free", state: "free", validUntil: null, renews: false, admin: true },
      ] },
    },
  });
  await signIn(page, "szef@liczmat.com", { admin: true });
  await page.click("#tab-admin");

  await page.fill("#admin-email", "a@b.pl");
  await page.click("#admin-status");
  await page.waitForFunction(() => !document.getElementById("admin-result").hidden
    && !/Czekam/.test(document.getElementById("admin-result").textContent));
  const line = await result(page);
  check("a valid plan is read out with its date", /a@b\.pl: Pro do 2027-03-14/.test(line), line);
  check("and says it does not renew", !/odnawia/.test(line), line);
  check("the answer is announced", await page.locator("#admin-result").getAttribute("role") === "status");

  await page.click("#admin-list");
  await page.waitForSelector("#admin-table:not([hidden])");
  const rows = await page.$$eval("#admin-table tbody tr", (trs) =>
    trs.map((tr) => Array.from(tr.cells).map((td) => td.textContent.trim())));
  eq("three accounts, three rows", rows.length, 3);
  check("a renewing plan says so", /odnawia się/.test(rows[0][1]), rows[0][1]);
  check("an expired one says expired, not free", /wygasł 2027-03-14/.test(rows[1][1]), rows[1][1]);
  eq("a free one says Free", rows[2][1], "Free");
  eq("and an administrator is marked", rows[2][2], "tak");
  eq("while the others are not", rows[0][2], "—");
  eq("what came from the server is rendered as text, not as markup",
    rows[2][0], "<b>trzy</b>@example.com");
  eq("no element got built out of it", await page.locator("#admin-table b").count(), 0);
  check("the count is said in Polish", /3 kont/.test(await result(page)), await result(page));

  /* The table is wide and the panel is read on a phone like everything else here. */
  check("the table scrolls inside its own box",
    await page.locator("#panel-admin .table-scroll").count() === 1);
  await page.close();
  await ctx.close();
}

/* ================================================================== 5. the refusals */

head("5. every refusal, in a sentence somebody can act on");
{
  const ctx = await context();
  const page = await openApp(ctx, {
    accounts: ADMIN,
    answers: {
      statusError: "no-account", grantError: "bad-months", listError: "not-admin",
    },
  });
  await signIn(page, "szef@liczmat.com", { admin: true });
  await page.click("#tab-admin");

  const say = async (button) => {
    await page.click(button);
    await page.waitForFunction(() => {
      const el = document.getElementById("admin-result");
      return !el.hidden && !/Czekam/.test(el.textContent);
    });
    return result(page);
  };

  await page.fill("#admin-email", "nikt@example.com");
  eq("an address with no account", await say("#admin-status"), "Nie ma konta o tym adresie.");
  eq("months the server refuses", await say("#admin-grant"),
    "Liczba miesięcy ma być całkowita, od 1 do 120.");
  eq("a claim the server does not believe", await say("#admin-list"),
    "To konto nie ma uprawnień administratora.");
  check("the refusal is marked as an error",
    await page.locator("#admin-result").evaluate((el) => el.classList.contains("err")));
  check("and the buttons work again afterwards",
    await page.locator("#admin-status").isEnabled());
  eq("nothing was drawn into the table", await page.locator("#admin-table").isVisible(), false);
  await page.close();
  await ctx.close();
}

/* ================================================================== 6. signing out */

head("6. the panel belongs to the account, not to the tab");
{
  const ctx = await context();
  const page = await openApp(ctx, {
    accounts: { ...ADMIN, ...PLAIN },
    answers: { list: { ok: true, more: false, accounts: [] } },
  });
  await signIn(page, "szef@liczmat.com", { admin: true });
  await page.click("#tab-admin");
  eq("the panel is open", await page.locator("#panel-admin").isVisible(), true);

  await page.click("#app-signout");
  await page.waitForSelector("#app-auth:not([hidden])");
  eq("signing out takes the tab away", await page.locator("#tab-admin").count(), 0);
  eq("and the panel with it", await page.locator("#panel-admin").count(), 0);

  await signIn(page, "ktos@example.com");
  await page.waitForTimeout(500);
  eq("the next account does not inherit it", await page.locator("#tab-admin").count(), 0);
  eq("and lands on a workspace with something in it",
    await page.locator("#panel-projects").isVisible(), true);
  eq("five tabs again", await page.locator(".app-tab").count(), 5);
  check("no error was logged on the way", page.__errors.length === 0, page.__errors.join(" | "));
  await page.close();
  await ctx.close();
}

/* ================================================================== 7. the widths */

head("7. chapter XXVIII: the panel on a phone");
{
  const ctx = await context();
  const page = await openApp(ctx, {
    accounts: ADMIN,
    answers: { list: { ok: true, more: true, accounts: [
      { email: "ktos@example.com", plan: "premium", state: "pro", validUntil: NOW + DAY, renews: true, admin: false },
    ] } },
  });
  await signIn(page, "szef@liczmat.com", { admin: true });
  await page.click("#tab-admin");
  await page.click("#admin-list");
  await page.waitForSelector("#admin-table:not([hidden])");

  for (const width of [320, 375, 390, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(60);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${width} px: nothing hangs off the side`, over <= 0, `${over} px over`);
    const small = await page.$$eval("#panel-admin input", (els) => els.filter((el) =>
      parseFloat(getComputedStyle(el).fontSize) < 16).length);
    eq(`${width} px: every field is 16 px of text`, small, 0);
    const short = await page.$$eval("#panel-admin button", (els) => els.filter((el) =>
      el.getBoundingClientRect().height < (window.innerWidth <= 560 ? 44 : 40)).length);
    eq(`${width} px: every button is tall enough to tap`, short, 0);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.close();
  await ctx.close();
}

/* ================================================================== 8. the language */

head("8. the page translates, the tool does not");
{
  const ctx = await context();
  const page = await openApp(ctx, { accounts: ADMIN, answers: {} });
  await signIn(page, "szef@liczmat.com", { admin: true });
  await page.click("#tab-admin");

  await page.click(".lang-toggle, [data-lang-toggle], .lang-btn");
  await page.click('[data-lang="de"]');
  await page.waitForFunction(() => document.documentElement.lang === "de");

  eq("the tab survives the switch", await page.locator("#tab-admin").count(), 1);
  eq("the panel is still open", await page.locator("#panel-admin").isVisible(), true);
  eq("and it is still Polish, on purpose",
    await page.locator("#panel-admin h2").innerText(), "Panel administratora");
  /* "Profil" is Profil in German too, so the tab that proves the page moved is the one
     whose word actually differs. */
  eq("while the page around it is not",
    await page.locator("#tab-projects").innerText(), "Projekte");
  await page.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ the result */

await browser.close();
server.close();

if (failures.length) {
  console.error(`\nadmin page: ${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`admin page: ${passed}/${passed} checks pass`);
