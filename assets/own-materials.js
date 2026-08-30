/* LiczMat website — the visitor's own materials, and the only file that writes them.
 *
 * Finding C6 of the parity audit: the app has had "własne materiały" with a price history
 * since long before the site existed (`CustomMaterialsScreen`, `CustomMaterialEntity`,
 * `MaterialPriceEntity`), and the browser had nothing. This is that half.
 *
 * **In the sync contract since 2026-08-30.** `docs/FIRESTORE_SYNC.md` §2 in
 * `3d-polednia/Materio` defines `users/{uid}/materials/{materialId}`; the phone has Room
 * migration 7 → 8, `SyncContract.materialToDoc()` and its reader, the collection in
 * `CloudSync`, and `validMaterial()` in the deployed rules. A row here **is** that document:
 * the same field names, the same caps, the same `createdAt / updatedAt / deletedAt /
 * schemaVersion`, and a tombstone instead of a delete. Nothing is mapped on the way out.
 *
 * The price history is `prices[]` **inside** the row, because that is where the contract
 * puts it: a price point belongs to one material, nothing links to it, nothing edits one
 * once it is written, and it dies with the material. On the phone those points are a second
 * table with a foreign key; here the row is the document already, so there is nothing to
 * join.
 *
 * It keeps its own localStorage key rather than joining `materio-workspace-v1`, for the
 * reason `liczmat-crm-v1` does: two files writing one key is one race away from a lost
 * write. /app/ uploads all three stores; that does not make them one store.
 *
 * The split from the screen (assets/own-materials-ui.js) is page weight, the same argument
 * that split assets/crm-store.js out of assets/crm.js in session 46. Three kinds of page
 * need the store and not the screen: /app/, which syncs it, and the 150 calculator pages,
 * whose material picker offers what somebody typed in beside the bundled catalogue.
 */

const OM_KEY = "liczmat-materials-v1";
const OM_SCHEMA = 1;

/** The contract's caps, and the ones `validMaterial()` enforces. */
const OM_MAX_NAME = 120;
/**
 * How many price points one material keeps. `SyncContract.MAX_PRICE_POINTS` on the phone and
 * `d.prices.size() <= 60` in the deployed rules — a browser that kept more would have its
 * writes refused. The newest are the ones kept: a trend is read from the recent end.
 */
const OM_MAX_PRICE_POINTS = 60;

/**
 * The five things a material can be, and they are the app's own `MaterialApplication` names
 * — the wire carries the enum name, so inventing a sixth here would reach the phone as
 * whatever its fallback is. Each one names the fields it uses and the site-side `kind` the
 * catalogue already speaks, which is what lets an own material fill a calculator through
 * exactly the machinery a bundled one does.
 */
const OM_APPLICATIONS = [
  { id: "WALL_FLOOR_COVERING", kind: "tile", fields: ["widthMm", "lengthMm", "packageAreaM2", "wastePercent"] },
  { id: "DRYWALL_BOARDING", kind: "board", fields: ["widthMm", "lengthMm", "wastePercent"] },
  { id: "COATING", kind: "pack", fields: ["coveragePerUnitM2"] },
  { id: "PANEL_CUTTING", kind: "sheet", fields: ["widthMm", "lengthMm", "kerfMm"] },
  { id: "LINEAR_STOCK", kind: "bar", fields: ["lengthMm", "kerfMm"] },
];

/** The application a name stands for, or the commonest of the five — never null. */
const omApplication = (id) =>
  OM_APPLICATIONS.find((a) => a.id === id) || OM_APPLICATIONS[0];

/** Every measurement the five applications between them use, with the range the rules accept. */
const OM_MEASURES = {
  widthMm: 100000,
  lengthMm: 100000,
  kerfMm: 1000,
  coveragePerUnitM2: 10000,
  packageAreaM2: 10000,
  wastePercent: 100,
};

/* ------------------------------------------------------------------ storage */

const omEmpty = () => ({ materials: [] });

/** Read the whole store. A corrupt or absent one reads as empty. */
function omLoad() {
  try {
    const raw = localStorage.getItem(OM_KEY);
    if (!raw) return omEmpty();
    const data = JSON.parse(raw);
    return { materials: Array.isArray(data.materials) ? data.materials : [] };
  } catch (e) {
    return omEmpty();
  }
}

