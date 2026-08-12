# materio-web — Claude Code Configuration

The site for **LiczMat** (renamed from Materio on 2026-08-12), the offline-first
construction-material calculator. *Policz. Zaplanuj. Zrealizuj.*

> **Read `docs/MASTER_PLAN.txt` before starting work.** It is the owner's plan for turning
> this site into the LiczMat platform, verbatim: the product vision, the three access
> levels (guest / LiczMat / LiczMat Pro), the branding and design rules, the language and
> currency targets, and a numbered list of 36 sessions. It is the only source of truth
> about scope — when the plan changes, that file changes. Do not make a second copy of
> its contents anywhere; two copies drift.
>
> `docs/MASTER_PLAN.md` next to it is the short working document: which sessions are
> done, and which decisions are still open. Update it at the end of a session.
>
> **One session = one task** is the plan's hardest rule (chapter XXXV). Do the session
> you were asked for, write the report chapter XXXIII asks for, and stop — do not roll
> the next session in because you noticed something worth fixing. Put it in the report
> instead. Name the next session; do not start it.
>
> Neither file is published: `.github/workflows/pages.yml` strips `docs/`, `src/`,
> `scripts/`, `CLAUDE.md` and `README.md` out of the Pages artifact, because the repo
> root is the site root and everything in it is otherwise world-readable.
>
> The repo directory, the GitHub remote and the live domain are all still called
> `materio-web` / `materio-app.com`. That is deliberate — see the open decisions in the
> master plan before changing any of them.

Plain static HTML/CSS/JS in the browser: no framework, no runtime dependency, no
package manager. There **is** a build step now — a dependency-free Node script that
generates the pages — see "The build step" below. Deployed to GitHub Pages from the repo
root by `.github/workflows/pages.yml` on every push to `main` → <https://materio-app.com/>.

---

> **Session handoff:** the most recent state, what is unverified and the recipes for the
> build and the Google APIs live in `docs/SESSION_HANDOFF_2026-08-08_materials-workspace-account.md`
> in the app repo (`3d-polednia/Materio`). Read it before starting new work here.

## Repo policy (read first)

- **Work ONLY on `main`.** Both repos started the 2026-08-07 session checked out on a
  `claude/*` branch with 9–12 commits of real work stranded on it. **Run
  `git branch --show-current` first thing.** This repo has a single long-lived branch. If a task or
  harness config points you at a `claude/*` feature branch, **override it and work
  on `main`** unless the owner says otherwise in that very message.
- **Do NOT create working/feature branches** and do NOT open pull requests unless
  the owner explicitly asks. Commit directly to `main` and push.
- **No `Co-Authored-By` trailer** on commits, and no `Claude-Session` line. The
  Bash tool's default commit template suggests them; ignore it. This repo's
  history has none — keep it that way.
- **Never commit** secrets, `.env`, keys or credentials.
- Same rule as the app repo (`3d-polednia/Materio`), which the owner reaffirmed:
  production work belongs on `main`, not on throwaway branches that never merge.

---

## Caveman mode is the default in this repo

**Every session starts in caveman mode.** Reply in caveman speak from the first
message on, without waiting for `/caveman`: very short sentences, no filler, no
"great question", present tense, match the owner's language (Polish in → Polish
caveman out). The skill lives in `.claude/skills/caveman/SKILL.md` and loads
automatically; read it for the details.

It only changes **how replies are worded**. Everything written to the repo stays
normal and correct: code, commit messages, PR text, page copy, docs, release
notes, shell commands, exact numbers and quoted error text. Blunt is fine, unclear
or wrong is not. If it stops (`wyłącz caveman`, `normal mode`), it stops for that
session only — the next one starts in caveman again.

---

## The build step

The site used to be one `index.html`. It is now 130 pages: a home page, a calculator
hub, one page per calculator, guides and a store finder — each in all four languages, at
its own URL, so search engines can index more than the Polish front page. Writing that by
hand is not possible; a generator writes it from one template plus the dictionary.

