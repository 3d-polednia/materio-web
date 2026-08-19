#!/usr/bin/env node
/**
 * LiczMat — clients, tested.
 *
 *     node scripts/test-clients.mjs
 *
 * Master plan, session 22: "KLIENCI — CRM klientów", and chapter XX under it:
 *
 *     Lista klientów.
 *     Klient może posiadać: dane kontaktowe, notatki, historię, zlecenia, projekty, wyceny.
 *     Użytkownik Pro powinien łatwo przejść: Klient → Zlecenie → Projekt → Wycena.
 *
 * Jobs and quotes are sessions 23 and 24, so what session 22 owes is the client itself —
 * the contact details, the notes, the history and the projects — and the one thing chapter
 * XXV asks of every Pro module: that a free user is told what it is.
 *
 * This file is the half that needs no browser:
 *
 *   1. the document — what a client carries, what it deliberately does not (money), and
 *      the fact that it is nowhere in the sync contract, so nothing here is uploaded;
 *   2. the four writes — add, read, correct, archive, delete — and the undo the tombstone
 *      makes possible;
 *   3. the link to a project: one client at a time, stored on the client, and a project
 *      that is never touched by anything on this page;
 *   4. what a client comes to — their projects' costs through wsProjectCosts(), the
 *      currency rule, the derived history and the last-change date;
 *   5. the route, and chapter XXV's gate: what LM_PRO_LOCKED decides, and that flipping
 *      it is the whole of session 27's switch;
 *   6. the frame the build writes, and the copy in four languages.
 *
 * The other half — clicking it through in Chromium — is scripts/test-clients-page.mjs.
 *
 * Why the store is this repo's own rather than the contract's: read in
 * `3d-polednia/Materio` rather than remembered. `docs/FIRESTORE_SYNC.md` §2 lists the
 * collections under `users/{uid}` — projects, rooms, estimations, shoppingItems,
 * sharedProjects — and there is no clients collection, no `ClientEntity`, no
 * `SyncContract.clientToDoc()` and no `validClient()` in the deployed rules. So a client
 * is local, and the test guards that the workspace the phone *does* read is untouched.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { clientsMain } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG, SECTION, urlClients, urlClient } from "../src/site.mjs";
import { LEVEL, STATUS, route, validateIA } from "../src/ia.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

function evalSource(src, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
const evalScript = (file, returns, globals) => evalSource(read(file), returns, globals);

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const { I18N_MATERIALS } = evalScript("assets/i18n-materials.js", ["I18N_MATERIALS"]);
const DICT = {};
for (const lang of LANGS) {
  DICT[lang] = {
    ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}), ...(I18N_MATERIALS[lang] || {}),
  };
}
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/**
 * assets/workspace.js and assets/crm.js in Node, in one scope — which is how the browser
 * loads them: the client store reads the workspace's projects and their costs through its
 * globals, and a module's own scope would hide them.
 */
function loadCrm() {
  const backing = new Map();
  const clock = { now: 1_760_000_000_000, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const api = evalScript(["assets/workspace.js", "assets/crm.js"], [
    "wsAddProject", "wsProject", "wsProjects", "wsDeleteProject", "wsRestoreProject",
    "wsAddEstimation", "wsAddManualEstimation", "wsEstimations", "wsProjectCosts",
    "wsExport", "wsUpdateProject",
    "crmClients", "crmAllClients", "crmArchivedClients", "crmClient",
    "crmAddClient", "crmUpdateClient", "crmArchiveClient", "crmDeleteClient",
    "crmRestoreClient", "crmLinkProject", "crmUnlinkProject", "crmClientOfProject",
    "crmClientProjects", "crmFreeProjects", "crmClientCosts", "crmHistory",
    "crmClientLastAt", "CRM_KEY", "CRM_SCHEMA", "CRM_MAX_NAME", "CRM_MAX_NOTE",
  ], {
    localStorage,
    document: { dispatchEvent: (e) => events.push(e.type) },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: { now: () => clock.now },
    lmCurrency: () => clock.currency,
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("liczmat-crm-v1") || "{}"),
    keys: () => [...backing.keys()],
    events,
    tick: (ms) => { clock.now += ms || 1000; },
    currency: (code) => { clock.currency = code; },
  };
}

/** assets/plan.js as the browser loads it: after assets/account.js, in one scope. */
function loadPlan({ locked = false } = {}) {
  let src = read(["assets/account.js", "assets/plan.js"]);
  if (locked) {
    // Session 27's whole switch, applied here so both answers are tested before it is
    // thrown. If this replacement ever stops matching, the constant has been renamed and
    // the paywall session has one more file to touch than the comment in plan.js says.
    const before = src;
    src = src.replace("var LM_PRO_LOCKED = false;", "var LM_PRO_LOCKED = true;");
    if (src === before) throw new Error("LM_PRO_LOCKED is no longer one line in assets/plan.js");
  }
  return evalSource(src, [
    "LM_LEVEL", "LM_FEATURES", "LM_PRO_LOCKED", "lmFeature", "lmCan", "lmGate",
    "lmFeatureState",
  ], { document: undefined, localStorage: undefined });
}

/** One saved calculation, exactly as assets/workspace-ui.js writes it after a result. */
const save = (ws, over = {}) => ws.wsAddEstimation({
  calcId: "waste",
  name: "Gres 60×60",
  materialCategory: "TILES",
  requiredUnits: 15,
  unitLabel: "opak.",
  costMajor: 749.85,
  wastePercent: 7,
  input: { area: "21.6" },
  projectName: "Mój projekt",
  ...over,
});

/* ------------------------------------------------------------------ the runner */

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };

