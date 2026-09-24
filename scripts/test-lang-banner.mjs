#!/usr/bin/env node
/** Language-suggestion banner integration tests. */

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
    const entry = existsSync(join(given, "index.mjs")) ? join(given, "index.mjs") : given;
    specifier = pathToFileURL(entry).href;
  }
  const mod = await import(specifier);
  chromium = mod.chromium || (mod.default && mod.default.chromium);
  if (!chromium) throw new Error("no chromium export");
} catch {
  console.log("test-lang-banner: Playwright not installed — skipping the browser tests.");
  console.log("                  See scripts/test-pages.mjs for the one-line install.");
  process.exit(0);
}

function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const b of builds) {
    const exe = join(base, b, "chrome-linux", "chrome");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

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

let passed = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) { passed++; return; }
  failures.push(`${name}${detail ? `\n      ${detail}` : ""}`);
}
const eq = (name, got, want) => check(name, got === want,
  `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const exe = findChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function context(locale, storage = {}, viewport) {
  const ctx = await browser.newContext({ locale, ...(viewport ? { viewport } : {}) });
  await ctx.addInitScript((entries) => {
    try { Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value)); } catch (e) {}
  }, storage);
  await ctx.route("**", (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  return ctx;
}
async function open(ctx, path) {
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "load" });
  return page;
}

{
  const ctx = await context("de-DE");
  const page = await open(ctx, "/");
  await page.waitForSelector("#lang-suggest", { state: "visible" });
  const got = await page.evaluate(() => ({
    text: document.querySelector("#lang-suggest .lang-suggest-text").textContent,
    expected: LANG_BANNER.de.text,
    href: document.querySelector("#lang-suggest a").href,
    alternate: new URL(LICZMAT_ALTERNATES.de + location.search + location.hash, location.href).href,
    lang: document.querySelector("#lang-suggest a").lang,
  }));
  eq("a: German copy", got.text, got.expected);
  eq("a: German alternate href", got.href, got.alternate);
  eq("a: link language", got.lang, "de");
  await ctx.close();
}

for (const [name, locale, path] of [
  ["b: Polish locale on Polish home", "pl-PL", "/"],
  ["c: German locale on German home", "de-DE", "/de/"],
  ["g: in-place app page", "de-DE", "/app/"],
]) {
  const ctx = await context(locale);
  const page = await open(ctx, path);
  await page.waitForTimeout(100);
  eq(`${name} has no banner`, await page.locator("#lang-suggest").count(), 0);
  await ctx.close();
}

{
  const ctx = await context("de-DE", { "materio-lang": "pl" });
  const page = await open(ctx, "/");
  await page.waitForTimeout(100);
  eq("d: saved choice suppresses banner", await page.locator("#lang-suggest").count(), 0);
  eq("d: saved current choice does not redirect", new URL(page.url()).pathname, "/");
  await ctx.close();
}

{
  const ctx = await context("de-DE");
  const page = await open(ctx, "/");
  await page.locator(".lang-suggest-close").click();
  eq("e: close removes banner", await page.locator("#lang-suggest").count(), 0);
  eq("e: close persists dismissal", await page.evaluate(() => localStorage.getItem("materio-lang-banner-dismissed")), "1");
  eq("e: close resets reserved height", await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--langsuggest-h").trim()), "0px");
  await page.reload({ waitUntil: "load" });
  eq("e: reload stays dismissed", await page.locator("#lang-suggest").count(), 0);
  await ctx.close();
}

{
  const ctx = await context("de-DE");
  const page = await open(ctx, "/projekty/?id=x");
  const expected = await page.evaluate(() =>
    new URL(LICZMAT_ALTERNATES.de + location.search + location.hash, location.href).href);
  await Promise.all([page.waitForNavigation(), page.locator("#lang-suggest a").click()]);
  eq("f: CTA keeps query on German alternate", page.url(), expected);
  eq("f: CTA remembers German", await page.evaluate(() => localStorage.getItem("materio-lang")), "de");
  await ctx.close();
}

async function seo(locale) {
  const ctx = await context(locale);
  const page = await open(ctx, "/");
  const value = await page.evaluate(() => ({
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]').href,
    alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
      .map((link) => [link.hreflang, link.href]),
  }));
  await ctx.close();
  return value;
}
eq("h: SEO head is locale-invariant", JSON.stringify(await seo("de-DE")), JSON.stringify(await seo("pl-PL")));

for (const viewport of [{ width: 390, height: 844 }, { width: 1400, height: 900 }]) {
  const ctx = await context("de-DE", {}, viewport);
  const page = await open(ctx, "/");
  await page.waitForSelector("#lang-suggest", { state: "visible" });
  eq(`i: consent banner is showing at ${viewport.width}x${viewport.height}`,
    await page.locator("#consent-banner").isVisible(), true);
  const overlap = await page.evaluate(() => {
    const a = document.querySelector("#lang-suggest").getBoundingClientRect();
    const b = document.querySelector("#consent-banner").getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  });
  check(`i: banners do not overlap at ${viewport.width}x${viewport.height}`, !overlap);
  if (viewport.width === 390) {
    const reach = await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
      const footerLinks = [...document.querySelectorAll("footer.site a")];
      const target = footerLinks[footerLinks.length - 1] || document.querySelector("main > :last-child");
      const r = target.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { reachable: Boolean(hit && (hit === target || target.contains(hit))),
        target: target.outerHTML.slice(0, 100), rect: [r.left, r.top, r.right, r.bottom],
        hit: hit && hit.outerHTML.slice(0, 100), scrollY, height: innerHeight };
    });
    check("j: final content remains hittable above both banners", reach.reachable, JSON.stringify(reach));
    // The reserved height is the language banner's own box and gap: answering the
    // consent banner moves it down but must not leave that banner's height behind.
    const sizes = () => page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const banner = document.querySelector("#lang-suggest");
      return {
        reserved: parseFloat(root.getPropertyValue("--langsuggest-h")) || 0,
        own: banner.getBoundingClientRect().height,
        gap: window.innerHeight - banner.getBoundingClientRect().bottom,
      };
    });
    const before = await sizes();
    await page.click("#consent-accept");
    await page.waitForFunction(() =>
      (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--consent-h")) || 0) === 0);
    const after = await sizes();
    check("k: reserved height is not inflated by the consent banner",
      Math.abs(before.reserved - after.reserved) <= 1 && after.reserved <= Math.ceil(after.own + after.gap) + 1,
      JSON.stringify({ before, after }));
  }
  await ctx.close();
}

await browser.close();
server.close();
const total = passed + failures.length;
if (failures.length) {
  console.error(`\n${failures.length} of ${total} checks FAILED:\n`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  console.error("");
  process.exit(1);
}
console.log(`lang-banner: ${total}/${total} checks pass`);
