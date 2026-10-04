# Strona LiczMat Pro (wariant B + trzy poziomy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/liczmat-pro/` (13 languages) with the owner-approved design: /aplikacja/-style stage with the real quote PDF, steps 01–04, the real quote editor and calendar fragments, three-tier pricing with a monthly/yearly switch and buy buttons, a detailed comparison table and a "Zanim kupisz" frame; buying starts from this page.

**Architecture:** Copy that only the built HTML needs lives in a new `src/pro-copy.mjs` (13 languages), like `src/conv-copy.mjs`. The three product fragments are pre-rendered from our own code by a dev script (`scripts/pro-samples.mjs`, Playwright) into committed HTML files under `src/pro-samples/`, one per language, and inlined by the build, so the page shows the real PDF, editor and calendar without loading their scripts. Prices stay in the markup for crawlers and are repainted by `assets/paywall.js`; the buy buttons go to `/app/?buy=<plan>`, which starts the Stripe checkout right after sign-in.

**Tech Stack:** static HTML generator (`scripts/build.mjs`, `src/*.mjs`), plain CSS tokens (`assets/styles.css`), plain browser JS (`assets/paywall.js`, `assets/app.js`), Node test scripts (`scripts/test-*.mjs`), Playwright from `C:\Projekty\lm-test\node_modules` (`LM_PLAYWRIGHT`).

**Spec:** Owner approval 2026-10-04 of the preview https://claude.ai/artifact/MEZd7vxnRh2kZuB8eZuBwK (files in `C:\Projekty\liczmat-makiety\pro-2026-10-04\podglad\`), plus: "w hero są cztery ptaszki pod dwoma przyciskami, muszą być trochę większe albo trochę inaczej zrobione". Vault note: `Obsidian/Liczmat/Web/Strona LiczMat Pro - nowy wyglad.md`.

## Global Constraints

- Work on `main`, commit and push to `origin/main`; no `Co-Authored-By` trailer (repo CLAUDE.md).
- No AI slop (CLAUDE.md, test-copy §8/§10): lime only as edge, text or button; no pills with a dot, icon chips, glow, number bands, carousels, emoji; no headings ending in "?" outside FAQ; no "—" or "–" in visible text; banned phrases incl. "w jednym miejscu", "nie tylko".
- No literal colours, radii or durations outside the token block of `assets/styles.css`.
- Inline `<style>`/`<script>` are blocked by the page CSP: all CSS in `styles.css`, all JS in asset files.
- Every visible string exists in all 13 languages (`LANGS` in `src/site.mjs`); amounts in a language's default currency (`LM_LANG_CURRENCY`).
- Never a dead button: every button leads somewhere real.
- Prices: 39,99 zł / 399,99 zł and the other currencies come from `LM_PAY` in `assets/pay.js`, never typed into copy.
- Screenshots at 1400 and 390 px, pl/de/en + one more language, light and dark, before commit.

---

### Task 1: Copy module `src/pro-copy.mjs`

**Files:**
- Create: `src/pro-copy.mjs`
- Modify: `assets/i18n-pages.js` (remove `propage_*` keys that nothing prints any more, in all 13 languages)