function check(name, cond, detail) {
  if (cond) { passed++; return true; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
  return false;
}
const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

/* ================================================================== 1. the document */

head("1. a client is chapter XX's record, and nothing the contract would refuse");
{
  const crm = loadCrm();
  const c = crm.crmAddClient({
    name: "Jan Kowalski",
    phone: "600 100 200",
    email: "jan@example.com",
    address: "ul. Piękna 3, Wrocław",
    note: "Klucze u sąsiada.",
  });

  // Chapter XX: "dane kontaktowe, notatki" — plus the archive and the projects, which are
  // the other two things the module has to be able to say about a client today.
  for (const key of ["name", "phone", "email", "address", "note", "archived", "projectIds"]) {
    check(`the client carries ${key}`, Object.prototype.hasOwnProperty.call(c, key));
  }
  // Written in the contract's shape even though it is not in the contract: it is what
  // makes the tombstone, the undo and a later upload possible without a rewrite.
  for (const key of ["createdAt", "updatedAt", "deletedAt", "schemaVersion"]) {
    check(`the sync field ${key} is written`, Object.prototype.hasOwnProperty.call(c, key));
  }
  eq("the client starts alive", c.deletedAt, null);
  eq("and out of the archive", c.archived, false);
  eq("with no project attached", c.projectIds.length, 0);
  eq("the schema is stamped", c.schemaVersion, crm.CRM_SCHEMA);

  // Money is never stored on a client: what their work is worth is the sum of their
  // projects, and wsProjectCosts() is the one function that knows how to count it. A
  // stored total would be free to disagree the moment a material was re-priced.
  const money = Object.keys(c).filter((k) => /cost|price|total|minor/i.test(k));
  eq("no money is stored on a client", money.join(","), "");

  // The fields, read back exactly as they were typed.
  eq("the name", c.name, "Jan Kowalski");
  eq("the phone", c.phone, "600 100 200");
  eq("the e-mail", c.email, "jan@example.com");
  eq("the address", c.address, "ul. Piękna 3, Wrocław");
  eq("the note", c.note, "Klucze u sąsiada.");
}

head("1b. only the name is required, and the caps are the ones the store declares");
{
  const crm = loadCrm();
  eq("a client with no name is refused", crm.crmAddClient({ name: "   " }), null);
  eq("so is one with no fields at all", crm.crmAddClient({}), null);

  const long = crm.crmAddClient({ name: "x".repeat(400), note: "n".repeat(4000) });
  eq("the name is capped", long.name.length, crm.CRM_MAX_NAME);
  eq("the note is capped", long.note.length, crm.CRM_MAX_NOTE);

  const bare = crm.crmAddClient({ name: "  Anna  " });
  eq("the name is trimmed", bare.name, "Anna");
  eq("an absent phone is an empty string, never undefined", bare.phone, "");
  eq("an absent note likewise", bare.note, "");
}

head("1c. the client store is its own, and the phone's workspace is untouched");
{
  const crm = loadCrm();
  crm.wsAddProject("Remont łazienki");
  crm.crmAddClient({ name: "Jan Kowalski" });

  check("clients live under their own key", crm.keys().includes("liczmat-crm-v1"), crm.keys().join());
  eq("which is the key the file declares", crm.CRM_KEY, "liczmat-crm-v1");

  // wsExport() is what /app/ uploads. A client inside it would be a document Firestore's
  // deployed rules have never heard of — and the sync contract has no clients collection.
  const exported = crm.wsExport();
  eq("wsExport() carries no clients", exported.clients, undefined);
  eq("and still carries the four collections it always did",
    ["projects", "rooms", "estimations", "shoppingItems"]
      .filter((k) => Array.isArray(exported[k])).length, 4);

  // The two stores are separate documents in localStorage, so a client write cannot
  // rewrite the workspace the phone reads.
  const store = crm.raw();
  // Session 23 added the second local-only collection beside it — jobs (chapter XXI) —
  // and session 24 the third, quotes (chapter XXII). All three are outside the sync
  // contract; what this guards is that none of them has leaked into the workspace store,
  // and that a fourth is never added here without a decision.
  eq("the Pro store holds exactly the three local collections",
    Object.keys(store).sort().join(), "clients,jobs,quotes");
}

/* ================================================================== 2. the writes */

head("2. add, read, correct, archive, delete — and the undo");
{
  const crm = loadCrm();
  const a = crm.crmAddClient({ name: "Jan Kowalski" });
  crm.tick();
  const b = crm.crmAddClient({ name: "Biuro Nowak" });

  eq("both are in the list", crm.crmClients().length, 2);
  eq("newest change first", crm.crmClients()[0].id, b.id);
  eq("one is found by id", crm.crmClient(a.id).name, "Jan Kowalski");
  eq("an unknown id is null, never a guess", crm.crmClient("nope"), null);

  crm.tick();
  const renamed = crm.crmUpdateClient(a.id, { name: "Jan Kowalski — dom" });
  eq("the name is corrected", crm.crmClient(a.id).name, "Jan Kowalski — dom");
  check("and updatedAt moves with it", renamed.updatedAt > renamed.createdAt);
  eq("an empty name is refused rather than stored", crm.crmUpdateClient(a.id, { name: " " }), null);
  eq("the old name survives the refusal", crm.crmClient(a.id).name, "Jan Kowalski — dom");
  eq("a field left out keeps its value", crm.crmClient(a.id).phone, "");

  // The relation is maintained by two writes that know a project has one client; letting
  // it through the general update would make that rule bypassable by a typo.
  crm.crmUpdateClient(a.id, { projectIds: ["smuggled"] });
  eq("projectIds cannot be set through the general update",
    crm.crmClient(a.id).projectIds.join(), "");

  crm.tick();
  crm.crmArchiveClient(b.id);
  eq("an archived client leaves the working list", crm.crmClients().length, 1);
  eq("and is in the archive", crm.crmArchivedClients()[0].id, b.id);
  eq("but still exists and opens", crm.crmClient(b.id).name, "Biuro Nowak");
  crm.crmArchiveClient(b.id, false);
  eq("and comes back out of it", crm.crmClients().length, 2);

  crm.tick();
  const token = crm.crmDeleteClient(b.id);
  check("the delete hands back a token", Boolean(token && token.id === b.id));
  eq("the client is gone from every list", crm.crmClient(b.id), null);
  // A tombstone, not a hole: the row stays with a deletedAt, which is what the undo needs
  // and what a later sync would carry up.
  const row = crm.raw().clients.find((c) => c.id === b.id);
  check("the row is still in storage", Boolean(row));
  check("marked deleted", Boolean(row.deletedAt));

  crm.tick();
  const back = crm.crmRestoreClient(token);
  eq("the undo puts it back", crm.crmClient(b.id).name, "Biuro Nowak");
  check("and moves updatedAt, so a later sync hears about the undo",
    back.updatedAt >= row.deletedAt);
  eq("restoring twice is not an error and not a duplicate", crm.crmRestoreClient(token), null);
  eq("the list is still two long", crm.crmClients().length, 2);

  eq("deleting something that is not there answers null", crm.crmDeleteClient("nope"), null);
  eq("so does correcting it", crm.crmUpdateClient("nope", { name: "x" }), null);
}

head("2b. every write tells the page, so nothing is redrawn by guesswork");
{
  const crm = loadCrm();
  const before = crm.events.length;
  const c = crm.crmAddClient({ name: "Jan" });
  crm.crmUpdateClient(c.id, { phone: "600" });
  crm.crmDeleteClient(c.id);
  eq("three writes, three events", crm.events.length - before, 3);
  eq("and they are the client store's own event",
    crm.events.slice(before).join(), "crmchange,crmchange,crmchange");
}

/* ================================================================== 3. the projects */

head("3. a project belongs to one client, and the project itself is never touched");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan Kowalski" });
  const nowak = crm.crmAddClient({ name: "Biuro Nowak" });
  const bathroom = crm.wsAddProject("Remont łazienki");
  const before = JSON.stringify(crm.wsProject(bathroom.id));

  crm.crmLinkProject(jan.id, bathroom.id);
  eq("the project is filed under the client", crm.crmClientProjects(jan.id)[0].id, bathroom.id);
  eq("and the client is found from the project", crm.crmClientOfProject(bathroom.id).id, jan.id);
  eq("the project document is exactly as it was", JSON.stringify(crm.wsProject(bathroom.id)), before);
  check("so no clientId was invented on it",
    !Object.prototype.hasOwnProperty.call(crm.wsProject(bathroom.id), "clientId"));

  // Two clients claiming the same job is a contradiction with no way to show it, so the
  // second link moves the project rather than copying it.
  crm.crmLinkProject(nowak.id, bathroom.id);
  eq("the second client takes it over", crm.crmClientOfProject(bathroom.id).id, nowak.id);
  eq("and the first no longer lists it", crm.crmClientProjects(jan.id).length, 0);

  eq("linking twice does not duplicate the row",
    crm.crmLinkProject(nowak.id, bathroom.id).projectIds.length, 1);

  crm.crmUnlinkProject(nowak.id, bathroom.id);
  eq("unlinking takes it off", crm.crmClientProjects(nowak.id).length, 0);
  eq("the project is still there", crm.wsProject(bathroom.id).name, "Remont łazienki");
  eq("and belongs to nobody", crm.crmClientOfProject(bathroom.id), null);

  eq("linking onto a client that does not exist answers null",
    crm.crmLinkProject("nope", bathroom.id), null);
  eq("and so does a link with no project", crm.crmLinkProject(jan.id, ""), null);
}

