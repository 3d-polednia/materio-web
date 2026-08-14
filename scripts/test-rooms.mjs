#!/usr/bin/env node
/**
 * LiczMat — rooms, tested.
 *
 *     node scripts/test-rooms.mjs
 *
 * Master plan, session 20: "Pomieszczenia jako element projektu", and chapter XVIII
 * under it:
 *
 *     Pomieszczenia są elementem projektu.
 *     Projekt:        Remont łazienki
 *     Pomieszczenie:  Łazienka
 *     Wymiary:        2,4 × 3,2 × 2,5 m
 *     Kalkulacje mogą być przypisane do konkretnego pomieszczenia.
 *     Nie promuj pomieszczeń jako osobnego wielkiego modułu na homepage.
 *
 * This file is the half that needs no browser:
 *
 *   1. the document — a room against the contract it comes from, and the one field this
 *      repo keeps beside it (`projectId`), which is the whole of chapter XVIII's first
 *      sentence and is the *only* extra field there is;
 *   2. the four writes — add, read by project, correct, take off — and the clamps the
 *      deployed rules impose on the three dimensions;
 *   3. what a project's delete does to its rooms, which is nothing, and why;
 *   4. the assignment — a calculation filed under a room, moved, and taken out again, with
 *      the room id inside `inputJson` where session 16 put the snapshot;
 *   5. the arithmetic — floor, walls, ceiling, perimeter and volume, and what a room
 *      writes into each calculator;
 *   6. the frame the build writes, and the copy in four languages.
 *
 * The other half — clicking it through in Chromium — is scripts/test-rooms-page.mjs.
 *
 * The document being asserted is not this repository's invention. Read in
 * `3d-polednia/Materio` rather than remembered:
 *
 *   - `docs/FIRESTORE_SYNC.md` §2 puts rooms at `users/{uid}/rooms/{roomId}` — beside
 *     projects, not inside one — and names four fields: `name`, `lengthM`, `widthM`,
 *     `heightM`;
 *   - `RoomEntity` has no `projectId` column and `SyncContract.roomToDoc()` writes no such
 *     key, so the phone cannot show the link;
 *   - `CloudSync.pushLocal()` writes rooms with `SetOptions.merge()`, the deployed
 *     `validRoom()` validates by shape with no `hasOnly`, and `roomFromDoc()` reads by key
 *     — which is why the link survives the round trip anyway;
 *   - `ProjectRepository.recordTombstones()` cascades estimations and shopping items and
 *     never rooms, which is why deleting a project here must not either.
 *
 * Same shape as the other logic suites: no dependencies, plain `node`, exit 1 on a failure.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { projectsMain } from "../src/pages.mjs";
import { LANGS, DEFAULT_LANG } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

function evalScript(file, returns, globals = {}) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

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

const { MAT_CATS } = evalScript("assets/materials.js", ["MAT_CATS"], { module: undefined });

/** assets/workspace.js in Node, on a store that starts out however the test wants it. */
function loadWorkspace(seed) {
  const backing = new Map(Object.entries(seed || {}));
  const clock = { now: 1_760_000_000_000, currency: "PLN" };
  let ids = 0;
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const api = evalScript("assets/workspace.js", [
    "wsLoad", "wsProjects", "wsProject", "wsAddProject", "wsDeleteProject",
    "wsRestoreProject", "wsActiveProjectId", "wsSetActiveProject",
    "wsRooms", "wsRoom", "wsAddRoom", "wsUpdateRoom", "wsDeleteRoom",
    "wsRoomAreas", "wsRoomFill",
    "wsEstimations", "wsAddEstimation", "wsAddManualEstimation", "wsDeleteEstimation",
    "wsLineRoomId", "wsSetLineRoom", "wsLineSnapshot", "wsIsManualLine",
    "wsItems", "wsExport", "wsImport", "WS_INPUT_MAX",
  ], {
    localStorage,
    document: { dispatchEvent: () => {} },
    crypto: { randomUUID: () => `id-${++ids}` },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Date: { now: () => clock.now },
    lmCurrency: () => clock.currency,
    lmMoneyMinor: (minor, code) => `${(minor / 100).toFixed(2)} ${code}`,
  });
  return {
    ...api,
    raw: () => JSON.parse(backing.get("materio-workspace-v1") || "{}"),
    /** Put a whole workspace back — for the states nobody could type but a sync can send. */
    write: (data) => backing.set("materio-workspace-v1", JSON.stringify(data)),
    tick: (ms) => { clock.now += ms || 1000; },
  };
}

