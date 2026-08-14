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
 * Account management lives here too: password reset, e-mail change, Google sign-in (the
 * button is hidden since 2026-08-14 — see GOOGLE_SIGN_IN in src/app-pages.mjs — but the
 * code stays, because an account created with Google still has to re-authenticate that way
 * before it can be deleted),
 * password change, a data export and account deletion. Deleting an account has to
 * remove the documents before the user, because the rules key on request.auth.uid —
 * once the user is gone nothing can reach them.
 *
 * The session itself — which of chapter II's three levels the visitor is on, how long
 * the sign-in survives, and what the other 129 pages get to know about it — is
 * assets/account.js. This file is its only writer: it is the only page that loads
 * Firebase and can therefore ask who is actually signed in.
 */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK, SCHEMA_VERSION } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const T = (key) => (typeof t === "function" ? t(key) : key);

const state = {
  uid: null, user: null, projects: [], rooms: [], unsub: [],
  /** users/{uid} as last read. `plan` in it is what decides LICZMAT vs LICZMAT PRO. */
  profile: null,
  level: LM_LEVEL.GUEST,
};
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

  // Firebase sends the password-reset and address-verification mail in whatever language
  // this is set to, and defaults to English. The page says "Wysłaliśmy link do zmiany
  // hasła" and then an English mail arrived. It follows the language picker, because
  // /app/ switches language in place and the next mail should follow the visitor.
  const followLanguage = () => { auth.languageCode = document.documentElement.lang || "pl"; };
  followLanguage();
  document.addEventListener("langchange", followLanguage);

  // The same offline persistence the Android SDK has: writes queue while the
  // connection is down and go out when it returns.
  try {
    await storeMod.enableIndexedDbPersistence(db);
  } catch (e) {
    // Two tabs open, or a browser without IndexedDB — the app still works online.
  }

  authMod.onAuthStateChanged(auth, (user) => (user ? onSignedIn(user) : onSignedOut()));
  wireAuthForms();
  wireWorkspace();
  wireTabs();
  wireProfilePanel();
  wireAccountPanel();
  wireSyncPanel();

  // Everything above renders its text through T(). The language picker on this page
  // swaps the DOM in place instead of navigating, so anything JavaScript wrote has to
  // be written again — before this, switching language left the identity bar, the
  // level, the dates and both lists in the previous one.
  document.addEventListener("langchange", () => {
    if (!state.user) return;
    renderIdentity();
    renderProfile();
    renderProjects();
    renderRooms();
    renderLocalSummary();
  });

  // Everything above is wired. The forms exist in the markup from the first paint but do
  // nothing until this point, so a test that clicks earlier clicks a dead button — the
  // same reason a calculator page carries data-wired (scripts/test-pages.mjs).
  document.documentElement.setAttribute("data-app-ready", "1");
}

/* ------------------------------------------------------------------ auth */

/**
 * Show one of the three sign-in views; the Google button belongs to two of them.
 *
 * `focus` only when the visitor asked for the view by clicking. Moving focus on load
 * would scroll a signed-in visitor to a form they are not going to use.
 *
 * The Google box is only in the page when `GOOGLE_SIGN_IN` in `src/app-pages.mjs` is on —
 * it is off since 2026-08-14 — so everything that touches it checks it is there first.
 */
function showAuthView(view, focus) {
  document.querySelectorAll("[data-auth-view]").forEach((box) => {
    box.hidden = box.dataset.authView !== view;
  });
  const googleBox = $("auth-google-box");
  if (googleBox) googleBox.hidden = view === "reset";
  status("");
  const first = document.querySelector(`[data-auth-view="${view}"] input`);
  if (focus && first) first.focus();
}

/**
 * How long the sign-in survives, decided before it happens.
 *
 * Firebase defaults to browserLocalPersistence — the session outlives the window, which
 * is what a phone wants and a shared computer does not. The checkbox is remembered on
 * the device, so the answer is given once rather than at every sign-in.
 */
