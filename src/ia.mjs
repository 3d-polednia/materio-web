/* LiczMat website — the information architecture.
 *
 * `src/site.mjs` answers "what is this page's URL in each language". This file answers
 * the questions above it: which pages the product has at all, who is allowed to use
 * each one, where it sits in the tree, whether it appears in the navigation, and which
 * step of which user flow it is.
 *
 * Master plan, chapter II: "Każdy element aplikacji powinien jednoznacznie wiedzieć, do
 * którego poziomu dostępu należy." That sentence is the reason this file exists — the
 * access level is a field on the route, not a comment somewhere.
 *
 * Two things make it more than documentation:
 *   - `src/template.mjs` builds the header and the footer's product column from
 *     `ROUTES`, so a route that is not declared here cannot appear in the navigation.
 *   - `scripts/build.mjs` compares the pages it actually wrote against `livePaths()`
 *     and aborts on a mismatch, so a page cannot exist without being declared and a
 *     declaration cannot rot into a 404.
 *
 * PLANNED routes are the target structure, not a promise that something is half-built:
 * they emit nothing, and the build refuses to let their paths collide with a live URL.
 * Each one names the session (chapter XXXII) that turns it into a real page.
 *
 * Written in session 3 (ARCHITEKTURA INFORMACJI). The narrative version, with the
 * reasoning and the open decisions, is docs/ARCHITEKTURA.md.
 */

import {
  LANGS, SECTION,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores, urlMaterials,
  urlProjects, urlProject, urlEstimate, urlAndroid, urlCookies, urlClients, urlClient,
  urlJobs, urlJob, urlQuotes, urlQuote, urlCalendar,
  URL_APP, URL_SHARE, URL_PRIVACY, URL_DASHBOARD,
} from "./site.mjs";

/* ------------------------------------------------------------------ access levels */

/**
 * The three levels of the master plan, chapter II. There is no fourth one, and no
 * "team", "firma" or "admin" — chapter II forbids inventing them now.
 *
 * A level is what the page *needs*, not what it *offers*: `/projekty/` is GUEST because
 * a visitor with no account can open it and use it, even though signing in adds sync.
 */
export const LEVEL = {
  /** No account. Reads content, uses every calculator, gets a real answer. */
  GUEST: "guest",
  /** Free account. Everything a guest has, plus saving, projects and history. */
  LICZMAT: "liczmat",
  /** Paid extension for the trade: clients, jobs, quotes, calendar, light CRM. */
  PRO: "pro",
};

export const LEVEL_ORDER = [LEVEL.GUEST, LEVEL.LICZMAT, LEVEL.PRO];

/** Is a visitor at `have` allowed into a page that needs `need`? */
export const allows = (have, need) =>
  LEVEL_ORDER.indexOf(have) >= LEVEL_ORDER.indexOf(need);

export const STATUS = {
  /** The build emits this page today. */
  LIVE: "live",
  /** The target structure. Nothing is emitted until the session named on the route. */
  PLANNED: "planned",
};

/* ------------------------------------------------------------------ the routes */

/**
 * Every page LiczMat has or will have.
 *
 * Fields:
 *   id          stable key, used by FLOWS and by parent/child links. Not a URL.
 *   level       LEVEL.* — the lowest level that may use the page.
 *   status      STATUS.*
 *   parent      id of the page above it in the tree (breadcrumbs follow this).
 *   localized   true  → one URL per language, Polish at the root (/kalkulatory/…)
 *               false → a single language-neutral URL that translates in the browser.
 *   indexable   whether the page belongs in sitemap.xml and may be crawled.
 *   path        (localized) lang => "/…/"   (language-neutral) a literal string.
 *   each        "calculator" | "guide" — this route stands for a family of pages.
 *   view        true → a screen of its own with no file of its own: it is a state of its
 *               parent page, reached by a query string, and the build writes nothing for
 *               it. `path(lang, key)` returns the parent's URL plus that query. Used
 *               where the key is made in the browser and is unbounded, so it can never
 *               be a directory on GitHub Pages — /projekty/?id=<projectId>.
 *   header      { order, key } — a link in the main navigation, at that position.
 *               Five at most, and the row was measured again when the fifth arrived —
 *               see the check in validateIA().
 *   navLevel    the level that has to be reached before the link is *shown*. Separate
 *               from `level`, and deliberately: `level` is about reaching the page,
 *               `navLevel` only about offering it in the menu. A page can be GUEST and
 *               still not belong in a guest's navigation.
 *   footer      { order, key, group } — a link in a footer column ("product" when the
 *               group is left out), at that position within the column.
 *   gate        for a PRO page: what a free user sees instead of the tool.
 *   session     for a PLANNED page: which session builds it (chapter XXXII).
 *   plannedSlug for a PLANNED localized page: the segment in each language. It moves
 *               into SECTION in src/site.mjs when that session arrives.
 *   note        why the route is the way it is, when that is not obvious.
 */
