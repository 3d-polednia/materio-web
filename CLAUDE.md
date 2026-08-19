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
> **The live domain is `liczmat.com` since 2026-08-14.** The owner bought it, pointed the
> GitHub Pages custom domain at it and switched `materio-app.com` off on purpose — it had
> served 500 views in two days and no redirect was wanted, so the old host now answers
> GitHub's "Site not found". One Pages site carries one custom domain; there is no way to
> keep both. `BASE` in `src/site.mjs` is the single place the domain is decided and every
> absolute URL the build writes comes from it.
>
> The repo directory and the GitHub remote are still called `materio-web`. That is
> deliberate — renaming a remote is a separate decision in the master plan.

Plain static HTML/CSS/JS in the browser: no framework, no runtime dependency, no
package manager. There **is** a build step now — a dependency-free Node script that
generates the pages — see "The build step" below. Deployed to GitHub Pages from the repo
root by `.github/workflows/pages.yml` on every push to `main` → <https://liczmat.com/>.

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

The site used to be one `index.html`. It is now 147 pages: a home page, a calculator
hub, one page per calculator, guides and a store finder — each in all four languages, at
its own URL, so search engines can index more than the Polish front page. Writing that by
hand is not possible; a generator writes it from one template plus the dictionary.

```bash
node scripts/build.mjs            # regenerate every page + sitemap.xml
node scripts/build.mjs --check    # validate dictionaries/slugs only, write nothing
node scripts/test-calculators.mjs # the calculator maths, units and localization
node scripts/test-account.mjs     # the account: levels, the session, the copy
node scripts/test-dashboard.mjs   # the dashboard: the route, the tool list, the copy
node scripts/test-projects.mjs    # projects: the route, the CRUD, the undo, the copy
node scripts/test-save.mjs        # saving a calculation: the snapshot, the project, the copy
node scripts/test-materials.mjs   # the material list: the document, the arrow, editing, the copy
node scripts/test-costs.mjs       # costs: the unit price, the currency rule, the three figures
node scripts/test-rooms.mjs       # rooms: the document, the project link, the assignment
node scripts/test-plan.mjs        # the Free/Pro model: permissions, gating, plan status
node scripts/test-jobs.mjs        # jobs: the document, the statuses, the deadline, the links
node scripts/test-quotes.mjs      # quotes: labour, the margin, the five figures
node scripts/test-calendar.mjs    # the terminarz: the buckets, the day arithmetic, the one write
node scripts/test-crm.mjs         # the chain: the walk, the derived history, one link map
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
| `assets/calculators.js` — engines, ported 1:1 from Kotlin, and `assets/units.js` next to it | `assets/i18n.<lang>.js`, `assets/i18n.all.js` |
| `assets/materials.js` — the catalogue, ported from `Catalog*.kt` | `sitemap.xml` |
| `assets/styles.css`, `main.js`, `stores.js`, `i18n-runtime.js`, `currency.js` | |
| `assets/flags/<lang>.svg` — the picker's flags | |
| `assets/materials-ui.js`, `assets/app.js`, `share.js`, `firebase-config.js` | |
| `assets/plan.js` — the Free/Pro model and the permission table | |
| `assets/crm.js` — the clients, jobs and quotes of LiczMat Pro, plus `crm-ui.js`, `jobs-ui.js`, `quotes-ui.js` and `crm-chain.js` | |
| `assets/recent.js`, `assets/dashboard.js` | |
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
scripts/test-calculators.mjs  The 15 engines: the maths against the formula each one
                      documents, the inputs, the units, the boundary values, the four
                      languages and the currency. Dependency-free — run it after
                      touching assets/calculators.js or a res_* key
scripts/test-pages.mjs  The same calculators in Chromium: 360/414/768/1280 px, the
                      form, the result panel, the currency selector, the no-JavaScript
                      variant. Needs Playwright installed OUTSIDE the repo — see the
                      header of the file
scripts/test-account.mjs  The account system: which of the three levels a visitor is on,
                      what the other 134 pages are told about the session, where a
                      ?next= link may point, and the copy in four languages.
                      Dependency-free — run it after touching assets/account.js,
                      assets/app.js, ACCOUNT_LEVELS or an acc_*/prof_* key
scripts/test-account-page.mjs  /app/ in Chromium with the Firebase SDK stubbed: sign-up,
                      sign-in, sign-out, the reset, the profile, the level, the tabs.
                      Same outside-the-repo Playwright as test-pages.mjs
scripts/test-dashboard.mjs  The dashboard: the route, the "recently used tools" store,
                      the frame the build writes, the addresses it hands the page and the
                      copy in four languages. Dependency-free — run it after touching
                      assets/recent.js, assets/dashboard.js, dashboardMain() or a dash_* key
scripts/test-projects.mjs  Projects: the `project` view declared in src/ia.mjs (and the
                      eight ways a view can lie, each broken on purpose), the four writes
                      in assets/workspace.js — create, read, rename, archive, delete —
                      the undo the tombstone makes possible, the frame the build writes
                      for both screens and the copy in four languages. Dependency-free —
                      run it after touching assets/workspace.js, projectsMain() or a
                      proj_*/ws_* key
scripts/test-projects-page.mjs  /projekty/ and /projekty/?id=<id> in Chromium, nothing
                      stubbed: the two screens, the CRUD done by clicking, the archive,
                      the undo strip, the back button, four languages, the currency
                      switch, the widths of chapter XXVIII and the no-JavaScript variant
scripts/test-dashboard-page.mjs  /app/dashboard/ in Chromium, nothing stubbed (the page
                      loads no Firebase): the four lists from a planted localStorage, the
                      level strip, the language and currency switches, and the widths
                      chapter XXVIII names — 320/375/390/430/768/1280 px
scripts/test-save.mjs  Saving a calculation: the snapshot a saved line carries inside
                      `inputJson`, the contract's 20 000-character cap, which project the
                      line lands in, the `data-lk`/`data-ok` keys the build puts on every
                      field, and the copy in four languages. Dependency-free — run it
                      after touching assets/workspace.js, the save box in
                      assets/workspace-ui.js, calcCard() or a proj_src_*/ws_saved_in key
scripts/test-materials.mjs  The material list of a project: the `shoppingItems` document
                      against the contract it comes from (ShoppingItemEntity, shoppingItemToDoc()
                      and the deployed validShoppingItem() rule), the arrow that puts a
                      material on the list when a calculation is saved, the cascade when the
                      project goes and the undo that brings it back, and the copy in four
                      languages, plus session 18: editing a material, typing one in by hand,
                      the unit list and the one field this repo keeps beside the contract
                      (`note`). Dependency-free — run it after touching the material half of
                      assets/workspace.js, wsRenderMaterials() or a proj_mat_* key
scripts/test-materials-page.mjs  The same arrow clicked in Chromium, nothing stubbed: a real
                      calculator page, "Dodaj do projektu", and the material on the project
                      screen one navigation later; ticking it off, editing it in place,
                      typing one in by hand, taking it off, four languages, the currency
                      switch and the widths of chapter XXVIII
scripts/test-rooms.mjs  Rooms (session 20, chapter XVIII): the room document against the
                      contract it comes from (RoomEntity, roomToDoc(), the deployed
                      validRoom()) plus the one field this repo keeps beside it —
                      `projectId`, and the test guards that it is the *only* one; the four
                      writes; what a project's delete does to its rooms, which is nothing;
                      the assignment of a calculation to a room inside `inputJson`; and the
                      floor/wall/ceiling arithmetic a calculator is filled from.
                      Dependency-free — run it after touching the room half of
                      assets/workspace.js, wsRenderProjectRooms() or a proj_room_*/ws_room*
                      key
scripts/test-rooms-page.mjs  The same in Chromium, nothing stubbed: a room added to a
                      project and corrected in its own row, a calculator filled from it,
                      the result filed under it from the save box, the same line moved to
                      another room and taken out of all of them, the index naming each
                      room's project, four languages, the currency switch, the widths of
                      chapter XXVIII and the no-JavaScript variant
scripts/test-plan.mjs  The Free/Pro model and the paywall (sessions 21 and 27, chapters
                      II, XIX and XXV): the two plan values against the sync contract,
                      lmPlanStatus() including the Pro plan that ran out, the permission
                      table against src/ia.mjs, what lmCan()/lmGate() answer for every
                      feature at every level, the five Pro modules in session order — and
                      session 27's wall: that it stands in front of every PRO feature and
                      no other, the rung lmPaywall() puts each level on, the preview (which
                      opens all five modules, writes one key, and never reports itself as a
                      plan), the wall as proGate() builds it in four languages, and that
                      nothing in the Pro panel offers to take money. Dependency-free — run
                      it after touching assets/plan.js, assets/paywall.js, src/pro.mjs or a
                      pro_*/plan_*/feat_* key
scripts/test-clients.mjs  Clients (session 22, chapter XX): the client document and the
                      money it deliberately does not carry, the four writes plus the undo,
                      the client → project link (stored on the client, one client per
                      project, and the project document byte-for-byte untouched), the
                      derived costs and history, the route, chapter XXV's gate in both of
                      its states — including the one after LM_PRO_LOCKED is flipped — and
                      the copy in four languages. Dependency-free — run it after touching
                      assets/crm.js, clientsMain() or a cli_*/clipage_* key
scripts/test-jobs.mjs  Jobs (session 23, chapter XXI): the job document and chapter XXI's
                      eight fields, the four statuses and the one that is refused, the
                      deadline that is a calendar day rather than an instant, the four
                      writes plus the undo, chapter XXIV's chain — client → job → project,
                      with the project document byte-for-byte untouched — the two amounts
                      (what was agreed, what wsProjectCosts() says it has run to) and the
                      currency rule between them, the route, chapter XXV's gate in both of
                      its states and the copy in four languages. Dependency-free — run it
                      after touching the job half of assets/crm.js, jobsMain() or a
                      job_*/jobpage_*/cli_jobs_* key
scripts/test-jobs-page.mjs  The same clicked through in Chromium, nothing stubbed: a job
                      added with a client and a date, opened, corrected, moved through the
                      statuses, its project attached and detached, deleted with its undo,
                      the client's own page reading the link back, the Pro notice for a
                      guest and for a Pro account, four languages, the currency switch, the
                      widths of chapter XXVIII and the no-JavaScript variant
scripts/test-quotes.mjs  Quotes (session 24, chapter XXII): the document and the three
                      figures it deliberately does not store, the labour — quantity × rate
                      rounded once, the lump sum, the rate read back by dividing and the
                      cap — the margin, which is a percentage of everything above it, the
                      five figures each traced to one source with the project document held
                      byte-for-byte, chapter VI's currency rule in both directions, chapter
                      XXIV's chain walked backwards from the quote, the route, chapter XXV's
                      gate in both of its states and the copy in four languages.
                      Dependency-free — run it after touching the quote half of
                      assets/crm.js, quotesMain() or a quo_*/quopage_* key
scripts/test-calendar.mjs  The terminarz (session 25, chapter XXIII): that the module stores
                      nothing — the Pro store is byte-for-byte what it was and a deadline
                      has exactly one home, the job's own `dueDate`; crmToday(), which is
                      the visitor's calendar day and never UTC's, checked under a real
                      non-UTC timezone; crmDaysUntil(), which counts days across both
                      daylight-saving changes; the five buckets and every boundary
                      (yesterday / today / +1 / +7 / +8 / no date), and the closed jobs
                      that are in none of them; crmSchedule()'s order, counts and closed
                      half; the one write, which is crmUpdateJob(); the route, chapter
                      XXV's gate in both of its states and the copy in four languages.
                      Dependency-free — run it after touching the terminarz half of
                      assets/crm.js, calendarMain() or a cal_* key
scripts/test-calendar-page.mjs  The same clicked through in Chromium, nothing stubbed: seven
                      jobs dated against the day the test runs, one in each bucket, a
                      deadline typed onto an undated job and the row moving because of it,
                      a date cleared, a row opening its job on /zlecenia/, the closed
                      disclosure, the Pro notice for a guest and for a Pro account, four
                      languages (including the relative wording the browser writes), the
                      currency switch, the widths of chapter XXVIII and the no-JavaScript
                      variant
scripts/test-crm.mjs   The chain (session 26, chapter XXIV): that the session added no
                      collection and no page — the Pro store still holds three collections
                      and walking the chain writes nothing; crmChain() from all four ends,
                      exact upwards and a list downwards, with every way a walk can fail;
                      crmQuoteChain() answering out of the same walker; a client's quotes
                      and a job's quotes, neither of them stored anywhere; crmHistory() —
                      which documents make a row, the order, the three scopes, and the
                      status change that deliberately leaves no trace; the `crm` feature,
                      which is PRO with no route, and chapter XXV's gate in both states;
                      the one `window.LM_LINKS` map that replaced four; and the copy in
                      four languages. Dependency-free — run it after touching the chain
                      half of assets/crm.js, assets/crm-chain.js or a crm_* key
scripts/test-crm-page.mjs  The same path clicked through in Chromium, nothing stubbed: the
                      strip on a job, a step nobody filled in, the quotes and the history
                      on both the job and the client, the whole loop walked by clicking
                      (job → client → quote → job) with the Back button through it, the
                      store byte-for-byte unchanged by all of it, four languages with each
                      language's own addresses, the currency, the widths of chapter XXVIII
                      and the no-JavaScript variant
scripts/test-quotes-page.mjs  The same clicked through in Chromium, nothing stubbed: a quote
                      added against a project, labour typed on as quantity × rate and as a
                      lump sum, a line corrected in its own row and removed, the margin
                      moved with the sum following it, the project detached and attached,
                      the quote deleted with its undo, the job and the client read back from
                      the project, four languages, the currency switch, the widths of
                      chapter XXVIII and the no-JavaScript variant
scripts/test-clients-page.mjs  The same clicked through in Chromium, nothing stubbed: a
                      client added and corrected, a project filed under them and taken off,
                      the archive, the delete with its undo, the Pro notice for a guest and
                      for a Pro account, four languages, the currency switch, the widths of
                      chapter XXVIII and the no-JavaScript variant
scripts/test-costs.mjs  What a project costs (session 19, chapter XVII): the unit price,
                      which is `estimatedCostMinor / quantity` and never a stored field;
                      the write that goes the other way (ilość × cena, rounded once); the
                      currency rule — an unpriced row takes the visitor's currency, a
                      priced one keeps its own; and wsProjectCosts(), which counts every
                      amount in the project exactly once. Dependency-free — run it after
                      touching the money half of assets/workspace.js or a proj_cost_*/
                      proj_other_*/proj_mat_price key
scripts/test-costs-page.mjs  The same in Chromium, nothing stubbed: a material priced in the
                      row it belongs to, the running "7 × 35 = 245" under the fields, a cost
                      nothing calculated typed onto the open project, the three figures
                      moving with both, four languages, the currency switch, the widths of
                      chapter XXVIII and the no-JavaScript variant
scripts/test-save-page.mjs  The same arrow clicked through in Chromium, nothing stubbed:
                      result → project picker → saved line → the project screen reading it
                      back, including a line saved in Polish and read in German after
                      switching language on the open project
src/pro.mjs           The build side of LiczMat Pro: the module list (the PRO half of
                      LM_FEATURES, handed in), chapter XXV's "Dostępne w LiczMat Pro"
                      block, and the Pro tab of /app/. It renders; it does not declare
src/app-pages.mjs     /app/, /app/dashboard/ and /p/ (noindex, translated in the browser)
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
assets/workspace.js   Projects, rooms, estimate lines and the material list in localStorage
                      — the four collections of the sync contract, in the Firestore
                      document shape. The material list (`shoppingItems`) arrived in
                      session 17; it is written by the same call that saves a calculation.
                      Session 19 added the money: a unit price derived by dividing the
                      total, and wsProjectCosts() — material cost, other costs, project sum
assets/workspace-ui.js  The room bar on calculators, /projekty/ and /kosztorys/. The
                      projects page holds two screens — the index and one project at
                      ?id=<projectId> — and this file shows one of them, including the
                      material list of chapter XVI and, since session 20, the project's
                      rooms and the picker that files one calculation under one of them
assets/crm-chain.js   Chapter XXIV's path, drawn: the strip of four steps, the quotes list
                      and the history list, shared by /klienci/, /zlecenia/ and /wyceny/ so
                      the chain reads the same wherever it is standing. Every name in it
                      starts `chn` — these are plain scripts in one global scope. It reads
                      and never writes; the addresses come from window.LM_LINKS
assets/crm.js         The Pro workspace: clients, jobs and quotes — plus the terminarz of
                      session 25, which is a reading of the jobs rather than a fourth
                      collection. localStorage under its own key
                      (`liczmat-crm-v1`), this browser only — `clients` is NOT in the sync
                      contract, so nothing here is uploaded and nothing on the phone reads
                      it. Written in the contract's shape anyway (id, fields, the sync
                      block, a tombstone instead of a delete) so a later contract change
                      can carry the rows that are already there
assets/jobs-ui.js     /zlecenia/ — the index (open jobs and closed ones) and one job at
                      ?id=<jobId>: its client, its project, chapter XXI's status and
                      deadline, what was agreed and what the work has cost
assets/schedule-ui.js /terminarz/ — the deadlines of the jobs in five buckets, the basics
                      beside each one, and a date control on the row. One screen and no
                      ?id=: a row opens the job it stands for. It writes one field, and it
                      is the job's own
assets/quotes-ui.js   /wyceny/ — the index and one quote at ?id=<quoteId>: the project it
                      is priced from, the labour typed onto it, chapter XXII's margin and
                      the five figures. Three of the five are read out of the project and
                      copied nowhere
assets/crm-ui.js      /klienci/ — the index and one client at ?id=<clientId>. Contact
                      details, notes, the projects filed under a client and what they have
                      cost, and the history, which is derived from the saved calculations
                      rather than logged. Chapter XXV's notice sits at the top of it
assets/recent.js      Which calculators this browser used, and when. Device-local, never
                      synced, no inputs and no results — only a calculator id and a time.
                      It is what the dashboard's "ostatnio używane narzędzia" reads
assets/dashboard.js   /app/dashboard/ — the four lists of chapter XIV, drawn from the local
                      workspace and assets/recent.js. Loads no Firebase on purpose
assets/plan.js        The Free/Pro model and the paywall: which plan an account is on
                      (lmPlanStatus), what each of the three levels may do (LM_FEATURES,
                      lmCan, lmGate), and since session 27 the wall itself — LM_PRO_LOCKED,
                      lmPaywall() and the Pro preview beside them. Loaded after
                      assets/account.js on the five pages that offer a Pro feature, and
                      nowhere else
assets/paywall.js     The paywall, drawn. One file for all five Pro modules: the strip
                      above the module, the wall instead of it, the rung of the Free → Pro
                      path this visitor is on, and the preview switch. It decides nothing —
                      lmPaywall() does — and it creates no element: the markup is written
                      by proGate() in src/pro.mjs at build time
assets/account.js     The user session and the three access levels of chapter II. Loaded
                      on every page: it is what lets a calculator word the sentence under
                      the result without loading Firebase. /app/ is its only writer
assets/units.js       The word next to a number: the plural forms of a counted noun and
                      the |token| substitution in a result row. Split out of
                      assets/calculators.js in session 16 so /projekty/, /kosztorys/ and
                      the dashboard can print a saved result without downloading the
                      engines. Loaded before assets/calculators.js everywhere
assets/i18n-runtime.js  t(), the language switcher, in-place translation for /app/ and /p/.
                      A language link carries the page's query string, so switching
                      language on /projekty/?id=<id> keeps the project
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

**Run `node scripts/test-calculators.mjs` after touching a calculator.** It needs nothing
installed, it is the only check that reads the engines' arithmetic, and it is what caught
the floating-point rounding that sold a sixteenth box of tiles for a floor that takes
fifteen. `scripts/test-pages.mjs` covers the same calculators in a real browser and needs
Playwright installed outside the repo; it skips itself, exit 0, when that is absent.

## The account layer (/app/, /app/dashboard/ and /p/)

`/app/` is the signed-in account (projects, rooms, sync, account settings),
`/app/dashboard/` the dashboard of the free account (session 14) and
`/p/<token>` a read-only shared estimate. The first and the third talk
to the **same Firestore schema as the Android app** — the contract is
`docs/FIRESTORE_SYNC.md` in `3d-polednia/Materio`, and `core/sync/SyncContract.kt` is the
Kotlin side of it. Change one, change all three.

- All three are **noindex** (robots meta tag *and* `robots.txt`) and stay out of
  `sitemap.xml`; `Disallow: /app/` covers the dashboard too.
- They have no per-language URLs; they load the whole dictionary and translate in place.
  **Anything JavaScript writes has to be redrawn on `langchange`** — `/app/` swaps the DOM
  instead of navigating, so a list, a date or a chip rendered once stays in the old
  language otherwise.
- `/app/` signed out is three views in one card — sign in, sign up, reset the password —
  each with its own form, because the browser's password manager keys off `autocomplete`
  and one field cannot be both `current-password` and `new-password`. `?mode=signup` and
  `?mode=reset` open a view directly, and `?next=<path>` offers the way back afterwards.
  Only a path on this site is ever accepted there (`lmSafeNext()`): a sign-in page that
  redirects anywhere is a phishing link with a real domain on it.
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
- **The Google sign-in button is hidden — site and app both (2026-08-14, owner's decision).**
  One switch each: `GOOGLE_SIGN_IN` in `src/app-pages.mjs` here, `GOOGLE_SIGN_IN_ENABLED` in
  `AccountViewModel.kt` in the app repo. Both are `false`, both were flipped in the same
  session so the two products never offer different ways in, and flipping either back needs
  no other edit. The button is **absent from the markup**, not merely invisible — an element
  that is only hidden is still clickable from a script. Nothing else changed: the provider is
  still enabled in Firebase, an account created with Google still exists and still owns its
  projects, `signInWithPopup`/`signInWithGoogle` still compile and run, and `/app/` still
  re-authenticates a Google account with a Google popup before deleting it, because that is
  the only credential such an account has. The `app_google` copy stays in the dictionaries
  in all four languages for the same reason. The two bullets below describe that machinery
  and stay true — they are what comes back on.
- **The domain moved to `liczmat.com` and the two Google console lists did not (2026-08-14).**
  Both name only the old host, both are console settings no commit can change, and until
  the owner edits them `/app/` signs nobody in from the new domain. **The blocker is the
  browser API key's referrer restriction, not the authorized-domains list** — measured
  against the live backend by sending `accounts:signInWithPassword` three times with
  different `Referer` headers:

  | Referer | Answer |
  |---|---|
  | `https://liczmat.com/app/` | 403 `API_KEY_HTTP_REFERRER_BLOCKED` |
  | `https://www.liczmat.com/app/` | 403 `API_KEY_HTTP_REFERRER_BLOCKED` |
  | `https://materio-app.com/app/` | 400 `INVALID_LOGIN_CREDENTIALS` — the key passed, Auth reached the password check |

  The restriction covers **every** Identity Toolkit call, so sign-up, e-mail sign-in and
  the password reset all fail the same way; switching Google sign-in off changed nothing,
  because the block sits a layer below the provider. An earlier version of this bullet
  said the calls come back `auth/unauthorized-domain` — they do not, and the distinction
  matters when reading the console: the fix is in Google Cloud, not Firebase.
  Google Cloud console → Credentials → the browser key → Website restrictions: add
  `https://liczmat.com/*` and `https://www.liczmat.com/*`. Firebase console →
  Authentication → Settings → Authorized domains: add `liczmat.com` and `www.liczmat.com`
  — a second, separate control, needed for the OAuth popup and for the `continueUrl` on an
  e-mail action link. **Keep every existing entry**, including the two `materio-502513.*`
  ones the bullets below explain. The same note sits in `assets/firebase-config.js`, next
  to the config it applies to. The three bullets that follow are history and stay accurate
  as history — they describe the old host.
