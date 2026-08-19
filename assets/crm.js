/* LiczMat website — the Pro workspace: clients.
 *
 * Master plan, session 22 (KLIENCI): "CRM klientów", and chapter XX under it — a client
 * list where a client carries contact details, notes, a history, jobs, projects and
 * quotes. Sessions 23, 24 and 26 build the jobs, the quotes and the path that joins them;
 * this file is the client itself, plus the one link chapter XX allows today: the projects
 * the free workspace already holds.
 *
 * **Local to this browser, and not part of the sync contract.** docs/FIRESTORE_SYNC.md in
 * `3d-polednia/Materio` defines five collections — projects, rooms, estimations,
 * shoppingItems and sharedProjects — and clients is not among them. There is no
 * `ClientEntity` on the phone, no `SyncContract.clientToDoc()` and no `validClient()` in
 * the deployed rules, so a client written to Firestore would be a document nothing reads
 * and the rules would refuse anyway. So nothing here is uploaded, /app/ does not push it,
 * and the page says so in plain words instead of implying a sync that does not exist.
 * Carrying clients to the phone is a change to the contract in the app repo, which is a
 * session of its own — see docs/ARCHITEKTURA.md §7.6.
 *
 * The document is still written in the *shape* the contract uses — an id, the fields, and
 * `createdAt / updatedAt / deletedAt / schemaVersion` — and deleting writes a tombstone
 * rather than dropping the row. That is not decoration: it is what makes the undo exact
 * (the same rule as a deleted project), and it is what a later contract addition would
 * need in order to upload the rows that are already here.
 *
 * The store is its own key. The workspace store is "the documents the app also keeps", and
 * putting a collection the app has never heard of inside it would make that sentence false
 * — and would put clients into wsExport(), which /app/ uploads.
 *
 * Money is never stored here. What a client is worth is the sum of their projects, and a
 * project's cost already has exactly one answer: wsProjectCosts() in assets/workspace.js,
 * which counts every amount in a project once. A second stored total would be free to
 * disagree with it the moment a material was re-priced.
 */

const CRM_KEY = "liczmat-crm-v1";
const CRM_SCHEMA = 1;

/* Field caps. A name and a project name are capped the same way (120), because they are
   the same kind of thing on the same kind of row; the note is the long one — chapter XX
   asks for notes, not for a document. */
const CRM_MAX_NAME = 120;
const CRM_MAX_CONTACT = 200;
const CRM_MAX_NOTE = 2000;

/* ------------------------------------------------------------------ storage */

const crmEmpty = () => ({ clients: [] });

