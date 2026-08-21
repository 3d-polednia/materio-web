#!/usr/bin/env node
/**
 * LiczMat — nadawanie i odbieranie planu LiczMat Pro, po adresie e-mail.
 *
 *     LM_SA_KEY=~/klucze/liczmat-admin.json node scripts/pro-admin.mjs list
 *     LM_SA_KEY=…                          node scripts/pro-admin.mjs status ktos@example.com
 *     LM_SA_KEY=…                          node scripts/pro-admin.mjs grant  ktos@example.com 12
 *     LM_SA_KEY=…                          node scripts/pro-admin.mjs revoke ktos@example.com
 *
 * Plan naprawczy, sesja 37. `users/{uid}.plan` jest polem serwerowym: wdrożone reguły
 * pozwalają przeglądarce zapisać w profilu wyłącznie `lastSeenAt` i `appVersion`, więc
 * poziom LICZMAT PRO może nadać tylko coś, co ma prawa administratora. Do dziś nic
 * takiego nie istniało i poziom Pro był policzalny, ale nieosiągalny.
 *
 * Dlaczego narzędzie, a nie klikanie w konsoli Firestore: dokument profilu niesie
 * `createdAt`, `lastSeenAt` i `appVersion` — **nie niesie adresu e-mail**. W konsoli widać
 * więc listę identyfikatorów i nie wiadomo, czyj jest który. Adres mieszka w Firebase
 * Auth, po drugiej stronie, i to ten skrypt łączy jedno z drugim.
 *
 * ─── CO TO ZAPISUJE, I CZEGO NIE RUSZA ──────────────────────────────────────
 * Dokładnie trzy pola: `plan`, `planValidUntil`, `planRenews`. Zapis idzie przez
 * `PATCH` z `updateMask.fieldPaths` wyliczającą **te trzy i tylko te trzy** — bez maski
 * Firestore zastępuje dokument w całości i kasuje `createdAt` oraz `lastSeenAt`, czyli
 * datę założenia konta, której nikt już potem nie odtworzy.
 *
 * `planRenews` jest `false` przy każdym nadaniu ręcznym. To nie jest subskrypcja: nic
 * jej nie odnowi, gdy minie `planValidUntil`, a `lmPlanStatus()` w assets/plan.js sam
 * wtedy zgasi Pro i strona powie, dlaczego. Wpisanie `true` byłoby obietnicą odnowienia,
 * której nikt nie dotrzyma.
 *
 * ─── KLUCZ ──────────────────────────────────────────────────────────────────
 * Ścieżka do klucza konta serwisowego w `LM_SA_KEY` (albo `--key <ścieżka>`). Klucz
 * **nigdy nie trafia do repozytorium** — scripts/test-security.mjs przeszukuje repo za
 * kluczem prywatnym i ma się o to rozbić, gdyby ktoś go tu wrzucił.
 *
 * Skrypt odmawia pracy, gdy klucz należy do innego projektu niż ten, z którym rozmawia
 * strona (`projectId` w assets/firebase-config.js). Pomyłka projektu to nadanie planu
 * w cudzej bazie.
 *
 * Bez zależności, czysty `node` — w tym repozytorium nie ma package.json ani node_modules
 * i ta zasada obowiązuje też narzędzia.
 */

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ the contract */

/** Wartość `plan`, która znaczy Pro. Druga, jaką zna kontrakt, to "free". */
export const PLAN_PRO = "premium";
export const PLAN_FREE = "free";

/**
 * Trzy pola planu — i maska zapisu.
 *
 * Kolejność jest ta sama, w której czyta je assets/plan.js. Lista jest jedna, bo maska
 * i zapisywane pola muszą się zgadzać: pole w masce, którego nie ma w ciele żądania,
 * Firestore **kasuje** — i właśnie na tym opiera się `revoke`.
 */
export const PLAN_FIELDS = ["plan", "planValidUntil", "planRenews"];

/** Najdłuższy plan, jaki wolno nadać ręcznie. Dziesięć lat to już pomyłka, nie hojność. */
export const MAX_MONTHS = 120;

/* ------------------------------------------------------------------ pure helpers */

/** `true` dla czegoś, co wygląda na adres e-mail. Ostateczną odpowiedź daje Firebase. */
export function looksLikeEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    && value.length <= 254;
}

