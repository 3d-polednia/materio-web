/* LiczMat website — Pro clients, projects, quotes and the terminarz.
 *
 * Master plan, session 22 (KLIENCI): "CRM klientów", and chapter XX under it — a client
 * list where a client carries contact details, notes, a history, projects and quotes.
 * The former job fields now live on the project, so chapter XXIV's path is the direct
 * KLIENT → PROJEKT → WYCENA. Session 24 (WYCENY) added
 * the last of those, chapter XXII: material, labour, other costs, margin and a total.
 * Session 25 (TERMINARZ) added a *reading* rather than a fourth collection: chapter
 * XXIII's terminarz is the projects sorted by their deadline, and it stores nothing — see the
 * block at the bottom of this file for why a date may only have one home.
 *
 * Clients and quotes live in the CRM store; projects live in the workspace store. This
 * file joins them through their document ids and delegates every project write to
 * wsUpdateProject(), so there is still only one writer for each store.
 *
 * The store itself — the key, load/save, the ids and the export/import /app/ syncs with —
 * is assets/crm-store.js, which every page loads BEFORE this one. That split is page
 * weight and nothing else: /app/ needs two of those functions and none of this file.
 *
 * Projects, clients and quotes are in the deployed sync contract. The four status wire
 * words stay identical to Android's JobStatus enum and the Firestore rules even though
 * the browser no longer has a jobs collection. /app/ syncs the workspace beside CRM, so
 * the project edited here is the project the tradesperson opens on site.
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
 * **A link to another collection travels as a document id.** `projectIds` on a client,
 * `clientId` on a project and `projectId` on a quote hold the id of the row they point at, which
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
 * first — the other two are done with and fold away. Projects retain their independent
 * archive flag for the free workspace; status answers the Pro workflow question.
 */
const PROJECT_STATUS = ["new", "active", "done", "cancelled"];
const PROJECT_OPEN_STATUS = ["new", "active"];
const PROJECT_DEFAULT_STATUS = "new";
const PROJECT_COLORS = ["lime", "blue", "amber", "red", "violet"];

/**
 * The terminarz's buckets, in the order the page draws them — session 25, chapter XXIII.
 *
 * They are the answer to "kiedy", which is the only question a terminarz is opened with:
 * what is already late, what is due today, what is due within the week, what is further
 * out, and what still has no date at all. "none" is last and is not a filler bucket — a
 * project nobody has dated is the row a tradesman most often has to fix, and a terminarz that
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
  if (!crmSave(data)) return null;
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
  if (!crmSave(data)) return null;
  return client;
}

const crmArchiveClient = (id, on) => crmUpdateClient(id, { archived: on !== false });

/**
 * Tombstone a client.
 *
 * **Their projects are not touched.** A project is the visitor's own work in the free
 * workspace, it syncs to the phone, and it goes on existing when the client it was done
 * for is taken off the list — the same argument that keeps a room alive when its project
 * is deleted. It retains `clientId`, so undo reconnects the same chain.
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
  if (!crmSave(data)) return null;
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
  if (!crmSave(data)) return null;
  return client;
}

/* ------------------------------------------------------------------ client → project
 *
 * Chapter XXIV is now the direct KLIENT → PROJEKT → WYCENA chain. `clientId` on the
 * project is authoritative because the project is the work row shared with Android.
 * `projectIds` remains on the client during the migration so older browser rows still
 * resolve and so both sides of the established relation remain usable.
 */

