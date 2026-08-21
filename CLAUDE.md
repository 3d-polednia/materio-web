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

The site used to be one `index.html`. It is now 373 pages: a home page, a calculator
hub, one page per calculator, guides, a store finder and the public page for LiczMat Pro —
each in all ten languages, at its own URL, so search engines can index more than the
Polish front page. Writing that by
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
node scripts/test-pay.mjs         # the subscription: prices, the checkout URL, the Stripe hosts
node scripts/test-pro-admin.mjs   # granting Pro by hand: the three fields, the mask, the key
node scripts/test-webhook-map.mjs # the Stripe webhook: the signature, the status, the write
node scripts/test-jobs.mjs        # jobs: the document, the statuses, the deadline, the links
node scripts/test-quotes.mjs      # quotes: labour, the margin, the five figures
node scripts/test-calendar.mjs    # the terminarz: the buckets, the day arithmetic, the one write
node scripts/test-crm.mjs         # the chain: the walk, the derived history, one link map
node scripts/test-propage.mjs     # /liczmat-pro/: the route, the price in the HTML, the copy
node scripts/test-seo.mjs         # technical SEO: sitemap, robots, canonical, hreflang, OG
node scripts/test-calc-seo.mjs    # the calculators as landing pages: title, description, FAQ
node scripts/test-mobile.mjs      # the whole site on a phone: widths, tap targets, fields
node scripts/test-perf.mjs        # what a page weighs: bytes, requests, the render path
node scripts/test-a11y.mjs        # names, headings, landmarks, live regions — in the markup
node scripts/test-a11y-page.mjs   # focus, the keyboard, both themes — in Chromium
node scripts/test-security.mjs    # authorization, data isolation, the API, the levels
node scripts/test-qa.mjs          # the whole path, end to end, in a real browser
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
| `assets/i18n-pages.js` — keys only sub-pages use | `kalkulatory/**`, `poradniki/**`, `sklepy/**`, `materialy/**`, `liczmat-pro/**` and their per-language twins |
| `assets/i18n-materials.js` — material names, 4 languages | `app/index.html`, `p/index.html` |
| `assets/calculators.js` — engines, ported 1:1 from Kotlin, and `assets/units.js` next to it | `assets/i18n.<lang>.js` — one per language, and the only kind there is since session 33 |
| `assets/materials.js` — the catalogue, ported from `Catalog*.kt` | `assets/flags.js` — the ten flags, for the three pages that build their own picker |
| `assets/styles.css` — **authored**; the build emits `assets/styles.min.css` from it, and that is what every page links | `assets/styles.min.css` — the same rules with the commentary stripped |
| `assets/main.js`, `stores.js`, `i18n-runtime.js`, `currency.js` | `sitemap.xml` |
| `assets/flags/<lang>.svg` — the picker's flags | |
| `assets/materials-ui.js`, `assets/app.js`, `share.js`, `firebase-config.js` | |
| `assets/workspace-calc.js` — the room bar and the save box on a calculator page | |
| `assets/plan.js` — the Free/Pro model and the permission table | |
| `assets/crm.js` — the clients, jobs and quotes of LiczMat Pro, plus `crm-ui.js`, `jobs-ui.js`, `quotes-ui.js` and `crm-chain.js` | |
| `assets/recent.js`, `assets/dashboard.js` | |
| `src/*.mjs` — information architecture, site map, templates, page bodies, formulas, the calculators' SEO copy | |
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
                      pages declared here, and sitemapUrls() reads sitemap.xml's whole
                      contents off the same list. Narrative: docs/ARCHITEKTURA.md
src/site.mjs          Languages, URL slugs per section/calculator/guide — the site map
src/template.mjs      <head>, header, footer, consent banner, breadcrumbs
src/pages.mjs         The <main> of each page type
src/calc-meta.mjs     Per-calculator formula lines + their translations
src/calc-seo.mjs      Per-calculator SEO copy, ten languages: the <title> stem (which is
                      also the H1), the meta description (which is also the paragraph
                      under it) and two questions with their answers. Build-time only —
                      it is deliberately NOT a dictionary, because every page on the site
                      downloads assets/i18n.<lang>.js and none of this is needed there
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
                      ?next= link may point, and the copy in ten languages.
                      Dependency-free — run it after touching assets/account.js,
                      assets/app.js, ACCOUNT_LEVELS or an acc_*/prof_* key
scripts/test-account-page.mjs  /app/ in Chromium with the Firebase SDK stubbed: sign-up,
                      sign-in, sign-out, the reset, the profile, the level, the tabs.
                      Same outside-the-repo Playwright as test-pages.mjs
scripts/test-dashboard.mjs  The dashboard: the route, the "recently used tools" store,
                      the frame the build writes, the addresses it hands the page and the
                      copy in ten languages. Dependency-free — run it after touching
                      assets/recent.js, assets/dashboard.js, dashboardMain() or a dash_* key
scripts/test-projects.mjs  Projects: the `project` view declared in src/ia.mjs (and the
                      eight ways a view can lie, each broken on purpose), the four writes
                      in assets/workspace.js — create, read, rename, archive, delete —
                      the undo the tombstone makes possible, the frame the build writes
                      for both screens and the copy in ten languages. Dependency-free —
                      run it after touching assets/workspace.js, projectsMain() or a
                      proj_*/ws_* key
scripts/test-projects-page.mjs  /projekty/ and /projekty/?id=<id> in Chromium, nothing
                      stubbed: the two screens, the CRUD done by clicking, the archive,
                      the undo strip, the back button, ten languages, the currency
                      switch, the widths of chapter XXVIII and the no-JavaScript variant
scripts/test-dashboard-page.mjs  /app/dashboard/ in Chromium, nothing stubbed (the page
                      loads no Firebase): the four lists from a planted localStorage, the
                      level strip, the language and currency switches, and the widths
                      chapter XXVIII names — 320/375/390/430/768/1280 px
scripts/test-save.mjs  Saving a calculation: the snapshot a saved line carries inside
                      `inputJson`, the contract's 20 000-character cap, which project the
                      line lands in, the `data-lk`/`data-ok` keys the build puts on every
                      field, and the copy in ten languages. Dependency-free — run it
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
                      typing one in by hand, taking it off, ten languages, the currency
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
                      room's project, ten languages, the currency switch, the widths of
                      chapter XXVIII and the no-JavaScript variant
scripts/test-plan.mjs  The Free/Pro model and the paywall (sessions 21 and 27, chapters
                      II, XIX and XXV): the two plan values against the sync contract,
                      lmPlanStatus() including the Pro plan that ran out, the permission
                      table against src/ia.mjs, what lmCan()/lmGate() answer for every
                      feature at every level, the five Pro modules in session order — and
                      session 27's wall: that it stands in front of every PRO feature and
                      no other, the rung lmPaywall() puts each level on, the wall as
                      proGate() builds it in ten languages, and that nothing in the Pro
                      panel offers to take money. Session 28 added the five subscription
                      states and §6c, which plants four hopeful keys in localStorage and
                      checks that not one answer moves. Dependency-free — run
                      it after touching assets/plan.js, assets/paywall.js, src/pro.mjs or a
                      pro_*/plan_*/feat_* key
