/* LiczMat website — the local workspace: projects, rooms and saved estimates.
 *
 * Deliberately local-first and account-free. Counting never requires signing in
 * (FIRESTORE_SYNC §1.2), so the browser keeps the same documents the Android app keeps,
 * in localStorage, and /app/ pushes them to Firestore once somebody does sign in.
 *
 * The document shapes are the ones in docs/FIRESTORE_SYNC.md (app repo) — same field
 * names, same units, same tombstone rule — so a local row can be uploaded as-is:
 *
 *   project     { id, name, archived, ...sync }
 *   room        { id, name, lengthM, widthM, heightM, ...sync }
 *   estimation  { id, projectId, name, calculationType, materialCategory, requiredUnits,
 *                 unitLabel, totalCostMinor, wastePercentage, wasteCostMinor,
 *                 currencyCode, inputJson, ...sync }
 *   shoppingItem{ id, projectId, estimationId, name, materialCategory, quantity, unit,
 *                 estimatedCostMinor, currencyCode, isPurchased, note, ...sync }
 *   ...sync     { createdAt, updatedAt, deletedAt, schemaVersion }
 *
 * Money is minor units (grosze) and an integer, never a Double — the Money rule from the
 * app holds here too. Deleting writes a tombstone rather than dropping the row, so a
 * later sign-in tells the phone about the deletion instead of resurrecting the row.
 */

const WS_KEY = "materio-workspace-v1";
const WS_ACTIVE_KEY = "materio-active-project";
const WS_SCHEMA = 1;

/**
 * Version of the snapshot a saved calculation carries inside `inputJson` (session 16).
 *
 * Chapter XV asks a saved line to answer five questions later: which calculator, what was
 * typed, what came out, in what unit, and when. The estimate document has room for none of
 * that — `calculationType` is one of four coarse engines, so tiles, mortar and screed are
 * all "SURFACE_COVERAGE" — and a field invented at the top level would be erased without a
 * word by the phone's next push, exactly as a project description would be
 * (SyncContract.estimationToDoc() builds the document from a fixed map).
 *
 * `inputJson` is the one field that is already contract, already a free-form string and
 * already round-trips: it is a column on `EstimationEntity`, the app writes its own
 * snapshot into it with `ignoreUnknownKeys = true` and never reads a foreign one back. So
 * the snapshot goes in there, under `_lm`, beside the flat field map that was there
 * before — nothing that read `json.area` stops working.
 */
const WS_SNAPSHOT = 1;

/* The currency comes from assets/currency.js — the visitor's choice, independent of the
   language. A line is stamped with the currency in force when it was saved and keeps it
   for good: an estimate priced in PLN stays in PLN after a switch to EUR, because there
   is no exchange rate here and inventing one would silently falsify a saved quote. */
const WS_FALLBACK_CURRENCY = "PLN";
const wsCurrency = () => (typeof lmCurrency === "function" ? lmCurrency() : WS_FALLBACK_CURRENCY);

/** The four engines the app knows (core/model/CalculationType.kt), by site engine id. */
const WS_CALC_TYPE = {
  coverage: "SURFACE_COVERAGE", waste: "SURFACE_WITH_WASTE", wallpaper: "SURFACE_WITH_WASTE",
  linear: "LINEAR_CUTTING", sheet: "SHEET_CUTTING", sheathing: "SURFACE_WITH_WASTE",
  concrete: "SURFACE_COVERAGE", mortar: "SURFACE_COVERAGE", screed: "SURFACE_COVERAGE",
  grout: "SURFACE_COVERAGE", masonry: "SURFACE_COVERAGE", insulation: "SURFACE_COVERAGE",
  studwall: "SURFACE_COVERAGE", ceiling: "SURFACE_COVERAGE", drylining: "SURFACE_COVERAGE",
};

/* ------------------------------------------------------------------ storage */

const wsEmpty = () => ({ projects: [], rooms: [], estimations: [], shoppingItems: [] });

/** Read the whole workspace. A corrupt or absent store reads as an empty one. */
function wsLoad() {
  try {
    const raw = localStorage.getItem(WS_KEY);
    if (!raw) return wsEmpty();
    const data = JSON.parse(raw);
    return {
      projects: Array.isArray(data.projects) ? data.projects : [],
      rooms: Array.isArray(data.rooms) ? data.rooms : [],
      estimations: Array.isArray(data.estimations) ? data.estimations : [],
      // Absent in every workspace written before session 17, which is why it is read the
      // same defensive way as the other three rather than assumed into existence.
      shoppingItems: Array.isArray(data.shoppingItems) ? data.shoppingItems : [],
    };
  } catch (e) {
    return wsEmpty();
  }
}

function wsSave(data) {
  try {
    localStorage.setItem(WS_KEY, JSON.stringify(data));
  } catch (e) {
    // Private mode or a full quota: the calculators keep working, nothing is saved.
    return false;
  }
  document.dispatchEvent(new CustomEvent("workspacechange"));
  return true;
}

