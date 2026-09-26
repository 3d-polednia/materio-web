/* LiczMat website — automatic account sync on the full account pages (2026-09-26).
 *
 * Loaded as a module by /projekty/, /kosztorys/, /moje-materialy/, /klienci/, /wyceny/ and
 * /terminarz/ in every language. It does nothing for a visitor the account hint says is
 * not signed in — no SDK download, no network — and otherwise picks up the session /app/
 * left behind and runs assets/account-sync.js in its page mode (see the head of that file).
 * A workspace that is somebody else's copy, or has never been claimed, is left alone: that
 * choice is made on /app/, where the visitor can see it.
 */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";
import { FULL_PULL_KEY_PREFIX } from "./account-sync.js";

const FIVE_MINUTES = 5 * 60 * 1000;

async function start() {
  // The account hint is intentionally checked before any Firebase SDK import.
  if (!FIREBASE_READY || typeof lmSignedIn !== "function" || !lmSignedIn()) return;
  const [{ initializeApp }, authMod, storeMod, { createAccountSync }] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
    import("./account-sync.js"),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);
  const db = storeMod.getFirestore(app);
  try { await storeMod.enableIndexedDbPersistence(db); } catch (e) { /* another tab or no IndexedDB */ }
  const sync = createAccountSync({ fb: { ...authMod, ...storeMod }, db, auth });
  let activeUid = "";

  const pullKey = (uid) => `${FULL_PULL_KEY_PREFIX}${uid}`;
  const dueForPull = (uid) => {
    try { return Date.now() - (Number(localStorage.getItem(pullKey(uid))) || 0) >= FIVE_MINUTES; }
    catch (e) { return true; }
  };
  const markPulled = (uid) => { try { localStorage.setItem(pullKey(uid), String(Date.now())); } catch (e) {} };
  const reconcile = async (uid) => {
    if (!uid || uid !== activeUid || sync.blockedWorkspace()) return;
    if (dueForPull(uid)) {
      const ok = await sync.syncPullAll(uid);
      if (!ok || uid !== activeUid) return;
      markPulled(uid);
    }
    if (!sync.setSyncAccount(uid)) return;
    await sync.incrementalPush(uid);
  };

  ["workspacechange", "crmchange", "ownmaterialschange"].forEach((name) => document.addEventListener(name, sync.armUpSync));
  // Another tab signing out, deleting the account or emptying this browser removes the
  // hint or the sync stamp; an armed push here must not go on writing into that account.
  const stop = () => { activeUid = ""; sync.setUid(null); };
  window.addEventListener("storage", (e) => {
    if (!activeUid) return;
    if (e.key === null) return stop();
    if (e.key === "liczmat-signed-in" && !lmSignedIn()) return stop();
    if (e.key === "liczmat-sync-account" && e.newValue !== activeUid) stop();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && activeUid) reconcile(activeUid).catch(() => {});
  });
  authMod.onAuthStateChanged(auth, (user) => {
    activeUid = user && user.uid || "";
    sync.setUid(activeUid);
    if (!activeUid || sync.blockedWorkspace()) return;
    reconcile(activeUid).catch(() => {});
  });
}

start().catch(() => {});
