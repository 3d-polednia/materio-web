#!/usr/bin/env node
/* The /maile/ page in Chromium: rate, answer, unsub, bad token. */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  console.log("test-mail-page: Playwright not installed - skipping the browser tests.");
  console.log("                Set LM_PLAYWRIGHT to the installed Playwright module.");
  process.exit(0);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = decodeURIComponent(req.url.split("?")[0]);
      if (path.endsWith("/")) path += "index.html";
      const file = join(ROOT, path);
      if (!file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        res.end(readFileSync(join(ROOT, "404.html")));
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function chromiumPath() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base).filter((name) => /^chromium-\d+$/.test(name)).sort().reverse();
  return builds.map((name) => join(base, name, "chrome-linux", "chrome")).find(existsSync);
}

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };
function check(name, cond, detail) {
  if (cond) { passed++; return; }
  failures.push(`${section} - ${name}${detail ? `\n      ${detail}` : ""}`);
}
const eq = (name, got, want) => check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(chromiumPath() ? { executablePath: chromiumPath() } : {});

const recordedCalls = [];
async function context(viewport = { width: 1280, height: 900 }) {
  recordedCalls.length = 0;
  const ctx = await browser.newContext({ viewport });
  await ctx.route("**", async (route) => {
    const url = route.request().url();
    if (url.includes("/mailLink")) {
      const req = route.request();
      let body = null;
      try { body = req.postDataJSON(); } catch { body = req.postData(); }
      recordedCalls.push({ method: req.method(), url, body });
      if (body && body.t === "00000000000000000000000000000404") {
        return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ ok: false }) });
      }
      if (body && body.t === "00000000000000000000000000000500") {
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    if (url.startsWith(base)) {
      return route.continue();
    }
    return route.abort();
  });
  return ctx;
}

const VALID_TOKEN = "0123456789abcdef0123456789abcdef";
const NOT_FOUND_TOKEN = "00000000000000000000000000000404";
const SERVER_ERROR_TOKEN = "00000000000000000000000000000500";

head("invalid parameters or missing token");
{
  const ctx = await context();
  const page = await ctx.newPage();

  // Missing everything
  await page.goto(`${base}/maile/`);
  eq("invalid state visible for empty query", await page.locator("#mail-state-invalid").isVisible(), true);
  eq("rate state hidden", await page.locator("#mail-state-rate").isVisible(), false);
  eq("unsub state hidden", await page.locator("#mail-state-unsub").isVisible(), false);
  eq("no fetch sent for empty query", recordedCalls.length, 0);

  // Bad token format (too short)
  await page.goto(`${base}/maile/?a=rate&u=u1&t=short&r=3`);
  eq("invalid state visible for short token", await page.locator("#mail-state-invalid").isVisible(), true);
  eq("no fetch sent for short token", recordedCalls.length, 0);

  // Missing action
  await page.goto(`${base}/maile/?u=u1&t=${VALID_TOKEN}`);
  eq("invalid state visible for missing action", await page.locator("#mail-state-invalid").isVisible(), true);

  await page.close();
  await ctx.close();
}

head("empty optional feedback");
{
  const ctx = await context();
  const page = await ctx.newPage();

  await page.goto(`${base}/maile/?a=rate&u=usrEmpty&t=${VALID_TOKEN}&r=3`);
  await page.waitForFunction(() => document.getElementById("mail-rate-status").textContent.length > 0);
  eq("rating alone sends one call", recordedCalls.length, 1);
  await page.click("#mail-feedback-submit");
  await page.waitForSelector("#mail-thank-you:not([hidden])");
  eq("empty feedback sends no answer", recordedCalls.length, 1);
  eq("empty feedback shows thanks", await page.locator("#mail-thank-you").isVisible(), true);

  await page.close();
  await ctx.close();
}