/**
 * File a project under a client. A project belongs to one client at a time, so this takes
 * it off any other client's list first — two clients both claiming the same project is a
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
  if (!crmSave(data)) return null;
  if (typeof wsUpdateProject === "function") wsUpdateProject(pid, { clientId: clientId });
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
  if (!crmSave(data)) return null;
  if (typeof wsProject === "function" && typeof wsUpdateProject === "function") {
    const project = wsProject(pid);
    if (project && project.clientId === clientId) wsUpdateProject(pid, { clientId: "" });
  }
  return client;
}

/** Which client a project is filed under, or null. */
function crmClientOfProject(projectId) {
  const pid = String(projectId || "");
  if (!pid) return null;
  const project = typeof wsProject === "function" ? wsProject(pid) : null;
  if (project && project.clientId) return crmClient(project.clientId);
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
  if (!client || typeof wsAllProjects !== "function") return [];
  const legacy = new Set(Array.isArray(client.projectIds) ? client.projectIds : []);
  return wsAllProjects()
    .filter((project) => project.clientId
      ? project.clientId === client.id
      : legacy.has(project.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The projects nobody has filed yet — what the "add a project" picker offers. */
function crmFreeProjects() {
  if (typeof wsProjects !== "function") return [];
  const taken = new Set();
  crmAllClients().forEach((c) => {
    (Array.isArray(c.projectIds) ? c.projectIds : []).forEach((id) => taken.add(id));
  });
  return wsProjects().filter((p) => !p.clientId && !taken.has(p.id));
}


/* ------------------------------------------------------------------ project fields */

/** Is this one of chapter XXI's four project statuses? */
const crmIsStatus = (v) => PROJECT_STATUS.indexOf(String(v)) !== -1;
const crmProjectColor = (v) => PROJECT_COLORS.indexOf(String(v)) !== -1 ? String(v) : "";

/** Chapter XXI's date: a calendar day, as "YYYY-MM-DD", or "" for no deadline.
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

/**
 * The digits of a typed number, with the grouping taken out.
 *
 * `pdfNum()`'s rule, carried to every reader of a typed field in session K: drop every
 * space — plain, no-break and narrow, since a figure pasted out of a spreadsheet carries
 * U+00A0 — then the LAST separator in the string is the decimal point and the earlier ones
 * were grouping. The draft was `String(v).replace(",", ".")`, which swaps the first comma
 * alone; here that fed `Number()`, which refuses a string with anything left in it, so a
 * quote line typed "1 000" was not a wrong amount but no amount at all — null, the field
 * silently emptied — while "1.000" went in as one.
 *
 * `Number()` and not `parseFloat()` stays: this is a store, and half a number is a typo
 * that must be refused rather than written into a quote somebody sends a client.
 */
function crmDigits(v) {
  const raw = [...String(v === undefined || v === null ? "" : v)].filter((ch) => ch.trim() !== "").join("");
  const cut = Math.max(raw.lastIndexOf(","), raw.lastIndexOf("."));
  return cut === -1 ? raw : `${raw.slice(0, cut).replace(/[.,]/g, "")}.${raw.slice(cut + 1)}`;
}

/** Minor units from a typed major amount, or null when nothing was typed. */
function crmMinor(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(crmDigits(v));
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** The visitor's own currency, for stamping a value that has never carried one. */
const crmCurrency = () => (typeof wsCurrency === "function" ? wsCurrency()
  : (typeof lmCurrency === "function" ? lmCurrency() : "PLN"));

/** An existing project's id, or "". The workspace is the authority on what exists. */
function crmProjectId(id) {
  const value = String(id || "");
  return value && typeof wsProject === "function" && wsProject(value) ? value : "";
}

/** Every project, split by chapter XXI's status vocabulary. */
const crmOpenProjects = () => (typeof wsAllProjects === "function" ? wsAllProjects() : [])
  .filter((project) => PROJECT_OPEN_STATUS.indexOf(project.status) !== -1);
const crmClosedProjects = () => (typeof wsAllProjects === "function" ? wsAllProjects() : [])
  .filter((project) => PROJECT_OPEN_STATUS.indexOf(project.status) === -1);

/** What a client's projects are worth, by status. */
function crmClientProjectCounts(clientId) {
  const out = { total: 0 };
  PROJECT_STATUS.forEach((s) => { out[s] = 0; });
  crmClientProjects(clientId).forEach((project) => {
    out.total++;
    if (Object.prototype.hasOwnProperty.call(out, project.status)) out[project.status]++;
  });
  return out;
}

/* ------------------------------------------------------------------ what it comes to */

/**
 * What a client's work is worth: their projects' costs, added up.
 *
 * Every project is counted through wsProjectCosts(), which is the one function that knows
 * a calculation and the material it produced are the same money — and the one that keeps
 * the currencies apart. Its buckets are merged here rather than its figures added, so a
 * client whose projects were priced in two currencies comes back with two sums and no
 * single `total` at all: chapter VI forbids converting them, and a client page is exactly
 * the screen where one invented number would be read as what the work is worth.
 */
function crmClientCosts(clientId) {
  const projects = crmClientProjects(clientId);
  const buckets = new Map();
  projects.forEach((p) => {
    (wsProjectCosts(p.id).byCurrency || []).forEach((b) => {
      const at = buckets.get(b.currencyCode)
        || { currencyCode: b.currencyCode, materials: 0, other: 0, total: 0 };
      at.materials += b.materials;
      at.other += b.other;
      at.total += b.total;
      buckets.set(b.currencyCode, at);
    });
  });
  const byCurrency = [...buckets.values()];
  const mixed = byCurrency.length > 1;
  const one = byCurrency[0] || { currencyCode: "", materials: 0, other: 0, total: 0 };
  const own = typeof wsCurrency === "function" ? wsCurrency() : "PLN";
  return {
    projects: projects.length,
    materials: mixed ? null : one.materials,
    other: mixed ? null : one.other,
    total: mixed ? null : one.total,
    currencyCode: mixed ? "" : (one.currencyCode || own),
    byCurrency,
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
 * derived project cost out of the stored project fields and a unit price out of a shopping item
 * (wsUnitPriceMinor()). It also means a quote answers "what is this worth *now*", which is
 * what a tradesman opens it to see.
 *
 * **The one link the quote stores is `projectId`.** The materials are the project's, so
 * without it there is nothing to price; the client is already reachable from the project
 * through crmClientOfProject(), so storing it again would be another link free to disagree.
 * crmQuoteChain() walks chapter XXIV's path backwards: WYCENA → PROJEKT → KLIENT.
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
  const n = Number(crmDigits(v));
  if (!isFinite(n) || n < 0) return null;
  return n;
}

/**
 * May this browser write a quote at all? — `quotes` in LM_FEATURES, PRO since session 24.
 *
 * The owner's decision of 2026-09-03 is that a guest and a free account never produce a
 * quote, and until then the whole of the enforcement was in the pages: assets/quotes-ui.js
 * and assets/app.js asked before they called, and this file wrote whatever it was handed.
 * A gate that only exists at the call sites is a gate that a second call site, or one line
 * typed into a console, walks straight round. So the store asks as well, and every one of
 * the seven writes below answers to it.
 *
 * **The reads are deliberately not gated.** crmQuotes() and crmQuoteTotals() are how the
 * page draws a quote for somebody who may have one, and refusing them here would mean the
 * store answering two ways about rows that are already on this device.
 *
 * The question goes to pwAllows() in assets/paywall.js, which is loaded on every page that
 * loads this file. A missing pwAllows() is a refusal: if the file that decides is not
 * there, the answer this one does not have is "no". Note what is *not* asked — the session
 * hint is never read here directly, because a hint that may be stale must not be what
 * decides a write (scripts/test-security.mjs §9); pwAllows() owns that reading and this
 * file owns none of it.
 *
 * Nothing here is a security boundary. The store is `localStorage` on one device, and a
 * visitor editing this file in their own devtools writes what they like — the note at the
 * top of assets/plan.js says the same thing about the whole model. It is the product
 * decision, enforced in the one place a browser can enforce anything.
 */
function crmCanQuote() {
  return typeof pwAllows === "function" && pwAllows("quotes");
}

/** A margin in percent: never negative, never past the cap, never more than two decimals. */
function crmPct(v) {
  if (v === undefined || v === null || String(v).trim() === "") return 0;
  const n = Number(crmDigits(v));
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
 *  two prices for one project is a variant, not a contradiction, and nothing here forbids it. */
const crmProjectQuotes = (projectId) =>
  crmQuotes().filter((q) => q.projectId && q.projectId === String(projectId || ""));

/**
 * Add a quote. Only the name is required, for the reason only a client's or project's name
 * is: everything else is filled in as it becomes known, and a named quote is already the
 * row the visitor wanted.
 *
 * @param {{name:string, projectId?:string, marginMajor?:string|number, note?:string}} fields
 * @returns {object|null} the stored quote, or null when there is no name
 */
function crmAddQuote(fields) {
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
  const f = fields || {};
  const name = crmText(f.name, CRM_MAX_NAME);
  if (!name) return null;
  const data = crmLoad();
  const now = Date.now();
  const quote = {
    id: crmId(),
    name,
    // A project that is not there is dropped rather than stored — the same rule a project's
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
  if (!crmSave(data)) return null;
  return crmQuote(quote.id);
}

/** Correct a quote in place. Anything not passed keeps its current value. */
function crmUpdateQuote(id, fields) {
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
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
  if (!crmSave(data)) return null;
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
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === id && !q.deletedAt);
  if (!quote) return null;
  const now = Date.now();
  quote.deletedAt = now;
  quote.updatedAt = now;
  if (!crmSave(data)) return null;
  return { id: id, at: now };
}

/** Undo one delete — the same tombstone-clearing as crmRestoreClient(). */
function crmRestoreQuote(token) {
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
  const id = typeof token === "string" ? token : (token && token.id);
  if (!id) return null;
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === id);
  if (!quote || !quote.deletedAt) return null;
  quote.deletedAt = null;
  quote.updatedAt = Date.now();
  if (!crmSave(data)) return null;
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
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
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
  if (!crmSave(data)) return null;
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
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
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
  if (!crmSave(data)) return null;
  return crmQuote(quoteId);
}

/** Take one labour line off a quote. */
function crmDeleteLabour(quoteId, lineId) {
  // The plan on the account, asked in the store as well as at the call site.
  if (!crmCanQuote()) return null;
  const data = crmLoad();
  const quote = data.quotes.find((q) => q.id === quoteId && !q.deletedAt);
  if (!quote || !Array.isArray(quote.labour)) return null;
  const before = quote.labour.length;
  quote.labour = quote.labour.filter((l) => l.id !== lineId);
  if (quote.labour.length === before) return null;
  crmStampQuote(quote);
  quote.updatedAt = Date.now();
  if (!crmSave(data)) return null;
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
      currencyCode: own, projectCurrencyCode: "", projectByCurrency: [],
      hasProject: false, mixed: false, lines: 0,
    };
  }
  const costs = quote.projectId && typeof wsProjectCosts === "function"
    ? wsProjectCosts(quote.projectId) : null;
  // The project's two figures are null when the project mixes currencies — the quote
  // inherits that rather than papering over it, because a subtotal built out of unlike
  // amounts is exactly the number a client would be shown.
  const materials = costs ? costs.materials : 0;
  const other = costs ? costs.other : 0;
  const lines = Array.isArray(quote.labour) ? quote.labour : [];
  const labour = lines.reduce((sum, l) => sum + (l.amountMinor || 0), 0);
  const marginPct = Number(quote.marginPct) || 0;
  const projectCode = costs && !costs.mixed && (costs.total || costs.items || costs.others)
    ? costs.currencyCode : "";
  // Two ways for a quote to hold unlike money: the project itself is mixed, or labour was
  // typed in one currency and the project priced in another. Either way the four summed
  // figures do not exist, and the page prints what it has instead of a total.
  const mixed = Boolean((costs && costs.mixed)
    || (labour > 0 && projectCode && quote.currencyCode
      && quote.currencyCode !== projectCode));
  const subtotal = mixed ? null : materials + other + labour;
  const margin = mixed ? null : Math.round(subtotal * marginPct / 100);
  return {
    materials,
    other,
    labour,
    subtotal,
    marginPct,
    margin,
    total: mixed ? null : subtotal + margin,
    projectByCurrency: costs ? costs.byCurrency : [],
    // The quote's own stamp is the currency somebody typed into a labour line, so it only
    // speaks for the figures while there IS a labour line. With the labour deleted, every
    // amount left is the project's, and the label has to be the project's too — otherwise
    // a quote stamped EUR last week prints this month's złoty materials as euro. The
    // visitor's own choice is the fallback for a quote holding no money at all.
    currencyCode: (labour > 0 ? quote.currencyCode : "") || projectCode || quote.currencyCode || own,
    projectCurrencyCode: projectCode,
    hasProject: Boolean(costs),
    mixed,
    lines: lines.length,
  };
}

/* ------------------------------------------------------------------ the chain
 *
 * Master plan, session 26 (CRM), chapter XXIV:
 *
 *     CRM LiczMat Pro ma być lekki. Główna relacja:
 *     KLIENT → PROJEKT → WYCENA → HISTORIA
 *     Celem jest szybkie zarządzanie pracą fachowca. Nie tworzymy ogromnego systemu ERP.
 *
 * **Session 26 adds no collection and no page.** Every link the chapter names was stored
 * by the sessions before it — the project keeps `clientId`, the legacy client keeps
 * `projectIds`, and the quote keeps `projectId` — and each screen already
 * walked its own step. What was missing is the path itself: from a quote there was no way
 * back to the client without opening two pages, and from a client no way at all to the
 * quotes their work was priced in. So this section is one walker and one reading, both
 * derived, and `crm` is the one feature in LM_FEATURES with `route: null` for exactly that
 * reason.
 *
 * Nothing below writes. A chain that was stored would be another copy of three links, free
 * to disagree with all of them the first time a project changed hands — the argument that
 * already keeps a cost off a project row, a unit price off a shopping item and a date out of the
 * terminarz.
 */

/** The nodes of chapter XXIV's path, in the chapter's own order. */
const CRM_CHAIN = ["client", "project", "quote"];

/**
 * Chapter XXIV's path through one node, walked in both directions.
 *
 * Upwards it is exact: a quote is priced from one project and a project is filed under at
 * most one client. Downwards a client has many projects and a project may carry several
 * quotes, so the walker fills in what it can prove
 * and hands back the rest as a list rather than guessing. `quote` is therefore null for
 * everything except a walk that *started* at a quote; `quotes` is what the page lists.
 *
 * @param {"client"|"project"|"quote"} kind which node `id` names
 * @param {string} id
 * @returns {{from:string, client:object|null, project:object|null,
 *            quote:object|null, quotes:object[]}}
 */
function crmChain(kind, id) {
  const out = { from: String(kind || ""), client: null, project: null, quote: null, quotes: [] };
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
  else {
    out.client = crmClient(key);
    if (!out.client) return out;
    out.quotes = crmClientQuotes(key);
    return out;
  }

  if (pid && typeof wsProject === "function") out.project = wsProject(pid);
  if (!out.client && pid) out.client = crmClientOfProject(pid);
  if (pid && out.from !== "quote") out.quotes = crmProjectQuotes(pid);
  return out;
}

/**
 * Chapter XXIV read backwards from a quote: WYCENA → PROJEKT → KLIENT.
 *
 * Kept as its own name because that is what /wyceny/ asks for and what session 24's test
 * checks; it is crmChain() underneath, so there is one walker rather than two that can
 * come to different answers.
 */
function crmQuoteChain(quoteId) {
  const chain = crmChain("quote", quoteId);
  return { project: chain.project, client: chain.client };
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
 * with the date it was written on: a client, a project, a quote, a calculation saved into a
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
const CRM_HISTORY_KINDS = ["client", "project", "quote", "calc", "cost"];

/**
 * What has happened, for a client or a project.
 *
 * @param {{clientId?:string, projectId?:string}} scope exactly one of the two.
 *   An empty or unknown scope answers [].
 * @param {number} [limit] how many rows to hand back, newest first
 * @returns {{at:number, kind:string, id:string, name:string, project:object|null,
 *            line:object|null, quote:object|null}[]}
 */
function crmHistory(scope, limit) {
  const s = scope || {};
  const rows = [];
  const add = (at, kind, id, name, extra) => {
    const when = Number(at);
    if (!isFinite(when) || when <= 0) return;
    rows.push(Object.assign({
      at: when, kind: kind, id: String(id || ""), name: String(name || ""),
      project: null, line: null, quote: null,
    }, extra || {}));
  };

  let projects = [];
  if (s.clientId) {
    const client = crmClient(s.clientId);
    if (!client) return [];
    add(client.createdAt, "client", client.id, client.name);
    projects = crmClientProjects(s.clientId);
  } else if (s.projectId) {
    const project = typeof wsProject === "function" ? wsProject(s.projectId) : null;
    if (!project) return [];
    projects = [project];
  } else {
    return [];
  }

  projects.forEach((project) => {
    add(project.createdAt, "project", project.id, project.name, { project: project });
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

  // Newest first. Rows written in the same millisecond are ordered by how far along the
  // chain they are, latest step first, so
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
 * **Nothing below stores anything.** A deadline is already a field of a project — chapter
 * XXI's `termin`, written by wsUpdateProject() — so the terminarz is a *reading* of the
 * projects, not a collection beside them. An `events` array of its own
 * would give one date two homes and let them disagree the first time somebody changed a
 * deadline on the project's own page, which is the argument that already keeps a unit
 * price off a shopping item. A row here opens the project it belongs to.
 *
 * The comparisons are all between calendar days, never between instants. That is what
 * crmDay() is for, and it is why a deadline was stored as "YYYY-MM-DD" in session 23:
 * "the 14th" has to be the 14th for a browser in Rzeszów and for one in Lisbon.
 */

/**
 * Today, in the visitor's own timezone, as "YYYY-MM-DD".
 *
 * Deliberately not `new Date().toISOString().slice(0, 10)`, which is today in UTC: at
 * 23:30 in Warsaw that string already says tomorrow, so a project due today would be filed
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
 * Which of the terminarz's buckets a project belongs in, measured against `today`.
 *
 * A closed project — chapter XXI's "zakończone" and "anulowane" — is never in one: it is
 * done with, and a finished project whose date has passed is not late. crmSchedule() folds those
 * away separately rather than dropping them, so nothing disappears from the page.
 */
function crmProjectBucket(project, today) {
  if (!project || PROJECT_OPEN_STATUS.indexOf(project.status) === -1) return "";
  const days = crmDaysUntil(project.dueDate, today);
  if (days === null) return "none";
  if (days < 0) return "late";
  if (days === 0) return "today";
  return days <= CAL_SOON_DAYS ? "soon" : "later";
}

/**
 * The whole terminarz: every project this browser holds, in the bucket its deadline puts it.
 *
 * Within a bucket the nearest deadline comes first, because that is the order the work
 * has to be done in; the undated bucket keeps the store's own order (newest change
 * first), because there is nothing else to sort it by. The closed half carries only the
 * projects that *had* a date — a finished project nobody ever dated has no place on a page about
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

  const projects = typeof wsAllProjects === "function" ? wsAllProjects() : [];
  projects.forEach((project) => {
    const bucket = crmProjectBucket(project, day);
    if (bucket) buckets[bucket].push(project);
    else if (project.dueDate) closed.push(project);
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
 * Every project that carries a deadline, grouped under it — "YYYY-MM-DD" -> [project, ...].
 *
 * 2026-09-03, owner's decision: /app/'s Terminarz tab gets a real month grid, reversing
 * chapter XXIII's "nie buduj odpowiednika Google Calendar" (see the note at the top of
 * assets/schedule-ui.js and docs/MASTER_PLAN.txt chapter XXIII for the original scope and
 * why it stood). crmSchedule() still answers "kiedy" in words (late/today/soon/later) and
 * stays exactly as it was; this is the second, day-indexed view the grid needs, built from
 * the same wsAllProjects() so the two can never disagree about a project's deadline.
 *
 * Open and closed projects both appear — a finished project due last Tuesday still belongs
 * on last Tuesday's cell, dimmed by the caller, not erased. A day with no projects has
 * no key here at all, so the caller's own lookup already tells it "empty" for free.
 */
function crmProjectsByDay() {
  const byDay = {};
  const projects = typeof wsAllProjects === "function" ? wsAllProjects() : [];
  projects.forEach((project) => {
    if (!project.dueDate) return;
    (byDay[project.dueDate] || (byDay[project.dueDate] = [])).push(project);
  });
  return byDay;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CRM_KEY, CRM_SCHEMA, CRM_MAX_NAME, CRM_MAX_NOTE,
    PROJECT_STATUS, PROJECT_OPEN_STATUS, PROJECT_DEFAULT_STATUS, PROJECT_COLORS,
    CAL_BUCKETS, CAL_SOON_DAYS,
    CRM_CHAIN, CRM_HISTORY_KINDS,
    QUO_MAX_LINES, QUO_MAX_MARGIN,
  };
}
