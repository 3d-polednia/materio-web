#!/usr/bin/env node
/**
 * LiczMat — the security of the whole product, tested.
 *
 *     node scripts/test-security.mjs
 *
 * Master plan, session 35 (SECURITY): "autoryzacja, izolacja danych, API, uprawnienia,
 * poziomy dostępu. GOŚĆ → LICZMAT → LICZMAT PRO."
 *
 * What this site can and cannot defend is worth stating before the first check, because
 * half of these are checks that something is *not* claimed:
 *
 *   - The one real boundary is the deployed Firestore rules. They key on
 *     `request.auth.uid`, they live in the app repo (`config/firebase/firestore.rules`,
 *     FIRESTORE_SYNC §7) and nothing in this repo can weaken or strengthen them. What
 *     this repo can do is never *address* another account's data, which §7 checks.
 *   - Everything in `localStorage` is this device's, in the open, and in no sync
 *     contract. The paywall, `liczmat-signed-in` and `lmCan()` decide what a page
 *     *shows*; a visitor with devtools can show themselves anything. That is written
 *     down in assets/plan.js and §9 checks the code still matches the claim.
 *   - Between those two sits everything that *is* this repo's to get right: the
 *     addresses it builds out of somebody else's input, the copies of one account's data
 *     it leaves on a shared device, the credential it puts in a URL, and the strings it
 *     writes into HTML. Sessions 13–34 built those; this one audits them.
 *
 * The five things the chapter names, and where they are:
 *
 *   autoryzacja      §2 the `?next=` a sign-in page may come back to, §3 the view it
 *                    opens with, §4 the token that *is* the authorisation on /p/
 *   izolacja danych  §5 the address that is a credential, §6 one account's copy left on
 *                    a device somebody else also uses, §11 the way to clear it
 *   API              §7 every Firestore address this site builds, §8 the profile fields
 *                    a browser may not write, §12 what is not in the repo
 *   uprawnienia      §9 the permission table against the routes, and the hint that
 *                    gates nothing
 *   poziomy dostępu  §1 the three levels, derived and never asserted
 *
 * Plus §10, the markup — what the shipped files hand a browser to execute — and §13,
 * what a name somebody else typed does once it reaches HTML, a CSV or a file name.
 *
 * Dependency-free, plain `node`, exit 1 on failure — the same shape as the other
 * nineteen suites.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { LEVEL, route } from "../src/ia.mjs";
import { COOKIE_ROWS } from "../src/pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (...s) => readFileSync(p(...s), "utf8");

// The three characters a URL parser deletes and a spreadsheet reads as a new row.
// Written as codes rather than as literals, so they survive being read and diffed.
const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);

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

/** Evaluate browser scripts as one scope — what two <script> tags do — and hand back globals. */
function evalScript(file, returns, globals) {
  const src = [].concat(file).map((f) => read(f)).join("\n");
  const names = Object.keys(globals || {});
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(
    ...names.map((n) => globals[n]));
}

/**
 * assets/app.js, evaluated.
 *
 * It is a module and it imports the Firebase config, so the import line is replaced by
 * the four values it names — nothing here reaches Firebase. Everything else is the
 * shipped file, including the top-level `document.addEventListener` at the bottom, which
 * is why a document stub is handed in. `store` is this browser's localStorage, planted.
 */
function loadApp(store) {
  const src = read("assets/app.js").replace(/^import .*$/m,
    "const FIREBASE_CONFIG = {}, FIREBASE_READY = true, FIREBASE_SDK = '', SCHEMA_VERSION = 1;");
  const document = {
    addEventListener() {}, dispatchEvent() {},
    documentElement: { lang: "pl", setAttribute() {}, removeAttribute() {} },
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  };
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  // assets/workspace.js is loaded before app.js on the page and app.js reads it through
  // its globals — wsExport() is what "how much is in this browser" is counted from, so
  // without it every count here would be zero and §6 would pass by being empty. Since
  // session 46 the same holds for assets/crm-store.js: the Pro store is the one on this
  // device holding another person's name, telephone number and address, so it is exactly
  // the store that must not be pushed into the next person's account.
  return new Function("document", "localStorage", "window", "crypto", "CustomEvent",
    `${read("assets/account.js")}\n${read("assets/workspace.js")}\n${read("assets/crm-store.js")}\n${src}\nreturn {
       pathId, foreignWorkspace, syncAccount, setSyncAccount, state, SYNC_ACCOUNT_KEY,
       lmSafeNext, lmAuthMode, lmSignupUrl, lmReadLevel, lmLevelOf, LM_LEVEL,
     };`)(document, localStorage, {}, { getRandomValues: (a) => a }, function CustomEvent() {});
}

