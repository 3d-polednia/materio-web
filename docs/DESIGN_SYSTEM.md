# LiczMat — system projektowy

Wynik **Sesji 4** planu (`MASTER_PLAN.txt`, rozdział XXXII: „DESIGN SYSTEM — ustalenie
typografii, spacingu, przycisków, kart, formularzy, kolorów, stanów, komponentów,
responsywności, obu motywów”).

Wersja maszynowa leży w **`assets/styles.css`** — blok tokenów na górze pliku i reguły,
które te tokeny wydają. Ten dokument mówi **dlaczego i kiedy**, arkusz mówi **ile**.
Gdy się rozjadą, prawdą jest arkusz.

Zasada, na której stoi całość:

> **Żadna reguła poza blokiem tokenów nie wymyśla własnego koloru, rozmiaru,
> zaokrąglenia, cienia ani czasu animacji.**

Nie jest to prośba. `validateTokens()` w `src/tokens.mjs` czyta arkusz podczas builda
i **przerywa go**, gdy ktoś wpisze `#ff00ff`, `border-radius: 11px` albo
`transition: … 250ms` w regule, która powinna sięgnąć po token (§9).

Wymagania planu, które ten system realizuje: rozdział IV (dwa motywy, ciepła kremowa
biel i grafit), XXVII (nowocześnie, prosto, profesjonalnie, lekko, funkcjonalnie; bez
przesadnych gradientów, nadmiaru animacji, ogromnych kart i marketingowego krzyku),
XXVIII (mobile-first), XXX (dostępność).

---

## 1. Kolor

Tokeny są **rolami**, nie nazwami barw. Komponent prosi o „kolor drugorzędnego tekstu”
(`--muted`), nigdy o „szary”. Dlatego jedna reguła obsługuje oba motywy.

### Marka i akcent

| Token | Jasny | Ciemny | Do czego |
|---|---|---|---|
| `--brand-lime` | `#91d206` | `#91d206` | limonka ze znaku. **Ta sama w obu motywach** — to logo, nie powierzchnia |
| `--accent` | `#91d206` | `#91d206` | wypełnienia: przycisk główny, wskaźniki, `.chip.on` |
| `--on-accent` | `#0d1117` | `#0a0f04` | jedyny kolor tekstu, jaki wolno położyć na `--accent` |
| `--accent-strong` | `#476c00` | `#a8e626` | **tekst, linki, ikony.** To nie jest kolor wypełnienia — limonka na kremie ma 1,7:1 |
| `--accent-edge` | `#476c00` | `#91d206` | krawędź przycisku głównego (§2, WCAG 1.4.11) |
| `--accent-soft` / `--on-accent-soft` | `#e8f5c8` / `#2b4000` | `#1c2c06` / `#cbee85` | pole wyniku, wskazówka w poradniku, wybrany materiał |
| `--accent-soft-2` | `#dcedbb` | `#22330b` | hover chipa |
| `--tertiary` / `--tertiary-container` | `#2c6a5e` / `#d3ebe4` | `#7fd0c0` / `#113a33` | druga rodzina ikon: aplikacja, prywatność, kafelek kalkulatora |

### Powierzchnie i tekst

| Token | Jasny | Ciemny | Do czego |
|---|---|---|---|
| `--bg` | `#faf7f0` | `#060c12` | tło strony — ciepła kremowa biel / grafit z grafiki referencyjnej |
| `--surface` | `#ffffff` | `#0c131a` | karta, dialog, wiersz listy |
| `--surface-alt` | `#f3efe5` | `#111a22` | sekcja `.alt`, hover, tło pomocnicze |
| `--surface-container` | `#eee9dd` | `#0e1720` | stopka, blok wzoru, kafelek `.plain-list` |
| `--on-bg` / `--on-surface` | `#14181c` | `#e9edf0` | tekst podstawowy |
| `--muted` | `#5c6570` | `#a4abb3` | tekst drugorzędny; nigdy dla treści, bez której strona traci sens |
| `--outline` | `#e0dacd` | `#202932` | włos oddzielający rzeczy, które i tak widać |
| `--outline-strong` | `#cbc4b4` | `#2d3236` | mocniejsza krawędź (hover przycisku pobocznego) |
| `--outline-control` | `#8b8577` | `#5a636d` | **krawędź pola formularza** — jedyne, co mówi, gdzie kliknąć, więc trzymana na 3:1 |
| `--field-bg` | `#fbf9f4` | `#080f16` | wnętrze pola: zawsze o krok „głębiej” niż pojemnik |
| `--overlay` | `rgba(20,24,28,.45)` | `rgba(0,0,0,.62)` | tło pod dialogiem |

