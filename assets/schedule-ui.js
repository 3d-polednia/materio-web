/* LiczMat website — /terminarz/ in the browser. Session 25, chapter XXIII.
 *
 * One screen, unlike /klienci/, /zlecenia/ and /wyceny/: there is no `?id=` view here,
 * because a terminarz has nothing of its own to open. A row is a job, and its name is a
 * real link to /zlecenia/?id=<jobId>, where the whole record lives.
 *
 * **The module stores nothing.** A deadline is chapter XXI's `termin`, a field of the job
 * — so this page reads crmSchedule() in assets/crm.js and its one write is
 * crmUpdateJob(id, { dueDate }), the same call /zlecenia/ makes. An `events` collection of
 * its own would give one date two homes and let them disagree the first time somebody
 * changed a deadline on the job's own page.
 *
 * Chapter XXIII also fixes the scope in one line: "Nie buduj pełnego odpowiednika Google
 * Calendar." So there is no month grid, no week view, no recurrence and no reminder — five
 * buckets that answer "kiedy", the basics of each job beside its date, and a date control
 * on the row so a missing deadline can be fixed where it is noticed.
 *
 * Chapter XXV stands in front of the page exactly as on the other three modules — the
 * same wall, from the same builder (proGate() in src/pro.mjs, drawn by
 * assets/paywall.js), and the same one decision in lmPaywall().
 */

