import { ENTITY } from "../site.mjs";

export default {
  lang: "ro",
  title: "Politica de confidențialitate",
  updated: "2026-10-02",
  binding: false,
  translationNote: "Aceasta este o traducere. Versiunea în limba germană este obligatorie.",
  sections: [
    {
      id: "podejscie",
      h: "1. Abordarea privind confidențialitatea",
      html: `<p>Această politică descrie ce date prelucrează aplicația mobilă <b>LiczMat, calculator pentru materiale de construcții</b> („Aplicația”) și site-ul web <b>liczmat.com</b> („Site-ul web”) și în ce scop. Operatorul de date este <b>${ENTITY.name}</b>, ${ENTITY.address} („noi”), contact: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funcționează pe principiul <b>offline-first</b>. Toate calculele sunt efectuate pe dispozitivul dumneavoastră și funcționează fără internet. Baza de date locală este singura sursă de adevăr, iar cloud-ul este doar o copie a acesteia.</p><p><b>Un cont este opțional.</b> Nu trebuie să vă conectați pentru a efectua calcule. Atâta timp cât nu creați un cont, nu trimitem proiectele sau calculele dumneavoastră către niciun server. O copie de rezervă este un fișier pe care îl exportați și îl salvați singur. Dacă alegeți să creați un cont, datele descrise mai jos vor fi trimise către <b>Google Firebase</b>. Vedeți secțiunea 3 pentru detalii.</p><p>Aplicația utilizează, de asemenea, alte servicii <b>Google</b> (reclame și căutare pe hartă/magazine), care prelucrează anumite date. Descriem acest lucru mai jos.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Date stocate pe dispozitiv",
      html: `<p>La nivel local, pe dispozitivul dumneavoastră, stocăm: proiecte, calcule, liste de cumpărături, camere, materialele personalizate și setările (de exemplu, limbă, monedă, temă, detaliile contractorului). Dezinstalarea Aplicației sau ștergerea datelor acesteia elimină definitiv aceste informații de pe dispozitiv. Creați și păstrați singur copia de rezervă (export într-un fișier).</p><p><b>Catalogul de materiale, materialele și prețurile dumneavoastră personalizate, precum și setările nu sunt sincronizate.</b> Acestea rămân exclusiv pe dispozitiv, chiar dacă aveți un cont.</p>`
    },
    {
      id: "konto",
      h: "3. Contul LiczMat și sincronizarea (opțional)",
      html: `<p>Puteți crea un <b>cont LiczMat</b> pentru a avea aceleași proiecte pe smartphone și în browser (<a href="/app/">liczmat.com/app/</a>). Contul este gratuit și complet voluntar. Fără un cont, Aplicația și Site-ul web funcționează ca înainte.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Ce date prelucrăm atunci când aveți un cont",
      html: `<ul><li><b>Adresa de e-mail și parola.</b> Gestionate de <b>Firebase Authentication</b>. Noi nu vedem și nu stocăm parola dumneavoastră, aceasta este stocată de Google sub formă de hash. Fereastra de conectare Google și paginile accesate prin link-urile din e-mailurile contului (de exemplu, resetarea parolei, confirmarea e-mailului) sunt furnizate de <b>auth.liczmat.com</b>, un serviciu Firebase Hosting (Google) din cadrul aceluiași proiect.</li><li><b>Conectare cu Google</b> (alternativă opțională la parolă). În acest caz, nu există o parolă. Primim adresa de e-mail, numele afișat și un ID de cont de la Google pentru a le asocia cu datele dumneavoastră din LiczMat (numele afișat este utilizat în e-mailul de bun venit). Nu preluăm nicio altă dată din contul dumneavoastră Google.</li><li><b>ID-ul contului (UID)</b> atribuit de Firebase.</li><li><b>Conținutul contului:</b> proiecte, camere, estimări și liste de cumpărături. Nume, cantități, unități, prețuri, monedă, datele introduse în calculator, precum și marcajele de timp pentru creare și modificare.</li><li><b>Date tehnice:</b> data creării contului, data ultimei utilizări și dacă vă conectați prin intermediul Aplicației sau al Site-ului web.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Unde sunt stocate datele",
      html: `<p>Baza de date <b>Google Cloud Firestore</b> și serviciile <b>Cloud Functions</b> rulează în regiunea <b>europe-central2 (Varșovia)</b>, adică în cadrul Uniunii Europene. Cu toate acestea, serviciul <b>Firebase Authentication</b> (datele dumneavoastră de conectare, cum ar fi adresa de e-mail, numele afișat, hash-ul parolei și ID-ul contului Google) rulează pe infrastructura globală a Google, astfel încât aceste date pot fi prelucrate în Statele Unite (a se vedea secțiunea 8). Google acționează aici în calitate de persoană împuternicită în numele nostru.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Cine are acces la ele",
      html: `<p>Exclusiv proprietarul contului. Regulile de securitate Firestore permit citirea și scrierea datelor contului numai pentru utilizatorul autentificat cu același ID. Singura excepție este un link pe care îl creați dumneavoastră. A se vedea secțiunea 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Cum funcționează sincronizarea",
      html: `<p>După fiecare modificare locală, Aplicația trimite documentul către Firestore și preia modificările din cloud înapoi în baza de date a dispozitivului. În cazul unui conflict, intrarea mai nouă câștigă (comparând marcajele de timp). Ștergerea unei înregistrări nu o elimină imediat din cloud: documentul este marcat ca șters, astfel încât celălalt dispozitiv să afle despre ștergere și să nu îl restabilească. Aceste marcaje sunt eliminate după <b>30 de zile</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Partajarea unei estimări printr-un link",
      html: `<p>Dacă atingeți „Partajare”, creăm o <b>copie</b> a proiectului selectat (nume, estimări, listă de cumpărături, monedă) la o adresă aleatorie pe 128 de biți liczmat.com/p/&lt;token&gt;. Această copie este <b>lizibilă public pentru oricine cunoaște link-ul</b>. Tokenul din adresă este singura protecție, așadar partajați-l doar cu persoanele care ar trebui să vadă estimarea. Copia nu se actualizează automat, trebuie să o actualizați manual printr-un buton. Ștergerea link-ului revocă accesul imediat. Persoana care deschide link-ul nu are nevoie de un cont, iar noi nu colectăm nicio dată despre ea, în afară de datele analitice standard ale Site-ului web (secțiunea 6).</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Cât timp păstrăm datele și cum le puteți șterge",
      html: `<p>Păstrăm datele contului atâta timp cât contul există. Puteți șterge proiecte și camere individuale în orice moment. Puteți șterge singur întregul cont la <a href="/app/">liczmat.com/app/</a> → fila <b>Cont</b> → <b>Ștergeți contul</b>. Aceasta șterge toate documentele contului din Firestore (proiecte, camere, estimări, liste de cumpărături și link-uri create) și, în cele din urmă, contul în sine din Firebase Authentication. Această acțiune nu poate fi anulată. În aceeași filă, puteți descărca în prealabil tot conținutul contului dumneavoastră sub forma unui fișier JSON. Dacă doriți să facem acest lucru pentru dumneavoastră, scrieți la <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Ștergeți separat datele stocate pe dispozitivul dumneavoastră sau în browser, ștergând datele Aplicației sau datele site-ului.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Temei juridic",
      html: `<p>Prelucrarea datelor contului este necesară pentru executarea serviciului pe care îl solicitați. art. 6 alin. (1) lit. (b) din RGPD (executarea unui contract). Crearea unui cont este voluntară, fără el puteți utiliza toate funcțiile calculatorului.</p>`
    },
    {
      id: "reklamy",
      h: "4. Reclame (Google AdMob)",
      html: `<p>Aplicația este gratuită și este susținută de reclame furnizate de <b>Google AdMob</b>. Prin urmare, Google, în calitate de furnizor de reclame, poate colecta și prelucra:</p><ul><li><b>ID-ul de publicitate</b> (Android Advertising ID),</li><li>adresa IP și datele dispozitivului (model, sistem de operare, setări de limbă),</li><li>locația aproximativă (pe baza adresei IP),</li><li>informații despre interacțiunile cu reclamele (afișări, clicuri).</li></ul><p>Aceste date sunt utilizate pentru a afișa reclame, a limita frecvența acestora, a măsura performanța și a preveni fraudele. Politicile Google descriu acest lucru: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Politica Google privind site-urile partenere</a> și <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Politica de confidențialitate Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Consimțământ (RGPD) și reclame personalizate",
      html: `<p>Dacă vă aflați în Spațiul Economic European, Regatul Unit sau Elveția, afișăm o fereastră de consimțământ (Google User Messaging Platform) la prima lansare, unde decideți cu privire la reclamele personalizate. Fără consimțământul dumneavoastră, sunt afișate doar reclame <b>nepersonalizate</b>. Vă puteți modifica sau retrage consimțământul în orice moment prin ștergerea datelor aplicației din setările sistemului sau prin resetarea ID-ului de publicitate din setările Android. Temeiul juridic pentru reclamele personalizate este consimțământul, art. 6 alin. (1) lit. (a) GDPR, iar pentru citirea sau stocarea informațiilor pe dispozitiv, în plus, § 25 alin. (1) TDDDG (legea germană privind protecția datelor în telecomunicații și servicii digitale). Reclame nepersonalizate: interes legitim în finanțarea aplicației gratuite, art. 6 alin. (1) lit. (f) GDPR.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analizele aplicației (Firebase / Google Analytics)",
      html: `<p>Aplicația folosește <b>Google Analytics for Firebase</b> pentru a măsura în mod anonim și agregat modul în care îi sunt utilizate funcțiile (de exemplu, ce calculatoare deschideți, numărul de utilizatori activi). Acest lucru ne ajută să îmbunătățim LiczMat. Funcția de analiză este <b>dezactivată</b> în mod implicit și este activată numai după ce vă dați consimțământul în aceeași fereastră (Google User Messaging Platform). Fără consimțământ, nu se colectează nimic. Datele sunt prelucrate de Google în conformitate cu <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Politica de confidențialitate Google</a>. Temeiul juridic este consimțământul, art. 6 alin. (1) lit. (a) GDPR și § 25 alin. (1) TDDDG; consimțământul poate fi retras în orice moment cu efect pentru viitor.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Locația și căutarea magazinelor (Google Maps / Places)",
      html: `<p>Funcția „Găsiți un magazin” utilizează <b>Google Maps</b> și <b>Google Places</b>. Dacă acordați permisiunea de acces la locație, Aplicația utilizează locația dumneavoastră aproximativă sau precisă pentru a afișa magazinele de materiale de construcții din apropiere și pentru a calcula traseul. Solicitările către serviciile de hărți sunt prelucrate de Google în conformitate cu politica lor de confidențialitate. Puteți refuza accesul la locație. În acest caz, magazinele nu vor fi găsite automat, dar toate celelalte funcții vor funcționa normal. Nu stocăm locația dumneavoastră, nici pe dispozitiv, nici în cont.</p>`
    },
    {
      id: "strona",
      h: "6. Site-ul web",
      html: `<p>Site-ul web <b>liczmat.com</b> este static. Când site-ul este deschis, gazda GitHub Pages (GitHub, Inc.) procesează datele standard de jurnal de server (adresa IP, ora, pagina solicitată, browser) pentru a livra site-ul în siguranță; temeiul juridic art. 6 alin. (1) lit. (f) GDPR (interes legitim pentru un site web sigur și de încredere). Acesta utilizează <b>Google Analytics</b> (GA4) pentru a măsura în mod anonim și agregat traficul (de exemplu, câte persoane vizitează Site-ul web și câte dau clic către Google Play), astfel încât să îl putem îmbunătăți. Funcția de analiză este dezactivată în mod implicit: în conformitate cu RGPD, vă solicităm mai întâi consimțământul, iar Google Analytics (inclusiv setarea cookie-urilor) pornește numai după ce îl acordați. Puteți refuza, iar toate celelalte funcții vor rămâne utilizabile. Temeiul juridic este consimțământul, art. 6 alin. (1) lit. (a) GDPR și § 25 alin. (1) TDDDG; retragere în orice moment prin setarea cookie-urilor/consimțământului pe site, cu efect pentru viitor. În afară de Analytics, Site-ul web nu utilizează fonturi web. Tot restul codului și stilurile sunt furnizate din domeniul Site-ului web, iar calculatoarele interactive efectuează calcule exclusiv în browserul dumneavoastră.</p><p>Excepțiile sunt zonele în care sunt integrate servicii externe. <b>Magazine:</b> Site-ul web încorporează o hartă <b>Google Maps</b>, care este încărcată de pe serverele Google. Dacă partajați locația dumneavoastră, aceasta este utilizată doar pentru a centra harta și nu este stocată nicăieri. Pentru a afișa lista celor mai apropiate magazine, Site-ul web trimite coordonatele dumneavoastră aproximative către serviciul <b>OpenStreetMap (Overpass API)</b> și preia date publice despre magazine. Butonul „Navigați” deschide traseul în Google Maps. Sugestiile de orașe bazate pe coduri poștale utilizează o bază de date GeoNames (geonames.org), CC BY 4.0, găzduită direct pe serverul nostru, și nicio terță parte nu primește codul poștal introdus. Temeiul juridic este art. 6 alin. (1) lit. (a) GDPR atunci când vizitatorul partajează locația, altfel harta se încarcă doar când vizitatorul deschide căutarea magazinelor. <b>/app/:</b> După conectare, Site-ul web se conectează la <b>Firebase</b> (Autentificare și Firestore) conform condițiilor din secțiunea 3 și stochează datele de conectare în browser, astfel încât să nu vi se ceară o parolă la fiecare vizită. <b>/p/&lt;token&gt;:</b> Site-ul web preia copia partajată a unei estimări din Firestore fără a vă conecta și fără a colecta date despre persoana care deschide link-ul. Ambele aceste subpagini sunt excluse de la indexare.</p><p><b>Proiectele, camerele și estimările salvate pe Site-ul web fără a vă conecta</b> rămân exclusiv în stocarea locală a browserului dumneavoastră (localStorage) și nu sunt trimise nicăieri. Nu le vedem și nu avem acces la ele. Le ștergeți prin curățarea datelor site-ului din browserul dumneavoastră. Acestea ajung în cloud doar atunci când vă conectați la contul dumneavoastră și faceți clic singur pe „Trimiteți din browser în cont”. Din acel moment, se aplică secțiunea 3. De asemenea, stocăm în browser alegerea dumneavoastră de limbă, alegerea monedei, alegerea temei și decizia dumneavoastră cu privire la consimțământul pentru analiză.</p>`
    },
    {
      id: "komu",
      h: "7. Cu cine partajăm datele",
      html: `<p>Nu vindem date și nu creăm profiluri de utilizator. Datele descrise mai sus sunt prelucrate de <b>Google</b> în calitate de persoană împuternicită: AdMob (reclame), Maps și Places (hărți și magazine), Analytics (statistici) și, dacă creați un cont, Firebase Authentication, Cloud Firestore și Firebase Hosting (cont și sincronizare). În plus, după crearea contului, trimitem un e-mail unic de bun venit la adresa dumneavoastră de e-mail în limba paginii pe care a fost creat contul. Acest e-mail este prelucrat și trimis prin intermediul serverelor <b>OVH SAS</b> (Franța, UE), furnizorul nostru de e-mail, acționând în calitate de persoană împuternicită în numele nostru, pe baza art. 6 alin. (1) lit. (b) din RGPD. În caz contrar, partajăm datele doar cu persoanele cărora le oferiți singur link-ul de estimare (secțiunea 3.5) și atunci când legislația aplicabilă o cere.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Plăți (Stripe)",
      html: `<p>Abonamentul <b>LiczMat Pro</b> este gestionat de <b>Stripe</b> (Stripe Payments Europe, Ltd., Irlanda). Dacă decideți să îl achiziționați, veți fi redirecționat către pagina de plată Stripe. Stripe, în calitate de operator independent, primește și prelucrează datele de plată: numărul cardului, detaliile de facturare și istoricul plăților. <b>Noi nu vedem și nu stocăm numărul cardului dumneavoastră.</b> Adresa dumneavoastră de e-mail și ID-ul contului (UID) sunt trimise către Stripe pentru ca abonamentul plătit să poată fi atribuit contului corect. În schimb, primim doar starea planului (Gratuit sau Pro), data expirării acestuia și dacă abonamentul se va reînnoi. Vă gestionați facturile, modificările cardului și anulările în portalul pentru clienți Stripe. Politica de confidențialitate a Stripe este disponibilă la: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Transferul datelor în afara SEE",
      html: `<p>Google LLC (responsabilă pentru Firebase Authentication, Google Analytics, AdMob, Maps, Places și Firebase Hosting) și GitHub, Inc. (care găzduiește site-ul nostru web și prelucrează jurnalele standard ale serverului, inclusiv adresele IP) sunt companii din SUA. Transferul datelor dumneavoastră în SUA se bazează pe <b>decizia privind caracterul adecvat a Comisiei Europene pentru EU-US Data Privacy Framework</b>, ambele companii fiind certificate. În plus, se bazează pe <b>clauzele contractuale standard</b> incluse în condițiile lor de prelucrare a datelor (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Drepturile dumneavoastră (RGPD)",
      html: `<p>Conform RGPD, aveți dreptul de acces, rectificare, ștergere, restricționare a prelucrării, portabilitatea datelor și opoziție, precum și dreptul de a vă retrage consimțământul pentru reclamele și analizele personalizate. <b>În cazul în care prelucrarea se bazează pe art. 6 alin. (1) lit. (f) GDPR, vă puteți opune în orice moment din motive legate de situația dumneavoastră particulară (art. 21 GDPR).</b></p><p>Controlați direct datele care rămân pe dispozitiv (datele aplicației, permisiunile, ID-ul de publicitate din setările Android). Puteți examina și modifica datele contului în Aplicație sau la <a href="/app/">liczmat.com/app/</a>, le puteți exporta prin funcția de rezervă și le puteți șterge eliminând înregistrări individuale sau solicitând ștergerea întregului cont (secțiunea 3.6). Pentru întrebări referitoare la datele dumneavoastră, scrieți la: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Aveți, de asemenea, dreptul de a depune o plângere la autoritatea de supraveghere competentă: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, sau la autoritatea de supraveghere a protecției datelor din țara dumneavoastră de reședință din cadrul UE.</p>`
    },
    {
      id: "dzieci",
      h: "10. Copii",
      html: `<p>Aplicația nu este adresată copiilor și nu colectăm cu bună știință date de la persoane cu vârsta sub 13 ani. Un cont LiczMat este destinat persoanelor cu vârsta de 16 ani sau peste, sau care au consimțământul reprezentanților lor legali.</p>`
    },
    {
      id: "zmiany",
      h: "11. Modificări și contact",
      html: `<p>Putem actualiza această politică. Vom anunța modificările semnificative în Aplicație sau pe Google Play. Data ultimei actualizări se află în partea de sus a documentului. Contact: <b>${ENTITY.name}</b>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
