/* LiczMat website - local tax-number names and examples by company country. */

(function (root) {
  "use strict";

  const TAX_IDS = {
    PL: { label: "NIP", example: "123-456-78-90" },
    DE: { label: "USt-IdNr.", example: "DE123456789" },
    AT: { label: "UID", example: "ATU12345678" },
    CZ: { label: "DIČ", example: "CZ12345678" },
    SK: { label: "IČ DPH", example: "SK1234567890" },
    UA: { label: "ЄДРПОУ / ІПН", example: "12345678" },
    RO: { label: "CUI", example: "RO1234567" },
    HR: { label: "OIB", example: "12345678901" },
    RS: { label: "PIB", example: "123456789" },
    IT: { label: "Partita IVA", example: "IT12345678901" },
    NL: { label: "btw-id", example: "NL123456789B01" },
    ES: { label: "NIF", example: "ESB12345678" },
    FR: { label: "N° TVA", example: "FR12345678901" },
  };

  function taxId(country, genericLabel) {
    const local = TAX_IDS[String(country || "").toUpperCase()];
    return local || { label: String(genericLabel || ""), example: "" };
  }

  root.LMTaxId = { TAX_IDS, taxId };
}(typeof window === "undefined" ? globalThis : window));