- **Google sign-in is switched on** (2026-08-07). The Google provider is enabled in
  Firebase Authentication → Sign-in method, so `/app/`'s `signInWithPopup` with
  `GoogleAuthProvider` has everything it needs — `materio-app.com`, `www.materio-app.com`
  and `localhost` are on the authorized-domains list. The `auth/operation-not-allowed`
  branch in `assets/app.js` stays as the message for a fork whose project has the provider
  off. Enabling it created the Web OAuth client, which the Android app now reads straight
  out of the committed `app/google-services.json`. **Nobody has clicked the button against
  the live backend yet** — Chromium here cannot reach `gstatic.com`, so test it in a real
  browser.
- **Account deletion works (rules deployed 2026-08-13 by the owner).** Kept here because the
  history explains the code: for six days the deployed release said `allow delete: if false`
  while the rules file in the app repo said `isOwner(uid)`.
  Probed live with a throwaway account: project documents deleted fine, the profile
  document came back `403 PERMISSION_DENIED`, so the account page destroyed everything and
  then failed. `deleteEverything()` therefore deletes the profile document **first** — it
  is the one delete that has ever been refused, so a refusal now costs nothing and says so
  (`app_err_delete_denied`). Keep that order. `scripts/test-account-page.mjs` covers both
  states, so the test still passes now that the rules allow the delete.
