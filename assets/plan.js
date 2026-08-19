/* LiczMat website — the Free/Pro model: which plan an account is on, and what each of
 * chapter II's three levels is allowed to do.
 *
 * Master plan, session 21 (LICZMAT PRO: FUNDAMENT): "Model Free / Pro. Bez płatności.
 * Przygotowanie: uprawnień, feature gatingu, statusu planu, struktury Pro." This file is
 * the first three of those four; the fourth — which modules Pro consists of and how they
 * are shown to somebody who does not have it — is `src/pro.mjs`, built from the PRO
 * routes in `src/ia.mjs` and checked against the table below.
 *
 * Session 27 added the fifth thing: the paywall. LM_PRO_LOCKED and lmPaywall() are the
 * decision; `assets/paywall.js` draws it and `src/pro.mjs` builds the markup it draws into.
 *
 * Session 28 added the sixth: the subscription. lmSubscription() below answers what a
 * plan is *doing* — running, cancelled and running out, or gone — which is the half
 * lmLevelOf() throws away. What it costs and where somebody pays is `assets/pay.js`; the
 * two files do not read each other. Session 28 also **removed the Pro preview**: session
 * 27's one key in localStorage that opened the modules without a plan. With a real
 * checkout in front of them the preview would be a second answer to "may I use this",
 * and the whole point of lmLevelOf() is that there is one.
 *
 * It is deliberately NOT loaded on every page. `assets/account.js` is, because 128 pages
 * need to word one sentence about the session; this one is loaded by the five pages that
 * offer a Pro feature — /klienci/, /zlecenia/, /wyceny/, /terminarz/ and /app/ — and by
 * nothing else. It loads after account.js and uses its LM_LEVEL and lmLevelOf(): the
 * level is derived in exactly one place and this file does not derive it a second time.
 * Since session 28 removed the preview, nothing in this file derives one at all: every
 * answer below is a function of the `level` it is handed.
 *
 * Nothing here is a security boundary. The browser decides what to *show*; the deployed
 * Firestore rules decide what may be *written*, and `plan` is a field only the server can
 * write (FIRESTORE_SYNC §2). A visitor who edits this file in their own devtools gets a
 * page that says "Pro" and a backend that still refuses. That is the intended split:
 * chapter XXV asks for a free user who *understands* which features are Pro, not for a
 * lock made of JavaScript.
 */

/* ------------------------------------------------------------------ the plan */

/**
 * The two values `users/{uid}.plan` may hold. They come from the sync contract
 * (FIRESTORE_SYNC §2), not from this site: the Android app reads the same field.
 *
 * "premium" rather than "pro" is the contract's word and predates the rebranding. Do not
 * rename it here — the phone and the rules would disagree with the browser.
 */
var LM_PLAN = { FREE: "free", PRO: "premium" };

/**
 * What plan this account is on, in full, for a page that has to explain it.
 *
 * `lmLevelOf()` in assets/account.js answers "which of the three levels", and collapses
 * a Pro plan that ran out into LICZMAT — which is right for gating and useless for
 * telling somebody *why* they are back on the free level. This keeps both halves.
 *
 * @param {object|null} user     the Firebase Auth user, or null when signed out
 * @param {object|null} profile  users/{uid} as read from Firestore, or null
 * @param {number} [now]         millis, for the expiry check
 * @returns {{signedIn:boolean, plan:string|null, level:string, validUntil:number|null,
 *            expired:boolean, renews:boolean}}
 *   plan       null for a guest (no account, so no plan), else LM_PLAN.*
 *   level      chapter II's level, from lmLevelOf() — the one derivation
 *   validUntil millis, or null when the plan carries no end date
 *   expired    a Pro plan whose planValidUntil has passed. The account is LICZMAT again
 *   renews     whether the subscription is set to renew — see lmPlanRenews() below
 */
function lmPlanStatus(user, profile, now) {
  var at = now === undefined ? Date.now() : now;
  var level = lmLevelOf(user, profile, at);
  if (!user) {
    return { signedIn: false, plan: null, level: level, validUntil: null, expired: false,
             renews: false };
  }
  var p = profile || {};
  var plan = p.plan === LM_PLAN.PRO ? LM_PLAN.PRO : LM_PLAN.FREE;
  var raw = p.planValidUntil;
  var until = raw === null || raw === undefined || isNaN(Number(raw)) ? null : Number(raw);
  return {
    signedIn: true,
    plan: plan,
    level: level,
    validUntil: until,
    expired: plan === LM_PLAN.PRO && until !== null && until <= at,
    renews: lmPlanRenews(p),
  };
}

