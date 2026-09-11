# Płatności LiczMat — runbook operacyjny

## 1. Po co ten plik i czego w nim nie ma

Ten dokument służy do obsługi incydentów i bieżących problemów z płatnościami w serwisie LiczMat („coś się dzieje z płatnością, co mam zrobić”).

Dokument NIE zawiera:
- instrukcji pierwszego wdrożenia i konfiguracji konta Stripe — ta znajduje się w [docs/STRIPE.md](STRIPE.md);
- instrukcji obsługi panelu administratora w przeglądarce — ta znajduje się w [docs/ADMIN.md](ADMIN.md);
- opisu architektury systemu.

## 2. Mapa: co gdzie stoi

Projekt Firebase `materio-502513`, plan Blaze, region `europe-central2`, Node 22, funkcje 2. generacji.

| Element | Identyfikator / Adres | Rola |
|---|---|---|
| Funkcja `stripeWebhook` | `https://europe-central2-materio-502513.cloudfunctions.net/stripeWebhook` | Jedyna funkcja nadająca plan po zapłacie w Stripe |
| Funkcja `payTicket` | Callable `payTicket` w `europe-central2` | Podpisany bilet z uid do kasy Stripe |
| Funkcja `adminPlan` | Callable `adminPlan` w `europe-central2` | Obsługa panelu administratora na `/app/` |
| Funkcja `grantTrial` | Wyzwalacz Firestore `users/{uid}` | 14 dni Pro dla nowego konta |
| Produkt miesięczny | `prod_VEubpxYaA7Ozca` / `price_1UEQlvGmEsit3k9gj3U9zPjB` | 39,99 PLN (+ 6 walut w currency_options) |
| Produkt roczny | `prod_VEubBZAJS5ujo1` / `price_1UEQlxGmEsit3k9gNP8ewwtS` | 399,99 PLN (+ 6 walut w currency_options) |
| Payment Link miesięczny | `https://buy.stripe.com/28E3cvfyY4QB9ZD4mI0oM00` | Kasa Stripe dla planu miesięcznego |
| Payment Link roczny | `https://buy.stripe.com/3cI3cvcmMcj33Bf3iE0oM01` | Kasa Stripe dla planu rocznego |
| Portal klienta | `https://billing.stripe.com/p/login/28E3cvfyY4QB9ZD4mI0oM00` | Konfiguracja `bpc_1UEQnbGmEsit3k9g7vdQCT1z`, anulowanie subskrypcji |
| Webhook Stripe | `we_1UEQmtGmEsit3k9gWt2Qtxwh` | Endpoint na koncie Stripe `acct_1UDk8RGmEsit3k9g` |

## 3. SCENARIUSZE

### Klient zapłacił, a konto nadal darmowe
- **Objaw:** Klient zrealizował płatność w Stripe, lecz jego konto w serwisie nadal ma status darmowy (`free`).
- **Jak sprawdzić:**
  Sprawdź stan konta w bazie:
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs status <e-mail>
  ```
  Sprawdź ostatnie wpisy w logach webhooka:
  ```bash
  firebase functions:log --only stripeWebhook -n 20
  ```
  Jeśli w logach widnieje `customer not linked yet` (status 503), zdarzenie subskrypcji wyprzedziło sesję checkout. Jeśli widnieje `zapłata bez konta, do nadania ręcznie`, podany adres e-mail lub bilet nie pasują do żadnego konta Auth.
- **Co zrobić:**
  W przypadku 503 Stripe ponawia próby automatycznie przez kilka dni. Jeśli klient oczekuje natychmiastowego dostępu lub zdarzenie zostało oznaczone jako `unattributed`, nadaj plan ręcznie:
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs grant <e-mail> 1
  ```
  (podaj 1 dla subskrypcji miesięcznej lub 12 dla rocznej). Gdy spóźnione zdarzenie Stripe dotrze, powiąże subskrypcję i ustawi właściwy termin.

