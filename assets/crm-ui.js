/* LiczMat website — /klienci/ in the browser. Session 22, chapter XX.
 *
 * One page, two screens, the same shape as /projekty/:
 *
 *   /klienci/           the index: the clients, and the archive
 *   /klienci/?id=<id>   one client — contact details, notes, projects, history
 *
 * A client's name in the index is a real <a href="?id=…">, so opening one is an ordinary
 * navigation: the back button works and a link can be copied without any history code
 * here. The one exception is deleting from the detail, which puts the index back with
 * `replaceState` so the "undo" the delete just offered survives.
 *
 * The store is assets/crm.js — localStorage, this browser only, nothing uploaded. The
 * projects it links to are the free workspace's own rows (assets/workspace.js), read here
 * and never written: nothing on this page can rename, archive or delete a project.
 *
 * Chapter XXV lives at the top of the page: the module says it is LiczMat Pro on every
 * visit. Whether that notice *replaces* the module is lmFeatureState() in assets/plan.js
 * — LM_PRO_LOCKED, false until session 27 builds the paywall, because nothing grants Pro
 * yet and a lock today would close the module to every account there is.
 */

const crmT = (key) => (typeof t === "function" ? t(key) : key);
const crmLang = () => document.documentElement.lang || "pl";
const crmEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const crmNum = (v) => new Intl.NumberFormat(crmLang(), { maximumFractionDigits: 2 }).format(v);

const crmDate = (ms) => {
  const at = Number(ms);
  if (!isFinite(at) || at <= 0) return "";
  return new Date(at).toLocaleDateString(crmLang(), { day: "numeric", month: "short", year: "numeric" });
};

/** Money through the workspace's own formatter, so a client reads like a project. */
const crmMoney = (minor, code) =>
  (typeof wsMoney === "function" ? wsMoney(minor, code) : `${(Number(minor) / 100).toFixed(2)}`);

/** The client the address bar is asking for, or "" for the index. */
const crmUrlId = () => {
  try { return new URLSearchParams(location.search).get("id") || ""; } catch (e) { return ""; }
};

/** The index's own address, without the query that opens a client. */
const crmIndexUrl = () => location.pathname;

/** The client the page is currently showing. Set once per render pass. */
let crmOpenId = "";
/** Whether the edit form and the delete question are open, so a redraw keeps them. */
let crmEditing = false;
let crmAsking = false;
/** The last delete, until the visitor undoes it or moves on. */
let crmUndone = null;

/* ------------------------------------------------------------------ the Pro notice */

/**
 * What this browser was last told about the session.
 *
 * `liczmat-signed-in` is a copy hint and can be stale (assets/account.js says so), which
 * is exactly why the notice it drives only *words* the page. Nothing on /klienci/ reads
 * it before saving, and the client rows belong to whoever is sitting at this browser —
 * gating a local list on a stale hint would hide somebody's own clients from them.
 */
const crmLevel = () => (typeof lmReadLevel === "function" ? lmReadLevel() : "guest");

/** The state of the "clients" feature for this visitor: allowed, gated, or locked out. */
function crmState() {
  if (typeof lmFeatureState === "function") return lmFeatureState("clients", crmLevel());
  return { allowed: true, gated: false, locked: false, feature: null };
}

/** Chapter XXV's block at the top of the page, and — when locked — instead of it. */
function crmRenderPro() {
  const state = crmState();
  const chip = document.getElementById("crm-pro-chip");
  const note = document.getElementById("crm-pro-note");
  if (chip) {
    chip.textContent = state.allowed ? crmT("cli_pro_yours") : crmT("pro_locked");
    chip.classList.toggle("on", state.allowed);
  }
  // A Pro account is told which plan it is on and nothing else; the sentence about the
  // module being open is only true, and only useful, for somebody who is not on Pro.
  if (note) note.hidden = state.allowed || state.locked;
  const gate = document.getElementById("crm-gate");
  const tool = document.getElementById("crm-tool");
  if (gate) gate.hidden = !state.locked;
  if (tool) tool.hidden = state.locked;
}

/* ------------------------------------------------------------------ the index */

