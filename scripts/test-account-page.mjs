#!/usr/bin/env node
/**
 * LiczMat — /app/, the account page, tested in a real browser.
 *
 *     node scripts/test-account-page.mjs
 *
 * Master plan, session 13, in the half that needs a browser: registration, sign-in,
 * sign-out, the password reset, the profile and the session, clicked through as the
 * visitor meets them. The pure-logic half — the level, the session hint, `?next=`, the
 * copy in four languages — is scripts/test-account.mjs and needs nothing installed.
 *
 * **Firebase is stubbed, on purpose.** `assets/app.js` imports the SDK from
 * gstatic.com at runtime, and this test intercepts those three imports and answers with
 * a fake module: an auth object with three accounts in it and a Firestore that is a Map.
 * That makes the test about *this* repository's code — the views, the level, the
 * profile, what is written to localStorage — instead of about Google's uptime, and it is
 * the only way to exercise the page at all from a container that cannot reach gstatic.
 * What the stub cannot check is whether Firebase itself behaves as assumed; the live
 * verification of that is FIRESTORE_SYNC §8 in the app repo. The stub itself is
 * scripts/fake-firebase.mjs, shared with scripts/test-qa.mjs, which drives the same page.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-pages.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-account-page.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  console.log("test-account-page: Playwright not installed — skipping the browser tests.");
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
    if (url.startsWith(base)) return route.continue();
    return route.abort();
  });
  return ctx;
}

/**
 * Open /app/ and wait until the page has decided whether anybody is signed in.
 *
 * /app/ has no per-language URL: it picks the language from the visitor's saved choice,
 * else from navigator.language. Chromium here reports en-US, so the choice is planted —
 * otherwise this file would be asserting English copy on a page the owner reads in
 * Polish. The generated pages get no such plant: they have real per-language URLs, and a
 * saved choice would make assets/i18n-runtime.js redirect away from the one under test.
 *
 * @param {object} [opts.accounts] e-mail → { password, user }, planted before load
 * @param {object} [opts.docs]     Firestore path → document, planted before load
 * @param {object} [opts.storage]  localStorage entries to plant
 * @param {string} [opts.lang]     the saved language choice; "pl" on /app/ by default
 */
async function openApp(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  const lang = opts.lang !== undefined ? opts.lang : (url.startsWith("/app/") ? "pl" : "");
  if (lang) opts = { ...opts, storage: { "materio-lang": lang, ...(opts.storage || {}) } };
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(([accounts, docs, storage]) => {
    window.__fbAccounts = accounts;
    window.__fbSeed = docs;
    Object.entries(storage).forEach(([k, v]) => localStorage.setItem(k, v));
  }, [opts.accounts || {}, opts.docs || {}, opts.storage || {}]);
  await page.goto(base + url, { waitUntil: "domcontentloaded" });
  // /app/ boots asynchronously — it imports the SDK, then wires the forms — and sets
  // data-app-ready when it is done. Clicking before that clicks a button nothing is
  // listening to, so every test would race the import.
  if (url.startsWith("/app/")) {
    await page.waitForSelector("html[data-app-ready]", { state: "attached", timeout: 10000 });
    // The fake Firestore exists by then; seed it before anything asks for a document.
    await page.evaluate(() => {
      Object.entries(window.__fbSeed || {}).forEach(([k, v]) => window.__fbDocs.set(k, v));
    });
  }
  page.lmErrors = errors;
  return page;
}

const visible = (page, selector) => page.locator(selector).isVisible();
const signedIn = (page) => page.locator("#app-workspace").waitFor({ state: "visible", timeout: 5000 });

/**
 * Pick a language in the in-place picker and wait for the page to be in it.
 *
 * Since session 33 /app/ ships one dictionary rather than ten, so a language nobody has
 * asked for yet arrives with a request. The click is therefore the start of the switch
 * and not the end of it; `<html lang>` is set by applyLang(), in the same breath as the
 * text, so waiting for it is waiting for the redraw.
 */
async function pickLang(page, code) {
  await page.click(`.lang-item[data-lang="${code}"]`);
  await page.waitForFunction((c) => document.documentElement.lang === c, code, { timeout: 5000 });
}

/* --- 1. the signed-out page ---------------------------------------------------------- */

head("1. signed out: three views, one card");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/");

  check("the sign-in view is the one on show", await visible(page, '[data-auth-view="signin"]'));
  check("the sign-up view is not", !(await visible(page, '[data-auth-view="signup"]')));
  check("nor the reset view", !(await visible(page, '[data-auth-view="reset"]')));
  check("Google sign-in is not offered", !(await visible(page, "#auth-google")));
  check("the workspace is hidden", !(await visible(page, "#app-workspace")));

  await page.click('[data-auth-go="signup"]');
  check("the sign-up link opens the sign-up view", await visible(page, '[data-auth-view="signup"]'));
  check("and closes the sign-in one", !(await visible(page, '[data-auth-view="signin"]')));
  check("nor on the sign-up view", !(await visible(page, "#auth-google")));

  await page.click('[data-auth-view="signup"] [data-auth-go="signin"]');
  await page.click('[data-auth-view="signin"] [data-auth-go="reset"]');
  check("the forgotten-password link opens the reset view", await visible(page, '[data-auth-view="reset"]'));
  check("which has an e-mail field of its own", await visible(page, "#reset-email"));
  check("and no Google button here either",
    !(await visible(page, "#auth-google")));

  await page.click('[data-auth-view="reset"] [data-auth-go="signin"]');
  check("and back to signing in", await visible(page, '[data-auth-view="signin"]'));

  check("chapter II's three levels are on the page",
    (await page.locator('#app-auth .lvl-card').count()) === 3);
  eq("and the guest one is marked",
    await page.locator("#app-auth .lvl-card[data-current] h3").innerText(), "Gość");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("2. a link from a calculator opens the sign-up form directly");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/?mode=signup&next=%2Fkalkulatory%2Fplytki-panele-gres%2F");
  check("the sign-up view is the one on show", await visible(page, '[data-auth-view="signup"]'));
  check("the sign-in view is not", !(await visible(page, '[data-auth-view="signin"]')));
  await page.close();

  const reset = await openApp(ctx, "/app/?mode=reset");
  check("and ?mode=reset opens the reset view", await visible(reset, '[data-auth-view="reset"]'));
  await reset.close();
  await ctx.close();
}