/**
 * Is this subscription set to renew?
 *
 * **This cannot be derived from the two fields the contract already has.** "Renews on the
 * 12th" and "ends on the 12th" are the same `plan` + `planValidUntil` pair; the difference
 * is the whole of chapter 28's "obsługa anulowania", and it needs one field more.
 *
 * `planRenews` is that field. Three things about it, all deliberate:
 *
 *   - **Server-only**, like `plan` and `planValidUntil`. The deployed rules let a client
 *     write nothing in the profile but `lastSeenAt` and `appVersion`, so no rules change
 *     was needed and no browser can flip it.
 *   - **Absent means renewing**, not cancelled. Every document that exists today has no
 *     such key, and telling somebody their subscription is ending when the document never
 *     said so is the one error here that costs a customer.
 *   - It sits **beside the sync contract** — no `planRenews` in FIRESTORE_SYNC §2 yet.
 *     That is the same position `note` on a shopping item (session 18) and `projectId` on
 *     a room (session 20) are in, and it survives for the same reason: every write in
 *     CloudSync.kt is a merge, so the phone's fixed field map cannot erase a key it does
 *     not mention, and the app's fromDoc() readers ignore what they do not know. Adding it
 *     properly is a contract change in `3d-polednia/Materio`.
 */
function lmPlanRenews(profile) {
  var p = profile || {};
  return p.planRenews === undefined || p.planRenews === null ? true : p.planRenews !== false;
}

/**
 * The five states a subscription can be in, as one word.
 *
 * lmPlanStatus() reports the fields; this reports the *situation*, so that /app/ and the
 * paywall pick a sentence by name instead of each re-deriving it from four booleans and
 * eventually disagreeing.
 *
 *   "none"      no account. There is no plan to be in a state
 *   "free"      an account on the free plan
 *   "active"    Pro, paid up, renewing
 *   "cancelled" Pro, still valid, and it will NOT renew — Pro until validUntil, then free.
 *               The account is fully Pro right now: this is a date, not a demotion
 *   "expired"   Pro that ran out. LICZMAT again, and able to say why
 *
 * @returns {{state:string, plan:string|null, level:string, validUntil:number|null,
 *            renews:boolean, daysLeft:number|null}}
 *   daysLeft whole days from `now` to validUntil, floored, never negative. null when
 *            there is no end date to count to
 */
function lmSubscription(user, profile, now) {
  var at = now === undefined ? Date.now() : now;
  var st = lmPlanStatus(user, profile, at);
  var state;
  if (!st.signedIn) state = "none";
  else if (st.plan !== LM_PLAN.PRO) state = "free";
  else if (st.expired) state = "expired";
  else state = st.renews ? "active" : "cancelled";

  var days = null;
  if (st.validUntil !== null) {
    days = Math.max(0, Math.floor((st.validUntil - at) / 86400000));
  }
  return {
    state: state,
    plan: st.plan,
    level: st.level,
    validUntil: st.validUntil,
    renews: st.renews,
    daysLeft: days,
  };
}

/* ------------------------------------------------------------------ permissions */

/**
 * Every feature LiczMat has or will have, with the level it needs. Chapter II's
 * "każdy element aplikacji powinien jednoznacznie wiedzieć, do którego poziomu dostępu
 * należy", for the features — `src/ia.mjs` already answers it for the pages.
 *
 * `level` is what the product actually enforces today, not a wish. Two of them differ
 * from the bullet lists in chapter II, and both differences are decisions already taken
 * and written down:
 *
 *   - Chapter II puts "zapisywać kalkulacje", "tworzyć projekty" and "tworzyć listy
 *     materiałów" under NIE MOŻE for a guest. This site keeps all three in
 *     `localStorage` in the Firestore document shape, so they work before anybody signs
 *     in, and FIRESTORE_SYNC §1.2 says counting never requires an account. What the free
 *     account adds is `sync` — the same rows on the phone — and `share`. The routes say
 *     the same thing: /projekty/ and /kosztorys/ are GUEST in src/ia.mjs.
 *   - The link to /projekty/ is still only offered to somebody signed in. That is
 *     `navLevel` in src/ia.mjs and it is about the menu, not about permission; a feature
 *     table that recorded it as a permission would be a lie a future session acts on.
 *
 * Fields:
 *   id      stable key. Not a URL and not a dictionary key.
 *   level   LM_LEVEL.* — the lowest level that may use it.
 *   route   the id of the route in src/ia.mjs it lives on, when it has one.
 *   key     dictionary prefix (`<key>_t` the name, `<key>_d` one line) — only for the
 *           features a page names to the visitor, which today is the Pro modules.
 *           A feature the pages never name carries no copy nobody would read.
 *   session the master plan session that builds it, for what does not exist yet.
 *   note    why it is at that level, when the answer is not obvious.
 */
