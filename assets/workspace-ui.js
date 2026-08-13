/* LiczMat website — the workspace in the browser.
 *
 * Three things, each guarded so a page runs only what it contains:
 *   1. a room bar on every calculator card: pick a saved room and a surface, and the
 *      area (or the wall's width and height) lands in the form
 *   2. a "save to the estimate" button under every result
 *   3. the /projekty/ and /kosztorys/ pages: projects, rooms, the estimate and its print
 *
 * The store is assets/workspace.js — localStorage, no account needed. Signing in at
 * /app/ is what pushes it to Firestore; nothing here talks to the network.
 */

const wsT = (key) => (typeof t === "function" ? t(key) : key);
const wsLang = () => document.documentElement.lang || "pl";
const wsEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wsPlain = (v) => String(Math.round(Number(v) * 1000) / 1000);

/** Read a number a person typed: a comma is a decimal point in most of these languages. */
const wsDecimal = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
};
const wsNum = (v) => new Intl.NumberFormat(wsLang(), { maximumFractionDigits: 2 }).format(v);

/* ------------------------------------------------------------------ calculator cards */

/** Which surfaces make sense for a calculator, in the order they are offered. */
function wsSurfacesFor(calcId) {
  if (calcId === "wallpaper" || calcId === "studwall") return ["walls"];
  if (calcId === "ceiling") return ["ceiling"];
  return ["floor", "walls", "ceiling"];
}

/** Rebuild the room `<select>` on one card from whatever is in the store now. */
function wsFillRoomSelect(card) {
  const sel = card.querySelector("[data-ws-room]");
  if (!sel) return;
  const rooms = wsRooms();
  const keep = sel.value;
  sel.innerHTML = `<option value="">${wsEsc(wsT("ws_room_none"))}</option>` + rooms.map((r) => {
    const a = wsRoomAreas(r);
    return `<option value="${wsEsc(r.id)}">${wsEsc(r.name)} — ${wsNum(a.floor)} m²</option>`;
  }).join("");
  if (rooms.some((r) => r.id === keep)) sel.value = keep;
  const bar = card.querySelector("[data-ws-bar]");
  if (bar) bar.hidden = rooms.length === 0;
  const empty = card.querySelector("[data-ws-empty]");
  if (empty) empty.hidden = rooms.length > 0;
}

/** Put the room bar on one server-rendered calculator card and wire it. */
function wsWireCard(card) {
  if (card.dataset.wsWired) return;
  const calcId = card.dataset.calc;
  const surfaces = wsSurfacesFor(calcId);
  card.dataset.wsWired = "1";

  const anchor = card.querySelector(".field");
  if (!anchor) return;

  const bar = document.createElement("div");
  bar.className = "ws-bar";
  bar.innerHTML = `
    <div data-ws-bar hidden>
      <label class="ws-bar-label" for="ws-room-${calcId}">${wsEsc(wsT("ws_from_room"))}</label>
      <div class="ws-bar-row">
        <select id="ws-room-${calcId}" data-ws-room></select>
        ${surfaces.length > 1 ? `<select data-ws-surface>${surfaces.map((s) =>
          `<option value="${s}">${wsEsc(wsT("ws_surface_" + s))}</option>`).join("")}</select>` : ""}
        <button type="button" class="btn btn-ghost btn-sm" data-ws-apply>${wsEsc(wsT("ws_use"))}</button>
      </div>
    </div>
    <p class="muted ws-bar-hint" data-ws-empty hidden>${wsEsc(wsT("ws_no_rooms"))}</p>`;
  anchor.parentNode.insertBefore(bar, anchor);

  bar.querySelector("[data-ws-apply]").addEventListener("click", () => {
    const id = bar.querySelector("[data-ws-room]").value;
    const room = wsRooms().find((r) => r.id === id);
    if (!room) return;
    const surfaceSel = bar.querySelector("[data-ws-surface]");
    const surface = surfaceSel ? surfaceSel.value : surfaces[0];
    Object.entries(wsRoomFill(room, calcId, surface)).forEach(([k, v]) => {
      const el = card.querySelector(`[data-k="${k}"]`);
      if (el) el.value = wsPlain(v);
    });
    card.dataset.wsRoomName = room.name;
    const run = card.querySelector("[data-run]");
    if (run) run.click();
  });

  wsFillRoomSelect(card);
}

