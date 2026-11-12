/**
 * Purchase confirmation for LiczMat Pro. Pure mapping and mail rendering only.
 *
 * The generated terms module keeps this deployable tree independent from src/. Firebase
 * and network work stay in index.js so this file can be checked with plain Node.
 */

import { MAIL_LANGS, escapeHtml, renderMail } from "./mail-map.mjs";
import { ENTITY } from "./site-entity.mjs";
import { TERMS } from "./terms-data.mjs";

/** The live LiczMat Pro Payment Links are also listed in docs/STRIPE.md. */
export const PURCHASE_LINKS = Object.freeze({
  "plink_1UEQlvGmEsit3k9gVDOuLwjI": "monthly",
  "plink_1UEQlyGmEsit3k9gairU58Jw": "yearly",
});

/** Functions cannot import src/site.mjs. scripts/test-purchase-map.mjs binds this copy to it. */
export const PURCHASE_URLS = Object.freeze({
  pl: Object.freeze({
    terms: "https://liczmat.com/regulamin/",
    cancel: "https://liczmat.com/wypowiedz-umowe/",
    withdraw: "https://liczmat.com/odstap-od-umowy/",
  }),
  uk: Object.freeze({
    terms: "https://liczmat.com/uk/umovy/",
    cancel: "https://liczmat.com/uk/rozirvaty-dohovir/",
    withdraw: "https://liczmat.com/uk/vidmova-vid-dohovoru/",
  }),
  de: Object.freeze({
    terms: "https://liczmat.com/de/agb/",
    cancel: "https://liczmat.com/de/vertraege-kuendigen/",
    withdraw: "https://liczmat.com/de/vertrag-widerrufen/",
  }),
  en: Object.freeze({
    terms: "https://liczmat.com/en/terms/",
    cancel: "https://liczmat.com/en/cancel-contract/",
    withdraw: "https://liczmat.com/en/withdraw-from-contract/",
  }),
  cs: Object.freeze({
    terms: "https://liczmat.com/cs/obchodni-podminky/",
    cancel: "https://liczmat.com/cs/vypovedet-smlouvu/",
    withdraw: "https://liczmat.com/cs/odstoupit-od-smlouvy/",
  }),
  sk: Object.freeze({
    terms: "https://liczmat.com/sk/obchodne-podmienky/",
    cancel: "https://liczmat.com/sk/vypovedat-zmluvu/",
    withdraw: "https://liczmat.com/sk/odstupit-od-zmluvy/",
  }),
  ro: Object.freeze({
    terms: "https://liczmat.com/ro/termeni-si-conditii/",
    cancel: "https://liczmat.com/ro/reziliere-contract/",
    withdraw: "https://liczmat.com/ro/retragere-din-contract/",
  }),
  hr: Object.freeze({
    terms: "https://liczmat.com/hr/uvjeti-koristenja/",
    cancel: "https://liczmat.com/hr/raskid-ugovora/",
    withdraw: "https://liczmat.com/hr/odustanak-od-ugovora/",
  }),
  sr: Object.freeze({
    terms: "https://liczmat.com/sr/uslovi-koriscenja/",
    cancel: "https://liczmat.com/sr/raskid-ugovora/",
    withdraw: "https://liczmat.com/sr/odustanak-od-ugovora/",
  }),
  it: Object.freeze({
    terms: "https://liczmat.com/it/termini-e-condizioni/",
    cancel: "https://liczmat.com/it/disdici-contratto/",
    withdraw: "https://liczmat.com/it/recesso-dal-contratto/",
  }),
  nl: Object.freeze({
    terms: "https://liczmat.com/nl/voorwaarden/",
    cancel: "https://liczmat.com/nl/contract-opzeggen/",
    withdraw: "https://liczmat.com/nl/herroeping/",
  }),
  es: Object.freeze({
    terms: "https://liczmat.com/es/condiciones/",
    cancel: "https://liczmat.com/es/cancelar-contrato/",
    withdraw: "https://liczmat.com/es/desistimiento/",
  }),
  fr: Object.freeze({
    terms: "https://liczmat.com/fr/conditions-generales/",
    cancel: "https://liczmat.com/fr/resilier-contrat/",
    withdraw: "https://liczmat.com/fr/retractation/",
  }),
});