/** One row of either list: the name opens the client, the meta says what is behind it. */
function crmClientRow(c) {
  const costs = crmClientCosts(c.id);
  const money = costs.total ? ` · ${crmEsc(crmMoney(costs.total, costs.currencyCode))}` : "";
  const mixed = costs.mixed
    ? ` <span class="chip warn" title="${crmEsc(crmT("ws_mixed_currency"))}">${crmEsc(crmT("dash_mixed"))}</span>`
    : "";
  // The contact line is what a phone-shaped list is for: the number is the reason to open
  // the page at all, so it is on the row rather than one navigation away.
  const contact = [c.phone, c.email].filter(Boolean).join(" · ");
  return `<li data-id="${crmEsc(c.id)}">
      <span class="row-name">
        <a href="?id=${encodeURIComponent(c.id)}" data-open><b>${crmEsc(c.name)}</b></a>
        <em class="muted">${contact ? `${crmEsc(contact)} · ` : ""}${crmT("cli_fig_projects")}: ${
    costs.projects}${money} · ${crmEsc(crmDate(crmClientLastAt(c.id)))}${mixed}</em>
      </span>
      <span class="row-actions">
        ${c.archived
          ? `<button type="button" class="btn btn-ghost btn-sm" data-unarchive>${crmEsc(crmT("cli_archive_undo"))}</button>`
          : ""}
      </span>
    </li>`;
}

function crmRenderClients() {
  const list = document.getElementById("crm-client-list");
  if (!list) return;
  const clients = crmClients();
  list.innerHTML = clients.length
    ? clients.map((c) => crmClientRow(c)).join("")
    : `<li class="empty muted">${crmEsc(crmT("cli_empty"))}</li>`;

  // The archive is absent entirely while it is empty: a disclosure with nothing behind it
  // is a control that lies about having content.
  const box = document.getElementById("crm-archive");
  if (!box) return;
  const archived = crmArchivedClients();
  box.hidden = archived.length === 0;
  if (!archived.length) return;
  document.getElementById("crm-archive-summary").textContent =
    `${crmT("cli_archive_t")} (${archived.length})`;
  document.getElementById("crm-archive-list").innerHTML =
    archived.map((c) => crmClientRow(c)).join("");
}

/** The strip that offers the last delete back. Hidden the moment there is nothing to undo. */
function crmRenderUndo() {
  const strip = document.getElementById("crm-undo");
  if (!strip) return;
  strip.hidden = !crmUndone;
  if (!crmUndone) return;
  document.getElementById("crm-undo-text").textContent =
    `${crmT(crmUndone.restored ? "cli_restored" : "cli_deleted")} ${crmUndone.name}`;
  document.getElementById("crm-undo-go").hidden = Boolean(crmUndone.restored);
}

/* ------------------------------------------------------------------ one client */

/** The breadcrumb gains the client; the trail is server-rendered for the index only. */
function crmCrumb(name) {
  const ol = document.querySelector(".breadcrumbs ol");
  if (!ol) return;
  const extra = ol.querySelector("[data-crm-crumb]");
  if (!name) {
    if (extra) extra.remove();
    const last = ol.lastElementChild;
    if (last) last.removeAttribute("hidden");
    return;
  }
  const li = extra || document.createElement("li");
  li.setAttribute("data-crm-crumb", "1");
  li.textContent = name;
  if (!extra) ol.appendChild(li);
}

/** Chapter XX's contact details: a number that dials, an address that can be read. */
function crmRenderContact(c) {
  const box = document.getElementById("crm-contact");
  if (!box) return;
  const parts = [];
  if (c.phone) {
    // tel: wants the number without the spaces a person types it with.
    parts.push(`<a href="tel:${crmEsc(c.phone.replace(/[^+0-9]/g, ""))}">${crmEsc(c.phone)}</a>`);
  }
  if (c.email) parts.push(`<a href="mailto:${crmEsc(c.email)}">${crmEsc(c.email)}</a>`);
  if (c.address) parts.push(`<span>${crmEsc(c.address)}</span>`);
  box.innerHTML = parts.length
    ? parts.join(' <span class="muted">·</span> ')
    : `<span class="muted">${crmEsc(crmT("cli_contact_none"))}</span>`;
}

