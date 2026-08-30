/* LiczMat website — the bundled material catalog.
 *
 * Ported 1:1 from the Android app: core/catalog/CatalogSurface.kt, CatalogCoverage.kt,
 * CatalogSheets.kt and CatalogLinear.kt, plus core/model/ProjectMaterialCategory.kt for
 * the shop-aisle grouping. Every number here is the number the app uses; changing one
 * means changing both.
 *
 * Names are NOT stored here. A material carries a term key (`t`) and a language-neutral
 * size string (`s`), and the display name is `t(term) + " " + size` — so "Gres 60×60"
 * becomes "Feinsteinzeug 60×60" without duplicating the catalog ten times. The terms live
 * in assets/i18n-materials.js and the build fails when one is missing in a language.
 *
 * `k` (kind) decides which calculator a material can pre-fill and how its note reads:
 *   tile   surface covering sold by the box   -> waste, grout
 *   board  plasterboard sold by the sheet     -> waste, drylining, studwall, ceiling
 *   roll   wallpaper                          -> wallpaper, waste
 *   paint  liquid, litres x yield per coat    -> coverage
 *   bag    powder, kg at kg/m²                -> coverage, mortar, screed
 *   pack   sold by the m² in a bundle         -> coverage, insulation
 *   sheet  2D stock to be cut into pieces     -> sheet, sheathing
 *   bar    1D stock to be cut to length       -> linear
 */

/** Shop aisles, in the display order of ProjectMaterialCategory.kt. */
const MAT_CATS = [
  "TILES", "FLOORING", "TRIM", "PAINT", "CHEMICALS", "BOARDS", "WOOD",
  "PROFILES", "METAL", "GLASS", "TEXTILES", "INSULATION", "PLUMBING",
  "ELECTRICAL", "OTHER",
];

/* ---------- constructors (mirror the private helpers in the Kotlin catalogs) ---------- */

/** Tile, panel or plank: one box covers `pkg` m², laid with `waste` % of off-cuts. */
const mTile = (id, t, s, w, l, waste, pkg, c = "TILES") =>
  ({ id, t, s, c, k: "tile", w, l, waste, pkg });

/** Plasterboard: one "package" is one board, priced per board rather than per m². */
const mBoard = (id, t, s, w, l, waste = 10) =>
  ({ id, t, s, c: "BOARDS", k: "board", w, l, waste, pkg: (w * l) / 1e6 });

/** Paint: `cov` is the area one package finishes in ONE coat (litres × m²/l). */
const mPaint = (id, t, s, liters, yieldM2, coats, c = "PAINT") =>
  ({ id, t, s, c, k: "paint", liters, yield: yieldM2, coats, cov: liters * yieldM2 });

/** Bagged powder: one package covers kg / (kg per m²) square metres. */
const mBag = (id, t, s, kg, kgm2, layer, c = "CHEMICALS") =>
  ({ id, t, s, c, k: "bag", kg, kgm2, layer, cov: kg / kgm2 });

/** Bundle sold by the square metre (wool, EPS, membranes). */
const mPack = (id, t, s, cov, c = "INSULATION") =>
  ({ id, t, s, c, k: "pack", cov });

/** 2D stock for the guillotine engine. Glass and fabric cut with no kerf. */
const mSheet = (id, t, s, w, l, kerf, c = "BOARDS") =>
  ({ id, t, s, c, k: "sheet", w, l, kerf });

/** 1D stock for the bar-cutting optimiser. */
const mBar = (id, t, s, len, kerf, c) =>
  ({ id, t, s, c, k: "bar", len, kerf });

/* ------------------------------------------------------------------ the catalog */

