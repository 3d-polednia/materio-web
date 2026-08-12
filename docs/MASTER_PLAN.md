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
| 5 | Globalny layout | **Zrobione** — 2026-08-12 |
| 6 | Homepage | **Zrobione** — 2026-08-12 |
| — | *Etap dodatkowy: rebranding Androida + sekcja „Aplikacja"* | **Zrobione** — 2026-08-12 |
| 7 | Centrum kalkulatorów | **Zrobione** — 2026-08-12 |
| 8 | Pojedynczy kalkulator | **Zrobione** — 2026-08-12 |
| 9 | Logika kalkulatorów | **Następna** |
| 10–36 | patrz rozdział XXXII planu | Nie zaczęte |

### Etap dodatkowy — rebranding aplikacji Android (nie jest sesją Master Planu)

Zlecenie właściciela w całości: [`SESJA_REBRANDING_ANDROID_I_APLIKACJA.txt`](SESJA_REBRANDING_ANDROID_I_APLIKACJA.txt).
Jego punkt 0 mówi wprost, że to **zamknięty etap techniczny pomiędzy Sesją 6 a kolejną
sesją**, który nie zastępuje żadnej sesji i nie zmienia numeracji — dlatego stoi w tabeli
bez numeru, a następna w kolejce nadal jest **Sesja 7**. (Zlecenie nazywa go „Sesją 7";
Sesja 7 Master Planu to Centrum kalkulatorów i jest nietknięta.)

Raport w całości: `docs/SESSION_HANDOFF_2026-08-12_rebranding-liczmat.md`
w repo `3d-polednia/Materio`. W skrócie, po stronie serwisu:

- **Trzy zrzuty ekranu na `/aplikacja/` pokazywały Materio** — stary wordmark i „Witaj
  w Materio!". Przerenderowane z aktualnej aplikacji tym samym testem Roborazzi, który
  wyprodukował poprzednie, więc pokazują to, co użytkownik dziś instaluje.
- **`og-image.jpg` miał wypalony w pikselach slogan „Policz. Kup. Nie marnuj."** Sesja 6
  zmieniła slogan i nie przegenerowała obrazka, więc każde udostępnienie dowolnej
  podstrony rozdawało wycofane hasło. Ten sam układ, aktualny slogan; `banner.jpg` tak samo.
- **`og:image:alt` powtarzał stary slogan w kodzie 130 stron** — jest teraz nazwaną stałą
  obok obrazka, który opisuje.
- Sama strona `/aplikacja/` nie była pisana od nowa: miała już własny adres w czterech
  językach z `canonical` i `hreflang`, H1, plakietkę Google Play, uczciwe noty o reklamach,
  lokalizacji i opcjonalnym koncie oraz structured data `MobileApplication`. Została
  **sprawdzona**: Chromium, cztery języki × 360/414/768/1280 px, 16/16 przechodzi.
- **Domena się nie zmieniła.** `materio-app.com` zostaje wszędzie — migracja na
  `liczmat.com` to osobny, późniejszy etap (§17 zlecenia).

Po stronie aplikacji: nazwa, slogan, ikona, splash i znak to LiczMat we wszystkich
dziesięciu językach, a listing w Google Play (11 języków, teksty + grafika + zrzuty)
został zaktualizowany na żywo. Matematyka kalkulatorów nietknięta.

### Co zrobiła Sesja 8

Strona pojedynczego kalkulatora ułożona według rozdziału XII: TYTUŁ → KRÓTKI OPIS →
FORMULARZ → WYNIK → AKCJE → SEO, „najważniejszy jest wynik”, „długie treści SEO,
instrukcje i FAQ nie mogą zasłaniać kalkulatora”.

- **Wyjaśnienie zeszło spod boku kalkulatora pod niego.** „Jak to liczymy” — lista pól,
  wzór, przykład i ostrzeżenia — stało dotąd w kolumnie **obok** formularza, więc zaczynało
  się na tej samej wysokości co narzędzie, a odpowiedź była ostatnią rzeczą na karcie.
  Teraz karta to samo narzędzie, a wyjaśnienie jest sekcją poniżej.
- **Dwa identyczne zielone wyniki zredukowane do jednego.** Przykład renderował się jako
  drugi blok `.result`, wyglądający dokładnie jak prawdziwy wynik — strona pokazywała dwie
  takie same odpowiedzi, z czego jedna nie była odpowiedzią odwiedzającego. Sekcja
  „Przykład” zniknęła, bo **panel wyniku sam nim jest**: build wpisuje w niego wynik
  policzony silnikiem tego kalkulatora z wartości, z jakimi otwiera się formularz. Liczba
  na stronie jest więc prawdziwą odpowiedzią dla liczb w polach — także dla robota i dla
  kogoś z wyłączonym JavaScriptem, którzy wcześniej widzieli pusty prostokąt.