scripts/test-clients.mjs  Clients (session 22, chapter XX): the client document and the
                      money it deliberately does not carry, the four writes plus the undo,
                      the client → project link (stored on the client, one client per
                      project, and the project document byte-for-byte untouched), the
                      derived costs and history, the route, chapter XXV's gate in both of
                      its states — including the one after LM_PRO_LOCKED is flipped — and
                      the copy in ten languages. Dependency-free — run it after touching
                      assets/crm.js, clientsMain() or a cli_*/clipage_* key
scripts/test-jobs.mjs  Jobs (session 23, chapter XXI): the job document and chapter XXI's
                      eight fields, the four statuses and the one that is refused, the
                      deadline that is a calendar day rather than an instant, the four
                      writes plus the undo, chapter XXIV's chain — client → job → project,
                      with the project document byte-for-byte untouched — the two amounts
                      (what was agreed, what wsProjectCosts() says it has run to) and the
                      currency rule between them, the route, chapter XXV's gate in both of
                      its states and the copy in ten languages. Dependency-free — run it
                      after touching the job half of assets/crm.js, jobsMain() or a
                      job_*/jobpage_*/cli_jobs_* key
scripts/test-jobs-page.mjs  The same clicked through in Chromium, nothing stubbed: a job
                      added with a client and a date, opened, corrected, moved through the
                      statuses, its project attached and detached, deleted with its undo,
                      the client's own page reading the link back, the Pro notice for a
                      guest and for a Pro account, ten languages, the currency switch, the
                      widths of chapter XXVIII and the no-JavaScript variant
scripts/test-quotes.mjs  Quotes (session 24, chapter XXII): the document and the three
                      figures it deliberately does not store, the labour — quantity × rate
                      rounded once, the lump sum, the rate read back by dividing and the
                      cap — the margin, which is a percentage of everything above it, the
                      five figures each traced to one source with the project document held
                      byte-for-byte, chapter VI's currency rule in both directions, chapter
                      XXIV's chain walked backwards from the quote, the route, chapter XXV's
                      gate in both of its states and the copy in ten languages.
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
                      XXV's gate in both of its states and the copy in ten languages.
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
                      ten languages. Dependency-free — run it after touching the chain
                      half of assets/crm.js, assets/crm-chain.js or a crm_* key
scripts/test-propage.mjs  /liczmat-pro/, the public page for LiczMat Pro (session 29,
                      chapter XXXII): the route — GUEST, indexable, one slug in ten
                      languages, no gate — and the three places that point at it; the page
                      itself in ten languages, including the five modules read out of
                      LM_FEATURES and the modules it deliberately does not link into; the
                      price, which is in the HTML and is the hand-typed amount for that
                      language's currency rather than a conversion; that nothing on it
                      offers to take money; and the ten files that actually shipped, with
                      their canonical, their hreflang and their place in sitemap.xml.
                      Dependency-free — run it after touching proPageMain(), the route in
                      src/ia.mjs, buildProPage() or a propage_* key
scripts/test-propage-page.mjs  The same page in Chromium, nothing stubbed: the price in the
                      visitor's currency and the currency switched while the page is open,
                      a Pro account shown their plan instead of a price, ten languages each
                      linking inside their own, the widths of chapter XXVIII, the home
                      page's third door — and the no-JavaScript variant, where the amount
                      is still on the screen because the build wrote it into the markup
scripts/test-seo.mjs  The technical SEO of the whole site (session 30, chapter XXXII):
                      the 375 files that shipped, read back — which pages are open to a
                      crawler and which four are deliberately closed; robots.txt, and
                      that no `Disallow` stands in front of a page carrying `noindex`;
                      sitemap.xml against sitemapUrls() in src/ia.mjs, its `lastmod`
                      (a real date, never in the future, absent on the page the build
                      does not generate) and the two elements that are gone; the language
                      groups in the sitemap and the hreflang sets in the markup, both
                      checked for reciprocity; every canonical pointing at its own page
                      and no two pages claiming one; title and description lengths, and
                      that no two pages share a description; the whole Open Graph and
                      Twitter set, with og:locale:alternate against the same language list
                      hreflang uses; and the JSON-LD — that it parses, that every sub-page
                      carries a BreadcrumbList, and that the Organization and the WebSite
                      are one entity each rather than one per mention. Dependency-free —
                      run it after touching the <head> in src/template.mjs,
                      buildSitemap(), sitemapUrls(), robots.txt, a *_meta key or a
                      route's `indexable` flag
scripts/test-calc-seo.mjs  What the 150 calculator pages SAY (session 31, chapters XII and
                      XXVI): the title — this calculator's own, ≤ 60 characters with the
                      brand on it, and never repeated inside one language; the description,
                      which is the same text in the <meta> and in the paragraph under the
                      H1; the H1, of which there is one and it is the title; the FAQ — both
                      questions in the markup and a FAQPage saying exactly what the markup
                      says; chapter XII's order, checked by position (H1 → form → result →
                      explanation → FAQ); chapter XXVI's "nie upychaj słów kluczowych"; and
                      that none of this copy reached the dictionary every page downloads.
                      Dependency-free — run it after touching src/calc-seo.mjs,
                      calcPageMain() or buildCalculatorPages()
scripts/test-mobile.mjs  The whole site on a phone (session 32, chapter XXVIII): every
                      page type in ten languages at 320 px and the six widths the chapter
                      names by hand — 320/375/390/430/768/1280 — plus the modules with
                      data in them (projects, materials, costs, rooms, the estimate, the
                      dashboard and the four Pro screens). What it asks is what a phone
                      asks: nothing scrolls sideways, every field is 16 px of text in a
                      44 px box (under 16 px iOS Safari zooms the page on focus), every
                      tap target is 44 px tall, a table scrolls inside its own box, a
                      number is typed on a numeric keypad and never on a `type="number"`
                      spinner, the three switches of chapter XXXII work at 320 px, and a
                      calculation can be made on the narrowest phone there is. Needs the
                      same outside-the-repo Playwright as test-pages.mjs
scripts/test-perf.mjs  What a page weighs (session 33, chapter XXXII): every page read
                      back with the assets its markup asks for, raw and gzipped, against a
                      budget per page type plus a ceiling every one of the 375 has to
                      clear; that the shipped stylesheet is the authored one with the
                      commentary gone and the same rules underneath; that a page downloads
                      one language and can fetch a second; the flags, the logo and the
                      icons chapter XXXII names by hand; what stands on the render path —
                      no third-party <script src> in the markup, one stylesheet, no
                      preconnect, one cache stamp; images with width, height and lazy
                      loading; no HTML comment in a generated page; the two halves of the
                      workspace and no script named twice; and the fonts, of which there
                      are none. Dependency-free — run it after adding a script or a
                      stylesheet to a page, or after changing what the build emits
