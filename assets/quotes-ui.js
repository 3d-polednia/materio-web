/* LiczMat website — /wyceny/ in the browser. Session 24, chapter XXII.
 *
 * One page, two screens, the same shape as /klienci/, /zlecenia/ and /projekty/:
 *
 *   /wyceny/           the index: every quote, with what it comes to
 *   /wyceny/?id=<id>   one quote — the project it prices, the labour, the margin, the sum
 *
 * A quote's name in the index is a real <a href="?id=…">, so opening one is an ordinary
 * navigation: the back button works and a link can be copied without any history code
 * here. The one exception is deleting from the detail, which puts the index back with
 * `replaceState` so the "undo" the delete just offered survives.
 *
 * The store is assets/crm.js — localStorage, this browser only, nothing uploaded. The
 * project, its material list and its other costs are the free workspace's own rows
 * (assets/workspace.js), read here and never written: nothing on this page can rename,
 * re-price, archive or delete anything that belongs to a project.
 *
 * Chapter XXV stands in front of the page exactly as on the other two Pro modules — the
 * same wall, from the same builder (proGate() in src/pro.mjs, drawn by
 * assets/paywall.js), and the same one decision in lmPaywall().
 */

const quoT = (key) => (typeof t === "function" ? t(key) : key);
const quoLang = () => document.documentElement.lang || "pl";
const quoEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** CSV cells are quoted and never handed to a spreadsheet as formulas. */
function quoCsvCell(cell) {
  const value = String(cell == null ? "" : cell);
  const armed = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
  return armed.replace(/"/g, '""');
}

/** Build a safe download name out of text supplied by the visitor. */
function quoFileName(name, fallback, extension) {
  const clean = String(name || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\/:*?"<>|.]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .replace(/^[-\s]+|[-\s]+$/g, "");
  return `liczmat-${clean || fallback}.${extension}`;
}

/** Hand the browser a file without a server round trip. */
function quoDownload(filename, mime, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A quantity as the visitor's language writes it — "40", "12,5". */
function quoNum(n) {
  const v = Number(n);
  if (!isFinite(v)) return "";
  try {
    return new Intl.NumberFormat(quoLang(), { maximumFractionDigits: 2 }).format(v);
  } catch (e) {
    return String(v);
  }
}

/** The same number as a form value: a plain decimal point, so `inputmode` behaves. */
/** The page language's decimal mark, so a field prefilled with 64.44 reads 64,44 in Polish;
    crmDigits() reads either mark back. */
const quoDecimal = () => {
  try { return (1.5).toLocaleString(document.documentElement.lang || "pl").charAt(1); } catch (e) { return "."; }
};
const quoPlain = (n) => (n === null || n === undefined || n === "" ? "" : String(n).replace(".", quoDecimal()));

/** Money through the workspace's own formatter, so a quote reads like a project. */
const quoMoney = (minor, code) =>
  (typeof wsMoney === "function" ? wsMoney(minor, code) : `${(Number(minor) / 100).toFixed(2)}`);

/** A rate as a field value: whole minor units, which is the smallest money there is. */
const quoRateValue = (minor) => (minor === null ? "" : String(Math.round(minor) / 100).replace(".", quoDecimal()));
let quoMarginTimer = 0;

const QUO_CALLING_CODES = { pl: "48", de: "49", uk: "380", cs: "420", sk: "421", ro: "40",
  hr: "385", sr: "381", it: "39", nl: "31", es: "34", fr: "33" };

/** WhatsApp accepts international digits only. English deliberately opens its contact picker. */
function quoSharePhone(value, lang = quoLang()) {
  const raw = String(value || "").trim();
  if (!raw || (lang === "en" && !/^\+|^00/.test(raw))) return "";
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1).replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2).replace(/\D/g, "");
  const code = QUO_CALLING_CODES[lang];
  if (!code) return "";
  digits = digits.replace(/\D/g, "");
  if (lang !== "it") digits = digits.replace(/^0/, "");
  return `${code}${digits}`;
}

const quoShareEmail = (value) => {
  const email = String(value || "").trim();
  return email.includes("@") && !/[\s?&]/.test(email) ? email : "";
};
const quoShareMailto = (to, subject, message) =>
  `mailto:${quoShareEmail(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
/* A desktop browser often has no mail program behind mailto: — Chrome on Windows can own
   the protocol with no handler registered, and the click then does nothing at all (owner,
   2026-10-01). So on a desktop "E-mail" offers the two webmails by their compose URLs, the
   mail program, and the message to paste anywhere; on a phone mailto: opens the mail app. */
const quoShareGmail = (to, subject, message) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(quoShareEmail(to))}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
const quoShareOutlook = (to, subject, message) =>
  `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(quoShareEmail(to))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
const quoShareWhatsApp = (phone, message) =>
  `https://wa.me/${phone ? encodeURIComponent(phone) : ""}?text=${encodeURIComponent(message)}`;
const quoShareSms = (phone, message) =>
  `sms:${encodeURIComponent(phone || "")}?&body=${encodeURIComponent(message)}`;
const quoShareFormat = (template, values) => String(template || "").replace(/\{(\w+)\}/g,
  (_, key) => String(values[key] == null ? "" : values[key]));

/** The quote the address bar is asking for, or "" for the index. */
const quoUrlId = () => {
  try { return new URLSearchParams(location.search).get("id") || ""; } catch (e) { return ""; }
};

/** The address of another page of this site, in this page's language, from the build. */
const quoUrl = (key, fallback) => ((window.LM_LINKS && window.LM_LINKS[key]) || fallback);

/** The quote the page is currently showing. Set once per render pass. */
let quoOpenId = "";
/** Whether the edit form and the delete question are open, so a redraw keeps them. */
let quoEditing = false;
let quoAsking = false;
/** Which quote-owned line is open for correction, and in which shared list. */
let quoEditingLine = "";
let quoEditingList = "";
/** The project row being detached into this quote, while its correction form is open. */
let quoEditingProjectRow = "";
/** The last delete, until the visitor undoes it or moves on. */
let quoUndone = null;

/* ------------------------------------------------------------------ the Pro notice */

/**
 * Chapter XXV's paywall — the strip above the module, and the wall instead of it.
 *
 * Session 27 moved the whole of it into assets/paywall.js: sessions 22–25 wrote these
 * twenty lines once per module, identical but for a three-letter prefix, and four walls
 * are four chances to describe the same product differently. What is left here is the
 * name this file calls it by and the two arguments that make it this page's wall.
 */
const quoRenderPro = () => pwRender("quo", "quotes");

/**
 * May this browser use the quotes at all? — `quotes` in LM_FEATURES, PRO since session 24.
 *
 * Until 2026-09-03 the wall was the whole of the answer: pwRender() set `hidden` on
 * #quo-tool and every function below it went on drawing names, labour lines, margins and
 * five totals into that hidden element, and every button below it went on writing to the
 * store. A wall in front of a page that has already been built and is still working is a
 * wall anybody can walk round with one line in a console.
 *
 * So this is asked twice: once in quoRender(), which stops the page being drawn at all,
 * and once in each handler that writes, because a handler bound while the module was open
 * outlives the moment the account stops being Pro. A missing pwAllows() is a refusal, for
 * the reason pwState() closes.
 *
 * It is still not a security boundary — the store is `localStorage` on this device. It is
 * the product decision, enforced in the one place a browser can enforce anything.
 */
const quoAllowed = () => typeof pwAllows === "function" && pwAllows("quotes");

/**
 * Take every quote off the screen.
 *
 * Called when the answer above is no, including the moment it *becomes* no: signing out
 * in another tab fires `lm-session`, and a page that only put the wall up over the top of
 * the previous account's figures would still be holding them.
 */
function quoClear() {
  const ids = ["quo-list", "quo-labour-list"];
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.innerHTML = "";
  }
  const figures = document.querySelectorAll("#quo-detail [id^='quo-fig-']");
  for (let i = 0; i < figures.length; i++) figures[i].textContent = "";
}

