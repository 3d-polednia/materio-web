/* LiczMat website — the site map: which languages exist, what each URL segment is
   called in each of them, and which slug every calculator and guide gets.

   This is the single source of truth for URLs. `scripts/build.mjs` reads it to emit
   the pages, the hreflang alternates and sitemap.xml, so a slug is written once and
   every link that points at it follows automatically.

   Rules that keep the URLs stable:
   - Polish is the default language and lives at the root (`/kalkulatory/farby/`).
     The other nine sit under a language prefix (`/en/calculators/paint/`).
   - Slugs are ASCII-only, lower case, hyphen separated. Ukrainian and Russian are
     transliterated rather than written in Cyrillic — a percent-encoded URL is
     unreadable everywhere it gets pasted.
   - A slug is permanent. Renaming one breaks every inbound link and the ranking
     that came with it; add a redirect instead. */

export const BASE = "https://materio-app.com";

/** The ten languages the app ships (AppLanguage.kt). Polish first — it is the default. */
export const LANGS = ["pl", "en", "de", "cs", "sk", "ro", "hr", "sr", "uk", "ru"];

export const DEFAULT_LANG = "pl";

/** BCP-47 tags for <html lang> and hreflang. */
export const HREFLANG = {
  pl: "pl", en: "en", de: "de", cs: "cs", sk: "sk",
  ro: "ro", hr: "hr", sr: "sr", uk: "uk", ru: "ru",
};

/** og:locale needs the territory, unlike hreflang. */
export const OG_LOCALE = {
  pl: "pl_PL", en: "en_US", de: "de_DE", cs: "cs_CZ", sk: "sk_SK",
  ro: "ro_RO", hr: "hr_HR", sr: "sr_RS", uk: "uk_UA", ru: "ru_RU",
};

/** The path segment for each section, per language. */
export const SECTION = {
  calculators: {
    pl: "kalkulatory", en: "calculators", de: "rechner", cs: "kalkulacky", sk: "kalkulacky",
    ro: "calculatoare", hr: "kalkulatori", sr: "kalkulatori", uk: "kalkulyatory", ru: "kalkulyatory",
  },
  guides: {
    pl: "poradniki", en: "guides", de: "ratgeber", cs: "navody", sk: "navody",
    ro: "ghiduri", hr: "vodici", sr: "vodici", uk: "porady", ru: "rukovodstva",
  },
  stores: {
    pl: "sklepy", en: "stores", de: "baumaerkte", cs: "obchody", sk: "obchody",
    ro: "magazine", hr: "trgovine", sr: "prodavnice", uk: "magazyny", ru: "magaziny",
  },
  materials: {
    pl: "materialy", en: "materials", de: "materialien", cs: "materialy", sk: "materialy",
    ro: "materiale", hr: "materijali", sr: "materijali", uk: "materialy", ru: "materialy",
  },
  projects: {
    pl: "projekty", en: "projects", de: "projekte", cs: "projekty", sk: "projekty",
    ro: "proiecte", hr: "projekti", sr: "projekti", uk: "proekty", ru: "proekty",
  },
  app: {
    pl: "aplikacja", en: "android-app", de: "android-app", cs: "aplikace", sk: "aplikacia",
    ro: "aplicatie", hr: "aplikacija", sr: "aplikacija", uk: "dodatok", ru: "prilozhenie",
  },
  cookies: {
    pl: "cookies", en: "cookies", de: "cookies", cs: "cookies", sk: "cookies",
    ro: "cookies", hr: "kolacici", sr: "kolacici", uk: "cookies", ru: "cookies",
  },
  estimate: {
    pl: "kosztorys", en: "cost-estimate", de: "kostenvoranschlag", cs: "rozpocet",
    sk: "rozpocet", ro: "deviz", hr: "troskovnik", sr: "predracun",
    uk: "koshtorys", ru: "smeta",
  },
};

