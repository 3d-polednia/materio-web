#!/usr/bin/env node
/**
 * LiczMat — the calculator on a real phone.
 *
 *     node scripts/test-phone.mjs
 *
 * Session 43. scripts/test-mobile.mjs already sweeps chapter XXVIII's widths, and it
 * passes; this asks the questions a narrowed desktop window cannot answer, because a
 * window is not a device:
 *
 *   1. the profiles really are devices — a coarse pointer and no hover, which is what
 *      every rule below turns on. A test that quietly degraded into another width sweep
 *      would go green while the site broke;
 *   2. every tap target is 44 px on every profile — the SAME phone in BOTH orientations,
 *      and a tablet. A Galaxy S8 turned sideways is 740 CSS px wide, so the width rule
 *      that used to grow these let go of the phone the moment it was rotated: chips went
 *      back to 30 px and the header's buttons to 36, with the finger unchanged;
 *   3. every field is 16 px of text, portrait and landscape (under it iOS Safari zooms
 *      the page when the field is touched);
 *   4. the page keeps room for the consent banner, which is fixed at the bottom of the
 *      screen. Without it the last thing in the document sits under the banner with no
 *      scroll left to move it out, and a tap aimed at it lands on the banner;
 *   5. every control on a calculator page can be brought clear of the banner and gets
 *      its own tap there — asked with elementFromPoint rather than with Playwright's
 *      click, which scrolls until the element receives the event and so cannot see this;
 *   6. a calculation made by tapping, on the narrowest phone, with the banner up;
 *   7. no page scrolls sideways on any profile, in either orientation;
 *   8. the viewport meta says width=device-width and does not take zoom away;
 *   9. and what only the stylesheet can be asked, because Playwright draws no browser
 *      chrome: the picker dialog is sized in dvh. On a phone 100vh is the screen with
 *      the browser's bars hidden, so a dialog sized against it hangs its scrolling list
 *      off the bottom of what the visitor can see.
 *
 * What it found the first time it ran is in the report for session 43: the consent
 * banner lay on the calculator's own fields with nothing reserving its room — on an
 * iPhone SE a tap on the middle of "Powierzchnia (m²)" focused nothing at all and the
 * last link in the document could not be reached — the tap targets let go of the phone
 * the moment it was rotated, and the material dialog was sized in vh.
 *
 * Playwright lives OUTSIDE this repository, same as scripts/test-mobile.mjs:
 *
 *     mkdir -p /tmp/lm-test && cd /tmp/lm-test && npm init -y && npm i playwright
 *     LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright node scripts/test-phone.mjs
 *
 * Without Playwright the script says so and exits 0.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LANGS, urlHome, urlCalc, urlCalcIndex, urlProjects, urlMaterials } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ the browser */

let chromium, devices;
try {
  let specifier = "playwright";
  if (process.env.LM_PLAYWRIGHT) {
    const given = process.env.LM_PLAYWRIGHT;
    const entry = existsSync(join(given, "index.mjs")) ? join(given, "index.mjs") : given;
    specifier = pathToFileURL(entry).href;
  }
  const mod = await import(specifier);
  const api = mod.chromium ? mod : mod.default;
  chromium = api && api.chromium;
  devices = api && api.devices;
  if (!chromium || !devices) throw new Error("no chromium/devices export");
} catch {
  console.log("test-phone: Playwright not installed — skipping the browser tests.");
  console.log("            See the header of this file for the one-line install.");
  process.exit(0);
}

