/**
 * Polish typography: a one-letter word must not end a line (sierotki).
 * Same rule applies in Czech, Slovak, Croatian, and Serbian.
 * Bind short words to following words using a no-break space (U+00A0).
 */

const SHORT_WORDS = Object.freeze({
  pl: Object.freeze(["a", "i", "o", "u", "w", "z"]),
  cs: Object.freeze(["a", "i", "k", "o", "s", "u", "v", "z"]),
  sk: Object.freeze(["a", "i", "k", "o", "s", "u", "v", "z"]),
  hr: Object.freeze(["a", "i", "k", "o", "s", "u", "v"]),
  sr: Object.freeze(["a", "i", "k", "o", "s", "u", "v"]),
});

const REGEX_CACHE = new Map();

/**
 * Replace ordinary space following a one-letter word with a no-break space.
 *
 * @param {unknown} text: plain text string
 * @param {string} lang: language code
 * @returns {unknown} text with short words bound to following words
 */
export function nbspShortWords(text, lang) {
  if (typeof text !== "string") return text;
  const list = SHORT_WORDS[lang];
  let output = text;
  if (list) {
    let re = REGEX_CACHE.get(lang);
    if (!re) {
      re = new RegExp(`(?<=^|[\\s„"(\\[/])([${list.join("")}]) `, "gi");
      REGEX_CACHE.set(lang, re);
    }
    output = output.replace(re, "$1\u00a0");
  }

  /* AUDYT3 A4: bind generated phone groups and street abbreviations across languages. */
  return output
    .replace(/(?<!\d)(?:\+?\d{1,3} )?\d{3} \d{3} \d{3}(?!\d)/g, (phone) => phone.replaceAll(" ", "\u00a0"))
    .replace(/\b(ul\.|al\.|pl\.) ([\p{L}\p{N}])/giu, "$1\u00a0$2");
}

/* Elements whose content is not prose: code, styles, data and what the visitor types. They
   are cut out whole first, because a script may well contain a "<" that is not a tag. */
const RAW_BLOCK = /(<(script|style|textarea|pre|code)\b[\s\S]*?<\/\2\s*>)/i;

/**
 * The same rule over a whole generated page, applied to text between tags only.
 *
 * Wrapping the dictionary lookup alone missed every sentence that reaches a page another
 * way (the calculator SEO copy, the guides, the policy), so scripts/build.mjs runs this on
 * each page as it is written. Tags and their attributes are left byte for byte, and so is
 * the content of <script>, <style>, <textarea>, <pre> and <code>: an inline script's CSP
 * hash is taken after this step, and a textarea's value is the visitor's, not ours.
 *
 * @param {string} html  a complete page
 * @param {string} lang  the page's language
 * @returns {string}
 */
export function nbspHtml(html, lang) {
  if (typeof html !== "string") return html;
  let out = "";
  let rest = html;
  for (let raw = rest.match(RAW_BLOCK); raw; raw = rest.match(RAW_BLOCK)) {
    out += nbspProse(rest.slice(0, raw.index), lang) + raw[1];
    rest = rest.slice(raw.index + raw[1].length);
  }
  return out + nbspProse(rest, lang);
}

/** Markup with no raw blocks left in it: bind in the text, keep every tag as it is. */
function nbspProse(markup, lang) {
  return markup.split(/(<[^>]*>)/)
    .map((part, index) => (index % 2 === 1 || !part ? part : nbspShortWords(part, lang)))
    .join("");
}
