#!/usr/bin/env node
/**
 * LiczMat — /liczmat-pro/, the public page for LiczMat Pro, tested.
 *
 *     node scripts/test-propage.mjs
 *
 * Master plan, session 29 (STRONA LICZMAT PRO): "Krótka, konkretna strona prezentująca
 * Pro. Bez marketingowego przesytu." The page is short, so this suite is mostly about the
 * two things a page like it gets wrong:
 *
 *   1. the route — GUEST, indexable, one slug in ten languages, and no gate. A page that
 *      describes what somebody would be paying for, put behind the payment, is a circle;
 *   2. one source per statement — the five modules come from LM_FEATURES, the price from
 *      assets/pay.js, the addresses from src/site.mjs. Nothing on this page is a second
 *      copy of anything, because a second copy is what starts disagreeing.
 *
 * Then the things the whole session turns on: that the amount is really in the HTML (a
 * crawler and a visitor with no script both read it), that it is the hand-typed one for
 * that language's currency and not a conversion, that nothing here offers to take money
 * while assets/pay.js carries no Payment Link, and that the copy exists in all ten
 * languages rather than in Polish ten times.
 *
 * Dependency-free, plain `node`, exit 1 on failure — the same shape as the other logic
 * suites. Run it after touching src/pages.mjs's proPageMain(), the route in src/ia.mjs,
 * buildProPage() in scripts/build.mjs, or a propage_* key.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LANGS, DEFAULT_LANG, SECTION, urlHome, urlLiczmatPro, urlCalcIndex, urlProjects,
  urlEstimate, URL_APP,
} from "../src/site.mjs";
import {
  LEVEL, STATUS, route, validateIA, livePaths, HOME_DOORS, ACCOUNT_LEVELS, navRoutes,
} from "../src/ia.mjs";
import { DEFAULT_CURRENCY, MONEY_LOCALE } from "../src/currency.mjs";
import { proPageMain } from "../src/pages.mjs";
import { proModules } from "../src/pro.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => [].concat(file).map((f) => readFileSync(p(f), "utf8")).join("\n");
const evalScript = (file, returns) => new Function(`${read(file)}\nreturn {${returns.join(",")}};`)();

const { I18N } = evalScript("assets/i18n.js", ["I18N"]);
const { I18N_PAGES } = evalScript("assets/i18n-pages.js", ["I18N_PAGES"]);
const DICT = {};
for (const lang of LANGS) DICT[lang] = { ...(I18N[lang] || {}), ...(I18N_PAGES[lang] || {}) };
const tr = (lang) => (key) => (DICT[lang] || {})[key] || key;

/* The permission table and the price list, read exactly as the browser reads them. */
const { LM_FEATURES } = evalScript(["assets/account.js", "assets/plan.js"], ["LM_FEATURES"]);
const { LM_PAY, lmPayPrice, lmPayUrlOk } = evalScript("assets/pay.js",
  ["LM_PAY", "lmPayPrice", "lmPayUrlOk"]);

/**
 * What scripts/build.mjs prints as the price, recomputed here from the same two sources.
 * Keeping the formula in the test rather than importing it from the build is deliberate:
 * scripts/build.mjs writes 373 pages when it is imported, and the point of the check is
 * that the amount on the shipped page is this one.
 */
