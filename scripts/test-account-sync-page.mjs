#!/usr/bin/env node
/** Browser coverage for automatic sync on the full account pages. */
import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FAKE_APP, FAKE_AUTH, FAKE_STORE } from "./fake-firebase.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let chromium;
try {
  let specifier = "playwright";
  if (process.env.LM_PLAYWRIGHT) specifier = pathToFileURL(existsSync(join(process.env.LM_PLAYWRIGHT, "index.mjs"))
    ? join(process.env.LM_PLAYWRIGHT, "index.mjs") : process.env.LM_PLAYWRIGHT).href;
  const mod = await import(specifier); chromium = mod.chromium || mod.default?.chromium;
  if (!chromium) throw new Error("no chromium");
} catch {
  console.log("test-account-sync-page: Playwright not installed — skipping the browser tests."); process.exit(0);
}
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml" };
const server = await new Promise((resolve) => {
  const s = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
    const f = join(ROOT, p); if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
  }); s.listen(0, "127.0.0.1", () => resolve(s));
});
const base = `http://127.0.0.1:${server.address().port}`;
const baseBrowsers = process.env.PLAYWRIGHT_BROWSERS_PATH || "C:/Users/poled/AppData/Local/ms-playwright";
const candidates = existsSync(baseBrowsers) ? readdirSync(baseBrowsers).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
const exe = candidates.map((d) => join(baseBrowsers, d, "chrome-win", "chrome.exe")).find(existsSync);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
let passed = 0; const failures = [];
const check = (name, value, detail = "") => value ? passed++ : failures.push(`${name}${detail ? `: ${detail}` : ""}`);

async function open(path, { signed = true, docs = {}, storage = {}, latency = 1 } = {}) {
  const ctx = await browser.newContext(); let firebaseRequests = 0;
  await ctx.addInitScript(([isSigned, seed, planted, delay]) => {
    localStorage.setItem("materio-lang-banner-dismissed", "1");
    if (isSigned) { localStorage.setItem("liczmat-signed-in", "pro"); window.__fbSignedIn = "u1"; }
    Object.entries(planted).forEach(([k, v]) => localStorage.setItem(k, v));
    window.__fbDocs = new Map(Object.entries(seed)); window.__fbLatencyMs = delay;
  }, [signed, docs, storage, latency]);
  await ctx.route("**", (route) => {
    const u = route.request().url();
    if (u.includes("/firebasejs/")) firebaseRequests++;
    if (u.endsWith("firebase-app.js")) return route.fulfill({ contentType: "text/javascript", body: FAKE_APP });
    if (u.endsWith("firebase-auth.js")) return route.fulfill({ contentType: "text/javascript", body: FAKE_AUTH });
    if (u.endsWith("firebase-firestore.js")) return route.fulfill({ contentType: "text/javascript", body: FAKE_STORE });
    if (u.startsWith(base)) return route.continue();
    return route.abort();
  });
  const page = await ctx.newPage(); await page.goto(base + path, { waitUntil: "domcontentloaded" });
  return { ctx, page, firebaseRequests: () => firebaseRequests };
}
const waitSync = (page) => page.waitForFunction(() => localStorage.getItem("liczmat-sync-account") === "u1", null, { timeout: 5000 });
const doc = (page, prefix) => page.evaluate((p) => [...window.__fbDocs.entries()].find(([k]) => k.startsWith(p)) || null, prefix);