### Klient mówi, że zapłacił dwa razy
- **Objaw:** Klient zgłasza podwójne obciążenie rachunku lub utworzenie dwóch subskrypcji.
- **Jak sprawdzić:**
  W panelu Stripe odszukaj klienta po adresie e-mail i sprawdź listę płatności oraz aktywne subskrypcje. Sprawdź status konta w serwisie:
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs status <e-mail>
  ```
- **Co zrobić:**
  W panelu Stripe anuluj zbędną subskrypcję i wykonaj zwrot środków (Refund) za nadmiarową płatność. Kod webhooka pilnuje pola `activeSubscriptionId` — zamknięcie anulowanej subskrypcji nie odbierze Pro, jeśli druga subskrypcja pozostaje aktywna z późniejszą datą ważności.

### Klient chce zwrot pieniędzy
- **Objaw:** Użytkownik domaga się zwrotu środków i rezygnacji z dostępu Pro.
- **Jak sprawdzić:**
  Odszukaj transakcję w panelu Stripe (Payments).
- **Co zrobić:**
  W panelu Stripe kliknij Refund (zwrot środków), a następnie anuluj subskrypcję klienta ze skutkiem natychmiastowym. Zdarzenie `customer.subscription.deleted` zdejmie Pro automatycznie. W razie potrzeby natychmiastowego odebrania uprawnień z terminala:
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs revoke <e-mail>
  ```

### Klient chce anulować subskrypcję
- **Objaw:** Użytkownik prosi o zatrzymanie odnawiania subskrypcji.
- **Jak sprawdzić:**
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs status <e-mail>
  ```
- **Co zrobić:**
  Przekaż klientowi link do portalu klienta: `https://billing.stripe.com/p/login/28E3cvfyY4QB9ZD4mI0oM00` (dostępny również z poziomu zakładki Konto na `/app/`). Klient samodzielnie klika rezygnację. Stripe ustawi `cancel_at_period_end: true`, webhook ustawi `planRenews: false`, a konto zachowa dostęp Pro do końca opłaconego okresu (`planValidUntil`).

### Konto pokazuje Pro, choć nikt nie płacił (okres próbny)
- **Objaw:** Konto posiada plan Pro mimo braku zarejestrowanej wpłaty w Stripe.
- **Jak sprawdzić:**
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs status <e-mail>
  ```
  Sprawdź dokument `users/{uid}` w Firestore. Jeśli pole `planSource` ma wartość `"trial"`, a `planRenews` to `false`, konto korzysta z 14-dniowego okresu próbnego. W płatnościach Stripe oraz przy ręcznym poleceniu `grant` pole `planSource` jest kasowane.
- **Co zrobić:**
  Nie podejmuj działań. Plan wygaśnie samoczynnie po upływie 14 dni od momentu założenia profilu.

### Okres próbny się nie nadał nowemu kontu
- **Objaw:** Nowe konto zaraz po rejestracji ma status darmowy (`free`).
- **Jak sprawdzić:**
  Sprawdź logi wyzwalacza:
  ```bash
  firebase functions:log --only grantTrial -n 20
  ```
  Sprawdź w Firestore, czy istnieje dokument `trialGrants/{uid}`. Jeśli dokument istnieje, ten identyfikator konta wykorzystał już okres próbny w przeszłości (np. konto usunięto i założono ponownie).
- **Co zrobić:**
  Jeśli brak okresu próbnego wynika z opóźnienia zdarzenia lub konto powstało przed uruchomieniem automatycznego trialu, nadaj go poleceniem:
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs trial <e-mail>
  ```

