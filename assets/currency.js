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
 * The seven currencies LiczMat supports.
 *
 * Chapter VI names four — PLN, EUR, USD, UAH. Session 28 added CZK, RON and RSD because
 * the subscription has to be priced in them: LiczMat Pro is sold in Czechia, Romania and
 * Serbia, and a price shown in euro to somebody whose card is charged in koruna is a
 * price that changes at the checkout. Croatia is on the euro since 2023 and needs no
 * currency of its own; **RUB is deliberately absent** — Stripe does not operate in
 * Russia, so a rouble price would be one nothing could take money in.
 *
 * Adding a currency converts nothing. Every amount already stored keeps the
 * `currencyCode` it was saved with, and no existing number moves — see the header.
 */
const LM_CURRENCIES = ["PLN", "EUR", "USD", "UAH", "CZK", "RON", "RSD"];

const LM_CURRENCY_KEY = "liczmat-currency";

/** The currency a language starts with. Only a default — the visitor overrides it. */
const LM_LANG_CURRENCY = { pl: "PLN", uk: "UAH", de: "EUR", en: "USD" };

/** Number formatting stays with the language: 1 234,56 in Polish, 1,234.56 in English. */
const LM_LOCALE = { pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-US" };

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
