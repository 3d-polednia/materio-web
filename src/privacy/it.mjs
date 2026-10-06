import { ENTITY } from "../site.mjs";

export default {
  lang: "it",
  title: "Informativa sulla privacy",
  updated: "2026-10-06",
  binding: false,
  translationNote: "Questa è una traduzione. La versione tedesca è vincolante.",
  sections: [
    {
      id: "podejscie",
      h: "1. Approccio alla privacy",
      html: `<p>La presente informativa descrive quali dati vengono trattati dall'applicazione mobile <b>LiczMat, calcolatrice per materiali edili</b> («App») e dal sito web <b>liczmat.com</b> («Sito web») e per quale finalità. Il titolare del trattamento è <b>${ENTITY.name}</b>, ${ENTITY.address} («noi»), contatti: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funziona secondo il principio <b>offline-first</b>. Tutti i calcoli vengono eseguiti sul Suo dispositivo e funzionano senza internet. Il database locale è l'unica fonte di verità e il cloud ne è solo una copia.</p><p><b>Un account è facoltativo.</b> Non è necessario accedere per effettuare i calcoli. Finché non crea un account, non inviamo i Suoi progetti o calcoli a nessun server. Un backup è un file che esporta e salva Lei stesso. Se sceglie di creare un account, i dati descritti di seguito verranno inviati a <b>Google Firebase</b>. Consulti la sezione 3 per i dettagli.</p><p>L'App utilizza anche altri servizi <b>Google</b> (annunci e mappe / ricerca negozi), che trattano determinati dati. Questo è descritto di seguito.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Dati memorizzati sul dispositivo",
      html: `<p>Localmente sul Suo dispositivo memorizziamo: progetti, calcoli, liste della spesa, stanze, materiali personalizzati e impostazioni (ad es. lingua, valuta, tema, dati dell'appaltatore). Disinstallando l'App o cancellando i suoi dati, queste informazioni verranno rimosse permanentemente dal dispositivo. Il backup (esportazione su file) deve essere creato e conservato da Lei.</p><p><b>Il catalogo dei materiali, i Suoi materiali e prezzi personalizzati, nonché le impostazioni non vengono sincronizzati.</b> Rimangono esclusivamente sul dispositivo, anche se ha un account.</p>`
    },
    {
      id: "konto",
      h: "3. Account LiczMat e sincronizzazione (facoltativo)",
      html: `<p>Può creare un <b>account LiczMat</b> per avere gli stessi progetti sullo smartphone e nel browser (<a href="/app/">liczmat.com/app/</a>). L'account è gratuito e del tutto volontario. Senza un account, l'App e il Sito web funzionano come prima.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Quali dati trattiamo quando ha un account",
      html: `<ul><li><b>Indirizzo e-mail e password.</b> Gestiti da <b>Firebase Authentication</b>. Non vediamo e non memorizziamo la Sua password, Google la memorizza come hash. La finestra di accesso di Google e le pagine a cui si accede tramite i link nelle e-mail dell'account (ad es. reimpostazione della password, conferma dell'e-mail) sono fornite da <b>auth.liczmat.com</b>, un servizio Firebase Hosting (Google) all'interno dello stesso progetto.</li><li><b>Accesso con Google</b> (alternativa facoltativa alla password). In questo caso non c'è password. Riceviamo l'indirizzo e-mail, il nome visualizzato e un ID account da Google per collegarli ai Suoi dati in LiczMat (il nome visualizzato viene utilizzato nell'e-mail di benvenuto). Non preleviamo nessun altro dato dal Suo account Google.</li><li><b>L'ID account (UID)</b> assegnato da Firebase.</li><li><b>Contenuti dell'account:</b> progetti, stanze, preventivi e liste della spesa. Nomi, quantità, unità, prezzi, valuta, dati inseriti nella calcolatrice, nonché i timestamp di creazione e modifica.</li><li><b>Dati tecnici:</b> data di creazione dell'account, data dell'ultimo utilizzo e se si connette tramite l'App o il Sito web.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Dove sono archiviati i dati",
      html: `<p>Il database <b>Google Cloud Firestore</b> e i servizi <b>Cloud Functions</b> sono eseguiti nella regione <b>europe-central2 (Varsavia)</b>, ovvero all'interno dell'Unione Europea. Tuttavia, il servizio <b>Firebase Authentication</b> (i Suoi dati di accesso, come indirizzo e-mail, nome visualizzato, hash della password e ID account Google) viene eseguito sull'infrastruttura globale di Google, pertanto questi dati potrebbero essere trattati negli Stati Uniti (veda la sezione 8). Google agisce in questo caso in qualità di responsabile del trattamento per nostro conto.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Chi vi ha accesso",
      html: `<p>Esclusivamente il titolare dell'account. Le regole di sicurezza di Firestore consentono la lettura e la scrittura dei dati dell'account solo all'utente connesso con lo stesso ID. L'unica eccezione è un link che crea Lei stesso. Veda la sezione 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Come funziona la sincronizzazione",
      html: `<p>Dopo ogni modifica locale, l'App invia il documento a Firestore e scarica le modifiche dal cloud di nuovo nel database del dispositivo. In caso di conflitto, prevale l'inserimento più recente (confrontando i timestamp). L'eliminazione di un record non lo rimuove immediatamente dal cloud: il documento viene contrassegnato come eliminato in modo che l'altro dispositivo venga a conoscenza dell'eliminazione e non lo ripristini. Questi contrassegni vengono rimossi dopo <b>30 giorni</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Condivisione di un preventivo tramite un link",
      html: `<p>Se tocca «Condividi», creiamo una <b>copia</b> del progetto selezionato (nome, preventivi, lista della spesa, valuta) a un indirizzo casuale a 128 bit liczmat.com/p/&lt;token&gt;. Questa copia è <b>pubblicamente leggibile per chiunque conosca il link</b>. Il token nell'indirizzo è l'unica protezione, quindi lo condivida solo con le persone che dovrebbero vedere il preventivo. La copia non si aggiorna automaticamente, deve aggiornarla manualmente tramite un pulsante. L'eliminazione del link revoca immediatamente l'accesso. La persona che apre il link non ha bisogno di un account e non raccogliamo alcun dato su di lei a parte le analisi standard del Sito web (sezione 6).</p>`
    },
    {
      id: "konto-calendar-link",
      h: "3.5.1. Link privato al calendario",
      html: `<p>Se crea un link privato al calendario, chiunque conosca quell'indirizzo può leggere le scadenze aperte nel Suo calendario, inclusi nome, data, cliente e nota. La creazione di un nuovo link disattiva quello precedente.</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Per quanto tempo conserviamo i dati e come cancellarli",
      html: `<p>Conserviamo i dati dell'account per l'intera durata dell'account. Può eliminare i singoli progetti e le stanze in qualsiasi momento. Può eliminare l'intero account Lei stesso su <a href="/app/">liczmat.com/app/</a> → scheda <b>Account</b> → <b>Elimina account</b>. Questo elimina tutti i documenti dell'account in Firestore (progetti, stanze, preventivi, liste della spesa e link creati) e infine l'account stesso in Firebase Authentication. Questa operazione non può essere annullata. Nella stessa scheda può scaricare in anticipo l'intero contenuto del Suo account come file JSON. Se desidera che lo facciamo noi per Lei, scriva a <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. I dati memorizzati sul Suo dispositivo o nel browser devono essere eliminati separatamente cancellando i dati dell'App o i dati del sito.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Base giuridica",
      html: `<p>Il trattamento dei dati dell'account è necessario per l'esecuzione del servizio da Lei richiesto. art. 6, par. 1, lett. b) GDPR (esecuzione di un contratto). La creazione di un account è volontaria, senza di esso può utilizzare tutte le funzioni della calcolatrice.</p>`
    },
    {
      id: "reklamy",
      h: "4. Annunci (Google AdMob)",
      html: `<p>L'App è gratuita ed è supportata da annunci forniti da <b>Google AdMob</b>. Pertanto, Google, in qualità di fornitore di annunci, può raccogliere e trattare:</p><ul><li><b>ID pubblicitario</b> (Android Advertising ID),</li><li>indirizzo IP e dati del dispositivo (modello, sistema operativo, impostazioni della lingua),</li><li>posizione approssimativa (in base all'indirizzo IP),</li><li>informazioni sull'interazione con gli annunci (visualizzazioni, clic).</li></ul><p>Questi dati vengono utilizzati per mostrare gli annunci, limitarne la frequenza, misurarne il rendimento e prevenire le frodi. Le norme di Google lo descrivono: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Norme di Google per i siti partner</a> e <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Norme sulla privacy di Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Consenso (GDPR) e annunci personalizzati",
      html: `<p>Se si trova nello Spazio Economico Europeo, nel Regno Unito o in Svizzera, al primo avvio mostriamo una finestra di consenso (Google User Messaging Platform), dove decide in merito agli annunci personalizzati. Senza il Suo consenso, vengono mostrati solo annunci <b>non personalizzati</b>. Può modificare o revocare il Suo consenso in qualsiasi momento cancellando i dati dell'applicazione nelle impostazioni di sistema o reimpostando l'ID pubblicitario nelle impostazioni di Android. La base giuridica per gli annunci personalizzati è il consenso, art. 6(1)(a) GDPR, e per la lettura o l'archiviazione di informazioni sul dispositivo inoltre il § 25(1) TDDDG (legge tedesca sulla protezione dei dati nelle telecomunicazioni e nei servizi digitali). Annunci non personalizzati: legittimo interesse a finanziare l'app gratuita, art. 6(1)(f) GDPR.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analisi dell'applicazione (Firebase / Google Analytics)",
      html: `<p>L'App utilizza <b>Google Analytics for Firebase</b> per misurare in modo anonimo e aggregato come vengono utilizzate le sue funzioni (ad es. quali calcolatrici apre, il numero di utenti attivi). Questo ci aiuta a migliorare LiczMat. L'analisi è <b>disattivata</b> per impostazione predefinita e viene attivata solo dopo aver prestato il consenso nella stessa finestra (Google User Messaging Platform). Senza il consenso, non viene raccolto nulla. I dati sono trattati da Google in conformità con le <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Norme sulla privacy di Google</a>. La base giuridica è il consenso, art. 6(1)(a) GDPR e § 25(1) TDDDG; il consenso può essere revocato in qualsiasi momento con effetto per il futuro.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Posizione e ricerca negozi (Google Maps / Places)",
      html: `<p>La funzione «Trova un negozio» utilizza <b>Google Maps</b> e <b>Google Places</b>. Se concede l'autorizzazione di accesso alla posizione, l'App utilizza la Sua posizione approssimativa o precisa per mostrare i negozi di materiali edili nelle vicinanze e calcolare il percorso. Le richieste ai servizi di mappe sono trattate da Google in conformità con le loro norme sulla privacy. Può rifiutare l'accesso alla posizione. In tal caso, i negozi non verranno cercati automaticamente, ma tutte le altre funzioni continueranno a funzionare senza modifiche. Non memorizziamo la Sua posizione, né sul dispositivo né nell'account.</p>`
    },
    {
      id: "strona",
      h: "6. Il Sito web",
      html: `<p>Il sito web <b>liczmat.com</b> è statico. Quando si apre il sito, l'host Firebase Hosting (Google LLC) elabora i dati di log standard del server (indirizzo IP, ora, pagina richiesta, browser) per fornire il sito in modo sicuro; base giuridica art. 6(1)(f) GDPR (legittimo interesse per un sito web sicuro e affidabile). Utilizza <b>Google Analytics</b> (GA4) per misurare in modo anonimo e aggregato il traffico (ad es. quante persone visitano il Sito web e quante passano a Google Play), in modo da poterlo migliorare. L'analisi è disattivata per impostazione predefinita: in conformità con il GDPR, chiediamo prima il Suo consenso e Google Analytics (inclusa l'impostazione dei cookie) si avvia solo dopo averlo concesso. Può rifiutare e tutte le altre funzioni rimarranno utilizzabili. La base giuridica è il consenso, art. 6(1)(a) GDPR e § 25(1) TDDDG; revoca in qualsiasi momento tramite le impostazioni dei cookie/consenso sul sito, con effetto per il futuro. A parte Analytics, il Sito web non utilizza web font. Tutto il resto del codice e degli stili viene fornito dal dominio del Sito web e le calcolatrici interattive eseguono i calcoli esclusivamente nel Suo browser.</p><p>Fanno eccezione i punti in cui sono integrati servizi esterni. <b>Negozi:</b> Il Sito web incorpora una mappa di <b>Google Maps</b>, che viene caricata dai server di Google. Se condivide la Sua posizione, questa viene utilizzata solo per centrare la mappa e non viene memorizzata da nessuna parte. Per mostrare l'elenco dei negozi più vicini, il Sito web invia le Sue coordinate approssimative al servizio <b>OpenStreetMap (Overpass API)</b> e recupera i dati pubblici dei negozi. Il pulsante «Naviga» apre il percorso in Google Maps. I suggerimenti delle città in base ai codici postali utilizzano un database GeoNames (geonames.org), CC BY 4.0, ospitato direttamente sul nostro server, e nessuna terza parte riceve il codice postale inserito. La base giuridica è l'art. 6(1)(a) GDPR quando il visitatore condivide la posizione, altrimenti la mappa si carica solo quando il visitatore apre la ricerca dei negozi. <b>/app/:</b> Dopo l'accesso, il Sito web si connette a <b>Firebase</b> (Autenticazione e Firestore) alle condizioni di cui alla sezione 3 e memorizza i dati di accesso nel browser in modo che non Le venga richiesta la password a ogni visita. <b>/p/&lt;token&gt;:</b> Il Sito web preleva la copia condivisa di un preventivo da Firestore senza eseguire l'accesso e senza raccogliere dati sulla persona che apre il link. Entrambe queste sottopagine sono escluse dall'indicizzazione.</p><p><b>Progetti, stanze e preventivi salvati sul Sito web senza effettuare l'accesso</b> rimangono esclusivamente nella memoria locale del Suo browser (localStorage) e non vengono inviati da nessuna parte. Non li vediamo e non vi abbiamo accesso. Li elimina cancellando i dati del sito nel Suo browser. Vanno nel cloud solo quando accede al Suo account e fa clic su «Invia dal browser all'account». Da quel momento in poi si applica la sezione 3. Memorizziamo nel browser anche la Sua scelta della lingua, la scelta della valuta, la scelta del tema e la Sua decisione in merito al consenso per l'analisi.</p>`
    },
    {
      id: "komu",
      h: "7. A chi comunichiamo i dati",
      html: `<p>Non vendiamo dati e non creiamo profili utente. I dati sopra descritti sono trattati da <b>Google</b> in qualità di responsabile del trattamento: AdMob (annunci), Maps e Places (mape e negozi), Analytics (statistiche) e, se crea un account, Firebase Authentication, Cloud Firestore e Firebase Hosting (account e sincronizzazione). Inoltre, dopo la creazione dell'account, invieremo un'e-mail di benvenuto una tantum al Suo indirizzo e-mail nella lingua della pagina in cui è stato creato l'account. Questa e-mail viene elaborata e inviata tramite i server di <b>OVH SAS</b> (Francia, UE), il nostro fornitore di servizi e-mail, che agisce in qualità di responsabile del trattamento per nostro conto, ai sensi dell'art. 6, par. 1, lett. b) GDPR. Altrimenti condividiamo i dati solo con le persone a cui Lei stesso fornisce il link al preventivo (sezione 3.5) e quando la legge applicabile lo richiede.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Pagamenti (Stripe)",
      html: `<p>L'abbonamento <b>LiczMat Pro</b> è gestito da <b>Stripe</b> (Stripe Payments Europe, Ltd., Irlanda). Se decide di acquistarlo, verrà reindirizzato alla pagina di pagamento di Stripe. Stripe, in qualità di titolare del trattamento indipendente, riceve e tratta i dati di pagamento: numero di carta, dati di fatturazione e cronologia dei pagamenti. <b>Non vediamo e non memorizziamo il numero della Sua carta.</b> Il Suo indirizzo e-mail e l'ID account (UID) vengono inviati a Stripe in modo che l'abbonamento a pagamento possa essere assegnato all'account corretto. In cambio, riceviamo solo lo stato del piano (Gratuito o Pro), la sua data di scadenza e se l'abbonamento si rinnoverà. Gestisce le fatture, le modifiche della carta e le cancellazioni nel portale clienti di Stripe. L'informativa sulla privacy di Stripe è disponibile all'indirizzo: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Trasferimento di dati al di fuori del SEE",
      html: `<p>Google LLC (responsabile per Firebase Authentication, Google Analytics, AdMob, Maps, Places e Firebase Hosting, che ospita il nostro sito web ed elabora i log standard del server, inclusi gli indirizzi IP) è una società statunitense. Il trasferimento dei Suoi dati negli Stati Uniti si basa sulla <b>decisione di adeguatezza della Commissione Europea per l'EU-US Data Privacy Framework</b>, in quanto la società è certificata. Inoltre, si basa su <b>clausole contrattuali standard</b> incluse nei suoi termini di trattamento dei dati (Google Cloud Data Processing Addendum).</p>`
    },
    {
      id: "prawa",
      h: "9. I Suoi diritti (GDPR)",
      html: `<p>Ai sensi del GDPR, ha il diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione, nonché il diritto di revocare il Suo consenso agli annunci personalizzati e all'analisi. <b>Ove il trattamento si basi sull'art. 6(1)(f) GDPR, è possibile opporsi in qualsiasi momento per motivi connessi alla propria situazione particolare (art. 21 GDPR).</b></p><p>Lei controlla direttamente i dati che rimangono sul dispositivo (dati dell'app, autorizzazioni, ID pubblicitario nelle impostazioni di Android). Può esaminare e modificare i dati dell'account nell'App o su <a href="/app/">liczmat.com/app/</a>, esportarli tramite la funzione di backup ed eliminarli rimuovendo le singole voci o richiedendo l'eliminazione dell'intero account (sezione 3.6). Per domande relative ai Suoi dati, scriva a: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Ha inoltre il diritto di proporre reclamo all'autorità di controllo competente: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, o all'autorità di controllo per la protezione dei dati del Suo paese di residenza all'interno dell'UE.</p>`
    },
    {
      id: "dzieci",
      h: "10. Minori",
      html: `<p>L'App non è rivolta ai minori e non raccogliamo consapevolmente dati da persone di età inferiore a 13 anni. Un account LiczMat è destinato a persone di età pari o superiore a 16 anni o con il consenso dei loro rappresentanti legali.</p>`
    },
    {
      id: "zmiany",
      h: "11. Modifiche e contatti",
      html: `<p>Potremmo aggiornare la presente informativa. Notificheremo le modifiche significative nell'App o su Google Play. La data dell'ultimo aggiornamento si trova all'inizio del documento. Contatti: <b>${ENTITY.name}</b>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
