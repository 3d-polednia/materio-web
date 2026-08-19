/* LiczMat website — the site map: which languages exist, what each URL segment is
   called in each of them, and which slug every calculator and guide gets.

   This is the single source of truth for URLs. `scripts/build.mjs` reads it to emit
   the pages, the hreflang alternates and sitemap.xml, so a slug is written once and
   every link that points at it follows automatically.

   Rules that keep the URLs stable:
   - Polish is the default language and lives at the root (`/kalkulatory/farby/`).
     The other three sit under a language prefix (`/en/calculators/paint/`).
   - Slugs are ASCII-only, lower case, hyphen separated. Ukrainian is transliterated
     rather than written in Cyrillic — a percent-encoded URL is unreadable everywhere
     it gets pasted.
   - A slug is permanent. Renaming one breaks every inbound link and the ranking
     that came with it; add a redirect instead. The slugs below are the ones the site
     has always used.

   Six languages were dropped on 2026-08-12 and brought back by the owner after session
   28. Their slugs were **recovered from git** (`ab1fb26`, the original upload) rather
   than invented: those URLs were live and indexed for months, so the old ones are not
   merely convenient, they are the correct ones — re-inventing them would have broken
   every inbound link a second time. Only the four LiczMat Pro sections (clients, jobs,
   quotes, calendar) needed new segments in those six, because they did not exist yet
   when the languages were live. */

/* The live domain. Changed from materio-app.com to liczmat.com on 2026-08-14, when the
   owner pointed the GitHub Pages custom domain at the new one. GitHub Pages serves a
   single custom domain, so the moment `CNAME` said `liczmat.com` the old host started
   answering 404 — leaving canonical, hreflang, og:url and sitemap.xml pointing at a
   dead address. Everything the build writes derives the absolute URL from this one
   constant, so it is the only place the domain is decided. */
export const BASE = "https://liczmat.com";

/**
 * The ten languages LiczMat ships. Polish first — it is the default; the four that
 * never left come first, then the six the owner brought back after session 28.
 *
 * Master plan chapter V still names four. That edit belongs to the owner.
 */
export const LANGS = ["pl", "uk", "de", "en", "cs", "sk", "ro", "hr", "sr", "ru"];

export const DEFAULT_LANG = "pl";

/**
 * Languages that were published and then withdrawn. Empty since the restore: all six
 * (cs, sk, ro, hr, sr, ru) are live again at the addresses they always had, so there is
 * nothing left for `404.html` to forward and nothing for the build to sweep. Kept as a
 * named, empty list because the mechanism is what makes withdrawing a language safe.
 */
export const RETIRED_LANGS = [];

/** BCP-47 tags for <html lang> and hreflang. */
export const HREFLANG = {
  pl: "pl", uk: "uk", de: "de", en: "en", cs: "cs", sk: "sk", ro: "ro", hr: "hr", sr: "sr", ru: "ru",
};

/** og:locale needs the territory, unlike hreflang. */
export const OG_LOCALE = {
  pl: "pl_PL", uk: "uk_UA", de: "de_DE", en: "en_US", cs: "cs_CZ",
  sk: "sk_SK", ro: "ro_RO", hr: "hr_HR", sr: "sr_RS", ru: "ru_RU",
};