var LM_FEATURES = [
  /* -------------------------------------------------- guest: the whole calculator */
  { id: "calc", level: LM_LEVEL.GUEST, route: "calculator",
    note: "Chapter II: „Podstawowe kalkulatory NIE MOGĄ wymagać rejestracji.” The full " +
      "result, with no field hidden behind an account." },
  { id: "catalog", level: LM_LEVEL.GUEST, route: "materials" },
  { id: "guides", level: LM_LEVEL.GUEST, route: "guides" },
  { id: "stores", level: LM_LEVEL.GUEST, route: "stores" },

  /* -------------------------------------------------- guest: the local workspace */
  { id: "projects", level: LM_LEVEL.GUEST, route: "projects",
    note: "localStorage in the Firestore shape. An account adds sync, not the ability " +
      "to count — see the note on the route itself." },
  { id: "rooms", level: LM_LEVEL.GUEST, route: "project" },
  { id: "saved", level: LM_LEVEL.GUEST, route: "project",
    note: "A calculation saved into a project. Chapter XV." },
  { id: "shopping", level: LM_LEVEL.GUEST, route: "estimate", note: "Chapter XVI." },
  { id: "costs", level: LM_LEVEL.GUEST, route: "estimate", note: "Chapter XVII." },
  { id: "history", level: LM_LEVEL.GUEST, route: "dashboard",
    note: "The dashboard reads this browser's own storage; gating it would hide " +
      "somebody's own work from them after a token expired." },

  /* -------------------------------------------------- free account */
  { id: "sync", level: LM_LEVEL.LICZMAT, route: "account",
    note: "The one thing an account actually adds to the workspace: the same rows in " +
      "the browser and on the phone." },
  { id: "share", level: LM_LEVEL.LICZMAT, route: "share",
    note: "Reading a shared estimate needs nothing (the route is GUEST). Making the " +
      "link writes a document under sharedProjects, so it needs an account." },

  /* -------------------------------------------------- pro */
  { id: "clients", level: LM_LEVEL.PRO, route: "clients", key: "feat_clients", session: 22 },
  { id: "jobs", level: LM_LEVEL.PRO, route: "jobs", key: "feat_jobs", session: 23 },
  { id: "quotes", level: LM_LEVEL.PRO, route: "quotes", key: "feat_quotes", session: 24 },
  { id: "calendar", level: LM_LEVEL.PRO, route: "calendar", key: "feat_calendar", session: 25 },
  { id: "crm", level: LM_LEVEL.PRO, route: null, key: "feat_crm", session: 26,
    note: "Chapter XXIV is a path through the other four — klient → zlecenie → projekt " +
      "→ wycena → historia — not a page of its own, so it has no route." },
];

var LM_FEATURE_BY_ID = {};
for (var lmFi = 0; lmFi < LM_FEATURES.length; lmFi++) {
  LM_FEATURE_BY_ID[LM_FEATURES[lmFi].id] = LM_FEATURES[lmFi];
}

/** One feature by id, or null. An unknown id is never silently "allowed". */
function lmFeature(id) {
  return Object.prototype.hasOwnProperty.call(LM_FEATURE_BY_ID, String(id))
    ? LM_FEATURE_BY_ID[String(id)] : null;
}

/** Every feature at exactly this level, in declaration order. */
function lmFeaturesAt(level) {
  return LM_FEATURES.filter(function (f) { return f.level === level; });
}

/**
 * May a visitor at `level` use this feature?
 *
 * `level` is passed in rather than read here on purpose: the only thing a page can read
 * without Firebase is `liczmat-signed-in`, which is a copy hint and may be stale, and a
 * function that quietly gated on it would eventually hide somebody's own projects from
 * them. A caller that wants the hint asks for it (lmReadLevel()) and owns that choice.
 *
 * An unknown feature id answers false. A typo should close a door, not open one.
 */
function lmCan(id, level) {
  var f = lmFeature(id);
  return !!f && lmAllows(level, f.level);
}

/**
 * What to show instead of a feature the visitor cannot use — chapter XXV's
 * "Klienci / Dostępne w LiczMat Pro", never a dead button.
 *
 * @returns {null|{feature:object, need:string}} null when the feature is allowed
 */
function lmGate(id, level) {
  var f = lmFeature(id);
  if (!f) return null;
  return lmAllows(level, f.level) ? null : { feature: f, need: f.level };
}

