#!/usr/bin/env node
/** LiczMat custom date and datalist pickers in Chromium. */
process.env.TZ = "Europe/Warsaw";

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { urlQuotes, urlClients, urlCalendar } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let chromium;
try {
  let specifier = "playwright";
  if (process.env.LM_PLAYWRIGHT) {
    const given = process.env.LM_PLAYWRIGHT;
    specifier = pathToFileURL(existsSync(join(given, "index.mjs")) ? join(given, "index.mjs") : given).href;
  }
  const mod = await import(specifier);
  chromium = mod.chromium || mod.default?.chromium;
  if (!chromium) throw new Error("no chromium export");
} catch {
  console.log("test-pickers-page: Playwright not installed — skipping the browser tests.");
  process.exit(0);
}

function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const build of builds) {
    const exe = join(base, build, "chrome-linux", "chrome");
    if (existsSync(exe)) return exe;
  }
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const server = await new Promise((resolve) => {
  const instance = createServer((req, res) => {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path.endsWith("/")) path += "index.html";
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  instance.listen(0, "127.0.0.1", () => resolve(instance));
});
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(findChromium() ? { executablePath: findChromium() } : {});
let passed = 0;
const failed = [];
const check = (name, yes, detail = "") => yes ? passed++ : failed.push(`${name}${detail ? ` — ${detail}` : ""}`);
const equal = (name, got, want) => check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const sync = { createdAt: 1, updatedAt: 1, deletedAt: null, schemaVersion: 1 };
const workspace = { projects: [{ id: "p1", name: "Test", archived: false, ...sync }], rooms: [], estimations: [], shoppingItems: [] };
const crm = { clients: [], jobs: [], quotes: [{ id: "q1", name: "Test", projectId: "p1", labour: [], marginPct: 0, note: "", currencyCode: "PLN", ...sync }] };

async function context(options = {}) {
  const ctx = await browser.newContext(options);
  await ctx.route("**", (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  await ctx.addInitScript(({ workspace, crm }) => {
    localStorage.setItem("materio-lang-banner-dismissed", "1");
    localStorage.setItem("materio_consent", "denied");
    localStorage.setItem("liczmat-signed-in", "pro");
    localStorage.setItem("materio-workspace-v1", JSON.stringify(workspace));
    localStorage.setItem("liczmat-crm-v1", JSON.stringify(crm));
  }, { workspace, crm });
  return ctx;
}

async function quoteChecks(lang) {
  const ctx = await context({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + `${urlQuotes(lang)}?id=q1`, { waitUntil: "load" });
  await page.waitForSelector("html[data-quotes-ready]");
  const field = page.locator("#quo-valid-until");
  await field.fill("2026-10-04");
  let changes = 0;
  await field.evaluate((el) => el.addEventListener("change", () => { window.__pickerChanges = (window.__pickerChanges || 0) + 1; }));
  await field.click();
  await page.locator(".lm-date-pop").waitFor();
  const styles = await page.locator(".lm-date-pop").evaluate((el) => {
    const own = getComputedStyle(el);
    const root = getComputedStyle(document.documentElement);
    return { background: own.backgroundColor, surface: root.getPropertyValue("--surface").trim(), radius: own.borderRadius, tokenRadius: root.getPropertyValue("--radius").trim(), title: el.querySelector(".lm-date-title").textContent };
  });
  check(`${lang}: popup uses --surface`, styles.background === (await page.evaluate((v) => { const node = document.createElement("i"); node.style.color = v; document.body.append(node); const out = getComputedStyle(node).color; node.remove(); return out; }, styles.surface)));
  equal(`${lang}: popup uses --radius`, styles.radius, styles.tokenRadius);
  check(`${lang}: localized October`, lang === "de" ? /Oktober 2026/.test(styles.title) : /Październik 2026/.test(styles.title), styles.title);
  await page.locator('.lm-date-day[data-date="2026-10-12"]').click();
  equal(`${lang}: chosen day is ISO`, await field.inputValue(), "2026-10-12");
  changes = await page.evaluate(() => window.__pickerChanges || 0);
  equal(`${lang}: change fired`, changes, 1);
  await field.click();
  await page.locator('.lm-date-day[aria-selected="true"]').focus();
  await page.keyboard.press("PageDown");
  check(`${lang}: PageDown changes month`, /2026/.test(await page.locator(".lm-date-title").textContent()) && !/październik|oktober/i.test(await page.locator(".lm-date-title").textContent()));
  await page.keyboard.press("Escape");
  check(`${lang}: Escape closes`, !(await page.locator(".lm-date-pop").count()));
  await field.click();
  await page.locator("[data-today]").click();
  const today = await page.evaluate(() => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; });
  equal(`${lang}: Today writes local date`, await field.inputValue(), today);
  await ctx.close();
}

await quoteChecks("pl");
await quoteChecks("de");

async function visualShots() {
  const folder = process.env.LM_PICKER_SHOTS;
  if (!folder) return;
  for (const theme of ["light", "dark"]) {
    const ctx = await context({ viewport: { width: 1400, height: 900 }, colorScheme: theme });
    await ctx.addInitScript((value) => localStorage.setItem("liczmat-theme", value), theme);
    const quote = await ctx.newPage();
    await quote.goto(base + `${urlQuotes("pl")}?id=q1`, { waitUntil: "load" });
    await quote.waitForSelector("html[data-quotes-ready]");
    await quote.fill("#quo-valid-until", "2026-10-04");
    await quote.locator("#quo-valid-until").click();
    await quote.locator(".lm-date-pop").waitFor();
    await quote.screenshot({ path: join(folder, `kalendarz-${theme}.png`), fullPage: false });

    const clients = await ctx.newPage();
    await clients.goto(base + urlClients("pl"), { waitUntil: "load" });
    await clients.waitForSelector("html[data-crm-ready]");
    await clients.selectOption("#crm-client-country", "PL");
    await clients.fill("#crm-client-postal-code", "46-022");
    await clients.waitForFunction(() => document.querySelectorAll("#crm-client-city-list option").length >= 3);
    await clients.locator("#crm-client-city").click();
    await clients.locator(".lm-suggest-pop").waitFor();
    await clients.screenshot({ path: join(folder, `miejscowosci-${theme}.png`), fullPage: false });
    await clients.keyboard.press("Escape");
    await clients.locator("#crm-client-country").click();
    await clients.screenshot({ path: join(folder, `select-kraj-${theme}.png`), fullPage: false });
    await ctx.close();
  }
}

await visualShots();

{
  const ctx = await context({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(base + urlCalendar("pl"), { waitUntil: "load" });
  await page.waitForSelector("html[data-schedule-ready]");
  await page.locator("#cal-grid [data-day]").first().click();
  await page.locator("#cal-add-toggle").click();
  const dynamic = page.locator('#cal-add-form input[type="date"]');
  await dynamic.click();
  await page.locator(".lm-date-pop").waitFor();
  equal("dynamic calendar date is enhanced", await page.locator(".lm-date-pop").count(), 1);
  equal("390 px has no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await ctx.close();
}

{
  const ctx = await context({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + urlClients("pl"), { waitUntil: "load" });
  await page.waitForSelector("html[data-crm-ready]");
  await page.selectOption("#crm-client-country", "PL");
  await page.fill("#crm-client-postal-code", "46-022");
  await page.waitForFunction(() => document.querySelectorAll("#crm-client-city-list option").length >= 3);
  await page.locator("#crm-client-city").click();
  const options = await page.locator('.lm-suggest-pop [role="option"]').allTextContents();
  for (const place of ["Biadacz", "Kępa", "Luboszyce"]) check(`postal list has ${place}`, options.includes(place), options.join(", "));
  await page.fill("#crm-client-city", "luboszyce");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  equal("suggestion writes canonical city", await page.inputValue("#crm-client-city"), "Luboszyce");
  check("native list removed on fine pointer", !(await page.locator("#crm-client-city").getAttribute("list")));
  await ctx.close();
}

{
  const ctx = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + urlClients("pl"), { waitUntil: "load" });
  await page.waitForSelector("html[data-crm-ready]");
  equal("touch keeps native list", await page.locator("#crm-client-city").getAttribute("list"), "crm-client-city-list");
  equal("touch creates no custom popup", await page.locator(".lm-pop").count(), 0);
  await ctx.close();
}

await browser.close();
await new Promise((resolve) => server.close(resolve));
console.log(`pickers page: ${passed}/${passed + failed.length} checks pass`);
if (failed.length) {
  console.error(`\n${failed.length} FAILED:\n  ✗ ${failed.join("\n  ✗ ")}`);
  process.exitCode = 1;
}
