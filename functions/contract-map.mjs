/**
 * Contract cancellation and withdrawal notices: validation and plain-text mail copy.
 *
 * This module has no Firebase or network imports so the boundary cases stay testable in
 * plain Node. The deployed handler in index.js only stores the result and sends the mail.
 */

import { ENTITY } from "./site-entity.mjs";

export const CONTRACT_LANGS = Object.freeze([
  "pl", "uk", "de", "en", "cs", "sk", "ro", "hr", "sr", "it", "nl", "es", "fr",
]);

const DAY = 24 * 60 * 60 * 1000;
const LOCALE = Object.freeze({
  pl: "pl-PL", uk: "uk-UA", de: "de-DE", en: "en-GB", cs: "cs-CZ", sk: "sk-SK",
  ro: "ro-RO", hr: "hr-HR", sr: "sr-Latn-RS", it: "it-IT", nl: "nl-NL",
  es: "es-ES", fr: "fr-FR",
});

const COPY = Object.freeze({
  pl: {
    cancelSubject: "Potwierdzenie otrzymania wypowiedzenia", withdrawSubject: "Potwierdzenie otrzymania odstąpienia od umowy",
    cancelIntro: "Potwierdzamy otrzymanie wypowiedzenia umowy.", withdrawIntro: "Potwierdzamy otrzymanie odstąpienia od umowy.",
    kind: "Rodzaj", cancel: "wypowiedzenie", withdraw: "odstąpienie od umowy", name: "Imię i nazwisko", email: "E-mail", contract: "Umowa",
    mode: "Rodzaj wypowiedzenia", ordinary: "zwykłe wypowiedzenie", extraordinary: "wypowiedzenie nadzwyczajne", reason: "Powód wypowiedzenia",
    effective: "Termin", asap: "w najbliższym możliwym terminie", orderDate: "Data zamówienia", received: "Otrzymano", end: "Zakończenie umowy",
    refund: "Pełna kwota zostanie zwrócona w ciągu 14 dni.",
  },
  uk: {
    cancelSubject: "Підтвердження отримання розірвання договору", withdrawSubject: "Підтвердження отримання відмови від договору",
    cancelIntro: "Підтверджуємо отримання заяви про розірвання договору.", withdrawIntro: "Підтверджуємо отримання заяви про відмову від договору.",
    kind: "Вид", cancel: "розірвання договору", withdraw: "відмова від договору", name: "Ім'я та прізвище", email: "Електронна пошта", contract: "Договір",
    mode: "Вид розірвання", ordinary: "звичайне розірвання", extraordinary: "дострокове розірвання з поважної причини", reason: "Причина розірвання",
    effective: "Дата припинення", asap: "у найближчий можливий строк", orderDate: "Дата замовлення", received: "Отримано", end: "Дата завершення договору",
    refund: "Повну суму буде повернено протягом 14 днів.",
  },
  de: {
    cancelSubject: "Bestätigung des Eingangs Ihrer Kündigung", withdrawSubject: "Bestätigung des Eingangs Ihres Widerrufs",
    cancelIntro: "Wir bestätigen den Eingang Ihrer Kündigung.", withdrawIntro: "Wir bestätigen den Eingang Ihres Widerrufs.",
    kind: "Art", cancel: "Kündigung", withdraw: "Widerruf", name: "Name", email: "E-Mail", contract: "Vertrag",
    mode: "Art der Kündigung", ordinary: "ordentliche Kündigung", extraordinary: "außerordentliche Kündigung", reason: "Kündigungsgrund",
    effective: "Zeitpunkt", asap: "zum nächstmöglichen Zeitpunkt", orderDate: "Bestelldatum", received: "Eingegangen", end: "Vertragsende",
    refund: "Der vollständige Betrag wird innerhalb von 14 Tagen zurückgezahlt.",
  },
  en: {
    cancelSubject: "Confirmation of receipt of your cancellation", withdrawSubject: "Confirmation of receipt of your withdrawal",
    cancelIntro: "We confirm receipt of your contract cancellation.", withdrawIntro: "We confirm receipt of your withdrawal from the contract.",
    kind: "Kind", cancel: "contract cancellation", withdraw: "withdrawal", name: "Name", email: "Email", contract: "Contract",
    mode: "Cancellation type", ordinary: "ordinary cancellation", extraordinary: "extraordinary cancellation", reason: "Reason for cancellation",
    effective: "Effective date", asap: "at the earliest possible date", orderDate: "Order date", received: "Received", end: "Contract end",
    refund: "The full amount will be refunded within 14 days.",
  },
  cs: {
    cancelSubject: "Potvrzení přijetí výpovědi", withdrawSubject: "Potvrzení přijetí odstoupení od smlouvy",
    cancelIntro: "Potvrzujeme přijetí výpovědi smlouvy.", withdrawIntro: "Potvrzujeme přijetí odstoupení od smlouvy.",
    kind: "Druh", cancel: "výpověď", withdraw: "odstoupení od smlouvy", name: "Jméno", email: "E-mail", contract: "Smlouva",
    mode: "Druh výpovědi", ordinary: "řádná výpověď", extraordinary: "mimořádná výpověď", reason: "Důvod výpovědi",
    effective: "Termín", asap: "k nejbližšímu možnému termínu", orderDate: "Datum objednávky", received: "Přijato", end: "Konec smlouvy",
    refund: "Celá částka bude vrácena do 14 dnů.",
  },
  sk: {
    cancelSubject: "Potvrdenie prijatia výpovede", withdrawSubject: "Potvrdenie prijatia odstúpenia od zmluvy",
    cancelIntro: "Potvrdzujeme prijatie výpovede zmluvy.", withdrawIntro: "Potvrdzujeme prijatie odstúpenia od zmluvy.",
    kind: "Druh", cancel: "výpoveď", withdraw: "odstúpenie od zmluvy", name: "Meno", email: "E-mail", contract: "Zmluva",
    mode: "Druh výpovede", ordinary: "riadna výpoveď", extraordinary: "mimoriadna výpoveď", reason: "Dôvod výpovede",
    effective: "Termín", asap: "k najbližšiemu možnému termínu", orderDate: "Dátum objednávky", received: "Prijaté", end: "Koniec zmluvy",
    refund: "Celá suma bude vrátená do 14 dní.",
  },
  ro: {
    cancelSubject: "Confirmarea primirii rezilierii", withdrawSubject: "Confirmarea primirii retragerii din contract",
    cancelIntro: "Confirmăm primirea cererii de reziliere a contractului.", withdrawIntro: "Confirmăm primirea retragerii din contract.",
    kind: "Tip", cancel: "reziliere", withdraw: "retragere din contract", name: "Nume", email: "E-mail", contract: "Contract",
    mode: "Tipul rezilierii", ordinary: "reziliere obișnuită", extraordinary: "reziliere extraordinară", reason: "Motivul rezilierii",
    effective: "Data încetării", asap: "la prima dată posibilă", orderDate: "Data comenzii", received: "Primit", end: "Încetarea contractului",
    refund: "Suma integrală va fi rambursată în termen de 14 zile.",
  },
  hr: {
    cancelSubject: "Potvrda primitka raskida ugovora", withdrawSubject: "Potvrda primitka odustanka od ugovora",
    cancelIntro: "Potvrđujemo primitak raskida ugovora.", withdrawIntro: "Potvrđujemo primitak odustanka od ugovora.",
    kind: "Vrsta", cancel: "raskid ugovora", withdraw: "odustanak od ugovora", name: "Ime", email: "E-mail", contract: "Ugovor",
    mode: "Vrsta raskida", ordinary: "redovni raskid", extraordinary: "izvanredni raskid", reason: "Razlog raskida",
    effective: "Datum prestanka", asap: "u najranijem mogućem roku", orderDate: "Datum narudžbe", received: "Primljeno", end: "Prestanak ugovora",
    refund: "Puni iznos bit će vraćen u roku od 14 dana.",
  },
  sr: {
    cancelSubject: "Potvrda prijema raskida ugovora", withdrawSubject: "Potvrda prijema odustanka od ugovora",
    cancelIntro: "Potvrđujemo prijem raskida ugovora.", withdrawIntro: "Potvrđujemo prijem odustanka od ugovora.",
    kind: "Vrsta", cancel: "raskid ugovora", withdraw: "odustanak od ugovora", name: "Ime", email: "E-pošta", contract: "Ugovor",
    mode: "Vrsta raskida", ordinary: "redovni raskid", extraordinary: "vanredni raskid", reason: "Razlog raskida",
    effective: "Datum prestanka", asap: "u najranijem mogućem roku", orderDate: "Datum porudžbine", received: "Primljeno", end: "Prestanak ugovora",
    refund: "Pun iznos će biti vraćen u roku od 14 dana.",
  },
  it: {
    cancelSubject: "Conferma di ricezione della disdetta", withdrawSubject: "Conferma di ricezione del recesso",
    cancelIntro: "Confermiamo di aver ricevuto la disdetta del contratto.", withdrawIntro: "Confermiamo di aver ricevuto il recesso dal contratto.",
    kind: "Tipo", cancel: "disdetta", withdraw: "recesso", name: "Nome", email: "E-mail", contract: "Contratto",
    mode: "Tipo di disdetta", ordinary: "disdetta ordinaria", extraordinary: "disdetta straordinaria", reason: "Motivo della disdetta",
    effective: "Data di cessazione", asap: "alla prima data possibile", orderDate: "Data dell'ordine", received: "Ricevuto", end: "Fine del contratto",
    refund: "L'intero importo sarà rimborsato entro 14 giorni.",
  },
  nl: {
    cancelSubject: "Bevestiging van ontvangst van je opzegging", withdrawSubject: "Bevestiging van ontvangst van je herroeping",
    cancelIntro: "We bevestigen de ontvangst van je opzegging.", withdrawIntro: "We bevestigen de ontvangst van je herroeping.",
    kind: "Soort", cancel: "opzegging", withdraw: "herroeping", name: "Naam", email: "E-mail", contract: "Contract",
    mode: "Soort opzegging", ordinary: "reguliere opzegging", extraordinary: "buitengewone opzegging", reason: "Reden voor opzegging",
    effective: "Einddatum", asap: "op de eerst mogelijke datum", orderDate: "Besteldatum", received: "Ontvangen", end: "Einde contract",
    refund: "Het volledige bedrag wordt binnen 14 dagen terugbetaald.",
  },
  es: {
    cancelSubject: "Confirmación de recepción de la cancelación", withdrawSubject: "Confirmación de recepción del desistimiento",
    cancelIntro: "Confirmamos la recepción de la cancelación del contrato.", withdrawIntro: "Confirmamos la recepción del desistimiento del contrato.",
    kind: "Tipo", cancel: "cancelación", withdraw: "desistimiento", name: "Nombre", email: "Correo electrónico", contract: "Contrato",
    mode: "Tipo de cancelación", ordinary: "cancelación ordinaria", extraordinary: "cancelación extraordinaria", reason: "Motivo de la cancelación",
    effective: "Fecha de efecto", asap: "en la primera fecha posible", orderDate: "Fecha del pedido", received: "Recibido", end: "Fin del contrato",
    refund: "El importe íntegro se reembolsará en un plazo de 14 días.",
  },
  fr: {
    cancelSubject: "Confirmation de réception de la résiliation", withdrawSubject: "Confirmation de réception de la rétractation",
    cancelIntro: "Nous confirmons la réception de la résiliation du contrat.", withdrawIntro: "Nous confirmons la réception de la rétractation du contrat.",
    kind: "Type", cancel: "résiliation", withdraw: "rétractation", name: "Nom", email: "E-mail", contract: "Contrat",
    mode: "Type de résiliation", ordinary: "résiliation ordinaire", extraordinary: "résiliation extraordinaire", reason: "Motif de la résiliation",
    effective: "Date d'effet", asap: "à la première date possible", orderDate: "Date de commande", received: "Reçu", end: "Fin du contrat",
    refund: "Le montant intégral sera remboursé dans un délai de 14 jours.",
  },
});

