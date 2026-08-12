/* LiczMat website — the account at /app/.
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
 * - The browser workspace (assets/workspace.js, localStorage) is the same schema, so
 *   "push" and "pull" on the sync tab are plain document copies, not a translation.
 *
 * Account management lives here too: Google sign-in, password reset, e-mail change,
 * password change, a data export and account deletion. Deleting an account has to
 * remove the documents before the user, because the rules key on request.auth.uid —
 * once the user is gone nothing can reach them.
 */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK, SCHEMA_VERSION } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const T = (key) => (typeof t === "function" ? t(key) : key);

const state = { uid: null, user: null, projects: [], rooms: [], unsub: [] };
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
    case "auth/requires-recent-login": return T("app_err_recent_login");
    case "auth/popup-blocked":
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return T("app_err_popup");
    case "auth/operation-not-allowed": return T("app_err_provider_off");
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

const escapeHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
  wireTabs();
  wireAccountPanel();
  wireSyncPanel();
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
      else {
        const cred = await fb.createUserWithEmailAndPassword(auth, email, password);
        // A fresh account gets its verification mail straight away; nothing is gated
        // on it, it is there so a password reset has somewhere to land.
        fb.sendEmailVerification(cred.user).catch(() => {});
      }
    } catch (err) {
      status(authMessage(err && err.code), true);
    } finally {
      $("auth-submit").disabled = false;
    }
  });

  $("auth-google").addEventListener("click", async () => {
    status("");
    try {
      const provider = new fb.GoogleAuthProvider();
      await fb.signInWithPopup(auth, provider);
    } catch (err) {
      status(authMessage(err && err.code), true);
    }
  });

  $("auth-forgot").addEventListener("click", async (e) => {
    e.preventDefault();
    const email = $("auth-email").value.trim();
    if (!email) { status(T("app_err_email"), true); return; }
    try {
      await fb.sendPasswordResetEmail(auth, email);
      status(T("app_reset_sent"));
    } catch (err) {
      status(authMessage(err && err.code), true);
    }
  });

  $("app-signout").addEventListener("click", () => fb.signOut(auth));
}

/** Which sign-in methods the account actually has — it decides what can be changed. */
const hasPasswordProvider = (user) =>
  (user.providerData || []).some((p) => p.providerId === "password");

async function onSignedIn(user) {
  state.uid = user.uid;
  state.user = user;
  $("app-auth").hidden = true;
  $("app-workspace").hidden = false;
  $("app-email-label").textContent = user.email || "";

  const providers = (user.providerData || []).map((p) => p.providerId);
  $("app-provider").textContent = providers.includes("google.com")
    ? T("app_provider_google") : T("app_provider_password");
  $("app-verified").textContent = user.emailVerified ? T("app_verified") : T("app_unverified");
  $("app-verified").classList.toggle("warn", !user.emailVerified);
  $("app-verify-row").hidden = user.emailVerified;

  // A Google account has no password to change, and its e-mail belongs to Google.
  const password = hasPasswordProvider(user);
  $("password-form").hidden = !password;
  $("email-form").hidden = !password;
  $("app-delete-password-field").hidden = !password;

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
  renderLocalSummary();
}

function onSignedOut() {
  state.unsub.forEach((fn) => fn());
  state.unsub = [];
  state.uid = null;
  state.user = null;
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

/* ------------------------------------------------------------------ tabs */

function wireTabs() {
  const tabs = document.querySelectorAll(".app-tab");
  tabs.forEach((btn) => btn.addEventListener("click", () => {
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== btn.dataset.tab;
    });
    if (btn.dataset.tab === "sync") renderLocalSummary();
  }));
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

/* ------------------------------------------------------------------ sync with the browser */

/** How much is sitting in this browser's workspace, in one line. */
function renderLocalSummary() {
  const box = $("app-sync-local");
  if (!box || typeof wsExport !== "function") return;
  const local = wsExport();
  const alive = (rows) => rows.filter((r) => !r.deletedAt).length;
  box.textContent = `${T("app_sync_local")}: ${alive(local.projects)} × ${T("app_projects")}, ` +
    `${alive(local.rooms)} × ${T("app_rooms")}, ${alive(local.estimations)} × ${T("ws_lines")}`;
}

function wireSyncPanel() {
  const push = $("app-sync-push");
  const pull = $("app-sync-pull");
  if (!push || !pull || typeof wsExport !== "function") return;

  push.addEventListener("click", async () => {
    push.disabled = true;
    try {
      const local = wsExport();
      for (const p of local.projects) {
        await fb.setDoc(projectDoc(p.id), {
          name: String(p.name).slice(0, 120),
          archived: !!p.archived,
          ...syncFields(p.createdAt, p.deletedAt),
        });
      }
      for (const r of local.rooms) {
        await fb.setDoc(roomDoc(r.id), {
          name: String(r.name).slice(0, 120),
          lengthM: num(r.lengthM), widthM: num(r.widthM), heightM: num(r.heightM),
          ...syncFields(r.createdAt, r.deletedAt),
        });
      }
      for (const e of local.estimations) {
        // Estimates are a subcollection of their project, exactly as in Room.
        const ref = fb.doc(db, "users", state.uid, "projects", e.projectId, "estimations", e.id);
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
        });
      }
      status(T("app_sync_pushed"));
    } catch (err) {
      status(T("app_err_unknown"), true);
    } finally {
      push.disabled = false;
    }
  });

  pull.addEventListener("click", async () => {
    pull.disabled = true;
    try {
      const incoming = await downloadAccount();
      wsImport(incoming);
      renderLocalSummary();
      status(T("app_sync_pulled"));
    } catch (err) {
      status(T("app_err_unknown"), true);
    } finally {
      pull.disabled = false;
    }
  });
}