function findChromium() {
  if (process.env.LM_CHROMIUM) return process.env.LM_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const b of builds) {
    const exe = join(base, b, "chrome-linux", "chrome");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

/* ------------------------------------------------------------------ the site */

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

/* ------------------------------------------------------------------ the devices
 *
 * Two phones in both orientations and a tablet. The pair that matters most is the same
 * Galaxy S8 twice: one device, one finger, two orientations — and until session 43 the
 * site gave it two different sets of control sizes.
 */
const PROFILES = [
  "iPhone SE", "iPhone 12", "iPhone 12 landscape",
  "Galaxy S8", "Galaxy S8 landscape", "Pixel 5", "iPad (gen 7)",
];

/** The 44 px the token block calls a tap target, less the rounding a zoom level adds. */
const TAP = 43.5;

const exe = findChromium();
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

/** A device, with nothing allowed off this origin. */
async function device(name) {
  const d = devices[name];
  if (!d) throw new Error(`Playwright has no device profile "${name}"`);
  const ctx = await browser.newContext({ ...d });
  await ctx.route("**", (route) =>
    (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  return ctx;
}

const CALC = base + urlCalc("pl", "waste");

async function open(ctx, url) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.classList.contains("js"));
  // The banner is laid out first and measured after, on the frame the ResizeObserver
  // gets. Waiting on the measurement itself would turn a site that never makes one into
  // a timeout instead of a failed check, and the failed check is the point.
  await page.waitForFunction(() => {
    const cb = document.querySelector(".consent-banner");
    return cb && (cb.hidden || cb.getBoundingClientRect().height > 0);
  });
  await page.waitForTimeout(150);
  return page;
}

/* ============================================================ 1. these are devices */

head("1. the profiles are devices, not windows");

for (const name of PROFILES) {
  const ctx = await device(name);
  const page = await open(ctx, CALC);
  const m = await page.evaluate(() => ({
    coarse: matchMedia("(pointer: coarse)").matches,
    noHover: matchMedia("(hover: none)").matches,
    touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    w: innerWidth, h: innerHeight,
  }));
  check(`${name}: the pointer is coarse`, m.coarse, JSON.stringify(m));
  check(`${name}: there is no hover`, m.noHover, JSON.stringify(m));
  check(`${name}: the screen has a touch surface`, m.touch, JSON.stringify(m));
  await page.close();
  await ctx.close();
}

/* The point of the pair: one device, two orientations, and the site has to treat both
   as the phone they are. */
head("1b. the same phone, turned");
{
  const sizes = {};
  for (const name of ["Galaxy S8", "Galaxy S8 landscape"]) {
    const ctx = await device(name);
    const page = await open(ctx, CALC);
    sizes[name] = await page.evaluate(() => ({
      w: innerWidth,
      chip: +document.querySelector("main .chip").getBoundingClientRect().height.toFixed(1),
      btn: +document.querySelector("main .btn-sm").getBoundingClientRect().height.toFixed(1),
      toggle: +document.querySelector(".theme-toggle").getBoundingClientRect().height.toFixed(1),
    }));
    await page.close();
    await ctx.close();
  }
  check("landscape really is the wide one", sizes["Galaxy S8 landscape"].w > 560,
    JSON.stringify(sizes));
  eq("a chip is the same size in both", sizes["Galaxy S8"].chip, sizes["Galaxy S8 landscape"].chip);
  eq("so is a small button", sizes["Galaxy S8"].btn, sizes["Galaxy S8 landscape"].btn);
  eq("so is the theme switch", sizes["Galaxy S8"].toggle, sizes["Galaxy S8 landscape"].toggle);
}

/* ================================================== 2–3. tap targets and fields */

const PAGES = [
  ["a calculator", urlCalc("pl", "waste")],
  ["the hub", urlCalcIndex("pl")],
  ["the home page", urlHome("pl")],
  ["the catalogue", urlMaterials("pl")],
  ["projects", urlProjects("pl")],
];

head("2. every tap target is 44 px, on every device");

for (const name of PROFILES) {
  const ctx = await device(name);
  const page = await ctx.newPage();
  for (const [what, path] of PAGES) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.classList.contains("js"));
    const small = await page.evaluate((tap) => {
      const out = [];
      const sel = "input, select, textarea, button, a.btn, .chip, summary, .lang-btn, .cur-select, .theme-toggle, .menu-toggle";
      for (const el of document.querySelectorAll(sel)) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (el.type === "checkbox" || el.type === "radio") continue;   // the native box
        if (b.height < tap) out.push(`${el.tagName}.${String(el.className || "").slice(0, 26)} ${b.height.toFixed(1)}px`);
      }
      return out;
    }, TAP);
    check(`${name}: ${what} — nothing a finger has to hit is under 44 px`,
      small.length === 0, small.slice(0, 5).join("; "));
  }
  await page.close();
  await ctx.close();
}

head("3. every field is 16 px of text, so iOS does not zoom the page");

for (const name of PROFILES) {
  const ctx = await device(name);
  const page = await ctx.newPage();
  for (const [what, path] of PAGES) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.classList.contains("js"));
    const small = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("input, select, textarea")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (el.type === "checkbox" || el.type === "radio") continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16) out.push(`${el.tagName}#${el.id || ""} ${fs}px`);
      }
      return out;
    });
    check(`${name}: ${what} — every field is at least 16 px`,
      small.length === 0, small.slice(0, 5).join("; "));
  }
  await page.close();
  await ctx.close();
}

/* ==================================================== 4. the page keeps its room */

head("4. the page reserves the consent banner's room");