/* --- 3. registration ----------------------------------------------------------------- */

head("3. registration");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/?mode=signup&next=%2Fkalkulatory%2Fplytki-panele-gres%2F");

  await page.fill("#signup-email", "nowy@example.com");
  await page.fill("#signup-password", "sekret123");
  await page.click("#signup-form button[type=submit]");
  await signedIn(page);

  check("a new account signs the visitor in", await visible(page, "#app-workspace"));
  eq("and the identity bar names them",
    await page.locator("#app-who").innerText(), "nowy@example.com");
  eq("at the free level", await page.locator("#app-level").innerText(), "LiczMat");
  eq("the rest of the site is told the level",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), "liczmat");

  const calls = await page.evaluate(() => window.__fbCalls.map((c) => c[0]));
  check("persistence is chosen before the account is created",
    calls.indexOf("setPersistence") < calls.indexOf("createUser"), calls.join(","));
  check("and the verification mail goes out", calls.includes("verifyMail"), calls.join(","));

  const profile = await page.evaluate(() => window.__fbDocs.get("users/uid-0"));
  check("the profile document is created with the three fields the rules allow",
    profile && Object.keys(profile).sort().join() === "appVersion,createdAt,lastSeenAt",
    JSON.stringify(profile));

  check("the way back to the calculator is offered", await visible(page, "#app-next"));
  eq("and points at the page the visitor came from",
    await page.locator("#app-next-link").getAttribute("href"), "/kalkulatory/plytki-panele-gres/");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("4. registration refuses what it should");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/?mode=signup", {
    accounts: { "zajety@example.com": { password: "sekret123", user: { uid: "u9", email: "zajety@example.com", providerData: [] } } },
  });
  await page.fill("#signup-email", "zajety@example.com");
  await page.fill("#signup-password", "sekret123");
  await page.click("#signup-form button[type=submit]");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  eq("an address that already has an account is named as such",
    await page.locator("#app-status").innerText(), "Konto z tym adresem już istnieje.");
  check("and the visitor is not signed in", !(await visible(page, "#app-workspace")));

  // The browser refuses a five-character password before Firebase is asked; the field
  // carries minlength, which is what keeps a doomed round trip off the network.
  eq("the password field states the minimum",
    await page.locator("#signup-password").getAttribute("minlength"), "6");
  await page.close();
  await ctx.close();
}

/* --- 5. signing in, out, and the session --------------------------------------------- */

const ACCOUNT = {
  "kto@example.com": {
    password: "sekret123",
    user: {
      uid: "u1", email: "kto@example.com", emailVerified: true, displayName: "",
      providerData: [{ providerId: "password" }],
    },
  },
};

head("5. signing in and signing out");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", { accounts: ACCOUNT });

  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "zle-haslo");
  await page.click("#signin-form button[type=submit]");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  eq("a wrong password is named as such",
    await page.locator("#app-status").innerText(), "Zły e-mail lub hasło.");
  check("the status box reads as an error", await page.locator("#app-status.err").count() === 1);
  eq("and nothing is written about a session",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), null);

  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);
  check("the right one signs in", await visible(page, "#app-workspace"));
  check("no way back is offered when nobody asked for one",
    !(await visible(page, "#app-next")));

  await page.click("#app-signout");
  await page.locator("#app-auth").waitFor({ state: "visible", timeout: 5000 });
  check("signing out shows the sign-in form again", await visible(page, '[data-auth-view="signin"]'));
  eq("and says so", await page.locator("#app-status").innerText(), "Wylogowano.");
  eq("and the session hint is gone",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), null);
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("6. how long the session lasts is asked once, per device");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", { accounts: ACCOUNT });

  check("the box is ticked to begin with, like Firebase's own default",
    await page.locator("#signin-remember").isChecked());
  await page.uncheck("#signin-remember");
  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);

  const calls = await page.evaluate(() => window.__fbCalls);
  const persistence = calls.filter((c) => c[0] === "setPersistence").map((c) => c[1]);
  eq("unticking it asks Firebase for a session that ends with the window",
    persistence[persistence.length - 1], "session");
  eq("and the answer is remembered on this device",
    await page.evaluate(() => localStorage.getItem("liczmat-remember")), "0");

  await page.click('[data-tab="profile"]');
  check("the profile shows the same answer", !(await page.locator("#prof-remember").isChecked()));
  eq("in words", await page.locator("#prof-session-state").innerText(),
    "Wylogujemy Cię, gdy zamkniesz przeglądarkę.");

  await page.check("#prof-remember");
  const after = await page.evaluate(() => window.__fbCalls.filter((c) => c[0] === "setPersistence").pop());
  eq("changing it in the profile migrates the session Firebase already has", after[1], "local");
  eq("and is remembered", await page.evaluate(() => localStorage.getItem("liczmat-remember")), "1");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("7. resetting a password");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/?mode=reset");

  await page.fill("#reset-email", "kto@example.com");
  await page.click("#reset-form button[type=submit]");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  eq("the link is sent", await page.locator("#app-status").innerText(),
    "Wysłaliśmy link do zmiany hasła. Sprawdź pocztę.");
  const calls = await page.evaluate(() => window.__fbCalls);
  eq("to the address that was typed", calls.filter((c) => c[0] === "resetMail").pop()[1],
    "kto@example.com");
  check("and the box does not read as an error",
    (await page.locator("#app-status.err").count()) === 0);
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

/* --- 8. the profile ------------------------------------------------------------------ */

