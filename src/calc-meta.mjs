/* LiczMat website — the "how we calculate it" content for every calculator page.

   Each entry mirrors one engine in assets/calculators.js, which is itself a 1:1 port
   of the Kotlin engine in the app (core/calculation/**). When an engine changes, the
   formula lines here have to change with it — they are the page's promise that the
   number on screen is the number the app would give.

   `formula` is a list of lines. A `{fld_*}` placeholder is replaced with that field's
   localized label with the unit stripped ("Powierzchnia (m²)" -> "Powierzchnia"), and
   `{kg}` / `{m2}` / `{l}` with the localized unit symbol, so a single line reads correctly
   in all ten languages. Decimals are written the Polish way ("12,5") and the build
   rewrites them for the languages that use a point. Everything else in the line is
   language-neutral maths: ⌈⌉ ceiling, ⌊⌋ floor, ×, ÷, Σ.

   `related` lists calculator ids to cross-link at the bottom of the page. */

export const CALC_META = {
  coverage: {
    formula: [
      "netto = {fld_area} − {fld_openings}",
      "pole do pokrycia = netto × {fld_coats}",
      "opakowania = ⌈ pole do pokrycia ÷ {fld_coverage_unit} ⌉",
      "odpad = (opakowania × {fld_coverage_unit} − pole do pokrycia) ÷ (opakowania × {fld_coverage_unit}) × 100%",
    ],
    related: ["waste", "wallpaper", "mortar"],
  },
  waste: {
    formula: [
      "potrzeba = {fld_area} × (1 + {fld_waste} ÷ 100)",
      "opakowania = ⌈ potrzeba ÷ {fld_pkg_cov} ⌉",
      "odpad = (opakowania × {fld_pkg_cov} − {fld_area}) ÷ (opakowania × {fld_pkg_cov}) × 100%",
    ],
    related: ["mortar", "grout", "coverage"],
  },
  wallpaper: {
    formula: [
      "pas = {fld_pattern} > 0 → ⌈ {fld_height} ÷ {fld_pattern} ⌉ × {fld_pattern}; inaczej {fld_height}",
      "pasów potrzeba = ⌈ {fld_width} ÷ {fld_roll_w} ⌉",
      "pasów z rolki = ⌊ {fld_roll_l} ÷ pas ⌋",
      "rolki = ⌈ pasów potrzeba ÷ pasów z rolki ⌉",
    ],
    related: ["coverage", "waste"],
  },
  linear: {
    algorithm: true,
    formula: [
      "1. Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.",
      "2. Każdy element trafia do pierwszej sztangi, w której się mieści:",
      "   zajęte + (sztanga niepusta → {fld_kerf}) + element ≤ {fld_stock_len}",
      "3. Gdy nie mieści się w żadnej, otwierasz nową sztangę.",
      "odpad = ({fld_stock_len} × sztangi − Σ elementy) ÷ ({fld_stock_len} × sztangi) × 100%",
    ],
    related: ["sheet", "sheathing", "studwall"],
  },
  sheet: {
    algorithm: true,
    formula: [
      "1. Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.",
      "2. Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),",
      "   z obrotem o 90° jeśli {fld_rotate} jest włączony.",
      "3. Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,",
      "   każdy pomniejszony o {fld_kerf}.",
      "4. Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.",
      "odpad = (płyty × {fld_sheet_w} × {fld_sheet_l} − Σ formatki) ÷ (płyty × {fld_sheet_w} × {fld_sheet_l}) × 100%",
    ],
    related: ["linear", "sheathing", "waste"],
  },
  concrete: {
    formula: [
      "worki = ⌈ {fld_volume} × 1000 ÷ 12,5 ⌉",
      "woda ≈ worki × 2 {l}",
    ],
    related: ["screed", "mortar", "masonry"],
  },
  mortar: {
    formula: [
      "kilogramy = {fld_area} × {fld_usage}",
      "worki = ⌈ kilogramy ÷ {fld_bag_kg} ⌉",
    ],
    related: ["waste", "grout", "screed"],
  },
  screed: {
    formula: [
      "kilogramy = {fld_area} × {fld_thickness} × 2,0",
      "worki = ⌈ kilogramy ÷ {fld_bag_kg} ⌉",
    ],
    related: ["concrete", "mortar", "coverage"],
  },
  grout: {
    formula: [
      "kg/m² = ({fld_tile_len} + {fld_tile_w}) ÷ ({fld_tile_len} × {fld_tile_w}) × {fld_tile_thk} × {fld_joint} × 1,8",
      "kilogramy = kg/m² × {fld_area}",
    ],
    related: ["waste", "mortar", "coverage"],
  },
  masonry: {
    formula: [
      "netto = {fld_area} − {fld_openings}",
      "sztuki = ⌈ netto × {fld_pieces_per_m2} × (1 + {fld_waste} ÷ 100) ⌉",
      "zaprawa razem = netto × {fld_binder} {kg}",
    ],
    related: ["mortar", "concrete", "insulation"],
  },
  insulation: {
    formula: [
      "m² z opakowania = 0,30 × 100 ÷ {fld_foam_thk}",
      "opakowania styropianu = ⌈ {fld_area} ÷ m² z opakowania ⌉",
      "kołki = ⌈ {fld_area} × {fld_dowels_m2} ⌉",
      "klej razem = {fld_area} × {fld_adhesive_m2} {kg}",
      "siatka = {fld_area} × 1,10 {m2}",
    ],
    related: ["mortar", "masonry", "coverage"],
  },
  studwall: {
    formula: [
      "słupki = ⌊ {fld_width} ÷ {fld_stud_spacing} ⌋ + 1",
      "profile CW = słupki × ⌈ {fld_height} ÷ {fld_bar_len} ⌉",
      "profile UW = ⌈ 2 × {fld_width} ÷ {fld_bar_len} ⌉",
      "kotwy = 2 × (⌊ {fld_width} ÷ 0,6 ⌋ + 1)",
      "płyty = ⌈ {fld_width} × {fld_height} × {fld_board_sides} × 1,10 ÷ 2,4 ⌉",
    ],
    related: ["ceiling", "drylining", "sheathing"],
  },
  ceiling: {
    formula: [
      "rzędy CD = ⌊ {fld_width} ÷ {fld_main_spacing} ⌋ + 1",
      "profile CD = ⌈ rzędy CD × {fld_length} ÷ 4 ⌉",
      "profile UD = ⌈ 2 × ({fld_width} + {fld_length}) ÷ 3 ⌉",
      "wieszaki = rzędy CD × (⌊ {fld_length} ÷ {fld_hanger_spacing} ⌋ + 1)",
      "płyty = ⌈ {fld_width} × {fld_length} × 1,10 ÷ 2,4 ⌉",
    ],
    related: ["studwall", "drylining", "coverage"],
  },
  drylining: {
    formula: [
      "płyty = ⌈ {fld_area} × 1,10 ÷ 2,4 ⌉",
      "klej gipsowy = ⌈ {fld_area} × {fld_adhesive_m2} ÷ 25 ⌉ worków",
    ],
    related: ["studwall", "ceiling", "mortar"],
  },
  sheathing: {
    formula: [
      "pole arkusza = ({fld_sheet_w} ÷ 1000) × ({fld_sheet_l} ÷ 1000)",
      "arkusze = ⌈ {fld_area} × (1 + {fld_waste} ÷ 100) ÷ pole arkusza ⌉",
    ],
    related: ["sheet", "linear", "studwall"],
  },
};

