/* LiczMat website — the user session and the three access levels.
 *
 * Master plan, chapter II: GOŚĆ → LICZMAT → LICZMAT PRO, and "każdy element aplikacji
 * powinien jednoznacznie wiedzieć, do którego poziomu dostępu należy". `src/ia.mjs`
 * answers that for pages; this file answers it for the person reading them.
 *
 * It ships on every page — it is two kilobytes and it is what lets a calculator page
 * word one sentence, or the header show a mark, without any of them loading Firebase.
 * /app/ is the only page that talks to Firebase Auth, and it is the only writer here.
 *
 * The level is derived, never asserted:
 *
 *   no Firebase user                          → GOŚĆ
 *   signed in                                 → LICZMAT
 *   signed in and users/{uid}.plan = premium  → LICZMAT PRO
 *
 * `plan` and `planValidUntil` are server-only fields (FIRESTORE_SYNC §2 and the rules in
 * config/firebase/firestore.rules: the client may write nothing but lastSeenAt and
 * appVersion). So a browser can read the level but can never grant itself one, and
 * nothing here is a permission check — see lmReadLevel().
 */

var LM_LEVEL = { GUEST: "guest", LICZMAT: "liczmat", PRO: "pro" };
var LM_LEVEL_ORDER = [LM_LEVEL.GUEST, LM_LEVEL.LICZMAT, LM_LEVEL.PRO];

/** The value of `plan` that means Pro. The other value the contract defines is "free". */
var LM_PLAN_PRO = "premium";

/**
 * Where the hint lives. Named on /cookies/, and deliberately not renamed when the brand
 * changed: the other `materio-*` keys hold real data, and this one is listed next to them.
 */
var LM_SESSION_KEY = "liczmat-signed-in";

/** Is `have` at least `need`? The same order as `allows()` in src/ia.mjs. */
function lmAllows(have, need) {
  return LM_LEVEL_ORDER.indexOf(have) >= LM_LEVEL_ORDER.indexOf(need);
}

/**
 * The level of a signed-in user, from the Firebase user and their profile document.
 *
 * @param {object|null} user     the Firebase Auth user, or null when signed out
 * @param {object|null} profile  users/{uid} as read from Firestore, or null
 * @param {number} [now]         millis, for the premium expiry check
 */
function lmLevelOf(user, profile, now) {
  if (!user) return LM_LEVEL.GUEST;
  var p = profile || {};
  if (p.plan !== LM_PLAN_PRO) return LM_LEVEL.LICZMAT;
  // planValidUntil is optional; a plan that ran out is a free account again, and the
  // server is the one that will eventually rewrite the field.
  var until = p.planValidUntil;
  if (until !== null && until !== undefined && Number(until) <= (now === undefined ? Date.now() : now)) {
    return LM_LEVEL.LICZMAT;
  }
  return LM_LEVEL.PRO;
}

/**
 * What this browser was last told about the session, for the pages that do not load
 * Firebase — that is 128 of the 130.
 *
 * **A hint, never a gate.** It can be stale: signed out in another tab, an expired
 * token, a second browser profile. Nothing may gate saving, counting or reading on it
 * (FIRESTORE_SYNC §1.2 — counting never requires an account); it decides wording, and
 * the mark in the header. Firebase itself is the only authority, and only /app/ asks it.
 */
function lmReadLevel() {
  var raw;
  try { raw = localStorage.getItem(LM_SESSION_KEY); } catch (e) { return LM_LEVEL.GUEST; }
  if (!raw) return LM_LEVEL.GUEST;
  // "1" is what the key held before it carried the level. A browser that still has it
  // is signed in, and /app/ will overwrite it with the real level on the next visit.
  if (raw === "1") return LM_LEVEL.LICZMAT;
  return LM_LEVEL_ORDER.indexOf(raw) > 0 ? raw : LM_LEVEL.GUEST;
}

/** Whether this browser believes somebody is signed in. Same caveat as lmReadLevel(). */
function lmSignedIn() {
  return lmReadLevel() !== LM_LEVEL.GUEST;
}

/**
 * Put the level on <html>, where the stylesheet can see it.
 *
 * The inline script in <head> (src/template.mjs) does this on the first paint, from the
 * same key, so a navigation link gated on `navLevel` is right before anything is drawn.
 * This is the other half: /app/ signs somebody in or out without a reload, and the menu
 * has to follow.
 */