/* ------------------------------------------------------------------ the index */

/**
 * One row of the index: the name, the project it prices, and the sum.
 *
 * The sum is crmQuoteTotals() rather than a stored figure, which is the whole point of the
 * module — a material re-priced on the project screen moves this number with no write.
 */
function quoRow(q) {
  const summary = crmQuoteSummary(q.id);
  if (!summary) return "";
  const names = [summary.client && summary.client.name, summary.project && summary.project.name]
    .filter(Boolean).map(quoEsc);
  // No "Bez projektu" here when there is none: the missing line under it says so.
  const where = names.join(" · ");
  const missing = summary.missing.map((part) => quoEsc(quoT(`quo_missing_${part}`))).join(" · ");
  const total = summary.totals.total === null ? ""
    : quoEsc(quoMoney(summary.totals.total, summary.totals.currencyCode));
  let saved = "";
  try { saved = new URLSearchParams(location.search).get("saved") || ""; } catch (e) {}
  return `<li data-id="${quoEsc(q.id)}" class="quo-index-row${saved === q.id ? " quo-saved-row" : ""}">
      <span class="row-name">
        <a href="?id=${encodeURIComponent(q.id)}" data-open><b>${quoEsc(q.name)}</b></a>
        <span class="muted">${where}</span>
        ${missing ? `<span class="quo-index-missing muted">${missing}</span>` : ""}
      </span>
      <span class="quo-index-side">
        <label class="field field-narrow">
          <span class="fld-label">${quoEsc(quoT("quo_status"))}</span>
          <select data-quote-status>${QUOTE_STATUS.map((status) =>
            `<option value="${status}"${status === summary.status ? " selected" : ""}>${quoEsc(quoT(`quo_st_${status}`))}</option>`).join("")}</select>
        </label>
        <strong class="dash-fig">${total}</strong>
        <a class="btn btn-ghost btn-sm btn-go" href="?id=${encodeURIComponent(q.id)}" data-open aria-label="${quoEsc(quoT("row_edit_named").replace("{name}", q.name))}">${quoEsc(quoT("row_edit"))}</a>
        <button type="button" class="btn btn-ghost btn-sm" data-quote-delete aria-label="${quoEsc(`${quoT("quo_remove")}: ${q.name}`)}">${quoEsc(quoT("quo_remove"))}</button>
      </span>
    </li>`;
}

function quoRenderList() {
  const list = document.getElementById("quo-list");
  if (!list) return;
  const rows = crmQuotes();
  list.innerHTML = rows.length
    ? rows.map((q) => quoRow(q)).join("")
    : `<li class="empty muted">${quoEsc(quoT("quo_empty"))}</li>`;
}

/** The project picker on the "add a quote" form: every project, plus "no project". */
function quoFillProjectPicker(select, selected) {
  if (!select) return;
  const projects = typeof wsProjects === "function" ? wsProjects() : [];
  select.innerHTML = [`<option value="">${quoEsc(quoT("quo_no_project"))}</option>`]
    .concat(projects.map((p) =>
      `<option value="${quoEsc(p.id)}">${quoEsc(p.name)}</option>`)).join("");
  select.value = selected || "";
}

/** The strip that offers the last delete back. Hidden the moment there is nothing to undo. */
function quoRenderUndo() {
  const strip = document.getElementById("quo-undo");
  if (!strip) return;
  strip.hidden = !quoUndone;
  if (!quoUndone) return;
  document.getElementById("quo-undo-text").textContent =
    `${quoT(quoUndone.restored ? "quo_restored" : "quo_deleted")} ${quoUndone.name}`;
  document.getElementById("quo-undo-go").hidden = Boolean(quoUndone.restored);
}

/* ------------------------------------------------------------------ one quote */

/** The breadcrumb gains the quote; the trail is server-rendered for the index only. */
function quoCrumb(name) {
  const ol = document.querySelector(".breadcrumbs ol");
  if (!ol) return;
  const extra = ol.querySelector("[data-quo-crumb]");
  if (!name) {
    if (extra) extra.remove();
    const last = ol.lastElementChild;
    if (last) last.removeAttribute("hidden");
    return;
  }
  const li = extra || document.createElement("li");
  li.setAttribute("data-quo-crumb", "1");
  li.textContent = name;
  if (!extra) ol.appendChild(li);
}

/** Fill one native picker without inventing a second representation of a record. */
function quoFillPicker(id, rows, selected, emptyKey) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = [`<option value="">${quoEsc(quoT(emptyKey))}</option>`]
    .concat(rows.map((row) => `<option value="${quoEsc(row.id)}">${quoEsc(row.name)}</option>`)).join("");
  el.value = selected || "";
}

/**
 * The client a quote is written for.
 *
 * Stored on the quote itself since 2026-10-01: until then a client reached a quote only
 * through its project, so choosing a client made a project out of the quote's name, and
 * choosing "Bez projektu" afterwards took the client away. With a project attached, the
 * project is linked to the client too (crmLinkProject() moves it from a previous one), so
 * both ends keep telling the same story. "" clears the quote's own client.
 */
function quoChooseClient(clientId) {
  const q = crmQuote(quoOpenId);
  if (!q) return null;
  const client = clientId ? crmClient(clientId) : null;
  if (clientId && !client) return null;
  const project = q.projectId && wsProject(q.projectId);
  if (client && project) crmLinkProject(client.id, project.id);
  return crmUpdateQuote(q.id, { clientId: client ? client.id : "" });
}

/**
 * Selecting a project keeps the quote's link and lets crmChain() derive the rest. A client
 * that reached the quote only through the project it is leaving stays on the quote.
 */
function quoChooseProject(projectId) {
  const q = crmQuote(quoOpenId);
  if (!q) return null;
  const chain = crmChain("quote", q.id);
  const keep = !q.clientId && chain.client ? { clientId: chain.client.id } : {};
  return crmUpdateQuote(quoOpenId, { projectId, ...keep });
}

