/*
 * downloadAccount() reads the whole account at sign-in (assets/account-sync.js).
 *
 * Until 2026-10-12 it waited for every Firestore read before starting the next one:
 * projects, rooms, six Pro collections, then two reads per project. At about 120 ms a
 * round trip the test account (9 projects, 26 reads) waited 3.1 s, and an account with
 * fifty projects waits well over ten, with an empty page in a fresh browser the whole
 * time. The owner took that for his data being gone (2026-10-12).
 *
 * This runs the real module against a fake SDK whose every read takes DELAY ms and checks
 * three things: the reads overlap, what comes back is what the sequential version
 * returned (same rows, same order), and a refused Pro collection or a sign-out mid-pull
 * behaves as before.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`}`);
};

const src = readFileSync(join(ROOT, "assets/account-sync.js"), "utf8")
  .replace(/^import .*firebase-config.*$/m, "const SCHEMA_VERSION = 1;")
  .replaceAll("export ", "");
const { createAccountSync } = new Function("localStorage", "window", "document",
  `${src}\nreturn { createAccountSync };`)({ getItem: () => null, setItem() {}, removeItem() {} }, {}, {});

const DELAY = 50;
const UID = "u1";

/** A fake Firestore holding `data` (path -> [{id, ...fields}]); `refuse` paths throw. */
function fakeFb(data, { refuse = [], onRead = () => {} } = {}) {
  const stats = { inFlight: 0, maxInFlight: 0, reads: 0 };
  const fb = {
    collection: (_db, ...segs) => ({ path: segs.join("/") }),
    getDocs: async (ref) => {
      stats.reads++;
      stats.inFlight++;
      stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
      onRead(ref.path);
      await new Promise((r) => setTimeout(r, DELAY));
      stats.inFlight--;
      if (refuse.includes(ref.path)) throw Object.assign(new Error("permission-denied"), { code: "permission-denied" });
      const docs = (data[ref.path] || []).map(({ id, ...rest }) => ({ id, data: () => rest }));
      return { forEach: (fn) => docs.forEach(fn) };
    },
  };
  return { fb, stats };
}

function account(projectCount) {
  const data = { [`users/${UID}/projects`]: [], [`users/${UID}/rooms`]: [{ id: "r1", name: "Kuchnia" }],
    [`users/${UID}/clients`]: [{ id: "c1", name: "Kowalski" }] };
  for (let i = 0; i < projectCount; i++) {
    const id = `p${i}`;
    data[`users/${UID}/projects`].push({ id, name: `Projekt ${i}`, deletedAt: i % 3 === 0 ? 1 : null });
    data[`users/${UID}/projects/${id}/estimations`] = [{ id: `e${i}`, type: "PAINT" }];
    data[`users/${UID}/projects/${id}/shoppingItems`] = i % 2 ? [{ id: `s${i}`, name: "Farba" }] : [];
  }
  return data;
}

function makeSync(fb, auth = { currentUser: { uid: UID } }) {
  const sync = createAccountSync({ fb, db: {}, auth });
  sync.setUid(UID);
  return { sync, auth };
}

// 1. The reads overlap, and the whole pull costs a couple of round trips, not one per read.
{
  const data = account(20);
  const { fb, stats } = fakeFb(data);
  const { sync } = makeSync(fb);
  const t0 = Date.now();
  const out = await sync.downloadAccount(UID);
  const ms = Date.now() - t0;
  eq("every collection and every project's two subcollections are read", stats.reads, 8 + 2 * 20);
  eq("reads run side by side", stats.maxInFlight > 8, true);
  eq(`the pull takes a few round trips (${ms} ms for ${stats.reads} reads of ${DELAY} ms)`, ms < DELAY * 5, true);

  // 2. Same result the sequential version gave: rows in collection order, children in project order.
  eq("projects", out.projects.map((p) => p.id), data[`users/${UID}/projects`].map((p) => p.id));
  eq("rooms", out.rooms, [{ id: "r1", name: "Kuchnia" }]);
  eq("clients", out.clients, [{ id: "c1", name: "Kowalski" }]);
  eq("empty Pro collections are empty lists", [out.companies, out.jobs, out.quotes, out.materials, out.events], [[], [], [], [], []]);
  eq("estimations in project order, tagged with their project",
    out.estimations.map((e) => `${e.projectId}:${e.id}`), Array.from({ length: 20 }, (_, i) => `p${i}:e${i}`));
  eq("shopping items in project order, tagged with their project",
    out.shoppingItems.map((s) => `${s.projectId}:${s.id}`),
    Array.from({ length: 20 }, (_, i) => i).filter((i) => i % 2).map((i) => `p${i}:s${i}`));
}

// 3. A refused Pro collection leaves that list empty and the pull goes on (fail open).
{
  const data = account(2);
  const { fb } = fakeFb(data, { refuse: [`users/${UID}/clients`] });
  const { sync } = makeSync(fb);
  const out = await sync.downloadAccount(UID);
  eq("a refused clients read leaves clients empty", out.clients, []);
  eq("and the projects still arrive", out.projects.length, 2);
}

// 4. A refused projects or rooms read fails the pull, as before.
{
  const { fb } = fakeFb(account(2), { refuse: [`users/${UID}/rooms`] });
  const { sync } = makeSync(fb);
  let threw = false;
  try { await sync.downloadAccount(UID); } catch (e) { threw = true; }
  eq("a refused rooms read fails the pull", threw, true);
}

// 5. Signing out while the reads are in flight: nothing is handed back.
{
  const auth = { currentUser: { uid: UID } };
  const { fb } = fakeFb(account(4), { onRead: () => { setTimeout(() => { auth.currentUser = null; }, DELAY / 2); } });
  const { sync } = makeSync(fb, auth);
  let threw = false;
  try { await sync.downloadAccount(UID); } catch (e) { threw = /sync account changed/.test(e.message); }
  eq("a sign-out mid-pull throws 'sync account changed'", threw, true);
}

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
