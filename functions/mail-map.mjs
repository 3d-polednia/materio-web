/**
 * Wspolny szablon wiadomosci LiczMat. Plik jest czysty: bez Firebase i sieci.
 */

export const MAIL_LANGS = Object.freeze([
  "pl", "uk", "de", "en", "cs", "sk", "ro", "hr", "sr", "it", "nl", "es", "fr"
]);

export const MAIL_FROM = "LiczMat <contact@liczmat.com>";
export const MAIL_REPLY_TO = "contact@liczmat.com";
export const MAIL_LOGO = "https://liczmat.com/assets/email/liczmat-logo.png";

export const URL_CONTACT = Object.freeze({
  pl: "/kontakt/", uk: "/uk/kontakty/", de: "/de/impressum/", en: "/en/contact/",
  cs: "/cs/kontakt/", sk: "/sk/kontakt/", ro: "/ro/contact/", hr: "/hr/kontakt/",
  sr: "/sr/kontakt/", it: "/it/contatti/", nl: "/nl/contact/", es: "/es/contacto/",
  fr: "/fr/contact/"
});

export const URL_PRIVACY = Object.freeze({
  pl: "/polityka-prywatnosci/", uk: "/uk/polityka-konfidentsiinosti/",
  de: "/de/datenschutz/", en: "/en/privacy-policy/", cs: "/cs/ochrana-osobnich-udaju/",
  sk: "/sk/ochrana-osobnych-udajov/", ro: "/ro/politica-de-confidentialitate/",
  hr: "/hr/pravila-privatnosti/", sr: "/sr/politika-privatnosti/",
  it: "/it/informativa-privacy/", nl: "/nl/privacybeleid/",
  es: "/es/politica-de-privacidad/", fr: "/fr/politique-de-confidentialite/"
});

const SIGNATURE = Object.freeze({
  pl: ["Zespół LiczMat", "Kalkulatory materiałów i organizacja pracy dla firm", "Polityka prywatności"],
  uk: ["Команда LiczMat", "Калькулятори матеріалів і організація роботи для фірм", "Політика конфіденційності"],
  de: ["Das LiczMat-Team", "Materialrechner und Arbeitsorganisation für Betriebe", "Datenschutzerklärung"],
  en: ["The LiczMat team", "Material calculators and job management for businesses", "Privacy policy"],
  cs: ["Tým LiczMat", "Kalkulačky materiálu a organizace práce pro firmy", "Zásady ochrany osobních údajů"],
  sk: ["Tím LiczMat", "Kalkulačky materiálu a organizácia práce pre firmy", "Zásady ochrany osobných údajov"],
  ro: ["Echipa LiczMat", "Calculatoare de materiale și organizarea lucrărilor pentru firme", "Politica de confidențialitate"],
  hr: ["Tim LiczMat", "Kalkulatori materijala i organizacija posla za tvrtke", "Pravila privatnosti"],
  sr: ["Tim LiczMat", "Kalkulatori materijala i organizacija posla za firme", "Politika privatnosti"],
  it: ["Il team di LiczMat", "Calcolatori di materiali e organizzazione del lavoro per imprese", "Informativa sulla privacy"],
  nl: ["Het LiczMat-team", "Materiaalcalculators en werkplanning voor bedrijven", "Privacybeleid"],
  es: ["El equipo de LiczMat", "Calculadoras de materiales y organización del trabajo para empresas", "Política de privacidad"],
  fr: ["L'équipe LiczMat", "Calculateurs de matériaux et organisation du travail pour les entreprises", "Politique de confidentialité"]
});

export function mailLang(lang) {
  if (typeof lang !== "string") return "pl";
  const code = lang.slice(0, 2).toLowerCase();
  return MAIL_LANGS.includes(code) ? code : "pl";
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

const absolute = (path) => `https://liczmat.com${path}`;

/** Przycisk w tabeli dziala rowniez w Outlooku. Surowy link zostaje pod nim. */
export function mailAction(label, link) {
  const safeLabel = escapeHtml(label);
  const safeLink = escapeHtml(link);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 0 12px 0;"><tr><td bgcolor="#91d206" style="background-color: #91d206; padding: 12px 20px; border-radius: 8px;"><a href="${safeLink}" style="display: inline-block; color: #151B1E; font-weight: 700; text-decoration: underline;">${safeLabel}</a></td></tr></table><p style="font-size: 12px; margin: 0 0 24px 0; word-break: break-all;"><a href="${safeLink}" style="color: #0056b3; text-decoration: underline;">${safeLink}</a></p>`;
}

export function renderMail({ lang, subject, bodyHtml, bodyText }) {
  const code = mailLang(lang);
  const [team, role, privacy] = SIGNATURE[code];
  const contactUrl = absolute(URL_CONTACT[code]);
  const privacyUrl = absolute(URL_PRIVACY[code]);
  const text = `${bodyText}\n\n--\n${team}\nLiczMat · ${role}\nhttps://liczmat.com · ${MAIL_REPLY_TO}\n\nImpressum: ${contactUrl}\n${privacy}: ${privacyUrl}\n`;
  const html = `<!DOCTYPE html>
<html lang="${code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(subject)}</title></head>
<body style="margin: 0; padding: 24px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111111; line-height: 1.5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 560px;"><tr><td style="text-align: left;">${bodyHtml}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 0 24px 0;"><tr><td style="padding: 0 16px 0 0; vertical-align: middle;"><a href="https://liczmat.com/" style="text-decoration: none;"><img src="${MAIL_LOGO}" width="162" height="54" alt="LiczMat" style="display: block; border: 0; outline: none;"></a></td><td style="padding: 0 0 0 16px; vertical-align: middle; border-left: 1px solid #dddddd; font-size: 14px; line-height: 1.5;"><strong style="font-size: 15px;">${team}</strong><br><span style="color: #555555;">LiczMat · ${role}</span><br><a href="https://liczmat.com/" style="color: #3d6b00; text-decoration: underline;">liczmat.com</a><span style="color: #999999;">&nbsp;·&nbsp;</span><a href="mailto:${MAIL_REPLY_TO}" style="color: #3d6b00; text-decoration: underline;">${MAIL_REPLY_TO}</a></td></tr></table>
<div style="font-size: 12px; color: #555555; border-top: 1px solid #eeeeee; padding-top: 16px;"><a href="${contactUrl}" style="color: #555555; text-decoration: underline;">Impressum</a><span>&nbsp;·&nbsp;</span><a href="${privacyUrl}" style="color: #555555; text-decoration: underline;">${privacy}</a></div>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export function signatureText(lang) {
  const code = mailLang(lang);
  const [team, role, privacy] = SIGNATURE[code];
  return `${team}\nLiczMat · ${role}\nhttps://liczmat.com · ${MAIL_REPLY_TO}\n\nImpressum: ${absolute(URL_CONTACT[code])}\n${privacy}: ${absolute(URL_PRIVACY[code])}`;
}
