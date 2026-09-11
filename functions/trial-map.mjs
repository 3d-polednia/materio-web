/**
 * LiczMat — okres próbny: czysta część.
 *
 * Ten plik decyduje, czy nowo założone konto otrzymuje 14-dniowy okres próbny Pro.
 * Niczego nie zapisuje i nie dotyka sieci ani firebase-admin — buduje na `stripe-map.mjs`
 * tak samo jak `admin-map.mjs`. Dzięki temu `scripts/test-trial-map.mjs` sprawdza go
 * zwykłym `node`, bez `npm install`, bez wdrożenia i bez konta w chmurze. `functions/index.js`
 * jest cienką warstwą, która tę decyzję wykonuje.
 *
 * ─── DLACZEGO planRenews ZOSTAJE false ──────────────────────────────────────
 * Okres próbny to nie jest subskrypcja: nic go automatycznie nie odnowi i nic nie pobierze
 * opłaty, gdy minie `planValidUntil`. Funkcja `lmPlanStatus()` w `assets/plan.js` sama
 * wyłącza Pro po upływie terminu ważności i strona mówi użytkownikowi, dlaczego konto
 * wróciło do poziomu darmowego. Ustawienie `true` byłoby obietnicą odnowienia, której nikt
 * nie złożył i której żaden mechanizm nie spełni — ta sama zasada, co przy nadaniu ręcznym
 * w `admin-map.mjs` i `scripts/pro-admin.mjs`.
 *
 * ─── PO CO ISTNIEJE planSource ──────────────────────────────────────────────
 * Bez `planSource: "trial"` kod w `assets/plan.js` nie byłby w stanie odróżnić okresu
 * próbnego od anulowanej subskrypcji Stripe. W obu przypadkach konto ma aktywny plan Pro
 * (`plan: "premium"`), przyszłą datę wygaśnięcia `planValidUntil` i brak odnowienia
 * (`planRenews: false`).
 *
 * Bez tego pola strona nie wiedziałaby, że:
 *   - to darmowy okres próbny, a nie opłacona subskrypcja;
 *   - użytkownikowi nie należy oferować portalu klienta Stripe (gdzie nie ma żadnej
 *     subskrypcji do zarządzania ani anulowania);
 *   - zamiast komunikatu o anulowaniu należy wyświetlić zachętę do zakupu pełnego Pro.
 *
 * Gdy użytkownik zdecyduje się zapłacić w trakcie trwania okresu próbnego, funkcja
 * `planWrite()` ze `stripe-map.mjs` bezwarunkowo usuwa pole `planSource` (ustawiając
 * znacznik `DELETE_FIELD`), więc konto w tym samym zapisie staje się normalną, płatną
 * subskrypcją.
 */

import { PLAN_PRO, planWrite } from "./stripe-map.mjs";

/** Długość okresu próbnego w dniach (dokładnie dwa tygodnie). */
export const TRIAL_DAYS = 14;

/** Identyfikator źródła planu dla okresu próbnego w `planSource`. */
export const TRIAL_SOURCE = "trial";

/** Czas trwania okresu próbnego w milisekundach (14 dni). */
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Koniec okresu próbnego liczony od wskazanego momentu, w milisekundach.
 *
 * @param {number} [now] Czas początkowy w ms (domyślnie Date.now()).
 * @returns {number} Czas zakończenia w ms.
 */
export function trialUntil(now = Date.now()) {
  return now + TRIAL_MS;
}

/**
 * Cztery pola planu do zapisania w dokumencie profilu użytkownika `users/{uid}`.
 *
 * Rozwija wynik `planWrite({ pro: true, validUntilMs: trialUntil(now), renews: false })`.
 * Ponieważ `planWrite()` zawsze ustawia `planSource: DELETE_FIELD` (aby usunąć znacznik
 * triala, gdy użytkownik zaczyna płacić), `trialWrite` nadpisuje ten klucz wartością
 * `TRIAL_SOURCE` ("trial") po rozwinięciu obiektu.
 *
 * Zwracany obiekt zawiera dokładnie cztery klucze: `plan`, `planValidUntil`,
 * `planRenews` oraz `planSource`.
 *
 * @param {number} [now] Czas początkowy w ms (domyślnie Date.now()).
 * @returns {{plan: string, planValidUntil: number, planRenews: boolean, planSource: string}}
 */
export function trialWrite(now = Date.now()) {
  return {
    ...planWrite({ pro: true, validUntilMs: trialUntil(now), renews: false }),
    planSource: TRIAL_SOURCE,
  };
}

/**
 * Decyzja o przyznaniu okresu próbnego.
 *
 * Kolejność sprawdzania:
 *   1. Prawdziwy (truthy) obiekt `grant` oznacza, że dokument `trialGrants/{uid}` już istnieje,
 *      czyli to konto otrzymało już kiedyś okres próbny — odmowa z powodem 'already-granted'
 *      i bez klucza `write`.
 *   2. Profil posiadający już plan Pro (`profile.plan === PLAN_PRO`) — odmowa z powodem
 *      'has-plan' i bez klucza `write`.
 *   3. W przeciwnym razie — okres próbny zostaje przyznany: `{ grant: true, write, until, reason: null }`.
 *      Wartość `null`, pusty obiekt `{}` oraz `{ plan: "free" }` oznaczają świeże darmowe
 *      konto, które kwalifikuje się do triala.
 *
 * @param {object|null} profile Dokument profilu użytkownika lub null.
 * @param {object|null} grant Istniejący dokument grantu lub null.
 * @param {number} [now] Czas bazowy w ms (domyślnie Date.now()).
 * @returns {{grant: false, reason: string}|{grant: true, write: object, until: number, reason: null}}
 */
export function trialDecision(profile, grant, now = Date.now()) {
  if (grant) {
    return { grant: false, reason: "already-granted" };
  }
  if (profile && profile.plan === PLAN_PRO) {
    return { grant: false, reason: "has-plan" };
  }
  return {
    grant: true,
    write: trialWrite(now),
    until: trialUntil(now),
    reason: null,
  };
}

/**
 * Dokument audytowy do kolekcji `trialGrants/{uid}`.
 *
 * Trwały ślad przyznania okresu próbnego w osobnej kolekcji, uniemożliwiający
 * ponowne wykorzystanie triala nawet jeśli profil użytkownika zostanie usunięty
 * lub zresetowany.
 *
 * @param {string} uid Identyfikator konta w Firebase Auth.
 * @param {number} [now] Czas nadania w ms (domyślnie Date.now()).
 * @returns {{uid: string, grantedAt: number, until: number, days: number, source: string}}
 */
export function trialGrantDoc(uid, now = Date.now()) {
  return {
    uid,
    grantedAt: now,
    until: trialUntil(now),
    days: TRIAL_DAYS,
    source: "signup",
  };
}
