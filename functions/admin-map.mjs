/**
 * LiczMat — panel administratora: czysta część.
 *
 * Sesja 49. Ten plik dostaje żądanie z przeglądarki i oddaje decyzję: kto pyta, o co
 * pyta i co ma zostać zapisane. **Niczego nie zapisuje i nie dotyka sieci**, dlatego
 * `scripts/test-admin-map.mjs` sprawdza go zwykłym `node` — bez `npm install`, bez
 * wdrożenia i bez konta w chmurze. `functions/index.js` jest cienką warstwą, która tę
 * decyzję wykonuje.
 *
 * Ten sam podział, co przy webhooku (sesja 38) i z tego samego powodu: pomyłka tutaj to
 * albo ktoś, kto zapłacił i nie ma dostępu, albo cudza ręka przy polu `plan`.
 *
 * ─── PO CO TO ISTNIEJE ──────────────────────────────────────────────────────
 * `scripts/pro-admin.mjs` (sesja 37) robi to samo z terminala i zostaje: narzędzie,
 * któremu wystarczy klucz, jest tym, czym się ratuje, gdy funkcja albo Firebase leżą.
 * Czego nie robi: nie da się go uruchomić z telefonu ani z cudzego komputera, a klucz
 * konta serwisowego musi przy nim leżeć na dysku. Panel w przeglądarce nie ma klucza —
 * ma zalogowane konto i jedno uprawnienie przy nim.
 *
 * ─── KTO JEST ADMINISTRATOREM ───────────────────────────────────────────────
 * Custom claim `admin: true` przy koncie w Firebase Auth. Nie pole w Firestore i nie
 * lista adresów w kodzie:
 *   - claim jedzie **w podpisanym tokenie**, więc funkcja sprawdza go bez ani jednego
 *     odczytu z bazy i bez pytania, czy ten odczyt się udał;
 *   - przeglądarka nie może go sobie dopisać — pisze go wyłącznie SDK administratora
 *     (`scripts/pro-admin.mjs admin <adres>`);
 *   - lista adresów w kodzie znaczyłaby wdrożenie funkcji przy każdej zmianie tej listy.
 *
 * `isAdmin()` porównuje z `true` przez `===`. To nie jest przesada: napis `"true"`,
 * jedynka i obiekt są w JavaScripcie prawdziwe, a claim przychodzi z JSON-a, który ktoś
 * kiedyś może wpisać ręcznie.
 */

import { DELETE_FIELD, PLAN_FIELDS, PLAN_FREE, PLAN_PRO, planWrite } from "./stripe-map.mjs";

/* Te same wartości, ta sama jedna kopia. `functions/` jest wdrażane osobno i nie widzi
   reszty repozytorium, ale w środku tego katalogu import wystarczy — druga kopia dwóch
   słów planu byłaby trzecią kopią tego samego kontraktu. */
export { DELETE_FIELD, PLAN_FIELDS, PLAN_FREE, PLAN_PRO };

/* ------------------------------------------------------------------ kto pyta */

/** Nazwa uprawnienia w tokenie. Pisze je `scripts/pro-admin.mjs admin <adres>`. */
export const ADMIN_CLAIM = "admin";

/** Czy ten token niesie uprawnienie administratora. Nic poza dosłownym `true`. */
export function isAdmin(token) {
  return Boolean(token) && typeof token === "object" && token[ADMIN_CLAIM] === true;
}

/* ------------------------------------------------------------------ o co pyta */

/** Cztery polecenia i ani jednego więcej. */
export const ACTIONS = ["list", "status", "grant", "revoke"];

/** Domyślna długość planu nadanego ręcznie, w miesiącach. */
export const DEFAULT_MONTHS = 12;

/** Najdłuższy plan, jaki wolno nadać ręcznie. Dziesięć lat to już pomyłka, nie hojność. */
export const MAX_MONTHS = 120;

/** Ile kont oddaje jedno `list`. Tyle, ile Identity Toolkit oddaje jedną stroną. */
export const LIST_LIMIT = 500;

/** `true` dla czegoś, co wygląda na adres e-mail. Ostateczną odpowiedź daje Firebase. */
export function looksLikeEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    && value.length <= 254;
}

/**
 * Adres do postaci, w której trzyma go Firebase Auth: bez spacji, małymi literami.
 *
 * Auth zapisuje adres małymi literami przy zakładaniu konta, a `getUserByEmail` porównuje
 * dosłownie. Bez tego „Jan@Example.com" wpisane w panelu nie znajduje konta, które w bazie
 * stoi jako „jan@example.com", i panel odpowiada „nie ma takiego konta" na konto, które
 * jest. Spacje obcinamy, bo adres wklejony z maila prawie zawsze ma jedną na końcu.
 */
export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Żądanie z przeglądarki → polecenie, albo powód odmowy.
 *
 * Kody błędów, nie zdania: zdanie dla odwiedzającego pisze `assets/admin.js`, w jednym
 * miejscu i po polsku. Funkcja w chmurze nie zna języka, w którym stoi otwarta strona.
 *
 * @returns {{action: string, email: string, months: number}|{error: string}}
 */
