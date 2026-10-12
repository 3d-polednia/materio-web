/** Pure logic for trial lifecycle messages. */
import { timingSafeEqual } from "node:crypto";
import { MAIL_REPLY_TO, escapeHtml, firstName, mailAction, mailLang, renderMail } from "./mail-map.mjs";

export const DAY = 86400000;
export const LIFECYCLE_STEPS = Object.freeze(["survey", "tips", "reminder"]);
export const MAIL_LINK_URL = "https://europe-central2-materio-502513.cloudfunctions.net/mailLink";
const DONE = new Set(["sending", "sent", "failed", "skipped"]);
const P_STYLE = "font-size: 16px; margin: 0 0 16px 0;";
const A_STYLE = "color: #0056b3; text-decoration: underline;";

export function lifecycleStart({ grant, profile }) {
  if (grant && Number.isFinite(grant.grantedAt)) return grant.grantedAt;
  if (profile && Number.isFinite(profile.planValidUntil)) return profile.planValidUntil - 14 * DAY;
  return null;
}

export function lifecycleDecision({ grant, profile, prefs, state, email, disabled, now }) {
  const no = (reason, skip = []) => ({ send: null, reason, skip });
  if (!email) return no("no-email");
  if (disabled) return no("disabled");
  if (prefs && prefs.optOut === true) return no("opted-out");
  const start = lifecycleStart({ grant, profile });
  if (start == null) return no("no-trial");
  const until = profile && Number.isFinite(profile.planValidUntil) ? profile.planValidUntil : start + 14 * DAY;
  const done = (step) => DONE.has(state && state.steps && state.steps[step] && state.steps[step].status);
  const skip = [];
  if (!done("survey") && now >= start + 7 * DAY) skip.push("survey");
  if (!done("tips") && now >= until - 36 * 3600000) skip.push("tips");
  if (now >= until || now < start + 3 * DAY) return no("nothing-due", skip);
  if (now >= until - 36 * 3600000) {
    if (done("reminder")) return no("nothing-due", skip);
    if (!profile || profile.plan !== "premium" || profile.planSource !== "trial") return no("paid", skip);
    return { send: "reminder", skip };
  }
  if (now >= start + 7 * DAY) return done("tips") ? no("nothing-due", skip) : { send: "tips", skip };
  return done("survey") ? no("nothing-due", skip) : { send: "survey", skip };
}

export function newMailToken(randomBytes) {
  return randomBytes(16).toString("hex");
}
export function tokenMatches(stored, given) {
  if (typeof stored !== "string" || typeof given !== "string" || stored.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(given));
}
export function parseSurveyAnswer(input) {
  if (!input || typeof input !== "object") return { ok: false };
  if (input.use != null && typeof input.use !== "string") return { ok: false };
  if (input.missing != null && typeof input.missing !== "string") return { ok: false };
  const useText = input.use == null ? "" : input.use.trim();
  const missing = input.missing == null ? "" : input.missing.trim();
  if (useText && !["home", "business", "other"].includes(useText)) return { ok: false };
  if (missing.length > 1000 || (!useText && !missing)) return { ok: false };
  return { ok: true, use: useText || null, missing };
}
export function mailPageUrl(lang, params) {
  const code = mailLang(lang);
  return `https://liczmat.com${code === "pl" ? "" : `/${code}`}/maile/?${new URLSearchParams(params)}`;
}

const PATHS = {
  pl: ["wyceny", "klienci", "terminarz", "moje-materialy"], uk: ["koshtorysy-pro", "kliyenty", "kalendar", "moyi-materialy"],
  de: ["angebote", "kunden", "termine", "meine-materialien"], en: ["quotes", "clients", "schedule", "my-materials"],
  cs: ["cenove-nabidky", "klienti", "terminy", "moje-materialy"], sk: ["cenove-ponuky", "klienti", "terminy", "moje-materialy"],
  ro: ["oferte", "clienti", "termene", "materialele-mele"], hr: ["ponude", "klijenti", "rokovi", "moji-materijali"],
  sr: ["ponude", "klijenti", "rokovi", "moji-materijali"], it: ["preventivi-pro", "clienti", "scadenze", "i-miei-materiali"],
  nl: ["offertes", "klanten", "planning", "mijn-materialen"], es: ["presupuestos-pro", "clientes", "plazos", "mis-materiales"],
  fr: ["devis-pro", "clients", "echeances", "mes-materiaux"],
};