- **Google sign-in on the web works (2026-08-13).** It was broken by the browser API key's
  referrer restriction: `signInWithPopup` runs its handler on
  `materio-502513.firebaseapp.com/__/auth/handler`, which was not on the key's allowed
  referrer list, so the popup showed "The requested action is invalid." The owner added
  `https://materio-502513.firebaseapp.com/*` and `https://materio-502513.web.app/*` in the
  Google Cloud console. Verified after: the key answers 200 for that referrer and for
  `materio-app.com`, and both hosts are on the Auth authorized-domains list. A custom
  `authDomain` was never an option — GitHub Pages cannot serve `/__/auth/`. **Keep those
  two entries** if the key's restrictions are ever edited again.
- **Firebase mails go out in the visitor's language.** `auth.languageCode` is set in
  `boot()` and follows `langchange`. Without it Firebase defaults to English, so the page
  said "Wysłaliśmy link do zmiany hasła" and an English mail arrived.
- **`%APP_NAME%` in those mails is the Firebase project's display name, still "Materio".**
  The reset mail therefore says "Reset your password for Materio", the retired brand. That
  is a console setting (Firebase → Project settings → General → Project name), not a repo
  one. Separately, the Google security mail ("you signed in to …") takes its name from the
  OAuth consent screen's App name, a Google Cloud console setting. Both still say Materio.
