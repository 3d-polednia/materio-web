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
 * verification of that is FIRESTORE_SYNC §8 in the app repo.
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

/* ------------------------------------------------------------------ the fake SDK */

/**
 * Firebase, as much of it as assets/app.js touches.
 *
 * Three modules are served: firebase-app.js, firebase-auth.js and firebase-firestore.js,
 * exactly the specifiers the page imports. The accounts live in `window.__fbAccounts` so
 * a test can plant one with `plan: "premium"` before the page loads and see the page come
 * up as LiczMat Pro. Every call the page makes is recorded in `window.__fbCalls`, which
 * is how a test asks "did it really ask for session persistence before signing in".
 */
const FAKE_APP = `
export function initializeApp(config) { return { config }; }
`;

const FAKE_AUTH = `
const S = (window.__fb = window.__fb || {
  accounts: window.__fbAccounts || {},
  calls: [],
  user: null,
  listeners: [],
});
window.__fbCalls = S.calls;
const log = (name, arg) => S.calls.push([name, arg === undefined ? null : arg]);
const fail = (code) => { const e = new Error(code); e.code = code; throw e; };

function emit() { S.listeners.forEach((fn) => fn(S.user)); }
function setUser(u) { S.user = u; emit(); }

export function getAuth() {
  return {
    get currentUser() { return S.user; },
    __store: S,
  };
}
export function onAuthStateChanged(auth, fn) { S.listeners.push(fn); fn(S.user); return () => {}; }

export const browserLocalPersistence = "local";
export const browserSessionPersistence = "session";
export function setPersistence(auth, mode) { log("setPersistence", mode); return Promise.resolve(); }

export function signInWithEmailAndPassword(auth, email, password) {
  log("signIn", email);
  const account = S.accounts[email];
  if (!account) return Promise.reject(Object.assign(new Error("x"), { code: "auth/user-not-found" }));
  if (account.password !== password) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/invalid-credential" }));
  }
  setUser(account.user);
  return Promise.resolve({ user: account.user });
}
export function createUserWithEmailAndPassword(auth, email, password) {
  log("createUser", email);
  if (S.accounts[email]) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/email-already-in-use" }));
  }
  if (String(password).length < 6) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/weak-password" }));
  }
  const user = {
    uid: "uid-" + Object.keys(S.accounts).length, email, emailVerified: false,
    displayName: "", providerData: [{ providerId: "password" }],
  };
  S.accounts[email] = { password, user };
  setUser(user);
  return Promise.resolve({ user });
}
export function signOut() { log("signOut"); setUser(null); return Promise.resolve(); }
export function sendPasswordResetEmail(auth, email) {
  log("resetMail", email);
  if (!email || email.indexOf("@") < 0) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/invalid-email" }));
  }
  return Promise.resolve();
}
export function sendEmailVerification() { log("verifyMail"); return Promise.resolve(); }
export function updateProfile(user, fields) {
  log("updateProfile", fields.displayName);
  Object.assign(user, fields);
  emit();
  return Promise.resolve();
}
export function updatePassword() { log("updatePassword"); return Promise.resolve(); }
export function verifyBeforeUpdateEmail() { log("updateEmail"); return Promise.resolve(); }
export function deleteUser() { log("deleteUser"); setUser(null); return Promise.resolve(); }
export function reauthenticateWithCredential() { return Promise.resolve(); }
export function reauthenticateWithPopup() { return Promise.resolve(); }
export class GoogleAuthProvider {}
export const EmailAuthProvider = { credential: () => ({}) };
export function signInWithPopup() {
  log("googlePopup");
  const user = {
    uid: "uid-google", email: "google@example.com", emailVerified: true,
    displayName: "Google Person", providerData: [{ providerId: "google.com" }],
  };
  S.accounts[user.email] = { password: null, user };
  setUser(user);
  return Promise.resolve({ user });
}
`;