export const ROUTES = [
  /* ---------------------------------------------------------------- entry */
  {
    id: "home",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: null, localized: true, indexable: true,
    path: urlHome,
    note: "Chapter X: the way into the product, not an advert for the Android app. " +
      "Leads to three places — calculators, LiczMat, LiczMat Pro.",
  },

  /* ---------------------------------------------------------------- calculators */
  {
    id: "calculators",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlCalcIndex,
    header: { order: 1, key: "nav_calc" },
    footer: { order: 1, key: "foot_calc_all" },
    note: "Chapter XI: search, categories, filtering, a shortlist and readable access to " +
      "all of them. Session 7 built it; the groups are CALC_CATEGORIES below.",
  },
  {
    id: "calculator",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "calculators", localized: true, indexable: true,
    each: "calculator",
    path: (lang, calc) => urlCalc(lang, calc.id),
    note: "Chapter II: a basic calculator must never ask for an account. The prompt to " +
      "save comes after the result, never before it.",
  },

  /* ---------------------------------------------------------------- content */
  {
    id: "materials",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlMaterials,
    header: { order: 2, key: "nav_materials" },
    footer: { order: 2, key: "nav_materials" },
    note: "The catalogue as a way into a calculator, not a shop. Chapter I rules out " +
      "growing it into a large material directory.",
  },
  {
    id: "guides",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlGuideIndex,
    header: { order: 4, key: "nav_guides" },
    footer: { order: 5, key: "foot_guides" },
    note: "Chapter XI: the way into a calculator for somebody who does not yet know " +
      "which one they need.",
  },
  {
    id: "guide",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "guides", localized: true, indexable: true,
    each: "guide",
    path: (lang, guide) => urlGuide(lang, guide),
  },
  {
    id: "stores",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlStores,
    footer: { order: 6, key: "nav_stores" },
    note: "Footer only. It is a tool, not a step of any flow — session 5 took it out of " +
      "the header to get the row back under one line.",
  },
  {
    id: "android",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlAndroid,
    header: { order: 5, key: "nav_app_page" },
    footer: { order: 1, key: "nav_app_page", group: "account" },
    note: "One page for the Android app. Chapter X still holds — it must not be pushed on " +
      "the home page — but the owner asked for it in the navigation after session 20, and " +
      "a link in the menu is not a push: it is last in the row, behind the four tools, and " +
      "the home page says nothing more about it than it did before.",
  },

  /* ---------------------------------------------------------------- the workspace */
  {
    id: "projects",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlProjects,
    header: { order: 3, key: "nav_projects" },
    footer: { order: 3, key: "nav_projects" },
    navLevel: LEVEL.LICZMAT,
    note: "Chapter XIV makes the project the centre of the free account. The page is " +
      "GUEST because assets/workspace.js keeps projects in localStorage in the " +
      "Firestore document shape, so it works before anyone signs in; an account adds " +
      "sync across devices, not the ability to count. `navLevel` is the owner's decision " +
      "after session 20 and settles docs/ARCHITEKTURA.md §8.1: the *link* is for people " +
      "with an account, because a guest offered 'Projekty' in the menu is being offered a " +
      "list that is empty until they have counted something. The page itself is not " +
      "gated and cannot be — it is a static file over rows in this browser's own storage, " +
      "and FIRESTORE_SYNC §1.2 says counting never requires an account. It stays " +
      "indexable, stays in sitemap.xml, and stays reachable from 'Otwórz projekt' under " +
      "a saved result.",
  },
  {
    id: "project",
    level: LEVEL.GUEST, status: STATUS.LIVE, view: true,
    parent: "projects", localized: true, indexable: false,
    path: urlProject,
    note: "One project. Chapter XIV: „Projekt jest centralnym elementem darmowego konta " +
      "LiczMat.” The id goes in the query string, not the path — a project id is made in " +
      "the browser and is unbounded, and GitHub Pages serves files with no rewrites, " +
      "which is the same wall /p/<token> hits. That makes it a `view`: a screen of its " +
      "own with no file of its own, rendered into /projekty/ by assets/workspace-ui.js. " +
      "GUEST for the reason /projekty/ and the dashboard are — the project is a row in " +
      "this browser's localStorage and belongs to whoever is sitting at it; an account " +
      "adds sync, not the right to read your own work. Session 15 built the C, R, U and " +
      "D of it; the sections chapter XIV also names arrive with their own sessions " +
      "(materials 17, notes 18, costs 19, rooms 20).",
  },
  {
    id: "estimate",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "projects", localized: true, indexable: true,
    path: urlEstimate,
    footer: { order: 4, key: "estpage_title" },
    note: "Chapter XVI and XVII: the material list and its costs. Same local-first rule " +
      "as /projekty/.",
  },

  /* ---------------------------------------------------------------- liczmat pro */
  {
    id: "clients",
    level: LEVEL.PRO, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlClients,
    footer: { order: 7, key: "clipage_title" },
    navLevel: LEVEL.PRO,
    gate: "Chapter XXV, built in session 27: proGate() in src/pro.mjs stands in place " +
      "of the module — the module named and described, \"Dostępne w LiczMat Pro\", the " +
      "other four Pro modules listed so the wall shows the whole product, and one rung " +
      "of the Free → Pro path chosen from the visitor's level (a guest is sent to sign " +
      "up, a free account is told its plan). Never a dead button: \"Poznaj LiczMat Pro\" " +
      "stays a sentence while /liczmat-pro/ is PLANNED. LM_PRO_LOCKED in assets/plan.js " +
      "is `true` from session 27 on. Session 28 removed the preview that stood beside it " +
      "and put the subscription there instead: the wall quotes both plans from " +
      "assets/pay.js and sends the visitor to /app/, which is the only page that knows " +
      "the uid a payment has to be attached to.",
    note: "Chapter XX, and the first of the five Pro modules. The client list lives in " +
      "assets/crm.js — localStorage, this browser only: `clients` is not in the sync " +
      "contract (docs/FIRESTORE_SYNC.md in the app repo has projects, rooms, " +
      "estimations, shoppingItems and sharedProjects, and nothing else), so nothing " +
      "here is pushed anywhere and the page says so. `navLevel` keeps the footer link " +
      "for a Pro account and for a crawler with no JavaScript, which is what leaves the " +
      "page indexable — chapter XXVI wants Pro described in public, and the module " +
      "itself holds no content worth hiding, only somebody's own rows.",
  },
  {
    id: "client",
    level: LEVEL.PRO, status: STATUS.LIVE, view: true,
    parent: "clients", localized: true, indexable: false,
    path: urlClient,
    gate: "As clients — it is the same file.",
    note: "One client: contact details, notes, the projects filed under them and what " +
      "they came to. A `view` for the reason `project` is one — the id is made in this " +
      "browser, so /klienci/?id=<clientId> is the only shape GitHub Pages can serve.",
  },

  {
    id: "jobs",
    level: LEVEL.PRO, status: STATUS.LIVE,
    parent: "clients", localized: true, indexable: true,
    path: urlJobs,
    footer: { order: 8, key: "jobpage_title" },
    navLevel: LEVEL.PRO,
    gate: "As clients — the same wall, from the same builder (proGate() in " +
      "src/pro.mjs) and behind the same switch.",
    note: "Chapter XXI, and the second of the five Pro modules. A job is chapter XXIV's " +
      "middle step — KLIENT → ZLECENIE → PROJEKT — so it carries a client, a project, a " +
      "status, a date, an agreed value and notes. It lives in assets/crm.js beside the " +
      "clients, in the same browser-only store and for the same reason: `jobs` is not in " +
      "the sync contract either, so nothing here is pushed anywhere and the page says " +
      "so. Parented under `clients` because that is where the path starts; `navLevel` " +
      "keeps the footer link for a Pro account and for a crawler, which is what leaves " +
      "the page indexable.",
  },
  {
    id: "job",
    level: LEVEL.PRO, status: STATUS.LIVE, view: true,
    parent: "jobs", localized: true, indexable: false,
    path: urlJob,
    gate: "As jobs — it is the same file.",
    note: "One job: its client, its project, the status and the date, what was agreed " +
      "and what the work has actually cost so far. A `view` for the reason `client` is " +
      "one — the id is made in this browser, so /zlecenia/?id=<jobId> is the only shape " +
      "GitHub Pages can serve.",
  },

  {
    id: "quotes",
    level: LEVEL.PRO, status: STATUS.LIVE,
    parent: "jobs", localized: true, indexable: true,
    path: urlQuotes,
    footer: { order: 9, key: "quopage_title" },
    navLevel: LEVEL.PRO,
    gate: "As clients and jobs — the same wall, from the same builder.",
    note: "Chapter XXII, and the third of the five Pro modules: materials, labour, " +
      "other costs, margin, total — and no more, because the chapter says in one line " +
      "not to build an accounting package. It is chapter XXIV's fourth step, and the " +
      "one field it stores a link in is `projectId`: the materials and the other costs " +
      "are wsProjectCosts() over that project, and the client and the job are already " +
      "reachable from it, so storing them again would be two more links free to " +
      "disagree with the first. The rows live in assets/crm.js beside the clients and " +
      "the jobs, in the same browser-only store and for the same reason — `quotes` is " +
      "not in the sync contract — so nothing here is pushed anywhere and the page says " +
      "so.",
  },
  {
    id: "quote",
    level: LEVEL.PRO, status: STATUS.LIVE, view: true,
    parent: "quotes", localized: true, indexable: false,
    path: urlQuote,
    gate: "As quotes — it is the same file.",
    note: "One quote: the project it is priced from, the labour typed onto it, the " +
      "margin and what the whole thing comes to. A `view` for the reason `job` is one — " +
      "the id is made in this browser, so /wyceny/?id=<quoteId> is the only shape " +
      "GitHub Pages can serve.",
  },

  {
    id: "calendar",
    level: LEVEL.PRO, status: STATUS.LIVE,
    parent: "jobs", localized: true, indexable: true,
    path: urlCalendar,
    footer: { order: 10, key: "calpage_title" },
    navLevel: LEVEL.PRO,
    gate: "As clients, jobs and quotes — the same wall, from the same builder.",
    note: "Chapter XXIII, and the fourth of the five Pro modules: the deadlines of the " +
      "jobs, grouped by how close they are, and the basics beside each one. It is the " +
      "one Pro module that **stores nothing**: a deadline is a field of a job " +
      "(chapter XXI's `termin`), so the page reads `jobs` through crmSchedule() and its " +
      "single write is crmUpdateJob(). A `calendar` collection of its own would give one " +
      "date two homes and let them disagree. It is also why the route has no `?id=` " +
      "view: a row opens the job it belongs to, on /zlecenia/.",
  },

  /* ---------------------------------------------------------------- account */
  {
    id: "account",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: false, indexable: false,
    path: URL_APP,
    footer: { order: 2, key: "nav_app", group: "account" },
    note: "Sign-up, sign-in, sync, account settings and deletion. GUEST because the " +
      "sign-up form has to be reachable without an account. Language-neutral and " +
      "noindex: it holds no content worth ranking and shows private data.",
  },
  {
    id: "dashboard",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "account", localized: false, indexable: false,
    path: URL_DASHBOARD,
    footer: { order: 3, key: "nav_dashboard", group: "account" },
    note: "Chapter XIV of the sessions list (session 14): projects, recent calculations, " +
      "quick actions and recently used tools. It is the free account's home screen, and " +
      "session 3 declared it LICZMAT for that reason. Session 14 built it as GUEST, " +
      "because `level` is what a page *needs*: everything on it comes from " +
      "assets/workspace.js and assets/recent.js, which are localStorage in this browser " +
      "and belong to whoever is sitting at it. The only thing that could lock a guest " +
      "out is `liczmat-signed-in`, and that is a copy hint which may be stale — gating " +
      "on it would hide somebody's own projects from them after a token expired. So a " +
      "guest sees their own data and a card saying what an account adds; the same rule " +
      "as /projekty/ (see docs/ARCHITEKTURA.md). Language-neutral and noindex, under " +
      "/app/, because it shows private data.",
  },
  {
    id: "share",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "estimate", localized: false, indexable: false,
    path: URL_SHARE,
    note: "/p/<token>, a read-only estimate. GUEST on purpose — the point of a share " +
      "link is that the recipient needs nothing. 404.html forwards /p/<token> to " +
      "/p/?t=<token> because GitHub Pages has no rewrites.",
  },

  /* ---------------------------------------------------------------- legal */
  {
    id: "cookies",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlCookies,
  },
  {
    id: "privacy",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: false, indexable: true,
    path: URL_PRIVACY,
    generated: false,
    note: "Hand-written, PL + EN in one file. Its twin is docs/privacy-policy.html in " +
      "the app repo; change one, change both.",
  },

  /* ---------------------------------------------------------------- planned */
  {
    id: "liczmat-pro",
    level: LEVEL.GUEST, status: STATUS.PLANNED, session: 29,
    parent: "home", localized: true, indexable: true,
    plannedSlug: { pl: "liczmat-pro", uk: "liczmat-pro", de: "liczmat-pro", en: "liczmat-pro" },
    note: "The public page for Pro: what it is, what it costs, who it is for. Chapter X " +
      "makes it one of the three destinations of the home page, so it is GUEST and " +
      "indexable — the paywall sits on the Pro modules, not on their description.",
  },
];

