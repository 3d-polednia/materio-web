/* LiczMat website — the <main> of every page type.

   Each function returns markup only; `template.page()` wraps it in the shared shell.
   Calculator forms are rendered here, server-side, with the labels already translated,
   so a crawler (and a visitor with JavaScript off) sees the real fields. The browser
   only attaches the handlers afterwards — see wireCalculator() in assets/calculators.js. */

import { esc, calcIcon, playBadge, breadcrumbs } from "./template.mjs";
import {
  BASE as BASE_URL, LANGS,
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores, urlMaterials,
  urlProjects, urlEstimate, urlAndroid, urlCookies,
  CALC_SLUG, PLAY_URL, URL_APP,
} from "./site.mjs";
import { CALC_META, FORMULA_I18N, FORMULA_UNITS, DECIMAL_POINT } from "./calc-meta.mjs";
import { DEFAULT_CURRENCY } from "./currency.mjs";

const TABS = ["surface", "cutting", "trade", "framing"];

const LOCALE = { pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-US" };

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

const PICK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></svg>';

/**
 * The interactive card for one calculator, with every label already in `lang`.
 *
 * `materials` is how many catalogue entries can pre-fill this calculator; when there are
 * none (volume of concrete, blocks per m²) the picker button is left out entirely rather
 * than opening an empty dialog.
 */
export function calcCard(calc, t, { heading = "h2", materials = 0 } = {}) {
  const fields = calc.fields.map((f) => {
    const label = esc(t(f.label));
    if (f.sel) {
      const opts = f.sel.map(([v, l, key]) =>
        `<option value="${esc(v)}"${v === f.def ? " selected" : ""}>${esc(key ? t(key) : l)}</option>`).join("");
      return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><select id="f-${calc.id}-${f.k}" data-k="${f.k}">${opts}</select></div>`;
    }
    if (f.ta) {
      return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><textarea id="f-${calc.id}-${f.k}" rows="3" data-k="${f.k}">${esc(f.def)}</textarea></div>`;
    }
    return `<div class="field"><label for="f-${calc.id}-${f.k}">${label}</label><input id="f-${calc.id}-${f.k}" type="text" inputmode="decimal" data-k="${f.k}" value="${esc(f.def)}"></div>`;
  }).join("");

  const chips = calc.presets
    ? `<div class="chips">${calc.presets.map((p, i) =>
        `<button type="button" class="chip" data-preset="${i}">${esc(p.k ? t(p.k) : p.l)}</button>`).join("")}</div>`
    : "";

  const picker = materials
    ? `<button type="button" class="btn btn-ghost btn-sm mat-open" data-mat-open>${PICK_ICON}<span>${esc(t("mat_pick"))}</span></button>
      <p class="mat-chosen" data-mat-chosen hidden></p>`
    : "";

  return `<div class="calc" data-calc="${calc.id}" data-tab="${calc.tab}">
      <${heading}><span class="ico">${calcIcon(calc.id)}</span><span>${esc(t(`c_${calc.id}_t`))}</span></${heading}>
      <p class="desc">${esc(t(`c_${calc.id}_d`))}</p>
      ${picker}${chips}${fields}
      <button type="button" class="btn btn-primary" data-run>${esc(t("act_calc"))}</button>
      <div class="result" data-result></div>
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

export function homeMain(lang, t, calcs, cat) {
  const byTab = TABS.map((tab) => ({ tab, list: calcs.filter((c) => c.tab === tab) }));

  return `<main id="main">
<section class="hero" aria-labelledby="hero-h">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="badge"><span class="dot"></span><span>${esc(t("hero_badge"))}</span></span>
      <h1 id="hero-h">${esc(t("hero_title"))}</h1>
      <p class="lead">${esc(t("hero_lead"))}</p>
      <div class="store-badges">
        <a class="btn btn-primary btn-lg" href="${urlCalcIndex(lang)}">${esc(t("hero_try"))}</a>
        ${playBadge(t, "hero")}
      </div>
      <div class="trust">
        <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg><span>${esc(t("trust_offline"))}</span></span>
        <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg><span>${esc(t("trust_noaccount"))}</span></span>
        <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3.5 3 16.5 0 20M12 2c-3 3.5-3 16.5 0 20"/></svg><span>${esc(t("trust_langs"))}</span></span>
      </div>
    </div>
    <div class="hero-media">
      ${calcCard(calcs.find((c) => c.id === "coverage"), t, { heading: "h2", materials: cat.countFor("coverage") })}
    </div>
  </div>
</section>

<section class="block" aria-label="LiczMat" style="padding-top:8px">
  <div class="wrap">
    <div class="stat-band">
      <div class="stat">${freePrice(lang)}<div class="lbl">${esc(t("stat_free_lbl"))}</div></div>
      <div class="stat"><div class="num">${calcs.length}</div><div class="lbl">${esc(t("stat_calc_lbl"))}</div></div>
      <div class="stat"><div class="num">${cat.total}</div><div class="lbl">${esc(t("stat_catalog_lbl"))}</div></div>
      <div class="stat"><div class="num">${LANGS.length}</div><div class="lbl">${esc(t("stat_langs_lbl"))}</div></div>
    </div>
  </div>
</section>

<section id="features" class="block alt" aria-labelledby="feat-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("feat_kicker"))}</div>
      <h2 id="feat-h">${esc(t("feat_title"))}</h2>
      <p class="muted">${esc(t("feat_lead"))}</p>
    </div>
    <div class="features">
      ${featureCard('<path d="M19 3H5a2 2 0 0 0-2 2v6h18V5a2 2 0 0 0-2-2Z"/><path d="M3 11v3a4 4 0 0 0 4 4h1v3h2v-6H3Z"/>', t("f_calc_t"), t("f_calc_d"))}
      ${featureCard('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>', t("f_optim_t"), t("f_optim_d"))}
      ${featureCard('<path d="M4 4h16v16H4z"/><path d="M4 9h16M4 14h16M9 4v16M14 4v16"/>', t("f_catalog_t"), t("f_catalog_d"))}
      ${featureCard('<path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18M9 21v-6h6v6"/>', t("f_rooms_t"), t("f_rooms_d"))}
      ${featureCard('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>', t("f_projects_t"), t("f_projects_d"))}
      ${featureCard('<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/>', t("f_stores_t"), t("f_stores_d"))}
    </div>
  </div>
</section>

<section class="block" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("how_kicker"))}</div>
      <h2 id="how-h">${esc(t("how_title"))}</h2>
      <p class="muted">${esc(t("how_lead"))}</p>
    </div>
    <div class="steps">
      <div class="step"><h3>${esc(t("how_s1_t"))}</h3><p>${esc(t("how_s1_d"))}</p></div>
      <div class="step"><h3>${esc(t("how_s2_t"))}</h3><p>${esc(t("how_s2_d"))}</p></div>
      <div class="step"><h3>${esc(t("how_s3_t"))}</h3><p>${esc(t("how_s3_d"))}</p></div>
    </div>
  </div>