/** One save, exactly as assets/workspace-ui.js performs it after a calculation. */
const save = (ws, over = {}) => ws.wsAddEstimation({
  calcId: "waste",
  name: "Gres 60×60",
  materialCategory: "TILES",
  requiredUnits: 15,
  unitLabel: "opak.",
  costMajor: 749.85,
  wastePercent: 7,
  input: { area: "21.6" },
  snapshot: { v: 1, calc: "waste", at: 1_760_000_000_000, fields: [{ k: "area", l: "fld_area" }], rows: [["res_area", "|n:21.6| m²"]], unit: "res_pkgs", tobuy: 15 },
  projectName: "Mój projekt",
  ...over,
});

/** Chapter XVIII's own room: Łazienka, 2,4 × 3,2 × 2,5 m. */
const CHAPTER_ROOM = { name: "Łazienka", L: 2.4, W: 3.2, H: 2.5 };

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
/** Money-free arithmetic still has floats in it; compare to the millimetre. */
const near = (name, got, want) =>
  check(name, Math.abs(got - want) < 1e-9, `expected ${want}, got ${got}`);

/* ================================================================== 1. the document */

head("1. a room is the contract's document plus exactly one field");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Remont łazienki");
  const room = ws.wsAddRoom(CHAPTER_ROOM.name, CHAPTER_ROOM.L, CHAPTER_ROOM.W, CHAPTER_ROOM.H, project.id);

  // FIRESTORE_SYNC §2, `rooms/{roomId}` ← RoomEntity: four fields plus the sync block.
  for (const key of ["name", "lengthM", "widthM", "heightM"]) {
    check(`the contract's ${key} is written`, Object.prototype.hasOwnProperty.call(room, key));
  }
  for (const key of ["createdAt", "updatedAt", "deletedAt", "schemaVersion"]) {
    check(`the sync field ${key} is written`, Object.prototype.hasOwnProperty.call(room, key));
  }
  eq("the room starts alive", room.deletedAt, null);

  // Chapter XVIII's first sentence, and the only field this repo keeps beside the
  // contract. `RoomEntity` has no column for it and `roomToDoc()` never writes it; it
  // survives because every write on both sides is a merge (see the header).
  eq("the room belongs to the project", room.projectId, project.id);

  // The same guard the material list has for `note`: one extra field, and one only. A
  // second invented key is a field the phone cannot show and nobody agreed to carry.
  const CONTRACT = ["name", "lengthM", "widthM", "heightM",
    "createdAt", "updatedAt", "deletedAt", "schemaVersion"];
  const extra = Object.keys(room).filter((k) => k !== "id" && !CONTRACT.includes(k));
  eq("exactly one field sits beside the contract", extra.join(","), "projectId");

  // Chapter XVIII's example, read back as the chapter writes it.
  eq("the name is the chapter's", room.name, "Łazienka");
  near("length", room.lengthM, 2.4);
  near("width", room.widthM, 3.2);
  near("height", room.heightM, 2.5);
}