### Stany

Cztery rodziny, każda w komplecie „kolor tekstu + tło + kolor na tym tle”:

| Rodzina | Token tekstu | Kontener | Tekst na kontenerze |
|---|---|---|---|
| błąd | `--error` | `--error-soft` | `--on-error-soft` |
| sukces | `--success` | `--success-soft` | `--on-success-soft` |
| ostrzeżenie | `--warning` | `--warning-soft` | `--on-warning-soft` |
| akcent (wynik) | `--accent-strong` | `--accent-soft` | `--on-accent-soft` |

Kolor nigdy nie jest jedynym nośnikiem informacji — błędne pole ma czerwoną krawędź
**i** komunikat pod formularzem, `.chip.warn` ma tekst, nie samą barwę.

### Kontrast

`node scripts/check-contrast.mjs` mierzy każdą parę w obu motywach i kończy się
kodem 1, jeśli któraś nie trafia w próg (4,5:1 dla tekstu, 3:1 dla krawędzi pola,
obwódki fokusu i krawędzi przycisku — WCAG 1.4.11). Stan na koniec Sesji 4:
**30 par × 2 motywy, wszystkie przechodzą**, najsłabsze to `--outline-control`
na `--surface` w trybie ciemnym (3,06:1) i `--muted` na `--surface-container`
w jasnym (4,88:1).

---

## 2. Typografia

Font: systemowy stos (`--font`). Żadnego pobierania kroju z sieci — to koszt
wczytania i wyciek do cudzego serwera przy każdej wizycie.

| Token | Wartość | Do czego |
|---|---|---|
| `--fs-xs` | `.78rem` | etykiety wersalikami, `.eyebrow`, nagłówki tabeli, stopki drobnym |
| `--fs-sm` | `.875rem` | tekst drugorzędny, opisy, nawigacja, chipy |
| `--fs-base` | `1rem` | tekst podstawowy **i każde pole formularza** |
| `--fs-md` | `1.125rem` | lead, duży przycisk, suma kosztorysu |
| `--fs-lg` | `1.25rem` | nazwa marki, `.share-total b` |
| `--fs-xl` | `1.5rem` | znak „+” w FAQ |
| `--fs-2xl` | `1.75rem` | liczba wyniku (`.result .big`) |
| `--fs-h3` | `1.2rem` | `h3`, nagłówek karty |
| `--fs-h2` | `clamp(1.6rem, 1.15rem + 2.2vw, 2.4rem)` | `h2` |
| `--fs-h1` | `clamp(1.8rem, 1.35rem + 2.4vw, 2.6rem)` | `h1` |
| `--fs-display` | `clamp(2.1rem, 1.3rem + 4vw, 3.6rem)` | wyłącznie hero strony głównej |

Trzy stopnie nagłówków są płynne (`clamp`), więc nagłówek zmniejsza się sam i nie
potrzebuje osobnego breakpointu.

Reguły, których nie łamiemy:

- **Tekst zdania nigdy nie schodzi poniżej `--fs-sm`.** `--fs-xs` jest dla etykiet
  wersalikami, nie dla treści.
- **Pole formularza ma `--fs-base` (16px).** Poniżej 16px iOS Safari przybliża stronę
  w momencie kliknięcia w pole i użytkownik zostaje z przesuniętym widokiem.
- Wysokości linii: `--lh-tight` 1,15 (nagłówki), `--lh-snug` 1,35 (jednowierszowe
  kontrolki, baner zgody), `--lh-base` 1,6 (tekst).
- Grubości: `--fw-medium` 500, `--fw-semi` 600, `--fw-bold` 700, `--fw-black` 800.
  Nie używamy wartości pośrednich (650, 750) — systemowy krój i tak je zaokrągla,
  więc na jednym systemie wychodzi 700, a na innym 800.
