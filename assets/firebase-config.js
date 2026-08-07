/* Materio website — Firebase Web configuration for /app/ and /p/.
 *
 * ─── HOW TO FILL THIS IN ────────────────────────────────────────────────────
 * Firebase console → project `materio-502513` → Project settings → General →
 * "Your apps" → add (or open) a **Web app** → "SDK setup and configuration" →
 * "Config". Copy the six values into the object below and commit the file.
 *
 * The two values that are not already known are `apiKey` and `appId`; the rest are
 * fixed by the project and are pre-filled.
 *
 * ─── IS THIS A SECRET? ──────────────────────────────────────────────────────
 * No. A Firebase Web apiKey is a public project identifier, not a credential — it
 * ships in the JavaScript of every Firebase web app there is. What actually protects
 * the data is the pair of controls already in place:
 *   - the security rules (config/firebase/firestore.rules in the app repo), which let
 *     only a document's owner read or write it, and
 *   - the authorized-domains list in Firebase Auth, which already contains
 *     materio-app.com, www.materio-app.com and localhost.
 * Restrict the browser key in Google Cloud console → Credentials → HTTP referrers to
 * `materio-app.com/*` as well, so nobody can bill your project from another site.
 *
 * Until the two placeholders are replaced, /app/ shows "Firebase configuration
 * missing" instead of a broken sign-in form, and /p/ says the estimate cannot load.
 */

export const FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_WEB_API_KEY",
  authDomain: "materio-502513.firebaseapp.com",
  projectId: "materio-502513",
  storageBucket: "materio-502513.firebasestorage.app",
  messagingSenderId: "630563506659",
  appId: "REPLACE_WITH_WEB_APP_ID",
};

/** False while the placeholders are still in place, so the pages can say so plainly. */
export const FIREBASE_READY =
  !FIREBASE_CONFIG.apiKey.startsWith("REPLACE_") &&
  !FIREBASE_CONFIG.appId.startsWith("REPLACE_");

/** Pinned so a new SDK release cannot change behaviour without a commit here. */
export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.14.1";

/** Bumped in lockstep with SyncContract.SCHEMA_VERSION in the app. */
export const SCHEMA_VERSION = 1;
