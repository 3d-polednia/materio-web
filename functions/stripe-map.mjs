/**
 * LiczMat — Stripe → kontrakt planu. Czysta część webhooka.
 *
 * Plan naprawczy, sesja 38. Ten plik **niczego nie importuje** i **niczego nie zapisuje**:
 * dostaje zdarzenie Stripe'a, oddaje decyzję. Dzięki temu `scripts/test-webhook-map.mjs`
 * sprawdza go zwykłym `node`, bez chmury, bez `npm install` i bez konta Stripe — a
 * `functions/index.js` jest cienką warstwą, która tę decyzję wykonuje.
 *
 * Podział jest celowy: pomyłka w mapowaniu statusu subskrypcji na `plan` to albo ktoś
 * płacący bez dostępu, albo dostęp bez płacenia. Jedno i drugie ma być sprawdzalne bez
 * wdrażania czegokolwiek.
 */

/* ------------------------------------------------------------------ the contract */

/**
 * Te same dwie wartości i te same trzy pola, co `scripts/pro-admin.mjs` i `assets/plan.js`.
 *
 * Kopia, nie import — `functions/` jest wdrażane osobno i nie widzi reszty repozytorium.
 * Że obie kopie się zgadzają, pilnuje `scripts/test-webhook-map.mjs` §1: czyta jeden plik
 * i drugi, i porównuje. Rozjazd tutaj oznacza plan zapisany w pole, do którego nikt nie
 * zagląda.
 */
export const PLAN_PRO = "premium";
export const PLAN_FREE = "free";
export const PLAN_FIELDS = ["plan", "planValidUntil", "planRenews"];

/** Znacznik „skasuj to pole". `functions/index.js` zamienia go na `FieldValue.delete()`. */
export const DELETE_FIELD = "__delete__";

/**
 * Statusy subskrypcji, przy których konto ma LiczMat Pro.
 *
 * `past_due` jest tu **celowo**: opłacony okres trwa dalej, nie udało się dopiero pobrać
 * opłaty za następny. Odebranie dostępu w dniu nieudanego pobrania zabrałoby go komuś,
 * kto ma ważną kartę i jedną odrzuconą transakcję — a Stripe i tak ponawia próbę przez
 * kilka dni. Plan wygaśnie sam, gdy minie `planValidUntil`.
 */
export const PRO_STATUSES = ["active", "trialing", "past_due"];

/** Statusy, przy których nie ma Pro: nieopłacone od początku albo zakończone. */
export const FREE_STATUSES = ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"];

/* ------------------------------------------------------------------ the signature */

/**
 * Nagłówek `Stripe-Signature`, rozebrany: `t=1614556800,v1=abc…,v1=def…`.
 *
 * Podpisów `v1` może być kilka — tak wygląda podmiana sekretu bez przerwy w działaniu.
 * Wystarczy, że zgadza się którykolwiek.
 */
export function parseStripeSignature(header) {
  if (typeof header !== "string" || !header) return null;
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(",")) {
    const at = part.indexOf("=");
    if (at === -1) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (key === "t") timestamp = /^\d+$/.test(value) ? Number(value) : null;
    else if (key === "v1" && /^[0-9a-f]+$/i.test(value)) signatures.push(value.toLowerCase());
  }
  if (timestamp === null || !signatures.length) return null;
  return { timestamp, signatures };
}

/**
 * Co Stripe podpisał: znacznik czasu, kropka, **surowe** ciało żądania.
 *
 * Surowe, bajt w bajt. Ciało przepuszczone przez `JSON.parse` i z powrotem przez
 * `JSON.stringify` ma inne białe znaki i inną kolejność kluczy, więc podpis się nie
 * zgadza — to jest najczęstszy sposób, w jaki ten webhook się psuje.
 */
export const signedPayload = (timestamp, rawBody) =>
  `${timestamp}.${typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")}`;

