/**
 * LiczMat e-mail powitalny: czysta część.
 *
 * Ten plik generuje wiadomości powitalne i podejmuje decyzje o ich wysłaniu.
 * Podobnie jak trial-map.mjs, nie używa firebase-admin ani sieci, dzięki czemu
 * można go testować w node.
 */

import {
  MAIL_FROM, MAIL_LANGS, MAIL_LOGO, MAIL_REPLY_TO, escapeHtml, renderMail
} from "./mail-map.mjs";

export const WELCOME_LANGS = MAIL_LANGS;
export const WELCOME_FROM = MAIL_FROM;
export const WELCOME_REPLY_TO = MAIL_REPLY_TO;
export const WELCOME_LOGO = MAIL_LOGO;

const URL_CALC_INDEX = Object.freeze({
  "pl": "https://liczmat.com/kalkulatory/",
  "uk": "https://liczmat.com/uk/kalkulyatory/",
  "de": "https://liczmat.com/de/rechner/",
  "en": "https://liczmat.com/en/calculators/",
  "cs": "https://liczmat.com/cs/kalkulacky/",
  "sk": "https://liczmat.com/sk/kalkulacky/",
  "ro": "https://liczmat.com/ro/calculatoare/",
  "hr": "https://liczmat.com/hr/kalkulatori/",
  "sr": "https://liczmat.com/sr/kalkulatori/",
  "it": "https://liczmat.com/it/calcolatori/",
  "nl": "https://liczmat.com/nl/rekenmachines/",
  "es": "https://liczmat.com/es/calculadoras/",
  "fr": "https://liczmat.com/fr/calculateurs/"
});

/**
 * Zwraca język z profilu, jeśli jest na liście, albo "pl" domyślnie.
 * @param {object|null} profile 
 * @returns {string} dwuliterowy kod języka
 */
export function welcomeLang(profile) {
  if (!profile || typeof profile.lang !== "string") return "pl";
  const lang = profile.lang.substring(0, 2).toLowerCase();
  if (WELCOME_LANGS.includes(lang)) return lang;
  return "pl";
}

/**
 * Podejmuje decyzję, czy wysłać e-mail powitalny.
 * @param {{marker: object|null, email: string|null|undefined}} ctx 
 * @returns {{send: false, reason: string}|{send: true}}
 */
export function welcomeDecision({ marker, email }) {
  if (marker) {
    return { send: false, reason: "already-sent" };
  }
  if (!email) {
    return { send: false, reason: "no-email" };
  }
  return { send: true };
}

/**
 * Zwraca obiekt dokumentu blokady w kolekcji welcomeMails.
 * @param {string} uid 
 * @param {number} nowMs 
 * @param {string} lang 
 * @returns {{uid: string, lang: string, createdAt: number, status: string}}
 */
export function welcomeMarkerDoc(uid, nowMs, lang) {
  return {
    uid,
    lang,
    createdAt: nowMs,
    status: "sending"
  };
}