const FAKE_STORE = `
const DOCS = (window.__fbDocs = window.__fbDocs || new Map());
const key = (parts) => parts.join("/");
export function getFirestore() { return { DOCS }; }
export function enableIndexedDbPersistence() { return Promise.resolve(); }
export function doc(db, ...parts) { return { path: key(parts), kind: "doc" }; }
export function collection(db, ...parts) { return { path: key(parts), kind: "collection" }; }
export function query(ref) { return ref; }
export function orderBy() { return null; }
export function where() { return null; }
export function getDoc(ref) {
  const data = DOCS.get(ref.path);
  return Promise.resolve({ exists: () => data !== undefined, data: () => data });
}
export function setDoc(ref, data) { DOCS.set(ref.path, { ...data }); return Promise.resolve(); }
export function updateDoc(ref, data) {
  DOCS.set(ref.path, { ...(DOCS.get(ref.path) || {}), ...data });
  return Promise.resolve();
}
export function deleteDoc(ref) { DOCS.delete(ref.path); return Promise.resolve(); }
export function getDocs(ref) {
  const rows = [];
  DOCS.forEach((value, path) => {
    const at = path.lastIndexOf("/");
    if (path.slice(0, at) === ref.path) rows.push({ id: path.slice(at + 1), ref: { path }, data: () => value });
  });
  return Promise.resolve({ docs: rows, forEach: (fn) => rows.forEach(fn) });
}
export function onSnapshot(ref, onNext) {
  const rows = [];
  DOCS.forEach((value, path) => {
    const at = path.lastIndexOf("/");
    if (path.slice(0, at) === ref.path) rows.push({ id: path.slice(at + 1), data: () => value });
  });
  onNext({ forEach: (fn) => rows.forEach(fn), metadata: { fromCache: false } });
  return () => {};
}
`;

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
  // The fake Firestore is created when the page imports it; seed it right after.
  await page.evaluate(() => {
    const wait = () => new Promise((r) => setTimeout(r, 0));
    return (async () => {
      for (let i = 0; i < 50 && !window.__fbDocs; i++) await wait();
      if (window.__fbDocs) {
        Object.entries(window.__fbSeed || {}).forEach(([k, v]) => window.__fbDocs.set(k, v));
      }
    })();
  });
  page.lmErrors = errors;
  return page;
}

const visible = (page, selector) => page.locator(selector).isVisible();
const signedIn = (page) => page.locator("#app-workspace").waitFor({ state: "visible", timeout: 5000 });

/* --- 1. the signed-out page ---------------------------------------------------------- */

head("1. signed out: three views, one card");
{
  const ctx = await context({ viewport: { width: 1280, height: 900 } });
  const page = await openApp(ctx, "/app/");

  check("the sign-in view is the one on show", await visible(page, '[data-auth-view="signin"]'));
  check("the sign-up view is not", !(await visible(page, '[data-auth-view="signup"]')));
  check("nor the reset view", !(await visible(page, '[data-auth-view="reset"]')));
  check("Google sign-in is offered", await visible(page, "#auth-google"));
  check("the workspace is hidden", !(await visible(page, "#app-workspace")));

  await page.click('[data-auth-go="signup"]');
  check("the sign-up link opens the sign-up view", await visible(page, '[data-auth-view="signup"]'));
  check("and closes the sign-in one", !(await visible(page, '[data-auth-view="signin"]')));
  check("Google is still an option there", await visible(page, "#auth-google"));

  await page.click('[data-auth-view="signup"] [data-auth-go="signin"]');
  await page.click('[data-auth-view="signin"] [data-auth-go="reset"]');
  check("the forgotten-password link opens the reset view", await visible(page, '[data-auth-view="reset"]'));
  check("which has an e-mail field of its own", await visible(page, "#reset-email"));
  check("and no Google button, which would not reset anything",
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
  check("which still offers nothing to buy — nothing grants the plan yet",
    (await pro.locator('#panel-profile .lvl-card[data-level="pro"] a, #panel-profile .lvl-card[data-level="pro"] button').count()) === 0);
  eq("no console error", pro.lmErrors.join(" / "), "");
  await pro.close();
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

  eq("there are five", await page.locator(".app-tab").count(), 5);
  eq("only the selected one is in the tab order",
    await page.locator('.app-tab[tabindex="0"]').count(), 1);

  await page.locator('[data-tab="projects"]').focus();
  await page.keyboard.press("ArrowRight");
  eq("the right arrow moves to the next tab",
    await page.evaluate(() => document.activeElement.dataset.tab), "rooms");
  check("and opens its panel", await visible(page, '[data-panel="rooms"]'));
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
  await page.click('.lang-item[data-lang="de"]');
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
    await page.close();
    await ctx.close();
  }
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