/** Calculator slugs, keyed by the id used in CALCS (assets/calculators.js). */
export const CALC_SLUG = {
  coverage: {
    pl: "farby-tynki-grunty", en: "paint-plaster-primer", de: "farbe-putz-grundierung",
    cs: "barvy-omitky-penetrace", sk: "farby-omietky-penetracie", ro: "vopsea-tencuiala-grund",
    hr: "boje-zbuke-temeljni-premaz", sr: "boje-malteri-prajmer",
    uk: "farba-shtukaturka-hrunt", ru: "kraska-shtukaturka-grunt",
  },
  waste: {
    pl: "plytki-panele-gres", en: "tiles-panels-porcelain", de: "fliesen-paneele-feinsteinzeug",
    cs: "obklady-panely-dlazba", sk: "obklady-panely-dlazba", ro: "gresie-faianta-parchet",
    hr: "plocice-paneli-gres", sr: "plocice-paneli-gres",
    uk: "plytka-paneli-keramohranit", ru: "plitka-paneli-keramogranit",
  },
  wallpaper: {
    pl: "tapety", en: "wallpaper", de: "tapete", cs: "tapety", sk: "tapety",
    ro: "tapet", hr: "tapete", sr: "tapete", uk: "shpalery", ru: "oboi",
  },
  linear: {
    pl: "rozkroj-liniowy-1d", en: "linear-cutting-1d", de: "linearer-zuschnitt-1d",
    cs: "linearni-narez-1d", sk: "linearny-rez-1d", ro: "debitare-liniara-1d",
    hr: "linearno-rezanje-1d", sr: "linearno-secenje-1d",
    uk: "rozkriy-liniynyi-1d", ru: "raskroy-lineynyy-1d",
  },
  sheet: {
    pl: "rozkroj-plyt-2d", en: "sheet-cutting-2d", de: "plattenzuschnitt-2d",
    cs: "narez-desek-2d", sk: "rez-dosiek-2d", ro: "debitare-placi-2d",
    hr: "rezanje-ploca-2d", sr: "secenje-ploca-2d",
    uk: "rozkriy-plyt-2d", ru: "raskroy-plit-2d",
  },
  concrete: {
    pl: "beton-z-worka", en: "bagged-concrete", de: "sackbeton", cs: "beton-z-pytle",
    sk: "beton-z-vreca", ro: "beton-la-sac", hr: "beton-iz-vrece", sr: "beton-iz-dzaka",
    uk: "beton-z-mishka", ru: "beton-iz-meshka",
  },
  mortar: {
    pl: "klej-zaprawa", en: "adhesive-mortar", de: "kleber-moertel", cs: "lepidlo-malta",
    sk: "lepidlo-malta", ro: "adeziv-mortar", hr: "ljepilo-mort", sr: "lepak-malter",
    uk: "kliy-rozchyn", ru: "kley-rastvor",
  },
  screed: {
    pl: "wylewka-tynk", en: "screed-plaster", de: "estrich-putz", cs: "poter-omitka",
    sk: "poter-omietka", ro: "sapa-tencuiala", hr: "estrih-zbuka", sr: "estrih-malter",
    uk: "styazhka-shtukaturka", ru: "styazhka-shtukaturka",
  },
  grout: {
    pl: "fuga", en: "grout", de: "fugenmasse", cs: "sparovaci-hmota", sk: "skarovacia-hmota",
    ro: "chit-de-rosturi", hr: "fugir-masa", sr: "fug-masa", uk: "zatyrka", ru: "zatirka",
  },
  masonry: {
    pl: "murowanie", en: "masonry", de: "mauerwerk", cs: "zdeni", sk: "murovanie",
    ro: "zidarie", hr: "zidanje", sr: "zidanje", uk: "muruvannya", ru: "kladka",
  },
  insulation: {
    pl: "ocieplenie-etics", en: "insulation-etics", de: "daemmung-wdvs", cs: "zatepleni-etics",
    sk: "zateplenie-etics", ro: "termoizolatie-etics", hr: "izolacija-etics", sr: "izolacija-etics",
    uk: "uteplennya-etics", ru: "uteplenie-etics",
  },
  studwall: {
    pl: "sciana-dzialowa-gk", en: "stud-partition", de: "staenderwand", cs: "pricka-sdk",
    sk: "priecka-sdk", ro: "perete-gips-carton", hr: "gk-pregrada", sr: "gk-pregrada",
    uk: "peregorodka-hk", ru: "peregorodka-gk",
  },
  ceiling: {
    pl: "sufit-podwieszany", en: "suspended-ceiling", de: "abgehaengte-decke", cs: "podhled",
    sk: "podhlad", ro: "tavan-suspendat", hr: "spusteni-strop", sr: "spusteni-plafon",
    uk: "pidvisna-stelya", ru: "podvesnoy-potolok",
  },
  drylining: {
    pl: "gk-na-klej", en: "glued-plasterboard", de: "ansetzbinder-platten", cs: "sdk-na-lepidlo",
    sk: "sdk-na-lepidlo", ro: "gips-carton-lipit", hr: "gk-na-ljepilo", sr: "gk-na-lepak",
    uk: "hk-na-kliy", ru: "gk-na-kley",
  },
  sheathing: {
    pl: "poszycie-osb", en: "sheathing-osb", de: "beplankung-osb", cs: "zaklop-osb",
    sk: "zaklop-osb", ro: "astereala-osb", hr: "oplata-osb", sr: "oplata-osb",
    uk: "obshyvka-osb", ru: "obshivka-osb",
  },
};

