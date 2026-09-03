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
import { proPanel, proGate, proKeys } from "./pro.mjs";

/**
 * The same header and footer as the rest of the site.
 *
 * `/app/` and `/app/dashboard/` used to carry a single hand-written link — "Kalkulatory",
 * hard-coded in Polish — on the argument that these pages are a tool and not a funnel. The
 * owner reported the consequence after session 20: signing in emptied the menu. The real
 * reason it was one link is that these pages have **no language of their own**, so a
 * per-language address cannot be written into them once and be right.
 *
 * That is now solved the way the dashboard already solved it for its own links: the build
 * writes DEFAULT_LANG's addresses and hands the page every language's in `window.LM_NAV`,
 * and assets/i18n-runtime.js repoints them on `langchange`. So the navigation is the
 * architecture's own (src/ia.mjs), in every language, on a page that never reloads.
 *
 * `inPlace` puts data-i18n on every label, and data-nav-route on every link — the first is
 * what the runtime rewrites, the second is what it repoints.
 *
 * `/p/<token>` keeps the short list on purpose: that page is a shared estimate opened by
 * somebody else's client, not by the account holder, and a full menu turns a quote into a
 * funnel. It passes `links` explicitly.
 */
const chrome = (t, bodyMain, links) => `${siteHeader({
  lang: DEFAULT_LANG, t, inPlace: true,
  ...(links ? { links } : {}),
  cta: { href: PLAY_URL, key: "nav_download", target: "_blank", rel: "noopener", loc: "app" },
})}
${bodyMain}
${siteFooter({ lang: DEFAULT_LANG, t, minimal: true, inPlace: true })}`;

/** The short list /p/<token> keeps — one way back into the product, and no more. */
const SHARE_LINKS = [{ href: urlCalcIndex(DEFAULT_LANG), key: "nav_calc" }];

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

/**
 * Google sign-in is hidden — the owner's decision on 2026-08-14, taken in the same session
 * on the phone and on the site, so the two never offer different ways in. Nothing about
 * the provider was removed: the Firebase project still has it enabled, an account that was
 * created with Google still exists and still owns its projects, and `assets/app.js` still
 * re-authenticates such an account with a Google popup when it asks to be deleted, because
 * that is the only credential it has. Flipping this back to `true` puts the button back and
 * needs no other edit.
 */
const GOOGLE_SIGN_IN = false;

const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1Z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46Z"/><path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.7Z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9.4 12.2-9.4Z"/></svg>';

/**
 * One stroke-path per sidebar item, on the same 24×24 grid calcIcon() in src/template.mjs
 * uses everywhere else on the site — kept here rather than there because these nine are
 * specific to the account sidebar and nothing else references them.
 */
const NAV_ICON = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  projects: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  clients: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/><path d="M16.2 4.6a3.4 3.4 0 0 1 0 6.6M20 20c0-3-1.9-5.3-4.6-6"/>',
  jobs: '<path d="M3 7l3-3h5l2 2h8v13H3z"/>',
  quotes: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  schedule: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  materials: '<path d="M12 2 3 6.8V17L12 22l9-5V6.8z"/><path d="M3 6.8 12 12l9-5.2M12 12v10"/>',
  rooms: '<path d="M4 10 12 3l8 7"/><path d="M6 9v11h12V9"/><path d="M10 20v-6h4v6"/>',
  profile: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6"/>',
  sync: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
  pro: '<path d="m12 2 2.7 5.9 6.3.7-4.7 4.4 1.3 6.3L12 16.2 6.4 19.3l1.3-6.3-4.7-4.4 6.3-.7Z"/>',
  account: '<path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 19.5a7.7 7.7 0 0 1 15 0"/>',
};

/* ------------------------------------------------------------------ /app/ */

/**
 * The three access levels of chapter II, as three cards.
 *
 * Generated from `ACCOUNT_LEVELS` in src/ia.mjs, so the set cannot quietly become two or
 * four, and so the wording of a level is written once for the whole product. Both the
 * signed-out page and the profile tab render this: a guest is told what an account adds,
 * and somebody signed in is told which level they are on.
 *
 * The Pro card carries one link and never a button. Session 29 built `/liczmat-pro/`, so
 * the card can now point at the page that explains what the level is — chapter XXV's
 * "Poznaj LiczMat Pro", which was the words "in preparation" until that page existed. It
 * still offers nothing to buy: the checkout lives one tab away, on the Pro tab, and the
 * `plan` field that grants the level is server-side only (FIRESTORE_SYNC §9.2). /app/ has
 * no language of its own, so the link carries DEFAULT_LANG's address plus
 * `data-nav-route`; assets/i18n-runtime.js repoints it from window.LM_NAV on `langchange`.
 *
 * @param {(k:string)=>string} t
 * @param {string} current the level this copy of the list should mark, "" for none
 */
