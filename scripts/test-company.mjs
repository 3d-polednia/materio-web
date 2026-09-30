#!/usr/bin/env node
/* LiczMat — company store and logo sizing, tested without a browser. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = ["assets/crm-store.js", "assets/crm.js", "assets/company-logo.js"]
  .map((file) => readFileSync(join(ROOT, file), "utf8")).join("\n");
const backing = new Map();
let writes = 0;
const localStorage = { getItem: (key) => backing.get(key) || null,
  setItem: (key, value) => { writes++; backing.set(key, String(value)); } };
let id = 0;
const api = new Function("localStorage", "document", "crypto", "pwAllows", `${source}\nreturn {crmLoad,crmAddCompany,crmUpdateCompany,crmCompanies,crmDefaultCompany,crmSetDefaultCompany,crmDeleteCompany,crmRestoreCompany,crmImport,companyLogoValid,companyLogoFit};`)(localStorage, { dispatchEvent() {}, addEventListener() {}, activeElement: null }, { randomUUID: () => `co-${++id}` }, () => true);
let passed = 0;
const check = (condition, message) => { if (!condition) throw new Error(message); passed++; };

check(Array.isArray(api.crmLoad().companies), "missing companies reads as []");
check(api.crmAddCompany({ name: "" }) === null, "name is required");
const first = api.crmAddCompany({ name: "Pierwsza", nip: "1" });
const second = api.crmAddCompany({ name: "Druga" });
check(first.isDefault === true, "first is default");
check(second.isDefault === false, "second is not default");
check(api.crmCompanies()[0].id === first.id, "default sorts first");
const beforeMove = JSON.parse(backing.get("liczmat-crm-v1")).companies;
check(api.crmSetDefaultCompany(second.id).isDefault, "default can move");
check(api.crmDefaultCompany().id === second.id, "default reader follows move");
const afterMove = JSON.parse(backing.get("liczmat-crm-v1")).companies;
check(afterMove.every((row, i) => row.updatedAt > beforeMove[i].updatedAt),
  "moving default timestamps every changed row");
check(api.crmUpdateCompany(first.id, { name: "A".repeat(130) }).name.length === 120, "name cap");
check(api.crmUpdateCompany(first.id, { bankAccount: "1".repeat(50) }).bankAccount.length === 40, "bank cap");
check(api.crmUpdateCompany(first.id, { logo: "data:image/gif;base64,AA" }) === null, "bad logo prefix refused");
check(api.crmUpdateCompany(first.id, { logo: "data:image/png;base64,AA" }).logo.endsWith("AA"), "png logo accepted");
const token = api.crmDeleteCompany(second.id);
check(api.crmDefaultCompany().id === first.id, "delete promotes oldest live row");
const afterDelete = JSON.parse(backing.get("liczmat-crm-v1")).companies;
check(afterDelete.find((row) => row.id === first.id).updatedAt > afterMove.find((row) => row.id === first.id).updatedAt,
  "deleting default timestamps the promoted row");
check(api.crmRestoreCompany(token).deletedAt === null, "delete restores");
check(api.crmDefaultCompany().id === second.id, "undo restores the deleted default");
const afterRestore = JSON.parse(backing.get("liczmat-crm-v1")).companies;
check(afterRestore.every((row, i) => row.updatedAt > afterDelete[i].updatedAt),
  "restoring default timestamps both changed rows");
const readsBefore = writes;
backing.set("liczmat-crm-v1", JSON.stringify({ companies: [
  { id: "old", name: "Old", isDefault: true, createdAt: 1, deletedAt: null },
  { id: "new", name: "New", isDefault: true, createdAt: 2, deletedAt: null },
], clients: [], jobs: [], quotes: [] }));
check(api.crmCompanies().filter((row) => row.isDefault).length === 1
  && api.crmDefaultCompany().id === "old", "read chooses oldest of multiple defaults");
check(writes === readsBefore, "repairing multiple defaults does not write");
backing.set("liczmat-crm-v1", JSON.stringify({ companies: [
  { id: "old", name: "Old", isDefault: false, createdAt: 1, deletedAt: null },
  { id: "new", name: "New", isDefault: false, createdAt: 2, deletedAt: null },
], clients: [], jobs: [], quotes: [] }));
check(api.crmCompanies().filter((row) => row.isDefault).length === 1
  && api.crmDefaultCompany().id === "old", "read chooses oldest when no default exists");
check(writes === readsBefore, "repairing a missing default does not write");
backing.set("liczmat-crm-v1", JSON.stringify({ clients: [] }));
check(api.crmLoad().companies.length === 0, "legacy store loads");
api.crmImport({ companies: [{ id: "remote", name: "Remote", updatedAt: 2 }] });
check(api.crmLoad().companies[0].id === "remote", "import accepts companies");
check(api.companyLogoValid(""), "empty logo valid");
check(!api.companyLogoValid("data:image/svg+xml;base64,AA"), "stored svg invalid");
check(api.companyLogoFit(1200, 300).w === 600 && api.companyLogoFit(1200, 300).h === 150, "landscape fit");
check(api.companyLogoFit(300, 1200).w === 75 && api.companyLogoFit(300, 1200).h === 300, "portrait fit");
check(api.companyLogoFit(100, 50).w === 100 && api.companyLogoFit(100, 50).h === 50, "small image is not upscaled");

console.log(`company: ${passed}/${passed} checks pass`);