/**
 * Ile milisekund ma koniec planu nadanego na `months` miesięcy.
 *
 * Liczone kalendarzowo (`setMonth`), a nie przez mnożenie 30 dni: „na rok" ma znaczyć ten
 * sam dzień w przyszłym roku, a nie 360 dni. Dzień, którego w docelowym miesiącu nie ma
 * (31 stycznia + 1 miesiąc), przesuwa się tak, jak robi to JavaScript — na 2 lub 3 marca;
 * to jest kilkadziesiąt godzin różnicy w planie liczonym na miesiące i nie warto tego
 * poprawiać kosztem drugiej reguły, którą trzeba by potem pamiętać.
 */
export function monthsFromNow(months, now) {
  const n = Number(months);
  if (!Number.isInteger(n) || n < 1 || n > MAX_MONTHS) return null;
  const end = new Date(now === undefined ? Date.now() : now);
  end.setMonth(end.getMonth() + n);
  return end.getTime();
}

/**
 * Ciało żądania Firestore REST — typowane wartości, których wymaga to API.
 *
 * `planValidUntil` jedzie jako `integerValue` i jako **napis**: Firestore przyjmuje
 * 64-bitową liczbę całkowitą, a JSON-owy `number` straciłby precyzję na dużych wartościach.
 * Przy `pro: false` obiekt jest celowo niepełny — dwa brakujące pola są w masce, więc
 * Firestore je skasuje, a konto zostaje z samym `plan: "free"`.
 */
export function planFields({ pro, validUntilMs, renews }) {
  const fields = { plan: { stringValue: pro ? PLAN_PRO : PLAN_FREE } };
  if (!pro) return fields;
  fields.planValidUntil = { integerValue: String(Math.round(validUntilMs)) };
  fields.planRenews = { booleanValue: Boolean(renews) };
  return fields;
}

/** Adres dokumentu profilu w Firestore REST. */
export function docUrl(projectId, uid) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`
    + `/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
}

/** Ten sam adres z maską, która ogranicza zapis do trzech pól planu. */
export function patchUrl(projectId, uid) {
  const mask = PLAN_FIELDS.map((f) => `updateMask.fieldPaths=${f}`).join("&");
  return `${docUrl(projectId, uid)}?${mask}`;
}

/**
 * Dokument Firestore REST → to, co o planie mówi assets/plan.js.
 *
 * Konto bez dokumentu profilu i konto z profilem bez pola `plan` to jedno i to samo:
 * darmowy LiczMat. Brak pola nie jest błędem — tak wygląda każde konto, którego nikt
 * jeszcze nie ruszał.
 */
export function planFromDoc(doc) {
  const f = (doc && doc.fields) || {};
  const plan = (f.plan && f.plan.stringValue) === PLAN_PRO ? PLAN_PRO : PLAN_FREE;
  const rawUntil = f.planValidUntil && f.planValidUntil.integerValue;
  const until = rawUntil === undefined || rawUntil === null ? null : Number(rawUntil);
  return {
    plan,
    validUntil: until !== null && isFinite(until) ? until : null,
    renews: Boolean(f.planRenews && f.planRenews.booleanValue),
  };
}

