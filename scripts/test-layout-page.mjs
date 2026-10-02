#!/usr/bin/env node
/** LiczMat layout regressions from review C2, measured in Chromium. */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FAKE_APP, FAKE_AUTH, FAKE_STORE } from "./fake-firebase.mjs";

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
  console.log("test-layout-page: Playwright not installed - skipping the browser tests.");
  process.exit(0);
}

function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d))
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
function check(name, condition, detail = "") {
  if (condition) { passed++; return; }
  failures.push(`${name}${detail ? `\n      ${detail}` : ""}`);
}
const close = (a, b) => Math.abs(a - b) <= 1;

const T = Date.UTC(2026, 6, 1);
const workspace = {
  projects: [{ id: "p1", name: "Bardzo długa nazwa projektu do sprawdzenia telefonu", status: "new",
    valueMinor: 100_000, currencyCode: "EUR", archived: false, createdAt: T, updatedAt: T,
    deletedAt: null, schemaVersion: 1 }],
  rooms: [], estimations: [], shoppingItems: [],
};
const crm = { clients: [{ id: "c1", name: "Jan Kowalski", phone: "600100200", projectIds: [],
  archived: false, createdAt: T, updatedAt: T, deletedAt: null, schemaVersion: 1 }] };

const exe = findChromium();
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function context(viewport, firebase = false) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(() => localStorage.setItem("materio-lang-banner-dismissed", "1"));
  await ctx.route("**", (route) => {
    const url = route.request().url();
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-app.js"))
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_APP });
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-auth.js"))
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_AUTH });
    if (firebase && url.includes("/firebasejs/") && url.endsWith("firebase-firestore.js"))
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_STORE });
    return url.startsWith(base) ? route.continue() : route.abort();
  });
  return ctx;
}

async function openLocal(ctx, path, entries = {}, ready = "html[data-ws-ready]") {
  const page = await ctx.newPage();
  await page.goto(base + "/404.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((values) => {
    localStorage.clear();
    localStorage.setItem("materio-lang-banner-dismissed", "1");
    localStorage.setItem("materio-lang", "pl");
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
  }, entries);
  await page.goto(base + path, { waitUntil: "load" });
  if (ready) await page.waitForSelector(ready);
  return page;
}

async function visibleRect(page, selector, name) {
  const count = await page.locator(selector).count();
  check(`${name}: element exists`, count > 0, `selector ${selector}, count ${count}`);
  if (!count) return null;
  const rect = await page.locator(selector).first().evaluate((node) => {
    const r = node.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
      visible: getComputedStyle(node).visibility !== "hidden" && getComputedStyle(node).display !== "none" };
  });
  check(`${name}: element is visible`, rect.visible && rect.width > 0 && rect.height > 0, JSON.stringify(rect));
  return rect;
}