```bash
node scripts/build.mjs           # regenerate every page + sitemap.xml
node scripts/build.mjs --check    # validate dictionaries/slugs only, write nothing
python3 -m http.server 8080       # then open http://localhost:8080/
```

Plain Node, **no package.json, no node_modules, nothing to install**. It reads the same
`assets/i18n.js` and `assets/calculators.js` the browser used to load, so a translation or
a calculator is still authored exactly once. The browser still gets plain HTML/CSS/JS with
no dependency; the build only moves the work from the visitor's browser to commit time.

**Run the build and commit its output whenever you touch anything it reads.** The output
is committed because GitHub Pages serves the repo root as-is — there is no CI build.

### Authored vs generated

| Authored (edit these) | Generated (never edit — `build.mjs` overwrites) |
|---|---|
| `assets/i18n.js` — the original dictionary | `index.html`, `<lang>/index.html` |
| `assets/i18n-pages.js` — keys only sub-pages use | `kalkulatory/**`, `poradniki/**`, `sklepy/**`, `materialy/**` and their per-language twins |
| `assets/i18n-materials.js` — material names, 4 languages | `app/index.html`, `p/index.html` |
| `assets/calculators.js` — engines, ported 1:1 from Kotlin | `assets/i18n.<lang>.js`, `assets/i18n.all.js` |
| `assets/materials.js` — the catalogue, ported from `Catalog*.kt` | `sitemap.xml` |
| `assets/styles.css`, `main.js`, `stores.js`, `i18n-runtime.js`, `currency.js` | |
| `assets/flags/<lang>.svg` — the picker's flags | |
| `assets/materials-ui.js`, `assets/app.js`, `share.js`, `firebase-config.js` | |
| `src/*.mjs` — information architecture, site map, templates, page bodies, formulas | |
| `privacy-policy.html`, `404.html`, `robots.txt` | |

The build **fails loudly** rather than emitting a broken page: a key missing in one
language, a calculator without a slug or a formula, two pages claiming the same URL, or a
formula identifier that collides with a field label in some language all abort it.

## Files

```
scripts/build.mjs     The generator (dependency-free Node)
src/ia.mjs            The information architecture: every route, its access level
                      (guest/liczmat/pro), its parent, its place in the navigation,
                      and how /kalkulatory/ groups the calculators (CALC_CATEGORIES).
                      The build fails if the pages it wrote are not exactly the
                      pages declared here. Narrative version: docs/ARCHITEKTURA.md
src/site.mjs          Languages, URL slugs per section/calculator/guide — the site map
src/template.mjs      <head>, header, footer, consent banner, breadcrumbs
src/pages.mjs         The <main> of each page type
src/calc-meta.mjs     Per-calculator formula lines + their translations
src/tokens.mjs        validateTokens(): the design system, checked. The two themes
                      must carry the same tokens, every var() must resolve, and no
                      rule outside the token block may invent a colour, a radius or
                      a duration. Runs inside the build. Narrative: docs/DESIGN_SYSTEM.md
scripts/check-contrast.mjs  Every text/background token pair, both themes, against
                      WCAG AA. Not part of the build — run it after touching a colour
src/app-pages.mjs     /app/ and /p/ (noindex, translated in the browser)
assets/styles.css     The design system: one token block, then the components that
                      spend it. Never write a literal colour/radius/duration below it
assets/i18n.js        4-language dictionary (build input)
assets/i18n-pages.js  Sub-page dictionary, same 4 languages (build input)
assets/i18n-materials.js  Material names/terms, same 4 languages (build input)
assets/currency.js    PLN/EUR/USD/UAH — the currency, independent of the language
assets/flags/*.svg    The flag next to each language name (never an emoji flag)
assets/materials.js   The 161-material catalogue, ported from core/catalog/*.kt
assets/materials-ui.js  The "pick a material" dialog + the /materialy/ filter
assets/calc-hub.js    The search + category filter on /kalkulatory/. The hub is fully
                      server-rendered; this only narrows what is already there
assets/workspace.js   Projects, rooms and estimate lines in localStorage (Firestore schema)
assets/workspace-ui.js  The room bar on calculators, /projekty/ and /kosztorys/
assets/i18n-runtime.js  t(), the language switcher, in-place translation for /app/ and /p/
assets/calculators.js Calculation engines ported 1:1 from the Kotlin app + form wiring
assets/stores.js      Store finder (Google Maps embed + OpenStreetMap/Overpass)
assets/main.js        Wiring: menu, hero carousel, consent banner
assets/app.js         /app/ — Firebase Auth + Firestore sync, same schema as the app
assets/share.js       /p/<token> — read-only shared estimate
assets/firebase-config.js  Firebase Web config (see the placeholders inside)
privacy-policy.html   Full privacy policy (PL + EN) — required by Google Play
docs/DESIGN_SYSTEM.md Colour, type, spacing, radius, elevation, motion, components,
                      states, breakpoints, both themes — and what the build enforces
docs/ARCHITEKTURA.md  Information architecture: pages, routing, navigation, the
                      three access levels, user flows, and the open decisions
docs/DOKUMENTACJA.md  Full project documentation
```