- **Wynik jest teraz największą rzeczą na stronie** (`--fs-display`), w prawej kolumnie,
  przyklejonej przy przewijaniu. Na telefonie kolumny się składają, a po kliknięciu
  „Policz” strona sama przewija do wyniku.
- **AKCJE pod wynikiem.** „Dodaj do projektu” (dotąd „Dodaj do kosztorysu”, chowane do
  pierwszego kliknięcia — teraz jest od razu, bo wynik też jest od razu) i zdanie
  o koncie. Przycisk liczenia po pierwszym użyciu zmienia napis na **„Oblicz ponownie”**,
  czyli dokładnie tę akcję, którą rozdział XII wymienia z nazwy.
- **„Dane się zmieniły”.** Edycja dowolnego pola zapala ostrzeżenie nad akcjami. Bez tego
  strona pokazywałaby liczbę obok pól, które jej nie wyprodukowały — a to gorsze niż brak
  liczby.
- **Zdanie o koncie rozróżnia zalogowanego.** `/app/` zostawia w `localStorage` znacznik
  `liczmat-signed-in`; kalkulatory nie ładują Firebase, więc bez tego jedno zdanie
  kosztowałoby zapytanie sieciowe na każdej z 60 stron. Znacznik decyduje **wyłącznie
  o treści** — nic na nim nie jest bramkowane. Wypisany na `/cookies/` w czterech językach.
- **Matematyka nietknięta.** W `assets/calculators.js` zmieniło się tylko podłączanie
  zdarzeń; żaden silnik, żadne zaokrąglenie, żadna jednostka. Test sprawdza to wprost:
  25 m² ÷ 40 m²/opak. × 2 warstwy → 2 opak., po zmianie na 50 m² → 3 opak.
- Sprawdzone w Chromium: **69 testów strony kalkulatora + 21 testów tego, co mogło się przy
  okazji zepsuć + 80 testów Sesji 7 — 170/170 przechodzi.** W tym: kolejność rozdziału XII
  zmierzona w DOM, wszystkie 15 kalkulatorów × otwiera się na prawdziwym wyniku, cztery
  języki, wariant bez JavaScriptu, wybierak materiałów, wejście z `/materialy/?m=`, pasek
  pomieszczeń, przełącznik waluty (przelicza etykietę, nie ilość) i brak przewijania w bok
  przy 360 / 414 / 768 / 1280 px.

### Co zrobiła Sesja 7

`/kalkulatory/` przebudowane według rozdziału XI. Rozdział wymaga pięciu rzeczy —
wyszukiwarki, logicznych kategorii, filtrowania, popularnych kalkulatorów i czytelnego
dostępu do wszystkich — i zabrania jednej: „nie wyświetlaj wszystkiego jako gigantycznej
ściany kart”.

- **Pięć kategorii zamiast czterech zakładek z aplikacji.** Cztery grupy, które strona
  pokazywała do tej pory (Powierzchnie / Rozkrój / Roboty budowlane / Stelaże G-K), to
  pole `calc.tab` przeniesione z Androida razem z silnikami. Stawia ono „Klej / zaprawa”
  i „Fugę” w robotach budowlanych, czyli daleko od kalkulatora płytek, z którym zawsze
  idą razem. Nowy podział — **Płytki i wykończenie, Malowanie, Budowa, Rozkrój,
  Zabudowa G-K** — jest ten, który rozdział XI wymienia z nazwy. Zapisany jako
  `CALC_CATEGORIES` w `src/ia.mjs`, bo to decyzja architektoniczna: build sprawdza, że
  każdy kalkulator należy do dokładnie jednej kategorii, więc nowy kalkulator nie może po
  cichu wypaść z centrum. **`assets/calculators.js` bez zmian** — matematyka i `calc.tab`
  nietknięte (rozdział XIII).
- **Wyszukiwarka i filtr, ale strona działa bez skryptu.** Kategorie to zwykłe linki do
  `#g-<id>`: bez JS skaczą do grupy, z JS zawężają listę w miejscu. Każdy z 15
  kalkulatorów jest w kodzie prawdziwym `<a>`, więc robot indeksuje to samo, co widzi
  człowiek. Pole wyszukiwania to jedyna kontrolka, której skrypt jest naprawdę potrzebny,
  więc siedzi w `.js-only` i przy wyłączonym JS w ogóle się nie pokazuje, zamiast leżeć
  martwe. Szuka po nazwie, opisie i nazwie kategorii — dlatego „malowanie” znajduje
  „Farby, tynki, grunty”, choć tego słowa nie ma ani w nazwie, ani w opisie.