{
  const x = await open("/projekty/", { signed: false }); await x.page.waitForTimeout(300);
  check("guest requests no Firebase SDK", x.firebaseRequests() === 0, String(x.firebaseRequests())); await x.ctx.close();
}
{
  const x = await open("/projekty/"); await waitSync(x.page);
  await x.page.waitForFunction(() => localStorage.getItem("liczmat-sync-pushed-at:u1"));
  await x.page.fill("#ws-project-name", "Dach testowy"); await x.page.click("#ws-project-form button[type=submit]");
  await x.page.waitForFunction(() => [...window.__fbDocs.entries()].some(([k, v]) => k.includes("/projects/") && v.name === "Dach testowy"), null, { timeout: 4000 });
  check("project UI edit is pushed", Boolean(await doc(x.page, "users/u1/projects/"))); await x.ctx.close();
}
{
  const remote = { "users/u1/projects/p-remote": { name: "Z chmury", updatedAt: Date.now(), createdAt: 1, deletedAt: null, schemaVersion: 1 } };
  const x = await open("/projekty/", { docs: remote });
  await x.page.waitForFunction(() => document.body.textContent.includes("Z chmury"), null, { timeout: 5000 });
  check("remote project appears after pull", await x.page.locator("body").innerText().then((s) => s.includes("Z chmury"))); await x.ctx.close();
}
{
  const now = Date.now();
  const a = await open("/projekty/", { storage: { "liczmat-sync-pulled-at:u1": String(now) } }); await waitSync(a.page); await a.page.waitForTimeout(100);
  check("fresh pull stamp suppresses full reads", await a.page.evaluate(() => (window.__fbReads || []).length) === 0); await a.ctx.close();
  const b = await open("/projekty/", { storage: { "liczmat-sync-pulled-at:u1": String(now - 301000) } }); await waitSync(b.page);
  check("expired pull stamp performs reads", await b.page.evaluate(() => (window.__fbReads || []).length) > 0); await b.ctx.close();
}
{
  const workspace = JSON.stringify({ projects: [{ id: "foreign", name: "Cudzy", createdAt: 1, updatedAt: 2 }], rooms: [], estimations: [], shoppingItems: [] });
  const x = await open("/projekty/", { storage: { "materio-workspace-v1": workspace, "liczmat-sync-account": "u2" } }); await x.page.waitForTimeout(2200);
  check("foreign workspace writes nothing", await x.page.evaluate(() => window.__fbDocs.size) === 0);
  check("foreign workspace stays untouched", await x.page.evaluate(() => localStorage.getItem("materio-workspace-v1")) === workspace); await x.ctx.close();
}
{
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => { localStorage.setItem("liczmat-signed-in", "pro"); localStorage.setItem("materio-lang-banner-dismissed", "1"); window.__fbSignedIn = "u1"; window.__fbDocs = new Map(); window.__fbLatencyMs = 1; });
  await ctx.route("**", (route) => { const u = route.request().url(); if (u.endsWith("firebase-app.js")) return route.fulfill({ contentType: "text/javascript", body: FAKE_APP }); if (u.endsWith("firebase-auth.js")) return route.fulfill({ contentType: "text/javascript", body: FAKE_AUTH }); if (u.endsWith("firebase-firestore.js")) return route.fulfill({ contentType: "text/javascript", body: FAKE_STORE }); if (u.startsWith(base)) return route.continue(); return route.abort(); });
  const page = await ctx.newPage(); await page.goto(base + "/projekty/"); await waitSync(page);
  await page.fill("#ws-project-name", "Szybkie wyjście"); await page.click("#ws-project-form button[type=submit]");
  await page.goto(base + "/kosztorys/");
  await page.waitForFunction(() => [...window.__fbDocs.values()].some((v) => v.name === "Szybkie wyjście"), null, { timeout: 5000 });
  check("next page pushes edit left before debounce", true); await ctx.close();
}
{
  const x = await open("/klienci/"); await waitSync(x.page); await x.page.fill("#crm-client-name", "Anna Test"); await x.page.click("#crm-client-form button[type=submit]");
  await x.page.waitForFunction(() => [...window.__fbDocs.keys()].some((k) => k.includes("/clients/")), null, { timeout: 4000 });
  check("client is pushed", Boolean(await doc(x.page, "users/u1/clients/"))); await x.ctx.close();
}
{
  const x = await open("/moje-materialy/"); await waitSync(x.page); await x.page.fill('[data-omat-in="name"]', "Płyta testowa"); await x.page.click('[data-omat-form] button[type="submit"]');
  await x.page.waitForFunction(() => [...window.__fbDocs.keys()].some((k) => k.includes("/materials/")), null, { timeout: 4000 });
  check("own material is pushed", Boolean(await doc(x.page, "users/u1/materials/"))); await x.ctx.close();
}
{
  // 2026-09-26: rows a pull brings in carry Firestore's `updatedAt`, newer than the cut-off;
  // they must not go straight back up (sawAccount() in assets/account-sync.js).
  const now = Date.now();
  const sync = { createdAt: 1, deletedAt: null, schemaVersion: 1 };
  const remote = {
    "users/u1/projects/p-echo": { name: "Z telefonu", updatedAt: now - 1000, ...sync },
    "users/u1/clients/c-echo": { name: "Klient z telefonu", phone: "", email: "", address: "", note: "", projectIds: [], archived: false, updatedAt: now - 1000, ...sync },
  };
  const x = await open("/projekty/", { docs: remote, storage: { "liczmat-sync-pushed-at:u1": String(now - 60000) } });
  await waitSync(x.page);
  await x.page.waitForFunction((was) => Number(localStorage.getItem("liczmat-sync-pushed-at:u1")) > was, now - 60000, { timeout: 5000 });
  const writes = await x.page.evaluate(() => (window.__fbWrites || []).map((w) => w.path));
  check("the pulled rows reached this browser", await x.page.evaluate(() => (localStorage.getItem("materio-workspace-v1") || "").includes("Z telefonu")));
  check("a pulled project is not pushed back", !writes.some((p) => p.includes("p-echo")), writes.join(", "));
  check("a pulled client is not pushed back", !writes.some((p) => p.includes("c-echo")), writes.join(", "));
  await x.ctx.close();
}

