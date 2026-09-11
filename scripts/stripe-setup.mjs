#!/usr/bin/env node
/**
 * LiczMat — tworzenie i synchronizacja katalogu produktów i cen w Stripe.
 *
 *     STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs --sandbox [--dry-run]
 *     STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs --live    [--dry-run]
 *
 * Skrypt tworzy w Stripe dwa produkty (LiczMat Pro — miesięcznie oraz rocznie),
 * przypisane do nich ceny cykliczne w 7 walutach oraz Payment Linki.
 * Działa w pełni idempotentnie — ponowne uruchomienie odnajduje istniejące obiekty
 * i nie tworzy duplikatów.
 *
 * Bez zewnętrznych zależności (npm), czysty Node 22 z wbudowanym globalnym `fetch`.
 *
 * ─── DLACZEGO KWOTY SĄ CZYTANE Z assets/pay.js ──────────────────────────────
 * assets/pay.js jest jedynym źródłem prawdy o cenach LiczMat Pro na stronie.
 * Znajduje się tam 7 walut (PLN, EUR, USD, UAH, CZK, RON, RSD) i 2 plany (miesięczny
 * oraz roczny), co daje łącznie 14 ręcznie skalkulowanych kwot (w najmniejszych jednostkach,
 * np. groszach lub centach).
 *
 * Zamiast powielać te kwoty na sztywno w tym skrypcie, odczytujemy literał `LM_PAY`
 * bezpośrednio z pliku `assets/pay.js` i ewaluujemy go przez `new Function()`. Dzięki temu
 * niemożliwy jest rozjazd (drift) między tym, co widzi odwiedzający na stronie, a tym,
 * co pobiera Stripe na formatce płatności. Jeśli w pay.js brakuje kwoty dla którejkolwiek
 * z 7 walut, skrypt natychmiast przerywa działanie z błędem.
 *
 * ─── CENY W STRIPE SĄ NIEZMIENNE (IMMUTABLE) ────────────────────────────────
 * W modelu obiektowym Stripe obiekt `Price` jest niezmienny po utworzeniu: nie wolno
 * modyfikować jego `unit_amount` ani walut w `currency_options`.
 *
 * Gdy kwota planu w `assets/pay.js` ulegnie zmianie, skrypt wykrywa różnicę między
 * kwotą w Stripe a kwotą w pliku i celowo odmawia pracy (exit 1) z wyraźnym ostrzeżeniem.
 * Nie wolno próbować aktualizować istniejącej ceny w miejscu ani po cichu jej zignorować —
 * administrator musi świadomie zdeaktywować starą cenę w panelu Stripe lub nadać nowy
 * `lookup_key`, aby utworzyć nową cenę. W ten sposób chronimy subskrybentów przed
 * pobraniem innej kwoty niż deklarowana.
 *
 * ─── STRAŻNIK KLUCZY: sk_test_ ORAZ sk_live_ ─────────────────────────────────
 * Klucz prywatny pobierany jest wyłącznie ze zmiennej środowiskowej `STRIPE_SECRET_KEY`.
 * Nigdy nie jest przekazywany jako argument CLI, nigdy nie jest wypisywany na ekranie
 * ani zapisywany do żadnego pliku.
 *
 * Flaga `--sandbox` bezwzględnie wymaga klucza testowego (zaczynającego się od `sk_test_`),
 * a flaga `--live` wymaga klucza produkcyjnego (zaczynającego się od `sk_live_`).
 * Niezgodność trybu z prefiksem klucza skutkuje natychmiastowym zakończeniem pracy z kodem 1.
 * Ten strażnik to jedyna bariera, która chroni przed przypadkowym zaśmieceniem lub utworzeniem
 * obiektów na żywym koncie produkcyjnym w trakcie testów.
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PRODUCT_NAMES = {
  monthly: "LiczMat Pro — miesięcznie",
  yearly: "LiczMat Pro — rocznie",
};

export const INTERVALS = {
  monthly: "month",
  yearly: "year",
};

export const USAGE = `LiczMat — tworzenie katalogu produktów i cen w Stripe

Użycie:
  node scripts/stripe-setup.mjs --sandbox [--dry-run]
  node scripts/stripe-setup.mjs --live    [--dry-run]

Opcje:
  --sandbox   tworzenie / sprawdzanie w trybie testowym (wymaga STRIPE_SECRET_KEY zaczynającego się od sk_test_)
  --live      tworzenie / sprawdzanie w trybie produkcyjnym (wymaga STRIPE_SECRET_KEY zaczynającego się od sk_live_)
  --dry-run   tylko odczyt (GET) — wypisuje co istnieje i co zostałoby utworzone

Klucz Stripe:
  Wymagana zmienna środowiskowa STRIPE_SECRET_KEY. Klucz nie może być podawany
  w linii poleceń ani zapisywany w plikach.`;

/* ------------------------------------------------------------------ formularze i żądania */

