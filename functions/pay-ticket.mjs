/**
 * LiczMat — bilet do kasy: podpisany dowód, że checkout zaczęło konkretne konto.
 *
 * ─── PO CO ──────────────────────────────────────────────────────────────────
 * Strona jest statyczna i płaci się przez **Payment Linki** Stripe'a, więc jedynym
 * miejscem, w którym przeglądarka mówi, czyja to płatność, jest parametr adresu
 * `client_reference_id`. Parametr adresu może wpisać każdy. Do 2026-09-09 webhook czytał
 * stamtąd goły uid i sprawdzał tylko, czy takie konto istnieje w Firebase Auth — czyli
 * kto podmienił uid w URL-u, ten opłacał Pro dla wybranego cudzego konta i wiązał z nim
 * przyszłe zdarzenia Stripe'a. To jest znalezisko **M1** audytu 2026-09.
 *
 * Bilet zamyka tę dziurę bez klucza API Stripe'a i bez serwera po stronie strony:
 * `payTicket` (callable w `functions/index.js`) wystawia go **tylko** zalogowanemu
 * konciu, na jego własny uid, a webhook przyjmuje uid wyłącznie z biletu, który sam
 * podpisał. Podmiana wartości w URL-u daje odtąd bilet bez podpisu, czyli nic.
 *
 * ─── CO JEST W ŚRODKU ───────────────────────────────────────────────────────
 *     v1.<uid-base64url>.<expSeconds>.<HMAC-SHA256 trzech poprzednich pól>
 *
 * Tylko uid i data ważności. Żadnej ceny, żadnego planu, żadnego adresu e-mail — cena
 * i plan są na produkcie w Stripie (patrz nota przy `lmCheckoutUrl()` w assets/pay.js),
 * a adres przychodzi w samym zdarzeniu Stripe'a.
 *
 * Sekret to `PAY_TICKET_SECRET` w Secret Managerze — nasz własny, nie Stripe'a. Obie
 * strony biletu żyją w tym samym wdrożeniu `functions/`, więc nikt inny nie musi go znać.
 *
 * Czysty moduł: bez sieci, bez Firebase'a, bez `functions`. Sprawdza go
 * `node scripts/test-pay-ticket.mjs`.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Doba. Tyle Stripe trzyma otwartą sesję Checkout, więc tyle ma sens życia biletu. */
export const TICKET_TTL_MS = 24 * 60 * 60 * 1000;

/** Wersja w prefiksie, żeby drugi kształt biletu dało się kiedyś wpuścić obok tego. */
const V = "v1";

/**
 * Uid, jaki wolno zapakować w bilet.
 *
 * To jest alfabet uidów Firebase Auth. Sprawdzany przy odczycie, nie tylko przy wystawianiu:
 * podpis mówi, że wartość jest nasza, a to mówi, że jest uidem — dwie różne rzeczy.
 */
const UID = /^[A-Za-z0-9_-]{1,128}$/;

const enc = (s) => Buffer.from(s, "utf8").toString("base64url");
const dec = (s) => Buffer.from(s, "base64url").toString("utf8");

const sign = (payload, secret) => createHmac("sha256", secret).update(payload).digest();

/**
 * Bilet dla tego uida, ważny `ttlMs` od `nowMs`. `null`, gdy nie ma z czego go zrobić.
 *
 * Nic tu nie rzuca wyjątkiem: wołający jest funkcją chmurową obsługującą żądanie
 * z przeglądarki, a brak biletu ma kończyć się zwykłym „nie ma", nie awarią 500.
 */
export function mintTicket(uid, secret, nowMs, ttlMs) {
  if (typeof uid !== "string" || !UID.test(uid)) return null;
  if (typeof secret !== "string" || !secret) return null;
  const now = nowMs === undefined ? Date.now() : Number(nowMs);
  const ttl = ttlMs === undefined ? TICKET_TTL_MS : Number(ttlMs);
  if (!Number.isFinite(now) || !Number.isFinite(ttl) || ttl <= 0) return null;
  const exp = Math.floor((now + ttl) / 1000);
  const payload = `${V}.${enc(uid)}.${exp}`;
  return `${payload}.${sign(payload, secret).toString("base64url")}`;
}

/**
 * Uid z biletu — albo `null`, i to samo `null` na każdy powód.
 *
 * Powodów jest sześć: nie napis, obca wersja, zła liczba pól, nieczytelna data, bilet po
 * terminie, zły podpis. Wołający nie dostaje żadnego z nich osobno, bo różnica
 * w odpowiedzi jest tym, po czym zgaduje się sekret.
 *
 * Porównanie podpisu jest stałoczasowe, a długość sprawdzana **przed** nim, bo
 * `timingSafeEqual` rzuca wyjątkiem na buforach różnej długości.
 */
export function readTicket(value, secret, nowMs) {
  if (typeof value !== "string" || typeof secret !== "string" || !secret) return null;
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== V) return null;
  const [, uid64, expText, sig64] = parts;
  if (!/^\d{1,15}$/.test(expText)) return null;
  const now = nowMs === undefined ? Date.now() : Number(nowMs);
  // Milisekundy po obu stronach, żeby porównanie było całkowitoliczbowe. Piętnaście cyfr
  // wyżej trzyma iloczyn poniżej Number.MAX_SAFE_INTEGER.
  if (!Number.isFinite(now) || now >= Number(expText) * 1000) return null;

  const expected = sign(`${V}.${uid64}.${expText}`, secret);
  let got;
  try { got = Buffer.from(sig64, "base64url"); } catch (e) { return null; }
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;

  let uid;
  try { uid = dec(uid64); } catch (e) { return null; }
  return UID.test(uid) ? uid : null;
}

/**
 * Czy to w ogóle miał być bilet.
 *
 * Wyłącznie do wpisu w logu: odróżnia „przyszedł goły uid, ktoś próbuje po staremu albo
 * nie po swojemu" od „przyszedł bilet i coś z nim nie tak". Nie jest to żadna kontrola
 * i nic nie wolno na tym oprzeć — odpowiedź daje `readTicket()`.
 */
export function looksLikeTicket(value) {
  return typeof value === "string" && value.startsWith(`${V}.`) && value.split(".").length === 4;
}
