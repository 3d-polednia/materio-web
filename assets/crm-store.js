/* LiczMat website — where the Pro workspace lives, and the only file that writes it.
 *
 * Clients, jobs and quotes (master plan chapters XX–XXII) share one localStorage key,
 * because they are one store: two files writing one key is one race away from a lost
 * write. What reads and interprets them is assets/crm.js; what *stores* them is here.
 *
 * The split is page weight, and it is the same argument that split assets/workspace-calc.js
 * out of assets/workspace-ui.js in session 33. Since session 46 the Pro store syncs, so
 * /app/ needs crmExport() and crmImport() — and /app/ is already the heaviest page on the
 * site. Downloading the whole Pro workspace, its chain and its terminarz there, to call two
 * functions, would have put it 47 kB over its budget for nothing.
 *
 * **In the sync contract since 2026-08-26.** docs/FIRESTORE_SYNC.md in `3d-polednia/Materio`
 * defines `users/{uid}/clients`, `/jobs` and `/quotes`; the phone has the three entities,
 * Room migration 5 → 6, the three mappers and the three collections in CloudSync, and the
 * deployed rules validate them. That is why the document was written in the *shape* of the
 * contract from the first day — an id, the fields, `createdAt / updatedAt / deletedAt /
 * schemaVersion`, and a tombstone instead of a delete: the rows already sitting in people's
 * browsers travelled the moment the contract had room for them, with nothing to migrate.
 *
 * The store keeps its own key rather than joining `materio-workspace-v1`. /app/ uploads both
 * stores; that does not make them one store.
 */

const CRM_KEY = "liczmat-crm-v1";
const CRM_SCHEMA = 1;

/* Field caps. A name and a project name are capped the same way (120), because they are
   the same kind of thing on the same kind of row; the note is the long one — chapter XX
   asks for notes, not for a document. */
const CRM_MAX_NAME = 120;
const CRM_MAX_CONTACT = 200;
const CRM_MAX_NOTE = 2000;
/* A unit is a word beside a number — "h", "m²", "dzień" — capped exactly as a material's
   unit is in assets/workspace.js, because it is the same kind of thing. */
const CRM_MAX_UNIT = 24;
/* ------------------------------------------------------------------ storage */

const crmEmpty = () => ({ clients: [], jobs: [], quotes: [] });

/** Read the whole Pro workspace. A corrupt or absent store reads as an empty one. */
function crmLoad() {
  try {
    const raw = localStorage.getItem(CRM_KEY);
    if (!raw) return crmEmpty();
    const data = JSON.parse(raw);
    return {
      clients: Array.isArray(data.clients) ? data.clients : [],
      // A store written before session 23 has no jobs array. Reading it as empty is the
      // whole migration: nothing is rewritten until the visitor adds their first job.
      jobs: Array.isArray(data.jobs) ? data.jobs : [],
      // The same for the quotes of session 24.
      quotes: Array.isArray(data.quotes) ? data.quotes : [],
    };
  } catch (e) {
    return crmEmpty();
  }
}

function crmSave(data) {
  try {
    localStorage.setItem(CRM_KEY, JSON.stringify(data));
  } catch (e) {
    // Private mode or a full quota: the page keeps working, nothing is written.
    return false;
  }
  document.dispatchEvent(new CustomEvent("crmchange"));
  return true;
}

const crmId = () => (crypto.randomUUID ? crypto.randomUUID()
  : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

const crmText = (v, max) => String(v === undefined || v === null ? "" : v).trim().slice(0, max);

/** Live rows only — a tombstone stays in storage so an undo has something to clear. */
const crmAlive = (rows) => rows.filter((r) => !r.deletedAt);

/** The whole Pro workspace, for /app/ to push. Tombstones included — a delete has to travel. */
const crmExport = () => ({ ...crmLoad(), exportedAt: Date.now(), schemaVersion: CRM_SCHEMA });

/**
 * Merge an account's copy back in, last-write-wins on `updatedAt` with ties going to the
 * incoming row — the same rule as wsImport() and as SyncContract.remoteWins() on the phone.
 * A row this browser has never seen is added; one it has is replaced only by a newer one.
 */
function crmImport(incoming) {
  const data = crmLoad();
  ["clients", "jobs", "quotes"].forEach((key) => {
    const rows = Array.isArray(incoming && incoming[key]) ? incoming[key] : [];
    rows.forEach((row) => {
      if (!row || !row.id) return;
      const i = data[key].findIndex((x) => x.id === row.id);
      if (i < 0) data[key].push(row);
      else if ((row.updatedAt || 0) >= (data[key][i].updatedAt || 0)) data[key][i] = row;
    });
  });
  crmSave(data);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CRM_KEY, CRM_SCHEMA, CRM_MAX_NAME, CRM_MAX_CONTACT, CRM_MAX_NOTE, CRM_MAX_UNIT };
}
