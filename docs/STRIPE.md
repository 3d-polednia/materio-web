# Stripe — stan, architektura i operacje sprzedaży LiczMat Pro

Dokument określa architekturę techniczną, konfigurację w chmurze i Stripe oraz procedury utrzymania i rekonfiguracji sprzedaży LiczMat Pro. Procedury operacyjne obsługi zgłoszeń i awarii pojedynczych kont zebrano w dokumencie `docs/PLATNOSCI-RUNBOOK.md`.

---

## 1. Stan na dziś

Sprzedaż subskrypcji LiczMat Pro działa produkcyjnie od 2026-09-11 w trybie żywym (`STRIPE_LIVE_MODE=true`): w `assets/pay.js` opublikowane są produkcyjne adresy Payment Links oraz adres Customer Portalu, webhook w chmurze odbiera i weryfikuje zdarzenia Stripe, baza Firestore automatycznie aktualizuje uprawnienia subskrypcyjne w profilu użytkownika, a każde nowo zakładane konto otrzymuje 14 dni okresu próbnego. Wszelkie operacje wdrożeniowe zostały sfinalizowane; niniejszy dokument opisuje architekturę systemu, konfigurację środowisk oraz reguły bieżącego utrzymania i modyfikacji obowiązujące od teraz.

---

## 2. Co gdzie stoi

Infrastruktura produkcyjna opiera się na Google Cloud / Firebase (projekt `materio-502513`, plan Blaze, region `europe-central2`, Node 22, Cloud Functions 2. generacji) oraz zarejestrowanym koncie produkcyjnym Stripe (`acct_1UDk8RGmEsit3k9g`, nazwa Liczmat.com, kraj DE, waluta rozliczeniowa EUR, włączone `charges_enabled` i `payouts_enabled`).

### Firebase i Cloud Functions

| Funkcja | Rodzaj | Rola |
|---|---|---|
| `stripeWebhook` | onRequest | Weryfikuje podpis i nadaje uprawnienia subskrypcyjne po zapłacie |
| `payTicket` | onCall | Wystawia podpisany bilet z uid przekazywany w `client_reference_id` |
| `adminPlan` | onCall | Obsługa panelu administratora na `/app/` |
| `grantTrial` | onDocumentCreated `users/{uid}` | Nadaje 14 dni Pro dla nowo utworzonego profilu |

- Adres webhooka: `https://europe-central2-materio-502513.cloudfunctions.net/stripeWebhook` (tożsamy zasób Cloud Run: `https://stripewebhook-5ri62loqba-lm.a.run.app`). Kody odpowiedzi: `405` na GET, `400 bad signature` na niepoprawny podpis POST.
- Secret Manager: `PAY_TICKET_SECRET` (wersja 1), `STRIPE_WEBHOOK_SECRET` (wersja 3 = tryb żywy; wersja 2 to piaskownica, wersja 1 to zaślepka — obie nieużywane). Nowa wersja sekretu zaczyna działać dopiero po wdrożeniu funkcji poleceniem `firebase deploy --only functions`.
- Plik `functions/.env` (poza repozytorium, ignorowany przez `.gitignore`):
```
STRIPE_PRICE_IDS=prod_VEubpxYaA7Ozca,prod_VEubBZAJS5ujo1
STRIPE_LIVE_MODE=true
```

### Identyfikatory Stripe — tryb żywy

- `prod_VEubpxYaA7Ozca` — LiczMat Pro — miesięcznie (`price_1UEQlvGmEsit3k9gj3U9zPjB`, 39,99 PLN + 6 walut)
- `prod_VEubBZAJS5ujo1` — LiczMat Pro — rocznie (`price_1UEQlxGmEsit3k9gNP8ewwtS`, 399,99 PLN + 6 walut)
- `we_1UEQmtGmEsit3k9gWt2Qtxwh` — webhook produkcyjny nasłuchujący 4 zdarzeń
- `bpc_1UEQnbGmEsit3k9g7vdQCT1z` — konfiguracja portalu klienta (anulowanie at_period_end)
- Payment Link miesięczny: `https://buy.stripe.com/28E3cvfyY4QB9ZD4mI0oM00`
- Payment Link roczny: `https://buy.stripe.com/3cI3cvcmMcj33Bf3iE0oM01`
- Portal klienta: `https://billing.stripe.com/p/login/28E3cvfyY4QB9ZD4mI0oM00`

