/* LiczMat website — the subscription: what LiczMat Pro costs, and where somebody pays.
 *
 * Master plan, session 28 (PŁATNOŚCI): "subskrypcja, status planu, obsługa aktywnego Pro,
 * obsługa anulowania, zabezpieczenie uprawnień". This file is the first of those five —
 * the plans, their prices and the two addresses Stripe gives us. The other four are
 * `assets/plan.js` (lmSubscription), `src/pro.mjs` (the panel and the wall) and
 * `assets/app.js` (the account page that draws them).
 *
 * Loaded after assets/plan.js, on the same pages: the five that offer a Pro feature. It
 * reads nothing from plan.js and plan.js reads nothing from here — this file answers
 * "what does it cost and where do I pay", never "who is this visitor".
 *
 * ─── WHAT IS AND IS NOT A SECRET HERE ───────────────────────────────────────
 * Nothing below is a credential. A Stripe Payment Link is a public URL — it is meant to
 * be put on a page, in a mail, in a QR code. The Customer Portal link is the same. What
 * protects the money is that **the price lives on the product in Stripe**, not in this
 * file: a visitor who edits `price` in their devtools changes the number this page
 * prints and changes nothing about what their card is charged. That is the intended
 * split, and it is why the checkout URL below carries no amount.
 *
 * ─── THE PRICES ARE TYPED IN, NOT CONVERTED ─────────────────────────────────
 * Seven currencies, fourteen amounts, all hand-written — and the same fourteen have to be
 * set on the products in Stripe. The euro rate was applied **once, when this file was
 * written**, rather than in the browser, for three reasons in this order:
 *
 *   1. Stripe charges the amount set on the product. A price computed from a live rate
 *      would disagree with what actually leaves the card at the checkout — the page would
 *      say one thing and the receipt another.
 *   2. A rate in the browser means a call to an exchange-rate API from a static site: a
 *      new network dependency, a new data recipient in the privacy policy, and a price
 *      free to change between being read and being clicked.
 *   3. This site converts nothing at a rate, anywhere (assets/currency.js).
 *
 * Rates used, all 2026-08-19 — EUR→USD 1.1605, EUR→PLN 4.3245, EUR→CZK 24.163,
 * EUR→RON 5.2464 (ECB via Frankfurter); EUR→UAH 51.8617, EUR→RSD 117.364 (open.er-api.com,
 * which the ECB set does not cover). Every price sits ~7.4% under the euro rate — the
 * discount the owner had already applied to the złoty (9.99 € × 4.3245 = 43.20 zł, priced
 * at 39.99 zł) — so the seven currencies are priced evenly against each other. The yearly
 * plan is ten times the monthly one in every currency: ~10 months for 12.
 *
 * Re-pricing means editing here AND in Stripe. Editing one of the two is the bug this
 * comment exists to prevent.
 */

/* ------------------------------------------------------------------ the configuration */

/**
 * The hosts a payment address may point at. A typo in the configuration must not be able
 * to send somebody off-site with their e-mail in the query string — the same rule
 * lmSafeNext() applies to `?next=`, for the same reason: a payment page that redirects
 * anywhere is a phishing link with a real domain on it.
 */
var LM_PAY_HOSTS = ["buy.stripe.com", "billing.stripe.com"];

/**
 * The subscription, as Stripe holds it.
 *
 * `link`  the Payment Link for this plan. **Empty until the owner has created the
 *         products and verified that paying actually grants the plan** — see the ORDER
 *         note at the bottom of this file. An empty link means no checkout button, and
 *         that is the point: a button that takes money for a plan nothing grants is the
 *         one failure worse than a locked module.
 * `price` minor units per currency — the integer Stripe itself uses. Every one of the
 *         seven currencies is a two-decimal currency at Stripe, so this is always ×100.
 * `key`   dictionary prefix: `<key>_t` names the plan, `<key>_per` the period.
 */
var LM_PAY = {
  /* Stripe Customer Portal — where a subscriber changes their card, downloads an invoice
     or cancels. Cancelling is Stripe's own screen on purpose: a "cancel" button here
     would have to write to Stripe, and this site has no server to write with. */
  portalUrl: "",

  plans: [
    {
      id: "monthly", key: "pay_monthly", link: "",
      price: { PLN: 3999, EUR: 999, USD: 1099, UAH: 47900, CZK: 22900, RON: 4999, RSD: 109900 },
    },
    {
      id: "yearly", key: "pay_yearly", link: "",
      price: { PLN: 39999, EUR: 9999, USD: 10999, UAH: 479900, CZK: 229000, RON: 49999, RSD: 1099000 },
    },
  ],
};

/* ------------------------------------------------------------------ reading it */

/** One plan by id, or null. An unknown id is never silently priced. */
function lmPayPlan(id) {
  for (var i = 0; i < LM_PAY.plans.length; i++) {
    if (LM_PAY.plans[i].id === String(id)) return LM_PAY.plans[i];
  }
  return null;
}

