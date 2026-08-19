/* LiczMat website — the Pro workspace: clients, jobs, quotes and the terminarz.
 *
 * Master plan, session 22 (KLIENCI): "CRM klientów", and chapter XX under it — a client
 * list where a client carries contact details, notes, a history, jobs, projects and
 * quotes. Session 23 (ZLECENIA) added the second half: a job with a client, a name, a
 * description, a status, a date, a value and a project (chapter XXI), which is chapter
 * XXIV's middle step — KLIENT → ZLECENIE → PROJEKT → WYCENA. Session 24 (WYCENY) added
 * the last of those, chapter XXII: material, labour, other costs, margin and a total.
 * Session 25 (TERMINARZ) added a *reading* rather than a fourth collection: chapter
 * XXIII's terminarz is the jobs sorted by their deadline, and it stores nothing — see the
 * block at the bottom of this file for why a date may only have one home.
 *
 * All three collections live in this one file because they live in one store, and because
 * each is the thing that joins the next: splitting them would mean three files reading and
 * writing the same localStorage key, which is one race away from a lost write.
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
/* A unit is a word beside a number — "h", "m²", "dzień" — capped exactly as a material's
   unit is in assets/workspace.js, because it is the same kind of thing. */
const CRM_MAX_UNIT = 24;

/**
 * Chapter XXI's statuses, in the order the chapter lists them: nowe, w toku, zakończone,
 * anulowane. The ids are English because every other id in this repo is; the words the
 * visitor reads are `job_st_<id>` in the dictionary, in four languages.
 *
 * "open" is the half a tradesman is actually working on, and it is what the index shows
 * first — the other two are done with and fold away. That is also why a job has no
 * `archived` field the way a client does: chapter XXI already gives it two closed states,
 * and a third way to put a row out of sight would be one the page had to explain.
 */
const JOB_STATUS = ["new", "active", "done", "cancelled"];
const JOB_OPEN_STATUS = ["new", "active"];
const JOB_DEFAULT_STATUS = "new";

/**
 * The terminarz's buckets, in the order the page draws them — session 25, chapter XXIII.
 *
 * They are the answer to "kiedy", which is the only question a terminarz is opened with:
 * what is already late, what is due today, what is due within the week, what is further
 * out, and what still has no date at all. "none" is last and is not a filler bucket — a
 * job nobody has dated is the row a tradesman most often has to fix, and a terminarz that
 * hid it would be a list of the deadlines that already exist rather than of the work.
 */
const CAL_BUCKETS = ["late", "today", "soon", "later", "none"];

/** How far ahead "soon" reaches, in days. A week is what a tradesman plans in. */
const CAL_SOON_DAYS = 7;

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
 * **Their projects are not touched, and neither are their jobs.** A project is the
 * visitor's own work in the free workspace, it syncs to the phone, and it goes on existing
 * when the client it was done for is taken off the list — the same argument that keeps a
 * room alive when its project is deleted. A job outlives its client for the same reason
 * and one more: it keeps its `clientId`, so the undo puts the client back with every job
 * still filed under them. Until then the job's page says the client is gone rather than
 * drawing a link to a row nobody can open.
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


/* ------------------------------------------------------------------ jobs
 *
 * Chapter XXI: "Zlecenie może mieć: klienta, nazwę, opis, status, termin, wartość,
 * projekt, notatki." All eight are here; the quote (chapter XXII) is session 24.
 *
 * **The client and the project are stored on the job**, which is the opposite direction
 * from client → project, and for a reason that is not symmetry: a *project* document is
 * contract — it is pushed to Firestore, pulled by the phone and rendered on /p/<token> —
 * so a `jobId` on it would be half a link in the half that travels. A *job* is local, like
 * a client, so a link kept on it travels nowhere and cannot mislead anything. Keeping both
 * ends of chapter XXIV's path (KLIENT → ZLECENIE → PROJEKT) on the local rows is what lets
 * the whole chain survive a delete and come back on an undo.
 *
 * Money: `valueMinor` is what was **agreed** with the client — chapter XXI's "wartość" —
 * and it is the one figure on this page that is typed rather than derived. It is not the
 * project's cost and must never be confused with it: wsProjectCosts() answers what the
 * work has actually run to so far, the two are different numbers on purpose, and the page
 * shows them side by side. The currency is stamped once, from the visitor's own choice at
 * the moment the value is first typed, and never re-stamped: re-labelling 4 000 zł as
 * 4 000 € is a conversion at a rate, and chapter VI forbids those.
 */

