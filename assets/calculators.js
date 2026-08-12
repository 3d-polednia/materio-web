/* LiczMat website — calculator engines ported 1:1 from the Kotlin app
   (core/calculation/**) and the UI that renders them. Pure math, runs entirely
   in the browser — nothing is sent anywhere, exactly like the offline app. */

const ceil = Math.ceil, floor = Math.floor;
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; };
const profilesAcross = (span, spacing) => floor(span / spacing) + 1;
/**
 * A field the engine has a default for: empty means "use the default", typed means typed.
 *
 * `num(f.bag) || 25` cannot tell those apart — it turns a typed 0 into 25 and answers with
 * a bag size nobody asked for, which is worse than refusing. The Kotlin defaults are
 * parameter defaults and only apply when the argument is left out, so this is what they
 * mean. Session 9 put it on the two group-1 fields that carry a default; the same `|| n`
 * still stands in screed, insulation and the framing engines.
 */
const orDefault = (v, fallback) => {
  const s = String(v === undefined || v === null ? "" : v).trim();
  return s === "" ? fallback : num(s);
};
const GK_BOARD = 2.4, GK_WASTE = 10.0;
const boardsFor = (area, sides, boardArea = GK_BOARD, waste = GK_WASTE) =>
  ceil((area * sides * (1 + waste / 100)) / boardArea);

/* -------- money and quantities --------
   The currency is the visitor's own choice and no longer follows the language
   (assets/currency.js, master plan VI): Deutsch + PLN is a valid setting. The price you
   type is read in that currency and the cost is shown in it. Nothing is converted, and
   no quantity — m², kg, packs, sheets — changes because the currency changed.
   Number formatting still follows the language: 1 234,56 in Polish, 1,234.56 in English. */
const LOCALE = { pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-US" };
function money(major, lang) {
  if (typeof lmMoney === "function") return lmMoney(major);
  return (Number(major) || 0).toFixed(2);
}
function qty(v, lang) {
  const loc = LOCALE[lang] || LOCALE.pl;
  return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(v);
}

/* ---------- Parsers for list inputs ---------- */
function parseCuts(text) {
  // lines like "2400x3", "800*2", "1200 4" → [{len, q}]
  return String(text).split(/[\n;]+/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split(/[x×*, ]+/).map((s) => num(s)).filter((n) => !isNaN(n));
    return p.length >= 2 ? { len: p[0], q: Math.round(p[1]) } : (p.length === 1 ? { len: p[0], q: 1 } : null);
  }).filter(Boolean);
}
function parsePieces(text) {
  // lines like "600x400x3" → [{w, l, q}]
  return String(text).split(/[\n;]+/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split(/[x×*, ]+/).map((s) => num(s)).filter((n) => !isNaN(n));
    if (p.length >= 3) return { w: p[0], l: p[1], q: Math.round(p[2]) };
    if (p.length === 2) return { w: p[0], l: p[1], q: 1 };
    return null;
  }).filter(Boolean);
}

/* ---------- 2D guillotine packing helper (GuillotinePackingEngine.kt) ---------- */
const PACK_EPS = 1e-6;