/**
 * Whether the visitor has an account, as far as this page can tell.
 *
 * The calculator pages do not load Firebase — it would be a network dependency on every
 * page that only exists to word one sentence — so /app/ leaves the level behind when the
 * auth state changes and assets/account.js reads it here. It decides copy and nothing
 * else: at worst (signed out in another tab, an expired token) the visitor is offered an
 * account they already have, or told about sync they already get. Saving does not consult
 * it, and must not — FIRESTORE_SYNC §1.2: counting never requires an account.
 */
function wsHasAccount() {
  return typeof lmSignedIn === "function" ? lmSignedIn() : false;
}

/**
 * The actions under the result — chapter XII's AKCJE.
 *
 * Rebuilt on every calculation, into the slot the build leaves for it on a calculator
 * page (`[data-calc-actions]`); anywhere else it falls in after the result box, which is
 * where it used to live.
 */
function wsRenderSave(card, result) {
  let box = card.querySelector("[data-ws-save-box]");
  if (!result) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement("div");
    box.className = "ws-save";
    box.setAttribute("data-ws-save-box", "");
    const slot = card.querySelector("[data-calc-actions]");
    if (slot) slot.appendChild(box);
    else card.querySelector("[data-result]").after(box);
  }
  const project = wsActiveProject();
  // Chapter XII asks for "Zaloguj się lub załóż darmowe konto, aby zapisać wynik". The
  // result is already saved by the button next to it, in this browser and without an
  // account, so the sentence says what the account actually adds instead of pretending
  // the button needs one.
  // The link opens the sign-up form itself, not the sign-in form with a toggle to find,
  // and remembers the page to come back to — chapter II wants registration to be the
  // next step after a result rather than a detour away from it.
  const account = wsHasAccount()
    ? `<p class="muted ws-save-account">${wsEsc(wsT("calc_save_in"))}</p>`
    : `<p class="muted ws-save-account">${wsEsc(wsT("calc_save_out"))}
        <a href="${wsEsc(lmSignupUrl(location.pathname))}">${wsEsc(wsT("calc_save_link"))}</a></p>`;
  box.innerHTML = `
    <div class="ws-save-row">
      <button type="button" class="btn btn-primary btn-sm" data-ws-save>${wsEsc(wsT("ws_add_to_project"))}</button>
      <span class="muted ws-save-note">${wsEsc(project ? `${wsT("ws_project")}: ${project.name}` : wsT("ws_no_project"))}</span>
    </div>
    ${account}`;

  box.querySelector("[data-ws-save]").addEventListener("click", () => {
    const waste = (result.rows || []).find((r) => r[0] === "res_waste");
    const input = {};
    card.querySelectorAll("[data-k]").forEach((el) => { input[el.dataset.k] = el.value; });

    const row = wsAddEstimation({
      calcId: card.dataset.calc,
      name: card.dataset.matName || card.dataset.wsRoomName || wsT(`c_${card.dataset.calc}_t`),
      materialCategory: card.dataset.matCat || "OTHER",
      requiredUnits: result.tobuy,
      // Inflected for the count, exactly as the result panel above shows it — a saved
      // line reading "1 worków" would be the same defect one screen further on. The
      // guard is for /projekty/ and /kosztorys/, which load this file without the engines.
      unitLabel: typeof unitLabel === "function"
        ? unitLabel(result.unit, result.tobuy, wsLang(), wsT)
        : wsT(result.unit),
      costMajor: result.cost || 0,
      wastePercent: waste ? parseFloat(String(waste[1])) : 0,
      input,
      projectName: wsT("ws_default_project"),
    });
    box.querySelector(".ws-save-note").textContent = `${wsT("ws_saved")} ${row.name}`;
  });
}

function buildWorkspaceCalculators() {
  const cards = document.querySelectorAll(".calc[data-calc]");
  if (!cards.length) return;
  cards.forEach(wsWireCard);
  document.addEventListener("calcresult", (e) => wsRenderSave(e.detail.card, e.detail.result));
  document.addEventListener("workspacechange", () => cards.forEach(wsFillRoomSelect));
}

/* ------------------------------------------------------------------ /projekty/
 *
 * One page, two screens — the `project` route in src/ia.mjs is a `view`, because a
 * project id is made in this browser and can never be a directory on GitHub Pages:
 *
 *   /projekty/          the index: the projects, the archive, the rooms
 *   /projekty/?id=<id>  one project — chapter XIV
 *
 * A project name in the index is a real <a href="?id=…">, so opening one is an ordinary
 * navigation: the back button works, a link can be copied, and nothing here has to
 * reimplement history. The single exception is deleting from the detail, which puts the
 * index back with `replaceState` instead of navigating — a reload would throw away the
 * "undo" the delete has just offered.
 */

