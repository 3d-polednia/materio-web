/* LiczMat website — the two workspace screens: /projekty/ and /kosztorys/.

   The projects page holds two of them in one file — the index and one project at
   ?id=<projectId> — with that project's rooms, its saved calculations, its material list
   and its costs. /kosztorys/ is the document of what was calculated.

   assets/workspace-calc.js is the other half, and it is loaded first: it defines the
   shared vocabulary (wsT, wsEsc, wsNum, wsDecimal, wsPlain, wsUnit, wsLang) that both
   halves speak, and the calculator page, which these two screens never call into. A
   calculator page loads that file and not this one — see the note at the top of it. */

const wsUrlId = () => {
  try { return new URLSearchParams(location.search).get("id") || ""; } catch (e) { return ""; }
};

/**
 * May this browser be shown money? — `costs` in LM_FEATURES, PRO since 2026-09-03.
 *
 * Every unit price, every line value, every waste cost and every total on these two
 * screens is asked this before it is written, and not one of them is merely covered up:
 * the amount is never put into the page at all. What a guest and a free account keep is
 * the whole of the rest — the project, its rooms, its saved calculations and the material
 * list, which is `shopping` and free.
 *
 * A missing pwAllows() is a refusal. The decision lives in assets/plan.js and
 * assets/paywall.js, which the build loads ahead of this file; a page that reached this
 * line without them has no answer, and no answer is "no".
 */
const wsCanCost = () => typeof pwAllows === "function" && pwAllows("costs");

/** The same question for the export, which needs both halves — see pdfAllowed(). */
const wsCanPdf = () => wsCanCost() && typeof pwAllows === "function" && pwAllows("pdf");

/**
 * The two money fields the build writes into a form that is otherwise free.
 *
 * `#ws-mat-price` types the price of a hand-added material and `#ws-line-cost` types what
 * an "inne koszty" line comes to. Everything else on both forms is `shopping` — a name, a
 * quantity, a unit — so the form stays, and the one field that asks for money goes.
 *
 * Each of the two goes with its caption where it has one: `#ws-mat-price` sits inside a
 * `<label>` carrying the words "Cena (PLN)", and a field taken away leaving its caption
 * behind reads as a page that failed to load. `#ws-line-cost` is a bare input in an inline
 * form and names itself with `aria-label`, so there is nothing beside it to take. One
 * expression covers both rather than two, which is how the two drifted apart once already.
 *
 * The blocks the build could wrap whole — the three project figures, the "inne koszty"
 * section, the two export buttons — are `#cost-tool` and `#cost-other-tool`, and
 * assets/paywall.js hides those from the same one decision. This is the leftover: two
 * controls that sit in the middle of a form and cannot be wrapped without splitting it.
 */
