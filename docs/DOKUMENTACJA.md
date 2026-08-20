# Dokumentacja — materio-web

Dokumentacja techniczna strony aplikacji **LiczMat**. Opisuje architekturę,
sposób uruchomienia i wdrożenia, edycję treści i języków, działanie wyszukiwarki
sklepów, SEO oraz zarządzanie assetami.

- **Plan produktu:** [`MASTER_PLAN.txt`](MASTER_PLAN.txt) — wizja LiczMat, poziomy
  dostępu, branding, kolejność 36 sesji. Oryginał właściciela, źródło prawdy o zakresie.
  Status prac i otwarte decyzje: [`MASTER_PLAN.md`](MASTER_PLAN.md).
- **Repozytorium:** `3d-polednia/materio-web`
- **Adres docelowy:** `https://materio-app.com/`
- **Aplikacja:** `pl.materio.app` (Google Play), Android 7.0+ (API 24)

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
  zapisuje 135 plików `.html`. Wynik jest commitowany, bo GitHub Pages serwuje
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
- **Treść indeksowalna w każdym z 4 języków.** Każdy język ma własny adres
  (`/kalkulatory/farby-tynki-grunty/`, `/en/calculators/paint-plaster-primer/`),
  a tekst jest zwykłym HTML-em wygenerowanym ze słownika. Przełącznik języka
  **nawiguje** do odpowiednika, zamiast podmieniać tekst — dopiero to sprawia, że
  pozostałe trzy języki w ogóle da się zaindeksować. Strona ma sens bez JS.

## 2. Struktura plików

Pliki pisane ręcznie:

```
scripts/build.mjs        Generator stron; `--check` waliduje bez zapisu
src/site.mjs             Mapa serwisu: języki, slugi sekcji/kalkulatorów/poradników
src/template.mjs         Wspólny <head>, nagłówek, stopka, baner zgody, okruszki
src/pages.mjs            Zawartość <main> każdego typu strony
src/calc-meta.mjs        Wzory „Jak to liczymy" + ich tłumaczenia
src/tokens.mjs           Kontrola systemu projektowego (validateTokens) — czyta styles.css
scripts/check-contrast.mjs  Pomiar kontrastu tokenów w obu motywach (WCAG AA)
src/app-pages.mjs        /app/ i /p/ (noindex)
src/ia.mjs               Architektura informacji: trasy, poziomy dostępu, ACCOUNT_LEVELS
scripts/test-calculators.mjs  Testy silników (czysta logika, bez zależności)
scripts/test-pages.mjs        Testy stron kalkulatorów w Chromium (Playwright spoza repo)
scripts/test-account.mjs      Testy konta: poziomy, sesja, ?next=, słownik (bez zależności)
scripts/test-account-page.mjs Testy /app/ w Chromium z podstawionym SDK Firebase
scripts/test-mobile.mjs       Cały serwis na telefonie: szerokości rozdziału XXVIII,
                              cele dotykowe, pola, tabele, klawiatura numeryczna,
                              przełączniki języka/waluty/motywu (Sesja 32)
privacy-policy.html      Polityka prywatności (PL + EN) — osobna podstrona (wymóg Google Play)
404.html                 Strona błędu 404; przekierowuje też /p/<token> na /p/?t=<token>
site.webmanifest         Manifest PWA (nazwa, ikony, kolory)
robots.txt               Reguły dla robotów + odnośnik do sitemap
.nojekyll                Wyłącza przetwarzanie Jekyll na GitHub Pages
assets/
  styles.css             System projektowy: tokeny + wszystkie komponenty (DESIGN_SYSTEM.md)
  i18n.js                Słownik 4 języków (LANGS, I18N) — wejście builda
  i18n-pages.js          Słownik podstron, te same 4 języki — wejście builda
  i18n-runtime.js        t(), przełącznik języka, tłumaczenie w miejscu dla /app/ i /p/
  units.js               Odmiana liczebnika i podstawianie |tokenów| — wspólne dla
                         kalkulatorów, projektów, kosztorysu i pulpitu
  calculators.js         Silniki liczące + podpięcie formularzy (wireCalculator)
  stores.js              Wyszukiwarka sklepów (buildStoreFinder): mapa + lista OSM
  main.js                Wiązanie strony (pomieszczenia, menu mobilne, karuzela, zgoda)
  account.js             Sesja i poziomy dostępu — ładowana na każdej stronie
  app.js                 /app/ — Firebase Auth + synchronizacja Firestore
  share.js               /p/<token> — udostępniona wycena, tylko do odczytu
  firebase-config.js     Konfiguracja Firebase Web (placeholdery do uzupełnienia)
  icon-192.png,          Ikona z Google Play w kilku rozmiarach (nagłówek, PWA, favicon)
  icon-512.png,
  apple-touch-icon.png,
  favicon-32.png
  og-image.jpg           Podgląd społecznościowy 1200×630 (z banera Google Play)
  banner.jpg             Baner promocyjny (grafika z Google Play)
.github/workflows/
  pages.yml              Automatyczne wdrożenie na GitHub Pages
docs/
  DOKUMENTACJA.md        Ten plik
  DESIGN_SYSTEM.md       System projektowy: tokeny, komponenty, stany, motywy
  ARCHITEKTURA.md        Architektura informacji: strony, routing, poziomy dostępu
```

