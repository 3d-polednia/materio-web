#!/usr/bin/env node
/**
 * LiczMat — the dashboard, tested.
 *
 *     node scripts/test-dashboard.mjs
 *
 * Master plan, session 14: "Dashboard darmowego użytkownika … projekty, ostatnie
 * kalkulacje, szybkie akcje, ostatnio używane narzędzia." This file is the half that
 * needs no browser: the route, the store behind "recently used tools", the frame the
 * build writes, the addresses it hands the page and the copy in all four languages. The
 * other half — the four lists drawn from a planted localStorage, the language switch, the
 * phone widths — is scripts/test-dashboard-page.mjs.
 *
 * Same shape as scripts/test-account.mjs: no dependencies, plain `node`, exit 1 on a
 * failure so it can gate a commit.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LEVEL, STATUS, route, validateIA, FLOWS } from "../src/ia.mjs";
import { dashboardMain, dashboardKeys } from "../src/app-pages.mjs";
import {
  LANGS, DEFAULT_LANG, URL_DASHBOARD, URL_APP,
  urlCalcIndex, urlProjects, urlEstimate, urlCalc, CALC_SLUG,
} from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/** Evaluate a browser script that has no exports and hand back the globals we need. */
function evalScript(file, returns, globals = {}) {
  const src = readFileSync(p(file), "utf8");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const DICT = {};
for (const lang of LANGS) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/**
 * assets/recent.js runs in a page. Node has no `document` and no `localStorage`, so it
 * gets the smallest stand-ins that let the shipped file run unmodified.
 */
function loadRecent(store) {
  const backing = store || new Map();
  const localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
  const events = [];
  const listeners = {};
  const document = {
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent: (e) => events.push(e),
  };
  const api = evalScript("assets/recent.js", [
    "LM_RECENT_KEY", "LM_RECENT_MAX", "lmRecentRead", "lmRecentPush", "lmRecentClear",
  ], {
    localStorage,
    document,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
  });
  /** Fire a `calcresult` at the listener the file attaches, as a calculator page would. */
  const calcresult = (detail) => (listeners.calcresult || []).forEach((fn) => fn({ detail }));
  return { ...api, store: backing, events, calcresult };
}

/**
 * assets/dashboard.js the same way. Every render function starts with a getElementById
 * that returns null here, so they all return without touching the DOM — what this loads
 * it for is the pure part: the per-language addresses and the size of each list.
 */
function loadDashboard(lmDash, lang) {
  const document = {
    documentElement: { lang: lang || "pl" },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  return evalScript("assets/dashboard.js", [
    "DASH_PROJECTS", "DASH_LINES", "DASH_TOOLS", "DASH", "dashUrl", "dashLang",
  ], { document, window: { LM_DASH: lmDash } });
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

/* ------------------------------------------------------------------ 1. the route */

head("1. the dashboard is a declared page, not a page that just appeared");
{
  const problems = validateIA();
  check("validateIA() is happy with the architecture", problems.length === 0, problems.join("\n      "));

  const r = route("dashboard");
  check("the route exists", Boolean(r));
  eq("it is live now", r.status, STATUS.LIVE);
  eq("at /app/dashboard/", r.path, URL_DASHBOARD);
  eq("under the account", r.parent, "account");
  eq("it has no per-language URL", r.localized, false);
  eq("and is never indexed", r.indexable, false);
  // Session 3 declared it LICZMAT. Session 14 built it GUEST on purpose: everything on
  // it is this browser's own localStorage, and the only thing that could lock a guest
  // out is the session hint, which may be stale — see the note on the route.
  eq("a guest may open it", r.level, LEVEL.GUEST);
  check("it is in the footer's account column",
    r.footer && r.footer.group === "account" && r.footer.key === "nav_dashboard");

  const liczmat = FLOWS.find((f) => f.id === "liczmat");
  check("the LiczMat flow's last step is the dashboard",
    liczmat.steps[liczmat.steps.length - 1].route === "dashboard");
}

/* ------------------------------------------------------------------ 2. the store */

head("2. which calculators this browser used");
{
  const rec = loadRecent();
  eq("a browser that never calculated has an empty list", rec.lmRecentRead().length, 0);

  rec.lmRecentPush("waste", 1000);
  rec.lmRecentPush("grout", 2000);
  eq("two tools are two rows", rec.lmRecentRead().length, 2);
  eq("the newest is first", rec.lmRecentRead()[0].id, "grout");

  // The list answers "which tools do you reach for", so the same one used twice is one
  // row with the later time — not two rows pushing everything else off the end.
  rec.lmRecentPush("waste", 3000);
  eq("using one again does not add a second row", rec.lmRecentRead().length, 2);
  eq("it moves to the front", rec.lmRecentRead()[0].id, "waste");
  eq("with the later time", rec.lmRecentRead()[0].at, 3000);

  eq("the write announces itself so the page can redraw", rec.events.length, 3);
  eq("with the new list on the event", rec.events[2].detail.list[0].id, "waste");

  rec.lmRecentClear();
  eq("clearing empties it", rec.lmRecentRead().length, 0);
  eq("and removes the key rather than storing an empty list",
    rec.store.has("liczmat-recent-calcs"), false);
}

head("3. the list has a length, and a broken store is an empty one");
{
  const rec = loadRecent();
  for (let i = 0; i < rec.LM_RECENT_MAX + 5; i++) rec.lmRecentPush(`calc-${i}`, 1000 + i);
  eq(`it keeps at most ${rec.LM_RECENT_MAX}`, rec.lmRecentRead().length, rec.LM_RECENT_MAX);
  eq("and keeps the newest", rec.lmRecentRead()[0].id, `calc-${rec.LM_RECENT_MAX + 4}`);

  eq("an empty id is not a row", loadRecent().lmRecentPush("").length, 0);

  const junk = (raw) => loadRecent(new Map([["liczmat-recent-calcs", raw]])).lmRecentRead();
  eq("a store that is not JSON reads as empty", junk("{").length, 0);
  eq("a store that is not a list reads as empty", junk('{"waste":1}').length, 0);
  eq("a row without an id is dropped", junk('[{"at":1}]').length, 0);
  eq("a row without a time is dropped", junk('[{"id":"waste"}]').length, 0);
  eq("a good row next to a broken one survives",
    junk('[{"id":"waste","at":5},{"at":9}]').length, 1);
}

head("4. a tool counts as used when the visitor asked for the number");
{
  // A calculator page dispatches `calcresult` on load as well, to turn the
  // server-rendered answer into a live result object. That is the page catching up with
  // itself; counting it would fill the list with every calculator anybody ever opened.
  const rec = loadRecent();
  const card = { dataset: { calc: "waste" } };

  rec.calcresult({ card, result: {}, byHand: false });
  eq("the silent run on load records nothing", rec.lmRecentRead().length, 0);

  rec.calcresult({ card, result: {}, byHand: true });
  eq("pressing Oblicz records the tool", rec.lmRecentRead()[0].id, "waste");

  // A refused calculation still means the tool was used — the visitor opened it, typed
  // and asked. What is recorded either way is the id and the time, never the input.
  const rec2 = loadRecent();
  rec2.calcresult({ card, result: null, byHand: true });
  eq("so does a calculation the engine refused", rec2.lmRecentRead()[0].id, "waste");
  eq("and nothing but the id and the time is kept",
    Object.keys(rec2.lmRecentRead()[0]).sort().join(), "at,id");

  const rec3 = loadRecent();
  rec3.calcresult({ card: {}, result: {}, byHand: true });
  eq("a card that is not a calculator records nothing", rec3.lmRecentRead().length, 0);
}

/* ------------------------------------------------------------------ 5. the page */

head("5. the four things chapter XIV asks the dashboard to show");
{
  const html = dashboardMain(tr(DEFAULT_LANG));
  const has = (needle, what) => check(what, html.includes(needle), `not in the page: ${needle}`);

  has('id="dash-quick-h"', "szybkie akcje — the section is there");
  has('id="dash-projects"', "projekty — the list is there");
  has('id="dash-recent"', "ostatnie kalkulacje — the list is there");
  has('id="dash-tools"', "ostatnio używane narzędzia — the list is there");
  has('id="dash-level"', "and the strip says which level this browser is on");
  has('id="dash-signup"', "a guest is offered an account rather than a locked door");
  has(`href="${URL_APP}?mode=signup&amp;next=${encodeURIComponent(URL_DASHBOARD)}"`,
    "and the offer opens the sign-up form and comes back here");
  has('id="dash-tools-forget"', "the visitor can delete their own history of tools");

  // Every heading is a real heading, so the page has an outline on a screen reader.
  for (const id of ["quick", "projects", "recent", "tools"]) {
    check(`the "${id}" section is labelled by its own heading`,
      html.includes(`aria-labelledby="dash-${id}-h"`) && html.includes(`id="dash-${id}-h"`));
  }

  // The quick actions and the "see all" links are real links with real addresses: this
  // page needs a script for its lists, and must not need one to get anywhere.
  const hrefs = [...html.matchAll(/href="([^"]+)" data-dash-url="([^"]+)"/g)];
  eq("six links carry an address the script re-points", hrefs.length, 6);
  const want = {
    calculators: urlCalcIndex(DEFAULT_LANG),
    projects: urlProjects(DEFAULT_LANG),
    estimate: urlEstimate(DEFAULT_LANG),
  };
  for (const [, href, key] of hrefs) {
    eq(`the "${key}" link points at ${want[key]} before any script runs`, href, want[key]);
  }
  check("none of them is a placeholder", !html.includes('href="/" data-dash-url'));
}

head("6. the addresses the build hands the page");
{
  // The page has no per-language URL, so it cannot render /kalkulatory/ and be right in
  // German. window.LM_DASH is what assets/dashboard.js re-points the links from, and it
  // is written by the build — so it is read back out of the built page.
  const file = p("app/dashboard/index.html");
  if (!check("the page has been built", existsSync(file), "run: node scripts/build.mjs")) {
    // Nothing below can say anything useful without it.
  } else {
    const built = readFileSync(file, "utf8");
    const m = built.match(/window\.LM_DASH = (\{.*?\});<\/script>/s);
    if (check("it carries its own addresses", Boolean(m))) {
      const data = JSON.parse(m[1].replace(/\\u003c/g, "<"));
      for (const key of ["calculators", "projects", "estimate"]) {
        for (const lang of LANGS) {
          check(`${key} has a ${lang} address`, Boolean(data.urls[key] && data.urls[key][lang]));
        }
      }
      eq("the Polish calculator hub is the one src/site.mjs says",
        data.urls.calculators.pl, urlCalcIndex("pl"));
      eq("and the German one", data.urls.calculators.de, urlCalcIndex("de"));

      eq("every calculator can be opened from the dashboard",
        Object.keys(data.calcs).length, Object.keys(CALC_SLUG).length);
      for (const id of Object.keys(CALC_SLUG)) {
        const entry = data.calcs[id];
        if (!check(`"${id}" is in the map`, Boolean(entry))) continue;
        for (const lang of LANGS) {
          eq(`"${id}" opens at its own ${lang} URL`, entry.url[lang], urlCalc(lang, id));
        }
        check(`"${id}" brings the icon the hub gives it`,
          typeof entry.icon === "string" && entry.icon.startsWith("<svg"));
      }
      check("the blob cannot close its own <script>", !m[1].includes("</"));
    }
  }
}

/* ------------------------------------------------------------------ 7. the copy */

head("7. the copy exists in all four languages");
{
  const KEYS = [
    ...dashboardKeys(),
    // Rendered by assets/dashboard.js into the rows themselves.
    "acc_guest_t", "acc_liczmat_t", "acc_pro_t", "ws_lines", "ws_active", "ws_mixed_currency",
    // The new localStorage key has to be named on /cookies/, next to the other two.
    "ck_p_recent",
  ];
  for (const lang of LANGS) {
    const missing = KEYS.filter((k) => !DICT[lang][k]);
    check(`${lang}: every dashboard key is translated`, missing.length === 0, missing.join(", "));
    const same = KEYS.filter((k) => lang !== DEFAULT_LANG && DICT[lang][k] === DICT[DEFAULT_LANG][k]
      // A brand name is the same in every language, and "Konto" happens to be the German
      // and the Polish word for the same thing.
      && !["acc_liczmat_t", "acc_pro_t", "dash_q_account"].includes(k));
    check(`${lang}: none of them is the Polish text left in place`, same.length === 0, same.join(", "));
  }
}

head("8. the numbers on the page come from the code, not from the dictionary");
{
  // CLAUDE.md: every number a page states has to be traceable to the code. The dashboard
  // states none in its copy — the counts it shows are counted from the workspace.
  for (const lang of LANGS) {
    const withNumbers = dashboardKeys()
      .filter((k) => /\d/.test(DICT[lang][k] || ""))
      // The brand is not a claim about a quantity.
      .filter((k) => !/LiczMat/.test(DICT[lang][k]));
    check(`${lang}: no dashboard string asserts a number`, withNumbers.length === 0,
      withNumbers.map((k) => `${k}: ${DICT[lang][k]}`).join("\n      "));
  }
}

head("9. how much of each list the dashboard shows");
{
  const data = { urls: { calculators: { pl: "/kalkulatory/", de: "/de/rechner/" } }, calcs: {} };
  const dash = loadDashboard(data, "de");
  check("each section is a shortlist, not the whole store",
    dash.DASH_PROJECTS > 0 && dash.DASH_LINES > 0 && dash.DASH_TOOLS > 0);
  eq("the page it is on is the language it renders", dash.dashLang(), "de");
  eq("a link follows that language", dash.dashUrl("calculators"), "/de/rechner/");

  const pl = loadDashboard(data, "pl");
  eq("and the Polish one is the Polish address", pl.dashUrl("calculators"), "/kalkulatory/");

  // A language the build did not write an address for, and a key nobody declared: the
  // page still has to render a link somebody can click.
  const uk = loadDashboard(data, "uk");
  eq("a missing language falls back to Polish", uk.dashUrl("calculators"), "/kalkulatory/");
  eq("an unknown section falls back to the home page", pl.dashUrl("nothing"), "/");

  const bare = loadDashboard(undefined, "pl");
  eq("a page with no data at all still has a link", bare.dashUrl("calculators"), "/");
}

/* ------------------------------------------------------------------ report */

console.log(`\ndashboard: ${passed}/${passed + failures.length} checks pass`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