const priceText = (lang, planId) => {
  const code = DEFAULT_CURRENCY[lang];
  const minor = lmPayPrice(planId, code);
  return minor === null ? null : new Intl.NumberFormat(MONEY_LOCALE[lang], {
    style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(minor / 100);
};

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

/* ================================================================== 1. the route */

head("1. the route: public, indexable, and one name in every language");
{
  const r = route("liczmat-pro");
  check("the route exists", Boolean(r));
  eq("session 29 turned it on", r.status, STATUS.LIVE);
  eq("it is GUEST — the description of Pro is not itself Pro", r.level, LEVEL.GUEST);
  check("it is indexable: chapter XXVI wants Pro described in public", r.indexable === true);
  check("it hangs off the home page", r.parent === "home");
  check("it is localized — one URL per language", r.localized === true);
  check("it carries no gate, and needs none", !r.gate);
  check("and it is no longer waiting for a session", !r.session && !r.plannedSlug);

  // A brand name is the same word everywhere. Ten different slugs would be ten pages
  // competing for one product's links.
  for (const lang of LANGS) {
    eq(`${lang}: the segment is the brand name`, SECTION.pro[lang], "liczmat-pro");
    eq(`${lang}: and the URL is built from it`, r.path(lang), urlLiczmatPro(lang));
  }
  eq("Polish sits at the root", urlLiczmatPro(DEFAULT_LANG), "/liczmat-pro/");
  eq("and every other language under its own prefix", urlLiczmatPro("de"), "/de/liczmat-pro/");

  check("the architecture is consistent with it", validateIA().length === 0,
    validateIA().join("\n      "));

  // The build compares what it wrote against this set, so a page missing here is a page
  // that would abort the build rather than ship half-declared.
  const declared = livePaths([], []);
  for (const lang of LANGS) {
    const file = `${urlLiczmatPro(lang).replace(/^\//, "")}index.html`;
    check(`${lang}: the architecture declares ${file}`, declared.has(file));
  }
}

head("1b. where the product points at it");
{
  const r = route("liczmat-pro");

  // Chapter X: the third door of the home page. It was a sentence while the route was
  // planned; src/pages.mjs reads the status, so it is a link now with nothing edited.
  const door = HOME_DOORS.find((d) => d.route === "liczmat-pro");
  check("the third door of the home page opens it", Boolean(door));
  eq("and it is the Pro door", door.level, LEVEL.PRO);
  for (const lang of LANGS) {
    check(`${lang}: the door has a label for the link it is now`,
      Boolean(DICT[lang][`${door.key}_go`]), `${door.key}_go`);
  }

  // Chapter XXV's "Poznaj LiczMat Pro" on /app/, and the Pro level card beside it.
  const level = ACCOUNT_LEVELS.find((l) => l.level === LEVEL.PRO);
  eq("the Pro level card names this page", level.route, "liczmat-pro");

  // In the footer, above the four Pro modules, and visible to everybody: the modules are
  // hidden from anybody who is not on Pro (navLevel), and the page that explains them
  // would be useless under the same rule.
  check("it is in the footer", Boolean(r.footer));
  check("with no navLevel, so a guest is offered it", !r.navLevel);
  const product = navRoutes("footer", "product").map((x) => x.id);
  check("and it stands in front of the modules it describes",
    product.indexOf("liczmat-pro") < product.indexOf("clients"), product.join(" → "));

  // The header row fits five links and holds five. This page is not one of them.
  check("it is not in the header, which is full", !r.header);
}

/* ================================================================== 2. the page */

head("2. the page, as the build writes it, in ten languages");
for (const lang of LANGS) {
  const t = tr(lang);
  const prices = {};
  for (const plan of LM_PAY.plans) {
    const text = priceText(lang, plan.id);
    if (text !== null) prices[plan.id] = text;
  }
  const { main, ld } = proPageMain(lang, t, LM_FEATURES, prices);
  const has = (needle, what) => check(`${lang}: ${what}`, main.includes(needle),
    `not on the page: ${needle}`);
  const hasNot = (needle, what) => check(`${lang}: ${what}`, !main.includes(needle),
    `still on the page: ${needle}`);

  has(`<h1>${t("pro_t")}</h1>`, "the page is titled with the product's name");
  has(t("pro_d"), "and led by the one sentence that says what Pro is");
  has(t("lvl_pro"), "the level it belongs to is named");
  has(`href="${urlHome(lang)}"`, "the breadcrumb goes back to the home page");
  check(`${lang}: it declares itself as a page in the site's tree`,
    ld && ld["@type"] === "BreadcrumbList", JSON.stringify(ld && ld["@type"]));

  /* The five modules: the same list the wall and the Pro tab show, because it is the
     same table. A page describing four of them, or six, would be the product being
     described twice. */
  const mods = proModules(LM_FEATURES);
  eq(`${lang}: LiczMat Pro is five modules`, mods.length, 5);
  for (const f of mods) {
    has(t(`${f.key}_t`), `${f.id} is named`);
    has(t(`${f.key}_d`), `and ${f.id} is described`);
  }

  /* Nothing is withheld here. No wall, no rung, no "available in LiczMat Pro" chip: the
     page IS the description, so hiding any of it would leave nothing to read. */
  hasNot("pw-gate", "there is no wall on the page that explains the wall");
  hasNot("data-pw-step", "and no rung of the Free → Pro path is hidden in it");
  hasNot(t("pro_locked"), "no module on it is marked locked");

  /* A link onto a locked module is a dead button by a longer route — the argument that
     already keeps the wall's own list of modules unlinked. */
  for (const f of mods.filter((x) => x.route)) {
    const target = route(f.route);
    hasNot(`href="${target.path(lang)}"`, `${f.id} is described, not linked into`);
  }

  /* What stays free, with the pages that prove it — in this language, because a Polish
     link on the German page is the one mistake a per-language URL exists to prevent. */
  has(t("propage_h_free"), "the free half of the product has its own heading");
  has(`href="${urlCalcIndex(lang)}"`, "the calculators are linked");
  has(`href="${urlProjects(lang)}"`, "the projects are linked");
  has(`href="${urlEstimate(lang)}"`, "and the cost estimate is linked");
  for (const key of ["propage_free_1", "propage_free_2", "propage_free_3"]) {
    has(t(key), `${key} is on the page`);
  }

  /* What Pro is not. Chapter XXIV ends on "to nie jest ERP" and chapters XXII and XXIII
     rule out the accounting package and the second calendar by name. */
  has(t("propage_h_not"), "the limits have their own heading");
  for (const key of ["propage_not_1", "propage_not_2", "propage_not_3"]) {
    has(t(key), `${key} is on the page`);
  }
  has(t("propage_local"), "and the page says where the Pro rows actually live");

  /* The price. The amount is in the markup — that is the half of session 29 a script
     cannot do — and it is this language's default currency, which is the only one the
     build can know. assets/paywall.js replaces it with the visitor's own. */
  has(t("propage_h_pay"), "the price has its own heading");
  has(t("pay_t"), "the subscription block is on the page");
  for (const plan of LM_PAY.plans) {
    has(`data-pw-plan="${plan.id}"`, `the ${plan.id} plan is shown`);
    has(t(`pay_${plan.id}_per`), `and its period is named`);
    has(`<b data-pw-price>${priceText(lang, plan.id)}</b>`,
      `with the ${plan.id} amount in the HTML, in ${DEFAULT_CURRENCY[lang]}`);
  }
  hasNot('data-pw-plan="monthly" hidden', "a priced plan is not hidden from a crawler");

  /* Nothing here takes money, and nothing here can. The checkout needs a uid, /app/ is
     the only page that has one, and the subscription has not opened at all yet. */
  hasNot("stripe.com", "no payment address stands on a public page");
  /* Both sentences are in the markup and assets/paywall.js shows one, so this page reads
     correctly before and after the sale opens without being rebuilt for it. Asserting the
     closed state here instead would make session 39 look like a regression. */
  has(t("pay_soon"), "the subscription-not-open sentence is in the page");
  has("data-pw-buy", "and so is the row that replaces it once there is a Payment Link");
  has(`href="${URL_APP}"`, "and the way in is the account page");

  /* Chapter XXV's Free → Pro path, written out: an account first, then the plan. The
     sign-up link comes back here, in this language. */
  has(t("propage_h_how"), "the way from free to Pro has its own heading");
  for (const key of ["propage_how_1", "propage_how_2", "propage_how_3"]) {
    has(t(key), `${key} is on the page`);
  }
  has(`href="${URL_APP}?mode=signup&amp;next=${encodeURIComponent(urlLiczmatPro(lang))}"`,
    "the sign-up link comes back to this page, in this language");
  has('rel="nofollow"', "and the account links are not offered to a crawler");
}

/* ================================================================== 3. the price */

head("3. the amount is read, never converted");
{
  for (const lang of LANGS) {
    const code = DEFAULT_CURRENCY[lang];
    for (const plan of LM_PAY.plans) {
      const minor = lmPayPrice(plan.id, code);
      check(`${lang}: the ${plan.id} plan has a hand-typed price in ${code}`, minor !== null);
      // The printed amount is that integer and nothing else: the same digits, formatted.
      const printed = priceText(lang, plan.id);
      const digits = printed.replace(/[^0-9]/g, "");
      eq(`${lang}: ${plan.id} prints exactly the stored minor units`,
        digits, String(minor).padStart(3, "0"));
    }
  }

  // Two languages that share a currency print the same amount; two that do not, do not.
  // A page that "converted" would make the second pair agree.
  eq("German and Slovak share the euro", DEFAULT_CURRENCY.de, DEFAULT_CURRENCY.sk);
  check("so they quote the same figure",
    priceText("de", "monthly").replace(/[^0-9]/g, "") === priceText("sk", "monthly").replace(/[^0-9]/g, ""));
  check("Polish and German do not share a currency", DEFAULT_CURRENCY.pl !== DEFAULT_CURRENCY.de);
  check("and quote different figures",
    priceText("pl", "monthly").replace(/[^0-9]/g, "") !== priceText("de", "monthly").replace(/[^0-9]/g, ""),
    `${priceText("pl", "monthly")} vs ${priceText("de", "monthly")}`);

  // The formatting has to be lmMoneyMinor()'s, or the price twitches when the script
  // runs: two decimals, always, in the language's own locale.
  for (const lang of LANGS) {
    const printed = priceText(lang, "monthly");
    check(`${lang}: the amount carries two decimals`, /[.,]\d\d(\D|$)/.test(printed), printed);
  }
}

/* ================================================================== 4. the copy */

head("4. the copy, in ten languages");
{
  const KEYS = [
    "propage_meta", "propage_h_mods", "propage_mods_d",
    "propage_h_free", "propage_free_d", "propage_free_1", "propage_free_2", "propage_free_3",
    "propage_h_not", "propage_not_1", "propage_not_2", "propage_not_3",
    "propage_h_pay", "propage_h_how", "propage_how_1", "propage_how_2", "propage_how_3",
    "propage_local",
  ];

  for (const lang of LANGS) {
    for (const key of KEYS) {
      const value = DICT[lang][key];
      check(`${lang}: ${key} exists`, typeof value === "string" && value.length > 0, String(value));
    }
    // A meta description that runs past ~160 characters is cut off in the result, and the
    // sentence that gets cut is the one naming what the page is.
    const meta = DICT[lang].propage_meta || "";
    check(`${lang}: the meta description fits a search result`,
      meta.length > 60 && meta.length <= 200, `${meta.length} characters`);
    // The honest note has to say the two things it exists to say.
    const local = (DICT[lang].propage_local || "").toLowerCase();
    check(`${lang}: the note names the browser the rows sit in`, local.includes("android"),
      DICT[lang].propage_local);
  }

  // Translated, not copied. Ten identical strings means nine languages nobody wrote.
  for (const key of KEYS) {
    const all = LANGS.map((l) => DICT[l][key]);
    check(`${key} is actually translated`, new Set(all).size >= 8, all.join(" | "));
  }

  /* This page never takes money and never will — it has no uid to attach a payment to.
     What it must not do is point somewhere that is not Stripe, in either state: no link
     while the sale is closed, and a checked one after session 39 opens it. */
  for (const plan of LM_PAY.plans) {
    check(`the ${plan.id} plan's address is absent or Stripe's`,
      plan.link === "" || lmPayUrlOk(plan.link), plan.link);
  }
}

/* ================================================================== 5. what shipped */

head("5. the ten pages that are actually in the repo");
{
  const sitemap = read("sitemap.xml");
  for (const lang of LANGS) {
    const file = `${urlLiczmatPro(lang).replace(/^\//, "")}index.html`;
    if (!check(`${lang}: ${file} was built and committed`, existsSync(p(file)))) continue;
    const html = read(file);

    check(`${lang}: it declares itself canonical`,
      html.includes(`rel="canonical" href="https://liczmat.com${urlLiczmatPro(lang)}"`),
      urlLiczmatPro(lang));
    check(`${lang}: it is not noindex — the page exists to be found`,
      !html.includes('name="robots" content="noindex'));
    check(`${lang}: it is in sitemap.xml`,
      sitemap.includes(`<loc>https://liczmat.com${urlLiczmatPro(lang)}</loc>`));
    for (const other of LANGS) {
      check(`${lang}: it points at its ${other} twin`,
        html.includes(`hreflang="${other === "en" ? "en" : other}" href="https://liczmat.com${urlLiczmatPro(other)}"`),
        urlLiczmatPro(other));
    }

    // The two scripts the page needs, and the ones it deliberately does not load.
    check(`${lang}: it loads the price list`, html.includes("/assets/pay.js"));
    check(`${lang}: and the script that writes today's amount`, html.includes("/assets/paywall.js"));
    check(`${lang}: it does not load the permission table — it gates nothing`,
      !html.includes("/assets/plan.js"));
    check(`${lang}: nor the CRM store, which holds somebody's rows`,
      !html.includes("/assets/crm.js"));

    // The amount really is in the shipped bytes, which is the whole point of printing it
    // at build time rather than leaving it to a script.
    for (const plan of LM_PAY.plans) {
      check(`${lang}: the ${plan.id} price is in the HTML`,
        html.includes(priceText(lang, plan.id)), priceText(lang, plan.id));
    }
  }
}

head("5b. the script that fills the price in");
{
  const src = read("assets/paywall.js");
  check("assets/paywall.js knows the public page", src.includes("pro-pay"));
  check("it shows a Pro account their plan instead of a price", src.includes("pro-yours"));
  check("it fills the amount with the one function the wall uses", src.includes("pwPrices("));
  check("it redraws when the currency changes", src.includes("currencychange"));
  check("and when the language does", src.includes("langchange"));
  // The paywall decides nothing about money and stores nothing about anybody. The price
  // list is read through lmPayPrice(); reaching into LM_PAY here would be a second reader
  // of the same table, free to disagree with the first about what is priced.
  check("it writes nothing to storage", !/localStorage\.setItem/.test(src));
  check("and it carries no price list of its own", !src.includes("LM_PAY."));
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`propage: ${passed}/${passed} checks pass`);