async function applyPersistence(remember) {
  lmWriteRemember(remember);
  try {
    await fb.setPersistence(auth, remember ? fb.browserLocalPersistence : fb.browserSessionPersistence);
  } catch (e) {
    // A browser with no storage at all: Firebase falls back to in-memory, which is the
    // stricter of the two anyway. Nothing here should stop somebody signing in.
  }
}

/** The remember checkbox next to whichever form was just submitted. */
const rememberedIn = (form) => {
  const box = form.querySelector("[data-remember]");
  return box ? box.checked : lmReadRemember();
};

/** Run one auth call with the submit button disabled and errors turned into copy. */
async function submitting(form, run) {
  const button = form.querySelector("button[type=submit]");
  if (button) button.disabled = true;
  status("");
  try {
    await run();
  } catch (err) {
    status(authMessage(err && err.code), true);
  } finally {
    if (button) button.disabled = false;
  }
}

function wireAuthForms() {
  // Every remember checkbox opens on what this device chose last time.
  document.querySelectorAll("[data-remember]").forEach((box) => { box.checked = lmReadRemember(); });

  document.querySelectorAll("[data-auth-go]").forEach((button) => {
    button.addEventListener("click", () => showAuthView(button.dataset.authGo, true));
  });

  $("signin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    submitting(form, async () => {
      await applyPersistence(rememberedIn(form));
      await fb.signInWithEmailAndPassword(auth, $("signin-email").value.trim(), $("signin-password").value);
    });
  });

  $("signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    submitting(form, async () => {
      await applyPersistence(rememberedIn(form));
      const cred = await fb.createUserWithEmailAndPassword(
        auth, $("signup-email").value.trim(), $("signup-password").value);
      // A fresh account gets its verification mail straight away; nothing is gated
      // on it, it is there so a password reset has somewhere to land.
      fb.sendEmailVerification(cred.user).catch(() => {});
    });
  });

  $("reset-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    submitting(form, async () => {
      await fb.sendPasswordResetEmail(auth, $("reset-email").value.trim());
      status(T("app_reset_sent"));
    });
  });

  const googleBtn = $("auth-google");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      status("");
      try {
        await applyPersistence(lmReadRemember());
        await fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
      } catch (err) {
        status(authMessage(err && err.code), true);
      }
    });
  }

  const signOut = async () => {
    stopListening();
    await fb.signOut(auth);
    status(T("app_signed_out"));
  };
  $("app-signout").addEventListener("click", signOut);
  $("prof-signout").addEventListener("click", signOut);

  // A link from a calculator can ask for the sign-up form directly: chapter II wants
  // registration to be the next step after a result, not a form somebody has to find.
  showAuthView(lmAuthMode(location.search));
}

/** Which sign-in methods the account actually has — it decides what can be changed. */
const hasPasswordProvider = (user) =>
  (user.providerData || []).some((p) => p.providerId === "password");

async function onSignedIn(user) {
  // onAuthStateChanged fires again for the same account — a token refresh, a profile
  // update, a reload. Running the whole of this a second time would stack a second pair
  // of snapshot listeners on the same two collections and re-read the profile for
  // nothing, so a repeat only redraws what changed.
  if (state.uid === user.uid) {
    state.user = user;
    renderIdentity();
    renderProfile();
    return;
  }

  state.uid = user.uid;
  state.user = user;
  $("app-auth").hidden = true;
  $("app-workspace").hidden = false;

  // A Google account has no password to change, and its e-mail belongs to Google.
  const password = hasPasswordProvider(user);
  $("password-form").hidden = !password;
  $("email-form").hidden = !password;
  $("app-delete-password-field").hidden = !password;

  // Profile: create on first sign-in, then only ever touch lastSeenAt/appVersion —
  // the rules reject anything else, and `plan` is server-side only.
  const profile = fb.doc(db, "users", user.uid);
  const now = Date.now();
  try {
    const snap = await fb.getDoc(profile);
    if (snap.exists()) {
      state.profile = snap.data();
      await fb.updateDoc(profile, { lastSeenAt: now, appVersion: "web" });
    } else {
      state.profile = { createdAt: now, lastSeenAt: now, appVersion: "web" };
      await fb.setDoc(profile, state.profile);
    }
  } catch (e) {
    // A profile write failing must never block the workspace. Without the document the
    // level falls back to LICZMAT, which is what a signed-in account without a plan is.
  }

  // The level is chapter II's, derived from the profile the server owns — see
  // lmLevelOf() in assets/account.js. Writing it is what tells the other 129 pages.
  state.level = lmLevelOf(user, state.profile);
  lmWriteLevel(state.level);

  renderIdentity();
  renderProfile();
  renderNext();

  listen("projects", (rows) => { state.projects = rows; renderProjects(); });
  listen("rooms", (rows) => { state.rooms = rows; renderRooms(); });
  renderLocalSummary();
}