**Interfaces:**
- Produces: `export const PRO_COPY = { pl: {...}, uk: {...}, ... }` and `export const PRO_COPY_KEYS = Object.keys(PRO_COPY.pl)`. Keys (Polish values are the source):
  - `meta` page description; `lead` „Wyceny, klienci i terminy na projektach, które liczysz w kalkulatorach.”
  - `buy` „Wykup LiczMat Pro”, `trial` „14 dni za darmo”
  - four hero facts as title + line: `f1_t` „Wycena z kalkulatora” / `f1_d` „Materiały z projektu trafiają do wyceny same.”; `f2_t` „PDF z Twoim logo” / `f2_d` „Dane firmy z zakładki Moja firma.”; `f3_t` „Link dla klienta” / `f3_d` „Klient otwiera wycenę bez konta.”; `f4_t` „Też na Androidzie” / `f4_d` „Konto działa w aplikacji LiczMat.”
  - floating cards: `k_client` „Klient”, `k_date` „Termin”
  - steps: `s1_t` „Klient” `s1_d` „Dane kontaktowe i notatki przy kliencie.”; `s2_t` „Projekt” `s2_d` „Wyniki z kalkulatorów są już w projekcie.”; `s3_t` „Wycena” `s3_d` „Dopisujesz robociznę, koszty, marżę i VAT.”; `s4_t` „PDF albo link” `s4_d` „Klient dostaje gotową wycenę.”
  - quote pane: `q_h` „Wycena liczy się z projektu”, `q_d`, `q_1`..`q_4`
  - calendar pane: `c_h` „Klienci, historia i terminarz”, `c_d`, `c_1`..`c_4`
  - pricing: `p_h` „Ile kosztuje”, `p_month` „Miesięcznie”, `p_year` „Rocznie”, `p_guest` „Bez konta”, `p_free` „Darmowe konto”, `p_zero` „0 zł” is NOT a key (built with the currency formatter), `p_nofee` „bez opłat”, lists `p_guest_1..3`, `p_free_1..5`, `p_pro_1..8`, `p_open_calc` „Otwórz kalkulatory”, `p_signup` „Załóż konto”, `p_trial_line` „albo 14 dni za darmo, bez karty”, `p_pay_line` (Stripe, card, Apple Pay, Link, Klarna, cancel anytime), `p_yours` „Masz LiczMat Pro.”
  - table: `t_h` „Porównanie szczegółowe”, `t_feature` „Funkcja”, five group heads `g_count g_projects g_money g_work g_docs`, rows `r_calcs r_materials r_converter r_projects r_saved r_shopping r_sync r_prices r_waste r_quotes r_vat r_clients r_calendar r_history r_pdf r_link`, `t_yes` „jest”, `t_no` „nie ma” (screen-reader text for ✓/×)
  - before buying: `b_h` „Zanim kupisz”, `b_1`..`b_4`
  - sample data for the fragments: `x_firm` „Remonty Nowicki”, `x_firm_street`, `x_firm_city`, `x_client` „Anna Nowak”, `x_street` „ul. Długa 12”, `x_city` „Kraków”, `x_phone`, `x_project` „Łazienka, ul. Długa 12”, `x_project2..4`, `x_client2..3`, `x_mat1..3`, `x_other`, `x_labour`, `x_unit_pack`, `x_unit_pc`
- Counts in copy (15 calculators, 161 materials) come from the build (`CALCS.length`, catalogue size) via `{n}` placeholders, not typed.

- [ ] Step 1: write the Polish block, run `node -e "import('./src/pro-copy.mjs').then(m=>console.log(m.PRO_COPY_KEYS.length))"`.
- [ ] Step 2: translate into 12 languages (worker), informal register like the rest of the site; German uses „MwSt.” not „VAT”, as on the quote PDF.
- [ ] Step 3: check every language has every key and no „—”/„–”: `node -e` loop over `PRO_COPY`.

### Task 2: Pre-rendered fragments `scripts/pro-samples.mjs` → `src/pro-samples/`

**Files:**
- Create: `scripts/pro-samples.mjs`, `src/pro-samples/quote-<lang>.html`, `editor-<lang>.html`, `calendar-<lang>.html` (39 files)

**Interfaces:**
- Consumes: `PRO_COPY[lang].x_*`, `quotePdfBlock` export path (`scripts/export-quote-sheet.mjs` output + `window.lmRenderQuote(json)`), built pages `/wyceny/?id=q1` and the calendar route in each language served from the repo root, localStorage keys `liczmat-signed-in=pro`, `materio-workspace-v1`, `liczmat-crm-v1`, `materio-lang`.
- Produces: fragment files with no `id` attributes (the editor summary keeps one wrapper `id="quo-page"` stripped to class `quo-page-sample`, see Task 3), no `<script>`, no inline `style=` with colours, no buttons that act (edit/delete removed; calendar nav buttons `disabled`).
- Amounts: PLN sample for `pl` = 89,00 / 42,00 / 31,00 per unit, transport 80,00, labour 6,2 m² × 120,00, margin 10 %, VAT 23 % → total 2325,81 zł. Other currencies: same quantities, unit prices scaled from a EUR base (21,00 / 10,00 / 7,50 / 20,00 / 28,00) by `LM_PAY` monthly price ratio and rounded to whole units; VAT rate per language's country (de 19, sk 23, hr 25, it 22, nl 21, es 21, fr 20, cs 21, ro 21, sr 20, uk 20, en 0 → hide VAT row).
- Calendar: October 2026, `today` frozen to 2026-10-04 via `page.clock`, day 14 selected.

