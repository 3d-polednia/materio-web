/* LiczMat website — the small runtime that goes with a generated per-language bundle.

   The pages ship their copy as real HTML in the page's own language, so this file no
   longer rewrites the DOM on load. It does three things:

   1. `t(key)` for the strings JavaScript builds at runtime (calculator results,
      store-finder status lines).
   2. The language switcher. Every language has its own URL, so switching is a
      navigation, not a text swap — that is what makes the other nine languages
      indexable at all. `window.LICZMAT_ALTERNATES` is emitted by the build and maps
      a language code to this page's address in that language.
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
 * switcher counts as a choice.
 */
function chosenLang() {
  try { return localStorage.getItem("materio-lang") || ""; } catch (e) { return ""; }
}

/**
 * In-place translation, used only by the two pages that have no per-language URLs:
 * /app/ and /p/. They are noindex, so there is nothing for a crawler to miss, and they
 * ship the full ten-language dictionary (assets/i18n.all.js) instead.
 */
function applyLang(lang) {
  const l = I18N[lang] ? lang : "pl";
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n, l); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh, l); });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt, l); });
  try { localStorage.setItem("materio-lang", l); } catch (e) {}
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
}

/** Best language for an in-place page: saved choice → browser language → Polish. */
function initialLang() {
  const saved = chosenLang();
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || "pl").slice(0, 2).toLowerCase();
  return I18N[nav] ? nav : "pl";
}

/** /app/ and /p/ carry every language in one bundle and swap text rather than navigate. */
function buildInPlaceSwitcher() {
  const lang = initialLang();
  applyLang(lang);

  const sel = document.getElementById("lang-select");
  if (!sel || typeof LANGS === "undefined") return;
  sel.innerHTML = LANGS.map((l) =>
    `<option value="${l.code}"${l.code === lang ? " selected" : ""}>${l.label}</option>`).join("");
  sel.addEventListener("change", () => applyLang(sel.value));
}

function buildLangSwitcher() {
  if (!window.LICZMAT_ALTERNATES) { buildInPlaceSwitcher(); return; }

  const sel = document.getElementById("lang-select");
  if (!sel || typeof LANGS === "undefined") return;

  const alternates = window.LICZMAT_ALTERNATES;
  const here = pageLang();

  sel.innerHTML = LANGS
    .filter((l) => alternates[l.code] || l.code === here)
    .map((l) => `<option value="${l.code}"${l.code === here ? " selected" : ""}>${l.label}</option>`)
    .join("");

  sel.addEventListener("change", () => {
    const target = alternates[sel.value];
    if (!target || sel.value === here) return;
    try { localStorage.setItem("materio-lang", sel.value); } catch (e) {}
    window.location.href = target + window.location.hash;
  });

  // A visitor who already picked a language should not have to pick it again after
  // following a bare "/" link. Guarded by a session flag so a missing alternate or a
  // stale saved value can never produce a redirect loop.
  const wanted = chosenLang();
  if (wanted && wanted !== here && alternates[wanted]) {
    let redirected = "1";
    try {
      redirected = sessionStorage.getItem("materio-redirected") || "";
      sessionStorage.setItem("materio-redirected", "1");
    } catch (e) { redirected = "1"; }
    if (!redirected) window.location.replace(alternates[wanted] + window.location.hash);
  }
}

document.addEventListener("DOMContentLoaded", buildLangSwitcher);