const MATERIALS = [
  /* ---- surface coverings: gres and wall tiles (CatalogSurface.kt) ---- */
  mTile("gres-30x30", "m_gres", "30×30", 300, 300, 5, 1.0),
  mTile("gres-30x60", "m_gres", "30×60", 300, 600, 5, 1.44),
  mTile("gres-40x40", "m_gres", "40×40", 400, 400, 6, 1.28),
  mTile("gres-45x45", "m_gres", "45×45", 450, 450, 7, 1.42),
  mTile("gres-60x60", "m_gres", "60×60", 600, 600, 7, 1.44),
  mTile("gres-75x75", "m_gres", "75×75", 750, 750, 8, 1.13),
  mTile("gres-80x80", "m_gres", "80×80", 800, 800, 8, 1.28),
  mTile("gres-90x90", "m_gres", "90×90", 900, 900, 10, 1.62),
  mTile("gres-60x120", "m_gres", "60×120", 600, 1200, 10, 1.44),
  mTile("gres-120x120", "m_gres", "120×120", 1200, 1200, 10, 1.44),
  mTile("gres-120x278", "m_gres_xl", "120×278", 1200, 2780, 12, 3.34),
  mTile("glaz-20x20", "m_glazura", "20×20", 200, 200, 5, 1.0),
  mTile("glaz-25x40", "m_glazura", "25×40", 250, 400, 5, 1.0),
  mTile("glaz-30x60", "m_glazura", "30×60", 300, 600, 5, 1.44),
  mTile("glaz-30x90", "m_glazura", "30×90", 300, 900, 8, 1.62),
  mTile("terakota-33", "m_terakota", "33×33", 333, 333, 5, 1.0),
  mTile("metro-75x150", "m_metro", "7,5×15", 75, 150, 10, 1.0),
  mTile("metro-60x250", "m_plytka_dl", "6×25", 60, 250, 10, 0.5),
  mTile("mozaika-30x30", "m_mozaika", "30×30", 300, 300, 8, 0.99),
  mTile("heksagon", "m_heksagon", "20×23", 200, 230, 12, 1.0),
  mTile("taras-60x60", "m_taras_plytka", "2 cm · 60×60", 600, 600, 8, 0.72),
  mTile("klinkier-25x6", "m_klinkier", "24,5×6,5", 245, 65, 10, 0.5),
  mTile("elew-plytka", "m_elewacyjna", "24,5×6,5", 245, 65, 10, 0.5),

  /* ---- surface coverings: floors ---- */
  mTile("panel-ac3", "m_panel_lam", "AC3 · 128×19,2", 192, 1285, 8, 2.22, "FLOORING"),
  mTile("panel-ac4", "m_panel_lam", "AC4 · 138×19,3", 193, 1380, 8, 2.22, "FLOORING"),
  mTile("panel-ac5", "m_panel_lam", "AC5 · 129×19", 190, 1290, 8, 2.22, "FLOORING"),
  mTile("lvt", "m_lvt", "122×18", 180, 1220, 8, 2.20, "FLOORING"),
  mTile("spc", "m_spc", "61×30,5", 305, 610, 8, 2.23, "FLOORING"),
  mTile("deska-barl", "m_deska_warstw", "220×18,2", 182, 2200, 10, 3.18, "FLOORING"),
  mTile("deska-3warstw", "m_deska_3w", "209×15", 150, 2090, 10, 2.2, "FLOORING"),
  mTile("parkiet", "m_parkiet", "45×7", 70, 450, 10, 1.0, "FLOORING"),
  mTile("gres-deska-20x120", "m_gres_drewno", "20×120", 200, 1200, 10, 0.96, "FLOORING"),
  mTile("korek", "m_korek", "90×30", 300, 900, 8, 1.9, "FLOORING"),
  mTile("panel-scienny", "m_panel_scienny", "275×12", 120, 2750, 8, 1.65, "FLOORING"),

  /* ---- plasterboard: counted per m² of wall, not nested like furniture parts ---- */
  mBoard("gk-zwykla-2600", "m_gk_zwykla", "1200×2600", 1200, 2600),
  mBoard("gk-zwykla-2000", "m_gk_zwykla", "1200×2000", 1200, 2000),
  mBoard("gk-impreg-2600", "m_gk_impreg", "1200×2600", 1200, 2600),
  mBoard("gk-ogniowa-2600", "m_gk_ogniowa", "1200×2600", 1200, 2600),
  mBoard("gk-gksf-2600", "m_gk_gkfi", "1200×2600", 1200, 2600),

  /* ---- wallpaper ---- */
  { id: "tapeta-standard", t: "m_tapeta", s: "0,53×10 m", c: "OTHER", k: "roll",
    w: 530, l: 10000, waste: 15, pkg: 5.3 },

  /* ---- paints, primers, varnishes (CatalogCoverage.kt) ---- */
  mPaint("farba-scienna-2_5", "m_farba_scienna", "2,5 l", 2.5, 10, 2),
  mPaint("farba-scienna-5", "m_farba_scienna", "5 l", 5, 10, 2),
  mPaint("farba-scienna-10", "m_farba_scienna", "10 l", 10, 10, 2),
  mPaint("farba-lateks-5", "m_farba_lateks", "5 l", 5, 10, 2),
  mPaint("farba-sufitowa-10", "m_farba_sufitowa", "10 l", 10, 11, 2),
  mPaint("farba-kl-2_5", "m_farba_kl", "2,5 l", 2.5, 12, 2),
  mPaint("farba-beton-5", "m_farba_beton", "5 l", 5, 8, 2),
  mPaint("farba-elew-akr-10", "m_farba_elew_akr", "10 l", 10, 5, 2),
  mPaint("farba-elew-sil-10", "m_farba_elew_sil", "10 l", 10, 6, 2),
  mPaint("emalia-0_75", "m_emalia", "0,75 l", 0.75, 12, 2),
  mPaint("emalia-2_5", "m_emalia", "2,5 l", 2.5, 12, 2),
  mPaint("farba-antykor-0_75", "m_farba_antykor", "0,75 l", 0.75, 10, 2),
  mPaint("lakierobejca-2_5", "m_lakierobejca", "2,5 l", 2.5, 12, 2),
  mPaint("lakier-bezb-2_5", "m_lakier_bezb", "2,5 l", 2.5, 12, 2),
  mPaint("impregnat-5", "m_impregnat", "5 l", 5, 10, 2),
  mPaint("olej-taras-2_5", "m_olej_taras", "2,5 l", 2.5, 12, 2),
  mPaint("grunt-gleb-5", "m_grunt_gleb", "5 l", 5, 7, 1),
  mPaint("grunt-mleczko-5", "m_grunt_mleczko", "5 l", 5, 8, 1),
  mPaint("grunt-kwarc-5", "m_grunt_kwarc", "5 l", 5, 4, 1),

  /* ---- skim coats, plasters, adhesives, levellers ---- */
  mBag("gladz-gips-20", "m_gladz_gips", "20 kg", 20, 1.0, "ml_1mm"),
  mBag("gladz-polim-20", "m_gladz_polim", "20 kg", 20, 1.2, "ml_1mm"),
  mBag("gladz-gotowa-18", "m_gladz_gotowa", "18 kg", 18, 1.2, "ml_1mm"),
  mBag("tynk-gips-30", "m_tynk_gips", "30 kg", 30, 8.5, "ml_10mm"),
  mBag("tynk-cw-30", "m_tynk_cw", "30 kg", 30, 15.0, "ml_10mm"),
  mBag("tynk-mozaik-25", "m_tynk_mozaik", "25 kg", 25, 5.0, "ml_layer"),
  mBag("tynk-baranek-25", "m_tynk_baranek", "1,5 mm · 25 kg", 25, 2.5, "ml_15mm"),
  mBag("tynk-silik-25", "m_tynk_silik", "1,5 mm · 25 kg", 25, 2.5, "ml_15mm"),
  mBag("tynk-akryl-25", "m_tynk_akryl", "1,5 mm · 25 kg", 25, 2.5, "ml_15mm"),
  mBag("klej-c1-25", "m_klej_c1", "25 kg", 25, 4.0, "ml_comb6"),
  mBag("klej-c2-25", "m_klej_c2", "25 kg", 25, 5.0, "ml_comb10"),
  mBag("klej-styro-25", "m_klej_styro", "25 kg", 25, 4.5, "ml_reinf"),
  mBag("zaprawa-mur-25", "m_zaprawa_mur", "25 kg", 25, 25.0, "ml_joint10"),
  mBag("wylewka-samop-25", "m_wylewka", "25 kg", 25, 1.6, "ml_1mm"),
  mBag("fuga-5", "m_fuga", "5 kg", 5, 0.5, "ml_joint3"),
  mBag("hydroizol-15", "m_hydroizol", "15 kg", 15, 3.0, "ml_2coats"),

  /* ---- insulation and membranes, sold by the square metre ---- */
  mPack("welna-10", "m_welna", "10 cm", 6.0),
  mPack("welna-15", "m_welna", "15 cm", 4.5),
  mPack("welna-podd-20", "m_welna_podd", "20 cm", 3.5),
  mPack("welna-fasada-15", "m_welna_fasada", "15 cm", 2.0),
  mPack("styropian-5", "m_styropian", "5 cm", 3.0),
  mPack("styropian-fasada-10", "m_styropian_fasada", "10 cm", 3.0),
  mPack("styropian-fasada-15", "m_styropian_fasada", "15 cm", 2.0),
  mPack("styropian-podloga-10", "m_styropian_podloga", "EPS 100 · 10 cm", 3.0),
  mPack("xps-5", "m_xps", "5 cm", 5.5),
  mPack("pir-10", "m_pir", "10 cm", 5.7),
  mPack("papa-rolka", "m_papa", "20 m²", 20.0),
  mPack("folia-paro", "m_folia_paro", "75 m²", 75.0),
  mPack("membrana-dach", "m_membrana", "75 m²", 75.0),

  /* ---- 2D stock: furniture board, plywood, OSB (CatalogSheets.kt) ---- */
  mSheet("plyta-lam-2800", "m_plyta_lam", "2800×2070", 2800, 2070, 3),
  mSheet("plyta-lam-3660", "m_plyta_lam", "3660×1830", 3660, 1830, 3),
  mSheet("mdf-2800", "m_mdf", "2800×2070", 2800, 2070, 3),
  mSheet("hdf-2800", "m_hdf", "2800×2070", 2800, 2070, 3),
  mSheet("wior-surowa", "m_wiorowa", "2800×2070", 2800, 2070, 3),
  mSheet("mfp-2500", "m_mfp", "2500×1250", 2500, 1250, 3),
  mSheet("sklejka-lisc", "m_sklejka_lisc", "2500×1250", 2500, 1250, 3),
  mSheet("sklejka-brzoza", "m_sklejka_brzoza", "1525×1525", 1525, 1525, 3),
  mSheet("sklejka-wodo", "m_sklejka_wodo", "3000×1500", 3000, 1500, 3),
  mSheet("osb3-2500", "m_osb3", "2500×1250", 2500, 1250, 3),
  mSheet("osb3-2800", "m_osb3", "2800×1250", 2800, 1250, 3),
  mSheet("cetris-3350", "m_cetris", "3350×1250", 3350, 1250, 3),
  mSheet("fermacell-1500", "m_fermacell", "1500×1000", 1500, 1000, 3),
  mSheet("szalunek-2000", "m_szalunek", "2000×1000", 2000, 1000, 3),
  mSheet("blat-postform", "m_blat_postform", "4100×600", 4100, 600, 3),
  mSheet("blat-38-4100", "m_blat_lam", "38 mm · 4100×920", 4100, 920, 3),
  mSheet("parapet-wewn", "m_parapet_wewn", "4100×250", 4100, 250, 3, "TRIM"),
  mSheet("plexi-3050", "m_plexi", "3050×2050", 3050, 2050, 3, "GLASS"),
  mSheet("poliweglan", "m_poliweglan", "3050×2050", 3050, 2050, 3, "GLASS"),
  mSheet("poliweglan-kom", "m_poliweglan_kom", "2100×6000", 2100, 6000, 3, "GLASS"),
  mSheet("hpl", "m_hpl", "3050×1300", 3050, 1300, 3, "GLASS"),
  mSheet("dibond", "m_dibond", "3050×1500", 3050, 1500, 1, "GLASS"),
  mSheet("pcv-spienione", "m_pcv_spien", "3050×1560", 3050, 1560, 3, "GLASS"),
  mSheet("szklo-jumbo", "m_szklo", "3210×2250", 3210, 2250, 0, "GLASS"),
  mSheet("szklo-2550", "m_szklo", "2550×1605", 2550, 1605, 0, "GLASS"),
  mSheet("lustro-2550", "m_lustro", "2550×1605", 2550, 1605, 0, "GLASS"),
  mSheet("blacha-stal", "m_blacha_stal", "2000×1000", 2000, 1000, 1, "METAL"),
  mSheet("blacha-alu", "m_blacha_alu", "2500×1250", 2500, 1250, 1, "METAL"),
  mSheet("blacha-ocynk", "m_blacha_ocynk", "2000×1000", 2000, 1000, 1, "METAL"),
  mSheet("tkanina-140", "m_tkanina", "140 cm", 1400, 3000, 0, "TEXTILES"),
  mSheet("tkanina-150", "m_tkanina", "150 cm", 1500, 3000, 0, "TEXTILES"),
  mSheet("ekoskora-140", "m_ekoskora", "140 cm", 1400, 3000, 0, "TEXTILES"),
  mSheet("skora-nat", "m_skora", "2200×1200", 2200, 1200, 0, "TEXTILES"),
  mSheet("pianka-tap", "m_pianka_tap", "2000×1200", 2000, 1200, 5, "TEXTILES"),

  /* ---- 1D stock: profiles, trim, timber, pipes, rebar (CatalogLinear.kt) ---- */
  mBar("cd60-3", "m_cd60", "3 m", 3000, 1, "PROFILES"),
  mBar("cd60-4", "m_cd60", "4 m", 4000, 1, "PROFILES"),
  mBar("ud27-3", "m_ud27", "3 m", 3000, 1, "PROFILES"),
  mBar("cw50-3", "m_profil_scienny", "CW50 · 3 m", 3000, 1, "PROFILES"),
  mBar("uw50-3", "m_profil_scienny", "UW50 · 3 m", 3000, 1, "PROFILES"),
  mBar("cw75-3", "m_profil_scienny", "CW75 · 3 m", 3000, 1, "PROFILES"),
  mBar("cw100-3", "m_profil_scienny", "CW100 · 3 m", 3000, 1, "PROFILES"),
  mBar("ua50-3", "m_profil_ua", "UA50 · 3 m", 3000, 1, "PROFILES"),
  mBar("ua75-3", "m_profil_ua", "UA75 · 3 m", 3000, 1, "PROFILES"),
  mBar("narozny-alu-2_5", "m_narozny_alu", "2,5 m", 2500, 1, "PROFILES"),
  mBar("listwa-mdf-2_5", "m_listwa_mdf", "2,5 m", 2500, 3, "TRIM"),
  mBar("cokol-pvc-2_5", "m_cokol_pvc", "2,5 m", 2500, 3, "TRIM"),
  mBar("cwierc-2_5", "m_cwierc", "2,5 m", 2500, 3, "TRIM"),
  mBar("listwa-prog-alu-0_9", "m_listwa_prog", "0,9 m", 900, 1, "TRIM"),
  mBar("parapet-zewn-2", "m_parapet_zewn", "2 m", 2000, 1, "TRIM"),
  mBar("kantowka-45-3", "m_kantowka", "45×45 · 3 m", 3000, 3, "WOOD"),
  mBar("lata-4x5-4", "m_lata", "40×50 · 4 m", 4000, 3, "WOOD"),
  mBar("krokiew-2", "m_krokiew", "70×140 · 6 m", 6000, 3, "WOOD"),
  mBar("deska-taras-3", "m_deska_taras", "3 m", 3000, 3, "WOOD"),
  mBar("deska-wpc-4", "m_deska_wpc", "4 m", 4000, 3, "WOOD"),
  mBar("deska-elew-3", "m_deska_elew", "3 m", 3000, 3, "WOOD"),
  mBar("sztacheta-1_5", "m_sztacheta", "1,5 m", 1500, 3, "WOOD"),
  mBar("rura-pp-4", "m_rura_pp", "4 m", 4000, 2, "PLUMBING"),
  mBar("rura-pex-3", "m_rura_pex", "3 m", 3000, 2, "PLUMBING"),
  mBar("rura-cu-3", "m_rura_cu", "3 m", 3000, 1, "PLUMBING"),
  mBar("rura-spust-3", "m_rura_spust", "3 m", 3000, 2, "PLUMBING"),
  mBar("kanal-went-1", "m_kanal_went", "1 m", 1000, 2, "PLUMBING"),
  mBar("rura-kanal-110-2", "m_rura_kanal", "110 · 2 m", 2000, 2, "PLUMBING"),
  mBar("rura-kanal-50-2", "m_rura_kanal", "50 · 2 m", 2000, 2, "PLUMBING"),
  mBar("rynna-3", "m_rynna", "3 m", 3000, 2, "PLUMBING"),
  mBar("korytko-2", "m_korytko", "2 m", 2000, 2, "ELECTRICAL"),
  mBar("listwa-kabel-2", "m_listwa_kabel", "2 m", 2000, 2, "ELECTRICAL"),
  mBar("katownik-alu-2", "m_katownik_alu", "2 m", 2000, 1, "METAL"),
  mBar("ceownik-stal-3", "m_ceownik", "3 m", 3000, 1, "METAL"),
  mBar("profil-kwadr-3", "m_profil_kwadr", "30×30 · 3 m", 3000, 1, "METAL"),
  mBar("pret-8-12", "m_pret", "Ø8 · 12 m", 12000, 1, "METAL"),
  mBar("pret-10-12", "m_pret", "Ø10 · 12 m", 12000, 1, "METAL"),
  mBar("pret-12-12", "m_pret", "Ø12 · 12 m", 12000, 1, "METAL"),
  mBar("karnisz-2_4", "m_karnisz", "2,4 m", 2400, 1, "OTHER"),
];

