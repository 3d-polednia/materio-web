/* LiczMat website — the page shell every generated page shares.

   One <head>, one header, one footer, one consent banner. Pages differ only in the
   <main> they pass in, the metadata they declare and the scripts they ask for, so a
   change to the chrome lands on all 130 pages at once instead of drifting between
   them. Nothing here runs in the browser; it produces plain HTML strings. */

import {
  BASE, LANGS, DEFAULT_LANG, HREFLANG, OG_LOCALE, SECTION,
  urlHome, urlAndroid, urlCookies, urlContact, ENTITY,
  URL_PRIVACY, URL_APP, PLAY_URL,
} from "./site.mjs";
import { FLAG, LANG_NAME } from "./flags.mjs";
import { CURRENCIES, DEFAULT_CURRENCY } from "./currency.mjs";
import { navRoutes, currentNavRoute } from "./ia.mjs";

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
export const LOGO_MARK = `<svg class="logo" viewBox="67.75 577 372 372" width="30" height="30" aria-hidden="true" focusable="false"><g transform="translate(0, 1024) scale(0.1, -0.1)"><path fill="currentColor" d="M740 3935 l0-534 108-123 c59-68 121-139 137-159 17-20 91-105 166-190 125-142 269-311 444-519 39-46 96-115 129-153 65-77 260-312 381-462 44-54 103-126 131-159 27-34 105-130 173-213 67-84 126-153 131-153 4 0 79 88 166 197 88 108 184 226 214 263 30 37 73 89 95 116 22 27 92 112 155 189 63 77 141 172 175 211 33 39 94 111 135 160 42 49 143 167 225 263 83 96 166 193 185 215 19 23 128 148 242 278 l208 238 0 535 0 535-297 0-298-1-60-86 c-33-48-78-112-101-142-22-31-130-182-239-336-109-154-225-316-257-360-32-44-115-161-184-260-70-99-166-234-214-300-48-66-100-139-115-162-15-24-31-43-34-43-4 0-70 89-146 198-77 108-247 348-378 532-131 184-338 475-460 647 l-222 312-297 1-298 0 0-535z m649-159 c123-166 288-386 366-491 78-104 226-305 329-445 104-140 212-286 241-325 28-38 87-118 130-177 43-60 81-108 84-108 4 0 29 30 56 68 77 106 512 694 704 952 368 495 617 829 638 856 l22 29 0-316 1-317-43-48 c-95-108-1029-1242-1270-1541 l-106-133-35 43 c-19 23-135 166-258 317-123 151-253 311-290 355-36 44-104 126-150 181-167 204-446 541-565 683 l-123 146 1 315 0 315 22-29 c12-16 123-164 246-330z"/><path fill="var(--brand-lime)" d="M730 2980 l0-210 70 0 c56 0 70-3 70-15 0-12-14-15-70-15-68 0-70-1-70-25 0-24 2-25 70-25 64 0 70-2 70-21 0-19-5-20-70-17-70 3-70 3-70-23 0-23 4-26 25-21 41 7 115-7 115-24 0-11-16-14-70-14-70 0-70 0-70-27 l0-28 70 3 c66 3 70 2 70-18 0-20-4-21-70-18 l-70 3 0-27 0-28 125 0 c104 0 125-2 125-15 0-13-21-15-125-15 l-125 0 0-27 0-28 70 3 c66 3 70 2 70-18 0-20-4-21-70-18-55 2-70 0-73-12-8-33 4-40 74-40 55 0 69-3 69-15 0-12-14-15-70-15-68 0-70-1-70-25 0-24 2-25 70-25 64 0 70-2 70-21 0-19-5-20-70-17 l-70 3 0-28 0-27 67 2 c57 3 68 0 71-14 3-16-5-18-67-18-69 0-71-1-71-25 l0-25 126 0 c110 0 125-2 122-16-3-14-21-16-125-16 l-123-1 0-26 c0-25 2-26 45-23 58 5 95-4 95-23 0-12-15-15-70-15-68 0-70-1-70-25 0-24 2-25 70-25 56 0 70-3 70-15 0-12-14-15-70-15-70 0-70 0-70-27 l0-28 70 3 c66 3 70 2 70-18 0-20-4-21-70-18 l-70 3 0-27 c0-28 0-28 70-28 56 0 70-3 70-15 0-12-14-15-70-15-70 0-70 0-70-27 l0-28 122 0 c109 0 123-2 126-17 3-16-8-18-122-18 l-126 0 0-25 c0-24 2-25 70-25 56 0 70-3 70-15 0-12-14-15-70-15-68 0-70-1-70-25 0-24 2-25 70-25 63 0 70-2 70-20 0-18-7-20-70-20-68 0-70-1-70-25 0-24 2-25 70-25 56 0 70-3 70-15 0-12-14-15-70-15-70 0-70 0-70-27 l0-28 71 3 c64 3 70 2 67-15-3-15-13-18-71-18-67 0-67 0-67-28 l0-28 122 3 c110 3 123 1 126-14 3-16-8-18-122-18 l-126 0 0-190 0-190 195 0 195 0 0 34 c0 54 11 96 26 96 11 0 14-17 14-65 0-62 1-65 25-65 l24 0 3 127 c3 106 6 128 18 128 12 0 15-22 18-128 l3-127 24 0 c23 0 24 4 27 65 2 36 8 65 13 65 6 0 11-29 13-65 3-62 4-65 27-65 21 0 25 5 25 28 0 54 13 102 26 102 10 0 14-17 14-65 0-63 1-65 25-65 24 0 25 2 25 65 0 58 2 65 20 65 18 0 20-7 20-65 0-63 1-65 25-65 24 0 25 2 25 65 0 50 3 65 15 65 10 0 15-16 17-63 3-55 5-62 25-65 22-3 22-1 25 125 3 112 5 128 21 131 15 3 17-8 17-127 l0-131 25 0 c24 0 25 2 25 65 0 58 2 65 20 65 18 0 20-7 20-65 0-63 1-65 25-65 24 0 25 2 25 65 0 51 3 65 15 65 12 0 15-14 15-65 l0-65 30 0 30 0 0 65 c0 51 3 65 15 65 12 0 15-14 15-65 0-63 1-65 25-65 23 0 25 3 25 49 0 59 7 81 26 81 11 0 14-16 14-65 0-62 1-65 25-65 l24 0 3 127 c3 106 6 128 18 128 13 0 15-21 15-128 l0-127 28 0 c27 0 27 1 27 65 0 51 3 65 15 65 12 0 15-14 15-65 0-63 1-65 25-65 24 0 25 2 25 65 0 58 2 65 20 65 18 0 20-7 20-65 0-63 1-65 25-65 24 0 25 2 25 65 0 51 3 65 15 65 12 0 15-14 15-65 0-65 0-65 28-65 l28 0-4 64 c-3 52-1 64 12 69 23 9 29-11 24-78-3-54-3-55 24-55 l27 0 3 128 c3 105 6 127 18 127 12 0 15-22 18-127 2-106 5-128 18-128 12 0 14 26 12 178 l-3 177-740 5-740 5-5 851-5 851-50 58 c-27 33-68 80-90 105-23 25-54 61-69 80-52 65-118 130-132 130-12 0-14-36-14-210z m229-1996 c25-32 26-47 5-79-32-49-104-20-104 41 0 23 42 64 66 64 7 0 22-12 33-26z"/><path fill="var(--brand-lime)" d="M4278 3139 c-24-28-70-81-102-116-113-122-106-102-106-305 l0-178-115-1 c-63-1-121-2-127-3-9-1-14-26-16-81-5-132-13-125 133-125 l125 0 0-105 0-105-49 0 c-29 0-53-6-60-14-8-9-11-46-9-103 l3-88 58-3 58-3-3-107-3-107-115-2 c-63-2-121-5-128-8-9-3-12-29-10-97 l3-93 125-5 125-5 3-85 c3-96-5-110-65-110 l-34 0 3-97 3-98 45-5 45-5 3-92 3-92-128-3-128-3-3-72-3-73 273 2 c150 1 209 4 131 5-135 3-143 5-143 23 0 19 7 20 141 20 139 0 140 0 137 22-3 20-8 22-60 19-67-3-98 5-98 25 0 11 17 14 80 14 79 0 80 0 80 25 0 25-1 25-80 25-64 0-80 3-80 15 0 12 16 15 80 15 79 0 80 0 80 25 0 25-1 25-80 25-64 0-80 3-80 15 0 12 16 15 80 15 l80 0 0 28 0 27-80-3 c-68-3-80-1-80 12 0 13 14 16 80 16 78 0 80 0 80 25 l0 24-142 3 c-119 3-143 5-143 18 0 13 24 15 143 18 134 2 142 4 142 22 0 18-7 20-67 20-38 0-74 4-82 9-29 18 2 31 75 31 71 0 74 1 74 23 0 22-3 23-77 22-67 0-78 2-81 18-3 17 3 18 77 15 l81-3 0 28 c0 27 0 27-54 21-64-8-106 1-106 21 0 12 16 15 80 15 79 0 80 0 80 25 0 25-1 25-80 25-64 0-80 3-80 15 0 12 16 15 80 15 79 0 80 0 80 25 l0 25-140 0 c-118 0-140 2-140 15 0 13 22 15 140 15 l140 0 0 25 c0 25-1 25-80 25-62 0-80 3-80 14 0 20 23 26 96 26 60 0 64 2 64 23 0 21-4 22-77 22-63 0-78 3-78 15 0 12 15 15 78 15 77 0 77 0 77 26 0 27-1 27-62 23-73-4-98 2-98 22 0 11 17 14 80 14 79 0 80 0 80 25 0 25-1 25-80 25-66 0-80 3-80 16 0 13 12 15 80 12 l80-3 0 28 0 27-145 0 c-122 0-145 2-145 15 0 13 23 15 145 15 l145 0 0 25 c0 25-1 25-80 25-62 0-80 3-80 14 0 10 20 16 69 21 39 4 75 4 80 0 7-4 11 4 11 19 0 26-1 26-80 26-74 0-80 1-80 21 0 19 5 20 80 17 80-3 80-3 80 22 0 25-1 25-77 25-63 0-78 3-78 15 0 12 15 15 78 15 73 0 77 1 77 23 0 21-4 22-67 22-38 0-74 4-82 9-29 18 2 31 75 31 l74 0 0 28 0 27-140 0 c-190 0-192 19-2 23 l142 3 0 379 c0 429 2 417-72 329z"/></g></svg>`;