export function parseRequest(data) {
  const body = data && typeof data === "object" ? data : {};
  const action = typeof body.action === "string" ? body.action.trim() : "";
  if (!ACTIONS.includes(action)) return { error: "bad-action" };
  if (action === "list") return { action, email: "", months: 0 };

  const email = normalizeEmail(body.email);
  if (!looksLikeEmail(email)) return { error: "bad-email" };
  if (action !== "grant") return { action, email, months: 0 };

  const months = body.months === undefined || body.months === null || body.months === ""
    ? DEFAULT_MONTHS : Number(body.months);
  if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
    return { error: "bad-months" };
  }
  return { action, email, months };
}

/* ------------------------------------------------------------------ co zapisać */

/**
 * Koniec planu nadanego na `months` miesięcy, w milisekundach.
 *
 * Liczone kalendarzowo (`setMonth`), a nie przez mnożenie 30 dni: „na rok" ma znaczyć ten
 * sam dzień w przyszłym roku, a nie 360 dni. To jest druga kopia `monthsFromNow()` ze
 * `scripts/pro-admin.mjs` — katalog funkcji jest wdrażany osobno i nie widzi `scripts/` —
 * a tym, co pilnuje, żeby obie liczyły tak samo, jest `scripts/test-admin-map.mjs` §4:
 * uruchamia jedną i drugą na tej samej liście wartości i porównuje wynik.
 */
export function monthsFromNow(months, now) {
  const n = Number(months);
  if (!Number.isInteger(n) || n < 1 || n > MAX_MONTHS) return null;
  const end = new Date(now === undefined ? Date.now() : now);
  end.setMonth(end.getMonth() + n);
  return end.getTime();
}

/**
 * Trzy pola planu przy nadaniu ręcznym.
 *
 * `planRenews` jest **zawsze** `false`. To nie jest subskrypcja: nic tego nie odnowi, gdy
 * minie `planValidUntil`, a `lmPlanStatus()` w assets/plan.js sam wtedy zgasi Pro i strona
 * powie, dlaczego. `true` byłoby obietnicą odnowienia, której nikt nie dotrzyma — ta sama
 * decyzja, co w `scripts/pro-admin.mjs`.
 */
export function grantWrite(months, now) {
  const until = monthsFromNow(months, now);
  return until === null ? null : planWrite({ pro: true, validUntilMs: until, renews: false });
}

/**
 * Trzy pola przy odebraniu planu: `plan: "free"`, a dwa pozostałe **skasowane**.
 *
 * Kasowane, a nie wyzerowane — `planValidUntil: null` czytałoby się jako plan, który
 * skończył się w 1970 roku. Brak pola czyta się jako „nigdy nie było planu" i to jest
 * prawda. Ten sam zapis robi webhook przy `customer.subscription.deleted`.
 */
export const revokeWrite = () => planWrite({ pro: false });

/* ------------------------------------------------------------------ co pokazać */

/**
 * Dokument profilu → to, co panel pisze przy koncie.
 *
 * Konto bez dokumentu profilu i konto z profilem bez pola `plan` to jedno i to samo:
 * darmowy LiczMat. Brak pola nie jest błędem — tak wygląda każde konto, którego nikt
 * jeszcze nie ruszał.
 *
 * `state` jest tym samym słowem, którym mówi `lmPlanStatus()` w assets/plan.js: plan Pro
 * po dacie ważności to `expired`, a nie `free`. Panel ma powiedzieć „wygasł 3 marca",
 * a nie pokazać konto, które wygląda, jakby nigdy nic nie miało.
 *
 * @returns {{plan: string, validUntil: number|null, renews: boolean, state: string}}
 */
export function planSummary(profile, now) {
  const at = now === undefined ? Date.now() : now;
  const doc = profile && typeof profile === "object" ? profile : {};
  const pro = doc.plan === PLAN_PRO;
  const rawUntil = Number(doc.planValidUntil);
  const validUntil = Number.isFinite(rawUntil) && rawUntil > 0 ? rawUntil : null;
  const renews = doc.planRenews !== false;
  if (!pro) return { plan: PLAN_FREE, validUntil: null, renews: false, state: "free" };
  if (validUntil !== null && validUntil <= at) {
    return { plan: PLAN_PRO, validUntil, renews, state: "expired" };
  }
  return { plan: PLAN_PRO, validUntil, renews, state: "pro" };
}

/**
 * Jeden wiersz listy kont — dokładnie tyle, ile panel pokazuje, i ani pola więcej.
 *
 * Hasła, numeru telefonu ani danych logowania nie ma tu z rozmysłem: funkcja odpowiada
 * przeglądarce, a przeglądarka pokazuje to na ekranie. Wszystko, co tu włożone, jest
 * opublikowane osobie przy panelu.
 */
export function accountRow(user, profile, now) {
  return {
    uid: String((user && user.uid) || ""),
    email: String((user && user.email) || ""),
    admin: Boolean(user && user.admin),
    ...planSummary(profile, now),
  };
}