/** Best-Area-Fit within the sheet's free rectangles, then guillotine-split. */
function tryPlaceGuillotine(sheet, w, h, canRotate, kerf) {
  let bestIdx = -1, bestRotated = false, bestLeftover = Infinity;
  sheet.free.forEach((r, i) => {
    if (w <= r.w + PACK_EPS && h <= r.h + PACK_EPS) {
      const leftover = r.w * r.h - w * h;
      if (leftover < bestLeftover) { bestLeftover = leftover; bestIdx = i; bestRotated = false; }
    }
    if (canRotate && h <= r.w + PACK_EPS && w <= r.h + PACK_EPS) {
      const leftover = r.w * r.h - w * h;
      if (leftover < bestLeftover) { bestLeftover = leftover; bestIdx = i; bestRotated = true; }
    }
  });
  if (bestIdx < 0) return false;

  const rect = sheet.free.splice(bestIdx, 1)[0];
  const pw = bestRotated ? h : w, ph = bestRotated ? w : h;
  sheet.placements.push({ sheet: sheet.index, x: rect.x, y: rect.y, w: pw, h: ph, rotated: bestRotated });

  // Guillotine split: a right offcut and a bottom offcut, each shrunk by kerf.
  const rightW = rect.w - pw - kerf;
  if (rightW > PACK_EPS && rect.h > PACK_EPS) sheet.free.push({ x: rect.x + pw + kerf, y: rect.y, w: rightW, h: rect.h });
  const bottomH = rect.h - ph - kerf;
  if (bottomH > PACK_EPS && pw > PACK_EPS) sheet.free.push({ x: rect.x, y: rect.y + ph + kerf, w: pw, h: bottomH });
  return true;
}

