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
 *   ...sync     { createdAt, updatedAt, deletedAt, schemaVersion }
 *
 * Money is minor units (grosze) and an integer, never a Double — the Money rule from the
 * app holds here too. Deleting writes a tombstone rather than dropping the row, so a
 * later sign-in tells the phone about the deletion instead of resurrecting the row.
 */

const WS_KEY = "materio-workspace-v1";
const WS_ACTIVE_KEY = "materio-active-project";
const WS_SCHEMA = 1;

/** Same currency table as assets/calculators.js — the language picks the currency. */
const WS_CURRENCY = {
  pl: ["pl-PL", "PLN"], en: ["en-US", "USD"], de: ["de-DE", "EUR"], cs: ["cs-CZ", "CZK"],
  sk: ["sk-SK", "EUR"], ro: ["ro-RO", "RON"], hr: ["hr-HR", "EUR"], sr: ["sr-RS", "RSD"],
  uk: ["uk-UA", "UAH"], ru: ["ru-RU", "RUB"],
};

/** The four engines the app knows (core/model/CalculationType.kt), by site engine id. */
const WS_CALC_TYPE = {
  coverage: "SURFACE_COVERAGE", waste: "SURFACE_WITH_WASTE", wallpaper: "SURFACE_WITH_WASTE",
  linear: "LINEAR_CUTTING", sheet: "SHEET_CUTTING", sheathing: "SURFACE_WITH_WASTE",
  concrete: "SURFACE_COVERAGE", mortar: "SURFACE_COVERAGE", screed: "SURFACE_COVERAGE",
  grout: "SURFACE_COVERAGE", masonry: "SURFACE_COVERAGE", insulation: "SURFACE_COVERAGE",
  studwall: "SURFACE_COVERAGE", ceiling: "SURFACE_COVERAGE", drylining: "SURFACE_COVERAGE",
};

/* ------------------------------------------------------------------ storage */

const wsEmpty = () => ({ projects: [], rooms: [], estimations: [] });

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

function wsProjects() {
  return wsAlive(wsLoad().projects).sort((a, b) => b.updatedAt - a.updatedAt);
}

function wsAddProject(name) {
  const data = wsLoad();
  const project = { id: wsId(), name: String(name).slice(0, 120), archived: false, ...wsSyncFields(Date.now()) };
  data.projects.push(project);
  wsSave(data);
  wsSetActiveProject(project.id);
  return project;
}

function wsRenameProject(id, name) {
  const data = wsLoad();
  const project = data.projects.find((p) => p.id === id);
  if (!project) return;
  project.name = String(name).slice(0, 120);
  project.updatedAt = Date.now();
  wsSave(data);
}