const clean = (value) => typeof value === "string" ? value.trim() : "";
const charLength = (value) => [...value].length;
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const dateMs = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day, 12);
};
const berlinDay = (now) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(now));
  const pick = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
};

/** Validate and normalize one callable payload. */
export function validateNotice(input, now = Date.now()) {
  const value = input && typeof input === "object" ? input : {};
  if (clean(value.website)) return { ok: false, error: "spam" };

  const kind = clean(value.kind);
  if (kind !== "cancel" && kind !== "withdraw") return { ok: false, error: "kind" };
  const lang = CONTRACT_LANGS.includes(clean(value.lang)) ? clean(value.lang) : "de";
  const name = clean(value.name);
  if (charLength(name) < 2 || charLength(name) > 120) return { ok: false, error: "name" };
  const email = clean(value.email).toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "email" };
  }

  const orderDate = clean(value.orderDate);
  if (orderDate && !validDate(orderDate)) return { ok: false, error: "orderDate" };

  if (kind === "withdraw") {
    return { ok: true, notice: {
      kind, lang, name, email, mode: null, reason: "", effective: null,
      orderDate: orderDate || null,
    } };
  }

  const mode = clean(value.mode);
  if (mode !== "ordinary" && mode !== "extraordinary") return { ok: false, error: "mode" };
  const reason = clean(value.reason);
  if (charLength(reason) > 2000 || (mode === "extraordinary" && !reason)) {
    return { ok: false, error: "reason" };
  }
  const effective = clean(value.effective);
  if (effective !== "asap" && !validDate(effective)) return { ok: false, error: "effective" };
  if (effective !== "asap" && effective < berlinDay(now)) return { ok: false, error: "effective" };

  return { ok: true, notice: {
    kind, lang, name, email, mode, reason, effective, orderDate: null,
  } };
}