function onSignedOut() {
  stopListening();
  state.uid = null;
  state.user = null;
  state.profile = null;
  state.level = LM_LEVEL.GUEST;
  lmWriteLevel(LM_LEVEL.GUEST);
  state.projects = [];
  state.rooms = [];
  $("app-auth").hidden = false;
  $("app-workspace").hidden = true;
  showAuthView("signin");
}

/* ------------------------------------------------------------------ profile */

/** The name to greet somebody by: what they chose, else the address they signed in with. */
const displayName = (user) => (user && (user.displayName || user.email)) || "";

/** The bar above the tabs: who is signed in, at which level, how, and whether verified. */
function renderIdentity() {
  const user = state.user;
  if (!user) return;
  $("app-who").textContent = displayName(user);
  $("app-level").textContent = T(state.level === LM_LEVEL.PRO ? "acc_pro_t" : "acc_liczmat_t");
  $("app-provider").textContent = hasPasswordProvider(user)
    ? T("app_provider_password") : T("app_provider_google");
  $("app-verified").textContent = user.emailVerified ? T("app_verified") : T("app_unverified");
  $("app-verified").classList.toggle("warn", !user.emailVerified);
  $("app-verify-row").hidden = user.emailVerified;
}

/** A stored millisecond timestamp as a date in the page's language, or a dash. */
function whenText(millis) {
  if (!millis) return "—";
  const date = new Date(Number(millis));
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(document.documentElement.lang || "pl",
    { dateStyle: "medium" }).format(date);
}

/** The Profil tab: the facts, the name, the level and how the session is kept. */
function renderProfile() {
  const user = state.user;
  if (!user) return;
  const profile = state.profile || {};

  $("prof-email").textContent = user.email || "—";
  $("prof-provider").textContent = hasPasswordProvider(user)
    ? T("app_provider_password") : T("app_provider_google");
  $("prof-created").textContent = whenText(profile.createdAt);
  $("prof-seen").textContent = whenText(profile.lastSeenAt);
  if (document.activeElement !== $("prof-name")) $("prof-name").value = user.displayName || "";

  // Mark the level the visitor is on, in the copy of the cards inside this tab.
  document.querySelectorAll("#panel-profile [data-levels] .lvl-card").forEach((card) => {
    const here = card.dataset.level === state.level;
    card.toggleAttribute("data-current", here);
    card.querySelector(".lvl-badge").hidden = !here;
  });

  const remember = lmReadRemember();
  $("prof-remember").checked = remember;
  $("prof-session-state").textContent = T(remember ? "prof_session_kept" : "prof_session_tab");
}

/** The way back to wherever the sign-up prompt was clicked, if there was one. */
function renderNext() {
  const next = lmSafeNext(new URLSearchParams(location.search).get("next"));
  if (!next) return;
  $("app-next-link").href = next;
  $("app-next").hidden = false;
}