/** Is this one of chapter XXI's four statuses? An unknown one is never stored. */
const crmIsStatus = (v) => JOB_STATUS.indexOf(String(v)) !== -1;

/** Chapter XXI's date: a calendar day, as "YYYY-MM-DD", or "" for a job with no deadline.
 *
 * Not millis, unlike every timestamp in the store. A deadline is a day in the visitor's
 * own calendar — "the 14th" — and an instant would move to the 13th or the 15th for a
 * browser in another timezone, which is exactly the kind of silent wrongness a terminarz
 * (session 25) cannot recover from. The string sorts correctly as text, which is all the
 * calendar will need.
 */
function crmDay(v) {
  const s = String(v === undefined || v === null ? "" : v).trim();
  // Exactly the ten characters, never a prefix of something longer: a full ISO instant
  // ("2026-09-30T23:00:00Z") names a different day in half the world's timezones, so its
  // first ten characters are a guess, and a guess about a deadline is worse than nothing.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const d = new Date(`${s}T00:00:00Z`);
  if (isNaN(d.getTime())) return "";
  // "2026-02-31" parses in some engines and rolls over in others; compare it back.
  return d.toISOString().slice(0, 10) === s ? s : "";
}

/** Minor units from a typed major amount, or null when nothing was typed. */
function crmMinor(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** The visitor's own currency, for stamping a value that has never carried one. */
const crmCurrency = () => (typeof wsCurrency === "function" ? wsCurrency()
  : (typeof lmCurrency === "function" ? lmCurrency() : "PLN"));

/** Every job that still exists, newest change first. */
function crmAllJobs() {
  return crmAlive(crmLoad().jobs).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The jobs still being worked on — chapter XXI's "nowe" and "w toku". */
const crmOpenJobs = () => crmAllJobs().filter((j) => JOB_OPEN_STATUS.indexOf(j.status) !== -1);

/** The other two statuses: finished and cancelled. Folded away on the page, never lost. */
const crmClosedJobs = () => crmAllJobs().filter((j) => JOB_OPEN_STATUS.indexOf(j.status) === -1);

/** One job by id, whatever its status. Null when it never existed or was deleted. */
const crmJob = (id) => crmAllJobs().find((j) => j.id === id) || null;

/**
 * Add a job. Only the name is required, for the reason only a client's name is: chapter
 * XXI's other fields are things a tradesman fills in when they know them, and a job with
 * a name is already the row they wanted.
 *
 * @param {{name:string, clientId?:string, projectId?:string, status?:string,
 *          description?:string, dueDate?:string, valueMajor?:string|number,
 *          note?:string}} fields
 * @returns {object|null} the stored job, or null when there is no name
 */
function crmAddJob(fields) {
  const f = fields || {};
  const name = crmText(f.name, CRM_MAX_NAME);
  if (!name) return null;
  const data = crmLoad();
  const now = Date.now();
  const value = crmMinor(f.valueMajor);
  const job = {
    id: crmId(),
    name,
    // A client or a project that is not there is dropped rather than stored: a link to a
    // row nobody can open is worse than no link, because the page would draw it.
    clientId: crmClientId(f.clientId),
    projectId: crmProjectId(f.projectId),
    status: crmIsStatus(f.status) ? String(f.status) : JOB_DEFAULT_STATUS,
    description: crmText(f.description, CRM_MAX_NOTE),
    note: crmText(f.note, CRM_MAX_NOTE),
    dueDate: crmDay(f.dueDate),
    valueMinor: value,
    currencyCode: value === null ? "" : crmCurrency(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    schemaVersion: CRM_SCHEMA,
  };
  data.jobs.push(job);
  crmSave(data);
  // Chapter XXIV's path is one chain: a job that arrives with both a client and a project
  // files that project under that client too, so the client's own page tells the same
  // story as the job's. crmLinkProject() is the one write that knows a project has one
  // client, so it is the one that does it.
  if (job.clientId && job.projectId) crmLinkProject(job.clientId, job.projectId);
  return crmJob(job.id);
}

/** An existing client's id, or "" — never a dangling one. */
function crmClientId(id) {
  const v = String(id || "");
  return v && crmClient(v) ? v : "";
}

/** An existing project's id, or "". The workspace is the authority on what exists. */
function crmProjectId(id) {
  const v = String(id || "");
  if (!v || typeof wsProject !== "function") return "";
  return wsProject(v) ? v : "";
}

/**
 * Correct a job in place. Anything not passed keeps its current value.
 *
 * `valueMajor` is the typed amount: "" clears it (and the currency with it), a number
 * stamps the visitor's currency the first time and keeps the stamped one afterwards.
 */
function crmUpdateJob(id, fields) {
  const f = fields || {};
  const data = crmLoad();
  const job = data.jobs.find((j) => j.id === id && !j.deletedAt);
  if (!job) return null;
  if (f.name !== undefined) {
    const name = crmText(f.name, CRM_MAX_NAME);
    if (!name) return null;
    job.name = name;
  }
  if (f.description !== undefined) job.description = crmText(f.description, CRM_MAX_NOTE);
  if (f.note !== undefined) job.note = crmText(f.note, CRM_MAX_NOTE);
  if (f.dueDate !== undefined) job.dueDate = crmDay(f.dueDate);
  if (f.status !== undefined && crmIsStatus(f.status)) job.status = String(f.status);
  if (f.valueMajor !== undefined) {
    const value = crmMinor(f.valueMajor);
    job.valueMinor = value;
    // An amount that already exists keeps the currency it was agreed in; a new one takes
    // the visitor's. Clearing the amount clears the currency, so the next one is stamped
    // fresh rather than inheriting a code from a figure nobody remembers.
    if (value === null) job.currencyCode = "";
    else if (!job.currencyCode) job.currencyCode = crmCurrency();
  }
  if (f.clientId !== undefined) job.clientId = crmClientId(f.clientId);
  if (f.projectId !== undefined) job.projectId = crmProjectId(f.projectId);
  job.updatedAt = Date.now();
  crmSave(data);
  if (job.clientId && job.projectId) crmLinkProject(job.clientId, job.projectId);
  return crmJob(id);
}

/** Move a job to one of chapter XXI's four statuses. An unknown one changes nothing. */
function crmSetJobStatus(id, status) {
  return crmIsStatus(status) ? crmUpdateJob(id, { status: status }) : null;
}

/**
 * Tombstone a job.
 *
 * Neither the client nor the project is touched: both exist without it — the project is
 * the visitor's own work and syncs to the phone, the client is a person who is still a
 * client. The links stay on the tombstone, which is what lets the undo put the job back
 * with its client and its project still attached.
 *
 * @returns {{id:string, at:number}|null} hand it to crmRestoreJob()
 */
function crmDeleteJob(id) {
  const data = crmLoad();
  const job = data.jobs.find((j) => j.id === id && !j.deletedAt);
  if (!job) return null;
  const now = Date.now();
  job.deletedAt = now;
  job.updatedAt = now;
  crmSave(data);
  return { id: id, at: now };
}

/** Undo one delete — the same tombstone-clearing as crmRestoreClient(). */
function crmRestoreJob(token) {
  const id = typeof token === "string" ? token : (token && token.id);
  if (!id) return null;
  const data = crmLoad();
  const job = data.jobs.find((j) => j.id === id);
  if (!job || !job.deletedAt) return null;
  job.deletedAt = null;
  job.updatedAt = Date.now();
  crmSave(data);
  return crmJob(id);
}

/** The jobs of one client, newest change first. Chapter XX: "Klient może posiadać … zlecenia". */
const crmClientJobs = (clientId) =>
  crmAllJobs().filter((j) => j.clientId && j.clientId === String(clientId || ""));

/** The job a project is being done under, or null. One project has at most one job. */
function crmJobOfProject(projectId) {
  const pid = String(projectId || "");
  if (!pid) return null;
  return crmAllJobs().find((j) => j.projectId === pid) || null;
}

/** The projects no job has taken yet — what a job's project picker offers. */
function crmFreeJobProjects(exceptJobId) {
  if (typeof wsProjects !== "function") return [];
  const taken = {};
  crmAllJobs().forEach((j) => {
    if (j.projectId && j.id !== exceptJobId) taken[j.projectId] = true;
  });
  return wsProjects().filter((p) => !taken[p.id]);
}

/**
 * What one job comes to: what was agreed, and what the work has cost so far.
 *
 * Two different numbers, and the reason they are both here is that they answer two
 * different questions — "what did I quote" and "what has it run to". Neither is derived
 * from the other and neither is stored twice: the agreed value is the job's own field, the
 * cost is wsProjectCosts() over the one project the job carries, which is the function
 * that already knows a calculation and the material it produced are the same money.
 *
 * `mixed` is chapter VI's rule as everywhere else: the agreed value and the costs may be
 * in different currencies, they are never converted, and the page is told rather than
 * handed a difference that means nothing.
 */
function crmJobCosts(jobId) {
  const job = crmJob(jobId);
  const empty = {
    value: null, currencyCode: crmCurrency(), cost: 0, costCurrencyCode: crmCurrency(),
    hasProject: false, mixed: false, left: null,
  };
  if (!job) return empty;
  const costs = job.projectId && typeof wsProjectCosts === "function"
    ? wsProjectCosts(job.projectId) : null;
  const cost = costs ? costs.total : 0;
  const costCode = costs ? costs.currencyCode : crmCurrency();
  const valueCode = job.currencyCode || crmCurrency();
  // A difference between two amounts in different currencies is not a number, so it is
  // not computed — the page says the currencies differ instead.
  const comparable = job.valueMinor !== null && cost > 0 && valueCode === costCode;
  return {
    value: job.valueMinor,
    currencyCode: valueCode,
    cost: cost,
    costCurrencyCode: costCode,
    hasProject: Boolean(job.projectId && costs),
    mixed: Boolean((costs && costs.mixed)
      || (job.valueMinor !== null && cost > 0 && valueCode !== costCode)),
    left: comparable ? job.valueMinor - cost : null,
  };
}

/**
 * What a client's jobs are worth, by status — the count of each of chapter XXI's four.
 * Money is deliberately not summed here: two jobs agreed in two currencies do not add up,
 * and a client's money already has one answer (crmClientCosts()).
 */
function crmClientJobCounts(clientId) {
  const out = { total: 0 };
  JOB_STATUS.forEach((s) => { out[s] = 0; });
  crmClientJobs(clientId).forEach((j) => {
    out.total++;
    if (Object.prototype.hasOwnProperty.call(out, j.status)) out[j.status]++;
  });
  return out;
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

/* ------------------------------------------------------------------ quotes
 *
 * Chapter XXII: "Wycena może zawierać: materiały, robociznę, inne koszty, marżę, sumę.
 * Nie buduj pełnego programu księgowego." Session 24's six bullets are those five plus
 * the currency, and this is all of them — no tax, no discount, no invoice number, no
 * status: every one of those is the accounting package the chapter forbids in one line.
 *
 * **Each of the five figures has exactly one source, and only two of them are stored.**
 *
 *   materiały    wsProjectCosts(projectId).materials — the project's material list
 *   inne koszty  wsProjectCosts(projectId).other — chapter XVII's hand-typed costs
 *   robocizna    the quote's own `labour` lines, which is the one thing nothing else knows
 *   marża        the quote's own `marginPct`
 *   suma         (materiały + inne koszty + robocizna) + marża, computed here, never stored
 *
 * Copying the project's money onto the quote would give the same amount two homes and let
 * them disagree the moment a material was re-priced — the argument that already keeps a
 * job's cost out of the job (crmJobCosts()) and a unit price out of a shopping item
 * (wsUnitPriceMinor()). It also means a quote answers "what is this worth *now*", which is
 * what a tradesman opens it to see.
 *
 * **The one link the quote stores is `projectId`.** The materials are the project's, so
 * without it there is nothing to price; the job and the client are *already* reachable
 * from the project — crmJobOfProject() and crmClientOfProject() — so storing them again
 * would be two more links free to disagree with the first. crmQuoteChain() walks it, and
 * that walk is chapter XXIV's path read backwards: WYCENA → PROJEKT → ZLECENIE → KLIENT.
 *
 * A quote with no project is allowed and is not a mistake: it is a price for work with no
 * material behind it, and it comes to the labour plus the margin. The page says so rather
 * than showing zeroes with no explanation.
 */

/** How many labour lines one quote may carry. Chapter XXII, not a cost book. */
const QUO_MAX_LINES = 60;
/** The cap on a margin, in percent. A margin is a markup, not an exponent. */
const QUO_MAX_MARGIN = 1000;

/** A counted amount, or null when the visitor left the field blank — a lump-sum line. */
function crmQty(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  if (!isFinite(n) || n < 0) return null;
  return n;
}

/** A margin in percent: never negative, never past the cap, never more than two decimals. */
function crmPct(v) {
  if (v === undefined || v === null || String(v).trim() === "") return 0;
  const n = Number(String(v).replace(",", "."));
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(Math.min(n, QUO_MAX_MARGIN) * 100) / 100;
}

/** Every quote that still exists, newest change first. */
function crmQuotes() {
  return crmAlive(crmLoad().quotes).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** One quote by id. Null when it never existed or was deleted. */
const crmQuote = (id) => crmQuotes().find((q) => q.id === id) || null;

/** The quotes priced from one project, newest change first. A project may have several —
 *  two prices for one job is a variant, not a contradiction, and nothing here forbids it. */
const crmProjectQuotes = (projectId) =>
  crmQuotes().filter((q) => q.projectId && q.projectId === String(projectId || ""));

/**
 * Add a quote. Only the name is required, for the reason only a client's or a job's name
 * is: everything else is filled in as it becomes known, and a named quote is already the
 * row the visitor wanted.
 *
 * @param {{name:string, projectId?:string, marginMajor?:string|number, note?:string}} fields
 * @returns {object|null} the stored quote, or null when there is no name
 */
function crmAddQuote(fields) {
  const f = fields || {};
  const name = crmText(f.name, CRM_MAX_NAME);
  if (!name) return null;
  const data = crmLoad();
  const now = Date.now();
  const quote = {
    id: crmId(),
    name,
    // A project that is not there is dropped rather than stored — the same rule a job's
    // links follow: a link to a row nobody can open is worse than no link.
    projectId: crmProjectId(f.projectId),
    labour: [],
    marginPct: crmPct(f.marginMajor),
    note: crmText(f.note, CRM_MAX_NOTE),
    // Stamped by the first labour amount, not here: a quote with no money in it yet has
    // no currency to be wrong about.
    currencyCode: "",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    schemaVersion: CRM_SCHEMA,
  };
  data.quotes.push(quote);
  crmSave(data);
  return crmQuote(quote.id);
}

/** Correct a quote in place. Anything not passed keeps its current value. */
function crmUpdateQuote(id, fields) {
  const f = fields || {};
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === id && !q.deletedAt);
  if (!quote) return null;
  if (f.name !== undefined) {
    const name = crmText(f.name, CRM_MAX_NAME);
    if (!name) return null;
    quote.name = name;
  }
  if (f.note !== undefined) quote.note = crmText(f.note, CRM_MAX_NOTE);
  if (f.marginMajor !== undefined) quote.marginPct = crmPct(f.marginMajor);
  if (f.projectId !== undefined) quote.projectId = crmProjectId(f.projectId);
  quote.updatedAt = Date.now();
  crmSave(data);
  return crmQuote(id);
}

/**
 * Tombstone a quote. Nothing else is touched: the project it priced is the visitor's own
 * work and syncs to the phone, and the labour lines ride on the tombstone, which is what
 * lets the undo bring the whole quote back exactly as it stood.
 *
 * @returns {{id:string, at:number}|null} hand it to crmRestoreQuote()
 */
function crmDeleteQuote(id) {
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === id && !q.deletedAt);
  if (!quote) return null;
  const now = Date.now();
  quote.deletedAt = now;
  quote.updatedAt = now;
  crmSave(data);
  return { id: id, at: now };
}

/** Undo one delete — the same tombstone-clearing as crmRestoreJob(). */
function crmRestoreQuote(token) {
  const id = typeof token === "string" ? token : (token && token.id);
  if (!id) return null;
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === id);
  if (!quote || !quote.deletedAt) return null;
  quote.deletedAt = null;
  quote.updatedAt = Date.now();
  crmSave(data);
  return crmQuote(id);
}

/* ------------------------------------------------------------------ labour
 *
 * Chapter XXII's "robocizna", and the only part of a quote nothing else in LiczMat knows:
 * no calculator computes an hour of somebody's work, so it is typed.
 *
 * A line stores **one** money field, `amountMinor` — what the line comes to. The rate per
 * unit is read back by dividing (crmLabourRate()), which is the rule session 19 settled
 * for a material's unit price and for the same reason: two stored numbers that should
 * agree are two numbers that eventually will not. The write goes the other way, quantity ×
 * rate rounded exactly once, so "40 × 80 = 3200" behaves the way the form reads.
 *
 * A blank quantity is a lump sum — "wykonanie: 2000" — and is stored as null rather than
 * as 1, because a line that was never counted and a line counted once are different
 * statements and the page prints them differently.
 *
 * A labour line is deleted outright rather than tombstoned. It is a field of a document,
 * not a row of a collection: nothing syncs it, nothing links to it, and the undo that
 * matters — the whole quote — is the quote's own tombstone, which carries its lines.
 */

/** What a line comes to: quantity × rate, rounded once. A blank quantity counts as one. */
const crmLineAmount = (priceMajor, quantity) =>
  Math.max(0, Math.round(crmMinor(priceMajor) * (quantity === null ? 1 : Math.max(0, quantity))));

/** The rate behind a line, in minor units, or null when there is nothing to divide. */
function crmLabourRate(line) {
  const qty = Number(line && line.quantity) || 0;
  const amount = Number(line && line.amountMinor) || 0;
  if (qty <= 0 || amount <= 0) return null;
  return amount / qty;
}

/** Every labour line of a quote, oldest first — the order they were typed in. */
const crmLabour = (quoteId) => {
  const q = crmQuote(quoteId);
  return q && Array.isArray(q.labour) ? q.labour.slice() : [];
};

/**
 * The currency of a quote's own money, restamped after every labour change.
 *
 * Chapter VI: nothing is ever converted at a rate. So a quote that already holds an amount
 * keeps the currency it was priced in, one that holds none carries no currency at all, and
 * the stamp is taken from the visitor's own choice the first time money appears.
 */
function crmStampQuote(quote) {
  const money = (quote.labour || []).reduce((sum, l) => sum + (l.amountMinor || 0), 0);
  if (!money) quote.currencyCode = "";
  else if (!quote.currencyCode) quote.currencyCode = crmCurrency();
}

/**
 * Add one labour line to a quote.
 *
 * @param {string} quoteId
 * @param {{name:string, quantity?:string|number, unit?:string, priceMajor?:string|number}} fields
 * @returns {object|null} the stored quote, or null when there is no name or no room left
 */
function crmAddLabour(quoteId, fields) {
  const f = fields || {};
  const name = crmText(f.name, CRM_MAX_NAME);
  if (!name) return null; // a labour line with no name is a number nobody can explain
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === quoteId && !q.deletedAt);
  if (!quote) return null;
  if (!Array.isArray(quote.labour)) quote.labour = [];
  if (quote.labour.length >= QUO_MAX_LINES) return null;
  const qty = crmQty(f.quantity);
  quote.labour.push({
    id: crmId(),
    name,
    quantity: qty,
    unit: crmText(f.unit, CRM_MAX_UNIT),
    amountMinor: crmLineAmount(f.priceMajor, qty),
  });
  crmStampQuote(quote);
  quote.updatedAt = Date.now();
  crmSave(data);
  return crmQuote(quoteId);
}

/**
 * Correct one labour line. Anything not passed keeps its current value.
 *
 * The quantity is applied before the rate, which is what makes the arithmetic behave the
 * way the form reads: change 40 to 45 at 80 and the line comes to 3600, because both
 * numbers were on screen together when it was saved.
 */
function crmUpdateLabour(quoteId, lineId, fields) {
  const f = fields || {};
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === quoteId && !q.deletedAt);
  if (!quote || !Array.isArray(quote.labour)) return null;
  const line = quote.labour.find((l) => l.id === lineId);
  if (!line) return null;
  if (f.name !== undefined) {
    const name = crmText(f.name, CRM_MAX_NAME);
    if (!name) return null;
    line.name = name;
  }
  if (f.quantity !== undefined) line.quantity = crmQty(f.quantity);
  if (f.unit !== undefined) line.unit = crmText(f.unit, CRM_MAX_UNIT);
  if (f.priceMajor !== undefined) line.amountMinor = crmLineAmount(f.priceMajor, line.quantity);
  crmStampQuote(quote);
  quote.updatedAt = Date.now();
  crmSave(data);
  return crmQuote(quoteId);
}