const BY_ID = new Map(ROUTES.map((r) => [r.id, r]));
export const route = (id) => BY_ID.get(id);

export const liveRoutes = () => ROUTES.filter((r) => r.status === STATUS.LIVE);
export const plannedRoutes = () => ROUTES.filter((r) => r.status === STATUS.PLANNED);

/** The footer column a route belongs to. Everything without one is a product link. */
export const footerGroup = (r) => (r.footer && r.footer.group) || "product";

/**
 * The main navigation, in order. Header and footer both read this.
 *
 * @param {"header"|"footer"} slot
 * @param {string} [group] footer only: just that column ("product", "account").
 */
export const navRoutes = (slot, group) => ROUTES
  .filter((r) => r.status === STATUS.LIVE && r[slot])
  .filter((r) => !group || footerGroup(r) === group)
  .sort((a, b) => a[slot].order - b[slot].order);

/**
 * The route a URL belongs to, for the "you are here" mark in the navigation.
 *
 * Longest prefix wins, so /kalkulatory/tapety/ lights up "Kalkulatory" and
 * /de/rechner/ lights up the German one. The home page is not in the navigation, and
 * it would prefix-match everything in its language, so it never takes part.
 */
export function currentNavRoute(slot, lang, path) {
  let best = null;
  for (const r of navRoutes(slot)) {
    const here = r.localized ? r.path(lang) : r.path;
    if (path !== here && !path.startsWith(here)) continue;
    if (!best || here.length > best.len) best = { route: r, len: here.length };
  }
  return best && best.route;
}