/**
 * What this plan costs in this currency, in minor units — or `null`.
 *
 * `null` means "no price in that currency", and the page shows no price at all. It never
 * means "convert from another one": a guessed price is a price that disagrees with the
 * checkout, which is the whole argument in the header.
 */
function lmPayPrice(planId, code) {
  var plan = typeof planId === "object" && planId ? planId : lmPayPlan(planId);
  if (!plan || !plan.price) return null;
  var amount = plan.price[String(code)];
  return typeof amount === "number" && isFinite(amount) && amount > 0 ? amount : null;
}

/**
 * Two thresholds, not one — because today the prices exist and the links do not.
 *
 * `lmPayPriced`  there is an amount in this currency → say what Pro costs.
 * `lmPayBuyable` there is an amount AND a working Payment Link → offer to take money.
 *
 * Splitting them is what lets the site be honest in the state it is actually in: it can
 * tell somebody the price while saying the subscription has not opened yet. Filling in
 * the links turns the buttons on with no other edit anywhere.
 */
function lmPayPriced(planId, code) {
  return lmPayPrice(planId, code) !== null;
}

function lmPayBuyable(planId, code) {
  var plan = typeof planId === "object" && planId ? planId : lmPayPlan(planId);
  return !!plan && lmPayPriced(plan, code) && lmPayUrlOk(plan.link);
}

/** Every plan with a price in this currency, in the order they are declared. */
function lmPayPlans(code) {
  return LM_PAY.plans.filter(function (p) { return lmPayPriced(p, code); });
}

/** Whether anything on this site can currently take money. */
function lmPayOpen(code) {
  return LM_PAY.plans.some(function (p) { return lmPayBuyable(p, code); });
}

/* ------------------------------------------------------------------ the addresses */

/**
 * Is this a payment address we are willing to send somebody to?
 *
 * https only, and a host on LM_PAY_HOSTS — matched as a whole host, never as a suffix,
 * because "buy.stripe.com.example.org" ends with the right letters and belongs to
 * somebody else.
 */
function lmPayUrlOk(url) {
  if (!url || typeof url !== "string") return false;
  var u;
  try { u = new URL(url); } catch (e) { return false; }
  return u.protocol === "https:" && LM_PAY_HOSTS.indexOf(u.hostname) !== -1;
}

/**
 * Where somebody goes to subscribe.
 *
 * The URL carries exactly two things beyond the link itself, and both are about *who*
 * rather than *what*:
 *   client_reference_id  the Firebase uid, so the webhook can find the account to grant
 *                        the plan to. Without it a payment arrives attached to nobody.
 *   prefilled_email      one less thing to type. Stripe ignores it if the link forbids it.
 *
 * **No price, no plan, no currency.** All three live on the product in Stripe, so a
 * tampered browser cannot buy LiczMat Pro for a złoty — it can only mis-draw its own page.
 *
 * @returns {string|null} null when the plan cannot be bought, so callers cannot
 *   accidentally render a checkout button pointing at "".
 */
function lmCheckoutUrl(planId, opts) {
  var plan = typeof planId === "object" && planId ? planId : lmPayPlan(planId);
  var o = opts || {};
  if (!plan || !lmPayUrlOk(plan.link)) return null;
  var u = new URL(plan.link);
  if (o.uid) u.searchParams.set("client_reference_id", String(o.uid));
  if (o.email) u.searchParams.set("prefilled_email", String(o.email));
  return u.toString();
}

/**
 * Where a subscriber manages or cancels. Null when it is not configured, which is what
 * keeps a dead "Zarządzaj subskrypcją" button off the account page.
 */
function lmPortalUrl() {
  return lmPayUrlOk(LM_PAY.portalUrl) ? LM_PAY.portalUrl : null;
}

/* ─── THE ORDER THE OWNER HAS TO WORK IN ─────────────────────────────────────
 * Nothing in this file makes a payment land. `users/{uid}.plan` is server-only and no
 * server writes it yet (FIRESTORE_SYNC §9.2), so the missing piece is not code here:
 *
 *   1. Stripe → two products with EXACTLY the fourteen amounts above, seven currencies each.
 *   2. Stripe → a Payment Link per product, and the Customer Portal switched on.
 *   3. Firebase console → install the "Run Payments with Stripe" extension. It is the
 *      server this site does not have: it takes the webhook and writes the subscription.
 *   4. A function mapping that subscription onto `users/{uid}.plan` ("premium"),
 *      `planValidUntil` (millis) and `planRenews` (boolean — see assets/plan.js).
 *   5. Pay once, on a real account, and check the account page turns Pro by itself.
 *   6. ONLY THEN paste the three URLs into LM_PAY above.
 *
 * A checkout button switched on before step 5 takes money for nothing.
 */