/* ------------------------------------------------------------------ the paywall */

/**
 * Whether a feature the visitor's level does not reach is *closed*, or only marked as Pro.
 *
 * Chapter XXV asks for both, in this order: "Użytkownik darmowy powinien rozumieć, które
 * funkcje są Pro" first, and payments "dopiero po zbudowaniu funkcji Pro, sprawdzeniu ich
 * działania, przetestowaniu uprawnień, przygotowaniu paywalla". Sessions 22–26 built the
 * five modules; **session 27 flipped this to `true`** and session 28 adds the payments.
 *
 * Sessions 21–26 left it `false` on purpose, and said why: nothing grants Pro
 * (FIRESTORE_SYNC §9.2 — no Cloud Functions, no Play Billing, and `plan` is server-only),
 * so a lock closes every Pro module to every account there is, including the one that has
 * to check the module works. Session 27 answered that with a preview — one key in
 * localStorage — and **session 28 removed it**: with a checkout standing in front of the
 * wall, a key that opens the modules anyway is a second answer to "may I use this", and
 * lmLevelOf() exists so that there is exactly one. The consequence is stated rather than
 * hidden: until the Stripe extension grants `plan: premium` (see the ORDER note in
 * assets/pay.js), every Pro module is closed to every account, the owner's included.
 *
 * Still not a security boundary. The CRM store is `localStorage` on one device and is in
 * no sync contract; this decides what the page *shows*.
 */
var LM_PRO_LOCKED = true;

/**
 * How a page should present one feature to a visitor at `level`.
 *
 * @returns {{allowed:boolean, gated:boolean, locked:boolean, feature:object|null}}
 *   allowed the level reaches it — the plan on the account says so
 *   gated   it does not — say what the module is and that it is Pro (chapter XXV)
 *   locked  and show the paywall *instead of* the module. LM_PRO_LOCKED, above
 *
 * An unknown feature id is closed, for the reason lmCan() answers false: a typo should
 * shut a door, not open one.
 *
 * **Nothing in this browser can change any of these answers.** Since session 28 removed
 * the preview, the only input is `level`, which comes from Firebase by way of
 * lmLevelOf(). scripts/test-pay.mjs checks that directly: no key planted in localStorage
 * moves a single answer here.
 */
function lmFeatureState(id, level) {
  var f = lmFeature(id);
  if (!f) return { allowed: false, gated: true, locked: true, feature: null };
  var allowed = lmAllows(level, f.level);
  // LM_PRO_LOCKED is the *Pro* lock, and it walls off Pro features only. A LICZMAT
  // feature out of a guest's reach — `sync`, `share` — is gated and not locked: what
  // stands in its way is the sign-in form on /app/, which asks for an account rather
  // than for money, and a paywall in front of it would be asking for the wrong thing.
  return {
    allowed: allowed,
    gated: !allowed,
    locked: !allowed && f.level === LM_LEVEL.PRO && LM_PRO_LOCKED,
    feature: f,
  };
}

/**
 * The whole paywall decision for one feature, in one call — chapter XXV's "blokady",
 * "komunikaty" and "przejście Free → Pro" answered together, so that four pages cannot
 * word the same wall four ways.
 *
 * `step` is what this visitor does next, and it is the Free → Pro path with the rung they
 * are standing on named:
 *
 *   "none"    nothing to do — the plan already reaches the module
 *   "account" LiczMat Pro is a plan on an account, and this visitor has no account.
 *             Signing up comes before anything that could be bought
 *   "upgrade" there is an account on the free plan. Session 28 turned this rung into the
 *             subscription: the plans, their prices, and the way to /app/ where one is
 *             bought. Until a Payment Link is configured it shows the price and says the
 *             subscription has not opened yet — see assets/pay.js
 *
 * The level is passed in, never read here, for the reason lmCan() gives: the only thing a
 * page can read without Firebase is a hint that may be stale.
 *
 * @returns {{feature:object|null, open:boolean, locked:boolean, gated:boolean,
 *            step:string}}
 */
function lmPaywall(id, level) {
  var st = lmFeatureState(id, level);
  var step = "none";
  // Only a Pro feature has a Free → Pro path to put somebody on. An unknown id gets no
  // step either: there is nothing to name and nowhere to send them.
  if (st.feature && st.feature.level === LM_LEVEL.PRO && !st.allowed) {
    step = level === LM_LEVEL.GUEST ? "account" : "upgrade";
  }
  return {
    feature: st.feature,
    open: st.allowed,
    locked: st.locked,
    gated: st.gated,
    step: step,
  };
}
