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
 * `stripeCustomers/{customerId}`: `{ uid, email, updatedAt }`. To jedyna nowa kolekcja i
 * jest poza kontraktem synchronizacji — telefon jej nie czyta, `wsExport()` jej nie
 * niesie. Reguły Firestore nie mają dla niej dopasowania, a Firestore domyślnie odmawia,
 * więc żadna przeglądarka jej nie odczyta. Powód jej istnienia jest w komentarzu przy
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
 */

import { createHmac } from "node:crypto";

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { DELETE_FIELD, decide, verifyStripeSignature } from "./stripe-map.mjs";

const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

initializeApp();

/** Ten sam region, w którym stoi Firestore (europe-central2, Warszawa). */
const REGION = "europe-central2";

const hmacSha256 = (secret, payload) =>
  createHmac("sha256", secret).update(payload, "utf8").digest("hex");

/** `{ pole: DELETE_FIELD }` → skasowanie pola, resztę zostawiamy jak jest. */
const toFirestore = (write) => {
  const out = {};
  for (const [key, value] of Object.entries(write)) {
    out[key] = value === DELETE_FIELD ? FieldValue.delete() : value;
  }
  return out;
};

export const stripeWebhook = onRequest(
  { region: REGION, secrets: [STRIPE_WEBHOOK_SECRET], cors: false, maxInstances: 10 },
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

    const intent = decide(event);
    const db = getFirestore();

    try {
      if (intent.action === "ignore") {
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

      // intent.action === "plan"
      const link = await db.collection("stripeCustomers").doc(intent.customerId).get();
      const uid = link.exists ? link.get("uid") : null;
      if (!uid) {
        /* Zdarzenie subskrypcji wyprzedziło sesję Checkout — Stripe nie obiecuje
           kolejności. 503 każe mu ponowić; przez kilka dni, z rosnącą przerwą. Do tego
           czasu sesja zdąży dojść i powiązanie będzie istniało. */
        logger.warn("stripe: nie znam jeszcze tego klienta, proszę o ponowienie", {
          type: intent.type, customerId: intent.customerId,
        });
        res.status(503).send("customer not linked yet");
        return;
      }

      await db.collection("users").doc(uid).set(toFirestore(intent.write), { merge: true });
      logger.info("stripe: plan zapisany", {
        type: intent.type, uid, plan: intent.write.plan,
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
 * Czyje to konto: najpierw `client_reference_id` z Payment Linka, potem adres z sesji.
 *
 * Uid sprawdzamy w Firebase Auth zamiast wierzyć mu na słowo — `client_reference_id`
 * przychodzi z adresu URL, więc jest wartością, którą ktoś mógł podmienić. Zapisanie planu
 * pod nieistniejącym uidem zrobiłoby dokument profilu dla konta, którego nie ma.
 */
async function resolveUid(intent) {
  const auth = getAuth();
  if (intent.uid) {
    try {
      const user = await auth.getUser(intent.uid);
      return user.uid;
    } catch (e) {
      logger.warn("stripe: client_reference_id nie wskazuje na konto", { uid: intent.uid });
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
