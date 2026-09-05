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
 * The thirteen languages LiczMat ships. Polish first — it is the default; the four that
 * never left come first, then the five the owner brought back after session 28, then the
 * four western-European ones added on 2026-09-02.
 *
 * **Russian left on 2026-09-02**, by the owner's decision, in the same session that added
 * Italian, Dutch, Spanish and French. It had been live since the restore, so `ru` is the
 * first entry `RETIRED_LANGS` has ever carried: its twenty-nine URLs were indexed and a
 * page that simply stops answering is a page that keeps its ranking and returns a 404.
 *
 * Master plan chapter V still names four. That edit belongs to the owner.
 */
export const LANGS = ["pl", "uk", "de", "en", "cs", "sk", "ro", "hr", "sr", "it", "nl", "es", "fr"];

export const DEFAULT_LANG = "pl";

/**
 * The Polish-first phase: the build regenerates Polish and leaves the other twelve
 * languages exactly as the last full build wrote them.
 *
 * The site is authored once and generated thirteen times, so until now a one-sentence
 * correction meant writing that sentence in thirteen languages before the build would
 * run at all. During a run of corrections that is the bulk of the work and none of the
 * thinking. With this switch on, a key may exist in Polish alone: the build records it
 * in `docs/TRANSLATIONS_TODO.md` instead of aborting, and writes no page outside Polish.
 *
 * **Freezing is not deleting.** The twelve other languages keep every file they have,
 * GitHub Pages keeps serving them, and every URL that answered before still answers —
 * they simply stop moving while Polish does. What that costs, and the four things it
 * forbids while it is on, is the "Polish-first mode" chapter of CLAUDE.md.
 *
 * To thaw: set this to false, translate what `docs/TRANSLATIONS_TODO.md` lists, and run
 * the build. It goes back to refusing a language with a hole in it.
 */
export const PL_ONLY = true;

/**
 * The languages this build actually writes files for.
 *
 * `LANGS` stays all thirteen and every other reader of it — `livePaths()`,
 * `sitemapUrls()`, the hreflang sets, the pickers — keeps seeing thirteen, because
 * thirteen languages really are on disk and really are being served. Only the loops that
 * emit pages read this one. Derived rather than hand-written, so `PL_ONLY = false` puts
 * everything back with one edit.
 */
export const BUILD_LANGS = PL_ONLY ? [DEFAULT_LANG] : LANGS;

/**
 * Languages that were published and then withdrawn. `ru` since 2026-09-02: the other five
 * of the six dropped in 2026-08 are live again at the addresses they always had, and
 * Russian is the one the owner took off the list instead.
 *
 * The mechanism is what makes withdrawing a language safe: the build refuses to emit a
 * page for a retired language, `404.html` forwards /ru/… to the home page, and nothing
 * in a picker, a sitemap or an hreflang set names it.
 */
export const RETIRED_LANGS = ["ru"];

/** BCP-47 tags for <html lang> and hreflang. */
export const HREFLANG = {
  pl: "pl", uk: "uk", de: "de", en: "en", cs: "cs", sk: "sk", ro: "ro", hr: "hr", sr: "sr", it: "it", nl: "nl", es: "es", fr: "fr",
};

/** og:locale needs the territory, unlike hreflang. */
export const OG_LOCALE = {
  pl: "pl_PL", uk: "uk_UA", de: "de_DE", en: "en_US", cs: "cs_CZ",
  sk: "sk_SK", ro: "ro_RO", hr: "hr_HR", sr: "sr_RS", it: "it_IT", nl: "nl_NL", es: "es_ES", fr: "fr_FR",
};