- **„plytki” znajduje „Płytki”.** Standardowe składanie NFD zdejmuje ogonki i kreski, ale
  polskiego `ł` nie rusza — Unicode nie uważa go za `l` z akcentem. Na stronie, której
  całym zadaniem jest wyszukiwanie, to jest realna dziura, więc `fold()` mapuje je ręcznie,
  po obu stronach porównania.
- **„Od czego zacząć” zamiast „Popularne”.** Rozdział XI prosi o popularne kalkulatory,
  ale serwis nie ma żadnych danych o ruchu, z których dałoby się je policzyć, a CLAUDE.md
  zabrania liczby, której nie da się wywieść z kodu. Skrót bierze się więc z tego, co jest
  policzalne: `popularCalcs()` liczy odesłania z `GUIDES[].calcs` i pokazuje cztery
  kalkulatory, do których odsyła najwięcej poradników — a strona mówi to wprost pod
  nagłówkiem. **Do decyzji właściciela**, czy to wystarcza, czy skrót ma być ustalony
  ręcznie.
- **Ślepe kotwice ze strony głównej naprawione.** Drzwi „Kalkulatory” prowadziły do
  `#g-surface`, `#g-trade`, `#g-framing` — po przebudowie takich sekcji nie ma. Lista
  kategorii na stronie głównej bierze się teraz z tego samego `CALC_CATEGORIES`, więc nie
  może wskazać nagłówka, którego centrum nie ma. Przy okazji te linki otwierają centrum
  **już zawężone** do klikniętej kategorii.
- **Cztery klucze `tab_*` usunięte** ze słownika — nazwy grup, których nie renderuje już
  żadna strona. Słownik: 720 kluczy × 4 języki.
- Sprawdzone w Chromium: **80 testów, 80 przechodzi** — cztery języki × (filtr kategorii,
  licznik, chowanie pustych grup, brak błędów w konsoli), wyszukiwanie z ogonkami i bez,
  stan pusty, Escape, wejście z `#g-drywall`, wariant bez JavaScriptu i brak przewijania
  w bok przy 360 / 414 / 768 / 1280 px. Cztery nowe sprawdzenia buildu przetestowane
  negatywnie — celowo zepsute, build faktycznie padł.
- **Strona jest wyższa, nie niższa**: 2327 px → 3180 px przy 1280 px, 203 → 316 słów.
  Dokłada ją pasek filtra i skrót „Od czego zacząć”, czyli dokładnie to, o co prosi
  rozdział XI. Sam spis kalkulatorów jest krótszy w odbiorze: pięć nazwanych grup zamiast
  czterech bloków po całej szerokości, a po wpisaniu jednego słowa zostaje kilka pozycji
  (np. „płyt” → 7 z 15).

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 6

Strona główna napisana od nowa według rozdziału X: wejście do produktu, nie opis
produktu. **8845 px → 2660 px wysokości, 999 → 209 słów, 12 → 4 sekcje** (zmierzone
w Chromium przy 1280 px).

- **Trzy kierunki z rozdziału X, po jednym na poziom dostępu**: Kalkulatory („Co chcesz
  policzyć?”), LiczMat („Chcesz zachować i uporządkować swoją pracę?”), LiczMat Pro
  („Robisz to zawodowo?”). Zapisane jako `HOME_DOORS` w `src/ia.mjs`, nie w szablonie —
  to decyzja architektoniczna, więc build pilnuje, że drzwi zostaną trzy i w kolejności
  poziomów. Drzwi do Pro **nie mają linku** („W przygotowaniu”), bo `/liczmat-pro/`
  powstaje w Sesji 29; status czyta się z architektury, więc same staną się linkiem.
- **Zdjęte ze strony głównej** (rozdział X wymienia każde z nich z nazwy): lista
  wszystkich 15 kalkulatorów w czterech grupach, sześć kart funkcji, kalkulator
  pomieszczenia, blok projektów, blok konta, zajawka sklepów, rozdział o danych i baner
  z reklamą aplikacji Android. Każda z tych treści ma własną stronę i tam zostaje.
- **Ścieżka z rozdziału I** jako cztery linijki: POLICZ → ZAPISZ → ZORGANIZUJ → ZREALIZUJ.
- **FAQ z siedmiu pytań do czterech** — tych, które decydują przed liczeniem: czy płatne,
  gdzie liczy, czy potrzebne konto, co z danymi. Structured data `FAQPage` bierze się
  z tej samej listy, więc nie może obiecywać pytań, których na stronie nie ma.