const T = {
  pl: {
    greeting: (n) => n ? `Cześć, ${n}.` : "Cześć.",
    surveySubject: "Jak Ci się pracuje z LiczMat?",
    surveyIntro: "Od kilku dni masz konto w LiczMat. Jedno kliknięcie bardzo nam pomoże: jak oceniasz LiczMat w skali od 1 do 5?",
    surveyFollowUp: "Po kliknięciu możesz jeszcze dopisać, czego Ci brakuje. To zajmie pół minuty.",
    tipsSubject: "Trzy rzeczy, które warto sprawdzić w okresie próbnym",
    tipsIntro: (d) => `Do ${d} masz w LiczMat wszystkie funkcje Pro. Oto trzy, od których warto zacząć:`,
    tipQuote: "Wycena dla klienta: z pozycji projektu robisz wycenę, wysyłasz klientowi link albo PDF.",
    tipClients: "Klienci i terminarz: zapisujesz klientów i terminy, a terminarz możesz podpiąć do kalendarza w telefonie.",
    tipMaterials: "Własne materiały z cenami: wpisujesz ceny ze swojej hurtowni i wyceny liczą się same.",
    tipsQuestion: "Masz pytanie? Odpowiedz na ten e-mail.",
    reminderSubject: (d) => `Twój okres próbny LiczMat Pro kończy się ${d}`,
    reminderBody: (d) => `${d} kończy się Twój okres próbny LiczMat Pro. Po tym dniu: za darmo zostają kalkulatory, projekty i synchronizacja między stroną a aplikacją. Wyłączą się wyceny, ceny, PDF i klienci. Twoje dane nie znikają, wrócą razem z Pro.`,
    proButton: "Zobacz LiczMat Pro",
    linkQuotes: "Otwórz wyceny",
    linkClients: "Klienci",
    linkCalendar: "Terminarz",
    linkMaterials: "Moje materiały",
    unsubscribe: "Nie chcesz takich maili?",
    unsubscribeLink: "Wypisz się",
  },
  uk: {
    greeting: (n) => n ? `Вітаємо, ${n}.` : "Вітаємо.",
    surveySubject: "Як вам працюється з LiczMat?",
    surveyIntro: "Ви користуєтеся LiczMat уже кілька днів. Один клік дуже нам допоможе: як ви оцінюєте LiczMat від 1 до 5?",
    surveyFollowUp: "Після натискання ви можете додати, чого вам бракує. Це займе пів хвилини.",
    tipsSubject: "Три речі, які варто перевірити під час пробного періоду",
    tipsIntro: (d) => `До ${d} вам доступні всі функції LiczMat Pro. Ось три, з яких варто почати:`,
    tipQuote: "Пропозиція для клієнта: створіть її з позицій проєкту та надішліть посилання або PDF.",
    tipClients: "Клієнти й календар: зберігайте клієнтів і строки та підключіть календар до телефона.",
    tipMaterials: "Власні матеріали з цінами: введіть ціни постачальника, і кошториси рахуватимуться автоматично.",
    tipsQuestion: "Маєте запитання? Дайте відповідь на цей лист.",
    reminderSubject: (d) => `Ваш пробний період LiczMat Pro закінчується ${d}`,
    reminderBody: (d) => `${d} закінчується ваш пробний період LiczMat Pro. Калькулятори, проєкти й синхронізація залишаться безкоштовними. Пропозиції, ціни, PDF і клієнти вимкнуться. Дані залишаться збереженими.`,
    proButton: "Переглянути LiczMat Pro",
    linkQuotes: "Відкрити кошториси",
    linkClients: "Клієнти",
    linkCalendar: "Календар",
    linkMaterials: "Мої матеріали",
    unsubscribe: "Не хочете таких листів?",
    unsubscribeLink: "Відписатися",
  },
  de: {
    greeting: (n) => n ? `Guten Tag, ${n}.` : "Guten Tag.",
    surveySubject: "Wie klappt die Arbeit mit LiczMat?",
    surveyIntro: "Sie haben seit einigen Tagen ein LiczMat-Konto. Ein Klick hilft uns sehr: Wie bewerten Sie LiczMat von 1 bis 5?",
    surveyFollowUp: "Nach dem Klick können Sie ergänzen, was Ihnen fehlt. Das dauert eine halbe Minute.",
    tipsSubject: "Drei Dinge für Ihren Testzeitraum",
    tipsIntro: (d) => `Bis zum ${d} stehen Ihnen alle Funktionen von LiczMat Pro zur Verfügung. Mit diesen drei lohnt sich der Einstieg:`,
    tipQuote: "Angebot für Kunden: Erstellen Sie aus Projektpositionen ein Angebot und senden Sie einen Link oder ein PDF.",
    tipClients: "Kunden und Termine: Speichern Sie Kunden und Termine und verbinden Sie die Planung mit Ihrem Telefonkalender.",
    tipMaterials: "Eigene Materialien mit Preisen: Hinterlegen Sie Ihre Händlerpreise, damit Angebote automatisch berechnet werden.",
    tipsQuestion: "Haben Sie eine Frage? Antworten Sie auf diese E-Mail.",
    reminderSubject: (d) => `Ihr LiczMat Pro-Testzeitraum endet am ${d}`,
    reminderBody: (d) => `Am ${d} endet Ihr LiczMat Pro-Testzeitraum. Danach bleiben Rechner, Projekte und die Synchronisierung kostenlos. Angebote, Preise, PDF und Kunden werden deaktiviert. Ihre Daten bleiben erhalten und kehren mit Pro zurück.`,
    proButton: "LiczMat Pro ansehen",
    linkQuotes: "Angebote öffnen",
    linkClients: "Kunden",
    linkCalendar: "Termine",
    linkMaterials: "Meine Materialien",
    unsubscribe: "Möchten Sie solche E-Mails nicht?",
    unsubscribeLink: "Abmelden",
  },
  en: {
    greeting: (n) => n ? `Hello, ${n}.` : "Hello.",
    surveySubject: "How is LiczMat working for you?",
    surveyIntro: "You have had a LiczMat account for a few days. One click would help us greatly: how would you rate LiczMat from 1 to 5?",
    surveyFollowUp: "After clicking, you can also tell us what is missing. It takes half a minute.",
    tipsSubject: "Three things to try during your trial",
    tipsIntro: (d) => `You have every LiczMat Pro feature until ${d}. Here are three good places to start:`,
    tipQuote: "Customer quote: turn project items into a quote and send the customer a link or PDF.",
    tipClients: "Customers and schedule: save customers and dates, then connect the schedule to your phone calendar.",
    tipMaterials: "Your own priced materials: enter your supplier prices and let quotes calculate themselves.",
    tipsQuestion: "Have a question? Reply to this email.",
    reminderSubject: (d) => `Your LiczMat Pro trial ends on ${d}`,
    reminderBody: (d) => `Your LiczMat Pro trial ends on ${d}. After that, calculators, projects, and sync between the website and app remain free. Quotes, prices, PDF, and customers will be disabled. Your data will not disappear and will return with Pro.`,
    proButton: "See LiczMat Pro",
    linkQuotes: "Open quotes",
    linkClients: "Clients",
    linkCalendar: "Schedule",
    linkMaterials: "My materials",
    unsubscribe: "Do not want emails like this?",
    unsubscribeLink: "Unsubscribe",
  },
  cs: {
    greeting: (n) => n ? `Dobrý den, ${n}.` : "Dobrý den.",
    surveySubject: "Jak se vám pracuje s LiczMat?",
    surveyIntro: "Účet LiczMat máte několik dní. Jedním kliknutím nám pomůžete: jak hodnotíte LiczMat od 1 do 5?",
    surveyFollowUp: "Po kliknutí můžete doplnit, co vám chybí. Zabere to půl minuty.",
    tipsSubject: "Tři věci, které stojí za to vyzkoušet",
    tipsIntro: (d) => `Do ${d} máte všechny funkce LiczMat Pro. Začněte těmito třemi:`,
    tipQuote: "Nabídka pro klienta: vytvořte ji z položek projektu a pošlete odkaz nebo PDF.",
    tipClients: "Klienti a termíny: ukládejte klienty a data a propojte plán s kalendářem telefonu.",
    tipMaterials: "Vlastní materiály s cenami: zadejte ceny dodavatele a nabídky se spočítají samy.",
    tipsQuestion: "Máte otázku? Odpovězte na tento e-mail.",
    reminderSubject: (d) => `Vaše zkušební doba LiczMat Pro končí dne ${d}`,
    reminderBody: (d) => `Dne ${d} končí vaše zkušební doba LiczMat Pro. Kalkulačky, projekty a synchronizace zůstanou zdarma. Nabídky, ceny, PDF a klienti se vypnou. Data zůstanou uložená.`,
    proButton: "Zobrazit LiczMat Pro",
    linkQuotes: "Otevřít nabídky",
    linkClients: "Klienti",
    linkCalendar: "Termíny",
    linkMaterials: "Moje materiály",
    unsubscribe: "Nechcete takové e-maily?",
    unsubscribeLink: "Odhlásit odběr",
  },
  sk: {
    greeting: (n) => n ? `Dobrý deň, ${n}.` : "Dobrý deň.",
    surveySubject: "Ako sa vám pracuje s LiczMat?",
    surveyIntro: "Účet LiczMat máte niekoľko dní. Jedným kliknutím nám pomôžete: ako hodnotíte LiczMat od 1 do 5?",
    surveyFollowUp: "Po kliknutí môžete doplniť, čo vám chýba. Zaberie to pol minúty.",
    tipsSubject: "Tri veci, ktoré sa oplatí vyskúšať",
    tipsIntro: (d) => `Do ${d} máte všetky funkcie LiczMat Pro. Začnite týmito tromi:`,
    tipQuote: "Ponuka pre klienta: vytvorte ju z položiek projektu a pošlite odkaz alebo PDF.",
    tipClients: "Klienti a termíny: ukladajte klientov a dátumy a prepojte plán s kalendárom telefónu.",
    tipMaterials: "Vlastné materiály s cenami: zadajte ceny dodávateľa a ponuky sa vypočítajú samy.",
    tipsQuestion: "Máte otázku? Odpovedzte na tento e-mail.",
    reminderSubject: (d) => `Vaše skúšobné obdobie LiczMat Pro sa končí dňa ${d}`,
    reminderBody: (d) => `Dňa ${d} sa končí vaše skúšobné obdobie LiczMat Pro. Kalkulačky, projekty a synchronizácia zostanú bezplatné. Ponuky, ceny, PDF a klienti sa vypnú. Údaje zostanú uložené.`,
    proButton: "Zobraziť LiczMat Pro",
    linkQuotes: "Otvoriť ponuky",
    linkClients: "Klienti",
    linkCalendar: "Termíny",
    linkMaterials: "Moje materiály",
    unsubscribe: "Nechcete takéto e-maily?",
    unsubscribeLink: "Odhlásiť odber",
  },
  ro: {
    greeting: (n) => n ? `Salut, ${n}.` : "Salut.",
    surveySubject: "Cum ți se pare LiczMat?",
    surveyIntro: "Ai cont LiczMat de câteva zile. Un clic ne ajută mult: cum evaluezi LiczMat de la 1 la 5?",
    surveyFollowUp: "După clic poți adăuga ce îți lipsește. Durează jumătate de minut.",
    tipsSubject: "Trei lucruri de încercat",
    tipsIntro: (d) => `Până pe ${d} ai toate funcțiile LiczMat Pro. Începe cu acestea trei:`,
    tipQuote: "Ofertă pentru client: creezi oferta din proiect și trimiți un link sau PDF.",
    tipClients: "Clienți și termene: salvezi clienții și datele și conectezi programul la calendarul telefonului.",
    tipMaterials: "Materiale proprii cu prețuri: introduci prețurile furnizorului, iar ofertele se calculează automat.",
    tipsQuestion: "Ai o întrebare? Răspunde la acest e-mail.",
    reminderSubject: (d) => `Perioada ta de probă LiczMat Pro se încheie pe ${d}`,
    reminderBody: (d) => `Perioada ta de probă LiczMat Pro se încheie pe ${d}. Calculatoarele, proiectele și sincronizarea rămân gratuite. Ofertele, prețurile, PDF și clienții se dezactivează. Datele rămân salvate.`,
    proButton: "Vezi LiczMat Pro",
    linkQuotes: "Deschide ofertele",
    linkClients: "Clienți",
    linkCalendar: "Termene",
    linkMaterials: "Materialele mele",
    unsubscribe: "Nu dorești astfel de e-mailuri?",
    unsubscribeLink: "Dezabonare",
  },
  hr: {
    greeting: (n) => n ? `Pozdrav, ${n}.` : "Pozdrav.",
    surveySubject: "Kako vam ide rad s LiczMatom?",
    surveyIntro: "LiczMat račun imate nekoliko dana. Jedan klik puno nam pomaže: kako ocjenjujete LiczMat od 1 do 5?",
    surveyFollowUp: "Nakon klika možete dodati što vam nedostaje. Traje pola minute.",
    tipsSubject: "Tri stvari koje vrijedi isprobati",
    tipsIntro: (d) => `Do ${d} imate sve funkcije LiczMat Pro. Počnite s ove tri:`,
    tipQuote: "Ponuda za klijenta: iz stavki projekta izradite ponudu i pošaljite poveznicu ili PDF.",
    tipClients: "Klijenti i rokovi: spremite klijente i datume te povežite raspored s kalendarom telefona.",
    tipMaterials: "Vlastiti materijali s cijenama: unesite cijene dobavljača i ponude se računaju automatski.",
    tipsQuestion: "Imate pitanje? Odgovorite na ovu e-poštu.",
    reminderSubject: (d) => `Vaše probno razdoblje LiczMat Pro završava dana ${d}`,
    reminderBody: (d) => `Dana ${d} završava vaše probno razdoblje LiczMat Pro. Kalkulatori, projekti i sinkronizacija ostaju besplatni. Ponude, cijene, PDF i klijenti bit će isključeni. Podaci ostaju spremljeni.`,
    proButton: "Pogledajte LiczMat Pro",
    linkQuotes: "Otvori ponude",
    linkClients: "Klijenti",
    linkCalendar: "Rokovi",
    linkMaterials: "Moji materijali",
    unsubscribe: "Ne želite ovakve e-poruke?",
    unsubscribeLink: "Odjava",
  },
  sr: {
    greeting: (n) => n ? `Zdravo, ${n}.` : "Zdravo.",
    surveySubject: "Kako vam ide rad sa LiczMatom?",
    surveyIntro: "LiczMat nalog imate nekoliko dana. Jedan klik nam mnogo pomaže: kako ocenjujete LiczMat od 1 do 5?",
    surveyFollowUp: "Posle klika možete dodati šta vam nedostaje. Traje pola minuta.",
    tipsSubject: "Tri stvari koje vredi isprobati",
    tipsIntro: (d) => `Do ${d} imate sve funkcije LiczMat Pro. Počnite sa ove tri:`,
    tipQuote: "Ponuda za klijenta: od stavki projekta napravite ponudu i pošaljite vezu ili PDF.",
    tipClients: "Klijenti i rokovi: sačuvajte klijente i datume i povežite raspored sa kalendarom telefona.",
    tipMaterials: "Sopstveni materijali sa cenama: unesite cene dobavljača i ponude se računaju automatski.",
    tipsQuestion: "Imate pitanje? Odgovorite na ovu poruku.",
    reminderSubject: (d) => `Vaš probni period LiczMat Pro završava dana ${d}`,
    reminderBody: (d) => `Dana ${d} završava vaš probni period LiczMat Pro. Kalkulatori, projekti i sinhronizacija ostaju besplatni. Ponude, cene, PDF i klijenti biće isključeni. Podaci ostaju sačuvani.`,
    proButton: "Pogledajte LiczMat Pro",
    linkQuotes: "Otvori ponude",
    linkClients: "Klijenti",
    linkCalendar: "Rokovi",
    linkMaterials: "Moji materijali",
    unsubscribe: "Ne želite ovakve poruke?",
    unsubscribeLink: "Odjava",
  },
  it: {
    greeting: (n) => n ? `Ciao, ${n}.` : "Ciao.",
    surveySubject: "Come ti trovi con LiczMat?",
    surveyIntro: "Hai un account LiczMat da alcuni giorni. Un clic ci aiuta molto: come valuti LiczMat da 1 a 5?",
    surveyFollowUp: "Dopo il clic puoi aggiungere cosa ti manca. Richiede mezzo minuto.",
    tipsSubject: "Tre cose da provare",
    tipsIntro: (d) => `Fino al ${d} hai tutte le funzioni LiczMat Pro. Inizia da queste tre:`,
    tipQuote: "Preventivo per il cliente: crealo dalle voci del progetto e invia un link o PDF.",
    tipClients: "Clienti e scadenze: salva clienti e date e collega la pianificazione al calendario del telefono.",
    tipMaterials: "Materiali e prezzi personalizzati: inserisci i prezzi del fornitore e i preventivi si calcolano automaticamente.",
    tipsQuestion: "Hai una domanda? Rispondi a questa e-mail.",
    reminderSubject: (d) => `Il tuo periodo di prova LiczMat Pro termina il ${d}`,
    reminderBody: (d) => `Il ${d} termina il periodo di prova LiczMat Pro. Calcolatori, progetti e sincronizzazione restano gratuiti. Preventivi, prezzi, PDF e clienti saranno disattivati. I dati restano salvati.`,
    proButton: "Scopri LiczMat Pro",
    linkQuotes: "Apri i preventivi",
    linkClients: "Clienti",
    linkCalendar: "Scadenze",
    linkMaterials: "I miei materiali",
    unsubscribe: "Non vuoi ricevere e-mail come questa?",
    unsubscribeLink: "Annulla iscrizione",
  },
  nl: {
    greeting: (n) => n ? `Hallo, ${n}.` : "Hallo.",
    surveySubject: "Hoe bevalt LiczMat?",
    surveyIntro: "Je hebt al een paar dagen een LiczMat-account. Eén klik helpt ons enorm: welk cijfer geef je LiczMat van 1 tot 5?",
    surveyFollowUp: "Na je klik kun je toevoegen wat je mist. Dat duurt een halve minuut.",
    tipsSubject: "Drie dingen om te proberen",
    tipsIntro: (d) => `Tot en met ${d} heb je alle functies van LiczMat Pro. Begin met deze drie:`,
    tipQuote: "Offerte voor de klant: maak een offerte van projectregels en stuur een link of PDF.",
    tipClients: "Klanten en planning: bewaar klanten en datums en koppel de planning aan je telefoonagenda.",
    tipMaterials: "Eigen materialen met prijzen: voer leveranciersprijzen in en offertes worden automatisch berekend.",
    tipsQuestion: "Heb je een vraag? Beantwoord deze e-mail.",
    reminderSubject: (d) => `Je proefperiode van LiczMat Pro eindigt op ${d}`,
    reminderBody: (d) => `Je proefperiode van LiczMat Pro eindigt op ${d}. Rekenmachines, projecten en synchronisatie blijven gratis. Offertes, prijzen, PDF en klanten worden uitgeschakeld. Je gegevens blijven bewaard.`,
    proButton: "Bekijk LiczMat Pro",
    linkQuotes: "Open offertes",
    linkClients: "Klanten",
    linkCalendar: "Planning",
    linkMaterials: "Mijn materialen",
    unsubscribe: "Wil je zulke e-mails niet ontvangen?",
    unsubscribeLink: "Uitschrijven",
  },
  es: {
    greeting: (n) => n ? `Hola, ${n}.` : "Hola.",
    surveySubject: "¿Qué tal te va con LiczMat?",
    surveyIntro: "Tienes una cuenta de LiczMat desde hace unos días. Un clic nos ayuda mucho: ¿cómo valoras LiczMat del 1 al 5?",
    surveyFollowUp: "Después puedes añadir qué echas de menos. Lleva medio minuto.",
    tipsSubject: "Tres cosas que conviene probar",
    tipsIntro: (d) => `Hasta el ${d} tienes todas las funciones de LiczMat Pro. Empieza por estas tres:`,
    tipQuote: "Presupuesto para el cliente: créalo desde el proyecto y envía un enlace o PDF.",
    tipClients: "Clientes y plazos: guarda clientes y fechas y conecta la agenda con el calendario del teléfono.",
    tipMaterials: "Materiales propios con precios: introduce los precios del proveedor y los presupuestos se calculan solos.",
    tipsQuestion: "¿Tienes una pregunta? Responde a este correo.",
    reminderSubject: (d) => `Tu periodo de prueba LiczMat Pro termina el ${d}`,
    reminderBody: (d) => `Tu periodo de prueba de LiczMat Pro termina el ${d}. Las calculadoras, proyectos y sincronización siguen siendo gratis. Los presupuestos, precios, PDF y clientes se desactivarán. Tus datos siguen guardados.`,
    proButton: "Ver LiczMat Pro",
    linkQuotes: "Abrir presupuestos",
    linkClients: "Clientes",
    linkCalendar: "Plazos",
    linkMaterials: "Mis materiales",
    unsubscribe: "¿No quieres recibir correos como este?",
    unsubscribeLink: "Darse de baja",
  },
  fr: {
    greeting: (n) => n ? `Bonjour, ${n}.` : "Bonjour.",
    surveySubject: "Comment se passe votre utilisation de LiczMat ?",
    surveyIntro: "Vous avez un compte LiczMat depuis quelques jours. Un clic nous aide beaucoup : quelle note donnez-vous à LiczMat de 1 à 5 ?",
    surveyFollowUp: "Après le clic, vous pouvez ajouter ce qui vous manque. Cela prend une demi-minute.",
    tipsSubject: "Trois choses à essayer",
    tipsIntro: (d) => `Toutes les fonctions LiczMat Pro sont disponibles jusqu'au ${d}. Commencez par ces trois :`,
    tipQuote: "Devis client : créez un devis à partir du projet et envoyez un lien ou un PDF.",
    tipClients: "Clients et échéances : enregistrez clients et dates, puis reliez le planning au calendrier du téléphone.",
    tipMaterials: "Vos matériaux et prix : ajoutez les prix du fournisseur pour calculer automatiquement les devis.",
    tipsQuestion: "Une question ? Répondez à cet e-mail.",
    reminderSubject: (d) => `Votre période d'essai LiczMat Pro se termine le ${d}`,
    reminderBody: (d) => `Votre période d'essai LiczMat Pro se termine le ${d}. Les calculateurs, projets et la synchronisation restent gratuits. Les devis, prix, PDF et clients seront désactivés. Vos données restent enregistrées.`,
    proButton: "Voir LiczMat Pro",
    linkQuotes: "Ouvrir les devis",
    linkClients: "Clients",
    linkCalendar: "Échéances",
    linkMaterials: "Mes matériaux",
    unsubscribe: "Vous ne souhaitez pas recevoir ces e-mails ?",
    unsubscribeLink: "Se désabonner",
  },
};