head("1b. the dimensions are clamped to what the deployed rules accept");
{
  const ws = loadWorkspace();
  // validRoom(): nonNegative and lengthM/widthM ≤ 1000, heightM ≤ 100. A write outside
  // those is refused by the server, so it is never made.
  const big = ws.wsAddRoom("Hala", 5000, 5000, 500);
  eq("length is capped at 1000", big.lengthM, 1000);
  eq("width is capped at 1000", big.widthM, 1000);
  eq("height is capped at 100", big.heightM, 100);

  const negative = ws.wsAddRoom("Piwnica", -4, -3, -2.5);
  eq("a negative length becomes zero", negative.lengthM, 0);
  eq("a negative width becomes zero", negative.widthM, 0);
  eq("a negative height becomes zero", negative.heightM, 0);

  const words = ws.wsAddRoom("Strych", "abc", "", null);
  eq("a dimension that is not a number becomes zero", words.lengthM, 0);

  const long = ws.wsAddRoom("ł".repeat(400), 3, 3, 2.5);
  eq("the name is cut to the contract's 120 characters", long.name.length, 120);

  eq("a room with no name is refused", ws.wsAddRoom("   ", 3, 3, 2.5), null);
  eq("and nothing was written for it", ws.wsRooms().length, 4);
}

/* ================================================================== 2. the four writes */

head("2. add, read by project, correct, take off");
{
  const ws = loadWorkspace();
  const bath = ws.wsAddProject("Remont łazienki");
  ws.tick();
  const kitchen = ws.wsAddProject("Kuchnia");
  ws.tick();

  const r1 = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, bath.id);
  ws.tick();
  const r2 = ws.wsAddRoom("Przedpokój", 1.4, 4, 2.5, bath.id);
  ws.tick();
  const r3 = ws.wsAddRoom("Kuchnia", 3, 4, 2.6, kitchen.id);
  ws.tick();
  const loose = ws.wsAddRoom("Garaż", 6, 3, 2.4, null);

  eq("every room is in the flat list", ws.wsRooms().length, 4);
  eq("the project's rooms are the project's", ws.wsRooms(bath.id).length, 2);
  eq("and the other project's are the other project's", ws.wsRooms(kitchen.id).length, 1);
  eq("a room with no project is in neither", ws.wsRooms(bath.id).some((r) => r.id === loose.id), false);
  eq("the flat list is newest first", ws.wsRooms()[0].id, loose.id);

  eq("one room by id", (ws.wsRoom(r1.id) || {}).name, "Łazienka");
  eq("an id nobody has answers null", ws.wsRoom("nope"), null);

  // U — the correction. Chapter XVIII's room is a name and three dimensions, so all four
  // change, and the project it belongs to changes with them.
  ws.tick();
  const fixed = ws.wsUpdateRoom(r2.id, { name: "Korytarz", lengthM: 1.5, widthM: 4.2, heightM: 2.55 });
  eq("the name changed", fixed.name, "Korytarz");
  near("the length changed", fixed.lengthM, 1.5);
  near("the width changed", fixed.widthM, 4.2);
  near("the height changed", fixed.heightM, 2.55);
  check("the change moved updatedAt", fixed.updatedAt > r2.updatedAt);
  eq("the correction is in storage", ws.wsRoom(r2.id).name, "Korytarz");

  eq("an empty name is refused", ws.wsUpdateRoom(r2.id, { name: "  " }), null);
  eq("and the old name stands", ws.wsRoom(r2.id).name, "Korytarz");
  eq("a room that does not exist is refused", ws.wsUpdateRoom("nope", { name: "x" }), null);
  eq("the correction clamps like the write does",
    ws.wsUpdateRoom(r2.id, { heightM: 900 }).heightM, 100);

  ws.wsUpdateRoom(r3.id, { projectId: bath.id });
  eq("a room can be moved to another project", ws.wsRooms(bath.id).length, 3);
  eq("and leaves the one it came from", ws.wsRooms(kitchen.id).length, 0);
  ws.wsUpdateRoom(r3.id, { projectId: "" });
  eq("and can be taken out of every project", ws.wsRoom(r3.id).projectId, null);

  // D — the delete is a tombstone, exactly like every other row here (FIRESTORE_SYNC §3).
  const gone = ws.wsDeleteRoom(r1.id);
  check("the delete answers with the row", Boolean(gone) && gone.id === r1.id);
  eq("the room is off the list", ws.wsRooms().some((r) => r.id === r1.id), false);
  eq("and off the project's list", ws.wsRooms(bath.id).some((r) => r.id === r1.id), false);
  const stone = ws.raw().rooms.find((r) => r.id === r1.id);
  check("but the row is still in storage", Boolean(stone));
  check("carrying a deletedAt", Boolean(stone.deletedAt));
  eq("and its updatedAt moved with it", stone.updatedAt, stone.deletedAt);
  eq("deleting it twice is refused", ws.wsDeleteRoom(r1.id), null);
}