/** The project's rooms, as one line. Its rows are drawn by quoRenderMaterials(), which can leave one out. */
function quoRenderProjectContent(q) {
  const roomsEl = document.getElementById("quo-room-list");
  if (!roomsEl) return;
  const project = q.projectId && wsProject(q.projectId);
  const rooms = project ? wsRooms(project.id) : [];
  roomsEl.textContent = rooms.length
    ? `${quoT("quo_rooms_label")}: ${rooms.map((room) => room.name).join(", ")}`
    : `${quoT("quo_rooms_label")}: ${quoT("quo_rooms_none")}`;
}

/** One language's closed list of units, stored as their visible labels on quote lines. */
const quoUnits = () => quoT("quo_units").split("|").filter(Boolean);

/** An own material's quote unit: its explicit unit, or the localized package unit. */
function quoOwnMaterialUnit(material) {
  return String(material && material.unit || quoUnits()[7] || "");
}

const quoOwnMaterials = () => (typeof omMaterials === "function" ? omMaterials() : []);

function quoOwnMaterialMatch(value) {
  const needle = String(value || "").trim().toLocaleLowerCase(quoLang());
  return needle ? quoOwnMaterials().find((m) => String(m.name || "").trim()
    .toLocaleLowerCase(quoLang()) === needle) || null : null;
}

/** Draw the visitor's own materials as quote actions, separate from the free-form line. */
function quoFillOwnMaterials() {
  const rows = quoOwnMaterials();
  const list = document.getElementById("quo-own-picker-list");
  if (!list) return;
  const search = document.getElementById("quo-own-search");
  const query = rows.length >= 6 && search ? search.value.trim().toLocaleLowerCase(quoLang()) : "";
  const shown = query ? rows.filter((m) => `${m.name || ""} ${m.purpose || ""}`
    .toLocaleLowerCase(quoLang()).includes(query)) : rows;
  const quote = crmQuote(quoOpenId);
  const lines = quote && Array.isArray(quote.materials) ? quote.materials : [];
  const quoteCurrency = (quote && quote.currencyCode) || crmCurrency();
  list.innerHTML = shown.map((m) => {
    const unit = quoOwnMaterialUnit(m);
    const linked = lines.find((line) => line.ownId === m.id);
    const hasPrice = m.priceMinor !== null && m.priceMinor !== undefined;
    const compatible = hasPrice && m.currencyCode === quoteCurrency;
    const price = hasPrice ? `${quoMoney(m.priceMinor, m.currencyCode)} / ${unit}` : quoT("omat_price_none");
    const note = hasPrice && !compatible
      ? `<p class="muted mrow-full">${quoEsc(quoT("quo_mat_cur_differs").replace("{cur}", m.currencyCode || ""))}</p>` : "";
    const action = linked
      ? `<span class="quo-own-in">${quoEsc(quoT("quo_own_in").replace("{qty}", `${quoNum(linked.quantity === null ? 1 : linked.quantity)} ${unit}`))}</span><button type="button" class="btn btn-ghost btn-sm" data-quo-own-remove>${quoEsc(quoT("quo_own_remove"))}</button>`
      : `<input type="text" inputmode="decimal" value="1" class="quo-own-qty" aria-label="${quoEsc(quoT("quo_labour_qty") + " (" + unit + ")")}" data-quo-own-qty><button type="button" class="btn btn-primary btn-sm" data-quo-own-add>${quoEsc(quoT("quo_own_add"))}</button>`;
    return `<div class="mrow" data-quo-own-id="${quoEsc(m.id)}"><div class="mrow-main"><b>${quoEsc(m.name)}</b><span class="muted">${quoEsc(m.purpose || unit)}</span></div><div class="mrow-price"><b>${quoEsc(price)}</b></div><div class="mrow-act">${action}</div>${note}</div>`;
  }).join("");
  const empty = document.getElementById("quo-own-picker-empty");
  if (empty) empty.hidden = rows.length > 0;
  const searchWrap = document.getElementById("quo-own-search-wrap");
  if (searchWrap) searchWrap.hidden = rows.length < 6;
}

/** A closed unit picker that still preserves a label saved by an older version or project. */
function quoUnitSelect(value, attr = "") {
  const stored = String(value || "");
  const units = quoUnits();
  const options = stored && units.indexOf(stored) === -1 ? [stored, ...units] : units;
  return `<select ${attr}>${options.map((unit) =>
    `<option${unit === stored ? " selected" : ""}>${quoEsc(unit)}</option>`).join("")}</select>`;
}

/** One project row, either intact or opened for detaching into the quote. */
function quoProjectRow(row) {
  if (quoEditingProjectRow === row.key) {
    return quoLineForm("materials", {
      id: row.key, name: row.name, quantity: row.quantity, unit: row.unit,
      amountMinor: row.minor,
    }, row.key);
  }
  const figure = [row.qty, quoMoney(row.minor, row.currencyCode)].filter((part) => String(part || "").trim()).join(" · ");
  return `<li data-key="${quoEsc(row.key)}">
      <span class="row-name"><b>${quoEsc(row.name)}</b></span>
      <span class="dash-fig">${quoEsc(figure)}</span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-project-row-edit>${quoEsc(quoT("proj_mat_edit"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-hide-row>${quoEsc(quoT("quo_hide_row"))}</button>
      </span>
    </li>`;
}

/** Quote materials use the shared project-row builder, including the rows hidden here. */
function quoRenderMaterials(q) {
  quoFillOwnMaterials();
  const lines = crmQuoteLines(q);
  const visible = lines.projectRows.filter((row) => !row.hidden);
  const hidden = lines.projectRows.filter((row) => row.hidden);
  const materials = visible.filter((row) => row.source !== "other");
  const other = visible.filter((row) => row.source === "other");
  const list = document.getElementById("quo-material-list");
  list.innerHTML = materials.length ? materials.map(quoProjectRow).join("")
    : `<li class="empty muted">${quoEsc(quoT("proj_mat_empty"))}</li>`;
  const otherWrap = document.getElementById("quo-other-wrap");
  otherWrap.hidden = other.length === 0;
  document.getElementById("quo-other-list").innerHTML = other.map(quoProjectRow).join("");
  const wrap = document.getElementById("quo-hidden-wrap");
  wrap.hidden = hidden.length === 0;
  document.getElementById("quo-hidden-summary").textContent = `${quoT("quo_hidden_rows")} (${hidden.length})`;
  document.getElementById("quo-hidden-list").innerHTML = hidden.map((row) => `<li data-key="${quoEsc(row.key)}">
      <span class="row-name"><b>${quoEsc(row.name)}</b></span>
      <button type="button" class="btn btn-ghost btn-sm" data-restore-row>${quoEsc(quoT("quo_restore_row"))}</button>
    </li>`).join("");
  const own = document.getElementById("quo-own-material-list");
  own.innerHTML = lines.ownMaterials.length
    ? lines.ownMaterials.map((line) => quoEditingList === "materials" && line.id === quoEditingLine
      ? quoLineForm("materials", line) : quoLineRow("materials", line)).join("")
    : "";
  const priceLabel = document.getElementById("quo-materials-price-label");
  const code = q.currencyCode || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  if (priceLabel) priceLabel.textContent = `${quoT("quo_mat_line_price")} (${code})`;
  quoRunningTotal("materials");
}

