/**
 * LiczMat — webhook Stripe'a: jedyna rzecz na świecie, która nadaje plan po zapłacie.
 *
 * Plan naprawczy, sesja 38, i krok 4 z noty ORDER na dole `assets/pay.js`.
 * `users/{uid}.plan` jest polem serwerowym — wdrożone reguły pozwalają przeglądarce
 * zapisać w profilu wyłącznie `lastSeenAt` i `appVersion` — więc płatność musi trafić do
 * czegoś, co ma prawa administratora. Tym czymś jest ta funkcja.
 *
 * ─── DLACZEGO WŁASNA FUNKCJA, A NIE ROZSZERZENIE ────────────────────────────
 * Rozszerzenie „Run Payments with Stripe" jest zbudowane wokół sesji Checkout tworzonych
 * z Firestore przez zalogowaną przeglądarkę. `assets/pay.js` jest zbudowany wokół
 * **Payment Linków** z `client_reference_id` — bo strona jest statyczna, nie ma serwera i
 * to jedyny sposób, w jaki potrafi powiedzieć, czyje to konto. Zaginanie rozszerzenia do
 * tego modelu byłoby dłuższe niż ten plik i dokładałoby trzy kolekcje, których kontrakt
 * synchronizacji nie zna.
 *
 * ─── CO TO ZAPISUJE ─────────────────────────────────────────────────────────
 * `users/{uid}`: `plan`, `planValidUntil`, `planRenews`. Przez `set(..., { merge: true })`,
 * więc `createdAt` i `lastSeenAt` zostają nietknięte — ten sam powód, dla którego
 * `scripts/pro-admin.mjs` używa `updateMask`.
 *
 * `stripeSubscriptions/{subscriptionId}`: `{ customerId, uid, ours, lastEventCreated,
 * lastEventIds, terminal, updatedAt }` — pamięć tego, co już zastosowaliśmy. Bez niej
 * spóźnione zdarzenie Stripe'a przywracało plan odebrany po zwrocie pieniędzy (znalezisko
 * H2 audytu 2026-09), a ponowienie po naszym błędzie zapisu liczyło się drugi raz.
 *
 * `stripeCustomers/{customerId}`: `{ uid, email, activeSubscriptionId, updatedAt }`.
 * `activeSubscriptionId` to ostatnia subskrypcja, która nadała temu klientowi plan — po
 * to, żeby zamknięcie starej subskrypcji nie odebrało Pro opłaconego nową. Obie kolekcje są poza
 * kontraktem synchronizacji — telefon ich nie czyta, `wsExport()` ich nie niesie. Reguły
 * Firestore nie mają dla nich dopasowania, a Firestore domyślnie odmawia, więc żadna
 * przeglądarka ich nie odczyta. Powód istnienia `stripeCustomers` jest w komentarzu przy
 * `decide()` w functions/stripe-map.mjs: adres konta przychodzi w jednym zdarzeniu, a
 * daty subskrypcji w innym.
 *
 * ─── SEKRET ─────────────────────────────────────────────────────────────────
 * Jeden: `STRIPE_WEBHOOK_SECRET`, w Secret Managerze, nigdy w repozytorium. Klucz API
 * Stripe'a **nie jest tu potrzebny** — ta funkcja niczego u Stripe'a nie pyta, tylko
 * czyta to, co Stripe sam przysłał i podpisał.
 *
 *     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 *     firebase deploy --only functions
 *
 * Cała logika decyzyjna siedzi w functions/stripe-map.mjs i jest sprawdzana przez
 * `node scripts/test-webhook-map.mjs` — bez chmury, bez npm i bez konta Stripe.
 *
 * ─── DRUGA FUNKCJA W TYM PLIKU ──────────────────────────────────────────────
 * Sesja 49 dołożyła `adminPlan` na dole: ten sam zapis trzech pól planu, tyle że zlecony
 * ręcznie z panelu w przeglądarce, a nie przez zapłatę. Obie funkcje wdrażają się razem
 * (`firebase deploy --only functions`) i obie piszą przez `{ merge: true }`. Jej czysta
 * połowa to functions/admin-map.mjs, sprawdzana przez `node scripts/test-admin-map.mjs`.
 */

import { createHmac } from "node:crypto";

