# Dokumentacja — materio-web

Dokumentacja techniczna strony aplikacji **LiczMat**. Opisuje architekturę,
sposób uruchomienia i wdrożenia, edycję treści i języków, działanie wyszukiwarki
sklepów, SEO oraz zarządzanie assetami.

- **Plan produktu:** [`MASTER_PLAN.txt`](MASTER_PLAN.txt) — wizja LiczMat, poziomy
  dostępu, branding, kolejność 36 sesji. Oryginał właściciela, źródło prawdy o zakresie.
  Status prac i otwarte decyzje: [`MASTER_PLAN.md`](MASTER_PLAN.md).
- **Repozytorium:** `3d-polednia/materio-web`
- **Adres docelowy:** `https://liczmat.com/` (od 2026-08-14; `materio-app.com` jest
  wyłączona i odpowiada „Site not found")
- **Aplikacja:** `pl.materio.app` (Google Play), Android 7.0+ (API 24)

> **Czego ten plik NIE opisuje.** Powstał, gdy serwis był jedną stroną, i opisuje jego
> szkielet: build, wdrożenie, języki, kalkulatory, SEO, assety. Modułów, które doszły
> później — projekty, pomieszczenia, koszty, LiczMat Pro (klienci, zlecenia, wyceny,
> terminarz), paywall i płatności — nie ma tutaj i nie ma po co ich tu dopisywać:
> opisuje je `CLAUDE.md`, decyzję za decyzją, i to jest plik do czytania przed pracą.
> Sprawdzone i poprawione w Sesji 48 (2026-08-27) — jeśli coś tu przeczytasz, powinno
> być prawdą; jeśli nie jest, to jest defekt, nie „stary tekst".

---

## Spis treści

1. [Filozofia i założenia](#1-filozofia-i-założenia)
2. [Struktura plików](#2-struktura-plików)
3. [Uruchomienie lokalnie](#3-uruchomienie-lokalnie)
4. [Wdrożenie na GitHub Pages](#4-wdrożenie-na-github-pages)
5. [Własna domena i zmiana adresu bazowego](#5-własna-domena-i-zmiana-adresu-bazowego)
6. [Treści i tłumaczenia (i18n)](#6-treści-i-tłumaczenia-i18n)
7. [Kalkulatory](#7-kalkulatory)
   - [7a. Testy kalkulatorów](#7a-testy-kalkulatorów)
7b. [Konto, sesja i poziomy dostępu](#7b-konto-sesja-i-poziomy-dostępu)
8. [Wyszukiwarka sklepów](#8-wyszukiwarka-sklepów)
9. [SEO](#9-seo)
10. [System projektowy (CSS)](#10-system-projektowy-css)
11. [Assety: ikona, baner, OG, favicon](#11-assety-ikona-baner-og-favicon)
12. [Polityka prywatności](#12-polityka-prywatności)
13. [Częste zadania utrzymaniowe (przepisy)](#13-częste-zadania-utrzymaniowe-przepisy)

---

## 1. Filozofia i założenia

- **Statyczna strona, ale generowana.** W przeglądarce dalej czysty HTML/CSS/JS —
  bez frameworka, bundlera i zależności runtime. Strony powstają jednak z jednego
  szablonu: `node scripts/build.mjs` (Node bez `package.json` i bez `node_modules`)
  zapisuje 373 pliki `.html` — plus `privacy-policy.html` i `404.html`, które są pisane
  ręcznie, czyli 375 stron w repo. Wynik jest commitowany, bo GitHub Pages serwuje
  katalog repo bez własnego budowania. Pliki, które widzisz w repo, to pliki, które
  trafiają na serwer — część z nich pisze generator, nie człowiek.
- **Prawda ponad marketing.** Aplikacja w wydaniu produkcyjnym zawiera reklamy
  (Google AdMob) oraz mapy/lokalizację (Google Maps/Places). Strona **nie**
  twierdzi, że jest „bez reklam". Od sierpnia 2026 istnieje też **opcjonalne konto**
  z synchronizacją przez Firestore, więc strona **nie** mówi już „bez konta" ani
  „nic nie opuszcza urządzenia". Uczciwe atuty, które komunikujemy: liczenie offline
  na urządzeniu, konto opcjonalne, dane konta w regionie UE i widoczne tylko dla
  właściciela, zgodność z RODO. Zmieniając treści, trzymaj się tej zasady.
- **Minimum zewnętrznych zapytań.** Strona nie ładuje czcionek z sieci. Google
  Analytics (GA4) działa w Consent Mode v2: `analytics_storage` startuje jako
  `denied` i włącza się dopiero po kliknięciu zgody w banerze — wybór zapisuje
  `localStorage['materio_consent']`. Pozostałe wyjątki, tylko na żądanie
  użytkownika w sekcji „Sklepy": embed Google Maps oraz zapytanie do
  OpenStreetMap/Overpass.
- **Treść indeksowalna w każdym z 10 języków.** Każdy język ma własny adres
  (`/kalkulatory/farby-tynki-grunty/`, `/en/calculators/paint-plaster-primer/`),
  a tekst jest zwykłym HTML-em wygenerowanym ze słownika. Przełącznik języka
  **nawiguje** do odpowiednika, zamiast podmieniać tekst — dopiero to sprawia, że
  pozostałych dziewięć języków w ogóle da się zaindeksować. Strona ma sens bez JS.
  Wyjątkiem są trzy strony bez własnego adresu per język — `/app/`, `/app/dashboard/`
  i `/p/` — które tłumaczą się w miejscu i są `noindex`.

## 2. Struktura plików

Pełny opis każdego pliku — po co istnieje i jaka decyzja za nim stoi — jest w `CLAUDE.md`.
Tu jest sam spis.

Pliki **pisane ręcznie**:

```
scripts/build.mjs        Generator stron; `--check` waliduje bez zapisu
scripts/check-contrast.mjs  Kontrast tokenów w obu motywach (WCAG AA), poza buildem
scripts/pro-admin.mjs    Nadawanie i odbieranie LiczMat Pro po adresie e-mail
scripts/fake-firebase.mjs   SDK Firebase podstawiany testom w Chromium
scripts/test-*.mjs       43 zestawy testów (patrz „Testy" w CLAUDE.md)
src/ia.mjs               Architektura informacji: każda trasa, jej poziom dostępu,
                         rodzic, miejsce w nawigacji. Build przerywa, jeśli napisał
                         inne strony, niż deklaruje ten plik; sitemap.xml wynika z niego
src/site.mjs             BASE (adres serwisu), języki, slugi sekcji/kalkulatorów/poradników
src/template.mjs         Wspólny <head>, nagłówek, stopka, baner zgody, okruszki
src/pages.mjs            Zawartość <main> każdego typu strony
src/app-pages.mjs        /app/, /app/dashboard/ i /p/ (noindex)
src/pro.mjs              Strona buildowa LiczMat Pro: lista modułów, blok paywalla
src/calc-meta.mjs        Wzory „Jak to liczymy" + ich tłumaczenia
src/calc-seo.mjs         Tytuł, opis i dwa pytania FAQ każdego kalkulatora, 10 języków
src/flags.mjs            Nazwy języków przy flagach (czyta LANGS z assets/i18n.js)
src/currency.mjs         Waluty po stronie builda
src/tokens.mjs           validateTokens(): system projektowy sprawdzany w buildzie
functions/               Cloud Function: webhook Stripe nadający plan. Wdrażana osobno
                         (`firebase deploy --only functions`), NIGDY nie trafia na Pages;
                         `firebase.json` i `.firebaserc` w korzeniu to jej konfiguracja
privacy-policy.html      Polityka prywatności (PL + EN) — wymóg Google Play
404.html                 Strona błędu 404; przekierowuje też /p/<token> na /p/?t=<token>
site.webmanifest         Manifest PWA (nazwa, ikony, kolory)
robots.txt               Reguły dla robotów + odnośnik do sitemap
CNAME                    Domena własna (liczmat.com)
.nojekyll                Wyłącza przetwarzanie Jekyll na GitHub Pages
assets/
  styles.css             System projektowy: tokeny + komponenty (DESIGN_SYSTEM.md).
                         To plik do edycji; strony linkują styles.min.css
  i18n.js                Słownik 10 języków (LANGS, I18N) — wejście builda
  i18n-pages.js          Słownik podstron, te same 10 języków — wejście builda
  i18n-materials.js      Nazwy i terminy materiałowe, te same 10 języków
  i18n-runtime.js        t(), przełącznik języka, tłumaczenie w miejscu, ensureLang()
  units.js               Odmiana liczebnika i podstawianie |tokenów|
  calculators.js         Silniki liczące + podpięcie formularzy (wireCalculator)
  materials.js           Katalog 161 materiałów (port z core/catalog/*.kt)
  materials-ui.js        Okno „wybierz materiał" + filtr na /materialy/
  calc-hub.js            Szukajka i filtr kategorii na /kalkulatory/
  workspace.js           Projekty, pomieszczenia, kalkulacje, materiały, koszty
  workspace-calc.js      Warsztat na stronie kalkulatora (pasek pokoju, zapis wyniku)
  workspace-ui.js        Ekrany /projekty/ i /kosztorys/
  crm-store.js           Sklep LiczMat Pro: klucz, zapis, odczyt, eksport/import
  crm.js                 Klienci, zlecenia, wyceny, terminarz
  crm-chain.js           Ścieżka klient → zlecenie → projekt → wycena → historia
  crm-ui.js              /klienci/
  jobs-ui.js             /zlecenia/
  quotes-ui.js           /wyceny/
  schedule-ui.js         /terminarz/
  plan.js                Model Free/Pro: poziomy, uprawnienia, status planu
  paywall.js             Paywall narysowany (decyduje plan.js)
  pay.js                 Subskrypcja: dwa plany, 14 cen, adresy Stripe
  account.js             Sesja i trzy poziomy dostępu — ładowana na każdej stronie
  app.js                 /app/ — Firebase Auth + synchronizacja Firestore
  dashboard.js           /app/dashboard/ — pulpit, celowo bez Firebase
  recent.js              Ostatnio używane kalkulatory (tylko to urządzenie)
  share.js               /p/<token> — udostępniona wycena, tylko do odczytu
  currency.js            Waluta, niezależna od języka
  stores.js              Wyszukiwarka sklepów (mapa + lista z OpenStreetMap)
  main.js                Wiązanie strony (menu, karuzela, baner zgody)
  firebase-config.js     Konfiguracja Firebase Web — wartości produkcyjne, nie placeholdery
  flags/<lang>.svg       Flagi przy nazwach języków (nigdy emoji)
  icon-192.png · icon-512.png · apple-touch-icon.png · favicon-32.png
  og-image.jpg           Podgląd społecznościowy 1200×630
  banner.jpg             Baner promocyjny
.github/workflows/
  pages.yml              Wdrożenie na GitHub Pages (tylko z gałęzi main)
docs/
  DOKUMENTACJA.md        Ten plik
  MASTER_PLAN.txt        Plan produktu — oryginał właściciela, źródło prawdy o zakresie
  MASTER_PLAN.md         Status prac, otwarte decyzje, lista rzeczy do zrobienia w konsolach
  ARCHITEKTURA.md        Architektura informacji: strony, routing, poziomy dostępu
  DESIGN_SYSTEM.md       System projektowy: tokeny, komponenty, stany, motywy
  COPY.md                Zasady copy („stop slop") i ich uzasadnienie
  STRIPE.md              Włączenie sprzedaży: sześć kroków w konsoli Stripe
```

Pliki **generowane** (`node scripts/build.mjs`, nie edytuj ręcznie):

```
index.html · <lang>/index.html            Strona główna, 10 języków
kalkulatory/ · kalkulatory/<materiał>/    Hub + 150 stron kalkulatorów
poradniki/ · sklepy/ · materialy/ · cookies/ · aplikacja/
projekty/ · kosztorys/                    Warsztat (poziom GOŚĆ)
klienci/ · zlecenia/ · wyceny/ · terminarz/   LiczMat Pro
liczmat-pro/                              Publiczna strona LiczMat Pro
<lang>/…                                  To samo w pozostałych 9 językach
app/index.html · app/dashboard/index.html · p/index.html   noindex
assets/i18n.<lang>.js · assets/flags.js · assets/styles.min.css
sitemap.xml
```

Kolejność ładowania skryptów jest decyzją strony, nie konwencją: `assets/units.js` idzie
przed `assets/calculators.js`, `assets/crm-store.js` przed `assets/crm.js`,
`assets/workspace-calc.js` przed `assets/workspace-ui.js`, a `assets/account.js` przed
`assets/plan.js`. Build wypisuje dla każdej strony dokładnie te skrypty, których ta strona
używa — `node scripts/test-perf.mjs` przerywa, jeśli któryś stanie na niej dwa razy.

## 3. Uruchomienie lokalnie

Najprościej wystawić folder serwerem HTTP (potrzebne, by działała geolokalizacja
w sekcji „Sklepy" — przeglądarki blokują ją na `file://`):

```bash
cd materio-web
python3 -m http.server 8080
# → http://localhost:8080
```

Otwarcie `index.html` z dysku (`file://`) **nie** wystarczy: strony linkują się
adresami bezwzględnymi (`/kalkulatory/…`), więc bez serwera nawigacja nie działa.

## 4. Wdrożenie na GitHub Pages

Wdrożenie jest automatyczne — workflow `.github/workflows/pages.yml` przy każdym
pushu pakuje katalog główny repo i publikuje go na Pages.

**Jednorazowa konfiguracja (wymaga właściciela repo):**

1. Wejdź w **Settings → Pages**.
2. W „Build and deployment" ustaw **Source: GitHub Actions**.
3. Zrób dowolny push (albo w Actions uruchom workflow ręcznie — „Run workflow").

Po tym strona jest pod `https://liczmat.com/`.

> **Dlaczego trzeba kliknąć ręcznie?** Token GitHub Actions w tym repo nie ma
> uprawnień, by samodzielnie *włączyć* Pages (zwraca „Resource not accessible by
> integration"). Po jednorazowym włączeniu źródła na „GitHub Actions" kolejne
> wdrożenia idą już automatycznie.

Workflow reaguje **wyłącznie** na push do `main` (plus ręczne `workflow_dispatch`).
Praca w tym repo i tak idzie na `main` — patrz „Repo policy" w `CLAUDE.md`.

**Co NIE trafia na serwer.** Krok „Drop internal files from the published site" kasuje
z artefaktu `docs/`, `src/`, `scripts/`, `functions/`, `firebase.json`, `.firebaserc`,
`CLAUDE.md`, `README.md`, `.claude` i `.gitignore`. Korzeń repo jest korzeniem serwisu,
więc wszystko, czego ten krok nie skasuje, jest publiczne. Dodając katalog, który ma
zostać prywatny, dopisz go tam.

## 5. Własna domena i zmiana adresu bazowego

**Stan aktualny:** serwisem steruje własna domena **`liczmat.com`** (od 2026-08-14).
Poprzednia, `materio-app.com`, została **świadomie wyłączona** — jeden serwis GitHub
Pages obsługuje jedną domenę własną i właściciel nie chciał przekierowania, więc stary
host odpowiada dziś „Site not found".

**Adres bazowy jest w jednym miejscu:** stała `BASE` w `src/site.mjs`. Z niej biorą się
`canonical`, `hreflang`, `og:url`, dane strukturalne i `sitemap.xml` — build je wypisuje,
nie człowiek. Wcześniejsza wersja tego rozdziału mówiła, że adres jest „wpisany na sztywno
w kilku miejscach"; to było prawdą przed wprowadzeniem builda i przestało nią być.

**Kroki dla kolejnej domeny (przykład `https://materio.pl`):**

1. Plik `CNAME` w korzeniu repo z samą domeną:
   ```
   materio.pl
   ```
2. DNS zgodnie z instrukcją GitHub Pages. GitHub wystawi certyfikat dopiero, gdy
   **wszystkie** rekordy A i AAAA wierzchołka wskazują na Pages — jeden obcy AAAA
   blokuje HTTPS i to właśnie zatrzymało migrację na `liczmat.com`.
3. `BASE` w `src/site.mjs` → `https://materio.pl`.
4. `robots.txt` — linia `Sitemap:` (plik jest pisany ręcznie).
5. `privacy-policy.html` — `canonical`, `og:url`, `og:image` (plik jest pisany ręcznie).
6. Podbij `STAMP` w `scripts/build.mjs`, uruchom `node scripts/build.mjs` i zacommituj
   wynik. Podbij też ręcznie `?v=` w `privacy-policy.html` i `404.html`.
7. Poza repo, i bez tego logowanie przestanie działać z nowego hosta: **Firebase Auth →
   Authorized domains** i **Google Cloud → Credentials → klucz przeglądarkowy → Website
   restrictions**. Obie listy są opisane w `docs/MASTER_PLAN.md`; przy edycji
   **zachować wszystkie dotychczasowe wpisy**.
8. Bliźniak polityki prywatności w repo aplikacji (`docs/privacy-policy.html`) oraz
   adres polityki wklejony w Google Play mówią o domenie wprost — poprawić oba.

> Ścieżki do assetów są **względne** (`assets/...`), więc nie trzeba ich ruszać.

## 6. Treści i tłumaczenia (i18n)

### Jak to działa

- **Strony powstają ze słownika w czasie builda.** `assets/i18n.js` trzyma `LANGS`
  (lista języków) i `I18N` (słownik `kod → {klucz: tekst}`); `scripts/build.mjs` czyta
  go tą samą sztuczką (`new Function`), co przeglądarka, i wypisuje gotowy HTML w każdym
  języku. Polski HTML nie może się więc rozjechać ze słownikiem — jest z niego zrobiony.
- **Przeglądarka pobiera dokładnie jeden słownik** — `assets/i18n.<lang>.js`,
  wygenerowany. `assets/i18n.all.js` (dziesięć języków w jednym pliku, 703 kB) został
  skasowany w Sesji 33.
- **Trzy strony tłumaczą się w miejscu:** `/app/`, `/app/dashboard/` i `/p/`. Nie mają
  adresu per język, więc build renderuje je w `DEFAULT_LANG`, a `ensureLang()`
  w `assets/i18n-runtime.js` dociąga drugi słownik, gdy odwiedzający wybierze inny język.
  Wszystko, co na nich rysuje JavaScript, **musi** się przerysować na zdarzeniu
  `langchange` — inaczej lista wyrenderowana raz zostaje w starym języku.
- **Brakujący klucz** spada do angielskiego, potem do polskiego, a na końcu pokazuje sam
  klucz (nigdy pusto). W buildzie brak klucza w jakimkolwiek języku **przerywa** build.

### Edycja istniejącego tekstu

Zmieniaj tekst **w słowniku**, nie w HTML-u: `assets/i18n.js` (strona główna i wspólne
elementy), `assets/i18n-pages.js` (podstrony), `assets/i18n-materials.js` (nazwy i terminy
materiałowe). Copy SEO kalkulatorów — tytuł, opis i FAQ — jest osobno, w `src/calc-seo.mjs`,
i **celowo nie jest słownikiem**: każda strona serwisu pobiera `assets/i18n.<lang>.js`,
a tego tekstu nie potrzebuje żadna z nich. Potem `node scripts/build.mjs` i zacommituj
wynik. **Nigdy nie edytuj wygenerowanego `.html`** — kolejny build to nadpisze.

Ile tekstu wolno napisać i czego nie wolno w nim napisać, mówi `docs/COPY.md`; pilnuje
tego `node scripts/test-copy.mjs`.

### Języki

Obsługiwane, zawsze wszystkie dziesięć: `pl, uk, de, en, cs, sk, ro, hr, sr, ru`.

Sześć z nich (`cs, sk, ro, hr, sr, ru`) zostało usuniętych 12.08.2026 i **przywrócone po
Sesji 28** na prośbę właściciela. Ich slugi odzyskano z gita (`ab1fb26`), a nie wymyślono
na nowo, więc wszystkie adresy działające przed usunięciem działają dalej. `RETIRED_LANGS`
w `src/site.mjs` jest dziś **pustą listą** i przekierowania w `404.html` już nie ma.
Rozdział V Master Planu wciąż wymienia cztery języki — ta zmiana należy do właściciela.

Nazwa języka jest zapisana **w jednym miejscu**: `LANGS` w `assets/i18n.js`. `LANG_NAME`
w `src/flags.mjs` tę listę czyta. Kiedyś była tam przepisana drugi raz i wymieniała cztery
języki, przez co 370 stron pisało słowo `undefined` obok sześciu flag (naprawione
w Sesji 41, pilnuje `node scripts/test-langs.mjs`). Nazwa jest nazwą **języka**, nigdy kraju.

Dodanie języka wymaga decyzji właściciela. Gdyby doszedł kolejny, potrzebne są cztery rzeczy:

1. Wpis `{ code, label }` w `LANGS` w `assets/i18n.js`.
2. Slugi sekcji, kalkulatorów i poradników w `src/site.mjs` (slug jest na zawsze).
3. Blok tłumaczeń w `assets/i18n.js`, `i18n-pages.js`, `i18n-materials.js`,
   `src/calc-meta.mjs` i `src/calc-seo.mjs` — build przerywa i wypisuje brakujące klucze.
4. Flaga jako `assets/flags/<kod>.svg` (nigdy emoji — rozdział V planu).

### Waluty

`assets/currency.js`: `PLN, EUR, USD, UAH, CZK, RON, RSD`. Trzy ostatnie doszły w Sesji 28,
żeby subskrypcję dało się wycenić tam, gdzie jest sprzedawana; **RUB celowo nie ma, bo
Stripe nie działa w Rosji**. Rozdział VI planu wymienia cztery waluty — ta zmiana też
należy do właściciela.

Waluta jest **niezależna od języka** (rozdział VI) — Deutsch + PLN to poprawne ustawienie.
Dziesięć języków dzieli siedem walut. Wybór trzymany jest w `localStorage` pod kluczem
`liczmat-currency`; bez wyboru obowiązuje domyślna dla języka (pl→PLN, uk→UAH, de→EUR,
en→USD, cs→CZK, sk→EUR, ro→RON, hr→EUR, sr→RSD, ru→EUR).

Nic nie jest przeliczane po kursie — offline'owy kalkulator nie ma skąd wziąć kursu,
a zmyślony kurs fałszowałby kosztorys. Zmiana waluty zmienia tylko to, w czym czytamy
i pokazujemy wpisane ceny. Jednostki fizyczne (m², kg, opakowania, płyty) nie zmieniają
się nigdy. Zapisana pozycja kosztorysu zachowuje `currencyCode` z chwili zapisu, więc po
zmianie waluty stara wycena nadal mówi prawdę; gdy pozycje mają różne waluty, strona
`/kosztorys/` pisze to wprost pod sumą.

## 7. Kalkulatory

- Kod: `assets/calculators.js`. Silniki są przeniesione 1:1 z aplikacji
  (`core/calculation/**`), liczą **wyłącznie w przeglądarce** — nic nie idzie na
  serwer. `CALCS` opisuje deklaratywnie pola, presety i wzór każdego z 15 kalkulatorów.
- **Każdy kalkulator ma własną stronę w każdym języku** — 150 stron. `calcCard()`
  w `src/pages.mjs` renderuje formularz w czasie builda, a `wireCalculator()`
  w `assets/calculators.js` podpina go w przeglądarce. Hub `/kalkulatory/` też jest
  wygenerowany w całości; `assets/calc-hub.js` tylko zawęża to, co już na nim stoi.
- **Rozkrój 2D** (`ENGINES.sheet` + `tryPlaceGuillotine`) to port
  `GuillotinePackingEngine.kt`: wolne prostokąty, cięcie gilotynowe, dopasowanie
  best-area-fit, rzaz piły i obrót elementów o 90°. Strona liczy tę samą liczbę
  arkuszy co aplikacja.
- **Presety materiałowe** biorą się z `assets/materials.js` — 161 pozycji, port
  `core/catalog/*.kt`. Okno wyboru materiału rysuje `assets/materials-ui.js`.
- **Pasek pokoju i zapis wyniku do projektu** to `assets/workspace-calc.js`: wypełnienie
  formularza z pomieszczenia, które ktoś zmierzył, i zapisanie wyniku w projekcie.
- Formatowanie liczb i walut zależy od aktywnego języka (`Intl.NumberFormat`), a odmiana
  liczebnika przy jednostce od `assets/units.js` — trzy rodziny reguł, bo „22 položky"
  to zły czeski na to, co po polsku brzmi „22 pozycje".

Dodanie nowego kalkulatora dotyka `assets/calculators.js` (pola + wzór), `src/site.mjs`
(slug w dziesięciu językach), `src/calc-meta.mjs` (wzór do „Jak to liczymy"),
`src/calc-seo.mjs` (tytuł, opis, dwa pytania FAQ — w dziesięciu językach) i `src/ia.mjs`.
Build przerywa, jeśli czegoś brakuje.

## 7a. Testy kalkulatorów

Dwa skrypty, uruchamiane ręcznie — w repozytorium nie ma CI, które by je odpalało.

```bash
node scripts/test-calculators.mjs   # matematyka, dane wejściowe, jednostki, wyniki,
                                    # wartości graniczne, lokalizacja, waluta
LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright \
  node scripts/test-pages.mjs       # te same kalkulatory w Chromium
```

- **`scripts/test-calculators.mjs`** nie wymaga niczego poza `node` — czyta
  `assets/calculators.js`, `assets/currency.js` i słowniki tą samą sztuczką
  (`new Function`), co `scripts/build.mjs`. Liczby oczekiwane są **wyprowadzone ręcznie
  ze wzoru**, który dany silnik dokumentuje, a nie odczytane z poprzedniego uruchomienia.
  Dwa silniki są heurystykami, nie wzorami (pakowanie 1D i gilotynowe 2D) — tam ręcznie
  wyprowadzone jest tylko to, co ma jedną możliwą odpowiedź (dokładne kafelkowanie,
  element większy od arkusza); reszta jest zapisana jako punkt odniesienia i mówi o tym
  wprost w komentarzu.
- **`scripts/test-pages.mjs`** podnosi statyczny serwer na katalogu repozytorium
  (to samo, co robi GitHub Pages) i przechodzi po stronach w Chromium. Jedyna zależność
  zewnętrzna — Playwright — **leży poza repozytorium**, bo serwis nie ma i nie ma mieć
  `package.json` ani `node_modules`. Bez Playwrighta skrypt mówi, że go pomija, i kończy
  się kodem 0, żeby brak przeglądarki nie blokował testów czystej logiki.
- Oba kończą się kodem 1 przy pierwszej awarii i wypisują, co i dlaczego nie przeszło.

**Kiedy uruchamiać:** po każdej zmianie w `assets/calculators.js`, po dodaniu lub zmianie
klucza `res_*` / `err_*` / `fld_*` w słowniku i po zmianie w `assets/currency.js`.

**Uwaga o zaokrągleniach.** Silniki liczą opakowania przez `⌈⌉` i profile przez `⌊⌋`, a
binarny float potrafi położyć dokładny wynik ułamek poniżej albo powyżej całkowitej —
`21.6 / 1.44` to `15.000000000000002`, a `2.4 / 0.4` to `5.999999999999999`. Dlatego
`ceil` i `floor` w `assets/calculators.js` przechodzą przez `snap()`, który przyciąga
wartość leżącą bliżej niż jedna miliardowa część od liczby całkowitej. Nie wolno wrócić do
gołych `Math.ceil` / `Math.floor` — sekcja „wartości graniczne" w teście pilnuje tego
dziesięcioma przypadkami.

**Aplikacja Android ma tę samą regułę od Sesji 47** (`snap()`, `ceilSnap()` i `floorSnap()`
w `core/calculation/WasteMath.kt` w repo `3d-polednia/Materio`). Silniki serwisu są portem
tamtych, więc dopóki poprawka stała tylko tutaj, dwa produkty odpowiadały na jedno pytanie
dwa razy inaczej. Do użytkownika telefonu poprawka dociera z najbliższym wydaniem.

## 7b. Konto, sesja i poziomy dostępu

Kod: `assets/account.js` (sesja, wspólna dla całego serwisu), `assets/app.js` (`/app/` —
jedyna strona, która rozmawia z Firebase), `src/app-pages.mjs` (widoki), `ACCOUNT_LEVELS`
w `src/ia.mjs` (trzy poziomy rozdziału II). Kontrakt danych:
`docs/FIRESTORE_SYNC.md` w repo `3d-polednia/Materio`.

### Poziom

`lmLevelOf(user, profile)` zwraca `guest` bez użytkownika, `pro` gdy
`users/{uid}.plan == "premium"` i jest ważny, w pozostałych przypadkach `liczmat`. `plan`
i `planValidUntil` zapisuje **wyłącznie serwer** — reguły dopuszczają z profilu tylko
`lastSeenAt` i `appVersion`, więc przeglądarka poziom czyta, ale nie nadaje. Dziś nikt
`plan` nie zapisuje (brak Cloud Functions i Play Billing), więc realnie istnieją dwa
poziomy: gość i LiczMat. Karta Pro mówi „W przygotowaniu” i nie ma przycisku zakupu.

### Sesja poza `/app/`

129 stron nie ładuje Firebase. Dostają jeden klucz `localStorage`:

| Klucz | Wartość | Kto pisze | Do czego |
|---|---|---|---|
| `liczmat-signed-in` | `liczmat` / `pro` (brak = gość) | `/app/` przy zmianie stanu logowania | zdanie pod wynikiem kalkulatora, kropka przy „Moje konto” w nagłówku |
| `liczmat-remember` | `1` / `0` | formularz logowania i profil | czy prosić Firebase o `browserLocalPersistence`, czy o `browserSessionPersistence` |

`liczmat-signed-in` to **podpowiedź, nigdy uprawnienie**. Może być nieaktualna, więc nic
nie wolno na niej bramkować — `FIRESTORE_SYNC.md` §1.2 mówi, że liczenie nigdy nie wymaga
konta. Wartość `1`, którą klucz trzymał przed Sesją 13, nadal czyta się jako „zalogowany”.

### Widoki logowania

Jedna karta, trzy widoki (`[data-auth-view]`): `signin`, `signup`, `reset`. Każdy ma
**własny formularz**, bo przeglądarka podpowiada hasło po `autocomplete`, a jedno pole na
dwa tryby dawało zapisane hasło na formularzu zakładania konta. Widok wybiera
`?mode=signup` albo `?mode=reset`; `?next=<ścieżka>` pokazuje po zalogowaniu przycisk
powrotu. `lmSafeNext()` przepuszcza wyłącznie ścieżkę tego serwisu — `//gdzieś.example`
i `javascript:` są odrzucane, żeby strona logowania nie była otwartym przekierowaniem.

### Profil

Zakładka „Profil” na `/app/`: adres, sposób logowania, data założenia i ostatniego użycia
(z `users/{uid}`), nazwa konta, poziom i sesja na urządzeniu. **Nazwa idzie do Firebase
Auth (`updateProfile`), nie do Firestore** — reguły odrzuciłyby dodatkowe pole w profilu.

### Usuwanie konta

Kolejność w `deleteEverything()`: **najpierw dokument profilu**, potem podkolekcje,
projekty, pomieszczenia i linki `sharedProjects`, a użytkownik Firebase **na samym
końcu** (reguły kluczują po `request.auth.uid`, więc po jego skasowaniu dokumenty stają
się nieosiągalne — `FIRESTORE_SYNC.md` §7). Profil idzie pierwszy, bo to jedyne
usunięcie, które reguły kiedykolwiek odrzuciły: **wdrożone reguły odmawiają go do dziś**
(zmierzone 2026-08-13, 403 `PERMISSION_DENIED`). Odmowa przychodzi więc, zanim cokolwiek
zniknie, a strona mówi „serwer odrzucił żądanie, Twoje dane są nietknięte" zamiast
„spróbuj ponownie". Naprawa: `firebase deploy --only firestore` w repo aplikacji.

### Testy

```bash
node scripts/test-account.mjs        # poziomy, sesja, ?next=, dziesięć języków
LM_PLAYWRIGHT=/tmp/lm-test/node_modules/playwright \
  node scripts/test-account-page.mjs # /app/ w Chromium, SDK Firebase podstawiony
```

`test-account-page.mjs` przechwytuje trzy importy z `gstatic.com` i odpowiada własnym
modułem: konta w obiekcie, Firestore jako `Map`, każde wywołanie zapisane. Dzięki temu
test dotyczy kodu tego repozytorium, a nie dostępności Google — i daje się uruchomić
z kontenera, który do `gstatic.com` i tak nie dociera. Czego **nie** sprawdza: czy samo
Firebase zachowuje się tak, jak zakłada `assets/app.js`; to weryfikacja na żywo,
opisana w `FIRESTORE_SYNC.md` §8.

## 8. Wyszukiwarka sklepów

Kod: `assets/stores.js`, funkcja `buildStoreFinder()` (uruchamiana z `main.js`,
gdy na stronie jest `#store-panel`). Sekcja ma `id="sklepy"`.

**Dwa tryby:**

1. **Lista najbliższych sklepów (przycisk „Pokaż sklepy w pobliżu").**
   - Prosi o geolokalizację (`navigator.geolocation`).
   - Buduje zapytanie Overpass QL i odpytuje **OpenStreetMap** przez Overpass API
     (`fetchStores`). Endpointy z fallbackiem: `overpass-api.de`, potem
     `overpass.kumi.systems`.
   - `normalize()` wylicza odległość (Haversine), odrzuca duplikaty i punkty > 20 km,
     sortuje rosnąco.
   - `renderList()` pokazuje **5** pozycji, resztę chowa za przyciskiem
     „Pokaż więcej (N)"/„Pokaż mniej".
   - Każda pozycja ma przycisk **„Nawiguj"** →
     `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lon>`.
   - Obsłużone przypadki brzegowe: brak zgody na lokalizację, brak wyników w 20 km,
     błąd Overpass (fallback: link do Google Maps).

2. **Wyszukiwanie po nazwie/mieście (pole tekstowe + „chipsy").**
   - Nie wymaga lokalizacji. Wpisany tekst (miasto lub nazwa sklepu, np. „Castorama")
     wyśrodkowuje osadzoną mapę Google (`#store-map`, embed `maps.google.com/...&output=embed`
     — bez klucza API).
   - „Chipsy" to gotowe przykłady do kliknięcia. To **przykłady do wpisania**, nie
     lista „obsługiwanych sieci" — świadomy wybór (patrz niżej).

**Parametry do regulacji (góra `stores.js`):**

| Stała | Znaczenie | Domyślnie |
|-------|-----------|-----------|
| `RADIUS_M` | promień wyszukiwania (metry) | `20000` (20 km) |
| `SHOW_FIRST` | ile pozycji przed „Pokaż więcej" | `5` |
| `OSM_TAGS` | pary tag=wartość OSM do wyszukania | markety/hurtownie/narzędzia/farby/płytki/drewno |
| `TYPE_LABEL` | polskie etykiety typów sklepów | — |
| `OVERPASS` | endpointy Overpass (fallback po kolei) | 2 serwery |

Dodanie nowego typu punktu (np. wypożyczalnia sprzętu): dopisz parę do `OSM_TAGS`
(np. `["shop","tool_hire"]` lub `["amenity","..."]`) i etykietę w `TYPE_LABEL`.

Przykłady do wpisania („chipsy") to zwykłe przyciski `<button class="chip"
data-example="...">` w sekcji „Sklepy" w `index.html` — dodajesz/usuwasz je
bezpośrednio w HTML.

> **Ważne — decyzja produktowa.** Nie pokazujemy listy „obsługiwane sieci"
> (marek, z którymi rzekomo współpracujemy). Nazwy sieci występują wyłącznie jako
> **przykłady wyszukiwania**. Wpisanie np. „Castorama" pokaże najbliższy taki sklep
> z danych OpenStreetMap — to zwykłe wyszukiwanie, nie deklaracja partnerstwa.

## 9. SEO

Wszystkie poniższe elementy generuje `scripts/build.mjs` dla każdej strony:

- **Meta:** `title`, `description`, `robots`, `canonical`, `theme-color`
  (jasny/ciemny), `application-name`.
- **Wielojęzyczność:** każda strona ma `hreflang` dla wszystkich 4 języków oraz
  `x-default` wskazujący wersję polską. To jest sedno zmiany — wcześniej dziewięć
  języków dzieliło jeden adres i nie mogło się zaindeksować.
- **Treść indeksowalna:** teksty są zwykłym HTML-em w języku danej strony.
- **Open Graph + Twitter Card:** tytuł, opis, `og:image` = `/assets/og-image.jpg`
  (1200×630), `og:locale` dopasowany do języka.
- **Dane strukturalne (JSON-LD):** `WebSite`, `Organization` i `FAQPage` na stronie
  głównej; `MobileApplication` na `/aplikacja/` (Sesja 6 przeniosła ją tam ze strony
  głównej, która nie jest aplikacją Androida); `BreadcrumbList` na każdej podstronie;
  `ItemList` na hubie kalkulatorów; `WebApplication` na stronie kalkulatora; `HowTo`
  w poradniku.
- **Techniczne:** `sitemap.xml` (generowany, ~224 adresy), `robots.txt`, manifest
  PWA, `404.html`. `/app/` i `/p/` są `noindex` i nie ma ich w sitemapie.

FAQ nie trzeba już synchronizować ręcznie — widoczny blok `<details>` i blok
`FAQPage` w JSON-LD powstają z tych samych kluczy `faq_q*`/`faq_a*`.

### Strona per kalkulator

Każdy z 15 kalkulatorów ma własną stronę w każdym języku: formularz na żywo obok
sekcji „Jak to liczymy" (co podajesz → wzór → przykład → na co uważać). **Przykład
liczy prawdziwy silnik** na wartościach domyślnych formularza, w trakcie builda —
więc liczba na stronie nie może rozjechać się z kodem. Wzory żyją w
`src/calc-meta.mjs`; zmieniając silnik w `assets/calculators.js`, popraw wzór obok.

## 9a. Konto i synchronizacja (/app/, /app/dashboard/, /p/)

- `/app/` — logowanie e-mailem (Firebase Auth), lista projektów i pomieszczeń,
  tworzenie i usuwanie (tombstone), przycisk „Udostępnij", zakładka planu.
  **Przycisk logowania Google jest ukryty od 2026-08-14** (decyzja właściciela): jeden
  przełącznik `GOOGLE_SIGN_IN` w `src/app-pages.mjs`, drugi `GOOGLE_SIGN_IN_ENABLED`
  w `AccountViewModel.kt` w repo aplikacji, oba `false`. Provider w Firebase pozostał
  włączony, więc konta założone przez Google dalej istnieją i dalej są ich właścicieli.
- `/app/dashboard/` — pulpit darmowego konta. **Nie ładuje Firebase w ogóle**: wszystko,
  co pokazuje, leży już w `localStorage`.
- Synchronizacja obejmuje dwa magazyny: warsztat (`materio-workspace-v1`) i magazyn
  LiczMat Pro (`liczmat-crm-v1`). Osobne klucze zostają osobne — dwa pliki piszące do
  jednego klucza to jeden wyścig od zgubionego zapisu.
- `/p/<token>` — kopia wyceny tylko do odczytu, bez logowania. GitHub Pages nie ma
  przepisywania adresów, więc `404.html` przekierowuje na `/p/?t=<token>`. Token **jest**
  poświadczeniem, więc od Sesji 35 ta jedna strona nie ładuje analityki (GA4 raportuje
  cały adres jako `page_location`) i niesie `<meta name="referrer" content="no-referrer">`.
  Kształt tokenu sprawdzany jest przed zapytaniem: `[A-Za-z0-9_-]{16,64}`, bo Firestore
  sklejał `?t=a/b/c` w adres innego dokumentu.
- **Kopia konta w przeglądarce ma właściciela (Sesja 35).** „Pobierz z konta" wgrywa dane
  do `localStorage`; klucz `liczmat-sync-account` trzyma `uid`, z którym ta przeglądarka
  synchronizowała się ostatnio. Gdy wskazuje inne konto, `/app/` wstrzymuje synchronizację
  w obie strony — inaczej na wspólnym komputerze cudze projekty jechały na cudze konto.
  Przycisk na zakładce ustawień czyści cztery magazyny danych tej przeglądarki
  (warsztat, otwarty projekt, historia kalkulatorów, magazyn Pro) i zostawia ustawienia.
- Schemat dokumentów jest **wspólny z aplikacją Androida** — kontrakt opisuje
  `docs/FIRESTORE_SYNC.md` w repo `3d-polednia/Materio` (repozytorium nazywa się nadal
  Materio, mimo rebrandingu), a po stronie Kotlina `core/sync/SyncContract.kt`. Zmiana
  w jednym miejscu wymaga zmiany we wszystkich. Od Sesji 46 kontrakt ma osiem kolekcji:
  doszli klienci, zlecenia i wyceny. **Reguły dla tych trzech czekają na wdrożenie** —
  patrz „Do zrobienia w konsolach" w `docs/MASTER_PLAN.md`.
- `assets/firebase-config.js` trzyma **wartości produkcyjne** projektu `materio-502513`
  (wpisane 2026-08-07), a nie placeholdery. Stała `FIREBASE_READY` nadal pilnuje
  przypadku placeholderowego, więc fork albo niedokończona edycja kończą się czytelnym
  komunikatem zamiast martwym formularzem. Klucz Web API Firebase **nie jest sekretem** —
  nie da się go ukryć w aplikacji przeglądarkowej; dane chronią reguły bezpieczeństwa
  i lista autoryzowanych domen.

Sprawdzenie po wdrożeniu: [Google Rich Results Test](https://search.google.com/test/rich-results),
[PageSpeed Insights](https://pagespeed.web.dev/), podgląd OG:
[opengraph.xyz](https://www.opengraph.xyz/). Po starcie warto dodać stronę do
Google Search Console i zgłosić `sitemap.xml`.

## 10. System projektowy (CSS)

Pełny opis: **[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)** — kolory, typografia, spacing,
komponenty, stany, responsywność, oba motywy. Skrót:

- Wszystko w `assets/styles.css`: blok tokenów na górze, pod nim warstwy (baza →
  układ → komponenty → chrom serwisu → strony → narzędzia → responsywność → druk).
- **Żadna reguła poza blokiem tokenów nie wpisuje własnego koloru, zaokrąglenia ani
  czasu animacji.** Pilnuje tego `validateTokens()` z `src/tokens.mjs`, wywoływane
  w buildzie — złamanie zasady przerywa build.
- Trzy grupy tokenów: kolor (osobno dla motywu jasnego i ciemnego), skale
  (`--fs-*`, `--sp-*`, `--radius-*`, `--shadow-1..3`, `--dur-*`) i metryki kontrolek
  (`--control-h` 44px, `--focus-*`).
- Dwa motywy = te same reguły, inne wartości tokenów koloru. Motyw wybrany ręcznie
  siedzi w `data-theme` na `<html>`, brak wyboru = motyw systemowy.
- Font: systemowy stack (`--font`) — bez pobierania czcionek z sieci (szybkość +
  prywatność).
- Kontrast: `node scripts/check-contrast.mjs` mierzy każdą parę tekst/tło w obu
  motywach (WCAG AA) i zwraca kod 1, gdy któraś nie trafia w próg.

## 11. Assety: ikona, baner, OG, favicon

Źródłem prawdy jest **ikona i baner z Google Play**. Warianty rastrowe
wygenerowano z nich (`sharp`). Jeśli zmienisz ikonę/baner, przegeneruj rozmiary:

```bash
# wymaga node + pakietu sharp (npm i sharp)
node -e '
const sharp=require("sharp");
(async()=>{
  const icon="ZRODLO-ikona.png";     // kwadrat, najlepiej 512+
  await sharp(icon).resize(512,512).png().toFile("assets/icon-512.png");
  await sharp(icon).resize(192,192).png().toFile("assets/icon-192.png");
  await sharp(icon).resize(180,180).png().toFile("assets/apple-touch-icon.png");
  await sharp(icon).resize(32,32).png().toFile("assets/favicon-32.png");
  await sharp("ZRODLO-baner.jpg").resize(1200,630,{fit:"cover",position:"center"})
       .jpeg({quality:86}).toFile("assets/og-image.jpg");
})();'
```

Ikona jest używana w nagłówku, stopce, jako favicon (`favicon-32.png` +
`icon-192.png`), apple-touch-icon i w manifeście PWA. `og-image.jpg` to podgląd
przy udostępnianiu linku w social media.

## 12. Polityka prywatności

**Kanoniczna jest `privacy-policy.html` w korzeniu tego repo**, pod
`https://liczmat.com/privacy-policy.html`. Plik pisany ręcznie (build go nie generuje),
dwie wersje w jednym dokumencie: **PL** (`#pl`) i **EN** (`#en`). Osobna podstrona, bo
Google Play wymaga publicznego URL polityki.

Treść ma się zgadzać z tym, co produkt naprawdę robi: liczenie offline na urządzeniu,
reklamy Google AdMob + zgoda UMP w aplikacji, Google Maps/Places i lokalizacja, na stronie
GA4 z Consent Mode v2 i zapytanie do OpenStreetMap/Overpass w sekcji „Sklepy", **opcjonalne
konto** z synchronizacją Firestore, **link udostępnienia** `/p/<token>` czytelny dla
każdego, kto go ma, oraz **§7.1 o Stripe** — kto przetwarza dane płatnicze i co do nas
wraca (status planu, data ważności, czy się odnowi).

### Są trzy kopie tej polityki

Stan zmierzony 2026-08-27 (adres w Play odczytany z żywej strony sklepu):

| Kopia | Gdzie | Stan |
|---|---|---|
| Kanoniczna | `privacy-policy.html`, `https://liczmat.com/privacy-policy.html` | Aktualna (8.08.2026 + §7.1 o Stripe) |
| Bliźniak w repo aplikacji | `docs/privacy-policy.html` w `3d-polednia/Materio` | Doprowadzony do zgodności w Sesji 48 i **generowany** z kanonicznej |
| Trzecia, osierocona | `https://3d-polednia.github.io/Materio-polityka-prywatno-ci/` — osobne repozytorium | **Nieaktualna: 16.07.2026.** Marka „Materio", zero słowa o koncie, synchronizacji, linku udostępnienia i Stripe |

**Google Play wskazuje na kanoniczną** — sklep podaje dziś
`https://liczmat.com/privacy-policy.html`, więc użytkownik sklepu czyta aktualny tekst.
`docs/GOOGLE_PLAY_DEPLOYMENT.md` w repo aplikacji twierdził inaczej (wpisywał adres
`github.io` i stawiał przy nim „GOTOWE ✅"); poprawione w Sesji 48.

Trzecia kopia nadal stoi pod publicznym adresem i nadal mówi nieprawdę o produkcie.
Nikt jej już nie linkuje z produktu, ale nic jej też nie kasuje. Repozytorium
`Materio-polityka-prywatno-ci` nie jest podpięte do żadnej z tych sesji, więc jest to
pozycja z listy „Do zrobienia w konsolach" w `docs/MASTER_PLAN.md`.

**Zmieniając cokolwiek w tym, co produkt zbiera, poprawiaj kanoniczną i bliźniaka w tej
samej sesji.** Trzy kopie jednego tekstu to trzy teksty, które się rozjeżdżają — a ten
akurat jest oświadczeniem prawnym.

**Administrator danych i kontakt** to dziś `polednia@gmail.com` (szukaj w pliku). Podmiana
na adres firmowy jest decyzją właściciela.

## 13. Częste zadania utrzymaniowe (przepisy)

**Zmiana e-maila w polityce prywatności:**
Znajdź i zamień `polednia@gmail.com` w `privacy-policy.html` (występuje kilka razy:
nagłówek, sekcja „Twoje prawa", „Kontakt", w PL i EN).

**Zmiana promienia wyszukiwania sklepów (np. 30 km):**
`assets/stores.js` → `const RADIUS_M = 30000;`.

**Zmiana liczby sklepów przed „Pokaż więcej" (np. 8):**
`assets/stores.js` → `const SHOW_FIRST = 8;`.

**Dodanie typu punktu do listy sklepów:**
`assets/stores.js` → dopisz parę do `OSM_TAGS` i etykietę do `TYPE_LABEL`.

**Zmiana danych strukturalnych aplikacji:**
`scripts/build.mjs` → `androidMain()` w `src/pages.mjs` (encja `MobileApplication`
stoi na `/aplikacja/`). Nigdy w wygenerowanym `.html` — build to nadpisze.

**Aktualizacja tekstu FAQ:**
Klucze `faq_q*` / `faq_a*` w `assets/i18n.js`, we wszystkich dziesięciu językach;
które pytania trafiają na stronę główną, mówi `FAQ_KEYS` w `src/pages.mjs`. Widoczny
blok `<details>` i JSON-LD `FAQPage` powstają z tej samej listy.

**Zmiana kolorystyki:**
`assets/styles.css` → zmienne w `:root` (i odpowiedniki w bloku dark-mode).

**Podmiana ikony/banera:** patrz sekcja 11 (regeneracja rozmiarów).

---

*Ten plik utrzymuj razem ze zmianami w kodzie — gdy zmienia się zachowanie,
zaktualizuj odpowiednią sekcję.*