### Ktoś prosi o przedłużenie Pro poza Stripe'em (grant ręczny)
- **Objaw:** Konieczność przyznania dostępu Pro bez pośrednictwa Stripe (np. przelew tradycyjny, rozliczenie partnerskie).
- **Jak sprawdzić:**
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs status <e-mail>
  ```
- **Co zrobić:**
  Użyj panelu administratora na `/app/` lub wykonaj polecenie w terminalu:
  ```bash
  LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs grant <e-mail> <liczba_miesięcy>
  ```
  (domyślnie 12 miesięcy, dopuszczalny zakres od 1 do 120). Plan nadany ręcznie ustawia `planRenews: false` i nie odnawia się sam.

### Webhook odpowiada 400 na wszystko
- **Objaw:** W Stripe Dashboard (Developers → Webhooks) wszystkie próby doręczenia zdarzeń kończą się błędem `400 bad signature`.
- **Jak sprawdzić:**
  ```bash
  firebase functions:log --only stripeWebhook -n 20
  ```
  W logu widnieje komunikat `stripe: odrzucony podpis` (przyczyna: `mismatch`, `stale`, `bad-header` lub `no-secret`).
- **Co zrobić:**
  Zaktualizuj poprawny Signing secret webhooka z panelu Stripe:
  ```bash
  firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
  FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
  ```
  Nowa wersja sekretu z Secret Managera zaczyna działać dopiero po wdrożeniu funkcji.

### Webhook odpowiada 503 na wszystko
- **Objaw:** Zdarzenia subskrypcji w Stripe kończą się błędem `503 customer not linked yet`.
- **Jak sprawdzić:**
  ```bash
  firebase functions:log --only stripeWebhook -n 20
  ```
  Komunikat: `stripe: nie znam jeszcze tego klienta, proszę o ponowienie`.
- **Co zrobić:**
  Pojedyncza odpowiedź 503 jest normalna, gdy zdarzenie subskrypcji wyprzedzi sesję kasy. Jeśli błąd pojawia się przy każdej płatności, sprawdź w Stripe Dashboard (Developers → Webhooks), czy na liście zdarzeń endpointu znajduje się `checkout.session.completed`. Bez tego zdarzenia webhook nie powiąże klienta Stripe z kontem w serwisie.

### Trzeba zmienić cenę
- **Objaw:** Zmiana cen planów subskrypcyjnych.
- **Jak sprawdzić:**
  Ceny w Stripe są niezmienne — edycja istniejącej kwoty w obiekcie ceny jest niemożliwa.
- **Co zrobić:**
  1. Zaktualizuj kwoty w tablicy `LM_PAY.plans` w `assets/pay.js`.
  2. **Uwaga: samo ponowne uruchomienie skryptu tego nie załatwi.** `ensurePrice()` znajduje
     istniejącą cenę po `lookup_key`, widzi inną kwotę niż w `pay.js`, wypisuje ostrzeżenie
     i kończy się kodem 1 — celowo, bo edycja kwoty w Stripe jest niemożliwa, a ciche
     utworzenie drugiej ceny rozjechałoby cennik z subskrypcjami, które już trwają.
     Najpierw zdezaktywuj starą cenę w panelu Stripe albo zmień `lookup_key` w skrypcie,
     dopiero potem:
     ```bash
     STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs --live --dry-run
     STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs --live
     ```
     Osoby, które już płacą, zostają na starej cenie do końca okresu — zmiana dotyczy
     wyłącznie nowych subskrypcji.
  3. Zaktualizuj identyfikatory w `functions/.env` (`STRIPE_PRICE_IDS`) oraz linki w `assets/pay.js`.
  4. Zweryfikuj testy i wdróż zmiany:
     ```bash
     node scripts/test-pay.mjs
     FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
     node scripts/build.mjs
     ```

### Trzeba wrócić do piaskownicy, żeby coś przetestować
- **Objaw:** Konieczność wykonania testowych transakcji kartą `4242` bez obciążania prawdziwych kart.
- **Jak sprawdzić:**
  W trybie produkcyjnym webhook odrzuca zdarzenia testowe (komunikat `zdarzenie spoza sprzedaży LiczMat Pro`, powód `livemode`).
- **Co zrobić:**
  1. W pliku `functions/.env` wpisz identyfikatory piaskownicy i wyłącz tryb żywy:
     ```
     STRIPE_PRICE_IDS=prod_VEr7pbfaenHirT,prod_VEr7Ojpc8hJO2i
     STRIPE_LIVE_MODE=false
     ```
  2. Wprowadź sekret testowy (`whsec_...` z endpointu piaskownicy `we_1UENjfGo3bOSsiBVvzmWdwvk`):
     ```bash
     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
     FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
     ```
  3. Wykonaj testy przez testowy Payment Link `https://buy.stripe.com/test_3cI8wP1Ip7mG5zFemsgrS00`.
  4. Po testach przywróć konfigurację produkcyjną (`STRIPE_LIVE_MODE=true`, produkcyjne `STRIPE_PRICE_IDS` i wersję produkcyjną sekretu) oraz wdróż funkcje ponownie.

