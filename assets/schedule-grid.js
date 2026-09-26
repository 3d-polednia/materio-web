/* 2026-09-26: the shared month grid and day panel for both Terminarz surfaces. */

const sgInstances = new Map();
const sgT = (key) => (typeof t === "function" ? t(key) : key);
const sgEsc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sgId = (instance, suffix) => `${instance.prefix}-${suffix}`;
const sgEl = (instance, suffix) => document.getElementById(sgId(instance, suffix));

function sgDayKey(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function sgCells(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const count = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => new Date(year, month, 1 - offset + index));
}

function sgProjectColor(value) {
  if (typeof crmProjectColor === "function") return crmProjectColor(value);
  if (typeof PROJECT_COLORS !== "undefined" && Array.isArray(PROJECT_COLORS)) {
    return PROJECT_COLORS.indexOf(value) >= 0 ? value : "";
  }
  return "";
}

function sgRenderDayPanel(instance) {
  const box = sgEl(instance, "daypanel");
  if (!box) return;
  const lang = document.documentElement.lang || "pl";
  const day = instance.state.day;
  const date = new Date(`${day}T00:00:00`);
  const label = isNaN(date.getTime()) ? day
    : date.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });
  const byDay = typeof crmProjectsByDay === "function" ? crmProjectsByDay() : {};
  const projects = byDay[day] || [];
  const slots = projects.map((project) => {
    const client = project.clientId && typeof crmClient === "function" ? crmClient(project.clientId) : null;
    const color = sgProjectColor(project.color);
    const clientName = client ? `${sgEsc(client.name)} — ` : "";
    return `<a class="cal-slot${color ? ` cal-slot-${color}` : ""}" href="${sgEsc(instance.projectUrl(project.id))}"><div>
        <div class="t">${sgEsc(project.name)}</div>
        <div class="d">${clientName}${sgEsc(sgT("job_st_" + project.status))}</div>
      </div></a>`;
  }).join("");
  const clients = typeof crmClients === "function" ? crmClients() : [];
  const clientOptions = [`<option value="">${sgEsc(sgT("cal_add_noclient"))}</option>`]
    .concat(clients.map((client) => `<option value="${sgEsc(client.id)}">${sgEsc(client.name)}</option>`)).join("");
  const colors = typeof PROJECT_COLORS !== "undefined" && Array.isArray(PROJECT_COLORS) ? PROJECT_COLORS : [];
  const colorOptions = [`<option value="">${sgEsc(sgT("job_color_none"))}</option>`]
    .concat(colors.map((color) => `<option value="${sgEsc(color)}">${sgEsc(sgT("job_color_" + color))}</option>`)).join("");
  const id = (suffix) => sgId(instance, `add-${suffix}`);

  box.innerHTML = `<h3>${sgEsc(label)}</h3>` +
    (projects.length ? slots : `<p class="muted">${sgEsc(sgT("app_schedule_empty_day"))}</p>`) +
    `<p><button type="button" class="btn btn-ghost btn-sm" id="${id("toggle")}">${sgEsc(sgT("app_cal_add"))}</button></p>
    <form id="${id("form")}" class="cal-add"${instance.state.adding ? "" : " hidden"}>
      <p class="ws-mat-grid">
        <label class="ws-mat-f"><span class="ws-bar-label">${sgEsc(sgT("job_new"))}</span><input type="text" id="${id("name")}" maxlength="120" required></label>
        <label class="ws-mat-f"><span class="ws-bar-label">${sgEsc(sgT("cal_add_date"))}</span><input type="date" id="${id("date")}" value="${sgEsc(day || "")}" required></label>
        <label class="ws-mat-f"><span class="ws-bar-label">${sgEsc(sgT("job_client"))}</span><select id="${id("client")}">${clientOptions}</select></label>
        <label class="ws-mat-f"><span class="ws-bar-label">${sgEsc(sgT("job_color"))}</span><select id="${id("color")}">${colorOptions}</select></label>
        <label class="ws-mat-f"><span class="ws-bar-label">${sgEsc(sgT("job_desc"))}</span><input type="text" id="${id("desc")}" maxlength="2000"></label>
      </p>
      <p><button type="submit" class="btn btn-primary btn-sm">${sgEsc(sgT("cal_add_btn"))}</button>
        <button type="button" id="${id("cancel")}" class="btn btn-ghost btn-sm">${sgEsc(sgT("app_cancel"))}</button></p>
      <p class="muted">${sgEsc(sgT("cal_add_hint"))}</p>
    </form>`;
}