async function textLeft(page, selector) {
  return page.locator(selector).first().evaluate((node) => {
    const text = [...node.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    const range = document.createRange();
    range.selectNodeContents(text || node);
    return range.getBoundingClientRect().left;
  });
}

async function noHorizontalScroll(page, path, name) {
  const size = await page.evaluate(() => ({ width: document.scrollingElement.scrollWidth, viewport: innerWidth }));
  check(`${name}: no horizontal page scroll`, size.width <= size.viewport, `${path}: ${size.width} > ${size.viewport}`);
}

async function checkCurrencyAffix(page, fieldSelector, affixSelector, expected, name) {
  const affix = await visibleRect(page, affixSelector, `${name} currency suffix`);
  if (!affix) return;
  const field = await page.locator(fieldSelector).evaluate((node) => {
    const style = getComputedStyle(node);
    return { paddingRight: parseFloat(style.paddingRight), value: node.value };
  });
  const text = await page.locator(affixSelector).textContent();
  eqText(`${name} currency suffix text`, text.trim(), expected);
  check(`${name} text clears the currency suffix`, field.paddingRight >= affix.width,
    `${field.paddingRight}px padding for ${affix.width}px suffix`);
}

function eqText(name, got, want) {
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

for (const width of [1400, 900, 390]) {
  const ctx = await context({ width, height: 900 });
  const stored = { "materio-workspace-v1": JSON.stringify(workspace), "liczmat-signed-in": "pro" };
  const projects = await openLocal(ctx, "/projekty/", stored);
  await checkCurrencyAffix(projects, "#ws-project-value", "#ws-project-value-currency", "zł",
    `${width}px new project value`);
  const select = await visibleRect(projects, "#ws-project-list .row-actions > .field select", `${width}px project status`);
  const button = await visibleRect(projects, "#ws-project-list .row-actions > [data-del-project]", `${width}px project delete`);
  if (select && button) {
    check(`${width}px project controls have equal bottoms`, close(select.bottom, button.bottom), `${select.bottom} vs ${button.bottom}`);
    check(`${width}px project controls have equal heights`, close(select.height, button.height), `${select.height} vs ${button.height}`);
    check(`${width}px project delete keeps a 24px target`, button.height >= 24, String(button.height));
  }

  if (width === 1400) {
    for (const [labelSelector, controlSelector, name] of [
      ["label[for='ws-project-status'] .fld-label", "#ws-project-status", "status"],
      ["label[for='ws-project-name'] .fld-label", "#ws-project-name", "project name"],
    ]) {
      const label = await visibleRect(projects, labelSelector, `${name} label`);
      const control = await visibleRect(projects, controlSelector, `${name} control`);
      if (label && control) {
        const padding = await projects.locator(controlSelector).evaluate((node) => parseFloat(getComputedStyle(node).paddingLeft));
        const labelTextLeft = await textLeft(projects, labelSelector);
        check(`${name} label aligns with control text`, close(labelTextLeft, control.left + padding),
          `${labelTextLeft} vs ${control.left} + ${padding}`);
      }
    }
    const client = await visibleRect(projects, "#ws-project-client", "client field");
    const notes = await visibleRect(projects, "#ws-project-note", "notes field");
    if (client && notes) check("client and notes right edges align", close(client.right, notes.right), `${client.right} vs ${notes.right}`);
  }
  if (width === 390) await noHorizontalScroll(projects, "/projekty/", "projects phone");

  if (width === 1400) {
    await projects.evaluate(() => lmSetCurrency("EUR"));
    eqText("currencychange updates the new project suffix",
      (await projects.locator("#ws-project-value-currency").textContent()).trim(), "€");
    await projects.evaluate(() => lmSetCurrency("PLN"));
  }

  const detail = await openLocal(ctx, "/projekty/?id=p1", stored);
  await detail.waitForSelector("#ws-project:not([hidden])");
  await checkCurrencyAffix(detail, "#ws-biz-value", "#ws-biz-value-currency", "€",
    `${width}px edited EUR project value`);
  check(`${width}px edited EUR project explains its stored currency`,
    await detail.locator("#ws-biz-value-note").isVisible(),
    await detail.locator("#ws-biz-value-note").textContent());
  if (width === 390) await noHorizontalScroll(detail, "/projekty/?id=p1", "project detail phone");

  const rooms = await openLocal(ctx, "/projekty/#ws-rooms", stored);
  const head = await visibleRect(rooms, ".ws-room-card-head", `${width}px room card head`);
  const list = await visibleRect(rooms, ".ws-room-card-head + .data-list", `${width}px room card list`);
  const counter = await visibleRect(rooms, ".ws-room-card-head [data-room-count]", `${width}px room counter`);
  if (head && list) {
    const pair = await rooms.locator(".ws-room-card").first().evaluate((card) => {
      const headerRect = card.querySelector(".ws-room-card-head").getBoundingClientRect();
      const listRect = card.querySelector(".ws-room-card-head + .data-list").getBoundingClientRect();
      return { headBottom: headerRect.bottom, listTop: listRect.top };
    });
    check(`${width}px room head clears its list`, pair.headBottom < pair.listTop,
      `${pair.headBottom} vs ${pair.listTop}`);
  }
  if (counter) check(`${width}px room counter is not a chip`,
    !(await rooms.locator(".ws-room-card-head [data-room-count]").first().evaluate((node) => node.classList.contains("chip"))));
  if (width === 390) await noHorizontalScroll(rooms, "/projekty/#ws-rooms", "rooms phone");

  const clients = await openLocal(ctx, "/klienci/", { ...stored, "liczmat-crm-v1": JSON.stringify(crm) }, "html[data-crm-ready]");
  if (width === 390) await noHorizontalScroll(clients, "/klienci/", "clients phone");
  await ctx.close();
}

{
  const ctx = await context({ width: 1400, height: 900 });
  const page = await openLocal(ctx, "/projekty/", { "materio-workspace-v1": JSON.stringify(workspace),
    "liczmat-signed-in": "pro" });
  const note = await visibleRect(page, "p.src-note", "source note");
  const body = await visibleRect(page, "#ws-index > p.muted:not(.src-note)", "body paragraph");
  if (note) check("source note uses balanced wrapping",
    await page.locator("p.src-note").first().evaluate((node) => [getComputedStyle(node).textWrap, getComputedStyle(node).textWrapStyle].includes("balance")));
  if (body) check("body paragraph uses pretty wrapping",
    await page.locator("#ws-index > p.muted:not(.src-note)").first().evaluate((node) => [getComputedStyle(node).textWrap, getComputedStyle(node).textWrapStyle].includes("pretty")));
  await ctx.close();
}

for (const width of [1400, 900, 390]) {
  const ctx = await context({ width, height: 900 }, true);
  await ctx.addInitScript(() => {
    window.__fbSignedIn = "layout-user";
    window.__fbAccounts = {};
    window.__fbSeed = {};
    window.__fbFromCache = false;
    localStorage.setItem("materio-lang", "pl");
    localStorage.setItem("liczmat-signed-in", "pro");
  });
  const page = await ctx.newPage();
  await page.goto(base + "/app/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html[data-app-ready]", { state: "attached", timeout: 10000 });
  // LM_SHOTS=<dir> keeps a picture of each width for the eye that the numbers cannot replace.
  if (process.env.LM_SHOTS) await page.screenshot({ path: join(process.env.LM_SHOTS, `app-overview-${width}.png`), fullPage: true });
  const side = await visibleRect(page, ".app-side", `${width}px app side`);
  if (width === 1400 && side) {
    const scroll = await page.locator(".app-side").evaluate((node) => ({ scroll: node.scrollHeight, client: node.clientHeight }));
    check("account side menu does not scroll at 1400x900", scroll.scroll <= scroll.client, JSON.stringify(scroll));
  }
  const statsLast = await visibleRect(page, "#overview-stats .app-stat-card:last-child", `${width}px last stat tile`);
  const grid = await visibleRect(page, ".app-overview-grid", `${width}px overview grid`);
  const cards = [];
  for (let index = 1; index <= 5; index++) {
    cards.push(await visibleRect(page, `.app-overview-grid > .app-card:nth-child(${index})`,
      `${width}px overview card ${index}`));
  }
  if (width >= 900 && cards.every(Boolean) && grid && statsLast) {
    check(`${width}px first overview row has equal heights`, close(cards[0].height, cards[1].height),
      `${cards[0].height} vs ${cards[1].height}`);
    check(`${width}px second overview row has equal heights`, close(cards[2].height, cards[3].height),
      `${cards[2].height} vs ${cards[3].height}`);
    check(`${width}px final overview card fills its row`, close(cards[4].left, grid.left) && close(cards[4].right, grid.right),
      `${cards[4].left}-${cards[4].right} vs ${grid.left}-${grid.right}`);
    check(`${width}px cards align with the stats right edge`, close(cards[1].right, statsLast.right),
      `${cards[1].right} vs ${statsLast.right}`);
  }
  if (width === 390 && cards.every(Boolean) && grid) {
    check("390px overview is one column", cards.every((card) => close(card.left, grid.left) && close(card.right, grid.right)),
      cards.map((card) => `${card.left}-${card.right}`).join(", "));
  }
  if (width === 390) await noHorizontalScroll(page, "/app/", "app phone");
  await ctx.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.error(`  x ${failure}`));
  console.error(`\n${passed} passed, ${failures.length} failed.`);
  process.exit(1);
}
console.log(`test-layout-page: ${passed} checks passed.`);