/**
 * Spłaszcza zagnieżdżony obiekt lub tablicę do notacji nawiasowej Stripe
 * (np. metadata[lm_plan], currency_options[eur][unit_amount], line_items[0][price]).
 */
export function flattenToForm(obj, prefix = "") {
  const entries = [];
  if (obj === null || obj === undefined) return entries;
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    const prop = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const itemProp = `${prop}[${i}]`;
        if (typeof item === "object" && item !== null) {
          entries.push(...flattenToForm(item, itemProp));
        } else {
          entries.push([itemProp, String(item)]);
        }
      }
    } else if (typeof value === "object") {
      entries.push(...flattenToForm(value, prop));
    } else {
      entries.push([prop, String(value)]);
    }
  }
  return entries;
}

/** Konwertuje obiekt do formatu application/x-www-form-urlencoded. */
export function formBody(obj) {
  const entries = flattenToForm(obj);
  const params = new URLSearchParams();
  for (const [key, val] of entries) {
    params.append(key, val);
  }
  return params.toString();
}

/** Wywołanie REST API Stripe z nagłówkiem autoryzacji i Idempotency-Key dla POST. */
export async function stripeRequest(apiKey, method, path, body = null, dryRun = false) {
  if (dryRun && method !== "GET") {
    throw new Error(`Niedozwolone zapytanie ${method} w trybie --dry-run.`);
  }

  const url = `https://api.stripe.com${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  const init = {
    method,
    headers,
  };

  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Idempotency-Key"] = randomUUID();
    if (body) {
      init.body = typeof body === "string" ? body : formBody(body);
    }
  }

  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && data.error && data.error.message)
      ? data.error.message
      : `HTTP ${res.status}: ${JSON.stringify(data)}`;
    console.error(`Błąd Stripe (${res.status}): ${msg}`);
    process.exit(1);
  }

  return data;
}

/* ------------------------------------------------------------------ konfiguracja z pay.js */

/**
 * Wyciąga literał 'var LM_PAY = {...};' z tekstu assets/pay.js i ewaluuje go bez zasięgu globalnego.
 */
export function parsePayJs(src) {
  const match = src.match(/var\s+LM_PAY\s*=\s*\{[\s\S]*?\n\};/);
  if (!match) {
    throw new Error("Nie znaleziono literału 'var LM_PAY = {...};' w assets/pay.js");
  }
  let pay;
  try {
    pay = new Function(`${match[0]}\nreturn LM_PAY;`)();
  } catch (err) {
    throw new Error(`Błąd ewaluacji LM_PAY: ${err.message}`);
  }
  return pay;
}

/**
 * Weryfikuje strukturę LM_PAY: 7 walut z PLN na początku oraz brak luk kwotowych w planach.
 */
export function validatePayConfig(pay) {
  if (!pay || typeof pay !== "object") {
    throw new Error("Obiekt LM_PAY nie istnieje lub nie jest obiektem.");
  }
  if (!Array.isArray(pay.currencies) || pay.currencies.length !== 7 || pay.currencies[0] !== "PLN") {
    throw new Error("LM_PAY.currencies musi zawierać dokładnie 7 kodów walut, z PLN jako pierwszą.");
  }
  if (!Array.isArray(pay.plans) || pay.plans.length < 2) {
    throw new Error("LM_PAY.plans musi zawierać co najmniej 2 plany.");
  }

  const requiredPlans = ["monthly", "yearly"];
  for (const planId of requiredPlans) {
    const plan = pay.plans.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(`Brak planu "${planId}" w LM_PAY.plans.`);
    }
    if (!plan.price || typeof plan.price !== "object") {
      throw new Error(`Plan "${planId}" nie ma zdefiniowanej mapy cen (price).`);
    }
    for (const code of pay.currencies) {
      const amount = plan.price[code];
      if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
        throw new Error(`Plan "${planId}" nie ma poprawnej kwoty dla waluty ${code} w assets/pay.js.`);
      }
    }
  }

  return pay;
}

/** Ładuje i weryfikuje konfigurację bezpośrednio z pliku assets/pay.js. */
export function loadPayConfig(payJsPath) {
  const src = readFileSync(payJsPath, "utf8");
  return validatePayConfig(parsePayJs(src));
}

/* ------------------------------------------------------------------ weryfikacja CLI i klucza */

export function parseArgs(argv) {
  const args = [...argv];
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }

  let mode = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg === "--sandbox") {
      if (mode && mode !== "sandbox") {
        throw new Error("Nie można łączyć flag --sandbox i --live.");
      }
      mode = "sandbox";
    } else if (arg === "--live") {
      if (mode && mode !== "live") {
        throw new Error("Nie można łączyć flag --sandbox i --live.");
      }
      mode = "live";
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else {
      throw new Error(`Nieznana opcja "${arg}".`);
    }
  }

  if (!mode) {
    throw new Error("Wymagane jest podanie trybu: --sandbox albo --live.");
  }

  return { mode, dryRun, help: false };
}

/**
 * Sprawdza poprawność klucza Stripe pod kątem wybranego trybu.
 * Zwraca treść błędu lub null, gdy klucz jest poprawny.
 */
export function checkKey(mode, key) {
  if (!key || typeof key !== "string" || !key.trim()) {
    return "Brak klucza. Ustaw zmienną środowiskową STRIPE_SECRET_KEY.";
  }
  const trimmed = key.trim();
  if (mode === "sandbox" && !trimmed.startsWith("sk_test_")) {
    return "Tryb --sandbox wymaga klucza testowego (zaczynającego się od sk_test_). Podany klucz nie pasuje do tego trybu.";
  }
  if (mode === "live" && !trimmed.startsWith("sk_live_")) {
    return "Tryb --live wymaga klucza produkcyjnego (zaczynającego się od sk_live_). Podany klucz nie pasuje do tego trybu.";
  }
  return null;
}

/* ------------------------------------------------------------------ kroki tworzenia katalogu */

/** Pobiera listę wszystkich produktów (z obsługą paginacji). */
export async function getAllProducts(apiKey) {
  const products = [];
  let startingAfter = null;
  while (true) {
    const query = new URLSearchParams({ limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const res = await stripeRequest(apiKey, "GET", `/v1/products?${query.toString()}`);
    if (res.data) products.push(...res.data);
    if (!res.has_more || !res.data || res.data.length === 0) break;
    startingAfter = res.data[res.data.length - 1].id;
  }
  return products;
}

/** Krok 1: Wyszukuje lub tworzy produkt dla danego planu. */
export async function ensureProduct(apiKey, planId, allProducts, dryRun) {
  const existing = allProducts.find(
    (p) => p.metadata && p.metadata.lm_plan === planId && p.active !== false
  ) || allProducts.find(
    (p) => p.metadata && p.metadata.lm_plan === planId
  );

  if (existing) {
    console.log(`[produkt] Istnieje: ${existing.id} (${existing.name}, metadata.lm_plan=${planId})`);
    return existing.id;
  }

  const name = PRODUCT_NAMES[planId];
  if (dryRun) {
    console.log(`[dry-run] Utworzono by produkt: ${name} (metadata.lm_plan=${planId})`);
    return `prod_dryrun_${planId}`;
  }

  const created = await stripeRequest(apiKey, "POST", "/v1/products", {
    name,
    metadata: { lm_plan: planId },
  });
  console.log(`[produkt] Utworzono: ${created.id} (${created.name}, metadata.lm_plan=${planId})`);
  return created.id;
}

/** Krok 2: Wyszukuje lub tworzy cenę w 7 walutach. Sprawdza niezmienność kwoty. */
export async function ensurePrice(apiKey, plan, productId, currencies, dryRun) {
  const lookupKey = `liczmat_pro_${plan.id}`;
  const res = await stripeRequest(
    apiKey,
    "GET",
    `/v1/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&limit=10`
  );
  const prices = res.data || [];
  const found = prices.find((p) => p.active !== false) || prices[0];
  const expectedPln = plan.price.PLN;

  if (found) {
    if (found.unit_amount !== expectedPln) {
      console.error(
        `OSTRZEŻENIE: Cena "${lookupKey}" (${found.id}) w Stripe ma inną kwotę (${found.unit_amount} gr PLN) niż assets/pay.js (${expectedPln} gr PLN).`
      );
      console.error("Ceny w Stripe są NIEZMIENNE (immutable) — nie wolno modyfikować istniejącej kwoty.");
      console.error(
        "Aby zmienić cenę, zdeaktywuj starą cenę w Stripe lub użyj nowego lookup_key / utwórz nową cenę."
      );
      process.exit(1);
    }
    console.log(`[cena] Istnieje: ${found.id} (lookup_key=${lookupKey}, PLN ${expectedPln / 100})`);
    return found.id;
  }

  const interval = INTERVALS[plan.id];
  if (dryRun) {
    console.log(
      `[dry-run] Utworzono by cenę dla ${productId}: lookup_key=${lookupKey}, PLN ${expectedPln / 100}/${interval} (+ 6 walut)`
    );
    return `price_dryrun_${plan.id}`;
  }

  const currencyOptions = {};
  for (const code of currencies) {
    if (code.toUpperCase() === "PLN") continue;
    currencyOptions[code.toLowerCase()] = {
      unit_amount: plan.price[code],
    };
  }

  const created = await stripeRequest(apiKey, "POST", "/v1/prices", {
    product: productId,
    currency: "pln",
    unit_amount: expectedPln,
    recurring: { interval },
    lookup_key: lookupKey,
    currency_options: currencyOptions,
  });

  console.log(`[cena] Utworzono: ${created.id} (lookup_key=${lookupKey}, PLN ${expectedPln / 100}/${interval})`);
  return created.id;
}

/** Pobiera listę wszystkich Payment Linków (z obsługą paginacji). */
export async function getAllPaymentLinks(apiKey) {
  const links = [];
  let startingAfter = null;
  while (true) {
    const query = new URLSearchParams({ limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const res = await stripeRequest(apiKey, "GET", `/v1/payment_links?${query.toString()}`);
    if (res.data) links.push(...res.data);
    if (!res.has_more || !res.data || res.data.length === 0) break;
    startingAfter = res.data[res.data.length - 1].id;
  }
  return links;
}

/** Pobiera pozycje (line items) przypisane do danego Payment Linka. */
export async function getPaymentLinkLineItems(apiKey, linkId) {
  const res = await stripeRequest(
    apiKey,
    "GET",
    `/v1/payment_links/${encodeURIComponent(linkId)}/line_items?limit=10`
  );
  return res.data || [];
}

/** Sprawdza, czy pozycja koszyka odnosi się do żądanego priceId. */
export function lineItemMatchesPrice(item, priceId) {
  if (!item) return false;
  const p = item.price;
  const id = typeof p === "object" && p !== null ? p.id : p;
  return id === priceId;
}

/** Krok 3: Wyszukuje aktywny Payment Link dla danej ceny lub tworzy nowy. */
export async function ensurePaymentLink(apiKey, planId, priceId, allLinks, dryRun) {
  const activeLinks = allLinks.filter((l) => l.active !== false);

  for (const link of activeLinks) {
    let items = (link.line_items && Array.isArray(link.line_items.data)) ? link.line_items.data : null;
    if (!items || items.length === 0) {
      items = await getPaymentLinkLineItems(apiKey, link.id);
    }
    if (items.length === 1 && lineItemMatchesPrice(items[0], priceId)) {
      console.log(`[link] Istnieje: ${link.id} (${link.url}) dla ceny ${priceId}`);
      return link.url;
    }
  }

  if (dryRun) {
    console.log(`[dry-run] Utworzono by Payment Link dla ceny: ${priceId}`);
    return `https://buy.stripe.com/dryrun_${planId}`;
  }

  /* Po zapłacie wracamy na stronę konta, a nie na stronę potwierdzenia Stripe'a.
     Powód jest konkretny: plan bywa nadany z opóźnieniem (zdarzenia Stripe'a nie
     przychodzą po kolei — zmierzone 2026-09-11), a tylko `/app/` potrafi powiedzieć
     „płatność w toku" i sama zgasić ten komunikat, gdy webhook dopisze plan. */
  const created = await stripeRequest(apiKey, "POST", "/v1/payment_links", {
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    after_completion: {
      type: "redirect",
      redirect: { url: "https://liczmat.com/app/" },
    },
  });

  console.log(`[link] Utworzono: ${created.id} (${created.url}) dla ceny ${priceId}`);
  return created.url;
}

