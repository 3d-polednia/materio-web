/* LiczMat website — the two pages that are not part of the public, indexable layer:
   /app/  the signed-in account: projects, rooms, sync and the account settings
   /p/    the read-only view of a shared estimate

   Both are noindex (robots.txt and a robots meta tag), so they have no per-language URLs
   and no hreflang. Instead they carry the whole ten-language dictionary and swap text in
   place — see buildInPlaceSwitcher() in assets/i18n-runtime.js. That is why the markup
   below uses data-i18n attributes while every generated page uses real text. */

import { esc, LOGO_MARK, themeToggle } from "./template.mjs";
import { urlCalcIndex, urlHome, PLAY_URL, URL_APP } from "./site.mjs";

/** Header/footer are deliberately minimal here — these pages are a tool, not a funnel. */
const chrome = (t, bodyMain) => `<header class="site">
  <div class="wrap nav">
    <a class="brand" href="/">${LOGO_MARK}<span>LiczMat</span></a>
    ${themeToggle(t)}
    <nav class="nav-links" aria-label="LiczMat">
      <a href="${urlCalcIndex("pl")}" data-i18n="nav_calc">${esc(t("nav_calc"))}</a>
      <select id="lang-select" class="lang-select" aria-label="Język / Language"></select>
      <a class="btn btn-primary btn-sm" href="${PLAY_URL}" target="_blank" rel="noopener" data-loc="app">${esc(t("nav_download"))}</a>
    </nav>
  </div>
</header>
${bodyMain}
<footer class="site">
  <div class="wrap">
    <div class="foot-bottom">
      <span>© <span data-year>2026</span> LiczMat.</span>
      <span><a href="/privacy-policy.html" data-i18n="foot_privacy">${esc(t("foot_privacy"))}</a></span>
      <span class="muted" data-i18n="app_noindex_note">${esc(t("app_noindex_note"))}</span>
    </div>
  </div>
</footer>`;

/** A label + input pair, written once because the account panel is mostly forms. */
const field = (id, labelKey, t, { type = "text", autocomplete, minlength } = {}) =>
  `<div class="field">
    <label for="${id}" data-i18n="${labelKey}">${esc(t(labelKey))}</label>
    <input id="${id}" type="${type}"${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${minlength ? ` minlength="${minlength}"` : ""} required>
  </div>`;

const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1Z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46Z"/><path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.7Z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9.4 12.2-9.4Z"/></svg>';

/* ------------------------------------------------------------------ /app/ */

export function appMain(t) {
  const i = (key, tag = "span", cls = "") =>
    `<${tag}${cls ? ` class="${cls}"` : ""} data-i18n="${key}">${esc(t(key))}</${tag}>`;

  const tab = (id, key, first) =>
    `<button type="button" class="app-tab" role="tab" data-tab="${id}" aria-selected="${first ? "true" : "false"}" data-i18n="${key}">${esc(t(key))}</button>`;

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

      <div id="app-auth" class="calc">
        <form id="auth-form" autocomplete="on">
          ${field("auth-email", "app_email", t, { type: "email", autocomplete: "email" })}
          ${field("auth-password", "app_password", t, { type: "password", autocomplete: "current-password", minlength: 6 })}
          <button id="auth-submit" type="submit" class="btn btn-primary" data-i18n="app_signin">${esc(t("app_signin"))}</button>
        </form>
        <p class="auth-links">
          <a href="#" id="auth-forgot" data-i18n="app_forgot">${esc(t("app_forgot"))}</a>
          <a href="#" id="auth-switch" data-i18n="app_switch_signup">${esc(t("app_switch_signup"))}</a>
        </p>
        <div class="auth-sep">${i("app_or")}</div>
        <button type="button" id="auth-google" class="btn btn-ghost auth-google">
          ${GOOGLE_G}${i("app_google")}
        </button>
        <p class="muted auth-note" data-i18n="app_auth_note">${esc(t("app_auth_note"))}</p>
      </div>

      <div id="app-workspace" hidden>
        <div class="app-bar">
          <span class="app-identity">
            <b id="app-email-label"></b>
            <span id="app-provider" class="chip"></span>
            <span id="app-verified" class="chip"></span>
          </span>
          <button type="button" id="app-signout" class="btn btn-ghost btn-sm" data-i18n="app_signout">${esc(t("app_signout"))}</button>
        </div>

        <div class="app-tabs" role="tablist">
          ${tab("projects", "app_tab_projects", true)}
          ${tab("rooms", "app_tab_rooms")}
          ${tab("sync", "app_tab_sync")}
          ${tab("account", "app_tab_account")}
        </div>

        <section data-panel="projects" role="tabpanel">
          <h2 data-i18n="app_projects">${esc(t("app_projects"))}</h2>
          <form id="project-form" class="inline-form">
            <input id="project-name" type="text" maxlength="120" placeholder="${esc(t("app_new_project"))}" data-i18n-ph="app_new_project" required>
            <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_add">${esc(t("app_add"))}</button>
          </form>
          <ul id="project-list" class="data-list"></ul>
          ${i("app_share_hint", "p", "muted")}
        </section>

        <section data-panel="rooms" role="tabpanel" hidden>
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

        <section data-panel="sync" role="tabpanel" hidden>
          <h2 data-i18n="app_sync_title">${esc(t("app_sync_title"))}</h2>
          ${i("app_sync_d", "p", "muted")}
          <p id="app-sync-local" class="muted"></p>
          <p class="ws-links">
            <button type="button" id="app-sync-push" class="btn btn-primary btn-sm" data-i18n="app_sync_push">${esc(t("app_sync_push"))}</button>
            <button type="button" id="app-sync-pull" class="btn btn-ghost btn-sm" data-i18n="app_sync_pull">${esc(t("app_sync_pull"))}</button>
          </p>
          ${i("app_sync_note", "p", "muted src-note")}
        </section>

        <section data-panel="account" role="tabpanel" hidden>
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

        <p class="muted" style="margin-top:24px" data-i18n="share_owner_note">${esc(t("share_owner_note"))}</p>
        <p><a class="btn btn-ghost" href="${urlHome("pl")}" data-i18n="bc_home">${esc(t("bc_home"))}</a></p>
      </div>
    </div>
  </section>
</main>`;
  return chrome(t, main);
}

export const APP_PATH = URL_APP;