/** Counts are the values before the current request is added. */
export function limitDecision({ emailToday, ipHour }) {
  return { mailCustomer: Number(emailToday) < 3 && Number(ipHour) < 10 };
}

const formatDate = (ms, lang) => new Intl.DateTimeFormat(LOCALE[lang], {
  dateStyle: "long", timeZone: "Europe/Berlin",
}).format(new Date(ms));
const formatReceived = (ms, lang) => new Intl.DateTimeFormat(LOCALE[lang], {
  dateStyle: "long", timeStyle: "short", timeZone: "Europe/Berlin",
}).format(new Date(ms));

function cancellationEnd(notice, planValidUntilMs) {
  const planEnd = Number(planValidUntilMs);
  const hasPlanEnd = Number.isFinite(planEnd) && planEnd > 0;
  if (notice.effective && notice.effective !== "asap") {
    const chosen = dateMs(notice.effective);
    if (!hasPlanEnd || chosen > planEnd) return chosen;
  }
  return hasPlanEnd ? planEnd : null;
}

/** Build the localized receipt sent to the customer. */
export function customerMail(notice, receivedAtMs, planValidUntilMs = null) {
  const lang = CONTRACT_LANGS.includes(notice.lang) ? notice.lang : "de";
  const c = COPY[lang];
  const cancel = notice.kind === "cancel";
  const lines = [
    cancel ? c.cancelIntro : c.withdrawIntro,
    "",
    `${c.kind}: ${cancel ? c.cancel : c.withdraw}`,
    `${c.name}: ${notice.name}`,
    `${c.email}: ${notice.email}`,
    `${c.contract}: LiczMat Pro (Abonnement)`,
  ];

  if (cancel) {
    lines.push(`${c.mode}: ${notice.mode === "extraordinary" ? c.extraordinary : c.ordinary}`);
    if (notice.reason) lines.push(`${c.reason}: ${notice.reason}`);
    lines.push(`${c.effective}: ${notice.effective === "asap" ? c.asap : formatDate(dateMs(notice.effective), lang)}`);
  } else if (notice.orderDate) {
    lines.push(`${c.orderDate}: ${formatDate(dateMs(notice.orderDate), lang)}`);
  }
  lines.push("", `${c.received}: ${formatReceived(receivedAtMs, lang)}`);

  if (cancel) {
    const end = cancellationEnd(notice, planValidUntilMs);
    lines.push(`${c.end}: ${end ? formatDate(end, lang) : c.asap}`);
  } else {
    lines.push(c.refund);
  }

  lines.push("", ENTITY.name, ENTITY.address, ENTITY.email);
  return {
    subject: cancel ? c.cancelSubject : c.withdrawSubject,
    text: lines.join("\n"),
  };
}

