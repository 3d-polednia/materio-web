/* LiczMat website — the SEO copy of every calculator page.
 *
 * Master plan, session 31 (SEO KALKULATORÓW): "Każdy kalkulator powinien być możliwie
 * dobrym landing page'em dla konkretnego zapytania użytkownika."
 *
 * Until this session all 150 calculator pages shared one <title> shape and one meta
 * description shape: `calc_meta_pattern` with the calculator's name and its one-line
 * description substituted in. That is a page describing itself in the site's words; a
 * landing page has to answer the sentence somebody typed into a search box — "ile farby
 * na m²", "wie viele Rollen Tapete", "cât adeziv la m²" — and the words of that sentence
 * were nowhere in the title, nowhere in the H1 and nowhere in the first paragraph.
 *
 * So the copy is per calculator and per language, written once, here:
 *
 *   title  the <title> stem and the H1. The build appends " | LiczMat", and Google cuts a
 *          title at roughly 60 characters, so this may not run past TITLE_MAX (50).
 *   desc   the meta description AND the paragraph under the H1 — one sentence pair, one
 *          copy. A snippet that promises something the page does not open with is the
 *          same defect from two directions.
 *   faq    two questions, each the way a person actually asks it, with an answer that is
 *          true of THIS calculator. `scripts/build.mjs` publishes them as FAQPage
 *          structured data, so an entry that is not on the page must not be in it — the
 *          same rule the home page's FAQ has followed since session 6.
 *
 * It lives in src/ rather than in a dictionary because none of it is ever needed in the
 * browser: the build writes it into the markup, and `assets/i18n.<lang>.js` is downloaded
 * by every page on the site. 90 keys per language of copy that only a crawler and a
 * reader of the finished HTML will ever see is 13 kB on every page load for nothing.
 *
 * Numbers here have to be traceable, exactly as on the rest of the site: every figure in
 * an answer below is one already carried by `note_<id>` in assets/i18n-pages.js or by a
 * field of the calculator itself. No claim about a product, a brand or a price.
 */

/** The longest a title stem may be. " | LiczMat" is 10 more, and Google cuts at ~60. */
export const TITLE_MAX = 50;