scripts/test-a11y.mjs  Accessibility as a property of the markup (session 34, chapter
                      XXXII): the landmarks and the skip link, whose target has to be
                      focusable or the link scrolls and leaves the focus in the header;
                      the heading outline — one <h1> per document, no level skipped, no
                      empty heading a visitor can reach; every field with a name that is
                      not just its placeholder; every button, link and image with one;
                      every icon hidden from the tree; ids unique and every aria-controls,
                      aria-labelledby and aria-describedby resolving; the live regions the
                      product depends on, starting with the calculator's result; the three
                      switches of chapter XXXII; the carousel's stop button (WCAG 2.2.2);
                      table headers with a scope; and the rules in the stylesheet that put
                      the focus ring on the screen. Dependency-free — run it after touching
                      anything that writes markup
scripts/test-a11y-page.mjs  The same product driven by keyboard in Chromium, nothing
                      stubbed (session 34): Tab to the skip link and Enter into <main>; the
                      accessibility tree Chromium itself builds, on fourteen screens with
                      data in them, checked for a control with no name; a ring on every
                      stop of the way through a calculator and a project; no keyboard trap
                      between the header and the footer; the language menu opened with
                      Enter, walked with ArrowDown and shut with Escape, which hands the
                      focus back; the currency select; the theme toggle in both themes,
                      with the ring still visible in the one it switched to; a calculation
                      made with Enter and announced, and nothing written into that live
                      region before the visitor asked; the material dialog's Escape and the
                      focus it gives back; the screenshots stopped and started from the
                      keyboard, and never started at all under prefers-reduced-motion.
                      Needs the same outside-the-repo Playwright as test-pages.mjs
scripts/test-security.mjs  Security as a property of the code (session 35, chapter
                      XXXII): the three levels, derived from Firebase and never from a
                      value in storage; `?next=`, resolved with the browser's own URL
                      parser rather than compared as a string, because the parser deletes
                      tab, CR and LF and `/<tab>/evil.example` used to pass; `?mode=`;
                      the share token — its shape, checked before it becomes a Firestore
                      path, and the CSPRNG it comes from; /p/, the one page whose address
                      is a credential, read back to prove it carries no analytics and no
                      referrer while every other page still carries the tag; the stamp
                      that says whose copy is in this browser and the refusal it makes
                      possible; every Firestore address in assets/app.js, each one under
                      this account or on the public share document; pathId(); the profile
                      fields a browser may not write; the permission table against
                      src/ia.mjs and the hint that gates nothing; every shipped page read
                      for an inline handler, a javascript: URL, a window opened without
                      noopener or a script from somebody else's origin; the device wipe
                      against the list on /cookies/; the repo read for a private key; and
                      what a name somebody else typed does in HTML, in a CSV and in a file
                      name. Dependency-free — run it after touching anything that reads a
                      URL, builds a Firestore path, writes storage or renders a stored row
scripts/test-qa.mjs   The final QA walk (session 36, chapter XXXVI): the whole product
                      from end to end, in a browser that starts empty and is never
                      planted again — GOŚĆ → kalkulator → wynik → rejestracja → LICZMAT →
                      projekt → kalkulacja → materiały → koszty → LICZMAT PRO → klient →
                      zlecenie → projekt → wycena → historia, every row read back having
                      been produced by clicking. Then the four switches the chapter names,
                      thrown mid-journey rather than on an empty page: the language changed
                      with a quote open, the currency changed with a priced project open,
                      the theme changed by its button, the Back button up the chain — and
                      the sign-out, after which the wall goes back up and the counting does
                      not. Walked five times: pl/PLN, uk/UAH, de/EUR, en/USD and de/PLN, so
                      every language, every currency, both themes and both viewports are
                      covered, and the last one breaks the pairing on purpose (chapter VI —
                      a currency is not a language). Only /app/ is stubbed, with
                      scripts/fake-firebase.mjs, because the container cannot reach gstatic.
                      Needs the same outside-the-repo Playwright as test-pages.mjs
functions/            The Cloud Functions codebase — deployed with `firebase deploy
                      --only functions`, NEVER served by GitHub Pages. It is stripped from
                      the artifact in `.github/workflows/pages.yml` alongside docs/, src/
                      and scripts/, because the repo root is the site root. `firebase.json`
                      and `.firebaserc` at the root are its deployment configuration
functions/stripe-map.mjs  The whole decision half of the Stripe webhook, and it imports
                      NOTHING: the signature check, the subscription status → plan mapping
                      and the three fields to write. That is what lets
                      scripts/test-webhook-map.mjs check it with plain `node`, without npm,
                      without deploying and without a Stripe account. It holds the second
                      copy of the two plan words and the three field names; §1 of that test
                      is the only thing binding it to assets/plan.js and scripts/pro-admin.mjs
functions/index.js    The thin half: verify, decide, write. Reads one secret
                      (STRIPE_WEBHOOK_SECRET, in Secret Manager), calls Stripe never, and
                      writes `plan`/`planValidUntil`/`planRenews` on users/{uid} with
                      `{ merge: true }` plus one mapping document in `stripeCustomers`
scripts/test-webhook-map.mjs  The webhook, checked without the cloud: the signature (real,
                      forged, stale, replayed, rotated), the period end read from both
                      places Stripe keeps it, every subscription status, the cancellation
                      that does NOT take Pro away today, what a write puts in and takes out,
                      the decision for all four handled events, and the deployment
                      boundaries — that functions/ never reaches the published site and no
                      Stripe secret is in the repository
scripts/pro-admin.mjs  Granting and taking away LiczMat Pro, by e-mail (session 37 of the
                      repair plan). `plan` is server-only, so nothing in a browser can
                      write it and nothing did: this is the first thing that can. Reads a
                      service-account key from LM_SA_KEY (never from the repo), finds the
                      account in Firebase Auth by its address — the profile document has
                      no e-mail on it, which is why the Firestore console alone cannot do
                      this — and writes `plan`, `planValidUntil` and `planRenews` through
                      a PATCH whose updateMask names those three and nothing else. Without
                      the mask the same call erases createdAt and lastSeenAt.
                      Dependency-free. `list`, `status`, `grant <e-mail> [months]`, `revoke`
scripts/test-pro-admin.mjs  The same tool, checked without a key: the contract (the two
                      plan words and the three fields, against assets/account.js and
                      assets/plan.js), the typed Firestore values, the mask, the revoke
                      that deletes two fields by omitting them, the month arithmetic and
                      what it refuses, the JWT — shape, hour of life and a signature
                      verified against its public key — a key from another project, and
                      what the script may never do: write in the repo, or send a PATCH
                      anywhere but the masked address
