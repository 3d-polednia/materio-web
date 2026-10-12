/*
 * The admin panel's words (assets/admin.js) follow the site's copy rules too.
 *
 * The panel is fetched at run time for admin accounts only, so no generated page carries
 * its text and no copy suite reads it. The owner found "—" in it twice (2026-10-12) after
 * the rule "no — and no – in the site's text" had been in force since 2026-10-02. This
 * reads the file with its comments removed, so the English notes for developers may keep
 * their dashes, and fails on any dash left in what the panel shows.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(ROOT, "assets/admin.js"), "utf8");
const withoutComments = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const shown = withoutComments.split("\n")
  .map((line, index) => ({ line: index + 1, text: line }))
  .filter((entry) => /[—–]/.test(entry.text));

if (shown.length) {
  console.error(`admin copy: ${shown.length} line(s) with a long dash in what the panel shows`);
  for (const entry of shown) console.error(`  ${entry.text.trim()}`);
  process.exit(1);
}
console.log("admin copy: no long dash in the panel's text");
