/* LiczMat website — the paywall, drawn. One file for all five Pro modules.
 *
 * Master plan, session 27 (PAYWALL PRO): "blokady, komunikaty, prezentacja funkcji Pro,
 * przejście Free → Pro". The first of those is `assets/plan.js` — LM_PRO_LOCKED and
 * lmPaywall() decide; this file is the other three: it puts the decision on the screen
 * and says the right sentence for the rung the visitor is standing on.
 *
 * Session 28 changed what the "upgrade" rung says. It used to offer the Pro preview; it
 * now shows what LiczMat Pro costs, from `assets/pay.js`. The preview is gone — with a
 * price on the wall, a switch that opens the modules for free is the wall contradicting
 * itself. Money is never taken here: the checkout lives on /app/, which is the only page
 * that knows the uid a payment has to be attached to.
 *
 * It exists because sessions 22–25 wrote the same twenty lines four times — crmRenderPro,
 * jobRenderPro, quoRenderPro, calRenderPro, identical but for a three-letter prefix. Four
 * copies of a wall is four walls that can disagree about what is behind them, and the
 * paywall is the one place on this site where disagreeing is expensive.
 *
 * The markup it drives is written by src/pro.mjs at build time and is in the page from
 * the first paint, hidden. Nothing here creates an element: a paywall that appears only
 * once a script has run is a module that flashes open before it closes.
 *
 * Loaded after assets/plan.js and assets/pay.js, which load after assets/account.js — the
 * level comes from lmReadLevel(), the decision from lmPaywall() and the prices from
 * lmPayPlans(). None of the three is made here.
 */

/** t() when i18n-runtime is on the page, the key itself when it is not. */
const pwT = (key) => (typeof t === "function" ? t(key) : key);

/**
 * What this browser was last told about the session.
 *
 * `liczmat-signed-in` is a copy hint and can be stale (assets/account.js says so). It
 * still decides what the paywall shows, and that is the intended weight of it: the CRM
 * rows are `localStorage` on this device, in no sync contract, so the wall is a product
 * decision rather than a boundary. The boundary is the deployed Firestore rules, and they
 * are not asked here because nothing here writes to Firestore.
 */
const pwGuest = () => (typeof LM_LEVEL === "object" && LM_LEVEL ? LM_LEVEL.GUEST : "guest");

const pwLevel = () => (typeof lmReadLevel === "function" ? lmReadLevel() : pwGuest());

/**
 * The paywall's answer for one module, with a fallback that **closes**.
 *
 * Until 2026-09-03 the fallback opened: a page whose assets/plan.js failed to load showed
 * the module rather than a wall, on the argument that the rows belong to whoever is
 * sitting at this browser. That argument stopped holding when the owner put the PDF, the
 * quote and every price behind Pro. "The script that decides did not arrive, so let it
 * through" is a gate that anybody can open by making one file fail to load, and it is the
 * one shape of failure this file must not have. A missing decision is now a locked
 * module, and the visitor is told so by the same wall as everybody else.
 *
 * The rung is still the one the visitor is standing on where that is knowable:
 * lmReadLevel() lives in assets/account.js, which is on every page, so a page missing
 * only plan.js can still tell a guest from somebody signed in.
 */
function pwState(feature) {
  if (typeof lmPaywall === "function") return lmPaywall(feature, pwLevel());
  return {
    feature: null,
    open: false,
    locked: true,
    gated: true,
    step: pwLevel() === pwGuest() ? "account" : "upgrade",
  };
}

/**
 * May this browser use one feature? The one question a script asks before it computes a
 * price, builds a document or writes to a Pro store.
 *
 * It is the same decision the wall is drawn from, so a module can never be walled and
 * working at the same time. Every caller checks `typeof pwAllows === "function"` first
 * and treats a missing function as a refusal, for the reason pwState() closes: a gate
 * that opens when its own code is absent is not a gate.
 *
 * **This is not a security boundary**, and neither is anything else in this file — see
 * the note at the top of assets/plan.js. It decides what this page does, not what the
 * backend accepts.
 */
function pwAllows(feature) {
  return pwState(feature).open === true;
}

/**
 * Draw one page's paywall.
 *
 * @param {string} prefix  the id prefix the page's markup uses ("crm", "job", "quo", "cal")
 * @param {string} feature the LM_FEATURES id ("clients", "jobs", "quotes", "calendar")
 *
 * Four elements, all written by src/pro.mjs:
 *   #<prefix>-pro       the strip above the module: a chip and a sentence
 *   #<prefix>-pro-chip  which of the three things the chip says
 *   #<prefix>-gate      the wall, shown instead of the module
 *   #<prefix>-tool      the module
 */