const COPY = Object.freeze({
  pl: {
    subject: "Potwierdzenie zamówienia LiczMat Pro",
    thanks: "Dziękujemy za zamówienie LiczMat Pro.", summary: "Podsumowanie umowy",
    product: "Produkt", plan: "Plan", monthly: "miesięczny", yearly: "roczny",
    price: "Cena", priceVat: "z VAT", date: "Data zawarcia umowy", customer: "Adres klienta",
    renewMonthly: "Plan miesięczny odnawia się automatycznie co miesiąc.",
    renewYearly: "Plan roczny odnawia się automatycznie co rok.",
    cancelHow: "Subskrypcję możesz wypowiedzieć w portalu klienta albo na stronie wypowiedzenia.",
    seller: "Sprzedawca", vat: "Numer VAT", links: "Dokumenty i formularze",
    terms: "Regulamin", cancelPage: "Wypowiedzenie umowy", withdrawPage: "Odstąpienie od umowy",
    binding: "Wiążąca jest niemiecka wersja regulaminu.", legal: "Odstąpienie i zwrot płatności",
    updated: "Stan na",
  },
  uk: {
    subject: "Підтвердження замовлення LiczMat Pro",
    thanks: "Дякуємо за замовлення LiczMat Pro.", summary: "Підсумок договору",
    product: "Продукт", plan: "План", monthly: "щомісячний", yearly: "річний",
    price: "Ціна", priceVat: "з ПДВ", date: "Дата укладення договору", customer: "Адреса клієнта",
    renewMonthly: "Щомісячний план автоматично поновлюється щомісяця.",
    renewYearly: "Річний план автоматично поновлюється щороку.",
    cancelHow: "Підписку можна припинити в кабінеті клієнта або на сторінці розірвання договору.",
    seller: "Продавець", vat: "Номер ПДВ", links: "Документи та форми",
    terms: "Умови", cancelPage: "Розірвання договору", withdrawPage: "Відмова від договору",
    binding: "Обов'язковою є німецька версія умов.", legal: "Відмова від договору та повернення коштів",
    updated: "Станом на",
  },
  de: {
    subject: "Bestellbestätigung für LiczMat Pro",
    thanks: "Vielen Dank für Ihre Bestellung von LiczMat Pro.", summary: "Vertragsübersicht",
    product: "Produkt", plan: "Tarif", monthly: "monatlich", yearly: "jährlich",
    price: "Preis", priceVat: "inkl. MwSt.", date: "Datum des Vertragsschlusses", customer: "Kundenadresse",
    renewMonthly: "Der monatliche Tarif verlängert sich automatisch um jeweils einen Monat.",
    renewYearly: "Der jährliche Tarif verlängert sich automatisch und wird jährlich im Voraus abgerechnet.",
    cancelHow: "Sie können das Abonnement im Kundenportal oder auf der Kündigungsseite kündigen.",
    seller: "Anbieter", vat: "USt-IdNr.", links: "Dokumente und Formulare",
    terms: "Allgemeine Geschäftsbedingungen", cancelPage: "Vertrag kündigen", withdrawPage: "Vertrag widerrufen",
    binding: "Die deutsche Fassung der Allgemeinen Geschäftsbedingungen ist verbindlich.",
    legal: "Widerruf und Rückerstattung", updated: "Stand",
  },
  en: {
    subject: "LiczMat Pro order confirmation",
    thanks: "Thank you for ordering LiczMat Pro.", summary: "Contract summary",
    product: "Product", plan: "Plan", monthly: "monthly", yearly: "yearly",
    price: "Price", priceVat: "incl. VAT", date: "Contract date", customer: "Customer address",
    renewMonthly: "The monthly plan renews automatically every month.",
    renewYearly: "The yearly plan renews automatically every year.",
    cancelHow: "You can cancel the subscription in the customer portal or on the cancellation page.",
    seller: "Seller", vat: "VAT ID", links: "Documents and forms",
    terms: "Terms", cancelPage: "Cancel the contract", withdrawPage: "Withdraw from the contract",
    binding: "The German version of the Terms is binding.", legal: "Withdrawal and refund",
    updated: "Updated",
  },
  cs: {
    subject: "Potvrzení objednávky LiczMat Pro",
    thanks: "Děkujeme za objednávku LiczMat Pro.", summary: "Shrnutí smlouvy",
    product: "Produkt", plan: "Plán", monthly: "měsíční", yearly: "roční",
    price: "Cena", priceVat: "vč. DPH", date: "Datum uzavření smlouvy", customer: "Adresa zákazníka",
    renewMonthly: "Měsíční plán se automaticky obnovuje každý měsíc.",
    renewYearly: "Roční plán se automaticky obnovuje každý rok.",
    cancelHow: "Předplatné můžete vypovědět v zákaznickém portálu nebo na stránce pro výpověď.",
    seller: "Prodávající", vat: "DIČ", links: "Dokumenty a formuláře",
    terms: "Obchodní podmínky", cancelPage: "Výpověď smlouvy", withdrawPage: "Odstoupení od smlouvy",
    binding: "Závazné je německé znění obchodních podmínek.", legal: "Odstoupení a vrácení peněz",
    updated: "Aktualizováno",
  },
  sk: {
    subject: "Potvrdenie objednávky LiczMat Pro",
    thanks: "Ďakujeme za objednávku LiczMat Pro.", summary: "Zhrnutie zmluvy",
    product: "Produkt", plan: "Plán", monthly: "mesačný", yearly: "ročný",
    price: "Cena", priceVat: "vrátane DPH", date: "Dátum uzavretia zmluvy", customer: "Adresa zákazníka",
    renewMonthly: "Mesačný plán sa automaticky obnovuje každý mesiac.",
    renewYearly: "Ročný plán sa automaticky obnovuje každý rok.",
    cancelHow: "Predplatné môžete vypovedať v zákazníckom portáli alebo na stránke výpovede.",
    seller: "Predávajúci", vat: "IČ DPH", links: "Dokumenty a formuláre",
    terms: "Obchodné podmienky", cancelPage: "Výpoveď zmluvy", withdrawPage: "Odstúpenie od zmluvy",
    binding: "Záväzné je nemecké znenie obchodných podmienok.", legal: "Odstúpenie a vrátenie peňazí",
    updated: "Aktualizované",
  },
  ro: {
    subject: "Confirmarea comenzii LiczMat Pro",
    thanks: "Vă mulțumim pentru comanda LiczMat Pro.", summary: "Rezumatul contractului",
    product: "Produs", plan: "Plan", monthly: "lunar", yearly: "anual",
    price: "Preț", priceVat: "TVA inclus", date: "Data încheierii contractului", customer: "Adresa clientului",
    renewMonthly: "Planul lunar se reînnoiește automat în fiecare lună.",
    renewYearly: "Planul anual se reînnoiește automat în fiecare an.",
    cancelHow: "Puteți rezilia abonamentul în portalul pentru clienți sau pe pagina de reziliere.",
    seller: "Vânzător", vat: "Cod TVA", links: "Documente și formulare",
    terms: "Termeni și condiții", cancelPage: "Rezilierea contractului", withdrawPage: "Retragerea din contract",
    binding: "Versiunea germană a termenilor este obligatorie.", legal: "Retragere și rambursare",
    updated: "Actualizat",
  },
  hr: {
    subject: "Potvrda narudžbe LiczMat Pro",
    thanks: "Hvala na narudžbi LiczMat Pro.", summary: "Sažetak ugovora",
    product: "Proizvod", plan: "Plan", monthly: "mjesečni", yearly: "godišnji",
    price: "Cijena", priceVat: "s PDV-om", date: "Datum sklapanja ugovora", customer: "Adresa kupca",
    renewMonthly: "Mjesečni plan automatski se obnavlja svaki mjesec.",
    renewYearly: "Godišnji plan automatski se obnavlja svake godine.",
    cancelHow: "Pretplatu možete raskinuti u korisničkom portalu ili na stranici za raskid.",
    seller: "Prodavatelj", vat: "PDV ID", links: "Dokumenti i obrasci",
    terms: "Uvjeti korištenja", cancelPage: "Raskid ugovora", withdrawPage: "Odustanak od ugovora",
    binding: "Obvezujuća je njemačka verzija uvjeta.", legal: "Odustanak i povrat novca",
    updated: "Ažurirano",
  },
  sr: {
    subject: "Potvrda porudžbine LiczMat Pro",
    thanks: "Hvala na porudžbini LiczMat Pro.", summary: "Sažetak ugovora",
    product: "Proizvod", plan: "Plan", monthly: "mesečni", yearly: "godišnji",
    price: "Cena", priceVat: "sa PDV-om", date: "Datum zaključenja ugovora", customer: "Adresa kupca",
    renewMonthly: "Mesečni plan se automatski obnavlja svakog meseca.",
    renewYearly: "Godišnji plan se automatski obnavlja svake godine.",
    cancelHow: "Pretplatu možete otkazati u korisničkom portalu ili na stranici za otkazivanje.",
    seller: "Prodavac", vat: "PDV ID", links: "Dokumenti i obrasci",
    terms: "Uslovi korišćenja", cancelPage: "Otkazivanje ugovora", withdrawPage: "Odustanak od ugovora",
    binding: "Obavezujuća je nemačka verzija uslova.", legal: "Odustanak i povrat novca",
    updated: "Ažurirano",
  },
  it: {
    subject: "Conferma dell'ordine LiczMat Pro",
    thanks: "Grazie per aver ordinato LiczMat Pro.", summary: "Riepilogo del contratto",
    product: "Prodotto", plan: "Piano", monthly: "mensile", yearly: "annuale",
    price: "Prezzo", priceVat: "IVA inclusa", date: "Data di conclusione del contratto", customer: "Indirizzo del cliente",
    renewMonthly: "Il piano mensile si rinnova automaticamente ogni mese.",
    renewYearly: "Il piano annuale si rinnova automaticamente ogni anno.",
    cancelHow: "Puoi disdire l'abbonamento nel portale clienti o nella pagina di disdetta.",
    seller: "Venditore", vat: "Partita IVA", links: "Documenti e moduli",
    terms: "Termini e condizioni", cancelPage: "Disdetta del contratto", withdrawPage: "Recesso dal contratto",
    binding: "La versione tedesca dei termini è vincolante.", legal: "Recesso e rimborso",
    updated: "Aggiornato",
  },
  nl: {
    subject: "Bevestiging van je LiczMat Pro-bestelling",
    thanks: "Bedankt voor je bestelling van LiczMat Pro.", summary: "Samenvatting van de overeenkomst",
    product: "Product", plan: "Abonnement", monthly: "maandelijks", yearly: "jaarlijks",
    price: "Prijs", priceVat: "incl. btw", date: "Datum van de overeenkomst", customer: "Klantadres",
    renewMonthly: "Het maandabonnement wordt elke maand automatisch verlengd.",
    renewYearly: "Het jaarabonnement wordt elk jaar automatisch verlengd.",
    cancelHow: "Je kunt het abonnement opzeggen in het klantenportaal of op de opzegpagina.",
    seller: "Verkoper", vat: "Btw-id", links: "Documenten en formulieren",
    terms: "Voorwaarden", cancelPage: "Contract opzeggen", withdrawPage: "Overeenkomst herroepen",
    binding: "De Duitse versie van de voorwaarden is bindend.", legal: "Herroeping en terugbetaling",
    updated: "Bijgewerkt",
  },
  es: {
    subject: "Confirmación del pedido de LiczMat Pro",
    thanks: "Gracias por tu pedido de LiczMat Pro.", summary: "Resumen del contrato",
    product: "Producto", plan: "Plan", monthly: "mensual", yearly: "anual",
    price: "Precio", priceVat: "IVA incluido", date: "Fecha de celebración del contrato", customer: "Dirección del cliente",
    renewMonthly: "El plan mensual se renueva automáticamente cada mes.",
    renewYearly: "El plan anual se renueva automáticamente cada año.",
    cancelHow: "Puedes cancelar la suscripción en el portal del cliente o en la página de cancelación.",
    seller: "Vendedor", vat: "NIF-IVA", links: "Documentos y formularios",
    terms: "Condiciones", cancelPage: "Cancelar el contrato", withdrawPage: "Desistir del contrato",
    binding: "La versión alemana de las condiciones es vinculante.", legal: "Desistimiento y reembolso",
    updated: "Actualizado",
  },
  fr: {
    subject: "Confirmation de commande LiczMat Pro",
    thanks: "Merci pour votre commande LiczMat Pro.", summary: "Résumé du contrat",
    product: "Produit", plan: "Formule", monthly: "mensuel", yearly: "annuel",
    price: "Prix", priceVat: "TTC", date: "Date de conclusion du contrat", customer: "Adresse du client",
    renewMonthly: "La formule mensuelle est renouvelée automatiquement chaque mois.",
    renewYearly: "La formule annuelle est renouvelée automatiquement chaque année.",
    cancelHow: "Vous pouvez résilier l'abonnement dans le portail client ou sur la page de résiliation.",
    seller: "Vendeur", vat: "Numéro de TVA", links: "Documents et formulaires",
    terms: "Conditions générales", cancelPage: "Résilier le contrat", withdrawPage: "Se rétracter du contrat",
    binding: "La version allemande des conditions générales est contraignante.",
    legal: "Rétractation et remboursement", updated: "Mis à jour",
  },
});