/** Data jako „2027-08-21" albo kreska. Do wydruku w terminalu, nie dla odwiedzającego. */
export function dayText(millis) {
  if (!millis) return "—";
  const d = new Date(Number(millis));
  return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

/** Jak wygląda plan konta dziś: "pro do 2027-08-21", "pro (wygasł …)" albo "free". */
export function planText(planInfo, now) {
  const at = now === undefined ? Date.now() : now;
  if (planInfo.plan !== PLAN_PRO) return "free";
  if (planInfo.validUntil !== null && planInfo.validUntil <= at) {
    return `pro (wygasł ${dayText(planInfo.validUntil)})`;
  }
  const until = planInfo.validUntil === null ? "bezterminowo" : `do ${dayText(planInfo.validUntil)}`;
  return `pro ${until}${planInfo.renews ? ", odnawia się" : ""}`;
}

/* ------------------------------------------------------------------ the credential */

const B64 = (buf) => Buffer.from(buf).toString("base64url");

/** Dwa API, dwa zakresy: konta w Identity Toolkit, dokumenty w Firestore. */
export const SCOPES = [
  "https://www.googleapis.com/auth/identitytoolkit",
  "https://www.googleapis.com/auth/datastore",
].join(" ");

/**
 * Podpisana asercja JWT — pierwsza połowa OAuth-a dla konta serwisowego.
 *
 * Google wymienia ją na token dostępu. Ważność godzinę, bo tyle wynosi maksimum, jakie
 * przyjmuje; ten skrypt żyje sekundy.
 */
export function jwtAssertion(sa, { now, scope } = {}) {
  const iat = Math.floor((now === undefined ? Date.now() : now) / 1000);
  const aud = sa.token_uri || "https://oauth2.googleapis.com/token";
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: sa.client_email, scope: scope || SCOPES, aud, iat, exp: iat + 3600 };
  const body = `${B64(JSON.stringify(header))}.${B64(JSON.stringify(claims))}`;
  const sig = createSign("RSA-SHA256").update(body).sign(sa.private_key);
  return `${body}.${B64(sig)}`;
}

