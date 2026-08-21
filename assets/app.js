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

  // The plan panel quotes a price, and a price is in the visitor's currency.
  document.addEventListener("currencychange", renderPlan);

  // Everything above renders its text through T(). The language picker on this page
  // swaps the DOM in place instead of navigating, so anything JavaScript wrote has to
  // be written again — before this, switching language left the identity bar, the
  // level, the dates and both lists in the previous one.
  document.addEventListener("langchange", () => {
    if (!state.user) return;
    renderIdentity();
    renderProfile();
    renderPlan();
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
      applyProfile(snap.data());
      await fb.updateDoc(profile, { lastSeenAt: now, appVersion: "web" });
    } else {
      applyProfile({ createdAt: now, lastSeenAt: now, appVersion: "web" });
      await fb.setDoc(profile, state.profile);
    }
  } catch (e) {
    // A profile write failing must never block the workspace. Without the document the
    // level falls back to LICZMAT, which is what a signed-in account without a plan is.
    applyProfile(state.profile);
  }

  // And keep watching it. `plan` is written by the server — a subscription, or the
  // owner's scripts/pro-admin.mjs — so the moment it changes is a moment this page has
  // no other way of hearing about. Reading it once at sign-in meant somebody who had
  // just paid stayed on the free plan until they signed out and back in.
  listenProfile();

  renderIdentity();
  renderProfile();
  renderNext();

  listen("projects", (rows) => { state.projects = rows; renderProjects(); });
  listen("rooms", (rows) => { state.rooms = rows; renderRooms(); renderProjects(); });
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
      status(T("app_err_unknown"), true);
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

  $("plan-name").textContent = T(pro ? "plan_pro" : "plan_free");
  $("plan-name").classList.toggle("warn", sub.state === "expired");

  /* The date, worded by what it means rather than by what it is. The same instant reads
     "renews on" for a running subscription and "Pro until" for a cancelled one, and
     saying "valid until" for both would hide the only difference that matters. */
  const dateLabel = { active: "plan_renews", cancelled: "plan_cancelled", expired: "plan_until" };
  $("plan-until").textContent = sub.validUntil && dateLabel[sub.state]
    ? `${T(dateLabel[sub.state])}: ${whenText(sub.validUntil)}` : "";

  // Why the account is on the plan it is on. A cancelled subscription is the one state
  // that has to say what happens next, because nothing else on the page would.
  const note = {
    active: "plan_active_d",
    cancelled: "plan_cancel_d",
    expired: "plan_expired",
    free: "plan_none",
  }[sub.state] || "plan_none";
  $("plan-note").textContent = T(note);
  $("plan-note").classList.toggle("warn", sub.state === "expired");

  /* Managing and cancelling are Stripe's own screens. The link is only offered to an
     account that has something to manage — showing it to a free account would send them
     to a portal with no subscription in it. */
  const portal = typeof lmPortalUrl === "function" ? lmPortalUrl() : null;
  const manage = sub.state === "active" || sub.state === "cancelled";
  $("plan-manage").hidden = !(manage && portal);
  if (manage && portal) $("plan-manage-link").href = portal;

  renderPlanPrices(sub);
}

/**
 * The two plans and the checkout button, for an account that does not have Pro.
 *
 * Hidden entirely for somebody who already pays: quoting a price to an existing
 * subscriber is asking them to buy what they own. A cancelled subscription still sees it,
 * because re-subscribing is exactly what that account might want to do.
 *
 * The amounts come from assets/pay.js in the visitor's currency and are never converted;
 * a currency with no configured amount hides that plan rather than guessing one.
 */