Cennik obejmuje czternaście kwot w siedmiu walutach zdefiniowanych w `currency_options`:

| produkt | okres | PLN | EUR | USD | UAH | CZK | RON | RSD |
|---|---|---|---|---|---|---|---|---|
| LiczMat Pro — miesięcznie | co miesiąc | 39,99 | 9,99 | 10,99 | 479 | 229 | 49,99 | 1099 |
| LiczMat Pro — rocznie | co rok | 399,99 | 99,99 | 109,99 | 4799 | 2290 | 499,99 | 10990 |

Oba Payment Linki mają skonfigurowane przekierowanie po płatności (`after_completion`) na adres `https://liczmat.com/app/`. GBP jest obecny w `LM_CURRENCIES` (liczenie), ale nie w `LM_PAY.currencies` (sprzedaż).

### Identyfikatory Stripe — piaskownica (nieaktywna operacyjnie)

- `prod_VEr7pbfaenHirT` / `price_1UENPEGo3bOSsiBVpeMx8Dvm` (miesięczny)
- `prod_VEr7Ojpc8hJO2i` / `price_1UENPFGo3bOSsiBVAIKoXNcP` (roczny)
- `we_1UENjfGo3bOSsiBVvzmWdwvk` — webhook piaskownicy
- Payment Link testowy: `https://buy.stripe.com/test_3cI8wP1Ip7mG5zFemsgrS00`

Webhook produkcyjny odrzuca zdarzenia z `livemode=false`, a produkty piaskownicy znajdują się poza allowlistą `STRIPE_PRICE_IDS`. Karta `4242 4242 4242 4242` nie nadaje już uprawnień Pro na produkcji.

---

## 3. Jak to działa od kliknięcia do planu

Przepływ transakcji od kliknięcia użytkownika do przyznania dostępu Pro:

1. **Kliknięcie przycisku na `/app/`**:
   Skrypt `assets/app.js` wywołuje funkcję Cloud Function `payTicket`, aby uzyskać podpisany bilet autoryzacyjny: `v1.<uid>.<timestamp>.<podpis_hmac>`.
2. **Przejście do Payment Linka**:
   Przeglądarka otwiera link kasy z parametrami `?client_reference_id=<bilet>&prefilled_email=<email>`. Parametry te identyfikują kupującego, a nie kwotę — kwota i waluta są zdefiniowane po stronie obiektu w Stripe, więc modyfikacja parametrów URL w przeglądarce nie pozwala obniżyć ceny.
3. **Powiązanie klienta (`checkout.session.completed`)**:
   Po zatwierdzeniu płatności webhook weryfikuje podpis biletu kluczem `PAY_TICKET_SECRET` i zapisuje powiązanie klienta w Firestore:
   `stripeCustomers/{customerId}` = `{ uid, email, updatedAt }`. Pole `activeSubscriptionId` dopisuje dopiero zdarzenie subskrypcji, które faktycznie nadało plan — po to, żeby zamknięcie starej subskrypcji nie odebrało Pro opłaconego nową.
4. **Nadanie planu (`customer.subscription.created` / `customer.subscription.updated`)**:
   Webhook sprawdza, czy subskrypcja dotyczy produktu z allowlisty `STRIPE_PRICE_IDS` i trybu `STRIPE_LIVE_MODE`. W dokumencie `users/{uid}` zapisuje:
   - `plan: "premium"`
   - `planValidUntil: <timestamp końca opłaconego okresu>`
   - `planRenews: true` (lub `false` przy anulowaniu)
   - usuwa pole `planSource` (koniec okresu próbnego).
   W kolekcji `stripeSubscriptions/{subscriptionId}` odnotowywany jest stan subskrypcji: `lastEventCreated` i `lastEventIds` to pamięć tego, co już zastosowano, i to ona odrzuca duplikaty oraz zdarzenia spóźnione (znalezisko H2). Pole `expiresAt` dopisywane jest wyłącznie przy zdarzeniu kończącym subskrypcję i służy polityce TTL Firestore, nie kolejności.
