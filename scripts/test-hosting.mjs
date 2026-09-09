#!/usr/bin/env node
/**
 * LiczMat — Firebase Hosting nie może zjeść serwisu.
 *
 *     node scripts/test-hosting.mjs
 *
 * Do 2026-09 `firebase.json` miał wyłącznie blok `functions`, a `firebase deploy` nie
 * umiał opublikować niczego poza chmurą funkcji. Blok `hosting` to zmienia i dlatego
 * powstał ten test: od teraz jedno nieuważne `firebase deploy` może wysłać katalog na
 * Hosting, a katalogiem domyślnym w takim pliku bywa `"public": "."` — czyli 523 strony
 * serwisu, drugi raz, pod drugim adresem, konkurujące z GitHub Pages o te same wyniki
 * wyszukiwania.
 *
 * `auth.liczmat.com` istnieje z jednego powodu: Firebase Authentication wstawi własny
 * adres w pole Od tylko dla domeny, która jest witryną Hostingu w tym samym projekcie,
 * bo z niej serwuje też link akcji `/__/auth/action`. Apeks `liczmat.com` stoi na GitHub
 * Pages i `/__/auth/` obsłużyć nie umie, więc subdomena niesie samą pocztę.
 *
 * Sprawdzane jest to:
 *
 *   1. blok `hosting` wskazuje na `hosting/auth`, nigdy na katalog główny;
 *   2. w `hosting/auth` leżą dokładnie dwa pliki i żaden z nich nie jest stroną serwisu;
 *   3. subdomena prosi o nieindeksowanie — w `robots.txt` i w `<meta name="robots">`;
 *   4. blok `functions` jest nietknięty, bo to ten sam plik;
 *   5. `pages.yml` wyrzuca `hosting/` z artefaktu GitHub Pages, tak jak wyrzuca
 *      `functions/` — inaczej ta strona pojawiłaby się pod liczmat.com/hosting/auth/.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");

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
const eq = (name, got, want) =>
  check(name, got === want, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);

const config = JSON.parse(read("firebase.json"));

/* ================================================================== 1. what gets published */

head("1. hosting: what a deploy would upload");
{
  const sites = Array.isArray(config.hosting) ? config.hosting : [config.hosting];
  eq("exactly one Hosting site is declared", sites.length, 1);

  const site = sites[0] || {};
  eq("and it is the auth subdomain's site", site.site, "liczmat-auth");
  eq("publishing the two-file directory", site.public, "hosting/auth");

  // The whole point of the test. "." would be the repository root, and a repository root
  // on Firebase Hosting is the entire site published a second time.
  for (const bad of [".", "./", "", "/", "public"]) {
    check(`"${bad}" is not what would be uploaded`, site.public !== bad);
  }
  check("no rewrite turns the site into a single-page app",
    !site.rewrites, "a rewrite here would answer /__/auth/action itself");
}

/* ================================================================== 2. the directory */

head("2. hosting/auth: two files, and neither is a page of the site");
{
  const files = readdirSync(join(ROOT, "hosting/auth")).sort();
  eq("exactly the two files", files.join(","), "index.html,robots.txt");
  check("no subdirectories", files.every((f) =>
    statSync(join(ROOT, "hosting/auth", f)).isFile()));

  const html = read("hosting/auth/index.html");
  // A generated page carries the site's footer, its i18n hooks and its stylesheet. If any
  // of those turn up here, somebody has copied the site into the Hosting directory.
  for (const marker of ['<footer class="site"', "data-i18n=", "/assets/styles.min.css", "hreflang="]) {
    check(`no ${marker} — this is not a page of the site`, !html.includes(marker));
  }
  check("it says what the subdomain is for", html.includes("auth.liczmat.com"));
  check("and points a lost visitor back at the site", html.includes("https://liczmat.com/"));
  check("the contact address is the site's own",
    html.includes("contact@liczmat.com") && !html.includes("polednia@gmail.com"));
}

/* ================================================================== 3. keep it out of the index */

head("3. nothing here belongs in a search result");
{
  const robots = read("hosting/auth/robots.txt");
  check("robots.txt disallows everything", /User-agent:\s*\*/i.test(robots) && /Disallow:\s*\/\s*$/m.test(robots));
  check("and the page says the same in its own head",
    /<meta name="robots" content="[^"]*noindex/.test(read("hosting/auth/index.html")));
}

/* ================================================================== 4. the other half of the file */

head("4. the functions block is where it was");
{
  eq("source", config.functions && config.functions.source, "functions");
  eq("codebase", config.functions && config.functions.codebase, "default");
  check("hosting did not swallow it", Boolean(config.functions));
}

/* ================================================================== 5. GitHub Pages */

head("5. the artifact GitHub Pages uploads");
{
  const wf = read(".github/workflows/pages.yml");
  const drop = (wf.match(/rm -rf .*/) || [""])[0];
  check("hosting/ is dropped from the artifact", /\brm -rf\b[^\n]*\bhosting\b/.test(wf),
    drop || "no rm -rf line found");
  check("next to functions/, which is dropped for the same reason",
    /\brm -rf\b[^\n]*\bfunctions\b/.test(wf), drop);
}

/* ------------------------------------------------------------------ the result */

if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} checks FAILED:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`hosting: ${passed}/${passed} checks pass`);