/** One quote-owned line as it reads, shared by own materials and labour. */
function quoLineRow(list, line) {
  // The rate is the amount divided by the quantity — the same rule a material's unit price
  // follows, and for the same reason: one stored figure cannot contradict another.
  const rate = crmLabourRate(line);
  const code = crmQuote(quoOpenId).currencyCode || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  const how = line.quantity === null
    ? `<em class="muted">${quoEsc(quoT("quo_lump"))}</em>`
    : `<b>${quoNum(line.quantity)} ${quoEsc(line.unit)}</b>`;
  const at = rate !== null
    ? `<em class="muted ws-mat-price">${line.quantity === null ? "" : "× "}${quoEsc(quoMoney(Math.round(rate), code))}</em>` : "";
  const amount = line.amountMinor > 0
    ? `<em class="muted">${rate !== null ? "= " : ""}${quoEsc(quoMoney(line.amountMinor, code))}</em>` : "";
  return `<li class="ws-mat" data-line="${quoEsc(line.id)}" data-list="${list}">
      <span class="row-name"><b>${quoEsc(line.name)}</b></span>
      <span class="dash-fig">${how} ${at} ${amount}</span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-line-edit>${quoEsc(quoT("proj_mat_edit"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-line-del>${quoEsc(quoT("quo_remove"))}</button>
      </span>
    </li>`;
}

/**
 * The same line, open for correction — a form in the row it belongs to, for the reason
 * session 15 gave when it took `prompt()` out: a browser dialog cannot be styled, cannot
 * be reached by the page's own translation once it is open, and on a phone covers the
 * thing being changed.
 */
function quoLineForm(list, line, projectKey = "") {
  const q = crmQuote(quoOpenId);
  const code = (q && q.currencyCode) || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  return `<li class="ws-mat ws-editing" ${projectKey ? `data-key="${quoEsc(projectKey)}"` : `data-line="${quoEsc(line.id)}" data-list="${list}"`}>
      <form class="ws-mat-edit" ${projectKey ? "data-project-row-form" : "data-line-form"}>
        <p class="ws-mat-grid">
          <label class="ws-mat-f">
            <span class="ws-bar-label">${quoEsc(quoT(list === "materials" ? "quo_mat_line_name" : "quo_labour_name"))}</span>
            <input type="text" maxlength="120" data-f="name" value="${quoEsc(line.name)}" required>
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${quoEsc(quoT("quo_labour_qty"))}</span>
            <input type="text" inputmode="decimal" data-f="quantity" value="${quoEsc(quoPlain(line.quantity))}">
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${quoEsc(quoT("quo_labour_unit"))}</span>
            ${quoUnitSelect(line.unit, 'data-f="unit"')}
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${quoEsc(quoT(list === "materials" ? "quo_mat_line_price" : "quo_labour_price"))} (${quoEsc(code)})</span>
            <input type="text" inputmode="decimal" data-f="priceMajor" value="${quoEsc(quoRateValue(crmLabourRate(line)))}">
          </label>
        </p>
        <p class="ws-mat-sum" data-line-sum aria-live="polite"></p>
        ${projectKey ? `<p class="muted">${quoEsc(quoT("quo_row_detach_note"))}</p>` : ""}
        <p class="ws-ask-row">
          <button type="submit" class="btn btn-primary btn-sm">${quoEsc(quoT("app_save"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-line-cancel>${quoEsc(quoT("action_cancel"))}</button>
        </p>
      </form>
    </li>`;
}

function quoRenderLabour(q) {
  const list = document.getElementById("quo-labour-list");
  if (!list) return;
  const lines = Array.isArray(q.labour) ? q.labour : [];
  list.innerHTML = lines.length
    ? lines.map((line) => (quoEditingList === "labour" && line.id === quoEditingLine
      ? quoLineForm("labour", line) : quoLineRow("labour", line))).join("")
    : `<li class="empty muted">${quoEsc(quoT("quo_labour_empty"))}</li>`;

  // The add form goes away when the quote is full rather than refusing a submit nobody
  // could have predicted.
  const full = lines.length >= QUO_MAX_LINES;
  const form = document.getElementById("quo-labour-form");
  const note = document.getElementById("quo-labour-full");
  if (form) form.hidden = full;
  if (note) note.hidden = !full;
  const priceLabel = document.getElementById("quo-labour-price-label");
  const code = q.currencyCode || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  if (priceLabel) priceLabel.textContent = `${quoT("quo_labour_price")} (${code})`;
  quoRunningTotal();
}

/** "40 × 80 = 3200" under the add form, as the fields are typed. */
function quoRunningTotal(list = "labour") {
  const out = document.getElementById(`quo-${list}-run`);
  if (!out) return;
  const qty = document.getElementById(`quo-${list}-qty`);
  const price = document.getElementById(`quo-${list}-price`);
  if (!qty || !price || !price.value.trim()) { out.textContent = ""; return; }
  const q = crmQuote(quoOpenId);
  const code = (q && q.currencyCode) || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  const n = crmQty(qty.value);
  const amount = crmLineAmount(price.value, n);
  out.textContent = `${n === null ? "1" : quoNum(n)} × ${quoMoney(crmMinor(price.value) || 0, code)} = ${quoMoney(amount, code)}`;
}

/** The same quantity × rate preview inside either kind of open line. */
function quoLineRunningTotal(e) {
  const form = e.target.closest("[data-line-form]");
  if (!form) return;
  const out = form.querySelector("[data-line-sum]");
  const price = form.querySelector('[data-f="priceMajor"]').value;
  if (!out || !String(price).trim()) { if (out) out.textContent = ""; return; }
  const q = crmQuote(quoOpenId);
  const code = (q && q.currencyCode) || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  const n = crmQty(form.querySelector('[data-f="quantity"]').value);
  out.textContent = `${n === null ? "1" : quoNum(n)} × ${quoMoney(crmMinor(price) || 0, code)} = ${
    quoMoney(crmLineAmount(price, n), code)}`;
}

/** The one link the quote stores, and the picker that sets it. */
function quoRenderProject(q) {
  const list = document.getElementById("quo-project-list");
  if (!list) return;
  const project = q.projectId && typeof wsProject === "function" ? wsProject(q.projectId) : null;
  if (project) {
    const costs = wsProjectCosts(project.id);
    const money = quoEsc(wsSumsText(costs.byCurrency, "total", quoMoney));
    list.innerHTML = `<li data-id="${quoEsc(project.id)}">
        <span class="row-name">
          <a href="${quoEsc(quoUrl("projects", "/projekty/"))}?id=${encodeURIComponent(project.id)}"><b>${
      quoEsc(project.name)}</b></a>
          <em class="muted">${money}</em>
        </span>
        <span class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-unlink>${quoEsc(quoT("quo_unlink"))}</button>
        </span>
      </li>`;
  } else {
    list.innerHTML = `<li class="empty muted">${quoEsc(quoT("quo_project_none"))}</li>`;
  }

  const chain = crmChain("quote", q.id);
  quoFillPicker("quo-client-pick", crmClients(), chain.client && chain.client.id, "job_client_none");
  quoFillPicker("quo-project-pick", wsProjects(), project && project.id, "quo_no_project");
  quoRenderProjectContent(q);
}

