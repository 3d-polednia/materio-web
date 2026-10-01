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
 *
 * The fields are `type="text" inputmode="decimal"` (src/pages.mjs), so what arrives is
 * whatever a person writes with their own keyboard, and in most of the thirteen languages
 * that is a space or a dot for thousands and a comma for the decimal. The first draft did
 * `parseFloat(v.replace(",", "."))`, which read the hourly rate "1 000" as 1 and the rate
 * "1.000,50" as 1 — silently, on the one document that is printed and handed to a client.
 * So: drop every space (a plain one, a no-break one and a narrow one — "1 000 zł" pasted
 * out of a spreadsheet carries U+00A0), then let the LAST separator in the string be the
 * decimal point and the earlier ones be grouping.
 */
function pdfNum(value) {
  const raw = [...String(value == null ? "" : value)].filter((ch) => ch.trim() !== "").join("");
  const cut = Math.max(raw.lastIndexOf(","), raw.lastIndexOf("."));
  const clean = cut === -1
    ? raw
    : `${raw.slice(0, cut).replace(/[.,]/g, "")}.${raw.slice(cut + 1)}`;
  const n = parseFloat(clean);
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
    // Not toISOString(): that is UTC, and east of Greenwich the evening of the 12th is
    // printed as the 11th on a document that states the day the estimate was made.
    const d = new Date();
    const pad = (v) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
  return wsProjectRows(projectId);
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
  // A project saved in two currencies has no grand total, no waste total and no investor
  // breakdown — each of those is a sum of unlike amounts, and this is the one document
  // that gets printed and handed to somebody. The rows keep the currency each was saved
  // in, the total line carries one figure per currency, and a note says nothing was
  // converted at a rate.
  const mixed = Boolean(costs.mixed);

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
      // The cells carry the same marker as the headers, so the loop below takes the whole
      // column out. Without it the header vanished and the empty cell did not, and the
      // remaining figure stood one column to the right of the word describing it.
      return `<tr><td>${wsEsc(r.name)}${waste}</td>` +
        `<td data-pdf-col="qty">${wsEsc(qty)}</td>` +
        `<td data-pdf-col="value">${wsEsc(value)}</td></tr>`;
    }).join("");
  }
  pdfShow(doc, "empty", rows.length === 0);

  // A column nobody asked for is taken out of the table rather than left blank, or the
  // header promises a figure that is not under it.
  doc.querySelectorAll("[data-pdf-col]").forEach((cell) => {
    cell.hidden = (cell.dataset.pdfCol === "qty" && opt.quantities === false)
      || (cell.dataset.pdfCol === "value" && opt.prices === false);
  });

  pdfShow(doc, "total", opt.total !== false);
  pdfSet(doc, "total", wsSumsText(costs.byCurrency, "total") || money(0));
  // The note stands whenever the currencies are unlike, not only when the total is on:
  // it is also the only thing on the page that explains the missing investor breakdown.
  pdfShow(doc, "mixed", mixed);

  // The waste is grouped the same way the total is: it is money, and money in two
  // currencies is two figures.
  const waste = [];
  rows.forEach((r) => {
    if (!r.wasteCostMinor) return;
    const code = r.currencyCode || wsCurrency();
    const at = waste.find((w) => w.currencyCode === code);
    if (at) at.minor += r.wasteCostMinor;
    else waste.push({ currencyCode: code, minor: r.wasteCostMinor });
  });
  pdfShow(doc, "waste", !investor && waste.length > 0);
  pdfSet(doc, "waste", wsSumsText(waste, "minor"));

  // Labour, margin and VAT are all computed on top of the material total, which a mixed
  // project does not have. The block stays off rather than printing arithmetic done on
  // amounts that were never in the same currency.
  const pricing = pdfHasPricing(opt) && !mixed;
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

  // The document is one element in the page, reused for every export, so an empty field
  // has to overwrite rather than be skipped: asking for notes and typing none used to
  // print the note from the previous export.
  const notes = String(opt.notesText || "").trim();
  pdfSet(doc, "notes", notes);
  pdfShow(doc, "notes", Boolean(opt.notes && notes));

  doc.hidden = false;
  return true;
}

