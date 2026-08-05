# materio-web

Marketing website for **Materio** — an offline-first material calculator &
optimizer for Android. *Policz. Kup. Nie marnuj.* (Calculate. Buy. Waste less.)

App on Google Play: <https://play.google.com/store/apps/details?id=pl.materio.app>

## What this is

A fast, dependency-free static site:

- **Zero external requests** — no CDN, no web fonts, no analytics, no tracking
  cookies. All CSS/JS is served from this repo; the interactive calculators run
  entirely in the visitor's browser.
- **Crawlable** — the landing copy is real HTML (Polish by default), not
  hydrated-in-by-JS, so search engines index full content. The language switcher
  (10 languages) is progressive enhancement on top.
- **SEO-ready** — canonical URL, Open Graph + Twitter cards, `MobileApplication`
  and `FAQPage` JSON-LD, `sitemap.xml`, `robots.txt`, PWA manifest.
- **Accessible & responsive** — semantic landmarks, skip link, focus styles,
  light/dark via `prefers-color-scheme`.

## Structure

```
index.html              Landing page (hero, features, how-it-works,
                        live calculators, projects, trust/privacy, FAQ, CTA)
privacy-policy.html     Full bilingual (PL/EN) privacy policy
404.html                Not-found page
assets/
  styles.css            Olive Green Material 3 design system
  i18n.js               10-language dictionary + switcher
  calculators.js        Calculation engines (ported 1:1 from the app), pure JS
  main.js               Page wiring (switcher, tabs, room helper, mobile nav)
  logo.svg / favicon.svg
  og-image.png          1200×630 social preview
  icon-192.png / icon-512.png
robots.txt · sitemap.xml · site.webmanifest · .nojekyll
.github/workflows/pages.yml   Auto-deploy to GitHub Pages
```

## Run locally

It's plain static files — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Deployment (GitHub Pages)

The workflow in `.github/workflows/pages.yml` publishes the repo root to Pages on
every push. One-time setup: **repo → Settings → Pages → Build and deployment →
Source: GitHub Actions**. The site then serves at
`https://3d-polednia.github.io/materio-web/`.

### Using a custom domain (e.g. `materio.pl`)

1. Add a `CNAME` file at the repo root containing the domain.
2. Point the domain's DNS at GitHub Pages.
3. Find-and-replace the absolute base URL
   `https://3d-polednia.github.io/materio-web` → your domain in
   `index.html`, `privacy-policy.html`, `sitemap.xml` and `robots.txt`
   (canonical, Open Graph and sitemap links).

## License

Marketing content and brand "Materio" © Materio. Code is free to reuse.