/** The whole detail screen for one quote. */
function quoRenderDetail(id) {
  const q = crmQuote(id);
  const missing = document.getElementById("quo-missing");
  const body = document.getElementById("quo-body");
  const title = document.getElementById("quo-title");
  const lead = document.getElementById("quo-lead");

  if (!q) {
    missing.hidden = false;
    body.hidden = true;
    title.textContent = quoT("quo_none_t");
    lead.hidden = true;
    quoCrumb(quoT("quo_none_t"));
    return;
  }

  missing.hidden = true;
  body.hidden = false;
  title.textContent = q.name;
  lead.hidden = true;
  quoCrumb(q.name);

  const status = document.getElementById("quo-status");
  if (status) status.value = crmQuoteStatus(q);

  const companies = typeof crmCompanies === "function" ? crmCompanies() : [];
  const fallback = typeof crmDefaultCompany === "function" ? crmDefaultCompany() : null;
  const companyId = q.companyId === undefined ? (fallback && fallback.id) || "" : q.companyId;
  quoFillPicker("quo-company", companies, companyId, "quo_no_company");
  const company = companies.find((row) => row.id === companyId) || null;
  const share = document.getElementById("quo-share");
  if (share) { share.disabled = !company; share.title = company ? "" : quoT("quo_pdf_company"); }
  const hasAccount = Boolean(window.lmAccount && window.lmAccount.uid);
  const accountNote = document.getElementById("quo-share-account");
  if (accountNote) accountNote.hidden = hasAccount;
  const companyNote = document.getElementById("quo-share-company");
  if (companyNote) companyNote.hidden = Boolean(company) || !hasAccount;
  document.getElementById("quo-company-preview").textContent = company
    ? [company.name, company.nip && `${LMTaxId.taxId(company.country, quoT("company_nip")).label} ${company.nip}`, company.city].filter(Boolean).join(" · ") : "";
  document.getElementById("quo-company-empty").hidden = companies.length > 0;
  document.getElementById("quo-company-logo-hint").hidden = !company || Boolean(company.logo);
  document.getElementById("quo-number").value = q.number || "";
  document.getElementById("quo-created").value = new Date(q.createdAt).toLocaleDateString(quoLang());
  document.getElementById("quo-valid-until").value = q.validUntil || "";
  // The quote's own currency, independent of the page language and of the site-wide one.
  const currency = document.getElementById("quo-currency");
  const codes = typeof LM_CURRENCIES !== "undefined" ? LM_CURRENCIES : ["PLN", "EUR"];
  const current = q.currencyCode || crmQuoteTotals(q.id).currencyCode;
  currency.innerHTML = (codes.indexOf(current) === -1 ? [current, ...codes] : codes)
    .map((code) => `<option${code === current ? " selected" : ""}>${quoEsc(code)}</option>`).join("");

  // Chapter XXII's five figures. Three of them are the project's own money, read through
  // wsProjectCosts() rather than copied, so this page and the project screen can never
  // disagree about what the work costs.
  const money = crmQuoteTotals(id);
  // A figure that does not exist is not printed as zero. A quote whose project mixes
  // currencies has no materials figure, no subtotal and no total — an em dash says that,
  // where "0,00 zł" would say something false. Materials and other costs do have an
  // answer per currency, and that is what goes in their place.
  const fig = (el, minor, instead) => {
    const node = document.getElementById(el);
    if (!node) return;
    node.textContent = minor === null
      ? (instead || "")
      : quoMoney(minor, money.currencyCode);
  };
  const per = (field) => wsSumsText(money.projectByCurrency, field, quoMoney);
  fig("quo-fig-materials", money.materials, per("materials"));
  fig("quo-fig-other", money.other, per("other"));
  fig("quo-fig-labour", money.labour);
  fig("quo-fig-sub", money.subtotal);
  fig("quo-fig-margin", money.margin);
  fig("quo-fig-net", money.net);
  fig("quo-fig-vat", money.vat);
  fig("quo-fig-total", money.gross);
  const vat = document.getElementById("quo-vat");
  const vatCustom = document.getElementById("quo-vat-custom");
  const rates = QUOTE_VAT_RATES[quoLang()] || QUOTE_VAT_RATES.en;
  const stored = money.vatPct === null ? "" : String(money.vatPct);
  const foreign = stored !== "" && rates.indexOf(Number(stored)) === -1;
  vat.innerHTML = `<option value="">${quoEsc(quoT("quo_vat_none"))}</option>`
    + rates.map((rate) => `<option value="${rate}">${quoEsc(String(rate).replace(".", ","))}%</option>`).join("")
    + (foreign ? `<option value="${quoEsc(stored)}">${quoEsc(stored.replace(".", ","))}%</option>` : "")
    + `<option value="custom">${quoEsc(quoT("quo_vat_custom"))}</option>`;
  vat.value = stored;
  vatCustom.hidden = true;
  document.getElementById("quo-mixed").hidden = !money.mixed;

  const margin = document.getElementById("quo-margin");
  // Never overwritten while it has the focus: the visitor is typing into it.
  if (margin && document.activeElement !== margin) {
    margin.value = money.marginPct ? String(money.marginPct) : "";
  }
  const showMargin = document.getElementById("quo-show-margin");
  if (showMargin) showMargin.checked = q.showMargin === true;

  const quoteLines = crmQuoteLines(q);
  const unpriced = [
    ...quoteLines.projectRows.filter((row) => !row.hidden),
    ...quoteLines.ownMaterials,
    ...quoteLines.labour,
  ].filter((line) => Number(line.minor == null ? line.amountMinor : line.minor) === 0).length;
  const priceWarning = document.getElementById("quo-price-warning");
  if (priceWarning) {
    priceWarning.hidden = unpriced === 0;
    priceWarning.textContent = unpriced === 1
      ? quoT("quo_unpriced_one")
      : quoT("quo_unpriced_many").replace("{count}", String(unpriced));
  }

  const note = document.getElementById("quo-note");
  note.textContent = q.note || quoT("quo_note_empty");
  note.classList.toggle("muted", !q.note);

  const form = document.getElementById("quo-edit-form");
  form.hidden = !quoEditing;
  if (quoEditing) {
    // Filled from the store on every redraw *except* while the visitor is typing into it:
    // a `crmchange` from another tab would otherwise wipe half-finished edits.
    if (!form.dataset.filled) {
      document.getElementById("quo-edit-name").value = q.name;
      document.getElementById("quo-edit-note").value = q.note || "";
      form.dataset.filled = "1";
    }
  } else {
    delete form.dataset.filled;
  }

  const ask = document.getElementById("quo-delete-ask");
  ask.hidden = !quoAsking;
  document.getElementById("quo-delete-q").textContent = quoT("quo_delete_q");

  quoRenderLabour(q);
  quoRenderProject(q);
  quoRenderMaterials(q);
}

/* ------------------------------------------------------------------ the switch */