/** Every shipped .html file: the generated ones and the two written by hand. */
function shippedPages(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if ([".git", "node_modules", "docs", "src", "scripts"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) shippedPages(full, out);
    else if (name.endsWith(".html")) out.push(relative(ROOT, full));
  }
  return out;
}

const PAGES = shippedPages();

/* ------------------------------------------------------------------ 1. the levels */

head("1. GOŚĆ → LICZMAT → LICZMAT PRO, derived and never asserted");
{
  const app = loadApp({});
  const { lmLevelOf, lmReadLevel, LM_LEVEL } = app;

  eq("no user is a guest", lmLevelOf(null, null), LM_LEVEL.GUEST);
  eq("a user with no profile is LICZMAT", lmLevelOf({ uid: "u" }, null), LM_LEVEL.LICZMAT);
  eq("a free plan is LICZMAT", lmLevelOf({ uid: "u" }, { plan: "free" }), LM_LEVEL.LICZMAT);
  eq("premium is PRO", lmLevelOf({ uid: "u" }, { plan: "premium" }), LM_LEVEL.PRO);
  eq("premium that ran out is LICZMAT again",
    lmLevelOf({ uid: "u" }, { plan: "premium", planValidUntil: 1000 }, 2000), LM_LEVEL.LICZMAT);

  // The level a *page* reads is a hint in localStorage, and the whole of what it can say
  // is one of three words. Anything else is a guest, so a planted value cannot lift
  // somebody a level by being unrecognised.
  const junk = ["", "admin", "PRO", "premium", "1;pro", '{"level":"pro"}', "guest",
    "prooo", " pro", "pro ", "0", "liczmat,pro"];
  for (const value of junk) {
    const planted = loadApp({ "liczmat-signed-in": value });
    check(`a hint of ${JSON.stringify(value)} is not PRO`,
      planted.lmReadLevel() !== LM_LEVEL.PRO, planted.lmReadLevel());
  }
  eq("nothing stored is a guest", lmReadLevel(), LM_LEVEL.GUEST);
  eq('"1", written before session 13, still reads as signed in',
    loadApp({ "liczmat-signed-in": "1" }).lmReadLevel(), LM_LEVEL.LICZMAT);
  eq('and "pro" reads as PRO — /app/ is its only writer',
    loadApp({ "liczmat-signed-in": "pro" }).lmReadLevel(), LM_LEVEL.PRO);

  // One derivation, in one file. A second is how two answers to "who is this" get into
  // one product.
  const account = read("assets/account.js");
  check("the plan value that means Pro is declared once and read once",
    (account.match(/LM_PLAN_PRO/g) || []).length === 2);
  const plan = read("assets/plan.js");
  check("assets/plan.js derives no level of its own", plan.includes("lmLevelOf(user, profile"));
  // The comments there discuss the hint at length; what matters is that no line of code
  // reads it, because a permission answered from a stale hint is a permission answered
  // wrong. Comments out, then look.
  const planCode = plan.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check("and no line of code in it reads the hint",
    !planCode.includes("lmReadLevel(") && !planCode.includes("liczmat-signed-in"));
}

/* ------------------------------------------------------------------ 2. ?next= */

