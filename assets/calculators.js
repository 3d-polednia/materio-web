/* LiczMat website — calculator engines ported 1:1 from the Kotlin app
   (core/calculation/**) and the UI that renders them. Pure math, runs entirely
   in the browser — nothing is sent anywhere, exactly like the offline app. */

/**
 * ⌈x⌉ and ⌊x⌋ that do not count a floating-point crumb as a whole extra package.
 *
 * 21,6 m² of floor at 1,44 m² per pack is exactly fifteen packs, but 21.6 / 1.44 comes
 * out of binary floating point as 15.000000000000002, so Math.ceil sold a sixteenth box.
 * The same error the other way loses a profile: 2,4 m ÷ 0,4 m is 5.999999999999999, so
 * Math.floor(…) + 1 gave a 2,4 m ceiling six CD runs instead of seven. Both are ordinary
 * room dimensions off the default forms, not exotic input.
 *
 * `snap` pulls a value lying within one part in 10⁹ of a whole number onto it before the
 * rounding decides. Nothing physical lives in that gap — needing 15,000000000000002
 * packs means fifteen packs — while a real remainder is millions of times larger and
 * still rounds up: 21,61 m² is sixteen packs here, exactly as before.
 *
 * The tolerance is relative and zero is excluded from it on purpose: a sliver of a square
 * metre still needs a whole package, so a positive quantity must never be snapped down to
 * nothing.
 */
