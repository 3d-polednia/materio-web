/* LiczMat website - follow-up calculations shown under a calculator result. */

const CALC_CHAIN_PROFILE_IDS = new Set([
  "cd60-3", "cd60-4", "ud27-3", "cw50-3", "uw50-3",
  "cw75-3", "cw100-3", "ua50-3", "ua75-3",
]);

/** Net area typed into a calculator, before waste or package rounding. */
function calcChainArea(calcId, values) {
  let area = NaN;
  if ((calcId === "waste" || calcId === "ceiling") && values.mode === "dims") {
    area = num(values.width) * num(values.length);
  } else if ([
    "coverage", "mortar", "screed", "grout", "masonry", "drylining",
    "sheathing", "insulation", "waste", "ceiling",
  ].includes(calcId)) {
    area = num(values.area);
  } else if (calcId === "studwall") {
    area = num(values.width) * num(values.height);
  } else if (calcId === "wallpaper") {
    area = num(values.wallW) * num(values.wallH);
  }
  return Number.isFinite(area) && area > 0 ? Math.round(area * 100) / 100 : undefined;
}

/** Follow-up mapping shared by the browser and the Node regression test. */
function calcChainTargets(calcId, materialId, values) {
  materialId = materialId || "";
  const material = materialId && typeof materialById === "function" ? materialById(materialId) : null;
  const area = calcChainArea(calcId, values || {});
  const withArea = (target) => area === undefined ? target : { ...target, area };
  const adhesive = materialId && /^(glaz-|terakota|metro-)/.test(materialId)
    ? "klej-c1-25" : "klej-c2-25";
  let targets = [];

  if (calcId === "waste") {
    const tileLike = !materialId || (material && material.c === "TILES") || materialId.startsWith("gres-");
    if (tileLike) {
      targets = [withArea({ calc: "grout", ...(materialId ? { m: materialId } : {}) }),
        withArea({ calc: "mortar", m: adhesive })];
    } else if (material && material.c === "FLOORING" && materialId !== "panel-scienny") {
      targets = [{ calc: "linear", m: "listwa-mdf-2_5" }, withArea({ calc: "coverage", m: "folia-paro" })];
    } else if (material && material.k === "board") {
      targets = [{ calc: "studwall" }, withArea({ calc: "coverage", m: "welna-10" }),
        withArea({ calc: "coverage", m: "gladz-gips-20" })];
    } else if (material && material.k === "roll") {
      targets = [withArea({ calc: "coverage", m: "grunt-gleb-5" })];
    }
  } else if (calcId === "coverage") {
    if (materialId.startsWith("grunt")) targets = [withArea({ calc: "coverage", m: "farba-scienna-10" })];
    else if (materialId.startsWith("tynk")) targets = [withArea({ calc: "coverage", m: "gladz-gips-20" }), withArea({ calc: "coverage", m: "farba-scienna-10" })];
    else if (materialId.startsWith("gladz")) targets = [withArea({ calc: "coverage", m: "grunt-gleb-5" }), withArea({ calc: "coverage", m: "farba-scienna-10" })];
    else if (materialId.startsWith("klej-styro")) targets = [withArea({ calc: "coverage", m: "grunt-kwarc-5" }), withArea({ calc: "coverage", m: "tynk-silik-25" })];
    else if (materialId.startsWith("styropian-fasada")) targets = [withArea({ calc: "coverage", m: "klej-styro-25" }), withArea({ calc: "coverage", m: "tynk-silik-25" })];
    else if (materialId.startsWith("wylewka") || materialId.startsWith("hydroizol")) targets = [withArea({ calc: "waste" })];
    else if (!materialId || materialId.startsWith("farba-")) targets = [withArea({ calc: "coverage", m: "grunt-gleb-5" }), withArea({ calc: "coverage", m: "gladz-gips-20" })];
  } else if (calcId === "linear") {
    if (CALC_CHAIN_PROFILE_IDS.has(materialId)) targets = [{ calc: "waste", m: "gk-zwykla-2600" }, { calc: "coverage", m: "welna-10" }];
    else if (/^(deska-taras|deska-wpc|deska-elew)/.test(materialId)) targets = [{ calc: "linear", m: "lata-4x5-4" }, { calc: "coverage", m: "olej-taras-2_5" }];
    else if (materialId.startsWith("pret-")) targets = [{ calc: "concrete" }];
  } else if (calcId === "wallpaper") targets = [withArea({ calc: "coverage", m: "grunt-gleb-5" })];
  else if (calcId === "grout") targets = [withArea({ calc: "mortar", m: adhesive })];
  else if (calcId === "mortar" && (!materialId || materialId.startsWith("klej-c"))) targets = [withArea({ calc: "grout" })];
  else if (calcId === "masonry") targets = [{ calc: "concrete" }, withArea({ calc: "coverage", m: "tynk-cw-30" })];
  else if (calcId === "screed") targets = [withArea({ calc: "waste" }), withArea({ calc: "coverage", m: "folia-paro" })];
  else if (calcId === "drylining") targets = [withArea({ calc: "coverage", m: "gladz-gips-20" })];
  else if (calcId === "studwall" || calcId === "ceiling") targets = [withArea({ calc: "coverage", m: "welna-10" })];

  return targets
    .filter((target) => !target.m || (typeof materialById === "function" && materialById(target.m)))
    .map((target) => {
      const targetMaterial = target.m && materialById(target.m);
      // A tile carried into grout describes the format, not the material being counted.
      return { ...target, label: targetMaterial && target.calc !== "grout"
        ? targetMaterial.t : `c_${target.calc}_t` };
    });
}

