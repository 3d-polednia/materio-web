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

byId("quote-view-download")?.addEventListener("click", async () => {
  const button = byId("quote-view-download");
  const error = byId("quote-view-download-error");
  const label = button.textContent;
  button.disabled = true;
  button.textContent = copy.downloading;
  error.textContent = "";
  try {
    await pdfDownloadQuote(byId("ws-pdf-doc"));
  } catch {
    error.textContent = copy.downloadFailed;
  } finally {
    button.textContent = label;
    button.disabled = false;
  }
});

/*
 * The sheet prints as a direct child of <body>, the way the editor prints it (pdf-export.js).
 * Inside the page's wrappers Chrome laid the one-sheet table out on paper with its <tfoot>
 * pushed onto a second sheet — the footer, and since 2026-10-01 the signatures above it, landed
 * alone on page 2. body[data-pdf-print] in styles.css hides everything else meanwhile.
 */
byId("quote-view-print")?.addEventListener("click", async () => {
  const doc = byId("ws-pdf-doc");
  await pdfWaitForDocumentImages(doc);
  const marker = document.createComment("pdf-document-home");
  doc.parentNode.insertBefore(marker, doc);
  document.body.appendChild(doc);
  document.body.dataset.pdfPrint = "1";
  let fallback = 0;
  const done = () => {
    delete document.body.dataset.pdfPrint;
    if (marker.parentNode) marker.parentNode.insertBefore(doc, marker);
    marker.remove();
    window.removeEventListener("afterprint", done);
    clearTimeout(fallback);
  };
  window.addEventListener("afterprint", done);
  window.print();
  // Some browsers never fire afterprint; the page must not stay emptied.
  fallback = setTimeout(done, 1000);
});

load().catch(() => fail());