5. **Powrót na stronę i problem kolejności zdarzeń (`plan_pending`)**:
   Payment Link przekierowuje użytkownika na `https://liczmat.com/app/`.
   W Stripe zdarzenie `customer.subscription.created` potrafi dotrzeć do webhooka PRZED zdarzeniem `checkout.session.completed` (zmierzone 2026-09-11). W takim wypadku webhook zwraca kod `503 customer not linked yet`, ponieważ powiązanie klienta z kontem jeszcze nie istnieje. Stripe ponawia doręczenie zdarzenia z opóźnieniem.
   Skutkiem dla klienta byłoby wrażenie, że po powrocie ze Stripe konto nadal jest darmowe. Aby temu zapobiec, strona `/app/` przed przejściem do kasy zapisuje w `localStorage` znacznik `liczmat-pay-pending` (wygasa po 30 minutach) i wyświetla komunikat `plan_pending` na tle akcentu („Płatność w toku… Nie płać drugi raz”). Gdy webhook przetworzy ponowione zdarzenie, listener `onSnapshot` w `assets/app.js` natychmiast wykrywa zmianę w bazie, podmienia plakietkę na LICZMAT PRO i gasi komunikat.
6. **Zarządzanie i anulowanie (`customer.subscription.updated` / `customer.subscription.deleted`)**:
   W Customer Portalu klient klika rezygnację z subskrypcji ze skutkiem na koniec okresu rozliczeniowego (`cancel_at_period_end`). Webhook odbiera `customer.subscription.updated` i ustawia `planRenews: false`. Moduły Pro pozostają odblokowane do daty `planValidUntil`. Gdy okres upłynie, zdarzenie `customer.subscription.deleted` ustawia `plan: "free"` i usuwa daty ważności.

---

## 3a. Okres próbny

Każde nowo rejestrowane konto otrzymuje automatycznie 14 dni okresu próbnego LiczMat Pro:

- **Wyzwalacz `grantTrial`**: Funkcja `grantTrial` (`functions/index.js`) nasłuchuje na zdarzenie utworzenia dokumentu profilu `users/{uid}`. Ponieważ dokument ten tworzy zarówno aplikacja przeglądarkowa (`assets/app.js`), jak i aplikacja mobilna Android (`CloudSync.kt`), trial przyznawany jest niezależnie od drogi rejestracji.
- **Pola w profilu**: Nowy profil otrzymuje `plan: "premium"`, `planValidUntil: now + 14 dni`, `planRenews: false` oraz `planSource: "trial"`.
- **Rola pola `planSource`**: Wartość `planSource: "trial"` jest jedynym wyznacznikiem różniącym konto próbne od konta z anulowaną subskrypcją płatną (które ma identyczne wartości pozostałych trzech pól). Interfejs na tej podstawie ukrywa przycisk Customer Portalu, lecz nadal prezentuje cennik i przyciski zakupu.
- **Kasowanie okresu próbnego**: Funkcja `planWrite()` w `functions/stripe-map.mjs` bezwzględnie usuwa pole `planSource`. Opłacenie subskrypcji w trakcie trwania 14 dni natychmiast zamienia konto w pełnoprawną subskrypcję. Podobnie ręczne nadanie uprawnień przez `scripts/pro-admin.mjs grant` usuwa `planSource`.
- **Zapobieganie nadużyciom**: Przyznanie trialu zapisuje ślad w kolekcji `trialGrants/{uid}`. Reguły Firestore uniemożliwiają odczyt i modyfikację tej kolekcji przez przeglądarkę, a dokumenty nie są kasowane przy usunięciu konta. Ten sam identyfikator UID nie może otrzymać trialu po raz drugi.
- **Konta utworzone wcześniej**: W przypadku kont założonych przed wdrożeniem wyzwalacza trial można nadać ręcznie:
```bash
node scripts/pro-admin.mjs trial <e-mail>
```

---

## 4. Jak odtworzyć katalog od zera

Do synchronizacji i tworzenia obiektów w Stripe służy skrypt `scripts/stripe-setup.mjs`:

```bash
STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs --sandbox [--dry-run]
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs --live    [--dry-run]
```