/* What assets/og-image.jpg actually says, written out for anyone who cannot see it.
   The image has the wordmark and the slogan painted into the pixels, so this line has to
   be changed in the same commit as the image — it was left behind once already, and every
   share of every page carried the retired "Policz. Kup. Nie marnuj." for it. */
export const OG_IMAGE_ALT = "LiczMat — Policz. Zaplanuj. Zrealizuj.";

const ICON = {
  cut: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICON_CUT_PATH}</svg>`,
  play: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.3 13.5 12 3.6 21.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Zm11.3 11 2.6 2.6-3.2 1.8-2-2 2.6-2.4Zm0-2.6L12.3 8.3l3.2-1.8L18.1 8l-3.2 2.7ZM16 12l4 2.3c.7.4.7 1.4 0 1.8"/></svg>',
  // Both glyphs ship; CSS shows the one that matches the drawer's state.
  menu: '<svg class="ico-menu" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  close: '<svg class="ico-close" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>',
  // Both glyphs ship; CSS shows the one that matches the theme in force.
  sun: '<svg class="ico-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>',
  chevron: '<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  // The third state of the theme control: "follow the system". A screen with half of it
  // filled says "whatever the device says" without borrowing an operating system's icon.
  auto: '<svg class="ico-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/><path d="M12 7v7a3.5 3.5 0 0 0 0-7Z" fill="currentColor" stroke="none"/></svg>',
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
export function currencyPicker(lang, t, inPlace) {
  const current = DEFAULT_CURRENCY[lang] || CURRENCIES[0];
  const options = CURRENCIES
    .map((c) => `<option value="${c}"${c === current ? " selected" : ""}>${c}</option>`).join("");
  const i18n = inPlace ? ' data-i18n-aria="cur_label"' : "";
  return `<select id="currency-select" class="cur-select" aria-label="${esc(t("cur_label"))}" title="${esc(t("cur_label"))}"${i18n}>${options}</select>`;
}

/**
 * The theme control. **Three states, like the app's**: light, dark, and "follow the system".
 *
 * It used to be a two-state toggle with `aria-pressed`, and the third state was reachable
 * only by never having touched it — one click and a visitor could not hand the choice back
 * to their phone without clearing the site's storage. The phone has offered all three since
 * it shipped (`ThemeMode.SYSTEM/LIGHT/DARK`), so the site was the odd one out.
 *
 * `aria-pressed` is gone with the two-state model: a button with three states is not
 * pressed or unpressed. What replaces it is the label, which names the mode in force
 * ("Zmień motyw: Systemowy") and is rewritten by assets/main.js on every click and on
 * every language change. The static label is what a visitor with no script gets, and with
 * no script there is no click either.
 *
 * The three names are `theme_light` / `theme_dark` / `theme_system`, and they are the very
 * words the app's settings screen uses — copied out of its `values`/`values-xx` string
 * resources so the two products cannot call one mode two things. They are NOT written onto
 * the button: every page already downloads the dictionary, so assets/main.js reads them
 * with t() and the markup carries four fewer attributes on all 375 pages.
 */
export const themeToggle = (t, inPlace) =>
  `<button id="theme-toggle" class="theme-toggle" type="button" aria-label="${esc(t("theme_toggle"))}" title="${esc(t("theme_toggle"))}"${inPlace ? ' data-i18n-aria="theme_toggle"' : ""}>${ICON.sun}${ICON.moon}${ICON.auto}</button>`;

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
 * @param {boolean} [p.secret]     the URL itself is a credential: no analytics, no referrer
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

  // A page whose own address is the secret. /p/<token> is the only one: the token in the
  // URL *is* the credential (FIRESTORE_SYNC §6), and GA4 sends `page_location` — the whole
  // address, query and all — to Google on the first page_view. Until session 35 that
  // handed every share link to a third party. So this page ships with no analytics block
  // at all rather than with a scrubbed one, and with a referrer policy that keeps the
  // address out of the Referer header of anything it loads or links to.
  const secret = Boolean(p.secret);

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

  /* Audit item M10. Every script the site ships is a classic one, and until session 67 all
     fourteen of them sat at the end of <body> with no `defer`. The preload scanner found
     them at once, so there was no download waterfall — the cost was execution: fourteen
     files run one after another, synchronously, at the point the parser reaches them, and
     the calculator is not interactive until the last one returns.

     `defer` moves all of that behind the parse: the files are still fetched in parallel and
     still run in document order — which is the one thing this list cannot lose, main.js
     needs the dictionary and account.js before it — but nothing runs while the document is
     still being built. They move into <head> at the same time, so the fetch is asked for
     before the parser has walked the whole body rather than after.

     Type="module" scripts are deferred by their nature and take no attribute; the spec puts
     them in the same ordered list as deferred classic scripts, so mixing the two keeps the
     order written here.

     The one thing that must stay in front of them is the data they read. `LICZMAT_ALTERNATES`
     is inline, so it runs while the document parses — that is, before anything deferred —
     and `headExtra` (window.LM_NAV, window.LM_PROJ, window.LM_DASH) is emitted above this
     block for the same reason. */
  const pageScripts = [
    bare ? "" : `<script>window.LICZMAT_ALTERNATES = ${altJson};</script>`,
    bare
      ? `<!-- The ten flags, for a picker this page builds itself. Every other page has
     its picker in the markup already, so it does not download them a second time. -->