/** The project the address bar is asking for, or "" for the index. */
const wsUrlId = () => {
  try { return new URLSearchParams(location.search).get("id") || ""; } catch (e) { return ""; }
};

/** The project the page is currently showing. Set once per render pass. */
let wsOpenId = "";
/** Whether the rename form and the delete question are open, so a redraw keeps them. */
let wsRenaming = false;
let wsAsking = false;
/** The last delete, until the visitor undoes it or does something else. */
let wsUndone = null;

const wsDate = (ms) => {
  const at = Number(ms);
  if (!isFinite(at) || at <= 0) return "";
  return new Date(at).toLocaleDateString(wsLang(), { day: "numeric", month: "short", year: "numeric" });
};

/** The index's own address, without the query that opens a project. */
const wsIndexUrl = () => location.pathname;

/* ---------------------------------------------------------------- the index */

/** One row of either list: the name links to the project, the meta says what is in it. */
function wsProjectRow(p, active) {
  const total = wsProjectTotal(p.id);
  const money = total.count ? ` · ${wsEsc(wsMoney(total.minor, total.currencyCode))}` : "";
  // Lines saved in different currencies do not add up, and chapter VI forbids converting
  // them. The row has room for a chip; the whole sentence is its title.
  const mixed = total.mixed
    ? ` <span class="chip warn" title="${wsEsc(wsT("ws_mixed_currency"))}">${wsEsc(wsT("dash_mixed"))}</span>`
    : "";
  return `<li data-id="${wsEsc(p.id)}"${p.id === active ? ' class="on"' : ""}>
      <span class="row-name">
        <a href="?id=${encodeURIComponent(p.id)}" data-open><b>${wsEsc(p.name)}</b></a>
        <em class="muted">${total.count} ${wsEsc(wsT("ws_lines"))}${money} · ${wsEsc(wsDate(p.updatedAt))}${mixed}</em>
      </span>
      <span class="row-actions">
        ${p.archived
          ? `<button type="button" class="btn btn-ghost btn-sm" data-unarchive>${wsEsc(wsT("proj_archive_undo"))}</button>`
          : p.id === active
            ? `<span class="chip on">${wsEsc(wsT("ws_active"))}</span>`
            : `<button type="button" class="btn btn-ghost btn-sm" data-activate>${wsEsc(wsT("ws_activate"))}</button>`}
      </span>
    </li>`;
}

function wsRenderProjects() {
  const list = document.getElementById("ws-project-list");
  if (!list) return;
  const projects = wsProjects();
  const active = wsActiveProjectId();
  list.innerHTML = projects.length
    ? projects.map((p) => wsProjectRow(p, active)).join("")
    : `<li class="empty muted">${wsEsc(wsT("ws_empty_projects"))}</li>`;

  // The archive is folded away and absent entirely while it is empty: a permanently
  // empty disclosure is a control with nothing behind it.
  const box = document.getElementById("ws-archive");
  if (!box) return;
  const archived = wsArchivedProjects();
  box.hidden = archived.length === 0;
  if (!archived.length) return;
  document.getElementById("ws-archive-summary").textContent = `${wsT("proj_archive_t")} (${archived.length})`;
  document.getElementById("ws-archive-list").innerHTML =
    archived.map((p) => wsProjectRow(p, active)).join("");
}

/** The strip that offers the last delete back. Hidden the moment there is nothing to undo. */
function wsRenderUndo() {
  const strip = document.getElementById("ws-undo");
  if (!strip) return;
  strip.hidden = !wsUndone;
  if (!wsUndone) return;
  document.getElementById("ws-undo-text").textContent =
    `${wsT(wsUndone.restored ? "proj_restored" : "proj_deleted")} ${wsUndone.name}`;
  document.getElementById("ws-undo-go").hidden = Boolean(wsUndone.restored);
}

/* ---------------------------------------------------------------- one project */

