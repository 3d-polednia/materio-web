/* LiczMat website — the <main> of every page type.

   Each function returns markup only; `template.page()` wraps it in the shared shell.
   Calculator forms are rendered here, server-side, with the labels already translated,
   so a crawler (and a visitor with JavaScript off) sees the real fields. The browser
   only attaches the handlers afterwards — see wireCalculator() in assets/calculators.js. */

import { esc, calcIcon, playBadge, breadcrumbs } from "./template.mjs";
import {
  HOME_DOORS, route as iaRoute, STATUS, CALC_CATEGORIES, calcCategory,
} from "./ia.mjs";
import {
  BASE as BASE_URL, LANGS,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores, urlMaterials,
  urlProjects, urlAndroid, urlCookies, urlCompany, urlClients, urlQuotes,
  urlCalendar, urlLiczmatPro, urlConverter, urlOwnMaterials, urlContact, urlPrivacy,
  CALC_SLUG, PLAY_URL, URL_APP, URL_PRIVACY, ENTITY, entityRows,
} from "./site.mjs";
import { CALC_META, FORMULA_I18N, FORMULA_UNITS, DECIMAL_POINT } from "./calc-meta.mjs";
import { proGate, proModules, proPlansBlock } from "./pro.mjs";
import { PDF_COPY, QUOTE_PDF_COPY, pdfSplit } from "./pdf-copy.mjs";
import { CURRENCIES, MONEY_LOCALE } from "./currency.mjs";
import { calendarGrid } from "./app-pages.mjs";
import { accountPageMain } from "./account-sidebar.mjs";
import { QUOTE_VIEW_COPY } from "./quote-view-copy.mjs";

/**
 * Case- and accent-insensitive text for the hub's search haystack.
 *
 * NFD splits a letter from its accent so the accent can be dropped — "Räume" becomes
 * "raume", "wykończenie" becomes "wykonczenie". Polish ł is not an accented l in Unicode
 * and survives that, so it is mapped by hand: the hub's own search box is the place
 * somebody types "plytki" for "płytki", and it has to find it.
 *
 * assets/calc-hub.js folds what the visitor types with exactly this function. Change one,
 * change both, or half the searches stop matching.
 */
const fold = (s) => String(s).toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");

/* ------------------------------------------------------------------ calculator form */

const PICK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></svg>';

/** The compact add action shared by project and client section headings. */
const sectionAddButton = (id, label) => `<button type="button" class="section-add" id="${id}" aria-expanded="false">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg>
  <span>${esc(label)}</span>
</button>`;

/**
 * The tool itself: the form on one side, the result and the actions on the other.
 *
 * Chapter XII wants FORMULARZ → WYNIK → AKCJE and says the result matters most, so the
 * two halves are siblings rather than a form with an answer buried under it, and on a wide
 * screen the result column is sticky — scrolling the fields never scrolls the answer away.
 *
 * **The result box ships filled in.** `example` is the build running this calculator's own
 * engine over the values the form opens with, so the number on the page is the true answer
 * for the numbers in the fields — not a sample of one. That is what makes the panel
 * meaningful before anyone clicks, to a crawler and to a visitor with no JavaScript alike;
 * assets/calculators.js recalculates it in place from there. It is also why the page no
 * longer carries a second, identical green box further down labelled "Przykład".
 *
 * `materials` is how many catalogue entries can pre-fill this calculator; when there are
 * none (volume of concrete, blocks per m²) the picker button is left out entirely rather
 * than opening an empty dialog.
 */
export function calcCard(calc, t, { materials = 0, example, projectsUrl = "", calcUrls = {} }) {
  const fieldNumber = (value) => DECIMAL_POINT.has(t.lang || "")
    ? String(value).replace(/,/g, ".") : String(value).replace(/\./g, ",");
  /* `data-lk` is the field's dictionary key, next to the value the field holds. Saving a
     result keeps what the visitor typed (chapter XV), and a saved line has to stay
     readable after a switch to another language — so the line keeps the key and the page
     showing it translates, instead of freezing "Powierzchnia" into storage. A <select>
     puts the same on its options: the answer is the word, not the "1". */
  // Tiles and the ceiling take dimensions or an area (owner, 2026-10-06): a field that
  // belongs to one way of giving the size carries it, and the other way's fields start hidden.
  const startMode = (calc.fields.find((f) => f.pick) || {}).def;
  const fields = calc.fields.map((f) => {
    const label = esc(t(f.label));
    const keys = `data-k="${f.k}" data-lk="${esc(f.label)}"`;
    const box = f.mode ? `<div class="field" data-mode="${f.mode}"${f.mode === startMode ? "" : " hidden"}>` : `<div class="field">`;
    if (f.sel) {
      const opts = f.sel.map(([v, l, key]) =>
        `<option value="${esc(v)}"${key ? ` data-ok="${esc(key)}"` : ""}${v === f.def ? " selected" : ""}>${esc(key ? t(key) : l)}</option>`).join("");
      return `${box}<label for="f-${calc.id}-${f.k}">${label}</label><select id="f-${calc.id}-${f.k}" ${keys}>${opts}</select></div>`;
    }
    if (f.ta) {
      return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><textarea id="f-${calc.id}-${f.k}" rows="3" ${keys}>${esc(f.def)}</textarea></div>`;
    }
    // An optional field keeps its starting value; emptied, it shows the value the engine then
    // uses, so an empty field never stands for a number nobody can see (AUDYT3 C1).
    const hint = ` value="${esc(fieldNumber(f.def))}"` + (f.opt && !f.noHint ? ` placeholder="${esc(fieldNumber(f.fallback === undefined ? f.def : f.fallback))}"` : "");
    const errorId = `f-${calc.id}-${f.k}-error`;
    return `${box}<label for="f-${calc.id}-${f.k}">${label}</label><input id="f-${calc.id}-${f.k}" type="text" inputmode="decimal" ${keys}${hint}><span id="${errorId}" class="field-error" role="alert" hidden></span></div>`;
  }).join("");

  const chips = calc.presets
    ? `<div class="section-add-list calc-presets"><span class="calc-presets-label">${esc(t("calc_presets"))}</span>${calc.presets.map((p, i) =>
        `<button type="button" class="section-add" data-preset="${i}" data-material="${esc(p.m)}" aria-pressed="false">${esc(p.k ? t(p.k) : p.l)}</button>`).join("")}</div>`
    : "";

  const picker = materials
    ? `<button type="button" class="btn btn-ghost btn-sm mat-open" data-mat-open>${PICK_ICON}<span>${esc(t("mat_pick"))}</span></button>`
    : "";

  const rows = example.rows
    .map(([k, v]) => {
      const numbered = String(v).match(/^§row-n:(\d+)§/);
      return `<div><span>${esc(numbered ? k.replace("{n}", numbered[1]) : k)}</span><b>${esc(String(v).replace(/^§row-n:\d+§/, ""))}</b></div>`;
    }).join("");

  // The card carries both labels so the script can swap them without a dictionary of its
  // own: "Policz" until the visitor has asked for a number, "Oblicz ponownie" after.
  //
  /* Audit item M9. Until session 67 the fields and the button sat in a <div> and the
     button was type="button", so the card was a group of controls and not a form. Two
     things follow from that, and both are the mobile visitor's: the on-screen keyboard
     offers no working "Go" key, because there is no form to submit, and a screen reader
     gets no form boundary and no form mode. So it is a <form> with a submit button now,
     and assets/calculators.js answers `submit` rather than a click — which is the same
     event whether the visitor pressed the button, hit Enter in a field or used the
     keyboard's Go key. `novalidate` because the fields are type="text" with
     inputmode="decimal" (a comma is a decimal separator in most of the thirteen
     languages, and type="number" rejects it), so the browser has nothing to check and
     the engines in assets/calculators.js do all of the checking. The preset chips and
     the material picker stay type="button": inside a form, a button with no type
     submits it. */
  return `<div class="calc" data-calc="${calc.id}" data-tab="${calc.tab}"
      data-calc-urls="${esc(JSON.stringify(calcUrls))}">
      <form class="calc-form" novalidate>
        <h2 id="calc-form-h" data-calc-form-heading>${esc(t("calc_form_h"))}</h2>
        ${picker}${chips}${fields}
        <button type="submit" class="btn btn-primary" data-run
          data-label-run="${esc(t("act_calc"))}"
          data-label-again="${esc(t("act_recalc"))}">${esc(t("act_calc"))}</button>
      </form>
      <div class="calc-out">
        <h2 id="calc-result-h">${esc(t("calc_result_h"))}</h2>
        <!-- role="status" (an implicit aria-live="polite"): pressing "Policz" replaces
             the contents of this box and moves nothing on the page, so without it a
             screen reader is told nothing at all about the one thing the visitor asked
             for. Polite rather than assertive — the answer waits for the sentence being
             read to end. The box is in the markup from the first paint holding the worked
             example, and a live region announces only what changes after it is live, so
             nothing is read out on load. -->
        <!-- The id is what a field points at with aria-describedby when the engine refuses
             its value: the message lands here (assets/calculators.js), so the field that
             caused it has to name this box or a screen reader hears "podaj dodatnie
             wartości" with nothing tying it to any of the five fields. -->
        <div class="result show" id="calc-result" data-result role="status">
          <div class="muted eyebrow">${esc(t("res_tobuy"))}</div>
          <div class="big">${esc(example.tobuy)} <span class="figure-line">${esc(example.unit)}</span></div>
          <div class="rows">${rows}</div>
        </div>
        <p class="calc-stale" data-calc-stale hidden>${esc(t("calc_stale"))}</p>
        <div class="calc-actions" data-calc-actions${projectsUrl ? ` data-projects-url="${esc(projectsUrl)}"` : ""}></div>
      </div>
    </div>`;
}

/** A link card used on the home page and the calculator hub. */
function calcLinkCard(calc, lang, t) {
  return `<a class="calc-link" href="${urlCalc(lang, calc.id)}">
      <span class="ico">${calcIcon(calc.id)}</span>
      <span class="calc-link-body">
        <b>${esc(t(`c_${calc.id}_t`))}</b>
        <span class="muted">${esc(t(`c_${calc.id}_d`))}</span>
      </span>
      <span class="calc-link-go">${esc(t("calc_open"))}</span>
    </a>`;
}

/* ------------------------------------------------------------------ home */

/**
 * The home page — chapter X.
 *
 * It is the way into the product, not a description of it, so it holds four things: who
 * LiczMat is for, the three doors of chapter X (one per access level of chapter II), the
 * four-step idea of chapter I, and the questions a visitor decides on. Everything it used
 * to carry as well — all fifteen calculators in four groups, six feature cards, a room
 * helper, a project block, an account block, a store teaser, a data chapter and a
 * full-width advert for the Android app — now lives on the page that is about that one
 * thing. Chapter X rules every one of them out here by name.
 *
 * The three doors come from `HOME_DOORS` in src/ia.mjs, not from this file: which areas
 * the home page opens onto is an architecture decision, and the build checks that the set
 * stays three and stays in level order.
 */
export function homeMain(lang, t, calcs, cat) {
  return `<main id="main" tabindex="-1">
${homeHero(lang, t)}
${homeDoors(lang, t, calcs, cat)}
${homePath(t)}
${faqSection(t)}
</main>`;
}

/** Title, one sentence and the two first actions. Owner, 2026-10-06 (AUDYT3 A7), after
    seeing both versions: the first screen offers what to do, as sites like this one do,
    instead of leaving it to the three doors further down. The doors keep their own
    buttons; these two are the shortcut. */
function homeHero(lang, t) {
  return `<section class="hero home-hero" aria-labelledby="hero-h">
  <div class="wrap">
   <div class="hero-copy">
    <h1 id="hero-h">${esc(t("hero_title"))}</h1>
    <p class="lead">${esc(t("hero_lead"))}</p>
    <p class="hero-actions"><a class="btn btn-primary btn-go" href="${urlCalcIndex(lang)}">${esc(t("door_calc_go"))}</a><a class="btn btn-ghost btn-go" href="${urlProjects(lang)}">${esc(t("door_lm_go"))}</a></p>
   </div>
  </div>
</section>`;
}

/** POLICZ → WYCEŃ → KUP → ZREALIZUJ: the idea of chapter I, in four lines (owner, 2026-10-06). */
function homePath(t) {
  return `<section class="block alt" aria-labelledby="path-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="path-h">${esc(t("path_title"))}</h2>
    </div>
    <div class="steps">
      ${[1, 2, 3, 4].map((n) =>
        `<div class="step"><h3>${esc(t(`path_${n}_t`))}</h3><p>${esc(t(`path_${n}_d`))}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/**
 * The three areas of chapter X: KALKULATORY, LICZMAT, LICZMAT PRO.
 *
 * A door onto a PLANNED route says so and carries no link — the Pro page is session 29,
 * and a button onto a URL that does not exist yet would be the one promise this page
 * cannot keep. The status is read from the architecture, so the day the route goes live
 * the door becomes a link with nothing to change here.
 */
function homeDoors(lang, t, calcs, cat) {
  const cards = HOME_DOORS.map((door) => {
    const r = iaRoute(door.route);
    const live = r.status === STATUS.LIVE;
    const href = live ? r.path(lang) : null;

    // The category shortcuts are the hub's own groups, so the door cannot offer a
    // heading the hub does not have. `#g-<id>` is an anchor on the hub and also the
    // filter's value — assets/calc-hub.js reads the fragment on load and opens the
    // hub already narrowed to that group.
    const extra = door.id === "calculators"
      ? `<ul class="door-list">${CALC_CATEGORIES.map((c) =>
          `<li><a href="${urlCalcIndex(lang)}#g-${c.id}">${esc(t(c.key))}</a></li>`).join("")}</ul>
        <p class="door-meta">${esc(t("door_calc_count")
          .replace("{calc}", calcs.length).replace("{calcs}", t.plural("calc_count", calcs.length))
          .replace("{mat}", cat.total).replace("{mats}", t.plural("mat_count_label", cat.total)))}</p>`
      : "";

    const action = href
      ? `<a class="btn ${door.id === "calculators" ? "btn-primary" : "btn-ghost"} btn-go" href="${href}">${esc(t(`${door.key}_go`))}</a>`
      : `<p class="door-soon">${esc(t("door_soon"))}</p>`;

    return `<article class="door" aria-labelledby="door-${door.id}">
      <span class="door-level">${esc(t(`lvl_${door.level}`))}</span>
      <h3 id="door-${door.id}">${esc(t(`${door.key}_t`))}</h3>
      <p class="muted">${esc(t(`${door.key}_d`))}</p>
      ${extra}
      ${action}
    </article>`;
  }).join("\n      ");

  return `<section class="block" aria-labelledby="doors-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="doors-h">${esc(t("doors_title"))}</h2>
    </div>
    <div class="doors">
      ${cards}
    </div>
  </div>
</section>`;
}

/**
 * The four questions the home page answers, and the only ones.
 *
 * They are the decisions a visitor makes before counting anything: does it cost, where
 * does it calculate, does it need an account, where does the data go. The store-finder,
 * language and Android-version questions went with the sections they belonged to —
 * chapter X keeps the home page short, and `scripts/build.mjs` publishes this same list
 * as FAQPage structured data, so an entry that is not on the page must not be in it.
 */
export const FAQ_KEYS = [1, 2, 3, 5];

function faqSection(t) {
  return `<section id="faq" class="block" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="faq-h">${esc(t("faq_title"))}</h2>
    </div>
    <div class="faq">
      ${FAQ_KEYS.map((n, i) => {
        const answer = n === 5
          ? `<p><span>${esc(t("faq_a5"))}</span> <a href="${urlPrivacy(t.lang)}">${esc(t("faq_a5_link"))}</a>.</p>`
          : `<p>${esc(t(`faq_a${n}`))}</p>`;
        return `<details${i === 0 ? " open" : ""}><summary>${esc(t(`faq_q${n}`))}</summary>${answer}</details>`;
      }).join("\n      ")}
    </div>
  </div>
</section>`;
}

/**
 * The app, mentioned once and briefly, at the foot of a sub-page.
 *
 * These pages exist to answer the question the visitor arrived with; closing each of
 * them with a full-width "download the app" banner turned the site into an advert for
 * something the visitor had not asked about. The banner now appears on the home page
 * only, where a visitor is plausibly looking at the product as a whole.
 */
function appNote(t) {
  return `<section class="block app-note" aria-labelledby="appnote-h">
    <div class="wrap">
      <p><b id="appnote-h">${esc(t("appnote_t"))}</b> ${esc(t("appnote_d"))}
      <a href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="appnote">${esc(t("nav_download"))}</a></p>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ calculator hub */

/**
 * The calculator hub — chapter XI.
 *
 * The chapter asks for five things: a search box, logical categories, filtering, a
 * shortlist, and readable access to every calculator — and rules out one thing, "nie
 * wyświetlaj wszystkiego jako gigantycznej ściany kart". So the page is a control bar, a
 * shortlist of four, and then the fifteen calculators in five groups from
 * `CALC_CATEGORIES` (src/ia.mjs), each group a heading and a compact row per calculator
 * rather than fifteen equal cards in one wall.
 *
 * Everything on it is server-rendered and works with JavaScript off:
 *   - the category chips are ordinary links to `#g-<id>`, so without a script they jump
 *     to the group and with one they filter in place (assets/calc-hub.js);
 *   - the search field is the only control a script is required for, so it is inside
 *     `.js-only` and simply is not shown when there is no script to run it;
 *   - every calculator is a real `<a>` in the markup, which is what a crawler indexes.
 *
 * `data-find` is the haystack the search reads: the name, the one-line description and
 * the group's name, already folded to lower case without accents. It is built here rather
 * than in the browser because the page is generated per language anyway, and doing it at
 * build time keeps the script down to comparing two strings.
 */
export function calcHubMain(lang, t, calcs, guides, convCopy) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("calchub_title"), path: urlCalcIndex(lang) },
  ]);
  const byId = new Map(calcs.map((c) => [c.id, c]));

  /** One calculator, as a row the filter can hide. */
  const row = (calc) => {
    const cat = calcCategory(calc.id);
    const find = fold([t(`c_${calc.id}_t`), t(`c_${calc.id}_d`), cat ? t(cat.key) : ""].join(" "));
    return `<li data-calc-row data-cat="${esc(cat ? cat.id : "")}" data-find="${esc(find)}">
          ${calcLinkCard(calc, lang, t)}
        </li>`;
  };

  const chips = [
    `<a class="chip on" href="#g-all" data-cat-chip="" aria-current="true">${esc(t("calchub_all"))}</a>`,
    ...CALC_CATEGORIES.map((c) =>
      `<a class="chip" href="#g-${c.id}" data-cat-chip="${c.id}">${esc(t(c.key))}</a>`),
  ].join("\n        ");

  const groups = CALC_CATEGORIES.map((cat) => {
    const list = cat.calcs.map((id) => byId.get(id)).filter(Boolean);
    return `<section class="calc-group-block" data-cat-block="${cat.id}" aria-labelledby="g-${cat.id}">
        <h3 id="g-${cat.id}" class="calc-group">${esc(t(cat.key))}</h3>
        <p class="calc-group-d muted">${esc(t(`${cat.key}_d`))}</p>
        <ul class="calc-links">${list.map(row).join("")}</ul>
      </section>`;
  }).join("\n      ");


  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("calchub_title"))}</h1>
      <p class="lead">${esc(t("calchub_lead"))}</p>
    </div>
  </section>

  <div id="calc-hub" data-total="${calcs.length}">
    <section class="block alt calc-filter" aria-label="${esc(t("calchub_filter_h"))}">
      <div class="wrap">
        <form class="calc-search js-only" role="search" data-calc-search>
          <label class="fld-label" for="calc-search">${esc(t("calchub_search_l"))}</label>
          <input id="calc-search" type="search" class="mat-search" autocomplete="off"
                 placeholder="${esc(t("calchub_search_ph"))}">
        </form>
        <div class="chips calc-cats">
        ${chips}
        </div>
        <p class="muted calc-shown" role="status" data-calc-shown="${esc(t("calchub_shown"))}" hidden>${esc(
          t("calchub_shown").replace("{n}", calcs.length).replace("{total}", calcs.length))}</p>
      </div>
    </section>

    <!-- AUDYT3 A7: the "Od czego zacząć" shortlist repeated four cards of the list right
         below it, title for title; it went on 2026-10-06. -->
    <section class="block alt" id="g-all" aria-labelledby="all-h">
      <div class="wrap">
        <div class="section-head left">
          <h2 id="all-h">${esc(t("calchub_all_t"))}</h2>
        </div>
        <p class="muted" data-calc-empty hidden>${esc(t("calchub_none"))}</p>
      ${groups}
      </div>
    </section>
  </div>

  <!-- Session 57. The converter is a tool, so the page full of tools has to offer it —
       but it is not one of the fifteen: it has no material, no allowance and no result to
       file in a project, so it is outside #calc-hub and outside the filter, which counts
       [data-calc-row] and says how many of the calculators are showing. Putting it in the
       list would have made that number wrong by one. -->
  <section class="block" aria-labelledby="hub-conv-h">
    <div class="wrap">
      <div class="section-head left">
        <h2 id="hub-conv-h">${esc(t("convpage_title"))}</h2>
      </div>
      <ul class="calc-links">
        <li><a class="calc-link" href="${urlConverter(lang)}">
          <span class="calc-link-body">
            <b>${esc(t("convpage_title"))}</b>
            <span class="muted">${esc(convCopy.conv_hub_d)}</span>
          </span>
          <span class="calc-link-go">${esc(convCopy.conv_open)}</span>
        </a></li>
      </ul>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ calculator page */