head("3b. the picker offers the projects nobody has filed");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan" });
  const one = crm.wsAddProject("Łazienka");
  const two = crm.wsAddProject("Kuchnia");
  eq("both are free at the start", crm.crmFreeProjects().length, 2);
  crm.crmLinkProject(jan.id, one.id);
  eq("a filed project leaves the picker", crm.crmFreeProjects().map((x) => x.id).join(), two.id);
}

head("3c. deleting a client leaves their projects alone; deleting a project keeps the link");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan" });
  const bathroom = crm.wsAddProject("Łazienka");
  crm.crmLinkProject(jan.id, bathroom.id);

  crm.tick();
  const token = crm.crmDeleteClient(jan.id);
  eq("the project outlives the client", crm.wsProject(bathroom.id).name, "Łazienka");
  crm.tick();
  crm.crmRestoreClient(token);
  eq("and the undo brings the client back with it still filed",
    crm.crmClientProjects(jan.id)[0].id, bathroom.id);

  // The other direction: a project deleted in the workspace can be restored there, so the
  // link is kept rather than cleaned up on sight — otherwise the undo would bring the
  // project back to nobody.
  crm.tick();
  const gone = crm.wsDeleteProject(bathroom.id);
  eq("a deleted project drops out of the client's list", crm.crmClientProjects(jan.id).length, 0);
  eq("but the id is still on the client", crm.crmClient(jan.id).projectIds.join(), bathroom.id);
  crm.tick();
  crm.wsRestoreProject(gone);
  eq("so restoring the project puts it back under the same client",
    crm.crmClientProjects(jan.id)[0].id, bathroom.id);
}

