# Maile okresu próbnego: plan wykonania

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trzy maile w okresie próbnym (ankieta dzień 3, porady dzień 7, przypomnienie dzień przed końcem), wysyłane codziennie o 10:00 przez Cloud Function, ze stroną ankiety/wypisania, przełącznikiem w koncie i podglądem w panelu admina.

**Architecture:** Czysta logika i teksty w `functions/lifecycle-map.mjs` (testowane w node, bez chmury). Cztery funkcje w `functions/index.js`: harmonogram, endpoint linków, preferencje, admin. Strona `/maile/` w 13 językach wzorem `/wycena/` (quote-view), przełącznik w ustawieniach `/app/`, sekcja w panelu admina.

**Tech Stack:** Node 22, firebase-functions v6 (v2 API: `onSchedule`, `onRequest`, `onCall`), firebase-admin 13, nodemailer (już jest), statyczny generator `scripts/build.mjs`, Playwright z `LM_PLAYWRIGHT`.

**Spec:** `docs/superpowers/specs/2026-10-12-maile-okresu-probnego-design.md`

## Global Constraints

- Region `europe-central2` (stała `REGION` w `functions/index.js`).
- Języki: `MAIL_LANGS` z `functions/mail-map.mjs` (13), domyślny `pl`.
- Żadnych znaków „—” ani „–” w tekstach maili i stron. Bez wykrzykników reklamowych.
- Kolekcje `lifecycleMails`, `surveys`, `mailPrefs`: tylko funkcje, bez zmian w regułach Firestore.
- `LIFECYCLE_LIVE` (`defineString`, domyślnie `"false"`): bez `"true"` harmonogram nic nie wysyła.
- Styl kodu jak w pliku obok: komentarze po polsku w `functions/`, czytelne nazwy, bez skrótów.
- Nie edytować wygenerowanych `.html` ręcznie; tylko `src/` + `node scripts/build.mjs`.

---

### Task 1: `functions/lifecycle-map.mjs`: decyzja, teksty, linki (Codex)

**Files:**
- Create: `functions/lifecycle-map.mjs`
- Create: `scripts/test-lifecycle-map.mjs`
- Modify: `functions/mail-map.mjs` (eksport mapy URL-i stron per język, jeśli brak)

**Interfaces (Produces):**
```js
export const LIFECYCLE_STEPS = ["survey", "tips", "reminder"];
export const DAY = 86400000;
/** grant: {grantedAt}|null, profile: users/{uid} data|null, prefs: {optOut}|null,
 *  state: lifecycleMails/{uid} data|null, email: string|null, disabled: bool, now: ms */
export function lifecycleDecision({ grant, profile, prefs, state, email, disabled, now })
  // -> { send: "survey"|"tips"|"reminder", skip: string[] } | { send: null, reason: string, skip: string[] }
export function lifecycleStart({ grant, profile }) // -> ms|null (grantedAt, albo planValidUntil-14 dni)
export function newMailToken(randomBytes) // -> 32 znaki hex
export function tokenMatches(stored, given) // -> bool, stałoczasowo, false dla nie-stringów
export function lifecycleMessage(step, { lang, displayName, until, uid, token })
  // -> { subject, text, html, headers: {"List-Unsubscribe", "List-Unsubscribe-Post"} }
export const MAIL_LINK_URL = "https://europe-central2-materio-502513.cloudfunctions.net/mailLink";
export function mailPageUrl(lang, params) // -> https://liczmat.com/<prefiks>/maile/?a=..&u=..&t=..[&r=..]
```

Reguły decyzji (z specu, sekcja 1):
- brak e-maila → `{send:null, reason:"no-email"}`; `disabled` → `"disabled"`; `prefs.optOut` → `"opted-out"`; brak startu → `"no-trial"`.
- `until = profile.planValidUntil` (liczba) albo `start + 14*DAY`.
- okna: survey `[start+3d, start+7d)`, tips `[start+7d, until-36h)`, reminder `[until-36h, until)`.
- reminder tylko gdy `profile.plan === "premium" && profile.planSource === "trial"`; inaczej reminder jest pomijany jako krok (`reason:"paid"` gdy to jedyny należny).
- krok „zrobiony”, gdy `state.steps[krok].status` ∈ {sending, sent, failed, skipped}.
- `send` = najpóźniejszy krok, którego okno trwa i nie jest zrobiony; `skip` = wcześniejsze niezrobione kroki, których okno minęło lub które wyprzedza `send`.
- nic należnego → `{send:null, reason:"nothing-due"}`.