- Odstępy liter: `--track-tight` −0,02em (nagłówki), `--track-wide` 0,08em
  i `--track-wider` 0,1em (tylko wersaliki).

---

## 3. Spacing

Siatka **4px**. Liczba w nazwie to wartość w ćwiartkach: `--sp-3` to 12px,
`--sp-6` to 24px.

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 · `--sp-6` 24 ·
`--sp-7` 28 · `--sp-8` 32 · `--sp-10` 40 · `--sp-12` 48 · `--sp-16` 64

Do tego trzy wartości układu strony:

| Token | Wartość | Znaczenie |
|---|---|---|
| `--maxw` | `1160px` | szerokość treści (`.wrap`) |
| `--gutter` | `--sp-5`, poniżej 560px `--sp-4` | margines boczny |
| `--header-h` | `64px` | wysokość paska nagłówka: wiersz `.nav`, górna krawędź szuflady mobilnej i `scroll-padding-top` dla kotwic |
| `--section-y` | `clamp(48px, 6vw, 68px)` | pion sekcji `.block` |

Odstęp spoza skali jest błędem, nie decyzją — dlatego w generowanym HTML nie ma już
`style="margin-top:24px"`. Zostały narzędzia odstępu (`.mt-3`, `.mt-4`, `.mt-6`,
`.mt-8`, `.pt-2`) i one też biorą wartości ze skali.

---

## 4. Zaokrąglenia, cień, ruch

| Token | Wartość | Gdzie |
|---|---|---|
| `--radius-xs` | 8px | pole formularza, mały kafelek ikony, wiersz w dialogu |
| `--radius-sm` | 12px | chip nieokrągły, wiersz listy, pole wyniku, karta konta |
| `--radius` | 16px | karta, dialog, mapa, panel |
| `--radius-lg` | 22px | duży baner aplikacji, zrzut ekranu |
| `--radius-pill` | 999px | przyciski, chipy, selektory, wskaźniki |

Cień ma **trzy stopnie**, nie dziesięć: `--shadow-1` odrywa wiersz od tła,
`--shadow-2` to spoczynkowa karta, `--shadow-3` znaczy „unosi się nad stroną”
(menu, dialog, hover karty). Nie ma cienia „na ozdobę”: cień = wysokość.

Ruch: `--dur-fast` 100ms (wciśnięcie), `--dur` 180ms (kolor, obramowanie),
`--dur-slow` 320ms (rozwinięcie), `--dur-carousel` 800ms (karuzela zrzutów — treść
sama z siebie, nie odpowiedź na kliknięcie). Jedna krzywa: `--ease`.
`prefers-reduced-motion: reduce` wyłącza wszystko — to jedyne miejsce w arkuszu
z `!important` przy czasie.

---

## 5. Komponenty

Każdy komponent to jedna reguła; różnią się wariantem, nie kopią kodu.

### Przycisk `.btn`

Jeden kształt (pigułka), trzy intencje, trzy rozmiary.

| Klasa | Znaczenie |
|---|---|
| `.btn-primary` | główna akcja ekranu — limonka + `--accent-edge` |
| `.btn-ghost` | akcja poboczna — przezroczysty, obramowany |
| `.btn-danger` | akcja nieodwracalna (usunięcie konta) |
| `.btn-sm` / `.btn-lg` | 36px / 52px wysokości |
| `.btn-block` | przycisk zajmuje całą szerokość |

Wysokość bierze się z `--control-h` (44px), więc przycisk i pole obok siebie
stoją równo. Stany: `:hover` podnosi cień, `:active` wciska o 1px,
`:focus-visible` daje obwódkę, `:disabled` przygasza do 50% i wyłącza wciśnięcie.

### Chip i zakładka `.chip`, `.calc-tab`, `.app-tab`

Ten sam obiekt w trzech rolach: filtr, skrót, zakładka. `.chip.on`
i `[aria-selected="true"]` to stan wybrany (limonka). `.chip.warn` zgłasza problem
(rodzina `--error`).

Chip bywa `<button>` (presety kalkulatora) albo `<a>` (kategorie na `/kalkulatory/`,
które bez skryptu są zwykłymi kotwicami). Wariant linkowy `a.chip` tylko zdejmuje
podkreślenie i ustawia `display: inline-flex` — kolor, kształt i stany są wspólne.

