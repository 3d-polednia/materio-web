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
    it: {
      title: "Calcolatore pittura: confezioni al m²",
      desc: "Superficie, resa dell'etichetta e numero di mani danno le confezioni intere di pittura, intonaco o primer e lo scarto in percentuale.",
      faq: [
        ["Quanta pittura serve al m²?",
         "Quella che dice la resa in etichetta, di solito in m² per litro o per confezione. Il calcolatore divide la superficie per quella resa, moltiplica per le mani e arrotonda a confezioni intere."],
        ["Si sottraggono finestre e porte?",
         "Solo se non le dipingi. La superficie delle aperture si inserisce a parte e viene tolta prima della conversione in confezioni."],
      ],
    },
    nl: {
      title: "Verf berekenen: hoeveel blikken per m²",
      desc: "Oppervlak, het rendement van het etiket en het aantal lagen geven hele verpakkingen verf, pleister of primer, plus het afval in procenten.",
      faq: [
        ["Hoeveel verf heb je per m² nodig?",
         "Zoveel als het rendement op het etiket zegt, meestal in m² per liter of per verpakking. De rekenmachine deelt het oppervlak door dat rendement, vermenigvuldigt met de lagen en rondt af naar hele verpakkingen."],
        ["Trek je ramen en deuren eraf?",
         "Alleen als je ze echt niet schildert. Het oppervlak van de openingen vul je apart in en gaat er af voordat het in verpakkingen wordt omgerekend."],
      ],
    },
    es: {
      title: "Calculadora de pintura: botes por m²",
      desc: "Superficie, el rendimiento de la etiqueta y el número de manos dan los envases enteros de pintura, revoco o imprimación y la merma en porcentaje.",
      faq: [
        ["¿Cuánta pintura hace falta por m²?",
         "La que diga el rendimiento de la etiqueta, normalmente en m² por litro o por envase. La calculadora divide la superficie por ese rendimiento, multiplica por las manos y redondea a envases enteros."],
        ["¿Se descuentan ventanas y puertas?",
         "Solo si de verdad no las pintas. La superficie de los huecos se escribe aparte y se quita antes de pasar a envases."],
      ],
    },
    fr: {
      title: "Calculateur peinture : pots par m²",
      desc: "La surface, le rendement de l'étiquette et le nombre de couches donnent les emballages entiers de peinture, d'enduit ou de primaire, plus les chutes.",
      faq: [
        ["Combien de peinture faut-il par m² ?",
         "Autant que l'indique le rendement de l'étiquette, en général en m² par litre ou par emballage. Le calculateur divise la surface par ce rendement, multiplie par les couches et arrondit à des emballages entiers."],
        ["Faut-il déduire les fenêtres et les portes ?",
         "Seulement si tu ne les peins pas. La surface des ouvertures se saisit à part et se retire avant la conversion en emballages."],
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
    it: {
      title: "Calcolatore piastrelle: quante scatole",
      desc: "Superficie più una scorta convertite in scatole intere di piastrelle, pannelli o gres, con i metri quadri che l'acquisto ti dà.",
      faq: [
        ["Quante piastrelle servono per 10 m²?",
         "Aggiungi la scorta alla superficie e dividi per la resa di una scatola. Il calcolatore arrotonda alla scatola intera e mostra a quanti metri quadri arriva l'acquisto."],
        ["Quanta scorta prevedere per le piastrelle?",
         "Il 5–7% per una posa dritta, il 10–15% per il grande formato, la diagonale o la posa a correre. Il calcolatore somma quella percentuale prima di convertire in scatole."],
      ],
    },
    nl: {
      title: "Tegels berekenen: hoeveel dozen",
      desc: "Oppervlak plus een marge omgerekend naar hele dozen tegels, panelen of keramiek, met de vierkante meters die de aankoop je geeft.",
      faq: [
        ["Hoeveel tegels heb je nodig voor 10 m²?",
         "Tel de marge bij het oppervlak op en deel door het rendement van één doos. De rekenmachine rondt af naar een hele doos en toont op hoeveel vierkante meter de aankoop uitkomt."],
        ["Hoeveel marge reken je voor tegels?",
         "5–7% bij recht leggen, 10–15% bij groot formaat, diagonaal of halfsteens. De rekenmachine telt dat percentage bij het oppervlak op voordat ze het naar hele dozen omzet."],
      ],
    },
    es: {
      title: "Calculadora de azulejos: cuántas cajas",
      desc: "Superficie más una merma convertidas en cajas enteras de azulejos, tarima o porcelánico, con los metros cuadrados que da la compra.",
      faq: [
        ["¿Cuántos azulejos hacen falta para 10 m²?",
         "Suma la merma a la superficie y divide por el rendimiento de una caja. La calculadora redondea a caja entera y muestra a cuántos metros cuadrados llega la compra."],
        ["¿Cuánta merma dejar en el alicatado?",
         "Un 5–7% en colocación recta, un 10–15% en gran formato, diagonal o a matajunta. La calculadora suma ese porcentaje antes de pasar a cajas."],
      ],
    },
    fr: {
      title: "Calculateur carrelage : combien de cartons",
      desc: "La surface plus une marge convertie en cartons entiers de carrelage, de lames ou de grès, avec les mètres carrés que donne l'achat.",
      faq: [
        ["Combien de carrelage faut-il pour 10 m² ?",
         "Ajoute la marge à la surface et divise par le rendement d'un carton. Le calculateur arrondit au carton entier et montre à combien de mètres carrés revient l'achat."],
        ["Quelle marge prévoir pour le carrelage ?",
         "5–7 % en pose droite, 10–15 % en grand format, en diagonale ou à coupe de pierre. Le calculateur ajoute ce pourcentage à la surface avant de la convertir en cartons."],
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
    it: {
      title: "Calcolatore carta da parati: rotoli",
      desc: "Larghezza e altezza della parete, misura del rotolo e rapporto del disegno danno il numero di rotoli e quanti teli esce da un rotolo.",
      faq: [
        ["Quanti rotoli di carta da parati per una stanza?",
         "La larghezza della parete divisa per quella del rotolo dà i teli. La lunghezza del rotolo divisa per l'altezza del telo dà i teli per rotolo, arrotondati per difetto."],
        ["Come cambia il conto il rapporto del disegno?",
         "Con una carta a disegno ogni telo viene allungato a un multiplo intero del rapporto, quindi da un rotolo escono meno teli. Scrivi 0 per una carta a tinta unita."],
      ],
    },
    nl: {
      title: "Behang berekenen: hoeveel rollen",
      desc: "Breedte en hoogte van de wand, de maat van de rol en het rapport geven het aantal rollen en hoeveel banen één rol oplevert.",
      faq: [
        ["Hoeveel rollen behang voor een kamer?",
         "De wandbreedte gedeeld door de rolbreedte geeft de banen; de rollengte gedeeld door de baanhoogte geeft de banen per rol. De rekenmachine doet beide en rondt naar boven af."],
        ["Hoe verandert het rapport het aantal?",
         "Bij behang met een patroon wordt elke baan verlengd tot een heel veelvoud van het rapport, dus levert één rol minder banen op. Een rapport van 0 betekent dat er geen patroon hoeft aan te sluiten."],
      ],
    },
    es: {
      title: "Calculadora de papel pintado: rollos",
      desc: "Ancho y alto de la pared, tamaño del rollo y rapport del dibujo dan el número de rollos y cuántas tiras salen de un rollo.",
      faq: [
        ["¿Cuántos rollos de papel pintado para una habitación?",
         "El ancho de la pared dividido por el del rollo da las tiras. El largo del rollo dividido por el alto de la tira da las tiras por rollo, redondeadas a la baja."],
        ["¿Cómo cambia el conteo el rapport?",
         "Con un papel estampado cada tira se alarga hasta un múltiplo entero del rapport, así que un rollo da menos tiras. Un rapport de 0 significa que no hay dibujo que casar."],
      ],
    },
    fr: {
      title: "Calculateur papier peint : rouleaux",
      desc: "Largeur et hauteur du mur, format du rouleau et raccord donnent le nombre de rouleaux et le nombre de lés qu'un rouleau fournit.",
      faq: [
        ["Combien de rouleaux de papier peint pour une pièce ?",
         "La largeur du mur divisée par celle du rouleau donne les lés. La longueur du rouleau divisée par la hauteur du lé donne les lés par rouleau, arrondis au inférieur."],
        ["Comment le raccord change-t-il le compte ?",
         "Avec un papier à motif, chaque lé est rallongé jusqu'à un multiple entier du raccord : un rouleau donne donc moins de lés. Un raccord de 0 signifie qu'il n'y a pas de motif à faire coïncider."],
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
    it: {
      title: "Calcolatore taglio 1D: quante barre",
      desc: "Un elenco di pezzi, la lunghezza della barra e lo spessore di taglio danno le barre da comprare. Il piano di taglio arriva con lo scarto in percentuale.",
      faq: [
        ["Quante barre servono per un elenco di pezzi?",
         "Il calcolatore ordina i pezzi dal più lungo e mette ognuno nella prima barra in cui entra. Le barre aperte sono quelle che compri, e il piano mostra da quale barra esce ogni pezzo."],
        ["Lo spessore di taglio è compreso?",
         "Sì. Viene tolto a ogni taglio dopo il primo nella barra. Il primo pezzo parte dall'estremità della barra, quindi non costa nulla."],
      ],
    },
    nl: {
      title: "1D zagen berekenen: hoeveel stangen",
      desc: "Een lijst met stukken, de stanglengte en de zaagsnede geven het aantal stangen dat je koopt. Het zaagplan komt met het afval in procenten.",
      faq: [
        ["Hoeveel stangen heb je nodig voor een stuklijst?",
         "De rekenmachine sorteert de stukken van lang naar kort en legt elk stuk in de eerste stang waar het in past. De geopende stangen zijn wat je koopt, en het plan toont welk stuk uit welke stang komt."],
        ["Zit de zaagsnede erbij?",
         "Ja. De zaagsnede gaat er bij elke snede na de eerste in een stang af. Het eerste stuk begint aan het uiteinde van de stang en kost er dus geen."],
      ],
    },
    es: {
      title: "Calculadora de corte 1D: cuántas barras",
      desc: "Una lista de piezas, el largo de la barra y el grosor de corte dan las barras que comprar. El plan de corte viene con la merma en porcentaje.",
      faq: [
        ["¿Cuántas barras hacen falta para una lista de piezas?",
         "La calculadora ordena las piezas de la más larga a la más corta y mete cada una en la primera barra donde entra. Las barras abiertas son las que compras, y el plan indica de qué barra sale cada pieza."],
        ["¿Está incluido el grosor de corte?",
         "Sí. Se resta en cada corte después del primero de la barra. La primera pieza empieza en el extremo de la barra, así que no cuesta ninguno."],
      ],
    },
    fr: {
      title: "Calculateur découpe 1D : combien de barres",
      desc: "Une liste de pièces, la longueur de la barre et le trait de scie donnent les barres à acheter. Le plan de coupe vient avec les chutes en pourcentage.",
      faq: [
        ["Combien de barres faut-il pour une liste de pièces ?",
         "Le calculateur trie les pièces de la plus longue à la plus courte et place chacune dans la première barre où elle entre. Les barres ouvertes sont celles que tu achètes, et le plan indique de quelle barre sort chaque pièce."],
        ["Le trait de scie est-il compris ?",
         "Oui. Il est retiré à chaque coupe après la première dans une barre. La première pièce part de l'extrémité de la barre et n'en coûte donc aucun."],
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
    it: {
      title: "Calcolatore taglio pannelli: lastre",
      desc: "Pezzi, formato della lastra e spessore di taglio danno il numero di lastre e un piano di taglio a ghigliottina, con o senza rotazione.",
      faq: [
        ["Quante lastre occuperanno i miei pezzi?",
         "Il calcolatore dispone i pezzi dal più grande nel rettangolo libero con il resto più piccolo. Quando nulla entra più, apre un'altra lastra, ed è quella che compri."],
        ["Quando conviene disattivare la rotazione?",
         "Quando la lastra ha una venatura o un disegno direzionale. Un pezzo ruotato correrebbe nel verso sbagliato anche se la misura torna."],
      ],
    },
    nl: {
      title: "Platen zagen berekenen: hoeveel platen",
      desc: "Stukken, het plaatformaat en de zaagsnede geven het aantal platen en een guillotinezaagplan, met of zonder draaien van de stukken.",
      faq: [
        ["Hoeveel platen nemen mijn stukken in beslag?",
         "De rekenmachine legt de stukken van groot naar klein in de vrije rechthoek met de kleinste rest. Als er niets meer in past, opent ze een volgende plaat, en dat is wat je koopt."],
        ["Wanneer zet je het draaien uit?",
         "Als de plaat een nerf of een gericht patroon heeft. Een gedraaid stuk zou dan zichtbaar de verkeerde kant op lopen ook al klopt de maat."],
      ],
    },
    es: {
      title: "Calculadora de corte 2D: cuántas planchas",
      desc: "Piezas, formato del tablero y grosor de corte dan el número de planchas y un plan de corte a guillotina, con o sin giro.",
      faq: [
        ["¿Cuántas planchas ocuparán mis piezas?",
         "La calculadora coloca las piezas de mayor a menor en el rectángulo libre con el resto más pequeño. Cuando ya no entra nada, abre otra plancha, y eso es lo que compras."],
        ["¿Cuándo conviene desactivar el giro?",
         "Cuando el tablero tiene veta o un dibujo direccional. Una pieza girada iría en el sentido equivocado aunque la medida encaje."],
      ],
    },
    fr: {
      title: "Calculateur découpe 2D : combien de panneaux",
      desc: "Pièces, format du panneau et trait de scie donnent le nombre de panneaux et un plan de coupe à la guillotine, avec ou sans rotation.",
      faq: [
        ["Combien de panneaux mes pièces vont-elles prendre ?",
         "Le calculateur place les pièces de la plus grande à la plus petite dans le rectangle libre au plus petit reste. Quand plus rien n'entre, il ouvre un autre panneau, et c'est celui que tu achètes."],
        ["Quand faut-il désactiver la rotation ?",
         "Quand le panneau a un fil ou un motif orienté. Une pièce tournée irait alors visiblement dans le mauvais sens même si la cote convient."],
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
    it: {
      title: "Calcolatore calcestruzzo: sacchi al m³",
      desc: "Volume e resa di un sacco danno il numero di sacchi di premiscelato e circa quanta acqua serve per impastarli.",
      faq: [
        ["Quanti sacchi di calcestruzzo fanno 1 m³?",
         "Un metro cubo sono 1000 litri di calcestruzzo impastato. Dividi quei litri per la resa scritta sul sacco; il calcolatore arrotonda per eccesso a sacchi interi."],
        ["Quanti litri rende un sacco?",
         "La conversione presuppone un sacco da 25 kg con una resa di circa 12,5 l. Controlla la resa del tuo sacco, cambia da un produttore all'altro, e inseriscila nel modulo."],
      ],
    },
    nl: {
      title: "Beton berekenen: hoeveel zakken per m³",
      desc: "Volume en het rendement van één zak geven het aantal zakken droge mix en ongeveer hoeveel water er nodig is om ze aan te maken.",
      faq: [
        ["Hoeveel zakken beton maken 1 m³?",
         "Een kubieke meter is 1000 liter aangemaakt beton. Deel die liters door het rendement op de zak; de rekenmachine rondt het resultaat af naar hele zakken."],
        ["Hoeveel liter geeft één zak?",
         "De omrekening gaat uit van een zak van 25 kg met een rendement van ongeveer 12,5 l. Controleer het rendement van je eigen zak, dat verschilt per fabrikant, en vul het in."],
      ],
    },
    es: {
      title: "Calculadora de hormigón: sacos por m³",
      desc: "Volumen y el rendimiento de un saco dan el número de sacos de mezcla seca y aproximadamente cuánta agua hace falta para amasarlos.",
      faq: [
        ["¿Cuántos sacos de hormigón hacen 1 m³?",
         "Un metro cúbico son 1000 litros de hormigón amasado. Divide esos litros por el rendimiento impreso en el saco; la calculadora redondea hacia arriba a sacos enteros."],
        ["¿Cuántos litros da un saco?",
         "La conversión supone un saco de 25 kg con un rendimiento de unos 12,5 l. Comprueba el rendimiento de tu saco, cambia según el fabricante, y escríbelo en el formulario."],
      ],
    },
    fr: {
      title: "Calculateur béton : sacs par m³",
      desc: "Le volume et le rendement d'un sac donnent le nombre de sacs de mélange sec et à peu près l'eau qu'il faut pour les gâcher.",
      faq: [
        ["Combien de sacs de béton font 1 m³ ?",
         "Un mètre cube, c'est 1000 litres de béton gâché. Divise ces litres par le rendement imprimé sur le sac ; le calculateur arrondit au sac entier supérieur."],
        ["Combien de litres donne un sac ?",
         "La conversion suppose un sac de 25 kg donnant environ 12,5 l. Vérifie le rendement de ton propre sac, il change selon le fabricant, et saisis-le dans le formulaire."],
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
    it: {
      title: "Calcolatore colla per piastrelle: sacchi",
      desc: "Superficie e consumo in kg/m² della scheda tecnica danno il numero di sacchi interi di colla o di malta da comprare.",
      faq: [
        ["Quanta colla richiede 1 m² di piastrelle?",
         "Il consumo dipende dalla dentatura della spatola e dalla planarità del fondo, ed è scritto sulla scheda tecnica. Il calcolatore lo moltiplica per la superficie e divide per il peso del sacco."],
        ["Perché va più colla di quanto dice la scheda?",
         "La cifra della scheda presuppone un fondo piano. Su una parete storta il consumo può crescere della metà, quindi inserisci un valore più alto quando la parete è fuori squadro."],
      ],
    },
    nl: {
      title: "Tegellijm berekenen: hoeveel zakken",
      desc: "Oppervlak en het verbruik in kg/m² van het technische blad geven het aantal hele zakken lijm of mortel dat je koopt.",
      faq: [
        ["Hoeveel lijm vraagt 1 m² tegels?",
         "Het verbruik hangt af van de lijmkam en van hoe vlak de ondergrond is, en staat op het technische blad. De rekenmachine vermenigvuldigt het met het oppervlak en deelt door het zakgewicht."],
        ["Waarom gaat er meer lijm in dan het blad zegt?",
         "Het getal op het blad gaat uit van een vlakke ondergrond. Op een bolle wand kan het verbruik de helft hoger liggen, dus vul een hogere waarde in als de wand niet vlak is."],
      ],
    },
    es: {
      title: "Calculadora de adhesivo: cuántos sacos",
      desc: "Superficie y el consumo en kg/m² de la ficha técnica dan el número de sacos enteros de adhesivo o mortero que comprar.",
      faq: [
        ["¿Cuánto adhesivo lleva 1 m² de azulejo?",
         "El consumo depende del dentado de la llana y de lo plano que esté el soporte, y viene en la ficha técnica. La calculadora lo multiplica por la superficie y divide por el peso del saco."],
        ["¿Por qué gasto más adhesivo del que dice la ficha?",
         "La cifra de la ficha supone un soporte plano. En una pared alabeada el consumo puede subir la mitad, así que escribe un valor mayor cuando la pared no esté a plomo."],
      ],
    },
    fr: {
      title: "Calculateur colle carrelage : sacs",
      desc: "La surface et la consommation en kg/m² de la fiche technique donnent le nombre de sacs entiers de colle ou de mortier à acheter.",
      faq: [
        ["Combien de colle prend 1 m² de carrelage ?",
         "La consommation dépend du peigne et de la planéité du support, et elle est indiquée sur la fiche technique. Le calculateur la multiplie par la surface et divise par le poids du sac."],
        ["Pourquoi la colle part-elle plus vite que ne le dit la fiche ?",
         "Le chiffre de la fiche suppose un support plan. Sur un mur voilé la consommation peut monter de moitié : saisis une valeur plus élevée quand le mur n'est pas droit."],
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
    it: {
      title: "Calcolatore massetto: sacchi al m²",
      desc: "Superficie, spessore dello strato e consumo in kg per m² e mm danno il numero di sacchi di massetto, autolivellante o intonaco.",
      faq: [
        ["Quanti sacchi di massetto al m²?",
         "Il consumo è dato in chilogrammi per metro quadro e millimetro di spessore. Il calcolatore lo moltiplica per la superficie e per lo spessore e divide il totale per il peso del sacco."],
        ["Quale valore di consumo inserire?",
         "La conversione presuppone circa 2,0 kg per litro di malta. I massetti anidritici e quelli alleggeriti hanno un'altra densità, quindi controlla il valore sul sacco."],
      ],
    },
    nl: {
      title: "Dekvloer berekenen: hoeveel zakken per m²",
      desc: "Oppervlak, laagdikte en het verbruik in kg per m² en mm geven het aantal zakken dekvloer, egaline of pleister.",
      faq: [
        ["Hoeveel zakken dekvloer per m²?",
         "Het verbruik wordt gegeven in kilogram per vierkante meter en per millimeter dikte. De rekenmachine vermenigvuldigt het met het oppervlak en de dikte en deelt het totaal door het zakgewicht."],
        ["Welk verbruik vul je in?",
         "De omrekening gaat uit van ongeveer 2,0 kg per liter mortel. Anhydrietvloeren en lichte dekvloeren hebben een andere dichtheid, dus controleer de waarde op de zak."],
      ],
    },
    es: {
      title: "Calculadora de solera: sacos por m²",
      desc: "Superficie, espesor de la capa y el consumo en kg por m² y mm dan el número de sacos de solera, autonivelante o revoco.",
      faq: [
        ["¿Cuántos sacos de solera por m²?",
         "El consumo se da en kilogramos por metro cuadrado y milímetro de espesor. La calculadora lo multiplica por la superficie y el espesor y divide el total por el peso del saco."],
        ["¿Qué consumo hay que escribir?",
         "La conversión supone unos 2,0 kg por litro de mortero. Las soleras de anhidrita y las aligeradas tienen otra densidad, así que comprueba el valor en el saco."],
      ],
    },
    fr: {
      title: "Calculateur chape : sacs par m²",
      desc: "Surface, épaisseur de la couche et consommation en kg par m² et mm donnent le nombre de sacs de chape, de ragréage ou d'enduit.",
      faq: [
        ["Combien de sacs de chape par m² ?",
         "La consommation est donnée en kilogrammes par mètre carré et par millimètre d'épaisseur. Le calculateur la multiplie par la surface et l'épaisseur et divise le total par le poids du sac."],
        ["Quelle consommation faut-il saisir ?",
         "La conversion suppose environ 2,0 kg par litre de mortier. Les chapes anhydrite et les chapes allégées ont une autre densité : vérifie la valeur sur le sac."],
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
    it: {
      title: "Calcolatore stucco: quanti kg per le fughe",
      desc: "Misura della piastrella, larghezza della fuga e superficie danno il consumo di stucco in chilogrammi e i sacchi da comprare.",
      faq: [
        ["Quanto stucco richiede 1 m² di piastrelle?",
         "Il consumo cresce con la larghezza della fuga e lo spessore della piastrella e cala con il formato. Un grande gres con fuga stretta ne richiede pochissimo; un mosaico molto."],
        ["Quali misure della piastrella si inseriscono?",
         "Lunghezza, larghezza e spessore di una piastrella, più la larghezza della fuga. Questi quattro numeri danno il volume delle fughe in un metro quadro, e da lì i chilogrammi."],
      ],
    },
    nl: {
      title: "Voegmiddel berekenen: hoeveel kg",
      desc: "Tegelmaat, voegbreedte en oppervlak geven het voegverbruik in kilogram en het aantal zakken dat je koopt.",
      faq: [
        ["Hoeveel voegmiddel vraagt 1 m² tegels?",
         "Het verbruik stijgt met de voegbreedte en de tegeldikte en daalt met het formaat. Grote keramiek met een smalle voeg vraagt heel weinig; mozaïek vraagt veel."],
        ["Welke tegelmaten vul je in?",
         "De lengte, de breedte en de dikte van één tegel, plus de voegbreedte. Die vier getallen geven het volume van de voegen in een vierkante meter, en daaruit de kilo's."],
      ],
    },
    es: {
      title: "Calculadora de lechada: cuántos kg",
      desc: "Tamaño del azulejo, ancho de la junta y superficie dan el consumo de lechada en kilogramos y el número de sacos que comprar.",
      faq: [
        ["¿Cuánta lechada lleva 1 m² de azulejo?",
         "El consumo sube con el ancho de la junta y el grosor del azulejo y baja con el formato. Un porcelánico grande con junta estrecha gasta muy poco; el mosaico gasta mucho."],
        ["¿Qué medidas del azulejo se escriben?",
         "El largo, el ancho y el grosor de un azulejo, más el ancho de la junta. Esos cuatro números dan el volumen de las juntas de un metro cuadrado, y de ahí los kilos."],
      ],
    },
    fr: {
      title: "Calculateur joint carrelage : combien de kg",
      desc: "Le format du carreau, la largeur du joint et la surface donnent la consommation de joint en kilogrammes et le nombre de sacs à acheter.",
      faq: [
        ["Combien de joint prend 1 m² de carrelage ?",
         "La consommation monte avec la largeur du joint et l'épaisseur du carreau et baisse avec le format. Un grand grès à joint fin en prend très peu ; une mosaïque en prend beaucoup."],
        ["Quelles dimensions du carreau faut-il saisir ?",
         "La longueur, la largeur et l'épaisseur d'un carreau, plus la largeur du joint. Ces quatre nombres donnent le volume des joints d'un mètre carré, et de là les kilogrammes."],
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
    it: {
      title: "Calcolatore muratura: blocchi e malta",
      desc: "Superficie della parete meno le aperture, pezzi al m² e una scorta danno il numero di blocchi o mattoni e i chilogrammi di malta.",
      faq: [
        ["Quanti blocchi richiede 1 m² di parete?",
         "I pezzi al m² derivano dalla misura del blocco compresa la fuga. Inserisci quel valore e il calcolatore lo moltiplica per la superficie una volta tolte finestre e porte."],
        ["Quanta scorta prevedere per la muratura?",
         "Il 5% copre i tagli e le rotture in trasporto. Con molti pezzi tagliati, angoli o pilastrini stretti vale la pena alzare quel valore."],
      ],
    },
    nl: {
      title: "Metselwerk berekenen: blokken en mortel",
      desc: "Wandoppervlak min de openingen, het aantal stuks per m² en een marge geven het aantal blokken of stenen en de kilo's mortel.",
      faq: [
        ["Hoeveel blokken vraagt 1 m² muur?",
         "Het aantal stuks per m² volgt uit de maat van het blok inclusief de voeg. Vul dat getal in en de rekenmachine vermenigvuldigt het met het oppervlak zodra ramen en deuren eraf zijn."],
        ["Hoeveel marge reken je bij metselwerk?",
         "5% dekt het snijden en de breuk tijdens transport. Bij veel gesneden stukken, hoeken of smalle penanten is het de moeite dat getal te verhogen."],
      ],
    },
    es: {
      title: "Calculadora de albañilería: bloques",
      desc: "Superficie del muro menos los huecos, las piezas por m² y una merma dan el número de bloques o ladrillos y los kilos de mortero.",
      faq: [
        ["¿Cuántos bloques lleva 1 m² de muro?",
         "Las piezas por m² salen del tamaño del bloque con su junta. Escribe esa cifra y la calculadora la multiplica por la superficie una vez descontadas ventanas y puertas."],
        ["¿Cuánta merma dejar al levantar bloques?",
         "Un 5% cubre los cortes y las roturas en el transporte. Con muchas piezas cortadas, esquinas o pilastras estrechas conviene subir esa cifra."],
      ],
    },
    fr: {
      title: "Calculateur maçonnerie : blocs et mortier",
      desc: "Surface du mur moins les ouvertures, pièces au m² et une marge donnent le nombre de blocs ou de briques et les kilos de mortier.",
      faq: [
        ["Combien de blocs prend 1 m² de mur ?",
         "Compte les pièces au m² à partir de la taille du bloc et de son joint. Saisis ce chiffre et le calculateur le multiplie par la surface, ouvertures déduites."],
        ["Quelle marge prévoir en maçonnerie ?",
         "5 % couvre les coupes et la casse au transport. Avec beaucoup de pièces coupées, des angles ou des trumeaux étroits, il vaut la peine de relever ce chiffre."],
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
    it: {
      title: "Calcolatore ETICS: polistirene e tasselli",
      desc: "La superficie della facciata dà lastre di isolante, tasselli, chilogrammi di colla e metri di rete per un sistema a cappotto.",
      faq: [
        ["Quanti tasselli al m² di cappotto?",
         "Sei al m² è il valore tipico per il piano terra e il primo piano. Il numero dipende dall'altezza dell'edificio e dalla zona di vento, quindi inseriscine di più per pareti alte."],
        ["Quanta rete richiede il cappotto?",
         "La rete si conta con una sovrapposizione del 10%, perché i teli vicini devono accavallarsi. Il calcolatore aggiunge quella sovrapposizione alla superficie della facciata."],
      ],
    },
    nl: {
      title: "ETICS berekenen: EPS-platen en pluggen",
      desc: "Het geveloppervlak geeft isolatieplaten, pluggen, kilo's lijm en meters gaas voor een systeem van gevelisolatie.",
      faq: [
        ["Hoeveel pluggen per m² isolatie?",
         "Zes per m² is gebruikelijk voor een begane grond en een eerste verdieping. Het aantal hangt af van de hoogte van het gebouw en de windzone, dus vul er meer in voor hoge wanden."],
        ["Hoeveel gaas vraagt de isolatie?",
         "Gaas wordt geteld met 10% overlap, omdat naburige banen over elkaar heen moeten liggen. De rekenmachine telt die overlap bij het geveloppervlak op."],
      ],
    },
    es: {
      title: "Calculadora SATE: poliestireno y tacos",
      desc: "La superficie de fachada da planchas de aislante, tacos, kilos de adhesivo y metros de malla para un sistema de aislamiento por el exterior.",
      faq: [
        ["¿Cuántos tacos por m² de aislamiento?",
         "Seis por m² es lo típico en planta baja y primera. El número depende de la altura del edificio y de la zona de viento, así que escribe más para paredes altas."],
        ["¿Cuánta malla lleva el aislamiento?",
         "La malla se cuenta con un 10% de solape, porque las bandas vecinas tienen que montar una sobre otra. La calculadora suma ese solape a la superficie de fachada."],
      ],
    },
    fr: {
      title: "Calculateur ITE : polystyrène et chevilles",
      desc: "La surface de façade donne les panneaux isolants, les chevilles, les kilos de colle et les mètres de treillis pour un système d'isolation extérieure.",
      faq: [
        ["Combien de chevilles au m² d'isolation ?",
         "Six au m² est courant pour un rez-de-chaussée et un premier étage. Le nombre dépend de la hauteur du bâtiment et de la zone de vent : saisis-en plus pour des murs hauts."],
        ["Combien de treillis faut-il pour l'isolation ?",
         "Le treillis se compte avec 10 % de recouvrement, parce que les lés voisins doivent se chevaucher. Le calculateur ajoute ce recouvrement à la surface de façade."],
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
    it: {
      title: "Calcolatore parete GK: profili e lastre",
      desc: "Larghezza, altezza e interasse dei montanti danno i profili CW e UW, le lastre di cartongesso e i tasselli per una parete divisoria.",
      faq: [
        ["Quanti profili richiede una parete divisoria?",
         "I montanti CW stanno all'interasse che scegli e le guide UW corrono sopra e sotto. Il calcolatore converte entrambi in profili interi della lunghezza che inserisci."],
        ["Quale interasse usare per i montanti?",
         "600 mm è lo standard sotto una lastra da 1,2 m. Scendi a 400 mm sotto un rivestimento pesante o sotto le piastrelle. Ogni faccia ha le sue lastre."],
      ],
    },
    nl: {
      title: "Gipswand berekenen: profielen en platen",
      desc: "Breedte, hoogte en hart-op-hartafstand geven de CW- en UW-profielen, de gipsplaten en de pluggen voor een scheidingswand.",
      faq: [
        ["Hoeveel profielen vraagt een scheidingswand?",
         "De CW-stijlen staan op de afstand die je kiest en de UW-profielen lopen boven en onder. De rekenmachine maakt van beide hele profielen met de lengte die je invult."],
        ["Welke hart-op-hartafstand gebruik je?",
         "600 mm is de standaard onder een plaat van 1,2 m. Ga naar 400 mm bij een zware bekleding of tegels. Platen worden voor beide zijden van de wand geteld."],
      ],
    },
    es: {
      title: "Calculadora de tabique: perfiles y placas",
      desc: "Ancho, alto y separación de montantes dan los perfiles CW y UW, las placas de yeso y los tacos para un tabique de pladur.",
      faq: [
        ["¿Cuántos perfiles lleva un tabique?",
         "Los montantes CW van a la separación que elijas y los canales UW corren arriba y abajo. La calculadora convierte ambos en perfiles enteros del largo que escribas."],
        ["¿Qué separación de montantes usar?",
         "600 mm es lo estándar bajo una placa de 1,2 m. Baja a 400 mm con un revestimiento pesado o azulejo. Las placas se cuentan para las dos caras del tabique."],
      ],
    },
    fr: {
      title: "Calculateur cloison : montants et plaques",
      desc: "La largeur, la hauteur et l'entraxe donnent les montants CW et UW, les plaques de plâtre et les chevilles pour une cloison de distribution.",
      faq: [
        ["Combien de montants prend une cloison ?",
         "Les montants CW se tiennent à l'entraxe que tu choisis et les rails UW courent en haut et en bas. Le calculateur convertit les deux en profilés entiers de la longueur saisie."],
        ["Quel entraxe faut-il utiliser ?",
         "600 mm est la norme sous une plaque de 1,2 m. Descends à 400 mm sous un habillage lourd ou du carrelage. Les plaques se comptent pour les deux faces de la cloison."],
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
    it: {
      title: "Calcolatore controsoffitto: profili",
      desc: "Misure del soffitto e interassi danno i profili CD e UD, i pendini e le lastre di cartongesso per un controsoffitto.",
      faq: [
        ["Quanti profili richiede un controsoffitto?",
         "I profili CD portanti corrono all'interasse che imposti e la guida UD gira lungo le pareti. Il calcolatore ricava entrambi dalla misura del soffitto e dà profili interi."],
        ["Quale interasse usare per i pendini?",
         "CD a 400 mm e pendini a 900 mm sono un controsoffitto tipico sotto una lastra. Con un carico maggiore gli interassi devono essere più stretti."],
      ],
    },
    nl: {
      title: "Verlaagd plafond berekenen: profielen",
      desc: "De maten van het plafond en de afstanden geven de CD- en UD-profielen, de hangers en de gipsplaten voor een verlaagd plafond.",
      faq: [
        ["Hoeveel profielen vraagt een verlaagd plafond?",
         "De dragende CD-profielen lopen op de afstand die je instelt en het UD-profiel gaat langs de wanden. De rekenmachine leidt beide af uit de plafondmaat en geeft hele profielen."],
        ["Welke afstand tussen de hangers gebruik je?",
         "CD op 400 mm en hangers op 900 mm is een gebruikelijk plafond onder plaat. Bij een zwaardere belasting moeten de afstanden kleiner zijn."],
      ],
    },
    es: {
      title: "Calculadora de techo suspendido: perfiles",
      desc: "Las medidas del techo y las separaciones dan los perfiles CD y UD, los colgadores y las placas de yeso para un techo suspendido.",
      faq: [
        ["¿Cuántos perfiles lleva un techo suspendido?",
         "Los CD portantes van a la separación que fijes y el UD rodea las paredes. La calculadora saca ambos del tamaño del techo y da perfiles enteros."],
        ["¿Qué separación de colgadores usar?",
         "CD a 400 mm y colgadores a 900 mm es un techo típico bajo una placa. Con más carga las separaciones tienen que ser menores."],
      ],
    },
    fr: {
      title: "Calculateur plafond suspendu : ossature",
      desc: "Les dimensions du plafond et les entraxes donnent les fourrures CD et UD, les suspentes et les plaques de plâtre pour un plafond suspendu.",
      faq: [
        ["Combien de profilés prend un plafond suspendu ?",
         "Les fourrures CD porteuses courent à l'entraxe que tu règles et le rail UD fait le tour des murs. Le calculateur tire les deux de la taille du plafond et donne des profilés entiers."],
        ["Quel entraxe de suspentes faut-il utiliser ?",
         "CD à 400 mm et suspentes à 900 mm, c'est un plafond courant sous une plaque. Sous une charge plus lourde, les entraxes doivent être plus serrés."],
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
    it: {
      title: "Calcolatore GK a colla: lastre e colla",
      desc: "Superficie della parete e consumo della colla danno il numero di lastre di cartongesso e i sacchi di colla per la posa a punti.",
      faq: [
        ["Quante lastre richiede 1 m² di parete?",
         "Il calcolatore divide la superficie per quella di una lastra e arrotonda a lastre intere. La colla si calcola a parte, dal consumo per metro quadro."],
        ["Quando le lastre non si possono incollare?",
         "La colla in gesso funziona solo su un fondo piano e solido. Dove la parete è molto fuori squadro serve invece una struttura metallica."],
      ],
    },
    nl: {
      title: "Gipsplaat op lijm berekenen: platen",
      desc: "Wandoppervlak en het verbruik van gipslijm geven het aantal gipsplaten en de zakken lijm voor het lijmen op koeken.",
      faq: [
        ["Hoeveel platen vraagt 1 m² muur?",
         "De rekenmachine deelt het oppervlak door het oppervlak van één plaat en rondt af naar hele platen. De lijm wordt apart bepaald, uit het verbruik per vierkante meter."],
        ["Wanneer kun je platen niet op lijm zetten?",
         "Gipslijm werkt alleen op een vlakke, stevige ondergrond. Waar de wand ver uit het lood staat is een metalen frame nodig."],
      ],
    },
    es: {
      title: "Calculadora de pladur pegado: placas",
      desc: "Superficie de la pared y el consumo del adhesivo de yeso dan el número de placas y los sacos de adhesivo para pegar por pelladas.",
      faq: [
        ["¿Cuántas placas lleva 1 m² de pared?",
         "La calculadora divide la superficie por la de una placa y redondea a placas enteras. El adhesivo se calcula aparte, a partir del consumo por metro cuadrado."],
        ["¿Cuándo no se pueden pegar las placas?",
         "El adhesivo de yeso solo funciona sobre un soporte plano y firme. Donde la pared esté muy fuera de plomo hace falta una estructura metálica."],
      ],
    },
    fr: {
      title: "Calculateur placo collé : plaques et colle",
      desc: "Surface du mur et consommation du mortier adhésif donnent le nombre de plaques de plâtre et les sacs de colle pour une pose sur plots.",
      faq: [
        ["Combien de plaques prend 1 m² de mur ?",
         "Le calculateur divise la surface par celle d'une plaque et arrondit à des plaques entières. La colle se calcule à part, à partir de la consommation au mètre carré."],
        ["Quand ne peut-on pas coller les plaques ?",
         "Le mortier adhésif ne marche que sur un support plan et sain. Là où le mur est fortement hors d'aplomb, il faut une ossature métallique."],
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
    it: {
      title: "Calcolatore OSB: quante lastre",
      desc: "La superficie, il formato della lastra e una scorta danno il numero di pannelli OSB o di tavole interi per una parete o un tetto.",
      faq: [
        ["Quante lastre OSB al m² di rivestimento?",
         "Il calcolatore divide la superficie più la scorta per la superficie di una lastra e arrotonda per eccesso a pannelli interi."],
        ["Il risultato comprende un piano di taglio?",
         "No, è il numero di lastre intere senza piano di taglio. Per vedere come tagliarle usa il calcolatore di taglio pannelli 2D."],
      ],
    },
    nl: {
      title: "OSB beplating berekenen: hoeveel platen",
      desc: "Het oppervlak, het plaatformaat en een marge geven het aantal hele OSB-platen of planken voor een wand of een dak.",
      faq: [
        ["Hoeveel OSB-platen per m² beplating?",
         "De rekenmachine deelt het oppervlak plus de marge door het oppervlak van één plaat en rondt af naar hele platen."],
        ["Zit er een zaagplan bij het resultaat?",
         "Nee, het is het aantal hele platen zonder zaagplan. Wil je zien hoe je ze zaagt, gebruik dan de rekenmachine voor 2D-zagen."],
      ],
    },
    es: {
      title: "Calculadora de OSB: cuántas planchas",
      desc: "Superficie, formato de la plancha y una merma dan el número de planchas de OSB o tablas enteras para una pared o una cubierta.",
      faq: [
        ["¿Cuántas planchas de OSB por m² de entablado?",
         "La calculadora divide la superficie más la merma por la superficie de una plancha y redondea hacia arriba a planchas enteras."],
        ["¿El resultado incluye un plan de corte?",
         "No, es el número de planchas enteras sin plan de corte. Para ver cómo cortarlas, usa la calculadora de corte de tableros 2D."],
      ],
    },
    fr: {
      title: "Calculateur OSB : combien de panneaux",
      desc: "La surface, le format du panneau et une marge donnent le nombre de panneaux OSB ou de planches entiers pour un mur ou une toiture.",
      faq: [
        ["Combien de panneaux OSB au m² de voligeage ?",
         "Le calculateur divise la surface plus la marge par la surface d'un panneau et arrondit au panneau entier supérieur."],
        ["Le résultat contient-il un plan de coupe ?",
         "Non, c'est le nombre de panneaux entiers sans plan de coupe. Pour voir comment les couper, utilise le calculateur de découpe de panneaux 2D."],
      ],
    },
  },
};
