import { ENTITY } from "../site.mjs";

export default {
  lang: "nl",
  title: "Privacybeleid",
  updated: "2026-10-02",
  binding: false,
  translationNote: "Dit is een vertaling. De Duitse versie is bindend.",
  sections: [
    {
      id: "podejscie",
      h: "1. Benadering van privacy",
      html: `<p>Dit beleid beschrijft welke gegevens de mobiele applicatie <b>LiczMat, bouwmaterialen calculator</b> ('de App') en de website <b>liczmat.com</b> ('de Website') verwerken en voor welk doel. De verwerkingsverantwoordelijke is <b>${ENTITY.name}</b>, ${ENTITY.address} ('wij'), contact: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat werkt volgens het <b>offline-first</b> principe. Alle berekeningen worden uitgevoerd op uw apparaat en werken zonder internet. De lokale database is de enige bron van waarheid, de cloud is slechts een kopie ervan.</p><p><b>Een account is optioneel.</b> U hoeft niet in te loggen voor berekeningen. Zolang u geen account aanmaakt, sturen wij uw projecten of berekeningen naar geen enkele server. Een back-up is een bestand dat u zelf exporteert en opslaat. Als u ervoor kiest om een account aan te maken, worden de hieronder beschreven gegevens naar <b>Google Firebase</b> gestuurd. Zie sectie 3 voor details.</p><p>De App gebruikt ook andere <b>Google</b>-diensten (advertenties en kaarten / zoeken naar winkels), die bepaalde gegevens verwerken. Dit beschrijven we hieronder.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Gegevens opgeslagen op het apparaat",
      html: `<p>Lokaal op uw apparaat slaan we op: projecten, berekeningen, boodschappenlijstjes, kamers, aangepaste materialen en instellingen (bijv. taal, valuta, thema, aannemersgegevens). Door de App te verwijderen of de gegevens ervan te wissen, wordt deze informatie permanent van het apparaat verwijderd. U maakt en bewaart zelf de back-up (export naar een bestand).</p><p><b>De materialencatalogus, uw aangepaste materialen en prijzen, evenals de instellingen worden niet gesynchroniseerd.</b> Ze blijven uitsluitend op het apparaat, zelfs als u een account heeft.</p>`
    },
    {
      id: "konto",
      h: "3. LiczMat-account en synchronisatie (optioneel)",
      html: `<p>U kunt een <b>LiczMat-account</b> aanmaken om dezelfde projecten op uw smartphone en in uw browser te hebben (<a href="/app/">liczmat.com/app/</a>). Het account is gratis en volledig vrijwillig. Zonder account werken de App en de Website zoals voorheen.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Welke gegevens we verwerken als u een account heeft",
      html: `<ul><li><b>E-mailadres en wachtwoord.</b> Beheerd door <b>Firebase Authentication</b>. Wij zien of bewaren uw wachtwoord niet, Google slaat het op als een hash. Het inlogvenster van Google en de pagina's die worden geopend via links in account-e-mails (bijv. wachtwoord resetten, e-mailbevestiging) worden verzorgd door <b>auth.liczmat.com</b>, een Firebase Hosting (Google) dienst binnen hetzelfde project.</li><li><b>Inloggen met Google</b> (optioneel alternatief voor wachtwoord). In dit geval is er geen wachtwoord. We ontvangen het e-mailadres, de weergavenaam en een account-ID van Google om deze te koppelen aan uw gegevens in LiczMat (de weergavenaam wordt gebruikt in de welkomst-e-mail). We halen geen andere gegevens uit uw Google-account.</li><li><b>De account-ID (UID)</b> toegewezen door Firebase.</li><li><b>Accountinhoud:</b> projecten, kamers, schattingen en boodschappenlijstjes. Namen, hoeveelheden, eenheden, prijzen, valuta, invoergegevens in de calculator, evenals de tijdstempels van aanmaak en wijziging.</li><li><b>Technische gegevens:</b> aanmaakdatum van het account, datum van laatste gebruik en of u verbinding maakt via de App of de Website.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Waar de gegevens worden opgeslagen",
      html: `<p>De <b>Google Cloud Firestore</b>-database en <b>Cloud Functions</b>-diensten draaien in de regio <b>europe-central2 (Warschau)</b>, d.w.z. binnen de Europese Unie. De dienst <b>Firebase Authentication</b> (uw inloggegevens, zoals e-mailadres, weergavenaam, wachtwoord-hash en Google-account-ID) draait echter op de wereldwijde infrastructuur van Google, waardoor deze gegevens in de Verenigde Staten kunnen worden verwerkt (zie sectie 8). Google treedt hier op als verwerker namens ons.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Wie toegang heeft",
      html: `<p>Uitsluitend de accounteigenaar. De beveiligingsregels van Firestore staan het lezen en schrijven van accountgegevens alleen toe aan de ingelogde gebruiker met dezelfde ID. De enige uitzondering is een link die u zelf aanmaakt. Zie sectie 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Hoe synchronisatie werkt",
      html: `<p>Na elke lokale wijziging stuurt de App het document naar Firestore en haalt de wijzigingen uit de cloud terug naar de database van het apparaat. Bij een conflict wint de nieuwste invoer (door tijdstempels te vergelijken). Het verwijderen van een record verwijdert deze niet onmiddellijk uit de cloud: het document wordt gemarkeerd als verwijderd zodat het andere apparaat op de hoogte is van de verwijdering en het niet herstelt. Deze markeringen worden na <b>30 dagen</b> verwijderd.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Een schatting delen via een link",
      html: `<p>Als u op 'Delen' tikt, maken we een <b>kopie</b> van het geselecteerde project (naam, schattingen, boodschappenlijstje, valuta) op een willekeurig 128-bit adres liczmat.com/p/&lt;token&gt;. Deze kopie is <b>publiek leesbaar voor iedereen die de link kent</b>. De token in het adres is de enige beveiliging, dus deel deze alleen met mensen die de schatting mogen zien. De kopie wordt niet automatisch bijgewerkt, u moet deze handmatig bijwerken via een knop. Het verwijderen van de link trekt de toegang onmiddellijk in. De persoon die de link opent, heeft geen account nodig en we verzamelen geen gegevens over hem of haar, behalve de standaard Website-analyse (sectie 6).</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Hoe lang we gegevens bewaren en hoe u ze kunt verwijderen",
      html: `<p>We bewaren accountgegevens zolang het account bestaat. U kunt individuele projecten en kamers op elk moment verwijderen. U kunt het gehele account zelf verwijderen op <a href="/app/">liczmat.com/app/</a> → tabblad <b>Account</b> → <b>Account verwijderen</b>. Hiermee worden alle accountdocumenten in Firestore (projecten, kamers, schattingen, boodschappenlijstjes en aangemaakte links) en uiteindelijk het account zelf in Firebase Authentication verwijderd. Deze actie kan niet ongedaan worden gemaakt. In hetzelfde tabblad kunt u vooraf de volledige inhoud van uw account downloaden als een JSON-bestand. Als u wilt dat wij dit voor u doen, schrijf dan naar <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Gegevens die op uw apparaat of in uw browser zijn opgeslagen, verwijdert u afzonderlijk door de app-gegevens of sitegegevens te wissen.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Rechtsgrondslag",
      html: `<p>De verwerking van accountgegevens is noodzakelijk voor de uitvoering van de door u gevraagde dienst. art. 6 lid 1 onder b AVG (uitvoering van een overeenkomst). Het aanmaken van een account is vrijwillig, zonder dit kunt u alle functies van de calculator gebruiken.</p>`
    },
    {
      id: "reklamy",
      h: "4. Advertenties (Google AdMob)",
      html: `<p>De App is gratis en wordt ondersteund door advertenties van <b>Google AdMob</b>. Daarom kan Google, als advertentieprovider, de volgende gegevens verzamelen en verwerken:</p><ul><li><b>advertentie-ID</b> (Android Advertising ID),</li><li>IP-adres en apparaatgegevens (model, besturingssysteem, taalinstellingen),</li><li>geschatte locatie (op basis van IP-adres),</li><li>informatie over interactie met advertenties (weergaven, klikken).</li></ul><p>Deze gegevens worden gebruikt om advertenties weer te geven, de frequentie ervan te beperken, de prestaties te meten en fraude te voorkomen. Het beleid van Google beschrijft dit: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Google's beleid voor partnersites</a> en <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacybeleid van Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Toestemming (AVG) en gepersonaliseerde advertenties",
      html: `<p>Als u zich in de Europese Economische Ruimte, het Verenigd Koninkrijk of Zwitserland bevindt, tonen we bij de eerste lancering een toestemmingsvenster (Google User Messaging Platform), waar u beslist over gepersonaliseerde advertenties. Zonder uw toestemming worden alleen <b>niet-gepersonaliseerde</b> advertenties getoond. U kunt uw toestemming op elk moment wijzigen of intrekken door de app-gegevens te wissen in de systeeminstellingen of door de advertentie-ID opnieuw in te stellen in de Android-instellingen. De wettelijke basis voor gepersonaliseerde advertenties is toestemming, art. 6(1)(a) AVG, en voor het lezen of opslaan van informatie op het apparaat daarnaast § 25(1) TDDDG (Duitse wet inzake gegevensbescherming in telecommunicatie en digitale diensten). Niet-gepersonaliseerde advertenties: gerechtvaardigd belang bij het financieren van de gratis app, art. 6(1)(f) AVG.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. App-analyse (Firebase / Google Analytics)",
      html: `<p>De App maakt gebruik van <b>Google Analytics for Firebase</b> om anoniem en geaggregeerd te meten hoe de functies worden gebruikt (bijv. welke calculators u opent, het aantal actieve gebruikers). Dit helpt ons om LiczMat te verbeteren. De analyse is standaard <b>uitgeschakeld</b> en wordt pas geactiveerd nadat u uw toestemming heeft gegeven in hetzelfde venster (Google User Messaging Platform). Zonder toestemming wordt er niets verzameld. De gegevens worden door Google verwerkt in overeenstemming met het <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacybeleid van Google</a>. De wettelijke basis is toestemming, art. 6(1)(a) AVG en § 25(1) TDDDG; toestemming kan op elk moment worden ingetrokken met werking voor de toekomst.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Locatie en winkels zoeken (Google Maps / Places)",
      html: `<p>De functie 'Winkel vinden' maakt gebruik van <b>Google Maps</b> en <b>Google Places</b>. Als u toestemming geeft voor locatietoegang, gebruikt de App uw geschatte of exacte locatie om nabijgelegen bouwmarkten te tonen en de route te berekenen. Verzoeken aan kaartdiensten worden door Google verwerkt in overeenstemming met hun privacybeleid. U kunt locatietoegang weigeren. In dat geval worden winkels niet automatisch gezocht, maar alle andere functies werken zonder wijzigingen. Wij slaan uw locatie niet op, niet op het apparaat en niet in het account.</p>`
    },
    {
      id: "strona",
      h: "6. De Website",
      html: `<p>De website <b>liczmat.com</b> is statisch. Wanneer de site wordt geopend, verwerkt de host GitHub Pages (GitHub, Inc.) standaard serverloggegevens (IP-adres, tijd, opgevraagde pagina, browser) om de site veilig te leveren; wettelijke basis art. 6(1)(f) AVG (gerechtvaardigd belang bij een veilige en betrouwbare website). Het maakt gebruik van <b>Google Analytics</b> (GA4) om verkeer anoniem en geaggregeerd te meten (bijv. hoeveel mensen de Website bezoeken en hoeveel er doorklikken naar Google Play), zodat we het kunnen verbeteren. De analyse is standaard uitgeschakeld: in overeenstemming met de AVG vragen we eerst uw toestemming, en Google Analytics (inclusief het plaatsen van cookies) start pas nadat u deze heeft verleend. U kunt weigeren, en alle andere functies blijven bruikbaar. De wettelijke basis is toestemming, art. 6(1)(a) AVG en § 25(1) TDDDG; intrekking op elk moment via de cookie/toestemmingsinstelling op de site, met werking voor de toekomst. Naast Analytics gebruikt de Website geen weblettertypen. Alle andere code en stijlen worden geleverd vanaf het domein van de Website, en interactieve calculators voeren berekeningen uitsluitend in uw browser uit.</p><p>Uitzonderingen zijn plaatsen waar externe diensten zijn geïntegreerd. <b>Winkels:</b> De Website sluit een <b>Google Maps</b> kaart in, die wordt geladen vanaf de servers van Google. Als u uw locatie deelt, wordt deze alleen gebruikt om de kaart te centreren en nergens opgeslagen. Om de lijst met de dichtstbijzijnde winkels te tonen, stuurt de Website uw geschatte coördinaten naar de <b>OpenStreetMap (Overpass API)</b> dienst en haalt openbare winkelgegevens op. De knop 'Navigeren' opent de route in Google Maps. Stadssuggesties op basis van postcodes maken gebruik van een GeoNames-database (geonames.org), CC BY 4.0, die rechtstreeks op onze server wordt gehost, en geen enkele derde partij ontvangt de ingevoerde postcode. De wettelijke basis is art. 6(1)(a) AVG wanneer de bezoeker de locatie deelt, anders laadt de kaart pas wanneer de bezoeker de winkelzoeker opent. <b>/app/:</b> Na het inloggen maakt de Website verbinding met <b>Firebase</b> (Authenticatie en Firestore) onder de voorwaarden van sectie 3 en slaat inloggegevens op in de browser zodat u niet bij elk bezoek om een wachtwoord wordt gevraagd. <b>/p/&lt;token&gt;:</b> De Website haalt de gedeelde kopie van een schatting op uit Firestore zonder in te loggen en zonder gegevens te verzamelen over de persoon die de link opent. Beide subpagina's zijn uitgesloten van indexering.</p><p><b>Projecten, kamers en schattingen opgeslagen op de Website zonder in te loggen</b> blijven uitsluitend in de lokale opslag van uw browser (localStorage) en worden nergens heen gestuurd. Wij zien ze niet en hebben er geen toegang toe. U verwijdert ze door de sitegegevens in uw browser te wissen. Ze gaan pas naar de cloud als u inlogt op uw account en zelf op 'Verzenden vanuit browser naar account' klikt. Vanaf dat moment is sectie 3 van toepassing. We slaan ook uw taalkeuze, valutakeuze, themakeuze en uw beslissing over toestemming voor analyse op in de browser.</p>`
    },
    {
      id: "komu",
      h: "7. Met wie we gegevens delen",
      html: `<p>We verkopen geen gegevens en we maken geen gebruikersprofielen aan. De hierboven beschreven gegevens worden door <b>Google</b> verwerkt als verwerker: AdMob (advertenties), Maps en Places (kaarten en winkels), Analytics (statistieken) en, als u een account aanmaakt, Firebase Authentication, Cloud Firestore en Firebase Hosting (account en synchronisatie). Daarnaast sturen wij u na het aanmaken van het account een eenmalige welkomst-e-mail naar uw e-mailadres in de taal van de pagina waarop het account is aangemaakt. Deze e-mail wordt verwerkt en verzonden via de servers van <b>OVH SAS</b> (Frankrijk, EU), onze e-mailserviceprovider, die optreedt als verwerker namens ons, op basis van art. 6 lid 1 onder b AVG. Verder delen wij de gegevens alleen met personen aan wie u zelf de schattingslink verstrekt (sectie 3.5) en wanneer de toepasselijke wetgeving dit vereist.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Betalingen (Stripe)",
      html: `<p>Het <b>LiczMat Pro</b>-abonnement wordt beheerd door <b>Stripe</b> (Stripe Payments Europe, Ltd., Ierland). Als u besluit dit te kopen, wordt u doorgestuurd naar de betaalpagina van Stripe. Stripe, als onafhankelijke verwerkingsverantwoordelijke, ontvangt en verwerkt de betaalgegevens: kaartnummer, factuurgegevens en betalingsgeschiedenis. <b>Wij zien of bewaren uw kaartnummer niet.</b> Uw e-mailadres en account-ID (UID) worden naar Stripe gestuurd zodat het betaalde abonnement aan het juiste account kan worden toegewezen. In ruil daarvoor ontvangen we alleen de abonnementsstatus (Gratis of Pro), de vervaldatum ervan en of het abonnement wordt verlengd. U beheert uw facturen, kaartwijzigingen en annuleringen in het klantenportaal van Stripe. Het privacybeleid van Stripe is beschikbaar op: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Gegevensoverdrachten buiten de EER",
      html: `<p>Google LLC (verantwoordelijk voor Firebase Authentication, Google Analytics, AdMob, Maps, Places en Firebase Hosting) en GitHub, Inc. (dat onze website host en standaard serverlogboeken verwerkt, inclusief IP-adressen) zijn Amerikaanse bedrijven. De overdracht van uw gegevens naar de VS is gebaseerd op het <b>adequaatheidsbesluit van de Europese Commissie voor het EU-US Data Privacy Framework</b>, aangezien beide bedrijven gecertificeerd zijn. Daarnaast is het gebaseerd op <b>standaardcontractbepalingen</b> die zijn opgenomen in hun voorwaarden voor gegevensverwerking (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Uw rechten (AVG)",
      html: `<p>Onder de AVG heeft u recht op inzage, rectificatie, verwijdering, beperking van de verwerking, dataportabiliteit en bezwaar, evenals het recht om uw toestemming voor gepersonaliseerde advertenties en analyse in te trekken. <b>Wanneer de verwerking is gebaseerd op art. 6(1)(f) AVG, kunt u te allen tijde bezwaar maken om redenen die verband houden met uw specifieke situatie (art. 21 AVG).</b></p><p>U beheert rechtstreeks de gegevens die op het apparaat blijven (app-gegevens, machtigingen, advertentie-ID in Android-instellingen). U kunt accountgegevens inzien en wijzigen in de App of op <a href="/app/">liczmat.com/app/</a>, exporteren via de back-upfunctie, en ze verwijderen door individuele records te verwijderen of te verzoeken om verwijdering van het hele account (sectie 3.6). Voor vragen over uw gegevens, schrijf naar: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. U heeft ook het recht om een klacht in te dienen bij de bevoegde toezichthoudende autoriteit: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, of bij de toezichthoudende autoriteit voor gegevensbescherming in uw land van verblijf binnen de EU.</p>`
    },
    {
      id: "dzieci",
      h: "10. Kinderen",
      html: `<p>De App is niet gericht op kinderen en wij verzamelen niet bewust gegevens van personen jonger dan 13 jaar. Een LiczMat-account is bedoeld voor personen van 16 jaar of ouder, of met toestemming van hun wettelijke vertegenwoordigers.</p>`
    },
    {
      id: "zmiany",
      h: "11. Wijzigingen en contact",
      html: `<p>We kunnen dit beleid updaten. Bij belangrijke wijzigingen zullen we een melding doen in de App of op Google Play. De datum van de laatste update staat bovenaan het document. Contact: <b>${ENTITY.name}</b>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