function lmMarkLevel() {
  if (typeof document === "undefined" || !document.documentElement) return;
  var level = lmReadLevel();
  if (level === LM_LEVEL.GUEST) document.documentElement.removeAttribute("data-lm-level");
  else document.documentElement.setAttribute("data-lm-level", level);
}

/** Record the level for the rest of the site. GUEST clears the key instead of storing it. */
function lmWriteLevel(level) {
  try {
    if (level && level !== LM_LEVEL.GUEST) localStorage.setItem(LM_SESSION_KEY, level);
    else localStorage.removeItem(LM_SESSION_KEY);
  } catch (e) {
    // Private mode with storage refused: every reader falls back to the guest wording.
  }
  lmMarkLevel();
  if (typeof document !== "undefined" && typeof CustomEvent === "function") {
    document.dispatchEvent(new CustomEvent("lm-session", { detail: { level: lmReadLevel() } }));
  }
}

/**
 * Whether the session should outlive the browser window, on this device.
 *
 * Firebase's own default is "yes" (browserLocalPersistence), and that is the right
 * default for a phone. It is the wrong one on a shared computer, and until this key
 * existed there was no way to say so. Stored rather than asked every time, because the
 * answer is a property of the device, not of the sign-in.
 */
var LM_REMEMBER_KEY = "liczmat-remember";

function lmReadRemember() {
  try { return localStorage.getItem(LM_REMEMBER_KEY) !== "0"; } catch (e) { return true; }
}

function lmWriteRemember(on) {
  try { localStorage.setItem(LM_REMEMBER_KEY, on ? "1" : "0"); } catch (e) {}
}

/**
 * Where to send somebody back to after they sign in, from a `?next=` parameter.
 *
 * Only a path on this site is ever accepted. `//evil.example` is a protocol-relative URL
 * and a browser follows it off-site, so a leading double slash is refused along with
 * anything carrying a scheme or a backslash — an open redirect on a sign-in page is how
 * a phishing link borrows a real domain.
 *
 * @returns {string} the path, or "" when there is nothing safe to go back to
 */
function lmSafeNext(raw) {
  var value = String(raw || "");
  if (!value || value.charAt(0) !== "/") return "";
  if (value.charAt(1) === "/" || value.charAt(1) === "\\") return "";
  if (value.indexOf("\\") >= 0) return "";
  if (/^\/[a-z0-9.+-]*:/i.test(value)) return "";
  return value;
}

/**
 * Which of the three sign-in views to open with: `?mode=signup` from the calculators'
 * "załóż darmowe konto", `?mode=reset` from a link that skips straight to the reset.
 * Anything else, including no parameter at all, opens the sign-in form.
 */
function lmAuthMode(search) {
  var params;
  try { params = new URLSearchParams(String(search || "")); } catch (e) { return "signin"; }
  var mode = params.get("mode");
  return mode === "signup" || mode === "reset" ? mode : "signin";
}

/** The /app/ URL that opens straight on the sign-up form and comes back to `next`. */
function lmSignupUrl(next) {
  var safe = lmSafeNext(next);
  return "/app/?mode=signup" + (safe ? "&next=" + encodeURIComponent(safe) : "");
}

/**
 * The mark on the header's account button.
 *
 * The button says "Moje konto" on all 130 pages whether or not anybody is signed in,
 * which is the one place the session is invisible to the visitor. A dot is enough, and
 * a dot is all the hint can honestly support: it cannot promise the token is still good.
 */
function lmMarkHeader() {
  var cta = document.querySelector(".nav-cta[data-account-cta]");
  if (!cta) return;
  var level = lmReadLevel();
  if (level === LM_LEVEL.GUEST) {
    cta.removeAttribute("data-level");
    cta.removeAttribute("title");
    return;
  }
  cta.setAttribute("data-level", level);
  if (typeof t === "function") {
    cta.title = t(level === LM_LEVEL.PRO ? "sess_header_pro" : "sess_header_in");
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", lmMarkHeader);
  document.addEventListener("lm-session", lmMarkHeader);
  // The head script already stamped the level from this key. Re-stamping on load catches
  // the one case it cannot: a page cached before the visitor signed in on another tab.
  document.addEventListener("DOMContentLoaded", lmMarkLevel);
  // The header's title comes out of the dictionary, so it has to be redrawn when /app/
  // switches language in place.
  document.addEventListener("langchange", lmMarkHeader);
}