{
  // Another tab signing out (or deleting the account) stops this page's pushes.
  const x = await open("/projekty/"); await waitSync(x.page);
  const other = await x.ctx.newPage();
  await other.goto(base + "/kosztorys/", { waitUntil: "domcontentloaded" });
  await other.evaluate(() => localStorage.removeItem("liczmat-signed-in"));
  await x.page.fill("#ws-project-name", "Po wylogowaniu"); await x.page.click("#ws-project-form button[type=submit]");
  await x.page.waitForTimeout(2500);
  const names = await x.page.evaluate(() => [...window.__fbDocs.values()].map((v) => v.name));
  check("the edit is on this page", (await x.page.textContent("body")).includes("Po wylogowaniu"));
  check("a page stops pushing once another tab signs out", !names.includes("Po wylogowaniu"), names.join(", "));
  await x.ctx.close();
}

{
  const sync = { createdAt: 1, updatedAt: Date.now(), deletedAt: null, schemaVersion: 1 };
  const remote = {
    "users/u1": { plan: "premium", trialEndsAt: null },
    "users/u1/projects/p-share": { name: "Projekt do udostępnienia", status: "active", ...sync },
    "users/u1/projects/p-share/estimations/e1": { name: "Płytki", requiredUnits: 4, currencyCode: "PLN", ...sync },
    "users/u1/projects/p-share/shoppingItems/s1": { name: "Klej", quantity: 2, ...sync },
  };
  const x = await open("/projekty/?id=p-share", { docs: remote });
  await x.page.waitForFunction(() => { const b = document.getElementById("ws-project-share"); return window.lmAccount && b && !b.hidden && b.offsetParent !== null; }, null, { timeout: 8000 });
  check("signed-in project view shows share", await x.page.locator("#ws-project-share").isVisible());
  await x.page.click("#ws-project-share");
  await x.page.waitForFunction(() => [...window.__fbDocs.keys()].some((k) => k.startsWith("sharedProjects/")));
  const shared = await x.page.evaluate(() => [...window.__fbDocs.entries()].find(([k]) => k.startsWith("sharedProjects/"))[1]);
  check("share writes the authenticated owner", shared.ownerId === "u1", JSON.stringify(shared));
  check("share stamps the Firebase profile level", shared.creatorLevel === "pro", JSON.stringify(shared));
  check("share writes a read-only URL", await x.page.inputValue("#ws-project-share-url").then((v) => /\/p\/[A-Za-z0-9_-]+$/.test(v)));
  await x.ctx.close();

  const guest = await open("/projekty/?id=p-share", { signed: false, storage: {
    "materio-workspace-v1": JSON.stringify({ projects: [{ id: "p-share", name: "Lokalny", ...sync }], rooms: [], estimations: [], shoppingItems: [] }),
  } });
  check("guest project view has no visible share button", !(await guest.page.locator("#ws-project-share").isVisible()));
  await guest.ctx.close();
}

await browser.close(); server.close();
if (failures.length) { console.error(`test-account-sync-page: ${failures.length} failure(s)\n${failures.join("\n")}`); process.exit(1); }
check("assertion count is nonzero", passed > 0);
console.log(`test-account-sync-page: ${passed} assertions passed.`);