scripts/fake-firebase.mjs  Firebase, as much of it as /app/ actually touches: the three
                      modules assets/app.js imports, served in Chromium instead of the CDN.
                      Shared by test-account-page.mjs and test-qa.mjs — two copies of a
                      stub that has to match a real SDK is two copies free to disagree.
                      Since session 37 it also has listeners on a single document and
                      window.__fbPushDoc(path, data), which is how a test plays the server
                      granting a plan under an open page
scripts/test-crm-page.mjs  The same path clicked through in Chromium, nothing stubbed: the
                      strip on a job, a step nobody filled in, the quotes and the history
                      on both the job and the client, the whole loop walked by clicking
                      (job → client → quote → job) with the Back button through it, the
                      store byte-for-byte unchanged by all of it, ten languages with each
                      language's own addresses, the currency, the widths of chapter XXVIII
                      and the no-JavaScript variant
scripts/test-quotes-page.mjs  The same clicked through in Chromium, nothing stubbed: a quote
                      added against a project, labour typed on as quantity × rate and as a
                      lump sum, a line corrected in its own row and removed, the margin
                      moved with the sum following it, the project detached and attached,
                      the quote deleted with its undo, the job and the client read back from
                      the project, ten languages, the currency switch, the widths of
                      chapter XXVIII and the no-JavaScript variant
scripts/test-clients-page.mjs  The same clicked through in Chromium, nothing stubbed: a
                      client added and corrected, a project filed under them and taken off,
                      the archive, the delete with its undo, the Pro notice for a guest and
                      for a Pro account, ten languages, the currency switch, the widths of
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
                      moving with both, ten languages, the currency switch, the widths of
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
                      spend it. Never write a literal colour/radius/duration below it.
                      Authored, and the file to edit; the build writes assets/styles.min.css
                      from it — same rules, commentary gone — and that is what pages link
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
assets/workspace-calc.js  The workspace on a calculator page: the room bar that fills a
                      form from a room somebody measured, the save box that files a result
                      in a project, and the vocabulary both halves speak (wsT, wsEsc,
                      wsNum, wsDecimal, wsPlain, wsUnit, wsLang). Split out of
                      assets/workspace-ui.js in session 33 — 150 of the 373 pages are
                      calculator pages and none of them draws the projects screen
assets/workspace-ui.js  The two workspace screens: /projekty/ and /kosztorys/. The projects
                      page holds two of them — the index and one project at
                      ?id=<projectId> — including the material list of chapter XVI and,
                      since session 20, the project's rooms and the picker that files one
                      calculation under one of them. Loaded after assets/workspace-calc.js,
                      which defines what it speaks
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
                      lmPaywall(), plus session 28's lmSubscription() — the five states a
                      plan can be in, including the cancelled one. Loaded after
                      assets/account.js on the five pages that offer a Pro feature, and
                      nowhere else
assets/paywall.js     The paywall, drawn. One file for all five Pro modules: the strip
                      above the module, the wall instead of it, the rung of the Free → Pro
                      path this visitor is on, and — since session 28 — the price of both
                      plans in the visitor's currency. It decides nothing — lmPaywall() and
                      lmPayPrice() do — and it creates no element: the markup is written
                      by proGate() in src/pro.mjs at build time. It never takes money: the
                      checkout needs a uid, so it lives on /app/ and the wall links there
assets/pay.js         The subscription: the two plans, their fourteen hand-typed prices in
                      seven currencies, and the two Stripe addresses (Payment Link,
                      Customer Portal). Ships priced and NOT buyable — the links are empty
                      until the owner has verified that paying actually grants the plan;
                      the ORDER note at the bottom of the file is that checklist. Reads no
                      storage, fetches nothing, converts nothing
assets/account.js     The user session and the three access levels of chapter II. Loaded
                      on every page: it is what lets a calculator word the sentence under
                      the result without loading Firebase. /app/ is its only writer
assets/units.js       The word next to a number: the plural forms of a counted noun —
                      three rule families since the restore (last-digit for pl/uk/ru/hr/sr,
                      exactly-2-to-4 for cs/sk, 2-to-19 for ro), because "22 položky" is
                      wrong Czech for what Polish spells "22 pozycje" — and
                      the |token| substitution in a result row. Split out of
                      assets/calculators.js in session 16 so /projekty/, /kosztorys/ and
                      the dashboard can print a saved result without downloading the
                      engines. Loaded before assets/calculators.js everywhere
assets/i18n-runtime.js  t(), the language switcher, in-place translation for /app/ and /p/.
                      A language link carries the page's query string, so switching
                      language on /projekty/?id=<id> keeps the project. ensureLang() is
                      session 33's half: the three pages with no language of their own
                      fetch a second dictionary when somebody picks a language, instead of
                      every page carrying all ten
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

- All three are **noindex** (the robots meta tag, and only that) and stay out of
  `sitemap.xml`. **`robots.txt` deliberately blocks nothing** — session 30 removed the
  `Disallow: /app/` and `Disallow: /p/` that used to sit there, because the two do not
  stack: a crawler told not to fetch a page never reads the `noindex` on it, and can
  still list the bare URL on the strength of a link elsewhere. For `/p/<token>` that is
  worse than an ordinary listing — the token in the URL *is* the credential, so the
  listing would publish it. Nothing on either page is private to a crawler anyway:
  `/app/` signed out is a sign-in form and `/p/` with no token renders no estimate.
  `scripts/test-seo.mjs` §1b fails the moment a `Disallow` reappears in front of a
  `noindex` page.
- They have no per-language URLs; they translate in place, and since session 33 they load
  **one** dictionary rather than ten. `assets/i18n.all.js` is gone — it was 703 kB (220 kB
  gzipped) and these were the only three pages that fetched it. They now ship
  `assets/i18n.<DEFAULT_LANG>.js`, and `ensureLang()` in `assets/i18n-runtime.js` fetches a
  second bundle when the visitor picks another language. Every generated bundle is additive
  (`var I18N = (typeof I18N === "object" && I18N) || {}` then `I18N["de"] = …`), so a second
  one merges instead of colliding; `LANGS` is the same ten in every bundle, so the picker is
  complete before anything is fetched, and a bundle that never arrives leaves the page in
  the language it is already in rather than showing keys.
  **Anything JavaScript writes has to be redrawn on `langchange`** — `/app/` swaps the DOM
  instead of navigating, so a list, a date or a chip rendered once stays in the old
  language otherwise. That rule is now load-bearing rather than tidy: the switch is
  asynchronous, so the page paints in `DEFAULT_LANG` first and `langchange` is what corrects
  it. A browser test that clicks the picker has to wait for `document.documentElement.lang`
  (`pickLang()` in `scripts/test-account-page.mjs`).
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
  in all ten languages for the same reason. The two bullets below describe that machinery
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
- **A plan is granted by the owner, by hand, and by nothing else yet.** `users/{uid}.plan`
  is `"free"` or `"premium"` (the contract's word, older than the rebranding — do not
  rename it) and it is server-only: no Cloud Functions, no Play Billing
  (FIRESTORE_SYNC §9.2), and the deployed rules let a browser write nothing in the profile
  but `lastSeenAt` and `appVersion`. What changed in session 37 of the repair plan is that
  `scripts/pro-admin.mjs` can write it with a service-account key —
  `grant <e-mail> [months]` and `revoke <e-mail>` — so LICZMAT PRO is reachable for the
  first time. It is still not *buyable*: nothing takes money and nothing renews a plan. So the Pro tab on `/app/` describes the five modules in full,
  marks each "Dostępne w LiczMat Pro", and says out loud that nothing grants Pro yet —
  chapter XXV asks for a free user who understands what is Pro. `lmPlanStatus()` keeps the
  half `lmLevelOf()` throws away: a `premium` plan whose `planValidUntil` has passed is
  LICZMAT again, and `expired` is what lets the page say why instead of looking demoted
  for no reason. **Session 28 put the checkout on that tab** — the one place on the site
  that may take money, because it is the only page that knows the uid — and it is
  `hidden` while `assets/pay.js` carries no Payment Link, which is the state the site
  ships in. So the tab quotes the price, says the subscription has not opened, and still
  has no live button; `scripts/test-pay.mjs` and `scripts/test-account-page.mjs` both
  check there is not one.
