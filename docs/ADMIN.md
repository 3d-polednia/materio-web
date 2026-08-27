# Panel administratora — LiczMat Pro klikaniem

Sesja 49 planu naprawczego. Do tej pory plan Pro nadawało się **wyłącznie z terminala**
(`scripts/pro-admin.mjs`, sesja 37): trzeba było mieć przy sobie klucz konta serwisowego i
komputer z Node'em. Teraz to samo robi się w przeglądarce, na `/app/`, w zakładce **Admin** —
z telefonu też.

Ten dokument jest dla właściciela i opisuje **klikanie**, nie kod. Kod jest w trzech
plikach: `functions/admin-map.mjs` (decyzja), `functions/index.js` (wykonanie),
`assets/admin.js` (panel). Sprawdzają je `node scripts/test-admin-map.mjs` i
`node scripts/test-admin-page.mjs`.

---

## Co trzeba zrobić raz, żeby panel w ogóle się pojawił

Trzy kroki, w tej kolejności. Pierwszy i drugi są jednorazowe.

### 1. Wdrożyć funkcje

```bash
cd <katalog repo materio-web>
firebase deploy --only functions
```

Wdraża **obie** funkcje z `functions/`: webhook Stripe'a (sesja 38) i `adminPlan`.
Wymaga planu **Blaze** na projekcie `materio-502513` — Cloud Functions v2 nie działają na
planie darmowym. Jeśli webhook był już wdrażany przy włączaniu sprzedaży
(`docs/STRIPE.md`, krok 4), ten krok jest tylko powtórzeniem tego samego polecenia; nowa
funkcja dojedzie razem z nim.

Po wdrożeniu Firebase wypisze adresy obu funkcji. Panel **nie potrzebuje żadnego z nich** —
adres składa sobie sam z identyfikatora projektu i regionu (`europe-central2`).

### 2. Nadać sobie uprawnienie

```bash
LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs admin polednia@gmail.com
```

To jedyna rzecz, która musi zostać w terminalu, i robi się ją raz na osobę. Powód: panel
otwiera się na **uprawnienie przy koncie** (`admin: true` w tokenie Firebase Auth), a takie
uprawnienie może zapisać tylko coś, co ma prawa administratora — czyli klucz konta
serwisowego albo inna funkcja w chmurze. Gdyby panel mógł nadać uprawnienie sam sobie, nie
byłby zamknięty.

Odebranie: `node scripts/pro-admin.mjs unadmin <adres>`.
Kto je ma, widać w `node scripts/pro-admin.mjs list` (kolumna `[admin]`) i w `status`.

### 3. Wejść na `/app/` i przeładować stronę

Token logowania żyje do godziny, a uprawnienie jedzie **w tokenie**. Strona prosi o świeży
token przy każdym wejściu, więc wystarczy przeładować `/app/`. Zakładka **Admin** stoi jako
szósta, za „Konto".

Jeśli się nie pojawia: wyloguj się i zaloguj ponownie. Jeśli dalej nie — patrz „Co robić,
gdy" na dole.

---

## Co panel robi

Jedno pole na adres e-mail, jedno na liczbę miesięcy i trzy przyciski.

| Przycisk | Co robi |
|---|---|
| **Sprawdź plan** | Mówi, na jakim planie stoi to konto i do kiedy. Niczego nie zmienia |
| **Nadaj Pro** | Zapisuje `plan: premium` i datę końca — dziś plus tyle miesięcy, ile jest w polu (domyślnie 12, najwięcej 120) |
| **Cofnij Pro** | Wraca na plan darmowy. Pyta o potwierdzenie, bo odbiera dostęp, za który ktoś mógł zapłacić |
| **Wypisz konta** | Lista wszystkich kont w projekcie: adres, plan i to, kto ma ten panel |

