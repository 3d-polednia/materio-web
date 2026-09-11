# Maile konta z własnej domeny — `auth.liczmat.com`

Maile, które Firebase Authentication wysyła sam: potwierdzenie adresu, reset hasła
i cofnięcie zmiany adresu. Dziś wychodzą jako `noreply@materio-502513.firebaseapp.com`,
czyli z adresu, który nie mówi odbiorcy nic o LiczMacie. Po tej robocie mają wychodzić
jako **`noreply@auth.liczmat.com`**, z nazwą nadawcy **LiczMat** i odpowiedziami
kierowanymi na **`contact@liczmat.com`**.

Dotyczy obu produktów naraz — strona i aplikacja Android siedzą w tym samym projekcie
`materio-502513` i dostają te same szablony.

## Dlaczego subdomena, a nie `liczmat.com`

Firebase wstawi własny adres w pole „Od" wyłącznie dla domeny, która jest **witryną
Firebase Hosting w tym samym projekcie**. Powód jest mechaniczny: z tej samej domeny
serwuje link akcji, `https://<domena>/__/auth/action?mode=…&oobCode=…`. Apeks
`liczmat.com` stoi na GitHub Pages i ścieżki `/__/auth/` obsłużyć nie umie, a przeniesienie
całego serwisu na Hosting to zupełnie inna zmiana niż poprawienie adresu nadawcy.

Subdomena rozwiązuje to bez dotykania niczego, co działa: apeks zostaje na GitHub Pages,
skrzynka `contact@liczmat.com` zostaje na Zimbrze OVH, a `auth.liczmat.com` niesie samą
pocztę konta. Odbiorca zobaczy tę subdomenę dwa razy — w polu „Od" i w linku, w który
kliknie.

## Czego nie wolno ruszyć

W strefie DNS `liczmat.com` w panelu OVH **zostają nietknięte**:

| Rekord | Wartość | Po co |
|---|---|---|
| `liczmat.com` A ×4 | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` | serwis na GitHub Pages |
| `liczmat.com` MX ×3 | `mx1`, `mx2`, `mx3.mail.ovh.net` | skrzynka `contact@liczmat.com` |
| `liczmat.com` TXT | `v=spf1 include:mx.ovh.com ~all` | SPF poczty OVH |

**Jeden rekord SPF na domenę i ani jednego więcej.** Jeśli Firebase poprosi o swój
`include:`, ma trafić na **`auth.liczmat.com`**, jako osobny rekord TXT tej subdomeny —
nie dopisany do apeksu i nie jako drugi `v=spf1` obok istniejącego. Dwa rekordy SPF na
jednej nazwie to SPF nieważny dla obu nadawców naraz.

## Stan na 2026-09-11

Zrobione z terminala (Firebase CLI + REST API, konto `polednia@gmail.com`):

- **krok 1** — witryna Hostingu `liczmat-auth` istnieje, `https://liczmat-auth.web.app`;
- **krok 3** — domena niestandardowa `auth.liczmat.com` dodana do tej witryny. Stan:
  `ownershipState: OWNERSHIP_MISSING`, `hostState: HOST_UNHOSTED`, certyfikat
  `CERT_VALIDATING` — czeka wyłącznie na rekordy w OVH (niżej);
- **krok 5** — `auth.liczmat.com` dopisane do domen autoryzowanych Authentication,
  siedem dotychczasowych wpisów nienaruszone.

Zostało: krok 2 (wdrożenie), krok 6 (klucz API), rekordy DNS w OVH, krok 7 (szablony)
i krok 8 (DMARC).

### Rekordy do wpisania w OVH → Strefa DNS

Firebase podał dokładnie te dwa. Nazwy w panelu OVH wpisuje się **bez** `liczmat.com` —
panel dokleja domenę sam.

| Nazwa | Typ | Wartość |
|---|---|---|
| `auth` | CNAME | `liczmat-auth.web.app` |
| `_acme-challenge.auth` | TXT | `Gf2sFQL_YNm6LC_bQmDGW4k_DA1m9rW4Sf7J7sONzR8` |

CNAME kieruje ruch i zarazem dowodzi własności. TXT jest wyzwaniem ACME dla certyfikatu;
Firebase potrafi je zaliczyć także po HTTP, gdy CNAME już stoi i katalog `hosting/auth/`
jest wdrożony, ale wpisanie TXT jest szybsze i niczego nie psuje. Po wystawieniu
certyfikatu CNAME musi zostać na stałe, TXT można usunąć.

Sprawdzenie stanu bez wchodzenia do konsoli:

```bash
nslookup -type=CNAME auth.liczmat.com 8.8.8.8
curl -sI https://auth.liczmat.com | head -1
```

### Dwie rozbieżności wykryte przy okazji

1. Apeks ma dziś `v=spf1 include:mx.ovh.com ~all` (softfail), nie `-all`, jak głosiła
   tabela wyżej. Tabela poprawiona. Samego rekordu nie ruszamy — to poczta OVH.
2. Klucz przeglądarki ma wśród `allowedReferrers` wpisy `https://liczmat.com`
   i `https://www.liczmat.com` **bez** końcówki `/*`, w odróżnieniu od czterech
   pozostałych. To osobna sprawa od tej roboty, ale warto ją kiedyś wyrównać.

## Kolejność

Kroki 1–4 są odwracalne i niczego nie zmieniają dla użytkownika. **Punkt bez powrotu to
krok 7** — od momentu zapisania szablonu linki w mailach zaczynają wskazywać nową
subdomenę. Do tego czasu wszystko chodzi jak chodziło.

### 1. Witryna Hostingu (konsola)

Firebase → **Hosting** → *Dodaj kolejną witrynę*. Identyfikator: **`liczmat-auth`**,
dokładnie tak — ta nazwa stoi w `firebase.json` i literówka wywali wdrożenie.
Dostaniesz `liczmat-auth.web.app`.

### 2. Wdrożenie dwóch plików (terminal, katalog repo)

```bash
firebase deploy --only hosting:liczmat-auth
```

**Nigdy samo `firebase deploy`.** Bez `--only` polecenie ruszyłoby też `functions/`, a te
nie były wdrażane ani razu i ich wdrożenie to osobna decyzja (włącza webhook Stripe'a
i panel admina — patrz `docs/ADMIN.md` i `docs/STRIPE.md`).

Publikowany jest wyłącznie katalog `hosting/auth/`: strona wyjaśniająca i `robots.txt`.
Sprawdź `https://liczmat-auth.web.app` — ma się otworzyć ta strona, nie serwis.

### 3. Domena niestandardowa (konsola)

Hosting → witryna `liczmat-auth` → *Dodaj domenę niestandardową* → `auth.liczmat.com`.
Firebase poda rekordy do weryfikacji własności i skierowania ruchu (TXT, potem A albo
CNAME). Wpisz je w OVH → *Strefa DNS* → tylko dla nazwy `auth`.

### 4. Certyfikat

Poczekaj, aż konsola pokaże domenę jako aktywną (zwykle minuty, w skrajnym razie do
24 godzin). Sprawdź `https://auth.liczmat.com` — ta sama strona, ważny certyfikat.

### 5. Domeny autoryzowane (konsola)

Authentication → *Settings* → *Authorized domains* → dodaj `auth.liczmat.com`.
**Zostaw wszystkie dotychczasowe wpisy**: `materio-502513.firebaseapp.com`,
`materio-502513.web.app`, `materio-app.com`, `www.materio-app.com`, `localhost`,
`liczmat.com`, `www.liczmat.com`. Lista jest opisana w nagłówku
`assets/firebase-config.js`.

### 6. Ograniczenia klucza API przeglądarki (Google Cloud)

APIs & Services → *Credentials* → klucz przeglądarki → *Website restrictions* → dodaj
`https://auth.liczmat.com/*`. Bez tego strona `/__/auth/action` dostanie
`403 API_KEY_HTTP_REFERRER_BLOCKED` i **link z maila nie zadziała**, mimo że domena będzie
zweryfikowana. To dwie różne listy i obie muszą znać nowy host.

### 7. Szablony (konsola) — punkt bez powrotu

Authentication → *Templates*. Dla **każdego z trzech** szablonów (weryfikacja adresu,
reset hasła, cofnięcie zmiany adresu):

- *customize domain* → `auth.liczmat.com`,
- adres nadawcy: `noreply@auth.liczmat.com`,
- nazwa nadawcy: `LiczMat`,
- *reply-to*: `contact@liczmat.com`.

Firebase poda kolejne rekordy TXT/CNAME (podpis DKIM) — dodaj je w OVH dla `auth`.
Weryfikacja bywa natychmiastowa, deklarowany limit to 24 godziny.

Treści maili **nie da się przepisać** poza szablonem resetu hasła — Firebase pozwala
edytować body tylko tam. Nazwa produktu w tekście to `%APP_NAME%`, czyli nazwa projektu,
którą właściciel ustawił na `LiczMat` 2026-08-21. Język wybiera `auth.languageCode`,
ustawiany w `assets/app.js` z języka strony.