/* ------------------------------------------------------------------ calculator wiring */

/**
 * Which material kinds each calculator accepts. A calculator missing from this map has
 * no catalogue behind it (volume of concrete, blocks per m²) and shows no picker.
 */
const MAT_KINDS_FOR_CALC = {
  coverage: ["paint", "bag", "pack"],
  waste: ["tile", "board", "roll"],
  wallpaper: ["roll"],
  linear: ["bar"],
  sheet: ["sheet"],
  sheathing: ["sheet"],
  mortar: ["bag"],
  screed: ["bag"],
  grout: ["tile"],
  drylining: ["board"],
  studwall: ["board"],
  ceiling: ["board"],
  insulation: ["pack"],
};

/**
 * The calculator a material belongs to when it has to be shown with exactly one:
 * the /materialy/ listing and its "calculate" link. Other calculators still accept it
 * (a bag of adhesive works in both "coverage" and "adhesive/mortar"), this is just the
 * one a fitter reaches for first.
 */
const MAT_PRIMARY_CALC = {
  tile: "waste", board: "waste", roll: "wallpaper", paint: "coverage",
  bag: "coverage", pack: "coverage", sheet: "sheet", bar: "linear",
};

const primaryCalcFor = (m) => MAT_PRIMARY_CALC[m.k];

