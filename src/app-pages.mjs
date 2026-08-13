/* LiczMat website — the three pages that are not part of the public, indexable layer:
   /app/        the signed-in account: projects, rooms, sync and the account settings
   /app/dashboard/ the dashboard: projects, recent calculations, quick actions, tools
   /p/          the read-only view of a shared estimate

   All three are noindex (robots.txt and a robots meta tag), so they have no per-language
   URLs and no hreflang. Instead they carry the whole four-language dictionary and swap
   text in place — see buildInPlacePicker() in assets/i18n-runtime.js. That is why the
   markup below uses data-i18n attributes while every generated page uses real text. */

import { esc, siteHeader, siteFooter } from "./template.mjs";
import {
  urlCalcIndex, urlHome, urlProjects, urlEstimate,
  DEFAULT_LANG, PLAY_URL, URL_APP, URL_DASHBOARD,
} from "./site.mjs";
import { ACCOUNT_LEVELS, LEVEL, STATUS, route } from "./ia.mjs";

/**
 * The same header and footer as the rest of the site, with a shorter link list: these
 * pages are a tool, not a funnel. Going through src/template.mjs is what gives them the
 * mobile drawer — before session 5 they had none, so on a phone the language and
 * currency pickers sat in a nav that CSS had hidden and no button could open.
 *
 * `inPlace` puts data-i18n on every label: /app/ and /p/ have no per-language URLs and
 * swap text in the DOM (assets/i18n-runtime.js) instead of navigating.
 */
const chrome = (t, bodyMain) => `${siteHeader({
  lang: "pl", t, inPlace: true,
  links: [{ href: urlCalcIndex("pl"), key: "nav_calc" }],
  cta: { href: PLAY_URL, key: "nav_download", target: "_blank", rel: "noopener", loc: "app" },
})}
${bodyMain}
${siteFooter({ lang: "pl", t, minimal: true, inPlace: true })}`;

/** A label + input pair, written once because the account panel is mostly forms. */
const field = (id, labelKey, t, opts = {}) => {
  const { type = "text", autocomplete, minlength, maxlength, required = true } = opts;
  return `<div class="field">
    <label for="${id}" data-i18n="${labelKey}">${esc(t(labelKey))}</label>
    <input id="${id}" type="${type}"${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${minlength ? ` minlength="${minlength}"` : ""}${maxlength ? ` maxlength="${maxlength}"` : ""}${required ? " required" : ""}>
  </div>`;
};

/**
 * "Pamiętaj mnie na tym urządzeniu" — the one control that decides how long the session
 * outlives the tab. Unchecked, /app/ asks Firebase for browserSessionPersistence, so
 * closing the browser signs the visitor out; that is the setting a shared or borrowed
 * computer needs, and until now there was no way to ask for it.
 */
const rememberBox = (id, t) => `<div class="field-check">
    <input id="${id}" type="checkbox" data-remember checked>
    <label for="${id}" data-i18n="app_remember">${esc(t("app_remember"))}</label>
  </div>`;

const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1Z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46Z"/><path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.7Z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9.4 12.2-9.4Z"/></svg>';

/* ------------------------------------------------------------------ /app/ */

/**
 * The three access levels of chapter II, as three cards.
 *
 * Generated from `ACCOUNT_LEVELS` in src/ia.mjs, so the set cannot quietly become two or
 * four, and so the wording of a level is written once for the whole product. Both the
 * signed-out page and the profile tab render this: a guest is told what an account adds,
 * and somebody signed in is told which level they are on.
 *
 * The Pro card never carries a button. `/liczmat-pro/` is built in session 29, and the
 * `plan` field that would grant the level is server-side only with nothing to write it
 * yet (FIRESTORE_SYNC §9.2) — a "buy" button would be a promise the product cannot keep.
 *
 * @param {(k:string)=>string} t
 * @param {string} current the level this copy of the list should mark, "" for none
 */
