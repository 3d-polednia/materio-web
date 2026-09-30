import { esc, logoMark } from "./template.mjs";
import {
  DEFAULT_LANG, URL_APP, urlProjects, urlEstimate, urlCompany, urlClients, urlQuotes,
  urlCalendar, urlOwnMaterials,
} from "./site.mjs";

/** Icons shared by the account shell on /app/ and the six localized work pages. */
export const NAV_ICON = {
  company: '<path d="M4 21V7l8-4 8 4v14"/><path d="M8 10h2M14 10h2M8 14h2M14 14h2M9 21v-3h6v3"/>',
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  projects: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  estimate: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  clients: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/><path d="M16.2 4.6a3.4 3.4 0 0 1 0 6.6M20 20c0-3-1.9-5.3-4.6-6"/>',
  quotes: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  schedule: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  materials: '<path d="M12 2 3 6.8V17L12 22l9-5V6.8z"/><path d="M3 6.8 12 12l9-5.2M12 12v10"/>',
  rooms: '<path d="M4 10 12 3l8 7"/><path d="M6 9v11h12V9"/><path d="M10 20v-6h4v6"/>',
  profile: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6"/>',
  sync: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
  pro: '<path d="m12 2 2.7 5.9 6.3.7-4.7 4.4 1.3 6.3L12 16.2 6.4 19.3l1.3-6.3-4.7-4.4 6.3-.7Z"/>',
  account: '<path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 19.5a7.7 7.7 0 0 1 15 0"/>',
};

const item = (t, entry, current) => {
  const selected = entry.id === current;
  return `<a class="app-nav-item" href="${entry.href}"${entry.route ? ` data-nav-route="${entry.route}"` : ""}${selected ? ' aria-current="page"' : ""}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICON[entry.id] || ""}</svg>
        <span${entry.inPlace ? ` data-i18n="${entry.key}"` : ""}>${esc(t(entry.key))}</span>
      </a>`;
};

/** Build the one account sidebar. Localized pages pass their language; /app/ uses Polish
 * seed URLs plus data-nav-route so i18n-runtime can repoint them after langchange. */
export function accountSidebar(t, { lang = DEFAULT_LANG, current = "overview", inPlace = false, foot = "" } = {}) {
  const routeLink = (id, key, route, href) => ({ id, key, route: inPlace ? route : "", href, inPlace });
  const appLink = (id, key, hash) => ({ id, key, href: `${URL_APP}${hash}`, inPlace });
  const groups = [
    ["app_nav_work", [
      appLink("overview", "app_tab_overview", "#przeglad"),
      routeLink("projects", "app_tab_projects", "projects", urlProjects(lang)),
      routeLink("estimate", "estpage_title", "estimate", urlEstimate(lang)),
      routeLink("clients", "app_tab_clients", "clients", urlClients(lang)),
      routeLink("quotes", "app_tab_quotes", "quotes", urlQuotes(lang)),
      routeLink("schedule", "app_tab_schedule", "calendar", urlCalendar(lang)),
    ]],
    ["app_nav_resources", [
      routeLink("materials", "app_tab_materials", "own-materials", urlOwnMaterials(lang)),
      { id: "rooms", key: "app_tab_rooms", href: `${urlProjects(lang)}#ws-rooms`, route: inPlace ? "projects" : "", inPlace },
    ]],
    ["app_nav_account", [
      routeLink("company", "app_tab_company", "company", urlCompany(lang)),
      appLink("profile", "app_tab_profile", "#profil"),
      appLink("sync", "app_tab_sync", "#synchronizacja"),
      appLink("pro", "app_tab_pro", "#pro"),
      appLink("account", "app_tab_account", "#konto"),
    ]],
  ];
  return `<aside class="app-side" data-account-sidebar data-nav-level="liczmat">
    <div class="app-side-brand">${logoMark(26)}<span>LiczMat</span><span id="app-level" class="chip app-plan-pill"></span></div>
    <nav class="app-nav" aria-label="${esc(t("app_tabs_label"))}"${inPlace ? ' data-i18n-aria="app_tabs_label"' : ""}>
      ${groups.map(([label, entries]) => `<div class="app-nav-group"><div class="app-nav-label"${inPlace ? ` data-i18n="${label}"` : ""}>${esc(t(label))}</div>${entries.map((entry) => item(t, entry, current)).join("")}</div>`).join("")}
    </nav>${foot}
  </aside>`;
}

/**
 * Put a localized work page inside the same account rail as /app/. The rail shows only
 * when the account hint (assets/account.js, stamped on <html> as data-lm-level before
 * anything is drawn) says somebody is signed in; a guest keeps the page full width.
 */
export function accountPageMain(main, t, lang, current) {
  const open = main.indexOf(">");
  const close = main.lastIndexOf("</main>");
  if (!main.startsWith("<main") || open < 0 || close < 0) throw new Error("Account page needs one outer <main>");
  // The page head (breadcrumbs, the one <h1>, the lead) stays outside the gated part, so a
  // guest and a signed-in visitor read the same title and the document keeps one <h1>. It
  // sits above the rail, the way "Moje konto" sits above it on /app/.
  const body = main.slice(open + 1, close);
  const headAt = body.search(/<section class="block page-head[^"]*">/);
  const headEnd = headAt < 0 ? -1 : body.indexOf("</section>", headAt);
  if (headAt < 0 || headEnd < 0) throw new Error(`Account page "${current}" needs a page head`);
  const head = body.slice(0, headEnd + "</section>".length);
  const tool = body.slice(headEnd + "</section>".length);
  const next = {
    projects: urlProjects, estimate: urlEstimate, company: urlCompany, clients: urlClients, quotes: urlQuotes,
    schedule: urlCalendar, materials: urlOwnMaterials,
  }[current](lang);
  const signup = `${URL_APP}?mode=signup&amp;next=${encodeURIComponent(next)}`;
  const signin = `${URL_APP}?next=${encodeURIComponent(next)}`;
  const guest = `<section class="block account-guest-card" data-account-guest>
    <div class="wrap narrow"><div class="card">
      <p>${esc(t("account_gate_d"))}</p>
      <p class="muted" data-account-local hidden>${esc(t("account_gate_local"))}</p>
      <p class="ws-links"><a class="btn btn-primary btn-sm" href="${signup}" rel="nofollow">${esc(t("app_signup_t"))}</a>
        <a href="${signin}" rel="nofollow">${esc(t("app_signin"))}</a></p>
    </div></div>
  </section>`;
  return `${main.slice(0, open + 1)}${head}${guest}<div class="app-shell account-page-shell" data-account-tool>
    ${accountSidebar(t, { lang, current })}
    <div class="app-main account-page-main">${tool}</div>
  </div></main>`;
}