/** The breadcrumb gains the project; the trail is server-rendered for the index only. */
function wsCrumb(name) {
  const ol = document.querySelector(".breadcrumbs ol");
  if (!ol) return;
  const last = ol.lastElementChild;
  if (!last) return;
  if (!name) {
    // Back on the index: undo whatever the detail did to the trail.
    const extra = ol.querySelector("[data-ws-crumb]");
    if (extra) extra.remove();
    const link = ol.lastElementChild;
    if (link && link.dataset.wsCrumbWas) {
      link.innerHTML = link.dataset.wsCrumbWas;
      link.setAttribute("aria-current", "page");
      delete link.dataset.wsCrumbWas;
    }
    return;
  }
  let extra = ol.querySelector("[data-ws-crumb]");
  if (!extra) {
    last.dataset.wsCrumbWas = last.innerHTML;
    last.removeAttribute("aria-current");
    last.innerHTML = `<a href="${wsEsc(wsIndexUrl())}">${last.dataset.wsCrumbWas}</a>`;
    extra = document.createElement("li");
    extra.setAttribute("data-ws-crumb", "");
    extra.setAttribute("aria-current", "page");
    ol.appendChild(extra);
  }
  extra.textContent = name;
}

/** The saved lines of one project, newest last — the order they were added in. */
function wsRenderProjectLines(id) {
  const list = document.getElementById("ws-project-lines");
  if (!list) return;
  const rows = wsEstimations(id);
  if (!rows.length) {
    list.innerHTML = `<li class="empty muted">${wsEsc(wsT("proj_lines_empty"))}</li>`;
    return;
  }
  list.innerHTML = rows.map((r) => {
    const cost = r.totalCostMinor > 0
      ? `<em class="muted">${wsEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</em>` : "";
    return `<li>
        <span class="row-name">
          <b>${wsEsc(r.name)}</b>
          <em class="muted">${wsEsc(wsDate(r.createdAt))}</em>
        </span>
        <span class="dash-fig">
          <b>${wsNum(r.requiredUnits)} ${wsEsc(r.unitLabel)}</b>
          ${cost}
        </span>
      </li>`;
  }).join("");
}

/**
 * Draw the detail for the id in the address bar.
 *
 * An id nobody has is not an error page: the browser it was made in is the only one that
 * ever had it, so the page says exactly that and offers the way back.
 */
function wsRenderProject(id) {
  const project = wsProject(id);
  const missing = document.getElementById("ws-project-missing");
  const body = document.getElementById("ws-project-body");
  const title = document.getElementById("ws-title");
  const lead = document.getElementById("ws-lead");

  missing.hidden = Boolean(project);
  body.hidden = !project;
  lead.hidden = true;

  if (!project) {
    title.textContent = wsT("proj_none_t");
    wsCrumb(wsT("proj_none_t"));
    return;
  }

  title.textContent = project.name;
  wsCrumb(project.name);

  // Chapter XIV asks a project to carry its history. The two stamps the sync contract
  // already keeps are the whole of it today: when it was made and when it last moved.
  document.getElementById("ws-project-hist").textContent =
    `${wsT("proj_created")} ${wsDate(project.createdAt)} · ${wsT("proj_updated")} ${wsDate(project.updatedAt)}`;

  const total = wsProjectTotal(project.id);
  document.getElementById("ws-project-count").textContent = String(total.count);
  document.getElementById("ws-project-total").textContent = wsMoney(total.minor, total.currencyCode);
  document.getElementById("ws-project-mixed").hidden = !total.mixed;

  const isActive = wsActiveProjectId() === project.id;
  // An archived project takes no new lines, so it cannot be the active one either, and
  // offering the button would be offering something the store refuses to do.
  document.getElementById("ws-project-activate").hidden = isActive || Boolean(project.archived);
  document.getElementById("ws-project-active").hidden = !isActive;
  document.getElementById("ws-project-archive").textContent =
    wsT(project.archived ? "proj_archive_undo" : "proj_archive_do");

  const rename = document.getElementById("ws-rename-form");
  rename.hidden = !wsRenaming;
  if (wsRenaming && document.activeElement !== document.getElementById("ws-rename-name")) {
    document.getElementById("ws-rename-name").value = project.name;
  }
  document.getElementById("ws-project-rename").hidden = wsRenaming;

  const ask = document.getElementById("ws-delete-ask");
  ask.hidden = !wsAsking;
  document.getElementById("ws-delete-q").textContent = wsT("ws_confirm_delete");
  document.getElementById("ws-project-delete").hidden = wsAsking;

  wsRenderProjectLines(project.id);
}

/* ---------------------------------------------------------------- the switch */

