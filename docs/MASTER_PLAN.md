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
| 30–36 | patrz rozdział XXXII planu | Nie zaczęte |

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

- **Certyfikat.** W chwili commitu `https://liczmat.com` serwuje jeszcze `CN=*.github.io`.
  GitHub → Settings → Pages → **Remove**, zapisać, wpisać `liczmat.com` ponownie, **Save**.
  To wymusza ponowną próbę wystawienia.
- **Google Cloud → Credentials → klucz przeglądarkowy → Website restrictions**: dopisać
  `https://liczmat.com/*` i `https://www.liczmat.com/*`, zachowując wpisy
  `materio-502513.firebaseapp.com/*` i `materio-502513.web.app/*`.
  **To jest blokada, która wywraca zakładanie konta i logowanie** — zmierzone na żywym
  backendzie, to samo wywołanie `accounts:signInWithPassword` z trzema nagłówkami
  `Referer`:

  | Referer | Odpowiedź |
  |---|---|
  | `https://liczmat.com/app/` | 403 `API_KEY_HTTP_REFERRER_BLOCKED` |
  | `https://www.liczmat.com/app/` | 403 `API_KEY_HTTP_REFERRER_BLOCKED` |
  | `https://materio-app.com/app/` | 400 `INVALID_LOGIN_CREDENTIALS` — klucz przepuścił, Auth doszedł do sprawdzenia hasła |

  Ograniczenie klucza obejmuje **każde** wywołanie Identity Toolkit, więc rejestracja,
  logowanie e-mailem i reset hasła padają razem. Wyłączenie logowania Google (2026-08-14)
  niczego tu nie zmieniło — blokada siedzi poniżej dostawcy.
- **Firebase Auth → Authorized domains**: dopisać `liczmat.com` i `www.liczmat.com`.
  Osobna kontrola, **nie** ta, która zwraca 403 wyżej: odpowiada za popup OAuth i za
  `continueUrl` w linku z maila akcyjnego, czyli za reset hasła. Listy nie dało się
  odczytać zdalnie — `getProjectConfig` idzie przez ten sam ograniczony klucz.
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

**Następne zadanie: Sesja 30 — SEO TECHNICZNE.**

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

### Ten sam błąd zaokrąglenia w aplikacji Android — znalezione w Sesji 12

Silniki w `assets/calculators.js` są przeniesione 1:1 z `core/calculation/**`, a błąd
opisany wyżej siedzi w samym dzieleniu, nie w porcie: `ceil(21.6 / 1.44)` daje 16 zamiast
15 w każdym języku z binarnym floatem, więc **aplikacja liczy dziś to samo błędnie**.
Serwis został naprawiony, telefon nie. Zrównanie wymaga zmiany w repo
`3d-polednia/Materio` (odpowiednik `snap()` przy każdym `ceil`/`floor` w silnikach)
i osobnego wydania. **Poza zakresem prac nad webem** (rozdział VII) — **potrzebna decyzja
właściciela**, czy zlecić to jako etap w tamtym repo.

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
