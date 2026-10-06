import { ENTITY } from "../site.mjs";

export default {
  lang: "sr",
  title: "Politika privatnosti",
  updated: "2026-10-06",
  binding: false,
  translationNote: "Ovo je prevod. Nemačka verzija je obavezujuća.",
  sections: [
    {
      id: "podejscie",
      h: "1. Pristup privatnosti",
      html: `<p>Ova politika opisuje koje podatke obrađuje mobilna aplikacija <b>LiczMat, kalkulator građevinskog materijala</b> („Aplikacija”) i veb sajt <b>liczmat.com</b> („Veb sajt”) i u koju svrhu. Rukovalac podacima je <b>${ENTITY.name}</b>, ${ENTITY.address} („mi”), kontakt: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funkcioniše po principu <b>offline-first</b>. Svi proračuni se izvode na Vašem uređaju i rade bez interneta. Lokalna baza podataka je jedini izvor istine, a oblak je samo njena kopija.</p><p><b>Nalog je opcioni.</b> Za proračune nije potrebno da se prijavljujete. Sve dok ne otvorite nalog, ne šaljemo Vaše projekte ni proračune ni na jedan server. Rezervna kopija je datoteka koju sami izvozite i čuvate. Ako odlučite da otvorite nalog, dole opisani podaci biće poslati <b>Google Firebase-u</b>. Pogledajte odeljak 3 za detalje.</p><p>Aplikacija takođe koristi druge <b>Google</b> usluge (oglase i mape / pretragu prodavnica), koje obrađuju određene podatke. To opisujemo u nastavku.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Podaci uskladišteni na uređaju",
      html: `<p>Lokalno na Vašem uređaju čuvamo: projekte, proračune, spiskove za kupovinu, prostorije, prilagođene materijale i podešavanja (npr. jezik, valutu, temu, podatke o izvođaču). Deinstalacijom Aplikacije ili brisanjem njenih podataka, ove informacije se trajno uklanjaju sa uređaja. Rezervnu kopiju (izvoz u datoteku) kreirate i čuvate sami.</p><p><b>Katalog materijala, Vaši prilagođeni materijali i cene, kao i podešavanja se ne sinhronizuju.</b> Oni ostaju isključivo na uređaju, čak i ako imate nalog.</p>`
    },
    {
      id: "konto",
      h: "3. LiczMat nalog i sinhronizacija (opciono)",
      html: `<p>Možete otvoriti <b>LiczMat nalog</b> kako biste imali iste projekte na pametnom telefonu i u pretraživaču (<a href="/app/">liczmat.com/app/</a>). Nalog je besplatan i potpuno dobrovoljan. Bez naloga, Aplikacija i Veb sajt funkcionišu kao i ranije.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Koje podatke obrađujemo kada imate nalog",
      html: `<ul><li><b>Adresa e-pošte i lozinka.</b> Upravlja <b>Firebase Authentication</b>. Mi ne vidimo i ne čuvamo Vašu lozinku, Google je čuva u obliku heša. Google-ov prozor za prijavljivanje i stranice kojima se pristupa preko linkova u imejlovima naloga (npr. resetovanje lozinke, potvrda e-pošte) pruža <b>auth.liczmat.com</b>, usluga Firebase Hosting (Google) u okviru istog projekta.</li><li><b>Prijavljivanje preko Google-a</b> (opciona alternativa lozinki). U ovom slučaju nema lozinke. Od Google-a dobijamo adresu e-pošte, ime za prikaz i ID naloga kako bismo ih povezali sa Vašim podacima u LiczMat-u (ime za prikaz se koristi u imejlu dobrodošlice). Ne preuzimamo nikakve druge podatke sa Vašeg Google naloga.</li><li><b>ID naloga (UID)</b> dodeljen od strane Firebase-a.</li><li><b>Sadržaj naloga:</b> projekti, prostorije, procene i spiskovi za kupovinu. Nazivi, količine, merne jedinice, cene, valuta, uneti podaci u kalkulator, kao i vremenske oznake kreiranja i izmene.</li><li><b>Tehnički podaci:</b> datum otvaranja naloga, datum poslednjeg korišćenja i da li se povezujete preko Aplikacije ili Veb sajta.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Gde se podaci čuvaju",
      html: `<p>Baza podataka <b>Google Cloud Firestore</b> i usluge <b>Cloud Functions</b> rade u regionu <b>europe-central2 (Varšava)</b>, odnosno unutar Evropske unije. Međutim, usluga <b>Firebase Authentication</b> (Vaši podaci za prijavljivanje, kao što su adresa e-pošte, ime za prikaz, heš lozinke i ID Google naloga) radi na Google-ovoj globalnoj infrastrukturi, pa se ovi podaci mogu obrađivati u Sjedinjenim Državama (pogledajte odeljak 8). Google ovde deluje kao obrađivač u naše ime.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Ko ima pristup podacima",
      html: `<p>Isključivo vlasnik naloga. Bezbednosna pravila Firestore-a dozvoljavaju čitanje i pisanje podataka naloga samo prijavljenom korisniku sa istim ID-om. Jedini izuzetak je link koji sami kreirate. Pogledajte odeljak 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Kako funkcioniše sinhronizacija",
      html: `<p>Nakon svake lokalne promene, Aplikacija šalje dokument u Firestore i preuzima promene iz oblaka nazad u bazu podataka uređaja. U slučaju konflikta, pobeđuje noviji unos (poređenjem vremenskih oznaka). Brisanje zapisa ne uklanja ga odmah iz oblaka: dokument se označava kao obrisan kako bi drugi uređaj saznao za brisanje i ne bi ga vratio. Ove oznake se brišu nakon <b>30 dana</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Deljenje procene putem linka",
      html: `<p>Ako dodirnete „Podeli”, pravimo <b>kopiju</b> izabranog projekta (naziv, procene, spisak za kupovinu, valuta) na nasumičnoj 128-bitnoj adresi liczmat.com/p/&lt;token&gt;. Ova kopija je <b>javno čitljiva svakome ko zna link</b>. Token u adresi je jedina zaštita, zato ga delite samo sa osobama koje bi trebalo da vide procenu. Kopija se ne ažurira automatski, morate je ažurirati ručno putem dugmeta. Brisanjem linka se odmah ukida pristup. Osobi koja otvori link nije potreban nalog, a mi o njoj ne prikupljamo nikakve podatke osim standardne analitike Veb sajta (odeljak 6).</p>`
    },
    {
      id: "konto-calendar-link",
      h: "3.5.1. Privatni link kalendara",
      html: `<p>Ako napravite privatni link kalendara, svako ko zna tu adresu može da pročita otvorene rokove iz Vašeg rasporeda, uključujući naziv, datum, klijenta i belešku. Pravljenje novog linka isključuje stari.</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Koliko dugo čuvamo podatke i kako ih obrisati",
      html: `<p>Podatke naloga čuvamo dok nalog postoji. Pojedinačne projekte i prostorije možete obrisati u bilo kom trenutku. Ceo nalog možete obrisati sami na <a href="/app/">liczmat.com/app/</a> → kartica <b>Nalog</b> → <b>Obriši nalog</b>. Time se brišu svi dokumenti naloga u Firestore-u (projekti, prostorije, procene, spiskovi za kupovinu i kreirani linkovi), a na kraju i sam nalog u Firebase Authentication-u. Ova akcija se ne može opozvati. Na istoj kartici možete unapred preuzeti ceo sadržaj Vašeg naloga kao JSON datoteku. Ako želite da mi to uradimo za Vas, pišite na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Podatke sačuvane na Vašem uređaju ili u pretraživaču brišete zasebno brisanjem podataka Aplikacije ili podataka veb-sajta.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Pravni osnov",
      html: `<p>Obrada podataka naloga je neophodna za izvršenje usluge koju zahtevate. čl. 6. st. 1. tač. (b) GDPR (izvršenje ugovora). Otvaranje naloga je dobrovoljno, bez njega možete koristiti sve funkcije kalkulatora.</p>`
    },
    {
      id: "reklamy",
      h: "4. Oglasi (Google AdMob)",
      html: `<p>Aplikacija je besplatna i podržavaju je oglasi koje pruža <b>Google AdMob</b>. Stoga Google, kao provajder oglasa, može prikupljati i obrađivati:</p><ul><li><b>ID za oglašavanje</b> (Android Advertising ID),</li><li>IP adresu i podatke o uređaju (model, operativni sistem, podešavanja jezika),</li><li>približnu lokaciju (na osnovu IP adrese),</li><li>informacije o interakciji sa oglasima (prikazi, klikovi).</li></ul><p>Ovi podaci se koriste za posluživanje oglasa, ograničavanje njihove učestalosti, merenje učinka i sprečavanje prevara. Google-ova pravila to opisuju: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Google-ova pravila za partnerske veb-sajtove</a> i <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google-ova pravila o privatnosti</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Pristanak (GDPR) i personalizovani oglasi",
      html: `<p>Ako se nalazite u Evropskom ekonomskom prostoru, Ujedinjenom Kraljevstvu ili Švajcarskoj, pri prvom pokretanju prikazujemo prozor za pristanak (Google User Messaging Platform), gde donosite odluku o personalizovanim oglasima. Bez Vašeg pristanka prikazuju se samo <b>nepersonalizovani</b> oglasi. Svoj pristanak možete promeniti ili povući u bilo kom trenutku brisanjem podataka aplikacije u podešavanjima sistema ili resetovanjem ID-a za oglašavanje u Android podešavanjima. Pravni osnov za personalizovane oglase je pristanak, čl. 6. st. 1. tač. (a) GDPR-a, a za čitanje ili čuvanje informacija na uređaju dodatno § 25. st. 1. TDDDG-a (nemački zakon o zaštiti podataka u telekomunikacijama i digitalnim uslugama). Nepersonalizovani oglasi: legitimni interes za finansiranje besplatne aplikacije, čl. 6. st. 1. tač. (f) GDPR-a.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analitika aplikacije (Firebase / Google Analytics)",
      html: `<p>Aplikacija koristi <b>Google Analytics for Firebase</b> za anonimno i zbirno merenje načina na koji se koriste njene funkcije (npr. koje kalkulatore otvarate, broj aktivnih korisnika). To nam pomaže da poboljšamo LiczMat. Analitika je podrazumevano <b>onemogućena</b> i aktivira se tek nakon što date svoj pristanak u istom prozoru (Google User Messaging Platform). Bez pristanka se ništa ne prikuplja. Podatke obrađuje Google u skladu sa <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google-ovim pravilima o privatnosti</a>. Pravni osnov je pristanak, čl. 6. st. 1. tač. (a) GDPR-a i § 25. st. 1. TDDDG-a; pristanak se može povući u bilo kom trenutku sa dejstvom za budućnost.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Lokacija i pretraga prodavnica (Google Maps / Places)",
      html: `<p>Funkcija „Pronađi prodavnicu” koristi <b>Google Maps</b> i <b>Google Places</b>. Ako dozvolite pristup lokaciji, Aplikacija koristi Vašu približnu ili tačnu lokaciju za prikazivanje obližnjih prodavnica građevinskog materijala i izračunavanje rute. Zahteve za mape obrađuje Google u skladu sa svojim pravilima o privatnosti. Možete odbiti pristup lokaciji. U tom slučaju prodavnice se neće tražiti automatski, ali će sve ostale funkcije raditi bez promena. Ne čuvamo Vašu lokaciju, ni na uređaju ni na nalogu.</p>`
    },
    {
      id: "strona",
      h: "6. Veb sajt",
      html: `<p>Veb sajt <b>liczmat.com</b> je statičan. Kada se sajt otvori, host Firebase Hosting (Google LLC) obrađuje standardne podatke servera (IP adresa, vreme, tražena stranica, pretraživač) radi bezbedne isporuke sajta; pravni osnov čl. 6. st. 1. tač. (f) GDPR-a (legitimni interes za bezbedan i pouzdan veb sajt). Koristi <b>Google Analytics</b> (GA4) za anonimno i zbirno merenje saobraćaja (npr. koliko ljudi posećuje Veb sajt i koliko njih prelazi na Google Play), kako bismo mogli da ga poboljšamo. Analitika je podrazumevano onemogućena: u skladu sa GDPR-om, prvo tražimo Vaš pristanak, a Google Analytics (uključujući postavljanje kolačića) se pokreće tek nakon što ga date. Možete odbiti, a sve ostale funkcije će ostati upotrebljive. Pravni osnov je pristanak, čl. 6. st. 1. tač. (a) GDPR-a i § 25. st. 1. TDDDG-a; povlačenje u bilo kom trenutku putem podešavanja kolačića/pristanka na sajtu, sa dejstvom za budućnost. Osim Analytics-a, Veb sajt ne koristi veb fontove. Sav ostali kod i stilovi se isporučuju sa domena Veb sajta, a interaktivni kalkulatori računaju isključivo u Vašem pretraživaču.</p><p>Izuzetak su mesta gde su integrisane spoljne usluge. <b>Prodavnice:</b> Veb sajt ugrađuje mapu <b>Google Maps</b> koja se učitava sa Google servera. Ako podelite svoju lokaciju, ona se koristi samo za centriranje mape i nigde se ne čuva. Da bi prikazao listu najbližih prodavnica, Veb sajt šalje Vaše približne koordinate usluzi <b>OpenStreetMap (Overpass API)</b> i preuzima javne podatke o prodavnicama. Dugme „Navigacija” otvara rutu u Google Maps-u. Predlozi gradova na osnovu poštanskih brojeva koriste bazu podataka GeoNames (geonames.org), CC BY 4.0, smeštenu direktno na našem serveru, i nijedna treća strana ne dobija uneti poštanski broj. Pravni osnov je čl. 6. st. 1. tač. (a) GDPR-a kada posetilac deli lokaciju, u suprotnom se mapa učitava tek kada posetilac otvori pretragu prodavnica. <b>/app/:</b> Nakon prijavljivanja, Veb sajt se povezuje sa <b>Firebase-om</b> (Autentifikacija i Firestore) pod uslovima iz odeljka 3 i čuva podatke za prijavljivanje u pretraživaču kako Vam se ne bi tražila lozinka pri svakoj poseti. <b>/p/&lt;token&gt;:</b> Veb sajt preuzima deljenu kopiju procene iz Firestore-a bez prijavljivanja i bez prikupljanja podataka o osobi koja otvara link. Obe ove podstranice su isključene iz indeksiranja.</p><p><b>Projekti, prostorije i procene sačuvani na Veb sajtu bez prijavljivanja</b> ostaju isključivo u lokalnom skladištu Vašeg pretraživača (localStorage) i nigde se ne šalju. Mi ih ne vidimo i nemamo pristup njima. Brišete ih brisanjem podataka veb-sajta u pretraživaču. U oblak idu tek kada se prijavite na svoj nalog i sami kliknete „Pošalji iz pretraživača na nalog”. Od tog trenutka primenjuje se odeljak 3. U pretraživaču takođe čuvamo Vaš izbor jezika, izbor valute, izbor teme i Vašu odluku o pristanku za analitiku.</p>`
    },
    {
      id: "komu",
      h: "7. Kome delimo podatke",
      html: `<p>Ne prodajemo podatke i ne pravimo korisničke profile. Gore opisane podatke obrađuje <b>Google</b> kao obrađivač: AdMob (oglasi), Maps i Places (mape i prodavnice), Analytics (statistika), a ako otvorite nalog, Firebase Authentication, Cloud Firestore i Firebase Hosting (nalog i sinhronizacija). Osim toga, nakon otvaranja naloga, na Vašu adresu e-pošte šaljemo jednokratni imejl dobrodošlice na jeziku stranice na kojoj je nalog otvoren. Ovaj imejl obrađuju i šalju serveri kompanije <b>OVH SAS</b> (Francuska, EU), našeg provajdera usluga e-pošte, koji deluje kao obrađivač u naše ime, na osnovu čl. 6. st. 1. tač. (b) GDPR-a. Inače delimo podatke samo sa osobama kojima sami date link za procenu (odeljak 3.5) i kada to zahteva važeći zakon.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Plaćanja (Stripe)",
      html: `<p>Pretplatom <b>LiczMat Pro</b> upravlja <b>Stripe</b> (Stripe Payments Europe, Ltd., Irska). Ako odlučite da je kupite, bićete preusmereni na Stripe-ovu stranicu za plaćanje. Stripe, kao nezavisni rukovalac, prima i obrađuje podatke o plaćanju: broj kartice, podatke za naplatu i istoriju plaćanja. <b>Mi ne vidimo i ne čuvamo broj Vaše kartice.</b> Vaša adresa e-pošte i ID naloga (UID) šalju se Stripe-u kako bi plaćena pretplata mogla biti dodeljena pravom nalogu. Zauzvrat dobijamo samo status plana (Besplatni ili Pro), datum njegovog isteka i informaciju da li će se pretplata obnoviti. Svojim fakturama, promenama kartice i otkazivanjima upravljate na korisničkom portalu Stripe-a. Stripe-ova politika privatnosti je dostupna na: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Prenos podataka van EEP-a",
      html: `<p>Google LLC (odgovoran za Firebase Authentication, Google Analytics, AdMob, Maps, Places i Firebase Hosting, koji hostuje naš veb sajt i obrađuje standardne zapise servera, uključujući IP adrese) je američka kompanija. Prenos Vaših podataka u SAD se zasniva na <b>odluci o adekvatnosti Evropske komisije za EU-US Data Privacy Framework</b>, s obzirom na to da je kompanija sertifikovana. Dodatno, zasniva se na <b>standardnim ugovornim klauzulama</b> uključenim u njenim uslovima obrade podataka (Google Cloud Data Processing Addendum).</p>`
    },
    {
      id: "prawa",
      h: "9. Vaša prava (GDPR)",
      html: `<p>U skladu sa GDPR-om, imate pravo na pristup, ispravku, brisanje, ograničenje obrade, prenosivost podataka i prigovor, kao i pravo da povučete pristanak za personalizovane oglase i analitiku. <b>Ako se obrada zasniva na čl. 6. st. 1. tač. (f) GDPR-a, možete uložiti prigovor u bilo kom trenutku iz razloga u vezi sa vašom posebnom situacijom (čl. 21. GDPR-a).</b></p><p>Direktno kontrolišete podatke koji ostaju na uređaju (podaci aplikacije, dozvole, ID za oglašavanje u Android podešavanjima). Podatke naloga možete pregledati i promeniti u Aplikaciji ili na <a href="/app/">liczmat.com/app/</a>, izvesti ih preko funkcije rezervne kopije i obrisati ih uklanjanjem pojedinačnih zapisa ili zahtevom za brisanje celog naloga (odeljak 3.6). Za pitanja u vezi sa Vašim podacima pišite na: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Takođe imate pravo da podnesete pritužbu nadležnom nadzornom organu: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, ili nadzornom organu za zaštitu podataka u Vašoj zemlji prebivališta unutar EU.</p>`
    },
    {
      id: "dzieci",
      h: "10. Deca",
      html: `<p>Aplikacija nije namenjena deci i svesno ne prikupljamo podatke od osoba mlađih od 13 godina. LiczMat nalog je namenjen osobama koje imaju 16 ili više godina, ili imaju pristanak zakonskih zastupnika.</p>`
    },
    {
      id: "zmiany",
      h: "11. Izmene i kontakt",
      html: `<p>Možemo ažurirati ovu politiku. O značajnim promenama obavestićemo u Aplikaciji ili na Google Play-u. Datum poslednjeg ažuriranja se nalazi na vrhu dokumenta. Kontakt: <b>${ENTITY.name}</b>, imejl: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
