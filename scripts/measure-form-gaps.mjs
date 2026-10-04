#!/usr/bin/env node
/**
 * LiczMat: the gap between one form row and the next, measured on every account form
 * (colleague review, P6: --form-row-gap is 20 px everywhere).
 *
 *     LM_PLAYWRIGHT=C:/Projekty/lm-test/node_modules/playwright node scripts/measure-form-gaps.mjs [--after]
 *
 * Prints one table row per form and width; screenshots go to LM_SHOTS (default: the temp dir).
 */

import { createServer } from "node:http";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FAKE_APP, FAKE_AUTH, FAKE_FUNCTIONS, FAKE_STORE } from "./fake-firebase.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = process.env.LM_SHOTS || join(tmpdir(), "liczmat-form-gaps");
const label = process.argv.includes("--after") ? "after" : "before";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };

let specifier = "playwright";
if (process.env.LM_PLAYWRIGHT) {
  const given = process.env.LM_PLAYWRIGHT;
  specifier = pathToFileURL(existsSync(join(given, "index.mjs")) ? join(given, "index.mjs") : given).href;
}
const { chromium } = await import(specifier);

const server = createServer((req, res) => {
  let path = decodeURIComponent(req.url.split("?")[0]);
  if (path.endsWith("/")) path += "index.html";
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
mkdirSync(SHOTS, { recursive: true });

const sync = { createdAt: 1, updatedAt: 1, deletedAt: null, schemaVersion: 1 };
const workspace = { projects: [{ id: "p1", name: "Pomiar", archived: false, ...sync }], rooms: [], estimations: [], shoppingItems: [] };
const crm = { clients: [], jobs: [], quotes: [{ id: "q1", name: "Pomiar", projectId: "p1", labour: [], marginPct: 0, note: "", currencyCode: "PLN", status: "draft", ...sync }] };

async function makeContext(width, firebase = false) {
  const ctx = await browser.newContext({ viewport: { width, height: 1100 }, deviceScaleFactor: 1 });
  await ctx.route("**", (route) => {
    const url = route.request().url();
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-app.js")) return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_APP });
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-auth.js")) return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_AUTH });
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-firestore.js")) return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_STORE });
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-functions.js")) return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_FUNCTIONS });
    return url.startsWith(base) ? route.continue() : route.abort();
  });
  return ctx;
}

async function open(page, url, storage = {}) {
  await page.goto(base + "/404.html");
  await page.evaluate((entries) => {
    localStorage.clear();
    localStorage.setItem("materio-lang-banner-dismissed", "1");
    localStorage.setItem("materio-lang", "pl");
    Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
  }, storage);
  await page.goto(base + url, { waitUntil: "load" });
}

async function gap(page, form) {
  return page.evaluate((formSelector) => {
    const form = document.querySelector(formSelector);
    const fields = [...form.querySelectorAll(".field, .ws-mat-f")].map((field) => {
      const control = field.querySelector("input, select, textarea");
      const label = field.querySelector("label, .fld-label, .ws-bar-label") || field;
      if (!control || !control.checkVisibility() || !label.checkVisibility()) return null;
      return { control: control.getBoundingClientRect(), label: label.getBoundingClientRect() };
    }).filter(Boolean).sort((a, b) => a.control.top - b.control.top || a.control.left - b.control.left);
    if (!fields.length) return null;
    const firstTop = fields[0].control.top;
    const next = fields.find((field) => Math.abs(field.control.top - firstTop) > 2);
    if (!next) return null;
    const firstRow = fields.filter((field) => Math.abs(field.control.top - firstTop) <= 2);
    const bottom = Math.max(...firstRow.map((field) => field.control.bottom));
    return Math.round((next.label.top - bottom) * 10) / 10;
  }, form);
}

async function regular(width, item) {
  const ctx = await makeContext(width);
  const page = await ctx.newPage();
  const storage = { "liczmat-signed-in": "pro", "materio-workspace-v1": JSON.stringify(workspace), "liczmat-crm-v1": JSON.stringify(crm) };
  await open(page, item.url, storage);
  if (item.ready) await page.waitForSelector(item.ready, { state: "attached" });
  if (item.action) await item.action(page);
  const value = await gap(page, item.form);
  if (item.shot) await page.locator(item.shot).screenshot({ path: join(SHOTS, `${item.name}-${width}-${label}.png`) });
  await ctx.close();
  return value;
}

async function account(width) {
  const ctx = await makeContext(width, true);
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__fbAccounts = {};
    window.__fbSeed = {};
    window.__fbFromCache = false;
  });
  await open(page, "/app/?mode=signup");
  await page.waitForSelector("html[data-app-ready]");
  await page.fill("#signup-email", "gap@example.com");
  await page.fill("#signup-password", "sekret123");
  await page.click("#signup-form button[type=submit]");
  await page.waitForSelector("#app-workspace:not([hidden])");
  await page.evaluate(() => { location.hash = "#konto"; });
  await page.waitForSelector("#panel-account:not([hidden])");
  const value = await gap(page, "#password-form");
  await ctx.close();
  return value;
}

const items = [
  { name: "own-materials", url: "/moje-materialy/", ready: "[data-omat-form]", form: "[data-omat-form]", shot: "[data-omat-form]" },
  { name: "clients", url: "/klienci/", ready: "html[data-crm-ready]", form: "#crm-client-form" },
  { name: "projects", url: "/projekty/", ready: "html[data-ws-ready]", form: "#ws-project-form" },
  { name: "quote", url: "/wyceny/?id=q1", ready: "#quo-body:not([hidden])", action: (page) => page.click("#quo-edit"), form: "#quo-edit-form" },
  { name: "company", url: "/moja-firma/", ready: "#company-form", form: "#company-form", shot: "#company-form" },
  { name: "calendar", url: "/terminarz/", ready: "html[data-schedule-ready]", action: (page) => page.click("#cal-add-toggle"), form: "#cal-add-form" },
];

console.log(`FORM GAPS ${label.toUpperCase()} (control bottom to next-row label top)`);
console.log("page\t1400\t390");
for (const item of items) {
  const wide = await regular(1400, item);
  const phone = await regular(390, item);
  console.log(`${item.name}\t${wide ?? "n/a"}\t${phone ?? "n/a"}`);
}
console.log(`app-profile\t${await account(1400) ?? "n/a"}\t${await account(390) ?? "n/a"}`);

await browser.close();
await new Promise((resolve) => server.close(resolve));
