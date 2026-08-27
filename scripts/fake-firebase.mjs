#!/usr/bin/env node
/**
 * LiczMat — Firebase, as much of it as /app/ actually touches.
 *
 * `assets/app.js` imports the SDK from gstatic.com, which no test here may reach: the
 * agent container's egress proxy resets the connection, and a test that needed the real
 * network would be a test nobody could run. So three modules are served in its place —
 * firebase-app.js, firebase-auth.js and firebase-firestore.js, plus firebase-functions.js
 * since session 49, exactly the specifiers the page imports — and a Playwright route hands
 * them back instead of the CDN.
 *
 * It lives in its own file because two tests drive /app/: scripts/test-account-page.mjs,
 * which exercises the account screen itself, and scripts/test-qa.mjs, which walks the
 * whole product path through it. Two copies of a stub that has to match a real SDK's
 * behaviour is two copies free to disagree the first time either is corrected.
 *
 * What it cannot check is whether Firebase itself behaves as assumed. Every behaviour
 * encoded below was measured against the live project (2026-08-07 and 2026-08-13, with
 * throwaway accounts) and the measurement is noted next to the branch it produced.
 *
 * The accounts live in `window.__fbAccounts`, so a test can plant one with
 * `plan: "premium"` before the page loads and see the page come up as LiczMat Pro.
 * Every call the page makes is recorded in `window.__fbCalls`, which is how a test asks
 * "did it really ask for session persistence before signing in".
 */

export const FAKE_APP = `
export function initializeApp(config) { return { config }; }
`;

export const FAKE_AUTH = `
const S = (window.__fb = window.__fb || {
  accounts: window.__fbAccounts || {},
  calls: [],
  user: null,
  listeners: [],
});
window.__fbCalls = S.calls;
const log = (name, arg) => S.calls.push([name, arg === undefined ? null : arg]);
const fail = (code) => { const e = new Error(code); e.code = code; throw e; };

function emit() { S.listeners.forEach((fn) => fn(S.user)); }

/**
 * The two token methods, put onto a user object that was planted as plain JSON.
 *
 * A planted account cannot carry functions — it crosses into the page as JSON — so the
 * claims are a plain \`claims\` field on it and this is what turns them into the shape the
 * real SDK hands back. \`getIdTokenResult(true)\` is what /app/ calls before it decides
 * whether to fetch the admin panel (session 49), and the \`true\` is recorded, because
 * asking for a CACHED token there would mean a claim granted five minutes ago is invisible
 * for another hour.
 */
function withToken(u) {
  if (u && typeof u.getIdTokenResult !== "function") {
    u.getIdTokenResult = (force) => {
      log("idToken", Boolean(force));
      return Promise.resolve({ claims: { ...(u.claims || {}) } });
    };
    u.getIdToken = () => Promise.resolve("fake-id-token");
  }
  return u;
}
function setUser(u) { S.user = withToken(u); emit(); }

export function getAuth() {
  if (!S.auth) {
    S.auth = {
      get currentUser() { return S.user; },
      languageCode: null,
      __store: S,
    };
  }
  return S.auth;
}
export function onAuthStateChanged(auth, fn) {
  S.listeners.push(fn);
  fn(withToken(S.user));
  return () => {};
}

export const browserLocalPersistence = "local";
export const browserSessionPersistence = "session";
export function setPersistence(auth, mode) { log("setPersistence", mode); return Promise.resolve(); }

export function signInWithEmailAndPassword(auth, email, password) {
  log("signIn", email);
  const account = S.accounts[email];
  if (!account) return Promise.reject(Object.assign(new Error("x"), { code: "auth/user-not-found" }));
  if (account.password !== password) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/invalid-credential" }));
  }
  setUser(account.user);
  return Promise.resolve({ user: account.user });
}
export function createUserWithEmailAndPassword(auth, email, password) {
  log("createUser", email);
  if (S.accounts[email]) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/email-already-in-use" }));
  }
  if (String(password).length < 6) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/weak-password" }));
  }
  const user = {
    uid: "uid-" + Object.keys(S.accounts).length, email, emailVerified: false,
    displayName: "", providerData: [{ providerId: "password" }],
  };
  S.accounts[email] = { password, user };
  setUser(user);
  return Promise.resolve({ user });
}
export function signOut() { log("signOut"); setUser(null); return Promise.resolve(); }
export function sendPasswordResetEmail(auth, email) {
  log("resetMail", email);
  if (!email || email.indexOf("@") < 0) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/invalid-email" }));
  }
  return Promise.resolve();
}
export function sendEmailVerification() { log("verifyMail"); return Promise.resolve(); }
export function updateProfile(user, fields) {
  log("updateProfile", fields.displayName);
  Object.assign(user, fields);
  emit();
  return Promise.resolve();
}
export function updatePassword(user, password) {
  log("updatePassword", password);
  // Measured against the live backend: WEAK_PASSWORD below six characters.
  if (String(password).length < 6) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/weak-password" }));
  }
  S.accounts[user.email].password = password;
  return Promise.resolve();
}
export function verifyBeforeUpdateEmail() { log("updateEmail"); return Promise.resolve(); }
export function deleteUser() { log("deleteUser"); setUser(null); return Promise.resolve(); }
export function reauthenticateWithCredential(user, credential) {
  log("reauth", credential.password);
  // Measured against the live backend: signInWithPassword with the wrong password is
  // INVALID_LOGIN_CREDENTIALS, which the SDK surfaces as auth/invalid-credential.
  const account = S.accounts[user.email];
  if (!account || account.password !== credential.password) {
    return Promise.reject(Object.assign(new Error("x"), { code: "auth/invalid-credential" }));
  }
  return Promise.resolve();
}
export function reauthenticateWithPopup() { return Promise.resolve(); }
export class GoogleAuthProvider {}
export const EmailAuthProvider = { credential: (email, password) => ({ email, password }) };
export function signInWithPopup() {
  log("googlePopup");
  const user = {
    uid: "uid-google", email: "google@example.com", emailVerified: true,
    displayName: "Google Person", providerData: [{ providerId: "google.com" }],
  };
  S.accounts[user.email] = { password: null, user };
  setUser(user);
  return Promise.resolve({ user });
}
`;

