/* LiczMat website — store finder for the "Sklepy" section.
   Lists the nearest building-supply stores, wholesalers and yards within 20 km,
   sorted by distance (5 shown, the rest behind a "show more" toggle), each with a
   "Nawiguj" button that opens Google Maps directions. Data comes from OpenStreetMap
   via the Overpass API — no API key. Your location is used only in the browser to
   run the query and to centre the map; it is never stored or sent to us.
   A free-text box additionally recentres the embedded map (city or shop name). */

const RADIUS_M = 20000;          // 20 km
const SHOW_FIRST = 5;
const OSM_TAGS = [
  ["shop", "doityourself"], ["shop", "hardware"], ["shop", "trade"],
  ["shop", "building_materials"], ["shop", "paint"], ["shop", "tiles"], ["shop", "timber"],
];
const TYPE_KEY = {
  doityourself: "st_doityourself", hardware: "st_hardware",
  trade: "st_trade", building_materials: "st_building",
  paint: "st_paint", tiles: "st_tiles", timber: "st_timber",
};
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

const rad = (x) => (x * Math.PI) / 180;
function haversineKm(la1, lo1, la2, lo2) {
  const R = 6371, dLat = rad(la2 - la1), dLon = rad(lo2 - lo1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function fmtDist(km) { return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(1).replace(".", ",") + " km"; }
function typeKey(tags) { for (const [k, v] of OSM_TAGS) if (tags[k] === v) return TYPE_KEY[v]; return "st_generic"; }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function buildQuery(lat, lon) {
  const parts = OSM_TAGS.map(([k, v]) => `nwr["${k}"="${v}"](around:${RADIUS_M},${lat},${lon});`).join("");
  return `[out:json][timeout:25];(${parts});out center tags 120;`;
}

async function fetchStores(lat, lon) {
  const q = buildQuery(lat, lon);
  let lastErr;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return data.elements || [];
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("overpass");
}

function normalize(elements, lat, lon) {
  const seen = new Set(), out = [];
  for (const el of elements) {
    const t = el.tags || {};
    const name = t.name || t.brand || t.operator;
    const plat = el.lat != null ? el.lat : (el.center && el.center.lat);
    const plon = el.lon != null ? el.lon : (el.center && el.center.lon);
    if (!name || plat == null || plon == null) continue;
    const key = name.toLowerCase() + "@" + plat.toFixed(3) + "," + plon.toFixed(3);
    if (seen.has(key)) continue;
    seen.add(key);
    const dist = haversineKm(lat, lon, plat, plon);
    if (dist > RADIUS_M / 1000 + 0.5) continue;
    let addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
    if (t["addr:city"]) addr += (addr ? ", " : "") + t["addr:city"];
    out.push({ name, typeKey: typeKey(t), dist, lat: plat, lon: plon, addr });
  }
  out.sort((a, b) => a.dist - b.dist);
  return out;
}

/**
 * One row of the list. Everything in it comes from OpenStreetMap, which is to say from
 * whoever last edited that map — so the name and the address have always been escaped.
 * Session 35 does the same for the two numbers: they are put into an `href`, and a
 * coordinate that is not a finite number has no business being in an address. The row is
 * dropped rather than drawn with a broken link.
 */
function storeRow(s) {
  const lat = Number(s.lat), lon = Number(s.lon);
  if (!isFinite(lat) || !isFinite(lon)) return "";
  const nav = esc("https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon);
  return `<li class="store-item">
      <div class="store-info"><b>${esc(s.name)}</b><span class="store-meta">${t(s.typeKey)}${s.addr ? " · " + esc(s.addr) : ""}</span></div>
      <div class="store-actions"><span class="store-dist">${fmtDist(s.dist)}</span>
        <a class="btn btn-primary btn-sm" href="${nav}" target="_blank" rel="noopener">${t("res_navigate")}</a></div>
    </li>`;
}

function buildStoreFinder() {
  const panel = document.getElementById("store-panel");
  if (!panel) return;
  const map = document.getElementById("store-map");
  const form = document.getElementById("store-search");
  const input = document.getElementById("store-q");
  const status = document.getElementById("store-status");
  const listEl = document.getElementById("store-list");
  const moreBtn = document.getElementById("store-more");
  const near = document.getElementById("find-near");
  let loc = null;

  const mapSrc = (query) => {
    const q = encodeURIComponent((query && query.trim()) || "sklep budowlany");
    return loc ? `https://maps.google.com/maps?q=${q}&ll=${loc.lat},${loc.lng}&z=12&output=embed`
               : `https://maps.google.com/maps?q=${q}&z=6&output=embed`;
  };
  const recenter = () => { if (map) map.src = mapSrc(input ? input.value : ""); };

  if (form) form.addEventListener("submit", (e) => { e.preventDefault(); recenter(); });
  document.querySelectorAll("[data-example]").forEach((chip) => {
    // Use the chip's visible (localized) label as the search term so the map
    // query matches the active language; fall back to the raw data-example.
    chip.addEventListener("click", () => { input.value = (chip.textContent || chip.dataset.example).trim(); recenter(); input.focus(); });
  });

  let currentList = null;   // last rendered list, so we can re-render on language change
  let expanded = false;

  function renderList(list, keepState) {
    if (!keepState) expanded = false;
    currentList = list;
    if (!list.length) {
      listEl.innerHTML = `<li class="store-empty">${t("stores_empty")}</li>`;
      moreBtn.hidden = true;
      return;
    }
    const draw = () => {
      const shown = expanded ? list : list.slice(0, SHOW_FIRST);
      listEl.innerHTML = shown.map(storeRow).join("");
      if (list.length > SHOW_FIRST) {
        moreBtn.hidden = false;
        moreBtn.textContent = expanded ? t("stores_less") : t("stores_more").replace("{n}", list.length - SHOW_FIRST);
      } else moreBtn.hidden = true;
    };
    moreBtn.onclick = () => { expanded = !expanded; draw(); if (!expanded) listEl.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    draw();
  }

  // Re-render the store list and its status when the language changes.
  document.addEventListener("langchange", () => { if (currentList) renderList(currentList, true); });

  if (near) near.addEventListener("click", () => {
    if (!navigator.geolocation) { status.textContent = t("stores_unsupported"); return; }
    status.textContent = t("stores_locating");
    near.disabled = true;
    navigator.geolocation.getCurrentPosition(async (p) => {
      loc = { lat: p.coords.latitude, lng: p.coords.longitude };
      recenter();
      status.textContent = t("stores_searching");
      try {
        const raw = await fetchStores(loc.lat, loc.lng);
        const list = normalize(raw, loc.lat, loc.lng);
        status.textContent = list.length ? t("stores_found").replace("{n}", list.length) : "";
        renderList(list);
      } catch (e) {
        status.innerHTML = `${esc(t("stores_failed"))} <a href="https://www.google.com/maps/search/sklep+budowlany/@${loc.lat},${loc.lng},12z" target="_blank" rel="noopener">${esc(t("stores_open_maps"))}</a>`;
      } finally { near.disabled = false; }
    }, () => {
      status.textContent = t("stores_denied");
      near.disabled = false;
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  recenter();
}
