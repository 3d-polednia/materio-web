# LiczMat — architektura informacji

Wynik **Sesji 3** planu (`MASTER_PLAN.txt`, rozdział XXXII: „ARCHITEKTURA INFORMACJI —
docelowa struktura LiczMat, bez dużych zmian funkcjonalnych”).

Ten dokument opisuje: **strony, routing, nawigację, relacje między modułami i przepływy
użytkownika** dla modelu `GOŚĆ → LICZMAT → LICZMAT PRO`.

Wersja maszynowa tego samego leży w **`src/ia.mjs`**. To nie jest kopia — to jest ta sama
architektura zapisana tak, żeby build mógł ją sprawdzić:

- `src/template.mjs` buduje menu i stopkę z `ROUTES`, więc link w nawigacji nie może
  wskazywać na stronę, której nie ma w architekturze,
- `scripts/build.mjs` porównuje wygenerowane strony z `livePaths()` i **przerywa build**,
  gdy powstała strona nikt nie zadeklarował albo zadeklarowana strona przestała powstawać,
- `validateIA()` pilnuje poziomów dostępu, drzewa, kolejności w menu i przepływów.

Dokument mówi **dlaczego**, `src/ia.mjs` mówi **co**. Gdy się rozjadą, prawdą jest kod —
i wtedy trzeba poprawić ten plik.

---

## 1. Trzy poziomy dostępu

Rozdział II planu. Trzy poziomy, ani jednego więcej — żadnego „Firma”, „Team”, „Admin”.

| Poziom | Kto | Co dostaje | Czego nie ma |
|---|---|---|---|
| `GUEST` | bez konta | wszystkie kalkulatory, pełny wynik, poradniki, materiały, sklepy | synchronizacji, historii między urządzeniami, modułów Pro |
| `LICZMAT` | darmowe konto | to co gość + zapis kalkulacji, projekty, listy materiałów, koszty, historia, sync | modułów Pro |
| `PRO` | płatne rozszerzenie | to co LiczMat + klienci, zlecenia, wyceny, terminarz, lekki CRM | — |

Zasada z rozdziału II, która ustawia całą resztę:

> Każdy element aplikacji powinien jednoznacznie wiedzieć, do którego poziomu dostępu należy.

Dlatego poziom jest **polem trasy** w `src/ia.mjs` (`level`), a nie komentarzem. Poziom
oznacza **czego strona wymaga**, nie co oferuje: `/projekty/` jest `GUEST`, bo da się jej
użyć bez konta — konto dokłada synchronizację, nie samą możliwość liczenia.

Druga zasada, z rozdziału II i XXV: **podstawowy kalkulator nigdy nie wymaga rejestracji**.
Propozycja konta pojawia się **po wyniku**, nigdy przed. Moduł Pro pokazuje darmowemu
użytkownikowi, czym jest, i napis „Dostępne w LiczMat Pro” — nigdy martwego przycisku.
W `src/ia.mjs` wymusza to `validateIA()`: trasa `PRO` bez pola `gate` przerywa build.

### 1.1. Poziom odwiedzającego — skąd się bierze (Sesja 13)

Pole `level` na trasie mówi, **czego wymaga strona**. Od Sesji 13 drugą połowę zdania
z rozdziału II — który poziom ma **człowiek** — trzyma `ACCOUNT_LEVELS` w `src/ia.mjs`
(nazwa, opis i lista możliwości każdego poziomu) oraz `lmLevelOf()` w `assets/account.js`
(wyliczenie). Poziom jest **wyprowadzany, nigdy deklarowany**:

| Stan | Poziom |
|---|---|
| brak użytkownika Firebase | `GUEST` |
| zalogowany | `LICZMAT` |
| zalogowany i `users/{uid}.plan == "premium"` (ważny) | `PRO` |

`plan` i `planValidUntil` to pola **wyłącznie serwerowe** — reguły w
`config/firebase/firestore.rules` (repo aplikacji) dopuszczają z profilu tylko
`lastSeenAt` i `appVersion`. Przeglądarka może więc poziom **przeczytać**, ale nie może go
sobie nadać. Dziś nic ich nie zapisuje (`FIRESTORE_SYNC.md` §9.2: brak Cloud Functions
i Play Billing), więc każde istniejące konto jest na poziomie `LICZMAT` — karta Pro na
`/app/` mówi „W przygotowaniu” i **nie ma przycisku zakupu**, bo nie byłoby czego kupić.

Pozostałe 129 stron nie ładuje Firebase. Dostają jedną wskazówkę: klucz
`liczmat-signed-in` w `localStorage`, którego wartością jest poziom (`liczmat` albo
`pro`). To jest **podpowiedź do treści, nigdy uprawnienie** — może być nieaktualna
(wylogowanie w innej karcie, wygasły token), więc nic nie wolno na niej bramkować.
Decyduje o dwóch rzeczach: zdaniu pod wynikiem kalkulatora i kropce przy „Moje konto”
w nagłówku. Zasada, której nie wolno złamać, to `FIRESTORE_SYNC.md` §1.2: **liczenie nigdy
nie wymaga konta**.

---

## 2. Inwentarz stron — stan na dziś

131 wygenerowanych stron: 32 strony logiczne × 4 języki, plus trzy bezjęzykowe.
Adresy w kolumnie „URL (PL)”; pozostałe języki mają prefiks (`/en/…`, `/de/…`, `/uk/…`)
i własne slugi z `SECTION` i `CALC_SLUG` w `src/site.mjs`.

| Trasa (`id`) | URL (PL) | Poziom | Rodzic | Indeks | Sztuk |
|---|---|---|---|---|---|
| `home` | `/` | GUEST | — | tak | 4 |
| `calculators` | `/kalkulatory/` | GUEST | `home` | tak | 4 |
| `calculator` | `/kalkulatory/<slug>/` | GUEST | `calculators` | tak | 60 |
| `materials` | `/materialy/` | GUEST | `home` | tak | 4 |
| `guides` | `/poradniki/` | GUEST | `home` | tak | 4 |
| `guide` | `/poradniki/<slug>/` | GUEST | `guides` | tak | 32 |
| `stores` | `/sklepy/` | GUEST | `home` | tak | 4 |
| `android` | `/aplikacja/` | GUEST | `home` | tak | 4 |
| `projects` | `/projekty/` | GUEST | `home` | tak | 4 |
| `project` | `/projekty/?id=…` | GUEST | `projects` | **nie** | 0 — widok |
| `estimate` | `/kosztorys/` | GUEST | `projects` | tak | 4 |
| `cookies` | `/cookies/` | GUEST | `home` | tak | 4 |
| `account` | `/app/` | GUEST | `home` | **nie** | 1 |
| `dashboard` | `/app/dashboard/` | GUEST | `account` | **nie** | 1 |
| `share` | `/p/` | GUEST | `estimate` | **nie** | 1 |
| `privacy` | `/privacy-policy.html` | GUEST | `home` | tak | pisana ręcznie |

`404.html` też jest pisany ręcznie i nie jest trasą — jest obsługą błędu i przekierowaniem
(patrz §3).

**`project` jest pierwszym „widokiem” (`view: true`) — ekranem bez własnego pliku.**
Liczba wygenerowanych stron się przez niego nie zmienia i to jest cała jego definicja:
`/projekty/?id=…` to ten sam `projekty/index.html`, w który `assets/workspace-ui.js`
wpisuje jeden projekt zamiast listy. Powstał tak, bo id projektu robi się w przeglądarce
i nie może być katalogiem (patrz §3), a nie dlatego, że tak wygodniej.

Trasa-widok to nadal trasa: ma poziom dostępu, rodzica, miejsce w przepływie i wpis
w inwentarzu. Build sprawdza o niej pięć rzeczy (§9), z których najważniejsza jest ta, że
jej adres leży **wewnątrz** adresu rodzica — `livePaths()` pomija widoki, więc widok
wskazujący gdzie indziej byłby stroną, której build nigdy nie napisze i której brak
nigdy by nie zauważył.

Czego w tym inwentarzu **nie ma**, a plan wymienia w rozdziale IX: `/liczmat-pro` i
`/konto`. Są w §4 jako trasy planowane.

Czego plan **nie wymienia**, a serwis ma: `/materialy/`, `/sklepy/`, `/aplikacja/`,
`/cookies/`, `/kosztorys/`, `/p/`. Rozdział IX mówi wprost, że jego struktura nie jest
absolutna. Wszystkie zostają — każda ma powód:

