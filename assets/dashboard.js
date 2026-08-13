/* LiczMat website — /app/dashboard/, the dashboard of the free account.
 *
 * Master plan, session 14: "Dashboard darmowego użytkownika. Powinien pokazywać przede
 * wszystkim: projekty, ostatnie kalkulacje, szybkie akcje, ostatnio używane narzędzia."
 *
 * Four lists, four sources, all of them already in this browser:
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
 * The page has no per-language URL (it is noindex and shows private data), so every
 * string here comes from t() and every list is redrawn on `langchange`. A row rendered
 * once would otherwise stay in the language it was drawn in.
 */

/** How many rows each section shows before the "see all" link takes over. */
const DASH_PROJECTS = 4;
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

/* ------------------------------------------------------------------ the identity strip */

/**
 * Which of chapter II's three levels this browser was last told it is on.
 *
 * `lmReadLevel()` is a copy hint (assets/account.js): it can be stale, so it decides
 * wording and the sign-up card, and nothing else. Nothing on this page is gated on it —
 * the projects below belong to the browser, not to the account, and hiding them from
 * somebody whose token quietly expired would be losing their work in front of them.
 */
function dashRenderLevel() {
  const chip = document.getElementById("dash-level");
  if (!chip) return;
  const level = typeof lmReadLevel === "function" ? lmReadLevel() : "guest";
  const name = { guest: "acc_guest_t", liczmat: "acc_liczmat_t", pro: "acc_pro_t" }[level];
  const note = { guest: "dash_level_guest", liczmat: "dash_level_in", pro: "dash_level_pro" }[level];

  chip.textContent = dashT(name);
  chip.classList.toggle("on", level !== "guest");
  const line = document.querySelector("[data-dash-note]");
  if (line) line.textContent = dashT(note);

  const signup = document.getElementById("dash-signup");
  if (signup) signup.hidden = level !== "guest";
}

/** Point every "see all" link and quick action at the language showing right now. */
function dashRenderLinks() {
  document.querySelectorAll("[data-dash-url]").forEach((a) => {
    a.setAttribute("href", dashUrl(a.dataset.dashUrl));
  });
}

/* ------------------------------------------------------------------ projekty */

function dashRenderProjects() {
  const list = document.getElementById("dash-projects");
  if (!list) return;
  const projects = wsProjects();
  const active = wsActiveProjectId();

  if (!projects.length) { list.innerHTML = dashEmpty("dash_projects_empty"); return; }

  list.innerHTML = projects.slice(0, DASH_PROJECTS).map((p) => {
    const total = wsProjectTotal(p.id);
    const money = total.count ? ` · ${dashEsc(wsMoney(total.minor, total.currencyCode))}` : "";
    // Lines saved in different currencies do not add up. /kosztorys/ has room for the
    // whole sentence; a row has room for two words and the sentence as its tooltip. What
    // it must not do is print the sum as though it meant something.
    const mixed = total.mixed
      ? ` <span class="chip warn" title="${dashEsc(dashT("ws_mixed_currency"))}">${dashEsc(dashT("dash_mixed"))}</span>`
      : "";
    return `<li data-id="${dashEsc(p.id)}"${p.id === active ? ' class="on"' : ""}>
        <span class="row-name">
          <b>${dashEsc(p.name)}</b>
          <em class="muted">${total.count} ${dashEsc(dashUnit("ws_lines", total.count))}${money} · ${dashEsc(dashDate(p.updatedAt))}${mixed}</em>
        </span>
        <span class="row-actions">
          ${p.id === active ? `<span class="chip on">${dashEsc(dashT("ws_active"))}</span>` : ""}
          <button type="button" class="btn btn-ghost btn-sm" data-open>${dashEsc(dashT("dash_open"))}</button>
        </span>
      </li>`;
  }).join("");
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

  const rows = wsEstimations()
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, DASH_LINES);

  if (!rows.length) { list.innerHTML = dashEmpty("dash_recent_empty"); return; }

  list.innerHTML = rows.map((r) => {
    const where = names[r.projectId] ? `${dashEsc(names[r.projectId])} · ` : "";
    const cost = r.totalCostMinor > 0
      ? `<em class="muted">${dashEsc(wsMoney(r.totalCostMinor, r.currencyCode))}</em>` : "";
    return `<li>
        <span class="row-name">
          <b>${dashEsc(r.name)}</b>
          <em class="muted">${where}${dashEsc(dashDate(r.createdAt))}</em>
        </span>
        <span class="dash-fig">
          <b>${dashEsc(dashNum(r.requiredUnits))} ${dashEsc(r.unitLabel)}</b>
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
  dashRenderLevel();
  dashRenderLinks();
  dashRenderProjects();
  dashRenderRecent();
  dashRenderTools();
}

function buildDashboard() {
  const list = document.getElementById("dash-projects");
  if (!list) return;

  // Opening a project means two things — make it the one the estimate page is about, and
  // go there. The dashboard is a way in, so it does both rather than leaving the visitor
  // to pick the project again one page later.
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li || !e.target.closest("[data-open]")) return;
    wsSetActiveProject(li.dataset.id);
    location.href = dashUrl("estimate");
  });

  const forget = document.getElementById("dash-tools-forget");
  if (forget) forget.addEventListener("click", () => {
    if (typeof lmRecentClear === "function") lmRecentClear();
  });

  document.addEventListener("workspacechange", dashRender);
  document.addEventListener("lm-recent", dashRenderTools);
  document.addEventListener("lm-session", dashRenderLevel);
  // Saved lines keep the currency they were priced in; the totals still have to be
  // relabelled when the visitor switches, exactly as /projekty/ and /kosztorys/ do.
  document.addEventListener("currencychange", dashRender);
  // The page swaps text in place instead of navigating, so everything JavaScript wrote
  // has to be written again in the new language — including the dates and the links.
  document.addEventListener("langchange", dashRender);

  dashRender();
}

document.addEventListener("DOMContentLoaded", buildDashboard);