/**
 * Everything under users/{uid}, in the shape assets/workspace.js stores locally —
 * used by the pull button and by the export button.
 */
async function downloadAccount() {
  const out = { projects: [], rooms: [], estimations: [], shoppingItems: [] };
  const rows = (snap) => { const list = []; snap.forEach((d) => list.push({ id: d.id, ...d.data() })); return list; };

  const projSnap = await fb.getDocs(fb.collection(db, "users", state.uid, "projects"));
  out.projects = rows(projSnap);
  out.rooms = rows(await fb.getDocs(fb.collection(db, "users", state.uid, "rooms")));

  for (const project of out.projects) {
    const sub = (name) => fb.collection(db, "users", state.uid, "projects", project.id, name);
    const est = rows(await fb.getDocs(sub("estimations"))).map((e) => ({ ...e, projectId: project.id }));
    const shop = rows(await fb.getDocs(sub("shoppingItems"))).map((s) => ({ ...s, projectId: project.id }));
    out.estimations.push(...est);
    out.shoppingItems.push(...shop);
  }
  return out;
}

/* ------------------------------------------------------------------ account settings */

/** Ask for the password again; Firebase refuses sensitive changes on a stale session. */
async function reauthenticate(password) {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error("no user"), { code: "auth/user-not-found" });
  if (hasPasswordProvider(user)) {
    const credential = fb.EmailAuthProvider.credential(user.email, password);
    await fb.reauthenticateWithCredential(user, credential);
  } else {
    await fb.reauthenticateWithPopup(user, new fb.GoogleAuthProvider());
  }
}

function wireAccountPanel() {
  $("app-verify-send").addEventListener("click", async () => {
    try {
      await fb.sendEmailVerification(auth.currentUser);
      status(T("app_verify_sent"));
    } catch (err) { status(authMessage(err && err.code), true); }
  });

  $("email-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await reauthenticate($("email-password").value);
      // verifyBeforeUpdateEmail, not updateEmail: the address only changes once the
      // owner has proved they can read mail at it.
      await fb.verifyBeforeUpdateEmail(auth.currentUser, $("email-new").value.trim());
      $("email-password").value = "";
      status(T("app_email_changed"));
    } catch (err) { status(authMessage(err && err.code), true); }
  });

  $("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await reauthenticate($("password-current").value);
      await fb.updatePassword(auth.currentUser, $("password-new").value);
      $("password-current").value = "";
      $("password-new").value = "";
      status(T("app_password_changed"));
    } catch (err) { status(authMessage(err && err.code), true); }
  });

  $("app-export").addEventListener("click", async () => {
    try {
      const data = await downloadAccount();
      const blob = new Blob([JSON.stringify({ ...data, exportedAt: Date.now(), uid: state.uid }, null, 2)],
        { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "materio-account.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { status(T("app_err_unknown"), true); }
  });

  $("app-delete-account").addEventListener("click", async () => {
    if (!confirm(T("app_delete_confirm"))) return;
    const button = $("app-delete-account");
    button.disabled = true;
    try {
      await reauthenticate($("delete-password").value);
      await deleteEverything();
      await fb.deleteUser(auth.currentUser);
      status(T("app_deleted"));
    } catch (err) {
      status(authMessage(err && err.code), true);
    } finally {
      button.disabled = false;
    }
  });
}

/**
 * Remove every document the account owns, before the user itself.
 *
 * Order matters: the rules key on `request.auth.uid`, so once the user is deleted the
 * documents become unreachable by anyone, including their owner. Firestore does not
 * cascade, so the subcollections go first (FIRESTORE_SYNC §2).
 */
async function deleteEverything() {
  const del = (ref) => fb.deleteDoc(ref);

  const projSnap = await fb.getDocs(fb.collection(db, "users", state.uid, "projects"));
  for (const project of projSnap.docs) {
    for (const name of ["estimations", "shoppingItems"]) {
      const sub = await fb.getDocs(fb.collection(db, "users", state.uid, "projects", project.id, name));
      for (const d of sub.docs) await del(d.ref);
    }
    await del(project.ref);
  }

  const roomSnap = await fb.getDocs(fb.collection(db, "users", state.uid, "rooms"));
  for (const d of roomSnap.docs) await del(d.ref);

  // Shared links are public documents keyed by token; they carry the owner's uid so
  // they can be found and revoked.
  const shared = await fb.getDocs(
    fb.query(fb.collection(db, "sharedProjects"), fb.where("ownerId", "==", state.uid)));
  for (const d of shared.docs) await del(d.ref);

  await del(fb.doc(db, "users", state.uid));
}

document.addEventListener("DOMContentLoaded", () => {
  boot().catch(() => status(T("app_err_unknown"), true));
});
