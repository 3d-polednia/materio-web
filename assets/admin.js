/* LiczMat website — the admin panel on /app/: LiczMat Pro by e-mail, without a terminal.
 *
 * Session 49. `users/{uid}.plan` is a server-only field — the deployed rules let a browser
 * write nothing in a profile but `lastSeenAt` and `appVersion` — so this file writes no
 * plan and never tries. It fills in a form and calls `adminPlan`, the callable in
 * `functions/index.js`, which runs with administrator rights and checks who is asking
 * before it does anything. Everything it can be asked is in `functions/admin-map.mjs`.
 *
 * ─── WHY IT IS FETCHED RATHER THAN SHIPPED ──────────────────────────────────
 * `/app/` carries none of this in its markup and never downloads this file unless the
 * signed-in account's ID token says `admin: true`; assets/app.js imports it at that point
 * and at no other. Two reasons, and the second is the one that decided it:
 *
 *   - weight. /app/ is the heaviest page on the site (scripts/test-perf.mjs) and this
 *     panel exists for one account. A tool for one person may not cost 375 pages a byte.
 *   - language. Every string a visitor can read is in ten languages, in a dictionary every
 *     page downloads. This is not copy for a visitor: it is the browser half of
 *     `scripts/pro-admin.mjs`, which prints Polish and only Polish, and putting its
 *     twenty labels into that dictionary would translate an internal tool into nine
 *     languages nobody will read it in, on every page load on the site.
 *
 * So the panel is Polish, written here, and it is the one screen on this site that is.
 *
 * ─── IT DECIDES NOTHING ─────────────────────────────────────────────────────
 * Showing the panel is a convenience. Somebody who edits the claim in their own browser
 * sees it and gets `permission-denied` on every click, because the only check that means
 * anything is `isAdmin(request.auth.token)` in the function, and the claim is part of a
 * token Google signed. Same rule as the paywall: the browser decides what to SHOW.
 */

import { FIREBASE_SDK } from "./firebase-config.js";

/** The region the functions are deployed to — the same constant as functions/index.js. */
const REGION = "europe-central2";

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "2027-08-27", or a dash. A calendar day is all a plan's end is ever read as here. */
const day = (ms) => {
  if (!ms) return "—";
  const d = new Date(Number(ms));
  return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
};

