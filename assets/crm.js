/* LiczMat website — the Pro workspace: clients and jobs.
 *
 * Master plan, session 22 (KLIENCI): "CRM klientów", and chapter XX under it — a client
 * list where a client carries contact details, notes, a history, jobs, projects and
 * quotes. Session 23 (ZLECENIA) added the second half: a job with a client, a name, a
 * description, a status, a date, a value and a project (chapter XXI), which is chapter
 * XXIV's middle step — KLIENT → ZLECENIE → PROJEKT → WYCENA. The quotes are session 24.
 *
 * Both collections live in this one file because they live in one store, and because the
 * job is the thing that joins a client to a project: splitting them would mean two files
 * reading and writing the same localStorage key, which is one race away from a lost write.
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

/* ------------------------------------------------------------------ storage */

const crmEmpty = () => ({ clients: [], jobs: [] });

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

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CRM_KEY, CRM_SCHEMA, CRM_MAX_NAME, CRM_MAX_NOTE,
    JOB_STATUS, JOB_OPEN_STATUS, JOB_DEFAULT_STATUS,
  };
}
