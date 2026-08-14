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
    // Chapter XVIII: the result about to be produced is a result *for this room*, so the
    // save box below offers that room already chosen. The visitor can still change it —
    // taking the dimensions from one room and filing the answer under another is theirs to
    // decide — but the common case needs no second choice.
    card.dataset.wsRoomId = room.id;
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

/** The value the project picker uses for "a project that does not exist yet". */
const WS_NEW_PROJECT = "__new";

/**
 * Everything the saved line needs to explain itself later — chapter XV.
 *
 * The chapter names five questions a visitor must be able to answer weeks later: which
 * calculator, what they typed, what came out, in what unit, and when. The estimate
 * document answers none of them on its own (`calculationType` lumps eleven of the fifteen
 * calculators into "SURFACE_COVERAGE"), so this is what goes into `inputJson` beside the
 * field values that were already there.
 *
 * Nothing here is text in the page's language. A field travels as its dictionary key
 * (`data-lk`, written by the build), a chosen option as its own key (`data-ok`), a result
 * row as the key and token the engine emitted — so the line reads correctly in German
 * after being saved in Polish, which text frozen at save time could never do.
 */
function wsSnapshotOf(card, result) {
  const fields = [];
  card.querySelectorAll("[data-k]").forEach((el) => {
    const f = { k: el.dataset.k };
    if (el.dataset.lk) f.l = el.dataset.lk;
    const chosen = el.tagName === "SELECT" ? el.options[el.selectedIndex] : null;
    if (chosen && chosen.dataset.ok) f.o = chosen.dataset.ok;
    fields.push(f);
  });
  return {
    v: typeof WS_SNAPSHOT === "number" ? WS_SNAPSHOT : 1,
    calc: card.dataset.calc,
    at: Date.now(),
    fields,
    unit: result.unit,
    tobuy: result.tobuy,
    rows: (result.rows || []).map(([k, v]) => [k, String(v)]),
  };
}

/** The unit next to a count, inflected. assets/units.js, loaded before this file. */
const wsUnit = (key, n) =>
  (typeof unitLabel === "function" ? unitLabel(key, n, wsLang(), wsT) : wsT(key));

/** The project picker, rebuilt from the store while keeping whatever is selected. */
function wsFillSaveProjects(box) {
  const sel = box.querySelector("[data-ws-project]");
  const note = box.querySelector("[data-ws-note]");
  const projects = wsProjects();
  const keep = sel.value;
  sel.innerHTML = projects.map((p) =>
    `<option value="${wsEsc(p.id)}">${wsEsc(p.name)}</option>`).join("")
    + `<option value="${WS_NEW_PROJECT}">${wsEsc(wsT("ws_new_project_opt"))}</option>`;
  sel.value = keep === WS_NEW_PROJECT || projects.some((p) => p.id === keep)
    ? keep : wsActiveProjectId();
  // With nothing to choose between, the picker would be a control with one dead option
  // and one that opens a text field. The button makes the first project on its own.
  sel.hidden = projects.length === 0;
  note.hidden = projects.length > 0;
  box.querySelector("[data-ws-new]").hidden = sel.hidden || sel.value !== WS_NEW_PROJECT;
  wsFillSaveRooms(box);
}

/**
 * The room picker beside it — chapter XVIII's "kalkulacje mogą być przypisane do
 * konkretnego pomieszczenia", asked where the assignment can actually be made.
 *
 * It lists the rooms of the project the picker above names, and nothing else: a room
 * belongs to a project, so offering another project's rooms would offer an assignment
 * `wsAddEstimation()` drops on the way in. A project with no rooms gets no picker at all
 * rather than one empty dropdown — chapter XXV's rule about a control with nothing behind
 * it. Whichever room filled the form is preselected the first time.
 */
function wsFillSaveRooms(box) {
  const sel = box.querySelector("[data-ws-room-pick]");
  if (!sel) return;
  const project = box.querySelector("[data-ws-project]");
  const projectId = project.hidden || project.value === WS_NEW_PROJECT
    ? wsActiveProjectId() : project.value;
  const rooms = projectId ? wsRooms(projectId) : [];
  const card = box.closest(".calc");
  const keep = sel.dataset.touched ? sel.value : ((card && card.dataset.wsRoomId) || "");
  sel.innerHTML = `<option value="">${wsEsc(wsT("ws_room_no"))}</option>` + rooms.map((r) =>
    `<option value="${wsEsc(r.id)}">${wsEsc(r.name)}</option>`).join("");
  sel.value = rooms.some((r) => r.id === keep) ? keep : "";
  sel.hidden = rooms.length === 0;
}

/**
 * The actions under the result — chapter XII's AKCJE, and chapter XV's arrow into a
 * project.
 *
 * Built once into the slot the build leaves for it on a calculator page
 * (`[data-calc-actions]`); anywhere else it falls in after the result box, which is where
 * it used to live. Every later calculation refreshes it rather than replacing it, so a
 * project name half-typed into the picker survives pressing Enter in a field.
 */
function wsRenderSave(card, result) {
  let box = card.querySelector("[data-ws-save-box]");
  if (!result) { if (box) box.remove(); return; }
  if (!box) box = wsBuildSaveBox(card);
  // The click reads this rather than a captured argument: the box outlives the result it
  // was first drawn for, and saving the previous number would be worse than not saving.
  box.lmResult = result;
  // A new number makes the last confirmation stale — it was about a different result.
  box.querySelector("[data-ws-saved]").hidden = true;
  wsFillSaveProjects(box);
}