/** The trail from the root down to `id`, including it. Breadcrumbs walk this. */
export function trail(id) {
  const out = [];
  for (let r = route(id); r; r = r.parent ? route(r.parent) : null) {
    out.unshift(r);
    if (out.length > ROUTES.length) break; // a cycle; validate() reports it properly
  }
  return out;
}

/* ------------------------------------------------------------------ calculator hub */

/**
 * How `/kalkulatory/` groups the calculators — chapter XI.
 *
 * "Logiczne kategorie … nie twórz sztucznych kategorii": the groups below are the ones
 * the fifteen calculators actually fall into, and chapter XI names four of the five by
 * hand (płytki i wykończenie, malowanie, budowa, rozkrój, zabudowa).
 *
 * They are not the four tabs `assets/calculators.js` carries on `calc.tab`. That field is
 * the Android app's own grouping, ported with the engines, and it puts "Klej / zaprawa"
 * and "Fuga" under building work — three screens away from the tile calculator they are
 * always used with. How the website sorts its own hub is a website decision, so it lives
 * here; the engines keep their field and their maths untouched (chapter XIII).
 *
 *   id     the section's anchor on the hub: `#g-<id>`, and the filter's value.
 *   key    dictionary prefix — `cc_<id>` is the name, `cc_<id>_d` the line under it.
 *   calcs  ids from CALCS, in the order the group lists them.
 *
 * `validateCalcHub()` requires every calculator to sit in exactly one group, so a new
 * calculator cannot quietly fail to appear on the hub.
 */
