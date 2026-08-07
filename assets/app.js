/* Materio website — the signed-in workspace at /app/.
 *
 * Reads and writes exactly the documents the Android app does: the contract is
 * docs/FIRESTORE_SYNC.md in the app repo, mirrored in Kotlin by core/sync/SyncContract.kt.
 * A project created here shows up on the phone, and the other way round.
 *
 * Design notes:
 * - Document ids are UUIDs generated on the client (`remoteId` in Room). Room's local
 *   autoincrement id never leaves the device, so two phones cannot collide.
 * - Deleting writes a tombstone (`deletedAt`) instead of removing the document, so the
 *   other device learns about the deletion instead of resurrecting the row on its next
 *   push. Tombstones are filtered out of the lists here.
 * - Conflicts are last-write-wins on `updatedAt`, ties to the remote copy — the same
 *   rule as SyncContract.remoteWins(). The Firestore SDK's own offline queue does the
 *   rest, which is why this file has no retry logic of its own.
 * - Every write has to satisfy the security rules, so the full document is always sent
 *   (an update carrying only `deletedAt` would fail validation).
 */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK, SCHEMA_VERSION } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const T = (key) => (typeof t === "function" ? t(key) : key);

const state = { uid: null, projects: [], rooms: [], unsub: [] };
let db = null, auth = null, fb = null;

/* ------------------------------------------------------------------ helpers */

/** A 128-bit URL-safe token. The token in a /p/ link *is* the secret (FIRESTORE_SYNC §6). */
function shareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : shareToken());

/** Sync fields shared by every document under users/{uid}/**. */
const syncFields = (createdAt, deletedAt = null) => ({
  createdAt,
  updatedAt: Date.now(),
  deletedAt,
  schemaVersion: SCHEMA_VERSION,
});

/** Firebase Auth error codes translated into the copy the page already carries. */
function authMessage(code) {
  switch (code) {
    case "auth/invalid-email": return T("app_err_email");
    case "auth/weak-password": return T("app_err_password");
    case "auth/email-already-in-use": return T("app_err_inuse");
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return T("app_err_credentials");
    case "auth/network-request-failed": return T("app_err_network");
    default: return T("app_err_unknown");
  }
}

function status(message, isError) {
  const box = $("app-status");
  if (!box) return;
  box.textContent = message || "";
  box.classList.toggle("err", Boolean(isError));
  box.hidden = !message;
}

const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : 0; };

/* ------------------------------------------------------------------ boot */

async function boot() {
  if (!FIREBASE_READY) {
    $("app-config-missing").hidden = false;
    $("app-auth").hidden = true;
    return;
  }

  const [appMod, authMod, storeMod] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  fb = { ...authMod, ...storeMod };

  const app = appMod.initializeApp(FIREBASE_CONFIG);
  auth = authMod.getAuth(app);
  db = storeMod.getFirestore(app);

  // The same offline persistence the Android SDK has: writes queue while the
  // connection is down and go out when it returns.
  try {
    await storeMod.enableIndexedDbPersistence(db);
  } catch (e) {
    // Two tabs open, or a browser without IndexedDB — the app still works online.
  }

  authMod.onAuthStateChanged(auth, (user) => (user ? onSignedIn(user) : onSignedOut()));
  wireAuthForm();
  wireWorkspace();
}

/* ------------------------------------------------------------------ auth */

function wireAuthForm() {
  const form = $("auth-form");
  let mode = "signin";

  $("auth-switch").addEventListener("click", (e) => {
    e.preventDefault();
    mode = mode === "signin" ? "signup" : "signin";
    $("auth-submit").textContent = T(mode === "signin" ? "app_signin" : "app_signup");
    $("auth-switch").textContent = T(mode === "signin" ? "app_switch_signup" : "app_switch_signin");
    status("");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value;
    $("auth-submit").disabled = true;
    status("");
    try {
      if (mode === "signin") await fb.signInWithEmailAndPassword(auth, email, password);
      else await fb.createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      status(authMessage(err && err.code), true);
    } finally {
      $("auth-submit").disabled = false;
    }
  });

  $("app-signout").addEventListener("click", () => fb.signOut(auth));
}

async function onSignedIn(user) {
  state.uid = user.uid;
  $("app-auth").hidden = true;
  $("app-workspace").hidden = false;
  $("app-email-label").textContent = user.email || "";

  // Profile: create on first sign-in, then only ever touch lastSeenAt/appVersion —
  // the rules reject anything else, and `plan` is server-side only.
  const profile = fb.doc(db, "users", user.uid);
  try {
    const snap = await fb.getDoc(profile);
    if (snap.exists()) {
      await fb.updateDoc(profile, { lastSeenAt: Date.now(), appVersion: "web" });
    } else {
      await fb.setDoc(profile, { createdAt: Date.now(), lastSeenAt: Date.now(), appVersion: "web" });
    }
  } catch (e) {
    // A profile write failing must never block the workspace.
  }

  listen("projects", (rows) => { state.projects = rows; renderProjects(); });
  listen("rooms", (rows) => { state.rooms = rows; renderRooms(); });
}

function onSignedOut() {
  state.unsub.forEach((fn) => fn());
  state.unsub = [];
  state.uid = null;
  state.projects = [];
  state.rooms = [];
  $("app-auth").hidden = false;
  $("app-workspace").hidden = true;
}