/**
 * Words inside formula lines, per language. Only the identifiers on the left of "=" and
 * the few connective sentences need translating; the operators do not.
 *
 * The build replaces the longest key first, so "elementy" is handled before "element"
 * and "klej gipsowy" before "klej". Polish needs no table — the lines are authored in it.
 */
export const FORMULA_I18N = {
  pl: null, // the lines above are authored in Polish
  en: {
    "netto": "net", "pole do pokrycia": "area to cover", "opakowania": "packs", "odpad": "actual waste",
    "potrzeba": "required", "pas": "strip", "pasów potrzeba": "strips needed",
    "pasów z rolki": "strips per roll", "rolki": "rolls", "worki": "bags", "woda": "water",
    "kilogramy": "kilograms", "sztuki": "pieces", "zaprawa razem": "mortar total", "kołki": "anchors",
    "klej razem": "adhesive total", "siatka": "mesh", "słupki": "studs", "profile CW": "CW profiles",
    "profile UW": "UW profiles", "kotwy": "fixings", "płyty": "boards", "rzędy CD": "CD runs",
    "profile CD": "CD profiles", "profile UD": "UD profiles", "wieszaki": "hangers",
    "klej gipsowy": "gypsum adhesive", "worków": "bags", "pole arkusza": "sheet area",
    "arkusze": "sheets", "m² z opakowania": "m² per pack",
    "opakowania styropianu": "EPS packs", "zajęte": "used", "element": "piece",
    "sztangi": "bars", "sztangę": "bar", "elementy": "pieces", "formatki": "parts",
    "formatka": "part", "inaczej": "otherwise",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Expand the list into individual pieces and sort them longest first.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Each piece goes into the first bar it fits in:",
    "sztanga niepusta": "bar not empty",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "When it fits in none of them, a new bar is opened.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Expand the list into individual parts and sort them by area, largest first.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Each part lands in the free rectangle with the smallest leftover (best-area-fit),",
    "z obrotem o 90° jeśli": "rotated by 90° if",
    "jest włączony.": "is on.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "A guillotine cut splits the used rectangle into a right and a bottom offcut,",
    "każdy pomniejszony o": "each shrunk by",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "When a part fits nowhere, a new sheet is opened.",
  },
  de: {
    "netto": "netto", "pole do pokrycia": "zu beschichtende Fläche", "opakowania": "Gebinde", "odpad": "tatsächlicher Verschnitt",
    "potrzeba": "Bedarf", "pas": "Bahn", "pasów potrzeba": "Bahnen nötig",
    "pasów z rolki": "Bahnen je Rolle", "rolki": "Rollen", "worki": "Säcke", "woda": "Wasser",
    "kilogramy": "Kilogramm", "sztuki": "Stück", "zaprawa razem": "Mörtel gesamt", "kołki": "Dübel",
    "klej razem": "Kleber gesamt", "siatka": "Gewebe", "słupki": "Ständer", "profile CW": "CW-Profile",
    "profile UW": "UW-Profile", "kotwy": "Befestiger", "płyty": "Platten", "rzędy CD": "CD-Reihen",
    "profile CD": "CD-Profile", "profile UD": "UD-Profile", "wieszaki": "Abhänger",
    "klej gipsowy": "Ansetzbinder", "worków": "Säcke", "pole arkusza": "Plattenfläche",
    "arkusze": "Platten", "m² z opakowania": "m² je Paket",
    "opakowania styropianu": "EPS-Pakete", "zajęte": "belegt", "element": "Teil",
    "sztangi": "Stangen", "sztangę": "Stange", "elementy": "Teile", "formatki": "Zuschnitte",
    "formatka": "Zuschnitt", "inaczej": "sonst",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Die Liste in einzelne Teile auflösen und nach Länge absteigend sortieren.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Jedes Teil kommt in die erste Stange, in die es passt:",
    "sztanga niepusta": "Stange nicht leer",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Passt es in keine, wird eine neue Stange geöffnet.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Die Liste in einzelne Zuschnitte auflösen und nach Fläche absteigend sortieren.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Jeder Zuschnitt landet im freien Rechteck mit dem kleinsten Rest (Best-Area-Fit),",
    "z obrotem o 90° jeśli": "um 90° gedreht, wenn",
    "jest włączony.": "eingeschaltet ist.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Der Guillotine-Schnitt teilt das genutzte Rechteck in einen rechten und einen unteren Rest,",
    "każdy pomniejszony o": "jeder verkleinert um",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Passt ein Zuschnitt nirgends, wird eine neue Platte geöffnet.",
  },
  cs: {
    "netto": "netto", "pole do pokrycia": "natíraná plocha", "opakowania": "balení", "odpad": "odpad",
    "potrzeba": "potřeba", "pas": "pás", "pasów potrzeba": "pásů potřeba",
    "pasów z rolki": "pásů z role", "rolki": "role", "worki": "pytle", "woda": "voda",
    "kilogramy": "kilogramy", "sztuki": "kusy", "zaprawa razem": "malta celkem", "kołki": "hmoždinky",
    "klej razem": "lepidlo celkem", "siatka": "síťka", "słupki": "sloupky", "profile CW": "profily CW",
    "profile UW": "profily UW", "kotwy": "kotvy", "płyty": "desky", "rzędy CD": "řady CD",
    "profile CD": "profily CD", "profile UD": "profily UD", "wieszaki": "závěsy",
    "klej gipsowy": "sádrové lepidlo", "worków": "pytlů", "pole arkusza": "plocha desky",
    "arkusze": "desky", "m² z opakowania": "m² z balení",
    "opakowania styropianu": "balení polystyrenu", "zajęte": "obsazeno", "element": "prvek",
    "sztangi": "tyče", "sztangę": "tyč", "elementy": "prvky", "formatki": "formáty",
    "formatka": "formát", "inaczej": "jinak",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Rozbal seznam na jednotlivé prvky a seřaď je sestupně podle délky.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Každý prvek jde do první tyče, do které se vejde:",
    "sztanga niepusta": "tyč není prázdná",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Když se nevejde do žádné, otevře se nová tyč.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Rozbal seznam na jednotlivé formáty a seřaď je sestupně podle plochy.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Každý formát padne do volného obdélníku s nejmenším zbytkem (best-area-fit),",
    "z obrotem o 90° jeśli": "s otočením o 90°, pokud je",
    "jest włączony.": "zapnuto.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Gilotinový řez dělí využitý obdélník na pravý a dolní zbytek,",
    "każdy pomniejszony o": "každý zmenšený o",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Když se formát nevejde nikam, otevře se nová deska.",
  },
  sk: {
    "netto": "netto", "pole do pokrycia": "natieraná plocha", "opakowania": "balenia", "odpad": "odpad",
    "potrzeba": "potreba", "pas": "pás", "pasów potrzeba": "pásov potreba",
    "pasów z rolki": "pásov z rolky", "rolki": "rolky", "worki": "vrecia", "woda": "voda",
    "kilogramy": "kilogramy", "sztuki": "kusy", "zaprawa razem": "malta spolu", "kołki": "hmoždinky",
    "klej razem": "lepidlo spolu", "siatka": "sieťka", "słupki": "stĺpiky", "profile CW": "profily CW",
    "profile UW": "profily UW", "kotwy": "kotvy", "płyty": "dosky", "rzędy CD": "rady CD",
    "profile CD": "profily CD", "profile UD": "profily UD", "wieszaki": "závesy",
    "klej gipsowy": "sadrové lepidlo", "worków": "vriec", "pole arkusza": "plocha dosky",
    "arkusze": "dosky", "m² z opakowania": "m² z balenia",
    "opakowania styropianu": "balenia polystyrénu", "zajęte": "obsadené", "element": "prvok",
    "sztangi": "tyče", "sztangę": "tyč", "elementy": "prvky", "formatki": "formáty",
    "formatka": "formát", "inaczej": "inak",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Rozbaľ zoznam na jednotlivé prvky a zoraď ich zostupne podľa dĺžky.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Každý prvok ide do prvej tyče, do ktorej sa zmestí:",
    "sztanga niepusta": "tyč nie je prázdna",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Keď sa nezmestí do žiadnej, otvorí sa nová tyč.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Rozbaľ zoznam na jednotlivé formáty a zoraď ich zostupne podľa plochy.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Každý formát padne do voľného obdĺžnika s najmenším zvyškom (best-area-fit),",
    "z obrotem o 90° jeśli": "s otočením o 90°, ak je",
    "jest włączony.": "zapnuté.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Gilotínový rez delí využitý obdĺžnik na pravý a dolný zvyšok,",
    "każdy pomniejszony o": "každý zmenšený o",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Keď sa formát nezmestí nikam, otvorí sa nová doska.",
  },
  ro: {
    "netto": "net", "pole do pokrycia": "suprafață de acoperit", "opakowania": "ambalaje", "odpad": "pierderi reale",
    "potrzeba": "necesar", "pas": "fâșie", "pasów potrzeba": "fâșii necesare",
    "pasów z rolki": "fâșii dintr-o rolă", "rolki": "role", "worki": "saci", "woda": "apă",
    "kilogramy": "kilograme", "sztuki": "bucăți", "zaprawa razem": "mortar total", "kołki": "dibluri",
    "klej razem": "adeziv total", "siatka": "plasă", "słupki": "montanți", "profile CW": "profile CW",
    "profile UW": "profile UW", "kotwy": "ancore", "płyty": "plăci", "rzędy CD": "rânduri CD",
    "profile CD": "profile CD", "profile UD": "profile UD", "wieszaki": "ancore de tavan",
    "klej gipsowy": "adeziv de ipsos", "worków": "saci", "pole arkusza": "suprafața plăcii",
    "arkusze": "plăci", "m² z opakowania": "m² dintr-un ambalaj",
    "opakowania styropianu": "ambalaje de polistiren", "zajęte": "ocupat", "element": "element",
    "sztangi": "bare", "sztangę": "bară", "elementy": "elemente", "formatki": "repere",
    "formatka": "reper", "inaczej": "altfel",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Desfă lista în elemente individuale și sortează-le descrescător după lungime.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Fiecare element intră în prima bară în care încape:",
    "sztanga niepusta": "bara nu e goală",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Când nu încape în niciuna, se deschide o bară nouă.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Desfă lista în repere individuale și sortează-le descrescător după suprafață.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Fiecare reper ajunge în dreptunghiul liber cu cel mai mic rest (best-area-fit),",
    "z obrotem o 90° jeśli": "rotit cu 90° dacă",
    "jest włączony.": "este activat.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Tăierea tip ghilotină împarte dreptunghiul folosit într-un rest la dreapta și unul jos,",
    "każdy pomniejszony o": "fiecare micșorat cu",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Când un reper nu încape nicăieri, se deschide o placă nouă.",
  },
  hr: {
    "netto": "neto", "pole do pokrycia": "površina za bojanje", "opakowania": "pakiranja", "odpad": "stvarni otpad",
    "potrzeba": "potrebno", "pas": "traka", "pasów potrzeba": "traka potrebno",
    "pasów z rolki": "traka iz role", "rolki": "role", "worki": "vreće", "woda": "voda",
    "kilogramy": "kilogrami", "sztuki": "komadi", "zaprawa razem": "mort ukupno", "kołki": "tiple",
    "klej razem": "ljepilo ukupno", "siatka": "mrežica", "słupki": "stupovi", "profile CW": "profili CW",
    "profile UW": "profili UW", "kotwy": "sidra", "płyty": "ploče", "rzędy CD": "redovi CD",
    "profile CD": "profili CD", "profile UD": "profili UD", "wieszaki": "vješalice",
    "klej gipsowy": "gipsano ljepilo", "worków": "vreća", "pole arkusza": "površina ploče",
    "arkusze": "ploče", "m² z opakowania": "m² iz pakiranja",
    "opakowania styropianu": "pakiranja stiropora", "zajęte": "zauzeto", "element": "element",
    "sztangi": "šipke", "sztangę": "šipku", "elementy": "elementi", "formatki": "formati",
    "formatka": "format", "inaczej": "inače",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Razloži popis na pojedinačne elemente i sortiraj ih silazno po duljini.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Svaki element ide u prvu šipku u koju stane:",
    "sztanga niepusta": "šipka nije prazna",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Kad ne stane ni u jednu, otvara se nova šipka.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Razloži popis na pojedinačne formate i sortiraj ih silazno po površini.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Svaki format sjeda u slobodni pravokutnik s najmanjim ostatkom (best-area-fit),",
    "z obrotem o 90° jeśli": "sa zakretom od 90° ako je",
    "jest włączony.": "uključeno.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Giljotinski rez dijeli iskorišteni pravokutnik na desni i donji ostatak,",
    "każdy pomniejszony o": "svaki umanjen za",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Kad format ne stane nigdje, otvara se nova ploča.",
  },
  sr: {
    "netto": "neto", "pole do pokrycia": "površina za farbanje", "opakowania": "pakovanja", "odpad": "stvarni otpad",
    "potrzeba": "potrebno", "pas": "traka", "pasów potrzeba": "traka potrebno",
    "pasów z rolki": "traka iz rolne", "rolki": "rolne", "worki": "džakovi", "woda": "voda",
    "kilogramy": "kilogrami", "sztuki": "komadi", "zaprawa razem": "malter ukupno", "kołki": "tiplovi",
    "klej razem": "lepak ukupno", "siatka": "mrežica", "słupki": "stubovi", "profile CW": "profili CW",
    "profile UW": "profili UW", "kotwy": "sidra", "płyty": "ploče", "rzędy CD": "redovi CD",
    "profile CD": "profili CD", "profile UD": "profili UD", "wieszaki": "vešalice",
    "klej gipsowy": "gipsani lepak", "worków": "džakova", "pole arkusza": "površina ploče",
    "arkusze": "ploče", "m² z opakowania": "m² iz pakovanja",
    "opakowania styropianu": "pakovanja stiropora", "zajęte": "zauzeto", "element": "element",
    "sztangi": "šipke", "sztangę": "šipku", "elementy": "elementi", "formatki": "formati",
    "formatka": "format", "inaczej": "inače",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Razloži spisak na pojedinačne elemente i sortiraj ih opadajuće po dužini.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Svaki element ide u prvu šipku u koju stane:",
    "sztanga niepusta": "šipka nije prazna",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Kad ne stane ni u jednu, otvara se nova šipka.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Razloži spisak na pojedinačne formate i sortiraj ih opadajuće po površini.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Svaki format seda u slobodni pravougaonik s najmanjim ostatkom (best-area-fit),",
    "z obrotem o 90° jeśli": "sa zaokretom od 90° ako je",
    "jest włączony.": "uključeno.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Giljotinski rez deli iskorišćeni pravougaonik na desni i donji ostatak,",
    "każdy pomniejszony o": "svaki umanjen za",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Kad format ne stane nigde, otvara se nova ploča.",
  },
  uk: {
    "netto": "нетто", "pole do pokrycia": "площа під фарбування", "opakowania": "упаковки", "odpad": "відходи",
    "potrzeba": "потрібно", "pas": "смуга", "pasów potrzeba": "смуг потрібно",
    "pasów z rolki": "смуг з рулону", "rolki": "рулони", "worki": "мішки", "woda": "вода",
    "kilogramy": "кілограми", "sztuki": "штуки", "zaprawa razem": "розчин разом", "kołki": "дюбелі",
    "klej razem": "клей разом", "siatka": "сітка", "słupki": "стійки", "profile CW": "профілі CW",
    "profile UW": "профілі UW", "kotwy": "кріплення", "płyty": "листи", "rzędy CD": "ряди CD",
    "profile CD": "профілі CD", "profile UD": "профілі UD", "wieszaki": "підвіси",
    "klej gipsowy": "гіпсовий клей", "worków": "мішків", "pole arkusza": "площа аркуша",
    "arkusze": "аркуші", "m² z opakowania": "м² з упаковки",
    "opakowania styropianu": "упаковки пінопласту", "zajęte": "зайнято", "element": "елемент",
    "sztangi": "хлисти", "sztangę": "хлист", "elementy": "елементи", "formatki": "заготовки",
    "formatka": "заготовка", "inaczej": "інакше",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Розгорни список на окремі елементи і посортуй за спаданням довжини.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Кожен елемент іде в перший хлист, у який поміщається:",
    "sztanga niepusta": "хлист не порожній",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Коли не поміщається в жоден, відкривається новий хлист.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Розгорни список на окремі заготовки і посортуй за спаданням площі.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Кожна заготовка лягає у вільний прямокутник із найменшим залишком (best-area-fit),",
    "z obrotem o 90° jeśli": "з поворотом на 90°, якщо",
    "jest włączony.": "увімкнено.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Гільйотинний різ ділить використаний прямокутник на правий і нижній залишок,",
    "każdy pomniejszony o": "кожен зменшений на",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Коли заготовка не поміщається ніде, відкривається нова плита.",
  },
  ru: {
    "netto": "нетто", "pole do pokrycia": "площадь под окраску", "opakowania": "упаковки", "odpad": "отходы",
    "potrzeba": "нужно", "pas": "полоса", "pasów potrzeba": "полос нужно",
    "pasów z rolki": "полос из рулона", "rolki": "рулоны", "worki": "мешки", "woda": "вода",
    "kilogramy": "килограммы", "sztuki": "штуки", "zaprawa razem": "раствор всего", "kołki": "дюбели",
    "klej razem": "клей всего", "siatka": "сетка", "słupki": "стойки", "profile CW": "профили CW",
    "profile UW": "профили UW", "kotwy": "крепёж", "płyty": "листы", "rzędy CD": "ряды CD",
    "profile CD": "профили CD", "profile UD": "профили UD", "wieszaki": "подвесы",
    "klej gipsowy": "гипсовый клей", "worków": "мешков", "pole arkusza": "площадь листа",
    "arkusze": "листы", "m² z opakowania": "м² из упаковки",
    "opakowania styropianu": "упаковки пенопласта", "zajęte": "занято", "element": "элемент",
    "sztangi": "хлысты", "sztangę": "хлыст", "elementy": "элементы", "formatki": "заготовки",
    "formatka": "заготовка", "inaczej": "иначе",
    "Rozwiń listę na pojedyncze elementy i posortuj malejąco po długości.":
      "Разверни список на отдельные элементы и отсортируй по убыванию длины.",
    "Każdy element trafia do pierwszej sztangi, w której się mieści:":
      "Каждый элемент идёт в первый хлыст, в который помещается:",
    "sztanga niepusta": "хлыст не пуст",
    "Gdy nie mieści się w żadnej, otwierasz nową sztangę.":
      "Когда не помещается ни в один, открывается новый хлыст.",
    "Rozwiń listę na pojedyncze formatki i posortuj malejąco po polu.":
      "Разверни список на отдельные заготовки и отсортируй по убыванию площади.",
    "Każda formatka ląduje w wolnym prostokącie o najmniejszej resztce (best-area-fit),":
      "Каждая заготовка ложится в свободный прямоугольник с наименьшим остатком (best-area-fit),",
    "z obrotem o 90° jeśli": "с поворотом на 90°, если",
    "jest włączony.": "включён.",
    "Cięcie gilotynowe dzieli wykorzystany prostokąt na odpad prawy i dolny,":
      "Гильотинный рез делит использованный прямоугольник на правый и нижний остаток,",
    "każdy pomniejszony o": "каждый уменьшенный на",
    "Gdy formatka nie mieści się nigdzie, otwierasz nową płytę.":
      "Когда заготовка не помещается никуда, открывается новая плита.",
  },
};

/** Unit symbols inside formula lines. Cyrillic scripts write them in Cyrillic. */
export const FORMULA_UNITS = {
  pl: { kg: "kg", m2: "m²", l: "l" },
  en: { kg: "kg", m2: "m²", l: "l" },
  de: { kg: "kg", m2: "m²", l: "l" },
  cs: { kg: "kg", m2: "m²", l: "l" },
  sk: { kg: "kg", m2: "m²", l: "l" },
  ro: { kg: "kg", m2: "m²", l: "l" },
  hr: { kg: "kg", m2: "m²", l: "l" },
  sr: { kg: "kg", m2: "m²", l: "l" },
  uk: { kg: "кг", m2: "м²", l: "л" },
  ru: { kg: "кг", m2: "м²", l: "л" },
};

/** Languages that write 12.5 rather than 12,5. Everything else keeps the comma. */
export const DECIMAL_POINT = new Set(["en"]);