### Centrum kalkulatorów (Sesja 7)

`.calc-filter` to pasek nad listą: pole `.mat-search` w `.calc-search`, rząd chipów
`.calc-cats` i licznik `.calc-shown`. Grupy to `.calc-group-block` — nagłówek
`.calc-group` (wersaliki, `--muted`) i jedna linijka `.calc-group-d`.

`.calc-links` jest teraz `<ul>`: każda karta siedzi w `<li>`, żeby filtr miał co ukrywać
poza samym linkiem. Siatka i wygląd karty `.calc-link` bez zmian.

### Karta

`.card`, `.calc`, `.step`, `.trust-panel`, `.app-card`, `.ws-estimate` to **jedna
reguła**: `--surface`, obramowanie `--outline`, `--radius`, `--shadow-2`. Różnią się
paddingiem i zawartością. Tylko `.card` unosi się przy najechaniu, bo tylko `.card`
bywa linkiem. `.app-card.danger` to wariant dla operacji nieodwracalnej.

### Pole formularza

Wszystkie pola serwisu — kalkulator, wyszukiwarka sklepów, dialog materiałów, pasek
pomieszczeń, edycja pozycji kosztorysu, formularz logowania — to jedna reguła:
44px wysokości, tekst 16px, tło `--field-bg`, krawędź `--outline-control`,
`--radius-xs`. Stany: `:hover` przyciemnia krawędź, `:focus-visible` daje obwódkę
i limonkową krawędź, `[aria-invalid="true"]` czerwoną, `:disabled` przygasza.

### Komunikat `.result`

Jedno pudełko na „oto wynik” i „nie wyszło”: wynik kalkulatora oraz pasek stanu
w `/app/`. Wariant `.err` to rodzina `--error`. `.tip` to spokojniejsza wersja
w treści poradnika.

### Nagłówek `header.site` (Sesja 5)

Jeden pasek na całym serwisie — także w `/app/` i `/p/`, które przed Sesją 5 miały
własną kopię. Kolejność w kodzie jest kolejnością na ekranie: znak, nawigacja,
selektory, przycisk konta, przełącznik motywu, przycisk menu.

- Wysokość: `--header-h` (64px). Ten sam token wyznacza `scroll-padding-top` dla
  kotwic i górną krawędź szuflady — jedna liczba, trzy zastosowania.
- **Maksymalnie cztery linki** w nawigacji; pilnuje tego `validateIA()`. Zmierzone:
  sześć linków plus selektory rozbijało wiersz na dwie linie poniżej 1080px
  (najgorszy przypadek: niemiecki). Przy czterech najciaśniejszy układ desktopowy
  (901px, ukraiński) ma jeszcze 41px zapasu.
- Przełącznik motywu i przycisk menu stoją **poza** zwijaną częścią, więc motyw
  zmienia się bez otwierania menu.
- Strona bieżąca: `aria-current="page"` + tło `--accent-soft` i limonkowa kreska
  `--accent-edge` pod spodem (samo tło byłoby wskazaniem wyłącznie kolorem).

### Nawigacja mobilna `.nav-links.open` (Sesja 5)

Poniżej 900px nawigacja to szuflada pod nagłówkiem, zachowująca się jak nakładka:

- przyciemnienie strony (`.nav-scrim`, `--overlay`) — kliknięcie zamyka,
- `body.nav-open { overflow: hidden }` — pod szufladą nic się nie przewija,
- szuflada wyższa niż ekran przewija się sama
  (`max-height: calc(100dvh - var(--header-h))`, `overscroll-behavior: contain`),
- Escape zamyka i wraca fokusem na przycisk; otwarcie przenosi fokus do środka,
- ikona przycisku zmienia się z „hamburgera” na krzyżyk (`aria-expanded`),
- `.nav-scrim` leży **poza** `<header>`: `backdrop-filter` nagłówka czyni z niego blok
  zawierający dla `position: fixed`, więc w środku przyciemnienie miałoby wysokość
  paska.

Cały ten mechanizm zależy od skryptu, dlatego skrypt w `<head>` dopisuje klasę `js`
do `<html>`, a szuflada chowa się tylko w regułach z `.js`. Bez JavaScriptu nawigacja
zostaje na stronie (drugi wiersz nagłówka) zamiast chować się za martwym przyciskiem.

