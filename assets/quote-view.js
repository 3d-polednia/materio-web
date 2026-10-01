/* Public, read-only quote snapshot. The token is the only credential. */
import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";

const tokenPattern = /^[A-Za-z0-9_-]{16,64}$/;
const byId = (id) => document.getElementById(id);
const copy = document.querySelector(".quote-view-wrap")?.dataset || {};
const vendorScripts = new Map();

function loadScript(src) {
  if (vendorScripts.has(src)) return vendorScripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
  vendorScripts.set(src, promise);
  return promise;
}

async function waitForDocumentImages() {
  const images = [...byId("ws-pdf-doc").querySelectorAll("img")].filter((img) => img.src);
  await Promise.race([
    Promise.all(images.map((img) => img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function safeFileName(value) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "");
}

/**
 * How far down the capture anything was painted. html2canvas sizes the canvas from the
 * on-screen element, which on a phone is the tall one-column layout, while the clone is
 * drawn at desktop width — so the bottom of the canvas is blank and would become a blank
 * second page. Read upward one row at a time until a pixel is not white.
 */
function paintedHeight(canvas) {
  const ctx = canvas.getContext("2d");
  for (let y = canvas.height - 1; y > 0; y -= 1) {
    const row = ctx.getImageData(0, y, canvas.width, 1).data;
    for (let i = 0; i < row.length; i += 4) {
      if (row[i] < 250 || row[i + 1] < 250 || row[i + 2] < 250) return Math.min(canvas.height, y + 40);
    }
  }
  return canvas.height;
}

/** 210 mm at the CSS 96 dpi the document is designed in. */
const A4_PX = 794;

async function downloadPdf() {
  await Promise.all([
    loadScript("/assets/vendor/jspdf.umd.min.js"),
    loadScript("/assets/vendor/html2canvas-pro.min.js"),
  ]);
  await waitForDocumentImages();
  const doc = byId("ws-pdf-doc");
  // The file is an A4 sheet, so it is drawn from the desktop layout whatever the screen:
  // on a phone the sheet reflows into one narrow column (quote-doc.css, max-width 600px)
  // and a capture of that came out as three pages of oversized text. html2canvas lays the
  // clone out in its own window, which is given a desktop width and A4 sheet width here.
  const canvas = await window.html2canvas(doc, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: false,
    windowWidth: 1200,
    width: A4_PX,
    onclone: (clone) => {
      const sheet = clone.getElementById("ws-pdf-doc");
      sheet.style.width = `${A4_PX}px`;
      sheet.style.transform = "none";
      sheet.style.margin = "0";
    },
  });
  const usedHeight = paintedHeight(canvas);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const sliceHeight = Math.floor(canvas.width * pageHeight / pageWidth);
  for (let top = 0, page = 0; top < usedHeight; top += sliceHeight, page += 1) {
    const height = Math.min(sliceHeight, usedHeight - top);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = height;
    slice.getContext("2d").drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
    if (page) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", .92), "JPEG", 0, 0,
      pageWidth, height * pageWidth / canvas.width, undefined, "FAST");
  }
  const number = doc.querySelector('[data-pdf="quoteNumber"]')?.textContent.trim() || "";
  const company = doc.querySelector('[data-pdf="companyName"]')?.textContent.trim() || "";
  pdf.save(`${safeFileName([doc.dataset.quoteTitle, number, company].filter(Boolean).join(" "))}.pdf`);
}

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
    await downloadPdf();
  } catch {
    error.textContent = copy.downloadFailed;
  } finally {
    button.textContent = label;
    button.disabled = false;
  }
});

byId("quote-view-print")?.addEventListener("click", async () => {
  await waitForDocumentImages();
  window.print();
});

load().catch(() => fail());
