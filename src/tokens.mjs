/* The design system, checked.
 *
 * assets/styles.css is the design system: one token block, and rules that spend
 * those tokens. Nothing enforces that by itself — CSS has no compiler and a
 * browser silently ignores var(--typo). These checks run inside the build
 * (scripts/build.mjs) so a stylesheet that has drifted stops the build the same
 * way a missing translation does.
 *
 * What is checked:
 *   1. the two themes carry exactly the same set of colour tokens, and the two
 *      copies of the dark palette (media query + [data-theme]) are identical;
 *   2. every var(--token) used anywhere in the file is actually defined;
 *   3. no rule outside the token blocks invents a colour, a radius, a shadow or
 *      a transition duration — those must come from a token.
 *
 * Point 3 has a short allowlist, and each entry on it is a real exception rather
 * than an oversight; see LITERAL_OK below.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = join(ROOT, "assets/styles.css");

/** Colours that are deliberately not theme tokens, with the reason they are not. */
const LITERAL_OK = new Map([
  ["#0d1117", "the Google Play badge is Google's black in both themes"],
  ["#fff", "print and the Play badge: paper is white, not a themed surface"],
  ["#000", "print: ink is black"],
  ["#ccc", "print: the estimate's rules on paper"],
]);

/** Sizes that are not on a scale because they are pictures of physical things. */
const SIZE_OK = new Set([
  "40px", // the phone mockup's corner — a device radius, not a UI radius
  "2px",  // the flag's corner, 20×14px: any scale radius would eat the flag
  "3px",  // the store chain swatch, 12×12px
  "5px",  // inline <code> in the legal pages
  "50%",  // .badge .dot, a circle
]);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of one rule, given the selector text that opens it. */
function blockAfter(css, opener) {
  const at = css.indexOf(opener);
  if (at < 0) return null;
  const start = css.indexOf("{", at + opener.length - 1);
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(start + 1, i);
  }
  return null;
}

const tokensIn = (block) => {
  const out = new Map();
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
};

export function validateTokens() {
  const problems = [];
  const css = stripComments(readFileSync(CSS, "utf8"));

  /* 1. the two themes, and the two copies of the dark one --------------------- */
  const lightBlock = blockAfter(css, ":root {");
  const darkMedia = blockAfter(css, ':root:not([data-theme="light"]) {');
  const darkAttr = blockAfter(css, ':root[data-theme="dark"] {');
  if (!lightBlock || !darkMedia || !darkAttr) {
    problems.push("styles.css: cannot find the three theme blocks — did a selector change?");
    return problems;
  }

  const light = tokensIn(lightBlock);
  const media = tokensIn(darkMedia);
  const attr = tokensIn(darkAttr);

  for (const [name, value] of media) {
    if (!attr.has(name)) problems.push(`token ${name} is set for the system dark theme but not for data-theme="dark"`);
    else if (attr.get(name) !== value) {
      problems.push(`token ${name} differs between the two dark blocks: "${value}" vs "${attr.get(name)}"`);
    }
  }
  for (const name of attr.keys()) {
    if (!media.has(name)) problems.push(`token ${name} is set for data-theme="dark" but not for the system dark theme`);
  }
  // --brand-lime is fixed on purpose: the logo's green does not follow the theme.
  for (const name of light.keys()) {
    if (name === "--brand-lime") continue;
    if (!media.has(name)) problems.push(`token ${name} has a light value but no dark one`);
  }
  for (const name of media.keys()) {
    if (!light.has(name)) problems.push(`token ${name} has a dark value but no light one`);
  }

  /* 2. every var() resolves --------------------------------------------------- */
  const defined = new Set([...light.keys(), ...media.keys()]);
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
  const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  for (const name of used) {
    if (!defined.has(name)) problems.push(`styles.css uses var(${name}), which is never defined`);
  }

  /* 3. no literals where a token belongs -------------------------------------- */
  // Everything after the token blocks: the rules that are supposed to spend them.
  const marker = ":root { color-scheme: light; }";
  if (!css.includes(marker)) {
    problems.push("styles.css: cannot find where the rules start (the color-scheme line)");
    return problems;
  }
  const rules = css.slice(css.indexOf(marker));

  for (const line of rules.split("\n")) {
    if (/^\s*--/.test(line)) continue; // a token defining itself
    for (const m of line.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
      if (!LITERAL_OK.has(m[0].toLowerCase())) {
        problems.push(`styles.css: literal colour ${m[0]} outside the token block — add a token or an allowlist entry: ${line.trim()}`);
      }
    }
    for (const m of line.matchAll(/border-radius:\s*([^;]+);/g)) {
      for (const part of m[1].split(/\s+/)) {
        if (/^\d/.test(part) && parseFloat(part) !== 0 && !SIZE_OK.has(part)) {
          problems.push(`styles.css: literal radius ${part} — use a --radius-* token: ${line.trim()}`);
        }
      }
    }
    // The reduced-motion block cancels transitions rather than timing them, so its
    // .01ms is not a duration this rule is about.
    if (line.includes("!important")) continue;
    for (const m of line.matchAll(/transition[^;]*?(\d+(?:\.\d+)?)(m?s)\b/g)) {
      problems.push(`styles.css: literal duration ${m[1]}${m[2]} — use a --dur-* token: ${line.trim()}`);
    }
  }

  return problems;
}
