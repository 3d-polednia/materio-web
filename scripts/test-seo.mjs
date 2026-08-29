#!/usr/bin/env node
/**
 * LiczMat — the technical SEO of the whole site, tested.
 *
 *     node scripts/test-seo.mjs
 *
 * Master plan, session 30 (SEO TECHNICZNE): "Cały serwis: metadata, sitemap, robots,
 * canonical, Open Graph, structured data, indeksowanie, hreflang, wersje językowe."
 *
 * Every one of those is a claim the site makes about itself to a machine that will never
 * ask a follow-up question, and every one of them is invisible on the page — a canonical
 * pointing at the wrong URL, a language group where one member forgets to name the
 * others, a sitemap that advertises a page carrying `noindex`: nothing about any of them
 * shows up in a browser, and all of them cost traffic. So they are checked here, against
 * the 375 files that actually shipped, rather than against the code that wrote them.
 *
 * One deliberate exception, named where it is made: /privacy-policy.html carries no
 * hreflang and no lastmod. It is hand-written, it is Polish and English in one document
 * rather than two URLs, and the build does not generate it, so it cannot know when it
 * last changed.
 *
 * The second exception is gone. Session 30 let a calculator page's <title> run past 60
 * characters, because what those titles should say was session 31's subject and pinning
 * today's pattern down here would have been this session telling the next one it was
 * right. Session 31 wrote them, so the limit now applies to all 385 pages; what each one
 * says is checked in scripts/test-calc-seo.mjs.
 *
 * Dependency-free, plain `node`, exit 1 on failure — the same shape as the other logic
 * suites. Run it after touching src/template.mjs's <head>, buildSitemap() or
 * sitemapUrls(), robots.txt, a `*_meta` key or the `indexable` flag on a route.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASE, LANGS, DEFAULT_LANG, HREFLANG, OG_LOCALE, GUIDES,
  urlHome, urlCalc, URL_PRIVACY,
} from "../src/site.mjs";
import { sitemapUrls, liveRoutes, route } from "../src/ia.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);
const read = (file) => readFileSync(p(file), "utf8");
const evalScript = (file, returns) =>
  new Function(`${read(file)}\nreturn {${returns.join(",")}};`)();

const { CALCS } = evalScript("assets/calculators.js", ["CALCS"]);

/* ------------------------------------------------------------------ the runner */

let passed = 0;
const failures = [];
let section = "";
const head = (name) => { section = name; };

function check(name, cond, detail) {
  if (cond) { passed++; return true; }
  failures.push(`${section} — ${name}${detail ? `\n      ${detail}` : ""}`);
  return false;
}

/* ------------------------------------------------------------------ the pages */

/** Every .html file in the published tree, parsed down to the tags this suite reads. */
function collect(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    // The four directories the Pages workflow strips out, plus git's own.
    if ([".git", "node_modules", "docs", "src", "scripts", "assets"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { collect(full, out); continue; }
    if (!name.endsWith(".html")) continue;

    const html = readFileSync(full, "utf8");
    const one = (re) => { const m = html.match(re); return m ? m[1] : null; };
    const file = full.slice(ROOT.length + 1);
    out.push({
      file,
      html,
      // "kalkulatory/tapety/index.html" -> "/kalkulatory/tapety/"; a page that is not an
      // index keeps its file name, which is what /privacy-policy.html and /404.html are.
      url: `/${file.replace(/index\.html$/, "")}`,
      title: one(/<title>([\s\S]*?)<\/title>/),
      description: one(/<meta name="description" content="([^"]*)"/),
      robots: one(/<meta name="robots" content="([^"]*)"/),
      canonical: one(/<link rel="canonical" href="([^"]*)"/),
      lang: one(/<html lang="([^"]*)"/),
      og: Object.fromEntries([...html.matchAll(/<meta property="(og:[^"]+)" content="([^"]*)"/g)]
        .map((m) => [m[1], m[2]])),
      ogAlternates: [...html.matchAll(/<meta property="og:locale:alternate" content="([^"]*)"/g)]
        .map((m) => m[1]),
      twitter: Object.fromEntries([...html.matchAll(/<meta name="(twitter:[^"]+)" content="([^"]*)"/g)]
        .map((m) => [m[1], m[2]])),
      hreflang: [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
        .map((m) => ({ lang: m[1], href: m[2] })),
      jsonld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => m[1]),
    });
  }
  return out;
}

