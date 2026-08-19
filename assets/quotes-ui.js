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
const quoPlain = (n) => (n === null || n === undefined || n === "" ? "" : String(n));

/** Money through the workspace's own formatter, so a quote reads like a project. */
const quoMoney = (minor, code) =>
  (typeof wsMoney === "function" ? wsMoney(minor, code) : `${(Number(minor) / 100).toFixed(2)}`);

/** A rate as a field value: whole minor units, which is the smallest money there is. */
const quoRateValue = (minor) => (minor === null ? "" : String(Math.round(minor) / 100));

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
/** Which labour line is open for correction, if any. */
let quoEditingLine = "";
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

/* ------------------------------------------------------------------ the index */

/**
 * One row of the index: the name, the project it prices, and the sum.
 *
 * The sum is crmQuoteTotals() rather than a stored figure, which is the whole point of the
 * module — a material re-priced on the project screen moves this number with no write.
 */
function quoRow(q) {
  const totals = crmQuoteTotals(q.id);
  const project = q.projectId && typeof wsProject === "function" ? wsProject(q.projectId) : null;
  const where = project ? `${quoEsc(project.name)} · ` : "";
  return `<li data-id="${quoEsc(q.id)}">
      <span class="row-name">
        <a href="?id=${encodeURIComponent(q.id)}" data-open><b>${quoEsc(q.name)}</b></a>
        <em class="muted">${where}${quoEsc(quoMoney(totals.total, totals.currencyCode))}</em>
      </span>
      <span class="row-actions"></span>
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

/**
 * Chapter XXIV's path, read backwards: this quote → its project → the job that project is
 * being done under → the client it is filed with. Every step is derived (crmQuoteChain()),
 * so a client renamed on their own page reads correctly here on the next redraw.
 */
function quoRenderChain(q) {
  // Session 26 draws it with the strip assets/crm-chain.js gives every CRM screen, in
  // place of the client → job line session 24 wrote here: the same four nodes in the
  // chapter's own order, and a step nobody has filled in linking to the page that would
  // fill it — which for a quote with no project is the way to give it one.
  chnRenderStrip(document.getElementById("quo-chain-line"), crmChain("quote", q.id), "quote");
}

/** One labour line as it reads: the work, how much of it, at what rate, and the amount. */
function quoLabourRow(line) {
  // The rate is the amount divided by the quantity — the same rule a material's unit price
  // follows, and for the same reason: one stored figure cannot contradict another.
  const rate = crmLabourRate(line);
  const code = crmQuote(quoOpenId).currencyCode || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  const how = line.quantity === null
    ? `<em class="muted">${quoEsc(quoT("quo_lump"))}</em>`
    : `<b>${quoNum(line.quantity)} ${quoEsc(line.unit)}</b>`;
  const at = rate !== null
    ? `<em class="muted ws-mat-price">× ${quoEsc(quoMoney(Math.round(rate), code))}</em>` : "";
  const amount = line.amountMinor > 0
    ? `<em class="muted">${rate !== null ? "= " : ""}${quoEsc(quoMoney(line.amountMinor, code))}</em>` : "";
  return `<li class="ws-mat" data-line="${quoEsc(line.id)}">
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
function quoLabourForm(line) {
  const q = crmQuote(quoOpenId);
  const code = (q && q.currencyCode) || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  return `<li class="ws-mat ws-editing" data-line="${quoEsc(line.id)}">
      <form class="ws-mat-edit" data-line-form>
        <p class="ws-mat-grid">
          <label class="ws-mat-f">
            <span class="ws-bar-label">${quoEsc(quoT("quo_labour_name"))}</span>
            <input type="text" maxlength="120" data-f="name" value="${quoEsc(line.name)}" required>
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${quoEsc(quoT("quo_labour_qty"))}</span>
            <input type="text" inputmode="decimal" data-f="quantity" value="${quoEsc(quoPlain(line.quantity))}">
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${quoEsc(quoT("quo_labour_unit"))}</span>
            <input type="text" maxlength="24" data-f="unit" value="${quoEsc(line.unit)}">
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${quoEsc(quoT("quo_labour_price"))} (${quoEsc(code)})</span>
            <input type="text" inputmode="decimal" data-f="priceMajor" value="${quoEsc(quoRateValue(crmLabourRate(line)))}">
          </label>
        </p>
        <p class="ws-mat-sum" data-line-sum aria-live="polite"></p>
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
    ? lines.map((l) => (l.id === quoEditingLine ? quoLabourForm(l) : quoLabourRow(l))).join("")
    : `<li class="empty muted">${quoEsc(quoT("quo_labour_empty"))}</li>`;

  // The add form goes away when the quote is full rather than refusing a submit nobody
  // could have predicted.
  const full = lines.length >= QUO_MAX_LINES;
  const form = document.getElementById("quo-labour-form");
  const note = document.getElementById("quo-labour-full");
  if (form) form.hidden = full;
  if (note) note.hidden = !full;
  quoRunningTotal();
}

/** "40 × 80 = 3200" under the add form, as the fields are typed. */
function quoRunningTotal() {
  const out = document.getElementById("quo-labour-run");
  if (!out) return;
  const qty = document.getElementById("quo-labour-qty");
  const price = document.getElementById("quo-labour-price");
  if (!qty || !price || !price.value.trim()) { out.textContent = ""; return; }
  const q = crmQuote(quoOpenId);
  const code = (q && q.currencyCode) || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
  const n = crmQty(qty.value);
  const amount = crmLineAmount(price.value, n);
  out.textContent = `${n === null ? "1" : quoNum(n)} × ${quoMoney(crmMinor(price.value) || 0, code)} = ${quoMoney(amount, code)}`;
}

/** The one link the quote stores, and the picker that sets it. */
function quoRenderProject(q) {
  const list = document.getElementById("quo-project-list");
  if (!list) return;
  const project = q.projectId && typeof wsProject === "function" ? wsProject(q.projectId) : null;
  if (project) {
    const costs = wsProjectCosts(project.id);
    const money = costs.total ? quoEsc(quoMoney(costs.total, costs.currencyCode)) : "";
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

  const form = document.getElementById("quo-project-form");
  const pick = document.getElementById("quo-project-pick");
  if (!form || !pick) return;
  // Every project is offered, including one another quote already prices: two prices for
  // one project is a variant, not a contradiction.
  const free = (typeof wsProjects === "function" ? wsProjects() : [])
    .filter((p) => p.id !== q.projectId);
  pick.innerHTML = free
    .map((p) => `<option value="${quoEsc(p.id)}">${quoEsc(p.name)}</option>`).join("");
  form.hidden = free.length === 0;
  let none = document.getElementById("quo-project-free-none");
  if (!none) {
    none = document.createElement("p");
    none.id = "quo-project-free-none";
    none.className = "muted";
    form.parentNode.insertBefore(none, form);
  }
  none.textContent = quoT("quo_project_free_none");
  none.hidden = free.length > 0 || Boolean(project);
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

  quoRenderChain(q);

  // Chapter XXII's five figures. Three of them are the project's own money, read through
  // wsProjectCosts() rather than copied, so this page and the project screen can never
  // disagree about what the work costs.
  const money = crmQuoteTotals(id);
  const fig = (el, minor) => {
    const node = document.getElementById(el);
    if (node) node.textContent = quoMoney(minor, money.currencyCode);
  };
  fig("quo-fig-materials", money.materials);
  fig("quo-fig-other", money.other);
  fig("quo-fig-labour", money.labour);
  fig("quo-fig-sub", money.subtotal);
  fig("quo-fig-margin", money.margin);
  fig("quo-fig-total", money.total);
  document.getElementById("quo-mixed").hidden = !money.mixed;

  const margin = document.getElementById("quo-margin");
  // Never overwritten while it has the focus: the visitor is typing into it.
  if (margin && document.activeElement !== margin) {
    margin.value = money.marginPct ? String(money.marginPct) : "";
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
}

/* ------------------------------------------------------------------ the switch */

/** Show the screen the address bar asks for, and fill it. */
function quoRender() {
  const detail = document.getElementById("quo-detail");
  if (!detail) return;
  const was = quoOpenId;
  quoOpenId = quoUrlId();
  // A half-finished edit belongs to the quote it was opened on. Leaving ends it.
  if (quoOpenId !== was) { quoEditing = false; quoAsking = false; quoEditingLine = ""; }
  const index = document.getElementById("quo-index");

  detail.hidden = !quoOpenId;
  index.hidden = Boolean(quoOpenId);

  quoRenderPro();

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
  const on = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  // Chapter XXII's margin: one field on the page, because it is the number a tradesman
  // moves while watching the total.
  on("quo-margin", "change", (e) => { crmUpdateQuote(quoOpenId, { marginMajor: e.target.value }); });

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
  if (cancel) cancel.addEventListener("click", () => { quoEditing = false; quoRender(); });

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

  on("quo-labour-form", "submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("quo-labour-name");
    if (!name.value.trim()) return;
    crmAddLabour(quoOpenId, {
      name: name.value,
      quantity: document.getElementById("quo-labour-qty").value,
      unit: document.getElementById("quo-labour-unit").value,
      priceMajor: document.getElementById("quo-labour-price").value,
    });
    name.value = "";
    document.getElementById("quo-labour-qty").value = "";
    document.getElementById("quo-labour-unit").value = "";
    document.getElementById("quo-labour-price").value = "";
    name.focus();
  });

  on("quo-labour-form", "input", quoRunningTotal);

  on("quo-labour-list", "click", (e) => {
    const row = e.target.closest("[data-line]");
    if (!row) return;
    const lineId = row.getAttribute("data-line");
    if (e.target.closest("[data-line-edit]")) { quoEditingLine = lineId; quoRender(); return; }
    if (e.target.closest("[data-line-cancel]")) { quoEditingLine = ""; quoRender(); return; }
    if (e.target.closest("[data-line-del]")) { crmDeleteLabour(quoOpenId, lineId); }
  });

  on("quo-labour-list", "submit", (e) => {
    const form = e.target.closest("[data-line-form]");
    if (!form) return;
    e.preventDefault();
    const row = form.closest("[data-line]");
    const value = (f) => form.querySelector(`[data-f="${f}"]`).value;
    if (!value("name").trim()) return;
    crmUpdateLabour(quoOpenId, row.getAttribute("data-line"), {
      name: value("name"),
      quantity: value("quantity"),
      unit: value("unit"),
      priceMajor: value("priceMajor"),
    });
    quoEditingLine = "";
    quoRender();
  });

  // The same "quantity × rate = amount" line inside an open row, as it is typed.
  on("quo-labour-list", "input", (e) => {
    const form = e.target.closest("[data-line-form]");
    if (!form) return;
    const out = form.querySelector("[data-line-sum]");
    if (!out) return;
    const q = crmQuote(quoOpenId);
    const code = (q && q.currencyCode) || (typeof wsCurrency === "function" ? wsCurrency() : "PLN");
    const price = form.querySelector('[data-f="priceMajor"]').value;
    if (!String(price).trim()) { out.textContent = ""; return; }
    const n = crmQty(form.querySelector('[data-f="quantity"]').value);
    out.textContent = `${n === null ? "1" : quoNum(n)} × ${quoMoney(crmMinor(price) || 0, code)} = ${
      quoMoney(crmLineAmount(price, n), code)}`;
  });

  on("quo-project-form", "submit", (e) => {
    e.preventDefault();
    const pick = document.getElementById("quo-project-pick");
    if (!pick || !pick.value) return;
    crmUpdateQuote(quoOpenId, { projectId: pick.value });
  });

  on("quo-project-list", "click", (e) => {
    if (e.target.closest("[data-unlink]")) crmUpdateQuote(quoOpenId, { projectId: "" });
  });
}

function buildQuotesPage() {
  const page = document.getElementById("quo-page");
  if (!page) return;

  document.getElementById("quo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("quo-name");
    const project = document.getElementById("quo-project");
    if (!name.value.trim()) return;
    quoUndone = null; // a new quote is a new subject; the old undo is stale
    crmAddQuote({ name: name.value, projectId: project.value });
    name.value = "";
    name.focus();
  });

  document.getElementById("quo-undo-go").addEventListener("click", () => {
    if (!quoUndone) return;
    const back = crmRestoreQuote(quoUndone.token);
    quoUndone = back ? { token: quoUndone.token, name: back.name, restored: true } : null;
    quoRender();
  });

  wireQuoteDetail();

  document.addEventListener("crmchange", quoRender);
  // A material re-priced or a project renamed on another page moves the figures here.
  document.addEventListener("workspacechange", quoRender);
  // A quote with no money of its own falls back to the visitor's currency, so a switch
  // has to redraw.
  document.addEventListener("currencychange", quoRender);
  // Signing in or out on /app/ moves the level; the preview switch moves the wall. Both
  // are wired here, once, by assets/paywall.js.
  pwMount("quo", "quotes");
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
