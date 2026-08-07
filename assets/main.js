/* Materio website — shared page wiring across all pages: mobile nav, the room helper,
   Play-Store click tracking and the consent banner. Everything is guarded, so each page
   runs only what it actually contains.

   The pages ship their copy as real HTML in their own language (scripts/build.mjs), so
   there is no text-swapping pass here any more — the language switcher lives in
   assets/i18n-runtime.js and navigates between per-language URLs. */

function buildRoomHelper() {
  const box = document.getElementById("room-helper");
  if (!box) return;
  const get = (id) => { const n = parseFloat(String(box.querySelector("#" + id).value).replace(",", ".")); return isFinite(n) ? n : 0; };
  const fmt = (v) => (Math.round(v * 100) / 100).toLocaleString(document.documentElement.lang || "pl", { maximumFractionDigits: 2 });
  const calc = () => {
    const L = get("room-l"), W = get("room-w"), H = get("room-h");
    const floor = L * W, perim = 2 * (L + W), walls = perim * H, vol = floor * H;
    box.querySelector("#room-floor").textContent = fmt(floor) + " m²";
    box.querySelector("#room-walls").textContent = fmt(walls) + " m²";
    box.querySelector("#room-perim").textContent = fmt(perim) + " m";
    box.querySelector("#room-vol").textContent = fmt(vol) + " m³";
  };
  box.querySelectorAll("input").forEach((i) => i.addEventListener("input", calc));
  calc();
}

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

function buildMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
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
  window.materioReopenConsent = () => {
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
    if (typeof window.materioReopenConsent === "function") window.materioReopenConsent();
  });
  document.addEventListener("consentchange", render);
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof buildCalculators === "function") buildCalculators();
  if (typeof buildStoreFinder === "function") buildStoreFinder();
  buildRoomHelper();
  buildHeroCarousel();
  buildMobileNav();
  trackStoreClicks();
  buildConsent();
  buildCookiesPage();
  setYear();
});
