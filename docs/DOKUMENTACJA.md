# Dokumentacja — materio-web

Dokumentacja techniczna strony aplikacji **Materio**. Opisuje architekturę,
sposób uruchomienia i wdrożenia, edycję treści i języków, działanie wyszukiwarki
sklepów, SEO oraz zarządzanie assetami.

- **Repozytorium:** `3d-polednia/materio-web`
- **Adres docelowy:** `https://materio-app.com/`
- **Aplikacja:** `pl.materio.app` (Google Play), Android 7.0+ (API 24), 10 języków

---

## Spis treści

1. [Filozofia i założenia](#1-filozofia-i-założenia)
2. [Struktura plików](#2-struktura-plików)
3. [Uruchomienie lokalnie](#3-uruchomienie-lokalnie)
4. [Wdrożenie na GitHub Pages](#4-wdrożenie-na-github-pages)
5. [Własna domena i zmiana adresu bazowego](#5-własna-domena-i-zmiana-adresu-bazowego)
6. [Treści i tłumaczenia (i18n)](#6-treści-i-tłumaczenia-i18n)
7. [Kalkulatory](#7-kalkulatory)
8. [Wyszukiwarka sklepów](#8-wyszukiwarka-sklepów)
9. [SEO](#9-seo)
10. [System projektowy (CSS)](#10-system-projektowy-css)
11. [Assety: ikona, baner, OG, favicon](#11-assety-ikona-baner-og-favicon)
12. [Polityka prywatności](#12-polityka-prywatności)
13. [Częste zadania utrzymaniowe (przepisy)](#13-częste-zadania-utrzymaniowe-przepisy)

---

## 1. Filozofia i założenia

- **Statyczna strona bez procesu budowania.** Czysty HTML/CSS/JS. Nie ma
  `npm run build`, bundlera ani frameworka. Pliki, które widzisz w repo, to pliki,
  które trafiają na serwer.
- **Prawda ponad marketing.** Aplikacja w wydaniu produkcyjnym zawiera reklamy
  (Google AdMob) oraz mapy/lokalizację (Google Maps/Places). Strona **nie**
  twierdzi, że jest „bez reklam". Zamiast tego uczciwie komunikuje realne atuty:
  liczenie offline na urządzeniu, brak konta, dane zostają u użytkownika, zgodność
  z RODO. Zmieniając treści, trzymaj się tej zasady.
- **Minimum zewnętrznych zapytań.** Strona nie ładuje czcionek z sieci, analityki
  ani ciasteczek śledzących. Jedyne wyjątki (i tylko na żądanie użytkownika, w
  sekcji „Sklepy"): embed Google Maps oraz zapytanie do OpenStreetMap/Overpass.
- **Treść indeksowalna.** Polskie teksty są zapisane wprost w HTML. JavaScript
  jedynie *podmienia* je przy zmianie języka (progressive enhancement). Dzięki temu
  strona ma sens także bez JS i jest dobrze widziana przez wyszukiwarki.

## 2. Struktura plików

```
index.html              Strona główna (jedna strona, sekcje po kotwicach)
privacy-policy.html      Polityka prywatności (PL + EN) — osobna podstrona (wymóg Google Play)
404.html                 Strona błędu 404
site.webmanifest         Manifest PWA (nazwa, ikony, kolory)
robots.txt               Reguły dla robotów + odnośnik do sitemap
sitemap.xml              Mapa strony (index + polityka prywatności)
.nojekyll                Wyłącza przetwarzanie Jekyll na GitHub Pages
assets/
  styles.css             System projektowy Olive Green Material 3 + wszystkie komponenty
  i18n.js                Słownik 10 języków (LANGS, I18N) + applyLang()/initialLang()
  calculators.js         Silniki liczące + budowa UI kalkulatorów (buildCalculators)
  stores.js              Wyszukiwarka sklepów (buildStoreFinder): mapa + lista OSM
  main.js                Spójne wiązanie strony (język, zakładki, pomieszczenia, menu mobilne)
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

### Dodanie nowego języka

1. Dopisz wpis do `LANGS` w `i18n.js`: `{ code: "xx", label: "Nazwa" }`.
2. Dodaj obiekt `xx: { ... }` do `I18N` z tłumaczeniami wszystkich kluczy
   (najprościej skopiować blok `en` i przetłumaczyć).
3. Gotowe — przełącznik języka w nagłówku podchwyci nowy język automatycznie.

Obsługiwane obecnie: `pl, en, de, cs, sk, ro, hr, sr, uk, ru` (10 — tyle, ile
aplikacja). Waluty i formaty liczb per język definiuje `CURRENCY` w
`calculators.js`.

## 7. Kalkulatory

- Kod: `assets/calculators.js`. Silniki są przeniesione 1:1 z aplikacji
  (`core/calculation/**`), liczą **wyłącznie w przeglądarce** — nic nie idzie na
  serwer.
- `buildCalculators()` renderuje karty do `#calc-grid`; zakładki (`.calc-tab`)
  przełącza `buildTabs()` w `main.js`.
- Kalkulator pomieszczeń to osobny, prostszy blok obsługiwany przez
  `buildRoomHelper()` (pola L×W×H → podłoga/ściany/obwód/kubatura).
- Formatowanie liczb i walut zależy od aktywnego języka (`Intl.NumberFormat`,
  mapa `CURRENCY`).

Dodanie nowego kalkulatora wymaga edycji `calculators.js` (definicja pól + wzór +
render) — to najbardziej „aplikacyjna" część strony.

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

Co jest już zrobione (`index.html`, jeśli nie zaznaczono inaczej):

- **Meta:** `title`, `description`, `robots`, `canonical`, `theme-color`
  (jasny/ciemny), `application-name`.
- **Treść indeksowalna:** polskie teksty w HTML (nie renderowane przez JS).
- **Open Graph + Twitter Card:** tytuł, opis, `og:image` = `assets/og-image.jpg`
  (1200×630), lokalizacja `pl_PL`.
- **Dane strukturalne (JSON-LD):** `MobileApplication` (darmowa, Android 7+, 10
  języków, cena 0), `Organization`, `FAQPage` (spójne z sekcją FAQ).
- **Techniczne:** `sitemap.xml`, `robots.txt`, manifest PWA, `404.html`,
  brak zewnętrznych zapytań na starcie (szybkość).

Przy zmianie treści FAQ pamiętaj, by zaktualizować **oba** miejsca — widoczny blok
`<details>` w `index.html` **oraz** blok `FAQPage` w JSON-LD (muszą się zgadzać).

Sprawdzenie po wdrożeniu: [Google Rich Results Test](https://search.google.com/test/rich-results),
[PageSpeed Insights](https://pagespeed.web.dev/), podgląd OG:
[opengraph.xyz](https://www.opengraph.xyz/). Po starcie warto dodać stronę do
Google Search Console i zgłosić `sitemap.xml`.

## 10. System projektowy (CSS)

- Wszystko w `assets/styles.css`. Paleta „Olive Green Material 3" jako zmienne CSS
  w `:root`, z osobnym zestawem dla trybu ciemnego (`@media (prefers-color-scheme: dark)`).
- Kluczowe tokeny: `--olive`, `--olive-dark`, `--bg`, `--surface`, `--on-bg`,
  `--muted`, `--outline`, `--radius`, `--shadow`. Zmiana marki = zmiana kilku
  zmiennych na górze pliku.
- Font: systemowy stack (`--font`) — bez pobierania czcionek z sieci (szybkość +
  prywatność).
- Komponenty: nagłówek/nav, hero + „telefon", pasek statystyk, karty funkcji,
  kroki, kalkulatory, lista sklepów (`.store-list`, `.store-item`), sekcja
  zaufania, FAQ (`<details>`), CTA, stopka, strona dokumentu (`.doc`) dla polityki.

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

**Zmiana wersji aplikacji w danych strukturalnych:**
`index.html` → JSON-LD `MobileApplication` → `"softwareVersion"`.

**Aktualizacja tekstu FAQ:**
Zmień w `index.html` blok `<details>` **oraz** odpowiedni wpis w JSON-LD `FAQPage`.

**Zmiana kolorystyki:**
`assets/styles.css` → zmienne w `:root` (i odpowiedniki w bloku dark-mode).

**Podmiana ikony/banera:** patrz sekcja 11 (regeneracja rozmiarów).

---

*Ten plik utrzymuj razem ze zmianami w kodzie — gdy zmienia się zachowanie,
zaktualizuj odpowiednią sekcję.*