<script defer src="/assets/flags.js?v=${stamp}"></script>`
      : "",
    `<script defer src="/assets/i18n.${bare ? DEFAULT_LANG : lang}.js?v=${stamp}"></script>`,
    `<script defer src="/assets/i18n-runtime.js?v=${stamp}"></script>`,
    `<script defer src="/assets/currency.js?v=${stamp}"></script>`,
    `<!-- The session, on every page: which of chapter II's three levels this browser was
     last told it is on. Two kilobytes, no network, and it is what lets a calculator
     page word the sentence under the result without loading Firebase. -->
<script defer src="/assets/account.js?v=${stamp}"></script>`,
    (p.classicScripts || []).map((s) => `<script defer src="${s}?v=${stamp}"></script>`).join("\n"),
    scripts.map((s) => {
      const attrs = s.endsWith(".mjs") || p.moduleScripts ? ' type="module"' : " defer";
      return `<script${attrs} src="${s}${s.includes("?") ? "" : `?v=${stamp}`}"></script>`;
    }).join("\n"),
    `<script defer src="/assets/main.js?v=${stamp}"></script>`,
  ].filter(Boolean).join("\n");

  // Open Graph's own version of hreflang. og:locale says which language this page is in;
  // og:locale:alternate says the same page exists in the others, which is what lets a
  // sharing surface pick the reader's language instead of the one the link was copied in.
  // Same source as the hreflang block above, so the two cannot disagree.
  const ogAlternates = bare ? "" : LANGS
    .filter((l) => l !== lang && alternates[l])
    .map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`)
    .join("\n");

  // The analytics tag, and the name lookup that goes with it. Both are absent from a
  // `secret` page — see above.
  const analytics = secret ? "" : `<!-- Google tag (gtag.js) with Consent Mode v2.

     The library itself is fetched after the load event rather than alongside the page.
     It is the only third-party request a public page makes and it is by some distance
     the largest single download on it, and until session 33 it competed for the
     connection with the stylesheet and with the scripts the calculator actually needs
     to answer the question the visitor came with. Nothing is lost by waiting: gtag()
     is defined here, dataLayer is an array, and every call made before the library
     arrives — the consent defaults, the saved "accept", the config, an event from the
     consent banner — is queued and replayed by it in order. Consent is therefore still
     set before the library can read a cookie, which is the one thing about this block
     that must not move. -->
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

  // After the page is usable, and never before. A page restored from the back/forward
  // cache has already fired its load event, so the readyState branch is the fallback
  // that keeps this from being the one navigation that goes uncounted.
  (function () {
    var sent = false;
    function loadTag() {
      if (sent) return;
      sent = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
      document.head.appendChild(s);
    }
    if (document.readyState === 'complete') setTimeout(loadTag, 0);
    else window.addEventListener('load', function () { setTimeout(loadTag, 0); });
  })();
</script>`;
  const dnsPrefetch = secret ? "" : `<!-- The analytics tag is the only third-party request a public page makes, and since
     session 33 it is fetched after load. A preconnect would open a TLS connection during
     the render for a request that no longer happens then, and an idle connection is
     closed before it is used; the name lookup is worth keeping and costs nothing. -->
<link rel="dns-prefetch" href="https://www.googletagmanager.com">`;

  return `<!DOCTYPE html>
<html lang="${HREFLANG[lang]}">
<head>
<!-- Theme, applied before the first paint so a dark-mode visitor never sees a white
     flash. No stored choice means "follow the system", which is also the CSS default.

     data-theme-mode beside it is which of the THREE the visitor chose, as opposed to
     which of the two is on screen: "system" is the absence of a stored choice, CSS cannot
     ask about an absence, and the control's glyph has to be right on the first frame.
     Everything in this block is JavaScript, so its comments ship on all 375 pages —
     write() strips HTML comments and steps over a <script> whole. That is why the argument
     is up here and the block below says as little as it can. -->
<script>
  // "js" says the drawer, the pop-up menus and everything else that needs a script
  // will work. Without it the navigation renders as a plain list instead of hiding
  // behind a menu button nothing would answer.
  document.documentElement.className += ' js';
  try {
    var m = localStorage.getItem('liczmat-theme');
    if (m === 'dark' || m === 'light') document.documentElement.setAttribute('data-theme', m);
    document.documentElement.setAttribute('data-theme-mode', m === 'dark' || m === 'light' ? m : 'system');
    // What this browser was last told about the session (assets/account.js writes the
    // key). It is read here, before the first paint, because a navigation link hangs off
    // it: doing it in account.js, which loads at the end of the document, would show the
    // link and then take it away. Still a hint and still never a gate: it decides which
    // links are offered, and nothing may gate saving, counting or reading on it.
    var s = localStorage.getItem('liczmat-signed-in');
    if (s) document.documentElement.setAttribute('data-lm-level', s === '1' ? 'liczmat' : s);
  } catch (e) {}
</script>
${analytics ? analytics + "\n" : ""}<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${secret ? '<meta name="referrer" content="no-referrer">\n' : ""}${dnsPrefetch ? dnsPrefetch + "\n" : ""}<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="LiczMat">
<meta name="robots" content="${p.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#faf7f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#060c12" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-title" content="LiczMat">
<meta name="application-name" content="LiczMat">
<link rel="canonical" href="${esc(canonical)}">
${hreflangs}
<!-- Two icons and no more. The SVG is 809 bytes and is what a current browser picks; the
     32 px PNG is the fallback for one that cannot read it. A third link at 192 px used to
     sit here, and a browser choosing the largest declared icon would fetch 5.4 kB to draw
     a 16 px tab — site.webmanifest already declares 192 and 512 for installing, which is
     where that size is actually wanted. All three carry the stamp now: an icon is cached
     harder than anything else on a site, and favicon-32.png had no way to be replaced. -->
<link rel="icon" href="/assets/favicon.svg?v=${stamp}" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png?v=${stamp}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=${stamp}">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LiczMat">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
${ogAlternates}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${BASE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(OG_IMAGE_ALT)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${BASE}/assets/og-image.jpg">
<meta name="twitter:image:alt" content="${esc(OG_IMAGE_ALT)}">
<link rel="stylesheet" href="/assets/styles.min.css?v=${stamp}">
${jsonldBlocks}
${p.headExtra || ""}
${pageScripts}
</head>
<body${p.bodyClass ? ` class="${p.bodyClass}"` : ""}>
<!-- The skip link. Its target carries tabindex="-1" (every <main id="main"> in
     src/pages.mjs and src/app-pages.mjs): without it the browser scrolls to the landmark
     and leaves the keyboard focus on the link, so the next Tab goes back into the header
     the visitor just asked to skip. -->
<a class="skip-link" href="#main">${esc(t("skip_main"))}</a>
${bare ? main : `${siteHeader({ lang, t, alternates, path })}\n${main}\n${siteFooter({ lang, t, alternates })}\n${consentBanner(lang, t)}`}
${p.bodyEnd || ""}
</body>
</html>
`;
}

