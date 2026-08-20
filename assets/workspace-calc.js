/* LiczMat website — the workspace on a calculator page.

   Two things sit under a calculator: the room bar, which fills the form from a room
   somebody has already measured, and the save box, which files the result in a project
   and puts the material on that project's list. That is all a calculator page needs from
   the workspace, and until session 33 it downloaded all of it: assets/workspace-ui.js was
   one 70 kB file holding this, the whole /projekty/ screen and the whole /kosztorys/
   screen, and 150 of the site's 373 pages are calculator pages.

   So the file was cut in two at the seam that was already there. This half is the shared
   vocabulary (wsT, wsEsc, wsNum, wsDecimal, wsPlain, wsUnit, wsLang) plus the calculator
   page; assets/workspace-ui.js is the two screens, and it is loaded after this one on the
   two pages that draw them. Nothing moved between the halves and nothing was rewritten —
   the seam is where it was, because the projects screen never called into the calculator
   page and the calculator page never called into the projects screen.

   Both are plain scripts in one global scope, so every name here still starts `ws`. */

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

document.addEventListener("DOMContentLoaded", buildWorkspaceCalculators);
