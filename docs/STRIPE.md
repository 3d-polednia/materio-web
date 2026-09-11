# Stripe — jak włączyć sprzedaż LiczMat Pro

Lista kroków dla właściciela. Każdy z nich jest klikaniem w konsoli Stripe'a albo
poleceniem na jego komputerze — **żadnego nie da się zrobić z repozytorium**, bo konto
Stripe'a i klucz wdrożeniowy istnieją tylko po jego stronie. Kod, który to obsłuży, jest
gotowy od Sesji 38 (`functions/`); ten plik mówi, co ma stanąć wokół niego.

Kolejność jest ta sama, co nota **ORDER** na końcu `assets/pay.js`, i nie jest dowolna:
**przycisk kasy włączony przed krokiem 5 bierze pieniądze za nic.**

---

## 0. Najpierw piaskownica, potem żywe konto

Stripe ma dwa tryby i **każdy ma własny sekret webhooka**. Funkcja czyta jeden sekret
(`STRIPE_WEBHOOK_SECRET`), więc cały przebieg robi się dwa razy:

1. **Sandbox / tryb testowy** — produkty, Payment Linki, webhook, sekret testowy, płatność
   kartą `4242 4242 4242 4242`. Tu sprawdza się, że konto samo staje się Pro.
2. **Tryb żywy** — te same produkty i linki jeszcze raz, webhook jeszcze raz, **nowy
   sekret** wpisany na to samo nazwane hasło i ponowne `firebase deploy --only functions`,
   a potem jedna prawdziwa płatność własną kartą.

Adresy wklejane do `assets/pay.js` w kroku 7 to **linki z trybu żywego**. Link testowy
ma w adresie `test_` i pobrałby zero złotych od każdego odwiedzającego.

---

## 0b. Produkty i ceny zakłada skrypt, nie ręka

Od sesji 70 kroków 1 i 2 nie trzeba klikać: `scripts/stripe-setup.mjs` tworzy oba produkty,
obie ceny cykliczne z czternastoma kwotami w siedmiu walutach i oba Payment Linki przez
REST API Stripe'a. Kwoty czyta z `LM_PAY` w `assets/pay.js`, więc cennik ma jedno źródło
prawdy i nie da się go rozjechać ze stroną.

```bash
STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs --sandbox --dry-run   # nic nie tworzy
STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs --sandbox
```

Klucz idzie **wyłącznie** zmienną środowiskową — nigdy w argumencie i nigdy w repozytorium.
`--sandbox` odmawia pracy z kluczem `sk_live_`, `--live` z kluczem `sk_test_`.
Skrypt jest idempotentny (produkty po `metadata.lm_plan`, ceny po `lookup_key`, linki po
identyfikatorze ceny), więc ponowne uruchomienie niczego nie mnoży. Ceny w Stripe są
**niezmienne**: gdy kwota w `pay.js` różni się od tej, która już istnieje, skrypt odmawia
i mówi wprost, że trzeba nowego `lookup_key` albo dezaktywacji starej ceny.

Na koniec wypisuje gotową linijkę `STRIPE_PRICE_IDS=prod_...,prod_...` do `functions/.env`
i oba adresy Payment Linków. Jednej rzeczy API nie zrobi: **adres portalu klienta**
(`https://billing.stripe.com/p/login/...`) nadal kopiuje się ręcznie z panelu Stripe'a.

Kroki 1 i 2 niżej zostają jako opis tego, co skrypt zakłada, i jako droga ręczna.

---

## 1. Dwa produkty i czternaście kwot

Stripe → **Products** → dwa produkty, oba z ceną **cykliczną** (recurring):

| produkt | okres | PLN | EUR | USD | UAH | CZK | RON | RSD |
|---|---|---|---|---|---|---|---|---|
| LiczMat Pro — miesięcznie | co miesiąc | 39,99 | 9,99 | 10,99 | 479 | 229 | 49,99 | 1099 |
| LiczMat Pro — rocznie | co rok | 399,99 | 99,99 | 109,99 | 4799 | 2290 | 499,99 | 10990 |