- **Nothing grants a plan, and no page may pretend otherwise.** `users/{uid}.plan` is
  `"free"` or `"premium"` (the contract's word, older than the rebranding — do not rename
  it), it is server-only, and nothing writes it: no Cloud Functions, no Play Billing
  (FIRESTORE_SYNC §9.2). So the Pro tab on `/app/` describes the five modules in full,
  marks each "Dostępne w LiczMat Pro", says out loud that nothing grants Pro yet, and
  carries no button — chapter XXV asks for a free user who understands what is Pro, and
  payments only after the Pro features exist (sessions 27–28). `lmPlanStatus()` keeps the
  half `lmLevelOf()` throws away: a `premium` plan whose `planValidUntil` has passed is
  LICZMAT again, and `expired` is what lets the page say why instead of looking demoted
  for no reason. Session 27 changed the wording, not the fact: the tab now carries the
  paywall's own preview switch (the same `proPreviewBlock()`, so the two places cannot
  describe it differently) and the plan card adds one sentence while the preview is on,
  saying the plan did not move. There is still no button that takes money, and
  `scripts/test-plan.mjs` and `scripts/test-account-page.mjs` both check there is not.
- **The visitor's level is derived, never asserted.** `lmLevelOf()` in
  `assets/account.js`: no Firebase user → `guest`; signed in → `liczmat`; signed in with
  `users/{uid}.plan == "premium"` (still valid) → `pro`. `plan` and `planValidUntil` are
  **server-only** — the deployed rules let a client write nothing in the profile but
  `lastSeenAt` and `appVersion` — so a browser can read the level and can never grant
  itself one. Nothing writes `plan` today (no Cloud Functions, no Play Billing:
  FIRESTORE_SYNC §9.2), so every real account is `liczmat` and the Pro card says
  "W przygotowaniu" with nothing to click. **Do not add a field to `users/{uid}`** — a
  name, a currency, a preference — the rules reject it; a profile name goes to Firebase
  Auth (`updateProfile`) instead.