## 4. Jak czytać logi webhooka

Komunikaty zapisywane w Cloud Logging przez funkcję `stripeWebhook` (`functions/index.js`):

- `stripe: odrzucony podpis` (warn) — nagłówek podpisu nie pasuje do treści żądania lub sekretu (odpowiedź 400 bad signature).
- `stripe: zdarzenie spoza sprzedaży LiczMat Pro` (warn) — zdarzenie dotyczy produktu spoza listy `STRIPE_PRICE_IDS` (powód `offer`) lub innego trybu `livemode` (odpowiedź 200 ignored).
- `stripe: zapłata bez konta, do nadania ręcznie` (error) — płatność poprawna, lecz nie znaleziono konta Firebase Auth dla biletu ani adresu e-mail (odpowiedź 200 unattributed). Wymaga ręcznego nadania planu.
- `stripe: klient powiązany z kontem` (info) — zdarzenie `checkout.session.completed` zapisało powiązanie klienta z kontem w `stripeCustomers/{customerId}` (odpowiedź 200 linked).
- `stripe: nie znam jeszcze tego klienta, proszę o ponowienie` (warn) — subskrypcja przyszła przed sesją checkout; funkcja zwraca kod 503 z prośbą o ponowienie.
- `stripe: zdarzenie pominięte` (info) — zdarzenie zignorowane bez modyfikacji bazy: duplikat (`duplicate`), spóźnione zdarzenie (`stale`), zakończona subskrypcja (`terminated`) lub inna aktywna subskrypcja (`superseded`).
- `stripe: plan zapisany` (info) — udana aktualizacja dokumentu `users/{uid}` oraz stanu w `stripeSubscriptions` (odpowiedź 200 ok).
- `stripe: zapis nie przeszedł` (error) — błąd transakcji Firestore; funkcja zwraca kod 500, powodując ponowienie przez Stripe.
- `stripe: client_reference_id bez ważnego biletu, idziemy adresem` (warn) — brak poprawnego podpisu biletu lub przekazano goły uid; funkcja przełącza się na powiązanie po adresie e-mail.
- `stripe: bilet wskazuje na konto, którego już nie ma` (warn) — podpis biletu jest prawidłowy, lecz konto zostało skasowane z Firebase Auth.
- `stripe: adres z sesji nie ma konta` (warn) — adres e-mail z sesji Stripe nie istnieje w bazie Firebase Auth.

## 5. Kody odpowiedzi webhooka i co oznaczają dla Stripe'a

- `200` (`ok`, `linked`, `ignored`, `unattributed`, `duplicate`, `stale`, `terminated`, `superseded`, `unknown-offer`):
  Żądanie przetworzone pomyślnie lub bezpiecznie pominięte. Stripe uznaje zdarzenie za doręczone i **nie ponawia** wysyłki.
- `400` (`bad signature`, `bad json`):
  Niepoprawny podpis lub błędna struktura JSON. Stripe traktuje to jak każdą odpowiedź spoza
  zakresu 2xx i **ponawia** doręczenie z rosnącą przerwą, więc błędny sekret zobaczysz w panelu
  jako rosnącą kolejkę nieudanych prób, a nie jako pojedynczy błąd.
