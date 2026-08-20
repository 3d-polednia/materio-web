/* LiczMat website — the <main> of every page type.

   Each function returns markup only; `template.page()` wraps it in the shared shell.
   Calculator forms are rendered here, server-side, with the labels already translated,
   so a crawler (and a visitor with JavaScript off) sees the real fields. The browser
   only attaches the handlers afterwards — see wireCalculator() in assets/calculators.js. */

import { esc, calcIcon, playBadge, breadcrumbs } from "./template.mjs";
import {
  HOME_DOORS, route as iaRoute, STATUS, CALC_CATEGORIES, calcCategory, popularCalcs,
} from "./ia.mjs";
import {
  BASE as BASE_URL, LANGS,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores, urlMaterials,
  urlProjects, urlEstimate, urlAndroid, urlCookies, urlClients, urlJobs, urlQuotes,
  urlCalendar, urlLiczmatPro,
  CALC_SLUG, PLAY_URL, URL_APP,
} from "./site.mjs";
import { CALC_META, FORMULA_I18N, FORMULA_UNITS, DECIMAL_POINT } from "./calc-meta.mjs";
import { proGate, proModules, proPlansBlock } from "./pro.mjs";
import { DEFAULT_CURRENCY } from "./currency.mjs";

const LOCALE = { pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-US" };

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

/**
 * "It costs nothing", written as money.
 *
 * The page is generated in the language's default currency, and assets/currency.js
 * rewrites it from `data-lm-money` once the visitor's own choice is known — the price is
 * zero in every currency, so this is the one amount on the site that can be stated
 * without knowing which one is in force.
 */
function freePrice(lang) {
  const zero = new Intl.NumberFormat(LOCALE[lang] || LOCALE.pl, {
    style: "currency", currency: DEFAULT_CURRENCY[lang], maximumFractionDigits: 0,
  }).format(0);
  return `<div class="num" data-lm-money="0">${esc(zero)}</div>`;
}

/* ------------------------------------------------------------------ calculator form */

/* The two glyphs on the carousel's stop button. Both ship; the stylesheet shows the one
   that matches whether the screenshots are moving, the same arrangement the theme toggle
   and the menu button use. */
const ICON_PAUSE = '<svg class="ico-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
const ICON_PLAY = '<svg class="ico-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5 19 12 7 19.5Z"/></svg>';

const PICK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></svg>';

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
export function calcCard(calc, t, { materials = 0, example, projectsUrl = "" }) {
  /* `data-lk` is the field's dictionary key, next to the value the field holds. Saving a
     result keeps what the visitor typed (chapter XV), and a saved line has to stay
     readable after a switch to another language — so the line keeps the key and the page
     showing it translates, instead of freezing "Powierzchnia" into storage. A <select>
     puts the same on its options: the answer is the word, not the "1". */
  const fields = calc.fields.map((f) => {
    const label = esc(t(f.label));
    const keys = `data-k="${f.k}" data-lk="${esc(f.label)}"`;
    if (f.sel) {
      const opts = f.sel.map(([v, l, key]) =>
        `<option value="${esc(v)}"${key ? ` data-ok="${esc(key)}"` : ""}${v === f.def ? " selected" : ""}>${esc(key ? t(key) : l)}</option>`).join("");
      return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><select id="f-${calc.id}-${f.k}" ${keys}>${opts}</select></div>`;
    }
    if (f.ta) {
      return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><textarea id="f-${calc.id}-${f.k}" rows="3" ${keys}>${esc(f.def)}</textarea></div>`;
    }
    return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><input id="f-${calc.id}-${f.k}" type="text" inputmode="decimal" ${keys} value="${esc(f.def)}"></div>`;
  }).join("");

  const chips = calc.presets
    ? `<div class="chips">${calc.presets.map((p, i) =>
        `<button type="button" class="chip" data-preset="${i}">${esc(p.k ? t(p.k) : p.l)}</button>`).join("")}</div>`
    : "";

  const picker = materials
    ? `<button type="button" class="btn btn-ghost btn-sm mat-open" data-mat-open>${PICK_ICON}<span>${esc(t("mat_pick"))}</span></button>
      <p class="mat-chosen" data-mat-chosen hidden></p>`
    : "";

  const rows = example.rows
    .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");

  // The card carries both labels so the script can swap them without a dictionary of its
  // own: "Policz" until the visitor has asked for a number, "Oblicz ponownie" after.
  return `<div class="calc" data-calc="${calc.id}" data-tab="${calc.tab}">
      <div class="calc-form">
        <h2 id="calc-form-h">${esc(t("calc_form_h"))}</h2>
        ${picker}${chips}${fields}
        <button type="button" class="btn btn-primary" data-run
          data-label-run="${esc(t("act_calc"))}"
          data-label-again="${esc(t("act_recalc"))}">${esc(t("act_calc"))}</button>
      </div>
      <div class="calc-out">
        <h2 id="calc-result-h">${esc(t("calc_result_h"))}</h2>
        <!-- role="status" (an implicit aria-live="polite"): pressing "Policz" replaces
             the contents of this box and moves nothing on the page, so without it a
             screen reader is told nothing at all about the one thing the visitor asked
             for. Polite rather than assertive — the answer waits for the sentence being
             read to end. The box is in the markup from the first paint holding the worked
             example, and a live region announces only what changes after it is live, so
             nothing is read out on load. -->
        <div class="result show" data-result role="status">
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
${homeHero(t)}
${homeDoors(lang, t, calcs, cat)}
${homePath(t)}
${faqSection(t)}
</main>`;
}

const FACT_ICON = {
  browser: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  langs: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3.5 3 16.5 0 20M12 2c-3 3.5-3 16.5 0 20"/>',
};

/** Title, one sentence, and the three facts that decide whether to stay. No button:
    the three doors below are the choice, and chapter X rules out repeating a CTA. */
function homeHero(t) {
  const fact = (icon, text) =>
    `<span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${FACT_ICON[icon]}</svg><span>${esc(text)}</span></span>`;

  return `<section class="hero" aria-labelledby="hero-h">
  <div class="wrap">
   <div class="hero-copy">
    <h1 id="hero-h">${esc(t("hero_title"))}</h1>
    <p class="lead">${esc(t("hero_lead"))}</p>
    <div class="trust">
      ${fact("browser", t("home_fact_browser"))}
      ${fact("account", t("trust_noaccount"))}
      ${fact("langs", t("trust_langs"))}
    </div>
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
          .replace("{calc}", calcs.length).replace("{mat}", cat.total))}</p>`
      : "";

    const action = href
      ? `<a class="btn ${door.id === "calculators" ? "btn-primary" : "btn-ghost"}" href="${href}">${esc(t(`${door.key}_go`))}</a>`
      : `<p class="door-soon">${esc(t("door_soon"))}</p>`;

    return `<article class="door" aria-labelledby="door-${door.id}">
      <span class="door-level">${esc(t(`lvl_${door.level}`))}</span>
      <h3 id="door-${door.id}">${esc(t(`${door.key}_t`))}</h3>
      <p class="door-q">${esc(t(`${door.key}_q`))}</p>
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

/** POLICZ → ZAPISZ → ZORGANIZUJ → ZREALIZUJ — the idea of chapter I, in four lines. */
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

/* The feature card and the ticked list belong to /aplikacja/ now — session 6 took the
   six feature cards and the data chapter off the home page. */
const featureCard = (path, title, desc) =>
  `<div class="card"><div class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${path}</svg></div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`;

const TICK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';

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
      <div class="kicker">FAQ</div>
      <h2 id="faq-h">${esc(t("faq_title"))}</h2>
    </div>
    <div class="faq">
      ${FAQ_KEYS.map((n, i) => {
        const answer = n === 5
          ? `<p><span>${esc(t("faq_a5"))}</span> <a href="/privacy-policy.html">${esc(t("faq_a5_link"))}</a>.</p>`
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

/**
 * The dots under the phone mockup, and the control that stops it.
 *
 * WCAG 2.2.2: the screenshots start moving on their own and go on for longer than five
 * seconds, so there has to be a way to stop them. assets/main.js unhides the button when
 * it starts the timer — with no script nothing moves and there is nothing to stop, and
 * under prefers-reduced-motion the carousel never starts, so the button stays hidden
 * there too. Both labels travel in the markup, in this page's own language, which is why
 * main.js needs no dictionary of its own.
 *
 * The dots are aria-hidden: they say which of three frames is showing, which is the one
 * thing about this decoration a screen reader gains nothing from.
 */
function carouselControls(t) {
  return `<p class="phone-controls">
          <span class="phone-dots" data-carousel-dots aria-hidden="true"></span>
          <button type="button" class="phone-pause" data-carousel-pause hidden
            aria-label="${esc(t("shot_pause"))}"
            data-label-pause="${esc(t("shot_pause"))}"
            data-label-play="${esc(t("shot_play"))}">${ICON_PAUSE}${ICON_PLAY}</button>
        </p>`;
}

function ctaSection(t) {
  return `<section class="block" aria-labelledby="cta-h">
  <div class="wrap">
    <div class="cta-banner">
      <div class="cta-copy">
        <h2 id="cta-h">${esc(t("cta_title"))}</h2>
        <p>${esc(t("cta_lead"))}</p>
        ${playBadge(t, "cta", "badge-store")}
      </div>
      <div class="cta-shots">
        <div class="phone" aria-roledescription="carousel" aria-label="LiczMat">
          <div class="phone-track" data-carousel>
            <img src="/assets/screens/pl_home.webp" width="618" height="1340" alt="${esc(t("shot_home"))}" loading="lazy" decoding="async">
            <img src="/assets/screens/pl_calc.webp" width="618" height="1340" alt="${esc(t("shot_calc"))}" loading="lazy" decoding="async">
            <img src="/assets/screens/pl_stores.webp" width="618" height="1340" alt="${esc(t("shot_stores"))}" loading="lazy" decoding="async">
          </div>
        </div>
        ${carouselControls(t)}
      </div>
    </div>
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
export function calcHubMain(lang, t, calcs, guides) {
  const crumbs = breadcrumbs([
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

  const popular = popularCalcs(guides, calcs);

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
        <p class="muted calc-shown" role="status" data-calc-shown="${esc(t("calchub_shown"))}">${esc(
          t("calchub_shown").replace("{n}", calcs.length).replace("{total}", calcs.length))}</p>
      </div>
    </section>

    <section class="block" aria-labelledby="popular-h" data-hub-popular>
      <div class="wrap">
        <div class="section-head left">
          <h2 id="popular-h">${esc(t("calchub_start_t"))}</h2>
          <p class="muted">${esc(t("calchub_start_d"))}</p>
        </div>
        <ul class="calc-links">${popular.map((c) =>
          `<li>${calcLinkCard(c, lang, t)}</li>`).join("")}</ul>
      </div>
    </section>

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
  const crumbs = breadcrumbs([
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
      ${calcCard(calc, t, { materials, example, projectsUrl: urlProjects(lang) })}
      ${materials ? `<p class="muted src-note"><a href="${urlMaterials(lang)}">${esc(t("matpage_title"))}</a> — ${esc(materials)} ${esc(t("mat_count_label"))}</p>` : ""}
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
          <pre class="formula"><code>${formula.map(esc).join("\n")}</code></pre>
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
      <p class="mt-6">
        <a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
        <a class="btn btn-ghost" href="${urlGuideIndex(lang)}">${esc(t("guide_all"))}</a>
      </p>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ guides */

export function guideIndexMain(lang, t, guides) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("guides_title"), path: urlGuideIndex(lang) },
  ]);
  const cards = guides.map((g) => `<a class="calc-link" href="${urlGuide(lang, g)}">
      <span class="calc-link-body">
        <b>${esc(t(`g_${g.id}_t`))}</b>
        <span class="muted">${esc(t(`g_${g.id}_d`))}</span>
      </span>
      <span class="calc-link-go">${esc(t("calc_open"))}</span>
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
  const crumbs = breadcrumbs([
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

      <p class="mt-6"><a class="btn btn-ghost" href="${urlGuideIndex(lang)}">${esc(t("guide_all"))}</a></p>
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
export function materialsMain(lang, t, cat) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("matpage_title"), path: urlMaterials(lang) },
  ]);

  const blocks = cat.categories.map((c) => {
    const rows = cat.byCategory(c).map((m) => {
      const name = cat.name(m, lang, t);
      const calcId = cat.primary(m);
      const href = calcId ? `${urlCalc(lang, calcId)}?m=${encodeURIComponent(m.id)}` : urlCalcIndex(lang);
      return `<li id="${esc(m.id)}" data-find="${esc(cat.fold(`${name} ${m.id}`))}">
          <span class="mat-item">
            <b>${esc(name)}</b>
            <span class="muted">${esc(cat.note(m, lang, t))}</span>
          </span>
          <a class="btn btn-ghost btn-sm" href="${href}">${esc(t("mat_open_calc"))}</a>
        </li>`;
    }).join("");

    return `<section class="block" data-cat-block>
      <div class="wrap">
        <h2 id="cat-${c}">${esc(t(`cat_${c}`))}</h2>
        <ul class="mat-page-list">${rows}</ul>
      </div>
    </section>`;
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
        <p class="muted mt-3">${cat.total} ${esc(t("mat_count_label"))} · ${esc(t("matpage_note"))}</p>
        <p class="muted" id="matpage-empty" hidden>${esc(t("mat_none"))}</p>
      </div>
    </section>
    ${blocks}
  </div>

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

/* ------------------------------------------------------------------ cookies */

/**
 * Every cookie and every piece of browser storage the site uses, one row each.
 *
 * `name` and `type` are literal — a storage key is not translated — so only the purpose
 * is a dictionary key. Keeping the list here rather than in the dictionary means it can be
 * checked against the code: each row names the file that writes it.
 */
const COOKIE_ROWS = [
  { name: "materio_consent", type: "ck_type_local", purpose: "ck_p_consent", life: "ck_life_until_cleared" },
  { name: "materio-lang", type: "ck_type_local", purpose: "ck_p_lang", life: "ck_life_until_cleared" },
  { name: "liczmat-currency", type: "ck_type_local", purpose: "ck_p_currency", life: "ck_life_until_cleared" },
  { name: "liczmat-theme", type: "ck_type_local", purpose: "ck_p_theme", life: "ck_life_until_cleared" },
  { name: "liczmat-signed-in", type: "ck_type_local", purpose: "ck_p_signed_in", life: "ck_life_until_signout" },
  { name: "liczmat-remember", type: "ck_type_local", purpose: "ck_p_remember", life: "ck_life_until_cleared" },
  { name: "materio-redirected", type: "ck_type_session", purpose: "ck_p_redirect", life: "ck_life_session" },
  { name: "materio-workspace-v1", type: "ck_type_local", purpose: "ck_p_workspace", life: "ck_life_until_cleared" },
  { name: "materio-active-project", type: "ck_type_local", purpose: "ck_p_active", life: "ck_life_until_cleared" },
  { name: "liczmat-recent-calcs", type: "ck_type_local", purpose: "ck_p_recent", life: "ck_life_until_cleared" },
  { name: "liczmat-crm-v1", type: "ck_type_local", purpose: "ck_p_crm", life: "ck_life_until_cleared" },
];

const COOKIE_THIRD_ROWS = [
  { name: "_ga, _ga_*", type: "ck_type_cookie", purpose: "ck_p_ga", life: "ck_life_2y" },
  { name: "firebaseLocalStorageDb", type: "ck_type_idb", purpose: "ck_p_firebase", life: "ck_life_until_signout" },
  { name: "google.com / maps.google.com", type: "ck_type_cookie", purpose: "ck_p_maps", life: "ck_life_google" },
];

export function cookiesMain(lang, t) {
  const crumbs = breadcrumbs([
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
        <a href="/privacy-policy.html">${esc(t("foot_privacy"))}</a></p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

/* ------------------------------------------------------------------ the Android app */

/**
 * /aplikacja/ — the one page where the Android app is the subject.
 *
 * The rest of the site is the tool and mentions the app once, quietly, at the foot of a
 * page. This is where the download pitch belongs, so it carries the screenshots, the
 * whole feature list and the things a visitor has to know before installing: it is free,
 * it carries ads, and the store map asks for a location.
 */
export function androidMain(lang, t, calcs, cat) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("apppage_title"), path: urlAndroid(lang) },
  ]);

  const shot = (file, altKey) =>
    `<figure class="shot">
      <img src="/assets/screens/${file}" width="618" height="1340" alt="${esc(t(altKey))}" loading="lazy" decoding="async">
      <figcaption class="muted">${esc(t(altKey))}</figcaption>
    </figure>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
    </div>
  </section>

  <section class="hero app-hero" aria-labelledby="app-h">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="badge"><span class="dot"></span><span>${esc(t("hero_badge"))}</span></span>
        <h1 id="app-h">${esc(t("apppage_title"))}</h1>
        <p class="lead">${esc(t("apppage_lead"))}</p>
        <div class="store-badges">
          ${playBadge(t, "apppage")}
          <a class="btn btn-ghost btn-lg" href="${urlCalcIndex(lang)}">${esc(t("hero_try"))}</a>
        </div>
        <div class="trust">
          <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg><span>${esc(t("trust_offline"))}</span></span>
          <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg><span>${esc(t("trust_noaccount"))}</span></span>
          <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3.5 3 16.5 0 20M12 2c-3 3.5-3 16.5 0 20"/></svg><span>${esc(t("trust_langs"))}</span></span>
        </div>
      </div>
      <div class="hero-media">
        <div class="phone" aria-roledescription="carousel" aria-label="LiczMat">
          <div class="phone-track" data-carousel>
            <img src="/assets/screens/pl_home.webp" width="618" height="1340" alt="${esc(t("shot_home"))}" decoding="async">
            <img src="/assets/screens/pl_calc.webp" width="618" height="1340" alt="${esc(t("shot_calc"))}" loading="lazy" decoding="async">
            <img src="/assets/screens/pl_stores.webp" width="618" height="1340" alt="${esc(t("shot_stores"))}" loading="lazy" decoding="async">
          </div>
        </div>
        ${carouselControls(t)}
      </div>
    </div>
  </section>

  <section class="block pt-2">
    <div class="wrap">
      <div class="stat-band">
        <div class="stat">${freePrice(lang)}<div class="lbl">${esc(t("stat_free_lbl"))}</div></div>
        <div class="stat"><div class="num">${calcs.length}</div><div class="lbl">${esc(t("stat_calc_lbl"))}</div></div>
        <div class="stat"><div class="num">${cat.total}</div><div class="lbl">${esc(t("stat_catalog_lbl"))}</div></div>
        <div class="stat"><div class="num">${LANGS.length}</div><div class="lbl">${esc(t("stat_langs_lbl"))}</div></div>
      </div>
    </div>
  </section>

  <section class="block alt" aria-labelledby="appfeat-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="appfeat-h">${esc(t("apppage_h_features"))}</h2>
        <p class="muted">${esc(t("apppage_features_d"))}</p>
      </div>
      <div class="features">
        ${featureCard('<path d="M19 3H5a2 2 0 0 0-2 2v6h18V5a2 2 0 0 0-2-2Z"/><path d="M3 11v3a4 4 0 0 0 4 4h1v3h2v-6H3Z"/>', t("f_calc_t"), t("f_calc_d"))}
        ${featureCard('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>', t("f_optim_t"), t("f_optim_d"))}
        ${featureCard('<path d="M4 4h16v16H4z"/><path d="M4 9h16M4 14h16M9 4v16M14 4v16"/>', t("f_catalog_t"), t("f_catalog_d"))}
        ${featureCard('<path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18M9 21v-6h6v6"/>', t("f_rooms_t"), t("f_rooms_d"))}
        ${featureCard('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>', t("f_projects_t"), t("f_projects_d"))}
        ${featureCard('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 18h4"/>', t("af_pdf_t"), t("af_pdf_d"))}
        ${featureCard('<path d="M3 7h13l-3-3M21 17H8l3 3"/>', t("af_converter_t"), t("af_converter_d"))}
        ${featureCard('<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/>', t("f_stores_t"), t("f_stores_d"))}
        ${featureCard('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>', t("af_sync_t"), t("af_sync_d"))}
      </div>
    </div>
  </section>

  <section class="block" aria-labelledby="appshots-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="appshots-h">${esc(t("apppage_h_shots"))}</h2>
      </div>
      <div class="shot-grid">
        ${shot("pl_home.webp", "shot_home")}
        ${shot("pl_calc.webp", "shot_calc")}
        ${shot("pl_stores.webp", "shot_stores")}
      </div>
    </div>
  </section>

  <section class="block alt" aria-labelledby="appweb-h">
    <div class="wrap narrow">
      <h2 id="appweb-h">${esc(t("apppage_h_web"))}</h2>
      <p class="muted">${esc(t("apppage_web_d"))}</p>
      <ul class="trust-list">
        ${[["apppage_web_1"], ["apppage_web_2"], ["apppage_web_3"]].map(([k]) =>
          `<li><span class="tick">${TICK}</span><span><b>${esc(t(k))}</b></span></li>`).join("")}
      </ul>
      <p class="ws-links">
        <a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
        <a class="btn btn-ghost" href="${urlMaterials(lang)}">${esc(t("matpage_title"))}</a>
        <a class="btn btn-ghost" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
      </p>
    </div>
  </section>

  <section class="block" aria-labelledby="appreq-h">
    <div class="wrap narrow">
      <h2 id="appreq-h">${esc(t("apppage_h_reqs"))}</h2>
      <ul class="steps-list">
        <li>${esc(t("apppage_req_1"))}</li>
        <li>${esc(t("apppage_req_2"))}</li>
        <li>${esc(t("apppage_req_3"))}</li>
        <li>${esc(t("apppage_req_4"))}</li>
      </ul>
      <p class="muted src-note"><a href="/privacy-policy.html">${esc(t("foot_privacy"))}</a></p>
    </div>
  </section>

  ${ctaSection(t)}
</main>`;

  const ld = [crumbs.ld, {
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
    screenshot: ["pl_home.webp", "pl_calc.webp", "pl_stores.webp"]
      .map((f) => `${BASE_URL}/assets/screens/${f}`),
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
export function projectsMain(lang, t, aisles = []) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("wspage_title"), path: urlProjects(lang) },
  ]);

  /* The detail. Every figure in it is written by the script; what the build fixes is the
     shape, the headings and the labels, so nothing here has to be translated twice. */
  const detail = `<article id="ws-project" class="ws-project" hidden>
        <p class="ws-project-back"><a href="${urlProjects(lang)}" data-ws-back>${esc(t("proj_back"))}</a></p>

        <div id="ws-project-missing" hidden>
          <h2>${esc(t("proj_none_t"))}</h2>
          <p class="muted">${esc(t("proj_none_d"))}</p>
        </div>

        <div id="ws-project-body" hidden>
          <p class="ws-project-hist muted" id="ws-project-hist"></p>

          <!-- Chapter XVII: "Projekt może pokazywać: koszt materiałów, inne koszty, sumę
               projektu." The three are written by assets/workspace.js's wsProjectCosts(),
               which counts every amount in the project exactly once — a calculation and
               the material it put on the shopping list are the same money. -->
          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("proj_count_l"))}</span> <b id="ws-project-count"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("proj_cost_mat"))}</span> <b id="ws-project-mat"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("proj_cost_other"))}</span> <b id="ws-project-other"></b></p>
            <p class="ws-project-fig ws-project-sum"><span class="eyebrow muted">${esc(t("proj_cost_sum"))}</span> <b id="ws-project-total"></b></p>
          </div>
          <p class="muted ws-estimate-mixed" id="ws-project-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>

          <div class="ws-project-actions">
            <button type="button" class="btn btn-primary btn-sm" id="ws-project-activate">${esc(t("ws_activate"))}</button>
            <span class="chip on" id="ws-project-active" hidden>${esc(t("ws_active"))}</span>
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-rename">${esc(t("ws_rename"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-archive">${esc(t("proj_archive_do"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="ws-project-delete">${esc(t("app_delete"))}</button>
          </div>

          <form id="ws-rename-form" class="inline-form mt-4" hidden>
            <input id="ws-rename-name" type="text" maxlength="120" aria-label="${esc(t("ws_new_project"))}" required>
            <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" data-ws-rename-cancel>${esc(t("action_cancel"))}</button>
          </form>

          <div id="ws-delete-ask" class="ws-ask mt-4" hidden>
            <p id="ws-delete-q"></p>
            <p class="ws-ask-row">
              <button type="button" class="btn btn-primary btn-sm" id="ws-delete-yes">${esc(t("proj_delete_yes"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="ws-delete-no">${esc(t("action_cancel"))}</button>
            </p>
          </div>

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
                    <span class="ws-bar-label">${esc(t("ws_col_name"))}</span>
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
              <a class="dash-more" href="${urlEstimate(lang)}" id="ws-project-estimate">${esc(t("proj_open_estimate"))}</a>
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
                    <input id="ws-mat-price" type="text" inputmode="decimal" data-f="priceMajor">
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
               part of a project no calculator produces. They are the hand-typed estimate
               lines /kosztorys/ has always written, filed into the project that is open
               instead of the active one, so this is a second way into one store. -->
          <section class="dash-sec">
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
                    <input id="ws-other-cost" type="text" inputmode="decimal">
                  </label>
                </p>
                <p><button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button></p>
              </form>
            </details>
          </section>
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

        <h2>${esc(t("ws_projects"))}</h2>
        <p class="muted">${esc(t("wspage_projects_d"))}</p>
        <form id="ws-project-form" class="inline-form">
          <input id="ws-project-name" type="text" maxlength="120" placeholder="${esc(t("ws_new_project"))}" required aria-label="${esc(t("ws_new_project"))}">
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
        </form>
        <ul id="ws-project-list" class="data-list"></ul>

        <details id="ws-archive" class="ws-archive" hidden>
          <summary id="ws-archive-summary">${esc(t("proj_archive_t"))}</summary>
          <p class="muted">${esc(t("proj_archive_d"))}</p>
          <ul id="ws-archive-list" class="data-list"></ul>
        </details>

        <h2 class="mt-8">${esc(t("ws_rooms"))}</h2>
        <p class="muted">${esc(t("wspage_rooms_d"))}</p>
        <!-- Chapter XVIII: a room is an element of a project, so the form asks which one
             instead of silently taking the active project — which is what it did until the
             owner reported that a room could not be assigned at all. The list is filled by
             assets/workspace-ui.js; "no project" is a real answer, because a room measured
             before there is a project is still a room. -->
        <form id="ws-room-form" class="inline-form">
          <input id="ws-room-name" type="text" maxlength="120" placeholder="${esc(t("ws_new_room"))}" required aria-label="${esc(t("ws_new_room"))}">
          <input id="ws-room-length" type="text" inputmode="decimal" value="5" aria-label="${esc(t("fld_length"))}">
          <input id="ws-room-width" type="text" inputmode="decimal" value="4" aria-label="${esc(t("fld_width"))}">
          <input id="ws-room-height" type="text" inputmode="decimal" value="2.6" aria-label="${esc(t("fld_height"))}">
          <select id="ws-room-project" aria-label="${esc(t("ws_project"))}"></select>
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
        </form>
        <ul id="ws-room-list" class="data-list"></ul>
      </div>

      <p class="ws-links">
        <a class="btn btn-ghost" href="${urlEstimate(lang)}">${esc(t("estpage_title"))}</a>
        <a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
        <a class="btn btn-ghost" href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a>
      </p>
      <p class="muted src-note">${esc(t("wspage_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
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
export function proPageMain(lang, t, features, prices) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("pro_t"), path: urlLiczmatPro(lang) },
  ]);

  /* The five modules, named and described in full. No chip on any of them: the whole page
     is about what Pro contains, so "Dostępne w LiczMat Pro" under each card would be the
     same sentence five times. No link either — each module is behind the wall, and a link
     onto a wall that describes this page is a circle. */
  const mods = proModules(features).map((f) => `<article class="pro-mod">
          <h3>${esc(t(`${f.key}_t`))}</h3>
          <p class="muted">${esc(t(`${f.key}_d`))}</p>
        </article>`).join("\n        ");

  const list = (keys) => `<ul class="steps-list">
        ${keys.map((k) => `<li>${esc(t(k))}</li>`).join("\n        ")}
      </ul>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <span class="door-level">${esc(t("lvl_pro"))}</span>
      <h1>${esc(t("pro_t"))}</h1>
      <p class="lead">${esc(t("pro_d"))}</p>
    </div>
  </section>

  <section class="block" aria-labelledby="promods-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="promods-h">${esc(t("propage_h_mods"))}</h2>
        <p class="muted">${esc(t("propage_mods_d"))}</p>
      </div>
      <div class="pro-mods">
        ${mods}
      </div>
    </div>
  </section>

  <section class="block alt" aria-labelledby="profree-h">
    <div class="wrap narrow">
      <h2 id="profree-h">${esc(t("propage_h_free"))}</h2>
      <p class="muted">${esc(t("propage_free_d"))}</p>
      ${list(["propage_free_1", "propage_free_2", "propage_free_3"])}
      <p class="ws-links">
        <a class="btn btn-ghost btn-sm" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
        <a class="btn btn-ghost btn-sm" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
        <a class="btn btn-ghost btn-sm" href="${urlEstimate(lang)}">${esc(t("estpage_title"))}</a>
      </p>
    </div>
  </section>

  <!-- What Pro is not. Chapter XXIV ends on "to nie jest ERP", chapter XXII rules the
       accounting package out by name and chapter XXIII rules out a second calendar; a
       page that sold Pro without saying any of it would be selling something else. -->
  <section class="block" aria-labelledby="pronot-h">
    <div class="wrap narrow">
      <h2 id="pronot-h">${esc(t("propage_h_not"))}</h2>
      ${list(["propage_not_1", "propage_not_2", "propage_not_3"])}
      <p class="muted src-note">${esc(t("propage_local"))}</p>
    </div>
  </section>

  <!-- The price. The block is proPlansBlock() — the same markup the wall in front of a
       module carries, so the two can never quote different prices — and the amounts in it
       are empty: assets/pay.js knows them per currency and assets/paywall.js writes them
       in once the visitor's currency is known. Somebody already on Pro is shown their
       plan instead: pwMountPage() hides the whole block for them. -->
  <section class="block alt" aria-labelledby="propay-h">
    <div class="wrap narrow">
      <h2 id="propay-h">${esc(t("propage_h_pay"))}</h2>
      <div id="pro-pay">
        ${proPlansBlock(t, { checkout: false, prices })}
      </div>
      <p id="pro-yours" hidden><span class="chip on">${esc(t("cli_pro_yours"))}</span></p>
    </div>
  </section>

  <section class="block" aria-labelledby="prohow-h">
    <div class="wrap narrow">
      <h2 id="prohow-h">${esc(t("propage_h_how"))}</h2>
      ${list(["propage_how_1", "propage_how_2", "propage_how_3"])}
      <p class="ws-links">
        <a class="btn btn-primary btn-sm" href="${URL_APP}?mode=signup&amp;next=${encodeURIComponent(urlLiczmatPro(lang))}" rel="nofollow">${esc(t("pro_signin"))}</a>
        <a class="btn btn-ghost btn-sm" href="${URL_APP}" rel="nofollow">${esc(t("pay_go"))}</a>
      </p>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
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
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
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
                <input id="crm-edit-phone" type="tel" maxlength="200" autocomplete="tel">
              </label>
              <label class="ws-mat-f ws-mat-f-sm">
                <span class="ws-bar-label">${esc(t("cli_email"))}</span>
                <input id="crm-edit-email" type="email" maxlength="200" autocomplete="email">
              </label>
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("cli_address"))}</span>
                <input id="crm-edit-address" type="text" maxlength="200">
              </label>
            </p>
            <p class="ws-mat-f">
              <label class="ws-bar-label" for="crm-edit-note">${esc(t("cli_note"))}</label>
              <textarea id="crm-edit-note" rows="3" maxlength="2000"></textarea>
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
              <a class="dash-more" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
            </div>
            <p class="muted">${esc(t("cli_projects_d"))}</p>
            <ul id="crm-client-projects" class="data-list"></ul>
            <form id="crm-project-form" class="inline-form">
              <select id="crm-project-pick" aria-label="${esc(t("cli_project_add"))}"></select>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("cli_project_add"))}</button>
            </form>
          </section>

          <!-- Chapter XX: "Klient może posiadać … zlecenia", and chapter XXIV's path runs
               through them. The job is written on /zlecenia/ — this is the client's end of
               the same link, read-only, so one screen owns the writes. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("cli_jobs_t"))}</h2>
              <a class="dash-more" href="${urlJobs(lang)}">${esc(t("cli_jobs_all"))}</a>
            </div>
            <p class="muted">${esc(t("cli_jobs_d"))}</p>
            <ul id="crm-client-jobs" class="data-list"></ul>
          </section>

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

        <h2>${esc(t("cli_list_t"))}</h2>
        <p class="muted">${esc(t("cli_list_d"))}</p>
        <form id="crm-client-form" class="inline-form">
          <input id="crm-client-name" type="text" maxlength="120" placeholder="${esc(t("cli_new"))}" required aria-label="${esc(t("cli_new"))}">
          <input id="crm-client-phone" type="tel" maxlength="200" placeholder="${esc(t("cli_phone"))}" autocomplete="off" aria-label="${esc(t("cli_phone"))}">
          <input id="crm-client-email" type="email" maxlength="200" placeholder="${esc(t("cli_email"))}" autocomplete="off" aria-label="${esc(t("cli_email"))}">
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
        </form>
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
      <p class="crm-pro" id="crm-pro" hidden>
        <span class="chip" id="crm-pro-chip">${esc(t("pro_locked"))}</span>
      </p>

      ${gate}

      <div id="crm-tool">
        ${detail}
        ${index}
      </div>

      <p class="ws-links">
        <a class="btn btn-ghost" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
        <a class="btn btn-ghost" href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a>
      </p>
      <p class="muted src-note">${esc(t("cli_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

/**
 * /zlecenia/ — the job list of LiczMat Pro. Chapter XXI, session 23.
 *
 * One page, two screens, the same shape as /klienci/ and /projekty/: the index, and one
 * job at `?id=<jobId>` — the `job` route in src/ia.mjs is a `view` because a job id is
 * made in this browser and can never be a directory on GitHub Pages.
 *
 * The build fixes the frame, the headings, chapter XXV's Pro notice and the honest note
 * about where the rows live. Everything with a name, a date or a figure in it is written
 * by assets/jobs-ui.js from the store — nothing about a job can be server-rendered,
 * because every job is in one browser.
 */
export function jobsMain(lang, t, features) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("clipage_title"), path: urlClients(lang) },
    { name: t("jobpage_title"), path: urlJobs(lang) },
  ]);

  // Chapter XXV's paywall, from the same builder as /klienci/ — one module, one wall.
  const gate = proGate(t, "jobs", features, lang, { id: "job-gate" });

  /* The four statuses of chapter XXI, in the chapter's own order, rendered as a <select>
     so the whole set is visible at once and a job can be moved in one gesture. The values
     are the ids JOB_STATUS declares in assets/crm.js; the script checks them again before
     storing, because a value that is not one of the four must never reach the row. */
  const statusOptions = [["new", "job_st_new"], ["active", "job_st_active"],
    ["done", "job_st_done"], ["cancelled", "job_st_cancelled"]]
    .map(([id, key]) => `<option value="${id}">${esc(t(key))}</option>`).join("");

  const detail = `<article id="job-detail" class="ws-project" hidden>
        <p class="ws-project-back"><a href="${urlJobs(lang)}" data-job-back>${esc(t("job_back"))}</a></p>

        <div id="job-missing" hidden>
          <h2>${esc(t("job_none_t"))}</h2>
          <p class="muted">${esc(t("job_none_d"))}</p>
        </div>

        <div id="job-body" hidden>
          <!-- Chapter XXIV's path through this job: KLIENT → ZLECENIE → PROJEKT → WYCENA.
               Drawn by assets/crm-chain.js, which the three CRM screens share so the path
               reads the same wherever it is standing. A step nobody has filled in links to
               the page that would fill it. -->
          <nav class="crm-chain" id="job-chain" aria-label="${esc(t("crm_chain_t"))}"></nav>

          <!-- Status and date sit above everything else: they are what a tradesman opens
               a job to check, and chapter XXI names them before the money. -->
          <p class="ws-mat-grid job-head-row">
            <label class="ws-mat-f">
              <span class="ws-bar-label">${esc(t("job_status"))}</span>
              <select id="job-status">${statusOptions}</select>
            </label>
            <label class="ws-mat-f">
              <span class="ws-bar-label">${esc(t("job_due"))}</span>
              <input id="job-due" type="date">
            </label>
          </p>

          <p class="crm-contact" id="job-client-line"></p>

          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("job_value"))}</span> <b id="job-fig-value"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("job_fig_cost"))}</span> <b id="job-fig-cost"></b></p>
            <p class="ws-project-fig ws-project-sum"><span class="eyebrow muted">${esc(t("job_fig_left"))}</span> <b id="job-fig-left"></b></p>
          </div>
          <p class="muted field-note">${esc(t("job_cost_d"))}</p>
          <p class="muted ws-estimate-mixed" id="job-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>

          <div class="ws-project-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="job-edit">${esc(t("job_edit"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="job-delete">${esc(t("app_delete"))}</button>
          </div>

          <!-- The whole record in one form on the page, for the reason /klienci/ gives:
               prompt() cannot be translated once it is open and covers the row it is
               about on a phone (chapter XXVIII). -->
          <form id="job-edit-form" class="mt-4" hidden>
            <p class="ws-mat-grid">
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("job_name"))}</span>
                <input id="job-edit-name" type="text" maxlength="120" required>
              </label>
              <label class="ws-mat-f ws-mat-f-sm">
                <span class="ws-bar-label">${esc(t("job_value"))}</span>
                <input id="job-edit-value" type="text" inputmode="decimal">
              </label>
              <label class="ws-mat-f">
                <span class="ws-bar-label">${esc(t("job_client"))}</span>
                <select id="job-edit-client"></select>
              </label>
            </p>
            <p class="muted field-note">${esc(t("job_value_d"))}</p>
            <p class="ws-mat-f">
              <label class="ws-bar-label" for="job-edit-desc">${esc(t("job_desc"))}</label>
              <textarea id="job-edit-desc" rows="3" maxlength="2000"></textarea>
            </p>
            <p class="ws-mat-f">
              <label class="ws-bar-label" for="job-edit-note">${esc(t("job_note"))}</label>
              <textarea id="job-edit-note" rows="3" maxlength="2000"></textarea>
            </p>
            <p>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_save"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" data-job-edit-cancel>${esc(t("action_cancel"))}</button>
            </p>
          </form>

          <div id="job-delete-ask" class="ws-ask mt-4" hidden>
            <p id="job-delete-q"></p>
            <p class="ws-ask-row">
              <button type="button" class="btn btn-primary btn-sm" id="job-delete-yes">${esc(t("job_delete_yes"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="job-delete-no">${esc(t("action_cancel"))}</button>
            </p>
          </div>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("job_desc"))}</h2>
            </div>
            <p id="job-desc" class="crm-note"></p>
          </section>

          <!-- Chapter XXIV's third step: ZLECENIE → PROJEKT. The project is the free
               workspace's own row — the same one /projekty/ shows — and nothing here
               renames, archives or deletes it. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("job_project"))}</h2>
              <a class="dash-more" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
            </div>
            <ul id="job-project-list" class="data-list"></ul>
            <form id="job-project-form" class="inline-form">
              <select id="job-project-pick" aria-label="${esc(t("job_project_add"))}"></select>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("job_project_add"))}</button>
            </form>
          </section>

          <!-- Chapter XXIV's fourth step. A quote is priced from the *project*, so these
               are the quotes of the project this job carries — crmJobQuotes() — and the
               figure beside each one is read live rather than copied. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("crm_quotes_t"))}</h2>
              <a class="dash-more" href="${urlQuotes(lang)}">${esc(t("crm_quotes_all"))}</a>
            </div>
            <p class="muted">${esc(t("crm_quotes_d"))}</p>
            <ul id="job-quotes" class="data-list"></ul>
          </section>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("job_note_t"))}</h2>
            </div>
            <p id="job-note" class="crm-note"></p>
          </section>

          <!-- Chapter XXIV's last step, for one job: the job itself, the quotes on its
               project and what was saved into that project. Derived, like everywhere. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("crm_hist_t"))}</h2>
            </div>
            <p class="muted">${esc(t("crm_hist_d"))}</p>
            <ul id="job-history" class="data-list"></ul>
            <p class="muted field-note">${esc(t("crm_hist_note"))}</p>
          </section>
        </div>
      </article>`;

  const index = `<div id="job-index">
        <p class="ws-undo" id="job-undo" role="status" hidden>
          <span id="job-undo-text"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="job-undo-go">${esc(t("job_undo"))}</button>
        </p>

        <h2>${esc(t("job_list_t"))}</h2>
        <p class="muted">${esc(t("job_list_d"))}</p>
        <form id="job-form" class="inline-form">
          <input id="job-name" type="text" maxlength="120" placeholder="${esc(t("job_new"))}" required aria-label="${esc(t("job_new"))}">
          <select id="job-client" aria-label="${esc(t("job_client"))}"></select>
          <input id="job-new-due" type="date" aria-label="${esc(t("job_due"))}">
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
        </form>
        <ul id="job-list" class="data-list"></ul>

        <details id="job-closed" class="ws-archive" hidden>
          <summary id="job-closed-summary">${esc(t("job_closed_t"))}</summary>
          <p class="muted">${esc(t("job_closed_d"))}</p>
          <ul id="job-closed-list" class="data-list"></ul>
        </details>
      </div>`;

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1 id="job-title">${esc(t("jobpage_title"))}</h1>
      <p class="lead" id="job-lead">${esc(t("jobpage_lead"))}</p>
    </div>
  </section>

  <section class="block alt" id="job-page">
    <div class="wrap narrow">
      <!-- Chapter XXV's strip, as on /klienci/ — see the comment there. -->
      <p class="crm-pro" id="job-pro" hidden>
        <span class="chip" id="job-pro-chip">${esc(t("pro_locked"))}</span>
      </p>

      ${gate}

      <div id="job-tool">
        ${detail}
        ${index}
      </div>

      <p class="ws-links">
        <a class="btn btn-ghost" href="${urlClients(lang)}">${esc(t("clipage_title"))}</a>
        <a class="btn btn-ghost" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
        <a class="btn btn-ghost" href="${urlQuotes(lang)}">${esc(t("quopage_title"))}</a>
        <a class="btn btn-ghost" href="${urlCalendar(lang)}">${esc(t("calpage_title"))}</a>
      </p>
      <p class="muted src-note">${esc(t("job_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

/**
 * /wyceny/ — the quotes of LiczMat Pro. Session 24, chapter XXII.
 *
 * Two screens in one file, the same shape as /klienci/ and /zlecenia/: the index, and one
 * quote at ?id=<quoteId>. Only the frame is written here — every figure on it is computed
 * in the browser, and three of the five come out of the project rather than out of the
 * quote (crmQuoteTotals() in assets/crm.js says why).
 */
export function quotesMain(lang, t, features) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("jobpage_title"), path: urlJobs(lang) },
    { name: t("quopage_title"), path: urlQuotes(lang) },
  ]);

  // Chapter XXV's paywall, from the same builder as the other modules.
  const gate = proGate(t, "quotes", features, lang, { id: "quo-gate" });

  const detail = `<article id="quo-detail" class="ws-project" hidden>
        <p class="ws-project-back"><a href="${urlQuotes(lang)}" data-quo-back>${esc(t("quo_back"))}</a></p>

        <div id="quo-missing" hidden>
          <h2>${esc(t("quo_none_t"))}</h2>
          <p class="muted">${esc(t("quo_none_d"))}</p>
        </div>

        <div id="quo-body" hidden>
          <!-- Chapter XXIV read backwards: WYCENA → PROJEKT → ZLECENIE → KLIENT. Every
               step is derived from the one link the quote stores, so nothing here can
               disagree with the job's own page. Session 26 draws it with the same strip
               /zlecenia/ uses — assets/crm-chain.js — so the path reads identically from
               both ends. -->
          <nav class="crm-chain" id="quo-chain-line" aria-label="${esc(t("crm_chain_t"))}"></nav>

          <!-- Chapter XXII's five figures. Three of them are the project's own money,
               read through wsProjectCosts() and never copied onto the quote. -->
          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("quo_fig_materials"))}</span> <b id="quo-fig-materials"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("quo_fig_other"))}</span> <b id="quo-fig-other"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("quo_fig_labour"))}</span> <b id="quo-fig-labour"></b></p>
          </div>
          <div class="ws-project-figs">
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("quo_fig_sub"))}</span> <b id="quo-fig-sub"></b></p>
            <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("quo_fig_margin"))}</span> <b id="quo-fig-margin"></b></p>
            <p class="ws-project-fig ws-project-sum"><span class="eyebrow muted">${esc(t("quo_fig_total"))}</span> <b id="quo-fig-total"></b></p>
          </div>
          <p class="muted ws-estimate-mixed" id="quo-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>

          <!-- The margin is one field on the page rather than a form to open: it is the
               number a tradesman moves while looking at the total. -->
          <p class="ws-mat-grid ws-mat-grid-one">
            <label class="ws-mat-f ws-mat-f-sm">
              <span class="ws-bar-label">${esc(t("quo_margin"))}</span>
              <input id="quo-margin" type="text" inputmode="decimal">
            </label>
          </p>
          <p class="muted field-note">${esc(t("quo_margin_d"))}</p>

          <div class="ws-project-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="quo-edit">${esc(t("quo_edit"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="quo-delete">${esc(t("app_delete"))}</button>
          </div>

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

          <div id="quo-delete-ask" class="ws-ask mt-4" hidden>
            <p id="quo-delete-q"></p>
            <p class="ws-ask-row">
              <button type="button" class="btn btn-primary btn-sm" id="quo-delete-yes">${esc(t("quo_delete_yes"))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="quo-delete-no">${esc(t("action_cancel"))}</button>
            </p>
          </div>

          <!-- Chapter XXII's "robocizna": the only part of a quote nothing else counts. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("quo_labour_t"))}</h2>
            </div>
            <p class="muted">${esc(t("quo_labour_d"))}</p>
            <ul id="quo-labour-list" class="data-list"></ul>
            <form id="quo-labour-form">
              <p class="ws-mat-grid">
                <label class="ws-mat-f">
                  <span class="ws-bar-label">${esc(t("quo_labour_name"))}</span>
                  <input id="quo-labour-name" type="text" maxlength="120" required>
                </label>
                <label class="ws-mat-f ws-mat-f-sm">
                  <span class="ws-bar-label">${esc(t("quo_labour_qty"))}</span>
                  <input id="quo-labour-qty" type="text" inputmode="decimal">
                </label>
                <label class="ws-mat-f ws-mat-f-sm">
                  <span class="ws-bar-label">${esc(t("quo_labour_unit"))}</span>
                  <input id="quo-labour-unit" type="text" maxlength="24">
                </label>
                <label class="ws-mat-f ws-mat-f-sm">
                  <span class="ws-bar-label">${esc(t("quo_labour_price"))}</span>
                  <input id="quo-labour-price" type="text" inputmode="decimal">
                </label>
              </p>
              <p>
                <button type="submit" class="btn btn-primary btn-sm">${esc(t("quo_labour_add"))}</button>
                <span class="muted" id="quo-labour-run"></span>
              </p>
            </form>
            <p class="muted" id="quo-labour-full" hidden>${esc(t("quo_labour_full"))}</p>
          </section>

          <!-- The one link the quote stores. The project is the free workspace's own row;
               nothing here renames, archives or deletes it. -->
          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("quo_project"))}</h2>
              <a class="dash-more" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
            </div>
            <ul id="quo-project-list" class="data-list"></ul>
            <form id="quo-project-form" class="inline-form">
              <select id="quo-project-pick" aria-label="${esc(t("quo_project_add"))}"></select>
              <button type="submit" class="btn btn-primary btn-sm">${esc(t("quo_project_add"))}</button>
            </form>
            <p class="muted field-note">${esc(t("quo_project_d"))}</p>
          </section>

          <section class="dash-sec">
            <div class="dash-head">
              <h2>${esc(t("quo_note_t"))}</h2>
            </div>
            <p id="quo-note" class="crm-note"></p>
          </section>
        </div>
      </article>`;

  const index = `<div id="quo-index">
        <p class="ws-undo" id="quo-undo" role="status" hidden>
          <span id="quo-undo-text"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="quo-undo-go">${esc(t("quo_undo"))}</button>
        </p>

        <h2>${esc(t("quo_list_t"))}</h2>
        <p class="muted">${esc(t("quo_list_d"))}</p>
        <form id="quo-form" class="inline-form">
          <input id="quo-name" type="text" maxlength="120" placeholder="${esc(t("quo_new"))}" required aria-label="${esc(t("quo_new"))}">
          <select id="quo-project" aria-label="${esc(t("quo_project"))}"></select>
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
        </form>
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
      <p class="crm-pro" id="quo-pro" hidden>
        <span class="chip" id="quo-pro-chip">${esc(t("pro_locked"))}</span>
      </p>

      ${gate}

      <div id="quo-tool">
        ${detail}
        ${index}
      </div>

      <p class="ws-links">
        <a class="btn btn-ghost" href="${urlJobs(lang)}">${esc(t("jobpage_title"))}</a>
        <a class="btn btn-ghost" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
      </p>
      <p class="muted src-note">${esc(t("quo_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

/**
 * /terminarz/ — the schedule of LiczMat Pro. Session 25, chapter XXIII.
 *
 * One screen, unlike the other three Pro modules: there is no `?id=` view, because a row
 * here opens the job it belongs to on /zlecenia/. The module stores nothing of its own —
 * a deadline is chapter XXI's `termin`, a field of the job — so what is written here is
 * five empty lists and the words above them, and assets/schedule-ui.js fills them from
 * crmSchedule().
 *
 * The five headings and their lines are server-rendered rather than drawn by the script,
 * so a visitor with no JavaScript and a crawler both read what the module is: the page is
 * indexable, and chapter XXVI wants Pro described in public.
 */
export function calendarMain(lang, t, features) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("jobpage_title"), path: urlJobs(lang) },
    { name: t("calpage_title"), path: urlCalendar(lang) },
  ]);

  // Chapter XXV's paywall, from the same builder as the other modules.
  const gate = proGate(t, "calendar", features, lang, { id: "cal-gate" });

  /* The buckets of CAL_BUCKETS in assets/crm.js, in the same order and with the same ids.
     The script hides the ones that are empty; the markup carries all five, so the page
     says what a terminarz sorts by even before anything has a date. */
  const buckets = ["late", "today", "soon", "later", "none"].map((b) => `
          <section class="dash-sec cal-sec" id="cal-sec-${b}">
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
      <p class="crm-pro" id="cal-pro" hidden>
        <span class="chip" id="cal-pro-chip">${esc(t("pro_locked"))}</span>
      </p>

      ${gate}

      <div id="cal-tool">
        <!-- What "late" and "today" are measured against, said out loud: the visitor's
             own calendar day, which is the only reckoning a deadline has. -->
        <p class="crm-contact"><span class="eyebrow muted">${esc(t("cal_today_is"))}</span> <b id="cal-today"></b></p>

        <div class="ws-project-figs">
          <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cal_late_t"))}</span> <b id="cal-fig-late"></b></p>
          <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cal_today_t"))}</span> <b id="cal-fig-today"></b></p>
          <p class="ws-project-fig"><span class="eyebrow muted">${esc(t("cal_soon_t"))}</span> <b id="cal-fig-soon"></b></p>
        </div>

        <p class="muted" id="cal-empty" hidden>${esc(t("cal_empty"))}</p>