- **The visitor's level is derived, never asserted.** `lmLevelOf()` in
  `assets/account.js`: no Firebase user → `guest`; signed in → `liczmat`; signed in with
  `users/{uid}.plan == "premium"` (still valid) → `pro`. `plan` and `planValidUntil` are
  **server-only** — the deployed rules let a client write nothing in the profile but
  `lastSeenAt` and `appVersion` — so a browser can read the level and can never grant
  itself one. It is read live: `/app/` puts an `onSnapshot` on `users/{uid}`
  (`listenProfile()`), so a plan granted while the page is open moves the level, the hint
  in `liczmat-signed-in` and the Pro tab without a reload — reading it once at sign-in
  meant somebody who had just been granted Pro stayed free until they signed out and back
  in. **Do not add a field to `users/{uid}`** — a
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
- **The paywall is up (`LM_PRO_LOCKED = true`), the preview is gone, and the five Pro
  modules are therefore closed to every account there is — including the owner's.** Every
  PRO feature is walled off from a guest and from a free account, and nothing else is:
  `lmFeatureState()` only locks when the feature's level is PRO, so `sync` and `share` stay
  `gated` without a wall — what stands in their way is the sign-in form, which asks for an
  account rather than for money. Session 27 softened that with a **Pro preview**, one key in
  `localStorage` that opened all five modules; **session 28 deleted it** (the owner's
  decision, taken with the consequence stated). The reason is that a price now stands on the
  wall: a local switch that opens the modules for free is the wall contradicting itself, and
  a second answer to "may I use this" when `lmLevelOf()` exists to give exactly one. So
  the only way through the wall is a `plan` written by the server: since session 37 of the
  repair plan that is `scripts/pro-admin.mjs`, run by the owner, and later it will be the
  Stripe webhook. There is still **no way for a browser to open a Pro module by itself**,
  and that is a known, deliberate state rather than a defect to "fix" — do not reintroduce
  a local override. `scripts/test-plan.mjs` §6c plants four hopeful keys and checks that
  not one answer moves; `scripts/test-pay.mjs` §6 checks `assets/pay.js` never reads
  storage at all.
- **`assets/pay.js` is the subscription, and it ships priced but not buyable.** Two plans
  (monthly, yearly), seven currencies, fourteen amounts — all typed in by hand, and the same
  fourteen have to be set on the products in Stripe. **Two thresholds, not one**:
  `lmPayPriced()` (there is an amount → show the price) and `lmPayBuyable()` (an amount *and*
  a Payment Link → offer to charge). Today the first is true and the second is false, so the
  site says what Pro costs and says plainly that the subscription has not opened. Filling in
  the three URLs turns the buttons on with no other edit — and the ORDER note at the bottom
  of that file says what must happen first: products → Payment Links → the "Run Payments with
  Stripe" extension → a function writing `plan`/`planValidUntil`/`planRenews` → **pay once
  and check the account turns Pro by itself** → only then paste the URLs. A checkout switched
  on before that last step takes money for nothing.
- **The webhook is the only thing that can grant a plan after a payment, and it is our own
  function rather than the Stripe extension.** Session 38 of the repair plan put
  `functions/` in this repo: one HTTPS function in `europe-central2`, beside Firestore.
  The extension "Run Payments with Stripe" is built around Checkout Sessions created from
  Firestore by a signed-in browser; `assets/pay.js` is built around **Payment Links** with
  `client_reference_id`, because a static site has no server and that is the only way it
  can say whose account a payment belongs to. Bending the extension to that model is longer
  than the function and adds three collections the sync contract has never heard of.
- **A payment arrives in two halves, and neither event carries both.** The uid comes only
  in `checkout.session.completed` (`client_reference_id`, else the address on the session);
  the status and the dates come only in `customer.subscription.*`. So the first event
  writes `stripeCustomers/{customerId} = { uid }` and the second sets the plan by looking
  it up. **Stripe does not promise an order**, so a subscription event that arrives first
  is answered with **503** and Stripe retries it for days — a payment we cannot attribute
  *yet* has to wait, not vanish. One that can never be attributed (a `client_reference_id`
  naming no account, no address either) is answered 200 and logged at error level, because
  retrying will not make an account exist; the owner then grants it by hand with
  `scripts/pro-admin.mjs`.
- **Cancelling does not take Pro away today.** `cancel_at_period_end` moves `planRenews`
  to `false` and leaves `planValidUntil` where it was, so the modules stay open until the
  paid period ends and `lmPlanStatus()` closes them by itself. `past_due` keeps the plan
  too and promises no renewal: the paid period is still running and only the *next* charge
  failed, which Stripe retries for days. Only `customer.subscription.deleted` and the dead
  statuses write `free` — and they write it by **deleting** `planValidUntil` and
  `planRenews` rather than nulling them, the same choice `revoke` makes.
- **`client_reference_id` is checked, never trusted.** It comes off a URL, so the function
  looks the uid up in Firebase Auth before writing anything; a plan written under an
  invented uid would create a profile document for an account that does not exist.
- **One secret, and the function never calls Stripe.** `STRIPE_WEBHOOK_SECRET` lives in
  Secret Manager (`firebase functions:secrets:set`). There is no Stripe API key here and no
  Stripe SDK in `functions/package.json`: the function only reads what Stripe itself sent
  and signed. The signature is verified against the **raw** body — `JSON.parse` and back
  through `JSON.stringify` produces different bytes and a signature that never matches,
  which is the usual way this endpoint breaks — with a five-minute window, so a captured
  request cannot be replayed a month later.