/** Show the screen the address bar asks for, and fill it. */
function quoRender() {
  const detail = document.getElementById("quo-detail");
  if (!detail) return;
  const was = quoOpenId;
  quoOpenId = quoUrlId();
  // A half-finished edit belongs to the quote it was opened on. Leaving ends it.
  if (quoOpenId !== was) { quoEditing = false; quoAsking = false; quoEditingLine = ""; quoEditingList = ""; quoEditingProjectRow = ""; }
  const index = document.getElementById("quo-index");

  detail.hidden = !quoOpenId;
  index.hidden = Boolean(quoOpenId);

  quoRenderPro();

  /* The wall is up, so nothing below it gets built. This is the difference between a
     module that is hidden and a module that is closed: no quote name, no labour line, no
     margin and none of chapter XXII's five figures is computed or written into the page
     for a level that may not have them. */
  if (!quoAllowed()) {
    quoClear();
    return;
  }

  // Opening and closing a quote changes the address without a reload, and the language
  // links carry that address so a switch of language keeps the quote on screen.
  if (typeof keepQueryOnLangLinks === "function") keepQueryOnLangLinks();

  if (quoOpenId) {
    quoUndone = null; // opening a quote is moving on; the strip has had its say
    quoRenderDetail(quoOpenId);
    return;
  }

  document.getElementById("quo-title").textContent = quoT("quopage_title");
  const lead = document.getElementById("quo-lead");
  lead.textContent = quoT("quopage_lead");
  lead.hidden = false;
  quoCrumb("");
  quoRenderUndo();
  quoFillProjectPicker(document.getElementById("quo-project"),
    document.getElementById("quo-project").value);
  quoRenderList();
}

/** Leave the detail without a reload, so an undo offered by a delete survives. */
function quoBackToIndex() {
  try { history.replaceState({}, "", location.pathname); } catch (e) {}
  quoRender();
}

/* ------------------------------------------------------------------ wiring */