import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import {
  DELETE_FIELD, PLAN_FREE, acceptEvent, decide, verifyStripeSignature,
} from "./stripe-map.mjs";
import {
  LIST_LIMIT, accountRow, grantWrite, isAdmin, parseRequest, planSummary, revokeWrite,
} from "./admin-map.mjs";
import { looksLikeTicket, mintTicket, readTicket } from "./pay-ticket.mjs";
import { TRIAL_DAYS, trialDecision, trialGrantDoc } from "./trial-map.mjs";

const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

/**
 * Sekret biletu do kasy — nasz własny, nie Stripe'a. Znalezisko M1 audytu 2026-09.
 *
 * Podpisuje `client_reference_id`, czyli jedyne miejsce, w którym przeglądarka mówi, czyja
 * jest płatność. Dlaczego w ogóle jest podpisywane, opisuje `functions/pay-ticket.mjs`.
 *
 *     firebase functions:secrets:set PAY_TICKET_SECRET      # dowolny długi losowy napis
 *
 * Do czasu wpisania sekretu `payTicket` odmawia wystawienia biletu, a `/app/` idzie do
 * kasy bez niego — płatność przypisuje się wtedy adresem e-mail z Stripe'a, tak jak
 * przypisywała się dotąd każda płatność bez `client_reference_id`.
 */
const PAY_TICKET_SECRET = defineSecret("PAY_TICKET_SECRET");

/**
 * Które subskrypcje są LiczMat Pro i z którego konta Stripe'a. Znaleziska H1 i H2.
 *
 * Nie sekrety — Price ID widać w adresie kasy — tylko konfiguracja wdrożenia, więc zwykłe
 * parametry z `functions/.env`, a nie Secret Manager:
 *
 *     STRIPE_PRICE_IDS=price_…,price_…      # albo prod_…, jeśli ma objąć wszystkie ceny produktu
 *     STRIPE_LIVE_MODE=true                 # false tylko na czas przebiegu w piaskownicy
 *
 * Domyślnie lista jest **pusta**, a pusta lista nie nadaje Pro nikomu. Funkcja wdrożona
 * przed wpisaniem identyfikatorów nic nie zepsuje: pokwituje zdarzenia i nie tknie planu.
 */
const STRIPE_PRICE_IDS = defineString("STRIPE_PRICE_IDS", { default: "" });
const STRIPE_LIVE_MODE = defineString("STRIPE_LIVE_MODE", { default: "true" });

const stripeConfig = () => ({
  allowedIds: STRIPE_PRICE_IDS.value(),
  liveMode: STRIPE_LIVE_MODE.value() !== "false",
});

initializeApp();

/** Ten sam region, w którym stoi Firestore (europe-central2, Warszawa). */
const REGION = "europe-central2";

const hmacSha256 = (secret, payload) =>
  createHmac("sha256", secret).update(payload, "utf8").digest("hex");

/**
 * Sekret biletu, a pusty napis, gdy go nie ma.
 *
 * `firebase deploy` odmawia wdrożenia funkcji, która wskazuje na nieistniejący sekret, więc
 * tego stanu w produkcji być nie powinno. Ale gdyby był, to wywołanie stoi w webhooku:
 * wyjątek tutaj zamieniłby brak konfiguracji w piątkę na **każdą** płatność, czyli sklep,
 * który nie przyjmuje pieniędzy. Pusty sekret przechodzi przez `readTicket()` jako „żaden
 * bilet nie jest ważny", a to znaczy tylko tyle, że płatność przypisze się adresem e-mail.
 */
const payTicketSecret = () => {
  try {
    return PAY_TICKET_SECRET.value() || "";
  } catch (e) {
    logger.warn("kasa: PAY_TICKET_SECRET nieczytelny, bilety nieważne");
    return "";
  }
};

/** `{ pole: DELETE_FIELD }` → skasowanie pola, resztę zostawiamy jak jest. */
const toFirestore = (write) => {
  const out = {};
  for (const [key, value] of Object.entries(write)) {
    out[key] = value === DELETE_FIELD ? FieldValue.delete() : value;
  }
  return out;
};

