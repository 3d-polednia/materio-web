# Regulamin LiczMat Pro: implementation plan

> **For agentic workers:** steps use checkbox (`- [ ]`) syntax. Executed per the owner's worker policy: Codex (`gpt-5.6-sol`) and Antigravity write, Claude reviews, builds, commits and deploys.

**Goal:** liczmat.com gets binding terms for the paid LiczMat Pro subscription (German binding, 13 languages), the statutory withdrawal information, a cancellation button (§ 312k BGB) and a withdrawal button (Art. 11a Directive 2011/83 as amended by 2023/2673, in force since 19.06.2026), and Stripe Checkout links to the terms.

**Architecture:** the terms follow the privacy policy pattern exactly: one text file per language in `src/terms/<lang>.mjs` with identical section ids, laid out by `src/terms-page.mjs`, built by `scripts/build.mjs` into `SECTION.terms` routes. Cancellation and withdrawal are two static pages with one form each, posting to a new callable Cloud Function `contractNotice` that stores the notice, mails a confirmation to the customer and a notice to the owner. Cancelling the Stripe subscription and refunding stay manual for the owner (no Stripe API key in functions, by design).

**Tech stack:** static generator (`scripts/build.mjs`, `src/template.mjs`), vanilla JS, Firebase Functions v2 (Node 22, `europe-central2`), nodemailer over the existing OVH SMTP secret `SMTP_PASSWORD`.

**Spec:** the owner's request of 2026-11-11 and the findings in the vault note `Liczmat/Backend/Regulamin Pro - stan 2026-11-11.md`. The owner answered "Zrób wszystko sam", so the recommendations given there are the decisions: German binding, full refund within 14 days of the first purchase for everybody, Claude writes the text from the statutory models.

## Global constraints

