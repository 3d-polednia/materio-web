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

/**
 * Accent- and case-insensitive haystack for the search box.
 *
 * Polish ł is not an accented l in Unicode, so NFD leaves it alone and "plytki" found
 * nothing while the catalogue calls them "płytki". The same mapping is in fold() in
 * src/pages.mjs and in CAT.fold in scripts/build.mjs, which writes the haystack this
 * folds a query against — change one and the other two stop matching it.
 */
function matFold(s) {
  return String(s).toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
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
    const m = materialById(row.dataset.mat);
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
  const m = materialById(wanted);
  if (!m) return;
  const card = Array.from(document.querySelectorAll(".calc[data-calc]"))
    .find((c) => materialsForCalc(c.dataset.calc).some((x) => x.id === wanted));
  if (card) applyMaterial(card, m);
}

/* ------------------------------------------------------------------ /materialy/ */

/**
 * The catalogue page: a tree of aisles, one drawer per kind of material.
 *
 * The build writes every row into the document — 160 of them, indexable, and the same
 * numbers the picker writes into a form. What changed in this session is that they are
 * no longer all on the screen at once: a category is a <details>, a term with more than
 * one size behind it is a <details> inside it, and the page opens with everything shut.
 * Scrolling past eleven sizes of porcelain tile to reach the paint was the complaint.
 *
 * The disclosure is the browser's own, not a class this file toggles: a page with no
 * JavaScript still opens and closes, and a crawler still reads what is inside a closed
 * <details>. This file only searches, and a search opens what it found.
 */
function buildMaterialsPage() {
  const page = document.getElementById("materials-page");
  if (!page) return;
  const search = page.querySelector("#matpage-search");
  const empty = page.querySelector("#matpage-empty");
  const count = page.querySelector("#matpage-count");
  if (!search) return;

  const boxes = Array.from(page.querySelectorAll("[data-cat-details], [data-grp]"));
  const rows = Array.from(page.querySelectorAll("[data-find]"));
  const solos = Array.from(page.querySelectorAll(".mat-solo"));
  const blocks = Array.from(page.querySelectorAll("[data-cat-block]"));

  // What was open before the first keystroke of a search, so clearing the box gives the
  // page back rather than leaving every drawer a search opened standing open.
  let restore = null;

  const filled = (el) => Boolean(el.querySelector("[data-find]:not([hidden])"));

  function clearFilter() {
    rows.forEach((row) => { row.hidden = false; });
    solos.forEach((el) => { el.hidden = false; });
    blocks.forEach((el) => { el.hidden = false; });
    boxes.forEach((el) => { el.hidden = false; });
    if (restore) {
      boxes.forEach((el) => { el.open = restore.has(el); });
      restore = null;
    }
    if (empty) empty.hidden = true;
    if (count) { count.hidden = true; count.textContent = ""; }
  }

  function applyFilter(q) {
    if (!restore) restore = new Set(boxes.filter((el) => el.open));
    let shown = 0;
    rows.forEach((row) => {
      const ok = row.dataset.find.includes(q);
      row.hidden = !ok;
      if (ok) shown++;
    });
    // A drawer with nothing left in it is taken off the page rather than left as a
    // heading somebody can open onto nothing; one that still has a row is opened, because
    // a hit nobody can see is the same as no hit.
    solos.forEach((el) => { el.hidden = !filled(el); });
    boxes.forEach((el) => {
      const hit = filled(el);
      el.hidden = !hit;
      el.open = hit;
    });
    blocks.forEach((el) => { el.hidden = !filled(el); });
    if (empty) empty.hidden = shown > 0;
    if (count) {
      count.hidden = false;
      count.textContent = `${shown} ${matT("mat_found_label")}`;
    }
  }

  search.addEventListener("input", () => {
    const q = matFold(search.value.trim());
    if (q) applyFilter(q); else clearFilter();
  });

  const expand = page.querySelector("[data-mat-expand]");
  const collapse = page.querySelector("[data-mat-collapse]");
  if (expand) expand.addEventListener("click", () => boxes.forEach((el) => { el.open = true; }));
  if (collapse) collapse.addEventListener("click", () => boxes.forEach((el) => { el.open = false; }));

  // /materialy/#gres-60x60 is a link the site writes itself and one people keep. The row
  // is inside two closed drawers now, and a browser scrolls to a target it cannot show —
  // so the drawers around it are opened first.
  const openHash = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    let target = null;
    try {
      target = page.querySelector(`#${typeof CSS !== "undefined" && CSS.escape ? CSS.escape(decodeURIComponent(id)) : id}`);
    } catch (e) {
      return;
    }
    if (!target) return;
    for (let el = target; el && el !== page; el = el.parentElement) {
      if (el.tagName === "DETAILS") el.open = true;
    }
    if (typeof target.scrollIntoView === "function") target.scrollIntoView();
  };
  openHash();
  window.addEventListener("hashchange", openHash);
}

/**
 * "Your materials" on the catalogue page: which of the two blocks the visitor sees.
 *
 * The document ships with the sign-in showing, so somebody with no JavaScript is offered
 * an account rather than a form. `lmSignedIn()` is a hint and can be stale (assets/
 * account.js), and it is allowed to be: this decides which block is drawn, never whether
 * a row may be saved. /moje-materialy/ takes the same rows from anybody.
 */
function buildMaterialsOwn() {
  const box = document.getElementById("matpage-own");
  if (!box) return;
  const guest = box.querySelector("[data-omat-guest]");
  const mine = box.querySelector("[data-omat-mine]");

  const draw = () => {
    const signedIn = typeof lmSignedIn === "function" ? lmSignedIn() : false;
    if (guest) guest.hidden = signedIn;
    if (mine) mine.hidden = !signedIn;
  };
  draw();
  // /app/ signs somebody in without this page reloading; assets/account.js says so.
  document.addEventListener("lm-session", draw);
}

document.addEventListener("DOMContentLoaded", () => {
  buildMaterialPickers();
  buildMaterialsPage();
  buildMaterialsOwn();
});