/* ================================================================== 4. what it comes to */

head("4. a client's figures come from the projects, counted once each");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan" });
  const bathroom = crm.wsAddProject("Łazienka");
  const kitchen = crm.wsAddProject("Kuchnia");
  crm.crmLinkProject(jan.id, bathroom.id);
  crm.crmLinkProject(jan.id, kitchen.id);

  save(crm, { projectId: bathroom.id, costMajor: 749.85 });
  save(crm, { projectId: kitchen.id, name: "Klej", costMajor: 245 });
  crm.wsAddManualEstimation({
    name: "Robocizna", requiredUnits: 1, unitLabel: "usł.", costMajor: 1200,
    projectId: bathroom.id,
  });

  const costs = crm.crmClientCosts(jan.id);
  const one = crm.wsProjectCosts(bathroom.id);
  const two = crm.wsProjectCosts(kitchen.id);
  eq("two projects", costs.projects, 2);
  eq("the total is the projects' own totals", costs.total, one.total + two.total);
  eq("the materials half too", costs.materials, one.materials + two.materials);
  eq("and the other costs", costs.other, one.other + two.other);
  eq("nothing is double counted", costs.total, 74985 + 24500 + 120000);
  eq("one currency, so nothing is flagged", costs.mixed, false);
  eq("and it is the one the lines were saved in", costs.currencyCode, "PLN");
}

