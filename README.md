# materio-web

Strona (landing page) aplikacji **LiczMat** — offline-first kalkulator i
optymalizator materiałów budowlanych na Androida. *Policz. Kup. Nie marnuj.*

Aplikacja w Google Play: <https://play.google.com/store/apps/details?id=pl.materio.app>

> 📚 **Pełna dokumentacja:** [`docs/DOKUMENTACJA.md`](docs/DOKUMENTACJA.md) —
> architektura, wdrożenie, edycja treści, języki, wyszukiwarka sklepów, SEO i assety.

## Czym jest ten projekt

Szybka, statyczna strona bez frameworków (czysty HTML/CSS/JS w przeglądarce).
Strony generuje bezzależnościowy skrypt Node — patrz [Budowanie](#budowanie).

- **Minimum zewnętrznych zależności** — brak CDN i brak czcionek z sieci.
  Kalkulatory liczą w przeglądarce. Usługi zewnętrzne: **Google Analytics** (GA4
  z Consent Mode v2 — nic nie zapisuje, dopóki odwiedzający nie kliknie zgody
  w banerze) oraz sekcja „Sklepy": mapa **Google Maps** (embed) i lista sklepów
  z **OpenStreetMap (Overpass API)**, ładowane dopiero, gdy z niej korzystasz.
  Wyjątkiem są `/app/` i `/p/`, które ładują Firebase SDK z CDN Google.
- **Indeksowalna w 4 językach** (polski, українська, Deutsch, English) — każdy język ma
  własny adres (`/kalkulatory/…`, `/en/calculators/…`), treść jest zwykłym HTML-em,
  a `canonical` + `hreflang` wiążą wersje ze sobą. Przełącznik języka nawiguje,
  nie podmienia tekstu, i pokazuje flagę obok nazwy języka (nie emoji).
- **Waluta niezależna od języka** — PLN, EUR, USD, UAH. Wybór zapisuje się w
  przeglądarce i dotyczy cen, kosztów i kosztorysów. Nic nie jest przeliczane po
  kursie, a jednostki fizyczne kalkulatorów nie zmieniają się przy zmianie waluty.
- **Strona per kalkulator** — 15 kalkulatorów × 4 języki, każdy z własnym
  `title`/`description`/`schema.org` i sekcją „Jak to liczymy" (wzór, przykład
  policzony tym samym silnikiem, uwagi praktyczne).
- **Gotowa pod SEO** — canonical, hreflang, Open Graph + Twitter, dane strukturalne
  `MobileApplication` + `Organization` + `FAQPage` + `BreadcrumbList` + `ItemList`
  + `WebApplication` + `HowTo`, `sitemap.xml`, `robots.txt`, manifest PWA,
  obraz OG 1200×630.
- **Konto opcjonalne** — `/app/` to zalogowana przestrzeń (Firebase Auth +
  Firestore, ten sam schemat co apka na Androida), `/p/<token>` to udostępniona
  wycena tylko do odczytu. Obie są `noindex`. Liczenie nigdy nie wymaga konta.
- **Dostępna i responsywna** — znaczniki semantyczne, skip-link, widoczny focus,
  tryb jasny/ciemny (`prefers-color-scheme`).

## Budowanie

```bash
node scripts/build.mjs          # generuje 130 stron + sitemap.xml
node scripts/build.mjs --check  # tylko walidacja słowników i slugów
```

Bez `package.json` i bez `node_modules` — skrypt czyta te same `assets/i18n.js`
i `assets/calculators.js`, których używa przeglądarka. **Wynik jest commitowany**,
bo GitHub Pages serwuje katalog repo bez żadnego budowania po swojej stronie.
Nie edytuj wygenerowanych plików `.html` — kolejny build je nadpisze.

## Struktura

Pliki **pisane ręcznie**:

```
scripts/build.mjs       Generator stron (Node, bez zależności)
src/
  site.mjs              Mapa serwisu: języki i slugi sekcji, kalkulatorów, poradników
  template.mjs          Wspólny <head>, nagłówek, stopka, baner zgody, okruszki
  pages.mjs             Zawartość <main> każdego typu strony
  calc-meta.mjs         Wzory kalkulatorów i ich tłumaczenia
  app-pages.mjs         /app/ i /p/ (noindex)
assets/
  styles.css            System projektowy Olive Green Material 3
  i18n.js               Słownik 4 języków (wejście builda)
  i18n-pages.js         Słownik podstron, te same 4 języki (wejście builda)
  i18n-runtime.js       t(), przełącznik języka, tłumaczenie w miejscu dla /app/ i /p/
  currency.js           Waluta (PLN/EUR/USD/UAH), niezależna od języka
  flags/<lang>.svg      Flagi przy nazwach języków (bez emoji)
  calculators.js        Silniki liczące (1:1 z aplikacji) + podpięcie formularzy
  stores.js             Wyszukiwarka sklepów (mapa + lista z OpenStreetMap)
  main.js               Wiązanie strony (pomieszczenia, menu, karuzela, baner zgody)
  app.js                /app/ — Firebase Auth + synchronizacja Firestore
  share.js              /p/<token> — udostępniona wycena, tylko do odczytu
  firebase-config.js    Konfiguracja Firebase Web (uzupełnij placeholdery w środku)
  icon-192.png / icon-512.png / apple-touch-icon.png / favicon-32.png   Ikona z Google Play
  og-image.jpg          Podgląd społecznościowy 1200×630 (baner z Play)
  banner.jpg            Baner (grafika promocyjna)
privacy-policy.html · 404.html · robots.txt · site.webmanifest · .nojekyll
.github/workflows/pages.yml   Automatyczne wdrożenie na GitHub Pages
docs/DOKUMENTACJA.md    Pełna dokumentacja projektu
```

Pliki **generowane** (`node scripts/build.mjs`, nie edytuj ręcznie):

```
index.html · <lang>/index.html            Strona główna, 4 języki
kalkulatory/ · kalkulatory/<materiał>/    Hub + strona per kalkulator
poradniki/ · poradniki/<slug>/            Poradniki
sklepy/                                   Wyszukiwarka sklepów
<lang>/…                                  To samo dla pozostałych 3 języków
app/index.html · p/index.html             Konto i udostępniona wycena (noindex)
assets/i18n.<lang>.js · assets/i18n.all.js
sitemap.xml
```

## Uruchomienie lokalnie

Wystaw folder serwerem — potrzebne, bo strony linkują się adresami bezwzględnymi
(`/kalkulatory/…`), a geolokalizacja w wyszukiwarce sklepów wymaga origin:

```bash
node scripts/build.mjs        # jeśli zmieniałeś cokolwiek, co czyta build
python3 -m http.server 8080   # potem wejdź na http://localhost:8080
```

## Wdrożenie (GitHub Pages)

Workflow `.github/workflows/pages.yml` publikuje katalog główny repo przy każdym
pushu. Jednorazowa konfiguracja: **repo → Settings → Pages → Source: „GitHub
Actions"**. Strona rusza pod `https://liczmat.com/`.

Zmiana na własną domenę (np. `materio.pl`) i cała reszta — zobacz
[`docs/DOKUMENTACJA.md`](docs/DOKUMENTACJA.md).

## Licencja

Treści marketingowe i marka „LiczMat" © LiczMat. Kod strony jest wolny do użytku.