/** The path segment for each section, per language. */
export const SECTION = {
calculators: {
    pl: "kalkulatory", uk: "kalkulyatory", de: "rechner", en: "calculators",
    cs: "kalkulacky", sk: "kalkulacky", ro: "calculatoare", hr: "kalkulatori", sr: "kalkulatori", ru: "kalkulyatory",
  },
guides: {
    pl: "poradniki", uk: "porady", de: "ratgeber", en: "guides",
    cs: "navody", sk: "navody", ro: "ghiduri", hr: "vodici", sr: "vodici", ru: "rukovodstva",
  },
stores: {
    pl: "sklepy", uk: "magazyny", de: "baumaerkte", en: "stores",
    cs: "obchody", sk: "obchody", ro: "magazine", hr: "trgovine", sr: "prodavnice", ru: "magaziny",
  },
materials: {
    pl: "materialy", uk: "materialy", de: "materialien", en: "materials",
    cs: "materialy", sk: "materialy", ro: "materiale", hr: "materijali", sr: "materijali", ru: "materialy",
  },
projects: {
    pl: "projekty", uk: "proekty", de: "projekte", en: "projects",
    cs: "projekty", sk: "projekty", ro: "proiecte", hr: "projekti", sr: "projekti", ru: "proekty",
  },
app: {
    pl: "aplikacja", uk: "dodatok", de: "android-app", en: "android-app",
    cs: "aplikace", sk: "aplikacia", ro: "aplicatie", hr: "aplikacija", sr: "aplikacija", ru: "prilozhenie",
  },
cookies: {
    pl: "cookies", uk: "cookies", de: "cookies", en: "cookies",
    cs: "cookies", sk: "cookies", ro: "cookies", hr: "kolacici", sr: "kolacici", ru: "cookies",
  },
estimate: {
    pl: "kosztorys", uk: "koshtorys", de: "kostenvoranschlag", en: "cost-estimate",
    cs: "rozpocet", sk: "rozpocet", ro: "deviz", hr: "troskovnik", sr: "predracun", ru: "smeta",
  },
  /* Session 22, the first LiczMat Pro module. The segments are the ones the `clients`
     route carried as `plannedSlug` in src/ia.mjs since session 3 — a slug is permanent
     from the moment it is planned, so turning the page on moves it, it does not rename
     it. Ukrainian is transliterated like every other one: "kliyenty". */
clients: {
    pl: "klienci", uk: "kliyenty", de: "kunden", en: "clients",
    cs: "klienti", sk: "klienti", ro: "clienti", hr: "klijenti", sr: "klijenti", ru: "klienty",
  },
  /* Session 23, the second Pro module. Same rule as `clients`: the segments are the ones
     the `jobs` route has carried as `plannedSlug` in src/ia.mjs since session 3, so
     turning the page on moves them, it does not rename them. */
jobs: {
    pl: "zlecenia", uk: "zamovlennya", de: "auftraege", en: "jobs",
    cs: "zakazky", sk: "zakazky", ro: "comenzi", hr: "nalozi", sr: "nalozi", ru: "zakazy",
  },
  /* Session 24, the third Pro module. Same rule again: the segments are the ones the
     `quotes` route has carried as `plannedSlug` in src/ia.mjs since session 3. Ukrainian
     is "koshtorysy-pro" rather than "koshtorysy" because /koshtorys/ is already the free
     estimate page in Ukrainian, and two sections may not claim one word. */
quotes: {
    pl: "wyceny", uk: "koshtorysy-pro", de: "angebote", en: "quotes",
    cs: "cenove-nabidky", sk: "cenove-ponuky", ro: "oferte", hr: "ponude", sr: "ponude", ru: "kommercheskie-predlozheniya",
  },
  /* Session 25, the fourth Pro module. Same rule once more: the segments are the ones the
     `calendar` route has carried as `plannedSlug` in src/ia.mjs since session 3. */
calendar: {
    pl: "terminarz", uk: "kalendar", de: "termine", en: "schedule",
    cs: "terminy", sk: "terminy", ro: "termene", hr: "rokovi", sr: "rokovi", ru: "sroki",
  },
};