/** Local date and time, or a dash. */
const when = (ms) => {
  const d = new Date(Number(ms));
  if (!ms || isNaN(d.getTime())) return "—";
  const two = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

const platform = (value) => value === "web" ? "strona"
  : typeof value === "string" && value ? `Android ${value}` : "—";

const login = (providers) => Array.isArray(providers) && providers.length
  ? providers.map((value) => value === "google.com" ? "Google"
    : value === "password" ? "hasło" : value).join(" + ")
  : "—";

/**
 * One account's plan, in one line.
 *
 * `expired` is a word of its own rather than "free" for the same reason `lmPlanStatus()`
 * keeps it: an account whose Pro ran out yesterday and an account that never had one look
 * identical in the `plan` field alone, and only one of them is worth a conversation.
 */
function planLine(acc) {
  const sources = { trial: "okres próbny", stripe: "Stripe", manual: "ręcznie" };
  const source = sources[acc.source] ? ` (${sources[acc.source]})` : "";
  if (acc.state === "expired") return `Pro — wygasł ${day(acc.validUntil)}${source}`;
  if (acc.state === "pro") {
    return `Pro do ${day(acc.validUntil)}${acc.renews ? ", odnawia się" : ""}${source}`;
  }
  return "Free";
}

/**
 * What went wrong, said in Polish.
 *
 * The function answers with codes, not sentences: it runs in one region for a page that
 * can be open in any of ten languages, so the words belong on this side. An unknown code
 * is printed as it came — a message nobody wrote is better than a message that is wrong.
 */
function errorText(err) {
  const code = String((err && err.message) || "");
  const map = {
    "not-admin": "To konto nie ma uprawnień administratora.",
    "no-account": "Nie ma konta o tym adresie.",
    "bad-email": "To nie wygląda na adres e-mail.",
    "bad-months": "Liczba miesięcy ma być całkowita, od 1 do 120.",
    "bad-action": "Nieznane polecenie.",
  };
  if (map[code]) return map[code];
  if (err && err.code === "functions/unauthenticated") return map["not-admin"];
  if (err && err.code === "functions/internal") {
    return "Funkcja nie odpowiedziała. Sprawdź, czy jest wdrożona — docs/ADMIN.md.";
  }
  return `Nie udało się: ${code || "brak połączenia"}.`;
}

const PANEL = `
  <h2>Panel administratora</h2>
  <p class="muted">Nadaje i odbiera LiczMat Pro po adresie e-mail. Zapis wykonuje funkcja
    <code>adminPlan</code> w chmurze — ta strona o niczym nie decyduje i sama nic nie
    zapisuje. Panel jest po polsku, bo jest narzędziem, a nie stroną dla odwiedzającego.</p>

  <div class="app-card">
    <h3>Konto</h3>
    <div class="field">
      <label for="admin-email">Adres e-mail konta</label>
      <input id="admin-email" type="email" autocomplete="off" maxlength="254"
        placeholder="ktos@example.com">
    </div>
    <div class="field">
      <label for="admin-months">Na ile miesięcy (1–120)</label>
      <input id="admin-months" type="text" inputmode="numeric" maxlength="3" value="12">
    </div>
    <p class="ws-links">
      <button type="button" id="admin-status" class="btn btn-ghost btn-sm">Sprawdź konto</button>
      <button type="button" id="admin-grant" class="btn btn-primary btn-sm">Nadaj Pro</button>
      <button type="button" id="admin-revoke" class="btn btn-danger btn-sm">Cofnij Pro</button>
    </p>
    <p class="muted field-note">Plan nadany ręcznie nie odnawia się sam: po tej dacie konto
      wraca do LiczMat, a strona powie, dlaczego.</p>
  </div>

  <p id="admin-result" class="result show" role="status" aria-live="polite" hidden></p>

  <div class="app-card" id="admin-detail" hidden></div>

  <div class="app-card">
    <h3>Wszystkie konta</h3>
    <p class="muted">Adres, logowanie, aktywność, profil i plan. Kliknij adres, żeby zobaczyć
      szczegóły. Lista jest czytana na żądanie — nic się nie odświeża samo.</p>
    <p class="ws-links">
      <button type="button" id="admin-list" class="btn btn-ghost btn-sm">Wypisz konta</button>
    </p>
    <div class="table-scroll"><table id="admin-table" class="ws-table" hidden>
      <thead><tr><th scope="col">E-mail</th><th scope="col">Plan</th>
        <th scope="col">Profil</th><th scope="col">Logowanie</th>
        <th scope="col">Ostatnio</th><th scope="col">Pierwsze wejście</th>
        <th scope="col">Założone</th></tr></thead>
      <tbody></tbody>
    </table></div>
  </div>`;

/**
 * Put the tab and the panel into the page, and wire them.
 *
 * Called once per sign-in, by assets/app.js, and only for an account whose token carries
 * the claim. It is idempotent: a second call finds the tab already there and returns, so a
 * token refresh cannot leave two panels in the sidebar.
 *
 * @param {object} ctx.app  the initialized Firebase app, from assets/app.js
 */
export async function mountAdmin({ app }) {
  if (document.getElementById("tab-admin")) return;

  // The sidebar nav. A wrong selector here is silent because mountAdmin() 
  // returns on null, leaving the real admin without a panel.
  const strip = document.querySelector(".app-nav");
  const main = document.querySelector("#app-workspace .app-main");
  if (!strip || !main) return;

  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "app-nav-item";
  tab.id = "tab-admin";
  tab.dataset.tab = "admin";
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", "panel-admin");
  tab.setAttribute("aria-selected", "false");
  tab.tabIndex = -1;
  tab.textContent = "Admin";
  strip.appendChild(tab);

  const panel = document.createElement("section");
  panel.id = "panel-admin";
  panel.dataset.panel = "admin";
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", "tab-admin");
  panel.tabIndex = 0;
  panel.hidden = true;
  panel.innerHTML = PANEL;
  main.appendChild(panel);

  const { getFunctions, httpsCallable } = await import(`${FIREBASE_SDK}/firebase-functions.js`);
  const callable = httpsCallable(getFunctions(app, REGION), "adminPlan");

  const $ = (id) => document.getElementById(id);
  const out = $("admin-result");
  const say = (message, isError) => {
    out.textContent = message;
    out.classList.toggle("err", Boolean(isError));
    out.hidden = !message;
  };

  /** One call, with the buttons dead while it is in flight. */
  const busy = { on: false };
  async function call(payload) {
    if (busy.on) return null;
    busy.on = true;
    panel.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    say("Czekam na odpowiedź…");
    try {
      const res = await callable(payload);
      return (res && res.data) || null;
    } catch (err) {
      say(errorText(err), true);
      return null;
    } finally {
      busy.on = false;
      panel.querySelectorAll("button").forEach((b) => { b.disabled = false; });
    }
  }

  const emailValue = () => $("admin-email").value.trim();

  const firstEntry = (acc) => acc.firstApp ? platform(acc.firstApp)
    : acc.profileByServer ? "serwer" : "—";
  const verified = (acc) => acc.emailVerified === true ? "potwierdzony"
    : acc.emailVerified === false ? "niepotwierdzony" : "";
  let detailAccount = null;
  const drawDetails = (acc, previousCounts) => {
    if (!acc) return;
    const detail = $("admin-detail");
    const counts = Object.prototype.hasOwnProperty.call(acc, "counts") ? acc.counts : previousCounts;
    const rows = [
      ["UID", acc.uid || "—"],
      ["E-mail potwierdzony", acc.emailVerified === true ? "tak" : acc.emailVerified === false ? "nie" : "—"],
      ["Logowanie", login(acc.providers)],
      ["Założone (Auth)", when(acc.createdAt)],
      ["Ostatnie logowanie", when(acc.lastSignInAt)],
      ["Ostatnio w LiczMat", acc.lastApp
        ? `${when(acc.lastSeenAt)}, ${platform(acc.lastApp)}` : when(acc.lastSeenAt)],
      ["Pierwsze wejście", firstEntry(acc)],
      ["Profil w bazie", acc.hasProfile === true ? "jest" : acc.hasProfile === false ? "brak" : "—"],
      ["Plan", planLine(acc)],
      ["Panel admina", acc.admin ? "tak" : "nie"],
    ];
    const countLabels = [
      ["projects", "Projekty"], ["rooms", "Pomieszczenia"],
      ["estimations", "Kalkulacje"], ["shoppingItems", "Pozycje na listach zakupów"],
      ["clients", "Klienci"], ["quotes", "Wyceny"], ["materials", "Własne materiały"],
    ];
    const list = rows.map(([label, value]) => `<div class="fact"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
    const countList = counts && typeof counts === "object"
      ? countLabels.map(([key, label]) => `<div class="fact"><dt>${esc(label)}</dt><dd>${esc(Number.isInteger(counts[key]) ? counts[key] : "—")}</dd></div>`).join("")
      : "";
    const unavailable = countList ? "" : "<p class=\"muted\">Liczby niedostępne.</p>";
    const note = acc.hasProfile === false
      ? "<p class=\"muted\">Brak profilu: konto nie dostało okresu próbnego. Zwykle to aplikacja, w której synchronizacja czeka na wybór użytkownika.</p>"
      : "";
    detail.innerHTML = `<h3 class="app-identity"><b>Konto: ${esc(acc.email || "—")}</b></h3><dl class="facts">${list}${countList}</dl>${unavailable}${note}`;
    detail.hidden = false;
    detailAccount = { ...acc, counts: counts || null };
  };

  const showAccount = (data, prefix) => {
    if (!data || !data.account) return;
    say(`${prefix}${data.account.email}: ${planLine(data.account)}`);
    if (data.action === "status") drawDetails(data.account, null);
    else if (detailAccount && detailAccount.email === data.account.email) {
      drawDetails(data.account, detailAccount.counts);
    }
  };

  $("admin-status").addEventListener("click", async () => {
    const data = await call({ action: "status", email: emailValue() });
    showAccount(data, "");
  });

  $("admin-grant").addEventListener("click", async () => {
    const data = await call({
      action: "grant", email: emailValue(), months: Number($("admin-months").value.trim()),
    });
    showAccount(data, "Nadane. ");
  });

  /* The one destructive button on the panel: it takes away access somebody may have paid
     for. The same `confirm()` guards the device wipe and the account deletion. */
  $("admin-revoke").addEventListener("click", async () => {
    const email = emailValue();
    if (!email || !confirm(`Cofnąć LiczMat Pro dla ${email}?`)) return;
    const data = await call({ action: "revoke", email });
    showAccount(data, "Cofnięte. ");
  });

  $("admin-list").addEventListener("click", async () => {
    const data = await call({ action: "list" });
    if (!data) return;
    const table = $("admin-table");
    /* Seven columns, the plan second: nine did not fit beside the sidebar at 1280 px and the
       plan was the one scrolled out of sight. Dates never break at their hyphens. */
    const rows = (data.accounts || []).map((acc) => `<tr>
        <td><button type="button" class="btn linkish" data-admin-email="${esc(acc.email)}">${esc(acc.email)}${acc.admin ? " (admin)" : ""}${acc.disabled ? " (zablokowane)" : ""}</button></td>
        <td>${esc(planLine(acc)).replace(/\d{4}-\d{2}-\d{2}/, '<span class="num">$&</span>')}</td>
        <td>${acc.hasProfile === false ? "<strong>brak</strong>" : acc.hasProfile === true ? "jest" : "—"}</td>
        <td>${esc(login(acc.providers))}${verified(acc) ? `<br><span class="muted">${verified(acc)}</span>` : ""}</td>
        <td><span class="num">${esc(when(acc.lastSeenAt ?? acc.lastSignInAt))}</span>${acc.lastApp ? `, ${esc(platform(acc.lastApp))}` : ""}</td>
        <td>${esc(firstEntry(acc))}</td>
        <td><span class="num">${esc(when(acc.createdAt))}</span></td>
      </tr>`).join("");
    table.querySelector("tbody").innerHTML = rows
      || '<tr><td colspan="7">Brak kont.</td></tr>';
    table.hidden = false;
    const n = (data.accounts || []).length;
    say(`${n} ${n === 1 ? "konto" : "kont"}${data.more ? " (pierwsza strona)" : ""}.`);
  });

  $("admin-table").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-email]");
    if (!button) return;
    const email = button.dataset.adminEmail || "";
    $("admin-email").value = email;
    const data = await call({ action: "status", email });
    showAccount(data, "");
  });
}
