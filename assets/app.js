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

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";
import { createAccountSync, DEVICE_DATA_KEYS, AUTO_PUSH_KEY_PREFIX, FULL_PULL_KEY_PREFIX } from "./account-sync.js";

const $ = (id) => document.getElementById(id);
const T = (key) => (typeof t === "function" ? t(key) : key);

const state = {
  uid: null, user: null, projects: [], rooms: [], unsub: [],
  /** The initialized Firebase app. The admin panel needs it to reach the callable. */
  fbApp: null,
  /** users/{uid} as last read. `plan` in it is what decides LICZMAT vs LICZMAT PRO. */
  profile: null,
  level: LM_LEVEL.GUEST,
};
let db = null, auth = null, fb = null;
let accountSync = null;
/** The account room card whose successful add is being redrawn by Firestore. */
let openAccountRoomProjectId = null;

/** A Pro-page purchase must wait here for Firebase: only /app/ can identify its buyer. */
function payBuyPlan(search) {
  const id = new URLSearchParams(search || "").get("buy");
  return id && LM_PAY.plans.some((plan) => plan.id === id) ? id : null;
}

function payBuyIntent(search, sub, code) {
  const id = payBuyPlan(search);
  return id && sub && sub.state !== "active" && lmPayBuyable(id, code) ? id : null;
}

let payBuyPending = payBuyPlan(typeof location !== "undefined" ? location.search : "");
let payBuyHandled = false;

/*
 * A sign-in, sign-up or reset form submitted before boot() has wired it — the Firebase SDK
 * is still on its way from gstatic — used to be a plain GET: the page reloaded as "/app/?",
 * the `?next=` it came with was gone, and nothing said why. Found 2026-09-30 in a live
 * walkthrough, where typing fast enough beat the import. The submission is held here, from
 * the moment this module runs, and replayed by boot() once the handlers are there.
 */
let authWired = false;
let heldSubmit = null;
document.addEventListener("submit", (e) => {
  if (authWired || !e.target.closest("#app-auth")) return;
  e.preventDefault();
  heldSubmit = e.target;
}, true);

/* ------------------------------------------------------------------ helpers */

/**
 * Popup failures that mean "this browser cannot show a popup", as opposed to "the visitor
 * closed it". Only these are worth retrying as a redirect.
 */
const POPUP_UNAVAILABLE = [
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
];

/** Firebase Auth error codes as keys of the copy the page already carries. */
function authKey(code) {
  switch (code) {
    case "auth/invalid-email": return "app_err_email";
    case "auth/weak-password": return "app_err_password";
    case "auth/email-already-in-use": return "app_err_inuse";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "app_err_credentials";
    case "auth/network-request-failed": return "app_err_network";
    case "auth/requires-recent-login": return "app_err_recent_login";
    case "auth/popup-blocked":
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "app_err_popup";
    case "auth/operation-not-allowed": return "app_err_provider_off";
    default: return "app_err_unknown";
  }
}

const authMessage = (code) => T(authKey(code));

/* A message shown by its dictionary key, so a language that arrives (or is picked) after it
   rewrites it. An error raised while the page loads used to stay in the language the page
   was built in: a German visitor read "Coś poszło nie tak" (2026-10-03). */
let statusShown = null;

function statusKey(key, isError) {
  status(T(key), isError);
  statusShown = { key, isError };
}

document.addEventListener("langchange", () => {
  if (statusShown) statusKey(statusShown.key, statusShown.isError);
});

function status(message, isError) {
  const box = $("app-status");
  if (!box) return;
  statusShown = null;
  box.textContent = message || "";
  box.classList.toggle("err", Boolean(isError));
  box.hidden = !message;
}