head("8. the profile");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", {
    accounts: ACCOUNT,
    docs: { "users/u1": { createdAt: Date.UTC(2026, 0, 15), lastSeenAt: Date.UTC(2026, 6, 2), appVersion: "web" } },
  });
  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);
  await page.click('[data-tab="profile"]');

  check("the profile panel opens", await visible(page, '[data-panel="profile"]'));
  check("and the projects panel closes", !(await visible(page, '[data-panel="projects"]')));
  eq("the address is shown", await page.locator("#prof-email").innerText(), "kto@example.com");
  eq("the sign-in method is named",
    await page.locator("#prof-provider").innerText(), "E-mail i hasło");
  check("the account's start date is a date, not a number",
    /2026/.test(await page.locator("#prof-created").innerText()),
    await page.locator("#prof-created").innerText());
  check("and so is the last use",
    /2026/.test(await page.locator("#prof-seen").innerText()));

  await page.fill("#prof-name", "Jan Kowalski");
  await page.click("#name-form button[type=submit]");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  eq("a name can be given to the account",
    await page.locator("#app-status").innerText(), "Nazwa zapisana.");
  eq("and the identity bar uses it", await page.locator("#app-who").innerText(), "Jan Kowalski");
  const stored = await page.evaluate(() => window.__fbCalls.filter((c) => c[0] === "updateProfile").pop());
  eq("the name goes to Firebase Auth, not into the profile document", stored[1], "Jan Kowalski");
  const doc = await page.evaluate(() => window.__fbDocs.get("users/u1"));
  check("which the rules would refuse — the document keeps its three fields",
    Object.keys(doc).sort().join() === "appVersion,createdAt,lastSeenAt", JSON.stringify(doc));

  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("9. the level comes from the profile the server owns");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });

  const free = await openApp(ctx, "/app/", {
    accounts: ACCOUNT,
    docs: { "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web", plan: "free" } },
  });
  await free.fill("#signin-email", "kto@example.com");
  await free.fill("#signin-password", "sekret123");
  await free.click("#signin-form button[type=submit]");
  await signedIn(free);
  eq("plan free is the LiczMat level", await free.locator("#app-level").innerText(), "LiczMat");
  await free.click('[data-tab="profile"]');
  eq("and the profile marks that card",
    await free.locator("#panel-profile .lvl-card[data-current] h3").innerText(), "LiczMat");
  await free.close();

  const pro = await openApp(ctx, "/app/", {
    accounts: ACCOUNT,
    docs: { "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web", plan: "premium" } },
  });
  await pro.fill("#signin-email", "kto@example.com");
  await pro.fill("#signin-password", "sekret123");
  await pro.click("#signin-form button[type=submit]");
  await signedIn(pro);
  eq("plan premium is the Pro level", await pro.locator("#app-level").innerText(), "LiczMat Pro");
  eq("and the rest of the site is told so",
    await pro.evaluate(() => localStorage.getItem("liczmat-signed-in")), "pro");
  await pro.click('[data-tab="profile"]');
  eq("the profile marks the Pro card",
    await pro.locator("#panel-profile .lvl-card[data-current] h3").innerText(), "LiczMat Pro");
  /* Session 29 gave the card the one link chapter XXV asks for — "Poznaj LiczMat Pro",
     pointing at the page that explains the level. What it must still not carry is a
     button: nothing on this site grants the plan, and the checkout lives on the Pro tab,
     which is the only place that knows the uid a payment attaches to. */
  eq("the card points at the page that explains the level",
    await pro.locator('#panel-profile .lvl-card[data-level="pro"] a').getAttribute("href"),
    "/liczmat-pro/");
  check("and still offers nothing to buy — nothing grants the plan yet",
    (await pro.locator('#panel-profile .lvl-card[data-level="pro"] button').count()) === 0);
  eq("no console error", pro.lmErrors.join(" / "), "");
  await pro.close();
  await ctx.close();
}

