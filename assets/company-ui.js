/* LiczMat website — the seller's companies on /moja-firma/.
 *
 * The page keeps company details in the shared Pro store. This file owns only the browser
 * view: the list, edit form, logo preview and the short-lived undo after a deletion.
 */

const companyT = (key) => (typeof t === "function" ? t(key) : key);
const companyEsc = (value) => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function companyMount() {
  const form = document.getElementById("company-form");
  if (!form) return;
  const list = document.getElementById("company-list");
  const empty = document.getElementById("company-empty");
  const undo = document.getElementById("company-undo");
  const preview = document.getElementById("company-logo-preview");
  const remove = document.getElementById("company-logo-remove");
  const error = document.getElementById("company-logo-error");
  const cancel = document.getElementById("company-cancel");
  let editing = "";
  let logo = "";

  const field = (name) => document.getElementById(`company-${name}`);
  const taxLabel = document.getElementById("company-nip-label");
  const taxNumber = field("nip");
  const updateTaxId = () => {
    const local = LMTaxId.taxId(field("country").value, companyT("company_nip"));
    taxLabel.textContent = local.label;
    taxNumber.placeholder = local.example;
  };
  const postal = LMPostal.bind({
    country: field("country"), postal: field("postalCode"), city: field("city"),
    error: document.getElementById("company-postal-error"),
    datalist: document.getElementById("company-city-list"),
  });
  field("country").addEventListener("change", (event) => {
    const raw = field("postalCode").value.trim();
    if (LMPostal.validate(field("country").value, raw) && LMPostal.format(field("country").value, raw) === raw) return;
    updateTaxId();
    event.stopImmediatePropagation();
    document.getElementById("company-city-list").replaceChildren();
    const city = field("city");
    if (city.dataset.autoCity && city.value === city.dataset.autoCity) city.value = "";
    delete city.dataset.autoCity;
  }, true);
  field("country").addEventListener("change", updateTaxId);
  const phone = field("phone");
  const phoneError = document.getElementById("company-phone-error");
  const showPhoneError = (show) => {
    phone.setAttribute("aria-invalid", String(show));
    phoneError.hidden = !show;
  };
  phone.addEventListener("input", () => {
    if (crmPhoneValid(phone.value)) showPhoneError(false);
  });
  const showLogo = () => {
    preview.hidden = !logo;
    remove.hidden = !logo;
    preview.innerHTML = logo ? `<img src="${companyEsc(logo)}" alt="">` : "";
  };
  const reset = () => {
    editing = "";
    logo = "";
    form.reset();
    showPhoneError(false);
    postal.setCountry(LMPostal.defaultCountry(document.documentElement.lang));
    updateTaxId();
    showLogo();
    cancel.hidden = true;
    document.getElementById("company-form-title").textContent = companyT("company_add");
  };
  const draw = () => {
    const rows = crmCompanies();
    empty.hidden = rows.length > 0;
    list.innerHTML = rows.map((company) => `<li data-company-id="${companyEsc(company.id)}">
      <span class="company-logo-thumb">
        ${company.logo
    ? `<img src="${companyEsc(company.logo)}" alt="">`
    : `<b>${companyEsc(company.name.slice(0, 1).toUpperCase())}</b>`}
      </span>
      <span class="row-name">
        <b>${companyEsc(company.name)}</b>
        ${company.nip ? `<small>${companyEsc(LMTaxId.taxId(company.country, companyT("company_nip")).label)}: ${companyEsc(company.nip)}</small>` : ""}
        ${company.city ? `<small>${companyEsc(company.city)}</small>` : ""}
        ${company.isDefault ? `<small>${companyEsc(companyT("company_default"))}</small>` : ""}
      </span>
      <span class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-company-edit>${companyEsc(companyT("company_edit"))}</button>
        ${company.isDefault ? "" : `<button type="button" class="btn btn-ghost btn-sm" data-company-default>${companyEsc(companyT("company_make_default"))}</button>`}
        <button type="button" class="btn btn-danger btn-sm" data-company-delete>${companyEsc(companyT("company_delete"))}</button>
      </span>
    </li>`).join("");
  };

  list.addEventListener("click", (event) => {
    const row = event.target.closest("[data-company-id]");
    if (!row) return;
    const company = crmCompanies().find((item) => item.id === row.dataset.companyId);
    if (!company) return;
    if (event.target.closest("[data-company-edit]")) {
      editing = company.id;
      logo = company.logo || "";
      ["name", "nip", "country", "street", "postalCode", "city", "phone", "email", "www", "bankAccount"]
        .forEach((name) => { field(name).value = company[name] || ""; });
      showPhoneError(false);
      postal.setCountry(company.country || LMPostal.defaultCountry(document.documentElement.lang));
      updateTaxId();
      postal.refresh(false);
      showLogo();
      cancel.hidden = false;
      document.getElementById("company-form-title").textContent = companyT("company_edit");
      form.scrollIntoView();
    } else if (event.target.closest("[data-company-default]")) {
      // The store timestamps both sides of the default switch for cross-device sync.
      crmSetDefaultCompany(company.id);
      draw();
    } else if (event.target.closest("[data-company-delete]")) {
      const token = crmDeleteCompany(company.id);
      if (!token) return;
      draw();
      undo.hidden = false;
      undo.innerHTML = `${companyEsc(companyT("company_deleted"))} ${companyEsc(company.name)} <button type="button" class="btn btn-ghost btn-sm">${companyEsc(companyT("company_undo"))}</button>`;
      // Keep the complete token: it remembers whether undo must restore the old default.
      undo.querySelector("button").onclick = () => {
        crmRestoreCompany(token);
        undo.hidden = true;
        draw();
      };
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!crmPhoneValid(phone.value)) {
      showPhoneError(true);
      phone.focus();
      return;
    }
    if (!postal.validate()) return;
    const values = { logo };
    ["name", "nip", "country", "street", "postalCode", "city", "phone", "email", "www", "bankAccount"]
      .forEach((name) => { values[name] = field(name).value; });
    const saved = editing ? crmUpdateCompany(editing, values) : crmAddCompany(values);
    if (saved) {
      reset();
      draw();
    }
  });
  document.getElementById("company-logo-file").addEventListener("change", async (event) => {
    error.hidden = true;
    try {
      logo = await companyLogoFromFile(event.target.files[0]);
      showLogo();
    } catch (reason) {
      // The logo helper returns stable codes so all languages can explain the exact error.
      error.textContent = companyT(`company_logo_${reason.code || "read"}`);
      error.hidden = false;
    }
  });
  remove.addEventListener("click", () => {
    logo = "";
    showLogo();
  });
  cancel.addEventListener("click", reset);
  document.addEventListener("crmchange", draw);
  if (typeof pwMount === "function") {
    // Missing or unknown levels stay closed; paywall.js owns that conservative default.
    pwMount("company", "company");
  }
  updateTaxId();
  draw();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", companyMount);
else companyMount();
