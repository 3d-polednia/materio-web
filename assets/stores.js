/* Materio website — store finder for the "Sklepy" section.
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
const TYPE_LABEL = {
  doityourself: "Market budowlany", hardware: "Narzędzia i art. metalowe",
  trade: "Hurtownia / skład", building_materials: "Skład budowlany",
  paint: "Farby i lakiery", tiles: "Płytki i glazura", timber: "Drewno i tarcica",
};
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

const rad = (x) => (x * Math.PI) / 180;
function haversineKm(la1, lo1, la2, lo2) {
  const R = 6371, dLat = rad(la2 - la1), dLon = rad(lo2 - lo1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function fmtDist(km) { return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(1).replace(".", ",") + " km"; }
function fmtType(tags) { for (const [k, v] of OSM_TAGS) if (tags[k] === v) return TYPE_LABEL[v]; return "Sklep budowlany"; }
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
    out.push({ name, type: fmtType(t), dist, lat: plat, lon: plon, addr });
  }
  out.sort((a, b) => a.dist - b.dist);
  return out;
}

function storeRow(s) {
  const nav = "https://www.google.com/maps/dir/?api=1&destination=" + s.lat + "," + s.lon;
  return `<li class="store-item">
      <div class="store-info"><b>${esc(s.name)}</b><span class="store-meta">${s.type}${s.addr ? " · " + esc(s.addr) : ""}</span></div>
      <div class="store-actions"><span class="store-dist">${fmtDist(s.dist)}</span>
        <a class="btn btn-primary btn-sm" href="${nav}" target="_blank" rel="noopener">Nawiguj</a></div>
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
    chip.addEventListener("click", () => { input.value = chip.dataset.example; recenter(); input.focus(); });
  });

  function renderList(list) {
    if (!list.length) {
      listEl.innerHTML = `<li class="store-empty">Nie znaleziono sklepów w promieniu 20 km. Spróbuj wyszukać po nazwie miasta powyżej.</li>`;
      moreBtn.hidden = true;
      return;
    }
    let expanded = false;
    const draw = () => {
      const shown = expanded ? list : list.slice(0, SHOW_FIRST);
      listEl.innerHTML = shown.map(storeRow).join("");
      if (list.length > SHOW_FIRST) {
        moreBtn.hidden = false;
        moreBtn.textContent = expanded ? "Pokaż mniej" : `Pokaż więcej (${list.length - SHOW_FIRST})`;
      } else moreBtn.hidden = true;
    };
    moreBtn.onclick = () => { expanded = !expanded; draw(); if (!expanded) listEl.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    draw();
  }

  if (near) near.addEventListener("click", () => {
    if (!navigator.geolocation) { status.textContent = "Twoja przeglądarka nie udostępnia lokalizacji — wyszukaj po nazwie miasta."; return; }
    status.textContent = "Ustalam lokalizację…";
    near.disabled = true;
    navigator.geolocation.getCurrentPosition(async (p) => {
      loc = { lat: p.coords.latitude, lng: p.coords.longitude };
      recenter();
      status.textContent = "Szukam sklepów w promieniu 20 km…";
      try {
        const raw = await fetchStores(loc.lat, loc.lng);
        const list = normalize(raw, loc.lat, loc.lng);
        status.textContent = list.length ? `Znaleziono ${list.length} — od najbliższego:` : "";
        renderList(list);
      } catch (e) {
        status.innerHTML = `Nie udało się pobrać listy. <a href="https://www.google.com/maps/search/sklep+budowlany/@${loc.lat},${loc.lng},12z" target="_blank" rel="noopener">Otwórz sklepy w Google Maps →</a>`;
      } finally { near.disabled = false; }
    }, () => {
      status.textContent = "Brak zgody na lokalizację — wpisz miasto lub nazwę sklepu powyżej.";
      near.disabled = false;
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  recenter();
}