/** The path segment for each section, per language. */
export const SECTION = {
calculators: {
    pl: "kalkulatory", uk: "kalkulyatory", de: "rechner", en: "calculators",
    cs: "kalkulacky", sk: "kalkulacky", ro: "calculatoare", hr: "kalkulatori", sr: "kalkulatori", it: "calcolatori", nl: "rekenmachines", es: "calculadoras", fr: "calculateurs",
  },
guides: {
    pl: "poradniki", uk: "porady", de: "ratgeber", en: "guides",
    cs: "navody", sk: "navody", ro: "ghiduri", hr: "vodici", sr: "vodici", it: "guide", nl: "gidsen", es: "guias", fr: "guides",
  },
stores: {
    pl: "sklepy", uk: "magazyny", de: "baumaerkte", en: "stores",
    cs: "obchody", sk: "obchody", ro: "magazine", hr: "trgovine", sr: "prodavnice", it: "negozi", nl: "bouwmarkten", es: "tiendas", fr: "magasins",
  },
materials: {
    pl: "materialy", uk: "materialy", de: "materialien", en: "materials",
    cs: "materialy", sk: "materialy", ro: "materiale", hr: "materijali", sr: "materijali", it: "materiali", nl: "materialen", es: "materiales", fr: "materiaux",
  },
projects: {
    pl: "projekty", uk: "proekty", de: "projekte", en: "projects",
    cs: "projekty", sk: "projekty", ro: "proiecte", hr: "projekti", sr: "projekti", it: "progetti", nl: "projecten", es: "proyectos", fr: "projets",
  },
app: {
    pl: "aplikacja", uk: "dodatok", de: "android-app", en: "android-app",
    cs: "aplikace", sk: "aplikacia", ro: "aplicatie", hr: "aplikacija", sr: "aplikacija", it: "app-android", nl: "android-app", es: "app-android", fr: "application-android",
  },
cookies: {
    pl: "cookies", uk: "cookies", de: "cookies", en: "cookies",
    cs: "cookies", sk: "cookies", ro: "cookies", hr: "kolacici", sr: "kolacici", it: "cookies", nl: "cookies", es: "cookies", fr: "cookies",
  },
  /* Session 62, item H7 of the 2026-09 audit: the site sold a subscription through Stripe
     and stored personal data in Firebase without naming, anywhere, who was doing either.
     Article 13 of the GDPR asks for the identity of the controller and the e-commerce
     directive for the identity of the seller, and a visitor about to pay asks the same
     question in plainer words. The segment is each language's own word rather than a
     transliteration of the Polish one, for the reason the converter gives above: this is
     the word somebody types when they are looking for a way to reach a person. */
contact: {
    pl: "kontakt", uk: "kontakty", de: "kontakt", en: "contact",
    cs: "kontakt", sk: "kontakt", ro: "contact", hr: "kontakt", sr: "kontakt", it: "contatti", nl: "contact", es: "contacto", fr: "contact",
  },
estimate: {
    pl: "kosztorys", uk: "koshtorys", de: "kostenvoranschlag", en: "cost-estimate",
    cs: "rozpocet", sk: "rozpocet", ro: "deviz", hr: "troskovnik", sr: "predracun", it: "preventivo", nl: "kostenraming", es: "presupuesto", fr: "devis",
  },
  /* Session 22, the first LiczMat Pro module. The segments are the ones the `clients`
     route carried as `plannedSlug` in src/ia.mjs since session 3 — a slug is permanent
     from the moment it is planned, so turning the page on moves it, it does not rename
     it. Ukrainian is transliterated like every other one: "kliyenty". */
clients: {
    pl: "klienci", uk: "kliyenty", de: "kunden", en: "clients",
    cs: "klienti", sk: "klienti", ro: "clienti", hr: "klijenti", sr: "klijenti", it: "clienti", nl: "klanten", es: "clientes", fr: "clients",
  },
  /* Session 23, the second Pro module. Same rule as `clients`: the segments are the ones
     the `jobs` route has carried as `plannedSlug` in src/ia.mjs since session 3, so
     turning the page on moves them, it does not rename them. */
jobs: {
    pl: "zlecenia", uk: "zamovlennya", de: "auftraege", en: "jobs",
    cs: "zakazky", sk: "zakazky", ro: "comenzi", hr: "nalozi", sr: "nalozi", it: "commesse", nl: "opdrachten", es: "encargos", fr: "chantiers",
  },
  /* Session 24, the third Pro module. Same rule again: the segments are the ones the
     `quotes` route has carried as `plannedSlug` in src/ia.mjs since session 3. Ukrainian
     is "koshtorysy-pro" rather than "koshtorysy" because /koshtorys/ is already the free
     estimate page in Ukrainian, and two sections may not claim one word. */
quotes: {
    pl: "wyceny", uk: "koshtorysy-pro", de: "angebote", en: "quotes",
    cs: "cenove-nabidky", sk: "cenove-ponuky", ro: "oferte", hr: "ponude", sr: "ponude", it: "preventivi-pro", nl: "offertes", es: "presupuestos-pro", fr: "devis-pro",
  },
  /* Session 29, the public page for LiczMat Pro. Same rule once more, with one
     difference the other four do not have: "liczmat-pro" is a brand name, so it is the
     same segment in all thirteen languages — translating it would give one product thirteen names
     and split the links that point at it. The segments are the ones the `liczmat-pro`
     route has carried as `plannedSlug` in src/ia.mjs since session 3. */
pro: {
    pl: "liczmat-pro", uk: "liczmat-pro", de: "liczmat-pro", en: "liczmat-pro",
    cs: "liczmat-pro", sk: "liczmat-pro", ro: "liczmat-pro", hr: "liczmat-pro",
    sr: "liczmat-pro", it: "liczmat-pro", nl: "liczmat-pro", es: "liczmat-pro", fr: "liczmat-pro",
  },
  /* Session 25, the fourth Pro module. Same rule once more: the segments are the ones the
     `calendar` route has carried as `plannedSlug` in src/ia.mjs since session 3. */
calendar: {
    pl: "terminarz", uk: "kalendar", de: "termine", en: "schedule",
    cs: "terminy", sk: "terminy", ro: "termene", hr: "rokovi", sr: "rokovi", it: "scadenze", nl: "planning", es: "plazos", fr: "echeances",
  },
  /* Session 57, the unit converter — item C1 of the parity audit, and the first section
     added to this map that was never a `plannedSlug`: src/ia.mjs was written in session 3
     against the master plan, and the plan has no converter in it. The segment is the
     page's own subject in each language rather than a transliteration of the Polish one,
     because this is the phrase somebody types into a search box; "liczmat-pro" is a brand
     name and is the exception, not the rule. Each segment is the language's own
     `converter_title` from the app, spelled out in ASCII — the module has one name on the
     two products, so it cannot have a second one in the address bar. It is a top-level section and not a child of
     /kalkulatory/: the fifteen calculators live under that segment and each of them owns
     one slug there, so a sixteenth address in the same namespace that is not a calculator
     would be one CALC_SLUG collision away from a page nobody can explain. */
converter: {
    pl: "konwerter-jednostek", uk: "konverter-odynyts", de: "einheitenumrechner", en: "unit-converter",
    cs: "prevodnik-jednotek", sk: "prevodnik-jednotiek", ro: "convertor-de-unitati",
    hr: "pretvarac-jedinica", sr: "konvertor-jedinica", it: "convertitore-di-unita", nl: "eenheden-omrekenen", es: "conversor-de-unidades", fr: "convertisseur-d-unites",
  },
  /* Session 59, the visitor's own materials — item C6 of the parity audit, and the second
     section here that was never a `plannedSlug`, for the same reason the converter was
     not: src/ia.mjs was written in session 3 against a plan that has no such screen. The
     segment says whose the materials are, because that is the whole distinction from
     /materialy/ — one address is the bundled catalogue of 161 rows and the other is the
     rows somebody typed in. Two sections may not claim one word, so none of these repeats
     that language's `materials` segment. */
ownMaterials: {
    pl: "moje-materialy", uk: "moyi-materialy", de: "meine-materialien", en: "my-materials",
    cs: "moje-materialy", sk: "moje-materialy", ro: "materialele-mele",
    hr: "moji-materijali", sr: "moji-materijali", it: "i-miei-materiali", nl: "mijn-materialen", es: "mis-materiales", fr: "mes-materiaux",
  },
};

