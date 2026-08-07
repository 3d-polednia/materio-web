/* Materio website — the <main> of every page type.

   Each function returns markup only; `template.page()` wraps it in the shared shell.
   Calculator forms are rendered here, server-side, with the labels already translated,
   so a crawler (and a visitor with JavaScript off) sees the real fields. The browser
   only attaches the handlers afterwards — see wireCalculator() in assets/calculators.js. */

import { esc, calcIcon, playBadge, breadcrumbs } from "./template.mjs";
import {
  urlHome, urlCalcIndex, urlCalc, urlGuideIndex, urlGuide, urlStores,
  CALC_SLUG, PLAY_URL, URL_APP,
} from "./site.mjs";
import { CALC_META, FORMULA_I18N, FORMULA_UNITS, DECIMAL_POINT } from "./calc-meta.mjs";

const TABS = ["surface", "cutting", "trade", "framing"];

/* ------------------------------------------------------------------ calculator form */

/** The interactive card for one calculator, with every label already in `lang`. */
export function calcCard(calc, t, { heading = "h2" } = {}) {
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

  return `<div class="calc" data-calc="${calc.id}" data-tab="${calc.tab}">
      <${heading}><span class="ico">${calcIcon}</span><span>${esc(t(`c_${calc.id}_t`))}</span></${heading}>
      <p class="desc">${esc(t(`c_${calc.id}_d`))}</p>
      ${chips}${fields}
      <button type="button" class="btn btn-primary" data-run>${esc(t("act_calc"))}</button>
      <div class="result" data-result></div>
    </div>`;
}

/** A link card used on the home page and the calculator hub. */
function calcLinkCard(calc, lang, t) {
  return `<a class="calc-link" href="${urlCalc(lang, calc.id)}">
      <span class="ico">${calcIcon}</span>
      <span class="calc-link-body">
        <b>${esc(t(`c_${calc.id}_t`))}</b>
        <span class="muted">${esc(t(`c_${calc.id}_d`))}</span>
      </span>
      <span class="calc-link-go">${esc(t("calc_open"))}</span>
    </a>`;
}

/* ------------------------------------------------------------------ home */

export function homeMain(lang, t, calcs) {
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
      ${calcCard(calcs.find((c) => c.id === "coverage"), t, { heading: "h2" })}
    </div>
  </div>
</section>

<section class="block" aria-label="Materio" style="padding-top:8px">
  <div class="wrap">
    <div class="stat-band">
      <div class="stat"><div class="num">${esc(t("stat_price"))}</div><div class="lbl">${esc(t("stat_free_lbl"))}</div></div>
      <div class="stat"><div class="num">${calcs.length}</div><div class="lbl">${esc(t("stat_calc_lbl"))}</div></div>
      <div class="stat"><div class="num">150+</div><div class="lbl">${esc(t("stat_catalog_lbl"))}</div></div>
      <div class="stat"><div class="num">10</div><div class="lbl">${esc(t("stat_langs_lbl"))}</div></div>
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
    <p class="center" style="margin-top:24px"><a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a></p>
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
    <p class="center" style="margin-top:24px"><a class="btn btn-ghost" href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a></p>
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
        <div class="phone" aria-roledescription="carousel" aria-label="Materio">
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

export function calcPageMain(calc, lang, t, { example, formula }) {
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
        ${calcCard(calc, t, { heading: "h2" })}
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
      <p style="margin-top:20px"><a class="btn btn-ghost" href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a></p>
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
