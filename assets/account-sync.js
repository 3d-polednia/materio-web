/* LiczMat website — the sync engine between this browser and the account in Firestore.
 *
 * Moved out of assets/app.js on 2026-09-26, bodies and comments as they were. Until then
 * only /app/ loaded Firebase, so automatic sync ran only while /app/ was open: work done on
 * /projekty/ reached the account the next time somebody opened the account page. The
 * owner then decided that "Moje konto" is the one way in and the full pages are where the
 * work happens, so the same engine now runs in two modes:
 *
 *   /app/                  live listeners, the full pull-and-push at sign-in and the sync
 *                          tab's buttons — assets/app.js, exactly as before;
 *   the six account pages  assets/account-sync-page.js: a full pull at most every five
 *                          minutes per account, then an incremental push, then the same
 *                          debounced push on every change. No listeners (read quota) —
 *                          the rule the Android app has followed since session M.
 *
 * Both modes share one incremental cut-off per account in localStorage, so an edit left on
 * a page before its 1.5 s debounce fired is still newer than the cut-off, and the next page
 * that loads sends it.
 */

import { SCHEMA_VERSION } from "./firebase-config.js";

export const SYNC_ACCOUNT_KEY = "liczmat-sync-account";
export const AUTO_PUSH_KEY_PREFIX = "liczmat-sync-pushed-at:";
export const FULL_PULL_KEY_PREFIX = "liczmat-sync-pulled-at:";

/** Every device-local data key cleared by both the settings wipe and "start empty". */
export const DEVICE_DATA_KEYS = [
  "materio-workspace-v1",    // assets/workspace.js
  "materio-active-project",  // assets/workspace.js
  "liczmat-recent-calcs",    // assets/recent.js
  "liczmat-crm-v1",          // assets/crm.js
  "liczmat-materials-v1",    // assets/own-materials.js
  SYNC_ACCOUNT_KEY,           // this file: whose copy it was
];

/**
 * What somebody typed, as a number, or zero.
 *
 * `typedDigits()` is `pdfNum()`'s rule, carried to every reader of a typed field in session
 * K: drop every space of every width, then the LAST separator decides the decimal point and
 * the earlier ones were grouping. The draft this replaces was `String(v).replace(",", ".")`,
 * which swaps the first comma only, so `parseFloat` gave up at the first space — a room
 * 1 000 mm wide was one millimetre, and a quote line of "1 200,50" was worth 1,20.
 *
 * This file is a module and assets/app.js imports num() from it; the plain scripts each
 * carry their own copy under their own prefix, and scripts/test-decimal.mjs runs one table
 * through all of them so the copies cannot drift apart.
 */
const typedDigits = (v) => {
  const raw = [...String(v === undefined || v === null ? "" : v)].filter((ch) => ch.trim() !== "").join("");
  const cut = Math.max(raw.lastIndexOf(","), raw.lastIndexOf("."));
  return cut === -1 ? raw : `${raw.slice(0, cut).replace(/[.,]/g, "")}.${raw.slice(cut + 1)}`;
};
export const num = (v) => { const n = parseFloat(typedDigits(v)); return isFinite(n) ? n : 0; };

/**
 * One path segment, checked before it becomes part of a Firestore address.
 *
 * The ids this page builds paths out of come from the browser workspace, which is a
 * localStorage document anything on this device can have written, and Firestore joins
 * the segments it is handed: `projectId = "x/estimations/y"` addresses a different
 * document in a different collection, and `".."` or `"__x__"` are addresses Firestore
 * refuses outright — with an exception that lands in the same catch as a network
 * failure, so the sync would have reported "something went wrong" for a row it should
 * simply have skipped. Session 35: the row is skipped, and the rest of the push runs.
 *
 * @returns {string} the id, or "" when it may not be used as a segment
 */
function pathId(raw) {
  const id = String(raw == null ? "" : raw);
  if (!id || id.length > 1500) return "";
  if (id.indexOf("/") >= 0) return "";
  if (id === "." || id === "..") return "";
  if (/^__.*__$/.test(id)) return "";
  return id;
}

/** A 128-bit URL-safe token. The token in a /p/ link *is* the secret (FIRESTORE_SYNC §6). */
export function shareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const syncFields = (createdAt, deletedAt = null) => ({
  createdAt,
  updatedAt: Date.now(),
  deletedAt,
  schemaVersion: SCHEMA_VERSION,
});