/* ---------- Engines (ports) ---------- */
const ENGINES = {
  coverage(f) {
    const gross = num(f.area), cov = num(f.cov), coats = Math.round(num(f.coats) || 1), price = num(f.price) || 0, open = num(f.openings) || 0;
    if (!(gross > 0) || !(cov > 0) || coats < 1 || open < 0 || open > gross) return { err: "err_positive" };
    const net = Math.max(gross - open, 0), covered = net * coats;
    const units = ceil(covered / cov), purchased = units * cov;
    const wastePct = purchased > 0 ? (purchased - covered) / purchased * 100 : 0;
    return { tobuy: units, unit: "res_pkgs", cost: units * price, rows: [["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"]] };
  },
  waste(f) {
    const area = num(f.area), cov = num(f.cov), w = num(f.waste) || 0, price = num(f.price) || 0;
    if (!(area > 0) || !(cov > 0) || w < 0) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const req = area * (1 + w / 100), pkgs = ceil(req / cov), purchased = pkgs * cov;
    const wastePct = purchased > 0 ? (purchased - area) / purchased * 100 : 0;
    // `purchased` is the m² those whole packs actually contain — the figure the waste
    // percentage is measured against, and the only one you can check against the floor.
    return { tobuy: pkgs, unit: "res_pkgs", cost: pkgs * price, rows: [
      ["res_purchased", qtyG(purchased) + " m²"],
      ["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"],
    ] };
  },
  wallpaper(f) {
    const ww = num(f.wallW), wh = num(f.wallH), rw = num(f.rollW) || 0.53, rl = num(f.rollL) || 10.05, rep = num(f.pattern) || 0, price = num(f.price) || 0;
    if (!(ww > 0) || !(wh > 0) || !(rw > 0) || !(rl > 0) || rep < 0) return { err: "err_positive" };
    const stripLen = rep > 0 ? ceil(wh / rep) * rep : wh;
    const stripsNeeded = ceil(ww / rw), stripsPerRoll = floor(rl / stripLen);
    const rolls = stripsPerRoll <= 0 ? stripsNeeded : ceil(stripsNeeded / stripsPerRoll);
    return { tobuy: rolls, unit: "res_rolls", cost: rolls * price, rows: [] };
  },
  linear(f) {
    const stock = num(f.stock), kerf = num(f.kerf) || 0, price = num(f.price) || 0, cuts = parseCuts(f.cuts);
    if (!(stock > 0) || kerf < 0 || kerf >= stock) return { err: "err_positive" };
    const pieces = [];
    for (const c of cuts) { if (!(c.len > 0) || c.q <= 0) continue; for (let i = 0; i < Math.min(c.q, 100000); i++) pieces.push(c.len); }
    if (!pieces.length) return { err: "err_positive" };
    if (Math.max(...pieces) > stock) return { err: "err_toobig" };
    pieces.sort((a, b) => b - a);
    const bars = [];
    for (const p of pieces) {
      let bar = bars.find((b) => b.used + (b.pieces.length ? kerf : 0) + p <= stock + 1e-6);
      if (!bar) { bar = { used: 0, pieces: [] }; bars.push(bar); }
      bar.used += (bar.pieces.length ? kerf : 0) + p; bar.pieces.push(p);
    }
    const useful = pieces.reduce((a, b) => a + b, 0), purchased = bars.length * stock;
    const wastePct = purchased > 0 ? (purchased - useful) / purchased * 100 : 0;
    const plan = bars.slice(0, 8).map((b, i) => ["res_bar", (i + 1) + ": " + b.pieces.map((x) => Math.round(x)).join(" + ") + " mm"]);
    return { tobuy: bars.length, unit: "res_stocks", cost: bars.length * price, rows: [["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"], ...plan] };
  },
  sheet(f) {
    // 2D guillotine bin-packing — ported 1:1 from GuillotinePackingEngine.kt.
    // Free-rectangle guillotine split: on each placement the used free rect is cut into a
    // right and a bottom offcut, both shrunk by the kerf. Placement is best-area-fit.
    const SW = num(f.sheetW), SH = num(f.sheetL), kerf = num(f.kerf) || 0, price = num(f.price) || 0;
    const canRotate = String(f.rotate === undefined ? "1" : f.rotate) !== "0";
    if (!(SW > 0) || !(SH > 0) || kerf < 0 || price < 0) return { err: "err_positive" };
    if (kerf >= SW || kerf >= SH) return { err: "err_kerf" };

    const fitsSheet = (w, h) =>
      (w <= SW + PACK_EPS && h <= SH + PACK_EPS) || (canRotate && h <= SW + PACK_EPS && w <= SH + PACK_EPS);

    const units = [];
    for (const p of parsePieces(f.pieces)) {
      if (!(p.w > 0) || !(p.l > 0)) return { err: "err_positive" };
      if (p.q <= 0) continue;
      if (p.q > 100000) return { err: "err_toomany" };
      if (!fitsSheet(p.w, p.l)) return { err: "err_toobig" };
      for (let i = 0; i < p.q; i++) units.push({ w: p.w, h: p.l });
    }
    if (!units.length) return { err: "err_positive" };

    // Largest area first — better packing.
    const sorted = units.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    const sheets = [];
    for (const u of sorted) {
      let placed = false;
      for (const sheet of sheets) {
        if (tryPlaceGuillotine(sheet, u.w, u.h, canRotate, kerf)) { placed = true; break; }
      }
      if (!placed) {
        const sheet = { index: sheets.length + 1, free: [{ x: 0, y: 0, w: SW, h: SH }], placements: [] };
        sheets.push(sheet);
        // Guaranteed to fit an empty sheet (validated above), but guard anyway.
        if (!tryPlaceGuillotine(sheet, u.w, u.h, canRotate, kerf)) return { err: "err_toobig" };
      }
    }

    const useful = units.reduce((a, u) => a + u.w * u.h, 0) / 1e6;
    const purchased = sheets.length * SW * SH / 1e6;
    const wastePct = purchased > 0 ? (purchased - useful) / purchased * 100 : 0;
    return { tobuy: sheets.length, unit: "res_sheets", cost: sheets.length * price, rows: [["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"]] };
  },
  concrete(f) {
    const vol = num(f.vol), price = num(f.price) || 0;
    if (!(vol > 0)) return { err: "err_positive" };
    const bags = ceil(vol * 1000 / 12.5);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [["res_water", qtyG(bags * 2) + " " + "|res_water_l|"]] };
  },
  mortar(f) {
    const area = num(f.area), usage = num(f.usage), bag = orDefault(f.bag, 25), price = num(f.price) || 0;
    if (!(area > 0) || !(usage > 0) || !(bag > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const kg = area * usage, bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [["res_kg_total", qtyG(kg) + " kg"]] };
  },
  screed(f) {
    const area = num(f.area), thk = num(f.thk), bag = num(f.bag) || 25, price = num(f.price) || 0;
    if (!(area > 0) || !(thk > 0) || !(bag > 0)) return { err: "err_positive" };
    const kg = area * thk * 2.0, bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [["res_kg", qtyG(kg) + " kg"]] };
  },
  /**
   * Grout. TradeCalc.groutKg gives the kilograms and stops there, because the Android
   * screen has no price field at all; the site does, and until session 9 it charged
   * `⌈kg⌉ × price` against a field labelled "price per piece/pack" and answered "3,2 kg"
   * under a page that promises whole packs. The kilograms are the same number as before —
   * the packaging step below them is new, and it is the same `⌈kg ÷ bag⌉` mortar has used
   * all along. The 5 kg default is the `fuga-5` bag in assets/materials.js.
   */
  grout(f) {
    const area = num(f.area), L = num(f.tileL), W = num(f.tileW), thk = num(f.tileThk), joint = num(f.joint);
    const bag = orDefault(f.bag, 5), price = num(f.price) || 0;
    if (!(area > 0) || !(L > 0) || !(W > 0) || !(thk > 0) || !(joint > 0) || !(bag > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const kgPerM2 = (L + W) / (L * W) * thk * joint * 1.8, kg = kgPerM2 * area;
    const bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [
      ["res_kg_total", qtyG(kg) + " kg"],
      ["res_kg_m2", qtyG(kgPerM2) + " kg/m²"],
    ] };
  },
  masonry(f) {
    const area = num(f.area), open = num(f.openings) || 0, pcs = num(f.pieces), binder = num(f.binder) || 0, w = num(f.waste) || 5, price = num(f.price) || 0;
    if (!(area > 0) || !(pcs > 0) || binder < 0 || w < 0) return { err: "err_positive" };
    const net = Math.max(area - Math.max(open, 0), 0), units = ceil(net * pcs * (1 + w / 100));
    return { tobuy: units, unit: "res_pieces", cost: units * price, rows: [["res_binder", qtyG(net * binder) + " kg"]] };
  },
  insulation(f) {
    const area = num(f.area), dow = num(f.dowels) || 6, adh = num(f.adhesive) || 5, thk = num(f.foamThk) || 15, price = num(f.price) || 0;
    if (!(area > 0) || !(dow > 0) || !(adh > 0) || !(thk > 0)) return { err: "err_positive" };
    const areaPerPkg = 0.30 * 100 / thk, foamPkgs = ceil(area / areaPerPkg);
    return { tobuy: foamPkgs, unit: "res_pkgs", cost: foamPkgs * price, rows: [
      ["res_foam", qtyG(area) + " m² · " + thk + " cm"], ["res_dowels", String(ceil(area * dow))],
      ["res_adhesive", qtyG(area * adh) + " kg"], ["res_mesh", qtyG(area * 1.10) + " m²"],
    ] };
  },
  studwall(f) {
    const width = num(f.width), height = num(f.height), sp = num(f.studSp) || 0.6, bar = num(f.bar) || 3, sides = Math.round(num(f.sides) || 2), price = num(f.price) || 0;
    if (!(width > 0) || !(height > 0) || !(sp > 0) || !(bar > 0) || sides < 1) return { err: "err_positive" };
    const studCount = profilesAcross(width, sp), studBars = studCount * ceil(height / bar);
    const trackBars = ceil(2 * width / bar), anchors = 2 * profilesAcross(width, 0.6);
    const boards = boardsFor(width * height, sides);
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_studs", studBars + " × " + qtyG(bar) + " m"], ["res_tracks", trackBars + " × " + qtyG(bar) + " m"], ["res_anchors", String(anchors)],
    ] };
  },
  ceiling(f) {
    const width = num(f.width), length = num(f.length), mainSp = num(f.mainSp) || 0.4, hangSp = num(f.hangSp) || 0.9, price = num(f.price) || 0;
    if (!(width > 0) || !(length > 0) || !(mainSp > 0) || !(hangSp > 0)) return { err: "err_positive" };
    const runs = profilesAcross(width, mainSp), mainTotal = runs * length, mainBars = ceil(mainTotal / 4);
    const perimBars = ceil(2 * (width + length) / 3), hangers = runs * profilesAcross(length, hangSp);
    const connectors = Math.max(mainBars - runs, 0), boards = boardsFor(width * length, 1);
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_studs", "CD: " + mainBars + " × 4 m"], ["res_tracks", "UD: " + perimBars + " × 3 m"], ["res_hangers", hangers + " (+" + connectors + ")"],
    ] };
  },
  drylining(f) {
    const area = num(f.area), adh = num(f.adhesive) || 5, price = num(f.price) || 0;
    if (!(area > 0) || !(adh > 0)) return { err: "err_positive" };
    const boards = boardsFor(area, 1), kg = area * adh, bags = ceil(kg / 25);
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [["res_adhesive", bags + " × 25 kg (" + qtyG(kg) + " kg)"]] };
  },
  sheathing(f) {
    const area = num(f.area), pw = num(f.pieceW), pl = num(f.pieceL), w = num(f.waste) || 10, price = num(f.price) || 0;
    if (!(area > 0) || !(pw > 0) || !(pl > 0) || w < 0) return { err: "err_positive" };
    const pieceArea = (pw / 1000) * (pl / 1000), withWaste = area * (1 + w / 100), pieces = ceil(withWaste / pieceArea);
    return { tobuy: pieces, unit: "res_sheets", cost: pieces * price, rows: [] };
  },
};
/**
 * A number on its way into a result row, as a token rather than as text.
 *
 * The engines run at build time (scripts/build.mjs, for the worked example on every
 * calculator page) and in the browser, and neither knows the page's language at the point
 * the row is built. So a row carries `|n:12.5|` and whoever renders it formats the number
 * for the language it is rendering into — which is how "12,5 kg" and "12.5 kg" come out of
 * the same engine. Same idea as the existing |res_water_l| token for the litre word.
 */
