/**
 * Layout for the localized LiczMat Pro terms.
 *
 * The legal text stays in src/terms/<lang>.mjs. This module only gives every language
 * the same document structure, heading levels, contents list and German binding link.
 */

import { BASE, urlHome, urlTerms } from "./site.mjs";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

const TOC_LABEL = { pl: "Spis treści", uk: "Зміст", de: "Inhalt", en: "Contents", cs: "Obsah", sk: "Obsah", ro: "Cuprins", hr: "Sadržaj", sr: "Sadržaj", it: "Indice", nl: "Inhoud", es: "Índice", fr: "Sommaire" };
const headingLevel = (heading) => /^\d+\.\d+\./.test(heading) ? 3 : 2;
const noLongDash = (text) => String(text).replace(/[–—]/g, "&#45;").replace(/ - /g, " &#45; ");

function termsDate(terms) {
  try {
    return new Intl.DateTimeFormat(terms.lang, { dateStyle: "long", timeZone: "UTC" })
      .format(new Date(`${terms.updated}T00:00:00Z`));
  } catch (e) { return terms.updated; }
}

function termsArticle(terms) {
  const note = terms.binding ? "" : `<p class="muted privacy-translation"><a href="${urlTerms("de")}">${noLongDash(esc(terms.translationNote))}</a></p>`;
  const toc = `<nav class="toc" aria-label="${esc(TOC_LABEL[terms.lang] || TOC_LABEL.en)}"><ul>${terms.sections.map((section) =>
    `<li><a href="#${esc(section.id)}">${noLongDash(esc(section.h))}</a></li>`).join("")}</ul></nav>`;
  const sections = terms.sections.map((section) => {
    const level = headingLevel(section.h);
    return `<h${level} id="${esc(section.id)}">${noLongDash(esc(section.h))}</h${level}>${noLongDash(section.html)}`;
  }).join("");

  return `<article lang="${esc(terms.lang)}"${terms.binding ? ' data-binding="true"' : ""}>
    <h1>${noLongDash(esc(terms.title))}</h1>
    <p class="muted"><time datetime="${esc(terms.updated)}">${esc(termsDate(terms))}</time></p>
    ${note}
    ${toc}
    ${sections}
  </article>`;
}

export function termsMain(terms, home = "LiczMat") {
  return `<main id="main" tabindex="-1" class="doc">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${urlHome(terms.lang)}">${esc(home)}</a></li><li aria-current="page">${esc(terms.title)}</li></ol></nav>
    ${termsArticle(terms)}
  </main>`;
}

export function termsBreadcrumbLd(terms, home = "LiczMat") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: BASE + urlHome(terms.lang) },
      { "@type": "ListItem", position: 2, name: terms.title, item: BASE + urlTerms(terms.lang) },
    ],
  };
}

export function termsDescription(terms) {
  const text = terms.sections[0].html.replace(/<[^>]+>/g, " ").replace(/[“”„"]/g, "").replace(/\s+/g, " ").trim();
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}...`;
}