export const stripeWebhook = onRequest(
  {
    region: REGION,
    secrets: [STRIPE_WEBHOOK_SECRET, PAY_TICKET_SECRET],
    cors: false,
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("POST only");
      return;
    }

    /* Podpis liczy się z SUROWEGO ciała. `req.body` jest już sparsowany przez środowisko,
       a przepuszczenie go przez JSON.stringify daje inne bajty i inny podpis. */
    const raw = req.rawBody;
    const verdict = verifyStripeSignature(raw, req.get("stripe-signature"),
      STRIPE_WEBHOOK_SECRET.value(), { hmac: hmacSha256 });
    if (!verdict.ok) {
      // 400, nie 500: to nie jest awaria do ponowienia, tylko żądanie, którego nie
      // podpisał Stripe. Powód idzie do logu, nie do odpowiedzi.
      logger.warn("stripe: odrzucony podpis", { reason: verdict.reason });
      res.status(400).send("bad signature");
      return;
    }

    let event;
    try {
      event = JSON.parse(raw.toString("utf8"));
    } catch (e) {
      res.status(400).send("bad json");
      return;
    }

    const intent = decide(event, stripeConfig());
    const db = getFirestore();

    try {
      if (intent.action === "ignore") {
        /* Dwa powody wyglądają z zewnątrz jak awaria i mają zostawić ślad: zdarzenie z
           cudzego produktu (H1) i zdarzenie z drugiego trybu konta. Reszta — obce typy
           zdarzeń — jest szumem i milczy. */
        if (intent.reason === "offer" || intent.reason === "livemode") {
          logger.warn("stripe: zdarzenie spoza sprzedaży LiczMat Pro", {
            type: intent.type, reason: intent.reason,
          });
        }
        res.status(200).send("ignored");
        return;
      }

      if (intent.action === "link") {
        const uid = await resolveUid(intent);
        if (!uid) {
          /* Zapłata, której nie da się przypisać do konta. Ponawianie nic nie da — uid
             ani adres nie zaczną nagle istnieć — więc kwitujemy i zostawiamy głośny ślad.
             Właściciel naprawia to ręcznie: scripts/pro-admin.mjs grant <adres>. */
          logger.error("stripe: zapłata bez konta, do nadania ręcznie", {
            type: intent.type, customerId: intent.customerId,
            clientReferenceId: intent.uid, email: intent.email,
          });
          res.status(200).send("unattributed");
          return;
        }
        await db.collection("stripeCustomers").doc(intent.customerId)
          .set({ uid, email: intent.email || null, updatedAt: Date.now() }, { merge: true });
        logger.info("stripe: klient powiązany z kontem", { customerId: intent.customerId, uid });
        res.status(200).send("linked");
        return;
      }

      /* intent.action === "plan"

         Wszystko w jednej transakcji, bo trzy odczyty i do trzech zapisów muszą widzieć
         ten sam stan: czyj to klient, co już zastosowaliśmy, co konto ma teraz, i co z
         tego wynika dla planu. Firestore wymaga wszystkich odczytów **przed** pierwszym
         zapisem. */
      const customerRef = db.collection("stripeCustomers").doc(intent.customerId);
      const subRef = db.collection("stripeSubscriptions")
        .doc(intent.subscriptionId || `cus_${intent.customerId}`);

      const outcome = await db.runTransaction(async (tx) => {
        const link = await tx.get(customerRef);
        const seen = await tx.get(subRef);

        const uid = link.exists ? link.get("uid") : null;
        if (!uid) return { retry: true };

        const userRef = db.collection("users").doc(uid);
        const profile = await tx.get(userRef);
        const known = seen.exists ? seen.data() : null;

        /* Skasowana subskrypcja bez ani jednej pozycji: sam obiekt nie mówi, czy była
           nasza, więc pyta się o to zapis, który ta funkcja sama wcześniej zrobiła.
           Nieznana — nie nasza, a cudzy produkt nie odbiera Pro. */
        if (intent.match === "unknown" && !(known && known.ours === true)) {
          return { skipped: "unknown-offer" };
        }

        /* Kto przeszedł z miesięcznego na roczny, ma przez chwilę dwie subskrypcje: nową
           czynną i starą, którą Stripe zamyka osobnym zdarzeniem. Kolejność pilnujemy per
           subskrypcja — bo tylko subskrypcja ma własną oś czasu — a plan jest jeden na
           konto. Bez tej bramki zdarzenie starszej subskrypcji przestawiałoby plan
           opłacony nowszą: zamknięcie odbierałoby Pro, a spóźniona zmiana skracała datę
           ważności do końca starego okresu.

           Rozstrzyga data, nie kolejność dostarczenia: cudza subskrypcja przejmuje plan
           tylko wtedy, gdy jest opłacony **dłużej** niż to, co konto już ma. Ostatnia,
           która wygrała, stoi przy powiązaniu klienta. */
        const takesAway = intent.write.plan === PLAN_FREE;
        const granted = link.get("activeSubscriptionId") || null;
        const another = Boolean(granted && intent.subscriptionId && granted !== intent.subscriptionId);
        if (another) {
          const hasUntil = Number(profile.exists ? profile.get("planValidUntil") : undefined);
          const wantsUntil = Number(intent.write.planValidUntil);
          if (takesAway || (Number.isFinite(hasUntil) && !(wantsUntil > hasUntil))) {
            return { skipped: "superseded" };
          }
        }

        const verdict = acceptEvent(known, intent.stamp);
        if (!verdict.ok) return { skipped: verdict.reason };

        const mark = {
          ...verdict.next,
          customerId: intent.customerId,
          uid,
          ours: true,
          updatedAt: Date.now(),
        };
        /* Dokument skończonej subskrypcji nie jest już nikomu potrzebny — poza tym, żeby
           spóźnione zdarzenie nie wskrzesiło planu. Czternaście miesięcy z zapasem nad
           najdłuższym okresem rozliczeniowym (rok), kasowane samo przez politykę TTL
           Firestore'a założoną na polu `expiresAt`; bez polityki zostaje na zawsze i
           kosztuje tyle, co jeden dokument. */
        if (intent.stamp.terminal) {
          mark.expiresAt = new Date(Date.now() + 425 * 24 * 60 * 60 * 1000);
        }

        tx.set(subRef, mark, { merge: true });
        if (!takesAway && intent.subscriptionId) {
          tx.set(customerRef,
            { activeSubscriptionId: intent.subscriptionId, updatedAt: Date.now() },
            { merge: true });
        }
        tx.set(userRef, toFirestore(intent.write), { merge: true });
        return { uid };
      });

      if (outcome.retry) {
        /* Zdarzenie subskrypcji wyprzedziło sesję Checkout — Stripe nie obiecuje
           kolejności. 503 każe mu ponowić; przez kilka dni, z rosnącą przerwą. Do tego
           czasu sesja zdąży dojść i powiązanie będzie istniało. */
        logger.warn("stripe: nie znam jeszcze tego klienta, proszę o ponowienie", {
          type: intent.type, customerId: intent.customerId,
        });
        res.status(503).send("customer not linked yet");
        return;
      }

      if (outcome.skipped) {
        /* 200, nie 503: ponowienie nic tu nie zmieni. Duplikat, zdarzenie starsze niż
           ostatnie zastosowane albo zdarzenie po końcu subskrypcji — każde z nich jest
           obsłużone przez to, że nic nie zapisujemy (H2). */
        logger.info("stripe: zdarzenie pominięte", {
          type: intent.type, reason: outcome.skipped,
          eventId: intent.stamp.id, subscriptionId: intent.subscriptionId,
        });
        res.status(200).send(outcome.skipped);
        return;
      }

      logger.info("stripe: plan zapisany", {
        type: intent.type, uid: outcome.uid, plan: intent.write.plan,
      });
      res.status(200).send("ok");
    } catch (err) {
      // Awaria po naszej stronie. 500 — Stripe ponowi.
      logger.error("stripe: zapis nie przeszedł", { type: intent.type, message: err.message });
      res.status(500).send("write failed");
    }
  },
);

