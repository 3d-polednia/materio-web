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
 * The store itself — the key, load/save, the ids and the export/import /app/ syncs with —
 * is assets/crm-store.js, which every page loads BEFORE this one. That split is page
 * weight and nothing else: /app/ needs two of those functions and none of this file.
 *
 * **In the sync contract since session 46 (2026-08-26).** docs/FIRESTORE_SYNC.md in
 * `3d-polednia/Materio` now defines eight collections, and `clients`, `jobs` and `quotes`
 * are three of them: the phone has ClientEntity, JobEntity and QuoteEntity, Room migration
 * 5 → 6, the three mappers in SyncContract, the three collections in CloudSync, and
 * validClient()/validJob()/validQuote() in the rules. /app/ pushes and pulls this store
 * next to the workspace, so a job whose status was set here is the job the tradesperson
 * opens on site. See docs/ARCHITEKTURA.md §7.6.
 *
 * That is exactly why the document was written in the *shape* of the contract from the
 * first day — an id, the fields, and `createdAt / updatedAt / deletedAt / schemaVersion`,
 * with a tombstone instead of a delete. It is what makes the undo exact (the same rule as
 * a deleted project), and it is what let the rows already sitting in people's browsers
 * travel the moment the contract had room for them: nothing had to be migrated.
 *
 * The store keeps its own key. The alternative — folding it into `materio-workspace-v1` —
 * would put two files on one localStorage key, which is one race away from a lost write.
 * /app/ uploads both stores; that does not make them one store.
 *
 * **A link to another collection travels as a document id.** `projectIds` on a client and
 * `projectId` / `clientId` on a job and a quote hold the id of the row they point at, which
 * is also its Firestore document id — the only identifier that means the same thing here
 * and on the phone. Local ids are per device: two phones both call something "1".
 *
 * Money is never stored here. What a client is worth is the sum of their projects, and a
 * project's cost already has exactly one answer: wsProjectCosts() in assets/workspace.js,
 * which counts every amount in a project once. A second stored total would be free to
 * disagree with it the moment a material was re-priced.
 */


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


/* ------------------------------------------------------------------ clients */


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

/* ------------------------------------------------------------------ the chain
 *
 * Master plan, session 26 (CRM), chapter XXIV:
 *
 *     CRM LiczMat Pro ma być lekki. Główna relacja:
 *     KLIENT → ZLECENIE → PROJEKT → WYCENA → HISTORIA
 *     Celem jest szybkie zarządzanie pracą fachowca. Nie tworzymy ogromnego systemu ERP.
 *
 * **Session 26 adds no collection and no page.** Every link the chapter names was stored
 * by the four sessions before it — the client keeps `projectIds`, the job keeps `clientId`
 * and `projectId`, the quote keeps `projectId` — and each of the four screens already
 * walked its own step. What was missing is the path itself: from a quote there was no way
 * back to the client without opening two pages, and from a client no way at all to the
 * quotes their work was priced in. So this section is one walker and one reading, both
 * derived, and `crm` is the one feature in LM_FEATURES with `route: null` for exactly that
 * reason.
 *
 * Nothing below writes. A chain that was stored would be a fifth copy of four links, free
 * to disagree with all of them the first time a project changed hands — the argument that
 * already keeps a cost off a job, a unit price off a shopping item and a date out of the
 * terminarz.
 */

/** The nodes of chapter XXIV's path, in the chapter's own order. */
const CRM_CHAIN = ["client", "job", "project", "quote"];

/**
 * Chapter XXIV's path through one node, walked in both directions.
 *
 * Upwards it is exact: a quote is priced from one project, a project is done under at most
 * one job, a job is filed with at most one client. Downwards it is not — a client has many
 * jobs and a project may carry several quotes — so the walker fills in what it can prove
 * and hands back the rest as a list rather than guessing. `quote` is therefore null for
 * everything except a walk that *started* at a quote; `quotes` is what the page lists.
 *
 * @param {"client"|"job"|"project"|"quote"} kind which node `id` names
 * @param {string} id
 * @returns {{from:string, client:object|null, job:object|null, project:object|null,
 *            quote:object|null, quotes:object[]}}
 */
