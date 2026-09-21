#!/usr/bin/env node
/** LiczMat — the one-time job-to-project migration, tested with the asset scripts. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const source = ["assets/workspace.js", "assets/crm-store.js"]
  .map((file) => readFileSync(p(file), "utf8")).join("\n");

function load(options = {}) {
  const backing = new Map();
  let ids = 0;
  const listeners = new Map();
  const localStorage = {
    getItem: (key) => backing.has(key) ? backing.get(key) : null,
    setItem: (key, value) => {
      if (options.refuseWorkspace && key === "materio-workspace-v1") throw new Error("quota");
      backing.set(key, String(value));
    },
    removeItem: (key) => backing.delete(key),
  };
  const document = {
    activeElement: null,
    addEventListener: (name, fn) => listeners.set(name, fn),
    dispatchEvent: (event) => { const fn = listeners.get(event.type); if (fn) fn(event); },
  };
  const names = ["wsAddProject", "wsUpdateProject", "wsProject", "wsProjects", "wsMergeJobs", "crmLoad"];
  const api = new Function("localStorage", "document", "crypto", "CustomEvent", `${source}\nreturn {${names.join(",")}};`)(
    localStorage,
    document,
    { randomUUID: () => `new-${++ids}` },
    class { constructor(type) { this.type = type; } },
  );
  return {
    ...api,
    on: (name, fn) => listeners.set(name, fn),
    put: (key, value) => backing.set(key, JSON.stringify(value)),
    raw: (key) => JSON.parse(backing.get(key) || "null"),
  };
}

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };
function check(name, condition, detail) {
  if (condition) { passed++; return true; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
  return false;
}
const eq = (name, actual, expected) => check(name, actual === expected, `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);

const job = (over = {}) => ({
  id: "job-1", name: "Łazienka", projectId: "project-1", description: "Opis",
  note: "Notatka", clientId: "client-1", status: "active", dueDate: "2026-10-01",
  valueMinor: 12345, currencyCode: "PLN", createdAt: 10, updatedAt: 20, deletedAt: null,
  ...over,
});

head("project shape");
{
  const ws = load();
  const row = ws.wsAddProject("A");
  eq("client default", row.clientId, ""); eq("status default", row.status, "new");
  eq("day default", row.dueDate, ""); eq("value default", row.valueMinor, null);
  eq("currency default", row.currencyCode, ""); eq("note default", row.note, "");
  ws.put("materio-workspace-v1", { projects: [{ id: "old", name: "Old", archived: false, updatedAt: 1 }], rooms: [], estimations: [] });
  eq("old shape gets defaults", JSON.stringify(ws.wsProject("old")).includes('"status":"new"'), true);
}

head("merge rules");
{
  const ws = load();
  ws.put("materio-workspace-v1", { projects: [{ id: "project-1", name: "P", archived: false, note: "Stara", createdAt: 1, updatedAt: 99 }], rooms: [], estimations: [], shoppingItems: [] });
  ws.wsMergeJobs(job());
  const row = ws.wsProject("project-1");
  eq("job fields merge", row.clientId, "client-1");
  eq("notes fold", row.note, "Stara\n\nOpis\n\nNotatka");
  eq("updatedAt is max", row.updatedAt, 99);
}
{
  const ws = load();
  ws.wsMergeJobs([job({ id: "old", updatedAt: 20, name: "Old", note: "" }), job({ id: "new", updatedAt: 30, name: "New", clientId: "winner", note: "" })]);
  const row = ws.wsProject("project-1");
  eq("larger stamp wins", row.clientId, "winner");
  check("loser is recorded", row.note.includes("Z poprzedniego zlecenia: Old; active; 2026-10-01; 12345 PLN"));
}
{
  const ws = load();
  ws.wsMergeJobs(job({ projectId: "missing" }));
  eq("absent named project keeps id", ws.wsProject("missing").id, "missing");
  ws.wsMergeJobs(job({ projectId: "", id: "free" }));
  check("unlinked job keeps its own id", ws.wsProjects().some((p) => p.id === "free"));
  ws.wsMergeJobs(job({ projectId: "", id: "free" }));
  eq("same unlinked job converts once", ws.wsProjects().filter((p) => p.id === "free").length, 1);
  const before = ws.wsProjects().length;
  ws.wsMergeJobs(job({ id: "dead", projectId: "dead-project", deletedAt: 5 }));
  eq("tombstone is skipped", ws.wsProjects().length, before);
}
{
  const ws = load();
  ws.put("materio-workspace-v1", { projects: [{ id: "gone", name: "Gone", deletedAt: 50, updatedAt: 50 }], rooms: [], estimations: [], shoppingItems: [] });
  ws.wsMergeJobs(job({ projectId: "gone", updatedAt: 60 }));
  const rows = ws.raw("materio-workspace-v1").projects.filter((p) => p.id === "gone");
  eq("named project tombstone stays unique", rows.length, 1);
  eq("named project tombstone stays deleted", rows[0].deletedAt, 50);
}

head("local migration");
{
  const ws = load();
  ws.put("liczmat-crm-v1", { clients: [], jobs: [job()], quotes: [] });
  ws.crmLoad();
  const once = JSON.stringify(ws.raw("materio-workspace-v1"));
  eq("jobs are cleared after conversion", ws.raw("liczmat-crm-v1").jobs.length, 0);
  ws.crmLoad();
  eq("second run changes nothing", JSON.stringify(ws.raw("materio-workspace-v1")), once);
}
{
  const ws = load();
  ws.put("liczmat-crm-v1", { clients: [], jobs: [job({ projectId: "", id: "recursive" })], quotes: [] });
  let reentries = 0;
  ws.on("workspacechange", () => { reentries++; ws.crmLoad(); });
  ws.crmLoad();
  eq("workspace event re-enters once", reentries, 1);
  eq("re-entry does not duplicate project", ws.raw("materio-workspace-v1").projects.filter((p) => p.id === "recursive").length, 1);
}
{
  const options = { refuseWorkspace: true };
  const ws = load(options);
  ws.put("liczmat-crm-v1", { clients: [], jobs: [job({ projectId: "retry" })], quotes: [] });
  ws.crmLoad();
  eq("refused conversion keeps legacy job", ws.raw("liczmat-crm-v1").jobs.length, 1);
  options.refuseWorkspace = false;
  ws.crmLoad();
  eq("refused conversion is retried", ws.wsProject("retry").id, "retry");
}

head("note limit");
{
  const ws = load();
  ws.put("materio-workspace-v1", { projects: [{ id: "project-1", name: "P", archived: false, note: "x".repeat(1999), updatedAt: 1 }], rooms: [], estimations: [], shoppingItems: [] });
  ws.wsMergeJobs(job({ description: "more", note: "more" }));
  eq("folded note is capped", ws.wsProject("project-1").note.length, 2000);
}

console.log(`\njob merge: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  failures.forEach((failure) => console.log(`  ✗ ${failure}`));
  process.exit(1);
}