head("9b. the LiczMat Pro tab: what the plan is, and no way to buy one");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const hour = 3600e3;

  const signIn = async (docs) => {
    const page = await openApp(ctx, "/app/", { accounts: ACCOUNT, docs });
    await page.fill("#signin-email", "kto@example.com");
    await page.fill("#signin-password", "sekret123");
    await page.click("#signin-form button[type=submit]");
    await signedIn(page);
    await page.click('[data-tab="pro"]');
    return page;
  };

  const free = await signIn({ "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web" } });
  check("the panel opens", await visible(free, '[data-panel="pro"]'));
  eq("a free account is told it is on the free plan",
    await free.locator("#plan-name").innerText(), "Darmowy");
  eq("with no end date to print", await free.locator("#plan-until").innerText(), "");
  // The true and duller sentence: there is no payment, so nothing grants Pro to anyone.
  eq("and the honest reason it is not Pro", await free.locator("#plan-note").innerText(),
    "Nic jeszcze nie nadaje planu Pro — nie ma płatności, więc każde konto jest darmowe.");

  // Chapter XXV: understand what is Pro, and never meet a dead button.
  eq("all five Pro modules are described", await free.locator(".pro-mod").count(), 5);
  eq("each one marked as Pro", await free.locator(".pro-lock .chip").count(), 5);
  eq("the first is Klienci", await free.locator(".pro-mod h3").first().innerText(), "Klienci");
  eq("and it says so", await free.locator('.pro-mod[data-feature="clients"] .pro-lock').innerText(),
    "Dostępne w LiczMat Pro");
  // Chapter XXV's rule is "never a dead button", not "never a button". Sessions 22–25
  // built Klienci, Zlecenia, Wyceny and Terminarz, so their cards open something; the CRM
  // of session 26 is a path through them rather than a page and stays text. Session 28
  // removed the preview switch and put the checkout in its place — and the checkout is
  // hidden while assets/pay.js carries no Payment Link, which is what these guard.
  /* Checked as a list rather than as a number. The count said five, the panel has held
     six since session 28 put the Stripe portal link in it, and nobody noticed because a
     number does not say which element it lost — session 29 rewrote it into the set it
     was always meant to be, and added its own "Poznaj LiczMat Pro" to it. */
  eq("the panel offers exactly the four built modules, the way to the Pro page, the portal and the checkout",
    (await free.$$eval("#panel-pro a, #panel-pro button",
      (ns) => ns.map((n) => n.getAttribute("href") || n.id || "checkout").join(" "))),
    "# /klienci/ /zlecenia/ /wyceny/ /terminarz/ /liczmat-pro/ checkout");
  eq("nothing visible in the panel offers to take money",
    await free.locator("#panel-pro [data-pw-checkout]:visible").count(), 0);
  eq("and the manage-subscription link is not there for a free account",
    await free.locator("#plan-manage").isVisible(), false);
  eq("the first opens Klienci",
    await free.locator('.pro-mod[data-feature="clients"] a').getAttribute("href"), "/klienci/");
  eq("the second Zlecenia",
    await free.locator('.pro-mod[data-feature="jobs"] a').getAttribute("href"), "/zlecenia/");
  eq("the third Wyceny",
    await free.locator('.pro-mod[data-feature="quotes"] a').getAttribute("href"), "/wyceny/");
  eq("and the fourth Terminarz",
    await free.locator('.pro-mod[data-feature="calendar"] a').getAttribute("href"), "/terminarz/");
  /* Session 28: the Pro tab is the one place on the site that offers to take money,
     because it is the only page that knows the uid a payment has to be attached to. With
     no Payment Link configured it quotes the price and says the subscription has not
     opened — which is the state the site ships in. */
  eq("the free account is shown what Pro costs",
    await free.locator('#plan-buy [data-pw-plan="monthly"]').isVisible(), true);
  check("with a real amount in it",
    /[0-9]/.test(await free.locator('#plan-buy [data-pw-plan="monthly"] [data-pw-price]').innerText()),
    await free.locator('#plan-buy [data-pw-plan="monthly"] [data-pw-price]').innerText());
  eq("and told the subscription is not open yet",
    await free.locator("#plan-buy [data-pw-soon]").isVisible(), true);
  eq("with no button that would charge them",
    await free.locator("#plan-buy [data-pw-checkout]").isVisible(), false);
  eq("the plan is still the free one", await free.locator("#plan-name").innerText(), "Darmowy");
  eq("and the card says why in one plain sentence",
    await free.locator("#plan-note").innerText(),
    "Nic jeszcze nie nadaje planu Pro — nie ma płatności, więc każde konto jest darmowe.");
  check("no Stripe address is anywhere in the page yet",
    (await free.content()).indexOf("stripe.com") === -1);

  eq("no console error", free.lmErrors.join(" / "), "");
  await free.close();

  const until = Date.UTC(2027, 2, 1);
  const pro = await signIn({
    "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web", plan: "premium", planValidUntil: until },
  });
  eq("a Pro account is named as Pro", await pro.locator("#plan-name").innerText(), "LiczMat Pro");
  /* Session 28: a running subscription is told when it will be CHARGED, not when it will
     stop. The same instant means the opposite thing on a cancelled plan below. */
  check("and told when it renews",
    (await pro.locator("#plan-until").innerText()).startsWith("Odnawia się:"),
    await pro.locator("#plan-until").innerText());
  eq("with the sentence that it renews by itself",
    await pro.locator("#plan-note").innerText(),
    "Subskrypcja jest aktywna i odnowi się automatycznie.");
  eq("and nobody quotes them a price for what they already have",
    await pro.locator("#plan-buy").isVisible(), false);
  await pro.close();

  /* Chapter 28's "obsługa anulowania": still Pro, still fully working, and it will not
     renew. This is the state that cannot be read from plan + planValidUntil alone — it
     needs planRenews, which is why assets/plan.js reads a third field. */
  const cancelled = await signIn({
    "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web", plan: "premium",
                  planValidUntil: until, planRenews: false },
  });
  eq("a cancelled subscription is still LiczMat Pro",
    await cancelled.locator("#plan-name").innerText(), "LiczMat Pro");
  eq("the identity chip still says Pro",
    await cancelled.locator("#app-level").innerText(), "LiczMat Pro");
  check("the date now means the end rather than the next charge",
    (await cancelled.locator("#plan-until").innerText()).startsWith("Pro do:"),
    await cancelled.locator("#plan-until").innerText());
  check("and the card explains what happens then",
    (await cancelled.locator("#plan-note").innerText()).includes("do końca opłaconego okresu"),
    await cancelled.locator("#plan-note").innerText());
  // Re-subscribing is exactly what this account might want, so the price comes back.
  eq("the plans are offered again", await cancelled.locator("#plan-buy").isVisible(), true);
  await cancelled.close();

  // The one case the page can explain from the document itself: plan still says premium,
  // the level is LiczMat again. Without this the account looks demoted for no reason.
  const over = await signIn({
    "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web", plan: "premium", planValidUntil: Date.now() - hour },
  });
  eq("an expired plan puts the account back on free",
    await over.locator("#plan-name").innerText(), "Darmowy");
  eq("and says why", await over.locator("#plan-note").innerText(),
    "Plan Pro wygasł. Konto działa dalej jako darmowe LiczMat.");
  eq("the identity chip agrees", await over.locator("#app-level").innerText(), "LiczMat");

  // /app/ swaps the DOM instead of navigating, so anything JavaScript wrote has to be
  // written again in the new language — the plan chip and its note are both written here.
  await over.click("#lang-toggle");
  await pickLang(over, "de");
  eq("switching language redraws the plan", await over.locator("#plan-name").innerText(), "Kostenlos");
  eq("and its note", await over.locator("#plan-note").innerText(),
    "Der Pro-Tarif ist abgelaufen. Das Konto läuft als kostenloses LiczMat weiter.");
  eq("and the module cards, which the build wrote",
    await over.locator('.pro-mod[data-feature="clients"] h3').innerText(), "Kunden");
  eq("no console error", over.lmErrors.join(" / "), "");
  await over.close();
  await ctx.close();
}

/* --- 9c. the plan changing under an open page ---------------------------------------- */

/**
 * Session 37: `plan` is written by the server — scripts/pro-admin.mjs, or the Stripe
 * webhook that comes next — and until this session /app/ read the profile exactly once,
 * at sign-in. Somebody who had just paid stayed on the free plan until they signed out
 * and back in, and step 5 of the ORDER note in assets/pay.js ("pay once and check the
 * account turns Pro by itself") could not be carried out at all.
 *
 * `window.__fbPushDoc` in scripts/fake-firebase.mjs plays the server: it writes the
 * profile document the way the admin script does and lets the live listener deliver it.
 * Nothing here reloads the page, and nothing signs in twice.
 */
