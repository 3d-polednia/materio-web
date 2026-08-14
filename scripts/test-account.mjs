#!/usr/bin/env node
/**
 * LiczMat — the account system, tested.
 *
 *     node scripts/test-account.mjs
 *
 * Master plan, session 13: registration, sign-in, sign-out, password reset, the profile
 * and the user session, against the three levels of chapter II. This file is the half
 * that needs no browser: the level a visitor is on, what the rest of the site is told
 * about the session, where a `?next=` link may point, and the copy the account pages
 * spend in all four languages. The other half — the three sign-in views, the profile and
 * the tabs, driven in Chromium against a stubbed Firebase SDK — is
 * scripts/test-account-page.mjs.
 *
 * Same shape as scripts/test-calculators.mjs: no dependencies, plain `node`, exit 1 on
 * the first failure so it can gate a commit.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACCOUNT_LEVELS, LEVEL, LEVEL_ORDER, STATUS, accountLevelKeys, accountLevel, route,
  validateIA,
} from "../src/ia.mjs";
import { appMain } from "../src/app-pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Evaluate a browser script that has no exports and hand back the globals we need. */
function evalScript(file, returns, globals = {}) {
  const src = readFileSync(p(file), "utf8");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

const { I18N, LANGS } = evalScript("assets/i18n.js", ["I18N", "LANGS"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const CODES = LANGS.map((l) => l.code);
const DICT = {};
for (const lang of CODES) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/**
 * assets/account.js runs in a page. Node has no `document` and no `localStorage`, so it
 * gets the smallest stand-ins that let the real code run unmodified — the point is to
 * test the shipped file, not a copy of it.
 */
function loadAccount(store) {
  const backing = store || new Map();
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const document = {
    addEventListener() {},
    querySelector: () => null,
    dispatchEvent: (e) => events.push(e),
  };
  const api = evalScript("assets/account.js", [
    "LM_LEVEL", "LM_LEVEL_ORDER", "LM_PLAN_PRO", "LM_SESSION_KEY", "LM_REMEMBER_KEY",
    "lmAllows", "lmLevelOf", "lmReadLevel", "lmSignedIn", "lmWriteLevel",
    "lmReadRemember", "lmWriteRemember", "lmSafeNext", "lmAuthMode", "lmSignupUrl",
  ], {
    localStorage,
    document,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
  });
  return { ...api, store: backing, events };
}

/* ------------------------------------------------------------------ the runner */

let passed = 0;
const failures = [];
let section = "";

const head = (name) => { section = name; };

function check(name, cond, detail) {
  if (cond) { passed++; return true; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
  return false;
}

const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

/* ------------------------------------------------------------------ 1. the model */

head("1. chapter II — three levels, and only three");
{
  const problems = validateIA();
  check("validateIA() is happy with the architecture", problems.length === 0, problems.join("\n      "));

  eq("there are three account levels", ACCOUNT_LEVELS.length, 3);
  eq("in the order GOŚĆ → LICZMAT → LICZMAT PRO",
    ACCOUNT_LEVELS.map((l) => l.level).join(), LEVEL_ORDER.join());
  for (const entry of ACCOUNT_LEVELS) {
    check(`level "${entry.level}" says what it can do`, entry.can.length >= 2);
  }
  eq("only the Pro level names a page of its own",
    ACCOUNT_LEVELS.filter((l) => l.route).map((l) => l.level).join(), LEVEL.PRO);
  check("that page is /liczmat-pro/, and session 29 still has to build it",
    route(accountLevel(LEVEL.PRO).route).status === STATUS.PLANNED);
}

head("2. the level is derived from the profile, never asserted");
{
  const { lmLevelOf, LM_LEVEL } = loadAccount();
  const user = { uid: "u1" };
  const hour = 3600e3;

  eq("nobody signed in is a guest", lmLevelOf(null, null), LM_LEVEL.GUEST);
  eq("signed in with no profile document is LiczMat", lmLevelOf(user, null), LM_LEVEL.LICZMAT);
  eq("signed in with plan free is LiczMat", lmLevelOf(user, { plan: "free" }), LM_LEVEL.LICZMAT);
  eq("plan premium is Pro", lmLevelOf(user, { plan: "premium" }), LM_LEVEL.PRO);
  eq("premium with no end date stays Pro",
    lmLevelOf(user, { plan: "premium", planValidUntil: null }), LM_LEVEL.PRO);
  eq("premium valid until tomorrow is Pro",
    lmLevelOf(user, { plan: "premium", planValidUntil: 1000 + hour }, 1000), LM_LEVEL.PRO);
  eq("premium that ran out is LiczMat again",
    lmLevelOf(user, { plan: "premium", planValidUntil: 1000 }, 1000 + hour), LM_LEVEL.LICZMAT);

  // The rules refuse a client write to `plan` (config/firebase/firestore.rules), so a
  // forged value can only ever come back from the server. What the page must not do is
  // invent a level out of anything else it has lying around.
  eq("a made-up plan value is not Pro", lmLevelOf(user, { plan: "pro" }), LM_LEVEL.LICZMAT);
  eq("a made-up plan value is not Pro either", lmLevelOf(user, { plan: "PREMIUM" }), LM_LEVEL.LICZMAT);
}

head("3. lmAllows() ranks the levels the way src/ia.mjs does");
{
  const { lmAllows, LM_LEVEL } = loadAccount();
  eq("a guest may do guest things", lmAllows(LM_LEVEL.GUEST, LM_LEVEL.GUEST), true);
  eq("a guest may not do LiczMat things", lmAllows(LM_LEVEL.GUEST, LM_LEVEL.LICZMAT), false);
  eq("LiczMat covers guest", lmAllows(LM_LEVEL.LICZMAT, LM_LEVEL.GUEST), true);
  eq("LiczMat is not Pro", lmAllows(LM_LEVEL.LICZMAT, LM_LEVEL.PRO), false);
  eq("Pro covers everything", lmAllows(LM_LEVEL.PRO, LM_LEVEL.LICZMAT), true);
}

/* ------------------------------------------------------------------ 4. the session */

head("4. what the other 129 pages are told");
{
  const acc = loadAccount();
  eq("a browser that never signed in reads as a guest", acc.lmReadLevel(), acc.LM_LEVEL.GUEST);
  eq("and lmSignedIn() says no", acc.lmSignedIn(), false);

  acc.lmWriteLevel(acc.LM_LEVEL.LICZMAT);
  eq("signing in stores the level", acc.store.get("liczmat-signed-in"), "liczmat");
  eq("and reads back", acc.lmReadLevel(), "liczmat");
  eq("and lmSignedIn() says yes", acc.lmSignedIn(), true);
  eq("the write announces itself so the header can redraw", acc.events.length, 1);
  eq("with the new level on the event", acc.events[0].detail.level, "liczmat");

  acc.lmWriteLevel(acc.LM_LEVEL.PRO);
  eq("Pro is stored as Pro", acc.lmReadLevel(), "pro");

  acc.lmWriteLevel(acc.LM_LEVEL.GUEST);
  eq("signing out removes the key rather than storing 'guest'",
    acc.store.has("liczmat-signed-in"), false);
  eq("and reads back as a guest", acc.lmReadLevel(), acc.LM_LEVEL.GUEST);

  // The key held "1" before this session; a browser that still has it is signed in.
  const legacy = loadAccount(new Map([["liczmat-signed-in", "1"]]));
  eq("the value written before session 13 still means signed in", legacy.lmSignedIn(), true);
  eq("and is read as the free level", legacy.lmReadLevel(), "liczmat");

  const junk = loadAccount(new Map([["liczmat-signed-in", "admin"]]));
  eq("a value nobody writes is not a level", junk.lmReadLevel(), "guest");
  eq("and does not count as signed in", junk.lmSignedIn(), false);
}

head("5. how long the session lasts, per device");
{
  const acc = loadAccount();
  eq("Firebase's own default — stay signed in — is the default here too",
    acc.lmReadRemember(), true);
  acc.lmWriteRemember(false);
  eq("declining is stored", acc.store.get("liczmat-remember"), "0");
  eq("and read back", acc.lmReadRemember(), false);
  acc.lmWriteRemember(true);
  eq("and can be taken back", acc.lmReadRemember(), true);
}

head("6. ?next= may only ever point back into this site");
{
  const { lmSafeNext } = loadAccount();
  eq("a path is fine", lmSafeNext("/kalkulatory/plytki/"), "/kalkulatory/plytki/");
  eq("a path with a query is fine", lmSafeNext("/materialy/?m=gres-60"), "/materialy/?m=gres-60");
  eq("nothing is nothing", lmSafeNext(""), "");
  eq("undefined is nothing", lmSafeNext(undefined), "");
  eq("another site is refused", lmSafeNext("https://evil.example/"), "");
  eq("a protocol-relative URL is refused", lmSafeNext("//evil.example/"), "");
  eq("a backslash pair is refused", lmSafeNext("/\\evil.example/"), "");
  eq("a scheme after the slash is refused", lmSafeNext("/javascript:alert(1)"), "");
  eq("a bare relative path is refused", lmSafeNext("kalkulatory/"), "");
  eq("a fragment-only value is refused", lmSafeNext("#wynik"), "");
}

head("7. the sign-up form can be linked to directly");
{
  const { lmAuthMode, lmSignupUrl } = loadAccount();
  eq("no parameter opens the sign-in form", lmAuthMode(""), "signin");
  eq("?mode=signup opens the sign-up form", lmAuthMode("?mode=signup"), "signup");
  eq("?mode=reset opens the reset form", lmAuthMode("?mode=reset"), "reset");
  eq("with another parameter alongside", lmAuthMode("?next=%2F&mode=signup"), "signup");
  eq("an unknown mode falls back to signing in", lmAuthMode("?mode=admin"), "signin");

  eq("the calculators' link opens the sign-up form and comes back",
    lmSignupUrl("/kalkulatory/plytki/"), "/app/?mode=signup&next=%2Fkalkulatory%2Fplytki%2F");
  eq("an unsafe origin never reaches the URL",
    lmSignupUrl("https://evil.example/"), "/app/?mode=signup");
}

/* ------------------------------------------------------------------ 8. the page */

head("8. /app/ carries the account system in every language");
{
  // The page is language-neutral: it ships one copy of the markup and swaps the text in
  // place. So the markup is built once, and the copy is checked for all four.
  const html = appMain(tr("pl"));

  const has = (needle, what) => check(what, html.includes(needle), `not in the page: ${needle}`);
  const hasNot = (needle, what) => check(what, !html.includes(needle), `still in the page: ${needle}`);

  has('data-auth-view="signin"', "the sign-in view exists");
  has('data-auth-view="signup"', "the sign-up view exists");
  has('data-auth-view="reset"', "the password-reset view exists");
  has('id="signin-form"', "sign-in is its own form");
  has('id="signup-form"', "sign-up is its own form");
  has('id="reset-form"', "resetting has its own form, and its own e-mail field");
  has('id="reset-email"', "which is where the address goes");
  // Hidden on the owner's word (2026-08-14): GOOGLE_SIGN_IN in src/app-pages.mjs. The page
  // must offer no way in through Google at all, so the button is absent rather than styled
  // out of sight — an element that is only invisible is still clickable from a script.
  hasNot('id="auth-google"', "Google sign-in is not offered");
  hasNot('id="auth-google-box"', "and neither is the separator above it");
  has('id="app-signout"', "signing out is still there");
  has('id="prof-signout"', "and again in the profile");
  has('data-panel="profile"', "the profile is a panel of its own");
  has('id="prof-name"', "the profile can name the account");
  has('id="prof-remember"', "and decide how long the session lasts");
  has('id="app-next"', "and lead back to where the visitor came from");

  // The sign-up form asks the browser to offer a new password, not the saved one. This
  // was one field shared by both modes before, so a browser filled in the old password
  // on the form meant to create an account.
  const signup = html.slice(html.indexOf('data-auth-view="signup"'), html.indexOf('data-auth-view="reset"'));
  check("the sign-up password field asks for a new password",
    signup.includes('autocomplete="new-password"'));
  const signin = html.slice(html.indexOf('data-auth-view="signin"'), html.indexOf('data-auth-view="signup"'));
  check("the sign-in password field asks for the saved one",
    signin.includes('autocomplete="current-password"'));

  // Every level of chapter II is on the page, twice: once for a guest deciding whether
  // to sign up, once inside the profile.
  for (const entry of ACCOUNT_LEVELS) {
    const count = html.split(`data-level="${entry.level}"`).length - 1;
    eq(`the ${entry.level} card is on the page twice`, count, 2);
  }
  check("the guest card is the marked one while signed out",
    html.includes(`data-level="${LEVEL.GUEST}" data-current="1"`));
  check("Pro says it is in preparation rather than offering a dead button",
    html.includes('class="lvl-soon"'));
  // /liczmat-pro/ does not exist until session 29, and nothing grants the plan yet
  // (FIRESTORE_SYNC §9.2), so the card must not carry a link or a button of any kind.
  const proCards = html.split('data-level="pro"').slice(1)
    .map((rest) => rest.slice(0, rest.indexOf("</article>")));
  eq("both copies of the Pro card were found", proCards.length, 2);
  for (const card of proCards) {
    check("the Pro card offers nothing to click", !/<a |<button/.test(card), card.trim().slice(0, 120));
  }

  // Four tabs, each pointing at the panel it opens. "Pomieszczenia" was the fifth until
  // the owner asked for it to be folded into the project it belongs to (chapter XVIII):
  // a room is an element of a project, and two tabs made it look like two subjects.
  for (const id of ["projects", "sync", "profile", "account"]) {
    check(`the "${id}" tab points at its panel`,
      html.includes(`id="tab-${id}" aria-controls="panel-${id}"`));
    check(`the "${id}" panel points back at its tab`,
      html.includes(`id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}"`));
  }
  check("there is no rooms tab any more", !html.includes('id="tab-rooms"'));
  check("nor a rooms panel", !html.includes('id="panel-rooms"'));
  // The rooms are still on the page: the ones a project owns are drawn inside its row by
  // assets/app.js, and the ones nobody assigned — which is every room made on the phone,
  // because SyncContract.roomToDoc() has no projectId to send — get their own list.
  check("the unassigned rooms have a list of their own", html.includes('id="room-list"'));
  check("and it says why a room lands there", html.includes(DICT.pl.app_rooms_loose_d));
}

head("9. the copy exists in all four languages");
{
  // Everything the account pages render through a key. A key nobody translated shows up
  // as "prof_session_kept" on the page in that one language, which the build's own
  // check does not catch for keys the markup asks for at runtime.
  const KEYS = [
    ...accountLevelKeys(),
    "acc_levels_t", "acc_levels_d", "acc_you_are",
    "app_title", "app_lead", "app_signin", "app_signup", "app_signout",
    "app_signup_t", "app_signup_d", "app_signup_free", "app_password_rule",
    "app_reset_t", "app_reset_d", "app_reset_send", "app_back_signin", "app_reset_sent",
    "app_forgot", "app_switch_signup", "app_switch_signin",
    "app_remember", "app_back_to", "app_signed_out", "app_tabs_label", "app_tab_profile",
    "prof_title", "prof_facts", "prof_provider", "prof_created", "prof_seen",
    "prof_name_t", "prof_name_d", "prof_name", "prof_name_saved",
    "prof_level_t", "prof_level_d",
    "prof_session_t", "prof_session_d", "prof_session_kept", "prof_session_tab",
    "sess_header_in", "sess_header_pro",
    "app_provider_google", "app_provider_password", "app_verified", "app_unverified",
    "app_err_credentials", "app_err_email", "app_err_password", "app_err_inuse",
    "app_err_recent_login", "app_err_popup", "app_err_provider_off", "app_err_unknown",
    "ck_p_signed_in", "ck_p_remember",
    "calc_save_in", "calc_save_out", "calc_save_link",
  ];
  for (const lang of CODES) {
    const missing = KEYS.filter((k) => !DICT[lang][k]);
    check(`${lang}: every account key is translated`, missing.length === 0, missing.join(", "));
    const same = KEYS.filter((k) => lang !== "pl" && DICT[lang][k] === DICT.pl[k]
      // A brand name is the same in every language, and so is the level named after it.
      // "Profil" happens to be the German and Polish word for the same thing.
      && !["acc_liczmat_t", "acc_pro_t", "app_provider_google", "prof_title",
        "app_tab_profile"].includes(k));
    check(`${lang}: none of them is the Polish text left in place`, same.length === 0, same.join(", "));
  }
}

head("10. the level names match what the rest of the site calls them");
{
  // The home page has said "Bez konta / Darmowe konto / Dla fachowców" since session 6
  // (lvl_<level>, the audience of a door). The account page names the levels themselves.
  // Two different jobs, two different keys — but the Pro one has to stay the product's
  // name, or the page tells somebody they are on a level nothing else mentions.
  for (const lang of CODES) {
    eq(`${lang}: the free level is called LiczMat`, DICT[lang].acc_liczmat_t, "LiczMat");
    eq(`${lang}: the paid level is called LiczMat Pro`, DICT[lang].acc_pro_t, "LiczMat Pro");
    check(`${lang}: the door labels are still their own thing`,
      DICT[lang].lvl_liczmat !== DICT[lang].acc_liczmat_t);
  }
}

/* ------------------------------------------------------------------ report */

console.log(`\naccount: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