/** Every material a given calculator can be pre-filled from. */
function materialsForCalc(calcId) {
  const kinds = MAT_KINDS_FOR_CALC[calcId];
  if (!kinds) return [];
  // The visitor's own materials stand beside the bundled ones and are filtered by exactly
  // the same rule — omToCatalogRow() hands back a row in this shape, so the picker, the
  // filter and materialFill() need to know nothing about where a row came from. The store
  // is not on every page that loads this file, so its absence is a normal state and not
  // an error: a page without it simply offers the catalogue.
  const own = typeof omCatalogRows === "function" ? omCatalogRows() : [];
  return own.filter((m) => kinds.includes(m.k)).concat(MATERIALS.filter((m) => kinds.includes(m.k)));
}

/**
 * The field values a material writes into a calculator. Only the fields the material
 * actually knows about — the area, the price and the number of coats stay whatever the
 * user typed, because the catalogue cannot know them.
 */
function materialFill(m, calcId) {
  switch (calcId) {
    case "coverage":
      // `cov` is one coat's worth, so the engine's own `coats` field still applies.
      return { cov: m.cov, coats: m.k === "paint" ? m.coats : 1 };
    case "waste":
      return { cov: m.pkg, waste: m.waste };
    case "wallpaper":
      return { rollW: m.w / 1000, rollL: m.l / 1000, pattern: 0 };
    case "linear":
      return { stock: m.len, kerf: m.kerf };
    case "sheet":
      return { sheetW: m.w, sheetL: m.l, kerf: m.kerf };
    case "sheathing":
      return { pieceW: m.w, pieceL: m.l };
    case "mortar":
      return { usage: m.kgm2, bag: m.kg };
    case "screed":
      return { bag: m.kg };
    case "grout":
      return { tileL: m.l, tileW: m.w };
    case "drylining":
    case "studwall":
    case "ceiling":
      return {};
    case "insulation":
      return {};
    default:
      return {};
  }
}