/** The client's projects, each with what it has cost so far. */
function crmRenderProjects(id) {
  const list = document.getElementById("crm-client-projects");
  if (!list) return;
  const projects = crmClientProjects(id);
  list.innerHTML = projects.length ? projects.map((p) => {
    const costs = wsProjectCosts(p.id);
    const money = costs.total ? ` · ${crmEsc(crmMoney(costs.total, costs.currencyCode))}` : "";
    const url = (window.LM_CRM && window.LM_CRM.projects) || "/projekty/";
    return `<li data-id="${crmEsc(p.id)}">
        <span class="row-name">
          <a href="${crmEsc(url)}?id=${encodeURIComponent(p.id)}"><b>${crmEsc(p.name)}</b></a>
          <em class="muted">${crmEsc(crmDate(p.updatedAt))}${money}</em>
        </span>
        <span class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-unlink>${crmEsc(crmT("cli_unlink"))}</button>
        </span>
      </li>`;
  }).join("") : `<li class="empty muted">${crmEsc(crmT("cli_projects_empty"))}</li>`;

  // The picker offers the projects nobody has filed yet. With none left it says so and
  // the form goes away rather than standing there with an empty dropdown.
  const form = document.getElementById("crm-project-form");
  const pick = document.getElementById("crm-project-pick");
  if (!form || !pick) return;
  const free = crmFreeProjects();
  pick.innerHTML = free
    .map((p) => `<option value="${crmEsc(p.id)}">${crmEsc(p.name)}</option>`).join("");
  form.hidden = free.length === 0;
  let none = document.getElementById("crm-project-none");
  if (!none) {
    none = document.createElement("p");
    none.id = "crm-project-none";
    none.className = "muted";
    form.parentNode.insertBefore(none, form);
  }
  none.textContent = crmT("cli_project_none");
  none.hidden = free.length > 0;
}

/**
 * Chapter XX: "Klient może posiadać … zlecenia" — the client's end of the link session 23
 * put on the job.
 *
 * Read-only on purpose: the job is written on /zlecenia/, and one screen owning the writes
 * is what keeps a status from being set in two places with two different rules. The row
 * says what the index of that page says — the status, the date and what was agreed — so a
 * client's page answers "where does this stand" without a navigation.
 */
function crmRenderJobs(id) {
  const list = document.getElementById("crm-client-jobs");
  if (!list) return;
  if (typeof crmClientJobs !== "function") { list.innerHTML = ""; return; }
  const jobs = crmClientJobs(id);
  const url = (window.LM_CRM && window.LM_CRM.jobs) || "/zlecenia/";
  list.innerHTML = jobs.length ? jobs.map((j) => {
    const money = j.valueMinor === null || j.valueMinor === undefined
      ? "" : ` · ${crmEsc(crmMoney(j.valueMinor, j.currencyCode))}`;
    const due = j.dueDate ? ` · ${crmEsc(crmDate(new Date(`${j.dueDate}T00:00:00`).getTime()))}` : "";
    return `<li data-id="${crmEsc(j.id)}">
        <span class="row-name">
          <a href="${crmEsc(url)}?id=${encodeURIComponent(j.id)}"><b>${crmEsc(j.name)}</b></a>
          <em class="muted"><span class="chip job-chip">${
      crmEsc(crmT(`job_st_${j.status}`))}</span>${due}${money}</em>
        </span>
      </li>`;
  }).join("") : `<li class="empty muted">${crmEsc(crmT("cli_jobs_empty"))}</li>`;
}

/**
 * Chapter XX's history: the calculations saved into this client's projects.
 *
 * The line carries its own name, how much was needed, the unit and the currency it was
 * saved in (session 16), so the row is read straight off the document — no engine is
 * loaded here and no number is recomputed.
 */