/**
 * Czy ten podpis jest prawdziwy i świeży.
 *
 * `hmac` jest wstrzykiwane, żeby ten plik nie importował `node:crypto` i dał się czytać
 * jako czysta funkcja; `functions/index.js` i test podają to samo.
 *
 * Okno czasu to pięć minut, tyle co domyślne u Stripe'a. Bez niego podpisane żądanie
 * sprzed miesiąca, przechwycone i puszczone drugi raz, nadal by przeszło.
 *
 * @returns {{ok: boolean, reason: string}}
 */
export function verifyStripeSignature(rawBody, header, secret, opts = {}) {
  const { hmac, now = Date.now(), toleranceSec = 300 } = opts;
  if (typeof hmac !== "function") return { ok: false, reason: "no-hmac" };
  if (!secret) return { ok: false, reason: "no-secret" };
  const parsed = parseStripeSignature(header);
  if (!parsed) return { ok: false, reason: "bad-header" };

  const age = Math.abs(Math.floor(now / 1000) - parsed.timestamp);
  if (age > toleranceSec) return { ok: false, reason: "stale" };

  const expected = hmac(secret, signedPayload(parsed.timestamp, rawBody));
  for (const candidate of parsed.signatures) {
    if (candidate.length === expected.length && timingSafeEqualHex(candidate, expected)) {
      return { ok: true, reason: "" };
    }
  }
  return { ok: false, reason: "mismatch" };
}

/**
 * Porównanie w stałym czasie, na napisach szesnastkowych.
 *
 * Zwykłe `===` na napisach kończy się na pierwszej różnej literze, więc czas odpowiedzi
 * mówi, ile znaków się zgadzało. To wystarcza, żeby podpis zgadnąć znak po znaku.
 */
export function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------ the subscription */

/**
 * Koniec opłaconego okresu, w milisekundach.
 *
 * Stripe trzymał `current_period_end` na subskrypcji; od wersji API z 2025 roku to pole
 * mieszka na **pozycji** subskrypcji (`items.data[].current_period_end`). Czytamy oba, bo
 * konto właściciela dostanie którąś z tych wersji i nie chcemy, żeby o tym decydował
 * przypadek. Stripe podaje sekundy, kontrakt trzyma milisekundy.
 */
export function periodEndMs(sub) {
  const top = sub && sub.current_period_end;
  const item = sub && sub.items && sub.items.data && sub.items.data[0]
    && sub.items.data[0].current_period_end;
  const seconds = Number(top || item);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : null;
}

/**
 * Subskrypcja Stripe'a → trzy pola kontraktu.
 *
 * Reguła, o którą chodzi najbardziej: **anulowanie nie odbiera Pro od razu.** Ktoś, kto
 * wyłączył odnawianie w środku opłaconego miesiąca, ma Pro do końca tego miesiąca —
 * `cancel_at_period_end` zmienia tylko `planRenews`, a `lmPlanStatus()` w assets/plan.js
 * sam zgasi plan, gdy minie data. Odebranie dostępu w chwili kliknięcia „anuluj" byłoby
 * zabraniem czegoś, za co ktoś zapłacił.
 *
 * @returns {{pro: boolean, validUntilMs: number|null, renews: boolean}}
 */
export function planFromSubscription(sub) {
  const status = (sub && sub.status) || "";
  const until = periodEndMs(sub);
  if (PRO_STATUSES.includes(status) && until !== null) {
    return {
      pro: true,
      validUntilMs: until,
      // past_due nie obiecuje odnowienia: właśnie nie udało się pobrać opłaty.
      renews: status !== "past_due" && !sub.cancel_at_period_end,
    };
  }
  return { pro: false, validUntilMs: null, renews: false };
}

/**
 * Trzy pola do zapisania — albo do skasowania.
 *
 * Przy planie darmowym `planValidUntil` i `planRenews` **znikają**, zamiast dostać `null`.
 * Wartość `null` w `planValidUntil` czytałaby się jako plan, który skończył się w 1970
 * roku; brak pola czyta się jako „nigdy nie było planu", i to jest prawda. To ta sama
 * decyzja, co `revoke` w scripts/pro-admin.mjs.
 */
