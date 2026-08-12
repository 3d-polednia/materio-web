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
  urlProjects, urlEstimate, urlAndroid, urlCookies,
  URL_APP, URL_SHARE, URL_PRIVACY,
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
 *   header      { order, key } — a link in the main navigation, at that position.
 *   footer      { order, key } — a link in the footer's product column.
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
    note: "Chapter XI: search, categories, filters, popular. Session 7 rebuilds it.",
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
    header: { order: 5, key: "nav_stores" },
    footer: { order: 6, key: "nav_stores" },
  },
  {
    id: "android",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlAndroid,
    header: { order: 6, key: "nav_app_page" },
    note: "One page for the Android app. Chapter X: it must not be pushed on the home page.",
  },

  /* ---------------------------------------------------------------- the workspace */
  {
    id: "projects",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: true, indexable: true,
    path: urlProjects,
    header: { order: 3, key: "nav_projects" },
    footer: { order: 3, key: "nav_projects" },
    note: "Chapter XIV makes the project the centre of the free account. The page is " +
      "GUEST because assets/workspace.js keeps projects in localStorage in the " +
      "Firestore document shape, so it works before anyone signs in; an account adds " +
      "sync across devices, not the ability to count. See docs/ARCHITEKTURA.md, " +
      "'Poziom /projekty/ i /kosztorys/'.",
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

  /* ---------------------------------------------------------------- account */
  {
    id: "account",
    level: LEVEL.GUEST, status: STATUS.LIVE,
    parent: "home", localized: false, indexable: false,
    path: URL_APP,
    note: "Sign-up, sign-in, sync, account settings and deletion. GUEST because the " +
      "sign-up form has to be reachable without an account. Language-neutral and " +
      "noindex: it holds no content worth ranking and shows private data.",
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
  {
    id: "dashboard",
    level: LEVEL.LICZMAT, status: STATUS.PLANNED, session: 14,
    parent: "account", localized: false, indexable: false,
    plannedPath: "/app/pulpit/",
    note: "Chapter XIV of the sessions list: projects, recent calculations, quick " +
      "actions, recently used tools. Lives under /app/ because it is all private data.",
  },
  {
    id: "project",
    level: LEVEL.LICZMAT, status: STATUS.PLANNED, session: 15,
    parent: "projects", localized: true, indexable: false,
    plannedPath: "?id=<projectId>",
    note: "One project: rooms, calculations, materials, costs, notes, history. The id " +
      "goes in the query string, not the path — GitHub Pages cannot rewrite an " +
      "unbounded segment, which is why /p/<token> already needs a 404.html hop.",
  },
  {
    id: "clients",
    level: LEVEL.PRO, status: STATUS.PLANNED, session: 22,
    parent: "home", localized: true, indexable: true,
    plannedSlug: { pl: "klienci", uk: "kliyenty", de: "kunden", en: "clients" },
    gate: "Chapter XXV: a free user sees what the module is and the words " +
      "\"Dostępne w LiczMat Pro\", never a dead button.",
  },
  {
    id: "jobs",
    level: LEVEL.PRO, status: STATUS.PLANNED, session: 23,
    parent: "clients", localized: true, indexable: true,
    plannedSlug: { pl: "zlecenia", uk: "zamovlennya", de: "auftraege", en: "jobs" },
    gate: "As clients.",
  },
  {
    id: "quotes",
    level: LEVEL.PRO, status: STATUS.PLANNED, session: 24,
    parent: "jobs", localized: true, indexable: true,
    plannedSlug: { pl: "wyceny", uk: "koshtorysy-pro", de: "angebote", en: "quotes" },
    gate: "As clients.",
    note: "Materials, labour, other costs, margin, total. Chapter XXII: not an " +
      "accounting package.",
  },
  {
    id: "calendar",
    level: LEVEL.PRO, status: STATUS.PLANNED, session: 25,
    parent: "jobs", localized: true, indexable: true,
    plannedSlug: { pl: "terminarz", uk: "kalendar", de: "termine", en: "schedule" },
    gate: "As clients.",
    note: "Chapter XXIII: job dates, nothing resembling Google Calendar.",
  },
];

const BY_ID = new Map(ROUTES.map((r) => [r.id, r]));
export const route = (id) => BY_ID.get(id);

export const liveRoutes = () => ROUTES.filter((r) => r.status === STATUS.LIVE);
export const plannedRoutes = () => ROUTES.filter((r) => r.status === STATUS.PLANNED);

/** The main navigation, in order. Header and footer both read this. */
export const navRoutes = (slot) => ROUTES
  .filter((r) => r.status === STATUS.LIVE && r[slot])
  .sort((a, b) => a[slot].order - b[slot].order);

/** The trail from the root down to `id`, including it. Breadcrumbs walk this. */
export function trail(id) {
  const out = [];
  for (let r = route(id); r; r = r.parent ? route(r.parent) : null) {
    out.unshift(r);
    if (out.length > ROUTES.length) break; // a cycle; validate() reports it properly
  }
  return out;
}

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
      { via: "HISTORIA — powrót do wcześniejszych obliczeń" },
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

  // Navigation: no two links in the same slot at the same position.
  for (const slot of ["header", "footer"]) {
    const seen = new Map();
    for (const r of ROUTES) {
      if (!r[slot]) continue;
      if (r.status !== STATUS.LIVE) { problems.push(`IA: planned route "${r.id}" is in the ${slot}`); continue; }
      if (!r[slot].key) problems.push(`IA: route "${r.id}" is in the ${slot} without a label key`);
      const at = r[slot].order;
      if (seen.has(at)) problems.push(`IA: "${r.id}" and "${seen.get(at)}" are both at ${slot} position ${at}`);
      seen.set(at, r.id);
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
