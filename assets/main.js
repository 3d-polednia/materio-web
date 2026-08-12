/* LiczMat website — shared page wiring across all pages: mobile nav, the phone carousel,
   Play-Store click tracking and the consent banner. Everything is guarded, so each page
   runs only what it actually contains.

   The pages ship their copy as real HTML in their own language (scripts/build.mjs), so
   there is no text-swapping pass here any more — the language switcher lives in
   assets/i18n-runtime.js and navigates between per-language URLs. */

// Hero phone mockup: real app screenshots that advance on their own and loop.
// No prev/next controls by design. Honours prefers-reduced-motion (first frame
// only) and stops while the tab is in the background.
function buildHeroCarousel() {
  const track = document.getElementById("hero-shots");
  if (!track) return;
  const slides = Array.from(track.children);
  if (slides.length < 2) return;

  const dots = document.getElementById("hero-dots");
  if (dots) dots.innerHTML = slides.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
  const marks = dots ? dots.querySelectorAll("i") : [];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // A copy of the first frame placed after the last one turns the wrap-around
  // into one more step forward instead of a visible rewind to the start.
  track.appendChild(slides[0].cloneNode(true));

  let i = 0;
  const go = (n) => {
    i = n;
    track.style.transform = `translateX(-${i * 100}%)`;
    marks.forEach((d, k) => d.classList.toggle("on", k === i % slides.length));
  };
  track.addEventListener("transitionend", () => {
    if (i !== slides.length) return; // only when the clone is on screen
    track.classList.add("instant");
    track.style.transform = "translateX(0)";
    void track.offsetWidth; // flush the jump so the next step animates again
    track.classList.remove("instant");
    i = 0;
  });

  let timer = null;
  const start = () => { if (!timer) timer = setInterval(() => go(i + 1), 3500); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}

/**
 * The mobile navigation: a drawer under the header, on every page of the site.
 *
 * It behaves like the overlay it is — the page behind it does not scroll, a tap on the
 * dimmed area or Escape closes it, and focus goes into the drawer when it opens and back
 * to the button when it shuts. Above the drawer's breakpoint the same markup is a plain
 * row, so everything here is a no-op there: the CSS decides, this only tracks state.
 */
function buildMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;
  const scrim = document.getElementById("nav-scrim");
  const desktop = window.matchMedia("(min-width: 901px)");

  // The pages carry their copy in their own language, but /app/ and /p/ switch language
  // in place, so the label is asked for at the moment it changes.
  const label = (key) => (typeof t === "function" ? t(key) : toggle.getAttribute("aria-label"));

  const open = () => {
    links.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", label("nav_close"));
    if (scrim) scrim.hidden = false;
    document.body.classList.add("nav-open");
    const first = links.querySelector("a, button, select");
    if (first) first.focus();
  };

  const close = (focusToggle) => {
    if (!links.classList.contains("open")) return;
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", label("nav_menu"));
    if (scrim) scrim.hidden = true;
    document.body.classList.remove("nav-open");
    if (focusToggle) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    if (links.classList.contains("open")) close(false); else open();
  });
  if (scrim) scrim.addEventListener("click", () => close(false));

  // A link navigates and a picker is a choice; either way the drawer has done its job.
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => close(false)));

  // Escape, in the capture phase on purpose: the language menu inside the drawer also
  // listens for it (assets/i18n-runtime.js) and closes on the way up, so by the time a
  // bubbling listener here ran, an open menu would already look shut — and Escape would
  // take the drawer with it instead of only the menu the visitor opened.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const langMenu = document.getElementById("lang-menu");
    if (langMenu && !langMenu.hidden) return;
    close(true);
  }, true);

  // Rotating the phone can land the visitor on the desktop layout, where "open" would
  // leave the body locked and the scrim covering a header that is no longer a drawer.
  desktop.addEventListener("change", (e) => { if (e.matches) close(false); });
}

function setYear() {
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
}