Kolejność ładowania skryptów na `index.html` (na końcu `<body>`):
`i18n.js` → `calculators.js` → `stores.js` → `main.js`. `main.js` wywołuje funkcje
budujące tylko wtedy, gdy dana sekcja istnieje na stronie (wszystko jest
„zabezpieczone", więc bezpiecznie pominąć dowolny skrypt).

## 3. Uruchomienie lokalnie

Najprościej wystawić folder serwerem HTTP (potrzebne, by działała geolokalizacja
w sekcji „Sklepy" — przeglądarki blokują ją na `file://`):

```bash
cd materio-web
python3 -m http.server 8080
# → http://localhost:8080
```

Sama strona (poza listą sklepów) działa też po zwykłym otwarciu `index.html`.

## 4. Wdrożenie na GitHub Pages

Wdrożenie jest automatyczne — workflow `.github/workflows/pages.yml` przy każdym
pushu pakuje katalog główny repo i publikuje go na Pages.

**Jednorazowa konfiguracja (wymaga właściciela repo):**

1. Wejdź w **Settings → Pages**.
2. W „Build and deployment" ustaw **Source: GitHub Actions**.
3. Zrób dowolny push (albo w Actions uruchom workflow ręcznie — „Run workflow").

Po tym strona jest pod `https://materio-app.com/`.

> **Dlaczego trzeba kliknąć ręcznie?** Token GitHub Actions w tym repo nie ma
> uprawnień, by samodzielnie *włączyć* Pages (zwraca „Resource not accessible by
> integration"). Po jednorazowym włączeniu źródła na „GitHub Actions" kolejne
> wdrożenia idą już automatycznie.

Workflow reaguje na push do gałęzi `main` oraz
`claude/cavemem-global-install-7z2q8u` (patrz `on: push: branches:` w `pages.yml`)
— jeśli pracujesz na innej gałęzi, dopisz ją tam.

## 5. Własna domena i zmiana adresu bazowego

**Stan aktualny:** stroną steruje własna domena **`materio-app.com`** — jej
adres bazowy jest wpisany na sztywno w kilku miejscach (canonical, Open Graph,
sitemap, dane strukturalne), a w korzeniu repo leży plik `CNAME`.

Poniższa instrukcja zostaje na wypadek **kolejnej** zmiany domeny — wtedy trzeba
podmienić adres bazowy wszędzie.

**Kroki dla nowej domeny (przykład `https://materio.pl`):**

1. Dodaj plik `CNAME` w katalogu głównym repo z samą domeną:
   ```
   materio.pl
   ```
2. Skonfiguruj DNS domeny zgodnie z instrukcją GitHub Pages (rekordy A/ALIAS lub
   CNAME na `3d-polednia.github.io`).
3. Podmień adres bazowy w plikach:
   - `index.html` — `<link rel="canonical">`, `og:url`, `twitter:*`, `og:image`,
     oraz trzy bloki `application/ld+json` (`url`, `image`, `logo`, `downloadUrl`
     zostaje bez zmian bo to link do Play).
   - `privacy-policy.html` — `canonical`, `og:url`, `og:image`.
   - `sitemap.xml` — oba `<loc>`.
   - `robots.txt` — linia `Sitemap:`.

   Szybko można to zrobić globalnym find-and-replace:
   `https://3d-polednia.github.io/materio-web` → `https://materio.pl`
   (uwaga: nowa domena w korzeniu nie ma podkatalogu `/materio-web`).

> Ścieżki do assetów są **względne** (`assets/...`), więc nie trzeba ich ruszać —
> działają zarówno w podkatalogu, jak i w korzeniu domeny.

## 6. Treści i tłumaczenia (i18n)

### Jak to działa

- Każdy element do tłumaczenia ma atrybut `data-i18n="klucz"` (albo
  `data-i18n-ph` dla `placeholder`).
- W HTML wpisana jest **polska** treść domyślna (dla SEO i braku „mignięcia").
- `assets/i18n.js` zawiera `LANGS` (lista języków) i `I18N` (słownik `kod → {klucz: tekst}`).
- Po załadowaniu `main.js` wykrywa język (`initialLang()` — z `localStorage` lub
  języka przeglądarki) i wywołuje `applyLang()`, które podmienia teksty wszystkich
  elementów z `data-i18n`. Brakujący klucz spada do angielskiego, potem polskiego,
  a na końcu pokazuje sam klucz (nigdy pusto).

### Edycja istniejącego tekstu

- Tekst z `data-i18n` zmieniaj **w `assets/i18n.js`** (dla wszystkich języków) —
  wartość z HTML i tak zostanie nadpisana przy starcie.
- Tekst **bez** `data-i18n` (np. sekcje „Jak to działa", „FAQ", „Sklepy") jest
  tylko po polsku — edytuj bezpośrednio w `index.html`.

### Języki

Obsługiwane: `pl, uk, de, en` — zestaw z rozdziału V Master Planu. Sześć języków
(`cs, sk, ro, hr, sr, ru`) zostało usuniętych 12.08.2026; ich katalogi kasuje
`clean()` w buildzie, a `404.html` przekierowuje stare adresy na stronę główną.
Lista `RETIRED_LANGS` w `src/site.mjs` trzyma ich kody.

Dodanie języka wymaga decyzji właściciela (plan mówi: wyłącznie te cztery). Gdyby
kiedyś doszedł kolejny, potrzebne są cztery rzeczy:

1. Kod w `LANGS` w `src/site.mjs` oraz wpis `{ code, label }` w `assets/i18n.js`.
2. Slugi sekcji, kalkulatorów i poradników w `src/site.mjs` (slug jest na zawsze).
3. Blok tłumaczeń w `assets/i18n.js`, `i18n-pages.js`, `i18n-materials.js`
   i `src/calc-meta.mjs` — build przerywa i wypisuje brakujące klucze.
4. Flaga jako `assets/flags/<kod>.svg` (nigdy emoji — rozdział V planu).

### Waluty

`assets/currency.js`: `PLN, EUR, USD, UAH`. Waluta jest **niezależna od języka**
(rozdział VI planu) — Deutsch + PLN to poprawne ustawienie. Wybór trzymany jest w
`localStorage` pod kluczem `liczmat-currency`; bez wyboru obowiązuje domyślna dla
języka (pl→PLN, uk→UAH, de→EUR, en→USD).

Nic nie jest przeliczane po kursie — offline'owy kalkulator nie ma skąd wziąć kursu,
a zmyślony kurs fałszowałby kosztorys. Zmiana waluty zmienia tylko to, w czym czytamy
i pokazujemy wpisane ceny. Jednostki fizyczne (m², kg, opakowania, płyty) nie zmieniają
się nigdy. Zapisana pozycja kosztorysu zachowuje `currencyCode` z chwili zapisu, więc po
zmianie waluty stara wycena nadal mówi prawdę; gdy pozycje mają różne waluty, strona
`/kosztorys/` pisze to wprost pod sumą.

## 7. Kalkulatory

- Kod: `assets/calculators.js`. Silniki są przeniesione 1:1 z aplikacji
  (`core/calculation/**`), liczą **wyłącznie w przeglądarce** — nic nie idzie na
  serwer.
- `buildCalculators()` renderuje karty do `#calc-grid`; zakładki (`.calc-tab`)
  przełącza `buildTabs()` w `main.js`.
- **Rozkrój 2D** (`ENGINES.sheet` + `tryPlaceGuillotine`) to port
  `GuillotinePackingEngine.kt`: wolne prostokąty, cięcie gilotynowe, dopasowanie
  best-area-fit, rzaz piły i obrót elementów o 90°. Strona liczy tę samą liczbę
  arkuszy co aplikacja.
- Kalkulator pomieszczeń to osobny, prostszy blok obsługiwany przez
  `buildRoomHelper()` (pola L×W×H → podłoga/ściany/obwód/kubatura).
- Formatowanie liczb i walut zależy od aktywnego języka (`Intl.NumberFormat`,
  mapa `CURRENCY`).

Dodanie nowego kalkulatora wymaga edycji `calculators.js` (definicja pól + wzór +
render) — to najbardziej „aplikacyjna" część strony.

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
node scripts/test-account.mjs        # poziomy, sesja, ?next=, cztery języki
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

## 9a. Konto i synchronizacja (/app/, /p/)

- `/app/` — logowanie e-mailem (Firebase Auth), lista projektów i pomieszczeń,
  tworzenie i usuwanie (tombstone), przycisk „Udostępnij".
- `/p/<token>` — kopia wyceny tylko do odczytu, bez logowania. GitHub Pages nie ma
  przepisywania adresów, więc `404.html` przekierowuje na `/p/?t=<token>`.
- Schemat dokumentów jest **wspólny z aplikacją Androida** — kontrakt opisuje
  `docs/FIRESTORE_SYNC.md` w repo `3d-polednia/LiczMat`, a po stronie Kotlina
  `core/sync/SyncContract.kt`. Zmiana w jednym miejscu wymaga zmiany we wszystkich.
- `assets/firebase-config.js` ma **dwa placeholdery** (`apiKey`, `appId`) do
  uzupełnienia z konsoli Firebase (Project settings → Web app → Config). Do tego
  czasu `/app/` pokazuje komunikat o braku konfiguracji zamiast zepsutego formularza.
  Klucz Web API Firebase **nie jest sekretem** — dane chronią reguły bezpieczeństwa
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

- Plik: `privacy-policy.html` (osobna podstrona — **wymóg Google Play**, który
  oczekuje publicznego URL polityki). Dwie wersje: **PL** (`#pl`) i **EN** (`#en`).
- Treść jest **zgodna z rzeczywistością aplikacji**: offline-first, dane lokalnie na
  urządzeniu, reklamy Google AdMob + zgoda UMP (RODO), Google Maps/Places +
  lokalizacja, a dla strony — embed Google Maps i zapytanie do OpenStreetMap/Overpass
  w sekcji „Sklepy".
- **Do uzupełnienia przez właściciela:** administrator danych i e-mail kontaktowy.
  Obecnie ustawione na `polednia@gmail.com` — podmień na adres firmowy, jeśli
  wolisz (szukaj `polednia@gmail.com` w pliku). URL polityki podaj też w Google
  Play Console.

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
Klucze `faq_q*` / `faq_a*` w `assets/i18n.js`, we wszystkich czterech językach;
które pytania trafiają na stronę główną, mówi `FAQ_KEYS` w `src/pages.mjs`. Widoczny
blok `<details>` i JSON-LD `FAQPage` powstają z tej samej listy.

**Zmiana kolorystyki:**
`assets/styles.css` → zmienne w `:root` (i odpowiedniki w bloku dark-mode).

**Podmiana ikony/banera:** patrz sekcja 11 (regeneracja rozmiarów).

---

*Ten plik utrzymuj razem ze zmianami w kodzie — gdy zmienia się zachowanie,
zaktualizuj odpowiednią sekcję.*
