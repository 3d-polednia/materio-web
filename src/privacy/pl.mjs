import { ENTITY } from "../site.mjs";

export default {
  lang: "pl",
  title: "Polityka prywatności",
  updated: "2026-10-06",
  binding: false,
  translationNote: "To tłumaczenie. Wiążąca jest wersja niemiecka.",
  sections: [
    {
      id: "podejscie",
      h: "1. Podejście do prywatności",
      html: `<p>Niniejsza polityka opisuje, jakie dane przetwarza aplikacja mobilna <b>LiczMat, kalkulator materiałów budowlanych</b> („Aplikacja”) oraz strona <b>liczmat.com</b> („Strona”), i w jakim celu. Administratorem danych jest <b>${ENTITY.name}</b>, ${ENTITY.address} („my”), kontakt: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat działa <b>offline-first</b>. Wszystkie obliczenia wykonuje Twoje urządzenie i działają bez internetu. Źródłem prawdy jest baza na urządzeniu. Chmura jest tylko jej kopią.</p><p><b>Konto jest opcjonalne.</b> Liczenie nigdy nie wymaga logowania. Dopóki nie założysz konta, nie wysyłamy Twoich projektów ani wyliczeń na żaden serwer, a kopia zapasowa to plik, który sam eksportujesz i przechowujesz. Jeżeli zdecydujesz się założyć konto, opisane niżej dane trafiają do usługi <b>Google Firebase</b>. Szczegóły w sekcji 3.</p><p>Aplikacja korzysta też z innych usług firmy <b>Google</b> (reklamy oraz mapy/wyszukiwarka sklepów), które przetwarzają pewne dane. Opisujemy to poniżej.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Dane przechowywane na urządzeniu",
      html: `<p>Lokalnie, na Twoim urządzeniu, zapisujemy: projekty, wyliczenia, listy zakupów, pomieszczenia, własne materiały oraz ustawienia (np. język, waluta, motyw, dane wykonawcy). Odinstalowanie Aplikacji lub wyczyszczenie jej danych trwale usuwa te informacje z urządzenia. Backup (eksport do pliku) tworzysz i przechowujesz samodzielnie.</p><p><b>Katalog materiałów, własne materiały i ceny oraz ustawienia nie są synchronizowane</b>. Zostają wyłącznie na urządzeniu, także wtedy, gdy masz konto.</p>`
    },
    {
      id: "konto",
      h: "3. Konto LiczMat i synchronizacja (opcjonalne)",
      html: `<p>Możesz założyć <b>konto LiczMat</b>, żeby mieć te same projekty na telefonie i w przeglądarce (<a href="/app/">liczmat.com/app/</a>). Konto jest darmowe i całkowicie dobrowolne. Bez niego Aplikacja i Strona działają jak dotąd.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Jakie dane przetwarzamy, gdy masz konto",
      html: `<ul><li><b>Adres e-mail i hasło</b>. Obsługiwane przez <b>Firebase Authentication</b>. Hasła nie widzimy i nie przechowujemy, przechowuje je Google w formie skrótu (hash). Okno logowania Google oraz strony otwierane z linków w e-mailach dotyczących konta (np. reset hasła, potwierdzenie e-maila) są serwowane z <b>auth.liczmat.com</b>, czyli z usługi Firebase Hosting (Google) w ramach tego samego projektu.</li><li><b>Logowanie przez Google</b> (opcjonalna alternatywa dla hasła). Wtedy hasła nie ma w ogóle, a od Google otrzymujemy adres e-mail, nazwę wyświetlaną i identyfikator konta, żeby powiązać je z Twoimi danymi w LiczMat (nazwa wyświetlana jest używana w e-mailu powitalnym). Nie pobieramy żadnych innych danych z Twojego konta Google.</li><li><b>Identyfikator konta (UID)</b> nadany przez Firebase.</li><li><b>Treść konta:</b> projekty, pomieszczenia, wyceny i listy zakupów. Nazwy, ilości, jednostki, ceny, waluta, dane wejściowe kalkulatora oraz znaczniki czasu utworzenia i zmiany.</li><li><b>Techniczne:</b> data założenia konta, data ostatniego użycia i informacja, czy łączysz się z Aplikacji, czy ze Strony.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Gdzie leżą dane",
      html: `<p>Baza danych <b>Google Cloud Firestore</b> oraz usługi <b>Cloud Functions</b> działają w regionie <b>europe-central2 (Warszawa)</b>, czyli na terenie Unii Europejskiej. Natomiast usługa <b>Firebase Authentication</b> (Twoje dane logowania, czyli adres e-mail, nazwa wyświetlana, skrót hasła oraz identyfikator konta Google) działa na globalnej infrastrukturze Google i jej dane mogą być przetwarzane w Stanach Zjednoczonych (patrz sekcja 8). Google występuje tu jako podmiot przetwarzający dane na nasze zlecenie.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Kto ma do nich dostęp",
      html: `<p>Wyłącznie właściciel konta. Reguły bezpieczeństwa Firestore dopuszczają odczyt i zapis danych konta tylko dla zalogowanego użytkownika o tym samym identyfikatorze. Jedynym wyjątkiem jest link, który sam utworzysz. Sekcja 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Jak działa synchronizacja",
      html: `<p>Po każdej zmianie zapisanej lokalnie Aplikacja wysyła dokument do Firestore, a zmiany z chmury wprowadza z powrotem do bazy na urządzeniu. Przy konflikcie wygrywa nowszy zapis (porównanie znaczników czasu). Usunięcie rekordu nie kasuje go od razu z chmury: dokument zostaje oznaczony jako usunięty, żeby drugie urządzenie dowiedziało się o usunięciu i go nie przywróciło. Takie oznaczenia są czyszczone po <b>30 dniach</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Udostępnianie wyceny linkiem",
      html: `<p>Jeżeli klikniesz „Udostępnij”, tworzymy <b>kopię</b> wybranego projektu (nazwa, wyceny, lista zakupów, waluta) pod losowym, 128-bitowym adresem liczmat.com/p/&lt;token&gt;. Ta kopia jest <b>publicznie czytelna dla każdego, kto zna link</b>. Token w adresie jest jedynym zabezpieczeniem, więc udostępniaj go tylko osobom, które mają zobaczyć wycenę. Kopia nie odświeża się sama, aktualizujesz ją przyciskiem. Usunięcie linku odbiera dostęp natychmiast. Osoba otwierająca link nie musi zakładać konta i nie zbieramy o niej żadnych danych poza standardową analityką Strony (sekcja 6).</p>`
    },
    {
      id: "konto-calendar-link",
      h: "3.5.1. Prywatny link do kalendarza",
      html: `<p>Jeśli utworzysz prywatny link do kalendarza, każdy, kto zna ten adres, może odczytać otwarte terminy z Twojego terminarza: nazwę, datę, klienta i notatkę. Utworzenie nowego linku wyłącza stary.</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Jak długo trzymamy dane i jak je usunąć",
      html: `<p>Dane konta trzymamy tak długo, jak długo konto istnieje. Możesz w każdej chwili usunąć pojedyncze projekty i pomieszczenia, a całe konto skasujesz samodzielnie: <a href="/app/">liczmat.com/app/</a> → zakładka <b>Konto</b> → <b>Usuń konto</b>. Kasujemy wtedy wszystkie dokumenty konta w Firestore (projekty, pomieszczenia, wyceny, listy zakupów i utworzone linki do wycen), a na końcu samo konto w Firebase Authentication. Operacji nie da się cofnąć. Na tej samej zakładce pobierzesz wcześniej całą zawartość konta jako plik JSON. Jeżeli wolisz, żebyśmy zrobili to za Ciebie, napisz na <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Dane zapisane na urządzeniu albo w przeglądarce usuwasz osobno, czyszcząc dane Aplikacji lub dane witryny.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Podstawa prawna",
      html: `<p>Przetwarzanie danych konta jest niezbędne do wykonania usługi, o którą prosisz. Art. 6 ust. 1 lit. b RODO (wykonanie umowy). Założenie konta jest dobrowolne, bez niego korzystasz ze wszystkich funkcji liczących.</p>`
    },
    {
      id: "reklamy",
      h: "4. Reklamy (Google AdMob)",
      html: `<p>Aplikacja jest bezpłatna i utrzymuje się z reklam dostarczanych przez <b>Google AdMob</b>. W związku z tym Google, jako dostawca reklam, może zbierać i przetwarzać:</p><ul><li><b>identyfikator reklamowy</b> (Android Advertising ID),</li><li>adres IP oraz dane urządzenia (model, system, ustawienia języka),</li><li>przybliżoną lokalizację (na podstawie adresu IP),</li><li>informacje o interakcjach z reklamą (wyświetlenia, kliknięcia).</li></ul><p>Dane te służą do wyświetlania reklam, ograniczania ich powtarzalności, pomiaru skuteczności oraz zapobiegania nadużyciom. Zasady Google opisują: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Zasady Google dot. partnerów</a> oraz <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Polityka prywatności Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Zgoda (RODO) i reklamy spersonalizowane",
      html: `<p>Jeżeli znajdujesz się w Europejskim Obszarze Gospodarczym, Wielkiej Brytanii lub Szwajcarii, przy pierwszym uruchomieniu wyświetlamy okno zgody (Google User Messaging Platform), w którym decydujesz o reklamach spersonalizowanych. Bez Twojej zgody wyświetlane są wyłącznie reklamy <b>niespersonalizowane</b>. Zgodę możesz w każdej chwili zmienić lub wycofać, usuwając dane aplikacji w ustawieniach systemu albo resetując identyfikator reklamowy w ustawieniach Androida. Podstawą prawną spersonalizowanych reklam jest zgoda, art. 6 ust. 1 lit. a RODO, a odczytu lub zapisu informacji na urządzeniu dodatkowo § 25 ust. 1 TDDDG (niemiecka ustawa o ochronie danych w telekomunikacji i usługach cyfrowych). Reklamy niespersonalizowane: prawnie uzasadniony interes w postaci finansowania darmowej aplikacji, art. 6 ust. 1 lit. f RODO.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analityka aplikacji (Firebase / Google Analytics)",
      html: `<p>Aplikacja korzysta z <b>Google Analytics dla Firebase</b>, aby anonimowo i zbiorczo mierzyć, jak używane są jej funkcje (np. które kalkulatory otwierasz, liczba aktywnych użytkowników). Pomaga nam to ulepszać LiczMat. Analityka jest domyślnie <b>wyłączona</b> i włącza się dopiero po wyrażeniu przez Ciebie zgody w tym samym oknie (Google User Messaging Platform). Bez zgody nic nie jest zbierane. Dane są przetwarzane przez Google zgodnie z <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Polityką prywatności Google</a>. Podstawą prawną jest zgoda, art. 6 ust. 1 lit. a RODO i § 25 ust. 1 TDDDG; zgodę można w każdej chwili wycofać ze skutkiem na przyszłość.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Lokalizacja i wyszukiwarka sklepów (Google Maps / Places)",
      html: `<p>Funkcja „Znajdź sklep” korzysta z <b>Google Maps</b> i <b>Google Places</b>. Jeżeli udzielisz zgody na dostęp do lokalizacji, Aplikacja używa Twojej przybliżonej lub dokładnej lokalizacji, aby pokazać sklepy budowlane w pobliżu i wyznaczyć trasę. Zapytania do usług map są przetwarzane przez Google zgodnie z ich polityką prywatności. Możesz odmówić dostępu do lokalizacji. Wtedy sklepy nie zostaną wyszukane automatycznie, a pozostałe funkcje działają bez zmian. Lokalizacji nie zapisujemy, ani na urządzeniu, ani na koncie.</p>`
    },
    {
      id: "strona",
      h: "6. Strona internetowa",
      html: `<p>Strona <b>liczmat.com</b> jest statyczna. Podczas otwierania witryny host Firebase Hosting (Google LLC) przetwarza standardowe dane logów serwera (adres IP, czas, żądana strona, przeglądarka) w celu bezpiecznego dostarczania witryny; podstawa prawna art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes polegający na zapewnieniu bezpiecznej i niezawodnej witryny). Używa <b>Google Analytics</b> (GA4), aby anonimowo i zbiorczo mierzyć ruch (na przykład ile osób odwiedza Stronę i ile przechodzi do Google Play), dzięki czemu możemy ją ulepszać. Analityka jest domyślnie wyłączona: zgodnie z RODO najpierw prosimy o Twoją zgodę, a Google Analytics uruchamia się (i zapisuje własne pliki cookie) dopiero po jej udzieleniu. Możesz odmówić, a wszystkie pozostałe funkcje działają dalej. Podstawą prawną jest zgoda, art. 6 ust. 1 lit. a RODO i § 25 ust. 1 TDDDG; wycofanie w każdej chwili za pomocą ustawień plików cookie/zgody na stronie, ze skutkiem na przyszłość. Poza Analytics Strona nie używa czcionek z sieci. Cały pozostały kod i style są serwowane z domeny Strony, a interaktywne kalkulatory liczą wyłącznie w Twojej przeglądarce.</p><p>Wyjątkiem są miejsca integrujące zewnętrzne usługi. <b>Sklepy:</b> Strona osadza mapę <b>Google Maps</b>, która ładuje się z serwerów Google. Jeśli udostępnisz lokalizację, służy ona tylko do wyśrodkowania mapy i nie jest nigdzie zapisywana, aby pokazać listę najbliższych sklepów, Strona wysyła Twoje przybliżone współrzędne do usługi <b>OpenStreetMap (Overpass API)</b> i pobiera publiczne dane o sklepach, a przycisk „Nawiguj” otwiera trasę w Google Maps. Podpowiadanie miast na podstawie kodu pocztowego używa bazy GeoNames (geonames.org), CC BY 4.0, zlokalizowanej bezpośrednio na naszym serwerze i żaden podmiot trzeci nie otrzymuje wpisywanego kodu pocztowego. Podstawą prawną jest art. 6 ust. 1 lit. a RODO, gdy odwiedzający udostępnia lokalizację, w przeciwnym razie mapa ładuje się dopiero po otwarciu wyszukiwarki sklepów przez odwiedzającego. <b>/app/:</b> po zalogowaniu Strona łączy się z <b>Firebase</b> (uwierzytelnianie i Firestore) na zasadach z sekcji 3 i zapisuje dane logowania w pamięci przeglądarki, żeby nie pytać o hasło przy każdym wejściu. <b>/p/&lt;token&gt;:</b> Strona pobiera z Firestore udostępnioną kopię wyceny, bez logowania i bez zbierania danych osoby, która otwiera link. Obie te podstrony są wyłączone z indeksowania.</p><p><b>Projekty, pomieszczenia i kosztorysy zapisane na Stronie bez logowania</b> leżą wyłącznie w pamięci Twojej przeglądarki (localStorage) i nigdzie ich nie wysyłamy. Nie widzimy ich i nie mamy do nich dostępu. Usuwasz je, czyszcząc dane witryny w przeglądarce. Trafiają do chmury dopiero wtedy, gdy zalogujesz się na konto i sam klikniesz „Wyślij z przeglądarki na konto”. Od tego momentu obowiązuje sekcja 3. W przeglądarce zapisujemy też Twój wybór języka, wybór waluty, wybór motywu i Twoją decyzję w sprawie zgody na analitykę.</p>`
    },
    {
      id: "komu",
      h: "7. Komu udostępniamy dane",
      html: `<p>Nie sprzedajemy danych i nie prowadzimy profili użytkowników. Dane opisane wyżej są przetwarzane przez <b>Google</b> jako dostawcę usług: AdMob (reklamy), Maps i Places (mapy i sklepy), Analytics (statystyki) oraz, jeżeli założysz konto, Firebase Authentication, Cloud Firestore i Firebase Hosting (konto i synchronizacja). Ponadto po założeniu konta wysyłamy na Twój adres e-mail jednorazową wiadomość powitalną w języku strony, na której założono konto. E-mail ten jest przetwarzany i wysyłany przez serwery firmy <b>OVH SAS</b> (Francja, UE), dostawcy naszej poczty, jako podmiot przetwarzający na nasze zlecenie, na podstawie art. 6 ust. 1 lit. b RODO. Poza tym udostępniamy dane tylko tym osobom, którym sam przekażesz link do wyceny (sekcja 3.5), oraz gdy wymaga tego obowiązujące prawo.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Płatności (Stripe)",
      html: `<p>Subskrypcję <b>LiczMat Pro</b> obsługuje <b>Stripe</b> (Stripe Payments Europe, Ltd., Irlandia). Jeżeli zdecydujesz się ją wykupić, przechodzisz na stronę płatności Stripe. Stripe jako niezależny administrator przyjmuje oraz przetwarza dane płatnicze: numer karty, dane rozliczeniowe i historię płatności. <b>Nie widzimy i nie przechowujemy numeru Twojej karty.</b> Do Stripe trafia Twój adres e-mail oraz identyfikator konta (UID), żeby opłaconą subskrypcję dało się przypisać do właściwego konta, z powrotem otrzymujemy wyłącznie status planu (darmowy albo Pro), datę jego ważności i informację, czy subskrypcja się odnowi. Fakturami, zmianą karty i anulowaniem zarządzasz w panelu klienta Stripe. Zasady Stripe: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Przekazywanie danych poza EOG",
      html: `<p>Firma Google LLC (odpowiadająca za Firebase Authentication, Google Analytics, AdMob, Maps, Places oraz Firebase Hosting, na którym działa nasza strona i który przetwarza standardowe logi serwera, w tym adresy IP) jest przedsiębiorstwem ze Stanów Zjednoczonych. Przekazywanie Twoich danych do USA opiera się na <b>Decyzji Wykonawczej Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony w ramach ram ochrony danych UE-USA (Data Privacy Framework)</b>, ponieważ firma posiada odpowiedni certyfikat, a także dodatkowo na <b>Standardowych Klauzulach Umownych</b> wbudowanych w jej regulamin przetwarzania danych (Google Cloud Data Processing Addendum).</p>`
    },
    {
      id: "prawa",
      h: "9. Twoje prawa (RODO)",
      html: `<p>Zgodnie z RODO masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz sprzeciwu, a także prawo do wycofania zgody na reklamy spersonalizowane i analitykę. <b>W przypadku gdy przetwarzanie opiera się na art. 6 ust. 1 lit. f RODO, w dowolnym momencie możesz wnieść sprzeciw z przyczyn związanych z Twoją szczególną sytuacją (art. 21 RODO).</b></p><p>Dane, które zostają na urządzeniu, kontrolujesz bezpośrednio (dane aplikacji, uprawnienia, identyfikator reklamowy w ustawieniach Androida). Dane konta możesz przejrzeć i zmienić w Aplikacji lub na <a href="/app/">liczmat.com/app/</a>, wyeksportować przez funkcję kopii zapasowej, a także usunąć, kasując poszczególne rekordy albo prosząc o usunięcie całego konta (sekcja 3.6). W sprawach dotyczących danych napisz na: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Masz też prawo wnieść skargę do właściwego organu nadzorczego w Bawarii: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, do polskiego <b>Prezesa Urzędu Ochrony Danych Osobowych (PUODO)</b>, lub do organu ochrony danych w swoim kraju zamieszkania w obrębie UE.</p>`
    },
    {
      id: "dzieci",
      h: "10. Dzieci",
      html: `<p>Aplikacja nie jest kierowana do dzieci i nie zbieramy świadomie danych osób poniżej 13. roku życia. Konto LiczMat jest przeznaczone dla osób, które ukończyły 16 lat lub mają zgodę opiekuna.</p>`
    },
    {
      id: "zmiany",
      h: "11. Zmiany i kontakt",
      html: `<p>Możemy aktualizować niniejszą politykę. Istotne zmiany zasygnalizujemy w Aplikacji lub w sklepie Google Play. Data ostatniej aktualizacji znajduje się na górze dokumentu. Kontakt: <b>${ENTITY.name}</b>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