/**
 * Czyje to konto: najpierw bilet z `client_reference_id`, potem adres z sesji.
 *
 * `client_reference_id` przychodzi z adresu URL, więc **wpisać może tam każdy cokolwiek**.
 * Do 2026-09-09 stał tam goły uid, a jedyną kontrolą było „czy takie konto istnieje" —
 * czyli podmiana parametru nadawała Pro wybranemu cudzemu kontu i wiązała z nim przyszłe
 * zdarzenia Stripe'a (znalezisko M1 audytu 2026-09). Dziś stoi tam bilet, który ta sama
 * funkcja wystawiła zalogowanemu konciu na jego własny uid, i uid bierze się wyłącznie
 * z podpisu — goły uid nie znaczy już nic.
 *
 * Konto z biletu i tak sprawdzamy w Firebase Auth: podpis mówi, że wartość jest nasza, ale
 * nie mówi, że konto nadal istnieje. Zapisanie planu pod skasowanym uidem zrobiłoby
 * dokument profilu dla konta, którego nie ma.
 *
 * Adres e-mail zostaje jako druga droga i nie jest luką: przychodzi z zapłaconej sesji
 * Stripe'a, nie z URL-a, a jedyne, co można nim zrobić, to kupić komuś Pro za swoje.
 */
async function resolveUid(intent) {
  const auth = getAuth();
  const ticketUid = readTicket(intent.uid, payTicketSecret());
  if (intent.uid && !ticketUid) {
    logger.warn("stripe: client_reference_id bez ważnego biletu, idziemy adresem", {
      shape: looksLikeTicket(intent.uid) ? "bilet-nieważny" : "goły-uid",
    });
  }
  if (ticketUid) {
    try {
      const user = await auth.getUser(ticketUid);
      return user.uid;
    } catch (e) {
      logger.warn("stripe: bilet wskazuje na konto, którego już nie ma", { uid: ticketUid });
    }
  }
  if (intent.email) {
    try {
      const user = await auth.getUserByEmail(intent.email);
      return user.uid;
    } catch (e) {
      logger.warn("stripe: adres z sesji nie ma konta", { email: intent.email });
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Bilet do kasy — podpisany dowód, czyja jest płatność (znalezisko M1)
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Bilet dla konta, które właśnie idzie do kasy.
 *
 * Wystawiany **wyłącznie zalogowanemu i wyłącznie na jego własny uid** — `request.auth.uid`
 * przychodzi z tokenu, który zweryfikowało Google, a nie z ciała żądania, więc nie ma tu
 * czego podmienić. Ciało żądania jest w ogóle nieczytane; ta funkcja nie przyjmuje żadnych
 * danych wejściowych i to jest cała jej odporność.
 *
 * Po co, skoro uid i tak jest w przeglądarce: bo w URL-u Payment Linka uid jest tekstem,
 * który każdy może przepisać na cudzy (M1). Bilet jest tym samym uidem, tyle że podpisanym
 * — patrz `functions/pay-ticket.mjs`.
 *
 * `failed-precondition` zamiast `internal`, gdy sekretu nie ma: to nie awaria, tylko
 * wdrożenie bez `PAY_TICKET_SECRET`, a `/app/` ma wtedy pójść do kasy bez biletu zamiast
 * pokazać błąd. Płatność przypisze się adresem e-mail, jak każda bez `client_reference_id`.
 */
export const payTicket = onCall(
  {
    region: REGION,
    maxInstances: 5,
    secrets: [PAY_TICKET_SECRET],
    cors: ["https://liczmat.com", "https://www.liczmat.com", /^http:\/\/localhost(:\d+)?$/],
  },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "sign-in-required");
    }
    const ticket = mintTicket(request.auth.uid, payTicketSecret());
    if (!ticket) {
      logger.warn("kasa: brak PAY_TICKET_SECRET, bilet niewystawiony");
      throw new HttpsError("failed-precondition", "no-ticket-secret");
    }
    return { ticket };
  },
);