- `/materialy/` — katalog 161 materiałów jako droga do kalkulatora („mam gres 60×60,
  ile kleju”), nie sklep. Rozdział I zabrania rozbudowywania go w wielki katalog, nie
  zabrania istnienia.
- `/sklepy/` — wyszukiwarka sklepów, realna wartość dla gościa po wyniku.
- `/aplikacja/` — jedna strona aplikacji Android. Rozdział X zabrania promować jej na
  stronie głównej; osobna strona jest właśnie sposobem, żeby jej tam nie promować.
- `/cookies/` i `/privacy-policy.html` — wymóg prawny, nie decyzja produktowa.
- `/kosztorys/` — rozdziały XVI i XVII (lista materiałów + koszty). Dziecko `/projekty/`.
- `/p/<token>` — kosztorys tylko do odczytu z linku. Poziom `GUEST` celowo: sens linku
  polega na tym, że odbiorca nie potrzebuje niczego.

---

## 3. Routing — zasady

**Język jest w adresie.** Polski w korzeniu (`/kalkulatory/farby-tynki-grunty/`),
pozostałe trzy pod prefiksem (`/en/calculators/paint-plaster-primer/`). Każda wersja ma
własny `canonical` i pełny zestaw `hreflang` + `x-default`. Przełącznik języka **nawiguje**,
nie podmienia DOM — inaczej trzy języki byłyby nieindeksowalne. Nie ma automatycznego
przekierowania po `navigator.language`; jest tylko po wyborze ręcznym.

**Waluta nie jest w adresie.** Waluta to wybór przechowywany w `localStorage`
(`liczmat-currency`), niezależny od języka (rozdział VI). Gdyby weszła do URL-a, każda
strona miałaby cztery warianty bez żadnej różnicy w treści — czyli duplikaty dla Google.

**Slug jest wieczny.** Zmiana slugu w `src/site.mjs` psuje każdy link przychodzący i
pozycję, którą ten link zbudował. Zamiast zmiany — przekierowanie.

**Strona z prywatnymi danymi jest bezjęzykowa i `noindex`.** `/app/` i `/p/` ładują cały
słownik i tłumaczą się w przeglądarce. Nie mają wersji językowych, bo nie mają treści do
pozycjonowania, a mają dane, których nie wolno indeksować. Wypadają z `sitemap.xml` i mają
`noindex` w metatagu **oraz** w `robots.txt`.

**GitHub Pages nie ma przepisywania adresów.** To ogranicza routing i trzeba to wiedzieć
zanim się zaprojektuje adres:

- każdy stały adres musi być prawdziwym katalogiem z `index.html`, który wypisuje build;
- adres z nieograniczonym identyfikatorem (token, id projektu) **nie może** być katalogiem.
  Jedyne działające obejście to `404.html`, które przechwytuje i przekierowuje — tak działa
  `/p/<token>` → `/p/?t=<token>`.

**Stąd reguła dla identyfikatorów: id idzie do query string, nie do ścieżki.** Projekt to
`/projekty/?id=<projectId>`, a nie `/projekty/<projectId>/`. Powód jest techniczny, nie
estetyczny — drugi wariant wymagałby przejścia przez `404.html` na każdym wejściu, co psuje
kod odpowiedzi HTTP i historię przeglądarki. Strony z prywatnymi danymi i tak są `noindex`,
więc ładniejszy adres nic by nie kupił.

**`404.html` pełni trzy role naraz** i to jest jedyne miejsce, gdzie wolno je łączyć:
strona błędu, most `/p/<token>`, oraz przekierowanie sześciu wycofanych języków
(`RETIRED_LANGS`) na stronę główną.

---

## 4. Strony planowane

Nic z tego nie jest zbudowane. Każda pozycja jest zadeklarowana w `src/ia.mjs` ze statusem
`PLANNED` i numerem sesji, która ją realizuje; build pilnuje, żeby żadna nie zajęła
adresu, który już działa, i żeby żadna nie trafiła do menu przed czasem.

| Trasa | URL (PL) | Poziom | Sesja | Po co |
|---|---|---|---|---|
| `liczmat-pro` | `/liczmat-pro/` | GUEST | 29 | publiczna strona Pro: co to, dla kogo, ile kosztuje |
| `clients` | `/klienci/` | PRO | 22 | lista klientów |
| `jobs` | `/zlecenia/` | PRO | 23 | zlecenia: status, termin, wartość |
| `quotes` | `/wyceny/` | PRO | 24 | materiały + robocizna + marża |
| `calendar` | `/terminarz/` | PRO | 25 | terminy zleceń |

Slugi w pozostałych trzech językach są już ustalone w `src/ia.mjs` (`plannedSlug`) — po to,
żeby sesja 22 nie wymyślała ich w pośpiechu. Przenoszą się do `SECTION` w `src/site.mjs`
w chwili, gdy dana sesja buduje stronę.

**`/liczmat-pro/` jest publiczna i indeksowana, moduły Pro też.** To nie jest sprzeczność:
paywall stoi na *narzędziu*, nie na *opisie narzędzia*. Rozdział XXV wymaga, żeby darmowy
użytkownik rozumiał, które funkcje są Pro — strona, która pokazuje mu „Klienci — dostępne
w LiczMat Pro”, robi dokładnie to i przy okazji jest jedyną treścią o Pro, którą Google
może zaindeksować. Prywatne dane klienta i tak nigdy nie trafiają do HTML-a: są ładowane
w przeglądarce po zalogowaniu, tak samo jak dziś projekty na `/projekty/`.

**Moduły Pro dostają własne adresy językowe, nie podstrony `/app/`.** Rozważana była
alternatywa (`/app/klienci/`, wszystko `noindex`). Odrzucona, bo:

- łamie spójność — `/projekty/` i `/kosztorys/` już są zwykłymi stronami językowymi
  z treścią dla niezalogowanego i narzędziem dla zalogowanego. Klienci działaliby inaczej
  niż projekty bez żadnego powodu;
- kasuje jedyną szansę Pro na ruch z wyszukiwarki;
- `/app/` ma zostać tym, czym jest: kontem (logowanie, profil, sync, usunięcie konta),
  a nie drugą aplikacją obok serwisu.

---

## 5. Nawigacja

Menu i wszystkie kolumny stopki powstają z `ROUTES` (pole `header` / `footer` z pozycją,
kluczem tłumaczenia i — w stopce — kolumną). Nie da się dodać linku do menu bez dodania
strony do architektury.

**Menu główne** (kolejność z `header.order`):

```
LiczMat   Kalkulatory · Materiały · Projekty · Poradniki
          [ język ] [ waluta ] [ Konto ]        [ motyw ] [ menu ]
```

**Cztery linki to maksimum** i `validateIA()` tego pilnuje. Sesja 5 zmierzyła pasek
w przeglądarce: sześć linków plus selektory nie mieściło się w jednym wierszu poniżej
1080px (po niemiecku „Die App” i „Mein Konto” łamały się na dwie linie). `Sklepy`
i `Aplikacja` zeszły do stopki — pierwsze jest narzędziem, a nie krokiem żadnego
przepływu, drugie rozdział X wprost każe trzymać z dala od pierwszego planu.

Strona, na której stoi odwiedzający, dostaje `aria-current="page"` (najdłuższy pasujący
prefiks, więc `/kalkulatory/tapety/` podświetla „Kalkulatory”).

**Stopka** — cztery kolumny:

| Kolumna | Skąd | Zawartość |
|---|---|---|
| znak | — | logo + tagline |
| Produkt | `footer.group` domyślna | Kalkulatory · Materiały · Projekty · Kosztorys · Poradniki · Sklepy · FAQ |
| Konto | `footer.group: "account"` | Aplikacja Android · Moje konto · Google Play |
| Prawne | ręcznie | Polityka prywatności · Cookies |

Pod nimi **rząd języków**: te same adresy co w selektorze w nagłówku, ale jako zwykłe
linki — działają bez skryptu i robot je przechodzi.

**Nawigacja mobilna** (poniżej 900px) to szuflada pod nagłówkiem: przyciemnia stronę,
blokuje przewijanie pod sobą, zamyka się Escapem, kliknięciem w tło i po wybraniu linku.
Bez JavaScriptu szuflady nie ma i nawigacja zostaje na stronie — wcześniej CSS chował ją
bezwarunkowo, więc przy wyłączonym skrypcie na telefonie nie dało się przejść nigdzie.

