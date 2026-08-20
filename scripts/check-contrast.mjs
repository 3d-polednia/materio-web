#!/usr/bin/env node
/* Contrast check for the design system's colour tokens.
 *
 *   node scripts/check-contrast.mjs
 *
 * Reads the three theme blocks straight out of assets/styles.css and measures
 * every pair the design system promises: text pairs against WCAG AA (4.5:1, or
 * 3:1 where the text is large), and the pairs that are not text — a field's
 * border, the focus ring — against the 3:1 of WCAG 1.4.11. Both themes.
 *
 * It is deliberately not part of the build: which pairs matter is a judgement
 * about the design, not something a generator can infer. Run it after changing a
 * colour token, and paste the result into the session report.
 *
 * Exit code 1 if any pair is below its target.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ROOT, "assets/styles.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/* Every block opened by this selector, joined — the light theme is declared in
   two :root rules: the colours, then the scales that carry --focus. */
function block(opener) {
  const out = [];
  for (let at = css.indexOf(opener); at >= 0; at = css.indexOf(opener, at + 1)) {
    const start = css.indexOf("{", at + opener.length - 1);
    let depth = 0;
    for (let i = start; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) { out.push(css.slice(start + 1, i)); break; }
    }
  }
  if (!out.length) throw new Error(`no block for ${opener}`);
  return out.join("\n");
}
const tokens = (text) => Object.fromEntries(
  [...text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

const LIGHT = tokens(block(":root {"));
const DARK = { ...LIGHT, ...tokens(block(':root[data-theme="dark"] {')) };

const srgb = (hex) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? [...h].map((c) => c + c) : h.match(/../g);
  return n.slice(0, 3).map((p) => parseInt(p, 16) / 255);
};
const lum = (hex) => {
  const [r, g, b] = srgb(hex).map((c) => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
  return .2126 * r + .7152 * g + .0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + .05) / (y + .05);
};

/* [foreground, background, target, what it is] */
const PAIRS = [
  ["--on-bg", "--bg", 4.5, "body text on the page"],
  ["--on-surface", "--surface", 4.5, "body text on a card"],
  ["--on-bg", "--surface-alt", 4.5, "body text on an alternating section"],
  ["--on-bg", "--surface-container", 4.5, "footer text"],
  ["--muted", "--bg", 4.5, "secondary text on the page"],
  ["--muted", "--surface", 4.5, "secondary text on a card"],
  ["--muted", "--surface-alt", 4.5, "secondary text on an alternating section"],
  ["--muted", "--surface-container", 4.5, "secondary text in the footer"],
  ["--accent-strong", "--bg", 4.5, "a link on the page"],
  ["--accent-strong", "--surface", 4.5, "a link on a card"],
  ["--accent-strong", "--surface-alt", 4.5, "a link on an alternating section"],
  ["--accent-strong", "--surface-container", 4.5, "a link in the footer"],
  ["--on-accent", "--accent", 4.5, "the label of a primary button"],
  ["--accent", "--on-accent", 4.5, "the inverted button inside the app banner"],
  ["--accent-strong", "--accent-soft", 4.5, "the chosen material, on its tint"],
  ["--on-accent-soft", "--accent-soft", 4.5, "the result box, the tip box"],
  ["--on-bg", "--accent-soft", 4.5, "the heading and the list on the level card you are on"],
  ["--on-error-soft", "--error-soft", 4.5, "an error message"],
  ["--on-success-soft", "--success-soft", 4.5, "a success message"],
  ["--on-warning-soft", "--warning-soft", 4.5, "a warning message"],
  ["--tertiary", "--tertiary-container", 4.5, "the icon tile on a calculator card"],
  ["--on-surface", "--field-bg", 4.5, "what somebody types into a field"],
  ["--muted", "--field-bg", 4.5, "the placeholder in a field"],
  ["--error", "--surface", 4.5, "error text on a card"],
  ["--surface", "--error", 4.5, "the label of a danger button"],
  ["--success", "--bg", 4.5, "success text on the page"],
  ["--warning", "--bg", 4.5, "warning text on the page"],
  // Not text: WCAG 1.4.11 wants 3:1 for the boundary of a control and for focus.
  ["--outline-control", "--field-bg", 3, "the border of an input (1.4.11)"],
  ["--outline-control", "--surface", 3, "that border against the card behind it"],
  ["--focus", "--bg", 3, "the focus ring on the page"],
  ["--focus", "--surface", 3, "the focus ring on a card"],
  ["--accent-edge", "--bg", 3, "the edge of a primary button (1.4.11)"],
  ["--accent-edge", "--surface", 3, "that edge on a card"],
  ["--accent-edge", "--accent-soft", 3, "the rule under the page you are on, in the navigation"],
];

let bad = 0;
for (const [theme, T] of [["light", LIGHT], ["dark", DARK]]) {
  console.log(`\n${theme.toUpperCase()}`);
  for (const [fg, bg, target, what] of PAIRS) {
    const value = T[fg].startsWith("var(") ? T[T[fg].slice(4, -1)] : T[fg];
    const r = ratio(value, T[bg]);
    const ok = r >= target;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}:1  (min ${target})  ${fg} on ${bg} — ${what}`);
  }
}
console.log(bad ? `\n${bad} pair(s) below target.` : "\nAll pairs pass.");
process.exit(bad ? 1 : 0);