export const CALC_SEO = {
  coverage: {
    pl: {
      title: "Kalkulator farby — ile puszek na m²",
      desc: "Powierzchnia, wydajność z etykiety i liczba warstw dają liczbę całych opakowań farby, tynku albo gruntu oraz procent odpadu.",
      faq: [
        ["Ile farby potrzeba na 1 m²?",
         "Tyle, ile mówi wydajność z etykiety, podawana jako m² z litra albo z opakowania. Kalkulator dzieli powierzchnię przez tę wydajność i mnoży przez liczbę warstw, a wynik zaokrągla w górę do całych opakowań."],
        ["Czy odejmować okna i drzwi od powierzchni?",
         "Odejmij je tylko wtedy, gdy ich nie malujesz. Pole otworów wpisuje się osobno i kalkulator odejmuje je od powierzchni, zanim przeliczy ją na opakowania."],
      ],
    },
    uk: {
      title: "Калькулятор фарби: скільки на м²",
      desc: "Площа, витрата з етикетки та кількість шарів дають число цілих упаковок фарби, штукатурки чи ґрунту і відсоток залишку.",
      faq: [
        ["Скільки фарби потрібно на 1 м²?",
         "Стільки, скільки вказує витрата на етикетці, у м² з літра або з упаковки. Калькулятор ділить площу на цю витрату, множить на кількість шарів і округлює вгору до цілих упаковок."],
        ["Чи віднімати вікна та двері?",
         "Віднімайте лише тоді, коли ви їх не фарбуєте. Площу отворів вводять окремо, і калькулятор віднімає її від площі перед перерахунком на упаковки."],
      ],
    },
    de: {
      title: "Farbrechner: wie viele Gebinde je m²",
      desc: "Fläche, Ergiebigkeit vom Etikett und Anzahl der Schichten ergeben ganze Gebinde Farbe, Putz oder Grundierung und den Verschnitt in Prozent.",
      faq: [
        ["Wie viel Farbe braucht man für 1 m²?",
         "So viel, wie die Ergiebigkeit auf dem Etikett angibt, meist in m² je Liter oder je Gebinde. Der Rechner teilt die Fläche durch diese Ergiebigkeit, multipliziert mit den Schichten und rundet auf ganze Gebinde auf."],
        ["Zieht man Fenster und Türen ab?",
         "Nur wenn sie nicht gestrichen werden. Die Öffnungsfläche wird getrennt eingetragen und vor der Umrechnung in Gebinde von der Fläche abgezogen."],
      ],
    },
    en: {
      title: "Paint calculator: how many tins per m²",
      desc: "Area, the coverage from the label and the number of coats give whole packs of paint, plaster or primer, plus the waste in percent.",
      faq: [
        ["How much paint do you need per m²?",
         "As much as the coverage on the label says, usually given in m² per litre or per pack. The calculator divides the area by that coverage, multiplies by the number of coats and rounds up to whole packs."],
        ["Should you subtract windows and doors?",
         "Only if you are genuinely not painting them. The opening area is entered separately and is taken off the surface before it is turned into packs."],
      ],
    },
    cs: {
      title: "Kalkulačka barvy: kolik balení na m²",
      desc: "Plocha, vydatnost z etikety a počet vrstev dají počet celých balení barvy, omítky nebo penetrace a prořez v procentech.",
      faq: [
        ["Kolik barvy je potřeba na 1 m²?",
         "Tolik, kolik říká vydatnost na etiketě, obvykle v m² z litru nebo z balení. Kalkulačka vydělí plochu touto vydatností, vynásobí počtem vrstev a zaokrouhlí nahoru na celá balení."],
        ["Mají se odečítat okna a dveře?",
         "Jen tehdy, když je nemalujete. Plocha otvorů se zadává zvlášť a odečte se od plochy dřív, než se přepočítá na balení."],
      ],
    },
    sk: {
      title: "Kalkulačka farby: koľko balení na m²",
      desc: "Plocha, výdatnosť z etikety a počet vrstiev dajú počet celých balení farby, omietky alebo penetrácie a prerez v percentách.",
      faq: [
        ["Koľko farby treba na 1 m²?",
         "Toľko, koľko hovorí výdatnosť na etikete, zvyčajne v m² z litra alebo z balenia. Kalkulačka vydelí plochu touto výdatnosťou, vynásobí počtom vrstiev a zaokrúhli nahor na celé balenia."],
        ["Majú sa odpočítať okná a dvere?",
         "Len vtedy, keď ich nemaľujete. Plocha otvorov sa zadáva zvlášť a odpočíta sa od plochy skôr, než sa prepočíta na balenia."],
      ],
    },
    ro: {
      title: "Calculator vopsea: câte ambalaje pe m²",
      desc: "Suprafața, randamentul de pe etichetă și numărul de straturi dau ambalaje întregi de vopsea, tencuială sau amorsă și pierderea în procente.",
      faq: [
        ["Câtă vopsea trebuie pe 1 m²?",
         "Atât cât spune randamentul de pe etichetă, dat de obicei în m² pe litru sau pe ambalaj. Calculatorul împarte suprafața la acest randament, înmulțește cu numărul de straturi și rotunjește în sus la ambalaje întregi."],
        ["Se scad ferestrele și ușile?",
         "Doar dacă într-adevăr nu le vopsești. Suprafața golurilor se introduce separat și se scade din suprafață înainte de transformarea în ambalaje."],
      ],
    },
    hr: {
      title: "Kalkulator boje: koliko pakiranja po m²",
      desc: "Površina, izdašnost s etikete i broj slojeva daju cijela pakiranja boje, žbuke ili prajmera te otpad u postocima.",
      faq: [
        ["Koliko boje treba po 1 m²?",
         "Onoliko koliko kaže izdašnost na etiketi, obično u m² po litri ili po pakiranju. Kalkulator dijeli površinu tom izdašnošću, množi brojem slojeva i zaokružuje naviše na cijela pakiranja."],
        ["Oduzimaju li se prozori i vrata?",
         "Samo ako ih doista ne bojite. Površina otvora upisuje se posebno i oduzima se od površine prije preračuna u pakiranja."],
      ],
    },
    sr: {
      title: "Kalkulator boje: koliko pakovanja na m²",
      desc: "Površina, izdašnost sa etikete i broj slojeva daju cela pakovanja boje, maltera ili prajmera i otpad u procentima.",
      faq: [
        ["Koliko boje treba na 1 m²?",
         "Onoliko koliko piše u izdašnosti na etiketi, najčešće u m² po litru ili po pakovanju. Kalkulator deli površinu tom izdašnošću, množi brojem slojeva i zaokružuje naviše na cela pakovanja."],
        ["Da li se oduzimaju prozori i vrata?",
         "Samo ako ih ne bojite. Površina otvora unosi se posebno i oduzima se od površine pre preračuna u pakovanja."],
      ],
    },
    ru: {
      title: "Калькулятор краски: сколько на м²",
      desc: "Площадь, расход с этикетки и число слоёв дают количество целых упаковок краски, штукатурки или грунта и остаток в процентах.",
      faq: [
        ["Сколько краски нужно на 1 м²?",
         "Столько, сколько указано в расходе на этикетке, обычно в м² с литра или с упаковки. Калькулятор делит площадь на этот расход, умножает на число слоёв и округляет вверх до целых упаковок."],
        ["Вычитать ли окна и двери?",
         "Вычитайте только тогда, когда вы их не красите. Площадь проёмов вводится отдельно и вычитается из площади до пересчёта в упаковки."],
      ],
    },
  },
  waste: {
    pl: {
      title: "Kalkulator płytek i paneli — ile kartonów",
      desc: "Powierzchnia plus zapas na docinkę przeliczone na całe kartony płytek, paneli albo gresu, z metrami, które faktycznie kupujesz.",
      faq: [
        ["Ile płytek trzeba na 10 m²?",
         "Do pola dolicz zapas na docinkę i podziel wynik przez metraż z kartonu. Kalkulator zaokrągla w górę do całego kartonu i pokazuje, ile metrów wyjdzie z zakupu."],
        ["Ile zapasu doliczyć do płytek?",
         "Przy prostym układzie 5–7%, przy dużym formacie, skosie albo cegiełce 10–15%. Kalkulator dolicza ten procent do powierzchni, zanim przeliczy ją na kartony."],
      ],
    },
    uk: {
      title: "Калькулятор плитки: скільки коробок",
      desc: "Площа плюс запас на підрізку, переведені в цілі коробки плитки, панелей чи керамограніту, з метрами, які ви купуєте.",
      faq: [
        ["Скільки плитки треба на 10 м²?",
         "До площі додайте запас на підрізку і поділіть на метраж з коробки. Калькулятор округлює вгору до цілої коробки й показує, скільки метрів вийде з покупки."],
        ["Скільки запасу додавати?",
         "Запас 5–7% вистачає для простого розкладання. Великий формат, укладання по діагоналі чи «цеглинкою» потребують 10–15%. Беріть з однієї партії, бо наступна може мати інший відтінок."],
      ],
    },
    de: {
      title: "Fliesenrechner: wie viele Kartons",
      desc: "Fläche plus Verschnitt, umgerechnet in ganze Kartons Fliesen, Paneele oder Feinsteinzeug, samt den Quadratmetern, die du tatsächlich kaufst.",
      faq: [
        ["Wie viele Fliesen braucht man für 10 m²?",
         "Zur Fläche kommt der Verschnitt, das Ergebnis wird durch die Quadratmeter je Karton geteilt. Der Rechner rundet auf ganze Kartons auf und zeigt, wie viele m² der Kauf ergibt."],
        ["Wie viel Verschnitt sollte man einrechnen?",
         "5–7% reichen bei geradem Verlegemuster. Großformat, diagonale Verlegung oder Verband brauchen 10–15%. Kaufe aus einer Charge, die nächste kann einen anderen Farbton haben."],
      ],
    },
    en: {
      title: "Tile calculator: how many boxes",
      desc: "Area plus a waste allowance turned into whole boxes of tiles, panels or porcelain, with the square metres the purchase gives you.",
      faq: [
        ["How many tiles do you need for 10 m²?",
         "Add the waste allowance to the area and divide by the coverage of one box. The calculator rounds up to a whole box and shows how many square metres the purchase comes to."],
        ["How much waste should you allow for tiles?",
         "5–7% for a straight layout, 10–15% for large format, diagonal or brick-bond. The calculator adds that percentage to the area before turning it into boxes."],
      ],
    },
    cs: {
      title: "Kalkulačka obkladů: kolik balení",
      desc: "Plocha plus prořez přepočtené na celá balení obkladů, panelů nebo dlažby, včetně metrů, které nákupem dostanete.",
      faq: [
        ["Kolik obkladů je potřeba na 10 m²?",
         "K ploše přičtěte prořez a vydělte metráží jednoho balení. Kalkulačka zaokrouhlí nahoru na celé balení a ukáže, kolik metrů nákup vydá."],
        ["Kolik prořezu počítat?",
         "5–7% stačí u rovné pokládky. Velký formát, diagonála nebo vazba na půl potřebují 10–15%. Kupujte z jedné výrobní šarže, další může mít jiný odstín."],
      ],
    },
    sk: {
      title: "Kalkulačka obkladov: koľko balení",
      desc: "Plocha plus prerez prepočítané na celé balenia obkladov, panelov alebo dlažby, aj s metrami, ktoré nákupom dostanete.",
      faq: [
        ["Koľko obkladov treba na 10 m²?",
         "K ploche pripočítajte prerez a vydeľte metrážou jedného balenia. Kalkulačka zaokrúhli nahor na celé balenie a ukáže, koľko metrov nákup vydá."],
        ["Koľko prerezu počítať?",
         "5–7% stačí pri rovnej pokládke. Veľký formát, diagonála alebo väzba na pol potrebujú 10–15%. Kupujte z jednej výrobnej šarže, ďalšia môže mať iný odtieň."],
      ],
    },
    ro: {
      title: "Calculator gresie și faianță: câte cutii",
      desc: "Suprafața plus pierderea la tăiere, transformate în cutii întregi de faianță, panouri sau gresie, cu metrii pe care îi cumperi efectiv.",
      faq: [
        ["Câtă gresie trebuie pentru 10 m²?",
         "Adaugă pierderea la suprafață și împarte la metrii dintr-o cutie. Calculatorul rotunjește în sus la cutie întreagă și arată câți metri iese cumpărătura."],
        ["Cât adaos trebuie calculat?",
         "5–7% la montaj drept, 10–15% la format mare, diagonală sau șah. Calculatorul adaugă procentul la suprafață înainte de a o transforma în cutii."],
      ],
    },
    hr: {
      title: "Kalkulator pločica: koliko kutija",
      desc: "Površina plus otpad pri rezanju, preračunati u cijele kutije pločica, panela ili gresa, s kvadratima koje kupnjom stvarno dobivate.",
      faq: [
        ["Koliko pločica treba za 10 m²?",
         "Površini dodajte otpad i podijelite s kvadraturom jedne kutije. Kalkulator zaokružuje naviše na cijelu kutiju i pokazuje koliko kvadrata daje kupnja."],
        ["Koliko otpada treba računati?",
         "5–7% dovoljno je za ravno polaganje. Veliki format, dijagonala ili polaganje u opeku traže 10–15%. Kupujte iz iste proizvodne serije jer sljedeća zna imati drugi ton."],
      ],
    },
    sr: {
      title: "Kalkulator pločica: koliko kutija",
      desc: "Površina plus otpad pri sečenju, preračunati u cele kutije pločica, panela ili gresa, sa kvadratima koje kupovinom dobijate.",
      faq: [
        ["Koliko pločica treba za 10 m²?",
         "Površini dodajte otpad i podelite kvadraturom jedne kutije. Kalkulator zaokružuje naviše na celu kutiju i pokazuje koliko kvadrata daje kupovina."],
        ["Koliko otpada treba računati?",
         "5–7% je dovoljno za ravno polaganje. Veliki format, dijagonala ili polaganje u cigli traže 10–15%. Kupujte iz iste proizvodne serije jer sledeća ume da ima drugi ton."],
      ],
    },
    ru: {
      title: "Калькулятор плитки: сколько коробок",
      desc: "Площадь плюс запас на подрезку, переведённые в целые коробки плитки, панелей или керамогранита, с метрами, которые вы реально покупаете.",
      faq: [
        ["Сколько плитки нужно на 10 м²?",
         "К площади добавьте запас на подрезку и разделите на метраж коробки. Калькулятор округляет вверх до целой коробки и показывает, сколько метров даёт покупка."],
        ["Сколько запаса закладывать?",
         "Запас 5–7% хватает при прямой раскладке. Крупный формат, укладка по диагонали или вразбежку требуют 10–15%. Берите из одной партии, следующая может отличаться оттенком."],
      ],
    },
  },
  wallpaper: {
    pl: {
      title: "Kalkulator tapety — ile rolek na pokój",
      desc: "Szerokość i wysokość ściany, wymiary rolki i raport wzoru dają liczbę rolek oraz liczbę pasów, które wychodzą z jednej rolki.",
      faq: [
        ["Ile rolek tapety na pokój?",
         "Podziel szerokość ściany przez szerokość rolki, żeby poznać liczbę pasów, a długość rolki przez wysokość pasa, żeby wiedzieć, ile pasów wychodzi z rolki. Kalkulator robi obie te rzeczy i zaokrągla w górę."],
        ["Jak raport wzoru zmienia liczbę rolek?",
         "Każdy pas rośnie do pełnej wielokrotności raportu, więc z jednej roli wychodzi mniej pasów. Raport wpisujesz w centymetrach z etykiety, a 0 to tapeta bez dopasowania."],
      ],
    },
    uk: {
      title: "Калькулятор шпалер: скільки рулонів",
      desc: "Ширина й висота стіни, розміри рулона та рапорт малюнка дають кількість рулонів і кількість смуг, що виходять з одного рулона.",
      faq: [
        ["Скільки рулонів шпалер на кімнату?",
         "Поділіть ширину стіни на ширину рулона, щоб отримати кількість смуг, і довжину рулона на висоту смуги, щоб знати, скільки смуг дає рулон. Калькулятор робить обидва кроки й округлює вгору."],
        ["Як рапорт малюнка змінює кількість рулонів?",
         "Зі шпалерами з рапортом кожна смуга подовжується до повної кратності рапорту, тож з рулона виходить менше смуг. Рапорт 0 означає шпалери без підбору малюнка."],
      ],
    },
    de: {
      title: "Tapetenrechner: wie viele Rollen",
      desc: "Wandbreite und -höhe, die Maße der Rolle und der Rapport ergeben die Anzahl der Rollen und wie viele Bahnen eine Rolle hergibt.",
      faq: [
        ["Wie viele Rollen Tapete braucht ein Zimmer?",
         "Die Wandbreite geteilt durch die Rollenbreite ergibt die Bahnen, die Rollenlänge geteilt durch die Bahnhöhe ergibt die Bahnen je Rolle. Der Rechner macht beides und rundet auf."],
        ["Wie verändert der Rapport die Rollenzahl?",
         "Bei Tapete mit Rapport wird jede Bahn auf ein volles Vielfaches des Rapports verlängert, eine Rolle gibt also weniger Bahnen her. Rapport 0 heißt: kein Musteransatz."],
      ],
    },
    en: {
      title: "Wallpaper calculator: how many rolls",
      desc: "Wall width and height, the size of the roll and the pattern repeat give the number of rolls and how many drops one roll yields.",
      faq: [
        ["How many rolls of wallpaper for a room?",
         "Wall width divided by roll width gives the number of drops; roll length divided by drop height gives the drops per roll. The calculator does both and rounds up."],
        ["How does the pattern repeat change the count?",
         "With a patterned paper every drop is stretched to a whole multiple of the repeat, so one roll yields fewer drops. A repeat of 0 means there is no pattern to match."],
      ],
    },
    cs: {
      title: "Kalkulačka tapet: kolik rolí",
      desc: "Šířka a výška stěny, rozměry role a raport vzoru dají počet rolí i počet pruhů, které z jedné role vyjdou.",
      faq: [
        ["Kolik rolí tapety na pokoj?",
         "Šířka stěny dělená šířkou role dá počet pruhů, délka role dělená výškou pruhu dá pruhy z jedné role. Kalkulačka udělá obojí a zaokrouhlí nahoru."],
        ["Jak raport vzoru mění počet rolí?",
         "U tapety s raportem se každý pruh prodlouží na celý násobek raportu, takže z role vyjde méně pruhů. Raport 0 znamená tapetu bez navazování vzoru."],
      ],
    },
    sk: {
      title: "Kalkulačka tapiet: koľko roliek",
      desc: "Šírka a výška steny, rozmery rolky a raport vzoru dajú počet roliek aj počet pruhov, ktoré z jednej rolky vyjdú.",
      faq: [
        ["Koľko roliek tapety na izbu?",
         "Šírka steny delená šírkou rolky dá počet pruhov, dĺžka rolky delená výškou pruhu dá pruhy z jednej rolky. Kalkulačka urobí oboje a zaokrúhli nahor."],
        ["Ako raport vzoru mení počet roliek?",
         "Pri tapete s raportom sa každý pruh predĺži na celý násobok raportu, takže z rolky vyjde menej pruhov. Raport 0 znamená tapetu bez nadväzovania vzoru."],
      ],
    },
    ro: {
      title: "Calculator tapet: câte role",
      desc: "Lățimea și înălțimea peretelui, dimensiunile rolei și raportul modelului dau numărul de role și câte fâșii iese dintr-o rolă.",
      faq: [
        ["Câte role de tapet pentru o cameră?",
         "Lățimea peretelui împărțită la lățimea rolei dă numărul de fâșii, iar lungimea rolei împărțită la înălțimea fâșiei dă fâșiile dintr-o rolă. Calculatorul face ambele și rotunjește în sus."],
        ["Cum schimbă raportul modelului numărul de role?",
         "La tapetul cu raport fiecare fâșie se lungește până la un multiplu întreg al raportului, deci o rolă dă mai puține fâșii. Raportul 0 înseamnă tapet fără potrivire de model."],
      ],
    },
    hr: {
      title: "Kalkulator tapeta: koliko rola",
      desc: "Širina i visina zida, dimenzije role i raport uzorka daju broj rola i broj traka koje izlaze iz jedne role.",
      faq: [
        ["Koliko rola tapeta za sobu?",
         "Širina zida podijeljena širinom role daje broj traka, a duljina role podijeljena visinom trake daje trake iz jedne role. Kalkulator radi oboje i zaokružuje naviše."],
        ["Kako raport uzorka mijenja broj rola?",
         "Kod tapete s raportom svaka se traka produljuje na puni višekratnik raporta, pa iz role izlazi manje traka. Raport 0 znači tapetu bez usklađivanja uzorka."],
      ],
    },
    sr: {
      title: "Kalkulator tapeta: koliko rolni",
      desc: "Širina i visina zida, dimenzije rolne i raport šare daju broj rolni i broj traka koje izlaze iz jedne rolne.",
      faq: [
        ["Koliko rolni tapeta za sobu?",
         "Širina zida podeljena širinom rolne daje broj traka, a dužina rolne podeljena visinom trake daje trake iz jedne rolne. Kalkulator radi oboje i zaokružuje naviše."],
        ["Kako raport šare menja broj rolni?",
         "Kod tapete sa raportom svaka traka se produžava na pun umnožak raporta, pa iz rolne izlazi manje traka. Raport 0 znači tapetu bez usklađivanja šare."],
      ],
    },
    ru: {
      title: "Калькулятор обоев: сколько рулонов",
      desc: "Ширина и высота стены, размеры рулона и раппорт рисунка дают количество рулонов и число полос, которые выходят из одного рулона.",
      faq: [
        ["Сколько рулонов обоев на комнату?",
         "Ширина стены, делённая на ширину рулона, даёт число полос, а длина рулона, делённая на высоту полосы, — число полос из рулона. Калькулятор считает и то и другое и округляет вверх."],
        ["Как раппорт рисунка меняет число рулонов?",
         "У обоев с раппортом каждая полоса удлиняется до полного кратного раппорта, поэтому из рулона выходит меньше полос. Раппорт 0 означает обои без подгонки рисунка."],
      ],
    },
  },
  linear: {
    pl: {
      title: "Kalkulator rozkroju 1D — ile sztang",
      desc: "Lista elementów, długość sztangi i rzaz piły dają liczbę sztang do kupienia oraz gotowy plan cięcia z procentem odpadu.",
      faq: [
        ["Ile sztang kupić na listę elementów?",
         "Kalkulator układa elementy od najdłuższego i wkłada każdy do pierwszej sztangi, w której się mieści. Liczba otwartych sztang to liczba, którą kupujesz, a plan pokazuje, co z której wyciąć."],
        ["Czy rzaz piły jest doliczany?",
         "Tak. Rzaz odejmuje się przy każdym kolejnym cięciu w sztandze, nie przy pierwszym, bo pierwszy element zaczyna się od czoła materiału."],
      ],
    },
    uk: {
      title: "Калькулятор розкрою 1D: скільки хлистів",
      desc: "Список елементів, довжина хлиста і ширина різу дають кількість хлистів до покупки та готовий план розпилу з відсотком відходу.",
      faq: [
        ["Скільки хлистів купити на список елементів?",
         "Калькулятор сортує елементи від найдовшого і кладе кожен у перший хлист, де він поміщається. Кількість відкритих хлистів — це те, що ви купуєте, а план показує, що з якого різати."],
        ["Чи враховується ширина різу?",
         "Так. Різ віднімається при кожному наступному розпилі в хлисті, але не при першому, бо перший елемент починається від торця матеріалу."],
      ],
    },
    de: {
      title: "1D-Zuschnittrechner: wie viele Stangen",
      desc: "Die Teileliste, die Stangenlänge und die Schnittfuge ergeben die Anzahl der Stangen und einen fertigen Schnittplan samt Verschnitt.",
      faq: [
        ["Wie viele Stangen braucht die Teileliste?",
         "Der Rechner sortiert die Teile nach Länge und legt jedes in die erste Stange, in die es passt. Die Zahl der geöffneten Stangen ist die Einkaufsmenge, der Plan zeigt, was wo herausgeschnitten wird."],
        ["Wird die Schnittfuge mitgerechnet?",
         "Ja. Die Fuge wird bei jedem weiteren Schnitt in der Stange abgezogen, nicht beim ersten, weil das erste Teil an der Stirnseite beginnt."],
      ],
    },
    en: {
      title: "1D cutting calculator: how many bars",
      desc: "A parts list, the stock length and the saw kerf give the number of bars to buy. The cutting plan comes with the waste in percent.",
      faq: [
        ["How many bars do you need for a parts list?",
         "The calculator sorts the parts longest first and puts each into the first bar it fits. The number of bars opened is what you buy, and the plan shows which part comes out of which bar."],
        ["Is the saw kerf included?",
         "Yes. The kerf is taken off at every cut after the first one in a bar. The first part starts at the end of the stock, so it costs none."],
      ],
    },
    cs: {
      title: "Kalkulačka nářezu 1D: kolik tyčí",
      desc: "Seznam dílů, délka tyče a šířka řezu dají počet tyčí k nákupu a hotový plán řezání i s prořezem v procentech.",
      faq: [
        ["Kolik tyčí je potřeba na seznam dílů?",
         "Kalkulačka seřadí díly od nejdelšího a každý vloží do první tyče, kam se vejde. Počet otevřených tyčí je nákup, plán ukazuje, co se z které tyče řeže."],
        ["Počítá se i šířka řezu?",
         "Ano. Řez se odečítá při každém dalším řezu v tyči, ne při prvním, protože první díl začíná na čele materiálu."],
      ],
    },
    sk: {
      title: "Kalkulačka rezu 1D: koľko tyčí",
      desc: "Zoznam dielov, dĺžka tyče a šírka rezu dajú počet tyčí na nákup a hotový plán rezania aj s prerezom v percentách.",
      faq: [
        ["Koľko tyčí treba na zoznam dielov?",
         "Kalkulačka zoradí diely od najdlhšieho a každý vloží do prvej tyče, kam sa zmestí. Počet otvorených tyčí je nákup, plán ukazuje, čo sa z ktorej tyče reže."],
        ["Počíta sa aj šírka rezu?",
         "Áno. Rez sa odpočítava pri každom ďalšom reze v tyči, nie pri prvom, lebo prvý diel začína na čele materiálu."],
      ],
    },
    ro: {
      title: "Calculator croire 1D: câte bare",
      desc: "Lista de piese, lungimea barei și grosimea tăieturii dau numărul de bare de cumpărat și un plan de tăiere cu pierderea în procente.",
      faq: [
        ["Câte bare trebuie pentru o listă de piese?",
         "Calculatorul așază piesele de la cea mai lungă și pune fiecare piesă în prima bară în care încape. Numărul de bare deschise este cumpărătura, iar planul arată ce se taie din fiecare."],
        ["Se ia în calcul grosimea tăieturii?",
         "Da. Tăietura se scade la fiecare tăiere următoare din bară, nu la prima, pentru că prima piesă începe de la capătul materialului."],
      ],
    },
    hr: {
      title: "Kalkulator rezanja 1D: koliko šipki",
      desc: "Popis elemenata, duljina šipke i širina reza daju broj šipki za kupnju i gotov plan rezanja s otpadom u postocima.",
      faq: [
        ["Koliko šipki treba za popis elemenata?",
         "Kalkulator slaže elemente od najduljeg i svaki stavlja u prvu šipku u koju stane. Broj otvorenih šipki je ono što kupujete, a plan pokazuje što se iz koje reže."],
        ["Uračunava li se širina reza?",
         "Da. Rez se oduzima kod svakog sljedećeg reza u šipki, ali ne kod prvoga, jer prvi element počinje na čelu materijala."],
      ],
    },
    sr: {
      title: "Kalkulator sečenja 1D: koliko šipki",
      desc: "Spisak elemenata, dužina šipke i širina reza daju broj šipki za kupovinu i gotov plan sečenja sa otpadom u procentima.",
      faq: [
        ["Koliko šipki treba za spisak elemenata?",
         "Kalkulator ređa elemente od najdužeg i svaki stavlja u prvu šipku u koju stane. Broj otvorenih šipki je ono što kupujete, a plan pokazuje šta se iz koje seče."],
        ["Da li se računa širina reza?",
         "Da. Rez se oduzima kod svakog sledećeg sečenja u šipki, ali ne kod prvog, jer prvi element počinje na čelu materijala."],
      ],
    },
    ru: {
      title: "Калькулятор раскроя 1D: сколько хлыстов",
      desc: "Список элементов, длина хлыста и ширина реза дают количество хлыстов к покупке и готовый план распила с процентом отхода.",
      faq: [
        ["Сколько хлыстов нужно на список элементов?",
         "Калькулятор сортирует элементы от самого длинного и кладёт каждый в первый хлыст, где он помещается. Число открытых хлыстов — это покупка, а план показывает, что из какого резать."],
        ["Учитывается ли ширина реза?",
         "Да. Рез вычитается при каждом следующем распиле в хлысте, но не при первом, потому что первый элемент начинается от торца материала."],
      ],
    },
  },
  sheet: {
    pl: {
      title: "Kalkulator rozkroju płyt — ile arkuszy",
      desc: "Formatki, wymiar płyty i rzaz piły dają liczbę arkuszy i plan rozkroju gilotynowego, z obrotem elementów albo bez niego.",
      faq: [
        ["Ile płyt wyjdzie na moje formatki?",
         "Kalkulator układa formatki od największej i wkłada każdą w wolny prostokąt o najmniejszej resztce. Gdy nic już nie mieści się na płycie, otwiera kolejną i to jest liczba arkuszy do kupienia."],
        ["Kiedy wyłączyć obrót elementów?",
         "Gdy płyta ma słój albo wzór kierunkowy. Obrócona formatka miałaby wtedy widoczny inny kierunek, mimo że wymiar by się zgadzał."],
      ],
    },
    uk: {
      title: "Калькулятор розкрою плит: скільки аркушів",
      desc: "Деталі, розмір плити й ширина різу дають кількість аркушів і план гільйотинного розкрою, з обертанням деталей або без нього.",
      faq: [
        ["Скільки плит вийде на мої деталі?",
         "Калькулятор бере деталі від найбільшої і кладе кожну у вільний прямокутник із найменшим залишком. Коли на плиті вже нічого не поміщається, відкривається наступна — це і є кількість аркушів."],
        ["Коли вимикати обертання деталей?",
         "Коли плита має текстуру або напрямний малюнок. Обернена деталь тоді має інший напрямок, хоч розмір і збігається."],
      ],
    },
    de: {
      title: "Plattenrechner: wie viele Platten",
      desc: "Zuschnitte, Plattenmaß und Schnittfuge ergeben die Anzahl der Platten und einen Plan für den Gitterschnitt, mit oder ohne Drehen der Teile.",
      faq: [
        ["Wie viele Platten ergeben meine Zuschnitte?",
         "Der Rechner legt die Teile vom größten an in das freie Rechteck mit dem kleinsten Rest. Passt nichts mehr auf die Platte, wird die nächste geöffnet, und das ist die Einkaufsmenge."],
        ["Wann sollte man das Drehen abschalten?",
         "Wenn die Platte eine Maserung oder ein gerichtetes Dekor hat. Ein gedrehtes Teil liefe dann sichtbar quer, obwohl das Maß stimmt."],
      ],
    },
    en: {
      title: "Sheet cutting calculator: how many sheets",
      desc: "Parts, the sheet size and the saw kerf give the number of sheets and a guillotine cutting plan, with or without rotating the parts.",
      faq: [
        ["How many sheets will my parts take?",
         "The calculator places the parts largest first into the free rectangle with the smallest leftover. When nothing fits any more, it opens another sheet, and that is what you buy."],
        ["When should you turn rotation off?",
         "When the board has a grain or a directional pattern. A rotated part would then run visibly the wrong way even though the size fits."],
      ],
    },
    cs: {
      title: "Kalkulačka nářezu desek: kolik desek",
      desc: "Formátky, rozměr desky a šířka řezu dají počet desek a plán gilotinového nářezu, s otáčením dílů nebo bez něj.",
      faq: [
        ["Kolik desek moje formátky zaberou?",
         "Kalkulačka klade formátky od největší do volného obdélníku s nejmenším zbytkem. Když se už nic nevejde, otevře další desku, a to je nákup."],
        ["Kdy otáčení dílů vypnout?",
         "Když má deska kresbu nebo směrový dekor. Otočený díl by pak viditelně běžel napříč, i když rozměr sedí."],
      ],
    },
    sk: {
      title: "Kalkulačka rezu dosiek: koľko dosiek",
      desc: "Formátky, rozmer dosky a šírka rezu dajú počet dosiek a plán gilotínového rezu, s otáčaním dielov alebo bez neho.",
      faq: [
        ["Koľko dosiek moje formátky zaberú?",
         "Kalkulačka kladie formátky od najväčšej do voľného obdĺžnika s najmenším zvyškom. Keď sa už nič nezmestí, otvorí ďalšiu dosku, a to je nákup."],
        ["Kedy otáčanie dielov vypnúť?",
         "Keď má doska kresbu alebo smerový dekor. Otočený diel by potom viditeľne bežal naprieč, aj keď rozmer sedí."],
      ],
    },
    ro: {
      title: "Calculator croire plăci: câte foi",
      desc: "Reperele, dimensiunea plăcii și grosimea tăieturii dau numărul de foi și un plan de croire cu ghilotina, cu sau fără rotirea pieselor.",
      faq: [
        ["Câte plăci ies din reperele mele?",
         "Calculatorul așază reperele de la cel mai mare în dreptunghiul liber cu restul cel mai mic. Când nu mai încape nimic, deschide o placă nouă, iar acesta este numărul de cumpărat."],
        ["Când se oprește rotirea pieselor?",
         "Când placa are fibră sau un model direcțional. O piesă rotită ar merge vizibil în alt sens, chiar dacă dimensiunea se potrivește."],
      ],
    },
    hr: {
      title: "Kalkulator rezanja ploča: koliko ploča",
      desc: "Elementi, dimenzija ploče i širina reza daju broj ploča i plan giljotinskog rezanja, sa zakretanjem elemenata ili bez njega.",
      faq: [
        ["Koliko ploča trebaju moji elementi?",
         "Kalkulator slaže elemente od najvećega u slobodni pravokutnik s najmanjim ostatkom. Kad više ništa ne stane, otvara novu ploču, i to je ono što kupujete."],
        ["Kada isključiti zakretanje elemenata?",
         "Kad ploča ima teksturu ili usmjereni dekor. Zakrenuti element tada vidljivo ide poprijeko, iako mjera odgovara."],
      ],
    },
    sr: {
      title: "Kalkulator sečenja ploča: koliko ploča",
      desc: "Elementi, dimenzija ploče i širina reza daju broj ploča i plan giljotinskog sečenja, sa okretanjem elemenata ili bez njega.",
      faq: [
        ["Koliko ploča traže moji elementi?",
         "Kalkulator slaže elemente od najvećeg u slobodni pravougaonik sa najmanjim ostatkom. Kada više ništa ne stane, otvara novu ploču, i to je ono što kupujete."],
        ["Kada isključiti okretanje elemenata?",
         "Kada ploča ima teksturu ili usmereni dekor. Okrenuti element tada vidljivo ide popreko, iako mera odgovara."],
      ],
    },
    ru: {
      title: "Калькулятор раскроя плит: сколько листов",
      desc: "Детали, размер плиты и ширина реза дают количество листов и план гильотинного раскроя, с поворотом деталей или без него.",
      faq: [
        ["Сколько плит уйдёт на мои детали?",
         "Калькулятор кладёт детали от самой большой в свободный прямоугольник с наименьшим остатком. Когда больше ничего не помещается, открывается новый лист, и это и есть покупка."],
        ["Когда отключать поворот деталей?",
         "Когда у плиты есть текстура или направленный рисунок. Повёрнутая деталь тогда заметно пойдёт поперёк, хотя размер и подходит."],
      ],
    },
  },
  concrete: {
    pl: {
      title: "Kalkulator betonu — ile worków na m³",
      desc: "Objętość i wydajność worka dają liczbę worków suchej mieszanki oraz przybliżoną ilość wody do zarobienia betonu.",
      faq: [
        ["Ile worków betonu na 1 m³?",
         "Metr sześcienny to 1000 litrów gotowej mieszanki. Podziel te litry przez wydajność jednego worka podaną na opakowaniu, a kalkulator zaokrągli wynik w górę do całych worków."],
        ["Ile litrów daje jeden worek?",
         "Przelicznik zakłada worek 25 kg dający około 12,5 l betonu. Sprawdź wydajność na swoim worku, bo różni się między producentami, i wpisz ją do formularza."],
      ],
    },
    uk: {
      title: "Калькулятор бетону: скільки мішків",
      desc: "Об'єм і вихід мішка дають кількість мішків сухої суміші та приблизну кількість води для замішування бетону.",
      faq: [
        ["Скільки мішків бетону на 1 м³?",
         "Кубометр — це 1000 літрів готової суміші. Поділіть ці літри на вихід одного мішка, вказаний на упаковці, а калькулятор округлить результат вгору до цілих мішків."],
        ["Скільки літрів дає один мішок?",
         "Розрахунок припускає мішок 25 кг, який дає близько 12,5 л бетону. Перевірте вихід на своєму мішку, бо він різний у виробників, і впишіть його у форму."],
      ],
    },
    de: {
      title: "Betonrechner: wie viele Säcke je m³",
      desc: "Volumen und Ergiebigkeit des Sacks ergeben die Anzahl Säcke Trockenbeton und die ungefähre Wassermenge zum Anmachen.",
      faq: [
        ["Wie viele Säcke Beton braucht 1 m³?",
         "Ein Kubikmeter sind 1000 Liter fertiger Beton. Diese Liter durch die Ergiebigkeit eines Sacks laut Aufdruck geteilt, und der Rechner rundet auf ganze Säcke auf."],
        ["Wie viele Liter ergibt ein Sack?",
         "Die Umrechnung geht von einem 25-kg-Sack mit etwa 12,5 l Beton aus. Prüfe die Ergiebigkeit auf deinem Sack, sie unterscheidet sich je Hersteller, und trage sie ein."],
      ],
    },
    en: {
      title: "Concrete calculator: how many bags per m³",
      desc: "Volume and the yield of one bag give the number of bags of dry mix and roughly how much water it takes to mix them.",
      faq: [
        ["How many bags of concrete make 1 m³?",
         "A cubic metre is 1000 litres of mixed concrete. Divide those litres by the yield printed on the bag; the calculator rounds the result up to whole bags."],
        ["How many litres does one bag give?",
         "The conversion assumes a 25 kg bag yielding about 12.5 l of concrete. Check the yield on your own bag, it differs between makers, and enter it in the form."],
      ],
    },
    cs: {
      title: "Kalkulačka betonu: kolik pytlů na m³",
      desc: "Objem a vydatnost pytle dají počet pytlů suché směsi a přibližné množství vody na zamíchání betonu.",
      faq: [
        ["Kolik pytlů betonu je na 1 m³?",
         "Krychlový metr je 1000 litrů hotové směsi. Tyto litry vydělte vydatností jednoho pytle z obalu a kalkulačka zaokrouhlí nahoru na celé pytle."],
        ["Kolik litrů vydá jeden pytel?",
         "Přepočet počítá s pytlem 25 kg, který dá asi 12,5 l betonu. Zkontrolujte vydatnost na svém pytli, u výrobců se liší, a zadejte ji do formuláře."],
      ],
    },
    sk: {
      title: "Kalkulačka betónu: koľko vriec na m³",
      desc: "Objem a výdatnosť vreca dajú počet vriec suchej zmesi a približné množstvo vody na zamiešanie betónu.",
      faq: [
        ["Koľko vriec betónu je na 1 m³?",
         "Kubický meter je 1000 litrov hotovej zmesi. Tieto litre vydeľte výdatnosťou jedného vreca z obalu a kalkulačka zaokrúhli nahor na celé vrecia."],
        ["Koľko litrov vydá jedno vrece?",
         "Prepočet počíta s vrecom 25 kg, ktoré dá asi 12,5 l betónu. Skontrolujte výdatnosť na svojom vreci, u výrobcov sa líši, a zadajte ju do formulára."],
      ],
    },
    ro: {
      title: "Calculator beton: câți saci pe m³",
      desc: "Volumul și randamentul sacului dau numărul de saci de amestec uscat și cantitatea aproximativă de apă pentru preparare.",
      faq: [
        ["Câți saci de beton intră într-un m³?",
         "Un metru cub înseamnă 1000 de litri de beton preparat. Împarte acești litri la randamentul unui sac scris pe ambalaj, iar calculatorul rotunjește în sus la saci întregi."],
        ["Câți litri dă un sac?",
         "Conversia pornește de la un sac de 25 kg care dă circa 12,5 l de beton. Verifică randamentul de pe sacul tău, diferă între producători, și introdu-l în formular."],
      ],
    },
    hr: {
      title: "Kalkulator betona: koliko vreća po m³",
      desc: "Volumen i izdašnost vreće daju broj vreća suhe mješavine i približnu količinu vode za miješanje betona.",
      faq: [
        ["Koliko vreća betona ide na 1 m³?",
         "Kubni metar je 1000 litara gotove mješavine. Te litre podijelite izdašnošću jedne vreće s ambalaže, a kalkulator zaokružuje naviše na cijele vreće."],
        ["Koliko litara daje jedna vreća?",
         "Preračun pretpostavlja vreću od 25 kg koja daje oko 12,5 l betona. Provjerite izdašnost na svojoj vreći jer se razlikuje među proizvođačima i upišite je u obrazac."],
      ],
    },
    sr: {
      title: "Kalkulator betona: koliko vreća po m³",
      desc: "Zapremina i izdašnost vreće daju broj vreća suve mešavine i približnu količinu vode za mešanje betona.",
      faq: [
        ["Koliko vreća betona ide na 1 m³?",
         "Kubni metar je 1000 litara gotove mešavine. Te litre podelite izdašnošću jedne vreće sa ambalaže, a kalkulator zaokružuje naviše na cele vreće."],
        ["Koliko litara daje jedna vreća?",
         "Preračun pretpostavlja vreću od 25 kg koja daje oko 12,5 l betona. Proverite izdašnost na svojoj vreći jer se razlikuje među proizvođačima i unesite je u obrazac."],
      ],
    },
    ru: {
      title: "Калькулятор бетона: сколько мешков",
      desc: "Объём и выход мешка дают количество мешков сухой смеси и примерное количество воды для замешивания бетона.",
      faq: [
        ["Сколько мешков бетона на 1 м³?",
         "Кубометр — это 1000 литров готовой смеси. Разделите эти литры на выход одного мешка с упаковки, а калькулятор округлит результат вверх до целых мешков."],
        ["Сколько литров даёт один мешок?",
         "Пересчёт исходит из мешка 25 кг, дающего около 12,5 л бетона. Проверьте выход на своём мешке — у производителей он разный — и впишите его в форму."],
      ],
    },
  },
  mortar: {
    pl: {
      title: "Kalkulator kleju do płytek — ile worków",
      desc: "Powierzchnia i zużycie w kg/m² z karty technicznej dają liczbę całych worków kleju albo zaprawy do kupienia.",
      faq: [
        ["Ile kleju na 1 m² płytek?",
         "Zużycie zależy od zębatki pacy i równości podłoża i jest podane w karcie technicznej kleju. Kalkulator mnoży je przez powierzchnię i dzieli przez wagę worka."],
        ["Dlaczego kleju schodzi więcej niż z karty?",
         "Wartość z karty technicznej dotyczy równego podłoża. Na krzywej ścianie zużycie potrafi wzrosnąć o połowę, więc przy nierównościach wpisz wyższą wartość."],
      ],
    },
    uk: {
      title: "Калькулятор клею для плитки: мішки",
      desc: "Площа й витрата в кг/м² з технічної карти дають кількість цілих мішків клею або розчину до покупки.",
      faq: [
        ["Скільки клею на 1 м² плитки?",
         "Витрата залежить від зубця шпателя та рівності основи і вказана в технічній карті клею. Калькулятор множить її на площу й ділить на вагу мішка."],
        ["Чому клею йде більше, ніж у карті?",
         "Значення з технічної карти стосується рівної основи. На кривій стіні витрата може зрости наполовину, тож при нерівностях впишіть більше значення."],
      ],
    },
    de: {
      title: "Fliesenkleber-Rechner: wie viele Säcke",
      desc: "Fläche und Verbrauch in kg/m² aus dem technischen Merkblatt ergeben die Anzahl ganzer Säcke Kleber oder Mörtel.",
      faq: [
        ["Wie viel Kleber braucht 1 m² Fliesen?",
         "Der Verbrauch hängt von der Zahnung der Kelle und vom Untergrund ab und steht im technischen Merkblatt. Der Rechner multipliziert ihn mit der Fläche und teilt durch das Sackgewicht."],
        ["Warum geht mehr Kleber weg als angegeben?",
         "Der Wert im Merkblatt gilt für einen ebenen Untergrund. Auf einer krummen Wand steigt der Verbrauch um bis zur Hälfte, trage dann einen höheren Wert ein."],
      ],
    },
    en: {
      title: "Tile adhesive calculator: how many bags",
      desc: "Area and the usage in kg/m² from the technical sheet give the number of whole bags of adhesive or mortar to buy.",
      faq: [
        ["How much adhesive does 1 m² of tiles take?",
         "Usage depends on the notch of the trowel and on how flat the surface is, and it is printed on the technical sheet. The calculator multiplies it by the area and divides by the bag weight."],
        ["Why does more adhesive go than the sheet says?",
         "The figure on the sheet assumes a flat surface. On an uneven wall usage can rise by half, so enter a higher value when the wall is out of true."],
      ],
    },
    cs: {
      title: "Kalkulačka lepidla na obklady: pytle",
      desc: "Plocha a spotřeba v kg/m² z technického listu dají počet celých pytlů lepidla nebo malty k nákupu.",
      faq: [
        ["Kolik lepidla je na 1 m² obkladu?",
         "Spotřeba závisí na ozubení hladítka a na rovinnosti podkladu a je uvedená v technickém listu. Kalkulačka ji vynásobí plochou a vydělí hmotností pytle."],
        ["Proč lepidla ubývá víc, než uvádí list?",
         "Hodnota z technického listu platí pro rovný podklad. Na křivé stěně může spotřeba vzrůst o polovinu, u nerovností proto zadejte vyšší hodnotu."],
      ],
    },
    sk: {
      title: "Kalkulačka lepidla na obklady: vrecia",
      desc: "Plocha a spotreba v kg/m² z technického listu dajú počet celých vriec lepidla alebo malty na nákup.",
      faq: [
        ["Koľko lepidla je na 1 m² obkladu?",
         "Spotreba závisí od ozubenia hladidla a od rovinnosti podkladu a je uvedená v technickom liste. Kalkulačka ju vynásobí plochou a vydelí hmotnosťou vreca."],
        ["Prečo lepidla ubúda viac, než uvádza list?",
         "Hodnota z technického listu platí pre rovný podklad. Na krivej stene môže spotreba vzrásť o polovicu, pri nerovnostiach preto zadajte vyššiu hodnotu."],
      ],
    },
    ro: {
      title: "Calculator adeziv gresie: câți saci",
      desc: "Suprafața și consumul în kg/m² din fișa tehnică dau numărul de saci întregi de adeziv sau mortar de cumpărat.",
      faq: [
        ["Cât adeziv intră la 1 m² de gresie?",
         "Consumul depinde de dinții gletierei și de planeitatea suportului și este scris în fișa tehnică. Calculatorul îl înmulțește cu suprafața și îl împarte la greutatea sacului."],
        ["De ce se duce mai mult adeziv decât scrie?",
         "Valoarea din fișă este pentru un suport plan. Pe un perete strâmb consumul poate crește cu jumătate, așa că introdu o valoare mai mare."],
      ],
    },
    hr: {
      title: "Kalkulator ljepila za pločice: vreće",
      desc: "Površina i potrošnja u kg/m² iz tehničkog lista daju broj cijelih vreća ljepila ili morta za kupnju.",
      faq: [
        ["Koliko ljepila ide na 1 m² pločica?",
         "Potrošnja ovisi o zubu gletarice i o ravnosti podloge, a piše u tehničkom listu. Kalkulator je množi površinom i dijeli težinom vreće."],
        ["Zašto ljepila ode više nego što piše?",
         "Vrijednost iz tehničkog lista vrijedi za ravnu podlogu. Na krivom zidu potrošnja zna narasti za polovicu, pa kod neravnina upišite veću vrijednost."],
      ],
    },
    sr: {
      title: "Kalkulator lepka za pločice: vreće",
      desc: "Površina i potrošnja u kg/m² iz tehničkog lista daju broj celih vreća lepka ili maltera za kupovinu.",
      faq: [
        ["Koliko lepka ide na 1 m² pločica?",
         "Potrošnja zavisi od zuba gletarice i od ravnosti podloge, a piše u tehničkom listu. Kalkulator je množi površinom i deli težinom vreće."],
        ["Zašto lepka ode više nego što piše?",
         "Vrednost iz tehničkog lista važi za ravnu podlogu. Na krivom zidu potrošnja ume da poraste za polovinu, pa kod neravnina unesite veću vrednost."],
      ],
    },
    ru: {
      title: "Калькулятор клея для плитки: мешки",
      desc: "Площадь и расход в кг/м² из технической карты дают количество целых мешков клея или раствора к покупке.",
      faq: [
        ["Сколько клея нужно на 1 м² плитки?",
         "Расход зависит от зуба шпателя и ровности основания и указан в технической карте клея. Калькулятор умножает его на площадь и делит на вес мешка."],
        ["Почему клея уходит больше, чем в карте?",
         "Значение из карты относится к ровному основанию. На кривой стене расход может вырасти наполовину, поэтому при неровностях впишите большее значение."],
      ],
    },
  },
  screed: {
    pl: {
      title: "Kalkulator wylewki — ile worków na m²",
      desc: "Powierzchnia, grubość warstwy i zużycie w kg na m² i mm dają liczbę worków wylewki, jastrychu albo tynku.",
      faq: [
        ["Ile worków wylewki na m²?",
         "Zużycie podaje się w kilogramach na metr kwadratowy i milimetr grubości. Kalkulator mnoży je przez powierzchnię i grubość, a sumę dzieli przez wagę worka."],
        ["Jakie zużycie wpisać?",
         "Wartość z worka, w kilogramach na m² i milimetr grubości. Domyślne 2,0 kg odpowiada zwykłej zaprawie cementowej, a anhydryt i lekkie jastrychy mają inną gęstość."],
      ],
    },
    uk: {
      title: "Калькулятор стяжки: скільки мішків",
      desc: "Площа, товщина шару й витрата в кг на м² і мм дають кількість мішків стяжки, ровнителя або штукатурки.",
      faq: [
        ["Скільки мішків стяжки на м²?",
         "Витрату подають у кілограмах на квадратний метр і міліметр товщини. Калькулятор множить її на площу й товщину, а суму ділить на вагу мішка."],
        ["Яку витрату вписувати?",
         "Розрахунок припускає щільність близько 2,0 кг на літр розчину. Ангідритові стяжки й легкі ровнителі мають іншу щільність, тож перевірте значення на мішку."],
      ],
    },
    de: {
      title: "Estrichrechner: wie viele Säcke je m²",
      desc: "Fläche, Schichtdicke und Verbrauch in kg je m² und mm ergeben die Anzahl Säcke Estrich, Ausgleichsmasse oder Putz.",
      faq: [
        ["Wie viele Säcke Estrich braucht 1 m²?",
         "Der Verbrauch wird in Kilogramm je Quadratmeter und Millimeter Dicke angegeben. Der Rechner multipliziert ihn mit Fläche und Dicke und teilt die Summe durch das Sackgewicht."],
        ["Welchen Verbrauch trägt man ein?",
         "Die Umrechnung geht von rund 2,0 kg je Liter Mörtel aus. Anhydritestriche und leichte Estriche haben eine andere Dichte, prüfe den Wert auf dem Sack."],
      ],
    },
    en: {
      title: "Screed calculator: how many bags per m²",
      desc: "Area, layer thickness and the usage in kg per m² and mm give the number of bags of screed, levelling compound or plaster.",
      faq: [
        ["How many bags of screed per m²?",
         "Usage is given in kilograms per square metre and millimetre of thickness. The calculator multiplies it by the area and the thickness and divides the total by the bag weight."],
        ["What usage figure should you enter?",
         "The conversion assumes roughly 2.0 kg per litre of mortar. Anhydrite screeds and lightweight screeds have a different density, so check the value on the bag."],
      ],
    },
    cs: {
      title: "Kalkulačka potěru: kolik pytlů na m²",
      desc: "Plocha, tloušťka vrstvy a spotřeba v kg na m² a mm dají počet pytlů potěru, samonivelační stěrky nebo omítky.",
      faq: [
        ["Kolik pytlů potěru je na m²?",
         "Spotřeba se udává v kilogramech na metr čtvereční a milimetr tloušťky. Kalkulačka ji vynásobí plochou a tloušťkou a součet vydělí hmotností pytle."],
        ["Jakou spotřebu zadat?",
         "Přepočet počítá s hustotou kolem 2,0 kg na litr malty. Anhydritové potěry a lehké potěry mají jinou hustotu, hodnotu proto zkontrolujte na pytli."],
      ],
    },
    sk: {
      title: "Kalkulačka poteru: koľko vriec na m²",
      desc: "Plocha, hrúbka vrstvy a spotreba v kg na m² a mm dajú počet vriec poteru, samonivelačnej stierky alebo omietky.",
      faq: [
        ["Koľko vriec poteru je na m²?",
         "Spotreba sa udáva v kilogramoch na meter štvorcový a milimeter hrúbky. Kalkulačka ju vynásobí plochou a hrúbkou a súčet vydelí hmotnosťou vreca."],
        ["Akú spotrebu zadať?",
         "Prepočet počíta s hustotou okolo 2,0 kg na liter malty. Anhydritové potery a ľahké potery majú inú hustotu, hodnotu preto skontrolujte na vreci."],
      ],
    },
    ro: {
      title: "Calculator șapă: câți saci pe m²",
      desc: "Suprafața, grosimea stratului și consumul în kg pe m² și mm dau numărul de saci de șapă, autonivelantă sau tencuială.",
      faq: [
        ["Câți saci de șapă intră pe m²?",
         "Consumul se dă în kilograme pe metru pătrat și milimetru de grosime. Calculatorul îl înmulțește cu suprafața și grosimea și împarte totalul la greutatea sacului."],
        ["Ce consum trebuie introdus?",
         "Conversia pornește de la o densitate de circa 2,0 kg pe litru de mortar. Șapele pe bază de anhidrit și cele ușoare au altă densitate, verifică valoarea de pe sac."],
      ],
    },
    hr: {
      title: "Kalkulator estriha: koliko vreća po m²",
      desc: "Površina, debljina sloja i potrošnja u kg po m² i mm daju broj vreća estriha, samorazlijevajuće mase ili žbuke.",
      faq: [
        ["Koliko vreća estriha ide po m²?",
         "Potrošnja se daje u kilogramima po kvadratnom metru i milimetru debljine. Kalkulator je množi površinom i debljinom, a zbroj dijeli težinom vreće."],
        ["Koju potrošnju upisati?",
         "Vrijednost s vreće, u kilogramima po m² i milimetru debljine. Zadanih 2,0 kg odgovara običnom cementnom mortu, a anhidritni i laki estrisi imaju drugu gustoću."],
      ],
    },
    sr: {
      title: "Kalkulator estriha: koliko vreća po m²",
      desc: "Površina, debljina sloja i potrošnja u kg po m² i mm daju broj vreća estriha, samorazlivajuće mase ili maltera.",
      faq: [
        ["Koliko vreća estriha ide po m²?",
         "Potrošnja se daje u kilogramima po kvadratnom metru i milimetru debljine. Kalkulator je množi površinom i debljinom, a zbir deli težinom vreće."],
        ["Koju potrošnju uneti?",
         "Vrednost sa džaka, u kilogramima po m² i milimetru debljine. Podrazumevanih 2,0 kg odgovara običnom cementnom malteru, a anhidritni i laki estrisi imaju drugu gustinu."],
      ],
    },
    ru: {
      title: "Калькулятор стяжки: сколько мешков",
      desc: "Площадь, толщина слоя и расход в кг на м² и мм дают количество мешков стяжки, ровнителя или штукатурки.",
      faq: [
        ["Сколько мешков стяжки на м²?",
         "Расход указывают в килограммах на квадратный метр и миллиметр толщины. Калькулятор умножает его на площадь и толщину, а сумму делит на вес мешка."],
        ["Какой расход вписывать?",
         "Пересчёт исходит из плотности около 2,0 кг на литр раствора. Ангидритные и лёгкие стяжки имеют другую плотность, поэтому проверьте значение на мешке."],
      ],
    },
  },
  grout: {
    pl: {
      title: "Kalkulator fugi — ile kg na płytki",
      desc: "Wymiary płytki, szerokość spoiny i powierzchnia dają zużycie fugi w kilogramach i liczbę worków do kupienia.",
      faq: [
        ["Ile fugi na 1 m² płytek?",
         "Zużycie rośnie z szerokością spoiny i grubością płytki, a maleje z formatem. Przy dużym gresie na cienkiej spoinie wychodzi bardzo mało, przy mozaice dużo."],
        ["Jakie wymiary płytki podać?",
         "Długość, szerokość i grubość jednej płytki oraz szerokość spoiny. Z tych czterech liczb wychodzi objętość spoin na metrze kwadratowym, a z niej kilogramy."],
      ],
    },
    uk: {
      title: "Калькулятор затирки: скільки кг",
      desc: "Розміри плитки, ширина шва й площа дають витрату затирки в кілограмах і кількість мішків до покупки.",
      faq: [
        ["Скільки затирки на 1 м² плитки?",
         "Витрата росте з шириною шва й товщиною плитки та зменшується з форматом. На великому керамограніті з тонким швом виходить дуже мало, на мозаїці — багато."],
        ["Які розміри плитки вказувати?",
         "Довжину, ширину й товщину однієї плитки та ширину шва. З цих чотирьох чисел виходить об'єм швів на квадратному метрі, а з нього кілограми."],
      ],
    },
    de: {
      title: "Fugenrechner: wie viel kg Fugenmasse",
      desc: "Fliesenmaß, Fugenbreite und Fläche ergeben den Verbrauch an Fugenmasse in Kilogramm und die Anzahl der Säcke.",
      faq: [
        ["Wie viel Fugenmasse braucht 1 m² Fliesen?",
         "Der Verbrauch steigt mit Fugenbreite und Fliesendicke und sinkt mit dem Format. Bei großformatigem Feinsteinzeug mit schmaler Fuge ist es sehr wenig, bei Mosaik viel."],
        ["Welche Fliesenmaße gibt man an?",
         "Länge, Breite und Dicke einer Fliese sowie die Fugenbreite. Aus diesen vier Zahlen ergibt sich das Fugenvolumen je Quadratmeter und daraus das Gewicht."],
      ],
    },
    en: {
      title: "Grout calculator: how many kg for tiles",
      desc: "Tile size, joint width and area give the grout usage in kilograms and the number of bags to buy.",
      faq: [
        ["How much grout does 1 m² of tiles take?",
         "Usage rises with the joint width and the tile thickness and falls with the format. Large-format porcelain with a narrow joint takes very little; mosaic takes a lot."],
        ["Which tile dimensions do you enter?",
         "The length, width and thickness of one tile, plus the joint width. Those four numbers give the volume of the joints in a square metre, and from that the kilograms."],
      ],
    },
    cs: {
      title: "Kalkulačka spárovací hmoty: kolik kg",
      desc: "Rozměry obkladu, šířka spáry a plocha dají spotřebu spárovací hmoty v kilogramech a počet pytlů k nákupu.",
      faq: [
        ["Kolik spárovací hmoty je na 1 m²?",
         "Spotřeba roste se šířkou spáry a tloušťkou obkladu a klesá s formátem. U velkoformátové dlažby s tenkou spárou vyjde velmi málo, u mozaiky hodně."],
        ["Jaké rozměry obkladu zadat?",
         "Délku, šířku a tloušťku jednoho kusu a šířku spáry. Z těchto čtyř čísel vyjde objem spár na metru čtverečním a z něj kilogramy."],
      ],
    },
    sk: {
      title: "Kalkulačka škárovacej hmoty: koľko kg",
      desc: "Rozmery obkladu, šírka škáry a plocha dajú spotrebu škárovacej hmoty v kilogramoch a počet vriec na nákup.",
      faq: [
        ["Koľko škárovacej hmoty je na 1 m²?",
         "Spotreba rastie so šírkou škáry a hrúbkou obkladu a klesá s formátom. Pri veľkoformátovej dlažbe s tenkou škárou vyjde veľmi málo, pri mozaike veľa."],
        ["Aké rozmery obkladu zadať?",
         "Dĺžku, šírku a hrúbku jedného kusu a šírku škáry. Z týchto štyroch čísel vyjde objem škár na metri štvorcovom a z neho kilogramy."],
      ],
    },
    ro: {
      title: "Calculator chit de rosturi: câte kg",
      desc: "Dimensiunile plăcii, lățimea rostului și suprafața dau consumul de chit în kilograme și numărul de saci de cumpărat.",
      faq: [
        ["Cât chit de rosturi intră la 1 m²?",
         "Consumul crește cu lățimea rostului și grosimea plăcii și scade cu formatul. La gresie mare cu rost subțire iese foarte puțin, la mozaic iese mult."],
        ["Ce dimensiuni ale plăcii se introduc?",
         "Lungimea, lățimea și grosimea unei plăci, plus lățimea rostului. Din aceste patru numere iese volumul rosturilor pe metru pătrat, iar de acolo kilogramele."],
      ],
    },
    hr: {
      title: "Kalkulator fuge: koliko kg za pločice",
      desc: "Dimenzije pločice, širina fuge i površina daju potrošnju fuge u kilogramima i broj vreća za kupnju.",
      faq: [
        ["Koliko fuge ide na 1 m² pločica?",
         "Potrošnja raste sa širinom fuge i debljinom pločice, a pada s formatom. Kod velikog gresa s tankom fugom izlazi vrlo malo, kod mozaika mnogo."],
        ["Koje dimenzije pločice upisati?",
         "Duljinu, širinu i debljinu jedne pločice te širinu fuge. Iz ta četiri broja izlazi volumen fuga na kvadratnom metru, a iz njega kilogrami."],
      ],
    },
    sr: {
      title: "Kalkulator fug mase: koliko kg",
      desc: "Dimenzije pločice, širina fuge i površina daju potrošnju fug mase u kilogramima i broj vreća za kupovinu.",
      faq: [
        ["Koliko fug mase ide na 1 m² pločica?",
         "Potrošnja raste sa širinom fuge i debljinom pločice, a pada sa formatom. Kod velikog gresa sa tankom fugom izlazi vrlo malo, kod mozaika mnogo."],
        ["Koje dimenzije pločice uneti?",
         "Dužinu, širinu i debljinu jedne pločice i širinu fuge. Iz ta četiri broja izlazi zapremina fuga na kvadratnom metru, a iz nje kilogrami."],
      ],
    },
    ru: {
      title: "Калькулятор затирки: сколько кг",
      desc: "Размеры плитки, ширина шва и площадь дают расход затирки в килограммах и количество мешков к покупке.",
      faq: [
        ["Сколько затирки на 1 м² плитки?",
         "Расход растёт с шириной шва и толщиной плитки и падает с форматом. На крупном керамограните с тонким швом выходит очень мало, на мозаике — много."],
        ["Какие размеры плитки вводить?",
         "Длину, ширину и толщину одной плитки и ширину шва. Из этих четырёх чисел получается объём швов на квадратном метре, а из него килограммы."],
      ],
    },
  },
  masonry: {
    pl: {
      title: "Kalkulator muru — ile bloczków i zaprawy",
      desc: "Powierzchnia ściany minus otwory, liczba sztuk na m² i zapas dają liczbę bloczków lub cegieł oraz kilogramy zaprawy.",
      faq: [
        ["Ile bloczków na m² ściany?",
         "Liczba sztuk na m² wynika z wymiaru bloczka razem ze spoiną. Wpisz ją do formularza, a kalkulator pomnoży ją przez powierzchnię po odjęciu okien i drzwi."],
        ["Ile zapasu doliczyć do muru?",
         "5% wystarcza na docinkę i pęknięcia w transporcie. Przy dużej liczbie docinek, skosów albo filarków podnieś tę wartość."],
      ],
    },
    uk: {
      title: "Калькулятор кладки: блоки й розчин",
      desc: "Площа стіни без отворів, кількість штук на м² і запас дають число блоків чи цегли та кілограми розчину.",
      faq: [
        ["Скільки блоків на м² стіни?",
         "Кількість штук на м² випливає з розміру блока разом зі швом. Впишіть її у форму, і калькулятор помножить її на площу після віднімання вікон і дверей."],
        ["Скільки запасу додавати до кладки?",
         "Запас 5% покриває підрізку й тріщини при транспортуванні. За великої кількості підрізок, скосів чи простінків це значення варто підняти."],
      ],
    },
    de: {
      title: "Mauerrechner: Steine und Mörtel",
      desc: "Wandfläche minus Öffnungen, Steine je m² und Verschnitt ergeben die Anzahl der Steine und die Kilogramm Mörtel.",
      faq: [
        ["Wie viele Steine braucht 1 m² Wand?",
         "Die Stückzahl je m² folgt aus dem Steinmaß samt Fuge. Trage sie ein, der Rechner multipliziert sie mit der Fläche, nachdem Fenster und Türen abgezogen sind."],
        ["Wie viel Verschnitt rechnet man beim Mauern?",
         "5% decken Zuschnitt und Transportbruch. Bei vielen Passsteinen, Schrägen oder schmalen Pfeilern lohnt ein höherer Wert."],
      ],
    },
    en: {
      title: "Masonry calculator: blocks and mortar",
      desc: "Wall area less the openings, the pieces per m² and a waste allowance give the number of blocks or bricks and the kilograms of mortar.",
      faq: [
        ["How many blocks does 1 m² of wall take?",
         "The pieces per m² follow from the size of the block including its joint. Enter that figure and the calculator multiplies it by the area once windows and doors are deducted."],
        ["How much waste should you allow when laying blocks?",
         "5% covers cutting and breakage in transport. With many cut pieces, angles or narrow piers it is worth raising that figure."],
      ],
    },
    cs: {
      title: "Kalkulačka zdiva: tvárnice a malta",
      desc: "Plocha stěny bez otvorů, počet kusů na m² a prořez dají počet tvárnic nebo cihel a kilogramy malty.",
      faq: [
        ["Kolik tvárnic je na m² stěny?",
         "Počet kusů na m² plyne z rozměru tvárnice včetně spáry. Zadejte jej a kalkulačka jej vynásobí plochou po odečtení oken a dveří."],
        ["Kolik prořezu počítat při zdění?",
         "5% pokryje dořez a praskliny při dopravě. Při velkém počtu dořezů, šikmin nebo úzkých pilířů se vyplatí hodnotu zvýšit."],
      ],
    },
    sk: {
      title: "Kalkulačka muriva: tvárnice a malta",
      desc: "Plocha steny bez otvorov, počet kusov na m² a prerez dajú počet tvárnic alebo tehál a kilogramy malty.",
      faq: [
        ["Koľko tvárnic je na m² steny?",
         "Počet kusov na m² vyplýva z rozmeru tvárnice vrátane škáry. Zadajte ho a kalkulačka ho vynásobí plochou po odčítaní okien a dverí."],
        ["Koľko prerezu počítať pri murovaní?",
         "5% pokryje dorez a praskliny pri doprave. Pri veľkom počte dorezov, šikmín alebo úzkych pilierov sa oplatí hodnotu zvýšiť."],
      ],
    },
    ro: {
      title: "Calculator zidărie: blocuri și mortar",
      desc: "Suprafața peretelui fără goluri, bucățile pe m² și adaosul dau numărul de blocuri sau cărămizi și kilogramele de mortar.",
      faq: [
        ["Câte blocuri intră la 1 m² de perete?",
         "Numărul de bucăți pe m² rezultă din dimensiunea blocului împreună cu rostul. Introdu-l, iar calculatorul îl înmulțește cu suprafața după scăderea ferestrelor și ușilor."],
        ["Cât adaos se calculează la zidărie?",
         "5% acoperă tăierile și spargerile din transport. La multe tăieri, teșituri sau stâlpișori merită o valoare mai mare."],
      ],
    },
    hr: {
      title: "Kalkulator zidanja: blokovi i mort",
      desc: "Površina zida bez otvora, broj komada po m² i otpad daju broj blokova ili opeke te kilograme morta.",
      faq: [
        ["Koliko blokova ide na m² zida?",
         "Broj komada po m² proizlazi iz dimenzije bloka zajedno sa sljubnicom. Upišite ga, a kalkulator ga množi površinom nakon odbijanja prozora i vrata."],
        ["Koliko otpada računati kod zidanja?",
         "5% pokriva rezanje i lomove u transportu. Kod puno rezanja, kosina ili uskih stupića vrijedi podignuti tu vrijednost."],
      ],
    },
    sr: {
      title: "Kalkulator zidanja: blokovi i malter",
      desc: "Površina zida bez otvora, broj komada po m² i otpad daju broj blokova ili cigala i kilograme maltera.",
      faq: [
        ["Koliko blokova ide na m² zida?",
         "Broj komada po m² proizlazi iz dimenzije bloka zajedno sa spojnicom. Unesite ga, a kalkulator ga množi površinom nakon oduzimanja prozora i vrata."],
        ["Koliko otpada računati kod zidanja?",
         "5% pokriva sečenje i lomove u transportu. Kod mnogo sečenja, kosina ili uskih stubića vredi podići tu vrednost."],
      ],
    },
    ru: {
      title: "Калькулятор кладки: блоки и раствор",
      desc: "Площадь стены без проёмов, число штук на м² и запас дают количество блоков или кирпича и килограммы раствора.",
      faq: [
        ["Сколько блоков на м² стены?",
         "Число штук на м² следует из размера блока вместе со швом. Впишите его, и калькулятор умножит его на площадь после вычитания окон и дверей."],
        ["Сколько запаса закладывать на кладку?",
         "5% хватает на подрезку и бой при перевозке. При большом числе подрезок, скосов или узких простенков это значение стоит поднять."],
      ],
    },
  },
  insulation: {
    pl: {
      title: "Kalkulator ocieplenia — styropian i kołki",
      desc: "Powierzchnia elewacji daje płyty styropianu, kołki, kilogramy kleju i metry siatki na ocieplenie w systemie ETICS.",
      faq: [
        ["Ile kołków na m² styropianu?",
         "6 sztuk na m² to wartość typowa dla parteru i pierwszego piętra. Liczba zależy od wysokości budynku i strefy wiatrowej, więc przy wyższych ścianach wpisz więcej."],
        ["Ile siatki na ocieplenie?",
         "Siatkę licz z zakładem 10%, bo sąsiednie pasy muszą zachodzić na siebie. Kalkulator dolicza ten zakład do powierzchni elewacji."],
      ],
    },
    uk: {
      title: "Калькулятор утеплення: пінопласт і дюбелі",
      desc: "Площа фасаду дає плити пінопласту, дюбелі, кілограми клею та метри сітки для утеплення в системі ETICS.",
      faq: [
        ["Скільки дюбелів на м² пінопласту?",
         "6 штук на м² — типове значення для першого й другого поверху. Кількість залежить від висоти будинку та вітрової зони, тож для вищих стін вписуйте більше."],
        ["Скільки сітки на утеплення?",
         "Сітку рахуйте із запасом 10%, бо сусідні смуги мають перекриватися. Калькулятор додає цей нахлест до площі фасаду."],
      ],
    },
    de: {
      title: "WDVS-Rechner: Dämmplatten und Dübel",
      desc: "Die Fassadenfläche ergibt Dämmplatten, Dübel, Kilogramm Kleber und Meter Gewebe für ein Wärmedämm-Verbundsystem.",
      faq: [
        ["Wie viele Dübel je m² Dämmplatte?",
         "6 Stück je m² sind typisch für Erdgeschoss und erstes Obergeschoss. Die Zahl hängt von Gebäudehöhe und Windzone ab, bei höheren Wänden also mehr eintragen."],
        ["Wie viel Gewebe braucht die Dämmung?",
         "Das Gewebe wird mit 10% Überlappung gerechnet, weil benachbarte Bahnen übereinander liegen müssen. Der Rechner schlägt diesen Anteil auf die Fläche auf."],
      ],
    },
    en: {
      title: "ETICS calculator: EPS boards and dowels",
      desc: "The façade area gives insulation boards, dowels, kilograms of adhesive and metres of mesh for an external insulation system.",
      faq: [
        ["How many dowels per m² of insulation?",
         "6 per m² is typical for a ground floor and a first floor. The number depends on the height of the building and the wind zone, so enter more for taller walls."],
        ["How much mesh does the insulation need?",
         "Mesh is counted with a 10% overlap, because neighbouring strips have to lap over each other. The calculator adds that overlap to the façade area."],
      ],
    },
    cs: {
      title: "Kalkulačka zateplení: polystyren a hmoždinky",
      desc: "Plocha fasády dá desky polystyrenu, hmoždinky, kilogramy lepidla a metry síťoviny pro zateplení systémem ETICS.",
      faq: [
        ["Kolik hmoždinek je na m² polystyrenu?",
         "6 kusů na m² je typická hodnota pro přízemí a první patro. Počet závisí na výšce budovy a větrné oblasti, u vyšších stěn tedy zadejte více."],
        ["Kolik síťoviny na zateplení?",
         "Síťovinu počítejte s přesahem 10%, protože sousední pásy se musí překrývat. Kalkulačka tento přesah k ploše fasády připočte."],
      ],
    },
    sk: {
      title: "Kalkulačka zateplenia: polystyrén a hmoždinky",
      desc: "Plocha fasády dá dosky polystyrénu, hmoždinky, kilogramy lepidla a metre sieťoviny na zateplenie systémom ETICS.",
      faq: [
        ["Koľko hmoždiniek je na m² polystyrénu?",
         "6 kusov na m² je typická hodnota pre prízemie a prvé poschodie. Počet závisí od výšky budovy a veternej oblasti, pri vyšších stenách teda zadajte viac."],
        ["Koľko sieťoviny na zateplenie?",
         "Sieťovinu počítajte s presahom 10%, pretože susedné pásy sa musia prekrývať. Kalkulačka tento presah k ploche fasády pripočíta."],
      ],
    },
    ro: {
      title: "Calculator termoizolație: polistiren și dibluri",
      desc: "Suprafața fațadei dă plăcile de polistiren, diblurile, kilogramele de adeziv și metrii de plasă pentru sistemul ETICS.",
      faq: [
        ["Câte dibluri intră la 1 m² de polistiren?",
         "6 bucăți pe m² este o valoare tipică pentru parter și etajul întâi. Numărul depinde de înălțimea clădirii și de zona eoliană, deci pentru pereți mai înalți introdu mai multe."],
        ["Câtă plasă trebuie la termoizolație?",
         "Plasa se calculează cu suprapunere de 10%, pentru că fâșiile vecine trebuie să se suprapună. Calculatorul adaugă această suprapunere la suprafața fațadei."],
      ],
    },
    hr: {
      title: "Kalkulator izolacije: stiropor i tiple",
      desc: "Površina fasade daje ploče stiropora, tiple, kilograme ljepila i metre mrežice za toplinsku izolaciju u sustavu ETICS.",
      faq: [
        ["Koliko tipli ide na m² stiropora?",
         "6 komada po m² tipična je vrijednost za prizemlje i prvi kat. Broj ovisi o visini zgrade i vjetrovnoj zoni, pa za više zidove upišite više."],
        ["Koliko mrežice ide na izolaciju?",
         "Mrežicu računajte s preklopom od 10%, jer susjedne trake moraju ići jedna preko druge. Kalkulator taj preklop dodaje na površinu fasade."],
      ],
    },
    sr: {
      title: "Kalkulator izolacije: stiropor i tiplovi",
      desc: "Površina fasade daje ploče stiropora, tiplove, kilograme lepka i metre mrežice za termoizolaciju u sistemu ETICS.",
      faq: [
        ["Koliko tiplova ide na m² stiropora?",
         "6 komada po m² tipična je vrednost za prizemlje i prvi sprat. Broj zavisi od visine zgrade i vetrovne zone, pa za više zidove unesite više."],
        ["Koliko mrežice ide na izolaciju?",
         "Mrežicu računajte sa preklopom od 10%, jer susedne trake moraju ići jedna preko druge. Kalkulator taj preklop dodaje na površinu fasade."],
      ],
    },
    ru: {
      title: "Калькулятор утепления: пенопласт и дюбели",
      desc: "Площадь фасада даёт плиты пенопласта, дюбели, килограммы клея и метры сетки для утепления в системе ETICS.",
      faq: [
        ["Сколько дюбелей на м² пенопласта?",
         "6 штук на м² — типичное значение для первого и второго этажа. Количество зависит от высоты здания и ветровой зоны, поэтому для высоких стен впишите больше."],
        ["Сколько сетки нужно на утепление?",
         "Сетку считайте с нахлёстом 10%, потому что соседние полосы должны перекрываться. Калькулятор добавляет этот нахлёст к площади фасада."],
      ],
    },
  },
  studwall: {
    pl: {
      title: "Kalkulator ściany G-K — profile i płyty",
      desc: "Szerokość, wysokość i rozstaw profili dają liczbę profili CW i UW, płyt gipsowo-kartonowych oraz kołków na ścianę działową.",
      faq: [
        ["Ile profili na ścianę działową?",
         "Profile CW stoją co tyle, ile wynosi rozstaw, a UW biegną górą i dołem. Kalkulator przelicza jedno i drugie na całe profile o zadanej długości."],
        ["Jaki rozstaw profili wybrać?",
         "60 cm pod płytę o szerokości 1,2 m. Pod płytki albo cięższą okładzinę zejdź do 40 cm — profili wychodzi wtedy więcej."],
      ],
    },
    uk: {
      title: "Калькулятор перегородки ГК: профілі й листи",
      desc: "Ширина, висота й крок профілів дають кількість профілів CW і UW, гіпсокартонних листів та дюбелів на перегородку.",
      faq: [
        ["Скільки профілів на перегородку?",
         "Профілі CW стоять із заданим кроком, а UW ідуть згори та знизу. Калькулятор переводить обидва на цілі профілі заданої довжини."],
        ["Який крок профілів обрати?",
         "Крок 60 см — стандарт під лист шириною 1,2 м. Під важче облицювання чи плитку зменшіть до 40 см. Листи рахуйте на обидва боки стіни."],
      ],
    },
    de: {
      title: "Ständerwand-Rechner: Profile und Platten",
      desc: "Breite, Höhe und Ständerabstand ergeben CW- und UW-Profile, Gipskartonplatten und Dübel für eine Trennwand.",
      faq: [
        ["Wie viele Profile braucht eine Trennwand?",
         "Die CW-Profile stehen im gewählten Abstand, die UW-Profile laufen oben und unten. Der Rechner rechnet beides in ganze Profile der eingegebenen Länge um."],
        ["Welchen Ständerabstand wählt man?",
         "60 cm sind Standard für eine 1,2 m breite Platte. Für schwere Bekleidung oder Fliesen auf 40 cm gehen. Platten werden für beide Wandseiten gezählt."],
      ],
    },
    en: {
      title: "Stud wall calculator: profiles and boards",
      desc: "Width, height and stud spacing give the CW and UW profiles, the plasterboards and the anchors for a partition wall.",
      faq: [
        ["How many profiles does a partition wall take?",
         "The CW studs stand at the spacing you choose and the UW tracks run along the top and the bottom. The calculator turns both into whole profiles of the length you enter."],
        ["What stud spacing should you use?",
         "600 mm is the standard under a 1.2 m board. Go down to 400 mm for heavy cladding or tiles. Boards are counted for both sides of the wall."],
      ],
    },
    cs: {
      title: "Kalkulačka příčky SDK: profily a desky",
      desc: "Šířka, výška a rozteč profilů dají počet profilů CW a UW, sádrokartonových desek a hmoždinek na příčku.",
      faq: [
        ["Kolik profilů je na příčku?",
         "Profily CW stojí ve zvolené rozteči, UW běží nahoře a dole. Kalkulačka obojí přepočte na celé profily zadané délky."],
        ["Jakou rozteč profilů zvolit?",
         "Rozteč 60 cm je standard pod desku šířky 1,2 m. Pod těžší obklad nebo dlažbu jděte na 40 cm. Desky se počítají na obě strany stěny."],
      ],
    },
    sk: {
      title: "Kalkulačka priečky SDK: profily a dosky",
      desc: "Šírka, výška a rozstup profilov dajú počet profilov CW a UW, sadrokartónových dosiek a hmoždiniek na priečku.",
      faq: [
        ["Koľko profilov je na priečku?",
         "Profily CW stoja vo zvolenom rozstupe, UW bežia hore a dole. Kalkulačka oboje prepočíta na celé profily zadanej dĺžky."],
        ["Aký rozstup profilov zvoliť?",
         "Rozstup 60 cm je štandard pod dosku šírky 1,2 m. Pod ťažší obklad alebo dlažbu choďte na 40 cm. Dosky sa počítajú na obe strany steny."],
      ],
    },
    ro: {
      title: "Calculator perete gips-carton: profile și plăci",
      desc: "Lățimea, înălțimea și pasul montanților dau profilele CW și UW, plăcile de gips-carton și diblurile pentru un perete despărțitor.",
      faq: [
        ["Câte profile intră într-un perete despărțitor?",
         "Montanții CW stau la pasul ales, iar profilele UW merg sus și jos. Calculatorul transformă ambele în profile întregi de lungimea introdusă."],
        ["Ce pas al montanților se alege?",
         "60 cm este standardul sub o placă de 1,2 m. Pentru placări grele sau faianță coboară la 40 cm. Plăcile se numără pe ambele fețe ale peretelui."],
      ],
    },
    hr: {
      title: "Kalkulator pregradnog zida: profili i ploče",
      desc: "Širina, visina i razmak profila daju broj profila CW i UW, gips-kartonskih ploča i tipli za pregradni zid.",
      faq: [
        ["Koliko profila ide u pregradni zid?",
         "Profili CW stoje na odabranom razmaku, a UW idu gore i dolje. Kalkulator oboje pretvara u cijele profile upisane duljine."],
        ["Koji razmak profila odabrati?",
         "Razmak 60 cm standard je za ploču širine 1,2 m. Za težu oblogu ili pločice spustite se na 40 cm. Ploče se računaju s obje strane zida."],
      ],
    },
    sr: {
      title: "Kalkulator pregradnog zida: profili i ploče",
      desc: "Širina, visina i razmak profila daju broj profila CW i UW, gips-kartonskih ploča i tiplova za pregradni zid.",
      faq: [
        ["Koliko profila ide u pregradni zid?",
         "Profili CW stoje na izabranom razmaku, a UW idu gore i dole. Kalkulator oboje pretvara u cele profile unete dužine."],
        ["Koji razmak profila izabrati?",
         "Razmak 60 cm standard je za ploču širine 1,2 m. Za težu oblogu ili pločice spustite se na 40 cm. Ploče se računaju sa obe strane zida."],
      ],
    },
    ru: {
      title: "Калькулятор перегородки ГК: профили и листы",
      desc: "Ширина, высота и шаг профилей дают количество профилей CW и UW, гипсокартонных листов и дюбелей на перегородку.",
      faq: [
        ["Сколько профилей нужно на перегородку?",
         "Стойки CW стоят с заданным шагом, а направляющие UW идут сверху и снизу. Калькулятор переводит и то и другое в целые профили указанной длины."],
        ["Какой шаг профилей выбрать?",
         "Шаг 60 см — стандарт под лист шириной 1,2 м. Под тяжёлую облицовку или плитку опуститесь до 40 см. Листы считайте на обе стороны стены."],
      ],
    },
  },
  ceiling: {
    pl: {
      title: "Kalkulator sufitu podwieszanego — profile",
      desc: "Wymiary sufitu i rozstawy dają liczbę profili CD i UD, wieszaków oraz płyt gipsowo-kartonowych na sufit podwieszany.",
      faq: [
        ["Ile profili na sufit podwieszany?",
         "Profile nośne CD idą co tyle, ile wynosi rozstaw, a UD obiegają ściany. Kalkulator liczy jedno i drugie z wymiarów sufitu i podaje w całych profilach."],
        ["Jaki rozstaw wieszaków przyjąć?",
         "Typowo 90 cm wzdłuż profilu CD, przy rozstawie profili 40 cm. Cięższa okładzina albo oprawy w suficie wymagają gęstszej siatki."],
      ],
    },
    uk: {
      title: "Калькулятор підвісної стелі: профілі",
      desc: "Розміри стелі й кроки профілів дають кількість профілів CD і UD, підвісів та гіпсокартонних листів на підвісну стелю.",
      faq: [
        ["Скільки профілів на підвісну стелю?",
         "Несучі профілі CD ідуть із заданим кроком, а UD обходять стіни. Калькулятор рахує обидва з розмірів стелі й подає в цілих профілях."],
        ["Який крок підвісів прийняти?",
         "Крок CD 40 см і підвісів 90 см — типова стеля під лист. За більшого навантаження кроки треба зменшити."],
      ],
    },
    de: {
      title: "Deckenrechner: CD/UD-Profile und Abhänger",
      desc: "Deckenmaße und Abstände ergeben CD- und UD-Profile, Abhänger und Gipskartonplatten für eine abgehängte Decke.",
      faq: [
        ["Wie viele Profile braucht eine abgehängte Decke?",
         "Die Tragprofile CD liegen im gewählten Abstand, die UD-Profile laufen an den Wänden entlang. Der Rechner ermittelt beides aus den Deckenmaßen und gibt ganze Profile aus."],
        ["Welchen Abhängerabstand nimmt man?",
         "CD im Abstand 40 cm und Abhänger alle 90 cm sind eine typische Decke unter Platte. Bei größerer Last müssen die Abstände enger werden."],
      ],
    },
    en: {
      title: "Suspended ceiling calculator: profiles",
      desc: "Ceiling dimensions and the spacings give the CD and UD profiles, the hangers and the plasterboards for a suspended ceiling.",
      faq: [
        ["How many profiles does a suspended ceiling take?",
         "The CD carriers run at the spacing you set and the UD track goes round the walls. The calculator works out both from the ceiling size and gives whole profiles."],
        ["What hanger spacing should you use?",
         "CD at 400 mm and hangers at 900 mm is a typical ceiling under board. Under a heavier load the spacings have to be closer."],
      ],
    },
    cs: {
      title: "Kalkulačka podhledu: profily a závěsy",
      desc: "Rozměry podhledu a rozteče dají počet profilů CD a UD, závěsů a sádrokartonových desek na zavěšený podhled.",
      faq: [
        ["Kolik profilů je na podhled?",
         "Nosné profily CD jdou ve zvolené rozteči, UD obíhají stěny. Kalkulačka obojí spočítá z rozměrů podhledu a vydá celé profily."],
        ["Jakou rozteč závěsů zvolit?",
         "CD po 40 cm a závěsy po 90 cm jsou typický podhled pod desku. Při větším zatížení je nutné rozteče zhustit."],
      ],
    },
    sk: {
      title: "Kalkulačka podhľadu: profily a závesy",
      desc: "Rozmery podhľadu a rozstupy dajú počet profilov CD a UD, závesov a sadrokartónových dosiek na zavesený podhľad.",
      faq: [
        ["Koľko profilov je na podhľad?",
         "Nosné profily CD idú vo zvolenom rozstupe, UD obiehajú steny. Kalkulačka oboje spočíta z rozmerov podhľadu a vydá celé profily."],
        ["Aký rozstup závesov zvoliť?",
         "CD po 40 cm a závesy po 90 cm sú typický podhľad pod dosku. Pri väčšom zaťažení treba rozstupy zhustiť."],
      ],
    },
    ro: {
      title: "Calculator tavan suspendat: profile și tije",
      desc: "Dimensiunile tavanului și pașii dau profilele CD și UD, tijele de suspendare și plăcile de gips-carton pentru un tavan suspendat.",
      faq: [
        ["Câte profile intră într-un tavan suspendat?",
         "Profilele portante CD merg la pasul ales, iar UD înconjoară pereții. Calculatorul le determină pe amândouă din dimensiunile tavanului și dă profile întregi."],
        ["Ce pas al tijelor se folosește?",
         "CD la 40 cm și tije la 90 cm înseamnă un tavan obișnuit sub placă. La o încărcare mai mare pașii trebuie îndesiți."],
      ],
    },
    hr: {
      title: "Kalkulator spuštenog stropa: profili",
      desc: "Dimenzije stropa i razmaci daju profile CD i UD, vješalice i gips-kartonske ploče za spušteni strop.",
      faq: [
        ["Koliko profila ide u spušteni strop?",
         "Nosivi profili CD idu na odabranom razmaku, a UD obilaze zidove. Kalkulator oboje računa iz dimenzija stropa i daje cijele profile."],
        ["Koji razmak vješalica uzeti?",
         "Tipično 90 cm uzduž CD profila, uz razmak profila od 40 cm. Teža obloga ili ugradna rasvjeta traže gušću mrežu."],
      ],
    },
    sr: {
      title: "Kalkulator spuštenog plafona: profili",
      desc: "Dimenzije plafona i razmaci daju profile CD i UD, vešalice i gips-kartonske ploče za spušteni plafon.",
      faq: [
        ["Koliko profila ide u spušteni plafon?",
         "Noseći profili CD idu na izabranom razmaku, a UD obilaze zidove. Kalkulator oboje računa iz dimenzija plafona i daje cele profile."],
        ["Koji razmak vešalica uzeti?",
         "Tipično 90 cm duž CD profila, uz razmak profila od 40 cm. Teža obloga ili ugradna rasveta traže gušću mrežu."],
      ],
    },
    ru: {
      title: "Калькулятор подвесного потолка: профили",
      desc: "Размеры потолка и шаги дают количество профилей CD и UD, подвесов и гипсокартонных листов на подвесной потолок.",
      faq: [
        ["Сколько профилей нужно на подвесной потолок?",
         "Несущие профили CD идут с заданным шагом, а UD обходят стены. Калькулятор считает и то и другое из размеров потолка и выдаёт целые профили."],
        ["Какой шаг подвесов принять?",
         "Шаг CD 40 см и подвесов 90 см — типичный потолок под лист. При большей нагрузке шаги нужно уменьшить."],
      ],
    },
  },
  drylining: {
    pl: {
      title: "Kalkulator płyt G-K na klej — ile płyt",
      desc: "Powierzchnia ściany i zużycie kleju gipsowego dają liczbę płyt gipsowo-kartonowych i worków kleju do montażu na placki.",
      faq: [
        ["Ile płyt G-K na m² ściany?",
         "Kalkulator dzieli powierzchnię przez pole jednej płyty i zaokrągla w górę do całych sztuk, a osobno liczy klej z zużycia na metr kwadratowy."],
        ["Kiedy nie da się kleić płyt na placki?",
         "Metoda na kleju gipsowym działa tylko na równym, nośnym podłożu. Przy większych nierównościach potrzebny jest stelaż z profili."],
      ],
    },
    uk: {
      title: "Калькулятор ГК на клей: скільки листів",
      desc: "Площа стіни й витрата гіпсового клею дають кількість гіпсокартонних листів і мішків клею для монтажу на маяки.",
      faq: [
        ["Скільки листів ГК на м² стіни?",
         "Калькулятор ділить площу на площу одного листа й округлює вгору до цілих штук, а клей рахує окремо з витрати на квадратний метр."],
        ["Коли клеїти листи на маяки не можна?",
         "Метод на гіпсовому клеї працює лише на рівній, міцній основі. За більших нерівностей потрібен каркас із профілів."],
      ],
    },
    de: {
      title: "Rechner für Platten auf Batzen",
      desc: "Wandfläche und Verbrauch an Ansetzgips ergeben die Anzahl der Gipskartonplatten und der Säcke Kleber für das Ansetzen auf Batzen.",
      faq: [
        ["Wie viele Platten braucht 1 m² Wand?",
         "Der Rechner teilt die Fläche durch die Fläche einer Platte und rundet auf ganze Stück auf. Den Kleber rechnet er getrennt aus dem Verbrauch je Quadratmeter."],
        ["Wann geht das Ansetzen auf Batzen nicht?",
         "Ansetzgips funktioniert nur auf ebenem, tragfähigem Untergrund. Bei größeren Unebenheiten braucht es eine Unterkonstruktion aus Profilen."],
      ],
    },
    en: {
      title: "Dot and dab calculator: boards and adhesive",
      desc: "Wall area and the usage of gypsum adhesive give the number of plasterboards and the bags of adhesive for dot-and-dab fixing.",
      faq: [
        ["How many boards does 1 m² of wall take?",
         "The calculator divides the area by the area of one board and rounds up to whole boards. The adhesive is worked out separately, from the usage per square metre."],
        ["When can boards not be dot-and-dabbed?",
         "Gypsum adhesive only works on a flat, sound background. Where the wall is badly out of true a metal frame is needed instead."],
      ],
    },
    cs: {
      title: "Kalkulačka SDK na lepidlo: kolik desek",
      desc: "Plocha stěny a spotřeba sádrového lepidla dají počet sádrokartonových desek a pytlů lepidla pro montáž na terče.",
      faq: [
        ["Kolik desek je na m² stěny?",
         "Kalkulačka vydělí plochu plochou jedné desky a zaokrouhlí nahoru na celé kusy; lepidlo počítá zvlášť ze spotřeby na metr čtvereční."],
        ["Kdy desky na terče lepit nelze?",
         "Sádrové lepidlo funguje jen na rovném a únosném podkladu. Při větších nerovnostech je potřeba rošt z profilů."],
      ],
    },
    sk: {
      title: "Kalkulačka SDK na lepidlo: koľko dosiek",
      desc: "Plocha steny a spotreba sadrového lepidla dajú počet sadrokartónových dosiek a vriec lepidla na montáž na terče.",
      faq: [
        ["Koľko dosiek je na m² steny?",
         "Kalkulačka vydelí plochu plochou jednej dosky a zaokrúhli nahor na celé kusy; lepidlo počíta zvlášť zo spotreby na meter štvorcový."],
        ["Kedy dosky na terče lepiť nemožno?",
         "Sadrové lepidlo funguje len na rovnom a únosnom podklade. Pri väčších nerovnostiach je potrebný rošt z profilov."],
      ],
    },
    ro: {
      title: "Calculator gips-carton lipit: câte plăci",
      desc: "Suprafața peretelui și consumul de adeziv de ipsos dau numărul de plăci de gips-carton și sacii de adeziv pentru lipirea pe pastile.",
      faq: [
        ["Câte plăci intră la 1 m² de perete?",
         "Calculatorul împarte suprafața la aria unei plăci și rotunjește în sus la plăci întregi; adezivul îl socotește separat, din consumul pe metru pătrat."],
        ["Când nu se pot lipi plăcile pe pastile?",
         "Adezivul de ipsos merge doar pe un suport plan și portant. La denivelări mari este nevoie de o structură din profile."],
      ],
    },
    hr: {
      title: "Kalkulator ploča na ljepilo: koliko ploča",
      desc: "Površina zida i potrošnja gipsanog ljepila daju broj gips-kartonskih ploča i vreća ljepila za lijepljenje na točke.",
      faq: [
        ["Koliko ploča ide na m² zida?",
         "Kalkulator dijeli površinu površinom jedne ploče i zaokružuje naviše na cijele komade; ljepilo računa zasebno iz potrošnje po kvadratnom metru."],
        ["Kada se ploče ne mogu lijepiti na točke?",
         "Gipsano ljepilo radi samo na ravnoj i nosivoj podlozi. Kod većih neravnina potrebna je potkonstrukcija od profila."],
      ],
    },
    sr: {
      title: "Kalkulator ploča na lepak: koliko ploča",
      desc: "Površina zida i potrošnja gipsanog lepka daju broj gips-kartonskih ploča i vreća lepka za lepljenje na tačke.",
      faq: [
        ["Koliko ploča ide na m² zida?",
         "Kalkulator deli površinu površinom jedne ploče i zaokružuje naviše na cele komade; lepak računa posebno iz potrošnje po kvadratnom metru."],
        ["Kada se ploče ne mogu lepiti na tačke?",
         "Gipsani lepak radi samo na ravnoj i nosivoj podlozi. Kod većih neravnina potrebna je potkonstrukcija od profila."],
      ],
    },
    ru: {
      title: "Калькулятор ГК на клей: сколько листов",
      desc: "Площадь стены и расход гипсового клея дают количество гипсокартонных листов и мешков клея для монтажа на маяки.",
      faq: [
        ["Сколько листов ГК на м² стены?",
         "Калькулятор делит площадь на площадь одного листа и округляет вверх до целых штук, а клей считает отдельно из расхода на квадратный метр."],
        ["Когда клеить листы на маяки нельзя?",
         "Гипсовый клей работает только на ровном и прочном основании. При больших неровностях нужен каркас из профилей."],
      ],
    },
  },
  sheathing: {
    pl: {
      title: "Kalkulator poszycia OSB — ile arkuszy",
      desc: "Powierzchnia do pokrycia, wymiar arkusza i zapas dają liczbę całych płyt OSB albo desek na poszycie ściany lub dachu.",
      faq: [
        ["Ile płyt OSB na m² poszycia?",
         "Kalkulator dzieli powierzchnię powiększoną o zapas przez pole jednego arkusza i zaokrągla w górę do całych płyt."],
        ["Czy wynik zawiera plan rozkroju?",
         "Nie, to liczba całych arkuszy. Plan cięcia z rzazem piły daje kalkulator rozkroju płyt 2D."],
      ],
    },
    uk: {
      title: "Калькулятор обшивки OSB: скільки аркушів",
      desc: "Площа покриття, розмір аркуша й запас дають кількість цілих плит OSB або дощок на обшивку стіни чи даху.",
      faq: [
        ["Скільки плит OSB на м² обшивки?",
         "Калькулятор ділить площу разом із запасом на площу одного аркуша й округлює вгору до цілих плит."],
        ["Чи є в результаті план розкрою?",
         "Ні, це кількість цілих аркушів без плану різання. Якщо потрібно знати, як їх різати, скористайтеся калькулятором розкрою плит 2D."],
      ],
    },
    de: {
      title: "OSB-Rechner: wie viele Platten",
      desc: "Zu deckende Fläche, Plattenmaß und Verschnitt ergeben die Anzahl ganzer OSB-Platten oder Bretter für Wand oder Dach.",
      faq: [
        ["Wie viele OSB-Platten braucht 1 m² Beplankung?",
         "Der Rechner teilt die um den Verschnitt erhöhte Fläche durch die Fläche einer Platte und rundet auf ganze Platten auf."],
        ["Enthält das Ergebnis einen Schnittplan?",
         "Nein, es ist die Anzahl ganzer Platten ohne Schnittplan. Wie sie zu zerteilen sind, sagt der Rechner für den Plattenzuschnitt 2D."],
      ],
    },
    en: {
      title: "OSB sheathing calculator: how many sheets",
      desc: "The area, the sheet size and a waste allowance give the number of whole OSB panels or boards for a wall or a roof.",
      faq: [
        ["How many OSB sheets per m² of sheathing?",
         "The calculator divides the area plus the waste allowance by the area of one sheet and rounds up to whole panels."],
        ["Does the result include a cutting plan?",
         "No, it is the number of whole sheets with no cutting plan. To see how to cut them, use the 2D sheet cutting calculator."],
      ],
    },
    cs: {
      title: "Kalkulačka záklopu OSB: kolik desek",
      desc: "Plocha k pokrytí, rozměr desky a prořez dají počet celých desek OSB nebo prken na záklop stěny či střechy.",
      faq: [
        ["Kolik desek OSB je na m² záklopu?",
         "Kalkulačka vydělí plochu zvětšenou o prořez plochou jedné desky a zaokrouhlí nahoru na celé desky."],
        ["Obsahuje výsledek plán nářezu?",
         "Ne, je to počet celých desek bez plánu řezání. Jak je rozřezat, řekne kalkulačka nářezu desek 2D."],
      ],
    },
    sk: {
      title: "Kalkulačka záklopu OSB: koľko dosiek",
      desc: "Plocha na pokrytie, rozmer dosky a prerez dajú počet celých dosiek OSB alebo dosák na záklop steny či strechy.",
      faq: [
        ["Koľko dosiek OSB je na m² záklopu?",
         "Kalkulačka vydelí plochu zväčšenú o prerez plochou jednej dosky a zaokrúhli nahor na celé dosky."],
        ["Obsahuje výsledok plán rezu?",
         "Nie, je to počet celých dosiek bez plánu rezania. Ako ich rozrezať, povie kalkulačka rezu dosiek 2D."],
      ],
    },
    ro: {
      title: "Calculator placare OSB: câte foi",
      desc: "Suprafața de acoperit, dimensiunea foii și adaosul dau numărul de plăci OSB întregi sau scânduri pentru perete ori acoperiș.",
      faq: [
        ["Câte plăci OSB intră la 1 m² de placare?",
         "Calculatorul împarte suprafața mărită cu adaosul la aria unei foi și rotunjește în sus la plăci întregi."],
        ["Rezultatul include un plan de croire?",
         "Nu, este numărul de foi întregi, fără plan de tăiere. Pentru a ști cum le tai, folosește calculatorul de croire plăci 2D."],
      ],
    },
    hr: {
      title: "Kalkulator oplate OSB: koliko ploča",
      desc: "Površina za pokrivanje, dimenzija ploče i otpad daju broj cijelih OSB ploča ili dasaka za oplatu zida ili krova.",
      faq: [
        ["Koliko OSB ploča ide na m² oplate?",
         "Kalkulator dijeli površinu uvećanu za otpad površinom jedne ploče i zaokružuje naviše na cijele ploče."],
        ["Sadrži li rezultat plan rezanja?",
         "Ne, to je broj cijelih ploča bez plana rezanja. Kako ih rezati, kaže kalkulator rezanja ploča 2D."],
      ],
    },
    sr: {
      title: "Kalkulator oplate OSB: koliko ploča",
      desc: "Površina za pokrivanje, dimenzija ploče i otpad daju broj celih OSB ploča ili dasaka za oplatu zida ili krova.",
      faq: [
        ["Koliko OSB ploča ide na m² oplate?",
         "Kalkulator deli površinu uvećanu za otpad površinom jedne ploče i zaokružuje naviše na cele ploče."],
        ["Da li rezultat sadrži plan sečenja?",
         "Ne, to je broj celih ploča bez plana sečenja. Kako ih seći, kaže kalkulator sečenja ploča 2D."],
      ],
    },
    ru: {
      title: "Калькулятор обшивки OSB: сколько листов",
      desc: "Площадь покрытия, размер листа и запас дают количество целых плит OSB или досок на обшивку стены либо крыши.",
      faq: [
        ["Сколько плит OSB на м² обшивки?",
         "Калькулятор делит площадь вместе с запасом на площадь одного листа и округляет вверх до целых плит."],
        ["Есть ли в результате план раскроя?",
         "Нет, это количество целых листов без плана резки. Чтобы узнать, как их резать, воспользуйтесь калькулятором раскроя плит 2D."],
      ],
    },
  },
};
