/* LiczMat website — Firebase Web configuration for /app/ and /p/.
 *
 * These are the real values for the Web app registered in project `materio-502513`
 * (Firebase console → Project settings → General → Your apps → "materio-app.com").
 * To read them again: that console page, or the Management API endpoint
 * `GET https://firebase.googleapis.com/v1beta1/projects/materio-502513/webApps/<appId>/config`.
 *
 * ─── IS THIS A SECRET? ──────────────────────────────────────────────────────
 * No. A Firebase Web apiKey is a public project identifier, not a credential — it
 * ships in the JavaScript of every Firebase web app there is, and it cannot be kept
 * private in a browser app. What actually protects the data is the pair of controls
 * already in place:
 *   - the security rules (config/firebase/firestore.rules in the app repo), which let
 *     only a document's owner read or write it, and
 *   - the authorized-domains list in Firebase Auth, which Auth refuses to work from
 *     anywhere outside. What is on it is read back in the next block rather than
 *     repeated here: a list written down twice is a list free to go stale.
 *
 * ─── THE DOMAIN MOVED, AND BOTH CONSOLE LISTS HAVE CAUGHT UP (2026-08-26) ───
 * The site is served from liczmat.com. For twelve days after the move neither of the two
 * Google console lists named it, and /app/ could sign nobody in from the new host; the
 * owner has since fixed both, and this is the measurement rather than an assumption —
 * the same accounts:signInWithPassword call, sent with three different Referer headers:
 *     https://liczmat.com/app/       → 400 INVALID_LOGIN_CREDENTIALS
 *     https://www.liczmat.com/app/   → 400 INVALID_LOGIN_CREDENTIALS
 *     https://materio-app.com/app/   → 400 INVALID_LOGIN_CREDENTIALS
 * 400 is the key passing and Auth reaching the password check; the 403
 * API_KEY_HTTP_REFERRER_BLOCKED the first two used to answer is gone. A referrer that is
 * on no list still answers 403, so the restriction is still doing its job. And the
 * authorized-domains list, which could not be read at all while the key was restricted,
 * now reads back through the same key:
 *     materio-502513.firebaseapp.com, materio-502513.web.app, materio-app.com,
 *     www.materio-app.com, localhost, liczmat.com, www.liczmat.com
 * The two lists are separate controls and both matter: the browser key's Website
 * restrictions gate every Identity Toolkit call (sign-up, e-mail sign-in, password
 * reset), while Firebase Auth's authorized domains govern the OAuth popup and the
 * continueUrl on an e-mail action link. Neither is in this repository, and no commit here
 * can change either. If they are ever edited again, KEEP every entry above:
 * materio-502513.firebaseapp.com is where the Google popup runs its handler (2026-08-13),
 * and leaving the materio-app.com pair in place costs nothing.
 *
 * NOT wired up on purpose: the Web app also carries a `measurementId`
 * (G-E6QV42MJNQ) for Firebase Analytics. The site already loads GA4 as G-22PS16K79V
 * behind the consent banner; adding a second tracker would mean a second stream and a
 * privacy-policy change for no benefit. Leave it out unless that changes.
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBruPqs3ZLmZnuZuC2uRJNVu2GzMFVGkUQ",
  authDomain: "materio-502513.firebaseapp.com",
  projectId: "materio-502513",
  storageBucket: "materio-502513.firebasestorage.app",
  messagingSenderId: "630563506659",
  appId: "1:630563506659:web:ea7acbe0a3f9933689f8d6",
};

/**
 * False while a placeholder is still in place, so the pages can say so plainly instead
 * of showing a sign-in form that cannot work. Kept after the real values landed: it is
 * what makes a fork, or a half-finished config edit, fail with a readable message.
 */
export const FIREBASE_READY =
  !FIREBASE_CONFIG.apiKey.startsWith("REPLACE_") &&
  !FIREBASE_CONFIG.appId.startsWith("REPLACE_");

/** Pinned so a new SDK release cannot change behaviour without a commit here. */
export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.14.1";

/** Bumped in lockstep with SyncContract.SCHEMA_VERSION in the app. */
export const SCHEMA_VERSION = 1;