/** Wlasna wiadomosc konta, z awaryjnym powrotem do szablonu Firebase. */
async function accountMail(type, data, fallback) {
  try {
    const { getFunctions, httpsCallable } = await import(`${FIREBASE_SDK}/firebase-functions.js`);
    await httpsCallable(getFunctions(state.fbApp, "europe-central2"), "sendAccountMail")({
      type, lang: document.documentElement.lang || "pl", ...data
    });
    return true;
  } catch (err) {
    if (err && err.code === "functions/resource-exhausted") {
      statusKey("app_mail_later", true);
      return false;
    }
    await fallback();
    return true;
  }
}

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
  state.fbApp = app;
  auth = authMod.getAuth(app);
  db = storeMod.getFirestore(app);
  accountSync = createAccountSync({ fb, db, auth, onChange: () => renderLocalSummary() });
  ["workspacechange", "crmchange", "ownmaterialschange"].forEach((name) => {
    document.addEventListener(name, accountSync.armUpSync);
  });

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

  await endClosedBrowserSession();
  authMod.onAuthStateChanged(auth, (user) => (user ? onSignedIn(user) : onSignedOut()));
  wireAuthForms();
  authWired = true;
  if (heldSubmit) {
    const form = heldSubmit;
    heldSubmit = null;
    form.requestSubmit();
  }
  // The browser may be arriving back from the Google redirect the button falls back to when a
  // popup is blocked. Without this call the finished sign-in would be dropped without a word.
  authMod.getRedirectResult(auth).catch((err) => statusKey(authKey(err && err.code), true));
  wireHashPanels();
  wireProfilePanel();
  wireAccountPanel();
  wireSyncPanel();
  renderOverview();

  // The plan panel quotes a price, and a price is in the visitor's currency.
  document.addEventListener("currencychange", renderPlan);

  // The one connectivity signal that needs no waiting. See connectionState() for why
  // only `offline` is treated as evidence and `online` merely re-asks the question.
  window.addEventListener("offline", renderConnection);
  window.addEventListener("online", renderConnection);

  // Everything above renders its text through T(). The language picker on this page
  // swaps the DOM in place instead of navigating, so anything JavaScript wrote has to
  // be written again — before this, switching language left the identity bar, the
  // level, the dates and both lists in the previous one.
  document.addEventListener("langchange", () => {
    if (!state.user) return;
    renderIdentity();
    renderProfile();
    renderPlan();
    renderOverview();
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
 * Firebase keeps the sign-in in browserLocalPersistence either way, shared by every tab.
 * Not remembering it is the session cookie in assets/account.js plus
 * endClosedBrowserSession() below, so it ends with the browser — browserSessionPersistence
 * ended it with the tab, and a second tab signed the first one out (2026-10-02). The
 * checkbox is remembered on the device, so the answer is given once rather than at every
 * sign-in.
 */
async function applyPersistence(remember) {
  lmWriteRemember(remember);
  lmMarkBrowserSession();
  try {
    await fb.setPersistence(auth, fb.browserLocalPersistence);
  } catch (e) {
    // A browser with no storage at all: Firebase falls back to in-memory, which is the
    // stricter of the two anyway. Nothing here should stop somebody signing in.
  }
}

/** A sign-in made before 2026-10-02 with "don't remember", still in this tab's sessionStorage. */
const tabOnlySession = () => {
  try { return Object.keys(sessionStorage).some((key) => key.startsWith("firebase:authUser:")); } catch (e) { return false; }
};

/**
 * Before the page listens to Firebase: a sign-in that asked not to be remembered does not
 * outlive the browser. Asked to be remembered, or the browser still open — nothing to do,
 * except moving an old tab-only session into the shared store so other tabs see it too.
 */
async function endClosedBrowserSession() {
  if (lmReadRemember()) return;
  if (typeof auth.authStateReady === "function") await auth.authStateReady().catch(() => {});
  if (!auth.currentUser) return;
  if (lmBrowserSessionAlive() || tabOnlySession()) {
    await applyPersistence(false);
    return;
  }
  // The session ends with the browser, and so does the account's copy in it (AUDYT3 L2) —
  // but only once it is on the account: an edit that never went out stays rather than
  // being thrown away without anybody being asked.
  await leaveAccountCopy(auth.currentUser.uid, { ask: false });
  await fb.signOut(auth).catch(() => {});
}

/**
 * Take this account's copy out of the browser before signing out (AUDYT3 L2, owner's
 * decision D1 of 2026-10-05: always, "remember me" or not).
 *
 * After "Wyloguj" the clients with their telephone numbers, the projects and the prices
 * used to stay in localStorage, and the next person at the same computer opened
 * /projekty/?id=... and read the project's name. The account holds all of it in Firestore,
 * so the browser's copy goes — after one last push, so nothing typed a moment ago is lost.
 * When that push cannot be made (offline) the visitor is asked; `ask: false` keeps the copy
 * instead. A copy that is not this account's (another account's, or work never claimed) is
 * not ours to delete and is left alone, as it was. Resolves false when the sign-out should
 * not go ahead.
 */
async function leaveAccountCopy(uid, { ask = true } = {}) {
  if (!uid || !accountSync || accountSync.syncAccount() !== uid) return true;
  let pushed = false;
  try {
    let timer = 0;
    await Promise.race([
      accountSync.syncPushAll(uid, accountSync.state.lastAutoPushAt),
      new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 15000); }),
    ]).finally(() => clearTimeout(timer));
    pushed = true;
  } catch (e) { /* offline or refused: decided below */ }
  if (!pushed && (!ask || !confirm(T("app_signout_unsynced")))) return !ask;
  return clearDeviceData();
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
      accountMail("verify", {}, () => fb.sendEmailVerification(cred.user)).catch(() => {});
    });
  });

  $("reset-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    submitting(form, async () => {
      const email = $("reset-email").value.trim();
      if (await accountMail("reset", { email }, () => fb.sendPasswordResetEmail(auth, email))) {
        statusKey("app_reset_sent");
      }
    });
  });

  const googleBtn = $("auth-google");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      status("");
      const provider = new fb.GoogleAuthProvider();
      try {
        await applyPersistence(lmReadRemember());
        await fb.signInWithPopup(auth, provider);
      } catch (err) {
        const code = err && err.code;
        // A blocked popup is not a refused sign-in, it is a browser that will not open a second
        // window — inside an in-app webview there is no second window at all. The redirect flow
        // finishes the same sign-in in this page, and getRedirectResult below picks it up when
        // the browser comes back. A popup the visitor closed themselves is left alone.
        if (POPUP_UNAVAILABLE.includes(code)) {
          try {
            await fb.signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr) {
            status(authMessage(redirectErr && redirectErr.code), true);
            return;
          }
        }
        status(authMessage(code), true);
      }
    });
  }

  const signOut = async () => {
    // The browser's copy of the account goes before the session does: the last push needs
    // the session (see leaveAccountCopy()). Cancelled, nothing changes.
    if (!(await leaveAccountCopy(state.uid))) return;
    // The listeners go first, so a failure here leaves the page half out of the account:
    // it has to say so. Without the catch the click handler rejected into nothing and the
    // screen kept the workspace with no data behind it.
    stopListening();
    try {
      await fb.signOut(auth);
    } catch (err) {
      status(authMessage(err && err.code), true);
      return;
    }
    statusKey("app_signed_out");
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
  const uid = user.uid;
  // onAuthStateChanged fires again for the same account — a token refresh, a profile
  // update, a reload. Running the whole of this a second time would stack a second pair
  // of snapshot listeners on the same two collections and re-read the profile for
  // nothing, so a repeat only redraws what changed.
  if (state.uid === uid) {
    state.user = user;
    renderIdentity();
    renderProfile();
    return;
  }

  // A delayed upload belongs to the account that armed it, never the account arriving now.
  stopListening();

  state.uid = uid;
  accountSync.setUid(uid);
  state.user = user;
  $("app-auth").hidden = true;
  $("app-workspace").hidden = false;
  document.body.classList.add("app-signed-in");

  // A Google account has no password to change, and its e-mail belongs to Google.
  const password = hasPasswordProvider(user);
  $("password-form").hidden = !password;
  $("email-form").hidden = !password;
  $("app-delete-password-field").hidden = !password;
  $("google-note").hidden = password;

  // Profile: create on first sign-in, then only ever touch lastSeenAt/appVersion —
  // the rules reject anything else, and `plan` is server-side only.
  const profile = fb.doc(db, "users", uid);
  const now = Date.now();
  try {
    const snap = await fb.getDoc(profile);
    accountSync.requireSyncUid(uid);
    if (snap.exists()) {
      applyProfile(snap.data());
      await fb.updateDoc(profile, { lastSeenAt: now, appVersion: "web" });
      accountSync.requireSyncUid(uid);
    } else {
      // `lang` once, at creation: the welcome e-mail (functions/ welcomeMail) speaks it.
      applyProfile({ createdAt: now, lastSeenAt: now, appVersion: "web", lang: String(document.documentElement.lang || "pl").slice(0, 5) });
      await fb.setDoc(profile, state.profile);
      accountSync.requireSyncUid(uid);
    }
  } catch (e) {
    if (!accountSync.syncUidActive(uid)) return;
    // A profile write failing must never block the workspace. Without the document the
    // level falls back to LICZMAT, which is what a signed-in account without a plan is.
    applyProfile(state.profile);
  }

  if (!accountSync.syncUidActive(uid)) return;

  // And keep watching it. `plan` is written by the server — a subscription, or the
  // owner's scripts/pro-admin.mjs — so the moment it changes is a moment this page has
  // no other way of hearing about. Reading it once at sign-in meant somebody who had
  // just paid stayed on the free plan until they signed out and back in.
  listenProfile();

  renderIdentity();
  renderProfile();
  if (renderNext()) return;

  listen("projects", (rows, all) => { state.projects = rows; renderOverview(); accountSync.mirrorToLocal({ projects: all }); });
  listen("rooms", (rows, all) => { state.rooms = rows; renderOverview(); accountSync.mirrorToLocal({ rooms: all }); });
  renderLocalSummary();

  // Reconcile Firestore and localStorage quietly on sign-in without blocking the interface.
  accountSync.autoReconcile(uid);

  // Last, and never awaited: an account with the admin claim gets a sixth tab, and the
  // file that draws it is fetched only for that account. Everybody else's /app/ never
  // asks for it. See maybeMountAdmin().
  if (accountSync.syncUidActive(uid)) maybeMountAdmin(user);
}