Zasady działania i właściwości skryptu:
- **Czysty Node 22**: Skrypt nie wymaga zewnętrznych pakietów npm, korzystając z natywnego globalnego `fetch`.
- **Strażnik kluczy**: Klucz API przekazywany jest wyłącznie przez zmienną środowiskową `STRIPE_SECRET_KEY`. Flaga `--sandbox` bezwzględnie wymaga prefiksu `sk_test_`, a flaga `--live` prefiksu `sk_live_`. Niezgodność trybu z kluczem kończy działanie błędem.
- **Idempotencja**: Skrypt weryfikuje istniejące zasoby: produkty po metadanych `metadata.lm_plan` (`monthly`, `yearly`), ceny cykliczne po kluczach wyszukiwania `lookup_key` (`liczmat_pro_monthly`, `liczmat_pro_yearly`), a Payment Linki po przypisanym identyfikatorze ceny. Ponowne uruchomienie nie tworzy duplikatów.
- **Jedno źródło prawdy (`assets/pay.js`)**: Skrypt nie powiela kwot na sztywno. Parsuje literał `LM_PAY` bezpośrednio z pliku `assets/pay.js` przez `new Function()`, co uniemożliwia rozjazd cennika na stronie z obiektami w Stripe. Brak kwoty dla którejkolwiek z 7 walut powoduje natychmiastowe przerwanie pracy.
- **Niezmienność cen**: Ceny w Stripe są niezmienne (`immutable`). W przypadku wykrycia różnicy kwoty między `assets/pay.js` a ceną w Stripe skrypt przerywa działanie z kodem 1 i odmawia modyfikacji.
- **Czego skrypt NIE zrobi**: API Stripe nie udostępnia stałego adresu logowania do Customer Portalu (`https://billing.stripe.com/p/login/...`). Adres ten należy skopiować ręcznie z panelu Stripe: **Settings → Billing → Customer portal** (przycisk *Activate link*).

---

## 5. Jak wrócić do piaskownicy i jak wrócić z powrotem na żywe

W razie potrzeby przeprowadzenia testów w piaskownicy lub powrotu do trybu produkcyjnego należy wykonać poniższe kroki.

### Przejście do piaskownicy (Sandbox)

1. W pliku `functions/.env` ustaw konfigurację testową:
```
STRIPE_PRICE_IDS=prod_VEr7pbfaenHirT,prod_VEr7Ojpc8hJO2i
STRIPE_LIVE_MODE=false
```
2. Zaktualizuj klucz podpisu webhooka na wartość testową (z endpointu `we_1UENjfGo3bOSsiBVvzmWdwvk`):
```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```
3. Wdróż Cloud Functions:
```bash
FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
```

### Powrót na produkcję (Live)

1. W pliku `functions/.env` przywróć konfigurację produkcyjną:
```
STRIPE_PRICE_IDS=prod_VEubpxYaA7Ozca,prod_VEubBZAJS5ujo1
STRIPE_LIVE_MODE=true
```
2. Zaktualizuj klucz podpisu webhooka na wartość produkcyjną (z endpointu `we_1UEQmtGmEsit3k9gWt2Qtxwh`):
```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```
3. Wdróż Cloud Functions:
```bash
FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
```
4. Upewnij się, że w `assets/pay.js` wpisane są adresy produkcyjne i uruchom testy weryfikacyjne:
```bash
node scripts/test-pay.mjs
```

---

## 6. Zmiana ceny

Obiekty cenowe (`Price`) w Stripe są niezmienne po utworzeniu: nie można zmienić kwoty podstawowej `unit_amount` ani wpisów w `currency_options`. Wprowadzenie nowej ceny wymaga utworzenia nowego obiektu cenowego.

Procedura modyfikacji cennika:
1. W panelu Stripe zdeaktywuj starą cenę dla modyfikowanego produktu.
2. Wprowadź nowe kwoty w `LM_PAY.plans` w pliku `assets/pay.js`.
3. W skrypcie `scripts/stripe-setup.mjs` zaktualizuj `lookup_key` (np. nadając nowy identyfikator `liczmat_pro_monthly_v2`), aby skrypt nie odrzucił operacji z powodu konfliktu z dotychczasową ceną.
4. Uruchom skrypt w trybie produkcyjnym:
```bash
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs --live
```
5. Skopiuj nowo wygenerowany adres Payment Link i wklej go do `assets/pay.js` w miejsce starego adresu danego planu.
6. Sprawdź poprawność konfiguracji testem automatycznym:
```bash
node scripts/test-pay.mjs
```