/**
 * The main navigation and the footer's columns both come out of `ROUTES` in
 * src/ia.mjs, in the order the architecture gives them. A page that is not declared
 * there cannot show up in the menu, and a link here cannot point at a page that does
 * not exist — src/ia.mjs holds the URL, the label key and the position in one place.
 *
 * `current` is the route the visitor is on (or null); its link gets aria-current, which
 * is both the accessible answer to "where am I" and what the lime mark hangs off.
 *
 * Audit item M11. Which of the two values it gets is the whole finding: `currentNavRoute()`
 * returns the deepest route the address falls under, and on `/kalkulatory/tapety/` that is
 * `/kalkulatory/` — an ancestor, not this page. Until session 67 that link was marked
 * `aria-current="page"` anyway, so a screen reader on every one of the fifteen calculator
 * pages, in all thirteen languages, was told it was on "Kalkulatory". So `page` is now only
 * for the address the visitor is actually at, and an ancestor gets `aria-current="true"`,
 * which says "this branch, not this page". The lime mark hangs off both (assets/styles.css
 * matches the attribute rather than the value), so nothing changes on screen.
 */
const navLink = (r, slot, lang, t, current, inPlace, path) => {
  const href = r.localized ? r.path(lang) : r.path;
  const here = current && current.id === r.id;
  const exact = here && path === href;
  // `/app/`, `/app/dashboard/` and `/p/` have no language of their own — they carry the
  // whole dictionary and swap text in place. So the label is marked for the runtime to
  // rewrite, and the route id lets it repoint the address too: the href written here is
  // DEFAULT_LANG's, and assets/i18n-runtime.js swaps in the right one from window.LM_NAV
  // on `langchange`. Without that, "Materiały" on a German /app/ would still go to the
  // Polish page.
  const marks = inPlace ? ` data-i18n="${r[slot].key}" data-nav-route="${r.id}"` : "";
  return `<a href="${href}"${here ? ` aria-current="${exact ? "page" : "true"}"` : ""}${r.localized ? "" : ' rel="nofollow"'}${marks}>` +
    `${esc(t(r[slot].key))}</a>`;
};