head("rate mode");
{
  const ctx = await context();
  const page = await ctx.newPage();

  // Load with a=rate&r=4
  await page.goto(`${base}/maile/?a=rate&u=usr1&t=${VALID_TOKEN}&r=4`);
  await page.waitForSelector("#mail-state-rate:not([hidden])");

  eq("rate state is visible", await page.locator("#mail-state-rate").isVisible(), true);
  eq("invalid state is hidden", await page.locator("#mail-state-invalid").isVisible(), false);

  // Verify immediate POST on page load
  eq("one call sent on rate page load", recordedCalls.length, 1);
  eq("call was rate", recordedCalls[0]?.body?.a, "rate");
  eq("call had rating 4", recordedCalls[0]?.body?.r, 4);
  eq("call had uid", recordedCalls[0]?.body?.u, "usr1");
  eq("call had token", recordedCalls[0]?.body?.t, VALID_TOKEN);

  // Selected button is marked
  const btn4 = page.locator('.mail-rate-btn[data-rating="4"]');
  eq("button 4 has active class or aria-pressed",
    (await btn4.getAttribute("aria-pressed") === "true") || (await btn4.getAttribute("class")).includes("active"),
    true);

  // Click rating button 2
  await page.click('.mail-rate-btn[data-rating="2"]');
  eq("second call sent after clicking rating 2", recordedCalls.length, 2);
  eq("second call was rate", recordedCalls[1]?.body?.a, "rate");
  eq("second call had rating 2", recordedCalls[1]?.body?.r, 2);

  // Fill in optional questions and submit
  await page.check('input[name="use"][value="business"]');
  await page.fill('textarea[name="missing"]', "Brakuje mi integracji z magazynem");
  await page.click("#mail-feedback-submit");

  await page.waitForSelector("#mail-thank-you:not([hidden])");
  eq("third call sent for answers", recordedCalls.length, 3);
  eq("third call was answer", recordedCalls[2]?.body?.a, "answer");
  eq("answer had use=business", recordedCalls[2]?.body?.use, "business");
  eq("answer had missing text", recordedCalls[2]?.body?.missing, "Brakuje mi integracji z magazynem");

  eq("feedback form hidden after submission", await page.locator("#mail-feedback-form").isVisible(), false);
  eq("thank you visible after submission", await page.locator("#mail-thank-you").isVisible(), true);

  await page.close();
  await ctx.close();
}

head("unsub mode");
{
  const ctx = await context();
  const page = await ctx.newPage();

  // Load with a=unsub
  await page.goto(`${base}/maile/?a=unsub&u=usr2&t=${VALID_TOKEN}`);
  await page.waitForSelector("#mail-state-unsub:not([hidden])");

  eq("unsub state visible", await page.locator("#mail-state-unsub").isVisible(), true);
  eq("no fetch on initial unsub GET load (scanners safe)", recordedCalls.length, 0);

  // Click unsub button
  await page.click("#mail-unsub-btn");
  await page.waitForSelector("#mail-unsub-done:not([hidden])");

  eq("call sent after clicking unsub button", recordedCalls.length, 1);
  eq("call was unsub", recordedCalls[0]?.body?.a, "unsub");
  eq("call had uid usr2", recordedCalls[0]?.body?.u, "usr2");
  eq("call had token", recordedCalls[0]?.body?.t, VALID_TOKEN);

  eq("unsub button hidden after click", await page.locator("#mail-unsub-btn").isVisible(), false);
  eq("unsub confirmation visible", await page.locator("#mail-unsub-done").isVisible(), true);

  await page.close();
  await ctx.close();
}

head("server 404 response on invalid token");
{
  const ctx = await context();
  const page = await ctx.newPage();

  await page.goto(`${base}/maile/?a=rate&u=usrX&t=${NOT_FOUND_TOKEN}&r=5`);
  await page.waitForSelector("#mail-state-invalid:not([hidden])");

  eq("invalid state shown on 404 response", await page.locator("#mail-state-invalid").isVisible(), true);
  eq("rate state hidden on 404", await page.locator("#mail-state-rate").isVisible(), false);

  await page.close();
  await ctx.close();
}

head("server 500 response keeps the form");
{
  const ctx = await context();
  const page = await ctx.newPage();

  await page.goto(`${base}/maile/?a=rate&u=usrX&t=${SERVER_ERROR_TOKEN}&r=5`);
  await page.waitForFunction(() => document.getElementById("mail-rate-status").textContent.length > 0);
  eq("invalid state stays hidden on 500", await page.locator("#mail-state-invalid").isVisible(), false);
  eq("rate state stays visible on 500", await page.locator("#mail-state-rate").isVisible(), true);
  eq("generic error is shown on 500", await page.locator("#mail-rate-status").innerText(),
    "Wystąpił błąd. Spróbuj ponownie później.");

  await page.close();
  await ctx.close();
}

head("localized /de/maile/ and /en/maile/");
{
  const ctx = await context();
  const page = await ctx.newPage();

  await page.goto(`${base}/de/maile/?a=unsub&u=usrDe&t=${VALID_TOKEN}`);
  await page.waitForSelector("#mail-state-unsub:not([hidden])");

  const unsubBtnText = await page.locator("#mail-unsub-btn").innerText();
  check("German unsub button translated", unsubBtnText.length > 0 && !unsubBtnText.includes("Wypisz"));

  const pageText = await page.innerText("body");
  check("no em dash or en dash on German page", !/[—–]/.test(pageText));

  await page.close();
  await ctx.close();
}

head("mobile viewport (390 px) and desktop (1400 px)");
{
  for (const width of [390, 1400]) {
    const ctx = await context({ width, height: 800 });
    const page = await ctx.newPage();
    await page.goto(`${base}/maile/?a=rate&u=usrW&t=${VALID_TOKEN}&r=3`);
    await page.waitForSelector("#mail-state-rate:not([hidden])");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    eq(`no horizontal scroll at ${width}px`, scrollWidth <= clientWidth, true);

    await page.close();
    await ctx.close();
  }
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\nmail page: ${failures.length} FAILED, ${passed} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`mail page: ${passed}/${passed} checks pass`);