function wireQuoteDetail() {
  /* Every listener on this screen goes through one guard, and it is checked when the
     event arrives rather than when the listener is bound: the page is built once, and the
     account can stop being Pro while it is open — a sign-out in another tab, or a plan
     that ran out between two clicks. Binding nothing at all would leave the same
     handlers behind for anybody who signed in and out again. */
  const on = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, (e) => { if (quoAllowed()) fn(e); });
  };

  // Chapter XXII's margin: one field on the page, because it is the number a tradesman
  // moves while watching the total.
  on("quo-margin", "change", (e) => { crmUpdateQuote(quoOpenId, { marginMajor: e.target.value }); });
  on("quo-margin", "input", (e) => {
    clearTimeout(quoMarginTimer);
    quoMarginTimer = setTimeout(() => crmUpdateQuote(quoOpenId, { marginMajor: e.target.value }), 400);
  });
  on("quo-show-margin", "change", (e) => { crmUpdateQuote(quoOpenId, { showMargin: e.target.checked }); });
  on("quo-status", "change", (e) => { crmUpdateQuote(quoOpenId, { status: e.target.value }); });
  on("quo-company", "change", (e) => { crmUpdateQuote(quoOpenId, { companyId: e.target.value }); });
  on("quo-number", "change", (e) => { crmUpdateQuote(quoOpenId, { number: e.target.value }); });
  on("quo-valid-until", "change", (e) => { crmUpdateQuote(quoOpenId, { validUntil: e.target.value }); });
  on("quo-currency", "change", (e) => { crmUpdateQuote(quoOpenId, { currencyCode: e.target.value }); });
  on("quo-vat", "change", (e) => {
    const custom = document.getElementById("quo-vat-custom");
    custom.hidden = e.target.value !== "custom";
    if (e.target.value === "custom") { custom.value = ""; custom.focus(); return; }
    crmUpdateQuote(quoOpenId, { vatPct: e.target.value });
  });
  on("quo-vat-custom", "change", (e) => {
    crmUpdateQuote(quoOpenId, { vatPct: e.target.value });
  });

  const wireProjectRows = (id) => {
    on(id, "click", (e) => {
      const row = e.target.closest("[data-key]");
      const quote = crmQuote(quoOpenId);
      if (!row || !quote) return;
      if (e.target.closest("[data-project-row-edit]")) { quoEditingProjectRow = row.dataset.key; quoRender(); return; }
      if (e.target.closest("[data-line-cancel]")) { quoEditingProjectRow = ""; quoRender(); return; }
      if (e.target.closest("[data-hide-row]")) {
        crmUpdateQuote(quoOpenId, { hiddenRows: [...(quote.hiddenRows || []), row.dataset.key] });
      }
    });
    on(id, "submit", (e) => {
      const form = e.target.closest("[data-project-row-form]");
      if (!form) return;
      e.preventDefault();
      const value = (field) => form.querySelector(`[data-f="${field}"]`).value;
      if (!value("name").trim()) return;
      const quote = crmQuote(quoOpenId);
      const key = form.closest("[data-key]").dataset.key;
      const added = crmAddMaterial(quoOpenId, {
        name: value("name"), quantity: value("quantity"), unit: value("unit"), priceMajor: value("priceMajor"),
      });
      if (!added || !quote) return;
      quoEditingProjectRow = "";
      crmUpdateQuote(quoOpenId, { hiddenRows: [...(quote.hiddenRows || []), key] });
    });
    on(id, "input", quoLineRunningTotal);
  };
  wireProjectRows("quo-material-list");
  wireProjectRows("quo-other-list");
  on("quo-hidden-list", "click", (e) => {
    const row = e.target.closest("[data-key]");
    const quote = crmQuote(quoOpenId);
    if (!row || !quote || !e.target.closest("[data-restore-row]")) return;
    crmUpdateQuote(quoOpenId, { hiddenRows: (quote.hiddenRows || []).filter((key) => key !== row.dataset.key) });
  });
  /* Both lists go through the one line store in assets/crm.js, named by the list, so a
     material line and a labour line cannot drift apart in what they accept. */
  const wireLineList = (list) => {
    const formId = `quo-${list}-form`;
    const listId = list === "materials" ? "quo-own-material-list" : "quo-labour-list";
    on(formId, "submit", (e) => {
      e.preventDefault();
      const name = document.getElementById(`quo-${list}-name`);
      if (!name.value.trim()) return;
      const unit = document.getElementById(`quo-${list}-unit`).value;
      const priceMajor = document.getElementById(`quo-${list}-price`).value;
      // A line saved to Moje materiały is created as an own material first, so the line can
      // carry its ownId and the picker above shows it as "W wycenie" rather than "Dodaj".
      const save = list === "materials" && document.getElementById("quo-materials-save-own");
      const before = crmQuote(quoOpenId);
      const saved = save && save.checked && !quoOwnMaterialMatch(name.value) && typeof omAdd === "function"
        ? omAdd({ name: name.value, application: "OTHER", category: "OTHER", unit, priceMajor,
          currencyCode: (before && before.currencyCode) || crmCurrency() })
        : null;
      const added = crmAddQuoteLine(quoOpenId, list, {
        name: name.value,
        quantity: document.getElementById(`quo-${list}-qty`).value,
        unit,
        priceMajor,
        ownId: saved ? saved.id : undefined,
      });
      if (!added) return;
      e.target.reset();
      // The running total under the form described the line just added; an empty form says nothing.
      quoRunningTotal(list);
      name.focus();
    });
    on(formId, "input", () => quoRunningTotal(list));
    on(listId, "click", (e) => {
      const row = e.target.closest("[data-line]");
      if (!row) return;
      const lineId = row.dataset.line;
      if (e.target.closest("[data-line-edit]")) { quoEditingList = list; quoEditingLine = lineId; quoRender(); return; }
      if (e.target.closest("[data-line-cancel]")) { quoEditingList = ""; quoEditingLine = ""; quoRender(); return; }
      if (e.target.closest("[data-line-del]")) crmDeleteQuoteLine(quoOpenId, list, lineId);
    });
    on(listId, "submit", (e) => {
      const form = e.target.closest("[data-line-form]");
      if (!form) return;
      e.preventDefault();
      const value = (field) => form.querySelector(`[data-f="${field}"]`).value;
      if (!value("name").trim()) return;
      crmUpdateQuoteLine(quoOpenId, list, form.closest("[data-line]").dataset.line, {
        name: value("name"), quantity: value("quantity"), unit: value("unit"), priceMajor: value("priceMajor"),
      });
      quoEditingList = "";
      quoEditingLine = "";
      quoRender();
    });
    on(listId, "input", quoLineRunningTotal);
  };
  wireLineList("materials");
  wireLineList("labour");

  on("quo-own-search", "input", quoFillOwnMaterials);
  on("quo-own-picker-list", "click", (e) => {
    const row = e.target.closest("[data-quo-own-id]");
    if (!row) return;
    const material = quoOwnMaterials().find((m) => m.id === row.dataset.quoOwnId);
    if (!material) return;
    const quote = crmQuote(quoOpenId);
    const linked = quote && Array.isArray(quote.materials)
      ? quote.materials.find((line) => line.ownId === material.id) : null;
    if (e.target.closest("[data-quo-own-remove]")) {
      if (linked) crmDeleteMaterial(quoOpenId, linked.id);
      return;
    }
    if (!e.target.closest("[data-quo-own-add]")) return;
    const quoteCurrency = (quote && quote.currencyCode) || crmCurrency();
    const compatible = material.priceMinor !== null && material.priceMinor !== undefined
      && material.currencyCode === quoteCurrency;
    crmAddMaterial(quoOpenId, {
      name: material.name,
      quantity: row.querySelector("[data-quo-own-qty]").value,
      unit: quoOwnMaterialUnit(material),
      priceMajor: compatible ? quoRateValue(material.priceMinor) : "",
      ownId: material.id,
    });
  });

  on("quo-edit", "click", () => {
    quoEditing = !quoEditing;
    quoAsking = false;
    quoRender();
    if (quoEditing) document.getElementById("quo-edit-name").focus();
  });

  on("quo-edit-form", "submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("quo-edit-name").value.trim();
    if (!name) return;
    crmUpdateQuote(quoOpenId, {
      name,
      note: document.getElementById("quo-edit-note").value,
    });
    quoEditing = false;
    quoRender();
  });

  const cancel = document.querySelector("[data-quo-edit-cancel]");
  if (cancel) cancel.addEventListener("click", () => {
    if (!quoAllowed()) return;
    quoEditing = false;
    quoRender();
  });

  on("quo-delete", "click", () => { quoAsking = true; quoEditing = false; quoRender(); });
  on("quo-delete-no", "click", () => { quoAsking = false; quoRender(); });

  on("quo-delete-yes", "click", () => {
    const q = crmQuote(quoOpenId);
    if (!q) return;
    const token = crmDeleteQuote(quoOpenId);
    quoAsking = false;
    // The name is kept here because the row it came from is a tombstone now, and the
    // strip has to be able to say which quote it is offering back.
    quoUndone = token ? { token, name: q.name, restored: false } : null;
    quoBackToIndex();
  });

  on("quo-project-pick", "change", (e) => { quoChooseProject(e.target.value); });
  on("quo-client-pick", "change", (e) => { quoChooseClient(e.target.value); });

  on("quo-client-new-form", "submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("quo-client-new");
    const row = input && crmAddClient({ name: input.value });
    if (row) { input.value = ""; quoChooseClient(row.id); }
  });

  on("quo-project-new-form", "submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("quo-project-new");
    if (!input || !input.value.trim()) return;
    const project = wsAddProject(input.value);
    if (!project) return;
    const chain = crmChain("quote", quoOpenId);
    if (chain.client) crmLinkProject(chain.client.id, project.id);
    input.value = "";
    quoChooseProject(project.id);
  });

  on("quo-project-list", "click", (e) => {
    if (e.target.closest("[data-unlink]")) crmUpdateQuote(quoOpenId, { projectId: "" });
  });

  on("quo-save-draft", "click", () => {
    clearTimeout(quoMarginTimer);
    const margin = document.getElementById("quo-margin");
    const quote = crmQuote(quoOpenId);
    if (margin) crmUpdateQuote(quoOpenId, { marginMajor: margin.value });
    if (quoEditing) document.getElementById("quo-edit-form").requestSubmit();
    if (quote && !quote.status) crmUpdateQuote(quoOpenId, { status: "draft" });
    document.getElementById("quo-saved").textContent = `${quoT("quo_saved")}.`;
  });

  on("quo-share", "click", async () => {
    const q = crmQuote(quoOpenId);
    const api = window.lmAccount;
    const button = document.getElementById("quo-share");
    const panel = document.getElementById("quo-share-panel");
    const account = document.getElementById("quo-share-account");
    if (!q || !api || !api.uid || typeof api.shareQuote !== "function") {
      if (account) account.hidden = false;
      return;
    }
    const snap = typeof pdfQuoteSnapshot === "function" ? pdfQuoteSnapshot(q.id) : null;
    if (!snap) return;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = quoT("quo_share_busy");
    try {
      const result = await api.shareQuote(q.id, snap);
      const url = typeof result === "string" ? result : result.url;
      const refreshedAt = Number(result && result.refreshedAt) || Date.now();
      const values = {
        number: snap.quote.number,
        company: snap.company.name,
        total: quoMoney(snap.totals.gross, snap.totals.currencyCode),
        link: url,
        valid: snap.quote.validUntil ? quoShareFormat(quoT("quo_share_valid"), {
          date: new Date(`${snap.quote.validUntil}T12:00:00`).toLocaleDateString(quoLang()),
        }) : "",
      };
      const subject = quoShareFormat(quoT("quo_share_subject"), values);
      const message = quoShareFormat(quoT("quo_share_msg"), values);
      const phone = quoSharePhone(snap.client && snap.client.phone);
      document.getElementById("quo-share-url").value = url;
      const to = snap.client && snap.client.email;
      const mailto = quoShareMailto(to, subject, message);
      document.getElementById("quo-share-email").href = mailto;
      document.getElementById("quo-share-mailto").href = mailto;
      document.getElementById("quo-share-gmail").href = quoShareGmail(to, subject, message);
      document.getElementById("quo-share-outlook").href = quoShareOutlook(to, subject, message);
      document.getElementById("quo-share-copy-msg").dataset.message = message;
      document.getElementById("quo-share-mail").hidden = true;
      document.getElementById("quo-share-email").setAttribute("aria-expanded", "false");
      document.getElementById("quo-share-wa").href = quoShareWhatsApp(phone, message);
      document.getElementById("quo-share-sms").href = quoShareSms(phone, message);
      const system = document.getElementById("quo-share-system");
      system.hidden = typeof navigator.share !== "function";
      system.onclick = () => navigator.share({
        title: subject,
        text: message.replace(url, "").trim(),
        url,
      }).catch(() => {});
      document.querySelector("#quo-share-panel .quo-share-link").hidden = false;
      document.querySelector("#quo-share-panel .quo-share-actions").hidden = false;
      document.getElementById("quo-share-note").textContent = quoShareFormat(
        quoT("quo_share_stamp"), { date: new Date(refreshedAt).toLocaleString(quoLang()) });
      panel.hidden = false;
    } catch (e) {
      document.getElementById("quo-share-note").textContent =
        quoT(e && e.code === "timeout" ? "err_timeout" : "quo_share_failed");
      panel.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });

  on("quo-share-email", "click", (e) => {
    // A phone has a mail app behind mailto:, so the link simply opens it there.
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    const row = document.getElementById("quo-share-mail");
    row.hidden = !row.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!row.hidden));
  });

  on("quo-share-copy-msg", "click", async (e) => {
    const button = e.currentTarget;
    const label = quoT("quo_share_copy_msg");
    try { await navigator.clipboard.writeText(button.dataset.message || ""); } catch (err) { return; }
    button.textContent = quoT("quo_share_copied");
    setTimeout(() => { button.textContent = label; }, 2000);
  });

  on("quo-share-copy", "click", async () => {
    const input = document.getElementById("quo-share-url");
    const button = document.getElementById("quo-share-copy");
    const label = button.textContent;
    try { await navigator.clipboard.writeText(input.value); }
    catch (e) { input.select(); document.execCommand("copy"); }
    button.textContent = quoT("quo_share_copied");
    setTimeout(() => { button.textContent = label; }, 2000);
  });

  on("quo-share-off", "click", async () => {
    if (!window.lmAccount || typeof window.lmAccount.unshareQuote !== "function") return;
    try {
      await window.lmAccount.unshareQuote(quoOpenId);
      document.getElementById("quo-share-url").value = "";
      document.querySelector("#quo-share-panel .quo-share-link").hidden = true;
      document.querySelector("#quo-share-panel .quo-share-actions").hidden = true;
      document.getElementById("quo-share-mail").hidden = true;
      document.getElementById("quo-share-note").textContent = quoT("quo_share_off_done");
    } catch (e) {
      document.getElementById("quo-share-note").textContent =
        quoT(e && e.code === "timeout" ? "err_timeout" : "quo_share_failed");
    }
  });

  on("quo-csv", "click", () => {
    const quote = crmQuote(quoOpenId);
    const lines = crmQuoteLines(quote);
    const rows = [...lines.projectRows.filter((row) => !row.hidden), ...lines.ownMaterials.map((line) => ({
      name: line.name, quantity: line.quantity, unit: line.unit, minor: line.amountMinor,
    })), ...lines.labour.map((line) => ({ name: line.name, quantity: line.quantity, unit: line.unit, minor: line.amountMinor }))];
    const csv = [quoT("quo_csv_head").split("|"), ...rows.map((row, i) => [i + 1, row.name, row.quantity == null ? "" : row.quantity, row.unit || "", row.quantity ? (row.minor / row.quantity / 100) : row.minor / 100, row.minor / 100])]
      .map((row) => row.map((value) => `"${quoCsvCell(value)}"`).join(";")).join("\r\n");
    quoDownload(quoFileName(quote.number || quote.name, "wycena", "csv"),
      "text/csv;charset=utf-8", `\ufeff${csv}`);
  });
}

