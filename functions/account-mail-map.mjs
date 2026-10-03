/** Czysta logika wiadomosci konta i limitow wysylki. */
import { escapeHtml, mailAction, mailLang, renderMail } from "./mail-map.mjs";

export const ACCOUNT_MAIL_TYPES = Object.freeze(["verify", "reset", "change"]);
export const LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const TARGET_LIMIT = 3;
export const IP_LIMIT = 10;

const T = {
  pl: {
    verify: ["Potwierdź adres e-mail w LiczMat", "Potwierdź adres", "Kliknij przycisk poniżej, żeby potwierdzić, że ten adres należy do Ciebie. Dzięki temu odzyskasz konto, gdyby kiedyś trzeba było zmienić hasło.", "Link jest ważny przez ograniczony czas. Jeśli konta w LiczMat nie zakładał nikt z Twojej strony, zignoruj tę wiadomość."],
    reset: ["Zmiana hasła w LiczMat", "Ustaw nowe hasło", "Ktoś poprosił o zmianę hasła do konta LiczMat przypisanego do tego adresu. Nowe hasło ustawisz przyciskiem poniżej.", "Link jest ważny przez ograniczony czas. Jeśli to nie była Twoja prośba, zignoruj tę wiadomość: obecne hasło zostaje bez zmian."],
    change: ["Potwierdź nowy adres e-mail", "Potwierdź nowy adres", "Konto LiczMat ma od teraz używać adresu {email}. Zmiana wejdzie w życie po kliknięciu przycisku poniżej.", "Link jest ważny przez ograniczony czas. Jeśli to nie była Twoja prośba, zignoruj tę wiadomość: adres konta zostaje bez zmian."],
    hello: (name) => name ? `Cześć, ${name}` : "Cześć"
  },
  de: {
    verify: ["E-Mail-Adresse bei LiczMat bestätigen", "Adresse bestätigen", "Bestätigen Sie Ihre E-Mail-Adresse, um Ihr LiczMat-Konto zu schützen.", "Der Link läuft ab. Wenn Sie das Konto nicht erstellt haben, ignorieren Sie diese Nachricht."],
    reset: ["Passwort bei LiczMat ändern", "Neues Passwort festlegen", "Über diesen Link können Sie ein neues Passwort für Ihr LiczMat-Konto festlegen.", "Der Link läuft ab. Wenn Sie die Änderung nicht angefordert haben, bleibt alles unverändert."],
    change: ["Neue E-Mail-Adresse bestätigen", "Neue Adresse bestätigen", "Bestätigen Sie die neue E-Mail-Adresse Ihres LiczMat-Kontos: {email}.", "Der Link läuft ab. Wenn Sie die Änderung nicht angefordert haben, ignorieren Sie diese Nachricht."],
    hello: (name) => name ? `Guten Tag, ${name}` : "Guten Tag"
  },
  en: {
    verify: ["Verify your email address for LiczMat", "Verify address", "Verify your email address to secure your LiczMat account.", "The link will expire. If you did not create the account, ignore this message."],
    reset: ["Change your LiczMat password", "Set a new password", "Use this link to set a new password for your LiczMat account.", "The link will expire. If you did not request this, nothing will change."],
    change: ["Verify your new email address", "Verify new address", "Verify the new email address for your LiczMat account: {email}.", "The link will expire. If you did not request this change, ignore this message."],
    hello: (name) => name ? `Hello, ${name}` : "Hello"
  },
  uk: {
    verify: ["Підтвердьте адресу e-mail у LiczMat", "Підтвердити адресу", "Підтвердьте адресу e-mail, щоб захистити свій обліковий запис LiczMat.", "Термін дії посилання закінчиться. Якщо ви не створювали обліковий запис, проігноруйте цей лист."],
    reset: ["Зміна пароля в LiczMat", "Установити новий пароль", "Скористайтеся посиланням, щоб установити новий пароль до облікового запису LiczMat.", "Термін дії посилання закінчиться. Якщо ви не просили про зміну, нічого не зміниться."],
    change: ["Підтвердьте нову адресу e-mail", "Підтвердити нову адресу", "Підтвердьте нову адресу e-mail облікового запису LiczMat: {email}.", "Термін дії посилання закінчиться. Якщо ви не просили про зміну, проігноруйте цей лист."],
    hello: (name) => name ? `Вітаємо, ${name}` : "Вітаємо"
  },
  cs: {
    verify: ["Potvrďte e-mailovou adresu v LiczMat", "Potvrdit adresu", "Potvrďte e-mailovou adresu a zabezpečte svůj účet LiczMat.", "Platnost odkazu vyprší. Pokud jste účet nevytvořili, zprávu ignorujte."],
    reset: ["Změna hesla v LiczMat", "Nastavit nové heslo", "Pomocí odkazu nastavte nové heslo k účtu LiczMat.", "Platnost odkazu vyprší. Pokud jste o změnu nežádali, nic se nezmění."],
    change: ["Potvrďte novou e-mailovou adresu", "Potvrdit novou adresu", "Potvrďte novou e-mailovou adresu účtu LiczMat: {email}.", "Platnost odkazu vyprší. Pokud jste o změnu nežádali, zprávu ignorujte."], hello: (n) => n ? `Dobrý den, ${n}` : "Dobrý den"
  },
  sk: {
    verify: ["Potvrďte e-mailovú adresu v LiczMat", "Potvrdiť adresu", "Potvrďte e-mailovú adresu a zabezpečte svoj účet LiczMat.", "Platnosť odkazu vyprší. Ak ste účet nevytvorili, správu ignorujte."],
    reset: ["Zmena hesla v LiczMat", "Nastaviť nové heslo", "Pomocou odkazu nastavte nové heslo k účtu LiczMat.", "Platnosť odkazu vyprší. Ak ste o zmenu nežiadali, nič sa nezmení."],
    change: ["Potvrďte novú e-mailovú adresu", "Potvrdiť novú adresu", "Potvrďte novú e-mailovú adresu účtu LiczMat: {email}.", "Platnosť odkazu vyprší. Ak ste o zmenu nežiadali, správu ignorujte."], hello: (n) => n ? `Dobrý deň, ${n}` : "Dobrý deň"
  },
  ro: {
    verify: ["Confirmă adresa de e-mail în LiczMat", "Confirmă adresa", "Confirmă adresa de e-mail pentru a-ți proteja contul LiczMat.", "Linkul va expira. Dacă nu ai creat contul, ignoră mesajul."],
    reset: ["Schimbarea parolei în LiczMat", "Setează o parolă nouă", "Folosește linkul pentru a seta o parolă nouă pentru contul LiczMat.", "Linkul va expira. Dacă nu ai cerut schimbarea, nimic nu se modifică."],
    change: ["Confirmă noua adresă de e-mail", "Confirmă noua adresă", "Confirmă noua adresă de e-mail a contului LiczMat: {email}.", "Linkul va expira. Dacă nu ai cerut schimbarea, ignoră mesajul."], hello: (n) => n ? `Salut, ${n}` : "Salut"
  },
  hr: {
    verify: ["Potvrdite adresu e-pošte u LiczMatu", "Potvrdi adresu", "Potvrdite adresu e-pošte kako biste zaštitili svoj LiczMat račun.", "Poveznica će isteći. Ako niste izradili račun, zanemarite poruku."], reset: ["Promjena lozinke u LiczMatu", "Postavi novu lozinku", "Poveznicom postavite novu lozinku za LiczMat račun.", "Poveznica će isteći. Ako niste tražili promjenu, ništa se neće promijeniti."], change: ["Potvrdite novu adresu e-pošte", "Potvrdi novu adresu", "Potvrdite novu adresu e-pošte LiczMat računa: {email}.", "Poveznica će isteći. Ako niste tražili promjenu, zanemarite poruku."], hello: (n) => n ? `Pozdrav, ${n}` : "Pozdrav"
  },
  sr: {
    verify: ["Potvrdite adresu e-pošte u LiczMatu", "Potvrdi adresu", "Potvrdite adresu e-pošte da biste zaštitili svoj LiczMat nalog.", "Link će isteći. Ako niste napravili nalog, zanemarite poruku."], reset: ["Promena lozinke u LiczMatu", "Postavi novu lozinku", "Pomoću linka postavite novu lozinku za LiczMat nalog.", "Link će isteći. Ako niste tražili promenu, ništa se neće promeniti."], change: ["Potvrdite novu adresu e-pošte", "Potvrdi novu adresu", "Potvrdite novu adresu e-pošte LiczMat naloga: {email}.", "Link će isteći. Ako niste tražili promenu, zanemarite poruku."], hello: (n) => n ? `Zdravo, ${n}` : "Zdravo"
  },
  it: {
    verify: ["Conferma l'indirizzo e-mail in LiczMat", "Conferma indirizzo", "Conferma l'indirizzo e-mail per proteggere il tuo account LiczMat.", "Il link scadrà. Se non hai creato l'account, ignora il messaggio."], reset: ["Modifica della password in LiczMat", "Imposta nuova password", "Usa il link per impostare una nuova password per l'account LiczMat.", "Il link scadrà. Se non hai richiesto la modifica, non cambierà nulla."], change: ["Conferma il nuovo indirizzo e-mail", "Conferma nuovo indirizzo", "Conferma il nuovo indirizzo e-mail dell'account LiczMat: {email}.", "Il link scadrà. Se non hai richiesto la modifica, ignora il messaggio."], hello: (n) => n ? `Ciao, ${n}` : "Ciao"
  },
  nl: {
    verify: ["Bevestig je e-mailadres bij LiczMat", "Adres bevestigen", "Bevestig je e-mailadres om je LiczMat-account te beveiligen.", "De link verloopt. Heb je het account niet gemaakt, negeer dan dit bericht."], reset: ["Wachtwoord wijzigen bij LiczMat", "Nieuw wachtwoord instellen", "Gebruik de link om een nieuw wachtwoord voor je LiczMat-account in te stellen.", "De link verloopt. Heb je dit niet gevraagd, dan verandert er niets."], change: ["Bevestig je nieuwe e-mailadres", "Nieuw adres bevestigen", "Bevestig het nieuwe e-mailadres van je LiczMat-account: {email}.", "De link verloopt. Heb je dit niet gevraagd, negeer dan dit bericht."], hello: (n) => n ? `Hallo, ${n}` : "Hallo"
  },
  es: {
    verify: ["Confirma tu correo en LiczMat", "Confirmar dirección", "Confirma tu correo para proteger tu cuenta de LiczMat.", "El enlace caducará. Si no creaste la cuenta, ignora el mensaje."], reset: ["Cambio de contraseña en LiczMat", "Crear nueva contraseña", "Usa el enlace para crear una nueva contraseña para tu cuenta de LiczMat.", "El enlace caducará. Si no pediste el cambio, no se modificará nada."], change: ["Confirma el nuevo correo", "Confirmar nueva dirección", "Confirma el nuevo correo de tu cuenta de LiczMat: {email}.", "El enlace caducará. Si no pediste el cambio, ignora el mensaje."], hello: (n) => n ? `Hola, ${n}` : "Hola"
  },
  fr: {
    verify: ["Confirmez votre adresse e-mail dans LiczMat", "Confirmer l'adresse", "Confirmez votre adresse e-mail pour protéger votre compte LiczMat.", "Le lien expirera. Si vous n'avez pas créé le compte, ignorez ce message."], reset: ["Modification du mot de passe dans LiczMat", "Définir un nouveau mot de passe", "Utilisez le lien pour définir un nouveau mot de passe pour votre compte LiczMat.", "Le lien expirera. Si vous n'avez rien demandé, rien ne changera."], change: ["Confirmez la nouvelle adresse e-mail", "Confirmer la nouvelle adresse", "Confirmez la nouvelle adresse e-mail du compte LiczMat : {email}.", "Le lien expirera. Si vous n'avez rien demandé, ignorez ce message."], hello: (n) => n ? `Bonjour, ${n}` : "Bonjour"
  }
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
export const validEmail = (value) => value.length <= 254 && EMAIL.test(value);

export function parseAccountMail(data) {
  const type = data && data.type;
  if (!ACCOUNT_MAIL_TYPES.includes(type)) return { error: "bad-type" };
  const lang = mailLang(data.lang);
  if (type === "verify") return { type, lang };
  const field = type === "change" ? "newEmail" : "email";
  const email = normalizeEmail(data[field]);
  if (!validEmail(email)) return { error: "bad-email" };
  return { type, lang, [field]: email };
}

export function limitDecision(timestamps, nowMs, limit) {
  const recent = (Array.isArray(timestamps) ? timestamps : []).filter((value) =>
    Number.isFinite(value) && value > nowMs - LIMIT_WINDOW_MS && value <= nowMs);
  if (recent.length >= limit) return { allowed: false, timestamps: recent };
  return { allowed: true, timestamps: [...recent, nowMs] };
}

function message(type, { lang, displayName, link, newEmail }) {
  const code = mailLang(lang);
  const tr = T[code];
  const [subject, button, sentenceRaw, note] = tr[type];
  const value = newEmail || "";
  const sentenceText = sentenceRaw.replace("{email}", value);
  const sentenceHtml = sentenceRaw.replace("{email}", escapeHtml(value));
  const greetingText = type === "verify" ? `${tr.hello(displayName)}\n\n` : "";
  const greetingHtml = type === "verify" ? `<p style="font-size: 16px; margin: 0 0 16px 0;">${tr.hello(escapeHtml(displayName))}</p>` : "";
  return renderMail({
    lang: code,
    subject,
    bodyText: `${greetingText}${sentenceText}\n\n${button}: ${link}\n\n${note}`,
    bodyHtml: `${greetingHtml}<p style="font-size: 16px; margin: 0 0 20px 0;">${sentenceHtml}</p>${mailAction(button, link)}<p style="font-size: 14px; margin: 0 0 32px 0; color: #555555;">${note}</p>`
  });
}

export const verifyEmail = (options) => message("verify", options);
export const resetPassword = (options) => message("reset", options);
export const changeEmail = (options) => message("change", options);