- **The Free/Pro model is a table, and it records what ships.** `LM_FEATURES` in
  `assets/plan.js` gives every feature one of chapter II's three levels — the other half of
  "każdy element aplikacji powinien jednoznacznie wiedzieć, do którego poziomu dostępu
  należy", which `src/ia.mjs` already answers for pages. Ten of the seventeen are GUEST,
  and that includes projects, rooms, saved calculations, the material list and costs: they
  are `localStorage` in the Firestore shape, the routes are GUEST, and FIRESTORE_SYNC §1.2
  says counting never requires an account. Chapter II lists three of them under NIE MOŻE
  for a guest; the table follows the shipped product, because a table that said otherwise
  is an instruction to a later session to close something that works today. What the free
  account adds is `sync` and `share`. **None of it is a security boundary** — the browser
  decides what to *show*, the deployed rules decide what may be *written*, and `plan` is
  read-only to a client. `lmCan()` takes the level as an argument rather than reading
  `liczmat-signed-in`, because that hint can be stale and a function that quietly gated on
  it would hide somebody's own projects from them.
- **Jobs are the second Pro module, they share the clients' store, and they are the middle
  of chapter XXIV's path.** Session 23 built `/zlecenia/` — the index plus one job at
  `?id=<jobId>`, the same two-screens-in-one-file shape as `/klienci/`. The rows live in
  `assets/crm.js` beside the clients, under the same `liczmat-crm-v1` key, because it is
  one store: two files reading and writing one localStorage key is one race away from a
  lost write. `jobs` is not in the sync contract either (no `JobEntity`, no
  `SyncContract.jobToDoc()`, no `validJob()` in the deployed rules), so nothing here is
  uploaded and the page says so. A store written before session 23 has no `jobs` array and
  reads as an empty one — that is the whole migration.
- **A quote stores two of chapter XXII's five figures and derives the other three.**
  Session 24 built `/wyceny/` — the index plus one quote at `?id=<quoteId>`, the same
  two-screens-in-one-file shape as `/klienci/` and `/zlecenia/`, in the same
  `liczmat-crm-v1` store and outside the same sync contract (no `QuoteEntity`, no
  `SyncContract.quoteToDoc()`, no `validQuote()` in the deployed rules). The material and
  the other costs are `wsProjectCosts()` over the quote's project; the labour and the
  margin are the quote's own; the total is computed. Copying the project's money onto the
  quote would give one amount two homes and let them disagree the moment a material was
  re-priced — the argument that already keeps a cost off a job and a unit price off a
  shopping item. It is also what makes a quote answer "what is this worth *now*", which is
  the question it is opened for.
- **The one link a quote stores is `projectId`; the job and the client are walked, not
  kept.** The materials are the project's, so without it there is nothing to price — and
  `crmJobOfProject()` and `crmClientOfProject()` already reach the other two, so storing
  them again would be two more links free to disagree with the first. `crmQuoteChain()` is
  chapter XXIV's path read backwards: WYCENA → PROJEKT → ZLECENIE → KLIENT. A quote with no
  project is allowed and is not a mistake — it is a price for work with no material behind
  it, and the page says so instead of showing zeroes. One project may carry several quotes:
  two prices for one job is a variant, not a contradiction.
- **A labour line stores one money field, and the rate is a division.** `amountMinor` is
  what the line comes to; `crmLabourRate()` divides it by the quantity, exactly as
  `wsUnitPriceMinor()` does for a material and for the same reason. The write goes the
  other way — quantity × rate, rounded once — so "40 × 80 = 3200" behaves the way the form
  reads. A blank quantity is a lump sum and is stored as `null` rather than as `1`: a line
  nobody counted and a line counted once are different statements. A labour line is deleted
  outright rather than tombstoned — it is a field of a document, not a row of a collection,
  and the undo that matters is the quote's own tombstone, which carries its lines.
- **The margin is a percentage of everything above it, and the quote's currency is stamped
  once.** `marginPct` applies to material + other costs + labour, rounded exactly once at
  the end; a negative margin is a typo rather than a discount and reads as zero. The quote
  stamps its own currency at the first labour amount and never re-stamps it (chapter VI);
  clearing the last amount clears the stamp. When the quote's half and the project's half
  are in different currencies the page says so — the amounts are still added, the same
  choice `wsProjectCosts()` makes, and nothing is converted at a rate.
- **What a quote deliberately has no room for:** tax, a discount, a status, a number, an
  issue date, or "other costs" typed on the quote itself. The first five are the accounting
  package chapter XXII forbids in one line; the last is a second home for an amount chapter
  XVII already keeps on the project, where `wsProjectCosts()` counts it once.
- **Chapter XXI's four statuses are the whole set, and a job has no `archived` field.**
  `JOB_STATUS` is `new, active, done, cancelled`, in the chapter's own order; anything else
  is refused rather than stored, and a job created with an unknown status starts `new`. The
  index splits on `JOB_OPEN_STATUS` — the open half on top, the closed one folded into a
  `<details>` — so a second way of putting a row out of sight would be one the page had to
  explain on top of the two the chapter already gave it.
- **A deadline is a calendar day (`"YYYY-MM-DD"`), not millis.** Every other timestamp in
  the store is an instant; this one cannot be, because "the 14th" moves to the 13th or the
  15th for a browser in another timezone and session 25's terminarz has no way to recover
  from that. `crmDay()` validates strictly: exactly ten characters, a day that really
  exists (`2026-02-31` is refused), and **never a prefix of something longer** — the first
  ten characters of a full ISO instant are a guess.
- **The job carries both links; the project document carries neither.** `clientId` and
  `projectId` live on the job — the opposite direction from client → project, and not for
  symmetry: a project document is contract (it syncs, the phone reads it, `/p/<token>`
  renders it), so a `jobId` on it would be half a link in the half that travels, while a
  job travels nowhere. One project belongs to one job; a second link moves it. A job that
  carries both a client and a project files that project under that client too
  (`crmLinkProject()`), so chapter XXIV's chain is one chain and the client's page tells
  the same story as the job's. Deleting a client leaves their jobs alone and deleting a
  project leaves the link alone — both can be undone, and a link dropped on sight would
  return the row to nobody.