head("9c. a plan granted while the page is open lands on the screen");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", {
    accounts: ACCOUNT,
    docs: { "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web" } },
  });
  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);
  await page.click('[data-tab="pro"]');
  eq("it starts as a free account", await page.locator("#app-level").innerText(), "LiczMat");
  eq("and the rest of the site is told so",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), "liczmat");

  const until = Date.now() + 365 * 24 * 3600e3;
  await page.evaluate((ms) => window.__fbPushDoc("users/u1",
    { plan: "premium", planValidUntil: ms, planRenews: false }), until);
  await page.waitForFunction(() => document.getElementById("app-level").textContent === "LiczMat Pro",
    null, { timeout: 5000 });
  eq("the level moves without a reload", await page.locator("#app-level").innerText(), "LiczMat Pro");
  eq("the hint the other 372 pages read moves with it",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), "pro");
  eq("the open Pro tab redraws itself",
    await page.locator("#plan-name").innerText(), "LiczMat Pro");
  /* A plan nobody is renewing is worded "Pro do <data>" rather than "Odnawia się" — the
     copy session 28 wrote for a cancelled subscription is the true sentence for a plan
     granted by hand, so this needed no new words. */
  check("and says how long it lasts, without promising a renewal",
    (await page.locator("#plan-until").innerText()).startsWith("Pro do"),
    await page.locator("#plan-until").innerText());

  await page.evaluate(() => window.__fbPushDoc("users/u1",
    { plan: "free", planValidUntil: null, planRenews: null }));
  await page.waitForFunction(() => document.getElementById("app-level").textContent === "LiczMat",
    null, { timeout: 5000 });
  eq("taking it away puts the level back",
    await page.locator("#app-level").innerText(), "LiczMat");
  eq("and the hint with it",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), "liczmat");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

/* --- 10. the tabs, the language switch, the phone ------------------------------------ */

head("10. five tabs, reachable from the keyboard");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", { accounts: ACCOUNT });
  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);

  // Rooms are not one of them: the owner asked for "Pomieszczenia" to be folded into the
  // project it belongs to, because a room is an element of a project (chapter XVIII), not
  // a second subject. The fifth is LiczMat Pro, added by session 21 — the plan this
  // account is on and the modules Pro is going to consist of.
  eq("there are five", await page.locator(".app-tab").count(), 5);
  eq("only the selected one is in the tab order",
    await page.locator('.app-tab[tabindex="0"]').count(), 1);

  await page.locator('[data-tab="projects"]').focus();
  await page.keyboard.press("ArrowRight");
  eq("the right arrow moves to the next tab",
    await page.evaluate(() => document.activeElement.dataset.tab), "sync");
  check("and opens its panel", await visible(page, '[data-panel="sync"]'));
  await page.keyboard.press("End");
  eq("End goes to the last one",
    await page.evaluate(() => document.activeElement.dataset.tab), "account");
  await page.keyboard.press("ArrowRight");
  eq("and the arrows wrap round",
    await page.evaluate(() => document.activeElement.dataset.tab), "projects");
  await page.keyboard.press("ArrowLeft");
  eq("in both directions",
    await page.evaluate(() => document.activeElement.dataset.tab), "account");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("10b. the mail Firebase sends follows the page's language");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/?mode=reset");
  eq("Polish to begin with",
    await page.evaluate(() => window.__fb.auth.languageCode), "pl");

  await page.click("#lang-toggle");
  await pickLang(page, "uk");
  eq("and it follows the picker",
    await page.evaluate(() => window.__fb.auth.languageCode), "uk");
  await page.close();

  const de = await openApp(ctx, "/app/", { lang: "de" });
  eq("a visitor who chose German gets German",
    await de.evaluate(() => window.__fb.auth.languageCode), "de");
  await de.close();
  await ctx.close();
}

head("11. switching language redraws what JavaScript wrote");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", { accounts: ACCOUNT });
  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);
  eq("the identity bar starts in Polish",
    await page.locator("#app-provider").innerText(), "E-mail i hasło");

  await page.click("#lang-toggle");
  await pickLang(page, "de");
  eq("and follows the picker into German",
    await page.locator("#app-provider").innerText(), "E-Mail und Passwort");
  eq("including the tab labels",
    await page.locator('[data-tab="profile"]').innerText(), "Profil");
  await page.click('[data-tab="profile"]');
  eq("and the session sentence in the profile",
    await page.locator("#prof-session-state").innerText(),
    "Du bleibst angemeldet, auch wenn der Browser geschlossen wird.");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("12. the account page on a phone");
{
  for (const width of [360, 414, 768]) {
    const ctx = await context({ viewport: { width, height: 800 } });
    const out = await openApp(ctx, "/app/");
    const overflowOut = await out.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`signed out at ${width}px does not scroll sideways`, overflowOut <= 0,
      `overflows by ${overflowOut}px`);
    await out.close();

    const page = await openApp(ctx, "/app/", { accounts: ACCOUNT });
    await page.fill("#signin-email", "kto@example.com");
    await page.fill("#signin-password", "sekret123");
    await page.click("#signin-form button[type=submit]");
    await signedIn(page);
    await page.click('[data-tab="profile"]');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`the profile at ${width}px does not scroll sideways`, overflow <= 0,
      `overflows by ${overflow}px`);

    // Session 21 put a fifth tab on the row and a two-column grid of module cards behind
    // it. Both are the shapes chapter XXVIII catches: a tab row that will not wrap and a
    // grid that keeps two columns on a phone.
    await page.click('[data-tab="pro"]');
    const overflowPro = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`the Pro tab at ${width}px does not scroll sideways`, overflowPro <= 0,
      `overflows by ${overflowPro}px`);
    await page.close();
    await ctx.close();
  }
}

/* --- 12b. the account tab: the password, and deleting the account -------------------- */