/** Calculator slugs, keyed by the id used in CALCS (assets/calculators.js). */
export const CALC_SLUG = {
  coverage: {
    pl: "farby-tynki-grunty", uk: "farba-shtukaturka-hrunt", de: "farbe-putz-grundierung", en: "paint-plaster-primer",
    cs: "barvy-omitky-penetrace", sk: "farby-omietky-penetracie", ro: "vopsea-tencuiala-grund", hr: "boje-zbuke-temeljni-premaz", sr: "boje-malteri-prajmer", ru: "kraska-shtukaturka-grunt",
  },
  waste: {
    pl: "plytki-panele-gres", uk: "plytka-paneli-keramohranit", de: "fliesen-paneele-feinsteinzeug", en: "tiles-panels-porcelain",
    cs: "obklady-panely-dlazba", sk: "obklady-panely-dlazba", ro: "gresie-faianta-parchet", hr: "plocice-paneli-gres", sr: "plocice-paneli-gres", ru: "plitka-paneli-keramogranit",
  },
  wallpaper: {
    pl: "tapety", uk: "shpalery", de: "tapete", en: "wallpaper",
    cs: "tapety", sk: "tapety", ro: "tapet", hr: "tapete", sr: "tapete", ru: "oboi",
  },
  linear: {
    pl: "rozkroj-liniowy-1d", uk: "rozkriy-liniynyi-1d", de: "linearer-zuschnitt-1d", en: "linear-cutting-1d",
    cs: "linearni-narez-1d", sk: "linearny-rez-1d", ro: "debitare-liniara-1d", hr: "linearno-rezanje-1d", sr: "linearno-secenje-1d", ru: "raskroy-lineynyy-1d",
  },
  sheet: {
    pl: "rozkroj-plyt-2d", uk: "rozkriy-plyt-2d", de: "plattenzuschnitt-2d", en: "sheet-cutting-2d",
    cs: "narez-desek-2d", sk: "rez-dosiek-2d", ro: "debitare-placi-2d", hr: "rezanje-ploca-2d", sr: "secenje-ploca-2d", ru: "raskroy-plit-2d",
  },
  concrete: {
    pl: "beton-z-worka", uk: "beton-z-mishka", de: "sackbeton", en: "bagged-concrete",
    cs: "beton-z-pytle", sk: "beton-z-vreca", ro: "beton-la-sac", hr: "beton-iz-vrece", sr: "beton-iz-dzaka", ru: "beton-iz-meshka",
  },
  mortar: {
    pl: "klej-zaprawa", uk: "kliy-rozchyn", de: "kleber-moertel", en: "adhesive-mortar",
    cs: "lepidlo-malta", sk: "lepidlo-malta", ro: "adeziv-mortar", hr: "ljepilo-mort", sr: "lepak-malter", ru: "kley-rastvor",
  },
  screed: {
    pl: "wylewka-tynk", uk: "styazhka-shtukaturka", de: "estrich-putz", en: "screed-plaster",
    cs: "poter-omitka", sk: "poter-omietka", ro: "sapa-tencuiala", hr: "estrih-zbuka", sr: "estrih-malter", ru: "styazhka-shtukaturka",
  },
  grout: {
    pl: "fuga", uk: "zatyrka", de: "fugenmasse", en: "grout",
    cs: "sparovaci-hmota", sk: "skarovacia-hmota", ro: "chit-de-rosturi", hr: "fugir-masa", sr: "fug-masa", ru: "zatirka",
  },
  masonry: {
    pl: "murowanie", uk: "muruvannya", de: "mauerwerk", en: "masonry",
    cs: "zdeni", sk: "murovanie", ro: "zidarie", hr: "zidanje", sr: "zidanje", ru: "kladka",
  },
  insulation: {
    pl: "ocieplenie-etics", uk: "uteplennya-etics", de: "daemmung-wdvs", en: "insulation-etics",
    cs: "zatepleni-etics", sk: "zateplenie-etics", ro: "termoizolatie-etics", hr: "izolacija-etics", sr: "izolacija-etics", ru: "uteplenie-etics",
  },
  studwall: {
    pl: "sciana-dzialowa-gk", uk: "peregorodka-hk", de: "staenderwand", en: "stud-partition",
    cs: "pricka-sdk", sk: "priecka-sdk", ro: "perete-gips-carton", hr: "gk-pregrada", sr: "gk-pregrada", ru: "peregorodka-gk",
  },
  ceiling: {
    pl: "sufit-podwieszany", uk: "pidvisna-stelya", de: "abgehaengte-decke", en: "suspended-ceiling",
    cs: "podhled", sk: "podhlad", ro: "tavan-suspendat", hr: "spusteni-strop", sr: "spusteni-plafon", ru: "podvesnoy-potolok",
  },
  drylining: {
    pl: "gk-na-klej", uk: "hk-na-kliy", de: "ansetzbinder-platten", en: "glued-plasterboard",
    cs: "sdk-na-lepidlo", sk: "sdk-na-lepidlo", ro: "gips-carton-lipit", hr: "gk-na-ljepilo", sr: "gk-na-lepak", ru: "gk-na-kley",
  },
  sheathing: {
    pl: "poszycie-osb", uk: "obshyvka-osb", de: "beplankung-osb", en: "sheathing-osb",
    cs: "zaklop-osb", sk: "zaklop-osb", ro: "astereala-osb", hr: "oplata-osb", sr: "oplata-osb", ru: "obshivka-osb",
  },
};