**Okruszki** idą po polu `parent`: `home → calculators → calculator`,
`home → guides → guide`, `home → projects → estimate`. Każda strona ma dokładnie jednego
rodzica i `validateIA()` sprawdza, że w drzewie nie ma cyklu.

### 5.1. Strona główna — trzy kierunki

Rozdział X: strona główna prowadzi przede wszystkim do trzech obszarów. Sesja 6 zapisała
je jako `HOME_DOORS` w `src/ia.mjs` — po jednym na poziom dostępu, w kolejności poziomów:

| Drzwi | Trasa | Poziom | Pytanie z rozdziału X |
|---|---|---|---|
| Kalkulatory | `calculators` → `/kalkulatory/` | `GUEST` | „Co chcesz policzyć?” |
| LiczMat | `projects` → `/projekty/` | `LICZMAT` | „Chcesz zachować i uporządkować swoją pracę?” |
| LiczMat Pro | `liczmat-pro` (`PLANNED`, Sesja 29) | `PRO` | „Robisz to zawodowo?” |

`level` w `HOME_DOORS` mówi, **dla kogo są te drzwi**, a nie jakiego poziomu wymaga
strona za nimi: `/projekty/` jest trasą `GUEST` (działa w przeglądarce bez konta),
a drzwi „LiczMat” opowiadają o tym, co dokłada konto. Drzwi na trasę `PLANNED` nie mają
linku — zamiast przycisku dostają „W przygotowaniu”, bo adres jeszcze nie istnieje.
Status czyta się z architektury, więc w dniu, w którym Sesja 29 zbuduje `/liczmat-pro/`,
drzwi same staną się linkiem.

`validateIA()` pilnuje, żeby drzwi zostały trzy, w kolejności poziomów i na istniejących
trasach, a `scripts/build.mjs` — żeby każde miały komplet tekstów we wszystkich czterech
językach (bez tego `t()` wypisałby na stronie głównej sam klucz).

**Czego w nawigacji nadal brakuje** wobec docelowej architektury:

- **LiczMat Pro** ma wejście na stronie głównej (drzwi wyżej), ale nie ma go w menu —
  trasa `liczmat-pro` powstaje w Sesji 29 i dopiero wtedy zajmie miejsce w pasku; przy
  limicie czterech linków coś będzie musiało ustąpić;
- menu jest płaską listą i nie pokazuje, że `Kosztorys` należy do `Projektów`;
- „Konto” jest przyciskiem po prawej i nic nie mówi o stanie zalogowania — pulpit
  zalogowanego to Sesja 14.

### 5.2. Centrum kalkulatorów — pięć kategorii

Rozdział XI wymaga na `/kalkulatory/` wyszukiwarki, logicznych kategorii, filtrowania,
popularnych kalkulatorów i czytelnego dostępu do wszystkich — i zabrania jednego:
„nie wyświetlaj wszystkiego jako gigantycznej ściany kart”. Sesja 7 zapisała podział
jako `CALC_CATEGORIES` w `src/ia.mjs`:

| Kategoria | `#g-` | Kalkulatory |
|---|---|---|
| Płytki i wykończenie | `#g-tiling` | płytki/panele/gres, klej/zaprawa, fuga |
| Malowanie | `#g-painting` | farby/tynki/grunty, tapety |
| Budowa | `#g-building` | beton z worka, wylewka/tynk, murowanie, ocieplenie ETICS |
| Rozkrój | `#g-cutting` | rozkrój liniowy 1D, rozkrój płyt 2D |
| Zabudowa G-K | `#g-drywall` | ściana działowa, sufit podwieszany, G-K na klej, poszycie OSB |

**To nie są cztery zakładki z `calc.tab`.** Tamto pole przyszło z aplikacji Android razem
z silnikami i stawia „Klej / zaprawa” oraz „Fugę” w „Robotach budowlanych” — trzy ekrany
od kalkulatora płytek, z którym zawsze idą w parze. Jak serwis sortuje własne centrum, to
decyzja serwisu, więc mieszka w architekturze; silniki i ich matematyka zostają nietknięte
(rozdział XIII). `calc.tab` nadal jest w `assets/calculators.js` i nadal trafia do
atrybutu `data-tab` karty.

Adres kategorii jest jednocześnie kotwicą sekcji i wartością filtra: `#g-tiling` bez
skryptu skacze do nagłówka grupy, a ze skryptem otwiera centrum już zawężone do niej.
Dzięki temu linki kategorii ze strony głównej prowadzą w jedno miejsce w obu przypadkach.

Skrót „Od czego zacząć” nie twierdzi, że coś jest popularne — nie ma tu danych o ruchu,
z których dałoby się to policzyć. `popularCalcs()` liczy, do których kalkulatorów odsyła
najwięcej poradników (`GUIDES[].calcs`), a strona mówi to wprost pod nagłówkiem.

---


## 6. Relacje między modułami

```
KALKULATOR ──wynik──► [ zapisz ] ──► PROJEKT ──► KOSZTORYS ──► /p/<token>
                          │             │
                          │             ├─ POMIESZCZENIA   (element projektu, nie moduł)
                          │             └─ KALKULACJE      (wejście + wynik + jednostka + data)
                          │
                     KONTO (/app/) ──sync──► Firestore ──► aplikacja Android
                          │
                     PULPIT (/app/dashboard/) ──czyta──► projekty, ostatnie kalkulacje,
                                                      ostatnio używane narzędzia

MATERIAŁ ──► kalkulator właściwy dla rodzaju materiału
PORADNIK ──► kalkulatory wymienione w GUIDES[].calcs
SKLEPY   ──► osobne wejście, bez powiązań z projektem

Tylko PRO:
KLIENT ──► ZLECENIE ──► PROJEKT ──► KOSZTORYS ──► WYCENA ──► TERMINARZ ──► HISTORIA
```

Co z tego wynika i co trzeba utrzymać:

- **Projekt jest węzłem centralnym.** Wszystko, co użytkownik zapisuje, wisi na projekcie.
  Pro nie dokłada drugiego węzła — dokłada nad nim klienta i zlecenie.
- **Kosztorys jest widokiem projektu**, nie osobnym bytem. Dlatego `parent: "projects"`.
- **Pomieszczenie nie jest modułem.** Rozdział XVIII: element projektu. Nie dostaje trasy
  i nie wchodzi do menu.
- **Kalkulacja musi być odtwarzalna.** Rozdział XV: zapis trzyma kalkulator, dane wejściowe,
  wynik, jednostki i datę — nie samą liczbę.
- **Pulpit niczego nie posiada.** `/app/dashboard/` jest widokiem na to, co już jest
  w przeglądarce — nie zapisuje projektu, nie zapisuje pozycji kosztorysu i nie jest
  źródłem prawdy o niczym poza jedną własną listą: `liczmat-recent-calcs`
  (`assets/recent.js`), czyli które kalkulatory były używane i kiedy. Ta lista **nie jest
  dokumentem Firestore i nie synchronizuje się** — nie ma jej w `FIRESTORE_SYNC.md`, bo
  historia klikania w narzędzia to nie jest praca, którą warto przenosić na telefon.
- **Schemat danych jest wspólny z Androidem.** `assets/workspace.js` trzyma projekty
  w `localStorage` w tym samym kształcie dokumentu, co Firestore. Kontrakt:
  `docs/FIRESTORE_SYNC.md` + `core/sync/SyncContract.kt` w repo `3d-polednia/Materio`.
  Zmiana kształtu projektu jest zmianą w trzech miejscach naraz.

---

## 7. Przepływy użytkownika

Zapisane w `src/ia.mjs` jako `FLOWS` i sprawdzane: każdy krok musi wskazywać istniejącą
trasę, a przejście na wyższy poziom musi mieć krok, który je uzasadnia. Przepływ gościa,
który sięga po stronę `LICZMAT` bez kroku rejestracji, przerywa build.

**GOŚĆ** — cel: odpowiedź, teraz.

```
/  ──►  /kalkulatory/  ──►  /kalkulatory/<slug>/  ──►  WYNIK
                                                        │
                                    (dopiero tutaj) „Chcesz zachować ten wynik?”
                                                        │
                                                     /app/ → rejestracja
```

Wynik jest pełny bez konta. Rozdział II: rejestracja to następny krok, nie bramka.

**LICZMAT** — cel: uporządkować własną robotę.

```
kalkulator ──► WYNIK ──► „Dodaj do projektu” ──► /projekty/?id=<projectId>
                   (z wyborem projektu)              │           │
                                     MATERIAŁ ───────┘           │
                                          /kosztorys/ ──┴──► /app/dashboard/ (HISTORIA)
```

