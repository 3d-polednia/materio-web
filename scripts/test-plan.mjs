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
import { proModules, proKeys, proPanel, proModuleCard } from "../src/pro.mjs";
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
  "lmCan", "lmGate", "lmLevelOf",
]);
const { LM_LEVEL, LM_PLAN, LM_FEATURES, lmPlanStatus, lmFeature, lmFeaturesAt, lmCan, lmGate } = PLAN;

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
  // Sessions 22, 23 and 24 built the first three, so the statuses are no longer all the
  // same — and the card has to follow the route rather than a hard-coded sentence. A
  // module whose page exists is offered; one whose session has not happened yet says so
  // and links nowhere, which is chapter XXV's "never a dead button" in both directions.
  const BUILT = ["clients", "jobs", "quotes"];
  eq("clients is built — session 22", route("clients").status, STATUS.LIVE);
  eq("and jobs — session 23", route("jobs").status, STATUS.LIVE);
  eq("and quotes — session 24", route("quotes").status, STATUS.LIVE);
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