function crmRenderHistory(id) {
  const list = document.getElementById("crm-history");
  if (!list) return;
  const rows = crmClientHistory(id, 12);
  list.innerHTML = rows.length ? rows.map(({ line, project }) => {
    const amount = line.requiredUnits
      ? `${crmNum(line.requiredUnits)} ${crmEsc(line.unitLabel || "")}`.trim() : "";
    const money = line.totalCostMinor
      ? ` · ${crmEsc(crmMoney(line.totalCostMinor, line.currencyCode))}` : "";
    return `<li>
        <span class="row-name">
          <b>${crmEsc(line.name)}</b>
          <em class="muted">${crmEsc(project.name)} · ${amount}${money} · ${
      crmEsc(crmDate(line.createdAt))}</em>
        </span>
      </li>`;
  }).join("") : `<li class="empty muted">${crmEsc(crmT("cli_hist_empty"))}</li>`;
}

/** The whole detail screen for one client. */
function crmRenderClient(id) {
  const client = crmClient(id);
  const missing = document.getElementById("crm-client-missing");
  const body = document.getElementById("crm-client-body");
  const title = document.getElementById("crm-title");
  const lead = document.getElementById("crm-lead");

  if (!client) {
    missing.hidden = false;
    body.hidden = true;
    title.textContent = crmT("cli_none_t");
    lead.hidden = true;
    crmCrumb(crmT("cli_none_t"));
    return;
  }

  missing.hidden = true;
  body.hidden = false;
  title.textContent = client.name;
  lead.hidden = true;
  crmCrumb(client.name);

  crmRenderContact(client);

  const costs = crmClientCosts(id);
  document.getElementById("crm-fig-projects").textContent = String(costs.projects);
  document.getElementById("crm-fig-last").textContent = crmDate(crmClientLastAt(id));
  document.getElementById("crm-fig-total").textContent = crmMoney(costs.total, costs.currencyCode);
  document.getElementById("crm-mixed").hidden = !costs.mixed;

  const note = document.getElementById("crm-note");
  note.textContent = client.note || crmT("cli_note_empty");
  note.classList.toggle("muted", !client.note);

  const archive = document.getElementById("crm-client-archive");
  archive.textContent = crmT(client.archived ? "cli_archive_undo" : "cli_archive_do");

  const form = document.getElementById("crm-edit-form");
  form.hidden = !crmEditing;
  if (crmEditing) {
    // Filled from the store on every redraw *except* while the visitor is typing into it:
    // a `crmchange` from another tab would otherwise wipe half-finished edits.
    if (!form.dataset.filled) {
      document.getElementById("crm-edit-name").value = client.name;
      document.getElementById("crm-edit-phone").value = client.phone || "";
      document.getElementById("crm-edit-email").value = client.email || "";
      document.getElementById("crm-edit-address").value = client.address || "";
      document.getElementById("crm-edit-note").value = client.note || "";
      form.dataset.filled = "1";
    }
  } else {
    delete form.dataset.filled;
  }

  const ask = document.getElementById("crm-delete-ask");
  ask.hidden = !crmAsking;
  document.getElementById("crm-delete-q").textContent = crmT("cli_delete_q");

  crmRenderProjects(id);
  crmRenderJobs(id);
  crmRenderHistory(id);
}

/* ------------------------------------------------------------------ the switch */

/** Show the screen the address bar asks for, and fill it. */
function crmRender() {
  const detail = document.getElementById("crm-client");
  if (!detail) return;
  const was = crmOpenId;
  crmOpenId = crmUrlId();
  // A half-finished edit belongs to the client it was opened on. Leaving ends it.
  if (crmOpenId !== was) { crmEditing = false; crmAsking = false; }
  const index = document.getElementById("crm-index");

  detail.hidden = !crmOpenId;
  index.hidden = Boolean(crmOpenId);

  crmRenderPro();

  // Opening and closing a client changes the address without a reload, and the language
  // links carry that address so a switch of language keeps the client on screen.
  if (typeof keepQueryOnLangLinks === "function") keepQueryOnLangLinks();

  if (crmOpenId) {
    crmUndone = null; // opening a client is moving on; the strip has had its say
    crmRenderClient(crmOpenId);
    return;
  }

  document.getElementById("crm-title").textContent = crmT("clipage_title");
  const lead = document.getElementById("crm-lead");
  lead.textContent = crmT("clipage_lead");
  lead.hidden = false;
  crmCrumb("");
  crmRenderUndo();
  crmRenderClients();
}

/** Leave the detail without a reload, so an undo offered by a delete survives. */
function crmBackToIndex() {
  try { history.replaceState({}, "", crmIndexUrl()); } catch (e) {}
  crmRender();
}

