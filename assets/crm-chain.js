/* LiczMat website — chapter XXIV's chain, drawn. Session 26 (CRM).
 *
 *     KLIENT → ZLECENIE → PROJEKT → WYCENA → HISTORIA
 *
 * The four Pro screens each own one end of that path: /klienci/ writes the client and the
 * project link, /zlecenia/ the job and its two links, /wyceny/ the quote, /terminarz/ the
 * deadline. What none of them owned is the path itself — so this file is loaded by all
 * four and draws the three things that are the same wherever they appear:
 *
 *   the strip     the four nodes in the chapter's order, the resolved ones as links to the
 *                 page that owns them, the unfilled ones as the way to go and make one
 *   the quotes    the list a client and a job both need and neither wrote before
 *   the history   chapter XXIV's last step, derived by crmHistory() in assets/crm.js
 *
 * Three copies of this in three page scripts would drift on the first correction, which is
 * the same argument that keeps the chain out of the store: it is walked, never copied.
 *
 * **Every name here starts `chn`.** These files are plain scripts sharing one global
 * scope — a `const crmEsc` here and another in assets/crm-ui.js is a SyntaxError that
 * takes the whole page down, not a shadowed variable.
 *
 * Nothing in this file writes. It reads assets/crm.js and assets/workspace.js, and the
 * addresses it links to come from `window.LM_LINKS`, which scripts/build.mjs writes into
 * every one of the four pages in that page's own language.
 */

/** The one link map the four Pro pages share. The build writes it; nothing else reads it. */
const chnLinks = () => (typeof window !== "undefined" && window.LM_LINKS) || {};

/**
 * The address of one section, in the language of the page asking.
 *
 * The fallback is the Polish slug rather than "#": a page whose head script failed should
 * still link somewhere real, and Polish is DEFAULT_LANG.
 */
const CHN_FALLBACK = {
  clients: "/klienci/", jobs: "/zlecenia/", projects: "/projekty/",
  quotes: "/wyceny/", calendar: "/terminarz/",
};
const chnUrl = (key) => chnLinks()[key] || CHN_FALLBACK[key] || "/";

/** One row of a section, by id: /klienci/?id=<id>. The same shape on all four pages. */
const chnRowUrl = (key, id) => `${chnUrl(key)}?id=${encodeURIComponent(id)}`;

const chnT = (key) => (typeof t === "function" ? t(key) : key);
const chnLang = () => document.documentElement.lang || "pl";
const chnEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chnNum = (v) => new Intl.NumberFormat(chnLang(), { maximumFractionDigits: 2 }).format(v);
const chnDate = (ms) => {
  const at = Number(ms);
  if (!isFinite(at) || at <= 0) return "";
  return new Date(at).toLocaleDateString(chnLang(), { day: "numeric", month: "short", year: "numeric" });
};
/** Money through the workspace's own formatter, so every screen reads the same. */
const chnMoney = (minor, code) =>
  (typeof wsMoney === "function" ? wsMoney(minor, code) : `${(Number(minor) / 100).toFixed(2)}`);

/* ------------------------------------------------------------------ the strip */

/** Which section of the site owns each node of the chain. */
const CHN_SECTION = { client: "clients", job: "jobs", project: "projects", quote: "quotes" };

/**
 * Chapter XXIV's path, as one row of links.
 *
 * A node the walk resolved is its name, linked to the page that owns it — except the node
 * the visitor is already standing on, which is bold and links nowhere: a link to the page
 * you are on is a dead click.
 *
 * A node the walk did **not** resolve is the section's own index instead of a name. Two
 * different things end up there and both are honest: a step nobody has filled in yet (a
 * project with no job), and a step that has more than one answer (a client's jobs, which
 * this browser will not guess between). Either way the way forward is the same page, so
 * the strip is a way to keep walking rather than a report.
 *
 * @param {HTMLElement} el
 * @param {object} chain crmChain()
 * @param {string} [current] the node this page is showing: "client" | "job" | ...
 */