/** Calculator slugs, keyed by the id used in CALCS (assets/calculators.js). */
export const CALC_SLUG = {
  coverage: {
    pl: "farby-tynki-grunty", uk: "farba-shtukaturka-hrunt", de: "farbe-putz-grundierung", en: "paint-plaster-primer",
    cs: "barvy-omitky-penetrace", sk: "farby-omietky-penetracie", ro: "vopsea-tencuiala-grund", hr: "boje-zbuke-temeljni-premaz", sr: "boje-malteri-prajmer", it: "pittura-intonaco-primer", nl: "verf-pleister-primer", es: "pintura-revoco-imprimacion", fr: "peinture-enduit-primaire",
  },
  waste: {
    pl: "plytki-panele-gres", uk: "plytka-paneli-keramohranit", de: "fliesen-paneele-feinsteinzeug", en: "tiles-panels-porcelain",
    cs: "obklady-panely-dlazba", sk: "obklady-panely-dlazba", ro: "gresie-faianta-parchet", hr: "plocice-paneli-gres", sr: "plocice-paneli-gres", it: "piastrelle-pannelli-gres", nl: "tegels-panelen-keramiek", es: "azulejos-tarima-porcelanico", fr: "carrelage-lames-gres",
  },
  wallpaper: {
    pl: "tapety", uk: "shpalery", de: "tapete", en: "wallpaper",
    cs: "tapety", sk: "tapety", ro: "tapet", hr: "tapete", sr: "tapete", it: "carta-da-parati", nl: "behang", es: "papel-pintado", fr: "papier-peint",
  },
  linear: {
    pl: "rozkroj-liniowy-1d", uk: "rozkriy-liniynyi-1d", de: "linearer-zuschnitt-1d", en: "linear-cutting-1d",
    cs: "linearni-narez-1d", sk: "linearny-rez-1d", ro: "debitare-liniara-1d", hr: "linearno-rezanje-1d", sr: "linearno-secenje-1d", it: "taglio-lineare-1d", nl: "lineair-zagen-1d", es: "corte-lineal-1d", fr: "decoupe-lineaire-1d",
  },
  sheet: {
    pl: "rozkroj-plyt-2d", uk: "rozkriy-plyt-2d", de: "plattenzuschnitt-2d", en: "sheet-cutting-2d",
    cs: "narez-desek-2d", sk: "rez-dosiek-2d", ro: "debitare-placi-2d", hr: "rezanje-ploca-2d", sr: "secenje-ploca-2d", it: "taglio-pannelli-2d", nl: "platen-zagen-2d", es: "corte-de-tableros-2d", fr: "decoupe-de-panneaux-2d",
  },
  concrete: {
    pl: "beton-z-worka", uk: "beton-z-mishka", de: "sackbeton", en: "bagged-concrete",
    cs: "beton-z-pytle", sk: "beton-z-vreca", ro: "beton-la-sac", hr: "beton-iz-vrece", sr: "beton-iz-dzaka", it: "calcestruzzo-in-sacchi", nl: "beton-uit-zak", es: "hormigon-en-saco", fr: "beton-en-sac",
  },
  mortar: {
    pl: "klej-zaprawa", uk: "kliy-rozchyn", de: "kleber-moertel", en: "adhesive-mortar",
    cs: "lepidlo-malta", sk: "lepidlo-malta", ro: "adeziv-mortar", hr: "ljepilo-mort", sr: "lepak-malter", it: "colla-malta", nl: "lijm-mortel", es: "adhesivo-mortero", fr: "colle-mortier",
  },
  screed: {
    pl: "wylewka-tynk", uk: "styazhka-shtukaturka", de: "estrich-putz", en: "screed-plaster",
    cs: "poter-omitka", sk: "poter-omietka", ro: "sapa-tencuiala", hr: "estrih-zbuka", sr: "estrih-malter", it: "massetto-intonaco", nl: "dekvloer-pleister", es: "solera-revoco", fr: "chape-enduit",
  },
  grout: {
    pl: "fuga", uk: "zatyrka", de: "fugenmasse", en: "grout",
    cs: "sparovaci-hmota", sk: "skarovacia-hmota", ro: "chit-de-rosturi", hr: "fugir-masa", sr: "fug-masa", it: "stucco-per-fughe", nl: "voegmiddel", es: "lechada-de-juntas", fr: "joint-de-carrelage",
  },
  masonry: {
    pl: "murowanie", uk: "muruvannya", de: "mauerwerk", en: "masonry",
    cs: "zdeni", sk: "murovanie", ro: "zidarie", hr: "zidanje", sr: "zidanje", it: "muratura", nl: "metselwerk", es: "albanileria", fr: "maconnerie",
  },
  insulation: {
    pl: "ocieplenie-etics", uk: "uteplennya-etics", de: "daemmung-wdvs", en: "insulation-etics",
    cs: "zatepleni-etics", sk: "zateplenie-etics", ro: "termoizolatie-etics", hr: "izolacija-etics", sr: "izolacija-etics", it: "cappotto-termico-etics", nl: "gevelisolatie-etics", es: "aislamiento-sate-etics", fr: "isolation-ite-etics",
  },
  studwall: {
    pl: "sciana-dzialowa-gk", uk: "peregorodka-hk", de: "staenderwand", en: "stud-partition",
    cs: "pricka-sdk", sk: "priecka-sdk", ro: "perete-gips-carton", hr: "gk-pregrada", sr: "gk-pregrada", it: "parete-in-cartongesso", nl: "gipswand", es: "tabique-de-pladur", fr: "cloison-placo",
  },
  ceiling: {
    pl: "sufit-podwieszany", uk: "pidvisna-stelya", de: "abgehaengte-decke", en: "suspended-ceiling",
    cs: "podhled", sk: "podhlad", ro: "tavan-suspendat", hr: "spusteni-strop", sr: "spusteni-plafon", it: "controsoffitto", nl: "verlaagd-plafond", es: "techo-suspendido", fr: "plafond-suspendu",
  },
  drylining: {
    pl: "gk-na-klej", uk: "hk-na-kliy", de: "ansetzbinder-platten", en: "glued-plasterboard",
    cs: "sdk-na-lepidlo", sk: "sdk-na-lepidlo", ro: "gips-carton-lipit", hr: "gk-na-ljepilo", sr: "gk-na-lepak", it: "cartongesso-a-colla", nl: "gipsplaat-op-lijm", es: "pladur-pegado", fr: "placo-colle",
  },
  sheathing: {
    pl: "poszycie-osb", uk: "obshyvka-osb", de: "beplankung-osb", en: "sheathing-osb",
    cs: "zaklop-osb", sk: "zaklop-osb", ro: "astereala-osb", hr: "oplata-osb", sr: "oplata-osb", it: "rivestimento-osb", nl: "beplating-osb", es: "entablado-osb", fr: "voligeage-osb",
  },
};