const PAGES = collect();
const byUrl = new Map(PAGES.map((page) => [page.url, page]));
const byCanonical = new Map(PAGES.filter((page) => page.canonical).map((page) => [page.canonical, page]));
const isNoindex = (page) => Boolean(page.robots && page.robots.includes("noindex"));
const INDEXED = PAGES.filter((page) => !isNoindex(page));

head("0. the tree this suite is reading");
{
  check("every page the build declares is on disk", PAGES.length > 0);
  // 385 = 383 generated plus the two hand-written ones. It was 375 until session 57
  // added the converter, which is one route in ten languages.
  check("385 pages: 383 generated plus the two hand-written ones",
    PAGES.length === 385, `found ${PAGES.length}`);
  check("every page has a <title>", PAGES.every((page) => page.title), 
    PAGES.filter((page) => !page.title).map((page) => page.url).join(", "));
  check("every page has a robots directive", PAGES.every((page) => page.robots),
    PAGES.filter((page) => !page.robots).map((page) => page.url).join(", "));
}

/* ------------------------------------------------------------------ 1. indexing */

head("1. indexing: which pages are open to a crawler at all");
{
  // The four are the account, the dashboard, a shared estimate and the 404 page. The
  // first three are somebody's own workspace; the fourth is not a page anybody searched
  // for. Everything else on this site exists to be found.
  const closed = PAGES.filter(isNoindex).map((page) => page.url).sort();
  check("exactly four pages are closed to crawlers",
    closed.join(" ") === "/404.html /app/ /app/dashboard/ /p/", closed.join(" "));

  for (const page of INDEXED) {
    check(`${page.url} says index, follow`,
      /^index, follow/.test(page.robots), page.robots);
  }
  check("the open pages allow a large preview",
    INDEXED.every((page) => page.robots.includes("max-image-preview:large")));

  // The route's `indexable` flag and the markup have to say the same thing, or one of
  // them is a document nobody reads.
  const declared = new Set(sitemapUrls(CALCS, GUIDES).map((u) => u.loc));
  for (const page of PAGES) {
    if (page.url === "/404.html") continue; // not a route: GitHub Pages' fallback file
    check(`${page.url}: markup and src/ia.mjs agree on indexing`,
      declared.has(page.url) === !isNoindex(page),
      declared.has(page.url) ? "declared indexable but carries noindex" : "not declared, but crawlable");
  }
}

head("1b. robots.txt");
{
  const txt = read("robots.txt");
  const directives = txt.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  check("it lets everything be crawled", directives.some((l) => /^Allow:\s*\/$/.test(l.trim())));

  // The session-30 rule, and the reason this file changed: a crawler that is told not to
  // fetch a page never reads the noindex on it, and can still list the URL on the
  // strength of a link somewhere else. For /p/<token> the URL *is* the credential, so
  // that listing would publish it. noindex and Disallow do not stack — they cancel.
  const disallows = directives.filter((l) => /^Disallow:/i.test(l.trim()))
    .map((l) => l.split(":")[1].trim()).filter(Boolean);
  for (const page of PAGES.filter(isNoindex)) {
    check(`nothing in robots.txt blocks the crawl of ${page.url}, which carries noindex`,
      !disallows.some((d) => page.url.startsWith(d)), `Disallow: ${disallows.join(", ")}`);
  }
  check("it names the sitemap, absolutely, on the live domain",
    txt.includes(`Sitemap: ${BASE}/sitemap.xml`));
}

/* ------------------------------------------------------------------ 2. sitemap */

const SITEMAP = read("sitemap.xml");
const ENTRIES = [...SITEMAP.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
  const block = m[1];
  const one = (re) => { const x = block.match(re); return x ? x[1] : null; };
  return {
    loc: one(/<loc>([^<]+)<\/loc>/),
    lastmod: one(/<lastmod>([^<]+)<\/lastmod>/),
    alternates: [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)]
      .map((x) => ({ lang: x[1], href: x[2] })),
  };
});