${buckets}

        <details id="cal-closed" class="ws-archive" hidden>
          <summary id="cal-closed-summary">${esc(t("cal_closed_t"))}</summary>
          <p class="muted">${esc(t("cal_closed_d"))}</p>
          <ul id="cal-closed-list" class="data-list"></ul>
        </details>
      </div>

      <p class="ws-links">
        <a class="btn btn-ghost" href="${urlJobs(lang)}">${esc(t("cal_jobs_all"))}</a>
        <a class="btn btn-ghost" href="${urlClients(lang)}">${esc(t("clipage_title"))}</a>
        <a class="btn btn-ghost" href="${urlQuotes(lang)}">${esc(t("quopage_title"))}</a>
      </p>
      <p class="muted field-note">${esc(t("cal_source_note"))}</p>
      <p class="muted src-note">${esc(t("cal_local_note"))}</p>
    </div>
  </section>

  ${appNote(t)}
</main>`;
  return { main, ld: crumbs.ld };
}

/** /kosztorys/ — the saved lines of the active project, priced, printable to PDF. */
export function estimateMain(lang, t) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("estpage_title"), path: urlEstimate(lang) },
  ]);

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head no-print">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("estpage_title"))}</h1>
      <p class="lead">${esc(t("estpage_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <div class="ws-estimate-bar no-print">
        <select id="ws-estimate-project" aria-label="${esc(t("ws_project"))}" hidden></select>
        <button type="button" id="ws-estimate-print" class="btn btn-primary btn-sm">${esc(t("est_print"))}</button>
        <button type="button" id="ws-estimate-csv" class="btn btn-ghost btn-sm">${esc(t("est_csv"))}</button>
      </div>

      <article id="ws-estimate" class="ws-estimate">
        <header class="ws-estimate-head">
          <div>
            <p class="ws-estimate-brand">LiczMat</p>
            <!-- The project's name, or — until one is picked, and with no script at
                 all — the same "no project" sentence assets/workspace-ui.js falls back
                 to. An empty heading is a hole in the page's outline. -->
            <h2 id="ws-estimate-title">${esc(t("ws_no_project"))}</h2>
          </div>
          <div class="ws-estimate-meta">
            <span id="ws-estimate-date"></span>
            <span id="ws-estimate-count"></span>
          </div>
        </header>
        <div class="ws-table-scroll">
          <table class="ws-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">${esc(t("ws_col_name"))}</th>
                <th scope="col" class="num">${esc(t("ws_col_qty"))}</th>
                <th scope="col" class="num">${esc(t("ws_col_cost"))}</th>
                <th scope="col" class="no-print"></th>
              </tr>
            </thead>
            <tbody id="ws-estimate-rows"></tbody>
          </table>
        </div>
        <p class="ws-estimate-total"><span>${esc(t("share_total"))}</span> <b id="ws-estimate-total"></b></p>
        <p class="muted ws-estimate-mixed" id="ws-estimate-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>
        <p class="muted ws-estimate-foot">${esc(t("est_foot"))}</p>
      </article>

      <div class="no-print ws-add-line">
        <h3>${esc(t("ws_add_line"))}</h3>
        <p class="muted">${esc(t("ws_add_line_d"))}</p>
        <form id="ws-line-form" class="inline-form">
          <input id="ws-line-name" type="text" maxlength="120" placeholder="${esc(t("ws_col_name"))}" required aria-label="${esc(t("ws_col_name"))}">
          <input id="ws-line-qty" type="text" inputmode="decimal" value="1" aria-label="${esc(t("ws_col_qty"))}">
          <input id="ws-line-unit" type="text" maxlength="24" value="${esc(t("ws_unit_default"))}" aria-label="${esc(t("ws_col_unit"))}">
          <input id="ws-line-cost" type="text" inputmode="decimal" placeholder="${esc(t("ws_col_cost"))}" aria-label="${esc(t("ws_col_cost"))}">
          <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
        </form>
      </div>

      <p class="ws-links no-print">
        <a class="btn btn-ghost" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
        <a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
      </p>
      <p class="muted src-note no-print">${esc(t("estpage_how"))}</p>
    </div>
  </section>

  <section class="block no-print">
    <div class="wrap narrow">
      <h2>${esc(t("estpage_h2"))}</h2>
      <ol class="steps-list">
        <li>${esc(t("estpage_s1"))}</li>
        <li>${esc(t("estpage_s2"))}</li>
        <li>${esc(t("estpage_s3"))}</li>
      </ol>
    </div>
  </section>

  ${appNote(t)}
</main>`;

  const ld = [crumbs.ld, {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("estpage_h2"),
    description: t("estpage_lead"),
    inLanguage: lang,
    step: [t("estpage_s1"), t("estpage_s2"), t("estpage_s3")]
      .map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
  }];
  return { main, ld };
}

/* ------------------------------------------------------------------ stores */

export function storesMain(lang, t) {
  const crumbs = breadcrumbs([
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