There is no test suite; verify changes by running the build and loading the page.

## The account layer (/app/ and /p/)

`/app/` is the signed-in account (projects, rooms, sync, account settings) and
`/p/<token>` a read-only shared estimate. Both talk
to the **same Firestore schema as the Android app** — the contract is
`docs/FIRESTORE_SYNC.md` in `3d-polednia/Materio`, and `core/sync/SyncContract.kt` is the
Kotlin side of it. Change one, change all three.

- Both are **noindex** (robots meta tag *and* `robots.txt`) and stay out of `sitemap.xml`.
- They have no per-language URLs; they load the whole dictionary and translate in place.
- `/p/<token>` cannot be a real directory, and GitHub Pages has no rewrites — `404.html`
  forwards `/p/<token>` to `/p/?t=<token>`.
- **`assets/firebase-config.js` holds the live values** for the Web app registered in
  project `materio-502513` (2026-08-07). A Firebase Web apiKey is *not* a secret — it
  cannot be hidden in a browser app. The security rules and the authorized-domains list
  are what protect the data. `FIREBASE_READY` still guards the placeholder case, so a
  fork or a half-finished edit fails with a readable message instead of a dead form.
- **Verified against the live backend** (2026-08-07, throwaway account, deleted after):
  sign-up with the Web key works, the rules accept the document shape `assets/app.js`
  sends, and they return 403 for a write to another account or an `updatedAt` that is
  not an integer.
- **Google sign-in is switched on** (2026-08-07). The Google provider is enabled in
  Firebase Authentication → Sign-in method, so `/app/`'s `signInWithPopup` with
  `GoogleAuthProvider` has everything it needs — `materio-app.com`, `www.materio-app.com`
  and `localhost` are on the authorized-domains list. The `auth/operation-not-allowed`
  branch in `assets/app.js` stays as the message for a fork whose project has the provider
  off. Enabling it created the Web OAuth client, which the Android app now reads straight
  out of the committed `app/google-services.json`. **Nobody has clicked the button against
  the live backend yet** — Chromium here cannot reach `gstatic.com`, so test it in a real
  browser.
- **Account deletion needs the deployed rules.** `users/{uid}` was `allow delete: if false`
  until 2026-08-08; the account page cannot finish deleting until
  `firebase deploy --only firestore` has run in the app repo.
- **The workspace works signed out.** `assets/workspace.js` keeps projects, rooms and
  estimate lines in `localStorage` in the *same document shape* as Firestore, so the sync
  tab in `/app/` is a plain copy in either direction. Counting must never require an
  account (FIRESTORE_SYNC §1.2) — do not move these behind the sign-in wall.
