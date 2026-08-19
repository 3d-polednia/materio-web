/* LiczMat website — the structure of LiczMat Pro, and the gate a free user meets.
 *
 * Master plan, session 21: the fourth of its four preparations, "struktury Pro". The
 * other three — the Free/Pro model, the permission table and the plan status — are
 * `assets/plan.js`, because a browser has to read them; this file is the build side,
 * and it renders rather than declares.
 *
 * The module list is NOT written here. It is the PRO half of `LM_FEATURES` in
 * assets/plan.js, handed in by scripts/build.mjs the same way the material catalogue is
 * handed to src/pages.mjs: one declaration, read by both sides. What is written here is
 * chapter XXV's block —
 *
 *     Klienci
 *     Dostępne w LiczMat Pro
 *
 * — and its rule: never a dead button. `/liczmat-pro/` is the page that would explain
 * Pro, and it is PLANNED until session 29, so "Poznaj LiczMat Pro" is rendered as text
 * with no link, exactly as HOME_DOORS renders a door whose route does not exist yet.
 * When session 29 turns that route LIVE, the link appears with no edit here.
 */

import { esc } from "./template.mjs";
import { LEVEL, STATUS, route } from "./ia.mjs";
import { DEFAULT_LANG, URL_APP } from "./site.mjs";

/**
 * The Pro modules, in the order the master plan builds them (chapter XXXII).
 *
 * @param {object[]} features LM_FEATURES from assets/plan.js
 */
export const proModules = (features) => features
  .filter((f) => f.level === LEVEL.PRO)
  .slice()
  .sort((a, b) => (a.session || 0) - (b.session || 0));

/** Every dictionary key the Pro structure spends, so the build can check four languages. */
export const proKeys = (features) => [
  "pro_t", "pro_d", "pro_locked", "pro_more", "pro_open", "pro_pay_later",
  "plan_t", "plan_d", "plan_free", "plan_pro", "plan_until", "plan_expired",
  "plan_none",
  // Session 27, the paywall: the two rungs of chapter XXV's Free → Pro path, the list of
  // what is behind the wall, and the preview that is the only way through it until
  // session 28 can sell one.
  "pro_need_account", "pro_need_pro", "pro_signin", "pro_incl_t",
  "pro_prev_t", "pro_prev_d", "pro_prev_on", "pro_prev_off", "pro_prev_chip",
  "pro_prev_note",
  ...proModules(features).flatMap((f) => [`${f.key}_t`, `${f.key}_d`]),
];

/**
 * One Pro module as a free user sees it: what it is, and that it is Pro.
 *
 * Chapter XXV: "Użytkownik darmowy powinien rozumieć, które funkcje są Pro." So the name
 * and the line under it are shown in full — the module is described, not teased — and the
 * only thing withheld is the module itself, which does not exist yet either.
 */
export function proModuleCard(t, feature) {
  const r = feature.route ? route(feature.route) : null;
  const live = Boolean(r && r.status === STATUS.LIVE);
  const soon = live
    ? "" : `<p class="pro-soon muted" data-i18n="door_soon">${esc(t("door_soon"))}</p>`;
  // A module that has been built is reachable from the card that describes it — otherwise
  // /app/ would say "Klienci" next to a page nothing on this site links to. /app/ has no
  // language of its own, so the link carries DEFAULT_LANG's address plus `data-nav-route`
  // and assets/i18n-runtime.js repoints it from window.LM_NAV on `langchange`;
  // scripts/build.mjs puts every live module route into that map for exactly this.
  const open = live && r.localized
    ? `<p><a class="btn btn-ghost btn-sm" data-nav-route="${r.id}" href="${r.path(DEFAULT_LANG)}" data-i18n="pro_open">${esc(t("pro_open"))}</a></p>`
    : "";
  return `<article class="pro-mod" data-feature="${feature.id}">
        <h3 data-i18n="${feature.key}_t">${esc(t(`${feature.key}_t`))}</h3>
        <p class="muted" data-i18n="${feature.key}_d">${esc(t(`${feature.key}_d`))}</p>
        <p class="pro-lock"><span class="chip" data-i18n="pro_locked">${esc(t("pro_locked"))}</span></p>
        ${soon}${open}
      </article>`;
}