const accountValue = (value) => value === undefined || value === null || value === "" ? "brak" : String(value);

/** Build the Polish operational message sent to the owner for every stored notice. */
export function ownerMail(notice, receivedAtMs, account = null) {
  const cancel = notice.kind === "cancel";
  const lines = [
    cancel ? "Nowe wypowiedzenie umowy" : "Nowe odstąpienie od umowy",
    "",
    `Rodzaj: ${cancel ? "wypowiedzenie" : "odstąpienie"}`,
    `Imię i nazwisko: ${notice.name}`,
    `E-mail: ${notice.email}`,
    "Umowa: LiczMat Pro (Abonnement)",
    `Data wpływu: ${new Date(receivedAtMs).toISOString()}`,
  ];

  if (cancel) {
    lines.push(`Tryb: ${notice.mode}`);
    lines.push(`Powód: ${notice.reason || "brak"}`);
    lines.push(`Termin: ${notice.effective}`);
  } else {
    lines.push(`Data zamówienia: ${notice.orderDate || "brak"}`);
  }

  if (account) {
    lines.push("", `UID: ${accountValue(account.uid)}`);
    for (const key of ["plan", "planValidUntil", "planRenews", "planSource"]) {
      lines.push(`${key}: ${accountValue(account[key])}`);
    }
  } else {
    lines.push("", "Konto: nie znaleziono");
  }

  if (cancel) {
    lines.push("", "Anuluj subskrypcję w Stripe (koniec okresu)");
    const until = Number(account && account.planValidUntil);
    if (account && account.planRenews === true && Number.isFinite(until) && until - receivedAtMs > 31 * DAY) {
      lines.push("Roczny po pierwszym roku: zwrot proporcjonalny za czas po końcu umowy (miesiąc wypowiedzenia)");
    }
  } else {
    lines.push("", "Pełny zwrot w Stripe w ciągu 14 dni");
    const firstPurchase = Number(account && account.firstPurchaseAt);
    const known = Number.isFinite(firstPurchase) && firstPurchase > 0
      ? firstPurchase
      : notice.orderDate ? dateMs(notice.orderDate) : null;
    const within = known === null ? "nie wiadomo" : receivedAtMs - known <= 14 * DAY && receivedAtMs >= known ? "tak" : "nie";
    lines.push(`Pierwszy zakup w ciągu 14 dni: ${within}`);
  }

  return {
    subject: cancel ? `Wypowiedzenie LiczMat Pro: ${notice.email}` : `Odstąpienie LiczMat Pro: ${notice.email}`,
    text: lines.join("\n"),
  };
}