/* ══════════════════════════════════════════════════════════════════════════
   Panel administratora — plan po adresie e-mail, z przeglądarki (sesja 49)
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Nadanie i odebranie LiczMat Pro klikaniem, bez terminala i bez klucza na dysku.
 *
 * `users/{uid}.plan` jest polem serwerowym — wdrożone reguły pozwalają przeglądarce
 * zapisać w profilu wyłącznie `lastSeenAt` i `appVersion` — więc panel w przeglądarce nie
 * może zapisać planu i nie próbuje. Zapisuje to: kod, który biegnie po stronie Google,
 * z prawami administratora, i sprawdza, kto pyta, zanim cokolwiek zrobi.
 *
 * ─── DLACZEGO `onCall`, A NIE `onRequest` ───────────────────────────────────
 * Webhook wyżej musi być `onRequest`, bo to Stripe wybiera kształt żądania i sam je
 * podpisuje. Tu po drugiej stronie jest nasza własna strona, więc `onCall` załatwia trzy
 * rzeczy, które inaczej trzeba by napisać ręcznie i w każdej z nich się pomylić:
 * weryfikację tokenu Firebase, CORS i kształt odpowiedzi. Token jest zweryfikowany
 * **zanim** ta funkcja się zacznie — `request.auth` istnieje tylko wtedy, gdy podpis się
 * zgadzał i token nie wygasł.
 *
 * ─── GRANICA BEZPIECZEŃSTWA JEST TUTAJ, NIE W PRZEGLĄDARCE ──────────────────
 * `assets/admin.js` pokazuje panel, gdy w tokenie widzi `admin: true`. To jest wygoda,
 * nie zamek: kto podmieni sobie tę wartość w przeglądarce, zobaczy panel i dostanie z
 * niego `permission-denied` na każde kliknięcie. Jedynym sprawdzeniem, które cokolwiek
 * znaczy, jest `isAdmin(request.auth.token)` niżej — claim jest częścią podpisanego
 * tokenu, więc przeglądarka nie ma jak go sobie dopisać.
 *
 * ─── ŚLAD ───────────────────────────────────────────────────────────────────
 * Każdy zapis idzie do logu z uidem tego, kto go zlecił, i tego, kogo dotyczył. Nie ma
 * kolekcji „audyt" i nie ma jej celowo: byłby to drugi dom dla faktu, który już stoi w
 * dokumencie profilu, a log w Cloud Logging jest miejscem, którego przeglądarka nie
 * czyta i nie kasuje.
 */
