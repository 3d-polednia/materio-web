#!/usr/bin/env node
/** Quote sharing and the public quote page, in Chromium. */

import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { urlQuotes, urlQuoteView } from "../src/site.mjs";

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
  console.log("test-quote-share-page: Playwright not installed — skipping the browser tests.");
  console.log("                       Set LM_PLAYWRIGHT to the installed Playwright module.");
  process.exit(0);
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };
function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = decodeURIComponent(req.url.split("?")[0]);
      if (path.endsWith("/")) path += "index.html";
      const file = join(ROOT, path);
      if (!file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        res.end(readFileSync(join(ROOT, "404.html"))); return;
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

const T0 = Date.UTC(2026, 6, 1);
const sync = { createdAt: T0, updatedAt: T0, deletedAt: null, schemaVersion: 1 };
const workspace = { projects: [{ id: "p1", name: "Remont łazienki", archived: false, ...sync }], rooms: [], estimations: [], shoppingItems: [] };
const fixture = (withCompany = true) => ({
  clients: [{ id: "c1", name: "Jan Kowalski", phone: "600 123 456", email: "jan@firma.pl", address: "", note: "", projectIds: ["p1"], archived: false, ...sync }],
  companies: withCompany ? [{ id: "co1", name: "Firma Testowa", country: "PL", nip: "1234567890", phone: "", email: "", street: "", postalCode: "", city: "", logo: "", bankAccount: "", ...sync }] : [],
  jobs: [],
  quotes: [{ id: "q1", name: "Łazienka — wycena", number: "OF/1/2026", projectId: "p1", companyId: withCompany ? "co1" : "", clientId: "c1", materials: [{ id: "m1", name: "Gres premium", quantity: 2, unit: "opak.", amountMinor: 50000 }], labour: [{ id: "l1", name: "Układanie", quantity: 10, unit: "m²", amountMinor: 80000 }], marginPct: 10, vatPct: 23, note: "", currencyCode: "PLN", ...sync }],
});

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };
function check(name, cond, detail) { if (cond) { passed++; return; } failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`); }
const eq = (name, got, want) => check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch(chromiumPath() ? { executablePath: chromiumPath() } : {});
async function context(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route("**", (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  return ctx;
}
async function openEditor(ctx, crm, account = true) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  if (account) await page.addInitScript(() => {
    window.__shareCalls = []; window.__unshareCalls = []; window.__shareMode = "resolve";
    window.lmAccount = {
      uid: "u1",
      shareQuote: async (id, snap) => {
        window.__shareCalls.push({ id, snap: JSON.parse(JSON.stringify(snap)) });
        if (window.__shareMode === "reject") throw new Error("share failed");
        if (window.__shareMode === "pending") return new Promise((resolve) => { window.__resolveShare = resolve; });
        return { url: "https://liczmat.com/wycena/?t=AAAAAAAAAAAAAAAAAAAAAA", refreshedAt: 1780315200000 };
      },
      unshareQuote: async (id) => { window.__unshareCalls.push(id); return true; },
    };
  });
  await page.goto(`${base}/404.html`);
  await page.evaluate(({ workspace, crm }) => {
    localStorage.clear();
    localStorage.setItem("materio-lang-banner-dismissed", "1");
    localStorage.setItem("materio-lang", "pl");
    localStorage.setItem("materio-workspace-v1", JSON.stringify(workspace));
    localStorage.setItem("liczmat-crm-v1", JSON.stringify(crm));
    localStorage.setItem("liczmat-signed-in", "pro");
  }, { workspace, crm });
  await page.goto(`${base}${urlQuotes("pl")}?id=q1`, { waitUntil: "load" });
  await page.waitForSelector("html[data-quotes-ready]");
  page.errors = errors;
  return page;
}

let snapshot;
head("editor sharing");
{
  const ctx = await context();
  const page = await openEditor(ctx, fixture());
  eq("Share is enabled with a company", await page.$eval("#quo-share", (n) => n.disabled), false);
  await page.click("#quo-share");
  await page.waitForSelector("#quo-share-panel:not([hidden])");
  const calls = await page.evaluate(() => window.__shareCalls);
  eq("shareQuote is called once", calls.length, 1);
  eq("shareQuote receives the quote id", calls[0].id, "q1");
  snapshot = calls[0].snap;
  eq("snapshot has the company", snapshot.company.name, "Firma Testowa");
  eq("snapshot has the client", snapshot.client.name, "Jan Kowalski");
  check("snapshot has material and labour rows", snapshot.materialRows.length === 1 && snapshot.labourRows.length === 1, JSON.stringify(snapshot));
  check("snapshot has a gross total", Number.isFinite(snapshot.totals.gross) && snapshot.totals.gross > 0, JSON.stringify(snapshot.totals));
  eq("snapshot is JSON serialisable", JSON.parse(JSON.stringify(snapshot)).quote.number, snapshot.quote.number);
  const url = await page.inputValue("#quo-share-url");
  eq("the URL is shown", url, "https://liczmat.com/wycena/?t=AAAAAAAAAAAAAAAAAAAAAA");
  const mail = await page.getAttribute("#quo-share-email", "href");
  check("mailto targets the client", mail.startsWith("mailto:jan@firma.pl?subject="), mail);
  const body = decodeURIComponent(new URL(mail).searchParams.get("body"));
  check("mail body contains the URL", body.includes(url), body);
  check("mail body contains the formatted total", /zł|PLN/.test(body) && /1[,.\s]?75/.test(body), body);
  // Desktop: "E-mail" opens a chooser instead of relying on a mailto handler (owner,
  // 2026-10-01: Chrome on Windows owned mailto: with nothing behind it, the click did nothing).
  await page.click("#quo-share-email");
  eq("desktop E-mail opens the chooser", await page.$eval("#quo-share-mail", (n) => n.hidden), false);
  const gmail = await page.getAttribute("#quo-share-gmail", "href");
  check("Gmail compose targets the client", gmail.startsWith("https://mail.google.com/mail/?view=cm&fs=1&to=jan%40firma.pl&su="), gmail);
  check("Gmail body carries the URL", decodeURIComponent(new URL(gmail).searchParams.get("body")).includes(url), gmail);
  const outlook = await page.getAttribute("#quo-share-outlook", "href");
  check("Outlook compose targets the client", outlook.startsWith("https://outlook.live.com/mail/0/deeplink/compose?to=jan%40firma.pl&subject="), outlook);
  eq("the mail program link is the same mailto", await page.getAttribute("#quo-share-mailto", "href"), mail);
  const wa = await page.getAttribute("#quo-share-wa", "href");
  check("WhatsApp uses the Polish calling code", wa.startsWith("https://wa.me/48600123456?text="), wa);
  await page.click("#quo-share-off");
  await page.waitForFunction(() => window.__unshareCalls.length === 1);
  eq("unshareQuote receives the id", await page.evaluate(() => window.__unshareCalls[0]), "q1");
  eq("turning off hides the URL", await page.$eval("#quo-share-panel .quo-share-link", (n) => n.hidden), true);
  eq("turning off hides send buttons", await page.$eval("#quo-share-panel .quo-share-actions", (n) => n.hidden), true);
  check("nothing threw", page.errors.length === 0, page.errors.join("\n"));
  await ctx.close();
}
{
  const ctx = await context();
  const page = await openEditor(ctx, fixture(false));
  eq("Share is disabled without a company", await page.$eval("#quo-share", (n) => n.disabled), true);
  await ctx.close();
}
{
  const ctx = await context();
  const page = await openEditor(ctx, fixture());
  const original = (await page.textContent("#quo-share")).trim();
  await page.evaluate(() => { window.__shareMode = "pending"; });
  await page.click("#quo-share");
  await page.waitForFunction(() => window.__shareCalls.length === 1);
  eq("pending disables the button", await page.$eval("#quo-share", (n) => n.disabled), true);
  check("pending shows busy text", (await page.textContent("#quo-share")).trim() !== original);
  await page.evaluate(() => window.__resolveShare({ url: "https://liczmat.com/wycena/?t=AAAAAAAAAAAAAAAAAAAAAA", refreshedAt: 1780315200000 }));
  await page.waitForFunction(() => !document.getElementById("quo-share").disabled);
  await page.evaluate(() => { window.__shareMode = "reject"; });
  await page.click("#quo-share");
  await page.waitForSelector("#quo-share-panel:not([hidden])");
  await page.waitForFunction(() => !document.getElementById("quo-share").disabled);
  check("rejection shows the failure line", (await page.textContent("#quo-share-note")).trim().length > 0);
  eq("rejection re-enables the button", await page.$eval("#quo-share", (n) => n.disabled), false);
  await ctx.close();
}
{
  const ctx = await context();
  const page = await openEditor(ctx, fixture(), false);
  await page.click("#quo-share");
  eq("signed-out click reveals the account note", await page.$eval("#quo-share-account", (n) => n.hidden), false);
  check("signed-out click throws nothing", page.errors.length === 0, page.errors.join("\n"));
  await ctx.close();
}

async function publicPage(path, snap, viewport = { width: 1280, height: 900 }) {
  const ctx = await context(viewport);
  const page = await ctx.newPage();
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.addInitScript((value) => {
    window.__LM_SHARED_QUOTE__ = { quote: value };
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls += 1;
      const doc = document.getElementById("ws-pdf-doc");
      window.__printedAlone = doc.parentElement === document.body && document.body.dataset.pdfPrint === "1";
    };
  }, snap);
  await page.goto(base + path, { waitUntil: "load" });
  return { ctx, page, requests };
}

head("public quote page");
{
  const { ctx, page, requests } = await publicPage(`${urlQuoteView("pl")}?t=AAAAAAAAAAAAAAAAAAAAAA`, snapshot);
  const text = await page.locator("#ws-pdf-doc").innerText();
  for (const value of ["Firma Testowa", "Jan Kowalski", "Gres premium"]) check(`renders ${value}`, text.includes(value), text);
  check("a Polish issuing company prints NIP", text.includes("NIP 1234567890"), text);
  check("renders the total", text.includes("zł") || text.includes("PLN"), text);
  check("title contains the quote number", (await page.title()).includes(snapshot.quote.number), await page.title());
  eq("Polish download label", (await page.textContent("#quote-view-download")).trim(), "Pobierz PDF");
  eq("Polish print label", (await page.textContent("#quote-view-print")).trim(), "Drukuj");
  eq("vendor scripts are absent on load", requests.filter((url) => url.includes("/assets/vendor/")).length, 0);
  const downloadPromise = page.waitForEvent("download");
  await page.click("#quote-view-download");
  const download = await downloadPromise;
  const filename = download.suggestedFilename();
  check("download has a PDF filename", filename.endsWith(".pdf"), filename);
  check("filename contains the safe quote number", filename.includes("OF-1-2026"), filename);
  const bytes = readFileSync(await download.path());
  eq("download starts with the PDF signature", bytes.subarray(0, 4).toString(), "%PDF");
  check("download is larger than 20 kB", bytes.length > 20 * 1024, `${bytes.length} bytes`);
  eq("download does not print", await page.evaluate(() => window.__printCalls), 0);
  check("vendor scripts are requested after the click",
    requests.filter((url) => url.includes("/assets/vendor/")).length === 2,
    requests.filter((url) => url.includes("/assets/vendor/")).join(", "));
  await page.click("#quote-view-print");
  await page.waitForFunction(() => window.__printCalls > 0, null, { timeout: 5000 }).catch(() => {});
  eq("print button prints once", await page.evaluate(() => window.__printCalls), 1);
  // Inside the page's wrappers Chrome pushed the sheet's <tfoot> (and the signatures above it)
  // onto a second sheet; the print moves the sheet to <body> for the length of the dialog.
  eq("the sheet prints as a direct child of body", await page.evaluate(() => window.__printedAlone), true);
  await page.waitForTimeout(1300);
  eq("the sheet goes back after printing", await page.evaluate(() =>
    document.getElementById("ws-pdf-doc").parentElement !== document.body && !document.body.dataset.pdfPrint), true);
  await page.evaluate(() => { document.body.appendChild(document.getElementById("ws-pdf-doc")); document.body.dataset.pdfPrint = "1"; });
  const printed = (await page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true })).toString("latin1");
  eq("a short quote prints on one sheet, signatures and footer included", (printed.match(/\/Type\s*\/Page(?![s\w])/g) || []).length, 1);
  await page.evaluate(() => { delete document.body.dataset.pdfPrint; document.querySelector("#pdf-tool").appendChild(document.getElementById("ws-pdf-doc")); });
  await page.emulateMedia({ media: "print" });
  eq("toolbar is hidden in print", await page.locator("#quote-view-toolbar").isVisible(), false);
  await ctx.close();
}
{
  const german = JSON.parse(JSON.stringify(snapshot));
  german.company.country = "DE";
  german.company.nip = "DE123456789";
  const { ctx, page } = await publicPage(`${urlQuoteView("pl")}?t=AAAAAAAAAAAAAAAAAAAAAA`, german);
  const text = await page.locator("#ws-pdf-doc").innerText();
  check("a German issuing company prints USt-IdNr.", text.includes("USt-IdNr. DE123456789"), text);
  await ctx.close();
}
{
  const evil = JSON.parse(JSON.stringify(snapshot));
  const attack = '<img src=x onerror="window.__pwned=1">';
  evil.company.name = attack; evil.company.logo = "javascript:alert(1)"; evil.client.name = attack; evil.materialRows[0].name = attack;
  const { ctx, page } = await publicPage(`${urlQuoteView("pl")}?t=AAAAAAAAAAAAAAAAAAAAAA`, evil);
  const text = await page.locator("#ws-pdf-doc").innerText();
  check("hostile company/client/row strings render literally", text.split(attack).length >= 4, text);
  eq("no attacker image is created", await page.locator('#ws-pdf-doc img[src="x"]').count(), 0);
  eq("only the three static image slots exist", await page.locator("#ws-pdf-doc img").count(), 3);
  eq("script did not run", await page.evaluate(() => window.__pwned), undefined);
  eq("bad logo has no src attribute", await page.getAttribute('[data-pdf="companyLogo"]', "src"), null);
  check("bad logo marks the document no-logo", await page.$eval("#ws-pdf-doc", (n) => n.classList.contains("qdoc--no-logo")));
  await ctx.close();
}
{
  const { ctx, page } = await publicPage(`${urlQuoteView("pl")}?t=abc`, snapshot);
  check("bad token shows missing state", await page.locator("#quote-view-state").isVisible());
  eq("bad token hides toolbar", await page.locator("#quote-view-toolbar").isVisible(), false);
  await ctx.close();
}
{
  const { ctx, page } = await publicPage(`${urlQuoteView("pl")}?t=AAAAAAAAAAAAAAAAAAAAAA`, snapshot, { width: 390, height: 844 });
  check("390 px has no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    await page.evaluate(() => `${document.documentElement.scrollWidth} > ${innerWidth + 1}`));
  check("both toolbar buttons are visible at 390 px",
    await page.locator("#quote-view-download").isVisible() && await page.locator("#quote-view-print").isVisible());
  // Owner's phone, 2026-10-01: the first build captured the narrow one-column layout and
  // a one-page quote came out as three pages of oversized text plus a cropped QR code.
  const downloadPromise = page.waitForEvent("download");
  await page.click("#quote-view-download");
  const pdf = readFileSync(await (await downloadPromise).path()).toString("latin1");
  eq("on a phone a short quote is one A4 page", (pdf.match(/\/Type\s*\/Page\b/g) || []).length, 1);
  await ctx.close();
}
{
  const { ctx, page } = await publicPage(`${urlQuoteView("de")}?t=AAAAAAAAAAAAAAAAAAAAAA`, snapshot);
  eq("German download label", (await page.textContent("#quote-view-download")).trim(), "PDF herunterladen");
  eq("German print label", (await page.textContent("#quote-view-print")).trim(), "Drucken");
  await ctx.close();
}
{
  const long = JSON.parse(JSON.stringify(snapshot));
  long.materialRows = Array.from({ length: 40 }, (_, index) => ({
    ...long.materialRows[0],
    id: `m${index + 1}`,
    name: `Materiał testowy ${index + 1}`,
  }));
  const { ctx, page } = await publicPage(`${urlQuoteView("pl")}?t=AAAAAAAAAAAAAAAAAAAAAA`, long);
  const downloadPromise = page.waitForEvent("download");
  await page.click("#quote-view-download");
  const pdf = readFileSync(await (await downloadPromise).path()).toString("latin1");
  check("40 material rows produce more than one PDF page",
    (pdf.match(/\/Type\s*\/Page\b/g) || []).length > 1);
  await ctx.close();
}

await browser.close();
server.close();
const total = passed + failures.length;
console.log(`\nquote share page: ${passed}/${total} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.log(`  ✗ ${failure}`));
  process.exit(1);
}