function qtyG(v) { return "|n:" + (Math.round(v * 100) / 100) + "|"; }

/* -------- the unit standing next to the number --------
   The result panel used to read "4 worków". Polish and Ukrainian inflect a counted noun
   in three forms — 1 / 2–4 / 5 and up, with the teens taking the last one — German and
   English in two, and a symbol or an abbreviation (kg, m², opak., szt.) in none at all.

   Only the keys listed here carry the extra forms; every other unit renders from its
   single key exactly as before. An abbreviation must not be inflected, and a unit spelled
   out as a word is worth forms only where it is on screen: session 9 rebuilt group 1, so
   res_bags has them. res_rolls, res_boards, res_stocks and res_sheets — groups 2 and 3 —
   still read as one form and are named in the session report. */
const PLURAL_UNITS = new Set(["res_bags"]);
const SLAVIC_PLURAL = new Set(["pl", "uk"]);

/**
 * "one" | "few" | "many" for `n` in `lang`. The base key holds the "many" form, so a
 * language or a unit with nothing extra declared keeps working unchanged.
 *
 * A fraction falls back to "many": every unit with forms is counted in whole packages,
 * so the case cannot arise today, and guessing at "3,5 worka" would need a fourth form.
 */
function pluralForm(n, lang) {
  if (!Number.isInteger(n)) return "many";
  if (n === 1) return "one";
  if (!SLAVIC_PLURAL.has(lang)) return "many";
  const last = n % 10, teens = n % 100;
  return last >= 2 && last <= 4 && !(teens >= 12 && teens <= 14) ? "few" : "many";
}

