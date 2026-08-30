/* LiczMat website — the screen at /moje-materialy/ (session 59, item C6).
 *
 * The store is assets/own-materials.js and is loaded before this file; every name here
 * starts `omu`, because these are plain scripts in one global scope.
 *
 * The whole frame — the form, its five field groups, the headings, the two notes — is in
 * the markup the build wrote, in that page's own language. This file unhides, fills and
 * wires. It creates one kind of element, the list row, because a list of this browser's
 * own rows cannot be server-rendered by a static site.
 */

const omuT = (key) => (typeof t === "function" ? t(key) : key);
const omuLang = () => document.documentElement.lang || "pl";
const omuEsc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const omuNum = (v) => new Intl.NumberFormat(omuLang(), { maximumFractionDigits: 3 }).format(v);

/** An amount in the currency it was recorded in — never the visitor's, and never converted. */
function omuMoney(minor, currencyCode) {
  const code = currencyCode || (typeof lmCurrency === "function" ? lmCurrency() : "PLN");
  try {
    return new Intl.NumberFormat(omuLang(), { style: "currency", currency: code }).format(minor / 100);
  } catch (e) {
    // An unknown code is still an amount somebody typed; printing the number beats printing
    // nothing, and a currency the browser has no data for is not a corrupt row.
    return `${omuNum(minor / 100)} ${code}`;
  }
}