function onSignedOut() {
  stopListening();
  state.uid = null;
  if (accountSync) accountSync.setUid(null);
  state.user = null;
  state.profile = null;
  state.level = LM_LEVEL.GUEST;
  lmWriteLevel(LM_LEVEL.GUEST);
  state.projects = [];
  state.rooms = [];
  $("app-auth").hidden = false;
  $("app-workspace").hidden = true;
  document.body.classList.remove("app-signed-in");
  unmountAdmin();
  showAuthView("signin");
}

/* ------------------------------------------------------------------ profile */

/**
 * Take a profile document as the truth: keep it, re-derive the level, redraw what says it.
 *
 * The level is chapter II's, derived from the profile the server owns — see lmLevelOf()
 * in assets/account.js — and `lmWriteLevel()` is what tells the other 372 pages, which
 * load no Firebase and read the hint instead.
 *
 * This runs on every snapshot of users/{uid} rather than once at sign-in, so a plan
 * granted while the page is open lands on the screen by itself. That is what makes step 5
 * of the ORDER note in assets/pay.js ("pay once and check the account turns Pro by
 * itself") a thing anybody can check.
 */
function applyProfile(data) {
  state.profile = data || null;
  const level = lmLevelOf(state.user, state.profile);
  const moved = level !== state.level;
  state.level = level;
  lmWriteLevel(level);
  // The identity bar names the level, so it is redrawn only when the level actually
  // moved; the two panels below read the plan's dates, which can change without it.
  if (moved) renderIdentity();
  renderProfile();
  renderPlan();
}

/**
 * Watch users/{uid} for the rest of the session.
 *
 * The rules already let an account read its own profile, so this needs no rules change,
 * no contract change and nothing in the app repo. It writes nothing: `plan`,
 * `planValidUntil` and `planRenews` are server-only, and a browser that could write them
 * would be a browser that could grant itself Pro.
 */
function listenProfile() {
  const unsub = fb.onSnapshot(
    fb.doc(db, "users", state.uid),
    (snap) => { if (snap.exists()) applyProfile(snap.data()); },
    (err) => {
      // Same straggler as listen(): signing out revokes the read mid-flight, and that is
      // not something to put on the screen.
      if (!state.uid || (err && err.code === "permission-denied")) return;
      statusKey("app_err_unknown", true);
    },
  );
  state.unsub.push(unsub);
}

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
  $("app-verify-link").hidden = user.emailVerified;
  $("app-verify-row").hidden = user.emailVerified;
}

/** A stored millisecond timestamp as a date in the page's language, or a dash. */
function whenText(millis) {
  if (!millis) return "";
  const date = new Date(Number(millis));
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(document.documentElement.lang || "pl",
    { dateStyle: "medium" }).format(date);
}

/** The Profil tab: the facts, the name, the level and how the session is kept. */
function renderProfile() {
  const user = state.user;
  if (!user) return;
  const profile = state.profile || {};

  $("prof-email").textContent = user.email || "";
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

/**
 * The LiczMat Pro tab: where this account's plan stands, and where it is bought.
 *
 * Session 21 wrote the plan card; session 28 gave it the other four states and the
 * checkout. Everything about the plan comes out of `users/{uid}` — `plan`,
 * `planValidUntil` and `planRenews`, all of which the deployed rules let a client read
 * and never write (FIRESTORE_SYNC §2). A browser cannot promote itself by editing
 * anything on this page.
 *
 * lmSubscription() is in assets/plan.js and calls lmLevelOf() rather than re-deriving the
 * level: an expired Pro plan is LICZMAT again everywhere or nowhere.
 *
 * **This is the only place on the site that offers to take money.** The checkout URL
 * needs the uid — a Payment Link without `client_reference_id` buys a plan for nobody —
 * and this is the only page that has one. It stays hidden until assets/pay.js carries a
 * real Payment Link, so the button cannot appear before paying can actually grant Pro.
 */
function renderPlan() {
  if (!state.user || typeof lmSubscription !== "function") return;
  const sub = lmSubscription(state.user, state.profile);
  const pro = sub.level === LM_LEVEL.PRO;

  const planName = { trial: "plan_trial", free: "plan_free" }[sub.state] || (pro ? "plan_pro" : "plan_free");
  $("plan-name").textContent = T(planName);
  $("plan-name").classList.toggle("warn", sub.state === "expired");

  /* The date, worded by what it means rather than by what it is. The same instant reads
     "renews on" for a running subscription and "Pro until" for a cancelled one, and
     saying "valid until" for both would hide the only difference that matters. */
  const dateLabel = {
    active: "plan_renews",
    trial: "plan_trial_until",
    cancelled: "plan_cancelled",
    expired: "plan_until",
  };
  $("plan-until").textContent = sub.validUntil && dateLabel[sub.state]
    ? `${T(dateLabel[sub.state])}: ${whenText(sub.validUntil)}` : "";

  // Why the account is on the plan it is on. A cancelled subscription is the one state
  // that has to say what happens next, because nothing else on the page would. A trial is
  // the second: Pro that nobody paid for reads as a mistake unless the page says otherwise.
  const note = {
    active: "plan_active_d",
    trial: "plan_trial_d",
    cancelled: "plan_cancel_d",
    expired: "plan_expired",
    free: "plan_none",
  }[sub.state] || "plan_none";
  $("plan-note").textContent = T(note);
  $("plan-note").classList.toggle("warn", sub.state === "expired");

  /* Paid, and the plan has not arrived. The line goes away by itself: this runs again on
     every profile snapshot (listenProfile), so the moment the webhook writes the plan the
     account stops being pending. An account that already reads as Pro never sees it. */
  const pending = $("plan-pending");
  if (pending) {
    const waiting = sub.level !== LM_LEVEL.PRO && payPendingActive();
    pending.hidden = !waiting;
    if (!waiting && sub.level === LM_LEVEL.PRO) payPendingClear();
  }

  /* Managing and cancelling are Stripe's own screens. The link is only offered to an
     account that has something to manage — showing it to a free account would send them
     to a portal with no subscription in it. A trial is in that same position: Pro, and
     nothing behind it at Stripe, so "trial" is deliberately absent from this list. */
  const portal = typeof lmPortalUrl === "function" ? lmPortalUrl() : null;
  const manage = sub.state === "active" || sub.state === "cancelled";
  $("plan-manage").hidden = !(manage && portal);
  if (manage && portal) $("plan-manage-link").href = portal;

  renderPlanPrices(sub);
  consumePayBuy(sub);
}

function consumePayBuy(sub) {
  if (!payBuyPending) return;
  const id = payBuyPending;
  payBuyPending = null;
  payBuyHandled = true;

  const url = new URL(location.href);
  url.searchParams.delete("buy");
  history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);

  // Somebody who already pays clicked "Wykup": say the subscription is running rather than nothing.
  if (sub.state === "active") { statusKey("plan_active_d"); return; }
  const code = typeof lmCurrency === "function" ? lmCurrency() : "PLN";
  if (payBuyIntent(`?buy=${encodeURIComponent(id)}`, sub, code)) {
    goToCheckout(id);
  } else {
    statusKey("pay_soon", true);
  }
}

