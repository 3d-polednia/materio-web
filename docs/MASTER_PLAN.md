# LiczMat — Master Plan: status prac

**Plan w całości: [`MASTER_PLAN.txt`](MASTER_PLAN.txt)** — oryginał właściciela, słowo w słowo.
To jest jedyne źródło prawdy o zakresie. Ten plik nie powtarza jego treści, tylko notuje,
co już zrobione i co zostało otwarte.

Jeżeli plan się zmienia, zmienia się `MASTER_PLAN.txt`. Nie rób drugiej kopii treści —
dwie kopie zawsze się rozjeżdżają.

---

## Zasada, która łamie się najczęściej

> **JEDNO ZADANIE = JEDNA SESJA** (rozdział XXXV planu)

Wykonaj sesję, o którą poprosił właściciel. Zrób raport. **STOP.**

Nie przechodź do kolejnej sesji dlatego, że zauważyłeś coś do poprawy — wpisz to do
raportu i zatrzymaj się. Rozdział XXXIII mówi, co ma zawierać raport: WYKONANO,
ZMIENIONE PLIKI, TESTY, PROBLEMY, STATUS, NASTĘPNE ZADANIE (sama nazwa, bez wykonania).

---

## Postęp

| Sesja | Zakres | Status |
|---|---|---|
| 1 | Rebranding + nowy design | **Zrobione** — 2026-08-12, commit `2422c46` |
| 2 | Języki i waluty | **Zrobione** — 2026-08-12 |
| 3 | Architektura informacji | **Zrobione** — 2026-08-12 |
| 4 | Design system | **Zrobione** — 2026-08-12 |
| 5 | Globalny layout | **Następna** |
| 6–36 | patrz rozdział XXXII planu | Nie zaczęte |

### Co zrobiła Sesja 4

Sesja materiałowa: ustalenie tokenów i komponentów, bez przebudowy układu stron
(to Sesje 5–7). Pełny dokument: **[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)**.

- **Blok tokenów w `assets/styles.css`** — kolor (osobno dla obu motywów), typografia
  (7 stopni stałych + 3 płynne), spacing na siatce 4px, 5 zaokrągleń, 3 stopnie
  cienia, 4 czasy animacji, metryki kontrolek. Żadna reguła poniżej nie wpisuje już
  własnego koloru, zaokrąglenia ani czasu.
- **`src/tokens.mjs` — `validateTokens()` w buildzie.** Cztery sprawdzenia: token
  bez pary w drugim motywie, rozjechane dwie kopie palety ciemnej, `var()` bez
  definicji, literał tam, gdzie należy się token. Każde przetestowane negatywnie —
  arkusz celowo zepsuty, build faktycznie padł.
- **`scripts/check-contrast.mjs`** — 30 par tekst/tło i krawędź/tło w obu motywach.
  Trzy pary nie przechodziły AA i zostały naprawione: link na sekcji `.alt`
  i w stopce (`--accent-strong` przyciemniony do `#476c00`), oraz odwrócony przycisk
  w banerze aplikacji (miał ciemną zieleń na czerni, 3,71:1 — dostał limonkę).
  Teraz przechodzą wszystkie.
- **Komponenty scalone w jedną regułę na komponent**: karta (6 selektorów miało tę
  samą definicję), pole formularza (7 osobnych reguł, każda z innym tłem
  i innym rozmiarem tekstu), wiersz listy (3), chip/zakładka (3), plakietka Play (2).
- **Stany zdefiniowane raz**: hover, active, focus, disabled, wybrany, błędny.
  Wcześniej `:disabled` nie było wcale — wyłączony przycisk w `/app/` wyglądał jak
  włączony. Obwódka fokusu przestała prostować pigułki (`border-radius: 4px`
  w regule `:focus-visible`).
- **Pola formularza**: 44px wysokości, tekst 16px (poniżej 16px iOS Safari przybliża
  stronę przy kliknięciu w pole) i krawędź `--outline-control` trzymana na 3:1
  zamiast ledwie widocznego włosa.
- **Breakpointy: 7 → 4** (560 / 760 / 900 / 1160). Zmiany układu bez zmiany zasad.
- **Koniec ze stylami inline w HTML** — 24 atrybuty `style="…"` w `src/pages.mjs`,
  `src/app-pages.mjs`, `assets/calculators.js` i `404.html` zastąpiły klasy systemu.

Matematyka kalkulatorów nietknięta: w `assets/calculators.js` zmieniły się wyłącznie
dwa fragmenty HTML wyniku (styl inline → klasa).

### Co zrobiła Sesja 3

Sesja projektowa — ustalenie docelowej struktury, bez zmian funkcjonalnych. Żadna
z 130 wygenerowanych stron nie zmieniła się o bajt (`git diff` po przebudowie: puste).

- **[`ARCHITEKTURA.md`](ARCHITEKTURA.md)** — dokument architektury informacji: trzy
  poziomy dostępu, inwentarz wszystkich stron, zasady routingu, nawigacja, relacje
  między modułami, przepływy użytkownika dla `GOŚĆ → LICZMAT → LICZMAT PRO`.
