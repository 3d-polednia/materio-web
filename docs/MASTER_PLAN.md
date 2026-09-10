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

## Dziennik sesji przeniesiony do skarbca (2026-09-09)

Ten plik miał 6694 linie i 468 kB — dwanaście razy więcej niż plan, który śledzi. Opisy
sesji zamkniętych leżą teraz w skarbcu Obsidian, `Obsidian/Liczmat/Historia/`, słowo
w słowo, po jednej notatce na ciąg:

| Notatka | Co zawiera |
|---|---|
| `Sesje 1-36 - budowa serwisu i rebranding.md` | cały zakres `MASTER_PLAN.txt`, zamknięty na Sesji 36 |
| `Sesje 37-48 - plan naprawczy i sprzedazowy.md` | plan naprawczy, sprzedaż, panel administratora |
| `Sesje 51-63 - audyt parytetu i jego wykonanie.md` | audyt strona ↔ aplikacja i sesje, które go wykonały |
| `Ceny wyceny i PDF wylacznie w Liczmat Pro.md` | decyzja z 2026-09-04 i jej wykonanie |
| `Migracja domeny na liczmat.com.md` | przeprowadzka z `materio-app.com` |
| `Rozstrzygniete decyzje i zamkniete ostrzezenia.md` | trzynaście pozycji wykreślonych z „Otwartych decyzji" niżej |

**Zaglądaj tam, zanim uznasz coś w kodzie za przeoczenie.** Połowa tych opisów tłumaczy,
dlaczego coś wygląda dziwnie, i zdarzyło się już, że to była świadoma decyzja właściciela,
a nie błąd — tak było z przelewaniem się daty w `monthsFromNow()` (Sesja 65).

Tutaj zostaje wyłącznie to, co żywe: tabela postępu, dwie ostatnie sesje, lista rzeczy do
zrobienia w konsolach, znane ograniczenia i otwarte decyzje. Pełna lista otwartych wątków
obu repozytoriów, przeglądana razem z tym plikiem, jest w `Obsidian/Liczmat/Meta/Otwarte watki.md`.

## Sesja 69 — automatyczna synchronizacja i cztery zgłoszenia właściciela (2026-09-10)

Cztery rzeczy zgłoszone naraz po pracy na żywym `liczmat.com`, wszystkie zamknięte i wdrożone:
commity `9a37e024`, `28194956`, `deaeedb5`. `STAMP` podbity na `20260910b`.

1. **Konto i przeglądarka trzymały dwa różne zestawy projektów.** `/app/` czytało i pisało
   Firestore, `/projekty/` czytało `localStorage`, a mostem były dwa przyciski na zakładce
   Synchronizacja. Do tego `listen()` odrzucało nagrobki, zanim wywołało `onRows()`, więc
   kasowanie nie miało jak dojechać. Teraz: `listen()` oddaje drugą tablicę ze wszystkimi
   dokumentami, `mirrorToLocal()` wlewa ją do `localStorage` na każdym snapshocie,
   `autoReconcile()` godzi oba magazyny przy logowaniu, a debounce 1500 ms na
   `workspacechange` / `crmchange` / `ownmaterialschange` zbroi wysyłkę. `syncBusy` przerywa
   pętlę zwrotną. **Wysyłka automatyczna jest przyrostowa** (`syncPushAll(since)` pomija
   wiersze nie nowsze od ostatniej), ręczna wysyła całość — pełna wysyłka przy każdej edycji
   zjadałaby dzienny limit zapisów Firestore.
2. **Wymiary pomieszczenia na `/app/`** miały etykiety wyłącznie w `aria-label`. Dostały
   widoczne etykiety i zdanie, że 5 / 4 / 2,6 to metry i tylko przykład (`app_room_hint`,
   trzynaście języków). Formularz używa `ws-mat-grid`, nie `inline-form`: `.inline-form input`
   ma `flex: 1 1 160px`, co w kolumnie `.ws-mat-f` jest bazą na wysokości i daje pole wysokie
   na 160 pikseli.
3. **Klient bez pełnych danych.** Oba formularze tworzące klienta pytały o mniej, niż trzyma
   rekord. Doszły e-mail i adres. Przy okazji: placeholder telefonu na `/app/` szedł z
   `t("crm_phone")`, klucza nieistniejącego w żadnym słowniku, więc strona pokazywała
   dosłowne „crm_phone"; jest `cli_phone`.
