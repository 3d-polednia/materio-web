/* LiczMat contract cancellation and withdrawal forms. The callable accepts guests. */

import { FIREBASE_CONFIG, FIREBASE_READY, FIREBASE_SDK } from "./firebase-config.js";

const form = document.getElementById("contract-form");

if (form) {
  const byId = (id) => document.getElementById(id);
  const text = (key) => typeof t === "function" ? t(key) : key;
  const status = byId("contract-status");
  const submit = byId("contract-submit");
  const name = byId("contract-name");
  const email = byId("contract-email");
  const reason = byId("contract-reason");
  const reasonField = byId("contract-reason-field");
  const date = byId("contract-date");
  const dateField = byId("contract-date-field");
  const orderDate = byId("contract-order-date");

  const berlinToday = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const part = (type) => parts.find((entry) => entry.type === type)?.value || "";
    return `${part("year")}-${part("month")}-${part("day")}`;
  };
  if (date) date.min = berlinToday();

  const field = (name) => form.elements.namedItem(name);
  const selected = (name) => form.querySelector(`input[name="${name}"]:checked`);
  const showError = (id, control, shown) => {
    const message = byId(`${id}-error`);
    if (message) message.hidden = !shown;
    if (control) {
      if (shown) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    }
  };
  const clearErrors = () => {
    showError("contract-name", name, false);
    showError("contract-email", email, false);
    showError("contract-mode", null, false);
    showError("contract-reason", reason, false);
    showError("contract-effective", date, false);
    showError("contract-order-date", orderDate, false);
    status.hidden = true;
    status.textContent = "";
  };

  const syncCancelFields = () => {
    if (form.dataset.kind !== "cancel") return;
    const extraordinary = selected("mode")?.value === "extraordinary";
    reasonField.hidden = !extraordinary;
    reason.required = extraordinary;
    if (!extraordinary) showError("contract-reason", reason, false);

    const usesDate = selected("effective-mode")?.value === "date";
    dateField.hidden = !usesDate;
    date.required = usesDate;
    if (!usesDate) showError("contract-effective", date, false);
  };
  form.addEventListener("change", syncCancelFields);
  syncCancelFields();

  const validate = () => {
    clearErrors();
    let valid = true;
    const trimmedName = name.value.trim();
    if ([...trimmedName].length < 2 || [...trimmedName].length > 120) {
      showError("contract-name", name, true);
      valid = false;
    }
    if (!email.value.trim() || !email.validity.valid || email.value.trim().length > 254) {
      showError("contract-email", email, true);
      valid = false;
    }

    if (form.dataset.kind === "cancel") {
      const mode = selected("mode")?.value;
      if (mode !== "ordinary" && mode !== "extraordinary") {
        showError("contract-mode", null, true);
        valid = false;
      }
      if (mode === "extraordinary" && !reason.value.trim()) {
        showError("contract-reason", reason, true);
        valid = false;
      }
      const effectiveMode = selected("effective-mode")?.value;
      if (effectiveMode !== "asap" && effectiveMode !== "date") {
        showError("contract-effective", date, true);
        valid = false;
      } else if (effectiveMode === "date" && (!date.value || date.value < berlinToday())) {
        showError("contract-effective", date, true);
        valid = false;
      }
    } else if (orderDate.value && !orderDate.validity.valid) {
      showError("contract-order-date", orderDate, true);
      valid = false;
    }

    if (!valid) form.querySelector('[aria-invalid="true"]')?.focus();
    return valid;
  };

  const payload = () => {
    const cancel = form.dataset.kind === "cancel";
    const effectiveMode = cancel ? selected("effective-mode")?.value : "";
    return {
      kind: form.dataset.kind,
      lang: form.dataset.lang,
      name: name.value.trim(),
      email: email.value.trim(),
      mode: cancel ? selected("mode")?.value || "" : "",
      reason: cancel ? reason.value.trim() : "",
      effective: cancel ? effectiveMode === "date" ? date.value : "asap" : "",
      orderDate: cancel ? "" : orderDate.value,
      website: field("website")?.value || "",
    };
  };

  const callNotice = async (data) => {
    if (!FIREBASE_READY) throw new Error("firebase-not-ready");
    const [appModule, functionsModule] = await Promise.all([
      import(`${FIREBASE_SDK}/firebase-app.js`),
      import(`${FIREBASE_SDK}/firebase-functions.js`),
    ]);
    const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(FIREBASE_CONFIG);
    const callable = functionsModule.httpsCallable(
      functionsModule.getFunctions(app, "europe-central2"), "contractNotice",
    );
    const result = await callable(data);
    return result && result.data ? result.data : {};
  };

  const dateText = (value) => value ? new Intl.DateTimeFormat(form.dataset.lang, {
    dateStyle: "long", timeZone: "Europe/Berlin",
  }).format(new Date(`${value}T12:00:00Z`)) : text("contract_not_applicable");
  const receivedText = (value) => new Intl.DateTimeFormat(form.dataset.lang, {
    dateStyle: "long", timeStyle: "short", timeZone: "Europe/Berlin",
  }).format(new Date(value));

  const showConfirmation = (data, sent, receivedAt) => {
    const box = byId("contract-confirmation");
    const cancel = data.kind === "cancel";
    const modeText = cancel
      ? text(data.mode === "extraordinary" ? "contract_extraordinary" : "contract_ordinary")
      : text("contract_not_applicable");
    const effectiveText = cancel
      ? data.effective === "asap" ? text("contract_asap") : dateText(data.effective)
      : text("contract_not_applicable");
    const rows = [
      [text("contract_kind"), text(cancel ? "contract_kind_cancel" : "contract_kind_withdraw")],
      [text("contract_name"), data.name],
      [text("contract_email"), data.email.toLowerCase()],
      [text("contract_product_label"), byId("contract-product").value],
      [text("contract_mode"), modeText],
      [text("contract_effective"), effectiveText],
    ];
    if (!cancel) rows.push([text("contract_order_date"), dateText(data.orderDate)]);
    rows.push([text("contract_received"), receivedText(receivedAt)]);

    const heading = document.createElement("h2");
    heading.textContent = text("contract_done_title");
    const intro = document.createElement("p");
    intro.textContent = text("contract_done_intro");
    const list = document.createElement("dl");
    list.className = "facts";
    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "fact";
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      row.append(term, description);
      list.appendChild(row);
    }
    const emailed = document.createElement("p");
    emailed.textContent = text("contract_emailed");
    const actions = document.createElement("p");
    actions.className = "form-foot";
    const print = document.createElement("button");
    print.type = "button";
    print.className = "btn btn-ghost";
    print.textContent = text("contract_print");
    print.addEventListener("click", () => window.print());
    actions.appendChild(print);
    box.replaceChildren(heading, intro, list, emailed, actions);
    box.hidden = false;
    form.hidden = true;
    heading.focus?.();
  };

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (target === name) showError("contract-name", name, false);
    if (target === email) showError("contract-email", email, false);
    if (target === reason) showError("contract-reason", reason, false);
    if (target === date) showError("contract-effective", date, false);
    if (target === orderDate) showError("contract-order-date", orderDate, false);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const data = payload();
    submit.disabled = true;
    status.textContent = text("contract_sending");
    status.classList.remove("err");
    status.hidden = false;
    try {
      const result = await callNotice(data);
      const receivedAt = Number(result.receivedAt);
      if (!Number.isFinite(receivedAt)) throw new Error("missing-received-at");
      showConfirmation(data, result, receivedAt);
    } catch (error) {
      status.textContent = text("contract_error").replace("{email}", form.dataset.entityEmail);
      status.classList.add("err");
      status.hidden = false;
      submit.disabled = false;
    }
  });
}