function crmChain(kind, id) {
  const out = { from: String(kind || ""), client: null, job: null, project: null, quote: null, quotes: [] };
  const key = String(id || "");
  if (!key || CRM_CHAIN.indexOf(out.from) === -1) return out;

  if (out.from === "quote") {
    out.quote = crmQuote(key);
    if (!out.quote) return out;
    out.quotes = [out.quote];
  }

  // The project every walk passes through, whichever end it started from.
  let pid = "";
  if (out.from === "project") pid = key;
  else if (out.from === "quote") pid = out.quote.projectId || "";
  else if (out.from === "job") {
    out.job = crmJob(key);
    if (!out.job) return out;
    pid = out.job.projectId || "";
  } else {
    out.client = crmClient(key);
    if (!out.client) return out;
    out.quotes = crmClientQuotes(key);
    return out;
  }

  if (pid && typeof wsProject === "function") out.project = wsProject(pid);
  if (pid && !out.job) out.job = crmJobOfProject(pid);
  // The client is the project's own, and the job's when the project has been filed under
  // nobody directly: crmAddJob()/crmLinkProject() file it for them, so the two agree, and
  // the fallback only matters for a link made before that write existed. A walk that
  // started at a job trusts the job's own field first — the job is where it was typed.
  if (out.from === "job" && out.job.clientId) out.client = crmClient(out.job.clientId);
  if (!out.client && pid) {
    out.client = crmClientOfProject(pid)
      || (out.job && out.job.clientId ? crmClient(out.job.clientId) : null);
  }
  if (pid && out.from !== "quote") out.quotes = crmProjectQuotes(pid);
  return out;
}

/**
 * Chapter XXIV read backwards from a quote: WYCENA → PROJEKT → ZLECENIE → KLIENT.
 *
 * Kept as its own name because that is what /wyceny/ asks for and what session 24's test
 * checks; it is crmChain() underneath, so there is one walker rather than two that can
 * come to different answers.
 */
function crmQuoteChain(quoteId) {
  const chain = crmChain("quote", quoteId);
  return { project: chain.project, job: chain.job, client: chain.client };
}

/** The quotes priced from one job's project. A job with no project has none. */
function crmJobQuotes(jobId) {
  const job = crmJob(jobId);
  return job && job.projectId ? crmProjectQuotes(job.projectId) : [];
}

/**
 * The quotes priced from any of one client's projects, newest change first.
 *
 * Chapter XX lists "wyceny" among the things a client may have, and this is the whole of
 * that link: a quote stores a project, the client stores their projects, and the two ends
 * meet here. Nothing is stored on the client for it.
 */
function crmClientQuotes(clientId) {
  const ids = {};
  crmClientProjects(clientId).forEach((p) => { ids[p.id] = true; });
  return crmQuotes().filter((q) => q.projectId && ids[q.projectId]);
}

/* ------------------------------------------------------------------ the history
 *
 * Chapter XXIV's last step, and chapter XX's "historia".
 *
 * **It is derived and nothing logs it.** Every row below is a document that already exists
 * with the date it was written on: a client, a job, a quote, a calculation saved into a
 * project, a cost typed onto one. A log beside them would be a second copy of the same
 * facts, and it would start lying the first time a row was corrected or deleted — the row
 * would be gone and its entry would remain.
 *
 * What that costs, said plainly: only *creations* are in it. A status moved from "nowe" to
 * "w toku", a deadline pushed by a week, a margin corrected — none of those leave a dated
 * trace anywhere in the store (a row carries one `updatedAt`, which says when it last
 * changed and never what changed), so the history does not claim them. Storing them would
 * be an event log, which is the ERP chapter XXIV forbids in its last line.
 */

/** The kinds of row a history can carry, newest-first when they share a millisecond. */
const CRM_HISTORY_KINDS = ["client", "job", "quote", "calc", "cost"];

/**
 * What has happened, for a client, a job or a project.
 *
 * @param {{clientId?:string, jobId?:string, projectId?:string}} scope exactly one of the
 *   three. An empty or unknown scope answers [].
 * @param {number} [limit] how many rows to hand back, newest first
 * @returns {{at:number, kind:string, id:string, name:string, project:object|null,
 *            line:object|null, job:object|null, quote:object|null}[]}
 */