/** Live list of one collection, tombstones filtered out, newest change first. */
function listen(collectionName, onRows) {
  const ref = fb.collection(db, "users", state.uid, collectionName);
  const unsub = fb.onSnapshot(
    fb.query(ref, fb.orderBy("updatedAt", "desc")),
    (snap) => {
      const rows = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.deletedAt) return;
        rows.push({ id: d.id, ...data });
      });
      onRows(rows);
      status(snap.metadata.fromCache ? T("app_offline") : "");
    },
    () => status(T("app_err_unknown"), true),
  );
  state.unsub.push(unsub);
}

/* ------------------------------------------------------------------ projects & rooms */

const projectDoc = (id) => fb.doc(db, "users", state.uid, "projects", id);
const roomDoc = (id) => fb.doc(db, "users", state.uid, "rooms", id);

async function addProject(name) {
  const now = Date.now();
  await fb.setDoc(projectDoc(newId()), { name, archived: false, ...syncFields(now) });
}

async function addRoom(name, lengthM, widthM, heightM) {
  const now = Date.now();
  await fb.setDoc(roomDoc(newId()), { name, lengthM, widthM, heightM, ...syncFields(now) });
}

/** Tombstone, not removal — the phone has to learn the row is gone (FIRESTORE_SYNC §4). */
async function tombstone(ref, row, fields) {
  await fb.setDoc(ref, { ...fields, ...syncFields(row.createdAt || Date.now(), Date.now()) });
}

function renderProjects() {
  const list = $("project-list");
  if (!state.projects.length) {
    list.innerHTML = `<li class="empty muted">${T("app_empty_projects")}</li>`;
    return;
  }
  list.innerHTML = state.projects.map((p) => `<li data-id="${p.id}">
      <span class="row-name">${escapeHtml(p.name)}${p.archived ? ` <em class="muted">(${T("app_archived")})</em>` : ""}</span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-share>${T("app_share")}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-del>${T("app_delete")}</button>
      </span>
    </li>`).join("");
}

function renderRooms() {
  const list = $("room-list");
  if (!state.rooms.length) {
    list.innerHTML = `<li class="empty muted">${T("app_empty_rooms")}</li>`;
    return;
  }
  const fmt = (v) => new Intl.NumberFormat(document.documentElement.lang || "pl",
    { maximumFractionDigits: 2 }).format(v);
  list.innerHTML = state.rooms.map((r) => `<li data-id="${r.id}">
      <span class="row-name">${escapeHtml(r.name)}
        <em class="muted">${fmt(r.lengthM)} × ${fmt(r.widthM)} × ${fmt(r.heightM)} m — ${fmt(r.lengthM * r.widthM)} m²</em>
      </span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-del>${T("app_delete")}</button>
      </span>
    </li>`).join("");
}

const escapeHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ sharing */

/**
 * Publish a read-only snapshot of a project and hand back its /p/ URL.
 *
 * A snapshot, not a live reference: the client sees the numbers as they were when the
 * link was made or last refreshed. Keeping it live would need Cloud Functions, which
 * this project does not have (FIRESTORE_SYNC §6).
 */
async function shareProject(project) {
  const sub = (name) => fb.collection(db, "users", state.uid, "projects", project.id, name);
  const [estSnap, shopSnap] = await Promise.all([
    fb.getDocs(sub("estimations")),
    fb.getDocs(sub("shoppingItems")),
  ]);

  const alive = (snap, limit) => {
    const rows = [];
    snap.forEach((d) => { if (!d.data().deletedAt && rows.length < limit) rows.push(d.data()); });
    return rows;
  };
  const estimations = alive(estSnap, 200);
  const shoppingItems = alive(shopSnap, 500);
  const currencyCode = (estimations[0] && estimations[0].currencyCode) || "PLN";

  const token = shareToken();
  const now = Date.now();
  await fb.setDoc(fb.doc(db, "sharedProjects", token), {
    ownerId: state.uid,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    refreshedAt: now,
    projectName: project.name,
    currencyCode,
    estimations,
    shoppingItems,
  });
  return `${location.origin}/p/${token}`;
}

/* ------------------------------------------------------------------ wiring */

function wireWorkspace() {
  $("project-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("project-name");
    const name = input.value.trim().slice(0, 120);
    if (!name) return;
    input.value = "";
    try { await addProject(name); } catch (err) { status(T("app_err_unknown"), true); }
  });

  $("room-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("room-name");
    const name = input.value.trim().slice(0, 120);
    if (!name) return;
    const l = Math.min(num($("room-length").value), 1000);
    const w = Math.min(num($("room-width").value), 1000);
    const h = Math.min(num($("room-height").value), 100);
    input.value = "";
    try { await addRoom(name, l, w, h); } catch (err) { status(T("app_err_unknown"), true); }
  });

  $("project-list").addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const project = state.projects.find((p) => p.id === li.dataset.id);
    if (!project) return;

    if (e.target.closest("[data-del]")) {
      await tombstone(projectDoc(project.id), project, { name: project.name, archived: !!project.archived });
    } else if (e.target.closest("[data-share]")) {
      try {
        const url = await shareProject(project);
        await navigator.clipboard.writeText(url).catch(() => {});
        status(`${T("app_share_copied")}: ${url}`);
      } catch (err) {
        status(T("app_err_unknown"), true);
      }
    }
  });

  $("room-list").addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li || !e.target.closest("[data-del]")) return;
    const room = state.rooms.find((r) => r.id === li.dataset.id);
    if (!room) return;
    await tombstone(roomDoc(room.id), room, {
      name: room.name, lengthM: room.lengthM, widthM: room.widthM, heightM: room.heightM,
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  boot().catch(() => status(T("app_err_unknown"), true));
});
