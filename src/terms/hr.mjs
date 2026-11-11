import { ENTITY } from "../site.mjs";

export default {
  lang: "hr",
  title: "Uvjeti poslovanja za LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "Ovo je prijevod. Njemačka verzija je obvezujuća.",
  sections: [
    {
      id: "anbieter",
      h: "1. Davatelj usluge i područje primjene",
      html: `<p>Davatelj usluge LiczMat Pro je <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, PDV ID: ${ENTITY.taxId}.</p><p>Ovi Opći uvjeti poslovanja primjenjuju se na plaćenu pretplatu <b>LiczMat Pro</b> koja se nudi na liczmat.com za web-aplikaciju na adresi <a href="/app/">liczmat.com/app/</a>. Besplatni kalkulatori na liczmat.com, aplikacija za Android i besplatni LiczMat račun pružaju se bez naknade i nisu dio ugovora o plaćenoj usluzi.</p><p>Potrošač u smislu članka 13. njemačkog Građanskog zakonika (BGB) svaka je fizička osoba koja sklapa pravni posao u svrhe koje se pretežito ne mogu pripisati ni njezinoj gospodarskoj ni samostalnoj profesionalnoj djelatnosti. Poduzetnik u smislu članka 14. njemačkog BGB-a fizička je ili pravna osoba ili pravno sposobno partnerstvo koje pri sklapanju ugovora djeluje u obavljanju svoje gospodarske ili samostalne profesionalne djelatnosti.</p><p>Vlastiti uvjeti poslovanja kupca se ne primjenjuju.</p>`
    },
    {
      id: "leistung",
      h: "2. Usluga",
      html: `<p>LiczMat Pro vam pruža online u pregledniku Pro funkcije opisane na <a href="/hr/liczmat-pro/">stranici LiczMat Pro</a> u trenutku narudžbe. To posebno uključuje upravljanje klijentima, ponude u PDF obliku i s poveznicom za dijeljenje, planiranje rokova, cijene i troškove u projektima te pohranu podataka o tvrtki. LiczMat pohranjuje podatke koje unesete na vaš račun.</p><p>Izračuni i ponude izrađeni na temelju njih služe kao pomoćni alati. Prije kupnje materijala ili predaje ponude provjeravate količine, cijene, rezultate i prikladnost za predviđenu svrhu.</p><p>Neprekidna dostupnost nije zajamčena. Mogu se pojaviti radovi na održavanju, tehničke smetnje i prekidi rada. Nastojimo ograničenja svesti na najmanju moguću mjeru.</p>`
    },
    {
      id: "test",
      h: "3. Besplatno probno razdoblje",
      html: `<p>Novi računi dobivaju LiczMat Pro <b>besplatno tijekom 14 dana</b>. Za to nisu potrebni podaci o plaćanju. Probno razdoblje završava automatski i ne pretvara se u plaćenu pretplatu. Nakon njegova završetka račun se vraća na besplatni plan.</p>`
    },
    {
      id: "vertrag",
      h: "4. Sklapanje ugovora",
      html: `<p>Prikaz usluge LiczMat Pro na web stranici ne predstavlja obvezujuću ponudu za sklapanje ugovora.</p><p>Za narudžbu se prijavljujete na adresi <a href="/app/">liczmat.com/app/</a>, odabirete mjesečnu ili godišnju pretplatu i kliknete na gumb za kupnju. Preusmjeravaju se na stranicu za naplatu Stripe. Tamo unosite svoju adresu e-pošte i podatke o plaćanju. Prije konačnog klika možete provjeriti i ispraviti sve unesene podatke. Ugovor je sklopljen kada kliknete na gumb za pretplatu s obvezom plaćanja.</p><p>Pružatelj usluga plaćanja je Stripe Payments Europe, Limited (Irska). Stripe potvrđuje ugovor e-poštom.</p><p>Ugovor se može sklopiti na bilo kojem od 13 jezika ponuđenih na web stranici. Njemačka verzija je obvezujuća. Ne pohranjujemo tekst ugovora zasebno. Ovi Opći uvjeti poslovanja dostupni su u svakom trenutku na ovoj adresi i mogu se spremiti ili ispisati. Potvrde o plaćanju i računi dostupni su na korisničkom portalu Stripe.</p>`
    },
    {
      id: "preise",
      h: "5. Cijene i plaćanje",
      html: `<p>Primjenjuju se cijene prikazane na <a href="/hr/liczmat-pro/">stranici LiczMat Pro</a> i na blagajni u trenutku narudžbe. To su konačne cijene. Dodatni troškovi ne nastaju. Obračun se vrši u valuti prikazanoj na blagajni.</p><p>Cijena se naplaćuje unaprijed za odgovarajuće razdoblje, mjesec dana ili godinu dana, i automatski se naplaćuje na početku svakog razdoblja odabranim načinom plaćanja na blagajni. Dostupni su načini plaćanja ponuđeni na blagajni.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Trajanje i raskid",
      html: `<h3>6.1. Mjesečna pretplata</h3><p>Mjesečna pretplata traje jedan mjesec. Automatski se produžuje za još jedan mjesec ako se ne otkaže. Možete je otkazati u bilo kojem trenutku s učinkom na kraju tekućeg ugovornog mjeseca.</p><h3>6.2. Godišnja pretplata</h3><p>Početno trajanje je jedna godina. Pretplatu možete otkazati u bilo kojem trenutku s učinkom na kraju te godine. Ako se ne otkaže, nastavlja se nakon prve godine na neodređeno vrijeme i tada se može otkazati u bilo kojem trenutku uz otkazni rok od mjesec dana. Obračun se nastavlja godišnje unaprijed. Razmjerno vraćamo već uplaćeni iznos za razdoblje nakon prestanka ugovora.</p><h3>6.3. Načini raskida</h3><p>Pretplatu možete raskinuti na korisničkom portalu u odjeljku <b>Račun</b> na <a href="/app/">liczmat.com/app/</a>, putem gumba <a href="/hr/raskid-ugovora/">„Raskinite ugovore ovdje”</a>, e-poštom na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> ili dopisom na ${ENTITY.name}, ${ENTITY.address}. Pravo na izvanredni raskid iz važnog razloga ostaje nepromijenjeno.</p><h3>6.4. Posljedice prestanka ugovora</h3><p>Nakon prestanka ugovora račun se vraća na besplatni plan. Vaši podaci ostaju pohranjeni na računu. Pro funkcije više nisu dostupne dok se LiczMat Pro ponovno ne naruči. Informacije o brisanju računa nalaze se u <a href="/hr/pravila-privatnosti/">pravilima privatnosti</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Uputa o pravu na jednostrani raskid ugovora",
      html: `<p>Sljedeće zakonsko pravo na jednostrani raskid ugovora vrijedi samo za potrošače.</p><h3>Pravo na jednostrani raskid ugovora</h3><p>Imate pravo, ne navodeći razloge za to, jednostrano raskinuti ovaj ugovor u roku od 14 dana.</p><p>Rok za jednostrani raskid ugovora istječe nakon 14 dana od dana sklapanja ugovora.</p><p>Da biste mogli ostvariti pravo na jednostrani raskid ovoga ugovora, morate nas, <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, obavijestiti o svojoj odluci o jednostranom raskidu ugovora nedvosmislenom izjavom (na primjer, dopisom poslanim poštom ili e-poštom).</p><p>Možete upotrijebiti u nastavku priloženi primjer obrasca za jednostrani raskid ugovora ili funkciju odustanka na stranici <a href="/hr/odustanak-od-ugovora/">„Odustanite od ugovora ovdje”</a>, ali to nije obvezno. Ako upotrijebite tu internetsku funkciju, bez odgađanja ćemo vam na trajnom mediju (na primjer, e-poštom) dostaviti potvrdu primitka takve izjave o jednostranom raskidu, uključujući njezin sadržaj te datum i vrijeme primitka.</p><p>Da biste poštovali rok za jednostrani raskid, dovoljno je da pošaljete svoju obavijest o ostvarivanju prava na jednostrani raskid prije isteka roka za jednostrani raskid ugovora.</p><h3>Učinci jednostranog raskida ugovora</h3><p>Ako jednostrano raskinete ovaj ugovor, vratit ćemo vam sva plaćanja koja smo primili od vas, bez odgađanja i u svakom slučaju najkasnije u roku od 14 dana od dana kada smo zaprimili vašu odluku o jednostranom raskidu ovog ugovora.</p><p>Izvršit ćemo takav povrat novca služeći se istim sredstvima plaćanja koja ste upotrijebili za prvotnu transakciju, osim ako niste izričito drukčije ugovorili. U svakom slučaju, nećete snositi nikakve naknade koje bi nastale zbog takvog povrata novca.</p><p>Za razdoblje do jednostranog raskida ugovora ne tražimo nikakvu naknadu troškova.</p>`
    },
    {
      id: "formular",
      h: "8. Primjer obrasca za jednostrani raskid ugovora",
      html: `<p>Ispunite i vratite ovaj obrazac samo ako želite jednostrano raskinuti ugovor.</p><ul><li>Prima: <b>${ENTITY.name}</b>, ${ENTITY.address}, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Ja/Mi (*) ovime obavješćujem/obavješćujemo (*) da jednostrano raskidam/raskidamo (*) ugovor o pružanju sljedeće usluge: <b>LiczMat Pro (pretplata)</b>.</li><li>Naručeno dana (*)</li><li>Ime i prezime potrošača</li><li>Adresa potrošača</li><li>Potpis potrošača (samo ako se ovaj obrazac dostavlja u papirnatom obliku)</li><li>Datum</li></ul><p>(*) Prekrižiti nepotrebno.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Dodatni povrat novca u roku od 14 dana",
      html: `<p>Uz zakonsko pravo na jednostrani raskid ugovora, svakom kupcu, uključujući poduzetnika, vraćamo puni uplaćeni iznos ako kupac odustane od ugovora ili ga raskine u roku od 14 dana nakon prve kupnje pretplate na LiczMat Pro. Ovo pravilo vrijedi samo za prvu kupnju po računu i ne primjenjuje se na obnove.</p>`
    },
    {
      id: "pflichten",
      h: "10. Obveze kupca",
      html: `<ul><li>Dajete točne i potpune podatke i redovito ih ažurirate.</li><li>Čuvate svoju lozinku u tajnosti i štitite pristup svom računu.</li><li>Ne stavljate nezakonit sadržaj u ponude ili podijeljene poveznice. Svatko tko zna podijeljenu poveznicu ponude ili projekta može vidjeti njezin sadržaj.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Izmjene usluge",
      html: `<p>Uslugu smijemo promijeniti samo iz valjanog razloga, na primjer zbog novih zakonskih zahtjeva, sigurnosnih razloga ili tehničkog razvoja. Izmjena za vas ne stvara dodatne troškove. O tome vas obavještavamo jasno i pravodobno unaprijed.</p><p>Ako promjena utječe na pristup ili korištenje usluge za potrošača više nego neznatno, potrošač može besplatno raskinuti ugovor u roku od 30 dana nakon primitka obavijesti ili nakon provedbe promjene, ovisno o tome koji je datum kasniji (članak 327r. njemačkog BGB-a).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Zakonska prava za nedostatke",
      html: `<p>Primjenjuju se zakonska prava za nedostatke. Za potrošače se posebno primjenjuju članci 327. i sljedeći njemačkog BGB-a.</p>`
    },
    {
      id: "haftung",
      h: "13. Odgovornost",
      html: `<p>Odgovaramo neograničeno za namjeru i grubu nepažnju, za ozljede života, tijela ili zdravlja te prema njemačkom Zakonu o odgovornosti za neispravne proizvode (Produkthaftungsgesetz).</p><p>U slučaju obične nepažnje odgovaramo samo za povredu bitne ugovorne obveze. Bitne ugovorne obveze, poznate i kao kardinalne obveze, jesu obveze čije ispunjenje uopće omogućuje uredno izvršenje ugovora i na čije se ispunjenje kupac redovito može pouzdati. U tom je slučaju odgovornost ograničena na štetu tipičnu za ugovor i predvidivu. U ostalim slučajevima isključena je odgovornost za običnu nepažnju.</p><p>Zakonska odgovornost prema člancima 327. i sljedećima njemačkog BGB-a ostaje nepromijenjena.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Promjene cijena",
      html: `<p>Cijena tekuće pretplate mijenja se samo uz vaš izričit pristanak. Obavještavamo vas najmanje 30 dana unaprijed. Bez vašeg pristanka pretplata se nastavlja po dosadašnjoj cijeni. Svaka strana može je prekinuti na kraju već plaćenog razdoblja.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Izmjene ovih Uvjeta",
      html: `<p>Izmjene ovih Općih uvjeta poslovanja primjenjuju se na tekući ugovor samo uz vaš izričit pristanak. Obavještavamo vas najmanje 30 dana unaprijed. Bez vašeg pristanka i dalje se primjenjuju dosadašnji uvjeti. Svaka strana može prekinuti pretplatu na kraju već plaćenog razdoblja.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Zaštita podataka",
      html: `<p>Informacije o obradi osobnih podataka dostupne su u <a href="/hr/pravila-privatnosti/">pravilima privatnosti</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Rješavanje potrošačkih sporova",
      html: `<p>Nismo spremni niti obvezni sudjelovati u postupcima rješavanja sporova pred arbitražnim tijelom za potrošače (članak 36. njemačkog VSBG-a).</p>`
    },
    {
      id: "schluss",
      h: "18. Završne odredbe",
      html: `<p>Primjenjuje se njemačko pravo uz isključenje Konvencije Ujedinjenih naroda o ugovorima o međunarodnoj prodaji robe. Za potrošače ovaj izbor mjerodavnog prava ne uskraćuje zaštitu koju pružaju prisilne odredbe države njihova uobičajenog boravišta.</p><p>Za trgovce, pravne osobe javnog prava i posebna tijela javnog prava, sjedište davatelja usluge je mjesto nadležnog suda.</p><p>Ako bilo koja odredba ovog ugovora jest ili postane nevaljana, preostale odredbe ostaju na snazi.</p><p>Njemačka verzija je obvezujuća. Prijevodi služe samo u informativne svrhe.</p>`
    }
  ]
};