/** A date, in the visitor's language. A price point is an instant, so this is a real date. */
function omuDate(ms) {
  try {
    return new Intl.DateTimeFormat(omuLang(), { dateStyle: "medium" }).format(new Date(ms));
  } catch (e) {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

/** The last delete, until the visitor undoes it or does something else. */
let omuUndone = null;

/* ------------------------------------------------------------------ the form */

/**
 * Show the field group the chosen application uses and hide the other four.
 *
 * All five are in the document, so nothing is created and nothing flashes; what changes is
 * `hidden`, which also takes the fields out of the accessibility tree and out of the tab
 * order. The inputs of a hidden group keep whatever was typed in them and the store
 * ignores it — `omMeasures()` reads only the fields the application declares.
 */
function omuShowGroup(form, application) {
  form.querySelectorAll("[data-omat-group]").forEach((g) => {
    g.hidden = g.dataset.omatGroup !== application;
  });
}

/**
 * Everything the form holds, as the store's own argument shape.
 *
 * A field inside a hidden group is **not** read. Three of the five groups have a width and
 * three have a length, so the same `data-omat-in` name appears more than once in the
 * document — and reading them all means the last one in the DOM wins, which is whichever
 * group happens to be furthest down rather than the one somebody typed into. A covering
 * with a width of 600 would arrive at the store with the drywall group's empty one.
 *
 * `omMeasures()` in the store nulls the unused fields out a second time, on the way in.
 * That is not this check being redundant: the store guards the shape of the row, and this
 * guards which of two inputs the visitor meant.
 */
function omuFormFields(form) {
  const out = {};
  form.querySelectorAll("[data-omat-in]").forEach((el) => {
    if (el.closest("[data-omat-group][hidden]")) return;
    out[el.dataset.omatIn] = el.value;
  });
  return out;
}

function omuClearForm(form) {
  form.querySelectorAll("[data-omat-in]").forEach((el) => {
    if (el.tagName === "SELECT") return;
    el.value = "";
  });
}

/* ------------------------------------------------------------------ the list */

/** The price line of one material: what it costs now, or that nobody has priced it. */
function omuPriceLine(m) {
  if (m.priceMinor === null || m.priceMinor === undefined) {
    return `<span class="muted">${omuEsc(omuT("omat_price_none"))}</span>`;
  }
  const when = m.priceUpdatedAt ? ` <span class="muted">· ${omuEsc(omuDate(m.priceUpdatedAt))}</span>` : "";
  return `<b>${omuEsc(omuMoney(m.priceMinor, m.currencyCode))}</b>${when}`;
}

/**
 * What the price has done since the first one recorded.
 *
 * Derived on every draw by omTrend(), never stored: a difference kept beside the two
 * prices it comes from is a third number free to disagree with both. Two points in
 * different currencies are not subtracted — the row says so instead of printing a figure,
 * which is chapter VI's rule and the same answer wsProjectCosts() gives.
 */
function omuTrendLine(id) {
  const trend = omTrend(id);
  if (!trend) return "";
  if (trend.mixed) return `<p class="muted omat-trend">${omuEsc(omuT("omat_trend_mixed"))}</p>`;
  if (trend.diffMinor === 0) {
    return `<p class="muted omat-trend">${omuEsc(omuT("omat_trend_same"))}</p>`;
  }
  const word = omuT(trend.diffMinor > 0 ? "omat_trend_up" : "omat_trend_down");
  const amount = omuMoney(Math.abs(trend.diffMinor), trend.currencyCode);
  const pct = trend.pct === null ? "" : ` (${omuNum(Math.abs(Math.round(trend.pct * 10) / 10))} %)`;
  return `<p class="muted omat-trend">${omuEsc(word)} ${omuEsc(amount)}${omuEsc(pct)}</p>`;
}

/** The price history of one material, newest first. */
function omuHistory(id) {
  const points = omHistory(id);
  if (!points.length) return `<p class="muted">${omuEsc(omuT("omat_hist_empty"))}</p>`;
  return `<ol class="omat-hist">${points.map((p) =>
    `<li><span>${omuEsc(omuDate(p.recordedAt))}</span> <b>${omuEsc(omuMoney(p.priceMinor, p.currencyCode))}</b></li>`,
  ).join("")}</ol>`;
}

/**
 * The words the BUILD wrote, read back out of the page.
 *
 * The five application names and the six measurement labels live in src/omat-copy.mjs and
 * are therefore not in the dictionary bundle — that is the point of the module. A script
 * that called t("omat_app_WALL_FLOOR_COVERING") prints the key, which is session 41's
 * defect with a new name and is exactly what the first browser run of this screen showed.
 *
 * They are already on the page in this page's language: the five as the options of the
 * form's own <select>, the six as the labels above the fields. Reading them from there
 * keeps one source rather than adding a second copy to a bundle every page downloads.
 */
function omuAppLabel(id) {
  const opt = document.querySelector(`[data-omat-in="application"] option[value="${id}"]`);
  return opt ? opt.textContent.trim() : String(id || "");
}

/** A measurement's label, without the unit its own field spells out in brackets. */
function omuFieldLabel(key) {
  const el = document.querySelector(`[data-omat-f="${key}"] .fld-label`);
  const text = el ? el.textContent.trim() : key;
  return text.replace(/\s*\([^)]*\)\s*$/, "");
}

/** The one-line spec under the name, built from the numbers rather than stored beside them. */
function omuSpec(m) {
  const bits = [];
  const add = (key, value, unit) => {
    if (value === null || value === undefined) return;
    bits.push(`${omuFieldLabel(key)}: ${omuNum(value)}${unit}`);
  };
  add("widthMm", m.widthMm, " mm");
  add("lengthMm", m.lengthMm, " mm");
  add("kerfMm", m.kerfMm, " mm");
  add("packageAreaM2", m.packageAreaM2, " m²");
  add("coveragePerUnitM2", m.coveragePerUnitM2, " m²");
  add("wastePercent", m.wastePercent, " %");
  return bits.join(" · ");
}

/** "Historia cen" in this page's language — build-time copy, stamped on the list by it. */
function omuHistLabel() {
  const list = document.querySelector("[data-omat-list]");
  return (list && list.dataset.histLabel) || "";
}

/** One material: what it is, what it costs, its history, and the two things you can do to it. */
function omuRow(m) {
  return `<article class="card omat-row" data-omat-row="${omuEsc(m.id)}">
    <h3>${omuEsc(m.name)}</h3>
    <p class="muted">${omuEsc(omuAppLabel(m.application))}</p>
    <p class="muted omat-spec">${omuEsc(omuSpec(m))}</p>
    <p class="omat-price">${omuPriceLine(m)}</p>
    ${omuTrendLine(m.id)}
    <p class="omat-setprice">
      <label class="field omat-f">
        <span class="fld-label">${omuEsc(omuT("omat_price_set"))}</span>
        <input type="text" inputmode="decimal" data-omat-newprice
               aria-label="${omuEsc(omuT("omat_price_set"))}">
      </label>
      <button type="button" class="btn btn-ghost btn-sm" data-omat-save-price>${omuEsc(omuT("omat_price_set"))}</button>
    </p>
    <details class="omat-hist-box">
      <summary>${omuEsc(omuHistLabel())}</summary>
      ${omuHistory(m.id)}
    </details>
    <p class="omat-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-omat-delete>${omuEsc(omuT("omat_delete"))}</button>
    </p>
  </article>`;
}

/** Redraw the whole list. Called on load and on every `ownmaterialschange`. */
function omuRender() {
  const list = document.querySelector("[data-omat-list]");
  if (!list) return;
  const rows = omMaterials();
  list.innerHTML = rows.map(omuRow).join("");
  const empty = document.querySelector("[data-omat-empty]");
  if (empty) empty.hidden = rows.length > 0;
  omuRenderUndo();
}

/** The strip that offers the last delete back. Hidden the moment there is nothing to undo. */
function omuRenderUndo() {
  const strip = document.querySelector("[data-omat-undo]");
  if (!strip) return;
  strip.hidden = !omuUndone;
  if (!omuUndone) { strip.innerHTML = ""; return; }
  strip.innerHTML = `<span>${omuEsc(omuT("omat_deleted"))}</span> ` +
    `<button type="button" class="btn btn-ghost btn-sm" data-omat-undo-go>${omuEsc(omuT("omat_undo"))}</button>`;
}

/* ------------------------------------------------------------------ wiring */

function omuInit() {
  const form = document.querySelector("[data-omat-form]");
  if (!form) return;

  const appSelect = form.querySelector('[data-omat-in="application"]');
  if (appSelect) {
    omuShowGroup(form, appSelect.value);
    appSelect.addEventListener("change", () => omuShowGroup(form, appSelect.value));
  }

  const err = form.querySelector("[data-omat-err]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Cleared BEFORE the write, not after it. omSave() dispatches `ownmaterialschange`
    // synchronously, so the redraw runs inside omAdd() — a token cleared afterwards leaves
    // the strip offering to undo a delete that has already been drawn over.
    omuUndone = null;
    const added = omAdd(omuFormFields(form));
    if (!added) {
      // A material with no name is a row nobody can tell apart. Said out loud rather than
      // left to the browser's own validation bubble, which no screen reader announces here.
      if (err) { err.textContent = omuT("omat_name_needed"); err.hidden = false; }
      const name = form.querySelector('[data-omat-in="name"]');
      if (name) name.focus();
      return;
    }
    if (err) { err.hidden = true; err.textContent = ""; }
    omuUndone = null;
    omuClearForm(form);
  });

  // One listener on the list rather than one per row: the rows are replaced on every
  // redraw, and a handler bound to a row that no longer exists is a handler that leaks.
  const list = document.querySelector("[data-omat-list]");
  if (list) {
    list.addEventListener("click", (e) => {
      const row = e.target.closest("[data-omat-row]");
      if (!row) return;
      const id = row.dataset.omatRow;
      if (e.target.closest("[data-omat-delete]")) {
        // Set first, for the reason above: the redraw happens inside omDelete().
        omuUndone = id;
        if (!omDelete(id)) { omuUndone = null; omuRenderUndo(); }
        return;
      }
      if (e.target.closest("[data-omat-save-price]")) {
        omuUndone = null;
        const field = row.querySelector("[data-omat-newprice]");
        omSetPrice(id, field ? field.value : "");
      }
    });
  }

  const strip = document.querySelector("[data-omat-undo]");
  if (strip) {
    strip.addEventListener("click", (e) => {
      if (!e.target.closest("[data-omat-undo-go]")) return;
      const token = omuUndone;
      omuUndone = null;
      if (token) omRestore(token);
      omuRenderUndo();
    });
  }

  document.addEventListener("ownmaterialschange", omuRender);
  // The page has one URL per language and the switcher navigates, so nothing here is
  // re-translated in place. The currency switcher does not navigate, though, and a row
  // with no price of its own prints the currency in force — so the list redraws on both.
  document.addEventListener("currencychange", omuRender);
  omuRender();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", omuInit);
} else {
  omuInit();
}