const idOf = (value) => {
  if (typeof value === "string" && value) return value;
  return value && typeof value === "object" && typeof value.id === "string" && value.id
    ? value.id : null;
};

const emailOf = (session) => {
  const details = session && session.customer_details;
  const primary = details && typeof details.email === "string" ? details.email.trim() : "";
  const fallback = session && typeof session.customer_email === "string"
    ? session.customer_email.trim() : "";
  return primary || fallback || null;
};

/** Decide whether one raw Checkout Session needs a purchase confirmation. */
export function purchaseDecision(session, { liveMode } = {}) {
  if (!session || session.object !== "checkout.session"
      || typeof session.id !== "string" || !session.id) {
    return { send: false, reason: "session" };
  }
  if (session.livemode !== liveMode) return { send: false, reason: "livemode" };

  const plan = PURCHASE_LINKS[idOf(session.payment_link)];
  if (!plan) return { send: false, reason: "payment-link" };
  if (Object.prototype.hasOwnProperty.call(session, "status") && session.status !== "complete") {
    return { send: false, reason: "status" };
  }

  const email = emailOf(session);
  if (!email) return { send: false, reason: "email" };

  const amount = Number(session.amount_total);
  const created = Number(session.created);
  return {
    send: true,
    plan,
    sessionId: session.id,
    email,
    amountMinor: Number.isFinite(amount) ? amount : null,
    currency: typeof session.currency === "string" ? session.currency : "",
    createdMs: Number.isFinite(created) ? created * 1000 : null,
  };
}