head("2. autoryzacja: where a sign-in page may send somebody afterwards");
{
  const { lmSafeNext, lmSignupUrl } = loadApp({});
  const BASE = "https://liczmat.com/app/";

  const ok = ["/", "/kalkulatory/", "/projekty/?id=abc", "/app/dashboard/",
    "/kalkulatory/plytki/#faq",
    // A space is not one of the characters the parser deletes: it is percent-encoded,
    // and "/%20/evil.example" is a path on this site with an odd name.
    "/ /evil.example"];
  for (const value of ok) eq(`${JSON.stringify(value)} is kept`, lmSafeNext(value), value);

  const hostile = [
    "//evil.example",                    // protocol-relative
    "///evil.example",
    "/\\evil.example",                   // a backslash is a slash to the URL parser
    "/\\\\evil.example",
    "https://evil.example",
    "http://evil.example",
    "javascript:alert(1)",
    "/javascript:alert(1)",              // a scheme after the slash
    "data:text/html,<script>",
    TAB + "//evil.example",
    "/" + TAB + "/evil.example",         // session 35: the parser DELETES the tab
    "/" + LF + "/evil.example",
    "/" + CR + "/evil.example",
    "/" + TAB + TAB + "//evil.example",
    "evil.example",
    "",
    null,
    undefined,
  ];
  for (const value of hostile) eq(`${JSON.stringify(value)} is refused`, lmSafeNext(value), "");

  // The same inputs read the way a browser reads them. The string is only evidence: for
  // three of the values above it looked like a path right up to the moment the URL
  // parser threw a character away and found "//evil.example" underneath.
  for (const value of [...ok, ...hostile]) {
    const got = lmSafeNext(value);
    if (!got) { passed++; continue; }
    check(`${JSON.stringify(value)} resolves to liczmat.com`,
      new URL(got, BASE).origin === "https://liczmat.com", new URL(got, BASE).href);
  }

  // The link a calculator page offers ("załóż darmowe konto") carries the path it was
  // pressed on, through the same door, encoded on the way.
  eq("the sign-up link carries a safe path",
    lmSignupUrl("/kalkulatory/plytki/"), "/app/?mode=signup&next=%2Fkalkulatory%2Fplytki%2F");
  eq("and drops a hostile one", lmSignupUrl("//evil.example"), "/app/?mode=signup");
  eq("and the tabbed one too", lmSignupUrl("/" + TAB + "/evil.example"), "/app/?mode=signup");

  const app = read("assets/app.js");
  check("/app/ never reads `next` without lmSafeNext()",
    (app.match(/get\("next"\)/g) || []).length === 1
    && /lmSafeNext\(new URLSearchParams\(location\.search\)\.get\("next"\)\)/.test(app));
}

/* ------------------------------------------------------------------ 3. ?mode= */

head("3. autoryzacja: which of the three forms opens");
{
  const { lmAuthMode } = loadApp({});
  eq("no parameter opens sign-in", lmAuthMode(""), "signin");
  eq("?mode=signup", lmAuthMode("?mode=signup"), "signup");
  eq("?mode=reset", lmAuthMode("?mode=reset"), "reset");
  for (const junk of ["?mode=admin", "?mode=signin'", "?mode=%3Cscript%3E", "?mode=",
    "?mode=__proto__"]) {
    eq(`${junk} falls back to sign-in`, lmAuthMode(junk), "signin");
  }
}

/* ------------------------------------------------------------------ 4. the share token */

head("4. autoryzacja: the token in a /p/ link is the whole of it");
{
  const share = read("assets/share.js");
  const app = read("assets/app.js");

  // 16 bytes from the CSPRNG. Not Math.random(), not a counter, not the project id: the
  // token is the only thing between a link and somebody's prices.
  check("the token is 16 bytes of crypto.getRandomValues",
    /crypto\.getRandomValues\(new Uint8Array\(16\)\)/.test(app));
  check("and nothing here derives one from Math.random()",
    !/Math\.random\(\)/.test(app) && !/Math\.random\(\)/.test(share));

  // The shape is checked before the token becomes a Firestore path: Firestore joins the
  // segments it is handed, so `?t=a/b/c` addressed sharedProjects/a/b/c until session 35.
  const shape = share.match(/const SHARE_TOKEN = (\/.*\/);/);
  check("assets/share.js declares the shape it accepts", Boolean(shape));
  if (shape) {
    const re = new RegExp(shape[1].slice(1, -1));
    for (const token of ["A".repeat(22), "abcDEF012345_-xyzABCD12", "0123456789abcdef"]) {
      check(`${token} is a token`, re.test(token));
    }
    const bad = ["", "short", "a/b/c/d/e/f/g/h/i/j", "../../users/other/projects/x",
      "AAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA?",
      "AAAAAAAAAAAAAAAA ", "AAAAAAAAAAAAAAAA#x", "A".repeat(2000), "__name__",
      "AAAAAAAAAAAAAAAA.AAAA"];
    for (const token of bad) check(`${JSON.stringify(token)} is not`, !re.test(token));
  }
  check("both entry points read the same shape",
    (share.match(/\[A-Za-z0-9_-\]\{16,64\}/g) || []).length === 2,
    "the ?t= parameter and the /p/<token> path");
  check("404.html forwards only that shape", read("404.html").includes("[A-Za-z0-9_-]{16,64}"));
  check("and encodes what it forwards",
    read("404.html").includes('location.replace("/p/?t=" + encodeURIComponent('));

  // The document is world-readable by design, so it carries the estimate and the uid the
  // owner needs to find it again — and nothing about the person who made it.
  const sharing = app.slice(app.indexOf("async function shareProject"),
    app.indexOf("/* ------------------------------------------------------------------ wiring */"));
  check("a share carries the owner's uid so it can be revoked", /ownerId: state\.uid/.test(sharing));
  check("and no e-mail, no display name", !/email/i.test(sharing) && !/displayName/.test(sharing));
  check("deleting the account revokes every link it made",
    /collection\(db, "sharedProjects"\), fb\.where\("ownerId", "==", state\.uid\)/.test(app));
}