To są **te same czternaście kwot, co w `LM_PAY` w `assets/pay.js`**. Serwis wypisuje je
z pliku, Stripe pobiera je z produktu — rozjechanie jednego z drugim jest jedynym błędem,
przed którym nic w tym repozytorium nie ochroni, bo repozytorium nie widzi konta Stripe'a.

**Waluty ustawia się jako „ceny w innych walutach" przy jednej cenie**, a nie jako siedem
osobnych cen: w cenie → *Add a price by currency* (w API: `currency_options`). Pierwsza
waluta jest domyślną ceny i musi być ta sama w obu produktach.

**Dlaczego akurat tak.** Adaptive Pricing (automatyczne przeliczanie po kursie Stripe'a)
jest **zawsze włączone dla Payment Linków i nie da się go tam wyłączyć**. Ręcznie wpisana
kwota w danej walucie **ma nad nim pierwszeństwo** — więc siedem wpisanych walut to
jedyny sposób, żeby odwiedzający zobaczył u Stripe'a dokładnie tę kwotę, którą widział
na stronie, a nie jej przeliczenie z doliczoną prowizją 2–4%.

## 2. Payment Linki i portal klienta

Stripe → **Payment Links** → jeden link na produkt. Do sprawdzenia przy każdym:

- **`client_reference_id` musi przechodzić.** Od 2026-09-09 jedzie tam **bilet**, a nie
  goły uid: podpisany napis `v1.<uid>.<data>.<podpis>`, który `/app/` bierze z funkcji
  `payTicket` (znalezisko M1 audytu — uid w adresie URL każdy mógł przepisać na cudzy).
  Stripe przyjmuje litery, cyfry, `-`, `_` i `.`, do 200 znaków (bilet ma około 90),
  a **wartość niepoprawną po cichu wyrzuca**. Sprawdzenie: otworzyć link
  z `?client_reference_id=test_123` i po zapłacie testowej zobaczyć tę wartość na sesji
  w panelu Stripe'a — sam webhook taką wartość odrzuci, bo nie jest podpisana, i przypnie
  płatność adresem e-mail z sesji.
- **Adres e-mail** — serwis dokleja `prefilled_email`; link nie może tego blokować.
- **Subskrypcja, nie płatność jednorazowa.** Funkcja świadomie ignoruje sesję, która nie
  jest w trybie `subscription`: nie ma czego odnawiać.

Stripe → **Settings → Billing → Customer portal** → włączyć i skopiować adres logowania
(`https://billing.stripe.com/p/login/...`). To jest jedyne miejsce, w którym ktoś
anuluje subskrypcję — serwis nie ma serwera, który mógłby cokolwiek u Stripe'a zapisać.

## 3. Sekret, lista produktów i wdrożenie funkcji

### 3a. Które subskrypcje są LiczMat Pro

Webhook nadaje Pro **wyłącznie** subskrypcjom z wpisanej listy. Bez niej nie nadaje go
nikomu — i to jest zachowanie zamierzone, a nie awaria. Do Sesji 62 listy nie było i
każda subskrypcja na koncie Stripe'a, także dowolna dołożona w przyszłości, dawała pełny
dostęp; tak samo każde zdarzenie z piaskownicy, gdyby trafiło w ten sam adres
(znalezisko H1 audytu 2026-09).

Plik `functions/.env`, obok `functions/index.js` — to **nie jest** sekret, Price ID widać
w adresie kasy, więc nie idzie do Secret Managera:

```
STRIPE_PRICE_IDS=prod_XXXXXXXX,prod_YYYYYYYY
STRIPE_LIVE_MODE=true
```

- **Product ID** (`prod_…`, dwa z kroku 1) obejmuje wszystkie ceny produktu, czyli
  wszystkie siedem walut naraz — i dlatego jest wygodniejszy niż Price ID. **Price ID**
  (`price_…`) zawęża do jednej ceny; wolno mieszać jedno z drugim.
- Identyfikator kopiuje się w Stripe → Products → nazwa produktu, pole *Product ID*.
- **`STRIPE_LIVE_MODE=false` na czas przebiegu w piaskownicy** z kroku 0, i z powrotem na
  `true` przed pierwszym żywym linkiem. Identyfikatory produktów też są wtedy testowe:
  piaskownica ma własne. Zdarzenie z drugiego trybu jest kwitowane i ignorowane.
- Po każdej zmianie tego pliku: `firebase deploy --only functions`. Wartości wchodzą przy
  wdrożeniu, nie w locie.
- **`.gitignore` nie wpuszcza `.env` do repozytorium** — tak samo jak sekretu. Plik żyje
  więc tylko na komputerze, z którego wdrażasz, i tam ma zostać. Wdrożenie ze świeżego
  klona bez tego pliku nie zepsuje sprzedaży w sposób, którego nie widać: lista jest
  wtedy pusta, więc żadna płatność nie nadaje Pro, a każde zdarzenie zostawia w logu
  ostrzeżenie `zdarzenie spoza sprzedaży LiczMat Pro`.

### 3b. Sekret i wdrożenie

Na komputerze właściciela, w katalogu repozytorium:

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # wartość z kroku 4, za pierwszym razem pusto — patrz niżej
firebase functions:secrets:set PAY_TICKET_SECRET       # własny, dowolny długi losowy napis; ustawia się raz
firebase deploy --only functions
```

`PAY_TICKET_SECRET` nie pochodzi od nikogo z zewnątrz — to nasz własny klucz do podpisu
biletu (`functions/pay-ticket.mjs`), więc wystarczy dowolny długi losowy napis, choćby
z `openssl rand -base64 48`. **Wdrożenie bez niego nie przejdzie**, bo deklarują go obie
funkcje. Wdrożenie z nim, ale ze stroną sprzed tej zmiany, działa dalej: płatność bez
biletu przypina się adresem e-mail z sesji Stripe'a.

Kolejność jest kurą i jajkiem: sekret pochodzi z webhooka, a adres webhooka z wdrożenia.
Wyjście z tego jest takie: **wdrożyć raz z dowolną wartością** (funkcja odrzuci wtedy
każde zdarzenie i nic nie zepsuje), wziąć adres z wyjścia `deploy`, założyć webhook
z kroku 4, a potem wpisać prawdziwy sekret i **wdrożyć jeszcze raz** — nowa wersja
sekretu wchodzi dopiero z kolejnym wdrożeniem.

Plan Blaze jest wymagany i właściciel go ma. Region funkcji to `europe-central2`, ten sam,
w którym stoi Firestore.

## 4. Webhook w Stripe

Stripe → **Developers → Webhooks → Add endpoint**, adres z kroku 3, i **dokładnie cztery
zdarzenia** — te, które obsługuje `functions/stripe-map.mjs`:

```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

Skopiować **Signing secret** (`whsec_…`) i wrócić do kroku 3. Sekret nie trafia do
repozytorium **nigdy** — `scripts/test-security.mjs` §12 przewraca się, jeśli trafi.

Czego się spodziewać w logu endpointu:

| odpowiedź | co znaczy |
|---|---|
| `200 ok` | plan zapisany |
| `200 ignored` | nie nasze zdarzenie: obcy typ, obcy produkt albo drugi tryb konta. Obcy produkt i obcy tryb zostawiają ostrzeżenie w logu — jeśli widać je po **własnej** płatności, znaczy to, że `STRIPE_PRICE_IDS` albo `STRIPE_LIVE_MODE` z kroku 3a są nie te |
| `200 duplicate` / `stale` / `terminated` | zdarzenie już zastosowane, starsze niż ostatnie, albo przyszłe po końcu subskrypcji. Ponowienie nic by nie zmieniło, więc Stripe dostaje 200 |
| `400` | podpis się nie zgadza — zły sekret albo zły tryb (test vs żywy) |
| `503` | zdarzenie subskrypcji przyszło **przed** sesją Checkout, więc uid jest jeszcze nieznany. Stripe ponawia przez kilka dni i to jest zachowanie zamierzone, nie awaria |

## 5. Jedna płatność i sprawdzenie, że plan zapala się sam

Na `/app/`, zalogowanym kontem, kliknąć kasę (albo otworzyć Payment Link ręcznie
z `?client_reference_id=<bilet>`, gdzie bilet to odpowiedź funkcji `payTicket` — goły uid
webhook odrzuci) i zapłacić. Potem, **nie przeładowując `/app/`**:

- plakietka poziomu ma się zmienić na **LICZMAT PRO** sama — `/app/` trzyma `onSnapshot`
  na `users/{uid}` od Sesji 37;
- `/klienci/` ma się otworzyć bez ściany;
- Firestore → `users/{uid}` ma mieć `plan: "premium"`, `planValidUntil` (millisekundy)
  i `planRenews: true`, a `createdAt` i `lastSeenAt` **nietknięte**;
- Firestore → `stripeCustomers/{customerId}` ma mieć `{ uid, email, activeSubscriptionId, updatedAt }`;
- Firestore → `stripeSubscriptions/{subscriptionId}` ma mieć `{ uid, customerId, ours,
  lastEventCreated, lastEventIds, terminal }`. To jest pamięć tego, które zdarzenia już
  zastosowano: bez niej spóźnione zdarzenie Stripe'a przywracało plan odebrany po zwrocie
  pieniędzy (znalezisko H2 audytu 2026-09). Kolekcji nie czyta żadna przeglądarka —
  reguły Firestore nie mają dla niej dopasowania, a domyślną odpowiedzią jest odmowa.

  Dokument skończonej subskrypcji dostaje pole `expiresAt` (425 dni, z zapasem nad
  najdłuższym okresem rozliczeniowym). Żeby Firestore kasował je sam, trzeba raz założyć
  politykę TTL: Firebase → Firestore → **TTL** → kolekcja `stripeSubscriptions`, pole
  `expiresAt`. Bez polityki dokumenty zostają i kosztują tyle, co jeden dokument na
  subskrypcję — nic się nie psuje.

Potem anulowanie w portalu klienta: `planRenews` schodzi na `false`, `planValidUntil`
**zostaje** i moduły są otwarte do końca opłaconego okresu. To jest zachowanie zamierzone.

Gdyby plan się nie nadał, ratunkiem jest `scripts/pro-admin.mjs grant <e-mail> <miesiące>`
— i to jest zarazem sposób na oddanie komuś tego, za co zapłacił, zanim webhook zostanie
naprawiony.

## 6. Dopiero teraz: trzy adresy w repozytorium

W `assets/pay.js`, w `LM_PAY`:

- `portalUrl` → adres portalu klienta z kroku 2,
- `plans[0].link` → Payment Link planu miesięcznego,
- `plans[1].link` → Payment Link planu rocznego.

Nic więcej nie trzeba edytować: `lmPayBuyable()` zaczyna być prawdą i przyciski kasy
zapalają się same, a zdanie „subskrypcji jeszcze nie da się wykupić" znika. Po edycji:

```bash
node scripts/test-pay.mjs        # §3 sprawdza wtedy stan otwarty: wszystko albo nic
node scripts/test-plan.mjs
node scripts/build.mjs           # STAMP w scripts/build.mjs podbity, ?v= w 404.html i privacy-policy.html ręcznie
```

---

## 7. Okres próbny — co to zmienia w tej procedurze

Od sesji 70 każde nowo założone konto dostaje **14 dni LiczMat Pro**. Robi to wyzwalacz
`grantTrial` w `functions/index.js`, odpalany przy utworzeniu dokumentu `users/{uid}` —
a ten dokument zakłada tak samo przeglądarka, jak i aplikacja na Androidzie, więc obie
drogi rejestracji są obsłużone jednym kawałkiem kodu.

Co z tego wynika dla płatności:

- Wyzwalacz jedzie tym samym `firebase deploy --only functions`, co webhook. Wymaga planu
  Blaze i Eventarc — tak jak reszta funkcji.
- Konto w okresie próbnym ma `plan: "premium"`, `planValidUntil` za czternaście dni,
  `planRenews: false` i **`planSource: "trial"`**. To czwarte pole jest jedyną różnicą
  między okresem próbnym a anulowaną subskrypcją — bez niego strona nie umiałaby ich
  rozróżnić, bo pozostałe trzy pola wyglądają identycznie.
- `planWrite()` w `functions/stripe-map.mjs` **zawsze kasuje `planSource`**. Konto, które
  zapłaci w trakcie okresu próbnego, przestaje być kontem próbnym w tym samym zapisie,
  który zapisuje subskrypcję. Przy płatności testowej z kroku 5 sprawdź to wprost:
  po zapłacie w `users/{uid}` **nie ma już** pola `planSource`.
- Portal klienta nie jest pokazywany kontu w okresie próbnym — nie ma tam czego zarządzać.
  Ceny i przycisk kasy **są** pokazywane: te czternaście dni to całe okno na konwersję.
- Drugiego okresu próbnego to samo konto nie dostanie: ślad zostaje w kolekcji
  `trialGrants/{uid}`, której reguły Firestore nie udostępniają żadnej przeglądarce i która
  zostaje po skasowaniu konta. Nowy adres e-mail to nowe konto i nowy okres próbny.
- Nic nie chodzi po kontach w tle. Pro gaśnie samo, bo `planValidUntil` jest datą, a
  `lmLevelOf()` w `assets/plan.js` ją czyta.

Konta założone **przed** wdrożeniem wyzwalacza nie dostają nic automatycznie. Dla nich:

```bash
LM_SA_KEY=… node scripts/pro-admin.mjs trial ktos@example.com
```

---

## Co zostaje otwarte i jest decyzją właściciela

**Waluta u Stripe'a bierze się z kraju odwiedzającego, nie z wybieraka na stronie.**
Payment Link nie przyjmuje parametru waluty (tylko sesja Checkout tworzona po stronie
serwera, a serwisu statycznego na to nie stać), a Adaptive Pricing wybiera walutę po
adresie IP. Ktoś w Polsce, kto ustawił na stronie EUR, zobaczy więc u Stripe'a 39,99 zł.
Kwota jest wtedy nadal jedną z czternastu wpisanych ręcznie — nie jest przeliczana po
kursie — ale **nie jest tą, którą pokazała strona**. Trzy wyjścia:

1. zostawić i dopisać na `/app/` jedno zdanie o tym, że rozliczenie idzie w walucie kraju
   (nowy klucz w dziesięciu językach — osobna sesja);
2. czternaście Payment Linków, po jednym na walutę, i wybór linku po walucie
   odwiedzającego (`LM_PAY` trzyma dziś jeden link na plan — zmiana kształtu konfiguracji);
3. zostawić bez słowa — najtańsze i jedyne, które może zaskoczyć płacącego.

**Kraj spoza siódemki walut.** Ktoś na Węgrzech dostanie od Adaptive Pricing kwotę
przeliczoną po kursie Stripe'a z prowizją 2–4%, bo forintów nie ma na liście. Strona
pokaże mu cenę w walucie domyślnej jego języka. To jest ta sama sprawa co wyżej, tylko
z drugiej strony.

**Podatek.** Nic w tym repozytorium nie liczy VAT-u i `assets/pay.js` nie ma pola na
podatek. Czy ceny są brutto, czy netto, i czy włączyć Stripe Tax — to decyzja księgowa
właściciela, podjęta **przed** pierwszą prawdziwą płatnością, bo zmiana po fakcie dotyka
wystawionych już faktur.
