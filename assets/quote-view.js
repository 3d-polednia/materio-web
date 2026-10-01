/* Public, read-only quote snapshot. The token is the only credential. */
import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";

const tokenPattern = /^[A-Za-z0-9_-]{16,64}$/;
const byId = (id) => document.getElementById(id);
const copy = document.querySelector(".quote-view-wrap")?.dataset || {};

function fail(key = "missing") {
  byId("quote-view-state").textContent = copy[key] || copy.missing || "";
  byId("quote-view-toolbar").hidden = true;
}

function render(data) {
  const snap = data && data.quote;
  const doc = byId("ws-pdf-doc");
  if (!snap || typeof pdfRenderQuote !== "function" || !pdfRenderQuote(doc, snap)) return fail();
  const company = String(snap.company && snap.company.name || "");
  const number = String(snap.quote && snap.quote.number || "");
  const title = [number, company].filter(Boolean).join(" — ");
  byId("quote-view-title").textContent = title || copy.title;
  document.title = `${title || copy.title} — LiczMat`;
  byId("quote-view-state").hidden = true;
  byId("quote-view-toolbar").hidden = false;
  byId("pdf-gate").hidden = true;
  byId("pdf-tool").hidden = false;
  const companyWarning = byId("quo-pdf-company");
  if (companyWarning) companyWarning.hidden = true;
}

async function load() {
  const token = (new URLSearchParams(location.search).get("t") || "").trim();
  if (!tokenPattern.test(token)) return fail();
  // Deterministic browser tests may inject a document only on a loopback host.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && window.__LM_SHARED_QUOTE__) {
    render(window.__LM_SHARED_QUOTE__); return;
  }
  if (!FIREBASE_READY) return fail("config");
  const [appMod, storeMod] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`), import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  const db = storeMod.getFirestore(appMod.initializeApp(FIREBASE_CONFIG));
  const result = await storeMod.getDoc(storeMod.doc(db, "sharedQuotes", token));
  if (!result.exists()) return fail();
  render(result.data());
}

byId("quote-view-print")?.addEventListener("click", async () => {
  const images = [...byId("ws-pdf-doc").querySelectorAll("img")].filter((img) => img.src);
  await Promise.race([
    Promise.all(images.map((img) => img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.print();
});

load().catch(() => fail());