/** The unit label for `n` of them. `tr` is the page's translator, bound to `lang`. */
function unitLabel(key, n, lang, tr) {
  if (!PLURAL_UNITS.has(key)) return tr(key);
  const form = pluralForm(Number(n), lang);
  return form === "many" ? tr(key) : tr(`${key}_${form}`);
}

/** Replace every |n:…| and |res_water_l| in a row value with localized text. */
function localizeRow(value, lang, translate) {
  const fmt = (x) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(x);
  return String(value)
    .replace(/\|n:(-?[0-9.]+)\|/g, (_, n) => fmt(parseFloat(n)))
    .replace("|res_water_l|", translate("res_water_l"));
}

/* ---------- Calculator definitions (fields + presets) ---------- */
const F = (k, label, def, extra = {}) => Object.assign({ k, label, def }, extra);
const CALCS = [
  // SURFACES
  { id: "coverage", tab: "surface", engine: "coverage", fields: [
    F("area", "fld_area", "25"), F("cov", "fld_coverage_unit", "40"),
    F("coats", "fld_coats", "2"), F("openings", "fld_openings", "0"), F("price", "fld_price", ""),
  ], presets: [
    { l: "Farba 10 l", k: "preset_paint", v: { cov: "100", coats: "2" } }, { l: "Grunt 5 l", k: "preset_primer", v: { cov: "35", coats: "1" } },
    { l: "Gładź 20 kg", k: "preset_filler", v: { cov: "20", coats: "1" } }, { l: "Klej C2 25 kg", k: "preset_adhesive", v: { cov: "5", coats: "1" } },
  ] },
  { id: "waste", tab: "surface", engine: "waste", fields: [
    F("area", "fld_area", "20"), F("cov", "fld_pkg_cov", "1.44"),
    F("waste", "fld_waste", "7"), F("price", "fld_price_pkg", ""),
  ], presets: [
    { l: "Gres 60×60", k: "preset_gres1", v: { cov: "1.44", waste: "7" } }, { l: "Gres 120×278", k: "preset_gres2", v: { cov: "3.34", waste: "12" } },
    { l: "Panel AC4", k: "preset_panel", v: { cov: "2.22", waste: "8" } }, { l: "Glazura 30×60", k: "preset_glaze", v: { cov: "1.44", waste: "5" } },
  ] },
  { id: "wallpaper", tab: "surface", engine: "wallpaper", fields: [
    F("wallW", "fld_width", "4"), F("wallH", "fld_height", "2.6"),
    F("rollW", "fld_roll_w", "0.53"), F("rollL", "fld_roll_l", "10.05"),
    F("pattern", "fld_pattern", "0"), F("price", "fld_price", ""),
  ] },
  // CUTTING
  { id: "linear", tab: "cutting", engine: "linear", fields: [
    F("stock", "fld_stock_len", "6000"), F("kerf", "fld_kerf", "3"),
    F("cuts", "fld_cuts", "2400x4\n1800x6\n900x8", { ta: true }), F("price", "fld_price", ""),
  ] },
  { id: "sheet", tab: "cutting", engine: "sheet", fields: [
    F("sheetW", "fld_sheet_w", "2800"), F("sheetL", "fld_sheet_l", "2070"), F("kerf", "fld_kerf", "3"),
    F("pieces", "fld_pieces_list", "600x400x6\n800x300x4", { ta: true }),
    F("rotate", "fld_rotate", "1", { sel: [["1", "Tak", "opt_yes"], ["0", "Nie", "opt_no"]] }),
    F("price", "fld_price", ""),
  ] },
  // TRADE
  { id: "concrete", tab: "trade", engine: "concrete", fields: [
    F("vol", "fld_volume", "0.5"), F("price", "fld_price", ""),
  ] },
  { id: "mortar", tab: "trade", engine: "mortar", fields: [
    F("area", "fld_area", "20"), F("usage", "fld_usage", "5"), F("bag", "fld_bag_kg", "25"), F("price", "fld_price_bag", ""),
  ] },
  { id: "screed", tab: "trade", engine: "screed", fields: [
    F("area", "fld_area", "20"), F("thk", "fld_thickness", "40"), F("bag", "fld_bag_kg", "25"), F("price", "fld_price", ""),
  ] },
  { id: "grout", tab: "trade", engine: "grout", fields: [
    F("area", "fld_area", "20"), F("tileL", "fld_tile_len", "600"), F("tileW", "fld_tile_w", "600"),
    F("tileThk", "fld_tile_thk", "9"), F("joint", "fld_joint", "3"),
    F("bag", "fld_bag_kg", "5"), F("price", "fld_price_bag", ""),
  ], presets: [
    // The same tile sizes the "tiles, panels, porcelain" calculator offers, minus the
    // laminate panel: a floating floor has no grouted joint. Only the two dimensions —
    // the thickness and the joint stay whatever is in the fields, because a format does
    // not fix either of them.
    { l: "Gres 60×60", k: "preset_gres1", v: { tileL: "600", tileW: "600" } },
    { l: "Gres 120×278", k: "preset_gres2", v: { tileL: "2780", tileW: "1200" } },
    { l: "Glazura 30×60", k: "preset_glaze", v: { tileL: "600", tileW: "300" } },
  ] },
  { id: "masonry", tab: "trade", engine: "masonry", fields: [
    F("area", "fld_area", "12"), F("openings", "fld_openings", "2"), F("pieces", "fld_pieces_per_m2", "11"),
    F("binder", "fld_binder", "20"), F("waste", "fld_waste", "5"), F("price", "fld_price", ""),
  ] },
  { id: "insulation", tab: "trade", engine: "insulation", fields: [
    F("area", "fld_area", "80"), F("foamThk", "fld_foam_thk", "15"), F("dowels", "fld_dowels_m2", "6"),
    F("adhesive", "fld_adhesive_m2", "5"), F("price", "fld_price", ""),
  ] },
  // FRAMING
  { id: "studwall", tab: "framing", engine: "studwall", fields: [
    F("width", "fld_width", "4"), F("height", "fld_height", "2.6"), F("studSp", "fld_stud_spacing", "0.6"),
    F("bar", "fld_bar_len", "3"), F("sides", "fld_board_sides", "2", { sel: [["1", "1"], ["2", "2"]] }), F("price", "fld_price", ""),
  ] },
  { id: "ceiling", tab: "framing", engine: "ceiling", fields: [
    F("width", "fld_width", "4"), F("length", "fld_length", "5"),
    F("mainSp", "fld_main_spacing", "0.4"), F("hangSp", "fld_hanger_spacing", "0.9"), F("price", "fld_price", ""),
  ] },
  { id: "drylining", tab: "framing", engine: "drylining", fields: [
    F("area", "fld_area", "12"), F("adhesive", "fld_adhesive_m2", "5"), F("price", "fld_price", ""),
  ] },
  { id: "sheathing", tab: "framing", engine: "sheathing", fields: [
    F("area", "fld_area", "30"), F("pieceW", "fld_sheet_w", "1250"), F("pieceL", "fld_sheet_l", "2500"),
    F("waste", "fld_waste", "10"), F("price", "fld_price", ""),
  ] },
];