function wsGateMoneyFields() {
  const allowed = wsCanCost();
  for (const id of ["ws-mat-price", "ws-line-cost"]) {
    const field = document.getElementById(id);
    if (!field) continue;
    (field.closest("label") || field).hidden = !allowed;
    if (!allowed) field.value = "";
  }
}

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
  const money = wsCanCost() && costs.total
    ? ` · ${wsEsc(wsMoney(costs.total, costs.currencyCode))}` : "";
  // Lines saved in different currencies do not add up, and chapter VI forbids converting
  // them. The row has room for a chip; the whole sentence is its title.
  const mixed = wsCanCost() && costs.mixed
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
    const cost = wsCanCost() && r.totalCostMinor > 0
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
  // The two amounts are `costs`, which is Pro; the name, the aisle and the quantity are
  // `shopping`, which is not. A free account gets the row it shops from, without a price
  // on it — and the price is not computed, not just left out of the markup.
  const money = wsCanCost();
  const unit = money ? wsUnitPriceMinor(r) : null;
  const price = unit !== null
    ? `<em class="muted ws-mat-price">× ${wsEsc(wsMoney(Math.round(unit), r.currencyCode))}</em>` : "";
  const cost = money && r.estimatedCostMinor > 0
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
          ${wsCanCost() ? `<label class="ws-mat-f ws-mat-f-sm">
            <span class="ws-bar-label">${wsEsc(wsT("proj_mat_price"))} (${wsEsc(code)})</span>
            <input type="text" inputmode="decimal" data-f="priceMajor"
              value="${wsEsc(wsPriceValue(wsUnitPriceMinor(r)))}">
          </label>` : ""}
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
  // "7 × 35,00 zł = 245,00 zł" is a price, a line value and a total in one sentence, so
  // it is `costs` from end to end. The field it reads is not on the form for a level that
  // may not have it; this makes sure nothing is written even if it is.
  if (!wsCanCost()) { out.textContent = ""; return; }
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
  // The whole section is `costs`. assets/paywall.js hides it; this makes sure nothing was
  // put inside it first, because a hidden element still holds every amount in it.
  if (!wsCanCost()) { list.innerHTML = ""; return; }
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
  // The count is the project's own size and is free. The three amounts are `costs`, which
  // is Pro: for a level that does not reach it they are not written at all — the elements
  // are emptied and wsProjectCosts() is never asked. A figure computed and then covered up
  // is a figure sitting in the page for anybody who opens the inspector.
  document.getElementById("ws-project-count").textContent = String(wsEstimations(project.id).length);
  const fig = (id, text) => { document.getElementById(id).textContent = text; };
  if (wsCanCost()) {
    const costs = wsProjectCosts(project.id);
    fig("ws-project-mat", wsMoney(costs.materials, costs.currencyCode));
    fig("ws-project-other", wsMoney(costs.other, costs.currencyCode));
    fig("ws-project-total", wsMoney(costs.total, costs.currencyCode));
    document.getElementById("ws-project-mixed").hidden = !costs.mixed;
  } else {
    fig("ws-project-mat", "");
    fig("ws-project-other", "");
    fig("ws-project-total", "");
    document.getElementById("ws-project-mixed").hidden = true;
  }

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

  /* Chapter XXV's wall, from the same call every Pro page makes. Two prefixes for one
     feature: `cost` is the three figures with the wall itself beside them, `cost-other`
     is the "inne koszty" section, which has no wall of its own because one page says the
     same thing once. Both blocks ship `hidden`, so a decision that never arrives leaves
     them shut. */
  if (typeof pwMount === "function") {
    pwMount("cost", "costs");
    pwMount("cost-other", "costs");
  }
  wsGateMoneyFields();
  /* Signing in or out — in this tab or another — moves the level, and the rows on this
     screen were built for the level before it. Hiding the blocks is not enough: a project
     row, a saved calculation and a material row each carry an amount inside them, and an
     account that has just stopped being Pro would be left looking at the last figures it
     was allowed. The whole screen is drawn again, so what is on it is what this level may
     have. */
  document.addEventListener("lm-session", () => {
    wsGateMoneyFields();
    wsRenderWorkspace();
  });

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
    const fields = {
      name: get("name"),
      quantity: wsDecimal(get("quantity")),
      unit: get("unit"),
      materialCategory: get("materialCategory"),
      note: get("note"),
    };
    /* The price is `costs`, which is Pro. A level that does not reach it gets no price
       field, and this write must then leave the stored amount exactly where it is: a
       missing field read as a zero would erase the price of every row a Pro account had
       already put one on, the moment that account went back to free. Not passing the key
       at all is what wsUpdateItem() reads as "unchanged". */
    if (wsCanCost()) {
      // The quantity above is applied first, so the cost is this price times the quantity
      // the visitor is looking at — chapter XVII's "7 × 35 PLN = 245 PLN".
      fields.priceMajor = wsDecimal(get("priceMajor"));
    }
    // The store fires `workspacechange`, which redraws the screen — so what appears is what
    // was actually written, not what was typed at it.
    if (!wsUpdateItem(li.dataset.id, fields)) wsRenderWorkspace();
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
      // A hand-typed material is `shopping` and free; the price on it is `costs` and is
      // not. A level that does not reach the price gets a row with none rather than a
      // refusal to add the material at all.
      priceMajor: wsCanCost() ? wsDecimal(el("ws-mat-price").value) : 0,
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
    // An "inne koszty" line is an amount and nothing else, so the whole write is `costs`.
    // The section is behind the wall; this is the second guard, for the form reached
    // some other way.
    if (!name || !wsOpenId || !wsCanCost()) return;
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