export function planWrite(mapped) {
  if (!mapped.pro) {
    return { plan: PLAN_FREE, planValidUntil: DELETE_FIELD, planRenews: DELETE_FIELD };
  }
  return {
    plan: PLAN_PRO,
    planValidUntil: mapped.validUntilMs,
    planRenews: Boolean(mapped.renews),
  };
}

/* ------------------------------------------------------------------ the event */

/** Zdarzenia, na które ten webhook w ogóle reaguje. Reszta jest kwitowana i zapominana. */
export const HANDLED = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

/**
 * Zdarzenie Stripe'a → co z nim zrobić. Trzy możliwe odpowiedzi i ani jednej więcej:
 *
 *   { action: "ignore" }                     — nie nasze zdarzenie
 *   { action: "link", customerId, uid, email } — zapamiętaj, czyj to klient Stripe'a
 *   { action: "plan", customerId, write }      — przestaw plan tego klienta
 *
 * **Dlaczego zapłata i plan to dwa osobne kroki.** Adres konta (`client_reference_id`,
 * czyli uid) przychodzi wyłącznie w `checkout.session.completed`; daty i status
 * subskrypcji wyłącznie w `customer.subscription.*`. Jedno zdarzenie nie niesie obu
 * połówek, więc pierwsze zapamiętuje, czyj to klient, a drugie ustawia plan.
 *
 * Kolejność dostarczenia **nie jest gwarantowana**: zdarzenie subskrypcji potrafi przyjść
 * pierwsze. Wtedy `functions/index.js` nie zna jeszcze uida, odpowiada błędem, a Stripe
 * ponawia — przez kilka dni, z rosnącą przerwą. To jest właściwa reakcja: zapłata, której
 * nie umiemy jeszcze przypisać, ma poczekać, a nie zniknąć.
 */
export function decide(event) {
  const type = event && event.type;
  if (!HANDLED.includes(type)) return { action: "ignore", type: type || "" };

  const object = (event.data && event.data.object) || {};

  if (type === "checkout.session.completed") {
    // Subskrypcję zakłada Stripe; zapłata jednorazowa nie ustawia planu, bo nie ma czego odnawiać.
    if (object.mode && object.mode !== "subscription") return { action: "ignore", type };
    const customerId = customerIdOf(object);
    const uid = typeof object.client_reference_id === "string" && object.client_reference_id
      ? object.client_reference_id : null;
    const email = emailOf(object);
    if (!customerId || (!uid && !email)) return { action: "ignore", type };
    return { action: "link", type, customerId, uid, email };
  }

  const customerId = customerIdOf(object);
  if (!customerId) return { action: "ignore", type };
  const mapped = type === "customer.subscription.deleted"
    // Subskrypcja skończona teraz: zwrot, obciążenie zwrotne albo koniec po anulowaniu.
    // Data ważności i tak by już minęła, ale zapis wprost jest jednoznaczny.
    ? { pro: false, validUntilMs: null, renews: false }
    : planFromSubscription(object);
  return { action: "plan", type, customerId, write: planWrite(mapped) };
}

/** `customer` bywa identyfikatorem albo całym obiektem — Stripe rozwija je zależnie od wywołania. */
export function customerIdOf(object) {
  const c = object && object.customer;
  if (typeof c === "string" && c) return c;
  if (c && typeof c === "object" && typeof c.id === "string" && c.id) return c.id;
  return null;
}

/** Adres z sesji Checkout. Zapasowy sposób na znalezienie konta, gdy nie ma uida. */
export function emailOf(session) {
  const details = session && session.customer_details;
  const email = (details && details.email) || (session && session.customer_email);
  return typeof email === "string" && email.includes("@") ? email : null;
}
