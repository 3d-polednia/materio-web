/* LiczMat website — the filter on /kalkulatory/ (master plan, chapter XI).
 *
 * The hub is server-rendered: every calculator is already an <a> in the markup, grouped
 * under its category heading, and the category chips are ordinary links to `#g-<id>`.
 * With no script the page is a readable list with working in-page jumps. This file only
 * turns those jumps into a filter and adds the search box, which is the one control that
 * cannot exist without a script — the build puts it inside `.js-only`, so it is not shown
 * at all until this runs.
 *
 * The haystack is `data-find`, written by the build: name + description + category name,
 * already lower-cased and stripped of accents in the page's own language. Nothing is
 * fetched and nothing is indexed here; the whole thing is two string comparisons per row.
 */
(function () {
  var hub = document.getElementById("calc-hub");
  if (!hub) return;

  var input = hub.querySelector("#calc-search");
  var form = hub.querySelector("[data-calc-search]");
  var chips = Array.prototype.slice.call(hub.querySelectorAll("[data-cat-chip]"));
  var rows = Array.prototype.slice.call(hub.querySelectorAll("[data-calc-row]"));
  var blocks = Array.prototype.slice.call(hub.querySelectorAll("[data-cat-block]"));
  var popular = hub.querySelector("[data-hub-popular]");
  var empty = hub.querySelector("[data-calc-empty]");
  var shown = hub.querySelector("[data-calc-shown]");
  var total = Number(hub.dataset.total) || rows.length;

  /** Same folding the build used for data-find — see fold() in src/pages.mjs. */
  function fold(s) {
    return String(s).toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
  }

  var pattern = "";
  var category = "";

  function apply() {
    var terms = pattern.split(/\s+/).filter(Boolean);
    var visible = 0;

    rows.forEach(function (row) {
      var hay = row.dataset.find || "";
      var ok = (!category || row.dataset.cat === category)
        && terms.every(function (term) { return hay.indexOf(term) !== -1; });
      row.hidden = !ok;
      if (ok) visible++;
    });

    // A heading with nothing under it reads as a group that lost its calculators.
    blocks.forEach(function (block) {
      block.hidden = !block.querySelector("[data-calc-row]:not([hidden])");
    });

    // The shortlist answers "which one do I want"; once the visitor has said which one
    // they want, it is four cards in the way of the answer.
    if (popular) popular.hidden = !!(pattern || category);

    if (empty) empty.hidden = visible !== 0;
    // The build put the untranslated sentence in the attribute and the filled-in one in
    // the element, so the numbers can be replaced without parsing them back out of it.
    if (shown) {
      shown.textContent = String(shown.dataset.calcShown || "")
        .replace("{n}", String(visible)).replace("{total}", String(total));
    }

    chips.forEach(function (chip) {
      var on = (chip.dataset.catChip || "") === category;
      chip.classList.toggle("on", on);
      if (on) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function (e) {
      e.preventDefault();
      category = chip.dataset.catChip || "";
      apply();
      hub.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });

  if (input) {
    input.addEventListener("input", function () {
      pattern = fold(input.value.trim());
      apply();
    });
    // Escape empties a search field in every browser, but only some of them fire `input`
    // for it, and the row would stay filtered against a box that looks empty.
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { input.value = ""; pattern = ""; apply(); }
    });
  }
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); });

  /** `/kalkulatory/#g-tiling` — the home page's category links open the hub filtered. */
  function fromHash() {
    var id = (location.hash || "").replace(/^#g-/, "");
    if (!location.hash || location.hash === "#g-all") { category = ""; return; }
    category = chips.some(function (c) { return c.dataset.catChip === id; }) ? id : "";
  }

  fromHash();
  apply();
  window.addEventListener("hashchange", function () { fromHash(); apply(); });
})();
