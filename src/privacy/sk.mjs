import { ENTITY } from "../site.mjs";

export default {
  lang: "sk",
  title: "Zásady ochrany osobných údajov",
  updated: "2026-10-02",
  binding: false,
  translationNote: "Toto je preklad. Záväzná je nemecká verzia.",
  sections: [
    {
      id: "podejscie",
      h: "1. Prístup k ochrane osobných údajov",
      html: `<p>Tieto zásady popisujú, aké údaje spracúva mobilná aplikácia <b>LiczMat, kalkulačka stavebných materiálov</b> („aplikácia“) a webová stránka <b>liczmat.com</b> („webová stránka“) a za akým účelom. Prevádzkovateľom údajov je <b>${ENTITY.name}</b>, ${ENTITY.address} („my“), kontakt: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funguje na princípe <b>offline-first</b>. Všetky výpočty prebiehajú na vašom zariadení a fungujú bez internetu. Lokálna databáza je jediným zdrojom pravdy, cloud je iba jej kópiou.</p><p><b>Účet je voliteľný.</b> Pre výpočty sa nemusíte prihlasovať. Kým si nevytvoríte účet, neodosielame vaše projekty ani výpočty na žiadny server. Záloha je súbor, ktorý si sami exportujete a uložíte. Ak sa rozhodnete vytvoriť si účet, nižšie popísané údaje budú odoslané do služby <b>Google Firebase</b>. Ďalšie podrobnosti nájdete v časti 3.</p><p>Aplikácia využíva aj ďalšie služby <b>Google</b> (reklamy a mapy/vyhľadávanie obchodov), ktoré spracúvajú určité údaje. To popisujeme nižšie.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Údaje uložené v zariadení",
      html: `<p>Lokálne vo vašom zariadení ukladáme: projekty, výpočty, nákupné zoznamy, miestnosti, vlastné materiály a nastavenia (napr. jazyk, mena, motív, údaje o dodávateľovi). Odinštalovaním aplikácie alebo vymazaním jej dát tieto informácie zo zariadenia natrvalo odstránite. Zálohu (export do súboru) si vytvárate a uchovávate sami.</p><p><b>Katalóg materiálov, vaše vlastné materiály a ceny, ako aj nastavenia sa nesynchronizujú.</b> Zostávajú výhradne v zariadení, aj keď máte účet.</p>`
    },
    {
      id: "konto",
      h: "3. Účet LiczMat a synchronizácia (voliteľné)",
      html: `<p>Môžete si vytvoriť <b>účet LiczMat</b>, aby ste mali rovnaké projekty v smartfóne aj v prehliadači (<a href="/app/">liczmat.com/app/</a>). Účet je bezplatný a úplne dobrovoľný. Bez účtu fungujú aplikácia a webová stránka ako doteraz.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Aké údaje spracúvame, ak máte účet",
      html: `<ul><li><b>E-mailová adresa a heslo.</b> Spravuje <b>Firebase Authentication</b>. Vaše heslo nevidíme a neuchovávame, Google ho ukladá ako hash. Prihlasovacie okno Google a stránky otvárané z odkazov v e-mailoch účtu (napr. obnovenie hesla, potvrdenie e-mailu) poskytuje <b>auth.liczmat.com</b>, služba Firebase Hosting (Google) v rámci rovnakého projektu.</li><li><b>Prihlásenie cez Google</b> (voliteľná alternatíva k heslu). V tomto prípade neexistuje heslo. Od Googlu získame e-mailovú adresu, zobrazované meno a ID účtu, aby sme ich mohli prepojiť s vašimi údajmi v LiczMat (zobrazované meno sa používa v uvítacom e-maile). Nezískavame žiadne iné údaje z vášho účtu Google.</li><li><b>ID účtu (UID)</b> pridelené službou Firebase.</li><li><b>Obsah účtu:</b> projekty, miestnosti, odhady a nákupné zoznamy. Názvy, množstvá, jednotky, ceny, mena, vstupy do kalkulačky a časové pečiatky vytvorenia a zmeny.</li><li><b>Technické údaje:</b> dátum vytvorenia účtu, dátum posledného použitia a informácie o tom, či sa pripájate cez aplikáciu alebo webovú stránku.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Kde sú údaje uložené",
      html: `<p>Databáza <b>Google Cloud Firestore</b> a služby <b>Cloud Functions</b> bežia v regióne <b>europe-central2 (Varšava)</b>, teda v rámci Európskej únie. Služba <b>Firebase Authentication</b> (vaše prihlasovacie údaje, ako je e-mailová adresa, zobrazované meno, hash hesla a ID účtu Google) však beží na globálnej infraštruktúre Googlu, takže tieto údaje môžu byť spracúvané v Spojených štátoch (pozrite časť 8). Google tu vystupuje ako sprostredkovateľ v našom mene.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Kto k nim má prístup",
      html: `<p>Výhradne majiteľ účtu. Bezpečnostné pravidlá Firestore umožňujú čítať a zapisovať údaje účtu iba prihlásenému používateľovi s rovnakým ID. Jedinou výnimkou je odkaz, ktorý sami vytvoríte. Pozrite časť 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Ako funguje synchronizácia",
      html: `<p>Po každej lokálnej zmene aplikácia odošle dokument do Firestore a zmeny z cloudu stiahne späť do databázy zariadenia. V prípade konfliktu vyhráva novší záznam (porovnanie časových pečiatok). Zmazanie záznamu ho okamžite neodstráni z cloudu: dokument je označený ako zmazaný, aby sa o zmazaní dozvedelo aj druhé zariadenie a neobnovilo ho. Tieto značky sú odstránené po <b>30 dňoch</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Zdieľanie odhadu pomocou odkazu",
      html: `<p>Ak kliknete na „Zdieľať“, vytvoríme <b>kópiu</b> vybraného projektu (názov, odhady, nákupný zoznam, mena) na náhodnej 128-bitovej adrese liczmat.com/p/&lt;token&gt;. Táto kópia je <b>verejne čitateľná pre kohokoľvek, kto pozná odkaz</b>. Token v adrese je jedinou ochranou, preto ho zdieľajte iba s osobami, ktoré by mali odhad vidieť. Kópia sa neaktualizuje automaticky, musíte ju aktualizovať ručne pomocou tlačidla. Zmazaním odkazu sa prístup okamžite zruší. Osoba, ktorá odkaz otvorí, nepotrebuje účet a nezhromažďujeme o nej žiadne údaje okrem štandardnej analytiky webovej stránky (časť 6).</p>`
    },
    {
      id: "konto-calendar-link",
      h: "3.5.1. Súkromný odkaz na kalendár",
      html: `<p>Ak vytvoríte súkromný odkaz na kalendár, každý, kto pozná túto adresu, si môže prečítať otvorené termíny z vášho kalendára vrátane názvu, dátumu, klienta a poznámky. Vytvorením nového odkazu sa starý vypne.</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Ako dlho údaje uchovávame a ako ich zmazať",
      html: `<p>Údaje účtu uchovávame po dobu existencie účtu. Jednotlivé projekty a miestnosti môžete kedykoľvek zmazať a celý účet môžete zmazať sami: <a href="/app/">liczmat.com/app/</a> → záložka <b>Účet</b> → <b>Zmazať účet</b>. Tým sa zmažú všetky dokumenty účtu vo Firestore (projekty, miestnosti, odhady, nákupné zoznamy a vytvorené odkazy) a nakoniec aj samotný účet vo Firebase Authentication. Túto akciu nie je možné vrátiť späť. Na rovnakej záložke si môžete vopred stiahnuť celý obsah účtu ako súbor JSON. Ak chcete, aby sme to urobili za vás, napíšte na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Údaje uložené vo vašom zariadení alebo v prehliadači zmažete samostatne vymazaním dát aplikácie alebo dát webu.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Právny základ",
      html: `<p>Spracúvanie údajov účtu je nevyhnutné pre plnenie služby, ktorú požadujete. čl. 6 ods. 1 písm. b) GDPR (plnenie zmluvy). Vytvorenie účtu je dobrovoľné, bez neho môžete využívať všetky funkcie kalkulačky.</p>`
    },
    {
      id: "reklamy",
      h: "4. Reklamy (Google AdMob)",
      html: `<p>Aplikácia je bezplatná a je podporovaná reklamami poskytovanými službou <b>Google AdMob</b>. Preto môže Google ako poskytovateľ reklamy zhromažďovať a spracúvať:</p><ul><li><b>reklamné ID</b> (Android Advertising ID),</li><li>IP adresu a údaje o zariadení (model, operačný systém, jazykové nastavenia),</li><li>približnú polohu (na základe IP adresy),</li><li>informácie o interakcii s reklamou (zobrazenia, kliknutia).</li></ul><p>Tieto údaje sa používajú na zobrazovanie reklám, obmedzenie ich frekvencie, meranie výkonu a prevenciu podvodov. Zásady Googlu to popisujú: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Zásady Googlu pre partnerské weby</a> a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Zásady ochrany súkromia Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Súhlas (GDPR) a personalizované reklamy",
      html: `<p>Ak sa nachádzate v Európskom hospodárskom priestore, v Spojenom kráľovstve alebo vo Švajčiarsku, pri prvom spustení zobrazíme okno pre súhlas (Google User Messaging Platform), kde sa rozhodnete o personalizovaných reklamách. Bez vášho súhlasu sa zobrazujú iba <b>nepersonalizované</b> reklamy. Svoj súhlas môžete kedykoľvek zmeniť alebo odvolať vymazaním dát aplikácie v nastaveniach systému alebo resetovaním reklamného ID v nastaveniach systému Android. Právnym základom pre personalizované reklamy je súhlas, čl. 6 ods. 1 písm. a) GDPR, a pre čítanie alebo ukladanie informácií v zariadení navyše § 25 ods. 1 TDDDG (nemecký zákon o ochrane údajov v telekomunikáciách a digitálnych službách). Nepersonalizované reklamy: oprávnený záujem na financovaní bezplatnej aplikácie, čl. 6 ods. 1 písm. f) GDPR.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analytika aplikácie (Firebase / Google Analytics)",
      html: `<p>Aplikácia využíva <b>Google Analytics for Firebase</b> na anonymné a súhrnné meranie toho, ako sa využívajú jej funkcie (napr. ktoré kalkulačky otvárate, počet aktívnych používateľov). To nám pomáha LiczMat zlepšovať. Analytika je predvolene <b>vypnutá</b> a aktivuje sa až po udelení vášho súhlasu v rovnakom okne (Google User Messaging Platform). Bez súhlasu sa nič nezhromažďuje. Údaje sú spracúvané spoločnosťou Google v súlade so <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Zásadami ochrany súkromia Google</a>. Právnym základom je súhlas, čl. 6 ods. 1 písm. a) GDPR a § 25 ods. 1 TDDDG; súhlas možno kedykoľvek odvolať s účinkom do budúcnosti.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Poloha a vyhľadávanie obchodov (Google Maps / Places)",
      html: `<p>Funkcia „Nájsť obchod“ využíva služby <b>Google Maps</b> a <b>Google Places</b>. Ak udelíte súhlas s prístupom k polohe, aplikácia použije vašu približnú alebo presnú polohu na zobrazenie obchodov so stavebninami v okolí a na výpočet trasy. Požiadavky na mapové služby spracúva Google v súlade so svojimi zásadami ochrany súkromia. Prístup k polohe môžete odmietnuť. V takom prípade sa obchody nebudú vyhľadávať automaticky, ale všetky ostatné funkcie budú fungovať bez zmeny. Vašu polohu neukladáme, ani v zariadení, ani v účte.</p>`
    },
    {
      id: "strona",
      h: "6. Webová stránka",
      html: `<p>Webová stránka <b>liczmat.com</b> je statická. Pri otvorení stránky hostiteľ GitHub Pages (GitHub, Inc.) spracúva štandardné údaje zo serverových denníkov (IP adresa, čas, požadovaná stránka, prehliadač) na bezpečné poskytovanie stránky; právny základ čl. 6 ods. 1 písm. f) GDPR (oprávnený záujem na bezpečnej a spoľahlivej webovej stránke). Využíva <b>Google Analytics</b> (GA4) na anonymné a súhrnné meranie návštevnosti (napr. koľko ľudí navštívi webovú stránku a koľko prejde na Google Play), aby sme ju mohli zlepšovať. Analytika je predvolene vypnutá: v súlade s GDPR vás najprv požiadame o súhlas a Google Analytics (vrátane ukladania súborov cookie) sa spustí až po jeho udelení. Môžete odmietnuť a všetky ostatné funkcie zostanú využiteľné. Právnym základom je súhlas, čl. 6 ods. 1 písm. a) GDPR a § 25 ods. 1 TDDDG; odvolanie kedykoľvek prostredníctvom nastavenia súborov cookie/súhlasu na stránke, s účinkom do budúcnosti. Okrem Analytics webová stránka nevyužíva webové písma. Všetok ostatný kód a štýly sú poskytované z domény webovej stránky a interaktívne kalkulačky vykonávajú výpočty výhradne vo vašom prehliadači.</p><p>Výnimkou sú miesta, kde sú integrované externé služby. <b>Obchody:</b> Webová stránka vkladá mapu <b>Google Maps</b>, ktorá sa načíta zo serverov Google. Ak nazdieľate svoju polohu, použije sa iba na vycentrovanie mapy a nikde sa neukladá. Pre zobrazenie zoznamu najbližších obchodov webová stránka odosiela vaše približné súradnice do služby <b>OpenStreetMap (Overpass API)</b> a získava verejné dáta o obchodoch. Tlačidlo „Navigovať“ otvorí trasu v Google Maps. Návrhy miest na základe PSČ využívajú databázu GeoNames (geonames.org), CC BY 4.0, umiestnenú priamo na našom serveri, a zadané PSČ nezíska žiadna tretia strana. Právnym základom je čl. 6 ods. 1 písm. a) GDPR, keď návštevník zdieľa polohu, inak sa mapa načíta až keď návštevník otvorí vyhľadávač obchodov. <b>/app/:</b> Po prihlásení sa webová stránka pripojí k <b>Firebase</b> (overovanie a Firestore) za podmienok uvedených v časti 3 a uloží prihlasovacie údaje v prehliadači, aby ste nemuseli zadávať heslo pri každej návšteve. <b>/p/&lt;token&gt;:</b> Webová stránka získa zdieľanú kópiu odhadu z Firestore bez prihlásenia a bez zhromažďovania údajov o osobe, ktorá odkaz otvorí. Obe tieto podstránky sú vylúčené z indexovania.</p><p><b>Projekty, miestnosti a odhady uložené na webovej stránke bez prihlásenia</b> zostávajú výhradne v lokálnom úložisku vášho prehliadača (localStorage) a nikam sa neodosielajú. Nevidíme ich a nemáme k nim prístup. Zmažete ich vymazaním dát webu v prehliadači. Do cloudu sa dostanú až vtedy, keď sa prihlásite k svojmu účtu a sami kliknete na „Odoslať z prehliadača do účtu“. Od tohto okamihu platí časť 3. V prehliadači ukladáme aj váš výber jazyka, výber meny, výber motívu a vaše rozhodnutie o súhlase s analytikou.</p>`
    },
    {
      id: "komu",
      h: "7. Komu odovzdávame údaje",
      html: `<p>Údaje nepredávame a nevytvárame používateľské profily. Vyššie popísané údaje spracúva spoločnosť <b>Google</b> ako sprostredkovateľ: AdMob (reklamy), Maps a Places (mapy a obchody), Analytics (štatistiky) a, ak si vytvoríte účet, Firebase Authentication, Cloud Firestore a Firebase Hosting (účet a synchronizácia). Okrem toho po vytvorení účtu zašleme na vašu e-mailovú adresu jednorazový uvítací e-mail v jazyku stránky, na ktorej bol účet vytvorený. Tento e-mail spracúvajú a odosielajú servery spoločnosti <b>OVH SAS</b> (Francúzsko, EÚ), nášho poskytovateľa e-mailových služieb, ako sprostredkovateľa v našom mene, a to na základe čl. 6 ods. 1 písm. b) GDPR. Inak zdieľame údaje iba s osobami, ktorým sami poskytnete odkaz na odhad (časť 3.5), a ak to vyžadujú platné právne predpisy.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Platby (Stripe)",
      html: `<p>Predplatné <b>LiczMat Pro</b> spracúva <b>Stripe</b> (Stripe Payments Europe, Ltd., Írsko). Ak sa rozhodnete si ho zakúpiť, budete presmerovaní na platobnú stránku Stripe. Stripe ako nezávislý prevádzkovateľ prijíma a spracúva platobné údaje: číslo karty, fakturačné údaje a históriu platieb. <b>Číslo vašej karty nevidíme a neukladáme.</b> Vaša e-mailová adresa a ID účtu (UID) sú odoslané do Stripe, aby bolo možné zaplatené predplatné priradiť k správnemu účtu. Na oplátku dostávame iba stav tarifu (bezplatný alebo Pro), dátum jeho platnosti a informáciu, či sa predplatné obnoví. Faktúry, zmenu karty a zrušenie spravujete v klientskom portáli Stripe. Zásady ochrany osobných údajov Stripe nájdete na: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Prenos údajov mimo EHP",
      html: `<p>Google LLC (zodpovedná za Firebase Authentication, Google Analytics, AdMob, Maps, Places a Firebase Hosting) a GitHub, Inc. (ktorá hostuje našu webovú stránku a spracúva štandardné protokoly servera, vrátane IP adries) sú americké spoločnosti. Prenos vašich údajov do USA je založený na <b>rozhodnutí Európskej komisie o primeranosti pre EU-US Data Privacy Framework</b>, keďže obe spoločnosti sú certifikované. Okrem toho je založený na <b>štandardných zmluvných doložkách</b> obsiahnutých v ich podmienkach spracúvania údajov (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Vaše práva (GDPR)",
      html: `<p>Podľa GDPR máte právo na prístup, opravu, vymazanie, obmedzenie spracúvania, prenosnosť údajov a namietať, ako aj právo odvolať svoj súhlas s personalizovanými reklamami a analytikou. <b>Ak je spracúvanie založené na čl. 6 ods. 1 písm. f) GDPR, môžete kedykoľvek namietať z dôvodov týkajúcich sa vašej konkrétnej situácie (čl. 21 GDPR).</b></p><p>Údaje, ktoré zostávajú v zariadení, ovládate priamo (dáta aplikácie, oprávnenia, reklamné ID v nastaveniach Androidu). Údaje o účte môžete skontrolovať a zmeniť v aplikácii alebo na <a href="/app/">liczmat.com/app/</a>, exportovať pomocou funkcie zálohovania a odstrániť zmazaním jednotlivých záznamov alebo požiadaním o zmazanie celého účtu (časť 3.6). S otázkami ohľadom vašich údajov píšte na: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Máte tiež právo podať sťažnosť na príslušnom dozornom orgáne: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, alebo na dozornom orgáne pre ochranu osobných údajov vo vašej krajine pobytu v rámci EÚ.</p>`
    },
    {
      id: "dzieci",
      h: "10. Deti",
      html: `<p>Aplikácia nie je určená deťom a vedome nezhromažďujeme údaje od osôb mladších ako 13 rokov. Účet LiczMat je určený osobám starším ako 16 rokov alebo so súhlasom ich zákonných zástupcov.</p>`
    },
    {
      id: "zmiany",
      h: "11. Zmeny a kontakt",
      html: `<p>Tieto zásady môžeme aktualizovať. Významné zmeny oznámime v aplikácii alebo na Google Play. Dátum poslednej aktualizácie je na začiatku dokumentu. Kontakt: <b>${ENTITY.name}</b>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