/**
 * The two plans and the checkout button, for an account that does not have Pro.
 *
 * Hidden entirely for somebody who already pays: quoting a price to an existing
 * subscriber is asking them to buy what they own. A cancelled subscription still sees it,
 * because re-subscribing is exactly what that account might want to do. So does a trial,
 * and for the stronger reason: the fourteen days are the whole window in which somebody
 * who has seen what Pro does can decide to keep it.
 *
 * The amounts come from assets/pay.js in the visitor's currency and are never converted;
 * a currency with no configured amount hides that plan rather than guessing one.
 */
function renderPlanPrices(sub) {
  const box = $("plan-buy");
  if (!box || typeof lmPayPrice !== "function") return;
  box.hidden = sub.state === "active";

  const code = typeof lmCurrency === "function" ? lmCurrency() : "PLN";
  let chosen = false;
  box.querySelectorAll("[data-pw-plan]").forEach((card) => {
    const id = card.getAttribute("data-pw-plan");
    const minor = lmPayPrice(id, code);
    card.hidden = minor === null;
    if (minor === null) return;
    const buyable = lmPayBuyable(id, code);
    if (buyable) chosen = true;
    const out = card.querySelector("[data-pw-price]");
    if (out) out.textContent = lmMoneyMinor(minor, code);
    const btn = card.querySelector("[data-pw-checkout]");
    if (btn) {
      btn.hidden = !buyable;
      btn.onclick = buyable ? () => goToCheckout(id) : null;
    }
  });

  /* One of two endings, never both: the checkout, or the sentence that there is not one
     yet. `chosen` is null whenever no plan has a Payment Link, which is the state the
     site ships in — see the ORDER note in assets/pay.js. */
  const buy = box.querySelector("[data-pw-buy]");
  const soon = box.querySelector("[data-pw-soon]");
  if (buy) buy.hidden = !chosen;
  if (soon) soon.hidden = Boolean(chosen);
}

/**
 * Leave for Stripe.
 *
 * The ticket is what the webhook matches the payment back to the account with. It is
 * minted in the cloud, by `payTicket`, for whoever the ID token says is asking — the page
 * cannot make one and does not know the secret, which is the whole point: the uid used to
 * ride in the URL in plain sight, where anybody could retype it into somebody else's
 * (the 2026-09 audit's M1).
 *
 * A checkout without a ticket still goes through. Stripe knows the address that paid, and
 * the webhook falls back to it — that is how a payment has always been attributed when
 * `client_reference_id` was missing. Refusing to sell over a missing ticket would turn a
 * deploy without the secret into a shop that takes no money at all.
 */
/**
 * True from the first click until the browser actually leaves for Stripe.
 *
 * Minting the ticket is a round trip to the cloud, and the button stays live for the whole
 * of it: two clicks used to mean two payTicket() calls, and the second ticket could be the
 * one the webhook never sees. The flag is let go again only when there is nothing to leave
 * for, because after location.href this page is on its way out.
 */
var payLeaving = false;

async function goToCheckout(planId) {
  if (payLeaving) return;
  payLeaving = true;
  document.querySelectorAll("[data-pw-checkout]").forEach((button) => { button.disabled = true; });
  const url = lmCheckoutUrl(planId, {
    ref: await payTicket(),
    email: state.user && state.user.email,
  });
  if (!url) {
    payLeaving = false;
    document.querySelectorAll("[data-pw-checkout]").forEach((button) => { button.disabled = false; });
    statusKey("pay_soon", true);
    return;
  }
  payPendingSet();
  location.href = url;
}

/* Back from Stripe's page can bring this one back from the browser's page cache, frozen
   the way it was left: the flag up and both buttons disabled, so nothing could be bought
   without a reload. A page restored that way is a page somebody is looking at again. */
if (typeof window !== "undefined" && typeof window.addEventListener === "function") window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  payLeaving = false;
  document.querySelectorAll("[data-pw-checkout]").forEach((button) => { button.disabled = false; });
});

/* ------------------------------------------------------------------ payment in flight */

/**
 * "Paid, and the plan is not here yet" — remembered across the trip to Stripe and back.
 *
 * Stripe does not promise the order of its events, and on 2026-09-11 it proved it:
 * `customer.subscription.created` arrived before `checkout.session.completed`, so the
 * webhook had nothing to attach the payment to, answered 503 and asked to be retried.
 * Correct, and invisible to the person who had just paid — their account looked free.
 *
 * The mark is set on the way out (not on the way back), because that is the only moment
 * this page is certain about: Stripe's confirmation page is Stripe's, and nothing
 * guarantees the visitor ever returns to /app/ through it.
 *
 * Thirty minutes, then it expires by itself. A payment that has not landed in half an
 * hour has not landed, and a line saying "in progress" forever is worse than no line:
 * the account page would be lying on every visit to somebody who never paid at all.
 *
 * localStorage, like the session hint in assets/account.js, and for the same reason: it
 * is a note to the interface, never a permission. The plan still comes from Firestore.
 */