</section>

<section id="calculators" class="block alt" aria-labelledby="calc-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("calc_kicker"))}</div>
      <h2 id="calc-h">${esc(t("calc_title"))}</h2>
      <p class="muted">${esc(t("calc_lead"))}</p>
    </div>
    ${byTab.map(({ tab, list }) => `<h3 class="calc-group">${esc(t(`tab_${tab}`))}</h3>
    <div class="calc-links">${list.map((c) => calcLinkCard(c, lang, t)).join("")}</div>`).join("\n    ")}
    <p class="center" style="margin-top:24px">
      <a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a>
      <a class="btn btn-ghost" href="${urlMaterials(lang)}">${esc(t("matpage_title"))}</a>
    </p>
  </div>
</section>

${roomsSection(t)}

<section id="projekty" class="block alt" aria-labelledby="proj-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("proj_kicker"))}</div>
      <h2 id="proj-h">${esc(t("proj_title"))}</h2>
      <p class="muted">${esc(t("proj_lead"))}</p>
    </div>
    <div class="features">
      ${featureCard('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', t("proj_b1_t"), t("proj_b1_d"))}
      ${featureCard('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', t("proj_b2_t"), t("proj_b2_d"))}
      ${featureCard('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>', t("proj_b3_t"), t("proj_b3_d"))}
    </div>
    <p class="center" style="margin-top:24px">
      <a class="btn btn-primary" href="${urlProjects(lang)}">${esc(t("wspage_title"))}</a>
      <a class="btn btn-ghost" href="${urlEstimate(lang)}">${esc(t("estpage_title"))}</a>
      <a class="btn btn-ghost" href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a>
    </p>
  </div>