const languageFromProfile = (profile) => {
  if (!profile || typeof profile.lang !== "string") return null;
  const lang = profile.lang.substring(0, 2).toLowerCase();
  return MAIL_LANGS.includes(lang) ? lang : null;
};

/** Prefer the account language, then Stripe's exact two-letter locale, then Polish. */
export function purchaseLang(profile, session) {
  const profileLang = languageFromProfile(profile);
  if (profileLang) return profileLang;
  const locale = session && typeof session.locale === "string" ? session.locale.toLowerCase() : "";
  return MAIL_LANGS.includes(locale) ? locale : "pl";
}

function formatMoney(amountMinor, currency, lang) {
  const code = String(currency || "").toUpperCase();
  const formatter = new Intl.NumberFormat(lang, { style: "currency", currency: code });
  const digits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(Number(amountMinor) / (10 ** digits));
}

const formatDate = (createdMs, lang) => new Intl.DateTimeFormat(lang, {
  dateStyle: "long", timeZone: "Europe/Berlin",
}).format(new Date(createdMs));

const absoluteLinks = (html) => String(html).replace(/href="\//g, 'href="https://liczmat.com/');

const decodeHtml = (value) => String(value)
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#([0-9]+);/g, (_, number) => String.fromCodePoint(Number(number)));

const inlineText = (html) => decodeHtml(String(html).replace(/<[^>]+>/g, ""))
  .replace(/\s+/g, " ").trim();

/** Terms are trusted generated HTML. This conversion preserves headings, paragraphs,
 * links and list items while using a bullet instead of a dash for every list item. */
function htmlToText(html) {
  let text = absoluteLinks(html);
  text = text.replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, label) => {
      const text = inlineText(label);
      const target = decodeHtml(href);
      /* tel: and mailto: links whose label already is the number or the address need no copy. */
      const bare = target.replace(/^(tel|mailto):/i, "");
      return /^(tel|mailto):/i.test(target) && bare === text ? text : `${text} (${target})`;
    });
  text = text.replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi,
    (_, heading) => `\n${inlineText(heading)}\n`);
  text = text.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi,
    (_, item) => `\n• ${inlineText(item)}`);
  text = text.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi,
    (_, paragraph) => `\n${inlineText(paragraph)}\n`);
  text = text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  return decodeHtml(text).split("\n").map((line) => line.trim())
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function termsExcerpt(terms) {
  const wanted = new Set(["widerruf", "formular", "geld-zurueck"]);
  return terms.sections.filter((section) => wanted.has(section.id));
}