Strzałka „Dodaj do projektu” była do Sesji 16 skrótem: wynik wpadał do projektu
aktywnego, a odwiedzający dowiadywał się o tym słowem „Zapisano”. Teraz projekt się
**wybiera** (albo zakłada) obok przycisku, a po zapisie jest link **do tego projektu** —
to jest trzeci człon strzałki z rozdziału XV, wcześniej nieistniejący.

Ostatni krok — „powrót do wcześniejszych obliczeń” — ma od Sesji 14 własną stronę.
Pulpit jest tym miejscem, w którym widać naraz projekty, ostatnio zapisane kalkulacje
i kalkulatory, których się używało; wcześniej ten krok był w `FLOWS` samym opisem, bez
trasy.

### 7.1. Co niesie zapisana kalkulacja (Sesja 16)

Rozdział XV: „Nie zapisuj tylko samej liczby, jeśli później nie będzie wiadomo, skąd się
wzięła.” Dokument wyceny (`FIRESTORE_SYNC.md` §2) nie ma na to miejsca — `calculationType`
ma cztery wartości na piętnaście kalkulatorów, więc płytki, zaprawa i wylewka to ta sama
`SURFACE_COVERAGE`. Dołożenie pola na najwyższym poziomie dokumentu jest wykluczone:
telefon zbudowałby dokument od nowa z ustalonej mapy i pole zniknęłoby bez słowa — ten sam
mur, o który rozbija się opis projektu (§8.1c).

Jedyne pole kontraktu, które jest **wolnym tekstem i wraca nietknięte**, to `inputJson`:
jest kolumną `EstimationEntity`, aplikacja zapisuje w nim własną migawkę i nigdy nie czyta
cudzej (`SnapshotJson` ma `ignoreUnknownKeys`). Migawka Sesji 16 siedzi więc **w nim**, pod
kluczem `_lm`, obok płaskiej mapy pól, która była tam wcześniej:

```
inputJson = { area: "43.2", cov: "1.44", …,          ← to, co było (nadal działa)
              _lm: { v, calc, at, fields[], unit, tobuy, rows[] } }
```

**Nic w migawce nie jest tekstem w języku strony.** Pole jedzie jako klucz słownika
(`fld_area`), wybór z listy jako własny klucz (`opt_yes`), wiersz wyniku jako klucz plus
token silnika (`|n:21.6| m²`). Dlatego pozycja zapisana po polsku czyta się po niemiecku —
gdyby zapisać etykiety, zostałaby polska na zawsze. Klucze biorą się z `data-lk` i
`data-ok`, które build wypisuje przy każdym polu formularza.

Czyta to `wsLineSnapshot()` — obronnie, bo ten string przechodzi przez Firestore i przez
drugą aplikację: cokolwiek innego niż migawka tego serwisu daje `null`, a wtedy pozycja po
prostu nie ma sekcji „Skąd ta liczba” (pozycje sprzed Sesji 16 i pozycje wpisane ręcznie na
`/kosztorys/` nigdy jej nie mają — rozdział XXV zabrania pustego przycisku).

### 7.2. Lista materiałów projektu (Sesja 17)

Rozdział XVI dorysowuje strzałce z §7.1 czwarty człon: **KALKULATOR → WYNIK → DODAJ DO
PROJEKTU → MATERIAŁ TRAFIA DO LISTY**, z przykładem „Płytki | 26,4 m², Klej | 7 worków,
Fuga | 4 kg”.

**Ta lista jest w kontrakcie od pierwszej wersji i nikt jej po stronie web nie zapisywał.**
`users/{uid}/projects/{id}/shoppingItems/{itemId}` (`FIRESTORE_SYNC.md` §2) to
`ShoppingItemEntity` w Room, osobna funkcja `SyncContract.shoppingItemToDoc()`, osobna
walidacja `validShoppingItem()` we wdrożonych regułach — i renderowany blok na
`/p/<token>`. Aplikacja Android **zapisuje pozycję listy przy każdym zapisie kalkulacji**:
`CalculatorViewModel.save()` wstawia wycenę, bierze zwrócone id i wstawia obok pozycję
zakupową. Serwis wstawiał tylko wycenę, więc projekt zrobiony w przeglądarce docierał na
telefon i do udostępnionego linku z **pustą** listą materiałów, a ten sam projekt zrobiony
na telefonie — z pełną. Sesja 17 dokłada brakującą połowę, w tej samej kolejności.

Dokument, w całości (nic ponad kontrakt — pole dołożone na wierzchu zostałoby skasowane
przez telefon bez słowa, tak jak opis projektu w §8.1c):

```
shoppingItem { estimationId, name, materialCategory, quantity, unit,
               estimatedCostMinor, currencyCode, isPurchased, …sync }
```

Dwa pola różnią się od wiersza kosztorysu i to one robią z tego listę zakupów:

- **`quantity` jest liczbą, nie liczbą całkowitą.** `requiredUnits` na wycenie to `Int`
  w Room i `d.requiredUnits is int` w regułach, więc wiersz kosztorysu potrafi powiedzieć
  wyłącznie „26”. Materiał potrafi powiedzieć **26,4 m²** — czyli dokładnie pierwszy
  przykład rozdziału XVI.
- **`materialCategory` jest tu wolnym tekstem**, a na wycenie nazwą enuma. To alejka
  w markecie i to ona odróżnia listę zakupów od drugiego kosztorysu. Jedzie jako nazwa
  (`TILES`), nigdy jako słowo, więc wiersz zapisany po polsku czyta się po niemiecku —
  klucze `cat_*` są te same, których używa wybór materiału.

### 7.3. Notatka, edycja i własny materiał (Sesja 18)

Rozdział XVI wymienia sześć rzeczy, które użytkownik ma móc zrobić z materiałem: zmienić
ilość, nazwę i jednostkę, usunąć go, dodać własny i **dodać notatkę**. Usunięcie zrobiła
Sesja 17; resztę robi ta.

**Notatka: pole `note` obok kontraktu — i to jest bezpieczne, wbrew temu, co napisały
Sesje 15, 16 i 17.** Wszystkie trzy twierdziły, że pole dołożone do dokumentu zostanie
skasowane przez telefon przy najbliższej synchronizacji. Połowa tego jest prawdą:
`SyncContract.*ToDoc()` buduje dokument z ustalonej mapy, więc telefon nigdy takiego pola
nie wyśle. Druga połowa była błędna: `CloudSync.pushLocal()` wysyła tę mapę przez

```kotlin
.set(SyncContract.shoppingItemToDoc(item, estimationRemoteId), SetOptions.merge())
```

a **merge zapisuje wyłącznie klucze, które dostał**, i zostawia wszystkie pozostałe pola
dokumentu nietknięte. Każdy zapis w `CloudSync.kt` jest merge'em — pushe i nagrobki tak
samo. Ustalona mapa nie kasuje tego, o czym nie wspomina. Sprawdzone w kodzie, nie
z pamięci.

Trzy pozostałe bramki też przeszły:

- wdrożone reguły walidują `validShoppingItem()` po kształcie i **nie mają `hasOnly`**,
  więc serwer zapis przyjmuje;
- `shoppingItemFromDoc()` czyta po kluczach i ignoruje te, których nie zna, więc notatka
  nie może zepsuć kopii na telefonie;
- nic po stronie telefonu nie nadpisuje pozycji zakupowej bez merge'a.

Czego to **nie** daje: telefon notatki nie **pokaże**. `ShoppingItemEntity` nie ma na nią
kolumny, więc jest niewidoczna w aplikacji i nie ma jej w eksporcie CSV, dopóki repo
aplikacji nie doda kolumny (`FIRESTORE_SYNC.md`, `SyncContract.kt`, encja, migracja Room).
Notatka jest **przenoszona, nie gubiona** — i formularz mówi to wprost zamiast udawać.

Ta sama poprawka dotyczy §8.1c: opis projektu też przeżyłby telefon. To nie znaczy, że
należy go dopisać bez zmiany kontraktu — pole, którego druga strona nie zna, jest polem
niewidocznym na telefonie i nieudokumentowanym w `FIRESTORE_SYNC.md`. Znaczy tylko, że
powód „telefon to skasuje" był nieprawdziwy, a prawdziwy powód jest inny i słabszy.