/** Tombstone the project and everything hanging off it, exactly as the app cascades. */
function wsDeleteProject(id) {
  const data = wsLoad();
  const now = Date.now();
  data.projects.filter((p) => p.id === id).forEach((p) => { p.deletedAt = now; p.updatedAt = now; });
  data.estimations.filter((e) => e.projectId === id).forEach((e) => { e.deletedAt = now; e.updatedAt = now; });
  data.rooms.filter((r) => r.projectId === id).forEach((r) => { r.projectId = null; r.updatedAt = now; });
  wsSave(data);
  if (wsActiveProjectId() === id) wsSetActiveProject((wsProjects()[0] || {}).id || "");
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

/* ------------------------------------------------------------------ rooms */

function wsRooms() {
  return wsAlive(wsLoad().rooms).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Clamp to the ranges the security rules accept (FIRESTORE_SYNC §2, rooms). */
const wsDim = (v, max) => Math.min(Math.max(Number(v) || 0, 0), max);

function wsAddRoom(name, lengthM, widthM, heightM, projectId) {
  const data = wsLoad();
  const room = {
    id: wsId(),
    name: String(name).slice(0, 120),
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

function wsUpdateRoom(id, fields) {
  const data = wsLoad();
  const room = data.rooms.find((r) => r.id === id);
  if (!room) return;
  if (fields.name !== undefined) room.name = String(fields.name).slice(0, 120);
  if (fields.lengthM !== undefined) room.lengthM = wsDim(fields.lengthM, 1000);
  if (fields.widthM !== undefined) room.widthM = wsDim(fields.widthM, 1000);
  if (fields.heightM !== undefined) room.heightM = wsDim(fields.heightM, 100);
  if (fields.projectId !== undefined) room.projectId = fields.projectId || null;
  room.updatedAt = Date.now();
  wsSave(data);
}

function wsDeleteRoom(id) {
  const data = wsLoad();
  const room = data.rooms.find((r) => r.id === id);
  if (!room) return;
  room.deletedAt = Date.now();
  room.updatedAt = room.deletedAt;
  wsSave(data);
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
 * Save one calculator result as an estimate line in the active project.
 *
 * @param {object} r  { calcId, name, requiredUnits, unitLabel, costMajor, wastePercent, input }
 */
function wsAddEstimation(r) {
  let projectId = wsActiveProjectId();
  if (!projectId) projectId = wsAddProject(r.projectName || "LiczMat").id;

  const lang = document.documentElement.lang || "pl";
  const currencyCode = (WS_CURRENCY[lang] || WS_CURRENCY.pl)[1];
  const totalCostMinor = wsMinor(r.costMajor);
  const waste = Number(r.wastePercent) || 0;

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
    inputJson: JSON.stringify(r.input || {}).slice(0, 20000),
    ...wsSyncFields(Date.now()),
  };
  data.estimations.push(row);
  wsSave(data);
  return row;
}

/**
 * A line typed by hand rather than produced by a calculator: labour, delivery, a bag of
 * something bought by eye. Same document as any other estimate line, so it syncs and
 * prints with the rest; `calculationType` has to be one of the four the app knows, and
 * SURFACE_COVERAGE is the closest thing to "no engine".
 */
function wsAddManualEstimation({ name, requiredUnits, unitLabel, costMajor }) {
  return wsAddEstimation({
    calcId: "coverage",
    name,
    requiredUnits,
    unitLabel,
    costMajor,
    wastePercent: 0,
    input: { manual: true },
  });
}

/** Correct a line in place. Anything not passed keeps its current value. */
function wsUpdateEstimation(id, fields) {
  const data = wsLoad();
  const row = data.estimations.find((e) => e.id === id);
  if (!row) return;
  if (fields.name !== undefined) row.name = String(fields.name).slice(0, 120);
  if (fields.requiredUnits !== undefined) row.requiredUnits = Math.max(0, Math.round(Number(fields.requiredUnits) || 0));
  if (fields.unitLabel !== undefined) row.unitLabel = String(fields.unitLabel).slice(0, 24);
  if (fields.costMajor !== undefined) {
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

/** Total of one project's lines. Mixed currencies keep the first one seen. */
function wsProjectTotal(projectId) {
  const rows = wsEstimations(projectId);
  const lang = document.documentElement.lang || "pl";
  return {
    minor: rows.reduce((sum, r) => sum + (r.totalCostMinor || 0), 0),
    currencyCode: (rows[0] && rows[0].currencyCode) || (WS_CURRENCY[lang] || WS_CURRENCY.pl)[1],
    count: rows.length,
  };
}

/** Money for display, from minor units. */
function wsMoney(minor, currencyCode) {
  const lang = document.documentElement.lang || "pl";
  const [loc, fallback] = WS_CURRENCY[lang] || WS_CURRENCY.pl;
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency: currencyCode || fallback })
      .format(minor / 100);
  } catch (e) {
    return (minor / 100).toFixed(2);
  }
}

/** Everything, tombstones included — what /app/ uploads and what the export button writes. */
const wsExport = () => ({ ...wsLoad(), exportedAt: Date.now(), schemaVersion: WS_SCHEMA });

/**
 * Merge an exported workspace back in, last-write-wins on `updatedAt` with ties going to
 * the incoming copy — the same rule as SyncContract.remoteWins().
 */
function wsImport(incoming) {
  const data = wsLoad();
  ["projects", "rooms", "estimations"].forEach((key) => {
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