4. **Terminarz umie dodać termin.** Nazwa, data, opcjonalny klient →
   `crmAddJob({ name, dueDate, clientId })`. Bez osobnej kolekcji `events` — wpis **jest**
   zleceniem. Rozdział XXIII dalej stoi: bez siatki miesiąca, powtarzania i przypomnień.
   `cal_local_note` i `cal_source_note` obiecywały, że strona nic nie zapisuje; przepisane.

**Testy:** cały zestaw przed i po — te same cztery czerwone (`test-copy`, `test-own-materials`,
`test-perf`, `test-security`), wszystkie zastane, zero regresji.

**Znane ograniczenie:** automat działa tylko przy otwartej karcie `/app/` — to jedyna strona
ładująca SDK Firestore.

**Pułapka do zapamiętania:** kolejność bloków w `assets/i18n-pages.js` to `pl, en, de, uk, …`,
a **nie** kolejność `LANGS` z `assets/i18n.js` (`pl, uk, de, en, …`). Skrypt pozycyjny ufający
tablicy wsadzi angielski do bloku ukraińskiego.

Całość: `Obsidian/Liczmat/Historia/Sesja 69 - automatyczna synchronizacja i cztery zgloszenia wlasciciela.md`.

## Sesja 65 — audyt, sesja A: pieniądze i backend (2026-09-09)

Reszta audytu z 2026-09-04 to jedenaście znalezisk **średnich**. Rozpisane są na trzy
sesje po tym, co je łączy, a nie po numerach: **A** to `functions/` i `scripts/` (M1, M2),
**B** to logika w przeglądarce (M3–M7, pliki `workspace.js`, `crm-store.js`,
`calculators.js`), **C** to generator i wygenerowany markup (M9, M10, M11, a na końcu M8).
A idzie pierwsza, bo dotyczy pieniędzy. B przed C, bo obie ruszają `assets/calculators.js`,
a C przepisuje w nim wyzwalacz liczenia, na którym B pisze walidację.

Ta sesja robi A.

- **M2 — ręczne nadanie Pro przeskakiwało na kolejny miesiąc.** `monthsFromNow()` liczyło
  `end.setMonth(end.getMonth() + n)`, a `setMonth` przelewa zamiast przycinać: 31 stycznia
  plus miesiąc to 2 albo 3 marca. Klient dostawał dostęp dłuższy, niż zamówił. Dzień jest
  teraz zdejmowany przed przesunięciem miesiąca (`setDate(1)`) i wkładany z powrotem
  przycięty do ostatniego dnia miesiąca docelowego — w obu kopiach, `functions/admin-map.mjs`
  i `scripts/pro-admin.mjs`.

  **To był świadomy wybór, który audyt odwrócił.** Komentarz w `scripts/pro-admin.mjs`
  mówił wprost, że przelanie się na marzec jest do przyjęcia, bo to kilkadziesiąt godzin
  i nie warto drugiej reguły. Audyt pokazał drugą stronę tej samej różnicy: to są godziny,
  których nikt nie kupił. Zapisane tutaj, żeby dało się wrócić do poprzedniej decyzji
  jednym cofnięciem, gdyby właściciel uznał inaczej.

  **Test §4 w `scripts/test-admin-map.mjs` sprawdzał kopię z kopią, nie z wynikiem** — i to
  była druga połowa znaleziska. Sekcja ma teraz tabelę wypisanych dat (31 stycznia + 1,
  + 13, 31 sierpnia + 6, 29 lutego + 12, 31 marca + 1, 31 maja + 3) i sprawdza wobec niej
  **obie** kopie, a porównanie jednej z drugą zostaje pod spodem, bo nadal pilnuje reszty
  wartości.

