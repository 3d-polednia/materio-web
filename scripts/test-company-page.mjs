#!/usr/bin/env node
/**
 * LiczMat — /moja-firma/, markup and browser interaction.
 *
 * Playwright lives outside this repository, as in scripts/test-clients-page.mjs:
 *
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-company-page.mjs
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };
function check(name, condition, detail = "") {
  if (condition) { passed++; return; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
}
const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

/* ------------------------------------------------------------------ markup */

head("1. built markup");
const html = readFileSync(join(ROOT, "moja-firma", "index.html"), "utf8");
[
  [html.includes('id="company-form"'), "form"],
  [html.includes('id="company-list"'), "list"],
  [html.includes('accept="image/png,image/jpeg,image/webp,image/svg+xml"'), "logo accept"],
  [html.includes("company-ui.min.js"), "page runtime"],
  [html.includes("account-sync-page.min.js"), "sync runtime"],
  [html.includes('name="robots" content="noindex'), "noindex"],
  [html.includes('id="company-gate"'), "Pro wall"],
  [html.includes('autocomplete="organization"'), "organization autocomplete"],
  [html.includes('autocomplete="street-address"'), "address autocomplete"],
].forEach(([ok, name]) => check(name, ok));

/* ------------------------------------------------------------------ browser */

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
  console.log("test-company-page: Playwright not installed — skipping the browser tests.");
  console.log(`company page: ${passed}/${passed} markup checks pass; browser skipped`);
  process.exit(0);
}

function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const build of builds) {
    const exe = join(base, build, "chrome-linux", "chrome");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain",
};
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
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = findChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function open(level, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource|ERR_FAILED|net::/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((accountLevel) => {
    localStorage.clear();
    localStorage.setItem("materio-lang", "pl");
    localStorage.setItem("materio-lang-banner-dismissed", "1");
    localStorage.setItem("liczmat-signed-in", accountLevel);
    localStorage.setItem("liczmat-crm-v1", JSON.stringify({
      companies: [], clients: [], jobs: [], quotes: [],
    }));
  }, level);
  await page.goto(base + "/moja-firma/", { waitUntil: "load" });
  return { ctx, page, errors };
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

head("2. Pro company workflow");
{
  const { ctx, page, errors } = await open("pro");
  await page.locator("#company-form").waitFor({ state: "visible" });
  await page.fill("#company-name", "Pierwsza Firma");
  await page.setInputFiles("#company-logo-file", { name: "logo.png", mimeType: "image/png", buffer: png });
  await page.waitForFunction(() => !document.getElementById("company-logo-preview").hidden
    || !document.getElementById("company-logo-error").hidden);
  check("the PNG has a preview", await page.locator("#company-logo-preview img").isVisible(),
    await page.locator("#company-logo-error").innerText());
  await page.click('#company-form button[type="submit"]');
  await page.locator("#company-list > li").waitFor();
  eq("first company is listed", await page.locator("#company-list > li").count(), 1);
  eq("its logo is a thumbnail", await page.locator("#company-list .company-logo-thumb img").count(), 1);
  check("the first company is default", (await page.locator("#company-list > li").innerText()).includes("Domyślna"));

  await page.fill("#company-name", "Druga Firma");
  await page.fill("#company-city", "Kraków");
  await page.click('#company-form button[type="submit"]');
  eq("a second company can be added", await page.locator("#company-list > li").count(), 2);
  const second = page.locator("#company-list > li", { hasText: "Druga Firma" });
  await second.locator("[data-company-default]").click();
  check("the second company becomes default", (await second.innerText()).includes("Domyślna"));
  await second.locator("[data-company-edit]").click();
  await page.fill("#company-city", "Poznań");
  await page.click('#company-form button[type="submit"]');
  check("an edited field is redrawn", (await page.locator("#company-list > li", { hasText: "Druga Firma" }).innerText()).includes("Poznań"));

  const first = page.locator("#company-list > li", { hasText: "Pierwsza Firma" });
  await first.locator("[data-company-delete]").click();
  eq("one company remains after delete", await page.locator("#company-list > li").count(), 1);
  await page.locator("#company-undo button").click();
  eq("undo restores the company", await page.locator("#company-list > li").count(), 2);

  await page.setInputFiles("#company-logo-file", {
    name: "not-a-logo.txt", mimeType: "text/plain", buffer: Buffer.from("plain text"),
  });
  await page.locator("#company-logo-error").waitFor({ state: "visible" });
  eq("wrong type shows the type message", await page.locator("#company-logo-error").innerText(),
    await page.evaluate(() => t("company_logo_type")));
  eq("no console errors", errors.join(" / "), "");
  await ctx.close();
}

head("3. free wall");
{
  const { ctx, page, errors } = await open("liczmat");
  await page.locator("#company-gate").waitFor({ state: "visible" });
  check("a free account sees the Pro wall", await page.locator("#company-gate").isVisible());
  check("and not the form", !(await page.locator("#company-form").isVisible()));
  eq("no console errors", errors.join(" / "), "");
  await ctx.close();
}

head("4. phone width");
{
  const { ctx, page, errors } = await open("pro", { width: 390, height: 844 });
  await page.locator("#company-form").waitFor({ state: "visible" });
  eq("390px has no horizontal scroll",
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  eq("no console errors", errors.join(" / "), "");
  await ctx.close();
}

await browser.close();
await new Promise((resolve) => server.close(resolve));
if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  console.error(`company page: ${passed}/${passed + failures.length} checks pass`);
  process.exit(1);
}
console.log(`company page: ${passed}/${passed} checks pass (browser ran)`);
