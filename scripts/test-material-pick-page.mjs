#!/usr/bin/env node
/**
 * The catalogue's "Policz" link keeps the chosen material visible in the calculator.
 *
 *     LM_PLAYWRIGHT=/path/to/node_modules/playwright node scripts/test-material-pick-page.mjs
 */

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
};

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
  console.log("test-material-pick-page: Playwright not installed, skipping the browser tests.");
  process.exit(0);
}

const server = await new Promise((resolve) => {
  const instance = createServer((req, res) => {
    let requestPath = decodeURIComponent(req.url.split("?")[0]);
    if (requestPath.endsWith("/")) requestPath += "index.html";
    const file = join(ROOT, requestPath);
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  instance.listen(0, "127.0.0.1", () => resolve(instance));
});

const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
let passed = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` (${detail})` : ""}`);
    console.log(`  ✗ ${name}`);
  }
}

async function visible(page, selector, name) {
  const locator = page.locator(selector);
  const count = await locator.count();
  check(`${name} exists`, count > 0, selector);
  const shown = count > 0 && await locator.first().isVisible();
  check(`${name} is visible`, shown, selector);
  return shown ? locator.first() : null;
}

async function catalogueHref(page, id) {
  await page.goto(`${base}/materialy/`, { waitUntil: "load" });
  const suffix = `/kalkulatory/farby-tynki-grunty/?m=${id}`;
  const link = page.locator(`a[href="${suffix}"]`).first();
  const count = await link.count();
  check(`${id} catalogue link exists`, count > 0, suffix);
  if (!count) return suffix;
  await link.evaluate((el) => {
    let parent = el.parentElement;
    while (parent) {
      if (parent.tagName === "DETAILS") parent.open = true;
      parent = parent.parentElement;
    }
  });
  check(`${id} catalogue link is visible`, await link.isVisible(), suffix);
  const href = await link.getAttribute("href");
  return href || suffix;
}

async function materialCase(context, width, id, expectedName, selectedPreset) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  const href = await catalogueHref(page, id);
  const target = new URL(href, base);
  target.searchParams.set("m", id);
  await page.goto(target.href, { waitUntil: "load" });
  await page.waitForSelector('.calc[data-wired="1"]');

  const row = await visible(page, "[data-mat-open]", `${width}px chosen material row`);
  if (row) {
    const rowText = await row.innerText();
    check(`${width}px chosen material name is shown`, rowText.includes(expectedName), `${page.url()} | ${rowText} | mat=${await page.locator(".calc").getAttribute("data-mat-id")}`);
  }
  const heading = await visible(page, "[data-calc-form-heading]", `${width}px form heading`);
  if (heading) {
    const headingText = await heading.innerText();
    check(`${width}px heading names the material`, headingText.includes(expectedName), headingText);
  }

  const result = await visible(page, "[data-result]", `${width}px calculated result`);
  if (result) {
    const resultText = await result.innerText();
    check(`${width}px result was computed`, !await result.evaluate((el) => el.classList.contains("err")) && /\d/.test(resultText), resultText);
  }

  const presets = page.locator("[data-preset]");
  check(`${width}px presets exist`, await presets.count() > 0);
  check(`${width}px presets are visible`, await presets.first().isVisible());
  const selected = page.locator("[data-preset].on");
  if (selectedPreset) {
    check(`${width}px matching preset is selected`, await selected.count() === 1);
    if (await selected.count()) check(`${width}px selected preset is ${selectedPreset}`, (await selected.first().innerText()).trim() === selectedPreset);
  } else {
    check(`${width}px no preset is selected`, await selected.count() === 0);
  }

  const field = await visible(page, '[data-k="cov"]', `${width}px catalogue-filled field`);
  if (field) {
    await field.fill("24");
    check(`${width}px changed values marker is shown`, (await row.innerText()).includes("zmienione wartości"));
  }

  const change = await visible(page, "[data-mat-open]", `${width}px change control`);
  if (change) {
    check(`${width}px change label is shown`, (await change.innerText()).includes("Zmień"));
    await change.click();
    const dialog = await visible(page, "#mat-dialog", `${width}px material picker`);
    if (dialog) check(`${width}px material picker is open`, await dialog.evaluate((el) => el.open));
  }
  check(`${width}px page has no script error`, errors.length === 0, errors.join(" | "));
  await page.close();
}

const context = await browser.newContext();
for (const width of [1400, 390]) {
  console.log(`\n${width}px`);
  await materialCase(context, width, "farba-scienna-2_5", "Farba ścienna 2,5 l", "");
  await materialCase(context, width, "farba-scienna-10", "Farba ścienna 10 l", "Farba 10 l");
}

await context.close();
await browser.close();
server.close();

const total = passed + failures.length;
console.log(`\nmaterial pick page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.log(`  ✗ ${failure}`));
  process.exit(1);
}