- **M1 — płatność można było podpiąć pod cudze konto.** `client_reference_id` w adresie
  Payment Linka niósł goły uid, a `resolveUid()` sprawdzał wyłącznie, czy takie konto
  istnieje w Firebase Auth. Podmiana parametru w URL-u nadawała Pro wybranemu cudzemu
  kontu i wiązała z nim przyszłe zdarzenia Stripe'a.

  Nowy `functions/pay-ticket.mjs`: **bilet** `v1.<uid>.<data>.<HMAC-SHA256>`, ważny dobę
  (tyle Stripe trzyma otwartą sesję Checkout). Nowa funkcja `payTicket` (`onCall`) wystawia
  go tylko zalogowanemu i tylko na `request.auth.uid` — czyli na uid z tokenu
  zweryfikowanego przez Google, a nie z ciała żądania, którego ta funkcja w ogóle nie
  czyta. Webhook bierze uid **wyłącznie** z podpisu; goły uid nie znaczy już nic.

  **Dlaczego bilet, a nie sesja Checkout zakładana po stronie serwera.** Sesja z serwera
  jest podręcznikową odpowiedzią, ale wymaga klucza API Stripe'a w `functions/`, a nagłówek
  `functions/index.js` od Sesji 38 tłumaczy, że ta funkcja świadomie go nie ma: czyta
  tylko to, co Stripe sam przysłał i podpisał. Bilet zamyka tę samą dziurę bez klucza
  i bez porzucania Payment Linków, na których stoi cała sprzedaż.

  **Płatność bez biletu nadal przechodzi** — przypisuje się adresem e-mail z zapłaconej
  sesji, tak jak przypisywała się dotąd każda bez `client_reference_id`. To nie jest druga
  furtka: adres bierze się ze Stripe'a, nie z URL-a, a jedyne, co można nim zrobić, to
  kupić komuś Pro za swoje. Dzięki temu wdrożenie bez ustawionego sekretu albo
  przeglądarka, której nie udało się wywołać funkcji, kończą się utratą przypisania po
  uidzie, a nie sklepem, który nie przyjmuje pieniędzy. Z tego samego powodu sekret czyta
  się przez `payTicketSecret()` z `try` — wyjątek w webhooku zamieniłby brak konfiguracji
  w piątkę na **każdą** płatność.

  Sprawdza to `scripts/test-pay-ticket.mjs` (34 sprawdzenia): bilet czyta się na ten sam
  uid, a goły uid, cudzy podpis, podmieniony uid przy starym podpisie, rozciągnięta data,
  obca wersja i bilet po terminie — nie. Osobna sekcja pilnuje, że przeglądarka nie zna
  sekretu i nie podpisuje niczego sama.

### Co musi zrobić właściciel, zanim to zacznie działać

```bash
firebase functions:secrets:set PAY_TICKET_SECRET     # dowolny długi losowy napis
firebase deploy --only functions
```

**Wdrożenie bez tego sekretu nie przejdzie**, bo deklarują go obie funkcje. Do czasu
wdrożenia strona chodzi jak dotąd: `/app/` prosi o bilet, nie dostaje go i idzie do kasy
bez niego, a płatności przypisują się adresem e-mail. `docs/STRIPE.md` ma ten krok w 3b
i poprawiony opis `client_reference_id` w sekcji 2 i 5.

### Czego ta sesja nie sprawdziła

Ośmiu zestawów w Chromium — Playwright nadal nie jest zainstalowany na tej maszynie.
Wszystkie zestawy `node` przeszły; `test-copy` (1) i `test-security` (7) mają dokładnie te
same błędy co przed sesją, sprawdzone przez `git stash`, więc nie są jej skutkiem.
Rzeczywistej płatności przez Stripe nikt nie wykonał — to jest krok 5 z `docs/STRIPE.md`
i wymaga wdrożonych funkcji.

### Dwie rzeczy zmierzone przy okazji, obie otwarte

- **`scripts/test-perf.mjs` nie dochodzi do żadnego wyniku.** Przewraca się wyjątkiem
  `TypeError: Cannot read properties of undefined (reading 'html')` w linii 488, zanim
  cokolwiek wypisze, więc **budżety wagi stron nie bramkują dziś niczego**. Wcześniejsze
  sesje notowały to jako „wywala się w linii 477" — linia się przesunęła, awaria nie.
  Uwaga na przyszłość: pętla „uruchom wszystkie testy i pokaż błędy" szukająca `✗` **tego
  nie widzi**, bo zestaw, który się przewraca, nie wypisuje ani jednego znaku porażki.
  Liczyć kod wyjścia, nie znaczki.
- **Rozkrój liniowy ma tę samą dziurę, którą H6 załatało w rozkroju płyt.**
  `assets/calculators.js:181` sprawdza `Math.min(c.q, 100000)` **per wiersz**, a tablica
  `pieces` zbiera wszystkie wiersze bez sufitu. Wklejona lista z kilkoma wierszami po
  100 tys. sztuk zamraża kartę tak samo jak przed H6. Wagą to jest znalezisko wysokie
  i nie należy do żadnej z sesji A/B/C — H6 opisywało wyłącznie `sheets`.

Pełna lista otwartych wątków obu repozytoriów, przejrzana i zmierzona tego samego dnia,
leży w skarbcu: `Obsidian/Liczmat/Meta/Otwarte watki.md`.