const wsId = () => (crypto.randomUUID ? crypto.randomUUID()
  : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

const wsSyncFields = (createdAt, deletedAt) =>
  ({ createdAt, updatedAt: Date.now(), deletedAt: deletedAt || null, schemaVersion: WS_SCHEMA });

/** Live rows only — tombstones stay in storage so a later sync can carry them up. */
const wsAlive = (rows) => rows.filter((r) => !r.deletedAt);

/* ------------------------------------------------------------------ projects */

/**
 * Every project that still exists, archived ones included, newest change first.
 *
 * The two lists below are the ones pages ask for. This one is what a lookup by id needs:
 * an archived project is not a deleted project, so opening it, renaming it or taking it
 * back out of the archive all have to keep working.
 */
function wsAllProjects() {
  return wsAlive(wsLoad().projects).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * The working set: what the picker, the dashboard and "the active project" mean.
 *
 * Archiving is the answer to a project that is finished but worth keeping — chapter XIV
 * makes the project the centre of the free account, and a centre that only grows is a
 * list nobody reads by the tenth bathroom. `archived` has been in the document shape and
 * in the security rules since the first sync; until session 15 nothing ever set it.
 */
const wsProjects = () => wsAllProjects().filter((p) => !p.archived);

/** The other half of the same list. /projekty/ shows it folded away. */
const wsArchivedProjects = () => wsAllProjects().filter((p) => p.archived);

/** One project by id, archived or not. Null when it never existed or was deleted. */
const wsProject = (id) => wsAllProjects().find((p) => p.id === id) || null;

function wsAddProject(name) {
  const data = wsLoad();
  const project = { id: wsId(), name: String(name).slice(0, 120), archived: false, ...wsSyncFields(Date.now()) };
  data.projects.push(project);
  wsSave(data);
  wsSetActiveProject(project.id);
  return project;
}

/**
 * Correct a project in place. Anything not passed keeps its current value.
 *
 * Only the two fields the sync contract carries — `name` and `archived`. A project also
 * has a description, notes and a history in chapter XIV; none of them is in
 * `SyncContract.projectToDoc()` in the app repo, and the phone rewrites the whole
 * document on its next push, so a field invented here would be erased without a word.
 * See the report for session 15: that is a change to the contract, not to this file.
 */
function wsUpdateProject(id, fields) {
  const data = wsLoad();
  const project = data.projects.find((p) => p.id === id && !p.deletedAt);
  if (!project) return null;
  if (fields.name !== undefined) {
    const name = String(fields.name).trim().slice(0, 120);
    if (!name) return null; // a project with no name is a row nobody can tell apart
    project.name = name;
  }
  if (fields.archived !== undefined) project.archived = Boolean(fields.archived);
  project.updatedAt = Date.now();
  wsSave(data);
  // The active project is the one every new estimate line lands in, so it can never be
  // one the visitor has just put away. wsActiveProjectId() resolves to a project that is
  // still in the working set, so writing that answer back is the whole handoff.
  if (project.archived) wsSetActiveProject(wsActiveProjectId());
  return project;
}

const wsRenameProject = (id, name) => wsUpdateProject(id, { name });
const wsArchiveProject = (id, on) => wsUpdateProject(id, { archived: on !== false });

/**
 * Tombstone the project, its estimate lines and its materials, exactly as the app cascades.
 *
 * Both subcollections go, because both are subcollections: in Room they hang off `projects`
 * with `ForeignKey(onDelete = CASCADE)`, and `ProjectRepository.recordTombstones()` writes a
 * tombstone for the estimations *and* the shopping items of every project it deletes —
 * otherwise the next pull from another device puts the materials back under a project that
 * no longer exists.
 *
 * Rooms are deliberately left alone, and session 20 — which is what put a room on a
 * project screen — kept it that way. They used to be unlinked here, which threw away the
 * one fact needed to put the project back. Beyond that, the phone does not cascade them
 * either: `recordTombstones()` walks the estimations and the shopping items of every
 * project it deletes and stops there, because rooms are not a subcollection of a project
 * at all (FIRESTORE_SYNC §2). Deleting rooms here would mean one click doing two different
 * things on two devices — session 17's argument, unchanged. A room is a physical place; it
 * survives the project measured for it, keeps its `projectId`, and comes back with it.
 *
 * @returns {{id: string, at: number, lines: string[], items: string[]}|null} what was
 *   tombstoned. Hand it to wsRestoreProject() to undo exactly this delete and nothing else.
 */
function wsDeleteProject(id) {
  const data = wsLoad();
  const project = data.projects.find((p) => p.id === id && !p.deletedAt);
  if (!project) return null;
  const now = Date.now();
  project.deletedAt = now;
  project.updatedAt = now;
  const lines = data.estimations.filter((e) => e.projectId === id && !e.deletedAt);
  lines.forEach((e) => { e.deletedAt = now; e.updatedAt = now; });
  const items = data.shoppingItems.filter((s) => s.projectId === id && !s.deletedAt);
  items.forEach((s) => { s.deletedAt = now; s.updatedAt = now; });
  wsSave(data);
  // The stored id is now a tombstone. wsActiveProjectId() already resolves past it, so
  // writing that answer back is the handoff — and it has to be unconditional: comparing
  // the stored id with the deleted one has just stopped matching, because the resolution
  // moved on the moment the row was tombstoned, leaving the deleted id in storage.
  wsSetActiveProject(wsActiveProjectId());
  return { id, at: now, lines: lines.map((e) => e.id), items: items.map((s) => s.id) };
}

/**
 * Undo one delete.
 *
 * A tombstone is a row with a `deletedAt`, not a row that is gone (FIRESTORE_SYNC §3), so
 * putting a project back is clearing that field. What comes back with it is named by the
 * token the delete handed out, not worked out again here: a line the visitor deleted by
 * hand stays deleted, because they asked for that separately, and naming the rows means
 * two deletes in the same millisecond cannot be confused for each other.
 *
 * `updatedAt` moves to now, so a phone that already heard about the delete hears about
 * the undo as well instead of re-deleting the row on the next sync.
 *
 * @param {{id: string, lines: string[], items: string[]}|string} token what
 *   wsDeleteProject() returned. A bare id restores the project on its own, which is what a
 *   project with no lines and no materials is.
 */
function wsRestoreProject(token) {
  const id = typeof token === "string" ? token : (token && token.id);
  const lines = (token && token.lines) || [];
  const items = (token && token.items) || [];
  if (!id) return null;
  const data = wsLoad();
  const project = data.projects.find((p) => p.id === id);
  if (!project || !project.deletedAt) return null;
  const now = Date.now();
  project.deletedAt = null;
  project.updatedAt = now;
  const revive = (rows, ids) => {
    const wanted = new Set(ids);
    rows.filter((r) => wanted.has(r.id) && r.projectId === id)
      .forEach((r) => { r.deletedAt = null; r.updatedAt = now; });
  };
  revive(data.estimations, lines);
  revive(data.shoppingItems, items);
  wsSave(data);
  return project;
}

function wsActiveProjectId() {
  let id = "";
  try { id = localStorage.getItem(WS_ACTIVE_KEY) || ""; } catch (e) { id = ""; }
  const list = wsProjects();
  if (id && list.some((p) => p.id === id)) return id;
  return list.length ? list[0].id : "";
}

function wsSetActiveProject(id) {
  try { localStorage.setItem(WS_ACTIVE_KEY, id || ""); } catch (e) {}
  document.dispatchEvent(new CustomEvent("workspacechange"));
}

const wsActiveProject = () => wsProjects().find((p) => p.id === wsActiveProjectId()) || null;

/* ------------------------------------------------------------------ rooms
 *
 * Chapter XVIII: "Pomieszczenia są elementem projektu." The sync contract says the
 * opposite in as many words — rooms are `users/{uid}/rooms/{roomId}`, a collection
 * **beside** projects rather than a subcollection of one, and FIRESTORE_SYNC §2 gives the
 * reason: "Wybór pokoju i wybór kalkulatora to dwie niezależne osie — dlatego pokoje
 * siedzą obok projektów, nie w nich." A room is a physical place; it outlives the project
 * measured for it, and one room can be measured for several.
 *
 * Both hold, because the link is a field and the field survives. `projectId` is not in the
 * contract — `RoomEntity` has no column for it, `SyncContract.roomToDoc()` never writes
 * one, `validRoom()` validates none — and it is carried anyway, for the three reasons
 * session 18 established for a material's note and this session re-checked in
 * `3d-polednia/Materio` for rooms specifically:
 *
 *   - `CloudSync.pushLocal()` writes every room with
 *     `.set(SyncContract.roomToDoc(...), SetOptions.merge())`, and a merge writes only the
 *     keys it is handed, so the fixed map cannot erase a key it does not mention;
 *   - the deployed rules validate `validRoom()` by shape and have no `hasOnly`, so the
 *     write is accepted;
 *   - `roomFromDoc()` reads by key and ignores what it does not know, so the phone's copy
 *     of the room is unharmed.
 *
 * What it does not buy is visibility: the phone has no column for `projectId`, so a room
 * there is still a room in one flat list. The link is carried, not shown — the same honest
 * claim the note gets, and the page says so.
 *
 * This file has written `projectId` onto every room since the workspace existed and has
 * never read it back; `/app/` did not even send it, so the link died at the browser's
 * edge. Session 20 sends it, reads it, and lets it be changed.
 */

/**
 * The rooms of one project, or every live room when no project is named.
 *
 * A room whose project was deleted keeps naming it — that is what makes the undo exact —
 * and stays in the flat list. Nothing draws a deleted project's rooms, because nothing
 * draws a deleted project; the index simply stops printing a name it can no longer look
 * up. See wsDeleteProject(): a room is a place, not a line of the project's paperwork.
 */
function wsRooms(projectId) {
  const rows = wsAlive(wsLoad().rooms).sort((a, b) => b.updatedAt - a.updatedAt);
  return projectId ? rows.filter((r) => r.projectId === projectId) : rows;
}

/** One room by id, or null. */
const wsRoom = (id) => wsRooms().find((r) => r.id === id) || null;

/** Clamp to the ranges the security rules accept (FIRESTORE_SYNC §2, rooms). */
const wsDim = (v, max) => Math.min(Math.max(Number(v) || 0, 0), max);

/**
 * Add a room, optionally to a project.
 *
 * The positional form is the one the index's form has always used. A room with no name is
 * a row nobody can tell apart, so it is refused rather than saved blank — the same rule a
 * project and a material get.
 */
function wsAddRoom(name, lengthM, widthM, heightM, projectId) {
  const clean = String(name || "").trim().slice(0, 120);
  if (!clean) return null;
  const data = wsLoad();
  const room = {
    id: wsId(),
    name: clean,
    lengthM: wsDim(lengthM, 1000),
    widthM: wsDim(widthM, 1000),
    heightM: wsDim(heightM, 100),
    projectId: projectId || null,
    ...wsSyncFields(Date.now()),
  };
  data.rooms.push(room);
  wsSave(data);
  return room;
}

/** Correct a room in place. Anything not passed keeps its current value. */
function wsUpdateRoom(id, fields) {
  const data = wsLoad();
  const room = data.rooms.find((r) => r.id === id && !r.deletedAt);
  if (!room) return null;
  if (fields.name !== undefined) {
    const name = String(fields.name).trim().slice(0, 120);
    if (!name) return null;
    room.name = name;
  }
  if (fields.lengthM !== undefined) room.lengthM = wsDim(fields.lengthM, 1000);
  if (fields.widthM !== undefined) room.widthM = wsDim(fields.widthM, 1000);
  if (fields.heightM !== undefined) room.heightM = wsDim(fields.heightM, 100);
  if (fields.projectId !== undefined) room.projectId = fields.projectId || null;
  room.updatedAt = Date.now();
  wsSave(data);
  return room;
}

/** Tombstone one room. Same rule as everywhere else: the row stays, `deletedAt` moves. */
function wsDeleteRoom(id) {
  const data = wsLoad();
  const room = data.rooms.find((r) => r.id === id && !r.deletedAt);
  if (!room) return null;
  room.deletedAt = Date.now();
  room.updatedAt = room.deletedAt;
  wsSave(data);
  return room;
}

/** Floor, wall and ceiling areas of a room, plus its perimeter and volume. */
function wsRoomAreas(room) {
  const L = Number(room.lengthM) || 0, W = Number(room.widthM) || 0, H = Number(room.heightM) || 0;
  return { floor: L * W, ceiling: L * W, walls: 2 * (L + W) * H, perimeter: 2 * (L + W), volume: L * W * H, L, W, H };
}

/**
 * What a room writes into one calculator, for the chosen surface.
 *
 * A room knows its dimensions, never its openings or its material — those stay whatever
 * the visitor typed. `surface` is "floor", "walls" or "ceiling".
 */
function wsRoomFill(room, calcId, surface) {
  const a = wsRoomAreas(room);
  const area = surface === "walls" ? a.walls : a.floor;
  switch (calcId) {
    case "wallpaper":
      return { wallW: a.perimeter, wallH: a.H };
    case "studwall":
      return { width: a.L, height: a.H };
    case "ceiling":
      return { width: a.W, length: a.L };
    case "concrete":
      return {};
    case "linear":
    case "sheet":
      return {};
    default:
      return { area };
  }
}

/* ------------------------------------------------------------------ estimates */

function wsEstimations(projectId) {
  const rows = wsAlive(wsLoad().estimations);
  return (projectId ? rows.filter((e) => e.projectId === projectId) : rows)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** Minor units, rounded once, never carried as a float (the Money rule from the app). */
const wsMinor = (major) => Math.round((Number(major) || 0) * 100);

/**
 * May this browser store an amount somebody typed? — `costs` in LM_FEATURES, PRO since
 * the owner's decision of 2026-09-03.
 *
 * Four writes ask it, and they are the four that take a price out of a form: the "inne
 * koszty" line, the correction of one, the hand-added material and the correction of one.
 * The screens ask before they call; the store asks as well, because a gate that only
 * exists at the call site is a gate that a second call site — or one line in a console —
 * walks round.
 *
 * **What it does not gate, deliberately:**
 *
 *   wsAddEstimation() and wsAddItem()   the calculator's own result, saved into a project
 *                                       from a calculator page. Chapter II keeps counting
 *                                       free, those pages load no paywall at all, and the
 *                                       amount is the calculator's rather than something
 *                                       typed at a form. It is stored and never shown: the
 *                                       screens refuse to print it, and a visitor who
 *                                       later pays for Pro finds their own figures intact
 *                                       rather than a project full of zeroes.
 *   every read                          a store that answered two ways about rows already
 *                                       on this device would be a second source of truth.
 *
 * A refusal is never a lost row: the caller gets the line, the material and the name it
 * asked for, with the money left at zero on a new row and untouched on an existing one.
 * Zeroing a price a Pro account had already stored, because the plan lapsed, would be this
 * gate destroying somebody's work instead of withholding a feature.
 *
 * A missing pwAllows() is a refusal, for the reason pwState() in assets/paywall.js closes.
 * The session hint is never read here: a hint that may be stale must not be what decides a
 * write (scripts/test-security.mjs §9), and pwAllows() owns that reading.
 *
 * Nothing here is a security boundary — see the note at the top of assets/plan.js.
 */
function wsCanPrice() {
  return typeof pwAllows === "function" && pwAllows("costs");
}

/** The contract's ceiling on `inputJson` (FIRESTORE_SYNC §2): a hard limit in the rules. */
const WS_INPUT_MAX = 20000;

/**
 * The input map plus the snapshot, as one JSON string that fits.
 *
 * Cutting a JSON string to length leaves a broken one, so nothing here ever does: an
 * oversized line drops the snapshot first (the fields are the part the visitor typed), and
 * an input map that is somehow oversized on its own drops down to the snapshot alone. The
 * only calculators that can approach the limit are the two cutting lists, which are free
 * text — a thousand pieces is a real, if rare, list.
 */
function wsInputJson(input, snapshot) {
  const full = JSON.stringify(snapshot ? { ...input, _lm: snapshot } : { ...input });
  if (full.length <= WS_INPUT_MAX) return full;
  const bare = JSON.stringify({ ...input });
  if (bare.length <= WS_INPUT_MAX) return bare;
  const meta = JSON.stringify(snapshot ? { _lm: snapshot } : {});
  return meta.length <= WS_INPUT_MAX ? meta : "{}";
}

/**
 * What was saved, as the line itself recorded it — or null for a line saved before
 * session 16, or one whose snapshot did not survive the size limit.
 *
 * Nothing that reads this may assume a shape: the string travels through Firestore and
 * through another application, so it is parsed defensively and answers null on anything
 * that is not this site's own snapshot.
 */
function wsLineSnapshot(row) {
  try {
    const data = JSON.parse(String((row && row.inputJson) || "{}"));
    const snap = data && data._lm;
    if (!snap || snap.v !== WS_SNAPSHOT || !snap.calc) return null;
    return {
      v: snap.v,
      calc: String(snap.calc),
      at: Number(snap.at) || 0,
      fields: Array.isArray(snap.fields) ? snap.fields : [],
      rows: Array.isArray(snap.rows) ? snap.rows : [],
      unit: String(snap.unit || ""),
      tobuy: Number(snap.tobuy) || 0,
      /** The values, by field key: the flat map that has been in `inputJson` all along. */
      input: Object.fromEntries(Object.entries(data).filter(([k]) => k !== "_lm")),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Which room a saved calculation was made for — chapter XVIII: "Kalkulacje mogą być
 * przypisane do konkretnego pomieszczenia."
 *
 * **It lives inside `inputJson`, under `_room`, and it could not live anywhere else.**
 * `EstimationEntity` has a `projectId` and no `roomId`; `SyncContract.estimationToDoc()`
 * writes no such key and `validEstimation()` validates none. The merge rule means a
 * top-level field would survive the sync — that is session 18's finding and it holds here
 * — but `inputJson` is the field that is *already* free-form, already contract and already
 * round-trips, and session 16 put the calculation's whole snapshot in it for exactly that
 * reason. A second mechanism for the same job would be one more thing to keep in step.
 *
 * `_room` is a room id made by this browser, so it means nothing on the phone — which has
 * no room column on an estimation to put it in either way. The link is carried, not shown.
 * The key sits beside `manual` (session 19) at the top level of the map rather than inside
 * `_lm`, because a line typed by hand has no snapshot and may still belong to a room.
 */
function wsLineRoomId(row) {
  try {
    const id = JSON.parse(String((row && row.inputJson) || "{}"))._room;
    return typeof id === "string" && id ? id : "";
  } catch (e) {
    return "";
  }
}

/**
 * Assign a saved line to a room, or take it out of one with "".
 *
 * The rest of `inputJson` is read back and written out untouched: it carries what the
 * visitor typed and the snapshot that explains the number, and neither has anything to do
 * with which room this was. A string that will not parse is left alone rather than
 * replaced — it belongs to whoever wrote it.
 */
function wsSetLineRoom(id, roomId) {
  const data = wsLoad();
  const row = data.estimations.find((e) => e.id === id && !e.deletedAt);
  if (!row) return null;
  let json;
  try { json = JSON.parse(String(row.inputJson || "{}")); } catch (e) { return null; }
  if (!json || typeof json !== "object") return null;
  const room = roomId ? String(roomId).slice(0, 64) : "";
  if (room) json._room = room;
  else delete json._room;
  const text = JSON.stringify(json);
  // The contract's ceiling still applies. Nothing here can cut a JSON string to fit, so a
  // line already at the limit keeps the room it had rather than becoming unparseable.
  if (text.length > WS_INPUT_MAX) return null;
  row.inputJson = text;
  row.updatedAt = Date.now();
  wsSave(data);
  return row;
}

/**
 * Save one calculator result as an estimate line.
 *
 * @param {object} r  { calcId, name, requiredUnits, unitLabel, costMajor, wastePercent,
 *                      input, snapshot, projectId, roomId }
 *
 * `projectId` is the project the visitor picked under the result (chapter XV: the arrow
 * from the result goes to a project, not to wherever the last one went). Without one it is
 * the active project, and without that a first project is made, because a result that
 * cannot be saved until the visitor has been somewhere else first is a result they lose.
 */
function wsAddEstimation(r) {
  // An archived project takes no new lines — that is what archiving it meant — so a stale
  // picker naming one falls back to the active project rather than filing the result away.
  const picked = r.projectId ? wsProject(r.projectId) : null;
  let projectId = picked && !picked.archived ? picked.id : wsActiveProjectId();
  if (!projectId) projectId = wsAddProject(r.projectName || "LiczMat").id;

  const currencyCode = wsCurrency();
  const totalCostMinor = wsMinor(r.costMajor);
  const waste = Number(r.wastePercent) || 0;

  // Chapter XVIII's assignment, made where the result is saved. A room the project does
  // not own is dropped rather than filed: the picker is rebuilt whenever the project
  // changes, and a stale one naming somebody else's room would put the line in a place
  // the project screen will never show it.
  const room = r.roomId ? wsRoom(r.roomId) : null;
  const roomId = room && room.projectId === projectId ? room.id : "";
  const input = roomId ? { ...(r.input || {}), _room: roomId } : { ...(r.input || {}) };

  const data = wsLoad();
  const row = {
    id: wsId(),
    projectId,
    name: String(r.name || "").slice(0, 120),
    calculationType: WS_CALC_TYPE[r.calcId] || "SURFACE_COVERAGE",
    materialCategory: r.materialCategory || "OTHER",
    requiredUnits: Math.round(Number(r.requiredUnits) || 0),
    unitLabel: String(r.unitLabel || "").slice(0, 24),
    totalCostMinor,
    wastePercentage: waste,
    wasteCostMinor: Math.round(totalCostMinor * waste / 100),
    currencyCode,
    inputJson: wsInputJson(input, r.snapshot || null),
    ...wsSyncFields(Date.now()),
  };
  data.estimations.push(row);
  wsSave(data);

  // Chapter XVI's arrow: the result is in the project, so the material is on its list.
  // The app does exactly this and in this order — `CalculatorViewModel.save()` inserts the
  // estimation, takes the id it got back and inserts the shopping item with it — so a
  // project built on the phone and a project built here come out the same shape. The
  // quantity and the unit are the ones the result panel printed, because two different
  // answers to "how much do I buy" on two screens of one project is a defect, not a
  // feature; the app's `shoppingQuantity` is its `requiredUnits` for the same reason.
  //
  // A line typed by hand is not a material and gets none: `wsAddManualEstimation()` exists
  // for labour, delivery and a bag bought by eye, and "Robocizna · 8 h" on a shopping list
  // is worse than a short list. Chapter XVI's "dodać własny materiał" is a material added
  // as a material, which is session 18.
  if (!r.manual) {
    wsAddItem({
      projectId,
      estimationId: row.id,
      name: row.name,
      materialCategory: row.materialCategory,
      quantity: row.requiredUnits,
      unit: row.unitLabel,
      costMajor: r.costMajor,
      currencyCode,
    });
  }
  return row;
}

/**
 * A line typed by hand rather than produced by a calculator: labour, delivery, a bag of
 * something bought by eye. Same document as any other estimate line, so it syncs and
 * prints with the rest; `calculationType` has to be one of the four the app knows, and
 * SURFACE_COVERAGE is the closest thing to "no engine".
 *
 * `manual` keeps it off the material list — see wsAddEstimation() — and it is also what
 * makes the line one of chapter XVII's "inne koszty": see wsIsManualLine().
 *
 * `projectId` names the project it belongs to. Without one it is the active project, which
 * is what /kosztorys/ means by "the estimate": that page is about one project at a time.
 */
function wsAddManualEstimation({ name, requiredUnits, unitLabel, costMajor, projectId }) {
  return wsAddEstimation({
    calcId: "coverage",
    projectId,
    name,
    requiredUnits,
    unitLabel,
    // The line is `shopping` and free; the amount typed onto it is `costs` and is not.
    // A level that does not reach the money gets the row with none on it rather than a
    // refusal to add the row — see wsCanPrice() below.
    costMajor: wsCanPrice() ? costMajor : 0,
    wastePercent: 0,
    manual: true,
    input: { manual: true },
  });
}

/**
 * Whether a line was typed by hand rather than calculated — chapter XVII's "inne koszty".
 *
 * The marker is `manual` inside `inputJson`, which `wsAddManualEstimation()` has written
 * since the estimate page existed. It is read out of the document rather than kept beside
 * it because `inputJson` is contract and round-trips: a line typed on this site, pushed to
 * Firestore and pulled back on another device is still a hand-typed line.
 *
 * A line that a calculator produced answers "what did this cost and where did the number
 * come from"; this one answers neither, because nothing computed it. That is exactly what
 * separates labour and delivery from the materials on the shopping list.
 */
function wsIsManualLine(row) {
  try {
    return JSON.parse(String((row && row.inputJson) || "{}")).manual === true;
  } catch (e) {
    return false;
  }
}

/** The hand-typed lines of one project: chapter XVII's other costs, oldest first. */
const wsOtherCosts = (projectId) => wsEstimations(projectId).filter(wsIsManualLine);

/** The calculated lines of one project — the other half of the same list. */
const wsCalcLines = (projectId) => wsEstimations(projectId).filter((r) => !wsIsManualLine(r));

/** Correct a line in place. Anything not passed keeps its current value. */
function wsUpdateEstimation(id, fields) {
  const data = wsLoad();
  const row = data.estimations.find((e) => e.id === id);
  if (!row) return;
  if (fields.name !== undefined) row.name = String(fields.name).slice(0, 120);
  if (fields.requiredUnits !== undefined) row.requiredUnits = Math.max(0, Math.round(Number(fields.requiredUnits) || 0));
  if (fields.unitLabel !== undefined) row.unitLabel = String(fields.unitLabel).slice(0, 24);
  // `costs` is Pro: a level that does not reach it leaves the stored amount exactly where
  // it is, rather than writing a new one or zeroing the old one — see wsCanPrice().
  if (fields.costMajor !== undefined && wsCanPrice()) {
    row.totalCostMinor = Math.max(0, wsMinor(fields.costMajor));
    // The waste share is a percentage of the line, so it has to follow the new total.
    row.wasteCostMinor = Math.round(row.totalCostMinor * (Number(row.wastePercentage) || 0) / 100);
  }
  row.updatedAt = Date.now();
  wsSave(data);
}

function wsDeleteEstimation(id) {
  const data = wsLoad();
  const row = data.estimations.find((e) => e.id === id);
  if (!row) return;
  row.deletedAt = Date.now();
  row.updatedAt = row.deletedAt;
  wsSave(data);
}

/* --------------------------------------------------------------- material list
 *
 * Chapter XVI: KALKULATOR → WYNIK → DODAJ DO PROJEKTU → MATERIAŁ TRAFIA DO LISTY.
 *
 * The list is `shoppingItems`, a subcollection of the project, and it has been in the sync
 * contract since the first version (FIRESTORE_SYNC §2) — `ShoppingItemEntity` in Room, a
 * document under `users/{uid}/projects/{id}/shoppingItems/{itemId}` in Firestore, a
 * validated shape in the deployed security rules, and a rendered block on `/p/<token>`.
 * Nothing on this site ever wrote one, so a project made in the browser reached the phone
 * and the shared link with its material list empty, while the same project made on the
 * phone did not: `CalculatorViewModel.save()` writes the estimation **and** the shopping
 * item, in that order, linked by the estimation's id. This is the missing half.
 *
 * Two fields are worth naming, because they are the two that differ from an estimate line:
 *
 *   `quantity` is a number, not an integer. The estimate line rounds — `requiredUnits` is
 *   an Int in Room and `d.requiredUnits is int` in the rules — so a line can only ever say
 *   "19". A material may say 26,4 m², which is chapter XVI's own example.
 *
 *   `materialCategory` is a free string here and an enum name on the estimate line
 *   (`doc.string("materialCategory").orEmpty()` against
 *   `ProjectMaterialCategory.valueOf(...)`). It is the shop aisle the material is bought
 *   in, and it is what makes the list a shopping list rather than a second estimate.
 */

/**
 * The one field here the sync contract does not name — chapter XVI's "dodać notatkę".
 *
 * Sessions 15, 16 and 17 all wrote that a field invented beside the contract is erased by
 * the phone's next push, "without a word", because `SyncContract.*ToDoc()` builds the
 * document from a fixed map. **The first half is true and the conclusion was wrong**, and
 * this is the correction: `CloudSync.pushLocal()` writes every document with
 *
 *     .set(SyncContract.shoppingItemToDoc(item, estimationRemoteId), SetOptions.merge())
 *
 * and a Firestore merge writes only the keys it is given. A key the map omits is left
 * exactly as it was. Every write in `CloudSync.kt` is a merge — the pushes, the tombstones,
 * all of them — so the fixed map cannot erase what it does not mention. Read out of
 * `3d-polednia/Materio`, not assumed.
 *
 * The other three gates were checked the same way:
 *   - the deployed rules validate `validShoppingItem()` by shape and have no `hasOnly`,
 *     so the write is accepted;
 *   - `shoppingItemFromDoc()` reads by key and ignores the ones it does not know, so a
 *     note cannot crash or corrupt the phone's copy;
 *   - nothing on the phone rewrites a shopping item without a merge.
 *
 * What this does **not** buy: the phone cannot *show* the note. `ShoppingItemEntity` has no
 * column for it, so it is invisible there and absent from the app's CSV export until the app
 * repo adds one (`docs/FIRESTORE_SYNC.md`, `SyncContract.kt`, the entity, a Room migration).
 * The note is carried, not lost — that is the honest claim, and the report says so.
 */
const WS_NOTE_MAX = 500;

/**
 * The price of one unit of a material — chapter XVII: "Klej | 7 × 35 PLN | = 245 PLN".
 *
 * **Derived, never stored.** The contract has one money field on a shopping item,
 * `estimatedCostMinor`, and it is the total: `ShoppingItemEntity` has no unit price,
 * `validShoppingItem()` validates none, and `ShoppingCsvExporter` prints none. Read out of
 * `3d-polednia/Materio`, not remembered.
 *
 * A unit price kept beside the contract would survive the sync — session 18 established
 * that, and `note` is the field that proves it — but it would be free to disagree with the
 * money: the phone can change the quantity or the cost of a material without ever touching
 * a field it has no column for, and a "35 PLN each" printed next to a total that is no
 * longer 7 × 35 is worse than no unit price at all. Division cannot drift.
 *
 * It is also exact for everything this site saves: every engine in assets/calculators.js
 * computes `cost = units × price`, so dividing the total by the quantity gives back the
 * price the visitor typed into the calculator.
 *
 * @returns {number|null} minor units per one unit of the material, possibly fractional, or
 *   null when there is nothing to divide — an unpriced material, or a quantity of zero.
 */
function wsUnitPriceMinor(row) {
  const qty = Number(row && row.quantity) || 0;
  const cost = Number(row && row.estimatedCostMinor) || 0;
  if (qty <= 0 || cost <= 0) return null;
  return cost / qty;
}

/**
 * The other direction: what a quantity at a unit price comes to, in minor units.
 *
 * Rounded exactly once, at the end — the Money rule. `wsMinor()` turns the typed price into
 * whole minor units first, so 35 PLN × 7 is 24 500 and not 24 499.999999999996.
 */
const wsItemCostMinor = (priceMajor, quantity) =>
  Math.max(0, Math.round(wsMinor(priceMajor) * Math.max(0, Number(quantity) || 0)));

/** A material list, oldest first — the order the app reads it in (`ORDER BY id`). */
function wsItems(projectId) {
  const rows = wsAlive(wsLoad().shoppingItems);
  return (projectId ? rows.filter((s) => s.projectId === projectId) : rows)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** One material by id, or null. */
const wsItem = (id) => wsItems().find((s) => s.id === id) || null;

/**
 * Put one material on a project's list.
 *
 * @param {object} r { projectId, estimationId, name, materialCategory, quantity, unit,
 *                     costMajor, currencyCode, note }
 *
 * `estimationId` is what the saved calculation behind the material is called — the
 * contract's own link between the two, and the reason the list can say where a quantity
 * came from instead of being a second, unexplained set of numbers. It is null for a
 * material that was never calculated.
 *
 * A shopping item has no `createdAt` of its own in Room, so `SyncContract.shoppingItemToDoc()`
 * puts `updatedAt` in both fields. Here they start out equal for the same reason, and the
 * ordering above leans on `createdAt` staying put afterwards.
 */
function wsAddItem(r) {
  const project = r.projectId ? wsProject(r.projectId) : null;
  if (!project || project.archived) return null;

  const data = wsLoad();
  const now = Date.now();
  const row = {
    id: wsId(),
    projectId: project.id,
    // ≤ 64 characters in the rules, which every id made by crypto.randomUUID() is.
    estimationId: r.estimationId ? String(r.estimationId).slice(0, 64) : null,
    name: String(r.name || "").slice(0, 120),
    materialCategory: String(r.materialCategory || "OTHER").slice(0, 40),
    // `nonNegative(d.quantity)` in the rules, and a quantity below zero is not a purchase.
    quantity: Math.max(0, Number(r.quantity) || 0),
    unit: String(r.unit || "").slice(0, 24),
    // `costMinor` is the way in for a price the visitor typed per unit (chapter XVII); the
    // arrow from a result still hands over the total the calculator produced, in major
    // units, because that is the number the result panel printed.
    estimatedCostMinor: Math.max(0, r.costMinor !== undefined
      ? Math.round(Number(r.costMinor) || 0) : wsMinor(r.costMajor)),
    currencyCode: r.currencyCode || wsCurrency(),
    isPurchased: false,
    // Always present, even empty: the push is a merge, so a note can only be *cleared*
    // remotely by sending the empty string. A key left out stays whatever it was.
    note: String(r.note || "").slice(0, WS_NOTE_MAX),
    ...wsSyncFields(now),
  };
  data.shoppingItems.push(row);
  wsSave(data);
  return row;
}

/**
 * Correct a material in place — chapter XVI's "edytować ilość, zmienić nazwę, zmienić
 * jednostkę" plus the note, and chapter XVII's price. Anything not passed keeps its
 * current value.
 *
 * `priceMajor` is the price of **one** unit, and what is stored is the product: the
 * contract has room for the total and nothing else, so "7 × 35" is kept as 245 and read
 * back by dividing (wsUnitPriceMinor()). The quantity is applied first, which is what makes
 * chapter XVII's arithmetic behave the way the form reads: change 7 to 8 at 35 PLN and the
 * line comes to 280, because both numbers were on screen together when it was saved.
 *
 * **The currency follows the visitor only into a row that has never been priced.** Chapter
 * XVII asks for the visitor's currency; chapter VI forbids converting between currencies at
 * a rate. A row that already holds 245 PLN therefore keeps PLN when its price is edited —
 * re-stamping it EUR would turn 245 zł into 245 € without anyone typing a number — while a
 * material that was saved without a price takes the currency in force when it gets one.
 */
function wsUpdateItem(id, fields) {
  const data = wsLoad();
  const row = data.shoppingItems.find((s) => s.id === id && !s.deletedAt);
  if (!row) return null;
  if (fields.name !== undefined) {
    const name = String(fields.name).trim().slice(0, 120);
    if (!name) return null; // a material with no name is a row nobody can shop for
    row.name = name;
  }
  if (fields.quantity !== undefined) row.quantity = Math.max(0, Number(fields.quantity) || 0);
  if (fields.unit !== undefined) row.unit = String(fields.unit).trim().slice(0, 24);
  if (fields.materialCategory !== undefined) {
    row.materialCategory = String(fields.materialCategory || "OTHER").slice(0, 40);
  }
  if (fields.note !== undefined) row.note = String(fields.note).trim().slice(0, WS_NOTE_MAX);
  if (fields.isPurchased !== undefined) row.isPurchased = Boolean(fields.isPurchased);
  // The same rule as the estimate line above: the price is Pro, and a level without it
  // leaves whatever is already stored alone — see wsCanPrice().
  if (fields.priceMajor !== undefined && wsCanPrice()) {
    const cost = wsItemCostMinor(fields.priceMajor, row.quantity);
    if (!row.estimatedCostMinor) row.currencyCode = wsCurrency();
    row.estimatedCostMinor = cost;
  }
  row.updatedAt = Date.now();
  wsSave(data);
  return row;
}

/**
 * A material put on the list by hand — chapter XVI's "dodać własny materiał".
 *
 * No calculator behind it, so `estimationId` is null and the row gets no "where from" of
 * its own; that is the same answer session 16 gave a hand-typed estimate line. Everything
 * else is an ordinary material, so it syncs, prints and ticks off with the rest —
 * `priceMajor` included, which is the same unit price the edit form takes.
 */
function wsAddOwnItem({ projectId, name, materialCategory, quantity, unit, note, priceMajor }) {
  const clean = String(name || "").trim();
  if (!clean) return null;
  return wsAddItem({
    projectId: projectId || wsActiveProjectId(),
    estimationId: null,
    name: clean,
    materialCategory: materialCategory || "OTHER",
    quantity,
    unit,
    // The material is `shopping` and free; the price typed beside it is `costs` and is
    // not. A level without it gets the row with no money on it — see wsCanPrice().
    costMinor: wsCanPrice() ? wsItemCostMinor(priceMajor, quantity) : 0,
    note,
  });
}

/**
 * Tick a material off the list, or put it back — the one write that is not editing it,
 * and the one the shopping itself is made of.
 */
const wsSetItemPurchased = (id, on) => wsUpdateItem(id, { isPurchased: on !== false });

/** Tombstone one material. Same rule as everywhere else: the row stays, `deletedAt` moves. */
function wsDeleteItem(id) {
  const data = wsLoad();
  const row = data.shoppingItems.find((s) => s.id === id && !s.deletedAt);
  if (!row) return null;
  row.deletedAt = Date.now();
  row.updatedAt = row.deletedAt;
  wsSave(data);
  return row;
}

/**
 * What a project's material list adds up to.
 *
 * Same shape and the same `mixed` rule as wsProjectTotal(): amounts saved in different
 * currencies are not summable and chapter VI forbids converting them, so the interface is
 * told rather than handed a number that means nothing. `bought` is the part of the list
 * that has already been ticked off.
 */
function wsItemsTotal(projectId) {
  const rows = wsItems(projectId);
  const codes = new Set(rows.map((r) => r.currencyCode || wsCurrency()));
  return {
    minor: rows.reduce((sum, r) => sum + (r.estimatedCostMinor || 0), 0),
    currencyCode: (rows[0] && rows[0].currencyCode) || wsCurrency(),
    mixed: codes.size > 1,
    count: rows.length,
    bought: rows.filter((r) => r.isPurchased).length,
  };
}

/**
 * What a project costs — chapter XVII's three figures: the materials, the other costs and
 * the sum of the two.
 *
 * **Every amount in the project is counted exactly once.** Saving a calculation writes both
 * an estimate line and a material (chapter XVI), carrying the same money, so adding the two
 * lists together would double the bill of a project made entirely of calculations. The rule
 * is therefore: where a calculation has a material on the shopping list, the material's
 * price is the one that counts — it is the side chapter XVII lets the visitor re-price, so
 * it is the side that knows what the project will actually cost. Where it has none, the
 * calculation's own total counts, so nothing falls out of the sum:
 *
 *   materials — the shopping list, plus any calculation that never produced one (a line
 *               saved before session 17, or one whose material was taken off the list).
 *   other     — the estimate lines nothing calculated: labour, delivery, a skip. They have
 *               no material and never will, which is exactly what makes them "other".
 *
 * `byCurrency` is where the money actually is: one bucket per currency, each with its own
 * three figures. Amounts saved in different currencies are not summable and chapter VI
 * forbids converting them, so a project holding two currencies has no single materials,
 * other or total figure at all — the three come back `null`, `currencyCode` comes back
 * empty, and a caller that wants money has to reach into the buckets. That is the point:
 * a figure that is not there cannot be printed by accident, and "100 PLN + 200 EUR =
 * 300 PLN" on a document somebody shows a client is worse than no figure at all. `mixed`
 * says which of the two cases this is.
 */
function wsProjectCosts(projectId) {
  const items = wsItems(projectId);
  const lines = wsEstimations(projectId);
  const priced = new Set(items.map((r) => r.estimationId).filter(Boolean));
  const other = lines.filter(wsIsManualLine);
  const bare = lines.filter((r) => !wsIsManualLine(r) && !priced.has(r.id));

  // One bucket per currency, opened in the order the currencies first turn up — so a
  // project in one currency has one bucket, and it holds exactly the three figures the
  // single total used to. A row worth nothing still opens its bucket: it was saved in that
  // currency, and what makes a project mixed is two currencies in it, not two amounts.
  const buckets = new Map();
  const bucket = (code) => {
    const key = code || wsCurrency();
    if (!buckets.has(key)) buckets.set(key, { currencyCode: key, materials: 0, other: 0, total: 0 });
    return buckets.get(key);
  };
  items.forEach((r) => { bucket(r.currencyCode).materials += r.estimatedCostMinor || 0; });
  bare.forEach((r) => { bucket(r.currencyCode).materials += r.totalCostMinor || 0; });
  other.forEach((r) => { bucket(r.currencyCode).other += r.totalCostMinor || 0; });

  const byCurrency = [...buckets.values()];
  byCurrency.forEach((b) => { b.total = b.materials + b.other; });
  const mixed = byCurrency.length > 1;
  const one = byCurrency[0] || { currencyCode: wsCurrency(), materials: 0, other: 0, total: 0 };
  return {
    materials: mixed ? null : one.materials,
    other: mixed ? null : one.other,
    total: mixed ? null : one.total,
    currencyCode: mixed ? "" : one.currencyCode,
    byCurrency,
    mixed,
    items: items.length,
    others: other.length,
  };
}

/**
 * Total of one project's lines.
 *
 * The same rule as wsProjectCosts(), for the same reason: every currency gets its own sum
 * in `byCurrency`, and when the lines were not all saved in one currency there is no
 * `minor` to hand out — it is `null` and `currencyCode` is empty. Adding those amounts is
 * arithmetic on unlike things and chapter VI forbids converting them, so the sum does not
 * exist rather than existing and being wrong. `count` counts lines, not money, so it is
 * always there.
 */
function wsProjectTotal(projectId) {
  const rows = wsEstimations(projectId);
  const buckets = new Map();
  rows.forEach((r) => {
    const key = r.currencyCode || wsCurrency();
    buckets.set(key, (buckets.get(key) || 0) + (r.totalCostMinor || 0));
  });
  const byCurrency = [...buckets.entries()].map(([currencyCode, minor]) => ({ currencyCode, minor }));
  const mixed = byCurrency.length > 1;
  return {
    minor: mixed ? null : (byCurrency.length ? byCurrency[0].minor : 0),
    currencyCode: mixed ? "" : (byCurrency.length ? byCurrency[0].currencyCode : wsCurrency()),
    byCurrency,
    mixed,
    count: rows.length,
  };
}

/** Money for display, from minor units, in the currency the line was saved with. */
function wsMoney(minor, currencyCode) {
  if (typeof lmMoneyMinor === "function") return lmMoneyMinor(minor, currencyCode || wsCurrency());
  return (Number(minor) / 100 || 0).toFixed(2);
}

/**
 * A bucket list as words: every currency's own sum, side by side.
 *
 * The separator is a middle dot and never a plus, because the amounts were never added.
 * "100,00 zł · 200,00 €" is two answers to "what does this cost", which is the honest
 * number of answers a project in two currencies has. Buckets worth nothing are left out,
 * so a project with no money in it comes back as the empty string and every caller's
 * existing "print it only if there is something" test goes on working.
 *
 * `field` is the figure to read out of each bucket: "materials", "other" or "total" from
 * wsProjectCosts(), "minor" from wsProjectTotal(). `money` is the caller's own formatter,
 * because /klienci/, /zlecenia/ and /wyceny/ each have one of their own and none of them
 * is this file's wsMoney().
 */
function wsSumsText(byCurrency, field, money) {
  const fmt = typeof money === "function" ? money : wsMoney;
  return (byCurrency || [])
    .filter((b) => b && (b[field] || 0))
    .map((b) => fmt(b[field], b.currencyCode))
    .join(" · ");
}

/** Everything, tombstones included — what /app/ uploads and what the export button writes. */
const wsExport = () => ({ ...wsLoad(), exportedAt: Date.now(), schemaVersion: WS_SCHEMA });

/**
 * Merge an exported workspace back in, last-write-wins on `updatedAt` with ties going to
 * the incoming copy — the same rule as SyncContract.remoteWins().
 */
function wsImport(incoming) {
  const data = wsLoad();
  ["projects", "rooms", "estimations", "shoppingItems"].forEach((key) => {
    const rows = Array.isArray(incoming[key]) ? incoming[key] : [];
    rows.forEach((row) => {
      if (!row || !row.id) return;
      const i = data[key].findIndex((x) => x.id === row.id);
      if (i < 0) data[key].push(row);
      else if ((row.updatedAt || 0) >= (data[key][i].updatedAt || 0)) data[key][i] = row;
    });
  });
  wsSave(data);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { wsRoomAreas, wsRoomFill, wsMinor, WS_CALC_TYPE };
}
