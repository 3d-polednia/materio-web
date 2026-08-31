#!/usr/bin/env node
/**
 * LiczMat — the subscription, tested.
 *
 *     node scripts/test-pay.mjs
 *
 * Master plan, session 28 (PŁATNOŚCI): "subskrypcja, status planu, obsługa aktywnego Pro,
 * obsługa anulowania, zabezpieczenie uprawnień". The plan states are checked in
 * scripts/test-plan.mjs, which owns lmSubscription(); this file is the money:
 *
 *   1. the configuration — the amounts, the currencies Pro is sold in, and the shape
 *      they are in, including the two the site counts in and deliberately does not price;
 *   2. the two thresholds — a plan that can be PRICED is not a plan that can be BOUGHT,
 *      which is exactly the state this site ships in;
 *   3. that nothing is converted at a rate, anywhere;
 *   4. the checkout URL — what it carries (who) and what it must never carry (how much);
 *   5. the addresses, which may only ever point at Stripe;
 *   6. "zabezpieczenie uprawnień": that no key in this browser opens a Pro module, and
 *      that the price cannot be talked up or down by anything the visitor controls.
 *
 * Dependency-free, plain `node`, exit 1 on failure — the same shape as the other logic
 * suites. Run it after touching assets/pay.js, assets/currency.js or the money half of
 * assets/plan.js.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS } from "../src/site.mjs";
import { CURRENCIES } from "../src/currency.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");

function evalSource(src, returns, globals = {}) {
  const names = Object.keys(globals);
  return new Function(...names, `${src}\nreturn {${returns.join(",")}};`)(...names.map((n) => globals[n]));
}
const evalScript = (file, returns, globals) => evalSource(read(file), returns, globals);

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const DICT = {};
for (const lang of LANGS) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };

/**
 * assets/pay.js as the browser loads it. It reads nothing from any other file on purpose
 * — the prices are not a function of who the visitor is — so it loads alone.
 *
 * `over` replaces the shipped configuration, which is how the states this site does NOT
 * ship in (a Payment Link filled in, a currency with no price) get tested without waiting
 * for the owner to create the products.
 */
function loadPay(over) {
  const api = evalScript("assets/pay.js", [
    "LM_PAY", "LM_PAY_HOSTS", "lmPayPlan", "lmPayPrice", "lmPayPriced", "lmPayBuyable",
    "lmPayPlans", "lmPayOpen", "lmPayUrlOk", "lmCheckoutUrl", "lmPortalUrl",
  ], { URL, localStorage: undefined, document: undefined });
  if (over) {
    if (over.portalUrl !== undefined) api.LM_PAY.portalUrl = over.portalUrl;
    if (over.plans) api.LM_PAY.plans = over.plans;
    if (over.link !== undefined) api.LM_PAY.plans.forEach((pl) => { pl.link = over.link; });
  }
  return api;
}

/* ------------------------------------------------------------------ the runner */

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };

function check(name, cond, detail) {
  if (cond) { passed++; return true; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
  return false;
}
const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

/* ================================================================== 1. the prices */

head("1. the amounts, the currencies Pro is sold in, and no gaps in either list");
{
  const pay = loadPay();
  const SELLABLE = pay.LM_PAY.currencies;
  eq("two plans and no more", pay.LM_PAY.plans.length, 2);
  eq("the monthly one first", pay.LM_PAY.plans[0].id, "monthly");
  eq("then the yearly one", pay.LM_PAY.plans[1].id, "yearly");

  /* Two lists since session 61, and this is the section that keeps them honest.
     COUNTING (`CURRENCIES`, from assets/currency.js) is what somebody may price a floor in.
     SELLING (`LM_PAY.currencies`) is what Pro has an amount in. Selling must be a subset of
     counting — an amount in a currency nobody can switch the site onto is an amount nobody
     will ever be shown. The other direction is allowed and deliberate: Stripe does not
     operate in Russia, and the pound is waiting for two numbers only the owner can type. */
  check("every currency Pro is sold in is one the site counts in",
    SELLABLE.every((c) => CURRENCIES.includes(c)),
    SELLABLE.filter((c) => !CURRENCIES.includes(c)).join(",") || "ok");

  for (const plan of pay.LM_PAY.plans) {
    for (const code of SELLABLE) {
      const minor = pay.lmPayPrice(plan.id, code);
      check(`${plan.id} has a price in ${code}`, minor !== null, String(minor));
      check(`${plan.id}/${code} is a whole number of minor units`,
        Number.isInteger(minor), String(minor));
      check(`${plan.id}/${code} is a positive amount`, minor > 0, String(minor));
    }
    eq(`${plan.id} prices exactly the currencies Pro is sold in`,
      Object.keys(plan.price).sort().join(","), [...SELLABLE].sort().join(","));
  }

  /* And the gap is a gap, not a half-configured price. A currency the site counts in but
     does not sell in must show NOTHING — one amount typed into one plan by accident would
     quote a monthly price with no yearly one beside it. */
  for (const code of CURRENCIES.filter((c) => !SELLABLE.includes(c))) {
    for (const plan of pay.LM_PAY.plans) {
      eq(`${code} is counted in but not sold in, so ${plan.id} has no price`,
        pay.lmPayPrice(plan.id, code), null);
      eq(`and ${plan.id} is not offered in ${code}`, pay.lmPayPriced(plan.id, code), false);
    }
    eq(`so no plan is listed in ${code}`, pay.lmPayPlans(code).length, 0);
    eq(`and nothing takes money in ${code}`, pay.lmPayOpen(code), false);
  }

  // The yearly plan is ten times the monthly one in every currency: ~10 months for 12.
  // A currency where that slipped would be one market quietly on a different offer.
  for (const code of SELLABLE) {
    const m = pay.lmPayPrice("monthly", code);
    const y = pay.lmPayPrice("yearly", code);
    check(`${code}: the year costs less than twelve months`, y < m * 12, `${y} vs ${m * 12}`);
    check(`${code}: and more than nine`, y > m * 9, `${y} vs ${m * 9}`);
  }

  // The owner's own two numbers, as given. If either moves, it moves in Stripe too.
  eq("the monthly euro price is the one that was decided", pay.lmPayPrice("monthly", "EUR"), 999);
  eq("and the monthly złoty price", pay.lmPayPrice("monthly", "PLN"), 3999);
  eq("the yearly euro price", pay.lmPayPrice("yearly", "EUR"), 9999);
  eq("and the yearly złoty price", pay.lmPayPrice("yearly", "PLN"), 39999);

  // An unknown plan or currency is null, never a guess.
  eq("an unknown plan has no price", pay.lmPayPrice("weekly", "PLN"), null);
  // CHF: on neither list. GBP is no longer the example — the site counts in it now.
  eq("an unknown currency has no price", pay.lmPayPrice("monthly", "CHF"), null);
  eq("and neither does a missing one", pay.lmPayPrice("monthly", undefined), null);
  eq("an unknown plan is not a plan", pay.lmPayPlan("weekly"), null);
}

head("2. nothing is converted at a rate");
{
  /* The header of assets/pay.js promises the euro rate was applied once, by hand, when
     the file was written — never in the browser. This is that promise, enforced: a
     currency with no configured amount shows no price at all rather than deriving one. */
  const pay = loadPay({ plans: [
    { id: "monthly", key: "pay_monthly", link: "", price: { EUR: 999 } },
  ] });
  eq("the configured currency has its price", pay.lmPayPrice("monthly", "EUR"), 999);
  for (const code of CURRENCIES.filter((c) => c !== "EUR")) {
    eq(`${code} is not derived from the euro price`, pay.lmPayPrice("monthly", code), null);
    eq(`and ${code} is not shown at all`, pay.lmPayPriced("monthly", code), false);
  }
  // Including the two the shipped file really does leave unpriced — same code path.
  eq("GBP derives nothing either", pay.lmPayPrice("monthly", "GBP"), null);
  eq("and neither does RUB", pay.lmPayPrice("monthly", "RUB"), null);
  eq("so only the priced currency lists the plan", pay.lmPayPlans("EUR").length, 1);
  eq("and the others list none", pay.lmPayPlans("USD").length, 0);

  // No arithmetic on a rate anywhere in the file — no rate constant to multiply by.
  const src = read("assets/pay.js");
  const code = src.slice(src.indexOf("/* ------------------------------------------------------------------ the configuration */"));
  check("the file's code contains no exchange-rate multiplication",
    !/\brate\s*\*|\*\s*rate\b|convert\(/i.test(code));
  check("and fetches nothing over the network",
    !/\bfetch\s*\(|XMLHttpRequest/.test(code));
}

/* ================================================================== 3. the two thresholds */

head("3. priced is not the same as buyable — whichever of the two states ships");
{
  const shipped = loadPay();

  /* Session 39 opens the sale, and it opens it by pasting three addresses into LM_PAY.
     So this section reads the state the file is actually in instead of asserting the one
     it shipped in on the day it was written — a suite that goes red the moment the owner
     pastes the URLs is a suite that reports the sale as a defect.

     What is refused in both states is the half-open one: one plan buyable and the other
     only priced, a checkout with no portal to cancel in, or a test-mode link, which takes
     nothing and produces events the live webhook secret rejects. */
  const open = shipped.LM_PAY.plans.some((plan) => plan.link !== "");

  if (!open) {
    for (const plan of shipped.LM_PAY.plans) {
      eq(`${plan.id} ships with no Payment Link`, plan.link, "");
      eq(`so ${plan.id} has a price`, shipped.lmPayPriced(plan.id, "PLN"), true);
      eq(`and ${plan.id} still cannot be bought`, shipped.lmPayBuyable(plan.id, "PLN"), false);
    }
    eq("the shipped site takes no money", shipped.lmPayOpen("PLN"), false);
    eq("in any currency", CURRENCIES.some((c) => shipped.lmPayOpen(c)), false);
    eq("the portal is not configured either", shipped.lmPortalUrl(), null);
    // …and it still says what Pro costs, which is the whole reason for two thresholds.
    eq("both plans are still listed with prices", shipped.lmPayPlans("PLN").length, 2);
  } else {
    for (const plan of shipped.LM_PAY.plans) {
      check(`${plan.id} carries a link`, plan.link !== "", plan.id);
      check(`${plan.id} points at Stripe`, shipped.lmPayUrlOk(plan.link), plan.link);
      /* A Stripe test link says so in its path. It charges nobody and its events are
         signed with the test secret, so a live deployment answers them 400. */
      check(`${plan.id} is not a test-mode link`, !/\/test_/.test(plan.link), plan.link);
      for (const code of shipped.LM_PAY.currencies) {
        eq(`${plan.id} can be bought in ${code}`, shipped.lmPayBuyable(plan.id, code), true);
      }
      check(`${plan.id} builds a checkout URL`,
        typeof shipped.lmCheckoutUrl(plan.id, { uid: "abc123" }) === "string");
    }
    eq("the site takes money in every currency it prices",
      shipped.LM_PAY.currencies.every((c) => shipped.lmPayOpen(c)), true);
    /* Cancelling is Stripe's own screen, and it is the only one there is: a subscription
       nobody can get out of without writing to us is worse than one nobody can start. */
    check("and there is a portal to cancel in", shipped.lmPortalUrl() !== null,
      String(shipped.LM_PAY.portalUrl));
  }

  // Fill in a link, and only then does anything offer to charge.
  const on = loadPay({ link: "https://buy.stripe.com/test_123" });
  eq("a configured link makes the plan buyable", on.lmPayBuyable("monthly", "PLN"), true);
  eq("and the site open", on.lmPayOpen("PLN"), true);
  // A link with no price in THIS currency is still not buyable in this currency.
  const partial = loadPay({ plans: [
    { id: "monthly", key: "pay_monthly", link: "https://buy.stripe.com/test_123", price: { PLN: 3999 } },
  ] });
  eq("buyable where it is priced", partial.lmPayBuyable("monthly", "PLN"), true);
  eq("and not where it is not", partial.lmPayBuyable("monthly", "USD"), false);
}

head("3b. the checklist the owner works from is the one that is true");
{
  /* The note at the bottom of assets/pay.js is what the owner follows on the day the
     sale opens, so it is code as far as this suite is concerned. Session 38 replaced the
     Stripe extension with functions/ in this repo and left the note pointing at the
     extension: six steps, one of which installed the wrong server. */
  const src = read("assets/pay.js");
  const order = src.slice(src.indexOf("THE ORDER THE OWNER HAS TO WORK IN"));
  const guide = read("docs/STRIPE.md");

  check("the note is still there", order.length > 400);
  check("it names the webhook in this repo", order.includes("functions/"), order.slice(0, 120));
  check("and does not send the owner to install the Stripe extension",
    !/install the "Run Payments with Stripe"/.test(order));
  check("it points at the step-by-step", order.includes("docs/STRIPE.md"));
  check("which exists and is a document rather than a stub", guide.length > 2000);

  /* One list of events, two files. A note naming five events would have the owner
     subscribe to one the function answers by ignoring; naming three would have a
     cancellation arrive nowhere. */
  const map = read("functions/stripe-map.mjs");
  const list = map.slice(map.indexOf("export const HANDLED"));
  const handled = list.slice(list.indexOf("["), list.indexOf("]"))
    .match(/"[a-z._]+"/g).map((s) => s.slice(1, -1));
  eq("the function handles four events", handled.length, 4);
  for (const ev of handled) {
    const short = ev.slice(ev.lastIndexOf("."));
    check(`the note names ${ev}`, order.includes(ev) || order.includes(short), ev);
    check(`and docs/STRIPE.md names ${ev} in full`, guide.includes(ev), ev);
  }

  /* The fourteen amounts have to be typed into the Stripe dashboard by hand, so the guide
     carries them as a table — and a table nobody checks is the second copy this file's
     own header warns about. Every amount in it is derived from LM_PAY here. */
  const pay = loadPay();
  const printed = (minor) => {
    const whole = Math.floor(minor / 100);
    const cents = minor % 100;
    return cents === 0 ? String(whole) : `${whole},${String(cents).padStart(2, "0")}`;
  };
  for (const plan of pay.LM_PAY.plans) {
    for (const code of pay.LM_PAY.currencies) {
      const want = printed(pay.lmPayPrice(plan.id, code));
      check(`docs/STRIPE.md prices ${plan.id}/${code} at ${want}`, guide.includes(want), want);
    }
  }
  /* The guide is the owner clicking through Stripe, so it names the currencies with amounts
     — not the two the site merely counts in, which have no product to configure. */
  check("and the guide names every currency Pro is sold in",
    pay.LM_PAY.currencies.every((c) => guide.includes(c)));
}

head("4. a payment address may only ever be Stripe");
{
  const pay = loadPay();
  const ok = (url) => pay.lmPayUrlOk(url);

  check("a Stripe checkout link passes", ok("https://buy.stripe.com/abc"));
  check("so does the billing portal", ok("https://billing.stripe.com/p/login/abc"));

  check("http is refused", !ok("http://buy.stripe.com/abc"));
  check("another host is refused", !ok("https://example.com/abc"));
  /* The two that matter, and they fail in opposite directions — a suffix match lets the
     first through, a prefix match the second. Both were written after a deliberately
     broken endsWith() build slipped past an earlier version of this check. */
  check("a host that merely ENDS with the allowed one is refused",
    !ok("https://xbuy.stripe.com/abc"));
  check("and one that ends with it after a dash", !ok("https://evil-buy.stripe.com/abc"));
  check("a host that STARTS with it is refused too",
    !ok("https://buy.stripe.com.example.org/abc"));
  check("as is a deeper look-alike", !ok("https://evil.buy.stripe.com.co/abc"));
  check("and the bare apex domain", !ok("https://stripe.com/abc"));
  check("an empty link is refused", !ok(""));
  check("so is a missing one", !ok(undefined));
  check("and a relative path", !ok("/app/"));
  check("and something that is not a URL at all", !ok("buy.stripe.com"));
  check("and a javascript: URL", !ok("javascript:alert(1)"));

  eq("the host list is the two Stripe hosts and nothing else",
    pay.LM_PAY_HOSTS.join(","), "buy.stripe.com,billing.stripe.com");

  // A misconfigured portal is no portal rather than a link off-site.
  eq("a portal on the wrong host is not offered",
    loadPay({ portalUrl: "https://example.com/billing" }).lmPortalUrl(), null);
  eq("a correct one is",
    loadPay({ portalUrl: "https://billing.stripe.com/p/login/x" }).lmPortalUrl(),
    "https://billing.stripe.com/p/login/x");
}

head("5. the checkout URL carries who, never how much");
{
  const pay = loadPay({ link: "https://buy.stripe.com/test_123" });
  const url = pay.lmCheckoutUrl("monthly", { uid: "abc123", email: "jan@example.com" });
  const u = new URL(url);

  eq("it goes to Stripe", u.hostname, "buy.stripe.com");
  eq("the account is named, so the webhook can find it",
    u.searchParams.get("client_reference_id"), "abc123");
  eq("and the e-mail is prefilled", u.searchParams.get("prefilled_email"), "jan@example.com");

  /* The heart of "zabezpieczenie uprawnień" on the money side: the price is set on the
     product in Stripe, so a tampered browser can mis-draw its own page and cannot buy
     LiczMat Pro for a złoty. Nothing about the amount travels in this URL. */
  for (const forbidden of ["amount", "price", "currency", "plan", "unit_amount", "quantity"]) {
    eq(`the URL carries no ${forbidden}`, u.searchParams.get(forbidden), null);
  }
  check("and no price digits appear in it at all", !/3999|999|10990/.test(u.search), u.search);
  eq("exactly two parameters are added", [...u.searchParams.keys()].length, 2);

  // Without a uid the payment would land on nobody — but that is the caller's problem to
  // report, so the URL is still built and simply carries less.
  const anon = new URL(pay.lmCheckoutUrl("monthly", {}));
  eq("no uid means no reference", anon.searchParams.get("client_reference_id"), null);

  // A plan that cannot be bought has no URL, so no caller can render a dead button.
  eq("an unconfigured plan has no checkout",
    loadPay({ link: "" }).lmCheckoutUrl("monthly", { uid: "x" }), null);
  eq("nor does an unknown plan", pay.lmCheckoutUrl("weekly", { uid: "x" }), null);
  // A link that is not Stripe's is refused here too, not only by lmPayUrlOk().
  eq("nor does a plan pointed somewhere else",
    loadPay({ link: "https://example.com/pay" }).lmCheckoutUrl("monthly", { uid: "x" }), null);
}

/* ================================================================== 6. permissions */

head("6. no key in this browser buys, opens or discounts anything");
{
  /* scripts/test-plan.mjs §6c proves storage cannot open a Pro module. This is the other
     half: storage cannot change what Pro costs either. assets/pay.js is loaded with no
     localStorage at all — if it ever starts reading one, this throws rather than passes. */
  const pay = loadPay();
  eq("the prices do not depend on storage", pay.lmPayPrice("monthly", "PLN"), 3999);
  const src = read("assets/pay.js");
  check("and the file never touches localStorage", !/localStorage/.test(src));
  check("nor the document", !/\bdocument\./.test(src));

  // The site's own currency list is the authority; pay.js does not keep a second one.
  check("assets/pay.js declares no currency list of its own",
    !/LM_CURRENCIES\s*=/.test(src));
}

/* ================================================================== 6b. the wiring */

head("6b. every selector the scripts query exists in the markup the build writes");
{
  /* The Chromium suites are what normally catch a script querying an element the build
     stopped writing, and they need Playwright installed outside the repo. This is the
     same class of bug caught statically, so it is caught even when they are skipped:
     take the selectors out of the two files that draw the subscription, and require each
     one in the page that file runs on. */
  const wall = read("klienci/index.html");
  const app = read("app/index.html");

  // assets/paywall.js, drawing the wall on a Pro module page.
  for (const sel of ['[data-pw-plan]', '[data-pw-price]', '[data-pw-soon]', '[data-pw-buy]']) {
    const attr = sel.slice(1, -1);
    check(`the wall carries ${attr}`, wall.includes(attr), sel);
  }
  check("with both plans named", wall.includes('data-pw-plan="monthly"')
    && wall.includes('data-pw-plan="yearly"'));
  // …and nothing on it that could charge: the checkout needs a uid, which this page has
  // no way to know. It links to /app/ instead.
  check("and no checkout button on the wall", !wall.includes("data-pw-checkout"));
  check("nor a Stripe address", !wall.includes("stripe.com"));

  // assets/app.js, drawing the Pro tab of /app/.
  for (const id of ["plan-buy", "plan-manage", "plan-manage-link", "plan-name", "plan-until",
                    "plan-note"]) {
    check(`/app/ carries #${id}`, app.includes(`id="${id}"`), id);
  }
  check("/app/ carries the checkout button", app.includes("data-pw-checkout"));
  check("and the plan slots it fills", app.includes('data-pw-plan="monthly"'));
  // The one file that may take money is the one that knows who is paying.
  check("/app/ loads assets/pay.js", app.includes("assets/pay.js"));
  check("the wall's page loads it too, for the price", wall.includes("assets/pay.js"));

  /* The preview is gone from the shipped pages, not merely unused. A leftover switch
     would be a button wired to a function that no longer exists. */
  for (const [name, html] of [["the wall", wall], ["/app/", app]]) {
    check(`${name} carries no preview switch`, !html.includes("data-pw-preview"));
  }
}

/* ================================================================== 7. the copy */

head("7. the subscription, said in four languages");
{
  const keys = [
    "pay_t", "pay_d", "pay_soon", "pay_buy", "pay_go", "pay_manage", "pay_manage_d",
    "pay_monthly_t", "pay_monthly_per", "pay_yearly_t", "pay_yearly_per",
    "plan_renews", "plan_cancelled", "plan_active_d", "plan_cancel_d",
  ];
  for (const lang of LANGS) {
    for (const key of keys) {
      check(`${lang}: ${key} exists and is translated`,
        Boolean(DICT[lang][key]) && DICT[lang][key] !== key, key);
    }
    check(`${lang}: the two plans are named differently`,
      DICT[lang].pay_monthly_t !== DICT[lang].pay_yearly_t);
    check(`${lang}: the two periods read differently`,
      DICT[lang].pay_monthly_per !== DICT[lang].pay_yearly_per);

    /* The one sentence that has to be exactly right while the links are empty: it says
       the subscription cannot be bought yet. A page that showed a price and said nothing
       else would read as a checkout that is merely broken. */
    check(`${lang}: the "not open yet" sentence is a real sentence`,
      DICT[lang].pay_soon.length > 40, DICT[lang].pay_soon);

    // Cancellation is the state that has to explain what happens next, because nothing
    // else on the page would: Pro now, free later, and the date is elsewhere on the row.
    check(`${lang}: cancelling explains what happens at the end`,
      DICT[lang].plan_cancel_d.length > 60, DICT[lang].plan_cancel_d);
    check(`${lang}: and the two date labels are different words`,
      DICT[lang].plan_renews !== DICT[lang].plan_cancelled);

    // No page may promise Pro is granted by anything on this site.
    check(`${lang}: managing the subscription is said to be Stripe's screen`,
      DICT[lang].pay_manage_d.toLowerCase().includes("stripe"), DICT[lang].pay_manage_d);
  }
  for (const key of ["pay_t", "pay_soon", "pay_buy", "plan_renews"]) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated, not copied`, new Set(all).size > 1, all.join(" | "));
  }
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`pay: ${passed}/${passed} checks pass`);
