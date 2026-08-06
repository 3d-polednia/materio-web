/* Materio website — shared page wiring across all subpages: language switcher,
   mobile nav, and (where present) calculator tabs, the room helper and the
   store finder. Everything is guarded, so each page runs only what it contains.
   The HTML ships full Polish copy; this is progressive enhancement on top. */

function buildLangSwitcher() {
  const sel = document.getElementById("lang-select");
  if (!sel || typeof LANGS === "undefined") return;
  sel.innerHTML = LANGS.map((l) => `<option value="${l.code}">${l.label}</option>`).join("");
  sel.addEventListener("change", () => applyLang(sel.value));
  document.addEventListener("langchange", (e) => { sel.value = e.detail.lang; });
}

function buildTabs() {
  const tabs = document.querySelectorAll(".calc-tab");
  if (!tabs.length) return;
  const show = (tab) => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === tab)));
    document.querySelectorAll("#calc-grid .calc").forEach((c) => {
      c.style.display = c.dataset.tab === tab ? "" : "none";
    });
  };
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));
  show(tabs[0].dataset.tab);
}

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
  document.addEventListener("langchange", calc);
  calc();
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

// GDPR consent banner: Google Analytics stays denied until the visitor accepts.
function buildConsent() {
  const banner = document.getElementById("consent-banner");
  if (!banner) return;
  let saved = null;
  try { saved = localStorage.getItem("materio_consent"); } catch (e) {}
  if (saved) return; // choice already made — banner stays hidden
  banner.hidden = false;
  const decide = (granted) => {
    try { localStorage.setItem("materio_consent", granted ? "granted" : "denied"); } catch (e) {}
    if (typeof gtag === "function") {
      gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
    }
    banner.hidden = true;
  };
  const accept = document.getElementById("consent-accept");
  const reject = document.getElementById("consent-reject");
  if (accept) accept.addEventListener("click", () => decide(true));
  if (reject) reject.addEventListener("click", () => decide(false));
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof buildCalculators === "function") buildCalculators();
  if (typeof buildStoreFinder === "function") buildStoreFinder();
  buildLangSwitcher();
  buildTabs();
  buildRoomHelper();
  buildMobileNav();
  trackStoreClicks();
  buildConsent();
  setYear();
  if (typeof initialLang === "function") {
    const lang = initialLang();
    applyLang(lang);
    const sel = document.getElementById("lang-select");
    if (sel) sel.value = lang;
  }
});
