# Maile okresu próbnego (MAILE-TRIAL), projekt 2026-10-12

Pomysł kolegi właściciela, zatwierdzony przez właściciela 2026-10-12. Ustalone:
3 maile, wysyłka przez SMTP OVH (`contact@liczmat.com`, już działa dla maila powitalnego),
13 języków, ankieta jako klik w mailu + strona, maile traktowane jako informacje o usłudze
(bez pola zgody przy rejestracji, wypisanie w każdym mailu i przełącznik w koncie),
codzienny przegląd kont (podejście A).

## 1. Maile i terminy

Dzień liczony od `trialGrants/{uid}.grantedAt` (gdy brak: `planValidUntil - 14 dni`).
Wysyłka raz dziennie o 10:00 Europe/Warsaw, w języku `users/{uid}.lang` (`mailLang()`,
domyślnie `pl`; Android nie zapisuje `lang`).

| Krok | Klucz | Kiedy należny | Okno (potem przepada) |
|---|---|---|---|
| Ankieta | `survey` | `grantedAt + 3 dni` | do `grantedAt + 7 dni` |
| Porady | `tips` | `grantedAt + 7 dni` | do `until - 36 h` |
| Przypomnienie | `reminder` | `until - 36 h` | do `until` |

- W jednym przebiegu konto dostaje najwyżej jeden mail: najpóźniejszy należny krok, którego
  okno trwa. Wcześniejsze niewysłane kroki dostają `skipped` (bez nadrabiania).
- `reminder` tylko gdy profil nadal `plan == "premium"` i `planSource == "trial"` (kupił
  w trakcie, to bez przypomnienia). `survey` i `tips` idą także do tych, którzy już kupili.
- Nikt z `mailPrefs/{uid}.optOut == true`. Nikt bez adresu e-mail. Nikt z kontem
  wyłączonym w Auth.
- Konta w połowie okresu w dniu wdrożenia dostają tylko kroki, których okno trwa.

Treść PL (źródło dla tłumaczeń; bez „—” i „–”, bez wykrzykników reklamowych):

**survey**: temat „Jak Ci się pracuje z LiczMat?”. „Cześć{, imię}. Od kilku dni masz konto
w LiczMat. Jedno kliknięcie bardzo nam pomoże: jak oceniasz LiczMat w skali od 1 do 5?”
Pięć przycisków 1..5 (link do strony ankiety z oceną). Pod spodem: „Po kliknięciu możesz
jeszcze dopisać, czego Ci brakuje. To zajmie pół minuty.”

**tips**: temat „Trzy rzeczy, które warto sprawdzić w okresie próbnym”. „Cześć{, imię}.
Do {data końca} masz w LiczMat wszystkie funkcje Pro. Oto trzy, od których warto zacząć:”
1. „Wycena dla klienta: z pozycji projektu robisz wycenę, wysyłasz klientowi link albo PDF.” → /wyceny/
2. „Klienci i terminarz: zapisujesz klientów i terminy, a terminarz możesz podpiąć do
   kalendarza w telefonie.” → /klienci/, /terminarz/
3. „Własne materiały z cenami: wpisujesz ceny ze swojej hurtowni i wyceny liczą się same.” → /moje-materialy/
„Masz pytanie? Odpowiedz na ten e-mail.”

**reminder**: temat „Twój okres próbny LiczMat Pro kończy się {data}”. „Cześć{, imię}.
{data} kończy się Twój okres próbny LiczMat Pro. Po tym dniu: za darmo zostają kalkulatory,
projekty i synchronizacja między stroną a aplikacją. Wyłączą się wyceny, ceny, PDF i klienci.
Twoje dane nie znikają, wrócą razem z Pro.” Przycisk „Zobacz LiczMat Pro” → /liczmat-pro/.

Data w formacie dnia i miesiąca słownie, w języku maila, strefa Europe/Warsaw
(`Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "Europe/Warsaw" })`).