/* ------------------------------------------------------------------ 5. /p/ */

head("5. izolacja danych: the one page whose address is a credential");
{
  const shared = read("p/index.html");

  // GA4 reports `page_location` — the whole address, token and all. A page whose address
  // is the credential therefore ships with no analytics rather than with a scrubbed one.
  check("/p/ loads no analytics", !shared.includes("gtag") && !shared.includes("dataLayer"));
  check("/p/ opens no connection to the tag's host", !shared.includes("googletagmanager"));
  check("/p/ sends no referrer", shared.includes('<meta name="referrer" content="no-referrer">'));
  check("/p/ stays out of the index", shared.includes('content="noindex, nofollow"'));

  // ...and it is one page's exception, not a change to the site.
  const untagged = PAGES.filter((f) => !read(f).includes("googletagmanager.com/gtag/js"));
  check("every other page still carries the tag",
    untagged.every((f) => ["p/index.html", "404.html", "privacy-policy.html"].includes(f)),
    untagged.join(", "));

  // robots.txt must not stand in front of it: a crawler told not to fetch a page never
  // reads the noindex on it, and here the URL it would list *is* the secret.
  check("robots.txt disallows nothing", !/^\s*Disallow:\s*\S/m.test(read("robots.txt")));
  check("and the sitemap does not advertise /p/", !read("sitemap.xml").includes("liczmat.com/p/"));
}

/* ------------------------------------------------------------------ 6. the device copy */

head("6. izolacja danych: one account's copy on a device two people use");
{
  const UID_A = "uid-aaaaaaaaaaaa", UID_B = "uid-bbbbbbbbbbbb";
  const workspace = (rows) => JSON.stringify({
    projects: rows ? [{ id: "p1", name: "Kowalski", updatedAt: 1 }] : [],
    rooms: [], estimations: [], shoppingItems: [],
  });
  const signedIn = (store, uid) => {
    const app = loadApp(store);
    app.state.uid = uid;
    return app;
  };

  // Nothing stamped: the rows are this visitor's own guest work, which is what the sync
  // tab exists for. Both directions stay open.
  eq("an unstamped workspace is nobody else's",
    signedIn({ "materio-workspace-v1": workspace(true) }, UID_A).foreignWorkspace(), false);

  eq("a workspace stamped with this account is not foreign",
    signedIn({ "materio-workspace-v1": workspace(true), "liczmat-sync-account": UID_A },
      UID_A).foreignWorkspace(), false);

  // Stamped with another account: these rows belong to somebody who is not signed in. A
  // push would file them under the wrong account, where their owner cannot reach them.
  eq("another account's copy is refused",
    signedIn({ "materio-workspace-v1": workspace(true), "liczmat-sync-account": UID_A },
      UID_B).foreignWorkspace(), true);

  // Clients, jobs and quotes are a store of their own, and the only one here carrying
  // somebody else's name, telephone number and address. A browser holding nothing but
  // those is precisely the browser that must not push them under the next account.
  const crm = (rows) => JSON.stringify({
    clients: rows ? [{ id: "c-1", name: "Kowalski", updatedAt: 1 }] : [],
    jobs: [], quotes: [],
  });
  eq("a Pro store alone is enough to refuse",
    signedIn({ "liczmat-crm-v1": crm(true), "liczmat-sync-account": UID_A }, UID_B)
      .foreignWorkspace(), true);

  eq("an empty workspace holds nobody's data",
    signedIn({ "materio-workspace-v1": workspace(false), "liczmat-sync-account": UID_A },
      UID_B).foreignWorkspace(), false);

  eq("and a signed-out visitor is never warned about their own browser",
    loadApp({ "materio-workspace-v1": workspace(true), "liczmat-sync-account": UID_A })
      .foreignWorkspace(), false);

  const app = read("assets/app.js");
  check("the stamp is written after a push",
    /setSyncAccount\(state\.uid\);\s*\n\s*renderLocalSummary\(\);\s*\n\s*status\(T\("app_sync_pushed"\)\)/.test(app));
  // The pull writes both stores before it stamps: the workspace and, since session 46, the
  // Pro one. A stamp written between them would name an account only half the rows here
  // came from.
  check("and after a pull", /wsImport\(incoming\);[\s\S]{0,240}?setSyncAccount\(state\.uid\);/.test(app));
  check("the Pro store is pulled by the same button",
    /crmImport\(incoming\);\s*\n\s*setSyncAccount\(state\.uid\);/.test(app));
  check("and pushed by the other one",
    /await pushProWorkspace\(\);\s*\n\s*setSyncAccount\(state\.uid\);/.test(app));
  check("both buttons check it themselves, not only through `disabled`",
    (app.match(/if \(foreignWorkspace\(\)\) \{ status\(T\("app_sync_foreign"\), true\); return; \}/g) || []).length === 2);
  check("and the summary is what disables them",
    /\["app-sync-push", "app-sync-pull"\]\.forEach/.test(app));

  const stamped = loadApp({});
  eq("the stamp is one key", stamped.SYNC_ACCOUNT_KEY, "liczmat-sync-account");
  check("named on /cookies/ with the rest",
    COOKIE_ROWS.some((r) => r.name === "liczmat-sync-account"));
}