/* ------------------------------------------------------------------ wiring */

function wireClientDetail() {
  const on = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  on("crm-client-edit", "click", () => {
    crmEditing = !crmEditing;
    crmAsking = false;
    crmRender();
    if (crmEditing) document.getElementById("crm-edit-name").focus();
  });

  on("crm-edit-form", "submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("crm-edit-name").value.trim();
    if (!name) return;
    crmUpdateClient(crmOpenId, {
      name,
      phone: document.getElementById("crm-edit-phone").value,
      email: document.getElementById("crm-edit-email").value,
      address: document.getElementById("crm-edit-address").value,
      note: document.getElementById("crm-edit-note").value,
    });
    crmEditing = false;
    crmRender();
  });

  const cancel = document.querySelector("[data-crm-edit-cancel]");
  if (cancel) {
    cancel.addEventListener("click", () => { crmEditing = false; crmRender(); });
  }

  on("crm-client-archive", "click", () => {
    const client = crmClient(crmOpenId);
    if (!client) return;
    crmArchiveClient(crmOpenId, !client.archived);
  });

  on("crm-client-delete", "click", () => {
    crmAsking = true;
    crmEditing = false;
    crmRender();
  });
  on("crm-delete-no", "click", () => { crmAsking = false; crmRender(); });

  on("crm-delete-yes", "click", () => {
    const client = crmClient(crmOpenId);
    if (!client) return;
    const token = crmDeleteClient(crmOpenId);
    crmAsking = false;
    // The name is kept here because the row it came from is a tombstone now, and the
    // strip has to be able to say which client it is offering back.
    crmUndone = token ? { token, name: client.name, restored: false } : null;
    crmBackToIndex();
  });

  on("crm-project-form", "submit", (e) => {
    e.preventDefault();
    const pick = document.getElementById("crm-project-pick");
    if (!pick || !pick.value) return;
    crmLinkProject(crmOpenId, pick.value);
  });

  on("crm-client-projects", "click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && e.target.closest("[data-unlink]")) crmUnlinkProject(crmOpenId, li.dataset.id);
  });
}

function buildClientsPage() {
  const page = document.getElementById("crm-page");
  if (!page) return;

  document.getElementById("crm-client-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("crm-client-name");
    const phone = document.getElementById("crm-client-phone");
    const email = document.getElementById("crm-client-email");
    if (!name.value.trim()) return;
    crmUndone = null; // a new client is a new subject; the old undo is stale
    crmAddClient({ name: name.value, phone: phone.value, email: email.value });
    name.value = "";
    phone.value = "";
    email.value = "";
    name.focus();
  });

  // Both lists behave the same way, so one handler serves both. The name is a real link
  // and is left alone: letting it navigate is what makes Back and a copied address work.
  const rowAction = (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    if (e.target.closest("[data-unarchive]")) crmArchiveClient(li.dataset.id, false);
  };
  document.getElementById("crm-client-list").addEventListener("click", rowAction);
  document.getElementById("crm-archive-list").addEventListener("click", rowAction);

  document.getElementById("crm-undo-go").addEventListener("click", () => {
    if (!crmUndone) return;
    const back = crmRestoreClient(crmUndone.token);
    crmUndone = back ? { token: crmUndone.token, name: back.name, restored: true } : null;
    crmRender();
  });

  wireClientDetail();

  document.addEventListener("crmchange", crmRender);
  // A project renamed or deleted on the other page changes what a client's row says.
  document.addEventListener("workspacechange", crmRender);
  // Money is shown in the currency each amount was saved in, but "nothing saved yet"
  // falls back to the visitor's own choice — so a switch has to redraw.
  document.addEventListener("currencychange", crmRender);
  // Signing in or out on /app/ moves the level, and the notice at the top follows it.
  document.addEventListener("lm-session", crmRenderPro);
  // Back after opening a client: the page never reloaded, so nothing else would notice.
  window.addEventListener("popstate", crmRender);

  crmRender();
  document.documentElement.setAttribute("data-crm-ready", "1");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildClientsPage);
} else {
  buildClientsPage();
}