/** Strip the unit from a field label so it reads well inside a formula. */
const bare = (label) => String(label).replace(/\s*\([^)]*\)\s*$/, "").trim();

/**
 * Turn an authored (Polish) formula line into the language being built:
 * translate the identifiers, drop in the localized field labels and unit symbols, and
 * switch the decimal separator where the language uses a point.
 */
export function renderFormula(lines, lang, t) {
  const words = FORMULA_I18N[lang];
  // Longest first, so "klej razem" is replaced before "klej" could match inside it.
  const keys = words ? Object.keys(words).sort((a, b) => b.length - a.length) : [];
  const units = FORMULA_UNITS[lang] || FORMULA_UNITS.pl;

  return lines.map((line) => {
    let out = line;
    for (const k of keys) out = out.split(k).join(words[k]);
    out = out.replace(/\{(fld_[a-z0-9_]+)\}/g, (_, key) => bare(t(key)));
    out = out.replace(/\{(kg|m2|l)\}/g, (_, key) => units[key]);
    if (DECIMAL_POINT.has(lang)) out = out.replace(/(\d),(\d)/g, "$1.$2");
    return out;
  });
}

/**
 * One calculator — chapter XII.
 *
 * The chapter fixes the order: TYTUŁ → KRÓTKI OPIS → FORMULARZ → WYNIK → AKCJE →
 * INFORMACJE DODATKOWE / SEO, "najważniejszy jest wynik", and "długie treści SEO,
 * instrukcje i FAQ nie mogą zasłaniać kalkulatora".
 *
 * Until session 8 the page put "Jak to liczymy" — the field list, the formula, a worked
 * example and the warnings — in a column *beside* the form, so the explanation started at
 * the same height as the tool and the answer was the last thing on the card, below the
 * fold on a phone. It also rendered the worked example as a second `.result` box styled
 * exactly like the real one, so the page showed two identical green answers, one of them
 * not the visitor's. Both are gone: the explanation is a section below the tool, and the
 * live result panel is the worked example, because it opens on the real answer for the
 * values the form opens with.
 *
 * Session 31 gave the page its own words. The H1 and the paragraph under it are the
 * calculator's SEO copy from `src/calc-seo.mjs` — the sentence somebody searched for,
 * rather than the site's own label for the tool — and the FAQ at the foot answers two
 * questions about THIS calculator. The breadcrumb keeps the short name: a trail is a map
 * of the site, and "Kalkulator farby — ile puszek na m²" in it is a title, not a place.
 */
export function calcPageMain(calc, lang, t, { seo, example, formula, materials = 0, guides = [] }) {
  const meta = CALC_META[calc.id];
  const name = t(`c_${calc.id}_t`);
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("calchub_title"), path: urlCalcIndex(lang) },
    { name, path: urlCalc(lang, calc.id) },
  ]);

  const inputs = calc.fields
    .filter((f) => f.k !== "price")
    .map((f) => `<li><b>${esc(t(f.label))}</b></li>`).join("");

  const related = (meta.related || [])
    .filter((id) => CALC_SLUG[id])
    .map((id) => `<a class="chip" href="${urlCalc(lang, id)}">${esc(t(`c_${id}_t`))}</a>`).join("");

  // The guides link down to the calculators; without this the trail only ran one way.
  const guideLinks = guides
    .filter((g) => g.calcs.includes(calc.id))
    .map((g) => `<a class="chip" href="${urlGuide(lang, g)}">${esc(t(`g_${g.id}_t`))}</a>`).join("");

  const formulaMarkup = (() => {
    if (!meta.algorithm) return `<pre class="formula"><code>${formula.map(esc).join("\n")}</code></pre>`;
    const steps = [];
    const equations = [];
    for (const line of formula) {
      const numbered = line.match(/^\d+\.\s*(.*)$/);
      if (numbered) steps.push(numbered[1]);
      else if (/^\s+/.test(line) && steps.length) steps[steps.length - 1] += ` ${line.trim()}`;
      else equations.push(line);
    }
    return `<ol class="formula">${steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>${equations.length ? `<pre class="formula"><code>${equations.map(esc).join("\n")}</code></pre>` : ""}`;
  })();

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(seo.title)}</h1>
      <p class="lead">${esc(seo.desc)}</p>
    </div>
  </section>

  <section class="block alt calc-tool">
    <div class="wrap">
      ${calcCard(calc, t, {
        materials, example, projectsUrl: urlProjects(lang),
        calcUrls: Object.fromEntries(Object.keys(CALC_SLUG).map((id) => [id, urlCalc(lang, id)])),
      })}
      ${materials ? `<p class="muted src-note"><a href="${urlMaterials(lang)}">${esc(t("matpage_title"))}</a>: ${esc(t(["mat", "for", "calc"].join("_")).replace("{n}", materials))}</p>` : ""}
    </div>
  </section>

  <section class="block" aria-labelledby="hwc-h">
    <div class="wrap calc-how">
      <h2 id="hwc-h">${esc(t("hwc_title"))}</h2>

      <div class="calc-how-grid">
        <div>
          <h3>${esc(t("hwc_inputs"))}</h3>
          <ul class="plain-list">${inputs}</ul>

          <h3>${esc(t("hwc_note"))}</h3>
          <p>${esc(t(`note_${calc.id}`))}</p>
        </div>
        <div>
          <h3>${esc(t("hwc_formula"))}</h3>
          ${formulaMarkup}
          <p class="muted src-note">${esc(t("hwc_source"))}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="block alt" aria-labelledby="cfaq-h">
    <div class="wrap narrow">
      <h2 id="cfaq-h">${esc(t("faq_title"))}</h2>
      <div class="faq">
        ${seo.faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <h2>${esc(t("calc_related"))}</h2>
      <div class="chips">${related}</div>
      ${guideLinks ? `<h2 class="mt-8">${esc(t("guide_calcs_back"))}</h2>
      <div class="chips">${guideLinks}</div>` : ""}
      <!-- AUDYT3 A7: shared row keeps the calculator navigation buttons apart. -->
      <p class="calc-page-actions mt-6">
        <a class="btn btn-ghost btn-go" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
        <a class="btn btn-ghost btn-go" href="${urlGuideIndex(lang)}">${esc(t("guide_all"))}</a>
      </p>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ guides */

export function guideIndexMain(lang, t, guides) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("guides_title"), path: urlGuideIndex(lang) },
  ]);
  const cards = guides.map((g) => `<a class="calc-link" href="${urlGuide(lang, g)}">
      <span class="calc-link-body">
        <b>${esc(t(`g_${g.id}_t`))}</b>
        <span class="muted">${esc(t(`g_${g.id}_d`))}</span>
      </span>
      <span class="calc-link-go">${esc(t("guide_open"))}</span>
    </a>`).join("");

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("guides_title"))}</h1>
      <p class="lead">${esc(t("guides_lead"))}</p>
    </div>
  </section>
  <section class="block alt">
    <div class="wrap"><div class="calc-links">${cards}</div></div>
  </section>
  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

export function guideMain(guide, lang, t) {
  const title = t(`g_${guide.id}_t`);
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("guides_title"), path: urlGuideIndex(lang) },
    { name: title, path: urlGuide(lang, guide) },
  ]);

  const steps = [1, 2, 3].map((n) => t(`g_${guide.id}_s${n}`));
  const calcLinks = guide.calcs
    .map((id) => `<a class="chip" href="${urlCalc(lang, id)}">${esc(t(`c_${id}_t`))}</a>`).join("");

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description: t(`g_${guide.id}_d`),
    inLanguage: lang,
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
  };

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(title)}</h1>
      <p class="lead">${esc(t(`g_${guide.id}_d`))}</p>
    </div>
  </section>
  <section class="block alt">
    <div class="wrap narrow">
      <h2>${esc(t("guide_steps_t"))}</h2>
      <ol class="steps-list">${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>

      <h2>${esc(t("guide_calcs_t"))}</h2>
      <div class="chips">${calcLinks}</div>

      <div class="tip">
        <b>${esc(t("guide_tip_t"))}</b>
        <p>${esc(t(`g_${guide.id}_tip`))}</p>
      </div>

      <p class="mt-6"><a class="btn btn-ghost btn-go" href="${urlGuideIndex(lang)}">${esc(t("guide_all"))}</a></p>
    </div>
  </section>
  ${appNote(t)}
</main>`;

  return { main, ld: [crumbs.ld, howTo] };
}

/* ------------------------------------------------------------------ materials */

/**
 * The whole catalogue as one indexable page per language.
 *
 * Every row is real HTML, grouped by shop aisle, so "ile paneli AC4 w paczce" can find
 * the answer without running the picker. The numbers come from the same catalogue the
 * picker writes into the form, so the page cannot document a value the calculator
 * does not use.
 *
 * @param {object} cat  the catalogue bridge built in scripts/build.mjs
 */
export function materialsMain(lang, t, cat, aisles, copy) {
  const c = (key) => copy[key];
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("matpage_title"), path: urlMaterials(lang) },
  ]);

  /**
   * One material, the row it has always been: the name, the spec line and the calculator.
   *
   * The haystack carries the aisle as well as the name. "Płytki" is the word somebody
   * types when they want the tiles, and it is on no material: the catalogue calls them
   * "Gres 60×60" and "Glazura 30×60", one term each, and the aisle is the only place the
   * plural anybody searches for is written down.
   */
  const row = (m, aisleName) => {
    const name = cat.name(m, lang, t);
    const calcId = cat.primary(m);
    const href = calcId ? `${urlCalc(lang, calcId)}?m=${encodeURIComponent(m.id)}` : urlCalcIndex(lang);
    return `<li id="${esc(m.id)}" data-find="${esc(cat.fold(`${name} ${m.id} ${aisleName}`))}">
            <span class="mat-item">
              <b>${esc(name)}</b>
              <span class="muted">${esc(cat.note(m, lang, t))}</span>
            </span>
            <a class="btn btn-ghost btn-sm btn-go" href="${href}">${esc(t("mat_open_calc"))}</a>
          </li>`;
  };

  // The number beside a heading. The word after it is for a screen reader — "Gres, 10"
  // is a heading and a number, and only the word says what the number counts. The
  // stylesheet takes the word off the screen, where the layout says it already.
  const badge = (n) =>
    `<span class="mat-count">${n}<span class="mat-count-w"> ${esc(t("mat_items_label"))}</span></span>`;

  const blocks = cat.categories.map((aisle) => {
    const aisleName = t(`cat_${aisle}`);
    // Sizes of one thing belong together: eleven rows of porcelain tile are one entry a
    // fitter opens, not eleven rows to scroll past. The order is the catalogue's own —
    // the group takes the place of the first material that carries its term.
    const groups = [];
    const byTerm = new Map();
    for (const m of cat.byCategory(aisle)) {
      if (!byTerm.has(m.t)) { byTerm.set(m.t, { term: m.t, items: [] }); groups.push(byTerm.get(m.t)); }
      byTerm.get(m.t).items.push(m);
    }
    const total = groups.reduce((n, g) => n + g.items.length, 0);

    const body = groups.map((g) => {
      // A term with one size behind it is a row, not a drawer. Wrapping it would cost a
      // click to reach a single line and would say "1" beside every other heading.
      if (g.items.length === 1) return `<ul class="mat-page-list mat-solo hierarchy-leaves">${row(g.items[0], aisleName)}</ul>`;
      return `<details class="mat-grp hierarchy-l2" data-grp>
            <summary class="mat-grp-head">
              <h3>${esc(t(g.term))}</h3>
              ${badge(g.items.length)}
            </summary>
            <ul class="mat-page-list hierarchy-leaves">${g.items.map((m) => row(m, aisleName)).join("")}</ul>
          </details>`;
    }).join("\n          ");

    return `<details class="mat-cat hierarchy-l1" id="cat-${aisle}" data-cat-details data-cat-block>
          <summary class="mat-cat-head">
            <h2>${esc(t(`cat_${aisle}`))}</h2>
            ${badge(total)}
          </summary>
          <div class="mat-groups">
          ${body}
          </div>
        </details>`;
  }).join("\n  ");

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("matpage_title"))}</h1>
      <p class="lead">${esc(t("matpage_lead"))}</p>
    </div>
  </section>

  <div id="materials-page">
    <section class="block alt">
      <div class="wrap">
        <label class="fld-label" for="matpage-search">${esc(t("mat_search_ph"))}</label>
        <input id="matpage-search" type="search" class="mat-search" placeholder="${esc(t("mat_search_ph"))}" autocomplete="off">
        <p class="mat-tools">
          <button type="button" class="btn btn-ghost btn-sm" data-mat-expand>${esc(t("matpage_expand"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-mat-collapse>${esc(t("matpage_collapse"))}</button>
        </p>
        <p class="muted mt-3">${cat.total} ${esc(t.plural("mat_count_label", cat.total))} · ${esc(t("matpage_note"))}</p>
        <p class="muted" id="matpage-count" role="status" hidden></p>
        <p class="muted" id="matpage-empty" hidden>${esc(t("mat_none"))}</p>
      </div>
    </section>
    <section class="block">
      <div class="wrap mat-cat-list">
        ${blocks}
      </div>
    </section>
  </div>

  ${ownMaterialsBlock(t, aisles, c)}

  ${appNote(t)}
</main>`;

  const ld = [crumbs.ld, {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("matpage_title"),
    numberOfItems: cat.total,
    itemListElement: cat.all.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: cat.name(m, lang, t),
    })),
  }];
  return { main, ld };
}

/**
 * "Your materials" on the catalogue page: the same store as /moje-materialy/, behind
 * the sign-in the owner asked for.
 *
 * The guest half is what the document ships with, and assets/materials-ui.js swaps the
 * two on `lmSignedIn()` — so a visitor with no JavaScript is offered the sign-in rather
 * than a form whose rows would live in one browser and nowhere else. That hint can be
 * stale (assets/account.js says so), and it may be: nothing here is a gate on counting
 * or on saving, only on which of two blocks the page shows. /moje-materialy/ stays open
 * to everybody and is where the whole screen, the prices and the history live.
 */