/** A stored quote date in the page language, without letting UTC move it by a day. */
function pdfQuoteDate(value) {
  const date = typeof value === "number" ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(document.documentElement.lang || "pl").format(date);
  } catch (e) {
    return String(value || "");
  }
}

/** The compact symbol belongs in the table header, leaving each numeric cell uncluttered. */
function pdfCurrencySymbol(code) {
  try {
    const parts = new Intl.NumberFormat(document.documentElement.lang || "pl", {
      style: "currency", currency: code, currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return (parts.find((part) => part.type === "currency") || {}).value || code;
  } catch (e) {
    return code;
  }
}

/** A table cell carries only the number; its currency is stated once in the header. */
function pdfMinorNumber(minor) {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || "pl", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format((Number(minor) || 0) / 100);
  } catch (e) {
    return ((Number(minor) || 0) / 100).toFixed(2);
  }
}

/** Fill the approved A4 quote from the same rows and totals as the editor. */
function pdfFillQuote(quoteId) {
  const doc = document.getElementById("ws-pdf-doc");
  const quote = typeof crmQuote === "function" ? crmQuote(quoteId) : null;
  if (!doc || !quote) return false;
  if (!pdfAllowed()) {
    pdfClear();
    return false;
  }
  const summary = typeof crmQuoteSummary === "function" ? crmQuoteSummary(quote.id) : null;
  const chain = summary || crmChain("quote", quote.id);
  const totals = summary ? summary.totals : crmQuoteTotals(quote.id);
  const word = (key) => typeof t === "function" ? t(key) : key;
  const company = typeof crmCompanies === "function"
    ? crmCompanies().find((row) => row.id === quote.companyId) : null;
  if (!company) return false;
  pdfSet(doc, "companyName", company.name);
  pdfSet(doc, "logoCompanyName", company.name);
  for (const [slot, value] of [
    ["companyStreet", company.street],
    ["companyPostalCity", [company.postalCode, company.city].filter(Boolean).join(" ")],
    ["companyNip", company.nip], ["companyPhone", company.phone],
    ["companyEmail", company.email], ["companyWww", company.www],
  ]) {
    const clean = String(value || "").trim();
    pdfSet(doc, slot, clean);
    pdfShow(doc, slot, Boolean(clean));
  }
  const logo = pdfEl(doc, "companyLogo");
  const hasLogo = Boolean(logo && company.logo);
  if (logo) logo.src = hasLogo ? company.logo : "";
  doc.classList.toggle("qdoc--no-logo", !hasLogo);
  const quoteNumber = String(quote.number || "").trim();
  pdfSet(doc, "quoteNumber", quoteNumber);
  pdfShow(doc, "quoteNumber", Boolean(quoteNumber));
  pdfSet(doc, "date", pdfQuoteDate(Number(quote.createdAt)));
  pdfSet(doc, "validUntil", pdfQuoteDate(quote.validUntil));
  pdfShow(doc, "validUntil", Boolean(quote.validUntil));

  const client = chain.client || null;
  const project = chain.project || null;
  const legacyAddress = client && !client.street && !client.postalCode && !client.city
    ? crmClientAddress(client) : "";
  for (const [slot, value] of [
    ["clientName", client && client.name], ["clientPhone", client && client.phone],
    ["clientEmail", client && client.email], ["clientStreet", client && (client.street || legacyAddress)],
    ["clientPostalCity", client && [client.postalCode, client.city].filter(Boolean).join(" ")],
    ["projectName", project && project.name],
  ]) {
    const clean = String(value || "").trim();
    pdfSet(doc, slot, clean);
    pdfShow(doc, slot, Boolean(clean));
  }

  const lines = crmQuoteLines(quote);
  const projectRows = lines.projectRows.filter((row) => !row.hidden);
  const projectMaterials = projectRows.filter((row) => row.source !== "other");
  const otherRows = projectRows.filter((row) => row.source === "other");
  const ownMaterials = lines.ownMaterials;
  const labour = lines.labour;
  const materialBody = pdfEl(doc, "materialRows");
  const materialRows = [...projectMaterials, ...ownMaterials.map((line) => ({
    name: line.name, quantity: line.quantity, unit: line.unit || "",
    qty: line.quantity === null ? word("quo_lump") : `${wsNum(line.quantity)} ${line.unit || ""}`.trim(),
    minor: line.amountMinor || 0, currencyCode: quote.currencyCode || totals.currencyCode,
  }))];
  if (materialBody) materialBody.innerHTML = materialRows.map((row, index) => {
    const qty = row.quantity === null ? (row.qty || word("quo_lump")) : row.qty;
    const price = row.quantity > 0 ? pdfMinorNumber(Math.round(row.minor / row.quantity)) : "—";
    return `<tr><td>${index + 1}</td><td>${wsEsc(row.name)}</td><td class="qdoc-num">${wsEsc(qty)}</td><td class="qdoc-num">${wsEsc(price)}</td><td class="qdoc-num">${wsEsc(pdfMinorNumber(row.minor))}</td></tr>`;
  }).join("");
  pdfShow(doc, "materialsTable", materialRows.length > 0);

  const otherBody = pdfEl(doc, "otherRows");
  if (otherBody) otherBody.innerHTML = otherRows.map((row, index) => {
    const qty = row.quantity === null ? (row.qty || word("quo_lump")) : row.qty;
    const price = row.quantity > 0 ? pdfMinorNumber(Math.round(row.minor / row.quantity)) : "—";
    return `<tr><td>${index + 1}</td><td>${wsEsc(row.name)}</td><td class="qdoc-num">${wsEsc(qty)}</td><td class="qdoc-num">${wsEsc(price)}</td><td class="qdoc-num">${wsEsc(pdfMinorNumber(row.minor))}</td></tr>`;
  }).join("");
  pdfShow(doc, "otherTable", otherRows.length > 0);

  const labourBody = pdfEl(doc, "labourRows");
  if (labourBody) labourBody.innerHTML = labour.map((line, index) => {
    const code = quote.currencyCode || totals.currencyCode || wsCurrency();
    const rate = typeof crmLabourRate === "function" ? crmLabourRate(line) : null;
    const qty = line.quantity === null ? word("quo_lump")
      : `${wsNum(line.quantity)} ${line.unit || ""}`.trim();
    return `<tr><td>${index + 1}</td><td>${wsEsc(line.name)}</td><td class="qdoc-num">${wsEsc(qty)}</td><td class="qdoc-num">${rate === null ? "—" : wsEsc(pdfMinorNumber(Math.round(rate)))}</td><td class="qdoc-num">${wsEsc(pdfMinorNumber(line.amountMinor || 0))}</td></tr>`;
  }).join("");
  pdfShow(doc, "labourTable", labour.length > 0);

  const money = (minor) => minor === null ? "—" : wsMoney(minor, totals.currencyCode);
  const per = (field) => wsSumsText(totals.projectByCurrency, field);
  pdfSet(doc, "materials", totals.materials === null ? per("materials") : money(totals.materials));
  pdfShow(doc, "materials", materialRows.length > 0 || totals.materials !== 0);
  pdfSet(doc, "other", totals.other === null ? per("other") : money(totals.other));
  const hasOther = totals.other === null
    ? totals.projectByCurrency.some((row) => row.other)
    : totals.other !== 0;
  pdfShow(doc, "other", hasOther);
  pdfSet(doc, "labour", money(totals.labour));
  pdfShow(doc, "labour", labour.length > 0);
  pdfSet(doc, "subtotal", money(totals.subtotal));
  pdfSet(doc, "marginLabel", `${word("quo_fig_margin")} ${wsNum(totals.marginPct)} %`);
  pdfSet(doc, "margin", money(totals.margin));
  pdfShow(doc, "marginRow", totals.marginPct > 0);
  pdfShow(doc, "subtotal", totals.marginPct > 0);
  pdfSet(doc, "net", money(totals.net));
  pdfShow(doc, "net", totals.vatPct !== null);
  pdfSet(doc, "vatLabel", `VAT ${totals.vatPct === null ? "" : `${wsNum(totals.vatPct)} %`}`.trim());
  pdfSet(doc, "vat", money(totals.vat));
  pdfShow(doc, "vatRow", totals.vatPct !== null);
  doc.querySelectorAll('[data-pdf="totalLabel"]')
    .forEach((head) => { head.textContent = `${head.dataset.label} (${totals.currencyCode})`; });
  pdfSet(doc, "total", money(totals.gross));
  const symbol = pdfCurrencySymbol(totals.currencyCode);
  for (const slot of ["unitPriceHead", "valueHead"]) doc.querySelectorAll(`[data-pdf="${slot}"]`)
    .forEach((head) => { head.textContent = `${head.dataset.label} (${symbol})`; });
  pdfShow(doc, "mixed", totals.mixed);
  const note = String(quote.note || "").trim();
  pdfSet(doc, "quoteNotes", note);
  pdfShow(doc, "quoteNotes", Boolean(note));
  const bank = String(company.bankAccount || "").trim();
  pdfSet(doc, "bankAccount", bank);
  pdfShow(doc, "bankAccount", Boolean(bank));
  pdfShow(doc, "notesBlock", Boolean(note || bank));
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
    const id = new URLSearchParams(location.search).get("id") ||
      (typeof wsActiveProjectId === "function" ? wsActiveProjectId() : null);
    let quotePrintTitle = "";
    if (form.hasAttribute("data-pdf-quote")) {
      const quote = typeof crmQuote === "function" ? crmQuote(id) : null;
      const companies = typeof crmCompanies === "function" ? crmCompanies() : [];
      const fallback = typeof crmDefaultCompany === "function" ? crmDefaultCompany() : null;
      const companyId = quote && (quote.companyId === undefined ? (fallback && fallback.id) : quote.companyId);
      const company = companies.find((row) => row.id === companyId);
      const message = document.getElementById("quo-pdf-company");
      if (message) message.hidden = Boolean(company);
      if (!company) return;
      const titleWord = String(doc.dataset.quoteTitle || "").trim();
      const titleName = String((quote && (quote.number || quote.name)) || "").trim();
      quotePrintTitle = `${titleWord} ${titleName}`.trim()
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
    }
    const filled = form.hasAttribute("data-pdf-quote")
      ? pdfFillQuote(id) : pdfFill(id, pdfOptions(form));
    if (!filled) return;
    if (!pdfAllowed()) return;
    // A direct body child can be the only layout box in print. Hiding the old page with
    // visibility kept all of its height and made that invisible height into blank sheets.
    const home = doc.parentNode;
    const marker = document.createComment("pdf-document-home");
    home.insertBefore(marker, doc);
    document.body.appendChild(doc);
    document.body.dataset.pdfPrint = "1";
    const oldTitle = document.title;
    if (quotePrintTitle) document.title = quotePrintTitle;
    let fallbackHide = 0;
    const done = () => {
      delete document.body.dataset.pdfPrint;
      if (marker.parentNode) marker.parentNode.insertBefore(doc, marker);
      marker.remove();
      doc.hidden = true;
      document.title = oldTitle;
      window.removeEventListener("afterprint", done);
      if (fallbackHide) { clearTimeout(fallbackHide); fallbackHide = 0; }
    };
    window.addEventListener("afterprint", done);
    // The owner's quote (2026-10-01) printed an empty logo box: the logo's data URL is set a
    // moment before print() and the dialog took its picture before it was decoded. A quote
    // waits for its images (at most 1.5 s), then two frames, then asks for the dialog.
    if (!form.hasAttribute("data-pdf-quote")) { window.print(); } else {
      const images = [...doc.querySelectorAll("img")].filter((img) => img.getAttribute("src"));
      const ready = Promise.all(images.map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {})));
      const cap = new Promise((resolve) => window.setTimeout(resolve, 1500));
      const frame = () => new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
      Promise.race([ready, cap]).then(frame).then(frame).then(() => {
        window.print();
        fallbackHide = window.setTimeout(done, 1000);
      });
      return;
    }
    // Some browsers never fire afterprint (and older ones fire it before the dialog is
    // dismissed). The page must not be left with everything but the document hidden, so
    // the cleanup also runs on its own.
    fallbackHide = setTimeout(done, 1000);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", pdfInit);
} else {
  pdfInit();
}