/** Guides. `calcs` lists the calculator ids the guide links to, in order. */
export const GUIDES = [
  {
    id: "malowanie",
    calcs: ["coverage"],
    slug: {
      pl: "ile-farby-na-pokoj", en: "how-much-paint-for-a-room", de: "wie-viel-farbe-fuer-ein-zimmer",
      cs: "kolik-barvy-na-pokoj", sk: "kolko-farby-na-izbu", ro: "cata-vopsea-pentru-o-camera",
      hr: "koliko-boje-za-sobu", sr: "koliko-boje-za-sobu",
      uk: "skilky-farby-na-kimnatu", ru: "skolko-kraski-na-komnatu",
    },
  },
  {
    id: "plytki",
    calcs: ["waste", "mortar", "grout"],
    slug: {
      pl: "plytki-i-klej-do-lazienki", en: "tiles-and-adhesive-for-a-bathroom",
      de: "fliesen-und-kleber-fuers-bad", cs: "obklady-a-lepidlo-do-koupelny",
      sk: "obklady-a-lepidlo-do-kupelne", ro: "gresie-si-adeziv-pentru-baie",
      hr: "plocice-i-ljepilo-za-kupaonicu", sr: "plocice-i-lepak-za-kupatilo",
      uk: "plytka-i-kliy-u-vannu", ru: "plitka-i-kley-v-vannuyu",
    },
  },
  {
    id: "panele",
    calcs: ["waste"],
    slug: {
      pl: "ile-paneli-na-podloge", en: "how-many-floor-panels", de: "wie-viele-bodenpaneele",
      cs: "kolik-panelu-na-podlahu", sk: "kolko-panelov-na-podlahu", ro: "cate-placi-de-parchet",
      hr: "koliko-panela-za-pod", sr: "koliko-panela-za-pod",
      uk: "skilky-paneley-na-pidlohu", ru: "skolko-paneley-na-pol",
    },
  },
  {
    id: "sciana",
    calcs: ["studwall", "sheathing"],
    slug: {
      pl: "sciana-dzialowa-gk-profile-i-plyty", en: "stud-partition-profiles-and-boards",
      de: "staenderwand-profile-und-platten", cs: "sdk-pricka-profily-a-desky",
      sk: "sdk-priecka-profily-a-dosky", ro: "perete-gips-carton-profile-si-placi",
      hr: "gk-pregrada-profili-i-ploce", sr: "gk-pregrada-profili-i-ploce",
      uk: "hk-perehorodka-profili-ta-lysty", ru: "gk-peregorodka-profili-i-listy",
    },
  },
  {
    id: "klej",
    calcs: ["mortar", "waste", "grout"],
    slug: {
      pl: "ile-kleju-do-plytek", en: "how-much-tile-adhesive", de: "wie-viel-fliesenkleber",
      cs: "kolik-lepidla-na-obklady", sk: "kolko-lepidla-na-obklady",
      ro: "cat-adeziv-pentru-gresie", hr: "koliko-ljepila-za-plocice",
      sr: "koliko-lepka-za-plocice", uk: "skilky-kliyu-dlya-plytky",
      ru: "skolko-kleya-dlya-plitki",
    },
  },
  {
    id: "gladz",
    calcs: ["coverage"],
    slug: {
      pl: "ile-gladzi-na-sciane", en: "how-much-skim-coat", de: "wie-viel-spachtelmasse",
      cs: "kolik-stuku-na-stenu", sk: "kolko-stuku-na-stenu",
      ro: "cat-glet-pentru-perete", hr: "koliko-gleta-za-zid",
      sr: "koliko-gleta-za-zid", uk: "skilky-shpaklivky-na-stinu",
      ru: "skolko-shpaklevki-na-stenu",
    },
  },
  {
    id: "ocieplenie",
    calcs: ["insulation", "coverage", "mortar"],
    slug: {
      pl: "ocieplenie-domu-styropianem", en: "insulating-a-house-with-eps",
      de: "haus-mit-eps-daemmen", cs: "zatepleni-domu-polystyrenem",
      sk: "zateplenie-domu-polystyrenom", ro: "termoizolarea-casei-cu-polistiren",
      hr: "izolacija-kuce-stiroporom", sr: "izolacija-kuce-stiroporom",
      uk: "uteplennya-budynku-pinoplastom", ru: "uteplenie-doma-penoplastom",
    },
  },
  {
    id: "rozkroj",
    calcs: ["sheet", "linear"],
    slug: {
      pl: "rozkroj-plyty-meblowej-bez-odpadu", en: "cutting-a-furniture-board-with-less-waste",
      de: "moebelplatte-mit-wenig-verschnitt-zuschneiden", cs: "narez-nabytkove-desky-s-malym-prorezem",
      sk: "rez-nabytkovej-dosky-s-malym-prierezom", ro: "debitarea-placii-de-mobila-cu-pierderi-mici",
      hr: "rezanje-namjestajne-ploce-s-manje-otpada", sr: "secenje-namestajne-ploce-sa-manje-otpada",
      uk: "rozkriy-mebleovoyi-plyty-bez-vidkhodiv", ru: "raskroy-mebelnoy-plity-bez-otkhodov",
    },
  },
];