export const CALC_CATEGORIES = [
  { id: "tiling", key: "cc_tiling", calcs: ["waste", "mortar", "grout"] },
  { id: "painting", key: "cc_painting", calcs: ["coverage", "wallpaper"] },
  { id: "building", key: "cc_building", calcs: ["concrete", "screed", "masonry", "insulation"] },
  { id: "cutting", key: "cc_cutting", calcs: ["linear", "sheet"] },
  { id: "drywall", key: "cc_drywall", calcs: ["studwall", "ceiling", "drylining", "sheathing"] },
];

const CAT_OF = new Map(
  CALC_CATEGORIES.flatMap((c) => c.calcs.map((id) => [id, c])));

/** The group one calculator belongs to, or undefined if nobody placed it. */
export const calcCategory = (calcId) => CAT_OF.get(calcId);

/**
 * The shortlist the hub puts above the full list — chapter XI's "popularne kalkulatory".
 *
 * There is no traffic data on this site to rank by, and CLAUDE.md forbids a number on a
 * page that cannot be traced to the code, so "popular" is not asserted: the shortlist is
 * the calculators the site's own guides send people to most often, counted from GUIDES.
 * The page says exactly that under the heading, so the claim is checkable by reading it.
 *
 * Ties are broken by the order of CALCS, which makes the list deterministic — the build
 * writes the same four pages twice in a row.
 *
 * @param {object[]} guides GUIDES from src/site.mjs
 * @param {object[]} calcs CALCS from assets/calculators.js
 * @param {number} n how many to return
 */
export function popularCalcs(guides, calcs, n = 4) {
  const uses = new Map(calcs.map((c) => [c.id, 0]));
  for (const g of guides) {
    for (const id of g.calcs || []) if (uses.has(id)) uses.set(id, uses.get(id) + 1);
  }
  const order = new Map(calcs.map((c, i) => [c.id, i]));
  return calcs
    .filter((c) => uses.get(c.id) > 0)
    .sort((a, b) => (uses.get(b.id) - uses.get(a.id)) || (order.get(a.id) - order.get(b.id)))
    .slice(0, n);
}

/**
 * The hub's own consistency, checked at build time.
 *
 * `validateIA()` cannot do this: it has no access to CALCS or GUIDES, which are browser
 * scripts that `scripts/build.mjs` evaluates. Same contract — one line per problem.
 *
 * @param {object[]} calcs CALCS from assets/calculators.js
 * @param {object[]} guides GUIDES from src/site.mjs
 * @returns {string[]}
 */
export function validateCalcHub(calcs, guides) {
  const problems = [];
  const known = new Set(calcs.map((c) => c.id));
  const placed = new Map();

  const ids = new Set();
  for (const cat of CALC_CATEGORIES) {
    if (ids.has(cat.id)) problems.push(`IA: duplicate calculator category "${cat.id}"`);
    ids.add(cat.id);
    if (!cat.calcs.length) problems.push(`IA: calculator category "${cat.id}" is empty`);
    for (const id of cat.calcs) {
      if (!known.has(id)) problems.push(`IA: category "${cat.id}" lists unknown calculator "${id}"`);
      if (placed.has(id)) problems.push(`IA: calculator "${id}" is in both "${placed.get(id)}" and "${cat.id}"`);
      placed.set(id, cat.id);
    }
  }
  for (const c of calcs) {
    if (!placed.has(c.id)) {
      problems.push(`IA: calculator "${c.id}" is in no category — it would not appear on ` +
        `the hub. Add it to CALC_CATEGORIES in src/ia.mjs.`);
    }
  }

  // The shortlist is only honest while it really is the guides' own ranking.
  const popular = popularCalcs(guides, calcs);
  if (!popular.length) {
    problems.push("IA: no guide links to any calculator, so the hub's shortlist would be " +
      "empty — drop the section or give it another source");
  }
  for (const c of popular) {
    if (!known.has(c.id)) problems.push(`IA: shortlist names unknown calculator "${c.id}"`);
  }

  return problems;
}

/* ------------------------------------------------------------------ home page */

/**
 * The three ways out of the home page, in order — chapter X.
 *
 * "Homepage powinien prowadzić przede wszystkim do trzech obszarów: KALKULATORY /
 * LICZMAT / LICZMAT PRO." Written here rather than in `src/pages.mjs` because it is an
 * architecture decision: it is the only place the three access levels of chapter II are
 * offered to the visitor as a choice, so the set has to stay exactly three, in level
 * order, each pointing at a route that exists.
 *
 *   route  the page the door opens. A PLANNED one is rendered as text with no link —
 *          `src/pages.mjs` reads the status, so the door cannot promise a dead URL.
 *   level  who the door is for. This is the audience, not the route's access level:
 *          `/projekty/` is GUEST (it works in the browser without an account) while the
 *          LiczMat door is about what an account adds on top of it.
 *   keys   the dictionary prefix; `<key>_t`, `_q`, `_d`, `_go` in all four languages.
 */
export const HOME_DOORS = [
  { id: "calculators", route: "calculators", level: LEVEL.GUEST, key: "door_calc" },
  { id: "liczmat", route: "projects", level: LEVEL.LICZMAT, key: "door_lm" },
  { id: "pro", route: "liczmat-pro", level: LEVEL.PRO, key: "door_pro" },
];