/**
 * One estimate line, either as text or as the form that edits it.
 *
 * The value column is `costs` and is Pro. For a level that does not reach it the column is
 * taken out of the row entirely rather than left blank — the same rule the PDF follows for
 * a column nobody asked for, and for the same reason: a header with nothing under it
 * promises a figure the page is not going to print. wsRenderEstimate() takes the matching
 * header and the colspan of the empty row with it.
 */
function wsEstimateRow(r, i) {
  const money = wsCanCost();
  if (r.id !== wsEditingId) {
    return `<tr data-id="${wsEsc(r.id)}">
        <td>${i + 1}</td>
        <td>${wsEsc(r.name)}</td>
        <td class="num">${wsNum(r.requiredUnits)} ${wsEsc(r.unitLabel)}</td>
        ${money ? `<td class="num">${wsEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</td>` : ""}
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
      ${money ? `<td class="num"><input type="text" inputmode="decimal" class="ws-qty" data-f="cost" value="${(r.totalCostMinor / 100).toFixed(2)}" aria-label="${wsEsc(wsT("ws_col_cost"))}"></td>` : ""}
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
  const money = wsCanCost();
  const project = wsActiveProject();
  const rows = project ? wsEstimations(project.id) : [];
  // The total is not computed for a level that may not see it. wsProjectTotal() counts
  // money and nothing else, so there is nothing in it worth having without the money.
  const total = project && money
    ? wsProjectTotal(project.id)
    : { minor: 0, currencyCode: "", count: rows.length };

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

  // The value column goes with the values: header, cells and the width of the empty row.
  const head = wrap.querySelector(`.ws-table thead th.num + th.num`);
  if (head) head.hidden = !money;
  const body = document.getElementById("ws-estimate-rows");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="${money ? 5 : 4}" class="muted">${wsEsc(wsT("ws_empty_estimate"))}</td></tr>`;
  } else {
    body.innerHTML = rows.map((r, i) => wsEstimateRow(r, i)).join("");
  }
  // The line and the total under it are two halves of one figure, so they are withheld
  // together: no sum is printed, and the paragraph carrying it is taken off the page
  // rather than left showing a currency with nothing in front of it.
  const sum = wrap.querySelector(".ws-estimate-total");
  if (sum) sum.hidden = !money;
  document.getElementById("ws-estimate-total").textContent =
    money ? wsMoney(total.minor, total.currencyCode) : "";
  document.getElementById("ws-estimate-count").textContent = `${total.count} ${wsUnit("ws_lines", total.count)}`;

  // Lines saved in different currencies do not add up, and the sum above says so.
  const mixed = document.getElementById("ws-estimate-mixed");
  if (mixed) mixed.hidden = !money || !total.mixed;
}

function buildEstimatePage() {
  const wrap = document.getElementById("ws-estimate");
  if (!wrap) return;

  /* Chapter XXV's wall stands where the two export buttons are: `#cost-tool` holds them
     and `#cost-gate` is drawn instead. The page around it is untouched — the list of what
     was counted is `shopping`, and it stays open to everybody. */
  if (typeof pwMount === "function") pwMount("cost", "costs");
  wsGateMoneyFields();
  document.addEventListener("lm-session", () => { wsGateMoneyFields(); wsRenderEstimate(); });

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
      const field = (f) => tr.querySelector(`[data-f="${f}"]`);
      const get = (f) => { const el = field(f); return el ? el.value : ""; };
      wsEditingId = "";
      const fields = {
        name: get("name").trim(),
        requiredUnits: wsDecimal(get("qty")),
        unitLabel: get("unit").trim(),
      };
      /* The cost field only exists for a level that reaches `costs`. Leaving the key out
         is what wsUpdateEstimation() reads as "unchanged", so correcting a line's name on
         a free account cannot quietly zero the amount somebody put on it while they had
         Pro. */
      if (wsCanCost()) fields.costMajor = wsDecimal(get("cost"));
      wsUpdateEstimation(id, fields);
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
      // The line itself is a name and a quantity, which is `shopping` and free. The
      // amount on it is `costs`: a level that does not reach it writes a line with no
      // money on it rather than being refused the line.
      costMajor: wsCanCost() ? wsDecimal(document.getElementById("ws-line-cost").value) : 0,
    });
    name.value = "";
    document.getElementById("ws-line-cost").value = "";
  });

  const picker = document.getElementById("ws-estimate-project");
  if (picker) picker.addEventListener("change", () => wsSetActiveProject(picker.value));

  const print = document.getElementById("ws-estimate-print");
  // No PDF library: the browser's own "print to PDF" produces a smaller, selectable file
  // than a canvas render would, and @media print in styles.css is what shapes the page.
  // It is the second way to a PDF on this site, so it asks the same question the
  // configurator on /projekty/ does, and it asks it here as well as behind the wall.
  if (print) print.addEventListener("click", () => { if (wsCanPdf()) window.print(); });

  const csv = document.getElementById("ws-estimate-csv");
  if (csv) csv.addEventListener("click", () => {
    // The file is a priced estimate with the prices in a column of their own, so it is
    // `costs` exactly as the screen it comes from is.
    if (!wsCanCost()) return;
    const project = wsActiveProject();
    const rows = project ? wsEstimations(project.id) : [];
    const head = ["#", wsT("ws_col_name"), wsT("ws_col_qty"), wsT("ws_col_unit"), wsT("ws_col_cost"), "currency"];
    const body = rows.map((r, i) =>
      [i + 1, r.name, r.requiredUnits, r.unitLabel, (r.totalCostMinor / 100).toFixed(2), r.currencyCode]);
    const text = [head, ...body]
      .map((line) => line.map((cell) => `"${wsCsvCell(cell)}"`).join(";"))
      .join("\r\n");
    wsDownload(wsFileName(project && project.name, "kosztorys", "csv"),
      "text/csv;charset=utf-8", "﻿" + text);
  });

  document.addEventListener("workspacechange", wsRenderEstimate);
  wsRenderEstimate();
}