- [ ] **Step 1: Napisz test** `scripts/test-lifecycle-map.mjs` wzorem `scripts/test-trial-map.mjs` (ten sam styl `eq`/licznik, `process.exit(1)` przy błędzie). Przypadki obowiązkowe:
  - start 2026-10-01 10:00Z, until start+14d: now = start+2d23h → nothing-due; start+3d → survey; start+6d → survey; start+7d → tips + skip [survey]; start+7d przy survey sent → tips, skip []; until-36h-1ms → tips; until-36h → reminder + skip [survey,tips] gdy niewysłane; until → nothing-due; until-1h przy reminder sent → nothing-due.
  - reminder przy `planSource` brak (kupił) → nie wysyła remindera.
  - optOut, brak e-maila, disabled, brak grantu i brak planValidUntil.
  - brak grantu, jest planValidUntil → start = until-14d.
  - `tokenMatches`: równe, różne, różna długość, undefined.
  - `lifecycleMessage` dla każdego z 3 kroków × 13 języków: niepusty subject/text/html; html zawiera `escapeHtml(imię)` dla imienia `<b>Ala</b>` (nie surowe); żaden subject/text/html nie zawiera „—” ani „–”; nagłówek `List-Unsubscribe` zawiera `MAIL_LINK_URL` i `mailto:contact@liczmat.com`; `List-Unsubscribe-Post` = `List-Unsubscribe=One-Click`; survey ma 5 linków z `a=rate&r=1..5`; każdy mail ma link `a=unsub`; reminder zawiera datę `until` sformatowaną `Intl.DateTimeFormat(lang,{day:"numeric",month:"long",timeZone:"Europe/Warsaw"})`; linki tips/reminder prowadzą do istniejących ścieżek strony w danym języku (sprawdź, że plik `<ścieżka>/index.html` istnieje w repo).
- [ ] **Step 2:** `node scripts/test-lifecycle-map.mjs` → FAIL (brak modułu).
- [ ] **Step 3:** Zaimplementuj `functions/lifecycle-map.mjs`. Teksty PL dokładnie ze specu (sekcja 1); pozostałe 12 języków przetłumacz naturalnie (forma „Ty”/nieformalna jak w `welcome-map.mjs` dla danego języka; DE: „du” tak jak w welcome-map, sprawdź). Ścieżki stron per język weź z wygenerowanych katalogów (`/wyceny/`, `/klienci/`, `/terminarz/`, `/moje-materialy/`, `/liczmat-pro/` i ich odpowiedniki; patrz `src/ia.mjs`). Strona `/maile/` ma w każdym języku slug `maile` (np. `/de/maile/`). HTML przez `renderMail()`; stopka wypisania dopisana na końcu `bodyHtml`/`bodyText`.
- [ ] **Step 4:** test → PASS; także `node scripts/test-welcome-map.mjs` i `node scripts/test-trial-map.mjs` nadal zielone.
- [ ] **Step 5:** Commit `functions: lifecycle-map, the trial e-mails' decision and copy`.

### Task 2: funkcje w `functions/index.js` (Codex, po Task 1)

**Files:** Modify `functions/index.js`; Create `scripts/test-lifecycle-wiring.mjs` (statyczny test źródła: eksporty istnieją, `onSchedule` z `"0 10 * * *"` i `Europe/Warsaw`, `LIFECYCLE_LIVE` domyślnie `"false"`, `secrets: [SMTP_PASSWORD]` przy `lifecycleMails` i `adminMail`, CORS `mailLink` tylko liczmat.com/www/localhost, `adminMail` sprawdza `isAdmin`).

**Interfaces (Produces):**
- `export const lifecycleMails = onSchedule({schedule:"0 10 * * *", timeZone:"Europe/Warsaw", region:REGION, secrets:[SMTP_PASSWORD]}, ...)`: kandydaci `trialGrants.where("grantedAt", ">=", now-16*DAY)`; dla każdego: profil, `mailPrefs`, `lifecycleMails`, `auth.getUser` (e-mail, disabled, displayName); `lifecycleDecision`; skip-y zapisuje; `send` zajmuje w transakcji (`steps.<k> = {status:"sending", at}` + token, gdy brak) i dopiero wtedy wysyła; przy `LIFECYCLE_LIVE !== "true"` tylko `logger.info("lifecycle: dry-run", {uid, step})` i NIE zajmuje kroku. Błąd jednego konta nie przerywa pętli.
- `export const mailLink = onRequest({region, cors:[...]})`: POST JSON `{a,u,t,r|use|missing}` wg specu sekcja 2; także POST `application/x-www-form-urlencoded` z `List-Unsubscribe=One-Click` i `a,u,t` w query → wypisanie. Walidacja: r ∈ 1..5 całkowite, `use` ∈ {"home","business","other"}, `missing` string ≤ 1000 znaków (przycinany). 404 `{ok:false}` dla złego tokenu.
- `export const mailPrefs = onCall({region, cors:[...]})`: `{action:"get"}` → `{optOut:boolean}`; `{action:"set", optOut:boolean}` → zapis `mailPrefs/{uid}` `{optOut, updatedAt, source:"account"}`. Wymaga `request.auth`.
- `export const adminMail = onCall({region, cors:[...], secrets:[SMTP_PASSWORD]})`: tylko `isAdmin(request.auth.token)`. `{action:"preview", lang}` → wysyła 3 maile na e-mail admina, temat z prefiksem `[podgląd] `, token admina z `lifecycleMails/{adminUid}` (nadaj, jeśli brak, bez ruszania `steps`); `{action:"surveys"}` → `{rows:[{email, rating, use, missing, ratedAt, answeredAt, lang}], counts:{survey,tips,reminder}}` (200 najnowszych po `ratedAt`; counts z `lifecycleMails` po `steps.<k>.status=="sent"`).
- `sendMail({to, subject, text, html, headers})`: przekazuje `headers` do nodemailera.

