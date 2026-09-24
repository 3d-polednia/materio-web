/* LiczMat website — shared page wiring across all pages: mobile nav,
   Play-Store click tracking and the consent banner. Everything is guarded, so each page
   runs only what it actually contains.

   The pages ship their copy as real HTML in their own language (scripts/build.mjs), so
   there is no text-swapping pass here any more — the language switcher lives in
   assets/i18n-runtime.js and navigates between per-language URLs. */

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
  // One number, and it lives in assets/styles.css: the drawer's breakpoint moved from
  // 900 px to 1060 px in session 32, because thirteen languages have to fit the row and the
  // Russian one needed 1033 px. Keep the two in step — a mismatch leaves the drawer open
  // as a plain row, or shuts a menu the visitor can still see.
  const desktop = window.matchMedia("(min-width: 1061px)");

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

  /* The banner is fixed at the bottom of the screen, so the page has to keep that much
     room at its own bottom — otherwise the last thing in the document sits under the
     banner with no scroll left to move it out, and a tap aimed at it lands on the
     banner instead. Session 43 measured it on device profiles: on an iPhone SE the
     banner is 200 px of a 568 px screen, and a tap on the middle of the calculator's
     first field focused nothing at all.
     The height is measured rather than guessed: it is a sentence in thirteen languages over
     a phone's width, and German is 256 px where Polish is 200. It follows a language
     switch, a rotation and a window resize for the same reason. */
  const room = () => {
    const h = banner.hidden ? 0 : banner.getBoundingClientRect().height;
    // The banner's own bottom offset is part of the gap it needs; sp-3/sp-4 are what the
    // stylesheet uses, and reading the computed value keeps the two from drifting.
    const gap = banner.hidden ? 0 : parseFloat(getComputedStyle(banner).bottom) || 0;
    document.documentElement.style.setProperty("--consent-h", h ? Math.ceil(h + gap) + "px" : "0px");
  };

  const decide = (granted) => {
    try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch (e) {}
    if (typeof gtag === "function") {
      gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
    }
    banner.hidden = true;
    room();
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
    room();
    banner.scrollIntoView({ block: "nearest" });
    document.dispatchEvent(new CustomEvent("consentchange", { detail: { granted: null } }));
  };

  room();
  if (typeof ResizeObserver === "function") new ResizeObserver(room).observe(banner);
  else window.addEventListener("resize", room);
  document.addEventListener("langchange", room);
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

/* Theme switch. Three states, the same three the app offers: light, dark and "follow the
   system". Only two of them are stored — no entry in localStorage means the system, which
   is what the CSS does on its own — and until session 51 only two were REACHABLE: the
   toggle flipped between light and dark, so a visitor who had clicked once could never
   hand the choice back to their phone.

   The cycle starts from the state the visitor is in, not from what is on screen, which is
   why "system" on a dark phone moves to light rather than back to dark. */
const THEME_KEY = "liczmat-theme";
const THEME_MODES = ["system", "light", "dark"];

function readThemeMode() {
  try { const v = localStorage.getItem(THEME_KEY); return v === "dark" || v === "light" ? v : "system"; }
  catch (e) { return "system"; }
}

function effectiveTheme() {
  const m = readThemeMode();
  if (m !== "system") return m;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeMode(mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  root.setAttribute("data-theme-mode", mode);
  try {
    if (mode === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch (e) {}
}

function buildThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  /* The label names the mode in force, and it is what replaced aria-pressed: a button that
     cycles through three states is neither pressed nor unpressed, and the name is what a
     screen reader hears change. The words come from the dictionary this page already has,
     so they follow a language switch on /app/, which translates in place. */
  const paint = () => {
    const mode = readThemeMode();
    const name = typeof t === "function" ? t("theme_" + mode) : "";
    const stem = typeof t === "function" ? t("theme_toggle") : button.getAttribute("aria-label");
    const label = name && stem ? stem + ": " + name : stem || "";
    if (label) { button.setAttribute("aria-label", label); button.setAttribute("title", label); }
    // The media-scoped theme-colors cannot answer a hand-picked theme, so an
    // unscoped one is added and kept in step with the choice.
    const bar = effectiveTheme() === "dark" ? "#060c12" : "#faf7f0";
    if (meta) meta.setAttribute("content", bar);
    else {
      const m = document.createElement("meta");
      m.name = "theme-color"; m.content = bar;
      document.head.appendChild(m);
    }
  };

  button.addEventListener("click", () => {
    applyThemeMode(THEME_MODES[(THEME_MODES.indexOf(readThemeMode()) + 1) % THEME_MODES.length]);
    paint();
  });

  // A visitor who never chose still follows the OS when it flips mid-session.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (readThemeMode() === "system") paint();
  });
  window.addEventListener("langchange", paint);

  applyThemeMode(readThemeMode());
  paint();
}

/**
 * The banner for a write the browser refused — a private window, or a quota already full.
 *
 * The three stores (assets/workspace.js, assets/crm-store.js, assets/own-materials.js) know
 * nothing about the page by design (scripts/test-projects.mjs §10): they say a write did not
 * land and this answers for the screen. One banner serves all three, because a quota that
 * stops one stops the next in the same click, and because the sentence is the same one.
 *
 * It is taken back down by the change event a landed write already fires — no second message
 * is needed to say that saving works again. Built on the consent banner's class, so the audit
 * of 2026-09-04 (M3) needed no new CSS and no rebuilt page.
 */
function buildSaveFailed() {
  const FAILED = ["workspacesavefailed", "crmsavefailed", "ownmaterialssavefailed"];
  const LANDED = ["workspacechange", "crmchange", "ownmaterialschange"];
  let banner = null;

  const show = () => {
    const text = typeof t === "function" ? t("ws_save_failed") : "";
    if (!text || !document.body) return;
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "consent-banner";
      banner.setAttribute("role", "alert");
      const p = document.createElement("p");
      p.className = "consent-text";
      p.textContent = text;
      banner.appendChild(p);
      document.body.appendChild(banner);
    }
    banner.hidden = false;
  };

  FAILED.forEach((type) => document.addEventListener(type, show));
  LANDED.forEach((type) => document.addEventListener(type, () => {
    if (banner) banner.hidden = true;
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  buildSaveFailed();
  if (typeof buildCalculators === "function") buildCalculators();
  if (typeof buildStoreFinder === "function") buildStoreFinder();
  buildMobileNav();
  buildThemeToggle();
  trackStoreClicks();
  buildConsent();
  buildCookiesPage();
  setYear();
});