**`assets/app.js` wysyła teraz z `{ merge: true }`.** Przeglądarka zawsze wysyła komplet
pól kontraktu, więc dla nich merge i podmiana to ten sam zapis — ale podmiana kasowałaby
każde pole, o którym przeglądarka nie wie. Dokładnie tak, jak telefon chroni notatkę,
przeglądarka kasowałaby ją przy pushu ze starszego urządzenia. Symetria jest tu sensem.

**Edycja jest formularzem w wierszu**, nie oknem `prompt()` — z tego samego powodu, dla
którego Sesja 15 wyrzuciła `prompt()` z tej strony. Zmienia nazwę, ilość, jednostkę,
alejkę i notatkę. Ceny w nim wtedy nie było: `estimatedCostMinor` to rozdział XVII i Sesja
19, która dołożyła do tego samego formularza szóste pole — cenę jednostkową (§7.4).

**Własny materiał** to wiersz, którego nic nie policzyło: `estimationId` jest `null`, koszt
zerowy, sekcji „skąd ta liczba" nie ma — ta sama odpowiedź, którą Sesja 16 dała pozycji
wpisanej ręcznie na `/kosztorys/`. Lista alejek jedzie z buildu w `window.LM_PROJ.aisles`,
żeby `/projekty/` nie musiało ładować 12 kB katalogu dla piętnastu słów. Jednostka jest
wolnym tekstem z podpowiedziami (`mu_pkg`, `mu_pc`, m², m, kg, l) — rozdział XVI prosi,
żeby dała się zmienić, więc lista podpowiada i niczego nie ogranicza.

Dwie decyzje warte zapisania, obie podjęte przez zgodność z aplikacją:

- **Pozycja wpisana ręcznie na `/kosztorys/` nie tworzy materiału.**
  `wsAddManualEstimation()` istnieje dla robocizny, dostawy i worka kupionego na oko;
  „Robocizna · 8 h” na liście zakupów jest gorsza niż krótsza lista.
- **Usunięcie jednej kalkulacji nie usuwa jej materiału.** `ProjectRepository`
  w repo aplikacji kaskaduje wyłącznie przy usunięciu **projektu**
  (`recordTombstones()` nagrobkuje wtedy i wyceny, i pozycje zakupowe); usunięcie samej
  wyceny nie rusza listy zakupów. Robienie tu inaczej znaczyłoby, że to samo kliknięcie
  daje inny wynik na telefonie i w przeglądarce. Usunięcie projektu kaskaduje po obu
  stronach, a „Cofnij” z Sesji 15 przywraca dokładnie te materiały, które zabrało.

**LICZMAT PRO** — cel: prowadzić pracę.

```
/klienci/ ──► /zlecenia/ ──► projekt ──► /kosztorys/ ──► /wyceny/ ──► /terminarz/ ──► HISTORIA
```

### 7.4. Koszty projektu (Sesja 19)

Rozdział XVII: „Materiały mogą mieć ceny", przykład `Klej | 7 × 35 PLN | = 245 PLN`, waluta
zgodna z wybraną przez użytkownika, a projekt może pokazywać **koszt materiałów, inne
koszty i sumę projektu**. Na końcu: „Nie buduj z tego systemu księgowego."

**Cena jednostkowa jest dzieleniem, nie polem.** Kontrakt trzyma na pozycji zakupowej
jedną kwotę — `estimatedCostMinor`, czyli **całość**. Sprawdzone w repo aplikacji, nie
z pamięci: `ShoppingItemEntity` nie ma kolumny na cenę jednostkową, `validShoppingItem()`
w regułach jej nie waliduje, a `ShoppingCsvExporter` jej nie drukuje. Pole dołożone obok
kontraktu przeżyłoby synchronizację (to ustaliła Sesja 18 przy notatce), ale mogłoby się
**rozjechać z kwotą**: telefon umie zmienić ilość albo koszt pozycji, nie dotykając pola,
o którym nic nie wie — a „35 PLN za sztukę" obok sumy, która nie jest już 7 × 35, jest
gorsze niż brak ceny jednostkowej. Dzielenie nie ma jak skłamać.

Dzielenie jest przy tym **dokładne dla wszystkiego, co ten serwis zapisuje**: każdy silnik
w `assets/calculators.js` liczy `cost = units × price`, więc `estimatedCostMinor / quantity`
oddaje dokładnie tę cenę, którą odwiedzający wpisał w kalkulatorze. `wsUnitPriceMinor()`
odpowiada `null`, gdy nie ma czego dzielić (ilość zero, kwota zero) — brak ceny to brak
ceny, nie „0,00 za sztukę".

**Zapis idzie w drugą stronę: ilość × cena.** Formularz materiału ma obie liczby obok
siebie, więc zapisywana jest ich suma (`wsItemCostMinor()`, zaokrąglenie **raz**, na końcu
— reguła Money). Dlatego zmiana 7 na 8 przy 35 PLN daje 280: obie liczby były na ekranie
w tej samej chwili. Sama ilość, bez ceny, nadal niczego nie przelicza — to reguła Sesji 18
i została nietknięta.

**Waluta: rozdział XVII kontra rozdział VI.** Pozycja, która nigdy nie miała kwoty, dostaje
walutę wybraną przez odwiedzającego w chwili wyceniania — to jest „waluta zgodna z wybraną
przez użytkownika". Pozycja, która **już** trzyma 245 PLN, zostaje przy PLN nawet gdy
odwiedzający przełączył się na euro: przestemplowanie zrobiłoby z 245 zł 245 €, czyli
przeliczenie po kursie 1:1, którego rozdział VI zabrania. Etykieta pola mówi wprost, w
jakiej walucie się wpisuje.

**Trzy figury i zasada „każda kwota liczona raz".** Zapisanie kalkulacji tworzy **dwa**
dokumenty niosące tę samą kwotę — wiersz kosztorysu i materiał (rozdział XVI) — więc
dodanie obu list do siebie podwoiłoby rachunek projektu zrobionego z samych kalkulacji.
`wsProjectCosts()` liczy więc tak:

```
koszt materiałów = lista zakupów
                 + kalkulacje, które nie mają na niej swojego materiału
inne koszty      = wiersze wpisane ręcznie (`manual` w inputJson)
suma projektu    = jedno + drugie
```

Materiał wygrywa z kalkulacją, bo to jego cenę odwiedzający edytuje. Kalkulacja bez
materiału (pozycja sprzed Sesji 17 albo taka, której materiał zdjęto z listy) wchodzi do
sumy sama — inaczej pieniądze znikałyby po cichu z rachunku, mimo że wiersz nadal stoi na
liście kalkulacji. `mixed` działa jak wszędzie: różne waluty są oznaczane, nigdy
przeliczane.

**„Inne koszty" to nie nowy magazyn.** To wiersze kosztorysu wpisane ręcznie —
`wsAddManualEstimation()` pisze je od zawsze i od zawsze zostawia w `inputJson` znacznik
`manual`. Ekran projektu daje na nie własną sekcję i własny formularz, który wkłada je do
**otwartego** projektu, a nie do aktywnego; `/kosztorys/` nie nazywa projektu, bo tamta
strona jest o aktywnym. Dlatego lista kalkulacji pokazuje wyłącznie to, co policzył
kalkulator: wiersz wpisany ręcznie stoi w swojej sekcji i nie jest drukowany dwa razy.

**Czego ta sesja świadomie nie zrobiła.** `/kosztorys/` nadal sumuje **wiersze kosztorysu**,
więc po ręcznej zmianie ceny materiału jego suma i suma projektu mogą się różnić. To nie
jest przeoczenie: kosztorys jest dokumentem tego, co policzono, a „materiały, robocizna,
koszty, marża, suma, waluta" to Sesja 24 (WYCENY). Marży, narzutu i podatku tu nie ma —
rozdział XVII kończy się zdaniem „Nie buduj z tego systemu księgowego".

### 7.5. Pomieszczenia jako element projektu (Sesja 20)