/* ------------------------------------------------------------------ URL helpers */

const prefix = (lang) => (lang === DEFAULT_LANG ? "" : `/${lang}`);

export const urlHome = (lang) => `${prefix(lang)}/`;
export const urlCalcIndex = (lang) => `${prefix(lang)}/${SECTION.calculators[lang]}/`;
export const urlCalc = (lang, id) => `${urlCalcIndex(lang)}${CALC_SLUG[id][lang]}/`;
export const urlGuideIndex = (lang) => `${prefix(lang)}/${SECTION.guides[lang]}/`;
export const urlGuide = (lang, guide) => `${urlGuideIndex(lang)}${guide.slug[lang]}/`;
export const urlStores = (lang) => `${prefix(lang)}/${SECTION.stores[lang]}/`;
export const urlMaterials = (lang) => `${prefix(lang)}/${SECTION.materials[lang]}/`;
export const urlProjects = (lang) => `${prefix(lang)}/${SECTION.projects[lang]}/`;
export const urlEstimate = (lang) => `${prefix(lang)}/${SECTION.estimate[lang]}/`;

export const urlCookies = (lang) => `${prefix(lang)}/${SECTION.cookies[lang]}/`;

/** The Android app's own page. Not the same thing as URL_APP, which is the account. */
export const urlAndroid = (lang) => `${prefix(lang)}/${SECTION.app[lang]}/`;

/** Privacy policy, the workspace and the shared-project view are single, language-neutral pages. */
export const URL_PRIVACY = "/privacy-policy.html";
export const URL_APP = "/app/";
export const URL_SHARE = "/p/";

export const PLAY_URL = "https://play.google.com/store/apps/details?id=pl.materio.app";