### Stopka `footer.site` (Sesja 5)

Cztery kolumny (znak + tagline, Produkt, Konto, Prawne) generowane z `ROUTES`
(`footer: { order, key, group }`), pod nimi rząd języków — te same adresy co
w selektorze, ale jako zwykłe linki: działają bez skryptu i robot je przechodzi.
`/app/` i `/p/` używają wariantu `minimal`: sam dolny wiersz.

### Pozostałe

Wiersz listy (`.data-list li`, `.store-item`, `.mat-page-list li` — jedna reguła),
tabela kosztorysu (`.ws-table`, liczby `tabular-nums`), dialog materiałów
(`.mat-dialog` + `::backdrop` z `--overlay`), FAQ na `<details>`, blok wzoru
(`pre.formula`, zawija zamiast przewijać w bok), plakietka Google Play
(`.gp-badge` — czerń Google, celowo poza motywem), baner zgody.

Jedna nowa użytkówka: **`.js-only`** — kontrolka, która bez skryptu nie ma co robić
(dziś tylko pole wyszukiwania na `/kalkulatory/`). Domyślnie `display: none`, pokazuje
ją dopiero `.js` na `<html>`. Zasada z Sesji 5 zostaje w mocy: treść i nawigacja mają
działać bez JS, więc `.js-only` wolno objąć wyłącznie to, co bez JS byłoby martwe.

---

## 6. Stany

Sześć stanów, wszędzie tak samo:

| Stan | Jak wygląda | Gdzie zdefiniowany |
|---|---|---|
| hover | tło o stopień mocniejsze albo wyższy cień | przy komponencie |
| active | `translateY(1px)` | `.btn` |
| focus | obwódka `--focus` 2px, offset 2px | **jedna reguła** `:focus-visible` |
| disabled | `opacity: .5`, `cursor: not-allowed`, bez cienia | **jedna reguła** `:disabled, [aria-disabled="true"]` |
| wybrany | wypełnienie `--accent` + `--on-accent` | `.chip.on`, `[aria-selected="true"]` |
| błędny | krawędź i obwódka `--error` | `[aria-invalid="true"]` |
| bieżący | tło `--accent-soft` + kreska `--accent-edge` pod spodem | `[aria-current="page"]` w nawigacji |

Obwódka fokusu **nie zmienia** `border-radius` elementu. Wcześniej zmieniała
(`border-radius: 4px` w regule `:focus-visible`), przez co każdy przycisk-pigułka
w chwili kliknięcia z klawiatury robił się prostokątny.

---

## 7. Responsywność

Mobile-first (rozdział XXVIII). **Cztery szerokości, ani jednej więcej:**

| Punkt | Co się zmienia |
|---|---|
| 560px | siatki schodzą do jednej kolumny, wiersz sklepu się rozkłada, `--gutter` → 16px |
| 760px | zrzuty aplikacji i wiersze katalogu w jednej kolumnie |
| 900px | układ desktopowy: hero, kalkulator + „jak liczymy”, stopka, **nawigacja staje się szufladą** |
| 1160px | `--maxw`, szerokość treści; pasek nagłówka ściska odstępy, żeby zmieścić się w jednym wierszu |

Przed Sesją 4 breakpointów było siedem (420, 520, 560, 640, 760, 860, 900) — każdy
dodany przy okazji jednego komponentu, żaden nieuzgodniony z resztą.

Cel dotykowy ma **44px** (`--control-h`) także na desktopie: drugi zestaw rozmiarów
„dla myszy” to drugi projekt do utrzymania. Wyjątkiem są kontrolki w pasku nagłówka
(`--control-h-sm`, 36px), gdzie 44px rozsadziłoby wiersz o wysokości 64px.

---

## 8. Dwa motywy

Rozdział IV planu: jasny i ciemny mają wyglądać jak **ten sam produkt**. Dlatego
motyw zmienia wyłącznie to, na co rozwiązują się tokeny koloru — struktura, odstępy,
typografia i kształty są wspólne.

Rozstrzyganie motywu ma trzy stany:

