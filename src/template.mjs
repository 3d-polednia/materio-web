/* LiczMat website — the page shell every generated page shares.

   One <head>, one header, one footer, one consent banner. Pages differ only in the
   <main> they pass in, the metadata they declare and the scripts they ask for, so a
   change to the chrome lands on all 130 pages at once instead of drifting between
   them. Nothing here runs in the browser; it produces plain HTML strings. */

import {
  BASE, LANGS, DEFAULT_LANG, HREFLANG, OG_LOCALE, SECTION,
  urlHome, urlAndroid, urlCookies,
  URL_PRIVACY, URL_APP, PLAY_URL,
} from "./site.mjs";
import { FLAG, LANG_NAME } from "./flags.mjs";
import { CURRENCIES, DEFAULT_CURRENCY } from "./currency.mjs";
import { navRoutes } from "./ia.mjs";

export const GA_ID = "G-22PS16K79V";

/** Escape for text nodes and double-quoted attributes. */
export const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

/** JSON-LD must not be able to close its own <script>. */
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");

/** The scissors, as bare paths: the cutting calculators use them, so does the fallback. */
const ICON_CUT_PATH = '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>';

/* The LiczMat mark, inline so the "M" can follow the text colour of whichever theme is
   on. The lime half is fixed: it is the brand colour, not a themed surface. The same
   geometry is in assets/logo-mark.svg, which is what the PNG icons are rendered from. */
export const LOGO_MARK = `<svg class="logo" viewBox="-1 -1 36 34" width="30" height="28" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="butt" stroke-linejoin="miter"><g stroke="currentColor" stroke-width="3.05"><path d="M1.6 0V7.5L17 25.2L32.4 7.5V0"/><path d="M4.5 0L17 16.4L29.5 0"/></g><g stroke="var(--brand-lime)"><path d="M1.75 12V30H17.4" stroke-width="3.5"/><path d="M32.3 12.4V31.6" stroke-width="2"/><g stroke-width="2"><path d="M28.8 16.6H32.3"/><path d="M30.8 20.2H32.3"/><path d="M28.8 23.8H32.3"/><path d="M30.8 27.4H32.3"/><path d="M28.8 31H32.3"/></g></g></g></svg>`;