const T = {
  pl: {
    subject: "Witaj w LiczMat",
    greeting: (name) => name ? `Cześć, ${name}` : "Cześć",
    ready: "Twoje konto jest gotowe i działa na stronie liczmat.com oraz w aplikacji na Androida z tymi samymi danymi.",
    pro: "Przez pierwsze 14 dni masz darmowy dostęp do LiczMat Pro, bez podawania karty i bez automatycznego odnawiania.",
    questions: "W razie pytań odpowiedz na ten e-mail lub napisz na contact@liczmat.com.",
    calcText: "Kalkulatory",
    appText: "Konto",
    playText: "Google Play",
    privacyText: "Polityka prywatności",
    roleText: "Kalkulator materiałów budowlanych"
  },
  uk: {
    subject: "Вітаємо в LiczMat",
    greeting: (name) => name ? `Вітаємо, ${name}` : "Вітаємо",
    ready: "Ваш обліковий запис готовий. Він працює на liczmat.com та в додатку для Android з тими ж даними.",
    pro: "Перші 14 днів включають LiczMat Pro безкоштовно. Картка не потрібна, нічого не подовжується автоматично.",
    questions: "Якщо у вас є запитання, дайте відповідь на цей електронний лист або напишіть на contact@liczmat.com.",
    calcText: "Калькулятори",
    appText: "Обліковий запис",
    playText: "Google Play",
    privacyText: "Політика конфіденційності",
    roleText: "Калькулятор будівельних матеріалів"
  },
  de: {
    subject: "Willkommen bei LiczMat",
    greeting: (name) => name ? `Guten Tag, ${name}` : "Guten Tag",
    ready: "Ihr Konto ist bereit. Es funktioniert auf liczmat.com und in der Android-App mit denselben Daten.",
    pro: "Die ersten 14 Tage beinhalten LiczMat Pro kostenlos, ohne dass eine Karte benötigt wird und ohne automatische Verlängerung.",
    questions: "Bei Fragen antworten Sie einfach auf diese E-Mail oder schreiben Sie an contact@liczmat.com.",
    calcText: "Rechner",
    appText: "Ihr Konto",
    playText: "Google Play",
    privacyText: "Datenschutzerklärung",
    roleText: "Baustoffrechner"
  },
  en: {
    subject: "Welcome to LiczMat",
    greeting: (name) => name ? `Hello, ${name}` : "Hello",
    ready: "Your account is ready. It works on liczmat.com and in the Android app with the same data.",
    pro: "The first 14 days include LiczMat Pro at no cost, no card needed, nothing renews automatically.",
    questions: "If you have questions, reply to this email or write to contact@liczmat.com.",
    calcText: "Calculators",
    appText: "Account",
    playText: "Google Play",
    privacyText: "Privacy policy",
    roleText: "Building material calculator"
  },
  cs: {
    subject: "Vítejte v LiczMat",
    greeting: (name) => name ? `Dobrý den, ${name}` : "Dobrý den",
    ready: "Váš účet je připraven. Funguje na liczmat.com a v aplikaci pro Android se stejnými daty.",
    pro: "Prvních 14 dní zahrnuje LiczMat Pro zdarma. Není potřeba žádná karta, nic se automaticky neobnovuje.",
    questions: "Máte-li dotazy, odpovězte na tento e-mail nebo napište na contact@liczmat.com.",
    calcText: "Kalkulačky",
    appText: "Účet",
    playText: "Google Play",
    privacyText: "Zásady ochrany osobních údajů",
    roleText: "Kalkulačka stavebních materiálů"
  },
  sk: {
    subject: "Vitajte v LiczMat",
    greeting: (name) => name ? `Dobrý deň, ${name}` : "Dobrý deň",
    ready: "Váš účet je pripravený. Funguje na liczmat.com a v aplikácii pre Android s rovnakými údajmi.",
    pro: "Prvých 14 dní zahŕňa LiczMat Pro zadarmo. Nie je potrebná žiadna karta, nič sa automaticky neobnovuje.",
    questions: "Ak máte otázky, odpovedzte na tento e-mail alebo napíšte na contact@liczmat.com.",
    calcText: "Kalkulačky",
    appText: "Účet",
    playText: "Google Play",
    privacyText: "Zásady ochrany osobných údajov",
    roleText: "Kalkulačka stavebných materiálov"
  },
  ro: {
    subject: "Bun venit la LiczMat",
    greeting: (name) => name ? `Salut, ${name}` : "Salut",
    ready: "Contul tău este pregătit. Funcționează pe liczmat.com și în aplicația pentru Android cu aceleași date.",
    pro: "Primele 14 zile includ LiczMat Pro gratuit. Nu este necesară nicio card, nimic nu se reînnoiește automat.",
    questions: "Dacă aveți întrebări, răspundeți la acest e-mail sau scrieți la contact@liczmat.com.",
    calcText: "Calculatoare",
    appText: "Cont",
    playText: "Google Play",
    privacyText: "Politica de confidențialitate",
    roleText: "Calculator de materiale de construcții"
  },
  hr: {
    subject: "Dobrodošli u LiczMat",
    greeting: (name) => name ? `Pozdrav, ${name}` : "Pozdrav",
    ready: "Vaš račun je spreman. Radi na liczmat.com i u Android aplikaciji s istim podacima.",
    pro: "Prvih 14 dana uključuje LiczMat Pro besplatno. Kartica nije potrebna, ništa se ne obnavlja automatski.",
    questions: "Ako imate pitanja, odgovorite na ovaj e-mail ili pišite na contact@liczmat.com.",
    calcText: "Kalkulatori",
    appText: "Račun",
    playText: "Google Play",
    privacyText: "Pravila privatnosti",
    roleText: "Kalkulator građevinskog materijala"
  },
  sr: {
    subject: "Dobrodošli u LiczMat",
    greeting: (name) => name ? `Zdravo, ${name}` : "Zdravo",
    ready: "Vaš nalog je spreman. Radi na liczmat.com i u Android aplikaciji sa istim podacima.",
    pro: "Prvih 14 dana uključuje LiczMat Pro besplatno. Kartica nije potrebna, ništa se ne obnavlja automatski.",
    questions: "Ako imate pitanja, odgovorite na ovu e-poruku ili pišite na contact@liczmat.com.",
    calcText: "Kalkulatori",
    appText: "Nalog",
    playText: "Google Play",
    privacyText: "Politika privatnosti",
    roleText: "Kalkulator građevinskog materijala"
  },
  it: {
    subject: "Benvenuto su LiczMat",
    greeting: (name) => name ? `Ciao, ${name}` : "Ciao",
    ready: "Il tuo account è pronto. Funziona su liczmat.com e nell'app per Android con gli stessi dati.",
    pro: "I primi 14 giorni includono LiczMat Pro gratuitamente. Nessuna carta richiesta, nessun rinnovo automatico.",
    questions: "In caso di domande, rispondi a questa e-mail o scrivi a contact@liczmat.com.",
    calcText: "Calcolatori",
    appText: "Account",
    playText: "Google Play",
    privacyText: "Informativa sulla privacy",
    roleText: "Calcolatore di materiali edili"
  },
  nl: {
    subject: "Welkom bij LiczMat",
    greeting: (name) => name ? `Hallo, ${name}` : "Hallo",
    ready: "Je account is klaar. Het werkt op liczmat.com en in de Android-app met dezelfde gegevens.",
    pro: "De eerste 14 dagen zijn inclusief LiczMat Pro zonder kosten. Geen kaart nodig, niets wordt automatisch verlengd.",
    questions: "Als je vragen hebt, beantwoord dan deze e-mail of schrijf naar contact@liczmat.com.",
    calcText: "Rekenmachines",
    appText: "Account",
    playText: "Google Play",
    privacyText: "Privacybeleid",
    roleText: "Rekenhulp voor bouwmaterialen"
  },
  es: {
    subject: "Bienvenido a LiczMat",
    greeting: (name) => name ? `Hola, ${name}` : "Hola",
    ready: "Tu cuenta está lista. Funciona en liczmat.com y en la aplicación para Android con los mismos datos.",
    pro: "Los primeros 14 días incluyen LiczMat Pro gratis. No se necesita tarjeta, nada se renueva automáticamente.",
    questions: "Si tienes preguntas, responde a este correo electrónico o escribe a contact@liczmat.com.",
    calcText: "Calculadoras",
    appText: "Cuenta",
    playText: "Google Play",
    privacyText: "Política de privacidad",
    roleText: "Calculadora de materiales de construcción"
  },
  fr: {
    subject: "Bienvenue sur LiczMat",
    greeting: (name) => name ? `Bonjour, ${name}` : "Bonjour",
    ready: "Votre compte est prêt. Il fonctionne sur liczmat.com et dans l'application Android avec les mêmes données.",
    pro: "Les 14 premiers jours incluent LiczMat Pro gratuitement. Aucune carte nécessaire, aucun renouvellement automatique.",
    questions: "Si vous avez des questions, répondez à cet e-mail ou écrivez à contact@liczmat.com.",
    calcText: "Calculateurs",
    appText: "Compte",
    playText: "Google Play",
    privacyText: "Politique de confidentialité",
    roleText: "Calculateur de matériaux de construction"
  }
};