function ownMaterialsBlock(t, aisles, c) {
  return `<section class="block alt" id="matpage-own">
    <div class="wrap narrow">
      <h2>${esc(c("omat_list_t"))}</h2>
      <p class="muted" data-omat-guest>
        ${esc(c("omat_guest_note"))}
        <a class="btn btn-ghost btn-sm btn-go" href="${URL_APP}">${esc(c("omat_signin"))}</a>
      </p>
      <div data-omat-mine hidden>
        <details class="mat-add">
          <summary>${esc(c("omat_add_t"))}</summary>
          ${omatForm(t, aisles, c)}
        </details>
        <div data-omat-list data-hist-label="${esc(c("omat_hist_t"))}"></div>
        <p class="muted" data-omat-empty>${esc(t("omat_empty"))}</p>
        <p class="ws-undo" data-omat-undo role="status" hidden></p>
        <p class="muted">${esc(c("omat_use_note"))}</p>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ cookies */

/**
 * Every cookie and every piece of browser storage the site uses, one row each.
 *
 * `name` and `type` are literal — a storage key is not translated — so only the purpose
 * is a dictionary key. Keeping the list here rather than in the dictionary means it can be
 * checked against the code: each row names the file that writes it.
 */
export const COOKIE_ROWS = [
  { name: "materio_consent", type: "ck_type_local", purpose: "ck_p_consent", life: "ck_life_until_cleared" },
  { name: "materio-lang", type: "ck_type_local", purpose: "ck_p_lang", life: "ck_life_until_cleared" },
  { name: "liczmat-currency", type: "ck_type_local", purpose: "ck_p_currency", life: "ck_life_until_cleared" },
  { name: "liczmat-theme", type: "ck_type_local", purpose: "ck_p_theme", life: "ck_life_until_cleared" },
  { name: "liczmat-signed-in", type: "ck_type_local", purpose: "ck_p_signed_in", life: "ck_life_until_signout" },
  { name: "liczmat-remember", type: "ck_type_local", purpose: "ck_p_remember", life: "ck_life_until_cleared" },
  { name: "liczmat-session", type: "ck_type_cookie", purpose: "ck_p_remember", life: "ck_life_session" },
  { name: "materio-redirected", type: "ck_type_session", purpose: "ck_p_redirect", life: "ck_life_session" },
  { name: "materio-workspace-v1", type: "ck_type_local", purpose: "ck_p_workspace", life: "ck_life_until_cleared" },
  { name: "materio-active-project", type: "ck_type_local", purpose: "ck_p_active", life: "ck_life_until_cleared" },
  { name: "liczmat-recent-calcs", type: "ck_type_local", purpose: "ck_p_recent", life: "ck_life_until_cleared" },
  { name: "liczmat-crm-v1", type: "ck_type_local", purpose: "ck_p_crm", life: "ck_life_until_cleared" },
  { name: "liczmat-materials-v1", type: "ck_type_local", purpose: "ck_p_omat", life: "ck_life_until_cleared" },
  { name: "liczmat-sync-account", type: "ck_type_local", purpose: "ck_p_sync_account", life: "ck_life_until_cleared" },
  { name: "liczmat-sync-pushed-at:<uid>", type: "ck_type_local", purpose: "ck_p_sync_account", life: "ck_life_until_cleared" },
  { name: "liczmat-sync-pulled-at:<uid>", type: "ck_type_local", purpose: "ck_p_sync_account", life: "ck_life_until_cleared" },
];

const COOKIE_THIRD_ROWS = [
  { name: "_ga, _ga_*", type: "ck_type_cookie", purpose: "ck_p_ga", life: "ck_life_2y" },
  { name: "firebaseLocalStorageDb", type: "ck_type_idb", purpose: "ck_p_firebase", life: "ck_life_until_signout" },
  { name: "google.com / maps.google.com", type: "ck_type_cookie", purpose: "ck_p_maps", life: "ck_life_google" },
];

export function cookiesMain(lang, t) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("cookiepage_title"), path: urlCookies(lang) },
  ]);

  const table = (rows) => `<div class="table-scroll"><table class="ws-table">
      <thead><tr>
        <th scope="col">${esc(t("ck_col_name"))}</th>
        <th scope="col">${esc(t("ck_col_type"))}</th>
        <th scope="col">${esc(t("ck_col_purpose"))}</th>
        <th scope="col">${esc(t("ck_col_life"))}</th>
      </tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td><code>${esc(r.name)}</code></td>
        <td>${esc(t(r.type))}</td>
        <td>${esc(t(r.purpose))}</td>
        <td>${esc(t(r.life))}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("cookiepage_title"))}</h1>
      <p class="lead">${esc(t("cookiepage_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <h2>${esc(t("cookiepage_h_choice"))}</h2>
      <p class="muted">${esc(t("cookiepage_choice_d"))}</p>
      <p class="ws-links">
        <span class="chip" id="consent-state">${esc(t("cookiepage_unset"))}</span>
        <button type="button" id="consent-change" class="btn btn-primary btn-sm">${esc(t("cookiepage_change"))}</button>
      </p>
    </div>
  </section>

  <section class="block">
    <div class="wrap narrow">
      <h2>${esc(t("cookiepage_h_own"))}</h2>
      <p class="muted">${esc(t("cookiepage_own_d"))}</p>
      ${table(COOKIE_ROWS)}
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <h2>${esc(t("cookiepage_h_third"))}</h2>
      <p class="muted">${esc(t("cookiepage_third_d"))}</p>
      ${table(COOKIE_THIRD_ROWS)}
      <p class="muted src-note">${esc(t("cookiepage_note"))}
        <a href="${urlPrivacy(lang)}">${esc(t("foot_privacy"))}</a></p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ contact */

/**
 * /kontakt/ — who runs LiczMat and how to reach them. Audit item H7.
 *
 * The audit found no occurrence of the word "kontakt" and no `mailto:` anywhere in
 * index.html, on a site that charges for Pro through Stripe and opens Firebase accounts.
 * Article 13 of the GDPR wants the identity of the controller, the e-commerce directive
 * wants the identity of the seller, and a visitor about to type a card number wants to
 * know there is somebody on the other end. One page answers all three.
 *
 * There is no form. A form needs an endpoint, a spam defence and a place to put what it
 * collects, and every one of those is a thing that can quietly stop working — an address
 * anybody can copy into their own mail client cannot. The identity rows are ENTITY in
 * src/site.mjs, printed by entityRows() so a detail the owner does not publish is a row
 * that is absent rather than a label with nothing after it.
 */
export function contactMain(lang, t) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("contactpage_title"), path: urlContact(lang) },
  ]);

  // .fact is the profile screen's label-and-value row (assets/styles.css): the same pair
  // of facts in the same shape, so this page adds no rule of its own to the stylesheet.
  // The two rows somebody acts on are links: a phone on a phone dials, and an address in
  // a mail client opens a draft. The rest are text, because a VAT number is not a control.
  const value = (r) => {
    if (r.key === "contact_l_email") return `<a href="mailto:${esc(r.value)}">${esc(r.value)}</a>`;
    if (r.key === "contact_l_phone") return `<a href="tel:${esc(r.value.replace(/\s+/g, ""))}">${esc(r.value)}</a>`;
    return esc(r.value);
  };
  const rows = entityRows().map((r) => `<div class="fact">
          <dt>${esc(t(r.key))}</dt>
          <dd>${value(r)}</dd>
        </div>`).join("\n        ");

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("contactpage_title"))}</h1>
      <p class="lead">${esc(t("contactpage_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <h2>${esc(t("contactpage_h_write"))}</h2>
      <p class="muted">${esc(t("contactpage_write_d"))}</p>
      <p class="ws-links">
        <a class="btn btn-primary" href="mailto:${esc(ENTITY.email)}">${esc(t("contactpage_write_cta"))}</a>
      </p>
      <p class="muted">${esc(t("contactpage_reply"))}</p>
    </div>
  </section>

  <section class="block">
    <div class="wrap narrow">
      <h2>${esc(t("contactpage_h_who"))}</h2>
      <p class="muted">${esc(t("contactpage_who_d"))}</p>
      <dl class="facts">
        ${rows}
      </dl>
      <!-- AUDYT3 A7: the follow-up paragraph needs space after the facts table. -->
      <p class="contact-dispute muted">${esc(t("contactpage_dispute"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <h2>${esc(t("contactpage_h_data"))}</h2>
      <p class="muted">${esc(t("contactpage_data_d"))}</p>
      <p class="ws-links">
        <a href="${urlPrivacy(lang)}">${esc(t("foot_privacy"))}</a>
        <a href="${urlCookies(lang)}">${esc(t("foot_cookies"))}</a>
      </p>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: t("contactpage_title"),
    url: BASE_URL + urlContact(lang),
    mainEntity: {
      "@type": "Person",
      name: ENTITY.name,
      email: ENTITY.email,
      ...(ENTITY.address ? { address: ENTITY.address } : {}),
      ...(ENTITY.phone ? { telephone: ENTITY.phone } : {}),
      ...(ENTITY.taxId ? { vatID: ENTITY.taxId } : {}),
    },
  };

  return { main, ld: [crumbs.ld, contactLd] };
}

/* ------------------------------------------------------------------ the Android app */

/**
 * /aplikacja/ — the one page where the Android app is the subject.
 *
 * The rest of the site is the tool and mentions the app once, quietly, at the foot of a
 * page. This page shows the app: three screenshots rendered from the app's own code
 * (WebHeroShotsTest in the Materio repo, then scripts/web-screens.py there), each once,
 * each beside the words about it, and the things a visitor has to know before installing:
 * it is free, it carries ads, and the store map asks for a location.
 *
 * Session W (2026-09-24) took out what the owner called slop: the breadcrumb band, the
 * pill with a dot, the icon facts, the band of numbers, nine icon cards, a carousel shown
 * twice and a lime-filled closing banner. The download button is Google's own badge,
 * unmodified, because a home-made one imitating it is exactly what the owner objected to.
 */
export function androidMain(lang, t, calcs, cat) {
  // The four facts the owner asked to keep under the buttons (2026-09-24): said once, as
  // plain text. The counts come from the build, so they cannot drift from the site.
  const facts = [
    t("apppage_fact_offline"),
    t("apppage_fact_same")
      .replace("{calc}", calcs.length).replace("{calcs}", t.plural("calc_count", calcs.length))
      .replace("{mat}", cat.total).replace("{mats}", t.plural("mat_count_label", cat.total)),
    t("apppage_fact_langs").replace("{langs}", LANGS.length).replace("{cur}", CURRENCIES.length),
    t("apppage_fact_sync"),
  ];

  /* The screenshots are rendered from the app's own code (WebHeroShotsTest,
     WebHeroShotsDarkTest and WebHeroShotsI18nTest in the Materio repo, converted by its
     scripts/web-screens.py). Every page shows the app in its own language — the app speaks
     the same thirteen as the site (owner, 2026-09-24). */
  const shotLang = lang;
  const src = (name, dark) => `/assets/screens/${shotLang}_${name}${dark ? "_dark" : ""}.webp`;

  /* One phone carries two screenshots: the one for a light page (.for-light) and the one
     for a dark page (.for-dark), and the stylesheet shows the one that matches the page's
     theme, script or no script. `swap` shows the app in the OPPOSITE theme — only the
     hero's back phone does that, so the hero shows the app in both of its themes at once.
     A hidden <img loading="lazy"> is never fetched. */
  const device = (name, altKey, cls, swap = false) => {
    const img = (dark, forCls) => `<img class="${forCls} ${dark ? "app-d" : "app-l"}" src="${src(name, dark)}" width="618" height="1340" alt="${esc(t(altKey))}" loading="lazy" decoding="async">`;
    return `<figure class="app-device ${cls}"><span class="app-screen">${img(swap, "for-light")}${img(!swap, "for-dark")}</span></figure>`;
  };
  // As the calculator form on the screenshot writes it: a decimal point only in English.
  const dim = lang === "en" ? "3.40 m" : "3,40 m";

  const main = `<main id="main" tabindex="-1">
  <section class="app-hero-b" aria-labelledby="app-h">
    <div class="wrap">
      <div class="app-stage">
        <div class="app-stage-copy">
          <h1 id="app-h">${esc(t("apppage_title"))}</h1>
          <p class="lead">${esc(t("apppage_lead"))}</p>
          <div class="store-badges">
            ${playBadge(lang, "apppage")}
            <a class="btn btn-ghost btn-go" href="${urlCalcIndex(lang)}">${esc(t("apppage_web_link"))}</a>
          </div>
          <ul class="app-facts">${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        </div>
        <div class="app-stage-media">
          ${device("projects", "shot_projects", "app-device-back", true)}
          ${device("home", "shot_home", "app-device-front")}
          <p class="app-float app-float-hero"><span class="app-float-k">${esc(t("apppage_ex_k"))}</span><b>${esc(t("apppage_ex_v"))}</b><span class="app-float-a">${esc(t("apppage_ex_a"))}</span></p>
        </div>
      </div>
    </div>
  </section>

  <div class="block app-steps-block">
    <div class="wrap">
      <ol class="app-steps">
        ${[1, 2, 3, 4].map((n) => `<li><span class="app-step-n" aria-hidden="true">0${n}</span><b>${esc(t(`apppage_s${n}_t`))}</b><span>${esc(t(`apppage_s${n}_d`))}</span></li>`).join("\n        ")}
      </ol>
    </div>
  </div>

  <section class="block" aria-labelledby="appresult-h">
    <div class="wrap">
      <div class="app-pane app-calc">
        <div class="app-calc-copy">
          <h2 id="appresult-h">${esc(t("apppage_h_result"))}</h2>
          <p>${esc(t("apppage_result_d"))}</p>
          <ul class="app-list"><li>${esc(t("f_calc_t"))}</li><li>${esc(t("f_optim_t"))}</li><li>${esc(t("f_catalog_t"))}</li><li>${esc(t("af_converter_t"))}</li></ul>
          <!-- AUDYT3 A7: the "Do kupienia 15 opak. · odpad 7,4%" line went; the hero card and the
               screenshot beside it already give that same tile result, three times was two too many. -->
        </div>
        <div class="app-work">
          <span class="app-dim" aria-hidden="true"><span>${dim}</span></span>
          ${device("calcform", "shot_calcform", "app-device-work")}
        </div>
      </div>
    </div>
  </section>

  <section class="block" aria-labelledby="appshop-h">
    <div class="wrap app-shop">
      <div class="app-shop-copy">
        <h2 id="appshop-h">${esc(t("apppage_h_shop"))}</h2>
        <p>${esc(t("apppage_shop_d"))}</p>
        <ul class="app-list"><li>${esc(t("apppage_shop_1"))}</li><li>${esc(t("apppage_shop_2"))}</li><li>${esc(t("apppage_shop_3"))}</li><li><a href="${urlLiczmatPro(lang)}">${esc(t("apppage_shop_pro"))}</a></li></ul>
      </div>
      <div class="app-shop-media">
        <div class="app-pane app-shop-card">${device("shopping", "shot_shopping", "app-device-shop")}</div>
        <p class="app-float app-float-row"><span class="app-box" aria-hidden="true"></span><span><b>${esc(t("apppage_row_t"))}</b><span class="app-float-a">${esc(t("apppage_row_d"))}</span></span></p>
      </div>
    </div>
  </section>

  <section class="block" aria-labelledby="appreq-h">
    <div class="wrap narrow app-install">
      <h2 id="appreq-h">${esc(t("apppage_h_reqs"))}</h2>
      <ul class="app-list">
        <li>${esc(t("apppage_req_1"))}</li>
        <li>${esc(t("apppage_req_2"))}</li>
        <li>${esc(t("apppage_req_3"))}</li>
        <li>${esc(t("apppage_req_4"))}</li>
      </ul>
      ${playBadge(lang, "install")}
      <p class="gp-tm">${esc(t("gp_tm"))}</p>
      <p class="muted src-note"><a href="${urlPrivacy(lang)}">${esc(t("foot_privacy"))}</a></p>
    </div>
  </section>
</main>`;

  // /aplikacja/ intentionally has no visible breadcrumb, so it has no BreadcrumbList JSON-LD.
  const ld = [{
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "LiczMat",
    operatingSystem: "Android 7.0+",
    applicationCategory: "UtilitiesApplication",
    inLanguage: lang,
    url: BASE_URL + urlAndroid(lang),
    downloadUrl: PLAY_URL,
    installUrl: PLAY_URL,
    description: t("apppage_lead"),
    offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
    screenshot: ["home", "projects", "calcform", "shopping"]
      .map((f) => `${BASE_URL}${src(f, false)}`),
  }];
  return { main, ld };
}

/* ------------------------------------------------------------------ workspace */

/**
 * /projekty/ — projects and rooms, kept in the browser.
 *
 * The account layer at /app/ used to be the only place a room could exist, which meant a
 * calculator could not offer one unless the visitor signed in first. Counting never
 * requires an account (FIRESTORE_SYNC §1.2), so the rooms live in localStorage in the
 * same document shape and sync upward when somebody does sign in.
 *
 * Two screens share this one file, because a project id is made in the browser and can
 * never be a directory on GitHub Pages — the `project` route in src/ia.mjs is declared
 * `view: true` for that reason:
 *
 *   /projekty/            the index: the projects, the archive, the rooms
 *   /projekty/?id=<id>    one project — chapter XIV
 *
 * The build writes both frames; assets/workspace-ui.js shows one of them and fills it
 * from localStorage. Without a script the index is what stands, which is right: there is
 * nothing on either screen that does not come out of this browser's own storage.
 */
/**
 * The one string on the PDF block that is NOT the app's: printing works differently here.
 *
 * The app renders a PDF with `PdfDocument` and hands it to the Android share sheet. A
 * static site has no renderer and may not fetch one — the whole product is dependency-free
 * — so the document is markup and the browser's own print dialog is what turns it into a
 * PDF. That is a real difference in how the button behaves, so it is said rather than
 * hidden, and it is authored here because the app has no sentence for it.
 */
const PDF_WEB = {
  pl: { hint: "Dokument otworzy się w oknie drukowania. Wybierz w nim zapis do PDF.", make: "Przygotuj PDF" },
  en: { hint: "The document opens in the print dialog. Choose saving to PDF there.", make: "Prepare PDF" },
  de: { hint: "Das Dokument öffnet sich im Druckdialog. Wählen Sie dort das Speichern als PDF.", make: "PDF vorbereiten" },
  uk: { hint: "Документ відкриється у вікні друку. Виберіть у ньому збереження в PDF.", make: "Підготувати PDF" },
  cs: { hint: "Dokument se otevře v dialogu tisku. Zvolte v něm uložení do PDF.", make: "Připravit PDF" },
  sk: { hint: "Dokument sa otvorí v dialógu tlače. Zvoľte v ňom uloženie do PDF.", make: "Pripraviť PDF" },
  ro: { hint: "Documentul se deschide în fereastra de tipărire. Alegeți acolo salvarea în PDF.", make: "Pregătește PDF" },
  hr: { hint: "Dokument se otvara u dijalogu ispisa. Ondje odaberite spremanje u PDF.", make: "Pripremi PDF" },
  sr: { hint: "Dokument se otvara u dijalogu štampe. Tamo izaberite čuvanje u PDF.", make: "Pripremi PDF" },
  it: { hint: "Il documento si apre nella finestra di stampa. Scegli lì il salvataggio in PDF.", make: "Prepara il PDF" },
  nl: { hint: "Het document opent in het printvenster. Kies daar het opslaan als PDF.", make: "PDF voorbereiden" },
  es: { hint: "El documento se abre en la ventana de impresión. Elige allí guardar en PDF.", make: "Preparar el PDF" },
  fr: { hint: "Le document s'ouvre dans la fenêtre d'impression. Choisis-y l'enregistrement en PDF.", make: "Préparer le PDF" },
};

/**
 * The PDF export of one project — session 59, the second half of item C6.
 *
 * Two documents, exactly the two the app offers (`PdfExportType`): a technical report and
 * an investor estimate. Every word is the app's own, out of src/pdf-copy.mjs.
 *
 * **The whole thing is markup, configurator and document both.** The document is in the
 * page from the first paint, `hidden`, and assets/pdf-export.js fills in numbers and rows —
 * the rule proGate() has followed since session 27, and the one that keeps the words out of
 * the dictionary bundle every page on the site downloads. A document built by a script
 * would also have to carry fifty translated strings to build it out of.
 *
 * Nothing here decides what the project costs. `wsProjectCosts()` does, and the PDF prints
 * the same three figures the screen above it shows: a printed page that disagrees with the
 * screen it was printed from is the defect worth avoiding, and it is why this does not copy
 * the app's exporter, which totals the estimations alone.
 *
 * **The whole block is Pro since 2026-09-03.** The configurator and the document sit
 * inside `#pdf-tool` and chapter XXV's wall (`proGate()`) stands beside them as
 * `#pdf-gate`; assets/paywall.js shows one of the two from the level on the account. Both
 * are in the markup from the first paint, so a free account never sees the form flash open
 * before it closes — and never sees a dead button where the form was either.
 *
 * @param {object[]} features LM_FEATURES from assets/plan.js, for the wall
 */
function pdfBlock(lang, t, features) {
  const c = (key) => PDF_COPY[lang][key];
  const web = PDF_WEB[lang];
  const split = (key, slot) => {
    const { before, after } = pdfSplit(c(key));
    return `${esc(before)}<span data-pdf="${esc(slot)}"></span>${esc(after)}`;
  };

  // A checkbox with its label, in the shape .field-check already styles.
  const opt = (name, key, on) =>
    `<label class="field-check"><input type="checkbox" data-pdf-opt="${esc(name)}"${on ? " checked" : ""}> <span>${esc(c(key))}</span></label>`;

  const field = (name, key, value = "") =>
    `<label class="field ws-mat-f"><span class="fld-label">${esc(c(key))}</span>
            <input type="text" data-pdf-in="${esc(name)}" value="${esc(value)}"></label>`;

  const numField = (name, key, value = "") =>
    `<label class="field ws-mat-f"><span class="fld-label">${esc(c(key))}</span>
            <input type="text" inputmode="decimal" data-pdf-in="${esc(name)}" value="${esc(value)}"></label>`;

  const configurator = `<form id="ws-pdf-form">
            <fieldset class="pdf-types">
              <legend class="fld-label">${esc(c("pdf_doc_type"))}</legend>
              <label class="field-check"><input type="radio" name="pdf-type" value="technical" checked> <span>${esc(c("pdf_technical"))}</span></label>
              <label class="field-check"><input type="radio" name="pdf-type" value="investor"> <span>${esc(c("pdf_investor"))}</span></label>
            </fieldset>

            <details class="ws-mat-add">
              <summary>${esc(c("pdf_scope"))}</summary>
              ${opt("quantities", "pdf_quantities", true)}
              ${opt("prices", "pdf_prices", true)}
              ${opt("total", "pdf_total", true)}
              ${opt("date", "pdf_date", true)}
            </details>

            <details class="ws-mat-add">
              <summary>${esc(c("pdf_contractor_data"))}</summary>
              ${opt("contractor", "pdf_contractor_data", false)}
              <p class="ws-mat-grid">
                ${field("company", "pdf_company")}
                ${field("phone", "pdf_phone")}
                ${field("email", "pdf_email")}
              </p>
            </details>

            <!-- Chapter §37's investor block. Hidden while the technical report is chosen:
                 labour, margin and VAT are not part of a technical report, and a form that
                 offers a field the document will not print is a form that lies. -->
            <details class="ws-mat-add" data-pdf-investor hidden>
              <summary>${esc(c("pdf_pricing"))}</summary>
              ${opt("labor", "pdf_labor", false)}
              <p class="ws-mat-grid">
                ${numField("laborHours", "pdf_labor_hours")}
                ${numField("laborRate", "pdf_labor_rate")}
              </p>
              ${opt("margin", "pdf_margin", false)}
              <p class="ws-mat-grid">${numField("marginPercent", "pdf_margin_percent")}</p>
              ${opt("vat", "pdf_vat", false)}
              <p class="ws-mat-grid">${numField("vatPercent", "pdf_vat_percent", "23")}</p>
            </details>

            <details class="ws-mat-add">
              <summary>${esc(c("pdf_optional"))}</summary>
              ${opt("estimateNumber", "pdf_estimate_number", false)}
              <p class="ws-mat-grid">${field("estimateNumber", "pdf_estimate_number")}</p>
              ${opt("notes", "pdf_notes", false)}
              <label class="field"><span class="fld-label">${esc(c("pdf_notes_hint"))}</span>
                <textarea data-pdf-in="notesText" rows="3"></textarea></label>
            </details>

            <div class="form-foot"><button type="submit" class="btn btn-primary">${esc(web.make)}</button></div>
          </form>`;

  // The document. Every heading and column header is here in this page's language; the
  // script writes numbers, rows and the three split sentences, and nothing else.
  const doc = `<article id="ws-pdf-doc" class="pdf-doc" hidden>
            <header class="pdf-head">
              <!-- Both names ship on the element and the script picks one: two words is cheaper
                   than a dictionary key, and it keeps them out of the bundle every page loads. -->
              <p class="pdf-sub" data-pdf="subtitle"
                 data-technical="${esc(c("pdfdoc_subtitle_technical"))}"
                 data-investor="${esc(c("pdfdoc_subtitle_investor"))}"></p>
              <p class="pdf-line" data-pdf-row="project">${split("pdfdoc_project", "projectName")}</p>
              <p class="pdf-line" data-pdf-row="date">${split("pdfdoc_date", "date")}</p>
              <p class="pdf-line" data-pdf-row="estimateNo" hidden>${split("pdfdoc_estimate_no", "estimateNo")}</p>
              <div class="pdf-contractor" data-pdf-row="contractor" hidden>
                <p data-pdf="company"></p>
                <p data-pdf="phone"></p>
                <p data-pdf="email"></p>
              </div>
            </header>

            <table class="pdf-table">
              <thead>
                <tr>
                  <th scope="col">${esc(c("pdfdoc_col_material"))}</th>
                  <th scope="col" data-pdf-col="qty">${esc(c("pdfdoc_col_qty"))}</th>
                  <th scope="col" data-pdf-col="value">${esc(c("pdfdoc_col_value"))}</th>
                </tr>
              </thead>
              <tbody data-pdf="rows"></tbody>
            </table>
            <p class="pdf-empty" data-pdf-row="empty" hidden>${esc(c("pdfdoc_no_estimations"))}</p>

            <p class="pdf-total" data-pdf-row="total">
              <span>${esc(c("pdfdoc_grand_total"))}</span> <b data-pdf="total"></b>
            </p>
            <p class="pdf-line" data-pdf-row="waste" hidden>${split("pdfdoc_waste_total", "waste")}</p>
            <p class="pdf-line pdf-mixed" data-pdf-row="mixed" hidden>${esc(t("ws_mixed_currency"))}</p>

            <section class="pdf-pricing" data-pdf-row="pricing" hidden>
              <h2>${esc(c("pdfdoc_pricing_header"))}</h2>
              <dl>
                <div><dt>${esc(c("pdfdoc_materials_net"))}</dt><dd data-pdf="materialsNet"></dd></div>
                <div data-pdf-row="labor" hidden><dt>${esc(c("pdfdoc_labor"))}</dt><dd data-pdf="labor"></dd></div>
                <div data-pdf-row="marginRow" hidden><dt>${esc(c("pdfdoc_margin"))}</dt><dd data-pdf="margin"></dd></div>
                <div class="pdf-strong" data-pdf-row="net" hidden><dt>${esc(c("pdfdoc_net_total"))}</dt><dd data-pdf="net"></dd></div>
                <div data-pdf-row="vatRow" hidden><dt>${esc(c("pdfdoc_vat"))}</dt><dd data-pdf="vat"></dd></div>
                <div class="pdf-strong" data-pdf-row="gross" hidden><dt>${esc(c("pdfdoc_gross_total"))}</dt><dd data-pdf="gross"></dd></div>
              </dl>
            </section>

            <section class="pdf-notes" data-pdf-row="notes" hidden>
              <h2>${esc(c("pdfdoc_notes"))}</h2>
              <p data-pdf="notes">${esc(c("pdfdoc_notes_default"))}</p>
            </section>

            <p class="pdf-foot">${esc(c("pdfdoc_footer"))}</p>
          </article>`;

  // Chapter XXV's wall, from the one builder every Pro page uses. `back` names the route
  // a guest is returned to after signing up, because the PDF is offered on two pages and
  // the feature itself names neither.
  const gate = proGate(t, "pdf", features, lang,
    { id: "pdf-gate", back: "projects", brief: true });

  return `<section class="dash-sec ws-pdf" id="ws-pdf">
            <div class="dash-head"><h2>${esc(c("pdf_title"))}</h2></div>
            ${gate}
            <div id="pdf-tool" hidden>
              <p class="muted">${esc(web.hint)}</p>
              ${configurator}
              ${doc}
            </div>
          </section>`;
}

/** The quote reuses the project export's print lifecycle and document vocabulary. */
export function quotePdfBlock(lang, t, features, stamp = "") {
  const c = (key) => QUOTE_PDF_COPY[lang][key];
  const asset = (name) => `/assets/${name}${stamp ? `?v=${stamp}` : ""}`;
  // proGate() is indented for standalone insertion. Empty indentation becomes trailing
  // whitespace inside this nested block, so remove it without changing any visible copy.
  const gate = proGate(t, "pdf", features, lang,
    { id: "pdf-gate", back: "quotes", brief: true }).split(/\r?\n/)
    .map((line) => line.trimEnd()).join("\n").trim();
  const tableHead = `<thead><tr>
                  <th scope="col" class="qdoc-col-lp">${esc(c("qdoc_no"))}</th>
                  <th scope="col" class="qdoc-col-desc">${esc(c("qdoc_description"))}</th>
                  <th scope="col" class="qdoc-col-qty">${esc(c("qdoc_quantity"))}</th>
                  <th scope="col" class="qdoc-col-price" data-pdf="unitPriceHead" data-label="${esc(c("qdoc_unit_price"))}">${esc(c("qdoc_unit_price"))}</th>
                  <th scope="col" class="qdoc-col-val" data-pdf="valueHead" data-label="${esc(c("qdoc_value"))}">${esc(c("qdoc_value"))}</th>
                </tr></thead>`;
  return `<section class="ws-pdf" id="ws-pdf">
            ${gate}
            <div id="pdf-tool" hidden>
              <p id="quo-pdf-company" class="muted" hidden>${esc(t("quo_pdf_company"))} <a href="${urlCompany(lang)}">${esc(t("companypage_title"))}</a></p>
              <article id="ws-pdf-doc" class="qdoc qdoc--no-logo" data-quote-title="${esc(c("qdoc_title").toLocaleLowerCase(lang).replace(/^./u, (letter) => letter.toLocaleUpperCase(lang)))}" hidden>
                <table class="qdoc-print-wrap"><thead><tr><th scope="col" class="qdoc-head-space"></th></tr></thead><tbody><tr><td><div class="qdoc-main">
                  <header class="qdoc-head"><div class="qdoc-seller">
                    <div class="qdoc-company-name" data-pdf="companyName"></div>
                    <div data-pdf-row="companyStreet" hidden data-pdf="companyStreet"></div>
                    <div data-pdf-row="companyPostalCity" hidden data-pdf="companyPostalCity"></div>
                    <div data-pdf-row="companyNip" hidden><span class="qdoc-label" data-pdf="companyTaxLabel" data-generic="${esc(t("company_nip"))}">${esc(t("company_nip"))}</span> <span data-pdf="companyNip"></span></div>
                    <div data-pdf-row="companyPhone" hidden><span class="qdoc-label">${esc(c("qdoc_phone"))}</span> <span data-pdf="companyPhone"></span></div>
                    <div data-pdf-row="companyEmail" hidden><span class="qdoc-label">${esc(c("qdoc_email"))}</span> <span data-pdf="companyEmail"></span></div>
                    <div data-pdf-row="companyWww" hidden data-pdf="companyWww"></div>
                  </div><div class="qdoc-head-right"><div class="qdoc-logo-box">
                    <img class="qdoc-logo" data-pdf="companyLogo" alt="${esc(c("qdoc_company_logo"))}" width="227" height="83" decoding="async" loading="eager">
                    <div class="qdoc-logo-name" data-pdf="logoCompanyName"></div>
                  </div><div class="qdoc-title">${esc(c("qdoc_title"))}</div></div></header>
                  <div class="qdoc-meta"><div class="qdoc-for" data-pdf-row="forBlock"><div class="qdoc-meta-label">${esc(c("qdoc_for"))}</div>
                    <div class="qdoc-for-name" data-pdf-row="clientName" hidden data-pdf="clientName"></div>
                    <div data-pdf-row="clientStreet" hidden data-pdf="clientStreet"></div>
                    <div data-pdf-row="clientPostalCity" hidden data-pdf="clientPostalCity"></div>
                    <div data-pdf-row="clientPhone" hidden><span class="qdoc-label">${esc(c("qdoc_phone"))}</span> <span data-pdf="clientPhone"></span></div>
                    <div data-pdf-row="clientEmail" hidden data-pdf="clientEmail"></div>
                    <div class="qdoc-project-name" data-pdf-row="projectName" hidden><span class="qdoc-label">${esc(c("qdoc_project"))}</span> <span data-pdf="projectName"></span></div>
                  </div><div class="qdoc-details"><dl class="qdoc-details-list">
                    <div class="qdoc-details-row" data-pdf-row="quoteNumber"><dt>${esc(c("qdoc_quote_no"))}</dt><dd data-pdf="quoteNumber"></dd></div>
                    <div class="qdoc-details-row"><dt>${esc(c("qdoc_date"))}</dt><dd data-pdf="date"></dd></div>
                    <div class="qdoc-details-row" data-pdf-row="validUntil" hidden><dt>${esc(c("qdoc_valid_until"))}</dt><dd data-pdf="validUntil"></dd></div>
                  </dl></div></div>
                  <section data-pdf-row="materialsTable" hidden><div class="qdoc-caption">${esc(c("qdoc_materials"))}</div><table class="qdoc-table">${tableHead}<tbody data-pdf="materialRows"></tbody></table></section>
                  <section data-pdf-row="otherTable" hidden><div class="qdoc-caption">${esc(c("qdoc_other"))}</div><table class="qdoc-table">${tableHead}<tbody data-pdf="otherRows"></tbody></table></section>
                  <section data-pdf-row="labourTable" hidden><div class="qdoc-caption">${esc(c("qdoc_labour"))}</div><table class="qdoc-table">${tableHead}<tbody data-pdf="labourRows"></tbody></table></section>
                  <p class="qdoc-notes-text" data-pdf-row="mixed" hidden>${esc(t("ws_mixed_currency"))}</p>
                  <div class="qdoc-sum-container"><div class="qdoc-notes" data-pdf-row="notesBlock" hidden><div class="qdoc-notes-label">${esc(c("qdoc_notes"))}</div>
                    <div class="qdoc-notes-text" data-pdf-row="quoteNotes" hidden data-pdf="quoteNotes"></div>
                    <div class="qdoc-notes-payment" data-pdf-row="bankAccount" hidden>${esc(c("qdoc_payment"))} <strong data-pdf="bankAccount"></strong></div>
                  </div><table class="qdoc-sum"><tbody>
                    <tr data-pdf-row="materials"><th scope="row">${esc(c("qdoc_materials"))}</th><td class="qdoc-num" data-pdf="materials"></td></tr>
                    <tr data-pdf-row="other" hidden><th scope="row">${esc(c("qdoc_other"))}</th><td class="qdoc-num" data-pdf="other"></td></tr>
                    <tr data-pdf-row="labour"><th scope="row">${esc(c("qdoc_labour"))}</th><td class="qdoc-num" data-pdf="labour"></td></tr>
                    <tr data-pdf-row="subtotal"><th scope="row">${esc(c("qdoc_sum"))}</th><td class="qdoc-num" data-pdf="subtotal"></td></tr>
                    <tr data-pdf-row="marginRow" hidden><th scope="row" data-pdf="marginLabel"></th><td class="qdoc-num" data-pdf="margin"></td></tr>
                    <tr data-pdf-row="net"><th scope="row">${esc(c("qdoc_net"))}</th><td class="qdoc-num" data-pdf="net"></td></tr>
                    <tr data-pdf-row="vatRow" hidden><th scope="row" data-pdf="vatLabel" data-label="${esc(PDF_COPY[lang].pdfdoc_vat)}"></th><td class="qdoc-num" data-pdf="vat"></td></tr>
                    <tr class="qdoc-total"><th scope="row" data-pdf="totalLabel" data-label="${esc(c("qdoc_total"))}">${esc(c("qdoc_total"))}</th><td class="qdoc-num" data-pdf="total"></td></tr>
                  </tbody></table></div>
                </div></td></tr><tr class="qdoc-sign-row"><td><div class="qdoc-sign"><div class="qdoc-sign-box"><div class="qdoc-sign-line"></div><div class="qdoc-sign-caption">${esc(c("qdoc_contractor"))}</div></div><div class="qdoc-sign-box"><div class="qdoc-sign-line"></div><div class="qdoc-sign-caption">${esc(c("qdoc_customer"))}</div></div></div></td></tr></tbody><tfoot><tr><td class="qdoc-foot-cell"><footer class="qdoc-foot"><div class="qdoc-foot-left"><img src="${asset("logo-mark.svg")}" alt="LiczMat" class="qdoc-foot-mark" width="24" height="24" decoding="async" loading="eager"><div class="qdoc-foot-text"><div class="qdoc-foot-primary">${esc(c("qdoc_footer_primary"))}</div><div class="qdoc-foot-secondary">${esc(c("qdoc_footer_secondary"))}</div></div></div><div class="qdoc-foot-right"><img src="${asset("qr-liczmat.svg")}" alt="${esc(c("qdoc_qr_alt"))}" class="qdoc-qr" width="60" height="60" decoding="async" loading="eager"><div class="qdoc-qr-caption">liczmat.com</div></div></footer></td></tr></tfoot></table>
              </article>
            </div>
          </section>`;
}

/** Public shell around the exact same quote-document builder used by the owner page. */
export function quoteViewMain(lang, t, features, stamp = "", copy) {
  return `<main id="main" tabindex="-1" class="quote-view-main">
    <div class="wrap quote-view-wrap" data-title="${esc(copy.title)}" data-stale-title="${esc(t("quote_link_stale"))}" data-missing="${esc(copy.missing)}" data-config="${esc(copy.config)}" data-downloading="${esc(copy.downloading)}" data-download-failed="${esc(copy.downloadFailed)}">
      <h1 id="quote-view-title">${esc(copy.loading)}</h1>
      <p id="quote-view-state" class="muted" role="status">${esc(copy.loading)}</p>
      <p id="quote-view-home" hidden><a href="${urlHome(lang)}">LiczMat</a></p>
      <div id="quote-view-toolbar" class="quote-view-toolbar" hidden>
        <button type="button" class="btn btn-primary" id="quote-view-download">${esc(copy.download)}</button>
        <button type="button" class="btn btn-ghost" id="quote-view-print">${esc(copy.print)}</button>
        <span id="quote-view-download-error" class="quote-view-download-error" role="status"></span>
      </div>
      ${quotePdfBlock(lang, t, features, stamp)}
    </div>
  </main>`;
}

export function projectsMain(lang, t, aisles = [], features = []) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("nav_app"), path: URL_APP },
    { name: t("wspage_title"), path: urlProjects(lang) },
  ]);

  /* Chapter XXV's wall in front of the money. `costs` became PRO on 2026-09-03, and a
     project is still everybody's to keep: what the wall replaces is the three figures,
     not the project. Everything else on this screen — the rooms, the saved calculations,
     the material list — is `shopping` and the free workspace, and stays where it is. */
  const costGate = proGate(t, "costs", features, lang, { id: "cost-gate", back: "projects" });

  /* The detail. Every figure in it is written by the script; what the build fixes is the
     shape, the headings and the labels, so nothing here has to be translated twice. */
  const detail = `<article id="ws-project" class="ws-project" hidden>
        <p class="ws-project-back"><a href="${urlProjects(lang)}" data-ws-back>${esc(t("proj_back"))}</a></p>

        <div id="ws-project-missing" hidden>
          <h2>${esc(t("proj_none_t"))}</h2>
          <p class="muted">${esc(t("proj_none_d"))}</p>
        </div>

        <div id="ws-project-body" hidden>
          <section class="card ws-project-info">
          <h2 id="ws-project-card-name"></h2>
          <p class="ws-project-hist muted" id="ws-project-hist"></p>

          <!-- Chapter XVII: "Projekt może pokazywać: koszt materiałów, inne koszty, sumę
               projektu." The three are written by assets/workspace.js's wsProjectCosts(),
               which counts every amount in the project exactly once — a calculation and
               the material it put on the shopping list are the same money. -->
          <!-- How many calculations the project holds is not money and is not gated: it
               is the project's own size, and the visitor made every one of them. -->
          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("proj_count_l"))}</span> <b id="ws-project-count"></b></p>
          </div>

          ${costGate}
          <div id="cost-tool" hidden>
            <div class="ws-project-figs">
              <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("proj_cost_mat"))}</span> <b id="ws-project-mat"></b></p>
              <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("proj_cost_other"))}</span> <b id="ws-project-other"></b></p>
              <p class="ws-project-fig ws-project-sum"><span class="eyebrow muted">${esc(t("proj_cost_sum"))}</span> <b id="ws-project-total"></b></p>
            </div>
            <!-- What was agreed against what the work has run to, and the difference. The
                 job page carried these two until 2026-09-21; the project carries the
                 agreed amount now, so it carries the comparison. The difference is shown
                 only when both halves are in one currency — chapter VI forbids
                 subtracting two currencies at a rate, so the page says nothing rather
                 than saying something false. -->
            <div class="ws-project-figs" id="ws-biz-figs" hidden>
              <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("job_value"))}</span> <b id="ws-biz-agreed"></b></p>
              <p class="ws-project-fig ws-project-sum"><span class="eyebrow muted">${esc(t("job_fig_left"))}</span> <b id="ws-biz-left"></b></p>
            </div>
            <p class="muted ws-estimate-mixed" id="ws-project-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>
          </div>

          <div class="ws-project-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-share" hidden>${esc(t("app_share"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-rename">${esc(t("ws_rename"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-archive">${esc(t("proj_archive_do"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-delete">${esc(t("app_delete"))}</button>
          </div>
          <p id="ws-project-share-result" class="field mt-4" hidden>
            <label for="ws-project-share-url">${esc(t("app_share_copied"))}</label>
            <input id="ws-project-share-url" type="url" readonly>
          </p>
          <p id="ws-project-error" class="form-error" role="alert"></p>

          <form id="ws-rename-form" class="inline-form mt-4" hidden>
            <input id="ws-rename-name" type="text" maxlength="120" aria-label="${esc(t("ws_new_project"))}" required>
            <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" data-ws-rename-cancel>${esc(t("action_cancel"))}</button>
          </form>

          <!-- What the job used to carry, on the row that carries it since 2026-09-21.
               The add form above the list sets these when a project is made; a status
               that could never move from "nowe" to "zakończone" afterwards would be a
               field nobody could use, so the same six are editable here.
               Visible labels, not placeholders — a placeholder is the only thing naming
               a box and it leaves the moment the visitor types (audit 2026-09-18). -->
          <form id="ws-biz-form" class="inline-form mt-4">
            <label class="field" for="ws-biz-client"><span class="fld-label">${esc(t("job_client"))}</span>
              <select id="ws-biz-client"></select></label>
            <label class="field field-narrow" for="ws-biz-status"><span class="fld-label">${esc(t("job_status"))}</span>
              <select id="ws-biz-status">${[["new", "job_st_new"], ["active", "job_st_active"], ["done", "job_st_done"], ["cancelled", "job_st_cancelled"]].map(([v, k]) => `<option value="${v}">${esc(t(k))}</option>`).join("")}</select></label>
            <label class="field field-narrow" for="ws-biz-due"><span class="fld-label">${esc(t("job_due"))}</span>
              <input id="ws-biz-due" type="date"></label>
            <label class="field field-narrow" for="ws-biz-value"><span class="fld-label">${esc(t("job_value"))}</span>
              <span class="field-affix"><input id="ws-biz-value" type="text" inputmode="decimal">
                <span id="ws-biz-value-currency" aria-hidden="true"></span></span>
              <small id="ws-biz-value-note" class="muted" hidden></small></label>
            <label class="field field-narrow" for="ws-biz-color"><span class="fld-label">${esc(t("job_color"))}</span>
              <select id="ws-biz-color"><option value="">${esc(t("job_color_none"))}</option>${["lime", "blue", "amber", "red", "violet"].map((v) => `<option value="${v}">${esc(t(`job_color_${v}`))}</option>`).join("")}</select></label>
            <label class="field field-wide" for="ws-biz-note"><span class="fld-label">${esc(t("job_note"))}</span>
              <textarea id="ws-biz-note" maxlength="2000" rows="6"></textarea></label>
            <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
          </form>

          <div id="ws-delete-ask" class="ws-ask mt-4" hidden>
            <p id="ws-delete-q"></p>
            <p class="muted">${esc(t("ws_delete_undo_hint"))}</p>
            <p class="ws-ask-row">
              <button type="button" class="btn btn-primary btn-sm" id="ws-delete-yes">${esc(t("proj_delete_yes"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="ws-delete-no">${esc(t("action_cancel"))}</button>
            </p>
          </div>
          </section>

          <!-- Chapter XVIII: "Pomieszczenia są elementem projektu." It stands above the
               calculations because that is the order chapter XIV lists a project's parts
               in, and because the chapter's own example reads project → room → dimensions.
               The rooms are the project's by a projectId the sync contract does not carry
               and a Firestore merge does not erase — assets/workspace.js says how, and the
               note under the form says what the phone can and cannot do with it. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("ws_rooms"))}</h2>
            </div>
            <p class="muted">${esc(t("proj_room_d"))}</p>
            <ul id="ws-project-rooms" class="data-list"></ul>

            <details class="ws-mat-add" id="ws-room-add">
              <summary>${esc(t("proj_room_add"))}</summary>
              <form id="ws-proj-room-form">
                <p class="ws-mat-grid">
                  <label class="ws-mat-f">
                    <span class="ws-bar-label">${esc(t("ws_room_name"))}</span>
                    <input id="ws-proj-room-name" type="text" maxlength="120" required>
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("fld_length"))}</span>
                    <input id="ws-proj-room-length" type="text" inputmode="decimal" value="5" data-f="lengthM">
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("fld_width"))}</span>
                    <input id="ws-proj-room-width" type="text" inputmode="decimal" value="4" data-f="widthM">
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("fld_height"))}</span>
                    <input id="ws-proj-room-height" type="text" inputmode="decimal" value="2.6" data-f="heightM">
                  </label>
                </p>
                <!-- What the three numbers above come to, while they are typed: the same
                     wsRoomAreas() the calculators' room bar spends. -->
                <p class="ws-mat-sum" data-room-sum aria-live="polite"></p>
                <p class="muted ws-mat-hint">${esc(t("proj_room_phone"))}</p>
                <p><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></p>
              </form>
            </details>
          </section>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("proj_lines_t"))}</h2>
              <span class="section-head-actions">
                ${sectionAddButton("ws-project-calc-toggle", t("proj_calc_add"))}
                <a class="btn btn-ghost btn-sm btn-go" href="${urlQuotes(lang)}" id="ws-project-estimate">${esc(t("quopage_title"))}</a>
              </span>
            </div>
            <div class="section-add-panel" id="ws-project-calc-panel" hidden>
              <ul class="section-add-list" id="ws-project-calcs"></ul>
              <a class="dash-more" id="ws-project-calcs-all" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
            </div>
            <p class="muted">${esc(t("proj_lines_d"))}</p>
            <ul id="ws-project-lines" class="data-list"></ul>
          </section>

          <!-- Chapter XVI. The estimate above says what a calculation cost; this says what
               to carry out of the shop. It is the project's shoppingItems subcollection,
               which the sync contract has carried since its first version and which
               nothing on this site wrote until session 17. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("proj_mat_t"))}</h2>
              <span class="muted ws-mat-tally" id="ws-mat-tally"></span>
            </div>
            <p class="muted">${esc(t("proj_mat_d"))}</p>
            <ul id="ws-project-materials" class="data-list"></ul>

            <!-- Chapter XVI, "dodać własny materiał": a row nothing calculated. Folded
                 away, because the list is normally filled by the arrow from a result and
                 this is the exception — but a real <form>, so Enter submits it. -->
            <details class="ws-mat-add" id="ws-mat-add">
              <summary>${esc(t("proj_mat_add"))}</summary>
              <form id="ws-mat-form">
                <p class="ws-mat-grid">
                  <label class="ws-mat-f">
                    <span class="ws-bar-label">${esc(t("ws_col_name"))}</span>
                    <input id="ws-mat-name" type="text" maxlength="120" required>
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("ws_col_qty"))}</span>
                    <input id="ws-mat-qty" type="text" inputmode="decimal" value="1" data-f="quantity">
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("ws_col_unit"))}</span>
                    <input id="ws-mat-unit" type="text" maxlength="24" list="ws-mat-units">
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("proj_mat_price"))}</span>
                    <span class="field-affix"><input id="ws-mat-price" type="text" inputmode="decimal" data-f="priceMajor">
                      <span id="ws-mat-price-currency" aria-hidden="true"></span></span>
                  </label>
                  <label class="ws-mat-f">
                    <span class="ws-bar-label">${esc(t("proj_mat_aisle"))}</span>
                    <select id="ws-mat-cat">${
                      aisles.map((c) => `<option value="${esc(c)}">${esc(t(`cat_${c}`))}</option>`).join("")
                    }</select>
                  </label>
                </p>
                <!-- What the two numbers above come to, in the currency in force, printed
                     while they are typed. Chapter XVII: "7 × 35 PLN = 245 PLN". -->
                <p class="ws-mat-sum" data-mat-sum aria-live="polite"></p>
                <label class="ws-mat-f">
                  <span class="ws-bar-label">${esc(t("proj_mat_note"))}</span>
                  <input id="ws-mat-note" type="text" maxlength="500"
                    placeholder="${esc(t("proj_mat_note_ph"))}">
                </label>
                <p><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></p>
              </form>
            </details>

            <!-- The units this site already writes onto a saved material, so a hand-typed
                 row uses the same words as a calculated one instead of inventing a second
                 vocabulary. A suggestion list, never a restriction: the field stays free
                 text, because chapter XVI asks for the unit to be changeable. -->
            <datalist id="ws-mat-units">${
              [t("mu_pkg"), t("mu_pc"), "m²", "m", "kg", "l"]
                .map((u) => `<option value="${esc(u)}"></option>`).join("")
            }</datalist>
          </section>

          <!-- Chapter XVII's second figure: "inne koszty". Labour, delivery, a skip — the
               part of a project no calculator produces. They are hand-typed estimate
               lines filed into the project that is open instead of the active one. -->
          <!-- "Inne koszty" is nothing but money, so the whole section belongs to the
               costs feature. It carries no wall of its own: the one above says why the
               figures are not there, and a page that draws the same wall twice is a page
               shouting. assets/paywall.js hides this from the same one decision. -->
          <section class="dash-sec" id="cost-other-tool" hidden>
            <div class="dash-head">
              <h2>${esc(t("proj_cost_other"))}</h2>
            </div>
            <p class="muted">${esc(t("proj_other_d"))}</p>
            <ul id="ws-project-other-list" class="data-list"></ul>

            <details class="ws-mat-add" id="ws-other-add">
              <summary>${esc(t("proj_other_add"))}</summary>
              <form id="ws-other-form">
                <p class="ws-mat-grid">
                  <label class="ws-mat-f">
                    <span class="ws-bar-label">${esc(t("ws_col_name"))}</span>
                    <input id="ws-other-name" type="text" maxlength="120" required>
                  </label>
                  <label class="ws-mat-f ws-mat-f-sm">
                    <span class="ws-bar-label">${esc(t("ws_col_cost"))}</span>
                    <span class="field-affix"><input id="ws-other-cost" type="text" inputmode="decimal">
                      <span id="ws-other-cost-currency" aria-hidden="true"></span></span>
                  </label>
                </p>
                <p><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></p>
              </form>
            </details>
          </section>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("crm_quotes_t"))}</h2>
              <button type="button" class="btn btn-primary btn-sm" id="ws-project-new-quote" hidden>${esc(t("proj_new_quote"))}</button>
            </div>
            <ul id="ws-chain-quotes" class="data-list"></ul>
          </section>
          <section class="dash-sec">
            <div class="dash-head"><h2>${esc(t("crm_hist_t"))}</h2></div>
            <p class="muted">${esc(t("crm_hist_note"))}</p>
            <ul id="ws-chain-history" class="data-list"></ul>
          </section>

          <!-- The PDF export left the project on 2026-10-06 (owner): a quote is made and
               printed on /wyceny/, which the "Wyceny" button in Kalkulacje leads to. -->
        </div>
      </article>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1 id="ws-title">${esc(t("wspage_title"))}</h1>
      <p class="lead" id="ws-lead">${esc(t("wspage_lead"))}</p>
    </div>
  </section>

  <section class="block alt" id="ws-page">
    <div class="wrap narrow">
      ${detail}

      <div id="ws-index">
        <p class="ws-undo" id="ws-undo" role="status" hidden>
          <span id="ws-undo-text"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="ws-undo-go">${esc(t("proj_undo"))}</button>
        </p>

        <!-- AUDYT3 C6: the page H1 already names this list. -->
        <p class="muted">${esc(t("wspage_projects_d"))}</p>
        <!-- Visible labels, not placeholders: a placeholder is the only thing naming
             these boxes and it leaves the moment the visitor types (audit 2026-09-18). -->
        <div class="card">
          <h3 data-i18n="app_new_project">${esc(t("app_new_project"))}</h3>
          <form id="ws-project-form" class="inline-form ws-project-grid">
          <label class="field" for="ws-project-name"><span class="fld-label">${esc(t("ws_new_project"))}</span>
            <input id="ws-project-name" type="text" maxlength="120" required></label>
          <label class="field" for="ws-project-client"><span class="fld-label">${esc(t("job_client"))}</span>
            <select id="ws-project-client"></select></label>
          <label class="field field-narrow" for="ws-project-status"><span class="fld-label">${esc(t("job_status"))}</span>
            <select id="ws-project-status">${[["new", "job_st_new"], ["active", "job_st_active"], ["done", "job_st_done"], ["cancelled", "job_st_cancelled"]].map(([v, k]) => `<option value="${v}">${esc(t(k))}</option>`).join("")}</select></label>
          <label class="field field-narrow" for="ws-project-due"><span class="fld-label">${esc(t("job_due"))}</span>
            <input id="ws-project-due" type="date"></label>
          <label class="field field-narrow" for="ws-project-value"><span class="fld-label">${esc(t("job_value"))}</span>
            <span class="field-affix"><input id="ws-project-value" type="text" inputmode="decimal">
              <span id="ws-project-value-currency" aria-hidden="true"></span></span></label>
          <label class="field field-wide" for="ws-project-note"><span class="fld-label">${esc(t("job_note"))}</span>
            <textarea id="ws-project-note" maxlength="2000" rows="6"></textarea></label>
          <label class="field field-narrow" for="ws-project-color"><span class="fld-label">${esc(t("job_color"))}</span>
            <select id="ws-project-color"><option value="">${esc(t("job_color_none"))}</option>${["lime", "blue", "amber", "red", "violet"].map((v) => `<option value="${v}">${esc(t(`job_color_${v}`))}</option>`).join("")}</select></label>
            <div class="form-foot"><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></div>
          </form>
        </div>
        <ul id="ws-project-list" class="data-list"></ul>

        <details id="ws-archive" class="ws-archive" hidden>
          <summary id="ws-archive-summary">${esc(t("proj_archive_t"))}</summary>
          <p class="muted">${esc(t("proj_archive_d"))}</p>
          <ul id="ws-archive-list" class="data-list"></ul>
        </details>

        <h2 class="mt-8" id="ws-rooms">${esc(t("ws_rooms"))}</h2>
        <p class="muted">${esc(t("wspage_rooms_d"))}</p>
        <!-- Chapter XVIII: a room is an element of a project, so the script draws one card
             per live project and puts its add form inside it. "No project" stays a real
             group, because a room measured before there is a project is still a room. -->
        <div id="ws-room-list" class="ws-room-cards"></div>
      </div>

      <!-- AUDYT3 C6: the account rail replaces route buttons and repeated sync copy. -->
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main: accountPageMain(main, t, lang, "projects"), ld: crumbs.ld };
}

/* ------------------------------------------------------------------ LiczMat Pro */

/**
 * /liczmat-pro/ — the public page for LiczMat Pro. Session 29, and the whole of it:
 * "Krótka, konkretna strona prezentująca Pro. Bez marketingowego przesytu."
 *
 * It is the one Pro address that is not behind the paywall, and it cannot be: a
 * description of what somebody would be paying for, put behind the thing they have not
 * paid for, is a page nobody would ever read. So the route is GUEST and indexable while
 * the five modules it describes stay locked — chapter XXVI asks for Pro to be described
 * in public, and there is nothing private on this page: no rows, no figures, no account.
 *
 * Everything on it is already written down somewhere else, and it stays that way:
 *
 *   the five modules   `LM_FEATURES` in assets/plan.js, through proModules() — the same
 *                      list the wall and the Pro tab of /app/ show, so the product cannot
 *                      be described here as four modules or six.
 *   the price          proPlansBlock() from src/pro.mjs, the same block the wall carries.
 *                      The amounts are not in the markup: assets/pay.js has them per
 *                      currency and assets/paywall.js fills them in at paint time.
 *   the way in         /app/ — the only page that knows the uid a payment attaches to.
 *
 * What is authored here is the part that is this page's own job: what Pro does *not* do,
 * what stays free, and the three steps between a visitor and a plan. Chapter XXV's
 * "przejście Free → Pro" written out once, in full, instead of one rung at a time.
 *
 * The page loads assets/pay.js and assets/paywall.js and nothing else new. It has no
 * gate, so it does not load assets/plan.js: the only thing it asks the session is whether
 * this visitor already pays for Pro, and lmReadLevel() in assets/account.js — which every
 * page carries — answers that. Somebody on Pro is shown their plan instead of a price;
 * quoting a price to a customer who already pays it reads as a threat.
 *
 * @param {object[]} features LM_FEATURES from assets/plan.js
 * @param {object} prices  what each plan costs in this language's default currency,
 *   already formatted — scripts/build.mjs reads the amounts out of assets/pay.js. The
 *   price is in the markup so that a crawler and a visitor with no script both see it;
 *   assets/paywall.js replaces it with the visitor's own currency when there is one.
 */
export function proPageMain(lang, t, features, prices, copy, samples, counts) {
  const c = (key) => esc(String(copy[key]).replaceAll("{n}", String(counts.calcs)).replaceAll("{materials}", String(counts.materials)));
  const list = (keys) => `<ul class="app-list">${keys.map((key) => `<li>${c(key)}</li>`).join("")}</ul>`;
  const facts = [1, 2, 3, 4].map((n) => `<li><span aria-hidden="true">✓</span><div><b>${c(`f${n}_t`)}</b><small>${c(`f${n}_d`)}</small></div></li>`).join("");
  const steps = [1, 2, 3, 4].map((n) => `<li><span class="app-step-n">0${n}</span><b>${c(`s${n}_t`)}</b><span>${c(`s${n}_d`)}</span></li>`).join("");
  const groups = [
    ["g_count", [["r_calcs", 1, 1, 1], ["r_materials", 1, 1, 1], ["r_converter", 1, 1, 1]]],
    ["g_projects", [["r_projects", 0, 1, 1], ["r_saved", 0, 1, 1], ["r_shopping", 0, 1, 1], ["r_sync", 0, 1, 1]]],
    ["g_money", [["r_prices", 0, 0, 1], ["r_waste", 0, 0, 1], ["r_quotes", 0, 0, 1], ["r_vat", 0, 0, 1]]],
    ["g_work", [["r_clients", 0, 0, 1], ["r_calendar", 0, 0, 1], ["r_phonecal", 0, 0, 1], ["r_history", 0, 0, 1]]],
    ["g_docs", [["r_pdf", 0, 0, 1], ["r_link", 0, 0, 1]]],
  ];
  const cell = (yes) => `<td class="${yes ? "pro-check" : "pro-no"}"><span aria-hidden="true">${yes ? "✓" : "×"}</span><span class="sr-only">${c(yes ? "t_yes" : "t_no")}</span></td>`;
  const rows = groups.map(([group, items]) => `<tr class="pro-group"><th colspan="4" scope="colgroup">${c(group)}</th></tr>${items.map(([key, ...values]) => `<tr><th scope="row">${c(key)}</th>${values.map(cell).join("")}</tr>`).join("")}`).join("");
  const price = (id, per) => `<p class="pro-price" data-pw-plan="${id}"${prices[id] ? "" : " hidden"}><b data-pw-price>${prices[id] ? esc(prices[id]) : ""}</b> <span class="muted">${esc(t(per))}</span></p>`;
  const plan = (title, keys, top, button, cls = "") => `<article class="pro-plan${cls ? ` ${cls}` : ""}"><h3>${title}</h3>${top}${list(keys)}${button}</article>`;
  const app = URL_APP;
  const signup = `${app}?mode=signup`;
  const date = new Intl.DateTimeFormat(MONEY_LOCALE[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date("2026-10-14T00:00:00Z"));
  const main = `<main id="main" tabindex="-1">
  <section class="block app-hero-b pro-stage"><div class="wrap"><div class="app-stage"><div class="app-stage-copy"><h1>${esc(t("pro_t"))}</h1><p class="lead">${c("lead")}</p><p class="pro-actions"><a class="btn btn-buy" href="#cennik" data-pro-buy>${c("buy")}</a><a class="btn btn-ghost btn-go" href="${signup}" rel="nofollow" data-pro-trial>${c("trial")}</a></p><ul class="pro-facts">${facts}</ul></div><div class="app-stage-media" aria-hidden="true" inert><div class="pro-sheet">${samples.quote}</div><p class="app-float pro-float-client"><span class="app-float-k">${c("k_client")}</span><b>${c("x_client")}</b><span>${c("x_city")} · ${c("x_phone")}</span></p><p class="app-float pro-float-date"><span class="app-float-k">${c("k_date")}</span><b>${esc(date)}</b><span>${c("x_project")}</span></p></div></div></div></section>
  <section class="block app-steps-block"><div class="wrap"><ol class="app-steps">${steps}</ol></div></section>
  <section class="block"><div class="wrap"><div class="app-pane pro-pane"><div class="app-work" aria-hidden="true" inert>${samples.editor}</div><div class="pro-pane-copy"><h2>${c("q_h")}</h2><p>${c("q_d")}</p>${list(["q_1", "q_2", "q_3", "q_4"])}</div></div></div></section>
  <section class="block"><div class="wrap"><div class="app-pane pro-pane pro-pane-reverse"><div class="pro-pane-copy"><h2>${c("c_h")}</h2><p>${c("c_d")}</p>${list(["c_1", "c_2", "c_3", "c_4"])}</div><div class="app-work pro-calendar" aria-hidden="true" inert>${samples.calendar}</div></div></div></section>
  <section class="block alt" id="cennik" aria-labelledby="pro-price-h"><div class="wrap"><div class="pro-pricing-head"><h2 id="pro-price-h">${c("p_h")}</h2><div class="pro-period" hidden><button type="button" data-pro-set="monthly" aria-pressed="true">${c("p_month")}</button><button type="button" data-pro-set="yearly" aria-pressed="false">${c("p_year")}</button></div></div><div class="pro-plans">
  ${plan(c("p_guest"), ["p_guest_1", "p_guest_2", "p_guest_3"], `<p class="pro-price"><b data-pro-zero>${esc(prices.zero)}</b></p><p class="muted">${c("p_nofee")}</p>`, `<a class="btn btn-ghost btn-go" href="${urlCalcIndex(lang)}">${c("p_open_calc")}</a>`)}
  ${plan(c("p_free"), ["p_free_1", "p_free_2", "p_free_3", "p_free_4", "p_free_5"], `<p class="pro-price"><b data-pro-zero>${esc(prices.zero)}</b></p><p class="muted">${c("p_nofee")}</p>`, `<a class="btn btn-ghost btn-go" href="${signup}" rel="nofollow">${c("p_signup")}</a>`)}
  <article class="pro-plan pro-plan-pro"><h3>${esc(t("pro_t"))}</h3><div id="pro-pay" class="pro-pay" data-pro-period="monthly">${price("monthly", "pay_monthly_per")}${price("yearly", "pay_yearly_per")}${list(["p_pro_1", "p_pro_2", "p_pro_3", "p_pro_4", "p_pro_5", "p_pro_6", "p_pro_7"])}<p data-pw-buy hidden><a class="btn btn-buy btn-go" data-pro-plan="monthly" href="${app}?buy=monthly" rel="nofollow">${c("buy")}</a><a class="btn btn-buy btn-go" data-pro-plan="yearly" href="${app}?buy=yearly" rel="nofollow">${c("buy")}</a></p><a class="pro-trial" href="${signup}" rel="nofollow" data-pro-trial>${c("p_trial_line")}</a><p class="muted" data-pw-soon>${esc(t("pay_soon"))}</p></div><p id="pro-yours" hidden>${c("p_yours")} <a href="${app}">${c("p_account")}</a></p></article>
  </div><p class="pro-payment">${c("p_pay_line")}</p></div></section>
  <section class="block" aria-labelledby="pro-table-h"><div class="wrap"><div class="section-head"><h2 id="pro-table-h">${c("t_h")}</h2></div><div class="pro-table-shell"><table class="pro-table"><thead><tr><th scope="col">${c("t_feature")}</th><th scope="col">${c("p_guest")}</th><th scope="col">${c("p_free")}</th><th scope="col">${esc(t("pro_t"))}</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>
  <section class="block"><div class="wrap"><div class="app-install pro-before"><h2>${c("b_h")}</h2>${list(["b_1", "b_2", "b_3", "b_4"])}<a class="btn btn-buy" href="#cennik" data-pro-buy>${c("buy")}</a></div></div></section>
</main>`;
  return { main, ld: null };
}

export function companyMain(lang, t, features) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("nav_app"), path: URL_APP },
    { name: t("companypage_title"), path: urlCompany(lang) },
  ]);
  const gate = proGate(t, "company", features, lang, { id: "company-gate" });
  const fields = [
    ["name", "company_name", "text", "120", "organization"],
    ["country", "company_country", "select", "2", "country"],
    ["nip", "company_nip", "text", "20", "off"],
    ["postalCode", "company_postal", "text", "12", "postal-code"],
    ["city", "company_city", "text", "120", "address-level2"],
    ["street", "company_street", "text", "200", "street-address"],
    ["phone", "company_phone", "tel", "200", "tel"],
    ["email", "company_email", "email", "200", "email"],
    ["www", "company_www", "text", "200", "url"],
    ["bankAccount", "company_bank", "text", "40", "off"],
  ];
  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap narrow">
      ${crumbs.nav}
      <h1>${esc(t("companypage_title"))}</h1>
      <p class="lead">${esc(t("companypage_lead"))}</p>
    </div>
  </section>

  ${gate}

  <section class="block" id="company-tool">
    <div class="wrap narrow">
      <ul id="company-list" class="data-list"></ul>
      <p id="company-empty" class="muted">${esc(t("company_empty"))}</p>
      <div id="company-undo" class="ws-undo" hidden></div>

      <form id="company-form" class="card mt-4">
        <h2 id="company-form-title">${esc(t("company_add"))}</h2>
        <div class="ws-mat-grid">
          ${fields.map(([id, key, type, max, autocomplete]) => `<label class="ws-mat-f">
            <span class="ws-bar-label"${id === "nip" ? ` id="company-nip-label"` : ""}>${esc(t(key))}${id === "name" ? "*" : ""}</span>
            ${type === "select"
    ? `<select id="company-${id}" name="${id}" autocomplete="${autocomplete}"></select>`
    : `<input id="company-${id}" name="${id}" type="${type}" maxlength="${max}" autocomplete="${autocomplete}"${id === "nip" ? ` aria-labelledby="company-nip-label"` : ""}${id === "phone" ? ` inputmode="tel" aria-describedby="company-phone-error"` : ""}${id === "postalCode" ? ` aria-describedby="company-postal-error"` : ""}${id === "city" ? ` list="company-city-list"` : ""}${id === "name" ? " required" : ""}>`}${id === "phone" ? `
            <span id="company-phone-error" class="field-error" role="alert" hidden>${esc(t("phone_invalid"))}</span>` : ""}${id === "postalCode" ? `
            <span id="company-postal-error" class="field-error" role="alert" hidden>${esc(t("postal_invalid"))}</span>` : ""}
          </label>`).join("\n")}
          <datalist id="company-city-list"></datalist>
        </div>
        <p class="muted field-note">${esc(t("postal_source"))}</p>
        ${/* The browser's own file control prints "Choose File / No file chosen" in the
             browser's language, not the page's, and cannot be styled: the label is the button. */ ""}
        <div class="ws-mat-f company-logo-field">
          <span class="ws-bar-label" id="company-logo-label">${esc(t("company_logo"))}</span>
          <label class="btn btn-ghost btn-sm company-logo-pick" for="company-logo-file">${esc(t("company_logo_pick"))}</label>
          <input id="company-logo-file" class="company-logo-input" type="file" aria-labelledby="company-logo-label"
            accept="image/png,image/jpeg,image/webp,image/svg+xml">
        </div>
        <div id="company-logo-preview" class="company-logo-preview" hidden></div>
        <p><button id="company-logo-remove" type="button" class="btn btn-ghost btn-sm" hidden>${esc(t("company_logo_remove"))}</button></p>
        <p id="company-logo-error" class="field-error" role="alert" hidden></p>
        <div class="form-foot">
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
          <button id="company-cancel" type="button" class="btn btn-ghost btn-sm" hidden>${esc(t("action_cancel"))}</button>
        </div>
      </form>
    </div>
  </section>
</main>`;
  return { main: accountPageMain(main, t, lang, "company"), ld: crumbs.ld };
}

