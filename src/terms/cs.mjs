import { ENTITY } from "../site.mjs";

export default {
  lang: "cs",
  title: "Obchodní podmínky pro LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "Toto je překlad. Závazná je německá verze.",
  sections: [
    {
      id: "anbieter",
      h: "1. Poskytovatel a rozsah platnosti",
      html: `<p>Poskytovatelem LiczMat Pro je <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, DIČ: ${ENTITY.taxId}.</p><p>Tyto obchodní podmínky se vztahují na placené předplatné <b>LiczMat Pro</b>, které je nabízeno na liczmat.com pro webovou aplikaci na adrese <a href="/app/">liczmat.com/app/</a>. Bezplatné kalkulačky na liczmat.com, aplikace pro Android a bezplatný účet LiczMat jsou poskytovány bezplatně a nejsou součástí placené smlouvy.</p><p>Spotřebitelem ve smyslu § 13 německého občanského zákoníku (BGB) je každá fyzická osoba, která uzavírá právní jednání za účelem, který nelze převážně přičíst její obchodní ani samostatné profesní činnosti. Podnikatelem ve smyslu § 14 německého BGB je fyzická nebo právnická osoba nebo právně způsobilá osobní společnost, která při uzavírání smlouvy jedná v rámci své obchodní nebo samostatné profesní činnosti.</p><p>Vlastní obchodní podmínky zákazníka se nepoužijí.</p>`
    },
    {
      id: "leistung",
      h: "2. Služba",
      html: `<p>LiczMat Pro vám poskytuje online v prohlížeči funkce Pro popsané na <a href="/cs/liczmat-pro/">stránce LiczMat Pro</a> v době objednávky. Mezi ně patří zejména správa klientů, cenové nabídky s PDF a odkazem ke sdílení, plánování termínů, ceny a náklady v projektech a uložení firemních údajů. LiczMat ukládá vámi zadané údaje do vašeho účtu.</p><p>Výpočty a cenové nabídky z nich vytvořené jsou pomůckami. Před nákupem materiálu nebo předložením nabídky zkontrolujete množství, ceny, výsledky a vhodnost pro zamýšlený účel.</p><p>Nepřetržitá dostupnost není zaručena. Mohou se vyskytnout údržbové práce, technické poruchy a výpadky. Snažíme se udržovat omezení co nejkratší.</p>`
    },
    {
      id: "test",
      h: "3. Bezplatné zkušební období",
      html: `<p>Nové účty získávají LiczMat Pro <b>na 14 dní zdarma</b>. K tomu nejsou vyžadovány žádné platební údaje. Zkušební období končí automaticky a nepřeměňuje se na placené předplatné. Po jeho skončení se účet vrátí k bezplatnému tarifu.</p>`
    },
    {
      id: "vertrag",
      h: "4. Uzavření smlouvy",
      html: `<p>Prezentace LiczMat Pro na webových stránkách nepředstavuje závaznou nabídku k uzavření smlouvy.</p><p>Pro objednání se přihlásíte na adrese <a href="/app/">liczmat.com/app/</a>, zvolíte měsíční nebo roční předplatné a kliknete na tlačítko nákupu. Budete přesměrováni na stránku pokladny Stripe. Tam zadáte svou e-mailovou adresu a platební údaje. Před závěrečným kliknutím můžete všechny zadané údaje zkontrolovat a opravit. Smlouva je uzavřena, jakmile kliknete na tlačítko pro závazné předplatné s povinností platby.</p><p>Poskytovatelem platebních služeb je společnost Stripe Payments Europe, Limited (Irsko). Stripe potvrdí smlouvu e-mailem.</p><p>Smlouvu lze uzavřít v kterémkoli ze 13 jazyků nabízených na webových stránkách. Závazná je německá verze. Text smlouvy samostatně neukládáme. Tyto obchodní podmínky jsou na této adrese kdykoli k dispozici a lze je uložit nebo vytisknout. Doklady a faktury jsou k dispozici v zákaznickém portálu Stripe.</p>`
    },
    {
      id: "preise",
      h: "5. Ceny a platba",
      html: `<p>Platí ceny zobrazené na <a href="/cs/liczmat-pro/">stránce LiczMat Pro</a> a v pokladně v době objednávky. Jedná se o konečné ceny. Další náklady nevznikají. Vyúčtování probíhá v měně zobrazené v pokladně.</p><p>Cena se účtuje předem na příslušné období, jeden měsíc nebo jeden rok, a na začátku každého období je automaticky stržena prostřednictvím platební metody zvolené v pokladně. K dispozici jsou platební metody nabízené v pokladně.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Doba trvání a výpověď",
      html: `<h3>6.1. Měsíční předplatné</h3><p>Měsíční předplatné trvá jeden měsíc. Automaticky se prodlužuje vždy o další měsíc, pokud není vypovězeno. Můžete jej kdykoli vypovědět s účinností ke konci probíhajícího smluvního měsíce.</p><h3>6.2. Roční předplatné</h3><p>Počáteční doba trvání je jeden rok. Předplatné můžete kdykoli vypovědět s účinností ke konci tohoto roku. Pokud není vypovězeno, pokračuje po prvním roce na dobu neurčitou a lze jej poté kdykoli vypovědět s měsíční výpovědní lhůtou. Vyúčtování probíhá i nadále ročně předem. Již zaplacenou částku za období po skončení smlouvy poměrně vrátíme.</p><h3>6.3. Způsoby výpovědi</h3><p>Výpověď můžete podat v zákaznickém portálu v sekci <b>Účet</b> na <a href="/app/">liczmat.com/app/</a>, prostřednictvím tlačítka <a href="/cs/vypovedet-smlouvu/">„Vypovědět smlouvy zde“</a>, e-mailem na adresu <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> nebo dopisem na adresu ${ENTITY.name}, ${ENTITY.address}. Právo na mimořádné ukončení smlouvy ze závažného důvodu zůstává nedotčeno.</p><h3>6.4. Důsledky skončení smlouvy</h3><p>Po skončení smlouvy se účet vrátí k bezplatnému tarifu. Vaše údaje zůstávají uloženy v účtu. Funkce Pro již nejsou k dispozici, dokud si LiczMat Pro znovu neobjednáte. Informace o smazání účtu naleznete v <a href="/cs/ochrana-osobnich-udaju/">zásadách ochrany osobních údajů</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Poučení o odstoupení od smlouvy",
      html: `<p>Následující zákonné právo na odstoupení od smlouvy platí pouze pro spotřebitele.</p><h3>Právo odstoupit od smlouvy</h3><p>Máte právo odstoupit od této smlouvy bez udání důvodu ve lhůtě 14 dnů.</p><p>Lhůta pro odstoupení od smlouvy uplyne po 14 dnech ode dne uzavření smlouvy.</p><p>Pro účely uplatnění práva na odstoupení od smlouvy musíte o svém rozhodnutí odstoupit od této smlouvy informovat nás, <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, formou jednoznačného prohlášení (například dopisem zaslaným prostřednictvím provozovatele poštovních služeb nebo e-mailem).</p><p>Můžete použít níže uvedený vzorový formulář pro odstoupení od smlouvy nebo funkci odstoupení od smlouvy na stránce <a href="/cs/odstoupit-od-smlouvy/">„Odstoupit od smlouvy zde“</a>, není to však Vaší povinností. Pokud využijete tuto online funkci, zašleme Vám bez zbytečného odkladu potvrzení o přijetí tohoto oznámení o odstoupení od smlouvy na trvalém nosiči dat (například e-mailem), včetně informací o obsahu oznámení o odstoupení a datu a času jeho přijetí.</p><p>Aby byla dodržena lhůta pro odstoupení od této smlouvy, postačuje odeslat sdělení o uplatnění práva odstoupit od smlouvy před uplynutím lhůty pro odstoupení od smlouvy.</p><h3>Důsledky odstoupení od smlouvy</h3><p>Pokud odstoupíte od této smlouvy, vrátíme Vám bez zbytečného odkladu a v každém případě nejpozději do 14 dnů ode dne, kdy jsme byli informováni o Vašem rozhodnutí odstoupit od této smlouvy, všechny platby, které jsme od Vás obdrželi.</p><p>Pro tuto refundaci použijeme stejný platební prostředek, který jste použil(a) pro provedení počáteční transakce, pokud jste výslovně nesjednal(a) jinak. V žádném případě Vám tímto nevzniknou další náklady.</p><p>Za období do odstoupení od smlouvy nepožadujeme žádnou náhradu nákladů.</p>`
    },
    {
      id: "formular",
      h: "8. Vzorový formulář pro odstoupení od smlouvy",
      html: `<p>Tento formulář vyplňte a zašlete zpět pouze v případě, že si přejete odstoupit od smlouvy.</p><ul><li>Adresát: <b>${ENTITY.name}</b>, ${ENTITY.address}, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Oznamuji/oznamujeme (*), že tímto odstupuji/odstupujeme (*) od smlouvy o poskytnutí následující služby: <b>LiczMat Pro (předplatné)</b>.</li><li>Objednáno dne (*)</li><li>Jméno a příjmení spotřebitele / spotřebitelů</li><li>Adresa spotřebitele / spotřebitelů</li><li>Podpis spotřebitele / spotřebitelů (pouze pokud je tento formulář zasílán v listinné podobě)</li><li>Datum</li></ul><p>(*) Nehodící se škrtněte.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Dodatečné vrácení peněz do 14 dnů",
      html: `<p>Kromě zákonného práva na odstoupení od smlouvy vrátíme každému zákazníkovi, včetně podnikatele, celou zaplacenou částku, pokud zákazník odstoupí od smlouvy nebo ji vypoví do 14 dnů od prvního nákupu předplatného LiczMat Pro. Toto pravidlo platí pouze pro první nákup na daném účtu a nevztahuje se na prodloužení.</p>`
    },
    {
      id: "pflichten",
      h: "10. Povinnosti zákazníka",
      html: `<ul><li>Uvádíte správné a úplné údaje a udržujete je aktuální.</li><li>Uchováváte své heslo v tajnosti a chráníte přístup ke svému účtu.</li><li>Do cenových nabídek ani sdílených odkazů nevkládáte žádný protiprávní obsah. Kdokoli, kdo zná sdílený odkaz na cenovou nabídku nebo projekt, může vidět jeho obsah.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Změny služby",
      html: `<p>Službu smíme změnit pouze z platného důvodu, například z důvodu nových zákonných požadavků, bezpečnostních požadavků nebo technického rozvoje. Změna pro Vás nezpůsobí žádné dodatečné náklady. Budeme Vás informovat jasně a v dostatečném předstihu.</p><p>Pokud změna zhorší přístup nebo využívání služby spotřebitelem více než jen nepatrně, může spotřebitel smlouvu bezplatně ukončit do 30 dnů od obdržení informace nebo od provedení změny, podle toho, který okamžik nastane později (§ 327r německého BGB).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Zákonná práva z vadného plnění",
      html: `<p>Platí zákonná práva z vadného plnění. Pro spotřebitele platí zejména §§ 327 a následující německého BGB.</p>`
    },
    {
      id: "haftung",
      h: "13. Odpovědnost",
      html: `<p>Odpovídáme bez omezení za úmysl a hrubou nedbalost, za újmu na životě, těle nebo zdraví a podle německého zákona o odpovědnosti za vadu výrobku (Produkthaftungsgesetz).</p><p>V případě lehké nedbalosti odpovídáme pouze za porušení podstatné smluvní povinnosti. Podstatné smluvní povinnosti, nazývané též kardinální povinnosti, jsou povinnosti, jejichž splnění řádné provedení smlouvy vůbec umožňuje a na jejichž dodržování může zákazník pravidelně spoléhat. V tomto případě je odpovědnost omezena na škodu typickou pro danou smlouvu a předvídatelnou. V ostatních případech je odpovědnost za lehkou nedbalost vyloučena.</p><p>Zákonná odpovědnost podle §§ 327 a následujících německého BGB zůstává nedotčena.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Změny cen",
      html: `<p>Cena běžícího předplatného se mění pouze s Vaším výslovným souhlasem. Budeme Vás informovat nejméně 30 dní předem. Bez Vašeho souhlasu pokračuje předplatné za dosavadní cenu. Každá ze stran jej může ukončit ke konci již zaplaceného období.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Změny těchto obchodních podmínek",
      html: `<p>Změny těchto obchodních podmínek platí pro běžící smlouvu pouze s Vaším výslovným souhlasem. Budeme Vás informovat nejméně 30 dní předem. Bez Vašeho souhlasu platí i nadále dosavadní podmínky. Každá ze stran může předplatné ukončit ke konci již zaplaceného období.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Ochrana osobních údajů",
      html: `<p>Informace o zpracování osobních údajů naleznete v <a href="/cs/ochrana-osobnich-udaju/">zásadách ochrany osobních údajů</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Řešení spotřebitelských sporů",
      html: `<p>Nejsme ochotni ani povinni účastnit se řízení o řešení sporů před spotřebitelskou rozhodčí komisí (§ 36 německého VSBG).</p>`
    },
    {
      id: "schluss",
      h: "18. Závěrečná ustanovení",
      html: `<p>Platí německé právo s vyloučením Úmluvy OSN o smlouvách o mezinárodní koupi zboží. U spotřebitelů tato volba práva nezbavuje ochrany poskytované kogentními ustanoveními státu jejich obvyklého pobytu.</p><p>Pro obchodníky, právnické osoby veřejného práva a zvláštní fondy veřejného práva je příslušným soudem soud v sídle poskytovatele.</p><p>Pokud je nebo se stane kterékoli ustanovení této smlouvy neplatným, zůstávají zbývající ustanovení v platnosti.</p><p>Závazná je německá verze. Překlady slouží pouze pro informaci.</p>`
    }
  ]
};
