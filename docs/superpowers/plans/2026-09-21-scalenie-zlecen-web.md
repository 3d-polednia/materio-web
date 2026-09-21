# Plan: Scalenie Zleceń z Projektami (Web)

## Goal
Jobs (Zlecenia) stop being their own independent entity and are merged into Projects (Projekty). The Jobs module, screens, and routes disappear. Everything that read a job now reads an extended project. The web app must adapt to the new data model without breaking the phone's migration path, reading both the old shape and new shape during transition, and tombstoning old job records.

## Architecture
* **Local Storage Split**: Projects reside in `materio-workspace-v1` (`assets/workspace.js`), while Clients and Quotes reside in `liczmat-crm-v1` (`assets/crm-store.js`). Jobs are entirely removed from `liczmat-crm-v1`.
* **Local Migration**: Upon loading, `crm-store.js` checks for existing `jobs`. If found, they are migrated into `materio-workspace-v1` as enriched projects, and `jobs: []` is set in the CRM store.
* **Sync Layer**: The sync layer (`assets/app.js`) stops pushing to the `jobs` collection. It continues pulling `jobs` for one release, feeds them through the conversion logic, and writes back tombstones (`deletedAt: serverTimestamp()`) to bury them, matching the Android strategy.
* **Routing**: The `/zlecenia/` and `/zlecenie/` routes are retained temporarily but set to `indexable: false` and generate HTML redirects (`<meta http-equiv="refresh">`) to `/projekty/` across all 13 languages.
* **UI**: The CRM Hub (`app-pages.mjs`) jobs tile becomes a projects tile. The CRM chain (`crm-chain.js`) drops the Job step and connects Client directly to Project.

## Tech Stack
* Vanilla JavaScript (ES6 Modules in `/src`, ES5-ish in `/assets`)
* Node.js Custom Static Site Generator (scripts/build.mjs)
* LocalStorage for persistence
* Firebase Firestore for sync

## Global Constraints
1. **Link by Remote ID**: The link between collections (e.g., Project to Client) travels as `remoteId` (not local id).
2. **Money Format**: Money is stored as integer minor units (no floats, no conversions).
3. **Date Format**: `dueDate` is a calendar day `YYYY-MM-DD`, not millis.
4. **Translations**: Wording is in `assets/i18n-pages.js` (13 languages). Rewrite wording, don't delete keys another page uses.
5. **No Job Resurrections**: Website must NOT resurrect job documents and must not fight the Android conversion.
6. **Backward Compatibility**: The browser must READ a project document in either shape, because a phone on an older build writes one with none of the six fields, and it must fall back to the defaults above rather than refusing the document.

## File Structure

| State    | Path                           | Description                                                                 |
| -------- | ------------------------------ | --------------------------------------------------------------------------- |
| Modified | `assets/crm-store.js`          | Remove `jobs` array; add one-shot local migration logic to `workspace`.     |
| Modified | `assets/crm.js`                | Remove all `crmAddJob`, `crmUpdateJob`, etc., functions.                    |
| Modified | `assets/app.js`                | Update Firestore sync: stop pushing jobs; pull, convert, and tombstone jobs.|
| Modified | `assets/workspace.js`          | Extend Project schema with `clientId`, `status`, `dueDate`, `valueMinor`, `currencyCode`, and `note`. |
| Modified | `src/ia.mjs`                   | Deprecate job routes; mark `indexable: false`.                              |
| Modified | `src/app-pages.mjs`            | Build redirects for old routes; replace Jobs tile with Projects tile.       |
| Modified | `assets/crm-ui.js`             | Remove jobs UI elements; wire Clients to Projects.                          |
| Modified | `assets/crm-chain.js`          | Remove Job step; update chain to Client -> Project -> Quote.                |
| Modified | `assets/workspace-ui.js` GUESS | Update Project form to include new fields (Client, Status, Date, Value, Currency, Note).   |
| Modified | `assets/i18n-pages.js`         | Update translation keys; rename `crm_job_*` to `crm_proj_*`; delete unused. |

## Tasks

> **Wszystkie sześć zadań wykonane 2026-09-21.** Trzy odstępstwa od planu, każde
> opisane na miejscu w kodzie:
>
> 1. Plan wskazuje `src/app-pages.mjs` jako miejsce ciał stron. Ciała stron są
>    w `src/pages.mjs`; `app-pages.mjs` to pulpit `/app/`.
> 2. Trasy `quotes` i `calendar` były dziećmi `jobs`. Przepięte pod `projects` —
>    inaczej dwa żywe moduły wisiałyby pod stroną, która przekierowuje gdzie indziej.
> 3. `/zlecenia/` kanonikalizuje się **do siebie**, nie do `/projekty/`. Head mówiący
>    naraz „nie indeksuj mnie" i „ta prawdziwa jest tam" to dwie sprzeczne instrukcje.
>
> Poza planem, bo scalenie by to usunęło po cichu: pasek ścieżki, wyceny projektu
> i historia przeniosły się z `/zlecenia/` na `/projekty/`; kolor wydarzenia wrócił
> jako pole projektu; sześć pól jest edytowalnych na otwartym projekcie, nie tylko
> przy zakładaniu; wróciły dwie figury — uzgodniona kwota i ile z niej zostaje.