/** Read the whole Pro workspace. A corrupt or absent store reads as an empty one. */
function crmLoad() {
  try {
    const raw = localStorage.getItem(CRM_KEY);
    if (!raw) return crmEmpty();
    const data = JSON.parse(raw);
    return { clients: Array.isArray(data.clients) ? data.clients : [] };
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

/* ------------------------------------------------------------------ clients */

/** Live rows only — a tombstone stays in storage so an undo has something to clear. */
const crmAlive = (rows) => rows.filter((r) => !r.deletedAt);

/** Every client that still exists, archived ones included, newest change first. */
function crmAllClients() {
  return crmAlive(crmLoad().clients).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The working list: what the index shows and what a project can be filed under. */
const crmClients = () => crmAllClients().filter((c) => !c.archived);

/** The other half of the same list, folded away on the page. */
const crmArchivedClients = () => crmAllClients().filter((c) => c.archived);

/** One client by id, archived or not. Null when it never existed or was deleted. */
const crmClient = (id) => crmAllClients().find((c) => c.id === id) || null;

/**
 * Add a client. Only the name is required — chapter XX's other details are things a
 * tradesman fills in when they have them, and a client with a name and nothing else is
 * still the row they wanted.
 *
 * @param {{name:string, phone?:string, email?:string, address?:string, note?:string}} fields
 * @returns {object|null} the stored client, or null when there is no name
 */
function crmAddClient(fields) {
  const f = fields || {};
  const name = crmText(f.name, CRM_MAX_NAME);
  if (!name) return null; // a client with no name is a row nobody can tell apart
  const data = crmLoad();
  const now = Date.now();
  const client = {
    id: crmId(),
    name,
    phone: crmText(f.phone, CRM_MAX_CONTACT),
    email: crmText(f.email, CRM_MAX_CONTACT),
    address: crmText(f.address, CRM_MAX_CONTACT),
    note: crmText(f.note, CRM_MAX_NOTE),
    projectIds: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    schemaVersion: CRM_SCHEMA,
  };
  data.clients.push(client);
  crmSave(data);
  return client;
}

/**
 * Correct a client in place. Anything not passed keeps its current value.
 *
 * `projectIds` is deliberately not settable here: it is a relation, and it is maintained
 * by crmLinkProject() / crmUnlinkProject(), which are the two writes that know a project
 * may belong to one client at a time.
 */
function crmUpdateClient(id, fields) {
  const f = fields || {};
  const data = crmLoad();
  const client = data.clients.find((c) => c.id === id && !c.deletedAt);
  if (!client) return null;
  if (f.name !== undefined) {
    const name = crmText(f.name, CRM_MAX_NAME);
    if (!name) return null;
    client.name = name;
  }
  if (f.phone !== undefined) client.phone = crmText(f.phone, CRM_MAX_CONTACT);
  if (f.email !== undefined) client.email = crmText(f.email, CRM_MAX_CONTACT);
  if (f.address !== undefined) client.address = crmText(f.address, CRM_MAX_CONTACT);
  if (f.note !== undefined) client.note = crmText(f.note, CRM_MAX_NOTE);
  if (f.archived !== undefined) client.archived = Boolean(f.archived);
  client.updatedAt = Date.now();
  crmSave(data);
  return client;
}

const crmArchiveClient = (id, on) => crmUpdateClient(id, { archived: on !== false });

/**
 * Tombstone a client.
 *
 * **Their projects are not touched.** A project is the visitor's own work in the free
 * workspace, it syncs to the phone, and it goes on existing when the client it was done
 * for is taken off the list — the same argument that keeps a room alive when its project
 * is deleted. The links stay on the tombstone, which is what lets the undo put the client
 * back with their projects still filed under them.
 *
 * @returns {{id:string, at:number}|null} hand it to crmRestoreClient()
 */
function crmDeleteClient(id) {
  const data = crmLoad();
  const client = data.clients.find((c) => c.id === id && !c.deletedAt);
  if (!client) return null;
  const now = Date.now();
  client.deletedAt = now;
  client.updatedAt = now;
  crmSave(data);
  return { id, at: now };
}

/** Undo one delete: a tombstone is a row with a `deletedAt`, so this clears the field. */
function crmRestoreClient(token) {
  const id = typeof token === "string" ? token : (token && token.id);
  if (!id) return null;
  const data = crmLoad();
  const client = data.clients.find((c) => c.id === id);
  if (!client || !client.deletedAt) return null;
  client.deletedAt = null;
  client.updatedAt = Date.now();
  crmSave(data);
  return client;
}

/* ------------------------------------------------------------------ client → project
 *
 * Chapter XX: "Klient może posiadać … projekty", and chapter XXIV's path starts
 * KLIENT → ZLECENIE → PROJEKT. The job is session 23; the project exists today, so the
 * link that exists today is client → project.
 *
 * It is stored on the **client**, not as a `clientId` on the project. A project document
 * is contract: it is pushed to Firestore, pulled by the phone and rendered on /p/<token>,
 * and a field only this browser understands would ride along on all three while the client
 * it points at was never uploaded at all — half a link, in the half that travels. Keeping
 * the whole relation inside the local-only client keeps it in one place, lets the delete
 * and the undo carry it, and leaves the synced document exactly as session 15 left it.
 */

/**
 * File a project under a client. A project belongs to one client at a time, so this takes
 * it off any other client's list first — two clients both claiming the same job is a
 * contradiction the interface would have no way to show.
 */
function crmLinkProject(clientId, projectId) {
  const pid = String(projectId || "");
  if (!pid) return null;
  const data = crmLoad();
  const client = data.clients.find((c) => c.id === clientId && !c.deletedAt);
  if (!client) return null;
  const now = Date.now();
  data.clients.forEach((c) => {
    if (c.id === clientId || !Array.isArray(c.projectIds)) return;
    if (!c.projectIds.includes(pid)) return;
    c.projectIds = c.projectIds.filter((x) => x !== pid);
    c.updatedAt = now;
  });
  if (!Array.isArray(client.projectIds)) client.projectIds = [];
  if (!client.projectIds.includes(pid)) client.projectIds.push(pid);
  client.updatedAt = now;
  crmSave(data);
  return client;
}

/** Take a project off a client's list. The project itself is untouched. */
function crmUnlinkProject(clientId, projectId) {
  const data = crmLoad();
  const client = data.clients.find((c) => c.id === clientId && !c.deletedAt);
  if (!client || !Array.isArray(client.projectIds)) return null;
  const pid = String(projectId || "");
  if (!client.projectIds.includes(pid)) return client;
  client.projectIds = client.projectIds.filter((x) => x !== pid);
  client.updatedAt = Date.now();
  crmSave(data);
  return client;
}

/** Which client a project is filed under, or null. */
function crmClientOfProject(projectId) {
  const pid = String(projectId || "");
  if (!pid) return null;
  return crmAllClients()
    .find((c) => Array.isArray(c.projectIds) && c.projectIds.includes(pid)) || null;
}

/**
 * The client's projects, as project documents, newest change first.
 *
 * A stored id whose project is gone is skipped rather than cleaned up: a project deleted
 * in the workspace can be restored there (wsRestoreProject()), and dropping the link on
 * sight would mean an undo brought the project back to nobody. assets/workspace.js is
 * loaded before this file on every page that shows a client; without it the answer is an
 * empty list rather than an exception.
 */
function crmClientProjects(clientId) {
  const client = crmClient(clientId);
  if (!client || !Array.isArray(client.projectIds)) return [];
  if (typeof wsProject !== "function") return [];
  return client.projectIds
    .map((id) => wsProject(id))
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The projects nobody has filed yet — what the "add a project" picker offers. */
function crmFreeProjects() {
  if (typeof wsProjects !== "function") return [];
  const taken = new Set();
  crmAllClients().forEach((c) => {
    (Array.isArray(c.projectIds) ? c.projectIds : []).forEach((id) => taken.add(id));
  });
  return wsProjects().filter((p) => !taken.has(p.id));
}

/* ------------------------------------------------------------------ what it comes to */

/**
 * What a client's work is worth: their projects' costs, added up.
 *
 * Every project is counted through wsProjectCosts(), which is the one function that knows
 * a calculation and the material it produced are the same money. `mixed` carries the same
 * meaning as everywhere else — amounts saved in different currencies are added but never
 * converted (chapter VI), so the page can say so instead of showing a number that means
 * nothing.
 */
function crmClientCosts(clientId) {
  const projects = crmClientProjects(clientId);
  const codes = new Set();
  let materials = 0;
  let other = 0;
  let mixed = false;
  let currencyCode = "";
  projects.forEach((p) => {
    const c = wsProjectCosts(p.id);
    materials += c.materials;
    other += c.other;
    if (c.total || c.items || c.others) codes.add(c.currencyCode);
    if (c.mixed) mixed = true;
    if (!currencyCode) currencyCode = c.currencyCode;
  });
  if (codes.size > 1) mixed = true;
  return {
    projects: projects.length,
    materials,
    other,
    total: materials + other,
    currencyCode: currencyCode || (typeof wsCurrency === "function" ? wsCurrency() : "PLN"),
    mixed,
  };
}

/**
 * The client's history — chapter XX's "historia", derived and never stored.
 *
 * Everything that has happened to a client on this site is a calculation saved into one of
 * their projects, and those lines are already in the workspace with the date they were
 * saved on. Reading them is therefore the whole history; a second log would be a copy that
 * drifts the first time a line is corrected or deleted.
 *
 * @param {string} clientId
 * @param {number} [limit] how many rows to hand back, newest first
 * @returns {{line:object, project:object}[]}
 */
function crmClientHistory(clientId, limit) {
  if (typeof wsEstimations !== "function") return [];
  const rows = [];
  crmClientProjects(clientId).forEach((p) => {
    wsEstimations(p.id).forEach((line) => rows.push({ line, project: p }));
  });
  rows.sort((a, b) => (b.line.createdAt || 0) - (a.line.createdAt || 0));
  return limit ? rows.slice(0, limit) : rows;
}

/** When anything last happened for this client: their own row, or a project of theirs. */
function crmClientLastAt(clientId) {
  const client = crmClient(clientId);
  if (!client) return 0;
  return crmClientProjects(clientId)
    .reduce((at, p) => Math.max(at, p.updatedAt || 0), client.updatedAt || 0);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CRM_KEY, CRM_SCHEMA, CRM_MAX_NAME, CRM_MAX_NOTE };
}