export const FAKE_STORE = `
const DOCS = (window.__fbDocs = window.__fbDocs || new Map());
const key = (parts) => parts.join("/");

/* Live listeners on a single document, by path. The real SDK has them and /app/ now uses
   one on users/{uid}, because \`plan\` is written by the server and the page has no other
   way of hearing about it. window.__fbPushDoc() is how a test plays that server: it
   writes the document the way scripts/pro-admin.mjs or the Stripe webhook would, and the
   page has to notice without being reloaded. */
const DOC_SUBS = (window.__fbDocSubs = window.__fbDocSubs || new Map());
const docSnap = (path) => {
  const data = DOCS.get(path);
  return { exists: () => data !== undefined, data: () => data, metadata: { fromCache: false } };
};
function notifyDoc(path) {
  const subs = DOC_SUBS.get(path);
  if (subs) subs.forEach((fn) => fn(docSnap(path)));
}
window.__fbPushDoc = (path, data) => {
  if (data === null) DOCS.delete(path);
  else DOCS.set(path, { ...(DOCS.get(path) || {}), ...data });
  notifyDoc(path);
};
export function getFirestore() { return { DOCS }; }
export function enableIndexedDbPersistence() { return Promise.resolve(); }
export function doc(db, ...parts) { return { path: key(parts), kind: "doc" }; }
export function collection(db, ...parts) { return { path: key(parts), kind: "collection" }; }
export function query(ref) { return ref; }
export function orderBy() { return null; }
export function where() { return null; }
export function getDoc(ref) {
  const data = DOCS.get(ref.path);
  return Promise.resolve({ exists: () => data !== undefined, data: () => data });
}
export function setDoc(ref, data) {
  DOCS.set(ref.path, { ...data });
  notifyDoc(ref.path);
  return Promise.resolve();
}
export function updateDoc(ref, data) {
  DOCS.set(ref.path, { ...(DOCS.get(ref.path) || {}), ...data });
  notifyDoc(ref.path);
  return Promise.resolve();
}
export function deleteDoc(ref) {
  // The deployed rules still refuse a delete on users/{uid} (allow delete: if false) — measured
  // on 2026-08-13 against the live project, see MASTER_PLAN.md. window.__fbNoProfileDelete
  // turns that on, so the test can show both what a visitor meets today and what they
  // will meet once the rules in the app repo have actually been deployed.
  const isProfile = ref.path.indexOf("users/") === 0 && ref.path.split("/").length === 2;
  if (window.__fbNoProfileDelete && isProfile) {
    return Promise.reject(Object.assign(new Error("x"), { code: "permission-denied" }));
  }
  DOCS.delete(ref.path);
  return Promise.resolve();
}
export function getDocs(ref) {
  const rows = [];
  DOCS.forEach((value, path) => {
    const at = path.lastIndexOf("/");
    if (path.slice(0, at) === ref.path) rows.push({ id: path.slice(at + 1), ref: { path }, data: () => value });
  });
  return Promise.resolve({ docs: rows, forEach: (fn) => rows.forEach(fn) });
}
/* Live listeners on a collection, and the one piece of the real SDK's behaviour that
   /app/ depends on and no stub had: a snapshot says where it came from, and a snapshot
   whose documents did not change is only delivered to a listener that asked for the
   metadata.

   Measured in the shipped SDK (firebase-firestore.js 10.14.1, __PRIVATE_QueryListener):

       ia(e){ if(e.docChanges.length>0) return true;
              const i = this.ra && this.ra.hasPendingWrites !== e.hasPendingWrites;
              return !(!e.syncStateChanged && !i) && true === this.options.includeMetadataChanges }

   — so an event carrying nothing but a fromCache flip reaches a default listener never.
   That is what let /app/ hear "this came from the cache" once and never hear the answer,
   and it is why a stub that always said fromCache:false could not see the defect.

   window.__fbSync(fromCache) plays the connection: it re-delivers every collection
   listener's rows with the metadata set, exactly as the SDK does when its online state
   flips. */
const COLL_SUBS = (window.__fbCollSubs = window.__fbCollSubs || new Set());

function collRows(path) {
  const rows = [];
  DOCS.forEach((value, docPath) => {
    const at = docPath.lastIndexOf("/");
    if (docPath.slice(0, at) === path) rows.push({ id: docPath.slice(at + 1), data: () => value });
  });
  return rows;
}

/** A collection snapshot. The third argument is what docChanges() answers with. */
function collSnap(path, fromCache, changes) {
  const rows = collRows(path);
  return {
    forEach: (fn) => rows.forEach(fn),
    docChanges: () => changes,
    metadata: { fromCache: Boolean(fromCache), hasPendingWrites: false },
  };
}

window.__fbSync = (fromCache, changed) => {
  COLL_SUBS.forEach((sub) => {
    const changes = changed
      ? collRows(sub.path).map((doc) => ({ type: "added", doc }))
      : [];
    // ia() again: an event carrying no document change reaches only a listener that
    // asked for the metadata; one that carries a change reaches every listener.
    if (changes.length || sub.options.includeMetadataChanges) {
      sub.onNext(collSnap(sub.path, fromCache, changes));
    }
  });
};

export function onSnapshot(ref, ...rest) {
  // onSnapshot(ref, onNext, onError) and onSnapshot(ref, options, onNext, onError) are
  // both real signatures; the SDK tells them apart the same way, by the type of the
  // first argument after the reference.
  const options = typeof rest[0] === "object" && rest[0] !== null ? rest.shift() : {};
  const [onNext, onError] = rest;

  // Firestore pushes a permission-denied error into every live listener when the user
  // signs out or is deleted. window.__fbListeners lets the test fire that.
  (window.__fbListeners = window.__fbListeners || []).push(onError);

  // A listener on one document, which is what /app/ puts on users/{uid}.
  if (ref.kind === "doc") {
    const subs = DOC_SUBS.get(ref.path) || new Set();
    subs.add(onNext);
    DOC_SUBS.set(ref.path, subs);
    onNext(docSnap(ref.path));
    return () => subs.delete(onNext);
  }

  const sub = { path: ref.path, options, onNext };
  COLL_SUBS.add(sub);
  // The first snapshot lists every document as an addition, the way the real one does.
  // window.__fbFromCache is the returning visitor: Firestore hands a listener whatever is
  // in the local cache the moment it is attached, marked as not having come from the
  // server, and only then goes and asks. That is the ordinary online case for anybody who
  // has opened the page before, and the one the false "Brak sieci" was built on.
  onNext(collSnap(ref.path, Boolean(window.__fbFromCache),
    collRows(ref.path).map((doc) => ({ type: "added", doc }))));
  return () => COLL_SUBS.delete(sub);
}
`;

