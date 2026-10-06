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
// Three public Overpass servers, tried in turn: the main one answers 504 when it is busy,
// and a list that fails on the first server is a list nobody sees (2026-10-06).
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_WAIT_MS = 15000;
const COUNTRY_VIEW = {
  pl: [51.92, 19.15, 6], de: [51.17, 10.45, 6], uk: [48.38, 31.17, 5],
  cs: [49.82, 15.47, 7], sk: [48.67, 19.70, 7], ro: [45.94, 24.97, 6],
  hr: [45.10, 15.20, 7], sr: [44.02, 21.01, 7], it: [42.83, 12.83, 6],
  nl: [52.13, 5.29, 7], es: [40.46, -3.75, 6], fr: [46.23, 2.21, 6],
  en: [54.50, -3.44, 6],
};

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
  // Two rounds: a 504 from a busy server is usually gone a few seconds later.
  const tries = OVERPASS.concat(OVERPASS);
  for (let i = 0; i < tries.length; i++) {
    const url = tries[i];
    if (i === OVERPASS.length) await new Promise((r) => setTimeout(r, 2000));
    try {
      // A server that does not answer in time is given up on, so the next one gets a turn.
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), OVERPASS_WAIT_MS) : 0;
      try {
        const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q),
          headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctrl ? ctrl.signal : undefined });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        return data.elements || [];
      } finally { clearTimeout(timer); }
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
      <div class="store-info"><button type="button" class="store-pin" data-lat="${lat}" data-lon="${lon}" data-name="${esc(s.name)}" title="${esc(t("stores_show_map"))}"><b>${esc(s.name)}</b></button><span class="store-meta">${t(s.typeKey)}${s.addr ? " · " + esc(s.addr) : ""}</span></div>
      <div class="store-actions"><span class="store-dist">${fmtDist(s.dist)}</span>
        <a class="btn btn-primary btn-sm btn-go" href="${nav}" target="_blank" rel="noopener">${t("res_navigate")}</a></div>
    </li>`;
}

/* ---------- The map with every store of the list (owner, 2026-10-06) ----------
   The Google embed shows one place per query, so the stores the list found were nowhere on
   it while the app marks them all. Once there is a list, the frame gives way to a Leaflet map
   on OpenStreetMap tiles (no key, no cookies) with one marker per store and one for you.
   Leaflet is fetched only then, from this site (assets/vendor/leaflet, BSD-2-Clause). */
/* Google Maps on the stores page (owner, 2026-10-06: "the OpenStreetMap map is ugly, it has
   to be Google Maps"). The Maps JavaScript API needs a browser key; this one is restricted to
   liczmat.com referrers and to that one API, so it is not a secret and lives here. Empty means
   no key yet: the Leaflet map below stays the fallback, also when Google cannot be loaded. */
const GMAPS_KEY = "";
let gmapsReady = null, gmapsFailed = false;
function loadGoogleMaps() {
  if (gmapsFailed || !GMAPS_KEY) return Promise.reject(new Error("no google maps"));
  if (window.google && google.maps && google.maps.Map) return Promise.resolve(google.maps);
  if (gmapsReady) return gmapsReady;
  gmapsReady = new Promise((resolve, reject) => {
    const lang = document.documentElement.lang || "pl";
    window.lmGoogleMapsReady = () => resolve(google.maps);
    const js = document.createElement("script");
    js.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(GMAPS_KEY) +
      "&loading=async&callback=lmGoogleMapsReady&language=" + encodeURIComponent(lang);
    js.async = true;
    js.onerror = () => { gmapsReady = null; reject(new Error("maps")); };
    document.head.appendChild(js);
    // A key Google refuses still loads the script and draws a grey "something went wrong"
    // map, then calls this. The page goes back to the Leaflet map rather than show that.
    window.gm_authFailure = () => {
      gmapsFailed = true;
      reject(new Error("key"));
      document.dispatchEvent(new CustomEvent("lm-gmaps-failed"));
    };
  });
  return gmapsReady;
}

let leafletReady = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletReady) return leafletReady;
  leafletReady = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/assets/vendor/leaflet/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "/assets/vendor/leaflet/leaflet.js";
    js.onload = () => resolve(window.L);
    js.onerror = reject;
    document.head.appendChild(js);
  });
  return leafletReady;
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
    const q = encodeURIComponent((query && query.trim()) || "building materials");
    if (loc) return `https://maps.google.com/maps?q=${q}&ll=${loc.lat},${loc.lng}&z=12&output=embed`;
    const view = COUNTRY_VIEW[document.documentElement.lang] || COUNTRY_VIEW.pl;
    return `https://maps.google.com/maps?q=${q}&ll=${view[0]},${view[1]}&z=${view[2]}&output=embed`;
  };
  const recenter = () => { if (map) { showEmbed(); map.src = mapSrc(input ? input.value : ""); } };

  if (form) form.addEventListener("submit", (e) => { e.preventDefault(); recenter(); });
  document.querySelectorAll("[data-example]").forEach((chip) => {
    // Use the chip's visible (localized) label as the search term so the map
    // query matches the active language; fall back to the raw data-example.
    chip.addEventListener("click", () => { input.value = (chip.textContent || chip.dataset.example).trim(); recenter(); input.focus(); });
  });

  let storesMap = null, storesLayer = null;
  const markers = new Map();
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent-edge").trim() || "#476c00";

  let gmap = null, gInfo = null, gMarkers = [];
  const navUrl = (lat, lon) => "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
  const popupHtml = (st, lat, lon) =>
    `<div class="store-popup"><b>${esc(st.name)}</b><br>${esc(t(st.typeKey))} · ${fmtDist(st.dist)}` +
    `${st.addr ? "<br>" + esc(st.addr) : ""}<br><a href="${esc(navUrl(lat, lon))}" target="_blank" rel="noopener">${esc(t("res_navigate"))}</a></div>`;

  /* The list's stores on a Google map, one pin each and a blue dot for you. Returns false when
     Google cannot be used (no key, blocked, refused key), and the Leaflet map takes over. */
  async function drawGoogleMap(list, box) {
    let gm;
    try { gm = await loadGoogleMaps(); } catch (e) { return false; }
    box.classList.add("is-google");
    if (!gmap) {
      gmap = new gm.Map(box, {
        center: { lat: loc.lat, lng: loc.lng }, zoom: 13,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
        clickableIcons: false, gestureHandling: "cooperative",
      });
      gInfo = new gm.InfoWindow();
    }
    gMarkers.forEach((m) => m.setMap(null));
    gMarkers = [];
    markers.clear();
    const color = accent();
    const bounds = new gm.LatLngBounds();
    const you = new gm.Marker({
      position: { lat: loc.lat, lng: loc.lng }, map: gmap, zIndex: 1000,
      icon: { path: gm.SymbolPath.CIRCLE, scale: 7, fillColor: "#1d5fa8", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
    });
    gMarkers.push(you);
    bounds.extend(you.getPosition());
    for (const st of list) {
      const lat = Number(st.lat), lon = Number(st.lon);
      if (!isFinite(lat) || !isFinite(lon)) continue;
      const mk = new gm.Marker({
        position: { lat, lng: lon }, map: gmap, title: st.name,
        icon: { path: gm.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 2 },
      });
      const open = () => { gInfo.setContent(popupHtml(st, lat, lon)); gInfo.open({ map: gmap, anchor: mk }); };
      mk.addListener("click", open);
      markers.set(`${lat},${lon}`, { open, lat, lon });
      gMarkers.push(mk);
      bounds.extend(mk.getPosition());
    }
    gmap.fitBounds(bounds, 32);
    gm.event.addListenerOnce(gmap, "idle", () => { if (gmap.getZoom() > 15) gmap.setZoom(15); });
    return true;
  }

  document.addEventListener("lm-gmaps-failed", () => {
    const box = document.getElementById("store-leaflet");
    if (!box || !box.classList.contains("is-google")) return;
    box.classList.remove("is-google");
    box.innerHTML = "";
    gmap = null; gInfo = null; gMarkers = [];
    if (lastMapList) drawStoresMap(lastMapList);
  });

  let lastMapList = null;
  async function drawStoresMap(list) {
    if (!map || !loc || !list.length) return;
    lastMapList = list;
    let box = document.getElementById("store-leaflet");
    if (!box) {
      box = document.createElement("div");
      box.id = "store-leaflet";
      box.className = "map-frame store-leaflet";
      box.setAttribute("role", "region");
      box.setAttribute("aria-label", map.getAttribute("title") || "");
      map.insertAdjacentElement("afterend", box);
    }
    map.hidden = true;
    box.hidden = false;
    if (!storesMap && await drawGoogleMap(list, box)) return;
    let L;
    try { L = await loadLeaflet(); } catch (e) { box.hidden = true; map.hidden = false; return; }   // the embed stays
    if (!storesMap) {
      storesMap = L.map(box, { scrollWheelZoom: false });
      storesMap.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(storesMap);
    }
    if (storesLayer) storesLayer.remove();
    storesLayer = L.layerGroup().addTo(storesMap);
    markers.clear();
    const color = accent();
    L.circleMarker([loc.lat, loc.lng], { radius: 7, color: "#1d5fa8", fillColor: "#1d5fa8", fillOpacity: 0.9, weight: 2 }).addTo(storesLayer);
    const points = [[loc.lat, loc.lng]];
    for (const st of list) {
      const lat = Number(st.lat), lon = Number(st.lon);
      if (!isFinite(lat) || !isFinite(lon)) continue;
      const mk = L.circleMarker([lat, lon], { radius: 8, color, fillColor: color, fillOpacity: 0.85, weight: 2 })
        .bindPopup(popupHtml(st, lat, lon))
        .addTo(storesLayer);
      markers.set(`${lat},${lon}`, {
        open: () => { storesMap.setView([lat, lon], Math.max(storesMap.getZoom(), 15)); mk.openPopup(); }, lat, lon,
      });
      points.push([lat, lon]);
    }
    storesMap.invalidateSize();
    storesMap.fitBounds(points, { padding: [24, 24], maxZoom: 15 });
  }

  // A search by name goes back to the Google frame, which can look a name up.
  const showEmbed = () => {
    const box = document.getElementById("store-leaflet");
    if (box) box.hidden = true;
    if (map) map.hidden = false;
  };

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

  // A row's name puts that store on the map (2026-10-06, owner: "the list is there, the map
  // does not show them"). The embed takes one place per query, so the map shows the store
  // picked, marked, and on a phone the page scrolls up to it.
  listEl.addEventListener("click", (e) => {
    const pin = e.target.closest(".store-pin");
    if (!pin) return;
    const lat = Number(pin.dataset.lat), lon = Number(pin.dataset.lon);
    if (!isFinite(lat) || !isFinite(lon)) return;
    const mk = markers.get(`${lat},${lon}`);
    const box = document.getElementById("store-leaflet");
    const onMap = mk && box && !box.hidden;
    if (onMap) {
      if (gmap && box.classList.contains("is-google")) {
        gmap.panTo({ lat, lng: lon });
        if (gmap.getZoom() < 15) gmap.setZoom(15);
      }
      mk.open();
    } else {
      const label = encodeURIComponent(`${lat},${lon} (${pin.dataset.name || ""})`);
      map.src = `https://maps.google.com/maps?q=${label}&z=16&output=embed`;
    }
    listEl.querySelectorAll(".store-item.is-picked").forEach((row) => row.classList.remove("is-picked"));
    pin.closest(".store-item").classList.add("is-picked");
    const shown = onMap ? box : map;
    if (shown.getBoundingClientRect().top < 0) shown.scrollIntoView({ behavior: "smooth", block: "start" });
  });

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
        drawStoresMap(list);
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