function omSave(data) {
  try {
    localStorage.setItem(OM_KEY, JSON.stringify(data));
  } catch (e) {
    // Private mode or a full quota: the page keeps working, nothing is written.
    return false;
  }
  document.dispatchEvent(new CustomEvent("ownmaterialschange"));
  return true;
}

const omId = () => (crypto.randomUUID ? crypto.randomUUID()
  : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

const omText = (v, max) => String(v === undefined || v === null ? "" : v).trim().slice(0, max);

const omSyncFields = (createdAt, deletedAt) =>
  ({ createdAt, updatedAt: Date.now(), deletedAt: deletedAt || null, schemaVersion: OM_SCHEMA });

/** Live rows only — a tombstone stays in storage so an undo has something to clear. */
const omAlive = (rows) => rows.filter((r) => !r.deletedAt);

/**
 * One measurement, or null.
 *
 * Null and 0 are different answers and both are kept: a material with no kerf is not a
 * material cut with a 0 mm blade, and the calculator fills nothing for the first. Anything
 * that is not a finite number — a blank field, a word, a NaN out of a bad parse — is null,
 * never 0, because a 0 m² package divides.
 */
function omMeasure(v, key) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(n, OM_MEASURES[key] === undefined ? n : OM_MEASURES[key]);
}

/** Minor units from what somebody typed. A blank price is no price, and is not zero. */
function omMinor(major) {
  if (major === null || major === undefined || major === "") return null;
  const n = typeof major === "number" ? major : Number(String(major).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const OM_FALLBACK_CURRENCY = "PLN";
const omCurrency = () => (typeof lmCurrency === "function" ? lmCurrency() : OM_FALLBACK_CURRENCY);

/* ------------------------------------------------------------------ reading */

/** Every material somebody typed in, by name — the order the app's own screen uses. */
function omMaterials() {
  return omAlive(omLoad().materials)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), document.documentElement.lang || "pl"));
}

/** One material by id, or null. */
const omMaterial = (id) => omMaterials().find((m) => m.id === id) || null;

/**
 * A material's price history, newest first.
 *
 * The reader sorts rather than trusting the writer, exactly as `SyncContract.pricesFromDoc()`
 * does — that is what makes the cap mean "the most recent sixty" for a row written by any
 * build of either product. A malformed point is dropped and the rest survive.
 */
function omHistory(id) {
  const m = omMaterial(id);
  if (!m || !Array.isArray(m.prices)) return [];
  return m.prices
    .filter((p) => p && Number.isFinite(Number(p.priceMinor)) && Number.isFinite(Number(p.recordedAt)))
    .map((p) => ({
      priceMinor: Math.round(Number(p.priceMinor)),
      currencyCode: omText(p.currencyCode, 3),
      recordedAt: Math.round(Number(p.recordedAt)),
    }))
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(0, OM_MAX_PRICE_POINTS);
}

/**
 * What the price has done since the material was first priced, or null when there is nothing
 * to compare. Derived on every read rather than stored: a difference kept beside the two
 * prices it comes from is a third number free to disagree with them.
 *
 * Two points in different currencies are **not** subtracted — chapter VI forbids converting
 * at a rate — and the caller says so instead of printing a figure.
 */
function omTrend(id) {
  const points = omHistory(id);
  if (points.length < 2) return null;
  const now = points[0];
  const first = points[points.length - 1];
  if (now.currencyCode !== first.currencyCode) return { mixed: true };
  return {
    mixed: false,
    fromMinor: first.priceMinor,
    toMinor: now.priceMinor,
    diffMinor: now.priceMinor - first.priceMinor,
    // A material that was free and now costs something has risen by no meaningful percentage.
    pct: first.priceMinor > 0
      ? ((now.priceMinor - first.priceMinor) / first.priceMinor) * 100
      : null,
    currencyCode: now.currencyCode,
    points: points.length,
  };
}

/* ------------------------------------------------------------------ writing */