/* ------------------------------------------------------------------ punkt wejścia CLI */

export async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    console.error(`${err.message}\n\n${USAGE}`);
    return 2;
  }

  if (parsed.help) {
    console.log(USAGE);
    return 0;
  }

  const { mode, dryRun } = parsed;
  const apiKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  const keyError = checkKey(mode, apiKey);
  if (keyError) {
    console.error(keyError);
    return 1;
  }

  const payJsPath = join(ROOT, "assets", "pay.js");
  let payConfig;
  try {
    payConfig = loadPayConfig(payJsPath);
  } catch (err) {
    console.error(`Błąd konfiguracji pay.js: ${err.message}`);
    return 1;
  }

  const modeLabel = mode === "sandbox" ? "SANDBOX (tryb testowy)" : "LIVE (tryb produkcyjny)";
  console.log(`Uruchamianie konfiguracji Stripe w trybie: ${modeLabel}${dryRun ? " [DRY-RUN]" : ""}`);

  const allProducts = await getAllProducts(apiKey);
  const allLinks = await getAllPaymentLinks(apiKey);

  const productIds = {};
  const priceIds = {};
  const paymentLinks = {};

  for (const planId of ["monthly", "yearly"]) {
    const plan = payConfig.plans.find((p) => p.id === planId);
    console.log(`\n--- Plan: ${planId} ---`);

    // Krok 1: Produkt
    const prodId = await ensureProduct(apiKey, planId, allProducts, dryRun);
    productIds[planId] = prodId;

    // Krok 2: Cena cykliczna (PLN jako baza + 6 pozostałych walut)
    const prId = await ensurePrice(apiKey, plan, prodId, payConfig.currencies, dryRun);
    priceIds[planId] = prId;

    // Krok 3: Payment Link
    const linkUrl = await ensurePaymentLink(apiKey, planId, prId, allLinks, dryRun);
    paymentLinks[planId] = linkUrl;
  }

  // Czytelne podsumowanie gotowe do skopiowania
  console.log("\nSTRIPE_PRICE_IDS=" + productIds.monthly + "," + productIds.yearly);
  console.log("");
  console.log("monthly: " + paymentLinks.monthly);
  console.log("yearly:  " + paymentLinks.yearly);
  console.log("(Powyższe adresy Payment Links wklejamy do assets/pay.js tylko po uruchomieniu produkcyjnym --live)");
  console.log("");
  console.log("Przypomnienie: adres Customer Portalu (https://billing.stripe.com/p/login/...)");
  console.log("należy skopiować ręcznie z panelu Stripe (Settings -> Billing -> Customer portal),");
  console.log("ponieważ API Stripe nie udostępnia stałego adresu logowania portalu.");

  return 0;
}

/* Uruchamiane jako polecenie; importowane przez testy jako moduł.
 *
 * Adres pliku buduje `pathToFileURL()`, a nie sklejenie `"file://" + ścieżka`. Sklejenie
 * działa na Linuksie i milczy na Windowsie: `process.argv[1]` to tam
 * `C:\\Users\\ktos\\...\\stripe-setup.mjs`, a `import.meta.url` —
 * `file:///C:/Users/ktos/.../stripe-setup.mjs`. Porównanie wychodzi fałszywe, `main()` się
 * nie uruchamia, a polecenie kończy się bez jednego znaku na ekranie i z kodem 0.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