async function accessToken(sa) {
  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion(sa),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`nie udało się pobrać tokenu (${res.status}): ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/* ------------------------------------------------------------------ the two APIs */

async function api(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const IDENTITY = (projectId, method) =>
  `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:${method}`;

/** Konto po adresie e-mail, albo `null`. */
async function accountByEmail(token, projectId, email) {
  const r = await api(token, IDENTITY(projectId, "lookup"), {
    method: "POST", body: JSON.stringify({ email: [email] }),
  });
  if (!r.ok) throw new Error(`Firebase Auth odmówił (${r.status}): ${JSON.stringify(r.data)}`);
  const user = (r.data.users || [])[0];
  return user ? { uid: user.localId, email: user.email, createdAt: Number(user.createdAt) || null } : null;
}

/** Wszystkie konta, stronami po 500 — tyle, ile oddaje to API za jednym razem. */
async function allAccounts(token, projectId) {
  const out = [];
  let pageToken = "";
  do {
    const url = `${IDENTITY(projectId, "batchGet")}?maxResults=500`
      + (pageToken ? `&nextPageToken=${encodeURIComponent(pageToken)}` : "");
    const r = await api(token, url, { method: "GET" });
    if (!r.ok) throw new Error(`Firebase Auth odmówił (${r.status}): ${JSON.stringify(r.data)}`);
    for (const u of r.data.users || []) {
      out.push({ uid: u.localId, email: u.email || "(bez adresu)", createdAt: Number(u.createdAt) || null });
    }
    pageToken = r.data.nextPageToken || "";
  } while (pageToken);
  return out;
}

/** Profil z Firestore. Brak dokumentu to nie błąd — konto może go jeszcze nie mieć. */
async function readProfile(token, projectId, uid) {
  const r = await api(token, docUrl(projectId, uid), { method: "GET" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore odmówił (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data;
}

/** Zapis trzech pól planu i tylko ich. */
async function writePlan(token, projectId, uid, fields) {
  const r = await api(token, patchUrl(projectId, uid), {
    method: "PATCH", body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`Firestore odmówił zapisu (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data;
}

/* ------------------------------------------------------------------ the CLI */

const USAGE = `LiczMat — plan Pro po adresie e-mail

  node scripts/pro-admin.mjs list
  node scripts/pro-admin.mjs status <e-mail>
  node scripts/pro-admin.mjs grant  <e-mail> [miesiące, domyślnie 12]
  node scripts/pro-admin.mjs revoke <e-mail>

Klucz konta serwisowego: LM_SA_KEY=<ścieżka> albo --key <ścieżka>.
Zapisywane są wyłącznie pola plan, planValidUntil i planRenews.`;

/** `projectId`, z którym rozmawia strona. Klucz z innego projektu to pomyłka, nie opcja. */
export function siteProjectId(source) {
  const src = source === undefined
    ? readFileSync(join(ROOT, "assets", "firebase-config.js"), "utf8") : source;
  const m = src.match(/projectId:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

/**
 * Co jest nie tak z tym kluczem — albo `null`, gdy nic.
 *
 * Sprawdzenie projektu jest tu najważniejsze: klucz z innej bazy nada Pro komuś zupełnie
 * innemu, a operacja przejdzie bez błędu, bo prawa się zgadzają. Wolno na to odpowiedzieć
 * tylko odmową.
 */
export function keyProblem(sa, siteId) {
  if (!sa || typeof sa !== "object") return "To nie jest klucz konta serwisowego.";
  for (const field of ["client_email", "private_key", "project_id"]) {
    if (!sa[field]) return `Klucz nie ma pola ${field} — to nie jest klucz konta serwisowego.`;
  }
  if (siteId && sa.project_id !== siteId) {
    return `Klucz należy do projektu "${sa.project_id}", a strona rozmawia z "${siteId}". Odmawiam.`;
  }
  return null;
}

function loadKey(path) {
  if (!path) {
    throw new Error("Brak klucza. Ustaw LM_SA_KEY=<ścieżka do klucza konta serwisowego>.");
  }
  let sa;
  try {
    sa = JSON.parse(readFileSync(path.replace(/^~(?=\/)/, process.env.HOME || "~"), "utf8"));
  } catch (e) {
    throw new Error(`Nie mogę odczytać klucza z ${path}: ${e.message}`);
  }
  const problem = keyProblem(sa, siteProjectId());
  if (problem) throw new Error(problem);
  return sa;
}

async function main(argv) {
  const args = [...argv];
  let keyPath = process.env.LM_SA_KEY || "";
  const keyFlag = args.indexOf("--key");
  if (keyFlag !== -1) { keyPath = args[keyFlag + 1] || ""; args.splice(keyFlag, 2); }

  const [command, email, monthsRaw] = args;
  if (!command || command === "--help" || command === "-h") { console.log(USAGE); return 0; }
  if (!["list", "status", "grant", "revoke"].includes(command)) {
    console.error(`Nieznane polecenie "${command}".\n\n${USAGE}`);
    return 2;
  }
  if (command !== "list" && !looksLikeEmail(email)) {
    console.error(`"${email || ""}" nie wygląda na adres e-mail.\n\n${USAGE}`);
    return 2;
  }

  const sa = loadKey(keyPath);
  const projectId = sa.project_id;
  const token = await accessToken(sa);

  if (command === "list") {
    const accounts = await allAccounts(token, projectId);
    accounts.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
    const width = Math.max(12, ...accounts.map((a) => a.email.length));
    console.log(`${"e-mail".padEnd(width)}  ${"uid".padEnd(28)}  plan`);
    for (const acc of accounts) {
      const plan = planFromDoc(await readProfile(token, projectId, acc.uid));
      console.log(`${acc.email.padEnd(width)}  ${acc.uid.padEnd(28)}  ${planText(plan)}`);
    }
    console.log(`\n${accounts.length} kont w projekcie ${projectId}.`);
    return 0;
  }

  const account = await accountByEmail(token, projectId, email);
  if (!account) {
    console.error(`Nie ma konta o adresie ${email} w projekcie ${projectId}.`);
    return 1;
  }

  if (command === "status") {
    const plan = planFromDoc(await readProfile(token, projectId, account.uid));
    console.log(`${account.email}\n  uid   ${account.uid}\n  plan  ${planText(plan)}`);
    return 0;
  }

  if (command === "grant") {
    const months = monthsRaw === undefined ? 12 : monthsRaw;
    const until = monthsFromNow(months);
    if (until === null) {
      console.error(`"${months}" to nie jest liczba miesięcy od 1 do ${MAX_MONTHS}.`);
      return 2;
    }
    await writePlan(token, projectId, account.uid,
      planFields({ pro: true, validUntilMs: until, renews: false }));
    console.log(`${account.email} ma LiczMat Pro do ${dayText(until)} (${months} mies.).`);
    console.log("Plan nadany ręcznie nie odnawia się sam — po tej dacie konto wraca do LiczMat.");
    return 0;
  }

  await writePlan(token, projectId, account.uid, planFields({ pro: false }));
  console.log(`${account.email} wraca na plan darmowy. Pola planValidUntil i planRenews skasowane.`);
  return 0;
}

/* Uruchamiane jako polecenie; importowane przez scripts/test-pro-admin.mjs jako moduł. */
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => { console.error(err.message); process.exit(1); });
}