/**
 * firebase-functions.js — the callable SDK, as much of it as the admin panel touches.
 *
 * Session 49. `assets/admin.js` makes exactly one kind of call: `httpsCallable(fns,
 * "adminPlan")(payload)`. What the function answers is not decided here — it is planted in
 * `window.__fnAnswers` per action, and `<action>Error` plants a refusal instead. That is
 * deliberate: the decision half already has its own suite (scripts/test-admin-map.mjs), and
 * a stub that re-implemented it would be a second implementation free to disagree with the
 * one that ships. What a browser test can ask, and this shape lets it ask, is what the
 * panel SENT and what it DREW.
 *
 * The rejection is the callable SDK's own shape: `error.code` is `functions/<code>` and
 * `error.message` is the message the server threw — which is why `assets/admin.js` reads
 * the Polish sentence off the message rather than off the code.
 */
export const FAKE_FUNCTIONS = `
const S = (window.__fn = window.__fn || { calls: [], region: null });
window.__fnCalls = S.calls;

export function getFunctions(app, region) { S.region = region; window.__fnRegion = region; return { app, region }; }

export function httpsCallable(fns, name) {
  return (data) => {
    S.calls.push([name, data === undefined ? null : data]);
    const answers = window.__fnAnswers || {};
    const action = (data && data.action) || "";
    const failure = answers[action + "Error"];
    if (failure) {
      const e = new Error(failure);
      e.code = "functions/" + (failure === "not-admin" ? "permission-denied" : "invalid-argument");
      return Promise.reject(e);
    }
    if (!(action in answers)) {
      const e = new Error("not-admin");
      e.code = "functions/permission-denied";
      return Promise.reject(e);
    }
    return Promise.resolve({ data: answers[action] });
  };
}
`;