**Plan nadany ręcznie nigdy się nie odnawia.** `planRenews` jest zapisywane jako `false`,
bo nic tego planu nie odnowi, gdy minie data — nie ma za nim subskrypcji. Konto samo wróci
wtedy do LiczMat, a strona powie, dlaczego („plan wygasł"), zamiast wyglądać na
zdegradowane bez powodu.

**Panel zapisuje dokładnie trzy pola**: `plan`, `planValidUntil`, `planRenews` — te same
trzy, co narzędzie z terminala i co webhook Stripe'a. Data założenia konta (`createdAt`) i
ostatnia obecność (`lastSeenAt`) zostają nietknięte.

## Czego panel nie robi

- **Nie zakłada kont.** Adresu, którego nie ma w projekcie, nie da się „przygotować na
  zapas" — panel odpowie „Nie ma konta o tym adresie".
- **Nie zmienia adresu ani hasła.** To robi właściciel konta u siebie, na `/app/`.
- **Nie kasuje kont.** Usunięcie konta jest po stronie właściciela konta (RODO) albo w
  konsoli Firebase.
- **Nie bierze pieniędzy.** Sprzedaż to Stripe i `docs/STRIPE.md`; nadanie ręczne jest
  osobną drogą i nie ma z nią wspólnego kodu poza zapisem tych samych trzech pól.
- **Nie prowadzi dziennika w bazie.** Ślad każdego zapisu — kto, komu, kiedy — jest w
  **Cloud Logging** (Firebase → Functions → Logi, wpisy `admin: plan zmieniony`). Osobna
  kolekcja „audyt" byłaby drugim domem dla faktu, który już stoi w dokumencie profilu.

## Czego panel nie broni

Pokazanie zakładki to wygoda, nie zamek. Kto podmieni sobie wartość w przeglądarce, zobaczy
formularz i dostanie z niego odmowę na każde kliknięcie: **jedyne sprawdzenie, które
cokolwiek znaczy, jest w funkcji**, po stronie Google, na podpisanym tokenie. To ta sama
zasada, co przy paywallu — przeglądarka decyduje, co **pokazać**.

Sam plik `assets/admin.js` pobiera tylko przeglądarka konta z uprawnieniem. Nikt inny go nie
ściąga i `/app/` nie wozi go w swoim kodzie: panel jest narzędziem dla jednej osoby i nie ma
prawa kosztować 375 stron ani jednego bajtu.

**Panel jest po polsku i tylko po polsku.** To jest druga połowa tej samej decyzji: gdyby
jego dwadzieścia etykiet trafiło do słownika, każda strona serwisu ściągałaby je w dziesięciu
językach, żeby nikt ich nigdy nie przeczytał. `scripts/pro-admin.mjs` pisze po polsku z tego
samego powodu.

---

## Co robić, gdy

**Zakładka „Admin" się nie pojawia.** Uprawnienie jedzie w tokenie, a token żyje do godziny.
Przeładuj `/app/`; jeśli to nie pomoże, wyloguj się i zaloguj. Sprawdź, czy uprawnienie w
ogóle zostało zapisane: `node scripts/pro-admin.mjs status <adres>` — ostatnia linijka mówi
`panel tak` albo `panel nie`.

**„Funkcja nie odpowiedziała. Sprawdź, czy jest wdrożona".** Funkcji nie ma w chmurze albo
stoi w innym regionie. Wdrożenie: krok 1 wyżej. Region jest wpisany w dwóch miejscach —
`REGION` w `functions/index.js` i `REGION` w `assets/admin.js` — i musi się zgadzać;
`scripts/test-admin-map.mjs` §7 pilnuje, żeby te dwa napisy były te same.

**„To konto nie ma uprawnień administratora" mimo nadania.** Token jest stary (patrz wyżej)
albo `unadmin` przeszedł później niż `admin`.

**Panel przestał działać po zmianie domeny.** Funkcja przyjmuje wywołania tylko z
`liczmat.com`, `www.liczmat.com` i `localhost` — lista `cors` przy `adminPlan` w
`functions/index.js`. Nowa domena to edycja tej listy i ponowne wdrożenie.

**Wszystko leży: Firebase, funkcja, sieć.** Zostaje `scripts/pro-admin.mjs` z kluczem.
Narzędzie, któremu wystarczy klucz, jest tym, czym się ratuje, gdy reszta nie odpowiada — i
dlatego nie zostało skasowane razem z tą sesją.