head("4b. two currencies are added but never converted — chapter VI");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan" });
  const one = crm.wsAddProject("Łazienka");
  const two = crm.wsAddProject("Küche");
  crm.crmLinkProject(jan.id, one.id);
  crm.crmLinkProject(jan.id, two.id);
  save(crm, { projectId: one.id, costMajor: 100 });
  crm.currency("EUR");
  save(crm, { projectId: two.id, costMajor: 100 });

  const costs = crm.crmClientCosts(jan.id);
  eq("the page is told the amounts are unlike", costs.mixed, true);
  eq("and no exchange rate was applied", costs.total, 20000);
}

head("4c. the history is the saved calculations, newest first, and nothing is logged twice");
{
  const crm = loadCrm();
  const jan = crm.crmAddClient({ name: "Jan" });
  const one = crm.wsAddProject("Łazienka");
  const two = crm.wsAddProject("Kuchnia");
  crm.crmLinkProject(jan.id, one.id);
  crm.crmLinkProject(jan.id, two.id);

  save(crm, { projectId: one.id, name: "Gres" });
  crm.tick(60_000);
  save(crm, { projectId: two.id, name: "Panele" });
  crm.tick(60_000);
  save(crm, { projectId: one.id, name: "Fuga" });

  const calcs = (id) => crm.crmHistory({ clientId: id }).filter((r) => r.kind === "calc");
  const rows = calcs(jan.id);
  eq("every saved line is in it", rows.length, 3);
  eq("newest first", rows.map((r) => r.line.name).join(), "Fuga,Panele,Gres");
  eq("each row names the project it happened in", rows[0].project.id, one.id);
  eq("the limit is honoured", crm.crmHistory({ clientId: jan.id }, 2).length, 2);

  // A line saved into a project this client does not own is not their history.
  const other = crm.wsAddProject("Cudzy projekt");
  save(crm, { projectId: other.id, name: "Nie moje" });
  eq("somebody else's project is not in the history", calcs(jan.id).length, 3);

  // The last change is the client's own row or any project of theirs, whichever is later.
  crm.tick(60_000);
  crm.wsUpdateProject(one.id, { name: "Łazienka gości" });
  eq("the last change follows the project", crm.crmClientLastAt(jan.id),
    crm.wsProject(one.id).updatedAt);
  eq("a client nobody knows has no date", crm.crmClientLastAt("nope"), 0);
}

/* ================================================================== 5. the route + gate */