/**
 * One cell of the CSV, quoted — and never a formula (session 35).
 *
 * A spreadsheet reads a cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage
 * return as a formula, quotes or no quotes, and this file is written to be handed to
 * somebody else: the material names in it were typed on a phone, or came down from the
 * account, and "=HYPERLINK(...)" is a name a row can carry. An apostrophe in front is
 * what every spreadsheet reads as "this is text"; it is one character, it is visible,
 * and it beats the alternative, which is a file that runs.
 */
function wsCsvCell(cell) {
  const value = String(cell == null ? "" : cell);
  const armed = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
  return armed.replace(/"/g, '""');
}

/**
 * A file name built out of something the visitor typed.
 *
 * A project called `../../etc/passwd` or one carrying a newline is not a download the
 * browser should be asked to name a file after: `a.download` is a *suggestion*, browsers
 * sanitise it differently, and the one thing this side can do is not hand over a
 * separator in the first place. Everything but a letter, a digit, a dash and a space
 * becomes a dash; the result is trimmed, capped and falls back to the plain word.
 */
function wsFileName(name, fallback, extension) {
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
  buildProjectsPage();
  buildEstimatePage();
});

/* Saved lines keep the currency they were priced in, but a new line is stamped with the
   one in force — so every list that prints money is redrawn when the visitor switches. */
document.addEventListener("currencychange", () => {
  wsRenderWorkspace();
  wsRenderEstimate();
});