- [ ] Step 1: write the script (Playwright from `process.env.LM_PLAYWRIGHT || "C:/Projekty/lm-test/node_modules/playwright"`), run for `pl`, open the three files, compare with `C:\Projekty\liczmat-makiety\pro-2026-10-04\real\*.png`.
- [ ] Step 2: run for all 13 languages; check sizes and that no file contains `id=`, `<script`, `—`, `–`.

### Task 3: The page, its CSS and the price script

**Files:**
- Modify: `src/pages.mjs` (`proPageMain`), `scripts/build.mjs` (`buildProPage`, copy completeness check like `CONV_COPY`), `assets/styles.css` (new `.pro-*` rules from `podglad/pro.css`, cleaned; quote summary rules re-scoped so the sample works without `#quo-page`), `assets/paywall.js` (period switch + hide buy for Pro), `src/pro.mjs` only if `proKeys` must drop removed keys.

**Interfaces:**
- `proPageMain(lang, t, features, prices, copy, samples, counts)`; `samples = { quote, editor, calendar }` strings; `prices = { monthly, yearly }` formatted.
- Markup hooks kept for `assets/paywall.js`: wrapper `id="pro-pay"` holding `[data-pw-plan="monthly"|"yearly"]` each with `<b data-pw-price>`, one `[data-pw-buy]` holding two links `href="/app/?buy=monthly"` / `?buy=yearly` with `data-pro-plan`, `[data-pw-soon]` with `pay_soon`; `id="pro-yours"` shown for Pro. Hero buy link carries `data-pro-buy` and is hidden for Pro by `pwPage()`.
- Period switch: `<div class="pro-period" data-pro-period="monthly">` with two `<button type="button" data-pro-set="monthly|yearly" aria-pressed>`; CSS shows only the chosen plan and buy link under `html.js`; without JS both plans and both links show.
- Hero facts (owner's request): `.pro-facts` 2×2 grid, each item a lime tick at `--fs-lg` + bold title at `--fs-md` in `--on-surface` + one muted line; bigger and more spaced than `.app-facts`.

- [ ] Step 1: rewrite `proPageMain`; rebuild `node scripts/build.mjs`; open `liczmat-pro/index.html` and `de/liczmat-pro/index.html` in Chromium.
- [ ] Step 2: move CSS; `node scripts/check-contrast.mjs` and the token test pass.
- [ ] Step 3: paywall.js switch; check with JS on/off.

### Task 4: `/app/?buy=<plan>` starts the checkout

**Files:**
- Modify: `assets/app.js` (`renderPlanPrices`), test in `scripts/test-pay.mjs` (static assertions) or the page suite that drives `/app/`.

**Interfaces:**
- On `/app/`, when `new URLSearchParams(location.search).get("buy")` is a plan id, the account is signed in, `sub.state !== "active"` and `lmPayBuyable(id, code)`: remove `buy` from the URL with `history.replaceState`, then `goToCheckout(id)` once. A guest sees the normal sign-in; the param survives sign-in because the page does not navigate. A Pro account just has the param removed.

- [ ] Step 1: failing assertion, implement, pass.

### Task 5: Tests

**Files:**
- Modify: `scripts/test-propage.mjs` (§2 page, §4 copy → `PRO_COPY`), `scripts/test-propage-page.mjs`, any suite that asserted the old `propage_*` keys or the old page (`test-copy` budgets, `test-perf` budget for `/liczmat-pro/` with date and reason, `test-seo`, `test-a11y`).

- [ ] Step 1: run every suite before the change on clean `main` and save the red list (known: test-pdf §3, test-quotes §8/8b/9b, test-pdf-page gate timeout).
- [ ] Step 2: after Tasks 1–4, run every suite with `LM_PLAYWRIGHT` set; nothing new may be red.

### Task 6: Look, commit, push, verify live

- [ ] Step 1: screenshots 1400/390 × pl/de/en/uk × light/dark; read every one like a visitor (copy, wrapping, currency, VAT label).
- [ ] Step 2: commit to `main`, push, wait for Pages, open https://liczmat.com/liczmat-pro/ and /de/ version, click "Wykup" as guest (lands on sign-in with `?buy=`).
- [ ] Step 3: vault note + MASTER_PLAN update.
