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
/**
 * The digits of a typed number, with the grouping taken out.
 *
 * Every input on this site is `type="text" inputmode="decimal"` (src/pages.mjs), so what
 * arrives is whatever somebody's own keyboard produced, and in most of the thirteen
 * languages that is a space or a point for thousands and a comma for the decimal. The old
 * `String(v).replace(",", ".")` swapped the FIRST comma and nothing else, so `parseFloat`
 * stopped at the first character it could not use: "1 000" was one, and a price of one
 * złoty per square metre went into the shopping list without a word. The same defect was
 * found in `pdfNum()` in the second audit round (session H) and fixed there alone.
 *
 * The rule is that reader's: drop every space — a plain one, a no-break one and a narrow
 * one, because "1 000 zł" pasted out of a spreadsheet carries U+00A0 — and then let the
 * LAST separator in the string be the decimal point and the earlier ones be grouping.
 *
 * It hands back a string rather than a number: what a non-number means is each reader's
 * own answer, and the ones here are NaN.
 */
const typedDigits = (v) => {
  const raw = String(v === undefined || v === null ? "" : v).replace(/[ \u00a0\u202f]/g, "");
  if (!/^[+-]?\d+(?:[.,]\d+)*$/.test(raw)) return "";
  const unsigned = raw.replace(/^[+-]/, ""), sign = raw.slice(0, raw.length - unsigned.length);
  const seps = [...unsigned].filter((ch) => ch === "," || ch === ".");
  if (!seps.length) return raw;
  if (seps.length === 1) {
    const cut = Math.max(raw.lastIndexOf(","), raw.lastIndexOf("."));
    return `${raw.slice(0, cut)}.${raw.slice(cut + 1)}`;
  }
  const kinds = new Set(seps);
  if (kinds.size === 1) {
    const groups = unsigned.split(seps[0]);
    return groups[0].length <= 3 && groups.slice(1).every((g) => g.length === 3)
      ? sign + groups.join("") : "";
  }
  const cut = Math.max(unsigned.lastIndexOf(","), unsigned.lastIndexOf("."));
  const whole = unsigned.slice(0, cut), fraction = unsigned.slice(cut + 1);
  const grouping = whole.includes(",") ? "," : ".";
  const groups = whole.split(grouping);
  if (!fraction || groups[0].length > 3 || !groups.slice(1).every((g) => g.length === 3)) return "";
  return sign + groups.join("") + "." + fraction;
};
const num = (v) => { const n = parseFloat(typedDigits(v)); return isFinite(n) ? n : NaN; };
/**
 * A price field, told apart from an empty one.
 *
 * A blank price means "no price" and is worth 0; `abc` in the same field is a mistake and
 * is worth nothing at all. `num()` answers NaN to both, and the old `num(f.price) || 0` turned
 * that NaN into a free material — a quantity, a shopping list and no cost, which reads like
 * a correct estimate rather than a typo (audit 2026-09-04, M5). The emptiness is decided on
 * the raw text before it is parsed; anything else that is not a number leaves here as NaN,
 * and every engine rejects it, because `price < 0` never did.
 */
const priceOf = (v) => (String(v === undefined || v === null ? "" : v).trim() === "" ? 0 : num(v));
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

/** Read one numeric calculator field, preserving its identity on failure. */
function readField(field, raw) {
  const blank = String(raw === undefined || raw === null ? "" : raw).trim() === "";
  if (blank) return field.opt
    ? { value: field.fallback === undefined ? num(field.def) : field.fallback }
    : { err: "err_required", field: field.k };
  const value = num(raw);
  return Number.isFinite(value) ? { value } : { err: "err_number", field: field.k };
}