function wireProfilePanel() {
  $("name-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    submitting(form, async () => {
      // displayName is a Firebase Auth field, not a Firestore one: the rules allow
      // nothing but lastSeenAt and appVersion in users/{uid}, and this needs no rules.
      await fb.updateProfile(auth.currentUser, { displayName: $("prof-name").value.trim().slice(0, 60) });
      renderIdentity();
      status(T("prof_name_saved"));
    });
  });

  // Changing the answer after signing in migrates the session Firebase already has.
  $("prof-remember").addEventListener("change", async (e) => {
    await applyPersistence(e.target.checked);
    document.querySelectorAll("[data-remember]").forEach((box) => { box.checked = e.target.checked; });
    $("prof-session-state").textContent = T(e.target.checked ? "prof_session_kept" : "prof_session_tab");
  });
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
      // A snapshot arrives whenever anything changes, including a moment after a save.
      // It may report that the data came from the cache; it may not clear a message
      // somebody else put there — "Nazwa zapisana." used to vanish this way.
      if (snap.metadata.fromCache) status(T("app_offline"));
      else if ($("app-status").textContent === T("app_offline")) status("");
    },
    (err) => {
      // Firestore pushes permission-denied into every live listener the moment the user
      // stops being that user. Signing out and deleting the account both do that on
      // purpose, and stopListening() gets ahead of it — this is the belt to that
      // braces, so a straggler cannot land on top of "Konto usunięte."
      if (!state.uid || (err && err.code === "permission-denied")) return;
      status(T("app_err_unknown"), true);
    },
  );
  state.unsub.push(unsub);
}

/** Drop the snapshot listeners. Anything that ends the session calls this first. */
function stopListening() {
  state.unsub.forEach((fn) => fn());
  state.unsub = [];
}

/* ------------------------------------------------------------------ tabs */

/**
 * Five tabs, driven by the mouse and by the keyboard.
 *
 * `role="tablist"` promises arrow-key navigation and one stop in the tab order for the
 * whole strip; a screen reader announces it either way, so the promise has to be kept.
 * Only the selected tab is reachable with Tab, and the arrows move between them.
 */