1. `:root` bez niczego — motyw jasny, jednocześnie fallback;
2. `@media (prefers-color-scheme: dark)` + `:root:not([data-theme="light"])` —
   odwiedzający, który nigdy nie wybierał, idzie za systemem;
3. `:root[data-theme="dark"]` — odwiedzający, który kliknął przełącznik; atrybut
   wpisuje skrypt w `<head>` **przed pierwszym malowaniem**, więc nie ma mignięcia.

Paleta ciemna jest z tego powodu zapisana **dwa razy** — media query nie da się
połączyć z listą selektorów, więc w czystym CSS nie ma sposobu, żeby napisać ją raz.
Oba bloki muszą być identyczne i **pilnuje tego build** (§9). Nigdy nie edytuj
jednego z nich osobno.

---

## 9. Co build egzekwuje

`validateTokens()` (`src/tokens.mjs`) wchodzi w `scripts/build.mjs` obok
`validateIA()` z Sesji 3. Sprawdza cztery rzeczy i przerywa build:

1. token ma wartość w jednym motywie, a nie ma w drugim,
2. dwie kopie palety ciemnej różnią się choćby jedną wartością,
3. arkusz używa `var(--czegoś)`, czego nigdzie nie zdefiniowano,
4. reguła poza blokiem tokenów wpisuje własny kolor (`#…`), zaokrąglenie
   (`border-radius: 11px`) albo czas (`transition: … 250ms`).

Punkt 4 ma krótką listę wyjątków w `LITERAL_OK` / `SIZE_OK` i **każdy z nich ma
powód wpisany obok**: czerń plakietki Google Play, biel i czerń wydruku,
zaokrąglenie ramki telefonu (to rysunek urządzenia, nie element interfejsu),
promień flagi 20×14px.

Każde z tych czterech sprawdzeń zostało przetestowane negatywnie — arkusz celowo
zepsuto i build faktycznie padał z czytelnym komunikatem.

Kontrast sprawdza osobny `scripts/check-contrast.mjs` (§1). Nie jest częścią builda
celowo: **które** pary mają znaczenie, wynika z projektu, a nie z arkusza — generator
nie ma jak tego wywnioskować.

---

## 10. Jak dodać komponent

1. Sprawdź, czy to naprawdę nowy komponent, a nie wariant istniejącego. Karta,
   wiersz listy, chip i pole mają po jednej regule — dopisanie do listy selektorów
   jest lepsze niż nowa klasa z tymi samymi wartościami.
2. Napisz regułę wyłącznie na tokenach. Jeśli żaden nie pasuje — dodaj token
   w bloku na górze `assets/styles.css`, **w obu motywach**, i opisz go tutaj.
3. Umieść regułę w odpowiedniej warstwie arkusza (kolejność: tokeny → baza →
   układ → komponenty → chrom serwisu → strony → narzędzia → responsywność → druk).
4. `node scripts/build.mjs --check` — musi przejść.
5. Zmieniałeś kolor? `node scripts/check-contrast.mjs` i dopisz nową parę do listy,
   jeśli pojawiła się nowa kombinacja tekst/tło.
6. Zmieniałeś cokolwiek, co trafia do przeglądarki? Podbij `STAMP`
   w `scripts/build.mjs` i przebuduj (`?v=` w `privacy-policy.html` i `404.html`
   podbija się ręcznie).

---

## 11. Czego ten system nie rozstrzyga

- **Układ strony głównej, nagłówka i centrum kalkulatorów.** To Sesje 5, 6 i 7.
  Sesja 4 ustaliła materiał (tokeny, komponenty, stany), nie rozkład sekcji.
- **Przycisk „Moje konto” w nagłówku łamie się na dwie linie między 900 a ~1010px**,
  a między 900 a ~960px strona przesuwa się w poziomie. Defekt zastany; Sesja 4
  zawęziła pas przesuwania (przed nią sięgał ~1010px), ale samo rozwiązanie należy do
  przebudowy nagłówka w Sesji 5.
- **Ikonografia.** Ikony są wklejone inline w `src/pages.mjs` jako SVG, każda ze swoim
  `stroke-width`. Ujednolicenie zestawu to osobna praca.
- **Dostępność poza kontrastem i celem dotykowym** — Sesja 34.