/* ---------- Wiring ----------
   The markup for a calculator is rendered by scripts/build.mjs, server-side and already
   translated, so a crawler and a visitor without JavaScript both see the real fields.
   All this file does in the browser is attach the handlers to what is already there. */

/** Attach run / preset / Enter-key behaviour to one server-rendered `.calc` card. */
function wireCalculator(card) {
  const def = CALCS.find((c) => c.id === card.dataset.calc);
  if (!def || card.dataset.wired) return;
  card.dataset.wired = "1";

  const read = () => {
    const o = {};
    card.querySelectorAll("[data-k]").forEach((el) => (o[el.dataset.k] = el.value));
    return o;
  };
  const runBtn = card.querySelector("[data-run]");
  const stale = card.querySelector("[data-calc-stale]");

  /**
   * `byHand` separates the visitor asking for a number from the page catching up with
   * itself. The silent run on load only turns the server-rendered result into a live one
   * so "add to the project" has something to save; it is not somebody pressing a button,
   * so it must not relabel that button or scroll the page.
   */
  const run = (byHand) => {
    renderResult(card, ENGINES[def.engine](read()));
    if (stale) stale.hidden = true;
    if (!byHand) return;
    if (runBtn && runBtn.dataset.labelAgain) runBtn.textContent = runBtn.dataset.labelAgain;
    const box = card.querySelector("[data-result]");
    // On a phone the fields push the answer off screen; on a wide screen it is already
    // beside them and `nearest` correctly does nothing.
    if (box) box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  if (runBtn) runBtn.addEventListener("click", () => run(true));
  card.querySelectorAll("input").forEach((i) =>
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(true); } }));

  // A number on screen next to fields that no longer produced it is worse than no number.
  // Editing anything says so until the next calculation clears it.
  if (stale) {
    card.querySelectorAll("[data-k]").forEach((el) =>
      el.addEventListener("input", () => { stale.hidden = false; }));
  }

  if (def.presets) card.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => {
    const p = def.presets[+btn.dataset.preset];
    Object.entries(p.v).forEach(([k, v]) => { const el = card.querySelector(`[data-k="${k}"]`); if (el) el.value = v; });
    run(true);
  }));

  // The result box arrives from the build already holding the answer for the values the
  // form opens with (see calcCard() in src/pages.mjs). Running once turns that markup into
  // a real result object, so the actions under it work before the visitor changes anything.
  run(false);
}

