/* Materio website — page wiring: language switcher, mobile nav, calculator
   tabs, the room helper, and FAQ deep-linking. Progressive enhancement: the
   HTML already ships full Polish copy, so the page is complete without JS —
   this only adds the language switcher and the in-browser calculators. */

function buildLangSwitcher() {
  const sel = document.getElementById("lang-select");
  if (!sel) return;
  sel.innerHTML = LANGS.map((l) => `<option value="${l.code}">${l.label}</option>`).join("");
  sel.addEventListener("change", () => applyLang(sel.value));
  document.addEventListener("langchange", (e) => { sel.value = e.detail.lang; });
}

function buildTabs() {
  const tabs = document.querySelectorAll(".calc-tab");
  const show = (tab) => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === tab)));
    document.querySelectorAll("#calc-grid .calc").forEach((c) => {
      c.style.display = c.dataset.tab === tab ? "" : "none";
    });
  };
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));
  if (tabs.length) show(tabs[0].dataset.tab);
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
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof buildCalculators === "function") buildCalculators();
  buildLangSwitcher();
  buildTabs();
  buildRoomHelper();
  buildMobileNav();
  setYear();
  const lang = initialLang();
  applyLang(lang);
  const sel = document.getElementById("lang-select");
  if (sel) sel.value = lang;
});
