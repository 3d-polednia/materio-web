/* Materio website — the two pages that are not part of the public, indexable layer:
   /app/  the signed-in workspace (projects and rooms, synced with the Android app)
   /p/    the read-only view of a shared estimate

   Both are noindex (robots.txt and a robots meta tag), so they have no per-language URLs
   and no hreflang. Instead they carry the whole ten-language dictionary and swap text in
   place — see buildInPlaceSwitcher() in assets/i18n-runtime.js. That is why the markup
   below uses data-i18n attributes while every generated page uses real text. */

import { esc } from "./template.mjs";
import { urlCalcIndex, urlHome, PLAY_URL, URL_APP } from "./site.mjs";

/** Header/footer are deliberately minimal here — these pages are a tool, not a funnel. */
const chrome = (t, bodyMain) => `<header class="site">
  <div class="wrap nav">
    <a class="brand" href="/"><img class="logo" src="/assets/icon-192.png" alt="" width="32" height="32">Materio</a>
    <nav class="nav-links" aria-label="Materio">
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
      <span>© <span data-year>2026</span> Materio.</span>
      <span><a href="/privacy-policy.html" data-i18n="foot_privacy">${esc(t("foot_privacy"))}</a></span>
      <span class="muted" data-i18n="app_noindex_note">${esc(t("app_noindex_note"))}</span>
    </div>
  </div>
</footer>`;

export function appMain(t) {
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
          <div class="field">
            <label for="auth-email" data-i18n="app_email">${esc(t("app_email"))}</label>
            <input id="auth-email" type="email" autocomplete="email" required>
          </div>
          <div class="field">
            <label for="auth-password" data-i18n="app_password">${esc(t("app_password"))}</label>
            <input id="auth-password" type="password" autocomplete="current-password" minlength="6" required>
          </div>
          <button id="auth-submit" type="submit" class="btn btn-primary" data-i18n="app_signin">${esc(t("app_signin"))}</button>
        </form>
        <p style="margin-top:14px">
          <a href="#" id="auth-switch" data-i18n="app_switch_signup">${esc(t("app_switch_signup"))}</a>
        </p>
      </div>

      <div id="app-workspace" hidden>
        <div class="app-bar">
          <span id="app-email-label" class="muted"></span>
          <button type="button" id="app-signout" class="btn btn-ghost btn-sm" data-i18n="app_signout">${esc(t("app_signout"))}</button>
        </div>

        <h2 data-i18n="app_projects">${esc(t("app_projects"))}</h2>
        <form id="project-form" class="inline-form">
          <input id="project-name" type="text" maxlength="120" placeholder="${esc(t("app_new_project"))}" data-i18n-ph="app_new_project" required>
          <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_add">${esc(t("app_add"))}</button>
        </form>
        <ul id="project-list" class="data-list"></ul>
        <p class="muted" style="font-size:.85rem" data-i18n="app_share_hint">${esc(t("app_share_hint"))}</p>

        <h2 style="margin-top:32px" data-i18n="app_rooms">${esc(t("app_rooms"))}</h2>
        <form id="room-form" class="inline-form">
          <input id="room-name" type="text" maxlength="120" placeholder="${esc(t("app_new_room"))}" data-i18n-ph="app_new_room" required>
          <input id="room-length" type="text" inputmode="decimal" value="5" aria-label="${esc(t("fld_length"))}">
          <input id="room-width" type="text" inputmode="decimal" value="4" aria-label="${esc(t("fld_width"))}">
          <input id="room-height" type="text" inputmode="decimal" value="2.6" aria-label="${esc(t("fld_height"))}">
          <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_add">${esc(t("app_add"))}</button>
        </form>
        <ul id="room-list" class="data-list"></ul>
      </div>
    </div>
  </section>
</main>`;
  return chrome(t, main);
}

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
