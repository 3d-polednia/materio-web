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
 *   - the authorized-domains list in Firebase Auth, which contains materio-app.com,
 *     www.materio-app.com and localhost — Auth refuses to work from anywhere else.
 *
 * ─── THE DOMAIN MOVED AND THESE TWO LISTS DID NOT (2026-08-14) ──────────────
 * The site is served from liczmat.com now; both controls below still name only the old
 * host, and both are console settings that no commit here can change. Until the owner
 * edits them, /app/ signs nobody in from the new domain:
 *   - Firebase console → Authentication → Settings → Authorized domains: add
 *     `liczmat.com` and `www.liczmat.com`. Without it every sign-in call comes back
 *     `auth/unauthorized-domain`. Keep materio-502513.firebaseapp.com on the list — the
 *     Google popup runs its handler there.
 *   - Google Cloud console → Credentials → this browser key → HTTP referrers: add
 *     `https://liczmat.com/*` and `https://www.liczmat.com/*`. Keep
 *     `https://materio-502513.firebaseapp.com/*` and `https://materio-502513.web.app/*`,
 *     which is what made the Google popup work on 2026-08-13. The referrer restriction
 *     does not protect the data (the rules do); it stops another site from running up
 *     quota on this project's bill.
 * Leaving the old entries in place costs nothing and keeps materio-app.com working if
 * it is ever pointed back at the site.
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
