import { ENTITY } from "../site.mjs";

export default {
  lang: "cs",
  title: "Zásady ochrany osobních údajů",
  updated: "2026-10-06",
  binding: false,
  translationNote: "Toto je překlad. Závazná je německá verze.",
  sections: [
    {
      id: "podejscie",
      h: "1. Přístup k ochraně osobních údajů",
      html: `<p>Tyto zásady popisují, jaké údaje zpracovává mobilní aplikace <b>LiczMat, kalkulačka stavebních materiálů</b> („aplikace“) a webové stránky <b>liczmat.com</b> („webové stránky“) a za jakým účelem. Správcem údajů je <b>${ENTITY.name}</b>, ${ENTITY.address} („my“), kontakt: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funguje na principu <b>offline-first</b>. Všechny výpočty probíhají na vašem zařízení a fungují bez internetu. Lokální databáze je jediným zdrojem pravdy, cloud je pouze její kopií.</p><p><b>Účet je volitelný.</b> Pro výpočty se nemusíte přihlašovat. Dokud si nevytvoříte účet, neodesíláme vaše projekty ani výpočty na žádný server. Záloha je soubor, který si sami exportujete a uložíte. Pokud se rozhodnete vytvořit účet, níže popsané údaje budou odeslány do služby <b>Google Firebase</b>. Další podrobnosti najdete v části 3.</p><p>Aplikace využívá také další služby <b>Google</b> (reklamy a mapy/vyhledávání obchodů), které zpracovávají určité údaje. To popisujeme níže.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Údaje uložené v zařízení",
      html: `<p>Lokálně na vašem zařízení ukládáme: projekty, výpočty, nákupní seznamy, místnosti, vlastní materiály a nastavení (např. jazyk, měna, motiv, údaje o dodavateli). Odinstalováním aplikace nebo vymazáním jejích dat tyto informace ze zařízení trvale odstraníte. Zálohu (export do souboru) si vytváříte a uchováváte sami.</p><p><b>Katalog materiálů, vaše vlastní materiály a ceny, jakož i nastavení se nesynchronizují.</b> Zůstávají výhradně v zařízení, i když máte účet.</p>`
    },
    {
      id: "konto",
      h: "3. Účet LiczMat a synchronizace (volitelné)",
      html: `<p>Můžete si vytvořit <b>účet LiczMat</b>, abyste měli stejné projekty na chytrém telefonu i v prohlížeči (<a href="/app/">liczmat.com/app/</a>). Účet je bezplatný a zcela dobrovolný. Bez účtu fungují aplikace i webové stránky jako doposud.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Jaké údaje zpracováváme, pokud máte účet",
      html: `<ul><li><b>E-mailová adresa a heslo.</b> Spravuje <b>Firebase Authentication</b>. Vaše heslo nevidíme a neuchováváme, Google jej ukládá jako hash. Přihlašovací okno Google a stránky otevírané z odkazů v e-mailech účtu (např. obnovení hesla, potvrzení e-mailu) poskytuje <b>auth.liczmat.com</b>, služba Firebase Hosting (Google) v rámci stejného projektu.</li><li><b>Přihlášení přes Google</b> (volitelná alternativa k heslu). V tomto případě neexistuje heslo. Od Googlu získáme e-mailovou adresu, zobrazované jméno a ID účtu, abychom je mohli propojit s vašimi údaji v LiczMat (zobrazované jméno je použito v uvítacím e-mailu). Nezískáváme žádné jiné údaje z vašeho účtu Google.</li><li><b>ID účtu (UID)</b> přidělené službou Firebase.</li><li><b>Obsah účtu:</b> projekty, místnosti, odhady a nákupní seznamy. Názvy, množství, jednotky, ceny, měna, vstupy do kalkulačky a časová razítka vytvoření a změny.</li><li><b>Technické údaje:</b> datum vytvoření účtu, datum posledního použití a informace o tom, zda se připojujete přes aplikaci nebo webové stránky.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Kde jsou údaje uloženy",
      html: `<p>Databáze <b>Google Cloud Firestore</b> a služby <b>Cloud Functions</b> běží v regionu <b>europe-central2 (Varšava)</b>, tedy v rámci Evropské unie. Služba <b>Firebase Authentication</b> (vaše přihlašovací údaje, jako je e-mailová adresa, zobrazované jméno, hash hesla a ID účtu Google) však běží na globální infrastruktuře Googlu, takže tyto údaje mohou být zpracovávány ve Spojených státech (viz část 8). Google zde vystupuje jako zpracovatel naším jménem.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Kdo k nim má přístup",
      html: `<p>Výhradně majitel účtu. Bezpečnostní pravidla Firestore umožňují číst a zapisovat údaje účtu pouze přihlášenému uživateli se stejným ID. Jedinou výjimkou je odkaz, který sami vytvoříte. Viz část 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Jak funguje synchronizace",
      html: `<p>Po každé lokální změně aplikace odešle dokument do Firestore a změny z cloudu stáhne zpět do databáze zařízení. V případě konfliktu vítězí novější záznam (porovnání časových razítek). Smazání záznamu jej okamžitě neodstraní z cloudu: dokument je označen jako smazaný, aby se o smazání dozvědělo i druhé zařízení a neobnovilo jej. Tyto značky jsou odstraněny po <b>30 dnech</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Sdílení odhadu pomocí odkazu",
      html: `<p>Pokud kliknete na „Sdílet“, vytvoříme <b>kopii</b> vybraného projektu (název, odhady, nákupní seznam, měna) na náhodné 128bitové adrese liczmat.com/p/&lt;token&gt;. Tato kopie je <b>veřejně čitelná pro kohokoli, kdo zná odkaz</b>. Token v adrese je jedinou ochranou, proto jej sdílejte pouze s osobami, které by měly odhad vidět. Kopie se neaktualizuje automaticky, musíte ji aktualizovat ručně pomocí tlačítka. Smazáním odkazu se přístup okamžitě zruší. Osoba, která odkaz otevře, nepotřebuje účet a neshromažďujeme o ní žádné údaje kromě standardní analytiky webových stránek (část 6).</p>`
    },
    {
      id: "konto-calendar-link",
      h: "3.5.1. Soukromý odkaz na kalendář",
      html: `<p>Pokud vytvoříte soukromý odkaz na kalendář, každý, kdo zná tuto adresu, si může přečíst otevřené termíny z vašeho kalendáře včetně názvu, data, klienta a poznámky. Vytvořením nového odkazu se starý vypne.</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Jak dlouho údaje uchováváme a jak je smazat",
      html: `<p>Údaje účtu uchováváme po dobu existence účtu. Jednotlivé projekty a místnosti můžete kdykoli smazat a celý účet můžete smazat sami: <a href="/app/">liczmat.com/app/</a> → záložka <b>Účet</b> → <b>Smazat účet</b>. Tím se smažou všechny dokumenty účtu ve Firestore (projekty, místnosti, odhady, nákupní seznamy a vytvořené odkazy) a nakonec i samotný účet ve Firebase Authentication. Tuto akci nelze vrátit zpět. Na stejné záložce si můžete předem stáhnout celý obsah účtu jako soubor JSON. Pokud chcete, abychom to udělali za vás, napište na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Údaje uložené ve vašem zařízení nebo v prohlížeči smažete samostatně vymazáním dat aplikace nebo dat webu.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Právní základ",
      html: `<p>Zpracování údajů účtu je nezbytné pro plnění služby, kterou požadujete. čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy). Vytvoření účtu je dobrovolné, bez něj můžete využívat všechny funkce kalkulačky.</p>`
    },
    {
      id: "reklamy",
      h: "4. Reklamy (Google AdMob)",
      html: `<p>Aplikace je bezplatná a je podporována reklamami poskytovanými službou <b>Google AdMob</b>. Proto může Google jako poskytovatel reklamy shromažďovat a zpracovávat:</p><ul><li><b>reklamní ID</b> (Android Advertising ID),</li><li>IP adresu a údaje o zařízení (model, operační systém, jazykové nastavení),</li><li>přibližnou polohu (na základě IP adresy),</li><li>informace o interakci s reklamou (zobrazení, kliknutí).</li></ul><p>Tyto údaje se používají k zobrazování reklam, omezení jejich frekvence, měření výkonu a prevenci podvodů. Zásady Googlu to popisují: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Zásady Googlu pro partnerské weby</a> a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Zásady ochrany soukromí Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Souhlas (GDPR) a personalizované reklamy",
      html: `<p>Pokud se nacházíte v Evropském hospodářském prostoru, ve Velké Británii nebo ve Švýcarsku, při prvním spuštění zobrazíme okno pro souhlas (Google User Messaging Platform), kde se rozhodnete o personalizovaných reklamách. Bez vašeho souhlasu se zobrazují pouze <b>nepersonalizované</b> reklamy. Svůj souhlas můžete kdykoli změnit nebo odvolat vymazáním dat aplikace v nastavení systému nebo resetováním reklamního ID v nastavení systému Android. Právním základem pro personalizované reklamy je souhlas, čl. 6 odst. 1 písm. a) GDPR, a pro čtení nebo ukládání informací v zařízení navíc § 25 odst. 1 TDDDG (německý zákon o ochraně osobních údajů v telekomunikacích a digitálních službách). Nepersonalizované reklamy: oprávněný zájem na financování bezplatné aplikace, čl. 6 odst. 1 písm. f) GDPR.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analytika aplikace (Firebase / Google Analytics)",
      html: `<p>Aplikace využívá <b>Google Analytics for Firebase</b> k anonymnímu a souhrnnému měření toho, jak jsou využívány její funkce (např. které kalkulačky otevíráte, počet aktivních uživatelů). To nám pomáhá LiczMat zlepšovat. Analytika je ve výchozím nastavení <b>vypnutá</b> a aktivuje se až po udělení vašeho souhlasu ve stejném okně (Google User Messaging Platform). Bez souhlasu se nic neshromažďuje. Údaje jsou zpracovávány společností Google v souladu se <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Zásadami ochrany soukromí Google</a>. Právním základem je souhlas, čl. 6 odst. 1 písm. a) GDPR a § 25 odst. 1 TDDDG; souhlas lze kdykoli odvolat s účinkem do budoucna.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Poloha a vyhledávání obchodů (Google Maps / Places)",
      html: `<p>Funkce „Najít obchod“ využívá služby <b>Google Maps</b> a <b>Google Places</b>. Pokud udělíte souhlas s přístupem k poloze, aplikace použije vaši přibližnou nebo přesnou polohu k zobrazení obchodů se stavebninami v okolí a k výpočtu trasy. Požadavky na mapové služby zpracovává Google v souladu se svými zásadami ochrany soukromí. Přístup k poloze můžete odmítnout. V takovém případě se obchody nebudou vyhledávat automaticky, ale všechny ostatní funkce budou fungovat beze změny. Vaši polohu neukládáme, ani v zařízení, ani v účtu.</p>`
    },
    {
      id: "strona",
      h: "6. Webové stránky",
      html: `<p>Webové stránky <b>liczmat.com</b> jsou statické. Při otevření webu hostitel Firebase Hosting (Google LLC) zpracovává standardní data ze serverových protokolů (IP adresa, čas, požadovaná stránka, prohlížeč) za účelem bezpečného doručování webu; právní základ čl. 6 odst. 1 písm. f) GDPR (oprávněný zájem na bezpečném a spolehlivém webu). Využívají <b>Google Analytics</b> (GA4) k anonymnímu a souhrnnému měření návštěvnosti (např. kolik lidí navštíví webové stránky a kolik přejde na Google Play), abychom je mohli zlepšovat. Analytika je ve výchozím nastavení vypnutá: v souladu s GDPR vás nejprve požádáme o souhlas a Google Analytics (včetně ukládání souborů cookie) se spustí až po jeho udělení. Můžete odmítnout a všechny ostatní funkce zůstanou využitelné. Právním základem je souhlas, čl. 6 odst. 1 písm. a) GDPR a § 25 odst. 1 TDDDG; odvolání kdykoli prostřednictvím nastavení souborů cookie/souhlasu na webu, s účinkem do budoucna. Kromě Analytics webové stránky nevyužívají webová písma. Veškerý ostatní kód a styly jsou poskytovány z domény webových stránek a interaktivní kalkulačky provádějí výpočty výhradně ve vašem prohlížeči.</p><p>Výjimkou jsou místa, kde jsou integrovány externí služby. <b>Obchody:</b> Webové stránky vkládají mapu <b>Google Maps</b>, která se načítá ze serverů Google. Pokud nasdílíte svou polohu, je použita pouze k vycentrování mapy a nikde se neukládá. Pro zobrazení seznamu nejbližších obchodů webové stránky odesílají vaše přibližné souřadnice do služby <b>OpenStreetMap (Overpass API)</b> a získávají veřejná data o obchodech. Tlačítko „Navigovat“ otevře trasu v Google Maps. Návrhy měst na základě PSČ využívají databázi GeoNames (geonames.org), CC BY 4.0, umístěnou přímo na našem serveru, a zadané PSČ nezíská žádná třetí strana. Právním základem je čl. 6 odst. 1 písm. a) GDPR, když návštěvník sdílí polohu, jinak se mapa načte až když návštěvník otevře vyhledávač obchodů. <b>/app/:</b> Po přihlášení se webové stránky připojí k <b>Firebase</b> (ověřování a Firestore) za podmínek uvedených v části 3 a uloží přihlašovací údaje v prohlížeči, abyste nemuseli zadávat heslo při každé návštěvě. <b>/p/&lt;token&gt;:</b> Webové stránky získají sdílenou kopii odhadu z Firestore bez přihlášení a bez shromažďování údajů o osobě, která odkaz otevře. Obě tyto podstránky jsou vyloučeny z indexování.</p><p><b>Projekty, místnosti a odhady uložené na webových stránkách bez přihlášení</b> zůstávají výhradně v lokálním úložišti vašeho prohlížeče (localStorage) a nikam se neodesílají. Nevidíme je a nemáme k nim přístup. Smažete je vymazáním dat webu v prohlížeči. Do cloudu se dostanou až tehdy, když se přihlásíte ke svému účtu a sami kliknete na „Odeslat z prohlížeče do účtu“. Od toho okamžiku platí část 3. V prohlížeči ukládáme také váš výběr jazyka, výběr měny, výběr motivu a vaše rozhodnutí o souhlasu s analytikou.</p>`
    },
    {
      id: "komu",
      h: "7. Komu předáváme údaje",
      html: `<p>Údaje neprodáváme a nevytváříme uživatelské profily. Výše popsané údaje zpracovává společnost <b>Google</b> jako zpracovatel: AdMob (reklamy), Maps a Places (mapy a obchody), Analytics (statistiky) a, pokud si vytvoříte účet, Firebase Authentication, Cloud Firestore a Firebase Hosting (účet a synchronizace). Kromě toho po vytvoření účtu zašleme na vaši e-mailovou adresu jednorázový uvítací e-mail v jazyce stránky, na které byl účet vytvořen. Tento e-mail zpracovávají a odesílají servery společnosti <b>OVH SAS</b> (Francie, EU), našeho poskytovatele e-mailových služeb, jako zpracovatele naším jménem, a to na základě čl. 6 odst. 1 písm. b) GDPR. Jinak sdílíme údaje pouze s osobami, kterým sami poskytnete odkaz na odhad (část 3.5), a pokud to vyžadují platné právní předpisy.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Platby (Stripe)",
      html: `<p>Předplatné <b>LiczMat Pro</b> zpracovává <b>Stripe</b> (Stripe Payments Europe, Ltd., Irsko). Pokud se rozhodnete si jej zakoupit, budete přesměrováni na platební stránku Stripe. Stripe jako nezávislý správce přijímá a zpracovává platební údaje: číslo karty, fakturační údaje a historii plateb. <b>Číslo vaší karty nevidíme a neukládáme.</b> Vaše e-mailová adresa a ID účtu (UID) jsou odeslány do Stripe, aby bylo možné zaplacené předplatné přiřadit ke správnému účtu. Na oplátku dostáváme pouze stav tarifu (bezplatný nebo Pro), datum jeho platnosti a informaci, zda se předplatné obnoví. Faktury, změnu karty a zrušení spravujete v klientském portálu Stripe. Zásady ochrany osobních údajů Stripe najdete na: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Předávání údajů mimo EHP",
      html: `<p>Google LLC (odpovědná za Firebase Authentication, Google Analytics, AdMob, Maps, Places a Firebase Hosting, který hostuje naše webové stránky a zpracovává standardní protokoly serveru, včetně IP adres) je americká společnost. Předávání vašich údajů do USA je založeno na <b>rozhodnutí Evropské komise o odpovídající ochraně pro EU-US Data Privacy Framework</b>, protože společnost je certifikována. Kromě toho je založeno na <b>standardních smluvních doložkách</b> obsažených v jejích podmínkách zpracování údajů (Google Cloud Data Processing Addendum).</p>`
    },
    {
      id: "prawa",
      h: "9. Vaše práva (GDPR)",
      html: `<p>Podle GDPR máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost údajů a vznést námitku, jakož i právo odvolat svůj souhlas s personalizovanými reklamami a analytikou. <b>Pokud je zpracování založeno na čl. 6 odst. 1 písm. f) GDPR, můžete kdykoli vznést námitku z důvodů týkajících se vaší konkrétní situace (čl. 21 GDPR).</b></p><p>Údaje, které zůstávají v zařízení, ovládáte přímo (data aplikace, oprávnění, reklamní ID v nastavení Androidu). Údaje o účtu můžete zkontrolovat a změnit v aplikaci nebo na <a href="/app/">liczmat.com/app/</a>, exportovat pomocí funkce zálohování a odstranit smazáním jednotlivých záznamů nebo požádáním o smazání celého účtu (část 3.6). S dotazy ohledně vašich údajů pište na: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Máte také právo podat stížnost u příslušného dozorového úřadu: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, nebo u dozorového úřadu pro ochranu osobních údajů ve vaší zemi pobytu v rámci EU.</p>`
    },
    {
      id: "dzieci",
      h: "10. Děti",
      html: `<p>Aplikace není určena dětem a vědomě neshromažďujeme údaje od osob mladších 13 let. Účet LiczMat je určen osobám starším 16 let nebo se souhlasem jejich zákonných zástupců.</p>`
    },
    {
      id: "zmiany",
      h: "11. Změny a kontakt",
      html: `<p>Tyto zásady můžeme aktualizovat. Významné změny oznámíme v aplikaci nebo na Google Play. Datum poslední aktualizace je na začátku dokumentu. Kontakt: <b>${ENTITY.name}</b>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
