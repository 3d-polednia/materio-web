/* LiczMat website — the PDF export of one project (session 59, the second half of C6).
 *
 * The app renders a real PDF with `PdfDocument` (`AndroidProjectPdfExporter`) and hands it
 * to the share sheet. A static site has no renderer and this product has no dependency, so
 * the document is markup and the browser's own print dialog is what writes the PDF. The
 * page says so rather than letting the button surprise anybody.
 *
 * The document is server-rendered and hidden (src/pages.mjs, pdfBlock()); this file writes
 * numbers, rows and the three sentences Android keeps as `%1$s` templates. Every name here
 * starts `pdf` — plain scripts, one global scope — and it reads the workspace through
 * assets/workspace.js's globals, which is why it is loaded after it.
 *
 * The arithmetic is `PdfExportOptions.computeInvestorBreakdown()` in the app repo, layer
 * for layer and rounding for rounding: materials → + labour → + margin → net → + VAT →
 * gross, each layer optional and contributing zero when it is off, so the arithmetic below
 * it still holds. Two products answering "what does this job come to" differently is the
 * defect the parity audit was written to find.
 *
 * **The whole export is LiczMat Pro since 2026-09-03.** `pdf` and `costs` are PRO in
 * LM_FEATURES (assets/plan.js) and pdfAllowed() below is asked twice on the way to a
 * document: once before anything is written into the markup, and once more before the
 * print dialog is opened. Two checks for one button is deliberate — the first is the flow
 * a visitor takes, the second is the function called directly from a console — and both
 * refuse when the deciding script is not on the page at all. The wall a free account sees
 * instead of the form is src/pro.mjs's, drawn by assets/paywall.js.
 */

/**
 * May this browser produce the document? Both halves of it have to be allowed: `pdf` is
 * the export, `costs` is every amount printed inside it.
 *
 * A missing pwAllows() is a refusal rather than a pass. The deciding code is
 * assets/plan.js and assets/paywall.js, which the build puts on this page ahead of this
 * file; if either failed to arrive, the answer this function does not have is "no".
 */
function pdfAllowed() {
  return typeof pwAllows === "function" && pwAllows("pdf") && pwAllows("costs");
}

/** Which figures the document prints. Read fresh on every click, never remembered. */
function pdfOptions(form) {
  const opt = {};
  form.querySelectorAll("[data-pdf-opt]").forEach((el) => { opt[el.dataset.pdfOpt] = el.checked; });
  form.querySelectorAll("[data-pdf-in]").forEach((el) => { opt[el.dataset.pdfIn] = el.value; });
  const type = form.querySelector('input[name="pdf-type"]:checked');
  opt.type = type ? type.value : "technical";
  return opt;
}

/**
 * A number somebody typed, or zero.
 *
 * Blank and invalid are both zero here, which is what `String.toDecimalOrNull() ?: 0.0`
 * does on the phone: a layer nobody filled in contributes nothing rather than refusing to
 * print the document.
 */
