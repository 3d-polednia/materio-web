import { ENTITY } from "../site.mjs";

export default {
  lang: "hr",
  title: "Pravila privatnosti",
  updated: "2026-10-02",
  binding: false,
  translationNote: "Ovo je prijevod. Njemačka verzija je obvezujuća.",
  sections: [
    {
      id: "podejscie",
      h: "1. Pristup privatnosti",
      html: `<p>Ova pravila opisuju koje podatke obrađuje mobilna aplikacija <b>LiczMat, kalkulator građevinskih materijala</b> („Aplikacija”) i web stranica <b>liczmat.com</b> („Web stranica”) i u koju svrhu. Voditelj obrade podataka je <b>${ENTITY.name}</b>, ${ENTITY.address} („mi”), kontakt: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funkcionira po principu <b>offline-first</b>. Svi se izračuni izvode na Vašem uređaju i rade bez interneta. Lokalna baza podataka jedini je izvor istine, a oblak je samo njezina kopija.</p><p><b>Račun je neobavezan.</b> Za izračune se ne morate prijavljivati. Sve dok ne otvorite račun, ne šaljemo Vaše projekte ni izračune ni na jedan poslužitelj. Sigurnosna kopija je datoteka koju sami izvozite i spremate. Ako odlučite otvoriti račun, dolje opisani podaci bit će poslani <b>Google Firebaseu</b>. Pogledajte odjeljak 3. za pojedinosti.</p><p>Aplikacija koristi i druge <b>Googleove</b> usluge (oglase i karte / pretraživanje trgovina), koje obrađuju određene podatke. To opisujemo u nastavku.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Podaci pohranjeni na uređaju",
      html: `<p>Lokalno na Vašem uređaju pohranjujemo: projekte, izračune, popise za kupnju, prostorije, prilagođene materijale i postavke (npr. jezik, valuta, tema, podaci o izvođaču). Deinstalacijom Aplikacije ili brisanjem njezinih podataka ove se informacije trajno uklanjaju s uređaja. Sigurnosnu kopiju (izvoz u datoteku) izrađujete i čuvate sami.</p><p><b>Katalog materijala, Vaši prilagođeni materijali i cijene, kao i postavke se ne sinkroniziraju.</b> Oni ostaju isključivo na uređaju, čak i ako imate račun.</p>`
    },
    {
      id: "konto",
      h: "3. LiczMat račun i sinkronizacija (neobavezno)",
      html: `<p>Možete otvoriti <b>LiczMat račun</b> kako biste imali iste projekte na pametnom telefonu i u pregledniku (<a href="/app/">liczmat.com/app/</a>). Račun je besplatan i potpuno dobrovoljan. Bez računa, Aplikacija i Web stranica funkcioniraju kao i do sada.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Koje podatke obrađujemo kada imate račun",
      html: `<ul><li><b>Adresa e-pošte i lozinka.</b> Upravlja <b>Firebase Authentication</b>. Mi ne vidimo i ne pohranjujemo Vašu lozinku, Google je pohranjuje u obliku hasha. Googleov prozor za prijavu i stranice kojima se pristupa putem poveznica u e-porukama računa (npr. ponovno postavljanje lozinke, potvrda e-pošte) poslužuje <b>auth.liczmat.com</b>, usluga Firebase Hosting (Google) unutar istog projekta.</li><li><b>Prijava s Googleom</b> (neobavezna alternativa lozinki). U ovom slučaju nema lozinke. Od Googlea primamo adresu e-pošte, ime za prikaz i ID računa kako bismo ih povezali s Vašim podacima u LiczMatu (ime za prikaz koristi se u e-poruci dobrodošlice). Ne preuzimamo nikakve druge podatke s Vašeg Google računa.</li><li><b>ID računa (UID)</b> dodijeljen od strane Firebasea.</li><li><b>Sadržaj računa:</b> projekti, prostorije, procjene i popisi za kupnju. Nazivi, količine, mjerne jedinice, cijene, valuta, uneseni podaci u kalkulator, kao i vremenske oznake izrade i izmjene.</li><li><b>Tehnički podaci:</b> datum otvaranja računa, datum zadnjeg korištenja i spajate li se putem Aplikacije ili Web stranice.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Gdje se podaci pohranjuju",
      html: `<p>Baza podataka <b>Google Cloud Firestore</b> i usluge <b>Cloud Functions</b> rade u regiji <b>europe-central2 (Varšava)</b>, odnosno unutar Europske unije. Međutim, usluga <b>Firebase Authentication</b> (Vaši podaci za prijavu, kao što su adresa e-pošte, ime za prikaz, hash lozinke i ID Google računa) radi na Googleovoj globalnoj infrastrukturi, pa se ti podaci mogu obrađivati u Sjedinjenim Državama (pogledajte odjeljak 8). Google ovdje djeluje kao izvršitelj obrade u naše ime.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Tko im ima pristup",
      html: `<p>Isključivo vlasnik računa. Sigurnosna pravila Firestorea dopuštaju čitanje i pisanje podataka računa samo prijavljenom korisniku s istim ID-om. Jedina iznimka je poveznica koju sami izradite. Pogledajte odjeljak 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Kako funkcionira sinkronizacija",
      html: `<p>Nakon svake lokalne promjene, Aplikacija šalje dokument u Firestore i preuzima promjene iz oblaka natrag u bazu podataka uređaja. U slučaju sukoba, pobjeđuje noviji unos (uspoređivanjem vremenskih oznaka). Brisanje zapisa ne uklanja ga odmah iz oblaka: dokument se označava kao obrisan kako bi drugi uređaj saznao za brisanje i ne bi ga vratio. Ove se oznake brišu nakon <b>30 dana</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Dijeljenje procjene putem poveznice",
      html: `<p>Ako dodirnete „Podijeli”, stvaramo <b>kopiju</b> odabranog projekta (naziv, procjene, popis za kupnju, valuta) na nasumičnoj 128-bitnoj adresi liczmat.com/p/&lt;token&gt;. Ova je kopija <b>javno čitljiva svima koji znaju poveznicu</b>. Token u adresi jedina je zaštita, stoga ga dijelite samo s osobami koje bi trebale vidjeti procjenu. Kopija se ne ažurira automatski, morate je ažurirati ručno putem gumba. Brisanje poveznice odmah ukida pristup. Osobi koja otvori poveznicu ne treba račun, a o njoj ne prikupljamo nikakve podatke osim standardne analitike Web stranice (odjeljak 6).</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Koliko dugo čuvamo podatke i kako ih obrisati",
      html: `<p>Podatke računa čuvamo sve dok račun postoji. Pojedinačne projekte i prostorije možete obrisati u bilo kojem trenutku. Cijeli račun možete obrisati sami na <a href="/app/">liczmat.com/app/</a> → kartica <b>Račun</b> → <b>Obriši račun</b>. Time se brišu svi dokumenti računa u Firestoreu (projekti, prostorije, procjene, popisi za kupnju i izrađene poveznice), a na kraju i sam račun u Firebase Authenticationu. Ova se radnja ne može poništiti. Na istoj kartici prethodno možete preuzeti cijeli sadržaj svog računa kao JSON datoteku. Ako želite da to učinimo umjesto Vas, pišite na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Podatke pohranjene na Vašem uređaju ili u pregledniku brišete zasebno brisanjem podataka Aplikacije ili podataka web-lokacije.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Pravna osnova",
      html: `<p>Obrada podataka računa neophodna je za izvršenje usluge koju zatražite. čl. 6. st. 1. toč. (b) Opće uredbe o zaštiti podataka (izvršavanje ugovora). Otvaranje računa je dobrovoljno, bez njega možete koristiti sve funkcije kalkulatora.</p>`
    },
    {
      id: "reklamy",
      h: "4. Oglasi (Google AdMob)",
      html: `<p>Aplikacija je besplatna i podržavaju je oglasi koje pruža <b>Google AdMob</b>. Stoga Google, kao pružatelj oglasa, može prikupljati i obrađivati:</p><ul><li><b>ID za oglašavanje</b> (Android Advertising ID),</li><li>IP adresu i podatke o uređaju (model, operativni sustav, postavke jezika),</li><li>približnu lokaciju (na temelju IP adrese),</li><li>informacije o interakciji s oglasima (prikazi, klikovi).</li></ul><p>Ovi se podaci koriste za posluživanje oglasa, ograničavanje njihove učestalosti, mjerenje izvedbe i sprječavanje prijevara. Googleova pravila to opisuju: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Googleova pravila za partnerske web-lokacije</a> i <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Googleova pravila o privatnosti</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Privola (Opća uredba o zaštiti podataka) i personalizirani oglasi",
      html: `<p>Ako se nalazite u Europskom gospodarskom prostoru, Ujedinjenom Kraljevstvu ili Švicarskoj, pri prvom pokretanju prikazujemo prozor za privolu (Google User Messaging Platform), gdje donosite odluku o personaliziranim oglasima. Bez Vaše privole prikazuju se samo <b>nepersonalizirani</b> oglasi. Svoju privolu možete promijeniti ili povući u bilo kojem trenutku brisanjem podataka aplikacije u postavkama sustava ili poništavanjem ID-a za oglašavanje u postavkama Androida. Pravna osnova za personalizirane oglase je privola, čl. 6. st. 1. toč. (a) GDPR-a, a za čitanje ili pohranjivanje informacija na uređaju dodatno § 25. st. 1. TDDDG-a (njemački zakon o zaštiti podataka u telekomunikacijama i digitalnim uslugama). Nepersonalizirani oglasi: legitimni interes za financiranje besplatne aplikacije, čl. 6. st. 1. toč. (f) GDPR-a.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analitika aplikacije (Firebase / Google Analytics)",
      html: `<p>Aplikacija koristi <b>Google Analytics for Firebase</b> za anonimno i zbirno mjerenje načina korištenja njezinih funkcija (npr. koje kalkulatore otvarate, broj aktivnih korisnika). To nam pomaže u poboljšanju LiczMata. Analitika je prema zadanim postavkama <b>onemogućena</b> i aktivira se tek nakon što date svoju privolu u istom prozoru (Google User Messaging Platform). Bez privole se ništa ne prikuplja. Podatke obrađuje Google u skladu s <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Googleovim pravilima o privatnosti</a>. Pravna osnova je privola, čl. 6. st. 1. toč. (a) GDPR-a i § 25. st. 1. TDDDG-a; privola se može povući u bilo kojem trenutku s učinkom za budućnost.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Lokacija i pretraživanje trgovina (Google Maps / Places)",
      html: `<p>Funkcija „Pronađi trgovinu” koristi <b>Google Maps</b> i <b>Google Places</b>. Ako odobrite pristup lokaciji, Aplikacija koristi Vašu približnu ili točnu lokaciju za prikazivanje obližnjih trgovina građevinskog materijala i izračunavanje rute. Zahtjeve mapama obrađuje Google u skladu sa svojim pravilima o privatnosti. Možete odbiti pristup lokaciji. U tom se slučaju trgovine neće tražiti automatski, ali će sve ostale funkcije raditi bez promjena. Ne pohranjujemo Vašu lokaciju, ni na uređaju ni na računu.</p>`
    },
    {
      id: "strona",
      h: "6. Web stranica",
      html: `<p>Web stranica <b>liczmat.com</b> je statična. Kada se stranica otvori, host GitHub Pages (GitHub, Inc.) obrađuje standardne podatke zapisnika poslužitelja (IP adresa, vrijeme, zatražena stranica, preglednik) za sigurnu isporuku stranice; pravna osnova čl. 6. st. 1. toč. (f) GDPR-a (legitimni interes za sigurnu i pouzdanu web stranicu). Koristi <b>Google Analytics</b> (GA4) za anonimno i zbirno mjerenje prometa (npr. koliko ljudi posjećuje Web stranicu i koliko ih prelazi na Google Play), kako bismo je mogli poboljšati. Analitika je prema zadanim postavkama onemogućena: u skladu s Općom uredbom o zaštiti podataka, prvo tražimo Vašu privolu, a Google Analytics (uključujući postavljanje kolačića) pokreće se tek nakon što je date. Možete odbiti, a sve ostale funkcije ostat će upotrebljive. Pravna osnova je privola, čl. 6. st. 1. toč. (a) GDPR-a i § 25. st. 1. TDDDG-a; povlačenje u bilo kojem trenutku putem postavke kolačića/privole na web stranici, s učinkom za budućnost. Osim Analyticsa, Web stranica ne koristi web fontove. Sav ostali kod i stilovi poslužuju se s domene Web stranice, a interaktivni kalkulatori izračunavaju isključivo u Vašem pregledniku.</p><p>Iznimka su mjesta na kojima su integrirane vanjske usluge. <b>Trgovine:</b> Web stranica ugrađuje kartu <b>Google Maps</b> koja se učitava s Googleovih poslužitelja. Ako podijelite svoju lokaciju, ona se koristi samo za centriranje karte i nigdje se ne pohranjuje. Kako bi prikazala popis najbližih trgovina, Web stranica šalje Vaše približne koordinate usluzi <b>OpenStreetMap (Overpass API)</b> i dohvaća javne podatke o trgovinama. Gumb „Navigiraj” otvara rutu u Google Mapsu. Prijedlozi gradova na temelju poštanskih brojeva koriste bazu podataka GeoNames (geonames.org), CC BY 4.0, smještenu izravno na našem poslužitelju, i nijedna treća strana ne prima uneseni poštanski broj. Pravna osnova je čl. 6. st. 1. toč. (a) GDPR-a kada posjetitelj dijeli lokaciju, inače se karta učitava tek kada posjetitelj otvori pretraživanje trgovina. <b>/app/:</b> Nakon prijave, Web stranica se povezuje s <b>Firebaseom</b> (Autentifikacija i Firestore) pod uvjetima iz odjeljka 3. i pohranjuje podatke za prijavu u preglednik kako Vam se ne bi tražila lozinka pri svakom posjetu. <b>/p/&lt;token&gt;:</b> Web stranica dohvaća dijeljenu kopiju procjene iz Firestorea bez prijave i bez prikupljanja podataka o osobi koja otvara poveznicu. Obje ove podstranice isključene su iz indeksiranja.</p><p><b>Projekti, prostorije i procjene spremljeni na Web stranici bez prijave</b> ostaju isključivo u lokalnoj pohrani Vašeg preglednika (localStorage) i ne šalju se nigdje. Mi ih ne vidimo i nemamo im pristup. Brišete ih brisanjem podataka web-lokacije u pregledniku. Oni idu u oblak tek kada se prijavite na svoj račun i sami kliknete „Pošalji iz preglednika na račun”. Od tog trenutka primjenjuje se odjeljak 3. Također u preglednik pohranjujemo Vaš odabir jezika, odabir valute, odabir teme i Vašu odluku o privoli za analitiku.</p>`
    },
    {
      id: "komu",
      h: "7. Kome dijelimo podatke",
      html: `<p>Ne prodajemo podatke i ne stvaramo korisničke profile. Gore opisane podatke obrađuje <b>Google</b> kao izvršitelj obrade: AdMob (oglasi), Maps i Places (karte i trgovine), Analytics (statistika), a ako otvorite račun, Firebase Authentication, Cloud Firestore i Firebase Hosting (račun i sinkronizacija). Osim toga, nakon otvaranja računa, na Vašu adresu e-pošte šaljemo jednokratnu e-poruku dobrodošlice na jeziku stranice na kojoj je račun otvoren. Ovu e-poruku obrađuju i šalju poslužitelji tvrtke <b>OVH SAS</b> (Francuska, EU), našeg pružatelja usluga e-pošte, koji djeluje kao izvršitelj obrade u naše ime, na temelju čl. 6. st. 1. toč. (b) Opće uredbe o zaštiti podataka. Inače dijelimo podatke samo s osobama kojima sami date poveznicu za procjenu (odjeljak 3.5) te kada to zahtijeva važeći zakon.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Plaćanja (Stripe)",
      html: `<p>Pretplatom <b>LiczMat Pro</b> upravlja <b>Stripe</b> (Stripe Payments Europe, Ltd., Irska). Ako je odlučite kupiti, bit ćete preusmjereni na Stripeovu stranicu za plaćanje. Stripe, kao neovisni voditelj obrade, prima i obrađuje podatke o plaćanju: broj kartice, podatke za naplatu i povijest plaćanja. <b>Mi ne vidimo i ne pohranjujemo broj Vaše kartice.</b> Vaša adresa e-pošte i ID računa (UID) šalju se Stripeu kako bi se plaćena pretplata mogla dodijeliti ispravnom računu. Zauzvrat dobivamo samo status plana (Besplatni ili Pro), datum njegovog isteka i informaciju hoće li se pretplata obnoviti. Svojim računima, promjenama kartice i otkazivanjima upravljate na korisničkom portalu Stripea. Stripeova pravila privatnosti dostupna su na: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Prijenosi podataka izvan EGP-a",
      html: `<p>Google LLC (odgovoran za Firebase Authentication, Google Analytics, AdMob, Maps, Places i Firebase Hosting) i GitHub, Inc. (koji hostira našu web stranicu i obrađuje standardne zapisnike poslužitelja, uključujući IP adrese) američke su tvrtke. Prijenos Vaših podataka u SAD temelji se na <b>odluci o primjerenosti Europske komisije za EU-US Data Privacy Framework</b>, budući da su obje tvrtke certificirane. Dodatno, temelji se na <b>standardnim ugovornim klauzulama</b> uključenim u njihove uvjete obrade podataka (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Vaša prava (Opća uredba o zaštiti podataka)",
      html: `<p>U skladu s Općom uredbom o zaštiti podataka, imate pravo na pristup, ispravak, brisanje, ograničenje obrade, prenosivost podataka i prigovor, kao i pravo na povlačenje privole za personalizirane oglase i analitiku. <b>Ako se obrada temelji na čl. 6. st. 1. toč. (f) GDPR-a, možete uložiti prigovor u bilo kojem trenutku iz razloga povezanih s vašom posebnom situacijom (čl. 21. GDPR-a).</b></p><p>Izravno kontrolirate podatke koji ostaju na uređaju (podaci aplikacije, dopuštenja, ID za oglašavanje u postavkama Androida). Podatke računa možete pregledati i promijeniti u Aplikaciji ili na <a href="/app/">liczmat.com/app/</a>, izvesti ih putem funkcije sigurnosne kopije i obrisati ih uklanjanjem pojedinačnih zapisa ili zahtjevom za brisanje cijelog računa (odjeljak 3.6). Za pitanja u vezi s Vašim podacima pište na: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Također imate pravo podnijeti pritužbu nadležnom nadzornom tijelu: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, ili nadzornom tijelu za zaštitu podataka u Vašoj zemlji prebivališta unutar EU-a.</p>`
    },
    {
      id: "dzieci",
      h: "10. Djeca",
      html: `<p>Aplikacija nije namijenjena djeci i svjesno ne prikupljamo podatke osoba mlađih od 13 godina. LiczMat račun namijenjen je osobama koje imaju 16 ili više godina, ili imaju pristanak zakonskih skrbnika.</p>`
    },
    {
      id: "zmiany",
      h: "11. Izmjene i kontakt",
      html: `<p>Možemo ažurirati ova pravila. O značajnim promjenama obavijestit ćemo u Aplikaciji ili na Google Playu. Datum posljednjeg ažuriranja nalazi se na vrhu dokumenta. Kontakt: <b>${ENTITY.name}</b>, e-pošta: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