/**
 * "Poznaj LiczMat Pro" — a link once /liczmat-pro/ exists, a sentence until then.
 *
 * Chapter XXV names the phrase and the rule in the same breath: a free user should be
 * offered a way to find out what Pro is, and never a dead button. /liczmat-pro/ is
 * PLANNED until session 29, so the phrase is rendered as text, exactly as HOME_DOORS
 * renders a door whose route does not exist yet. Session 29 turns the route LIVE and the
 * link appears with no edit here.
 *
 * @param {string} lang  the page's language, for a localized page; omit on /app/, which
 *                       has none and repoints its links from window.LM_NAV instead
 */
export function proMoreLink(t, lang) {
  const pro = route("liczmat-pro");
  if (pro && pro.status === STATUS.LIVE) {
    return `<a class="btn btn-ghost btn-sm" href="${pro.path(lang || DEFAULT_LANG)}" data-i18n="pro_more">${esc(t("pro_more"))}</a>`;
  }
  return `<span class="muted"><span data-i18n="pro_more">${esc(t("pro_more"))}</span> — <span data-i18n="door_soon">${esc(t("door_soon"))}</span></span>`;
}

/**
 * The Pro preview, offered. Chapter XXV's "przejście Free → Pro", as far as it can go
 * before session 28 has anything to sell.
 *
 * The block says what the preview is and what it is not, in that order, because the whole
 * cost of a preview is somebody believing they bought something: it opens the modules in
 * this browser, it does not change the plan on the account, and it is not synced. The
 * The button deliberately carries no `data-i18n`. Its label is one of two keys depending
 * on which way the switch is standing, and assets/paywall.js writes it onto every
 * `[data-pw-preview]` on the page — so the same switch reads correctly from behind the
 * wall and from in front of it. A `data-i18n` here would let i18n-runtime.js put "włącz"
 * back on a preview that is already on, the next time somebody changed language on /app/.
 */
export function proPreviewBlock(t) {
  return `<div class="pw-prev">
          <h3 data-i18n="pro_prev_t">${esc(t("pro_prev_t"))}</h3>
          <p class="muted" data-i18n="pro_prev_d">${esc(t("pro_prev_d"))}</p>
          <p><button type="button" class="btn btn-ghost btn-sm" data-pw-preview aria-pressed="false">${esc(t("pro_prev_on"))}</button></p>
        </div>`;
}

/**
 * The paywall itself: what a visitor whose plan does not reach the module is shown
 * *instead of* it. One implementation for all five Pro modules — sessions 22–25 wrote
 * this block four times, and four walls are four chances to describe Pro differently.
 *
 * Master plan, session 27, in the order its four bullets are listed:
 *
 *   blokady        the element is in the markup from the first paint and `hidden`;
 *                  assets/paywall.js unhides it when lmPaywall() says locked. A wall that
 *                  is created by a script is a module that flashes open before it shuts.
 *   komunikaty     two sentences, one per rung of the Free → Pro path, and exactly one of
 *                  them shown: a guest has no account for a plan to sit on, so they are
 *                  told to make one; somebody signed in is told their account is free.
 *   prezentacja    every Pro module named and described, not only the one behind this
 *   funkcji Pro    wall. A wall that says "Klienci — Pro" and nothing else asks somebody
 *                  to buy a product they have been shown one fifth of.
 *   przejście      the sign-up link for a guest, "Poznaj LiczMat Pro" for everybody, and
 *   Free → Pro     the preview — which is the only rung that leads anywhere today, and
 *                  says so rather than pretending to be a purchase.
 *
 * @param {Function} t        the page's dictionary
 * @param {string} id          the LM_FEATURES id this wall stands in front of
 * @param {object[]} features LM_FEATURES, for the list of everything Pro contains
 * @param {string} lang       the page's language
 * @param {object} opts       { id } the element id, matching the page's prefix
 */