/** Sign in with the standing test account and open one tab. */
async function openTab(ctx, tab, opts = {}) {
  const page = await openApp(ctx, "/app/", { accounts: structuredClone(ACCOUNT), ...opts });
  await page.fill("#signin-email", "kto@example.com");
  await page.fill("#signin-password", "sekret123");
  await page.click("#signin-form button[type=submit]");
  await signedIn(page);
  await page.click(`[data-tab="${tab}"]`);
  return page;
}

head("12b. changing the password");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });

  const wrong = await openTab(ctx, "account");
  await wrong.fill("#password-current", "nie-to-haslo");
  await wrong.fill("#password-new", "nowe123456");
  await wrong.click("#password-form button[type=submit]");
  await wrong.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  eq("the current password has to be right",
    await wrong.locator("#app-status").innerText(), "Zły e-mail lub hasło.");
  await wrong.close();

  const page = await openTab(ctx, "account");
  await page.fill("#password-current", "sekret123");
  await page.fill("#password-new", "nowe123456");
  await page.click("#password-form button[type=submit]");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  eq("the right one changes it", await page.locator("#app-status").innerText(), "Hasło zmienione.");
  const calls = await page.evaluate(() => window.__fbCalls);
  eq("reauthentication happens first", calls.filter((c) => c[0] === "reauth").pop()[1], "sekret123");
  eq("and the new password is the one sent",
    calls.filter((c) => c[0] === "updatePassword").pop()[1], "nowe123456");
  eq("neither field is left holding a password",
    await page.evaluate(() => document.getElementById("password-current").value
      + document.getElementById("password-new").value), "");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("12c. deleting the account, against the rules as deployed today");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openTab(ctx, "account", {
    docs: {
      "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web" },
      "users/u1/projects/p1": { name: "Łazienka", archived: false, createdAt: 1, updatedAt: 1, schemaVersion: 1 },
      "users/u1/rooms/r1": { name: "Kuchnia", lengthM: 3, widthM: 2, heightM: 2.6, createdAt: 1, updatedAt: 1, schemaVersion: 1 },
    },
  });
  // `allow delete: if false` on users/{uid} is still what the live project answers with.
  await page.evaluate(() => { window.__fbNoProfileDelete = true; });
  page.on("dialog", (d) => d.accept());

  await page.fill("#delete-password", "sekret123");
  await page.click("#app-delete-account");
  await page.waitForSelector("#app-status.err", { timeout: 5000 });

  eq("the visitor is told the refusal, not \"something went wrong\"",
    await page.locator("#app-status").innerText(),
    "Nie udało się usunąć konta — serwer odrzucił żądanie. Twoje dane są nietknięte. " +
    "Napisz do nas, usuniemy je ręcznie.");
  const left = await page.evaluate(() => [...window.__fbDocs.keys()].sort());
  check("and nothing was destroyed on the way to finding out",
    left.join() === "users/u1,users/u1/projects/p1,users/u1/rooms/r1", left.join());
  check("the account is still signed in", await visible(page, "#app-workspace"));
  const calls = await page.evaluate(() => window.__fbCalls.map((c) => c[0]));
  check("and the Firebase user was never deleted", !calls.includes("deleteUser"), calls.join(","));

  // The listeners are dropped before the deletion starts. A refused deletion has to put
  // them back, or the visitor is left looking at a workspace that no longer updates.
  // Three of them since session 37 — projects, rooms and the profile, which is the one
  // nothing else would ever re-attach — so six subscriptions over the two rounds.
  eq("and all three listeners were re-subscribed",
    await page.evaluate(() => window.__fbListeners.length), 6);
  check("the projects are still on the page",
    (await page.locator("#project-list").innerText()).includes("Łazienka"));
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("12d. deleting the account, once the rules are deployed");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openTab(ctx, "account", {
    docs: {
      "users/u1": { createdAt: 1, lastSeenAt: 1, appVersion: "web" },
      "users/u1/projects/p1": { name: "Łazienka", archived: false, createdAt: 1, updatedAt: 1, schemaVersion: 1 },
      "users/u1/projects/p1/estimations/e1": { name: "Płytki", createdAt: 1, updatedAt: 1, schemaVersion: 1 },
      "users/u1/projects/p1/shoppingItems/s1": { name: "Klej", createdAt: 1, updatedAt: 1, schemaVersion: 1 },
      "users/u1/rooms/r1": { name: "Kuchnia", lengthM: 3, widthM: 2, heightM: 2.6, createdAt: 1, updatedAt: 1, schemaVersion: 1 },
      "sharedProjects/tok1": { ownerId: "u1", projectName: "Łazienka" },
    },
  });
  page.on("dialog", (d) => d.accept());
  await page.fill("#delete-password", "sekret123");
  await page.click("#app-delete-account");
  await page.locator("#app-auth").waitFor({ state: "visible", timeout: 5000 });

  const left = await page.evaluate(() => [...window.__fbDocs.keys()]);
  eq("every document the account owned is gone, subcollections included", left.join(), "");
  const calls = await page.evaluate(() => window.__fbCalls.map((c) => c[0]));
  check("the Firebase user goes last, after the documents",
    calls.indexOf("deleteUser") === calls.length - 1, calls.join(","));
  eq("and the page says so", await page.locator("#app-status").innerText(), "Konto usunięte.");
  check("which the listeners losing their permission must not overwrite",
    (await page.locator("#app-status.err").count()) === 0);
  eq("the session hint is cleared",
    await page.evaluate(() => localStorage.getItem("liczmat-signed-in")), null);
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("12e. a listener losing its permission is not a message to the visitor");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openTab(ctx, "profile");
  await page.fill("#prof-name", "Jan Kowalski");
  await page.click("#name-form button[type=submit]");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });

  // Firestore pushes permission-denied into every live listener when the user signs out.
  await page.evaluate(() => (window.__fbListeners || []).forEach((fn) => fn && fn({ code: "permission-denied" })));
  await page.waitForTimeout(100);
  eq("the confirmation survives it",
    await page.locator("#app-status").innerText(), "Nazwa zapisana.");
  check("and it is not reported as an error",
    (await page.locator("#app-status.err").count()) === 0);
  await page.close();
  await ctx.close();
}

/* --- 13. what the rest of the site does with the session ----------------------------- */