/* ------------------------------------------------------------------ account levels */

/**
 * The three levels as the *visitor* meets them, not as a route needs them.
 *
 * `LEVEL` above answers "what does this page require". This answers the other half of
 * chapter II — "każdy element aplikacji powinien jednoznacznie wiedzieć, do którego
 * poziomu dostępu należy" — for the person: /app/ renders the level somebody is on, and
 * what the next one adds, out of this list. Written here rather than in the page so the
 * set stays exactly the three of chapter II, in order, and so a fourth one ("Firma",
 * "Team", "Admin" — all forbidden today) cannot be added by editing a template.
 *
 *   level  LEVEL.*
 *   key    dictionary prefix: `<key>_t` is the name, `<key>_d` the line under it.
 *   can    the bullet keys — what chapter II says this level may do.
 *   route  the page that explains the level, when it has one.
 *
 * Which level a signed-in visitor is actually on is decided in the browser, from
 * `users/{uid}.plan` — see lmLevelOf() in assets/account.js. That field is written
 * server-side only, so the page can read the level but nobody can grant themselves one.
 */
export const ACCOUNT_LEVELS = [
  {
    level: LEVEL.GUEST, key: "acc_guest",
    can: ["acc_guest_1", "acc_guest_2", "acc_guest_3"],
  },
  {
    level: LEVEL.LICZMAT, key: "acc_liczmat",
    can: ["acc_liczmat_1", "acc_liczmat_2", "acc_liczmat_3", "acc_liczmat_4"],
  },
  {
    level: LEVEL.PRO, key: "acc_pro", route: "liczmat-pro",
    can: ["acc_pro_1", "acc_pro_2", "acc_pro_3", "acc_pro_4"],
  },
];

export const accountLevel = (level) => ACCOUNT_LEVELS.find((l) => l.level === level);

/** Every dictionary key the level cards spend, so the build can check all four languages. */
export const accountLevelKeys = () => ACCOUNT_LEVELS
  .flatMap((l) => [`${l.key}_t`, `${l.key}_d`, ...l.can]);

/* ------------------------------------------------------------------ user flows */

/**
 * The three journeys of chapter II, as route ids. `via` names the step that is not a
 * page — a result, a button, a decision — so the chain reads the way the plan writes it.
 *
 * These are validated: every id must be a real route, and a flow may never step from a
 * lower level into a higher one without a step that says so.
 */
export const FLOWS = [
  {
    id: "guest",
    level: LEVEL.GUEST,
    title: "GOŚĆ",
    steps: [
      { route: "home" },
      { route: "calculators", via: "wyszukiwarka / kategoria" },
      { route: "calculator", via: "formularz" },
      { via: "WYNIK — pełna wartość, bez konta" },
      { via: "„Chcesz zachować ten wynik?”" },
      { route: "account", via: "rejestracja", enters: LEVEL.LICZMAT },
    ],
  },
  {
    id: "liczmat",
    level: LEVEL.LICZMAT,
    title: "LICZMAT",
    steps: [
      { route: "calculator" },
      { via: "WYNIK" },
      { route: "projects", via: "„Dodaj do projektu”" },
      { route: "project", via: "kalkulacje + pomieszczenia" },
      { route: "estimate", via: "materiały → koszty" },
      // Session 14 gave that last step a page: the dashboard is where the earlier
      // calculations, the projects and the tools already used are listed.
      { route: "dashboard", via: "HISTORIA — powrót do wcześniejszych obliczeń" },
    ],
  },
  {
    id: "pro",
    level: LEVEL.PRO,
    title: "LICZMAT PRO",
    steps: [
      { route: "clients" },
      { route: "jobs", via: "status + termin" },
      { route: "project", via: "zlecenie → projekt" },
      { route: "estimate", via: "materiały + koszty" },
      { route: "quotes", via: "robocizna + marża" },
      { route: "calendar", via: "termin" },
      { via: "HISTORIA / CRM" },
    ],
  },
];

/* ------------------------------------------------------------------ URL expansion */

/**
 * Every HTML file the live routes claim, as a repo-relative path.
 *
 * `scripts/build.mjs` compares this with what it actually wrote. The two sets have to
 * match exactly: a page nobody declared, or a declaration nobody builds, aborts the
 * build instead of shipping.
 *
 * @param {object[]} calcs CALCS from assets/calculators.js
 * @param {object[]} guides GUIDES from src/site.mjs
 * @returns {Set<string>} e.g. "kalkulatory/tapety/index.html", "app/index.html"
 */
export function livePaths(calcs, guides) {
  const out = new Set();
  const file = (url) => `${url.replace(/^\//, "")}index.html`;

  for (const r of liveRoutes()) {
    if (r.generated === false) continue; // hand-written: privacy-policy.html
    if (r.view) continue; // a state of its parent page: the parent's file is the file
    if (!r.localized) { out.add(file(r.path)); continue; }
    for (const lang of LANGS) {
      if (r.each === "calculator") for (const c of calcs) out.add(file(r.path(lang, c)));
      else if (r.each === "guide") for (const g of guides) out.add(file(r.path(lang, g)));
      else out.add(file(r.path(lang)));
    }
  }
  return out;
}

/* ------------------------------------------------------------------ validation */