- [ ] Step 1: napisz `scripts/test-lifecycle-wiring.mjs`, uruchom → FAIL.
- [ ] Step 2: zaimplementuj; `node --check functions/index.js`; `cd functions && node -e "import('./index.js')"` bez błędu importu.
- [ ] Step 3: testy z Task 1 + wiring + `scripts/test-admin-map.mjs` zielone.
- [ ] Step 4: Commit `functions: schedule, links, preferences and admin preview for the trial e-mails`.

### Task 3: strona `/maile/`, przełącznik w koncie, panel admina (Antigravity, równolegle z 1-2)

**Files:**
- Create: `src/mail-page-copy.mjs` (13 języków, wzór `src/quote-view-copy.mjs`), `assets/mail-page.js` (wzór `assets/quote-view.js`), `scripts/test-mail-page.mjs` (wzór `scripts/test-*-page.mjs`, Playwright tylko z `LM_PLAYWRIGHT`, z przechwyceniem `fetch` do `MAIL_LINK_URL`).
- Modify: `scripts/build.mjs` (funkcja `buildMailPages()` wzorem `buildQuoteViewPages()`, `noindex: true`, poza sitemapą, slug `maile` w każdym języku), ustawienia `/app/` (znajdź sekcję z `app_wipe_confirm` w `src/app-pages.mjs`/`assets/app.js`) + klucze tłumaczeń przełącznika w 13 językach, `assets/admin.js` + jego markup (sekcja „Maile i ankiety”).

**Interfaces (Consumes, z Task 2):** `POST MAIL_LINK_URL` JSON `{a:"rate",u,t,r}` / `{a:"answer",u,t,use,missing}` / `{a:"unsub",u,t}` → `{ok:true}` | 404; callable `mailPrefs` i `adminMail` (kształty wyżej), region `europe-central2`, tak jak `adminPlan` w `assets/admin.js`.

Zachowanie strony (spec sekcja 2): `a=rate` wysyła ocenę od razu po wczytaniu, pokazuje 5 przycisków z zaznaczoną oceną (zmiana = nowy POST), dwa pytania do pominięcia, „Wyślij” → POST answer → podziękowanie. `a=unsub`: przycisk „Wypisz mnie”, POST dopiero po kliknięciu → potwierdzenie. Brak/zły token (404) → „Link jest nieaktualny”. Wszystko dostępne z klawiatury, czytelne przy 390 px i 1400 px. Bez pigułek, bez limonkowych banerów (reguła „nigdy slopu AI na webie”).

- [ ] Step 1: test strony → FAIL. Step 2: copy + strona + build. Step 3: przełącznik w `/app/` (stan z `mailPrefs get`, zapis `set`, komunikat błędu przy awarii). Step 4: sekcja admina (wybór języka + „Wyślij mi podgląd”, tabela odpowiedzi, liczniki). Step 5: `node scripts/build.mjs`, test strony, `test-copy`, `test-security`, `test-admin-page` zielone (względem bazy). Step 6: Commit `site: /maile/ page, mail toggle in the account, mail section in the admin panel`.

### Task 4: weryfikacja, wdrożenie, podgląd (Claude)

- [ ] Pełny zestaw testów względem świeżej bazy w `mw-base`.
- [ ] Zrzuty `/maile/` (rate, unsub, zły token) i `/app/` przełącznika przy 1400 i 390 px.
- [ ] Push; deploy hostingu z `mw-deploy`; `FUNCTIONS_DISCOVERY_TIMEOUT=60 firebase deploy --only functions:lifecycleMails,functions:mailLink,functions:mailPrefs,functions:adminMail`.
- [ ] Podgląd na polednia@gmail.com z panelu admina; sprawdzić dry-run w logach po 10:00.
- [ ] Po akceptacji właściciela: `LIFECYCLE_LIVE=true` w `functions/.env`, redeploy `functions:lifecycleMails`.
- [ ] Obsidian: notatka „Maile okresu probnego” + link z MOC, poprawka nieaktualnego wątku „Mail powitalny”.
