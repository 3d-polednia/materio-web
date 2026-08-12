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
| 12 | Test kalkulatorów | **Następna** |
| 13–36 | patrz rozdział XXXII planu | Nie zaczęte |

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