head("2. sitemap.xml: the list, and where it comes from");
{
  check("it is well-formed enough to be read", SITEMAP.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  check("it declares the xhtml namespace the language links need",
    SITEMAP.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));

  // The list is read off src/ia.mjs — the same call the build makes — so this is a check
  // that the file on disk is the file that declaration produces, not a second opinion
  // about which pages exist.
  const declared = sitemapUrls(CALCS, GUIDES).map((u) => BASE + u.loc);
  const listed = ENTRIES.map((e) => e.loc);
  check("every declared URL is listed", declared.every((u) => listed.includes(u)),
    declared.filter((u) => !listed.includes(u)).join(", "));
  check("and nothing else is", listed.every((u) => declared.includes(u)),
    listed.filter((u) => !declared.includes(u)).join(", "));
  check("381 URLs: 380 in ten languages plus the privacy policy",
    ENTRIES.length === 381, `found ${ENTRIES.length}`);

  for (const entry of ENTRIES) {
    check(`${entry.loc} is absolute and on the live domain`, entry.loc.startsWith(`${BASE}/`));
    const page = byUrl.get(entry.loc.slice(BASE.length));
    check(`${entry.loc} is a page that exists`, Boolean(page));
    if (page) check(`${entry.loc} is not also telling crawlers to stay away`, !isNoindex(page));
  }
  // The other direction: a crawlable page missing from the sitemap is a page that has to
  // be found by luck.
  for (const page of INDEXED) {
    check(`${page.url} is in sitemap.xml`, ENTRIES.some((e) => e.loc === page.canonical));
  }
}

head("2b. sitemap.xml: lastmod, and the two elements that are not there");
{
  // Google reads lastmod when it is "consistently and verifiably accurate" and ignores it
  // otherwise, so a build that stamps today onto 381 URLs whether or not they changed
  // burns the field for the whole site. buildSitemap() carries the previous date forward
  // for a page whose content did not change, and the fingerprint behind that ignores the
  // ?v= stamp so bumping STAMP does not re-date everything.
  const today = new Date().toISOString().slice(0, 10);
  for (const entry of ENTRIES) {
    if (entry.loc === BASE + URL_PRIVACY) {
      check("the hand-written page carries no lastmod rather than a guessed one",
        entry.lastmod === null, entry.lastmod);
      continue;
    }
    check(`${entry.loc} has a lastmod`, Boolean(entry.lastmod));
    if (!entry.lastmod) continue;
    check(`${entry.loc}: lastmod is a plain calendar day`, /^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod), entry.lastmod);
    check(`${entry.loc}: lastmod is not in the future`, entry.lastmod <= today, entry.lastmod);
  }
  const dates = new Set(ENTRIES.map((e) => e.lastmod).filter(Boolean));
  check("the dates are real dates", [...dates].every((d) => !Number.isNaN(Date.parse(d))));

  // Google ignores both, and has said so for years; nothing else reads them. They were a
  // number every new page had to invent and nobody could check.
  check("no <changefreq> anywhere", !SITEMAP.includes("<changefreq>"));
  check("no <priority> anywhere", !SITEMAP.includes("<priority>"));
}

head("2c. sitemap.xml: the language groups");
{
  const localized = ENTRIES.filter((e) => e.alternates.length);
  check("every URL but the hand-written one carries a language group",
    localized.length === ENTRIES.length - 1, `${localized.length} of ${ENTRIES.length}`);

  for (const entry of localized) {
    // A group has to name every member, the page itself included: a one-way declaration
    // is thrown away, which is the failure mode that leaves nine languages unindexed.
    const codes = entry.alternates.map((a) => a.lang);
    check(`${entry.loc}: all ten languages plus x-default`,
      codes.join(",") === [...LANGS.map((l) => HREFLANG[l]), "x-default"].join(","), codes.join(","));
    check(`${entry.loc}: names itself`, entry.alternates.some((a) => a.href === entry.loc));
    const xdefault = entry.alternates.find((a) => a.lang === "x-default");
    const polish = entry.alternates.find((a) => a.lang === HREFLANG[DEFAULT_LANG]);
    check(`${entry.loc}: x-default is the Polish address`, xdefault.href === polish.href,
      `${xdefault.href} vs ${polish.href}`);
    for (const alt of entry.alternates) {
      check(`${entry.loc}: ${alt.lang} points at a URL the sitemap also lists`,
        ENTRIES.some((e) => e.loc === alt.href), alt.href);
    }
  }
}

/* ------------------------------------------------------------------ 3. canonical */