/**
 * The `<li>` a navigation link sits in, and the one attribute that can hide it.
 *
 * `navLevel` in src/ia.mjs says which level is offered the link — not which level may use
 * the page. It goes on the item rather than the anchor because the row is a flex list with
 * a gap: hiding the anchor alone would leave the space it stood in.
 *
 * The item is written for everybody. `assets/styles.css` hides it only when the document
 * carries `data-lm-level` (stamped in the head, from the `liczmat-signed-in` hint) and
 * that level is not enough — so a browser with no script, and Googlebot, keep the link.
 */
const navItem = (r, slot, lang, t, current, inPlace, path) =>
  `<li${r.navLevel ? ` data-nav-level="${r.navLevel}"` : ""}>` +
  `${navLink(r, slot, lang, t, current, inPlace, path)}</li>`;

/**
 * The site header. Every page uses this one — the public pages, /app/ and /p/.
 *
 * The row is: brand, navigation, pickers, the account button, the theme switch and (on
 * a phone) the menu button. The theme switch and the menu button live *outside* the
 * collapsing part, so a visitor can change the theme without opening the menu.
 *
 * @param {object} h
 * @param {string} h.lang
 * @param {(k:string)=>string} h.t
 * @param {object} [h.alternates] { lang: path } — the language picker needs it
 * @param {string} [h.path]      this page's path, for the "you are here" mark
 * @param {object[]} [h.links]   overrides the routes: [{ href, key, rel }]
 * @param {object} [h.cta]       the button at the end: { href, key, rel, target, loc }
 * @param {boolean} [h.inPlace]  /app/ and /p/: labels carry data-i18n and the language
 *                               picker is an empty shell the browser fills in
 */