for (const name of PROFILES) {
  const ctx = await device(name);
  const page = await open(ctx, CALC);

  const room = await page.evaluate(() => {
    const cb = document.querySelector(".consent-banner");
    const b = cb.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(cb).bottom) || 0;
    return {
      up: !cb.hidden,
      h: b.height, gap,
      reserved: parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
      varH: getComputedStyle(document.documentElement).getPropertyValue("--consent-h").trim(),
    };
  });
  check(`${name}: the banner is up on a first visit`, room.up, JSON.stringify(room));
  check(`${name}: the room reserved covers the banner and the gap under it`,
    room.reserved >= room.h + room.gap - 1,
    `banner ${room.h.toFixed(1)} + gap ${room.gap} vs reserved ${room.reserved} (--consent-h ${room.varH})`);

  // and the very last link in the document is reachable because of it
  const last = await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    scrollTo(0, document.documentElement.scrollHeight);
    const links = [...document.querySelectorAll("footer a")];
    const el = links[links.length - 1];
    const r = el.getBoundingClientRect();
    const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2);
    const top = cy >= 0 && cy <= innerHeight ? document.elementFromPoint(cx, cy) : null;
    return { text: el.textContent.trim(), got: top ? `${top.tagName}.${String(top.className).slice(0, 24)}` : "off screen",
             ok: !!top && (top === el || el.contains(top)) };
  });
  check(`${name}: the last link in the document takes its own tap`, last.ok,
    `"${last.text}" → ${last.got}`);

  // answering the banner hands the room back
  await page.locator("#consent-reject").click();
  const after = await page.evaluate(() => ({
    hidden: document.querySelector(".consent-banner").hidden,
    reserved: parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
  }));
  check(`${name}: answering it takes the banner away`, after.hidden, JSON.stringify(after));
  eq(`${name}: and gives the room back`, after.reserved, 0);

  await page.close();
  await ctx.close();
}

/* ======================= 5. every control on a calculator page takes its own tap */

head("5. nothing on a calculator page is stuck under the banner");

for (const name of PROFILES) {
  const ctx = await device(name);
  const page = await open(ctx, CALC);
  const bad = await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const cb = document.querySelector(".consent-banner");
    const header = document.querySelector("header.site").getBoundingClientRect().height;
    const out = [];
    let n = 0;
    for (const el of document.querySelectorAll("main a[href], main button, main input, main select, main summary")) {
      const r0 = el.getBoundingClientRect();
      if (r0.width === 0 || r0.height === 0) continue;
      n++;
      // scroll its centre halfway down the strip the header and the banner leave clear
      const want = header + (innerHeight - cb.getBoundingClientRect().height - header) / 2;
      scrollTo(0, Math.max(0, scrollY + r0.top + r0.height / 2 - want));
      const r = el.getBoundingClientRect();
      const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2);
      if (cy < 0 || cy > innerHeight) { out.push(`${el.tagName}#${el.id || ""} cannot be brought on screen`); continue; }
      const top = document.elementFromPoint(cx, cy);
      if (!top || !(top === el || el.contains(top) || top.contains(el))) {
        out.push(`${el.tagName}#${el.id || String(el.className).slice(0, 20)} → ${top ? top.tagName + "." + String(top.className).slice(0, 24) : "nothing"}`);
      }
    }
    return { n, out };
  });
  check(`${name}: all ${bad.n} controls can be scrolled clear of the banner`,
    bad.out.length === 0, bad.out.slice(0, 5).join("; "));
  await page.close();
  await ctx.close();
}

/* ============================ 6. a calculation, made by tapping, with the banner up */

head("6. a calculation on the narrowest phone, made with a finger");

for (const name of ["iPhone SE", "Galaxy S8 landscape"]) {
  const ctx = await device(name);
  const page = await open(ctx, CALC);

  const before = await page.locator("[data-result] .big").innerText();
  const area = page.locator("#f-waste-area");
  await area.scrollIntoViewIfNeeded();
  await area.tap();
  eq(`${name}: the tap reached the field`,
    await page.evaluate(() => document.activeElement.id), "f-waste-area");
  await area.fill("18");
  await page.locator("[data-run]").tap();
  await page.waitForTimeout(200);
  const after = await page.locator("[data-result] .big").innerText();
  check(`${name}: the answer changed`, after !== before, `${before} → ${after}`);
  // 18 m² + 7% = 19,26 m²; 19,26 ÷ 1,44 m² per pack = 13,375, so 14 packs.
  check(`${name}: and it is the answer for 18 m²`, /\b14\b/.test(after), after);

  // the answer is on the screen, and the visitor can read it without dismissing anything
  const seen = await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const cb = document.querySelector(".consent-banner");
    const header = document.querySelector("header.site").getBoundingClientRect().height;
    const el = document.querySelector("[data-result] .big");
    const r0 = el.getBoundingClientRect();
    const want = header + (innerHeight - cb.getBoundingClientRect().height - header) / 2;
    scrollTo(0, Math.max(0, scrollY + r0.top + r0.height / 2 - want));
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(Math.round((r.left + r.right) / 2), Math.round((r.top + r.bottom) / 2));
    return { ok: !!top && (top === el || el.contains(top)), got: top ? `${top.tagName}.${String(top.className).slice(0, 24)}` : "nothing" };
  });
  check(`${name}: the answer can be read with the banner still up`, seen.ok, seen.got);

  await page.close();
  await ctx.close();
}