/**
 * Everything that can be wrong with the architecture itself, independent of the pages.
 * `scripts/build.mjs` calls this alongside its dictionary checks.
 *
 * @returns {string[]} one line per problem; empty means the IA is consistent.
 */
export function validateIA() {
  const problems = [];
  const ids = new Set();

  for (const r of ROUTES) {
    if (ids.has(r.id)) problems.push(`IA: duplicate route id "${r.id}"`);
    ids.add(r.id);

    if (!LEVEL_ORDER.includes(r.level)) problems.push(`IA: route "${r.id}" has unknown level "${r.level}"`);
    if (r.parent && !BY_ID.has(r.parent)) problems.push(`IA: route "${r.id}" has unknown parent "${r.parent}"`);

    if (r.status === STATUS.LIVE) {
      if (!r.path) problems.push(`IA: live route "${r.id}" has no path`);
      if (r.localized && typeof r.path !== "function") problems.push(`IA: localized route "${r.id}" needs a path(lang)`);
      if (!r.localized && typeof r.path !== "string") problems.push(`IA: language-neutral route "${r.id}" needs a literal path`);
    } else {
      if (r.view) problems.push(`IA: route "${r.id}" is a view but is not live — a view has no page of its own to plan`);
      if (!r.session) problems.push(`IA: planned route "${r.id}" does not name its session`);
      if (r.path) problems.push(`IA: planned route "${r.id}" must not have a live path`);
      if (r.localized && r.plannedSlug) {
        for (const lang of LANGS) {
          if (!r.plannedSlug[lang]) problems.push(`IA: planned route "${r.id}" has no ${lang} slug`);
        }
      }
    }

    // Chapter XXV: a Pro page a free user can reach must say what it is, not fail shut.
    if (r.level === LEVEL.PRO && !r.gate) {
      problems.push(`IA: Pro route "${r.id}" does not say what a free user sees (gate)`);
    }
    // A page nobody may index must never be sold as content.
    if (r.indexable && r.level === LEVEL.PRO && !r.gate) {
      problems.push(`IA: indexable Pro route "${r.id}" needs a public state`);
    }
  }

  // A cycle in the tree would make breadcrumbs loop forever.
  for (const r of ROUTES) {
    const seen = new Set();
    for (let cur = r; cur; cur = cur.parent ? BY_ID.get(cur.parent) : null) {
      if (seen.has(cur.id)) { problems.push(`IA: parent cycle through "${r.id}"`); break; }
      seen.add(cur.id);
    }
  }

  // A view is a screen with no file of its own, so it can only be honest about four
  // things: it hangs off a real page, that page is the one that renders it, nothing may
  // link to it from the navigation (the URL needs a key only one visitor has), and it may
  // not be indexed. The last check is the load-bearing one: `livePaths()` skips views, so
  // a view whose URL is not inside its parent's would be a page the build never writes
  // and the check against the IA would never notice.
  for (const r of ROUTES) {
    if (!r.view || r.status !== STATUS.LIVE) continue;
    const parent = r.parent ? BY_ID.get(r.parent) : null;
    if (!parent) { problems.push(`IA: view "${r.id}" has no parent page to be a state of`); continue; }
    if (parent.status !== STATUS.LIVE) problems.push(`IA: view "${r.id}" is a state of "${parent.id}", which is not built`);
    if (parent.view) problems.push(`IA: view "${r.id}" hangs off another view ("${parent.id}")`);
    if (r.indexable) problems.push(`IA: view "${r.id}" is indexable, but it has no URL of its own to index`);
    if (r.header || r.footer) problems.push(`IA: view "${r.id}" is in the navigation, but its URL needs a key only one visitor has`);
    if (!allows(parent.level, r.level)) {
      problems.push(`IA: view "${r.id}" needs ${r.level} while "${parent.id}" needs ` +
        `${parent.level} — the page that renders it would have to gate part of itself`);
    }
    if (r.localized !== parent.localized) {
      problems.push(`IA: view "${r.id}" is ${r.localized ? "" : "not "}localized but "${parent.id}" is ` +
        `${parent.localized ? "" : "not "}— they are the same file`);
    }
    if (typeof r.path === "function" && typeof parent.path === "function") {
      for (const lang of LANGS) {
        const url = r.path(lang, "probe");
        if (!url.startsWith(parent.path(lang))) {
          problems.push(`IA: view "${r.id}" points at ${url} in ${lang}, outside "${parent.id}" ` +
            `(${parent.path(lang)}) — the build writes no file for it`);
        }
        if (!url.includes("probe")) problems.push(`IA: view "${r.id}" drops its key from the ${lang} URL`);
      }
    }
  }

  // A planned slug must not already belong to a section that ships.
  const takenIn = Object.fromEntries(
    LANGS.map((lang) => [lang, new Set(Object.values(SECTION).map((s) => s[lang]))]));
  for (const r of plannedRoutes()) {
    if (!r.plannedSlug) continue;
    for (const lang of LANGS) {
      if (takenIn[lang].has(r.plannedSlug[lang])) {
        problems.push(`IA: planned route "${r.id}" claims "${r.plannedSlug[lang]}", already a ${lang} section`);
      }
    }
  }
  // Two planned routes must not claim the same segment either.
  for (const lang of LANGS) {
    const seen = new Map();
    for (const r of plannedRoutes()) {
      if (!r.plannedSlug) continue;
      const s = r.plannedSlug[lang];
      if (seen.has(s)) problems.push(`IA: "${r.id}" and "${seen.get(s)}" both claim the ${lang} slug "${s}"`);
      seen.set(s, r.id);
    }
  }

  // Navigation: no two links in the same slot (and footer column) at the same position.
  for (const slot of ["header", "footer"]) {
    const seen = new Map();
    for (const r of ROUTES) {
      if (!r[slot]) continue;
      if (r.status !== STATUS.LIVE) { problems.push(`IA: planned route "${r.id}" is in the ${slot}`); continue; }
      if (!r[slot].key) problems.push(`IA: route "${r.id}" is in the ${slot} without a label key`);
      const at = slot === "footer" ? `${footerGroup(r)}:${r[slot].order}` : String(r[slot].order);
      if (seen.has(at)) problems.push(`IA: "${r.id}" and "${seen.get(at)}" are both at ${slot} position ${at}`);
      seen.set(at, r.id);
    }
  }

  // The header row holds the links, the pickers and the account button. Session 5 put the
  // ceiling at four after measuring German wrapping between 900px and 1080px; the fifth
  // ("Aplikacja", asked for after session 20) was measured the same way rather than
  // assumed — scripts/test-pages.mjs checks the row stays on one line in all four
  // languages at 900 / 1000 / 1160 / 1280 px, and the tightening at max-width: 1160px in
  // assets/styles.css is what buys the room. Below 900px the navigation is a drawer and
  // cannot wrap at all. A sixth link has not been measured, so it is still refused.
  const inHeader = navRoutes("header").length;
  if (inHeader > 5) problems.push(`IA: ${inHeader} links in the header — the row fits five`);

  // A link nobody can be shown is a link nobody wrote on purpose. `navLevel` decides
  // whether the menu offers a route; it can never be *below* the level needed to use the
  // page, because that would advertise a door and then refuse it.
  for (const r of ROUTES) {
    if (!r.navLevel) continue;
    if (!LEVEL_ORDER.includes(r.navLevel)) {
      problems.push(`IA: route "${r.id}" has navLevel "${r.navLevel}", which is not a level`);
      continue;
    }
    if (!r.header && !r.footer) {
      problems.push(`IA: route "${r.id}" has a navLevel but is in no navigation`);
    }
    if (!allows(r.navLevel, r.level)) {
      problems.push(`IA: route "${r.id}" shows its link at "${r.navLevel}" but needs "${r.level}" to use`);
    }
  }

  // The home page offers the three areas of chapter X, one per access level, in order.
  // Anything else — a fourth door, two doors for the same level, a door onto a route
  // nobody declared — is the home page drifting back into a list of everything.
  const doorLevels = HOME_DOORS.map((d) => d.level);
  if (doorLevels.join() !== LEVEL_ORDER.join()) {
    problems.push(`IA: the home page offers [${doorLevels.join(", ")}] — chapter X wants ` +
      `exactly [${LEVEL_ORDER.join(", ")}], in that order`);
  }
  for (const door of HOME_DOORS) {
    const r = BY_ID.get(door.route);
    if (!r) { problems.push(`IA: home door "${door.id}" opens onto unknown route "${door.route}"`); continue; }
    if (!door.key) problems.push(`IA: home door "${door.id}" has no dictionary key`);
    if (r.level === LEVEL.PRO && r.status === STATUS.LIVE && !r.gate) {
      problems.push(`IA: home door "${door.id}" leads to a Pro page with no public state`);
    }
  }

  // The account levels are chapter II's three, in order, each saying what it may do.
  // A fourth level, a missing one or a reordering is the model drifting, and the model
  // is what /app/ tells the visitor they are on.
  const levels = ACCOUNT_LEVELS.map((l) => l.level);
  if (levels.join() !== LEVEL_ORDER.join()) {
    problems.push(`IA: the account levels are [${levels.join(", ")}] — chapter II has ` +
      `exactly [${LEVEL_ORDER.join(", ")}], in that order`);
  }
  const levelKeys = new Set();
  for (const l of ACCOUNT_LEVELS) {
    if (!l.key) { problems.push(`IA: account level "${l.level}" has no dictionary key`); continue; }
    if (levelKeys.has(l.key)) problems.push(`IA: two account levels use the key "${l.key}"`);
    levelKeys.add(l.key);
    if (!l.can || l.can.length < 2) {
      problems.push(`IA: account level "${l.level}" lists ${(l.can || []).length} thing(s) ` +
        `it can do — chapter II gives every level more than one`);
    }
    if (l.route && !BY_ID.has(l.route)) {
      problems.push(`IA: account level "${l.level}" points at unknown route "${l.route}"`);
    }
  }

  // Flows: every step names a real route, and a step that raises the level says so.
  for (const flow of FLOWS) {
    let level = LEVEL.GUEST;
    for (const step of flow.steps) {
      if (step.enters) level = step.enters;
      if (!step.route) continue;
      const r = BY_ID.get(step.route);
      if (!r) { problems.push(`IA: flow "${flow.id}" steps onto unknown route "${step.route}"`); continue; }
      const at = flow.id === "guest" ? level : flow.level;
      if (!allows(at, r.level)) {
        problems.push(`IA: flow "${flow.id}" reaches "${r.id}" (${r.level}) as ${at} — ` +
          `add the step that raises the level, or the flow is wrong`);
      }
    }
  }

  return problems;
}
