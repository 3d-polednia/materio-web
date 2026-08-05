# materio-web

Strona (landing page) aplikacji **Materio** — offline-first kalkulator i
optymalizator materiałów budowlanych na Androida. *Policz. Kup. Nie marnuj.*

Aplikacja w Google Play: <https://play.google.com/store/apps/details?id=pl.materio.app>

> 📚 **Pełna dokumentacja:** [`docs/DOKUMENTACJA.md`](docs/DOKUMENTACJA.md) —
> architektura, wdrożenie, edycja treści, języki, wyszukiwarka sklepów, SEO i assety.

## Czym jest ten projekt

Szybka, statyczna strona bez frameworków i bez procesu budowania (czysty
HTML/CSS/JS):

- **Minimum zewnętrznych zależności** — brak CDN, brak czcionek z sieci, brak
  analityki i ciasteczek śledzących. Kalkulatory liczą w przeglądarce. Jedyne
  zewnętrzne usługi to sekcja „Sklepy": mapa **Google Maps** (embed) i lista
  sklepów z **OpenStreetMap (Overpass API)** — obie ładowane dopiero, gdy z niej korzystasz.
- **Indeksowalna** — polskie treści są w HTML (nie doklejane przez JS), więc
  wyszukiwarki widzą pełną zawartość. Przełącznik 10 języków to progressive
  enhancement na wierzchu.
- **Gotowa pod SEO** — canonical, Open Graph + Twitter, dane strukturalne
  `MobileApplication` + `Organization` + `FAQPage`, `sitemap.xml`, `robots.txt`,
  manifest PWA, obraz OG 1200×630.
- **Dostępna i responsywna** — znaczniki semantyczne, skip-link, widoczny focus,
  tryb jasny/ciemny (`prefers-color-scheme`).

## Struktura

```
index.html              Strona główna (hero, funkcje, jak to działa, kalkulatory
                        na żywo, pomieszczenia, projekty, sklepy, zaufanie, FAQ, CTA)
privacy-policy.html     Pełna polityka prywatności (PL + EN)
404.html                Strona „nie znaleziono"
assets/
  styles.css            System projektowy Olive Green Material 3
  i18n.js               Słownik 10 języków + przełącznik
  calculators.js        Silniki liczące (1:1 z aplikacji), czysty JS
  stores.js             Wyszukiwarka sklepów (mapa + lista z OpenStreetMap)
  main.js               Spójne wiązanie strony (przełącznik, zakładki, pomieszczenia, menu)
  icon-192.png / icon-512.png / apple-touch-icon.png / favicon-32.png   Ikona z Google Play
  og-image.jpg          Podgląd społecznościowy 1200×630 (baner z Play)
  banner.jpg            Baner (grafika promocyjna)
robots.txt · sitemap.xml · site.webmanifest · .nojekyll
.github/workflows/pages.yml   Automatyczne wdrożenie na GitHub Pages
docs/DOKUMENTACJA.md    Pełna dokumentacja projektu
```

## Uruchomienie lokalnie

To zwykłe pliki statyczne. Otwórz `index.html` albo wystaw folder serwerem
(potrzebne, by działała geolokalizacja w wyszukiwarce sklepów):

```bash
python3 -m http.server 8080   # potem wejdź na http://localhost:8080
```

## Wdrożenie (GitHub Pages)

Workflow `.github/workflows/pages.yml` publikuje katalog główny repo przy każdym
pushu. Jednorazowa konfiguracja: **repo → Settings → Pages → Source: „GitHub
Actions"**. Strona rusza pod `https://materio-app.com/`.

Zmiana na własną domenę (np. `materio.pl`) i cała reszta — zobacz
[`docs/DOKUMENTACJA.md`](docs/DOKUMENTACJA.md).

## Licencja

Treści marketingowe i marka „Materio" © Materio. Kod strony jest wolny do użytku.