function renderPlanPrices(sub) {
  const box = $("plan-buy");
  if (!box || typeof lmPayPrice !== "function") return;
  box.hidden = sub.state === "active";

  const code = typeof lmCurrency === "function" ? lmCurrency() : "PLN";
  let chosen = null;
  box.querySelectorAll("[data-pw-plan]").forEach((card) => {
    const id = card.getAttribute("data-pw-plan");
    const minor = lmPayPrice(id, code);
    card.hidden = minor === null;
    if (minor === null) return;
    if (!chosen && lmPayBuyable(id, code)) chosen = id;
    const out = card.querySelector("[data-pw-price]");
    if (out) out.textContent = lmMoneyMinor(minor, code);
  });

  /* One of two endings, never both: the checkout, or the sentence that there is not one
     yet. `chosen` is null whenever no plan has a Payment Link, which is the state the
     site ships in — see the ORDER note in assets/pay.js. */
  const buy = box.querySelector("[data-pw-buy]");
  const soon = box.querySelector("[data-pw-soon]");
  const btn = box.querySelector("[data-pw-checkout]");
  if (buy) buy.hidden = !chosen;
  if (soon) soon.hidden = Boolean(chosen);
  if (btn) {
    btn.hidden = !chosen;
    btn.textContent = T("pay_buy");
    btn.onclick = chosen ? () => goToCheckout(chosen) : null;
  }
}

/**
 * Leave for Stripe.
 *
 * The uid is what the webhook matches the payment back to the account with, so a checkout
 * without one is a payment that grants nobody anything — lmCheckoutUrl() returns null
 * rather than a half-built URL, and this refuses to navigate instead of sending somebody
 * to a page that cannot help them.
 */
function goToCheckout(planId) {
  const url = lmCheckoutUrl(planId, {
    uid: state.user && state.user.uid,
    email: state.user && state.user.email,
  });
  if (!url) { status(T("pay_soon"), true); return; }
  location.href = url;
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
    if (btn.dataset.tab === "pro") renderPlan();
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

/**
 * `projectId` is chapter XVIII's link and is not in the contract — see the sync push and
 * assets/workspace.js for why it survives anyway. Until the owner reported it after
 * session 20, this function did not write it at all, so a room made on this page belonged
 * to nothing and could never be shown under a project.
 */
async function addRoom(name, lengthM, widthM, heightM, projectId) {
  const now = Date.now();
  await fb.setDoc(roomDoc(newId()), {
    name, lengthM, widthM, heightM, projectId: projectId || null, ...syncFields(now),
  });
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
  list.innerHTML = state.projects.map((p) => `<li data-id="${escapeHtml(p.id)}" class="app-project">
      <span class="row-name">${escapeHtml(p.name)}${p.archived ? ` <em class="muted">(${T("app_archived")})</em>` : ""}</span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-share>${T("app_share")}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-del>${T("app_delete")}</button>
      </span>
      ${roomBlock(p.id)}
    </li>`).join("");
}

/** A number in the visitor's notation. The dimensions are the only numbers on this page. */
const numFmt = (v) => new Intl.NumberFormat(document.documentElement.lang || "pl",
  { maximumFractionDigits: 2 }).format(Number(v) || 0);

/** One room, as a row: the name, the three dimensions and the floor they come to. */
const roomRow = (r) => `<li data-id="${escapeHtml(r.id)}">
      <span class="row-name">${escapeHtml(r.name)}
        <em class="muted">${numFmt(r.lengthM)} × ${numFmt(r.widthM)} × ${numFmt(r.heightM)} m — ${numFmt(r.lengthM * r.widthM)} m²</em>
      </span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-del>${T("app_delete")}</button>
      </span>
    </li>`;

/**
 * The rooms of one project, plus the form that adds another — chapter XVIII's
 * "pomieszczenia są elementem projektu", inside the project it is about.
 *
 * `projectId` is not in the sync contract (`RoomEntity` has no column,
 * `SyncContract.roomToDoc()` no key) and survives anyway, because every write on both
 * sides is a merge and the deployed `validRoom()` validates by shape with no `hasOnly` —
 * see assets/workspace.js. The phone carries the link without being able to show it, which
 * is what the note under the form says.
 */
function roomBlock(projectId) {
  const rooms = state.rooms.filter((r) => r.projectId === projectId);
  return `<div class="app-rooms">
      <ul class="data-list">${
        rooms.length ? rooms.map(roomRow).join("")
          : `<li class="empty muted">${T("app_empty_rooms")}</li>`
      }</ul>
      <form class="inline-form" data-room-form>
        <input type="text" maxlength="120" data-f="name" placeholder="${T("app_new_room")}" required
          aria-label="${T("app_new_room")}">
        <input type="text" inputmode="decimal" data-f="lengthM" value="5" aria-label="${T("fld_length")}">
        <input type="text" inputmode="decimal" data-f="widthM" value="4" aria-label="${T("fld_width")}">
        <input type="text" inputmode="decimal" data-f="heightM" value="2.6" aria-label="${T("fld_height")}">
        <button type="submit" class="btn btn-ghost btn-sm">${T("app_add_room")}</button>
      </form>
    </div>`;
}

/**
 * The rooms no project claims — the ones made on the phone, which cannot send a
 * `projectId` because the contract has no field for it. They are listed rather than hidden:
 * they are real rooms, and hiding them would look like losing them.
 */
function renderRooms() {
  const list = $("room-list");
  if (!list) return;
  const loose = state.rooms.filter((r) => !r.projectId);
  list.innerHTML = loose.length
    ? loose.map(roomRow).join("")
    : `<li class="empty muted">${T("app_rooms_loose_none")}</li>`;
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

  // Chapter XVIII's room, added inside the project it belongs to. The form is redrawn with
  // its project on every write, so the listener is on the list and reads the row it fired
  // in — one handler for however many projects there are.
  $("project-list").addEventListener("submit", async (e) => {
    const form = e.target.closest("[data-room-form]");
    if (!form) return;
    e.preventDefault();
    const li = form.closest("li[data-id]");
    const get = (f) => form.querySelector(`[data-f="${f}"]`).value;
    const name = get("name").trim().slice(0, 120);
    if (!name || !li) return;
    // The same clamps the deployed rules impose (FIRESTORE_SYNC §2, validRoom()).
    const l = Math.min(num(get("lengthM")), 1000);
    const w = Math.min(num(get("widthM")), 1000);
    const h = Math.min(num(get("heightM")), 100);
    try {
      await addRoom(name, l, w, h, li.dataset.id);
    } catch (err) { status(T("app_err_unknown"), true); }
  });

  $("project-list").addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const project = state.projects.find((p) => p.id === li.dataset.id);
    // A room's delete button lives inside the project row, so it has to be answered before
    // the project's own actions — otherwise the closest `li[data-id]` above it wins.
    const roomLi = e.target.closest(".app-rooms li[data-id]");
    if (roomLi && e.target.closest("[data-del]")) {
      const room = state.rooms.find((r) => r.id === roomLi.dataset.id);
      if (room) await deleteRoom(room);
      return;
    }
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
    if (room) await deleteRoom(room);
  });
}