/** Show the screen the address bar asks for, and fill it. */
function wsRenderWorkspace() {
  const detail = document.getElementById("ws-project");
  if (!detail) return;
  wsOpenId = wsUrlId();
  const index = document.getElementById("ws-index");

  detail.hidden = !wsOpenId;
  index.hidden = Boolean(wsOpenId);

  if (wsOpenId) {
    // Opening a project is moving on: the strip about the last delete has had its say.
    wsUndone = null;
    wsRenderProject(wsOpenId);
    return;
  }

  document.getElementById("ws-title").textContent = wsT("wspage_title");
  const lead = document.getElementById("ws-lead");
  lead.textContent = wsT("wspage_lead");
  lead.hidden = false;
  wsCrumb("");
  wsRenderUndo();
  wsRenderProjects();
  wsRenderRooms();
}

/** Leave the detail without a reload, so an undo offered by a delete survives. */
function wsBackToIndex() {
  try { history.replaceState({}, "", wsIndexUrl()); } catch (e) {}
  wsRenderWorkspace();
}

function wsRenderRooms() {
  const list = document.getElementById("ws-room-list");
  if (!list) return;
  const rooms = wsRooms();
  if (!rooms.length) {
    list.innerHTML = `<li class="empty muted">${wsEsc(wsT("ws_empty_rooms"))}</li>`;
    return;
  }
  list.innerHTML = rooms.map((r) => {
    const a = wsRoomAreas(r);
    return `<li data-id="${wsEsc(r.id)}">
        <span class="row-name">
          <b>${wsEsc(r.name)}</b>
          <em class="muted">${wsNum(a.L)} × ${wsNum(a.W)} × ${wsNum(a.H)} m · ${wsT("room_floor")} ${wsNum(a.floor)} m² · ${wsT("room_walls")} ${wsNum(a.walls)} m²</em>
        </span>
        <span class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-del>${wsEsc(wsT("app_delete"))}</button>
        </span>
      </li>`;
  }).join("");
}

function buildProjectsPage() {
  const page = document.getElementById("ws-page");
  if (!page) return;

  document.getElementById("ws-project-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("ws-project-name");
    const name = input.value.trim();
    if (!name) return;
    input.value = "";
    wsUndone = null; // a new project is a new subject; the old undo is stale
    wsAddProject(name);
  });

  // The two lists behave the same, so one handler serves both. The name is a real link
  // and is left alone: letting it navigate is what makes the back button and a copied
  // address work without any history code here.
  const rowAction = (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    if (e.target.closest("[data-activate]")) wsSetActiveProject(li.dataset.id);
    else if (e.target.closest("[data-unarchive]")) wsArchiveProject(li.dataset.id, false);
  };
  document.getElementById("ws-project-list").addEventListener("click", rowAction);
  document.getElementById("ws-archive-list").addEventListener("click", rowAction);

  document.getElementById("ws-undo-go").addEventListener("click", () => {
    if (!wsUndone) return;
    const back = wsRestoreProject(wsUndone.token);
    wsUndone = back ? { token: wsUndone.token, name: back.name, restored: true } : null;
    wsRenderWorkspace();
  });

  wireProjectDetail();

  document.getElementById("ws-room-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("ws-room-name");
    if (!name.value.trim()) return;
    wsAddRoom(
      name.value.trim(),
      document.getElementById("ws-room-length").value,
      document.getElementById("ws-room-width").value,
      document.getElementById("ws-room-height").value,
      wsActiveProjectId(),
    );
    name.value = "";
  });

  document.getElementById("ws-room-list").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && e.target.closest("[data-del]")) wsDeleteRoom(li.dataset.id);
  });

  document.addEventListener("workspacechange", wsRenderWorkspace);
  // A visitor who presses Back after opening a project is asking for the other screen;
  // the page never reloaded, so nothing else would notice.
  window.addEventListener("popstate", wsRenderWorkspace);
  wsRenderWorkspace();
  document.documentElement.setAttribute("data-ws-ready", "1");
}

/**
 * The four writes of chapter XIV's CRUD, on the project that is open.
 *
 * Rename and delete used to be `prompt()` and `confirm()`. Both are the browser's own
 * dialogs: they cannot be styled, they cannot be reached by the page's own translations
 * once they are open, several browsers suppress them outright, and on a phone they cover
 * the thing being renamed — chapter XXVIII asks for the opposite. So both are forms on
 * the page, next to the project they are about.
 */