export function siteHeader(h) {
  const { lang, t, alternates, inPlace } = h;

  const current = h.path ? currentNavRoute("header", lang, h.path) : null;
  const items = h.links
    ? h.links.map((l) => `<li><a href="${l.href}"${l.rel ? ` rel="${l.rel}"` : ""}` +
        `${inPlace ? ` data-i18n="${l.key}"` : ""}>${esc(t(l.key))}</a></li>`)
    : navRoutes("header").map((r) => navItem(r, "header", lang, t, current, inPlace, h.path));

  const cta = h.cta || { href: URL_APP, key: "nav_app", rel: "nofollow" };
  const ctaAttrs = [
    `href="${cta.href}"`,
    cta.rel ? `rel="${cta.rel}"` : "",
    cta.target ? `target="${cta.target}"` : "",
    cta.loc ? `data-loc="${cta.loc}"` : "",
    // The account button is the one place the session is visible outside /app/;
    // lmMarkHeader() in assets/account.js hangs a dot off this attribute.
    cta.href === URL_APP ? "data-account-cta" : "",
    inPlace ? `data-i18n="${cta.key}"` : "",
  ].filter(Boolean).join(" ");

  const picker = inPlace
    // Filled in by assets/i18n-runtime.js: these pages switch language in place.
    ? '<div class="lang-picker" id="lang-picker"></div>'
    : langPicker(lang, t, alternates);

  return `<header class="site">
  <div class="wrap nav">
    <a class="brand" href="${inPlace ? "/" : urlHome(lang)}">${LOGO_MARK}<span>LiczMat</span></a>
    <nav id="nav-links" class="nav-links" aria-label="${esc(t("nav_main"))}"${inPlace ? ' data-i18n-aria="nav_main"' : ""}>
      <ul class="nav-list">
        ${items.join("\n        ")}
      </ul>
      <div class="pickers">
        ${picker}
        ${currencyPicker(lang, t, inPlace)}
      </div>
      <a class="btn btn-primary btn-sm nav-cta" ${ctaAttrs}>${esc(t(cta.key))}</a>
    </nav>
    ${themeToggle(t, inPlace)}
    <button id="menu-toggle" class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="${esc(t("nav_menu"))}"${inPlace ? ' data-i18n-aria="nav_menu"' : ""}>${ICON.menu}${ICON.close}</button>
  </div>
</header>
<!-- Outside <header>, because the header's backdrop-filter makes it the containing
     block for anything position:fixed inside it — in there the scrim would be as tall
     as the header bar and dim nothing. -->
<div id="nav-scrim" class="nav-scrim" hidden></div>`;
}