/**
 * Tombstone one room, from either list.
 *
 * `projectId` is not repeated in the fields: `tombstone()` merges, so a key it is not
 * handed is left exactly as it was. That is the whole reason the link survives a delete
 * and an undo on another device.
 */
const deleteRoom = (room) => tombstone(roomDoc(room.id), room, {
  name: room.name, lengthM: room.lengthM, widthM: room.widthM, heightM: room.heightM,
});

/* ------------------------------------------------------------------ sync with the browser */

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
const SYNC_ACCOUNT_KEY = "liczmat-sync-account";

function syncAccount() {
  try { return localStorage.getItem(SYNC_ACCOUNT_KEY) || ""; } catch (e) { return ""; }
}

function setSyncAccount(uid) {
  try {
    if (uid) localStorage.setItem(SYNC_ACCOUNT_KEY, uid);
    else localStorage.removeItem(SYNC_ACCOUNT_KEY);
  } catch (e) {}
}

/** How many rows the browser workspace is holding, tombstones not counted. */
function localCounts() {
  const local = typeof wsExport === "function" ? wsExport() : null;
  if (!local) return null;
  const alive = (rows) => (rows || []).filter((r) => !r.deletedAt).length;
  return {
    projects: alive(local.projects), rooms: alive(local.rooms),
    estimations: alive(local.estimations), shoppingItems: alive(local.shoppingItems),
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
  if (!counts) return false;
  return counts.projects + counts.rooms + counts.estimations + counts.shoppingItems > 0;
}

/** How much is sitting in this browser's workspace, in one line. */
function renderLocalSummary() {
  const box = $("app-sync-local");
  const counts = localCounts();
  if (!box || !counts) return;
  box.textContent = `${T("app_sync_local")}: ${counts.projects} × ${T("app_projects")}, ` +
    `${counts.rooms} × ${T("app_rooms")}, ${counts.estimations} × ${T("ws_lines")}, ` +
    `${counts.shoppingItems} × ${T("proj_mat_t")}`;

  // Both directions are refused while another account's copy is sitting here: a pull
  // would mix two people's rows into one store, and a push would file them under the
  // wrong account. The way out is the button on the settings tab, which empties this
  // browser — said in the warning rather than left to be guessed.
  const foreign = foreignWorkspace();
  const warning = $("app-sync-foreign");
  if (warning) {
    warning.textContent = foreign ? T("app_sync_foreign") : "";
    warning.hidden = !foreign;
  }
  ["app-sync-push", "app-sync-pull"].forEach((id) => {
    const button = $(id);
    if (button) button.disabled = foreign;
  });
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
    // The button is disabled while this is true; the check is here as well because a
    // disabled attribute is a hint to a mouse and nothing more.
    if (foreignWorkspace()) { status(T("app_sync_foreign"), true); return; }
    push.disabled = true;
    try {
      const local = wsExport();
      for (const p of local.projects) {
        if (!pathId(p.id)) continue;
        await fb.setDoc(projectDoc(p.id), {
          name: String(p.name).slice(0, 120),
          archived: !!p.archived,
          ...syncFields(p.createdAt, p.deletedAt),
        }, MERGE);
      }
      for (const r of local.rooms) {
        if (!pathId(r.id)) continue;
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
        const projectSeg = pathId(e.projectId), lineSeg = pathId(e.id);
        if (!projectSeg || !lineSeg) continue;
        const ref = fb.doc(db, "users", state.uid, "projects", projectSeg, "estimations", lineSeg);
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
        const ref = fb.doc(db, "users", state.uid, "projects", projectSeg, "shoppingItems", itemSeg);
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
      setSyncAccount(state.uid);
      renderLocalSummary();
      status(T("app_sync_pushed"));
    } catch (err) {
      status(T("app_err_unknown"), true);
    } finally {
      push.disabled = false;
    }
  });

  pull.addEventListener("click", async () => {
    if (foreignWorkspace()) { status(T("app_sync_foreign"), true); return; }
    pull.disabled = true;
    try {
      const incoming = await downloadAccount();
      wsImport(incoming);
      setSyncAccount(state.uid);
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
  const DEVICE_DATA_KEYS = [
    "materio-workspace-v1",    // assets/workspace.js
    "materio-active-project",  // assets/workspace.js
    "liczmat-recent-calcs",    // assets/recent.js
    "liczmat-crm-v1",          // assets/crm.js
    SYNC_ACCOUNT_KEY,          // this file: whose copy it was
  ];

  $("app-wipe").addEventListener("click", () => {
    if (!confirm(T("app_wipe_confirm"))) return;
    try {
      DEVICE_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      status(T("app_err_unknown"), true);
      return;
    }
    // The workspace is read fresh from localStorage on every call, so the lists redraw
    // themselves once they are told. /app/ draws the account's rows, not the browser's,
    // so the only thing on this page that changes is the sync tab's summary.
    document.dispatchEvent(new CustomEvent("workspacechange"));
    renderLocalSummary();
    status(T("app_wipe_done"));
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
      // still there and still wants its lists — and its plan, which is the one of the
      // three that nothing else would ever re-attach.
      if (state.uid) {
        listen("projects", (rows) => { state.projects = rows; renderProjects(); });
        listen("rooms", (rows) => { state.rooms = rows; renderRooms(); renderProjects(); });
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