function chnRenderStrip(el, chain, current) {
  if (!el) return;
  const at = String(current || (chain && chain.from) || "");
  const nodes = (typeof CRM_CHAIN !== "undefined" ? CRM_CHAIN : ["client", "job", "project", "quote"]);
  el.innerHTML = `<ol class="crm-chain-list">${nodes.map((node) => {
    const row = chain ? chain[node] : null;
    const label = `<span class="eyebrow muted">${chnEsc(chnT(`crm_node_${node}`))}</span>`;
    if (row && node === at) {
      return `<li class="on" data-node="${node}">${label} <b>${chnEsc(row.name)}</b></li>`;
    }
    if (row) {
      return `<li data-node="${node}">${label} <a href="${
        chnEsc(chnRowUrl(CHN_SECTION[node], row.id))}">${chnEsc(row.name)}</a></li>`;
    }
    return `<li class="off" data-node="${node}">${label} <a class="muted" href="${
      chnEsc(chnUrl(CHN_SECTION[node]))}">${chnEsc(chnT("crm_node_none"))}</a></li>`;
  }).join("")}</ol>`;
}

/* ------------------------------------------------------------------ the quotes */

/**
 * The quotes of a client or of a job — chapter XX's "wyceny", and the fourth step of the
 * path from either end.
 *
 * Read-only, for the reason a client's jobs are read-only on their page: a quote is
 * written on /wyceny/, and one screen owning the writes is what keeps two rules for one
 * row from existing. The figure beside each name is crmQuoteTotals(), which reads the
 * project's money live — so a material re-priced this morning shows here without the
 * quote being touched.
 */
function chnRenderQuotes(el, quotes) {
  if (!el) return;
  const rows = quotes || [];
  el.innerHTML = rows.length ? rows.map((q) => {
    const totals = typeof crmQuoteTotals === "function" ? crmQuoteTotals(q.id) : null;
    const money = totals && totals.total
      ? ` · ${chnEsc(chnMoney(totals.total, totals.currencyCode))}` : "";
    const mixed = totals && totals.mixed
      ? ` <span class="chip warn" title="${chnEsc(chnT("ws_mixed_currency"))}">${
        chnEsc(chnT("dash_mixed"))}</span>` : "";
    return `<li data-id="${chnEsc(q.id)}">
        <span class="row-name">
          <a href="${chnEsc(chnRowUrl("quotes", q.id))}"><b>${chnEsc(q.name)}</b></a>
          <em class="muted">${chnEsc(chnDate(q.updatedAt))}${money}</em>${mixed}
        </span>
      </li>`;
  }).join("") : `<li class="empty muted">${chnEsc(chnT("crm_quotes_empty"))}</li>`;
}

/* ------------------------------------------------------------------ the history */

/** What a history row links to, by kind. A calculation and a cost open their project. */
const CHN_HISTORY_SECTION = {
  client: "clients", job: "jobs", quote: "quotes", calc: "projects", cost: "projects",
};

/** The right-hand end of a row: what the thing that happened comes to, when it has a figure. */
function chnHistoryFigure(row) {
  if (row.kind === "calc" || row.kind === "cost") {
    const line = row.line || {};
    const amount = line.requiredUnits
      ? `${chnNum(line.requiredUnits)} ${chnEsc(line.unitLabel || "")}`.trim() : "";
    const money = line.totalCostMinor
      ? `${chnEsc(chnMoney(line.totalCostMinor, line.currencyCode))}` : "";
    return [amount, money].filter(Boolean).join(" · ");
  }
  if (row.kind === "job" && row.job && row.job.valueMinor !== null
    && row.job.valueMinor !== undefined) {
    return chnEsc(chnMoney(row.job.valueMinor, row.job.currencyCode));
  }
  if (row.kind === "quote" && typeof crmQuoteTotals === "function") {
    const totals = crmQuoteTotals(row.id);
    return totals && totals.total ? chnEsc(chnMoney(totals.total, totals.currencyCode)) : "";
  }
  return "";
}

/**
 * Chapter XXIV's last step: what has happened, newest first.
 *
 * Every row is a document that already exists, read with the date it was written on — see
 * crmHistory() in assets/crm.js for why nothing is logged and what that leaves out. The
 * name of each row opens the thing it is about, so the history is also a way back into the
 * chain rather than a wall of text.
 */
function chnRenderHistory(el, rows) {
  if (!el) return;
  const list = rows || [];
  el.innerHTML = list.length ? list.map((row) => {
    const where = row.project ? ` · ${chnEsc(row.project.name)}` : "";
    const figure = chnHistoryFigure(row);
    const section = CHN_HISTORY_SECTION[row.kind];
    // A calculation and a cost are rows *inside* a project — the project is what opens,
    // because neither has an address of its own anywhere on the site.
    const target = row.kind === "calc" || row.kind === "cost"
      ? (row.project ? chnRowUrl("projects", row.project.id) : "")
      : chnRowUrl(section, row.id);
    const name = target
      ? `<a href="${chnEsc(target)}">${chnEsc(row.name)}</a>` : chnEsc(row.name);
    return `<li data-kind="${chnEsc(row.kind)}">
        <span class="row-name">
          <b>${name}</b>
          <em class="muted">${chnEsc(chnT(`crm_ev_${row.kind}`))}${
      row.kind === "calc" || row.kind === "cost" ? where : ""} · ${chnEsc(chnDate(row.at))}${
      figure ? ` · ${figure}` : ""}</em>
        </span>
      </li>`;
  }).join("") : `<li class="empty muted">${chnEsc(chnT("crm_hist_empty"))}</li>`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CHN_SECTION, CHN_HISTORY_SECTION, CHN_FALLBACK };
}
