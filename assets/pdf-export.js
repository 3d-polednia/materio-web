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

/** A JSON-safe copy of exactly the data printed on a quote. */
function pdfQuoteSnapshot(quoteId) {
  const quote = typeof crmQuote === "function" ? crmQuote(quoteId) : null;
  if (!quote || !pdfAllowed()) return null;
  const summary = typeof crmQuoteSummary === "function" ? crmQuoteSummary(quote.id) : null;
  const chain = summary || crmChain("quote", quote.id);
  const totals = summary ? summary.totals : crmQuoteTotals(quote.id);
  const company = typeof crmCompanies === "function"
    ? crmCompanies().find((row) => row.id === quote.companyId) : null;
  if (!company) return null;
  const word = (key) => typeof t === "function" ? t(key) : key;
  const lines = crmQuoteLines(quote);
  const projectRows = lines.projectRows.filter((row) => !row.hidden);
  const row = (line, labour) => {
    const quantity = line.quantity == null ? null : Number(line.quantity);
    const rate = labour && typeof crmLabourRate === "function" ? crmLabourRate(line) : null;
    return {
      name: String(line.name || ""),
      qtyText: quantity === null ? word("quo_lump")
        : `${typeof wsNum === "function" ? wsNum(quantity) : quantity} ${line.unit || ""}`.trim(),
      unitPriceMinor: quantity > 0
        ? Math.round(labour ? rate : Number(line.minor || line.amountMinor || 0) / quantity) : null,
      valueMinor: Number(line.minor == null ? line.amountMinor : line.minor) || 0,
    };
  };
  const own = lines.ownMaterials.map((line) => ({
    ...line, minor: line.amountMinor || 0,
  }));
  const client = chain.client || null;
  const legacyAddress = client && !client.street && !client.postalCode && !client.city
    && typeof crmClientAddress === "function" ? crmClientAddress(client) : "";
  const per = (field) => typeof wsSumsText === "function"
    ? wsSumsText(totals.projectByCurrency, field) : "";
  const cleanCompany = {};
  for (const key of ["name", "street", "postalCode", "city", "nip", "phone", "email", "www", "bankAccount", "logo"])
    cleanCompany[key] = String(company[key] || "");
  return JSON.parse(JSON.stringify({
    lang: document.documentElement.lang || "pl",
    company: cleanCompany,
    quote: { number: String(quote.number || ""), createdAt: Number(quote.createdAt) || 0,
      validUntil: String(quote.validUntil || ""), note: String(quote.note || "") },
    client: client ? { name: String(client.name || ""), phone: String(client.phone || ""),
      email: String(client.email || ""), street: String(client.street || legacyAddress || ""),
      postalCode: String(client.postalCode || ""), city: String(client.city || "") } : null,
    projectName: String(chain.project && chain.project.name || ""),
    materialRows: [
      ...projectRows.filter((r) => r.source !== "other").map((r) => row(r, false)),
      ...own.map((r) => row(r, false)),
    ],
    otherRows: projectRows.filter((r) => r.source === "other").map((r) => row(r, false)),
    labourRows: lines.labour.map((r) => row(r, true)),
    totals: {
      currencyCode: String(totals.currencyCode || "PLN"), materials: totals.materials,
      other: totals.other, labour: totals.labour, subtotal: totals.subtotal,
      marginPct: Number(totals.marginPct) || 0, margin: totals.margin, net: totals.net,
      vatPct: totals.vatPct, vat: totals.vat, gross: totals.gross, mixed: Boolean(totals.mixed),
      materialsText: totals.materials === null ? per("materials") : "",
      otherText: totals.other === null ? per("other") : "",
    },
    visibility: { forBlock: Boolean(client || chain.project) },
  }));
}

const pdfQuoteLogo = (value) => {
  const logo = String(value || "");
  return logo.length <= 400000 && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(logo) ? logo : "";
};