- `405` (`POST only`):
  Wysłano metodę inną niż POST (np. żądanie GET z przeglądarki).
- `500` (`write failed`):
  Błąd wewnętrzny transakcji w bazie danych. Stripe **ponawia** próbę zgodnie z mechanizmem backoff.
- `503` (`customer not linked yet`):
  Oczekiwany stan wyścigu zdarzeń — subskrypcja dotarła przed sesją kasy. Stripe **ponawia** wysyłkę przez kilka dni, aż sesja zostanie zarejestrowana.

## 6. Czego NIE wolno robić

- **Nie wklejać linków piaskownicy (`test_...`) do `assets/pay.js`.** Spowoduje to pobranie 0 zł od klientów i odrzucenie zdarzeń przez produkcyjny webhook.
- **Nie edytować cen bezpośrednio w panelu Stripe.** Obiekty cen są niezmienne. Zmiana kwoty wymaga utworzenia nowej ceny z nowym identyfikatorem lookup.
- **Nie wpisywać adresów do `assets/pay.js` pojedynczo.** Skrypt `scripts/test-pay.mjs` wymaga kompletu trzech adresów produkcyjnych (portal i dwa linki płatności) albo pustych wartości.
- **Nie modyfikować pól planu w Firestore z poziomu przeglądarki.** Pola `plan`, `planValidUntil`, `planRenews` i `planSource` są chronione regułami bezpieczeństwa i modyfikowalne wyłącznie przez backend oraz narzędzia administracyjne.
- **Nie edytować dokumentów `users/{uid}` w Firestore bez maski aktualizacji.** Bezpośrednie nadpisanie dokumentu niszczy pola `createdAt` i `lastSeenAt`.
- **Nie umieszczać kluczy kont serwisowych, sekretów ani pliku `functions/.env` w repozytorium git.**
- **Nie wdrażać funkcji poleceniem `firebase deploy` bez parametru `--only functions`.** Brak ograniczenia może doprowadzić do niezamierzonego nadpisania zasobów hostingu.

## 7. Pułapki narzędziowe

1. `firebase deploy` przewraca się na Windowsie z komunikatem `Cannot determine backend specification. Timeout after 10000` — to limit czasu analizy kodu przez narzędzie CLI, a nie błąd w kodzie. Rozwiązanie: `FUNCTIONS_DISCOVERY_TIMEOUT=120`.
2. Pierwsze wdrożenie wymaga wykonania `npm install` w katalogu `functions/` — katalog nie ma commitowanego `node_modules`, a bez instalacji CLI zgłasza błąd `Couldn't find firebase-functions package`.
3. Pierwsze wdrożenie wyzwalacza Firestore potrafi zakończyć się błędem `Permission denied while using the Eventarc Service Agent` — uprawnienia konta usługowego w Google Cloud wymagają czasu na propagację; należy powtórzyć wdrożenie po kilku minutach.
4. Klucz Web API posiada allowlistę domen bez `localhost`, co uniemożliwia przetestowanie zalogowanej sesji lokalnie (`API_KEY_HTTP_REFERRER_BLOCKED`). Próby z logowaniem należy wykonywać na wdrożonej stronie.
5. Checkoutu Stripe nie da się zautomatyzować narzędziami typu headless — zabezpieczenie hCaptcha oraz ramki pól karty płatniczej nie renderują się w tym trybie.
6. Adresu logowania do portalu klienta nie tworzy interfejs API — należy go aktywować i skopiować ręcznie w panelu Stripe: Settings → Billing → Customer portal (przycisk „Activate link”).
7. Kwoty w Stripe są niezmienne. Zmiana ceny zawsze oznacza utworzenie nowej ceny z nowym `lookup_key`, a nie edycję istniejącej.