- **The prices are converted once, by hand, never in the browser.** The euro rate was applied
  when the file was written (rates and sources are in its header, all 2026-08-19), because
  Stripe charges the amount set on the *product*: a price computed from a live rate would
  disagree with what leaves the card. A currency with no configured amount shows **no price**
  rather than a derived one. That is also why `assets/currency.js` grew from four currencies
  to seven — CZK, RON and RSD, so the subscription can be priced where it is sold. Croatia is
  on the euro; **RUB is deliberately absent, because Stripe does not operate in Russia**.
  Chapter VI of the master plan still names four currencies: that edit is the owner's.
- **Only `/app/` may take money.** The checkout URL carries `client_reference_id` (the uid)
  and `prefilled_email` and **nothing else** — no amount, no plan, no currency, all of which
  live on the product in Stripe, so a tampered browser can mis-draw its own page and cannot
  buy Pro for a złoty. A wall on `/klienci/` has no uid (those pages load no Firebase), and a
  payment with no uid grants nobody anything, so the wall quotes the price and links to
  `/app/`. `lmPayUrlOk()` accepts `https:` on `buy.stripe.com` or `billing.stripe.com` and
  matches the **whole host** — `xbuy.stripe.com` ends with the right letters and belongs to
  somebody else.
- **`planRenews` is a third plan field, server-only, and absent means renewing.** "Renews on
  the 12th" and "ends on the 12th" are the same `plan` + `planValidUntil` pair, so
  cancellation needs one field more. It sits **beside the sync contract** (no `planRenews` in
  FIRESTORE_SYNC §2 yet) in the same position as `note` on a shopping item and `projectId` on
  a room, and survives for the same reason: every write in `CloudSync.kt` is a merge. No
  rules change was needed — the deployed rules already let a client write nothing but
  `lastSeenAt` and `appVersion`. Every document that exists today lacks the key, and
  `lmPlanRenews()` reads that as **renewing**: telling somebody their subscription is ending
  when the document never said so is the one error here that costs a customer. Adding it
  properly is a contract change in `3d-polednia/Materio`, which is a session of its own.
  `lmSubscription()` turns the three fields into one word — `none`/`free`/`active`/
  `cancelled`/`expired` — so `/app/` and the wall pick a sentence by name instead of each
  re-deriving it from four booleans.
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
- **The strip above an open module says one thing: which plan opened it.** Since session 28
  removed the preview there is no second case — the chip is "Twój plan: LiczMat Pro" (class
  `on`) or the module is behind the wall. When the wall is up the strip is hidden entirely:
  the wall says all of it, and twice is worse than once. A Pro account is never quoted a
  price either — offering to sell somebody what they already pay for reads as a threat.

- **A calculator page's title, its H1 and its first paragraph are one piece of copy, written
  per calculator and per language.** Session 31 replaced `calc_meta_pattern` — one shape
  filled in 150 times — with `src/calc-seo.mjs`: a title that is the sentence somebody
  searched for ("Kalkulator płytek i paneli — ile kartonów"), the same string as the H1
  because a page has one subject, and a description that is both the SERP snippet and the
  paragraph under the H1, because a snippet promising what the page does not open with is
  the same defect from two directions. The stem is capped at `TITLE_MAX` (50) so
  `" | LiczMat"` still fits inside Google's ~60, and the build **aborts** on a missing
  language, an over-long title, a description outside 50–160, an FAQ that is not two
  question/answer pairs, a question with no question mark, or two calculators claiming one
  title inside a language. That cap is why `scripts/test-seo.mjs` no longer exempts these
  pages from the 60-character rule.
- **It is a build module, not a fourth dictionary, and that is the point.** Every page on
  the site downloads `assets/i18n.<lang>.js`; 90 keys per language of copy that only a
  crawler and a reader of the finished HTML ever see would be some 13 kB on every page load
  for nothing. `src/` is also stripped from the Pages artifact. `scripts/test-calc-seo.mjs`
  §7 fails if any of it turns up in a shipped dictionary.
- **The FAQ under a calculator is two questions, and the structured data reads the very
  list the page renders.** Same rule the home page's FAQ has followed since session 6: an
  answer in the JSON-LD that is not in the markup is a page telling Google something it
  does not tell a reader. It sits **below** the tool and below "Jak to liczymy" — chapter
  XII's "długie treści SEO, instrukcje i FAQ nie mogą zasłaniać kalkulatora" is a rule
  about position, so the test checks it by position. It reuses the home page's `.faq`
  component inside a `wrap narrow`, so it added no CSS.
- **Every number in that copy is one the site already states.** The 5–7% and 10–15%
  allowances, the 25 kg bag yielding ~12.5 l, 6 dowels per m², the 10% mesh overlap, the
  2.0 kg/l density, the 60/40 cm stud spacing: each is already in a `note_<id>` key or is
  a field of the calculator. No brand, no price, no invented figure — the same rule that
  ties the calculator count to `CALCS`.
- **The breadcrumb keeps the short name.** The trail still says "Płytki, panele, gres"
  rather than the new title: a trail is a map of the site, and a sentence like "Kalkulator
  płytek i paneli — ile kartonów" is a title in it, not a place. `c_<id>_t` therefore
  stays what the hub cards, the related chips and the trail use.

- **`/liczmat-pro/` is the one Pro address with no wall in front of it, and it cannot have
  one.** Session 29 built the public page: GUEST, indexable, the same slug in all ten
  languages (a brand name, so translating it would give one product ten names), in the
  footer for everybody. The paywall stands in front of a *module*; a description of what
  somebody would be paying for, put behind the payment, is a circle. It writes nothing
  twice: the five modules are `LM_FEATURES` through `proModules()`, the price is
  `proPlansBlock()` — the same block the wall carries — and the addresses come from
  `src/site.mjs`. What is authored there is only what nothing else says: what stays free,
  what Pro deliberately does not do, and chapter XXV's three steps from a free account to
  a plan.
- **The price on that page is in the HTML, and it is still not a conversion.** A wall can
  leave the amount to a script, because a locked module needs JavaScript anyway; a page
  whose whole job is to be *read* cannot — Googlebot and a visitor with no script would
  see an empty slot where the price belongs. So `buildProPage()` prints the hand-typed
  amount for the language's **default** currency out of `assets/pay.js` (`planPrices()`),
  and `assets/paywall.js` overwrites it with the visitor's own the moment it knows one.
  Nothing is converted at a rate, and a currency with no configured amount still shows no
  price. The one thing the build and the browser cannot be held to is the *symbol*: their
  ICU data differs, and for `uk-UA` Node writes "₴" where Chromium writes "грн" — the
  amount is identical, so the tests compare digits.
- **A Pro account visiting `/liczmat-pro/` is shown their plan, not a price.** `pwPage()` in
  `assets/paywall.js` reads the level from `liczmat-signed-in` and hides the whole price
  block for `pro`, leaving "Twój plan: LiczMat Pro" — the same argument that keeps a price
  off the strip above an open module. Nothing there is gated: the page is public, the hint
  can be stale, and the worst a stale one does is quote a price to somebody who has paid.