/** Take one labour line off a quote. */
function crmDeleteLabour(quoteId, lineId) {
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === quoteId && !q.deletedAt);
  if (!quote || !Array.isArray(quote.labour)) return null;
  const before = quote.labour.length;
  quote.labour = quote.labour.filter((l) => l.id !== lineId);
  if (quote.labour.length === before) return null;
  crmStampQuote(quote);
  quote.updatedAt = Date.now();
  crmSave(data);
  return crmQuote(quoteId);
}

/* ------------------------------------------------------------------ what it comes to */

/**
 * Chapter XXII's five figures for one quote, and the currency they are in.
 *
 * The material and the other costs are read straight out of wsProjectCosts(), which is the
 * one function that knows a calculation and the material it produced are the same money —
 * so a quote and the project screen can never disagree about what the work costs.
 *
 * The margin is a percentage of everything above it (material + other + labour), which is
 * what a markup means, and it is rounded exactly once, at the end.
 *
 * `mixed` is chapter VI's rule as everywhere else: the quote's labour and the project's
 * costs may have been priced in different currencies, they are never converted, and the
 * page is told so rather than being handed a total that means nothing. The figures are
 * still added — the same choice wsProjectCosts() makes — because hiding them would leave
 * the visitor with no way to see which half is in which currency.
 *
 * @returns {{materials:number, other:number, labour:number, subtotal:number,
 *            marginPct:number, margin:number, total:number, currencyCode:string,
 *            projectCurrencyCode:string, hasProject:boolean, mixed:boolean, lines:number}}
 */
