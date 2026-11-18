/* LiczMat website — automatic account sync on the full account pages (2026-09-26).
 *
 * Loaded as a module by /projekty/, /kosztorys/, /moje-materialy/, /klienci/, /wyceny/ and
 * /terminarz/ in every language, and since 2026-09-27 by every calculator page, where a
 * signed-in visitor saves results (that page lacks the Pro store; see incrementalPush()). It does nothing for a visitor the account hint says is
 * not signed in — no SDK download, no network — and otherwise picks up the session /app/
 * left behind and runs assets/account-sync.js in its page mode (see the head of that file).
 * A workspace that is somebody else's copy, or has never been claimed, is left alone: that
 * choice is made on /app/, where the visitor can see it.
 */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";
import { FULL_PULL_KEY_PREFIX } from "./account-sync.js";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * A call to the server that has not answered in this long is reported as failed.
 *
 * Without a limit a share or calendar button waited forever on a call that never came back
 * (audit AUDYT3 L1: a refused network left "Udostępnij" spinning with no word). The error
 * carries `code: "timeout"`, which the buttons turn into err_timeout.
 */
const CALL_LIMIT = 20000;
function inTime(promise) {
  let timer = 0;
  const limit = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "timeout" })), CALL_LIMIT);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

/**
 * The sync is on hold, and every account page says so (audit AUDYT3 L1).
 *
 * The choice itself stays on /app/ under Synchronizacja, where the counts are; this bar only
 * makes the state visible where people work. It used to be visible on that one tab, so an
 * hour of work could go by with nothing reaching the account and nothing on screen saying it.
 */
function showBlocked(on) {
  const old = document.getElementById("lm-sync-blocked");
  if (!on) { if (old) old.remove(); return; }
  if (old || typeof t !== "function") return;
  const main = document.querySelector("main");
  if (!main) return;
  const bar = document.createElement("div");
  bar.id = "lm-sync-blocked";
  bar.className = "result show err sync-blocked";
  bar.setAttribute("role", "status");
  const text = document.createElement("p");
  text.textContent = t("sync_blocked_bar");
  const link = document.createElement("a");
  link.className = "btn btn-ghost btn-go";
  link.href = "/app/#synchronizacja";
  link.textContent = t("sync_blocked_go");
  bar.append(text, link);
  main.prepend(bar);
}