Każdy mail: wspólny `renderMail()` + w stopce „Nie chcesz takich maili? Wypisz się.”
(link do strony wypisania) + nagłówki `List-Unsubscribe` (URL funkcji + `mailto:`)
i `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.

## 2. Ankieta i wypisanie

**Token.** `lifecycleMails/{uid}.token`: 32 znaki hex z `crypto.randomBytes(16)`, nadany
przy pierwszym mailu, stały. Linki niosą `u` (uid) i `t` (token). Weryfikacja: dokument
istnieje i `token` równy (porównanie stałoczasowe). Brak sekretu do ustawiania.

**Strona `/maile/`** (13 języków, ścieżki jak reszta stron, `noindex`, poza sitemapą).
Tryby z parametru `a`:
- `a=rate&r=1..5`: pokazuje wybraną ocenę (można zmienić), od razu po wczytaniu wysyła
  ocenę (POST), potem dwa pytania do pominięcia: „Do czego używasz LiczMat?” (własny
  remont / firma / inne) i „Czego Ci brakuje?” (tekst do 1000 znaków), przycisk „Wyślij”.
  Po wysłaniu podziękowanie.
- `a=unsub`: zdanie i przycisk „Wypisz mnie”. Dopiero kliknięcie wypisuje (skanery poczty
  otwierają linki GET, więc GET niczego nie zmienia). Po kliknięciu potwierdzenie.
- Zły albo brakujący token: neutralny komunikat „Link jest nieaktualny”.

**Funkcja `mailLink`** (`onRequest`, europe-central2, POST JSON, CORS tylko liczmat.com):
`{a: "rate", u, t, r}` → `surveys/{uid}` merge `{rating, ratedAt, lang}`;
`{a: "answer", u, t, use, missing}` → merge `{use, missing, answeredAt}`;
`{a: "unsub", u, t}` → `mailPrefs/{uid}` `{optOut: true, updatedAt, source: "link"}`.
POST z `List-Unsubscribe=One-Click` (z nagłówka maila) też wypisuje.
Odpowiedzi: 200 `{ok:true}`, 400 złe dane, 404 zły token (bez rozróżniania przyczyny).

**Przełącznik w koncie** (`/app/`, ustawienia): „Maile z poradami i przypomnieniami”,
domyślnie włączony. Callable `mailPrefs` `{action: "get"|"set", optOut}` czyta/zapisuje
`mailPrefs/{uid}` (`source: "account"`). Bez zmiany reguł Firestore: kolekcje
`lifecycleMails`, `surveys`, `mailPrefs` nie mają dopasowania w regułach, więc przeglądarka
ich nie czyta i nie pisze; tylko funkcje.

**Panel admina**: sekcja „Maile i ankiety”:
- przycisk „Wyślij mi podgląd” + wybór języka: callable `adminMail {action: "preview", lang}`
  wysyła wszystkie trzy maile na adres zalogowanego admina (temat z prefiksem „[podgląd]”),
  z prawdziwym tokenem admina, więc linki działają;
- lista odpowiedzi: `adminMail {action: "surveys"}` zwraca ostatnie 200 `surveys`
  (e-mail, ocena, użycie, brakuje, data), sortowane od najnowszych;
- licznik: ile maili każdego kroku wysłano.

## 3. Technika

- `functions/lifecycle-map.mjs` (czysty, bez Firebase): `LIFECYCLE_STEPS`,
  `lifecycleDecision({grant, profile, prefs, state, email, disabled, now})` →
  `{send: step, skip: [kroki]}` albo `{send: null, reason}`; `lifecycleMessage(step,
  {lang, displayName, until, uid, token})` → `{subject, text, html, headers}` na
  `renderMail()`; teksty 13 języków.
- `functions/index.js`: `lifecycleMails` (`onSchedule`, `"0 10 * * *"`, `timeZone:
  "Europe/Warsaw"`, sekret `SMTP_PASSWORD`), `mailLink`, `mailPrefs`, `adminMail`.
- Kandydaci: `trialGrants` z `grantedAt >= now - 16 dni` (jedno pole, indeks automatyczny).
- Zajęcie kroku w transakcji na `lifecycleMails/{uid}` (`steps.<krok> = {status:
  "sending", at}`) PRZED wysyłką, potem `sent`/`failed`. Bez ponawiania: drugi mail jest
  gorszy niż brak (jak `welcomeMail`).
- Przełącznik `LIFECYCLE_LIVE` (`defineString`, domyślnie `"false"`): przy `false`
  przebieg tylko loguje, co by wysłał. Właściciel ogląda podgląd, potem `true`.
- `sendMail()` przyjmuje dodatkowe `headers`.

## Testy

- `scripts/test-lifecycle-map.mjs`: dni graniczne każdego kroku, brak nadrabiania, zakup
  w trakcie, wypisany, brak e-maila, wyłączone konto, brak `trialGrants` (z `until`),
  13 języków z kompletem kluczy, brak „—”/„–” w tekstach, linki per język istnieją,
  nagłówki wypisania, escapowanie imienia, data w strefie Warsaw.
- Test strony `/maile/` (wzorem `*-page.mjs`, z `LM_PLAYWRIGHT`): tryb rate wysyła POST
  z oceną, unsub nie wysyła niczego bez kliknięcia, zły token pokazuje komunikat.
- Na żywo: podgląd z panelu admina na adres właściciela; jeden przebieg `LIFECYCLE_LIVE=false`
  w logach.