function crmQuoteTotals(quoteId) {
  const quote = crmQuote(quoteId);
  const own = crmCurrency();
  if (!quote) {
    return {
      materials: 0, other: 0, labour: 0, subtotal: 0, marginPct: 0, margin: 0, total: 0,
      currencyCode: own, projectCurrencyCode: "", hasProject: false, mixed: false, lines: 0,
    };
  }
  const costs = quote.projectId && typeof wsProjectCosts === "function"
    ? wsProjectCosts(quote.projectId) : null;
  const materials = costs ? costs.materials : 0;
  const other = costs ? costs.other : 0;
  const lines = Array.isArray(quote.labour) ? quote.labour : [];
  const labour = lines.reduce((sum, l) => sum + (l.amountMinor || 0), 0);
  const subtotal = materials + other + labour;
  const marginPct = Number(quote.marginPct) || 0;
  const margin = Math.round(subtotal * marginPct / 100);
  const projectCode = costs && (costs.total || costs.items || costs.others)
    ? costs.currencyCode : "";
  return {
    materials,
    other,
    labour,
    subtotal,
    marginPct,
    margin,
    total: subtotal + margin,
    // The quote's own stamp first: it is the currency somebody typed. The project's is
    // the fallback for a quote that is nothing but material so far, and the visitor's
    // own choice the fallback for one that holds no money at all.
    currencyCode: quote.currencyCode || projectCode || own,
    projectCurrencyCode: projectCode,
    hasProject: Boolean(costs),
    mixed: Boolean((costs && costs.mixed)
      || (labour > 0 && projectCode && quote.currencyCode
        && quote.currencyCode !== projectCode)),
    lines: lines.length,
  };
}