head("13. the session, as the other pages see it");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });

  const guest = await openApp(ctx, "/kalkulatory/plytki-panele-gres/");
  check("a calculator page offers an account under the result",
    (await guest.locator(".ws-save-account a").count()) === 1);
  eq("and the link opens the sign-up form, with the way back",
    await guest.locator(".ws-save-account a").getAttribute("href"),
    "/app/?mode=signup&next=%2Fkalkulatory%2Fplytki-panele-gres%2F");
  check("the header's account button carries no mark",
    (await guest.locator(".nav-cta[data-level]").count()) === 0);
  await guest.close();

  const member = await openApp(ctx, "/kalkulatory/plytki-panele-gres/", {
    storage: { "liczmat-signed-in": "liczmat" },
  });
  check("with a session, the sentence is about sync instead",
    (await member.locator(".ws-save-account a").count()) === 0);
  eq("and the header's account button is marked",
    await member.locator(".nav-cta").getAttribute("data-level"), "liczmat");
  eq("with the wording in the page's language",
    await member.locator(".nav-cta").getAttribute("title"), "Jesteś zalogowany");
  await member.close();

  const pro = await openApp(ctx, "/en/calculators/tiles-panels-porcelain/", {
    storage: { "liczmat-signed-in": "pro" },
  });
  eq("Pro is marked as Pro, in the language of the page",
    await pro.locator(".nav-cta").getAttribute("title"), "You are signed in — LiczMat Pro");
  await pro.close();

  // The hint decides copy and nothing else. Saving a result must work with it absent,
  // present, or stale — FIRESTORE_SYNC §1.2.
  const stale = await openApp(ctx, "/kalkulatory/plytki-panele-gres/", {
    storage: { "liczmat-signed-in": "liczmat" },
  });
  await stale.click("[data-ws-save]");
  const lines = await stale.evaluate(() =>
    JSON.parse(localStorage.getItem("materio-workspace-v1")).estimations.length);
  check("a result still saves with a session hint present", lines === 1, `saved ${lines}`);
  await stale.close();
  await ctx.close();
}

/* --- 15. the navigation and the rooms (fixes after session 20) ----------------------- */

head("15. /app/ carries the whole menu, in whatever language it is showing");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/", { accounts: ACCOUNT });

  // Until the owner reported it, this page had one link — "Kalkulatory", hard-coded in
  // Polish — so signing in emptied the menu.
  const labels = await page.$$eval(".nav-list a", (a) => a.map((e) => e.textContent.trim()));
  eq("five links, the architecture's own", labels.length, 5);
  eq("in the architecture's order", labels.join(","),
    "Kalkulatory,Materiały,Projekty,Poradniki,Aplikacja");

  const hrefs = () => page.$$eval(".nav-list a", (a) => a.map((e) => e.getAttribute("href")));
  eq("and they point at the Polish pages", (await hrefs()).join(","),
    "/kalkulatory/,/materialy/,/projekty/,/poradniki/,/aplikacja/");

  // Translating the label is only half a menu: "Materialien" pointing at /materialy/ is a
  // link that lies. The build hands the page every language's address in window.LM_NAV.
  await page.click("#lang-picker button");
  await page.click('#lang-picker [data-lang="de"]');
  await page.waitForFunction(() => document.documentElement.lang === "de");
  const german = await page.$$eval(".nav-list a", (a) => a.map((e) => e.textContent.trim()));
  eq("the labels follow the language", german.join(","),
    "Rechner,Materialien,Projekte,Ratgeber,Die App");
  eq("and so do the addresses", (await hrefs()).join(","),
    "/de/rechner/,/de/materialien/,/de/projekte/,/de/ratgeber/,/de/android-app/");
  eq("no console error", page.lmErrors.join(" / "), "");

  // /p/<token> keeps the short list on purpose: it is a quote opened by somebody else's
  // client, and a full menu turns it into a funnel.
  const share = await openApp(ctx, "/p/?t=nic", { lang: "pl" });
  eq("the shared estimate keeps one way back", await share.locator(".nav-list a").count(), 1);
  await share.close();
  await page.close();
  await ctx.close();
}

