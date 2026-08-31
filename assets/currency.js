/* LiczMat website — the currency the visitor counts in.
 *
 * Language and currency are independent (master plan, chapter VI): Deutsch + PLN is a
 * valid setting, so is English + EUR. The language comes from the URL, the currency from
 * this file — a saved choice in localStorage, or the default for the page's language
 * until somebody picks one.
 *
 * What the currency does NOT do: it never converts anything. There is no exchange rate
 * here, and there cannot be one in a calculator that has to work offline. Switching from
 * PLN to EUR changes the currency the prices you type are read and shown in; it does not
 * touch the numbers. Physical quantities — m², kg, packs, sheets — never move either
 * (chapter VI, "WAŻNA ZASADA DOTYCZĄCA KALKULATORÓW").
 *
 * Estimate lines keep the currencyCode they were saved with, exactly as the Android app
 * stores it (docs/FIRESTORE_SYNC.md), so an old line stays honest after a switch.
 */

/**
 * The nine currencies LiczMat counts in — the same nine here and on the phone, which is
 * what session 61 was for (audit D1/D2, the owner's decision of 2026-08-31: the app came
 * down from twenty-six, GBP and RUB came up to meet it).
 *
 * **Counting in a currency and being SOLD in one are two different lists.** This is the
 * first; `LM_PAY.currencies` in assets/pay.js is the second, and it is shorter — GBP and
 * RUB have no amount there, deliberately, and that file says why. A currency with no
 * amount shows no price rather than a derived one.
 *
 * Adding a currency converts nothing. Every amount already stored keeps the
 * `currencyCode` it was saved with, and no existing number moves — see the header.
 */
const LM_CURRENCIES = ["PLN", "EUR", "USD", "GBP", "UAH", "CZK", "RON", "RSD", "RUB"];

const LM_CURRENCY_KEY = "liczmat-currency";

/**
 * The currency a language starts with. Only a default — the visitor overrides it, and
 * chapter VI is explicit that the two are independent (Deutsch + PLN is valid).
 *
 * Croatia is on the euro since 2023, so `hr` starts in EUR rather than in a kuna that no
 * longer exists. **`ru` starts in RUB since session 61**, which is what the phone has always
 * done. It started in EUR here because the rouble buys no subscription — true, and still
 * true, but that is an argument about the *price*, not about the currency somebody counts a
 * floor in, which is what this table is. The Pro page quotes no price in RUB and says so.
 */
const LM_LANG_CURRENCY = {
  pl: "PLN", uk: "UAH", de: "EUR", en: "USD",
  cs: "CZK", sk: "EUR", ro: "RON", hr: "EUR", sr: "RSD", ru: "RUB",
};

/** Number formatting stays with the language: 1 234,56 in Polish, 1,234.56 in English. */
const LM_LOCALE = {
  pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-US", cs: "cs-CZ",
  sk: "sk-SK", ro: "ro-RO", hr: "hr-HR", sr: "sr-RS", ru: "ru-RU",
};

/** The language this page is written in. */
function lmLang() {
  const l = document.documentElement.lang || "pl";
  return LM_LOCALE[l] ? l : "pl";
}

function lmLocale(lang) {
  return LM_LOCALE[lang || lmLang()] || LM_LOCALE.pl;
}

/** The visitor's currency: their saved choice, else the language's default. */
function lmCurrency() {
  try {
    const saved = localStorage.getItem(LM_CURRENCY_KEY);
    if (LM_CURRENCIES.indexOf(saved) !== -1) return saved;
  } catch (e) {}
  return LM_LANG_CURRENCY[lmLang()] || "PLN";
}

/** Store the choice and tell the page. Nothing is converted — see the header comment. */
function lmSetCurrency(code) {
  if (LM_CURRENCIES.indexOf(code) === -1) return;
  try { localStorage.setItem(LM_CURRENCY_KEY, code); } catch (e) {}
  lmPaintMoney();
  document.dispatchEvent(new CustomEvent("currencychange", { detail: { currency: code } }));
}

/**
 * An amount in major units ("12.5") as money, in the page's language and the currency.
 *
 * An explicit code wins even when it is not one of the seven: a line saved in HUF while
 * the site still offered Hungarian is displayed in HUF, because that is the currency its
 * price was typed in. Only an amount with no currency of its own gets the visitor's.
 */
function lmMoney(major, code, digits) {
  const amount = Number(major) || 0;
  const currency = /^[A-Z]{3}$/.test(String(code)) ? code : lmCurrency();
  const max = digits === undefined ? 2 : digits;
  try {
    return new Intl.NumberFormat(lmLocale(), {
      style: "currency", currency, minimumFractionDigits: max, maximumFractionDigits: max,
    }).format(amount);
  } catch (e) {
    return `${amount.toFixed(max)} ${currency}`;
  }
}

/** The same, from minor units — the integer the workspace and Firestore store. */
function lmMoneyMinor(minor, code) {
  return lmMoney((Number(minor) || 0) / 100, code);
}

/** A plain number in the page's language. */
function lmNumber(value, maxDigits) {
  try {
    return new Intl.NumberFormat(lmLocale(), { maximumFractionDigits: maxDigits === undefined ? 2 : maxDigits })
      .format(Number(value) || 0);
  } catch (e) {
    return String(value);
  }
}

/**
 * Fill in every element that carries a fixed amount, e.g. the "0" price on the home page.
 * A round amount is written without decimals — the stat band says "0 zł", not "0,00 zł",
 * and the generated HTML says the same, so nothing shifts when this runs.
 */
function lmPaintMoney() {
  document.querySelectorAll("[data-lm-money]").forEach((el) => {
    const amount = parseFloat(el.getAttribute("data-lm-money")) || 0;
    el.textContent = lmMoney(amount, "", Number.isInteger(amount) ? 0 : 2);
  });
}

/** The header's currency selector. Plain text codes — a flag would be a lie here. */
function lmBuildSwitcher() {
  lmPaintMoney();

  const sel = document.getElementById("currency-select");
  if (!sel) return;
  const current = lmCurrency();
  sel.innerHTML = LM_CURRENCIES
    .map((c) => `<option value="${c}"${c === current ? " selected" : ""}>${c}</option>`)
    .join("");
  sel.addEventListener("change", () => lmSetCurrency(sel.value));
}

/* The build reads the two tables above out of this very file (src/currency.mjs), so the
   supported currencies are written once. It has no DOM, hence the guard. */
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", lmBuildSwitcher);
}