async function start() {
  if (typeof window !== "undefined" && window.__lmAccountSyncRunning) return;

  // The account hint is intentionally checked before any Firebase SDK import.
  if (!FIREBASE_READY || typeof lmSignedIn !== "function") return;
  if (!lmSignedIn()) {
    // Signed out now, signed in later in another tab: start then, so this page confirms the
    // level (and syncs) without a reload. Otherwise a Pro action here would wait for a
    // confirmation nobody is going to send.
    const later = (e) => {
      if (e.key !== "liczmat-signed-in" || !lmSignedIn()) return;
      window.removeEventListener("storage", later);
      start().catch((err) => { if (typeof lmConfirmFail === "function") lmConfirmFail(err); });
    };
    window.addEventListener("storage", later);
    return;
  }
  if (typeof window !== "undefined") window.__lmAccountSyncRunning = true;

  const renderedLevel = typeof lmReadLevel === "function" ? lmReadLevel() : "guest";
  let firstEmissionHandled = false;
  const confirmTimer = setTimeout(() => {
    if (!firstEmissionHandled) {
      firstEmissionHandled = true;
      if (typeof lmConfirmFail === "function") {
        lmConfirmFail(Object.assign(new Error("timeout"), { code: "timeout" }));
      }
    }
  }, CALL_LIMIT);

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
    sync.claimEmpty(uid);
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
  const stop = () => { activeUid = ""; sync.setUid(null); delete window.lmAccount; };
  window.addEventListener("storage", (e) => {
    if (!activeUid) return;
    if (e.key === null) return stop();
    if (e.key === "liczmat-signed-in" && !lmSignedIn()) return stop();
    if (e.key === "liczmat-sync-account" && e.newValue !== activeUid) stop();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && activeUid) reconcile(activeUid).catch(() => {});
  });
  authMod.onAuthStateChanged(auth, async (user) => {
    activeUid = user && user.uid || "";
    sync.setUid(activeUid);
    delete window.lmAccount;
    showBlocked(!!activeUid && sync.blockedWorkspace());

    if (!user) {
      if (!firstEmissionHandled) {
        firstEmissionHandled = true;
        clearTimeout(confirmTimer);
        const level = typeof LM_LEVEL === "object" && LM_LEVEL ? LM_LEVEL.GUEST : "guest";
        if (typeof lmWriteLevel === "function" && lmReadLevel() !== level) lmWriteLevel(level);
        if (level !== renderedLevel) {
          window.dispatchEvent(new CustomEvent("lmlevelchange", { detail: { level } }));
        }
        if (typeof lmConfirmLevel === "function") lmConfirmLevel(level);
      }
      return;
    }

    const uid = activeUid;
    if (!sync.blockedWorkspace()) reconcile(uid).catch(() => {});
    // The level is confirmed from users/{uid} even when the workspace in this browser is
    // somebody else's copy: the plan belongs to the account, not to the workspace, and a
    // confirmation that waited on the workspace could be skipped by planting a foreign
    // `liczmat-sync-account`. The page API (today: the share link on the project view)
    // waits for the same read — never the copy hint, because a share stamps it (see
    // shareProject() in assets/account-sync.js). It pushes first, so a project made on
    // this page a moment ago exists in Firestore before it is published.
    let level;
    try {
      const snap = await inTime(storeMod.getDoc(storeMod.doc(db, "users", uid)));
      if (activeUid !== uid) return;
      level = typeof lmLevelOf === "function"
        ? lmLevelOf(user, snap.exists() ? snap.data() : {})
        : (typeof LM_LEVEL === "object" && LM_LEVEL ? LM_LEVEL.LICZMAT : "liczmat");
      if (!firstEmissionHandled) {
        firstEmissionHandled = true;
        clearTimeout(confirmTimer);
      }
      // Written only when it moves: lmWriteLevel() fires lm-session and every Pro screen
      // redraws on it, which would take what somebody is typing out of a field.
      if (typeof lmWriteLevel === "function" && lmReadLevel() !== level) lmWriteLevel(level);
      if (level !== renderedLevel) {
        window.dispatchEvent(new CustomEvent("lmlevelchange", { detail: { level } }));
      }
      if (typeof lmConfirmLevel === "function") lmConfirmLevel(level);
    } catch (err) {
      if (!firstEmissionHandled) {
        firstEmissionHandled = true;
        clearTimeout(confirmTimer);
        if (typeof lmConfirmFail === "function") lmConfirmFail(err);
      }
      return;
    }
    if (activeUid !== uid || sync.blockedWorkspace()) return;
    {
      window.lmAccount = {
        calendarFeed: (action) => inTime((async () => {
          const { getFunctions, httpsCallable } = await import(`${FIREBASE_SDK}/firebase-functions.js`);
          const result = await httpsCallable(getFunctions(app, "europe-central2"), "calendarFeedToken")({ action });
          return result.data.token;
        })()),
        shareProject: (projectId) => inTime((async () => {
          await sync.incrementalPush(uid).catch(() => false);
          return sync.shareProject(projectId, level);
        })()),
        shareQuote: (quoteId, snapshot) => inTime(sync.shareQuote(quoteId, snapshot, level)),
        unshareQuote: (quoteId) => inTime(sync.unshareQuote(quoteId)),
        uid,
      };
      document.dispatchEvent(new CustomEvent("lm-account-ready"));
    }
  });
}

start().catch((err) => {
  if (typeof lmConfirmFail === "function") lmConfirmFail(err);
});