const sectionText = (section) => `${section.h}\n${htmlToText(section.html)}`;

const slug = (value, fallback) => {
  const answer = String(value).normalize("NFKD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return answer || fallback;
};

const escapeText = (value) => String(value ?? "").replace(/&/g, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;");

function termsAttachment(terms) {
  const code = MAIL_LANGS.includes(terms.lang) ? terms.lang : "de";
  const c = COPY[code];
  const sections = terms.sections.map((section) => `<section id="${escapeHtml(section.id)}">
<h2>${escapeText(section.h)}</h2>
${absoluteLinks(section.html)}
</section>`).join("\n");
  const content = `<!DOCTYPE html>
<html lang="${code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(terms.title)}</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.55;color:#111}h1,h2,h3{line-height:1.25}section{margin-top:32px}a{color:#315a00}</style></head><body>
<h1>${escapeText(terms.title)}</h1>
<p>${escapeHtml(c.updated)}: ${escapeHtml(terms.updated)}</p>
<p>${escapeHtml(c.binding)}</p>
${sections}
</body></html>`;
  return {
    filename: `${slug(terms.title, `${code}-terms`)}.html`,
    content,
    contentType: "text/html; charset=utf-8",
  };
}

/** Build the localized durable-medium confirmation and its full terms attachments. */
export function purchaseMail({ lang, plan, amountMinor, currency, createdMs, email }) {
  const code = MAIL_LANGS.includes(lang) ? lang : "pl";
  const c = COPY[code];
  const terms = TERMS[code];
  const urls = PURCHASE_URLS[code];
  const planWord = plan === "yearly" ? c.yearly : c.monthly;
  const renewal = plan === "yearly" ? c.renewYearly : c.renewMonthly;
  const price = formatMoney(amountMinor, currency, code);
  const concluded = formatDate(createdMs, code);
  const extracts = termsExcerpt(terms);

  const bodyText = `${c.thanks}

${c.summary}
${c.product}: LiczMat Pro
${c.plan}: ${planWord}
${c.price}: ${price} (${c.priceVat})
${c.date}: ${concluded}
${c.customer}: ${email}

${renewal}
${c.cancelHow}
https://liczmat.com/app/
${urls.cancel}

${c.seller}:
${ENTITY.name}
${ENTITY.address}
${ENTITY.email}
${c.vat}: ${ENTITY.taxId}

${c.links}
${c.terms}: ${urls.terms}
${c.cancelPage}: ${urls.cancel}
${c.withdrawPage}: ${urls.withdraw}

${c.binding}

${c.legal}

${extracts.map(sectionText).join("\n\n")}`;

  const linkHtml = [
    [c.terms, urls.terms], [c.cancelPage, urls.cancel], [c.withdrawPage, urls.withdraw],
  ].map(([label, url]) => `<li><a href="${escapeHtml(url)}" style="color:#0056b3;text-decoration:underline;">${escapeHtml(label)}</a></li>`).join("");
  const extractsHtml = extracts.map((section) => `<section style="margin-top:24px;">
<h2 style="font-size:20px;margin:0 0 12px 0;">${escapeText(section.h)}</h2>
${absoluteLinks(section.html)}
</section>`).join("\n");
  const bodyHtml = `<p style="font-size:16px;margin:0 0 20px 0;">${escapeHtml(c.thanks)}</p>
<h2 style="font-size:20px;margin:0 0 12px 0;">${escapeHtml(c.summary)}</h2>
<p style="font-size:16px;margin:0 0 20px 0;"><strong>${escapeHtml(c.product)}:</strong> LiczMat Pro<br><strong>${escapeHtml(c.plan)}:</strong> ${escapeHtml(planWord)}<br><strong>${escapeHtml(c.price)}:</strong> ${escapeHtml(price)} (${escapeHtml(c.priceVat)})<br><strong>${escapeHtml(c.date)}:</strong> ${escapeHtml(concluded)}<br><strong>${escapeHtml(c.customer)}:</strong> ${escapeHtml(email)}</p>
<p style="font-size:16px;margin:0 0 20px 0;">${escapeHtml(renewal)} ${escapeHtml(c.cancelHow)}<br><a href="https://liczmat.com/app/" style="color:#0056b3;text-decoration:underline;">https://liczmat.com/app/</a><br><a href="${escapeHtml(urls.cancel)}" style="color:#0056b3;text-decoration:underline;">${escapeHtml(urls.cancel)}</a></p>
<p style="font-size:16px;margin:0 0 20px 0;"><strong>${escapeHtml(c.seller)}:</strong><br>${escapeHtml(ENTITY.name)}<br>${escapeHtml(ENTITY.address)}<br><a href="mailto:${escapeHtml(ENTITY.email)}" style="color:#0056b3;text-decoration:underline;">${escapeHtml(ENTITY.email)}</a><br>${escapeHtml(c.vat)}: ${escapeHtml(ENTITY.taxId)}</p>
<h2 style="font-size:20px;margin:0 0 12px 0;">${escapeHtml(c.links)}</h2>
<ul style="font-size:16px;margin:0 0 20px 0;padding-left:20px;">${linkHtml}</ul>
<p style="font-size:16px;margin:0 0 24px 0;">${escapeHtml(c.binding)}</p>
<h2 style="font-size:20px;margin:0 0 12px 0;">${escapeHtml(c.legal)}</h2>
${extractsHtml}`;

  const rendered = renderMail({ lang: code, subject: c.subject, bodyText, bodyHtml });
  const attachments = [termsAttachment(terms)];
  if (code !== "de") attachments.push(termsAttachment(TERMS.de));
  return { ...rendered, attachments };
}