- **A job carries what was *agreed*; what it *cost* is still `wsProjectCosts()`.**
  `valueMinor` is chapter XXI's "wartość" — typed by hand, the amount agreed with the
  client — and it is the only figure on the page that is not derived. The cost is read from
  the project and never written back onto the job: a copy would disagree the moment a
  material was re-priced. The difference is computed only when both are in the same
  currency; otherwise the page says the currencies differ, because subtracting them is a
  conversion at a rate and chapter VI forbids those. The currency is stamped once, at the
  first amount typed, and kept through corrections; clearing the amount clears it so the
  next one is stamped fresh.
- **Clients are LiczMat Pro's first real module, and they are not in the sync contract.**
  Session 22 built `/klienci/` — the index plus one client at `?id=<clientId>`, the same
  two-screens-in-one-file shape as `/projekty/`. The store is `assets/crm.js` under its own
  key (`liczmat-crm-v1`), because `docs/FIRESTORE_SYNC.md` in the app repo has five
  collections and clients is not one of them: no `ClientEntity`, no
  `SyncContract.clientToDoc()`, no `validClient()` in the deployed rules. So nothing here
  is uploaded, `wsExport()` (what `/app/` pushes) does not carry it, and the page says so
  rather than implying a sync that does not exist. **Do not put clients into
  `materio-workspace-v1`** — that store is "the documents the app also keeps", and
  `wsExport()` would start sending a collection Firestore has never heard of. Carrying
  clients to the phone is a contract change in the app repo, which is a session of its own.
- **The client → project link lives on the client, and a project document is never
  touched.** Chapter XX lets a client have projects; the project is contract (it syncs, the
  phone reads it, `/p/<token>` renders it) while the client travels nowhere, so a `clientId`
  on the project would be half a link in the half that travels. `projectIds` on the local
  client keeps the whole relation in one place, survives the delete and the undo, and is
  what the test guards: after filing a project under a client the project document is
  byte-for-byte the one it was. One project has one client — a second link *moves* it.
  Deleting a client leaves their projects alone (the rooms argument, one level up), and
  deleting a project keeps the link, because `wsRestoreProject()` can bring it back and a
  link dropped on sight would return it to nobody. A client carries **no money**: what
  their work is worth is `wsProjectCosts()` over their projects, counted once each.
- **The terminarz stores nothing, and that is the whole session.** Session 25 built
  `/terminarz/` — chapter XXIII's "prosty terminarz zleceń" — and it is the one Pro module
  with no collection of its own. A deadline is already a field of a job (`dueDate`, chapter
  XXI), so the page is a *reading* of the jobs: `crmSchedule()` sorts them into five buckets
  (late, today, within 7 days, later, no date), closed jobs are in none of them, and the one
  write the page makes is `crmUpdateJob(id, { dueDate })` — the same call `/zlecenia/` makes.
  An `events` array beside the jobs would give one date two homes and let them disagree the
  first time somebody changed a deadline on the job's own page. It is also why the route has
  no `?id=` view: a row opens the job it stands for.
- **"Today" is the visitor's calendar day, and computing it in UTC is a bug that only shows
  up in the evening.** `crmToday()` builds the string from the local getters;
  `new Date().toISOString().slice(0, 10)` already says tomorrow at 23:30 in Warsaw, which
  would file a job due today under "late" every evening. `crmDaysUntil()` goes the other way
  and reads *both* calendar days at UTC midnight, because the difference between two
  calendar days is a count of days and a local reckoning has 23 or 25 hours in it twice a
  year. `jobs-ui.js` delegates to `crmToday()` rather than keeping its own copy — "is this
  job late" answered two ways is a site that contradicts itself.
- **The distance to a deadline is written by `Intl.RelativeTimeFormat`, not by the
  dictionary.** "za 3 dni", "in 3 Tagen", "через 3 дні", "yesterday" — Polish alone has three
  plural forms and Ukrainian another three, and the browser carries all of them already. A
  browser without the API gets no phrase; the date beside it still says everything, so the
  row degrades to fewer words and never to wrong ones.
- **The paywall is up (`LM_PRO_LOCKED = true`, session 27), and the preview is the one door
  through it.** Every PRO feature is walled off from a guest and from a free account, and
  nothing else is: `lmFeatureState()` only locks when the feature's level is PRO, so `sync`
  and `share` stay `gated` without a wall — what stands in their way is the sign-in form,
  which asks for an account rather than for money. The problem sessions 21–26 named has not
  gone away: nothing grants `plan: premium` (FIRESTORE_SYNC §9.2), so a bare lock would take
  five working modules from every account there is, including the one that has to check they
  work before there is anything to buy. Session 27 answered it with the **Pro preview** —
  one key in `localStorage` (`liczmat-pro-preview`), on one device, opening all five modules
  at once. It is not a plan and never claims to be: it writes nothing to Firestore, it is
  not synced, the phone never sees it, and `lmLevelOf()` does not read it, so the level is
  still derived in exactly one place. `lmFeatureState()` answers `allowed: false,
  preview: true` under it, which is what stops a page saying "Twój plan: LiczMat Pro" over
  something nobody bought. Session 28 replaces it with a subscription; it is deliberately
  one key and one function pair (`lmProPreview()` / `lmSetProPreview()`) so that removal is
  a deletion rather than an unpicking.
- **One wall, built once, and it is markup rather than script.** `proGate()` in
  `src/pro.mjs` replaced the four copies of the gate block sessions 22–25 wrote, and
  `assets/paywall.js` replaced the four copies of `xxxRenderPro()`. Four walls are four
  chances to describe one product four ways, and the paywall is the one place on this site
  where that costs money. The block is in the page from the first paint and `hidden` — a
  wall created by a script is a module that flashes open before it shuts — and it carries
  both rungs of chapter XXV's Free → Pro path (`data-pw-step="account"` for a guest, who has
  no account for a plan to sit on; `"upgrade"` for a free account), with the script showing
  one. It also lists the other four Pro modules, because a wall that shows one fifth of the
  product is asking somebody to buy the other four unseen. The fallback runs the other way:
  if `assets/plan.js` fails to load, `pwState()` answers "open", because the rows are this
  browser's own and hiding somebody's clients behind a script that did not arrive is the
  worse failure. None of it is a security boundary — the CRM store is `localStorage` and is
  in no sync contract.
- **The strip above an open module says one of two things, and never both.** "Twój plan:
  LiczMat Pro" for an account whose plan reaches it (chip `on`), or "Podgląd Pro" plus the
  sentence that the plan did not change and the button that ends it. When the wall is up the
  strip is hidden entirely: the wall says all of it, and twice is worse than once. A Pro
  account gets no "turn the preview off" button — there is nothing to turn off, and offering
  it to somebody who pays reads as a threat.

