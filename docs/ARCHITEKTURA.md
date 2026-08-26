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

373 wygenerowane strony: 37 stron logicznych × 10 języków, plus trzy bezjęzykowe.
Adresy w kolumnie „URL (PL)”; pozostałe języki mają prefiks (`/en/…`, `/de/…`, `/uk/…`,
`/cs/…`, `/sk/…`, `/ro/…`, `/hr/…`, `/sr/…`, `/ru/…`) i własne slugi z `SECTION`
i `CALC_SLUG` w `src/site.mjs`.

| Trasa (`id`) | URL (PL) | Poziom | Rodzic | Indeks | Sztuk |
|---|---|---|---|---|---|
| `home` | `/` | GUEST | — | tak | 10 |
| `calculators` | `/kalkulatory/` | GUEST | `home` | tak | 10 |
| `calculator` | `/kalkulatory/<slug>/` | GUEST | `calculators` | tak | 150 |
| `materials` | `/materialy/` | GUEST | `home` | tak | 10 |
| `guides` | `/poradniki/` | GUEST | `home` | tak | 10 |
| `guide` | `/poradniki/<slug>/` | GUEST | `guides` | tak | 80 |
| `stores` | `/sklepy/` | GUEST | `home` | tak | 10 |
| `android` | `/aplikacja/` | GUEST | `home` | tak | 10 |
| `projects` | `/projekty/` | GUEST | `home` | tak | 10 |
| `project` | `/projekty/?id=…` | GUEST | `projects` | **nie** | 0 — widok |
| `estimate` | `/kosztorys/` | GUEST | `projects` | tak | 10 |
| `clients` | `/klienci/` | **PRO** | `home` | tak | 10 |
| `client` | `/klienci/?id=…` | **PRO** | `clients` | **nie** | 0 — widok |
| `jobs` | `/zlecenia/` | **PRO** | `clients` | tak | 10 |
| `job` | `/zlecenia/?id=…` | **PRO** | `jobs` | **nie** | 0 — widok |
| `quotes` | `/wyceny/` | **PRO** | `jobs` | tak | 10 |
| `quote` | `/wyceny/?id=…` | **PRO** | `quotes` | **nie** | 0 — widok |
| `calendar` | `/terminarz/` | **PRO** | `jobs` | tak | 10 |
| `liczmat-pro` | `/liczmat-pro/` | GUEST | `home` | tak | 10 |
| `cookies` | `/cookies/` | GUEST | `home` | tak | 10 |
| `account` | `/app/` | GUEST | `home` | **nie** | 1 |
| `dashboard` | `/app/dashboard/` | GUEST | `account` | **nie** | 1 |
| `share` | `/p/` | GUEST | `estimate` | **nie** | 1 |
| `privacy` | `/privacy-policy.html` | GUEST | `home` | tak | pisana ręcznie |

`404.html` też jest pisany ręcznie i nie jest trasą — jest obsługą błędu i przekierowaniem
(patrz §3).

`clients` (Sesja 22) jest pierwszą trasą `PRO`, która naprawdę istnieje, `jobs` (Sesja 23)
drugą, `quotes` (Sesja 24) trzecią, `calendar` (Sesja 25) czwartą. To jedyne strony
w inwentarzu, których link jest ukryty przed kimś poniżej Pro (`navLevel`, §5). Żadna
z nich nie jest bramkowana — patrz §7.7, §7.8, §7.9 i §7.10.

`liczmat-pro` (Sesja 29) jest jedyną trasą, która **opisuje** Pro, nie będąc Pro: poziom
`GUEST`, indeksowana, w stopce dla każdego. Paywall stoi na narzędziu, nie na opisie
narzędzia — opis tego, za co ktoś miałby zapłacić, schowany za tą zapłatą, to koło.

`calendar` jest jedyną trasą `PRO` **bez** widoku obok siebie, i to nie z przeoczenia:
terminarz nie zapisuje własnych wierszy, więc nie ma czego otwierać — wiersz prowadzi do
zlecenia, na `/zlecenia/?id=…` (§7.10).

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

Czego w tym inwentarzu **nie ma**, a plan wymienia w rozdziale IX: `/konto`. Rolę konta
pełni `/app/` — jedna strona bezjęzykowa, `noindex`, bo pokazuje cudze dane.
`/liczmat-pro` zbudowała Sesja 29 i jest wyżej w tabeli.

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
`noindex` w metatagu.

**`noindex` i `Disallow` nie sumują się — znoszą się.** Do sesji 30 `robots.txt` zabraniał
crawlowania `/app/` i `/p/`, a obie strony miały do tego `noindex` w metatagu. To jedno
kasowało drugie: robot, któremu każe się nie pobierać strony, nigdy nie przeczyta `noindex`
na niej, a sam adres i tak może trafić na listę wyników, jeżeli ktoś gdzieś do niego
linkuje. Przy `/p/<token>` to jest gorsze niż zwykłe zaindeksowanie, bo token w adresie
**jest** całym poświadczeniem — taka pozycja opublikowałaby go. Dlatego `Disallow` zniknął,
a `noindex` został: robot pobiera stronę, czyta zakaz i wyrzuca adres z indeksu.
`scripts/test-seo.mjs` §1b pilnuje, żeby żaden `Disallow` nie zasłonił strony z `noindex`.

**`sitemap.xml` bierze się z tego pliku, nie z drugiej listy.** `sitemapUrls()` w
`src/ia.mjs` czyta pole `indexable` z tras i rozwija je na dziesięć języków; `scripts/build.mjs`
porównuje wynik z tym, co naprawdę zapisał, i przerywa build, gdy strona z `noindex` trafiła
do sitemapy albo indeksowalna z niej wypadła. Wcześniej sitemapa była piętnastoma wywołaniami
`add()` w buildzie — drugą kopią mapy serwisu, którą każda nowa sesja musiała pamiętać, żeby
rozszerzyć.

**`lastmod` mówi prawdę albo nie ma go wcale.** Data przenosi się z poprzedniej sitemapy,
jeżeli build nie zmienił treści strony (porównanie ignoruje `?v=`, więc podbicie `STAMP` nie
przestempluje całego serwisu). Google czyta `lastmod` tylko wtedy, gdy jest wiarygodny, więc
371 adresów datowanych na dziś przy każdym buildzie kasowało to pole dla całej domeny.
Ręcznie pisana polityka prywatności nie dostaje `lastmod` w ogóle — build jej nie generuje,
więc nie wie, kiedy się zmieniła. `<changefreq>` i `<priority>` zniknęły: Google ich nie
czyta, nikt inny też, a każda nowa strona musiała je sobie wymyślić.

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

**Nie ma już żadnej.** Sesja 29 zbudowała `/liczmat-pro/` — ostatnią trasę ze statusem
`PLANNED` — więc lista jest pusta, a maszyneria zostaje: `src/ia.mjs` nadal potrafi
zadeklarować stronę, której jeszcze nie ma (status `PLANNED`, numer sesji, `plannedSlug`
w dziesięciu językach), a build nadal pilnuje, żeby taka trasa nie zajęła adresu, który już
działa, i żeby nie trafiła do menu przed czasem. Pusta lista to stan, nie usunięcie
mechanizmu: następna strona, o którą poprosi plan, zaczyna dokładnie tak samo.

Slugi planowanej trasy przenoszą się do `SECTION` w `src/site.mjs` w chwili, gdy sesja ją
buduje: Sesja 22 przeniosła w ten sposób `clients` (`klienci` / `kliyenty` / `kunden` /
`clients`…), Sesja 23 `jobs` (`zlecenia` / `zamovlennya` / `auftraege` / `jobs`…),
Sesja 24 `quotes` (`wyceny` / `koshtorysy-pro` / `angebote` / `quotes`…), Sesja 25
`calendar` (`terminarz` / `kalendar` / `termine` / `schedule`…), a Sesja 29
`liczmat-pro` — to samo słowo we wszystkich dziesięciu językach, bo to nazwa własna
produktu, a przetłumaczony slug dałby jednemu produktowi dziesięć nazw. Żadna z tych
pięciu nie zmieniła choćby jednej litery: slug jest trwały od momentu, w którym został
zaplanowany.

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
LiczMat   Kalkulatory · Materiały · Projekty · LiczMat Pro · Aplikacja
          [ język ] [ waluta ] [ Konto ]        [ motyw ] [ menu ]