function levelCards(t, current) {
  const cards = ACCOUNT_LEVELS.map((entry) => {
    const bullets = entry.can
      .map((key) => `<li data-i18n="${key}">${esc(t(key))}</li>`).join("");
    const r = entry.route ? route(entry.route) : null;
    const soon = r && r.status !== STATUS.LIVE
      ? `<p class="lvl-soon" data-i18n="door_soon">${esc(t("door_soon"))}</p>` : "";

    const here = entry.level === current;
    return `<article class="lvl-card" data-level="${entry.level}"${here ? ' data-current="1"' : ""}>
        <span class="lvl-badge chip" data-i18n="acc_you_are"${here ? "" : " hidden"}>${esc(t("acc_you_are"))}</span>
        <h3 data-i18n="${entry.key}_t">${esc(t(`${entry.key}_t`))}</h3>
        <p class="muted" data-i18n="${entry.key}_d">${esc(t(`${entry.key}_d`))}</p>
        <ul class="lvl-can">${bullets}</ul>
        ${soon}
      </article>`;
  }).join("\n      ");

  return `<div class="lvl-cards" data-levels>
      ${cards}
    </div>`;
}

export function appMain(t) {
  const i = (key, tag = "span", cls = "") =>
    `<${tag}${cls ? ` class="${cls}"` : ""} data-i18n="${key}">${esc(t(key))}</${tag}>`;

  const tab = (id, key, first) =>
    `<button type="button" class="app-tab" role="tab" id="tab-${id}" aria-controls="panel-${id}" data-tab="${id}" aria-selected="${first ? "true" : "false"}" tabindex="${first ? "0" : "-1"}" data-i18n="${key}">${esc(t(key))}</button>`;

  /** One row of the profile's read-only facts. The value is filled in by assets/app.js. */
  const fact = (id, key) =>
    `<div class="fact"><dt data-i18n="${key}">${esc(t(key))}</dt><dd id="${id}">—</dd></div>`;

  const main = `<main id="main">
  <section class="block page-head">
    <div class="wrap narrow">
      <h1 data-i18n="app_title">${esc(t("app_title"))}</h1>
      <p class="lead" data-i18n="app_lead">${esc(t("app_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <p id="app-config-missing" class="result err show" hidden data-i18n="app_err_config">${esc(t("app_err_config"))}</p>
      <p id="app-status" class="result show" role="status" aria-live="polite" hidden></p>

      <div id="app-auth">
        <div class="calc">
          <!-- Three views, one card. Sign-in and sign-up are separate forms rather than
               one form with a toggled label: they want different autocomplete hints, and
               a browser offering to save a password only gets that right when the form
               says which of the two it is. Resetting a password had no field of its own
               at all and borrowed the sign-in one, which failed when it was empty. -->
          <div data-auth-view="signin">
            <h2 data-i18n="app_signin">${esc(t("app_signin"))}</h2>
            <form id="signin-form" autocomplete="on">
              ${field("signin-email", "app_email", t, { type: "email", autocomplete: "email" })}
              ${field("signin-password", "app_password", t, { type: "password", autocomplete: "current-password", minlength: 6 })}
              ${rememberBox("signin-remember", t)}
              <button type="submit" class="btn btn-primary" data-i18n="app_signin">${esc(t("app_signin"))}</button>
            </form>
            <p class="auth-links">
              <button type="button" class="linkish" data-auth-go="reset" data-i18n="app_forgot">${esc(t("app_forgot"))}</button>
              <button type="button" class="linkish" data-auth-go="signup" data-i18n="app_switch_signup">${esc(t("app_switch_signup"))}</button>
            </p>
          </div>

          <div data-auth-view="signup" hidden>
            <h2 data-i18n="app_signup_t">${esc(t("app_signup_t"))}</h2>
            <p class="muted" data-i18n="app_signup_d">${esc(t("app_signup_d"))}</p>
            <form id="signup-form" autocomplete="on">
              ${field("signup-email", "app_email", t, { type: "email", autocomplete: "email" })}
              ${field("signup-password", "app_password", t, { type: "password", autocomplete: "new-password", minlength: 6 })}
              ${i("app_password_rule", "p", "muted field-note")}
              ${rememberBox("signup-remember", t)}
              <button type="submit" class="btn btn-primary" data-i18n="app_signup">${esc(t("app_signup"))}</button>
            </form>
            <p class="auth-links">
              <button type="button" class="linkish" data-auth-go="signin" data-i18n="app_switch_signin">${esc(t("app_switch_signin"))}</button>
            </p>
            ${i("app_signup_free", "p", "muted field-note")}
          </div>

          <div data-auth-view="reset" hidden>
            <h2 data-i18n="app_reset_t">${esc(t("app_reset_t"))}</h2>
            <p class="muted" data-i18n="app_reset_d">${esc(t("app_reset_d"))}</p>
            <form id="reset-form" autocomplete="on">
              ${field("reset-email", "app_email", t, { type: "email", autocomplete: "email" })}
              <button type="submit" class="btn btn-primary" data-i18n="app_reset_send">${esc(t("app_reset_send"))}</button>
            </form>
            <p class="auth-links">
              <button type="button" class="linkish" data-auth-go="signin" data-i18n="app_back_signin">${esc(t("app_back_signin"))}</button>
            </p>
          </div>

          <div id="auth-google-box">
            <div class="auth-sep">${i("app_or")}</div>
            <button type="button" id="auth-google" class="btn btn-ghost auth-google">
              ${GOOGLE_G}${i("app_google")}
            </button>
          </div>
          <p class="muted auth-note" data-i18n="app_auth_note">${esc(t("app_auth_note"))}</p>
        </div>

        <!-- Chapter II, for somebody who has not signed in yet: what a guest already
             gets, what the free account adds, and what Pro is going to be. -->
        <section class="app-levels" aria-labelledby="acc-levels-h">
          <h2 id="acc-levels-h" data-i18n="acc_levels_t">${esc(t("acc_levels_t"))}</h2>
          <p class="muted" data-i18n="acc_levels_d">${esc(t("acc_levels_d"))}</p>
          ${levelCards(t, LEVEL.GUEST)}
        </section>
      </div>

      <div id="app-workspace" hidden>
        <div class="app-bar">
          <span class="app-identity">
            <b id="app-who"></b>
            <span id="app-level" class="chip"></span>
            <span id="app-provider" class="chip"></span>
            <span id="app-verified" class="chip"></span>
          </span>
          <span class="app-bar-actions">
            <!-- Session 14: the dashboard is where somebody signed in actually starts —
                 projects, the last calculations and the tools they use. /app/ is the
                 settings, so it points at it rather than being it. -->
            <a class="btn btn-ghost btn-sm" href="${URL_DASHBOARD}" data-i18n="nav_dashboard">${esc(t("nav_dashboard"))}</a>
            <button type="button" id="app-signout" class="btn btn-ghost btn-sm" data-i18n="app_signout">${esc(t("app_signout"))}</button>
          </span>
        </div>

        <!-- Where the visitor came from, when they arrived at a sign-up prompt under a
             calculator result. Shown only after signing in, and only for a path on this
             site — see lmSafeNext() in assets/account.js. -->
        <p id="app-next" class="app-next" hidden>
          <a id="app-next-link" class="btn btn-primary btn-sm" href="/" data-i18n="app_back_to">${esc(t("app_back_to"))}</a>
        </p>

        <div class="app-tabs" role="tablist" aria-label="${esc(t("app_tabs_label"))}" data-i18n-aria="app_tabs_label">
          ${tab("projects", "app_tab_projects", true)}
          ${tab("rooms", "app_tab_rooms")}
          ${tab("sync", "app_tab_sync")}
          ${tab("profile", "app_tab_profile")}
          ${tab("account", "app_tab_account")}
        </div>

        <section data-panel="projects" id="panel-projects" role="tabpanel" aria-labelledby="tab-projects" tabindex="0">
          <h2 data-i18n="app_projects">${esc(t("app_projects"))}</h2>
          <form id="project-form" class="inline-form">
            <input id="project-name" type="text" maxlength="120" placeholder="${esc(t("app_new_project"))}" data-i18n-ph="app_new_project" required>
            <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_add">${esc(t("app_add"))}</button>
          </form>
          <ul id="project-list" class="data-list"></ul>
          ${i("app_share_hint", "p", "muted")}
        </section>

        <section data-panel="rooms" id="panel-rooms" role="tabpanel" aria-labelledby="tab-rooms" tabindex="0" hidden>
          <h2 data-i18n="app_rooms">${esc(t("app_rooms"))}</h2>
          <form id="room-form" class="inline-form">
            <input id="room-name" type="text" maxlength="120" placeholder="${esc(t("app_new_room"))}" data-i18n-ph="app_new_room" required>
            <input id="room-length" type="text" inputmode="decimal" value="5" aria-label="${esc(t("fld_length"))}">
            <input id="room-width" type="text" inputmode="decimal" value="4" aria-label="${esc(t("fld_width"))}">
            <input id="room-height" type="text" inputmode="decimal" value="2.6" aria-label="${esc(t("fld_height"))}">
            <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_add">${esc(t("app_add"))}</button>
          </form>
          <ul id="room-list" class="data-list"></ul>
        </section>

        <section data-panel="sync" id="panel-sync" role="tabpanel" aria-labelledby="tab-sync" tabindex="0" hidden>
          <h2 data-i18n="app_sync_title">${esc(t("app_sync_title"))}</h2>
          ${i("app_sync_d", "p", "muted")}
          <p id="app-sync-local" class="muted"></p>
          <p class="ws-links">
            <button type="button" id="app-sync-push" class="btn btn-primary btn-sm" data-i18n="app_sync_push">${esc(t("app_sync_push"))}</button>
            <button type="button" id="app-sync-pull" class="btn btn-ghost btn-sm" data-i18n="app_sync_pull">${esc(t("app_sync_pull"))}</button>
          </p>
          ${i("app_sync_note", "p", "muted src-note")}
        </section>

        <section data-panel="profile" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" tabindex="0" hidden>
          <h2 data-i18n="prof_title">${esc(t("prof_title"))}</h2>

          <div class="app-card">
            <h3 data-i18n="prof_facts">${esc(t("prof_facts"))}</h3>
            <dl class="facts">
              ${fact("prof-email", "app_email")}
              ${fact("prof-provider", "prof_provider")}
              ${fact("prof-created", "prof_created")}
              ${fact("prof-seen", "prof_seen")}
            </dl>
          </div>

          <form id="name-form" class="app-card">
            <h3 data-i18n="prof_name_t">${esc(t("prof_name_t"))}</h3>
            ${i("prof_name_d", "p", "muted")}
            ${field("prof-name", "prof_name", t, { maxlength: 60, autocomplete: "name", required: false })}
            <button type="submit" class="btn btn-ghost btn-sm" data-i18n="app_save">${esc(t("app_save"))}</button>
          </form>

          <div class="app-card">
            <h3 data-i18n="prof_level_t">${esc(t("prof_level_t"))}</h3>
            ${i("prof_level_d", "p", "muted")}
            ${levelCards(t, "")}
          </div>

          <div class="app-card">
            <h3 data-i18n="prof_session_t">${esc(t("prof_session_t"))}</h3>
            ${i("prof_session_d", "p", "muted")}
            <div class="field-check">
              <input id="prof-remember" type="checkbox" checked>
              <label for="prof-remember" data-i18n="app_remember">${esc(t("app_remember"))}</label>
            </div>
            <p id="prof-session-state" class="muted field-note"></p>
            <button type="button" id="prof-signout" class="btn btn-ghost btn-sm" data-i18n="app_signout">${esc(t("app_signout"))}</button>
          </div>
        </section>

        <section data-panel="account" id="panel-account" role="tabpanel" aria-labelledby="tab-account" tabindex="0" hidden>
          <h2 data-i18n="app_sec_title">${esc(t("app_sec_title"))}</h2>

          <div id="app-verify-row" class="app-card" hidden>
            ${i("app_verify_d", "p", "muted")}
            <button type="button" id="app-verify-send" class="btn btn-ghost btn-sm" data-i18n="app_verify_send">${esc(t("app_verify_send"))}</button>
          </div>

          <form id="email-form" class="app-card">
            <h3 data-i18n="app_change_email">${esc(t("app_change_email"))}</h3>
            ${field("email-new", "app_new_email", t, { type: "email", autocomplete: "email" })}
            ${field("email-password", "app_current_password", t, { type: "password", autocomplete: "current-password" })}
            <button type="submit" class="btn btn-ghost btn-sm" data-i18n="app_save">${esc(t("app_save"))}</button>
          </form>

          <form id="password-form" class="app-card">
            <h3 data-i18n="app_change_password">${esc(t("app_change_password"))}</h3>
            ${field("password-current", "app_current_password", t, { type: "password", autocomplete: "current-password" })}
            ${field("password-new", "app_new_password", t, { type: "password", autocomplete: "new-password", minlength: 6 })}
            <button type="submit" class="btn btn-ghost btn-sm" data-i18n="app_save">${esc(t("app_save"))}</button>
          </form>

          <div class="app-card">
            <h3 data-i18n="app_export">${esc(t("app_export"))}</h3>
            ${i("app_export_d", "p", "muted")}
            <button type="button" id="app-export" class="btn btn-ghost btn-sm" data-i18n="app_export_btn">${esc(t("app_export_btn"))}</button>
          </div>

          <div class="app-card danger">
            <h3 data-i18n="app_delete_account">${esc(t("app_delete_account"))}</h3>
            ${i("app_delete_account_d", "p", "muted")}
            <div class="field" id="app-delete-password-field">
              <label for="delete-password" data-i18n="app_current_password">${esc(t("app_current_password"))}</label>
              <input id="delete-password" type="password" autocomplete="current-password">
            </div>
            <button type="button" id="app-delete-account" class="btn btn-danger btn-sm" data-i18n="app_delete_account">${esc(t("app_delete_account"))}</button>
          </div>
        </section>
      </div>
    </div>
  </section>
</main>`;
  return chrome(t, main);
}

