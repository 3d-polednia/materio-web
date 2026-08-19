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
  "pro_t", "pro_d", "pro_locked", "pro_more", "pro_pay_later",
  "plan_t", "plan_d", "plan_free", "plan_pro", "plan_until", "plan_expired",
  "plan_none",
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
  const soon = !r || r.status !== STATUS.LIVE
    ? `<p class="pro-soon muted" data-i18n="door_soon">${esc(t("door_soon"))}</p>` : "";
  return `<article class="pro-mod" data-feature="${feature.id}">
        <h3 data-i18n="${feature.key}_t">${esc(t(`${feature.key}_t`))}</h3>
        <p class="muted" data-i18n="${feature.key}_d">${esc(t(`${feature.key}_d`))}</p>
        <p class="pro-lock"><span class="chip" data-i18n="pro_locked">${esc(t("pro_locked"))}</span></p>
        ${soon}
      </article>`;
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
      ${i("pro_pay_later", "p", "muted src-note")}`;
}