head("3. canonical: every page names itself, once");
{
  for (const page of PAGES) {
    if (!check(`${page.url} has a canonical`, Boolean(page.canonical) || page.url === "/404.html")) continue;
    if (!page.canonical) continue; // 404.html: not a URL anybody should be sent back to
    check(`${page.url}: canonical is absolute`, page.canonical.startsWith("https://"), page.canonical);
    check(`${page.url}: canonical is on the live domain`, page.canonical.startsWith(`${BASE}/`), page.canonical);
    check(`${page.url}: canonical points at this page`, page.canonical === BASE + page.url, page.canonical);
    check(`${page.url}: canonical carries no query or fragment`, !/[?#]/.test(page.canonical));
    check(`${page.url}: exactly one canonical`,
      (page.html.match(/<link rel="canonical"/g) || []).length === 1);
  }
  // Two pages claiming the same canonical is one page throwing the other's ranking away.
  const seen = new Map();
  for (const page of PAGES.filter((x) => x.canonical)) {
    check(`${page.canonical} is claimed by one page`, !seen.has(page.canonical),
      `${page.url} and ${seen.get(page.canonical)}`);
    seen.set(page.canonical, page.url);
  }
}

/* ------------------------------------------------------------------ 4. hreflang */

head("4. hreflang in the markup: ten languages that all point at each other");
{
  const localized = INDEXED.filter((page) => page.hreflang.length);
  check("every crawlable page but the hand-written one declares its languages",
    localized.length === INDEXED.length - 1, `${localized.length} of ${INDEXED.length}`);

  for (const page of localized) {
    const codes = page.hreflang.map((a) => a.lang);
    check(`${page.url}: all ten languages plus x-default`,
      codes.join(",") === [...LANGS.map((l) => HREFLANG[l]), "x-default"].join(","), codes.join(","));
    check(`${page.url}: names itself`, page.hreflang.some((a) => a.href === page.canonical));

    for (const alt of page.hreflang) {
      if (alt.lang === "x-default") continue;
      const other = byCanonical.get(alt.href);
      if (!check(`${page.url}: the ${alt.lang} address is a real page`, Boolean(other), alt.href)) continue;
      // Reciprocity: Google throws away a group whose members do not all agree on it.
      check(`${page.url} ↔ ${other.url}: the ${alt.lang} page points back`,
        other.hreflang.some((a) => a.href === page.canonical));
      check(`${other.url} is really in ${alt.lang}`, other.lang === alt.lang, other.lang);
    }
  }
  check("the hand-written page declares no language group, because it has none",
    byUrl.get(URL_PRIVACY).hreflang.length === 0);
}

head("4b. wersje językowe: ten of everything, and each one in its own language");
{
  for (const r of liveRoutes()) {
    if (!r.localized || r.view || r.generated === false) continue;
    const each = r.each === "calculator" ? CALCS : r.each === "guide" ? GUIDES : [null];
    for (const item of each) {
      for (const lang of LANGS) {
        const url = item === null ? r.path(lang) : r.path(lang, item);
        const page = byUrl.get(url);
        if (!check(`${r.id}: ${lang} exists at ${url}`, Boolean(page))) continue;
        check(`${url}: <html lang> is ${HREFLANG[lang]}`, page.lang === HREFLANG[lang], page.lang);
      }
    }
  }
  // The switcher is a set of real links, which is what makes the other nine languages
  // reachable by a crawler that runs no script.
  for (const lang of LANGS) {
    const home = byUrl.get(urlHome(lang));
    for (const other of LANGS) {
      if (other === lang) continue;
      check(`the ${lang} home page links to the ${other} one`,
        home.html.includes(`href="${urlHome(other)}" hreflang="${HREFLANG[other]}"`));
    }
  }
}

/* ------------------------------------------------------------------ 5. metadata */

head("5. metadata: the title and the description of every page");
{
  for (const page of PAGES) {
    check(`${page.url}: the title is not empty`, page.title.trim().length > 0);
    check(`${page.url}: the title carries the brand`, page.title.includes("LiczMat"), page.title);
    // Google truncates a title at roughly 60 characters, so a longer one is words
    // written for nobody. Session 31 brought the calculator pages under this too.
    check(`${page.url}: the title fits a result row (≤ 60)`,
      page.title.length <= 60, `${page.title.length}: ${page.title}`);
  }
  for (const page of INDEXED) {
    if (!check(`${page.url}: has a description`, Boolean(page.description))) continue;
    // Anything past ~160 characters is cut off mid-sentence in the result, so it is text
    // written for nobody. Under 50 and the page is not saying what it is.
    check(`${page.url}: the description fits a snippet (≤ 160)`,
      page.description.length <= 160, `${page.description.length}: ${page.description}`);
    check(`${page.url}: the description says something (≥ 50)`,
      page.description.length >= 50, `${page.description.length}: ${page.description}`);
  }

  // Two pages with the same description are two pages competing for one result.
  const byDescription = new Map();
  for (const page of INDEXED) {
    const seen = byDescription.get(page.description);
    check(`${page.url}: its description is its own`, !seen, `also ${seen}`);
    byDescription.set(page.description, page.url);
  }
  // Titles may repeat across languages — "LiczMat Pro" is a brand name in all ten, and
  // Czech and Slovak really do spell some words the same — but never inside one language,
  // where hreflang has nothing to say about the pair.
  for (const lang of LANGS) {
    const seen = new Map();
    for (const page of INDEXED.filter((x) => x.lang === HREFLANG[lang])) {
      check(`${page.url}: its title is unique within ${lang}`, !seen.has(page.title),
        `also ${seen.get(page.title)}`);
      seen.set(page.title, page.url);
    }
  }
}

/* ------------------------------------------------------------------ 6. Open Graph */

head("6. Open Graph and the Twitter card");
{
  const required = ["og:type", "og:site_name", "og:title", "og:description", "og:url",
    "og:image", "og:image:width", "og:image:height", "og:image:alt", "og:locale"];
  for (const page of PAGES) {
    if (page.url === "/404.html") continue; // nothing shares a 404
    for (const key of required) check(`${page.url}: ${key}`, Boolean(page.og[key]));
    check(`${page.url}: og:url is the canonical`, page.og["og:url"] === page.canonical,
      `${page.og["og:url"]} vs ${page.canonical}`);
    check(`${page.url}: og:image is absolute`, (page.og["og:image"] || "").startsWith("https://"));
    check(`${page.url}: og:type is one of the two this site uses`,
      ["website", "article"].includes(page.og["og:type"]), page.og["og:type"]);
    check(`${page.url}: twitter:card`, page.twitter["twitter:card"] === "summary_large_image");
    check(`${page.url}: twitter:image has alt text`, Boolean(page.twitter["twitter:image:alt"]));
  }

  for (const page of INDEXED.filter((x) => x.hreflang.length)) {
    const lang = LANGS.find((l) => HREFLANG[l] === page.lang);
    check(`${page.url}: og:locale matches the page's language`,
      page.og["og:locale"] === OG_LOCALE[lang], page.og["og:locale"]);
    // Open Graph's own version of hreflang, and it comes from the same source, so the two
    // cannot drift apart.
    const expected = LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]);
    check(`${page.url}: og:locale:alternate names the other nine`,
      page.ogAlternates.join(",") === expected.join(","), page.ogAlternates.join(","));
  }
}