/**
 * /klienci/ — the client list of LiczMat Pro. Chapter XX, session 22.
 *
 * One page, two screens, exactly like /projekty/: the index, and one client at
 * `?id=<clientId>` — the `client` route in src/ia.mjs is a `view` because a client id is
 * made in this browser and can never be a directory on GitHub Pages.
 *
 * Three things the build fixes and the script never rewrites: the Pro notice of chapter
 * XXV, the honest note about where the rows live, and the headings. Everything with a
 * figure in it is written by assets/crm-ui.js from the store, so nothing on this page is
 * translated twice.
 */
export function clientsMain(lang, t, features) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("nav_app"), path: URL_APP },
    { name: t("clipage_title"), path: urlClients(lang) },
  ]);

  /* Chapter XXV's paywall — session 27. One implementation for all five Pro modules
     (proGate() in src/pro.mjs), so that four pages cannot describe the same wall four
     ways. It is in the markup from the first paint and `hidden`; assets/paywall.js
     unhides it when lmPaywall() says this visitor's plan does not reach the module. */
  const gate = proGate(t, "clients", features, lang, { id: "crm-gate" });

  const detail = `<article id="crm-client" class="ws-project" hidden>
        <p class="ws-project-back"><a href="${urlClients(lang)}" data-crm-back>${esc(t("cli_back"))}</a></p>

        <div id="crm-client-missing" hidden>
          <h2>${esc(t("cli_none_t"))}</h2>
          <p class="muted">${esc(t("cli_none_d"))}</p>
        </div>

        <div id="crm-client-body" hidden>
          <!-- Chapter XX's "dane kontaktowe": a phone that dials and an address that can
               be copied. Written by the script, because a client with no e-mail must not
               leave an empty line behind. -->
          <p class="crm-contact" id="crm-contact"></p>

          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cli_fig_projects"))}</span> <b id="crm-fig-projects"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cli_fig_last"))}</span> <b id="crm-fig-last"></b></p>
            <p class="ws-project-fig ws-project-sum"><span class="eyebrow muted">${esc(t("cli_fig_total"))}</span> <b id="crm-fig-total"></b></p>
          </div>
          <p class="muted ws-estimate-mixed" id="crm-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>

          <div class="ws-project-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="crm-client-edit">${esc(t("cli_edit"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="crm-client-archive">${esc(t("cli_archive_do"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="crm-client-delete">${esc(t("app_delete"))}</button>
          </div>

          <!-- The whole record in one form, on the page rather than in a browser dialog:
               prompt() cannot be translated once it is open and covers the row it is
               about on a phone (chapter XXVIII). -->
          <form id="crm-edit-form" class="mt-4" hidden>
            <p class="ws-mat-grid">
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("cli_name"))}</span>
                <input id="crm-edit-name" type="text" maxlength="120" required>
              </label>
              <label class="ws-mat-f ws-mat-f-sm">
                <span class="ws-bar-label">${esc(t("cli_phone"))}</span>
                <input id="crm-edit-phone" type="tel" inputmode="tel" maxlength="200" autocomplete="tel" aria-describedby="crm-edit-phone-error">
                <span id="crm-edit-phone-error" class="field-error" role="alert" hidden>${esc(t("phone_invalid"))}</span>
              </label>
              <label class="ws-mat-f ws-mat-f-sm">
                <span class="ws-bar-label">${esc(t("cli_email"))}</span>
                <input id="crm-edit-email" type="email" maxlength="200" autocomplete="email">
              </label>
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("cli_country"))}</span>
                <select id="crm-edit-country" autocomplete="country"></select>
              </label>
              <label class="ws-mat-f ws-mat-f-postal">
                <span class="ws-bar-label">${esc(t("cli_postal_code"))}</span>
                <input id="crm-edit-postal-code" type="text" maxlength="12" autocomplete="postal-code" aria-describedby="crm-edit-postal-error">
                <span id="crm-edit-postal-error" class="field-error" role="alert" hidden>${esc(t("postal_invalid"))}</span>
              </label>
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("cli_city"))}</span>
                <input id="crm-edit-city" type="text" maxlength="120" autocomplete="address-level2" list="crm-edit-city-list">
                <datalist id="crm-edit-city-list"></datalist>
              </label>
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("cli_street"))}</span>
                <input id="crm-edit-street" type="text" maxlength="200" autocomplete="street-address">
              </label>
              <label class="ws-mat-f" id="crm-edit-address-field" hidden>
                <span class="ws-bar-label">${esc(t("cli_address"))}</span>
                <input id="crm-edit-address" type="text" maxlength="200">
              </label>
            </p>
            <p class="ws-mat-f">
              <label class="ws-bar-label" for="crm-edit-note">${esc(t("cli_note"))}</label>
              <textarea id="crm-edit-note" rows="5" maxlength="2000"></textarea>
            </p>
            <p>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" data-crm-edit-cancel>${esc(t("action_cancel"))}</button>
            </p>
          </form>

          <div id="crm-delete-ask" class="ws-ask mt-4" hidden>
            <p id="crm-delete-q"></p>
            <p class="ws-ask-row">
              <button type="button" class="btn btn-primary btn-sm" id="crm-delete-yes">${esc(t("cli_delete_yes"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="crm-delete-no">${esc(t("action_cancel"))}</button>
            </p>
          </div>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("cli_note_t"))}</h2>
            </div>
            <p id="crm-note" class="crm-note"></p>
          </section>

          <!-- Chapter XX: "Klient może posiadać … projekty", and chapter XXIV's path
               begins with them. The link is stored on the client (assets/crm.js says
               why); the project itself is the same row /projekty/ shows and is never
               touched from here. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("cli_projects_t"))}</h2>
              <span class="section-head-actions">
                ${sectionAddButton("crm-project-new-toggle", t("cli_project_new"))}
                <a class="dash-more" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
              </span>
            </div>
            <p class="muted">${esc(t("cli_projects_d"))}</p>
            <ul id="crm-client-projects" class="data-list"></ul>
            <form id="crm-project-new-form" class="inline-form section-add-panel" hidden>
              <label class="field" for="crm-project-new-name"><span class="fld-label">${esc(t("ws_new_project"))}</span>
                <input id="crm-project-new-name" type="text" maxlength="120" required></label>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
            </form>
            <p class="section-option-label">${esc(t("cli_project_assign"))}</p>
            <form id="crm-project-form" class="inline-form">
              <select id="crm-project-pick" aria-label="${esc(t("cli_project_add"))}"></select>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("cli_project_add"))}</button>
            </form>
          </section>

          <!-- Chapter XX: "Klient może posiadać … zlecenia", and chapter XXIV's path runs
               through them. The job is written on /zlecenia/ — this is the client's end of
               the same link, read-only, so one screen owns the writes. -->
          <!-- Chapter XX: "Klient może posiadać … wyceny", and the fourth step of chapter
               XXIV's path seen from its first. Nothing about the link is stored on the
               client: a quote keeps its project, the client keeps their projects, and
               crmClientQuotes() is where the two ends meet. Read-only, like the jobs. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("crm_quotes_t"))}</h2>
              <a class="dash-more" href="${urlQuotes(lang)}">${esc(t("crm_quotes_all"))}</a>
            </div>
            <p class="muted">${esc(t("crm_quotes_d"))}</p>
            <ul id="crm-client-quotes" class="data-list"></ul>
          </section>

          <!-- Chapter XXIV's last step, and chapter XX's "historia": the client, their
               jobs, the quotes priced from their projects and every calculation and cost
               saved into one — each read with the date on the document itself. Nothing is
               logged separately, and crm_hist_note says out loud what that leaves out. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("crm_hist_t"))}</h2>
            </div>
            <p class="muted">${esc(t("crm_hist_d"))}</p>
            <ul id="crm-history" class="data-list"></ul>
            <p class="muted field-note">${esc(t("crm_hist_note"))}</p>
          </section>
        </div>
      </article>`;

  const index = `<div id="crm-index">
        <p class="ws-undo" id="crm-undo" role="status" hidden>
          <span id="crm-undo-text"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="crm-undo-go">${esc(t("cli_undo"))}</button>
        </p>

        <!-- AUDYT3 C6: the page H1 already names this list. -->
        <p class="muted">${esc(t("cli_list_d"))}</p>
        <div class="card">
          <h3 data-i18n="app_clients_new">${esc(t("app_clients_new"))}</h3>
          <form id="crm-client-form" class="inline-form crm-client-grid">
          <label class="field" for="crm-client-name"><span class="fld-label">${esc(t("cli_new"))}</span>
            <input id="crm-client-name" type="text" maxlength="120" required></label>
          <label class="field" for="crm-client-phone"><span class="fld-label">${esc(t("cli_phone"))}</span>
            <input id="crm-client-phone" type="tel" inputmode="tel" maxlength="200" autocomplete="off" aria-describedby="crm-client-phone-error">
            <span id="crm-client-phone-error" class="field-error" role="alert" hidden>${esc(t("phone_invalid"))}</span></label>
          <label class="field" for="crm-client-email"><span class="fld-label">${esc(t("cli_email"))}</span>
            <input id="crm-client-email" type="email" maxlength="200" autocomplete="off"></label>
          <label class="field" for="crm-client-country"><span class="fld-label">${esc(t("cli_country"))}</span>
            <select id="crm-client-country" autocomplete="country"></select></label>
          <label class="field field-narrow" for="crm-client-postal-code"><span class="fld-label">${esc(t("cli_postal_code"))}</span>
            <input id="crm-client-postal-code" type="text" maxlength="12" autocomplete="postal-code" aria-describedby="crm-client-postal-error">
            <span id="crm-client-postal-error" class="field-error" role="alert" hidden>${esc(t("postal_invalid"))}</span></label>
          <label class="field" for="crm-client-city"><span class="fld-label">${esc(t("cli_city"))}</span>
            <input id="crm-client-city" type="text" maxlength="120" autocomplete="address-level2" list="crm-client-city-list">
            <datalist id="crm-client-city-list"></datalist></label>
          <label class="field" for="crm-client-street"><span class="fld-label">${esc(t("cli_street"))}</span>
            <input id="crm-client-street" type="text" maxlength="200" autocomplete="street-address"></label>
            <div class="form-foot"><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></div>
          </form>
          <p class="muted field-note">${esc(t("postal_source"))}</p>
        </div>
        <ul id="crm-client-list" class="data-list"></ul>

        <details id="crm-archive" class="ws-archive" hidden>
          <summary id="crm-archive-summary">${esc(t("cli_archive_t"))}</summary>
          <p class="muted">${esc(t("cli_archive_d"))}</p>
          <ul id="crm-archive-list" class="data-list"></ul>
        </details>
      </div>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1 id="crm-title">${esc(t("clipage_title"))}</h1>
      <p class="lead" id="crm-lead">${esc(t("clipage_lead"))}</p>
    </div>
  </section>

  <section class="block alt" id="crm-page">
    <div class="wrap narrow">
      <!-- Chapter XXV's strip, above the module for somebody who may use it: which plan
           opened it. assets/paywall.js hides the whole strip when the wall is up,
           because the wall says all of it and twice is worse than once. -->
      ${gate}

      <div id="crm-tool">
        ${detail}
        ${index}
      </div>

      <!-- AUDYT3 C6: the account rail is the route navigation. -->
      <p class="muted src-note">${esc(t("cli_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main: accountPageMain(main, t, lang, "clients"), ld: crumbs.ld };
}

/**
 * /wyceny/ — the quotes of LiczMat Pro. Session 24, chapter XXII.
 *
 * Two screens in one file, the same shape as /klienci/ and /projekty/: the index, and one
 * quote at ?id=<quoteId>. Only the frame is written here — every figure on it is computed
 * in the browser, and three of the five come out of the project rather than out of the
 * quote (crmQuoteTotals() in assets/crm.js says why).
 */
export function quotesMain(lang, t, features, stamp = "") {
  const quoteViewCopy = QUOTE_VIEW_COPY[lang];
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("nav_app"), path: URL_APP },
    { name: t("quopage_title"), path: urlQuotes(lang) },
  ]);

  // Chapter XXV's paywall, from the same builder as the other modules.
  const gate = proGate(t, "quotes", features, lang, { id: "quo-gate" });

  // Materials and labour deliberately share one field layout; their stores share the
  // same writer too, so changing one line type cannot leave the other with older rules.
  // One form for both lists; only the two words that differ between a material and a
  // piece of work are chosen by the list ("Nazwa"/"Praca", "Cena jedn."/"Stawka").
  const quoteUnits = t("quo_units").split("|").filter(Boolean);
  const quoteOwnLink = t("quo_mat_own_link").split("{link}");
  const quoteLineForm = (kind, title) => `<form id="quo-${kind}-form" data-quote-list="${kind}">
              <p class="ws-mat-grid">
                <label class="ws-mat-f"><span class="ws-bar-label">${esc(t(kind === "materials" ? "quo_mat_line_name" : "quo_labour_name"))}</span><input id="quo-${kind}-name" type="text" maxlength="120" required></label>
                <label class="ws-mat-f ws-mat-f-sm"><span class="ws-bar-label">${esc(t("quo_labour_qty"))}</span><input id="quo-${kind}-qty" type="text" inputmode="decimal"></label>
                <label class="ws-mat-f ws-mat-f-sm"><span class="ws-bar-label">${esc(t("quo_labour_unit"))}</span><select id="quo-${kind}-unit">${quoteUnits.map((unit, index) => `<option${index === (kind === "labour" ? 1 : 0) ? " selected" : ""}>${esc(unit)}</option>`).join("")}</select></label>
                <label class="ws-mat-f ws-mat-f-sm"><span class="ws-bar-label" id="quo-${kind}-price-label">${esc(t(kind === "materials" ? "quo_mat_line_price" : "quo_labour_price"))}</span><input id="quo-${kind}-price" type="text" inputmode="decimal"></label>
              </p>
              ${kind === "materials" ? `<p><label><input type="checkbox" id="quo-materials-save-own"> ${esc(t("quo_mat_save_own"))}</label></p>` : ""}
              <p><button type="submit" class="btn btn-primary btn-sm">${esc(title)}</button><span class="muted" id="quo-${kind}-run"></span></p>
            </form>`;

  const detail = `<article id="quo-detail" class="ws-project" hidden>
        <p class="ws-project-back"><a href="${urlQuotes(lang)}" data-quo-back>${esc(t("quo_back"))}</a></p>

        <div id="quo-missing" hidden>
          <h2>${esc(t("quo_none_t"))}</h2>
          <p class="muted">${esc(t("quo_none_d"))}</p>
        </div>

        <div id="quo-body" hidden>
          <section class="dash-sec">
            <div class="dash-head"><h2 id="quo-issuer-h">${esc(t("quo_issuer"))}</h2></div>
            <p class="ws-mat-f quo-issuer-field"><select id="quo-company" aria-labelledby="quo-issuer-h"></select></p>
            <p class="muted" id="quo-company-preview"></p>
            <p class="muted" id="quo-company-logo-hint" hidden>${esc(t("quo_company_logo_hint"))} <a href="${urlCompany(lang)}">${esc(t("quo_add_logo"))}</a></p>
            <p class="muted" id="quo-company-empty" hidden><a href="${urlCompany(lang)}">${esc(t("quo_company_empty"))}</a></p>
          </section>
          <section class="dash-sec">
            <div class="dash-head"><h2>${esc(t("quo_who_t"))}</h2></div>
            <p class="muted">${esc(t("crm_chain_d"))}</p>
            <div class="ws-mat-grid">
              <div id="quo-client-form" class="ws-mat-f">
                <label class="ws-bar-label" for="quo-client-pick">${esc(t("crm_node_client"))}</label>
                <select id="quo-client-pick"></select>
              </div>
              <div id="quo-project-form" class="ws-mat-f">
                <label class="ws-bar-label" for="quo-project-pick">${esc(t("crm_node_project"))}</label>
                <select id="quo-project-pick"></select>
              </div>
            </div>
            <div class="quo-new-grid">
              <details>
                <summary>${esc(t("app_clients_new"))}</summary>
                <form id="quo-client-new-form" class="ws-mat-f">
                  <label class="ws-bar-label" for="quo-client-new">${esc(t("cli_new"))}</label>
                  <input id="quo-client-new" maxlength="120" required>
                  <button type="submit" class="btn btn-ghost btn-sm">${esc(t("app_add"))}</button>
                </form>
              </details>
              <details>
                <summary>${esc(t("quo_project_create"))}</summary>
                <form id="quo-project-new-form" class="ws-mat-f">
                  <label class="ws-bar-label" for="quo-project-new">${esc(t("ws_new_project"))}</label>
                  <input id="quo-project-new" maxlength="120" required>
                  <button type="submit" class="btn btn-ghost btn-sm">${esc(t("app_add"))}</button>
                </form>
              </details>
            </div>
          </section>

          <section class="dash-sec">
            <div class="ws-mat-grid">
              <label class="ws-mat-f"><span class="ws-bar-label">${esc(t("quo_number"))}</span><input id="quo-number" maxlength="40"></label>
              <label class="ws-mat-f"><span class="ws-bar-label">${esc(t("quo_date"))}</span><input id="quo-created" readonly></label>
              <label class="ws-mat-f"><span class="ws-bar-label">${esc(t("quo_valid_until"))}</span><input id="quo-valid-until" type="date"></label>
              <label class="ws-mat-f"><span class="ws-bar-label">${esc(t("cur_label"))}</span><select id="quo-currency"></select></label>
            </div>
          </section>

          <section class="dash-sec">
            <div class="dash-head"><h2>${esc(t("quo_materials_h"))}</h2></div>
            <ul id="quo-project-list" class="data-list"></ul>
            <p id="quo-room-list" class="muted quo-rooms-line"></p>
            <ul id="quo-material-list" class="data-list"></ul>
            <div id="quo-other-wrap" hidden>
              <h3>${esc(t("quo_fig_other"))}</h3>
              <ul id="quo-other-list" class="data-list"></ul>
            </div>
            <details id="quo-hidden-wrap" hidden><summary id="quo-hidden-summary"></summary><ul id="quo-hidden-list" class="data-list"></ul></details>
            <p class="muted">${esc(t("quo_project_rows_note"))}</p>
            <ul id="quo-own-material-list" class="data-list"></ul>
            <div class="quo-own-picker">
              <h3>${esc(t("quo_own_t"))}</h3>
              <label class="ws-mat-f quo-own-search" id="quo-own-search-wrap" hidden><input type="search" id="quo-own-search" aria-label="${esc(t("quo_own_search"))}"></label>
              <div id="quo-own-picker-list" class="mlist"></div>
              <p class="muted" id="quo-own-picker-empty">${esc(quoteOwnLink[0] || "")}<a href="${urlOwnMaterials(lang)}">${esc(t("omatpage_title"))}</a>${esc(quoteOwnLink[1] || "")}</p>
            </div>
            ${quoteLineForm("materials", t("quo_material_add"))}
          </section>

          <!-- Chapter XXII's "robocizna": the only part of a quote nothing else counts. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("quo_labour_t"))}</h2>
            </div>
            <p class="muted">${esc(t("quo_labour_d"))}</p>
            <ul id="quo-labour-list" class="data-list"></ul>
            ${quoteLineForm("labour", t("quo_labour_add"))}
            <p class="muted" id="quo-labour-full" hidden>${esc(t("quo_labour_full"))}</p>
          </section>

          <section class="dash-sec quo-summary-card">
            <div class="dash-head"><h2>${esc(t("quo_sum_t"))}</h2></div>
            <label class="ws-mat-f ws-mat-f-sm quo-margin-field">
              <span class="ws-bar-label">${esc(t("quo_margin"))}</span>
              <input id="quo-margin" type="text" inputmode="decimal">
            </label>
            <p class="muted field-note">${esc(t("quo_margin_d"))}</p>
            <label class="check"><input id="quo-show-margin" type="checkbox"> <span>${esc(t("quo_show_margin"))}</span></label>
            <dl class="quo-summary-list">
              <div><dt>${esc(t("quo_fig_materials"))}</dt><dd id="quo-fig-materials"></dd></div>
              <div><dt>${esc(t("quo_fig_other"))}</dt><dd id="quo-fig-other"></dd></div>
              <div><dt>${esc(t("quo_fig_labour"))}</dt><dd id="quo-fig-labour"></dd></div>
              <div><dt>${esc(t("quo_fig_sub"))}</dt><dd id="quo-fig-sub"></dd></div>
              <div><dt>${esc(t("quo_fig_margin"))}</dt><dd id="quo-fig-margin"></dd></div>
              <div><dt>${esc(t("quo_net"))}</dt><dd id="quo-fig-net"></dd></div>
              <div class="quo-vat-row"><dt>${esc(t("quo_vat"))}</dt><dd><select id="quo-vat" aria-label="${esc(t("quo_vat"))}"></select> <input id="quo-vat-custom" type="text" inputmode="decimal" aria-label="${esc(t("quo_vat_custom"))}" hidden> <span id="quo-fig-vat"></span></dd></div>
              <div class="quo-summary-total"><dt>${esc(t("quo_fig_total"))}</dt><dd id="quo-fig-total"></dd></div>
            </dl>
            <p class="muted ws-estimate-mixed" id="quo-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>
          </section>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("quo_note_t"))}</h2>
            </div>
            <p id="quo-note" class="crm-note"></p>
            <p><button type="button" class="btn btn-ghost btn-sm" id="quo-edit">${esc(t("quo_edit"))}</button></p>
            <form id="quo-edit-form" class="mt-4" hidden>
              <p class="ws-mat-grid">
                <label class="ws-mat-f">
                  <span class="ws-bar-label">${esc(t("quo_name"))}</span>
                  <input id="quo-edit-name" type="text" maxlength="120" required>
                </label>
              </p>
              <p class="ws-mat-f">
                <label class="ws-bar-label" for="quo-edit-note">${esc(t("quo_note"))}</label>
                <textarea id="quo-edit-note" rows="3" maxlength="2000"></textarea>
              </p>
              <p>
                <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
                <button type="button" class="btn btn-ghost btn-sm" data-quo-edit-cancel>${esc(t("action_cancel"))}</button>
              </p>
            </form>
          </section>

          ${quotePdfBlock(lang, t, features, stamp)}

          <section class="dash-sec quo-action-bar">
            <label class="field quo-status-field" for="quo-status">
              <span>${esc(t("quo_status"))}</span>
              <select id="quo-status">
                ${["draft", "sent", "accepted", "rejected"].map((status) =>
                  `<option value="${status}">${esc(t(`quo_st_${status}`))}</option>`).join("")}
              </select>
            </label>
            <button type="button" class="btn btn-primary btn-sm" id="quo-save-draft">${esc(t("quo_save_draft"))}</button>
            <span class="muted" id="quo-saved" aria-live="polite"></span>
            <p class="result warn show" id="quo-price-warning" hidden></p>
            <form id="ws-pdf-form" data-pdf-quote data-downloading="${esc(quoteViewCopy.downloading)}" data-download-failed="${esc(quoteViewCopy.downloadFailed)}"><button type="submit" class="btn btn-ghost btn-sm" data-pdf-action="download">${esc(quoteViewCopy.download)}</button> <button type="submit" class="btn btn-ghost btn-sm" data-pdf-action="print">${esc(quoteViewCopy.print)}</button> <span class="quo-pdf-download-status" role="status"></span></form>
            <button type="button" class="btn btn-ghost btn-sm" id="quo-share">${esc(t("quo_share"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="quo-csv">CSV</button>
            <div id="quo-delete-ask" class="ws-ask mt-4" hidden>
              <p id="quo-delete-q"></p>
              <p class="ws-ask-row">
                <button type="button" class="btn btn-primary btn-sm" id="quo-delete-yes">${esc(t("quo_delete_yes"))}</button>
                <button type="button" class="btn btn-ghost btn-sm" id="quo-delete-no">${esc(t("action_cancel"))}</button>
              </p>
            </div>
            <div id="quo-share-panel" class="quo-share-panel mt-4" hidden>
              <p class="quo-share-link"><input id="quo-share-url" readonly aria-label="URL"> <button type="button" class="btn btn-ghost btn-sm" id="quo-share-copy">${esc(t("quo_share_copy"))}</button></p>
              <p class="quo-share-actions"><a class="btn btn-ghost btn-sm" id="quo-share-email" aria-expanded="false" aria-controls="quo-share-mail">${esc(t("quo_share_email"))}</a> <a class="btn btn-ghost btn-sm" id="quo-share-wa" target="_blank" rel="noopener">${esc(t("quo_share_whatsapp"))}</a> <a class="btn btn-ghost btn-sm" id="quo-share-sms">${esc(t("quo_share_sms"))}</a> <button type="button" class="btn btn-ghost btn-sm" id="quo-share-system" hidden>${esc(t("quo_share_system"))}</button> <button type="button" class="btn btn-ghost btn-sm" id="quo-share-off">${esc(t("quo_share_off"))}</button></p>
              <p class="quo-share-actions" id="quo-share-mail" hidden><a class="btn btn-ghost btn-sm" id="quo-share-gmail" target="_blank" rel="noopener">Gmail</a> <a class="btn btn-ghost btn-sm" id="quo-share-outlook" target="_blank" rel="noopener">Outlook</a> <a class="btn btn-ghost btn-sm" id="quo-share-mailto">${esc(t("quo_share_mailapp"))}</a> <button type="button" class="btn btn-ghost btn-sm" id="quo-share-copy-msg">${esc(t("quo_share_copy_msg"))}</button></p>
              <p class="muted" id="quo-share-note"></p>
            </div>
            <p class="muted" id="quo-share-account" hidden>${esc(t("quo_share_account"))} <a href="${URL_APP}">${esc(t("nav_app"))}</a></p>
            <p class="muted" id="quo-share-company" hidden>${esc(t("quo_share_company"))} <a href="${urlCompany(lang)}">${esc(t("companypage_title"))}</a></p>
          </section>
          <section class="dash-sec">
            <button type="button" class="btn btn-danger btn-sm quo-delete-zone" id="quo-delete">${esc(t("quo_delete_yes"))}</button>
          </section>
        </div>
      </article>`;

  const index = `<div id="quo-index">
        <p class="ws-undo" id="quo-undo" role="status" hidden>
          <span id="quo-undo-text"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="quo-undo-go">${esc(t("quo_undo"))}</button>
        </p>

        <div class="card">
          <h3 data-i18n="proj_new_quote">${esc(t("proj_new_quote"))}</h3>
          <form id="quo-form" class="inline-form">
            <div class="field"><label for="quo-name">${esc(t("quo_new"))}</label><input id="quo-name" type="text" maxlength="120" required></div>
            <div class="field field-narrow"><label for="quo-project">${esc(t("quo_project"))}</label><select id="quo-project"></select></div>
            <div class="form-foot"><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></div>
          </form>
        </div>
        <p id="quo-add-message" class="muted" role="status"></p>
        <ul id="quo-list" class="data-list"></ul>
      </div>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1 id="quo-title">${esc(t("quopage_title"))}</h1>
      <p class="lead" id="quo-lead">${esc(t("quopage_lead"))}</p>
    </div>
  </section>

  <section class="block alt" id="quo-page">
    <div class="wrap narrow">
      <!-- Chapter XXV's strip, as on /klienci/ — see the comment there. -->
      ${gate}

      <div id="quo-tool">
        ${detail}
        ${index}
      </div>

      <!-- AUDYT3 C6: the account rail is the route navigation. -->
      <p class="muted src-note">${esc(t("quo_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main: accountPageMain(main, t, lang, "quotes"), ld: crumbs.ld };
}

/**
 * /terminarz/ — the schedule of LiczMat Pro. Session 25, chapter XXIII.
 *
 * One screen with no `?id=` view: a row opens the project it belongs to on /projekty/.
 * The module stores nothing of its own — a deadline is a project's `dueDate` — so what is
 * written here is the month grid's frame, five empty lists and the words above them;
 * assets/schedule-grid.js and assets/schedule-ui.js fill them from assets/crm.js.
 *
 * 2026-09-26: the owner found two different terminarze — the month grid on /app/ and the
 * buckets here — and asked for one. The grid (calendarGrid() in src/app-pages.mjs, drawn
 * by assets/schedule-grid.js) now sits on top of this page too, and its day panel holds
 * the page's only add form.
 *
 * The five headings and their lines are server-rendered rather than drawn by the script,
 * so a visitor with no JavaScript and a crawler both read what the module is.
 */
export function calendarMain(lang, t, features) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("nav_app"), path: URL_APP },
    { name: t("calpage_title"), path: urlCalendar(lang) },
  ]);

  // Chapter XXV's paywall, from the same builder as the other modules.
  const gate = proGate(t, "calendar", features, lang, { id: "cal-gate" });

  /* The buckets of CAL_BUCKETS in assets/crm.js, in the same order and with the same ids.
     The script hides the ones that are empty; the markup carries all five, so the page
     says what a terminarz sorts by even before anything has a date. */
  const buckets = ["late", "today", "soon", "later", "none"].map((b) => `
          <section class="dash-sec cal-sec card" id="cal-sec-${b}">
            <div class="dash-head">
              <h2 id="cal-h-${b}">${esc(t(`cal_${b}_t`))}</h2>
            </div>
            <p class="muted">${esc(t(`cal_${b}_d`))}</p>
            <ul id="cal-list-${b}" class="data-list"></ul>
          </section>`).join("");

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("calpage_title"))}</h1>
      <p class="lead">${esc(t("calpage_lead"))}</p>
    </div>
  </section>

  <section class="block alt" id="cal-page">
    <div class="wrap narrow">
      <!-- Chapter XXV's strip, as on /klienci/ — see the comment there. -->
      ${gate}

      <div id="cal-tool">
        ${calendarGrid(t, "cal")}
        <!-- 2026-10-05: the private iCalendar link (calendarFeed in functions/index.js), so
             the terms show up in the phone calendar itself. Drawn by assets/schedule-feed.js.
             Straight under the month grid, first on the page (owner, 2026-10-05). -->
        <section class="dash-sec card" id="calfeed">
          <div class="dash-head">
            <h2 id="calfeed-title">${esc(t("calfeed_title"))}</h2>
          </div>
          <p class="muted" id="calfeed-lead">${esc(t("calfeed_lead"))}</p>
          <div id="calfeed-content">
            <p class="mat-tools"><button type="button" class="btn btn-ghost btn-sm" id="calfeed-connect" disabled>${esc(t("calfeed_connect"))}</button></p>
          </div>
          <p class="muted field-note" id="calfeed-status" aria-live="polite"></p>
        </section>
        <!-- What "late" and "today" are measured against, said out loud: the visitor's
             own calendar day, which is the only reckoning a deadline has. -->
        <div class="dash-sec card">
          <p class="crm-contact"><span class="eyebrow muted">${esc(t("cal_today_is"))}</span> <b id="cal-today-date"></b></p>

          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cal_late_t"))}</span> <b id="cal-fig-late"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cal_today_t"))}</span> <b id="cal-fig-today"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cal_soon_t"))}</span> <b id="cal-fig-soon"></b></p>
          </div>
        </div>

        <p class="muted" id="cal-empty" hidden>${esc(t("cal_empty"))}</p>