/** The fields an application actually uses, with everything else nulled out. */
function omMeasures(application, fields) {
  const used = omApplication(application).fields;
  const out = {};
  Object.keys(OM_MEASURES).forEach((key) => {
    out[key] = used.includes(key) ? omMeasure(fields[key], key) : null;
  });
  return out;
}

/**
 * Add a material. A material with no name is a row nobody can tell apart, so it is refused
 * rather than saved blank — the same rule a project, a room and a client get.
 *
 * A price typed at the same time seeds the first history point, which is what the app's
 * `CustomMaterialRepository.upsert()` does, so a material priced on the phone and a material
 * priced here start their history the same way.
 */
function omAdd(fields) {
  const name = omText(fields && fields.name, OM_MAX_NAME);
  if (!name) return null;
  const application = omApplication(fields.application).id;
  const priceMinor = omMinor(fields.priceMajor);
  const now = Date.now();
  const data = omLoad();
  const material = {
    id: omId(),
    name,
    category: omText(fields.category, 40) || "OTHER",
    application,
    ...omMeasures(application, fields),
    priceMinor,
    // Chapter VI: an amount keeps the currency it was priced in, and a material nobody has
    // priced carries no currency to be wrong about.
    currencyCode: priceMinor === null ? "" : omText(fields.currencyCode, 3) || omCurrency(),
    priceUpdatedAt: priceMinor === null ? null : now,
    prices: priceMinor === null ? [] : [{
      priceMinor,
      currencyCode: omText(fields.currencyCode, 3) || omCurrency(),
      recordedAt: now,
    }],
    ...omSyncFields(now),
  };
  data.materials.push(material);
  omSave(data);
  return material;
}

/**
 * Correct a material in place. Anything not passed keeps its current value.
 *
 * Changing the application re-reads every measurement, because the five do not use the same
 * fields: a covering turned into a profile keeps a package area nothing will ever read, and
 * that number would then travel to the phone and sit on a screen contradicting the row.
 * The price is **not** touched here — that is `omSetPrice()`, because a price is the one
 * field with a history behind it.
 */
function omUpdate(id, fields) {
  const data = omLoad();
  const m = data.materials.find((x) => x.id === id && !x.deletedAt);
  if (!m) return null;
  if (fields.name !== undefined) {
    const name = omText(fields.name, OM_MAX_NAME);
    if (!name) return null;
    m.name = name;
  }
  if (fields.category !== undefined) m.category = omText(fields.category, 40) || "OTHER";
  const application = fields.application !== undefined ? omApplication(fields.application).id : m.application;
  const measures = omMeasures(application, { ...m, ...fields });
  m.application = application;
  Object.assign(m, measures);
  m.updatedAt = Date.now();
  omSave(data);
  return m;
}

/**
 * Record a price. Stamps the material and appends a history point — the two halves of
 * `CustomMaterialRepository.updatePrice()` on the phone, in the same order.
 *
 * A price typed onto a material that has never held one stamps it with the visitor's
 * currency; one that already holds an amount keeps the currency it was priced in, because
 * re-stamping 45,99 zł as 45,99 € is a conversion at a rate and chapter VI forbids those.
 * Clearing the price clears the stamp and leaves the history alone: what a material used to
 * cost is still true after somebody stops tracking what it costs now.
 */
function omSetPrice(id, priceMajor, currencyCode) {
  const data = omLoad();
  const m = data.materials.find((x) => x.id === id && !x.deletedAt);
  if (!m) return null;
  const priceMinor = omMinor(priceMajor);
  const now = Date.now();
  if (priceMinor === null) {
    m.priceMinor = null;
    m.currencyCode = "";
    m.priceUpdatedAt = null;
    m.updatedAt = now;
    omSave(data);
    return m;
  }
  const currency = m.currencyCode || omText(currencyCode, 3) || omCurrency();
  m.priceMinor = priceMinor;
  m.currencyCode = currency;
  m.priceUpdatedAt = now;
  const prices = Array.isArray(m.prices) ? m.prices : [];
  prices.push({ priceMinor, currencyCode: currency, recordedAt: now });
  // Newest kept, so the row stays inside what the rules accept however long somebody
  // tracks a price. Sorted first, because a store written by any build has to cap the same.
  m.prices = prices
    .sort((a, b) => (Number(b.recordedAt) || 0) - (Number(a.recordedAt) || 0))
    .slice(0, OM_MAX_PRICE_POINTS);
  m.updatedAt = now;
  omSave(data);
  return m;
}

