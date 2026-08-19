/* LiczMat website — the Free/Pro model: which plan an account is on, and what each of
 * chapter II's three levels is allowed to do.
 *
 * Master plan, session 21 (LICZMAT PRO: FUNDAMENT): "Model Free / Pro. Bez płatności.
 * Przygotowanie: uprawnień, feature gatingu, statusu planu, struktury Pro." This file is
 * the first three of those four; the fourth — which modules Pro consists of and how they
 * are shown to somebody who does not have it — is `src/pro.mjs`, built from the PRO
 * routes in `src/ia.mjs` and checked against the table below.
 *
 * Session 27 added the fifth thing: the paywall. LM_PRO_LOCKED, the preview beside it and
 * lmPaywall() are the decision; `assets/paywall.js` draws it and `src/pro.mjs` builds the
 * markup it draws into.
 *
 * It is deliberately NOT loaded on every page. `assets/account.js` is, because 128 pages
 * need to word one sentence about the session; this one is loaded by the five pages that
 * offer a Pro feature — /klienci/, /zlecenia/, /wyceny/, /terminarz/ and /app/ — and by
 * nothing else. It loads after account.js and uses its LM_LEVEL and lmLevelOf(): the
 * level is derived in exactly one place and this file does not derive it a second time.
 * The preview does not derive one either — it moves the wall, never the level.
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
 *            expired:boolean}}
 *   plan       null for a guest (no account, so no plan), else LM_PLAN.*
 *   level      chapter II's level, from lmLevelOf() — the one derivation
 *   validUntil millis, or null when the plan carries no end date
 *   expired    a Pro plan whose planValidUntil has passed. The account is LICZMAT again
 */
function lmPlanStatus(user, profile, now) {
  var at = now === undefined ? Date.now() : now;
  var level = lmLevelOf(user, profile, at);
  if (!user) {
    return { signedIn: false, plan: null, level: level, validUntil: null, expired: false };
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
 * to check the module works. That argument did not disappear when the paywall was built —
 * it is answered by LM_PRO_PREVIEW_KEY below, which is the one door through this lock
 * until a payment can open it properly.
 *
 * Still not a security boundary. The CRM store is `localStorage` on one device and is in
 * no sync contract; this decides what the page *shows*.
 */
var LM_PRO_LOCKED = true;

/**
 * The Pro preview: this browser's own answer to "let me see what I would be paying for".
 *
 * Session 27 turned the lock on while session 28 still owes the payment, which leaves a
 * gap nobody can cross: a free account cannot become Pro, so a hard lock would take five
 * working modules away and give nothing back — including from the owner, who has to check
 * they work before there is anything to buy (chapter XXV's own order).
 *
 * So the paywall offers the preview, and is honest about what it is: one key in
 * `localStorage`, on this device, that opens the Pro modules **without touching the plan
 * on the account**. It grants nothing on the server — `plan` is server-only and the
 * deployed rules refuse a client write — it is not synced, the phone never sees it, and
 * `lmLevelOf()` does not read it: the visitor's level is still derived in exactly one
 * place, from Firebase, and the preview moves the paywall rather than the level.
 *
 * Session 28 replaces it with a subscription. It is deliberately one key and one function
 * pair, so that removal is a deletion rather than an unpicking.
 */
var LM_PRO_PREVIEW_KEY = "liczmat-pro-preview";

/** Whether the Pro preview is on in this browser. Storage refused reads as off. */
function lmProPreview() {
  try { return localStorage.getItem(LM_PRO_PREVIEW_KEY) === "1"; } catch (e) { return false; }
}

/**
 * Turn the preview on or off, and tell the page.
 *
 * `lm-preview` is a separate event from `lm-session` because it is a separate thing: the
 * session moved (somebody signed in) versus the paywall moved (somebody looked behind it).
 * A page that redraws on both keeps them apart in its own head too.
 */
function lmSetProPreview(on) {
  try {
    if (on) localStorage.setItem(LM_PRO_PREVIEW_KEY, "1");
    else localStorage.removeItem(LM_PRO_PREVIEW_KEY);
  } catch (e) {
    // Private mode with storage refused: the preview cannot be remembered, so it is off.
  }
  if (typeof document !== "undefined" && typeof CustomEvent === "function") {
    document.dispatchEvent(new CustomEvent("lm-preview", { detail: { on: lmProPreview() } }));
  }
}

/**
 * How a page should present one feature to a visitor at `level`.
 *
 * @returns {{allowed:boolean, gated:boolean, locked:boolean, preview:boolean,
 *            feature:object|null}}
 *   allowed the level reaches it — the plan on the account says so
 *   gated   it does not — say what the module is and that it is Pro (chapter XXV)
 *   locked  and show the paywall *instead of* the module. LM_PRO_LOCKED, above
 *   preview the level does not reach it and the module runs anyway, because this browser
 *           turned the preview on. Never true together with `allowed`: a preview is not
 *           a plan, and a page that said "Twój plan: LiczMat Pro" over one would be lying
 *
 * An unknown feature id is closed, for the reason lmCan() answers false: a typo should
 * shut a door, not open one — and the preview does not open it either.
 */
function lmFeatureState(id, level) {
  var f = lmFeature(id);
  if (!f) return { allowed: false, gated: true, locked: true, preview: false, feature: null };
  var allowed = lmAllows(level, f.level);
  // The preview answers for Pro and for nothing else. `sync` and `share` need a real
  // Firebase user and a document the rules accept; no key in this browser can supply one,
  // so offering to preview them would be a switch that does nothing.
  var preview = !allowed && f.level === LM_LEVEL.PRO && lmProPreview();
  // LM_PRO_LOCKED is the *Pro* lock, and it walls off Pro features only. A LICZMAT
  // feature out of a guest's reach — `sync`, `share` — is gated and not locked: what
  // stands in its way is the sign-in form on /app/, which asks for an account rather
  // than for money, and a paywall in front of it would be asking for the wrong thing.
  return {
    allowed: allowed,
    gated: !allowed,
    locked: !allowed && f.level === LM_LEVEL.PRO && LM_PRO_LOCKED && !preview,
    preview: preview,
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
 *   "none"    nothing to do — the plan already reaches the module, or the preview is on
 *   "account" LiczMat Pro is a plan on an account, and this visitor has no account.
 *             Signing up comes before anything that could be bought
 *   "upgrade" there is an account on the free plan. This is the rung session 28 turns
 *             into a payment; today it is the preview and the page that explains Pro
 *
 * The level is passed in, never read here, for the reason lmCan() gives: the only thing a
 * page can read without Firebase is a hint that may be stale.
 *
 * @returns {{feature:object|null, open:boolean, locked:boolean, preview:boolean,
 *            gated:boolean, step:string}}
 */
function lmPaywall(id, level) {
  var st = lmFeatureState(id, level);
  var step = "none";
  // Only a Pro feature has a Free → Pro path to put somebody on. An unknown id gets no
  // step either: there is nothing to name and nowhere to send them.
  if (st.feature && st.feature.level === LM_LEVEL.PRO && !st.allowed && !st.preview) {
    step = level === LM_LEVEL.GUEST ? "account" : "upgrade";
  }
  return {
    feature: st.feature,
    open: st.allowed || st.preview,
    locked: st.locked,
    preview: st.preview,
    gated: st.gated,
    step: step,
  };
}