/** Wire every calculator present on the page. */
function buildCalculators() {
  document.querySelectorAll(".calc[data-calc]").forEach(wireCalculator);
}

/* A result on screen carries a currency symbol, so it has to be redrawn when the visitor
   picks another currency. The amount is the one already calculated — switching currency
   relabels it, it does not convert it.
   The guard is for scripts/build.mjs, which runs the engines in Node to print the worked
   example on every calculator page and has no DOM. */
if (typeof document !== "undefined") {
  document.addEventListener("currencychange", () => {
    document.querySelectorAll(".calc[data-calc]").forEach((card) => {
      if (card.lastResult) renderResult(card, card.lastResult);
    });
  });
}

function renderResult(card, res) {
  const box = card.querySelector("[data-result]");
  const lang = document.documentElement.lang || "pl";
  box.classList.add("show");
  card.lastResult = res.err ? null : res;
  if (res.err) {
    box.classList.add("err");
    box.innerHTML = `<div>${t(res.err, lang)}</div>`;
    document.dispatchEvent(new CustomEvent("calcresult", { detail: { card, result: null } }));
    return;
  }
  box.classList.remove("err");
  const rows = (res.rows || []).map(([k, v]) => {
    const val = localizeRow(v, lang, (key) => t(key, lang));
    return `<div><span>${t(k, lang)}</span><b>${val}</b></div>`;
  });
  if (res.cost && res.cost > 0) rows.unshift(`<div><span>${t("res_cost", lang)}</span><b>${money(res.cost, lang)}</b></div>`);
  box.innerHTML = `<div class="muted eyebrow">${t("res_tobuy", lang)}</div>
    <div class="big">${qty(res.tobuy, lang)} <span class="figure-line">${unitLabel(res.unit, res.tobuy, lang, (k) => t(k, lang))}</span></div>
    <div class="rows">${rows.join("")}</div>`;

  // The workspace (assets/workspace-ui.js) hangs the "save to the estimate" button off
  // this. Nothing else listens, and the calculators keep working when it is not loaded.
  document.dispatchEvent(new CustomEvent("calcresult", { detail: { card, result: res } }));
}