/* ------------------------------------------------------------------ display */

/** Polish-style number for a catalogue note: whole numbers bare, otherwise 2 decimals. */
function matNum(v, lang) {
  const rounded = Math.round(v * 100) / 100;
  try {
    return new Intl.NumberFormat(lang || "pl", { maximumFractionDigits: 2 }).format(rounded);
  } catch (e) {
    return String(rounded);
  }
}

/** "Gres 60×60" — the term in the page's language plus the language-neutral size. */
function matName(m, lang, tr) {
  // A material somebody typed in carries its name, not a term key: it was never
  // translated and there is nothing to look up. Without this it would print the empty
  // string a catalogue row's `t` is, on every screen that names it.
  if (m.own) return m.name;
  const term = tr ? tr(m.t, lang) : m.t;
  return m.s ? `${term} ${m.s}` : term;
}

/**
 * The one-line spec under the name. Built from the numbers rather than stored, so it
 * cannot disagree with the values the picker writes into the form.
 */
function matNote(m, lang, tr) {
  const n = (v) => matNum(v, lang);
  const w = (key) => (tr ? tr(key, lang) : key);
  // An own material has only the numbers somebody filled in, and which of them exist
  // depends on what they said it was for — so the note is built from what is there
  // rather than from a shape the row is assumed to have.
  if (m.own) {
    return [
      m.w !== undefined && m.l !== undefined ? `${n(m.w)}×${n(m.l)} mm` : null,
      m.pkg !== undefined ? `${n(m.pkg)} m²/${w("mu_pkg")}` : null,
      m.cov !== undefined ? `${n(m.cov)} m²/${w("mu_pkg")}` : null,
      m.kerf !== undefined ? `${w("mu_kerf")} ${n(m.kerf)} mm` : null,
      m.waste !== undefined ? `${n(m.waste)} % ${w("mu_waste")}` : null,
    ].filter(Boolean).join(" · ");
  }
  switch (m.k) {
    case "tile":
      return `${m.s} cm · ${n(m.pkg)} m²/${w("mu_pkg")} · ${n(m.waste)} % ${w("mu_waste")}`;
    case "board":
      return `${m.w}×${m.l} mm · ${n(m.pkg)} m²/${w("mu_pc")}`;
    case "roll":
      return `${m.s} · ${n(m.pkg)} m²/${w("mu_pkg")}`;
    case "paint":
      return `${n(m.liters)} l · ~${n(m.yield)} m²/l · ${n(m.cov)} m²/${w("mu_pkg")}`;
    case "bag":
      return `${n(m.kg)} kg · ~${n(m.kgm2)} kg/m² (${w(m.layer)}) · ${n(m.cov)} m²/${w("mu_pkg")}`;
    case "pack":
      return `${w("mu_pack")} ≈ ${n(m.cov)} m² · ${m.s}`;
    case "sheet":
      return `${m.w}×${m.l} mm · ${w("mu_kerf")} ${n(m.kerf)} mm`;
    case "bar":
      return `${w("mu_bar")} ${n(m.len / 1000)} m · ${w("mu_kerf")} ${n(m.kerf)} mm`;
    default:
      return "";
  }
}

/** Categories that actually hold materials, in ProjectMaterialCategory order. */
const MAT_CATS_USED = MAT_CATS.filter((c) => MATERIALS.some((m) => m.c === c));

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MATERIALS, MAT_CATS, MAT_CATS_USED, MAT_KINDS_FOR_CALC,
    materialsForCalc, materialFill, matName, matNote, primaryCalcFor,
  };
}