/**
 * The site footer. Four columns out of the same routes, then the language row and the
 * legal line.
 *
 * The language row is the second half of the language selector: the header's picker is
 * a menu that has to be opened, these are plain links a crawler follows. Both point at
 * the same per-language URLs.
 *
 * @param {object} f
 * @param {boolean} [f.minimal] /app/ and /p/: only the bottom line, no site map
 */
export function siteFooter(f) {
  const { lang, t, alternates, minimal, inPlace } = f;

  /* Audit item H7. Until session 62 this line read "© LiczMat" and stopped there, so every
     page of a site that takes a subscription and opens accounts left the visitor with no
     name to hold and no address to write to. The operator is named on every page now, the
     minimal footer of /app/ and /p/ included: the account screen is exactly where somebody
     asks who is holding their data. ENTITY in src/site.mjs is where the details come from,
     and the address line is dropped when there is none rather than printed empty. */
  const who = `<span class="foot-who">${esc(ENTITY.name)}${ENTITY.address ? ` · ${esc(ENTITY.address)}` : ""} · <a href="mailto:${esc(ENTITY.email)}">${esc(ENTITY.email)}</a></span>`;

  const bottom = `<div class="foot-bottom">
      <span>© <span data-year>2026</span> LiczMat.${minimal ? "" : ` ${esc(t("foot_rights"))}`}</span>
      ${who}
      ${minimal
        ? `<span><a href="${URL_PRIVACY}"${inPlace ? ' data-i18n="foot_privacy"' : ""}>${esc(t("foot_privacy"))}</a></span>
      <span class="muted"${inPlace ? ' data-i18n="app_noindex_note"' : ""}>${esc(t("app_noindex_note"))}</span>`
        : `<span>${esc(t("foot_disclaimer"))}</span>`}
    </div>`;

  if (minimal) return `<footer class="site">\n  <div class="wrap">\n    ${bottom}\n  </div>\n</footer>`;

  const column = (group) => navRoutes("footer", group)
    .map((r) => navItem(r, "footer", lang, t, null, inPlace)).join("\n          ");

  const langRow = alternates
    ? `<nav class="foot-langs" aria-label="${esc(t("lang_label"))}">
      <h2>${esc(t("lang_label"))}</h2>
      <ul>
        ${LANGS.filter((l) => alternates[l]).map((l) => `<li><a href="${esc(alternates[l])}" hreflang="${HREFLANG[l]}" lang="${HREFLANG[l]}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ""}><span class="flag">${FLAG[l]}</span><span>${esc(LANG_NAME[l])}</span></a></li>`).join("\n        ")}
      </ul>
    </nav>`
    : "";

  return `<footer class="site">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="brand">${LOGO_MARK}<span>LiczMat</span></div>
        <p class="muted">${esc(t("foot_tagline"))}</p>
      </div>
      <div>
        <h2>${esc(t("foot_product"))}</h2>
        <ul>
          ${column("product")}
          <li><a href="${urlHome(lang)}#faq">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h2>${esc(t("foot_account"))}</h2>
        <ul>
          ${column("account")}
          <li><a href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="footer">Google Play</a></li>
        </ul>
      </div>
      <div>
        <h2>${esc(t("foot_legal"))}</h2>
        <ul>
          <li><a href="${urlContact(lang)}">${esc(t("contactpage_title"))}</a></li>
          <li><a href="${URL_PRIVACY}">${esc(t("foot_privacy"))}</a></li>
          <li><a href="${urlCookies(lang)}">${esc(t("foot_cookies"))}</a></li>
        </ul>
      </div>
    </div>
    ${langRow}
    ${bottom}
  </div>
</footer>`;
}

function consentBanner(lang, t) {
  // aria-labelledby rather than aria-label: the name of this dialog used to be the word
  // on its accept button ("Zgoda"), so a screen reader announced "Zgoda, dialog" and left
  // the visitor to find out what they were agreeing to. The name is the sentence.
  return `<div id="consent-banner" class="consent-banner" role="dialog" aria-labelledby="consent-text" hidden>
  <p class="consent-text" id="consent-text">${esc(t("consent_text"))}</p>
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