function readCalc(id, raw) {
  const calc = CALCS.find((c) => c.id === id), values = {};
  for (const field of calc.fields) {
    if (field.ta) continue;
    const got = readField(field, raw[field.k]);
    if (got.err) return got;
    values[field.k] = got.value;
  }
  return { values };
}
const errAt = (err, field) => ({ err, field });
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
function calcFieldValue(value, lang) {
  const plain = String(value === undefined || value === null ? "" : value);
  return String(lang || "pl").toLowerCase().split("-")[0] === "en"
    ? plain.replace(/,/g, ".") : plain.replace(/\./g, ",");
}
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
    const read = readCalc("coverage", f); if (read.err) return read;
    const { area: gross, cov, openings: open, price } = read.values, coats = Math.round(read.values.coats);
    if (!(gross > 0)) return errAt("err_positive", "area");
    if (!(cov > 0)) return errAt("err_positive", "cov");
    if (coats < 1) return errAt("err_positive", "coats");
    if (open < 0) return errAt("err_positive", "openings");
    if (open > gross) return errAt("err_openings", "openings");
    if (price < 0) return errAt("err_price", "price");
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
    const read = readCalc("waste", f); if (read.err) return read;
    const { area, cov, waste: w, price } = read.values;
    if (!(area > 0)) return errAt("err_positive", "area");
    if (!(cov > 0)) return errAt("err_positive", "cov");
    if (w < 0) return errAt("err_positive", "waste");
    if (price < 0) return errAt("err_price", "price");
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
    const read = readCalc("wallpaper", f); if (read.err) return read;
    const { wallW: ww, wallH: wh, rollW: rw, rollL: rl, pattern: rep, trim, price } = read.values;
    for (const [field, value] of [["wallW", ww], ["wallH", wh], ["rollW", rw], ["rollL", rl]]) if (!(value > 0)) return errAt("err_positive", field);
    if (rep < 0) return errAt("err_positive", "pattern");
    if (trim < 0) return errAt("err_positive", "trim");
    if (price < 0) return errAt("err_price", "price");
    const cutLen = wh + trim / 100;
    const stripLen = rep > 0 ? ceil(cutLen / rep) * rep : cutLen;
    // A strip longer than the roll cannot be cut from any roll on that shelf, so there is
    // no number of rolls to buy. The engine used to answer one roll per strip and label the
    // row "pas dłuższy niż rolka" — the row said the truth while `tobuy` still printed a
    // figure that reads like an order. `linear` refuses a piece longer than the bar with
    // err_toobig; a strip longer than the roll is the same refusal.
    if (stripLen > rl) return errAt("err_toobig", "rollL");
    const stripsNeeded = ceil(ww / rw), stripsPerRoll = floor(rl / stripLen);
    const rolls = ceil(stripsNeeded / stripsPerRoll);
    return { tobuy: rolls, unit: "res_rolls", cost: rolls * price, rows: [
      ["res_strips", qtyG(stripsNeeded) + " × " + qtyG(stripLen) + " m"],
      ["res_strips_roll", qtyG(stripsPerRoll)],
    ] };
  },
  linear(f) {
    const read = readCalc("linear", f); if (read.err) return read;
    const { stock, kerf, price } = read.values, cuts = parseCuts(f.cuts);
    if (!(stock > 0)) return errAt("err_positive", "stock");
    if (kerf < 0 || kerf >= stock) return errAt("err_positive", "kerf");
    if (price < 0) return errAt("err_price", "price");
    // Count the whole list first, expand it second: the row that breaks the ceiling can be
    // the last one, and by then the earlier rows would already be numbers in memory.
    let wanted = 0;
    for (const c of cuts) { if (!(c.len > 0) || c.q <= 0) continue; wanted += c.q; }
    if (wanted > PACK_MAX_PIECES) return errAt("err_toomany", "cuts");

    const pieces = [];
    for (const c of cuts) { if (!(c.len > 0) || c.q <= 0) continue; for (let i = 0; i < c.q; i++) pieces.push(c.len); }
    if (!pieces.length) return errAt("err_positive", "cuts");
    if (Math.max(...pieces) > stock) return errAt("err_toobig", "cuts");
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
    const plan = bars.slice(0, SHOWN).map((b, i) => ["res_bar_n", "§row-n:" + (i + 1) + "§" + b.pieces.map((x) => Math.round(x)).join(" + ") + " mm"]);
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
    const read = readCalc("sheet", f); if (read.err) return read;
    const { sheetW: SW, sheetL: SH, kerf, price } = read.values;
    const canRotate = String(f.rotate === undefined ? "1" : f.rotate) !== "0";
    if (!(SW > 0)) return errAt("err_positive", "sheetW");
    if (!(SH > 0)) return errAt("err_positive", "sheetL");
    if (kerf < 0) return errAt("err_positive", "kerf");
    if (price < 0) return errAt("err_price", "price");
    if (kerf >= SW || kerf >= SH) return errAt("err_kerf", "kerf");

    const fitsSheet = (w, h) =>
      (w <= SW + PACK_EPS && h <= SH + PACK_EPS) || (canRotate && h <= SW + PACK_EPS && w <= SH + PACK_EPS);

    // Count the whole list first, expand it second: the row that breaks the ceiling can be
    // the last one, and by then the earlier rows would already be rectangles in memory.
    const rows = [];
    let wanted = 0;
    for (const p of parsePieces(f.pieces)) {
      if (!(p.w > 0) || !(p.l > 0)) return errAt("err_positive", "pieces");
      if (p.q <= 0) continue;
      wanted += p.q;
      rows.push(p);
    }
    if (wanted > PACK_MAX_PIECES) return errAt("err_toomany", "pieces");

    const units = [];
    let type = 0;
    for (const p of rows) {
      if (!fitsSheet(p.w, p.l)) return errAt("err_toobig", "pieces");
      // One colour per distinct piece row so the picture reads like the input list.
      for (let i = 0; i < p.q; i++) units.push({ w: p.w, h: p.l, type });
      type++;
    }
    if (!units.length) return errAt("err_positive", "pieces");

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
        if (!tryPlaceGuillotine(sheet, u.w, u.h, canRotate, kerf, u.type)) return errAt("err_toobig", "pieces");
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
    const read = readCalc("concrete", f); if (read.err) return read;
    const { vol, yield: yield_, price } = read.values;
    if (!(vol > 0)) return errAt("err_positive", "vol");
    if (!(yield_ > 0)) return errAt("err_positive", "yield");
    if (price < 0) return errAt("err_price", "price");
    const litres = vol * 1000, bags = ceil(litres / yield_);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [
      ["res_volume_l", qtyG(litres) + " |res_water_l|"],
      ["res_water", qtyG(bags * 2) + " |res_water_l|"],
    ] };
  },
  mortar(f) {
    const read = readCalc("mortar", f); if (read.err) return read;
    const { area, usage, bag, price } = read.values;
    for (const [field, value] of [["area", area], ["usage", usage], ["bag", bag]]) if (!(value > 0)) return errAt("err_positive", field);
    if (price < 0) return errAt("err_price", "price");
    const kg = area * usage, bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [["res_kg_total", qtyG(kg) + " kg"]] };
  },
  /**
   * Screed / plaster. `kgPerM2PerMm` is a Kotlin parameter (2,0 for cement screed) that the
   * site had welded in, so a product with a different density could not be calculated at
   * all. It is a field now, at the same default — the same move as the concrete yield.
   */
  screed(f) {
    const read = readCalc("screed", f); if (read.err) return read;
    const { area, thk, rate, bag, price } = read.values;
    for (const [field, value] of [["area", area], ["thk", thk], ["rate", rate], ["bag", bag]]) if (!(value > 0)) return errAt("err_positive", field);
    if (price < 0) return errAt("err_price", "price");
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
    const read = readCalc("grout", f); if (read.err) return read;
    const { area, tileL: L, tileW: W, tileThk: thk, joint, bag, price } = read.values;
    for (const [field, value] of [["area", area], ["tileL", L], ["tileW", W], ["tileThk", thk], ["joint", joint], ["bag", bag]]) if (!(value > 0)) return errAt("err_positive", field);
    if (price < 0) return errAt("err_price", "price");
    const kgPerM2 = (L + W) / (L * W) * thk * joint * 1.8, kg = kgPerM2 * area;
    const bags = ceil(kg / bag);
    return { tobuy: bags, unit: "res_bags", cost: bags * price, rows: [
      ["res_kg_total", qtyG(kg) + " kg"],
      ["res_kg_m2", qtyG(kgPerM2) + " kg/m²"],
    ] };
  },
  masonry(f) {
    // `|| 5` turned a typed 0 into 5 % waste, so asking for no allowance quietly added one.
    const read = readCalc("masonry", f); if (read.err) return read;
    const { area, openings: open, pieces: pcs, binder, waste: w, price } = read.values;
    // `coverage` above rejects `open > gross`; this engine clamped the same case to a net of
    // zero and answered "0 bloczków" as a valid result (audit 2026-09-04, M4). One calculator,
    // one answer: more openings than wall is bad data in both.
    if (!(area > 0)) return errAt("err_positive", "area");
    if (!(pcs > 0)) return errAt("err_positive", "pieces");
    for (const [field, value] of [["binder", binder], ["waste", w], ["openings", open]]) if (value < 0) return errAt("err_positive", field);
    if (open > area) return errAt("err_openings", "openings");
    if (price < 0) return errAt("err_price", "price");
    const net = Math.max(area - Math.max(open, 0), 0), units = ceil(net * pcs * (1 + w / 100));
    return { tobuy: units, unit: "res_pieces", cost: units * price, rows: [
      ["res_net", qtyG(net) + " m²"],
      ["res_binder", qtyG(net * binder) + " kg"],
    ] };
  },
  insulation(f) {
    const read = readCalc("insulation", f); if (read.err) return read;
    const { area, dowels: dow, adhesive: adh, foamThk: thk, price } = read.values;
    for (const [field, value] of [["area", area], ["dowels", dow], ["adhesive", adh], ["foamThk", thk]]) if (!(value > 0)) return errAt("err_positive", field);
    if (price < 0) return errAt("err_price", "price");
    const areaPerPkg = 0.30 * 100 / thk, foamPkgs = ceil(area / areaPerPkg);
    // The old first row read "80 m² · 15 cm" — the two values already in the fields above
    // it. TradeCalc.insulation returns the two figures that actually explain the pack
    // count: what one pack covers, and the individual 0,5 m² boards those packs contain.
    const boards = ceil(area / 0.5);
    return { tobuy: foamPkgs, unit: "res_pkgs", cost: foamPkgs * price, rows: [
      ["res_pkg_area", qtyG(areaPerPkg) + " m²"],
      ["res_foam_boards", qtyG(boards)],
      ["res_dowels", qtyG(ceil(area * dow))],
      ["res_adhesive", qtyG(area * adh) + " kg (" + qtyG(ceil(area * adh / 25)) + " |res_bags| × 25 kg)"],
      ["res_boards_per_pkg", qtyG(areaPerPkg / 0.5)],
      ["res_mesh", qtyG(area * 1.10) + " m²"],
    ] };
  },
  studwall(f) {
    const read = readCalc("studwall", f); if (read.err) return read;
    const { width, height, studSp: sp, bar, boardArea, price } = read.values, sides = Math.round(read.values.sides);
    for (const [field, value] of [["width", width], ["height", height], ["studSp", sp], ["bar", bar], ["sides", sides], ["boardArea", boardArea]]) if (!(value > 0)) return errAt("err_positive", field);
    if (price < 0) return errAt("err_price", "price");
    const studCount = ceil(width / sp) + 1, studBars = studCount * ceil(height / bar);
    const trackBars = ceil(2 * width / bar), anchors = 2 * profilesAcross(width, 0.6);
    const boards = boardsFor(width * height, sides, boardArea);
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
    const read = readCalc("ceiling", f); if (read.err) return read;
    const { width, length, mainSp, hangSp, boardArea, price } = read.values;
    for (const [field, value] of [["width", width], ["length", length], ["mainSp", mainSp], ["hangSp", hangSp], ["boardArea", boardArea]]) if (!(value > 0)) return errAt("err_positive", field);
    if (price < 0) return errAt("err_price", "price");
    const runs = profilesAcross(width, mainSp), mainTotal = runs * length, mainBars = ceil(mainTotal / 4);
    const perimeter = 2 * (width + length);
    const perimBars = ceil(perimeter / 3), hangers = runs * profilesAcross(length, hangSp);
    const connectors = Math.max(mainBars - runs, 0), boards = boardsFor(width * length, 1, boardArea);
    // CeilingGridResult carries perimeterAnchors too, and the site dropped it: the UD
    // channel cannot be fixed to the walls without them, so the shopping list was short.
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_area", qtyG(width * length) + " m²"],
      ["res_cd_profiles", qtyG(mainBars) + " × 4 m"],
      ["res_ud_profiles", qtyG(perimBars) + " × 3 m"],
      ["res_hangers", qtyG(hangers)],
      ["res_cd_connectors", qtyG(connectors)],
      ["res_anchors", qtyG(ceil(perimeter / 0.6))],
    ] };
  },
  drylining(f) {
    const read = readCalc("drylining", f); if (read.err) return read;
    const { area, adhesive: adh, boardArea, price } = read.values;
    if (!(area > 0)) return errAt("err_positive", "area");
    if (!(adh > 0)) return errAt("err_positive", "adhesive");
    if (!(boardArea > 0)) return errAt("err_positive", "boardArea");
    if (price < 0) return errAt("err_price", "price");
    const boards = boardsFor(area, 1, boardArea), kg = area * adh, bags = ceil(kg / 25);
    return { tobuy: boards, unit: "res_boards", cost: boards * price, rows: [
      ["res_adhesive", qtyG(bags) + " × 25 kg (" + qtyG(kg) + " kg)"],
      ["res_purchased", qtyG(boards * boardArea) + " m²"],
    ] };
  },
  sheathing(f) {
    // `|| 10` turned a typed 0 into a 10 % allowance nobody asked for.
    const read = readCalc("sheathing", f); if (read.err) return read;
    const { area, pieceW: pw, pieceL: pl, waste: w, price } = read.values;
    for (const [field, value] of [["area", area], ["pieceW", pw], ["pieceL", pl]]) if (!(value > 0)) return errAt("err_positive", field);
    if (w < 0) return errAt("err_positive", "waste");
    if (price < 0) return errAt("err_price", "price");
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
    F("coats", "fld_coats", "2", { opt: true, fallback: 1 }), F("openings", "fld_openings", "0", { opt: true, fallback: 0 }), F("price", "fld_price_pkg", "", { opt: true, fallback: 0 }),
  ], presets: [
    { l: "Farba 10 l", k: "preset_paint", m: "farba-scienna-10" }, { l: "Grunt 5 l", k: "preset_primer", m: "grunt-gleb-5" },
    { l: "Gładź 20 kg", k: "preset_filler", m: "gladz-gips-20" }, { l: "Klej C2 25 kg", k: "preset_adhesive", m: "klej-c2-25" },
  ] },
  { id: "waste", tab: "surface", engine: "waste", fields: [
    F("area", "fld_area", "20"), F("cov", "fld_pkg_cov", "1.44"),
    F("waste", "fld_waste", "7", { opt: true, fallback: 0 }), F("price", "fld_price_pkg", "", { opt: true, fallback: 0 }),
  ], presets: [
    { l: "Gres 60×60", k: "preset_gres1", m: "gres-60x60" }, { l: "Gres 120×278", k: "preset_gres2", m: "gres-120x278" },
    { l: "Panel AC4", k: "preset_panel", m: "panel-ac4" }, { l: "Glazura 30×60", k: "preset_glaze", m: "glaz-30x60" },
  ] },
  { id: "wallpaper", tab: "surface", engine: "wallpaper", fields: [
    F("wallW", "fld_width", "4"), F("wallH", "fld_height", "2.6"),
    F("rollW", "fld_roll_w", "0.53", { opt: true }), F("rollL", "fld_roll_l", "10.05", { opt: true }),
    F("pattern", "fld_pattern", "0", { opt: true }), F("trim", "fld_trim", "10", { opt: true, fallback: 10 }),
    F("price", "fld_price_roll", "", { opt: true, fallback: 0 }),
  ] },
  // CUTTING
  { id: "linear", tab: "cutting", engine: "linear", fields: [
    F("stock", "fld_stock_len", "6000"), F("kerf", "fld_kerf", "3", { opt: true, fallback: 0 }),
    F("cuts", "fld_cuts", "2400x4\n1800x6\n900x8", { ta: true }), F("price", "fld_price_bar", "", { opt: true, fallback: 0 }),
  ] },
  { id: "sheet", tab: "cutting", engine: "sheet", fields: [
    F("sheetW", "fld_sheet_w", "2800"), F("sheetL", "fld_sheet_l", "2070"), F("kerf", "fld_kerf", "3", { opt: true, fallback: 0 }),
    F("pieces", "fld_pieces_list", "600x400x6\n800x300x4", { ta: true }),
    F("rotate", "fld_rotate", "1", { sel: [["1", "Tak", "opt_yes"], ["0", "Nie", "opt_no"]] }),
    F("price", "fld_price_sheet", "", { opt: true, fallback: 0 }),
  ] },
  // TRADE
  { id: "concrete", tab: "trade", engine: "concrete", fields: [
    F("vol", "fld_volume", "0.5"), F("yield", "fld_bag_yield", "12.5", { opt: true }), F("price", "fld_price_bag", "", { opt: true, fallback: 0 }),
  ] },
  { id: "mortar", tab: "trade", engine: "mortar", fields: [
    F("area", "fld_area", "20"), F("usage", "fld_usage", "5"), F("bag", "fld_bag_kg", "25", { opt: true }), F("price", "fld_price_bag", "", { opt: true, fallback: 0 }),
  ] },
  { id: "screed", tab: "trade", engine: "screed", fields: [
    F("area", "fld_area", "20"), F("thk", "fld_thickness", "40"), F("rate", "fld_kg_m2_mm", "2", { opt: true }),
    F("bag", "fld_bag_kg", "25", { opt: true }), F("price", "fld_price_bag", "", { opt: true, fallback: 0 }),
  ] },
  { id: "grout", tab: "trade", engine: "grout", fields: [
    F("area", "fld_area", "20"), F("tileL", "fld_tile_len", "600"), F("tileW", "fld_tile_w", "600"),
    F("tileThk", "fld_tile_thk", "9"), F("joint", "fld_joint", "3"),
    F("bag", "fld_bag_kg", "5", { opt: true }), F("price", "fld_price_bag", "", { opt: true, fallback: 0 }),
  ], presets: [
    // The same tile sizes the "tiles, panels, porcelain" calculator offers, minus the
    // laminate panel: a floating floor has no grouted joint. Only the two dimensions —
    // the thickness and the joint stay whatever is in the fields, because a format does
    // not fix either of them.
    { l: "Gres 60×60", k: "preset_gres1", m: "gres-60x60" },
    { l: "Gres 120×278", k: "preset_gres2", m: "gres-120x278" },
    { l: "Glazura 30×60", k: "preset_glaze", m: "glaz-30x60" },
  ] },
  { id: "masonry", tab: "trade", engine: "masonry", fields: [
    F("area", "fld_area", "12"), F("openings", "fld_openings", "2", { opt: true, fallback: 0 }), F("pieces", "fld_pieces_per_m2", "11"),
    F("binder", "fld_binder", "20", { opt: true, fallback: 0 }), F("waste", "fld_waste", "5", { opt: true }), F("price", "fld_price_pc", "", { opt: true, fallback: 0 }),
  ] },
  { id: "insulation", tab: "trade", engine: "insulation", fields: [
    F("area", "fld_area", "80"), F("foamThk", "fld_foam_thk", "15", { opt: true }), F("dowels", "fld_dowels_m2", "6", { opt: true }),
    F("adhesive", "fld_adhesive_m2", "5", { opt: true }), F("price", "fld_price_pkg", "", { opt: true, fallback: 0 }),
  ] },
  // FRAMING
  { id: "studwall", tab: "framing", engine: "studwall", fields: [
    F("width", "fld_width", "4"), F("height", "fld_height", "2.6"), F("studSp", "fld_stud_spacing", "0.6", { opt: true }),
    F("bar", "fld_bar_len", "3", { opt: true }), F("sides", "fld_board_sides", "2", { opt: true, sel: [["1", "1"], ["2", "2"]] }),
    F("boardArea", "fld_board_area", "2.4", { opt: true, fallback: 2.4 }), F("price", "fld_price_board", "", { opt: true, fallback: 0 }),
  ] },
  { id: "ceiling", tab: "framing", engine: "ceiling", fields: [
    F("width", "fld_width", "4"), F("length", "fld_length", "5"),
    F("mainSp", "fld_main_spacing", "0.4", { opt: true }), F("hangSp", "fld_hanger_spacing", "0.9", { opt: true }),
    F("boardArea", "fld_board_area", "2.4", { opt: true, fallback: 2.4 }), F("price", "fld_price_board", "", { opt: true, fallback: 0 }),
  ] },
  { id: "drylining", tab: "framing", engine: "drylining", fields: [
    F("area", "fld_area", "12"), F("adhesive", "fld_adhesive_m2", "5", { opt: true }),
    F("boardArea", "fld_board_area", "2.4", { opt: true, fallback: 2.4 }), F("price", "fld_price_board", "", { opt: true, fallback: 0 }),
  ] },
  { id: "sheathing", tab: "framing", engine: "sheathing", fields: [
    F("area", "fld_area", "30"), F("pieceW", "fld_sheet_w", "1250"), F("pieceL", "fld_sheet_l", "2500"),
    F("waste", "fld_waste", "10", { opt: true }), F("price", "fld_price_sheet", "", { opt: true, fallback: 0 }),
  ] },
];