- **The chain is walked, never stored, and session 26 added no collection and no page.**
  Chapter XXIV's path — KLIENT → ZLECENIE → PROJEKT → WYCENA → HISTORIA — is made entirely
  of links sessions 22–25 already wrote: `projectIds` on the client, `clientId` and
  `projectId` on the job, `projectId` on the quote. So `crmChain(kind, id)` walks them
  from any end and `crm` is the one feature in `LM_FEATURES` with `route: null`. A stored
  chain would be a fifth copy of four links, free to disagree with all of them the first
  time a project changed hands — the argument that already keeps a cost off a job, a unit
  price off a shopping item and a date out of the terminarz. Upwards the walk is exact (a
  quote has one project, a project at most one job, a job at most one client); downwards it
  hands back a list and guesses nothing, because a client has many jobs. `crmQuoteChain()`
  kept its name and calls `crmChain()` underneath: two walkers over the same links would
  eventually answer one question two ways.
- **The history is derived from the documents and their dates, and it does not claim
  changes.** `crmHistory({clientId | jobId | projectId})` builds a row out of the client,
  each job, each quote, each saved calculation and each hand-typed cost — every one of them
  a document that already carries the date it was written on. What that leaves out is said
  out loud on the page (`crm_hist_note`): a status moved from "nowe" to "w toku" and a
  deadline pushed by a week leave **no** dated trace anywhere in the store, because a row
  carries one `updatedAt` that says when it last changed and never what changed. Recording
  them means an event log, which is the ERP chapter XXIV forbids in its last line — and a
  log would start lying the first time a row was deleted: the row would be gone and its
  entry would remain. Deleting a job removes its history row; the undo brings it back.
- **One link map, `window.LM_LINKS`, on all four Pro pages.** The build writes the five
  addresses (clients, jobs, projects, quotes, calendar) in that page's own language, in
  place of the four half-maps sessions 22–25 wrote (`LM_CRM`, `LM_JOBS`, `LM_QUOTES`,
  `LM_CAL`). The screens link to each other in every direction now, and four maps each
  holding half the site map is one moved slug away from disagreeing. `/terminarz/` gets the
  same map and does **not** load `assets/crm-chain.js`: it draws no chain, so it does not
  download one.
- **The chain stops at the edge of Pro, and `/projekty/` is that edge.** A project is the
  middle of chapter XXIV's path, but its route is GUEST and it loads nothing from the CRM.
  A strip there would carry Pro data onto a guest page, so the link runs one way: from the
  strip into the project, never back.
- **`/app/` has five tabs, and rooms are not one of them.** Chapter XVIII makes a room an
  element of a project, so `renderProjects()` draws each project's rooms inside its row
  with an add form of its own, and the rooms nobody assigned get one list at the bottom —
  that is every room made on the phone, because `SyncContract.roomToDoc()` has no
  `projectId` to send. `addRoom()` writes `projectId` since the fixes after session 20; it
  did not before, so a room created on this page belonged to nothing. `tombstone()` writes
  with `{ merge: true }` for the same reason the sync push does — a plain `setDoc` erased
  every field the browser does not know about (a material's note, a room's project) while
  marking the row deleted.
- **The header carries five links, and `/app/` carries the same ones as everywhere else.**
  `navRoutes("header")` is the whole list; `validateIA()` caps it at five and the fifth
  ("Aplikacja", asked for after session 20) was measured rather than assumed —
  `scripts/test-pages.mjs` checks the row stays on one line in four languages at
  900/1000/1160/1280 px, for a guest and for a signed-in visitor. A sixth still aborts the
  build. `/app/`, `/app/dashboard/` and `/p/` have no language of their own, so the build
  renders `DEFAULT_LANG`'s addresses and hands them every language's in `window.LM_NAV`;
  `assets/i18n-runtime.js` repoints each `data-nav-route` link on `langchange`. Before
  that, `/app/` carried one hard-coded Polish link and signing in emptied the menu.
  **`/p/<token>` keeps the short list on purpose** — it is a quote opened by somebody
  else's client, and a full menu turns it into a funnel.
- **`navLevel` hides a link; it never gates a page.** `src/ia.mjs` gives a route two
  separate levels: `level` is who may use the page, `navLevel` is who is offered the link.
  `projects` is `GUEST` + `navLevel: LICZMAT` — the owner's decision after session 20,
  which settles `docs/ARCHITEKTURA.md` §8.1. `src/template.mjs` writes `data-nav-level` on
  the `<li>` (not the `<a>`: the row is a flex list with a gap), the inline `<head>` script
  stamps `data-lm-level` from `liczmat-signed-in` before the first paint, and the
  stylesheet hides the item only when the level is known. **No script means no `.js` class
  means the link stays** — so Googlebot sees it, `/projekty/` keeps `indexable: true` and
  stays in `sitemap.xml`, and the page itself is not gated and cannot be.
- **`liczmat-signed-in` is a copy hint, never a gate.** `/app/` writes the level into it
  on sign-in and clears it on sign-out, because the 60 calculator pages do not load
  Firebase and still have to choose between "create a free account" and "your account
  will sync this" under the result (master plan XII); it is also the mark on the header's
  account button. It can be stale — signed out in another tab, an expired token — so
  nothing may gate saving, counting or reading on it. The value it held before session 13
  (`"1"`) still reads as signed in. Listed on `/cookies/`, next to `liczmat-remember`,
  which is this device's answer to "keep me signed in".
- **`/app/dashboard/` loads no Firebase at all.** It is the first screen after signing in,
  and everything on it — projects, the last saved estimate lines, the tools that were
  used — is already in `localStorage`. Waiting for an SDK download and an auth round-trip
  before listing somebody's own local projects would make the dashboard slower than the
  calculator they came from. The level in its strip is the `liczmat-signed-in` hint, so
  it words the page and gates nothing: a guest sees their own data plus a sign-up card.
  The build hands the page every per-language URL it might need in `window.LM_DASH`,
  because it has no language of its own to derive them from.
- **`liczmat-recent-calcs` is not a Firestore document and must not become one.**
  `assets/recent.js` keeps a calculator id and a time, nothing else — no inputs, no
  results, no prices — so the dashboard can answer "ostatnio używane narzędzia". It is
  device-local, is listed on `/cookies/`, and the visitor can clear it on the page that
  shows it. A calculator records itself only on a calculation the visitor asked for
  (`byHand` on the `calcresult` event), never on the silent run that happens on load.
- **A project document carries `name` and `archived`, and nothing you add to it.** The
  deployed rules validate the shape rather than a key whitelist, so a browser *can* write
  an extra field — but `SyncContract.projectToDoc()` in `3d-polednia/Materio` builds the
  document from a fixed map and `ProjectEntity` has nowhere to keep one, so the phone
  erases it on its next push, silently. Chapter XIV's description, notes and per-project
  history therefore wait on a contract change in the app repo (`docs/FIRESTORE_SYNC.md`,
  `SyncContract.kt`, the Room entity and its migration) — see `docs/ARCHITEKTURA.md`
  §8.1c. Deleting a project writes a tombstone and hands back the ids it tombstoned, and
  `wsRestoreProject()` takes that token: undo is exact rather than a guess from
  timestamps, and it never resurrects a line the visitor deleted by hand.