- **Strona główna przestała być aplikacją Androida w structured data.** Deklarowała się
  jako `MobileApplication` z `downloadUrl` do Google Play; teraz jest `WebSite`, a encja
  `MobileApplication` została tam, gdzie jest prawdziwa — na `/aplikacja/`. Tytuł i opis
  strony też przestały się kończyć na „na Androida”.
- **Strona główna nie ładuje już żadnego skryptu poza wspólnymi.** Nie ma na niej
  kalkulatora, więc silniki, katalog materiałów, wybierak i workspace (5 plików) zostały
  na stronach, które ich używają.
- **Slogan rozstrzygnięty zgodnie z grafiką referencyjną właściciela**: „Policz.
  Zaplanuj. Zrealizuj.” w stopce, H1 „Policz materiały. Zaplanuj swoją pracę.”. Cztery
  kroki na stronie zostają przy wersji z rozdziału I, bo to opis produktu, nie hasło.
- **Słownik posprzątany**: 92 linijki kluczy, których nie renderuje już żadna strona,
  zniknęły z `assets/i18n.js` i `assets/i18n-pages.js` — razem z sekcjami, do których
  należały. `--check` przechodzi: 705 kluczy × 4 języki.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 5

Nagłówek, stopka, nawigacja, nawigacja mobilna, selektory i przełącznik motywu — jeden
zestaw dla całego serwisu. Układ pojedynczych stron nietknięty (to Sesje 6–7).

- **Jeden nagłówek i jedna stopka na cały serwis.** `/app/` i `/p/` miały własną kopię
  w `src/app-pages.mjs`; teraz wołają `siteHeader()` / `siteFooter()` z `src/template.mjs`
  z krótszą listą linków. Przy okazji znika **realny błąd**: te dwie strony nie miały
  przycisku menu, a CSS chował nawigację poniżej 900px — na telefonie selektor języka
  i waluty w `/app/` był niedostępny (sprawdzone w przeglądarce, zrzut przed i po).
- **Pasek nagłówka mieści się w jednym wierszu.** Zmierzone w Chromium: sześć linków
  plus selektory rozbijały wiersz na dwie linie już przy 1024px. `Sklepy` i `Aplikacja`
  zeszły do stopki, odstępy w paśmie do 1160px są ciaśniejsze, przyciski nie łamią
  tekstu. Najgorszy przypadek (901px, ukraiński) ma teraz 41px zapasu, wysokość paska
  zostaje 64px we wszystkich czterech językach. `validateIA()` pilnuje limitu czterech
  linków, żeby to się nie odbudowało.
- **Wiadomo, gdzie się jest**: link bieżącej sekcji dostaje `aria-current="page"`, tło
  `--accent-soft` i limonkową kreskę (samo tło byłoby wskazaniem wyłącznie kolorem).
  Dopasowanie po najdłuższym prefiksie, więc strona kalkulatora podświetla „Kalkulatory”.
- **Szuflada mobilna zachowuje się jak nakładka**: przyciemnienie strony (kliknięcie
  zamyka), zablokowane przewijanie pod spodem, własne przewijanie gdy jest wyższa niż
  ekran, Escape zamyka i wraca fokusem na przycisk, ikona zmienia się na krzyżyk.
  Wcześniej nie było nic z tego. 20 sprawdzeń w Chromium, wszystkie przechodzą.
- **Bez JavaScriptu nawigacja nie znika.** Skrypt w `<head>` dopisuje klasę `js`, a
  szuflada chowa się tylko w regułach z `.js`. Wcześniej CSS chował menu bezwarunkowo,
  a otwierał je wyłącznie skrypt — z wyłączonym JS telefon nie miał żadnego linku.
- **Selektor języka z klawiatury**: strzałki otwierają listę i chodzą po niej, Home/End
  skaczą na końce, Escape zamyka samo menu (a nie całą szufladę pod nim — stąd nasłuch
  w fazie przechwytywania w `assets/main.js`).
- **Stopka: cztery kolumny** (znak, Produkt, Konto, Prawne) generowane z `ROUTES` przez
  nowe pole `footer.group`, a pod nimi rząd języków — te same adresy co w selektorze, ale
  jako zwykłe linki: działają bez skryptu i robot je przechodzi.
- **`--header-h` (64px)** zamiast trzech kopii tej samej liczby: wiersz nagłówka, górna
  krawędź szuflady i `scroll-padding-top` dla kotwic (było 72px przy pasku 64px).