var PAY_PENDING_KEY = "liczmat-pay-pending";
var PAY_PENDING_MS = 30 * 60 * 1000;

function payPendingSet() {
  try { localStorage.setItem(PAY_PENDING_KEY, String(Date.now())); } catch (e) { /* prywatne okno */ }
}

function payPendingClear() {
  try { localStorage.removeItem(PAY_PENDING_KEY); } catch (e) { /* jw. */ }
}

/** Is a payment still worth waiting for? Expired and absent are the same answer: no. */
function payPendingActive(now) {
  let raw = null;
  try { raw = localStorage.getItem(PAY_PENDING_KEY); } catch (e) { return false; }
  const at = Number(raw);
  if (!raw || !Number.isFinite(at)) return false;
  if ((now === undefined ? Date.now() : now) - at > PAY_PENDING_MS) { payPendingClear(); return false; }
  return true;
}

/**
 * The signed ticket for this account, or null when the cloud has none to give.
 *
 * Null on every failure — not signed in, secret not set on the deployment, the call did
 * not go through — because every one of them ends the same way: check out without a
 * ticket and let the address do the attributing. A payment page is the wrong place to
 * explain a missing server secret.
 */
async function payTicket() {
  if (!state.user || !state.fbApp) return null;
  try {
    const { getFunctions, httpsCallable } = await import(`${FIREBASE_SDK}/firebase-functions.js`);
    // The same region the functions are deployed to (assets/admin.js says it too, for the
    // other callable). Firestore is in europe-central2 and so is everything beside it.
    const res = await httpsCallable(getFunctions(state.fbApp, "europe-central2"), "payTicket")();
    const ticket = res && res.data && res.data.ticket;
    return typeof ticket === "string" && ticket ? ticket : null;
  } catch (e) {
    return null;
  }
}

/** The page the sign-in or sign-up prompt was clicked on, if it is not this one. */
function nextTarget() {
  const next = lmSafeNext(new URLSearchParams(location.search).get("next"));
  if (!next) return "";
  return new URL(next, location.origin).pathname === location.pathname ? "" : next;
}

/**
 * The way back to wherever the sign-up prompt was clicked, if there was one.
 *
 * 2026-09-30: it is taken by itself. Signing in from "Zaloguj się" on a calculator or an
 * account page used to leave the visitor on Moje konto with a button to click; now the
 * page goes back as soon as the account's level is known — the pages switch on the hint
 * applyProfile() has just written. Returns true when it is leaving, so the caller starts
 * nothing that the navigation would cut off; the page it returns to syncs by itself.
 *
 * Except when this browser holds data whose owner has to be decided — another account's
 * copy, or work saved before signing in. The guest card promised that question, so the
 * visitor stays here with Synchronizacja open and the choice in front of them, the button
 * still offers the way back, and answering takes them back (see wireSyncPanel()).
 */
function renderNext() {
  const next = nextTarget();
  if (!next) return false;
  if (payBuyHandled) return false;
  $("app-next-link").href = next;
  $("app-next").hidden = false;
  if (accountSync.blockedWorkspace()) {
    if (location.hash !== "#synchronizacja") location.hash = "#synchronizacja";
    return false;
  }
  location.replace(next);
  return true;
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
      statusKey("prof_name_saved");
    });
  });

  // Changing the answer after signing in migrates the session Firebase already has.
  $("prof-remember").addEventListener("change", async (e) => {
    await applyPersistence(e.target.checked);
    document.querySelectorAll("[data-remember]").forEach((box) => { box.checked = e.target.checked; });
    $("prof-session-state").textContent = T(e.target.checked ? "prof_session_kept" : "prof_session_tab");
  });
}

/* ------------------------------------------------------- is there a connection */

/**
 * How long a listener may be reading from the cache before the page calls it "no network".
 *
 * `metadata.fromCache` answers "this snapshot did not come from the server", which is
 * true in three different situations and only one of them is a dropped connection: the
 * moment a listener is attached and has not synced yet, the moment after a local write
 * and before the server acknowledges it, and an actual outage. Announcing the first two
 * is the false "Brak sieci" this session exists to remove.
 *
 * The number is not invented: the Firestore SDK gives its own backend exactly this long
 * before it logs "Backend didn't respond within 10 seconds" and switches the client to
 * offline mode (`online_state_timeout`, firebase-firestore.js 10.14.1). Calling the
 * connection down sooner than the library that owns it would be a guess.
 */
const OFFLINE_AFTER_MS = 10000;

/**
 * What each live listener last said about where its data came from, plus the delay.
 *
 * One line for the whole page rather than one per collection: projects and rooms sit on
 * the same connection, so a listener that is reading from the server is proof the
 * connection is up whatever the other one says.
 */
const conn = { synced: new Map(), timer: null, waited: false };

/** "quiet" (nothing is listening), "offline", "unsynced" or "online". */
function connectionState() {
  // Signed out, or the listeners have been dropped: nothing is queued, so there is
  // nothing to promise about a returning connection.
  if (!conn.synced.size) return "quiet";
  // The browser's own answer is trusted in one direction only. `false` means there is no
  // connection at all and is worth saying at once; `true` is not evidence of anything —
  // a laptop on a hotel Wi-Fi with no internet behind it also says `true`, which is what
  // the delay below is for.
  if (navigator.onLine === false) return "offline";
  for (const synced of conn.synced.values()) if (synced) return "online";
  return "unsynced";
}

/** Show the notice, or take it down. The wording is in the markup, keyed for langchange. */
function renderConnection() {
  const box = $("app-offline");
  if (!box) return;
  const now = connectionState();

  if (now === "unsynced") {
    // Armed once on the way into "unsynced" rather than on every snapshot: a listener
    // that keeps reporting the cache must not keep pushing the deadline out.
    if (!conn.waited && !conn.timer) {
      conn.timer = setTimeout(() => {
        conn.timer = null;
        conn.waited = true;
        renderConnection();
      }, OFFLINE_AFTER_MS);
    }
  } else {
    if (conn.timer) clearTimeout(conn.timer);
    conn.timer = null;
    conn.waited = false;
  }

  box.hidden = !(now === "offline" || (now === "unsynced" && conn.waited));
}

/** One listener reporting where its snapshot came from. */
function connectionSaw(collectionName, snap) {
  conn.synced.set(collectionName, !snap.metadata.fromCache);
  renderConnection();
}

