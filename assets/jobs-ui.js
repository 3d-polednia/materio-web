/* LiczMat website — /zlecenia/ in the browser. Session 23, chapter XXI.
 *
 * One page, two screens, the same shape as /klienci/ and /projekty/:
 *
 *   /zlecenia/           the index: the jobs in progress, and the closed ones
 *   /zlecenia/?id=<id>   one job — its client, its project, the status, the date, the money
 *
 * A job's name in the index is a real <a href="?id=…">, so opening one is an ordinary
 * navigation: the back button works and a link can be copied without any history code
 * here. The one exception is deleting from the detail, which puts the index back with
 * `replaceState` so the "undo" the delete just offered survives.
 *
 * The store is assets/crm.js — localStorage, this browser only, nothing uploaded. The
 * clients come from the same file; the projects are the free workspace's own rows
 * (assets/workspace.js), read here and never written: nothing on this page can rename,
 * archive or delete a project.
 *
 * Chapter XXV stands in front of the page exactly as on /klienci/ — the same wall, from
 * the same builder (proGate() in src/pro.mjs, drawn by assets/paywall.js), and the same
 * one decision in lmPaywall().
 */

const jobT = (key) => (typeof t === "function" ? t(key) : key);
const jobLang = () => document.documentElement.lang || "pl";
const jobEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A stored "YYYY-MM-DD" in the visitor's own calendar wording. */
function jobDay(day) {
  if (!day) return "";
  const d = new Date(`${day}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(jobLang(), { day: "numeric", month: "short", year: "numeric" });
}

/** Today as "YYYY-MM-DD" in the visitor's own timezone — what a deadline is compared to.
 *
 * One definition, in assets/crm.js, since session 25: the terminarz asks the same
 * question, and "is this job late" answered two ways is a page that contradicts itself. */
const jobToday = () => (typeof crmToday === "function" ? crmToday() : "");

/** Money through the workspace's own formatter, so a job reads like a project. */
const jobMoney = (minor, code) =>
  (typeof wsMoney === "function" ? wsMoney(minor, code) : `${(Number(minor) / 100).toFixed(2)}`);

/** Chapter XXI's four statuses, in the chapter's order, with the word for each. */
const jobStatusLabel = (id) => jobT(`job_st_${id}`);

/** The job the address bar is asking for, or "" for the index. */
const jobUrlId = () => {
  try { return new URLSearchParams(location.search).get("id") || ""; } catch (e) { return ""; }
};

/** The address of another page of this site, in this page's language, from the build. */
const jobUrl = (key, fallback) => ((window.LM_LINKS && window.LM_LINKS[key]) || fallback);

/** The job the page is currently showing. Set once per render pass. */
let jobOpenId = "";
/** Whether the edit form and the delete question are open, so a redraw keeps them. */
let jobEditing = false;
let jobAsking = false;
/** The last delete, until the visitor undoes it or moves on. */
let jobUndone = null;

/* ------------------------------------------------------------------ the Pro notice */

/**
 * Chapter XXV's paywall — the strip above the module, and the wall instead of it.
 *
 * Session 27 moved the whole of it into assets/paywall.js: sessions 22–25 wrote these
 * twenty lines once per module, identical but for a three-letter prefix, and four walls
 * are four chances to describe the same product differently. What is left here is the
 * name this file calls it by and the two arguments that make it this page's wall.
 */
const jobRenderPro = () => pwRender("job", "jobs");

/* ------------------------------------------------------------------ the index */

/**
 * One row of either list. The status and the date are on the row because they are what a
 * job is opened to check; the client is there because chapter XXIV's path starts with
 * them and a list of job names without clients is a list of half-questions.
 */
function jobRow(j) {
  const client = j.clientId && typeof crmClient === "function" ? crmClient(j.clientId) : null;
  const money = j.valueMinor !== null && j.valueMinor !== undefined
    ? ` · ${jobEsc(jobMoney(j.valueMinor, j.currencyCode))}` : "";
  const late = j.dueDate && j.dueDate < jobToday()
    && j.status !== "done" && j.status !== "cancelled";
  const due = j.dueDate
    ? ` · <span class="${late ? "job-due-late" : ""}">${jobEsc(jobDay(j.dueDate))}</span>` : "";
  const who = client ? `${jobEsc(client.name)} · ` : "";
  return `<li data-id="${jobEsc(j.id)}">
      <span class="row-name">
        <a href="?id=${encodeURIComponent(j.id)}" data-open><b>${jobEsc(j.name)}</b></a>
        <em class="muted">${who}<span class="chip job-chip">${jobEsc(jobStatusLabel(j.status))}</span>${due}${money}</em>
      </span>
      <span class="row-actions"></span>
    </li>`;
}

function jobRenderList() {
  const list = document.getElementById("job-list");
  if (!list) return;
  const open = crmOpenJobs();
  list.innerHTML = open.length
    ? open.map((j) => jobRow(j)).join("")
    : `<li class="empty muted">${jobEsc(jobT("job_empty"))}</li>`;

  // The closed half is absent entirely while it is empty: a disclosure with nothing
  // behind it is a control that lies about having content.
  const box = document.getElementById("job-closed");
  if (!box) return;
  const closed = crmClosedJobs();
  box.hidden = closed.length === 0;
  if (!closed.length) return;
  document.getElementById("job-closed-summary").textContent =
    `${jobT("job_closed_t")} (${closed.length})`;
  document.getElementById("job-closed-list").innerHTML = closed.map((j) => jobRow(j)).join("");
}

/** The client picker on the "add a job" form: every client, plus "no client". */
function jobFillClientPicker(select, selected) {
  if (!select) return;
  const clients = typeof crmClients === "function" ? crmClients() : [];
  select.innerHTML = [`<option value="">${jobEsc(jobT("job_client_none"))}</option>`]
    .concat(clients.map((c) =>
      `<option value="${jobEsc(c.id)}">${jobEsc(c.name)}</option>`)).join("");
  select.value = selected || "";
}

/** The strip that offers the last delete back. Hidden the moment there is nothing to undo. */
function jobRenderUndo() {
  const strip = document.getElementById("job-undo");
  if (!strip) return;
  strip.hidden = !jobUndone;
  if (!jobUndone) return;
  document.getElementById("job-undo-text").textContent =
    `${jobT(jobUndone.restored ? "job_restored" : "job_deleted")} ${jobUndone.name}`;
  document.getElementById("job-undo-go").hidden = Boolean(jobUndone.restored);
}

/* ------------------------------------------------------------------ one job */

/** The breadcrumb gains the job; the trail is server-rendered for the index only. */
function jobCrumb(name) {
  const ol = document.querySelector(".breadcrumbs ol");
  if (!ol) return;
  const extra = ol.querySelector("[data-job-crumb]");
  if (!name) {
    if (extra) extra.remove();
    const last = ol.lastElementChild;
    if (last) last.removeAttribute("hidden");
    return;
  }
  const li = extra || document.createElement("li");
  li.setAttribute("data-job-crumb", "1");
  li.textContent = name;
  if (!extra) ol.appendChild(li);
}

/**
 * Chapter XXIV's first step, from the job's end: who this is for.
 *
 * A job whose client was deleted says so rather than drawing a link to a row nobody can
 * open — the client is a tombstone until the visitor undoes the delete, and the job kept
 * the id precisely so that undo puts the whole chain back.
 */
function jobRenderClient(j) {
  const box = document.getElementById("job-client-line");
  if (!box) return;
  if (!j.clientId) {
    box.innerHTML = `<span class="muted">${jobEsc(jobT("job_client_none"))}</span>`;
    return;
  }
  const client = crmClient(j.clientId);
  if (!client) {
    box.innerHTML = `<span class="muted">${jobEsc(jobT("job_client_gone"))}</span>`;
    return;
  }
  const url = jobUrl("clients", "/klienci/");
  box.innerHTML = `<a href="${jobEsc(url)}?id=${encodeURIComponent(client.id)}">${
    jobEsc(client.name)}</a>`;
}

/** Chapter XXIV's third step: the one project this job is being done in. */
function jobRenderProject(j) {
  const list = document.getElementById("job-project-list");
  if (!list) return;
  const project = j.projectId && typeof wsProject === "function" ? wsProject(j.projectId) : null;
  if (project) {
    const costs = wsProjectCosts(project.id);
    const sums = wsSumsText(costs.byCurrency, "total", jobMoney);
    const money = sums ? ` · ${jobEsc(sums)}` : "";
    const url = jobUrl("projects", "/projekty/");
    list.innerHTML = `<li data-id="${jobEsc(project.id)}">
        <span class="row-name">
          <a href="${jobEsc(url)}?id=${encodeURIComponent(project.id)}"><b>${
      jobEsc(project.name)}</b></a>
          <em class="muted">${money.replace(/^ · /, "")}</em>
        </span>
        <span class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-unlink>${
      jobEsc(jobT("job_unlink"))}</button>
        </span>
      </li>`;
  } else {
    list.innerHTML = `<li class="empty muted">${jobEsc(jobT("job_project_none"))}</li>`;
  }

  // The picker offers the projects no other job has taken. With none left it says so and
  // the form goes away rather than standing there with an empty dropdown.
  const form = document.getElementById("job-project-form");
  const pick = document.getElementById("job-project-pick");
  if (!form || !pick) return;
  const free = crmFreeJobProjects(j.id).filter((p) => p.id !== j.projectId);
  pick.innerHTML = free
    .map((p) => `<option value="${jobEsc(p.id)}">${jobEsc(p.name)}</option>`).join("");
  form.hidden = free.length === 0;
  let none = document.getElementById("job-project-free-none");
  if (!none) {
    none = document.createElement("p");
    none.id = "job-project-free-none";
    none.className = "muted";
    form.parentNode.insertBefore(none, form);
  }
  none.textContent = jobT("job_project_free_none");
  none.hidden = free.length > 0 || Boolean(project);
}

/**
 * Chapter XXIV's path through this job, and the two lists that hang off its far end.
 *
 * All three are drawn by assets/crm-chain.js, which /klienci/ and /wyceny/ load too: the
 * strip reads the same standing on a job as standing on the quote priced from it, which
 * is the whole point of a chain that is walked rather than copied.
 */
function jobRenderChain(j) {
  const chain = crmChain("job", j.id);
  chnRenderStrip(document.getElementById("job-chain"), chain, "job");
  chnRenderQuotes(document.getElementById("job-quotes"), crmJobQuotes(j.id));
  chnRenderHistory(document.getElementById("job-history"), crmHistory({ jobId: j.id }, 12));
}

/** The whole detail screen for one job. */
function jobRenderDetail(id) {
  const j = crmJob(id);
  const missing = document.getElementById("job-missing");
  const body = document.getElementById("job-body");
  const title = document.getElementById("job-title");
  const lead = document.getElementById("job-lead");

  if (!j) {
    missing.hidden = false;
    body.hidden = true;
    title.textContent = jobT("job_none_t");
    lead.hidden = true;
    jobCrumb(jobT("job_none_t"));
    return;
  }

  missing.hidden = true;
  body.hidden = false;
  title.textContent = j.name;
  lead.hidden = true;
  jobCrumb(j.name);

  document.getElementById("job-status").value = j.status;
  document.getElementById("job-due").value = j.dueDate || "";

  jobRenderClient(j);

  // Two figures that answer two different questions, and a third that is only a number
  // when both are in the same currency — chapter VI forbids converting to make it one.
  const money = crmJobCosts(id);
  document.getElementById("job-fig-value").textContent = money.value === null
    ? jobT("job_value_none") : jobMoney(money.value, money.currencyCode);
  // A project in two currencies has no single cost, so `cost` is null and the figure is
  // written per currency instead — never as jobMoney(null), which would read "0,00 zł".
  document.getElementById("job-fig-cost").textContent = money.hasProject
    ? (money.cost === null
      ? (wsSumsText(money.costByCurrency, "total", jobMoney) || jobMoney(0, money.currencyCode))
      : jobMoney(money.cost, money.costCurrencyCode))
    : jobT("job_cost_none");
  document.getElementById("job-fig-left").textContent =
    money.left === null ? "—" : jobMoney(money.left, money.currencyCode);
  document.getElementById("job-mixed").hidden = !money.mixed;

  const desc = document.getElementById("job-desc");
  desc.textContent = j.description || jobT("job_desc_empty");
  desc.classList.toggle("muted", !j.description);

  const note = document.getElementById("job-note");
  note.textContent = j.note || jobT("job_note_empty");
  note.classList.toggle("muted", !j.note);

  const form = document.getElementById("job-edit-form");
  form.hidden = !jobEditing;
  if (jobEditing) {
    // Filled from the store on every redraw *except* while the visitor is typing into it:
    // a `crmchange` from another tab would otherwise wipe half-finished edits.
    if (!form.dataset.filled) {
      document.getElementById("job-edit-name").value = j.name;
      document.getElementById("job-edit-value").value =
        j.valueMinor === null || j.valueMinor === undefined ? "" : String(j.valueMinor / 100);
      document.getElementById("job-edit-desc").value = j.description || "";
      document.getElementById("job-edit-note").value = j.note || "";
      jobFillClientPicker(document.getElementById("job-edit-client"), j.clientId);
      form.dataset.filled = "1";
    }
  } else {
    delete form.dataset.filled;
  }

  const ask = document.getElementById("job-delete-ask");
  ask.hidden = !jobAsking;
  document.getElementById("job-delete-q").textContent = jobT("job_delete_q");

  jobRenderProject(j);
  jobRenderChain(j);
}

/* ------------------------------------------------------------------ the switch */

/** Show the screen the address bar asks for, and fill it. */
function jobRender() {
  const detail = document.getElementById("job-detail");
  if (!detail) return;
  const was = jobOpenId;
  jobOpenId = jobUrlId();
  // A half-finished edit belongs to the job it was opened on. Leaving ends it.
  if (jobOpenId !== was) { jobEditing = false; jobAsking = false; }
  const index = document.getElementById("job-index");

  detail.hidden = !jobOpenId;
  index.hidden = Boolean(jobOpenId);

  jobRenderPro();

  // Opening and closing a job changes the address without a reload, and the language
  // links carry that address so a switch of language keeps the job on screen.
  if (typeof keepQueryOnLangLinks === "function") keepQueryOnLangLinks();

  if (jobOpenId) {
    jobUndone = null; // opening a job is moving on; the strip has had its say
    jobRenderDetail(jobOpenId);
    return;
  }

  document.getElementById("job-title").textContent = jobT("jobpage_title");
  const lead = document.getElementById("job-lead");
  lead.textContent = jobT("jobpage_lead");
  lead.hidden = false;
  jobCrumb("");
  jobRenderUndo();
  jobFillClientPicker(document.getElementById("job-client"),
    document.getElementById("job-client").value);
  jobRenderList();
}

/** Leave the detail without a reload, so an undo offered by a delete survives. */
function jobBackToIndex() {
  try { history.replaceState({}, "", location.pathname); } catch (e) {}
  jobRender();
}

/* ------------------------------------------------------------------ wiring */

function wireJobDetail() {
  const on = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  // Chapter XXI's status: one gesture, straight on the job, no form to open first.
  on("job-status", "change", (e) => { crmSetJobStatus(jobOpenId, e.target.value); });
  on("job-due", "change", (e) => { crmUpdateJob(jobOpenId, { dueDate: e.target.value }); });

  on("job-edit", "click", () => {
    jobEditing = !jobEditing;
    jobAsking = false;
    jobRender();
    if (jobEditing) document.getElementById("job-edit-name").focus();
  });

  on("job-edit-form", "submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("job-edit-name").value.trim();
    if (!name) return;
    crmUpdateJob(jobOpenId, {
      name,
      valueMajor: document.getElementById("job-edit-value").value,
      clientId: document.getElementById("job-edit-client").value,
      description: document.getElementById("job-edit-desc").value,
      note: document.getElementById("job-edit-note").value,
    });
    jobEditing = false;
    jobRender();
  });

  const cancel = document.querySelector("[data-job-edit-cancel]");
  if (cancel) cancel.addEventListener("click", () => { jobEditing = false; jobRender(); });

  on("job-delete", "click", () => { jobAsking = true; jobEditing = false; jobRender(); });
  on("job-delete-no", "click", () => { jobAsking = false; jobRender(); });

  on("job-delete-yes", "click", () => {
    const j = crmJob(jobOpenId);
    if (!j) return;
    const token = crmDeleteJob(jobOpenId);
    jobAsking = false;
    // The name is kept here because the row it came from is a tombstone now, and the
    // strip has to be able to say which job it is offering back.
    jobUndone = token ? { token, name: j.name, restored: false } : null;
    jobBackToIndex();
  });

  on("job-project-form", "submit", (e) => {
    e.preventDefault();
    const pick = document.getElementById("job-project-pick");
    if (!pick || !pick.value) return;
    crmUpdateJob(jobOpenId, { projectId: pick.value });
  });

  on("job-project-list", "click", (e) => {
    if (e.target.closest("[data-unlink]")) crmUpdateJob(jobOpenId, { projectId: "" });
  });
}

function buildJobsPage() {
  const page = document.getElementById("job-page");
  if (!page) return;

  document.getElementById("job-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("job-name");
    const client = document.getElementById("job-client");
    const due = document.getElementById("job-new-due");
    if (!name.value.trim()) return;
    jobUndone = null; // a new job is a new subject; the old undo is stale
    crmAddJob({ name: name.value, clientId: client.value, dueDate: due.value });
    name.value = "";
    due.value = "";
    name.focus();
  });

  document.getElementById("job-undo-go").addEventListener("click", () => {
    if (!jobUndone) return;
    const back = crmRestoreJob(jobUndone.token);
    jobUndone = back ? { token: jobUndone.token, name: back.name, restored: true } : null;
    jobRender();
  });

  wireJobDetail();

  document.addEventListener("crmchange", jobRender);
  // A project renamed or deleted on the other page changes what a job's row says.
  document.addEventListener("workspacechange", jobRender);
  // An unpriced job falls back to the visitor's own currency, so a switch has to redraw.
  document.addEventListener("currencychange", jobRender);
  // Signing in or out on /app/ moves the level; the preview switch moves the wall. Both
  // are wired here, once, by assets/paywall.js.
  pwMount("job", "jobs");
  // Back after opening a job: the page never reloaded, so nothing else would notice.
  window.addEventListener("popstate", jobRender);

  jobRender();
  document.documentElement.setAttribute("data-jobs-ready", "1");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildJobsPage);
} else {
  buildJobsPage();
}