/**
 * Chapter XXIV's path, read backwards from the quote: WYCENA → PROJEKT → ZLECENIE → KLIENT.
 *
 * Every step is derived. The quote stores the project; crmJobOfProject() knows which job
 * that project is being done under and crmClientOfProject() which client it is filed with,
 * so the chain is walked rather than copied — and a client renamed on their own page reads
 * correctly here on the next redraw, with nothing to keep in step.
 *
 * @returns {{project:object|null, job:object|null, client:object|null}}
 */
function crmQuoteChain(quoteId) {
  const quote = crmQuote(quoteId);
  const pid = quote ? quote.projectId : "";
  const project = pid && typeof wsProject === "function" ? wsProject(pid) : null;
  const job = pid ? crmJobOfProject(pid) : null;
  // The client is the project's own, and a job's client when the project has not been
  // filed under anybody directly — crmAddJob() files it for them, so the two agree, and
  // the fallback only matters for a link made before that write existed.
  const client = pid
    ? (crmClientOfProject(pid) || (job && job.clientId ? crmClient(job.clientId) : null))
    : null;
  return { project: project, job: job, client: client };
}

/* ------------------------------------------------------------------ the terminarz
 *
 * Master plan, session 25 (TERMINARZ), chapter XXIII: "Prosty terminarz zleceń. Powinien
 * pozwolić zobaczyć: terminy, zlecenia, podstawowe informacje. Nie buduj pełnego
 * odpowiednika Google Calendar."
 *
 * **Nothing below stores anything.** A deadline is already a field of a job — chapter
 * XXI's `termin`, written by crmUpdateJob() and validated by crmDay() — so the terminarz
 * is a *reading* of the jobs, not a collection beside them. An `events` array of its own
 * would give one date two homes and let them disagree the first time somebody changed a
 * deadline on the job's own page, which is the argument that already keeps a cost off a
 * job and a unit price off a shopping item. It is also why the module has no `?id=` view:
 * a row here opens the job it belongs to, on /zlecenia/.
 *
 * The comparisons are all between calendar days, never between instants. That is what
 * crmDay() is for, and it is why a deadline was stored as "YYYY-MM-DD" in session 23:
 * "the 14th" has to be the 14th for a browser in Rzeszów and for one in Lisbon.
 */