/** Guides. `calcs` lists the calculator ids the guide links to, in order. */
export const GUIDES = [
  {
    id: "malowanie",
    calcs: ["coverage"],
    slug: {
      pl: "ile-farby-na-pokoj", uk: "skilky-farby-na-kimnatu", de: "wie-viel-farbe-fuer-ein-zimmer", en: "how-much-paint-for-a-room",
      cs: "kolik-barvy-na-pokoj", sk: "kolko-farby-na-izbu", ro: "cata-vopsea-pentru-o-camera", hr: "koliko-boje-za-sobu", sr: "koliko-boje-za-sobu", ru: "skolko-kraski-na-komnatu",
    },
  },
  {
    id: "plytki",
    calcs: ["waste", "mortar", "grout"],
    slug: {
      pl: "plytki-i-klej-do-lazienki", uk: "plytka-i-kliy-u-vannu", de: "fliesen-und-kleber-fuers-bad", en: "tiles-and-adhesive-for-a-bathroom",
      cs: "obklady-a-lepidlo-do-koupelny", sk: "obklady-a-lepidlo-do-kupelne", ro: "gresie-si-adeziv-pentru-baie", hr: "plocice-i-ljepilo-za-kupaonicu", sr: "plocice-i-lepak-za-kupatilo", ru: "plitka-i-kley-v-vannuyu",
    },
  },
  {
    id: "panele",
    calcs: ["waste"],
    slug: {
      pl: "ile-paneli-na-podloge", uk: "skilky-paneley-na-pidlohu", de: "wie-viele-bodenpaneele", en: "how-many-floor-panels",
      cs: "kolik-panelu-na-podlahu", sk: "kolko-panelov-na-podlahu", ro: "cate-placi-de-parchet", hr: "koliko-panela-za-pod", sr: "koliko-panela-za-pod", ru: "skolko-paneley-na-pol",
    },
  },
  {
    id: "sciana",
    calcs: ["studwall", "sheathing"],
    slug: {
      pl: "sciana-dzialowa-gk-profile-i-plyty", uk: "hk-perehorodka-profili-ta-lysty", de: "staenderwand-profile-und-platten", en: "stud-partition-profiles-and-boards",
      cs: "sdk-pricka-profily-a-desky", sk: "sdk-priecka-profily-a-dosky", ro: "perete-gips-carton-profile-si-placi", hr: "gk-pregrada-profili-i-ploce", sr: "gk-pregrada-profili-i-ploce", ru: "gk-peregorodka-profili-i-listy",
    },
  },
  {
    id: "klej",
    calcs: ["mortar", "waste", "grout"],
    slug: {
      pl: "ile-kleju-do-plytek", uk: "skilky-kliyu-dlya-plytky", de: "wie-viel-fliesenkleber", en: "how-much-tile-adhesive",
      cs: "kolik-lepidla-na-obklady", sk: "kolko-lepidla-na-obklady", ro: "cat-adeziv-pentru-gresie", hr: "koliko-ljepila-za-plocice", sr: "koliko-lepka-za-plocice", ru: "skolko-kleya-dlya-plitki",
    },
  },
  {
    id: "gladz",
    calcs: ["coverage"],
    slug: {
      pl: "ile-gladzi-na-sciane", uk: "skilky-shpaklivky-na-stinu", de: "wie-viel-spachtelmasse", en: "how-much-skim-coat",
      cs: "kolik-stuku-na-stenu", sk: "kolko-stuku-na-stenu", ro: "cat-glet-pentru-perete", hr: "koliko-gleta-za-zid", sr: "koliko-gleta-za-zid", ru: "skolko-shpaklevki-na-stenu",
    },
  },
  {
    id: "ocieplenie",
    calcs: ["insulation", "coverage", "mortar"],
    slug: {
      pl: "ocieplenie-domu-styropianem", uk: "uteplennya-budynku-pinoplastom", de: "haus-mit-eps-daemmen", en: "insulating-a-house-with-eps",
      cs: "zatepleni-domu-polystyrenem", sk: "zateplenie-domu-polystyrenom", ro: "termoizolarea-casei-cu-polistiren", hr: "izolacija-kuce-stiroporom", sr: "izolacija-kuce-stiroporom", ru: "uteplenie-doma-penoplastom",
    },
  },
  {
    id: "rozkroj",
    calcs: ["sheet", "linear"],
    slug: {
      pl: "rozkroj-plyty-meblowej-bez-odpadu", uk: "rozkriy-mebleovoyi-plyty-bez-vidkhodiv", de: "moebelplatte-mit-wenig-verschnitt-zuschneiden", en: "cutting-a-furniture-board-with-less-waste",
      cs: "narez-nabytkove-desky-s-malym-prorezem", sk: "rez-nabytkovej-dosky-s-malym-prierezom", ro: "debitarea-placii-de-mobila-cu-pierderi-mici", hr: "rezanje-namjestajne-ploce-s-manje-otpada", sr: "secenje-namestajne-ploce-sa-manje-otpada", ru: "raskroy-mebelnoy-plity-bez-otkhodov",
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

/**
 * One project, as a query string on /projekty/ rather than a path segment.
 *
 * A project id is made in the browser and is unbounded, so it can never be a directory:
 * GitHub Pages serves files and has no rewrites, which is the same wall /p/<token> hits.
 * The detail is therefore a state of the projects page — see the `project` route in
 * src/ia.mjs, which is declared `view: true` for exactly this reason.
 */
export const urlProject = (lang, id) => `${urlProjects(lang)}?id=${encodeURIComponent(id)}`;

/** The client list of LiczMat Pro — chapter XX. */
export const urlClients = (lang) => `${prefix(lang)}/${SECTION.clients[lang]}/`;

/**
 * One client, as a query string on /klienci/ — the same wall urlProject() hits, for the
 * same reason: the id is made in this browser and can never be a directory on Pages.
 */
export const urlClient = (lang, id) => `${urlClients(lang)}?id=${encodeURIComponent(id)}`;

/** The job list of LiczMat Pro — chapter XXI. */
export const urlJobs = (lang) => `${prefix(lang)}/${SECTION.jobs[lang]}/`;

/** One job, as a query string on /zlecenia/ — the same wall urlClient() hits. */
export const urlJob = (lang, id) => `${urlJobs(lang)}?id=${encodeURIComponent(id)}`;

/** The quotes of LiczMat Pro — chapter XXII. */
export const urlQuotes = (lang) => `${prefix(lang)}/${SECTION.quotes[lang]}/`;

/** One quote, as a query string on /wyceny/ — the same wall urlJob() hits. */
export const urlQuote = (lang, id) => `${urlQuotes(lang)}?id=${encodeURIComponent(id)}`;

/** The terminarz of LiczMat Pro — chapter XXIII. One screen: it has no `?id=` of its own,
 *  because a row on it opens the job it belongs to on /zlecenia/. */
export const urlCalendar = (lang) => `${prefix(lang)}/${SECTION.calendar[lang]}/`;

export const urlCookies = (lang) => `${prefix(lang)}/${SECTION.cookies[lang]}/`;

/** The Android app's own page. Not the same thing as URL_APP, which is the account. */
export const urlAndroid = (lang) => `${prefix(lang)}/${SECTION.app[lang]}/`;

/** Privacy policy, the workspace and the shared-project view are single, language-neutral pages. */
export const URL_PRIVACY = "/privacy-policy.html";
export const URL_APP = "/app/";
export const URL_SHARE = "/p/";

/** The dashboard, under the account. Language-neutral like /app/ — it shows private data. */
export const URL_DASHBOARD = "/app/dashboard/";

export const PLAY_URL = "https://play.google.com/store/apps/details?id=pl.materio.app";
