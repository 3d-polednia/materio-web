#!/usr/bin/env node
/**
 * LiczMat — the Free/Pro model, tested.
 *
 *     node scripts/test-plan.mjs
 *
 * Master plan, session 21 (LICZMAT PRO: FUNDAMENT): the four things it asks to be
 * prepared, each of them checked here —
 *
 *   uprawnienia    LM_FEATURES in assets/plan.js: every feature at exactly one of
 *                  chapter II's levels, every route it names real, and the table in
 *                  agreement with src/ia.mjs about which pages are PRO.
 *   feature gating lmCan() and lmGate(): the answer for every feature at every level,
 *                  including the two ways a gate can be written wrong — an unknown id
 *                  that answers "yes", and a gate that opens for the level below it.
 *   status planu   lmPlanStatus(): free, Pro, Pro with an end date, Pro that ran out,
 *                  and a signed-out visitor who has no plan at all rather than a free one.
 *   struktura Pro  proModules() and the panel /app/ renders from it: chapter XXV's
 *                  "Klienci / Dostępne w LiczMat Pro", in four languages, with no link
 *                  to a page session 29 has not built.
 *
 * Dependency-free, plain `node`, exit 1 on failure — the same shape as
 * scripts/test-account.mjs, which this sits next to: that one owns the session and the
 * level, this one owns the plan and the permissions.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LEVEL, LEVEL_ORDER, ROUTES, STATUS, route, validateIA } from "../src/ia.mjs";
import { LANGS as SITE_LANGS, urlClients } from "../src/site.mjs";
import { proModules, proKeys, proPanel, proModuleCard, proGate } from "../src/pro.mjs";
import { appMain, appProKeys } from "../src/app-pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Evaluate browser scripts as one scope — what two <script> tags do — and hand back globals. */
function evalScript(file, returns) {
  const src = [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
  return new Function(`${src}\nreturn {${returns.join(",")}};`)();
}

const { I18N, LANGS } = evalScript("assets/i18n.js", ["I18N", "LANGS"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const CODES = LANGS.map((l) => l.code);
const DICT = {};
for (const lang of CODES) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/** The shipped files, evaluated in the order the page loads them. */
const PLAN = evalScript(["assets/account.js", "assets/plan.js"], [
  "LM_LEVEL", "LM_PLAN", "LM_FEATURES", "lmPlanStatus", "lmFeature", "lmFeaturesAt",
  "lmCan", "lmGate", "lmLevelOf", "LM_PRO_LOCKED", "LM_PRO_PREVIEW_KEY", "lmFeatureState",
  "lmPaywall", "lmProPreview", "lmSetProPreview",
]);
const { LM_LEVEL, LM_PLAN, LM_FEATURES, lmPlanStatus, lmFeature, lmFeaturesAt, lmCan, lmGate } = PLAN;

/**
 * assets/plan.js again, this time over a `localStorage` it can actually write to — the
 * preview is one key in it, and a test that stubbed the function instead of the storage
 * would be checking its own stub.
 *
 * `document` is left undefined: lmSetProPreview() guards on it, and a preview that only
 * works on a page with a DOM would be a preview the tests could never reach.
 */
function loadWithStorage(initial) {
  const store = { ...(initial || {}) };
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const src = ["assets/account.js", "assets/plan.js"]
    .map((f) => readFileSync(p(f), "utf8")).join("\n");
  const api = new Function("localStorage", "document", `${src}
    return { LM_LEVEL, LM_PRO_LOCKED, LM_PRO_PREVIEW_KEY, lmFeatureState, lmPaywall,
             lmProPreview, lmSetProPreview };`)(localStorage, undefined);
  return { ...api, store };
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

/** Escape a translated string so it can be counted with a RegExp. */
const esc = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

/* ------------------------------------------------------------------ 1. the model */

head("1. Free / Pro — the two values the sync contract defines");
{
  eq("free is \"free\"", LM_PLAN.FREE, "free");
  // FIRESTORE_SYNC §2 and users/{uid}.plan on the phone. Renaming it here would make the
  // browser and the Android app disagree about the same account.
  eq("Pro is the contract's \"premium\", not \"pro\"", LM_PLAN.PRO, "premium");
  eq("and there is no third plan", Object.keys(LM_PLAN).length, 2);

  const problems = validateIA();
  check("the architecture the table is checked against is itself sound",
    problems.length === 0, problems.join("\n      "));
}

head("2. the plan status of one account");
{
  const user = { uid: "u1" };
  const hour = 3600e3;
  const at = 1_700_000_000_000;

  const guest = lmPlanStatus(null, null, at);
  eq("signed out is a guest", guest.level, LM_LEVEL.GUEST);
  // Not "free": a guest has no account, so there is no plan on it. Saying "Darmowy" to
  // somebody who never signed up would name a plan they do not have.
  eq("and has no plan at all", guest.plan, null);
  eq("nor an end date", guest.validUntil, null);
  eq("nor an expiry to explain", guest.expired, false);

  const free = lmPlanStatus(user, null, at);
  eq("signed in with no profile document is the free plan", free.plan, LM_PLAN.FREE);
  eq("at the LiczMat level", free.level, LM_LEVEL.LICZMAT);
  eq("free with no plan field is still free", lmPlanStatus(user, {}, at).plan, LM_PLAN.FREE);
  eq("and a made-up plan value is free too",
    lmPlanStatus(user, { plan: "pro" }, at).plan, LM_PLAN.FREE);

  const pro = lmPlanStatus(user, { plan: "premium" }, at);
  eq("premium is the Pro plan", pro.plan, LM_PLAN.PRO);
  eq("at the Pro level", pro.level, LM_LEVEL.PRO);
  eq("with no end date to show", pro.validUntil, null);
  eq("and nothing expired", pro.expired, false);

  const dated = lmPlanStatus(user, { plan: "premium", planValidUntil: at + hour }, at);
  eq("premium valid until tomorrow is still Pro", dated.level, LM_LEVEL.PRO);
  eq("and the page has a date to print", dated.validUntil, at + hour);

  const over = lmPlanStatus(user, { plan: "premium", planValidUntil: at - hour }, at);
  // The one case the page can explain from the document itself: the plan says premium,
  // the level says LiczMat, and without `expired` the account looks demoted for no reason.
  eq("a premium plan that ran out is LiczMat again", over.level, LM_LEVEL.LICZMAT);
  eq("but the plan field still says premium", over.plan, LM_PLAN.PRO);
  eq("and the page is told why", over.expired, true);
  eq("with the date it ran out", over.validUntil, at - hour);

  const junk = lmPlanStatus(user, { plan: "premium", planValidUntil: "wkrótce" }, at);
  eq("an unreadable end date is no end date", junk.validUntil, null);
  eq("and does not expire the plan", junk.expired, false);

  // One derivation, in assets/account.js. A second one here would eventually disagree
  // with the header, the calculators' sentence and the dashboard strip.
  for (const profile of [null, {}, { plan: "free" }, { plan: "premium" },
    { plan: "premium", planValidUntil: at - hour }, { plan: "premium", planValidUntil: at + hour }]) {
    eq(`the level matches lmLevelOf() for ${JSON.stringify(profile)}`,
      lmPlanStatus(user, profile, at).level, PLAN.lmLevelOf(user, profile, at));
  }
}

/* ------------------------------------------------------------------ 3. permissions */

head("3. the permission table says one level per feature");
{
  const ids = new Set();
  for (const f of LM_FEATURES) {
    check(`"${f.id}" is declared once`, !ids.has(f.id));
    ids.add(f.id);
    check(`"${f.id}" is at one of chapter II's three levels`, LEVEL_ORDER.includes(f.level),
      `level is ${JSON.stringify(f.level)}`);
    if (f.route) {
      check(`"${f.id}" points at a route that exists`, !!route(f.route), `route "${f.route}"`);
    }
  }
  check("there is at least one feature at each level",
    LEVEL_ORDER.every((l) => lmFeaturesAt(l).length > 0));
  eq("an unknown feature id is not a feature", lmFeature("teleportation"), null);
}

head("4. the table and src/ia.mjs agree about what is Pro");
{
  // A view is a state of its parent page — /klienci/?id=<id> is the clients module seen
  // from the inside, not a sixth module — so it is covered by the feature its parent
  // carries. scripts/build.mjs skips views in the same check for the same reason.
  for (const r of ROUTES.filter((x) => x.level === LEVEL.PRO && !x.view)) {
    const f = LM_FEATURES.find((x) => x.route === r.id);
    check(`route "${r.id}" is covered by a feature`, !!f);
    if (f) eq(`and that feature is PRO too`, f.level, LEVEL.PRO);
  }
  for (const f of LM_FEATURES.filter((x) => x.level === LEVEL.PRO)) {
    if (!f.route) continue;
    eq(`Pro feature "${f.id}" sits on a PRO route`, route(f.route).level, LEVEL.PRO);
  }
  // Chapter XXIV is a path through the other four, not a page — the one Pro feature that
  // is allowed to have no route. If a second one appears, somebody forgot a route.
  eq("exactly one Pro feature has no page of its own",
    LM_FEATURES.filter((f) => f.level === LEVEL.PRO && !f.route).length, 1);
}

head("5. what the site actually enforces, feature by feature");
{
  // Chapter II: „Podstawowe kalkulatory NIE MOGĄ wymagać rejestracji.” This is the line
  // the whole product is built on, so it is checked as an assertion and not as a note.
  eq("a guest may use the calculators", lmCan("calc", LM_LEVEL.GUEST), true);
  eq("a guest may read the catalogue", lmCan("catalog", LM_LEVEL.GUEST), true);
  eq("a guest may read the guides", lmCan("guides", LM_LEVEL.GUEST), true);

  // The local workspace. Chapter II lists these under NIE MOŻE for a guest; this site
  // keeps them in localStorage in the Firestore shape, /projekty/ and /kosztorys/ are
  // GUEST routes, and FIRESTORE_SYNC §1.2 says counting never requires an account. The
  // table has to record what ships, or a later session gates something that works today.
  for (const id of ["projects", "rooms", "saved", "shopping", "costs", "history"]) {
    eq(`a guest may use "${id}" — it is this browser's own storage`,
      lmCan(id, LM_LEVEL.GUEST), true);
  }

  // What the free account actually adds.
  eq("a guest may not sync", lmCan("sync", LM_LEVEL.GUEST), false);
  eq("a free account may", lmCan("sync", LM_LEVEL.LICZMAT), true);
  eq("a guest may not make a share link", lmCan("share", LM_LEVEL.GUEST), false);
  eq("a free account may", lmCan("share", LM_LEVEL.LICZMAT), true);

  for (const id of ["clients", "jobs", "quotes", "calendar", "crm"]) {
    eq(`a guest may not use "${id}"`, lmCan(id, LM_LEVEL.GUEST), false);
    eq(`a free account may not use "${id}"`, lmCan(id, LM_LEVEL.LICZMAT), false);
    eq(`Pro may use "${id}"`, lmCan(id, LM_LEVEL.PRO), true);
  }

  // Pro is the top of LEVEL_ORDER, so it reaches everything below it. A permission table
  // that answered "no" here would lock a paying account out of the free product.
  for (const f of LM_FEATURES) {
    eq(`Pro reaches "${f.id}"`, lmCan(f.id, LM_LEVEL.PRO), true);
  }

  // A typo must close a door, never open one.
  eq("an unknown feature is refused at every level", lmCan("clientz", LM_LEVEL.PRO), false);
  eq("including for a guest", lmCan("", LM_LEVEL.GUEST), false);
}

head("6. the gate: what a free user is shown instead");
{
  eq("nothing to show for a feature the visitor may use", lmGate("calc", LM_LEVEL.GUEST), null);
  eq("nothing to show for Pro on a Pro feature", lmGate("clients", LM_LEVEL.PRO), null);

  const gate = lmGate("clients", LM_LEVEL.LICZMAT);
  check("a free account meets a gate on Klienci", !!gate);
  eq("which names the level it needs", gate.need, LEVEL.PRO);
  eq("and the feature it is standing in front of", gate.feature.id, "clients");
  check("with the copy to render it", !!gate.feature.key);

  const guest = lmGate("sync", LM_LEVEL.GUEST);
  check("a guest meets a gate on sync", !!guest);
  eq("that asks for a free account, not for Pro", guest.need, LEVEL.LICZMAT);

  // An unknown id has no gate to show, because it has no name and no level. lmCan()
  // refuses it; a gate that invented one would put "undefined" on the page.
  eq("an unknown feature has no gate either", lmGate("nope", LM_LEVEL.GUEST), null);
}

/* ------------------------------------------------------------------ 6b. the paywall */

head("6b. session 27: the wall itself");
{
  eq("the paywall is up", PLAN.LM_PRO_LOCKED, true);

  // Every Pro module is behind it, and nothing below Pro is. A wall in front of a
  // calculator would break chapter II's hardest rule in the same commit that built it.
  for (const f of LM_FEATURES) {
    const st = PLAN.lmFeatureState(f.id, LM_LEVEL.LICZMAT);
    if (f.level === LEVEL.PRO) {
      check(`${f.id} is walled off from a free account`, st.locked);
    } else {
      check(`${f.id} is not`, !st.locked);
    }
  }
  for (const f of lmFeaturesAt(LEVEL.GUEST)) {
    check(`${f.id} is open to a guest`, PLAN.lmFeatureState(f.id, LM_LEVEL.GUEST).allowed);
  }

  // A free account meets a wall on sync too — but sync is LICZMAT, so the level reaches
  // it and there is nothing to lock. The lock is LM_PRO_LOCKED and it is about Pro.
  check("sync is open to the account that has one",
    PLAN.lmFeatureState("sync", LM_LEVEL.LICZMAT).allowed);
  check("and walled off from a guest without one — but not by the Pro lock",
    !PLAN.lmFeatureState("sync", LM_LEVEL.GUEST).allowed
      && !PLAN.lmFeatureState("sync", LM_LEVEL.GUEST).locked);

  // Chapter XXV's "przejście Free → Pro", one rung per level.
  eq("a guest is sent to make an account first",
    PLAN.lmPaywall("clients", LM_LEVEL.GUEST).step, "account");
  eq("a free account is offered the upgrade",
    PLAN.lmPaywall("clients", LM_LEVEL.LICZMAT).step, "upgrade");
  eq("a Pro account has nothing left to do",
    PLAN.lmPaywall("clients", LM_LEVEL.PRO).step, "none");
  eq("and the module is open for them", PLAN.lmPaywall("clients", LM_LEVEL.PRO).open, true);
  eq("closed for everybody else", PLAN.lmPaywall("clients", LM_LEVEL.GUEST).open, false);

  // A typo shuts a door rather than opening one — the rule lmCan() already follows.
  const unknown = PLAN.lmPaywall("teleportation", LM_LEVEL.PRO);
  eq("an unknown feature is not open", unknown.open, false);
  eq("and it is locked", unknown.locked, true);
  eq("with no feature to name", unknown.feature, null);
}

head("6c. the Pro preview: what it opens, and what it must never claim");
{
  const off = loadWithStorage();
  eq("off in a browser that has never seen it", off.lmProPreview(), false);
  eq("so the wall is up", off.lmFeatureState("clients", off.LM_LEVEL.LICZMAT).locked, true);

  off.lmSetProPreview(true);
  eq("the key is the one assets/plan.js names",
    off.store[off.LM_PRO_PREVIEW_KEY], "1");
  eq("and it is the only thing written", Object.keys(off.store).length, 1);

  const on = loadWithStorage({ "liczmat-pro-preview": "1" });
  eq("the key is spelled the same way here", on.LM_PRO_PREVIEW_KEY, "liczmat-pro-preview");

  const st = on.lmFeatureState("clients", on.LM_LEVEL.LICZMAT);
  eq("the module runs", st.locked, false);
  eq("the page is told it is a preview", st.preview, true);
  // The whole point of keeping these apart: a preview is not a plan, and a page that
  // said "Twój plan: LiczMat Pro" over one would be lying about what was bought.
  eq("but the level still does not reach it", st.allowed, false);
  eq("and the page still says the module is Pro", st.gated, true);

  const pro = on.lmFeatureState("clients", on.LM_LEVEL.PRO);
  eq("a real Pro account is allowed, not previewing", pro.allowed, true);
  eq("with no preview claimed over it", pro.preview, false);

  // Every Pro module opens together. Five switches would be five ways to be half in.
  for (const f of LM_FEATURES.filter((x) => x.level === LEVEL.PRO)) {
    eq(`${f.id} opens under the preview`,
      on.lmFeatureState(f.id, on.LM_LEVEL.GUEST).locked, false);
  }
  // And nothing else does. `sync` and `share` need a Firebase user and a document the
  // deployed rules accept; no key in this browser can supply either.
  for (const f of LM_FEATURES.filter((x) => x.level === LEVEL.LICZMAT)) {
    eq(`${f.id} does not`, on.lmFeatureState(f.id, on.LM_LEVEL.GUEST).allowed, false);
    eq(`nor is ${f.id} claimed as a preview`,
      on.lmFeatureState(f.id, on.LM_LEVEL.GUEST).preview, false);
  }

  // The paywall is satisfied — there is nothing to do next — and it still knows the
  // visitor is on the free plan, which is what lets the strip say so.
  eq("nothing to do next while previewing",
    on.lmPaywall("clients", on.LM_LEVEL.LICZMAT).step, "none");
  eq("the module is open", on.lmPaywall("clients", on.LM_LEVEL.LICZMAT).open, true);
  eq("and it is still gated", on.lmPaywall("clients", on.LM_LEVEL.LICZMAT).gated, true);

  on.lmSetProPreview(false);
  eq("turning it off removes the key", on.store[on.LM_PRO_PREVIEW_KEY], undefined);
  eq("and the wall is back", on.lmFeatureState("clients", on.LM_LEVEL.LICZMAT).locked, true);

  // A browser that refuses storage reads as "off" rather than throwing: the wall is the
  // safe answer, and a paywall that crashed the page would open everything behind it.
  const noStore = new Function(
    ["assets/account.js", "assets/plan.js"].map((f) => readFileSync(p(f), "utf8")).join("\n")
      + "\nreturn { lmProPreview, lmFeatureState, LM_LEVEL };")();
  eq("no storage means no preview", noStore.lmProPreview(), false);
  eq("and the wall stands", noStore.lmFeatureState("clients", "liczmat").locked, true);
}

head("6d. the wall as it is built, in four languages");
{
  for (const lang of SITE_LANGS.map((l) => l.code)) {
    const t = tr(lang);
    const html = proGate(t, "clients", LM_FEATURES, lang, { id: "crm-gate" });
    const has = (needle, what) => check(`${lang}: ${what}`, html.includes(needle),
      `not in the wall: ${needle}`);

    has('id="crm-gate"', "the wall carries the id the page's script looks for");
    has("hidden", "and is hidden until the script knows the level");
    has(t("feat_clients_t"), "the module is named");
    has(t("feat_clients_d"), "and described");
    has(t("pro_locked"), "with chapter XXV's own sentence");

    // Both rungs are in the markup; assets/paywall.js shows one. A wall that had to be
    // rebuilt to change rung would flash the wrong sentence first.
    has('data-pw-step="account"', "the guest's rung is there");
    has('data-pw-step="upgrade"', "and the free account's");
    has(t("pro_need_account"), "with the sentence for a guest");
    has(t("pro_need_pro"), "and the one for a free account");
    has(`href="/app/?mode=signup&amp;next=${encodeURIComponent(urlClients(lang))}"`,
      "and a sign-up link that comes back to this page, in this language");

    // "Prezentacja funkcji Pro": the wall shows the whole product, not one fifth of it.
    has(t("pro_incl_t"), "the rest of Pro is listed");
    for (const f of proModules(LM_FEATURES).filter((x) => x.id !== "clients")) {
      has(t(`${f.key}_t`), `and ${f.id} is named on it`);
    }
    check(`${lang}: the module behind this wall is not listed twice`,
      (html.match(new RegExp(esc(t("feat_clients_t")), "g")) || []).length === 1);

    // The preview, and the three things it says it is not.
    has("data-pw-preview", "the preview switch is on the wall");
    has(t("pro_prev_t"), "with its heading");
    has(t("pro_prev_d"), "and the sentence that says it changes no plan");
    has(t("pro_pay_later"), "and the note that payments are still to come");

    // Chapter XXV's rule, still: never a dead button. /liczmat-pro/ is PLANNED until
    // session 29, so the phrase is text; the moment the route goes LIVE it is a link and
    // this check flips to the other branch on its own.
    const proPage = route("liczmat-pro");
    has(t("pro_more"), "the way to find out what Pro is, is offered");
    check(`${lang}: and it is a sentence while /liczmat-pro/ is planned`,
      proPage.status === STATUS.LIVE
        ? html.includes(`href="${proPage.path(lang)}"`)
        : html.includes(t("door_soon")));
  }

  // The wall is built from LM_FEATURES, so a module the table never heard of must not
  // reach a page as an empty heading.
  let threw = false;
  try { proGate(tr("pl"), "teleportation", LM_FEATURES, "pl", {}); } catch (e) { threw = true; }
  check("a wall in front of an unknown feature aborts the build", threw);
}

/* ------------------------------------------------------------------ 7. the structure */

head("7. the Pro modules, in the order the plan builds them");
{
  const mods = proModules(LM_FEATURES);
  eq("five of them", mods.length, 5);
  eq("in session order", mods.map((m) => m.id).join(),
    "clients,jobs,quotes,calendar,crm");
  eq("which is chapter XXXII's order", mods.map((m) => m.session).join(), "22,23,24,25,26");
  for (const m of mods) {
    check(`"${m.id}" has a name and a line under it`, !!m.key);
  }
  // Sessions 22–25 built the first four, so the statuses are no longer all the same —
  // and the card has to follow the route rather than a hard-coded sentence. A module
  // whose page exists is offered; one whose session has not happened yet says so and
  // links nowhere, which is chapter XXV's "never a dead button" in both directions.
  const BUILT = ["clients", "jobs", "quotes", "calendar"];
  eq("clients is built — session 22", route("clients").status, STATUS.LIVE);
  eq("and jobs — session 23", route("jobs").status, STATUS.LIVE);
  eq("and quotes — session 24", route("quotes").status, STATUS.LIVE);
  eq("and the terminarz — session 25", route("calendar").status, STATUS.LIVE);
  // The fifth is chapter XXIV's CRM, and it has no route of its own on purpose: it is a
  // path through the other four, which is why nothing here can be "still planned" but it.
  eq("the one that is still planned is the CRM", mods.filter(
    (m) => m.route && route(m.route).status === STATUS.PLANNED).length, 0);
  for (const m of mods) {
    if (!m.route || BUILT.indexOf(m.id) !== -1) continue;
    eq(`"${m.id}" is still planned`, route(m.route).status, STATUS.PLANNED);
  }
  for (const m of mods) {
    const card = proModuleCard(tr("pl"), m);
    const live = m.route && route(m.route).status === STATUS.LIVE;
    check(`"${m.id}": the card ${live ? "does not say" : "says"} "in preparation"`,
      card.includes('data-i18n="door_soon"') === !live);
    check(`"${m.id}": the card ${live ? "opens" : "does not open"} the module`,
      card.includes("data-nav-route=") === Boolean(live));
    if (live) {
      check(`"${m.id}": and the link is the route's own address`,
        card.includes(`href="${route(m.route).path("pl")}"`), card);
    }
  }
}

head("8. the copy, in four languages");
{
  for (const key of appProKeys(LM_FEATURES)) {
    for (const lang of CODES) {
      check(`${lang}: "${key}" is translated`, key in DICT[lang]);
    }
  }
  for (const lang of CODES) {
    // The product's name, spelled the same way on the tab, the heading and the plan chip.
    eq(`${lang}: the tab is called LiczMat Pro`, DICT[lang].app_tab_pro, "LiczMat Pro");
    eq(`${lang}: so is the heading`, DICT[lang].pro_t, "LiczMat Pro");
    eq(`${lang}: and the plan`, DICT[lang].plan_pro, "LiczMat Pro");
    check(`${lang}: the gate names LiczMat Pro`, DICT[lang].pro_locked.includes("LiczMat Pro"),
      DICT[lang].pro_locked);
    check(`${lang}: the free plan is not called LiczMat Pro`,
      DICT[lang].plan_free !== DICT[lang].plan_pro);
  }
  eq("the Polish gate is chapter XXV's sentence", DICT.pl.pro_locked, "Dostępne w LiczMat Pro");
  eq("and so is the way out of it", DICT.pl.pro_more, "Poznaj LiczMat Pro");
}

/* ------------------------------------------------------------------ 9. the page */

head("9. /app/ carries the Pro tab");
{
  const html = appMain(tr("pl"), LM_FEATURES);
  const has = (needle, what) => check(what, html.includes(needle), `not in the page: ${needle}`);
  const hasNot = (needle, what) => check(what, !html.includes(needle), `still in the page: ${needle}`);

  has('data-tab="pro"', "there is a tab for it");
  has('data-panel="pro"', "and a panel behind it");
  has('id="panel-pro"', "which the tab points at");
  has('aria-labelledby="tab-pro"', "and which points back");
  eq("five tabs now, and the panels match", (html.match(/class="app-tab"/g) || []).length,
    (html.match(/data-panel="/g) || []).length);

  has('id="plan-card"', "the plan has a card of its own");
  has('id="plan-name"', "with room for the plan's name");
  has('id="plan-until"', "its end date");
  has('id="plan-note"', "and the reason it is what it is");

  for (const m of proModules(LM_FEATURES)) {
    has(`data-feature="${m.id}"`, `the "${m.id}" module is on the page`);
    has(`data-i18n="${m.key}_d"`, `and says what it is, translatably`);
  }
  eq("each module is locked once",
    (html.match(/data-i18n="pro_locked"/g) || []).length, proModules(LM_FEATURES).length);

  // Chapter XXV, the rule the whole tab exists to obey: never a dead button. Every Pro
  // route is PLANNED, so the page may not link to one — and /liczmat-pro/ waits for
  // session 29, so "Poznaj LiczMat Pro" is a sentence until then.
  hasNot('href="/liczmat-pro/"', "nothing links to the Pro page before session 29 builds it");
  // Klienci is built (session 22), so its card is the one module the tab can open. A
  // dead button is what chapter XXV forbids; a live one is what it asks for.
  has('href="/klienci/"', "and Klienci, which exists, is reachable from its card");
  has('class="muted pro-more"', "so the way in is text, not a button");

  // Everything the tab renders is swapped in place on `langchange` (the page has no
  // language of its own), so every string in it has to be reachable by key.
  const panel = proPanel(tr("pl"), LM_FEATURES);
  const marked = (panel.match(/data-i18n="/g) || []).length;
  check("every line in the panel is keyed for the in-place translator", marked >= 12,
    `only ${marked} data-i18n attributes`);
}

head("10. nothing on the page grants a plan");
{
  const html = appMain(tr("pl"), LM_FEATURES);
  // `plan` and `planValidUntil` are server-only (FIRESTORE_SYNC §2, and the deployed
  // rules let a client write nothing in users/{uid} but lastSeenAt and appVersion). A
  // form on this page that posted a plan would fail in production and mislead here.
  check("no form writes the plan", !/id="plan-form"/.test(html));
  check("no button offers to buy", !/data-plan-upgrade/.test(html));
  // The profile document /app/ writes has three fields, and the rules accept two of
  // them from a client. A `plan:` anywhere in an object literal here would be a write
  // the server refuses — and, worse, a page that looked like it could grant Pro.
  const app = readFileSync(p("assets/app.js"), "utf8");
  check("assets/app.js never puts plan in a document it writes", !/\bplan\s*:/.test(app));
  check("nor planValidUntil", !/\bplanValidUntil\s*:/.test(app));
}

/* ------------------------------------------------------------------ report */

console.log(`\nplan: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