### 8. DMARC (OVH)

Domena nie ma dziś rekordu DMARC. Dodaj TXT dla nazwy `_dmarc`:

```
v=DMARC1; p=none; rua=mailto:contact@liczmat.com
```

`p=none` to tryb obserwacji — nic nie odrzuca, zbiera raporty. Po kilku tygodniach czytania
raportów można podnieść do `p=quarantine`. Rekord na apeksie obejmuje subdomeny, więc
liczy się i dla `auth.liczmat.com`, i dla poczty OVH.

## Sprawdzenie

Nie da się tego odczytać z repozytorium — trzeba wywołać jeden prawdziwy mail.

1. Na `liczmat.com/app/` wybierz *nie pamiętam hasła* i podaj `contact@liczmat.com`
   (adres istnieje i jest twój, a **nie** jest kontem, którym się logujesz — reset dla
   nieistniejącego konta i tak nie wyśle nic, więc najpierw załóż na ten adres konto
   testowe, a po sprawdzeniu je usuń w `/app/`).
2. W Zimbrze otwórz *pokaż źródło wiadomości* i sprawdź nagłówki:
   - `From:` zawiera `LiczMat <noreply@auth.liczmat.com>`,
   - `Reply-To:` to `contact@liczmat.com`,
   - `Authentication-Results:` ma `spf=pass`, `dkim=pass`, `dmarc=pass`,
   - link w treści zaczyna się od `https://auth.liczmat.com/__/auth/action?mode=`.
3. Kliknij link i przejdź reset do końca — to jedyny dowód, że krok 6 jest zrobiony.
4. Sprawdź to samo z aplikacji Android, bo używa tego samego projektu.

Jeśli weryfikacja domeny stoi dłużej niż dobę: sprawdź rekordy przez
`nslookup -type=TXT auth.liczmat.com 8.8.8.8` — OVH potrafi mieć własne TTL i propagacja
bywa wolniejsza niż konsola sugeruje. Rekord wpisany dla `auth.liczmat.com` zamiast dla
`auth` (albo odwrotnie) to najczęstsza pomyłka: panel OVH dokleja domenę sam.

## Wycofanie

W odwrotnej kolejności, bo tylko krok 7 jest widoczny dla użytkownika:

1. Szablony → *customize domain* z powrotem na domyślną. Maile znów wychodzą
   z `noreply@materio-502513.firebaseapp.com`, a linki z `materio-502513.firebaseapp.com` —
   działają od razu, bo ta domena nigdy nie przestaje być obsługiwana.
2. Usuń rekordy DKIM/TXT dodane dla `auth` w OVH.
3. Hosting → usuń domenę niestandardową, potem witrynę `liczmat-auth`.
4. W repo: usuń blok `hosting` z `firebase.json`, katalog `hosting/` i
   `scripts/test-hosting.mjs`, cofnij wpis `hosting` w `.github/workflows/pages.yml`.

Rekordów apeksu (A, MX, SPF) żaden z tych kroków nie dotyka, więc serwis i skrzynka
`contact@liczmat.com` są poza zasięgiem tej zmiany w obie strony.

## Czego ta zmiana nie robi

**Nie ma maila powitalnego.** Po rejestracji leci jeden mail — weryfikacja adresu,
wysyłana przez `sendEmailVerification` w `assets/app.js:309`. Firebase nie umie wysłać
niczego więcej i nie pozwala przepisać treści tego szablonu, więc prawdziwe powitanie
wymagałoby własnej wysyłki z Cloud Function przez SMTP OVH, kopii tekstów w trzynastu
językach wewnątrz `functions/` (katalog nie widzi reszty repozytorium) i źródła prawdy
o języku odbiorcy, którego dziś nie ma: `users/{uid}` trzyma tylko `createdAt`,
`lastSeenAt` i `appVersion`, a reguły nie wpuszczą tam pola `lang`. To osobne zadanie.

**Kod strony się nie zmienia.** `sendPasswordResetEmail` i `sendEmailVerification` nie
dostają `actionCodeSettings` i nie mają dostać: bez `continueUrl` link kończy się na
własnej stronie Firebase'a, która po prostu potwierdza, że hasło zmienione. Gdyby kiedyś
miał wracać do `/app/`, uwaga na kolizję — `/app/` używa własnego `?mode=`
(`signup`/`reset`/`signin`, `assets/account.js:161-175`), a Firebase dokleja do linku
swoje `mode=resetPassword`.