${buckets}

        <details id="cal-closed" class="ws-archive" hidden>
          <summary id="cal-closed-summary">${esc(t("cal_closed_t"))}</summary>
          <p class="muted">${esc(t("cal_closed_d"))}</p>
          <ul id="cal-closed-list" class="data-list"></ul>
        </details>
      </div>

      <!-- AUDYT3 C6: the account rail replaces unrelated route buttons. -->
      <p class="muted src-note">${esc(t("cal_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main: accountPageMain(main, t, lang, "schedule"), ld: crumbs.ld };
}

/* ------------------------------------------------------------------ converter */

/**
 * /przelicznik-jednostek/ — the unit converter, session 57 (item C1 of the parity audit).
 *
 * The eleven categories and their units come from assets/converter.js, which is the port
 * of the app's engine, so nothing about what the tool converts is written here. What is
 * written here is the page: chapter XII's order (H1 → form → result → explanation), the
 * calculator pages' own card so the two tools do not look like two products, and the list
 * of categories under it — which is the page's real content for anybody reading it
 * without JavaScript, and the one place a crawler can see what the tool actually holds.
 *
 * The answer is in the markup, computed by the build over the values the form opens with,
 * for the same reason a calculator page ships a worked example: a page whose only content
 * is an empty form says nothing to a reader who runs no script.
 *
 * Four of the words on it were already written: `calc_form_h`, `calc_result_h`,
 * `hwc_title` and `hwc_source` are the calculator pages' own, and "Jak to liczymy" over
 * "Silnik strony jest portem 1:1 kodu z aplikacji na Androida" is not a sentence this
 * page gets to phrase differently — it is the same claim about the same port.
 *
 * @param {object[]} cats CONV_CATS from assets/converter.js
 * @param {object} example { value, from, out, to } — already formatted for this language
 * @param {object} copy CONV_COPY[lang] from src/conv-copy.mjs — the page's own words,
 *        which are build-time only and deliberately not in the dictionary every page
 *        downloads. `t()` is still here for the four strings the calculator pages already
 *        own and this page shares.
 */
export function converterMain(lang, t, cats, example, copy) {
  const c = (key) => copy[key];
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("calchub_title"), path: urlCalcIndex(lang) },
    { name: t("convpage_title"), path: urlConverter(lang) },
  ]);

  const first = cats[0];
  const catOpts = cats
    .map((cat) => `<option value="${esc(cat.id)}"${cat === first ? " selected" : ""}>${esc(c(`conv_c_${cat.id}`))}</option>`)
    .join("");
  const unitOpts = (chosen) => first.units
    .map(([sym]) => `<option value="${esc(sym)}"${sym === chosen ? " selected" : ""}>${esc(sym)}</option>`)
    .join("");

  const inventory = cats.map((cat) =>
    `<li><b>${esc(c(`conv_c_${cat.id}`))}</b>: ${esc(cat.units.map(([sym]) => sym).join(", "))}</li>`).join("");

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("convpage_title"))}</h1>
      <p class="lead">${esc(c("convpage_lead"))}</p>
    </div>
  </section>

  <section class="block alt calc-tool">
    <div class="wrap">
      <div class="calc" data-converter>
        <div class="calc-form">
          <h2>${esc(t("calc_form_h"))}</h2>
          <div class="field">
            <label for="conv-cat">${esc(c("conv_cat"))}</label>
            <select id="conv-cat" data-conv-cat>${catOpts}</select>
          </div>
          <div class="field">
            <label for="conv-value">${esc(c("conv_value"))}</label>
            <input id="conv-value" type="text" inputmode="decimal" value="1" data-conv-value>
          </div>
          <div class="field">
            <label for="conv-from">${esc(c("conv_from"))}</label>
            <select id="conv-from" data-conv-from>${unitOpts(first.def[0])}</select>
          </div>
          <div class="field">
            <label for="conv-to">${esc(c("conv_to"))}</label>
            <select id="conv-to" data-conv-to>${unitOpts(first.def[1])}</select>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-conv-swap>${esc(c("conv_swap"))}</button>
        </div>
        <div class="calc-out">
          <h2>${esc(t("calc_result_h"))}</h2>
          <!-- role="status", as on a calculator page and for the same reason: the answer
               changes as the visitor types, nothing moves and no focus shifts, so without
               it a screen reader is told nothing about the one thing they came for. The
               box ships holding the answer for the values the form opens with, and
               assets/converter.js writes into it only when the words differ, so nothing
               is announced on load. -->
          <div class="result show" data-conv-result role="status">
            <div class="muted eyebrow">${esc(example.value)} ${esc(example.from)}</div>
            <div class="big">${esc(example.out)} <span class="figure-line">${esc(example.to)}</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="block" aria-labelledby="conv-how-h">
    <div class="wrap calc-how">
      <h2 id="conv-how-h">${esc(t("hwc_title"))}</h2>
      <div class="calc-how-grid">
        <div>
          <p>${esc(c("conv_how_d"))}</p>
          <p>${esc(c("conv_temp_d"))}</p>
          <p class="muted src-note">${esc(t("hwc_source"))}</p>
        </div>
        <div>
          <h3>${esc(c("conv_units_t"))}</h3>
          <ul class="plain-list">${inventory}</ul>
        </div>
      </div>
      <p class="mt-6"><a class="btn btn-ghost btn-go" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a></p>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ stores */