const ICON = {
  cut: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICON_CUT_PATH}</svg>`,
  play: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.3 13.5 12 3.6 21.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Zm11.3 11 2.6 2.6-3.2 1.8-2-2 2.6-2.4Zm0-2.6L12.3 8.3l3.2-1.8L18.1 8l-3.2 2.7ZM16 12l4 2.3c.7.4.7 1.4 0 1.8"/></svg>',
  menu: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  // Both glyphs ship; CSS shows the one that matches the theme in force.
  sun: '<svg class="ico-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>',
  chevron: '<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  moon: '<svg class="ico-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.8 6.8 0 0 0 10.8 10.8Z"/></svg>',
};

/**
 * The language picker: a flag and the language's own name, one row per language.
 *
 * Every entry is a real link to that language's URL for this very page, so it works
 * before any script runs and a crawler can follow it — that is what makes the other
 * three languages indexable. `assets/i18n-runtime.js` only opens and closes the menu and
 * remembers the choice.
 *
 * @param {object} alternates { lang: path } for this page; missing languages are dropped.
 */
export function langPicker(lang, t, alternates) {
  const langs = LANGS.filter((l) => l === lang || (alternates && alternates[l]));

  const row = (l) => `<span class="flag">${FLAG[l]}</span><span>${esc(LANG_NAME[l])}</span>`;
  const items = langs.map((l) => (l === lang
    ? `<li><span class="lang-item is-current" aria-current="true">${row(l)}</span></li>`
    : `<li><a class="lang-item" href="${esc(alternates[l])}" hreflang="${HREFLANG[l]}" lang="${HREFLANG[l]}" data-lang="${l}">${row(l)}</a></li>`
  )).join("\n      ");

  return `<div class="lang-picker" id="lang-picker">
    <button type="button" class="lang-btn" id="lang-toggle" aria-expanded="false" aria-controls="lang-menu" aria-label="${esc(t("lang_label"))}">
      <span class="flag">${FLAG[lang]}</span><span class="lang-btn-name">${esc(LANG_NAME[lang])}</span>${ICON.chevron}
    </button>
    <ul class="lang-menu" id="lang-menu" hidden>
      ${items}
    </ul>
  </div>`;
}

/**
 * The currency picker. Language and currency are independent (master plan VI), so this is
 * a separate control and nothing about it follows from the URL's language — it only
 * starts at that language's default until the visitor chooses.
 *
 * Plain codes, no flags: EUR belongs to twenty countries, and a flag would pick one.
 */
export function currencyPicker(lang, t) {
  const current = DEFAULT_CURRENCY[lang] || CURRENCIES[0];
  const options = CURRENCIES
    .map((c) => `<option value="${c}"${c === current ? " selected" : ""}>${c}</option>`).join("");
  return `<select id="currency-select" class="cur-select" aria-label="${esc(t("cur_label"))}" title="${esc(t("cur_label"))}">${options}</select>`;
}

export const themeToggle = (t) =>
  `<button id="theme-toggle" class="theme-toggle" type="button" aria-label="${esc(t("theme_toggle"))}" title="${esc(t("theme_toggle"))}">${ICON.sun}${ICON.moon}</button>`;

export const playBadge = (t, loc, cls = "gp-badge") => `
  <a class="${cls}" href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="${loc}" aria-label="${esc(t("hero_download"))}">
    ${ICON.play}
    <span><small>${esc(t("gp_getit"))}</small><b>${esc(t("hero_download"))}</b></span>
  </a>`;

/**
 * One icon per calculator, keyed by the id in CALCS.
 *
 * Every calculator used to show the same pair of scissors, which is right for the two
 * cutting optimisers and meaningless on paint or grout. These are stroke paths on the
 * shared 24×24 grid; `calcIcon()` wraps whichever one the calculator asks for.
 */
const CALC_PATHS = {
  // Surfaces: a roller, a tiled field, a roll of paper.
  coverage: '<rect x="3" y="4" width="12" height="5" rx="1"/><path d="M15 6.5h4a2 2 0 0 1 2 2V11a2 2 0 0 1-2 2h-6v3"/><rect x="10.5" y="16" width="5" height="6" rx="1"/>',
  waste: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  wallpaper: '<path d="M6 3h12v16a3 3 0 0 1-3 3H6Z"/><path d="M6 22a3 3 0 0 1 0-6h9"/><path d="M10 7h4M10 11h4"/>',
  // Cutting: the scissors keep the two jobs they actually describe.
  linear: ICON_CUT_PATH,
  sheet: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M11 4v16M3 12h8M11 8h10"/>',
  // Trade: a bag, a trowel, a screed bar, a grout joint, a brick bond, layered insulation.
  concrete: '<path d="M8 3h8l2 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Z"/><path d="M9 3c1 1.5 5 1.5 6 0"/><path d="M9 13h6"/>',
  mortar: '<path d="M14 3 21 10l-6 2-3-3Z"/><path d="m11 9-8 8 4 4 8-8"/>',
  screed: '<path d="M3 16h18"/><path d="M5 16V9l7-4 7 4v7"/><path d="M3 20h18"/>',
  grout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18" stroke-dasharray="3 2"/>',
  masonry: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9.3h18M3 14.6h18M9 4v5.3M15 9.3v5.3M9 14.6V20"/>',
  insulation: '<path d="M3 7h18M3 12h18M3 17h18"/><path d="M6 7v10M12 7v10M18 7v10" stroke-dasharray="2 3"/>',
  // Framing: a stud wall, a ceiling grid, boards on dabs, sheathing.
  studwall: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 3v18M13 3v18M18 3v18"/>',
  ceiling: '<path d="M3 6h18"/><path d="M6 6v12M12 6v12M18 6v12"/><path d="M3 18h18"/>',
  drylining: '<rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="8" cy="8" r="1.4"/><circle cx="16" cy="8" r="1.4"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/>',
  sheathing: '<rect x="2" y="6" width="20" height="5" rx="1"/><rect x="2" y="13" width="20" height="5" rx="1"/><path d="M9 6v5M15 13v5"/>',
};

/** The icon for one calculator; the scissors are the fallback for an unmapped id. */
export const calcIcon = (id) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CALC_PATHS[id] || ICON_CUT_PATH}</svg>`;

