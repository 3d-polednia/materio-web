/* LiczMat website — the read-only shared estimate at /p/<token>.
 *
 * The visitor is the contractor's client: no account, no sign-in, nothing to install.
 * `sharedProjects/{token}` is world-readable by design — the 128-bit token in the URL is
 * the secret, and deleting the document revokes access instantly (FIRESTORE_SYNC §6).
 *
 * GitHub Pages has no server-side routing, so /p/<token> is served by 404.html, which
 * forwards to /p/?t=<token>. Both shapes are read here.
 */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const T = (key) => (typeof t === "function" ? t(key) : key);

const escapeHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The shape of a token, and the only shape this page will look up.
 *
 * `shareToken()` in assets/app.js writes 16 random bytes as URL-safe base64, so a real
 * token is 22 characters out of that alphabet. The check matters because the token is
 * handed straight to `doc(db, "sharedProjects", token)`, and Firestore joins path
 * segments: until session 35 a `?t=a/b/c` addressed `sharedProjects/a/b/c` — some other
 * document entirely, in a subcollection nothing here is meant to read. The rules would
 * still answer, but a page that builds a data-API path out of an unchecked query
 * parameter is a page that decides what it is asking for by accident.
 */
const SHARE_TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

/** The token, from ?t=… or from the path when the visitor landed on /p/<token> directly. */
function readToken() {
  const q = (new URLSearchParams(location.search).get("t") || "").trim();
  if (q) return SHARE_TOKEN.test(q) ? q : "";
  const m = location.pathname.match(/\/p\/([A-Za-z0-9_-]{16,64})\/?$/);
  return m ? m[1] : "";
}

function money(amountMinor, currencyCode, lang) {
  const major = (Number(amountMinor) || 0) / 100;
  try {
    return new Intl.NumberFormat(lang, { style: "currency", currency: currencyCode || "PLN" }).format(major);
  } catch (e) {
    return major.toFixed(2);
  }
}

function show(id) {
  ["share-loading", "share-notfound", "share-content"].forEach((s) => { $(s).hidden = s !== id; });
}

function render(data) {
  const lang = document.documentElement.lang || "pl";
  const currency = data.currencyCode || "PLN";
  const estimations = Array.isArray(data.estimations) ? data.estimations : [];
  const items = Array.isArray(data.shoppingItems) ? data.shoppingItems : [];

  // `costs` turned PRO on 2026-09-04: a share is priced only when the account that made
  // it could see prices at the moment it did. `creatorLevel` is stamped by shareProject()
  // in assets/app.js from state.level, which /app/ reads from Firebase — a free account
  // cannot use its own share link as a way around the wall. A share made before this field
  // existed carries none, and is treated exactly like "not pro": unpriced, never a guess.
  const priced = data.creatorLevel === "pro";

  $("share-project-name").textContent = data.projectName || "";
  $("share-updated").textContent = data.refreshedAt
    ? `${T("share_refreshed")}: ${new Date(data.refreshedAt).toLocaleDateString(lang)}`
    : "";

  if (!estimations.length && !items.length) {
    $("share-empty").hidden = false;
    $("share-estimations-block").hidden = true;
    $("share-shopping-block").hidden = true;
    show("share-content");
    return;
  }

  $("share-estimations-block").hidden = !estimations.length;
  $("share-estimations").innerHTML = estimations.map((e) => `<li>
      <span class="row-name">${escapeHtml(e.name || "")}
        <em class="muted">${escapeHtml(String(e.requiredUnits ?? ""))} ${escapeHtml(e.unitLabel || "")}</em>
      </span>
      ${priced ? `<b>${escapeHtml(money(e.totalCostMinor, e.currencyCode || currency, lang))}</b>` : ""}
    </li>`).join("");

  // Unpriced: the total line names nothing to add up, so it is not drawn at all rather
  // than left showing a stale or empty amount from a previous render.
  const totalRow = document.getElementById("share-total-row");
  if (priced) {
    const total = estimations.reduce((sum, e) => sum + (Number(e.totalCostMinor) || 0), 0);
    $("share-total").textContent = money(total, currency, lang);
    if (totalRow) totalRow.hidden = false;
  } else if (totalRow) {
    totalRow.hidden = true;
  }

  // The note of chapter XVI travels with the item, because the share is a copy of the
  // whole document (`shareProject()` stores `d.data()`), so a link handed to a client
  // carries "buy in the same shade" along with what to buy — that is `shopping`, and it
  // stays free regardless of `priced`.
  // Chapter XVII's unit price travels the same way: it is the total divided by the
  // quantity, so a client reading the link sees "7 × 35 PLN" rather than one lump sum with
  // no way to check it. Divided here rather than sent, because the document has no field
  // for it — the contract keeps the total and nothing else. PRO since 2026-09-04, so it is
  // computed at all only when `priced` says so.
  const each = (i) => {
    if (!priced) return "";
    const qty = Number(i.quantity) || 0;
    const cost = Number(i.estimatedCostMinor) || 0;
    if (qty <= 0 || cost <= 0) return "";
    return `<em class="muted">× ${escapeHtml(money(Math.round(cost / qty), i.currencyCode || currency, lang))}</em>`;
  };

  $("share-shopping-block").hidden = !items.length;
  $("share-shopping").innerHTML = items.map((i) => `<li${i.isPurchased ? ' class="done"' : ""}>
      <span class="row-name">${escapeHtml(i.name || "")}
        <em class="muted">${escapeHtml(String(i.quantity ?? ""))} ${escapeHtml(i.unit || "")}</em>
        ${each(i)}
        ${i.note ? `<em class="muted">${escapeHtml(i.note)}</em>` : ""}
      </span>
      ${priced ? `<b>${escapeHtml(money(i.estimatedCostMinor, i.currencyCode || currency, lang))}</b>` : ""}
    </li>`).join("");

  show("share-content");
}

async function load() {
  const token = readToken();
  if (!token || !FIREBASE_READY) { show("share-notfound"); return; }

  const [appMod, storeMod] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  const db = storeMod.getFirestore(appMod.initializeApp(FIREBASE_CONFIG));

  const snap = await storeMod.getDoc(storeMod.doc(db, "sharedProjects", token));
  if (!snap.exists()) { show("share-notfound"); return; }
  render(snap.data());
}

document.addEventListener("DOMContentLoaded", () => {
  load().catch(() => show("share-notfound"));
});