export function storesMain(lang, t) {
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("storespage_title"), path: urlStores(lang) },
  ]);

  const chips = [
    ["market budowlany", t("chip_diy")],
    ["hurtownia budowlana", t("chip_wholesale")],
    ["skład budowlany", t("chip_yard")],
    ["Castorama", "Castorama"], ["Leroy Merlin", "Leroy Merlin"], ["OBI", "OBI"],
    ["Bricomarché", "Bricomarché"], ["PSB Mrówka", "PSB Mrówka"],
  ].map(([q, label]) => `<button type="button" class="chip" data-example="${esc(q)}">${esc(label)}</button>`).join("");

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("storespage_title"))}</h1>
      <p class="lead">${esc(t("storespage_lead"))}</p>
    </div>
  </section>
  <section id="sklepy" class="block alt">
    <div class="wrap">
      <div class="split-2">
        <div>
          <iframe id="store-map" class="map-frame" title="${esc(t("storespage_title"))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=sklep%20budowlany&amp;z=6&amp;output=embed"></iframe>
        </div>
        <div class="store-panel" id="store-panel">
          <button id="find-near" type="button" class="btn btn-primary btn-block">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>
            <span>${esc(t("stores_near"))}</span>
          </button>
          <p class="store-status" id="store-status" role="status" aria-live="polite"></p>
          <ul id="store-list" class="store-list" aria-label="${esc(t("storespage_title"))}"></ul>
          <button id="store-more" class="btn btn-ghost btn-block mt-3" hidden></button>

          <div class="store-search-block">
            <form id="store-search" role="search">
              <label for="store-q" class="fld-label">${esc(t("stores_q_label"))}</label>
              <div class="search-row">
                <input id="store-q" type="search" placeholder="${esc(t("stores_q_ph"))}" autocomplete="off">
                <button class="btn btn-ghost" type="submit">${esc(t("stores_show_map"))}</button>
              </div>
            </form>
            <p class="muted text-sm mt-3">${esc(t("stores_examples"))}</p>
            <div class="chips mt-3">${chips}</div>
          </div>
          <p class="muted text-xs mt-4">${esc(t("stores_note"))}</p>
        </div>
      </div>
    </div>
  </section>
  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ /moje-materialy/ */

