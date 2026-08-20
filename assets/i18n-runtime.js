/* LiczMat website — the small runtime that goes with a generated per-language bundle.

   The pages ship their copy as real HTML in the page's own language, so this file no
   longer rewrites the DOM on load. It does three things:

   1. `t(key)` for the strings JavaScript builds at runtime (calculator results,
      store-finder status lines).
   2. The language picker. Every language has its own URL, so switching is a navigation,
      not a text swap — that is what makes the other three languages indexable at all.
      The build writes the whole picker, flags included, into the page; this file only
      opens and closes it. `window.LICZMAT_ALTERNATES` maps a language code to this
      page's address in that language.
   3. Remembering the choice, so the next visit to a shared "/" link lands in the
      language the visitor picked.
   4. Fetching a second language bundle for the three pages that have no language of
      their own (/app/, /app/dashboard/, /p/) — see ensureLang() below. */

/* The "?v=" this file was loaded with, captured while the tag is still executing:
   `document.currentScript` is null inside a listener. Every asset on a page carries the
   same stamp, so a bundle fetched later is fetched from the same build as the page that
   asks for it — without that, a visitor holding a cached page could pull tomorrow's
   dictionary and read keys the markup does not have. */
var LM_ASSET_QUERY = (function () {
  var s = document.currentScript && document.currentScript.getAttribute("src");
  var q = s && s.indexOf("?") >= 0 ? s.slice(s.indexOf("?")) : "";
  return q;
})();

/** Every language the site ships, whether or not its dictionary is in memory yet. */
function langOffered(code) {
  return typeof LANGS !== "undefined" && LANGS.some(function (l) { return l.code === code; });
}

/* A language whose bundle is on its way, so two clicks on the picker cannot start two
   downloads of the same file. */
var langPending = {};

/**
 * Make sure `I18N[lang]` is in memory, then call back.
 *
 * A per-language page never needs this: its own bundle is the only one it will ever
 * translate into, and switching language is a navigation. It exists for /app/,
 * /app/dashboard/ and /p/, which have no language of their own and swap text in the DOM.
 * Until session 33 they downloaded all ten dictionaries at once (703 kB, 220 kB gzipped)
 * so that a switch could be instant. Now they download the one the page is written in and
 * fetch a second one only if somebody actually asks for another language.
 *
 * A bundle that fails to arrive is not an error the visitor should see: the callback runs
 * anyway, applyLang() finds no dictionary for that language and leaves the page in the one
 * it is already in, which is the same thing that happens today when a language is unknown.
 */
function ensureLang(lang, done) {
  if (typeof I18N !== "undefined" && I18N[lang]) { done(); return; }
  if (!langOffered(lang)) { done(); return; }
  if (langPending[lang]) { langPending[lang].push(done); return; }
  langPending[lang] = [done];
  var finish = function () {
    var waiting = langPending[lang];
    langPending[lang] = null;
    for (var i = 0; i < waiting.length; i++) waiting[i]();
  };
  var el = document.createElement("script");
  el.src = "/assets/i18n." + lang + ".js" + LM_ASSET_QUERY;
  el.onload = finish;
  el.onerror = finish;
  document.head.appendChild(el);
}

/** Translate a key for the page's language, falling back to the key itself. */
function t(key, lang) {
  const l = lang || document.documentElement.lang || "pl";
  return (I18N[l] && I18N[l][key]) || (I18N[Object.keys(I18N)[0]] || {})[key] || key;
}

/** The language this page is written in. */
function pageLang() {
  return document.documentElement.lang || Object.keys(I18N)[0] || "pl";
}

/**
 * The language the visitor explicitly chose before, or "" if they never chose one.
 *
 * Deliberately does NOT fall back to navigator.language: an automatic redirect on
 * browser locale would send Googlebot (which crawls as en-US) away from the Polish
 * home page, and the Polish page is the one that has to rank. Only a click on the
 * picker counts as a choice.
 */
function chosenLang() {
  try { return localStorage.getItem("materio-lang") || ""; } catch (e) { return ""; }
}

/**
 * In-place translation, used only by the pages that have no per-language URLs: /app/,
 * /app/dashboard/ and /p/. They are noindex, so there is nothing for a crawler to miss.
 * Call it through ensureLang(), which is what puts the language in memory first.
 */
