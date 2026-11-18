/* LiczMat website — reusable account-overview lists.
 *
 * Master plan, session 14: "Dashboard darmowego użytkownika. Powinien pokazywać przede
 * wszystkim: projekty, ostatnie kalkulacje, szybkie akcje, ostatnio używane narzędzia."
 *
 * The former /app/dashboard/ renderer stays shared so /app/ can use the two lists that
 * were unique to it without copying their logic. Its guarded project and identity
 * renderers remain compatible with the original frame; the live overview uses the
 * recent-calculation and recent-tool parts.
 *
 * Four sources, all of them already in this browser:
 *
 *   projekty              wsProjects()      assets/workspace.js
 *   ostatnie kalkulacje   wsEstimations()   assets/workspace.js — the saved estimate lines
 *   szybkie akcje         the build          real links; this file only re-points them
 *                                            at the current language
 *   ostatnio używane      lmRecentRead()    assets/recent.js
 *
 * Nothing here talks to the network — no Firebase, no Firestore, not even the level. The
 * page is the first screen after signing in and it has to open at the speed of a
 * calculator, so what it renders is the local workspace, which is the same data /app/
 * syncs and the same document shape the phone keeps.
 *
 * /app/ has no per-language URL (it is noindex and shows private data), so every
 * string here comes from t() and every list is redrawn on `langchange`. A row rendered
 * once would otherwise stay in the language it was drawn in.
 *
 * `costs` turned PRO on 2026-09-04 (assets/plan.js). This page still asks no server, so
 * it cannot know the level for certain the way /app/ can — dashCanCost() below reads the
 * same copy hint dashRenderLevel() already read for the identity chip. That is weaker than
 * /app/'s answer and known to be (docs/MASTER_PLAN.md); it is not weaker than what
 * /projekty/ and /kosztorys/ already ship with.
 */

/** How many rows each section shows before the "see all" link takes over. */
const DASH_LINES = 5;
const DASH_TOOLS = 4;

/** Per-language addresses and calculator icons, written into the page by the build. */
const DASH = (typeof window !== "undefined" && window.LM_DASH) || { urls: {}, calcs: {} };

const dashLang = () => document.documentElement.lang || "pl";
const dashT = (key) => (typeof t === "function" ? t(key, dashLang()) : key);
const dashEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dashNum = (v) => new Intl.NumberFormat(dashLang(), { maximumFractionDigits: 2 }).format(v);
/** The counted noun next to a number, inflected — assets/units.js, loaded before this. */
const dashUnit = (key, n) =>
  (typeof unitLabel === "function" ? unitLabel(key, n, dashLang(), dashT) : dashT(key));

/** A section's page, in the language showing right now; Polish is the fallback. */
function dashUrl(key) {
  const map = DASH.urls[key];
  if (!map) return "/";
  return map[dashLang()] || map.pl || "/";
}

/** The day something happened. No clock time: none of these lists is a log. */
function dashDate(ms) {
  const at = Number(ms);
  if (!isFinite(at) || at <= 0) return "";
  return new Date(at).toLocaleDateString(dashLang(), { day: "numeric", month: "short", year: "numeric" });
}

/** One `<li class="empty">` — every section says what to do instead of showing nothing. */
const dashEmpty = (key) => `<li class="empty muted" data-dash-empty>${dashEsc(dashT(key))}</li>`;

/**
 * May this browser show a price? — `costs` in LM_FEATURES, PRO since 2026-09-04.
 *
 * This page talks to no server (see the file header): it cannot ask Firebase for the
 * real level the way `state.level` on /app/ can, so it reads the same `liczmat-signed-in`
 * hint lmReadLevel() already reads for the identity chip — the same limitation
 * /projekty/ and /kosztorys/ carry (docs/MASTER_PLAN.md), not a new one. A missing
 * lmCan() — assets/plan.js failed to load — is a refusal, not a default of "show it":
 * nothing here computes or prints an amount for a level that does not reach `costs`.
 */
function dashCanCost() {
  const level = typeof lmReadLevel === "function" ? lmReadLevel() : "guest";
  return typeof lmCan === "function" && lmCan("costs", level);
}

/** Point every "see all" link and quick action at the language showing right now. */
function dashRenderLinks() {
  document.querySelectorAll("[data-dash-url]").forEach((a) => {
    a.setAttribute("href", dashUrl(a.dataset.dashUrl));
  });
}

/** A project is the owner of a saved calculation, so it is also its destination. */
function dashProjectUrl(projectId) {
  const base = dashUrl("projects");
  return projectId ? `${base}?id=${encodeURIComponent(projectId)}` : base;
}

/* ------------------------------------------------------------------ ostatnie kalkulacje */

/**
 * The saved estimate lines, newest first, across every project.
 *
 * "Ostatnie kalkulacje" is deliberately read as *what was kept*, not *what was typed*:
 * these are the rows the visitor pressed "Dodaj do projektu" on, and they are real
 * documents with a quantity, a unit and the currency they were priced in. Nothing on the
 * site records the calculations that were never saved, and inventing that store would put
 * somebody's inputs into localStorage without them asking.
 */