- **An estimate line's extra information goes inside `inputJson`, never beside it.** A
  saved calculation has to answer, later, which calculator made it, what was typed, what
  came out, in what unit and when (master plan XV) — and the document has room for none of
  that. A new top-level field would be erased by the phone without a word, exactly as a
  project description would be. `inputJson` is the one contract field that is free-form and
  round-trips (a column on `EstimationEntity`; the app writes its own snapshot there with
  `ignoreUnknownKeys` and never reads a foreign one), so session 16 put the snapshot in it
  under `_lm`, beside the flat field map that was already there. It stores **keys, never
  words** — `fld_area`, `res_pkgs`, the engine's own `|n:21.6| m²` tokens — which is what
  lets a line saved in Polish read correctly in German; the keys come from `data-lk` and
  `data-ok`, written onto every form control by `calcCard()`. Read it with
  `wsLineSnapshot()`, which answers `null` for anything that is not this site's snapshot.
  `docs/ARCHITEKTURA.md` §7.1.
- **The material list is `shoppingItems`, and the app was already writing it.** Chapter
  XVI's arrow ends at "materiał trafia do listy", and the list has been in the contract
  since its first version: `users/{uid}/projects/{id}/shoppingItems/{itemId}`, its own
  entity in Room, its own `SyncContract.shoppingItemToDoc()`, its own `validShoppingItem()`
  in the deployed rules, and a rendered block on `/p/<token>`. `CalculatorViewModel.save()`
  on Android inserts the estimation, takes the id back and inserts the shopping item with
  it — the web inserted only the estimation, so a project built in a browser reached the
  phone and the shared link with an **empty** material list. Session 17 writes the other
  half, in the same order and with the same fields. Two fields differ from an estimate
  line and both matter: `quantity` is a **number**, not an integer (a line can only say
  26, a material can say 26,4 m² — chapter XVI's own example), and `materialCategory` is a
  free string here rather than an enum name, because it is the shop aisle.
  `docs/ARCHITEKTURA.md` §7.2.
- **An extra field on a synced document is NOT erased by the phone — sessions 15, 16 and 17
  all said it was, and were wrong.** The half they had right: `SyncContract.*ToDoc()` builds
  each document from a fixed map, so a field the browser invents is never in what the phone
  sends. The half they missed: `CloudSync.pushLocal()` sends it with
  `.set(map, SetOptions.merge())`, and a Firestore merge writes only the keys it is handed
  and leaves every other key on the document alone. **Every** write in `CloudSync.kt` is a
  merge, tombstones included. So the fixed map cannot erase what it does not mention. Read
  it in `3d-polednia/Materio` before relying on either version of this.
  That is what lets session 18 put chapter XVI's **note** on the material as a plain `note`
  field: the deployed rules validate `validShoppingItem()` by shape and have no `hasOnly`,
  so the write is accepted; `shoppingItemFromDoc()` reads by key and ignores what it does
  not know; and the merge carries it back. What it does **not** buy is visibility — the
  phone has no column for it, so the note is invisible there and missing from the app's CSV
  until the app repo adds one. The note is carried, not lost, and the page says so.
  `assets/app.js` now pushes with `{ merge: true }` for the same reason the app does: the
  browser knowing every contract field is not the same as the browser knowing every field.
- **A material's unit price is a division, not a field — do not add one.** Chapter XVII wants
  "Klej | 7 × 35 PLN | = 245 PLN", and the contract has one money field on a shopping item:
  `estimatedCostMinor`, the **total** (`ShoppingItemEntity` has no unit price,
  `validShoppingItem()` validates none, `ShoppingCsvExporter` prints none). A unit price kept
  beside the contract would survive the sync — the bullet above says why — but it would be
  free to disagree with the money the moment the phone changed the quantity or the cost, and
  a price that contradicts the total is worse than no price. `wsUnitPriceMinor()` divides,
  answers `null` when there is nothing to divide, and is exact for everything this site
  writes, because every engine computes `cost = units × price`. The write goes the other way
  (`wsItemCostMinor()`: quantity × price, rounded once). A price typed onto a row that has
  never held money stamps it with the visitor's currency; a row that already holds an amount
  keeps the currency it was priced in, because re-stamping 245 zł as 245 € is a conversion at
  a rate and chapter VI forbids those. `docs/ARCHITEKTURA.md` §7.4.
- **`wsProjectCosts()` counts every amount in a project exactly once.** Saving a calculation
  writes an estimate line **and** a material carrying the same money, so the project's cost is
  the shopping list, plus any calculation with no material on it, plus the lines nothing
  calculated (`manual` in `inputJson` — chapter XVII's "inne koszty"). Adding the two
  collections together would double the bill; dropping the materialless calculations would
  hide money that is still listed on screen. The projects index, the dashboard and the project
  screen all read this one function, so "what does this project cost" has one answer.
  `/kosztorys/` still totals the estimate lines — it is the document of what was calculated,
  and the estimate with labour and margin is session 24.
- **A room belongs to a project by a field the contract does not have, and the phone cannot
  show.** Chapter XVIII says "pomieszczenia są elementem projektu"; FIRESTORE_SYNC §2 puts
  them at `users/{uid}/rooms/{roomId}` — *beside* projects — and says why: "wybór pokoju
  i wybór kalkulatora to dwie niezależne osie". Both hold, because the link is `projectId`
  and `projectId` survives: `RoomEntity` has no column and `SyncContract.roomToDoc()` no
  key, but `CloudSync.pushLocal()` writes every room with `SetOptions.merge()`, the deployed
  `validRoom()` validates by shape with no `hasOnly`, and `roomFromDoc()` ignores keys it
  does not know. Read for rooms specifically in `3d-polednia/Materio`, not copied from
  session 18's note. `assets/workspace.js` has written the field since the workspace
  existed and never read it; `/app/` did not even send it, so the link died at the browser's
  edge until session 20. **Deleting a project does not delete its rooms** — the phone does
  not either (`recordTombstones()` walks estimations and shopping items and stops), and the
  room keeping its `projectId` is what makes the undo exact. `docs/ARCHITEKTURA.md` §7.5.
- **Which room a calculation was made for goes inside `inputJson`, under `_room`.** Same
  wall as the snapshot: `EstimationEntity` has a `projectId` and no `roomId`. A top-level
  field would survive the merge, but `inputJson` is already contract, already free-form and
  already round-trips, and session 16 put the snapshot there for that reason — a second
  mechanism for one job is one more thing to keep in step. `_room` sits beside `manual` at
  the top level rather than inside `_lm`, because a hand-typed line has no snapshot and may
  still belong to a room. Read it with `wsLineRoomId()`, write it with `wsSetLineRoom()`,
  which leaves the rest of the string alone and refuses rather than truncating at the
  contract's 20 000-character cap. A room another project owns is dropped on the way in.
- **The workspace works signed out.** `assets/workspace.js` keeps projects, rooms,
  estimate lines and materials in `localStorage` in the *same document shape* as Firestore,
  so the sync tab in `/app/` is a plain copy in either direction. Counting must never
  require an account (FIRESTORE_SYNC §1.2) — do not move these behind the sign-in wall.
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