export const adminPlan = onCall(
  {
    region: REGION,
    maxInstances: 5,
    // Tylko własna strona i lokalny podgląd. Callable domyślnie przepuszcza każdy adres;
    // panel administratora nie ma powodu odpowiadać cudzej stronie.
    cors: ["https://liczmat.com", "https://www.liczmat.com", /^http:\/\/localhost(:\d+)?$/],
  },
  async (request) => {
    if (!request.auth || !isAdmin(request.auth.token)) {
      // Ten sam błąd dla niezalogowanego i dla zalogowanego bez uprawnienia: odpowiedź,
      // która je rozróżnia, mówi obcemu, że pod tym adresem jest coś do zdobycia.
      logger.warn("admin: odmowa", { uid: (request.auth && request.auth.uid) || null });
      throw new HttpsError("permission-denied", "not-admin");
    }

    const parsed = parseRequest(request.data);
    if (parsed.error) throw new HttpsError("invalid-argument", parsed.error);

    const auth = getAuth();
    const db = getFirestore();
    const now = Date.now();
    const by = request.auth.uid;

    if (parsed.action === "list") {
      const page = await auth.listUsers(LIST_LIMIT);
      const users = page.users.map((u) => ({
        uid: u.uid, email: u.email || "", admin: isAdmin(u.customClaims),
      }));
      // Jedno zapytanie zamiast jednego na konto. `getAll()` rzuca, gdy nie dostanie ani
      // jednej referencji, więc pusty projekt kończy się tutaj.
      const profiles = users.length
        ? await db.getAll(...users.map((u) => db.collection("users").doc(u.uid)))
        : [];
      const accounts = users.map((u, i) => accountRow(u, profiles[i] && profiles[i].data(), now));
      accounts.sort((a, b) => a.email.localeCompare(b.email));
      return { ok: true, action: "list", accounts, more: Boolean(page.pageToken) };
    }

    const user = await findUser(auth, parsed.email);
    if (!user) throw new HttpsError("not-found", "no-account");

    if (parsed.action === "status") {
      const snap = await db.collection("users").doc(user.uid).get();
      return {
        ok: true, action: "status",
        account: accountRow(user, snap.exists ? snap.data() : null, now),
      };
    }

    const write = parsed.action === "grant" ? grantWrite(parsed.months, now) : revokeWrite();
    if (!write) throw new HttpsError("invalid-argument", "bad-months");

    /* `{ merge: true }` z tego samego powodu, dla którego scripts/pro-admin.mjs używa
       maski: bez tego zapis zastąpiłby dokument w całości i skasował `createdAt` oraz
       `lastSeenAt`, czyli datę założenia konta, której nikt już potem nie odtworzy. */
    await db.collection("users").doc(user.uid).set(toFirestore(write), { merge: true });
    logger.info("admin: plan zmieniony", {
      by, uid: user.uid, action: parsed.action, months: parsed.months || null,
    });

    const snap = await db.collection("users").doc(user.uid).get();
    return {
      ok: true, action: parsed.action,
      account: accountRow(user, snap.exists ? snap.data() : null, now),
    };
  },
);

