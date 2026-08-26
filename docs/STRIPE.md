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

- **`client_reference_id` musi przechodzić.** To jest uid konta i bez niego płatność nie
  ma do kogo przypiąć planu. Stripe przyjmuje litery, cyfry, `-` i `_`, do 200 znaków
  (uid Firebase ma 28 znaków), a **wartość niepoprawną po cichu wyrzuca**. Sprawdzenie:
  otworzyć link z `?client_reference_id=test_123` i po zapłacie testowej zobaczyć tę
  wartość na sesji w panelu Stripe'a.
- **Adres e-mail** — serwis dokleja `prefilled_email`; link nie może tego blokować.
- **Subskrypcja, nie płatność jednorazowa.** Funkcja świadomie ignoruje sesję, która nie
  jest w trybie `subscription`: nie ma czego odnawiać.

Stripe → **Settings → Billing → Customer portal** → włączyć i skopiować adres logowania
(`https://billing.stripe.com/p/login/...`). To jest jedyne miejsce, w którym ktoś
anuluje subskrypcję — serwis nie ma serwera, który mógłby cokolwiek u Stripe'a zapisać.

## 3. Sekret i wdrożenie funkcji

Na komputerze właściciela, w katalogu repozytorium:

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # wartość z kroku 4, za pierwszym razem pusto — patrz niżej
firebase deploy --only functions
```

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
| `200` | zdarzenie obsłużone albo świadomie zignorowane |
| `400` | podpis się nie zgadza — zły sekret albo zły tryb (test vs żywy) |
| `503` | zdarzenie subskrypcji przyszło **przed** sesją Checkout, więc uid jest jeszcze nieznany. Stripe ponawia przez kilka dni i to jest zachowanie zamierzone, nie awaria |

## 5. Jedna płatność i sprawdzenie, że plan zapala się sam

Na `/app/`, zalogowanym kontem, kliknąć kasę (albo otworzyć Payment Link ręcznie
z `?client_reference_id=<uid>`) i zapłacić. Potem, **nie przeładowując `/app/`**:

- plakietka poziomu ma się zmienić na **LICZMAT PRO** sama — `/app/` trzyma `onSnapshot`
  na `users/{uid}` od Sesji 37;
- `/klienci/` ma się otworzyć bez ściany;
- Firestore → `users/{uid}` ma mieć `plan: "premium"`, `planValidUntil` (millisekundy)
  i `planRenews: true`, a `createdAt` i `lastSeenAt` **nietknięte**;
- Firestore → `stripeCustomers/{customerId}` ma mieć `{ uid, email, updatedAt }`.

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
