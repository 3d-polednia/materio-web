#!/usr/bin/env node
/** Write one purchase confirmation and its attachments for local review. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { PURCHASE_URLS, purchaseMail } from "../functions/purchase-map.mjs";

const lang = String(process.argv[2] || "").toLowerCase();
const outputArg = process.argv[3];
if (!Object.hasOwn(PURCHASE_URLS, lang) || !outputArg) {
  console.error("Usage: node scripts/purchase-mail-preview.mjs <lang> <output-directory>");
  process.exit(1);
}

const outputDir = resolve(outputArg);
mkdirSync(outputDir, { recursive: true });
const mail = purchaseMail({
  lang,
  plan: "monthly",
  amountMinor: 999,
  currency: "EUR",
  createdMs: Date.now(),
  email: "customer@example.com",
});

writeFileSync(join(outputDir, `preview-${lang}.txt`), `${mail.subject}\n\n${mail.text}`, "utf8");
writeFileSync(join(outputDir, `preview-${lang}.html`), mail.html, "utf8");
for (const attachment of mail.attachments) {
  writeFileSync(join(outputDir, attachment.filename), attachment.content, "utf8");
}

console.log(mail.subject);