/* ================================================================== 3. the project's delete */

head("3. deleting a project leaves its rooms alone — the phone does the same");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Remont łazienki");
  const room = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, project.id);
  ws.tick();
  const line = save(ws, { projectId: project.id });

  const token = ws.wsDeleteProject(project.id);
  eq("the estimate line went with the project", ws.wsEstimations(project.id).length, 0);
  eq("its material went too", ws.wsItems(project.id).length, 0);
  // `ProjectRepository.recordTombstones()` walks estimations and shopping items and stops.
  // Rooms are not a subcollection of a project at all, so cascading here would mean one
  // click doing two different things on two devices.
  eq("the room did not", ws.wsRooms().length, 1);
  eq("and still names the project it was measured for", ws.wsRoom(room.id).projectId, project.id);
  // The link is kept rather than cleared, which is what makes the undo exact: the project
  // that comes back comes back with the rooms it had. Nothing renders a deleted project's
  // rooms, because nothing renders a deleted project.
  eq("the project it names is gone", ws.wsProject(project.id), null);

  ws.wsRestoreProject(token);
  eq("the undo brings the project back", Boolean(ws.wsProject(project.id)), true);
  eq("with its room still attached", ws.wsRooms(project.id).length, 1);
  eq("and its line", ws.wsEstimations(project.id).length, 1);
  eq("the line is the one that went", ws.wsEstimations(project.id)[0].id, line.id);
}

/* ================================================================== 4. the assignment */

head("4. a calculation is filed under a room, inside inputJson");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Remont łazienki");
  const bath = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, project.id);
  const hall = ws.wsAddRoom("Przedpokój", 1.4, 4, 2.5, project.id);

  const line = save(ws, { projectId: project.id, roomId: bath.id });
  eq("the saved line names the room", ws.wsLineRoomId(line), bath.id);

  const json = JSON.parse(line.inputJson);
  eq("the room id is a top-level key of inputJson", json._room, bath.id);
  // It sits beside `manual` rather than inside `_lm`, so a line with no snapshot can carry
  // one too — and the snapshot session 16 put there is untouched.
  check("the snapshot is still there", Boolean(json._lm));
  eq("and still reads", (ws.wsLineSnapshot(line) || {}).calc, "waste");
  eq("what the visitor typed is still there", json.area, "21.6");
  eq("the field list is unharmed", (ws.wsLineSnapshot(line) || { fields: [] }).fields.length, 1);

  // The document itself gains nothing: `EstimationEntity` has a projectId and no roomId,
  // and a top-level field would be a second mechanism for a job inputJson already does.
  eq("no roomId is invented on the document", line.roomId, undefined);

  const bare = save(ws, { projectId: project.id });
  eq("a line saved without a room has none", ws.wsLineRoomId(bare), "");
  eq("and its inputJson has no _room key",
    Object.prototype.hasOwnProperty.call(JSON.parse(bare.inputJson), "_room"), false);

  // Moving it, and taking it out again.
  ws.tick();
  const moved = ws.wsSetLineRoom(line.id, hall.id);
  eq("the line moved to the other room", ws.wsLineRoomId(moved), hall.id);
  eq("and the store agrees", ws.wsLineRoomId(ws.wsEstimations(project.id).find((r) => r.id === line.id)), hall.id);
  check("moving it moved updatedAt", moved.updatedAt > line.updatedAt);
  eq("what the visitor typed survived the move", JSON.parse(moved.inputJson).area, "21.6");
  eq("so did the snapshot", (ws.wsLineSnapshot(moved) || {}).calc, "waste");

  const cleared = ws.wsSetLineRoom(line.id, "");
  eq("the line can be taken out of every room", ws.wsLineRoomId(cleared), "");
  eq("and the key is gone rather than empty",
    Object.prototype.hasOwnProperty.call(JSON.parse(cleared.inputJson), "_room"), false);
  eq("the snapshot is still intact", (ws.wsLineSnapshot(cleared) || {}).calc, "waste");

  eq("a line that does not exist is refused", ws.wsSetLineRoom("nope", bath.id), null);
}