- **`src/ia.mjs`** — ta sama architektura zapisana maszynowo. Każda trasa ma poziom
  dostępu (`GUEST` / `LICZMAT` / `PRO`), rodzica, status (`LIVE` / `PLANNED`) i pozycję
  w nawigacji. Realizuje zasadę z rozdziału II: „każdy element aplikacji powinien
  jednoznacznie wiedzieć, do którego poziomu dostępu należy" — poziom jest polem, nie
  komentarzem.
- **Siedem tras planowanych** z numerem sesji, która je zbuduje: `/liczmat-pro/` (29),
  pulpit (14), projekt (15), `/klienci/` (22), `/zlecenia/` (23), `/wyceny/` (24),
  `/terminarz/` (25). Slugi we wszystkich czterech językach ustalone z góry. Nic z tego
  nie jest budowane; build pilnuje, żeby nie zajęły działającego adresu ani menu.
- **Menu i stopka powstają teraz z `ROUTES`**, nie z listy wpisanej ręcznie
  w `src/template.mjs`. Wynikowy HTML identyczny co do bajtu — to był refaktor
  źródła prawdy, nie zmiana wyglądu.
- **Build sprawdza architekturę.** Zbiór wygenerowanych stron musi się zgadzać
  z `livePaths()`, a `validateIA()` pilnuje poziomów, drzewa, tras planowanych,
  nawigacji i przepływów. Jedenaście sprawdzeń, każde przetestowane negatywnie —
  celowo zepsute, build faktycznie padł. Szczegóły w `ARCHITEKTURA.md` §9.

Matematyka kalkulatorów nietknięta. `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 2

- **Cztery języki**: `pl, uk, de, en`. Sześć (`cs, sk, ro, hr, sr, ru`) usunięte ze
  słowników, mapy serwisu, wzorów kalkulatorów i z dysku. Slugi czterech pozostałych
  nietknięte — żaden adres, który działał, nie przestał działać.
- Stare adresy (`/cs/…`, `/ru/…`) przechwytuje `404.html` i kieruje na stronę główną.
  `RETIRED_LANGS` w `src/site.mjs` trzyma listę; `clean()` w buildzie kasuje katalogi.
- **Selektor języka z prawdziwymi flagami**: `assets/flags/<kod>.svg`, wstawiane inline
  przez build (`src/flags.mjs`). Bez emoji. Nazwa języka zawsze widoczna obok flagi.
  Każda pozycja to link do adresu tej wersji, więc działa bez JS i indeksuje się.
- **Waluty PLN / EUR / USD / UAH** w `assets/currency.js`, niezależne od języka.
  Wybór w `localStorage` (`liczmat-currency`), domyślna wynika z języka. Nic nie jest
  przeliczane po kursie, jednostki fizyczne nie zmieniają się nigdy. Pozycja kosztorysu
  zachowuje walutę z chwili zapisu; przy mieszanych walutach `/kosztorys/` mówi to wprost.
- SEO dla czterech języków: `canonical`, `hreflang` + `x-default`, `og:locale`,
  `sitemap.xml` — wszystko wypada z tej samej listy `LANGS`.
- Copy poprawione tam, gdzie mówiło „10 języków"; liczba języków na stronie głównej
  bierze się teraz z `LANGS.length`, a cena „0 zł" z wybranej waluty.

Matematyka kalkulatorów nietknięta.

### Co zrobiła Sesja 1

- Materio → LiczMat w słownikach 10 języków, metadanych, OG, manifeście, polityce
  prywatności i dokumentacji.
- Logo odtworzone jako wektor z grafiki właściciela → `assets/logo-mark.svg`; z niego
  wyrenderowane `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
  `assets/favicon.svg` ma wariant jasny/ciemny. Nagłówek i stopka osadzają znak inline,
  więc „M” dziedziczy `currentColor` i odwraca się z motywem.
- `og-image.jpg` i `banner.jpg` przegenerowane — miały starą nazwę wypaloną w obrazie.
- Nowy system kolorów w `assets/styles.css`: limonka `#91d206`, grafit `#060c12`,
  ciepła biel `#faf7f0`. Tokeny przemianowane z oliwkowych: `--olive` → `--accent`,
  `--accent-strong` to wariant czytelny. Wszystkie pary tekst/tło przechodzą WCAG AA
  w obu motywach.
- Przełącznik motywu w nagłówku, poza zwijanym menu mobilnym. Brak zapisu = motyw
  systemowy; skrypt inline w `<head>` ustawia wybór przed pierwszym malowaniem.

Matematyka kalkulatorów nietknięta — w `assets/calculators.js` zmienił się wyłącznie
komentarz nagłówka.

---

## Otwarte decyzje

Rozstrzygnąć, zanim dotknie ich któraś z kolejnych sesji.

### Poziom dostępu `/projekty/` i `/kosztorys/` — decyzja z Sesji 3