function surveyBody(t, greetingText, greetingHtml, ratings) {
  const text = `${greetingText} ${t.surveyIntro}\n\n${ratings.map((url, i) => `${i + 1}: ${url}`).join("\n")}\n\n${t.surveyFollowUp}`;
  const cells = ratings.map((url, i) => `<td style="width: 44px; border: 1px solid #91d206; border-radius: 8px; text-align: center;"><a href="${escapeHtml(url)}" style="display: block; padding: 11px 0; color: #151B1E; text-decoration: none; font-weight: bold;">${i + 1}</a></td>`).join('<td style="width: 8px;"></td>');
  const html = `<p style="${P_STYLE}">${greetingHtml} ${t.surveyIntro}</p><table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 16px 0;"><tr>${cells}</tr></table><p style="${P_STYLE}">${t.surveyFollowUp}</p>`;
  return { text, html };
}
function link(url, label) {
  return `<a href="${escapeHtml(url)}" style="${A_STYLE}">${label}</a>`;
}
function tipsBody(t, greetingText, greetingHtml, date, web) {
  const text = `${greetingText} ${t.tipsIntro(date)}\n\n1. ${t.tipQuote} ${web.quotes}\n2. ${t.tipClients} ${web.clients} ${web.calendar}\n3. ${t.tipMaterials} ${web.materials}\n\n${t.tipsQuestion}`;
  const html = `<p style="${P_STYLE}">${greetingHtml} ${t.tipsIntro(date)}</p><ol style="font-size: 16px; margin: 0 0 16px 0; padding-left: 20px;"><li style="margin-bottom: 8px;">${t.tipQuote} ${link(web.quotes, t.linkQuotes)}</li><li style="margin-bottom: 8px;">${t.tipClients} ${link(web.clients, t.linkClients)} · ${link(web.calendar, t.linkCalendar)}</li><li style="margin-bottom: 8px;">${t.tipMaterials} ${link(web.materials, t.linkMaterials)}</li></ol><p style="${P_STYLE}">${t.tipsQuestion}</p>`;
  return { text, html };
}
function reminderBody(t, greetingText, greetingHtml, date, web) {
  const text = `${greetingText} ${t.reminderBody(date)}\n\n${t.proButton}: ${web.pro}`;
  const html = `<p style="${P_STYLE}">${greetingHtml} ${t.reminderBody(date)}</p>${mailAction(t.proButton, web.pro)}`;
  return { text, html };
}
function messageLinks(code) {
  const prefix = code === "pl" ? "" : `/${code}`;
  const [quotes, clients, calendar, materials] = PATHS[code];
  return { quotes: `${prefix}/${quotes}/`, clients: `${prefix}/${clients}/`, calendar: `${prefix}/${calendar}/`, materials: `${prefix}/${materials}/`, pro: `${prefix}/liczmat-pro/` };
}