function dashRenderRecent() {
  const list = document.getElementById("dash-recent");
  if (!list) return;
  // Archived projects too (wsAllProjects, not wsProjects): a line saved in a project that
  // has since been put away is still one of the last things kept, and dropping the name
  // would leave the row saying where it came from with a blank.
  const names = {};
  wsAllProjects().forEach((p) => { names[p.id] = p.name; });

  const rows = (typeof wsCalcLines === "function" ? wsCalcLines() : wsEstimations())
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, DASH_LINES);

  // On the account overview this link used to say "all estimates" but open the quotes
  // list. Calculations belong to projects: one project's shortlist opens that project,
  // while a mixed or empty shortlist opens the projects list.
  const all = document.querySelector('[aria-labelledby="dash-recent-h"] [data-dash-url="estimate"]');
  if (all) {
    const projectIds = [...new Set(rows.map((row) => row.projectId).filter(Boolean))];
    all.setAttribute("href", projectIds.length === 1 ? dashProjectUrl(projectIds[0]) : dashUrl("projects"));
  }

  if (!rows.length) { list.innerHTML = dashEmpty("dash_recent_empty"); return; }

  const canCost = dashCanCost();
  list.innerHTML = rows.map((r) => {
    const where = names[r.projectId] ? `${dashEsc(names[r.projectId])} · ` : "";
    // PRO since 2026-09-04: the same dashCanCost() the project list above reads.
    const cost = canCost && r.totalCostMinor > 0
      ? `<em class="muted">${dashEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</em>` : "";
    return `<li>
        <span class="row-name">
          <a href="${dashEsc(dashProjectUrl(r.projectId))}"><b>${dashEsc(r.name)}</b></a>
          <em class="muted">${where}${dashEsc(dashDate(r.createdAt))}</em>
        </span>
        <span class="dash-fig">
          <b>${dashEsc(dashNum(r.requiredUnits))} ${dashEsc(unitText(r.unitLabel, r.requiredUnits, dashLang()))}</b>
          ${cost}
        </span>
      </li>`;
  }).join("");
}

/* ------------------------------------------------------------------ ostatnio używane */

function dashRenderTools() {
  const list = document.getElementById("dash-tools");
  if (!list) return;
  const forget = document.getElementById("dash-tools-forget");

  const used = (typeof lmRecentRead === "function" ? lmRecentRead() : [])
    // A calculator that no longer exists — an old entry, another version of the site —
    // has no page to open and no name to show, so it is dropped rather than rendered
    // as a dead tile.
    .filter((r) => DASH.calcs[r.id])
    .slice(0, DASH_TOOLS);

  if (forget) forget.hidden = used.length === 0;
  if (!used.length) { list.innerHTML = dashEmpty("dash_tools_empty"); return; }

  list.innerHTML = used.map((r) => {
    const calc = DASH.calcs[r.id];
    const href = calc.url[dashLang()] || calc.url.pl;
    // No "Otwórz kalkulator" label here, unlike the hub: four tiles abreast leave about
    // 260px each, and the label pushed a name like "Płytki, panele, gres" onto three
    // lines to repeat what the tile already is.
    return `<li><a class="calc-link" href="${dashEsc(href)}">
        <span class="ico">${calc.icon}</span>
        <span class="calc-link-body">
          <b>${dashEsc(dashT(`c_${r.id}_t`))}</b>
          <span class="muted">${dashEsc(dashDate(r.at))}</span>
        </span>
      </a></li>`;
  }).join("");
}

/* ------------------------------------------------------------------ wiring */

function dashRender() {
  dashRenderLinks();
  dashRenderRecent();
  dashRenderTools();
}

function buildDashboard() {
  if (!document.getElementById("dash-recent") && !document.getElementById("dash-tools")) return;

  const forget = document.getElementById("dash-tools-forget");
  if (forget) forget.addEventListener("click", () => {
    if (typeof lmRecentClear === "function") lmRecentClear();
  });

  document.addEventListener("workspacechange", dashRender);
  document.addEventListener("lm-recent", dashRenderTools);
  // Since 2026-09-04 the identity chip is not the only thing this reads the hint for —
  // dashCanCost() does too, so a level that moved has to redraw the money along with it.
  document.addEventListener("lm-session", dashRender);
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("lmlevelchange", dashRender);
  }
  // Saved lines keep the currency they were priced in; the totals still have to be
  // relabelled when the visitor switches, exactly as /projekty/ and /kosztorys/ do.
  document.addEventListener("currencychange", dashRender);
  // The page swaps text in place instead of navigating, so everything JavaScript wrote
  // has to be written again in the new language — including the dates and the links.
  document.addEventListener("langchange", dashRender);

  // This page loads no Firebase for speed, so a hint that claims Pro (the one thing that
  // shows prices here) is confirmed after the first draw: the same module the account
  // pages load, at the same cache stamp as this script, so the browser fetches one copy.
  // Not on /app/, which loads this file too: assets/app.js runs its own sync and confirms
  // the level itself (applyProfile()), and a second engine would push everything twice.
  const onApp = typeof document !== "undefined" && document.querySelector('script[src*="/assets/app."]');
  if (!onApp && typeof lmReadLevel === "function" && lmReadLevel() === "pro" && typeof window !== "undefined" && !window.__lmAccountSyncRunning) {
    const own = typeof document !== "undefined" && document.querySelector('script[src*="/assets/dashboard"]');
    const stamp = own && own.getAttribute("src").split("?")[1];
    import("/assets/account-sync-page.min.js" + (stamp ? "?" + stamp : "")).catch(() => {});
  }

  dashRender();
}

document.addEventListener("DOMContentLoaded", buildDashboard);