Rozdział II planu mówi, że gość **nie może** tworzyć projektów ani list materiałów.
Serwis dziś na to pozwala bez konta (`assets/workspace.js`, `localStorage`), a
`docs/FIRESTORE_SYNC.md` §1.2 zabrania przenoszenia liczenia za ścianę logowania.
Sesja 3 zachowała stan faktyczny (poziom `GUEST`) i **nie rozstrzygnęła sporu** — to
zmiana funkcjonalna, a sesja miała mandat wyłącznie projektowy.

Propozycja: zostawić `GUEST`, a rozdział II czytać jako granicę konta, nie granicę
przeglądarki — konto dokłada sync między urządzeniami, przetrwanie wyczyszczenia
przeglądarki i udostępnianie linkiem. Pełne uzasadnienie i alternatywa:
[`ARCHITEKTURA.md`](ARCHITEKTURA.md) §8.1. **Potrzebna decyzja właściciela.**

### Slogan

Grafika referencyjna pokazuje „POLICZ. ZAPLANUJ. ZREALIZUJ.” i nagłówek „Policz
materiały. Zaplanuj swoją pracę.” Serwis dalej ma „Policz. Kup. Nie marnuj.” — klucze
`hero_title` i `foot_tagline` w `assets/i18n.js`, w każdym z 4 języków. To copy strony
głównej, więc należy do Sesji 6, chyba że właściciel zdecyduje inaczej.

### Waluta a aplikacja Android

Strona pozwala wybrać walutę niezależnie od języka; aplikacja Android nadal bierze
walutę z języka (`AppLanguage.defaultCurrency`). Kosztorys zsynchronizowany z telefonu
może więc mieć inną walutę niż ta wybrana w przeglądarce — pozycja zachowuje własny
`currencyCode`, więc nic się nie fałszuje, ale docelowo aplikacja powinna pójść tą samą
drogą. Android jest poza zakresem prac nad webem (rozdział VII planu).

### Języki aplikacji Android

Aplikacja dalej ma 10 języków, serwis ma 4. FAQ na stronie mówi teraz o serwisie,
nie o aplikacji. Zrównanie wymaga zmian w repo `3d-polednia/Materio`.

### Domena

`materio-app.com` zostaje. Zmiana wymaga DNS-u i przekierowań; dotyka `BASE` w
`src/site.mjs`, pliku `CNAME`, `robots.txt`, `sitemap.xml` oraz `canonical` i `hreflang`
na ~230 stronach. Katalog repozytorium i remote też dalej nazywają się `materio-web`.

### Nazwy, które celowo zostały przy „materio”

Zmiana każdej z nich psuje coś realnego:

| Nazwa | Co się stanie po zmianie |
|---|---|
| `materio_consent` | odwiedzający traci zgodę na cookies, banner wraca |
| `materio-lang` | traci wybrany język |
| `materio-redirected` | ponowne przekierowanie językowe |
| `materio-workspace-v`, `materio-active-project`, `materio-account` | **traci zapisane projekty, pomieszczenia i kosztorysy** |
| `utm_source=materio_web` | rozcina historię w Google Analytics |
| `materio-502513` | identyfikator projektu Firebase — konta i sync przestają działać |
| `pl.materio.app` | pakiet Androida, poza zakresem prac nad webem |

Jeżeli kiedyś mają się zmienić, potrzebna jest **migracja** — odczyt starego klucza,
zapis pod nowym — a nie zwykłe przemianowanie.

### Układ ze wzorca

Grafika referencyjna zawiera wyszukiwarkę kalkulatorów, kafelki popularnych, mockup
pulpitu i selektor języka z flagami. Selektor z flagami zrobiła Sesja 2; reszta to
Sesje 5, 6 i 7. Sesja 1 wdrożyła sam system wizualny, bez przebudowy architektury
strony głównej.

### Drobny błąd zastany — naprawiony

W `/app/` przycisk „Pobierz” nie miał atrybutu `data-i18n` i zostawał po polsku przy
interfejsie w innym języku. Naprawione w Sesji 2 (`src/app-pages.mjs`) — to defekt
warstwy językowej, czyli dokładnie zakres tej sesji.

---

## Czego plan nie obejmuje, a warto wiedzieć

- **`docs/` nie jest publikowane.** `.github/workflows/pages.yml` usuwa `docs/`, `src/`,
  `scripts/`, `CLAUDE.md` i `README.md` z artefaktu przed wdrożeniem, więc plan produktu
  nie leży pod publicznym adresem. Nie przenoś go do korzenia repozytorium.
- **Architektura informacji:** [`ARCHITEKTURA.md`](ARCHITEKTURA.md) — strony, routing,
  nawigacja, poziomy dostępu, przepływy. Wersja maszynowa: `src/ia.mjs`.
- **Dokumentacja techniczna:** [`DOKUMENTACJA.md`](DOKUMENTACJA.md) — architektura,
  build, i18n, kalkulatory, SEO, assety.
- **Zasady pracy w repo:** `CLAUDE.md` w korzeniu — praca tylko na `main`, brak
  branchy `claude/*`, brak trailerów w commitach, build po każdej zmianie wejścia.