/**
 * Generuje treść wiadomości powitalnej (subject, text, html) we wskazanym języku.
 * @param {{lang: string, displayName: string|null|undefined}} options 
 * @returns {{subject: string, text: string, html: string}}
 */
export function welcomeMessage({ lang, displayName }) {
  const code = WELCOME_LANGS.includes(lang) ? lang : "pl";
  const t = T[code];

  const urlCalc = URL_CALC_INDEX[code];
  const urlApp = "https://liczmat.com/app/";
  const urlPlay = "https://play.google.com/store/apps/details?id=pl.materio.app";
  const greetingPlain = t.greeting(displayName);
  const greetingHtml = t.greeting(escapeHtml(displayName));

  const bodyText = `${greetingPlain}

${t.ready}
${t.pro}

${t.calcText}: ${urlCalc}
${t.appText}: ${urlApp}
${t.playText}: ${urlPlay}

${t.questions}`;

  const bodyHtml = `<p style="font-size: 16px; margin: 0 0 16px 0;">${greetingHtml}</p>
<p style="font-size: 16px; margin: 0 0 16px 0;">${t.ready}</p>
<p style="font-size: 16px; margin: 0 0 24px 0;">${t.pro}</p>
<ul style="font-size: 16px; margin: 0 0 24px 0; padding-left: 20px;"><li style="margin-bottom: 8px;"><a href="${urlCalc}" style="color: #0056b3; text-decoration: underline;">${t.calcText}</a></li><li style="margin-bottom: 8px;"><a href="${urlApp}" style="color: #0056b3; text-decoration: underline;">${t.appText}</a></li><li style="margin-bottom: 8px;"><a href="${urlPlay}" style="color: #0056b3; text-decoration: underline;">${t.playText}</a></li></ul>
<p style="font-size: 16px; margin: 0 0 32px 0;">${t.questions}</p>`;

  return renderMail({ lang: code, subject: t.subject, bodyText, bodyHtml });
}