/** Render an untrusted shared snapshot without interpreting any stored string as markup. */
function pdfRenderQuote(doc, snap) {
  if (!doc || !snap || typeof snap !== "object") return false;
  const lang = String(snap.lang || "pl").slice(0, 16);
  const company = snap.company && typeof snap.company === "object" ? snap.company : {};
  const quote = snap.quote && typeof snap.quote === "object" ? snap.quote : {};
  const client = snap.client && typeof snap.client === "object" ? snap.client : null;
  const totals = snap.totals && typeof snap.totals === "object" ? snap.totals : {};
  const str = (v) => String(v == null ? "" : v).trim();
  const date = (v) => {
    const d = typeof v === "number" ? new Date(v) : new Date(`${v}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(lang).format(d);
    } catch (e) {
      return str(v);
    }
  };
  const minor = (v) => {
    try { return new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(v) || 0) / 100); }
    catch (e) { return ((Number(v) || 0) / 100).toFixed(2); }
  };
  const percent = (v) => {
    try {
      return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(Number(v) || 0);
    } catch (e) {
      return String(Number(v) || 0);
    }
  };
  const money = (v) => {
    if (v === null) return "";
    try { return new Intl.NumberFormat(lang, { style: "currency", currency: str(totals.currencyCode) || "PLN" }).format((Number(v) || 0) / 100); }
    catch (e) { return `${minor(v)} ${str(totals.currencyCode)}`.trim(); }
  };
  const put = (slot, value) => pdfSet(doc, slot, str(value));
  const optional = (slot, value) => {
    put(slot, value);
    pdfShow(doc, slot, Boolean(str(value)));
  };
  put("companyName", company.name);
  put("logoCompanyName", company.name);
  optional("companyStreet", company.street);
  optional("companyPostalCity", [company.postalCode, company.city].map(str).filter(Boolean).join(" "));
  for (const key of ["Nip", "Phone", "Email", "Www"]) optional(`company${key}`, company[key.toLowerCase()]);
  const logo = pdfEl(doc, "companyLogo");
  const logoSrc = pdfQuoteLogo(company.logo);
  // An empty src is not "no image": it resolves to the page's own URL and fetches it again.
  if (logo && logoSrc) logo.src = logoSrc;
  else if (logo) logo.removeAttribute("src");
  doc.classList.toggle("qdoc--no-logo", !logoSrc);
  optional("quoteNumber", quote.number);
  put("date", date(Number(quote.createdAt)));
  put("validUntil", date(quote.validUntil));
  pdfShow(doc, "validUntil", Boolean(str(quote.validUntil)));
  optional("clientName", client && client.name);
  optional("clientPhone", client && client.phone);
  optional("clientEmail", client && client.email);
  optional("clientStreet", client && client.street);
  const clientCountry = client && str(client.country).toUpperCase();
  const companyCountry = str(company.country).toUpperCase();
  const clientCountryName = clientCountry && companyCountry && clientCountry !== companyCountry
    ? LMPostal.countryName(clientCountry, lang) : "";
  optional("clientPostalCity", client && [client.postalCode, client.city, clientCountryName]
    .map(str).filter(Boolean).join(" "));
  optional("projectName", snap.projectName);
  pdfShow(doc, "forBlock", Boolean(client || str(snap.projectName)));
  const renderRows = (slot, rows) => {
    const body = pdfEl(doc, slot);
    if (!body) return;
    body.replaceChildren();
    (Array.isArray(rows) ? rows : []).forEach((raw, index) => {
      const row = raw && typeof raw === "object" ? raw : {};
      const tr = document.createElement("tr");
      [index + 1, str(row.name), str(row.qtyText), row.unitPriceMinor == null ? "" : minor(row.unitPriceMinor), minor(row.valueMinor)]
        .forEach((value, i) => {
          const td = document.createElement("td");
          td.textContent = String(value);
          if (i > 1) td.className = "qdoc-num";
          tr.appendChild(td);
        });
      body.appendChild(tr);
    });
  };
  renderRows("materialRows", snap.materialRows);
  renderRows("otherRows", snap.otherRows);
  renderRows("labourRows", snap.labourRows);
  pdfShow(doc, "materialsTable", Array.isArray(snap.materialRows) && snap.materialRows.length > 0);
  pdfShow(doc, "otherTable", Array.isArray(snap.otherRows) && snap.otherRows.length > 0);
  pdfShow(doc, "labourTable", Array.isArray(snap.labourRows) && snap.labourRows.length > 0);
  put("materials", totals.materials === null ? totals.materialsText : money(totals.materials));
  pdfShow(doc, "materials", (snap.materialRows || []).length > 0 || Number(totals.materials) !== 0);
  put("other", totals.other === null ? totals.otherText : money(totals.other));
  pdfShow(doc, "other", totals.other === null ? Boolean(str(totals.otherText)) : Number(totals.other) !== 0);
  put("labour", money(totals.labour));
  pdfShow(doc, "labour", (snap.labourRows || []).length > 0);
  put("subtotal", money(totals.subtotal));
  const marginWord = typeof t === "function" ? t("quo_fig_margin") : "Margin";
  put("marginLabel", `${marginWord} ${percent(totals.marginPct)} %`);
  put("margin", money(totals.margin));
  pdfShow(doc, "marginRow", Number(totals.marginPct) > 0);
  pdfShow(doc, "subtotal", Number(totals.marginPct) > 0);
  put("net", money(totals.net));
  pdfShow(doc, "net", totals.vatPct !== null);
  const vatRate = totals.vatPct === null ? "" : `${percent(totals.vatPct)} %`;
  put("vatLabel", `VAT ${vatRate}`.trim());
  put("vat", money(totals.vat));
  pdfShow(doc, "vatRow", totals.vatPct !== null);
  put("total", money(totals.gross));
  doc.querySelectorAll('[data-pdf="totalLabel"]').forEach((el) => {
    el.textContent = `${el.dataset.label} (${str(totals.currencyCode)})`;
  });
  let symbol = str(totals.currencyCode);
  try {
    const parts = new Intl.NumberFormat(lang, {
      style: "currency",
      currency: symbol,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    symbol = (parts.find((part) => part.type === "currency") || {}).value || symbol;
  } catch (e) {
    // An unknown code is still clearer than an empty table heading.
  }
  for (const slot of ["unitPriceHead", "valueHead"]) {
    doc.querySelectorAll(`[data-pdf="${slot}"]`).forEach((el) => {
      el.textContent = `${el.dataset.label} (${symbol})`;
    });
  }
  pdfShow(doc, "mixed", Boolean(totals.mixed));
  optional("quoteNotes", quote.note);
  optional("bankAccount", company.bankAccount);
  pdfShow(doc, "notesBlock", Boolean(str(quote.note) || str(company.bankAccount)));
  doc.hidden = false;
  return true;
}


function pdfFillQuote(quoteId) {
  const snap = pdfQuoteSnapshot(quoteId);
  if (!snap) { pdfClear(); return false; }
  return pdfRenderQuote(document.getElementById("ws-pdf-doc"), snap);
}

/* ------------------------------------------------------------------ wiring */

const pdfVendorScripts = new Map();

function pdfLoadScript(src) {
  if (pdfVendorScripts.has(src)) return pdfVendorScripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
  pdfVendorScripts.set(src, promise);
  return promise;
}

async function pdfWaitForDocumentImages(doc) {
  const images = [...doc.querySelectorAll("img")].filter((img) => img.src);
  await Promise.race([
    Promise.all(images.map((img) => img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function pdfSafeFileName(value) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "");
}

/**
 * How far down the capture anything was painted. html2canvas sizes the canvas from the
 * on-screen element, which on a phone is the tall one-column layout, while the clone is
 * drawn at desktop width — so the bottom of the canvas is blank and would become a blank
 * second page. Read upward one row at a time until a pixel is not white.
 */
function pdfPaintedHeight(canvas) {
  const ctx = canvas.getContext("2d");
  for (let y = canvas.height - 1; y > 0; y -= 1) {
    const row = ctx.getImageData(0, y, canvas.width, 1).data;
    for (let i = 0; i < row.length; i += 4) {
      if (row[i] < 250 || row[i + 1] < 250 || row[i + 2] < 250) return Math.min(canvas.height, y + 40);
    }
  }
  return 0;
}

/** 210 mm at the CSS 96 dpi the document is designed in. */
const pdfA4Px = 794;

async function pdfDownloadQuote(doc, stage = false) {
  await Promise.all([
    pdfLoadScript("/assets/vendor/jspdf.umd.min.js"),
    pdfLoadScript("/assets/vendor/html2canvas-pro.min.js"),
  ]);
  const wasHidden = doc.hidden;
  try {
    // The editor keeps the document hidden inside its tool. Stage it outside the viewport
    // without widening a phone page; the cloned sheet is made visible only for capture.
    if (stage || wasHidden) {
      doc.hidden = false;
      doc.classList.add("pdf-download-stage");
    }
    await pdfWaitForDocumentImages(doc);
    // The file is an A4 sheet, so it is drawn from the desktop layout whatever the screen:
    // on a phone the sheet reflows into one narrow column (quote-doc.css, max-width 600px)
    // and a capture of that came out as three pages of oversized text. html2canvas lays the
    // clone out in its own window, which is given a desktop width and A4 sheet width here.
    const canvas = await window.html2canvas(doc, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: false,
      windowWidth: 1200,
      width: pdfA4Px,
      onclone: (clone) => {
        const sheet = clone.getElementById("ws-pdf-doc");
        sheet.classList.remove("pdf-download-stage");
        sheet.classList.add("qdoc--paper");
        sheet.style.width = `${pdfA4Px}px`;
        // The editor's sheet sits in .wrap.narrow, and .qdoc's max-width: 100% held it to
        // that 675px column: the file came out with the text squeezed off-centre to the left.
        sheet.style.maxWidth = "none";
        sheet.style.transform = "none";
        sheet.style.margin = "0";
        sheet.style.opacity = "1";
        sheet.style.position = "static";
        sheet.style.zIndex = "auto";
      },
    });
    const usedHeight = pdfPaintedHeight(canvas);
    if (!usedHeight) throw new Error("The PDF capture is blank");
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
    const filename = `${pdfSafeFileName([doc.dataset.quoteTitle, number, company].filter(Boolean).join(" "))}.pdf`;
    const url = URL.createObjectURL(pdf.output("blob"));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    doc.hidden = stage || wasHidden;
    doc.classList.remove("pdf-download-stage");
  }
}

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

  form.addEventListener("submit", async (e) => {
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
    const action = e.submitter && e.submitter.dataset.pdfAction || "print";
    if (form.hasAttribute("data-pdf-quote") && action === "download") {
      const button = e.submitter;
      const status = form.querySelector(".quo-pdf-download-status");
      const label = button.textContent;
      button.disabled = true;
      button.textContent = form.dataset.downloading || label;
      if (status) status.textContent = "";
      try {
        await pdfDownloadQuote(doc, true);
      } catch {
        if (status) status.textContent = form.dataset.downloadFailed || "";
      } finally {
        button.textContent = label;
        button.disabled = false;
      }
      return;
    }
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