function pwRender(prefix, feature) {
  const st = pwState(feature);
  const el = (suffix) => document.getElementById(prefix + suffix);

  /* The chip is the one line that says where this visitor stands. Since session 28 there
     are only two things it can say — the plan reaches this module, or it does not. */
  const chip = el("-pro-chip");
  if (chip) {
    chip.textContent = pwT(st.open ? "cli_pro_yours" : "pro_locked");
    chip.classList.toggle("on", st.open);
    chip.classList.remove("warn");
  }

  // The strip belongs above the module. When the wall is up the wall says all of it, and
  // a strip repeating "Dostępne w LiczMat Pro" over it is the same sentence twice.
  const strip = el("-pro");
  if (strip) strip.hidden = st.locked;

  const gate = el("-gate");
  const tool = el("-tool");
  if (gate) gate.hidden = !st.locked;
  if (tool) tool.hidden = st.locked;

  /* Chapter XXV's "przejście Free → Pro": one rung is shown, and it is the rung this
     visitor is on. A guest is not offered an upgrade they have no account to put it on,
     and somebody signed in is not sent to a sign-up form they already used. */
  if (gate) {
    const steps = gate.querySelectorAll("[data-pw-step]");
    for (let i = 0; i < steps.length; i++) {
      steps[i].hidden = steps[i].getAttribute("data-pw-step") !== st.step;
    }
    pwPrices(gate);
  }
}

/**
 * Write today's price onto each plan on the wall.
 *
 * The markup — both plans, their names and their periods — is written by proGate() at
 * build time. All this does is fill in the amount in the currency the visitor is reading
 * in, and hide a plan that has no price in it. Nothing is converted: a currency with no
 * amount configured shows no price rather than a guess (assets/pay.js says why).
 *
 * The checkout button is NOT here. Paying happens on /app/, where the uid exists; the
 * wall's button is a link to that page. So this function can never put a live payment
 * link in front of somebody whose account it does not know.
 */
function pwPrices(root) {
  if (typeof lmPayPrice !== "function") return;
  const code = typeof lmCurrency === "function" ? lmCurrency() : "PLN";
  const cards = root.querySelectorAll("[data-pw-plan]");
  for (let i = 0; i < cards.length; i++) {
    const id = cards[i].getAttribute("data-pw-plan");
    const minor = lmPayPrice(id, code);
    const out = cards[i].querySelector("[data-pw-price]");
    // A plan with no price in this currency is not shown at all. Showing its name with an
    // empty space where the amount belongs reads as a page that failed to load.
    cards[i].hidden = minor === null;
    if (out && minor !== null) {
      out.textContent = typeof lmMoneyMinor === "function"
        ? lmMoneyMinor(minor, code) : `${(minor / 100).toFixed(2)} ${code}`;
    }
  }

  /* Two sentences, and exactly one of them. Either the subscription is open and the way
     to it is the button above, or it is not open yet and the page says so instead of
     leaving somebody to click a link that cannot take their money. */
  const open = typeof lmPayOpen === "function" && lmPayOpen(code);
  const soon = root.querySelector("[data-pw-soon]");
  const buy = root.querySelector("[data-pw-buy]");
  if (soon) soon.hidden = open;
  if (buy) buy.hidden = !open;
}

/**
 * Wire one page's paywall and draw it once.
 *
 * Redrawn on `lm-session` (somebody signed in or out on /app/, in this tab or another),
 * on `currencychange` (the amounts on the wall are in the visitor's currency) and on
 * `langchange` (the period beside each price is a translated word).
 */
function pwMount(prefix, feature) {
  document.addEventListener("lm-session", () => pwRender(prefix, feature));
  document.addEventListener("currencychange", () => pwRender(prefix, feature));
  document.addEventListener("langchange", () => pwRender(prefix, feature));
  pwRender(prefix, feature);
}

/* ------------------------------------------------------------------ /liczmat-pro/ */

/**
 * The public Pro page (session 29), which is the one page here with no module on it.
 *
 * There is no wall to draw: /liczmat-pro/ is GUEST and describes what Pro is, so nothing
 * on it is withheld from anybody. Two things still have to happen in the browser, and
 * both are already written above:
 *
 *   the price   proPlansBlock() leaves the amount empty, because the build has no idea
 *               which currency this visitor reads in and the page is cached for all of
 *               them. pwPrices() fills it in, exactly as it does on a wall — one
 *               function, so the public page and the wall cannot quote two prices.
 *   the plan    somebody already paying for Pro is shown that, and no price at all.
 *               Quoting the fee to a customer who is already paying it reads as a
 *               threat, which is the same reason the strip above an open module never
 *               carries one.
 *
 * The level is the `liczmat-signed-in` hint (assets/account.js), which can be stale — and
 * that is fine here, because nothing is gated either way: the worst a stale hint can do
 * is show a price to somebody who has already paid, and the page they are sent to is
 * /app/, which asks Firebase and knows the truth.
 */
function pwPage() {
  const pay = document.getElementById("pro-pay");
  if (!pay) return;
  const yours = document.getElementById("pro-yours");
  const isPro = pwLevel() === (typeof LM_LEVEL === "object" && LM_LEVEL ? LM_LEVEL.PRO : "pro");
  pay.hidden = isPro;
  if (yours) yours.hidden = !isPro;
  if (!isPro) pwPrices(pay);
}

/* Redrawn for the same three reasons a wall is: somebody signed in or out (in this tab or
   another), the currency changed, or the language did — the period beside each amount is
   a translated word. The page has no script of its own to call this, so it wires itself
   and does nothing at all on the pages that carry no #pro-pay. */
if (typeof document !== "undefined" && document.getElementById("pro-pay")) {
  document.addEventListener("lm-session", pwPage);
  document.addEventListener("currencychange", pwPage);
  document.addEventListener("langchange", pwPage);
  pwPage();
}