function wsBuildSaveBox(card) {
  const box = document.createElement("div");
  box.className = "ws-save";
  box.setAttribute("data-ws-save-box", "");
  const slot = card.querySelector("[data-calc-actions]");
  if (slot) slot.appendChild(box);
  else card.querySelector("[data-result]").after(box);

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
      <select data-ws-project aria-label="${wsEsc(wsT("ws_project"))}" hidden></select>
      <select data-ws-room-pick aria-label="${wsEsc(wsT("ws_room"))}" hidden></select>
      <span class="muted ws-save-note" data-ws-note hidden>${wsEsc(wsT("ws_no_project"))}</span>
    </div>
    <div class="ws-save-new" data-ws-new hidden>
      <label class="ws-bar-label" for="ws-new-${wsEsc(card.dataset.calc)}">${wsEsc(wsT("ws_new_project"))}</label>
      <input id="ws-new-${wsEsc(card.dataset.calc)}" type="text" maxlength="120"
        data-ws-new-name placeholder="${wsEsc(wsT("ws_default_project"))}">
    </div>
    <p class="ws-saved" data-ws-saved role="status" hidden></p>
    ${account}`;

  const sel = box.querySelector("[data-ws-project]");
  sel.addEventListener("change", () => {
    const isNew = sel.value === WS_NEW_PROJECT;
    box.querySelector("[data-ws-new]").hidden = !isNew;
    if (isNew) box.querySelector("[data-ws-new-name]").focus();
    // Picking a project here picks it everywhere: the estimate, the dashboard and the next
    // result all mean the same "active project", and two answers to that would diverge.
    else wsSetActiveProject(sel.value);
    // Another project is another set of rooms, and the one chosen a moment ago is not in
    // it. Starting the room over is the honest redraw.
    const room = box.querySelector("[data-ws-room-pick]");
    if (room) delete room.dataset.touched;
    wsFillSaveRooms(box);
  });
  // Once the visitor has named a room, a redraw stops overriding them with the room the
  // form was filled from — the two are the same choice until they are not.
  box.querySelector("[data-ws-room-pick]")
    .addEventListener("change", (e) => { e.target.dataset.touched = "1"; });
  box.querySelector("[data-ws-save]").addEventListener("click", () => wsSaveResult(card, box));
  return box;
}

/** Put the result on screen into the project the picker names. */
function wsSaveResult(card, box) {
  const result = box.lmResult;
  if (!result) return;
  const sel = box.querySelector("[data-ws-project]");
  const nameField = box.querySelector("[data-ws-new-name]");

  let projectId = "";
  if (!sel.hidden && sel.value === WS_NEW_PROJECT) {
    projectId = wsAddProject(nameField.value.trim() || wsT("ws_default_project")).id;
    nameField.value = "";
  } else if (!sel.hidden) {
    projectId = sel.value;
  }

  const waste = (result.rows || []).find((r) => r[0] === "res_waste");
  const input = {};
  card.querySelectorAll("[data-k]").forEach((el) => { input[el.dataset.k] = el.value; });

  const roomPick = box.querySelector("[data-ws-room-pick]");
  const roomId = roomPick && !roomPick.hidden ? roomPick.value : "";

  const row = wsAddEstimation({
    calcId: card.dataset.calc,
    projectId,
    roomId,
    name: card.dataset.matName || card.dataset.wsRoomName || wsT(`c_${card.dataset.calc}_t`),
    materialCategory: card.dataset.matCat || "OTHER",
    requiredUnits: result.tobuy,
    // Inflected for the count, exactly as the result panel above shows it — a saved
    // line reading "1 worków" would be the same defect one screen further on.
    unitLabel: wsUnit(result.unit, result.tobuy),
    costMajor: result.cost || 0,
    wastePercent: waste ? parseFloat(String(waste[1])) : 0,
    input,
    snapshot: wsSnapshotOf(card, result),
    projectName: wsT("ws_default_project"),
  });

  const project = wsProject(row.projectId);
  sel.value = row.projectId;
  box.querySelector("[data-ws-new]").hidden = true;
  // The room the store actually filed it under, not the one that was asked for: a stale
  // pick naming another project's room is dropped on the way in, and saying otherwise
  // would be the one sentence on the page that is not true.
  const saved = wsRoom(wsLineRoomId(row));
  wsSaid(box, project ? project.name : "", row.projectId, saved ? saved.name : "");
}

/**
 * The third step of chapter XV: the result is in a project, and the project is a click
 * away. Without the link the arrow stops at "saved" and the visitor has to go and find it.
 */
function wsSaid(box, projectName, projectId, roomName) {
  const said = box.querySelector("[data-ws-saved]");
  const slot = box.closest("[data-calc-actions]");
  const base = (slot && slot.dataset.projectsUrl) || "";
  const link = base && projectId
    ? ` <a href="${wsEsc(base)}?id=${encodeURIComponent(projectId)}">${wsEsc(wsT("proj_open"))}</a>`
    : "";
  // The room is named only when there is one — a project without rooms has no picker, and
  // "· " with nothing after it would be punctuation reporting on an absence.
  const room = roomName ? ` <span class="muted">· ${wsEsc(roomName)}</span>` : "";
  said.innerHTML = `<b>${wsEsc(wsT("ws_saved_in"))} ${wsEsc(projectName)}</b>${room}${link}`;
  said.hidden = false;
}

function buildWorkspaceCalculators() {
  const cards = document.querySelectorAll(".calc[data-calc]");
  if (!cards.length) return;
  cards.forEach(wsWireCard);
  document.addEventListener("calcresult", (e) => wsRenderSave(e.detail.card, e.detail.result));
  document.addEventListener("workspacechange", () => cards.forEach((card) => {
    wsFillRoomSelect(card);
    const box = card.querySelector("[data-ws-save-box]");
    if (box) wsFillSaveProjects(box);
  }));
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
/** Which material is open for editing, or "" when none is. */
let wsEditingItemId = "";
/** Which room is open for editing, or "" when none is. */
let wsEditingRoomId = "";

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
  // The money is the project's whole cost — chapter XVII's sum, materials and the rest —
  // so the list, the dashboard and the project screen answer "what does this cost" with
  // one number. The count beside it stays the count of saved lines.
  const costs = wsProjectCosts(p.id);
  const money = costs.total ? ` · ${wsEsc(wsMoney(costs.total, costs.currencyCode))}` : "";
  // Lines saved in different currencies do not add up, and chapter VI forbids converting
  // them. The row has room for a chip; the whole sentence is its title.
  const mixed = costs.mixed
    ? ` <span class="chip warn" title="${wsEsc(wsT("ws_mixed_currency"))}">${wsEsc(wsT("dash_mixed"))}</span>`
    : "";
  return `<li data-id="${wsEsc(p.id)}"${p.id === active ? ' class="on"' : ""}>
      <span class="row-name">
        <a href="?id=${encodeURIComponent(p.id)}" data-open><b>${wsEsc(p.name)}</b></a>
        <em class="muted">${total.count} ${wsEsc(wsUnit("ws_lines", total.count))}${money} · ${wsEsc(wsDate(p.updatedAt))}${mixed}</em>
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

/** A date with the time on it: "kiedy wykonano obliczenie" is a moment, not a day. */
const wsMoment = (ms) => {
  const at = Number(ms);
  if (!isFinite(at) || at <= 0) return "";
  return new Date(at).toLocaleString(wsLang(), {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/** One value as it was typed, or the word a dropdown was set to. */
function wsFieldValue(field, snapshot) {
  if (field.o) return wsT(field.o);
  const raw = String(snapshot.input[field.k] === undefined ? "" : snapshot.input[field.k]).trim();
  if (!raw) return "";
  // A cutting list is several lines of free text; everything else is one number, which is
  // written back in this language's own notation rather than in whatever was typed.
  if (raw.includes("\n")) return raw.split("\n").map((s) => s.trim()).filter(Boolean).join(" · ");
  const n = parseFloat(raw.replace(",", "."));
  return isFinite(n) && String(n) === raw.replace(",", ".") ? wsNum(n) : raw;
}

/**
 * Where the number came from — chapter XV, the whole point of it.
 *
 * "Nie zapisuj tylko samej liczby, jeśli później nie będzie wiadomo, skąd się wzięła."
 * The five answers are the five things the snapshot keeps, and they are folded away
 * because a project with a dozen lines would otherwise be a wall of numbers: the list is
 * the estimate, this is the working behind one row of it.
 *
 * A line saved before session 16 has no snapshot and gets no disclosure — an empty
 * "where from" is worse than none, and chapter XXV forbids a control with nothing behind
 * it. So does a line typed by hand on /kosztorys/: it was never calculated.
 */
function wsLineSource(row) {
  const snap = wsLineSnapshot(row);
  if (!snap) return "";
  const url = ((typeof window !== "undefined" && window.LM_PROJ) || { calcs: {} }).calcs[snap.calc];
  const name = wsT(`c_${snap.calc}_t`);
  const calc = url
    ? `<a href="${wsEsc(url)}">${wsEsc(name)}</a>`
    : wsEsc(name);

  const inputs = snap.fields
    .map((f) => [f.l ? wsT(f.l) : f.k, wsFieldValue(f, snap)])
    .filter(([, v]) => v !== "")
    .map(([l, v]) => `<span class="ws-src-pair"><span class="muted">${wsEsc(l)}</span> ${wsEsc(v)}</span>`)
    .join("");

  const rows = snap.rows
    .map(([k, v]) => `<span class="ws-src-pair"><span class="muted">${wsEsc(wsT(k))}</span> ${wsEsc(
      typeof localizeRow === "function" ? localizeRow(v, wsLang(), wsT) : v)}</span>`)
    .join("");

  const line = (label, body) =>
    `<div><dt class="muted">${wsEsc(label)}</dt><dd>${body}</dd></div>`;

  return `<details class="ws-src">
      <summary>${wsEsc(wsT("proj_src_t"))}</summary>
      <dl>
        ${line(wsT("proj_src_calc"), calc)}
        ${inputs ? line(wsT("proj_src_input"), inputs) : ""}
        ${line(wsT("proj_src_result"),
          `<b>${wsNum(snap.tobuy)} ${wsEsc(wsUnit(snap.unit, snap.tobuy))}</b>${rows}`)}
        ${snap.at ? line(wsT("proj_src_when"), wsEsc(wsMoment(snap.at))) : ""}
      </dl>
    </details>`;
}

/* ------------------------------------------------------- the rooms of a project
 *
 * Chapter XVIII, in the chapter's own shape:
 *
 *     Projekt:        Remont łazienki
 *     Pomieszczenie:  Łazienka
 *     Wymiary:        2,4 × 3,2 × 2,5 m
 *
 * The three dimensions are what the room *is* — everything else on the row is worked out
 * from them by wsRoomAreas(), which is the same function the calculators' room bar spends,
 * so a floor area read here and a floor area typed into a calculator cannot disagree.
 *
 * The rooms are the project's, by the `projectId` the store carries beside the contract
 * (see assets/workspace.js). A room whose project has been deleted stays on the index and
 * leaves this list, because it is a place and not a line of the project's paperwork.
 */

/** The dimensions of a room as the chapter writes them: "2,4 × 3,2 × 2,5 m". */
const wsRoomDims = (a) => `${wsNum(a.L)} × ${wsNum(a.W)} × ${wsNum(a.H)} m`;

/** Floor, walls and ceiling, in the order a room is usually finished. */
function wsRoomFigures(a) {
  return [
    [wsT("room_floor"), `${wsNum(a.floor)} m²`],
    [wsT("ws_surface_walls"), `${wsNum(a.walls)} m²`],
    [wsT("proj_room_volume"), `${wsNum(a.volume)} m³`],
  ].map(([l, v]) =>
    `<span class="ws-src-pair"><span class="muted">${wsEsc(l)}</span> ${wsEsc(v)}</span>`).join("");
}

/** One room as it reads, with its dimensions and what they come to. */
function wsRoomRow(r) {
  const a = wsRoomAreas(r);
  return `<li class="ws-room" data-id="${wsEsc(r.id)}">
      <span class="row-name">
        <b>${wsEsc(r.name)}</b>
        <em class="muted">${wsEsc(wsRoomDims(a))}</em>
      </span>
      <span class="ws-room-figs">${wsRoomFigures(a)}</span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-edit>${wsEsc(wsT("proj_mat_edit"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-del>${wsEsc(wsT("app_delete"))}</button>
      </span>
    </li>`;
}

/**
 * The same room, open for editing: the name and the three dimensions.
 *
 * A form on the page rather than `prompt()`, for the reason session 15 gave when it took
 * the browser's dialogs out of this file — and in the row it belongs to, so the numbers
 * being changed stay on screen while they are typed.
 */
function wsRoomForm(r) {
  const f = (key, name, value) => `<label class="ws-mat-f ws-mat-f-sm">
          <span class="ws-bar-label">${wsEsc(wsT(key))}</span>
          <input type="text" inputmode="decimal" data-f="${name}" value="${wsEsc(wsPlain(value))}">
        </label>`;
  return `<li class="ws-room ws-editing" data-id="${wsEsc(r.id)}">
      <form class="ws-mat-edit" data-room-edit>
        <p class="ws-mat-grid">
          <label class="ws-mat-f">
            <span class="ws-bar-label">${wsEsc(wsT("ws_col_name"))}</span>
            <input type="text" maxlength="120" data-f="name" value="${wsEsc(r.name)}" required>
          </label>
          ${f("fld_length", "lengthM", r.lengthM)}
          ${f("fld_width", "widthM", r.widthM)}
          ${f("fld_height", "heightM", r.heightM)}
        </p>
        <p class="ws-mat-sum" data-room-sum aria-live="polite"></p>
        <p class="ws-ask-row">
          <button type="submit" class="btn btn-primary btn-sm">${wsEsc(wsT("app_save"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-cancel>${wsEsc(wsT("action_cancel"))}</button>
        </p>
      </form>
    </li>`;
}

/** What the three dimensions in the open form come to, recomputed as they are typed. */
function wsRoomSum(form) {
  const out = form.querySelector("[data-room-sum]");
  if (!out) return;
  const get = (f) => {
    const el = form.querySelector(`[data-f="${f}"]`);
    return el ? wsDecimal(el.value) : 0;
  };
  const a = wsRoomAreas({ lengthM: get("lengthM"), widthM: get("widthM"), heightM: get("heightM") });
  out.textContent = a.floor > 0 || a.walls > 0
    ? `${wsRoomDims(a)} · ${wsT("room_floor")} ${wsNum(a.floor)} m² · ${wsT("ws_surface_walls")} ${wsNum(a.walls)} m²`
    : "";
}

function wsRenderProjectRooms(id) {
  const list = document.getElementById("ws-project-rooms");
  if (!list) return;
  const rooms = wsRooms(id);
  list.innerHTML = rooms.length
    ? rooms.map((r) => (r.id === wsEditingRoomId ? wsRoomForm(r) : wsRoomRow(r))).join("")
    : `<li class="empty muted">${wsEsc(wsT("proj_room_empty"))}</li>`;
}

/**
 * The rooms a calculation may be filed under, as `<option>`s — chapter XVIII's second
 * sentence. The room the line already carries is the one selected; "" is no room, which is
 * what every line saved before this session is.
 */
function wsRoomOptions(projectId, current) {
  return `<option value="">${wsEsc(wsT("ws_room_no"))}</option>` + wsRooms(projectId)
    .map((r) => `<option value="${wsEsc(r.id)}"${r.id === current ? " selected" : ""}>${wsEsc(r.name)}</option>`)
    .join("");
}

/**
 * The saved lines of one project, newest last — the order they were added in.
 *
 * Calculations only. A line typed by hand is a cost, not a calculation: it has no snapshot,
 * no "where did this number come from" and no material behind it, and since session 19 it
 * has a section of its own further down (chapter XVII's "inne koszty"). Listing it in both
 * would print the same money twice on one screen.
 */
function wsRenderProjectLines(id) {
  const list = document.getElementById("ws-project-lines");
  if (!list) return;
  const rows = wsCalcLines(id);
  if (!rows.length) {
    list.innerHTML = `<li class="empty muted">${wsEsc(wsT("proj_lines_empty"))}</li>`;
    return;
  }
  // Chapter XVIII: "Kalkulacje mogą być przypisane do konkretnego pomieszczenia." The
  // picker is absent from every row while the project has no rooms — a dropdown whose only
  // entry is "no room" is chapter XXV's control with nothing behind it.
  const rooms = wsRooms(id);
  list.innerHTML = rows.map((r) => {
    const cost = r.totalCostMinor > 0
      ? `<em class="muted">${wsEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</em>` : "";
    const room = rooms.length
      ? `<span class="ws-line-room">
          <label class="ws-bar-label muted" for="ws-line-room-${wsEsc(r.id)}">${wsEsc(wsT("ws_room"))}</label>
          <select id="ws-line-room-${wsEsc(r.id)}" data-line-room>${wsRoomOptions(id, wsLineRoomId(r))}</select>
        </span>`
      : "";
    return `<li class="ws-line" data-id="${wsEsc(r.id)}">
        <span class="row-name">
          <b>${wsEsc(r.name)}</b>
          <em class="muted">${wsEsc(wsDate(r.createdAt))}</em>
        </span>
        <span class="dash-fig">
          <b>${wsNum(r.requiredUnits)} ${wsEsc(r.unitLabel)}</b>
          ${cost}
        </span>
        ${room}
        ${wsLineSource(r)}
      </li>`;
  }).join("");
}

/**
 * The material list of one project — chapter XVI's "Materiał | Ilość".
 *
 * The calculations above answer "what did this cost and where did the number come from".
 * This answers "what do I put in the trolley", which is a different question with a
 * different shape: a name, a quantity, the aisle it is bought in, and a box to tick once it
 * is in the van. The rows are `shoppingItems` — the project subcollection the sync contract
 * has always had — so the same list is on the phone and inside a shared `/p/<token>` link.
 *
 * The aisle travels as the enum name (`TILES`), never as a word, so it reads in whatever
 * language the page is in; `cat_*` are the same keys the material picker uses. The name
 * cannot do that — `name` is a string in the contract and there is nowhere else to put it,
 * so a material saved in Polish keeps its Polish name, exactly as the estimate line above
 * it always has and exactly as the app writes it.
 */
function wsRenderMaterials(id) {
  const list = document.getElementById("ws-project-materials");
  if (!list) return;
  const rows = wsItems(id);
  const tally = document.getElementById("ws-mat-tally");

  if (!rows.length) {
    list.innerHTML = `<li class="empty muted">${wsEsc(wsT("proj_mat_empty"))}</li>`;
    if (tally) tally.textContent = "";
    return;
  }

  const bought = rows.filter((r) => r.isPurchased).length;
  if (tally) {
    tally.textContent = wsT("proj_mat_tally")
      .replace("{bought}", wsNum(bought)).replace("{count}", wsNum(rows.length));
  }

  list.innerHTML = rows.map((r) =>
    (r.id === wsEditingItemId ? wsMaterialForm(r) : wsMaterialRow(r))).join("");
}

/**
 * The unit price of a material, as a field value: "35" or "33.33", or "" when the row has
 * no price. Whole minor units, because that is the smallest amount of money there is.
 */
const wsPriceValue = (minor) => (minor === null ? "" : String(Math.round(minor) / 100));

/** One material as it reads: name, aisle, how much, what it costs, and the note under it. */
function wsMaterialRow(r) {
  // Chapter XVII, in the chapter's own shape: "Klej | 7 × 35 PLN | = 245 PLN". The unit
  // price is the total divided by the quantity (wsUnitPriceMinor) — the contract keeps the
  // total and nothing else — so it can never contradict the money beside it.
  const unit = wsUnitPriceMinor(r);
  const price = unit !== null
    ? `<em class="muted ws-mat-price">× ${wsEsc(wsMoney(Math.round(unit), r.currencyCode))}</em>` : "";
  const cost = r.estimatedCostMinor > 0
    ? `<em class="muted">${unit !== null ? "= " : ""}${wsEsc(wsMoney(r.estimatedCostMinor, r.currencyCode))}</em>` : "";
  const aisle = r.materialCategory
    ? `<em class="muted">${wsEsc(wsT("cat_" + r.materialCategory))}</em>` : "";
  // Chapter XVI's note. It takes a line of its own rather than a column, because it is a
  // sentence and the two columns beside it are a name and a number; and it is absent
  // entirely when empty, so a list nobody annotated reads exactly as it did before.
  const note = r.note
    ? `<span class="ws-mat-note"><span class="muted">${wsEsc(wsT("proj_mat_note"))}</span> ${wsEsc(r.note)}</span>`
    : "";
  return `<li class="ws-mat${r.isPurchased ? " done" : ""}" data-id="${wsEsc(r.id)}">
      <label class="ws-mat-tick">
        <input type="checkbox" data-buy${r.isPurchased ? " checked" : ""}>
        <span class="ws-mat-tick-label">${wsEsc(wsT("proj_mat_buy"))}</span>
      </label>
      <span class="row-name">
        <b>${wsEsc(r.name)}</b>
        ${aisle}
      </span>
      <span class="dash-fig">
        <b>${wsNum(r.quantity)} ${wsEsc(r.unit)}</b>
        ${price}
        ${cost}
      </span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-edit>${wsEsc(wsT("proj_mat_edit"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-del>${wsEsc(wsT("app_delete"))}</button>
      </span>
      ${note}
    </li>`;
}

/**
 * The same material, open for editing — chapter XVI's four writes: the quantity, the name,
 * the unit and the note.
 *
 * A form on the page, in the row it belongs to, for the reason session 15 gave when it took
 * `prompt()` out: a browser dialog cannot be styled, cannot be reached by the page's own
 * translation once it is open, and on a phone covers the thing being changed.
 *
 * The price is chapter XVII's, and it is the price of **one** unit: the quantity is already
 * in the form next to it, so what gets stored is the two multiplied — the chapter's own
 * "7 × 35 PLN = 245 PLN". The product is printed under the fields as they are typed,
 * because the number that is saved should not be a surprise.
 *
 * The currency in the label is the row's own, and it is only the visitor's current one when
 * the row has never been priced — see wsUpdateItem(). Nothing here converts anything.
 */
function wsMaterialForm(r) {
  const aisles = ((typeof window !== "undefined" && window.LM_PROJ) || {}).aisles || [];
  const options = (aisles.length ? aisles : [r.materialCategory || "OTHER"])
    .map((c) => `<option value="${wsEsc(c)}"${c === r.materialCategory ? " selected" : ""}>${wsEsc(wsT("cat_" + c))}</option>`)
    .join("");
  const code = r.estimatedCostMinor ? r.currencyCode : (typeof lmCurrency === "function" ? lmCurrency() : r.currencyCode);
  return `<li class="ws-mat ws-editing" data-id="${wsEsc(r.id)}">
      <form class="ws-mat-edit" data-mat-edit data-currency="${wsEsc(code)}">
        <p class="ws-mat-grid">
          <label class="ws-mat-f">
            <span class="ws-bar-label">${wsEsc(wsT("ws_col_name"))}</span>
            <input type="text" maxlength="120" data-f="name" value="${wsEsc(r.name)}" required>
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${wsEsc(wsT("ws_col_qty"))}</span>
            <input type="text" inputmode="decimal" data-f="quantity" value="${wsEsc(wsPlain(r.quantity))}">
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${wsEsc(wsT("ws_col_unit"))}</span>
            <input type="text" maxlength="24" data-f="unit" value="${wsEsc(r.unit)}" list="ws-mat-units">
          </label>
          <label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${wsEsc(wsT("proj_mat_price"))} (${wsEsc(code)})</span>
            <input type="text" inputmode="decimal" data-f="priceMajor"
              value="${wsEsc(wsPriceValue(wsUnitPriceMinor(r)))}">
          </label>
          <label class="ws-mat-f">
            <span class="ws-bar-label">${wsEsc(wsT("proj_mat_aisle"))}</span>
            <select data-f="materialCategory">${options}</select>
          </label>
        </p>
        <p class="ws-mat-sum" data-mat-sum aria-live="polite"></p>
        <label class="ws-mat-f">
          <span class="ws-bar-label">${wsEsc(wsT("proj_mat_note"))}</span>
          <input type="text" maxlength="500" data-f="note" value="${wsEsc(r.note || "")}"
            placeholder="${wsEsc(wsT("proj_mat_note_ph"))}">
        </label>
        <p class="muted ws-mat-hint">${wsEsc(wsT("proj_mat_phone"))}</p>
        <p class="ws-ask-row">
          <button type="submit" class="btn btn-primary btn-sm">${wsEsc(wsT("app_save"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-cancel>${wsEsc(wsT("action_cancel"))}</button>
        </p>
      </form>
    </li>`;
}

/**
 * Chapter XVII's line of arithmetic, under the fields that make it: "7 × 35,00 zł =
 * 245,00 zł", recomputed as the quantity and the price are typed.
 *
 * The same function serves both forms — editing a material and typing one in — because
 * they take the same two numbers and store them the same way. It multiplies with
 * `wsItemCostMinor()`, which is what the store will use, so the number under the form is
 * the number that gets saved rather than a second opinion about it.
 */
function wsMatSum(form) {
  const out = form.querySelector("[data-mat-sum]");
  if (!out) return;
  const get = (f) => {
    const el = form.querySelector(`[data-f="${f}"]`);
    return el ? wsDecimal(el.value) : 0;
  };
  const qty = get("quantity");
  const price = get("priceMajor");
  const code = form.dataset.currency
    || (typeof lmCurrency === "function" ? lmCurrency() : "PLN");
  if (!(price > 0) || !(qty > 0)) { out.textContent = ""; return; }
  out.textContent = `${wsNum(qty)} × ${wsMoney(wsMinor(price), code)}`
    + ` = ${wsMoney(wsItemCostMinor(price, qty), code)}`;
}

/**
 * The other costs of a project — chapter XVII's "inne koszty": the estimate lines nothing
 * calculated. Labour, delivery, a skip, the tool that had to be hired.
 *
 * They are ordinary estimate lines with `manual` in their `inputJson`, which is how
 * /kosztorys/ has written them since it existed — so this section is a second way into the
 * same store, not a second store. They are shown apart from the calculations above for the
 * reason the summary needs them apart: a calculation has a material on the shopping list
 * carrying its money, and one of these does not.
 */
function wsRenderOtherCosts(id) {
  const list = document.getElementById("ws-project-other-list");
  if (!list) return;
  const rows = wsOtherCosts(id);
  if (!rows.length) {
    list.innerHTML = `<li class="empty muted">${wsEsc(wsT("proj_other_empty"))}</li>`;
    return;
  }
  list.innerHTML = rows.map((r) => `<li data-id="${wsEsc(r.id)}">
      <span class="row-name">
        <b>${wsEsc(r.name)}</b>
        <em class="muted">${wsEsc(wsDate(r.createdAt))}</em>
      </span>
      <span class="dash-fig">
        <b>${wsEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</b>
      </span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-del>${wsEsc(wsT("app_delete"))}</button>
      </span>
    </li>`).join("");
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

  // Chapter XVII: "Projekt może pokazywać: koszt materiałów, inne koszty, sumę projektu."
  // The three come out of one call so they cannot disagree, and the sum is the two above it
  // added — never the estimate lines added to the materials, which would count a calculated
  // line twice (it writes a material carrying the same money).
  const costs = wsProjectCosts(project.id);
  document.getElementById("ws-project-count").textContent = String(wsEstimations(project.id).length);
  document.getElementById("ws-project-mat").textContent = wsMoney(costs.materials, costs.currencyCode);
  document.getElementById("ws-project-other").textContent = wsMoney(costs.other, costs.currencyCode);
  document.getElementById("ws-project-total").textContent = wsMoney(costs.total, costs.currencyCode);
  document.getElementById("ws-project-mixed").hidden = !costs.mixed;

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

  wsRenderProjectRooms(project.id);
  wsRenderProjectLines(project.id);
  wsRenderMaterials(project.id);
  wsRenderOtherCosts(project.id);
}

/* ---------------------------------------------------------------- the switch */

/** Show the screen the address bar asks for, and fill it. */
function wsRenderWorkspace() {
  const detail = document.getElementById("ws-project");
  if (!detail) return;
  const was = wsOpenId;
  wsOpenId = wsUrlId();
  // A half-finished edit belongs to the material or the room it was opened on. Leaving the
  // project, or opening another one, ends it — carrying it across would put somebody's
  // typing into a row on a different screen.
  if (wsOpenId !== was) { wsEditingItemId = ""; wsEditingRoomId = ""; }
  const index = document.getElementById("ws-index");

  detail.hidden = !wsOpenId;
  index.hidden = Boolean(wsOpenId);

  // Opening and closing a project changes the address without a reload, and the language
  // links carry that address so the visitor keeps the project they are looking at when
  // they switch language. assets/i18n-runtime.js does it once on load; this is the rest.
  if (typeof keepQueryOnLangLinks === "function") keepQueryOnLangLinks();

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

/**
 * The projects a room can be put into, as `<option>`s, with "no project" first.
 *
 * "No project" is a real answer and not a placeholder: a room measured before there is
 * anything to file it under is still a room, and it still fills a calculator. It is also
 * what a room pulled off the phone looks like — `SyncContract.roomToDoc()` has no
 * `projectId` to send.
 */
function wsProjectOptions(current) {
  return `<option value="">${wsEsc(wsT("ws_room_free"))}</option>` + wsProjects()
    .map((p) => `<option value="${wsEsc(p.id)}"${p.id === current ? " selected" : ""}>${wsEsc(p.name)}</option>`)
    .join("");
}

/** The picker in the "add a room" form, kept on whatever is selected. */
function wsFillRoomProject() {
  const sel = document.getElementById("ws-room-project");
  if (!sel) return;
  const projects = wsProjects();
  const keep = sel.dataset.touched ? sel.value : wsActiveProjectId();
  sel.innerHTML = wsProjectOptions("");
  sel.value = projects.some((p) => p.id === keep) ? keep : "";
  // With no project at all there is one option and it is "no project" — a control with a
  // single dead choice. The form still works; it just stops pretending to ask.
  sel.hidden = projects.length === 0;
}

function wsRenderRooms() {
  const list = document.getElementById("ws-room-list");
  if (!list) return;
  wsFillRoomProject();
  const rooms = wsRooms();
  if (!rooms.length) {
    list.innerHTML = `<li class="empty muted">${wsEsc(wsT("ws_empty_rooms"))}</li>`;
    return;
  }
  list.innerHTML = rooms.map((r) => {
    const a = wsRoomAreas(r);
    // Chapter XVIII makes a room an element of a project, so the index says which one —
    // otherwise the same three names appear in two flats and nothing tells them apart. A
    // room with no project, or one whose project was deleted, simply says nothing: it is
    // still a place, and it still fills a calculator.
    const project = r.projectId ? wsProject(r.projectId) : null;
    const where = project
      ? ` <a class="ws-room-of" href="?id=${encodeURIComponent(project.id)}">${wsEsc(project.name)}</a>` : "";
    // The same control the calculation rows got in session 20, doing the same job one
    // level up: a room can be moved between projects, or taken out of all of them. Absent
    // while there is no project to move it into.
    const move = wsProjects().length
      ? `<select data-room-project aria-label="${wsEsc(wsT("ws_project"))}">${
        wsProjectOptions(r.projectId || "")}</select>`
      : "";
    return `<li data-id="${wsEsc(r.id)}">
        <span class="row-name">
          <b>${wsEsc(r.name)}</b>${where}
          <em class="muted">${wsEsc(wsRoomDims(a))} · ${wsT("room_floor")} ${wsNum(a.floor)} m² · ${wsT("room_walls")} ${wsNum(a.walls)} m²</em>
        </span>
        <span class="row-actions">
          ${move}
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
    const picker = document.getElementById("ws-room-project");
    // The picker's answer, not the active project. Until the owner reported it, this form
    // filed the room into whichever project happened to be active and said nothing about
    // it — which is why it looked like a room could not be assigned at all.
    const projectId = picker && !picker.hidden ? picker.value : wsActiveProjectId();
    // Through wsDecimal(), because a comma is the decimal separator in all four languages
    // and wsDim() reads a raw "3,5" as Number("3,5") — NaN, clamped to 0. The form on the
    // project screen has always parsed it; this one handed the string straight to the
    // store, so a room typed the way a Pole types it came out 3 × 0 × 2,6 m.
    wsAddRoom(
      name.value.trim(),
      wsDecimal(document.getElementById("ws-room-length").value),
      wsDecimal(document.getElementById("ws-room-width").value),
      wsDecimal(document.getElementById("ws-room-height").value),
      projectId,
    );
    name.value = "";
    name.focus();
  });

  // Once the visitor has named a project, a redraw stops moving them back to the active
  // one — the same rule the room picker under a result follows.
  document.getElementById("ws-room-project").addEventListener("change", (e) => {
    e.target.dataset.touched = "1";
  });

  document.getElementById("ws-room-list").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && e.target.closest("[data-del]")) wsDeleteRoom(li.dataset.id);
  });

  // Chapter XVIII, on a room that already exists: move it to another project, or take it
  // out of all of them. wsUpdateRoom() has taken `projectId` since session 20.
  document.getElementById("ws-room-list").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-room-project]");
    const li = e.target.closest("li[data-id]");
    if (sel && li) wsUpdateRoom(li.dataset.id, { projectId: sel.value });
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

  // The material list: tick one off, or take it off the list. Both write through the store,
  // which fires `workspacechange` and redraws the screen — so the checkbox reflects what was
  // actually saved rather than what was clicked, and a write refused by a full quota leaves
  // the box where it was instead of lying about it.
  on("ws-project-materials", "click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    if (e.target.closest("[data-buy]")) wsSetItemPurchased(li.dataset.id, e.target.checked);
    else if (e.target.closest("[data-del]")) wsDeleteItem(li.dataset.id);
    else if (e.target.closest("[data-edit]")) {
      wsEditingItemId = li.dataset.id;
      wsRenderWorkspace();
      const first = document.querySelector('#ws-project-materials [data-f="name"]');
      if (first) { first.focus(); first.select(); }
    } else if (e.target.closest("[data-cancel]")) {
      wsEditingItemId = "";
      wsRenderWorkspace();
    }
  });

  // Chapter XVII's arithmetic while it is being typed, in whichever of the two forms is
  // open. `input` does not bubble on old browsers; on every browser this site supports it
  // does, which is what lets one listener serve a list that is redrawn on every write.
  on("ws-project-materials", "input", (e) => {
    const form = e.target.closest("[data-mat-edit]");
    if (form) wsMatSum(form);
  });

  // Chapter XVI's four writes plus chapter XVII's price, in one submit: the quantity, the
  // name, the unit, the note and what one unit costs.
  on("ws-project-materials", "submit", (e) => {
    const form = e.target.closest("[data-mat-edit]");
    if (!form) return;
    e.preventDefault();
    const li = form.closest("li[data-id]");
    const get = (f) => {
      const el = form.querySelector(`[data-f="${f}"]`);
      return el ? el.value : undefined;
    };
    if (!String(get("name")).trim()) return; // a material with no name cannot be shopped for
    wsEditingItemId = "";
    // The store fires `workspacechange`, which redraws the screen — so what appears is what
    // was actually written, not what was typed at it.
    if (!wsUpdateItem(li.dataset.id, {
      name: get("name"),
      quantity: wsDecimal(get("quantity")),
      unit: get("unit"),
      materialCategory: get("materialCategory"),
      note: get("note"),
      // The quantity above is applied first, so the cost is this price times the quantity
      // the visitor is looking at — chapter XVII's "7 × 35 PLN = 245 PLN".
      priceMajor: wsDecimal(get("priceMajor")),
    })) wsRenderWorkspace();
  });

  /* Chapter XVIII's rooms, on the project they belong to: add one, correct its dimensions,
     take it off. The store fires `workspacechange`, which redraws the screen, so what
     appears is what was written rather than what was typed at it. */
  on("ws-project-rooms", "click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    if (e.target.closest("[data-del]")) {
      // A room carries no money and no shopping list, so it goes without a question — and
      // it is a tombstone either way, which is what makes it recoverable at all.
      if (wsEditingRoomId === li.dataset.id) wsEditingRoomId = "";
      wsDeleteRoom(li.dataset.id);
    } else if (e.target.closest("[data-edit]")) {
      wsEditingRoomId = li.dataset.id;
      wsRenderWorkspace();
      const first = document.querySelector('#ws-project-rooms [data-f="name"]');
      if (first) { first.focus(); first.select(); }
    } else if (e.target.closest("[data-cancel]")) {
      wsEditingRoomId = "";
      wsRenderWorkspace();
    }
  });

  on("ws-project-rooms", "input", (e) => {
    const form = e.target.closest("[data-room-edit]");
    if (form) wsRoomSum(form);
  });

  on("ws-project-rooms", "submit", (e) => {
    const form = e.target.closest("[data-room-edit]");
    if (!form) return;
    e.preventDefault();
    const li = form.closest("li[data-id]");
    const get = (f) => form.querySelector(`[data-f="${f}"]`).value;
    if (!String(get("name")).trim()) return; // a room with no name is a row nobody can place
    wsEditingRoomId = "";
    if (!wsUpdateRoom(li.dataset.id, {
      name: get("name"),
      lengthM: wsDecimal(get("lengthM")),
      widthM: wsDecimal(get("widthM")),
      heightM: wsDecimal(get("heightM")),
    })) wsRenderWorkspace();
  });

  on("ws-proj-room-form", "input", (e) => wsRoomSum(e.currentTarget));
  on("ws-proj-room-form", "submit", (e) => {
    e.preventDefault();
    const el = (id) => document.getElementById(id);
    const name = el("ws-proj-room-name");
    if (!name.value.trim() || !wsOpenId) return;
    const made = wsAddRoom(
      name.value.trim(),
      wsDecimal(el("ws-proj-room-length").value),
      wsDecimal(el("ws-proj-room-width").value),
      wsDecimal(el("ws-proj-room-height").value),
      wsOpenId,
    );
    if (!made) return;
    // The name is about one room and goes; the three dimensions are usually a small edit
    // away from the next room in the same flat and stay.
    name.value = "";
    wsRoomSum(e.currentTarget);
    name.focus();
  });

  /* Chapter XVIII's second sentence, on a line that is already saved: a calculation can be
     put into a room, moved to another, or taken out of all of them. The room id goes inside
     `inputJson` — see wsSetLineRoom() — so the assignment travels with the line. */
  on("ws-project-lines", "change", (e) => {
    const sel = e.target.closest("[data-line-room]");
    const li = e.target.closest("li[data-id]");
    if (sel && li) wsSetLineRoom(li.dataset.id, sel.value);
  });

  // Chapter XVI's "dodać własny materiał", now with chapter XVII's price on it.
  on("ws-mat-form", "input", (e) => wsMatSum(e.currentTarget));
  on("ws-mat-form", "submit", (e) => {
    e.preventDefault();
    const el = (id) => document.getElementById(id);
    const name = el("ws-mat-name").value.trim();
    if (!name || !wsOpenId) return;
    const made = wsAddOwnItem({
      projectId: wsOpenId,
      name,
      materialCategory: el("ws-mat-cat").value,
      quantity: wsDecimal(el("ws-mat-qty").value),
      unit: el("ws-mat-unit").value.trim(),
      note: el("ws-mat-note").value.trim(),
      priceMajor: wsDecimal(el("ws-mat-price").value),
    });
    if (!made) return;
    // The name, the note and the price are about one material and go; the quantity, the
    // unit and the aisle are usually the same for the next two rows and stay.
    el("ws-mat-name").value = "";
    el("ws-mat-note").value = "";
    el("ws-mat-price").value = "";
    wsMatSum(e.currentTarget);
    el("ws-mat-name").focus();
  });

  /* Chapter XVII's "inne koszty": the costs of a project that no calculator produces.
     Same store as /kosztorys/'s hand-typed line — one writer, two ways in — but filed into
     the project that is open rather than into whichever one is active. */
  on("ws-project-other-list", "click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && e.target.closest("[data-del]")) wsDeleteEstimation(li.dataset.id);
  });

  on("ws-other-form", "submit", (e) => {
    e.preventDefault();
    const el = (id) => document.getElementById(id);
    const name = el("ws-other-name").value.trim();
    if (!name || !wsOpenId) return;
    wsAddManualEstimation({
      projectId: wsOpenId,
      name,
      requiredUnits: 1,
      unitLabel: "",
      costMajor: wsDecimal(el("ws-other-cost").value),
    });
    el("ws-other-name").value = "";
    el("ws-other-cost").value = "";
    el("ws-other-name").focus();
  });
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
  document.getElementById("ws-estimate-count").textContent = `${total.count} ${wsUnit("ws_lines", total.count)}`;

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