Rozdział XVIII w całości: „Pomieszczenia są elementem projektu", przykład `Projekt: Remont
łazienki / Pomieszczenie: Łazienka / Wymiary: 2,4 × 3,2 × 2,5 m`, do tego „Kalkulacje mogą
być przypisane do konkretnego pomieszczenia" i „Nie promuj pomieszczeń jako osobnego
wielkiego modułu na homepage".

**Kontrakt mówi coś przeciwnego, i oba zdania są prawdziwe.** `FIRESTORE_SYNC.md` §2 stawia
pomieszczenia w `users/{uid}/rooms/{roomId}` — **obok** projektów, nie w nich — i pisze
dlaczego: „Wybór pokoju i wybór kalkulatora to dwie niezależne osie". Pomieszczenie to
fizyczne miejsce: przeżywa projekt, dla którego je zmierzono, i jedno pomieszczenie może
obsłużyć kilka projektów. Powiązanie jest więc **polem**, a pole przeżywa. Sprawdzone
w repo `3d-polednia/Materio` dla pomieszczeń osobno, nie przepisane z Sesji 18:

- `RoomEntity` nie ma kolumny `projectId`, a `SyncContract.roomToDoc()` nie zapisuje
  takiego klucza — czyli telefon nigdy go nie wyśle;
- `CloudSync.pushLocal()` wysyła każde pomieszczenie przez
  `.set(SyncContract.roomToDoc(...), SetOptions.merge())`, a merge zapisuje **wyłącznie
  klucze, które dostał** — ustalona mapa nie kasuje tego, o czym nie wspomina;
- wdrożone reguły walidują `validRoom()` po kształcie i **nie mają `hasOnly`** → serwer
  zapis przyjmuje;
- `roomFromDoc()` czyta po kluczach i ignoruje nieznane → kopia w telefonie jest bezpieczna.

Czego to nie daje: telefon **nie pokaże** przypisania, bo nie ma go gdzie trzymać.
Powiązanie jest przenoszone, nie gubione — dokładnie jak notatka materiału z Sesji 18 — i
formularz mówi to odwiedzającemu wprost (`proj_room_phone`).

Serwis wpisywał `projectId` do każdego pomieszczenia **od początku istnienia magazynu i ani
razu go nie przeczytał**; `/app/` nie wysyłał go w ogóle, więc powiązanie ginęło na granicy
przeglądarki. Sesja 20 je wysyła, czyta i pozwala zmienić.

**Usunięcie projektu nie kasuje jego pomieszczeń.** `ProjectRepository.recordTombstones()`
w aplikacji nagrobkuje wyceny i pozycje zakupowe i na tym kończy — pomieszczenia nie są
podkolekcją projektu. Robienie tu inaczej znaczyłoby, że to samo kliknięcie daje inny wynik
w przeglądarce i na telefonie (argument Sesji 17). Pomieszczenie zostaje, zachowuje swoje
`projectId` — i właśnie dlatego „Cofnij" przywraca projekt razem z jego pomieszczeniami.

**Przypisanie kalkulacji siedzi w `inputJson`, pod kluczem `_room`.** `EstimationEntity` ma
`projectId` i nie ma `roomId`; `estimationToDoc()` nie zapisuje takiego klucza, a
`validEstimation()` go nie waliduje. Reguła merge'a znaczy, że pole na najwyższym poziomie
dokumentu też by przeżyło — ale `inputJson` jest polem, które **już** jest kontraktem,
wolnym tekstem i wraca nietknięte, i Sesja 16 włożyła tam migawkę dokładnie z tego powodu.
Drugi mechanizm do tej samej roboty to druga rzecz do pilnowania. `_room` stoi **obok**
`manual` na najwyższym poziomie mapy, a nie w `_lm`, bo wiersz wpisany ręcznie nie ma
migawki, a może należeć do pomieszczenia.

Identyfikator pomieszczenia powstaje w tej przeglądarce, więc na telefonie nic nie znaczy —
tam i tak nie ma kolumny, do której miałby trafić. Przypisanie jest przenoszone, nie
pokazywane.

**Gdzie się przypisuje.** Przy zapisie wyniku (lista obok wyboru projektu, z pomieszczeniem
wybranym już wtedy, gdy to z niego wzięto wymiary) i później, na ekranie projektu, listą
przy każdym wierszu kalkulacji. Pokazywane są **wyłącznie pomieszczenia otwartego
projektu**: `wsAddEstimation()` odrzuca cudze, więc oferowanie ich byłoby oferowaniem
przypisania, które i tak przepada. Projekt bez pomieszczeń nie dostaje listy w ogóle —
rozdział XXV zabrania przycisku, za którym nic nie ma.

**Czego ta sesja świadomie nie zrobiła.** Nie ma pomieszczeń na stronie głównej ani
w nawigacji — rozdział XVIII wprost tego zabrania. Materiał nie dostał pomieszczenia:
rozdział mówi o kalkulacjach, a lista zakupów jest jedna na projekt, bo kupuje się raz.
Grupowania kalkulacji „po pomieszczeniach" też nie ma — wiersz mówi, do którego należy,
a przebudowa listy w drzewo to zmiana ekranu, nie zmiana z rozdziału XVIII.

#### 7.5a. Gdzie się wybiera projekt (poprawki po Sesji 20)

Właściciel zgłosił po Sesji 20, że **nie da się przypisać pokoju do projektu**, i miał
rację w trzech miejscach naraz:

- formularz na `/projekty/` wkładał pomieszczenie do **aktywnego** projektu, nie pytając
  i nie mówiąc o tym ani słowa — więc wyglądało to jak brak przypisania;
- ten sam formularz oddawał `wsDim()` surowy tekst z pola, więc `„3,5"` czytało się jako
  `Number("3,5")`, czyli `NaN` → 0: pokój wpisany tak, jak wpisuje Polak, wychodził
  `3 × 0 × 2,6 m`;
- `addRoom()` w `/app/` **w ogóle nie zapisywał `projectId`**, więc pomieszczenie założone
  na koncie nie należało do niczego i nigdy nie mogło się pokazać pod projektem.

Po poprawce: formularz ma listę projektów (domyślnie aktywny, plus **„— bez projektu —”**
jako prawdziwą odpowiedź), wiersz pomieszczenia ma tę samą listę do przeniesienia — ten sam
kształt kontrolki, co lista pomieszczeń przy wierszu kalkulacji — a `/app/` rysuje
pomieszczenia **wewnątrz** projektu i wysyła `projectId`. „Bez projektu” nie jest brakiem:
pomieszczenie zmierzone, zanim jest co pod nim podpiąć, nadal wypełnia kalkulator, i tak
właśnie wygląda każde pomieszczenie przyniesione z telefonu.

#### 7.5b. Menu na `/app/` (poprawki po Sesji 20)

`/app/`, `/app/dashboard/` i `/p/` nie mają własnego języka — niosą cały słownik i tłumaczą
się w miejscu. Dlatego `chrome()` wypisywał **jeden** link, wpisany na sztywno po polsku:
drugiego nie dałoby się zrobić poprawnym po niemiecku. Skutkiem, który zgłosił właściciel,
było menu znikające po wejściu na konto.

Rozwiązane tym samym wzorcem, którym pulpit rozwiązał to dla swoich kafelków: build wypisuje
adresy `DEFAULT_LANG` i podaje **wszystkie języki** w `window.LM_NAV`, a każdy link niesie
`data-nav-route`. `assets/i18n-runtime.js` przepina `href` przy `langchange`, obok
przepisywania etykiet. Bez skryptu link nadal działa — pokazuje polską stronę, co jest
prawdą, a nie placeholderem.

**`/p/<token>` zostaje z krótkim menu, i to jest decyzja.** Tamta strona to udostępniona
wycena otwierana przez *klienta* wykonawcy, a nie przez właściciela konta. Pełna nawigacja
robi z wyceny lejek.

Do menu doszła też zakładka **„Aplikacja”** (`/aplikacja/`), o którą poprosił właściciel.
Rozdział X nadal zabrania **wypychania** aplikacji na stronie głównej i strona główna nie
mówi o niej ani słowa więcej niż przedtem; link na końcu rzędu to nie to samo. Limit linków
w nagłówku podniesiony z czterech na pięć — **zmierzony, nie założony**:
`scripts/test-pages.mjs` sprawdza, że rząd zostaje jednolinijkowy w czterech językach na
900 / 1000 / 1160 / 1280 px, dla gościa (cztery widoczne) i dla zalogowanego (pięć).
Poniżej 900 px nawigacja jest szufladą i zawinąć się nie może. Szósty link nadal wywala
build, bo szóstego nikt nie mierzył.

---

## 8. Otwarte decyzje

Do rozstrzygnięcia przez właściciela, zanim dotknie ich któraś z kolejnych sesji.

### 8.1. ~~Poziom `/projekty/` i `/kosztorys/`~~ — rozstrzygnięte po Sesji 20

**Decyzja właściciela (2026-08-14): zakładka „Projekty” w menu tylko dla zalogowanych.**
Zakres jest węższy, niż brzmi, i ta różnica jest tu najważniejsza:

- **`level` obu tras zostaje `GUEST`.** Strona nie jest bramkowana i **nie może być**: to
  statyczny plik nad wierszami w `localStorage` **tej** przeglądarki, a `FIRESTORE_SYNC`
  §1.2 mówi, że liczenie nigdy nie wymaga konta. Gość, który wejdzie na `/projekty/` —
  z linku „Otwórz projekt” pod zapisanym wynikiem, z zakładki, z wyszukiwarki — zobaczy
  swoje własne projekty.
- **Nowe pole `navLevel` decyduje wyłącznie o linku.** `navLevel: LICZMAT` na trasie
  `projects` znaczy: menu oferuje ją komuś, kto ma konto. Powód jest treściowy, nie
  bezpieczeństwowy — gość, któremu menu proponuje „Projekty”, dostaje propozycję listy,
  która jest pusta, dopóki czegoś nie policzy.
- **Strona zostaje indeksowana i zostaje w `sitemap.xml`.** Link jest w HTML dla każdego;
  chowa go arkusz stylów, i tylko wtedy, gdy dokument niesie `data-lm-level`. Bez
  JavaScriptu klasa `.js` nigdy nie zostaje dopisana, więc reguła nie działa — czyli
  Googlebot i przeglądarka bez skryptu widzą link dalej.
- **Poziom stemplowany jest w skrypcie w `<head>`**, tym samym, który stosuje motyw —
  jeden odczyt `localStorage` więcej i zero mignięcia. `assets/account.js` ładuje się na
  końcu dokumentu i jest na to za późno; on tylko dopisuje atrybut po wylogowaniu bez
  przeładowania. Znacznik `liczmat-signed-in` **nadal jest podpowiedzią i nadal niczego nie
  bramkuje** — teraz decyduje o treści menu tak samo, jak decydował o zdaniu pod wynikiem.

Poniżej zostaje zapis sporu, bo tłumaczy, dlaczego kod wygląda tak, jak wygląda.

---

**Konflikt jest realny.** Rozdział II wymienia wprost, czego gość **nie może**: zapisywać
kalkulacji, tworzyć projektów, tworzyć list materiałów. Tymczasem serwis dziś pozwala na
wszystkie trzy rzeczy bez konta — `assets/workspace.js` trzyma to w `localStorage` — a
`CLAUDE.md` i `docs/FIRESTORE_SYNC.md` §1.2 mówią: „liczenie nigdy nie może wymagać konta,
nie przenoś tego za ścianę logowania”.

W `src/ia.mjs` obie trasy mają poziom `GUEST`, czyli **stan faktyczny został zachowany** —
Sesja 3 nie miała mandatu na zmianę funkcjonalną.

Propozycja, którą właściciel zatwierdził wyżej: **zostawić `GUEST`** i doprecyzować, że rozdział II opisuje
granicę konta, a nie granicę przeglądarki. Konto dokłada wtedy rzeczy, których lokalny
schowek nie umie: synchronizację między urządzeniami i telefonem, przetrwanie wyczyszczenia
przeglądarki, udostępnianie kosztorysu linkiem. To zgadza się z własnym zdaniem rozdziału II
(„rejestracja ma być naturalnym kolejnym krokiem, a nie barierą”) i nie odbiera darmowemu
kontu żadnej wartości.

Alternatywa — przenieść projekty za logowanie — jest zgodna z literą rozdziału II, ale
łamie `FIRESTORE_SYNC` §1.2 i zabiera gościowi to, co dziś działa. Właściciel jej **nie**
wybrał: schowana została zakładka, nie strona.

**Sesja 8 uderzyła w to samo.** Rozdział XII każe pokazać niezalogowanemu zdanie
„Zaloguj się lub załóż darmowe konto, aby zapisać wynik” — czyli zakłada, że bez konta
wyniku zapisać się nie da. Serwis zapisuje go dziś bez konta, do `localStorage`. Sesja 8
zachowała stan faktyczny tak samo jak Sesja 3: przycisk „Dodaj do projektu” działa od
razu, a zdanie obok mówi, co dokłada konto (telefon, przetrwanie wyczyszczenia
przeglądarki), zamiast udawać, że przycisk go potrzebuje. Jeżeli właściciel rozstrzygnie
spór po stronie rozdziału II, to zdanie i ten przycisk zmieniają się razem — treść jest
w kluczach `calc_save_out` / `calc_save_in`, a nie wpisana w kod.

Żeby to zdanie mogło w ogóle rozróżnić zalogowanego od niezalogowanego, `/app/` zostawia
w `localStorage` znacznik `liczmat-signed-in` (Sesja 8). Strony kalkulatorów nie ładują
Firebase — byłoby to zapytanie sieciowe na każdej z sześćdziesięciu stron dla jednego
zdania. Znacznik **decyduje wyłącznie o treści**: nic nie wolno na nim bramkować, bo
`FIRESTORE_SYNC` §1.2 zabrania wymagać konta do liczenia, a znacznik bywa nieaktualny
(wylogowanie w innej karcie, wygasły token). Jest wypisany na `/cookies/`.

### 8.1a. ~~Poziom `/app/dashboard/`~~ — rozstrzygnięte po Sesji 14

Ta sama sprawa, jeszcze raz, na nowej stronie. Sesja 3 zadeklarowała trasę `dashboard`
jako `LICZMAT`, bo plan nazywa ją „dashboardem darmowego użytkownika”. Sesja 14 zbudowała
ją jako **`GUEST`** i to jest zmiana wobec deklaracji, więc jest tutaj, a nie po cichu
w kodzie.

Powód jest ten sam co w §8.1, tylko ostrzejszy. Pole `level` w `src/ia.mjs` mówi, czego
strona **wymaga**, a nie co **oferuje**. Pulpit nie czyta niczego poza `localStorage` tej
przeglądarki: projekty i kosztorysy z `assets/workspace.js`, listę użytych narzędzi
z `assets/recent.js`. Nie ma tam ani jednego bajtu, który przyszedł z serwera. Jedyną
rzeczą, którą dałoby się zabramkować, jest znacznik `liczmat-signed-in` — a on **bywa
nieaktualny** (wylogowanie w innej karcie, wygasły token), więc bramka na nim schowałaby
komuś jego własne projekty w chwili, w której token wygasł. To byłoby zgubienie pracy
odwiedzającego na jego oczach.

Gość widzi więc swoje dane i kartę „Ten pulpit jest tylko w tej przeglądarce” z linkiem
do rejestracji — zamiast zamkniętych drzwi.

**Właściciel zatwierdził `GUEST` (2026-08-13).** Odrzucona alternatywa: `LICZMAT`
z przekierowaniem na `/app/?next=/app/dashboard/` — wtedy nieaktualny znacznik odcina
zalogowanego od jego własnych, lokalnych danych, i to był argument rozstrzygający.

Przy tej samej okazji **adres zmienił się z `/app/pulpit/` na `/app/dashboard/`**. Slug
jest permanentny (`CLAUDE.md`), a strona wyszła na świat tego samego dnia i nic z zewnątrz
na nią nie linkowało, więc zmiana kosztowała jeden build zamiast wiecznego przekierowania.
Powód: `/app/` i `/p/` są bezjęzykowe, a `pulpit` to polskie słowo w adresie, którego
Niemiec i tak nie przeczyta. Widoczna nazwa zostaje przetłumaczona — „Pulpit”,
„Übersicht”, „Dashboard”, „Панель” (`nav_dashboard`); po angielsku zmienia się tylko URL.

### 8.1b. ~~Poziom `project`~~ — rozstrzygnięte w Sesji 15

Trzeci raz to samo pytanie. Sesja 3 zadeklarowała trasę `project` jako `LICZMAT`. Sesja 15
zbudowała ją jako **`GUEST`**, i to znowu jest zmiana wobec deklaracji, więc stoi tutaj.

Argument jest identyczny jak w §8.1 i §8.1a i tym razem jest wymuszony konstrukcyjnie:
`project` to **widok** `/projekty/`, czyli ten sam plik. Strona nie może wymagać więcej
niż strona, w którą jest wpisana — inaczej `/projekty/` musiałoby bramkować kawałek
samego siebie. Build tego pilnuje wprost (§9): widok o poziomie wyższym niż rodzic
przerywa build.

Nie ma tu też czego bramkować. Projekt jest wierszem w `localStorage` **tej**
przeglądarki, wpisanym tam przez tego, kto przy niej siedzi. Konto dokłada synchronizację
z telefonem, a nie prawo do odczytu własnej pracy.