### 1. Data Model & Local Migration
**Blocked by:** None (Can run in parallel with Task 3 & 6)
**Files:** `assets/workspace.js`, `assets/crm-store.js`, `assets/crm.js`
**Interfaces:** LocalStorage `materio-workspace-v1`, `liczmat-crm-v1`

- [x] Modify `assets/workspace.js` to initialize new projects with `clientId: ''`, `status: 'new'`, `dueDate: ''`, `valueMinor: null`, `currencyCode: ''`, and `note: ''`.
- [x] Modify `assets/crm-store.js` `crmLoad()` to detect legacy `jobs`.
- [x] Write migration logic in `crmLoad()`: iterate `jobs`, map each to a project payload (respecting `remoteId`, `YYYY-MM-DD` for due date, and minor units for amount), inject into `workspace.js` data, and overwrite `jobs` with `[]` in `liczmat-crm-v1`.
- [x] Delete all job-related CRUD functions from `assets/crm.js`.

### 2. Cloud Sync Adaptation
**Blocked by:** Task 1
**Files:** `assets/app.js`
**Interfaces:** Firestore

- [x] Locate the push logic in `assets/app.js` and remove the path that uploads to the `jobs` collection.
- [x] Ensure the push logic for projects writes empty strings, never null or undefined, for `clientId`, `dueDate`, and `currencyCode`.
- [x] Locate the pull logic. Ensure it still queries the `jobs` collection.
- [x] Add conversion logic in the pull handler: incoming `jobs` documents must be mapped to local `projects` in `workspace.js`.
- [x] After processing a pulled job, write a tombstone back to Firestore for that job (`deletedAt: serverTimestamp()`) so it won't be pulled again. Ensure we do not overwrite or fight tombstones created by Android.

### 3. Routing & SEO Redirects
**Blocked by:** None (Can run in parallel with 1, 4, 5, 6)
**Files:** `src/ia.mjs`, `src/app-pages.mjs`, `src/pages.mjs`
**Interfaces:** SSG Router

- [x] In `src/ia.mjs`, find routes related to `jobs` or `zlecenie`. Set `indexable: false`.
- [x] In `src/app-pages.mjs` (or wherever the template for the job route is defined), replace the page content with a `<meta http-equiv="refresh" content="0; url=/projekty/">` tag.
- [x] Ensure the redirect handles language prefixes correctly based on the SSG context.

### 4. UI Refactoring: CRM & Chain
**Blocked by:** Task 1
**Files:** `assets/crm-ui.js`, `assets/crm-chain.js`, `src/app-pages.mjs`
**Interfaces:** DOM

- [x] In `src/app-pages.mjs`, locate the CRM Hub tile for Jobs and replace its target/icon/label to point to Projects.
- [x] In `assets/crm-chain.js`, remove the Job segment. The sequence `CHN_SECTION` should go `client -> project -> quote`. Add appropriate "next step" text (e.g., "Dodaj projekt").
- [x] In `assets/crm-ui.js`, strip out all rendering logic for Job lists, Job details, and Job forms.
- [x] Wire the Client detail view in `crm-ui.js` to list the Client's Projects (querying `workspace.js` by `clientId`).

### 5. UI Refactoring: Projects
**Blocked by:** Task 1
**Files:** `assets/workspace-ui.js` (GUESS), `src/app-pages.mjs`
**Interfaces:** DOM

- [x] Locate the project creation/edit form (GUESS: `assets/workspace-ui.js` or within `app-pages.mjs`).
- [x] Add a dropdown/selector for Client (populated from `crm-store.js` via `remoteId`).
- [x] Add inputs for `status` (new, active, done, cancelled), `dueDate` (date picker returning `YYYY-MM-DD`), `valueMinor` (handling minor units formatting), `currencyCode`, and `note` (max 2000 chars).
- [x] Update the project list view to display the client name, status, and deadline.

### 6. Translations Update
**Blocked by:** None (Can run in parallel with everything)
**Files:** `assets/i18n-pages.js`
**Interfaces:** SSG i18n

- [x] Audit `assets/i18n-pages.js` for keys containing `job` or `zlecenie`.
- [x] Rename keys conceptually moving to projects (e.g., `crm_job_status` -> `crm_proj_status`) across all 13 languages.
- [x] Delete strictly orphaned keys (e.g., `crm_jobs_empty`) only after confirming they are not used elsewhere in `app-pages.mjs` or `crm-ui.js`.