/* ==================================================== 7. nothing scrolls sideways */

head("7. no page scrolls sideways on any device");

for (const name of PROFILES) {
  const ctx = await device(name);
  const page = await ctx.newPage();
  for (const lang of LANGS) {
    for (const path of [urlCalc(lang, "waste"), urlCalcIndex(lang), urlHome(lang)]) {
      await page.goto(base + path, { waitUntil: "domcontentloaded" });
      const over = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${name}: ${path} does not scroll sideways`, over <= 0, `${over}px over`);
    }
  }
  await page.close();
  await ctx.close();
}

/* ======================================================= 8. the viewport meta tag */

head("8. the viewport meta lets the visitor zoom");

{
  const ctx = await device("iPhone SE");
  const page = await open(ctx, CALC);
  const meta = await page.evaluate(() => {
    const m = document.querySelector('meta[name="viewport"]');
    return m ? m.getAttribute("content") : null;
  });
  check("there is a viewport meta", Boolean(meta), String(meta));
  check("it sizes the page to the device", /width\s*=\s*device-width/.test(meta || ""), String(meta));
  check("it does not switch zoom off", !/user-scalable\s*=\s*(no|0)/i.test(meta || ""), String(meta));
  const max = /maximum-scale\s*=\s*([\d.]+)/.exec(meta || "");
  check("and it does not cap zoom below 2×", !max || parseFloat(max[1]) >= 2, String(meta));
  await page.close();
  await ctx.close();
}

/* ================================= 9. what only the stylesheet can be asked
 *
 * Playwright draws no browser chrome, so innerHeight and 100vh are the same number here
 * and no test in a container can see this. On a phone they are not: 100vh is the screen
 * with the browser's own bars hidden. Anything sized against it and expected to fit the
 * screen therefore needs the dynamic unit, with vh left behind it as the fallback.
 */

head("9. what is sized against the screen is sized in dvh");

{
  const css = readFileSync(join(ROOT, "assets/styles.css"), "utf8");
  const rules = [
    [".mat-dialog", "the material picker"],
    [".mat-list", "the list inside it"],
    [".block-fill", "a block that fills the screen"],
    [".js .nav-links", "the navigation drawer"],
  ];
  for (const [sel, what] of rules) {
    const at = css.indexOf(sel + " {");
    check(`${what} (${sel}) is in the stylesheet`, at >= 0);
    if (at < 0) continue;
    const block = css.slice(at, css.indexOf("}", at));
    const vh = /\d(?:vh)\b/.test(block);
    const dvh = /\ddvh\b/.test(block);
    check(`${what} is sized in dvh`, dvh, block.trim().slice(0, 120));
    check(`${what} keeps vh behind it as the fallback`, !dvh || vh, block.trim().slice(0, 120));
  }
  // and nowhere else on the site sizes a box against the screen in vh alone
  const stray = [];
  for (const line of css.replace(/\/\*[\s\S]*?\*\//g, "").split("\n")) {
    if (!/(max-height|min-height|height)\s*:[^;]*\dvh\b/.test(line)) continue;
    if (/\ddvh\b/.test(line)) continue;
    // a pair written on two lines: the dvh copy is the next declaration of the same
    // property, so only a lone vh with no dvh anywhere in its rule is a problem
    stray.push(line.trim());
  }
  const unpaired = stray.filter((line) => {
    const prop = /(max-height|min-height|height)/.exec(line)[1];
    const at = css.indexOf(line);
    const rule = css.slice(css.lastIndexOf("{", at), css.indexOf("}", at));
    return !new RegExp(`${prop}\\s*:[^;]*\\ddvh`).test(rule);
  });
  check("no box on the site is sized against the screen in vh alone",
    unpaired.length === 0, unpaired.join(" | "));
}

/* ------------------------------------------------------------------ the verdict */

await browser.close();
server.close();

if (failures.length) {
  console.log(`\nphone: ${passed}/${passed + failures.length} checks pass\n`);
  console.log(`${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`phone: ${passed}/${passed} checks pass`);