### 8.1c. Opis, notatki i historia projektu — czeka na zmianę kontraktu

Rozdział XIV mówi, że projekt może zawierać nazwę, opis, pomieszczenia, kalkulacje,
materiały, koszty, notatki i historię. Sesja 15 zbudowała CRUD na tym, co dokument
projektu **naprawdę niesie**: `name` i `archived`, plus stemple `createdAt` / `updatedAt`,
które są dzisiejszą „historią”.

**Opisu i notatek celowo nie dopisano.** Reguły bezpieczeństwa sprawdzają kształt
dokumentu, a nie listę pól, więc przeglądarka mogłaby taki dokument zapisać — ale
`SyncContract.projectToDoc()` w repo `3d-polednia/Materio` buduje dokument z ustalonej
mapy, a `ProjectEntity` nie ma gdzie takiego pola trzymać. Telefon nadpisałby całość przy
najbliższej synchronizacji i opis zniknąłby **bez słowa**. To jest zmiana kontraktu
(`docs/FIRESTORE_SYNC.md`, `SyncContract.kt`, encja Room, migracja), czyli praca po
stronie aplikacji — rozdział VII, poza zakresem sesji webowej. **Do decyzji właściciela.**

Pomieszczenia (sesja 20), materiały (17), koszty (19) i zapis kalkulacji (16) mają własne
sesje i dlatego nie ma po nich pustych sekcji na stronie projektu: rozdział XXV zabrania
martwego przycisku, a pusty nagłówek jest tym samym, tylko cichszym.

### 8.2. `/app/` czy `/konto/` — Sesja 13 nie przeniosła, i dlaczego

Rozdział IX wymienia `/konto`. Konto siedzi dziś pod `/app/`. Sesja 13 przebudowała samą
stronę i **adresu nie ruszyła**, bo tak mówi ten sam rozdział IX: „Nie traktuj tej
struktury jako absolutnej. Jeżeli podczas implementacji zostanie znalezione lepsze
rozwiązanie, **nie zmieniaj go samodzielnie w ramach bieżącego zadania. Zgłoś propozycję
w raporcie**”.

Propozycja więc jest: przenieść na `/konto/`, bo `/app/` myli się z `/aplikacja/` (§8.3),
a rozdział IX wymienia właśnie `/konto`. Koszt jest niewielki, ale nie zerowy i nie
wyłącznie webowy:

- `URL_APP` w `src/site.mjs`, `404.html`, linki w stopce i w nagłówku, `robots.txt` —
  wszystko to jedno miejsce każde, bo strony generuje build;
- **przekierowanie ze starego adresu**, bo `/app/` jest w obiegu: linkuje do niego
  `docs/FIRESTORE_SYNC.md` w repo aplikacji, a `404.html` obsługuje obok niego `/p/<token>`;
- lista **autoryzowanych domen** Firebase się nie zmienia — są w niej hosty
  (`materio-app.com`), nie ścieżki. Wcześniejsza wersja tego akapitu twierdziła inaczej.

**Potrzebna decyzja właściciela.** Sama zmiana to jedna krótka sesja.

### 8.3. Nazwa `/aplikacja/` przy `/app/`

Dwie strony o niemal identycznej nazwie znaczą co innego: `/aplikacja/` to strona aplikacji
Android, `/app/` to konto. Slug `/aplikacja/` jest wieczny (§3), więc zmiana wymaga
przekierowania. Naturalne rozwiązanie to punkt 8.2 — jeśli konto przeniesie się na
`/konto/`, kolizja nazw znika sama.

### 8.4. ~~Waluta a poziom dostępu~~ — rozstrzygnięte w Sesji 13

Pytanie brzmiało, czy waluta ma być polem profilu synchronizowanym przez Firestore.
**Zostaje w `localStorage`**, i nie jest to preferencja, tylko stan faktyczny kontraktu:
reguły dopuszczają w `users/{uid}` **wyłącznie** `createdAt`, `lastSeenAt` i `appVersion`
(`hasOnly` przy tworzeniu, `affectedKeys().hasOnly` przy zapisie). Dopisanie waluty do
profilu dostałoby dziś 403, a zmiana reguł leży w repo `3d-polednia/Materio` — poza
zakresem prac nad webem (rozdział VII). Do tego aplikacja Android bierze walutę z języka
(`AppLanguage.defaultCurrency`), więc pole w chmurze musiałoby najpierw mieć drugą stronę.

Nic się przez to nie fałszuje: pozycja kosztorysu zachowuje `currencyCode` z chwili
zapisu, a `/kosztorys/` mówi wprost, gdy waluty się mieszają. Otwarte zostaje to samo, co
było — „Waluta a aplikacja Android” w `MASTER_PLAN.md`.

Sesja 13 dołożyła obok **drugi wybór, który jest wyborem urządzenia, a nie konta**:
`liczmat-remember` — czy sesja przeżywa zamknięcie przeglądarki. Ten świadomie nigdy nie
pojedzie do chmury: „nie pamiętaj mnie na tym komputerze” traci sens, gdy synchronizuje
się na wszystkie urządzenia naraz.

Decyzje otwarte po Sesjach 1–2 (slogan, waluta w aplikacji Android, języki Androida,
domena, nazwy przy „materio”) nadal stoją — patrz `MASTER_PLAN.md`.

---

## 9. Co build teraz egzekwuje

Dodane w Sesji 3, uruchamiane przez `node scripts/build.mjs` i `--check`:

| Sprawdzenie | Co przerywa build |
|---|---|
| zbiór stron = `livePaths()` | strona zbudowana, ale niezadeklarowana; trasa zadeklarowana, ale niezbudowana |
| istnienie stron pisanych ręcznie | brak `privacy-policy.html` albo `404.html` |
| poziomy dostępu | nieznany poziom; trasa `PRO` bez opisu, co widzi darmowy użytkownik |
| drzewo | nieznany rodzic; cykl w drzewie |
| trasy planowane | brak numeru sesji; działający `path`; obecność w menu; slug kolidujący z istniejącą sekcją lub z inną trasą planowaną |
| nawigacja | dwa linki na tej samej pozycji (w stopce: w tej samej kolumnie); link bez klucza tłumaczenia; więcej niż cztery linki w menu (Sesja 5) |
| przepływy | krok na nieistniejącą trasę; przepływ sięgający po wyższy poziom bez kroku, który go nadaje |
| strona główna (Sesja 6) | inna liczba drzwi niż trzy albo inna kolejność poziomów; drzwi na nieistniejącą trasę; brak tekstu drzwi w słowniku |
| centrum kalkulatorów (Sesja 7) | kalkulator w żadnej kategorii albo w dwóch naraz; kategoria z nieznanym kalkulatorem lub pusta; brak nazwy albo opisu kategorii w słowniku; skrót „Od czego zacząć”, którego nie potwierdza żaden poradnik |
| poziomy konta (Sesja 13) | inna liczba poziomów niż trzy albo inna kolejność; dwa poziomy z tym samym kluczem; poziom, który nie mówi, co potrafi; poziom wskazujący nieistniejącą trasę; brak któregokolwiek klucza `acc_*` w którymkolwiek z czterech języków |
| widoki (Sesja 15) | widok bez rodzica, na trasie planowanej albo na innym widoku; widok indeksowany; widok w menu lub w stopce; widok wymagający wyższego poziomu niż rodzic; widok inaczej zlokalizowany niż rodzic; adres widoku poza adresem rodzica albo gubiący identyfikator; `view: true` na trasie, która nie jest `LIVE` |

Wszystkie siedem zostało sprawdzone negatywnie — celowo zepsute i build faktycznie padł.
Tak samo sprawdzone są dwa dołożone w Sesji 5 (piąty link w menu, dwie pozycje na tym
samym miejscu w tej samej kolumnie stopki), cztery z Sesji 6 (czwarte drzwi, drzwi
z poziomem nie na swoim miejscu, drzwi na trasę, której nie ma, brakujący klucz
tłumaczenia drzwi) i cztery z Sesji 7: kalkulator wyjęty z kategorii, kalkulator wpisany
do dwóch kategorii, nieznany identyfikator w kategorii i skasowany klucz `cc_*_d`.

`validateCalcHub()` stoi obok `validateIA()`, a nie w niej: potrzebuje `CALCS` i `GUIDES`,
czyli skryptów przeglądarkowych, które dopiero `scripts/build.mjs` wykonuje.
