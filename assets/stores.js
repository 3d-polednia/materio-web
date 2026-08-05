/* Materio website — store finder for the "Sklepy" page. Mirrors the app's
   "Znajdź sklep" feature: type a city or a shop name and Materio opens a public
   Google Maps search centred on the results; the "w pobliżu" button uses the
   browser's geolocation only to centre the map — coordinates are never stored.
   No fixed list of chains is advertised; any query the user types works,
   including a specific brand name (e.g. searching "Castorama" shows the nearest). */

function mapSrc(query, loc) {
  const q = encodeURIComponent((query && query.trim()) || "sklep budowlany");
  if (loc) return `https://maps.google.com/maps?q=${q}&ll=${loc.lat},${loc.lng}&z=13&output=embed`;
  return `https://maps.google.com/maps?q=${q}&z=6&output=embed`;
}

function buildStoreFinder() {
  const map = document.getElementById("store-map");
  if (!map) return;
  const form = document.getElementById("store-search");
  const input = document.getElementById("store-q");
  const status = document.getElementById("store-status");
  let loc = null;

  const render = () => { map.src = mapSrc(input.value, loc); };

  if (form) form.addEventListener("submit", (e) => { e.preventDefault(); render(); });

  document.querySelectorAll("[data-example]").forEach((chip) => {
    chip.addEventListener("click", () => { input.value = chip.dataset.example; render(); input.focus(); });
  });

  const near = document.getElementById("find-near");
  if (near) near.addEventListener("click", () => {
    if (!navigator.geolocation) { status.textContent = "Twoja przeglądarka nie udostępnia lokalizacji."; return; }
    status.textContent = "Ustalam lokalizację…";
    navigator.geolocation.getCurrentPosition(
      (p) => { loc = { lat: p.coords.latitude, lng: p.coords.longitude }; status.textContent = "Pokazuję sklepy w Twojej okolicy."; render(); },
      () => { status.textContent = "Brak zgody na lokalizację — wpisz miasto lub nazwę sklepu powyżej."; }
    );
  });

  render();
}