/* ---------- Wiring ----------
   The markup for a calculator is rendered by scripts/build.mjs, server-side and already
   translated, so a crawler and a visitor without JavaScript both see the real fields.
   All this file does in the browser is attach the handlers to what is already there. */

/**
 * The fields an engine's refusal is about.
 *
 * The message lands in the result box, which is a live region and therefore IS announced
 * — but "podaj dodatnie wartości" says nothing about which of five fields is wrong, and a
 * screen reader has no way to reach the offending one from the message. The answer has to
 * come from the engine, because the engine owns the rules: a field is the problem when
 * the form is STILL refused with every other field back at the value the page opens with.
 * Those defaults are valid by construction — the build renders a worked example from them
 * on every calculator page — so anything still refused is down to the one field left
 * alone. A rule spanning two fields (a kerf wider than the sheet) may name neither, and
 * that is honest: the message stays, and nothing false is pinned on a field.
 *
 * A <select> is left out: its options are the engine's own values and none of them can be
 * typed wrong.
 */
function invalidFields(calcId, values) {
  const def = CALCS.find((c) => c.id === calcId);
  if (!def) return [];
  const engine = ENGINES[def.engine];
  const result = engine && engine(values);
  return result && result.err && result.field ? [result.field] : [];
}

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

  /* Audit item M9. The card is a <form> with a submit button (calcCard() in
     src/pages.mjs), so the one event to answer is `submit`: it is what the button, the
     Enter key in a field and the phone keyboard's "Go" all produce. preventDefault()
     because the answer is worked out here and nothing is sent anywhere — without it the
     browser would reload the page and throw the result away.

     The click branch below is the fallback for a card that is not inside a form, and
     with it the Enter key has to be caught by hand: implicit submission is a form's
     behaviour, and outside one Enter in a text field does nothing at all. */
  const form = runBtn && runBtn.form;
  if (form) {
    form.addEventListener("submit", (e) => { e.preventDefault(); run(true); });
  } else if (runBtn) {
    runBtn.addEventListener("click", () => run(true));
    card.querySelectorAll("input").forEach((i) =>
      i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(true); } }));
  }

  // A number on screen next to fields that no longer produced it is worse than no number.
  // Editing anything says so until the next calculation clears it.
  if (stale) {
    card.querySelectorAll("[data-k]").forEach((el) =>
      el.addEventListener("input", () => {
        stale.hidden = false;
        el.removeAttribute("aria-invalid");
        const message = card.querySelector(`#${el.id}-error`);
        if (message) { message.hidden = true; message.textContent = ""; }
        if (el.getAttribute("aria-describedby") === `${el.id}-error`) el.removeAttribute("aria-describedby");
      }));
  }

  if (def.presets) card.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => {
    const p = def.presets[+btn.dataset.preset];
    if (typeof materialById === "function" && typeof applyMaterial === "function") {
      const material = materialById(p.m);
      if (material) applyMaterial(card, material);
    }
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
/**
 * Point the fields an error is about at the message that explains it.
 *
 * `aria-invalid` is what says the value is refused, and `aria-describedby` is what carries
 * the sentence to the field: a screen reader reaching the field reads the message with it,
 * instead of hearing "podaj dodatnie wartości" once, in the result box, with nothing
 * connecting it to any field. Both come off again the moment the form calculates, and an
 * `aria-describedby` this file did not write is left alone.
 */
function markInvalidFields(card, res) {
  const bad = res.err && res.field ? res.field : "";
  const lang = document.documentElement.lang || "pl";
  card.querySelectorAll("[data-k]").forEach((el) => {
    const message = card.querySelector(`#${el.id}-error`);
    if (bad === el.dataset.k) {
      el.setAttribute("aria-invalid", "true");
      if (message) {
        message.textContent = t(res.err, lang);
        message.hidden = false;
        el.setAttribute("aria-describedby", message.id);
      }
    } else {
      el.removeAttribute("aria-invalid");
      if (message) {
        message.hidden = true;
        message.textContent = "";
        if (el.getAttribute("aria-describedby") === message.id) el.removeAttribute("aria-describedby");
      }
    }
  });
}

function renderResult(card, res, byHand) {
  const box = card.querySelector("[data-result]");
  const lang = document.documentElement.lang || "pl";
  box.classList.add("show");
  card.lastResult = res.err ? null : res;
  markInvalidFields(card, res);
  if (res.err) {
    box.classList.add("err");
    writeResult(box, `<div>${t(res.err, lang)}</div>`);
    document.dispatchEvent(new CustomEvent("calcresult", { detail: { card, result: null, byHand: Boolean(byHand) } }));
    return;
  }
  box.classList.remove("err");
  const rows = (res.rows || []).map(([k, v]) => {
    const numbered = String(v).match(/^§row-n:(\d+)§/);
    const val = localizeRow(String(v).replace(/^§row-n:\d+§/, ""), lang, (key) => t(key, lang));
    const label = numbered ? t(k, lang).replace("{n}", numbered[1]) : t(k, lang);
    return `<div><span>${label}</span><b>${val}</b></div>`;
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
  const openLabel = t(["res", "plan", "open"].join("_"), lang);

  let html = `<div class="cutplan">
    <div class="cutplan-label">${t("res_cut_plan", lang) || "Plan cięcia"}</div>
    <div class="cutplan-sheets">`;
  shown.forEach((placements, index) => {
    const sheetIdx = index + 1;
    const svgW = 1000;
    const svgH = Math.round(svgW * (sheetH / sheetW));

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet">
        <rect width="${svgW}" height="${svgH}" fill="white" stroke="#334155" stroke-width="3"/>`;

    placements.forEach((p, i) => {
      const x = (p.x / sheetW) * svgW;
      const y = (p.y / sheetH) * svgH;
      const w = (p.w / sheetW) * svgW;
      const h = (p.h / sheetH) * svgH;
      const fill = colors[p.type % colors.length];
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="0.25" stroke="${fill}" stroke-width="2"/>`;
      if (w >= 110 && h >= 34) svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="22" fill="#172033">${Math.round(p.w)} × ${Math.round(p.h)} mm</text>`;
    });

    svg += `</svg>`;
    // Opened as a blob, not a data: URL: browsers refuse to navigate a tab to data:, and the
    // inline style the picture once carried is refused by the page's CSP (style-src 'self').
    const plain = encodeURIComponent(svg.replace(/var\([^)]*\)/g, "#2563eb"));
    html += `<div class="cutplan-sheet-box">
      <div class="cutplan-label">${t("res_sheet", lang) || "Arkusz"} ${sheetIdx}: ${Math.round(sheetW)} × ${Math.round(sheetH)} mm (${placements.length})</div>
      ${svg.replace("<svg ", '<svg class="cutplan-sheet" ')}
      <a href="#" class="cutplan-open" data-plan="${plain}">${openLabel}</a></div>`;
  });

  html += `</div>`;
  if (plan.sheets.length > shown.length) {
    html += `<div class="cutplan-more muted">+${plan.sheets.length - shown.length} ${t("res_plan_more_sheets", lang) || "więcej arkuszy"}</div>`;
  }
  html += `</div>`;
  return html;
}

if (typeof document !== "undefined") {
  document.addEventListener("calcresult", (event) => {
    const card = event.detail && event.detail.card;
    if (!card) return;
    const lang = document.documentElement.lang || "pl";
    card.querySelectorAll('input[data-k]').forEach((field) => {
      if (field.value !== "") field.value = calcFieldValue(field.value, lang);
      if (field.placeholder) field.placeholder = calcFieldValue(field.placeholder, lang);
    });
  });
}

/* The full-size cut plan: one listener for every plan this page draws (AUDYT3 C3). */
if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest(".cutplan-open");
    if (!link) return;
    event.preventDefault();
    const url = URL.createObjectURL(new Blob([decodeURIComponent(link.dataset.plan || "")], { type: "image/svg+xml" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
}
