import { ENTITY } from "../site.mjs";

export default {
  lang: "sr",
  title: "Uslovi poslovanja za LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "Ovo je prevod. Nemačka verzija je obavezujuća.",
  sections: [
    {
      id: "anbieter",
      h: "1. Pružalac usluge i opseg primene",
      html: `<p>Pružalac usluge LiczMat Pro je <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, PIB: ${ENTITY.taxId}.</p><p>Ovi Opšti uslovi poslovanja primenjuju se na plaćenu pretplatu <b>LiczMat Pro</b> ponuđenu na liczmat.com za veb aplikaciju na adresi <a href="/app/">liczmat.com/app/</a>. Besplatni kalkulatori na liczmat.com, aplikacija za Android i besplatni LiczMat nalog pružaju se besplatno i nisu deo ugovora sa plaćanjem.</p><p>Potrošač u smislu člana 13 nemačkog Građanskog zakonika (BGB) je svako fizičko lice koje zaključuje pravni posao u svrhe koje se pretežno ne mogu pripisati njegovoj privrednoj niti samostalnoj profesionalnoj delatnosti. Privrednik u smislu člana 14 nemačkog BGB-a je fizičko ili pravno lice ili pravno sposobno ortačko društvo koje prilikom zaključenja ugovora deluje u okviru svoje privredne ili samostalne profesionalne delatnosti.</p><p>Sopstveni uslovi poslovanja korisnika se ne primenjuju.</p>`
    },
    {
      id: "leistung",
      h: "2. Usluga",
      html: `<p>LiczMat Pro vam pruža Pro funkcije onlajn u pregledaču opisane na <a href="/sr/liczmat-pro/">stranici LiczMat Pro</a> u trenutku poručivanja. To posebno uključuje upravljanje klijentima, ponude sa PDF-om i linkom za deljenje, planiranje rokova, cene i troškove u projektima, kao i čuvanje podataka o firmi. LiczMat čuva podatke koje unesete na vašem nalogu.</p><p>Proračuni i ponude izrađene na osnovu njih su pomoćna sredstva. Pre kupovine materijala ili slanja ponude proveravate količine, cene, rezultate i prikladnost za predviđenu svrhu.</p><p>Neprekidna dostupnost nije garantovana. Može doći do radova na održavanju, tehničkih smetnji i prekida rada. Trudimo se da ograničenja traju što je kraće moguće.</p>`
    },
    {
      id: "test",
      h: "3. Besplatan probni period",
      html: `<p>Novi nalozi dobijaju LiczMat Pro <b>besplatno tokom 14 dana</b>. Za to nisu potrebni podaci o plaćanju. Probni period se završava automatski i ne prelazi u plaćenu pretplatu. Po njegovom završetku, nalog se vraća na besplatni paket.</p>`
    },
    {
      id: "vertrag",
      h: "4. Zaključenje ugovora",
      html: `<p>Prikaz usluge LiczMat Pro na veb sajtu ne predstavlja obavezujuću ponudu za zaključenje ugovora.</p><p>Da biste izvršili porudžbinu, prijavljujete se na adresi <a href="/app/">liczmat.com/app/</a>, birate mesečnu ili godišnju pretplatu i kliknete na dugme za kupovinu. Preusmeravate se na stranicu za plaćanje Stripe Checkout. Tamo unosite adresu e-pošte i podatke o plaćanju. Pre konačnog klika možete pregledati i ispraviti sve unete podatke. Ugovor je zaključen kada kliknete na dugme za pretplatu sa obavezom plaćanja.</p><p>Pružalac platnih usluga je Stripe Payments Europe, Limited (Irska). Stripe potvrđuje ugovor putem e-pošte.</p><p>Ugovor se može zaključiti na bilo kom od 13 jezika ponuđenih na veb sajtu. Nemačka verzija je obavezujuća. Tekst ugovora ne čuvamo posebno. Ovi Opšti uslovi poslovanja su uvek dostupni na ovoj adresi i mogu se sačuvati ili odštampati. Potvrde o uplati i računi dostupni su na Stripe korisničkom portalu.</p>`
    },
    {
      id: "preise",
      h: "5. Cene i plaćanje",
      html: `<p>Primenjuju se cene prikazane na <a href="/sr/liczmat-pro/">stranici LiczMat Pro</a> i na kasi u trenutku poručivanja. To su konačne cene. Dodatni troškovi ne nastaju. Obračun se vrši u valuti prikazanoj na kasi.</p><p>Cena se naplaćuje unapred za odgovarajući period, mesec dana ili godinu dana, i automatski se naplaćuje na početku svakog perioda putem izabranog načina plaćanja na kasi. Dostupni su načini plaćanja ponuđeni na kasi.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Trajanje i otkazivanje",
      html: `<h3>6.1. Mesečna pretplata</h3><p>Mesečna pretplata traje jedan mesec. Automatski se produžava za po još jedan mesec ako se ne otkaže. Možete je otkazati u bilo kom trenutku sa dejstvom na kraju tekućeg ugovornog meseca.</p><h3>6.2. Godišnja pretplata</h3><p>Početni period trajanja je jedna godina. Pretplatu možete otkazati u bilo kom trenutku sa dejstvom na kraju te godine. Ako se ne otkaže, nakon prve godine se nastavlja na neodređeno vreme i tada se može otkazati u bilo kom trenutku sa otkaznim rokom od mesec dana. Obračun se nastavlja godišnje unapred. Srazmerno vraćamo već uplaćeni iznos za vreme nakon prestanka ugovora.</p><h3>6.3. Načini otkazivanja</h3><p>Pretplatu možete otkazati na korisničkom portalu kroz odeljak <b>Nalog</b> na <a href="/app/">liczmat.com/app/</a>, putem dugmeta <a href="/sr/raskid-ugovora/">„Raskinite ugovore ovde”</a>, e-poštom na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> ili pismom na ${ENTITY.name}, ${ENTITY.address}. Pravo na otkazivanje iz važnog razloga ostaje nepromenjeno.</p><h3>6.4. Posledice prestanka ugovora</h3><p>Nakon prestanka ugovora nalog se vraća na besplatni paket. Vaši podaci ostaju sačuvani na nalogu. Pro funkcije više nisu dostupne dok se LiczMat Pro ponovo ne poruči. Informacije o brisanju naloga dostupne su u <a href="/sr/politika-privatnosti/">politici privatnosti</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Pouka o pravu na odustanak",
      html: `<p>Sledeće zakonsko pravo na odustanak od ugovora primenjuje se samo na potrošače.</p><h3>Pravo na odustanak</h3><p>Imate pravo da odustanete od ovog ugovora u roku od 14 dana bez navođenja razloga.</p><p>Rok za odustanak ističe nakon 14 dana od dana zaključenja ugovora.</p><p>Da biste ostvarili pravo na odustanak, morate obavestiti nas, <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, o svojoj odluci da odustanete od ovog ugovora nedvosmislenom izjavom, na primer pismom poslatim poštom ili e-poštom.</p><p>Možete koristiti dole navedeni obrazac za odustanak od ugovora ili funkciju odustanka na stranici <a href="/sr/odustanak-od-ugovora/">„Odustanite od ugovora ovde”</a>, ali to nije obavezno. Ako koristite ovu onlajn funkciju, bez odlaganja ćemo vam na trajnom nosaču podataka, na primer putem e-pošte, poslati potvrdu prijema izjave o odustanku, uključujući njen sadržaj, datum i vreme prijema.</p><p>Da biste ispoštovali rok za odustanak, dovoljno je da pošaljete obaveštenje o ostvarivanju prava na odustanak pre nego što rok za odustanak istekne.</p><h3>Dejstva odustanka</h3><p>Ako odustanete od ovog ugovora, vratićemo vam sva plaćanja primljena od vas, bez odlaganja i u svakom slučaju najkasnije u roku od 14 dana od dana kada smo obavešteni o vašoj odluci da odustanete od ovog ugovora.</p><p>Izvršićemo takav povrat novca koristeći isto sredstvo plaćanja koje ste koristili za prvobitnu transakciju, osim ako niste izričito dogovorili drugačije. Ni u kom slučaju vam neće biti naplaćene nikakve naknade zbog tog povrata.</p><p>Za period pre odustanka ne zahtevamo nikakvo plaćanje.</p>`
    },
    {
      id: "formular",
      h: "8. Obrazac za odustanak od ugovora",
      html: `<p>Popunite i vratite ovaj obrazac samo ako želite da odustanete od ugovora.</p><ul><li>Za: <b>${ENTITY.name}</b>, ${ENTITY.address}, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Ja/Mi (*) ovim obaveštavam/obaveštavamo (*) da odustajem/odustajemo (*) od svog/našeg (*) ugovora o pružanju sledeće usluge: <b>LiczMat Pro (pretplata)</b>.</li><li>Naručeno dana (*)</li><li>Ime potrošača</li><li>Adresa potrošača</li><li>Potpis potrošača, samo ako se ovaj obrazac dostavlja na papiru</li><li>Datum</li></ul><p>(*) Precrtati nepotrebno.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Dodatni povrat novca u roku od 14 dana",
      html: `<p>Pored zakonskog prava na odustanak, svakom kupcu, uključujući privrednika, vraćamo puni uplaćeni iznos ako kupac odustane od ugovora ili ga otkaže u roku od 14 dana nakon prve kupovine pretplate na LiczMat Pro. Ovo pravilo važi samo za prvu kupovinu po nalogu i ne primenjuje se na obnove.</p>`
    },
    {
      id: "pflichten",
      h: "10. Obaveze korisnika",
      html: `<ul><li>Pružate tačne i potpune informacije i održavate ih ažurnim.</li><li>Čuvate svoju lozinku u tajnosti i štitite pristup svom nalogu.</li><li>Ne unosite nezakonit sadržaj u ponude niti u podeljene linkove. Svako ko zna podeljeni link ponude ili projekta može videti njegov sadržaj.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Izmene usluge",
      html: `<p>Uslugu smemo promeniti samo iz opravdanog razloga, na primer zbog novih zakonskih zahteva, bezbednosnih zahteva ili tehničkog razvoja. Promena za vas ne stvara nikakve dodatne troškove. Obaveštavamo vas jasno i blagovremeno unapred.</p><p>Ako promena utiče na pristup potrošača usluzi ili njeno korišćenje više nego neznatno, potrošač može besplatno raskinuti ugovor u roku od 30 dana nakon prijema informacije ili nakon promene, u zavisnosti od toga šta je kasnije (član 327r nemačkog BGB-a).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Zakonska prava u vezi sa nedostacima i nesaobraznošću",
      html: `<p>Primenjuju se zakonska prava u vezi sa nedostacima i nesaobraznošću. Za potrošače se posebno primenjuju članovi 327 i sledeći nemačkog BGB-a.</p>`
    },
    {
      id: "haftung",
      h: "13. Odgovornost",
      html: `<p>Odgovaramo neograničeno za nameru i grubu nepažnju, za povredu života, tela ili zdravlja, kao i po nemačkom Zakonu o odgovornosti za proizvode (Produkthaftungsgesetz).</p><p>U slučaju obične nepažnje odgovaramo samo za povredu bitne ugovorne obaveze. Bitne ugovorne obaveze, poznate i kao kardinalne obaveze, jesu obaveze čije ispunjenje uopšte omogućava uredno izvršenje ugovora i na čije ispunjenje kupac redovno može da računa. U tom slučaju odgovornost je ograničena na štetu koja je tipična za ugovor i predvidiva. U ostalim slučajevima isključena je odgovornost za običnu nepažnju.</p><p>Zakonska odgovornost prema članovima 327 i sledećim nemačkog BGB-a ostaje nepromenjena.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Promene cena",
      html: `<p>Cena tekuće pretplate menja se samo uz vaš izričit pristanak. Obaveštavamo vas najmanje 30 dana unapred. Bez vašeg pristanka pretplata se nastavlja po dosadašnjoj ceni. Bilo koja strana je može prekinuti na kraju već plaćenog perioda.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Izmene ovih Uslova",
      html: `<p>Izmene ovih Opštih uslova poslovanja primenjuju se na tekući ugovor samo uz vaš izričit pristanak. Obaveštavamo vas najmanje 30 dana unapred. Bez vašeg pristanka i dalje se primenjuju prethodni uslovi. Bilo koja strana može prekinuti pretplatu na kraju već plaćenog perioda.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Zaštita podataka",
      html: `<p>Informacije o obradi podataka o ličnosti dostupne su u <a href="/sr/politika-privatnosti/">politici privatnosti</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Rešavanje potrošačkih sporova",
      html: `<p>Nismo voljni niti obavezni da učestvujemo u postupcima rešavanja sporova pred potrošačkim arbitražnim telom (član 36 nemačkog VSBG-a).</p>`
    },
    {
      id: "schluss",
      h: "18. Završne odredbe",
      html: `<p>Primenjuje se nemačko pravo uz isključenje Konvencije Ujedinjenih nacija o ugovorima o međunarodnoj prodaji robe. Za potrošače ovaj izbor prava važi samo u meri u kojoj im ne uskraćuje zaštitu koju pružaju imperativne odredbe države njihovog uobičajenog boravišta.</p><p>Za trgovce, pravna lica javnog prava i posebne fondove javnog prava, sedište pružaoca usluge je mesto nadležnog suda.</p><p>Ako bilo koja odredba ovog ugovora jeste ili postane nevažeća, preostale odredbe ostaju na snazi.</p><p>Nemačka verzija je obavezujuća. Prevodi služe samo u informativne svrhe.</p>`
    }
  ]
};