</section>

${accountSection(t)}

<section class="block alt" aria-labelledby="stores-teaser-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("stores_kicker"))}</div>
      <h2 id="stores-teaser-h">${esc(t("stores_title"))}</h2>
      <p class="muted">${esc(t("stores_lead"))}</p>
    </div>
    <p class="center"><a class="btn btn-primary" href="${urlStores(lang)}">${esc(t("stores_show_map"))}</a></p>
  </div>
</section>

${trustSection(t)}
${faqSection(t)}
${ctaSection(t)}
</main>`;
}

const featureCard = (path, title, desc) =>
  `<div class="card"><div class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${path}</svg></div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`;

function roomsSection(t) {
  return `<section id="rooms" class="block" aria-labelledby="rooms-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("rooms_kicker"))}</div>
      <h2 id="rooms-h">${esc(t("rooms_title"))}</h2>
      <p class="muted">${esc(t("rooms_lead"))}</p>
    </div>
    <div class="split-2">
      <div id="room-helper" class="calc">
        <h3><span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18M9 21v-6h6v6"/></svg></span><span>${esc(t("f_rooms_t"))}</span></h3>
        <div class="field-row">
          <div class="field"><label for="room-l">${esc(t("fld_length"))}</label><input id="room-l" type="text" inputmode="decimal" value="5"></div>
          <div class="field"><label for="room-w">${esc(t("fld_width"))}</label><input id="room-w" type="text" inputmode="decimal" value="4"></div>
        </div>
        <div class="field"><label for="room-h">${esc(t("fld_height"))}</label><input id="room-h" type="text" inputmode="decimal" value="2.6"></div>
        <div class="result show">
          <div class="rows">
            <div><span>${esc(t("room_floor"))}</span><b id="room-floor"></b></div>
            <div><span>${esc(t("room_walls"))}</span><b id="room-walls"></b></div>
            <div><span>${esc(t("room_perimeter"))}</span><b id="room-perim"></b></div>
            <div><span>${esc(t("room_volume"))}</span><b id="room-vol"></b></div>
          </div>
        </div>
      </div>
      <div>
        <ul class="trust-list">
          ${[t("room_b1"), t("room_b2"), t("room_b3")].map((x) =>
            `<li><span class="tick">${TICK}</span><span><b>${esc(x)}</b></span></li>`).join("")}
        </ul>
      </div>
    </div>
  </div>
</section>`;
}

const TICK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';

/** The account + sync block. New in phase 1 — the site used to claim "no account, ever". */
function accountSection(t) {
  return `<section id="konto" class="block" aria-labelledby="acct-h">
  <div class="wrap">
    <div class="section-head">
      <div class="kicker">${esc(t("acct_optional"))}</div>
      <h2 id="acct-h">${esc(t("acct_title"))}</h2>
      <p class="muted">${esc(t("acct_lead"))}</p>
    </div>
    <div class="features">
      ${featureCard('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>', t("acct_optional"), t("acct_optional_d"))}
      ${featureCard('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>', t("acct_sync_t"), t("acct_sync_d"))}
      ${featureCard('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', t("acct_private_t"), t("acct_private_d"))}
      ${featureCard('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3.5 3 16.5 0 20M12 2c-3 3.5-3 16.5 0 20"/>', t("acct_where_t"), t("acct_where_d"))}
    </div>
  </div>