/** Tombstone one material. Same rule as everywhere else: the row stays, `deletedAt` moves. */
function omDelete(id) {
  const data = omLoad();
  const m = data.materials.find((x) => x.id === id && !x.deletedAt);
  if (!m) return null;
  m.deletedAt = Date.now();
  m.updatedAt = m.deletedAt;
  omSave(data);
  // The id is the undo token: an undo has to be exact rather than a guess from timestamps.
  return m.id;
}

/** Undo a delete. The history comes back with it — it never left the row. */
function omRestore(token) {
  const data = omLoad();
  const m = data.materials.find((x) => x.id === token && x.deletedAt);
  if (!m) return null;
  m.deletedAt = null;
  m.updatedAt = Date.now();
  omSave(data);
  return m;
}

/* ------------------------------------------------------------------ the catalogue shape */

/**
 * An own material as a row the picker and the calculators already speak
 * (assets/materials.js). It carries `name` where a bundled row carries a term key `t`, and
 * `matName()` prefers it — a material somebody typed in has a name, not a translation.
 *
 * `own: true` is what lets the picker group them apart and what stops /materialy/ counting
 * them: chapter I's catalogue is 161 rows and a number on the page has to stay traceable to
 * `MATERIALS`.
 */
function omToCatalogRow(m) {
  const app = omApplication(m.application);
  const row = {
    id: `own-${m.id}`,
    own: true,
    ownId: m.id,
    name: m.name,
    t: "",
    s: "",
    c: m.category || "OTHER",
    k: app.kind,
  };
  if (m.widthMm !== null && m.widthMm !== undefined) row.w = m.widthMm;
  if (m.lengthMm !== null && m.lengthMm !== undefined) row.l = m.lengthMm;
  if (m.kerfMm !== null && m.kerfMm !== undefined) row.kerf = m.kerfMm;
  if (m.wastePercent !== null && m.wastePercent !== undefined) row.waste = m.wastePercent;
  if (m.packageAreaM2 !== null && m.packageAreaM2 !== undefined) row.pkg = m.packageAreaM2;
  if (m.coveragePerUnitM2 !== null && m.coveragePerUnitM2 !== undefined) row.cov = m.coveragePerUnitM2;
  // A bar's stock length is metres of a 1D profile, and the engine wants millimetres —
  // the same number the catalogue's own `len` carries.
  if (app.kind === "bar" && row.l !== undefined) row.len = row.l;
  return row;
}

/** Every own material in the catalogue's shape, for the picker. */
const omCatalogRows = () => omMaterials().map(omToCatalogRow);

/* ------------------------------------------------------------------ sync */

/** The whole store, for /app/ to push. Tombstones included — a delete has to travel. */
const omExport = () => ({ ...omLoad(), exportedAt: Date.now(), schemaVersion: OM_SCHEMA });

/**
 * Merge an account's copy back in, last-write-wins on `updatedAt` with ties going to the
 * incoming row — the same rule as wsImport(), crmImport() and SyncContract.remoteWins().
 *
 * A material is replaced **whole**, its `prices[]` with it. Merging two histories would
 * build a price trend that happened on neither device, which is the same decision
 * `CloudSync.replacePrices()` makes on the phone.
 */
function omImport(incoming) {
  const data = omLoad();
  const rows = Array.isArray(incoming && incoming.materials) ? incoming.materials : [];
  rows.forEach((row) => {
    if (!row || !row.id) return;
    const i = data.materials.findIndex((x) => x.id === row.id);
    if (i < 0) data.materials.push(row);
    else if ((row.updatedAt || 0) >= (data.materials[i].updatedAt || 0)) data.materials[i] = row;
  });
  omSave(data);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    OM_KEY, OM_SCHEMA, OM_MAX_NAME, OM_MAX_PRICE_POINTS, OM_APPLICATIONS, OM_MEASURES,
  };
}