function buildQuotesPage() {
  const page = document.getElementById("quo-page");
  if (!page) return;

  document.getElementById("quo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("quo-name");
    const project = document.getElementById("quo-project");
    // The wall normally means this form is not on the screen. The check is here as well,
    // because a form that is only hidden still submits.
    if (!name.value.trim() || !quoAllowed()) return;
    quoUndone = null; // a new quote is a new subject; the old undo is stale
    const quote = crmAddQuote({ name: name.value, projectId: project.value });
    if (quote) location.href = `${location.pathname}?id=${encodeURIComponent(quote.id)}`;
    else document.getElementById("quo-add-message").textContent = quoT("quo_save_failed");
  });

  // Owner, 2026-10-01: a quote could be deleted only from inside it. The list offers it per
  // row; the same undo strip as the editor's delete gives it back.
  document.getElementById("quo-list").addEventListener("click", (e) => {
    const button = e.target.closest("[data-quote-delete]");
    const row = e.target.closest("li[data-id]");
    if (!button || !row || !quoAllowed()) return;
    const q = crmQuote(row.dataset.id);
    if (!q) return;
    const token = crmDeleteQuote(q.id);
    quoUndone = token ? { token, name: q.name, restored: false } : null;
    quoRender();
  });

  document.getElementById("quo-list").addEventListener("change", (e) => {
    const select = e.target.closest("[data-quote-status]");
    const row = e.target.closest("li[data-id]");
    if (!select || !row || !quoAllowed()) return;
    const id = row.dataset.id;
    crmUpdateQuote(id, { status: select.value });
    const fresh = document.querySelector(`#quo-list li[data-id="${CSS.escape(id)}"] [data-quote-status]`);
    if (fresh) fresh.focus();
  });

  document.getElementById("quo-undo-go").addEventListener("click", () => {
    if (!quoUndone || !quoAllowed()) return;
    const back = crmRestoreQuote(quoUndone.token);
    quoUndone = back ? { token: quoUndone.token, name: back.name, restored: true } : null;
    quoRender();
  });

  wireQuoteDetail();

  document.addEventListener("crmchange", quoRender);
  // A material re-priced or a project renamed on another page moves the figures here.
  document.addEventListener("workspacechange", quoRender);
  document.addEventListener("ownmaterialschange", quoRender);
  // A quote with no money of its own falls back to the visitor's currency, so a switch
  // has to redraw.
  document.addEventListener("currencychange", quoRender);
  // Signing in or out on /app/ moves the level; the preview switch moves the wall. Both
  // are wired here, once, by assets/paywall.js.
  pwMount("quo", "quotes");
  /* And the page is drawn again for the level it has just become. pwMount() puts the wall
     back up, which hides #quo-tool; the figures written into it while the account was Pro
     would still be inside it. quoRender() empties them — see quoClear(). */
  document.addEventListener("lm-session", quoRender);
  document.addEventListener("lm-account-ready", quoRender);
  // Back after opening a quote: the page never reloaded, so nothing else would notice.
  window.addEventListener("popstate", quoRender);

  quoRender();
  document.documentElement.setAttribute("data-quotes-ready", "1");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildQuotesPage);
} else {
  buildQuotesPage();
}
