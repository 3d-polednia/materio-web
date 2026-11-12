import { ENTITY } from "../site.mjs";

export default {
  lang: "de",
  title: "Allgemeine Geschäftsbedingungen für LiczMat Pro",
  updated: "2026-11-11",
  binding: true,
  translationNote: "",
  sections: [
    {
      id: "anbieter",
      h: "1. Anbieter und Geltungsbereich",
      html: `<p>Anbieter von LiczMat Pro ist <b>${ENTITY.name}</b>, ${ENTITY.address}, Telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, E-Mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, USt-IdNr.: ${ENTITY.taxId}.</p><p>Diese Allgemeinen Geschäftsbedingungen gelten für das kostenpflichtige Abonnement <b>LiczMat Pro</b>, das auf liczmat.com für die Webanwendung unter <a href="/app/">liczmat.com/app/</a> angeboten wird. Die kostenlosen Rechner auf liczmat.com, die Android-App und das kostenlose LiczMat-Konto sind unentgeltlich und nicht Teil des kostenpflichtigen Vertrags.</p><p>Verbraucher im Sinne von § 13 BGB ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können. Unternehmer im Sinne von § 14 BGB ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss des Vertrags in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt.</p><p>Eigene Geschäftsbedingungen des Kunden gelten nicht.</p>`
    },
    {
      id: "leistung",
      h: "2. Leistung",
      html: `<p>LiczMat Pro stellt Ihnen online im Browser die Pro-Funktionen bereit, wie sie auf der <a href="/de/liczmat-pro/">LiczMat Pro-Seite</a> zum Zeitpunkt der Bestellung beschrieben sind. Dazu gehören insbesondere die Verwaltung von Kunden, Angebote mit PDF und Freigabelink, die Terminplanung, Preise und Kosten in Projekten sowie die Hinterlegung von Firmendaten. LiczMat speichert die von Ihnen eingegebenen Daten in Ihrem Konto.</p><p>Berechnungen und daraus erstellte Angebote sind Hilfsmittel. Sie prüfen Mengen, Preise, Ergebnisse und die Eignung für den beabsichtigten Zweck, bevor Sie Material kaufen oder ein Angebot abgeben.</p><p>Eine ununterbrochene Verfügbarkeit wird nicht zugesichert. Wartungsarbeiten, technische Störungen und Ausfälle können vorkommen. Wir bemühen uns, Einschränkungen möglichst kurz zu halten.</p>`
    },
    {
      id: "test",
      h: "3. Kostenloser Testzeitraum",
      html: `<p>Neue Konten erhalten LiczMat Pro für <b>14 Tage kostenlos</b>. Dafür werden keine Zahlungsdaten benötigt. Der Testzeitraum endet automatisch. Er wird nicht in ein kostenpflichtiges Abonnement umgewandelt. Nach seinem Ende kehrt das Konto zum kostenlosen Tarif zurück.</p>`
    },
    {
      id: "vertrag",
      h: "4. Vertragsschluss",
      html: `<p>Die Darstellung von LiczMat Pro auf der Website ist kein verbindliches Angebot zum Abschluss eines Vertrags.</p><p>Für die Bestellung melden Sie sich unter <a href="/app/">liczmat.com/app/</a> an, wählen das monatliche oder jährliche Abonnement und klicken auf die Kaufschaltfläche. Sie werden zur Checkout-Seite von Stripe weitergeleitet. Dort geben Sie Ihre E-Mail-Adresse und Zahlungsdaten ein. Vor dem abschließenden Klick können Sie alle Eingaben prüfen und korrigieren. Der Vertrag kommt zustande, wenn Sie auf die Schaltfläche <b>„Zahlungspflichtig abonnieren“</b> klicken.</p><p>Zahlungsdienstleister ist Stripe Payments Europe, Limited (Irland). Stripe bestätigt den Vertrag per E-Mail.</p><p>Der Vertrag kann in den 13 Sprachen geschlossen werden, die auf der Website angeboten werden. Verbindlich ist die deutsche Fassung. Wir speichern den Vertragstext nicht gesondert. Diese Allgemeinen Geschäftsbedingungen sind unter dieser Adresse jederzeit verfügbar und können gespeichert oder ausgedruckt werden. Belege und Rechnungen stehen im Stripe-Kundenportal zur Verfügung.</p>`
    },
    {
      id: "preise",
      h: "5. Preise und Zahlung",
      html: `<p>Es gelten die Preise, die auf der <a href="/de/liczmat-pro/">LiczMat Pro-Seite</a> und im Checkout zum Zeitpunkt der Bestellung angezeigt werden. Es handelt sich um Endpreise einschließlich der gesetzlichen Umsatzsteuer. Weitere Kosten fallen nicht an. Die Abrechnung erfolgt in der im Checkout angezeigten Währung.</p><p>Der Preis wird für den jeweiligen Zeitraum, einen Monat oder ein Jahr, im Voraus berechnet und zu Beginn jedes Zeitraums automatisch mit dem im Checkout gewählten Zahlungsmittel belastet. Es stehen die Zahlungsmethoden zur Verfügung, die im Checkout angeboten werden.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Laufzeit und Kündigung",
      html: `<h3>6.1. Monatliches Abonnement</h3><p>Das monatliche Abonnement läuft einen Monat. Es verlängert sich jeweils um einen weiteren Monat, wenn es nicht gekündigt wird. Sie können es jederzeit zum Ende des laufenden Vertragsmonats kündigen.</p><h3>6.2. Jährliches Abonnement</h3><p>Die erste Laufzeit beträgt ein Jahr. Sie können das Abonnement jederzeit zum Ende dieses Jahres kündigen. Ohne Kündigung wird es nach dem ersten Jahr auf unbestimmte Zeit fortgesetzt und kann dann jederzeit mit einer Frist von einem Monat gekündigt werden. Die Abrechnung erfolgt weiterhin jährlich im Voraus. Einen bereits gezahlten Betrag für die Zeit nach dem Vertragsende erstatten wir anteilig.</p><h3>6.3. Kündigungswege</h3><p>Sie können im Kundenportal über den Bereich <b>Konto</b> unter <a href="/app/">liczmat.com/app/</a>, über die Schaltfläche <a href="/de/vertraege-kuendigen/">„Verträge hier kündigen“</a>, per E-Mail an <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> oder per Brief an ${ENTITY.name}, ${ENTITY.address}, kündigen. Das Recht zur Kündigung aus wichtigem Grund bleibt unberührt.</p><h3>6.4. Folgen des Vertragsendes</h3><p>Nach dem Vertragsende kehrt das Konto zum kostenlosen Tarif zurück. Ihre Daten bleiben im Konto gespeichert. Die Pro-Funktionen stehen nicht mehr zur Verfügung, bis LiczMat Pro erneut bestellt wird. Informationen zur Löschung des Kontos finden Sie in der <a href="/de/datenschutz/">Datenschutzerklärung</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Widerrufsbelehrung",
      html: `<p>Das folgende gesetzliche Widerrufsrecht gilt nur für Verbraucher.</p><h3>Widerrufsrecht</h3><p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p><p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p><p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, <b>${ENTITY.name}</b>, ${ENTITY.address}, Telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, E-Mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, mittels einer eindeutigen Erklärung, zum Beispiel eines mit der Post versandten Briefs oder einer E-Mail, über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.</p><p>Sie können dafür das unten stehende Muster-Widerrufsformular oder die Widerrufsfunktion auf der Seite <a href="/de/vertrag-widerrufen/">„Vertrag hier widerrufen“</a> verwenden, was jedoch nicht vorgeschrieben ist. Wenn Sie die Widerrufsfunktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger, zum Beispiel durch eine E-Mail, unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres Eingangs.</p><p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p><h3>Folgen des Widerrufs</h3><p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.</p><p>Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.</p><p>Wir verlangen für die Zeit bis zum Widerruf keinen Wertersatz.</p>`
    },
    {
      id: "formular",
      h: "8. Muster-Widerrufsformular",
      html: `<p>Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.</p><ul><li>An: <b>${ENTITY.name}</b>, ${ENTITY.address}, E-Mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: <b>LiczMat Pro (Abonnement)</b>.</li><li>Bestellt am (*)</li><li>Name des/der Verbraucher(s)</li><li>Anschrift des/der Verbraucher(s)</li><li>Unterschrift des/der Verbraucher(s), nur bei Mitteilung auf Papier</li><li>Datum</li></ul><p>(*) Unzutreffendes streichen.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Zusätzliche Rückerstattung innerhalb von 14 Tagen",
      html: `<p>Zusätzlich zum gesetzlichen Widerrufsrecht erstatten wir jedem Kunden, auch einem Unternehmer, den vollständig gezahlten Betrag, wenn der Kunde innerhalb von 14 Tagen nach dem ersten Kauf eines LiczMat Pro-Abonnements widerruft oder kündigt. Diese Regel gilt nur für den ersten Kauf je Konto und nicht für Verlängerungen.</p>`
    },
    {
      id: "pflichten",
      h: "10. Pflichten des Kunden",
      html: `<ul><li>Sie machen richtige und vollständige Angaben und halten diese aktuell.</li><li>Sie halten Ihr Passwort geheim und schützen den Zugang zu Ihrem Konto.</li><li>Sie stellen keine rechtswidrigen Inhalte in Angebote oder geteilte Links ein. Geteilte Angebots- oder Projektlinks können von jeder Person eingesehen werden, die den Link kennt.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Änderungen der Leistung",
      html: `<p>Wir dürfen die Leistung nur aus einem triftigen Grund ändern, zum Beispiel wegen neuer gesetzlicher Vorgaben, aus Sicherheitsgründen oder aufgrund technischer Weiterentwicklung. Die Änderung verursacht für Sie keine zusätzlichen Kosten. Wir informieren Sie klar und rechtzeitig im Voraus.</p><p>Beeinträchtigt eine Änderung den Zugang oder die Nutzung für einen Verbraucher mehr als nur unerheblich, kann der Verbraucher den Vertrag innerhalb von 30 Tagen nach Erhalt der Information oder nach der Änderung, je nachdem, welcher Zeitpunkt später liegt, unentgeltlich beenden (§ 327r BGB).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Gewährleistung",
      html: `<p>Es gelten die gesetzlichen Gewährleistungsrechte. Für Verbraucher gelten insbesondere die §§ 327 ff. BGB.</p>`
    },
    {
      id: "haftung",
      h: "13. Haftung",
      html: `<p>Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz.</p><p>Bei leichter Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen Vertragspflicht. Wesentliche Vertragspflichten, auch Kardinalpflichten genannt, sind Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen darf. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung bei leichter Fahrlässigkeit ausgeschlossen.</p><p>Die gesetzliche Haftung nach den §§ 327 ff. BGB bleibt unberührt.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Preisänderungen",
      html: `<p>Der Preis eines laufenden Abonnements ändert sich nur mit Ihrer ausdrücklichen Zustimmung. Wir informieren Sie mindestens 30 Tage im Voraus. Ohne Ihre Zustimmung läuft das Abonnement zum bisherigen Preis weiter. Beide Seiten können es zum Ende des bereits bezahlten Zeitraums beenden.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Änderungen dieser Bedingungen",
      html: `<p>Änderungen dieser Allgemeinen Geschäftsbedingungen gelten für einen laufenden Vertrag nur mit Ihrer ausdrücklichen Zustimmung. Wir informieren Sie mindestens 30 Tage im Voraus. Ohne Ihre Zustimmung gelten die bisherigen Bedingungen weiter. Beide Seiten können das Abonnement zum Ende des bereits bezahlten Zeitraums beenden.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Datenschutz",
      html: `<p>Informationen zur Verarbeitung personenbezogener Daten finden Sie in der <a href="/de/datenschutz/">Datenschutzerklärung</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Verbraucherstreitbeilegung",
      html: `<p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).</p>`
    },
    {
      id: "schluss",
      h: "18. Schlussbestimmungen",
      html: `<p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit ihnen dadurch nicht der Schutz zwingender Bestimmungen des Staates ihres gewöhnlichen Aufenthalts entzogen wird.</p><p>Für Kaufleute, juristische Personen des öffentlichen Rechts und öffentlich-rechtliche Sondervermögen ist der Sitz des Anbieters Gerichtsstand.</p><p>Sollte eine Bestimmung dieses Vertrags unwirksam sein oder werden, bleiben die übrigen Bestimmungen wirksam.</p><p>Die deutsche Fassung ist verbindlich. Übersetzungen dienen nur der Information.</p>`
    }
  ]
};
