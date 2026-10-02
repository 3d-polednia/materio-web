import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/postal.js", import.meta.url), "utf8");
const context = { globalThis: {}, Intl, Map, String };
vm.runInNewContext(source, context);
const postal = context.globalThis.LMPostal;

const samples = {
  PL: ["44-100", "4410"], DE: ["10115", "1011"], FR: ["75001", "7500"],
  IT: ["00118", "0011"], ES: ["28001", "2800"], HR: ["10000", "1000"],
  RS: ["11000", "1100"], UA: ["01001", "0100"], AT: ["1010", "101"],
  CH: ["8001", "800"], BE: ["1000", "100"], LU: ["1111", "111"],
  CZ: ["110 00", "1100"], SK: ["811 01", "8110"], RO: ["010011", "01001"],
  NL: ["1011 AB", "1011A"],
};

const failures = [];
let passed = 0;
const check = (condition, message) => {
  if (condition) passed += 1;
  else failures.push(`  FAIL ${message}`);
};

for (const [country, [valid, invalid]] of Object.entries(samples)) {
  check(postal.validate(country, valid), `${country} accepts ${valid}`);
  check(!postal.validate(country, invalid), `${country} rejects ${invalid}`);
}
check(postal.format("PL", "44100") === "44-100", "PL formats 44100");
check(postal.format("NL", "1011ab") === "1011 AB", "NL formats 1011ab");
check(postal.format("CZ", "11000") === "110 00", "CZ formats 11000");

if (failures.length) {
  console.error(`test-postal: ${failures.length} failure(s)\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`test-postal: ${passed} assertions passed.`);