function calcChainValues(card) {
  const values = {};
  card.querySelectorAll("[data-k]").forEach((field) => { values[field.dataset.k] = field.value; });
  return values;
}

function calcChainParams(card, target) {
  const params = new URLSearchParams();
  if (target.m) params.set("m", target.m);
  if (target.area !== undefined) params.set("area", String(target.area));
  const box = card.querySelector("[data-ws-save-box]");
  const project = box && box.querySelector("[data-ws-project]");
  const room = box && box.querySelector("[data-ws-room-pick]");
  if (project && !project.hidden && project.value) params.set("project", project.value);
  if (room && !room.hidden && room.value) params.set("room", room.value);
  return params.toString();
}

function calcChainDraw(card, result) {
  let row = card.querySelector("[data-calc-chain]");
  if (!result) {
    if (row) row.hidden = true;
    return;
  }
  const targets = calcChainTargets(card.dataset.calc, card.dataset.matId || "", calcChainValues(card));
  if (!targets.length) {
    if (row) row.hidden = true;
    return;
  }
  if (!row) {
    row = document.createElement("div");
    row.className = "section-add-list calc-presets calc-chain";
    row.setAttribute("data-calc-chain", "");
  }
  row.hidden = false;
  row.replaceChildren();
  const label = document.createElement("span");
  label.className = "calc-presets-label";
  label.textContent = t("calc_chain");
  row.appendChild(label);

  let urls = {};
  try { urls = JSON.parse(card.dataset.calcUrls || "{}"); } catch (e) {}
  targets.forEach((target) => {
    const samePage = target.calc === card.dataset.calc;
    const item = document.createElement(samePage ? "button" : "a");
    item.className = "section-add";
    item.textContent = t(target.label);
    if (samePage) {
      item.type = "button";
      item.addEventListener("click", () => {
        const material = target.m && materialById(target.m);
        if (!material) return;
        applyMaterial(card, material);
        const heading = card.querySelector("[data-calc-form-heading]");
        if (heading) heading.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
      });
    } else {
      const query = calcChainParams(card, target);
      item.href = `${urls[target.calc] || ""}${query ? `?${query}` : ""}`;
    }
    row.appendChild(item);
  });
  const slot = card.querySelector("[data-calc-actions]");
  if (slot) slot.appendChild(row);
  else card.querySelector("[data-result]").after(row);
}

if (typeof document !== "undefined") {
  document.addEventListener("calcresult", (event) => {
    const detail = event.detail || {};
    if (!detail.card) return;
    // workspace-calc draws the save box from the same event; append after it finishes.
    queueMicrotask(() => calcChainDraw(detail.card, detail.result));
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calcChainArea, calcChainTargets };
}