/**
 * Render one page.
 *
 * @param {object} p
 * @param {string} p.lang          language code
 * @param {(k:string)=>string} p.t translator bound to that language
 * @param {string} p.title         <title> and og:title
 * @param {string} p.description   meta description and og:description
 * @param {string} p.path          this page's absolute path, e.g. "/kalkulatory/tapety/"
 * @param {object} p.alternates    { lang: path } for hreflang and the language switcher
 * @param {string} p.main          the <main> markup
 * @param {object[]} [p.jsonld]    schema.org objects
 * @param {string[]} [p.scripts]   extra script srcs, appended after the shared ones
 * @param {boolean} [p.noindex]    emit robots noindex instead of index
 * @param {string} [p.bodyClass]
 * @param {string} [p.headExtra]
 * @param {string} [p.bodyEnd]
 * @param {string} p.stamp         cache-busting ?v= value
 */
export function page(p) {
  const { lang, t, title, description, path, alternates, main, stamp } = p;
  const canonical = BASE + path;
  const scripts = p.scripts || [];
  const jsonldBlocks = (p.jsonld || [])
    .map((o) => `<script type="application/ld+json">\n${jsonLd(o)}\n</script>`).join("\n");

  // `bare` pages (/app/, /p/) bring their own header and footer, have no per-language
  // URLs and therefore no hreflang; they load the full dictionary and translate in place.
  const bare = Boolean(p.bare);

  const hreflangs = bare ? "" : LANGS
    .filter((l) => alternates[l])
    .map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${esc(BASE + alternates[l])}">`)
    .concat(alternates[DEFAULT_LANG]
      ? [`<link rel="alternate" hreflang="x-default" href="${esc(BASE + alternates[DEFAULT_LANG])}">`]
      : [])
    .join("\n");

  // The switcher navigates between the per-language URLs instead of rewriting the DOM,
  // so every language has a real, indexable address.
  const altJson = jsonLd(alternates);

  return `<!DOCTYPE html>
<html lang="${HREFLANG[lang]}">
<head>
<!-- Theme, applied before the first paint so a dark-mode visitor never sees a white
     flash. No stored choice means "follow the system", which is also the CSS default. -->
<script>
  try {
    var m = localStorage.getItem('liczmat-theme');
    if (m === 'dark' || m === 'light') document.documentElement.setAttribute('data-theme', m);
  } catch (e) {}
</script>
<!-- Google tag (gtag.js) with Consent Mode v2 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  // GDPR: analytics stays off until the visitor agrees (see consent banner).
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });
  // Re-apply a previously saved "accept" as early as possible.
  try {
    if (localStorage.getItem('materio_consent') === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  } catch (e) {}

  gtag('config', '${GA_ID}');
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- The analytics tag is the only third-party request a public page makes; opening the
     connection alongside the HTML keeps it off the render path. -->
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="LiczMat">
<meta name="robots" content="${p.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#faf7f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#060c12" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-title" content="LiczMat">
<meta name="application-name" content="LiczMat">
<link rel="canonical" href="${esc(canonical)}">
${hreflangs}
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/assets/favicon.svg?v=${stamp}" type="image/svg+xml">
<link rel="icon" href="/assets/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LiczMat">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${BASE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="LiczMat — Policz. Kup. Nie marnuj.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${BASE}/assets/og-image.jpg">
<link rel="stylesheet" href="/assets/styles.css?v=${stamp}">
${jsonldBlocks}
${p.headExtra || ""}
</head>
<body${p.bodyClass ? ` class="${p.bodyClass}"` : ""}>
<a class="skip-link" href="#main">${esc(t("skip_main"))}</a>
${bare ? main : `${header(lang, t, alternates)}\n${main}\n${footer(lang, t)}\n${consentBanner(lang, t)}`}
${bare ? "" : `<script>window.LICZMAT_ALTERNATES = ${altJson};</script>`}
<script src="/assets/i18n.${bare ? "all" : lang}.js?v=${stamp}"></script>
<script src="/assets/i18n-runtime.js?v=${stamp}"></script>
<script src="/assets/currency.js?v=${stamp}"></script>
${(p.classicScripts || []).map((s) => `<script src="${s}?v=${stamp}"></script>`).join("\n")}
${scripts.map((s) => {
    const attrs = s.endsWith(".mjs") || p.moduleScripts ? ' type="module"' : "";
    return `<script${attrs} src="${s}${s.includes("?") ? "" : `?v=${stamp}`}"></script>`;
  }).join("\n")}
<script src="/assets/main.js?v=${stamp}"></script>
${p.bodyEnd || ""}
</body>
</html>
`;
}