- No "—" or "–" anywhere in user-visible text, in any language (test-copy §11). No AI filler, no slogans, no badges.
- Seller data only from `ENTITY` in `src/site.mjs` (name, address, phone, VAT id, e-mail). Never hard-code them.
- Facts must match the code: trial `TRIAL_DAYS = 14` (functions/trial-map.mjs); plans monthly and yearly in `LM_PAY` (assets/pay.js), yearly = 10 × monthly; payment through Stripe Payment Links; portal cancellation `at_period_end`.
- Prices are described as "Endpreise" / final prices; VAT treatment is not stated (open with the owner's accountant).
- No link to the EU ODR platform (shut down 20.07.2025). State non-participation in consumer arbitration (§ 36 VSBG).
- German text uses "Sie"; every other language uses the register of its own `src/privacy/<lang>.mjs`.
- Every UI change: screenshots at 1400 and 390 px before commit. Bump `STAMP` in `scripts/build.mjs` when assets change.
- Commit and push straight to `main`; deploy hosting from the clean worktree `C:\Projekty\mw-deploy`; functions with `firebase deploy --only functions:contractNotice`.

## Review focus

1. Somebody without an account (or with a different e-mail) cancels: the form still accepts it, the confirmation says "zum nächstmöglichen Zeitpunkt", the owner gets the notice.
2. The same e-mail submitted ten times: at most 3 confirmation mails per address per day, the rest stored and reported to the owner only.
3. A yearly subscriber after the first year: the terms promise cancellation with one month's notice and a pro rata refund; the owner mail must say so when `planValidUntil` is more than 31 days away.
4. A withdrawal inside 14 days: the owner mail says "full refund" plainly, with the date of receipt.
5. A page in Serbian or Ukrainian (no official EU model text): the withdrawal section still contains every element of the German model.

---

### Task 1: Terms text, German (binding), Polish and English

**Files:** create `src/terms/de.mjs`, `src/terms/pl.mjs`, `src/terms/en.mjs`.

Shape identical to `src/privacy/pl.mjs`: `{ lang, title, updated: "2026-11-11", binding, translationNote, sections: [{ id, h, html }] }`; `binding: true` only for German. Section ids (same in every language): `anbieter, leistung, test, vertrag, preise, laufzeit, widerruf, formular, geld-zurueck, pflichten, aenderungen, gewaehrleistung, haftung, preisaenderung, agb-aenderung, datenschutz, streit, schluss`.

Content, German wording based on the statutory models (Anlage 1 and 2 zu Art. 246a EGBGB):
- [ ] Anbieter from `ENTITY`; scope: the paid subscription LiczMat Pro on liczmat.com; free features are not part of the paid contract; customer AGB do not apply.
- [ ] Leistung: the Pro features as described on the LiczMat Pro page at the time of order (clients, quotes with PDF and link, scheduling, prices and costs in projects, company data); calculations are an aid, quantities and prices are to be checked before buying; no promise of uninterrupted availability.
- [ ] Test: new accounts get 14 days of Pro free, no payment data, ends by itself.
- [ ] Vertrag: steps (log in at /app/, choose plan, Stripe checkout, input can be corrected before the final button "Zahlungspflichtig abonnieren"), contract concluded with that click; Stripe Payments Europe Ltd. as payment provider; confirmation by e-mail; contract languages = the 13 site languages, German binding; text not stored separately, always available at this address and can be saved or printed.
- [ ] Preise: as shown on the site and in the checkout at order time, final prices, currency as shown in checkout, billed in advance per period, payment methods as offered in the checkout.
- [ ] Laufzeit: monthly renews by one month, cancellable any time to the end of the current month; yearly: first term one year, cancellable any time to its end; afterwards indefinite, cancellable any time with one month's notice, billed yearly in advance, the prepaid part after the end refunded pro rata. Ways to cancel: customer portal in /app/, the button "Verträge hier kündigen" (link to the cancel page), e-mail or letter. After the end the account returns to the free plan and the data stays stored (Codex: confirm this against assets/plan.js and say if not true).
- [ ] Widerruf: the statutory Widerrufsbelehrung for services (14 days from conclusion, unambiguous declaration to the seller's address/e-mail, may use the form or the withdrawal function on the withdraw page, sending in time suffices, refund within 14 days by the same payment method, no fees). **Leave out** the Wertersatz paragraph: no compensation is charged.
- [ ] Formular: the statutory Muster-Widerrufsformular with the seller's data filled in.
- [ ] Geld-zurück: in addition, every customer (also businesses) who withdraws or cancels within 14 days of the first purchase of a Pro subscription gets the full amount back.
- [ ] Pflichten (true data, password secret, no unlawful content in shared quote links), Änderungen (§ 327r BGB conditions and 30-day termination right), Gewährleistung (statutory), Haftung (unlimited for intent, gross negligence, life/body/health, Produkthaftungsgesetz; slight negligence only for essential obligations, limited to typical foreseeable damage), Preisänderung and AGB-Änderung (only with the customer's express consent; without it either side may end the subscription at the end of the paid period), Datenschutz (link to the privacy page), Streit (§ 36 VSBG non-participation), Schluss (German law without CISG, consumers keep the mandatory protection of their country of residence, court for merchants Munich region seat of the seller, severability, German binding).
- [ ] Polish and English: faithful translations; withdrawal sections use the official EU model wording of Directive 2011/83 Annex I for those languages.
- [ ] `node --check` on all three files; Claude reviews the German text line by line against the list above.

### Task 2: Translations into cs, sk, ro, hr, sr, uk, it, nl, es, fr

**Files:** create `src/terms/<lang>.mjs` for those ten.
- [ ] Translate from `src/terms/de.mjs` (meaning) with `en.mjs` as a second reference; same ids and HTML structure; register as in `src/privacy/<lang>.mjs`; EU official Annex I wording for the withdrawal model where it exists (all but sr and uk); `translationNote` says the German version is binding.
- [ ] Check: every file exports 18 sections with the ids of Task 1, no "—"/"–", `ENTITY` interpolated, `node --check` passes.

### Task 3: Terms pages, contract notice pages and function

**Files:**
- Create: `src/terms-page.mjs`, `src/terms/index.mjs` (static imports of all 13, `export const TERMS`), `src/contract-page.mjs`, `assets/contract.js`, `functions/contract-map.mjs`, `scripts/test-contract-map.mjs`, `scripts/test-terms.mjs`.
- Modify: `src/site.mjs` (SECTION.terms, SECTION.cancel, SECTION.withdraw, `urlTerms`, `urlCancel`, `urlWithdraw`), `scripts/build.mjs` (three builders, sitemap, STAMP), `src/template.mjs` (footer legal column and the minimal footer: terms, cancel, withdraw), `assets/i18n.*.js` / `assets/i18n-pages.js` (labels in 13 languages), the Pro purchase card in /app/ and the LiczMat Pro page (one plain link "Regulamin" / "AGB" next to the buy button), `functions/index.js` (export `contractNotice`).

Interfaces:
- `urlTerms(lang)`, `urlCancel(lang)`, `urlWithdraw(lang)` → path strings like `urlPrivacy`.
- `functions/contract-map.mjs`: `validateNotice(input) -> { ok: true, notice } | { ok: false, error }` with `input = { kind: "cancel"|"withdraw", lang, name, email, mode: "ordinary"|"extraordinary", reason, effective: "asap"|"YYYY-MM-DD", website /* honeypot, must be empty */ }`; `customerMail(notice, receivedAt, planValidUntil|null) -> { subject, text }` in the notice language; `ownerMail(notice, receivedAt, account|null) -> { subject, text }` in Polish; `limitDecision(countsToday, countsHour) -> { mailCustomer: boolean }` (≤ 3 per e-mail per day, ≤ 10 per IP per hour).
- `contractNotice` (onCall, region `europe-central2`, secrets `[SMTP_PASSWORD]`, `maxInstances: 5`): validates, looks up the auth user by e-mail and `users/{uid}` plan fields, writes `contractNotices/{autoId}` (admin SDK; rules stay deny-all), counts in `contractNoticeLimits/{sha256(email)}` and `/{sha256(ip)}`, sends the customer mail (if allowed) and the owner mail to `ENTITY.email`, returns `{ receivedAt }`.

Steps:
- [ ] Write `scripts/test-contract-map.mjs` first: valid cancel and withdraw pass; missing name/e-mail, bad e-mail, unknown kind, filled honeypot, extraordinary without reason, a past date are rejected; customer mail contains date and time of receipt and the end date when `planValidUntil` is given, "zum nächstmöglichen Zeitpunkt" otherwise; owner mail says "pełny zwrot" for a withdrawal and "proporcjonalny zwrot" for a yearly plan cancelled with more than 31 days left; the 4th mail per e-mail per day is not sent. Run, see it fail, implement, see it pass.
- [ ] Cancel page (German labels exact): link text "Verträge hier kündigen", form, final button "jetzt kündigen". Withdraw page: link "Vertrag hier widerrufen", final button "Widerruf bestätigen". After submit the page shows the confirmation with date and time and a "Speichern / Drucken" button (window.print). Equivalent unambiguous labels in the other 12 languages.
- [ ] `scripts/test-terms.mjs`: 13 terms pages, 13 cancel and 13 withdraw pages built, each with h1, the footer links to all three, no "—"/"–", German page has `binding`, every page links the German version.
- [ ] Full build, `node scripts/test-pages.mjs`, `test-copy.mjs`, `test-seo.mjs`, `test-contract-map.mjs`, `test-terms.mjs` and the other suites against a baseline run on clean main.
- [ ] Screenshots 1400 and 390 px: terms page pl and de, cancel page de, withdraw page pl, footer, Pro card in /app/.

### Task 4: Stripe and Play (Claude)

- [ ] Stripe public details: terms URL `https://liczmat.com/de/agb/`, privacy URL `https://liczmat.com/de/datenschutz/`, support e-mail `contact@liczmat.com`, website `https://liczmat.com`, statement descriptor `LICZMAT.COM` if the account carries nothing but LiczMat.
- [ ] Both Payment Links: require acceptance of the terms; custom text above the button pointing to the 14-day withdrawal right and the terms.
- [ ] Play Console, trader status of LiczMat: terms URL.
- [ ] Re-run `C:\Projekty\lm-test\_stripe-terms.mjs`: `terms_of_service_url` set, `consent_collection.terms_of_service = "required"`.

### Task 5: Deploy and record

- [ ] Commit, push, deploy hosting from `mw-deploy`, deploy `functions:contractNotice`; live check of one cancel submission with the test account e-mail; vault notes and MOC updated.