head("16. rooms stand inside the project they belong to");
{
  const sync = { createdAt: 1, updatedAt: 1, deletedAt: null, schemaVersion: 1 };
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  // The fake Firestore does not push changes, so the lists are seeded rather than typed
  // into — what is being measured here is the rendering and the document that is written.
  const page = await openTab(ctx, "projects", {
    docs: {
      "users/u1": { plan: "free" },
      "users/u1/projects/p1": { name: "Remont łazienki", archived: false, ...sync },
      "users/u1/projects/p2": { name: "Salon", archived: false, ...sync },
      // Chapter XVIII's link, on a room this site pushed.
      "users/u1/rooms/r1": { name: "Łazienka", lengthM: 2.4, widthM: 3.2, heightM: 2.5, projectId: "p1", ...sync },
      // And a room the phone made: roomToDoc() has no projectId to send, so it has none.
      "users/u1/rooms/r2": { name: "Garaż", lengthM: 6, widthM: 3, heightM: 2.4, ...sync },
    },
  });
  await page.waitForSelector('#project-list li[data-id="p1"] .app-rooms li[data-id="r1"]');

  const p1 = '#project-list li[data-id="p1"]';
  const text = await page.locator(`${p1} .app-rooms`).innerText();
  check("the project draws its own room", text.includes("Łazienka"), text);
  check("with the dimensions", /2,4\s*×\s*3,2\s*×\s*2,5\s*m/.test(text), text);
  check("and the floor they come to", text.includes("7,68"), text);
  check("another project's rooms are not in it", !text.includes("Garaż"), text);
  eq("a project with no room says so",
    await page.locator('#project-list li[data-id="p2"] .app-rooms .empty').count(), 1);

  // The rooms nobody assigned are listed rather than hidden: they are real rooms, and
  // hiding them would look like losing them.
  const loose = await page.locator("#room-list").innerText();
  check("the unassigned room has a list of its own", loose.includes("Garaż"), loose);
  check("and the assigned one is not repeated in it", !loose.includes("Łazienka"), loose);

  // Adding one, inside the project it belongs to. Until the owner reported it, addRoom()
  // did not write a projectId at all, so a room made here belonged to nothing.
  await page.fill(`${p1} [data-f="name"]`, "Przedpokój");
  await page.fill(`${p1} [data-f="lengthM"]`, "1,4");
  await page.fill(`${p1} [data-f="widthM"]`, "4");
  await page.fill(`${p1} [data-f="heightM"]`, "2,5");
  await page.click(`${p1} [data-room-form] button[type=submit]`);
  await page.waitForFunction(() =>
    [...window.__fbDocs.values()].some((d) => d.name === "Przedpokój"));

  const doc = await page.evaluate(() => {
    for (const [path, data] of window.__fbDocs) {
      if (data.name === "Przedpokój") return { path, data };
    }
    return null;
  });
  check("the room reached the store", Boolean(doc), "no room document written");
  check("beside the projects, as the contract says (FIRESTORE_SYNC §2)",
    /^users\/u1\/rooms\//.test(doc.path), doc.path);
  eq("and it names the project it was added inside", doc.data.projectId, "p1");
  eq("with a comma read as a decimal point", doc.data.lengthM, 1.4);
  eq("and the contract's own fields", `${doc.data.widthM}|${doc.data.heightM}`, "4|2.5");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();
  await ctx.close();
}

head("17. whose copy is in this browser, and how to empty it (session 35)");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });

  // The four data stores of chapter II's local workspace, as this device would hold them
  // after somebody else pulled their account into it. `liczmat-sync-account` is the stamp
  // that says whose they are; "u2" is not the account signing in below.
  const rows = JSON.stringify({
    projects: [{ id: "p9", name: "Kowalski", archived: false, createdAt: 1, updatedAt: 1, deletedAt: null }],
    rooms: [], estimations: [], shoppingItems: [],
  });
  const planted = {
    "materio-workspace-v1": rows,
    "materio-active-project": "p9",
    "liczmat-recent-calcs": JSON.stringify([{ id: "waste", at: 1 }]),
    "liczmat-crm-v1": JSON.stringify({ clients: [{ id: "c1", name: "Nowak" }], jobs: [], quotes: [] }),
    "liczmat-sync-account": "u2",
    // The settings, which the wipe must not touch.
    "liczmat-theme": "dark",
    "liczmat-currency": "EUR",
    "liczmat-remember": "0",
    "materio_consent": "granted",
  };

  const page = await openTab(ctx, "sync", { storage: planted });
  page.on("dialog", (d) => d.accept());

  await page.waitForSelector("#app-sync-foreign:not([hidden])", { timeout: 5000 });
  const warning = await page.locator("#app-sync-foreign").innerText();
  check("another account's copy is named out loud", warning.includes("innego konta"), warning);
  eq("push is refused", await page.locator("#app-sync-push").isDisabled(), true);
  eq("and so is pull", await page.locator("#app-sync-pull").isDisabled(), true);

  // Pressing it anyway — the way a script would, past the disabled attribute — writes
  // nothing to the account.
  const before = await page.evaluate(() => window.__fbDocs.size);
  await page.evaluate(() => document.getElementById("app-sync-push").click());
  eq("clicking through the disabled button uploads nothing",
    await page.evaluate(() => window.__fbDocs.size), before);

  // The way out is on the settings tab, and it empties this browser.
  await page.click('[data-tab="account"]');
  await page.click("#app-wipe");
  await page.waitForSelector("#app-status:not([hidden])", { timeout: 5000 });
  const kept = await page.evaluate(() => {
    const out = {};
    for (const key of ["materio-workspace-v1", "materio-active-project", "liczmat-recent-calcs",
      "liczmat-crm-v1", "liczmat-sync-account", "liczmat-theme", "liczmat-currency",
      "liczmat-remember", "materio_consent", "liczmat-signed-in"]) {
      out[key] = localStorage.getItem(key);
    }
    return out;
  });
  for (const gone of ["materio-workspace-v1", "materio-active-project", "liczmat-recent-calcs",
    "liczmat-crm-v1", "liczmat-sync-account"]) {
    eq(`${gone} is gone`, kept[gone], null);
  }
  eq("the theme stays", kept["liczmat-theme"], "dark");
  eq("the currency stays", kept["liczmat-currency"], "EUR");
  eq("the answer about the session stays", kept["liczmat-remember"], "0");
  eq("the consent answer stays", kept["materio_consent"], "granted");
  check("and nobody is signed out", kept["liczmat-signed-in"] !== null, kept["liczmat-signed-in"]);

  // With the browser empty the sync tab opens again — the refusal was about the rows,
  // not about the account.
  await page.click('[data-tab="sync"]');
  await page.waitForSelector("#app-sync-foreign", { state: "hidden", timeout: 5000 });
  eq("push is offered again", await page.locator("#app-sync-push").isDisabled(), false);
  eq("and pull", await page.locator("#app-sync-pull").isDisabled(), false);

  // A pull stamps the browser with the account it came from, which is what makes the
  // next person's refusal possible.
  await page.click("#app-sync-pull");
  await page.waitForFunction(() => localStorage.getItem("liczmat-sync-account") !== null,
    null, { timeout: 5000 });
  eq("the pull stamps this browser with the account",
    await page.evaluate(() => localStorage.getItem("liczmat-sync-account")), "u1");
  eq("no console error", page.lmErrors.join(" / "), "");
  await page.close();

  // The visitor's own guest work, with no stamp on it, is never refused.
  const guestWork = await openTab(ctx, "sync", { storage: { "materio-workspace-v1": rows } });
  eq("an unstamped workspace is nobody else's",
    await guestWork.locator("#app-sync-foreign").isHidden(), true);
  eq("and it can still be pushed", await guestWork.locator("#app-sync-push").isDisabled(), false);
  await guestWork.close();
  await ctx.close();
}

/* ------------------------------------------------------------------ the verdict */

await browser.close();
server.close();

const total = passed + failures.length;
if (failures.length) {
  console.error(`\n${failures.length} of ${total} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`account page: ${total}/${total} checks pass`);