/* ------------------------------------------------------------------ 7. structured data */

head("7. structured data: valid JSON, real types, one entity per thing");
{
  for (const page of PAGES) {
    for (const block of page.jsonld) {
      let parsed;
      if (!check(`${page.url}: the JSON-LD parses`, (() => {
        try { parsed = JSON.parse(block); return true; } catch (e) { return false; }
      })(), block.slice(0, 80))) continue;
      check(`${page.url}: it declares schema.org`, parsed["@context"] === "https://schema.org");
      check(`${page.url}: it declares a type`, Boolean(parsed["@type"]));
      check(`${page.url}: no unclosed script inside it`, !block.includes("</script"));
    }
  }
  // Every page below the home page shows a trail, and the trail is the one rich result
  // Google still draws from this site's markup.
  for (const page of INDEXED) {
    const isHome = LANGS.some((l) => urlHome(l) === page.url);
    if (isHome || page.url === URL_PRIVACY) continue;
    check(`${page.url}: carries a BreadcrumbList`,
      page.jsonld.some((b) => b.includes('"BreadcrumbList"')));
  }
  // The home page used to name the organisation twice — once inside the WebSite's
  // publisher, once beside it — which reads as two organisations with one name. A stable
  // @id makes the second mention a reference rather than a copy.
  for (const lang of LANGS) {
    const home = byUrl.get(urlHome(lang));
    const nodes = home.jsonld.map((b) => JSON.parse(b));
    const org = nodes.filter((n) => n["@type"] === "Organization");
    check(`${lang}: the home page declares one Organization`, org.length === 1, `${org.length}`);
    check(`${lang}: it has a stable identity`, org[0]["@id"] === `${BASE}/#organization`);
    const site = nodes.find((n) => n["@type"] === "WebSite");
    check(`${lang}: the WebSite is identified too`, site["@id"] === `${BASE}/#website`);
    check(`${lang}: and it points at that Organization rather than making a second one`,
      site.publisher["@id"] === `${BASE}/#organization`);
    check(`${lang}: the FAQ is on the home page`, nodes.some((n) => n["@type"] === "FAQPage"));
  }
  // A calculator page says it is part of the site — the same site, not a new one per page.
  for (const lang of LANGS) {
    const page = byUrl.get(urlCalc(lang, CALCS[0].id));
    const app = page.jsonld.map((b) => JSON.parse(b)).find((n) => n["@type"] === "WebApplication");
    check(`${lang}: the calculator declares itself a WebApplication`, Boolean(app));
    check(`${lang}: and belongs to the one WebSite`, app.isPartOf["@id"] === `${BASE}/#website`);
    check(`${lang}: in this page's language`, app.inLanguage === lang, app.inLanguage);
  }
}