/**
 * Six applications. Android currently reads the web-only OTHER value as
 * WALL_FLOOR_COVERING; that is accepted while this capability remains web-only.
 */
const OMAT_APPS = [
  ["WALL_FLOOR_COVERING", ["widthMm", "lengthMm", "packageAreaM2", "wastePercent"]],
  ["DRYWALL_BOARDING", ["widthMm", "lengthMm", "wastePercent"]],
  ["COATING", ["coveragePerUnitM2"]],
  ["PANEL_CUTTING", ["widthMm", "lengthMm", "kerfMm"]],
  ["LINEAR_STOCK", ["lengthMm", "kerfMm"]],
  ["OTHER", []],
];

/**
 * The "new material" form, written once and rendered on both pages that offer it:
 * /moje-materialy/ and the "your materials" block on the catalogue page.
 *
 * assets/own-materials-ui.js finds it by `data-omat-form` and knows nothing about which
 * page it is on, so the two cannot drift apart — the defect a second copy of eleven
 * inputs invites. `heading` is the only difference between them: the catalogue page puts
 * the form inside a disclosure whose summary already carries the name.
 *
 * @param {(key: string) => string} c  the build-time copy of src/omat-copy.mjs
 */
function omatForm(t, aisles, c, heading = false) {
  const appOpts = OMAT_APPS
    .map(([id], i) => `<option value="${esc(id)}"${i === 0 ? " selected" : ""}>${esc(c(`omat_app_${id}`))}</option>`)
    .join("");

  const measureField = (key) => `<label class="field omat-f" data-omat-f="${esc(key)}">
              <span class="fld-label">${esc(c(`omat_f_${key}`))}</span>
              <input type="text" inputmode="decimal" data-omat-in="${esc(key)}">
            </label>`;

  // One group per application, all in the document, all but the first hidden.
  const groups = OMAT_APPS.map(([id, fields], i) =>
    `<div class="omat-fields" data-omat-group="${esc(id)}"${i === 0 ? "" : " hidden"}>
            ${id === "OTHER" ? `<label class="field omat-f">
              <span class="fld-label">${esc(c("omat_purpose"))}</span>
              <input type="text" maxlength="80" placeholder="${esc(c("omat_purpose_ph"))}" data-omat-in="purpose">
            </label>
            <label class="field omat-f">
              <span class="fld-label">${esc(c("omat_unit"))}</span>
              <select data-omat-in="unit">${t("quo_units").split("|").filter(Boolean).map((unit, index) => `<option${index === 0 ? " selected" : ""}>${esc(unit)}</option>`).join("")}</select>
            </label>` : `<div class="omat-measure-grid">${fields.map(measureField).join("\n            ")}</div>`}
          </div>`).join("\n          ");

  return `<form class="card omat-form" data-omat-form>
        ${heading ? `<h2>${esc(c("omat_add_t"))}</h2>` : ""}
        <label class="field">
          <span class="fld-label">${esc(c("omat_name"))}</span>
          <input type="text" maxlength="120" placeholder="${esc(c("omat_name_ph"))}" data-omat-in="name" required>
        </label>
        <div class="omat-row">
          <label class="field">
            <span class="fld-label">${esc(c("omat_app"))}</span>
            <select data-omat-in="application">${appOpts}</select>
          </label>
          <label class="field">
            <span class="fld-label">${esc(c("omat_cat"))}</span>
            <select data-omat-in="category">${
              aisles.map((a) => `<option value="${esc(a)}">${esc(t(`cat_${a}`))}</option>`).join("")
            }</select>
          </label>
        </div>
        ${groups}
        <label class="field omat-price-field">
          <span class="fld-label" data-omat-price-label="pack">${esc(c("omat_price"))}</span>
          <span class="fld-label" data-omat-price-label="unit" hidden>${esc(c("omat_price_unit"))}</span>
          <input type="text" inputmode="decimal" data-omat-in="priceMajor">
        </label>
        <p class="muted field-note">${esc(c("omat_cur_note"))}</p>
        <div class="form-foot"><button type="submit" class="btn btn-primary">${esc(c("omat_save"))}</button></div>
        <!-- Written by the script when a name is missing; empty and announced, so a
             refusal reaches somebody who cannot see the field turn red. -->
        <p class="omat-err" data-omat-err role="alert" hidden></p>
      </form>`;
}