export function createAccountSync({ fb, db, auth, onChange = () => {} }) {
  /**
   * The `updatedAt` of every project and room as Firestore last showed it to this page,
   * tombstones included (2026-09-26).
   *
   * The sign-in sync uploads the browser's copy for seconds after the page opens, one
   * awaited write per row, and it used to send whatever that copy said. A project the
   * visitor deleted on the Projekty tab in those seconds got its tombstone and then the old
   * live copy on top of it, and was back on the screen ten seconds later; a status changed
   * there went back the same way. Last write wins on `updatedAt` is the contract's rule for
   * the pull, and syncPushAll() now keeps it on the way up: a row that Firestore holds at
   * this version or a newer one is not the browser's to send.
   *
   * Fed by the live listeners and, for this page's own writes, by the write itself — the
   * listener's echo arrives a moment later, and the push must not slip in between.
   */
  const state = {
    uid: null, fb, db, auth, syncBusy: 0, lastAutoPushAt: 0,
    remoteStamps: {
      projects: new Map(), rooms: new Map(), estimations: new Map(), shoppingItems: new Map(),
      clients: new Map(), quotes: new Map(), materials: new Map(),
    },
    upSyncTimer: null,
  };

  const autoPushKey = (uid) => `${AUTO_PUSH_KEY_PREFIX}${uid}`;
  function readAutoPushAt(uid) {
    try { return Number(localStorage.getItem(autoPushKey(uid))) || 0; } catch (e) { return 0; }
  }
  // Persist the incremental cut-off per account so a new page load does not resend every row.
  function writeAutoPushAt(uid, at) {
    try { localStorage.setItem(autoPushKey(uid), String(at)); state.lastAutoPushAt = at; return true; }
    catch (e) { return false; }
  }
  function setUid(uid) {
    if (state.upSyncTimer) clearTimeout(state.upSyncTimer);
    state.upSyncTimer = null;
    state.uid = uid || null;
    state.lastAutoPushAt = uid ? readAutoPushAt(uid) : 0;
  }

  /**
   * Publish a read-only snapshot of a project and hand back its /p/ URL.
   *
   * A snapshot, not a live reference: the client sees the numbers as they were when the
   * link was made or last refreshed. Keeping it live would need Cloud Functions, which
   * this project does not have (FIRESTORE_SYNC §6).
   *
   * Moved here from assets/app.js on 2026-09-26 so the project view on /projekty/ can make
   * the same link /app/ makes. It reads the project from Firestore rather than from this
   * browser, so what is published is what the account holds.
   */
  async function shareProject(projectId, creatorLevel) {
    const uid = state.uid;
    const seg = pathId(projectId);
    if (!uid || !seg) throw new Error("share-project");
    requireSyncUid(uid);
    const projectSnap = await fb.getDoc(projectDoc(seg, uid));
    const project = projectSnap.exists() ? projectSnap.data() : null;
    if (!project || project.deletedAt) throw new Error("share-project");
    const sub = (name) => fb.collection(db, "users", uid, "projects", seg, name);
    const [estSnap, shopSnap] = await Promise.all([
      fb.getDocs(sub("estimations")), fb.getDocs(sub("shoppingItems")),
    ]);
    const alive = (snap, limit) => {
      const rows = [];
      snap.forEach((d) => { if (!d.data().deletedAt && rows.length < limit) rows.push(d.data()); });
      return rows;
    };
    const estimations = alive(estSnap, 200);
    const shoppingItems = alive(shopSnap, 500);
    const token = shareToken();
    const now = Date.now();
    requireSyncUid(uid);
    await fb.setDoc(fb.doc(db, "sharedProjects", token), {
      ownerId: uid, schemaVersion: SCHEMA_VERSION, createdAt: now, refreshedAt: now,
      projectName: project.name,
      currencyCode: (estimations[0] && estimations[0].currencyCode) || "PLN",
      estimations, shoppingItems,
      // `costs` turned PRO on 2026-09-04 (assets/plan.js), and a public link must not be a
      // way around that wall: a free account sharing its own project must not hand its
      // client a priced document it could not produce itself. The caller passes the level
      // derived from Firebase (lmLevelOf() over users/{uid}) rather than the copy hint, at
      // the moment the link is made — a plan bought or lost afterwards does not move it, the
      // same way the numbers themselves are a snapshot rather than a live reference. A
      // share made before this field existed carries no `creatorLevel` at all, and
      // assets/share.js treats that exactly as it treats "not pro": unpriced.
      creatorLevel,
    });
    return `${location.origin}/p/${token}`;
  }

  /**
   * Which account this browser's workspace copy was last synced with (session 35).
   *
   * The workspace is device-local and works signed out, which is the product — but "pull"
   * copies an account's projects, rooms, estimate lines and material list *into this
   * browser*, and nothing has ever recorded whose they are. On a shared computer that made
   * two separate mistakes possible: the next person to open /projekty/ read somebody else's
   * projects and prices, and the next person to sign in and press "push" uploaded them into
   * their own account, where the owner of the data cannot reach them and cannot know.
   *
   * Neither is a hole in the rules — Firestore still refuses to let one account read
   * another's documents — which is exactly why it had to be fixed here: the copy in the
   * browser is outside everything the rules protect.
   *
   * One key, device-local, holding one uid. It is listed on /cookies/ with the rest.
   */
  function syncAccount() {
    try { return localStorage.getItem(SYNC_ACCOUNT_KEY) || ""; } catch (e) { return ""; }
  }

  function setSyncAccount(uid) {
  try {
    if (uid) localStorage.setItem(SYNC_ACCOUNT_KEY, uid);
    else localStorage.removeItem(SYNC_ACCOUNT_KEY);
    return syncAccount() === (uid || "");
  } catch (e) { return false; }
  }

  /** Live counts for the visible summary, plus every row a push would send for ownership. */
  function localCounts() {
    const local = typeof wsExport === "function" ? wsExport() : null;
    if (!local) return null;
    const alive = (rows) => (rows || []).filter((r) => !r.deletedAt).length;
    const pro = typeof crmExport === "function" ? crmExport() : null;
    const own = typeof omExport === "function" ? omExport() : null;
    const all = (rows) => (rows || []).length;
    return {
      projects: alive(local.projects), rooms: alive(local.rooms),
      estimations: alive(local.estimations), shoppingItems: alive(local.shoppingItems),
      clients: alive(pro && pro.clients), jobs: alive(pro && pro.jobs),
      quotes: alive(pro && pro.quotes),
      total: all(local.projects) + all(local.rooms) + all(local.estimations)
        + all(local.shoppingItems) + all(pro && pro.clients) + all(pro && pro.jobs)
        + all(pro && pro.quotes) + all(own && own.materials),
    };
  }

  /**
   * Is what is in this browser somebody else's?
   *
   * Only when there is something here *and* it was last synced with another account. An
   * empty workspace carries nobody's data, so a stale stamp on it is not worth a warning —
   * it is re-stamped by the next sync.
   */
  function foreignWorkspace() {
    const stamp = syncAccount();
    if (!stamp || !state.uid || stamp === state.uid) return false;
    const counts = localCounts();
    return !!counts && counts.total > 0;
  }

  /** Non-empty local data whose owner has never been recorded requires an explicit choice. */
  function unclaimedWorkspace() {
    if (syncAccount() || !state.uid) return false;
    const counts = localCounts();
    return !!counts && counts.total > 0;
  }

  const blockedWorkspace = () => foreignWorkspace() || unclaimedWorkspace();

  /**
   * Mirror incoming Firestore documents into localStorage without triggering an up-sync.
   *
   * Runs on live listener snapshots so deletions and remote additions reach localStorage
   * immediately — including while a push or a pull is running (2026-09-26). It used to sit
   * those out, and a project deleted on this page during the sign-in sync stayed alive in
   * the browser's copy, where /projekty/ kept showing it and the push picked it up again.
   * wsImport() is last-write-wins, so a snapshot landing in the middle of a pull cannot
   * undo anything newer. syncBusy is still raised around it, so the wsSave() inside does not
   * start an automatic push back to Firestore.
   */
  function mirrorToLocal(incoming) {
    if (blockedWorkspace() || typeof wsImport !== "function") return;
    state.syncBusy++;
    try {
      wsImport(incoming);
    } finally {
      state.syncBusy--;
    }
    onChange();
  }

  /**
   * Upload the browser workspace, the Pro store and own materials into Firestore.
   *
   * Extracted from the manual "push" button so the same reconciliation pipeline can run
   * automatically. Touches only data stores and ignores buttons, status messages and summaries.
   *
   * When `since` is a finite timestamp, only rows updated after that moment are sent.
   * A full push is what somebody asked for, an automatic push is what nobody asked for
   * and must stay cheap: on a quiet workspace an edit re-uploads one document instead of
   * walking every collection on every keystroke and burning through daily write quotas.
   */
  function syncUidActive(uid) {
    return !!uid && state.uid === uid && !!auth.currentUser && auth.currentUser.uid === uid;
  }

  function requireSyncUid(uid) {
  if (!syncUidActive(uid)) throw new Error("sync account changed");
  }

  const projectDoc = (id, uid = state.uid) => fb.doc(db, "users", uid, "projects", id);
  const roomDoc = (id, uid = state.uid) => fb.doc(db, "users", uid, "rooms", id);

  /**
   * A listener's snapshot is the whole collection, so it replaces what was known: a
   * document gone from Firestore must not keep a stamp that stops the push re-creating it.
   */
  function sawRemote(collectionName, rows) {
    const seen = state.remoteStamps[collectionName];
    if (!seen) return;
    seen.clear();
    rows.forEach((row) => seen.set(row.id, Number(row.updatedAt) || 0));
  }

  /** A write this page makes to a project or room, remembered before it is sent. */
  function sawOwnWrite(ref, updatedAt) {
    const [, , collectionName, id, deeper] = String(ref.path || "").split("/");
    const seen = state.remoteStamps[collectionName];
    if (seen && id && deeper === undefined) seen.set(id, Number(updatedAt) || 0);
  }

  /** Firestore already holds this row at the browser's version, or a newer one. */
  function remoteHasRow(collectionName, row) {
    const seen = state.remoteStamps[collectionName];
    const at = seen ? seen.get(row.id) : undefined;
    return at !== undefined && at >= (Number(row.updatedAt) || 0);
  }

  /**
   * This row is exactly the version the last pull brought in — same `updatedAt` — so it is
   * not a local edit and has nothing to send. Deliberately "the same", not "at least as
   * new": remoteHasRow()'s rule would also swallow a genuine edit made here whenever the
   * device that wrote the pulled version has a clock running ahead of this one, and for these
   * five collections that would be new behaviour, where for projects and rooms it is the
   * rule since session X.
   */
  function remoteIsRow(collectionName, row) {
    const seen = state.remoteStamps[collectionName];
    const at = seen ? seen.get(row.id) : undefined;
    return at !== undefined && at === (Number(row.updatedAt) || 0);
  }

  function clearRemoteStamps() {
    Object.values(state.remoteStamps).forEach((seen) => seen.clear());
  }

  /**
   * 2026-09-26: a pull is the whole account, so it tells the engine what Firestore holds in
   * every collection, not only the two the /app/ listeners watch. Without this, a row the
   * pull had just imported carried a remote `updatedAt` newer than the incremental cut-off
   * and went straight back up on the next push — and because every write stamps a fresh
   * `updatedAt`, the next pull brought it back newer again. On the account pages, which
   * pull every five minutes, that re-sent the whole account every five minutes. Projects
   * and rooms were already skipped by stamp (session X) and now also learn it from the pull;
   * the other five collections skip only the exact version the pull brought in
   * (remoteIsRow()), and only in an incremental push — the `Number.isFinite(since)` checks
   * in the loops — so the full push of the sign-in reconcile and of the push button still
   * sends them whole.
   */
  function sawAccount(incoming) {
    Object.keys(state.remoteStamps).forEach((name) => sawRemote(name, incoming[name] || []));
  }

  async function syncPushAll(uid, since) {

  // Every push is a merge, exactly as `CloudSync.pushLocal()` on Android is
  // (`set(..., SetOptions.merge())`). The browser always sends the complete contract
  // document, so for the fields it knows about a merge and a replace are the same write —
  // but a replace would also delete any field the browser has never heard of, which is
  // precisely how the phone protects the note of chapter XVI and would have been how the
  // browser destroyed it. Symmetry here is the point.
  const MERGE = { merge: true };
  const local = typeof wsExport === "function" ? wsExport() : null;
  if (!local) return;
  const skippable = (row) => Number.isFinite(since) && Number.isFinite(row.updatedAt) && row.updatedAt <= since;
  // Projects and rooms are read again at the moment each one is sent, not taken from the
  // list made when the push began: every write is awaited, and in those seconds the live
  // listener can have brought a delete or an edit made on this page into the browser's
  // copy. What Firestore already holds at this version or a newer one stays unsent — see
  // remoteStamps.
  const current = (key, id) => (wsExport()[key] || []).find((row) => row.id === id);
  for (const listed of local.projects) {
    const p = current("projects", listed.id);
    if (!p) continue;
    if (!pathId(p.id)) continue;
    if (skippable(p) || remoteHasRow("projects", p)) continue;
    const value = p.valueMinor == null || !Number.isFinite(Number(p.valueMinor))
      ? null : Math.round(Number(p.valueMinor));
    requireSyncUid(uid);
    await fb.setDoc(projectDoc(p.id, uid), {
      name: String(p.name).slice(0, 120),
      clientId: String(p.clientId == null ? "" : p.clientId).slice(0, 64),
      status: proStatus(p.status),
      dueDate: proDay(p.dueDate),
      valueMinor: value,
      currencyCode: value == null ? "" : String(p.currencyCode == null ? "" : p.currencyCode).slice(0, 3),
      note: String(p.note == null ? "" : p.note).slice(0, 2000),
      // `color` is newer than the phone's project contract, but it is safe for the same
      // reason as the room link and shopping-item note below: every write on both sides
      // uses set(..., merge true), validProject() has no hasOnly() clause, and the phone's
      // readers ignore keys they do not know. Omitting it would lose the coloured deadline.
      color: String(p.color == null ? "" : p.color).slice(0, 16),
      archived: !!p.archived,
      ...syncFields(p.createdAt, p.deletedAt),
    }, MERGE);
  }
  for (const listed of local.rooms) {
    const r = current("rooms", listed.id);
    if (!r) continue;
    if (!pathId(r.id)) continue;
    if (skippable(r) || remoteHasRow("rooms", r)) continue;
    // `projectId` is chapter XVIII's "pomieszczenia są elementem projektu" and is not
    // in the contract: `RoomEntity` has no column, `roomToDoc()` no key, `validRoom()`
    // no check. It goes up anyway for the reason session 18 established and session 20
    // re-checked for rooms — every write on both sides is a merge, the rules validate
    // by shape with no `hasOnly`, and `roomFromDoc()` ignores keys it does not know —
    // so the phone carries the link without being able to show it. Omitting it here is
    // what made the link die at the browser's edge until now.
    requireSyncUid(uid);
    await fb.setDoc(roomDoc(r.id, uid), {
      name: String(r.name).slice(0, 120),
      lengthM: num(r.lengthM), widthM: num(r.widthM), heightM: num(r.heightM),
      projectId: r.projectId || null,
      ...syncFields(r.createdAt, r.deletedAt),
    }, MERGE);
  }
  for (const e of local.estimations) {
    // Estimates are a subcollection of their project, exactly as in Room.
    const projectSeg = pathId(e.projectId), lineSeg = pathId(e.id);
    if (!projectSeg || !lineSeg) continue;
    if (skippable(e) || (Number.isFinite(since) && remoteIsRow("estimations", e))) continue;
    const ref = fb.doc(db, "users", uid, "projects", projectSeg, "estimations", lineSeg);
    requireSyncUid(uid);
    await fb.setDoc(ref, {
      name: String(e.name).slice(0, 120),
      calculationType: e.calculationType,
      materialCategory: e.materialCategory,
      requiredUnits: Math.round(e.requiredUnits) || 0,
      unitLabel: String(e.unitLabel).slice(0, 24),
      totalCostMinor: Math.round(e.totalCostMinor) || 0,
      wastePercentage: Number(e.wastePercentage) || 0,
      wasteCostMinor: Math.round(e.wasteCostMinor) || 0,
      currencyCode: String(e.currencyCode).slice(0, 3),
      inputJson: String(e.inputJson || "{}").slice(0, 20000),
      ...syncFields(e.createdAt, e.deletedAt),
    }, MERGE);
  }
  for (const s of local.shoppingItems) {
    // The material list, the project's other subcollection (FIRESTORE_SYNC §2). The
    // pull has always read it — downloadAccount() has returned shoppingItems since the
    // sync tab was written — but nothing local ever produced one until session 17, so
    // the push had nothing to send. Every field is clamped to what the deployed rules
    // validate; `estimationId` is the remote id of the calculation, or null.
    const projectSeg = pathId(s.projectId), itemSeg = pathId(s.id);
    if (!projectSeg || !itemSeg) continue;
    if (skippable(s) || (Number.isFinite(since) && remoteIsRow("shoppingItems", s))) continue;
    const ref = fb.doc(db, "users", uid, "projects", projectSeg, "shoppingItems", itemSeg);
    requireSyncUid(uid);
    await fb.setDoc(ref, {
      estimationId: s.estimationId ? String(s.estimationId).slice(0, 64) : null,
      name: String(s.name).slice(0, 120),
      materialCategory: String(s.materialCategory || "OTHER").slice(0, 40),
      quantity: Math.max(0, num(s.quantity)),
      unit: String(s.unit || "").slice(0, 24),
      estimatedCostMinor: Math.round(s.estimatedCostMinor) || 0,
      currencyCode: String(s.currencyCode || "PLN").slice(0, 3),
      isPurchased: !!s.isPurchased,
      // Chapter XVI's note (session 18). Not named in FIRESTORE_SYNC §2 and not read
      // by the phone yet, but it survives there: every write in the app's CloudSync is
      // `set(..., SetOptions.merge())`, and a merge leaves keys it was not given alone.
      // Always sent, including empty — a merge can only clear what it is handed.
      note: String(s.note || "").slice(0, 500),
      ...syncFields(s.createdAt, s.deletedAt),
    }, MERGE);
  }
  requireSyncUid(uid);
  await pushProWorkspace(uid, since);
  // Called beside pushProWorkspace() rather than from inside it: that function returns
  // early when the Pro store is not on the page, and the two stores are independent.
  requireSyncUid(uid);
  await pushOwnMaterials(uid, since);
  }

  /**
   * Download the full account from Firestore and merge it into local stores.
   *
   * Extracted from the manual "pull" button. Returns true when every store accepted
   * the write, and false when any store rejected it (e.g. quota exceeded or storage failure).
   */
  async function syncPullAll(uid) {
    requireSyncUid(uid);
    const incoming = await downloadAccount(uid);
    sawAccount(incoming);
    requireSyncUid(uid);
    // Each of the three stores answers whether the merge is on this device now. A browser
    // that refuses to write — a private window, a full quota — used to be told "pulled"
    // and marked as synced with the account, so the next push sent back what it never
    // received (audit 2026-09-04, M3).
    requireSyncUid(uid);
    const landed = [wsImport(incoming)];
    const liveJobs = (incoming.jobs || []).filter((job) => !job.deletedAt);
    const jobsLanded = !liveJobs.length || (typeof wsMergeJobs === "function" && wsMergeJobs(liveJobs));
    landed.push(jobsLanded);
    if (jobsLanded) {
      for (const job of liveJobs) {
        const seg = pathId(job.id);
        if (!seg) continue;
        try {
          requireSyncUid(uid);
          const now = Date.now();
          await fb.setDoc(proDoc("jobs", seg, uid), proJobDoc(job, now), { merge: true });
        } catch (err) {
          // Conversion has already landed locally. One refused burial must not discard the
          // rest of the pull; the phone will bury this legacy document on its next pass.
        }
      }
    }
    // The Pro store is its own key and its own merge; both are last-write-wins on
    // `updatedAt`, the same rule the phone uses.
    requireSyncUid(uid);
    // Jobs have moved into the workspace above; importing them into the old store as well
    // would recreate the legacy copy that this compatibility pull is meant to consume.
    incoming.jobs = [];
    if (typeof crmImport === "function") landed.push(crmImport(incoming));
    // The visitor's own materials are a third store with a third key, merged by the same
    // rule. A material is replaced whole, its price history with it: merging two
    // histories would build a price trend that happened on neither device.
    requireSyncUid(uid);
    if (typeof omImport === "function") landed.push(omImport(incoming));
    onChange("pull");
    return !landed.some((ok) => ok === false);
  }

  /**
   * Reconcile Firestore and localStorage once upon sign-in.
   *
   * Pulls down the account first so remote updates and tombstones arrive in the local store,
   * then pushes local work up to Firestore, and stamps the sync account. Foreign workspaces
   * are skipped silently to prevent accidental merges across accounts.
   */
  async function autoReconcile(uid) {
    if (!syncUidActive(uid) || blockedWorkspace()) return;
    state.syncBusy++;
    try {
      await syncPullAll(uid);
      // Stamped before the push, not after it: a row saved while the upload is still running
      // carries an `updatedAt` from that window, and a stamp taken afterwards would put it in
      // the past of the next incremental push and skip it for good.
      const startedAt = Date.now();
      requireSyncUid(uid);
      if (!setSyncAccount(uid)) return;
      await syncPushAll(uid);
      // The successful cut-off belongs to this account across page loads.
      writeAutoPushAt(uid, startedAt);
      onChange();
    } catch (e) {
      // Automatic reconciliation at sign-in runs without user initiation; failures are
      // silent so the screen is not disrupted, leaving the manual buttons as fallback.
    } finally {
      state.syncBusy--;
    }
  }

  // Page mode uses the same safe incremental upload without doing a full pull per edit.
  async function incrementalPush(uid = state.uid) {
    if (!syncUidActive(uid) || state.syncBusy !== 0 || blockedWorkspace()) return false;
    const startedAt = Date.now();
    state.syncBusy++;
    try {
      if (!setSyncAccount(uid)) return false;
      await syncPushAll(uid, state.lastAutoPushAt);
      writeAutoPushAt(uid, startedAt);
      onChange("push");
      return true;
    } finally {
      state.syncBusy--;
    }
  }

  /**
   * Watch local changes and debounced-sync them up to Firestore when signed in.
   *
   * The syncBusy guard breaks feedback loops when an incoming Firestore snapshot or pull
   * writes to localStorage via wsSave(). All guards run before touching the debounce timer
   * so an unauthenticated or busy workspace change never cancels an already-armed push
   * without replacing it.
   *
   * Three stores, three events, one handler: `workspacechange` is the projects-and-rooms
   * store of assets/workspace.js, `crmchange` the Pro store of assets/crm-store.js and
   * `ownmaterialschange` the visitor's own materials. syncPushAll() sends all three, so a
   * client typed on the Klienci tab has to arm the same timer a room does — listening only
   * for the first of them is what would have left the other two waiting for the next sign-in.
   */
  function armUpSync() {
    if (state.syncBusy !== 0) return;
    if (!state.uid || blockedWorkspace()) return;
    if (state.upSyncTimer) {
      clearTimeout(state.upSyncTimer);
      state.upSyncTimer = null;
    }
    state.upSyncTimer = setTimeout(async () => {
      state.upSyncTimer = null;
      const uid = state.uid;
      if (!syncUidActive(uid) || state.syncBusy !== 0 || blockedWorkspace()) return;
      const startedAt = Date.now();
      state.syncBusy++;
      try {
        if (!setSyncAccount(uid)) return;
        await syncPushAll(uid, state.lastAutoPushAt);
        // Persist after success: a failed batch must be retried from the old cut-off.
        writeAutoPushAt(uid, startedAt);
        onChange();
      } catch (e) {
        // Background up-sync failures must be silent on screen.
      } finally {
        state.syncBusy--;
      }
    }, 1500);
  }

  const proDoc = (collection, id, uid = state.uid) => fb.doc(db, "users", uid, collection, id);

  /** A calendar day, or "". The same ten-character rule crmDay() and the phone both apply. */
  function proDay(value) {
    const day = String(value == null ? "" : value).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
  }

  /** One of the four values accepted by validProject() and validJob(). */
  function proStatus(value) {
    return ["new", "active", "done", "cancelled"].indexOf(value) >= 0 ? value : "new";
  }

  /** The complete legacy job shape: Firestore refuses a tombstone-only merge. */
  function proJobDoc(job, deletedAt) {
    const text = (value, max) => String(value == null ? "" : value).slice(0, max);
    const value = job.valueMinor == null || !Number.isFinite(Number(job.valueMinor))
      ? null : Math.round(Number(job.valueMinor));
    return {
      name: text(job.name, 120),
      clientId: text(job.clientId, 64),
      projectId: text(job.projectId, 64),
      status: proStatus(job.status),
      description: text(job.description, 2000),
      note: text(job.note, 2000),
      color: text(job.color, 16),
      dueDate: proDay(job.dueDate),
      valueMinor: value,
      currencyCode: value == null ? "" : text(job.currencyCode, 3),
      ...syncFields(job.createdAt, deletedAt),
    };
  }

  /**
   * Push LiczMat Pro's surviving collections (session 46).
   *
   * They joined the sync contract on 2026-08-26 — `users/{uid}/clients` and `/quotes`,
   * flat collections beside `rooms`, with `validClient()` / `validJob()` / `validQuote()` in
   * the deployed rules. Every field is clamped here to exactly what those rules validate:
   * the rules are the last gate, and a document they refuse fails the whole pass.
   *
   * The links travel as document ids — `projectIds` on a client, `projectId` and `clientId`
   * on a job, `projectId` on a quote — which is what the row ids in this browser already are.
   *
   * A merge, like every other write on both platforms: a replace would delete a field this
   * browser has never heard of, which is exactly how the phone's own extra fields survive.
   * Quote status can ship before the Android UI knows it: validQuote() validates the known
   * shape without hasOnly(), the phone writes quotes with SetOptions.merge(), and crmImport()
   * keeps the whole incoming document. A pull therefore brings the field back and a phone
   * write leaves it alone. The phone not showing the status yet is the known remaining gap.
   */
  async function pushProWorkspace(uid, since) {
    if (typeof crmExport !== "function") return;
    const MERGE = { merge: true };
    const pro = crmExport();
    const text = (value, max) => String(value == null ? "" : value).slice(0, max);
    const skippable = (row) => Number.isFinite(since) && Number.isFinite(row.updatedAt) && row.updatedAt <= since;

    for (const c of pro.clients || []) {
      const seg = pathId(c.id);
      if (!seg) continue;
      if (skippable(c) || (Number.isFinite(since) && remoteIsRow("clients", c))) continue;
      requireSyncUid(uid);
      await fb.setDoc(proDoc("clients", seg, uid), {
        name: text(c.name, 120),
        phone: text(c.phone, 200),
        email: text(c.email, 200),
        address: text(c.address, 200),
        note: text(c.note, 2000),
        projectIds: (Array.isArray(c.projectIds) ? c.projectIds : [])
          .filter((id) => !!pathId(id)).slice(0, 200),
        archived: !!c.archived,
        ...syncFields(c.createdAt, c.deletedAt),
      }, MERGE);
    }

    for (const q of pro.quotes || []) {
      const seg = pathId(q.id);
      if (!seg) continue;
      if (skippable(q) || (Number.isFinite(since) && remoteIsRow("quotes", q))) continue;
      const labour = (Array.isArray(q.labour) ? q.labour : []).slice(0, 60).map((line) => ({
        id: text(line.id, 64),
        name: text(line.name, 120),
        // A blank quantity is a lump sum and stays null: a line nobody counted and a line
        // counted once are different statements.
        quantity: line.quantity == null ? null : Math.max(0, num(line.quantity)),
        unit: text(line.unit, 24),
        amountMinor: Math.round(line.amountMinor) || 0,
      }));
      const money = labour.reduce((sum, line) => sum + line.amountMinor, 0);
      requireSyncUid(uid);
      await fb.setDoc(proDoc("quotes", seg, uid), {
        name: text(q.name, 120),
        projectId: text(q.projectId, 64),
        labour: labour,
        marginPct: Math.min(1000, Math.max(0, num(q.marginPct))),
        status: typeof crmQuoteStatus === "function" ? crmQuoteStatus(q) : "draft",
        note: text(q.note, 2000),
        currencyCode: money === 0 ? "" : text(q.currencyCode, 3),
        ...syncFields(q.createdAt, q.deletedAt),
      }, MERGE);
    }
  }

  /**
   * Push the visitor's own materials (session 59, item C6 of the parity audit).
   *
   * `users/{uid}/materials`, the ninth collection, added to the contract on 2026-08-30 with
   * `validMaterial()` in the deployed rules. The price history travels **inside** the
   * document, in `prices[]` — a point belongs to one material, nothing links to it, nothing
   * edits one once written, and it dies with the material.
   *
   * Every field is clamped here to exactly what the rules validate, the same discipline the
   * three Pro collections follow: the rules are the last gate, and a document they refuse
   * fails the whole pass. The cap on `prices` is the rules' own 60, and the newest are kept,
   * because that is what the phone's `SyncContract.capPrices()` does with the same list.
   */
  async function pushOwnMaterials(uid, since) {
    if (typeof omExport !== "function") return;
    const MERGE = { merge: true };
    const store = omExport();
    const text = (value, max) => String(value == null ? "" : value).slice(0, max);
    // A measurement is null or a number in range, never "present": a covering has an area
    // per package and no kerf, a profile the other way round, and the rules check for that.
    // A NaN out of a bad row would be sent as a number Firestore refuses.
    const measure = (value, max) => {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null;
    };
    const skippable = (row) => Number.isFinite(since) && Number.isFinite(row.updatedAt) && row.updatedAt <= since;

    for (const m of store.materials || []) {
      const seg = pathId(m.id);
      if (!seg) continue;
      if (skippable(m) || (Number.isFinite(since) && remoteIsRow("materials", m))) continue;
      const priceMinor = m.priceMinor == null ? null : Math.round(m.priceMinor);
      const prices = (Array.isArray(m.prices) ? m.prices : [])
        .filter((p) => p && Number.isFinite(Number(p.priceMinor)) && Number.isFinite(Number(p.recordedAt)))
        .sort((a, b) => Number(b.recordedAt) - Number(a.recordedAt))
        .slice(0, 60)
        .map((p) => ({
          priceMinor: Math.round(Number(p.priceMinor)),
          currencyCode: text(p.currencyCode, 3),
          recordedAt: Math.round(Number(p.recordedAt)),
        }));
      requireSyncUid(uid);
      await fb.setDoc(proDoc("materials", seg, uid), {
        name: text(m.name, 120),
        category: text(m.category || "OTHER", 40),
        application: text(m.application || "WALL_FLOOR_COVERING", 40),
        widthMm: measure(m.widthMm, 100000),
        lengthMm: measure(m.lengthMm, 100000),
        kerfMm: measure(m.kerfMm, 1000),
        coveragePerUnitM2: measure(m.coveragePerUnitM2, 10000),
        packageAreaM2: measure(m.packageAreaM2, 10000),
        wastePercent: measure(m.wastePercent, 100),
        priceMinor: priceMinor,
        // Chapter VI once more: a material nobody has priced carries no currency.
        currencyCode: priceMinor == null ? "" : text(m.currencyCode, 3),
        priceUpdatedAt: m.priceUpdatedAt == null ? null : Math.round(m.priceUpdatedAt),
        prices: prices,
        ...syncFields(m.createdAt, m.deletedAt),
      }, MERGE);
    }
  }

  /**
   * Everything under users/{uid}, in the shape assets/workspace.js stores locally —
   * used by the pull button and by the export button.
   */
  async function downloadAccount(uid = state.uid) {
    const out = {
      projects: [], rooms: [], estimations: [], shoppingItems: [],
      clients: [], jobs: [], quotes: [], materials: [],
    };
    const rows = (snap) => { const list = []; snap.forEach((d) => list.push({ id: d.id, ...d.data() })); return list; };

    requireSyncUid(uid);
    const projSnap = await fb.getDocs(fb.collection(db, "users", uid, "projects"));
    out.projects = rows(projSnap);
    requireSyncUid(uid);
    out.rooms = rows(await fb.getDocs(fb.collection(db, "users", uid, "rooms")));
    // The Pro collections (session 46). Flat, beside rooms, and downloaded even when
    // nothing on this page draws them: the export button hands back the whole account.
    //
    // Each one is read on its own and a refusal leaves it empty rather than taking the pull
    // down. Until the rules that validate them are deployed, `users/{uid}/clients` falls
    // through to the catch-all `allow read, write: if false` — and one refusal inside this
    // function used to mean nobody could pull their *projects* either. Losing the workspace
    // because a collection somebody may never have used is unreadable is the worse failure,
    // and it is the same argument the paywall follows when the plan cannot be read at all —
    // fail open, in the direction of the visitor's own data.
    // Keep `jobs` for one release of tolerant reading. Remove it in the release after this
    // one, together with the phone's database migration from schema 9 to 10.
    for (const name of ["clients", "jobs", "quotes", "materials"]) {
      try {
        requireSyncUid(uid);
        out[name] = rows(await fb.getDocs(fb.collection(db, "users", uid, name)));
      } catch (err) {
        if (!syncUidActive(uid)) throw err;
        out[name] = [];
      }
    }

    for (const project of out.projects) {
      const sub = (name) => fb.collection(db, "users", uid, "projects", project.id, name);
      requireSyncUid(uid);
      const est = rows(await fb.getDocs(sub("estimations"))).map((e) => ({ ...e, projectId: project.id }));
      requireSyncUid(uid);
      const shop = rows(await fb.getDocs(sub("shoppingItems"))).map((s) => ({ ...s, projectId: project.id }));
      out.estimations.push(...est);
      out.shoppingItems.push(...shop);
    }
    return out;
  }

  return { state, setUid, syncAccount, setSyncAccount, localCounts, foreignWorkspace,
    unclaimedWorkspace, blockedWorkspace, syncUidActive, requireSyncUid, sawRemote,
    sawOwnWrite, clearRemoteStamps, mirrorToLocal, syncPushAll, syncPullAll,
    autoReconcile, incrementalPush, armUpSync, downloadAccount, shareProject, projectDoc, roomDoc };
}