/** Live list of one collection, tombstones filtered out, newest change first. */
function listen(collectionName, onRows) {
  const ref = fb.collection(db, "users", state.uid, collectionName);
  let seen = false;
  const unsub = fb.onSnapshot(
    fb.query(ref, fb.orderBy("updatedAt", "desc")),
    // Without this option the SDK delivers no event at all when the only thing that
    // changed is where the data came from: `ia()` in firebase-firestore.js 10.14.1
    // raises a snapshot carrying no document changes only when includeMetadataChanges
    // is true. That is what made this page say "Brak sieci" and never take it back —
    // the first snapshot comes out of the cache, and the server answering with the same
    // documents changes nothing but the metadata. It is also why a connection that
    // actually dropped was never announced. See connectionSaw().
    { includeMetadataChanges: true },
    (snap) => {
      connectionSaw(collectionName, snap);
      // The option above also delivers snapshots whose documents did not change, and
      // redrawing on one of those would take the caret out of the "add a room" field
      // somebody is typing in. docChanges() with its own default drops the metadata-only
      // entries, so this is "did a document really change" — plus the first snapshot,
      // which has to draw the empty list even when there is nothing in it.
      if (!seen || snap.docChanges().length) {
        seen = true;
        const rows = [], all = [];
        snap.forEach((d) => {
          const data = d.data();
          const doc = { id: d.id, ...data };
          all.push(doc);
          if (!data.deletedAt) rows.push(doc);
        });
        accountSync.sawRemote(collectionName, all);
        onRows(rows, all);
      }
    },
    (err) => {
      // Firestore pushes permission-denied into every live listener the moment the user
      // stops being that user. Signing out and deleting the account both do that on
      // purpose, and stopListening() gets ahead of it — this is the belt to that
      // braces, so a straggler cannot land on top of "Konto usunięte."
      if (!state.uid || (err && err.code === "permission-denied")) return;
      statusKey("app_err_unknown", true);
    },
  );
  state.unsub.push(unsub);
}

/** Drop the snapshot listeners. Anything that ends the session calls this first. */
function stopListening() {
  state.unsub.forEach((fn) => fn());
  state.unsub = [];
  // What the listeners saw belongs to the account they were listening to.
  if (accountSync) accountSync.clearRemoteStamps();
  // Nothing is listening any more, so nothing is waiting to go out: the notice comes
  // down with the listeners rather than staying on the sign-in screen.
  conn.synced.clear();
  renderConnection();
}

/* ------------------------------------------------------------------ hash panels */

/** The account settings remain on /app/; every work tool is a normal page link. */
function wireHashPanels() {
  const routes = { "#profil": "profile", "#synchronizacja": "sync", "#pro": "pro", "#konto": "account" };
  const show = () => {
    const id = location.hash === "#admin" && document.getElementById("panel-admin") ? "admin" : (routes[location.hash] || "overview");
    document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== id; });
    document.querySelectorAll(".app-nav-item[aria-current]").forEach((link) => link.removeAttribute("aria-current"));
    const suffix = id === "overview" ? "#przeglad" : location.hash;
    const link = Array.from(document.querySelectorAll(".app-nav-item")).find((item) => item.getAttribute("href").endsWith(suffix));
    if (link) link.setAttribute("aria-current", "page");
    if (id === "overview") renderOverview();
    if (id === "sync") renderLocalSummary();
    if (id === "profile") renderProfile();
    if (id === "pro") renderPlan();
  };
  window.addEventListener("hashchange", show);
  $("app-verify-link").addEventListener("click", (event) => {
    event.preventDefault();
    location.hash = "#konto";
    requestAnimationFrame(() => $("app-verify-row").scrollIntoView({ block: "nearest" }));
  });
  show();
}

/* ------------------------------------------------------------------ the admin panel */

/**
 * The claim that opens the admin panel — session 49.
 *
 * Three copies of this word: here, `ADMIN_CLAIM` in functions/admin-map.mjs (which is what
 * actually decides) and `ADMIN_CLAIM` in scripts/pro-admin.mjs (which is what writes it).
 * scripts/test-admin-map.mjs §1 reads all three and compares them; a divergence here is a
 * panel that never appears for anybody.
 */
const ADMIN_CLAIM = "admin";

/**
 * Fetch and mount the admin panel, for the one account that has the claim.
 *
 * The token is read fresh (`getIdTokenResult(true)`) rather than out of the cached one: a
 * claim granted by `scripts/pro-admin.mjs` while the account was signed in is not in the
 * token this browser is holding, and waiting for that token to expire is up to an hour of
 * "the panel is not there" for something that did work.
 *
 * Nothing about this is a lock. The panel shows for whoever the token says, and every
 * button in it goes to a function that checks the same claim on the server side, where the
 * signature is verified. Editing this value in a debugger buys a form that answers
 * `permission-denied`.
 */
/**
 * Take the admin panel back out on sign-out.
 *
 * Signing in as somebody else in the same tab does not reload the page, so a tab left
 * standing would offer the next account a panel their token does not open — a form that
 * answers `permission-denied` to every click, and a claim about them that is not true.
 * Removing it also means `mountAdmin()` runs cleanly for the next admin who signs in.
 */
function unmountAdmin() {
  const tab = document.getElementById("tab-admin");
  const panel = document.getElementById("panel-admin");
  const wasOpen = location.hash === "#admin";
  if (tab) tab.remove();
  if (panel) panel.remove();
  if (wasOpen) location.hash = "przeglad";
}

async function maybeMountAdmin(user) {
  try {
    const token = await user.getIdTokenResult(true);
    if (!token || !token.claims || token.claims[ADMIN_CLAIM] !== true) return;
    const mod = await import("./admin.js");
    await mod.mountAdmin({ app: state.fbApp });
  } catch (e) {
    // No claim, no network, or the module failed to load: /app/ is unaffected. The panel
    // is a tool for one person and must never be able to break the page for everybody.
  }
}


/** A stored "YYYY-MM-DD" in the visitor's own wording — the same reckoning calDay() in
 *  assets/schedule-ui.js uses, kept local here since that file is not loaded on /app/. */