head("4b. a room the project does not own is dropped, not filed");
{
  const ws = loadWorkspace();
  const bath = ws.wsAddProject("Remont łazienki");
  const kitchen = ws.wsAddProject("Kuchnia");
  const other = ws.wsAddRoom("Kuchnia", 3, 4, 2.6, kitchen.id);
  const loose = ws.wsAddRoom("Garaż", 6, 3, 2.4, null);

  const line = save(ws, { projectId: bath.id, roomId: other.id });
  eq("another project's room is not filed", ws.wsLineRoomId(line), "");
  const two = save(ws, { projectId: bath.id, roomId: loose.id });
  eq("a room with no project is not filed either", ws.wsLineRoomId(two), "");
  const three = save(ws, { projectId: bath.id, roomId: "nope" });
  eq("an id nobody has is not filed", ws.wsLineRoomId(three), "");

  const own = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, bath.id);
  const four = save(ws, { projectId: bath.id, roomId: own.id });
  eq("the project's own room is", ws.wsLineRoomId(four), own.id);
}

head("4c. a room id that is not one is not read back as one");
{
  const ws = loadWorkspace();
  const bad = [
    { inputJson: "{" },
    { inputJson: '{"_room":42}' },
    { inputJson: '{"_room":""}' },
    { inputJson: '{"_room":{"id":"x"}}' },
    { inputJson: "" },
    {},
    null,
  ];
  for (const row of bad) {
    eq(`a bad _room reads as none (${JSON.stringify(row)})`, ws.wsLineRoomId(row), "");
  }

  // A line whose inputJson is not this site's does not get rewritten under it.
  const project = ws.wsAddProject("Remont");
  const room = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, project.id);
  const line = save(ws, { projectId: project.id });
  const data = ws.raw();
  data.estimations.find((e) => e.id === line.id).inputJson = "not json at all";
  ws.write(data);
  eq("an unparseable inputJson is left alone", ws.wsSetLineRoom(line.id, room.id), null);
  eq("and reads as no room", ws.wsLineRoomId(ws.wsEstimations(project.id)[0]), "");
}

head("4d. a hand-typed cost can belong to a room too");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Remont łazienki");
  const room = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, project.id);
  const line = ws.wsAddManualEstimation({
    projectId: project.id, name: "Robocizna", requiredUnits: 1, unitLabel: "", costMajor: 800,
  });
  check("it is still a hand-typed line", ws.wsIsManualLine(line));
  const filed = ws.wsSetLineRoom(line.id, room.id);
  eq("and it took the room", ws.wsLineRoomId(filed), room.id);
  // The marker session 19 reads for "inne koszty" is beside the room id, not replaced by it.
  check("and is still a hand-typed line afterwards", ws.wsIsManualLine(filed));
}

head("4e. the contract's 20 000-character ceiling still holds");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Rozkrój");
  const room = ws.wsAddRoom("Warsztat", 6, 4, 3, project.id);
  // The two cutting calculators take a free-text list, which is the only input that can
  // approach the limit. A line already at it keeps the room it had rather than being
  // written back as a string nothing can parse.
  const line = save(ws, {
    projectId: project.id,
    input: { pieces: "x".repeat(ws.WS_INPUT_MAX - 20) },
    snapshot: null,
  });
  check("the oversized line still parses", (() => {
    try { JSON.parse(line.inputJson); return true; } catch (e) { return false; }
  })());
  eq("assigning a room to it is refused rather than truncated",
    ws.wsSetLineRoom(line.id, room.id), null);
  check("and it still parses afterwards", (() => {
    try { JSON.parse(ws.wsEstimations(project.id)[0].inputJson); return true; } catch (e) { return false; }
  })());
}