export function lifecycleMessage(step, { lang, displayName, until, uid, token }) {
  if (!LIFECYCLE_STEPS.includes(step)) throw new TypeError("unknown lifecycle step");
  const code = mailLang(lang);
  const t = T[code];
  const date = new Intl.DateTimeFormat(code, { day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(until);
  const links = messageLinks(code);
  const web = Object.fromEntries(Object.entries(links).map(([key, path]) => [key, `https://liczmat.com${path}`]));
  const unsub = mailPageUrl(code, { a: "unsub", u: uid, t: token });
  const oneClick = `${MAIL_LINK_URL}?a=unsub&u=${encodeURIComponent(uid)}&t=${encodeURIComponent(token)}`;
  const name = firstName(displayName);
  const greetingText = t.greeting(name);
  const greetingHtml = t.greeting(escapeHtml(name));
  let subject;
  let body;
  if (step === "survey") {
    subject = t.surveySubject;
    const ratings = [1, 2, 3, 4, 5].map((rating) => mailPageUrl(code, { a: "rate", u: uid, t: token, r: rating }));
    body = surveyBody(t, greetingText, greetingHtml, ratings);
  } else if (step === "tips") {
    subject = t.tipsSubject;
    body = tipsBody(t, greetingText, greetingHtml, date, web);
  } else {
    subject = t.reminderSubject(date);
    body = reminderBody(t, greetingText, greetingHtml, date, web);
  }
  const bodyText = `${body.text}\n\n${t.unsubscribe} ${t.unsubscribeLink}: ${unsub}`;
  const bodyHtml = `${body.html}<p style="font-size: 12px; margin: 0 0 16px 0; color: #555555;">${t.unsubscribe} <a href="${escapeHtml(unsub)}" style="${A_STYLE}">${t.unsubscribeLink}</a>.</p>`;
  const headers = { "List-Unsubscribe": `<${oneClick}>, <mailto:${MAIL_REPLY_TO}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
  return { ...renderMail({ lang: code, subject, bodyText, bodyHtml }), headers, links };
}