function pdfNum(value) {
  const n = parseFloat(String(value == null ? "" : value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * The layered investor total, in minor units — `computeInvestorBreakdown()` on the phone.
 *
 * Each layer is rounded once, where the Kotlin rounds once, and a disabled layer is zero
 * rather than skipped: the margin applies to materials plus labour, and the VAT to the net
 * that comes out of it, so the chain has to hold whichever of the three is switched off.
 */
function pdfBreakdown(opt, materialsNetMinor) {
  const labor = opt.labor ? Math.round(pdfNum(opt.laborHours) * pdfNum(opt.laborRate) * 100) : 0;
  const subtotal = materialsNetMinor + labor;
  const margin = opt.margin ? Math.round((subtotal * pdfNum(opt.marginPercent)) / 100) : 0;
  const net = subtotal + margin;
  const vat = opt.vat ? Math.round((net * pdfNum(opt.vatPercent)) / 100) : 0;
  return { materialsNetMinor, labor, margin, net, vat, gross: net + vat };
}

/** Is there anything in the investor block to print? `hasInvestorPricing` on the phone. */
const pdfHasPricing = (opt) =>
  opt.type === "investor" && Boolean(opt.labor || opt.margin || opt.vat);

/* ------------------------------------------------------------------ writing the document */

const pdfEl = (doc, name) => doc.querySelector(`[data-pdf="${name}"]`);
const pdfRow = (doc, name) => doc.querySelector(`[data-pdf-row="${name}"]`);

function pdfSet(doc, name, text) {
  const el = pdfEl(doc, name);
  if (el) el.textContent = text == null ? "" : String(text);
}

function pdfShow(doc, name, on) {
  const el = pdfRow(doc, name);
  if (el) el.hidden = !on;
}

/** A date in the visitor's language. The document is printed today, whatever it holds. */
function pdfToday() {
  const lang = document.documentElement.lang || "pl";
  try {
    return new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * One row of the table: what it is, how much of it, what it comes to.
 *
 * The rows are the project's material list plus the calculations nothing on that list came
 * from — the two halves `wsProjectCosts()` counts, in the same order and with the same
 * rule, so the table adds up to the total printed under it. Adding both collections whole
 * would print every priced calculation twice.
 */
function pdfRows(projectId) {
  const items = typeof wsItems === "function" ? wsItems(projectId) : [];
  const lines = typeof wsEstimations === "function" ? wsEstimations(projectId) : [];
  const priced = new Set(items.map((r) => r.estimationId).filter(Boolean));
  const bare = lines.filter((r) => !wsIsManualLine(r) && !priced.has(r.id));
  const other = lines.filter(wsIsManualLine);
  const lineById = new Map(lines.map((r) => [r.id, r]));
  return [
    ...items.map((r) => {
      // The waste belongs to the calculation, and a priced material is printed instead of
      // the calculation it came from — so the row has to carry it across, or the technical
      // report loses the waste of every material anybody actually priced, which is most of
      // them. `wastePercentage` and `wasteCostMinor` are the contract's own fields on the
      // saved calculation; nothing here recomputes them.
      const from = r.estimationId ? lineById.get(r.estimationId) : null;
      return {
        name: r.name,
        qty: `${wsNum(r.quantity)} ${r.unit || ""}`.trim(),
        minor: r.estimatedCostMinor || 0,
        currencyCode: r.currencyCode,
        wastePercentage: (from && from.wastePercentage) || 0,
        wasteCostMinor: (from && from.wasteCostMinor) || 0,
      };
    }),
    ...bare.map((r) => ({
      name: r.name,
      qty: `${wsNum(r.requiredUnits)} ${r.unitLabel || ""}`.trim(),
      minor: r.totalCostMinor || 0,
      currencyCode: r.currencyCode,
      wastePercentage: r.wastePercentage || 0,
      wasteCostMinor: r.wasteCostMinor || 0,
    })),
    ...other.map((r) => ({
      name: r.name,
      qty: "",
      minor: r.totalCostMinor || 0,
      currencyCode: r.currencyCode,
      wastePercentage: 0,
      wasteCostMinor: 0,
    })),
  ];
}

/**
 * Empty the document and hide it.
 *
 * Hiding it is not enough on its own. The document is markup that stays on the page
 * between prints, so a document filled in while the account was Pro is still holding every
 * row, every price and the investor breakdown after the plan lapses or somebody signs out
 * in another tab. What a level may not have has to leave the page, not be covered over.
 */
function pdfClear() {
  const doc = document.getElementById("ws-pdf-doc");
  if (!doc) return;
  doc.hidden = true;
  const rows = pdfEl(doc, "rows");
  if (rows) rows.innerHTML = "";
  doc.querySelectorAll("[data-pdf]").forEach((el) => {
    // The subtitle is the only slot the build did not leave empty — it carries both
    // document names as data attributes and the script picks one, so emptying its text
    // costs nothing and pdfFill() writes it again.
    el.textContent = "";
  });
  doc.querySelectorAll("[data-pdf-row]").forEach((el) => { el.hidden = true; });
}

/**
 * Fill the whole document for one project.
 *
 * Returns false when there is no project open — and when the plan on the account does not
 * reach the export, in which case the document is emptied and hidden rather than built and
 * withheld. Nothing below this line runs for a guest or a free account: no row, no price,
 * no total and no investor breakdown is ever written into the page.
 */
function pdfFill(projectId, opt) {
  const doc = document.getElementById("ws-pdf-doc");
  const project = typeof wsProject === "function" ? wsProject(projectId) : null;
  if (!doc || !project) return false;
  if (!pdfAllowed()) {
    pdfClear();
    return false;
  }

  const t = (key) => (typeof window.t === "function" ? window.t(key) : key);
  const investor = opt.type === "investor";
  const costs = wsProjectCosts(projectId);
  const money = (minor) => wsMoney(minor, costs.currencyCode);

  // The subtitle is the document's own name; the two are the app's two export types.
  pdfSet(doc, "subtitle", doc.dataset[investor ? "subInvestor" : "subTechnical"] || "");

  pdfSet(doc, "projectName", project.name);
  pdfSet(doc, "date", pdfToday());
  pdfShow(doc, "date", opt.date !== false);

  const number = String(opt.estimateNumber || "").trim();
  pdfShow(doc, "estimateNo", Boolean(opt.estimateNumber && number));
  pdfSet(doc, "estimateNo", number);

  pdfShow(doc, "contractor", Boolean(opt.contractor));
  pdfSet(doc, "company", opt.company || "");
  pdfSet(doc, "phone", opt.phone || "");
  pdfSet(doc, "email", opt.email || "");

  const rows = pdfRows(projectId);
  const body = pdfEl(doc, "rows");
  if (body) {
    body.innerHTML = rows.map((r) => {
      const qty = opt.quantities === false ? "" : r.qty;
      const value = opt.prices === false ? "" : wsMoney(r.minor, r.currencyCode);
      // The technical report is the one that shows the waste behind a number, because that
      // is what makes it technical. `wastePercentage` and `wasteCostMinor` are contract
      // fields on the saved calculation — nothing here computes them a second time.
      const waste = !investor && r.wasteCostMinor
        ? `<br><span class="pdf-waste">${wsEsc(wsNum(r.wastePercentage))} % · ${wsEsc(wsMoney(r.wasteCostMinor, r.currencyCode))}</span>`
        : "";
      return `<tr><td>${wsEsc(r.name)}${waste}</td><td>${wsEsc(qty)}</td><td>${wsEsc(value)}</td></tr>`;
    }).join("");
  }
  pdfShow(doc, "empty", rows.length === 0);

  // A column nobody asked for is taken out of the table rather than left blank, or the
  // header promises a figure that is not under it.
  doc.querySelectorAll("[data-pdf-col]").forEach((th) => {
    th.hidden = (th.dataset.pdfCol === "qty" && opt.quantities === false)
      || (th.dataset.pdfCol === "value" && opt.prices === false);
  });

  pdfShow(doc, "total", opt.total !== false);
  pdfSet(doc, "total", money(costs.total));

  const wasteMinor = rows.reduce((sum, r) => sum + (r.wasteCostMinor || 0), 0);
  pdfShow(doc, "waste", !investor && wasteMinor > 0);
  pdfSet(doc, "waste", money(wasteMinor));

  const pricing = pdfHasPricing(opt);
  pdfShow(doc, "pricing", pricing);
  if (pricing) {
    const b = pdfBreakdown(opt, costs.total);
    pdfSet(doc, "materialsNet", money(b.materialsNetMinor));
    pdfShow(doc, "labor", Boolean(opt.labor));
    pdfSet(doc, "labor", money(b.labor));
    pdfShow(doc, "marginRow", Boolean(opt.margin));
    pdfSet(doc, "margin", money(b.margin));
    // The net total is the meaningful subtotal only once something has been layered on it.
    pdfShow(doc, "net", Boolean(opt.labor || opt.margin));
    pdfSet(doc, "net", money(b.net));
    pdfShow(doc, "vatRow", Boolean(opt.vat));
    pdfSet(doc, "vat", money(b.vat));
    pdfShow(doc, "gross", Boolean(opt.vat));
    pdfSet(doc, "gross", money(b.gross));
  }

  const notes = String(opt.notesText || "").trim();
  pdfShow(doc, "notes", Boolean(opt.notes));
  if (opt.notes && notes) pdfSet(doc, "notes", notes);

  doc.hidden = false;
  return true;
}

/* ------------------------------------------------------------------ wiring */

function pdfInit() {
  // The wall first, and by the same call every Pro page makes: #pdf-gate is shown or
  // #pdf-tool is, and it is redrawn when somebody signs in or out in another tab. The
  // configurator ships `hidden`, so a plan that never answers leaves it shut.
  if (document.getElementById("pdf-tool") && typeof pwMount === "function") {
    pwMount("pdf", "pdf");
  }

  /* Signing in or out — in this tab or another — moves the level. A document printed
     while the account was Pro is still in the page, so the redraw that puts the wall back
     up empties it as well. */
  document.addEventListener("lm-session", () => { if (!pdfAllowed()) pdfClear(); });

  const form = document.getElementById("ws-pdf-form");
  const doc = document.getElementById("ws-pdf-doc");
  if (!form || !doc) return;

  // The two subtitles are stamped onto the element at build time in this page's language;
  // reading them from the DOM keeps the words out of this file and out of the dictionary.
  const sub = doc.querySelector('[data-pdf="subtitle"]');
  if (sub) {
    doc.dataset.subTechnical = doc.dataset.subTechnical || sub.dataset.technical || "";
    doc.dataset.subInvestor = doc.dataset.subInvestor || sub.dataset.investor || "";
  }

  const investorBlock = form.querySelector("[data-pdf-investor]");
  const syncType = () => {
    const type = form.querySelector('input[name="pdf-type"]:checked');
    if (investorBlock) investorBlock.hidden = !type || type.value !== "investor";
  };
  form.querySelectorAll('input[name="pdf-type"]').forEach((el) => el.addEventListener("change", syncType));
  syncType();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Asked before the document is built and again before the dialog is opened. The wall
    // normally means this listener is never reached at all; this is the case where the
    // markup was reached anyway.
    if (!pdfAllowed()) return;
    const id = typeof wsActiveProjectId === "function"
      ? (new URLSearchParams(location.search).get("id") || wsActiveProjectId())
      : null;
    if (!pdfFill(id, pdfOptions(form))) return;
    if (!pdfAllowed()) return;
    // The document is on the page and the rest of it is not, for the length of one print.
    document.body.dataset.pdfPrint = "1";
    const done = () => {
      delete document.body.dataset.pdfPrint;
      doc.hidden = true;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    // Some browsers never fire afterprint (and older ones fire it before the dialog is
    // dismissed). The page must not be left with everything but the document hidden, so
    // the cleanup also runs on its own.
    setTimeout(done, 1000);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", pdfInit);
} else {
  pdfInit();
}