/* ------------------------------------------------------------------ 7. Firestore addresses */

head("7. API: every address this site builds");
{
  const app = read("assets/app.js");

  // Every path is under this account, or it is the share document, which is public by
  // design and keyed by the token. There is no third kind.
  const paths = [...app.matchAll(/fb\.(?:doc|collection)\(db,\s*([^)]*)\)/g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim());
  check("there are addresses to check", paths.length >= 10, String(paths.length));
  for (const path of paths) {
    check(`${path} stays inside this account`,
      path.startsWith('"users", user.uid') || path.startsWith('"users", state.uid')
      || path.startsWith('"sharedProjects"'));
  }
  check("no query reaches across accounts",
    !/where\("ownerId", "==", (?!state\.uid)/.test(app));
  for (const file of ["assets/share.js", "assets/dashboard.js", "assets/workspace.js",
    "assets/crm.js", "assets/crm-store.js"]) {
    check(`${file} builds no path under users/`, !read(file).includes('"users"'));
  }

  // A segment is checked before it is joined into a path: an id out of localStorage with
  // a slash in it addresses a different document, and "__x__" is refused by Firestore
  // with an exception that would land in the same catch as a network failure — so the
  // sync said "something went wrong" for a row it should simply have skipped.
  const { pathId } = loadApp({});
  eq("a uuid passes", pathId("6f1a2b3c-0000-4444-8888-aaaabbbbcccc"),
    "6f1a2b3c-0000-4444-8888-aaaabbbbcccc");
  for (const bad of ["", null, undefined, "a/b", "/", "projects/x/estimations/y", ".", "..",
    "__name__", "__x__", "x".repeat(1501)]) {
    eq(`${JSON.stringify(bad)} is refused as a segment`, pathId(bad), "");
  }
  eq("a dot inside an id is fine", pathId("a.b"), "a.b");
  check("the two subcollection writes go through it",
    (app.match(/pathId\((?:e|s)\.projectId\)/g) || []).length === 2);
  check("and so do the two top-level ones",
    /if \(!pathId\(p\.id\)\) continue;/.test(app) && /if \(!pathId\(r\.id\)\) continue;/.test(app));

  // What else leaves the browser, and with what on it.
  const stores = read("assets/stores.js");
  check("the store finder posts a bounding query and nothing else",
    /body: "data=" \+ encodeURIComponent\(q\)/.test(stores));
  check("and says in its own header where the location goes",
    /never stored or sent to us/.test(stores));

  const pay = read("assets/pay.js");
  check("a checkout URL is https on a whole Stripe host",
    /u\.protocol === "https:" && LM_PAY_HOSTS\.indexOf\(u\.hostname\) !== -1/.test(pay));
  check("it carries the uid and the e-mail, never the amount",
    /client_reference_id/.test(pay) && !/searchParams\.set\("amount"/.test(pay));
  check("and assets/pay.js reads no storage at all",
    !/localStorage/.test(pay) && !/sessionStorage/.test(pay));
}

/* ------------------------------------------------------------------ 8. the profile */

head("8. API: the fields a browser may not write");
{
  const app = read("assets/app.js");
  const profile = app.slice(app.indexOf('const profile = fb.doc(db, "users", user.uid)'),
    app.indexOf("listenProfile();"));
  check("the profile update writes lastSeenAt and appVersion, and nothing else",
    /updateDoc\(profile, \{ lastSeenAt: now, appVersion: "web" \}\)/.test(profile));
  check("the first-sign-in document is those two and a createdAt",
    /applyProfile\(\{ createdAt: now, lastSeenAt: now, appVersion: "web" \}\)/.test(profile)
    && /setDoc\(profile, state\.profile\)/.test(profile));

  /* Session 37 put a live listener on users/{uid} so a plan granted by the server lands
     without a reload. It is a read and has to stay one: a browser that could write these
     three fields would be a browser that could grant itself Pro. */
  const watcher = app.slice(app.indexOf("function listenProfile()"),
    app.indexOf("/** The name to greet somebody by"));
  check("the profile listener only reads", /fb\.onSnapshot\(/.test(watcher)
    && !/setDoc|updateDoc|deleteDoc/.test(watcher));
  const code = app.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const field of ["plan", "planValidUntil", "planRenews"]) {
    check(`nothing in /app/ writes ${field}`, !new RegExp(`\\b${field}\\s*:`).test(code));
  }
  check("and no name is written into the profile document",
    !/updateDoc\(profile, \{[^}]*name/.test(app));
}

/* ------------------------------------------------------------------ 9. permissions */

head("9. uprawnienia: the table, the routes, and the hint that gates nothing");
{
  const { LM_FEATURES, lmCan, lmFeatureState, LM_LEVEL } = evalScript(
    ["assets/account.js", "assets/plan.js"],
    ["LM_FEATURES", "lmCan", "lmFeatureState", "LM_LEVEL"],
    { document: undefined, localStorage: undefined });

  // Every feature's level agrees with the route it lives on. Two answers to "is this
  // Pro" is how a module ends up open on one page and walled on another.
  for (const feature of LM_FEATURES) {
    if (!feature.route) continue;
    const r = route(feature.route);
    check(`${feature.id} sits on a real route`, Boolean(r), feature.route);
    if (!r) continue;
    if (feature.level === LM_LEVEL.PRO) {
      check(`${feature.id} is PRO on both sides`, r.level === LEVEL.PRO, r.level);
    }
    if (r.level === LEVEL.PRO) {
      check(`the route ${r.id} is PRO in the table too`, feature.level === LM_LEVEL.PRO,
        feature.level);
    }
  }

  // A typo closes a door rather than opening one — including the three names every
  // JavaScript object answers to.
  for (const id of ["", "clientsx", "admin", "__proto__", "constructor", "toString"]) {
    check(`an unknown feature ${JSON.stringify(id)} is refused`,
      !lmCan(id, LM_LEVEL.PRO) && lmFeatureState(id, LM_LEVEL.PRO).locked === true);
  }
  // Every PRO feature is walled for a guest and for a free account, and no other is.
  for (const feature of LM_FEATURES) {
    const pro = feature.level === LM_LEVEL.PRO;
    for (const level of [LM_LEVEL.GUEST, LM_LEVEL.LICZMAT]) {
      const state = lmFeatureState(feature.id, level);
      check(`${feature.id} is ${pro ? "walled" : "open"} for ${level}`, state.locked === pro);
    }
    check(`${feature.id} is open at PRO`, lmFeatureState(feature.id, LM_LEVEL.PRO).allowed);
  }

  // The hint decides wording and a menu item. Nothing may read it to decide a write.
  for (const file of ["assets/workspace.js", "assets/crm.js", "assets/crm-store.js",
    "assets/recent.js", "assets/calculators.js"]) {
    const src = read(file);
    check(`${file} never reads the session hint`,
      !src.includes("liczmat-signed-in") && !src.includes("lmReadLevel")
      && !src.includes("lmSignedIn"));
  }
  check("assets/plan.js still says out loud that none of it is a boundary",
    read("assets/plan.js").includes("Nothing here is a security boundary"));
  check("and that the rules are what decide a write",
    read("assets/plan.js").includes("rules decide what may be *written*"));
  check("the paywall says the same about itself",
    read("assets/paywall.js").includes("a product\n * decision rather than a boundary"));
}

/* ------------------------------------------------------------------ 10. the markup */

head("10. what the shipped files hand a browser");
{
  check("there are pages to read", PAGES.length > 370, String(PAGES.length));
  for (const file of PAGES) {
    const html = read(file);
    // An inline handler is a script run from an attribute. There are none, and there is
    // to be none: it is also the one thing no content policy could ever allow.
    check(`${file} has no inline event handler`,
      !/<[^>]+\son(?:click|error|load|mouseover|focus|submit|change)\s*=/i.test(html));
    check(`${file} has no javascript: URL`,
      !/(?:href|src)\s*=\s*["']\s*javascript:/i.test(html));
    // A window opened with target=_blank can rewrite the page that opened it unless the
    // opener is dropped.
    for (const anchor of html.match(/<a[^>]*target="_blank"[^>]*>/g) || []) {
      check(`${file}: an anchor opening a window drops its opener`, anchor.includes("noopener"),
        anchor.slice(0, 90));
    }
    // Every script and stylesheet the markup names is this site's own. The analytics tag
    // is appended by the inline block after load — scripts/test-perf.mjs owns that.
    for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
      check(`${file} loads ${m[1]} from this origin`, m[1].startsWith("/"));
    }
    for (const m of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)) {
      check(`${file} styles itself from this origin`, m[1].startsWith("/"));
    }
    // The one frame from somebody else's site.
    for (const frame of html.match(/<iframe[^>]*>/g) || []) {
      check(`${file}: the embedded map declares a referrer policy`,
        frame.includes("referrerpolicy="), frame.slice(0, 90));
    }
  }
}

/* ------------------------------------------------------------------ 11. clearing the device */

head("11. izolacja danych: the way to empty a shared device");
{
  const app = read("assets/app.js");
  const wiped = [...app.matchAll(/^\s*"([a-z0-9-]+)",\s*\/\/ assets\//gm)].map((m) => m[1]);
  check("the wipe names the four data stores", wiped.length === 4, wiped.join(", "));
  for (const key of wiped) {
    check(`${key} is named on /cookies/`, COOKIE_ROWS.some((r) => r.name === key));
  }

  // /cookies/ is the list of everything this site keeps in a browser. Every row is
  // either data (and is wiped) or a setting (and is deliberately kept); a row that is
  // neither is a store somebody added and nobody can clear.
  const SETTINGS = ["materio_consent", "materio-lang", "liczmat-currency", "liczmat-theme",
    "liczmat-signed-in", "liczmat-remember", "materio-redirected"];
  for (const row of COOKIE_ROWS) {
    check(`${row.name} is either wiped or a setting`,
      SETTINGS.includes(row.name) || wiped.includes(row.name)
      || row.name === "liczmat-sync-account");
  }
  check("the wipe asks first", /confirm\(T\("app_wipe_confirm"\)\)/.test(app));
  check("it clears the stamp with the data", /SYNC_ACCOUNT_KEY,\s*\/\/ this file/.test(app));
  const wipeBlock = app.slice(app.indexOf('$("app-wipe")'), app.indexOf('$("app-export")'));
  check("it signs nobody out",
    !wipeBlock.includes("signOut") && !wipeBlock.includes("lmWriteLevel"));
  check("and it touches no setting",
    !SETTINGS.some((key) => wipeBlock.includes(key)));
  check("the page carries the button", read("app/index.html").includes('id="app-wipe"'));
  check("and the warning it is the answer to",
    read("app/index.html").includes('id="app-sync-foreign"'));

  // The copy exists in all ten languages, or somebody is offered a key to click.
  const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
  const KEYS = ["app_wipe", "app_wipe_d", "app_wipe_btn", "app_wipe_confirm", "app_wipe_done",
    "app_sync_foreign", "ck_p_sync_account"];
  const codes = Object.keys(I18N_PAGES);
  eq("ten languages", codes.length, 10);
  for (const lang of codes) {
    for (const key of KEYS) {
      const value = I18N_PAGES[lang][key];
      check(`${lang}.${key} is written`, typeof value === "string" && value.length > 8,
        JSON.stringify(value));
    }
  }
}

/* ------------------------------------------------------------------ 12. what is not here */

head("12. API: what the repo does not carry");
{
  // The Firebase Web config is public and cannot be otherwise — the rules and the
  // authorized-domain list are what protect the data. A *private* key is another thing.
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if ([".git", "node_modules"].includes(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(js|mjs|json|html|txt|md|yml)$/.test(name)) files.push(relative(ROOT, full));
    }
  };
  walk(ROOT);
  const SECRETS = [
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
    [/\bsk_live_[A-Za-z0-9]/, "a Stripe secret key"],
    [/\brk_live_[A-Za-z0-9]/, "a Stripe restricted key"],
    /* A real Stripe webhook secret is `whsec_` and then some thirty base62 characters.
       The prefix on its own is a word this repository has to be able to write down —
       scripts/test-webhook-map.mjs checks the deployed function does not carry one, and
       functions/index.js names the parameter that holds it. The length is what tells a
       secret from a sentence about secrets. */
    [/\bwhsec_[A-Za-z0-9]{24,}/, "a Stripe webhook secret"],
    [/"type"\s*:\s*"service_account"/, "a service account"],
    [/\bghp_[A-Za-z0-9]{20}/, "a GitHub token"],
    [/\bAIza[0-9A-Za-z_-]{35}/, "a Google API key"],
  ];
  for (const file of files) {
    const src = read(file);
    for (const [re, what] of SECRETS) {
      // The one browser key the site cannot hide, in the one file that holds it and says
      // why (assets/firebase-config.js). Anywhere else it is a copy nobody is watching.
      if (file === "assets/firebase-config.js" && what === "a Google API key") continue;
      check(`${file} carries no ${what}`, !re.test(src));
    }
  }
  check("there is no .env in the repo", !existsSync(p(".env")));
  check("the Firebase config says why its key is public",
    /IS THIS A SECRET\?[\s\S]{0,120}No\. A Firebase Web apiKey is a public project identifier/
      .test(read("assets/firebase-config.js")));
}

/* ------------------------------------------------------------------ 13. escaping */

head("13. what a name somebody else typed does once it reaches the page");
{
  // Every file that builds HTML out of stored rows has an escaper, and it covers the
  // three characters that end an element and the one that ends an attribute.
  const RENDERERS = {
    "assets/workspace-calc.js": "wsEsc", "assets/crm-ui.js": "crmEsc",
    "assets/jobs-ui.js": "jobEsc", "assets/quotes-ui.js": "quoEsc",
    "assets/schedule-ui.js": "calEsc", "assets/crm-chain.js": "chnEsc",
    "assets/dashboard.js": "dashEsc", "assets/materials-ui.js": "matEsc",
    "assets/stores.js": "esc", "assets/app.js": "escapeHtml", "assets/share.js": "escapeHtml",
  };
  for (const [file, name] of Object.entries(RENDERERS)) {
    const src = read(file);
    const at = src.search(new RegExp(`(const|function)\\s+${name}\\b`));
    const decl = src.slice(at, at + 400);
    for (const [char, entity] of [["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"], ['"', "&quot;"]]) {
      check(`${file}: ${name}() escapes ${char}`, decl.includes(entity), decl.slice(0, 140));
    }
  }
  // Nothing interpolates into a single-quoted attribute, which is the one place an
  // escaper that leaves the apostrophe alone would be the wrong one.
  for (const file of [...Object.keys(RENDERERS), "assets/workspace-ui.js"]) {
    check(`${file} writes no single-quoted attribute around a value`,
      !/=\s*'\$\{/.test(read(file)));
  }
  // The two ids /app/ puts into an attribute come out of a synced document.
  const app = read("assets/app.js");
  check("/app/ escapes the project id it writes into data-id",
    /data-id="\$\{escapeHtml\(p\.id\)\}"/.test(app));
  check("and the room id", /data-id="\$\{escapeHtml\(r\.id\)\}"/.test(app));

  // The store finder's coordinates come from whoever last edited OpenStreetMap.
  const stores = read("assets/stores.js");
  check("the store row refuses a coordinate that is not a number",
    /if \(!isFinite\(lat\) \|\| !isFinite\(lon\)\) return "";/.test(stores));
  check("and escapes the link it builds out of them", /const nav = esc\(/.test(stores));

  // The CSV is a file handed to somebody else, and a spreadsheet reads =, +, - and @ at
  // the start of a cell as a formula — quoted or not.
  const ws = read("assets/workspace-ui.js");
  const { wsCsvCell, wsFileName } = new Function(
    `${ws.slice(ws.indexOf("function wsCsvCell"), ws.indexOf("/** Hand the browser a file"))}
     return { wsCsvCell, wsFileName };`)();
  for (const value of ["=1+1", "+1", "-1", "@SUM(A1)", TAB + "x", CR + "x"]) {
    check(`a cell starting ${JSON.stringify(value[0])} is text`,
      wsCsvCell(value).startsWith("'"), wsCsvCell(value));
  }
  eq("an ordinary cell is untouched", wsCsvCell("Klej"), "Klej");
  eq("a quote is doubled, the way CSV wants", wsCsvCell('Klej "mocny"'), 'Klej ""mocny""');
  eq("a project name cannot walk out of the download folder",
    wsFileName("../../etc/passwd", "kosztorys", "csv"), "liczmat-etc-passwd.csv");
  eq("nor carry a newline", wsFileName("a" + LF + "b", "kosztorys", "csv"), "liczmat-a b.csv");
  eq("an empty name falls back", wsFileName("", "kosztorys", "csv"), "liczmat-kosztorys.csv");
  eq("and an ordinary one survives",
    wsFileName("Łazienka", "kosztorys", "csv"), "liczmat-Łazienka.csv");
}

/* ------------------------------------------------------------------ report */

console.log(`\nsecurity: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