function wireProjectDetail() {
  const on = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  on("ws-project-activate", "click", () => { wsSetActiveProject(wsOpenId); });

  on("ws-project-rename", "click", () => {
    wsRenaming = true;
    wsAsking = false;
    wsRenderWorkspace();
    const input = document.getElementById("ws-rename-name");
    input.focus();
    input.select();
  });
  on("ws-rename-form", "submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("ws-rename-name").value.trim();
    if (!name) return; // a project with no name is a row nobody can tell apart
    wsRenaming = false;
    // wsUpdateProject fires workspacechange, which redraws this screen.
    if (!wsUpdateProject(wsOpenId, { name })) wsRenderWorkspace();
  });
  on("ws-rename-form", "click", (e) => {
    if (!e.target.closest("[data-ws-rename-cancel]")) return;
    wsRenaming = false;
    wsRenderWorkspace();
  });

  on("ws-project-archive", "click", () => {
    const project = wsProject(wsOpenId);
    if (!project) return;
    wsArchiveProject(project.id, !project.archived);
  });

  on("ws-project-delete", "click", () => { wsAsking = true; wsRenaming = false; wsRenderWorkspace(); });
  on("ws-delete-no", "click", () => { wsAsking = false; wsRenderWorkspace(); });
  on("ws-delete-yes", "click", () => {
    const project = wsProject(wsOpenId);
    if (!project) return;
    wsAsking = false;
    const token = wsDeleteProject(project.id);
    // The delete is a tombstone, so the undo costs nothing and is offered rather than
    // asked about twice. The token names the rows that went, so the undo brings back
    // those and not a line the visitor deleted by hand a moment earlier. It lands on the
    // index without a reload — a reload would throw the offer away before anybody could
    // take it.
    wsUndone = token ? { token, name: project.name, restored: false } : null;
    wsBackToIndex();
  });

  // /kosztorys/ is about the active project, so the link does what the dashboard's
  // "Otwórz" does: makes this the one, then goes. It stays a real <a href>, so it also
  // works with the script off.
  on("ws-project-estimate", "click", () => { if (wsOpenId) wsSetActiveProject(wsOpenId); });
}

/* ------------------------------------------------------------------ /kosztorys/ */

/** One estimate line, either as text or as the form that edits it. */
function wsEstimateRow(r, i) {
  if (r.id !== wsEditingId) {
    return `<tr data-id="${wsEsc(r.id)}">
        <td>${i + 1}</td>
        <td>${wsEsc(r.name)}</td>
        <td class="num">${wsNum(r.requiredUnits)} ${wsEsc(r.unitLabel)}</td>
        <td class="num">${wsEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</td>
        <td class="no-print ws-row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit>${wsEsc(wsT("ws_edit"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-del>${wsEsc(wsT("app_delete"))}</button>
        </td>
      </tr>`;
  }
  return `<tr data-id="${wsEsc(r.id)}" class="ws-editing">
      <td>${i + 1}</td>
      <td><input type="text" maxlength="120" data-f="name" value="${wsEsc(r.name)}" aria-label="${wsEsc(wsT("ws_col_name"))}"></td>
      <td class="num">
        <input type="text" inputmode="decimal" class="ws-qty" data-f="qty" value="${r.requiredUnits}" aria-label="${wsEsc(wsT("ws_col_qty"))}">
        <input type="text" maxlength="24" class="ws-unit" data-f="unit" value="${wsEsc(r.unitLabel)}" aria-label="${wsEsc(wsT("ws_col_unit"))}">
      </td>
      <td class="num"><input type="text" inputmode="decimal" class="ws-qty" data-f="cost" value="${(r.totalCostMinor / 100).toFixed(2)}" aria-label="${wsEsc(wsT("ws_col_cost"))}"></td>
      <td class="no-print ws-row-actions">
        <button type="button" class="btn btn-primary btn-sm" data-save>${wsEsc(wsT("app_save"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-cancel>${wsEsc(wsT("action_cancel"))}</button>
      </td>
    </tr>`;
}

/** Which line is open for editing, or "" when none is. */
let wsEditingId = "";

