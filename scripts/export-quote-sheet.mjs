#!/usr/bin/env node
/** Build the self-contained quote sheets consumed by Android's offscreen WebView. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { quotePdfBlock } from "../src/pages.mjs";
import { LANGS } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(process.argv[2] || join(ROOT, "..", "Materio", "app", "src", "main", "assets", "quote"));
// core.autocrlf=true checks the sources out with CRLF; the renderer is cut out by "\n\n" anchors.
const read = (file) => readFileSync(join(ROOT, file), "utf8").replace(/\r\n/g, "\n");
const evalScript = (file, names) => new Function(`${read(file)}\nreturn {${names.join(",")}};`)();
const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const planSource = `${read("assets/account.js")}\n${read("assets/plan.js")}`;
const { LM_FEATURES } = new Function(`${planSource}\nreturn {LM_FEATURES};`)();
const css = read("assets/quote-doc.css");
const renderer = read("assets/pdf-export.js");
const helperStart = renderer.indexOf("const pdfEl =");
const helperEnd = renderer.indexOf("\n\n/** A date", helperStart);
const renderStart = renderer.indexOf("const pdfQuoteLogo =");
const renderEnd = renderer.indexOf("\n\nfunction pdfFillQuote", renderStart);
if ([helperStart, helperEnd, renderStart, renderEnd].some((at) => at < 0)) throw new Error("Could not isolate the quote renderer");
const renderSource = `${renderer.slice(helperStart, helperEnd)}\n${renderer.slice(renderStart, renderEnd)}`;
// The renderer names the tax number by the company's country (LMTaxId) and the client's
// country by name (LMPostal.countryName, called unguarded), so both travel with each sheet.
const helpers = `${read("assets/tax-id.js")}\n${read("assets/postal.js")}`;
// Only the keys the renderer asks for at run time travel with each sheet. The whole merged
// dictionary made every file 120 kB, thirteen times over, in the app's APK.
const runtimeKeys = [...renderSource.matchAll(/\bt\("([a-z0-9_]+)"\)/g)].map((m) => m[1]);
if (/\bt\((?!")/.test(renderSource)) throw new Error("The quote renderer calls t() with a computed key");
const copyFor = (dict) => Object.fromEntries(runtimeKeys.map((key) => [key, dict[key] || key]));
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(join(ROOT, file)).toString("base64")}`;
const logo = dataUri("assets/logo-mark.svg", "image/svg+xml");
const qr = dataUri("assets/qr-liczmat.svg", "image/svg+xml");

mkdirSync(target, { recursive: true });
for (const lang of LANGS) {
  const dict = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
  const t = (key) => dict[key] || key;
  const block = quotePdfBlock(lang, t, LM_FEATURES, "");
  const match = block.match(/<article id="ws-pdf-doc"[\s\S]*?<\/article>/);
  if (!match) throw new Error(`Could not find the ${lang} quote sheet`);
  const article = match[0]
    .replace('class="qdoc qdoc--no-logo"', 'class="qdoc qdoc--no-logo qdoc--paper"')
    .replace(/ hidden(?=>)/, "")
    .replace('src="/assets/logo-mark.svg"', `src="${logo}"`)
    .replace('src="/assets/qr-liczmat.svg"', `src="${qr}"`);
  const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=794">
<style>:root{--font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}html,body{margin:0;width:794px;background:#fff}body{overflow:visible}.qdoc.qdoc--paper{width:794px;max-width:none;box-shadow:none;outline:none}${css}</style></head>
<body>${article}<script>const LM_COPY=${JSON.stringify(copyFor(dict))};function t(key){return LM_COPY[key]||key}${helpers}\n${renderSource}
function lmImagesReady(doc){const images=[...doc.querySelectorAll("img")].filter((img)=>img.src);return Promise.race([Promise.all(images.map((img)=>img.decode?img.decode().catch(()=>{}):Promise.resolve())),new Promise((resolve)=>setTimeout(resolve,1500))]).then(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}
window.lmRenderQuote=function(json){document.documentElement.dataset.lmReady="";let snap;try{snap=JSON.parse(String(json));if(!pdfRenderQuote(document.getElementById("ws-pdf-doc"),snap))throw new Error("render failed")}catch(error){document.documentElement.dataset.lmReady="error";return false}lmImagesReady(document.getElementById("ws-pdf-doc")).then(()=>{document.documentElement.dataset.lmReady="1"},()=>{document.documentElement.dataset.lmReady="error"});return true};
window.lmSheetHeight=function(){return Math.ceil(document.getElementById("ws-pdf-doc").getBoundingClientRect().height)};</script></body></html>`;
  writeFileSync(join(target, `sheet-${lang}.html`), html);
}
console.log(`Wrote ${LANGS.length} quote sheets to ${target}`);