const calT = (key) => (typeof t === "function" ? t(key) : key);
const calLang = () => document.documentElement.lang || "pl";
const calEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A stored "YYYY-MM-DD" in the visitor's own calendar wording. */
function calDay(day) {
  if (!day) return "";
  const d = new Date(`${day}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(calLang(), { day: "numeric", month: "long", year: "numeric" });
}

/**
 * "za 3 dni", "in 3 Tagen", "yesterday" — the distance to a deadline, in words.
 *
 * Intl.RelativeTimeFormat rather than four more sets of plural forms in the dictionary:
 * Polish alone needs three ("za 1 dzień", "za 2 dni", "za 5 dni") and Ukrainian another
 * three, and the browser already carries all of them, correctly, for every language the
 * site has. `numeric: "auto"` is what turns 0 and ±1 into "dziś", "jutro" and "wczoraj"
 * instead of "za 0 dni". A browser without the API gets no phrase at all — the date beside
 * it still says everything, so the row degrades to less wording, never to a wrong one.
 */
function calRelative(days) {
  if (days === null || days === undefined) return "";
  if (typeof Intl === "undefined" || typeof Intl.RelativeTimeFormat !== "function") return "";
  try {
    return new Intl.RelativeTimeFormat(calLang(), { numeric: "auto" }).format(days, "day");
  } catch (e) {
    return "";
  }
}

/** Money through the workspace's own formatter, so a row reads like a job. */
const calMoney = (minor, code) =>
  (typeof wsMoney === "function" ? wsMoney(minor, code) : `${(Number(minor) / 100).toFixed(2)}`);

/** The address of another page of this site, in this page's language, from the build. */
const calUrl = (key, fallback) => ((window.LM_LINKS && window.LM_LINKS[key]) || fallback);

/* ------------------------------------------------------------------ the Pro notice */

/**
 * Chapter XXV's paywall — the strip above the module, and the wall instead of it.
 *
 * Session 27 moved the whole of it into assets/paywall.js: sessions 22–25 wrote these
 * twenty lines once per module, identical but for a three-letter prefix, and four walls
 * are four chances to describe the same product differently. What is left here is the
 * name this file calls it by and the two arguments that make it this page's wall.
 */
const calRenderPro = () => pwRender("cal", "calendar");

/* ------------------------------------------------------------------ the rows */

/**
 * One job in the terminarz — chapter XXIII's "zlecenia" plus "podstawowe informacje".
 *
 * The basics are the three a deadline is read together with: who it is for, which of
 * chapter XXI's four states it is in, and what was agreed for it. Everything else about
 * the job is one click away, on the page that owns it.
 *
 * The date is a `<input type="date">` and not a formatted string with an edit button: the
 * control *is* the display — the browser prints it in the visitor's own locale and opens
 * a calendar on a phone — and it is what lets an undated job be dated where it is noticed.
 * A closed job gets the date as text instead: it is a record, not a queue.
 */
function calRow(job, editable, today) {
  const client = job.clientId && typeof crmClient === "function" ? crmClient(job.clientId) : null;
  const who = client ? `${calEsc(client.name)} · ` : "";
  const money = job.valueMinor !== null && job.valueMinor !== undefined
    ? ` · ${calEsc(calMoney(job.valueMinor, job.currencyCode))}` : "";
  const status = `<span class="chip job-chip">${calEsc(calT(`job_st_${job.status}`))}</span>`;
  const jobs = calUrl("jobs", "/zlecenia/");

  const days = typeof crmDaysUntil === "function" ? crmDaysUntil(job.dueDate, today) : null;
  const rel = calRelative(days);
  const late = days !== null && days < 0 && editable;
  const when = rel
    ? `<em class="cal-rel ${late ? "job-due-late" : "muted"}">${calEsc(rel)}</em>` : "";

  const date = editable
    ? `<input type="date" class="cal-due" value="${calEsc(job.dueDate || "")}"
          aria-label="${calEsc(calT("cal_due_set"))}">`
    : `<span class="muted">${calEsc(calDay(job.dueDate))}</span>`;

  return `<li data-id="${calEsc(job.id)}" class="cal-row">
      <span class="row-name">
        <a href="${calEsc(jobs)}?id=${encodeURIComponent(job.id)}"><b>${calEsc(job.name)}</b></a>
        <em class="muted">${who}${status}${money}</em>
      </span>
      <span class="row-actions cal-when">${when}${date}</span>
    </li>`;
}

/** One bucket: its rows, its count in the heading, and nothing at all when it is empty. */
function calRenderBucket(id, jobs, today) {
  const box = document.getElementById(`cal-sec-${id}`);
  const list = document.getElementById(`cal-list-${id}`);
  const head = document.getElementById(`cal-h-${id}`);
  if (!box || !list || !head) return;
  // A heading with an empty list under it is furniture that says nothing. The bucket is
  // absent while it holds nothing, and the page stays as short as the work is.
  box.hidden = jobs.length === 0;
  if (!jobs.length) return;
  head.textContent = `${calT(`cal_${id}_t`)} (${jobs.length})`;
  list.innerHTML = jobs.map((j) => calRow(j, true, today)).join("");
}

/* ------------------------------------------------------------------ the screen */

function calRender() {
  const page = document.getElementById("cal-page");
  if (!page) return;
  calRenderPro();

  const sched = typeof crmSchedule === "function" ? crmSchedule() : null;
  if (!sched) return;

  const day = document.getElementById("cal-today");
  if (day) day.textContent = calDay(sched.day);

  document.getElementById("cal-fig-late").textContent = String(sched.counts.late);
  document.getElementById("cal-fig-today").textContent = String(sched.counts.today);
  document.getElementById("cal-fig-soon").textContent = String(sched.counts.soon);

  ["late", "today", "soon", "later", "none"].forEach((id) => {
    calRenderBucket(id, sched.buckets[id], sched.day);
  });

  // The closed half is absent entirely while it is empty: a disclosure with nothing
  // behind it is a control that lies about having content.
  const closed = document.getElementById("cal-closed");
  if (closed) {
    closed.hidden = sched.closed.length === 0;
    if (sched.closed.length) {
      document.getElementById("cal-closed-summary").textContent =
        `${calT("cal_closed_t")} (${sched.closed.length})`;
      document.getElementById("cal-closed-list").innerHTML =
        sched.closed.map((j) => calRow(j, false, sched.day)).join("");
    }
  }

  // One sentence instead of five empty headings when there is no job at all — the page
  // says what it is waiting for rather than looking broken.
  const empty = document.getElementById("cal-empty");
  if (empty) empty.hidden = sched.total > 0;
}

/* ------------------------------------------------------------------ wiring */

function buildSchedulePage() {
  const page = document.getElementById("cal-page");
  if (!page) return;

  // The one write this module makes, and it is the job's own: a date typed here is the
  // same field /zlecenia/ writes, validated by the same crmDay().
  page.addEventListener("change", (e) => {
    const input = e.target.closest(".cal-due");
    if (!input) return;
    const row = input.closest("li[data-id]");
    if (row) crmUpdateJob(row.dataset.id, { dueDate: input.value });
  });

  document.addEventListener("crmchange", calRender);
  // A job's value is shown in the visitor's currency when it carries none of its own.
  document.addEventListener("currencychange", calRender);
  // Switching language re-renders every row: the status word, the date and the relative
  // phrase are all written by this script, so nothing on the page translates itself.
  document.addEventListener("langchange", calRender);
  // Signing in or out on /app/ moves the level; the preview switch moves the wall. Both
  // are wired here, once, by assets/paywall.js.
  pwMount("cal", "calendar");

  calRender();
  document.documentElement.setAttribute("data-schedule-ready", "1");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildSchedulePage);
} else {
  buildSchedulePage();
}