/**
 * Konto po adresie e-mail — razem z uprawnieniem, które przy nim stoi.
 *
 * `null`, gdy konta nie ma. Brak konta nie jest awarią: to najczęstsza pomyłka przy
 * wpisywaniu adresu i panel ma o niej powiedzieć wprost, zamiast zakładać konto albo
 * zapisać plan „na przyszłość" pod adresem, którego nikt nie potwierdził.
 */
async function findUser(auth, email) {
  try {
    const user = await auth.getUserByEmail(email);
    return { uid: user.uid, email: user.email || email, admin: isAdmin(user.customClaims) };
  } catch (e) {
    if (e && e.code === "auth/user-not-found") return null;
    throw e;
  }
}

/* ------------------------------------------------------------------ okres próbny */

/**
 * Czternaście dni Pro dla każdego nowego konta.
 *
 * ─── DLACZEGO WYZWALACZ FIRESTORE, A NIE TRIGGER AUTH ───────────────────────
 * Profil `users/{uid}` zakłada klient — `assets/app.js` w przeglądarce i `CloudSync.kt`
 * w telefonie — i robi to raz, przy pierwszym zalogowaniu. Wyzwalacz na utworzeniu tego
 * dokumentu obsługuje więc obie drogi rejestracji jednym kawałkiem kodu i bez zmiany
 * czegokolwiek po stronie aplikacji. Blokująca funkcja `beforeUserCreated` wymagałaby
 * podniesienia Firebase Auth do Identity Platform, a jej błąd wywracałby **rejestrację**;
 * tutaj najgorsze, co się może stać, to konto bez okresu próbnego.
 *
 * `onDocumentCreated` nie odpala się przy aktualizacji, więc zapis, który ta funkcja sama
 * robi w tym samym dokumencie, nie wywoła jej drugi raz.
 *
 * ─── DLACZEGO OSOBNA KOLEKCJA `trialGrants` ─────────────────────────────────
 * `assets/app.js` pozwala skasować konto, a kasuje przy tym `users/{uid}`. Gdyby jedynym
 * śladem okresu próbnego był plan w profilu, wystarczyłoby skasować profil i wejść jeszcze
 * raz, żeby dostać kolejne czternaście dni — w kółko. `trialGrants/{uid}` zostaje po
 * skasowanym koncie i to on odpowiada na pytanie „czy ten uid już to dostał".
 * Reguły Firestore nie mają dla tej kolekcji dopasowania, a domyślnie odmawiają, więc
 * żadna przeglądarka jej nie przeczyta ani nie skasuje. Nowy adres e-mail to nowe konto
 * i nowy okres próbny — świadomie, bo pilnowanie adresów kosztowałoby drugą kolekcję
 * z hasłowanymi adresami i i tak nie zatrzymałoby nikogo zdeterminowanego.
 *
 * ─── CZEGO TO NIE ROBI ──────────────────────────────────────────────────────
 * Nie odbiera Pro po czternastu dniach i nie musi: `planValidUntil` jest datą, a
 * `lmLevelOf()` w assets/plan.js sam gasi Pro, gdy ta data minie. Nic nie chodzi po
 * kontach w tle.
 */
export const grantTrial = onDocumentCreated(
  { document: "users/{uid}", region: REGION, maxInstances: 10 },
  async (event) => {
    const uid = event.params.uid;
    const now = Date.now();

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const trialRef = db.collection("trialGrants").doc(uid);

    const outcome = await db.runTransaction(async (tx) => {
      /* Oba odczyty przed pierwszym zapisem — tego wymaga Firestore. Profil czytamy
         jeszcze raz, mimo że zdarzenie niesie jego treść: między utworzeniem dokumentu
         a tym wywołaniem webhook Stripe'a mógł już nadać plan opłacony, a okres próbny
         nigdy nie ma prawa skrócić ważności planu, za który ktoś zapłacił. */
      const [grant, profile] = await Promise.all([tx.get(trialRef), tx.get(userRef)]);

      const verdict = trialDecision(
        profile.exists ? profile.data() : null,
        grant.exists ? grant.data() : null,
        now,
      );
      if (!verdict.grant) return { skipped: verdict.reason };

      tx.set(userRef, toFirestore(verdict.write), { merge: true });
      tx.set(trialRef, trialGrantDoc(uid, now));
      return { until: verdict.until };
    });

    if (outcome.skipped) {
      logger.info("trial: pominięty", { uid, reason: outcome.skipped });
      return;
    }
    logger.info("trial: nadany", { uid, days: TRIAL_DAYS, until: outcome.until });
  },
);