/* ================================================================== 5. the arithmetic */

head("5. floor, walls, ceiling, perimeter and volume");
{
  const ws = loadWorkspace();
  const { L, W, H } = CHAPTER_ROOM;
  const a = ws.wsRoomAreas({ lengthM: L, widthM: W, heightM: H });
  near("floor is length × width", a.floor, 2.4 * 3.2);
  near("ceiling is the same", a.ceiling, 2.4 * 3.2);
  near("walls are the perimeter × the height", a.walls, 2 * (2.4 + 3.2) * 2.5);
  near("the perimeter is twice the two sides", a.perimeter, 2 * (2.4 + 3.2));
  near("volume is the three multiplied", a.volume, 2.4 * 3.2 * 2.5);
  // The walls are gross: a room knows its dimensions, never its doors and windows.
  near("nothing is deducted for openings", a.walls, 28);

  const empty = ws.wsRoomAreas({});
  eq("a room with no dimensions is all zeroes", `${empty.floor}|${empty.walls}|${empty.volume}`, "0|0|0");
}

head("5b. what a room writes into a calculator");
{
  const ws = loadWorkspace();
  const room = { lengthM: 2.4, widthM: 3.2, heightM: 2.5 };
  const a = ws.wsRoomAreas(room);

  near("a tiling calculator gets the floor", ws.wsRoomFill(room, "waste", "floor").area, a.floor);
  near("and the walls when the walls are chosen", ws.wsRoomFill(room, "waste", "walls").area, a.walls);
  near("the ceiling is the floor by definition", ws.wsRoomFill(room, "waste", "ceiling").area, a.floor);

  const paper = ws.wsRoomFill(room, "wallpaper", "walls");
  near("wallpaper gets the perimeter as one wall's width", paper.wallW, a.perimeter);
  near("and the room's height", paper.wallH, 2.5);

  const stud = ws.wsRoomFill(room, "studwall", "walls");
  near("a stud wall gets the length", stud.width, 2.4);
  near("and the height", stud.height, 2.5);

  const ceiling = ws.wsRoomFill(room, "ceiling", "ceiling");
  near("a suspended ceiling gets both sides", ceiling.width, 3.2);
  near("and the other one", ceiling.length, 2.4);

  // A cutting list is a list of pieces, not an area, so a room has nothing to say to it.
  eq("a cutting calculator gets nothing", Object.keys(ws.wsRoomFill(room, "linear", "floor")).length, 0);
  eq("neither does the sheet one", Object.keys(ws.wsRoomFill(room, "sheet", "floor")).length, 0);
  eq("nor concrete, which needs a thickness nobody measured",
    Object.keys(ws.wsRoomFill(room, "concrete", "floor")).length, 0);
}

/* ================================================================== 6. the round trip */

head("6. the link survives an export and an import");
{
  const ws = loadWorkspace();
  const project = ws.wsAddProject("Remont łazienki");
  const room = ws.wsAddRoom("Łazienka", 2.4, 3.2, 2.5, project.id);
  const line = save(ws, { projectId: project.id, roomId: room.id });

  const dump = ws.wsExport();
  const roomOut = dump.rooms.find((r) => r.id === room.id);
  eq("the export carries the project the room belongs to", roomOut.projectId, project.id);

  const fresh = loadWorkspace();
  fresh.wsImport(dump);
  eq("the import brings the project", Boolean(fresh.wsProject(project.id)), true);
  eq("and the room under it", fresh.wsRooms(project.id).length, 1);
  eq("and the line's room", fresh.wsLineRoomId(fresh.wsEstimations(project.id)[0]), room.id);

  // A room written by the phone has no projectId at all — roomToDoc() has no such key —
  // so it comes down unassigned rather than mangled.
  const phone = loadWorkspace();
  phone.wsImport({
    rooms: [{
      id: "from-phone", name: "Sypialnia", lengthM: 4, widthM: 3.5, heightM: 2.6,
      createdAt: 1, updatedAt: 2, deletedAt: null, schemaVersion: 1,
    }],
  });
  eq("a room from the phone arrives", phone.wsRooms().length, 1);
  eq("with no project, which is the truth about it", phone.wsRooms()[0].projectId, undefined);
  eq("and is in no project's list", phone.wsRooms("anything").length, 0);
}

