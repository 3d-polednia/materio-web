/* LiczMat website — the paywall, drawn. One file for all five Pro modules.
 *
 * Master plan, session 27 (PAYWALL PRO): "blokady, komunikaty, prezentacja funkcji Pro,
 * przejście Free → Pro". The first of those is `assets/plan.js` — LM_PRO_LOCKED and
 * lmPaywall() decide; this file is the other three: it puts the decision on the screen,
 * says the right sentence for the rung the visitor is standing on, and wires the one
 * control that moves them.
 *
 * It exists because sessions 22–25 wrote the same twenty lines four times — crmRenderPro,
 * jobRenderPro, quoRenderPro, calRenderPro, identical but for a three-letter prefix. Four
 * copies of a wall is four walls that can disagree about what is behind them, and the
 * paywall is the one place on this site where disagreeing is expensive.
 *
 * The markup it drives is written by src/pro.mjs at build time and is in the page from
 * the first paint, hidden. Nothing here creates an element: a paywall that appears only
 * once a script has run is a module that flashes open before it closes.
 *
 * Loaded after assets/plan.js, which is loaded after assets/account.js — the level comes
 * from lmReadLevel() and the decision from lmPaywall(), and neither is made here.
 */

/** t() when i18n-runtime is on the page, the key itself when it is not. */
const pwT = (key) => (typeof t === "function" ? t(key) : key);

/**
 * What this browser was last told about the session.
 *
 * `liczmat-signed-in` is a copy hint and can be stale (assets/account.js says so). It
 * still decides what the paywall shows, and that is the intended weight of it: the CRM
 * rows are `localStorage` on this device, in no sync contract, so the wall is a product
 * decision rather than a boundary. The boundary is the deployed Firestore rules, and they
 * are not asked here because nothing here writes to Firestore.
 */
const pwLevel = () => (typeof lmReadLevel === "function" ? lmReadLevel() : "guest");

/**
 * The paywall's answer for one module, with a working fallback.
 *
 * A page whose assets/plan.js failed to load shows the module rather than a wall: the
 * rows belong to whoever is sitting at this browser, and hiding somebody's own clients
 * behind a script that did not arrive is the worse of the two failures.
 */
function pwState(feature) {
  if (typeof lmPaywall === "function") return lmPaywall(feature, pwLevel());
  return { feature: null, open: true, locked: false, preview: false, gated: false, step: "none" };
}

/**
 * Draw one page's paywall.
 *
 * @param {string} prefix  the id prefix the page's markup uses ("crm", "job", "quo", "cal")
 * @param {string} feature the LM_FEATURES id ("clients", "jobs", "quotes", "calendar")
 *
 * Four elements, all written by src/pro.mjs:
 *   #<prefix>-pro       the strip above the module: a chip and a sentence
 *   #<prefix>-pro-chip  which of the three things the chip says
 *   #<prefix>-pro-note  the sentence, when there is one to say
 *   #<prefix>-gate      the wall, shown instead of the module
 *   #<prefix>-tool      the module
 */
function pwRender(prefix, feature) {
  const st = pwState(feature);
  const el = (suffix) => document.getElementById(prefix + suffix);

  /* The chip is the one line that says where this visitor stands, and it says exactly one
     of three things. A preview is not a plan, so it never borrows the plan's words. */
  const chip = el("-pro-chip");
  if (chip) {
    chip.textContent = st.open
      ? pwT(st.preview ? "pro_prev_chip" : "cli_pro_yours")
      : pwT("pro_locked");
    chip.classList.toggle("on", st.open && !st.preview);
    chip.classList.toggle("warn", st.preview);
  }

  // A Pro account is told which plan it is on and nothing else. A preview is told it is a
  // preview, every visit, because the whole risk of a preview is forgetting it is one.
  const note = el("-pro-note");
  if (note) {
    note.hidden = !st.preview;
    if (st.preview) note.textContent = pwT("pro_prev_note");
  }

  // The strip belongs above the module. When the wall is up the wall says all of it, and
  // a strip repeating "Dostępne w LiczMat Pro" over it is the same sentence twice.
  const strip = el("-pro");
  if (strip) {
    strip.hidden = st.locked;
    // The way out of a preview sits next to the reminder that one is running. A Pro
    // account has nothing to turn off, so the button is not there for them at all —
    // offering "wyłącz podgląd" to somebody who is actually paying reads as a threat.
    const off = strip.querySelectorAll("[data-pw-preview]");
    for (let i = 0; i < off.length; i++) off[i].hidden = !st.preview;
  }

  const gate = el("-gate");
  const tool = el("-tool");
  if (gate) gate.hidden = !st.locked;
  if (tool) tool.hidden = st.locked;

  /* Chapter XXV's "przejście Free → Pro": one rung is shown, and it is the rung this
     visitor is on. A guest is not offered an upgrade they have no account to put it on,
     and somebody signed in is not sent to a sign-up form they already used. */
  if (gate) {
    const steps = gate.querySelectorAll("[data-pw-step]");
    for (let i = 0; i < steps.length; i++) {
      steps[i].hidden = steps[i].getAttribute("data-pw-step") !== st.step;
    }
  }

  pwLabelPreview();
}

/**
 * Put the right word on every preview switch on the page.
 *
 * One button, two labels: it is the same switch either way, and a second control for
 * turning something off is a second thing to keep in step. The label is written here
 * rather than carried as `data-i18n`, because a `data-i18n` would let i18n-runtime.js put
 * "włącz podgląd" back onto a preview that is already on, the next time somebody changed
 * language on /app/ — which translates in place instead of navigating.
 */
function pwLabelPreview() {
  const on = typeof lmProPreview === "function" && lmProPreview();
  const buttons = document.querySelectorAll("[data-pw-preview]");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].textContent = pwT(on ? "pro_prev_off" : "pro_prev_on");
    buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
  }
}

/**
 * Wire the preview switch, wherever it is — the paywall on a Pro page, and the Pro tab of
 * /app/, which has no wall to stand behind and offers the same switch anyway.
 *
 * The click is caught on `document` rather than on the button: /app/ swaps its panels in
 * and out of the DOM, so a listener bound to the element would be wired to a button that
 * is no longer the one on screen.
 */
function pwWirePreview() {
  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("[data-pw-preview]") : null;
    if (!btn) return;
    e.preventDefault();
    if (typeof lmSetProPreview === "function") lmSetProPreview(!lmProPreview());
  });
  document.addEventListener("lm-preview", pwLabelPreview);
  document.addEventListener("langchange", pwLabelPreview);
  pwLabelPreview();
}

/**
 * Wire one page's paywall and draw it once.
 *
 * Redrawn on `lm-session` (somebody signed in or out on /app/, in this tab or another)
 * and on `lm-preview` (the switch below the wall). The two are separate events because
 * they are separate facts — see assets/plan.js.
 */
function pwMount(prefix, feature) {
  pwWirePreview();
  document.addEventListener("lm-session", () => pwRender(prefix, feature));
  document.addEventListener("lm-preview", () => pwRender(prefix, feature));
  pwRender(prefix, feature);
}