/**
 * Today, in the visitor's own timezone, as "YYYY-MM-DD".
 *
 * Deliberately not `new Date().toISOString().slice(0, 10)`, which is today in UTC: at
 * 23:30 in Warsaw that string already says tomorrow, so a job due today would be filed
 * under "late" — the terminarz would be wrong every evening. The parts come from the
 * local getters instead, which is the same reckoning the visitor's own calendar uses.
 */
function crmToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Whole days from `from` to `day`, both calendar days — negative for a day in the past,
 * 0 for the same day, null when either is not a real date.
 *
 * Both are read at UTC midnight, which has no daylight saving in it: the difference
 * between two calendar days is a count of days, and parsing them locally would make it
 * 23 or 25 hours twice a year and round the wrong way.
 */
function crmDaysUntil(day, from) {
  const a = crmDay(day);
  const b = crmDay(from === undefined ? crmToday() : from);
  if (!a || !b) return null;
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
}

/**
 * Which of the terminarz's buckets a job belongs in, measured against `today`.
 *
 * A closed job — chapter XXI's "zakończone" and "anulowane" — is never in one: it is done
 * with, and a finished job whose date has passed is not late. crmSchedule() folds those
 * away separately rather than dropping them, so nothing disappears from the page.
 */
function crmJobBucket(job, today) {
  if (!job || JOB_OPEN_STATUS.indexOf(job.status) === -1) return "";
  const days = crmDaysUntil(job.dueDate, today);
  if (days === null) return "none";
  if (days < 0) return "late";
  if (days === 0) return "today";
  return days <= CAL_SOON_DAYS ? "soon" : "later";
}