/* ================================================================== 7. the frame */

head("7. the frame the build writes");
{
  const t = tr(DEFAULT_LANG);
  const built = projectsMain(DEFAULT_LANG, t, MAT_CATS || []).main;

  for (const id of ["ws-project-rooms", "ws-room-add", "ws-proj-room-form",
    "ws-proj-room-name", "ws-proj-room-length", "ws-proj-room-width", "ws-proj-room-height"]) {
    check(`the project screen has #${id}`, built.includes(`id="${id}"`), id);
  }
  check("the running figures have somewhere to go", built.includes("data-room-sum"));
  check("the section is headed with the rooms", built.includes(`<h2>${t("ws_rooms")}</h2>`));
  check("and says what it is for", built.includes(t("proj_room_d")));
  check("the add form says what the phone does with the link", built.includes(t("proj_room_phone")));

  // Chapter XIV lists a project's parts in an order — name, description, rooms,
  // calculations, materials, costs — and chapter XVIII's example reads project → room →
  // dimensions. The rooms therefore stand above the calculations, not under them.
  check("the rooms come before the calculations",
    built.indexOf('id="ws-project-rooms"') < built.indexOf('id="ws-project-lines"'));
  check("and before the materials",
    built.indexOf('id="ws-project-rooms"') < built.indexOf('id="ws-project-materials"'));

  // The index keeps its own rooms form: a room is a place, and a visitor with no project
  // still has to be able to measure one.
  check("the index still has its rooms form", built.includes('id="ws-room-form"'));
  check("and its list", built.includes('id="ws-room-list"'));

  // Chapter XVIII's last sentence: rooms are not a module to promote. The project screen
  // is where they live, and nothing about the frame turns them into a section of their own.
  check("no raw key leaks into the frame",
    !/\b(proj_room_[a-z]+|ws_room_no)\b/.test(built));

  for (const lang of LANGS) {
    const page = projectsMain(lang, tr(lang), MAT_CATS || []).main;
    check(`${lang}: the rooms section is in that language`, page.includes(tr(lang)("proj_room_add")));
    check(`${lang}: and so are the three dimension labels`,
      page.includes(tr(lang)("fld_length")) && page.includes(tr(lang)("fld_width"))
      && page.includes(tr(lang)("fld_height")));
    check(`${lang}: nothing shows a raw key`, !/\bproj_room_[a-z]+\b/.test(page));
  }
}

/* ================================================================== 8. the copy */

head("8. the copy exists in all four languages");
{
  const KEYS = [
    "proj_room_d", "proj_room_empty", "proj_room_add", "proj_room_volume",
    "proj_room_phone", "ws_room", "ws_room_no",
    // The keys session 20 leans on that were already here.
    "ws_rooms", "ws_new_room", "ws_empty_rooms", "room_floor", "room_walls",
    "ws_surface_walls", "fld_length", "fld_width", "fld_height",
  ];
  for (const lang of LANGS) {
    for (const key of KEYS) {
      check(`${lang}: ${key} is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
  }
  for (const key of ["proj_room_add", "proj_room_empty", "ws_room", "ws_room_no", "proj_room_volume"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }
  // "Pomieszczenie" and "— bez pomieszczenia —" appear next to each other in the picker;
  // two labels that read the same would make the empty option look like a room.
  for (const lang of LANGS) {
    check(`${lang}: the room label and the empty option differ`,
      DICT[lang].ws_room !== DICT[lang].ws_room_no);
  }
  // The phone note is the honest half of chapter XVIII and must not be a slogan: it says
  // what is carried and what is not.
  for (const lang of LANGS) {
    check(`${lang}: the phone note is a full sentence`, DICT[lang].proj_room_phone.length > 60);
  }
}

/* ------------------------------------------------------------------ report */

console.log(`\nrooms: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