**NASTĘPNA SESJA: B** — M3–M7, logika w przeglądarce.

## Sesja 64 — sześć znalezisk niskich z audytu i rozmrożenie języków (2026-09-09)

Audyt zewnętrzny z 2026-09-04 (Codex CLI + Gemini 3.1 Pro, raport w skarbcu Obsidian)
wypisał 24 znaleziska. Ta sesja robi wyłącznie sześć **niskich**; wysokie i średnie
zostają na następne.

- **L1 — liczebnik w złym przypadku.** `door_calc_count` i `mat_count_label` niosły jedną
  formę dopełniacza na każdą liczbę, więc strona ukraińska pisała „161 матеріалів" tam,
  gdzie liczba kończąca się na 1 wymaga mianownika: „161 матеріал". Mechanizm już istniał
  — `pluralForm()` w `assets/units.js` odmienia jednostki wyniku — więc oba liczniki
  dołączyły do `PLURAL_UNITS`, a nie dostały drugiej kopii reguł. Przy okazji wyszło, że
  sama reguła myliła polski z ukraińskim: polski liczy 21 tak jak 25 („21 worków"),
  a ukraiński, chorwacki i serbski biorą liczbę pojedynczą dla **każdej** liczby kończącej
  się na 1 poza nastkami. To jest `LAST_DIGIT_ONE` obok `LAST_DIGIT_PLURAL`.
  Formy dla siedmiu języków fleksyjnych dały dwa modele (Gemini 3.1 Pro i model
  z lokalnego routera FreeLLMAPI); rozbieżne przypadki rozstrzygnięte ręcznie —
  ukraińskie 2–4 to mianownik liczby mnogiej („2 матеріали"), nie dopełniacz liczby
  pojedynczej, który podpowiadał drugi model.
- **L2 — nazwa linku nie odmieniała się w zdaniu.** `faq_a5_link` istniał osobno od
  `foot_privacy` dokładnie po to, żeby zdanie mogło mieć swoją formę, i trzymał formę
  tytułową. Po ukraińsku „в" rządzi miejscownikiem: „Усе описано в Політиці
  конфіденційності". Stopka dalej pisze „Політика конфіденційності". Pozostałych dwanaście
  zdań sprawdzone — reszta jest gramatyczna, ale zobacz „Zostawione na później" niżej.
- **L3 — błąd walidacji nie wskazywał pola.** Komunikat trafia do `[data-result]`, które ma
  `role="status"`, więc **jest** ogłaszany; brakowało związania go z polem. Nowa
  `invalidFields()` w `assets/calculators.js` pyta o to sam silnik: pole jest winne, jeśli
  formularz nadal jest odrzucany, gdy wszystkie **inne** pola wrócą do wartości, z którymi
  strona się otwiera (te są poprawne z definicji — build renderuje z nich przykład).
  Żadnej drugiej kopii walidacji. Pola dostają `aria-invalid` i `aria-describedby`
  wskazujące `#calc-result`, i tracą je, gdy formularz policzy.
- **L4 — projekt bez nazwy.** `wsAddProject()` przycina teraz białe znaki i odrzuca pustą
  nazwę, tak jak `wsAddRoom()` i `wsUpdateProject()` robiły od dawna.
- **L5 — cofnięcie usunięcia wskrzeszało za dużo.** `wsRestoreProject()` przywraca dziecko
  tylko wtedy, gdy jego `deletedAt` nadal równa się znacznikowi z tokenu. Pozycja skasowana
  osobno **po** usunięciu projektu ma znacznik późniejszy i zostaje skasowana.
- **L6 — tapeta: pas dłuższy niż rolka.** Silnik zwracał jedną rolkę na pas i wypisywał
  wiersz „pas dłuższy niż rolka" — wiersz mówił prawdę, a `tobuy` dalej podawał liczbę
  wyglądającą na zamówienie. Teraz `err_toobig`, tak samo jak `linear` odrzuca element
  dłuższy niż sztanga. Klucz `res_strip_too_long` zniknął z trzynastu słowników razem
  z gałęzią, która go używała.

**Rozmrożenie.** `PL_ONLY` stało na `true` od sesji 57, więc build pisał wyłącznie polskie
strony — a dwa z sześciu znalezisk siedziały na stronie ukraińskiej. Decyzja właściciela
2026-09-09: rozmrozić. Zdejmowanie flagi było czyste, bo build nie miał już żadnego długu
(`docs/TRANSLATIONS_TODO.md` zniknął sam). Przy okazji poprawiona sama księgowość długu:
forma `_few` należy się tylko językowi, który ją ma — angielski, niemiecki, włoski,
holenderski, hiszpański i francuski nie mają „few", więc `calculators_few` nie jest dziurą
do przetłumaczenia. Rozstrzyga `pluralForm(3, lang)`, nie druga lista.

**Testy** (nowe przypadki napisane przed poprawką, każdy oglądany jako czerwony):
`test-calculators.mjs` — odmowa tapety, formy obu liczników w trzynastu językach, podział
reguły „one" między polskim a ukraińskim/chorwackim/serbskim, `invalidFields()` na każdym
polu każdego kalkulatora; `test-projects.mjs` — pusta nazwa i drugie usunięcie pozycji;
`test-copy.mjs` §8 — forma zdaniowa nazwy dokumentu; `test-langs.mjs` §6 — licznik na
wysłanej stronie; `test-a11y.mjs` — `#calc-result` i atrybuty, które go wskazują.

**Zastane, nie z tej sesji.** `scripts/test-a11y.mjs`, `test-langs.mjs` i `test-seo.mjs`
porównywały ścieżki z ukośnikiem z tym, co `join()` składa na Windowsie odwrotnym — a11y
i seo wywracały się na tym z wyjątkiem, langs zgłaszał trzy fałszywe defekty. Ścieżka jest
teraz normalizowana przy zbieraniu stron. Bez tego nie dało się zweryfikować tej sesji na
tej maszynie. Nietknięte zostają: `test-copy.mjs` (`privacy-policy.html` ma 3813 słów przy
budżecie 3800) i siedem porażek `test-security.mjs` — obie sprzed tej sesji.

**Zostawione na później, do raportu, nie do zrobienia tutaj.** W czeskim, słowackim
i chorwackim zdanie z linkiem ma niezgodność liczby czasownika z podmiotem: „Vše popisuje
Zásady ochrany soukromí" (podmiot w liczbie mnogiej, czasownik w pojedynczej; podobnie
`Všetko popisuje` i `Sve to opisuje`). To nie jest L2 — to osobne znalezisko i osobna
sesja.

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
| 1 | ~~`firebase deploy --only firestore`~~ | Firebase CLI **albo konsola** | **ZROBIONE 31.08.2026** — właściciel wkleił `config/firebase/firestore.rules` w Firebase → Firestore Database → Rules i opublikował, z telefonu. Zweryfikowane: odczytany z konsoli blok `validMaterial` zgadza się z repo **co do znaku**, a leży w linii 210 z 270, więc `validClient()`, `validJob()` i `validQuote()` weszły razem z nim | **Nic. Klienci, zlecenia, wyceny i własne materiały jadą na telefon.** Konsola okazała się prostsza niż CLI: plik wkleja się w całości, a niekompletny nie skompiluje się i nie zostanie przyjęty |
| 2 | ~~**Wgranie AAB do Play**~~ | Play Console | **ZROBIONE — i 1.11.0 JEST W PRODUKCJI, zmierzone 31.08.2026** na żywych stronach sklepu we wszystkich dziesięciu językach (`play.google.com/store/apps/details?id=pl.materio.app&hl=…` → wersja **1.11.0**). To pierwszy pomiar, a nie założenie: wcześniejsze sesje mogły tylko powiedzieć, co jest w repo | **Ale notatki „Co nowego" to WCIĄŻ te z 1.10.2** — o wyłączonym logowaniu Google. AAB poszedł bez wklejenia bloku z `docs/RELEASE_NOTES_1.11.0.md`, więc jedenaście sesji dojechało do ludzi opisane jako zmiana w logowaniu. To także drugie miejsce, w którym stoi martwa domena — patrz punkt 3 |
| 3 | **Opis w sklepie wysyła ludzi na martwą domenę** | Play Console → Główna karta sklepu (**11 języków**) i „Co nowego" | **Pełny opis: POPRAWIONY I WYSŁANY DO SPRAWDZENIA 31.08.2026** (właściciel). Na publicznej stronie 31.08 wieczorem dalej stoi stary tekst we wszystkich dziesięciu językach — to normalne, recenzja karty sklepu trwa od godzin do doby. **Zmierzyć ponownie przed odhaczeniem**, nie odhaczać na podstawie tego, że zostało wysłane. Pomiar: `curl "play.google.com/store/apps/details?id=pl.materio.app&hl=<jez>"` i szukać `materio-app.com` | **Zostaje pole „Co nowego"**, gdzie stoi drugie i gorsze zdanie — kieruje kogoś, kto stracił dostęp do konta, pod adres, którego nie ma. Notatki są przypięte do WYDANIA, więc jeśli 1.11.0 nie da się już edytować, poprawka jedzie z następnym AAB. Tekst czeka gotowy w `docs/RELEASE_NOTES_1.11.0.md` §4 |
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

## Znane ograniczenia — nie są usterkami do znalezienia, są długiem do spłacenia

### Bramka po stronie serwera — otwarte od 2026-09-04, bez przypisanej sesji

**Brama przed cenami na `/projekty/`, `/kosztorys/` i `/app/dashboard/` czyta wyłącznie
podpowiedź `liczmat-signed-in`.** `lmReadLevel()` w `assets/account.js` mówi to sam o
sobie od zawsze: „a hint, never a gate" — i to zdanie było prawdziwe, dopóki podpowiedź
decydowała tylko o słowach. Od 2026-09-04 decyduje też o cenie, wycenie i PDF-ie na tych
trzech stronach, więc wpisanie w konsoli przeglądarki
`localStorage.setItem("liczmat-signed-in", "pro")` i odświeżenie którejkolwiek z nich
odblokowuje ceny, PDF i wyceny bez żadnego konta Pro. To jest dokładnie to samo
ograniczenie, które sekcja „Ograniczenie, które zostaje" wyżej opisuje dla całego modelu
Free/Pro — zapisane tu osobno, bo dotyczy konkretnie trzech stron, a nie zasady w ogóle.

Utwardzenie wymaga jednego z dwóch:

1. **Wyprowadzić poziom z Firebase na `/projekty/` i `/kosztorys/`, tak jak robi to
   `/app/`** (`state.level` z `lmLevelOf()`, nie hint) — `/app/dashboard/` zostałoby przy
   podpowiedzi celowo, bo cała jej konstrukcja to brak połączenia z Firebase dla szybkości
   pierwszego ekranu; ta strona wymagałaby osobnej decyzji, czy szybkość wciąż wygrywa
   z ceną na wyświetlonych projektach.
2. **Przenieść generowanie PDF-u i liczenie wyceny na serwer** (Cloud Function wołana
   z tokenem konta), żeby przeglądarka nigdy sama nie decydowała, czy wolno wyprodukować
   dokument — wtedy podpowiedź w `localStorage` przestaje mieć znaczenie, bo produkt nie
   powstaje po jej stronie.

Żadne z dwóch nie jest zrobione ani zaplanowane na konkretną sesję numerowaną; ten akapit
jest zapisem znanego ograniczenia do rozstrzygnięcia później, obok notatki o aplikacji
Androida poniżej.

### Ta sama restrykcja w aplikacji Androida — otwarte od 2026-09-04, drugie repo

**Ta sama restrykcja nie jest jeszcze zrobiona w `3d-polednia/Materio`.** Zakresem tej
sesji było wyłącznie `materio-web`. Aplikacja czyta to samo pole `plan` z `users/{uid}`, ma
własny eksport PDF (`AndroidProjectPdfExporter`, `PdfConfigScreen`) i własne ekrany z
kwotami, i **dziś nie sprawdza planu w żadnym z tych miejsc**. Dopóki tego nie zrobi,
darmowe konto zablokowane na stronie zrobi ten sam PDF na telefonie. Następna sesja: te
same trzy warstwy po stronie Androida, na tym samym polu `plan`.

### Bramka Free/Pro nigdy nie będzie granicą bezpieczeństwa po stronie przeglądarki

**To nie jest granica bezpieczeństwa i nigdy nie będzie**, dopóki decyzja zapada w
przeglądarce. Cały model to JavaScript, który odwiedzający ma u siebie: kto zmieni
`assets/plan.js` w devtools, dostanie stronę mówiącą „Pro". Twarda gwarancja wymaga usługi
po stronie serwera, która renderuje PDF i liczy wycenę — dziś nie ma jej ani w planie, ani
w `functions/`. `assets/plan.js` mówi to od Sesji 21 i nadal mówi. Granicą pozostają
wdrożone reguły Firestore: `plan` jest polem, które zapisuje wyłącznie serwer.

Sklep CRM to `localStorage` na jednym urządzeniu i nie ma go w żadnym kontrakcie

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

> Pozycje już rozstrzygnięte przeniesiono 2026-09-09 do `Obsidian/Liczmat/Historia/Rozstrzygniete decyzje i zamkniete ostrzezenia.md`.

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
