#!/usr/bin/env node
/**
 * LiczMat — Firebase, as much of it as /app/ actually touches.
 *
 * `assets/app.js` imports the SDK from gstatic.com, which no test here may reach: the
 * agent container's egress proxy resets the connection, and a test that needed the real
 * network would be a test nobody could run. So three modules are served in its place —
 * firebase-app.js, firebase-auth.js and firebase-firestore.js, exactly the specifiers
 * the page imports — and a Playwright route hands them back instead of the CDN.
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
function setUser(u) { S.user = u; emit(); }

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
export function onAuthStateChanged(auth, fn) { S.listeners.push(fn); fn(S.user); return () => {}; }

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
export function setDoc(ref, data) { DOCS.set(ref.path, { ...data }); return Promise.resolve(); }
export function updateDoc(ref, data) {
  DOCS.set(ref.path, { ...(DOCS.get(ref.path) || {}), ...data });
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
export function onSnapshot(ref, onNext, onError) {
  // Firestore pushes a permission-denied error into every live listener when the user
  // signs out or is deleted. window.__fbListeners lets the test fire that.
  (window.__fbListeners = window.__fbListeners || []).push(onError);
  const rows = [];
  DOCS.forEach((value, path) => {
    const at = path.lastIndexOf("/");
    if (path.slice(0, at) === ref.path) rows.push({ id: path.slice(at + 1), data: () => value });
  });
  onNext({ forEach: (fn) => rows.forEach(fn), metadata: { fromCache: false } });
  return () => {};
}
`;