function wireTabs() {
  const tabs = Array.from(document.querySelectorAll(".app-tab"));

  const select = (btn, focus) => {
    tabs.forEach((b) => {
      const on = b === btn;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== btn.dataset.tab;
    });
    if (focus) btn.focus();
    if (btn.dataset.tab === "sync") renderLocalSummary();
    if (btn.dataset.tab === "profile") renderProfile();
  };

  tabs.forEach((btn, index) => {
    btn.addEventListener("click", () => select(btn));
    btn.addEventListener("keydown", (e) => {
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (step) select(tabs[(index + step + tabs.length) % tabs.length], true);
      else if (e.key === "Home") select(tabs[0], true);
      else if (e.key === "End") select(tabs[tabs.length - 1], true);
      else return;
      e.preventDefault();
    });
  });
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

/**
 * Tombstone, not removal — the phone has to learn the row is gone (FIRESTORE_SYNC §4).
 *
 * Merged, for the same reason the sync push is: this browser writes the contract's fields
 * and a document may carry others it has never heard of — a material's note, a room's
 * project. A plain `setDoc` would erase them while marking the row deleted, and an undo on
 * another device would then bring back a row with its links stripped. Every tombstone in
 * `CloudSync.kt` is a merge too.
 */
async function tombstone(ref, row, fields) {
  await fb.setDoc(ref, { ...fields, ...syncFields(row.createdAt || Date.now(), Date.now()) },
    { merge: true });
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
    `${alive(local.rooms)} × ${T("app_rooms")}, ${alive(local.estimations)} × ${T("ws_lines")}, ` +
    `${alive(local.shoppingItems)} × ${T("proj_mat_t")}`;
}

function wireSyncPanel() {
  const push = $("app-sync-push");
  const pull = $("app-sync-pull");
  if (!push || !pull || typeof wsExport !== "function") return;

  // Every push is a merge, exactly as `CloudSync.pushLocal()` on Android is
  // (`set(..., SetOptions.merge())`). The browser always sends the complete contract
  // document, so for the fields it knows about a merge and a replace are the same write —
  // but a replace would also delete any field the browser has never heard of, which is
  // precisely how the phone protects the note of chapter XVI and would have been how the
  // browser destroyed it. Symmetry here is the point.
  const MERGE = { merge: true };

  push.addEventListener("click", async () => {
    push.disabled = true;
    try {
      const local = wsExport();
      for (const p of local.projects) {
        await fb.setDoc(projectDoc(p.id), {
          name: String(p.name).slice(0, 120),
          archived: !!p.archived,
          ...syncFields(p.createdAt, p.deletedAt),
        }, MERGE);
      }
      for (const r of local.rooms) {
        // `projectId` is chapter XVIII's "pomieszczenia są elementem projektu" and is not
        // in the contract: `RoomEntity` has no column, `roomToDoc()` no key, `validRoom()`
        // no check. It goes up anyway for the reason session 18 established and session 20
        // re-checked for rooms — every write on both sides is a merge, the rules validate
        // by shape with no `hasOnly`, and `roomFromDoc()` ignores keys it does not know —
        // so the phone carries the link without being able to show it. Omitting it here is
        // what made the link die at the browser's edge until now.
        await fb.setDoc(roomDoc(r.id), {
          name: String(r.name).slice(0, 120),
          lengthM: num(r.lengthM), widthM: num(r.widthM), heightM: num(r.heightM),
          projectId: r.projectId || null,
          ...syncFields(r.createdAt, r.deletedAt),
        }, MERGE);
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
        }, MERGE);
      }
      for (const s of local.shoppingItems) {
        // The material list, the project's other subcollection (FIRESTORE_SYNC §2). The
        // pull has always read it — downloadAccount() has returned shoppingItems since the
        // sync tab was written — but nothing local ever produced one until session 17, so
        // the push had nothing to send. Every field is clamped to what the deployed rules
        // validate; `estimationId` is the remote id of the calculation, or null.
        const ref = fb.doc(db, "users", state.uid, "projects", s.projectId, "shoppingItems", s.id);
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
      // Nothing may be listening to documents that are about to stop existing.
      stopListening();
      await deleteEverything();
      await fb.deleteUser(auth.currentUser);
      status(T("app_deleted"));
    } catch (err) {
      const code = err && err.code;
      // Firestore refusing the delete is not the visitor getting something wrong, and
      // "Coś poszło nie tak. Spróbuj ponownie." would ask them to keep trying something
      // that cannot work. Say what happened and that their data is still there.
      status(code === "permission-denied" ? T("app_err_delete_denied") : authMessage(code), true);
      // The listeners were dropped a moment ago; a refused deletion means the account is
      // still there and still wants its lists.
      if (state.uid) {
        listen("projects", (rows) => { state.projects = rows; renderProjects(); });
        listen("rooms", (rows) => { state.rooms = rows; renderRooms(); });
      }
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

  // The profile document goes FIRST, and not because Firestore cares about the order.
  // It is the one delete the rules have ever refused: `allow delete: if false` until
  // 2026-08-08, and the deployed rules still answered PERMISSION_DENIED when this was
  // measured on 2026-08-13. Attempting it last meant a visitor whose deletion was going
  // to be refused first lost every project, room and estimate and *then* got told
  // "something went wrong". Attempting it first turns that into "nothing happened, and
  // here is why". The Firebase user still goes last: every rule keys on
  // request.auth.uid, so once it is gone nothing can reach the documents at all
  // (FIRESTORE_SYNC §7). A later step failing leaves the account without its profile
  // document, which the next sign-in writes again.
  await del(fb.doc(db, "users", state.uid));

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
}

document.addEventListener("DOMContentLoaded", () => {
  boot().catch((err) => {
    // Say what happened. boot() wires the panels one after another, so a throw halfway
    // through leaves a page where some buttons answer and others are dead — and with a
    // bare catch that looked exactly like a page that had simply not loaded.
    console.error("LiczMat /app/ did not finish starting:", err);
    status(T("app_err_unknown"), true);
  });
});
