/** The two public contract notice forms. All visible copy comes from the site dictionary. */

import {
  ENTITY, urlCancel, urlHome, urlTerms, urlWithdraw,
} from "./site.mjs";
import { breadcrumbs, esc } from "./template.mjs";

const rich = (template, replacements) => {
  let out = "";
  let at = 0;
  for (const match of String(template).matchAll(/\{([a-z]+)\}/g)) {
    out += esc(String(template).slice(at, match.index));
    out += replacements[match[1]] || "";
    at = match.index + match[0].length;
  }
  return out + esc(String(template).slice(at));
};

const error = (id, text) => `<span id="${id}-error" class="field-error" role="alert" hidden>${esc(text)}</span>`;

function sharedFields(t) {
  return `<label class="field" for="contract-name">
          <span class="fld-label">${esc(t("contract_name"))}</span>
          <input id="contract-name" name="name" type="text" maxlength="120" autocomplete="name" required aria-describedby="contract-name-error">
          ${error("contract-name", t("contract_err_name"))}
        </label>
        <label class="field" for="contract-email">
          <span class="fld-label">${esc(t("contract_email"))}</span>
          <input id="contract-email" name="email" type="email" maxlength="254" autocomplete="email" required aria-describedby="contract-email-hint contract-email-error">
          <span id="contract-email-hint" class="muted">${esc(t("contract_email_hint"))}</span>
          ${error("contract-email", t("contract_err_email"))}
        </label>
        <label class="field" for="contract-product">
          <span class="fld-label">${esc(t("contract_product_label"))}</span>
          <input id="contract-product" name="contract" type="text" value="${esc(t("contract_product"))}" readonly>
        </label>`;
}

function cancelFields(t) {
  return `${sharedFields(t)}
        <fieldset class="contract-choice" aria-describedby="contract-mode-error">
          <legend class="fld-label">${esc(t("contract_mode"))}</legend>
          <label><input type="radio" name="mode" value="ordinary" checked> <span>${esc(t("contract_ordinary"))}</span></label>
          <label><input type="radio" name="mode" value="extraordinary"> <span>${esc(t("contract_extraordinary"))}</span></label>
          ${error("contract-mode", t("contract_err_mode"))}
        </fieldset>
        <label class="field" id="contract-reason-field" for="contract-reason" hidden>
          <span class="fld-label">${esc(t("contract_reason"))}</span>
          <textarea id="contract-reason" name="reason" maxlength="2000" rows="5" aria-describedby="contract-reason-error"></textarea>
          ${error("contract-reason", t("contract_err_reason"))}
        </label>
        <fieldset class="contract-choice" aria-describedby="contract-effective-error">
          <legend class="fld-label">${esc(t("contract_effective"))}</legend>
          <label><input type="radio" name="effective-mode" value="asap" checked> <span>${esc(t("contract_asap"))}</span></label>
          <label><input type="radio" name="effective-mode" value="date"> <span>${esc(t("contract_on_date"))}</span></label>
          <label id="contract-date-field" class="contract-date" for="contract-date" hidden>
            <span class="sr-only">${esc(t("contract_on_date"))}</span>
            <input id="contract-date" name="effective-date" type="date" aria-describedby="contract-effective-error">
          </label>
          ${error("contract-effective", t("contract_err_effective"))}
        </fieldset>`;
}

function withdrawFields(t) {
  return `${sharedFields(t)}
        <label class="field" for="contract-order-date">
          <span class="fld-label">${esc(t("contract_order_date"))} <span class="muted">${esc(t("contract_optional"))}</span></span>
          <input id="contract-order-date" name="orderDate" type="date" aria-describedby="contract-order-date-error">
          ${error("contract-order-date", t("contract_err_order_date"))}
        </label>`;
}

export function contractMain(lang, t, kind) {
  const cancel = kind === "cancel";
  const title = t(cancel ? "cancelpage_title" : "withdrawpage_title");
  const path = cancel ? urlCancel(lang) : urlWithdraw(lang);
  const crumbs = breadcrumbs(t, [
    { name: t("bc_home"), path: urlHome(lang) },
    { name: t("foot_terms"), path: urlTerms(lang) },
    { name: title, path },
  ]);
  const intro = cancel
    ? rich(t("contract_cancel_intro"), {
      entity: `<strong>${esc(ENTITY.name)}</strong>`,
      portal: `<a href="/app/">${esc(t("contract_portal"))}</a>`,
    })
    : rich(t("contract_withdraw_intro"), {
      withdrawal: `<a href="${urlTerms(lang)}#widerruf">${esc(t("contract_withdrawal_info"))}</a>`,
      money: `<a href="${urlTerms(lang)}#geld-zurueck">${esc(t("contract_money_back"))}</a>`,
    });

  const main = `<main id="main" tabindex="-1">
  <section class="block page-head">
    <div class="wrap narrow">
      ${crumbs.nav}
      <h1>${esc(title)}</h1>
      <p class="lead">${intro}</p>
    </div>
  </section>
  <section class="block alt">
    <div class="wrap narrow">
      <form id="contract-form" class="card contract-form" novalidate
        data-kind="${kind}" data-lang="${lang}" data-entity-email="${esc(ENTITY.email)}">
        ${cancel ? cancelFields(t) : withdrawFields(t)}
        <label class="contract-honeypot" aria-hidden="true" for="contract-website">
          Website
          <input id="contract-website" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
        </label>
        <p id="contract-status" class="field-error contract-status" role="alert" hidden></p>
        <p class="form-foot"><button id="contract-submit" type="submit" class="btn btn-primary">${esc(t(cancel ? "contract_submit_cancel" : "contract_submit_withdraw"))}</button></p>
      </form>
      <div id="contract-confirmation" class="card contract-confirmation" role="status" aria-live="polite" hidden></div>
    </div>
  </section>
</main>`;
  return { main, ld: crumbs.ld };
}

export function contractDescription(t, kind) {
  return t(kind === "cancel" ? "cancelpage_meta" : "withdrawpage_meta");
}
