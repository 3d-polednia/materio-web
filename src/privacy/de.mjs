import { ENTITY } from "../site.mjs";

export default {
  lang: "de",
  title: "Datenschutzerklärung",
  updated: "2026-10-02",
  binding: true,
  translationNote: "",
  sections: [
    {
      id: "podejscie",
      h: "1. Datenschutzansatz",
      html: `<p>Diese Erklärung beschreibt, welche Daten die mobile App <b>LiczMat, Baustoffrechner</b> („App“) und die Website <b>liczmat.com</b> („Website“) verarbeiten und zu welchem Zweck. Der Verantwortliche für die Datenverarbeitung ist <b>${ENTITY.name}</b>, ${ENTITY.address} („wir“), Kontakt: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funktioniert nach dem <b>Offline-First</b>-Prinzip. Alle Berechnungen erfolgen auf Ihrem Gerät und funktionieren ohne Internet. Die lokale Datenbank ist die einzige Quelle der Wahrheit, die Cloud ist lediglich eine Kopie davon.</p><p><b>Ein Konto ist optional.</b> Für Berechnungen müssen Sie sich nicht anmelden. Solange Sie kein Konto erstellen, senden wir weder Ihre Projekte noch Ihre Berechnungen an einen Server. Ein Backup ist eine Datei, die Sie selbst exportieren und speichern. Wenn Sie sich für ein Konto entscheiden, werden die unten beschriebenen Daten an <b>Google Firebase</b> gesendet. Weitere Details finden Sie in Abschnitt 3.</p><p>Die App nutzt auch andere Dienste von <b>Google</b> (Werbung und Karten/Baumarktsuche), die bestimmte Daten verarbeiten. Wir beschreiben dies im Folgenden.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Auf dem Gerät gespeicherte Daten",
      html: `<p>Lokal auf Ihrem Gerät speichern wir: Projekte, Berechnungen, Einkaufslisten, Räume, eigene Materialien und Einstellungen (z. B. Sprache, Währung, Design, Auftragnehmerdaten). Wenn Sie die App deinstallieren oder ihre Daten löschen, werden diese Informationen dauerhaft vom Gerät entfernt. Ein Backup (Export in eine Datei) erstellen und speichern Sie selbst.</p><p><b>Der Materialkatalog, Ihre eigenen Materialien und Preise sowie die Einstellungen werden nicht synchronisiert.</b> Sie bleiben ausschließlich auf dem Gerät, auch wenn Sie ein Konto haben.</p>`
    },
    {
      id: "konto",
      h: "3. LiczMat-Konto und Synchronisierung (optional)",
      html: `<p>Sie können ein <b>LiczMat-Konto</b> erstellen, um dieselben Projekte auf dem Smartphone und im Browser (<a href="/app/">liczmat.com/app/</a>) zu haben. Das Konto ist kostenlos und völlig freiwillig. Ohne Konto funktionieren die App und die Website wie bisher.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Welche Daten wir verarbeiten, wenn Sie ein Konto haben",
      html: `<ul><li><b>E-Mail-Adresse und Passwort.</b> Wird durch <b>Firebase Authentication</b> verwaltet. Wir sehen und speichern Ihr Passwort nicht, es wird von Google als Hashwert gespeichert. Das Google-Anmeldefenster und die Seiten, die über Links in Konto-E-Mails aufgerufen werden (z. B. Passwort zurücksetzen, E-Mail-Bestätigung), werden von <b>auth.liczmat.com</b> bereitgestellt, einem Firebase Hosting-Dienst (Google) im selben Projekt.</li><li><b>Anmeldung mit Google</b> (optionale Alternative zum Passwort). In diesem Fall gibt es kein Passwort. Wir erhalten von Google die E-Mail-Adresse, den Anzeigenamen und eine Konto-ID, um sie mit Ihren Daten in LiczMat zu verknüpfen (der Anzeigename wird in der Willkommens-E-Mail verwendet). Wir rufen keine anderen Daten aus Ihrem Google-Konto ab.</li><li><b>Die Konto-ID (UID)</b>, die von Firebase vergeben wird.</li><li><b>Kontoinhalte:</b> Projekte, Räume, Angebote und Einkaufslisten. Namen, Mengen, Einheiten, Preise, Währung, Eingabewerte des Rechners sowie Zeitstempel der Erstellung und Änderung.</li><li><b>Technische Daten:</b> Erstellungsdatum des Kontos, Datum der letzten Nutzung und ob Sie sich über die App oder die Website verbinden.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Wo die Daten gespeichert werden",
      html: `<p>Die Datenbank <b>Google Cloud Firestore</b> und die <b>Cloud Functions</b> laufen in der Region <b>europe-central2 (Warschau)</b>, also innerhalb der Europäischen Union. Der Dienst <b>Firebase Authentication</b> (Ihre Anmeldedaten wie E-Mail-Adresse, Anzeigename, Passwort-Hash und Google-Konto-ID) wird jedoch auf der globalen Infrastruktur von Google betrieben, sodass diese Daten in den USA verarbeitet werden können (siehe Abschnitt 8). Google handelt hierbei als Auftragsverarbeiter in unserem Auftrag.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Wer darauf zugreifen kann",
      html: `<p>Ausschließlich der Kontoinhaber. Die Sicherheitsregeln von Firestore erlauben das Lesen und Schreiben von Kontodaten nur dem angemeldeten Nutzer mit derselben ID. Die einzige Ausnahme ist ein Link, den Sie selbst erstellen. Siehe Abschnitt 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Wie die Synchronisierung funktioniert",
      html: `<p>Nach jeder lokalen Änderung sendet die App das Dokument an Firestore und übernimmt die Änderungen aus der Cloud zurück in die Gerätedatenbank. Bei einem Konflikt gewinnt der neuere Eintrag (Vergleich der Zeitstempel). Das Löschen eines Datensatzes entfernt diesen nicht sofort aus der Cloud: Das Dokument wird als gelöscht markiert, damit das zweite Gerät von der Löschung erfährt und den Datensatz nicht wiederherstellt. Diese Markierungen werden nach <b>30 Tagen</b> bereinigt.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Teilen eines Angebots per Link",
      html: `<p>Wenn Sie auf „Teilen“ tippen, erstellen wir eine <b>Kopie</b> des gewählten Projekts (Name, Angebote, Einkaufsliste, Währung) unter einer zufälligen 128-Bit-Adresse liczmat.com/p/&lt;token&gt;. Diese Kopie ist <b>für jeden, der den Link kennt, öffentlich einsehbar</b>. Das Token in der Adresse ist der einzige Schutz. Teilen Sie es also nur mit Personen, die das Angebot sehen sollen. Die Kopie wird nicht automatisch aktualisiert, Sie müssen sie manuell per Schaltfläche aktualisieren. Wenn Sie den Link löschen, wird der Zugriff sofort widerrufen. Die Person, die den Link öffnet, benötigt kein Konto, und wir erheben über sie keine Daten außer der Standard-Websiteanalyse (Abschnitt 6).</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Wie lange wir Daten aufbewahren und wie Sie sie löschen",
      html: `<p>Wir bewahren die Kontodaten so lange auf, wie das Konto existiert. Sie können einzelne Projekte und Räume jederzeit löschen. Das gesamte Konto löschen Sie selbst unter <a href="/app/">liczmat.com/app/</a> → Reiter <b>Konto</b> → <b>Konto löschen</b>. Dadurch werden alle Dokumente des Kontos in Firestore (Projekte, Räume, Angebote, Einkaufslisten und erstellte Links) und schließlich das Konto selbst in Firebase Authentication gelöscht. Dies kann nicht rückgängig gemacht werden. Im selben Reiter können Sie zuvor den gesamten Kontoinhalt als JSON-Datei herunterladen. Wenn wir das für Sie erledigen sollen, schreiben Sie an <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Daten, die auf Ihrem Gerät oder im Browser gespeichert sind, löschen Sie separat, indem Sie die App-Daten oder die Website-Daten löschen.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Rechtsgrundlage",
      html: `<p>Die Verarbeitung der Kontodaten ist für die Erbringung des von Ihnen angeforderten Dienstes erforderlich. Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Die Erstellung eines Kontos ist freiwillig, ohne Konto stehen Ihnen alle Berechnungsfunktionen zur Verfügung.</p>`
    },
    {
      id: "reklamy",
      h: "4. Werbung (Google AdMob)",
      html: `<p>Die App ist kostenlos und finanziert sich durch Werbung, die von <b>Google AdMob</b> bereitgestellt wird. Daher kann Google als Werbeanbieter Folgendes erheben und verarbeiten:</p><ul><li><b>die Werbe-ID</b> (Android Advertising ID),</li><li>IP-Adresse und Gerätedaten (Modell, Betriebssystem, Spracheinstellungen),</li><li>die ungefähre Standortbestimmung (basierend auf der IP-Adresse),</li><li>Informationen zur Interaktion mit Anzeigen (Impressionen, Klicks).</li></ul><p>Diese Daten dienen dazu, Anzeigen auszuliefern, ihre Häufigkeit zu begrenzen, die Leistung zu messen und Missbrauch zu verhindern. Die Richtlinien von Google beschreiben dies: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Google-Richtlinien für Partner-Websites</a> sowie die <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Datenschutzerklärung von Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Einwilligung (DSGVO) und personalisierte Werbung",
      html: `<p>Wenn Sie sich im Europäischen Wirtschaftsraum, im Vereinigten Königreich oder in der Schweiz befinden, zeigen wir beim ersten Start einen Zustimmungsdialog (Google User Messaging Platform) an, in dem Sie über personalisierte Werbung entscheiden. Ohne Ihre Einwilligung wird nur <b>nicht personalisierte</b> Werbung angezeigt. Sie können Ihre Einwilligung jederzeit ändern oder widerrufen, indem Sie die App-Daten in den Systemeinstellungen löschen oder die Werbe-ID in den Android-Einstellungen zurücksetzen. Die Rechtsgrundlage für personalisierte Werbung ist die Einwilligung, Art. 6 Abs. 1 lit. a DSGVO, und für das Auslesen oder Speichern von Informationen auf dem Gerät zusätzlich § 25 Abs. 1 TDDDG (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz). Für nicht personalisierte Werbung: berechtigtes Interesse an der Finanzierung der kostenlosen App, Art. 6 Abs. 1 lit. f DSGVO.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. App-Analyse (Firebase / Google Analytics)",
      html: `<p>Die App nutzt <b>Google Analytics for Firebase</b>, um anonymisiert und aggregiert zu messen, wie ihre Funktionen genutzt werden (z. B. welche Rechner Sie öffnen, die Anzahl der aktiven Nutzer). Dies hilft uns, LiczMat zu verbessern. Die Analyse ist standardmäßig <b>deaktiviert</b> und wird erst aktiviert, wenn Sie im selben Dialog (Google User Messaging Platform) Ihre Einwilligung erteilen. Ohne Einwilligung wird nichts erhoben. Die Daten werden von Google gemäß der <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Datenschutzerklärung von Google</a> verarbeitet. Die Rechtsgrundlage ist die Einwilligung, Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG; die Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Standort und Baumarktsuche (Google Maps / Places)",
      html: `<p>Die Funktion „Baumarkt finden“ nutzt <b>Google Maps</b> und <b>Google Places</b>. Wenn Sie der Standortfreigabe zustimmen, verwendet die App Ihren ungefähren oder genauen Standort, um Baumärkte in der Nähe anzuzeigen und die Route zu berechnen. Anfragen an Kartendienste werden von Google gemäß deren Datenschutzerklärung verarbeitet. Sie können den Zugriff auf Ihren Standort verweigern. In diesem Fall werden keine Baumärkte automatisch gesucht, alle anderen Funktionen bleiben jedoch erhalten. Wir speichern Ihren Standort nicht, weder auf dem Gerät noch im Konto.</p>`
    },
    {
      id: "strona",
      h: "6. Website",
      html: `<p>Die Website <b>liczmat.com</b> ist statisch. Beim Aufruf der Website verarbeitet der Host GitHub Pages (GitHub, Inc.) standardmäßige Server-Protokolldaten (IP-Adresse, Uhrzeit, angeforderte Seite, Browser), um die Website sicher bereitzustellen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und zuverlässigen Website). Sie nutzt <b>Google Analytics</b> (GA4), um den Datenverkehr anonymisiert und aggregiert zu messen (z. B. wie viele Personen die Website besuchen und wie viele zu Google Play weiterklicken), damit wir sie verbessern können. Die Analyse ist standardmäßig deaktiviert: Gemäß der DSGVO bitten wir Sie zunächst um Ihre Einwilligung, und Google Analytics (einschließlich des Setzens von Cookies) wird erst nach Ihrer Zustimmung aktiviert. Sie können ablehnen, und alle anderen Funktionen bleiben nutzbar. Die Rechtsgrundlage ist die Einwilligung, Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG; der Widerruf ist jederzeit über die Cookie-Einstellungen auf der Website mit Wirkung für die Zukunft möglich. Abgesehen von Analytics nutzt die Website keine Webfonts. Der gesamte restliche Code und die Stile werden von der Domain der Website bereitgestellt, und die interaktiven Rechner laufen ausschließlich in Ihrem Browser.</p><p>Ausnahmen sind Bereiche, in denen externe Dienste eingebunden werden. <b>Baumärkte:</b> Die Website bindet eine <b>Google Maps</b>-Karte ein, die von den Servern von Google geladen wird. Wenn Sie Ihren Standort freigeben, wird dieser nur zur Zentrierung der Karte verwendet und nirgends gespeichert. Um die Liste der nächstgelegenen Baumärkte anzuzeigen, sendet die Website Ihre ungefähren Koordinaten an den Dienst <b>OpenStreetMap (Overpass API)</b> und ruft öffentliche Baumarktdaten ab. Die Schaltfläche „Navigieren“ öffnet die Route in Google Maps. Die Vorschläge für Städte anhand der Postleitzahl nutzen eine Datenbank von GeoNames (geonames.org), CC BY 4.0, die direkt auf unserem Server gehostet wird, und kein Dritter erhält die eingegebene Postleitzahl. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO, wenn der Besucher den Standort freigibt, andernfalls wird die Karte erst geladen, wenn der Besucher die Baumarktsuche öffnet. <b>/app/:</b> Nach der Anmeldung verbindet sich die Website mit <b>Firebase</b> (Authentifizierung und Firestore) gemäß den Bedingungen in Abschnitt 3 und speichert die Anmeldedaten im Browser, damit das Passwort nicht bei jedem Besuch abgefragt wird. <b>/p/&lt;token&gt;:</b> Die Website ruft die geteilte Kopie eines Angebots aus Firestore ab, ohne Anmeldung und ohne Datenerfassung über die Person, die den Link öffnet. Beide Unterseiten sind von der Indexierung ausgeschlossen.</p><p><b>Projekte, Räume und Angebote, die ohne Anmeldung auf der Website gespeichert werden,</b> verbleiben ausschließlich im lokalen Speicher Ihres Browsers (localStorage) und werden nirgendwohin gesendet. Wir können sie nicht sehen und haben keinen Zugriff darauf. Sie löschen diese, indem Sie die Website-Daten im Browser löschen. Sie gelangen erst in die Cloud, wenn Sie sich in Ihrem Konto anmelden und selbst auf „Kopie des Browsers an das Konto senden“ klicken. Ab diesem Moment gilt Abschnitt 3. Wir speichern im Browser auch Ihre Sprachwahl, Währungsauswahl, Designauswahl und Ihre Entscheidung im Einwilligungsbanner zur Analyse.</p>`
    },
    {
      id: "komu",
      h: "7. An wen wir Daten weitergeben",
      html: `<p>Wir verkaufen keine Daten und erstellen keine Nutzerprofile. Die oben beschriebenen Daten werden von <b>Google</b> als Auftragsverarbeiter verarbeitet: AdMob (Werbung), Maps und Places (Karten und Baumärkte), Analytics (Statistiken) sowie, falls Sie ein Konto erstellen, Firebase Authentication, Cloud Firestore und Firebase Hosting (Konto und Synchronisierung). Außerdem senden wir Ihnen nach der Kontoerstellung eine einmalige Willkommens-E-Mail in der Sprache der Seite, auf der das Konto erstellt wurde, an Ihre E-Mail-Adresse. Diese E-Mail wird über die Server von <b>OVH SAS</b> (Frankreich, EU), unserem E-Mail-Anbieter, als Auftragsverarbeiter auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO verarbeitet und versendet. Darüber hinaus geben wir Daten nur an die Personen weiter, denen Sie selbst den Link zum Angebot geben (Abschnitt 3.5), sowie dann, wenn dies gesetzlich vorgeschrieben ist.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Zahlungen (Stripe)",
      html: `<p>Das Abonnement von <b>LiczMat Pro</b> wird über <b>Stripe</b> (Stripe Payments Europe, Ltd., Irland) abgewickelt. Wenn Sie sich für ein Abonnement entscheiden, werden Sie auf die Zahlungsseite von Stripe weitergeleitet. Stripe empfängt und verarbeitet als eigenständiger Verantwortlicher die Zahlungsdaten: Kartennummer, Rechnungsdaten und Zahlungshistorie. <b>Wir sehen und speichern Ihre Kartennummer nicht.</b> Stripe erhält Ihre E-Mail-Adresse und Ihre Konto-ID (UID), damit das bezahlte Abonnement dem richtigen Konto zugeordnet werden kann. Wir erhalten im Gegenzug nur den Status des Tarifs (Kostenlos oder Pro), das Gültigkeitsdatum und die Information, ob sich das Abonnement verlängert. Rechnungen, die Änderung der Karte und Stornierungen verwalten Sie im Kundenportal von Stripe. Die Datenschutzbestimmungen von Stripe finden Sie unter: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Übermittlung in Drittländer",
      html: `<p>Google LLC (zuständig für Firebase Authentication, Google Analytics, AdMob, Maps, Places und Firebase Hosting) und GitHub, Inc. (welche unsere Website liczmat.com auf GitHub Pages hostet und Standard-Server-Logs inkl. IP-Adressen verarbeitet) sind US-Unternehmen. Die Übermittlung Ihrer Daten in die USA basiert auf dem <b>Angemessenheitsbeschluss der Europäischen Kommission für das EU-US Data Privacy Framework</b>, da beide Unternehmen zertifiziert sind. Zusätzlich erfolgt sie auf Grundlage der <b>Standardvertragsklauseln</b> (Standard Contractual Clauses), die in deren Bedingungen zur Datenverarbeitung enthalten sind (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Ihre Rechte (DSGVO)",
      html: `<p>Gemäß der DSGVO haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, Ihre Einwilligung in personalisierte Werbung und Analysen mit Wirkung für die Zukunft zu widerrufen. <b>Wenn die Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch einlegen (Art. 21 DSGVO).</b></p><p>Daten, die auf dem Gerät verbleiben, kontrollieren Sie direkt (App-Daten, Berechtigungen, Werbe-ID in den Android-Einstellungen). Sie können Kontodaten in der App oder unter <a href="/app/">liczmat.com/app/</a> überprüfen und ändern, über die Backup-Funktion exportieren und löschen, indem Sie einzelne Datensätze entfernen oder die Löschung des gesamten Kontos veranlassen (Abschnitt 3.6). Bei Fragen zu Ihren Daten schreiben Sie an: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Sie haben zudem das Recht, eine Beschwerde bei der zuständigen Aufsichtsbehörde einzureichen: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, oder bei jeder Aufsichtsbehörde in Ihrem Wohnsitzmitgliedstaat in der EU.</p>`
    },
    {
      id: "dzieci",
      h: "10. Kinder",
      html: `<p>Die App richtet sich nicht an Kinder, und wir erheben wissentlich keine Daten von Personen unter 13 Jahren. Das LiczMat-Konto ist für Personen ab 16 Jahren oder mit Zustimmung der Erziehungsberechtigten bestimmt.</p>`
    },
    {
      id: "zmiany",
      h: "11. Änderungen und Kontakt",
      html: `<p>Wir können diese Erklärung aktualisieren. Wesentliche Änderungen kündigen wir in der App oder bei Google Play an. Das Datum der letzten Aktualisierung finden Sie oben im Dokument. Kontakt: <b>${ENTITY.name}</b>, E-Mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