function applyLang(lang) {
  const l = I18N[lang] ? lang : pageLang();
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n, l); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh, l); });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt, l); });
  // Controls whose whole label is the aria-label: the menu button, the theme switch,
  // the currency select. Nothing about them is visible text, so nothing else would
  // translate them.
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria, l)); });
  applyNavUrls(l);
  // Only a language that actually arrived is written down. A bundle that failed to load
  // leaves the page where it was, and recording that as the visitor's choice would turn
  // one dropped request into a preference they never expressed.
  if (I18N[lang]) { try { localStorage.setItem("materio-lang", l); } catch (e) {} }
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
}

/**
 * Repoint the navigation on a page that has no language of its own.
 *
 * Translating the label is only half of a menu: "Materiały" on a German /app/ pointing at
 * the Polish page is a link that lies. The build writes DEFAULT_LANG's address into the
 * markup — so the link works with no script at all — plus every language's address in
 * `window.LM_NAV`, keyed by the route id in `data-nav-route`. This swaps them.
 *
 * A route the map does not name is left exactly as it is: the markup's own address is the
 * fallback, never a blank or a guess.
 */
function applyNavUrls(lang) {
  const map = (typeof window !== "undefined" && window.LM_NAV) || null;
  if (!map) return;
  document.querySelectorAll("a[data-nav-route]").forEach((a) => {
    const urls = map[a.dataset.navRoute];
    if (urls && urls[lang]) a.setAttribute("href", urls[lang]);
  });
}

/** Best language for an in-place page: saved choice → browser language → Polish. */
function initialLang() {
  const saved = chosenLang();
  if (saved && langOffered(saved)) return saved;
  const nav = (navigator.language || "pl").slice(0, 2).toLowerCase();
  return langOffered(nav) ? nav : pageLang();
}

/**
 * One row of the picker: the flag, then the language's own name. Never the flag alone.
 *
 * The shapes come from assets/flags.js, which only the three pages that build their own
 * picker load — everywhere else the generator has already written the rows into the
 * markup, so those pages would be downloading ten SVGs to redraw something they have.
 */
function langRow(entry) {
  const flag = (typeof LM_FLAGS !== "undefined" && LM_FLAGS[entry.code]) || "";
  return `<span class="flag">${flag}</span><span>${entry.label}</span>`;
}

/* The two document-level handlers below are attached once. /app/ redraws its picker on
   every switch, and re-attaching them each time would stack up listeners. */
let pickerDocHandlers = false;

