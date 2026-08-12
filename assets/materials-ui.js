/* LiczMat website — the "pick a material" dialog and the /materialy/ page filter.
 *
 * The catalog itself is assets/materials.js; this file is only the interface to it.
 * The dialog is built on first use rather than emitted by the build: it is a control,
 * not content, so there is nothing for a crawler to miss, and every calculator page
 * would otherwise carry the same ~160 rows twice.
 *
 * Three entry points, each guarded so a page runs only what it contains:
 *   - a "pick a material" button on any server-rendered .calc card
 *   - ?m=<id> on a calculator URL, so /materialy/ can link straight into a calculation
 *   - the search + category filter over the server-rendered list on /materialy/
 */

/** Accent- and case-insensitive haystack for the search box. */
function matFold(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * A value on its way into a form field, not onto the page: no thousands separator and
 * a decimal point, because that is what the engines' own parser reads back and what the
 * built-in defaults in assets/calculators.js already look like.
 */
const matPlain = (v) => String(Math.round(Number(v) * 1000) / 1000);

const matT = (key) => (typeof t === "function" ? t(key) : key);
const matLang = () => document.documentElement.lang || "pl";

/** Name + spec line for one material, in the page's language. */
function matRowHtml(m) {
  const lang = matLang();
  const name = matName(m, lang, (k) => matT(k));
  const note = matNote(m, lang, (k) => matT(k));
  return `<button type="button" class="mat-row" data-mat="${m.id}" data-find="${matFold(name + " " + m.id)}" data-cat="${m.c}">
      <span class="mat-row-name">${matEsc(name)}</span>
      <span class="mat-row-note">${matEsc(note)}</span>
    </button>`;
}

const matEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ the dialog */

let matDialog = null;
let matOnPick = null;

function matBuildDialog() {
  const dlg = document.createElement("dialog");
  dlg.className = "mat-dialog";
  dlg.id = "mat-dialog";
  dlg.innerHTML = `
    <form method="dialog" class="mat-dialog-head">
      <h2>${matEsc(matT("mat_dialog_title"))}</h2>
      <button class="btn btn-ghost btn-sm" value="cancel" aria-label="${matEsc(matT("mat_close"))}">${matEsc(matT("mat_close"))}</button>
    </form>
    <input type="search" class="mat-search" id="mat-search" placeholder="${matEsc(matT("mat_search_ph"))}" autocomplete="off">
    <div class="chips mat-cats" id="mat-cats"></div>
    <div class="mat-list" id="mat-list"></div>
    <p class="muted mat-empty" id="mat-empty" hidden>${matEsc(matT("mat_none"))}</p>`;
  document.body.appendChild(dlg);

  const search = dlg.querySelector("#mat-search");
  search.addEventListener("input", matApplyFilter);
  dlg.querySelector("#mat-cats").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat-filter]");
    if (!chip) return;
    dlg.querySelectorAll("[data-cat-filter]").forEach((c) => c.classList.toggle("on", c === chip));
    matApplyFilter();
  });
  dlg.querySelector("#mat-list").addEventListener("click", (e) => {
    const row = e.target.closest("[data-mat]");
    if (!row) return;
    const m = MATERIALS.find((x) => x.id === row.dataset.mat);
    dlg.close();
    if (m && matOnPick) matOnPick(m);
  });
  return dlg;
}

/** Narrow the list to the active category chip and the search box. */
function matApplyFilter() {
  const dlg = matDialog;
  if (!dlg) return;
  const q = matFold(dlg.querySelector("#mat-search").value.trim());
  const active = dlg.querySelector("[data-cat-filter].on");
  const cat = active ? active.dataset.catFilter : "";
  let shown = 0;
  dlg.querySelectorAll(".mat-row").forEach((row) => {
    const ok = (!cat || row.dataset.cat === cat) && (!q || row.dataset.find.includes(q));
    row.hidden = !ok;
    if (ok) shown++;
  });
  dlg.querySelectorAll(".mat-group").forEach((g) => {
    g.hidden = !g.parentElement.querySelector(`.mat-row[data-cat="${g.dataset.group}"]:not([hidden])`);
  });
  dlg.querySelector("#mat-empty").hidden = shown > 0;
}