```

**Pięć linków to maksimum** i `validateIA()` tego pilnuje. Sesja 5 zmierzyła pasek
w przeglądarce i postawiła sufit na czterech: sześć linków plus selektory nie mieściło się
w jednym wierszu poniżej 1080px (po niemiecku „Die App” i „Mein Konto” łamały się na dwie
linie). `Sklepy` zeszły wtedy do stopki — to narzędzie, a nie krok żadnego przepływu.
Piąty link, `Aplikacja`, właściciel dopisał po Sesji 20 i został **zmierzony**, a nie
założony: `scripts/test-pages.mjs` §7 sprawdza, że wiersz zostaje jednolinijkowy
w dziesięciu językach przy 1061 / 1100 / 1160 / 1280 px. Szósty nie był mierzony i build
go odrzuca.

**Sesja 40 zamieniła `Poradniki` na `LiczMat Pro`** — decyzja właściciela, zapisana
w planie naprawczym („w nagłówku ustępują Poradniki”). Rozdział X chce, żeby ze strony
głównej wychodziły trzy kierunki: Kalkulatory, LiczMat i LiczMat Pro; strona, którą trzeba
znaleźć, **zanim** ktokolwiek zapłaci, była do tej pory dostępna wyłącznie ze stopki i ze
ściany, na którą ktoś już wpadł. Poradniki nie zniknęły: trasa dalej jest `LIVE`,
indeksowalna i w `sitemap.xml`, stoi w kolumnie „Produkt" w stopce i linkuje do niej strona
główna oraz strony kalkulatorów.

Zamiana etykiety to **pomiar**, nie zmiana nazwy — wiersz, który mieści pięć krótkich słów,
nie musi zmieścić pięciu dłuższych — więc ten sam test przebiegł jeszcze raz przy tych
samych czterech szerokościach i w tych samych dziesięciu językach. Zmierzone przy 1061px,
konto zalogowane (pięć widocznych linków), szerokość `.nav-list`:

| Język | przed | po | |
|---|---|---|---|
| pl | 397 px | 412 px | +15 |
| uk | 439 px | 465 px | +26 |
| de | 377 px | 395 px | +18 |
| en | 373 px | 404 px | +31 |
| cs | 377 px | 405 px | +28 |
| sk | 381 px | 409 px | +28 |
| ro | 388 px | 417 px | +29 |
| hr | 371 px | 408 px | +37 |
| sr | 383 px | 408 px | +25 |
| **ru** | **498 px** | **488 px** | **−10** |

Najszerszy wiersz na serwisie jest rosyjski i to on ustawił próg 1061px w Sesji 32 —
a ten jako jedyny **zwęził się**, bo „Руководства” jest dłuższe niż „LiczMat Pro”.
Chorwacki urósł najbardziej (+37px) i nadal jest o 80px węższy od rosyjskiego. Nic nie
zrobiło się ciaśniejsze niż to, co już było zmierzone.

`LiczMat Pro` w nagłówku **nie ma `navLevel`** i mieć nie może: link pokazywany tylko
kontom, które już są na Pro, to strona sprzedażowa oglądana przez tych, którym nie jest
już potrzebna. Etykieta to klucz `pro_t` — ten sam, którego używa link w stopce, i ten sam
ciąg we wszystkich dziesięciu językach, bo to nazwa własna. Sesja 40 nie napisała ani
jednego nowego słowa w słowniku.

Strona, na której stoi odwiedzający, dostaje `aria-current="page"` (najdłuższy pasujący
prefiks, więc `/kalkulatory/tapety/` podświetla „Kalkulatory”).

**Stopka** — cztery kolumny:

| Kolumna | Skąd | Zawartość |
|---|---|---|
| znak | — | logo + tagline |
| Produkt | `footer.group` domyślna | Kalkulatory · Materiały · Projekty · Kosztorys · Poradniki · Sklepy · LiczMat Pro · Klienci · Zlecenia · Wyceny · Terminarz |
| Konto | `footer.group: "account"` | Aplikacja Android · Moje konto · Google Play |
| Prawne | ręcznie | Polityka prywatności · Cookies |

Cztery ostatnie pozycje kolumny „Produkt" to moduły Pro i mają `navLevel: PRO` — widzi je
konto Pro i robot bez JavaScriptu. `LiczMat Pro` (Sesja 29) stoi tuż przed nimi i
`navLevel` nie ma: strona, która tłumaczy, czym jest Pro, schowana przed każdym bez Pro,
tłumaczyłaby to tym, którzy już wiedzą.

Pod nimi **rząd języków**: te same adresy co w selektorze w nagłówku, ale jako zwykłe
linki — działają bez skryptu i robot je przechodzi.

**Nawigacja mobilna** (poniżej 1060px; do Sesji 32 — 900px) to szuflada pod nagłówkiem: przyciemnia stronę,
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
| LiczMat Pro | `liczmat-pro` → `/liczmat-pro/` | `PRO` | „Robisz to zawodowo?” |

`level` w `HOME_DOORS` mówi, **dla kogo są te drzwi**, a nie jakiego poziomu wymaga
strona za nimi: `/projekty/` jest trasą `GUEST` (działa w przeglądarce bez konta),
a drzwi „LiczMat” opowiadają o tym, co dokłada konto. Drzwi na trasę `PLANNED` nie mają
linku — zamiast przycisku dostają „W przygotowaniu”, bo adres jeszcze nie istnieje.
Status czyta się z architektury, więc w dniu, w którym Sesja 29 zbudowała `/liczmat-pro/`,
trzecie drzwi same stały się linkiem: w `src/pages.mjs` nie zmieniło się nic.

`validateIA()` pilnuje, żeby drzwi zostały trzy, w kolejności poziomów i na istniejących
trasach, a `scripts/build.mjs` — żeby każde miały komplet tekstów we wszystkich czterech
językach (bez tego `t()` wypisałby na stronie głównej sam klucz).

**Czego w nawigacji nadal brakuje** wobec docelowej architektury:

- **LiczMat Pro** ma wejście na stronie głównej (drzwi wyżej) i w stopce, ale nie ma go
  w menu — pasek mieści pięć linków i pięć ich trzyma. Szósty wymaga pomiaru
  (`scripts/test-pages.mjs`, dziesięć języków, 900–1280 px) albo wyrzucenia jednego
  z obecnych, i jedno i drugie jest decyzją właściciela, nie sesji, która budowała stronę;
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
koszty, marża, suma, waluta" to Sesja 24 (WYCENY) — zbudowana, §7.9, i to ona bierze
materiał i inne koszty z `wsProjectCosts()`, dokłada robociznę i narzuca marżę. Tu marży,
narzutu i podatku nie ma — rozdział XVII kończy się zdaniem „Nie buduj z tego systemu
księgowego".

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
`scripts/test-pages.mjs` sprawdza, że rząd zostaje jednolinijkowy w dziesięciu językach na
1061 / 1100 / 1160 / 1280 px, dla gościa (cztery widoczne) i dla zalogowanego (pięć).
Poniżej 1061 px nawigacja jest szufladą i zawinąć się nie może. Ten próg wynosił 900 px do
Sesji 32, która zmierzyła ten sam rząd po rosyjsku: potrzebował 1033 px, więc między 900
a ~1050 px wypychał przełącznik motywu poza ekran. Szósty link nadal wywala build, bo
szóstego nikt nie mierzył.

Sesja 40 nie ruszyła tego limitu — pięć zostaje pięcioma — tylko **zamieniła czwarty
link**: `Poradniki` na `LiczMat Pro`. Pomiar w §5 wyżej; najszerszy rząd na serwisie
(rosyjski) po tej zamianie zwęził się o 10 px.

---

### 7.6. Model Free / Pro — uprawnienia, gating, status planu (Sesja 21)

Rozdział XXXII, Sesja 21: „Model Free / Pro. Bez płatności. Przygotowanie: uprawnień,
feature gatingu, statusu planu, struktury Pro." Cztery rzeczy, i żadna z nich nie jest
modułem Pro — te budują Sesje 22–26, a paywall i płatności Sesje 27–28.

**Uprawnienia: `LM_FEATURES` w `assets/plan.js`.** `src/ia.mjs` od Sesji 3 odpowiada na
pytanie „jakiego poziomu wymaga ta *strona*". To jest druga połowa zdania z rozdziału II
(„każdy element aplikacji powinien jednoznacznie wiedzieć, do którego poziomu dostępu
należy") — dla *funkcji*. Siedemnaście pozycji (10 × gość, 2 × LiczMat, 5 × Pro), każda
z jednym poziomem, opcjonalną trasą i numerem sesji, jeśli jeszcze nie istnieje.

Tabela zapisuje **to, co serwis faktycznie robi**, nie to, co byłoby ładniejsze. Dwie
pozycje różnią się od list w rozdziale II i obie różnice są już podjętymi decyzjami:

- Rozdział II wpisuje gościowi „zapisywać kalkulacje", „tworzyć projekty" i „tworzyć listy
  materiałów" pod NIE MOŻE. Ten serwis trzyma je w `localStorage` w kształcie dokumentu
  Firestore, `/projekty/` i `/kosztorys/` są trasami `GUEST` (§8.1), a `FIRESTORE_SYNC` §1.2
  mówi wprost, że liczenie nigdy nie wymaga konta. Darmowe konto dokłada **synchronizację**
  i **link do udostępnienia** — nie prawo do liczenia. Tabela mówi to samo, bo tabela,
  która mówiłaby co innego, jest instrukcją dla którejś z kolejnych sesji, żeby zamknąć
  coś, co dziś działa.
- Link do `/projekty/` widzi tylko zalogowany. To `navLevel` w `src/ia.mjs`, czyli menu,
  a nie uprawnienie; w tabeli funkcji go nie ma i być nie może.

**Gating: `lmCan(id, level)` i `lmGate(id, level)`.** Poziom jest **przekazywany**, nie
odczytywany w środku. Jedyne, co strona bez Firebase potrafi przeczytać, to `liczmat-signed-in`,
a to podpowiedź, która bywa nieaktualna — funkcja, która po cichu by na niej zamykała,
prędzej czy później schowałaby komuś jego własne projekty. Kto chce podpowiedzi, prosi
o nią sam (`lmReadLevel()`) i bierze to na siebie. Nieznany identyfikator funkcji zwraca
`false`: literówka ma zamykać drzwi, nie otwierać.

**Nic z tego nie jest zabezpieczeniem.** Przeglądarka decyduje, co *pokazać*; co wolno
*zapisać*, decydują wdrożone reguły Firestore, a `plan` jest polem, które klient może
tylko czytać (`FIRESTORE_SYNC` §2). Kto podmieni sobie ten plik w devtoolsach, dostanie
stronę z napisem „Pro" i backend, który dalej odmawia. Rozdział XXV prosi o darmowego
użytkownika, który **rozumie**, co jest Pro — nie o zamek z JavaScriptu.

**Status planu: `lmPlanStatus()`.** `lmLevelOf()` w `assets/account.js` odpowiada „który
z trzech poziomów" i sprowadza wygasły plan Pro do LICZMAT — słusznie do gatingu i
bezużytecznie do wytłumaczenia komuś, **dlaczego** wrócił na darmowy. `lmPlanStatus()`
trzyma obie połowy: `plan` (`free` / `premium` — słowa z kontraktu, nie z brandingu),
`validUntil`, `expired` i `level`, przy czym poziom **woła** `lmLevelOf()`, zamiast liczyć
go po raz drugi. Gość nie ma planu `free` — ma `null`: nie ma konta, więc nie ma na czym
planu trzymać.

**Struktura Pro: piąta zakładka `/app/`.** Pięć modułów — Klienci (22), Zlecenia (23),
Wyceny (24), Terminarz (25), Historia i CRM (26) — opisanych w całości i oznaczonych
zdaniem z rozdziału XXV: „Dostępne w LiczMat Pro". Opis jest pełny, bo rozdział XXV chce,
żeby darmowy użytkownik rozumiał, co jest Pro; wstrzymany jest sam moduł, którego zresztą
jeszcze nie ma. **Żadnego martwego przycisku**: „Poznaj LiczMat Pro" było zdaniem, a nie
linkiem, dopóki `/liczmat-pro/` było `PLANNED` — dokładnie tak, jak `HOME_DOORS` rysuje
drzwi do strony, której nie ma. Sesja 29 tę stronę zbudowała, więc dziś to link;
`proMoreLink()` czyta status trasy, więc żaden z tych dwóch stanów nie został napisany
dwa razy. Nad modułami stoi karta planu tego konta, wypełniana
przez `assets/app.js` z `users/{uid}`; przycisku „kup" nie ma, bo nic po stronie serwera
by go nie obsłużyło (`FIRESTORE_SYNC` §9.2).

Deklaracja jest jedna. `assets/plan.js` jest skryptem przeglądarki, więc `src/pro.mjs`
dostaje listę funkcji z zewnątrz — tym samym mostem, którym `src/pages.mjs` dostaje
katalog materiałów — a `scripts/build.mjs` zestawia tabelę z `ROUTES`: trasa `PRO`, której
nie pokrywa żadna funkcja, i funkcja `PRO` na trasie, która nie jest `PRO`, wywalają build.

### 7.7. Klienci — pierwszy moduł LiczMat Pro (Sesja 22)

Rozdział XXXII, Sesja 22: „KLIENCI — CRM klientów". Rozdział XX mówi, co klient może mieć:
dane kontaktowe, notatki, historię, zlecenia, projekty, wyceny. Zlecenia to Sesja 23,
wyceny Sesja 24, a pełna droga „klient → zlecenie → projekt → wycena → historia" Sesja 26 —
więc Sesja 22 buduje samego klienta i jedyne powiązanie, które **dziś istnieje**: projekt.

**Strona.** `/klienci/` w dziesięciu językach, plus `/klienci/?id=<clientId>` jako `view` —
dokładnie z tego powodu, z którego `project` nim jest: identyfikator powstaje
w przeglądarce, a GitHub Pages nie ma przepisywania adresów (§3). Indeks to lista klientów
i archiwum; ekran klienta to dane kontaktowe, notatki, jego projekty razem z tym, ile już
kosztują, i historia.

**Magazyn: `assets/crm.js`, klucz `liczmat-crm-v1`, tylko ta przeglądarka.** Kontrakt
synchronizacji (`docs/FIRESTORE_SYNC.md` w repo aplikacji) ma pięć kolekcji — `projects`,
`rooms`, `estimations`, `shoppingItems`, `sharedProjects` — i **nie ma klientów**: nie ma
`ClientEntity`, nie ma `SyncContract.clientToDoc()`, nie ma `validClient()` we wdrożonych
regułach. Więc nic stąd nigdzie nie jedzie, `/app/` tego nie wysyła, `wsExport()` tego nie
zawiera, a strona mówi to wprost, zamiast sugerować synchronizację, której nie ma.
Przeniesienie klientów na telefon to zmiana kontraktu po stronie aplikacji — osobna sesja,
nie doklejka do tej.

Dokument jest mimo to napisany w **kształcie** kontraktu (`id`, pola, `createdAt` /
`updatedAt` / `deletedAt` / `schemaVersion`), a usunięcie zostawia nagrobek zamiast
kasować wiersz. To nie ozdoba: nagrobek jest tym, co czyni cofnięcie dokładnym, i tym,
czego potrzebowałaby przyszła zmiana kontraktu, żeby wysłać w górę wiersze, które już są.

**Osobny klucz, nie `materio-workspace-v1`.** Magazyn warsztatu to „dokumenty, które ma
też aplikacja". Kolekcja, o której aplikacja nigdy nie słyszała, uczyniłaby to zdanie
nieprawdziwym — i trafiłaby do `wsExport()`, czyli do tego, co `/app/` wysyła do Firestore.

**Powiązanie klient → projekt leży na kliencie, nie jako `clientId` na projekcie.**
Dokument projektu jest kontraktem: jedzie do Firestore, wraca na telefon i renderuje się
na `/p/<token>`. Pole, które rozumie tylko ta przeglądarka, jechałoby przez wszystkie trzy,
podczas gdy klient, na którego wskazuje, nie jedzie nigdzie — pół powiązania, w tej
połowie, która podróżuje. Cała relacja wewnątrz lokalnego klienta trzyma się w jednym
miejscu, przeżywa usunięcie i cofnięcie, i **niczego nie zmienia w projekcie**: test
sprawdza, że dokument projektu po przypisaniu jest bajt w bajt ten sam. Jeden projekt ma
jednego klienta — drugie przypisanie **przenosi** projekt, zamiast go kopiować.

Usunięcie klienta **nie usuwa jego projektów** (ten sam argument, co przy pomieszczeniach
w §7.5: projekt jest własną pracą odwiedzającego i synchronizuje się na telefon), a
usunięcie projektu **nie zrywa powiązania** — projekt w warsztacie da się przywrócić
(`wsRestoreProject()`), a link zerwany „na wszelki wypadek" oznaczałby, że przywrócony
projekt wraca do nikogo.

**Pieniędzy na kliencie nie ma i nie będzie.** Ile warta jest praca dla klienta, wynika
z jego projektów, a koszt projektu ma już dokładnie jedną odpowiedź — `wsProjectCosts()`
(§7.4), która liczy każdą kwotę w projekcie raz. Zapisana suma na kliencie byłaby wolna
od tego, żeby zacząć się z nią kłócić przy pierwszej zmianie ceny materiału. Waluty
sumują się bez przeliczania (rozdział VI); strona mówi „różne waluty", zamiast pokazywać
liczbę, która nic nie znaczy.

**Historia jest wyliczana, nie zapisywana.** Wszystko, co się na tym serwisie klientowi
przydarzyło, to kalkulacje zapisane w jego projektach, a te już mają datę. Drugi dziennik
rozjechałby się przy pierwszej poprawionej pozycji.

**Rozdział XXV — od Sesji 27 to jest zamek.** Ten akapit opisywał stan Sesji 22, w którym
nad otwartym modułem stał tylko napis; **jest nieaktualny — patrz §7.12**. Zostaje jako
zapis powodu, bo powód nie zniknął: planu Pro nadal **nic nie nadaje** (`FIRESTORE_SYNC`
§9.2), więc sam zamek zamknąłby moduł każdemu istniejącemu kontu, łącznie z tym, które ma
sprawdzić, czy moduł działa. Sesja 27 odpowiedziała na to podglądem Pro; **Sesja 28
podgląd usunęła i przyjęła tę konsekwencję świadomie** — patrz §7.6 i §7.7.

Kolejność rozdziału XXV jest zachowana: najpierw funkcje Pro (Sesje 22–26), potem
sprawdzenie działania i uprawnień, paywall (Sesja 27), płatności po nim (Sesja 28).
Mechanizm był na miejscu od Sesji 21 — `lmFeatureState(id, level)` odpowiada
`allowed / gated / locked`, blok bramki jest w HTML-u od pierwszego renderu — i test
sprawdzał obie odpowiedzi, także tę po przełączeniu, więc paywall nie był pisany na ślepo.

**Link jest w stopce z `navLevel: PRO`.** Menu pokazuje go dopiero na Pro, ale znacznik
zostaje w HTML-u i bez JavaScriptu jest widoczny — to ten sam mechanizm, co przy
`/projekty/` (§8.1), i to on pozwala stronie zostać `indexable` i w `sitemap.xml`. Crawler
widzi nazwę modułu, opis i zdanie „Dostępne w LiczMat Pro"; danych klienta nie widzi nikt
poza przeglądarką, w której powstały. Karta modułu w zakładce Pro na `/app/` prowadzi teraz
do strony (`data-nav-route` + `window.LM_NAV`, bo `/app/` nie ma własnego języka) — martwy
przycisk zamienił się w działający dokładnie wtedy, gdy moduł zaczął istnieć.

### 7.8. Zlecenia — status, termin i środek drogi klient → projekt (Sesja 23)

Rozdział XXXII, Sesja 23: „ZLECENIA — Zlecenia i statusy". Rozdział XXI mówi, co zlecenie
może mieć: klienta, nazwę, opis, status, termin, wartość, projekt, notatki — wszystkie
osiem są. Rozdział XXIV mówi, **po co** ono jest: KLIENT → ZLECENIE → PROJEKT → WYCENA →
HISTORIA. Wycena to Sesja 24; Sesja 23 domyka środkowe ogniwo, w obie strony.

**Strona.** `/zlecenia/` w dziesięciu językach, plus `/zlecenia/?id=<jobId>` jako `view` —
z tego samego powodu, z którego `client` nim jest (§3). Indeks ma dwie połowy: zlecenia
w toku i zamknięte. Ekran zlecenia to status i termin na górze, klient, dwie kwoty,
projekt, opis i notatki. W `src/ia.mjs` trasa siedzi pod `clients`, bo tam zaczyna się
droga rozdziału XXIV.

**Magazyn: ten sam co klienci** — `assets/crm.js`, klucz `liczmat-crm-v1`, druga kolekcja
obok `clients`. `jobs` też **nie ma w kontrakcie synchronizacji**: żadnego `JobEntity`,
żadnego `SyncContract.jobToDoc()`, żadnego `validJob()` we wdrożonych regułach. Więc nic
stąd nigdzie nie jedzie, `wsExport()` tego nie zawiera, a strona mówi to wprost. Jeden plik
na dwie kolekcje, bo to jeden magazyn: dwa pliki czytające i piszące ten sam klucz
`localStorage` to jeden wyścig od zgubionego zapisu. Magazyn zapisany przed Sesją 23 nie ma
tablicy `jobs` i czyta się jako pusty — na tym polega cała migracja.

**Cztery statusy rozdziału XXI i ani jednego więcej.** `nowe`, `w toku`, `zakończone`,
`anulowane` — `JOB_STATUS` w `assets/crm.js`, w kolejności rozdziału. Wartość spoza tej
czwórki nigdy nie trafia do wiersza: `crmSetJobStatus()` odmawia, a nowe zlecenie
z nieznanym statusem startuje jako `nowe`. **Zlecenie nie ma pola `archived`** — rozdział
XXI dał mu już dwa stany zamknięte, a trzeci sposób chowania wiersza byłby czymś, co strona
musiałaby tłumaczyć. Indeks dzieli listę po statusie: otwarte na wierzchu, zamknięte
w zwiniętym `<details>`.

**Termin to dzień kalendarzowy, nie moment.** `dueDate` jest napisem `"YYYY-MM-DD"`, a nie
milisekundami jak każdy inny znacznik czasu w magazynie. Moment przesunąłby się na dzień
wcześniej albo później dla przeglądarki w innej strefie, a terminarz (Sesja 25) nie ma jak
się z tego wycofać. Walidacja jest ścisła: dokładnie dziesięć znaków, prawdziwy dzień
(`2026-02-31` odpada), i **nigdy prefiks czegoś dłuższego** — pierwsze dziesięć znaków
pełnego ISO to zgadywanie, a zgadywanie przy terminie jest gorsze niż brak terminu.

**Powiązania leżą na zleceniu — odwrotnie niż klient → projekt, i nie przez symetrię.**
Dokument projektu jest kontraktem (jedzie do Firestore, wraca na telefon, renderuje się na
`/p/<token>`), więc `jobId` na nim byłby połową powiązania w tej połowie, która podróżuje —
ten sam argument, co w §7.7. Zlecenie jest lokalne jak klient, więc link trzymany na nim
nie jedzie nigdzie i nikogo nie wprowadzi w błąd. Test sprawdza, że dokument projektu po
przypisaniu jest bajt w bajt ten sam, bez `jobId` i bez `clientId`.

Jeden projekt należy do jednego zlecenia; drugie przypisanie **przenosi** go. Zlecenie,
które ma jednocześnie klienta i projekt, przypisuje ten projekt także temu klientowi
(`crmLinkProject()` — jedyny zapis, który wie, że projekt ma jednego klienta), więc droga
rozdziału XXIV jest jednym łańcuchem, a strona klienta opowiada tę samą historię, co strona
zlecenia.

Usunięcie klienta **nie usuwa jego zleceń**, a usunięcie projektu **nie zrywa powiązania** —
oba z tego samego powodu, co w §7.5 i §7.7: obie te rzeczy da się cofnąć, a link zerwany „na
wszelki wypadek" oznaczałby, że cofnięcie przywraca wiersz do nikogo. Zlecenie osieroconego
klienta mówi „Klient został usunięty" zamiast rysować odnośnik do wiersza, którego nikt nie
otworzy.

**Dwie kwoty, i tylko jedna z nich jest wpisywana.** `valueMinor` to **uzgodniona wartość**
rozdziału XXI — kwota, na którą fachowiec umówił się z klientem, wpisana ręcznie. Koszt
liczy `wsProjectCosts()` z projektu (§7.4) i **nigdzie nie jest zapisywany na zleceniu**:
kopia rozjechałaby się przy pierwszej zmianie ceny materiału. Różnica („Zostaje") powstaje
tylko wtedy, gdy obie kwoty są w tej samej walucie — inaczej strona mówi, że waluty się
różnią, bo odjęcie ich od siebie to przeliczenie po kursie, którego rozdział VI zabrania.
Waluta stempluje się raz, przy pierwszej wpisanej kwocie, i zostaje przy poprawkach;
wyczyszczenie kwoty czyści też walutę, więc następna dostaje własny stempel.

**Rozdział XXV — tak samo jak przy klientach.** Ten sam pasek „Dostępne w LiczMat Pro", ta
sama uczciwa uwaga o tym, że planu Pro nic jeszcze nie nadaje, ta sama bramka w HTML-u od
pierwszego renderu i **ten sam jedyny przełącznik Sesji 27: `LM_PRO_LOCKED`**. Link jest
w stopce z `navLevel: PRO`, strona zostaje `indexable` i w `sitemap.xml`, a karta modułu
w zakładce Pro na `/app/` prowadzi teraz do strony — drugi martwy przycisk zamienił się
w działający.

### 7.9. Wyceny — pięć liczb, z których zapisane są dwie (Sesja 24)

Rozdział XXXII, Sesja 24: „WYCENY — materiały, robocizna, koszty, marża, suma, waluta".
Rozdział XXII mówi to samo krócej i dodaje jedno zdanie, które rozstrzyga zakres: „Nie
buduj pełnego programu księgowego". Rozdział XXIV mówi, gdzie wycena stoi: KLIENT →
ZLECENIE → PROJEKT → **WYCENA** → HISTORIA — czwarty krok, więc pierwszy, który ma pod
sobą policzone pieniądze.

**Strona.** `/wyceny/` w dziesięciu językach, plus `/wyceny/?id=<quoteId>` jako `view` —
z tego samego powodu, z którego `job` nim jest (§3). Indeks to lista wycen z sumą przy
każdej; ekran wyceny to łańcuch (klient → zlecenie), sześć liczb, pole marży, pozycje
robocizny, projekt i notatki. W `src/ia.mjs` trasa siedzi pod `jobs`, bo tam droga
rozdziału XXIV do niej dochodzi.

**Magazyn: ten sam co klienci i zlecenia** — `assets/crm.js`, klucz `liczmat-crm-v1`,
trzecia kolekcja obok `clients` i `jobs`, z tego samego powodu (jeden magazyn, jeden plik).
`quotes` też **nie ma w kontrakcie synchronizacji**: żadnego `QuoteEntity`, żadnego
`SyncContract.quoteToDoc()`, żadnego `validQuote()` we wdrożonych regułach. Nic stąd nigdzie
nie jedzie, `wsExport()` tego nie zawiera, a strona mówi to wprost. Magazyn zapisany przed
Sesją 24 nie ma tablicy `quotes` i czyta się jako pusty.

**Każda z pięciu liczb ma dokładnie jedno źródło, a tylko dwie z nich są zapisane.**

| rozdział XXII | skąd | zapisane? |
|---|---|---|
| materiały | `wsProjectCosts(projectId).materials` | nie — czytane z projektu |
| inne koszty | `wsProjectCosts(projectId).other` | nie — czytane z projektu |
| robocizna | pozycje `labour` na wycenie | **tak** |
| marża | `marginPct` na wycenie | **tak** |
| suma | `(materiały + inne koszty + robocizna) + marża` | nie — liczona |

Skopiowanie pieniędzy projektu na wycenę dałoby tej samej kwocie dwa domy i pozwoliłoby im
się rozjechać przy pierwszej zmianie ceny materiału — ten sam argument, który trzyma koszt
poza zleceniem (§7.8) i cenę jednostkową poza pozycją listy zakupów (§7.4). Dzięki temu
wycena odpowiada na pytanie „ile to jest warte **teraz**", a to jest pytanie, dla którego
się ją otwiera. Test klika przecenienie materiału na ekranie projektu i sprawdza, że suma
wyceny się zmieniła, a sama wycena nie została ani razu zapisana.

**Jedyne powiązanie, jakie wycena trzyma, to `projectId`.** Materiały są projektu, więc bez
niego nie ma czego wyceniać; zlecenie i klient są **już** osiągalne z projektu
(`crmJobOfProject()`, `crmClientOfProject()`), więc zapisanie ich drugi raz to dwa kolejne
linki, które mogą się rozejść z pierwszym. `crmQuoteChain()` przechodzi tę drogę w drugą
stronę: WYCENA → PROJEKT → ZLECENIE → KLIENT. Wycena bez projektu jest dozwolona i nie jest
pomyłką — to cena za robotę bez materiału, i strona mówi to wprost zamiast pokazywać zera
bez wyjaśnienia. Jeden projekt może mieć kilka wycen: dwie ceny na jedną robotę to wariant,
nie sprzeczność.

**Robocizna: ilość × stawka, zaokrąglone raz.** To jedyna część wyceny, której nic w
LiczMacie nie policzy — żaden kalkulator nie liczy godziny czyjejś pracy. Pozycja trzyma
**jedno** pole pieniężne, `amountMinor`; stawka wychodzi z dzielenia (`crmLabourRate()`),
dokładnie jak cena jednostkowa materiału i z tego samego powodu. Pusta ilość to ryczałt
i zapisuje się jako `null`, a nie jako `1`: pozycja, której nikt nie liczył, i pozycja
policzona raz to dwa różne zdania, i strona drukuje je inaczej. Pozycja robocizny znika
przy usunięciu na wprost, bez nagrobka — jest polem dokumentu, nie wierszem kolekcji: nic
jej nie synchronizuje, nic do niej nie linkuje, a cofnięcie, które ma znaczenie (cała
wycena), to nagrobek samej wyceny, który niesie swoje pozycje.

**Marża to procent od wszystkiego powyżej** (materiał + inne koszty + robocizna) — tak
działa narzut — zaokrąglony dokładnie raz, na końcu. Ujemna marża nie jest rabatem, tylko
literówką, i czyta się jako zero; jest też górna granica, bo marża to narzut, a nie
wykładnik.

**Waluta — rozdział VI, ten sam co wszędzie.** Wycena stempluje własną walutę przy
pierwszej kwocie robocizny i **nigdy** jej nie przestempluje; usunięcie ostatniej kwoty
czyści stempel, więc następna dostaje własny. Pieniądze projektu przychodzą w walucie
projektu. Gdy obie połowy są w różnych walutach, strona to mówi (`ws_mixed_currency`) —
kwoty są dalej dodawane, tak samo jak w `wsProjectCosts()`, ale nic nie jest przeliczane po
kursie.

**Czego wycena nie ma, i to celowo:** podatku, rabatu, statusu, numeru, daty wystawienia,
pozycji „inne koszty" wpisywanych po jej stronie. Pierwsze pięć to program księgowy, którego
rozdział XXII zabrania jednym zdaniem; ostatnia to drugie miejsce na tę samą kwotę —
rozdział XVII ma już swoje „inne koszty" na projekcie i `wsProjectCosts()` liczy je raz.

**Rozdział XXV — tak samo jak przy klientach i zleceniach.** Ten sam pasek „Dostępne
w LiczMat Pro", ta sama uwaga o tym, że planu Pro nic jeszcze nie nadaje, ta sama bramka
w HTML-u od pierwszego renderu i **ten sam jedyny przełącznik Sesji 27: `LM_PRO_LOCKED`** —
teraz dla trzech modułów, i wciąż jedna zmienna.

### 7.10. Terminarz — moduł, który nic nie zapisuje (Sesja 25)

Rozdział XXXII, Sesja 25: „TERMINARZ — Terminy zleceń". Rozdział XXIII mówi to samo
dłużej i, jak przy wycenach, jednym zdaniem ustala zakres: „Prosty terminarz zleceń.
Powinien pozwolić zobaczyć: terminy, zlecenia, podstawowe informacje. **Nie buduj pełnego
odpowiednika Google Calendar.**"

**Strona.** `/terminarz/` w dziesięciu językach — i to wszystko: **nie ma widoku `?id=`**,
bo terminarz nie ma własnego wiersza do otwarcia. Nazwa w wierszu to zwykły link do
`/zlecenia/?id=<jobId>`, czyli do strony, która to zlecenie posiada. W `src/ia.mjs` trasa
siedzi pod `jobs`, bo pokazuje ich daty.

**To jedyny moduł Pro, który niczego nie zapisuje.** Termin jest polem zlecenia —
`dueDate` z rozdziału XXI, zapisywane przez `crmUpdateJob()` i sprawdzane przez
`crmDay()` — więc terminarz jest *czytaniem* zleceń, a nie kolekcją obok nich. Własna
tablica `calendar` albo `events` dałaby jednej dacie dwa domy i pozwoliłaby im się
rozjechać przy pierwszej zmianie terminu na stronie zlecenia: dokładnie ten sam argument,
który trzyma koszt poza zleceniem (§7.8) i pieniądze projektu poza wyceną (§7.9). Jedyny
zapis, jaki robi ta strona, to `crmUpdateJob(id, { dueDate })` — ta sama funkcja, którą
wywołuje `/zlecenia/`.

**Pięć kubełków, i to jest cała „struktura" terminarza.**

| kubełek | co w nim jest |
|---|---|
| `late` | termin minął, zlecenie nadal otwarte |
| `today` | termin wypada dziś |
| `soon` | termin w ciągu 7 dni (`CAL_SOON_DAYS`) |
| `later` | termin dalej niż za tydzień |
| `none` | otwarte zlecenia bez daty |

Zlecenia zamknięte — „zakończone" i „anulowane" z rozdziału XXI — **nie trafiają do
żadnego kubełka**: skończona robota po terminie nie jest zaległa. Te, które miały termin,
składają się w `<details>` (najnowszy termin pierwszy); zamknięte bez terminu nie
pojawiają się wcale, bo strona jest o datach. Kubełek bez wierszy znika, zamiast stać
pusty. `none` jest ostatni i nie jest wypełniaczem: zlecenie, któremu nikt nie dał daty,
to wiersz, który najczęściej trzeba poprawić, a kontrolka daty stoi w nim od razu.

**„Dziś" to dzień kalendarzowy odwiedzającego, nigdy UTC.** `crmToday()` składa datę
z lokalnych getterów, a nie z `toISOString().slice(0, 10)`: o 23:30 w Warszawie ten drugi
mówi już „jutro", więc zlecenie na dziś wylądowałoby w „po terminie" — terminarz byłby
błędny każdego wieczoru. `crmDaysUntil()` liczy odwrotnie: obie daty czyta o północy UTC,
bo różnica dwóch dni kalendarzowych to liczba dni, a liczona lokalnie miałaby dwa razy
w roku 23 albo 25 godzin i zaokrągliłaby się w złą stronę. Testy sprawdzają obie strony
tego, w prawdziwej strefie `Europe/Warsaw`.

**Odległość do terminu jest słowami, i pisze ją przeglądarka.**
`Intl.RelativeTimeFormat` z `numeric: "auto"` daje „za 3 dni", „in 3 Tagen", „через 3 дні"
i „yesterday" — z poprawną liczbą mnogą, której sam polski ma trzy formy, a ukraiński
kolejne trzy. Czwarty komplet form w słowniku byłby czwartym miejscem, w którym można się
pomylić. Przeglądarka bez tego API nie dostaje żadnej frazy — data obok mówi wszystko,
więc wiersz degraduje się do mniejszej liczby słów, nigdy do złych.

**Podstawowe informacje** (rozdział XXIII) to te trzy, które czyta się razem z terminem:
klient, status i uzgodniona wartość. Reszta zlecenia jest jedno kliknięcie dalej, na
stronie, która je posiada. Data w wierszu to `<input type="date">`, a nie tekst z guzikiem
„edytuj": kontrolka **jest** wyświetleniem — przeglądarka drukuje ją w lokalnym formacie
i otwiera kalendarz na telefonie — i to ona pozwala uzupełnić brakujący termin tam, gdzie
się go zauważyło. Wiersz zamknięty ma datę jako tekst: to zapis, nie kolejka.

**Rozdział XXV — tak samo jak przy trzech poprzednich modułach.** Ten sam pasek „Dostępne
w LiczMat Pro", ta sama uwaga o tym, że planu Pro nic jeszcze nie nadaje, ta sama bramka
w HTML-u od pierwszego renderu i **ten sam jedyny przełącznik Sesji 27: `LM_PRO_LOCKED`**
— teraz dla czterech modułów, i wciąż jedna zmienna.

### 7.11. CRM — ścieżka klient → zlecenie → projekt → wycena → historia (Sesja 26)

Rozdział XXXII, Sesja 26: „CRM — Połączenie: klient → zlecenie → projekt → wycena →
historia". Rozdział XXIV podaje tę samą relację pionowo i ogranicza ją dwoma zdaniami:
„CRM LiczMat Pro ma być lekki" i „**Nie tworzymy ogromnego systemu ERP.**"

**Ta sesja nie dołożyła ani kolekcji, ani strony.** Wszystkie powiązania rozdziału XXIV
były już zapisane: klient trzyma `projectIds` (§7.7), zlecenie trzyma `clientId`
i `projectId` (§7.8), wycena trzyma `projectId` (§7.9). Brakowało samej ścieżki —
i dlatego `crm` jest jedyną funkcją w `LM_FEATURES`, która ma `route: null`.

**Jeden spacer w obie strony: `crmChain(kind, id)`.**

| kierunek | co daje |
|---|---|
| w górę | dokładność: wycena ma jeden projekt, projekt ma najwyżej jedno zlecenie, zlecenie najwyżej jednego klienta |
| w dół | listę, nigdy zgadywanie: klient ma wiele zleceń, projekt może mieć kilka wycen |

Spacer z klienta zatrzymuje się więc na kliencie, a strona wypisuje jego zlecenia,
projekty i wyceny listami. `crmQuoteChain()` z Sesji 24 został pod tą samą nazwą, ale
w środku woła `crmChain()`: dwa spacery po tych samych powiązaniach mogłyby kiedyś dać
dwie różne odpowiedzi na to samo pytanie.

**Pasek ścieżki** rysuje cztery węzły w kolejności rozdziału — `assets/crm-chain.js`,
jeden plik dla `/klienci/`, `/zlecenia/` i `/wyceny/`. Węzeł, na którym stoi
odwiedzający, jest nazwą, a nie linkiem (link do strony, na której się jest, to martwe
kliknięcie). Węzeł nierozstrzygnięty prowadzi do **indeksu swojej sekcji** — i mówi
prawdę w obu przypadkach, w których się pojawia: krok, którego nikt jeszcze nie wypełnił,
i krok, który ma więcej niż jedną odpowiedź. Pasek jest więc sposobem, żeby iść dalej,
a nie raportem.

**Historia jest wyliczana z dokumentów i ich dat** — `crmHistory({clientId | jobId |
projectId})`. Wiersz powstaje z: klienta, zlecenia, wyceny, zapisanej kalkulacji
i dopisanego kosztu (`manual` w `inputJson`, §7.4), każdy z datą, którą ten dokument
i tak nosi. Dziennik zdarzeń obok nich byłby drugą kopią tych samych faktów i zacząłby
kłamać przy pierwszym skasowanym wierszu — wiersza by nie było, a wpis by został.

**Czego historia świadomie nie pokazuje.** Zmian. W magazynie są tylko daty powstania:
wiersz ma jedno `updatedAt`, które mówi *kiedy* coś się zmieniło i nigdy *co*. Status
przestawiony na „w toku" i termin przesunięty o tydzień nie zostawiają śladu — i strona
mówi to wprost zdaniem pod listą (`crm_hist_note`), zamiast udawać komplet. Zapamiętanie
tego to dziennik zdarzeń, czyli ERP z ostatniego zdania rozdziału XXIV.

**Jedna mapa adresów zamiast czterech.** Cztery ekrany Pro linkują teraz do siebie
w każdą stronę, więc build wpisuje w każdy z nich `window.LM_LINKS` — komplet pięciu
adresów w języku tej strony — w miejsce dawnych `LM_CRM`, `LM_JOBS`, `LM_QUOTES`
i `LM_CAL`, z których każda niosła połowę tego samego. `/terminarz/` dostaje tę samą
mapę i **nie** ładuje `crm-chain.js`: nie rysuje ścieżki, więc jej nie pobiera.

**Czego ścieżka nie dotyka: `/projekty/`.** Projekt jest środkiem łańcucha, ale jego
trasa jest `GUEST` i nie ładuje niczego z CRM-u. Pasek na stronie projektu oznaczałby
wożenie danych Pro na stronę gościa — link idzie tam w jedną stronę, z paska.

**Rozdział XXV — bez zmian.** Ścieżka nie ma własnego paska „Dostępne w LiczMat Pro",
bo nie ma własnej strony: rysuje się wewnątrz trzech modułów, które ten pasek już mają,
i znika razem z nimi — co nastąpiło w Sesji 27, patrz niżej.

---

### 7.12. Paywall — zamek, komunikaty i przejście Free → Pro (Sesja 27)

Rozdział XXV, cztery punkty Sesji 27: **blokady, komunikaty, prezentacja funkcji Pro,
przejście Free → Pro**. Sesje 21–26 zostawiły całą mechanikę gotową i jeden przełącznik
nieprzestawiony; ta sesja go przestawiła i dobudowała ścianę, którą teraz widać.

**`LM_PRO_LOCKED` jest `true`.** Pięć modułów Pro — klienci, zlecenia, wyceny, terminarz
i sama ścieżka CRM — jest zamkniętych dla gościa i dla darmowego konta. Zamek dotyczy
**wyłącznie** funkcji `PRO`: `sync` i `share` są `LICZMAT` i stoi przed nimi formularz
logowania, a nie ściana z ceną, więc `lmFeatureState()` odpowiada dla nich `gated` bez
`locked`. Kalkulatory, projekty, materiały, koszty i pomieszczenia są `GUEST` i zamek ich
nie dotyka — rozdział II mówi wprost, że nie wolno blokować podstawowych funkcji, żeby
wymusić przejście na Pro.

**Podgląd Pro usunięty w Sesji 28.** Sesja 27 zostawiła w ścianie jedne drzwi — jeden
klucz w `localStorage`, otwierający wszystkie pięć modułów bez planu. Sesja 28 go
skasowała, decyzją właściciela i ze świadomością ceny. Powód: na ścianie stoi teraz
**cena**, a lokalny przełącznik otwierający moduły za darmo jest ścianą, która sama sobie
przeczy — i drugą odpowiedzią na pytanie „czy wolno mi tego użyć", podczas gdy `lmLevelOf()`
istnieje po to, żeby odpowiedź była jedna.

**Konsekwencja, zapisana wprost:** dopóki rozszerzenie Stripe nie zacznie zapisywać
`plan: premium`, **żadne konto nie zobaczy modułu Pro** — łącznie z kontem właściciela. To
stan znany i zamierzony, a nie defekt do „naprawienia": nie wolno przywracać lokalnego
obejścia. `scripts/test-plan.mjs` §6c sadzi cztery obiecujące klucze w `localStorage`
i sprawdza, że żadna odpowiedź się nie ruszyła.

**Ściana jest jedna, budowana raz.** `proGate()` w `src/pro.mjs` w miejsce czterech kopii
z Sesji 22–25; `assets/paywall.js` w miejsce czterech kopii `xxxRenderPro()`. Cztery ściany
to cztery szanse na to, żeby ten sam produkt opisać czterema różnymi zdaniami — a paywall
jest jedynym miejscem w serwisie, w którym taka rozbieżność kosztuje pieniądze. Ściana
niesie:

| Element | Rozdział XXV |
|---|---|
| nazwa modułu i zdanie o nim, „Dostępne w LiczMat Pro" | *blokady*, *komunikaty* |
| pozostałe cztery moduły Pro, każdy z nazwą i opisem | *prezentacja funkcji Pro* |
| jedno zdanie dobrane do poziomu: gość → załóż konto, darmowe konto → to jest Pro | *komunikaty* |
| link do rejestracji z `?next=` na tę stronę, w jej języku | *przejście Free → Pro* |
| „Poznaj LiczMat Pro" — link do `/liczmat-pro/` w języku tej strony (Sesja 29) | *nigdy martwy przycisk* |
| cena obu planów w walucie odwiedzającego i link do `/app/` (Sesja 28) | *przejście Free → Pro* |
| „Subskrypcji jeszcze nie da się wykupić" — dopóki nie ma Payment Linku | uczciwość |

**Blok jest w HTML-u od pierwszego renderu i `hidden`.** Ściana tworzona przez skrypt to
moduł, który mignie otwarty, zanim się zamknie. Odwrotnie też: gdyby `assets/plan.js` się
nie wczytał, `pwState()` odpowiada „otwarte" — wiersze leżą w `localStorage` tej
przeglądarki, więc ukrycie komuś jego własnych klientów za skryptem, który nie dojechał,
jest gorszą z dwóch awarii. Ściana nie jest granicą bezpieczeństwa i nigdy nią nie była:
granicą są wdrożone reguły Firestore, a magazyn CRM-u nie jedzie nigdzie.

**Pasek nad modułem znika, kiedy ściana stoi** — mówi to samo co ściana, a dwa razy jest
gorzej niż raz. Kiedy moduł jest otwarty, pasek mówi jedną rzecz: „Twój plan: LiczMat Pro"
(znacznik `on`). Od Sesji 28 nie ma drugiego przypadku, bo nie ma podglądu. Konto Pro nie
dostaje też ceny — propozycja sprzedaży czegoś, za co ktoś już płaci, czyta się jak groźba.

### 7.7. Gdzie stoi kasa (Sesja 28)

**Płaci się wyłącznie na `/app/`.** Adres kasy musi nieść `client_reference_id` — czyli uid
— bo płatność bez niego nie da się przypiąć do żadnego konta, a `/klienci/`, `/zlecenia/`,
`/wyceny/` i `/terminarz/` nie ładują Firebase i uid-a nie znają. Dlatego ściana **podaje
cenę i linkuje do `/app/`**, a nie do Stripe'a. Jedno miejsce bierze pieniądze — to, które
wie, kto płaci.

**Dwa progi zamiast jednego** (`assets/pay.js`): `lmPayPriced()` — jest kwota, więc pokaż
cenę; `lmPayBuyable()` — jest kwota **i** Payment Link, więc pokaż przycisk. Dziś pierwsze
jest prawdą, drugie nie, więc serwis mówi, ile Pro kosztuje, i mówi wprost, że subskrypcji
jeszcze nie da się wykupić. Wpisanie trzech adresów włącza przyciski bez żadnej innej
edycji — ale dopiero po kolejności z noty ORDER na końcu `assets/pay.js`: produkty →
Payment Linki → wdrożenie **własnej funkcji z `functions/`** (Sesja 38 — nie rozszerzenia
„Run Payments with Stripe", które jest zbudowane wokół sesji Checkout tworzonych przez
zalogowaną przeglądarkę) → webhook w Stripe na cztery zdarzenia → **zapłacić raz
i sprawdzić, że konto samo staje się Pro** → dopiero wtedy adresy. Przycisk włączony
wcześniej bierze pieniądze za nic. Krok po kroku, do klikania: `docs/STRIPE.md`.

**Ceny są wpisane ręcznie i nic ich nie przelicza.** Dwa plany, siedem walut, czternaście
kwot — i te same czternaście musi stać na produktach w Stripe. Kurs euro zastosowano **raz,
przy pisaniu pliku** (kursy i źródła w jego nagłówku), bo Stripe pobiera kwotę ustawioną na
produkcie: cena policzona z kursu na żywo rozjechałaby się z tym, co schodzi z karty.
Waluta bez wpisanej kwoty **nie pokazuje ceny**, a nie cenę wyprowadzoną z innej. Dlatego
też `assets/currency.js` urosło z czterech walut do siedmiu — CZK, RON i RSD. Chorwacja
jest na euro; **RUB celowo nie ma, bo Stripe nie działa w Rosji**.

**Pięć stanów planu** (`lmSubscription()`): `none`, `free`, `active`, `cancelled`,
`expired`. Anulowanie wymaga trzeciego pola — `planRenews` — bo „odnowi się 12 września"
i „skończy się 12 września" to z `plan` + `planValidUntil` ten sam dokument. Pole jest
serwerowe (wdrożone reguły i tak nie pozwalają klientowi na nic poza `lastSeenAt`
i `appVersion`, więc zmiana reguł nie była potrzebna), stoi **obok kontraktu
synchronizacji** — jak `note` na materiale i `projectId` na pomieszczeniu — a jego brak
czytany jest jako **odnawia się**: powiedzenie komuś, że jego subskrypcja się kończy, kiedy
dokument tego nie mówi, jest tu jedynym błędem, który kosztuje klienta.

**Czego ta sesja nie zrobiła:** nie założyła produktów w Stripe, nie zainstalowała
rozszerzenia i nie zmieniła kontraktu synchronizacji (`planRenews` zostaje długiem wobec
`3d-polednia/Materio`). Stronę `/liczmat-pro/` zbudowała Sesja 29 — §7.13.

---

---

---

## 7.8. Dziesięć języków — przywrócenie po Sesji 28

Sześć języków wycofanych 2026-08-12 (**cs, sk, ro, hr, sr, ru**) wróciło na polecenie
właściciela, zaraz po Sesji 28. Serwis ma znowu dziesięć języków i **363 strony** zamiast 147.

**Slugi zostały odzyskane z gita, nie wymyślone na nowo.** Commit `ab1fb26` — pierwotny
upload — nosi kompletne tabele `SECTION`, `CALC_SLUG` i `GUIDES` dla wszystkich dziesięciu
języków. Te adresy były publiczne i zaindeksowane przez miesiące, więc stare slugi nie są
wygodniejsze, tylko **poprawne**: wymyślenie nowych zepsułoby każdy przychodzący link po
raz drugi. Sprawdzone mechanicznie: **wszystkie 177 adresów, które istniały przed
wycofaniem, znowu odpowiadają** — zero brakujących. Nowe segmenty trzeba było napisać
tylko dla czterech sekcji Pro (`klienci`, `zlecenia`, `wyceny`, `terminarz`), bo w czasach
tamtych języków jeszcze nie istniały.

**Tłumaczenia w trzech kubełkach.** Z 1130 kluczy na język: **641 odzyskanych dosłownie**
(polski tekst źródłowy nie zmienił się od czasu, gdy je tłumaczono), **17 przetłumaczonych
od nowa** (polski się zmienił — rebranding, zmiana pozycjonowania) i **472 zupełnie nowych**
(funkcje z sesji 13–28: konto, projekty, pomieszczenia, materiały, koszty, CRM, płatności).
Razem 6780 ciągów w sześciu językach.

**Liczba mnoga to trzy różne reguły, nie jedna.** `assets/units.js` rozróżnia teraz:

| Rodzina | Języki | „few" |
|---|---|---|
| ostatnia cyfra | pl, uk, ru, hr, sr | końcówka 2–4 (poza 12–14), więc 22 → few |
| małe 2–4 | cs, sk | dokładnie 2, 3, 4 — **22 to już „many"** |
| romańska | ro | 2–19 i dalej po setkach; 20 przechodzi na „many" |

Wrzucenie czeskiego do rodziny polskiej dałoby „22 položky", co jest po prostu błędem.
`scripts/test-save.mjs` ma tabelę oczekiwanych form dla wszystkich dziesięciu języków.

**Chorwacki i serbski zgadzają się dosłownie w 46% kluczy.** To dwa standardy jednego
języka i krótkie napisy interfejsu wychodzą identycznie — poprawnie, a nie przez
kopiowanie. Testy, które wymagały, żeby każdy język brzmiał inaczej, liczą te dwa jako
jeden głos.

### 7.8a. Jak się nazywa język — jedna lista, dwa wybieraki (Sesja 41)

Nazwa języka stoi w **jednym** miejscu: `LANGS` w `assets/i18n.js`. Czyta ją i przeglądarka
(trzy strony bez własnego języka rysują wybierak w locie z wygenerowanego pakietu
`assets/i18n.<lang>.js`), i generator — `LANG_NAME` w `src/flags.mjs` bierze ją stamtąd
i wpisuje do markupu pozostałych 370 stron.

**Do Sesji 41 to była jedna lista w dwóch kopiach, a krótsza z nich rysowała 370 stron.**
`LANG_NAME` było wypisane ręcznie i miało **cztery** języki, kiedy serwis wysyłał dziesięć.
Od powrotu sześciu języków (2026-08-19) każda wygenerowana strona pisała obok sześciu flag
słowo **`undefined`** — raz w menu w nagłówku, drugi raz w rzędzie języków w stopce — we
wszystkich dziesięciu językach. Nic tego nie zauważyło: żaden klucz nie brakował, żaden
adres nie był zepsuty, `hreflang` i `canonical` zgadzały się co do jednego, wszystkie
suity przechodziły, a połowa przeglądarkowa była **poprawna przez cały ten czas**, bo
czytała słownik bezpośrednio. Defektem nie było przeoczone tłumaczenie, tylko druga kopia.

Zamknięte z dwóch stron: `validate()` w `scripts/build.mjs` przerywa build na języku bez
nazwy (build nie ma prawa wypisać na stronie słowa, którego nikt nie napisał — ta sama
zasada, co przy `lmGate()` w Sesji 21), a `scripts/test-langs.mjs` czyta wysłane strony
z powrotem: przycisk, menu, stopka, oba pakiety i sam wyraz „undefined" tam, gdzie ktoś
może go przeczytać.

**Nazwa języka, nigdy nazwa kraju** (ustalenie właściciela z 2026-08-21). Dziesięć języków
to nie dziesięć krajów: niemiecki jest urzędowy w czterech, serbski zapisuje się dwoma
alfabetami, a angielski nie należy do żadnego. Wybierak, który mówi „Deutschland", każe
komuś w Wiedniu wybrać kraj, w którym nie mieszka. Każda nazwa jest też zapisana **we
własnym języku** („Română", nie „rumuński"): wybierak czyta ktoś, kto właśnie **nie** rozumie
języka, w którym jest w tej chwili strona.

---

### 7.16. „Brak sieci" na `/app/` — co to znaczy i skąd się o tym wie (Sesja 42)

Zdanie „Brak sieci — zmiany polecą po powrocie łącza." jest **twierdzeniem o połączeniu**,
a `snapshot.metadata.fromCache` nie jest jego dowodem. To pole odpowiada na inne pytanie:
„czy te dane przyszły z serwera". Odpowiada „nie" w trzech różnych sytuacjach i tylko
jedna z nich to zerwane łącze:

1. **chwila po podpięciu nasłuchu** — Firestore oddaje od razu to, co ma w lokalnym cache,
   i dopiero potem pyta serwer. To jest zwykły przypadek każdego, kto był tu wcześniej;
2. **chwila po własnym zapisie** — dopóki serwer nie potwierdzi, migawka niesie zapis
   lokalny (`hasPendingWrites`);
3. **prawdziwa awaria łącza.**

Do Sesji 42 strona ogłaszała wszystkie trzy — i **nie umiała tego odwołać**. Powód siedzi
w SDK, nie w tym repozytorium: migawka, w której żaden dokument się nie zmienił, dociera
**wyłącznie** do nasłuchu, który poprosił o metadane (`ia()` w `firebase-firestore.js`
10.14.1 — `!(!e.syncStateChanged&&!i)&&!0===this.options.includeMetadataChanges`). Serwer
odpowiadający tymi samymi dokumentami, które leżały w cache, jest dokładnie taką migawką.
Więc: ktoś, kto otwierał `/app/` wcześniej, dostawał „Brak sieci" w chwili zalogowania i
czytał je **do zamknięcia karty**, przy działającym łączu — a łącze, które naprawdę padło,
nie było ogłaszane **wcale**, bo to też jest zmiana samych metadanych.

**Jak jest teraz.** Nasłuchy proszą o metadane (`{ includeMetadataChanges: true }`), a stan
połączenia liczy `connectionState()` w `assets/app.js` z dwóch źródeł, z których każde
odpowiada na co innego:

- **`navigator.onLine === false`** — przeglądarka mówi, że łącza nie ma w ogóle. Pewne
  i natychmiastowe. `true` nie jest dowodem niczego (laptop w hotelowym Wi-Fi bez
  internetu też odpowiada `true`), więc jest wierzone **tylko w jedną stronę**.
- **każdy nasłuch czyta z cache dłużej niż `OFFLINE_AFTER_MS`** — to jest przypadek,
  którego przeglądarka nie widzi. Stała wynosi 10 s, bo tyle sam SDK daje swojemu
  backendowi, zanim zapisze „Backend didn't respond within 10 seconds" i przełączy
  klienta w tryb offline (`online_state_timeout`). Ogłaszać zerwane łącze wcześniej niż
  biblioteka, która to łącze trzyma, to zgadywanie.

**Komunikat ma własny wiersz** (`#app-offline`), a nie wspólny pasek statusu. Wspólny
kosztował dwa razy: deptał to, co ktoś inny tam postawił („Nazwa zapisana."), a zdjąć go
dało się wyłącznie porównując **wyświetlony tekst** z tłumaczeniem, którym się go napisało
— więc przełączenie języka przy podniesionym komunikacie przybijało go na stałe. Zdanie
stoi w markupie z kluczem `data-i18n="app_offline"`, tak jak reszta tej strony, więc
`langchange` przepisuje je za darmo, a `assets/app.js` przestawia tylko `hidden`. Ta sama
zasada, co przy ścianie płatności: blok jest w stronie od pierwszego malowania i ukryty,
bo element tworzony przez skrypt zdąży mignąć.

**Czego `includeMetadataChanges` nie może zrobić: przerysować list.** `renderProjects()`
buduje `#project-list` przez `innerHTML`, a w każdym wierszu projektu stoi formularz
„dodaj pomieszczenie". Przerysowanie na potwierdzeniu zapisu wyjęłoby kursor z pola, w
którym ktoś właśnie pisze — więc przerysowanie jest zawężone do `snap.docChanges().length`
(czytane z własnym domyślnym ustawieniem, więc bez wpisów czysto metadanowych) plus
pierwsza migawka, która musi narysować listę także wtedy, gdy jest pusta.

---

### 7.13. Strona LiczMat Pro — publiczny opis płatnego produktu (Sesja 29)

Rozdział XXXII, Sesja 29 w całości: „Krótka, konkretna strona prezentująca Pro. Bez
marketingowego przesytu." Adres `/liczmat-pro/` — ten sam segment we wszystkich dziesięciu
językach, bo to nazwa własna — czekał w `src/ia.mjs` ze statusem `PLANNED` od Sesji 3.

**Trasa jest `GUEST`, indeksowana i bez bramki, i to jest cała jej definicja.** Paywall
Sesji 27 stoi przed *narzędziem*; opis tego, za co ktoś miałby zapłacić, schowany za tą
zapłatą, byłby kołem. To zarazem jedyna treść o Pro, którą wyszukiwarka może zaindeksować,
i jedyna strona Pro, na którą ktoś bez planu ma trafić.

**Strona niczego nie pisze drugi raz.** Pięć modułów to `LM_FEATURES` z `assets/plan.js`
(przez `proModules()`), więc produkt nie może być tu opisany jako cztery moduły albo sześć.
Cena to `proPlansBlock()` z `src/pro.mjs` — ten sam blok, który niesie ściana — więc dwa
miejsca nie zacytują dwóch cen. Adresy pochodzą z `src/site.mjs`. Napisane od zera jest
tylko to, czego nie mówi nigdzie indziej: co zostaje darmowe, czego Pro **nie** robi
(rozdział XXIV: „to nie jest ERP"; XXII: bez podatków i rabatów; XXIII: to nie drugi
Kalendarz Google) i trzy kroki z rozdziału XXV — konto, subskrypcja, otwarte moduły.

**Kwota jest w HTML-u, i to jest połowa tej sesji.** Na ścianie cena jest pusta i wypełnia
ją skrypt, bo tam i tak trzeba mieć JavaScript. Tutaj nie: strona ma być *przeczytana*,
także przez Googlebota i przez przeglądarkę bez skryptu. Build wypisuje więc kwotę
w walucie domyślnej dla języka strony — hasło z `assets/pay.js`, jedna z czternastu
wpisanych ręcznie, **nic nie jest przeliczane** — a `assets/paywall.js` nadpisuje ją walutą,
którą odwiedzający naprawdę wybrał. Jedyne, czego obie strony nie mogą trzymać wspólnie, to
*symbol*: Node i przeglądarka niosą własne dane ICU i dla `uk-UA` jedna pisze „₴", druga
„грн". Kwota jest ta sama, więc testy porównują cyfry.

**Kto już płaci, nie widzi ceny.** `pwPage()` czyta poziom z `liczmat-signed-in` i dla
konta Pro chowa cały blok z ceną, zostawiając „Twój plan: LiczMat Pro" — proponowanie
komuś kupna tego, co już opłaca, czyta się jak groźba. To ten sam argument, dla którego
pasek nad otwartym modułem nie niesie ceny. Nic z tego niczego nie bramkuje: strona jest
publiczna, a podpowiedź o sesji może być nieaktualna.

**Trzy miejsca stały się linkiem same.** Trzecie drzwi strony głównej (`HOME_DOORS`),
„Poznaj LiczMat Pro" na ścianie i w zakładce Pro (`proMoreLink()`), oraz karta poziomu Pro
na `/app/` — wszystkie czytają status trasy, więc żadne nie wymagało edycji poza tą jedną
w `src/ia.mjs`. `/app/` nie ma własnego języka, więc jego linki niosą `data-nav-route`,
a `scripts/build.mjs` dokłada `liczmat-pro` do `window.LM_NAV`.

**Czego ta sesja nie zrobiła:** nie ruszyła paska nawigacji (mieści pięć linków i pięć
niesie), nie założyła produktów w Stripe i nie włączyła płatności — strona mówi wprost, że
subskrypcji jeszcze nie da się wykupić, dokładnie tak jak ściana.

---

### 7.14. Strona kalkulatora jako landing page (Sesja 31)

Rozdział XXXII, Sesja 31 w całości: „Indywidualne SEO dla kalkulatorów. Każdy kalkulator
powinien być możliwie dobrym landing page'em dla konkretnego zapytania użytkownika."

**Do tej sesji wszystkie 150 stron kalkulatorów mówiły o sobie jednym wzorcem.** Tytuł
brzmiał `{nazwa} — {tytuł centrum} | LiczMat`, opis pochodził z `calc_meta_pattern`
z podstawioną nazwą i jednozdaniowym opisem, a `<h1>` był etykietą z listy w centrum
kalkulatorów. Wszystko trzy technicznie poprawne i żadne nie zawierające zdania, które ktoś
naprawdę wpisuje: „ile płytek na m²", „wie viele Rollen Tapete", „cât adeziv la m²".

**Kopia stoi w `src/calc-seo.mjs`, kalkulator po kalkulatorze, język po języku.** Trzy
rzeczy na wpis: `title` (tekst `<title>`, on sam jest też `<h1>`), `desc` (meta description,
ona sama jest też akapitem pod `<h1>`) i `faq` — dwa pytania z odpowiedziami. Jedno zdanie
w dwóch miejscach zamiast dwóch zdań, bo snippet obiecujący coś, czym strona się nie
zaczyna, to ten sam błąd widziany z dwóch stron.

**To nie jest czwarty słownik i nie może nim być.** `assets/i18n.<lang>.js` pobiera każda
strona serwisu; 90 kluczy na język treści, którą zobaczy wyłącznie czytelnik gotowego
HTML-a i robot, to kilkanaście kilobajtów na każde wejście za nic. `src/` jest do tego
wycinany z artefaktu Pages. Test §7 pilnuje, że nic z tej kopii nie wyciekło do słownika.

**Kolejność jest regułą rozdziału XII i jest sprawdzana po położeniu.** `<h1>` → formularz
→ wynik → „Jak to liczymy" → FAQ. „Długie treści SEO, instrukcje i FAQ nie mogą zasłaniać
kalkulatora" mówi o *miejscu*, więc `scripts/test-calc-seo.mjs` §5 porównuje pozycje
w pliku, a nie obecność sekcji.

**FAQ i dane strukturalne czytają jedną listę.** `calcPageMain()` renderuje pytania,
`calcFaqLd()` w `scripts/build.mjs` buduje z tej samej tablicy `FAQPage` — odpowiedź
w JSON-LD, której nie ma w markupie, to strona mówiąca robotowi coś, czego nie mówi
czytelnikowi. Ta sama zasada rządzi FAQ strony głównej od Sesji 6.

**Okruszek został przy krótkiej nazwie.** Ścieżka nawigacyjna nadal niesie `c_<id>_t`
(„Płytki, panele, gres"), bo okruszek jest mapą serwisu, a „Kalkulator płytek i paneli —
ile kartonów" jest w nim tytułem, nie miejscem. Z tego samego klucza żyją karty w centrum
kalkulatorów i plakietki „Inne kalkulatory".

**Limit 60 znaków obowiązuje teraz wszystkie 375 stron.** Sesja 30 wyłączyła spod niego
strony kalkulatorów, bo ich tytuły były tematem tej sesji; `TITLE_MAX` = 50 plus
`" | LiczMat"` mieści się w 60, więc wyjątek w `scripts/test-seo.mjs` zniknął.

---

### 7.15. Bezpieczeństwo: co ten serwis broni, a czego nie (Sesja 35)

Rozdział XXXII, Sesja 35 w całości: „autoryzacja, izolacja danych, API, uprawnienia,
poziomy dostępu. GOŚĆ → LICZMAT → LICZMAT PRO."

**Granica jest jedna i nie leży w tym repozytorium.** Chronią dane wdrożone reguły
Firestore — sprawdzają `request.auth.uid`, żyją w repo aplikacji
(`config/firebase/firestore.rules`, FIRESTORE_SYNC §7) i żaden commit tutaj ich nie
osłabi ani nie wzmocni. To, co jest robotą tej strony, to **nigdy nie zaadresować**
cudzych danych, nie zostawiać kopii jednego konta na cudzym urządzeniu i nie wypuścić
poświadczenia na zewnątrz. Wszystko poniżej jest o tym; nic poniżej nie jest zamkiem
z JavaScriptu.

**`?next=` przepuszczał tabulator, a przeglądarka go kasuje.** `lmSafeNext()` odrzucał
`//evil.example`, ukośnik odwrotny i schemat — i przepuszczał `/⇥/evil.example`, bo
pierwszym znakiem był ukośnik, a drugim tabulator. Parser URL-a **usuwa** tabulator,
CR i LF, zanim przeczyta adres, więc to, co zostawało, to `//evil.example`: link „wróć
tam, gdzie byłeś" po zalogowaniu prowadził na cudzą domenę. Cały zakres C0 plus DEL jest
odrzucany. Test rozstrzyga to tak, jak rozstrzyga przeglądarka: `new URL(wynik, BASE)`
musi mieć origin `liczmat.com`.

**Token w `/p/<token>` jest poświadczeniem, więc strona nie wysyła swojego adresu.**
GA4 raportuje `page_location` — cały adres, z tokenem włącznie — a `/p/` ładowało tag
jak każda inna strona, czyli oddawało Google każdy link udostępniony klientowi. Ta jedna
strona jedzie bez analityki (flaga `secret` w `src/template.mjs`) i z
`<meta name="referrer" content="no-referrer">`. Reszta serwisu ma tag jak miała.

**Kształt tokenu sprawdzany jest przed zapytaniem, bo Firestore skleja segmenty ścieżki.**
`?t=a/b/c` adresowało `sharedProjects/a/b/c` — inny dokument w podkolekcji, o którą nikt
tu nie prosił. `SHARE_TOKEN` w `assets/share.js` (`[A-Za-z0-9_-]{16,64}`) obowiązuje oba
wejścia: parametr i ścieżkę, którą przekierowuje `404.html`.

**Kopia konta w przeglądarce ma teraz właściciela.** „Pobierz z konta do przeglądarki"
wgrywa projekty, pomieszczenia, kalkulacje i listy materiałów do `localStorage`, a nic
nigdy nie zapisywało, **czyje** one są. Na wspólnym komputerze dawało to dwa osobne błędy:
następna osoba otwierała `/projekty/` i czytała cudze projekty i ceny, a po zalogowaniu
się i naciśnięciu „Wyślij" wgrywała je na **swoje** konto, gdzie właściciel danych już
ich nie dosięgnie i nie dowie się o nich. Reguły Firestore nie mają z tym nic wspólnego —
kopia w przeglądarce leży poza wszystkim, czego reguły pilnują.

Jeden klucz, `liczmat-sync-account`, trzyma `uid` konta, z którym ta przeglądarka
synchronizowała się ostatnio (stempluje go i wysyłka, i pobranie). Kiedy stempel wskazuje
inne konto **i** w przeglądarce coś leży, `/app/` wstrzymuje synchronizację w obie strony
i mówi dlaczego. Pusta przeglądarka nie jest niczyja, więc stary stempel na niej nikogo
nie ostrzega. Sprawdzenie jest w obsłudze kliknięcia, nie tylko w atrybucie `disabled` —
`disabled` to podpowiedź dla myszy.

**Jest wreszcie czym wyczyścić urządzenie.** Karta „Usuń konto" od zawsze mówiła „Dane
w tej przeglądarce zostają — wyczyść je osobno" i nie było czym. Przycisk na zakładce
ustawień kasuje cztery magazyny danych: warsztat (`materio-workspace-v1`), otwarty projekt,
historię użytych kalkulatorów i magazyn Pro (`liczmat-crm-v1` — jedyny, który trzyma
cudze nazwisko, telefon i adres). Ustawienia zostają: język, waluta, motyw, zgoda na
analitykę i „pamiętaj mnie" nic o nikim nie mówią, a wyczyszczenie ich pokazałoby stronę
w obcym języku komuś, kto prosił o skasowanie danych. Wylogowanie to osobny przycisk
i osobna decyzja.

**Identyfikator z `localStorage` nie jest segmentem ścieżki, dopóki się go nie sprawdzi.**
`pathId()` w `assets/app.js` odrzuca puste, ukośnik, `.`, `..`, `__x__` i przesadnie długie.
Bez tego `projectId` z ukośnikiem adresował inny dokument, a `__x__` leciało wyjątkiem
w ten sam `catch`, co awaria sieci — więc synchronizacja mówiła „coś poszło nie tak"
zamiast pominąć jeden wiersz.

**CSV jest plikiem oddawanym komuś innemu.** Arkusz czyta komórkę zaczynającą się od `=`,
`+`, `-` lub `@` jako formułę, w cudzysłowie czy bez, a nazwy materiałów pisze człowiek.
`wsCsvCell()` stawia przed taką komórką apostrof, `wsFileName()` sprząta nazwę pliku
z nazwy projektu.

**Czego ta sesja nie ruszyła, świadomie:** paywall nadal nie jest granicą i nie ma nim
być (rozdział XXV chce, żeby darmowy użytkownik *rozumiał*, co jest Pro); `liczmat-crm-v1`
nadal nie jest w kontrakcie i nadal nie wyjeżdża z urządzenia; `assets/firebase-config.js`
nadal jest jawny, bo klucz Web Firebase nie jest sekretem i nie da się go ukryć
w przeglądarce.

`scripts/test-security.mjs` pilnuje wszystkich powyższych, a §17
`scripts/test-account-page.mjs` przechodzi odmowę synchronizacji i czyszczenie
przeglądarki klikaniem w Chromium.

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
| poziomy konta (Sesja 13) | inna liczba poziomów niż trzy albo inna kolejność; dwa poziomy z tym samym kluczem; poziom, który nie mówi, co potrafi; poziom wskazujący nieistniejącą trasę; brak któregokolwiek klucza `acc_*` w którymkolwiek z dziesięciu języków |
| model Free / Pro (Sesja 21) | funkcja zadeklarowana dwa razy; funkcja z nieznanym poziomem albo na nieistniejącej trasie; funkcja `PRO` na trasie, która nie jest `PRO`; trasa `PRO`, której nie pokrywa żadna funkcja; funkcja `PRO` bez tekstu do bramki; `LM_PLAN` rozjeżdżające się z kontraktem; brak któregokolwiek klucza `pro_*` / `plan_*` / `feat_*` w którymkolwiek z dziesięciu języków |
| paywall (Sesja 27) | ściana przed funkcją, której nie ma w `LM_FEATURES` (`proGate()` przerywa build); brak któregokolwiek klucza `pro_need_*` / `pro_incl_t` / `pro_signin` w którymkolwiek z dziesięciu języków |
| subskrypcja (Sesja 28) | brak któregokolwiek klucza `pay_*` / `plan_renews` / `plan_cancelled` / `plan_active_d` / `plan_cancel_d` w którymkolwiek z dziesięciu języków |
| SEO kalkulatorów (Sesja 31) | kalkulator bez kopii w `src/calc-seo.mjs` albo bez któregoś z dziesięciu języków; tytuł dłuższy niż `TITLE_MAX` (50); opis poza 50–160 znakami; FAQ, które nie jest dwiema parami pytanie/odpowiedź; pytanie bez znaku zapytania; dwa kalkulatory z tym samym tytułem w jednym języku albo z tym samym opisem gdziekolwiek |
| widoki (Sesja 15) | widok bez rodzica, na trasie planowanej albo na innym widoku; widok indeksowany; widok w menu lub w stopce; widok wymagający wyższego poziomu niż rodzic; widok inaczej zlokalizowany niż rodzic; adres widoku poza adresem rodzica albo gubiący identyfikator; `view: true` na trasie, która nie jest `LIVE` |

Wszystkie siedem zostało sprawdzone negatywnie — celowo zepsute i build faktycznie padł.
Tak samo sprawdzone są dwa dołożone w Sesji 5 (piąty link w menu, dwie pozycje na tym
samym miejscu w tej samej kolumnie stopki), cztery z Sesji 6 (czwarte drzwi, drzwi
z poziomem nie na swoim miejscu, drzwi na trasę, której nie ma, brakujący klucz
tłumaczenia drzwi) i cztery z Sesji 7: kalkulator wyjęty z kategorii, kalkulator wpisany
do dwóch kategorii, nieznany identyfikator w kategorii i skasowany klucz `cc_*_d`.

`validateCalcHub()` stoi obok `validateIA()`, a nie w niej: potrzebuje `CALCS` i `GUIDES`,
czyli skryptów przeglądarkowych, które dopiero `scripts/build.mjs` wykonuje.
