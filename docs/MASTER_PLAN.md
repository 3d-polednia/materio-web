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
| 9 | Kalkulatory grupa 1 (Płytki i wykończenie) | **Zrobione** — 2026-08-12 |
| 10 | Kalkulatory grupa 2 (Malowanie + Budowa) | **Zrobione** — 2026-08-12 |
| 11 | Kalkulatory grupa 3 (Rozkrój + Zabudowa G-K) | **Zrobione** — 2026-08-12 |
| 12 | Test kalkulatorów | **Zrobione** — 2026-08-13 |
| 13 | System konta | **Zrobione** — 2026-08-13 |
| 14 | Dashboard LiczMat | **Zrobione** — 2026-08-13 |
| 15 | Projekty (CRUD) | **Zrobione** — 2026-08-13 |
| 16 | Zapis kalkulacji | **Zrobione** — 2026-08-13 |
| 17 | Listy materiałów | **Zrobione** — 2026-08-13 |
| 18 | Edycja materiałów | **Zrobione** — 2026-08-14 |
| 19 | Koszty projektu | **Zrobione** — 2026-08-14 |
| 20 | Pomieszczenia | **Zrobione** — 2026-08-14 |
| 21 | LiczMat Pro: fundament | **Zrobione** — 2026-08-19 |
| 22 | Klienci | **Zrobione** — 2026-08-19 |
| 23 | Zlecenia | **Zrobione** — 2026-08-19 |
| 24 | Wyceny | **Zrobione** — 2026-08-19 |
| 25 | Terminarz | **Zrobione** — 2026-08-19 |
| 26 | CRM | **Zrobione** — 2026-08-19 |
| 27 | Paywall Pro | **Zrobione** — 2026-08-19 |
| 28 | Płatności | **Zrobione** — 2026-08-19 |
| — | *Etap dodatkowy: przywrócenie 10 języków* | **Zrobione** — 2026-08-19 |
| 29 | Strona LiczMat Pro | **Zrobione** — 2026-08-20 |
| 30 | SEO techniczne | **Zrobione** — 2026-08-20 |
| 31 | SEO kalkulatorów | **Zrobione** — 2026-08-20 |
| 32 | Mobile QA | **Zrobione** — 2026-08-20 |
| 33 | Performance | **Zrobione** — 2026-08-20 |
| 34 | Accessibility | **Zrobione** — 2026-08-20 |
| 35 | Security | **Zrobione** — 2026-08-20 |
| 36 | Finalny QA | **Zrobione** — 2026-08-20 |

## Plan naprawczy i sprzedażowy — sesje 37–48

Master Plan skończył się na Sesji 36 i `MASTER_PLAN.txt` nie ma Sesji 37. To jest lista
**po** planie: rzeczy zgłoszone przez właściciela, pozycje, które poprzednie sesje odłożyły
„poza zakres", i defekty zmierzone w przeglądzie 2026-08-21. Kolejność jest sprzedażowa —
najpierw to, co sprawia, że LiczMat Pro da się komuś sprzedać i odebrać.

`MASTER_PLAN.txt` zostaje nietknięty: należy do właściciela i żadna sesja go nie przepisuje.

| Sesja | Zakres | Status |
|---|---|---|
| 37 | Pro nadawane po e-mailu + `/app/` widzi plan na żywo | **Zrobione** — 2026-08-21 |
| 38 | Stripe: webhook nadający plan (`functions/`) | **Zrobione** — 2026-08-21, czeka na wdrożenie |
| 39 | Stripe: sprzedaż włączona | **Repozytorium gotowe** — 2026-08-21, czeka na konto Stripe i trzy adresy (właściciel, `docs/STRIPE.md`) |
| 40 | „LiczMat Pro" w nagłówku (Poradniki → stopka) | **Zrobione** — 2026-08-26 |
| 41 | Sześć języków bez nazwy (`undefined` w wybieraku) | **Zrobione** — 2026-08-26 |
| 42 | `/app/`: fałszywe „Brak sieci" | **Zrobione** — 2026-08-26 |
| 43 | Kalkulator na prawdziwym telefonie | **Zrobione** — 2026-08-26 |
| 44 | Stop slop: zasady, test, pl/uk/de/en | **Zrobione** — 2026-08-26 |
| 45 | Stop slop: cs/sk/ro/hr/sr/ru | **Zrobione** — 2026-08-26 |
| 46 | Klienci, zlecenia i wyceny na telefon (repo aplikacji) | **Zrobione** — 2026-08-26. Reguły czekają na wdrożenie: konsola, po planie (lista niżej) |
| 47 | Błąd zaokrąglenia w silnikach Androida (repo aplikacji) | **Zrobione** — 2026-08-27, commit `b231bab`. Czeka na wydanie AAB (właściciel) |
| 48 | Prawda w dokumentacji i lista rzeczy w konsolach | **Zrobione** — 2026-08-27 |
| 49 | Panel admina w przeglądarce — plan po e-mailu, bez terminala | **Zrobione** — 2026-08-27. Czeka na `firebase deploy --only functions` i jedno nadanie uprawnienia (właściciel, `docs/ADMIN.md`) |
| 50 | Aplikacja wygląda tak samo jak strona (repo aplikacji) | **Zrobione** — 2026-08-27. Czeka na wydanie AAB (właściciel) |
| 51 | Audyt strona ↔ aplikacja + trzeci tryb motywu na stronie | **Zrobione** — 2026-08-27 |
| 52 | Jeden kalkulator zamiast dwóch: ścianka działowa i zabudowa (repo aplikacji) | **Zrobione** — 2026-08-27, commit `61bb0c6`. Czeka na wydanie AAB (właściciel) |
| 53 | Terminarz w aplikacji (repo aplikacji) | **Zrobione** — 2026-08-27, commit `24faead`. Czeka na wydanie AAB (właściciel) |
| 54 | Łańcuch i historia w aplikacji (repo aplikacji) | **Zrobione** — 2026-08-27, commit `68c026a`. Czeka na wydanie AAB (właściciel) |
| 55 | Kształt pola formularza ze strony + przepisanie testów (repo aplikacji) | **Zrobione** — 2026-08-28, commit `0e7c47d`. Czeka na wydanie AAB (właściciel) |
| 56 | „Wybierz materiał” i presety, jeden kształt — B2 + B3 + B4 + B5 (repo aplikacji) | **Zrobione** — 2026-08-28, commit `bed1926`. Czeka na wydanie AAB (właściciel) |
| 57 | Konwerter jednostek na stronie — C1 (repo serwisu) | **Zrobione** — 2026-08-29 |
| 58 | Udostępnianie kosztorysu linkiem w aplikacji — C5 (repo aplikacji) | **Zrobione** — 2026-08-29, commit `68506a4`. Czeka na wydanie AAB (właściciel) |
| 59 | Eksport PDF i własne materiały — C6 (oba repozytoria) | **Zrobione** — 2026-08-30. Reguły i AAB czekają (właściciel) |
| 60 | Flagi w wybieraku języka na telefonie — połowa D4 (repo aplikacji) | **Zrobione** — 2026-08-30. Czeka na wydanie AAB (właściciel) |

Sesja 49 doszła 2026-08-21 na prośbę właściciela: docelowo plan ma się przestawiać
kliknięciem przy adresie e-mail, w przeglądarce, bez terminala. Wymaga serwera, który
sprawdzi, kto pyta — a ten serwer powstaje w Sesji 38, więc panel jest po nim tani.
Właściciel wybrał kolejność: **najpierw sprzedaż, panel na końcu**. `scripts/pro-admin.mjs`
zostaje niezależnie od panelu: narzędzie, które potrzebuje wyłącznie klucza, jest tym,
czym się ratuje, gdy funkcja albo Firebase leżą.

Zrobione 2026-08-27: zakładka **Admin** na `/app/` (szósta, tylko dla konta z uprawnieniem),
funkcja `adminPlan` w `functions/` obok webhooka, i `pro-admin.mjs admin <adres>` jako jedyna
rzecz, która zostaje w terminalu — bo panel otwiera się na uprawnienie, a uprawnienie zapisze
tylko coś z prawami administratora. Klikanie opisuje [`ADMIN.md`](ADMIN.md).

Sesja 50 doszła 2026-08-27 na prośbę właściciela: „aplikacja ma wyglądać identycznie jak
strona". Zrobione w repo aplikacji: tokeny ze `assets/styles.css` przepisane do
`core/designsystem/theme/` (kolor w obu motywach, typografia, skala odstępów, promienie,
wysokości kontrolek), wspólne komponenty ustawione na wzorce ze strony (karta, przycisk,
pole, chip, pasek górny i dolny, kafelek ikony, pole wyniku) i tło okna, żeby zimny start nie
błyskał białym. Aplikacja stała na oliwce Material 3 (`#626B38`) od początku, a strona jest na
limonce i kremie od rebrandingu 2026-08-12 — to jest ta różnica.

Trzy zrzuty ekranu na `/aplikacja/` przerenderowane z nowej aplikacji tym samym testem
Roborazzi, który zrobił poprzednie. **Do zamknięcia zostaje wydanie AAB** — dopóki go nie
ma, strona pokazuje aplikację, której nikt jeszcze nie zainstaluje (punkt 2 listy niżej).

Sesja 52 to pierwsza pozycja kodowa z wieczornego planu właściciela (2026-08-27), a ten
plan bierze się z audytu parytetu strona ↔ aplikacja z Sesji 51. Znalezisko **C4**: aplikacja
miała w wybieraku `STUD_WALL` i `WALL_LINING` — ten sam rachunek profili i ścieżek z tych
samych czterech pól, różniący się **wyłącznie** liczbą płytowanych stron, wpisaną w kod przy
każdej z dwóch pozycji. Stąd 16 kalkulatorów w aplikacji przy 15 na stronie: nadwyżka nie była
funkcją, której serwisowi brakuje, tylko jedną robotą policzoną dwa razy.

Strona trzyma to jako **pole** `sides` od dnia, w którym powstała, i strona jest źródłem prawdy
(`docs/DESIGN_SYSTEM.md`). Więc w aplikacji `WALL_LINING` znika, `STUD_WALL` dostaje pole
(domyślnie 2, dwie odpowiedzi jako chipy — żadnej z nich się nie mierzy), a `FramingCalc.studWall`
przyjmował `boardSides` już wcześniej, więc **arytmetyka nie drgnęła** i żadna oczekiwana liczba
w `TradeCalcTest` się nie zmieniła.

Jedyne miejsce, które wiedziało, którą z dwóch robót proponuje, to skrót z ekranu pomieszczenia:
zabudowa własnych ścian pokoju jest jednostronna. Trasa `trade?` dostała więc argument `sides`,
a skrót podaje `"1"` — bez tego lądowałby na ściance działowej i po cichu kupował dwa razy tyle
płyt. Etykieta `framing_board_sides` to **słowo strony** we wszystkich dziesięciu językach
(„Strony do płytowania", „Boarded sides", „Beplankte Seiten", …), przepisane, a nie wymyślone —
jedno pole nie ma się nazywać na dwa sposoby w dwóch produktach. 221/221 testów przechodzi.

Zostaje to samo, co przy Sesjach 46, 47 i 50: **dopóki nie ma wydania AAB, w sklepie stoi
aplikacja z szesnastoma pozycjami.** To punkt 2 listy „Do zrobienia w konsolach".

Sesja 53 to druga pozycja kodowa wieczornego planu i znalezisko **C2** audytu: terminarz był
**tylko na stronie**, a to jest akurat ta połowa Pro, której fachowiec używa **na budowie** — czyli
tam, gdzie ma telefon, a nie przeglądarkę. Zlecenie miało `dueDate` od Sesji 46 i nie było ekranu,
który by tę datę zebrał. Po tej sesji Pro to **cztery moduły w aplikacji** przy pięciu na stronie;
zostaje łańcuch i historia (C3).

Moduł **nic nie zapisuje** i to jest cała sesja. Termin jest polem zlecenia, więc
`feature/crm/Schedule.kt` to *czytanie* zleceń: pięć kubełków (po terminie, dziś, do 7 dni, później,
bez daty), zlecenia zamknięte w żadnym z nich, a jedyny zapis to `updateJob(dueDate = …)` — to samo
wywołanie, które robi ekran zleceń. Osobna tabela dałaby jednej dacie dwa domy. Trasa nie ma `?id=`
z tego samego powodu: wiersz zastępuje zlecenie.

`Schedule` to `crmSchedule()` z `assets/crm.js` kubełek w kubełek i sortowanie w sortowanie — ta
sama granica (dzień 7 to jeszcze „do 7 dni"), ta sama kolejność, ta sama zasada, że zakończone
zlecenie po terminie **nie jest** zaległe. Dwa produkty układające tydzień jednego fachowca na dwa
sposoby byłyby gorsze niż jeden układający go źle.

Dwie rzeczy mają w sobie strefę czasową i obie są zapisane: **„dziś" to dzień kalendarzowy
urządzenia** (w UTC to wczoraj o 00:30 w Warszawie i jutro o 20:00 w Nowym Jorku), a **odległość
dwóch dni liczy się o północy UTC** (lokalnie ma 23 albo 25 godzin dwa razy w roku). Wybierak daty
Materiala oddaje północ UTC dnia, w który padł palec, więc czyta się go też w UTC.

Dwadzieścia kluczy `cal_*` to **słowa strony**, przepisane z `assets/i18n-pages.js` w dziesięciu
językach, a nie wymyślone. „za 3 dni" pisze Android (`DateUtils`), bo niesie wszystkie formy mnogie
wszystkich dziesięciu języków; jedyne, co mówi źle, to zero — i tam wchodzi `cal_today_t`.

232/232 testów przechodzi. **Strona nie zmieniła się o bajt** — ta sesja jest w całości po stronie
telefonu i, jak 46, 47, 50 i 52, czeka na wydanie AAB.

Sesja 54 to trzecia pozycja kodowa wieczornego planu i znalezisko **C3**: pasek ścieżki, lista
wycen i wyprowadzona historia stały **tylko na stronie**. Linki w danych były od Sesji 46 — nikt po
nich nie chodził. Razem z Sesją 53 to jest cały powód, dla którego licznik audytu mówił **5 / 3**:
kto płacił za Pro i otwierał telefon, dostawał mniej, niż kupił. **Teraz jest 5 / 5.**

Sesja **nie dodała tabeli ani ekranu**. `CrmChain.of()` chodzi po `projectIds` klienta oraz
`clientId`/`projectId` zlecenia i wyceny, z każdego z czterech końców. Zapisany łańcuch byłby piątą
kopią czterech linków, wolną rozjechać się z każdym z nich przy pierwszej zmianie właściciela
projektu. W górę przejście jest **dokładne** (wycena ma jeden projekt, projekt najwyżej jedno
zlecenie, zlecenie najwyżej jednego klienta), w dół oddaje **listę**, bo klient ma wiele zleceń.

Brakujący krok to `null`, nigdy błąd: że zlecenie nie ma jeszcze klienta, to dokładnie ta rzecz,
którą pasek ma pokazać. Jedna pułapka rozbita celowo w teście: każdy niepowiązany wiersz nosi `""`
w tej samej kolumnie, więc nieostrożne porównanie wpisałoby **każdy projekt każdemu klientowi**.

Historia wylicza się z dokumentów i dat, które już mają, i mówi wprost, czego przez to nie pokaże:
tylko powstania. Zmiana statusu i przesunięty termin nie zostawiają nigdzie daty — wiersz ma jedno
`updatedAt`, które mówi *kiedy*, nigdy *co*. Dziennik zdarzeń to ERP, którego rozdział XXIV zabrania
w ostatnim zdaniu, i zacząłby kłamać przy pierwszym skasowanym wierszu.

`ProjectRepository.entriesOf()` **czyta** flagę `manual` ze strony (rozdział XVII, „inne koszty"
wpisywane ręcznie w przeglądarce, w `inputJson`) i sam żadnej nie zapisuje — dzięki temu koszt
wpisany ręcznie nie ogłasza się na telefonie jako kalkulacja, której nikt nie policzył.

Piętnaście kluczy to **słowa strony** w dziesięciu językach; `crm_quotes_empty` już w aplikacji było
i zostało użyte ponownie, zamiast dorabiać synonim. 245/245 testów przechodzi. **Strona nie zmieniła
się o bajt.**

Sesja 55 to czwarta pozycja kodowa wieczornego planu i znalezisko **M**: pole formularza.
Sesja 50 przepisała ze strony kolory, typografię, odstępy i promienie, a **kształt jednej
kontrolki, z której zrobiony jest kalkulator**, został M3-owy. To nie jest detal:
`OutlinedTextField` wpuszcza etykietę **w obramowanie** i ma minimum 56 dp, a strona stawia
etykietę w **osobnej linii nad** polem i daje pudełku 44 dp — tyle, ile ma przycisk obok —
z `--field-bg` w środku, jednym włoskiem `--outline-control`, promieniem `--radius-xs`,
tekstem 16 sp i `--accent` na focusie. Dwa produkty pytały o ten sam wymiar w dwóch
kształtach.

`MaterioField` w `core/designsystem/component/Fields.kt` to ta reguła przepisana, i
**wszystkie pola w `feature/` przez nią przechodzą** — oba kalkulatory, pomieszczenie,
konto, dialogi projektu i zapisu, formularz PDF, CRM i trzy wyszukiwarki. `NumericField`
i `DropdownPicker` stoją na niej; `<select>` to to samo pudełko tylko do odczytu, z listą
na końcu. Poza tym plikiem nikt już nie sięga po widżet M3.

**Etykieta wychodząc z pudełka zabiera polu nazwę.** W M3 etykieta *była* nazwą dostępności;
`Text` nad pudełkiem to rodzeństwo, więc TalkBack przeczytałby „pole edycji, puste".
`MaterioField` wpisuje więc etykietę w `contentDescription` — to jest ten sam `aria-label`,
który strona stawia na tych samych kontrolkach. Wyszukiwarka nazwę nosi i **nie rysuje**
linii etykiety: lupa i podpowiedź mówią, czym jest, na ekranie — a podpowiedź znika, gdy
ktoś zacznie pisać.

Stąd druga połowa zadania: **testy trzeba było przepisać, nie poprawić**.
`onNodeWithText(label)` trafiał w pole tylko dlatego, że etykieta była w środku. Teraz
trafia w linię etykiety, a pisanie po linii tekstu kończy się błędem — 16 testów, dokładnie
te, które wypełniają formularz. Chodzą przez **jeden** pomocnik, `field(label)` w
`FieldFinders.kt`, więc kolejna zmiana mechanizmu to jedna edycja, a nie pięćdziesiąt.

`FieldShapeTest` jest nowy i pyta **wyrenderowany ekran** o to, o co jest ta sesja: pudełko
ma co najmniej 44 dp, etykieta stoi nad nim, pole nosi nazwę i przyjmuje tekst, a
wyszukiwarka nie rysuje etykiety, ale nazwę ma. Dwa z nich puszczono na kodzie **z
usuniętą poprawką**, żeby sprawdzić, że naprawdę potrafią nie przejść. Piąty pilnuje
`fieldModifier`: `FocusRequester` podany do `modifier` ląduje na kolumnie i nic nie robi, a
dialog zmiany nazwy połyka nieudane żądanie focusa z założenia — czyli nikt by nie zgłosił,
że klawiatura przestała się otwierać.

`scripts/check-contrast.mjs` w repo aplikacji dostał dwie pary, które pole teraz nosi:
wpisana wartość i podpowiedź na tle `--field-bg`, w obu motywach. **Bliźniak na stronie miał
obie od dawna** — to plik aplikacji nadrabia. 48 par, zero błędów.

251/251 testów przechodzi. Po stronie serwisu zmieniły się **dwa pliki binarne**: zrzuty
`pl_calc.webp` i `pl_stores.webp` na `/aplikacja/`, bo oba te ekrany rysują pola.
`pl_home.webp` **został nietknięty** — na tym ekranie nie ma ani jednego pola, a
przekodowanie bez zmiany to śmieć w historii (zmierzone: 0,08 % pikseli, czyli szum
kodera, przy 18,9 % na wyszukiwarce sklepów i 2,1 % na kalkulatorze). Jak 46, 47, 50, 52,
53 i 54 — **czeka na wydanie AAB**.

Sesja 56 to piąta pozycja kolejności audytu i cztery znaleziska naraz — **B2, B3, B4 i B5** —
bo wszystkie cztery to jeden przebieg po komponentach wspólnych. Tokeny są wspólne od
Sesji 50; to, co zostało, to komponenty, które składały je inaczej.

**B2.** Strona otwiera katalog **przyciskiem pobocznym** na całą szerokość, pod nim stawia
jedną linię `--accent-soft` z tym, co wstawiła, a obok **rząd chipów z presetami**.
Aplikacja rysowała kartę `--accent-soft` z limonkowym kaflem ikony i strzałką — głośniejszą
niż akcja główna pod nią, w kształcie, którego strona nie ma nigdzie, i **bez presetów**.
`MaterialShortcuts.kt` niesie trzy rzędy, które ma strona: cztery dla malarza, cztery
formaty dla glazurnika i te same formaty **bez panelu** dla fugi, bo podłoga pływająca nie
ma spoiny.

**Chip nosi identyfikator z katalogu, nigdy kopię liczb.** `preset_gres1` na stronie wstawia
1,44 m²/opak. i 7 % zapasu, a `gres-60x60` w `CatalogSurface.kt` **jest** tymi dwiema
liczbami — rząd na stronie powstał z tego samego katalogu. Druga kopia byłaby wolna
rozjechać się przy pierwszej poprawce formatu. Na ekranie fugi to, który chip jest wybrany,
**wylicza się z dwóch pól**, a nie leży obok nich: `fields` to jest to, co dostaje
`compute()`, a klucz, którego nic nie liczy, nie ma po co w tym jechać.

**B3.** Chip i zakładka to ta sama pigułka z inną robotą, a strona rysuje je na **dwóch
tłach**: `.chip` na `--surface-alt`, `.calc-tab` na `--surface`. Aplikacja miała zakładkę
(`SegmentedControl`) i `FilterChip` z Materiala, który rysuje **trzecią** rzecz — przezroczyste
tło za obramowaniem. `MaterioChip` to chip strony; przeszło na niego czternaście miejsc:
filtry sklepów, presety układu, statusy zleceń, wybieraki projektu, rozstaw stelaża
i podpowiedzi łańcucha. `SegmentedControl` **nietknięty** — wszystkie pięć jego użyć
przełącza widok, czyli jest zakładką.

**B4.** `OutlinedButton` z Materiala bierze `outline` ze schematu, czyli tutaj
`--outline-control` (`#8b8577`) — obramowanie **pola formularza**, trzymane na 3:1, bo to
jedyna rzecz mówiąca, gdzie dotknąć. Przycisk poboczny polem nie jest i strona daje mu
lżejsze `--outline-strong` (`#cbc4b4`).

**B5.** `LevelBadge` to `.door-level` ze strony, na każdym kaflu ekranu głównego: **BEZ
KONTA** na czterech narzędziach, **DLA FACHOWCÓW** na czterech ekranach Pro. To etykieta,
nigdy bramka. Do tej sesji jedynym miejscem, w którym darmowy użytkownik dowiadywał się, że
Pro istnieje, była ściana **po** wejściu w moduł — odwrotna kolejność niż trzeba przy jedynej
rzeczy w tym produkcie, którą się sprzedaje.

Dwanaście stringów to **słowa strony** w dziesięciu językach, przepisane: osiem etykiet
presetów, „Wstawiono z katalogu:" i trzy nazwy poziomów z rozdziału II.

**259/259 testów przechodzi** (dwa nowe zestawy, osiem sprawdzeń).
`MaterialShortcutsTest` pyta o właściwości, nie o liczby: każdy skrót istnieje w katalogu,
każdy niesie to, o co poprosi jego kalkulator, fuga ma formaty płytek i nie ma panelu,
a kliknięcie chipa wstawia pole opakowania **odczytane tym samym wyszukaniem** — test nie
podaje własnej liczby, dokładnie z tego powodu, dla którego chip nie trzyma swojej.
`LevelBadgeTest` liczy po cztery kafle każdego poziomu i mierzy chip jako cel dotyku.

Po stronie serwisu: **trzy zrzuty na `/aplikacja/` przerenderowane** — tym razem zmieniły się
wszystkie trzy ekrany (16,2 / 10,4 / 8,5 % pikseli). Jak 46, 47, 50, 52, 53, 54 i 55 —
**czeka na wydanie AAB**.

## Sesja 57 — konwerter jednostek na stronie (C1)

**WYKONANO.** Serwis ma jedenaste narzędzie i dziesięć nowych adresów:
`/konwerter-jednostek/` i jego dziewięć bliźniaków. To pozycja **C1** audytu parytetu —
największa i jedyna, która dokłada ruchu, a nie tylko równa wygląd.

**Silnik jest portem 1:1** `core/calculation/UnitConverter.kt` z repozytorium aplikacji:
te same jedenaście kategorii w tej samej kolejności, te same **82 jednostki**, te same
mnożniki co do cyfry i ta sama osobna gałąź dla temperatury. Dwa produkty odpowiadające
różnie na „ile cali ma metr" to dokładnie ten defekt, którego audyt szukał, więc żadna
liczba nie została tu „poprawiona". Dwie liczby aplikacji są zaokrągleniem definicji:
`fl oz` to 0,0295735296 zamiast dokładnego 0,0295735295625, a `mmHg` to milimetr słupa rtęci,
nie tor. Port je **zachowuje**, a §2 testu mówi, o ile chybiają (jedna część na 10⁷) i
dlaczego to jest sześć miejsc poniżej czegokolwiek, co strona drukuje.

**Jedno pole jest decyzją serwisu, nie aplikacji:** `def` — para, na której otwiera się
każda kategoria. Aplikacja otwiera każdą na dwóch pierwszych jednostkach z listy (mm → cm),
czyli na tym, co daje lista, a nie na tym, po co ktoś przyszedł. Strona otwiera długość na
m → cm, temperaturę na °C → °F, ciśnienie na bar → psi, moc na kW → KM. To ta sama granica,
którą `CALC_CATEGORIES` w `src/ia.mjs` trzyma dla kalkulatorów: jak **serwis** grupuje i
otwiera swoje narzędzia, jest decyzją serwisu; silnik zostaje nietknięty (rozdział XIII).

**Symbole jednostek nie są tłumaczone** — mm, ha, km/h, °C są te same w dziesięciu
językach. To decyzja aplikacji, odziedziczona razem z tabelą, i kosztuje jedenaście
przetłumaczonych stringów zamiast dziewięćdziesięciu. Nazwa modułu i nazwy jedenastu
kategorii są **przepisane z aplikacji** (`converter_title`, `conv_cat_*`) — jeden moduł nie
może się nazywać dwiema rzeczami na dwóch produktach, to zasada Sesji 53 puszczona w drugą
stronę. Slug idzie za nazwą: `/konwerter-jednostek/`, `/en/unit-converter/`,
`/de/einheitenumrechner/` — dziesięć razy ta sama nazwa, po ASCII.

**Odpowiedź jest w HTML-u.** Build liczy 1 m → cm tymi samymi funkcjami, które strona potem
pobiera, i wpisuje wynik do znacznika — tak samo jak strona kalkulatora niesie policzony
przykład od Sesji 8. Bez tego strona bez JavaScriptu jest pustym formularzem. Pod
narzędziem stoi **spis: jedenaście kategorii i wszystkie ich jednostki wypisane** — to jest
treść tej strony dla robota i dla czytelnika bez skryptu.

**Teksty strony siedzą w `src/conv-copy.mjs`, nie w słowniku**, i to nie jest porządek dla
porządku. Pierwsza wersja włożyła 25 kluczy do `assets/i18n-pages.js`, a ten plik ląduje
w pakiecie, który pobiera **każda** strona serwisu: `/app/` przekroczyło swój budżet
w `scripts/test-perf.mjs` o kilobajt. Ten sam argument, który trzyma `src/calc-seo.mjs`
poza słownikiem. Dwa klucze zostały w słowniku i oba mają powód: `conv_bad` pisze
przeglądarka, a `convpage_title` jest etykietą linku w **stopce każdej z 383 stron** —
`src/template.mjs` bierze ją z `footer.key` trasy.

**PROBLEMY — jeden, znaleziony i naprawiony w tej sesji.** Przeniesienie `convpage_title`
do `src/` sprawiło, że stopka **wszystkich 383 stron, we wszystkich dziesięciu językach**,
wydrukowała dosłowne słowo `convpage_title`. Build nie protestował, wszystkie 26 zestawów
było zielonych. To jest defekt Sesji 41 z innym kluczem: `t()` odpowiada nazwą klucza,
kiedy klucza nie ma, i nic tego nie porównuje. §7 `scripts/test-converter.mjs` jest teraz
siecią na to — **żaden klucz `conv_*` nie może pojawić się na żadnej wysłanej stronie**.
Dziura ogólna zostaje otwarta i jest nazwana niżej.

**ZMIENIONE PLIKI.**
`assets/converter.js` (nowy — silnik i formularz), `src/conv-copy.mjs` (nowy — słowa strony
w dziesięciu językach), `src/site.mjs` (`SECTION.converter`, `urlConverter`), `src/ia.mjs`
(trasa `converter`, przenumerowana kolumna produktowa stopki), `src/pages.mjs`
(`converterMain()`, kafel na hubie), `scripts/build.mjs` (`buildConverterPage()`,
walidacja tekstów, STAMP `20260829a`), `assets/i18n-pages.js` (dwa klucze),
`scripts/test-converter.mjs` i `scripts/test-converter-page.mjs` (nowe),
`scripts/test-copy.mjs` (budżet), `scripts/test-perf.mjs` (budżet strony),
`scripts/test-mobile.mjs` (konwerter w przemiataniu szerokości), `scripts/test-seo.mjs`,
`scripts/test-a11y.mjs`, `scripts/test-langs.mjs` (liczniki stron 375 → 385),
`privacy-policy.html` i `404.html` (stempel ręcznie), `CLAUDE.md`, `docs/ARCHITEKTURA.md`,
plus 383 wygenerowane strony i `sitemap.xml`.

**TESTY.** Wszystkie 28 zestawów logicznych przechodzą; nowy `test-converter.mjs` ma
**1276 sprawdzeń**, nowy `test-converter-page.mjs` **192 w Chromium** (nic nie jest
podstawiane). Przeglądarkowe: `test-pages` 759, `test-mobile` 1254, `test-phone` 372,
`test-a11y-page` 59, `test-qa` 687 — wszystkie zielone.

**Oczekiwania testu są wyprowadzone, nigdy przepisane z tabeli.** Odczytanie mnożnika
z `assets/converter.js` i sprawdzenie tego samego mnożnika nie sprawdza niczego — przeszłoby
z każdą liczbą w pliku zepsutą tak samo. §2 pracuje więc na zależnościach, których w tym
repozytorium nie ma: cal to 2,54 cm, mila to 1760 jardów, akr to 4840 jardów kwadratowych,
mila morska to 1852 m, galon to 4 kwarty i 128 uncji płynu. To lekcja, którą Sesja 47
zapisała w repo aplikacji.

**Dwa budżety podniesione, oba zmierzone.** `converter: 280` w `scripts/test-copy.mjs`
(najszersza wersja, angielska, ma 274 słowa) i `calculators: 350 → 370` (hub urósł
o jeden kafel; angielski ma 362). Oba to **listy, nie proza**: „Długość — mm, cm, dm, m,
km, in, ft, yd, mi, nmi" to dziesięć słów i jeden fakt, a właściwej prozy strona ma cztery
zdania. Strona konwertera dostała też własny budżet wagi w `scripts/test-perf.mjs`
(207,0 kB / 60,9 kB gz przy 220 / 62).

**STATUS.** Zrobione, w repozytorium serwisu, na `main`. Nic nie czeka na konsolę: strona
jest statyczna, nie dotyka sieci, nie ma konta i niczego nie zapisuje. Wchodzi do
`sitemap.xml` od razu.

**Do zapisania na później, nie zrobione w tej sesji** (rozdział XXXV — jedno zadanie):

- **`t()` milczy przy braku klucza.** Szablon, który wyda nieistniejący klucz, drukuje jego
  nazwę i build nie protestuje. Sieć założona w tej sesji łapie tylko `conv_*`. Zestaw
  kluczy, których naprawdę używają szablony, kontra słownik, to osobna sesja — i jest to ta
  sama rodzina defektów, co Sesja 41.
- **`/app/` stoi 100 bajtów pod swoim budżetem wagi** (354,9 kB przy 355). Następna sesja,
  która dołoży klucz do słownika, zapali `test-perf`. To jest budżet działający zgodnie
  z zamysłem, ale warto o tym wiedzieć zawczasu.
- **Konwerter nie ma FAQ** ani danych strukturalnych `FAQPage`, które mają strony
  kalkulatorów. Zdecydowanie świadome: to kolejne 40 zdań prozy w dziesięciu językach na
  stronie, której treścią są liczby.
- **Aplikacja nie wie o tym adresie.** Ekran konwertera w aplikacji nie linkuje do serwisu
  i nie musi — ale gdyby parytet miał iść w drugą stronę, to jest jedno miejsce.

**NASTĘPNE ZADANIE: Sesja 58 — udostępnianie kosztorysu linkiem w aplikacji (C5, repo
aplikacji).** Nazwana, nie zaczęta.

## Sesja 58 — udostępnianie kosztorysu linkiem w aplikacji (C5)

**WYKONANO.** Fachowiec na budowie może wysłać klientowi **adres**, a nie plik CSV.
Ekran projektu → zakładka „Podsumowanie" → blok **„Link do wyceny"**: „Udostępnij"
zapisuje snapshot i podaje `https://liczmat.com/p/<token>` do Sharesheeta Androida,
„Odśwież link" nadpisuje ten sam dokument, „Wyłącz link" go kasuje. To pozycja **C5**
audytu parytetu i ostatnia z siedmiu pozycji kodowych jego kolejności.

**Nie brakowało backendu — brakowało przycisku.** `sharedProjects/{token}` jest
w `docs/FIRESTORE_SYNC.md` §6 od pierwszej wersji, `CloudSync.deleteAccount()` zbiera te
dokumenty po `ownerId` od 2026-08-08, wdrożone reguły mają `validShare()`, a strona czyta
`/p/<token>` od 2026-08-07. Aplikacja udostępniała **plik CSV**. Audyt wycenił to na (S)
i wycenił dobrze: jeden zapis i jedno pole w bazie.

**Decyzja siedzi osobno od Firebase.** `core/share/ShareLink.kt` nie importuje ani
Firebase, ani Androida — token, adres i dokument to czysty Kotlin, więc `ShareLinkTest`
sprawdza je zwykłym JUnitem. To ten sam podział, który sprawia, że `SyncContract` da się
testować bez sieci, i ten sam, którym stoi `functions/stripe-map.mjs` w tym repozytorium.
Zapisuje `ProjectShareRepository` i jest jedyną rzeczą w aplikacji, która dotyka tej
kolekcji.

**Wiersze snapshotu to dokumenty kontraktu**, `SyncContract.estimationToDoc()`
i `shoppingItemToDoc()`, a nie drugi kształt wymyślony dla udostępniania: `/p/` czyta te
nazwy pól, które pisze synchronizacja, więc drugie mapowanie byłoby drugą szansą na
rozjazd. Limity (200 kalkulacji, 500 pozycji, nazwa 120 znaków) są te, których pilnuje
`validShare()`, a test **czyta je z pliku reguł** zamiast powtarzać liczby.

**Świeżość jest przyciskiem, bo dokument jest kopią.** „Odśwież link" pisze po **tym samym**
tokenie — `createdAt` jest odczytywane z dokumentu i zachowane, rusza się tylko
`refreshedAt` — bo drugie dotknięcie, które wybija drugi token, zostawia publiczną kopię,
której nikt już nie znajdzie. „Wyłącz link" kasuje dokument i link przestaje działać
natychmiast. Wariant „zawsze aktualny" wymagałby Cloud Functions i §6 odrzuca go od
początku.

**Token jest lokalny dla urządzenia i to jest decyzja z ceną.** Trzyma go kolumna
`projects.shareToken` (migracja Room **6 → 7**, jedno pole `NULL`-owalne);
`SyncContract.projectToDoc()` buduje dokument ze stałej mapy, więc token nigdzie nie
jedzie. Powód: to **jest** sekret, a po drugiej stronie nie ma dla niego czytelnika —
przeglądarka nie pamięta żadnego ze swoich linków (`assets/app.js` oddaje adres raz,
przy kliknięciu, i nic go nie zapisuje). Cena jest wprost: link zrobiony na telefonie
odświeża się i wyłącza **na tym telefonie**. Usunięcie konta i tak zbiera wszystkie po
`ownerId`, a od tej sesji czyści też kolumnę, żeby projekt nie oferował adresu, który już
nie istnieje.

**Kształt tokena jest sprawdzany, zanim stanie się ścieżką.** Firestore skleja segmenty,
więc `a/b/c` zaadresowałby inny dokument w innej podkolekcji; `ShareLink.TOKEN` to ten sam
`[A-Za-z0-9_-]{16,64}`, którego pilnuje `assets/share.js` (Sesja 35). 128 bitów koduje się
base64url **ręcznie**, bo `java.util.Base64` to API 26, a aplikacja ma minSdk 24 — i test
sprawdza ten koder względem JDK-owego na każdej długości od 1 do 40 bajtów, a nie względem
niego samego.

**Dziewięć stringów, pięć z nich to słowa strony.** `app_share`, `app_share_refresh`,
`app_share_revoke` i `app_share_hint` **już były** w `assets/i18n-pages.js` w dziesięciu
językach — słowa istniały, zanim na którymkolwiek produkcie powstały przyciski. Cztery nowe
biorą rzeczownik, którego strona `/p/` używa w danym języku na kosztorys (wycena /
Kalkulation / кошторис / rozpočet / deviz / troškovnik / predmer / смета), żeby jedna rzecz
nie nazywała się dwiema. Nieudany zapis mówi `account_err_unknown`, zamiast dorabiać
dziesiąty klucz.

**Publikowanie wymaga konta i blok mówi to wprost** — dokument zapisuje, czyj jest, więc bez
uid nie ma czego napisać. To nie jest bramka na niczym: kosztorys jest własny, a eksport CSV
działa dalej bez konta.

**ZMIENIONE PLIKI** (wszystkie w `3d-polednia/Materio`):
`core/share/ShareLink.kt` i `core/share/ProjectShareRepository.kt` (nowe),
`core/database/entity/Entities.kt` (`ProjectEntity.shareToken`),
`core/database/AppDatabase.kt` (wersja 7 + `MIGRATION_6_7`),
`core/database/dao/Daos.kt` (`setShareToken`, `clearShareTokens`),
`core/sync/CloudSync.kt` (czyszczenie kolumny przy usunięciu konta),
`core/export/ProjectShareManager.kt` (`shareText`),
`feature/projects/ProjectDetailViewModel.kt` i `ProjectDetailScreen.kt` (blok „Link do
wyceny"), `di/AppModule.kt` i `di/SyncModule.kt`, dziesięć `values*/strings.xml`,
`docs/FIRESTORE_SYNC.md` §6, `CLAUDE.md`, plus `ShareLinkTest.kt` i `ShareLinkScreenTest.kt`.

**TESTY. 284/284 przechodzi** (było 259; 25 nowych sprawdzeń w dwóch zestawach).
`ShareLinkTest` — 14: token względem `java.util.Base64`, 500 losowań bez powtórki i każde
w kształcie, którego szuka strona, odmowa dla `a/b/c` i `../x`, adres rozebrany parserem
URL, pola i limity odczytane z wdrożonych reguł, wiersze porównane z `SyncContract`, obcięcie
250 → 200 i 600 → 500, waluta pierwszej kalkulacji i PLN gdy nie ma żadnej, `estimationId`
jako identyfikator dokumentu albo `null`, `createdAt` przeżywający odświeżenie, i to, że
token **nie jedzie** w `projectToDoc()`. `ShareLinkScreenTest` — 11 w Chromium-owym
odpowiedniku, czyli Robolectric: trzy stany bloku wyklikane, trzy przyciski robiące trzy
różne rzeczy (drugie „Udostępnij" **wysyła** istniejący link, nie wybija drugiego), blokada
w trakcie zapisu, trzy komunikaty — i **migracja 6 → 7 puszczona na ręcznie zbudowanej
tabeli v6 z danymi**, bo `exportSchema = false` znaczy, że `MigrationTestHelper` nie ma
czego czytać, a to jedyna rzecz w tej sesji, która potrafi skasować czyjeś projekty.

**PROBLEMY — żadnego nierozwiązanego.** Dwa do zapisania:

- **Konto przełączone na jednym urządzeniu zostawia martwy token.** Kto się wyloguje
  i zaloguje na inne konto, ma na projekcie token dokumentu należącego do poprzedniego —
  „Odśwież"/„Wyłącz" dostaną wtedy odmowę z reguł i blok pokaże błąd. To odpowiednik
  `liczmat-sync-account` ze strony (Sesja 35) i osobne zadanie; nic się przez to nie wycieka,
  bo odmowa jest po stronie reguł.
- **Strona nadal nie umie odświeżyć ani wyłączyć linku.** `assets/app.js` wybija nowy token
  przy każdym kliknięciu i nie pamięta żadnego, więc linków zrobionych w przeglądarce nie da
  się odwołać inaczej niż kasując konto. Słowa (`app_share_refresh`, `app_share_revoke`) są
  w słowniku od dawna. Telefon jest pierwszą połową produktu, która to potrafi.

**STATUS.** Zrobione, w repozytorium aplikacji, na `main`, commit `68506a4`. **Strona nie
zmieniła się o bajt.** Jak Sesje 46, 47, 50, 52–56 — **czeka na wydanie AAB** (punkt 2 listy
„Do zrobienia w konsolach"). Reguły `sharedProjects` są wdrożone od dawna, więc ta sesja
niczego nowego do konsoli nie dokłada.

**NASTĘPNE ZADANIE: C6 — eksport PDF i własne materiały** (bez numeru, repo serwisu;
historia cen jest poza kontraktem synchronizacji, więc zakres jest do rozstrzygnięcia
przez właściciela). Nazwane, nie zaczęte. *(Zrobione jako Sesja 59, 2026-08-30 —
właściciel wybrał pełny zakres, więc kontrakt też się zmienił.)*

## Sesja 59 — eksport PDF i własne materiały (C6)

**WYKONANO.** Ostatnia pozycja kodowa audytu parytetu, w obu repozytoriach. Fachowiec
zapisuje materiał, którego nie ma w katalogu, razem z ceną u swojego dostawcy i historią
jej zmian — i drukuje projekt jako raport techniczny albo wycenę dla inwestora. Do tej
sesji obie rzeczy były **tylko w telefonie**.

**Zakres wybrał właściciel: pełne C6.** Audyt zapisał tę pozycję z zastrzeżeniem, że
historia cen jest poza kontraktem synchronizacji, więc zakres jest do rozstrzygnięcia.
Trzy drogi (sam PDF; PDF plus materiały bez historii; wszystko, z poszerzeniem kontraktu)
zostały przedstawione i wybrana została trzecia. Dlatego sesja zaczyna się od kontraktu,
a nie od ekranu.

### Kontrakt — repo aplikacji

**Zasada, która trzymała te wiersze poza kontem, była prawdziwa o innej tabeli.**
`FIRESTORE_SYNC` §1.5 mówiła „katalog materiałów to nie dane użytkownika". To prawda
o 161 pozycjach `Catalog*.kt`, które jadą razem z aplikacją i nie mają czego
synchronizować. `CustomMaterialEntity` to co innego: nazwa, wymiary i **cena, którą ktoś
płaci u swojego dostawcy** — i była jedyną rzeczą w telefonie, której nowe urządzenie nie
dostawało inaczej niż przez odtworzenie kopii zapasowej. `users/{uid}/materials` to
dziewiąta kolekcja.

**Historia cen jedzie w środku dokumentu, w polu `prices[]`.** Punkt cenowy należy do
jednego materiału, nic na niego nie wskazuje, nikt go po zapisaniu nie edytuje i ginie
razem z materiałem — te same cztery fakty, przez które linie robocizny siedzą w wycenie.
Podkolekcja wymagałaby własnych nagrobków i własnej kaskady, czyli maszynerii od
`estimations`, dla wiersza z dwiema liczbami i datą. Lista jest **ograniczona do 60
punktów, od najnowszego**, i czytający **sortuje**, zamiast ufać zapisującemu — dopiero to
sprawia, że limit znaczy „sześćdziesiąt ostatnich" dla dokumentu z dowolnego wydania.
Cena jest wprost: materiał przeceniany częściej niż 60 razy zachowuje po synchronizacji 60
ostatnich cen. To pięć lat przeceniania co miesiąc.

**Rozstrzyganie konfliktu obejmuje historię.** Dokument wygrywa albo przegrywa w całości,
`prices[]` razem z nim. Scalanie dwóch historii dałoby przebieg cen, którego nie było na
żadnym urządzeniu.

**Migracja 7 → 8 zasila `updatedAt` z `createdAt`.** Nie zerem — wtedy każdy istniejący
wiersz przegrywałby „ostatni zapis wygrywa" z każdym dokumentem, jaki spotka. I nie
„teraz" — wtedy każdy wiersz na każdym urządzeniu twierdziłby, że jest najnowszy; to ten
sam błąd odwrócony. Wiersz, którego nikt nie edytował, zmienił się wtedy, kiedy powstał.

**`updatePrice()` rusza teraz `updatedAt`, nie tylko `priceUpdatedAt`.** Synchronizacja
pyta każdy wiersz, czy zmienił się od ostatniego przebiegu, i pyta o `updatedAt` — bez tej
poprawki przeceniony materiał **nigdy by nie pojechał**. To jedyny błąd w tej sesji, który
byłby niewidoczny do chwili, gdy ktoś porówna dwa urządzenia.

**`remoteId` nadaje się przy pierwszym wypchnięciu, nie przy tworzeniu wiersza** —
odwrotnie niż u klienta, zlecenia i wyceny. Powód: nic nie wskazuje na materiał po
identyfikatorze. Kalkulacja przepisuje jego liczby, nie linkuje do niego.

### Strona — własne materiały

**`/moje-materialy/` w dziesięciu językach, poziom GOŚĆ**, jak `/projekty/` i z tego samego
powodu: `assets/own-materials.js` trzyma wiersze w `localStorage` w kształcie dokumentu,
więc ekran działa bez logowania, a konto dokłada synchronizację, a nie możliwość zapisania
materiału. `navLevel: LICZMAT` — gość w menu dostawałby link do listy, która jest pusta,
dopóki czegoś nie wpisze. Trasa wisi pod `/materialy/`, bo to strona, na której ktoś
odkrywa, że katalog nie ma płyty jego dostawcy.

**Trend liczy się przy każdym odczycie i nie jest nigdzie zapisany.** Różnica trzymana
obok dwóch cen, z których wynika, to trzecia liczba, która kiedyś się z nimi rozjedzie.
Dwie ceny w różnych walutach **nie są odejmowane** — rozdział VI zabrania przeliczania po
kursie, więc wiersz to mówi zamiast pokazać liczbę.

**Własny materiał wypełnia kalkulator tą samą maszynerią, co katalogowy.**
`omToCatalogRow()` oddaje wiersz w kształcie `assets/materials.js`, więc wybierak, filtr
i `materialFill()` nie muszą wiedzieć, skąd wiersz pochodzi.

**Copy strony jest build-time (`src/omat-copy.mjs`)**, z tego samego zmierzonego powodu, co
konwerter: każda strona serwisu pobiera `assets/i18n.<lang>.js`. W słowniku zostaje
szesnaście stringów, które JavaScript wybiera już po wysłaniu strony, i `omatpage_title` —
etykieta stopki na wszystkich 393 stronach.

### Strona — eksport PDF

**Dokument jest markupem, a PDF pisze okno drukowania przeglądarki.** Aplikacja renderuje
prawdziwy PDF przez `PdfDocument`; statyczna strona nie ma renderera i ten produkt nie ma
zależności. Więc cały dokument jest wpisany w `/projekty/?id=<id>`, `hidden`, a
`assets/pdf-export.js` wstawia liczby i wiersze. Strona **mówi o tym wprost** — to jedyne
zdanie tutaj, którego aplikacja nie ma.

**Wszystkie pozostałe słowa są aplikacji** — 29 kluczy `pdf_*` konfiguratora i 22 klucze
`pdfdoc_*` dokumentu, przepisane z `values-<lang>/strings.xml` w dziesięciu językach. Nic
nie było tłumaczone i nic wymyślone; §4 testu porównuje wszystkie 510 stringów z zasobami
aplikacji, kiedy oba repozytoria stoją obok siebie.

**Arytmetyka to `computeInvestorBreakdown()`, warstwa po warstwie**: materiał → +
robocizna → + marża → netto → + VAT → brutto, każda zaokrąglona dokładnie tam, gdzie
zaokrągla Kotlin, a warstwa wyłączona wnosi zero, żeby łańcuch pod nią dalej się zgadzał.

**Sumą na dokumencie jest `wsProjectCosts()`, a nie suma samych kalkulacji, którą liczy
aplikacja.** Serwis ma jedną odpowiedź na „ile kosztuje ten projekt", a wydruk nie może
kłócić się z ekranem, z którego został zrobiony. Różnica jest świadoma i zapisana.

**PROBLEMY — trzy defekty, wszystkie znalezione przez testy w przeglądarce, wszystkie
naprawione:**

- **Wybierak materiału nie umiał wybrać własnego.** Dialog szukał klikniętego
  identyfikatora wyłącznie w `MATERIALS`, więc kliknięcie własnego materiału zamykało okno
  i nie wybierało nic. `materialById()` pyta teraz oba zbiory.
- **Formularz czytał pola z ukrytych grup.** Trzy z pięciu zastosowań mają szerokość, więc
  ta sama nazwa `data-omat-in` jest w dokumencie kilka razy i wygrywała ostatnia w DOM,
  a nie ta, w którą ktoś wpisał.
- **Skrypt drukował klucz `omat_app_WALL_FLOOR_COVERING`** w akapicie, który czyta
  gość — bo te etykiety są build-time i `t()` ich nie zna. To defekt Sesji 41 pod nowym
  kluczem. Słowa są już na stronie w odpowiednim języku (opcje `<select>`, etykiety nad
  polami), więc skrypt czyta je z DOM, zamiast dokładać drugą kopię do pakietu, który
  pobiera każda strona.
- **Raport techniczny gubił odpad każdego wycenionego materiału.** Kalkulacja, z której
  powstał materiał, jest drukowana jako ten materiał, więc bez przepisania `wastePercentage`
  i `wasteCostMinor` odpad znikał — a to jest ta rzecz, która czyni raport technicznym.

**Trzy budżety podniesione, każdy zmierzony i uzasadniony w pliku, który go trzyma:**
`/app/` do 405/126 kB (niesie teraz trzeci magazyn), `projekty` do 480 słów (konfigurator
PDF i dokument w markupie) i `cookies` do 570 (jeden magazyn więcej w tabeli). Nowy typ
strony `own-materials` dostał 210.

**ZMIENIONE PLIKI.** W `3d-polednia/Materio`: `core/database/entity/Entities.kt`,
`core/database/AppDatabase.kt` (wersja 8 + `MIGRATION_7_8`), `core/database/dao/Daos.kt`,
`core/database/CustomMaterialRepository.kt`, `core/sync/SyncContract.kt` (`PricePoint`,
`materialToDoc`/`materialFromDoc`/`pricesFromDoc`), `core/sync/CloudSync.kt`,
`di/AppModule.kt`, `di/SyncModule.kt`, `config/firebase/firestore.rules` (`validMaterial()`),
`docs/FIRESTORE_SYNC.md`, `CLAUDE.md`, plus `MaterialContractTest.kt`
i `MaterialMigrationTest.kt`. W tym repozytorium: `assets/own-materials.js`,
`assets/own-materials-ui.js`, `assets/pdf-export.js` (nowe), `src/omat-copy.mjs`,
`src/pdf-copy.mjs` (nowe), `src/ia.mjs`, `src/site.mjs`, `src/pages.mjs`,
`assets/materials.js`, `assets/materials-ui.js`, `assets/app.js`, `assets/styles.css`,
`assets/i18n-pages.js`, `scripts/build.mjs`, cztery nowe zestawy testów, trzy budżety
i przegenerowane strony.

**TESTY. Aplikacja: 309/309 przechodzi** (było 284; 25 nowych, w tym migracja puszczona na
ręcznie zbudowanej tabeli v7 z danymi). **Serwis: wszystkie 31 zestawów logicznych i 22
zestawy w Chromium przechodzą**, w tym 905 nowych sprawdzeń własnych materiałów, 1184 PDF-a,
159 klikanych na `/moje-materialy/` i 105 klikanych na eksporcie. Cztery nowe pliki:
`scripts/test-own-materials.mjs`, `test-own-materials-page.mjs`, `test-pdf.mjs`,
`test-pdf-page.mjs`.

**STATUS.** Zrobione, w obu repozytoriach, na `main`. **Nic z tego nie dojedzie do chmury,
dopóki nie wdrożone są reguły** — `validMaterial()` dołącza do trzech reguł Sesji 46
czekających na `firebase deploy --only firestore` (punkt 1 listy konsolowej). Połowa
w repo aplikacji czeka dodatkowo na wydanie AAB (punkt 2). Ekran i eksport działają bez
tego, bo obie rzeczy są lokalne, dopóki ktoś się nie zaloguje.

**NASTĘPNE ZADANIE: decyzje właściciela — B6, D1, D2, D3 i D4.** Audyt nie ma już żadnej
pozycji kodowej; zostało pięć pozycji, które są pytaniami, nie robotą: tytuł ekranu
w aplikacji, siedem walut kontra dwadzieścia siedem, rubel, drugi angielski i nazwa języka
w wybieraku. Nazwane, nie zaczęte.

## Sesja 60 — flagi w wybieraku języka na telefonie (połowa D4)

**DECYZJE WŁAŚCICIELA, 30.08.2026.** Dwie z pięciu pozycji, które zostały po sesji 59,
dostały odpowiedź: **B6 — zostaje jak jest**, i **flagi z D4 — przenosimy na telefon**.
D1, D2 i D3 są dalej otwarte i nic w tej sesji ich nie przesądza.

**D4 to były dwie rzeczy, a audyt scalił je w jedną — i pomylił się w opisie tej drugiej.**
Audyt pisze „nazwa języka i flaga w wybieraku" i podaje jako dowód „English (US)" oraz
„English (UK)". To jest zarzut o **nazwę**. Flag zarzut nie dotyczył wcale, bo aplikacja
nie miała **żadnych** flag: `LanguageFirstRunDialog` rysował jedną ikonę globusa nad
listą i jedenaście wierszy gołego tekstu, a wybierak w ustawieniach był zwykłym
`DropdownPicker`-em. Więc to nie było „flaga łamie zasadę", tylko „obrazków nie ma".
Ta sesja robi obrazki. **Nazwa zostaje otwarta razem z D3** — i znika sama, jeśli D3
scali oba angielskie w jedno `English`.

**Jedenaście plików, nie dziesięć.** `assets/flags/*.svg` to dziesięć wektorów; Android
nie czyta SVG, więc każdy z nich jest przepisany na Vector Drawable
(`app/src/main/res/drawable/flag_<kod>.xml`) — ten sam viewport 20×14, te same ścieżki,
te same kolory co do cyfry. Jedenasty jest **własny aplikacji** i jest bezpośrednim
skutkiem tego, że D3 stoi otwarte: strona ma jedno `en` i daje mu Union Jacka, a aplikacja
ma dwa angielskie wiersze. Union Jack obok „English (US)" to obrazek mówiący coś innego
niż podpis pół centymetra dalej, więc `flag_en_us.xml` jest narysowany w stylu strony
(trzynaście pasów, kanton, gwiazdy jako kwadraty — dokładnie to uproszczenie, które chorwacki
herb dostaje na stronie). **Jeśli D3 scali oba angielskie, ten plik znika razem z wierszem,
dla którego powstał.** Nagłówek pliku to mówi.

**Zasada „nazwa języka, nigdy kraju" nie jest zasadą o flagach, i to trzeba było
rozstrzygnąć przed narysowaniem czegokolwiek.** Decyzja właściciela z 21.08.2026 dotyczy
**nazw**: picker ma mówić „Deutsch", nie „Deutschland", bo niemiecki mówi się w czterech
krajach. Flaga jest z definicji krajem i nie da się tego obejść — dlatego reguła strony
brzmi „flaga nigdy nie stoi sama" (`assets/styles.css`), a nazwa jest tym, co identyfikuje
wiersz. Flaga tylko skraca szukanie własnego alfabetu. Ta sama reguła jest przepisana do
`LanguageFlag`, i to z niej wynika, że **„zgodnie z systemem" flagi nie dostaje** — to nie
jest język i nie ma flagi nigdzie na świecie. Wiersz trzyma szerokość i nie rysuje nic:
pusty prostokąt z obwódką czyta się jak flaga, która się nie wczytała.

**Rozmiar jest tokenem strony, nie nową decyzją.** `.flag` w `assets/styles.css` to
20×14 px, 2 px promienia i jedna obwódka na 22 % tuszu strony — obwódka jest tym, co nie
pozwala białej fladze (Polska, Czechy) rozpłynąć się w białym wierszu, czyli tym samym
problemem dwóch procent różnicy, dla którego istnieje `MaterioCard`. 2 dp nie ma tokenu:
strona też pisze ten promień literałem w tej samej regule.

**`DropdownPicker` dostał jeden slot, nie drugi wybierak.** `optionLeading` rysuje coś
przed każdym wierszem menu i przed wybraną wartością w polu; dostaje **indeks**, a nie
gotowy composable na wiersz, więc `DropdownPicker` dalej nie wie, czym jest język. Pole i
menu pokazują ten sam obrazek — wybierak, który w zamkniętym stanie gubi flagę, jest
gorszy niż wybierak bez flag.

**TESTY. 316/316 przechodzi** (było 309; siedem nowych w `LanguageFlagTest.kt`). Cztery
rzeczy, które ten plik pilnuje, i każda z nich to defekt, który nic innego by nie złapało:
każdy język ma flagę i „zgodnie z systemem" jej nie ma; **żadne dwa języki nie wskazują
jednego pliku** (pułapka z angielskim); każdy `flag_*.xml` to prawdziwy wektor 20×14 bez
tintu, i żaden nie leży w repo bez wiersza, który go rysuje. Czwarta — §4 — jest jedyną,
która widzi obie strony: **czyta `assets/flags/*.svg` z repo serwisu**, kiedy oba
repozytoria stoją obok siebie, i porównuje zbiory kolorów. To jest odpowiednik
`test-langs.mjs` po stronie Kotlina, i istnieje z tego samego powodu, z którego tamten
powstał: jedna lista w dwóch kopiach przestaje być jedną listą. Sprawdzone, że gryzie —
zmiana jednej cyfry w `flag_pl.xml` wywala właśnie ten test. Bez repo serwisu §4 się
pomija; brak sąsiada to nie jest zepsuta aplikacja.

**Geometrii test celowo NIE porównuje.** Strona pisze `<rect>`, Vector Drawable ma tylko
ścieżki — ten sam kształt musi być zapisany inaczej, więc porównywanie kształtów dawałoby
czerwone na poprawnym pliku. Kolory wystarczą: to one się rozjeżdżają, kiedy ktoś poprawi
flagę po jednej stronie.

**ZMIENIONE PLIKI.** W `3d-polednia/Materio`: jedenaście nowych
`app/src/main/res/drawable/flag_*.xml`, nowy
`core/designsystem/component/Flags.kt`, `core/designsystem/component/Fields.kt`
(slot w `DropdownPicker`), `feature/settings/LanguageDialog.kt`,
`feature/settings/SettingsScreen.kt`, nowy `app/src/test/.../LanguageFlagTest.kt`
i `CLAUDE.md`. W tym repozytorium: tylko ten plik. **Serwis nie zmienił się ani o bajt** —
flagi ma od pierwszego dnia i to on jest źródłem.

**Zrzuty na `/aplikacja/` NIE są nieaktualne.** `WebHeroShotsTest` renderuje ekran główny,
kalkulator i sklepy; żaden z nich nie pokazuje wybieraka języka ani ustawień. Sprawdzone
uruchomieniem całego zestawu, nie pamięcią — reguła z sesji 55 i 56.

**STATUS.** Zrobione, w repo aplikacji, na `main`. **Czeka na wydanie AAB** razem z
sesjami 46, 47, 58 i 59 — punkt 2 listy konsolowej. Nikt tych flag nie zobaczy, dopóki
właściciel nie zbuduje wydania.

**NASTĘPNE ZADANIE: decyzje D1, D2 i D3 — dalej pytania, nie robota.** Zostały trzy
z pięciu. Rozpis, z którego wynika kolejność, jest w sekcji audytu wyżej; jedna rzecz
z tej trójki **nie czeka na żadną decyzję i jest defektem dzisiaj**:
`Currency.fromCode()` w `core/model/Units.kt` zwraca `PLN` dla nieznanego kodu, a
`CurrencyFormatter` bierze z tego symbol — więc kwota w walucie spoza enuma już rysuje
się ze złotówkowym „zł" obok. Naprawa tego jest dobra przy każdej odpowiedzi na D1
i **musi** poprzedzić opcję, w której enum się zwęża, bo inaczej zwężenie zamienia
poprawne dziś funty w złotówki. To jest sesja 61, jeśli właściciel nie zdecyduje inaczej.

## Audyt parytetu strona ↔ aplikacja — 27.08.2026 (Sesja 51)

To jest **lista, z której biorą się Sesje 52–58**. Do 2026-08-28 leżała wyłącznie
w artefakcie właściciela („Parytet LiczMat",
<https://claude.ai/code/artifact/5fc06c3a-6de0-492e-bc02-4d6e7131d15a>), przez co Sesja 55
zaczęła się od zgadywania, co jest jej zadaniem. Tu jest zapisana, żeby to się nie
powtórzyło. Zmierzone z `materio-web` @ `1dc2cb2f` i `Materio` @ `9ff4061` — katalog
materiałów skryptem pozycja po pozycji, kalkulatory po identyfikatorach, języki, waluty
i tryby motywu po enumach, wygląd po zrzutach Roborazzi i Playwright w obu motywach.

Liczniki z dnia audytu: materiały **161 = 161**, kalkulatory **15 / 16**, tryby motywu
**3 = 3**, języki **10 / 12**, waluty **7 / 27**, moduły Pro **5 / 3**.

### A. Co się zgadza (zmierzone, żeby nikt nie sprawdzał drugi raz)

Katalog materiałów (zero różnic na 161 pozycjach), silniki liczące po Sesji 47, tokeny
wyglądu po Sesji 50, kontrakt synchronizacji (osiem kolekcji), trzy tryby motywu po
Sesji 51 i zrzuty na `/aplikacja/`.

### B. Wygląd — co zostało po Sesji 50

| # | Co | Waga | Stan |
|---|---|---|---|
| B1 | **Pole formularza ma inny kształt.** Strona: etykieta nad polem, 44 px, `--field-bg`, promień 8. Aplikacja: etykieta pływająca w obramowaniu M3, 56 dp | Średnie | **Zrobione — Sesja 55** |
| B2 | **„Wybierz materiał" to dwa różne obiekty.** Strona: przycisk poboczny + rząd chipów z presetami (Gres 60×60, Panel AC4, Glazura 30×60). Aplikacja: karta `--accent-soft` z kafelkiem ikony i strzałką, **bez presetów**. Rekomendacja audytu: kształt ze strony — presety skracają drogę do wyniku o dwa kliknięcia | Średnie | **Zrobione — Sesja 56** |
| B3 | **Chip i zakładka to na stronie dwa tła.** `.chip` na `--surface-alt`, `.calc-tab` na `--surface`; `SegmentedControl` używa bieli dla obu ról | Niskie | **Zrobione — Sesja 56** |
| B4 | **Przycisk poboczny ma cięższą krawędź.** `.btn-ghost` bierze `--outline-strong` `#cbc4b4`; `OutlinedButton` bierze M3-owe `outline`, czyli `--outline-control` `#8b8577` — rola, która należy do pola formularza | Niskie | **Zrobione — Sesja 56** |
| B5 | **Plakietka poziomu istnieje tylko na stronie.** Każde „drzwi" na stronie głównej mówią BEZ KONTA / LICZMAT / LICZMAT PRO (rozdział II); aplikacja nie ma odpowiednika — poziom widać dopiero po wejściu w moduł Pro, gdzie stoi ściana | Niskie | **Zrobione — Sesja 56** |
| B6 | **Tytuł ekranu.** Strona: H1 w treści, ≈ 30 px, waga 800. Aplikacja: pasek górny, 19,2 sp, waga 700 | Do decyzji | **Zamknięte — decyzja właściciela 30.08.2026: zostaje jak jest.** Świadoma asymetria, jak C7 |

### C. Zakres — czego nie ma po drugiej stronie

| # | Co | Waga | Stan |
|---|---|---|---|
| C1 | **Konwerter jednostek — tylko w aplikacji.** Jedenaście kategorii (długość, powierzchnia, objętość, masa, temperatura, prędkość, czas, ciśnienie, energia, moc, dane). Silnik jest w Kotlinie; port to ta sama robota, co przy piętnastu kalkulatorach — i najtańszy nowy adres do zaindeksowania | Duże | **Zrobione — Sesja 57** |
| C2 | Terminarz — tylko na stronie | Duże | **Zrobione — Sesja 53** |
| C3 | Łańcuch i historia — tylko na stronie | Duże | **Zrobione — Sesja 54** |
| C4 | Jeden kalkulator policzony dwa razy (`STUD_WALL` + `WALL_LINING`) | Średnie | **Zrobione — Sesja 52** |
| C5 | **Udostępnianie kosztorysu linkiem — tylko na stronie.** `CloudSync` zna `sharedProjects`, ale interfejs aplikacji udostępnia **plik CSV**, nie link. Backend jest po obu stronach: brakuje przycisku i jednego zapisu | Średnie | **Zrobione — Sesja 58** |
| C6 | **Eksport PDF i własne materiały — tylko w aplikacji.** `PdfConfigScreen` i `CustomMaterialsScreen` z historią cen. Historia cen **nie była w kontrakcie synchronizacji** — Sesja 59 ją tam wstawiła | Średnie | **Zrobione — Sesja 59** |
| C7 | **Poradniki (strona) i gazetki sieci (aplikacja) — asymetria zaprojektowana.** Zapisane, żeby następny audyt nie zgłosił tego jako defektu | Bez zmian | — |

### D. Języki i waluty — najwięcej cichych rozjazdów

| # | Co | Waga | Stan |
|---|---|---|---|
| D1 | **Siedem walut kontra dwadzieścia siedem.** Kosztorys wyceniony na telefonie w funtach dojeżdża do przeglądarki, która GBP nie ma w wybieraku — kwota się wyrenderuje, ale nikt nie przestawi na nią serwisu. Rekomendacja audytu: aplikacja schodzi do siedmiu, a kosztorys wyceniony wcześniej zachowuje swoją walutę | Średnie | **Pytanie do właściciela** |
| D2 | **Rubel: aplikacja tak, strona nie.** Strona: RUB celowo nieobecny (Stripe nie działa w Rosji), `ru` startuje w EUR. Aplikacja: `RUSSIAN.defaultCurrency = RUB` | Średnie | **Pytanie do właściciela** (z D1) |
| D3 | **Angielski policzony dwa razy.** Strona ma jeden `en`; aplikacja `ENGLISH_US` (USD) i `ENGLISH_UK` (GBP) — stąd licznik 10 / 12 | Niskie | **Pytanie do właściciela** |
| D4 | **Nazwa języka i flaga w wybieraku.** To były dwie rzeczy, nie jedna. **Flagi: zrobione — Sesja 60** (aplikacja nie miała ŻADNYCH flag, nie „złe"; dziesięć wektorów strony przepisanych na Vector Drawable). **Nazwa: otwarte, z D3** — zasada „nazwa języka, nigdy kraju" (decyzja właściciela 21.08.2026, pilnowana przez `test-langs.mjs`) jest łamana przez „English (US)" i „English (UK)", a to znika samo, jeśli D3 scali oba angielskie | Niskie | Flagi zrobione; nazwa otwarta z D3 |
| D5 | Trzeci tryb motywu | — | **Zrobione — Sesja 51** |

### Kolejność, w której audyt kazał to robić

Pierwsze pięć pozycji ma **sztywną kolejność**: 52 → 53 → 54 → 55 → 56. Reszta nie.

1. ~~C4 — scalić `WALL_LINING` w `STUD_WALL` (S)~~ — **Sesja 52**
2. ~~C2 — terminarz w aplikacji (M)~~ — **Sesja 53**
3. ~~C3 — pasek łańcucha i historia w aplikacji (M)~~ — **Sesja 54**
4. ~~B1 — kształt pola formularza + przepisanie testów (M)~~ — **Sesja 55**
5. ~~B2 + B3 + B4 + B5 — „Wybierz materiał" i presety, jeden kształt (S)~~ — **Sesja 56**
6. ~~C1 — konwerter jednostek **na stronie** (L)~~ — **Sesja 57**. Największa pozycja
   i jedyna, która dokłada serwisowi nowy ruch, a nie tylko równa wygląd
7. ~~C5 — udostępnianie linkiem w aplikacji (S)~~ — **Sesja 58**
8. ~~C6 — eksport PDF i własne materiały (M)~~ — **Sesja 59**. Ostatnia pozycja kodowa
   audytu; jedyna, która wymagała zmiany kontraktu synchronizacji przed napisaniem ekranu

### Trzy rzeczy, których audyt nie ruszy bez decyzji właściciela

Dwie z trzech mają odpowiedź (30.08.2026); została jedna, i jest to ta, która ciągnie
za sobą najwięcej kodu.

- **Waluty (D1, D2)** — **OTWARTE.** Zwęzić aplikację do siedmiu walut strony, czy
  rozszerzyć stronę? Rozpis obu opcji z kosztami jest w sesji 60 niżej. Jedna rzecz w tej
  pozycji nie czeka na decyzję i jest defektem dzisiaj: `Currency.fromCode()` zwraca PLN
  dla nieznanego kodu, więc kwota w walucie spoza enuma **już** rysuje się ze złotówkowym
  symbolem.
- **Drugi angielski (D3)** — **OTWARTE.** `en-GB` z GBP zostaje osobną pozycją, czy schodzi
  do jednego `English`? Zależy od tego, czy sprzedaż idzie na Wyspy. Zależność jest
  jednokierunkowa: jeśli D1 wyrzuci GBP, `ENGLISH_UK` traci swój jedyny powód istnienia.
- ~~**Tytuł ekranu (B6)**~~ — **ODPOWIEDZIANE: zostaje jak jest.** Pasek górny to
  konwencja Androida (trzyma wstecz, akcje i zwijanie przy scrollu), nagłówek w treści to
  konwencja strony. Obie strony mają rację, więc to jedyna pozycja B, w której parytet był
  złym celem. Zapisane jako świadoma asymetria obok C7 — następny audyt ma tego nie
  zgłaszać drugi raz.
- ~~**Flagi w wybieraku (połowa D4)**~~ — **ODPOWIEDZIANE: przenosimy flagi na telefon.**
  Zrobione w sesji 60.

### Jedna rzecz, która pogarsza się sama

Punkty 1 i 2 listy konsolowej. Serwis od 26.08 obiecuje synchronizację klientów, zleceń
i wycen — a od 27.08 `/aplikacja/` pokazuje zrzuty aplikacji, której w sklepie nie ma.
**Każdy kolejny dzień to dwie obietnice bez pokrycia zamiast jednej.** Reszta tej listy
może poczekać; te dwie pozycje nie.

Ustalenia właściciela z 2026-08-21, na których stoi ten plan: nazwa **języka** przy fladze
(bez nazw krajów), nadawanie Pro **narzędziem po e-mailu**, „rozjechany na telefonie"
dotyczy **strony pojedynczego kalkulatora**, „stop slop" znaczy skrócić **plus test, który
pilnuje**, w nagłówku ustępują **Poradniki**, Stripe idzie przez **Blaze + własną funkcję,
którą wdraża właściciel**, a konta Stripe **jeszcze nie ma**.


## Do zrobienia w konsolach — lista sprawdzona w Sesji 48 (2026-08-27)

Rzeczy, których nie da się zrobić z tych repozytoriów: wymagają konsoli Google, Firebase,
Play albo Stripe'a, albo hasła, którego żadna sesja nie ma prawa czytać. **Właściciel
zdecydował 2026-08-26, że robi je w jednej turze po zamknięciu planu**, zamiast przerywać
sesje po drodze.

**Sesja 48 tę listę sprawdziła punkt po punkcie i dopisała cztery pozycje, których na niej
nie było.** Kolumna „Jak sprawdzone" mówi, czy to jest pomiar z tej sesji, czy tylko stan
repozytorium — bo sesja nie ma klucza do żadnej z tych konsol i nie zakłada kont w produkcji,
żeby coś udowodnić.

### Otwarte

| # | Co | Gdzie | Jak sprawdzone | Skutek, dopóki nie zrobione |
|---|---|---|---|---|
| 1 | `firebase deploy --only firestore` | Firebase CLI, z katalogu głównego repo `Materio` | Stan repo: `validClient()`, `validJob()`, `validQuote()` są w `config/firebase/firestore.rules` od Sesji 46, a `validMaterial()` od Sesji 59. Wdrożenia nie da się odczytać bez klucza albo konta — **niesprawdzone na żywo** | **Klienci, zlecenia, wyceny i własne materiały nie jadą na telefon**, a „wyślij" w `/app/` kończy się `PERMISSION_DENIED`. Szczegóły niżej |
| 2 | **Wydanie AAB — dopiero po punkcie 1** | Play Console | Zmierzone: w produkcji stoi **1.10.2 (`versionCode` 11002)**, a `main` ma niewydane commity (Sesje 46, 47, 50, 52–56, 58 i 59) przy **tej samej** wersji | Poprawka zaokrąglenia z Sesji 47 nie dotarła do nikogo: telefon liczy inaczej niż serwis. Ekrany Pro też nie. Wygląd z Sesji 50 też nie — w sklepie stoi aplikacja w starej oliwce, a `/aplikacja/` na stronie pokazuje już nową. Scalenie kalkulatora z Sesji 52 też nie: w sklepie wybierak dalej ma szesnaście pozycji zamiast piętnastu. Kształtu pola z Sesji 55 ani wybieraka materiału z presetami z Sesji 56 też nie: w sklepie formularz dalej ma etykietę wpuszczoną w ramkę i pudełko wyższe niż na stronie. Terminarza z Sesji 53 ani ścieżki i historii z Sesji 54 też nie — kto zapłaci za Pro i otworzy telefon, dostaje trzy moduły z pięciu, mimo że w `main` jest już pięć. **Trzeba podbić `versionCode`/`versionName`** — Play odrzuca powtórzony |
| 3 | **Opis w sklepie wysyła ludzi na martwą domenę** | Play Console → Główna karta sklepu, **11 języków** | Zmierzone 2026-08-27 na żywych stronach sklepu (`hl=pl,en,de,uk,cs` — w każdej **dwa** wystąpienia) | Opis mówi „kalkulatory działają też na materio-app.com" i „użyj »Nie pamiętam hasła« na materio-app.com". Ten host odpowiada **404**. Drugie zdanie kieruje kogoś, kto stracił dostęp do konta, pod adres, którego nie ma. Podmienić na `liczmat.com` |
| 4 | Rotacja klucza `pracownik@materio-502513` | Google Cloud → IAM → Konta serwisowe | Stan z Sesji 37, niesprawdzalny stąd | Prywatny klucz RSA przeszedł przez transkrypt sesji 2026-08-26. **Najpierw nowy klucz i podmiana tam, gdzie służy do wysyłki na Play, dopiero potem kasowanie starego** |
| 5 | Keystore i hasła w historii gita | repo `Materio` | **Zmierzone 2026-08-27:** `git ls-files` wymienia `materio-upload.jks` **i** `materio-keystore-creds.txt` — są śledzone **dziś**, nie tylko w historii. `.gitignore` ma `*.jks`, ale **nie ma** pliku z hasłami, a `.gitignore` i tak nie działa wstecz | Klucz upload i jego hasła leżą w repozytorium. Uwaga: przepis na wydanie w `CLAUDE.md` **czyta oba te pliki z korzenia repo**, więc `git rm --cached` bez zmiany przepisu zepsuje budowanie AAB. To jest decyzja właściciela, nie sesji |
| 6 | Trzecia kopia polityki prywatności | repo `3d-polednia/Materio-polityka-prywatno-ci` | Zmierzone: `https://3d-polednia.github.io/Materio-polityka-prywatno-ci/` odpowiada **200**, tekst z **16.07.2026**, marka „Materio", zero słowa o koncie, synchronizacji, `/p/<token>` i Stripe | Publicznie stoi nieaktualne oświadczenie o prywatności. **Play już na nie nie wskazuje** (patrz „Sprawdzone i zamknięte"), więc to sprzątanie, nie pożar. Skasować albo zastąpić przekierowaniem na `https://liczmat.com/privacy-policy.html` |
| 7 | Konto serwisowe do Play (jeśli wydania mają być automatyczne) | Play Console → Użytkownicy i uprawnienia | Stan z Sesji 46, niesprawdzalny stąd | Upload AAB jest ręczny. Klucz z punktu 4 jest z Google Cloud i do Play nie sięga |
| 8 | Google Search Console dla `liczmat.com` | Search Console | Niesprawdzalne stąd | Nowa domena bez własności i bez zgłoszonej sitemapy. `https://liczmat.com/sitemap.xml` działa i ma 371 adresów (zmierzone) |
| 9 | Stripe: sześć kroków włączenia sprzedaży | Stripe + Firebase | Stan repo: `assets/pay.js` ma czternaście cen i **puste** trzy adresy | Subskrypcji nie da się kupić. Repozytorium jest gotowe od Sesji 39; klikanie opisuje `docs/STRIPE.md`. Kolejność w nocie ORDER w `assets/pay.js` jest sztywna: **najpierw działający webhook i jedna prawdziwa płatność, dopiero potem adresy** |
| 10 | **`firebase deploy --only functions`** — obie funkcje naraz | Firebase CLI, z katalogu głównego repo `materio-web` | Stan repo: `functions/` ma webhook Stripe'a (Sesja 38) i `adminPlan` (Sesja 49). Wdrożenia nie da się odczytać stąd — **niesprawdzone na żywo** | Panel administratora na `/app/` odpowiada „Funkcja nie odpowiedziała" na każde kliknięcie, a plan Pro nadaje się dalej wyłącznie z terminala. Wymaga planu **Blaze**. Po wdrożeniu jeszcze jedno polecenie: `pro-admin.mjs admin <adres>` — raz na osobę, patrz [`ADMIN.md`](ADMIN.md) |
| 11 | Skamielina `web/` w repo `Materio` | repo `Materio` | **Zmierzone:** siedem plików, jeden commit z lipca 2026, wycofany slogan „Policz. Kup. Nie marnuj.", zdanie „bez kont" | Nic tego nie wdraża i nic z tego nie czyta, ale jest to druga, sprzeczna kopia serwisu w repozytorium. Sesja 48 opisała ją w `docs/WEBSITE.md`; skasowanie siedmiu plików to decyzja właściciela |

### Sprawdzone i zamknięte w Sesji 48

Te pozycje **nie wymagają już niczego** — zmierzone 2026-08-27, żeby kolejna sesja nie
kazała właścicielowi robić ich drugi raz:

| Co | Pomiar |
|---|---|
| Domeny autoryzowane Firebase Auth | Odczytane na żywo: **siedem** wpisów, w tym `liczmat.com` i `www.liczmat.com` |
| Ograniczenia klucza przeglądarkowego | `accounts:signInWithPassword` z odsyłaczem `liczmat.com` dochodzi do sprawdzenia hasła; host spoza listy dostaje 403 `API_KEY_HTTP_REFERRER_BLOCKED` |
| Certyfikat i domena | `https://liczmat.com/` → **200**, certyfikat waliduje się. `materio-app.com` → **404**, zgodnie z decyzją właściciela |
| Sitemapa | `https://liczmat.com/sitemap.xml` → 371 adresów, tyle samo, co w repo |
| Adres polityki prywatności w Play | Sklep podaje `https://liczmat.com/privacy-policy.html` — czyli kanoniczną. `docs/GOOGLE_PLAY_DEPLOYMENT.md` twierdził inaczej i stawiał przy tym „GOTOWE ✅"; poprawione |
| Marka i wersja w Play | Listing mówi **LiczMat**, wersja **1.10.2** |
| Ekran zgody Google | Link do polityki na nim to `https://liczmat.com/privacy-policy.html`. Nazwa, którą ekran pokazuje, to `materio-502513.firebaseapp.com` — tak Google wyświetla tego klienta niezależnie od pola „App name". Nikt tam dziś nie trafia: przycisk Google jest wyłączony w obu produktach |
| `%APP_NAME%` w mailach Firebase | **Właściciel przestawił nazwę projektu na `LiczMat` 2026-08-21** (Sesja 37). Z sesji tego nie da się odczytać — jedyny sposób to wywołać reset hasła i przeczytać maila, a **nie wolno wysyłać maila na adres właściciela, żeby zaliczyć test**. Poprzednia wersja tej listy wciąż wymieniała ten punkt jako otwarty, sprzecznie z raportem Sesji 37 w tym samym pliku |

### Co kosztuje odłożenie punktu 1

Trzeba to napisać wprost, bo inaczej za trzy sesje nikt nie będzie pamiętał, dlaczego coś
nie działa:

- **Serwis już obiecuje synchronizację.** Sesja 46 przepisała pięć zdań copy —
  `cli_local_note`, `job_local_note`, `quo_local_note`, `cal_local_note`, `propage_local` —
  z „zostają w tej przeglądarce" na „są częścią konta". To jest prawda o kontrakcie i o
  kodzie, i nieprawda o wdrożeniu. Strona mówi coś, czego backend jeszcze nie robi, i mówi
  to od 2026-08-26.
- **Wysyłka do chmury kończy się błędem.** Kto naciśnie „wyślij" w `/app/`, wyśle warsztat,
  a na kliencie dostanie `PERMISSION_DENIED` i komunikat o niepowodzeniu.
- **Pobieranie działa i to nie jest przypadek.** Ta sama Sesja 46 najpierw je zepsuła —
  odmowa na `users/{uid}/clients` leciała z wnętrza `downloadAccount()` i zabierała ze sobą
  projekty, pomieszczenia i kalkulacje wszystkim. Naprawione tego samego dnia
  (commit `dd12d82c`): każda z trzech kolekcji czytana osobno, odmowa zostawia pustą listę.
  Bez tej poprawki odłożenie punktu 1 byłoby awarią całej synchronizacji, a nie brakiem
  jednej funkcji.
- **Aplikacji z Sesji 46 nie wolno wydać przed punktem 1.** `CloudSync.syncNow()` pcha po
  kolei i `await`-uje każdy zapis: odmowa na pierwszym kliencie leci wyjątkiem w górę i
  wywala **cały** przebieg, więc pull już się nie wykona. Kolejność jest sztywna:
  **najpierw reguły, potem AAB.**

Gdyby odłożenie miało trwać długo, uczciwiej byłoby cofnąć copy do wersji sprzed Sesji 46
niż zostawić obietnicę bez pokrycia. To jest decyzja właściciela i tu jest zapisana jako
otwarta.

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
  **Nieaktualne od 2026-08-14** — patrz „Migracja domeny" niżej.

## Migracja domeny na `liczmat.com` (2026-08-14, §17 zlecenia)

Właściciel kupił `liczmat.com`, wskazał na nią custom domain w GitHub Pages i **świadomie
wyłączył** `materio-app.com` — 500 wyświetleń w dwa dni, przekierowanie niepotrzebne.
Jeden serwis Pages obsługuje jedną domenę własną, więc stary host odpowiada teraz
„Site not found". Zrobione w repo:

- `BASE` w `src/site.mjs` → `https://liczmat.com`. To jedyne miejsce, w którym adres jest
  decydowany; `canonical`, `hreflang`, `og:url` i `sitemap.xml` biorą się z niego.
- 131 stron przebudowanych, `STAMP` podbity na `20260814f`, `?v=` w ręcznie pisanych
  `404.html` i `privacy-policy.html` podbity tak samo.
- `robots.txt` → `Sitemap: https://liczmat.com/sitemap.xml`.
- `privacy-policy.html` — adres w treści i w `canonical`/`og` w obu językach.
- `af_sync_d` w `assets/i18n-pages.js`, cztery języki.
- 3100 sprawdzeń w ośmiu zestawach testów przechodzi.

DNS w OVH (zrobione przez właściciela w tej sesji): cztery rekordy A GitHuba były już
dobre, blokadą HTTPS był `@ AAAA 2001:41d0:301:1::29` wskazujący na OVH — GitHub wystawia
certyfikat dopiero, gdy **wszystkie** A i AAAA wierzchołka należą do Pages. Rekord
skasowany, cztery AAAA GitHuba (`2606:50c0:800{0..3}::153`) dopisane. Zweryfikowane.

### Zostało do zrobienia poza repo

- ~~**Certyfikat.**~~ — **wystawiony, zmierzone 2026-08-26 (Sesja 42).**
  `https://liczmat.com/` odpowiada 200 z certyfikatem `CN=liczmat.com` (Let's Encrypt),
  a nie zastanym `CN=*.github.io`.
- ~~**Google Cloud → Credentials → klucz przeglądarkowy → Website restrictions**~~ —
  **zrobione przez właściciela, zmierzone 2026-08-26 (Sesja 42).** `https://liczmat.com/*`
  i `https://www.liczmat.com/*` przepuszczają: to samo wywołanie
  `accounts:signInWithPassword` odpowiada 400 `INVALID_LOGIN_CREDENTIALS` zamiast 403
  `API_KEY_HTTP_REFERRER_BLOCKED`, czyli klucz przepuścił i Auth doszedł do sprawdzenia
  hasła. Host spoza listy nadal dostaje 403, więc ograniczenie działa. Zakładanie konta,
  logowanie e-mailem i reset hasła z nowej domeny są odblokowane.
- ~~**Firebase Auth → Authorized domains**~~ — **zrobione przez właściciela, odczytane
  2026-08-26 (Sesja 42).** Listy nie dało się dotąd przeczytać, bo `getProjectConfig` szedł
  przez ten sam ograniczony klucz; teraz czyta się i zawiera
  `materio-502513.firebaseapp.com`, `materio-502513.web.app`, `materio-app.com`,
  `www.materio-app.com`, `localhost`, **`liczmat.com`**, **`www.liczmat.com`**. Przy każdej
  kolejnej edycji obu list: **zachować wszystkie wpisy**.
- **Google Search Console**: nowa własność dla `liczmat.com` i zgłoszenie sitemapy.
- **Bliźniak polityki prywatności** — `docs/privacy-policy.html` w repo
  `3d-polednia/Materio` nadal mówi `materio-app.com`. Tamto repo nie jest podpięte do tej
  sesji; poprawić przy najbliższej pracy nad aplikacją.

Po stronie aplikacji: nazwa, slogan, ikona, splash i znak to LiczMat we wszystkich
dziesięciu językach, a listing w Google Play (11 języków, teksty + grafika + zrzuty)
został zaktualizowany na żywo. Matematyka kalkulatorów nietknięta.

### Poprawki po Sesji 13 — zgłoszone przez właściciela, sprawdzone na żywym backendzie

Właściciel kliknął logowanie Google i zgłosił, że nie działa usuwanie konta. Sprawdzone
**na żywym projekcie `materio-502513`** kontem jednorazowym (2026-08-13), nie z pamięci.

**1. Logowanie Google — „The requested action is invalid.". Wina po stronie konsoli, nie kodu.**
Klucz przeglądarkowy jest ograniczony do odsyłaczy `materio-app.com/*`,
`www.materio-app.com/*` i `localhost:*` (`FIRESTORE_SYNC.md` §8, zrobione 2026-08-07).
Popup Google wykonuje się na `materio-502513.firebaseapp.com/__/auth/handler`, którego na
tej liście nie ma. Zmierzone:

```
Referer: https://materio-app.com/app/                            → 200
Referer: https://materio-502513.firebaseapp.com/__/auth/handler  → 403
   "Requests from referer https://materio-502513.firebaseapp.com/__/auth/handler are blocked."
```

**To samo dotyczy linku z maila resetującego hasło** — ląduje on na `/__/auth/action` na
tym samym hoście. Formularz wyśle maila (sprawdzone: `sendOobCode` → 200), a kliknięcie
w link padnie. Naprawa jest w Google Cloud Console → Credentials → klucz przeglądarkowy →
Website restrictions: dopisać `https://materio-502513.firebaseapp.com/*` i
`https://materio-502513.web.app/*`. Własny `authDomain` odpada — GitHub Pages nie umie
serwować `/__/auth/`. **Właściciel to robi.**

**2. Usuwanie konta — reguły z repo aplikacji NIE są wdrożone.** Plik
`config/firebase/firestore.rules` mówi `allow delete: if isOwner(uid)`, ale wdrożone
wydanie nadal odmawia. Zmierzone kontem jednorazowym:

```
usunięcie users/{uid}/projects/p1  → 200 OK
usunięcie users/{uid}              → 403 PERMISSION_DENIED
```

Potrzebne `firebase deploy --only firestore` w repo `3d-polednia/Materio`.
**Poza zakresem prac nad webem — potrzebna decyzja/akcja właściciela.**

Serwis został na to przygotowany, bo zachowywał się przy tym najgorzej, jak mógł:
`deleteEverything()` kasowało projekty, pomieszczenia, wyceny i linki, a **dopiero na
końcu** profil — czyli odmowa przychodziła po skasowaniu wszystkiego, a odwiedzający
dostawał „Coś poszło nie tak. Spróbuj ponownie.". Teraz profil idzie **pierwszy**: to
jedyne usunięcie, które kiedykolwiek zostało odrzucone, więc odmowa przychodzi zanim
cokolwiek zniknie. Komunikat mówi prawdę: „serwer odrzucił żądanie, Twoje dane są
nietknięte". Użytkownik Firebase nadal kasowany jest na samym końcu (`FIRESTORE_SYNC.md`
§7). Po wdrożeniu reguł nic w kodzie nie trzeba zmieniać — test na to czeka.

**3. Zmiana hasła działa.** Sprawdzone na żywo: złe obecne hasło →
`INVALID_LOGIN_CREDENTIALS`, dobre → zmiana przechodzi, stare hasło przestaje działać,
hasło krótsze niż 6 znaków → `WEAK_PASSWORD`. Zakładka „Konto" robi dokładnie to i ma
teraz własne testy.

**4. Trzy błędy w kodzie, znalezione przy okazji.**

- **`boot()` połykało wyjątek.** `boot().catch(() => status(…))` bez logu. Wyjątek
  w środku zostawiał stronę **w połowie podłączoną** — jedne przyciski odpowiadały, inne
  nie — i wyglądało to identycznie jak strona, która się nie wczytała. Teraz leci
  `console.error` z prawdziwym błędem. Bez tego nie znalazłbym punktu 5.
- **Nasłuchy Firestore przeżywały koniec sesji.** Firestore wrzuca `permission-denied`
  do każdego żywego nasłuchu w chwili wylogowania albo usunięcia konta. Trafiało to
  w pasek statusu jako „Coś poszło nie tak." — **na wierzch komunikatu „Konto
  usunięte."**. Teraz wylogowanie i usuwanie najpierw odpinają nasłuchy
  (`stopListening()`), a `permission-denied` bez zalogowanego użytkownika jest
  ignorowany. Odrzucone usunięcie podpina je z powrotem.
- **`data-app-ready`** na `<html>` po zakończeniu `boot()` — inaczej test klika
  w przycisk, którego jeszcze nikt nie słucha. Ta sama konwencja, co `data-wired`
  na stronie kalkulatora.

Sprawdzone: **118 testów `/app/` w Chromium** (było 97) — w tym zmiana hasła ze złym
i dobrym hasłem, usuwanie konta przy regułach **takich, jakie są dziś wdrożone**
(nic nie ginie, konto zostaje, użytkownik Firebase nietknięty) oraz **takich, jakie będą
po wdrożeniu** (znikają podkolekcje, projekty, pomieszczenia, linki i profil, użytkownik
na końcu). Razem 1677/1677.

### Co zrobiła Sesja 48 (plan naprawczy)

Zadanie: **prawda w dokumentacji i lista rzeczy do zrobienia w konsolach.** Dwa
repozytoria, żadnej zmiany w tym, co robi produkt — poza czterema komentarzami w kodzie
aplikacji, które wskazywały martwą domenę.

**WYKONANO**

**1. Zmierzone, zamiast przepisane z pamięci.** Sesja nie ma klucza do żadnej konsoli
i nie zakłada kont w produkcji, żeby coś udowodnić, więc sprawdziła to, co da się
sprawdzić z zewnątrz — i przy każdym twierdzeniu w liście stoi teraz, **jak** zostało
sprawdzone. Pomiary z 2026-08-27:

| Pytanie | Odpowiedź |
|---|---|
| Czy `liczmat.com` żyje? | 200, certyfikat waliduje się, sitemapa ma 371 adresów — tyle samo, co repo |
| Czy `materio-app.com` jest wyłączona? | 404, zgodnie z decyzją właściciela |
| Domeny autoryzowane Firebase | Siedem wpisów, w tym `liczmat.com` i `www.liczmat.com` |
| Ograniczenia klucza przeglądarkowego | Odsyłacz `liczmat.com` przechodzi do sprawdzenia hasła; host spoza listy → 403 |
| Co stoi w Google Play | LiczMat, **1.10.2** |
| Adres polityki prywatności w Play | `https://liczmat.com/privacy-policy.html` |
| Ekran zgody Google | Link do polityki poprawny; nazwa, którą pokazuje, to `materio-502513.firebaseapp.com` |
| Czy keystore jest w repo | **Tak, dziś, nie tylko w historii** — `git ls-files` wymienia `materio-upload.jks` i `materio-keystore-creds.txt` |
| Liczby w dokumentacji serwisu | 375 plików HTML, 373 generowane, 371 w sitemapie, 150 stron kalkulatorów, 15 silników, 161 materiałów, 10 języków, 7 walut — wszystkie policzone z kodu |

**2. Trzy defekty, o których nikt nie wiedział.**

- **Opis w Google Play wysyła ludzi na martwą domenę.** W **każdym** sprawdzonym języku
  (pl, en, de, uk, cs — czyli prawdopodobnie we wszystkich jedenastu) opis mówi
  `materio-app.com` **dwa razy**. Drugie zdanie jest gorsze od pierwszego: „jeśli Twoje
  konto powstało przez Google, użyj »Nie pamiętam hasła« na materio-app.com" kieruje
  kogoś, kto **stracił dostęp do konta**, pod adres odpowiadający 404.
- **Trzecia kopia polityki prywatności stoi publicznie i mówi nieprawdę.**
  `https://3d-polednia.github.io/Materio-polityka-prywatno-ci/` — osobne repozytorium,
  tekst z 16 lipca 2026, marka „Materio", ani słowa o opcjonalnym koncie, synchronizacji
  Firestore, linku `/p/<token>` ani o Stripe. Play **już na nią nie wskazuje** (to
  sprawdzono, zanim wpisano cokolwiek do listy — pierwsza wersja tego raportu twierdziła
  inaczej i była błędna), więc to jest sprzątanie, nie awaria.
- **`docs/GOOGLE_PLAY_DEPLOYMENT.md` stawiał „GOTOWE ✅" przy tym adresie `github.io`**
  jako przy adresie wklejonym w Play. Zielony ptaszek przy nieprawdzie jest gorszy niż
  brak wpisu, bo zamyka temat.

**3. Skamielina.** `web/` w repo aplikacji to **pierwsza wersja serwisu z lipca 2026**:
siedem plików, jeden commit, wycofany slogan „Policz. Kup. Nie marnuj." i zdanie „bez
kont". Nic tego nie wdraża i nic z tego nie czyta, ale to jest druga, sprzeczna kopia
produktu w repozytorium. `docs/WEBSITE.md` opisywał ją jako aktualny serwis — teraz
mówi wprost, czym jest, i odsyła do `3d-polednia/materio-web`. **Skasowania nie zrobiono:
siedem plików to decyzja właściciela**, i leży na liście.

**4. Bliźniak polityki prywatności jest teraz generowany, a nie przepisywany.**
`docs/privacy-policy.html` w repo aplikacji był o 133 linie krótszy od kanonicznego:
wskazywał martwą domenę, nie wspominał o zapisywaniu waluty i motywu i **nie miał całego
§7.1 o Stripe**. Sesja wygenerowała go z kanonicznej kopii — te same dwadzieścia nagłówków,
co do jednego — zamieniając adresy względne na bezwzględne, bo ten plik nie jest serwowany
z serwisu. Reguła „zmieniasz jedno, zmieniasz oba w tej samej sesji" zostaje; teraz jest
tańsza do wykonania.

**5. Lista rzeczy w konsolach: było pięć pozycji, jest dziesięć — i jedna zniknęła.**
Punkt „`%APP_NAME%` mówi Materio" **stał na liście sprzecznie z raportem Sesji 37 w tym
samym pliku**, gdzie napisano, że właściciel przestawił nazwę projektu na LiczMat
2026-08-21. Wypadł z otwartych i został opisany w „Sprawdzone i zamknięte", razem
z powodem, dla którego sesja nie może go zweryfikować: jedyny sposób to wywołać reset
hasła, a maila nie wolno wysłać na adres właściciela po to, żeby zaliczyć test.
Doszły: wydanie AAB w sztywnej kolejności po regułach, opis w sklepie, trzecia polityka,
Search Console, Stripe i skamielina `web/`.

**6. Wydanie: `main` jest przed produkcją o trzy commity przy tej samej wersji.**
Sesje 46 i 47 wylądowały w `main` **po** tym, jak 1.10.2 poszło na produkcję, i nikt nie
podbił numeru. Czyli następny AAB niesie oba naraz i **musi zacząć od podbicia
`versionCode`/`versionName`** — Play odrzuca powtórzony. Kolejność zostaje sztywna:
reguły, potem AAB. Zapisane w `CLAUDE.md` repo aplikacji, w miejscu, w którym stała
nieaktualna nota „flagship build: 1.9.3".

**ZMIENIONE PLIKI**

Repo serwisu (`3d-polednia/materio-web`):
`README.md` (przepisany — slogan, dziesięć języków, siedem walut, 373 strony, pełne spisy
plików), `docs/DOKUMENTACJA.md` (§1, §2, §3, §4, §5, §6, §7, §9a, §12 — plus nota, czego
ten plik nie opisuje), `docs/ARCHITEKTURA.md` (`404.html` pełni dwie role, nie trzy;
nagłówek ma LiczMat Pro od Sesji 40), `CLAUDE.md` (dziewięć liczb i nazw, nota o
`%APP_NAME%`, nota o Cloud Functions, wskaźnik handoffu), `docs/MASTER_PLAN.md` (ten
raport, nowa lista konsolowa, poprawka dopisana do raportu Sesji 36).

Repo aplikacji (`3d-polednia/Materio`):
`docs/privacy-policy.html` (wygenerowany na nowo), `docs/WEBSITE.md` (przepisany),
`docs/FIRESTORE_SYNC.md` (nagłówek, §7 — reguła usuwania konta **jest** wdrożona, §8 —
domeny i klucz, §8b — nota historyczna, §9.1 i §9.2), `docs/GOOGLE_PLAY_DEPLOYMENT.md`
(nagłówek, polityka prywatności, opis w sklepie), `CLAUDE.md` (co stoi w produkcji,
kolejność wydania), oraz cztery komentarze wskazujące martwą domenę:
`feature/account/AccountScreen.kt`, `core/sync/CloudSync.kt` i dwa
`res/drawable/ic_liczmat_mark*.xml`.

`CHANGELOG.md` w repo aplikacji **celowo nie został ruszony**: wpis opisuje wydanie
z sierpnia, kiedy domena naprawdę nazywała się `materio-app.com`. Przepisywanie
changeloga to psucie zapisu historii.

**TESTY**

- **Serwis: wszystkie 25 zestawów bezzależnościowych przechodzi.** Największe:
  `test-seo` 36 869/36 869, `test-perf` 13 200/13 200, `test-security` 9148/9148,
  `test-calc-seo` 5133/5133, `test-calculators` 2113/2113. `test-copy` liczy 14 sprawdzeń
  nad 12 470 stringami w dziesięciu językach i 374 stronami. Pięć z nich uruchomiono także
  **przed** zmianami, jako punkt odniesienia. Zestawów wymagających Playwrighta
  (`*-page`, `test-mobile`, `test-phone`, `test-qa`) nie uruchamiano — nie ma go w tym
  kontenerze, a ta sesja nie ruszyła niczego, co one czytają.
- **`node scripts/build.mjs --check` przechodzi:** 1157 kluczy × 10 języków,
  15 kalkulatorów, 8 poradników, 150 stron copy SEO.
- **Ani jednego pliku, który build czyta, nie ruszono**, więc nie było czego przebudowywać
  i `STAMP` nie wymagał podbicia. Zmiany są w dokumentacji i w komentarzach.
- **Aplikacja: testy nie uruchamiane** — zmieniły się cztery komentarze i pliki `docs/`,
  a `gradle` w świeżym kontenerze wymaga instalacji Android SDK, żeby nie sprawdzić niczego.

**PROBLEMY**

- **Punktu 1 listy — czy reguły Firestore są wdrożone — ta sesja NIE zweryfikowała.**
  Da się to sprawdzić tylko kluczem konta serwisowego (nie ma go w środowisku) albo
  zakładając konto w produkcji i próbując zapisu. Sesja świadomie nie zakłada kont
  w cudzej produkcji, żeby zaliczyć punkt; Sesja 37 sprzątała cztery sieroty w `users`
  po takich właśnie próbach. W liście stoi to wprost, w kolumnie „Jak sprawdzone".
- **Punkty 4 i 7 (rotacja klucza, konto serwisowe do Play) są niesprawdzalne stąd**
  z tego samego powodu i tak są opisane.
- **`docs/DOKUMENTACJA.md` nadal nie opisuje modułów po Sesji 20** — projektów, kosztów,
  LiczMat Pro, paywalla, płatności. Sesja tego nie dopisała i **napisała wprost, że tego
  tam nie ma**, zamiast zostawić dokument, który wygląda na kompletny. Rozpisanie tych
  modułów to osobne zadanie; `CLAUDE.md` opisuje je dziś decyzja za decyzją i jest plikiem
  do czytania przed pracą.
- **Trzy rzeczy zostały opisane, a nie naprawione, bo naprawa należy do właściciela:**
  skasowanie `web/`, `git rm --cached` na keystore (przepis na wydanie w `CLAUDE.md`
  czyta oba pliki z korzenia repo, więc samo usunięcie zepsuje budowanie AAB) i trzecia
  kopia polityki w repozytorium, którego ta sesja nie widzi.

**STATUS**

Sesja 48 zamknięta. Dokumentacja obu repozytoriów mówi to, co jest — a tam, gdzie sesja
nie mogła czegoś zmierzyć, mówi wprost, że nie mogła.

**NASTĘPNE ZADANIE**

**Sesja 49 — panel admina w przeglądarce: nadawanie planu po adresie e-mail, bez
terminala.** Wymaga serwera, który sprawdzi, kto pyta; ten serwer powstał w Sesji 38.

### Co zrobiła Sesja 47 (plan naprawczy)

Zadanie: **błąd zaokrąglenia w silnikach Androida** — repo `3d-polednia/Materio`. Serwis
naprawiono w Sesji 12; telefon liczył źle dalej — przez dwa tygodnie po tamtej sesji i przez
cały czas przed nią.

**WYKONANO**

**1. `snap()` jest w aplikacji.** `core/calculation/WasteMath.kt` — tam, gdzie stoi wspólny dla
wszystkich silników raport finansowy — ma teraz `snap()`, `ceilSnap()` i `floorSnap()`. Reguła
jest ta sama, co w `assets/calculators.js`: wartość leżąca bliżej niż **jedna miliardowa
względem** liczby całkowitej zostaje do niej przyciągnięta, **zanim** zaokrąglenie podejmie
decyzję. Tolerancja jest względna i **wyklucza zero**, więc kawałek metra kwadratowego nadal
wymaga całego opakowania.

**2. Wszystkie 22 zaokrąglenia w silnikach przechodzą przez nią.** `CoverageEngine`,
`SurfaceWasteEngine`, całe `TradeCalc` (beton, zaprawa, wylewka, tapeta, murowanie, ocieplenie)
i całe `FramingCalc` (`profilesAcross`, `boardsFor`, ściana działowa, sufit podwieszany, G-K na
klej, poszycie). `kotlin.math.ceil` i `kotlin.math.floor` nie są już w tych plikach
importowane — nie da się ich wywołać przez pomyłkę.

**3. Plus jedno miejsce poza silnikami.** `CalculatorViewModel` dzieli ciągły odcinek (listwa,
rura, pręt) na całe sztangi tym samym `⌊⌋`. **Nic tam nie liczyło źle** — odcinek jest
w milimetrach, okruch ma rząd 1e-11 mm, a próg 1 µm linijkę niżej i tak go odrzuca. To jest
reguła zastosowana wszędzie, nie naprawiony defekt, i tak jest opisane w komentarzu.

**4. Co to znaczy dla użytkownika.** Dwa błędy, oba na wymiarach z domyślnych formularzy:

| Wejście | Aplikacja liczyła | Jest | Skutek |
|---|---|---|---|
| 21,6 m² podłogi, karton 1,44 m² (gres 60×60) | 16 kartonów | 15 | kupiony zbędny karton |
| 2,4 m sufitu, rozstaw 0,4 m | 6 profili CD | 7 | lista zakupów o profil za krótka |
| 20 m² tarasu, preset `taras-60x60` (0,72 m²/opak., 8 %) | 31 opakowań | 30 | kupione zbędne opakowanie |

Trzeci wiersz to **materiał z katalogu na okrągłej powierzchni** — nie liczba wymyślona do
testu.

**5. Test zgadzał się z błędem, bo wyprowadzał oczekiwanie tym samym `ceil`.**
`MaterialCatalogCalculationTest` przepuszcza **każdy** materiał katalogu przez silnik, który go
obsługuje, i porównywał wynik z `ceil(area * (1 + waste/100) / pkg)` — czyli z tą samą
arytmetyką, która była zepsuta. Dlatego `taras-60x60` przechodził przez 219 testów przez cały
ten czas. Oczekiwania liczą się teraz w `BigDecimal`, czyli w dziesiętnej arytmetyce dokładnej,
której silnik nie ma jak powtórzyć. Pułapka po drodze, zapisana w komentarzu w teście: operator
`/` na `BigDecimal` w Kotlinie **zachowuje skalę lewego argumentu**, więc `dec(5.0) / dec(100.0)`
to `0.0` i cały 5-procentowy zapas znika — jest `movePointLeft(2)`.

**6. Sześć nowych testów granicznych, wyprowadzonych ręcznie ze wzoru.** Obie strony reguły:
wielokrotność wychodzi równo (21,6/1,44 = 15; 43,2/1,44 = 30; 8,64/1,44 = 6; 2,1 kg / 0,3 kg = 7
worków; 0,0102 m³ / 0,3 l = 34 worki; 1,2 m i 4,8 m przy 0,4 m i 11,7 m przy 0,9 m), a prawdziwa
reszta nadal idzie w górę (21,61 m² to 16 kartonów, 100,1 kg to 5 worków, 1,21 m przy 0,4 m to
nadal 4 słupki) i ułamek metra nadal wymaga całego opakowania.

**ZMIENIONE PLIKI**

Repo aplikacji (`3d-polednia/Materio`, commit `b231bab`):
`core/calculation/WasteMath.kt`, `surface/CoverageEngine.kt`, `surface/SurfaceWasteEngine.kt`,
`trade/TradeCalculators.kt`, `feature/calculator/CalculatorViewModel.kt`,
`test/MaterialCatalogCalculationTest.kt`, `test/SurfaceEnginesTest.kt`, `test/TradeCalcTest.kt`,
`docs/ARCHITECTURE.md`, `docs/CALCULATOR_UNITS_LANGUAGE.md`, `CLAUDE.md`.

Repo serwisu: `docs/DOKUMENTACJA.md` (§7a), ten plik. **Ani jednej zmiany w kodzie serwisu** —
serwis liczy poprawnie od Sesji 12 i nie miał tu nic do poprawienia.

**TESTY**

- **219/219 testów jednostkowych aplikacji przechodzi** (było 213; sześć nowych to testy
  graniczne). Uruchomione `gradle :app:testDebugUnitTest` po zainstalowaniu Android SDK
  w kontenerze.
- Pierwszy przebieg po poprawce padł na `MaterialCatalogCalculationTest` i **tak miało być** —
  to jest ten test, który zgadzał się z błędem. Drugi padł na moim własnym oczekiwaniu
  (`BigDecimal` i skala), trzeci przeszedł.
- Serwis: nie uruchamiane, bo ta sesja nie dotknęła ani jednego pliku, który testy serwisu
  czytają.

**PROBLEMY**

- **Poprawka nie dotarła jeszcze do nikogo.** Jest w `main`, nie w Google Play. Potrzebne
  wydanie AAB, a AAB buduje właściciel (zasada z `CLAUDE.md` repo aplikacji). Do tego czasu
  telefon liczy tak, jak liczył, a serwis liczy poprawnie — czyli **te dwa produkty odpowiadają
  na jedno pytanie dwie różne odpowiedzi, dopóki nie wyjdzie wydanie**.
- **Wydanie z Sesji 46 i to zaokrąglenie to jedno wydanie.** `main` niesie już ekrany Pro
  i migrację Room 5 → 6, a te **nie mogą wyjść przed `firebase deploy --only firestore`**
  („Co kosztuje odłożenie punktu 1" na początku tego pliku). Kolejność: reguły, potem AAB —
  i ten AAB niesie także tę poprawkę.
- **`BackupManager` nadal nie eksportuje pokoi, klientów, zleceń ani wycen.** Zgłoszone
  w Sesji 46, dalej otwarte, dalej poza zakresem.

**STATUS**

Zrobione w kodzie i w testach, **nieczynne u użytkownika do czasu wydania**.

**NASTĘPNE ZADANIE**

**Sesja 48 — prawda w dokumentacji i lista rzeczy do zrobienia w konsolach.**

### Co zrobiła Sesja 46 (plan naprawczy)

**Klienci, zlecenia i wyceny na telefon.** Dwa repozytoria: `3d-polednia/Materio` (kontrakt,
baza, synchronizacja, ekrany) i `3d-polednia/materio-web` (wysyłka, copy, dokumentacja).

Właściciel wybrał zakres na początku sesji: **kontrakt plus ekrany**, i **plan Pro także na
telefonie**.

**WYKONANO**

**1. Kontrakt.** `docs/FIRESTORE_SYNC.md` ma osiem kolekcji zamiast pięciu: doszły
`users/{uid}/clients`, `/jobs` i `/quotes`. Płaskie, obok `rooms`, nie podkolekcje projektu —
klient istnieje przed pierwszym projektem i po ostatnim, zlecenie może nie mieć jeszcze
projektu, a wycena bez projektu to cena za samą robotę. Wszystkie trzy przeżywają usunięcie
projektu; podkolekcja by nie przeżyła. Reguły: `validClient()`, `validJob()`, `validQuote()`.

**2. Powiązania jadą jako identyfikatory dokumentów.** `projectIds` na kliencie, `projectId`
i `clientId` na zleceniu, `projectId` na wycenie. To jedyny identyfikator, który znaczy to
samo w przeglądarce i na telefonie: lokalne `id` w Room są per urządzenie i dwa telefony
nazwą „1" dwie różne rzeczy. Dlatego telefon trzyma w tych czterech kolumnach `remoteId`,
a nie swoje `id` — i dlatego klient, zlecenie i wycena dostają `remoteId` **przy tworzeniu
wiersza**, a projekt w chwili, gdy ktoś go podpina. Powiązanie przeżywa brak drugiej strony
i odnajduje ją, kiedy dojdzie. To jedyne miejsce, w którym ten kontrakt robi coś innego niż
`shopping_items.estimationId`, i różnica jest opisana w §3.

**3. Aplikacja.** `ClientEntity`, `JobEntity`, `QuoteEntity`, migracja Room **5 → 6** (trzy
nowe tabele, w starych ani jednej zmiany), trzy DAO, `CrmRepository`, sześć mapperów
w `SyncContract`, trzy kolekcje w `CloudSync` — push, pull, nagrobek, czyszczenie
i usunięcie konta. `ProjectRepository.costsOf()` to nowa i jedyna w aplikacji odpowiedź na
„ile kosztuje ten projekt": lista zakupów plus każda kalkulacja, z której nic na tę listę nie
weszło. Dodanie obu kolekcji do siebie liczyłoby rachunek dwa razy.

**4. Ekrany.** `feature/crm/` — klienci, zlecenia, wyceny, plus `ProGate`, czyli ściana
rozdziału XXV zbudowana **raz** dla trzech ekranów. Wchodzi się z pulpitu, nie z dolnego
paska: pasek jest pełny przy pięciu zakładkach, a szósta zepchnęłaby najszerszy podpis poza
wiersz. Sześćdziesiąt nowych stringów w dziesięciu językach.

**5. Plan Pro na telefonie.** `PlanRepository` czyta `users/{uid}.plan` **na żywo**, więc plan
nadany przy otwartej aplikacji przesuwa poziom bez restartu. Trzy poziomy wyprowadzone,
nigdy zadeklarowane. `planRenews`, którego nie ma, znaczy „odnawia się" — każdy dokument
zapisany przed powstaniem tego pola go nie ma, a powiedzenie komuś, że subskrypcja się kończy,
kiedy dokument tego nie powiedział, to jedyny błąd tutaj, który kosztuje klienta. `ProGate`
**otwiera** moduł, kiedy planu nie da się odczytać: schowanie komuś jego własnych klientów za
zapytaniem, które nie odpowiedziało, jest gorszą awarią.

**6. Reguły nie patrzą na plan, i to jest decyzja, nie przeoczenie.** LiczMat Pro decyduje
o tym, co produkt *pokazuje* — po obu stronach. Reguła oparta o `plan` byłaby zamkiem, do
którego klient trzyma klucz, bo `plan` czyta i przeglądarka, i telefon. To, czego klient nie
może, to zapisać sobie `plan` — i tego reguły pilnują od pierwszego dnia.

**7. Serwis wysyła.** `/app/` pushuje i pulluje magazyn Pro obok warsztatu
(`pushProWorkspace()`, `crmImport()`). Każde pole jest przycięte dokładnie do tego, co
walidują wdrożone reguły: reguły są ostatnią bramką, a dokument, który odrzucą, wywraca cały
przebieg. Ostrzeżenie o cudzej kopii (`foreignWorkspace()`) liczy teraz także magazyn Pro —
to jedyny magazyn na tym urządzeniu, który trzyma czyjeś nazwisko, telefon i adres.

**8. `assets/crm-store.js` — jedyny nowy plik po stronie serwisu.** Magazyn wyszedł
z `assets/crm.js`, bo `/app/` potrzebuje dwóch funkcji, a nie 47 kB ekranów Pro. Zmierzone:
z całym `crm.js` `/app/` ważyło 401,7 kB przy budżecie 355 kB i 122,5 kB po gzipie przy
budżecie 110 kB. Ten sam argument wydzielił `assets/workspace-calc.js` w Sesji 33. Budżetu
nie podniesiono.

**9. Copy przestało obiecywać coś innego, niż jest.** Pięć zdań — `cli_local_note`,
`job_local_note`, `quo_local_note`, `cal_local_note`, `propage_local` — mówiło „trzymamy
w pamięci tej przeglądarki … i nie ma ich w aplikacji na Androida". Mówią teraz, gdzie te
dane jadą. Cztery opisy meta (`clipage_meta` i trzy siostrzane) kończyły się zdaniem „Dane
zostają w tej przeglądarce."; kończą się teraz zdaniem o synchronizacji, krótszym, więc
wszystkie zostały w limicie 160 znaków. Słowo `localStorage` znika z tych pięciu zdań
i zostaje na `/cookies/`, czyli na stronie, która jest od tego — a testy czterech modułów
pilnują obu połówek naraz.

**ZMIENIONE PLIKI**

Repo aplikacji (`3d-polednia/Materio`, commit `dbe1f36`): `docs/FIRESTORE_SYNC.md`,
`config/firebase/firestore.rules`, `core/database/entity/Entities.kt`, `dao/Daos.kt`,
`AppDatabase.kt`, `ProjectRepository.kt`, **`CrmRepository.kt`** (nowy),
`core/sync/SyncContract.kt`, `CloudSync.kt`, **`core/account/PlanRepository.kt`** (nowy),
`di/AppModule.kt`, `di/SyncModule.kt`, **`feature/crm/`** (pięć nowych plików),
`feature/home/HomeScreen.kt`, `navigation/AppDestination.kt`, `AppNavigation.kt`,
`res/values*/strings.xml` (dziesięć), **`test/CrmContractTest.kt`** (nowy), `CLAUDE.md`.

Repo serwisu: **`assets/crm-store.js`** (nowy), `assets/crm.js`, `assets/app.js`,
`assets/i18n-pages.js`, `scripts/build.mjs` (stamp `20260826e`, skrypty `/app/` i czterech
stron Pro), `privacy-policy.html`, `404.html` (stamp ręcznie), siedem plików testowych,
`docs/ARCHITEKTURA.md` (§7.17), `CLAUDE.md`, ten plik — plus 373 wygenerowane strony
i `sitemap.xml`.

**TESTY**

- Aplikacja: **213/213 testów jednostkowych przechodzi**, w tym 18 nowych w
  `CrmContractTest` — przejścia tam i z powrotem dla trzech dokumentów, nieznany status,
  termin, który jest dniem kalendarza i nigdy pierwszymi dziesięcioma znakami pełnego ISO,
  stawka robocizny jako dzielenie, cztery stany planu i wdrożone reguły przycinające te same
  pola na tych samych liczbach, co kod.
- Serwis: **25 suit bez zależności przechodzi** i **17 suit w Chromium** —
  4 979 sprawdzeń w przeglądarce, z finalnym QA (675) włącznie.

**PROBLEMY**

- **Reguły Firestore wymagają wdrożenia przez właściciela** (`firebase deploy --only
  firestore`) — plik jest w repo aplikacji, wdrożenie jest pracą w konsoli, dokładnie jak
  przy usuwaniu konta w Sesji 13. Do tego czasu zapis klienta, zlecenia albo wyceny do
  chmury jest odrzucany, a obie strony pracują lokalnie tak jak dotąd. Copy serwisu mówi już
  o synchronizacji, więc **to jest jedyne zdanie na stronie, które czeka na jedną komendę.**
- **`BackupManager` w aplikacji nie eksportuje tych trzech kolekcji — ani pokoi.** Druga
  dziura jest starsza od tej sesji. Poza zakresem, zgłoszone.
- **Ekranu terminarza na telefonie nie ma.** Zlecenia mają `dueDate` i jadą, więc dane są;
  osobnym ekranem, który je czyta, są rozdział XXIII i osobna sesja.
- **Nadal nie ma jednej komendy uruchamiającej wszystkie suity.** Zgłaszane przez Sesje 41–45;
  lista w `CLAUDE.md` ma 28 pozycji, do tego 17 suit w Chromium, i ta sesja też przeszła je ręcznie.
- **Kontener nie miał Android SDK.** Trzeba go było zainstalować, żeby cokolwiek
  skompilować; `local.properties` jest w `.gitignore` i nie poszło do repo.

**STATUS**

Zrobione. Klienci, zlecenia i wyceny są w kontrakcie, w bazie telefonu, w synchronizacji
w obie strony i na trzech ekranach za tą samą ścianą, co w przeglądarce.

**Czeka na `firebase deploy --only firestore`, i właściciel zdecydował 2026-08-26, że robi
to razem z resztą pracy w konsolach — po zamknięciu planu, nie teraz.** Lista i koszt tej
zwłoki: „Do zrobienia w konsolach" na początku tego pliku. Do tego czasu ta sesja jest
zrobiona w kodzie i nieczynna w produkcie.

**NASTĘPNE ZADANIE**

**Sesja 47 — błąd zaokrąglenia w silnikach Androida (repo aplikacji `3d-polednia/Materio`).**

### Co zrobiła Sesja 45 (plan naprawczy)

Zadanie: **stop slop — cs/sk/ro/hr/sr/ru.**

Druga połowa pary. Sesja 44 napisała `docs/COPY.md` i `scripts/test-copy.mjs` i przeprowadziła
przez nie `pl, uk, de, en`; ta sesja nie dopisuje żadnej reguły — przeprowadza przez te same
sześć zasad pozostałe sześć języków i domyka podział.

**WYKONANO**

**1. Wszystko, co test zgłaszał dla sześciu języków, zostało skrócone.** 83 poprawki:

| Co | Ile | Gdzie |
|---|---|---|
| tekst dłuższy niż 240 znaków | 27 | `faq_a5` ×6, `ck_p_signed_in` ×6, `app_wipe_d` ×6, `cal_local_note` ×6, ro `cli/job/quo_local_note` |
| zdanie dłuższe niż 25 słów | 5 | ro `ck_p_signed_in`, ro/hr/sr `g_klej_tip`, sr `g_rozkroj_tip` |
| odpowiedź FAQ powtarzająca notę | 6 | ro `waste`, hr/sr `screed`, hr/sr `ceiling`, ru `masonry` |
| obietnica bez daty | 6 | `pay_soon` ×6 |
| wzmacniacz bez treści | 11 | `note_coverage` ×4, `coverage.faq2.a` ×4, `waste.desc` ×3 |

**2. Trzy poprawki wykraczają poza to, co test zgłaszał, i tak być musiało.** Zasada §2
patrzy na pojedynczy tekst, a copy tego serwisu to jedno zdanie w dziesięciu językach.
Gdyby sześć języków zatrzymało akapit, który cztery straciły, serwis mówiłby co innego po
czesku niż po polsku — i to nie z powodu tłumaczenia, tylko dlatego, że test akurat tam nie
sięgnął progu. Więc razem z tym, co padło:

- **`hwc_source` ×6** — pierwsze zdanie („Aplikace LiczMat pro Android počítá stejným
  vzorcem") mówi to samo, co blok `appNote` na dole tej samej strony. Zostaje przypis do
  wzoru, tak jak w czterech językach Sesji 44.
- **Cztery `*_local_note` × 6 języków = 24 teksty** — wyliczenie „synchronizace zahrnuje
  projekty, místnosti, výpočty a seznamy materiálu" stało cztery razy w każdym języku,
  a jest już na `/liczmat-pro/` i na `/cookies/`. Tylko trzy z tych 24 przekraczały 240
  znaków; pozostałe 21 poszły dlatego, że to jedna decyzja o jednym zdaniu, nie o jednym
  progu.
- **`g_klej_tip` ×6 i `g_rozkroj_tip` ×6** — średnik i myślnik rozdzielające dwa pełne
  zdania rozdzielone kropką. Zgłoszone były cztery z dwunastu.

**3. `CLEAN` w `scripts/test-copy.mjs` to teraz wszystkie dziesięć języków, i §1 tego
pilnuje.** Sprawdzenie „każdy język, który serwis wysyła, przeszedł przez te zasady"
zostało dopisane w tej sesji — w Sesji 44 nie mogło istnieć, bo padałoby za pracę tej.
Test ma 14 sprawdzeń zamiast 13, run nie wypisuje już nic o pomijaniu.

**4. Budżety §7 nie zeszły i to jest pomiar, a nie przeoczenie.** Sesja 44 zapisała w
raporcie, że po wyczyszczeniu sześciu języków budżety powinny spaść. Nie spadły: **dla
każdego z dwudziestu typów stron najszerszy jest język angielski**, a angielski przeszedł
przez zasady w Sesji 44. Sześć języków skróciło swoje strony, nie dotykając ani jednego
sufitu. Przewidywanie Sesji 44 było błędne i zostaje w jej raporcie takie, jakie było —
poprawka jest tutaj.

**ZMIENIONE PLIKI**

- `assets/i18n-pages.js` — 64 teksty w sześciu językach.
- `assets/i18n.js` — `faq_a5` ×6.
- `src/calc-seo.mjs` — 6 odpowiedzi FAQ powtarzających notę, 7 wzmacniaczy.
- `scripts/test-copy.mjs` — `CLEAN` na dziesięć języków, nowe sprawdzenie §1, poprawiony
  komentarz przy tabeli budżetów.
- `docs/COPY.md` — dopisany akapit o tym, czego reguła §3 nie robi (parafraza), oraz
  poprawione dwie liczby z Sesji 44: powtórzeń FAQ było 17 na czternastu stronach
  kalkulatorów, a wzmacniaczy 18 w ośmiu językach, nie w pięciu.
- `scripts/build.mjs` — `STAMP` na `20260826d`.
- `404.html`, `privacy-policy.html` — `?v=` podbite ręcznie.
- 373 przebudowane strony + `sitemap.xml`.

**TESTY**

24 zestawy dependency-free przechodzą. `test-copy` **14/14 na wszystkich dziesięciu
językach**: zero zdań ponad 25 słów, zero tekstów ponad 240 znaków, zero FAQ powtarzających
notę, zero obietnic bez pokrycia, zero wykrzykników i słów wersalikami, zero wzmacniaczy,
374 strony w dwudziestu budżetach. `test-perf` 13157/13157, `node scripts/build.mjs --check`
czysty. Zestawy w Chromium nie były uruchamiane — nie ruszano skryptu ani stylu.

Proza w `<main>` na 375 stronach, przez obie sesje: **125 965 → 125 161 → 124 217 słów**,
czyli −1 748 (−1,4%) przy tej samej liczbie stron i bez usunięcia ani jednego faktu poza
jednym: obietnicą „płatności uruchamiamy wkrótce", za którą nie stała żadna data.

**PROBLEMY**

- **Strony Pro nadal drukują „Dostępne w LiczMat Pro" dwa razy** — pasek nad modułem
  (`#crm-pro`, w markupie `hidden`) i karta modułu na ścianie. Zgłoszone przez Sesję 44,
  nienaprawione: to markup w `proGate()` i czterech stronach Pro, a nie słownik, więc jest
  decyzją o tym, co widzi ktoś bez JavaScriptu. Osobne zadanie.
- **`appNote` stoi także na stronach Pro**, gdzie moduł nie ma nic wspólnego ze wzorem.
  Decyzja właściciela o tym, gdzie serwis proponuje aplikację.
- **`/app/` ma 846 słów w `<main>`.** Najcięższa strona poza katalogiem i polityką
  prywatności. Nie ruszana: to trzy karty poziomów konta i opis pięciu modułów Pro, a
  skrócenie ich jest decyzją o tym, ile Pro tłumaczy o sobie przed zapłatą.
- **Sześć zasad nie łapie parafrazy.** Odpowiedź FAQ, która mówi to samo, co nota nad nią,
  ale innymi słowami, przechodzi — bo §3 porównuje zdania, a nie znaczenie. Widać to na
  `linear`: nota mówi „rzaz odejmuje się przy każdym kolejnym cięciu", a FAQ pyta „czy rzaz
  jest wliczony" i odpowiada tym samym. Maszyna tego nie zmierzy; człowiek czytający stronę
  zmierzy. Zapisane w `docs/COPY.md` jako to, czego reguła nie robi.
- **Nadal nie ma jednej komendy uruchamiającej wszystkie suity.** Zgłaszane przez Sesje 41,
  42, 43 i 44; lista w `CLAUDE.md` ma 28 pozycji i ta sesja też przeszła ją ręcznie.
- **`hasPendingWrites` w `scripts/fake-firebase.mjs` nadal zawsze `false`** — zgłoszone
  przez Sesję 42, nienaprawione, poza zakresem.

**STATUS**

Zrobione. Dziesięć języków przeszło przez sześć zasad, `CLEAN` jest kompletne i §1 pilnuje,
żeby nowy język nie wszedł na stronę bez przejścia przez nie. Zasady mają jedno miejsce
(`docs/COPY.md`), jedno egzekwowanie (`scripts/test-copy.mjs`) i budżet prozy dla dwudziestu
typów stron, którego nie da się przekroczyć po cichu.

**NASTĘPNE ZADANIE**

**Sesja 46 — klienci, zlecenia i wyceny na telefon (repo aplikacji `3d-polednia/Materio`).**

### Co zrobiła Sesja 44 (plan naprawczy)

Zadanie: **stop slop — zasady, test, pl/uk/de/en.**

Ustalenie właściciela z 2026-08-21: „stop slop" znaczy **skrócić plus test, który
pilnuje**. Sesja 44 pisze zasady i test i czyści cztery języki; Sesja 45 czyści pozostałe
sześć.

**WYKONANO**

**0. Najpierw pomiar, zanim cokolwiek zostało skreślone — i pomiar nie potwierdził
zgłoszenia w takiej skali, w jakiej się go spodziewano.** 10 730 tekstów, które czyta
odwiedzający (dwa słowniki, nazwy materiałów, copy SEO 150 stron kalkulatorów) plus 375
wysłanych stron. Wykrzykników: **0**. Słów wersalikami poza skrótami produktu: **0**.
Superlatywów: **0**. Serwis nie miał problemu z marketingowym krzykiem. Miał cztery inne,
policzalne:

| Co | Ile było (10 języków) | Ile w pl/uk/de/en |
|---|---|---|
| zdanie dłuższe niż 25 słów | 24 | 19 |
| tekst dłuższy niż 240 znaków | 52 | 25 |
| odpowiedź FAQ powtarzająca zdanie noty nad nią | 17 | 11 |
| obietnica bez daty (`pay_soon`) | 10 | 4 |
| wzmacniacz bez treści („naprawdę", „wirklich", „actually") | 18 | 7 |

**1. Sześć zasad, każda wyprowadzona z planu, każda mierzalna.** Narracja jest w nowym
`docs/COPY.md`, egzekwowanie w nowym `scripts/test-copy.mjs` — dokładnie ta sama para, co
`docs/DESIGN_SYSTEM.md` i `src/tokens.mjs`. §2 długość (25 słów / 240 znaków), §3 strona
kalkulatora nie mówi dwa razy tego samego, §4 nic, czego strona nie potrafi dotrzymać,
§5 bez krzyku, §6 słowo, które nic nie niesie, §7 budżet prozy na typ strony.

Żadna z nich nie jest cudzym przewodnikiem stylu: XXVII zabrania „ścian tekstu",
„powtarzających się CTA" i „marketingowego «krzyku»", XXVI zabrania upychania słów
kluczowych, XII nie pozwala treści SEO zasłonić kalkulatora, `CLAUDE.md` zabrania obietnic
bez pokrycia. Progi 25 i 240 to pomiar tej strony z 2026-08-26, nie liczby z podręcznika —
240 znaków to około czterech linijek na telefonie 320 px, tym samym, który mierzy
`scripts/test-phone.mjs`.

**2. §7 to jedyna zasada, która pilnuje strony, a nie akapitu — i to ona odpowiada na
prośbę „skrócić".** `scripts/test-calc-seo.mjs` sprawdza już **kolejność** (rozdział XII:
H1 → formularz → wynik → wyjaśnienie → FAQ), ale strona może zachować kolejność i dalej
być ścianą, mówiąc w sześciu akapitach to, co mieści się w dwóch. Liczone są słowa w
`<main>`, osobno dla dwudziestu typów stron, przeciwko tabeli **bez marginesu**. Sesja,
która chce powiedzieć więcej, podnosi liczbę w tabeli i tłumaczy się w raporcie. Dwa typy
są listą, nie prozą, i mają budżet listy: katalog 161 materiałów i polityka prywatności,
która niesie dwie pełne wersje językowe w jednym pliku, bo Google Play wymaga jednego
adresu.

**3. Obietnica, której nie było czym pokryć.** `pay_soon` mówiło „płatności uruchamiamy
wkrótce" / „payments open shortly" / „die Bezahlung schalten wir in Kürze frei" we
wszystkich dziesięciu językach — w czasie, gdy konta Stripe nie ma, więc żadna data za tym
nie stała. Skreślone, nie przeredagowane: zdanie przed nim („subskrypcji jeszcze nie da
się wykupić") jest całą prawdą i nie potrzebuje ciągu dalszego. W tej sesji cztery języki,
w Sesji 45 sześć pozostałych.

**4. FAQ, które przepisywało notę stojącą nad nim.** Strona kalkulatora niesie ostrzeżenie
w „Jak to liczymy" (`note_<id>` w `assets/i18n-pages.js`) i FAQ pod kalkulatorem
(`src/calc-seo.mjs`) — pisane ręcznie, w odstępie jednej sesji. Po polsku `wallpaper`
powtarzał **całą** notę, słowo w słowo, dwa akapity niżej. To nie jest kosmetyka: FAQ jedzie
do wyniku wyszukiwania jako `FAQPage`, więc powtórzone zdanie jest powtórzone także w
Google. Przepisane osiem odpowiedzi (`waste` pl+en, `wallpaper`, `screed`, `masonry`,
`studwall`, `ceiling`, `sheathing` po polsku) tak, żeby odpowiadały na pytanie i dokładały
to, czego nota nie mówi — najczęściej gdzie się tę wartość wpisuje. `docs/COPY.md` mówi
wprost, że przepisanie „tak, żeby test przestał widzieć" jest złą naprawą.

**5. `hwc_source` mówiło to, co blok na dole tej samej strony.** „Ten sam wzór liczy
aplikacja LiczMat na Androida" w bloku „Wzór", a 200 pikseli niżej `appNote`: „Ten sam wzór
w aplikacji — LiczMat na Androida liczy tym samym silnikiem". Jedno zdanie, dwa razy, na
każdej ze 150 stron kalkulatorów. Zostaje przypis do wzoru („Silnik strony jest portem 1:1
kodu z aplikacji na Androida"), bo mówi rzecz, której `appNote` nie mówi; powtórzona
połowa poszła.

**6. Cztery `*_local_note` (klienci, zlecenia, wyceny, terminarz) wyliczały synchronizację
w każdym z czterech tekstów.** Zdanie „nie ma ich w aplikacji na Androida — synchronizacja
obejmuje projekty, pomieszczenia, kalkulacje i listy materiałów" stało cztery razy w każdym
języku. Wyliczenie jest już na `/liczmat-pro/` (`propage_local`) i na `/cookies/`, a notatka
pod modułem ma powiedzieć trzy rzeczy: gdzie to leży, że nigdzie nie idzie, że wyczyszczenie
danych witryny to kasuje. Tyle zostało.

**7. Dwie zasady, których celowo NIE napisano, i to jest część roboty.** Pierwsza wersja
testu liczyła **myślniki** — i wyszło, że kara spada na użycie *poprawne* (para myślników
to nawias), a przepuszcza to, o które w `CLAUDE.md` chodzi (pojedyncza retoryczna pauza),
bo oba wyglądają tak samo. W polskim i ukraińskim myślnik jest zwykłym znakiem
interpunkcyjnym i zakaz byłby po prostu błędem. Druga: **gęstość słów kluczowych** (XXVI)
jest fałszywym alarmem na stronie, która z definicji powtarza słowo „płytki" — tego pilnuje
`scripts/test-calc-seo.mjs` §6, po swojemu. Reguła, która myli się w obie strony, jest
gorsza niż jej brak; `docs/COPY.md` ma na to osobny rozdział.

**8. Pułapka, w której ten test mieszka: `\b` w JavaScripcie jest ASCII.** `\w` to
`[A-Za-z0-9_]`, więc granica słowa w `/\bbest\b/` trafia **w środek** niemieckiego
„Bestätige" — „ä" nie jest znakiem `\w`. Pierwsza wersja §4 zgłosiła pięć superlatywów na
tej stronie i wszystkie pięć było tym. `word()` w `scripts/test-copy.mjs` buduje granicę z
`\p{L}\p{N}` i flagi `u`; copy w dziesięciu językach, sześć z diakrytykami i dwa cyrylicą,
nie da się sprawdzać regułą ASCII. Zanotowane w `CLAUDE.md` jako zasada dla następnych
testów, nie tylko dla tego.

**9. Podział na dwie sesje nie może wywalać testu.** Między commitem Sesji 44 a commitem
Sesji 45 stała `CLEAN` w `scripts/test-copy.mjs` wymienia cztery języki, a sześć jest
pomijanych **bez błędu** — test, który pada za pracę, której jeszcze nikt nie zrobił, jest
testem, którego następna sesja uczy się nie czytać. Run mówi na końcu, co pomija. §7 mierzy
za to **wszystkie** strony we wszystkich dziesięciu językach od razu, bo budżet jest
własnością strony, nie języka.

**ZMIENIONE PLIKI**

- `scripts/test-copy.mjs` — **nowy**, 13 sprawdzeń, dependency-free.
- `docs/COPY.md` — **nowy**, narracja sześciu zasad i dwóch nienapisanych.
- `assets/i18n.js` — `faq_a5` w czterech językach.
- `assets/i18n-pages.js` — 47 tekstów w czterech językach: `pay_soon`, `ck_p_signed_in`,
  `app_wipe_d`, cztery `*_local_note`, `hwc_source`, `guides_meta`, `dash_local_note`,
  `note_coverage` i siedem `g_*` z poradników.
- `src/calc-seo.mjs` — 18 tekstów: osiem odpowiedzi FAQ powtarzających notę, pięć zdań
  dłuższych niż 25 słów, pięć wzmacniaczy.
- `scripts/build.mjs` — `STAMP` na `20260826c`.
- `404.html`, `privacy-policy.html` — `?v=` podbite ręcznie.
- 373 przebudowane strony + `sitemap.xml`.
- `CLAUDE.md` — test i `docs/COPY.md` na listach, zasada „no marketing slop" rozszerzona
  o to, co jest teraz mierzone, plus dwie nowe: dlaczego myślnik zostaje prozą i dlaczego
  `\b` nie nadaje się do tego słownika.

**TESTY**

24 zestawy dependency-free przechodzą, łącznie z nowym: `test-copy` 13/13, `test-perf`
13157/13157, `test-seo`, `test-calc-seo`, `test-langs`, `test-security`, `test-a11y`,
`test-calculators` i pozostałe bez zmian. `node scripts/build.mjs --check` czysty.
Zestawy w Chromium (Playwright poza repo) nie były w tej sesji uruchamiane — nie ruszano
w niej ani skryptu w przeglądarce, ani stylu.

Efekt na wysłanych stronach: **125 965 → 125 161 słów w `<main>`** na 375 stronach, przy
niezmienionej liczbie stron. To jest uczciwa miara tej sesji i celowo nie jest większa:
copy tego serwisu było już krótkie, a tym, czego brakowało, była nie siekiera, tylko
liczba, której nie da się przekroczyć po cichu.

**PROBLEMY**

- **Sześć języków czeka na Sesję 45.** `cs, sk, ro, hr, sr, ru` — 5 zdań ponad 25 słów, 27
  tekstów ponad 240 znaków, 6 powtórzeń FAQ, 6 obietnic `pay_soon`, 11 wzmacniaczy.
  Budżety §7 są dziś ustawione na najszerszy język każdego typu, a to zwykle jeden z tych
  sześciu — po Sesji 45 mają zejść.
- **Strony Pro nadal drukują „Dostępne w LiczMat Pro" dwa razy** — raz w pasku nad modułem
  (`#crm-pro`, w markupie `hidden`, odsłaniany przez `assets/paywall.js`), raz w karcie
  modułu na ścianie. Dla czytnika i dla wizyty bez JavaScriptu to jedno zdanie dwa razy na
  jednej stronie, czyli dokładnie „powtarzające się CTA" z rozdziału XXVII. Naprawa jest w
  markupie, nie w słowniku, i dotyka `proGate()` oraz czterech stron Pro — osobne zadanie,
  bo to decyzja o tym, co widzi ktoś bez skryptu.
- **`appNote` („Ten sam wzór w aplikacji" + Pobierz) stoi też na stronach Pro**, gdzie
  moduł nie ma nic wspólnego ze wzorem. Zgłoszone, nienaprawione: to decyzja o tym, gdzie
  serwis proponuje aplikację, i należy do właściciela.
- **`/app/` ma 846 słów w `<main>`** i jest najcięższą stroną serwisu poza katalogiem i
  polityką prywatności. Nie ruszane: to trzy karty poziomów konta plus opis pięciu modułów
  Pro, a skracanie ich jest decyzją o tym, ile Pro tłumaczy o sobie przed zapłatą.
- **Nadal nie ma jednej komendy uruchamiającej wszystkie suity.** Zgłaszane przez Sesje
  41, 42 i 43; lista w `CLAUDE.md` ma teraz **28** pozycji i ta sesja też przeszła ją
  ręcznie.
- **`hasPendingWrites` w `scripts/fake-firebase.mjs` nadal zawsze `false`** — zgłoszone
  przez Sesję 42, nienaprawione, poza zakresem.

**STATUS**

Zrobione. Zasady są zapisane w jednym miejscu, mierzy je 13 sprawdzeń, a cztery języki
przez nie przeszły: zero zdań ponad 25 słów, zero tekstów ponad 240 znaków, zero FAQ
powtarzających notę, zero obietnic bez daty, zero wzmacniaczy — i dwadzieścia typów stron
z budżetem prozy, którego nie da się przekroczyć bez podniesienia liczby w tabeli.

**NASTĘPNE ZADANIE**

**Sesja 45 — stop slop: cs/sk/ro/hr/sr/ru.**

### Co zrobiła Sesja 43 (plan naprawczy)

Zadanie: **kalkulator na prawdziwym telefonie.**

Ustalenie właściciela z 2026-08-21: „rozjechany na telefonie" dotyczy **strony
pojedynczego kalkulatora**.

**WYKONANO**

**0. Najpierw pytanie, dlaczego Sesja 32 tego nie widziała.** `scripts/test-mobile.mjs`
przechodzi 1152/1152 i przechodziła przez cały czas. Powód jest jeden i dotyczy wszystkich
suit w przeglądarce w tym repozytorium: **każda z nich otwiera zwykłe okno Chromium i zwęża
je**, bez `isMobile`, bez `hasTouch`, bez profilu urządzenia. Zwężone okno na biurku i telefon
to nie jest to samo — okno ma mysz, ma `hover`, ma wysokość 800px, której nie ma żaden
telefon, i nie da się go obrócić. Ta sesja przepuściła serwis przez profile urządzeń
Playwrighta i zmierzyła trzy rzeczy, których szerokość nie umie zapytać.

**1. Baner zgody leżał na kalkulatorze i zjadał jego dotknięcia.** Zmierzone przed
jakąkolwiek zmianą, na `/kalkulatory/plytki-panele-gres/`, iPhone SE (320×568):

```
document.elementFromPoint(środek pola „Powierzchnia (m²)")  → DIV.consent-banner
touchscreen.tap(ten sam punkt)                              → document.activeElement = BODY
```

Baner jest `position: fixed` przy dolnej krawędzi i **nic nie trzymało dla niego miejsca**.
Ma 200px na ekranie o wysokości 568px — 35% ekranu — i tyle samo na Pixelu 5. Skutki, oba
zmierzone: dotknięcie pola formularza nie ustawiało fokusu nigdzie (a dotknięcie tego
samego punktu potrafiło trafić w link banera i **wyprowadzić odwiedzającego na politykę
prywatności**), a ostatni link w dokumencie nie dawał się spod banera wyprowadzić — nie
było już czym przewinąć.

To jest pierwsza wizyta, czyli jedyna, dla której baner istnieje, i dokładnie ta, którą
produkuje wynik wyszukiwania na telefonie.

Naprawione: `assets/main.js` mierzy baner i zapisuje `--consent-h`, a `body` wydaje to
jako `padding-bottom`. Wysokość jest **mierzona, nie zgadywana** — to jedno zdanie
w dziesięciu językach na szerokość telefonu i po niemiecku ma 256px tam, gdzie po polsku
200px — więc pomiar chodzi za `ResizeObserver`, za obrotem ekranu i za `langchange`.
Odpowiedź na baner oddaje miejsce z powrotem (zmierzone: `padding-bottom` wraca do 0).

Po zmianie wszystkie 32 kontrolki strony kalkulatora dają się wyprowadzić spod banera
i **każda przyjmuje własne dotknięcie**, na wszystkich siedmiu profilach; ostatni link
w dokumencie też.

**Czego to nie robi, i mówię to wprost:** baner nadal przykrywa środek przewiniętej
strony, bo tym właśnie jest pasek przy dolnej krawędzi. Wyprowadzenie kalkulatora spod
niego na stałe znaczy wyjęcie zgody z nakładki — a to jest decyzja o tym, **jak zbierana
jest zgoda** (ile osób ją kliknie, czyli ile widzi Analytics), więc należy do właściciela.
Próbowałem najpierw skrócić sam baner; nie da się uczciwie: z tych 200px 76 to samo zdanie,
32 to padding, a reszta to jeden rząd linków i jeden rząd przycisków — układ, który już
jest minimalny. Skrócenie znaczyłoby skrócenie **treści zgody**, a to nie jest zadanie tej
sesji (i Sesje 44–45 mają copy w zakresie). Zmierzone i odrzucone, nie przeoczone.

**2. Ten sam telefon obrócony na bok dostawał rozmiary kontrolek dla myszy.** Zmierzone:

| Urządzenie | szerokość | czip | `.btn-sm` | przyciski nagłówka |
|---|---|---|---|---|
| Galaxy S8, pionowo | 360px | 44px | 44px | 44px |
| **Galaxy S8, poziomo** | **740px** | **30px** | **40px** | **36px** |
| iPhone 12, poziomo | 750px | 30px | 40px | 36px |
| iPad (gen 7) | 810px | 30px | 40px | 36px |

Jedno urządzenie, jeden palec, dwa zestawy rozmiarów. Powód: reguła z Sesji 32 brzmiała
`@media (max-width: 560px)`, a 560px było wtedy dobrym przybliżeniem „to jest telefon",
bo serwis mierzono w zwężonym oknie. Pytanie, które trzeba zadać, brzmi **„czy to jest
palec"**, i odpowiada na nie tylko wskaźnik. Reguła to teraz
`@media (max-width: 560px), (pointer: coarse)`. Połowa z szerokością zostaje — zwężone
okno to nadal sposób, w jaki sprawdza się to bez urządzenia.

Jeden wyjątek, i jest zmierzony: `.theme-toggle` i `.menu-toggle` powyżej 1060px stoją
w wierszu, który Sesje 32 i 40 zmierzyły co do piksela po rosyjsku, a 8px każdy to 16px,
których ten wiersz nie ma. Ich reguła to `(max-width: 560px), (max-width: 1060px) and
(pointer: coarse)`: poniżej szuflady wiersz ma dla siebie cały ekran, więc palec dostaje
tam 44px, a mysz na szerokim ekranie dotykowym zachowuje wiersz, który się mieści.

**3. Dialog katalogu materiałów był wymiarowany w `vh`.** Na telefonie `100vh` to ekran
**ze schowanymi paskami przeglądarki**, czyli więcej, niż odwiedzający widzi. Dialog ma
`max-height: 86vh`, a przewijana lista w środku `52vh`, więc jej dół — czyli wiersz,
po który ktoś sięga — zwiesza się poza ekran. Szuflada nawigacji dostała parę
`vh` + `dvh` w Sesji 32 z komentarzem, dlaczego; dialog został pominięty. Dopisane obu,
plus `.block-fill`. Tego **nie da się sprawdzić w przeglądarce w kontenerze** — Chromium
nie rysuje pasków przeglądarki, więc `100vh === innerHeight` i test byłby zielony przy
każdej wartości. Sprawdza to więc arkusz, nie strona: `scripts/test-phone.mjs` §9 czyta
`assets/styles.css` i wywala się na samotnym `vh`.

**4. Nowa suita: `scripts/test-phone.mjs`, 372 sprawdzenia.** Pyta o to, o co pyta
urządzenie, a nie o to, o co pyta szerokość:

- §1 profile **naprawdę są urządzeniami** — `(pointer: coarse)`, `(hover: none)`, powierzchnia
  dotykowa. Bez tego suita mogłaby po cichu zdegradować się do kolejnego przeglądu szerokości
  i świecić na zielono, kiedy serwis się psuje;
- §1b **ten sam telefon, obrócony** — czip, `.btn-sm` i przełącznik motywu muszą mieć w obu
  orientacjach ten sam rozmiar;
- §2–3 cel dotykowy 44px i pole 16px na siedmiu profilach × pięciu typach stron;
- §4 miejsce zarezerwowane dla banera, ostatni link w dokumencie przyjmujący własne
  dotknięcie, i miejsce oddane po odpowiedzi;
- §5 wszystkie kontrolki strony kalkulatora wyprowadzone spod banera, pytane
  `elementFromPoint`-em. To jest istotne: **`click()` Playwrighta tego nie zobaczy**, bo
  przewija element, aż ten zacznie dostawać zdarzenie — biblioteka sama obchodzi defekt,
  dla którego się ją uruchamia. Człowiek nie obchodzi;
- §6 kalkulacja zrobiona palcem na najwęższym telefonie, przy podniesionym banerze;
- §7 brak przewijania w poziomie na każdym profilu, w obu orientacjach;
- §8 `<meta name="viewport">`, który nie odbiera zoomu;
- §9 `dvh` w arkuszu, patrz punkt 3.

**Suita została sprawdzona na kodzie sprzed naprawy**: 336/372, 36 czerwonych — dokładnie
punkty 1, 2 i 3. Test, którego nikt nie widział na czerwono, nie jest dowodem niczego.

**ZMIENIONE PLIKI**

- `assets/styles.css` — cel dotykowy na `(pointer: coarse)` (z wyjątkiem dla dwóch
  przycisków nagłówka), token `--consent-h`, `body { padding-bottom }`, `dvh` w `.mat-dialog`,
  `.mat-list` i `.block-fill`.
- `assets/main.js` — pomiar banera (`ResizeObserver`, `langchange`), zapis i zerowanie
  `--consent-h`.
- `scripts/test-phone.mjs` — nowy plik, 372 sprawdzenia.
- `scripts/build.mjs` — `STAMP` → `20260826b`.
- `privacy-policy.html`, `404.html` — `?v=` podbite ręcznie, bo generator ich nie pisze.
- 373 strony + `assets/styles.min.css` przebudowane.
- `CLAUDE.md`, `docs/DESIGN_SYSTEM.md` — trzy nowe reguły i nowa suita.

**TESTY**

`node scripts/build.mjs --check` — 1157 kluczy × 10 języków. `check-contrast.mjs` — all
pairs pass. **41 suit, wszystkie zielone.**

Bez zależności (23): `calculators` 2113, `account` 179, `dashboard` 306, `projects` 884,
`save` 1280, `materials` 383, `costs` 225, `rooms` 411, `plan` 1114, `pay` 398,
`pro-admin` 110, `webhook` 111, `jobs` 1032, `quotes` 1096, `schedule` 634, `crm` 419,
`propage` 1083, `seo` 36869, `calc-seo` 5133, `perf` 13157, `a11y` 60, `security` 9079,
`langs` 34.

W przeglądarce (18): **`phone` 372 — nowa**, `pages` 759, `mobile` 1152,
`a11y (browser)` 55, `materials-page` 166, `costs-page` 134, `projects-page` 177,
`dashboard-page` 90, `save-page` 70, `rooms-page` 195, `clients-page` 145,
`jobs-page` 164, `quotes-page` 188, `schedule-page` 162, `crm-page` 141,
`pro page` 148, `account-page` 236, `final QA` 675.

Nowa suita sprawdzona **na kodzie sprzed naprawy**: 336/372, 36 czerwonych.

**PROBLEMY**

- **Baner nadal przykrywa środek przewiniętej strony.** Opisane w punkcie 1 — decyzja
  właściciela, nie defekt do cichego naprawienia. Trzy możliwości: zostawić tak, wyjąć
  baner z nakładki (ustawić go w toku strony u góry, pod nagłówkiem — nic już wtedy nie
  zasłania, ale baner odjeżdża przy przewijaniu i mniej osób go kliknie), albo skrócić samo
  zdanie zgody. Druga i trzecia zmieniają to, ile widzi Analytics.
- **Pozostałe suity w przeglądarce nadal mierzą zwężone okno.** `test-pages`, `test-mobile`,
  `test-a11y-page`, `test-qa` i osiem suit modułowych otwierają `newContext({ viewport })`
  bez profilu urządzenia. Nowa suita pokrywa tym stronę kalkulatora, hub, stronę główną,
  katalog i projekty; **ekrany Pro, kosztorys, `/app/` i `/p/` na profilach urządzeń nie
  były sprawdzone**. Osobne zadanie.
- **`hasPendingWrites` w `scripts/fake-firebase.mjs` nadal zawsze `false`** — zgłoszone
  przez Sesję 42, nienaprawione, nie w zakresie tej sesji.
- **Nadal nie ma jednej komendy uruchamiającej wszystkie suity.** Zgłoszone przez Sesję 41,
  powtórzone przez Sesję 42, nadal aktualne — ta sesja też przeszła listę z `CLAUDE.md`
  ręcznie, a lista ma teraz 26 pozycji. Osobne zadanie i coraz droższe.
- **Klawiatura ekranowa nie została zmierzona.** Playwright nie otwiera klawiatury telefonu,
  więc pytanie „co widać, kiedy ktoś pisze w polu" jest w tym kontenerze nie do zadania.
  Do sprawdzenia na prawdziwym urządzeniu.

**STATUS**

Zrobione. Na profilach siedmiu urządzeń — dwóch telefonów w obu orientacjach i tabletu —
każda kontrolka kalkulatora ma 44px i przyjmuje własne dotknięcie, strona trzyma miejsce
dla banera, dialog katalogu mieści się na ekranie, a kalkulacja daje się zrobić palcem na
najwęższym telefonie przy podniesionym banerze.

**NASTĘPNE ZADANIE**

**Sesja 44 — stop slop: zasady, test, pl/uk/de/en.**

### Co zrobiła Sesja 42 (plan naprawczy)

Zadanie: **`/app/`: fałszywe „Brak sieci".**

**WYKONANO**

**1. Defekt odtworzony, zanim cokolwiek zostało zmienione.** Napęd testowy udający
Firebase (`scripts/fake-firebase.mjs`) mówił dotąd o **każdej** migawce, że przyszła
z serwera — dlatego 213 sprawdzeń w Chromium nie potrafiło tego zobaczyć. Po nauczeniu go
jednej rzeczy, którą prawdziwe SDK robi, a on nie (migawka mówi, skąd przyszła, i migawka
bez zmiany dokumentu **nie dociera** do nasłuchu, który nie poprosił o metadane), kod
sprzed tej sesji odpowiada tak:

```
po zalogowaniu     : "Brak sieci — zmiany polecą po powrocie łącza."
migawka z cache    : "Brak sieci — zmiany polecą po powrocie łącza."
serwer odpowiedział: "Brak sieci — zmiany polecą po powrocie łącza."
po zmianie języka  : "Brak sieci — zmiany polecą po powrocie łącza."   ← po polsku, na stronie niemieckiej
```

To jest zgłoszenie właściciela, co do słowa. Łącze działa przez cały ten czas.

**2. Dlaczego to się nie dawało odwołać — i to jest sedno.** Strona liczyła stan łącza
z `snapshot.metadata.fromCache`, które odpowiada na inne pytanie: „czy te dane przyszły
z serwera". Odpowiada „nie" w trzech sytuacjach i tylko jedna to awaria (§7.16
`docs/ARCHITEKTURA.md`). Ale drugą połowę robi reguła SDK, a nie tego repozytorium —
z wysłanego pliku `firebase-firestore.js` 10.14.1, `__PRIVATE_QueryListener`:

```js
ia(e){ if(e.docChanges.length>0) return true;
       const i=this.ra&&this.ra.hasPendingWrites!==e.hasPendingWrites;
       return !(!e.syncStateChanged&&!i)&&!0===this.options.includeMetadataChanges }
```

Migawka, w której żaden dokument się nie zmienił, dociera **wyłącznie** do nasłuchu
z `includeMetadataChanges: true`. Serwer odpowiadający tymi samymi dokumentami, które
leżały w cache, jest dokładnie taką migawką — więc nic nie przychodziło i zdanie stało do
zamknięcia karty. Symetrycznie: **łącze, które naprawdę padło, nie było ogłaszane wcale.**
Komunikat mylił się w obie strony.

**3. Naprawa: dwa źródła, każde odpowiada na co innego.** `connectionState()`
w `assets/app.js`:

- `navigator.onLine === false` — przeglądarka mówi, że łącza nie ma. Pewne
  i natychmiastowe. `true` nie jest dowodem niczego (laptop w hotelowym Wi-Fi bez
  internetu też odpowiada `true`), więc jest wierzone **tylko w jedną stronę**.
- każdy nasłuch czyta z cache dłużej niż `OFFLINE_AFTER_MS` — przypadek, którego
  przeglądarka nie widzi. **10 000 ms nie jest wymyślone**: tyle sam SDK daje swojemu
  backendowi, zanim zapisze „Backend didn't respond within 10 seconds" i przełączy
  klienta w tryb offline (`online_state_timeout` w tym samym pliku). Ogłaszać zerwane
  łącze wcześniej niż biblioteka, która to łącze trzyma, to zgadywanie.

**4. Komunikat dostał własny wiersz.** `#app-offline` zamiast wspólnego paska statusu.
Wspólny kosztował dwa razy: deptał to, co ktoś inny tam postawił („Nazwa zapisana."),
a zdjąć go dało się **wyłącznie** porównując wyświetlony tekst z tłumaczeniem, którym się
go napisało — więc przełączenie języka przybijało go na stałe. Zdanie stoi w markupie
z kluczem `data-i18n="app_offline"`, więc `langchange` przepisuje je za darmo, a skrypt
przestawia tylko `hidden`. Ta sama zasada, co przy ścianie płatności: blok jest w stronie
od pierwszego malowania i ukryty, bo element tworzony przez skrypt zdąży mignąć.
**Zero nowych kluczy** — `app_offline` istniało w dziesięciu językach od Sesji 13.

**5. Jedna rzecz, której `includeMetadataChanges` zrobić nie może: przerysować list.**
`renderProjects()` buduje `#project-list` przez `innerHTML`, a w każdym wierszu projektu
stoi formularz „dodaj pomieszczenie". Przerysowanie na potwierdzeniu zapisu wyjęłoby
kursor z pola, w którym ktoś pisze. Przerysowanie jest więc zawężone do
`snap.docChanges().length` plus pierwsza migawka, która musi narysować listę także pustą.

**6. Zmierzone na żywym backendzie: właściciel poprawił obie listy w konsolach Google.**
Nie było to zadaniem tej sesji, ale było w repozytorium zapisane jako stan bieżący i od
dziś jest nieprawdą, więc zostało sprawdzone, a nie przyjęte. To samo wywołanie
`accounts:signInWithPassword` z trzema nagłówkami `Referer`:

| Referer | Odpowiedź |
|---|---|
| `https://liczmat.com/app/` | 400 `INVALID_LOGIN_CREDENTIALS` — klucz przepuścił, Auth doszedł do sprawdzenia hasła |
| `https://www.liczmat.com/app/` | 400 `INVALID_LOGIN_CREDENTIALS` |
| host spoza listy | 403 `API_KEY_HTTP_REFERRER_BLOCKED` — ograniczenie nadal działa |

A lista autoryzowanych domen, której **w ogóle nie dało się odczytać**, dopóki klucz był
ograniczony, czyta się teraz przez ten sam klucz: `materio-502513.firebaseapp.com`,
`materio-502513.web.app`, `materio-app.com`, `www.materio-app.com`, `localhost`,
**`liczmat.com`**, **`www.liczmat.com`**. Zakładanie konta i logowanie z nowej domeny
działa. To także wyjaśnia, dlaczego fałszywe „Brak sieci" zgłoszono dopiero teraz: przez
dwanaście dni po przeprowadzce nikt nie mógł dojść na `/app/` dalej niż do formularza.

**ZMIENIONE PLIKI**

Zmienione:
- `assets/app.js` — `OFFLINE_AFTER_MS`, `connectionState()`, `renderConnection()`,
  `connectionSaw()`; `listen()` prosi o metadane i zawęża przerysowanie;
  `stopListening()` zdejmuje komunikat razem z nasłuchami; `boot()` słucha zdarzeń
  `online`/`offline`.
- `src/app-pages.mjs` — `#app-offline`, ukryty, `role="status"`, `data-i18n="app_offline"`.
- `scripts/fake-firebase.mjs` — migawka kolekcji ma `metadata` i `docChanges()`,
  `onSnapshot()` rozpoznaje wariant z opcjami, `window.__fbFromCache`
  i `window.__fbSync(fromCache, changed)`.
- `scripts/test-account.mjs` — §11, dwanaście sprawdzeń bez zależności.
- `scripts/test-account-page.mjs` — §18, §18b i §18c w Chromium.
- `scripts/test-a11y.mjs` — `#app-offline` na liście obszarów żywych.
- `assets/firebase-config.js`, `CLAUDE.md`, `docs/ARCHITEKTURA.md` §7.16, ten plik.
- `scripts/build.mjs` — `STAMP` na `20260826a`, plus `?v=` w ręcznie pisanych `404.html`
  i `privacy-policy.html`.
- 373 wygenerowane strony: 372 z nich **wyłącznie** przez `?v=`; `app/index.html` dodatkowo
  o jeden wiersz komunikatu. `sitemap.xml` bez zmian — porównanie stojące za `lastmod`
  pomija `?v=`, więc podbicie stempla nie przedatowuje serwisu.

**TESTY**

- `scripts/test-account.mjs`: **179/179** (przed sesją: 148/148). Nowe §11 uruchomione na
  kodzie sprzed naprawy daje **11 błędów**, każdy nazywający jedną połowę defektu.
- `scripts/test-account-page.mjs`: **236/236** (przed sesją: 213/213). §18c to zgłoszenie
  właściciela odtworzone co do zdania.
- `scripts/test-a11y.mjs`: **60/60** (było 59).
- Chromium, reszta bez zmian: `test-pages` 759/759, `test-mobile` 1152/1152,
  `test-a11y-page` 55/55, `test-propage-page` 148/148, `test-qa` 675/675,
  `test-projects-page` 177/177, `test-dashboard-page` 90/90, `test-save-page` 70/70,
  `test-materials-page` 166/166, `test-rooms-page` 195/195, `test-costs-page` 134/134,
  `test-clients-page` 145/145, `test-jobs-page` 164/164, `test-quotes-page` 188/188,
  `test-crm-page` 141/141, `test-calendar-page` 162/162.
- Bez zależności, wszystkie przechodzą: seo 36869, perf 13157, security 9072,
  calc-seo 5133, calculators 2113, save 1280, plan 1114, quotes 1096, propage 1083,
  jobs 1032, projects 884, clients 851, schedule 634, crm 419, rooms 411, pay 398,
  materials 383, dashboard 306, costs 225, webhook 111, pro-admin 110, langs 34.
- `node scripts/build.mjs --check`: 1157 kluczy × 10 języków — tyle samo, co przed sesją.

**PROBLEMY**

- **Defekt żył, bo napęd testowy zaprzeczał SDK.** Migawka zawsze twierdziła, że przyszła
  z serwera, więc gałąź `fromCache` nie była wykonana ani razu w 213 sprawdzeniach.
  Zaślepka, która jest łagodniejsza od tego, co udaje, chowa dokładnie te defekty, dla
  których się ją pisze. Naprawione dla tej jednej rzeczy; **`hasPendingWrites` zaślepka
  nadal zawsze zwraca `false`** — `/app/` tego pola nie czyta, ale następna sesja, która
  zechce coś zbudować na opóźnieniu zapisu, musi je najpierw domodelować.
- **Wybudzenie po powrocie łącza to nadal odpowiedź SDK, a nie własny ponowny zapis.**
  Kolejka offline Firestore wypycha zmiany sama i to się nie zmieniło; strona wyłącznie
  o tym mówi. Nic tu nie ponawia niczego ręcznie i nie powinno.
- **Nasłuch profilu (`users/{uid}`) nie liczy się do stanu łącza.** Świadomie: dwie
  kolekcje wystarczą, żeby powiedzieć, czy serwer odpowiada, a nasłuch profilu jest
  podpinany i odpinany w innych momentach niż tamte dwa. Gdyby kiedyś został jedynym
  nasłuchem na stronie, trzeba go dołożyć do `conn.synced`.
- **Nie ma w tym repozytorium jednej komendy uruchamiającej wszystkie 25 suit.** Problem
  zgłoszony przez Sesję 41 i nadal nienaprawiony — ta sesja przeszła listę z `CLAUDE.md`
  ręcznie. Osobne zadanie.

**STATUS**

Zrobione. `/app/` mówi „Brak sieci" wtedy i tylko wtedy, gdy sieci nie ma, zdejmuje
komunikat, gdy łącze wraca, nie depcze paska statusu, przeżywa zmianę języka i nie wyjmuje
kursora z pola, w którym ktoś pisze.

**NASTĘPNE ZADANIE**

**Sesja 43 — kalkulator na prawdziwym telefonie.**

### Co zrobiła Sesja 41 (plan naprawczy)

Zadanie: **sześć języków bez nazwy — `undefined` w wybieraku.**

**WYKONANO**

**1. Defekt: jedna lista w dwóch kopiach, a rysowała ta krótsza.** Nazwa języka stała
w dwóch miejscach — `LANGS` w `assets/i18n.js` (dziesięć nazw, poprawne od dnia, w którym
sześć języków wróciło) i `LANG_NAME` w `src/flags.mjs`, wypisane ręcznie i mające
**cztery**. Generator czyta tę drugą i wpisuje ją prosto w markup, więc od 2026-08-19 każda
wygenerowana strona pisała obok sześciu flag słowo **`undefined`**: raz w menu w nagłówku,
drugi raz w rzędzie języków w stopce, a na stronach tych sześciu języków jeszcze trzeci raz
— na **przycisku wybieraka**, czyli w nazwie języka, który czytelnik ma właśnie przed sobą.

Zmierzone na tym, co było wysłane: **4662 wystąpienia na 370 z 375 stron** (12 na stronę,
13 w sześciu językach), w tym **222 strony**, na których „undefined" stało na samym
przycisku (37 stron logicznych × 6 języków). Pięć stron bez wystąpień to `404.html`,
`privacy-policy.html` i trzy bezjęzykowe (`/app/`, `/app/dashboard/`, `/p/`).

**Połowa przeglądarkowa była poprawna przez cały ten czas.** `/app/`, `/app/dashboard/`
i `/p/` rysują wybierak w locie z pakietu `assets/i18n.<lang>.js`, a ten powstaje
z `assets/i18n.js` — więc miał wszystkie dziesięć nazw. Wybierak na stronie i wybierak
w przeglądarce mówiły co innego, i to jest cała diagnoza: nie brakujące tłumaczenie,
tylko druga kopia listy.

**Dlaczego nic tego nie zauważyło przez tydzień.** `undefined` jest w JavaScripcie
poprawnym łańcuchem, więc nic nie rzuciło wyjątkiem. Żaden klucz nie brakował
(`build.mjs --check` liczy klucze słownika, a nazwa języka nie jest kluczem słownika),
każdy adres się rozwiązywał, `hreflang`, `canonical` i `sitemap.xml` zgadzały się co do
jednego wpisu, a wszystkie 23 suity przechodziły — bo żadna nie czytała **napisu** obok
flagi. Sesje 30 (SEO), 32 (mobile), 33 (perf) i 34 (a11y) obeszły ten wybierak wzdłuż
i wszerz: sprawdziły, czy działa, czy się mieści, czy ma nazwę dostępną i czy da się go
otworzyć klawiaturą. Żadna nie sprawdziła, co jest w nim napisane.

**2. Naprawa: jedna lista.** `LANG_NAME` w `src/flags.mjs` **czyta** teraz `LANGS`
z `assets/i18n.js` — tym samym sposobem, którym `scripts/build.mjs` czyta każdy skrypt
przeglądarki, z którego potrzebuje wartości. Ręcznie wypisana czwórka usunięta. Przy okazji
zniknęła druga połowa tej samej niezgodności: `LANG_META` (to, co trafia do pakietów) było
liczone z `assets/i18n.js` **z awaryjnym powrotem do `LANG_NAME`**, więc dwa wybieraki
powstawały z dwóch list i tylko jedna z nich miała dziesięć pozycji. Teraz obie biorą się
z `LANG_NAME`, a `LANG_NAME` z jednego miejsca.

**3. Build przerywa się na języku bez nazwy.** `validate()` w `scripts/build.mjs` dokłada
jedno sprawdzenie i mówi, gdzie brakuje wpisu. Sprawdzone przez wyjęcie etykiety `cs`:

```
Build aborted — the dictionaries or the site map are inconsistent:

  - language "cs" has no name — add it to LANGS in assets/i18n.js
```

To jest ta sama zasada, którą Sesja 21 zapisała przy `lmGate()`: literówka ma zamykać
drzwi, a nie wypisywać na stronie „undefined".

**4. `scripts/test-langs.mjs` — 34 sprawdzenia, których nikt nie miał.** Czyta wysłane
strony z powrotem: przycisk wybieraka nazywa język, w którym jest strona; menu w nagłówku
wymienia dziesięć nazw w kolejności; stopka wymienia te same dziesięć; każdy link niesie
`hreflang` języka, który nazywa. Do tego siatka bezpieczeństwa na sam defekt — **żadna
wysłana strona nie zawiera słowa „undefined" tam, gdzie ktoś może je przeczytać** — oraz
druga strona medalu: dziesięć pakietów `assets/i18n.<lang>.js` musi nieść tę samą dziesiątkę
z tymi samymi nazwami, a trzy strony bez własnego języka mają wysyłać **pusty** pojemnik
wybieraka, bo połowicznie wypisany nazwałby wszystkim `DEFAULT_LANG`.

§2 zapisuje ustalenie właściciela z 2026-08-21: **nazwa języka, nigdy nazwa kraju**
(lista dwudziestu czterech nazw krajów, żadna nie może być etykietą), każda nazwa **we
własnym języku** („Română", nie „rumuński"), żadne dwie takie same, a ukraińska i rosyjska
zapisane cyrylicą. §5 pilnuje rozdziału V planu: flaga to prawdziwy SVG, nigdy emoji.

**5. Naprawiona zaschnięta asercja po Sesji 40.** `scripts/test-account-page.mjs` §15
wymagał nagłówka `Kalkulatory, Materiały, Projekty, Poradniki, Aplikacja` — kolejności,
którą Sesja 40 zmieniła na polecenie właściciela. Ta suita nie stoi w jej raporcie, więc
zmiana wjechała z czterema czerwonymi sprawdzeniami. Poprawione tutaj, bo to jedna
z suit, którymi ta sesja sprawdzała samą siebie, a czerwona suita odziedziczona przez
Sesję 42 to defekt nie do odróżnienia od nowego. **Cztery łańcuchy w teście, zero zmian
w kodzie serwisu.**

**ZMIENIONE PLIKI**

Dodane:
- `scripts/test-langs.mjs` — dziesięć języków i to, jak je nazywa każdy wybierak.

Zmienione:
- `src/flags.mjs` — `LANG_NAME` czyta `LANGS` z `assets/i18n.js` zamiast powtarzać cztery
  pozycje.
- `scripts/build.mjs` — `LANG_META` z jednego źródła (bez awaryjnego powrotu), plus
  sprawdzenie w `validate()`.
- `assets/i18n.js` — wyłącznie komentarz nagłówkowy: mówił, że sześciu języków „serwis nie
  ma", nieprawda od 2026-08-19, i nie mówił, że ta lista jest jedynym miejscem, z którego
  bierze się nazwa języka.
- `scripts/test-account-page.mjs` — §15, cztery zaschnięte łańcuchy po Sesji 40.
- 370 wygenerowanych stron: **jedyna zmiana to nazwy sześciu języków** w menu, w stopce
  i na przycisku. `sitemap.xml` bez zmian — Sesja 40 przesunęła `lastmod` na 2026-08-26
  na każdej stronie i dziś jest ten sam dzień.
- `docs/ARCHITEKTURA.md` §7.8a, `CLAUDE.md`, ten plik.

**`STAMP` NIE podbity** i to jest celowe: żaden zasób wysyłany do przeglądarki się nie
zmienił. `assets/i18n.js` jest **wejściem builda** — nie linkuje go żadna strona, do
przeglądarki jedzie `assets/i18n.<lang>.js`, a te dziesięć plików wyszło co do bajtu takie
samo, bo miały poprawne nazwy od początku. Zmieniła się wyłącznie markup, tak samo jak
w Sesji 40.

**TESTY**

- `scripts/test-langs.mjs`: **34/34** (nowe). Uruchomione na stanie sprzed naprawy dały
  4 błędy, każdy nazywający dokładnie ten defekt — 370 stron z „undefined", 222 przyciski.
- `scripts/test-account-page.mjs`: **213/213** (przed sesją: 209/213).
- Chromium, reszta bez zmian: `test-pages` 759/759, `test-mobile` 1152/1152,
  `test-a11y-page` 55/55, `test-propage-page` 148/148, `test-qa` 675/675,
  `test-projects-page` 177/177, `test-dashboard-page` 90/90, `test-save-page` 70/70,
  `test-materials-page` 166/166, `test-rooms-page` 195/195, `test-costs-page` 134/134,
  `test-clients-page` 145/145, `test-jobs-page` 164/164, `test-quotes-page` 188/188,
  `test-crm-page` 141/141, `test-calendar-page` 162/162.
- Bez zależności, wszystkie przechodzą: seo 36869, perf 13157, security **9072** (było
  9065: skaner kluczy prywatnych czyta o jeden plik więcej — nowy test — razy siedem
  wzorców), calc-seo 5133, calculators 2113, save 1280, plan 1114, quotes 1096, jobs 1032,
  projects 884, clients 851, schedule 634, crm 419, rooms 411, pay 398, materials 383,
  dashboard 306, costs 225, account 148, webhook 111, pro-admin 110, a11y 59, propage 1083.
- `node scripts/build.mjs --check`: 1157 kluczy × 10 języków — tyle samo, co przed sesją.

**PROBLEMY**

- **Ten defekt żył tydzień, bo żadna suita nie czytała napisów w nawigacji.** `test-langs`
  zamyka wybierak języka. Wybierak **waluty**, przełącznik motywu i etykiety w nagłówku są
  sprawdzane pod kątem tego, czy działają i czy się mieszczą — nie pod kątem tego, co jest
  w nich napisane. Nie ruszone: jedno zadanie, jedna sesja.
- **Nazwy języków nie były tłumaczone i nie powinny być.** „Polski" stoi tak samo na
  stronie niemieckiej i na rosyjskiej — celowo, bo wybierak czyta ktoś, kto nie rozumie
  języka bieżącej strony. To nie jest brakujące tłumaczenie i Sesje 44–45 („stop slop")
  nie powinny go dopisywać.
- **Sesja 40 wysłała czerwoną suitę i nie zauważyła.** `test-account-page.mjs` nie stoi
  w jej liście testów. Nie ma w tym repozytorium jednej komendy, która uruchamia wszystkie
  25 suit, więc każda sesja wybiera z listy w `CLAUDE.md` i pomija to, o czym nie pomyśli.
  Naprawione tutaj tylko to jedno zaschnięte sprawdzenie; runner zbiorczy to osobne zadanie
  i **nie jest zrobiony**.

**STATUS**

Zrobione. Sześć języków ma nazwy na wszystkich 370 stronach, lista jest jedna, build
przerywa się na języku bez nazwy, a test czyta wysłane strony z powrotem.

**NASTĘPNE ZADANIE**

**Sesja 42 — `/app/`: fałszywe „Brak sieci".**

### Co zrobiła Sesja 40 (plan naprawczy)

Zadanie: **„LiczMat Pro" w nagłówku; Poradniki schodzą do stopki.** Ustalenie właściciela
z 2026-08-21: „w nagłówku ustępują **Poradniki**". Pytanie było otwarte od Sesji 7 — stoi
w „Otwartych decyzjach" pod nagłówkiem „Miejsce dla »LiczMat Pro« w menu" i mówi wprost, że
gdy powstanie `/liczmat-pro/`, coś z menu będzie musiało ustąpić.

**WYKONANO**

**1. Jedna zamiana w architekturze, i nic poza nią.** `src/ia.mjs`: trasa `guides` traci
pole `header`, trasa `liczmat-pro` dostaje `header: { order: 4, key: "pro_t" }`. Menu i obie
kolumny stopki powstają z tej jednej listy, więc 373 strony przestawiły się z przebudowy —
po jednej linijce na stronę, dokładnie tej:

```
-        <li><a href="/poradniki/">Poradniki</a></li>
+        <li><a href="/liczmat-pro/">LiczMat Pro</a></li>
```

Rząd ma nadal pięć linków: Kalkulatory · Materiały · Projekty · LiczMat Pro · Aplikacja.
`validateIA()` dalej odrzuca szósty.

**2. Poradniki nigdzie nie zniknęły — i test mówi to na głos.** Trasa jest nadal `LIVE`,
nadal `indexable`, nadal w `sitemap.xml`, nadal z `canonical` i `hreflang` w dziesięciu
językach, nadal w kolumnie „Produkt" w stopce (pozycja 5, klucz `foot_guides`, bez zmian —
stopka nie wymagała **żadnej** edycji, bo poradniki były w niej od początku) i nadal
linkowana ze strony głównej oraz ze stron kalkulatorów. Nowe sprawdzenie w
`scripts/test-projects.mjs` §12 sprawdza obie połówki, nie samą pierwszą: link, który
wypadłby z nagłówka **i** ze stopki naraz, przeszedłby asercję liczącą wyłącznie nagłówek.

**3. To jest pomiar, a nie zmiana nazwy — i tu jest sedno tej sesji.** Rząd, który mieści
pięć krótkich słów, nie musi zmieścić pięciu dłuższych, a „LiczMat Pro" jest dłuższe od
„Poradniki" w ośmiu językach na dziesięć. Sesja 5 postawiła sufit na czterech linkach
mierząc; Sesja 20 podniosła go do pięciu mierząc; Sesja 32 przesunęła próg szuflady
z 900px na 1061px, bo zmierzyła rosyjski rząd (1033px) wypychający przełącznik motywu poza
ekran. Ta sesja przebiegła ten sam test przy tych samych czterech szerokościach
(1061 / 1100 / 1160 / 1280 px) w tych samych dziesięciu językach, dla gościa i dla
zalogowanego. Do tego osobny pomiar szerokości `.nav-list` przy 1061px, konto zalogowane
(pięć widocznych linków), z etykietą podmienioną w miejscu na starą i z powrotem, żeby obie
liczby padły w tej samej przeglądarce i przy tym samym foncie:

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

**Najszerszy rząd na serwisie jest rosyjski i to on ustawił próg 1061px — i akurat on się
zwęził**, bo „Руководства" jest dłuższe niż „LiczMat Pro". Chorwacki urósł najbardziej
(+37px) i nadal jest o 80px węższy od rosyjskiego. Nic nie zrobiło się ciaśniejsze niż to,
co już zostało zmierzone, więc próg szuflady zostaje tam, gdzie był.

**4. Zero nowych słów w słowniku.** Etykieta w nagłówku to klucz `pro_t` — ten sam, którego
używa link w stopce, i ten sam ciąg „LiczMat Pro" we wszystkich dziesięciu językach, bo to
nazwa własna. `node scripts/build.mjs --check` liczy tyle samo kluczy, co przed sesją:
1157 × 10.

**5. `navLevel` nie doszedł i dojść nie może.** Link w nagłówku jest pokazywany wszystkim.
Strona sprzedażowa oglądana wyłącznie przez konta, które już są na Pro, to strona pokazana
tym, którym nie jest już potrzebna — ta sama zasada, która trzyma `/liczmat-pro/` przed
ścianą płatności, a nie za nią. Sprawdzone w `scripts/test-propage.mjs` §1.

**6. Dlaczego to w ogóle jest sesją, a nie kosmetyką.** `/liczmat-pro/` jest jedyną stroną,
którą trzeba **znaleźć, zanim** ktokolwiek zapłaci — a dojść do niej dało się dotąd tylko ze
stopki albo ze ściany, na którą ktoś już wpadł. Ściana jest odpowiedzią dla kogoś, kto
próbował wejść do modułu; nagłówek jest zaproszeniem dla kogoś, kto jeszcze nie próbował.
Rozdział X planu chce trzech kierunków ze strony głównej: Kalkulatory, LiczMat i LiczMat
Pro — dwa z nich były w menu, trzeci nie.

**ZMIENIONE PLIKI**

- `src/ia.mjs` — `header` zdjęty z `guides`, dopisany do `liczmat-pro`; noty obu tras
  i komentarz przy limicie pięciu linków w `validateIA()`.
- `scripts/build.mjs` — komentarz przy `LM_NAV` (linia o `/liczmat-pro/` mówiła, że nie
  jest to link w nagłówku; jest, a wpis zostaje, bo potrzebują go zakładka Pro i karta
  poziomu na `/app/`). Kodu nie ruszono, `STAMP` **nie** podbity — żaden zasób się nie
  zmienił, zmieniła się wyłącznie markup.
- `scripts/test-projects.mjs` — §12: kolejność linków w nagłówku, plus nowe sprawdzenia,
  że poradniki są poza nagłówkiem **i** nadal w stopce.
- `scripts/test-propage.mjs` — §1: strona jest teraz w nagłówku, w pozycji 4, pod kluczem
  `pro_t`, a rząd nadal ma pięć linków i nie ma wśród nich poradników.
- 373 wygenerowane strony + `sitemap.xml` (`lastmod` przesunięty na 2026-08-26 na każdej
  stronie, bo nagłówek zmienił się na każdej — to jest zmiana treści, nie przebudowa).
- `docs/ARCHITEKTURA.md` §5 i §7.5, `CLAUDE.md`, ten plik.

**TESTY**

- `scripts/test-pages.mjs` (Chromium): **759/759** — w tym §7, czyli rząd nagłówka
  w dziesięciu językach × 4 szerokości × gość/zalogowany.
- `scripts/test-projects.mjs`: **884/884** (było 878).
- `scripts/test-propage.mjs`: **1083/1083** (było 1079).
- Chromium poza tym: `test-mobile` 1152/1152 (szuflada i cele dotykowe na sześciu
  szerokościach), `test-a11y-page` 55/55, `test-propage-page` 148/148, `test-qa` 675/675.
- Pozostałe zestawy bez zależności, wszystkie przechodzą: seo 36869, perf 13157, security
  9065, calc-seo 5133, calculators 2113, save 1280, plan 1114, quotes 1096, jobs 1032,
  clients 851, schedule 634, crm 419, rooms 411, pay 398, materials 383, dashboard 306,
  costs 225, account 148, webhook 111, pro-admin 110, a11y 59.
- `node scripts/build.mjs --check`: 1157 kluczy × 10 języków — tyle samo, co przed sesją.

**PROBLEMY**

- **Nic nie kieruje na `/liczmat-pro/` ze strony pojedynczego kalkulatora.** Nagłówek
  owszem, ale zdanie pod wynikiem nadal wybiera tylko między „załóż darmowe konto"
  a „Twoje konto to zsynchronizuje" (rozdział XII). To nie jest defekt tej sesji i nie
  zostało ruszone — jedno zadanie, jedna sesja.
- **Menu jest pełne.** Piąty link był mierzony, szósty nie i build go odrzuca. Kolejna
  strona, która „powinna być w menu", wymaga albo pomiaru szóstego, albo oddania miejsca
  przez którąś z pięciu. Zapisane tutaj, żeby następna sesja nie odkrywała tego przy okazji.
- **`docs/ARCHITEKTURA.md` §5 mówiło „Cztery linki to maksimum"** od Sesji 5 — nieprawda od
  Sesji 20, która dołożyła piąty. Poprawione przy okazji, bo ta sesja i tak przepisywała
  ten akapit.

**STATUS**

Zrobione. Sprzedaż nadal czeka na właściciela (`docs/STRIPE.md`) — ta sesja niczego w tym
nie zmieniła i zmienić nie miała; zmieniła to, że stronę, która o sprzedaży opowiada, widać
z każdej z 373 stron serwisu.

**NASTĘPNE ZADANIE**

**Sesja 41 — sześć języków bez nazwy (`undefined` w wybieraku).**

### Co zrobiła Sesja 39 (plan naprawczy)

Zadanie: **Stripe — sprzedaż włączona.**

**Czego ta sesja nie mogła zrobić i dlaczego to nie jest wymówka.** Sesja 39 w całości
polega na czynnościach po stronie właściciela: konto Stripe, dwa produkty, Payment Linki,
sekret webhooka, `firebase deploy` i **jedna prawdziwa płatność**. Konta Stripe nadal nie
ma (ustalenie właściciela z 2026-08-21), a klucza wdrożeniowego nie ma i nie powinno być
w tym repozytorium. Sesja zrobiła więc drugą połowę: **doprowadziła repozytorium do stanu,
w którym wklejenie trzech adresów jest jedyną zmianą, jaką trzeba zrobić** — i naprawiła
to, co by w tym przeszkodziło.

**WYKONANO**

**1. Lista, według której właściciel będzie pracował, wysyłała go po zły serwer.** Nota
ORDER na dole `assets/pay.js` — sześć kroków, jedyna instrukcja w kodzie — w kroku 3 kazała
zainstalować rozszerzenie „Run Payments with Stripe". Sesja 38 świadomie **odrzuciła** to
rozszerzenie i napisała własną funkcję (`functions/`), ale noty nie poprawiła. Kroki 3 i 4
są teraz tym, co naprawdę trzeba zrobić: sekret, wdrożenie, webhook i **dokładnie cztery
zdarzenia**, które `functions/stripe-map.mjs` obsługuje. To samo zdanie stało w
`docs/ARCHITEKTURA.md` §7.7 i też zostało poprawione.

**2. `docs/STRIPE.md` — te same sześć kroków, ale z każdym polem do wypełnienia.** Nota
w kodzie jest listą; to jest instrukcja: co kliknąć, co skopiować, czego się spodziewać
w logu endpointu (200 / 400 / 503 i co każde znaczy) i co dokładnie sprawdzić po
płatności — z osobnym krokiem 0, bo **tryb testowy i żywy mają osobne sekrety webhooka**,
a funkcja czyta jeden, więc cały przebieg robi się dwa razy i drugi kończy się ponownym
`firebase deploy`.

**3. Waluta kasy bierze się z adresu IP kupującego, nie z wybieraka na stronie — i Payment
Link nie da się przekonać inaczej.** To jest ustalenie tej sesji, sprawdzone w dokumentacji
Stripe'a, i dotyczy rozdziału VI planu. Adaptive Pricing (automatyczne przeliczanie po
kursie Stripe'a z prowizją 2–4% doliczaną kupującemu) jest **zawsze włączone dla Payment
Linków i nie ma tam przełącznika**. Przebija je wyłącznie **kwota wpisana ręcznie w danej
walucie** (`currency_options`) — dlatego czternaście kwot musi stanąć jako ceny
wielowalutowe na dwóch produktach, a nie jako czternaście osobnych cen. Skutek, który
zostaje mimo to: ktoś w Polsce, kto ustawił na stronie EUR, przeczyta 9,99 € na stronie
i zobaczy 39,99 zł u Stripe'a. To wciąż jedna z czternastu kwot wpisanych ręcznie i **nic
nie jest przeliczane kursem**, ale nie jest to liczba, którą pokazała strona. Kraj spoza
siódemki walut (Węgry) dostanie kwotę przeliczoną z prowizją. Trzy wyjścia — jedno zdanie
na `/app/`, czternaście linków, albo zostawić — stoją w `docs/STRIPE.md` i **są decyzją
właściciela**, nie tej sesji.

**4. Testy przestały traktować włączenie sprzedaży jak awarię.** `scripts/test-pay.mjs` §3
i `scripts/test-propage.mjs` sprawdzały stan, w którym serwis jedzie („linki są puste"), a
nie regułę. Wklejenie trzech adresów — czyli dokładnie to, po co jest ta sesja — zapaliłoby
suite na czerwono w momencie, w którym miał zaświecić na zielono. Oba czytają teraz stan
pliku i sprawdzają, co ma się zgadzać **w tym** stanie:

- zamknięty: cena jest, kupić się nie da, portalu nie ma, strona mówi to wprost;
- otwarty: **wszystko albo nic** — oba plany kupowalne we wszystkich siedmiu walutach,
  portal do anulowania obecny, adresy na hoście Stripe'a i **żaden link testowy**
  (`/test_` w ścieżce: nie pobiera niczego, a jego zdarzenia są podpisane sekretem
  drugiego trybu, więc żywa funkcja odpowiada im 400).

Markup się przy tym nie zmienia w żadną stronę: `proPlansBlock()` pisze i wiersz z ceną,
i zdanie „subskrypcji jeszcze nie da się wykupić", a `assets/paywall.js` pokazuje jedno
z nich. Doszło też §3b, które wiąże trzy pliki: nota ORDER, `docs/STRIPE.md`
i `functions/stripe-map.mjs` muszą wymieniać **te same cztery zdarzenia**, a tabela cen
w instrukcji jest wyliczana z `LM_PAY` — czternaście kwot wpisywanych ręcznie do Stripe'a
nie może mieć w repozytorium dwóch niezgodnych kopii.

**ZMIENIONE PLIKI**

Dodane:
- `docs/STRIPE.md` — instrukcja uruchomienia sprzedaży, dla właściciela.

Zmienione:
- `assets/pay.js` — nota ORDER: kroki 3 i 4 (własna funkcja, sekret, wdrożenie, webhook
  i cztery zdarzenia) plus wskazanie na `docs/STRIPE.md`.
- `scripts/test-pay.mjs` — §3 czyta stan zamiast go zakładać, §3b nowe; `loadPay()`
  przyjmuje `link: ""` (do tej pory pusty łańcuch nie nadpisywał niczego).
- `scripts/test-propage.mjs` — dwa sprawdzenia stanu zamienione na regułę, która trzyma
  się w obu stanach.
- `docs/ARCHITEKTURA.md` §7.7 — zdanie o kolejności.
- `CLAUDE.md` — `docs/STRIPE.md` w spisie plików, poprawiony punkt o nocie ORDER i dwa
  nowe: o testach, które nie mogą uznać sprzedaży za regres, i o walucie kasy.
- `docs/MASTER_PLAN.md` — ten wpis i wiersz w tabeli.
- `STAMP` → `20260821b`, 373 strony przebudowane (**diff stron to wyłącznie `?v=`**),
  `?v=` w `404.html` i `privacy-policy.html` podbity ręcznie. Zmienił się jeden bajt
  wysyłany do przeglądarki — komentarz w `assets/pay.js` — więc stempel idzie w górę.

**TESTY**

- `scripts/test-pay.mjs`: **398/398** (było 369).
- `scripts/test-propage.mjs`: **1079/1079**.
- Pozostałe 21 zestawów bez zależności: bez zmian, wszystkie przechodzą — m.in. seo 36869,
  perf 13157, security 9065, calculators 2113, plan 1114, webhook 111, pro-admin 110.
- `node scripts/build.mjs --check`: 1157 kluczy × 10 języków.
- Sprawdzone **negatywnie**, bo nowe sprawdzenia dotyczą stanu, którego serwis jeszcze nie
  ma: `assets/pay.js` ustawiony kolejno na stan **półotwarty** (jeden link, bez portalu),
  **testowy** (dwa linki `test_`) i **w pełni otwarty** (dwa linki i portal). Pierwszy
  i drugi przewracają suite dokładnie tam, gdzie powinny; trzeci przechodzi w komplecie —
  412/412 w `test-pay` i 1079/1079 w `test-propage` — czyli dzień, w którym właściciel
  wklei adresy, kończy się zielonym zestawem.

**PROBLEMY**

- **Sprzedaży nadal nie ma i ta sesja jej nie włączyła.** Konta Stripe nie ma, funkcja
  z Sesji 38 nie jest wdrożona, `lmPayBuyable()` jest `false`. Wszystko, co zostało,
  wymaga rąk właściciela i jest rozpisane w `docs/STRIPE.md`.
- **Waluta prezentowana przy kasie** — opisana wyżej, czeka na decyzję właściciela.
- **VAT.** Nic w tym repozytorium nie liczy podatku i `assets/pay.js` nie ma na niego pola.
  Czy ceny są brutto, czy netto, i czy włączyć Stripe Tax, trzeba rozstrzygnąć **przed**
  pierwszą prawdziwą płatnością, bo zmiana po fakcie dotyka wystawionych faktur.
- Nie zmieniono niczego w `functions/` — kod z Sesji 38 jest kompletny, a wdrożenie to
  krok 3 instrukcji, nie edycja.

**STATUS**

Repozytorium gotowe. Sesja 39 zamknięta po stronie kodu; **sprzedaż włączy właściciel**,
wykonując `docs/STRIPE.md` i wklejając trzy adresy w `LM_PAY`.

**NASTĘPNE ZADANIE**

**Sesja 40 — „LiczMat Pro" w nagłówku (Poradniki → stopka).**

### Co zrobiła Sesja 38 (plan naprawczy)

Zadanie: **serwer, który po zapłacie wpisuje plan.** Krok 4 z noty ORDER na dole
`assets/pay.js` — jedyny brakujący element sprzedaży.

**WYKONANO**

**Własna funkcja, nie rozszerzenie.** „Run Payments with Stripe" jest zbudowane wokół sesji
Checkout tworzonych z Firestore przez zalogowaną przeglądarkę. `assets/pay.js` jest
zbudowany wokół **Payment Linków** z `client_reference_id`, bo strona jest statyczna, nie
ma serwera i to jedyny sposób, w jaki potrafi powiedzieć, czyje to konto. Zaginanie
rozszerzenia do tego modelu byłoby dłuższe niż ta funkcja i dokładałoby trzy kolekcje,
których kontrakt synchronizacji nie zna.

**Podział na dwa pliki, i to jest sedno tej sesji.** `functions/stripe-map.mjs` **niczego
nie importuje**: dostaje zdarzenie, oddaje decyzję. `functions/index.js` tę decyzję
wykonuje. Dzięki temu `node scripts/test-webhook-map.mjs` sprawdza całą logikę **bez
chmury, bez `npm install`, bez wdrożenia i bez konta Stripe** — 111 sprawdzeń. Pomyłka
w mapowaniu statusu na plan to albo ktoś płacący bez dostępu, albo dostęp bez płacenia;
jedno i drugie ma być sprawdzalne, zanim cokolwiek pojedzie do chmury.

**Zapłata przychodzi w dwóch połówkach i żadne zdarzenie nie niesie obu.** Uid jest tylko
w `checkout.session.completed`; status i daty tylko w `customer.subscription.*`. Więc
pierwsze zdarzenie zapisuje `stripeCustomers/{customerId} = { uid }`, a drugie ustawia plan,
czytając to powiązanie. **Stripe nie obiecuje kolejności**, więc zdarzenie subskrypcji,
które wyprzedziło sesję, dostaje **503** i jest ponawiane przez kilka dni. Zapłata, której
nie umiemy jeszcze przypisać, ma poczekać — nie zniknąć. Ta, której nie da się przypisać
**nigdy** (`client_reference_id` nie wskazujący na konto i brak adresu), dostaje 200 i ląduje
w logu jako błąd, bo ponawianie nie sprawi, że konto powstanie; właściciel nadaje ją wtedy
ręcznie narzędziem z Sesji 37.

**Anulowanie nie odbiera Pro od razu.** `cancel_at_period_end` przestawia `planRenews` na
`false` i zostawia `planValidUntil` tam, gdzie było — moduły zostają otwarte do końca
opłaconego okresu, a `lmPlanStatus()` zamyka je sam. `past_due` też zostawia plan i nie
obiecuje odnowienia: opłacony okres trwa, nie udało się pobrać dopiero **następnej** raty,
a Stripe ponawia przez kilka dni. Odebranie dostępu przy pierwszym odrzuceniu karty
zabrałoby go komuś, kto zapłacił.

**Jeden sekret, i funkcja nigdy nie dzwoni do Stripe'a.** `STRIPE_WEBHOOK_SECRET` w Secret
Managerze. Klucza API Stripe'a tu nie ma i nie ma `stripe` w zależnościach: funkcja czyta
wyłącznie to, co Stripe sam przysłał i podpisał. Podpis liczony z **surowego** ciała —
`JSON.parse` i z powrotem daje inne bajty i podpis, który się nie zgadza; to najczęstszy
sposób, w jaki taki webhook się psuje. Okno pięciu minut, więc przechwycone żądanie nie
przejdzie miesiąc później. Porównanie podpisów w stałym czasie.

**`client_reference_id` jest sprawdzany, nie brany na wiarę.** Przychodzi z adresu URL, więc
funkcja szuka tego uida w Firebase Auth, zanim cokolwiek zapisze. Plan zapisany pod
wymyślonym uidem zrobiłby dokument profilu dla konta, którego nie ma.

**ZMIENIONE PLIKI**

Dodane:
- `functions/stripe-map.mjs` — czysta połowa: podpis, mapowanie, zapis.
- `functions/index.js` — cienka połowa: sprawdź, zdecyduj, zapisz.
- `functions/package.json` — dwie zależności (firebase-admin, firebase-functions), Node 22.
- `firebase.json`, `.firebaserc` — konfiguracja wdrożenia.
- `scripts/test-webhook-map.mjs` — 111 sprawdzeń bez zależności.

Zmienione:
- `.github/workflows/pages.yml` — `functions`, `firebase.json` i `.firebaserc` dopisane do
  `rm -rf`. **Korzeń repozytorium jest korzeniem serwisu**: katalog, którego się nie skasuje,
  leży pod publicznym adresem.
- `.gitignore` — `functions/node_modules/`.
- `scripts/test-security.mjs` §12 — wzorzec sekretu Stripe'a wymaga teraz prawdziwej
  długości (`whsec_` + 24 znaki). Sam przedrostek to słowo, które to repozytorium musi umieć
  zapisać: test webhooka sprawdza, że wdrażana funkcja go **nie** niesie.
- `CLAUDE.md` — katalog `functions/`, trzy pliki i nowy test w spisie; pięć punktów o tym,
  jak działa webhook.
- `docs/MASTER_PLAN.md` — ten wpis, wiersz w tabeli i **nowa Sesja 49** (panel admina).

**Nic w serwisie się nie zmieniło.** Żadna z 373 stron, żaden plik w `assets/`. Przebudowa
po sesji: `git diff` na stronach pusty, `STAMP` nietknięty — nie ma czego unieważniać
w cache'u, skoro przeglądarka nie dostaje ani jednego bajtu więcej.

**TESTY**

- Nowy `scripts/test-webhook-map.mjs`: **111/111**.
- `scripts/test-security.mjs`: **9058/9058** (było 9023 — doszły sprawdzenia nowych plików).
- Pozostałe 21 zestawów bez zależności: bez zmian, wszystkie przechodzą.
- `node scripts/build.mjs --check`: 1157 kluczy × 10 języków.

**PROBLEMY**

- **Funkcja nie jest wdrożona.** Kod jest kompletny i sprawdzony, ale nikt go jeszcze nie
  wysłał do chmury — `firebase deploy --only functions` robi właściciel, na planie Blaze
  (który już ma: konsola pokazuje „Blaze | Free Trial, 54 dni, €263"). Do tego jeden sekret:
  `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`.
- **Sekretu jeszcze nie ma**, bo nie ma konta Stripe — powstaje w Sesji 39. Kolejność jest
  z noty ORDER i się nie zmienia: produkty → Payment Linki → wdrożenie tej funkcji →
  **jedna prawdziwa płatność** → dopiero potem trzy adresy w `assets/pay.js`.
- **`current_period_end` ma dwa domy.** Stripe trzymał je na subskrypcji, a od wersji API
  z 2025 roku na jej **pozycji**. `periodEndMs()` czyta oba, bo o tym, którą wersję dostanie
  konto właściciela, nie ma decydować przypadek.

**STATUS**

Sesja 38 zamknięta. Czeka na wdrożenie.

**NASTĘPNE ZADANIE**

**Sesja 39 — Stripe: sprzedaż włączona.** Konto Stripe od zera, dwa produkty z czternastoma
kwotami w siedmiu walutach, Payment Linki z `client_reference_id`, Customer Portal,
wdrożenie funkcji z tej sesji, jedna prawdziwa płatność testową kartą — i dopiero po niej
trzy adresy wklejone do `LM_PAY`.

### Co zrobiła Sesja 37 (plan naprawczy)

Zadanie: **nadawanie i odbieranie LiczMat Pro po adresie e-mail, i strona, która to widzi
bez ponownego logowania.**

**WYKONANO**

**1. `scripts/pro-admin.mjs` — pierwsza rzecz w tym repozytorium, która potrafi nadać
plan.** `users/{uid}.plan` jest polem serwerowym: wdrożone reguły pozwalają przeglądarce
zapisać w profilu wyłącznie `lastSeenAt` i `appVersion`, więc poziom PRO był policzalny,
przetestowany i **nieosiągalny dla kogokolwiek, łącznie z właścicielem**.

Właściciel prosił o klikanie w konsoli Firestore — „wchodzę, klikam e-mail, wybieram, czy
ma Pro". Konsola tego nie umie i nie z lenistwa: **dokument profilu nie niesie adresu
e-mail** (ma `createdAt`, `lastSeenAt`, `appVersion`), więc w konsoli widać listę
identyfikatorów i nie wiadomo, czyj jest który. Adres mieszka po drugiej stronie, w Firebase
Auth. Narzędzie łączy jedno z drugim i robi dokładnie to, o co chodziło:

    node scripts/pro-admin.mjs list                          # e-mail · uid · plan · do kiedy
    node scripts/pro-admin.mjs status polednia@gmail.com
    node scripts/pro-admin.mjs grant  polednia@gmail.com 12
    node scripts/pro-admin.mjs revoke polednia@gmail.com

Bez zależności — JWT RS256 podpisany `node:crypto`, wymieniony na token, potem Identity
Toolkit (konto po adresie) i Firestore REST (dokument). Klucz konta serwisowego czytany ze
ścieżki w `LM_SA_KEY`, nigdy z repozytorium.

**Zapis idzie przez `PATCH` z `updateMask.fieldPaths` wyliczającą trzy pola planu i tylko
je.** Bez maski to samo wywołanie **kasuje `createdAt` i `lastSeenAt`** — datę założenia
konta, której już nikt nie odtworzy. `revoke` opiera się na drugiej połowie tej samej
reguły: pole nazwane w masce i **nieobecne** w ciele żądania Firestore usuwa, więc konto
zostaje z samym `plan: "free"` i bez resztek po planie.

`planRenews` jest przy nadaniu ręcznym `false`, bo nic tego planu nie odnowi. Skrypt
odmawia też pracy, gdy klucz należy do innego projektu niż ten, z którym rozmawia strona
(`projectId` w `assets/firebase-config.js`) — pomyłka projektu to nadanie Pro w cudzej bazie,
operacja, która przechodzi bez błędu.

**2. `/app/` przestało czytać profil raz.** Do tej sesji poziom brał się z jednego `getDoc`
przy logowaniu, więc konto, któremu właśnie nadano plan, zostawało darmowe **do wylogowania
i zalogowania z powrotem**. To samo dotyczyłoby płatności: krok 5 z noty ORDER w
`assets/pay.js` — „zapłać raz i sprawdź, czy konto samo staje się Pro" — nie był
wykonalny. Teraz `listenProfile()` trzyma `onSnapshot` na `users/{uid}`, a `applyProfile()`
jest jednym miejscem, które z dokumentu wyprowadza poziom: `lmLevelOf()`, `lmWriteLevel()`
dla pozostałych 372 stron, pasek tożsamości (tylko gdy poziom naprawdę się ruszył), zakładka
Profil i karta planu. Reguły już pozwalają czytać własny profil, więc **nie było zmiany
reguł, kontraktu ani niczego w repo aplikacji**. Nasłuch tylko czyta.

Przy okazji znalezione i naprawione: odrzucone usunięcie konta przywracało dwa nasłuchy
kolekcji, więc trzeci — ten na profilu — zostałby martwy do końca wizyty.

**Czego świadomie NIE dopisano: zdania „plan nadany ręcznie".** Strona nie ma jak sprawdzić,
kto nadał plan, a `lmSubscription()` już dziś opisuje plan, który się nie odnawia, słowami
„Pro do <data>" (stan `cancelled`, copy z Sesji 28). To jest zdanie prawdziwe dla planu
nadanego ręcznie i dla anulowanej subskrypcji naraz, więc nowych słów w dziesięciu językach
nie potrzeba.

**ZMIENIONE PLIKI**

Dodane:
- `scripts/pro-admin.mjs` — narzędzie.
- `scripts/test-pro-admin.mjs` — 99 sprawdzeń bez zależności.

Zmienione:
- `assets/app.js` — `applyProfile()`, `listenProfile()`, nasłuch zamiast jednorazowego
  odczytu, trzeci nasłuch przywracany po odrzuconym usunięciu konta.
- `scripts/fake-firebase.mjs` — nasłuchy na pojedynczym dokumencie i `window.__fbPushDoc()`,
  którym test gra serwer nadający plan.
- `scripts/test-account-page.mjs` — sekcja **9c**: plan nadany przy otwartej karcie i
  zabrany z powrotem, bez przeładowania; liczba nasłuchów po odrzuconym usunięciu konta
  z czterech na sześć.
- `scripts/test-security.mjs` §8 — kotwice po zmianie w `app.js` plus nowe sprawdzenie, że
  nasłuch profilu **tylko czyta**.
- `CLAUDE.md` — oba skrypty w spisie i w liście poleceń; poprawione trzy punkty, które
  mówiły, że planu nie nadaje nic i że nie ma sposobu, żeby zobaczyć moduł Pro.
- `docs/MASTER_PLAN.md` — tabela planu naprawczego i ten wpis.
- `STAMP` → `20260821a`, 373 strony przebudowane, `?v=` w `404.html`
  i `privacy-policy.html` podbity ręcznie.

**TESTY**

- Nowy `scripts/test-pro-admin.mjs`: **99/99**.
- `scripts/test-account-page.mjs` w Chromium: **213/213** (było 204).
- `scripts/test-qa.mjs`: **675/675** — atrapa Firebase jest wspólna, więc zmiana w niej
  musiała przejść oba testy.
- `scripts/test-security.mjs`: **9023/9023**.
- Reszta zestawów bez zależności bez zmian: account 148, plan 1114, pay 369, seo 36869,
  perf 13157, dashboard 306, projects 878, save 1280, materials 383, costs 225, rooms 411.
- `node scripts/build.mjs --check`: 1157 kluczy × 10 języków.

**PROBLEMY**

- **Narzędzie nie zostało uruchomione na żywej bazie.** Nie ma tu klucza konta serwisowego
  i nie powinno być: dwa istniejące klucze czekają na rotację (patrz otwarte decyzje).
  Kształt żądań jest sprawdzony testem, ale pierwsze prawdziwe `grant` robi właściciel —
  i to jest zarazem sprawdzenie, czy `/app/` samo zapala Pro.
- Kolejność dla właściciela: nowy klucz w Cloud Console → `LM_SA_KEY=… node
  scripts/pro-admin.mjs status <swój e-mail>` → `grant` → otwarte `/app/` ma zmienić poziom
  bez przeładowania → `/klienci/` ma się otworzyć → `revoke` → ściana wraca.
- Bez zmian: nic nie **sprzedaje** Pro. `assets/pay.js` nadal nie ma Payment Linków, a
  `lmPayBuyable()` jest `false` — to jest Sesja 39.

**SPRAWDZONE NA ŻYWYM BACKENDZIE — 2026-08-21, przez właściciela**

Raport wyżej mówił, że narzędzia nie uruchomiono na niczym żywym. Zostało uruchomione
tego samego dnia i to jest wynik.

- **Nasłuch planu działa.** Plan wpisany ręcznie w konsoli Firestore, przy **otwartej**
  karcie `/app/`: plakietka zmieniła się na LICZMAT PRO bez przeładowania, `/klienci/`
  się otworzyło, a po skasowaniu pola `plan` ściana wróciła sama. To jest krok 5 z noty
  ORDER w `assets/pay.js` i warunek, bez którego płatność Stripe'em nie miałaby jak
  zapalić Pro.
- **Narzędzie działa w obie strony.** `status`, `list`, `revoke` i `grant 12` na koncie
  właściciela, przez klucz konta serwisowego z jego komputera.
- **Maska potwierdzona na prawdziwym dokumencie.** Po `revoke` i `grant`:
  `createdAt: 1786678497261` i `lastSeenAt` **nietknięte**, `plan`/`planValidUntil`/
  `planRenews` przestawione. Bez `updateMask` ten sam `PATCH` skasowałby datę założenia
  konta — to była jedyna rzecz w tym narzędziu, która mogła zniszczyć coś nieodwracalnie.

**Dwa błędy, które to wykryło, oba naprawione tego samego dnia:**

1. **Na Windowsie polecenie nie robiło nic i nie mówiło nic.** Straż uruchomieniowa
   porównywała `import.meta.url` ze sklejonym `"file://" + process.argv[1]`. Na Linuksie
   to prawda, na Windowsie `argv[1]` to `C:\Users\...`, a `import.meta.url` —
   `file:///C:/Users/...`, więc `main()` nie startowało, a proces kończył się z kodem 0
   bez jednego znaku na ekranie. Teraz adres buduje `pathToFileURL()`, a
   `test-pro-admin.mjs` §9 oblewa się o sklejoną postać.
2. **„1 kont w projekcie".** `accountsText()` odmienia liczebnik trzema formami, tak samo
   jak `unitLabel()` w `assets/units.js` — ten sam defekt, który Sesja 16 naprawiła na
   ekranie projektów.

**Posprzątane w konsolach przy okazji** (właściciel, ten sam dzień):

- `liczmat.com` i `www.liczmat.com` dopisane do **Firebase Auth → Authorized domains**
  (siedem wpisów, pięć starych nietkniętych). Odczytane z zewnątrz przez
  `identitytoolkit/v1/projects` i potwierdzone.
- **Cztery sieroty w `users`** skasowane — `anNltl…` z raportu Sesji 35 plus trzy, które
  wyszły dopiero teraz, gdy `list` pokazał, że w Auth są dwa konta, a dokumentów jest
  cztery. Jedna z nich (`0S8zS8…`) niosła podkolekcje `projects` i `rooms` po koncie,
  którego już nie ma. Uid skasowanego konta Firebase nigdy nie wraca, więc nikt by ich
  nie odczytał.
- **Konto testowe `probe-1786600678@example.com`** skasowane z Firebase Auth. Zostało po
  sprawdzaniu reguł w sierpniu.
- **Nazwa projektu Firebase i „Public-facing name"**: obie już `LiczMat`, więc mail resetu
  hasła nie mówi już o wycofanej marce. **App name** na ekranie zgody Google: `LiczMat`.
  Do tego domena `liczmat.com` i linki do strony i polityki prywatności na tym samym
  ekranie — wcześniej stała tam tylko martwa `materio-app.com`.

**Zostało do zrobienia poza repo:** rotacja dwóch starych kluczy konta serwisowego. Wymaga
uwagi, bo jeden z nich (`pracownik@`) służy do wysyłki aplikacji na Google Play —
najpierw nowy klucz i podmiana tam, dopiero potem kasowanie starego.

**Nieaktualne od dziś, do poprawienia w Sesji 48:** `CLAUDE.md` i raport Sesji 36 nadal
piszą, że `liczmat.com` nie ma na liście autoryzowanych domen. Ma.
→ **Zrobione w Sesji 48 (2026-08-27):** `CLAUDE.md` poprawiono już w Sesji 42 (razem
z pomiarem obu list), a raport Sesji 36 dostał dopisaną poprawkę pod listą punktów
nierozwiązanych.

**STATUS**

Sesja 37 zamknięta.

**NASTĘPNE ZADANIE**

**Sesja 38 — Stripe: webhook nadający plan.** Katalog `functions/` poza buildem strony,
jedna funkcja HTTP z weryfikacją podpisu Stripe'a, mapowanie subskrypcji na trzy pola
kontraktu, `functions/` dopisane do `rm -rf` w `.github/workflows/pages.yml`. Wdraża
właściciel, plan Blaze.

### Co zrobiła Sesja 36

Rozdział XXXII, Sesja 36 w całości: **„FINALNY QA. Pełna ścieżka: GOŚĆ → kalkulator →
wynik → rejestracja → LICZMAT → projekt → kalkulacja → materiały → koszty → LICZMAT PRO
→ klient → zlecenie → projekt → wycena → historia. Dodatkowo sprawdzić: polski,
ukraiński, niemiecki, angielski, PLN, EUR, USD, UAH, tryb ciemny, tryb jasny, mobile,
desktop. Naprawić wszystkie znalezione krytyczne problemy."**

**WYKONANO**

**`scripts/test-qa.mjs` — cała ścieżka przechodzona od początku do końca w prawdziwej
przeglądarce, pięć razy.** Sesje 13–35 napisały test do każdego modułu z osobna, ale
każdy z nich **podstawia** sklep w `localStorage` i otwiera jeden ekran. Tego, o co pyta
rozdział XXXVI, żaden z nich odpowiedzieć nie może: czy ścieżka trzyma się kupy, kiedy
nikt nic nie podstawia. Więc ten test startuje z **pustej przeglądarki** i po ustawieniu
języka, waluty i motywu **nie zapisuje już do storage ani razu** — każdy wiersz, który
później odczytuje, powstał z klikania w produkt. Piętnaście kroków rozdziału, po kolei:

- **GOŚĆ** — strona główna pustej przeglądarki. Nic nie deklaruje poziomu (`data-lm-level`
  nie ma wcale, bo gość to *brak* znacznika), przycisk konta bez kropki, link do projektów
  nieoferowany.
- **kalkulator** — znaleziony na `/kalkulatory/` i **kliknięty**, nie wpisany z ręki.
- **wynik** — 24 m², 50 za opakowanie, `[data-result]` to `role="status"`, a koszt jest
  w walucie, którą wybrał odwiedzający, nie w tej, którą sugeruje język.
- **rejestracja** — przez zdanie pod wynikiem. Link musi być
  `/app/?mode=signup&next=<ten kalkulator>` i musi otworzyć od razu formularz rejestracji.
- **LICZMAT** — konto założone, poziom `liczmat`, powrót na kalkulator, z którego się
  przyszło. Dopiero teraz nagłówek oferuje projekty (na telefonie — po otwarciu szuflady).
- **projekt** — założony ręcznie na `/projekty/`.
- **kalkulacja** — wynik zapisany **do tego** projektu z listy wyboru, ostemplowany
  walutą odwiedzającego.
- **materiały** — materiał wjechał na listę zakupową sam, z tego samego zapisu.
- **koszty** — cena wpisana w wierszu materiału, koszt, którego nikt nie liczył, dopisany
  ręcznie, trzy figury projektu policzone raz.
- **LICZMAT PRO** — najpierw **ściana**, bo tak dziś wygląda produkt dla darmowego konta:
  moduł schowany, szczebel „upgrade”, nigdzie linku do Stripe’a. Potem konto loguje się
  do backendu, który już mówi `plan: premium` — plan jest server-only i nic w tym repo go
  nie zapisuje, więc podstawienie **odpowiedzi serwera** to jedyny uczciwy sposób, żeby
  zobaczyć drugą stronę ściany.
- **klient** — dodany, projekt podpięty pod niego, a dokument projektu sprawdzony
  **co do zestawu pól** (siedem, żadnego `clientId`).
- **zlecenie** — z klientem, terminem i wartością; koszt czytany z projektu, a nie
  kopiowany na zlecenie; różnica policzona tylko dlatego, że obie połowy są w jednej walucie.
- **projekt** — otwarty **ze wstęgi łańcucha** na zleceniu, nie z adresu.
- **wycena** — robocizna 24 × 80, marża 10%, pięć figur porównanych z groszem: materiał
  i inne koszty pochodzą z projektu, robocizna z wyceny, marża liczy się od wszystkiego
  powyżej, suma to te cztery dodane raz.
- **historia** — na stronie klienta: jego zlecenie, jego wycena z tą samą sumą, i wiersze
  za każdy dokument, który ten spacer zapisał.

**Cztery przełączniki rozdziału rzucone w środku drogi, nie na pustej stronie.**
Język zmieniony przy **otwartej wycenie** (link musi przenieść `?id=`, suma nie może się
ruszyć, waluta nie może pójść za językiem); waluta zmieniona przy **wycenionym projekcie**
(zapisana kwota zachowuje swoją walutę, suma stoi, żadna wielkość fizyczna się nie rusza —
rozdział VI); motyw przełączony **przyciskiem**, nie podstawionym kluczem, i sprawdzony
po nawigacji; przycisk Wstecz w górę łańcucha. Na końcu **wylogowanie**: ściana wraca,
a liczenie zostaje — projekt, materiał i pieniądze są dokładnie tam, gdzie były
(rozdział II i FIRESTORE_SYNC §1.2), klienci nietknięci, a gościowi pokazuje się szczebel
„załóż konto”, nie „dokup plan”, bo nie ma konta, na którym plan mógłby usiąść.

**Pięć spacerów, nie sześćdziesiąt cztery.** Rozdział wymienia cztery osie — cztery
języki, cztery waluty, dwa motywy, dwie szerokości. Iloczyn to 64 przejścia i kilka godzin
na nic; pięć konfiguracji pokrywa **każdą wartość każdej osi**:
`pl/PLN/jasny/1280`, `uk/UAH/ciemny/390`, `de/EUR/ciemny/1280`, `en/USD/jasny/390`
— i piąta, `de/PLN/jasny/1280`, która **celowo łamie parowanie**: w pozostałych czterech
język i waluta się zgadzają, więc ekran czytający walutę z języka przeszedłby niezauważony.

**`scripts/fake-firebase.mjs` — atrapa SDK wyjęta do własnego pliku.** `/app/` to jedyny
ekran na tej ścieżce, którego nie da się dotknąć naprawdę: `assets/app.js` importuje SDK
z `gstatic.com`, a proxy kontenera zrywa to połączenie. Atrapa istniała już
w `scripts/test-account-page.mjs`; drugi jej egzemplarz w teście QA byłby drugą kopią
czegoś, co musi odpowiadać zachowaniu prawdziwego SDK — czyli kopią wolną od pierwszej
w dniu, w którym któraś zostanie poprawiona. Teraz jest jedna, importowana przez oba testy.
`scripts/test-account-page.mjs` po tej zmianie: **204/204**, bez zmiany treści.

**ZMIENIONE PLIKI**

Dodane:
- `scripts/test-qa.mjs` — finalny spacer QA (675 sprawdzeń, pięć konfiguracji).
- `scripts/fake-firebase.mjs` — atrapa Firebase, wspólna dla dwóch testów.

Zmienione:
- `scripts/test-account-page.mjs` — importuje atrapę zamiast trzymać własną kopię.
- `CLAUDE.md` — oba pliki w spisie i w liście poleceń.
- `docs/MASTER_PLAN.md` — ten wpis i wiersz w tabeli postępu.

Usunięte: nic.

**Nic w produkcie nie zostało zmienione.** Żaden plik w `assets/`, `src/` ani żadna
wygenerowana strona. Przebudowa po sesji: `git diff` pusty, 373 strony bez zmian, `STAMP`
nietknięty — nie ma czego unieważniać w cache’u, skoro nic serwowanego się nie ruszyło.

**TESTY**

Cały zestaw, nie tylko nowy plik.

- **Bez zależności (20 zestawów)**: calculators, account, dashboard, projects, save,
  materials, costs, rooms, plan, pay, jobs, quotes, calendar, crm, propage, seo, calc-seo,
  perf, a11y, security — wszystkie przechodzą. `node scripts/build.mjs --check`:
  1157 kluczy × 10 języków, 15 kalkulatorów, 8 poradników, 150 stron copy SEO.
- **`scripts/check-contrast.mjs`**: wszystkie pary przechodzą AA w obu motywach.
- **W Chromium (16 zestawów)**: pages 759, mobile 1152, a11y 55, projects 177,
  dashboard 90, save 70, materials 166, costs 134, rooms 195, clients 145, jobs 164,
  quotes 188, calendar 162, crm 141, pro page 148, account 204 — i **finalny QA
  675/675**.

**PROBLEMY**

**Nie znaleziono żadnego problemu krytycznego na ścieżce.** Pięć spacerów przez
piętnaście kroków, w czterech językach, czterech walutach, obu motywach i obu
szerokościach, przeszło bez ani jednego błędu w konsoli, bez poziomego przewijania na
żadnym ekranie i bez rozjazdu w żadnej z liczb. Rzeczy, które trzeba było poprawić
w trakcie pisania, były błędami **testu**, nie serwisu (selektory, porównywanie kwot bez
groszy, `change` na polu marży, szuflada nawigacji na telefonie) — są opisane
w komentarzach przy odpowiednich sprawdzeniach.

To nie znaczy „produkt jest bez wad”. To znaczy: **na ścieżce, o którą pyta rozdział
XXXVI, wad nie ma** — a to jest dokładnie to pytanie, które zadano.

Nierozwiązane, bo są poza repo i czekają na właściciela (bez zmian od Sesji 35):

- **Klucz przeglądarkowy w Google Cloud nadal nie zna `liczmat.com`.** Każde wywołanie
  Identity Toolkit z nowej domeny wraca `403 API_KEY_HTTP_REFERRER_BLOCKED`, więc
  **na żywej stronie nikt się dziś nie zarejestruje ani nie zaloguje**. W teście QA krok
  „rejestracja” przechodzi, bo backend jest podstawiony — i to jest granica tego testu,
  powiedziana wprost w jego nagłówku. Naprawa: Credentials → klucz przeglądarkowy →
  Website restrictions → dopisać `https://liczmat.com/*` i `https://www.liczmat.com/*`,
  **zachowując wszystkie dotychczasowe wpisy**.
- **Firebase Auth → Authorized domains**: dopisać `liczmat.com` i `www.liczmat.com`.
- **Nic nie nadaje planu Pro.** `users/{uid}.plan` jest server-only i nikt go nie
  zapisuje (FIRESTORE_SYNC §9.2), a `assets/pay.js` nie ma Payment Linków. Czyli dziś
  **żadne prawdziwe konto nie zobaczy modułu Pro** — stan znany i celowy od Sesji 28,
  nie usterka. Kolejność wdrożenia jest w nocie ORDER na dole `assets/pay.js`.
- **Bliźniak polityki prywatności** w repo `3d-polednia/Materio` nadal mówi
  `materio-app.com`.

> **Poprawka dopisana w Sesji 48 (2026-08-27). Trzy z tych czterech punktów są zamknięte;
> raport zostaje jako raport, ale nie wolno go czytać jako stanu bieżącego.**
>
> - **Klucz przeglądarkowy zna `liczmat.com`** — właściciel dopisał oba wpisy, zmierzone
>   2026-08-26 i ponownie 2026-08-27: `accounts:signInWithPassword` z tym odsyłaczem
>   dochodzi do sprawdzenia hasła, a host spoza listy nadal dostaje 403.
> - **Firebase Auth → Authorized domains** ma siedem wpisów, w tym `liczmat.com`
>   i `www.liczmat.com` — odczytane na żywo.
> - **Bliźniak polityki prywatności** został doprowadzony do zgodności w Sesji 48 i jest
>   teraz **generowany** z kanonicznej kopii, więc nie ma jak się rozjechać.
> - **Nadal otwarte:** nic nie nadaje planu Pro *automatycznie*. Od Sesji 37 jest
>   `scripts/pro-admin.mjs` (ręcznie, po e-mailu), a od Sesji 38 funkcja w `functions/`,
>   która czeka na wdrożenie. Zdanie „FIRESTORE_SYNC §9.2 — brak Cloud Functions"
>   przestało być prawdą 2026-08-21 i zostało poprawione w tamtym pliku.

**STATUS**

Sesja 36 zamknięta. Master Plan ma 36 sesji i to była ostatnia — wszystkie 36 zrobione.

**NASTĘPNE ZADANIE**

Master Plan nie ma Sesji 37. Następny krok należy do właściciela: to trzy pozycje
z „PROBLEMY” powyżej, które robi się w konsolach Google i Stripe’a, a nie w tym repo —
i dopiero po nich rejestracja na `liczmat.com` oraz sprzedaż LiczMat Pro w ogóle ruszą.

### Co zrobiła Sesja 35

Rozdział XXXII, Sesja 35 w całości: **„SECURITY. Autoryzacja, izolacja danych, API,
uprawnienia, poziomy dostępu. GOŚĆ → LICZMAT → LICZMAT PRO."**

**WYKONANO**

Audyt całego produktu pod tymi pięcioma hasłami. Najpierw jedno zdanie, które porządkuje
resztę: **granica jest jedna i nie leży w tym repozytorium** — chronią dane wdrożone
reguły Firestore (`request.auth.uid`, repo aplikacji, FIRESTORE_SYNC §7). Robotą serwisu
jest nigdy nie **zaadresować** cudzych danych, nie zostawiać kopii jednego konta na
cudzym urządzeniu i nie wypuścić poświadczenia na zewnątrz. Znalezionych i naprawionych
zostało osiem rzeczy; żadnej nie łapał żaden z dwudziestu wcześniejszych zestawów testów.

**1. `?next=` po zalogowaniu prowadził na cudzą domenę — przez tabulator.**
`lmSafeNext()` odrzucał `//evil.example`, ukośnik odwrotny i schemat, i **przepuszczał**
`/⇥/evil.example`: pierwszy znak to ukośnik, drugi to tabulator, więc żadna z czterech
reguł się nie odezwała. Parser URL-a w **każdej** przeglądarce usuwa tabulator, CR i LF,
zanim przeczyta adres — zostawało `//evil.example`, czyli adres protokołowo-względny,
czyli `https://evil.example/`. Zmierzone, nie wydedukowane:

```
lmSafeNext("/\t/evil.example") → "/\t/evil.example"
new URL(to, "https://liczmat.com/app/") → https://evil.example/
```

Otwarte przekierowanie na stronie logowania to link phishingowy z prawdziwą domeną
w pasku adresu. Cały zakres C0 plus DEL jest teraz odrzucany, a test rozstrzyga to tak,
jak rozstrzyga przeglądarka: każdą przepuszczoną wartość przelicza przez `new URL()`
i wymaga origin `liczmat.com`. Porównywanie napisów jest tym, co ten błąd przepuściło.

**2. `/p/<token>` oddawał swój adres Google Analytics.** GA4 raportuje `page_location` —
cały adres, z parametrami — a token w tym adresie **jest** poświadczeniem (FIRESTORE_SYNC
§6: dokument jest publiczny, token to sekret, skasowanie dokumentu to odebranie dostępu).
Każdy link wysłany klientowi trafiał więc do trzeciej strony. Ta jedna strona jedzie
teraz bez tagu i bez `dns-prefetch`, z `<meta name="referrer" content="no-referrer">`.
Flaga `secret` w `src/template.mjs`; reszta serwisu ma tag dokładnie jak miała,
i test oblewa, jeśli którakolwiek inna strona go zgubi albo jeśli jakaś strona zostanie
z **połową** tagu.

**3. Kształt tokenu nie był sprawdzany przy wejściu przez `?t=`.** Firestore skleja
segmenty ścieżki, więc `?t=a/b/c` adresowało `sharedProjects/a/b/c` — inny dokument
w podkolekcji, o którą ta strona nigdy nie prosi. Ścieżka `/p/<token>` miała regułę od
zawsze; parametr nie miał żadnej. Teraz oba wejścia (i przekierowanie w `404.html`) czytają
jeden wzorzec: `[A-Za-z0-9_-]{16,64}`.

**4. Kopia konta zostawała w przeglądarce bez śladu, czyja jest.** „Pobierz z konta do
przeglądarki" wgrywa projekty, pomieszczenia, kalkulacje i listy materiałów do
`localStorage` — i **nic nigdy nie zapisywało, do kogo należą**. Na wspólnym komputerze
dawało to dwa osobne błędy: następna osoba otwierała `/projekty/` i czytała cudze projekty
i ceny, a po zalogowaniu się i naciśnięciu „Wyślij z przeglądarki na konto" wgrywała cudze
dane na **swoje** konto — gdzie ich właściciel już ich nie dosięgnie i nigdy się o tym nie
dowie. Reguły Firestore nie mają z tym nic wspólnego: kopia w przeglądarce leży poza
wszystkim, czego reguły pilnują. Jeden klucz, `liczmat-sync-account`, trzyma `uid` konta,
z którym ta przeglądarka synchronizowała się ostatnio; kiedy wskazuje inne konto **i** coś
w przeglądarce leży, synchronizacja w obie strony jest wstrzymana i strona mówi dlaczego.
Pusta przeglądarka nie jest niczyja — stary stempel na niej nikogo nie ostrzega.

**5. Nie było czym wyczyścić urządzenia.** Karta „Usuń konto" od zawsze mówi „Dane w tej
przeglądarce zostają — wyczyść je osobno", a na całym serwisie nie było do tego przycisku.
Jest, na zakładce ustawień: kasuje cztery magazyny danych — warsztat, otwarty projekt,
historię użytych kalkulatorów i magazyn Pro (`liczmat-crm-v1`, jedyny, który trzyma
**cudze** nazwisko, telefon i adres) — plus stempel z punktu 4. Ustawienia zostają: język,
waluta, motyw, zgoda na analitykę i „pamiętaj mnie" nie mówią nic o nikim, a ich
wyczyszczenie pokazałoby stronę w obcym języku komuś, kto prosił o skasowanie danych.
Nikogo nie wylogowuje — to osobny przycisk i osobna decyzja. Lista kasowanych kluczy jest
porównywana z tabelą na `/cookies/`, więc magazyn, którego nie da się wyczyścić, oblewa
testy.

**6. Identyfikator z `localStorage` szedł prosto w ścieżkę Firestore.** `projectId`
z ukośnikiem adresuje inny dokument, a `.`, `..` i `__x__` Firestore odrzuca wyjątkiem —
który lądował w tym samym `catch`, co awaria sieci, więc synchronizacja mówiła „coś poszło
nie tak" zamiast pominąć jeden wiersz i policzyć resztę. `pathId()` sprawdza segment,
zanim ten stanie się adresem.

**7. CSV z kosztorysu mógł być formułą.** Arkusz czyta komórkę zaczynającą się od `=`,
`+`, `-` lub `@` jako formułę — w cudzysłowie czy bez — a nazwy materiałów pisze człowiek
i plik jest oddawany komuś innemu. Komórka dostaje apostrof, a nazwa pliku przestała być
nazwą projektu wklejoną bez sprawdzenia (`../../etc/passwd`, znak nowej linii).

**8. Trzy miejsca wstawiały cudze dane do markupu bez ucieczki.** `data-id` projektu
i pomieszczenia w `/app/` (identyfikator z dokumentu, który przyszedł synchronizacją)
oraz współrzędne sklepu w `href`, które pochodzą z OpenStreetMap, czyli od tego, kto
ostatnio edytował mapę. Nazwa i adres sklepu były uciekane od zawsze; liczby nie —
teraz są liczbami albo wiersza nie ma.

**Czego ta sesja świadomie nie ruszyła.** Paywall nadal nie jest granicą i nie ma nim być
(rozdział XXV chce, żeby darmowy użytkownik *rozumiał*, co jest Pro — zamek z JavaScriptu
niczego nie broni, bo dane CRM są w tej samej przeglądarce). `liczmat-crm-v1` nadal nie
jest w kontrakcie i nie wyjeżdża z urządzenia. `assets/firebase-config.js` nadal jest
jawny, bo klucz Web Firebase nie jest sekretem i nie da się go w przeglądarce ukryć.

**ZMIENIONE PLIKI**

Nowe: `scripts/test-security.mjs`. Zmienione: `assets/account.js` (`lmSafeNext()`),
`assets/share.js` (`SHARE_TOKEN`), `assets/app.js` (`pathId()`, stempel konta,
`foreignWorkspace()`, przycisk czyszczenia, ucieczka `data-id`), `assets/stores.js`
(współrzędne), `assets/workspace-ui.js` (`wsCsvCell()`, `wsFileName()`),
`assets/i18n-pages.js` (7 kluczy × 10 języków), `src/template.mjs` (flaga `secret`),
`src/app-pages.mjs` (karta czyszczenia, ostrzeżenie na zakładce synchronizacji),
`src/pages.mjs` (wiersz `liczmat-sync-account` na `/cookies/`, eksport `COOKIE_ROWS`),
`scripts/build.mjs` (`secret: true` dla `/p/`, `STAMP` → `20260820f`),
`scripts/test-perf.mjs` (strona bez tagu), `scripts/test-account-page.mjs` (§17),
`404.html`, `privacy-policy.html` (`?v=`), `CLAUDE.md`, `docs/ARCHITEKTURA.md` (§7.15),
`docs/MASTER_PLAN.md`, 373 przebudowane strony i dziesięć wygenerowanych słowników.

**TESTY**

**76 549 sprawdzeń logiki w 21 zestawach** — wszystkie przechodzą, w tym nowy
`scripts/test-security.mjs` (8 993). `scripts/build.mjs --check`: 1157 kluczy × 10 języków.
W Chromium **3 950 sprawdzeń w 16 zestawach, wszystkie zielone** — cały zestaw
przebiegnięty po zmianach, bo ta sesja ruszyła `/app/`, `/p/`, kalkulatory i kosztorys.
`scripts/test-account-page.mjs` urósł ze 184 do 204: odmowa synchronizacji, kliknięcie
w wyłączony przycisk (które nie wysyła nic), czyszczenie przeglądarki, ustawienia, które
je przeżywają, i stempel odkładany przez pobranie — wszystko klikane, nic udawane.

**PROBLEMY**

Do decyzji właściciela, żadne z nich nie jest robotą tej sesji:

- **Udostępnionego linku nie da się cofnąć inaczej niż kasując konto.** `/app/` tworzy
  dokument `sharedProjects/{token}` i nigdy nie pokazuje listy tych, które już powstały.
  Skasowanie konta kasuje wszystkie (`where("ownerId", "==", uid)`), więc uprawnienia
  na to są; brakuje ekranu. Osobna sesja, bo to nowy widok w dziesięciu językach.
- **`Content-Security-Policy` nie istnieje.** GitHub Pages nie ustawia nagłówków, ale
  `<meta http-equiv>` działa. Zrobienie tego dobrze oznacza policzenie skrótów SHA-256
  wszystkich skryptów wbudowanych na 373 stronach w buildzie — realne, ale to osobna
  sesja, nie przypis do audytu.
- **`<meta charset>` stoi po bloku analityki, czyli po ~2,5 kB.** Specyfikacja chce go
  w pierwszym kilobajcie. Dziś ratuje to nagłówek `Content-Type` od GitHub Pages i to,
  że żadna współczesna przeglądarka nie zgaduje UTF-7. Poprawka jest jednolinijkowa
  i zmienia wszystkie 373 strony, więc nie wchodziła do sesji o czym innym.
- **Ramka Google Maps nie ma `sandbox`.** Ma `referrerpolicy`, `loading="lazy"` i nic
  z niej nie wraca do strony, ale `sandbox` byłby wzmocnieniem. Nie da się tego
  sprawdzić z tego kontenera — Chromium tutaj nie sięga Google — więc nie zgadywałem.
- **Reguły Firestore są w drugim repozytorium i tej sesji nie podlegają.** Ostatni pomiar
  na żywym backendzie jest z 2026-08-13 i nadal obowiązuje.

**STATUS: ukończone.**

**Następne zadanie: Sesja 36 — FINALNY QA.**

### Co zrobiła Sesja 34

Rozdział XXXII, Sesja 34 w całości: **„ACCESSIBILITY. Dostępność całego produktu.
Sprawdzić: oba motywy, selektor języka, selektor waluty, formularze, focus, kontrast,
keyboard navigation."**

Fundament był zrobiony wcześniej i trzyma: jedna reguła `:focus-visible` na tokenach
(Sesja 4), 44px na każdy cel dotykowy (Sesja 32), `prefers-reduced-motion`, natywny
`<dialog>` z `showModal()`, menu językowe z `aria-expanded`, Escape i powrotem focusa,
`aria-pressed` na przełączniku motywu, `role="status"` przy paskach cofnięcia i statusie
sklepów, `aria-live` przy sumach edytowanego wiersza. Wszystkie pary kolorów przechodzą
AA w obu motywach.

Ta sesja szukała tego, czego **nie widać na ekranie i czego nie oblewał żaden z dziewiętnastu
zestawów testów**. Znalazła dziesięć rzeczy i naprawiła je wszystkie.

**1. Dziewięć pól miało jako jedyną etykietę placeholder, a jedna lista wyboru nie miała
żadnej.** Nowy projekt, nowe pomieszczenie, nowy klient wraz z telefonem i e-mailem, nowe
zlecenie, nowa wycena, pozycja kosztorysu, nazwa projektu w `/app/`, formularz pomieszczenia
w `/app/` — i lista „podłoga / ściany / sufit" w pasku pomieszczeń na 150 stronach
kalkulatorów. Placeholder **nie jest etykietą**: znika, gdy ktoś zaczyna pisać, a czytnik
ekranu ogłasza takie pole jako „edycja, puste". Każde dostało `aria-label` z tego samego
klucza, którego używał placeholder, więc nie powstał ani jeden nowy tekst do przetłumaczenia;
listę wyboru nazywa nowy klucz `ws_surface` (dziesięć języków).

**2. Nagłówki kolumn w stopce były `<h4>` — na wszystkich 375 stronach.** Strona szła
`h1 → h2 → … → h4`, czyli konspekt, po którym czyta się stronę bez patrzenia na nią, miał
dziurę dokładnie tam, gdzie zaczyna się mapa serwisu. Poziom nagłówka to **struktura
dokumentu**, a to, jak duży jest, to reguła w arkuszu — więc nagłówki są `<h2>`, a `footer h2`
robi z nich to samo, co robił `footer h4`. Do tego `<h3>` karty rejestracji na
`/app/dashboard/` (stała tuż pod `<h1>`) i pusty `<h2>` tytułu kosztorysu, który wypełnia
skrypt — ten drugi wychodzi teraz z builda z tym samym zdaniem, do którego skrypt się cofa,
gdy nie ma projektu.

**3. Link „przejdź do treści" nie przenosił focusa.** `<main id="main">` nie był elementem,
który może focus dostać, więc przeglądarka przewijała stronę i **zostawiała focus na
linku** — następny Tab wracał w nagłówek, który odwiedzający właśnie kazał pominąć. Wszystkie
19 wywołań `<main id="main">` w `src/pages.mjs` i `src/app-pages.mjs` (plus
`privacy-policy.html`) mają `tabindex="-1"`.

**4. `/aplikacja/` miała dwie karuzele o tym samym `id`.** `hero-shots` i `hero-dots`
występowały dwa razy na stronie: `getElementById` znajdował pierwszą, więc **druga nigdy się
nie ruszała**, a dokument był niepoprawny w dziesięciu językach. Karuzele są teraz wiązane
po atrybucie `data-carousel` i `querySelectorAll`, każda ze swoim własnym stanem.

**5. Wynik kalkulacji nie był ogłaszany.** To jedyna rzecz, po którą ktoś przychodzi na tę
stronę: naciska „Policz", liczba się zmienia — nic się nie przewija, nic nie nawiguje, focus
nie zmienia miejsca. Czytnik ekranu nie dostawał o tym **żadnej** informacji. Pudełko wyniku
jest teraz `role="status"`. Cena tego to `writeResult()` w `assets/calculators.js`: cichy
przebieg silnika przy ładowaniu strony przerysowywał to, co build już napisał, a zapis do
regionu `live` oznaczałby przeczytanie wyniku komuś, kto o niego nie prosił. Porównywane są
**słowa**, nie znaczniki (build wcina HTML, skrypt nie), więc gdy odpowiedź jest ta sama,
zapis się nie odbywa — a gdy się różni, odbywa się jak wcześniej.

**6. Zrzuty ekranu ruszały się same i nie dało się ich zatrzymać (WCAG 2.2.2).** Karuzela
przesuwa się co 3,5 s, czyli dłużej niż pięć sekund, i klawiatura nie miała na to żadnej
odpowiedzi — najechanie myszą to nie jest mechanizm. Pod makietą telefonu stoi teraz przycisk
stopu: 44px, obie etykiety („zatrzymaj" / „odtwórz", dwa nowe klucze w dziesięciu językach)
jadą z buildem w języku strony, więc `assets/main.js` nadal nie ma własnego słownika.
Przycisk **wychodzi z builda ukryty** i odsłania go skrypt w momencie uruchomienia zegara:
bez JavaScriptu i przy `prefers-reduced-motion` nic się nie rusza, więc nie ma czego
zatrzymywać. Pauza odwiedzającego jest ważniejsza niż powrót karty na wierzch.

**7. Baner zgody nazywał się „Zgoda".** `role="dialog"` z `aria-label` ustawionym na tekst
przycisku akceptacji — czytnik ogłaszał „Zgoda, okno dialogowe" i zostawiał człowieka
z pytaniem, na co się zgadza. Nazwą jest teraz samo zdanie (`aria-labelledby`).

**8. Placeholder miał kolor, którego nikt nie wybrał.** Domyślny kolor przeglądarki to około
3:1 — poniżej 4,5, którego wymaga zdanie. Jest tokenem (`--muted`, `opacity: 1`), a
`scripts/check-contrast.mjs` ma dwie nowe pary: tekst wpisany w pole i placeholder, oba na
`--field-bg`, w obu motywach (5,62:1 i 8,31:1).

**9. Komórki nagłówkowe tabel nie mówiły, co nagłówkują.** `<th>` bez `scope` w tabeli
cookies i w kosztorysie — dziewięć komórek, wszystkie dostały `scope="col"`.

**10. `privacy-policy.html` jest pisany ręcznie i został z tyłu.** Nie miał linku
pomijającego nawigację, przełącznik wersji językowej był `<div>` z `aria-label` (a `aria-label`
nazywa punkt orientacyjny — zwykły `div` nim nie jest, więc nazwa szła donikąd), a jego
własny przełącznik motywu nie ustawiał `aria-pressed`. Wszystkie trzy naprawione; dwa `<h1>`
zostają, bo to dwa dokumenty w jednym pliku, każdy w swoim `<article lang>`.

**Dwa nowe zestawy testów.** `scripts/test-a11y.mjs` (59 sprawdzeń, bez zależności) czyta
375 plików, które poszły na produkcję: punkty orientacyjne i cel linku pomijającego,
konspekt nagłówków, nazwa każdej kontrolki, `alt` każdego obrazka, każda ikona schowana
przed drzewem dostępności, unikalność `id` i to, że każde `aria-controls`,
`aria-labelledby` i `aria-describedby` na coś wskazuje, regiony `live`, trzy przełączniki
rozdziału XXXII, przycisk stopu karuzeli, `scope` w tabelach i reguły w arkuszu, bez których
obwódka focusa nie trafia na ekran. `scripts/test-a11y-page.mjs` (55 sprawdzeń, Chromium,
nic nie jest podstawiane) robi to, czego z pliku nie widać: Tab na link pomijający i Enter
w `<main>`; **drzewo dostępności zbudowane przez samą przeglądarkę** na czternastu ekranach
z danymi, sprawdzone pod kątem kontrolki bez nazwy (to jedyny sposób na ekrany, które w
całości rysuje skrypt z `localStorage`); obwódka na każdym przystanku Taba przez kalkulator
i przez projekt; brak pułapki klawiaturowej między nagłówkiem a stopką; menu językowe
otwarte Enterem, przejechane strzałką i zamknięte Escape, które oddaje focus; selektor
waluty; przełącznik motywu w obu kierunkach, z obwódką widoczną w motywie, na który
przełączył; kalkulacja zrobiona Enterem i ogłoszona, i to, że **nic nie zostało wpisane do
regionu `live` zanim odwiedzający o to poprosił** (mierzone `MutationObserver`em założonym
przed skryptami strony); Escape z dialogu materiałów i focus, który wraca; zrzuty
zatrzymane i puszczone z klawiatury, i to, że przy `prefers-reduced-motion` nie ruszają się
w ogóle, a przycisk stopu się nie pokazuje.

**Czego ta sesja nie zrobiła.** Nie uruchomiła prawdziwego czytnika ekranu — NVDA, VoiceOver
i TalkBack nie działają w tym środowisku, a drzewo dostępności Chromium to **to, co czytnik
dostaje**, nie to, co powie. Nie oceniała, czy `alt` mówi prawdę i czy kolejność Taba
odpowiada kolejności czytania — to sądy, których generator nie wyda. Nie ruszała treści,
slugów, matematyki ani niczego, co dotyczy Sesji 35 i 36.

**Znalezione, nienaprawione** (rozdział XXXV — to nie jest zadanie tej sesji):

- **Notka „Dane się zmieniły" nad wynikiem nie jest ogłaszana.** Pokazuje się przy każdym
  wpisanym znaku; zrobienie z niej regionu `live` oznaczałoby mówienie do kogoś w trakcie
  pisania. Sam wynik jest ogłaszany po przeliczeniu i to jest ta informacja, która ma
  znaczenie — ale decyzja, czy notka ma mieć własny głos, jest do podjęcia.
- **`scripts/check-contrast.mjs` mierzy tokeny, nie to, co naprawdę wyszło na ekranie.**
  Para, której nikt nie dopisał do listy, nie jest sprawdzana. Zmierzenie kontrastu
  wyrenderowanej strony (piksel pod pikselem, w przeglądarce) to osobne narzędzie.
- **`aria-pressed` na przełączniku motywu mówi „ciemny włączony", a nie „motyw: ciemny".**
  Działa i jest zgodne, ale przycisk z nazwą „Zmień motyw" i stanem wciśnięcia to nie to
  samo co grupa dwóch przycisków radio. Do rozważenia razem z ewentualnym trzecim stanem
  („jak w systemie"), którego dziś nie ma.

**Zmienione pliki.** Nowe: `scripts/test-a11y.mjs`, `scripts/test-a11y-page.mjs`.
Zmienione: `src/pages.mjs` (`aria-label` na ośmiu polach, `role="status"` na pudełku wyniku,
`carouselControls()` z przyciskiem stopu, `tabindex="-1"` na `<main>`, `scope` w tabelach,
tytuł kosztorysu, etykiety przycisków archiwizacji), `src/template.mjs` (nagłówki stopki
jako `<h2>`, nazwa banera zgody, komentarz przy linku pomijającym), `src/app-pages.mjs`
(`<h2>` karty rejestracji, `aria-label` na polu projektu, `tabindex="-1"`),
`assets/main.js` (karuzele po `data-carousel`, przycisk stopu, pauza odwiedzającego),
`assets/calculators.js` (`writeResult()`), `assets/workspace-calc.js` (nazwa listy
powierzchni), `assets/app.js` (nazwa pola pomieszczenia), `assets/styles.css`
(`footer h2`, `.app-card h2`, `.phone-controls`, `.phone-pause`, `::placeholder`),
`assets/i18n.js` (`shot_pause`, `shot_play` × 10), `assets/i18n-pages.js`
(`ws_surface` × 10), `scripts/check-contrast.mjs` (dwie pary), `scripts/build.mjs`
(`STAMP` → `20260820e`), `privacy-policy.html`, `404.html` (`?v=`), `CLAUDE.md`,
`docs/DESIGN_SYSTEM.md`, `docs/MASTER_PLAN.md` oraz 373 przebudowane strony.

**Testy.** **67 557 sprawdzeń logiki** w 20 zestawach — wszystkie przechodzą, w tym nowy
`scripts/test-a11y.mjs` (59). `scripts/build.mjs --check`: 1150 kluczy × 10 języków.
`scripts/check-contrast.mjs`: wszystkie pary przechodzą, w tym dwie nowe. W Chromium
**3930 sprawdzeń w 16 zestawach, wszystkie zielone** — cały zestaw przebiegnięty po
zmianach, bo ta sesja ruszyła znaczniki, które czyta każdy z nich.

**Status: ukończone.**

**Następne zadanie: Sesja 35 — SECURITY.**

### Co zrobiła Sesja 33

Rozdział XXXII, Sesja 33 w całości: **„PERFORMANCE. Optymalizacja: ładowania, JS, CSS,
obrazów, fontów, bundle. Szczególnie sprawdzić assety flag, logo i ikon."**

Wydajność jest jedyną cechą tego serwisu, której **nic** dotąd nie pilnowało. Strona może
być poprawna w dziesięciu językach, przejść każdą szerokość telefonu, mieć bezbłędny
`canonical` — i kazać komuś na budowie czekać na 300 kB słowników, których nigdy nie
przeczyta. Żaden z osiemnastu zestawów testów nie oblewał, gdy plik się podwajał, więc pliki
się podwajały.

**Zmierzone przed i po**, wszystko po gzipie, bo to jest to, co serwuje GitHub Pages:

| Strona | Przed | Po | Mniej |
|---|---|---|---|
| `/app/` | 985,9 kB / 308,1 kB | 320,6 kB / 97,3 kB | **−67% / −68%** |
| `/app/dashboard/` | 922,1 kB / 288,2 kB | 259,2 kB / 78,4 kB | **−72% / −73%** |
| kalkulator | 410,0 kB / 124,7 kB | 325,7 kB / 99,2 kB | −21% / −20% |
| strona główna | 223,5 kB / 67,2 kB | 191,6 kB / 54,6 kB | −14% / −19% |
| poradnik | 220,3 kB / 66,5 kB | 188,4 kB / 53,9 kB | −14% / −19% |
| `/materialy/` | 321,1 kB / 84,5 kB | 289,2 kB / 71,9 kB | −10% / −15% |
| `/klienci/` | 398,1 kB / 124,7 kB | 364,2 kB / 111,1 kB | −9% / −11% |

Do tego **gtag.js — jedyne żądanie do obcego hosta i największy pojedynczy plik, jaki
strona pobiera — zniknął ze ścieżki renderowania.** Tego nie ma w tabeli, bo jego rozmiar
należy do Google'a, nie do tego repo.

**1. `/app/`, `/app/dashboard/` i `/p/` pobierały dziesięć słowników zamiast jednego.**
`assets/i18n.all.js` ważył **703 kB (220 kB po gzipie)** i te trzy strony były jedynymi,
które go pobierały — bo nie mają własnego adresu językowego i tłumaczą się w miejscu.
Plik został skasowany. Każdy słownik `assets/i18n.<lang>.js` jest teraz **addytywny**
(`var I18N = (typeof I18N === "object" && I18N) || {}`, potem `I18N["de"] = …`), więc drugi
dokłada się do pierwszego zamiast się z nim zderzać, a `ensureLang()` w
`assets/i18n-runtime.js` dociąga go dopiero wtedy, gdy ktoś naprawdę wybierze inny język.
`LANGS` jest w każdym słowniku ten sam i pełny, więc przełącznik pokazuje dziesięć języków,
zanim cokolwiek zostanie pobrane. Słownik, który nie dojedzie, zostawia stronę w języku,
w którym jest — nie w kluczach. To robi z reguły „wszystko, co pisze JavaScript, ma się
przerysować na `langchange`" regułę **nośną**, a nie porządkową: przełączenie jest teraz
asynchroniczne. Test w przeglądarce, który klika przełącznik, musi na to poczekać
(`pickLang()` w `scripts/test-account-page.mjs`).

**2. Ponad połowa arkusza stylów, który blokuje pierwsze malowanie, to komentarze.**
`assets/styles.css` jest pisany tak, żeby dało się go czytać: argument za każdym tokenem
stoi obok reguły, którą tłumaczy. To **31 z 90 kB**, a że proza kompresuje się lepiej niż
selektory — **13 z 24 kB**, które faktycznie szły drutem, na jedynym żądaniu blokującym
render każdej z 373 stron. Build wypisuje teraz `assets/styles.min.css`: te same reguły,
ta sama kolejność, te same wartości, bez komentarzy i wcięć. **Nic więcej nie jest
przepisywane** — żaden selektor nie jest przestawiony, `#ffffff` nie robi się `#fff`, więc
plik wysyłany nadal da się zdiffować ze źródłem. `src/tokens.mjs` sprawdza dalej plik
autorski. 24,2 kB → 10,5 kB po gzipie.

**3. To samo dotyczyło znaczników.** `src/template.mjs`, `src/pages.mjs` i
`src/app-pages.mjs` tłumaczą się komentarzami HTML stojącymi przy bloku, który opisują —
i te komentarze szły do przeglądarki: 2,4 kB na stronie głównej, ponad 6 kB na
`/klienci/`, na każde wejście. `write()` zdejmuje je teraz z każdej generowanej strony.
Komentarz w `<script>`, `<style>`, `<pre>` albo `<textarea>` jest przeskakiwany w całości —
to kod albo tekst, który ktoś ma zobaczyć. Nic innego nie jest ruszane: żaden znacznik nie
jest przepisany, białe znaki zostają.

**4. `assets/workspace-ui.js` (70 kB) pobierało 150 stron kalkulatorów, żeby dostać pasek
pomieszczeń i pudełko zapisu.** Plik był jeden i trzymał trzy rzeczy: kalkulator, cały
ekran `/projekty/` i cały `/kosztorys/`. Został przecięty w szwie, który już tam był —
`assets/workspace-calc.js` to wspólne słownictwo (`wsT`, `wsEsc`, `wsNum`, `wsDecimal`,
`wsPlain`, `wsUnit`, `wsLang`) plus strona kalkulatora, `assets/workspace-ui.js` to dwa
ekrany. **Nic nie przeszło między połówkami i nic nie zostało przepisane**: ekran projektów
nigdy nie wołał do kalkulatora ani kalkulator do niego. Kalkulator pobiera 17,8 kB zamiast
70,2 kB; `/projekty/` i `/kosztorys/` pobierają obie połówki, w tej kolejności.

**5. gtag.js jest dociągany po zdarzeniu `load`.** Blok inline zostaje tam, gdzie był:
definiuje `gtag()`, ustawia domyślne zgody Consent Mode v2, odtwarza zapisaną zgodę
i woła `config` — wszystko **zanim biblioteka istnieje**, bo `dataLayer` to tablica,
a gtag.js odtwarza ją po kolei, gdy dojedzie. Nie ginie ani jedna odsłona, a zgoda jest
nadal ustawiona zanim cokolwiek może sięgnąć po ciasteczko — to jedyna rzecz w tym bloku,
która nie mogła się przesunąć. Zniknął też `preconnect`: otwierał połączenie TLS na
żądanie, które w trakcie renderu już nie następuje, a nieużywane połączenie i tak jest
zamykane. `dns-prefetch` zostaje.

**6. Flagi, logo i ikony — to, co rozdział XXXII każe sprawdzić osobno.**

- **Flagi w słowniku: 3,8 kB na każdej stronie za nic.** `LANGS` niosło dziesięć wklejonych
  SVG w **każdym** `assets/i18n.<lang>.js`, czyli na każdym wejściu na serwis — a
  przełącznik na 370 z 373 stron jest wypisany przez generator do HTML-a, razem z flagami.
  Kształty przeniosły się do `assets/flags.js`, który pobierają **tylko** te trzy strony,
  które budują przełącznik same.
- **Flagi wklejone w HTML zostają i to jest dobra decyzja — zmierzona, nie założona.**
  Dwadzieścia jeden wklejonych flag na stronie głównej to **536 bajtów** po gzipie, czyli
  mniej niż nagłówki jednego żądania. Dziesięć `<img>` byłoby dziesięcioma żądaniami,
  mogłoby doskoczyć po pierwszym malowaniu i znikałoby bez sieci. Nic tu nie zmieniono.
- **Trzy `rel="icon"` w nagłówku, z czego jeden 192-pikselowy.** Przeglądarka, która
  wybiera największą zadeklarowaną ikonę, pobierała **5,4 kB, żeby narysować kartę 16 px**.
  Rozmiary 192 i 512 są już zadeklarowane w `site.webmanifest`, czyli tam, gdzie taki
  rozmiar jest naprawdę potrzebny. Zostały dwie: `favicon.svg` (809 B) i `favicon-32.png`.
- **`favicon-32.png` i `apple-touch-icon.png` nie miały `?v=`.** Ikona jest cache'owana
  mocniej niż cokolwiek innego na serwisie, a te dwie nie miały jak zostać podmienione.
  Teraz mają stempel jak reszta.
- **Logo jest geometrią w znacznikach, nie żądaniem.** Bez zmian, z tego samego powodu co
  flagi.

**7. Fontów nie ma i to jest ta optymalizacja.** Żadnego `@font-face`, żadnego
`fonts.googleapis.com`, żadnego `.woff2` — system projektowy wydaje font, który urządzenie
już ma. Font webowy to blokujące pobranie w każdej odmianie, na łączu, na którym ten serwis
jest używany. Test tego pilnuje, żeby nie wrócił niepostrzeżenie.

**8. Nowy test: `scripts/test-perf.mjs` (13 158 sprawdzeń).** Czyta te same pliki, co
przeglądarka — stronę, a potem każdy lokalny asset, o który prosi jej HTML — i sumuje je,
surowo i po gzipie, **wobec budżetu spisanego na typ strony**, plus sufit, który musi
przejść każda z 375. Liczby, nie przymiotniki. Sprawdza też: że wysyłany arkusz to arkusz
autorski bez komentarzy i że pod spodem to ten sam CSS; że strona pobiera jeden język i umie
dobrać drugi; flagi, logo i ikony; co stoi na ścieżce renderu (zero obcych `<script src>`
w znacznikach, jeden arkusz, brak `preconnect`, jeden stempel `?v=`); obrazy z `width`,
`height`, `decoding` i `loading="lazy"` poza pierwszym; brak komentarza HTML na stronie
generowanej; obie połówki workspace'u i to, że żadna strona nie wymienia skryptu dwa razy.
**Nie mierzy czasu** — czas na tej maszynie jest faktem o tej maszynie; bajty, żądania
i ścieżka renderu są własnością builda i są takie same wszędzie.

**Czego ta sesja nie zrobiła.** Nie ruszała matematyki kalkulatorów, treści, slugów ani
adresów (rozdział XIII i XXXIV). Nie minifikowała `assets/*.js`: komentarze w nich są
dokumentacją tego repo, a bezpieczne zdjęcie komentarzy z JavaScriptu wymaga prawdziwego
tokenizera (literały regex, ciągi znaków) — to osobna decyzja, nie skutek uboczny sesji
o wydajności. Nie dzieliła słownika na podzbiory per typ strony: strona kalkulatora zużywa
kilkaset z 1147 kluczy, ale klucze budowane dynamicznie (`res_*`, `c_<id>_*`) sprawiają, że
build nie potrafi tego udowodnić, a słownik z brakującym kluczem psuje stronę po cichu.
Nie tknęła obrazów: zrzuty są w WebP, mają `width`, `height`, `decoding="async"`
i `loading="lazy"` poza pierwszym — nie było czego poprawiać.

**Znalezione, nienaprawione** (rozdział XXXV — to nie jest zadanie tej sesji):

- **`assets/banner.jpg` (40 kB) nie jest linkowany z żadnej strony.** To materiał źródłowy
  do listingu Google Play (`DOKUMENTACJA.md`: „Baner promocyjny"), a nie martwy plik — leży
  jednak w artefakcie Pages, bo korzeń repo jest korzeniem serwisu. Nikt go nie pobiera;
  decyzja, czy ma tam zostać, należy do właściciela.
- **Komentarze w skryptach inline w `<head>` (~1,5 kB na stronę) nadal jadą do
  przeglądarki.** Stripper HTML przeskakuje `<script>` w całości i słusznie; zdjęcie
  komentarzy z JavaScriptu to ten sam problem co punkt wyżej.
- **`assets/i18n.ru.js` (96 kB) i `assets/i18n.uk.js` (95 kB)** są o połowę większe niż
  łacińskie — cyrylica to dwa bajty UTF-8 na literę. Nie da się z tym nic zrobić poza
  niewysyłaniem języka. Sufit pojedynczego assetu jest ustawiony przez te dwa pliki.

**Zmienione pliki.** Nowe: `scripts/test-perf.mjs`, `assets/workspace-calc.js`,
`assets/styles.min.css` (generowany), `assets/flags.js` (generowany). Usunięte:
`assets/i18n.all.js`. Zmienione: `scripts/build.mjs` (`buildStylesheet()`,
`stripCssComments()`, `buildFlags()`, `stripHtmlComments()` w `write()`, addytywne
słowniki, `LANG_META` bez flagi, listy skryptów, `STAMP` → `20260820d`),
`src/template.mjs` (arkusz, ikony, gtag po `load`, brak `preconnect`, `flags.js` na
stronach bez języka), `assets/i18n-runtime.js` (`ensureLang()`, `LM_ASSET_QUERY`,
`langOffered()`, `langRow()` z `LM_FLAGS`), `assets/workspace-ui.js` (druga połowa),
`scripts/test-account-page.mjs` (`pickLang()`), `scripts/test-projects.mjs` (czyta obie
połówki), `404.html` i `privacy-policy.html` (arkusz, ikony, `?v=`), `CLAUDE.md`,
`docs/DESIGN_SYSTEM.md`, `docs/DOKUMENTACJA.md`, `docs/MASTER_PLAN.md`, 373 przebudowane
strony i dziesięć wygenerowanych słowników.

**Testy.** **67 498 sprawdzeń logiki** w 19 zestawach — wszystkie przechodzą, w tym nowy
`scripts/test-perf.mjs` (13 158). `scripts/build.mjs --check`: 1147 kluczy × 10 języków.
`scripts/check-contrast.mjs`: wszystkie pary przechodzą. W Chromium **3875 sprawdzeń
w 15 zestawach, wszystkie zielone** — cały zestaw przebiegnięty po zmianach, bo ta sesja
ruszyła ładowanie słownika i podział pliku, który czyta pięć z nich.

**Status: ukończone.**

**Następne zadanie: Sesja 34 — ACCESSIBILITY.**

### Co zrobiła Sesja 32

Rozdział XXXII, Sesja 32 w całości: **„MOBILE QA. Pełny test mobilny. Sprawdzenie:
kalkulatorów, kont, projektów, materiałów, Pro, CRM, wyboru języka, wyboru waluty,
przełącznika motywu."**

Każdy moduł miał już swój test w Chromium i każdy sprawdzał **własny** ekran we **własnym**
zestawie szerokości — najczęściej po polsku. Ta sesja pyta o to, o co pyta telefon, i pyta
o to na całym serwisie naraz, w dziesięciu językach. Znalazła **sześć zastanych defektów
układu** i **siedem czerwonych zestawów testów**: jeden oblewał uczciwie (nagłówek po
rosyjsku, zostawiony przez Sesję 31), trzy **wywracały się wyjątkiem**, zanim doszły do
wyniku, a trzy oblewały **fałszywie**. Siódmy defekt wyszedł dopiero po naprawie
drugiego — i też jest naprawiony.

**1. Nowy test: `scripts/test-mobile.mjs` (1152 sprawdzenia).** Osiem pytań, każde
zadane każdej stronie: nic nie przewija się w bok, każde pole to 16px tekstu w pudełku
44px, każdy cel dotykowy ma 44px, tabela przewija się we własnym pudełku, liczbę wpisuje
się na klawiaturze numerycznej (`inputmode="decimal"`, nigdy `type="number"`), trzy
przełączniki działają przy 320px, a kalkulację da się zrobić na najwęższym telefonie.
Zakres: **wszystkie typy stron w dziesięciu językach przy 320px**, sześć szerokości
rozdziału XXVIII (320/375/390/430/768/1280) po polsku i po rosyjsku, oraz **moduły
z danymi w środku** — projekty, materiały, koszty, pomieszczenia, kosztorys, dashboard
i cztery ekrany Pro. Pusty moduł mieści się na każdej szerokości; to nie jest test.

**2. Etykieta przycisku wypychała stronę poza ekran.** `.btn` miało `white-space: nowrap`,
a element siatki lub flexa nie potrafi zejść poniżej swojego najdłuższego zdania. Rumuńskie
„Arată magazinele din apropiere (până la 20 km)" na `/ro/magazine/` przesuwało stronę
o **103px** przy 320px; ten sam przycisk po rosyjsku o 37px, po niemiecku o 31px, po
ukraińsku o 48px. Na `/aplikacja/` to samo robił link do katalogu materiałów — po
rumuńsku i po rosyjsku. Teraz `.btn` ma `white-space: normal; overflow-wrap: anywhere` — etykieta zawija się
dopiero wtedy, gdy się nie mieści, a `anywhere` jest tym, co w ogóle pozwala minimum
zejść (`break-word` zostawia szerokość najdłuższego słowa).

**3. Każda kontrolka dodana przez moduły Pro szła na produkcję jako tekst 13px w pudełku
19–21px.** Status, termin i klient zlecenia, marża i wiersze robocizny wyceny, data
w terminarzu, listy wyboru projektu. Powód: reguła pola formularza była
**listą dziesięciu selektorów klasowych**, do której każdy nowy moduł musiał się dopisać,
a Sesje 22–25 się nie dopisały. Poniżej 16px iOS Safari **przybliża stronę** w momencie
dotknięcia pola, a 19px to mniej niż połowa celu dotykowego, który blok tokenów sam
deklaruje. Reguła jest teraz pisana na elemencie (`input:not([type=checkbox]):not([type=radio]),
select, textarea`), więc kontrolka nowego modułu jest poprawna, zanim ktokolwiek o niej
pomyśli. `width: 100%` zostało listą klas — to decyzja układu, nie cecha pola.

**4. Tabela kosztorysu ciągnęła stronę w bok.** `/kosztorys/` ma cztery kolumny i kwotę,
która nie może się łamać w środku liczby; przy 320px wystawało od 15px (uk) do 61px (ru).
Tabela siedzi teraz w `.ws-table-scroll` i przewija się we własnym pudełku — tak jak od
Sesji 13 robią to tabele na `/cookies/`. Druk dostaje pełną szerokość z powrotem.

**5. Wiersz nagłówka nie mieścił się po rosyjsku — i to jest ten defekt, który zostawiła
Sesja 31.** Pięć linków, dwa selektory i przycisk konta potrzebują po rosyjsku **1033px**.
Szuflada odpalała się przy 900px, zmierzone przy **czterech** językach; przy dziesięciu
między 900 a ~1050px przełącznik motywu wychodził poza ekran (przy 1000px o 33px, przy
901px o 92px) i **cała strona przesuwała się w poziomie**. Próg szuflady to teraz
**1060px** — w `assets/styles.css` i w `assets/main.js` (`min-width: 1061px`), obie liczby
muszą się zgadzać. `scripts/test-pages.mjs` mierzy rząd tam, gdzie rząd istnieje:
1061 / 1100 / 1160 / 1280px, dziesięć języków, gość i zalogowany.

**6. Cele dotykowe na telefonie miały 26–40px.** Oba przyciski ikonowe nagłówka po 36px,
każdy `.btn-sm` (akcje wiersza, przyciski zgody, każde „Dodaj") 40px, czip materiału 30px,
rozwijane „Dodaj pomieszczenie" / „Dodaj inny koszt" 26px. Poniżej 560px wszystkie rosną
do 44px, czyli do liczby, którą blok tokenów nazywa celem dotykowym. Powyżej 560px
rozmiary „dla myszy" zostają: 36px w wierszu nagłówka i 40px w gęstym wierszu tabeli mają
swój powód, a telefon go nie ma — tam jest cała szerokość ekranu na wiersz. Dotyczy to
także **obu selektorów w szufladzie**: przycisk języka miał 36px, a lista walut 36px
i tekst 14px — czyli kontrolkę, przy której iOS Safari przybliża stronę, w miejscu, gdzie
selektory stoją po jednym w wierszu.

**7. Wybór pomieszczenia przy zapisanej pozycji — defekt, który wyszedł z naprawy
punktu 3.** Etykieta i lista stały w jednym wierszu bez zawijania i mieściły się, dopóki
lista była mała; gdy urosła do 44px, wiersz zaczął wystawać o 48px poza ekran przy 320px.
Etykieta schodzi teraz nad listę, gdy nie ma z czym dzielić linii. Wyłapane przez ten sam
test w tym samym przebiegu, nie po fakcie.

**8. Sześć zestawów testów w przeglądarce było czerwonych, a nikt tego nie widział.**
`test-projects-page.mjs`, `test-materials-page.mjs` i `test-costs-page.mjs` **wywracały
się wyjątkiem** na piątym języku: tabela oczekiwanych słów ma cztery języki, a pętla po
przywróceniu dziesięciu chodzi po dziesięciu. Pętla chodzi teraz po tym, co tabela nazywa
(sekcja nadal nazywa się „four languages"); rozszerzenie tabeli do dziesięciu to przegląd
tłumaczeń, nie sesja QA. `test-clients-page.mjs`, `test-jobs-page.mjs`
i `test-calendar-page.mjs` **fałszywie oblewały** sekcję „stopka nie proponuje linku
gościowi": ich `open()` od Sesji 28 domyślnie sadza konto na poziomie `pro`, więc „gość"
w teście był kontem Pro. Trzy razy `pro: false` i sekcje mówią to, co miały mówić.

**Czego ta sesja nie zrobiła.** Nie ruszała matematyki kalkulatorów, treści, slugów ani
adresów (rozdział XIII i XXXIV). Nie zmieniała rozmiarów kontrolek powyżej 560px — to jest
design system Sesji 4 i działa tam, gdzie działa mysz. Nie tłumaczyła tabel `WANT`
w trzech testach na dziesięć języków. Nie sprawdziła `/app/` po zalogowaniu — Chromium
w kontenerze nie dosięga `gstatic.com`, więc SDK Firebase nie odpowiada; ekran za
logowaniem ma swój test z podstawionym SDK (`scripts/test-account-page.mjs`), a ta sesja
sprawdza markup, który `/app/` wysyła i który widać, zanim SDK odpowie.

**Zmienione pliki.** Nowy `scripts/test-mobile.mjs`; `assets/styles.css` (zawijanie
etykiety przycisku, reguła pola na elemencie, `.ws-table-scroll`, wiersz pomieszczenia,
blok szuflady wydzielony do `max-width: 1060px`, cele dotykowe poniżej 560px),
`assets/main.js` (`min-width: 1061px`), `src/pages.mjs` (kosztorys w pudełku
przewijanym), `src/ia.mjs` (komentarz o progu nagłówka), `scripts/build.mjs`
(`STAMP` → `20260820c`), `scripts/test-pages.mjs` (szerokości nagłówka),
`scripts/test-projects-page.mjs`, `scripts/test-materials-page.mjs`,
`scripts/test-costs-page.mjs` (pętla po językach tabeli), `scripts/test-clients-page.mjs`,
`scripts/test-jobs-page.mjs`, `scripts/test-calendar-page.mjs` (`pro: false` u gościa),
`404.html` i `privacy-policy.html` (`?v=`), `CLAUDE.md`, `docs/DESIGN_SYSTEM.md`,
`docs/ARCHITEKTURA.md`, `docs/DOKUMENTACJA.md`, `docs/MASTER_PLAN.md`, 373 przebudowane
strony i dziesięć wygenerowanych słowników. `sitemap.xml` bez zmian: `lastmod` liczy się
od treści, a wszystkie 370 adresów miały już dzisiejszą datę po Sesjach 30 i 31.

**Testy.** **54 340 sprawdzeń logiki** w 18 zestawach — wszystkie przechodzą.
`scripts/build.mjs --check`: 1147 kluczy × 10 języków. `scripts/check-contrast.mjs`:
wszystkie pary przechodzą. W Chromium **3875 sprawdzeń w 15 zestawach, wszystkie
zielone** — w tym nowy `scripts/test-mobile.mjs` (1152) oraz sześć zestawów, które przed
tą sesją albo wywracały się wyjątkiem, albo oblewały fałszywie, i `test-pages.mjs`, który
oblewał uczciwie na nagłówku po rosyjsku. Przed tą sesją zielonych zestawów w Chromium
było osiem z czternastu.

**Status: ukończone.**

**Następne zadanie: Sesja 33 — PERFORMANCE.**

### Co zrobiła Sesja 31

Rozdział XXXII, Sesja 31 w całości: **„Indywidualne SEO dla kalkulatorów. Każdy kalkulator
powinien być możliwie dobrym landing page'em dla konkretnego zapytania użytkownika.
Uwzględnić wszystkie cztery wersje językowe tam, gdzie istnieje odpowiednia treść."**

Sesja 30 sprawdziła, czy serwis mówi do maszyn **poprawnie**. Ta sesja odpowiada na drugie
pytanie, którego żaden test techniczny nie zada: **co te strony mówią**. Tytuł
„Płytki, panele, gres — Kalkulatory | LiczMat" jest technicznie bez zarzutu i nie zawiera
ani jednego słowa z tego, co ktoś naprawdę wpisuje w wyszukiwarkę — „ile płytek na m²".

**1. 150 stron kalkulatorów dostało własne teksty.** Do tej sesji wszystkie 150 dzieliły
jeden wzorzec (`calc_meta_pattern`) z podstawioną nazwą i jednozdaniowym opisem, a `<h1>`
był etykietą z listy w centrum kalkulatorów. Teraz każdy kalkulator ma w każdym z dziesięciu
języków **własny tytuł, własny opis i dwa własne pytania z odpowiedziami** — 15 × 10 × 6
ciągów, napisanych raz, w `src/calc-seo.mjs`.

**2. Tytuł jest zapytaniem, `<h1>` jest tym samym zdaniem.** „Kalkulator płytek i paneli —
ile kartonów", „Fliesenrechner: wie viele Kartons", „Calculator gresie și faianță: câte
cutii". Build dokleja `| LiczMat`, a limit jest twardy: **50 znaków na tekst, 60 na cały
tytuł**, pilnowane w buildzie i w teście. Tym samym **znika wyjątek, który zostawiła Sesja
30**: `scripts/test-seo.mjs` wymusza teraz 60 znaków na **wszystkich 375 stronach**, bo 53
tytuły kalkulatorów, które go przekraczały (najdłuższy 76 znaków), już go nie przekraczają.

**3. Opis jest jeden i stoi w dwóch miejscach, bo to jedno zdanie.** Ten sam tekst idzie
w `<meta name="description">` i w akapit pod `<h1>`. Snippet, który obiecuje coś, czym
strona się nie zaczyna, to ten sam błąd widziany z dwóch stron. Każdy z 150 opisów mieści
się w 50–160 znakach i **żaden nie powtarza się na innej stronie** w całym serwisie.

**4. FAQ pod kalkulatorem, nigdy nad nim.** Dwa pytania na kalkulator, w rozwijanych
sekcjach (ten sam komponent `.faq`, co na stronie głównej — zero nowego CSS), plus
`FAQPage` w danych strukturalnych zbudowany **z tej samej listy, którą renderuje strona**,
więc markup i JSON-LD nie mogą powiedzieć czegoś innego. Rozdział XII mówi „długie treści
SEO, instrukcje i FAQ nie mogą zasłaniać kalkulatora" — to jest reguła o **położeniu**, więc
test sprawdza ją po położeniu: `<h1>` → formularz → wynik → „Jak to liczymy" → FAQ.

**5. Liczby w odpowiedziach są tymi, które serwis już podaje.** Zapas 5–7% i 10–15%, worek
25 kg dający ~12,5 l betonu, 6 kołków na m², zakład siatki 10%, gęstość 2,0 kg/l, rozstaw
60/40 cm, CD 40 cm i wieszaki 90 cm — wszystko to stoi już w kluczach `note_<id>` albo jest
polem formularza. Żadna odpowiedź nie wymyśla liczby, marki ani ceny.

**6. Teksty nie trafiły do słownika przeglądarki.** `src/calc-seo.mjs` jest modułem
buildu, nie czwartym słownikiem: `assets/i18n.<lang>.js` pobiera **każda** strona serwisu,
a 90 kluczy na język kopii, którą zobaczy tylko czytelnik gotowego HTML-a i robot, to
kilkanaście kilobajtów na każde wejście za nic. Test pilnuje, że nic z tego nie wyciekło do
`assets/i18n.<lang>.js`. Przy okazji z `assets/i18n-pages.js` wypadły dwa klucze, których
już nikt nie czyta: `calc_meta_pattern` i `calc_page_lead`.

**7. Okruszek został przy krótkiej nazwie.** W ścieżce nawigacyjnej nadal jest „Płytki,
panele, gres", a nie nowy tytuł: okruszek jest mapą serwisu, a „Kalkulator płytek i paneli
— ile kartonów" jest w nim tytułem, nie miejscem.

**Czego ta sesja nie zrobiła.** Nie ruszała matematyki, formularzy, jednostek ani slugów —
rozdział XIII i zasada „slug jest wieczny". Nie dopisywała kalkulatorom nowych sekcji poza
FAQ; „Jak to liczymy" (pola, wzór, ostrzeżenie) zostało dokładnie takie, jakie było.
Nie tknięte zostały teksty centrum kalkulatorów i poradników — plan mówi o kalkulatorach.

**Znalezione, nienaprawione** (rozdział XXXV — to jest zadanie następnej sesji, nie tej):
**nagłówek przewija się w bok o 33 px po rosyjsku przy 1000 px u zalogowanego użytkownika.**
Zmierzone w Chromium **na drzewie sprzed tej sesji i po niej — identycznie**, więc to błąd
zastany, nie skutek tej sesji. Trafia dokładnie tam, gdzie należy: **Sesja 32 — MOBILE QA**.

**Zmienione pliki.** Nowe `src/calc-seo.mjs` (900 ciągów: 15 kalkulatorów × 10 języków ×
tytuł, opis i dwa pytania) i nowe `scripts/test-calc-seo.mjs`; `src/pages.mjs`
(`calcPageMain()` bierze `seo`, sekcja FAQ, `<h1>` i lead z nowej kopii), `scripts/build.mjs`
(`calcFaqLd()`, walidacja kopii w `validate()`, tytuł i opis z `CALC_SEO`, `STAMP` →
`20260820b`), `scripts/test-seo.mjs` (wyjątek na tytuły kalkulatorów usunięty),
`assets/i18n-pages.js` (dwa martwe klucze usunięte, 10 języków), `privacy-policy.html`
i `404.html` (`?v=`), `CLAUDE.md`, `docs/ARCHITEKTURA.md`, 373 przebudowane strony,
`sitemap.xml` i dziesięć wygenerowanych słowników.

**Testy.** **53 489 sprawdzeń logiki** w 18 zestawach — wszystkie przechodzą; nowy
`scripts/test-calc-seo.mjs` wnosi **5 133** i czyta 150 plików, które naprawdę shipują.
`scripts/test-seo.mjs` po zdjęciu wyjątku: 36 869/36 869. `scripts/build.mjs --check`:
**1147 kluczy × 10 języków**. Testy w Chromium: **758/759** — jedyna porażka to zastany
nagłówek po rosyjsku opisany wyżej, potwierdzony jako obecny również przed tą sesją.

**Status: ukończone.**

**Następne zadanie: Sesja 32 — MOBILE QA.**

### Co zrobiła Sesja 30

Rozdział XXXII, Sesja 30 w całości: **„Cały serwis: metadata, sitemap, robots, canonical,
Open Graph, structured data, indeksowanie, hreflang, wersje językowe."**

Każda z tych dziewięciu rzeczy jest zdaniem, które serwis wypowiada do maszyny, która nigdy
nie dopyta — i żadnej z nich nie widać w przeglądarce. Sesja zaczęła się od przeczytania
wszystkich **375 plików HTML**, które naprawdę leżą w repo, i porównania tego, co mówią, z
tym, co powinny. Cztery rzeczy były zepsute, trzy dało się zrobić lepiej, a jedna była
zwykłym zaniedbaniem po rebrandingu. Reszta — `canonical`, wzajemność `hreflang`,
`x-default`, kompletność wersji językowych — była już poprawna i teraz jest **pilnowana**.

**1. `robots.txt` unieważniał `noindex`, przed którym miał stać.** To najpoważniejsze
znalezisko. Plik mówił `Disallow: /app/` i `Disallow: /p/`, a obie strony miały do tego
`noindex` w metatagu — i komentarz w pliku tłumaczył, że to metatag „naprawdę trzyma je poza
indeksem". Te dwa mechanizmy się nie sumują, tylko **znoszą**: robot, któremu zabrania się
pobrać stronę, nigdy nie przeczyta zakazu indeksowania na niej, a sam adres nadal może
trafić na listę wyników, jeżeli ktokolwiek gdziekolwiek do niego linkuje. Przy
`/p/<token>` to jest gorsze niż zwykłe zaindeksowanie: **token w adresie jest całym
poświadczeniem**, więc pozycja w Google opublikowałaby link do cudzej wyceny. `Disallow`
zniknął, `noindex` został. Nic prywatnego przez to nie wycieka — `/app/` bez logowania to
formularz logowania, a `/p/` bez tokenu nie renderuje żadnej wyceny.

**2. `sitemap.xml` był drugą kopią mapy serwisu.** Piętnaście wywołań `add()` w
`scripts/build.mjs`, prowadzonych ręcznie obok `src/ia.mjs`, w którym `indexable` jest
polem trasy od Sesji 3. Sesja 29 pamiętała, żeby dopisać `/liczmat-pro/`; następna mogła nie
pamiętać, a strona nieobecna w sitemapie nie mówi o sobie, że jej brakuje. Teraz
`sitemapUrls()` w `src/ia.mjs` rozwija trasy na dziesięć języków i **build porównuje wynik z
markupem, który naprawdę zapisał** — strona z `noindex` w sitemapie albo indeksowalna poza
nią przerywa build. 371 adresów, tyle samo co wcześniej; różnica jest w tym, że teraz nie
da się o żadnym zapomnieć.

**3. `lastmod` kłamał przy każdym buildzie.** Wszystkie 371 adresów dostawały datę dnia
budowania, także wtedy, gdy zmieniła się jedna strona albo żadna. Google czyta `lastmod`
tylko wtedy, gdy jest „consistently and verifiably accurate", więc to jedno pole kasowało
się dla całej domeny. Teraz data **przenosi się z poprzedniej sitemapy**, jeżeli build nie
zmienił treści strony; porównanie idzie po odcisku treści, z którego wycięty jest `?v=`,
więc podbicie `STAMP` — które przepisuje wszystkie 373 pliki — nie przestemplowuje serwisu.
Sprawdzone na żywo: po zmianie jednego klucza w słowniku datę zmieniła **jedna** strona;
po podbiciu `STAMP` — żadna. Ręcznie pisana `privacy-policy.html` nie dostaje `lastmod`
w ogóle, bo build jej nie generuje i nie wie, kiedy się zmieniła — brak pola jest dozwolony
i uczciwszy niż wymyślona data.

**4. `<changefreq>` i `<priority>` zniknęły.** Google ich nie czyta i mówi to od lat, Bing
tak samo. Były liczbą, którą każda nowa strona musiała sobie wymyślić i której nikt nie mógł
sprawdzić — dokładnie to, co `CLAUDE.md` każe wycinać. 742 elementy mniej.

**5. Meta description: 97 stron miało opis ucinany w połowie zdania.** Wszystko powyżej ~160
znaków Google obcina, więc ten tekst był pisany dla nikogo. Skrócone zostały **82 ciągi** w
jedenastu kluczach (`meta_desc`, `apppage_meta`, `matpage_meta`, `wspage_meta`,
`clipage_meta`, `jobpage_meta`, `quopage_meta`, `calpage_meta`, `calchub_meta`,
`guides_meta`, `propage_meta`) — nie przez ucięcie w pół zdania, tylko przez wyrzucenie
całego zdania albo skrócenie wyliczenia, żeby gramatyka została. Do tego **`calc_meta_pattern`
w dziesięciu językach**: wzorzec mówił „ten sam wzór co w aplikacji LiczMat **na Androida**",
co wypychało 14 stron kalkulatorów ponad limit; „na Androida" wypadło, bo o systemie mówi
sama strona. Najdłuższy opis w serwisie ma teraz **160 znaków**, a nie 236. Żadne dwie
strony nie mają tego samego opisu — to też jest teraz sprawdzane.

**6. Open Graph był niekompletny.** Doszło `og:locale:alternate` dla pozostałych dziewięciu
języków — to jest odpowiednik `hreflang` po stronie Open Graph, i pochodzi z **tego samego
źródła**, więc nie może się z nim rozjechać — oraz `twitter:image:alt`. `privacy-policy.html`,
pisana ręcznie, nie miała w ogóle `og:site_name`, `og:locale`, wymiarów obrazka, jego opisu
ani karty Twittera: dostała komplet, ten sam co 373 generowane strony.

**7. Structured data: jedna organizacja zamiast dwóch.** Strona główna deklarowała `WebSite`,
którego `publisher` był bezimiennym węzłem `Organization`, i **obok** drugą `Organization`
o tej samej nazwie i tym samym adresie — czyta się to jako dwie firmy. Każda strona
kalkulatora robiła to samo z `WebSite` przez `isPartOf`. Węzły mają teraz stałe `@id`
(`#organization`, `#website`), więc powtórzenie jest odwołaniem, a nie kolejną kopią.

**8. `site.webmanifest` nadal roznosił wycofany slogan.** „Policz. Kup. Nie marnuj." —
to samo hasło, które Sesja 6 zmieniła, a etap rebrandingu wypalił na nowo w `og-image.jpg`.
Manifest jest linkowany z `<head>` każdej z 373 stron, więc rozdawał je 373 razy. Przy okazji
`start_url` przestał być `./index.html`, czyli drugim adresem strony głównej.

**9. Chorwacki i serbski nadal mówiły „w Materio".** Sześć ciągów (`wspage_meta`,
`estpage_h2`, `est_foot` w obu językach) niosło odmienioną nazwę wycofanej marki:
„Projekti i prostorije **u Materiju**". Jeden z nich był meta description strony
`/hr/projekti/` i `/sr/projekti/`, czyli tym, co widać w wynikach wyszukiwania.

**Czego ta sesja nie zrobiła.** **53 tytuły stron kalkulatorów przekraczają 60 znaków**
(najdłuższy: 76, rumuński), bo wzorzec brzmi `{nazwa} — {tytuł centrum kalkulatorów} |
LiczMat` i wkłada pełny tytuł centrum w tytuł każdego kalkulatora. To jest **Sesja 31 —
SEO KALKULATORÓW**, której całym tematem jest, co te tytuły mają mówić; zaklepanie dzisiejszego
wzorca w teście byłoby tą sesją mówiącą następnej, że miała rację. `scripts/test-seo.mjs`
wymusza limit 60 znaków na wszystkich pozostałych stronach i **nazywa ten jeden wyjątek**.
Nie ruszone zostały też: `HowTo` i `FAQPage` w danych strukturalnych (Google przestał z nich
robić rich results, ale sam markup jest poprawny i nic nie psuje), dwa `<h1>` w dwujęzycznej
polityce prywatności (to jeden dokument z polską i angielską wersją, nie błąd) oraz jej
przestarzały pasek nawigacji, który wymienia trzy linki zamiast pięciu.

**Zmienione pliki.** `src/ia.mjs` (nowe `sitemapUrls()`), `scripts/build.mjs`
(`buildSitemap()` przepisane, `previousLastmod()`, `fingerprint()`, `snapshotPages()`,
kontrola sitemapy w `checkAgainstIA()`, `ORG_ID`/`SITE_ID`, `STAMP` → `20260820a`),
`src/template.mjs` (`og:locale:alternate`, `twitter:image:alt`), `robots.txt`,
`site.webmanifest`, `privacy-policy.html` (komplet Open Graph, krótszy opis, `?v=`),
`404.html` (`?v=`), `assets/i18n-pages.js` (82 opisy + 10 wzorców + 4 ciągi z wycofaną
marką), `assets/i18n-materials.js` (10 opisów `matpage_meta`), nowe `scripts/test-seo.mjs`,
`CLAUDE.md`, `docs/ARCHITEKTURA.md` (§4), 373 przebudowane strony i `sitemap.xml`.

**Testy.** **48 457 sprawdzeń logiki** w 17 zestawach — wszystkie przechodzą; nowy
`scripts/test-seo.mjs` wnosi **36 119** i czyta 375 plików, które naprawdę shipują, a nie
kod, który je napisał. Sprawdzony też sam test: przywrócenie `Disallow: /app/`, dopisanie
`<priority>` do sitemapy i wydłużenie jednego opisu do 291 znaków — każde z nich wywala
odpowiednią sekcję. `scripts/build.mjs --check`: **1149 kluczy × 10 języków**. Testy w
Chromium pominięte z kodem 0 — Playwright nie jest w tej sesji zainstalowany; ta sesja
zmienia wyłącznie `<head>` i teksty meta, więc nie ma w niej nic, co widać na ekranie.

**Status: ukończone.**

**Następne zadanie: Sesja 31 — SEO KALKULATORÓW.** *(wykonane 2026-08-20 — raport wyżej.)*

### Co zrobiła Sesja 29

Rozdział XXXII, Sesja 29 w całości: **„Krótka, konkretna strona prezentująca Pro. Bez
marketingowego przesytu."** Powstało `/liczmat-pro/` — dziesięć stron, po jednej na język,
pod tym samym segmentem adresu we wszystkich, bo to nazwa własna produktu. Serwis ma
**373 strony** zamiast 363.

**1. Trasa jest `GUEST`, indeksowana i bez bramki.** To nie jest niedopatrzenie, tylko
jedyna możliwa decyzja: paywall Sesji 27 stoi przed *narzędziem*, a opis tego, za co ktoś
miałby zapłacić, schowany za tą zapłatą, byłby kołem. `/liczmat-pro/` czekało w
`src/ia.mjs` ze statusem `PLANNED` od Sesji 3 — teraz jest `LIVE`, a **lista stron
planowanych jest pusta**. Slug przeniósł się z `plannedSlug` do `SECTION` bez zmiany
choćby jednej litery, tak samo jak cztery moduły Pro przed nim.

**2. Strona nie pisze niczego drugi raz.** Pięć modułów pochodzi z `LM_FEATURES`
(`proModules()`), więc produkt nie może być tu opisany jako cztery moduły albo sześć. Cena
to `proPlansBlock()` — **ten sam blok, który niesie ściana** — więc dwa miejsca nie
zacytują dwóch cen. Adresy pochodzą z `src/site.mjs`. Napisane od zera jest tylko to,
czego nie mówi nigdzie indziej: **co zostaje darmowe** (wszystkie kalkulatory, katalog,
projekty, pomieszczenia, listy materiałów i koszty — bez konta), **czego Pro nie robi**
(rozdział XXIV: „to nie jest ERP"; XXII: bez podatków, rabatów i dat wystawienia; XXIII:
to nie drugi Kalendarz Google) i **trzy kroki rozdziału XXV**: darmowe konto → subskrypcja
na stronie konta → pięć modułów otwiera się samo.

**3. Kwota jest w HTML-u — i to jest połowa tej sesji.** Na ścianie cena jest pusta i
wypełnia ją skrypt, bo zamknięty moduł i tak wymaga JavaScriptu. Tutaj nie wolno tak zrobić:
ta strona ma być *przeczytana*, także przez Googlebota i przez przeglądarkę bez skryptu, a
pusty prostokąt w miejscu ceny to strona, która się nie wczytała. Build wypisuje więc kwotę
w walucie domyślnej dla języka strony — jedną z czternastu wpisanych ręcznie w
`assets/pay.js`, **nic nie jest przeliczane** — a `assets/paywall.js` nadpisuje ją walutą,
którą odwiedzający naprawdę wybrał. Zmierzone w Chromium: 39,99 zł po polsku, 229,00 Kč po
czesku, 1.099,00 RSD po serbsku, i zmiana w miejscu po przełączeniu waluty, bez
przeładowania.

**4. Kto już płaci, nie widzi ceny.** `pwPage()` czyta poziom z `liczmat-signed-in` i dla
konta Pro chowa cały blok z ceną, zostawiając „Twój plan: LiczMat Pro". Proponowanie komuś
kupna tego, co już opłaca, czyta się jak groźba — ten sam argument, dla którego pasek nad
otwartym modułem nie niesie ceny. Nic z tego niczego nie bramkuje: strona jest publiczna, a
podpowiedź o sesji może być nieaktualna.

**5. Trzy linki włączyły się same.** Trzecie drzwi strony głównej, „Poznaj LiczMat Pro" na
każdej ścianie i w zakładce Pro, oraz karta poziomu Pro na `/app/` — wszystkie czytały
status trasy, więc w ich kodzie nie zmieniło się nic. Dopisać trzeba było jedno:
`liczmat-pro` w mapie `window.LM_NAV` w `scripts/build.mjs`, bo `/app/` nie ma własnego
języka. W stopce strona stoi tuż przed czterema modułami Pro i **nie** ma `navLevel`:
strona tłumacząca, czym jest Pro, schowana przed każdym bez Pro, tłumaczyłaby to tym,
którzy już wiedzą.

**Czego ta sesja nie zrobiła.** Nie ruszyła paska nawigacji (mieści pięć linków i pięć
niesie — szósty wymaga pomiaru albo wyrzucenia jednego z obecnych, i to jest decyzja
właściciela). Nie założyła produktów w Stripe i nie włączyła płatności: strona mówi
wprost, że subskrypcji jeszcze nie da się wykupić, dokładnie tak jak ściana. Nie dopisała
`Offer` do structured data — reklamowanie w danych strukturalnych oferty, której nic nie
umie sprzedać, byłoby nieprawdą wobec Google.

**Zmienione pliki.** `src/site.mjs` (`SECTION.pro`, `urlLiczmatPro()`), `src/ia.mjs`
(trasa `LIVE`, stopka, przenumerowane pozycje czterech modułów), `src/pages.mjs`
(`proPageMain()`), `src/pro.mjs` (`proPlansBlock()` przyjmuje gotową kwotę),
`src/app-pages.mjs` (karta poziomu Pro linkuje do strony), `src/currency.mjs`
(`MONEY_LOCALE`), `scripts/build.mjs` (`buildProPage()`, `planPrices()`, `LM_NAV`,
sitemap, `STAMP` → `20260819j`), `assets/paywall.js` (`pwPage()`), `assets/styles.css`
(`.door-level` jako `inline-block`), `assets/i18n.js` (`door_pro_go` ×10),
`assets/i18n-pages.js` (18 kluczy `propage_*` ×10 = 180 ciągów), nowe
`scripts/test-propage.mjs` i `scripts/test-propage-page.mjs`, poprawione
`scripts/test-plan.mjs`, `scripts/test-account.mjs` i `scripts/test-account-page.mjs`,
`CLAUDE.md`, `docs/ARCHITEKTURA.md` (§2, §3, §4, §5, §5.1, §7.12, nowy §7.13),
`privacy-policy.html` i `404.html` (`?v=`), 373 przebudowane strony.

**Testy.** **12 338 sprawdzeń logiki** w 16 zestawach — wszystkie przechodzą; nowy
`scripts/test-propage.mjs` wnosi 1079. W Chromium (Playwright zainstalowany poza repo,
tym razem się udało): nowy `scripts/test-propage-page.mjs` — **148/148**, w tym wariant
bez JavaScriptu i sześć szerokości rozdziału XXVIII; `scripts/test-account-page.mjs`
184/184; `scripts/test-dashboard-page.mjs`, `test-save-page`, `test-rooms-page`,
`test-quotes-page`, `test-crm-page` bez zmian. `scripts/build.mjs --check`: **1149 kluczy
× 10 języków**.

**Znalezione przy okazji — trzy defekty starsze niż ta sesja.** Naprawione zostały tylko
te, które dotyczą kodu ruszonego w tej sesji; reszta jest opisana i **nie ruszona**
(rozdział XXXV).

- **Naprawione: `scripts/test-plan.mjs` §6d nigdy nie sprawdzał żadnego języka.** Pętla
  szła po `SITE_LANGS.map((l) => l.code)`, a `LANGS` w `src/site.mjs` to tablica *napisów*,
  nie obiektów — więc dziesięć przebiegów robiło się z `lang === undefined` i wszystkie
  przechodziły, bo obie strony każdego porównania budowały się z tego samego `undefined`.
  Po poprawce wyszedł prawdziwy błąd testu: „moduł nie jest wymieniony dwa razy" liczyło
  wystąpienia *tekstu*, a niemieckie „Kunden" siedzi w środku własnego opisu
  („Eine Kundenliste…"), więc test mówił „dwa" o jednym. Liczy teraz znaczniki.
- **Naprawione: `scripts/test-account-page.mjs` §9b liczył pięć elementów tam, gdzie od
  Sesji 28 jest ich sześć** (doszedł link do portalu Stripe) — i przechodził, bo nikt nie
  patrzył. Zamiast liczby jest teraz lista adresów, więc następna zmiana powie, *co*
  doszło.
- **Nie ruszone: `scripts/test-projects-page.mjs`, `test-materials-page.mjs` i
  `test-costs-page.mjs` wywalają się z `TypeError`** — mają tabele oczekiwanych słów dla
  czterech języków, a chodzą po dziesięciu. To skutek przywrócenia sześciu języków po
  Sesji 28 i dotyczy trzech zestawów, których ta sesja nie dotyka.
- **Nie ruszone: `scripts/test-pages.mjs` — rosyjski nagłówek przy 1000 px wystaje o 33 px**
  dla zalogowanego. Ten sam pomiar w pozostałych dziewięciu językach przechodzi. To dług po
  przywróceniu języków; problem jest w pasku nagłówka, którego ta sesja nie ruszyła.
- **Nie ruszone: `test-clients-page.mjs`, `test-jobs-page.mjs` i `test-calendar-page.mjs`
  mają po jednym błędzie** — „gość nie dostaje linku w stopce" nie sprawdza gościa, bo
  wspólne `open()` w tych plikach sadzi `liczmat-signed-in: "pro"`, kiedy test nie powie
  inaczej. Sprawdzone: te same trzy błędy są na `origin/main` sprzed tej sesji.
- **Nie ruszone: `freePrice()` w `src/pages.mjs` ma tabelę locale dla czterech języków**,
  więc „0 zł" na sześciu przywróconych formatuje się polskim locale. Kwota jest zerowa,
  więc widać to tylko w separatorze — ale to ta sama luka co wyżej.
- **Numeracja w `docs/ARCHITEKTURA.md` ma dwa razy §7.7 i dwa razy §7.8** (Sesja 28 i etap
  językowy nadały numery, które już były zajęte). Nowy rozdział dostał §7.13; przenumerowanie
  całości to osobne zadanie.

**Problemy.**

- **Tłumaczeń nowej strony nie weryfikował native speaker** — 180 ciągów w dziesięciu
  językach, to samo zastrzeżenie, co przy przywróceniu języków.
- **Node i przeglądarka piszą hrywnę inaczej**: build wypisuje „479,00 ₴", Chromium
  nadpisuje na „479,00 грн". Kwota jest ta sama, dane ICU są różne i żaden napis wypisany
  przy budowaniu nie trafi w każdą przeglądarkę. Widać to wyłącznie po ukraińsku i tylko
  jako zmiana symbolu przy pierwszym renderze.
- **Cena stoi w dwóch miejscach naraz w sensie operacyjnym**: w `assets/pay.js` i na
  produktach w Stripe. To zastrzeżenie Sesji 28 i ta sesja go nie zmienia — teraz jednak
  kwota jest wypisana także w statycznym HTML-u, więc **przy zmianie ceny trzeba przebudować
  serwis**, a nie tylko podmienić plik JS.
- **Rozdział V planu wymienia cztery języki, rozdział VI cztery waluty** — nadal
  nieaktualne wobec dziesięciu i siedmiu. `MASTER_PLAN.txt` jest plikiem właściciela.

**Status: ukończone.**

**Następne zadanie: Sesja 30 — SEO TECHNICZNE.** *(wykonane 2026-08-20 — raport wyżej.)*

### Przywrócenie 10 języków — etap dodatkowy po Sesji 28

Nie jest to sesja Master Planu, tylko zlecenie właściciela wykonane **po** commicie Sesji 28
i z własnym raportem — rozdział XXXV, jedna sesja = jedno zadanie. Numeracja stoi; następna
w kolejce zostaje **Sesja 29**.

Wróciło sześć języków wycofanych 2026-08-12: **cs, sk, ro, hr, sr, ru**. Serwis ma znowu
dziesięć języków i **363 strony** zamiast 147.

**1. Slugi odzyskane z gita, nie wymyślone.** To jest najważniejsza decyzja tego etapu.
Commit `ab1fb26` — pierwotny upload — niesie kompletne `SECTION`, `CALC_SLUG` i `GUIDES` dla
wszystkich dziesięciu języków. Te adresy były publiczne i zaindeksowane przez miesiące, więc
stare slugi nie są wygodniejsze, tylko **poprawne**: `CLAUDE.md` mówi, że slug jest wieczny,
a wymyślenie nowych zepsułoby każdy przychodzący link **po raz drugi**. Sprawdzone
mechanicznie przez porównanie listy plików ze starego commita z tym, co build pisze teraz:
**wszystkie 177 adresów, które istniały przed wycofaniem, odpowiadają znowu — zero
brakujących.** Nowe segmenty trzeba było napisać tylko dla czterech sekcji Pro
(`klienci`, `zlecenia`, `wyceny`, `terminarz`), bo w czasach tamtych języków nie istniały.

**2. Tłumaczenia — 6780 ciągów, w trzech kubełkach.** Z 1130 kluczy na język:

| skąd | ile na język | ile razem |
|---|---|---|
| odzyskane dosłownie (polski tekst źródłowy się nie zmienił) | 641 | 3846 |
| przetłumaczone od nowa (polski się zmienił — rebranding, pozycjonowanie) | 17 | 102 |
| zupełnie nowe (sesje 13–28: konto, projekty, pomieszczenia, materiały, koszty, CRM, płatności) | 472 | 2832 |

Kryterium było mechaniczne, a nie „na oko": jeżeli **polski** tekst pod danym kluczem jest
dziś dokładnie taki sam jak wtedy, gdy tłumaczenie powstawało, tłumaczenie dalej jest
prawdziwe. Jeżeli polski się zmienił — a zmienił się m.in. w `hero_title`, `foot_tagline`
i całym FAQ, bo produkt przeszedł rebranding i zmienił pozycjonowanie z „Policz. Kup. Nie
marnuj." na „Policz. Zaplanuj. Zrealizuj." — tłumaczenie poszło do przepisania. Bez tego
kroku serwis mówiłby po czesku o produkcie, którego już nie ma.

**3. Liczba mnoga to trzy różne reguły.** `assets/units.js` miał jedną, słowiańską, dla
`pl` i `uk`. Trzy z nowych języków (`ru`, `hr`, `sr`) do niej pasują, ale:

| rodzina | języki | „few" |
|---|---|---|
| ostatnia cyfra | pl, uk, ru, hr, sr | końcówka 2–4 (poza 12–14): 22 → few |
| małe 2–4 | cs, sk | dokładnie 2, 3, 4 — **22 to już „many"** |
| romańska | ro | 2–19 i dalej po setkach; 20 przechodzi na „many" |

Wrzucenie czeskiego do rodziny polskiej dałoby „22 položky", co jest po prostu błędem —
poprawnie „22 položek". `scripts/test-save.mjs` ma teraz tabelę oczekiwanych form dla
wszystkich dziesięciu języków i to ona tę różnicę pilnuje.

**4. Waluty i domyślne ustawienia.** Siedem walut z Sesji 28 obsługuje dziesięć języków bez
zmian — język nie wyznacza waluty (rozdział VI). Domyślne: `cs` → CZK, `ro` → RON,
`sr` → RSD, `sk` i `hr` → EUR (Chorwacja jest na euro od 2023), **`ru` → EUR**, bo rubla
celowo nie ma: Stripe nie działa w Rosji, a cena, której nic nie umie pobrać, jest gorsza
od ceny w walucie, którą czytelnik przeliczy sam.

**5. Poprawione liczby w treści.** `trust_langs` mówiło „4 języki, 4 waluty" — teraz
„10 języków, 7 walut", we wszystkich dziesięciu. `apppage_meta` mówiło „4 języki" o
aplikacji Android, która ma dziesięć — poprawione. Obie były nieaktualne **także w czterech
językach, które nigdy nie wypadły**.

**6. Przekierowanie z `404.html` usunięte.** Linia, która wysyłała `/cs/`, `/sk/`, `/ro/`,
`/hr/`, `/sr/` i `/ru/` na stronę główną, musiała zniknąć w tej samej zmianie — inaczej
odbijałaby każdą przywróconą stronę od niej samej. `RETIRED_LANGS` w `src/site.mjs` jest
teraz pustą listą, zachowaną jako mechanizm.

**Zmienione pliki.** `src/site.mjs` (LANGS, RETIRED_LANGS, HREFLANG, OG_LOCALE i trzy tabele
slugów — 350 slugów), `src/ia.mjs` (`plannedSlug` dla `/liczmat-pro/`), `assets/i18n.js`,
`assets/i18n-pages.js`, `assets/i18n-materials.js` (sześć bloków językowych),
`assets/currency.js` (domyślne waluty i locale), `assets/units.js` (trzy rodziny liczby
mnogiej), sześć nowych flag w `assets/flags/`, `404.html`, `scripts/build.mjs` (`STAMP` →
`20260819i`), `scripts/test-save.mjs` i `scripts/test-dashboard.mjs`, `CLAUDE.md`,
`docs/ARCHITEKTURA.md` §7.8, 363 przebudowane strony.

**Testy.** **11 244 sprawdzeń logiki** w 15 zestawach, wszystkie przechodzą (było 6180 przy
czterech językach — zestawy same rosną wraz z liczbą języków). `scripts/build.mjs --check`:
1130 kluczy × 10 języków. `scripts/check-contrast.mjs` bez zmian. Porównanie adresów ze
starym commitem: 177/177 odzyskanych.

**Problemy.**

- **Tłumaczeń nie weryfikował native speaker.** 2934 ciągi napisane w tej sesji trafiają na
  ~220 nowych publicznych stron pod domeną właściciela. Odzyskane 3846 są w lepszej
  sytuacji — były już opublikowane — ale i one nie przeszły niczyjej korekty. **To jest
  rzecz do zlecenia przed poważnym ruchem SEO w tych językach.**
- **Testów w Chromium nadal nie dało się uruchomić** (brak Playwrighta). Trzynaście zestawów
  pominęło się z kodem 0. Dwie rzeczy w szczególności **nie są zmierzone**: czy rząd pięciu
  linków w nagłówku zostaje jednolinijkowy w czeskim i rumuńskim (limit mierzono kiedyś w
  niemieckim), i czy selektor języka z dziesięcioma pozycjami mieści się na 320 px.
- **Chorwacki i serbski zgadzają się dosłownie w 46% kluczy.** To dwa standardy jednego
  języka i krótkie napisy interfejsu wychodzą identycznie — poprawnie, a nie przez
  kopiowanie. Testy wymagające, żeby każdy język brzmiał inaczej, liczą te dwa jako jeden
  głos; gdyby właściciel chciał je wyraźnie rozdzielić, to jest decyzja redakcyjna,
  nie techniczna.
- **Rozdział V planu wymienia cztery języki**, a jest ich dziesięć. `MASTER_PLAN.txt` jest
  plikiem właściciela — ta edycja należy do niego, tak samo jak rozdział VI po Sesji 28.
- **Aplikacja Android ma własne dziesięć języków** i ta zmiana jej nie dotyczy; teraz oba
  produkty mają tyle samo, co usuwa rozbieżność opisaną w „Języki aplikacji Android".

**Status: ukończone.**

**Następne zadanie: Sesja 29 — STRONA LICZMAT PRO.**

### Co zrobiła Sesja 28

Rozdział XXV, pięć punktów zlecenia: **subskrypcja, status planu, obsługa aktywnego Pro,
obsługa anulowania, zabezpieczenie uprawnień**.

**Fakt, od którego zależy cała reszta, i który się nie zmienił.** `users/{uid}.plan`
zapisuje wyłącznie serwer, a serwera, który by go zapisywał, nadal nie ma: ani Cloud
Functions, ani Play Billing (`FIRESTORE_SYNC` §9.2). GitHub Pages nie ma backendu. Ta sesja
zbudowała więc **całą stronę przeglądarki** i sama z siebie nie sprawia, że jedna złotówka
wpływa i nadaje komuś Pro. Brakującym serwerem jest rozszerzenie Firebase „Run Payments
with Stripe", instalowane w konsoli — kolejność jest niżej i stoi też w kodzie, w nocie
ORDER na końcu `assets/pay.js`.

**1. Subskrypcja — `assets/pay.js`.** Dwa plany (miesięczny, roczny), siedem walut,
czternaście kwot wpisanych ręcznie. **Dwa progi zamiast jednego**: `lmPayPriced()` — jest
kwota, więc pokaż cenę — i `lmPayBuyable()` — jest kwota **i** Payment Link, więc pokaż
przycisk kasy. Dziś pierwsze jest prawdą, drugie nie, i to jest dokładnie stan, w którym
serwis jedzie: mówi, ile Pro kosztuje, i mówi wprost, że subskrypcji jeszcze nie da się
wykupić. Wpisanie trzech adresów włącza przyciski bez żadnej innej edycji.

Cennik (te same czternaście kwot musi stanąć na produktach w Stripe):

| plan | PLN | EUR | USD | UAH | CZK | RON | RSD |
|---|---|---|---|---|---|---|---|
| miesięczny | 39,99 | 9,99 | 10,99 | 479 | 229 | 49,99 | 1099 |
| roczny | 399,99 | 99,99 | 109,99 | 4799 | 2290 | 499,99 | 10990 |

**Kursu nie ma w przeglądarce.** Właściciel podał EUR i PLN i poprosił o przeliczenie
reszty po kursie euro — zostało zrobione **raz, przy pisaniu pliku**, a nie przy każdym
wczytaniu strony. Powód najważniejszy: Stripe pobiera kwotę ustawioną **na produkcie**, więc
cena policzona z kursu na żywo rozjeżdżałaby się z tym, co realnie schodzi z karty przy
kasie. Dalej: kurs w przeglądarce to zapytanie do zewnętrznego API na stronie statycznej —
nowa zależność sieciowa, nowy odbiorca danych w polityce prywatności i cena, która potrafi
się zmienić między obejrzeniem a kliknięciem. Kursy i źródła (wszystkie 2026-08-19) stoją
w nagłówku `assets/pay.js`. Zniżka ok. 7,4% wobec kursu jest ta sama, którą właściciel
zastosował już do złotówki (9,99 € × 4,3245 = 43,20 zł, ustawione 39,99 zł), więc siedem
walut jest wycenionych jednakowo względem siebie; rocznie = 10× miesięcznie wszędzie.

**Trzy nowe waluty — CZK, RON, RSD.** Bez nich nie ma czym wycenić subskrypcji w Czechach,
Rumunii i Serbii. Chorwacja jest na euro od 2023. **RUB celowo nie ma: Stripe nie działa
w Rosji**, więc cena w rublach byłaby ceną, której nic nie umie pobrać. Dodanie waluty
niczego nie przelicza — każda zapisana kwota trzyma swój `currencyCode`.

**2. Status planu i 3. aktywne Pro, 4. anulowanie — `lmSubscription()`.** Pięć stanów
jednym słowem: `none`, `free`, `active`, `cancelled`, `expired`. Anulowanie wymagało
**trzeciego pola**, bo „odnowi się 12 września" i „skończy się 12 września" to z `plan` +
`planValidUntil` ten sam dokument. `planRenews` jest polem serwerowym; **zmiana reguł nie
była potrzebna**, bo wdrożone reguły i tak nie pozwalają klientowi na nic poza `lastSeenAt`
i `appVersion`. Stoi **obok kontraktu synchronizacji**, w tej samej pozycji co `note` na
materiale (Sesja 18) i `projectId` na pomieszczeniu (Sesja 20), i przeżyje z tego samego
powodu: każdy zapis w `CloudSync.kt` jest merge'em. Jego **brak czytany jest jako
„odnawia się"** — powiedzenie komuś, że jego subskrypcja się kończy, kiedy dokument tego
nie mówi, jest tu jedynym błędem, który kosztuje klienta. `lmLevelOf()` nietknięte: poziom
nadal wyprowadzany jest w jednym miejscu, a anulowana-ale-ważna subskrypcja to wciąż PRO.

**5. Zabezpieczenie uprawnień — i usunięty podgląd.** Sesja 27 zostawiła w ścianie jedne
drzwi: jeden klucz w `localStorage` otwierający wszystkie pięć modułów. **Usunięty na
polecenie właściciela**, wraz z `lmProPreview()`, `lmSetProPreview()`, zdarzeniem
`lm-preview`, blokiem `proPreviewBlock()`, sześcioma kluczami słownika × 4 języki i wierszem
na `/cookies/`. Powód: na ścianie stoi teraz cena, a lokalny przełącznik otwierający moduły
za darmo jest ścianą, która sama sobie przeczy — i drugą odpowiedzią na pytanie „czy wolno
mi tego użyć", podczas gdy `lmLevelOf()` istnieje po to, żeby odpowiedź była jedna.

Reszta punktu 5: **kasa stoi wyłącznie na `/app/`**, bo adres kasy musi nieść
`client_reference_id` (uid), a strony modułów nie ładują Firebase i uid-a nie znają —
ściana podaje cenę i linkuje do `/app/`. Adres kasy niesie **uid i e-mail, i nic więcej**:
kwota, plan i waluta stoją po stronie Stripe, więc spreparowana przeglądarka może źle
narysować własną stronę i **nie kupi Pro za złotówkę**. `lmPayUrlOk()` przyjmuje `https:`
na `buy.stripe.com` albo `billing.stripe.com` i porównuje **cały host** — `xbuy.stripe.com`
kończy się właściwymi literami i należy do kogoś innego.

**Polityka prywatności.** Stripe to nowy odbiorca danych, więc `privacy-policy.html` dostał
sekcję 7.1 po polsku i po angielsku: co idzie do Stripe (e-mail, uid), czego nie widzimy
(numer karty), co wraca (status planu, data, czy się odnowi) i że dopóki płatności nie są
uruchomione, **nie idzie tam nic**. Bliźniak `docs/privacy-policy.html` w
`3d-polednia/Materio` — **dług, repo nie było podpięte w tej sesji**.

**Zmienione pliki.** Dodane: `assets/pay.js`, `scripts/test-pay.mjs`. Zmienione:
`assets/plan.js` (`lmSubscription()`, `lmPlanRenews()`, podgląd usunięty), `assets/pay.js`,
`assets/paywall.js` (ceny zamiast podglądu), `assets/app.js` (`renderPlan()` na pięć stanów,
`renderPlanPrices()`, `goToCheckout()`), `assets/currency.js` (siedem walut),
`src/pro.mjs` (`proPlansBlock()` zamiast `proPreviewBlock()`, panel subskrypcji),
`src/pages.mjs` (cztery przyciski podglądu i wiersz `/cookies/`), `src/ia.mjs` (nota),
`scripts/build.mjs` (`pay.js` na pięciu stronach, `paywall.js` zdjęte z `/app/`, `STAMP` →
`20260819h`), `assets/i18n-pages.js` (15 nowych kluczy × 4 języki, 7 usuniętych × 4),
`assets/styles.css` (karty planów — same istniejące tokeny), osiem plików testowych,
`privacy-policy.html` + `404.html` (`?v=`), `CLAUDE.md`, `docs/ARCHITEKTURA.md` §7.6, §7.7
i §9, 147 przebudowanych stron.

**Testy.** `scripts/test-pay.mjs` — 243 sprawdzenia, nowy plik. `scripts/test-plan.mjs`
urósł z 305 do 647: wypadł podgląd, doszło pięć stanów subskrypcji i **§6c**, które sadzi
cztery obiecujące klucze w `localStorage` i sprawdza, że **żadna odpowiedź się nie ruszyła**.
Razem **6 180 sprawdzeń logiki** w 15 zestawach, wszystkie przechodzą.
`scripts/check-contrast.mjs` — bez nowej pary kolorów, wszystkie przechodzą. Matematyka
kalkulatorów nietknięta.

Sprawdzone **negatywnie osiem razy**, po jednym psuciu na każdą nową bramkę: waluta bez
ceny, kwota w adresie kasy, dopuszczenie hosta przez `endsWith()`, plan roczny przestający
być zniżką, `pay.js` sięgające do `localStorage`, Payment Link wpisany zanim cokolwiek
nadaje plan, build przestający pisać `data-pw-price`, przycisk kasy postawiony na ścianie —
za każdym razem test faktycznie pada. Pierwsze podejście do testu hostów **nie złapało**
błędu `endsWith()`, bo przypadek testowy był źle dobrany (`buy.stripe.com.example.org` nie
kończy się na `buy.stripe.com`); poprawione i sprawdzone ponownie.

**Problemy.**

- **Pięć modułów Pro jest teraz zamkniętych dla każdego konta, łącznie z kontem
  właściciela.** To bezpośrednia konsekwencja usunięcia podglądu i jest **zamierzona**,
  a nie regresja — zapisana tu, w `CLAUDE.md` i w `docs/ARCHITEKTURA.md` §7.6 właśnie po to,
  żeby następna sesja nie uznała jej za defekt i nie „naprawiła". Odblokuje ją dopiero
  serwer nadający `plan: premium`.
- **Testów w Chromium nie dało się uruchomić** — Playwright nie jest zainstalowany w tym
  kontenerze. Trzynaście zestawów (`test-*-page.mjs`) **pominęło się z kodem 0**, zgodnie ze
  swoją konwencją; sześć z nich zostało przepisanych pod tę sesję (podgląd wypadł, doszły
  ceny i stan anulowany), ale **nie zostały wykonane ani razu**. Trzeba je przepuścić na maszynie
  z Playwrightem przed wdrożeniem. Żeby ten brak nie był całkowicie odsłonięty,
  `scripts/test-pay.mjs` §6b sprawdza **statycznie**, że każdy selektor, o który pytają
  `assets/paywall.js` i `assets/app.js`, faktycznie stoi w zbudowanym HTML-u — to ta klasa
  błędu, którą normalnie łapie Chromium.
- **`planRenews` nie jest w kontrakcie synchronizacji.** Dopisanie go do
  `docs/FIRESTORE_SYNC.md`, `SyncContract.kt` i encji Room to zmiana w
  `3d-polednia/Materio`, czyli osobna sesja. Do tego czasu telefon pola nie widzi, ale go
  nie kasuje.
- **Rozdziały V i VI planu są nieaktualne.** Rozdział VI wymienia cztery waluty, a jest
  ich siedem; rozdział V wymienia cztery języki, a właściciel zlecił powrót do dziesięciu.
  `MASTER_PLAN.txt` jest plikiem właściciela — **te dwie edycje należą do niego**.
- **Nic nie zostało sprawdzone na żywym Stripie**, bo nie ma konta ani produktów. Cała
  warstwa przeglądarki jest przetestowana na podstawionej konfiguracji.

**Co właściciel musi zrobić, w tej kolejności** (ta sama lista stoi w `assets/pay.js`):

1. Stripe → dwa produkty z **dokładnie tymi czternastoma kwotami**, po siedem walut każdy.
2. Stripe → Payment Link na produkt, i włączony Customer Portal.
3. Firebase → rozszerzenie „Run Payments with Stripe". **To jest ten brakujący serwer.**
4. Funkcja przepisująca subskrypcję na `users/{uid}.plan`, `planValidUntil` i `planRenews`.
5. **Zapłacić raz, na prawdziwym koncie, i sprawdzić, że konto samo staje się Pro.**
6. **Dopiero wtedy** wkleić trzy adresy do `LM_PAY` w `assets/pay.js`.

Przycisk kasy włączony przed punktem 5 bierze pieniądze za nic.

**Status: ukończone.**

**Następne zadanie: przywrócenie 10 języków** — etap dodatkowy zlecony przez właściciela,
przed Sesją 29. **Wykonany tego samego dnia** — raport wyżej.

### Co zrobiła Sesja 21

Rozdział XXXII, Sesja 21 w całości: „Model Free / Pro. Bez płatności. Przygotowanie:
uprawnień, feature gatingu, statusu planu, struktury Pro." Cztery przygotowania — i **żaden
moduł Pro**: Klienci to Sesja 22, Zlecenia 23, Wyceny 24, Terminarz 25, CRM 26, paywall
i płatności 27–28, strona `/liczmat-pro/` 29. Nic z tego nie zostało tknięte.

**1. Uprawnienia — `LM_FEATURES` w nowym `assets/plan.js`.** `src/ia.mjs` od Sesji 3
odpowiada, jakiego poziomu wymaga *strona*. To jest druga połowa zdania z rozdziału II
(„każdy element aplikacji powinien jednoznacznie wiedzieć, do którego poziomu dostępu
należy") — dla *funkcji*: siedemnaście pozycji, każda z jednym poziomem, trasą, jeśli ją ma,
i numerem sesji, jeśli jeszcze nie istnieje.

Tabela zapisuje **to, co serwis faktycznie robi**. Rozdział II wpisuje gościowi „zapisywać
kalkulacje", „tworzyć projekty" i „tworzyć listy materiałów" pod NIE MOŻE — ten serwis
trzyma je w `localStorage` w kształcie dokumentu Firestore, `/projekty/` i `/kosztorys/` są
trasami `GUEST` (rozstrzygnięcie §8.1 po Sesji 20), a `FIRESTORE_SYNC` §1.2 mówi wprost, że
liczenie nigdy nie wymaga konta. Dziesięć z siedemnastu funkcji jest więc gościowskich;
darmowe konto dokłada dwie — synchronizację i link do udostępnienia. Tabela, która mówiłaby
co innego, byłaby instrukcją dla którejś z kolejnych sesji, żeby zamknąć coś, co dziś działa.

**2. Feature gating — `lmCan(id, level)` i `lmGate(id, level)`.** Poziom jest
**przekazywany**, nie odczytywany w środku. Jedyne, co strona bez Firebase potrafi
przeczytać, to `liczmat-signed-in`, a to podpowiedź, która bywa nieaktualna — funkcja, która
po cichu by na niej zamykała, prędzej czy później schowałaby komuś jego własne projekty.
Nieznany identyfikator zwraca `false` i **nie ma bramki**: literówka ma zamykać drzwi, nie
otwierać, i nie ma prawa wypisać na stronie „undefined".

**Nic z tego nie jest zabezpieczeniem, i tak jest napisane w kodzie.** Przeglądarka
decyduje, co *pokazać*; co wolno *zapisać*, decydują wdrożone reguły Firestore. Kto podmieni
sobie ten plik w devtoolsach, dostanie stronę z napisem „Pro" i backend, który dalej
odmawia.

**3. Status planu — `lmPlanStatus()`.** `lmLevelOf()` sprowadza wygasły plan Pro do LICZMAT:
słusznie do bramkowania i bezużytecznie do wytłumaczenia komuś, **dlaczego** wrócił na
darmowy. Nowa funkcja trzyma obie połowy — `plan` (`free` / `premium`, słowa z kontraktu,
starsze niż rebranding), `validUntil`, `expired` i `level`, przy czym poziom **woła**
`lmLevelOf()`, zamiast liczyć go po raz drugi. Gość nie ma planu `free`, tylko `null`: nie ma
konta, więc nie ma na czym planu trzymać, a „Darmowy" powiedziane komuś, kto się nigdy nie
zarejestrował, nazywa plan, którego ten ktoś nie posiada.

**4. Struktura Pro — piąta zakładka `/app/`.** Pięć modułów opisanych w całości i każdy
oznaczony zdaniem z rozdziału XXV: „Dostępne w LiczMat Pro". Opis jest pełny, bo rozdział XXV
chce, żeby darmowy użytkownik **rozumiał**, co jest Pro; wstrzymany jest sam moduł, którego
zresztą jeszcze nie ma. **Żaden przycisk nie prowadzi donikąd** — „Poznaj LiczMat Pro" jest
zdaniem, a nie linkiem, dopóki `/liczmat-pro/` jest `PLANNED`, dokładnie tak, jak `HOME_DOORS`
rysuje drzwi do strony, której nie ma. Test w Chromium liczy, że w całym panelu jest **zero**
elementów klikalnych. Nad modułami stoi karta planu tego konta, wypełniana z `users/{uid}`;
przycisku „kup" nie ma, bo nic po stronie serwera by go nie obsłużyło.

Deklaracja jest jedna. `assets/plan.js` jest skryptem przeglądarki, więc `src/pro.mjs`
dostaje listę funkcji z zewnątrz — tym samym mostem, którym `src/pages.mjs` dostaje katalog
materiałów — a build zestawia tabelę z `ROUTES` i przerywa się, gdy trasa `PRO` nie ma
funkcji albo funkcja `PRO` siedzi na trasie, która nie jest `PRO`.

**Zmienione pliki.** Dodane: `assets/plan.js`, `src/pro.mjs`, `scripts/test-plan.mjs`.
Zmienione: `src/app-pages.mjs` (piąta zakładka, panel Pro), `assets/app.js` (`renderPlan()`,
przerysowanie przy zmianie języka), `scripts/build.mjs` (wczytanie tabeli, osiem nowych
sprawdzeń, `STAMP` → `20260819a`, `plan.js` na `/app/`), `assets/i18n-pages.js` (23 klucze
× 4 języki), `assets/styles.css` (karty modułów i pasek planu — same istniejące tokeny),
`scripts/test-account.mjs` i `scripts/test-account-page.mjs` (piąta zakładka, panel Pro,
szerokości), `CLAUDE.md`, `docs/ARCHITEKTURA.md` §7.6 i §9, `404.html` i
`privacy-policy.html` (`?v=`), 131 przebudowanych stron. Usunięte: nic.

**Testy.** `scripts/test-plan.mjs` — 305 sprawdzeń, nowy plik; reszta zestawu przechodzi bez
zmian. Sprawdzone **negatywnie siedem razy**, po jednym psuciu na każdą nową bramkę
build’a — trasa `PRO` bez funkcji, funkcja z nieistniejącym poziomem, funkcja na
nieistniejącej trasie, funkcja `PRO` bez tekstu, `LM_PLAN` rozjeżdżające się z kontraktem,
brak klucza `feat_quotes_t` w niemieckim i zdublowany identyfikator funkcji — za każdym
razem build faktycznie pada i mówi, na czym.
Razem **3405 sprawdzeń logiki** (9 zestawów) i **1418 w Chromium** (8 zestawów,
Playwright zainstalowany poza repo), w tym 22 nowe w `/app/`: darmowy plan, plan Pro z datą,
plan Pro, który wygasł (nazwa wraca na „Darmowy", nota mówi dlaczego, plakietka tożsamości
się zgadza), przerysowanie panelu po przełączeniu na niemiecki, zero klikalnych elementów
i brak przewijania w bok na 360 / 414 / 768 px. `scripts/check-contrast.mjs` — bez nowej
pary kolorów, wszystkie przechodzą. Matematyka kalkulatorów nietknięta:
`assets/calculators.js` bez zmian.

**Problemy.**

- **Poziom PRO jest nadal nieosiągalny w praktyce** i ta sesja tego nie zmieniła, bo nie
  miała. `plan` nadaje wyłącznie serwer, a serwera, który by go nadawał, nie ma: ani Cloud
  Functions, ani Play Billing (`FIRESTORE_SYNC` §9.1–9.2). Kolejność z rozdziału XXV jest
  jednoznaczna — najpierw funkcje Pro, potem uprawnienia, na końcu paywall — więc karta
  planu mówi to wprost: „Nic jeszcze nie nadaje planu Pro". Do decyzji właściciela zostaje
  **w której sesji** ktoś zaczyna `plan` nadawać; Sesja 27 (paywall) i 28 (płatności) są
  w planie po modułach.
- **Piąta zakładka nie była mierzona w niemieckim tak, jak mierzony był piąty link
  w nagłówku.** Rząd zakładek ma `flex-wrap: wrap`, więc zawija się zamiast wystawać, i test
  sprawdza brak przewijania w bok na 360 / 414 / 768 px — ale najdłuższe etykiety
  („Synchronizacja", „LiczMat Pro") nie były sprawdzane pod kątem tego, czy rząd zostaje
  jednolinijkowy. Zawinięty rząd zakładek jest poprawny; jednolinijkowy byłby ładniejszy.
- **Tabela uprawnień nie jest jeszcze przez nic czytana poza zakładką Pro.** To jest zgodne
  z zakresem („przygotowanie"), ale znaczy, że `lmCan()` ma dziś jednego użytkownika
  i testy. Sesja 22 będzie pierwszą, która postawi na niej prawdziwą bramkę.
- **Rozdział II a to, co ships.** Różnica opisana w punkcie 1 jest zapisana w kodzie,
  w `docs/ARCHITEKTURA.md` §7.6 i tutaj — celowo, w trzech miejscach, bo to jedyne miejsce
  w całym modelu, w którym plan i produkt mówią co innego. Gdyby właściciel chciał, żeby
  gość jednak **nie mógł** zapisywać projektów, to jest zmiana produktu, nie tabeli.

**Status: ukończone.**

**Następne zadanie: Sesja 22 — KLIENCI.**

### Poprawki po Sesji 20 — zgłoszone przez właściciela

Właściciel przeszedł świeżo wdrożoną Sesję 20 na telefonie i zgłosił cztery rzeczy. **To nie
jest Sesja 21** — ten sam status, co „Poprawki po Sesji 13”. Numeracja stoi; następna
w kolejce zostaje Sesja 21.

Trzy z czterech okazały się defektami **starszymi niż Sesja 20**.

**1. „Górne zakładki powinny być ciągle widoczne”.** Nagłówek na `/app/` pokazywał sam
„Kalkulatory”. Przyczyna nie była kosmetyczna: `chrome()` w `src/app-pages.mjs` podawał
**jeden link, wpisany na sztywno po polsku**, bo `/app/`, `/app/dashboard/` i `/p/` nie mają
własnego języka — niosą cały słownik i tłumaczą się w miejscu, więc drugiego linku nie dałoby
się zrobić poprawnym po niemiecku. Rozwiązane tym samym wzorcem, którym pulpit rozwiązał to
dla swoich kafelków: build wypisuje adresy polskie i podaje wszystkie języki w
`window.LM_NAV`, każdy link niesie `data-nav-route`, a `assets/i18n-runtime.js` przepina
`href` przy zmianie języka — obok przepisywania etykiet, które działało od zawsze i było
połową roboty. Bez skryptu link nadal działa.

Doszła zakładka **„Aplikacja”**, o którą właściciel poprosił. Limit linków w nagłówku
podniesiony z czterech na pięć i **zmierzony, nie założony** — Sesja 5 postawiła czwórkę po
pomiarze zawijania w niemieckim, więc piątka dostała ten sam pomiar:
`scripts/test-pages.mjs` sprawdza jednolinijkowy rząd w czterech językach na
900 / 1000 / 1160 / 1280 px, osobno dla gościa (cztery widoczne) i dla zalogowanego (pięć).
Poniżej 900 px nawigacja jest szufladą i zawinąć się nie może. Szósty link nadal wywala build.

**`/p/<token>` zostaje z krótkim menu, i to jest decyzja, nie przeoczenie.** To udostępniona
wycena otwierana przez *klienta* wykonawcy, nie przez właściciela konta; pełne menu robi
z wyceny lejek.

**2. Zakładki „Projekty” i „Pomieszczenia” w `/app/` scalone.** Pomieszczenia są teraz
rysowane **wewnątrz** projektu, z własnym formularzem w każdym wierszu — tak jak zrobiła to
Sesja 20 na `/projekty/`. Cztery zakładki zamiast pięciu. Pomieszczenia, których nikt nie
przypisał, mają jedną listę na dole: to są wszystkie pomieszczenia zrobione na telefonie, bo
`SyncContract.roomToDoc()` nie ma czego wysłać. Są **wypisane, nie ukryte** — ukrycie
wyglądałoby jak zgubienie.

**3. „Nie da się przypisać pokoju do projektu” — i miał rację w trzech miejscach naraz.**

- Formularz na `/projekty/` wkładał pomieszczenie do **aktywnego** projektu, nie pytając
  i nie mówiąc o tym ani słowa. Teraz ma listę projektów, domyślnie aktywny, plus
  **„— bez projektu —”** jako prawdziwą odpowiedź; wiersz pomieszczenia ma tę samą listę do
  przeniesienia, w tym samym kształcie, co lista pomieszczeń przy wierszu kalkulacji.
- **Ten sam formularz gubił przecinek.** Oddawał `wsDim()` surowy tekst z pola, więc „3,5”
  czytało się jako `Number("3,5")` → `NaN` → 0: pokój wpisany tak, jak wpisuje Polak,
  wychodził `3 × 0 × 2,6 m`. Formularz na ekranie projektu parsował to od zawsze; ten nie.
  Znalazł to test tej paczki, nie czytanie kodu.
- **`addRoom()` w `/app/` w ogóle nie zapisywał `projectId`.** Pomieszczenie założone na
  koncie nie należało do niczego i nie mogło się nigdy pokazać pod projektem. Przy okazji
  `tombstone()` wysyła teraz z `{ merge: true }` — z tego samego powodu, dla którego robi to
  push: zwykłe `setDoc` kasowało przy oznaczaniu wiersza za usunięty **każde pole, o którym
  przeglądarka nie wie** (notatkę materiału, projekt pomieszczenia).

**4. „Projekty” w menu tylko dla zalogowanych — rozstrzygnięcie otwartej decyzji §8.1.**
Zakres jest węższy, niż brzmi, i ta różnica jest tu najważniejsza. `level` trasy zostaje
`GUEST`: strona nie jest bramkowana i **nie może być**, bo to statyczny plik nad wierszami
w `localStorage` **tej** przeglądarki, a `FIRESTORE_SYNC` §1.2 mówi, że liczenie nigdy nie
wymaga konta. Nowe pole `navLevel` decyduje wyłącznie o **linku**. Strona zostaje
indeksowana i zostaje w `sitemap.xml`; gość, który wejdzie z linku „Otwórz projekt” pod
zapisanym wynikiem, widzi swoje projekty.

Link jest w HTML dla każdego — chowa go arkusz stylów, i tylko wtedy, gdy dokument niesie
`data-lm-level`. **Bez JavaScriptu klasa `.js` nigdy nie zostaje dopisana, więc reguła nie
działa**: Googlebot i przeglądarka bez skryptu widzą link dalej. Poziom stemplowany jest
w skrypcie w `<head>`, tym samym, który stosuje motyw — jeden odczyt `localStorage` więcej
i zero mignięcia; `assets/account.js` ładuje się na końcu dokumentu i jest na to za późno.
Znacznik `liczmat-signed-in` **nadal jest podpowiedzią i nadal niczego nie bramkuje**.

- Sprawdzone: **224 nowe sprawdzenia — 4496/4496 przechodzi** (3100 logiki + 1396
  w Chromium), a wszystkie 4272 sprzed tej paczki nadal przechodzą. Żadnego nowego pliku
  testowego nie trzeba było: sprawdzenia doszły tam, gdzie mieszka temat —
  `test-projects.mjs` (nawigacja i poziomy), `test-rooms.mjs` i `test-rooms-page.mjs`
  (wybór projektu, link w menu), `test-account.mjs` i `test-account-page.mjs` (cztery
  zakładki, menu, `projectId`), `test-pages.mjs` (pomiar rzędu nagłówka).
  Sprawdzone **negatywnie dziewięć razy** — link pokazywany wszystkim, znacznik poziomu
  niewypisywany do `<li>`, brak zakładki „Aplikacja”, brak stempla poziomu w `<head>`
  (dwa razy: raz w logice, raz w przeglądarce, bo pierwsza wersja tego sprawdzenia **nie
  protestowała** i trzeba było ją przepisać, żeby mierzyła pozycję skryptu, a nie jego
  istnienie), `/app/` bez `projectId`, `/app/` z jednym linkiem, formularz ignorujący wybór
  projektu i nagłówek bez zaciskania na 1160 px — za każdym razem test faktycznie protestuje.
- Kontrast: bez nowej pary. `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

**Następne zadanie: Sesja 21 — LICZMAT PRO: FUNDAMENT.**

### Co zrobiła Sesja 20

Rozdział XVIII w całości: „Pomieszczenia są elementem projektu", przykład `Projekt: Remont
łazienki / Pomieszczenie: Łazienka / Wymiary: 2,4 × 3,2 × 2,5 m`, do tego „Kalkulacje mogą
być przypisane do konkretnego pomieszczenia" i „Nie promuj pomieszczeń jako osobnego
wielkiego modułu na homepage".

**Kontrakt mówi coś dokładnie przeciwnego niż rozdział XVIII, i to jest cała konstrukcja tej
sesji.** `FIRESTORE_SYNC.md` §2 stawia pomieszczenia w `users/{uid}/rooms/{roomId}` — **obok**
projektów, nie w nich — i pisze wprost dlaczego: „Wybór pokoju i wybór kalkulatora to dwie
niezależne osie". To nie jest niedopatrzenie: pomieszczenie jest fizycznym miejscem, przeżywa
projekt, dla którego je zmierzono, i jedno pomieszczenie może obsłużyć kilka projektów.

Oba zdania są prawdziwe, bo powiązanie jest **polem**, a pole przeżywa synchronizację.
Sprawdzone w repo `3d-polednia/Materio` **dla pomieszczeń osobno**, nie przepisane z Sesji 18:

- `RoomEntity` nie ma kolumny `projectId`, a `SyncContract.roomToDoc()` nie zapisuje takiego
  klucza — telefon nigdy go nie wyśle;
- `CloudSync.pushLocal()` wysyła każde pomieszczenie przez
  `.set(SyncContract.roomToDoc(...), SetOptions.merge())`, a merge zapisuje **wyłącznie
  klucze, które dostał**;
- wdrożone reguły walidują `validRoom()` po kształcie i **nie mają `hasOnly`** → serwer
  przyjmuje zapis;
- `roomFromDoc()` czyta po kluczach i ignoruje nieznane → kopia w telefonie jest bezpieczna.

Czego to **nie** daje: telefon nie **pokaże** przypisania, bo nie ma go gdzie trzymać.
Powiązanie jest przenoszone, nie gubione — dokładnie tak jak notatka materiału z Sesji 18 —
i formularz mówi to odwiedzającemu wprost, zamiast obiecywać coś, czego nie ma.

**Znalezisko: serwis wpisywał `projectId` do każdego pomieszczenia od początku istnienia
magazynu i ani razu go nie przeczytał.** Pole było w `wsAddRoom()` od zawsze, żaden ekran go
nie używał, a `/app/` **nie wysyłał go w ogóle** — więc powiązanie ginęło na granicy
przeglądarki, a pobranie konta nadpisywało je pustką. Ta sesja je wysyła, czyta i pozwala
zmienić. Przy okazji `tombstone()` w `assets/app.js` wysyła teraz z `{ merge: true }` z tego
samego powodu, dla którego robi to push: zwykłe `setDoc` kasowało przy oznaczaniu wiersza za
usunięty **każde pole, o którym przeglądarka nie wie** — notatkę materiału i teraz projekt
pomieszczenia.

**Ekran projektu dostał sekcję „Pomieszczenia", i stoi ona nad kalkulacjami.** Taka jest
kolejność z rozdziału XIV (nazwa, opis, **pomieszczenia**, kalkulacje, materiały, koszty) i
taka jest kolejność przykładu z rozdziału XVIII: projekt → pomieszczenie → wymiary. Wiersz
mówi `2,4 × 3,2 × 2,5 m`, a obok — podłoga, ściany i kubatura, liczone `wsRoomAreas()`, czyli
**tą samą funkcją**, którą pasek „weź wymiary z pomieszczenia" wypełnia kalkulator. Dwie
odpowiedzi na „ile ma metrów ta podłoga" rozjechałyby się w tydzień. Edycja jest formularzem
w wierszu — nie `prompt()`, z powodu, dla którego Sesja 15 go stąd wyrzuciła — a pod polami
leci ta sama linijka wyniku, co przy dodawaniu.

**Usunięcie projektu nadal nie kasuje jego pomieszczeń, i to jest decyzja, nie zaniechanie.**
`ProjectRepository.recordTombstones()` w aplikacji nagrobkuje wyceny i pozycje zakupowe i na
tym kończy, bo pomieszczenia nie są podkolekcją projektu. Kasowanie ich tutaj znaczyłoby, że
to samo kliknięcie daje inny wynik w przeglądarce i na telefonie — argument Sesji 17,
nietknięty. Pomieszczenie zostaje i **zachowuje swoje `projectId`**, dzięki czemu „Cofnij"
przywraca projekt razem z jego pomieszczeniami zamiast z pustą listą.

**Przypisanie kalkulacji siedzi w `inputJson`, pod kluczem `_room`.** `EstimationEntity` ma
`projectId` i nie ma `roomId`. Pole na najwyższym poziomie dokumentu **przeżyłoby** merge —
to nadal prawda — ale `inputJson` jest polem, które **już** jest kontraktem, wolnym tekstem
i wraca nietknięte, i Sesja 16 włożyła tam migawkę dokładnie z tego powodu. Drugi mechanizm
do tej samej roboty to druga rzecz do pilnowania. `_room` stoi **obok** `manual`, na
najwyższym poziomie mapy, a nie w `_lm`: wiersz wpisany ręcznie nie ma migawki, a może
należeć do pomieszczenia.

**Przypisuje się w dwóch miejscach i w obu widać tylko pomieszczenia właściwego projektu.**
Przy zapisie wyniku — lista obok wyboru projektu, z pomieszczeniem wybranym już wtedy, gdy to
z niego wzięto wymiary — i później, listą przy każdym wierszu kalkulacji na ekranie projektu.
`wsAddEstimation()` odrzuca cudze pomieszczenie, więc oferowanie go byłoby oferowaniem
przypisania, które i tak przepada; projekt bez pomieszczeń nie dostaje listy w ogóle
(rozdział XXV zabrania przycisku, za którym nic nie ma).

**Lista pomieszczeń na `/projekty/` mówi teraz, do którego projektu należy które.** Bez tego
te same trzy nazwy w dwóch mieszkaniach są nie do odróżnienia. Pomieszczenie bez projektu —
czyli takie, jakie przychodzi z telefonu, bo `roomToDoc()` nie ma czego wysłać — nie mówi nic
zamiast zgadywać, i nadal wypełnia kalkulator.

**Czego ta sesja świadomie nie zrobiła.** Pomieszczeń nie ma na stronie głównej ani
w nawigacji — ostatnie zdanie rozdziału XVIII zabrania tego wprost. Materiał nie dostał
pomieszczenia: rozdział mówi o kalkulacjach, a lista zakupów jest jedna na projekt, bo kupuje
się raz. Grupowania kalkulacji w drzewo „po pomieszczeniach" też nie ma — wiersz mówi, do
którego należy, a przebudowa listy to zmiana ekranu, nie zmiana z rozdziału XVIII.

- Sprawdzone: **229 testów logiki + 136 testów w Chromium — 365/365 przechodzi**, a
  wcześniejsze 1117 + 112 + 180 + 415 + 596 + 251 + 147 + 331 + 121 + 177 + 90 + 70 + 166 +
  134 nadal przechodzą (razem **4272**). Dwa nowe pliki: `scripts/test-rooms.mjs` (bez
  zależności) i `scripts/test-rooms-page.mjs`. Ten drugi **niczego nie podstawia** — ani
  kalkulator, ani `/projekty/` nie dotykają sieci — więc otwiera prawdziwe strony, klika to,
  co klika odwiedzający, i czyta jedno i drugie: co narysowano i co wróciło do magazynu.
  W tym: pomieszczenie dodane do otwartego projektu z przecinkiem jako separatorem
  dziesiętnym, poprawione w swoim wierszu, porzucona edycja, usunięcie nietykające
  kalkulacji, kalkulator wypełniony z pomieszczenia i wynik trafiający pod nie, ten sam
  wiersz przenoszony do drugiego pomieszczenia i wyjmowany ze wszystkich, projekt bez
  pomieszczeń nieoferujący listy, indeks nazywający projekt przy każdym pomieszczeniu,
  cztery języki, przełączenie języka przyciskiem na otwartym projekcie, przełączenie waluty
  nieruszające żadnego wymiaru, szerokości z rozdziału XXVIII (320 / 375 / 390 / 430 / 768 /
  1280 px) z formularzem edycji na ekranie i wariant z wyłączonym JavaScriptem.
  Testy logiki sprawdzone **negatywnie cztery razy**: pomieszczenie niepamiętające projektu,
  usunięcie projektu kaskadujące na pomieszczenia, przyjmowanie cudzego pomieszczenia i
  `roomId` wymyślony jako własne pole dokumentu — za każdym razem test faktycznie protestuje.
  Test w przeglądarce sprawdzony negatywnie trzy razy (lista oferująca wszystkie
  pomieszczenia, projekt pokazujący cudze, wiersz bez kubatury).
- Kontrast: bez nowej pary — wiersz i formularz pomieszczenia wydają wyłącznie tokeny, które
  już przechodziły. `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

**Następne zadanie: Sesja 21 — LICZMAT PRO: FUNDAMENT** (model Free / Pro, bez płatności:
uprawnienia, feature gating, status planu, struktura Pro).

### Co zrobiła Sesja 19

Rozdział XVII w całości: „Materiały mogą mieć ceny", przykład `Klej | 7 × 35 PLN | = 245
PLN`, waluta zgodna z wybraną przez użytkownika, projekt pokazujący **koszt materiałów,
inne koszty i sumę projektu**, i zdanie na końcu: „Nie buduj z tego systemu księgowego."

**Cena jednostkowa jest dzieleniem, nie polem — i to jest cała konstrukcja tej sesji.**
Kontrakt trzyma na pozycji zakupowej jedną kwotę, `estimatedCostMinor`, i jest to
**całość**. Sprawdzone w `3d-polednia/Materio`, nie z pamięci: `ShoppingItemEntity` nie ma
kolumny na cenę jednostkową, `validShoppingItem()` w regułach jej nie waliduje,
`ShoppingCsvExporter` jej nie drukuje. Własne pole obok kontraktu **przeżyłoby**
synchronizację — to ustaliła Sesja 18 przy notatce i nadal jest prawdą — ale mogłoby się
rozjechać z kwotą, bo telefon umie zmienić ilość albo koszt, nie dotykając pola, o którym
nic nie wie. „35 PLN za sztukę" obok sumy, która nie jest już 7 × 35, jest gorsze niż brak
ceny jednostkowej. Dzielenie nie ma jak skłamać.

Dzielenie jest przy tym **dokładne dla wszystkiego, co ten serwis zapisał do tej pory**:
każdy silnik liczy `cost = units × price`, więc kwota podzielona przez ilość oddaje dokładnie
tę cenę, którą odwiedzający wpisał w kalkulatorze. **Stare projekty dostają ceny bez żadnej
migracji** — wiersz zapisany tydzień temu czyta się dziś jako „15 opak. × 49,99 = 749,85".

**Zapis idzie w drugą stronę: ilość × cena.** Obie liczby są w formularzu obok siebie, więc
zapisywana jest ich suma, zaokrąglona **raz**, na końcu. Zmiana 7 na 8 przy 35 PLN daje 280.
Sama ilość, bez ceny, nadal nie przelicza niczego — reguła Sesji 18 została nietknięta i jej
test też. Pod polami leci linijka „7 × 35,00 zł = 245,00 zł", liczona tą samą funkcją, którą
liczy magazyn — żeby zapisana kwota nie była niespodzianką.

**Waluta: rozdział XVII kontra rozdział VI, rozstrzygnięte po kwocie.** Pozycja, która nigdy
nie miała kwoty, dostaje walutę wybraną przez odwiedzającego — to jest „waluta zgodna
z wybraną przez użytkownika". Pozycja, która **już** trzyma 245 PLN, zostaje przy PLN, nawet
gdy odwiedzający przełączył się na euro: przestemplowanie zrobiłoby z 245 zł 245 €, czyli
przeliczenie po kursie 1:1, którego rozdział VI zabrania. Etykieta pola mówi, w jakiej
walucie się wpisuje, więc nie trzeba tego zgadywać.

**Trzy figury i zasada „każda kwota liczona raz".** Zapisanie kalkulacji tworzy **dwa**
dokumenty niosące tę samą kwotę — wiersz kosztorysu i materiał (rozdział XVI) — więc dodanie
obu list do siebie podwoiłoby rachunek projektu zrobionego z samych kalkulacji. Stąd:

```
koszt materiałów = lista zakupów + kalkulacje, które nie mają na niej swojego materiału
inne koszty      = wiersze wpisane ręcznie
suma projektu    = jedno + drugie
```

Materiał wygrywa z kalkulacją, bo to jego cenę odwiedzający edytuje. Kalkulacja bez
materiału — pozycja sprzed Sesji 17 albo taka, której materiał zdjęto z listy — wchodzi do
sumy sama, bo inaczej pieniądze znikałyby po cichu z rachunku, mimo że wiersz nadal stoi na
liście kalkulacji. Ta sama suma jest teraz na liście projektów i na pulpicie, więc „ile
kosztuje ten projekt" ma jedną odpowiedź w trzech miejscach.

**„Inne koszty" to nie nowy magazyn.** To wiersze kosztorysu wpisane ręcznie —
`wsAddManualEstimation()` pisze je od zawsze i od zawsze zostawia w `inputJson` znacznik
`manual`, którego dotąd nic nie czytało. Ekran projektu daje im własną sekcję i własny
formularz, wkładający je do **otwartego** projektu (`/kosztorys/` nie nazywa projektu, bo
tamta strona jest o aktywnym). Lista kalkulacji pokazuje od teraz wyłącznie to, co policzył
kalkulator: wiersz wpisany ręcznie stoi w swojej sekcji i nie jest drukowany dwa razy.

**Cena jedzie też w udostępnionym linku.** `/p/<token>` dzieli tak samo, w trzech linijkach
bez żadnej biblioteki, więc klient dostaje „7 worków × 30,00 zł" zamiast jednej kwoty, której
nie ma jak sprawdzić.

**Czego ta sesja świadomie nie zrobiła.** `/kosztorys/` nadal sumuje **wiersze kosztorysu**,
więc po ręcznej zmianie ceny materiału jego suma i suma projektu mogą się różnić. To nie jest
przeoczenie: kosztorys jest dokumentem tego, co policzono, a „materiały, robocizna, koszty,
marża, suma, waluta" to **Sesja 24 (WYCENY)**. Marży, narzutu i podatku tu nie ma — rozdział
XVII kończy się zdaniem „Nie buduj z tego systemu księgowego".

- Sprawdzone: **147 testów logiki + 134 testy w Chromium — 281/281 przechodzi**, a
  wcześniejsze 1117 + 112 + 180 + 415 + 596 + 251 + 331 + 177 + 70 + 90 + 166 + 121 nadal
  przechodzą (razem **3907**). Dwa nowe pliki: `scripts/test-costs.mjs` (bez zależności)
  i `scripts/test-costs-page.mjs`. Ten drugi **niczego nie podstawia** — ani kalkulator, ani
  `/projekty/` nie dotykają sieci — więc otwiera prawdziwe strony, klika to, co klika
  odwiedzający, i czyta jedno i drugie: co narysowano i co wróciło do magazynu. W tym: cena
  wpisana w kalkulatorze wracająca jako cena jednostkowa materiału, ilość zmieniana przy tej
  samej cenie, materiał wpisany ręcznie z ceną, koszt „inny" trafiający do otwartego projektu
  zamiast do aktywnego i znikający z sumy po usunięciu, cztery języki, przełączenie języka
  przyciskiem na otwartym projekcie, przełączenie waluty nieruszające żadnej kwoty przy
  jednoczesnym wycenieniu nowej pozycji w nowej walucie, szerokości z rozdziału XXVIII
  (320 / 375 / 390 / 430 / 768 / 1280 px) i wariant z wyłączonym JavaScriptem.
  Testy logiki sprawdzone **negatywnie trzy razy**: podwójne liczenie kalkulacji i jej
  materiału, przestemplowanie waluty przy każdej zmianie ceny i cena zapisana jako własne
  pole obok kontraktu — za każdym razem test faktycznie protestuje. Test w przeglądarce
  sprawdzony negatywnie raz (wiersz bez ceny jednostkowej — cztery sprawdzenia padają).
  Jedno sprawdzenie z Sesji 18 zmieniło treść, bo zmieniło się zachowanie: formularz
  materiału **ma** teraz pole ceny, a zmiana ilości w nim przelicza kwotę.
- Kontrast: bez nowej pary — suma projektu wydaje `--accent-strong` na `--surface-alt`,
  czyli parę sprawdzaną już dla linku w takiej sekcji. `scripts/check-contrast.mjs`:
  wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 18

Rozdział XXXII wymienia pięć rzeczy: **edycja, własne materiały, jednostki, ilości,
notatki**. Rozdział XVI mówi to samo pełnym zdaniem: użytkownik ma móc „edytować ilość,
zmienić nazwę, zmienić jednostkę, usunąć materiał, dodać własny materiał, dodać notatkę”.
Usunięcie zrobiła Sesja 17. Ta robi pozostałe pięć — łącznie z notatką, której trzy
poprzednie sesje uznały za niemożliwą.

**Notatka jest możliwa, a powód, dla którego nie była, był nieprawdziwy.** Sesje 15, 16
i 17 napisały — każda powołując się na poprzednią — że pole dołożone do dokumentu obok
kontraktu zostanie skasowane przez telefon „bez słowa”. Sprawdziłem to w kodzie zamiast
przepisać po raz czwarty. Połowa jest prawdą: `SyncContract.*ToDoc()` faktycznie buduje
dokument z ustalonej mapy, więc telefon nigdy takiego pola nie wyśle. Druga połowa była
błędna — `CloudSync.pushLocal()` wysyła tę mapę tak:

```kotlin
.set(SyncContract.shoppingItemToDoc(item, estimationRemoteId), SetOptions.merge())
```

**Merge zapisuje wyłącznie klucze, które dostał.** Pozostałe pola dokumentu zostają
nietknięte. Każdy zapis w `CloudSync.kt` jest merge'em, nagrobki też. Ustalona mapa nie
kasuje tego, o czym nie wspomina.

Sprawdziłem też trzy pozostałe bramki, każdą w pliku:

- wdrożone reguły walidują `validShoppingItem()` po kształcie i **nie mają `hasOnly`** →
  serwer zapis przyjmuje;
- `shoppingItemFromDoc()` czyta po kluczach i ignoruje nieznane → nie zepsuje kopii
  w telefonie;
- nic po stronie telefonu nie nadpisuje pozycji zakupowej bez merge'a.

Notatka siedzi więc w polu `note` na pozycji zakupowej, limit 500 znaków, i **przeżywa
synchronizację w obie strony**. Czego to nie daje: telefon jej nie **pokaże**, bo
`ShoppingItemEntity` nie ma kolumny — jest niewidoczna w aplikacji i nie ma jej w tamtejszym
eksporcie CSV, dopóki repo aplikacji nie doda kolumny. Notatka jest **przenoszona, nie
gubiona**, i formularz mówi to odwiedzającemu wprost, zamiast obiecywać coś, czego nie ma.
To jedyne pole w całym magazynie poza kontraktem i test pilnuje, że **jedyne** — drugie
wymyślone pole nadal wywala sprawdzenie.

**Edycja jest formularzem w wierszu materiału.** Zmienia nazwę, ilość, jednostkę, alejkę
i notatkę — cztery z pięciu punktów rozdziału XXXII naraz. Nie `prompt()`, z tego samego
powodu, dla którego Sesja 15 go stąd wyrzuciła. **Ceny w formularzu nie ma i to jest
świadome**: `estimatedCostMinor` to rozdział XVII, czyli Sesja 19, więc zmiana ilości
zostawia koszt tam, gdzie był, zamiast przeliczać go z ceny jednostkowej, której nikt
jeszcze nie podał. Test sprawdza wprost, że pola ceny nie ma.

**Własny materiał to wiersz, którego nic nie policzyło.** `estimationId` jest `null`, koszt
zerowy, „skąd ta liczba” nie ma — ta sama odpowiedź, którą Sesja 16 dała pozycji wpisanej
ręcznie na `/kosztorys/`. Formularz jest złożony, bo zwykłą drogą na listę jest strzałka
z wyniku, a to jest wyjątek. Po dodaniu znika nazwa i notatka, a **jednostka i alejka
zostają** — przy trzech materiałach z rzędu to zwykle te same dwie wartości.

**Jednostki: pole wolnego tekstu z podpowiedziami.** Rozdział XVI prosi, żeby jednostkę dało
się zmienić, więc lista (`opak.`, `szt.`, m², m, kg, l) podpowiada i niczego nie ogranicza.
Pierwsze dwie idą przez słownik, więc Niemcowi podpowiadają „Pack.” i „Stk.”, nie polski
skrót. Lista alejek jedzie z buildu w `window.LM_PROJ.aisles` — `/projekty/` nie ładuje
12 kB katalogu materiałów po piętnaście słów.

**Zmiana wynikająca wprost ze znaleziska: `/app/` wysyła teraz z `{ merge: true }`.**
Przeglądarka zawsze wysyła komplet pól kontraktu, więc dla nich merge i podmiana to ten sam
zapis — ale podmiana kasowała **każde pole, o którym przeglądarka nie wie**. Czyli:
telefon chroni notatkę, a przeglądarka by ją skasowała przy pushu z urządzenia, które jej
nie pobrało. Teraz obie strony robią to samo.

**Notatka jedzie też w udostępnionym linku.** `shareProject()` kopiuje całe dokumenty, więc
`/p/<token>` dostaje ją bez żadnej zmiany po tamtej stronie — klient dostaje „antracyt, ten
sam co w kuchni” obok tego, ile czego kupić.

- Sprawdzone: **251 testów logiki + 165 testów w Chromium — 416/416 przechodzi**, a
  wcześniejsze 1117 + 111 + 180 + 415 + 596 + 331 + 121 + 90 + 177 + 70 nadal przechodzą
  (razem **3624**). Oba pliki materiałowe rozbudowane, żadnego nowego nie trzeba było.
  Testy logiki sprawdzone negatywnie trzy razy — koszt idący za ilością (czyli Sesja 19
  wchodząca tu bokiem), notatka bez przycięcia, własny materiał udający policzony — i za
  każdym razem test faktycznie protestuje. W przeglądarce: formularz otwierający się
  w jednym wierszu i tylko w jednym, przecinek jako separator dziesiętny, porzucenie
  edycji, pusta nazwa nieprzechodząca, edycja kończąca się przy wyjściu z projektu,
  dodanie własnego materiału z czyszczeniem połowy pól, cztery języki i notatka, która
  jako jedyna (obok nazwy) się **nie** tłumaczy, bo to słowa odwiedzającego.
- Kontrast: bez nowej pary — formularz wydaje wyłącznie tokeny, które już przechodziły.
  `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 17

Rozdział XVI dorysowuje strzałce z Sesji 16 czwarty człon: **KALKULATOR → WYNIK → DODAJ DO
PROJEKTU → MATERIAŁ TRAFIA DO LISTY**, z przykładem „Płytki | 26,4 m², Klej | 7 worków,
Fuga | 4 kg”.

**Lista materiałów była w kontrakcie od pierwszej wersji i nikt jej po stronie web nie
zapisywał.** To nie jest nowy pomysł tej sesji, tylko brakująca połowa czegoś, co po
drugiej stronie działa od dawna — sprawdzone w repo `3d-polednia/Materio`, nie z pamięci:

- `users/{uid}/projects/{id}/shoppingItems/{itemId}` stoi w `docs/FIRESTORE_SYNC.md` §2,
- ma własną encję Room (`ShoppingItemEntity`) i własne `SyncContract.shoppingItemToDoc()`,
- ma **wdrożoną** regułę walidującą `validShoppingItem()` w `config/firebase/firestore.rules`,
- `assets/share.js` **renderuje ją** na `/p/<token>` od 2026-08-08,
- a `CalculatorViewModel.save()` w aplikacji Android **zapisuje pozycję listy przy każdym
  zapisie kalkulacji**: wstawia wycenę, bierze zwrócone id i wstawia obok pozycję zakupową.

Serwis wstawiał samą wycenę. Skutek: projekt zrobiony w przeglądarce docierał na telefon
i do udostępnionego linku z **pustą** listą materiałów, a ten sam projekt zrobiony na
telefonie — z pełną. Blok „lista zakupów” na `/p/<token>` nie mógł się nigdy pokazać.
Ta sesja dokłada drugą połowę, w tej samej kolejności i z tymi samymi polami.

**Dwa pola różnią się od wiersza kosztorysu i to one robią z tego listę zakupów.**
`quantity` jest **liczbą, nie liczbą całkowitą** — `requiredUnits` to `Int` w Room
i `d.requiredUnits is int` w regułach, więc wiersz kosztorysu umie powiedzieć wyłącznie
„26”, a materiał umie powiedzieć **26,4 m²**, czyli dokładnie pierwszy przykład rozdziału
XVI. `materialCategory` jest tu **wolnym tekstem**, a na wycenie nazwą enuma: to alejka
w markecie, jedzie jako nazwa (`TILES`), nigdy jako słowo, więc wiersz **zapisany po polsku
czyta się po niemiecku** — klucze `cat_*` są te same, których używa wybór materiału. Nazwa
materiału jest jedyną rzeczą w wierszu, która się nie tłumaczy: `name` to w kontrakcie
tekst i nie ma go gdzie indziej trzymać, dokładnie tak samo jak w wierszu kosztorysu i tak
samo jak zapisuje ją telefon.

**Lista jest na ekranie projektu, pod kalkulacjami.** Kalkulacje odpowiadają „ile to
kosztowało i skąd ta liczba”; materiały odpowiadają „co włożyć do koszyka” — inne pytanie,
inny kształt: nazwa, ilość, alejka, kwota i **pole do odhaczenia**, bo `isPurchased` jest
w kontrakcie od początku i nic po stronie web nigdy go nie ustawiało. Pod nagłówkiem stoi
licznik „kupione 2 z 7”. Pusta lista mówi, jak się na nią coś dostaje, zamiast pokazywać
nic (rozdział XXV).

**Czego rozdział XVI wymienia, a czego ta sesja świadomie nie dopisała: notatki, własne
materiały, edycja ilości, nazwy i jednostki.** `ShoppingItemEntity` nie ma kolumny na
notatkę, a `shoppingItemToDoc()` buduje dokument z ustalonej mapy — czyli ten sam mur, o
który rozbił się opis projektu w Sesji 15. To wszystko jest **Sesją 18** („edycja, własne
materiały, jednostki, ilości, notatki”), a notatka dodatkowo wymaga zmiany kontraktu po
stronie aplikacji. Ceny i podsumowanie kosztów to **Sesja 19** (rozdział XVII), więc pod
listą nie ma sumy — byłaby to praca następnej sesji.

**Dwie decyzje podjęte przez zgodność z aplikacją, nie z gustu.**

- **Pozycja wpisana ręcznie na `/kosztorys/` nie tworzy materiału.**
  `wsAddManualEstimation()` istnieje dla robocizny, dostawy i worka kupionego na oko;
  „Robocizna · 8 h” na liście zakupów jest gorsza niż krótsza lista.
- **Usunięcie jednej kalkulacji nie usuwa jej materiału.** `ProjectRepository` w repo
  aplikacji kaskaduje wyłącznie przy usunięciu **projektu** — `recordTombstones()`
  nagrobkuje wtedy i wyceny, i pozycje zakupowe — a usunięcie samej wyceny nie rusza listy
  zakupów. Robienie tu inaczej znaczyłoby, że to samo kliknięcie daje inny wynik
  w przeglądarce i na telefonie. Usunięcie projektu kaskaduje po obu stronach, a „Cofnij”
  z Sesji 15 przywraca **dokładnie te** materiały, które zabrało, i nie wskrzesza tego,
  który odwiedzający skasował wcześniej ręcznie.

**Synchronizacja: `/app/` wysyła teraz materiały, a odbierała je od zawsze.**
`downloadAccount()` czytał `shoppingItems` od czasu napisania zakładki synchronizacji, ale
`wsImport()` wyrzucał tę kolekcję, bo lokalnie nic jej nie produkowało — więc pobranie
konta z telefonu gubiło całą listę zakupów po cichu. Teraz push wysyła obie podkolekcje
projektu, a import bierze cztery kolekcje zamiast trzech. Wiersz „w tej przeglądarce” liczy
też materiały.

**Znaleziony i naprawiony błąd zastany: przełącznik języka w stopce nie działał.**
Każda strona ma przełącznik **dwa razy** — w nagłówku i w kolumnie „Język” w stopce — a
`assets/i18n-runtime.js` zapisywał wybór tylko z nagłówka (`menu.querySelectorAll`).
Kliknięcie „English” w stopce polskiej strony przechodziło na `/en/…`, po czym
przekierowanie na zapamiętany język zawracało odwiedzającego na polską — bo wybór, którego
właśnie dokonał, nie został nigdzie zapisany. Dotyczyło **wszystkich 128 stron publicznych**
i było widoczne raz na sesję (przekierowanie jest strzeżone znacznikiem w `sessionStorage`).
Teraz zapisują wybór wszystkie linki `a[data-lang]`, w nagłówku i w stopce. Znalazł to test
tej sesji, przy próbie przeczytania polskiego materiału po angielsku.

- Sprawdzone: **132 testy logiki + 114 testów w Chromium — 246/246 przechodzi**, a
  wcześniejsze 1117 + 111 + 180 + 415 + 596 + 331 + 121 + 90 + 177 + 70 nadal przechodzą
  (razem **3454**). Dwa nowe pliki: `scripts/test-materials.mjs` (bez zależności)
  i `scripts/test-materials-page.mjs`. Ten drugi **niczego nie podstawia** — ani kalkulator,
  ani `/projekty/` nie dotykają sieci — więc otwiera prawdziwą stronę kalkulatora, klika
  „Dodaj do projektu” i czyta materiał na ekranie projektu jedną nawigację dalej. W tym:
  jedno kliknięcie w przeglądarce, która nie ma żadnego projektu, odhaczenie i odznaczenie
  pozycji, usunięcie pozycji nietykające kalkulacji, usunięcie projektu z „Cofnij”
  przywracającym całą listę, cztery języki, przełączenie języka **przyciskiem** na otwartym
  projekcie, przełączenie waluty nieruszające ani ilości, ani kwot, szerokości z rozdziału
  XXVIII (320 / 375 / 390 / 430 / 768 / 1280 px) z polem do odhaczenia na ekranie i nie
  mniejszym niż 16 px, oraz wariant z wyłączonym JavaScriptem. Testy logiki są dodatkowo
  sprawdzone negatywnie: trzy zepsucia po kolei (brak strzałki, brak kaskady, pozycja ręczna
  trafiająca na listę) i za każdym razem test faktycznie protestuje.
- Kontrast: bez nowej pary — wiersz materiału wydaje wyłącznie tokeny, które już
  przechodziły. `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 16

Rozdział XV rysuje strzałkę: **KALKULATOR → WYNIK → DODAJ DO PROJEKTU → PROJEKT**, a pod
nią stawia warunek — zapis ma zachować tyle, żeby użytkownik później zrozumiał, **jaki
kalkulator** został użyty, **jakie dane wpisał**, **jaki wynik** dostał, **w jakich
jednostkach** i **kiedy** to policzył. „Nie zapisuj tylko samej liczby, jeśli później nie
będzie wiadomo, skąd się wzięła.”

Serwis miał pierwszy człon strzałki i połowę drugiego. Przycisk „Dodaj do projektu”
wrzucał wynik do projektu **aktywnego** — tego, którego odwiedzający nie wybierał w tym
miejscu i którego nazwy nie widział, dopóki nie poszedł na inną stronę — a zapisana pozycja
niosła nazwę, liczbę, jednostkę i koszt. Skąd ta liczba, **nie mówiło nic**.

**Migawka siedzi w `inputJson` i nie mogła siedzieć nigdzie indziej.** Dokument wyceny
(`FIRESTORE_SYNC.md` §2) nie ma pola na kalkulator: `calculationType` ma cztery wartości na
piętnaście narzędzi, więc płytki, zaprawa, wylewka i jedenaście innych to ta sama
`SURFACE_COVERAGE`. Dołożenie własnego pola na najwyższym poziomie dokumentu to ten sam mur,
o który rozbił się opis projektu w Sesji 15 — `SyncContract.estimationToDoc()` buduje
dokument z ustalonej mapy, więc telefon skasowałby je przy najbliższej synchronizacji **bez
słowa**. Jedyne pole kontraktu, które jest wolnym tekstem i **wraca nietknięte**, to
`inputJson`: jest kolumną `EstimationEntity`, aplikacja zapisuje w nim własną migawkę
(`SnapshotJson`, `ignoreUnknownKeys = true`) i **nigdy nie czyta cudzej** — sprawdzone
w repo `3d-polednia/Materio`, nie z pamięci. Migawka poszła więc **do środka**, pod klucz
`_lm`, obok płaskiej mapy pól, która była tam wcześniej i została dokładnie tam, gdzie była.

**W migawce nie ma ani jednego słowa w języku strony.** Pole jedzie jako klucz słownika
(`fld_area`), wybór z listy jako własny klucz (`opt_yes`), wiersz wyniku jako klucz plus
token silnika (`|n:21.6| m²`), jednostka jako `res_pkgs`. Dlatego pozycja **zapisana po
polsku czyta się po niemiecku** — test klika to od początku do końca. Gdyby zapisać
etykiety, zostałyby polskie na zawsze. Klucze biorą się z nowych `data-lk` i `data-ok`,
które build wypisuje przy każdym polu formularza; test pilnuje, że ma je **każde pole
każdego z piętnastu kalkulatorów** i że każdy taki klucz tłumaczy się w czterech językach.

**Projekt się wybiera, a po zapisie jest do niego link.** Obok przycisku stoi lista
projektów (z pozycją „+ Nowy projekt”, bo pierwszy wynik zwykle wyprzedza pierwszy projekt),
a po zapisie pasek mówi, do którego projektu pozycja trafiła, i prowadzi **prosto do
niego** — to jest trzeci człon strzałki z rozdziału XV, którego wcześniej nie było. Jedno
kliknięcie nadal wystarcza: bez żadnego projektu lista się nie pokazuje, a przycisk zakłada
pierwszy projekt sam, bo wynik, którego nie da się zapisać przed założeniem czegokolwiek, to
wynik stracony. Wybór listy jest **tym samym** „projektem aktywnym”, którym posługują się
kosztorys i pulpit — dwie odpowiedzi na to samo pytanie rozjechałyby się w tydzień.
Zarchiwizowany projekt nie przyjmuje pozycji ani z listy, ani ze starej zawartości pickera.

**Na ekranie projektu pozycja tłumaczy się sama.** Pod wierszem jest złożona sekcja „Skąd ta
liczba”: kalkulator (linkiem z powrotem do niego), wpisane dane z etykietami, wynik
z wierszami, które pokazywał panel, i **moment** obliczenia z godziną. Złożona, bo projekt
z tuzinem pozycji to najpierw lista, a dopiero potem rachunki. Pozycja sprzed tej sesji
i pozycja wpisana ręcznie na `/kosztorys/` **nie dostają sekcji w ogóle** — pusta „skąd”
jest gorsza niż żadna, a rozdział XXV zabrania przycisku, za którym nic nie ma.

**`assets/units.js` — nowy plik, 2 kB, i powód, dla którego trzy strony kłamały.** Odmiana
liczebnika istniała od Sesji 9, ale mieszkała w pliku silników; `/projekty/`, `/kosztorys/`
i pulpit go nie ładują (25 kB arytmetyki, żeby wypisać jedno słowo), więc mówiły
**„1 pozycji”** — to była otwarta decyzja z Sesji 15, przypisana do sesji 16–19. Sesja 16
i tak musiała wypisać na `/projekty/` „15 opak.” z zapisanego klucza, więc odmiana
i podstawianie `|tokenów|` wyszły do wspólnego pliku, a trzy strony dostały to samo
zdanie co kalkulator: 1 pozycja / 2 pozycje / 5 pozycji, w czterech językach.

**Znaleziony i naprawiony błąd zastany: przełączenie języka gubiło otwarty projekt.**
Linki językowe pisze build, który zna strony, ale nie zna stanu — a od Sesji 15 stanem jest
`?id=<projectId>` w adresie. Przełączenie języka na otwartym projekcie zabierało więc na
**listę** projektów, z projektem gubionym po drodze; to samo robiło automatyczne
przekierowanie na wybrany wcześniej język. Teraz link językowy i przekierowanie niosą
`location.search` — identyfikator powstał w tej przeglądarce, więc znaczy to samo w każdym
języku. Znalazł to test tej sesji, przy próbie przeczytania polskiej pozycji po niemiecku.

**Limit 20 000 znaków na `inputJson` przestał być cichy.** Kod obcinał ten string
`slice(0, 20000)`, czyli w najgorszym razie zostawiał **JSON, którego nic nie sparsuje**.
Migawka powiększyła plik, więc limit zaczął mieć znaczenie: teraz przy przekroczeniu
odpada **najpierw migawka** (dane wpisane przez człowieka są ważniejsze), a to, co zostaje,
zawsze parsuje się jako JSON. Dotyczy dwóch kalkulatorów rozkroju, gdzie lista elementów
jest wolnym tekstem — tysiąc pozycji to lista rzadka, ale prawdziwa.

- Sprawdzone: **596 testów logiki + 70 testów w Chromium — 666/666 przechodzi**, a
  wcześniejsze 1117 + 111 + 180 + 415 + 331 + 121 + 90 + 177 nadal przechodzą (razem
  **3208**). Dwa nowe pliki: `scripts/test-save.mjs` (bez zależności)
  i `scripts/test-save-page.mjs`. Ten drugi **niczego nie podstawia** — ani kalkulator, ani
  `/projekty/` nie dotykają sieci — więc otwiera prawdziwą stronę, klika to, co klika
  odwiedzający, i czyta jedno i drugie: co narysowano i co wróciło do magazynu. W tym:
  jedno kliknięcie w przeglądarce bez niczego, wybór projektu i założenie nowego z listy,
  druga kalkulacja unieważniająca poprzedni komunikat „zapisano”, pozycja zapisana po
  polsku i przeczytana po niemiecku po przełączeniu języka **przyciskiem**, szerokości
  z rozdziału XXVIII (320 / 375 / 390 / 430 / 768 / 1280 px) z rozwiniętą sekcją „skąd ta
  liczba” i wariant z wyłączonym JavaScriptem, w którym przycisku zapisu **nie ma**, bo
  magazyn pisze skrypt.
- Kontrast: bez nowej pary — sekcja „skąd ta liczba” wydaje wyłącznie tokeny, które już
  przechodziły. `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — z `assets/calculators.js` **wyszła** odmiana
liczebnika i podstawianie tokenów (do `assets/units.js`, bez zmiany treści), silniki bez
zmian, a `scripts/test-calculators.mjs` przechodzi 1117/1117 tak jak przedtem.

### Co zrobiła Sesja 15

Rozdział XXXII mówi w całości: **„CRUD projektów”**. Serwis miał do tej pory pół litery
z czterech: projekt dało się dodać, listę dało się zobaczyć, a zmiana nazwy i usunięcie
były `prompt()` i `confirm()` — dwoma oknami przeglądarki. Projektu **nie dało się
otworzyć**: nie było ekranu, na którym jeden projekt jest tematem strony.

**Projekt ma teraz własny ekran: `/projekty/?id=<projectId>`.** Trasa `project` była
zadeklarowana w `src/ia.mjs` od Sesji 3 jako `PLANNED` z sesją 15 i dokładnie tym
adresem; ta sesja zamieniła ją w ekran. Liczba wygenerowanych stron się nie zmieniła —
131 przed i 131 po — i to jest cała konstrukcja: **id projektu robi się w przeglądarce
i nigdy nie będzie katalogiem**, bo GitHub Pages serwuje pliki i nie umie przepisywać
adresów (ta sama ściana, o którą rozbija się `/p/<token>`).

**Nowe pojęcie w architekturze: `view` — ekran bez własnego pliku.** Trasa-widok to nadal
trasa: ma poziom dostępu, rodzica, miejsce w przepływie i wiersz w inwentarzu, ale
`livePaths()` jej nie liczy, bo plikiem jest plik rodzica. Build sprawdza o niej siedem
rzeczy, z których najważniejsza jest ta, że **adres widoku leży wewnątrz adresu
rodzica** — widok wskazujący gdzie indziej byłby stroną, której build nigdy nie napisze
i której braku nigdy by nie zauważył. **Wszystkie osiem sprawdzeń przetestowanych
negatywnie** — nie opisem, tylko kodem: `scripts/test-projects.mjs` psuje każde po kolei
i sprawdza, że build faktycznie protestuje, po czym przywraca.

**Poziom trasy: `GUEST`, wbrew deklaracji z Sesji 3 (`LICZMAT`)** — trzeci raz to samo
pytanie, opisane w `docs/ARCHITEKTURA.md` §8.1b. Tym razem jest wymuszone konstrukcyjnie:
widok jest wpisywany w `/projekty/`, czyli w ten sam plik, więc nie może wymagać więcej
niż strona, która go rysuje — inaczej `/projekty/` musiałoby bramkować kawałek samego
siebie. Build tego pilnuje wprost. Poza tym nie ma tu czego bramkować: projekt jest
wierszem w `localStorage` **tej** przeglądarki.

Cztery litery CRUD-a, po kolei:

- **C — dodanie** działało i zostało. Nowy projekt od razu staje się aktywny, czyli tym,
  do którego trafia następny zapisany wynik.
- **R — odczyt.** Ekran projektu to nagłówek z jego nazwą, **historia** (kiedy powstał,
  kiedy ostatnio się zmienił — dwa stemple, które kontrakt synchronizacji i tak trzyma,
  a których dotąd nie widział nikt), **podsumowanie** (liczba pozycji i suma, z plakietką
  „różne waluty” zamiast sumy, która nic nie znaczy) oraz **kalkulacje**: pozycje zapisane
  w tym projekcie, z ilością, jednostką, kwotą i datą. Adres, pod którym nie ma projektu,
  nie jest błędem — przeglądarka, w której go zrobiono, jest jedyną, która go kiedykolwiek
  miała, więc strona mówi dokładnie to i daje drogę powrotną.
- **U — zmiana.** Nazwa: formularz **na stronie**, obok projektu, którego dotyczy. Do tej
  sesji było to `prompt()`. Doszło **archiwum**: pole `archived` jest w kształcie dokumentu
  i w regułach bezpieczeństwa od pierwszej synchronizacji i **nic nigdy go nie ustawiało**.
  Zarchiwizowany projekt wypada z listy, z pulpitu i z wyboru na kosztorysie, nic z niego
  nie ginie, a jeżeli był aktywny — aktywny staje się ten, którego się nadal używa, bo
  inaczej następny zapisany wynik wpadłby do projektu odłożonego na bok.
- **D — usunięcie.** Pytanie zadaje **strona**, nie `confirm()`, a po usunięciu jest
  **„Cofnij”**. Usunięcie zawsze było nagrobkiem (`deletedAt`, `FIRESTORE_SYNC` §3), więc
  cofnięcie nic nie kosztuje — dziwne było raczej pytać dwa razy i nie dawać drogi
  powrotnej. Usunięcie oddaje **listę identyfikatorów**, które nagrobkowało, a cofnięcie
  bierze tę listę: przywraca dokładnie te wiersze i **nie wskrzesza** pozycji, którą
  odwiedzający skasował wcześniej ręcznie. Pierwsza wersja rozpoznawała je po znaczniku
  czasu i test to złapał — dwa usunięcia w tej samej milisekundzie nie do odróżnienia.

**Dlaczego `prompt()` i `confirm()` wyleciały.** To okna przeglądarki: nie da się ich
ostylować, po otwarciu nie sięga do nich żaden przekład strony, kilka przeglądarek je
po prostu tłumi, a na telefonie zasłaniają dokładnie tę rzecz, którą się zmienia —
rozdział XXVIII prosi o odwrotność. Test pilnuje, że nie wróciły.

**Znaleziony i naprawiony błąd zastany: `materio-active-project` zostawał z martwym id.**
Usunięcie aktywnego projektu miało przekazać aktywność dalej przez
`if (wsActiveProjectId() === id) …`, ale w chwili tego porównania wiersz był już
nagrobkiem, więc `wsActiveProjectId()` **odpowiadał już następnym projektem** — warunek
nie trafiał nigdy i w `localStorage` zostawał identyfikator skasowanego projektu. Nic się
przez to nie psuło widocznie, bo odczyt i tak rozwiązuje id od nowa, ale klucz kłamał.
Teraz zapis jest bezwarunkowy. Znalazł to test w przeglądarce, nie czytanie kodu.

**Czego rozdział XIV wymienia, a czego ta sesja świadomie nie dopisała: opis, notatki.**
Reguły sprawdzają kształt dokumentu, a nie listę pól, więc przeglądarka mogłaby to
zapisać — ale `SyncContract.projectToDoc()` w repo `3d-polednia/Materio` buduje dokument
z ustalonej mapy, a `ProjectEntity` nie ma gdzie takiego pola trzymać, więc telefon
nadpisałby całość przy najbliższej synchronizacji i opis zniknąłby **bez słowa**. To jest
zmiana kontraktu (`FIRESTORE_SYNC.md`, `SyncContract.kt`, encja Room + migracja), czyli
praca po stronie aplikacji — rozdział VII. **Do decyzji właściciela** (patrz otwarte
decyzje). Pomieszczenia, materiały, koszty i zapis kalkulacji mają własne sesje (20, 17,
19, 16), więc nie ma po nich pustych sekcji: rozdział XXV zabrania martwego przycisku,
a pusty nagłówek jest tym samym, tylko cichszym.

**Pomieszczenia przestały być odpinane przy usuwaniu projektu.** Kasowały wtedy jedyną
informację potrzebną do cofnięcia, a pomieszczenie to fizyczne miejsce, które i tak
przeżywa projekt zmierzony dla niego. Nic tego dziś nie renderuje po projekcie (to sesja
20), więc zmiana nic nie kosztuje, a kupuje całe cofnięcie.

- Sprawdzone: **415 testów logiki + 177 testów `/projekty/` w Chromium — 592/592
  przechodzi**, a wcześniejsze 1117 + 111 + 180 + 331 + 121 + 90 nadal przechodzą
  (razem **2542**). Dwa nowe pliki: `scripts/test-projects.mjs` (bez zależności)
  i `scripts/test-projects-page.mjs`. Ten drugi **niczego nie podstawia** — strona nie
  dotyka sieci — więc sadza magazyn w `localStorage`, otwiera stronę, klika to, co klika
  odwiedzający, i czyta jedno i drugie: co narysowano i co wróciło do magazynu. W tym:
  usunięty projekt niepokazujący się na żadnym z dwóch ekranów, zarchiwizowany schowany
  pod złożonym „Archiwum”, projekt w dwóch walutach oznaczony zamiast zsumowany, przycisk
  wstecz wracający na listę (bo otwarcie projektu to zwykła nawigacja, a nie zakładka),
  cztery języki, przełączenie waluty niezmieniające ani kwoty, ani ilości, szerokości
  wymienione w rozdziale XXVIII (320 / 375 / 390 / 430 / 768 / 1280 px) na **obu** ekranach
  i wariant z wyłączonym JavaScriptem.
- Kontrast: bez nowej pary — pasek „Cofnij” wydaje `--on-accent-soft` na `--accent-soft`,
  czyli parę, którą sprawdzano już dla panelu wyniku (9,98:1 w jasnym, 11,41:1
  w ciemnym). `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 14

Rozdział XXXII wymienia cztery rzeczy: **projekty, ostatnie kalkulacje, szybkie akcje,
ostatnio używane narzędzia** — „dashboard darmowego użytkownika”. Trzy z nich serwis miał
skąd wziąć i nie pokazywał ich razem nigdzie; czwartej nie miał w ogóle.

**Pulpit jest teraz stroną: `/app/dashboard/`.** Trasa `dashboard` była zadeklarowana
w `src/ia.mjs` od Sesji 3 jako `PLANNED` z tym właśnie adresem; ta sesja zamieniła ją
w stronę. Build pilnuje jednego i drugiego: strona, której nie ma w architekturze, przerywa
build, a trasa zadeklarowana i niezbudowana też. Oba przypadki sprawdzone negatywnie —
celowo zepsute, build faktycznie padł.

**Pulpit nie ładuje Firebase i to jest cała jego konstrukcja.** Wszystko, co pokazuje,
leży już w tej przeglądarce: projekty i pozycje kosztorysu w `assets/workspace.js`
(w kształcie dokumentu Firestore), lista użytych narzędzi w nowym `assets/recent.js`.
To pierwszy ekran po zalogowaniu — kazać mu czekać na pobranie SDK i na odpowiedź
serwera, zanim wypisze czyjeś własne, lokalne projekty, znaczyłoby zrobić pulpit
wolniejszym od kalkulatora, z którego się na niego wchodzi. Poziom w pasku bierze się ze
znacznika `liczmat-signed-in`, czyli z podpowiedzi — więc **decyduje o treści i nic nie
bramkuje**.

**Poziom trasy: `GUEST`, wbrew deklaracji z Sesji 3 (`LICZMAT`).** To jedyna decyzja
architektoniczna tej sesji i jest opisana w `docs/ARCHITEKTURA.md` §8.1a. Pole `level`
mówi, czego strona **wymaga**. Pulpit nie wymaga niczego — jedyną rzeczą, na której dałoby
się postawić bramkę, jest znacznik, który bywa nieaktualny (wylogowanie w innej karcie,
wygasły token), więc bramka schowałaby komuś jego własne projekty dokładnie w chwili
wygaśnięcia tokena. Gość widzi swoje dane i kartę „Ten pulpit jest tylko w tej
przeglądarce” z linkiem do rejestracji. **Właściciel zatwierdził `GUEST` (2026-08-13).**

**Adres: `/app/dashboard/`, nie `/app/pulpit/`.** Sesja 3 zadeklarowała polski slug na
stronie, która nie ma wersji językowych — obok bezjęzykowych `/app/` i `/p/`. Właściciel
rozstrzygnął to tego samego dnia, zanim slug zdążył się utrwalić: strona wyszła na świat
kilka godzin wcześniej i nic z zewnątrz na nią nie linkowało, więc zmiana kosztowała jeden
build zamiast wiecznego przekierowania. Widoczna nazwa zostaje przetłumaczona
(`nav_dashboard`: „Pulpit”, „Übersicht”, „Dashboard”, „Панель”) — zmienił się wyłącznie URL.

Cztery listy, cztery źródła:

- **Projekty** — cztery ostatnio ruszane, z liczbą pozycji, sumą i datą; aktywny jest
  oznaczony, „Otwórz” ustawia projekt jako aktywny i przechodzi do kosztorysu, czyli robi
  obie rzeczy zamiast kazać wybierać projekt jeszcze raz stronę dalej. Projekt z pozycjami
  w dwóch walutach dostaje plakietkę **„różne waluty”** z pełnym zdaniem w tytule: suma
  różnych walut nic nie znaczy, a rozdział VI zabrania przeliczać po kursie.
- **Ostatnie kalkulacje** — pięć ostatnio zapisanych pozycji kosztorysu, z projektem,
  ilością, jednostką i kwotą. Czytane jako **to, co zostało zachowane**, a nie „co ktoś
  wpisał”: serwis nigdzie nie zapisuje obliczeń, których nikt nie kazał zapisać, i
  dokładanie takiego magazynu wpisywałoby cudze dane do `localStorage` bez pytania.
  Zapisana pozycja trzyma walutę, w której powstała — przełączenie waluty jej nie
  przepisuje.
- **Szybkie akcje** — cztery kafle: policz, projekty, kosztorys, konto. To zwykłe linki
  z prawdziwym adresem wpisanym przez build, więc **działają bez JavaScriptu**; skrypt
  tylko przestawia je na język, który odwiedzający wybrał.
- **Ostatnio używane narzędzia** — cztery ostatnie kalkulatory, z ikoną z centrum
  kalkulatorów i datą.

**Nowy magazyn: `liczmat-recent-calcs` (`assets/recent.js`, 2 kB).** Trzyma **wyłącznie
identyfikator kalkulatora i czas** — żadnych danych wejściowych, żadnych wyników, żadnych
cen. Jest **lokalny i nie synchronizuje się**: nie ma go w `docs/FIRESTORE_SYNC.md`, bo
historia klikania w narzędzia to nie jest praca, którą warto przenosić na telefon. Jest
wypisany na `/cookies/` w czterech językach obok pozostałych kluczy `liczmat-*`, a na
samym pulpicie jest przycisk, który go kasuje — to historia odwiedzającego, więc kasuje
ją odwiedzający, na stronie, która ją pokazuje.

**Kalkulator zapisuje się do tej listy dopiero, gdy ktoś poprosił o liczbę.** Zdarzenie
`calcresult` leci również przy wczytaniu strony — to jest strona doganiająca samą siebie,
bo panel wyniku przychodzi z buildu już policzony (Sesja 8). Bez rozróżnienia lista
wypełniłaby się każdym kalkulatorem, jaki ktokolwiek otworzył. Zdarzenie niesie więc
`byHand`, a `assets/calculators.js` zmieniło się **wyłącznie o to** — matematyka,
zaokrąglenia i jednostki nietknięte (rozdział XIII).

**Wejścia na pulpit są trzy**, żeby nie był stroną, do której trafia się z paska adresu:
link „Pulpit” w kolumnie „Konto” w stopce wszystkich 128 stron publicznych, przycisk obok
„Wyloguj” na `/app/` i adres w karcie rejestracji (`?next=/app/dashboard/`).

**Strona jest kolumną, nie siatką** (rozdział XXVIII, mobile-first), i nie ma w niej ani
jednego nowego komponentu: kafel to `.calc-link` z centrum kalkulatorów, wiersz to
`.data-list` z `/projekty/`. Nowe w arkuszu są odstępy sekcji i kolumna z liczbą po
prawej stronie wiersza.

- Sprawdzone: **180 testów logiki + 90 testów `/app/dashboard/` w Chromium — 270/270
  przechodzi**, a wcześniejsze 1117 + 111 + 331 + 121 nadal przechodzą (razem **1950**).
  Dwa nowe pliki: `scripts/test-dashboard.mjs` (bez zależności) i
  `scripts/test-dashboard-page.mjs`. Ten drugi **niczego nie podstawia** — pulpit nie
  dotyka sieci, więc test sadza dane w `localStorage`, otwiera stronę i czyta, co
  narysowała. W tym: szerokości, które rozdział XXVIII wymienia z nazwy (320 / 375 / 390 /
  430 / 768 / 1280 px) bez przewijania w bok i bez błędu w konsoli, przełączenie języka
  przerysowujące wiersze, daty i adresy linków, zapisana pozycja niezmieniająca waluty,
  skasowany projekt nietrafiający na listę, kalkulator, którego już nie ma, wyrzucany
  zamiast renderowany jako martwy kafel, nieaktualny znacznik sesji **niechowający**
  projektów, oraz wariant z wyłączonym JavaScriptem, w którym sześć linków nadal ma
  prawdziwe adresy.
- Kontrast: bez nowej pary — pulpit wydaje wyłącznie tokeny, które już przechodziły.
  `scripts/check-contrast.mjs`: wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` zmieniło się tylko o flagę
`byHand` na zdarzeniu.

### Co zrobiła Sesja 13

Rozdział XXXII wymienia sześć rzeczy: rejestrację, logowanie, wylogowanie, reset hasła,
profil i sesję użytkownika — „uwzględnić model GOŚĆ → LICZMAT → LICZMAT PRO”. Pięć
pierwszych serwis miał od 2026-08-08, ale jako jeden formularz z przełącznikiem: profilu
nie było wcale, sesji nie było widać poza `/app/`, a model trzech poziomów istniał
wyłącznie w `src/ia.mjs` jako pole trasy — nigdzie nie mówił odwiedzającemu, gdzie jest.

**Poziom przestał być komentarzem.** `ACCOUNT_LEVELS` w `src/ia.mjs` trzyma trzy poziomy
rozdziału II z nazwą, opisem i listą tego, co każdy potrafi; `/app/` renderuje z tego trzy
karty — raz dla gościa (żeby wiedział, co daje konto), raz w profilu (żeby wiedział, na
czym jest). Build sprawdza, że poziomy są trzy, w kolejności, każdy z własnym kluczem, że
żaden nie wskazuje nieistniejącej trasy i że każdy klucz `acc_*` istnieje w czterech
językach. Pięć nowych sprawdzeń, wszystkie przetestowane negatywnie — celowo zepsute,
build faktycznie padł.

**Poziom jest wyprowadzany, nie deklarowany.** `lmLevelOf()`: brak użytkownika → GOŚĆ,
zalogowany → LICZMAT, `users/{uid}.plan == "premium"` (ważny) → LICZMAT PRO. `plan`
i `planValidUntil` zapisuje wyłącznie serwer — reguły dopuszczają z profilu tylko
`lastSeenAt` i `appVersion` — więc przeglądarka poziom **czyta**, ale sobie go nie nadaje.
Test sprawdza to wprost: `plan: "pro"` i `plan: "PREMIUM"` **nie** dają Pro, a premium po
terminie wraca do LiczMat. Dziś `plan` nie zapisuje nic (brak Cloud Functions i Play
Billing, `FIRESTORE_SYNC.md` §9.2), więc karta Pro mówi „W przygotowaniu” i **nie ma
przycisku zakupu** — nie byłoby czego kupić, a rozdział XXV zabrania martwego przycisku.

**Rejestracja, logowanie i reset hasła to trzy widoki, nie jeden formularz z etykietą.**

- Jedno pole hasła obsługiwało oba tryby, z `autocomplete="current-password"`. Menedżer
  haseł przeglądarki czyta właśnie ten atrybut, więc na formularzu **zakładania** konta
  podpowiadał stare hasło. Teraz to dwa formularze: `current-password` i `new-password`.
- **Reset hasła nie miał własnego pola** — pożyczał adres z formularza logowania i przy
  pustym polu odpowiadał „Niepoprawny adres e-mail”, choć nikt niczego nie wpisywał. Ma
  własny widok, własne pole i własne zdanie, co się stanie.
- Widok zakładania konta mówi teraz, po co konto jest, i wprost: **kalkulatory liczą bez
  konta i tak zostanie** (rozdział II: „rejestracja ma być naturalnym kolejnym krokiem,
  a nie barierą”).
- Zdanie pod wynikiem kalkulatora prowadzi **prosto na formularz rejestracji**
  (`/app/?mode=signup&next=…`), a nie na logowanie z przełącznikiem do znalezienia. Po
  zalogowaniu jest przycisk powrotu na tę samą stronę. `lmSafeNext()` przepuszcza
  wyłącznie ścieżkę tego serwisu — `//gdzieś.example`, `javascript:` i adres z innym
  hostem są odrzucane, bo strona logowania, która przekierowuje gdziekolwiek, jest
  gotowym linkiem phishingowym z prawdziwą domeną.

**Profil, którego nie było.** Nowa zakładka: adres, sposób logowania, data założenia
i ostatniego użycia (z `users/{uid}`), nazwa konta, poziom i sesja. Nazwa idzie do
**Firebase Auth** (`updateProfile`), nie do Firestore — reguły odrzucają w profilu każde
pole poza trzema, więc dopisanie tam czegokolwiek dałoby 403. Test pilnuje jednego i
drugiego: nazwa trafia do Auth, a dokument profilu **nadal ma dokładnie trzy pola**.

**Sesja przestała być niewidzialna.** Do tej pory jedyną informacją „ktoś jest
zalogowany” było zdanie pod wynikiem kalkulatora.

- Nowy `assets/account.js` na **każdej** stronie (dwa kilobajty, zero sieci): trzyma
  poziom, czyta i zapisuje wskazówkę, i zaznacza kropką „Moje konto” w nagłówku.
  `liczmat-signed-in` niesie teraz poziom (`liczmat` / `pro`) zamiast `"1"`; stara
  wartość nadal czyta się jako „zalogowany”, więc nikt nie zostaje wylogowany przez
  wdrożenie. Nadal jest to **podpowiedź do treści, nigdy uprawnienie**.
- **„Pamiętaj mnie na tym urządzeniu”** — Firebase domyślnie trzyma sesję po zamknięciu
  przeglądarki (`browserLocalPersistence`), co jest właściwe dla telefonu i niewłaściwe
  dla cudzego komputera. Odznaczenie prosi o `browserSessionPersistence`; odpowiedź jest
  zapamiętana na urządzeniu (`liczmat-remember`) i da się ją zmienić w profilu, co
  przenosi także trwającą sesję. Oba klucze są wypisane na `/cookies/` w czterech
  językach.

**Dwa błędy zastane, znalezione przy pisaniu testu.**

- **Każde powtórne zdarzenie `onAuthStateChanged` zakładało drugi komplet nasłuchów.**
  Firebase woła je nie tylko przy logowaniu, ale też przy odświeżeniu tokena i po zmianie
  profilu. `onSignedIn()` przechodziło wtedy całą ścieżkę jeszcze raz: drugi
  `onSnapshot` na tych samych dwóch kolekcjach, kolejny odczyt profilu, i tak w kółko.
  Teraz powtórka dla tego samego `uid` tylko przerysowuje to, co mogło się zmienić.
- **Komunikat znikał sam.** Nasłuch kolekcji kończył się `status(fromCache ? … : "")`,
  więc pierwszy snapshot po zapisie **kasował** cokolwiek stało w pasku — „Nazwa
  zapisana.” gasło zanim ktokolwiek zdążył je przeczytać. Teraz „brak sieci” może
  skasować tylko samo siebie.

**Dostępność zakładek.** Pasek ma `role="tablist"`, co obiecuje czytnikowi ekranu
strzałki i jedno miejsce w kolejności tabulacji — i do tej sesji nie dotrzymywał tego:
działało wyłącznie kliknięcie. Doszły strzałki (z zawijaniem), Home/End, roving
`tabindex` oraz `aria-controls` / `aria-labelledby` wiążące zakładkę z panelem. Zakładek
jest teraz pięć; na 360 px zawijają się do dwóch rzędów i nic nie wyjeżdża w bok.

**Przełączenie języka na `/app/` przerysowuje to, co napisał JavaScript.** Strona nie ma
adresów per język i podmienia tekst w miejscu, więc pasek tożsamości, poziom, daty i obie
listy zostawały w poprzednim języku. Teraz `langchange` je odbudowuje.

- Sprawdzone: **111 testów logiki + 97 testów `/app/` w Chromium — 208/208 przechodzi**,
  a wcześniejsze 1117 + 331 nadal przechodzi (razem 1656). Dwa nowe pliki:
  `scripts/test-account.mjs` (bez zależności) i `scripts/test-account-page.mjs`.
  Ten drugi **podstawia SDK Firebase**: przechwytuje trzy importy z `gstatic.com`
  i odpowiada własnym modułem (konta w obiekcie, Firestore jako `Map`, każde wywołanie
  zapisane). Dzięki temu test dotyczy kodu tego repozytorium, a nie dostępności Google —
  i w ogóle daje się uruchomić z kontenera, który do `gstatic.com` nie dociera. Czego
  **nie** sprawdza: czy samo Firebase zachowuje się tak, jak zakłada `assets/app.js`.
  To jest weryfikacja na żywo i **nikt jej po tej sesji nie powtórzył** — patrz problemy.
- Kontrast: nowa para (nagłówek i lista na karcie poziomu, na którym stoisz) — 15,57:1
  w jasnym, 12,63:1 w ciemnym. Wszystkie pary nadal przechodzą.

Matematyka kalkulatorów nietknięta — `assets/calculators.js` bez zmian.

### Co zrobiła Sesja 12

Rozdział XXXII wymienia osiem rzeczy do przetestowania: matematykę, dane wejściowe,
jednostki, wyniki, wartości graniczne, mobile, lokalizację i waluty w częściach
finansowych. Do tej sesji serwis nie miał żadnych testów — `CLAUDE.md` mówił wprost
„there is no test suite". Teraz ma dwa skrypty, oba zatwierdzone w repozytorium, i oba
znajdują się na liście plików.

- **`scripts/test-calculators.mjs` — 1117 sprawdzeń, wszystkie przechodzą.** Czysta
  logika, zero zależności, uruchamia się samym `node` tak jak build. Siedem sekcji
  odpowiada siedmiu punktom rozdziału XXXII, które da się sprawdzić bez przeglądarki.
  Liczby oczekiwane są **wyprowadzone ręcznie ze wzoru**, który dany silnik dokumentuje —
  nie odczytane z poprzedniego uruchomienia, bo wtedy test potwierdzałby błąd zamiast go
  znaleźć. Dwa silniki są heurystykami, nie wzorami (pakowanie 1D i gilotynowe 2D); tam
  ręcznie wyprowadzone jest tylko to, co ma jedną możliwą odpowiedź — dokładne
  kafelkowanie, element większy od arkusza, obrót decydujący o zmieszczeniu się — a
  reszta jest zapisana jako punkt odniesienia i mówi o tym w komentarzu.
- **`scripts/test-pages.mjs` — 331 sprawdzeń, wszystkie przechodzą.** Te same kalkulatory
  w Chromium: 15 stron × 360 / 414 / 768 / 1280 px bez przewijania w bok i bez błędu
  w konsoli, panel wyniku, przycisk „Oblicz ponownie", ostrzeżenie „dane się zmieniły",
  Enter w polu, komunikat błędu po wpisaniu 0, cztery języki, przełącznik waluty i wariant
  z wyłączonym JavaScriptem. Jedyna zależność — Playwright — **leży poza repozytorium**,
  bo serwis nie ma `package.json` ani `node_modules` i mieć nie będzie. Bez Playwrighta
  skrypt mówi, że go pomija, i kończy się kodem 0.

**Znaleziony i naprawiony błąd: zaokrąglenie zmiennoprzecinkowe sprzedawało zbędne
opakowanie i gubiło profil.** To jedyna zmiana w logice, jaką ta sesja wprowadziła.

- Silniki liczą opakowania przez `⌈⌉`, a profile przez `⌊⌋ + 1`. Binarny float nie
  potrafi zapisać ani 0,4, ani 1,44, więc dzielenie, które **matematycznie wypada
  równo**, wypada obok: `21.6 / 1.44` to `15.000000000000002`, a `2.4 / 0.4` to
  `5.999999999999999`.
- Skutek dla odwiedzającego: podłoga **21,6 m²** przy paczce **1,44 m²** (domyślny gres
  60×60 z presetu) to dokładnie 15 paczek, a kalkulator kazał kupić **16**. W drugą
  stronę sufit **2,4 m** przy rozstawie **0,4 m** ma 7 profili CD, a kalkulator liczył
  **6** — czyli lista zakupów była o jeden profil za krótka. To nie są wartości
  egzotyczne: 2,4 m, 4,8 m i 1,2 m to zwykłe wymiary pomieszczeń, a 0,4 m to domyślny
  rozstaw na formularzu.
- Naprawa to `snap()` w `assets/calculators.js`: wartość leżąca bliżej niż jedna
  miliardowa **względem** liczby całkowitej jest do niej przyciągana, zanim zaokrąglenie
  podejmie decyzję. Tolerancja jest względna i **wyklucza zero** — kawałek metra
  kwadratowego nadal wymaga całego opakowania. Prawdziwa reszta jest miliony razy większa
  i dalej idzie w górę: 21,61 m² to nadal 16 paczek, a 1,21 m przy 0,4 m to nadal
  4 profile. Test pilnuje obu stron dziesięcioma przypadkami granicznymi.
- **Żadna z 130 stron nie zmieniła treści po tej naprawie** — wartości, z jakimi otwiera
  się każdy formularz, akurat w tę pułapkę nie wpadały. Błąd dotykał wyłącznie liczb
  wpisanych przez odwiedzającego, czyli był niewidoczny dla każdego sprawdzenia, jakie
  robiły poprzednie sesje.
- **Aplikacja Android dzieli tak samo i ma ten sam błąd.** `core/calculation/**` to
  oryginał, z którego przeniesiono te silniki. Poprawka jest po stronie repo
  `3d-polednia/Materio` i **nie należy do zakresu prac nad webem** (rozdział VII) — patrz
  otwarte decyzje.

Co jeszcze test potwierdził, a co wcześniej nikt nie sprawdzał:

- **Pusty formularz ≠ wpisane zero.** Wszystkie 15 kalkulatorów: puste pole bierze
  wartość domyślną, wpisane `0` zostaje zerem — a tam, gdzie zero nie ma sensu (worek
  0 kg, 0 warstw), silnik odmawia zamiast po cichu podstawić 25 kg albo 1 warstwę.
- **Każdy kalkulator odmawia** pustego formularza, samych liter i ujemnej ceny — 45
  sprawdzeń, po trzy na kalkulator.
- **Jednostka zgadza się z tym, co policzono** — kafelki w opakowaniach, zaprawa
  w workach, płyty G-K w płytach; 15 sprawdzeń plus istnienie każdego klucza jednostki
  we wszystkich czterech językach.
- **Odmiana liczebnika działa poprawnie**: 1 worek / 2 worki / 64 worków po polsku
  i ukraińsku, dwie formy po niemiecku i angielsku, a skrót („opak.", „szt.") nie odmienia
  się nigdy. Przy okazji: **21 to „worków", nie „worki"** — pierwsza wersja testu miała tu
  złe oczekiwanie, silnik był od początku poprawny.
- **Żaden wiersz wyniku nie zostawia nieprzetłumaczonego `|klucza|`** w żadnym z czterech
  języków — 15 kalkulatorów × 4 języki × każdy wiersz.
- **Separator dziesiętny idzie za językiem, waluta za wyborem odwiedzającego.**
  Przełączenie PLN → EUR → USD → UAH zmienia wyłącznie symbol: liczba paczek, metry
  kwadratowe i kilogramy stoją w miejscu, a kwota 749,85 zostaje kwotą 749,85. Nic nie
  jest przeliczane po kursie, zgodnie z rozdziałem VI.

### Co zrobiły Sesje 10 i 11

Właściciel zlecił obie naraz, świadomie zawieszając rozdział XXXV na ten przebieg.
Zakres razem: **pozostałe dwanaście kalkulatorów** — grupa 2 (Malowanie: farby/tynki,
tapety; Budowa: beton z worka, wylewka, murowanie, ocieplenie) i grupa 3 (Rozkrój 1D
i 2D; Zabudowa G-K: ściana działowa, sufit podwieszany, G-K na klej, poszycie).

Motyw obu sesji jest jeden i wyszedł już przy grupie 1: **silniki liczą więcej, niż
strona pokazuje.** Kotlinowe wyniki (`SurfaceWasteResult`, `WallpaperResult`,
`InsulationResult`, `CeilingGridResult`, `SheathingResult`, `StudWallResult`) niosą
pola, które port wyrzucał do kosza. Nic z poniższych nie jest nową matematyką — to
liczby, które silnik i tak miał w ręku.

- **Dwa panele wyniku były puste.** „Tapety” pokazywały samo „3 rolek”, „Poszycie
  (OSB/deski)” samo „11 arkuszy”. Tapety mają teraz pasy (`stripsNeeded` × długość pasa)
  i pasy z rolki (`stripsPerRoll`) — czyli dokładnie to, co tłumaczy, dlaczego raport
  wzoru podnosi liczbę rolek. Poszycie: pole arkusza, powierzchnia z zapasem i to, co
  arkusze faktycznie pokryją.
- **Tapety przestały milczeć o przypadku granicznym.** Gdy pas jest dłuższy niż cała
  rolka, silnik przechodzi na „jedna rolka na pas” — kotlinowy komentarz nazywa to
  `rough upper bound`. Strona pokazywała po prostu wynik, bez słowa. Teraz mówi to wprost
  zamiast wypisać „0 pasów z rolki”.
- **Ocieplenie pokazywało wiersz, który powtarzał pola formularza.** „Styropian 80 m² ·
  15 cm” to były te same dwie liczby, które stały nad nim w formularzu.
  `InsulationResult` zwraca dwie, które naprawdę tłumaczą liczbę opakowań: ile m² ma
  jedno opakowanie i ile pojedynczych płyt 0,5 m² z tego wychodzi (160 przy 80 m²).
- **Sufit podwieszany gubił kotwy.** `CeilingGridResult.perimeterAnchors` nie trafiało
  na stronę, więc lista zakupów była niepełna — profilu UD nie ma czym przykręcić do
  ścian.
- **Ściana działowa myliła słupki z profilami.** Na stronie były tylko „profile CW: 8 × 3
  m”, choć `studCount` i `studBars` to dwie różne liczby: ściana wyższa niż jedna sztanga
  potrzebuje dwóch profili na słupek. Teraz widać obie, plus powierzchnię ściany.
- **Dwie stałe zaszyte w kodzie stały się polami.** `TradeCalc.concrete` przyjmuje
  wydajność worka (12,5 l), `TradeCalc.screed` zużycie (2,0 kg/m²/mm) — obie jako
  parametry z wartością domyślną. Serwis miał je wpisane na sztywno, więc „40 worków”
  nie dało się sprawdzić z workiem w ręku, a produktu o innej gęstości nie dało się
  policzyć wcale. Są na formularzu, w wartościach domyślnych z Kotlina, więc liczba dla
  wartości, z jakimi otwiera się strona, nie drgnęła.
- **Rozkrój liniowy ucinał plan bez ostrzeżenia.** Plan cięcia pokazuje osiem sztang;
  przy dwunastu cztery znikały po cichu. Teraz jest wiersz mówiący, ile jeszcze zostało.
  Doszła też liczba elementów, bo lista wejściowa jest tekstem i łatwo się w niej pomylić.
- **Rozkrój płyt** dostał liczbę formatek, metry użyteczne i kupione — te same trzy
  liczby, z których i tak liczył się procent odpadu.
- **„2 rolek”, „2 płyt”, „2 sztang”, „2 arkuszy”.** Mechanizm odmiany z Sesji 9 obejmuje
  teraz wszystkie pięć jednostek, które serwis wypisuje słowem. `res_pkgs` („opak.”)
  i `res_pieces` („szt.”) zostają nieodmienne i takie zostaną — skrótu się nie odmienia.
- **Wpisane 0 znaczy 0.** Najgorsze były `|| 5` w murowaniu i `|| 10` w poszyciu:
  poproszenie o zerowy zapas po cichu dokładało 5 % albo 10 %. `orDefault()` obowiązuje
  teraz w każdym polu z wartością domyślną — a celowo nie tam, gdzie zero jest prawdziwą
  wartością (rzaz piły, zapas w kalkulatorze płytek).
- **Ujemna cena odrzucana we wszystkich piętnastu silnikach.** Rozkrój liniowy nie miał
  żadnej kontroli, rozkrój płyt zwracał „Podaj dodatnie wartości”, czyli komunikat
  o innym polu.
- **Każde pole ceny nazywa swoją jednostkę** — za rolkę, za sztangę, za arkusz, za płytę,
  za sztukę, za worek, za opakowanie. `fld_price` („Cena za sztukę/opak.”) nie jest już
  używane przez żaden kalkulator.
- **Wiersze wyniku mogą nieść słowa, nie tylko liczby.** `localizeRow()` tłumaczy teraz
  dowolny klucz w pionowych kreskach, a `|klucz:liczba|` dodatkowo odmienia go przez
  liczbę. Wcześniej umiał jedno słowo: litr. Bez tego połowy nowych wierszy nie dałoby
  się napisać raz na cztery języki.
- Sprawdzone: **976 testów silników + 442 testy stron w Chromium — 1418/1418 przechodzi.**
  Silniki: **488 kombinacji wejść puszczonych równolegle przez kod z Sesji 8** (`git show
  22ec3ec`) i przez nowy — liczba do kupienia i koszt zgadzają się co do jednego we
  wszystkich piętnastu kalkulatorach. Strony: osiem kalkulatorów × cztery języki
  (wynik z odmienioną jednostką, wiersze, przetłumaczone etykiety wierszy, brak
  niepodmienionego tokenu `|…|`, etykieta ceny, odmowa ujemnej ceny, brak błędów
  w konsoli), cztery stelażowe po polsku, przejście 1 → 3 → 8 rolek na jednej stronie
  (trzy formy liczby mnogiej), nowe pola betonu i wylewki realnie zmieniające wynik oraz
  brak przewijania w bok na wszystkich piętnastu stronach przy 360 i 1280 px.

### Co zrobiła Sesja 9

Pierwsza grupa kalkulatorów — **Płytki i wykończenie**: „Płytki, panele, gres”,
„Klej / zaprawa”, „Fuga”. Wzorzec UX ustaliła Sesja 8; ta sesja przeszła z nim przez trzy
konkretne narzędzia, pod regułą rozdziału XIII: „zachowaj działającą logikę, zmieniaj
matematykę tylko wtedy, gdy znaleziono konkretny błąd”.

- **Silniki sprawdzone z kodem aplikacji, nie z pamięcią.** `SurfaceWasteEngine.kt`,
  `TradeCalc.bagsByArea` i `TradeCalc.groutKg` w `3d-polednia/Materio` przeczytane linijka
  po linijce. Port jest wierny — wzory, zaokrąglenia i jednostki się zgadzają. Wypadły
  z tego dwie różnice, obie po stronie serwisu, obie opisane niżej.
- **Fuga odpowiada w workach, nie w kilogramach.** Panel pokazywał „DO KUPIENIA 3,2 kg”
  pod zdaniem, które ta sama strona ma w nagłówku: „Wynik zaokrąglamy do całych opakowań,
  tak jak w sklepie”. Koszt liczył się jako `⌈kg⌉ × cena` przy polu podpisanym „Cena za
  sztukę/opak.” — ani cena za kilogram, ani za opakowanie. Doszło pole **Worek (kg)**
  (domyślnie 5 kg, bo tyle waży `fuga-5` w `assets/materials.js`), a wynik to
  `⌈kilogramy ÷ worek⌉` — dokładnie ten sam krok, który „Klej / zaprawa” ma od zawsze.
  **Kilogramy się nie zmieniły**: `groutKg` jest nietknięty i stoi teraz jako wiersz
  „Razem” pod liczbą worków, razem z „Zużycie … kg/m²”. Aplikacja Android nie ma tu pola
  ceny w ogóle (`TradeViewModel`: „trade results are quantities without a price”), więc ten
  rachunek nigdy nie był portem — był dodatkiem serwisu.
- **Ujemna cena była przyjmowana.** Kotlinowy `SurfaceWasteEngine` odrzuca
  `pricePerPackage < 0`; port zgubił ten warunek, więc „−10” dawało ujemny koszt. Trzy
  silniki grupy 1 mają go z powrotem, z własnym komunikatem `err_price` zamiast
  „Podaj dodatnie wartości”, który mówiłby nie o tym polu.
- **Wpisane 0 przestało znaczyć „domyślne”.** `num(f.bag) || 25` nie odróżnia pustego pola
  od wpisanego zera i odpowiadało workiem 25 kg, o który nikt nie prosił. `orDefault()`
  rozróżnia: puste = domyślne, wpisane = wpisane, zero = błąd. Założone wtedy na dwa pola
  grupy 1; Sesje 10–11 rozciągnęły to na wszystkie pola z wartością domyślną.
- **„4 worków” → „4 worki”.** Liczebnik odmienia rzeczownik w trzech formach po polsku
  i ukraińsku (1 / 2–4 / 5+, nastki idą z ostatnią), w dwóch po niemiecku i angielsku,
  a skrót i symbol (kg, m², opak., szt.) w żadnej. `unitLabel()` w `assets/calculators.js`
  wybiera formę; klucz bazowy nadal trzyma formę „5+”, więc jednostka bez zadeklarowanych
  form renderuje się dokładnie jak wcześniej. Zrobione wtedy dla `res_bags`, czyli
  jedynej jednostki-słowa w grupie 1; reszta doszła w Sesjach 10–11. Ta sama poprawka idzie w ślad za wynikiem do kosztorysu
  (`assets/workspace-ui.js`), żeby zapisana pozycja nie mówiła „1 worków”.
- **Wynik mówi, ile naprawdę kupujesz.** Płytki: „Kupujesz 21,6 m²” — to `purchasedArea`,
  które kotlinowy raport liczy od zawsze i względem którego liczony jest odpad; bez tego
  strona podawała procent odpadu bez liczby, do której się odnosi. Fuga: kilogramy
  i kg/m². Klej miał kilogramy już wcześniej, ale wiersz nazywał się „kg” i miał wartość
  „100 kg” — etykieta to teraz „Razem”.
- **Cena mówi, za co.** Jedno „Cena za sztukę/opak.” na trzech stronach, na których
  odpowiedź jest w opakowaniach, workach i workach. Teraz „Cena za opakowanie” /
  „Cena za worek”. Pozostałe dwanaście kalkulatorów zostawało wtedy przy wspólnym
  `fld_price`; Sesje 10–11 dokończyły to dla wszystkich.
- **Fuga dostała skróty formatów.** Te same, które ma kalkulator płytek, bez panelu AC4
  (podłoga pływająca nie ma spoiny do wyfugowania). Wpisują tylko dwa wymiary; grubość
  i spoina zostają, bo format ich nie przesądza.
- Sprawdzone: **257 testów silników + 200 testów stron w Chromium — 457/457 przechodzi.**
  Silniki: siatka wejść puszczona **równolegle przez wersję sprzed tej sesji** (z `git
  show HEAD`) i przez nową — dwanaście kalkulatorów spoza grupy 1 co do bajta identyczne,
  a w grupie 1 identyczne liczby opakowań, worków i kilogramów. Do tego wartości graniczne
  (zero, tekst, wartość ujemna, przecinek dziesiętny, dokładne trafienie w opakowanie
  i jedno ponad) oraz wszystkie formy liczby mnogiej dla 1, 2, 4, 5, 11, 12, 14, 22, 25,
  101, 102 w czterech językach. Strony: cztery języki × trzy kalkulatory × (wynik
  z jednostką, wiersze, etykieta ceny, przeliczenie, ostrzeżenie „dane się zmieniły”,
  odmowa ujemnej ceny, wiersz kosztu, brak błędów w konsoli), skróty fugi, wybierak
  materiałów, wariant bez JavaScriptu, przełącznik waluty (przelicza etykietę, nie ilość),
  brak przewijania w bok przy 360 / 414 / 768 / 1280 px oraz pozostałe dwanaście
  kalkulatorów.

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

### Trzy testy sprawdzają cztery języki z dziesięciu — z Sesji 32

`test-projects-page.mjs`, `test-materials-page.mjs` i `test-costs-page.mjs` porównują to,
co widać na ekranie, z **ręcznie zatwierdzoną** tabelą słów: „Wszystkie projekty",
„Alle Projekte", „Усі проєкти", „All projects". Tabela ma cztery języki, bo powstała, gdy
serwis miał cztery. Po przywróceniu dziesięciu pętla chodziła po dziesięciu i **wywracała
się wyjątkiem** na piątym — Sesja 32 zawęziła pętlę do tego, co tabela nazywa, żeby test
w ogóle coś sprawdzał.

Zostaje decyzja właściciela: **czy dopisać pozostałe sześć języków**. To nie jest praca
programistyczna — tabela jest drugim źródłem prawdy właśnie po to, żeby złe tłumaczenie
w słowniku miało się o co rozbić, więc dopisanie jej z tego samego słownika nic nie da.
Sześć języków × trzy tabele × 4–5 słów to **przegląd tłumaczeń**, nie sesja QA.

### Opis i notatki projektu wymagają zmiany kontraktu — z Sesji 15

Rozdział XIV wymienia w projekcie **opis** i **notatki**. Sesja 15 ich nie dopisała
i zrobiła to celowo. Reguły bezpieczeństwa sprawdzają kształt dokumentu projektu, a nie
listę pól (`validProject` w `config/firebase/firestore.rules` nie ma `hasOnly`), więc
przeglądarka **mogłaby** zapisać dodatkowe pole i serwer by je przyjął. Problem jest po
drugiej stronie: `SyncContract.projectToDoc()` buduje dokument z ustalonej mapy
(`name`, `archived` + stemple), a `ProjectEntity` nie ma gdzie takiego pola trzymać — więc
telefon nadpisuje dokument w całości przy najbliższej synchronizacji i opis znika **bez
komunikatu, bez błędu i bez śladu**. To najgorszy możliwy sposób gubienia cudzych danych.

Zrobienie tego jak należy dotyka czterech rzeczy w repo `3d-polednia/Materio`:
`docs/FIRESTORE_SYNC.md` (kontrakt), `SyncContract.kt` (mapowanie w obie strony),
`ProjectEntity` (kolumna) i migracja Room. Plus ekran w aplikacji, jeżeli opis ma być
widoczny także na telefonie. **Poza zakresem prac nad webem** (rozdział VII) — **potrzebna
decyzja właściciela**, czy zlecić to jako etap w tamtym repo.

Do tego czasu strona projektu pokazuje to, co dokument naprawdę niesie: nazwę, stan
(w archiwum czy nie) i dwa stemple czasu jako „historię”.

**POPRAWKA z Sesji 18: powyższe zdanie „telefon nadpisuje dokument w całości" jest
nieprawdziwe.** `CloudSync.pushLocal()` wysyła każdy dokument przez
`.set(mapa, SetOptions.merge())`, a merge zapisuje **wyłącznie klucze, które dostał** —
reszta dokumentu zostaje nietknięta. Ustalona mapa w `projectToDoc()` jest prawdziwa, ale
nie kasuje tego, o czym nie wspomina. Sprawdzone w `CloudSync.kt`, nie z pamięci.

To **nie** znaczy, że opis projektu należy teraz dopisać po cichu. Znaczy, że powód był
zły, a prawdziwy jest inny i słabszy: pole, którego druga strona nie zna, jest polem
**niewidocznym na telefonie** i nieopisanym w `FIRESTORE_SYNC.md`. Dane nie giną — po
prostu nikt ich tam nie zobaczy. Decyzja właściciela dotyczy więc tego, czy opis ma być
widoczny w aplikacji (wtedy cztery pliki wyżej), a nie tego, czy w ogóle da się go zapisać.

**Notatka przy materiale — zrobiona w Sesji 18 na tej właśnie podstawie.** Rozdział XVI
wymienia „dodać notatkę”; serwis zapisuje ją jako pole `note` na pozycji zakupowej.
Wdrożona reguła `validShoppingItem()` nie ma `hasOnly`, więc serwer to przyjmuje;
`shoppingItemFromDoc()` ignoruje nieznane klucze, więc telefonowi to nie szkodzi; merge
niesie ją z powrotem. **Telefon jej jednak nie pokaże**, dopóki `ShoppingItemEntity` nie
dostanie kolumny — i tego dotyczy pytanie do właściciela: czy zlecić w repo aplikacji
kolumnę + migrację + wpis w `FIRESTORE_SYNC.md`, żeby notatka była widoczna także tam
(i w eksporcie CSV listy zakupów).

### ~~Odmiana liczebnika przy „pozycji”~~ — naprawione w Sesji 16

Było: wiersz projektu mówił „1 pozycji”, bo `unitLabel()` mieszkał w pliku silników,
którego `/projekty/`, `/kosztorys/` ani pulpit nie ładują. Sesja 16 wyjęła odmianę do
`assets/units.js` i wszystkie trzy strony dostały tę samą formę co kalkulator.

### ~~Ten sam błąd zaokrąglenia w aplikacji Android~~ — naprawione w Sesji 47

Silniki w `assets/calculators.js` są przeniesione 1:1 z `core/calculation/**`, a błąd
opisany wyżej siedzi w samym dzieleniu, nie w porcie: `ceil(21.6 / 1.44)` daje 16 zamiast
15 w każdym języku z binarnym floatem, więc **aplikacja liczy dziś to samo błędnie**.
Serwis został naprawiony, telefon nie. Zrównanie wymaga zmiany w repo
`3d-polednia/Materio` (odpowiednik `snap()` przy każdym `ceil`/`floor` w silnikach)
i osobnego wydania. **Poza zakresem prac nad webem** (rozdział VII) — **potrzebna decyzja
właściciela**, czy zlecić to jako etap w tamtym repo.

**Zlecone i zrobione: Sesja 47, 2026-08-27** (commit `b231bab` w repo aplikacji). `snap()`
stoi w `core/calculation/WasteMath.kt`, a wszystkie 22 zaokrąglenia w silnikach przechodzą przez
`ceilSnap`/`floorSnap`. Opis wyżej zostaje jako historia i jest dokładny co do samego błędu.
**Do użytkownika poprawka dociera dopiero z wydaniem AAB**, którego jeszcze nie ma.

### ~~Reguły Firestore~~ — wdrożone przez właściciela 2026-08-13, usuwanie konta działa

Poniższy opis zostaje, bo tłumaczy, dlaczego kod kasuje profil jako pierwszy — i tak ma
zostać.

### Aplikacja 1.10.1 na produkcji (2026-08-13)

Zbudowana i wysłana na kanał produkcyjny przez Play Developer API kontem `pracownik@`;
odczytane po zatwierdzeniu: release `1.10.1`, versionCode `11001`, status `completed`,
notatki w dziesięciu językach. Czeka na weryfikację Google. Zawiera poprawkę logowania
Google (`GetSignInWithGoogleOption` zamiast podpowiedzi one-tap, plus pokazywanie
prawdziwego powodu awarii) i tę samą co web zmianę kolejności przy usuwaniu konta.
Pełny opis: `docs/RELEASE_NOTES_1.10.1.md` w repo aplikacji.

**Nie sprawdzone na urządzeniu** — kontener nie ma telefonu. Jeżeli logowanie nadal padnie,
ekran poda teraz typ wyjątku i to jest następny krok, a nie kolejne zgadywanie.

### Historia: reguły Firestore nie były wdrożone

Zmierzone 2026-08-13 na żywym projekcie: usunięcie `users/{uid}` wraca z 403, choć plik
reguł w repo aplikacji dopuszcza je od 2026-08-08. Wdrożony release wskazuje ruleset
`d90b5359-bc76-4332-bdb2-e350e9c7fa2f` z 2026-08-07, w którym stoi `allow delete: if false`.

**Nowy ruleset jest już utworzony i zwalidowany** przez Rules API:
`projects/materio-502513/rulesets/daf56186-2298-4cb7-96ba-d41580e301a6`. Różnica wobec
działającego to jedna reguła (plus komentarz):

```
-      allow delete: if false;
+      allow delete: if isOwner(uid);
```

Sam ruleset niczego nie zmienia — dopóki release `cloud.firestore` na niego nie wskaże.
Tego kroku **nie udało się wykonać z tej sesji**: blokuje go klasyfikator uprawnień
(cztery próby, dwoma narzędziami). Do zrobienia jednym z dwóch sposobów:

1. Konsola Firebase → Firestore Database → Rules → zmień tę jedną linię → **Publish**.
2. `python3 …/scratchpad/finish.py` z tej sesji — robi to plus dwie pozostałe rzeczy niżej.

Powrót: wskazać release z powrotem na `d90b5359-…`. Google Play wymaga usuwania konta
z poziomu produktu, więc to nie jest kosmetyka.

### Nazwa „Materio" wychodzi do użytkowników w mailach i w zgodzie Google

Dwie różne nazwy, obie nadal stare:

- **Display name projektu Firebase = „Materio"**. To jest `%APP_NAME%` w każdym mailu
  Firebase Auth, więc reset hasła przychodzi jako „Reset your password for **Materio**".
  Zmiana: konsola Firebase → Project settings → General → Project name → `LiczMat`
  (albo `finish.py`).
- **App name na OAuth consent screen**. To widać w mailu bezpieczeństwa od Google po
  zalogowaniu przez Google — właściciel dostał „zalogowałeś się do **Firebase**". Zmiana:
  Google Cloud Console → APIs & Services → OAuth consent screen → App name → `LiczMat`.
  API do tego (`iap.googleapis.com`) jest w projekcie **wyłączone**, więc tylko konsola.

### Logowanie Google w aplikacji Android — poprawione w repo aplikacji

Właściciel zgłosił, że działa na stronie, a nie działa w aplikacji pobranej z Play.
Konfiguracja okazała się dobra — sprawdzone po kolei na żywym projekcie i w repo apki:

- odcisk **Play App Signing** `4BA41AAC…57` jest zarejestrowany (dodany 2026-08-12), obok
  klucza upload `B837DDD4…32` i SHA-256;
- `app/google-services.json` niesie obu klientów Android i klienta Web `…bohutp5o2sr…`;
- zależności są komplet (`androidx.credentials` 1.3.0, `googleid` 1.1.1);
- regex wyciągający `FIREBASE_WEB_CLIENT_ID` z `client_type: 3` trafia poprawnie;
- klucz API z `google-services.json` jest **bez ograniczeń** — zmierzone nagłówkami
  `X-Android-Package` i `X-Android-Cert`, odpowiada 200. (Klucz webowy odpowiada 403 na
  brak referera, co jest poprawne i nie dotyczy telefonu.)

Zostaje kod. Commit `a9312e7` w `3d-polednia/materio`:

- **`GetGoogleIdOption` → `GetSignInWithGoogleOption`.** To pierwsze jest podpowiedzią
  „one tap", a nie przyciskiem: Google nakłada na nie karencję po zamknięciu arkusza
  i przez wiele godzin odpowiada `NoCredentialException` nawet na telefonie z kontem
  Google. Przycisk, który ktoś świadomie nacisnął, ma otwierać wybór konta za każdym razem.
- **`runCatching { … }.getOrNull()` połykało powód.** Karencja, brak Usług Google i nieznany
  odcisk dawały ten sam „nieznany błąd" — dlatego szukanie tego było zgadywanką. Typ
  wyjątku idzie teraz do logcata (`LiczMatGoogle`) i na ekran pod komunikatem błędu.
- **`CloudSync.deleteAccount()` miał ten sam błąd kolejności co web** — profil kasowany na
  końcu. Poprawione tak samo.

**Nieskompilowane**: kontener nie ma Android SDK, a proxy blokuje `dl.google.com`.
Właściciel buduje sam (zasada z `CLAUDE.md` tamtego repo).

### Klucze serwisowe przeszły przez czat — zrotować

2026-08-13 właściciel wkleił do rozmowy dwa klucze konta serwisowego projektu
`materio-502513`, żeby dało się naprawić reguły: `firebase-adminsdk-fbsvc@` (id
`9eab0ba23f…`) i `pracownik@` (id `d56ef06500…`). Oba mają pełne prawa do projektu.
`pracownik@` przeszedł tą drogą **po raz trzeci** — `FIRESTORE_SYNC.md` §9.4 kazał go
zrotować już po drugim razie i to nadal nie zostało zrobione.

Po zakończeniu prac: Cloud Console → IAM & Admin → Service accounts → Keys → skasować oba
identyfikatory i wygenerować nowe. Żaden z nich **nie** trafił do repozytorium; leżały
wyłącznie w katalogu uploadów sesji.

### Osierocony dokument w Firestore — po moim teście

Sprawdzając reguły, założyłem konto jednorazowe, skasowałem jego projekt, dostałem 403 na
profilu, a potem skasowałem użytkownika Firebase. Została jedna sierota, której już nikt
nie odczyta ani nie skasuje z przeglądarki, bo reguły kluczują po `request.auth.uid`:

```
users/anNltlUcvChVl8fT0HezJ5f5Mg22   { createdAt, lastSeenAt, appVersion: "web" }
```

Trzy pola, żadnych podkolekcji, żadnych danych osobowych — ale to śmieć i mój błąd:
powinienem był skasować użytkownika **przed** sprawdzeniem, czy profil da się usunąć.
Kasuje się go dwoma kliknięciami w konsoli Firebase → Firestore Database. Drugi taki
przypadek nie powstanie: kolejność w `deleteEverything()` jest teraz odwrotna.

### `/app/` czy `/konto/` — propozycja z Sesji 13, decyzja właściciela

Rozdział IX wymienia w przykładowej strukturze `/konto`. Konto stoi pod `/app/`, dwa
znaki od `/aplikacja/`, która jest czymś zupełnie innym (strona aplikacji Android).
Sesja 13 **adresu nie ruszyła**, bo ten sam rozdział IX mówi wprost: znalezione lepsze
rozwiązanie „zgłoś w raporcie”, a nie wprowadzaj przy okazji bieżącego zadania.

Propozycja: przenieść na `/konto/` z przekierowaniem ze starego adresu. Strona jest
`noindex`, więc nie ma pozycji do stracenia, ale `/app/` jest w obiegu — linkuje do niego
`docs/FIRESTORE_SYNC.md` w repo aplikacji, a `404.html` obsługuje obok niego `/p/<token>`.
Lista autoryzowanych domen Firebase **nie** wymaga zmiany: są w niej hosty, nie ścieżki.
Koszt: jedna krótka sesja. Pełne uzasadnienie: [`ARCHITEKTURA.md`](ARCHITEKTURA.md) §8.2.

### Kto i kiedy zaczyna nadawać `plan` — nadal do decyzji

`/app/` pokazuje od Sesji 13 kartę „LiczMat Pro”, a od Sesji 21 całą zakładkę: pięć modułów
z rozdziału II i XIX, każdy opisany i oznaczony „Dostępne w LiczMat Pro”, plus karta planu
tego konta. **Zawartość poziomu Pro nie jest już nieustalona** — to jest ta piątka, w tej
kolejności, i tak samo mówi tabela uprawnień w `assets/plan.js`. Nieustalone zostało co
innego i węższego: `plan` w Firestore **nikt dziś nie nadaje** — nie ma Cloud Functions ani
Play Billing (`FIRESTORE_SYNC.md` §9.1–9.2) — więc poziom PRO jest w kodzie policzalny
i przetestowany, a w praktyce nieosiągalny. Nic tu nie jest zepsute; kolejność z rozdziału
XXV jest jednoznaczna — **najpierw funkcje Pro (Sesje 22–26), potem uprawnienia, na końcu
paywall (27) i płatności (28)**. Do decyzji właściciela zostaje, w której sesji ktoś po
stronie serwera zaczyna ten plan nadawać.

### Klienci są tylko w przeglądarce — telefon ich nie zobaczy (z Sesji 22)

Kontrakt synchronizacji nie ma kolekcji klientów: `docs/FIRESTORE_SYNC.md` w repo aplikacji
wymienia `projects`, `rooms`, `estimations`, `shoppingItems` i `sharedProjects`, nie ma
`ClientEntity`, nie ma `SyncContract.clientToDoc()` i nie ma `validClient()` we wdrożonych
regułach. Dlatego `assets/crm.js` trzyma klientów pod własnym kluczem (`liczmat-crm-v1`),
nic z nich nie idzie do Firestore, `wsExport()` ich nie zawiera, a strona `/klienci/` mówi
to wprost — bez tego zdania byłaby to obietnica synchronizacji, której nie ma.

Dokument klienta jest napisany w kształcie kontraktu (id, pola, `createdAt` / `updatedAt` /
`deletedAt` / `schemaVersion`, nagrobek zamiast kasowania), więc **przeniesienie klientów na
telefon jest zmianą kontraktu w repo aplikacji**, a nie przepisaniem tego pliku: `ClientEntity`
+ migracja Room, `clientToDoc()` / `clientFromDoc()`, `validClient()` w regułach i kolekcja
w `CloudSync`. To osobne zadanie i osobna decyzja właściciela — kiedy, i czy w ogóle przed
płatnościami.

### Zlecenia też są tylko w przeglądarce, i dzielą magazyn z klientami (z Sesji 23)

To samo, co akapit wyżej, i z tego samego powodu: kontrakt nie ma kolekcji `jobs` — nie ma
`JobEntity`, nie ma `SyncContract.jobToDoc()`, nie ma `validJob()` we wdrożonych regułach.
Zlecenia siedzą więc w `assets/crm.js` obok klientów, pod tym samym kluczem
`liczmat-crm-v1`, bo to jeden magazyn: dwa pliki piszące do jednego klucza `localStorage`
to jeden wyścig od zgubionego zapisu. `wsExport()` ich nie zawiera, `/zlecenia/` mówi to
wprost, a przeniesienie na telefon to ta sama zmiana kontraktu w repo aplikacji.

Do decyzji właściciela zostają dwie rzeczy, obie **poza zakresem Sesji 23** i obie zapisane
tu zamiast zrobione:

- **Czy zlecenie ma kiedyś jechać na telefon.** Dziś fachowiec ustawia status w
  przeglądarce, a w aplikacji go nie widzi. Jeśli tak, to razem z klientami — jedna zmiana
  kontraktu, nie dwie.
- **Czy `wartość` zlecenia ma się kiedyś brać z wyceny (Sesja 24).** Dziś jest wpisywana
  ręcznie i celowo niczym nie jest liczona: rozdział XXI nazywa ją polem zlecenia, a
  rozdział XXII buduje wycenę dopiero w następnej sesji. Kiedy wycena powstanie, trzeba
  będzie rozstrzygnąć, czy uzgodniona kwota zostaje osobnym polem (umowa z klientem), czy
  staje się sumą wyceny — **dwie różne rzeczy**, i podmiana jednej na drugą bez decyzji
  byłaby cichą zmianą znaczenia liczby, którą ktoś już wpisał.

### Wyceny: co zostało rozstrzygnięte, i co zostaje właścicielowi (z Sesji 24)

Wyceny są trzecią kolekcją w tym samym magazynie i poza tym samym kontraktem, co klienci
i zlecenia — nie ma `QuoteEntity`, nie ma `SyncContract.quoteToDoc()`, nie ma `validQuote()`
we wdrożonych regułach. `wsExport()` ich nie zawiera, `/wyceny/` mówi to wprost, a
przeniesienie na telefon to ta sama jedna zmiana kontraktu w repo aplikacji, co dla dwóch
poprzednich modułów — jeżeli w ogóle, to raz, dla wszystkich trzech.

**Pytanie z raportu Sesji 23 zostało rozstrzygnięte tak, jak było postawione: dwie liczby
zostają dwiema liczbami.** „Wartość" zlecenia (rozdział XXI) to kwota uzgodniona z klientem
i dalej jest wpisywana ręcznie; suma wyceny (rozdział XXII) to materiał + inne koszty +
robocizna + marża i jest liczona. Podmiana jednej na drugą byłaby cichą zmianą znaczenia
liczby, którą ktoś już wpisał — a to jest dokładnie to, przed czym raport Sesji 23
ostrzegał. Zlecenie i wycena nie są też ze sobą powiązane wprost: obie wskazują na ten sam
projekt i tamtędy się widzą.

Do decyzji właściciela zostają trzy rzeczy, wszystkie **poza zakresem Sesji 24**:

- **Czy wycena ma być wychodzącym dokumentem** — czymś, co się drukuje albo wysyła
  klientowi. Dziś jest ekranem roboczym: liczy i pokazuje. Wydruk ma już `/kosztorys/`
  i można by mu dać wariant „wycena", ale to jest osobna sesja i osobny projekt strony do
  druku.
- **Czy „wartość" zlecenia ma dostać przycisk „przepisz z wyceny"** — jednorazowe
  przepisanie na życzenie, a nie powiązanie. To jest jedno kliknięcie, ale i jedna decyzja:
  po nim uzgodniona kwota przestaje być tym, na co ktoś się umówił, jeżeli wycena się potem
  zmieni.
- **Czy jedno zlecenie ma mieć wskazaną „tę właściwą" wycenę**, gdy wariantów jest kilka.
  Dziś projekt może mieć ich dowolnie wiele i żaden nie jest wyróżniony; wyróżnienie to
  pole, a pole to decyzja, po co ono jest.

Sesja 26 (CRM) łączy klienta, zlecenie, projekt, wycenę i historię w jedną drogę — to tam
te powiązania mają być pokazane razem, i dlatego Sesja 24 nie dokładała ich po jednym.

### Ścieżka CRM jest chodzona, nie zapisana — i czego historia nie umie pokazać (z Sesji 26)

Sesja 26 nie dołożyła ani kolekcji, ani strony. Wszystkie powiązania rozdziału XXIV
zapisały już sesje 22–25: klient trzyma swoje projekty, zlecenie trzyma klienta i projekt,
wycena trzyma projekt. Brakowało samej **ścieżki** — z wyceny nie było jak wrócić do klienta
bez otwierania dwóch stron, a z klienta nie było jak dojść do wycen w ogóle. Doszły więc
jeden spacer po powiązaniach (`crmChain()`) i jedno czytanie (`crmHistory()`), oba
wyliczane, plus jeden pasek, który rysuje je tak samo na `/klienci/`, `/zlecenia/`
i `/wyceny/`. Zapisana ścieżka byłaby piątą kopią czterech powiązań i rozjechałaby się
z nimi przy pierwszej zmianie właściciela projektu — ten sam argument, który trzyma koszt
poza zleceniem, cenę jednostkową poza materiałem, a datę poza terminarzem.

**Czego historia świadomie nie pokazuje: zmian.** W magazynie są tylko daty *powstania*
dokumentów. Wiersz ma jedno `updatedAt`, które mówi *kiedy* coś się zmieniło i nigdy *co*,
więc historia pokazuje: dodano klienta, dodano zlecenie, dodano wycenę, zapisano kalkulację,
dopisano koszt — i nic ponadto. Status przestawiony z „nowe" na „w toku" i termin przesunięty
o tydzień **nie zostawiają śladu**, i strona mówi to wprost zdaniem pod listą, zamiast udawać
komplet. Dziennik zdarzeń, który by je zapamiętał, jest dokładnie tym ERP-em, którego
rozdział XXIV zakazuje w ostatnim zdaniu — i zacząłby kłamać przy pierwszym skasowanym
wierszu, bo wiersza by nie było, a wpis by został.

Do decyzji właściciela zostają dwie rzeczy, obie **poza zakresem Sesji 26**:

- **Czy historia ma pamiętać zmiany statusu i terminu.** To jest decyzja o dzienniku
  zdarzeń: własna kolekcja, własne reguły przy kasowaniu i cofaniu, i pytanie, co robić
  z wpisem po skasowaniu zlecenia. Da się to zrobić uczciwie, ale to jest osobna sesja
  i wprost pod granicą z rozdziału XXIV.
- **Czy ścieżka ma sięgać na strony spoza Pro.** Projekt jest środkiem łańcucha, ale
  `/projekty/` jest trasą `GUEST` i nie ładuje niczego z CRM-u. Pasek na projekcie
  oznaczałby wożenie Pro na stronę gościa — świadomie tego nie zrobiłem.

### Terminarz niczego nie zapisuje — i co z tego wynika dla właściciela (z Sesji 25)

Terminarz **nie jest** czwartą kolekcją. Termin jest polem zlecenia (`dueDate`, rozdział
XXI), więc `/terminarz/` czyta zlecenia i sortuje je do pięciu kubełków, a jedyny zapis,
jaki robi, to ten sam `crmUpdateJob()`, którego używa `/zlecenia/`. Własna tablica dałaby
tej samej dacie dwa domy — dokładnie ten problem, który Sesja 24 rozstrzygnęła dla
pieniędzy wyceny. Skutek praktyczny: terminarz nie dołożył **nic** do tego, co i tak nie
jedzie na telefon; migracja Pro na telefon (jeżeli kiedyś) to nadal ta sama jedna zmiana
kontraktu dla trzech kolekcji, nie czterech.

Do decyzji właściciela zostają trzy rzeczy, wszystkie **poza zakresem Sesji 25**:

- **Czy „w ciągu 7 dni" ma być tygodniem, czy dwoma.** Dziś to `CAL_SOON_DAYS = 7` —
  jedna stała, jedna linijka. Siedem dni to okno, w którym fachowiec planuje robotę; komuś,
  kto pracuje z miesięcznym wyprzedzeniem, wszystko wpadnie do „później". Zmiana jest
  trywialna, ale to jest decyzja o tym, czym jest ta strona, więc jej nie podjąłem sam.
- **Czy terminarz ma przypominać.** Rozdział XXIII mówi „zobaczyć", nie „przypomnieć",
  i wprost zabrania budowania Kalendarza Google. Powiadomienie to zgoda przeglądarki,
  Service Worker i coś, co musi działać przy zamkniętej karcie — to jest osobna sesja
  i osobna rozmowa o tym, czy serwis ma prosić o taką zgodę.
- **Czy zlecenie ma mieć datę startu obok terminu.** Dziś ma jedną datę, bo rozdział XXI
  wymienia jeden „termin". Druga zamieniłaby listę w oś czasu, czyli w to, czego rozdział
  XXIII zabrania — chyba że właściciel chce właśnie tego.

Jedno drobne znalezisko przy okazji, naprawione, bo leżało w linijce, którą i tak trzeba
było ruszyć: **`/wyceny/` (Sesja 24) było zadeklarowane jako indeksowane, ale nie było
w `sitemap.xml`.** Cztery adresy wyceny i cztery terminarza są tam teraz; test Sesji 25
sprawdza to dla własnych stron, tak samo jak test Sesji 23 dla zleceń.

### ~~Zamek stoi, a przejściem jest podgląd~~ — podgląd usunięty w Sesji 28

**Nieaktualne od Sesji 28.** Podgląd Pro został skasowany na polecenie właściciela, a jego
miejsce zajęła cena: ściana podaje, ile Pro kosztuje, i linkuje do `/app/`. Trzy pytania
poniżej są rozstrzygnięte — cena jest ustalona (patrz raport Sesji 28), podgląd nie
„wygasa", bo go nie ma, i nie zostaje jako okres próbny. **Zostaje w mocy jedno:** dopóki
nic nie nadaje `plan: premium`, pięć modułów Pro jest zamkniętych dla wszystkich, łącznie
z kontem właściciela. Akapity niżej zostają jako zapis stanu z Sesji 27.

### Zamek stoi, a przejściem jest podgląd — bo kupić Pro jeszcze się nie da (z Sesji 27)

`LM_PRO_LOCKED` jest `true`. Pięć modułów Pro jest zamkniętych dla gościa i dla darmowego
konta, a zamiast nich stoi paywall: nazwa modułu, „Dostępne w LiczMat Pro", pozostałe
cztery moduły z opisami, jedno zdanie dobrane do poziomu (gość → załóż konto, darmowe
konto → to jest Pro) i link do rejestracji, który wraca na tę samą stronę w tym samym
języku. Zamek dotyczy **tylko** funkcji `PRO`: kalkulatory, projekty, materiały, koszty
i pomieszczenia zostają otwarte, bo rozdział II zabrania blokowania podstaw po to, żeby
wymusić przejście na Pro.

**Problem, który sesje 21–26 zostawiły, i odpowiedź na niego.** Planu Pro nadal nic nie
nadaje (`FIRESTORE_SYNC` §9.2), a płatności to Sesja 28. Sam zamek zabrałby więc pięć
działających modułów **każdemu istniejącemu kontu** i nie dałby w zamian niczego — łącznie
z kontem właściciela, które ma sprawdzić, czy moduły działają, czego rozdział XXV wymaga
*przed* płatnościami. Dlatego paywall proponuje **podgląd Pro**: jeden klucz
w `localStorage` (`liczmat-pro-preview`), na tym urządzeniu, otwierający wszystkie moduły
Pro naraz i mówiący wprost, czym nie jest — nie zmienia planu przy koncie, nie
synchronizuje się, telefon go nie widzi, a `lmLevelOf()` go nie czyta. Pasek nad otwartym
modułem pisze wtedy „Podgląd Pro", nie „Twój plan: LiczMat Pro". Ten sam przełącznik jest
w zakładce Pro na `/app/`, bo tam idzie się sprawdzić, jaki ma się plan.

**Ściana jest jedna.** `proGate()` w `src/pro.mjs` zastąpił cztery kopie bloku z sesji
22–25, a `assets/paywall.js` cztery kopie `xxxRenderPro()`. Cztery ściany to cztery szanse
na opisanie tego samego produktu czterema zdaniami, a to jedyne miejsce w serwisie, gdzie
taka rozbieżność kosztuje pieniądze.

Do decyzji właściciela zostają trzy rzeczy, wszystkie **poza zakresem Sesji 27**:

- **Ile Pro ma kosztować i w jakim modelu.** Paywall nie podaje ceny, bo jej nie ma.
  Kwota, okres rozliczeniowy i to, czy jest plan roczny, są wejściem do Sesji 28, nie jej
  wynikiem — i do Sesji 29, która ma tę cenę pokazać na `/liczmat-pro/`.
- **Kiedy podgląd Pro ma zniknąć.** Dziś nie ma daty końca ani licznika: byłyby obietnicą
  terminu, którego nikt nie zna. Sesja 28 zastępuje podgląd subskrypcją i wtedy trzeba
  zdecydować, co dzieje się z przeglądarką, która ma podgląd włączony — wygasa cicho, czy
  mówi, że teraz jest to płatne.
- **Czy podgląd ma zostać po uruchomieniu płatności jako okres próbny.** To jest to samo
  jedno pole, ale zupełnie inna decyzja produktowa: okres próbny liczy się na koncie i na
  serwerze, a podgląd jest lokalny i niczego nie obiecuje.

Uwaga techniczna dla Sesji 28: podgląd jest celowo **jednym kluczem i jedną parą funkcji**
(`lmProPreview()` / `lmSetProPreview()`), żeby jego usunięcie było skasowaniem, a nie
rozplątywaniem. Zamek jest nadal jednym `LM_PRO_LOCKED`, a testy sprawdzają obie jego
odpowiedzi — również tę sprzed Sesji 27.

### ~~Przywrócenie 10 języków~~ — zrobione 2026-08-19, raport wyżej

**Wykonane.** Sześć języków wróciło, slugi odzyskano z gita (177/177 starych adresów
działa), 6780 ciągów w słownikach, trzy rodziny liczby mnogiej w `assets/units.js`.
Pytanie o `ru` rozstrzygnęło się samo — właściciel prosił o „wszystkie, które były",
a to jest dziesięć; rubla i tak nie ma, bo Stripe nie działa w Rosji, więc rosyjski
zaczyna w EUR. **Otwarte zostaje jedno: tłumaczeń nie sprawdzał native speaker.**
Opis poniżej zostaje jako zapis tego, co trzeba było zrobić.

### Przywrócenie 10 języków — zlecone przez właściciela w Sesji 28 (zapis zakresu)

Właściciel poprosił o powrót sześciu języków wycofanych 2026-08-12 (`RETIRED_LANGS`
w `src/site.mjs`: **cs, sk, ro, hr, sr, ru**), z powrotem do dziesięciu. To **nie zmieściło
się w Sesji 28** i nie miało prawa: rozdział XXXV mówi „jedna sesja = jedno zadanie",
a `CLAUDE.md` wprost — *„Do not re-add a language without the plan"*. Właściciel zgodził
się rozłożyć to na dwa kroki i płatności poszły pierwsze.

**Rozmiar, zmierzony a nie oszacowany:**

- **~4 800 przetłumaczonych ciągów** — ok. 800 kluczy × 6 języków, w `assets/i18n.js`,
  `i18n-pages.js` i `i18n-materials.js`. Build wywala się na każdym brakującym kluczu, więc
  albo komplet, albo nie ma strony.
- **~180 nowych slugów** — 8 sekcji + 15 kalkulatorów + poradniki, × 6 języków. **Slug jest
  wieczny** (`CLAUDE.md`): zły czeski slug to zepsuty adres i utracona pozycja na zawsze.
  To najdroższa część i wymaga uwagi, a nie tłumaczenia hurtem.
- **147 → ~370 stron**, plus `hreflang`, `canonical`, `sitemap.xml`, `HREFLANG`,
  `OG_LOCALE`, flagi w `assets/flags/` i rozplątanie przekierowań `RETIRED_LANGS`
  z `404.html`, które dziś wysyłają stare adresy tych sześciu języków na stronę główną.

**Pytania do rozstrzygnięcia przed startem:**

- **Czy `ru` wraca.** Rubla Stripe nie obsłuży (nie działa w Rosji), więc ten język nigdy
  nie dostanie własnej waluty — i jest to też decyzja pozaproduktowa.
- **Skąd tłumaczenia.** Sześć języków wygenerowanych bez weryfikacji native speakera
  trafiłoby na ~220 nowych publicznych stron pod domeną właściciela.
- **Czy `/app/` i `/p/`** (tłumaczone w miejscu, bez własnych adresów) dostają komplet od razu.

**Waluty są już gotowe.** Sesja 28 dołożyła CZK, RON i RSD, więc siedem walut obsłuży
dziesięć języków bez zmian — język nie wyznacza waluty (rozdział VI).

**Rozdział V `MASTER_PLAN.txt` ustala cztery języki, a rozdział VI cztery waluty. Obie
edycje należą do właściciela** — ten plik jest jego i żadna sesja go nie przepisuje.

### Warstwa konta nie została po tej sesji sprawdzona na żywym Firebase

`scripts/test-account-page.mjs` przeklikuje `/app/` w Chromium z **podstawionym** SDK,
bo kontener agenta nie dociera do `gstatic.com` (ta sama przeszkoda, co w Sesji 12
i wcześniej). To sprawdza kod tego repozytorium — widoki, poziom, profil, co ląduje
w `localStorage` — ale **nie** sprawdza, czy prawdziwe Firebase zachowuje się tak, jak
zakłada `assets/app.js`. Trzy rzeczy warto kliknąć w prawdziwej przeglądarce, zanim uzna
się je za działające: `setPersistence` przed logowaniem, `updateProfile` z nazwą i reset
hasła. Ostatnia weryfikacja na żywo to `FIRESTORE_SYNC.md` §8 (2026-08-07) i nie obejmuje
niczego, co dołożyła ta sesja.

### `DOKUMENTACJA.md` §7 opisuje kalkulatory sprzed Sesji 7 — znalezione w Sesji 12

Sekcja „7. Kalkulatory" mówi o `buildCalculators()` renderującym karty do `#calc-grid`,
o zakładkach `.calc-tab` i o `buildRoomHelper()`. Nic z tego nie jest już prawdą: strony
kalkulatorów są generowane przez build, kategorie zastąpiły zakładki (Sesja 7), a układ
karty zmieniła Sesja 8. Sesja 12 dopisała obok **§7a o testach**, ale samego §7 nie
przepisywała — to nie jest test, tylko osobna robota dokumentacyjna. Do zrobienia
w sesji, która i tak dotknie tej sekcji.

### Zostawione grupom 2 i 3 (Sesje 10–11) — znalezione w Sesji 9

Nie są to decyzje do podjęcia, tylko ten sam defekt na stronach, których Sesja 9 nie
miała w zakresie. Spisane, żeby kolejna sesja nie musiała ich znajdować od nowa.

| Co | Gdzie |
|---|---|
| Jednostka wyniku bez odmiany: „2 rolek”, „2 płyt”, „2 sztang”, „2 arkuszy” | `res_rolls`, `res_boards`, `res_stocks`, `res_sheets` — mechanizm `unitLabel()` już jest, brakuje form w słowniku |
| Wiersz wyniku podpisany „kg” z wartością „1600 kg” | `screed` (wylewka) — w kleju i fudze etykieta to już „Razem” |
| Wpisane `0` w polu z wartością domyślną liczy się jak puste | `screed`, `insulation`, `wallpaper`, `studwall`, `ceiling`, `drylining` — `orDefault()` już jest |
| Ujemna cena przyjmowana bez ostrzeżenia | wszystkie poza grupą 1 i `sheet` |
| Wspólne „Cena za sztukę/opak.” przy wyniku w rolkach / płytach / arkuszach | `fld_price` w pozostałych dwunastu |

### Fuga: format płytki w mm, nie w cm — bez ostrzeżenia

Wpisanie „60×60” zamiast „600×600” daje wynik zawyżony stukrotnie, a strona przyjmuje to
bez słowa: 60 mm to legalny mozaikowy format. Kontrola wiarygodności („to wygląda na
centymetry”) byłaby nowym zachowaniem, nie poprawką błędu, więc Sesja 9 jej nie dopisała.
**Do decyzji właściciela**, czy taki próg ma się pojawić — i czy w kalkulatorach, czy
dopiero w Sesji 12 (test kalkulatorów).

### Klej / zaprawa nie ma skrótów, a płytki i fuga mają

Zużycie kleju wynika z zębatki pacy. Skróty typu „zębatka 8 mm → 3,2 kg/m²” wymagałyby
liczb, których nie ma w kodzie, a `CLAUDE.md` zabrania liczby, której nie da się wywieść
z repozytorium. Dziś zastępuje je wybierak materiałów — 16 worków z `kgm2` z katalogu —
i nota „na co uważać”. **Do decyzji właściciela**, czy dołożyć tabelę zębatek jako dane
katalogowe (wtedy trafia do `assets/materials.js`, a nie do skrótów).

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

Sesja 13 stanu nie zmieniła, ale go **napisała wprost na stronie**: karta „Gość” na
`/app/` mówi, że bez konta działają wszystkie kalkulatory i pełny wynik, a karta
„LiczMat”, że konto dokłada zapis, projekty i te same dane na telefonie. Jeżeli
właściciel rozstrzygnie spór w drugą stronę, zmieni się i ta treść, i poziom trasy.

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

### ~~Języki aplikacji Android~~ — zrównane 2026-08-19

Aplikacja ma 10 języków i **serwis ma teraz też 10**, więc rozbieżność zniknęła bez
zmian w repo aplikacji. FAQ na stronie dalej mówi o serwisie, nie o aplikacji, i to
zostaje — to dwa różne produkty z dwiema różnymi politykami prywatności.

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

### ~~Miejsce dla „LiczMat Pro” w menu~~ — rozstrzygnięte w Sesji 40

Pytanie z Sesji 7: menu mieściło cztery linki (Kalkulatory, Materiały, Projekty,
Poradniki), rozdział X chce trzech kierunków ze strony głównej — Kalkulatory, LiczMat
i LiczMat Pro — więc gdy powstanie `/liczmat-pro/`, coś będzie musiało ustąpić.
Przewidywanie („najpewniej Poradniki, które i tak są w stopce") okazało się trafne, ale
decyzja nie zapadła w Sesji 29: tamta zbudowała stronę i zostawiła ją w stopce.

Rozstrzygnął **właściciel** 2026-08-21 — „w nagłówku ustępują Poradniki" — i wykonała to
**Sesja 40**. Rząd ma pięć linków, nie cztery (piąty, „Aplikacja", doszedł po Sesji 20),
a zamiana została **zmierzona**: najszerszy rząd na serwisie, rosyjski, zwęził się o 10 px.
Poradniki zostały w stopce, w `sitemap.xml` i w linkach ze strony głównej. Pomiar w całości
w raporcie Sesji 40 i w `docs/ARCHITEKTURA.md` §5.

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
