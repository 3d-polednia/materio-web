/* Materio website — the page shell every generated page shares.

   One <head>, one header, one footer, one consent banner. Pages differ only in the
   <main> they pass in, the metadata they declare and the scripts they ask for, so a
   change to the chrome lands on all ~210 pages at once instead of drifting between
   them. Nothing here runs in the browser; it produces plain HTML strings. */

import {
  BASE, LANGS, DEFAULT_LANG, HREFLANG, OG_LOCALE, SECTION,
  urlHome, urlCalcIndex, urlGuideIndex, urlStores, urlMaterials, urlProjects, urlEstimate,
  urlAndroid,
  URL_PRIVACY, URL_APP, PLAY_URL,
} from "./site.mjs";

export const GA_ID = "G-22PS16K79V";

/** Escape for text nodes and double-quoted attributes. */
export const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

/** JSON-LD must not be able to close its own <script>. */
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");

const ICON = {
  cut: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
  play: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.3 13.5 12 3.6 21.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Zm11.3 11 2.6 2.6-3.2 1.8-2-2 2.6-2.4Zm0-2.6L12.3 8.3l3.2-1.8L18.1 8l-3.2 2.7ZM16 12l4 2.3c.7.4.7 1.4 0 1.8"/></svg>',
  menu: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
};

export const playBadge = (t, loc, cls = "gp-badge") => `
  <a class="${cls}" href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="${loc}" aria-label="${esc(t("hero_download"))}">
    ${ICON.play}
    <span><small>${esc(t("gp_getit"))}</small><b>${esc(t("hero_download"))}</b></span>
  </a>`;

export const calcIcon = ICON.cut;

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
<meta name="author" content="Materio">
<meta name="robots" content="${p.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#626b38" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#12140d" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-title" content="Materio">
<meta name="application-name" content="Materio">
<link rel="canonical" href="${esc(canonical)}">
${hreflangs}
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/assets/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Materio">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${BASE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Materio — Policz. Kup. Nie marnuj.">
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
${bare ? main : `${header(lang, t)}\n${main}\n${footer(lang, t)}\n${consentBanner(t)}`}
${bare ? "" : `<script>window.MATERIO_ALTERNATES = ${altJson};</script>`}
<script src="/assets/i18n.${bare ? "all" : lang}.js?v=${stamp}"></script>
<script src="/assets/i18n-runtime.js?v=${stamp}"></script>
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

function header(lang, t) {
  return `<header class="site">
  <div class="wrap nav">
    <a class="brand" href="${urlHome(lang)}"><img class="logo" src="/assets/icon-192.png" alt="" width="32" height="32">Materio</a>
    <button id="menu-toggle" class="menu-toggle" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">${ICON.menu}</button>
    <nav id="nav-links" class="nav-links" aria-label="${esc(t("nav_calc"))}">
      <a href="${urlCalcIndex(lang)}">${esc(t("nav_calc"))}</a>
      <a href="${urlMaterials(lang)}">${esc(t("nav_materials"))}</a>
      <a href="${urlProjects(lang)}">${esc(t("nav_projects"))}</a>
      <a href="${urlGuideIndex(lang)}">${esc(t("nav_guides"))}</a>
      <a href="${urlStores(lang)}">${esc(t("nav_stores"))}</a>
      <a href="${urlAndroid(lang)}">${esc(t("nav_app_page"))}</a>
      <select id="lang-select" class="lang-select" aria-label="Język / Language"></select>
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
        <div class="brand"><img class="logo" src="/assets/icon-192.png" alt="" width="32" height="32">Materio</div>
        <p class="muted">${esc(t("foot_tagline"))}</p>
      </div>
      <div>
        <h4>${esc(t("foot_product"))}</h4>
        <ul>
          <li><a href="${urlCalcIndex(lang)}">${esc(t("foot_calc_all"))}</a></li>
          <li><a href="${urlMaterials(lang)}">${esc(t("nav_materials"))}</a></li>
          <li><a href="${urlProjects(lang)}">${esc(t("nav_projects"))}</a></li>
          <li><a href="${urlEstimate(lang)}">${esc(t("estpage_title"))}</a></li>
          <li><a href="${urlGuideIndex(lang)}">${esc(t("foot_guides"))}</a></li>
          <li><a href="${urlStores(lang)}">${esc(t("nav_stores"))}</a></li>
          <li><a href="${urlHome(lang)}#faq">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4>${esc(t("foot_legal"))}</h4>
        <ul>
          <li><a href="${URL_PRIVACY}">${esc(t("foot_privacy"))}</a></li>
          <li><a href="${urlAndroid(lang)}">${esc(t("nav_app_page"))}</a></li>
          <li><a href="${URL_APP}" rel="nofollow">${esc(t("nav_app"))}</a></li>
          <li><a href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="footer">Google Play</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© <span data-year>2026</span> Materio. ${esc(t("foot_rights"))}</span>
      <span>${esc(t("foot_disclaimer"))}</span>
    </div>
  </div>
</footer>`;
}

function consentBanner(t) {
  return `<div id="consent-banner" class="consent-banner" role="dialog" aria-label="${esc(t("consent_accept"))}" hidden>
  <p class="consent-text">${esc(t("consent_text"))}</p>
  <div class="consent-actions">
    <a class="consent-more" href="${URL_PRIVACY}">${esc(t("consent_more"))}</a>
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