// Tag every Google Play link with UTM params (so Play Console attributes the
// visit/install to the website) and count the click in Google Analytics.
function trackStoreClicks() {
  document.querySelectorAll('a[href*="play.google.com"]').forEach((a) => {
    const loc = a.getAttribute("data-loc") || "other";
    try {
      const url = new URL(a.href);
      url.searchParams.set("utm_source", "materio_web");
      url.searchParams.set("utm_medium", "referral");
      url.searchParams.set("utm_campaign", "site_download");
      url.searchParams.set("utm_content", loc);
      a.href = url.toString();
    } catch (e) { /* leave the link untouched if it cannot be parsed */ }
    a.addEventListener("click", () => {
      if (typeof gtag === "function") {
        gtag("event", "play_store_click", { link_location: loc });
      }
    });
  });
}

const CONSENT_KEY = "materio_consent";

const readConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
};

/**
 * GDPR consent banner: Google Analytics stays denied until the visitor accepts.
 *
 * The decision has to be reversible — consent that cannot be withdrawn as easily as it was
 * given is not consent. /cookies/ lists what is stored and calls back in here to reopen
 * the banner, which is why the wiring is done once and the banner is only hidden, never
 * removed.
 */
function buildConsent() {
  const banner = document.getElementById("consent-banner");
  if (!banner) return;

  const decide = (granted) => {
    try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch (e) {}
    if (typeof gtag === "function") {
      gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
    }
    banner.hidden = true;
    document.dispatchEvent(new CustomEvent("consentchange", { detail: { granted } }));
  };

  const accept = document.getElementById("consent-accept");
  const reject = document.getElementById("consent-reject");
  if (accept) accept.addEventListener("click", () => decide(true));
  if (reject) reject.addEventListener("click", () => decide(false));

  banner.hidden = Boolean(readConsent());
  window.liczmatReopenConsent = () => {
    try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
    if (typeof gtag === "function") gtag("consent", "update", { analytics_storage: "denied" });
    banner.hidden = false;
    banner.scrollIntoView({ block: "nearest" });
    document.dispatchEvent(new CustomEvent("consentchange", { detail: { granted: null } }));
  };
}

/** /cookies/: show the current decision and let the visitor take it back. */
function buildCookiesPage() {
  const label = document.getElementById("consent-state");
  const button = document.getElementById("consent-change");
  if (!label || !button) return;

  const render = () => {
    const saved = readConsent();
    const key = saved === "granted" ? "cookiepage_granted"
      : saved === "denied" ? "cookiepage_denied" : "cookiepage_unset";
    label.textContent = t(key);
    label.classList.toggle("on", saved === "granted");
    button.hidden = !saved;
  };

  button.addEventListener("click", () => {
    if (typeof window.liczmatReopenConsent === "function") window.liczmatReopenConsent();
  });
  document.addEventListener("consentchange", render);
  render();
}

/* Theme switch. Three states, but only two of them are stored: no entry in
   localStorage means "follow the system", which is what the CSS does on its own. A
   click writes the opposite of whatever is on screen right now, so the first click
   always visibly changes something, whichever way the system is set. */
const THEME_KEY = "liczmat-theme";

function readTheme() {
  try { const v = localStorage.getItem(THEME_KEY); return v === "dark" || v === "light" ? v : ""; }
  catch (e) { return ""; }
}

function effectiveTheme() {
  return readTheme() || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function buildThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  const paint = () => {
    const mode = effectiveTheme();
    button.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
    // The media-scoped theme-colors cannot answer a hand-picked theme, so an
    // unscoped one is added and kept in step with the choice.
    const bar = mode === "dark" ? "#060c12" : "#faf7f0";
    if (meta) meta.setAttribute("content", bar);
    else {
      const m = document.createElement("meta");
      m.name = "theme-color"; m.content = bar;
      document.head.appendChild(m);
    }
  };

  button.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    paint();
  });

  // A visitor who never chose still follows the OS when it flips mid-session.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!readTheme()) paint();
  });

  paint();
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof buildCalculators === "function") buildCalculators();
  if (typeof buildStoreFinder === "function") buildStoreFinder();
  buildHeroCarousel();
  buildMobileNav();
  buildThemeToggle();
  trackStoreClicks();
  buildConsent();
  buildCookiesPage();
  setYear();
});
