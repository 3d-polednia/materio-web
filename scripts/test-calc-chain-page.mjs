#!/usr/bin/env node
/** LiczMat - follow-up calculator links in Chromium. */

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
  console.log("test-calc-chain-page: Playwright not installed, skipping the browser tests.");
  process.exit(0);
}

const server = await new Promise((resolve) => {
  const instance = createServer((req, res) => {
    let requestPath = decodeURIComponent(req.url.split("?")[0]);
    if (requestPath.endsWith("/")) requestPath += "index.html";
    const file = join(ROOT, requestPath);
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      res.writeHead(404); res.end("Not found"); return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  instance.listen(0, "127.0.0.1", () => resolve(instance));
});

const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  OK ${name}`);
  } else {
    failures.push(`${name}${detail ? `: ${detail}` : ""}`);
    console.log(`  FAIL ${name}`);
  }
}
const eq = (name, got, want) => check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

await page.goto(`${base}/kalkulatory/plytki-panele-gres/?m=gres-30x60`, { waitUntil: "load" });
await page.locator('[data-k="area"]').fill("20");
await page.locator("[data-run]").click();
const chain = page.locator("[data-calc-chain]");
await chain.waitFor({ state: "visible" });
check("Policz też row is shown", (await chain.innerText()).includes("Policz też:"));
check("grout item is shown", (await chain.innerText()).includes("Fuga"));
check("adhesive item is shown", (await chain.innerText()).includes("Klej"));
const groutLink = chain.locator('a[href*="/fuga/"]').first();
const groutHref = await groutLink.getAttribute("href");
const groutUrl = new URL(groutHref, base);
eq("grout link carries tile", groutUrl.searchParams.get("m"), "gres-30x60");
eq("grout link carries net area", groutUrl.searchParams.get("area"), "20");
check("chain is below save box", await page.locator("[data-ws-save-box]").evaluate((box, row) => box.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING, await chain.elementHandle()));

await groutLink.click();
await page.waitForLoadState("load");
await page.locator('.calc[data-wired="1"]');
eq("grout area is prefilled", await page.locator('[data-k="area"]').inputValue(), "20");
eq("tile length is prefilled", await page.locator('[data-k="tileL"]').inputValue(), "600");
eq("tile width is prefilled", await page.locator('[data-k="tileW"]').inputValue(), "300");
check("grout result is valid", !await page.locator("[data-result]").evaluate((box) => box.classList.contains("err")));

await page.goto(`${base}/kalkulatory/farby-tynki-grunty/?m=farba-scienna-10`, { waitUntil: "load" });
await page.locator('[data-k="area"]').fill("17,5");
await page.locator("[data-run]").click();
const samePage = page.locator('[data-calc-chain] button').filter({ hasText: "Grunt głęboko" }).first();
await samePage.click();
eq("same-page target keeps URL", new URL(page.url()).pathname, "/kalkulatory/farby-tynki-grunty/");
eq("same-page target keeps area", await page.locator('[data-k="area"]').inputValue(), "17,5");
eq("same-page target switches material", await page.locator(".calc").getAttribute("data-mat-id"), "grunt-gleb-5");

await page.goto(`${base}/kalkulatory/plytki-panele-gres/?area=13&project=missing&room=missing`, { waitUntil: "load" });
eq("area survives nonexistent room", await page.locator('[data-k="area"]').inputValue(), "13");
eq("area switches waste calculator mode", await page.locator('[data-k="mode"]').inputValue(), "area");
check("carried-area result is valid", !await page.locator("[data-result]").evaluate((box) => box.classList.contains("err")));

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/kalkulatory/plytki-panele-gres/?m=gres-30x60&area=20`, { waitUntil: "load" });
await page.locator("[data-calc-chain]").waitFor({ state: "visible" });
check("390 px page has no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
check("390 px chain stays within viewport", await page.locator("[data-calc-chain]").evaluate((row) => row.getBoundingClientRect().right <= document.documentElement.clientWidth));
check("page has no script errors", errors.length === 0, errors.join(" | "));

await context.close();
await browser.close();
server.close();
const total = passed + failures.length;
console.log(`calc chain page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.log(`  x ${failure}`));
  process.exit(1);
}