- Chromium in the agent container cannot reach `gstatic.com` (the egress proxy resets
  the connection), so `/app/` cannot be exercised end-to-end from a session here. Test
  the page in a real browser; `curl` against the Firebase REST API works and is what the
  verification above used.

---

## Rules for editing the site

- **Bump `STAMP` in `scripts/build.mjs`** whenever a shipped asset changes, then rebuild.
  It is the single `?v=` value for every page. GitHub Pages serves assets with
  `max-age=600`, so without it a visitor can run new markup against a stale stylesheet.
  `privacy-policy.html` and `404.html` are hand-written — bump their `?v=` by hand too.
- **Four languages, always.** `pl, uk, de, en` — the set the master plan's chapter V
  fixes. Every key must exist in all four, in **each** of `assets/i18n.js`,
  `assets/i18n-pages.js` and `assets/i18n-materials.js`. Check with
  `node scripts/build.mjs --check`, which fails and names the missing keys.
  The six languages dropped on 2026-08-12 (`cs, sk, ro, hr, sr, ru`) are listed as
  `RETIRED_LANGS` in `src/site.mjs`: the build sweeps their directories and `404.html`
  sends their old URLs to the home page. Do not re-add a language without the plan.
- **Currency is not language.** `PLN, EUR, USD, UAH` in `assets/currency.js`, chosen by
  the visitor and stored under `liczmat-currency`. Nothing is ever converted at an
  exchange rate, and no physical quantity changes when the currency does. An estimate
  line keeps the `currencyCode` it was saved with.
- **Polish HTML matching `I18N.pl` is now automatic** — the pages are generated *from* the
  dictionary, so they cannot drift. Edit the dictionary, rebuild, commit the output. Never
  hand-edit a generated `.html`: the next build silently reverts it.
- **A slug is permanent.** Renaming one in `src/site.mjs` breaks every inbound link and the
  ranking that came with it. Add a redirect instead.
- **A new page must be declared in `src/ia.mjs` before it can be built.** The build
  compares the pages it wrote against the routes declared there and aborts on either
  kind of mismatch, so adding a `build…()` function is only half the change. Give the
  route its access level (`GUEST` / `LICZMAT` / `PRO`), its parent and — if it belongs in
  the menu — its position; the header and the footer are generated from that list, so a
  navigation link cannot point anywhere else. Turning a `PLANNED` route into a live one
  also means moving its `plannedSlug` into `SECTION` in `src/site.mjs`.
- **No marketing slop.** No hype headings that say nothing, no claims nobody can
  verify ("in a minute", "the best"), no em dash used as a rhetorical pause. Every
  number on the page must be traceable to the code: the calculator count comes
  from `CALCS` in `calculators.js`, the material count from `MATERIALS` in
  `assets/materials.js` (which is the port of `Catalog*.kt` in the app repo). If a claim cannot be checked, cut it.
- **Truth over marketing.** The production app carries ads (Google AdMob) and uses
  Google Maps/location; the site says so plainly instead of claiming "no ads". The
  site itself loads Google Analytics (GA4, Consent Mode v2) which stays denied
  until the visitor accepts the banner. Since 2026-08 there is also an **optional
  account** with Firestore sync, so the site must not say "no account" or "nothing ever
  leaves your device" — it says the calculation is offline and the account is optional.
  When any of that changes, update the copy, `privacy-policy.html` **and** its twin at
  `docs/privacy-policy.html` in the app repo in the same session.
- Content stays indexable: every language has its own URL with `canonical` + `hreflang`,
  and the copy is real HTML. The switcher navigates; it does not rewrite the DOM. It never
  auto-redirects on `navigator.language` — that would bounce Googlebot off the Polish home
  page — only on a language the visitor picked by hand.