/**
 * The visitor's own materials and what they pay for them (session 59, item C6 of the
 * parity audit). The app has had this screen since before the site existed; the browser
 * had nothing, and the rows were outside the sync contract until the same session put
 * `users/{uid}/materials` in it.
 *
 * Everything a reader needs is in the markup, `hidden` where it does not apply, and
 * assets/own-materials-ui.js unhides and fills it — the rule proGate() has followed since
 * session 27: a form built by a script is a form that flashes into existence, and a page
 * whose whole body is written at runtime says nothing to a crawler or to somebody with no
 * JavaScript.
 *
 * The six field groups are all in the document at once and the script shows the one the
 * chosen application uses. There are eleven inputs between them and only the six that
 * apply are ever read: `omMeasures()` in the store nulls out the rest, so a covering
 * turned into a profile cannot keep a package area nothing will read.
 */
export function ownMaterialsMain(lang, t, aisles, copy) {
  const c = (key) => copy[key];
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("nav_app"), path: URL_APP },
    { name: t("omatpage_title"), path: urlOwnMaterials(lang) },
  ]);

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("omatpage_title"))}</h1>
      <p class="lead">${esc(c("omatpage_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      ${omatForm(t, aisles, c, true)}
    </div>
  </section>

  <section class="block">
    <div class="wrap narrow">
      <div class="card">
        <h2>${esc(c("omat_list_t"))}</h2>
        <label class="field" data-omat-search-wrap hidden>
          <span class="fld-label">${esc(c("omat_search"))}</span>
          <input type="search" data-omat-search aria-label="${esc(c("omat_search"))}">
        </label>
      <!-- The list is this browser's own rows, so it is written at runtime. The empty
           state ships in the markup rather than being created later: a heading a script
           fills either ships with the text the script would use, or it is an empty
           heading somebody can reach. -->
      <div data-omat-list data-hist-label="${esc(c("omat_hist_t"))}"></div>
      <p class="muted" data-omat-empty>${esc(t("omat_empty"))}</p>
      <p class="muted" data-omat-search-none hidden>${esc(c("omat_search_none"))}</p>
      <p class="ws-undo" data-omat-undo role="status" hidden></p>
      <p class="muted">${esc(c("omat_use_note"))}</p>
        <p class="muted">${esc(c("omat_sync_note"))}</p>
      </div>
    </div>
  </section>

  <!-- AUDYT3 C6: price history appears only beside rows that contain history. -->
</main>`;

  return { main: accountPageMain(main, t, lang, "materials"), ld: crumbs.ld };
}