function wsRenderEstimate() {
  const wrap = document.getElementById("ws-estimate");
  if (!wrap) return;
  const project = wsActiveProject();
  const rows = project ? wsEstimations(project.id) : [];
  const total = project ? wsProjectTotal(project.id) : { minor: 0, currencyCode: "", count: 0 };

  const picker = document.getElementById("ws-estimate-project");
  if (picker) {
    const projects = wsProjects();
    picker.innerHTML = projects.map((p) =>
      `<option value="${wsEsc(p.id)}"${p.id === (project || {}).id ? " selected" : ""}>${wsEsc(p.name)}</option>`).join("");
    picker.hidden = projects.length < 2;
  }

  document.getElementById("ws-estimate-title").textContent = project ? project.name : wsT("ws_no_project");
  document.getElementById("ws-estimate-date").textContent =
    new Date().toLocaleDateString(wsLang(), { year: "numeric", month: "long", day: "numeric" });

  const body = document.getElementById("ws-estimate-rows");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="muted">${wsEsc(wsT("ws_empty_estimate"))}</td></tr>`;
  } else {
    body.innerHTML = rows.map((r, i) => wsEstimateRow(r, i)).join("");
  }
  document.getElementById("ws-estimate-total").textContent = wsMoney(total.minor, total.currencyCode);
  document.getElementById("ws-estimate-count").textContent = `${total.count} ${wsT("ws_lines")}`;

  // Lines saved in different currencies do not add up, and the sum above says so.
  const mixed = document.getElementById("ws-estimate-mixed");
  if (mixed) mixed.hidden = !total.mixed;
}

function buildEstimatePage() {
  const wrap = document.getElementById("ws-estimate");
  if (!wrap) return;

  document.getElementById("ws-estimate-rows").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    const id = tr.dataset.id;

    if (e.target.closest("[data-del]")) {
      wsDeleteEstimation(id);
    } else if (e.target.closest("[data-edit]")) {
      wsEditingId = id;
      wsRenderEstimate();
    } else if (e.target.closest("[data-cancel]")) {
      wsEditingId = "";
      wsRenderEstimate();
    } else if (e.target.closest("[data-save]")) {
      const get = (f) => tr.querySelector(`[data-f="${f}"]`).value;
      wsEditingId = "";
      wsUpdateEstimation(id, {
        name: get("name").trim(),
        requiredUnits: wsDecimal(get("qty")),
        unitLabel: get("unit").trim(),
        costMajor: wsDecimal(get("cost")),
      });
      wsRenderEstimate();
    }
  });

  const addForm = document.getElementById("ws-line-form");
  if (addForm) addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("ws-line-name");
    if (!name.value.trim()) return;
    wsAddManualEstimation({
      name: name.value.trim(),
      requiredUnits: wsDecimal(document.getElementById("ws-line-qty").value),
      unitLabel: document.getElementById("ws-line-unit").value.trim(),
      costMajor: wsDecimal(document.getElementById("ws-line-cost").value),
    });
    name.value = "";
    document.getElementById("ws-line-cost").value = "";
  });

  const picker = document.getElementById("ws-estimate-project");
  if (picker) picker.addEventListener("change", () => wsSetActiveProject(picker.value));

  const print = document.getElementById("ws-estimate-print");
  // No PDF library: the browser's own "print to PDF" produces a smaller, selectable file
  // than a canvas render would, and @media print in styles.css is what shapes the page.
  if (print) print.addEventListener("click", () => window.print());

  const csv = document.getElementById("ws-estimate-csv");
  if (csv) csv.addEventListener("click", () => {
    const project = wsActiveProject();
    const rows = project ? wsEstimations(project.id) : [];
    const head = ["#", wsT("ws_col_name"), wsT("ws_col_qty"), wsT("ws_col_unit"), wsT("ws_col_cost"), "currency"];
    const body = rows.map((r, i) =>
      [i + 1, r.name, r.requiredUnits, r.unitLabel, (r.totalCostMinor / 100).toFixed(2), r.currencyCode]);
    const text = [head, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    wsDownload(`liczmat-${(project && project.name) || "kosztorys"}.csv`, "text/csv;charset=utf-8", "﻿" + text);
  });

  document.addEventListener("workspacechange", wsRenderEstimate);
  wsRenderEstimate();
}

/** Hand the browser a file without a server round trip. */
function wsDownload(filename, mime, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  buildWorkspaceCalculators();
  buildProjectsPage();
  buildEstimatePage();
});

/* Saved lines keep the currency they were priced in, but a new line is stamped with the
   one in force — so every list that prints money is redrawn when the visitor switches. */
document.addEventListener("currencychange", () => {
  wsRenderWorkspace();
  wsRenderEstimate();
});