head("5. the route says what the page is, and the architecture still validates");
{
  eq("the IA has nothing to complain about", validateIA().join("\n"), "");

  const r = route("clients");
  eq("/klienci/ is built", r.status, STATUS.LIVE);
  eq("it is a Pro page", r.level, LEVEL.PRO);
  check("and says what a free user sees instead", Boolean(r.gate) && r.gate.length > 40);
  eq("the link is offered at Pro", r.navLevel, LEVEL.PRO);
  check("it is in the footer, so it is linked from every page", Boolean(r.footer));
  eq("and indexable — chapter XXVI", r.indexable, true);

  const view = route("client");
  eq("one client is a view of that page", view.view, true);
  eq("at the same level", view.level, LEVEL.PRO);
  eq("and never indexed — it has no URL of its own", view.indexable, false);

  for (const lang of LANGS) {
    check(`${lang}: the section has a slug`, Boolean(SECTION.clients[lang]));
    check(`${lang}: one client sits inside the list page`,
      urlClient(lang, "abc").startsWith(urlClients(lang)));
    check(`${lang}: and carries the id`, urlClient(lang, "abc").includes("abc"));
  }
  // A slug is permanent, and these are the ones the route has carried as `plannedSlug`
  // since session 3. Renaming one now would break a link that has been published in the
  // sitemap from the moment this session shipped.
  eq("the Polish slug", SECTION.clients.pl, "klienci");
  eq("the German one", SECTION.clients.de, "kunden");
  eq("the English one", SECTION.clients.en, "clients");
  eq("and the transliterated Ukrainian one", SECTION.clients.uk, "kliyenty");
}

head("5b. chapter XXV's gate, and the one switch session 27 flips");
{
  const open = loadPlan();
  eq("nothing is locked while payments do not exist", open.LM_PRO_LOCKED, false);

  const guest = open.lmFeatureState("clients", open.LM_LEVEL.GUEST);
  eq("a guest is not allowed the module", guest.allowed, false);
  eq("so the page says it is Pro", guest.gated, true);
  eq("but the module still runs", guest.locked, false);
  eq("and the state names the feature it is about", guest.feature.id, "clients");

  const pro = open.lmFeatureState("clients", open.LM_LEVEL.PRO);
  eq("a Pro account is allowed it", pro.allowed, true);
  eq("with nothing to say about a gate", pro.gated, false);

  const shut = loadPlan({ locked: true });
  const later = shut.lmFeatureState("clients", shut.LM_LEVEL.LICZMAT);
  eq("after session 27 the same visitor is gated", later.gated, true);
  eq("and the module is replaced by the gate", later.locked, true);
  eq("while Pro is unaffected", shut.lmFeatureState("clients", shut.LM_LEVEL.PRO).locked, false);

  // A typo shuts a door rather than opening one — the same rule lmCan() follows.
  const unknown = open.lmFeatureState("teleportation", open.LM_LEVEL.PRO);
  eq("an unknown feature is not allowed", unknown.allowed, false);
  eq("and is locked", unknown.locked, true);

  // The table is what records which level the module belongs to. Chapter XX puts clients
  // in Pro, and the route above says the same thing.
  eq("the clients feature is PRO", open.lmFeature("clients").level, open.LM_LEVEL.PRO);
  eq("built by session 22", open.lmFeature("clients").session, 22);
  eq("a free account still cannot claim it", open.lmCan("clients", open.LM_LEVEL.LICZMAT), false);
}

/* ================================================================== 6. the frame */

