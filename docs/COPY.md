# Copy — co strona ma prawo powiedzieć i ile tego może być

Dokument narracyjny do `scripts/test-copy.mjs`, dokładnie w tej relacji, w jakiej
`docs/DESIGN_SYSTEM.md` stoi obok `src/tokens.mjs`: **tutaj jest argument, tam jest
egzekwowanie.** Jeżeli zmieniasz regułę, zmieniasz oba pliki w jednej sesji.

Powstał w Sesjach 44 i 45 planu naprawczego („stop slop"). Decyzja właściciela z
2026-08-21 brzmi jednym zdaniem:

> „stop slop" znaczy **skrócić** plus **test, który pilnuje**.

Skrócenie bez testu jest jednorazowe — następna sesja dopisze akapit i nikt tego nie
zauważy. Dlatego reguła jest tu tylko wtedy, gdy da się ją zmierzyć maszyną.

---

## Skąd te reguły

Wszystkie sześć wychodzi z `MASTER_PLAN.txt` i z `CLAUDE.md`. Żadna nie jest cudzym
przewodnikiem stylu.

| Reguła | Źródło |
|---|---|
| §2 długość | XXVII: „Nie chcemy: **ścian tekstu**" |
| §3 powtórzenia | XXVII: „**powtarzających się CTA**"; XII: treść SEO nie może zasłaniać kalkulatora |
| §4 obietnice | `CLAUDE.md`: „no claims nobody can verify"; XXIX: „Bez marketingowego przesytu" |
| §5 krzyk | XXVII: „marketingowego **«krzyku»**" |
| §6 wata słowna | XXVI: „Nie upychaj słów kluczowych" |
| §7 budżet strony | XXVII: „ściany tekstu" + XII, mierzone na całej stronie zamiast na akapicie |

---

## Reguły

### §2 — zdanie do 25 słów, tekst do 240 znaków

Dwie liczby, obie zmierzone na tej stronie 2026-08-26, nie wzięte z podręcznika. Przed
Sesją 44 **24 zdania** przekraczały 25 słów (najdłuższe, `g_rozkroj_tip` po angielsku,
miało 32) i **52 teksty** przekraczały 240 znaków (najdłuższy, `ck_p_signed_in` po
niemiecku, miał 326).

240 znaków to około czterech linijek na telefonie 320 px — najwęższym ekranie rozdziału
XXVIII, tym, który mierzy `scripts/test-phone.mjs`.

Ani jedno z tych zdań nie było nieprawdziwe. Każde mówiło trzy rzeczy naraz. Naprawa
polegała na postawieniu kropki, nie na wykreśleniu faktu — jedyny fakt, który zniknął,
opisuje §4.

### §3 — strona kalkulatora nie mówi dwa razy tego samego

Strona kalkulatora niesie ostrzeżenie nad kalkulatorem (`note_<id>` w „Jak to liczymy")
i FAQ pod nim (`src/calc-seo.mjs`). Pisała je ręka, w odstępie jednej sesji. Efekt: **25
ze 150 stron kalkulatorów** drukowało zdanie z noty jeszcze raz, słowo w słowo, w
odpowiedzi FAQ. Po polsku `wallpaper` powtarzał **całą** notę.

To nie jest kosmetyka. FAQ jedzie do wyniku wyszukiwania jako `FAQPage`, więc powtórzone
zdanie jest powtórzone także w Google.

Reguła nie zabrania powtórzenia krótkiego zdania (próg to 25 znaków): „Kupuj z jednej
partii." powtarzane w kilku miejscach to słownictwo, nie ściana.

**Naprawa nie polega na przepisaniu tak, żeby test przestał widzieć.** Odpowiedź FAQ ma
odpowiedzieć na pytanie i dołożyć to, czego nota nie mówi — najczęściej gdzie się tę
wartość wpisuje. Jeżeli po skróceniu FAQ nie ma nic własnego do powiedzenia, to znaczy,
że nie powinno go tam być.

### §4 — nic, czego strona nie potrafi dotrzymać

Dwie rodziny.

**Data, której nie ma.** `pay_soon` mówiło „płatności uruchamiamy wkrótce" we wszystkich
dziesięciu językach, w czasie gdy konta Stripe nie było. Obietnica bez daty, na jedynej
stronie, która prosi o pieniądze. Naprawa: **skasować obietnicę**, nie przeredagować.
Zdanie przed nią („subskrypcji jeszcze nie da się wykupić") jest całą prawdą i nie
potrzebuje ciągu dalszego.

**Superlatyw.** Zero w dniu pisania reguły. Ta połowa jest siatką pod następną sesją, a
nie raportem o tej.

Listy są celowo krótkie i dosłowne. Sprytny wzorzec (`ideal*`) łapie rumuńskie i
chorwackie słowo „ten sam" i pół niemieckiego — w dziesięciu językach spryt jest fałszywym
alarmem w sześciu.

### §5 — bez krzyku

Zero wykrzykników i zero słów wersalikami poza listą skrótów, których produkt naprawdę
używa (OSB, ETICS, GKFI, CETRIS, PMMA, waluty…). W dniu pisania reguły obie połowy dały
zero. Zostaje jako siatka: wykrzyknik jest o jeden nieuważny commit dalej, a krzyczące
słowo pojawia się przy pierwszym „DARMOWE" w plakietce.

Skróty są **wypisane**, nie dopasowywane wzorcem — nowy skrót ma być decyzją, którą ktoś
tutaj podejmuje.

### §6 — słowo, które nic nie niesie

Wzmacniacz i chrząknięcie: „po prostu", „naprawdę", „warto pamiętać, że". Sprawdzian jest
prosty: skreśl je i zobacz, czy zdanie mówi mniej. Osiemnaście trafień w pięciu językach,
każde czytało się lepiej bez tego słowa.

Angielskiego „just" **nie ma na liście i być nie może**: znaczy też „dokładnie" i
„sprawiedliwie", a ta strona pisze „just under 5 mm". Słowo, które trzeba czytać w
kontekście, nie jest słowem dla wyrażenia regularnego.

### §7 — ile prozy niesie strona

§2 ogranicza akapit; to ogranicza stronę. Rozdział XII mówi już, że treść SEO nie może
stać przed kalkulatorem, i `scripts/test-calc-seo.mjs` sprawdza to **pozycją** — ale
strona może zachować kolejność i dalej być ścianą, mówiąc w sześciu akapitach to, co
zmieści się w dwóch. Więc liczone są słowa w `<main>`, osobno dla każdego typu strony.

Budżet to najszerszy język danego typu, zaokrąglony w górę do dziesiątki. **Marginesu nie
ma celowo**: sesja, która chce powiedzieć więcej, przychodzi do tabeli, podnosi liczbę i
tłumaczy się w raporcie. To jest cały mechanizm, o który prosił właściciel.

Dwa typy są listą, nie prozą, i mają budżet listy: `materials` to katalog 161 materiałów,
`privacy` to polityka prywatności, która niesie dwie pełne wersje językowe w jednym pliku,
bo Google Play wymaga jednego adresu.

---

## Czego te reguły **nie** robią

- **Nie zabraniają myślnika.** `CLAUDE.md` zabrania myślnika użytego jako retoryczna
  pauza, a to jest sąd o zdaniu, nie o znaku. Pierwsza wersja tego testu liczyła myślniki
  i wyszło, że kara spada na użycie *poprawne* (para myślników = nawias), a przepuszcza
  niepoprawne. Reguła, która myli się w obie strony, jest gorsza niż jej brak. W polskim
  i ukraińskim myślnik jest zwykłym znakiem interpunkcyjnym i zakaz byłby po prostu błędem.
- **Nie liczą słów kluczowych.** „Nie upychaj słów kluczowych" (XXVI) mierzy się gęstością,
  a gęstość jest fałszywym alarmem na stronie, która z definicji powtarza słowo „płytki".
  Tego pilnuje `scripts/test-calc-seo.mjs` §6, po swojemu.
- **Nie są bezpieczeństwem ani dostępnością.** Nazwy kontrolek pilnuje
  `scripts/test-a11y.mjs`, długość `<title>` i `<meta description>` — `scripts/test-seo.mjs`.

## Pułapka, w której ten test mieszka

`\b` w JavaScripcie jest zdefiniowane przez `\w`, a `\w` to ASCII. W `/\bbest\b/` granica
po „best" trafia **w środek** niemieckiego „Bestätige", bo „ä" nie jest znakiem `\w`.
Pierwsza wersja §4 zgłosiła pięć superlatywów na tej stronie i wszystkie pięć było tym.

`word()` w `scripts/test-copy.mjs` buduje granicę z `\p{L}\p{N}`. Copy w dziesięciu
językach, sześć z diakrytykami i dwa cyrylicą, nie da się sprawdzać ASCII-ową regułą.

## Podział na dwie sesje

Sesja 44 wyczyściła `pl, uk, de, en` i napisała reguły oraz test. Sesja 45 wyczyściła
`cs, sk, ro, hr, sr, ru`. Między jednym a drugim commitem stała `CLEAN` w
`scripts/test-copy.mjs` wymieniała cztery języki, a sześć było pomijane bez błędu — test,
który pada za pracę, której jeszcze nikt nie zrobił, jest testem, którego następna sesja
uczy się nie czytać. Po Sesji 45 `CLEAN` to wszystkie dziesięć i §1 pilnuje, żeby tak
zostało: język dopisany do serwisu bez przejścia przez te reguły wywala test.