/** Give the open/close behaviour to a picker that is already in the DOM. */
function wirePicker() {
  const picker = document.getElementById("lang-picker");
  const button = document.getElementById("lang-toggle");
  const menu = document.getElementById("lang-menu");
  if (!picker || !button || !menu) return;

  const close = () => { menu.hidden = true; button.setAttribute("aria-expanded", "false"); };
  const open = () => { menu.hidden = false; button.setAttribute("aria-expanded", "true"); };

  /** The rows somebody can land on: the current language is a <span>, not a choice. */
  const items = () => Array.from(menu.querySelectorAll("a.lang-item, button.lang-item"));

  const move = (step, from) => {
    const rows = items();
    if (!rows.length) return;
    const at = from === undefined ? rows.indexOf(document.activeElement) : from;
    const next = at < 0 ? (step > 0 ? 0 : rows.length - 1) : (at + step + rows.length) % rows.length;
    rows[next].focus();
  };

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hidden) open(); else close();
  });

  // A menu opened from the keyboard has to be walkable from the keyboard.
  button.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    open();
    move(e.key === "ArrowDown" ? 1 : -1, e.key === "ArrowDown" ? -1 : 0);
  });

  menu.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); move(e.key === "ArrowDown" ? 1 : -1); }
    else if (e.key === "Home") { e.preventDefault(); move(1, -1); }
    else if (e.key === "End") { e.preventDefault(); move(-1, 0); }
  });

  if (!pickerDocHandlers) {
    pickerDocHandlers = true;
    document.addEventListener("click", (e) => {
      const box = document.getElementById("lang-picker");
      const list = document.getElementById("lang-menu");
      const toggle = document.getElementById("lang-toggle");
      if (box && list && toggle && !box.contains(e.target)) {
        list.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      const list = document.getElementById("lang-menu");
      const toggle = document.getElementById("lang-toggle");
      if (e.key === "Escape" && list && toggle && !list.hidden) {
        list.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }
}

/**
 * Remember the language somebody picks, so a later bare "/" link lands in it.
 *
 * `document`, not the header menu: every page has the same switcher **twice** — once in
 * the header, once in the footer's "Język" column — and until session 17 only the header
 * copy was wired. The footer link navigated to the other language and the redirect below
 * sent the visitor straight back, because the choice they had just made was never written
 * down. Clicking "English" in the footer of a Polish page therefore did nothing at all,
 * once per session, on all 128 public pages.
 */
function rememberLangChoice() {
  document.querySelectorAll("a[data-lang]").forEach((a) => {
    if (a.dataset.langWired) return;
    a.dataset.langWired = "1";
    a.addEventListener("click", () => {
      try { localStorage.setItem("materio-lang", a.dataset.lang); } catch (e) {}
    });
  });
}

/**
 * /app/, /app/dashboard/ and /p/ swap text rather than navigate, so their picker is built
 * here instead of by the generator. Same markup, same flags, all ten languages — the
 * dictionary for nine of them is fetched only if one is picked.
 */
function buildInPlacePicker() {
  const picker = document.getElementById("lang-picker");
  if (!picker || typeof LANGS === "undefined") return;
  const lang = initialLang();

  const render = (current) => {
    const now = LANGS.filter((l) => l.code === current)[0] || LANGS[0];
    const nowFlag = (typeof LM_FLAGS !== "undefined" && LM_FLAGS[now.code]) || "";
    picker.innerHTML = `<button type="button" class="lang-btn" id="lang-toggle" aria-expanded="false" aria-controls="lang-menu" aria-label="${t("lang_label", current)}">
      <span class="flag">${nowFlag}</span><span class="lang-btn-name">${now.label}</span>
      <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <ul class="lang-menu" id="lang-menu" hidden>${LANGS.map((l) => (l.code === current
      ? `<li><span class="lang-item is-current" aria-current="true">${langRow(l)}</span></li>`
      : `<li><button type="button" class="lang-item" data-lang="${l.code}" lang="${l.code}">${langRow(l)}</button></li>`
    )).join("")}</ul>`;

    picker.querySelectorAll("button[data-lang]").forEach((b) => {
      b.addEventListener("click", () => {
        const want = b.dataset.lang;
        ensureLang(want, () => { applyLang(want); render(want); });
      });
    });
    wirePicker();
  };

  // The picker is drawn from LANGS, which lists all ten whether or not their dictionaries
  // are in memory, so it is complete on the first paint. The page is in DEFAULT_LANG until
  // the chosen language's bundle arrives; everything JavaScript wrote redraws on
  // `langchange`, which is the rule /app/ has followed since it was built.
  render(pageLang());
  ensureLang(lang, () => { applyLang(lang); render(document.documentElement.lang); });
}

/**
 * Carry the query string across a language change.
 *
 * A query is this page's state, and every language of this page understands it the same
 * way: on `/projekty/?id=…` it is the project being looked at, and that id was made in
 * this browser rather than in an address, so it means the same thing in Polish and in
 * German. The switcher's links are written by the build, which knows the pages and not
 * the state, so until session 16 switching language while a project was open landed the
 * visitor on the list of projects instead — with the language changed and the project
 * gone. The same goes for the redirect below.
 */
function langQuery() {
  return window.location.search + window.location.hash;
}

function keepQueryOnLangLinks() {
  const query = langQuery();
  document.querySelectorAll("a[data-lang][href]").forEach((a) => {
    if (a.dataset.langBase === undefined) a.dataset.langBase = a.getAttribute("href");
    a.setAttribute("href", a.dataset.langBase + query);
  });
}

function buildLangPicker() {
  if (!window.LICZMAT_ALTERNATES) { buildInPlacePicker(); return; }

  wirePicker();
  keepQueryOnLangLinks();
  rememberLangChoice();

  // A visitor who already picked a language should not have to pick it again after
  // following a bare "/" link. Guarded by a session flag so a missing alternate or a
  // stale saved value can never produce a redirect loop.
  const alternates = window.LICZMAT_ALTERNATES;
  const here = pageLang();
  const wanted = chosenLang();
  if (wanted && wanted !== here && alternates[wanted]) {
    let redirected = "1";
    try {
      redirected = sessionStorage.getItem("materio-redirected") || "";
      sessionStorage.setItem("materio-redirected", "1");
    } catch (e) { redirected = "1"; }
    if (!redirected) window.location.replace(alternates[wanted] + langQuery());
  }
}

document.addEventListener("DOMContentLoaded", buildLangPicker);
