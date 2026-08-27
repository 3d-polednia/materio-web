# materio-web

Serwis **LiczMat** — offline-first kalkulator i optymalizator materiałów
budowlanych. *Policz. Zaplanuj. Zrealizuj.*

Adres: <https://liczmat.com/> · Aplikacja w Google Play:
<https://play.google.com/store/apps/details?id=pl.materio.app>

> 📚 **Dokumentacja techniczna:** [`docs/DOKUMENTACJA.md`](docs/DOKUMENTACJA.md).
> **Plan produktu:** [`docs/MASTER_PLAN.txt`](docs/MASTER_PLAN.txt) (oryginał właściciela)
> i [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) (co zrobione, co otwarte).
> **Zasady pracy w tym repo:** [`CLAUDE.md`](CLAUDE.md) — najdłuższy i najbardziej
> aktualny opis tego, jak ten serwis działa.

## Czym jest ten projekt

W przeglądarce dalej czysty HTML/CSS/JS — bez frameworka, bez bundlera, bez
zależności runtime. Strony powstają jednak z jednego szablonu: build to
bezzależnościowy skrypt Node (patrz [Budowanie](#budowanie)).

- **Minimum zewnętrznych zależności** — brak CDN i brak czcionek z sieci.
  Kalkulatory liczą w przeglądarce. Usługi zewnętrzne: **Google Analytics** (GA4
  z Consent Mode v2 — nic nie zapisuje, dopóki odwiedzający nie kliknie zgody
  w banerze, i ładuje się dopiero po `load`) oraz sekcja „Sklepy": mapa **Google
  Maps** (embed) i lista sklepów z **OpenStreetMap (Overpass API)**, ładowane
  dopiero, gdy z niej korzystasz. Wyjątkiem są `/app/` i `/p/`, które ładują
  Firebase SDK z CDN Google.
- **Indeksowalna w 10 językach** — `pl, uk, de, en, cs, sk, ro, hr, sr, ru`. Każdy
  język ma własny adres (`/kalkulatory/…`, `/en/calculators/…`), treść jest zwykłym
  HTML-em, a `canonical` + `hreflang` wiążą wersje ze sobą. Przełącznik języka
  nawiguje, nie podmienia tekstu, i pokazuje flagę (SVG, nigdy emoji) obok nazwy
  języka — nazwy **języka**, nie kraju.
- **Waluta niezależna od języka** — `PLN, EUR, USD, UAH, CZK, RON, RSD`. Wybór
  zapisuje się w przeglądarce i dotyczy cen, kosztów i kosztorysów. Nic nie jest
  przeliczane po kursie, a jednostki fizyczne nie zmieniają się przy zmianie waluty.
- **Strona per kalkulator** — 15 kalkulatorów × 10 języków, każdy z własnym
  `title`/`description`/`schema.org`, sekcją „Jak to liczymy" (wzór, przykład
  policzony tym samym silnikiem, uwagi praktyczne) i dwoma pytaniami FAQ.
- **Gotowa pod SEO** — canonical, hreflang, Open Graph + Twitter, dane strukturalne
  `MobileApplication` + `Organization` + `WebSite` + `FAQPage` + `BreadcrumbList`
  + `ItemList` + `WebApplication` + `HowTo`, `sitemap.xml` czytany z architektury
  informacji, `robots.txt`, manifest PWA, obraz OG 1200×630.
- **Warsztat bez konta** — projekty, pomieszczenia, zapisane kalkulacje, lista
  materiałów i koszty leżą w `localStorage` **w kształcie dokumentu Firestore**.
  Liczenie nigdy nie wymaga konta.
- **Konto opcjonalne** — `/app/` to zalogowana przestrzeń (Firebase Auth +
  Firestore, ten sam kontrakt co apka na Androida), `/app/dashboard/` to pulpit,
  a `/p/<token>` to udostępniona wycena tylko do odczytu. Wszystkie trzy są
  `noindex` i tłumaczą się w miejscu, bez własnych adresów per język.
- **LiczMat Pro** — klienci, zlecenia, wyceny, terminarz i historia. Publiczny
  opis stoi na `/liczmat-pro/`; same moduły są za paywallem. Plan nadaje serwer
  (webhook Stripe w `functions/` albo `scripts/pro-admin.mjs`), nigdy przeglądarka.
- **Dostępna i responsywna** — znaczniki semantyczne, skip-link do `<main>`,
  widoczny focus, tryb jasny/ciemny, cele dotykowe 44 px przy grubym wskaźniku,
  pola 16 px w 44 px boksie.

## Budowanie

```bash
node scripts/build.mjs          # generuje 373 strony + sitemap.xml + styles.min.css
node scripts/build.mjs --check  # tylko walidacja słowników i slugów, nic nie pisze
```

Bez `package.json` i bez `node_modules` — skrypt czyta te same `assets/i18n.js`
i `assets/calculators.js`, których używa przeglądarka. **Wynik jest commitowany**,
bo GitHub Pages serwuje katalog repo bez żadnego budowania po swojej stronie.
Nie edytuj wygenerowanych plików `.html` — kolejny build je nadpisze.

Build **przerywa**, zamiast wypuścić zepsutą stronę: brakujący klucz w jednym
języku, kalkulator bez sluga albo bez wzoru, dwie strony pod jednym adresem,
język bez nazwy albo strona, której nie ma w `src/ia.mjs`.

## Testy

Trzydzieści kilka zestawów w `scripts/`, uruchamianych ręcznie — w repo nie ma CI,
które by je odpalało. Te bez `-page`/`-phone` w nazwie potrzebują wyłącznie `node`;
reszta potrzebuje Playwrighta **spoza repozytorium** i sama się pomija (kod 0),
kiedy go nie ma. Pełna lista z opisem, co który sprawdza, jest w
[`CLAUDE.md`](CLAUDE.md). Po zmianie w silnikach zawsze:

```bash
node scripts/test-calculators.mjs
```

## Struktura

Pliki **pisane ręcznie**:

```
scripts/build.mjs       Generator stron (Node, bez zależności)
scripts/test-*.mjs      Zestawy testów (42 pliki)
scripts/pro-admin.mjs   Nadawanie i odbieranie LiczMat Pro po adresie e-mail
src/
  ia.mjs                Architektura informacji: każda trasa, jej poziom dostępu,
                        rodzic, miejsce w nawigacji; źródło sitemap.xml
  site.mjs              BASE (adres serwisu), języki, slugi sekcji i kalkulatorów
  template.mjs          Wspólny <head>, nagłówek, stopka, baner zgody, okruszki
  pages.mjs             Zawartość <main> każdego typu strony
  app-pages.mjs         /app/, /app/dashboard/ i /p/ (noindex)
  pro.mjs               Strona buildowa LiczMat Pro: lista modułów, blok paywalla
  calc-meta.mjs         Wzory „Jak to liczymy" + ich tłumaczenia
  calc-seo.mjs          Title/description/FAQ każdego kalkulatora, 10 języków
  flags.mjs             Nazwy języków przy flagach (czyta LANGS z assets/i18n.js)
  currency.mjs          Waluty po stronie builda
  tokens.mjs            validateTokens(): system projektowy sprawdzany w buildzie
assets/
  styles.css            System projektowy — plik do edycji
  i18n.js               Słownik 10 języków (LANGS, I18N) — wejście builda
  i18n-pages.js         Słownik podstron, te same 10 języków — wejście builda
  i18n-materials.js     Nazwy i terminy materiałowe
  calculators.js        Silniki liczące (port 1:1 z aplikacji) + podpięcie formularzy
  units.js              Odmiana liczebnika i podstawianie |tokenów|
  materials.js          Katalog 161 materiałów (port z core/catalog/*.kt)
  materials-ui.js       Okno „wybierz materiał" + filtr na /materialy/
  calc-hub.js           Szukajka i filtr kategorii na /kalkulatory/
  workspace.js          Projekty, pomieszczenia, kalkulacje, materiały, koszty
  workspace-calc.js     Warsztat na stronie kalkulatora (pasek pokoju, zapis)
  workspace-ui.js       Ekrany /projekty/ i /kosztorys/
  crm-store.js          Sklep LiczMat Pro (klucz, zapis, odczyt, eksport/import)
  crm.js                Klienci, zlecenia, wyceny, terminarz
  crm-chain.js          Ścieżka klient → zlecenie → projekt → wycena → historia
  crm-ui.js / jobs-ui.js / quotes-ui.js / schedule-ui.js   Cztery ekrany Pro
  plan.js               Model Free/Pro: poziomy, uprawnienia, status planu
  paywall.js            Paywall narysowany (decyduje plan.js)
  pay.js                Subskrypcja: dwa plany, czternaście cen, adresy Stripe
  account.js            Sesja i trzy poziomy dostępu — ładowana na każdej stronie
  app.js                /app/ — Firebase Auth + synchronizacja Firestore
  dashboard.js          /app/dashboard/ — pulpit, bez Firebase
  recent.js             Ostatnio używane kalkulatory (tylko to urządzenie)
  share.js              /p/<token> — udostępniona wycena, tylko do odczytu
  currency.js           Waluta, niezależna od języka
  i18n-runtime.js       t(), przełącznik języka, tłumaczenie w miejscu, ensureLang()
  stores.js             Wyszukiwarka sklepów (mapa + lista z OpenStreetMap)
  main.js               Wiązanie strony (menu, karuzela, baner zgody)
  firebase-config.js    Konfiguracja Firebase Web (wartości produkcyjne)
  flags/<lang>.svg      Flagi przy nazwach języków (nigdy emoji)
  og-image.jpg · banner.jpg · icon-*.png · apple-touch-icon.png · favicon-32.png
functions/              Cloud Function: webhook Stripe nadający plan. Wdrażana
                        osobno (`firebase deploy --only functions`), NIGDY nie
                        trafia na Pages
privacy-policy.html · 404.html · robots.txt · site.webmanifest · .nojekyll
.github/workflows/pages.yml   Wdrożenie na GitHub Pages (tylko z gałęzi main)
docs/                   Dokumentacja i plan produktu
```

Pliki **generowane** (`node scripts/build.mjs`, nie edytuj ręcznie):

```
index.html · <lang>/index.html               Strona główna, 10 języków
kalkulatory/ · kalkulatory/<materiał>/       Hub + strona per kalkulator
poradniki/ · sklepy/ · materialy/ · cookies/ · aplikacja/
projekty/ · kosztorys/                       Warsztat (poziom GOŚĆ)
klienci/ · zlecenia/ · wyceny/ · terminarz/  LiczMat Pro
liczmat-pro/                                 Publiczna strona LiczMat Pro
<lang>/…                                     To samo w pozostałych 9 językach
app/index.html · app/dashboard/index.html · p/index.html   noindex
assets/i18n.<lang>.js                        Jeden słownik na język
assets/flags.js · assets/styles.min.css
sitemap.xml
```

## Uruchomienie lokalnie

Wystaw folder serwerem — strony linkują się adresami bezwzględnymi
(`/kalkulatory/…`), a geolokalizacja w wyszukiwarce sklepów wymaga origin:

```bash
node scripts/build.mjs        # jeśli zmieniałeś cokolwiek, co czyta build
python3 -m http.server 8080   # potem wejdź na http://localhost:8080
```

## Wdrożenie (GitHub Pages)

Workflow `.github/workflows/pages.yml` publikuje katalog główny repo przy każdym
pushu **do `main`**, po wyrzuceniu z artefaktu `docs/`, `src/`, `scripts/`,
`functions/`, `CLAUDE.md` i `README.md` — korzeń repo jest korzeniem serwisu, więc
wszystko, co w nim zostanie, jest publiczne. Domena własna: `liczmat.com`
(plik `CNAME` + `BASE` w `src/site.mjs`).

## Licencja

Treści marketingowe i marka „LiczMat" © LiczMat. Kod strony jest wolny do użytku.