function fmtDay(day) {
  if (!day) return "";
  const d = new Date(`${day}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(document.documentElement.lang || "pl", { day: "numeric", month: "short" });
}

/**
 * The four stroke paths the Przegląd tiles need, on the same 24x24 grid as NAV_ICON in
 * src/app-pages.mjs. They are copied rather than imported because this file is a plain
 * browser script and that map is build-time: four short strings are cheaper than a new
 * module boundary. Change a shape in the sidebar and it has to change here too.
 */
const STAT_ICON = {
  projects: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  clients: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/><path d="M16.2 4.6a3.4 3.4 0 0 1 0 6.6M20 20c0-3-1.9-5.3-4.6-6"/>',
  schedule: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  rooms: '<path d="M4 10 12 3l8 7"/><path d="M6 9v11h12V9"/><path d="M10 20v-6h4v6"/>',
};

/** One Przegląd tile: the icon, the figure, and what the figure counts, in a row. */
function statCard(id, value, label) {
  return `<div class="app-stat-card">
      <svg class="ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STAT_ICON[id] || ""}</svg>
      <div class="app-stat-body"><div class="val">${value}</div><div class="lbl">${label}</div></div>
    </div>`;
}

/** Przegląd: today's figures and the three short lists under them. */
function renderOverview() {
  const stats = $("overview-stats");
  if (stats) {
    const activeProjects = state.projects.filter((p) => !p.archived);
    const sched = typeof crmSchedule === "function" ? crmSchedule() : null;
    const dueSoon = sched ? sched.counts.late + sched.counts.today + sched.counts.soon : 0;
    const clientsCount = typeof crmClients === "function" ? crmClients().length : 0;
    stats.innerHTML = [
      statCard("projects", activeProjects.length, T("app_stat_projects")),
      statCard("clients", clientsCount, T("app_stat_clients")),
      statCard("schedule", dueSoon, T("app_stat_schedule")),
      statCard("rooms", state.rooms.length, T("app_rooms_title")),
    ].join("");
  }

  const projList = $("overview-projects");
  if (projList) {
    const top = state.projects.filter((p) => !p.archived).slice(0, 5);
    projList.innerHTML = top.length
      ? top.map((p) => `<li><span class="row-name">${escapeHtml(p.name)}</span></li>`).join("")
      : `<li class="empty muted">${T("app_empty_projects")}</li>`;
  }

  const schedList = $("overview-schedule");
  if (schedList) {
    const sched = typeof crmSchedule === "function" ? crmSchedule() : null;
    const items = sched ? [
      ...sched.buckets.late, ...sched.buckets.today, ...sched.buckets.soon, ...sched.buckets.later,
    ].slice(0, 5) : [];
    // The second line reads like a terminarz row: "client · date", or the date alone.
    schedList.innerHTML = items.length
      ? items.map((j) => {
          const client = j.clientId && typeof crmClient === "function" ? crmClient(j.clientId) : null;
          const who = client ? `${escapeHtml(client.name)} · ` : "";
          return `<li><span class="row-name">${escapeHtml(j.name)}<em class="muted">${who}${fmtDay(j.dueDate)}</em></span></li>`;
        }).join("")
      : `<li class="empty muted">${T("app_schedule_empty_upcoming")}</li>`;
  }

  const matList = $("overview-materials");
  if (matList) {
    const mats = typeof omMaterials === "function" ? omMaterials().slice(0, 5) : [];
    matList.innerHTML = mats.length
      ? mats.map((m) => `<li><span class="row-name">${escapeHtml(m.name)}</span></li>`).join("")
      : `<li class="empty muted">${T("app_materials_empty")}</li>`;
  }
}

/* ------------------------------------------------------------------ sync with the browser */

const blockedWorkspace = () => accountSync.blockedWorkspace();

function clearDeviceData() {
  try {
    DEVICE_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
    if (state.uid) {
      localStorage.removeItem(`${AUTO_PUSH_KEY_PREFIX}${state.uid}`);
      localStorage.removeItem(`${FULL_PULL_KEY_PREFIX}${state.uid}`);
    }
    return true;
  } catch (e) { return false; }
}

/** How much is sitting in this browser's workspace, in one line. */
function renderLocalSummary() {
  const box = $("app-sync-local");
  const counts = accountSync.localCounts();
  if (!box || !counts) return;
  box.textContent = `${T("app_sync_local")}: ${counts.projects} × ${T("app_projects")}, ` +
    `${counts.rooms} × ${T("app_rooms")}, ${counts.estimations} × ${T("ws_lines")}, ` +
    `${counts.shoppingItems} × ${T("proj_mat_t")}`;

  // Both directions are refused while another account's copy is sitting here: a pull
  // would mix two people's rows into one store, and a push would file them under the
  // wrong account. The way out is the button on the settings tab, which empties this
  // browser — said in the warning rather than left to be guessed.
  const foreign = accountSync.foreignWorkspace();
  const unclaimed = accountSync.unclaimedWorkspace();
  const warning = $("app-sync-foreign");
  if (warning) {
    warning.textContent = foreign ? T("app_sync_foreign") : "";
    warning.hidden = !foreign;
  }
  const choice = $("app-sync-unclaimed");
  if (choice) choice.hidden = !unclaimed;
  ["app-sync-push", "app-sync-pull"].forEach((id) => {
    const button = $(id);
    if (button) button.disabled = foreign || unclaimed;
  });
}

function wireSyncPanel() {
  const push = $("app-sync-push");
  const pull = $("app-sync-pull");
  if (!push || !pull || typeof wsExport !== "function") return;

  push.addEventListener("click", async () => {
    // The button is disabled while this is true; the check is here as well because a
    // disabled attribute is a hint to a mouse and nothing more.
    if (accountSync.blockedWorkspace()) { status(T(accountSync.unclaimedWorkspace() ? "app_sync_unclaimed" : "app_sync_foreign"), true); return; }
    const uid = state.uid;
    push.disabled = true;
    accountSync.state.syncBusy++;
    try {
      accountSync.requireSyncUid(uid);
      if (!accountSync.setSyncAccount(uid)) throw new Error("sync stamp failed");
      await accountSync.syncPushAll(uid);
      renderLocalSummary();
      statusKey("app_sync_pushed");
    } catch (err) {
      statusKey("app_err_unknown", true);
    } finally {
      accountSync.state.syncBusy--;
      renderLocalSummary();
    }
  });

  pull.addEventListener("click", async () => {
    if (accountSync.blockedWorkspace()) { status(T(accountSync.unclaimedWorkspace() ? "app_sync_unclaimed" : "app_sync_foreign"), true); return; }
    const uid = state.uid;
    pull.disabled = true;
    accountSync.state.syncBusy++;
    try {
      const ok = await accountSync.syncPullAll(uid);
      renderLocalSummary();
      if (!ok) { statusKey("ws_save_failed", true); return; }
      if (!accountSync.setSyncAccount(uid)) throw new Error("sync stamp failed");
      statusKey("app_sync_pulled");
    } catch (err) {
      statusKey("app_err_unknown", true);
    } finally {
      accountSync.state.syncBusy--;
      renderLocalSummary();
    }
  });

  $("app-sync-claim-mine").addEventListener("click", async () => {
    const uid = state.uid;
    if (!accountSync.unclaimedWorkspace() || !accountSync.setSyncAccount(uid)) {
      statusKey("app_err_unknown", true);
      return;
    }
    renderLocalSummary();
    await accountSync.autoReconcile(uid);
    // The question renderNext() kept the visitor here for is answered.
    if (nextTarget()) location.replace(nextTarget());
  });

  $("app-sync-claim-empty").addEventListener("click", async () => {
    const uid = state.uid;
    // The same question the settings wipe asks, for the same reason: this button throws
    // away everything the browser is holding, and nobody gets it back by clicking again.
    if (!accountSync.unclaimedWorkspace() || !confirm(T("app_wipe_confirm"))) return;
    if (!clearDeviceData()) {
      statusKey("app_err_unknown", true);
      return;
    }
    renderLocalSummary();
    await accountSync.autoReconcile(uid);
    if (nextTarget()) location.replace(nextTarget());
  });
}


/** One document in a flat collection of this account. */
const proDoc = (collection, id, uid = state.uid) => fb.doc(db, "users", uid, collection, id);

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
      if (await accountMail("verify", {}, () => fb.sendEmailVerification(auth.currentUser))) {
        statusKey("app_verify_sent");
      }
    } catch (err) { status(authMessage(err && err.code), true); }
  });

  $("email-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await reauthenticate($("email-password").value);
      const newEmail = $("email-new").value.trim();
      if (await accountMail("change", { newEmail },
        () => fb.verifyBeforeUpdateEmail(auth.currentUser, newEmail))) {
        $("email-password").value = "";
        statusKey("app_email_changed");
      }
    } catch (err) { status(authMessage(err && err.code), true); }
  });

  $("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await reauthenticate($("password-current").value);
      await fb.updatePassword(auth.currentUser, $("password-new").value);
      $("password-current").value = "";
      $("password-new").value = "";
      statusKey("app_password_changed");
    } catch (err) { status(authMessage(err && err.code), true); }
  });

  /**
   * Everything this device is keeping, and nothing it is only remembering (session 35).
   *
   * The four data stores go: the workspace (projects, rooms, saved calculations and the
   * material list), which project was open, the list of calculators this browser has
   * used, and the Pro workspace — clients, jobs and quotes, which is the one store here
   * holding another person's name, telephone number and address. Each is named on
   * /cookies/ with the file that writes it, and scripts/test-security.mjs checks this
   * list against that one.
   *
   * The settings are deliberately left alone: the language, the currency, the theme, the
   * consent answer and "keep me signed in" say nothing about anybody and clearing them
   * would make the page reappear in the wrong language after somebody asked for their
   * data to be cleared. Signing out is a separate button, and stays one.
   */
  $("app-wipe").addEventListener("click", () => {
    if (!confirm(T("app_wipe_confirm"))) return;
    if (!clearDeviceData()) {
      statusKey("app_err_unknown", true);
      return;
    }
    // The workspace is read fresh from localStorage on every call, so the lists redraw
    // themselves once they are told. /app/ draws the account's rows, not the browser's,
    // so the only thing on this page that changes is the sync tab's summary.
    document.dispatchEvent(new CustomEvent("workspacechange"));
    renderLocalSummary();
    statusKey("app_wipe_done");
  });

  async function performExport() {
    try {
      const uid = state.uid;
      const data = await accountSync.downloadAccount(uid);
      // The profile document too (e-mail, plan, dates): the whole account, RODO art. 20.
      const snap = await fb.getDoc(fb.doc(db, "users", uid));
      const profile = snap.exists() ? snap.data() : {};
      const d = new Date();
      const day = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
      const blob = new Blob([JSON.stringify({ ...data, profile, exportedAt: Date.now(), uid }, null, 2)],
        { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liczmat-konto-${day}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { statusKey("app_err_unknown", true); }
  }

  $("app-export").addEventListener("click", performExport);
  $("app-delete-export-btn").addEventListener("click", performExport);
  $("app-delete-export-btn-confirm").addEventListener("click", performExport);

  // Deleting the account is two steps inside the card, the second one offering the data first.
  $("app-delete-account").addEventListener("click", () => {
    $("delete-initial").hidden = true;
    $("delete-confirm").hidden = false;
    $("app-delete-export-btn-confirm").focus();
  });

  const hideConfirm = () => {
    $("delete-confirm").hidden = true;
    $("delete-initial").hidden = false;
  };

  $("app-delete-cancel").addEventListener("click", hideConfirm);
  $("delete-confirm").addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    hideConfirm();
    $("app-delete-account").focus();
  });

  $("app-delete-yes").addEventListener("click", async () => {
    const button = $("app-delete-yes");
    button.disabled = true;
    let stamp = "";
    try {
      await reauthenticate($("delete-password").value);
      // Nothing may be listening to documents that are about to stop existing.
      stopListening();
      // Since 2026-09-26 the account pages sync by themselves, in other tabs too. Taking the
      // stamp away stops them (assets/account-sync-page.js) and makes this browser's copy
      // unclaimed, so no push from any tab writes into the account while it is being emptied.
      stamp = accountSync.syncAccount();
      accountSync.setSyncAccount("");
      await deleteEverything();
      await fb.deleteUser(auth.currentUser);
      statusKey("app_deleted");
    } catch (err) {
      const code = err && err.code;
      // Firestore refusing the delete is not the visitor getting something wrong, and
      // "Coś poszło nie tak. Spróbuj ponownie." would ask them to keep trying something
      // that cannot work. Say what happened and that their data is still there.
      status(code === "permission-denied" ? T("app_err_delete_denied") : authMessage(code), true);
      if (stamp) accountSync.setSyncAccount(stamp);
      // The listeners were dropped a moment ago; a refused deletion means the account is
      // still there and still wants its lists — and its plan, which is the one of the
      // three that nothing else would ever re-attach.
      if (state.uid) {
        listen("projects", (rows) => { state.projects = rows; renderOverview(); });
        listen("rooms", (rows) => { state.rooms = rows; renderOverview(); });
        listenProfile();
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

  // The Pro store (sessions 22–26, jobs until the merge of 2026-09-21) and the own materials
  // (session 59) arrived after this function was written and were never added to it, so a
  // deleted account left its clients — other people's names, telephones and addresses —
  // its quotes and its supplier prices behind, unreachable by anyone. Found 2026-09-26.
  for (const name of ["companies", "clients", "jobs", "quotes", "materials"]) {
    const snap = await fb.getDocs(fb.collection(db, "users", state.uid, name));
    for (const d of snap.docs) await del(d.ref);
  }

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
    statusKey("app_err_unknown", true);
  });
});