---

## 7. Zasada trzech adresów

Obiekt `LM_PAY` w pliku `assets/pay.js` przechowuje dokładnie trzy adresy zewnętrzne:
- `portalUrl` — adres Customer Portalu Stripe,
- `plans[0].link` — Payment Link planu miesięcznego,
- `plans[1].link` — Payment Link planu rocznego.

Zasada ta wynika bezpośrednio z noty ORDER na końcu `assets/pay.js`:
- **Wszystko albo nic**: Niedopuszczalne jest włączenie przycisków zakupu bez aktywnego portalu klienta. Serwis statyczny nie posiada własnego backendu do zarządzania subskrypcją, więc portal Stripe jest jedynym miejscem, gdzie klient może pobrać fakturę lub anulować odnawianie. Udostępnienie kasy bez portalu uniemożliwiłoby samodzielną rezygnację.
- **Spójność oferty**: Niedopuszczalne jest opublikowanie tylko jednego planu lub zmieszanie linków produkcyjnych z testowymi (`/test_/`).

Reguły te kontroluje automatyczny test w `scripts/test-pay.mjs` (§3):
- W stanie zamkniętym wszystkie trzy adresy muszą pozostać puste (`""` lub `null`) — serwis wyświetla ceny, lecz blokuje zakup (`lmPayBuyable` zwraca `false`).
- W stanie otwartym (stan obecny) test weryfikuje, czy wszystkie trzy linki są skonfigurowane, czy używają wyłącznie protokołu HTTPS i dozwolonych hostów (`buy.stripe.com`, `billing.stripe.com`), czy żaden nie jest linkiem testowym oraz czy oba plany są w pełni kupowalne w każdej z 7 walut.

---

## 8. Co zostaje otwarte

Poniższe kwestie pozostają otwarte i wymagają odrębnych decyzji:

- **VAT i Stripe Tax**: Repozytorium i kod frontendowy nie naliczają podatku VAT. Konto Stripe zarejestrowane jest w Niemczech (DE), a ceny podawane są głównie w PLN i 6 innych walutach. Decyzja o włączeniu Stripe Tax oraz określenie, czy kwoty w cenniku traktowane są jako brutto czy netto, leży po stronie właściciela i księgowości.
- **Adaptive Pricing i waluta wybierana po IP**: W Stripe Payment Links funkcja Adaptive Pricing jest włączona na stałe. Stripe wybiera walutę na formularzu kasy na podstawie geolokalizacji IP odwiedzającego, a nie według wybieraka waluty na stronie LiczMat. Użytkownik łączący się z Polski z walutą ustawioną na EUR zobaczy u Stripe kwotę 39,99 PLN (ręcznie zdefiniowaną kwotę w PLN), a nie przeliczoną kwotę w euro. Z kolei dla krajów spoza siódemki walut (np. Węgry) Stripe przeliczy kwotę po swoim kursie z narzutem 2–4%.
- **GBP poza listą sprzedażową**: Funt brytyjski (GBP) znajduje się na liście walut kalkulatora (`LM_CURRENCIES`), lecz nie został dodany do listy sprzedaży (`LM_PAY.currencies`). Użytkownik z wybraną walutą GBP nie widzi cen ani przycisku zakupu. Otwarcie sprzedaży w GBP wymaga ręcznego ustalenia kwot dla obu planów przez właściciela.
- **Brak bramki Pro w Androidzie**: Aplikacja na Androida (`CloudSync.kt`) synchronizuje dane z Firestore, lecz nie posiada zaimplementowanej blokady funkcji Pro (wyceny, kalkulatory, eksport PDF). Użytkownik z darmowym kontem ma na urządzeniu mobilnym dostęp do funkcji zablokowanych w wersji webowej.
- **Brak prawdziwej płatności w trybie żywym**: Cała ścieżka od kliknięcia przez bilet po formatkę kasy została potwierdzona technicznie, jednak dotychczas nikt nie zrealizował pełnej transakcji prawdziwą kartą płatniczą na koncie produkcyjnym.