function crmHistory(scope, limit) {
  const s = scope || {};
  const rows = [];
  const add = (at, kind, id, name, extra) => {
    const when = Number(at);
    if (!isFinite(when) || when <= 0) return;
    rows.push(Object.assign({
      at: when, kind: kind, id: String(id || ""), name: String(name || ""),
      project: null, line: null, job: null, quote: null,
    }, extra || {}));
  };

  let projects = [];
  let jobs = [];
  if (s.clientId) {
    const client = crmClient(s.clientId);
    if (!client) return [];
    add(client.createdAt, "client", client.id, client.name);
    projects = crmClientProjects(s.clientId);
    jobs = crmClientJobs(s.clientId);
  } else if (s.jobId) {
    const job = crmJob(s.jobId);
    if (!job) return [];
    jobs = [job];
    const project = job.projectId && typeof wsProject === "function" ? wsProject(job.projectId) : null;
    projects = project ? [project] : [];
  } else if (s.projectId) {
    const project = typeof wsProject === "function" ? wsProject(s.projectId) : null;
    if (!project) return [];
    projects = [project];
    const job = crmJobOfProject(s.projectId);
    if (job) jobs = [job];
  } else {
    return [];
  }

  jobs.forEach((j) => add(j.createdAt, "job", j.id, j.name, { job: j }));

  projects.forEach((project) => {
    crmProjectQuotes(project.id).forEach((q) =>
      add(q.createdAt, "quote", q.id, q.name, { quote: q, project: project }));
    if (typeof wsEstimations !== "function") return;
    wsEstimations(project.id).forEach((line) => {
      // A line nothing calculated is chapter XVII's "inne koszty" — it happened too, and
      // saying which of the two it was is the difference between "policzono" and "dopisano".
      const manual = typeof wsIsManualLine === "function" && wsIsManualLine(line);
      add(line.createdAt, manual ? "cost" : "calc", line.id, line.name,
        { line: line, project: project });
    });
  });

  // Newest first. Rows written in the same millisecond — a job and the project it was
  // created with — are ordered by how far along the chain they are, latest step first, so
  // a tie reads the same way the list does rather than in whatever order the store held.
  rows.sort((a, b) => (b.at - a.at)
    || (CRM_HISTORY_KINDS.indexOf(b.kind) - CRM_HISTORY_KINDS.indexOf(a.kind)));
  return limit ? rows.slice(0, limit) : rows;
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

/**
 * Every job that carries a deadline, grouped under it — "YYYY-MM-DD" -> [job, ...].
 *
 * 2026-09-03, owner's decision: /app/'s Terminarz tab gets a real month grid, reversing
 * chapter XXIII's "nie buduj odpowiednika Google Calendar" (see the note at the top of
 * assets/schedule-ui.js and docs/MASTER_PLAN.txt chapter XXIII for the original scope and
 * why it stood). crmSchedule() still answers "kiedy" in words (late/today/soon/later) and
 * stays exactly as it was; this is the second, day-indexed view the grid needs, built from
 * the same crmAllJobs() so the two can never disagree about what a job's deadline is.
 *
 * Open and closed jobs both appear — a finished job due last Tuesday still belongs on last
 * Tuesday's cell, dimmed by the caller, not erased from the month. A day with no jobs has
 * no key here at all, so the caller's own lookup already tells it "empty" for free.
 */
function crmJobsByDay() {
  const byDay = {};
  crmAllJobs().forEach((job) => {
    if (!job.dueDate) return;
    (byDay[job.dueDate] || (byDay[job.dueDate] = [])).push(job);
  });
  return byDay;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CRM_KEY, CRM_SCHEMA, CRM_MAX_NAME, CRM_MAX_NOTE,
    JOB_STATUS, JOB_OPEN_STATUS, JOB_DEFAULT_STATUS,
    CAL_BUCKETS, CAL_SOON_DAYS,
    CRM_CHAIN, CRM_HISTORY_KINDS,
    QUO_MAX_LINES, QUO_MAX_MARGIN,
  };
}