function sgRenderInstance(instance) {
  const grid = sgEl(instance, "grid");
  if (!grid) return;
  const today = typeof crmToday === "function" ? crmToday() : sgDayKey(new Date());
  if (!instance.state.year) {
    const now = new Date();
    instance.state.year = now.getFullYear();
    instance.state.month = now.getMonth();
    instance.state.day = today;
  }
  const lang = document.documentElement.lang || "pl";
  const monthEl = sgEl(instance, "month");
  if (!instance.state.picking) {
    const label = new Date(instance.state.year, instance.state.month, 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
    monthEl.innerHTML = `<button type="button" id="${sgId(instance, "month-toggle")}" class="cal-month-btn" aria-expanded="false">${sgEsc(label)}<span class="cal-month-caret" aria-hidden="true">▾</span></button>`;
  } else {
    const months = Array.from({ length: 12 }, (_, index) => `<option value="${index}"${index === instance.state.month ? " selected" : ""}>${sgEsc(new Date(instance.state.year, index, 1).toLocaleDateString(lang, { month: "long" }))}</option>`).join("");
    const years = Array.from({ length: 11 }, (_, index) => instance.state.year - 5 + index).map((year) => `<option value="${year}"${year === instance.state.year ? " selected" : ""}>${year}</option>`).join("");
    monthEl.innerHTML = `<span class="cal-month-pick"><select id="${sgId(instance, "pick-month")}" aria-label="${sgEsc(sgT("app_cal_month"))}">${months}</select><select id="${sgId(instance, "pick-year")}" aria-label="${sgEsc(sgT("app_cal_year"))}">${years}</select></span>`;
  }
  const monday = new Date(2026, 0, 5);
  sgEl(instance, "weekdays").innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 0, monday.getDate() + index);
    return `<span>${sgEsc(date.toLocaleDateString(lang, { weekday: "short" }))}</span>`;
  }).join("");
  const byDay = typeof crmProjectsByDay === "function" ? crmProjectsByDay() : {};
  const open = typeof PROJECT_OPEN_STATUS !== "undefined" ? PROJECT_OPEN_STATUS : [];
  grid.innerHTML = sgCells(instance.state.year, instance.state.month).map((date) => {
    const key = sgDayKey(date);
    const projects = byDay[key] || [];
    const events = projects.slice(0, 2).map((project) => {
      const done = open.indexOf(project.status) === -1;
      const color = sgProjectColor(project.color);
      return `<span class="cal-ev${done ? " done" : key < today ? " late" : ""}${color ? ` cal-ev-${color}` : ""}">${sgEsc(project.name)}</span>`;
    }).join("");
    const more = projects.length > 2 ? `<span class="cal-ev more">+${projects.length - 2}</span>` : "";
    return `<button type="button" class="cal-day${date.getMonth() !== instance.state.month ? " is-out" : ""}${key === today ? " is-today" : ""}${key === instance.state.day ? " is-selected" : ""}" data-day="${key}"><span class="num">${date.getDate()}</span>${events}${more}</button>`;
  }).join("");
  sgRenderDayPanel(instance);
}

function sgWire(instance) {
  sgEl(instance, "grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-day]");
    if (!button) return;
    instance.state.picking = false;
    instance.state.day = button.dataset.day;
    sgRenderInstance(instance);
  });
  ["prev", "next"].forEach((direction) => sgEl(instance, direction).addEventListener("click", () => {
    instance.state.picking = false;
    instance.state.month += direction === "prev" ? -1 : 1;
    if (instance.state.month < 0) { instance.state.month = 11; instance.state.year -= 1; }
    if (instance.state.month > 11) { instance.state.month = 0; instance.state.year += 1; }
    instance.state.day = sgDayKey(new Date(instance.state.year, instance.state.month, 1));
    sgRenderInstance(instance);
  }));
  sgEl(instance, "today").addEventListener("click", () => { instance.state.picking = false; instance.state.year = 0; sgRenderInstance(instance); });
  const tool = sgEl(instance, "tool");
  tool.addEventListener("click", (event) => {
    if (event.target.closest(`#${sgId(instance, "month-toggle")}`)) { instance.state.picking = true; sgRenderInstance(instance); return; }
    if (instance.state.picking && !event.target.closest(`#${sgId(instance, "month")}`)) { instance.state.picking = false; sgRenderInstance(instance); }
  });
  tool.addEventListener("change", (event) => {
    if (event.target.id === sgId(instance, "pick-month")) instance.state.month = Number(event.target.value);
    else if (event.target.id === sgId(instance, "pick-year")) instance.state.year = Number(event.target.value);
    else return;
    instance.state.picking = false;
    instance.state.day = sgDayKey(new Date(instance.state.year, instance.state.month, 1));
    sgRenderInstance(instance);
  });
  sgEl(instance, "daypanel").addEventListener("click", (event) => {
    if (event.target.closest(`#${sgId(instance, "add-toggle")}`)) instance.state.adding = true;
    else if (event.target.closest(`#${sgId(instance, "add-cancel")}`)) instance.state.adding = false;
    else return;
    sgRenderDayPanel(instance);
  });
  sgEl(instance, "daypanel").addEventListener("submit", (event) => {
    if (event.target.id !== sgId(instance, "add-form")) return;
    event.preventDefault();
    const value = (suffix) => (sgEl(instance, `add-${suffix}`).value || "").trim();
    const name = value("name");
    const dueDate = value("date");
    const clientId = value("client");
    if (!name || !dueDate || typeof wsAddProject !== "function") return;
    const row = wsAddProject(name, { dueDate, clientId, color: value("color"), note: value("desc") });
    if (row && clientId && typeof crmLinkProject === "function") crmLinkProject(clientId, row.id);
    if (!row) return;
    instance.state.adding = false;
    instance.state.day = dueDate;
    const date = new Date(`${dueDate}T00:00:00`);
    if (!isNaN(date.getTime())) { instance.state.year = date.getFullYear(); instance.state.month = date.getMonth(); }
    sgRenderInstance(instance);
  });
}

function sgRender(prefix) {
  const instance = sgInstances.get(prefix);
  if (instance) sgRenderInstance(instance);
}

function sgMount(options) {
  const existing = sgInstances.get(options.prefix);
  if (existing) { existing.projectUrl = options.projectUrl; sgRenderInstance(existing); return existing; }
  if (!document.getElementById(`${options.prefix}-grid`)) return null;
  const instance = { prefix: options.prefix, projectUrl: options.projectUrl, state: { year: 0, month: 0, day: "", adding: false, picking: false } };
  sgInstances.set(options.prefix, instance);
  sgWire(instance);
  sgRenderInstance(instance);
  return instance;
}

document.addEventListener("workspacechange", () => sgInstances.forEach(sgRenderInstance));
document.addEventListener("crmchange", () => sgInstances.forEach(sgRenderInstance));
document.addEventListener("langchange", () => sgInstances.forEach(sgRenderInstance));
window.sgMount = sgMount;
window.sgRender = sgRender;