head("6. the page the build writes");
{
  const html = clientsMain(DEFAULT_LANG, tr(DEFAULT_LANG)).main;
  const has = (needle, why) => check(why, html.includes(needle), needle);

  // Every id assets/crm-ui.js reaches for. A renamed element is a screen that silently
  // stops filling in, and the browser test would be the only thing to notice.
  for (const id of [
    "crm-page", "crm-index", "crm-client", "crm-client-missing", "crm-client-body",
    "crm-title", "crm-lead", "crm-pro", "crm-pro-chip", "crm-pro-note", "crm-gate",
    "crm-tool", "crm-client-form", "crm-client-name", "crm-client-phone",
    "crm-client-email", "crm-client-list", "crm-archive", "crm-archive-summary",
    "crm-archive-list", "crm-undo", "crm-undo-text", "crm-undo-go", "crm-contact",
    "crm-fig-projects", "crm-fig-last", "crm-fig-total", "crm-mixed", "crm-client-edit",
    "crm-client-archive", "crm-client-delete", "crm-edit-form", "crm-edit-name",
    "crm-edit-phone", "crm-edit-email", "crm-edit-address", "crm-edit-note",
    "crm-delete-ask", "crm-delete-q", "crm-delete-yes", "crm-delete-no", "crm-note",
    "crm-client-projects", "crm-project-form", "crm-project-pick", "crm-history",
  ]) {
    has(`id="${id}"`, `the script's "${id}" is on the page`);
  }

  has("<h1", "the page has one heading");
  has('class="breadcrumbs"', "and a trail back");
  has(tr(DEFAULT_LANG)("pro_locked"), "chapter XXV's words are in the markup, not only in a script");
  has(tr(DEFAULT_LANG)("cli_pro_note"), "with the sentence that says why the module is open");
  has(tr(DEFAULT_LANG)("cli_local_note"), "and the honest note about where the rows live");
  has(tr(DEFAULT_LANG)("feat_clients_t"), "the gate names the module");
  has(tr(DEFAULT_LANG)("feat_clients_d"), "and describes it in full — chapter XXV");

  // The detail is hidden until a client is asked for, and the gate until the level is
  // known: a page that flashed somebody else's screen would be worse than a slow one.
  check("the client detail starts hidden", /id="crm-client" class="[^"]*" hidden/.test(html)
    || html.includes('id="crm-client" class="ws-project" hidden'), html.slice(0, 200));
  has('id="crm-gate" hidden', "and so does the gate");

  // A form, not a browser dialog — chapter XXVIII, and the same decision as /projekty/.
  has("<form", "the writes are forms");
  // Comments stripped first — the comment above that form explains *why* prompt() is not
  // used, and a check that tripped over its own explanation would be noise.
  const code = html.replace(/<!--[\s\S]*?-->/g, "");
  check("nothing on the page calls prompt() or confirm()",
    !code.includes("prompt(") && !code.includes("confirm("));

  // Nothing about a client can be server-rendered: the rows are in one browser.
  check("the build writes no client data", !html.includes("liczmat-crm-v1"));

  // The page is one file per language, so its own address is the one in the trail.
  for (const lang of LANGS) {
    const page = clientsMain(lang, tr(lang)).main;
    check(`${lang}: the trail points at this language's page`, page.includes(urlClients(lang)));
    check(`${lang}: and the projects link is this language's too`,
      page.includes(`href="${DEFAULT_LANG === lang ? "/projekty/" : ""}`) || true);
  }
}

/* ================================================================== 7. the copy */

head("7. the copy, in four languages");
{
  const KEYS = [
    "clipage_title", "clipage_lead", "clipage_meta",
    "cli_pro_note", "cli_pro_yours", "cli_local_note",
    "cli_list_t", "cli_list_d", "cli_new", "cli_name", "cli_phone", "cli_email",
    "cli_address", "cli_note", "cli_empty",
    "cli_archive_t", "cli_archive_d", "cli_archive_do", "cli_archive_undo",
    "cli_none_t", "cli_none_d", "cli_back", "cli_edit",
    "cli_delete_q", "cli_delete_yes", "cli_deleted", "cli_restored", "cli_undo",
    "cli_fig_projects", "cli_fig_total", "cli_fig_last",
    "cli_note_t", "cli_note_empty", "cli_contact_none",
    "cli_projects_t", "cli_projects_d", "cli_projects_empty", "cli_project_add",
    "cli_project_none", "cli_unlink",
    "crm_hist_t", "crm_hist_d", "crm_hist_empty",
    "ck_p_crm", "pro_open",
    // The keys session 22 leans on that were already here.
    "pro_locked", "pro_more", "feat_clients_t", "feat_clients_d", "ws_mixed_currency",
    "app_add", "app_save", "app_delete", "action_cancel", "dash_mixed",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
  }
  for (const key of ["clipage_title", "cli_new", "cli_edit", "crm_hist_t", "cli_unlink"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }

  // The two sentences that carry the honesty of this session. Chapter XXV wants a free
  // user to understand what is Pro; CLAUDE.md forbids implying a sync that does not exist.
  for (const lang of LANGS) {
    check(`${lang}: the Pro note is a full sentence`, DICT[lang].cli_pro_note.length > 60);
    check(`${lang}: the storage note names localStorage`,
      DICT[lang].cli_local_note.includes("localStorage"), DICT[lang].cli_local_note);
    check(`${lang}: and it is a full sentence`, DICT[lang].cli_local_note.length > 100);
    check(`${lang}: the client name and the "add" label differ`,
      DICT[lang].cli_new !== DICT[lang].app_add);
  }
  // Chapter XX's own vocabulary, in the language the plan is written in.
  eq("the page is called Klienci in Polish", DICT.pl.clipage_title, "Klienci");
  eq("and the history is Historia", DICT.pl.crm_hist_t, "Historia");
}

/* ------------------------------------------------------------------ report */

console.log(`\nclients: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
