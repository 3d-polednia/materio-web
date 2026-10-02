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
  if (!list) return text;

  let re = REGEX_CACHE.get(lang);
  if (!re) {
    re = new RegExp(`(?<=^|[\\s„"(\\[/])([${list.join("")}]) `, "gi");
    REGEX_CACHE.set(lang, re);
  }

  return text.replace(re, "$1\u00a0");
}