- **Three links turned themselves on when the route went LIVE.** The home page's third door
  (`HOME_DOORS`), "Poznaj LiczMat Pro" on every wall and in the Pro tab (`proMoreLink()`),
  and the Pro level card on `/app/` all read the route's status, so session 29 edited none
  of them. What it did have to add is `liczmat-pro` in the `LM_NAV` map in
  `scripts/build.mjs`: `/app/` has no language of its own and repoints a `data-nav-route`
  link from there.

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
  `scripts/test-pages.mjs` checks the row stays on one line in ten languages at
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

- **The one security boundary is the deployed Firestore rules, and it is not in this repo.**
  They key on `request.auth.uid` and they live in `3d-polednia/Materio`
  (`config/firebase/firestore.rules`, FIRESTORE_SYNC §7). What this repo owns is never
  *addressing* another account's data, never leaving one account's copy where the next
  person can use it, and never letting a credential out of the site. Session 35 audited
  those three; `scripts/test-security.mjs` keeps them. Nothing in the browser is a lock:
  the paywall, `liczmat-signed-in` and `lmCan()` decide what a page **shows**.
- **`lmSafeNext()` refuses control characters, and that is load-bearing.** Every browser's
  URL parser **deletes** tab, CR and LF before reading an address, so `/<tab>/evil.example`
  passed the "no leading `//`" rule and then navigated to `https://evil.example/` — an open
  redirect on the one page where a phishing link is worth having. The whole C0 range and
  DEL are out. The test resolves each answer with `new URL(value, BASE)` instead of
  comparing strings: the string is only evidence, and for three inputs it lied.
- **`/p/<token>` ships without analytics and without a referrer.** GA4 reports
  `page_location`, which is the whole address — and on that page the address *is* the
  credential (FIRESTORE_SYNC §6), so every share link was being handed to a third party.
  `secret: true` in the `page()` call (src/template.mjs) drops the tag and the
  `dns-prefetch` and adds `<meta name="referrer" content="no-referrer">`. It is one page's
  exception: `scripts/test-security.mjs` §5 fails if any other page loses the tag, and
  `scripts/test-perf.mjs` §5 fails if a page carries *half* of one.