</section>`;
}

function trustSection(t) {
  const item = (icon, title, desc) =>
    `<li><span class="tick"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${icon}</svg></span><span><b>${esc(title)}</b><span class="d">${esc(desc)}</span></span></li>`;

  return `<section id="prywatnosc" class="block alt" aria-labelledby="trust-h">
  <div class="wrap trust-split">
    <div>
      <div class="kicker">${esc(t("trust_kicker"))}</div>
      <h2 id="trust-h">${esc(t("trust_title"))}</h2>
      <p class="muted">${esc(t("trust_lead"))}</p>
      <ul class="trust-list">
        ${item('<path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>', t("trust_i1_t"), t("trust_i1_d"))}
        ${item('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>', t("trust_i2_t"), t("trust_i2_d"))}
        ${item('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>', t("trust_i3_t"), t("trust_i3_d"))}
        ${item('<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>', t("trust_i4_t"), t("trust_i4_d"))}
      </ul>
    </div>
    <aside class="trust-panel">
      <h3><span class="shield"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/></svg></span><span>${esc(t("trust_panel_t"))}</span></h3>
      <p class="muted" style="margin-top:12px">${esc(t("trust_panel_lead"))}</p>
      <ul>
        <li>${esc(t("trust_panel_1"))}</li>
        <li>${esc(t("trust_panel_2"))}</li>
        <li>${esc(t("trust_panel_3"))}</li>
      </ul>
      <p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/privacy-policy.html">${esc(t("trust_privacy_btn"))}</a></p>
    </aside>
  </div>
</section>`;
}

export const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7];

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
          <div class="phone-track" id="hero-shots">
            <img src="/assets/screens/pl_home.webp" width="618" height="1340" alt="${esc(t("shot_home"))}" loading="lazy" decoding="async">
            <img src="/assets/screens/pl_calc.webp" width="618" height="1340" alt="${esc(t("shot_calc"))}" loading="lazy" decoding="async">
            <img src="/assets/screens/pl_stores.webp" width="618" height="1340" alt="${esc(t("shot_stores"))}" loading="lazy" decoding="async">
          </div>
        </div>
        <div class="phone-dots" id="hero-dots" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ calculator hub */

export function calcHubMain(lang, t, calcs) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("calchub_title"), path: urlCalcIndex(lang) },
  ]);
  const groups = TABS.map((tab) => {
    const list = calcs.filter((c) => c.tab === tab);
    return `<section class="block${TABS.indexOf(tab) % 2 ? " alt" : ""}" aria-labelledby="g-${tab}">
    <div class="wrap">
      <h2 id="g-${tab}" class="calc-group">${esc(t(`tab_${tab}`))}</h2>
      <div class="calc-links">${list.map((c) => calcLinkCard(c, lang, t)).join("")}</div>
    </div>
  </section>`;
  }).join("\n  ");

  const main = `<main id="main">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("calchub_title"))}</h1>
      <p class="lead">${esc(t("calchub_lead"))}</p>
    </div>
  </section>
  ${groups}
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