- Nowa para w `scripts/check-contrast.mjs` (kreska pod bieżącą stroną): 5,37:1 w jasnym,
  8,09:1 w ciemnym. Wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

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

### ~~Slogan~~ — rozstrzygnięte w Sesji 6

Serwis miał „Policz. Kup. Nie marnuj.”, a grafika referencyjna właściciela „POLICZ.
ZAPLANUJ. ZREALIZUJ.” z nagłówkiem „Policz materiały. Zaplanuj swoją pracę.”. Sesja 6
poszła za grafiką: `hero_title` i `foot_tagline` w czterech językach, a przy okazji
`CLAUDE.md`. Sekcja „jak to działa” zostaje przy czterech krokach z rozdziału I
(POLICZ → ZAPISZ → ZORGANIZUJ → ZREALIZUJ) — to opis produktu, nie hasło marki.
**Do potwierdzenia przez właściciela**, jeśli miał na myśli co innego.

### Waluta a aplikacja Android

Strona pozwala wybrać walutę niezależnie od języka; aplikacja Android nadal bierze
walutę z języka (`AppLanguage.defaultCurrency`). Kosztorys zsynchronizowany z telefonu
może więc mieć inną walutę niż ta wybrana w przeglądarce — pozycja zachowuje własny
`currencyCode`, więc nic się nie fałszuje, ale docelowo aplikacja powinna pójść tą samą
drogą. Android jest poza zakresem prac nad webem (rozdział VII planu).

### Akcent aplikacji Android a limonka serwisu

Znak, ikona i splash w aplikacji są już limonkowo-grafitowe (ten sam wektor, co
`assets/logo-mark.svg`), ale interfejs zostaje **oliwkowy `#626B38`**, a serwis jest
limonkowy `#91d206`. Etap rebrandingu tego nie ruszał, bo „Oliwka" to pozycja
w **wybieraku kolorów** aplikacji (`palette_names`) — nazwa koloru, nie marki;
przemalowanie jej kłóciłoby się z etykietą. Sama limonka na jasnym tle nie przechodzi
WCAG AA jako kolor tekstu — serwis używa do tego przyciemnionego `#476c00`.

Propozycja: dodać w aplikacji siódmą paletę „LiczMat" (limonka + grafit, wariant tekstowy
przyciemniony) i uczynić ją domyślną, zostawiając sześć obecnych do wyboru. **Potrzebna
decyzja właściciela**; zmiana jest po stronie `3d-polednia/Materio`.

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
pulpitu i selektor języka z flagami. Selektor z flagami zrobiła Sesja 2, ramę strony
(nagłówek, stopka, nawigacja) Sesja 5, treść strony głównej Sesja 6, a wyszukiwarkę
i skrót „Od czego zacząć” Sesja 7. **Wyszukiwarki kalkulatorów na stronie głównej nadal
nie ma** — rozdział XI umieszcza ją na `/kalkulatory/` i tam stoi; strona główna prowadzi
do niej drzwiami „Kalkulatory” i skrótami do pięciu kategorii. Mockup pulpitu należy do
Sesji 14. Sesja 1 wdrożyła sam system wizualny, bez przebudowy architektury strony
głównej.

### ~~Kotwice kategorii na stronie głównej~~ — rozstrzygnięte w Sesji 7

Drzwi „Kalkulatory” linkowały do `#g-surface`, `#g-cutting`, `#g-trade`, `#g-framing`.
Sesja 7 zmieniła podział na pięć kategorii, więc trzy z tych kotwic przestały istnieć —
i dlatego lista na stronie głównej powstaje teraz z `CALC_CATEGORIES`, tak samo jak
nagłówki grup w centrum. Wskazanie nieistniejącej sekcji wymagałoby dopisania jej do
architektury, czyli do miejsca, z którego biorą się obie listy naraz.

Kotwica nadal nie przechodzi przez `livePaths()` — to nie jest adres strony. Pilnuje jej
teraz test w Chromium (patrz raport Sesji 7), nie build.

### Miejsce dla „LiczMat Pro” w menu

Menu mieści cztery linki i tyle ich dziś jest (Kalkulatory, Materiały, Projekty,
Poradniki). Rozdział X chce, żeby ze strony głównej wychodziły trzy kierunki:
Kalkulatory, LiczMat i LiczMat Pro. Kiedy Sesja 29 zbuduje `/liczmat-pro/`, coś z menu
będzie musiało ustąpić — najpewniej „Poradniki”, które i tak są w stopce. Decyzja należy
do tamtej sesji.

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