/**
 * Open the catalogue for one calculator and hand the chosen material to `onPick`.
 * Only the materials that calculator can actually use are listed.
 */
function openMaterialPicker(calcId, onPick) {
  if (!matDialog) matDialog = matBuildDialog();
  matOnPick = onPick;

  const list = materialsForCalc(calcId);
  const cats = MAT_CATS_USED.filter((c) => list.some((m) => m.c === c));

  matDialog.querySelector("#mat-cats").innerHTML =
    [`<button type="button" class="chip on" data-cat-filter="">${matEsc(matT("mat_all"))}</button>`]
      .concat(cats.map((c) => `<button type="button" class="chip" data-cat-filter="${c}">${matEsc(matT("cat_" + c))}</button>`))
      .join("");

  matDialog.querySelector("#mat-list").innerHTML = cats.map((c) =>
    `<h3 class="mat-group" data-group="${c}">${matEsc(matT("cat_" + c))}</h3>` +
    list.filter((m) => m.c === c).map(matRowHtml).join("")).join("");

  matDialog.querySelector("#mat-search").value = "";
  matApplyFilter();
  matDialog.showModal();
  matDialog.querySelector("#mat-search").focus();
}

/* ------------------------------------------------------------------ calculator cards */

/** Write a material's values into one calculator card and say what was filled in. */
function applyMaterial(card, m) {
  const calcId = card.dataset.calc;
  // Remembered so a saved estimate can carry the material's name and shop aisle.
  card.dataset.matId = m.id;
  card.dataset.matCat = m.c;
  card.dataset.matName = matName(m, matLang(), (k) => matT(k));
  const values = materialFill(m, calcId);
  Object.entries(values).forEach(([k, v]) => {
    const el = card.querySelector(`[data-k="${k}"]`);
    if (el && v !== undefined && v !== null) el.value = matPlain(v);
  });

  const label = card.querySelector("[data-mat-chosen]");
  if (label) {
    label.textContent = `${matT("mat_applied")} ${matName(m, matLang(), (k) => matT(k))}`;
    label.hidden = false;
  }
  const run = card.querySelector("[data-run]");
  if (run) run.click();
}

/** Wire the server-rendered "pick a material" button on every calculator on the page. */
function buildMaterialPickers() {
  if (typeof MATERIALS === "undefined") return;
  document.querySelectorAll(".calc[data-calc]").forEach((card) => {
    const btn = card.querySelector("[data-mat-open]");
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", () => openMaterialPicker(card.dataset.calc, (m) => applyMaterial(card, m)));
  });

  // ?m=<id> — /materialy/ links straight into a pre-filled calculation.
  const wanted = new URLSearchParams(location.search).get("m");
  if (!wanted) return;
  const m = MATERIALS.find((x) => x.id === wanted);
  if (!m) return;
  const card = Array.from(document.querySelectorAll(".calc[data-calc]"))
    .find((c) => materialsForCalc(c.dataset.calc).some((x) => x.id === wanted));
  if (card) applyMaterial(card, m);
}

/* ------------------------------------------------------------------ /materialy/ */

/** Search box over the server-rendered catalogue table. */
function buildMaterialsPage() {
  const page = document.getElementById("materials-page");
  if (!page) return;
  const search = page.querySelector("#matpage-search");
  const empty = page.querySelector("#matpage-empty");
  if (!search) return;

  search.addEventListener("input", () => {
    const q = matFold(search.value.trim());
    let shown = 0;
    page.querySelectorAll("[data-find]").forEach((row) => {
      const ok = !q || row.dataset.find.includes(q);
      row.hidden = !ok;
      if (ok) shown++;
    });
    page.querySelectorAll("[data-cat-block]").forEach((block) => {
      block.hidden = !block.querySelector("[data-find]:not([hidden])");
    });
    if (empty) empty.hidden = shown > 0;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  buildMaterialPickers();
  buildMaterialsPage();
});