export function calcPageMain(calc, lang, t, { example, formula, materials = 0, guides = [] }) {
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

  const exampleRows = example.rows
    .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");

  const related = (meta.related || [])
    .filter((id) => CALC_SLUG[id])
    .map((id) => `<a class="chip" href="${urlCalc(lang, id)}">${esc(t(`c_${id}_t`))}</a>`).join("");

  // The guides link down to the calculators; without this the trail only ran one way.
  const guideLinks = guides
    .filter((g) => g.calcs.includes(calc.id))
    .map((g) => `<a class="chip" href="${urlGuide(lang, g)}">${esc(t(`g_${g.id}_t`))}</a>`).join("");

  const main = `<main id="main">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(name)}</h1>
      <p class="lead">${esc(t(`c_${calc.id}_d`))} ${esc(t("calc_page_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap calc-page">
      <div class="calc-page-form">
        ${calcCard(calc, t, { heading: "h2", materials })}
        ${materials ? `<p class="muted src-note"><a href="${urlMaterials(lang)}">${esc(t("matpage_title"))}</a> — ${esc(materials)} ${esc(t("mat_count_label"))}</p>` : ""}
      </div>
      <div class="calc-page-how">
        <h2>${esc(t("hwc_title"))}</h2>

        <h3>${esc(t("hwc_inputs"))}</h3>
        <ul class="plain-list">${inputs}</ul>

        <h3>${esc(t("hwc_formula"))}</h3>
        <pre class="formula"><code>${formula.map(esc).join("\n")}</code></pre>

        <h3>${esc(t("hwc_example"))}</h3>
        <p class="muted">${esc(t("hwc_example_lead"))}</p>
        <div class="result show">
          <div class="muted" style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(t("res_tobuy"))}</div>
          <div class="big">${esc(example.tobuy)} <span style="font-size:1rem;font-weight:600">${esc(example.unit)}</span></div>
          <div class="rows">${exampleRows}</div>
        </div>

        <h3>${esc(t("hwc_note"))}</h3>
        <p>${esc(t(`note_${calc.id}`))}</p>

        <p class="muted src-note">${esc(t("hwc_source"))}</p>
      </div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <h2>${esc(t("calc_related"))}</h2>
      <div class="chips">${related}</div>
      ${guideLinks ? `<h2 style="margin-top:28px">${esc(t("guide_calcs_back"))}</h2>
      <div class="chips">${guideLinks}</div>` : ""}
      <p style="margin-top:20px">
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

  const main = `<main id="main">
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

  const main = `<main id="main">
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

      <p style="margin-top:24px"><a class="btn btn-ghost" href="${urlGuideIndex(lang)}">${esc(t("guide_all"))}</a></p>
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

  const main = `<main id="main">
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
        <p class="muted" style="margin-top:10px">${cat.total} ${esc(t("mat_count_label"))} · ${esc(t("matpage_note"))}</p>
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
  { name: "materio-redirected", type: "ck_type_session", purpose: "ck_p_redirect", life: "ck_life_session" },
  { name: "materio-workspace-v1", type: "ck_type_local", purpose: "ck_p_workspace", life: "ck_life_until_cleared" },
  { name: "materio-active-project", type: "ck_type_local", purpose: "ck_p_active", life: "ck_life_until_cleared" },
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
        <th>${esc(t("ck_col_name"))}</th>
        <th>${esc(t("ck_col_type"))}</th>
        <th>${esc(t("ck_col_purpose"))}</th>
        <th>${esc(t("ck_col_life"))}</th>
      </tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td><code>${esc(r.name)}</code></td>
        <td>${esc(t(r.type))}</td>
        <td>${esc(t(r.purpose))}</td>
        <td>${esc(t(r.life))}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;

  const main = `<main id="main">
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

  const main = `<main id="main">
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
          <div class="phone-track" id="hero-shots">
            <img src="/assets/screens/pl_home.webp" width="618" height="1340" alt="${esc(t("shot_home"))}" decoding="async">
            <img src="/assets/screens/pl_calc.webp" width="618" height="1340" alt="${esc(t("shot_calc"))}" loading="lazy" decoding="async">
            <img src="/assets/screens/pl_stores.webp" width="618" height="1340" alt="${esc(t("shot_stores"))}" loading="lazy" decoding="async">
          </div>
        </div>
        <div class="phone-dots" id="hero-dots" aria-hidden="true"></div>
      </div>
    </div>
  </section>

  <section class="block" style="padding-top:8px">
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
 */
export function projectsMain(lang, t) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("wspage_title"), path: urlProjects(lang) },
  ]);

  const main = `<main id="main">
  <section class="block page-head">
    <div class="wrap">
      ${crumbs.nav}
      <h1>${esc(t("wspage_title"))}</h1>
      <p class="lead">${esc(t("wspage_lead"))}</p>
    </div>
  </section>

  <section class="block alt" id="ws-page">
    <div class="wrap narrow">
      <h2>${esc(t("ws_projects"))}</h2>
      <p class="muted">${esc(t("wspage_projects_d"))}</p>
      <form id="ws-project-form" class="inline-form">
        <input id="ws-project-name" type="text" maxlength="120" placeholder="${esc(t("ws_new_project"))}" required>
        <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
      </form>
      <ul id="ws-project-list" class="data-list"></ul>

      <h2 style="margin-top:36px">${esc(t("ws_rooms"))}</h2>
      <p class="muted">${esc(t("wspage_rooms_d"))}</p>
      <form id="ws-room-form" class="inline-form">
        <input id="ws-room-name" type="text" maxlength="120" placeholder="${esc(t("ws_new_room"))}" required>
        <input id="ws-room-length" type="text" inputmode="decimal" value="5" aria-label="${esc(t("fld_length"))}">
        <input id="ws-room-width" type="text" inputmode="decimal" value="4" aria-label="${esc(t("fld_width"))}">
        <input id="ws-room-height" type="text" inputmode="decimal" value="2.6" aria-label="${esc(t("fld_height"))}">
        <button type="submit" class="btn btn-primary btn-sm">${esc(t("app_add"))}</button>
      </form>
      <ul id="ws-room-list" class="data-list"></ul>

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

/** /kosztorys/ — the saved lines of the active project, priced, printable to PDF. */
export function estimateMain(lang, t) {
  const crumbs = breadcrumbs([
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("estpage_title"), path: urlEstimate(lang) },
  ]);

  const main = `<main id="main">
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
            <h2 id="ws-estimate-title"></h2>
          </div>
          <div class="ws-estimate-meta">
            <span id="ws-estimate-date"></span>
            <span id="ws-estimate-count"></span>
          </div>
        </header>
        <table class="ws-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${esc(t("ws_col_name"))}</th>
              <th class="num">${esc(t("ws_col_qty"))}</th>
              <th class="num">${esc(t("ws_col_cost"))}</th>
              <th class="no-print"></th>
            </tr>
          </thead>
          <tbody id="ws-estimate-rows"></tbody>
        </table>
        <p class="ws-estimate-total"><span>${esc(t("share_total"))}</span> <b id="ws-estimate-total"></b></p>
        <p class="muted ws-estimate-mixed" id="ws-estimate-mixed" hidden>${esc(t("ws_mixed_currency"))}</p>
        <p class="muted ws-estimate-foot">${esc(t("est_foot"))}</p>
      </article>

      <div class="no-print ws-add-line">
        <h3>${esc(t("ws_add_line"))}</h3>
        <p class="muted">${esc(t("ws_add_line_d"))}</p>
        <form id="ws-line-form" class="inline-form">
          <input id="ws-line-name" type="text" maxlength="120" placeholder="${esc(t("ws_col_name"))}" required>
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

  const main = `<main id="main">
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
          <button id="find-near" type="button" class="btn btn-primary" style="width:100%;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>
            <span>${esc(t("stores_near"))}</span>
          </button>
          <p class="store-status" id="store-status" role="status" aria-live="polite"></p>
          <ul id="store-list" class="store-list" aria-label="${esc(t("storespage_title"))}"></ul>
          <button id="store-more" class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:4px" hidden></button>

          <div class="store-search-block">
            <form id="store-search" role="search">
              <label for="store-q" class="fld-label">${esc(t("stores_q_label"))}</label>
              <div class="search-row">
                <input id="store-q" type="search" placeholder="${esc(t("stores_q_ph"))}" autocomplete="off">
                <button class="btn btn-ghost" type="submit">${esc(t("stores_show_map"))}</button>
              </div>
            </form>
            <p class="muted" style="font-size:.85rem;margin-top:10px">${esc(t("stores_examples"))}</p>
            <div class="chips" style="margin-top:8px">${chips}</div>
          </div>
          <p class="muted" style="font-size:.82rem;margin-top:16px">${esc(t("stores_note"))}</p>
        </div>
      </div>
    </div>
  </section>
  ${appNote(t)}
</main>`;

  return { main, ld: crumbs.ld };
}
