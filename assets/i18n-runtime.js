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
      language the visitor picked. */

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
 * In-place translation, used only by the two pages that have no per-language URLs:
 * /app/ and /p/. They are noindex, so there is nothing for a crawler to miss, and they
 * ship the full four-language dictionary (assets/i18n.all.js) instead.
 */
function applyLang(lang) {
  const l = I18N[lang] ? lang : "pl";
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n, l); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh, l); });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt, l); });
  // Controls whose whole label is the aria-label: the menu button, the theme switch,
  // the currency select. Nothing about them is visible text, so nothing else would
  // translate them.
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria, l)); });
  applyNavUrls(l);
  try { localStorage.setItem("materio-lang", l); } catch (e) {}
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
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || "pl").slice(0, 2).toLowerCase();
  return I18N[nav] ? nav : "pl";
}

/** One row of the picker: the flag, then the language's own name. Never the flag alone. */
function langRow(entry) {
  return `<span class="flag">${entry.flag || ""}</span><span>${entry.label}</span>`;
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
 * /app/ and /p/ carry every language in one bundle and swap text rather than navigate,
 * so their picker is built here instead of by the generator. Same markup, same flags.
 */
function buildInPlacePicker() {
  const picker = document.getElementById("lang-picker");
  if (!picker || typeof LANGS === "undefined") return;
  const lang = initialLang();
  applyLang(lang);

  const render = (current) => {
    const now = LANGS.filter((l) => l.code === current)[0] || LANGS[0];
    picker.innerHTML = `<button type="button" class="lang-btn" id="lang-toggle" aria-expanded="false" aria-controls="lang-menu" aria-label="${t("lang_label", current)}">
      <span class="flag">${now.flag || ""}</span><span class="lang-btn-name">${now.label}</span>
      <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <ul class="lang-menu" id="lang-menu" hidden>${LANGS.map((l) => (l.code === current
      ? `<li><span class="lang-item is-current" aria-current="true">${langRow(l)}</span></li>`
      : `<li><button type="button" class="lang-item" data-lang="${l.code}" lang="${l.code}">${langRow(l)}</button></li>`
    )).join("")}</ul>`;

    picker.querySelectorAll("button[data-lang]").forEach((b) => {
      b.addEventListener("click", () => { applyLang(b.dataset.lang); render(b.dataset.lang); });
    });
    wirePicker();
  };

  render(lang);
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