- **A token's shape is checked before it becomes a Firestore path.** `doc(db,
  "sharedProjects", token)` joins the segments it is handed, so `?t=a/b/c` addressed
  `sharedProjects/a/b/c` — another document in a subcollection nothing on the page is
  meant to read. `SHARE_TOKEN` in `assets/share.js` is `[A-Za-z0-9_-]{16,64}` and governs
  both entry points, the query parameter and the path `404.html` forwards.
- **The browser workspace now records which account it was last synced with, and the sync
  refuses to mix two.** "Pull" copies an account's projects, rooms, saved calculations and
  material list into `localStorage`, and nothing recorded whose they were: on a shared
  computer the next person read them on `/projekty/`, and the next person to sign in and
  press "push" uploaded them into *their* account, out of the owner's reach. One key,
  `liczmat-sync-account`, holds the uid; both directions are refused while it names
  somebody else **and** there are rows here. An empty workspace is nobody's, so a stale
  stamp on one is not a warning. The check is inside both click handlers as well as on the
  `disabled` attribute — `disabled` is a hint to a mouse.
- **There is finally a way to empty a shared device.** The delete-account card has always
  said "Dane w tej przeglądarce zostają — wyczyść je osobno" with nothing to click.
  `app-wipe` on the settings tab clears the four data stores — `materio-workspace-v1`,
  `materio-active-project`, `liczmat-recent-calcs` and `liczmat-crm-v1`, the last being
  the only store on this site holding somebody else's name, telephone number and address —
  plus the sync stamp. The **settings stay**: language, currency, theme, the consent answer
  and "keep me signed in" say nothing about anybody, and clearing them would show the page
  in a foreign language to somebody who asked for their data to be cleared. It signs
  nobody out; that is a separate button. `DEVICE_DATA_KEYS` is checked against
  `COOKIE_ROWS` on /cookies/, so a store nobody can clear fails the build's tests.
- **An id out of storage is not a path segment until `pathId()` says so.** It refuses the
  empty string, a `/`, `.`, `..`, `__x__` and anything over 1500 characters. Firestore
  throws on those, and the throw landed in the same `catch` as a network failure — so a
  push reported "coś poszło nie tak" instead of skipping one row and carrying on.
- **The CSV is a file handed to somebody else.** A spreadsheet reads a cell starting `=`,
  `+`, `-` or `@` as a formula, quoted or not, and material names are typed by people;
  `wsCsvCell()` prefixes those with an apostrophe. `wsFileName()` builds the download name
  out of the project name without a separator, a control character or a `..` in it.
- **Every control carries its own name, and a placeholder is not one.** A placeholder is
  gone the moment somebody types, and a screen reader announces a nameless field as "edit,
  blank" — nine fields on this site had nothing else (the new project, the new room, the
  new client and their phone and e-mail, the new job, the new quote, the estimate line,
  the project name in `/app/`), plus the surface picker in the room bar. They take an
  `aria-label` from the key the placeholder already used, so nothing new was written in ten
  languages. A `<label for>` or a `<label>` wrapping the control is the same answer and is
  what every row drawn at runtime uses. `scripts/test-a11y.mjs` §3 fails on a control with
  no name and on a name that is only a placeholder.
- **Heading level is structure, not size.** The footer's column headings were `<h4>` under
  a page full of `<h2>`s, so every one of the 375 pages had a hole in its outline where the
  site map begins; they are `<h2>` now and the stylesheet makes them look the way they
  looked. One `<h1>` per document (`privacy-policy.html` is two documents in one file, one
  per `<article lang>`), no level skipped on the way down, and no empty heading a visitor
  can reach — a heading a script fills either ships with the fallback text the script would
  use, or lives inside the `hidden` block it belongs to.
- **The skip link's target has to be focusable.** Every `<main id="main">` carries
  `tabindex="-1"`. Without it the browser scrolls to the landmark and leaves the focus
  where it was, so the next Tab walks back into the header the visitor asked to skip —
  which is what the link did on this site for its whole life.
- **What changes on its own says so.** The result box on a calculator page is
  `role="status"`: pressing "Policz" replaces its contents, moves nothing and changes no
  focus, so without it a screen reader is told nothing about the one thing the visitor
  asked for. The price of that is `writeResult()` in `assets/calculators.js` — the silent
  run on load compares the *words* and writes nothing when they have not changed, or the
  answer is read out to somebody who never asked for one. The undo strips, the store
  status and `/app/`'s status line are the same mechanism.
- **Anything that starts moving by itself can be stopped.** WCAG 2.2.2. The phone mockup
  advances every 3.5 s, so it carries a stop button — hidden in the markup, unhidden by
  `assets/main.js` when it starts the timer, so nothing offers to stop what never moved
  (no script, or `prefers-reduced-motion`). Both labels ship in the page's own language;
  the visitor's pause outranks the tab coming back into view.
- **An id is claimed once.** `/aplikacja/` carried two carousels sharing `hero-shots` and
  `hero-dots`, so `getElementById` found the first and the second never moved. Elements
  that can appear twice on a page are wired by a `data-` attribute and
  `querySelectorAll`, never by id.
- **A field is a field because it is an `<input>`, a `<select>` or a `<textarea>`** — the
  rule in `assets/styles.css` is written on the element, not on a list of classes, so a
  control a new module invents is 16 px of text in a 44 px box without anybody
  remembering to add it. That list is what session 32 found every Pro control broken
  behind: 13 px of text in a 19-to-21 px box, on the screens a tradesperson uses on site.
  Only `width: 100%` is still a per-place decision and still a list of classes. A
  `checkbox` and a `radio` keep their native box.
- **Below 560 px every tap target is 44 px, and above it the design system's small sizes
  stand.** 36 px (the header's two icon buttons) and 40 px (`.btn-sm`) exist so a desktop
  header row and a dense table row stay tight; a phone row is a whole screen wide and has
  no such problem. Chips and `<summary>` grow there too. `scripts/test-mobile.mjs` fails
  the moment something on a phone is under 44 px.
- **The header collapses into the drawer below 1060 px, and that number lives in two
  files.** `assets/styles.css` and the `matchMedia("(min-width: 1061px)")` in
  `assets/main.js` — a mismatch either leaves the drawer drawn as a plain row or shuts a
  menu the visitor can still see. It was 900 px until session 32 measured the same row in
  Russian, where five links, two pickers and the account button need 1033 px.
- **A button label wraps rather than pushing the page sideways.** `.btn` is
  `white-space: normal; overflow-wrap: anywhere`. With `nowrap` a grid or flex item could
  not shrink below its longest sentence, and one Romanian label took the page 103 px off
  the side of a 320 px phone.
- **The narrative stays in the source and stops at the door.** `assets/styles.css` is
  authored with the argument for every token next to the rule it explains — 31 of its 90 kB,
  and 13 of the 24 kB that actually crossed the wire on the one render-blocking request every
  page makes. `buildStylesheet()` emits `assets/styles.min.css` from it: comments and
  indentation gone, **nothing else touched** — no selector reordered, no value shortened, no
  rule merged, so the shipped file still diffs against the source. `src/tokens.mjs` still
  validates the authored file and a person still edits it. The same decision applies to the
  markup: `src/template.mjs`, `src/pages.mjs` and `src/app-pages.mjs` explain themselves in
  HTML comments, and `write()` strips those from every generated page (2.4 kB on the home
  page, 6 kB on `/klienci/`). A comment inside `<script>`, `<style>`, `<pre>` or `<textarea>`
  is stepped over whole — it is code, or it is text somebody is meant to see.
  `scripts/test-perf.mjs` §2 and §7 fail if either half stops holding.
- **Analytics is fetched after `load`, and consent is still set before it.** The inline block
  in `src/template.mjs` defines `gtag()`, pushes the Consent Mode v2 defaults, re-applies a
  saved "accept" and calls `config` — all before the library exists, because `dataLayer` is
  an array and gtag.js replays it in order when it arrives. `gtag/js` was the only
  third-party request on the render path and by some distance the largest download on a
  page. There is no `preconnect` any more either: it opened a TLS connection for a request
  that no longer happens during the render.
- **Bump `STAMP` in `scripts/build.mjs`** whenever a shipped asset changes, then rebuild.
  It is the single `?v=` value for every page. GitHub Pages serves assets with
  `max-age=600`, so without it a visitor can run new markup against a stale stylesheet.
  `privacy-policy.html` and `404.html` are hand-written — bump their `?v=` by hand too.
- **Ten languages, always.** `pl, uk, de, en, cs, sk, ro, hr, sr, ru`. Every key must
  exist in all ten, in **each** of `assets/i18n.js`, `assets/i18n-pages.js` and
  `assets/i18n-materials.js`. Check with `node scripts/build.mjs --check`, which fails and
  names the missing keys. The six dropped on 2026-08-12 were **brought back after session
  28** at the owner's request; `RETIRED_LANGS` in `src/site.mjs` is now empty and the
  `404.html` redirect that used to bounce them to the home page is gone. Master plan
  chapter V still names four — that edit is the owner's. Do not add or drop a language
  without the plan.
- **Currency is not language.** `PLN, EUR, USD, UAH, CZK, RON, RSD` in
  `assets/currency.js`, chosen by the visitor and stored under `liczmat-currency`. Ten
  languages share seven currencies, and a language's default is only a default —
  Deutsch + PLN is a valid setting (chapter VI). Nothing is ever converted at an
  exchange rate, and no physical quantity changes when the currency does. An estimate
  line keeps the `currencyCode` it was saved with.
- **Polish HTML matching `I18N.pl` is now automatic** — the pages are generated *from* the
  dictionary, so they cannot drift. Edit the dictionary, rebuild, commit the output. Never
  hand-edit a generated `.html`: the next build silently reverts it.
- **A slug is permanent.** Renaming one in `src/site.mjs` breaks every inbound link and the
  ranking that came with it. Add a redirect instead. This is why the six restored languages
  did **not** get freshly-invented slugs: theirs were recovered from git (`ab1fb26`), so
  all 177 URLs that were live before 2026-08-12 resolve again unchanged.
- **A new page must be declared in `src/ia.mjs` before it can be built.** The build
  compares the pages it wrote against the routes declared there and aborts on either
  kind of mismatch, so adding a `build…()` function is only half the change. Give the
  route its access level (`GUEST` / `LICZMAT` / `PRO`), its parent and — if it belongs in
  the menu — its position; the header and the footer are generated from that list, so a
  navigation link cannot point anywhere else. Turning a `PLANNED` route into a live one
  also means moving its `plannedSlug` into `SECTION` in `src/site.mjs`.
- **`sitemap.xml` is read off `src/ia.mjs`, not written a second time.** `sitemapUrls()`
  expands every `indexable` route across the ten languages; the build then compares the
  file it wrote against the markup that shipped and aborts if a `noindex` page is
  advertised or a crawlable one is missing. Until session 30 the sitemap was fifteen
  hand-kept `add()` calls in `scripts/build.mjs` — a second copy of the site map that a
  new session had to remember to extend.
- **`lastmod` is carried forward, and a page keeps its date until its content changes.**
  Stamping today onto all 371 URLs on every build is what makes Google ignore the field
  for the whole domain; the comparison behind the date ignores `?v=`, so bumping `STAMP`
  does not re-date the site. `privacy-policy.html` goes out with no `lastmod` — the build
  does not generate it and cannot know. `<changefreq>` and `<priority>` are gone: nothing
  reads them, and every new page had to invent a number nobody could check.
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