/**
 * The whole terminarz: every job this browser holds, in the bucket its deadline puts it.
 *
 * Within a bucket the nearest deadline comes first, because that is the order the work
 * has to be done in; the undated bucket keeps the store's own order (newest change
 * first), because there is nothing else to sort it by. The closed half carries only the
 * jobs that *had* a date — a finished job nobody ever dated has no place on a page about
 * dates, and it is still one click away on /zlecenia/.
 *
 * @param {string} [today] the day to measure against. Passed in by the tests; the page
 *   leaves it out and gets crmToday().
 * @returns {{day:string, buckets:object, closed:object[], counts:object, total:number}}
 */
function crmSchedule(today) {
  const day = crmDay(today) || crmToday();
  const buckets = {};
  CAL_BUCKETS.forEach((b) => { buckets[b] = []; });
  const closed = [];

  crmAllJobs().forEach((job) => {
    const bucket = crmJobBucket(job, day);
    if (bucket) buckets[bucket].push(job);
    else if (job.dueDate) closed.push(job);
  });

  const byDue = (a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1
    : b.updatedAt - a.updatedAt);
  ["late", "today", "soon", "later"].forEach((b) => { buckets[b].sort(byDue); });
  // The closed half reads backwards: the most recent deadline first, because it is a
  // record of what has been finished rather than a queue of what is coming.
  closed.sort((a, b) => (a.dueDate < b.dueDate ? 1 : a.dueDate > b.dueDate ? -1
    : b.updatedAt - a.updatedAt));

  const counts = { closed: closed.length };
  CAL_BUCKETS.forEach((b) => { counts[b] = buckets[b].length; });
  return {
    day: day,
    buckets: buckets,
    closed: closed,
    counts: counts,
    total: CAL_BUCKETS.reduce((n, b) => n + buckets[b].length, 0) + closed.length,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CRM_KEY, CRM_SCHEMA, CRM_MAX_NAME, CRM_MAX_NOTE,
    JOB_STATUS, JOB_OPEN_STATUS, JOB_DEFAULT_STATUS,
    CAL_BUCKETS, CAL_SOON_DAYS,
    QUO_MAX_LINES, QUO_MAX_MARGIN,
  };
}