/**
 * The main navigation and the footer's product column both come out of `ROUTES` in
 * src/ia.mjs, in the order the architecture gives them. A page that is not declared
 * there cannot show up in the menu, and a link here cannot point at a page that does
 * not exist — src/ia.mjs holds the URL, the label key and the position in one place.
 */
const navLinks = (slot, lang, t) => navRoutes(slot)
  .map((r) => `<a href="${r.path(lang)}">${esc(t(r[slot].key))}</a>`);

function header(lang, t, alternates) {
  return `<header class="site">
  <div class="wrap nav">
    <a class="brand" href="${urlHome(lang)}">${LOGO_MARK}<span>LiczMat</span></a>
    ${themeToggle(t)}
    <button id="menu-toggle" class="menu-toggle" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">${ICON.menu}</button>
    <nav id="nav-links" class="nav-links" aria-label="${esc(t("nav_calc"))}">
      ${navLinks("header", lang, t).join("\n      ")}
      <div class="pickers">
        ${langPicker(lang, t, alternates)}
        ${currencyPicker(lang, t)}
      </div>
      <a class="btn btn-primary btn-sm" href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a>
    </nav>
  </div>
</header>`;
}

function footer(lang, t) {
  return `<footer class="site">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="brand">${LOGO_MARK}<span>LiczMat</span></div>
        <p class="muted">${esc(t("foot_tagline"))}</p>
      </div>
      <div>
        <h4>${esc(t("foot_product"))}</h4>
        <ul>
          ${navLinks("footer", lang, t).map((a) => `<li>${a}</li>`).join("\n          ")}
          <li><a href="${urlHome(lang)}#faq">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4>${esc(t("foot_legal"))}</h4>
        <ul>
          <li><a href="${URL_PRIVACY}">${esc(t("foot_privacy"))}</a></li>
          <li><a href="${urlCookies(lang)}">${esc(t("foot_cookies"))}</a></li>
          <li><a href="${urlAndroid(lang)}">${esc(t("nav_app_page"))}</a></li>
          <li><a href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a></li>
          <li><a href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="footer">Google Play</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© <span data-year>2026</span> LiczMat. ${esc(t("foot_rights"))}</span>
      <span>${esc(t("foot_disclaimer"))}</span>
    </div>
  </div>
</footer>`;
}

function consentBanner(lang, t) {
  return `<div id="consent-banner" class="consent-banner" role="dialog" aria-label="${esc(t("consent_accept"))}" hidden>
  <p class="consent-text">${esc(t("consent_text"))}</p>
  <div class="consent-actions">
    <a class="consent-more" href="${URL_PRIVACY}">${esc(t("consent_more"))}</a>
    <a class="consent-more" href="${urlCookies(lang)}">${esc(t("foot_cookies"))}</a>
    <button type="button" id="consent-reject" class="btn btn-ghost btn-sm">${esc(t("consent_reject"))}</button>
    <button type="button" id="consent-accept" class="btn btn-primary btn-sm">${esc(t("consent_accept"))}</button>
  </div>
</div>`;
}

/** Breadcrumb trail plus the matching schema.org BreadcrumbList. */
export function breadcrumbs(items) {
  const nav = `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((it, i) =>
    i === items.length - 1
      ? `<li aria-current="page">${esc(it.name)}</li>`
      : `<li><a href="${esc(it.path)}">${esc(it.name)}</a></li>`
  ).join("")}</ol></nav>`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: BASE + it.path,
    })),
  };
  return { nav, ld };
}

/** The section id used by anchors that used to live on the single-page site. */
export const SECTION_NAMES = SECTION;
