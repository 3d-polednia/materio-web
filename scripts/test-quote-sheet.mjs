#!/usr/bin/env node
/** Android's self-contained quote sheet, exercised in Chromium with the network shut. */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHEETS = process.env.LM_QUOTE_SHEET_DIR || join(ROOT, "..", "Materio", "app", "src", "main", "assets", "quote");
let chromium;
try {
  let specifier = "playwright";
  if (process.env.LM_PLAYWRIGHT) specifier = pathToFileURL(existsSync(join(process.env.LM_PLAYWRIGHT, "index.mjs")) ? join(process.env.LM_PLAYWRIGHT, "index.mjs") : process.env.LM_PLAYWRIGHT).href;
  const mod = await import(specifier); chromium = mod.chromium || mod.default?.chromium;
  if (!chromium) throw new Error("no chromium export");
} catch {
  console.log("test-quote-sheet: Playwright not installed — skipping the browser tests.");
  process.exit(0);
}

const snapshot = {
  lang: "pl", company: { name: "Firma Testowa", street: "Testowa 1", postalCode: "00-001", city: "Warszawa", nip: "1234567890", phone: "600 123 456", email: "biuro@example.pl", www: "", bankAccount: "", logo: "" },
  quote: { number: "OF/1/2026", createdAt: Date.UTC(2026, 6, 1), validUntil: "", note: "" },
  client: { name: "Jan Kowalski", phone: "", email: "jan@example.pl", street: "Kliencka 2", postalCode: "00-002", city: "Warszawa" }, projectName: "Remont łazienki",
  materialRows: [{ name: "Gres premium", qtyText: "2 opak.", unitPriceMinor: 25000, valueMinor: 50000 }], otherRows: [], labourRows: [{ name: "Układanie", qtyText: "10 m²", unitPriceMinor: 8000, valueMinor: 80000 }],
  totals: { currencyCode: "PLN", materials: 50000, other: 0, labour: 80000, subtotal: 130000, marginPct: 10, margin: 13000, net: 143000, vatPct: 23, vat: 32890, gross: 175890, mixed: false, materialsText: "", otherText: "" }, visibility: { forBlock: true },
};
let passed = 0; const failures = [];
const check = (name, value, detail = "") => value ? passed++ : failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
const browser = await chromium.launch();
for (const lang of ["pl", "de"]) {
  const context = await browser.newContext({ viewport: { width: 794, height: 1123 } });
  const network = [];
  await context.route("**/*", (route) => {
    if (route.request().url().startsWith("file://")) route.continue();
    else { network.push(route.request().url()); route.abort(); }
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(join(SHEETS, `sheet-${lang}.html`)).href);
  const value = { ...snapshot, lang };
  check(`${lang}: render returns true`, await page.evaluate((json) => window.lmRenderQuote(json), JSON.stringify(value)) === true);
  await page.waitForFunction(() => document.documentElement.dataset.lmReady);
  check(`${lang}: ready`, await page.getAttribute("html", "data-lm-ready") === "1");
  const state = await page.evaluate(() => {
    const doc = document.getElementById("ws-pdf-doc"); const foot = doc.querySelector(".qdoc-foot").getBoundingClientRect();
    return { width: Math.round(doc.getBoundingClientRect().width), text: doc.innerText, foot: Math.ceil(foot.bottom), images: [...doc.querySelectorAll(".qdoc-foot img")].map((img) => img.naturalWidth), height: window.lmSheetHeight() };
  });
  check(`${lang}: width 794`, state.width === 794, String(state.width));
  for (const text of ["Firma Testowa", "Jan Kowalski"]) check(`${lang}: contains ${text}`, state.text.includes(text));
  check(`${lang}: contains the total`, state.text.replace(/\D/g, "").includes("175890"));
  check(`${lang}: footer images decoded`, state.images.length === 2 && state.images.every((width) => width > 0), JSON.stringify(state.images));
  check(`${lang}: footer is on page one`, state.foot <= 1123, `${state.foot}px, sheet ${state.height}px`);
  check(`${lang}: no network`, network.length === 0, network.join(", "));
  if (process.env.LM_SHOT_DIR) { mkdirSync(process.env.LM_SHOT_DIR, { recursive: true }); await page.screenshot({ path: join(process.env.LM_SHOT_DIR, `quote-sheet-${lang}.png`), fullPage: true }); }
  await context.close();
}
await browser.close();
if (failures.length) { console.error(`FAIL — ${failures.length} of ${passed + failures.length} checks failed:\n${failures.join("\n")}`); process.exit(1); }
console.log(`OK — ${passed} checks: self-contained quote sheets render in pl and de.`);