function levelCards(t, current) {
  const cards = ACCOUNT_LEVELS.map((entry) => {
    const bullets = entry.can
      .map((key) => `<li data-i18n="${key}">${esc(t(key))}</li>`).join("");
    const r = entry.route ? route(entry.route) : null;
    // The page that explains the level, when there is one and it has been built. A route
    // still on the drawing board says so instead of linking into a 404 — the rule that
    // kept this card silent until session 29.
    const soon = !r ? ""
      : r.status === STATUS.LIVE
        ? `<p><a class="btn btn-ghost btn-sm" data-nav-route="${r.id}" href="${r.path(DEFAULT_LANG)}" data-i18n="pro_more">${esc(t("pro_more"))}</a></p>`
        : `<p class="lvl-soon" data-i18n="door_soon">${esc(t("door_soon"))}</p>`;

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

/**
 * @param {(k:string)=>string} t
 * @param {object[]} features LM_FEATURES from assets/plan.js — session 21's permission
 *   table. The Pro half of it is the Pro tab; the rest of it is what the other pages are
 *   allowed to do, and no page asks yet. Handed in rather than imported because
 *   assets/plan.js is a browser script, the same bridge the catalogue crosses.
 */
export function appMain(t, features) {
  const i = (key, tag = "span", cls = "") =>
    `<${tag}${cls ? ` class="${cls}"` : ""} data-i18n="${key}">${esc(t(key))}</${tag}>`;

  /**
   * One sidebar entry. Same role/aria-controls/aria-selected contract the old top-tab
   * strip used (assets/app.js's wireTabs() drives both the same way — a sidebar item
   * is still, semantically, one tab of one tablist), so the click/arrow-key wiring did
   * not have to change shape, only its selector.
   */
  const navItem = (id, key, first) =>
    `<button type="button" class="app-nav-item" role="tab" id="tab-${id}" aria-controls="panel-${id}" data-tab="${id}" aria-selected="${first ? "true" : "false"}" tabindex="${first ? "0" : "-1"}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICON[id] || ""}</svg>
        <span data-i18n="${key}">${esc(t(key))}</span>
      </button>`;

  const navGroup = (labelKey, items) => `<div class="app-nav-group">
        <div class="app-nav-label" data-i18n="${labelKey}">${esc(t(labelKey))}</div>
        ${items.join("\n        ")}
      </div>`;

  /** One row of the profile's read-only facts. The value is filled in by assets/app.js. */
  const fact = (id, key) =>
    `<div class="fact"><dt data-i18n="${key}">${esc(t(key))}</dt><dd id="${id}">—</dd></div>`;

  const main = `<main id="main" tabindex="-1">
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
      <!-- "No network" has a line of its own, and the sentence is in the markup rather
           than written by a script. It used to share #app-status, which cost twice: it
           stamped on whatever else was standing there ("Nazwa zapisana."), and it could
           only be taken down by comparing the rendered text against the translation it
           was written with — so switching language while it showed left it up for good.
           Keyed for langchange like everything else here; assets/app.js only toggles
           its hidden attribute. See renderConnection() there for when it goes up. -->
      <p id="app-offline" class="result show" role="status" hidden data-i18n="app_offline">${esc(t("app_offline"))}</p>

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

          ${GOOGLE_SIGN_IN ? `<div id="auth-google-box">
            <div class="auth-sep">${i("app_or")}</div>
            <button type="button" id="auth-google" class="btn btn-ghost auth-google">
              ${GOOGLE_G}${i("app_google")}
            </button>
          </div>` : ""}
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
      <!-- .wrap.narrow (760px) fits a sign-in form; it starved the sidebar dashboard
           below it of room — see the note on #app-workspace's own class. -->
    </div>

    <!-- The signed-in shell gets the site's normal content width (--maxw, 1160px), not
         the 760px reading column above: a sidebar plus a month grid needs the room a
         one-column sign-in form never did. 2026-09-03, after the owner reported the
         sidebar redesign rendering squeezed into that narrow column. -->
    <div id="app-workspace" class="wrap" hidden>
      <div class="app-shell">
          <aside class="app-side">
            <div class="app-side-brand">
              <svg class="logo" viewBox="-1 -1 36 34" width="26" height="24" aria-hidden="true"><g fill="none" stroke-linecap="butt" stroke-linejoin="miter"><g stroke="currentColor" stroke-width="3.05"><path d="M1.6 0V7.5L17 25.2L32.4 7.5V0"/><path d="M4.5 0L17 16.4L29.5 0"/></g><g stroke="var(--brand-lime)"><path d="M1.75 12V30H17.4" stroke-width="3.5"/><path d="M32.3 12.4V31.6" stroke-width="2"/><g stroke-width="2"><path d="M28.8 16.6H32.3"/><path d="M30.8 20.2H32.3"/><path d="M28.8 23.8H32.3"/><path d="M30.8 27.4H32.3"/><path d="M28.8 31H32.3"/></g></g></g></svg>
              <span>LiczMat</span>
              <span id="app-level" class="chip app-plan-pill"></span>
            </div>

            <nav class="app-nav" role="tablist" aria-label="${esc(t("app_tabs_label"))}" data-i18n-aria="app_tabs_label">
              ${navGroup("app_nav_work", [
                navItem("overview", "app_tab_overview", true),
                navItem("projects", "app_tab_projects"),
                navItem("clients", "app_tab_clients"),
                navItem("jobs", "app_tab_jobs"),
                navItem("quotes", "app_tab_quotes"),
                navItem("schedule", "app_tab_schedule"),
              ])}
              ${navGroup("app_nav_resources", [
                navItem("materials", "app_tab_materials"),
                navItem("rooms", "app_tab_rooms"),
              ])}
              ${navGroup("app_nav_account", [
                navItem("profile", "app_tab_profile"),
                navItem("sync", "app_tab_sync"),
                navItem("pro", "app_tab_pro"),
                navItem("account", "app_tab_account"),
              ])}
            </nav>

            <div class="app-side-foot">
              <span class="app-side-who">
                <b id="app-who"></b>
                <span id="app-provider" class="chip"></span>
                <span id="app-verified" class="chip"></span>
              </span>
              <span class="app-side-actions">
                <!-- Session 14: the dashboard is where somebody signed in actually starts —
                     projects, the last calculations and the tools they use. /app/ is the
                     settings, so it points at it rather than being it. -->
                <a class="btn btn-ghost btn-sm" href="${URL_DASHBOARD}" data-i18n="nav_dashboard">${esc(t("nav_dashboard"))}</a>
                <button type="button" id="app-signout" class="btn btn-ghost btn-sm" data-i18n="app_signout">${esc(t("app_signout"))}</button>
              </span>
            </div>
          </aside>

          <div class="app-main">
            <!-- Where the visitor came from, when they arrived at a sign-up prompt under a
                 calculator result. Shown only after signing in, and only for a path on this
                 site — see lmSafeNext() in assets/account.js. -->
            <p id="app-next" class="app-next" hidden>
              <a id="app-next-link" class="btn btn-primary btn-sm" href="/" data-i18n="app_back_to">${esc(t("app_back_to"))}</a>
            </p>

            <!-- 2026-09-03: the account gained a landing tab of its own — a free user's
                 projects and a Pro user's clients/jobs/schedule were previously spread
                 across a flat tab strip with no single "where do things stand" view. -->
            <section data-panel="overview" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabindex="0">
              <h2 data-i18n="app_overview_title">${esc(t("app_overview_title"))}</h2>
              ${i("app_overview_lead", "p", "muted")}
              <div class="app-stats" id="overview-stats"></div>
              <div class="app-two-col">
                <section class="app-card">
                  <div class="dash-head">
                    <h3 data-i18n="app_overview_projects_t">${esc(t("app_overview_projects_t"))}</h3>
                    <button type="button" class="linkish dash-more" data-goto-tab="projects" data-i18n="app_projects">${esc(t("app_projects"))}</button>
                  </div>
                  <ul id="overview-projects" class="data-list"></ul>
                </section>
                <div class="app-stack">
                  <section class="app-card">
                    <div class="dash-head">
                      <h3 data-i18n="app_overview_schedule_t">${esc(t("app_overview_schedule_t"))}</h3>
                      <button type="button" class="linkish dash-more" data-goto-tab="schedule" data-i18n="app_tab_schedule">${esc(t("app_tab_schedule"))}</button>
                    </div>
                    <ul id="overview-schedule" class="data-list"></ul>
                  </section>
                  <section class="app-card">
                    <div class="dash-head">
                      <h3 data-i18n="app_overview_materials_t">${esc(t("app_overview_materials_t"))}</h3>
                      <button type="button" class="linkish dash-more" data-goto-tab="materials" data-i18n="app_tab_materials">${esc(t("app_tab_materials"))}</button>
                    </div>
                    <ul id="overview-materials" class="data-list"></ul>
                  </section>
                </div>
              </div>
            </section>

            <!-- Chapter XVIII: "Pomieszczenia są elementem projektu." Until the owner reported
                 it after session 20, /app/ had two tabs and no link between them at all —
                 addRoom() did not even write a projectId, so a room made here belonged to
                 nothing. One tab now, rooms under the project they were measured for, and the
                 rooms nobody assigned in a group of their own at the bottom: that is what a
                 room pulled off the phone looks like, because SyncContract.roomToDoc() has no
                 projectId to send. The lists are drawn by assets/app.js. -->
            <section data-panel="projects" id="panel-projects" role="tabpanel" aria-labelledby="tab-projects" tabindex="0" hidden>
              <h2 data-i18n="app_projects">${esc(t("app_projects"))}</h2>
              <form id="project-form" class="inline-form">
                <input id="project-name" type="text" maxlength="120" placeholder="${esc(t("app_new_project"))}" data-i18n-ph="app_new_project" required
                  aria-label="${esc(t("app_new_project"))}" data-i18n-aria="app_new_project">
                <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_add">${esc(t("app_add"))}</button>
              </form>
              <ul id="project-list" class="data-list"></ul>
              ${i("app_share_hint", "p", "muted")}

              <h3 class="mt-8" data-i18n="app_rooms_loose">${esc(t("app_rooms_loose"))}</h3>
              ${i("app_rooms_loose_d", "p", "muted")}
              <ul id="room-list" class="data-list"></ul>
            </section>

            <!-- Session 22 (chapter XX), moved from its own top-level tab into the sidebar
                 2026-09-03. crmClients()/crmAddClient()/etc. (assets/crm.js) are unchanged —
                 this panel is a second place that calls them, exactly as /klienci/ does,
                 sharing the one localStorage store the account's Synchronizacja tab already
                 pushes and pulls (assets/app.js, app-sync-push/app-sync-pull). /klienci/
                 itself is untouched: chapter XXVI wants Pro publicly, indexably describable,
                 which a noindex page like this one cannot be. -->
            <section data-panel="clients" id="panel-clients" role="tabpanel" aria-labelledby="tab-clients" tabindex="0" hidden>
              <div class="dash-head">
                <h2 data-i18n="app_clients_title">${esc(t("app_clients_title"))}</h2>
                <span id="acctclients-pro" class="chip" hidden><span id="acctclients-pro-chip"></span></span>
              </div>
              ${i("app_clients_lead", "p", "muted")}
              ${proGate(t, "clients", features, DEFAULT_LANG, { id: "acctclients-gate" })}
              <div id="acctclients-tool">
                <form id="acctclients-form" class="inline-form">
                  <input id="acctclients-name" type="text" maxlength="120" placeholder="${esc(t("app_clients_name_ph"))}" required aria-label="${esc(t("app_clients_name_ph"))}">
                  <input id="acctclients-phone" type="tel" maxlength="60" placeholder="${esc(t("crm_phone"))}" aria-label="${esc(t("crm_phone"))}">
                  <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_clients_new">${esc(t("app_clients_new"))}</button>
                </form>
                <ul id="acctclients-list" class="data-list"></ul>
              </div>
            </section>

            <!-- Session 23 (chapter XXI), same move as Klienci above. crmAddJob()/
                 crmUpdateJob()/crmSetJobStatus() (assets/crm.js) are shared verbatim with
                 /zlecenia/, which stays exactly as it is. -->
            <section data-panel="jobs" id="panel-jobs" role="tabpanel" aria-labelledby="tab-jobs" tabindex="0" hidden>
              <div class="dash-head">
                <h2 data-i18n="app_jobs_title">${esc(t("app_jobs_title"))}</h2>
                <span id="acctjob-pro" class="chip" hidden><span id="acctjob-pro-chip"></span></span>
              </div>
              ${i("app_jobs_lead", "p", "muted")}
              ${proGate(t, "jobs", features, DEFAULT_LANG, { id: "acctjob-gate" })}
              <div id="acctjob-tool">
                <form id="acctjob-form" class="inline-form">
                  <input id="acctjob-name" type="text" maxlength="120" placeholder="${esc(t("app_jobs_new"))}" required aria-label="${esc(t("app_jobs_new"))}">
                  <select id="acctjob-client" aria-label="${esc(t("app_clients_title"))}"></select>
                  <input id="acctjob-due" type="date" aria-label="${esc(t("app_tab_schedule"))}">
                  <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_jobs_new">${esc(t("app_jobs_new"))}</button>
                </form>
                <ul id="acctjob-list" class="data-list"></ul>
              </div>
            </section>

            <!-- Session 24 (chapter XXII), same move. crmAddQuote()/crmQuoteTotals()
                 (assets/crm.js) shared verbatim with /wyceny/, which stays as it is. -->
            <section data-panel="quotes" id="panel-quotes" role="tabpanel" aria-labelledby="tab-quotes" tabindex="0" hidden>
              <div class="dash-head">
                <h2 data-i18n="app_quotes_title">${esc(t("app_quotes_title"))}</h2>
                <span id="acctquo-pro" class="chip" hidden><span id="acctquo-pro-chip"></span></span>
              </div>
              ${i("app_quotes_lead", "p", "muted")}
              ${proGate(t, "quotes", features, DEFAULT_LANG, { id: "acctquo-gate" })}
              <div id="acctquo-tool">
                <form id="acctquo-form" class="inline-form">
                  <input id="acctquo-name" type="text" maxlength="120" placeholder="${esc(t("app_quotes_new"))}" required aria-label="${esc(t("app_quotes_new"))}">
                  <input id="acctquo-note" type="text" maxlength="200" placeholder="${esc(t("app_quotes_lead"))}" aria-label="${esc(t("app_quotes_lead"))}">
                  <button type="submit" class="btn btn-primary btn-sm" data-i18n="app_quotes_new">${esc(t("app_quotes_new"))}</button>
                </form>
                <ul id="acctquo-list" class="data-list"></ul>
              </div>
            </section>

            <!-- Session 25 (chapter XXIII), moved 2026-09-03 — and the one panel that goes
                 beyond what /terminarz/ does. crmJobsByDay() (assets/crm.js) is new; the
                 grid built from it is the owner's explicit, one-off reversal of chapter
                 XXIII's "nie buduj odpowiednika Google Calendar" — see the note in
                 assets/schedule-ui.js and docs/MASTER_PLAN.txt chapter XXIII. /terminarz/
                 itself is unchanged and keeps to the original scope. -->
            <section data-panel="schedule" id="panel-schedule" role="tabpanel" aria-labelledby="tab-schedule" tabindex="0" hidden>
              <div class="dash-head">
                <h2 data-i18n="app_schedule_title">${esc(t("app_schedule_title"))}</h2>
                <span id="acctcal-pro" class="chip" hidden><span id="acctcal-pro-chip"></span></span>
              </div>
              ${i("app_schedule_lead", "p", "muted")}
              ${proGate(t, "calendar", features, DEFAULT_LANG, { id: "acctcal-gate" })}
              <div id="acctcal-tool">
                <div class="cal-wrap">
                  <div class="cal-panel app-card">
                    <div class="cal-head">
                      <h3 id="acctcal-month"></h3>
                      <div class="cal-nav">
                        <button type="button" id="acctcal-prev" aria-label="${esc(t("app_schedule_prev"))}">‹</button>
                        <button type="button" id="acctcal-next" aria-label="${esc(t("app_schedule_next"))}">›</button>
                      </div>
                      <button type="button" id="acctcal-today" class="cal-today" data-i18n="app_schedule_today">${esc(t("app_schedule_today"))}</button>
                    </div>
                    <div class="cal-weekdays" id="acctcal-weekdays"></div>
                    <div class="cal-grid7" id="acctcal-grid"></div>
                  </div>
                  <aside class="cal-day-panel app-card" id="acctcal-daypanel"></aside>
                </div>
              </div>
            </section>

            <!-- Materiały and Pomieszczenia carry no paywall — both are Free-tier (chapter
                 II), matching /moje-materialy/ and the rooms already on the Projekty panel
                 above. This tab reads the same assets/own-materials.js store /moje-materialy/
                 does; full add/edit/price-history stays on that page rather than being
                 reproduced here, since its form is specific to five material shapes and
                 duplicating it would be a second place for that shape to drift. -->
            <section data-panel="materials" id="panel-materials" role="tabpanel" aria-labelledby="tab-materials" tabindex="0" hidden>
              <h2 data-i18n="app_materials_title">${esc(t("app_materials_title"))}</h2>
              ${i("app_materials_lead", "p", "muted")}
              <ul id="acctmat-list" class="data-list"></ul>
              <p><a class="btn btn-ghost btn-sm" href="/moje-materialy/" data-i18n="app_materials_manage">${esc(t("app_materials_manage"))}</a></p>
            </section>

            <!-- Pomieszczenia reads the same live state.rooms/state.projects the Projekty
                 panel above already renders (Firestore, not assets/workspace.js — signed in,
                 this account's rooms live there) and only regroups it by project, so the
                 two panels can never disagree about which rooms exist. -->
            <section data-panel="rooms" id="panel-rooms" role="tabpanel" aria-labelledby="tab-rooms" tabindex="0" hidden>
              <h2 data-i18n="app_rooms_title">${esc(t("app_rooms_title"))}</h2>
              ${i("app_rooms_lead", "p", "muted")}
              <div id="acctrooms-list"></div>
            </section>

            <section data-panel="sync" id="panel-sync" role="tabpanel" aria-labelledby="tab-sync" tabindex="0" hidden>
              <h2 data-i18n="app_sync_title">${esc(t("app_sync_title"))}</h2>
              ${i("app_sync_d", "p", "muted")}
              <p id="app-sync-local" class="muted"></p>
              <!-- Session 35: this browser is holding a copy of a different account. Both
                   buttons are refused until it is cleared — the text is written by the
                   script, because it is the script that knows. -->
              <p id="app-sync-foreign" class="result show err" role="status" hidden></p>
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

            <!-- Session 21: the Free/Pro model. What used to sit here before 2026-09-03 also
                 listed the five Pro modules as locked cards — with Klienci/Zlecenia/Wyceny/
                 Terminarz now real tabs of their own (each drawing proGate() live, in place,
                 the moment a Free account opens it), repeating that list here would be a
                 second copy that could say something different from what those tabs show.
                 What is left is what chapter XXV actually asks this tab for: where the
                 account's own plan stands, and the way to change it. -->
            <section data-panel="pro" id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" tabindex="0" hidden>
              ${proPanel(t, features)}
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

              <!-- Session 35. "Dane w tej przeglądarce zostają — wyczyść je osobno" has been
                   in the card below since /app/ was built, and until now there was nothing on
                   the site to clear them with. It is also the way out of a browser holding
                   another account's copy, which the sync tab now refuses to touch. -->
              <div class="app-card">
                <h3 data-i18n="app_wipe">${esc(t("app_wipe"))}</h3>
                ${i("app_wipe_d", "p", "muted")}
                <button type="button" id="app-wipe" class="btn btn-ghost btn-sm" data-i18n="app_wipe_btn">${esc(t("app_wipe_btn"))}</button>
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

  const main = `<main id="main" tabindex="-1">
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
        <!-- An <h2>, not an <h3>: this card is the first thing under the page's own <h1>,
             so the level below it is the only one that leaves no hole in the outline. -->
        <h2 data-i18n="dash_guest_t">${esc(t("dash_guest_t"))}</h2>
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

/** Every dictionary key the Pro tab spends, in the four languages it is translated to. */
export const appProKeys = (features) => ["app_tab_pro", ...proKeys(features)];

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
  const main = `<main id="main" tabindex="-1">
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
        <p><a class="btn btn-ghost" href="${urlHome(DEFAULT_LANG)}" data-i18n="bc_home">${esc(t("bc_home"))}</a></p>
      </div>
    </div>
  </section>
</main>`;
  return chrome(t, main, SHARE_LINKS);
}

export const APP_PATH = URL_APP;
