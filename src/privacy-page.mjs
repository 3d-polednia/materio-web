/**
 * The privacy policy as generated pages (review 2026-10-02, P17).
 *
 * The text lives in src/privacy/<lang>.mjs, one file per language with the same section ids;
 * the German one is binding and every other page says so at the top, linking it. This file
 * only lays the text out: heading levels follow the section numbers ("3.1." is an h3), and
 * /privacy-policy.html, the address the Android app and the Play listing carry, keeps the
 * Polish and English text in full with links to all thirteen.
 */
import pl from "./privacy/pl.mjs";
import uk from "./privacy/uk.mjs";
import de from "./privacy/de.mjs";
import en from "./privacy/en.mjs";
import cs from "./privacy/cs.mjs";
import sk from "./privacy/sk.mjs";
import ro from "./privacy/ro.mjs";
import hr from "./privacy/hr.mjs";
import sr from "./privacy/sr.mjs";
import it from "./privacy/it.mjs";
import nl from "./privacy/nl.mjs";
import es from "./privacy/es.mjs";
import fr from "./privacy/fr.mjs";
import { BASE, LANGS, urlHome, urlPrivacy } from "./site.mjs";
import { LANG_NAME } from "./flags.mjs";

export const PRIVACY = { pl, uk, de, en, cs, sk, ro, hr, sr, it, nl, es, fr };

/**
 * The date as the page's language writes it (AUDYT3 A7): "2 października 2026", not the ISO
 * "2026-10-02" that stays in the datetime attribute for machines.
 */
function policyDate(policy) {
  try {
    return new Intl.DateTimeFormat(policy.lang, { dateStyle: "long", timeZone: "UTC" })
      .format(new Date(`${policy.updated}T00:00:00Z`));
  } catch (e) { return policy.updated; }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

/* The contents list is named in the page language, not in English for everyone. */
const TOC_LABEL = { pl: "Spis treści", uk: "Зміст", de: "Inhalt", en: "Contents", cs: "Obsah", sk: "Obsah", ro: "Cuprins", hr: "Sadržaj", sr: "Sadržaj", it: "Indice", nl: "Inhoud", es: "Índice", fr: "Sommaire" };

const headingLevel = (heading) => /^\d+\.\d+\./.test(heading) ? 3 : 2;
const noLongDash = (text) => String(text).replace(/[–—]/g, "&#45;").replace(/ - /g, " &#45; ");

function policyArticle(policy, prefix = "") {
  const note = policy.binding ? "" : `<p class="muted privacy-translation"><a href="/de/datenschutz/">${noLongDash(esc(policy.translationNote))}</a></p>`;
  const toc = `<nav class="toc" aria-label="${esc(TOC_LABEL[policy.lang] || TOC_LABEL.en)}"><ul>${policy.sections.map((section) =>
    `<li><a href="#${prefix}${esc(section.id)}">${noLongDash(esc(section.h))}</a></li>`).join("")}</ul></nav>`;
  const sections = policy.sections.map((section) => {
    const level = headingLevel(section.h);
    return `<h${level} id="${prefix}${esc(section.id)}">${noLongDash(esc(section.h))}</h${level}>${noLongDash(section.html)}`;
  }).join("");

  return `<article lang="${esc(policy.lang)}">
    <h1>${noLongDash(esc(policy.title))}</h1>
    <p class="muted"><time datetime="${esc(policy.updated)}">${esc(policyDate(policy))}</time></p>
    ${note}
    ${toc}
    ${sections}
  </article>`;
}

export function privacyMain(policy, home = "LiczMat") {
  return `<main id="main" tabindex="-1" class="doc">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${urlHome(policy.lang)}">${esc(home)}</a></li><li aria-current="page">${esc(policy.title)}</li></ol></nav>
    ${policyArticle(policy)}
  </main>`;
}

export function privacyBreadcrumbLd(policy, home = "LiczMat") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: BASE + urlHome(policy.lang) },
      { "@type": "ListItem", position: 2, name: policy.title, item: BASE + urlPrivacy(policy.lang) },
    ],
  };
}

export function privacyDescription(policy) {
  const text = policy.sections[0].html.replace(/<[^>]+>/g, " ").replace(/[“”„"]/g, "").replace(/\s+/g, " ").trim();
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}...`;
}

export function privacyLegacyMain(policies) {
  const links = LANGS.map((lang) =>
    `<li><a href="${urlPrivacy(lang)}" hreflang="${lang}" lang="${lang}">${esc(LANG_NAME[lang])}</a></li>`).join("");
  return `<main id="main" tabindex="-1" class="doc">
    <nav class="lang-switch" aria-label="Language versions"><ul>${links}</ul></nav>
    ${policyArticle(policies.pl, "pl-")}
    ${policyArticle(policies.en, "en-")}
  </main>`;
}