head("7b. site.webmanifest and the shared image");
{
  const manifest = JSON.parse(read("site.webmanifest"));
  check("the manifest names the brand", manifest.short_name === "LiczMat");
  check("its name does too", manifest.name.startsWith("LiczMat"));
  // It was still carrying "Policz. Kup. Nie marnuj." — the slogan session 6 retired and
  // the OG image was re-rendered for. Every page links this file from its <head>, so the
  // retired one was being handed out 373 times.
  const slogan = "Policz. Zaplanuj. Zrealizuj.";
  check("and the slogan is the one in use", manifest.description.includes(slogan),
    manifest.description);
  const home = byUrl.get(urlHome(DEFAULT_LANG));
  check("the same slogan the shared image is described with",
    home.og["og:image:alt"].includes(slogan), home.og["og:image:alt"]);
  // "./index.html" opened the installed app on a second URL for the home page.
  check("it starts at the site root, not at a second address for it", manifest.start_url === "/");
  check("its scope is the whole site", manifest.scope === "/");
  for (const icon of manifest.icons) {
    check(`the manifest icon ${icon.src} is a root-absolute path`, icon.src.startsWith("/"));
    check(`the manifest icon ${icon.src} exists`, (() => {
      try { statSync(p(icon.src.slice(1))); return true; } catch (e) { return false; }
    })());
  }
  for (const asset of ["assets/og-image.jpg", "assets/icon-512.png", "assets/favicon-32.png"]) {
    check(`${asset} is in the repo, so the tags pointing at it are not a 404`, (() => {
      try { return statSync(p(asset)).size > 0; } catch (e) { return false; }
    })());
  }
}

/* ------------------------------------------------------------------ 8. the private pages */

head("8. the pages that are deliberately closed");
{
  for (const url of ["/app/", "/app/dashboard/", "/p/"]) {
    const page = byUrl.get(url);
    check(`${url}: noindex, nofollow`, page.robots === "noindex, nofollow", page.robots);
    // A noindex page may keep a canonical, but only its own: a noindex pointing its
    // canonical at another page tells a crawler to drop that page too.
    check(`${url}: its canonical is its own address`, page.canonical === BASE + url, page.canonical);
    // They have no per-language URL, so an hreflang set would be a claim about pages that
    // do not exist.
    check(`${url}: declares no language group`, page.hreflang.length === 0);
    check(`${url}: is out of sitemap.xml`, !ENTRIES.some((e) => e.loc === BASE + url));
  }
  const notFound = byUrl.get("/404.html");
  check("404.html is noindex but still followed, so its links keep working",
    notFound.robots === "noindex, follow", notFound.robots);
  check("404.html claims no canonical", notFound.canonical === null);
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`seo: ${passed}/${passed} checks pass`);
