#!/usr/bin/env node
/**
 * LiczMat — projects, tested.
 *
 *     node scripts/test-projects.mjs
 *
 * Master plan, session 15: "CRUD projektów." This file is the half that needs no
 * browser: the route the detail lives on, the four writes in assets/workspace.js —
 * create, read, update (rename and archive), delete — the undo the tombstone makes
 * possible, the frame the build writes for both screens, and the copy in all four
 * languages. The other half — the two screens in Chromium, the phone widths, the
 * variant with JavaScript off — is scripts/test-projects-page.mjs.
 *
 * Same shape as scripts/test-dashboard.mjs: no dependencies, plain `node`, exit 1 on a
 * failure so it can gate a commit.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LEVEL, STATUS, route, validateIA, livePaths, FLOWS, navRoutes, ROUTES } from "../src/ia.mjs";
import { projectsMain } from "../src/pages.mjs";
import { siteHeader, siteFooter } from "../src/template.mjs";
import { LANGS, DEFAULT_LANG, urlProject, urlProjects, urlEstimate, GUIDES } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Evaluate a browser script that has no exports and hand back the globals we need. */
function evalScript(file, returns, globals = {}) {
  const src = readFileSync(p(file), "utf8");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const DICT = {};
for (const lang of LANGS) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

const { CALCS } = evalScript("assets/calculators.js", ["CALCS"], { document: undefined, window: {} });

/**
 * assets/workspace.js in Node, on a fresh store.
 *
 * The file is written for a page: it reads `localStorage`, dispatches a DOM event and
 * asks assets/currency.js for the currency in force. Each of those gets the smallest
 * stand-in that lets the shipped file run unmodified, so what is tested is the code that
 * ships and not a copy of it.
 *
 * The clock is one of those stand-ins. Two rows written in the same millisecond order
 * arbitrarily and carry the same stamp, which is a coin toss inside a test rather than
 * anything a person can do — `tick()` moves time on so every assertion about "the newest
 * one" and "the lines that went with this delete" is about the code, not the schedule.
 */
function loadWorkspace(seed) {
  const backing = new Map(Object.entries(seed || {}));
  const clock = { now: 1_760_000_000_000 };
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const document = { dispatchEvent: (e) => events.push(e.type) };
  const api = evalScript("assets/workspace.js", [
    "WS_KEY", "WS_ACTIVE_KEY", "WS_SCHEMA", "wsLoad", "wsSave", "wsAlive",
    "wsAllProjects", "wsProjects", "wsArchivedProjects", "wsProject",
    "wsAddProject", "wsUpdateProject", "wsRenameProject", "wsArchiveProject",
    "wsDeleteProject", "wsRestoreProject",
    "wsActiveProjectId", "wsSetActiveProject", "wsActiveProject",
    "wsRooms", "wsAddRoom", "wsDeleteRoom",
    "wsEstimations", "wsAddEstimation", "wsDeleteEstimation", "wsProjectTotal",
    "wsExport", "wsImport",
  ], {
    localStorage,
    document,
    crypto: { randomUUID: () => `id-${backing.size}-${Math.random().toString(36).slice(2, 10)}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: { now: () => clock.now },
    lmCurrency: () => "PLN",
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return {
    ...api,
    store: backing,
    events,
    tick: (ms) => { clock.now += ms || 1000; },
    now: () => clock.now,
    raw: () => JSON.parse(backing.get("materio-workspace-v1") || "{}"),
  };
}

/** One saved estimate line, as the "add to the project" button writes it. */
const addLine = (ws, name, units, cost) => ws.wsAddEstimation({
  calcId: "waste", name, requiredUnits: units, unitLabel: "opak.",
  costMajor: cost, wastePercent: 10, input: { area: "21.6" },
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

/* ------------------------------------------------------------------ 1. the route */

head("1. one project is a declared screen, not a page that just appeared");
{
  const problems = validateIA();
  check("validateIA() is happy with the architecture", problems.length === 0, problems.join("\n      "));

  const r = route("project");
  check("the route exists", Boolean(r));
  eq("session 15 turned it live", r.status, STATUS.LIVE);
  eq("it is a view: a screen with no file of its own", r.view, true);
  eq("it hangs off /projekty/", r.parent, "projects");
  eq("it has a URL per language", r.localized, true);
  // The detail is somebody's own project list. There is nothing to rank and the URL
  // needs a key only that browser has.
  eq("and is never indexed", r.indexable, false);
  // Same argument as /projekty/ and the dashboard: the project is a row in this
  // browser's localStorage, so reading it cannot require an account.
  eq("a guest may open it", r.level, LEVEL.GUEST);
  check("it is not in the navigation", !r.header && !r.footer);

  for (const lang of LANGS) {
    const url = urlProject(lang, "abc");
    eq(`the ${lang} URL is the projects page plus the id`, url, `${urlProjects(lang)}?id=abc`);
  }
  eq("an id with a space or a slash is escaped", urlProject(DEFAULT_LANG, "a b/c"), "/projekty/?id=a%20b%2Fc");

  // A view emits nothing: the parent's file is the file. If livePaths() ever counted it,
  // the build's check against the IA would demand a directory GitHub Pages cannot serve.
  const paths = livePaths(CALCS, GUIDES);
  check("the build writes no file for it",
    ![...paths].some((f) => f.includes("?")), [...paths].filter((f) => f.includes("?")).join(", "));
  check("its parent's file is there", paths.has("projekty/index.html"));

  const liczmat = FLOWS.find((f) => f.id === "liczmat");
  check("the LiczMat flow still steps through it",
    liczmat.steps.some((s) => s.route === "project"));
}

head("2. the checks that stop a view from lying");
{
  const r = route("project");
  const parent = route("projects");
  eq("the view's level never exceeds its parent's", r.level, parent.level);
  eq("both are localized the same way", r.localized, parent.localized);
  check("its URL sits inside its parent's in every language",
    LANGS.every((l) => r.path(l, "x").startsWith(parent.path(l))));
  check("and always carries the id", LANGS.every((l) => r.path(l, "probe").includes("probe")));

  /**
   * Every check below is broken on purpose and then put back. A rule nobody has seen
   * fail is a rule nobody knows is wired up — the repo's habit since session 3 is to
   * check each one negatively rather than to write that it exists.
   */
  const breaks = (what, field, value, saying) => {
    const was = r[field];
    r[field] = value;
    const problems = validateIA().filter((x) => x.includes('"project"'));
    r[field] = was;
    check(`the build refuses ${what}`, problems.some((x) => x.includes(saying)),
      problems.length ? problems.join("\n      ") : "validateIA() said nothing about it");
  };

  breaks("a view with no parent to be a state of", "parent", null, "no parent page");
  breaks("a view indexed as though it had a URL to rank", "indexable", true, "no URL of its own to index");
  breaks("a view in the navigation, whose URL needs a key one visitor has",
    "footer", { order: 9, key: "nav_projects" }, "is in the navigation");
  breaks("a view that needs more than the page it is drawn into",
    "level", LEVEL.PRO, "gate part of itself");
  breaks("a view localized differently from the file it shares",
    "localized", false, "they are the same file");
  breaks("a view pointing outside its parent",
    "path", () => "/gdzie-indziej/?id=x", "the build writes no file for it");
  breaks("a view that drops the id from its address",
    "path", (lang) => urlProjects(lang), "drops its key");
  breaks("`view: true` on a route that is not built",
    "status", STATUS.PLANNED, "a view has no page of its own to plan");

  check("and is happy again once each is put back", validateIA().length === 0);
}

/* ------------------------------------------------------------------ 3. create */

head("3. create");
{
  const ws = loadWorkspace();
  eq("a browser that never made one has no projects", ws.wsProjects().length, 0);
  eq("and no active project", ws.wsActiveProjectId(), "");

  const a = ws.wsAddProject("Remont łazienki");
  eq("the project is there", ws.wsProjects().length, 1);
  eq("with the name that was typed", a.name, "Remont łazienki");
  eq("not archived", a.archived, false);
  eq("the first project becomes the active one", ws.wsActiveProjectId(), a.id);
  check("it carries the sync fields the rules require",
    Number.isInteger(a.createdAt) && Number.isInteger(a.updatedAt)
    && a.deletedAt === null && Number.isInteger(a.schemaVersion));

  // The security rules validate a project document by shape, not by a key whitelist, but
  // the phone rewrites the whole document from SyncContract.projectToDoc(), which knows
  // exactly these fields. A field invented here would be erased without a word.
  const fields = Object.keys(a).sort().join(",");
  eq("and nothing else — the document is the contract's",
    fields, "archived,createdAt,deletedAt,id,name,schemaVersion,updatedAt");

  ws.tick();
  const b = ws.wsAddProject("Garaż");
  eq("a second project is added, not merged", ws.wsProjects().length, 2);
  eq("the newest becomes active", ws.wsActiveProjectId(), b.id);
  check("the two have different ids", a.id !== b.id);
  eq("the newest change is listed first", ws.wsProjects()[0].id, b.id);

  const long = ws.wsAddProject("x".repeat(400));
  eq("a name longer than the rules accept is cut to 120", long.name.length, 120);

  eq("saving told the page to redraw", ws.events.filter((e) => e === "workspacechange").length > 0, true);
}

/* ------------------------------------------------------------------ 4. read */

head("4. read");
{
  const ws = loadWorkspace();
  const a = ws.wsAddProject("Remont łazienki");
  const b = ws.wsAddProject("Garaż");

  eq("a project can be looked up by id", ws.wsProject(a.id).name, "Remont łazienki");
  eq("an id nobody has reads as nothing", ws.wsProject("nope"), null);
  eq("so does an empty id", ws.wsProject(""), null);

  addLine(ws, "Płytki", 12, 749.85);
  addLine(ws, "Klej", 7, 245);
  const total = ws.wsProjectTotal(b.id);
  eq("the total counts the lines of that project", total.count, 2);
  eq("and adds them in minor units", total.minor, 99485);
  eq("in the currency they were saved with", total.currencyCode, "PLN");
  eq("one currency is not a mixed total", total.mixed, false);
  eq("the other project has none of them", ws.wsProjectTotal(a.id).count, 0);
}

/* ------------------------------------------------------------------ 5. update */

head("5. update — the name");
{
  const ws = loadWorkspace();
  const a = ws.wsAddProject("Remont łazienki");
  const before = ws.wsProject(a.id).updatedAt;

  ws.wsRenameProject(a.id, "Łazienka na górze");
  eq("the name changes", ws.wsProject(a.id).name, "Łazienka na górze");
  eq("the id does not", ws.wsProjects().length, 1);
  check("the change is stamped", ws.wsProject(a.id).updatedAt >= before);

  ws.wsRenameProject(a.id, "   Poddasze   ");
  eq("the surrounding spaces go", ws.wsProject(a.id).name, "Poddasze");

  // A project called "" is a row nobody can tell from another one, and the estimate
  // page's picker would show a blank option.
  eq("an empty name is refused", ws.wsRenameProject(a.id, "   "), null);
  eq("and the old name stands", ws.wsProject(a.id).name, "Poddasze");

  eq("renaming something that is not there does nothing", ws.wsUpdateProject("nope", { name: "x" }), null);

  ws.wsUpdateProject(a.id, {});
  eq("an update that passes nothing leaves the name alone", ws.wsProject(a.id).name, "Poddasze");
}

head("6. update — the archive");
{
  const ws = loadWorkspace();
  const a = ws.wsAddProject("Remont łazienki");
  const b = ws.wsAddProject("Garaż");
  eq("both are in the working set", ws.wsProjects().length, 2);
  eq("the archive is empty", ws.wsArchivedProjects().length, 0);
  eq("Garaż is the active one", ws.wsActiveProjectId(), b.id);

  ws.wsArchiveProject(b.id);
  eq("an archived project leaves the working set", ws.wsProjects().length, 1);
  eq("and joins the archive", ws.wsArchivedProjects().length, 1);
  eq("it is still readable by id", ws.wsProject(b.id).name, "Garaż");
  eq("it is not deleted", ws.wsProject(b.id).deletedAt, null);
  // The active project is the one every new line lands in, so it can never be one that
  // has just been put away.
  eq("the active project moves to the one still in use", ws.wsActiveProjectId(), a.id);

  addLine(ws, "Płytki", 12, 749.85);
  eq("a new line goes to the project that is still in use",
    ws.wsEstimations(a.id).length, 1);
  eq("not to the archived one", ws.wsEstimations(b.id).length, 0);

  ws.wsArchiveProject(b.id, false);
  eq("taking it out puts it back in the working set", ws.wsProjects().length, 2);
  eq("and out of the archive", ws.wsArchivedProjects().length, 0);
  eq("it does not steal the active flag back", ws.wsActiveProjectId(), a.id);

  eq("archived is a real boolean, as the rules require", ws.wsProject(b.id).archived, false);
  ws.wsUpdateProject(b.id, { archived: "yes" });
  eq("and stays one whatever was passed", ws.wsProject(b.id).archived, true);

  // Every project archived: there is nothing left to be active, and the next saved line
  // has to make itself a project rather than land in one that was put away.
  ws.wsArchiveProject(a.id);
  eq("with everything archived nothing is active", ws.wsActiveProjectId(), "");
  addLine(ws, "Fuga", 2, 40);
  eq("a saved line makes itself a new project", ws.wsProjects().length, 1);
  eq("and does not wake an archived one", ws.wsArchivedProjects().length, 2);
}

/* ------------------------------------------------------------------ 7. delete */

head("7. delete");
{
  const ws = loadWorkspace();
  const a = ws.wsAddProject("Remont łazienki");
  const b = ws.wsAddProject("Garaż");
  const room = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, b.id);
  addLine(ws, "Płytki", 12, 749.85);
  addLine(ws, "Klej", 7, 245);

  const token = ws.wsDeleteProject(b.id);
  check("the delete reports what it tombstoned",
    Number.isInteger(token.at) && token.id === b.id && token.lines.length === 2);
  eq("the project is gone from every list", ws.wsAllProjects().length, 1);
  eq("and cannot be read by id", ws.wsProject(b.id), null);
  eq("its lines went with it", ws.wsEstimations(b.id).length, 0);
  eq("the other project is untouched", ws.wsProject(a.id).name, "Remont łazienki");
  eq("the active flag moves to what is left", ws.wsActiveProjectId(), a.id);

  // FIRESTORE_SYNC §3: a delete is a tombstone, not a missing row, or a phone that
  // syncs later would put the project straight back.
  const raw = ws.raw();
  eq("the row is still in storage", raw.projects.length, 2);
  eq("marked deleted", raw.projects.find((x) => x.id === b.id).deletedAt, token.at);
  eq("with the same stamp on its lines",
    raw.estimations.filter((e) => e.deletedAt === token.at).length, 2);

  // A room is a physical place and outlives the project it was measured for. It used to
  // be unlinked here, which threw away the one fact an undo needs.
  eq("the room survives", ws.wsRooms().length, 1);
  eq("still pointing at the project", ws.raw().rooms[0].projectId, b.id);
  eq("and it is the room that was made", ws.wsRooms()[0].id, room.id);

  eq("deleting it twice does nothing the second time", ws.wsDeleteProject(b.id), null);
  eq("deleting something that is not there does nothing", ws.wsDeleteProject("nope"), null);
}

head("8. undo — the delete comes back");
{
  const ws = loadWorkspace();
  const a = ws.wsAddProject("Remont łazienki");
  addLine(ws, "Płytki", 12, 749.85);
  addLine(ws, "Klej", 7, 245);
  addLine(ws, "Fuga", 2, 40);

  // One line deleted by hand, earlier. The undo must not bring this one back: the
  // visitor asked for it to go, and asked separately.
  const byHand = ws.wsEstimations(a.id)[2];
  ws.wsDeleteEstimation(byHand.id);
  eq("the project has two lines left", ws.wsEstimations(a.id).length, 2);

  // Deliberately the same millisecond as the delete above: what comes back is decided by
  // the token, not by a timestamp two deletes can share.
  const token = ws.wsDeleteProject(a.id);
  eq("nothing is listed", ws.wsProjects().length, 0);
  eq("the token names the project", token.id, a.id);
  eq("and the two lines that went with it", token.lines.length, 2);
  eq("not the one already deleted by hand", token.lines.includes(byHand.id), false);

  const back = ws.wsRestoreProject(token);
  check("the restore reports the project", Boolean(back) && back.id === a.id);
  eq("the project is listed again", ws.wsProjects().length, 1);
  eq("with its name", ws.wsProject(a.id).name, "Remont łazienki");
  eq("the lines that went with it come back", ws.wsEstimations(a.id).length, 2);
  eq("the line deleted by hand stays deleted",
    ws.wsEstimations(a.id).some((e) => e.id === byHand.id), false);
  eq("the total is the one it had", ws.wsProjectTotal(a.id).minor, 99485);

  // A phone that already heard about the delete has to hear about the undo, so the
  // restore is a change like any other and not a rewind.
  check("the restore is stamped as a change", ws.wsProject(a.id).updatedAt > 0);
  eq("the tombstone is cleared, not left behind", ws.raw().projects[0].deletedAt, null);

  eq("restoring twice does nothing the second time", ws.wsRestoreProject(token), null);
  eq("restoring something that never was does nothing", ws.wsRestoreProject("nope"), null);
  eq("a token with no project does nothing", ws.wsRestoreProject(null), null);

  // A project with no lines is the whole of its own undo, so a bare id is enough.
  const ws3 = loadWorkspace();
  const empty = ws3.wsAddProject("Pusty");
  ws3.wsDeleteProject(empty.id);
  check("a bare id restores a project on its own", Boolean(ws3.wsRestoreProject(empty.id)));
  eq("and it is listed again", ws3.wsProjects().length, 1);

  // Two deletes in the same millisecond: the second undo may only reach its own lines.
  const ws2 = loadWorkspace();
  const x = ws2.wsAddProject("A");
  addLine(ws2, "Płytki", 1, 10);
  const y = ws2.wsAddProject("B");
  addLine(ws2, "Klej", 1, 20);
  const tokenX = ws2.wsDeleteProject(x.id);
  const tokenY = ws2.wsDeleteProject(y.id);
  eq("the two deletes happened at the same instant", tokenX.at, tokenY.at);
  ws2.wsRestoreProject(tokenY);
  eq("only the project that was undone is back", ws2.wsProjects().length, 1);
  eq("and it is the right one", ws2.wsProjects()[0].id, y.id);
  eq("with its own line", ws2.wsEstimations(y.id).length, 1);
  eq("the other stays deleted", ws2.wsEstimations(x.id).length, 0);
}

/* ------------------------------------------------------------------ 9. the page */

head("9. the frame the build writes");
{
  for (const lang of LANGS) {
    const t = tr(lang);
    const { main } = projectsMain(lang, t);

    // Both screens are in the file; the script shows one. A detail that only existed
    // after a fetch would be a screen the build could never check.
    check(`${lang}: the index is there`, main.includes('id="ws-index"'));
    check(`${lang}: the detail is there`, main.includes('id="ws-project"'));
    check(`${lang}: the detail starts hidden`, /id="ws-project" class="ws-project" hidden/.test(main));
    check(`${lang}: the archive is there`, main.includes('id="ws-archive"'));
    check(`${lang}: and starts hidden, because an empty one is a control with nothing behind it`,
      /id="ws-archive" class="ws-archive" hidden/.test(main));
    check(`${lang}: the undo strip is a live region`, /id="ws-undo"[^>]*role="status"/.test(main));

    // prompt() and confirm() are gone: both answers are forms on the page.
    check(`${lang}: renaming is a form`, main.includes('id="ws-rename-form"'));
    check(`${lang}: deleting asks on the page`, main.includes('id="ws-delete-ask"'));

    check(`${lang}: the back link goes to the index`,
      main.includes(`href="${urlProjects(lang)}" data-ws-back`));
    check(`${lang}: the estimate link is a real address`,
      main.includes(`href="${urlEstimate(lang)}" id="ws-project-estimate"`));

    // The title is swapped for the project's name, so it has to be findable.
    check(`${lang}: the heading can be retitled`, main.includes('id="ws-title"'));
    check(`${lang}: there is exactly one h1`, (main.match(/<h1/g) || []).length === 1);
  }

  const t = tr(DEFAULT_LANG);
  const { main } = projectsMain(DEFAULT_LANG, t);
  check("the index still offers the rooms of session 20", main.includes('id="ws-room-form"'));
  check("a name with a quote in it could not break out of an attribute",
    !projectsMain(DEFAULT_LANG, (k) => (k === "wspage_title" ? '"><script>' : t(k))).main.includes("><script>"));
}

head("10. the script the page runs");
{
  const src = readFileSync(p("assets/workspace-ui.js"), "utf8");
  // The comments below say what these two used to be, so they have to come out before
  // the file is searched for a call to them.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  // Both are the browser's own dialogs: unstyled, untranslatable once open, suppressed
  // outright by several browsers, and on a phone they cover the thing being renamed.
  // Session 15 replaced them with forms on the page.
  check("nothing calls prompt() any more", !/\bprompt\s*\(/.test(code));
  check("nothing calls confirm() any more", !/\bconfirm\s*\(/.test(code));
  check("the id is read from the query string", src.includes("URLSearchParams"));
  check("leaving the detail after a delete does not reload",
    src.includes("history.replaceState"));
  check("and Back is listened for, since the page never reloaded",
    src.includes('"popstate"'));
  check("the page says when it is wired, so a test does not click a dead button",
    src.includes("data-ws-ready"));

  const store = readFileSync(p("assets/workspace.js"), "utf8");
  check("the store knows nothing about the DOM", !/document\.getElementById/.test(store));
}

/* ------------------------------------------------------------------ 11. the copy */

head("11. the copy, in four languages");
{
  const KEYS = [
    "proj_back", "proj_none_t", "proj_none_d", "proj_count_l", "proj_created", "proj_updated",
    "proj_lines_t", "proj_lines_d", "proj_lines_empty", "proj_open_estimate",
    "proj_archive_do", "proj_archive_undo", "proj_archive_t", "proj_archive_d",
    "proj_delete_yes", "proj_deleted", "proj_restored", "proj_undo",
    // Reused rather than written again: the question, the state, the two verbs.
    "ws_confirm_delete", "ws_active", "ws_activate", "ws_rename", "ws_lines",
    "app_delete", "app_save", "app_add", "action_cancel", "share_total", "dash_mixed",
  ];
  for (const key of KEYS) {
    for (const lang of LANGS) {
      const value = (DICT[lang] || {})[key];
      check(`${lang}: "${key}" is translated`, typeof value === "string" && value.length > 0);
      check(`${lang}: "${key}" is not the key showing through`, value !== key);
    }
  }

  // Four languages, four different sentences: a key copied from Polish into the German
  // block is a translation nobody did, and t() cannot tell the difference.
  for (const key of ["proj_none_d", "proj_archive_d", "proj_lines_empty"]) {
    const values = new Set(LANGS.map((l) => DICT[l][key]));
    eq(`"${key}" says something different in each language`, values.size, LANGS.length);
  }

  // The strip reads "<sentence> <name>", so the sentence has to end where a name can
  // follow it rather than read as a heading.
  for (const lang of LANGS) {
    for (const key of ["proj_deleted", "proj_restored"]) {
      check(`${lang}: "${key}" is written to be followed by a name`, DICT[lang][key].endsWith(":"));
    }
  }
}

/* ------------------------------------------- 12. the navigation (fixes after session 20) */

head("12. the header carries five links, and one of them is only offered with an account");
{
  const inHeader = navRoutes("header");
  eq("five links in the header", inHeader.length, 5);
  eq("and they are in the architecture's order",
    inHeader.map((r) => r.id).join(","), "calculators,materials,projects,guides,android");

  // The owner asked for "Aplikacja" in the menu after session 20. Chapter X still forbids
  // pushing the app on the home page; a link last in the row is not that.
  const android = route("android");
  check("the app page is in the header", Boolean(android.header));
  eq("last, behind the four tools", android.header.order, 5);
  eq("with the label it already had in the footer", android.header.key, "nav_app_page");

  // A sixth link has never been measured, so the build still refuses it.
  const spare = ROUTES.find((r) => r.id === "stores");
  const was = spare.header;
  spare.header = { order: 6, key: "nav_stores" };
  check("a sixth link still aborts the build",
    validateIA().some((p) => /links in the header/.test(p)), validateIA().join("\n      "));
  spare.header = was;
  check("and the architecture is happy once it is put back", validateIA().length === 0);
}

head("13. /projekty/ hides its link without gating its page");
{
  const r = route("projects");
  // The two are deliberately different, and that difference is the whole change: `level`
  // is who may use the page, `navLevel` is who is offered the link.
  eq("a guest may still use the page", r.level, LEVEL.GUEST);
  eq("but the link is for an account", r.navLevel, LEVEL.LICZMAT);
  eq("and the page stays in the index", r.indexable, true);
  check("the build still writes its file", livePaths(CALCS, GUIDES).has("projekty/index.html"));

  // A link nobody could ever be shown is a mistake the build has to catch.
  const target = ROUTES.find((x) => x.id === "calculators");
  const was = target.navLevel;
  target.navLevel = "nonsense";
  check("an unknown navLevel aborts the build",
    validateIA().some((p) => /is not a level/.test(p)));
  target.navLevel = was;

  const guides = ROUTES.find((x) => x.id === "guide");
  guides.navLevel = LEVEL.LICZMAT;
  check("a navLevel on a route that is in no navigation aborts the build",
    validateIA().some((p) => /navLevel but is in no navigation/.test(p)));
  delete guides.navLevel;
  check("the architecture is happy once both are put back", validateIA().length === 0);

  // The markup: the item carries the level, so CSS can take the whole <li> out of the row
  // rather than leaving the gap an empty one would.
  const t = tr(DEFAULT_LANG);
  const header = siteHeader({ lang: DEFAULT_LANG, t, alternates: {}, path: urlProjects(DEFAULT_LANG) });
  check("the header item carries the level",
    header.includes('<li data-nav-level="liczmat">'), header.slice(0, 400));
  check("and only that one does",
    (header.match(/data-nav-level=/g) || []).length === 1);
  check("the app page is in the rendered header", header.includes(t("nav_app_page")));

  const footer = siteFooter({ lang: DEFAULT_LANG, t, alternates: {} });
  check("the footer item carries it too", footer.includes('<li data-nav-level="liczmat">'));

  // The rule that hides it must never fire without the level being known: no `data-lm-level`
  // is a guest *or* a browser with no script, and the second one is Googlebot.
  const css = readFileSync(p("assets/styles.css"), "utf8");
  check("the stylesheet only hides it once the level is known",
    css.includes('html.js:not([data-lm-level="liczmat"]):not([data-lm-level="pro"]) [data-nav-level="liczmat"]'));
  // A built page is the proof: the link is in the HTML for everybody, and it is the
  // stylesheet — not the build — that takes it away.
  const built = readFileSync(p("index.html"), "utf8");
  check("the home page ships the link in its markup",
    built.includes('<li data-nav-level="liczmat">'));
  check("and ships the app page beside it", built.includes(">Aplikacja</a>"));

  // The level has to be stamped **before the first paint**, or a signed-in visitor watches
  // the link appear. assets/account.js also stamps it, but that file is at the end of
  // <body> and is therefore too late — so this measures the position, not just the fact.
  const stamp = built.indexOf("setAttribute('data-lm-level'");
  check("the level is stamped by a script in the document", stamp > 0);
  check("read from the session hint",
    built.indexOf("liczmat-signed-in") > 0 && built.indexOf("liczmat-signed-in") < stamp);
  const headEnd = built.indexOf("</head>");
  check("and it happens inside the head, so the link never flickers",
    stamp > 0 && stamp < headEnd, `stamp at ${stamp}, head ends at ${headEnd}`);
  // The one script that runs before anything is drawn already reads localStorage for the
  // theme; putting the level there costs one more read and no second script.
  const themeAt = built.indexOf("liczmat-theme");
  check("in the same script the theme is applied in", themeAt > 0 && Math.abs(stamp - themeAt) < 800,
    `theme at ${themeAt}, level at ${stamp}`);
}

/* ------------------------------------------------------------------ report */

console.log(`\nprojects: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