/* ------------------------------------------------------------------ /app/dashboard/ */

/**
 * The four quick actions — chapter XIV's "szybkie akcje".
 *
 * They are real links, rendered by the build with the Polish URL, and not one of them
 * needs a script to work; assets/dashboard.js only swaps the href when the visitor
 * switches language, because this page has no per-language address of its own.
 *
 *   url   the key in window.LM_URLS that holds this link's address per language, or
 *         null for a language-neutral page whose href is already final.
 *   key   dictionary prefix: `<key>` is the label, `<key>_d` the line under it.
 *   icon  a stroke path on the shared 24×24 grid, like calcIcon() in src/template.mjs.
 */
/**
 * The address each `data-dash-url` link is written with.
 *
 * The dashboard has no per-language URL, so its links cannot be right in four languages
 * at once; assets/dashboard.js repoints them from window.LM_DASH when the visitor
 * switches. Rendering the default language rather than a placeholder is what makes them
 * work with no script at all — the one part of this page that does.
 */
const DASH_HREF = {
  calculators: urlCalcIndex(DEFAULT_LANG),
  projects: urlProjects(DEFAULT_LANG),
  estimate: urlEstimate(DEFAULT_LANG),
};

const QUICK_ACTIONS = [
  {
    id: "calc", url: "calculators", key: "dash_q_calc",
    // A calculator: a small display over a keypad.
    icon: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M7.5 6.5h9v3.5h-9z"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  },
  {
    id: "projects", url: "projects", key: "dash_q_projects",
    // A folder.
    icon: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  },
  {
    id: "estimate", url: "estimate", key: "dash_q_estimate",
    // A priced list.
    icon: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  },
  {
    id: "account", url: null, href: URL_APP, key: "dash_q_account",
    // Two arrows going round: synchronisation.
    icon: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
  },
];

/**
 * The dashboard of the free account — session 14, chapter XIV of the sessions list:
 * projects, recent calculations, quick actions, recently used tools.
 *
 * Everything on it comes out of this browser: `assets/workspace.js` (projects, rooms and
 * estimate lines, in the Firestore document shape) and `assets/recent.js` (which
 * calculators were used). **No Firebase.** That is the whole point of the page — it is
 * the first screen after signing in, and making it wait for an SDK download and an auth
 * round-trip before it can list somebody's own local projects would be slower than the
 * calculator it came from. The level shown in the strip is the copy hint from
 * assets/account.js, which is a hint and never a gate: a guest sees their own data and a
 * card explaining what an account adds, not a locked door.
 *
 * The lists are drawn by assets/dashboard.js. What the build renders is the frame — the
 * headings, the quick actions as real links, and one empty state per section — so the
 * page is readable and navigable before a single list has been filled in.
 */
export function dashboardMain(t) {
  const i = (key, tag = "span", cls = "") =>
    `<${tag}${cls ? ` class="${cls}"` : ""} data-i18n="${key}">${esc(t(key))}</${tag}>`;

  const quick = QUICK_ACTIONS.map((a) => `<li><a class="calc-link" href="${a.href || DASH_HREF[a.url]}"${
    a.url ? ` data-dash-url="${a.url}"` : ""}>
        <span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a.icon}</svg></span>
        <span class="calc-link-body">
          <b data-i18n="${a.key}">${esc(t(a.key))}</b>
          <span class="muted" data-i18n="${a.key}_d">${esc(t(`${a.key}_d`))}</span>
        </span>
      </a></li>`).join("\n        ");

  /** A section with a heading, a "see all" link beside it and a list the script fills. */
  const section = (id, titleKey, allKey, urlKey, listClass) =>
    `<section class="dash-sec" aria-labelledby="dash-${id}-h">
        <div class="dash-head">
          <h2 id="dash-${id}-h" data-i18n="${titleKey}">${esc(t(titleKey))}</h2>
          <a class="dash-more" href="${DASH_HREF[urlKey]}" data-dash-url="${urlKey}" data-i18n="${allKey}">${esc(t(allKey))}</a>
        </div>
        <ul class="${listClass}" id="dash-${id}"></ul>
      </section>`;

  const main = `<main id="main">
  <section class="block page-head">
    <div class="wrap">
      <h1 data-i18n="dash_title">${esc(t("dash_title"))}</h1>
      <p class="lead" data-i18n="dash_lead">${esc(t("dash_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap">
      <!-- Which of chapter II's three levels this browser was last told it is on. It is
           a hint (assets/account.js), so it words the strip and nothing else. -->
      <div class="app-bar">
        <span class="app-identity">
          <span id="dash-level" class="chip">${esc(t("acc_guest_t"))}</span>
          <span class="muted" id="dash-level-note" data-dash-note>${esc(t("dash_level_guest"))}</span>
        </span>
        <a class="btn btn-ghost btn-sm" href="${URL_APP}" data-i18n="dash_q_account">${esc(t("dash_q_account"))}</a>
      </div>

      <!-- Chapter II: registration is the next step after a result, never a barrier. The
           card is what a guest sees; assets/dashboard.js hides it once the hint says
           somebody signed in. It opens the sign-up form and comes back here. -->
      <div class="app-card" id="dash-signup">
        <h3 data-i18n="dash_guest_t">${esc(t("dash_guest_t"))}</h3>
        ${i("dash_guest_d", "p", "muted")}
        <a class="btn btn-primary btn-sm" href="${URL_APP}?mode=signup&amp;next=${encodeURIComponent(URL_DASHBOARD)}" data-i18n="dash_guest_go">${esc(t("dash_guest_go"))}</a>
      </div>

      <section class="dash-sec" aria-labelledby="dash-quick-h">
        <h2 id="dash-quick-h" data-i18n="dash_quick_t">${esc(t("dash_quick_t"))}</h2>
        <ul class="calc-links dash-quad">
        ${quick}
        </ul>
      </section>

      ${section("projects", "dash_projects_t", "dash_projects_all", "projects", "data-list")}

      ${section("recent", "dash_recent_t", "dash_recent_all", "estimate", "data-list")}

      <section class="dash-sec" aria-labelledby="dash-tools-h">
        <div class="dash-head">
          <h2 id="dash-tools-h" data-i18n="dash_tools_t">${esc(t("dash_tools_t"))}</h2>
          <a class="dash-more" href="${DASH_HREF.calculators}" data-dash-url="calculators" data-i18n="dash_tools_all">${esc(t("dash_tools_all"))}</a>
        </div>
        <ul class="calc-links dash-quad" id="dash-tools"></ul>
        <!-- The list is the visitor's own history of which tools they opened, so they get
             to delete it, on the page that shows it. Hidden while there is nothing to
             forget — chapter XXV: no button that does nothing. -->
        <p><button type="button" class="linkish" id="dash-tools-forget" data-i18n="dash_tools_forget" hidden>${esc(t("dash_tools_forget"))}</button></p>
      </section>

      ${i("dash_local_note", "p", "muted src-note")}
    </div>
  </section>
</main>`;
  return chrome(t, main);
}

/** Every dictionary key the dashboard renders, so the build can check all four languages. */
export const dashboardKeys = () => [
  "dash_title", "dash_lead", "dash_level_guest", "dash_level_in", "dash_level_pro",
  "dash_guest_t", "dash_guest_d", "dash_guest_go",
  "dash_quick_t", "dash_projects_t", "dash_projects_all", "dash_projects_empty",
  "dash_recent_t", "dash_recent_all", "dash_recent_empty",
  "dash_tools_t", "dash_tools_all", "dash_tools_empty", "dash_tools_forget",
  "dash_open", "dash_mixed", "dash_local_note", "nav_dashboard",
  ...QUICK_ACTIONS.flatMap((a) => [a.key, `${a.key}_d`]),
];

/* ------------------------------------------------------------------ /p/<token> */

export function shareMain(t) {
  const main = `<main id="main">
  <section class="block page-head">
    <div class="wrap narrow">
      <h1 data-i18n="share_title">${esc(t("share_title"))}</h1>
      <p class="lead" data-i18n="share_lead">${esc(t("share_lead"))}</p>
    </div>
  </section>

  <section class="block alt">
    <div class="wrap narrow">
      <p id="share-loading" class="muted" data-i18n="share_loading">${esc(t("share_loading"))}</p>
      <p id="share-notfound" class="result err show" hidden data-i18n="share_notfound">${esc(t("share_notfound"))}</p>

      <div id="share-content" hidden>
        <h2 id="share-project-name"></h2>
        <p class="muted" id="share-updated"></p>
        <p id="share-empty" class="muted" hidden data-i18n="share_empty">${esc(t("share_empty"))}</p>

        <div id="share-estimations-block" hidden>
          <h3 data-i18n="share_estimations">${esc(t("share_estimations"))}</h3>
          <ul id="share-estimations" class="data-list"></ul>
          <p class="share-total"><span data-i18n="share_total">${esc(t("share_total"))}</span> <b id="share-total"></b></p>
        </div>

        <div id="share-shopping-block" hidden>
          <h3 data-i18n="share_shopping">${esc(t("share_shopping"))}</h3>
          <ul id="share-shopping" class="data-list"></ul>
        </div>

        <p class="muted mt-6" data-i18n="share_owner_note">${esc(t("share_owner_note"))}</p>
        <p><a class="btn btn-ghost" href="${urlHome("pl")}" data-i18n="bc_home">${esc(t("bc_home"))}</a></p>
      </div>
    </div>
  </section>
</main>`;
  return chrome(t, main);
}

export const APP_PATH = URL_APP;