export function proGate(t, featureId, features, lang, opts) {
  const feature = features.find((f) => f.id === featureId);
  // The build reads LM_FEATURES out of the shipped assets/plan.js, so a wall in front of
  // a module the table has never heard of is a typo that must not reach a page.
  if (!feature) throw new Error(`proGate(): no feature "${featureId}" in LM_FEATURES`);
  const id = (opts && opts.id) || "pw-gate";

  // Where a guest is sent, and where they come back to. `?next=` is read by lmSafeNext()
  // in assets/account.js, which accepts a path on this site and nothing else — the
  // address here is this page's own, in this page's language, so the way back lands on
  // the wall the visitor was stopped by rather than on the Polish front page.
  const back = route(feature.route) ? route(feature.route).path(lang) : "/";
  const signup = `${URL_APP}?mode=signup&amp;next=${encodeURIComponent(back)}`;

  // Chapter XXV's "prezentacja funkcji Pro". The module this wall belongs to is described
  // above in full, so the list beside it is the other four — one line each, no link: they
  // are behind the same wall and a link to another locked page is a dead button by a
  // longer route.
  const others = proModules(features)
    .filter((f) => f.id !== feature.id)
    .map((f) => `<li><b>${esc(t(`${f.key}_t`))}</b> — <span class="muted">${esc(t(`${f.key}_d`))}</span></li>`)
    .join("\n            ");

  return `<div class="app-card crm-gate pw-gate" id="${id}" hidden>
        <h2>${esc(t(`${feature.key}_t`))}</h2>
        <p class="muted">${esc(t(`${feature.key}_d`))}</p>
        <p><span class="chip">${esc(t("pro_locked"))}</span></p>

        <!-- One rung of the Free → Pro path, chosen by assets/paywall.js from the level.
             Both are in the markup; neither is shown until the script knows which. -->
        <p class="pw-step" data-pw-step="account" hidden>${esc(t("pro_need_account"))}</p>
        <p class="pw-step" data-pw-step="account" hidden>
          <a class="btn btn-primary btn-sm" href="${signup}" rel="nofollow">${esc(t("pro_signin"))}</a>
        </p>
        <p class="pw-step" data-pw-step="upgrade" hidden>${esc(t("pro_need_pro"))}</p>

        <div class="pw-incl">
          <h3>${esc(t("pro_incl_t"))}</h3>
          <ul class="pw-incl-list">
            ${others}
          </ul>
        </div>

        <p>${proMoreLink(t, lang)}</p>

        ${proPreviewBlock(t)}

        <p class="muted src-note">${esc(t("pro_pay_later"))}</p>
      </div>`;
}

/**
 * The whole Pro section of /app/: what Pro is, the modules, and where the plan stands.
 *
 * The plan status itself is filled in by assets/app.js from `users/{uid}` — the build
 * cannot know it, and the elements it writes into are empty on purpose rather than
 * carrying a guess that would be wrong for one visitor in every hundred.
 */
export function proPanel(t, features) {
  const i = (key, tag = "p", cls = "") =>
    `<${tag}${cls ? ` class="${cls}"` : ""} data-i18n="${key}">${esc(t(key))}</${tag}>`;

  const mods = proModules(features).map((f) => proModuleCard(t, f)).join("\n      ");

  // "Poznaj LiczMat Pro" (chapter XXV). It is a sentence and not a link while
  // /liczmat-pro/ is PLANNED: a button that goes nowhere is the one thing that chapter
  // asks for by name not to happen. When session 29 turns the route LIVE the link
  // appears — and that session has to add "liczmat-pro" to the LM_NAV data in
  // scripts/build.mjs, because /app/ has no language of its own and assets/i18n-runtime.js
  // repoints a data-nav-route link from there.
  const pro = route("liczmat-pro");
  const more = pro && pro.status === STATUS.LIVE
    ? `<p><a class="btn btn-ghost btn-sm" data-nav-route="liczmat-pro" href="${pro.path("pl")}" data-i18n="pro_more">${esc(t("pro_more"))}</a></p>`
    : `<p class="muted pro-more"><span data-i18n="pro_more">${esc(t("pro_more"))}</span> — <span data-i18n="door_soon">${esc(t("door_soon"))}</span></p>`;

  return `<h2 data-i18n="pro_t">${esc(t("pro_t"))}</h2>
      ${i("pro_d", "p", "muted")}

      <!-- Where this account stands. plan and planValidUntil are server-only fields
           (FIRESTORE_SYNC §2), so the page reads them and can never set them; nothing
           writes them yet either, which is what plan_none says out loud. -->
      <div class="app-card" id="plan-card">
        <h3 data-i18n="plan_t">${esc(t("plan_t"))}</h3>
        ${i("plan_d", "p", "muted")}
        <p class="plan-state">
          <span id="plan-name" class="chip"></span>
          <span id="plan-until" class="muted"></span>
        </p>
        <p id="plan-note" class="muted field-note"></p>
      </div>

      <div class="pro-mods">
      ${mods}
      </div>

      ${more}

      <!-- Session 27: the same preview the paywall offers, offered from the account page
           too. /app/ is where somebody goes to find out what their plan is, so it is the
           second place they would look for the switch — and it is one block, shared, so
           the two cannot describe it differently. assets/app.js relabels the button. -->
      ${proPreviewBlock(t)}

      ${i("pro_pay_later", "p", "muted src-note")}`;
}