/** Guides. `calcs` lists the calculator ids the guide links to, in order. */
export const GUIDES = [
  {
    id: "malowanie",
    calcs: ["coverage"],
    slug: {
      pl: "ile-farby-na-pokoj", uk: "skilky-farby-na-kimnatu", de: "wie-viel-farbe-fuer-ein-zimmer", en: "how-much-paint-for-a-room",
      cs: "kolik-barvy-na-pokoj", sk: "kolko-farby-na-izbu", ro: "cata-vopsea-pentru-o-camera", hr: "koliko-boje-za-sobu", sr: "koliko-boje-za-sobu", it: "quanta-pittura-per-una-stanza", nl: "hoeveel-verf-voor-een-kamer", es: "cuanta-pintura-para-una-habitacion", fr: "combien-de-peinture-pour-une-piece",
    },
  },
  {
    id: "plytki",
    calcs: ["waste", "mortar", "grout"],
    slug: {
      pl: "plytki-i-klej-do-lazienki", uk: "plytka-i-kliy-u-vannu", de: "fliesen-und-kleber-fuers-bad", en: "tiles-and-adhesive-for-a-bathroom",
      cs: "obklady-a-lepidlo-do-koupelny", sk: "obklady-a-lepidlo-do-kupelne", ro: "gresie-si-adeziv-pentru-baie", hr: "plocice-i-ljepilo-za-kupaonicu", sr: "plocice-i-lepak-za-kupatilo", it: "piastrelle-e-colla-per-il-bagno", nl: "tegels-en-lijm-voor-de-badkamer", es: "azulejos-y-adhesivo-para-el-bano", fr: "carrelage-et-colle-pour-la-salle-de-bain",
    },
  },
  {
    id: "panele",
    calcs: ["waste"],
    slug: {
      pl: "ile-paneli-na-podloge", uk: "skilky-paneley-na-pidlohu", de: "wie-viele-bodenpaneele", en: "how-many-floor-panels",
      cs: "kolik-panelu-na-podlahu", sk: "kolko-panelov-na-podlahu", ro: "cate-placi-de-parchet", hr: "koliko-panela-za-pod", sr: "koliko-panela-za-pod", it: "quanti-pannelli-per-il-pavimento", nl: "hoeveel-vloerpanelen", es: "cuantas-lamas-para-el-suelo", fr: "combien-de-lames-de-parquet",
    },
  },
  {
    id: "sciana",
    calcs: ["studwall", "sheathing"],
    slug: {
      pl: "sciana-dzialowa-gk-profile-i-plyty", uk: "hk-perehorodka-profili-ta-lysty", de: "staenderwand-profile-und-platten", en: "stud-partition-profiles-and-boards",
      cs: "sdk-pricka-profily-a-desky", sk: "sdk-priecka-profily-a-dosky", ro: "perete-gips-carton-profile-si-placi", hr: "gk-pregrada-profili-i-ploce", sr: "gk-pregrada-profili-i-ploce", it: "parete-cartongesso-profili-e-lastre", nl: "gipswand-profielen-en-platen", es: "tabique-de-pladur-perfiles-y-placas", fr: "cloison-placo-rails-et-plaques",
    },
  },
  {
    id: "klej",
    calcs: ["mortar", "waste", "grout"],
    slug: {
      pl: "ile-kleju-do-plytek", uk: "skilky-kliyu-dlya-plytky", de: "wie-viel-fliesenkleber", en: "how-much-tile-adhesive",
      cs: "kolik-lepidla-na-obklady", sk: "kolko-lepidla-na-obklady", ro: "cat-adeziv-pentru-gresie", hr: "koliko-ljepila-za-plocice", sr: "koliko-lepka-za-plocice", it: "quanta-colla-per-piastrelle", nl: "hoeveel-tegellijm", es: "cuanto-adhesivo-para-azulejos", fr: "combien-de-colle-a-carrelage",
    },
  },
  {
    id: "gladz",
    calcs: ["coverage"],
    slug: {
      pl: "ile-gladzi-na-sciane", uk: "skilky-shpaklivky-na-stinu", de: "wie-viel-spachtelmasse", en: "how-much-skim-coat",
      cs: "kolik-stuku-na-stenu", sk: "kolko-stuku-na-stenu", ro: "cat-glet-pentru-perete", hr: "koliko-gleta-za-zid", sr: "koliko-gleta-za-zid", it: "quanto-stucco-per-una-parete", nl: "hoeveel-plamuur-voor-een-muur", es: "cuanta-masilla-para-una-pared", fr: "combien-d-enduit-de-lissage",
    },
  },
  {
    id: "ocieplenie",
    calcs: ["insulation", "coverage", "mortar"],
    slug: {
      pl: "ocieplenie-domu-styropianem", uk: "uteplennya-budynku-pinoplastom", de: "haus-mit-eps-daemmen", en: "insulating-a-house-with-eps",
      cs: "zatepleni-domu-polystyrenem", sk: "zateplenie-domu-polystyrenom", ro: "termoizolarea-casei-cu-polistiren", hr: "izolacija-kuce-stiroporom", sr: "izolacija-kuce-stiroporom", it: "cappotto-termico-con-eps", nl: "huis-isoleren-met-eps", es: "aislar-la-casa-con-eps", fr: "isoler-une-maison-avec-du-pse",
    },
  },
  {
    id: "rozkroj",
    calcs: ["sheet", "linear"],
    slug: {
      pl: "rozkroj-plyty-meblowej-bez-odpadu", uk: "rozkriy-mebleovoyi-plyty-bez-vidkhodiv", de: "moebelplatte-mit-wenig-verschnitt-zuschneiden", en: "cutting-a-furniture-board-with-less-waste",
      cs: "narez-nabytkove-desky-s-malym-prorezem", sk: "rez-nabytkovej-dosky-s-malym-prierezom", ro: "debitarea-placii-de-mobila-cu-pierderi-mici", hr: "rezanje-namjestajne-ploce-s-manje-otpada", sr: "secenje-namestajne-ploce-sa-manje-otpada", it: "taglio-del-pannello-con-meno-scarto", nl: "meubelplaat-zagen-met-minder-afval", es: "cortar-un-tablero-con-menos-desperdicio", fr: "decouper-un-panneau-avec-moins-de-chutes",
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

/** The visitor's own materials (session 59, C6). */
export const urlOwnMaterials = (lang) => `${prefix(lang)}/${SECTION.ownMaterials[lang]}/`;
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

/**
 * The public page for LiczMat Pro — what it is, what it costs, who it is for.
 *
 * Session 29, and the one Pro address a guest is meant to reach: chapter X makes it one
 * of the three doors out of the home page, so it is GUEST and indexable while the five
 * modules it describes stay behind the paywall.
 */
export const urlLiczmatPro = (lang) => `${prefix(lang)}/${SECTION.pro[lang]}/`;

/**
 * The unit converter — session 57, item C1 of the parity audit.
 *
 * A tool of its own rather than a sixteenth calculator: it has no material, no waste
 * allowance and no result to file in a project, so it shares nothing with CALCS but the
 * shape of the card it is drawn in. Its place in the tree is under `calculators` all the
 * same (src/ia.mjs), because that is where somebody goes looking for it.
 */
export const urlConverter = (lang) => `${prefix(lang)}/${SECTION.converter[lang]}/`;

export const urlCookies = (lang) => `${prefix(lang)}/${SECTION.cookies[lang]}/`;

/**
 * Contact — audit item H7. Localized like every other section: the page that says who the
 * seller is has to be legible in the language the visitor is being sold in.
 */
export const urlContact = (lang) => `${prefix(lang)}/${SECTION.contact[lang]}/`;

/**
 * Who runs LiczMat. The one place the operator identity is written down.
 *
 * Audit item H7: index.html had no occurrence of the word "kontakt" and no mailto: at
 * all, while the same page took subscriptions and opened Firebase accounts. The footer of
 * every generated page and /kontakt/ in thirteen languages both read this object, so the
 * details are authored once and cannot drift apart.
 *
 * These are legal identifiers, not copy. They are never translated, never abbreviated and
 * never guessed: the owner supplied them. `address`, `taxId` and `regId` are optional —
 * LiczMat is run by a natural person who does not publish a street address, so those stay
 * empty and every reader drops the row rather than print a label with nothing after it.
 * Filling one in later puts it on all 523 pages — which means a full build, so `PL_ONLY`
 * has to come off for that run the way it did for the one that added this.
 */
export const ENTITY = {
  name: "Michał Polednia",
  address: "",
  taxId: "",
  regId: "",
  email: "polednia@gmail.com",
};

/** The rows the footer and /kontakt/ print, in order, skipping whatever is not filled in. */
export const entityRows = () => [
  { key: "contact_l_entity", value: ENTITY.name },
  { key: "contact_l_address", value: ENTITY.address },
  { key: "contact_l_tax", value: ENTITY.taxId },
  { key: "contact_l_reg", value: ENTITY.regId },
  { key: "contact_l_email", value: ENTITY.email },
].filter((r) => r.value);

/** The Android app's own page. Not the same thing as URL_APP, which is the account. */
export const urlAndroid = (lang) => `${prefix(lang)}/${SECTION.app[lang]}/`;

/** Privacy policy, the workspace and the shared-project view are single, language-neutral pages. */
export const URL_PRIVACY = "/privacy-policy.html";
export const URL_APP = "/app/";
export const URL_SHARE = "/p/";

/** The dashboard, under the account. Language-neutral like /app/ — it shows private data. */
export const URL_DASHBOARD = "/app/dashboard/";

export const PLAY_URL = "https://play.google.com/store/apps/details?id=pl.materio.app";