const snap = (x) => {
  const r = Math.round(x);
  return r !== 0 && Math.abs(x - r) <= 1e-9 * Math.abs(r) ? r : x;
};
const ceil = (x) => Math.ceil(snap(x)), floor = (x) => Math.floor(snap(x));
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; };
const profilesAcross = (span, spacing) => floor(span / spacing) + 1;
/**
 * A field the engine has a default for: empty means "use the default", typed means typed.
 *
 * `num(f.bag) || 25` cannot tell those apart — it turns a typed 0 into 25 and answers with
 * a bag size nobody asked for, which is worse than refusing. The Kotlin defaults are
 * parameter defaults and only apply when the argument is left out, so this is what they
 * mean. Worst of the lot were the allowance fields in masonry and sheathing, where `|| 5`
 * and `|| 10` meant that asking for no allowance silently added one.
 *
 * It is deliberately not used for a field whose zero is a real value — a saw kerf of 0 mm
 * and a 0 % allowance in the tiles calculator both mean exactly what they say.
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
// The packer is quadratic in the piece count: every rectangle walks every sheet and every
// free area on it. The 100 000 ceiling used to be read one input row at a time, so a pasted
// list of four rows of 100 000 passed the check and then put 400 000 rectangles through that
// walk — the tab froze or ran out of memory. It is the whole list's ceiling now.
const PACK_MAX_PIECES = 100000;

/** Best-Area-Fit within the sheet's free rectangles, then guillotine-split. */
function tryPlaceGuillotine(sheet, w, h, canRotate, kerf, type) {
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
  sheet.placements.push({ sheet: sheet.index, x: rect.x, y: rect.y, w: pw, h: ph, rotated: bestRotated, type: type || 0 });

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
    const gross = num(f.area), cov = num(f.cov), coats = Math.round(orDefault(f.coats, 1)), price = num(f.price) || 0, open = num(f.openings) || 0;
    if (!(gross > 0) || !(cov > 0) || coats < 1 || open < 0 || open > gross) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const net = Math.max(gross - open, 0), covered = net * coats;
    const units = ceil(covered / cov), purchased = units * cov;
    const wastePct = purchased > 0 ? (purchased - covered) / purchased * 100 : 0;
    // The net area is what the openings changed, so it earns a line only when there are
    // any; "area to cover" is what the coats changed, likewise. `purchased` is the m² the
    // whole packs hold — the figure the waste percentage is measured against.
    return { tobuy: units, unit: "res_pkgs", cost: units * price, rows: [
      ...(open > 0 ? [["res_net", qtyG(net) + " m²"]] : []),
      ...(coats > 1 ? [["res_covered", qtyG(covered) + " m²"]] : []),
      ["res_purchased", qtyG(purchased) + " m²"],
      ["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"],
    ] };
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
  /**
   * Wallpaper. The result panel was a bare roll count: TradeCalc.wallpaper returns
   * `stripsNeeded` and `stripsPerRoll` as well, and those two are the whole reason the
   * count is what it is — with a pattern repeat a strip grows to a whole number of
   * repeats, and a roll that yielded three strips suddenly yields two. Session 10 puts
   * them on the page. The arithmetic is unchanged.
   */
  wallpaper(f) {
    const ww = num(f.wallW), wh = num(f.wallH), rw = orDefault(f.rollW, 0.53), rl = orDefault(f.rollL, 10.05), rep = num(f.pattern) || 0, price = num(f.price) || 0;
    if (!(ww > 0) || !(wh > 0) || !(rw > 0) || !(rl > 0) || rep < 0) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const stripLen = rep > 0 ? ceil(wh / rep) * rep : wh;
    const stripsNeeded = ceil(ww / rw), stripsPerRoll = floor(rl / stripLen);
    const rolls = stripsPerRoll <= 0 ? stripsNeeded : ceil(stripsNeeded / stripsPerRoll);
    return { tobuy: rolls, unit: "res_rolls", cost: rolls * price, rows: [
      ["res_strips", qtyG(stripsNeeded) + " × " + qtyG(stripLen) + " m"],
      // A strip taller than the whole roll is the engine's upper bound — one roll per
      // strip — and it has always been silent about it. Say so rather than print "0".
      stripsPerRoll > 0
        ? ["res_strips_roll", qtyG(stripsPerRoll)]
        : ["res_strips_roll", "|res_strip_too_long|"],
    ] };
  },
  linear(f) {
    const stock = num(f.stock), kerf = num(f.kerf) || 0, price = num(f.price) || 0, cuts = parseCuts(f.cuts);
    if (!(stock > 0) || kerf < 0 || kerf >= stock) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
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
    const SHOWN = 8;
    const plan = bars.slice(0, SHOWN).map((b, i) => ["res_bar", (i + 1) + ": " + b.pieces.map((x) => Math.round(x)).join(" + ") + " mm"]);
    return { tobuy: bars.length, unit: "res_stocks", cost: bars.length * price, rows: [
      ["res_pieces_cut", qtyG(pieces.length)],
      ["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"],
      ...plan,
      // The plan was cut off at eight bars without a word, so a 12-bar job looked like an
      // 8-bar one. Say how many are missing instead of hiding them.
      ...(bars.length > SHOWN ? [["res_plan_more", qtyG(bars.length - SHOWN)]] : []),
    ] };
  },
  sheet(f) {
    // 2D guillotine bin-packing — ported 1:1 from GuillotinePackingEngine.kt.
    // Free-rectangle guillotine split: on each placement the used free rect is cut into a
    // right and a bottom offcut, both shrunk by the kerf. Placement is best-area-fit.
    const SW = num(f.sheetW), SH = num(f.sheetL), kerf = num(f.kerf) || 0, price = num(f.price) || 0;
    const canRotate = String(f.rotate === undefined ? "1" : f.rotate) !== "0";
    if (!(SW > 0) || !(SH > 0) || kerf < 0) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    if (kerf >= SW || kerf >= SH) return { err: "err_kerf" };

    const fitsSheet = (w, h) =>
      (w <= SW + PACK_EPS && h <= SH + PACK_EPS) || (canRotate && h <= SW + PACK_EPS && w <= SH + PACK_EPS);

    // Count the whole list first, expand it second: the row that breaks the ceiling can be
    // the last one, and by then the earlier rows would already be rectangles in memory.
    const rows = [];
    let wanted = 0;
    for (const p of parsePieces(f.pieces)) {
      if (!(p.w > 0) || !(p.l > 0)) return { err: "err_positive" };
      if (p.q <= 0) continue;
      wanted += p.q;
      rows.push(p);
    }
    if (wanted > PACK_MAX_PIECES) return { err: "err_toomany" };

    const units = [];
    let type = 0;
    for (const p of rows) {
      if (!fitsSheet(p.w, p.l)) return { err: "err_toobig" };
      // One colour per distinct piece row so the picture reads like the input list.
      for (let i = 0; i < p.q; i++) units.push({ w: p.w, h: p.l, type });
      type++;
    }
    if (!units.length) return { err: "err_positive" };

    // Largest area first — better packing.
    const sorted = units.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    const sheets = [];
    for (const u of sorted) {
      let placed = false;
      for (const sheet of sheets) {
        if (tryPlaceGuillotine(sheet, u.w, u.h, canRotate, kerf, u.type)) { placed = true; break; }
      }
      if (!placed) {
        const sheet = { index: sheets.length + 1, free: [{ x: 0, y: 0, w: SW, h: SH }], placements: [] };
        sheets.push(sheet);
        // Guaranteed to fit an empty sheet (validated above), but guard anyway.
        if (!tryPlaceGuillotine(sheet, u.w, u.h, canRotate, kerf, u.type)) return { err: "err_toobig" };
      }
    }

    const useful = units.reduce((a, u) => a + u.w * u.h, 0) / 1e6;
    const purchased = sheets.length * SW * SH / 1e6;
    const wastePct = purchased > 0 ? (purchased - useful) / purchased * 100 : 0;
    return { tobuy: sheets.length, unit: "res_sheets", cost: sheets.length * price, rows: [
      ["res_pieces_cut", qtyG(units.length)],
      ["res_useful", qtyG(useful) + " m²"],
      ["res_purchased", qtyG(purchased) + " m²"],
      ["res_waste", qtyG(Math.round(wastePct * 10) / 10) + "%"],
    ], plan: {
      // Geometry (mm) for the cut-plan picture; the renderer only scales it, so the
      // drawing always matches the numbers above (CutPlanView.kt / SheetCutPlan).
      sheetW: SW, sheetH: SH,
      sheets: sheets.map((s) => s.placements),
    } };
  },
  /**
   * Bagged concrete. TradeCalc.concrete takes the bag yield and the water per bag as
   * parameters with defaults; the site had both welded in, so "40 bags" could not be
   * checked against the bag in front of you — a 20 kg bag does not yield 12,5 litres.
   * Session 10 puts the yield on the form at its Kotlin default, which is why the count
   * for the values the page opens with does not move.
   */
  concrete(f) {
    const vol = num(f.vol), yield_ = orDefault(f.yield, 12.5), price = num(f.price) || 0;
    if (!(vol > 0) || !(yield_ > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const litres = vol * 1000, bags = ceil(litres / yield_);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [
      ["res_volume_l", qtyG(litres) + " |res_water_l|"],
      ["res_water", qtyG(bags * 2) + " |res_water_l|"],
    ] };
  },
  mortar(f) {
    const area = num(f.area), usage = num(f.usage), bag = orDefault(f.bag, 25), price = num(f.price) || 0;
    if (!(area > 0) || !(usage > 0) || !(bag > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const kg = area * usage, bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [["res_kg_total", qtyG(kg) + " kg"]] };
  },
  /**
   * Screed / plaster. `kgPerM2PerMm` is a Kotlin parameter (2,0 for cement screed) that the
   * site had welded in, so a product with a different density could not be calculated at
   * all. It is a field now, at the same default — the same move as the concrete yield.
   */
  screed(f) {
    const area = num(f.area), thk = num(f.thk), rate = orDefault(f.rate, 2.0);
    const bag = orDefault(f.bag, 25), price = num(f.price) || 0;
    if (!(area > 0) || !(thk > 0) || !(rate > 0) || !(bag > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const kg = area * thk * rate, bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [
      ["res_kg_total", qtyG(kg) + " kg"],
      ["res_kg_m2", qtyG(thk * rate) + " kg/m²"],
    ] };
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
    // `|| 5` turned a typed 0 into 5 % waste, so asking for no allowance quietly added one.
    const area = num(f.area), open = num(f.openings) || 0, pcs = num(f.pieces), binder = num(f.binder) || 0, w = orDefault(f.waste, 5), price = num(f.price) || 0;
    if (!(area > 0) || !(pcs > 0) || binder < 0 || w < 0) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const net = Math.max(area - Math.max(open, 0), 0), units = ceil(net * pcs * (1 + w / 100));
    return { tobuy: units, unit: "res_pieces", cost: units * price, rows: [
      ["res_net", qtyG(net) + " m²"],
      ["res_binder", qtyG(net * binder) + " kg"],
    ] };
  },
  insulation(f) {
    const area = num(f.area), dow = orDefault(f.dowels, 6), adh = orDefault(f.adhesive, 5), thk = orDefault(f.foamThk, 15), price = num(f.price) || 0;
    if (!(area > 0) || !(dow > 0) || !(adh > 0) || !(thk > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const areaPerPkg = 0.30 * 100 / thk, foamPkgs = ceil(area / areaPerPkg);
    // The old first row read "80 m² · 15 cm" — the two values already in the fields above
    // it. TradeCalc.insulation returns the two figures that actually explain the pack
    // count: what one pack covers, and the individual 0,5 m² boards those packs contain.
    const boards = ceil(area / 0.5);
    return { tobuy: foamPkgs, unit: "res_pkgs", cost: foamPkgs * price, rows: [
      ["res_pkg_area", qtyG(areaPerPkg) + " m²"],
      ["res_foam_boards", qtyG(boards)],
      ["res_dowels", qtyG(ceil(area * dow))],
      ["res_adhesive", qtyG(area * adh) + " kg"], ["res_mesh", qtyG(area * 1.10) + " m²"],
    ] };
  },
  studwall(f) {
    const width = num(f.width), height = num(f.height), sp = orDefault(f.studSp, 0.6), bar = orDefault(f.bar, 3), sides = Math.round(orDefault(f.sides, 2)), price = num(f.price) || 0;
    if (!(width > 0) || !(height > 0) || !(sp > 0) || !(bar > 0) || sides < 1) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const studCount = profilesAcross(width, sp), studBars = studCount * ceil(height / bar);
    const trackBars = ceil(2 * width / bar), anchors = 2 * profilesAcross(width, 0.6);
    const boards = boardsFor(width * height, sides);
    // How many uprights the wall has is not the same number as the bars to buy for them —
    // a wall taller than one bar needs two per stud — and only the second was on the page.
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_area", qtyG(width * height) + " m²"],
      ["res_stud_count", qtyG(studCount)],
      ["res_studs", qtyG(studBars) + " × " + qtyG(bar) + " m"],
      ["res_tracks", qtyG(trackBars) + " × " + qtyG(bar) + " m"],
      ["res_anchors", qtyG(anchors)],
    ] };
  },
  ceiling(f) {
    const width = num(f.width), length = num(f.length), mainSp = orDefault(f.mainSp, 0.4), hangSp = orDefault(f.hangSp, 0.9), price = num(f.price) || 0;
    if (!(width > 0) || !(length > 0) || !(mainSp > 0) || !(hangSp > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const runs = profilesAcross(width, mainSp), mainTotal = runs * length, mainBars = ceil(mainTotal / 4);
    const perimeter = 2 * (width + length);
    const perimBars = ceil(perimeter / 3), hangers = runs * profilesAcross(length, hangSp);
    const connectors = Math.max(mainBars - runs, 0), boards = boardsFor(width * length, 1);
    // CeilingGridResult carries perimeterAnchors too, and the site dropped it: the UD
    // channel cannot be fixed to the walls without them, so the shopping list was short.
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_area", qtyG(width * length) + " m²"],
      ["res_studs", "CD: " + qtyG(mainBars) + " × 4 m"],
      ["res_tracks", "UD: " + qtyG(perimBars) + " × 3 m"],
      ["res_hangers", qtyG(hangers) + " (+" + qtyG(connectors) + ")"],
      ["res_anchors", qtyG(ceil(perimeter / 0.6))],
    ] };
  },
  drylining(f) {
    const area = num(f.area), adh = orDefault(f.adhesive, 5), price = num(f.price) || 0;
    if (!(area > 0) || !(adh > 0)) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const boards = boardsFor(area, 1), kg = area * adh, bags = ceil(kg / 25);
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_adhesive", qtyG(bags) + " × 25 kg (" + qtyG(kg) + " kg)"],
      ["res_purchased", qtyG(boards * GK_BOARD) + " m²"],
    ] };
  },
  sheathing(f) {
    // `|| 10` turned a typed 0 into a 10 % allowance nobody asked for.
    const area = num(f.area), pw = num(f.pieceW), pl = num(f.pieceL), w = orDefault(f.waste, 10), price = num(f.price) || 0;
    if (!(area > 0) || !(pw > 0) || !(pl > 0) || w < 0) return { err: "err_positive" };
    if (price < 0) return { err: "err_price" };
    const pieceArea = (pw / 1000) * (pl / 1000), withWaste = area * (1 + w / 100), pieces = ceil(withWaste / pieceArea);
    // The panel was the sheet count and nothing else. SheathingResult returns both of
    // these, and one sheet's area is the number that makes the count checkable.
    return { tobuy: pieces, unit: "res_sheets", cost: pieces * price, rows: [
      ["res_piece_area", qtyG(pieceArea) + " m²"],
      ["res_with_waste", qtyG(withWaste) + " m²"],
      ["res_purchased", qtyG(pieces * pieceArea) + " m²"],
    ] };
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

/* The unit next to the number, the plural rules behind it and the |token| substitution
   moved to assets/units.js in session 16: /projekty/ has to write "15 opak." under a
   saved calculation and has no business downloading the engines to do it. Every page that
   loads this file loads that one first. */

/* ---------- Calculator definitions (fields + presets) ---------- */
const F = (k, label, def, extra = {}) => Object.assign({ k, label, def }, extra);
const CALCS = [
  // SURFACES
  { id: "coverage", tab: "surface", engine: "coverage", fields: [
    F("area", "fld_area", "25"), F("cov", "fld_coverage_unit", "40"),
    F("coats", "fld_coats", "2"), F("openings", "fld_openings", "0"), F("price", "fld_price_pkg", ""),
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
    F("pattern", "fld_pattern", "0"), F("price", "fld_price_roll", ""),
  ] },
  // CUTTING
  { id: "linear", tab: "cutting", engine: "linear", fields: [
    F("stock", "fld_stock_len", "6000"), F("kerf", "fld_kerf", "3"),
    F("cuts", "fld_cuts", "2400x4\n1800x6\n900x8", { ta: true }), F("price", "fld_price_bar", ""),
  ] },
  { id: "sheet", tab: "cutting", engine: "sheet", fields: [
    F("sheetW", "fld_sheet_w", "2800"), F("sheetL", "fld_sheet_l", "2070"), F("kerf", "fld_kerf", "3"),
    F("pieces", "fld_pieces_list", "600x400x6\n800x300x4", { ta: true }),
    F("rotate", "fld_rotate", "1", { sel: [["1", "Tak", "opt_yes"], ["0", "Nie", "opt_no"]] }),
    F("price", "fld_price_sheet", ""),
  ] },
  // TRADE
  { id: "concrete", tab: "trade", engine: "concrete", fields: [
    F("vol", "fld_volume", "0.5"), F("yield", "fld_bag_yield", "12.5"), F("price", "fld_price_bag", ""),
  ] },
  { id: "mortar", tab: "trade", engine: "mortar", fields: [
    F("area", "fld_area", "20"), F("usage", "fld_usage", "5"), F("bag", "fld_bag_kg", "25"), F("price", "fld_price_bag", ""),
  ] },
  { id: "screed", tab: "trade", engine: "screed", fields: [
    F("area", "fld_area", "20"), F("thk", "fld_thickness", "40"), F("rate", "fld_kg_m2_mm", "2"),
    F("bag", "fld_bag_kg", "25"), F("price", "fld_price_bag", ""),
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
    F("binder", "fld_binder", "20"), F("waste", "fld_waste", "5"), F("price", "fld_price_pc", ""),
  ] },
  { id: "insulation", tab: "trade", engine: "insulation", fields: [
    F("area", "fld_area", "80"), F("foamThk", "fld_foam_thk", "15"), F("dowels", "fld_dowels_m2", "6"),
    F("adhesive", "fld_adhesive_m2", "5"), F("price", "fld_price_pkg", ""),
  ] },
  // FRAMING
  { id: "studwall", tab: "framing", engine: "studwall", fields: [
    F("width", "fld_width", "4"), F("height", "fld_height", "2.6"), F("studSp", "fld_stud_spacing", "0.6"),
    F("bar", "fld_bar_len", "3"), F("sides", "fld_board_sides", "2", { sel: [["1", "1"], ["2", "2"]] }), F("price", "fld_price_board", ""),
  ] },
  { id: "ceiling", tab: "framing", engine: "ceiling", fields: [
    F("width", "fld_width", "4"), F("length", "fld_length", "5"),
    F("mainSp", "fld_main_spacing", "0.4"), F("hangSp", "fld_hanger_spacing", "0.9"), F("price", "fld_price_board", ""),
  ] },
  { id: "drylining", tab: "framing", engine: "drylining", fields: [
    F("area", "fld_area", "12"), F("adhesive", "fld_adhesive_m2", "5"), F("price", "fld_price_board", ""),
  ] },
  { id: "sheathing", tab: "framing", engine: "sheathing", fields: [
    F("area", "fld_area", "30"), F("pieceW", "fld_sheet_w", "1250"), F("pieceL", "fld_sheet_l", "2500"),
    F("waste", "fld_waste", "10"), F("price", "fld_price_sheet", ""),
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
    renderResult(card, ENGINES[def.engine](read()), byHand);
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

/**
 * Put new markup into the result box — unless it already says the same thing.
 *
 * The box is a live region (`role="status"` in src/pages.mjs), which is what tells a
 * screen reader the answer after somebody presses "Policz". The price of that is this
 * function: the silent run on load re-renders the result the build had already written
 * into the page, and writing identical content into a live region has the answer read
 * out the moment the page finishes loading, unasked.
 *
 * The comparison is of the words rather than of the markup, because the build indents
 * its HTML and this file does not — and the words are exactly what would be announced.
 * When they differ the write happens as before, so a visitor whose currency is not the
 * language's default still gets their own symbol on load.
 */
function writeResult(box, html) {
  const words = (s) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (words(html) !== words(box.innerHTML)) box.innerHTML = html;
}

/**
 * Draw one result into a card.
 *
 * `byHand` travels out on the `calcresult` event because two listeners need to tell the
 * visitor apart from the page: assets/recent.js records a tool as *used* only when
 * somebody asked for the number, and the silent run on load (and the redraw after a
 * currency switch) must not count as using it.
 */
function renderResult(card, res, byHand) {
  const box = card.querySelector("[data-result]");
  const lang = document.documentElement.lang || "pl";
  box.classList.add("show");
  card.lastResult = res.err ? null : res;
  if (res.err) {
    box.classList.add("err");
    writeResult(box, `<div>${t(res.err, lang)}</div>`);
    document.dispatchEvent(new CustomEvent("calcresult", { detail: { card, result: null, byHand: Boolean(byHand) } }));
    return;
  }
  box.classList.remove("err");
  const rows = (res.rows || []).map(([k, v]) => {
    const val = localizeRow(v, lang, (key) => t(key, lang));
    return `<div><span>${t(k, lang)}</span><b>${val}</b></div>`;
  });
  if (res.cost && res.cost > 0) rows.unshift(`<div><span>${t("res_cost", lang)}</span><b>${money(res.cost, lang)}</b></div>`);
  writeResult(box, `<div class="muted eyebrow">${t("res_tobuy", lang)}</div>
    <div class="big">${qty(res.tobuy, lang)} <span class="figure-line">${unitLabel(res.unit, res.tobuy, lang, (k) => t(k, lang))}</span></div>
    <div class="rows">${rows.join("")}</div>${card.dataset.calc === "sheet" && res.plan ? renderSheetCutPlan(res.plan, lang) : ""}`);

  // The workspace (assets/workspace-ui.js) hangs the "save to the estimate" button off
  // this. Nothing else listens, and the calculators keep working when it is not loaded.
  document.dispatchEvent(new CustomEvent("calcresult", { detail: { card, result: res, byHand: Boolean(byHand) } }));
}

function renderSheetCutPlan(plan, lang) {
  if (!plan.sheets || !plan.sheets.length) return '';
  const sheetW = plan.sheetW || 1;
  const sheetH = plan.sheetH || 1;
  const shown = plan.sheets.slice(0, 4);

  const colors = ['var(--accent)', 'var(--tertiary)', 'var(--success)', 'var(--warning)'];

  let html = `<div class="cutplan">
    <div class="cutplan-label">${t("res_cut_plan", lang) || "Plan cięcia"}</div>
    <div class="cutplan-sheets">`;
  shown.forEach((placements, index) => {
    const sheetIdx = index + 1;
    const svgW = 200;
    const svgH = Math.round(svgW * (sheetH / sheetW));

    html += `<div class="cutplan-sheet-box">
      <div class="cutplan-label">${t("res_sheet", lang) || "Arkusz"} ${sheetIdx} (${placements.length})</div>
      <svg viewBox="0 0 ${svgW} ${svgH}" class="cutplan-sheet" preserveAspectRatio="xMidYMid meet">
        <rect width="${svgW}" height="${svgH}" fill="var(--surface-container)" stroke="var(--outline-strong)" stroke-width="2"/>`;

    placements.forEach((p, i) => {
      const x = (p.x / sheetW) * svgW;
      const y = (p.y / sheetH) * svgH;
      const w = (p.w / sheetW) * svgW;
      const h = (p.h / sheetH) * svgH;
      const fill = colors[p.type % colors.length];
      html += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="0.25" stroke="${fill}" stroke-width="1.5"/>`;
    });

    html += `</svg></div>`;
  });

  html += `</div>`;
  if (plan.sheets.length > shown.length) {
    html += `<div class="cutplan-more muted">+${plan.sheets.length - shown.length} ${t("res_plan_more_sheets", lang) || "więcej arkuszy"}</div>`;
  }
  html += `</div>`;
  return html;
}


