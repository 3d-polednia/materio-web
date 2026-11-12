import { ENTITY } from "../site.mjs";

export default {
  lang: "pl",
  title: "Regulamin LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "To tłumaczenie. Wiążąca jest wersja niemiecka.",
  sections: [
    {
      id: "anbieter",
      h: "1. Usługodawca i zakres stosowania",
      html: `<p>Usługodawcą LiczMat Pro jest <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, numer identyfikacyjny VAT: ${ENTITY.taxId}.</p><p>Niniejszy regulamin dotyczy płatnej subskrypcji <b>LiczMat Pro</b>, oferowanej na liczmat.com dla aplikacji internetowej pod adresem <a href="/app/">liczmat.com/app/</a>. Bezpłatne kalkulatory na liczmat.com, aplikacja na Androida i bezpłatne konto LiczMat są nieodpłatne i nie stanowią części płatnej umowy.</p><p>Konsumentem w rozumieniu § 13 niemieckiego BGB jest każda osoba fizyczna, która zawiera czynność prawną w celu niezwiązanym w przeważającej mierze z jej działalnością gospodarczą ani samodzielną działalnością zawodową. Przedsiębiorcą w rozumieniu § 14 niemieckiego BGB jest osoba fizyczna, osoba prawna albo spółka osobowa posiadająca zdolność prawną, która przy zawieraniu umowy działa w ramach swojej działalności gospodarczej lub samodzielnej działalności zawodowej.</p><p>Własne warunki umowne klienta nie mają zastosowania.</p>`
    },
    {
      id: "leistung",
      h: "2. Świadczenie",
      html: `<p>LiczMat Pro udostępnia Ci online w przeglądarce funkcje Pro opisane na stronie <a href="/liczmat-pro/">LiczMat Pro</a> w chwili składania zamówienia. Obejmują one w szczególności zarządzanie klientami, wyceny w formacie PDF i z linkiem do udostępniania, planowanie terminów, ceny i koszty w projektach oraz zapis danych firmy. LiczMat przechowuje wprowadzone przez Ciebie dane na Twoim koncie.</p><p>Obliczenia i sporządzane na ich podstawie wyceny są pomocą. Przed zakupem materiałów lub złożeniem oferty sprawdzasz ilości, ceny, wyniki i przydatność do zamierzonego celu.</p><p>Nie gwarantujemy nieprzerwanej dostępności. Mogą wystąpić prace konserwacyjne, zakłócenia techniczne i awarie. Staramy się, aby ograniczenia trwały jak najkrócej.</p>`
    },
    {
      id: "test",
      h: "3. Bezpłatny okres próbny",
      html: `<p>Nowe konta otrzymują LiczMat Pro <b>bezpłatnie na 14 dni</b>. Nie wymaga to podania danych płatniczych. Okres próbny kończy się automatycznie i nie przekształca się w płatną subskrypcję. Po jego zakończeniu konto wraca do planu bezpłatnego.</p>`
    },
    {
      id: "vertrag",
      h: "4. Zawarcie umowy",
      html: `<p>Prezentacja LiczMat Pro na stronie internetowej nie stanowi wiążącej oferty zawarcia umowy.</p><p>Aby złożyć zamówienie, logujesz się na <a href="/app/">liczmat.com/app/</a>, wybierasz subskrypcję miesięczną albo roczną i klikasz przycisk zakupu. Zostajesz przekierowany na stronę płatności Stripe. Tam podajesz adres e-mail i dane płatnicze. Przed końcowym kliknięciem możesz sprawdzić i poprawić wszystkie dane. Umowa zostaje zawarta po kliknięciu przycisku <b>„Subskrybuj z obowiązkiem zapłaty”</b>.</p><p>Dostawcą usług płatniczych jest Stripe Payments Europe, Limited (Irlandia). Stripe przesyła potwierdzenie umowy pocztą elektroniczną.</p><p>Umowę można zawrzeć w każdym z 13 języków oferowanych na stronie. Wiążąca jest wersja niemiecka. Nie przechowujemy osobno tekstu umowy. Niniejszy regulamin jest stale dostępny pod tym adresem i możesz go zapisać lub wydrukować. Potwierdzenia płatności i faktury są dostępne w panelu klienta Stripe.</p>`
    },
    {
      id: "preise",
      h: "5. Ceny i płatność",
      html: `<p>Obowiązują ceny pokazane na stronie <a href="/liczmat-pro/">LiczMat Pro</a> i w kasie w chwili składania zamówienia. Są to ceny końcowe. Nie pobieramy dodatkowych kosztów. Rozliczenie następuje w walucie pokazanej w kasie.</p><p>Cena jest naliczana z góry za dany okres, miesiąc albo rok, i automatycznie pobierana na początku każdego okresu przy użyciu metody płatności wybranej w kasie. Dostępne są metody płatności oferowane w kasie.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Czas trwania i wypowiedzenie",
      html: `<h3>6.1. Subskrypcja miesięczna</h3><p>Subskrypcja miesięczna trwa jeden miesiąc. Przedłuża się każdorazowo o kolejny miesiąc, jeżeli nie zostanie wypowiedziana. Możesz ją wypowiedzieć w każdej chwili ze skutkiem na koniec bieżącego miesięcznego okresu umownego.</p><h3>6.2. Subskrypcja roczna</h3><p>Pierwszy okres umowy trwa jeden rok. Możesz wypowiedzieć subskrypcję w każdej chwili ze skutkiem na koniec tego roku. Jeżeli jej nie wypowiesz, po pierwszym roku umowa będzie kontynuowana na czas nieokreślony i będzie można ją wypowiedzieć w każdej chwili z miesięcznym okresem wypowiedzenia. Rozliczenie nadal następuje z góry za rok. Zwracamy proporcjonalnie zapłaconą już kwotę za czas po zakończeniu umowy.</p><h3>6.3. Sposoby wypowiedzenia</h3><p>Możesz wypowiedzieć umowę w panelu klienta przez sekcję <b>Konto</b> na <a href="/app/">liczmat.com/app/</a>, za pomocą przycisku <a href="/wypowiedz-umowe/">„Wypowiedz umowę tutaj”</a>, pocztą elektroniczną na adres <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> albo listownie na adres ${ENTITY.name}, ${ENTITY.address}. Prawo do rozwiązania umowy z ważnego powodu pozostaje bez zmian.</p><h3>6.4. Skutki zakończenia umowy</h3><p>Po zakończeniu umowy konto wraca do planu bezpłatnego. Twoje dane pozostają zapisane na koncie. Funkcje Pro przestają być dostępne do czasu ponownego zamówienia LiczMat Pro. Informacje o usunięciu konta znajdziesz w <a href="/polityka-prywatnosci/">polityce prywatności</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Pouczenie o odstąpieniu od umowy",
      html: `<p>Poniższe ustawowe prawo do odstąpienia od umowy przysługuje wyłącznie konsumentom.</p><h3>Prawo do odstąpienia od umowy</h3><p>Mają Państwo prawo odstąpić od niniejszej umowy w terminie 14 dni bez podania jakiejkolwiek przyczyny.</p><p>Termin do odstąpienia od umowy wygasa po upływie 14 dni od dnia zawarcia umowy.</p><p>Aby skorzystać z prawa do odstąpienia od umowy, muszą Państwo poinformować nas, <b>${ENTITY.name}</b>, ${ENTITY.address}, telefon: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, o swojej decyzji o odstąpieniu od niniejszej umowy w drodze jednoznacznego oświadczenia, na przykład pisma wysłanego pocztą lub pocztą elektroniczną.</p><p>Mogą Państwo skorzystać z poniższego wzoru formularza odstąpienia od umowy lub z funkcji odstąpienia od umowy na stronie <a href="/odstap-od-umowy/">„Odstąp od umowy tutaj”</a>, jednak nie jest to obowiązkowe. Jeżeli korzystają Państwo z tej funkcji internetowej, bez zbędnej zwłoki prześlemy Państwu potwierdzenie otrzymania informacji o odstąpieniu od umowy na trwałym nośniku, na przykład pocztą elektroniczną, w tym jego treść oraz datę i godzinę złożenia.</p><p>Aby zachować termin odstąpienia od umowy, wystarczy, aby wysłali Państwo informację dotyczącą wykonania przysługującego Państwu prawa do odstąpienia od umowy przed upływem terminu do odstąpienia od umowy.</p><h3>Skutki odstąpienia od umowy</h3><p>W przypadku odstąpienia od niniejszej umowy zwracamy Państwu wszystkie otrzymane od Państwa płatności bez zbędnej zwłoki, a w każdym przypadku nie później niż 14 dni od dnia, w którym zostaliśmy poinformowani o Państwa decyzji o wykonaniu prawa do odstąpienia od niniejszej umowy.</p><p>Zwrotu płatności dokonamy przy użyciu takich samych sposobów płatności, jakie zostały przez Państwa użyte w początkowej transakcji, chyba że wyraźnie zgodzili się Państwo na inne rozwiązanie. W każdym przypadku nie poniosą Państwo żadnych opłat w związku z tym zwrotem.</p><p>Nie żądamy od Państwa zapłaty za okres do chwili odstąpienia od umowy.</p>`
    },
    {
      id: "formular",
      h: "8. Wzór formularza odstąpienia od umowy",
      html: `<p>Formularz ten należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy.</p><ul><li>Adresat: <b>${ENTITY.name}</b>, ${ENTITY.address}, e-mail: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Ja/My (*) niniejszym informuję/informujemy (*) o moim/naszym (*) odstąpieniu od umowy o świadczenie następującej usługi: <b>LiczMat Pro (subskrypcja)</b>.</li><li>Data zamówienia (*)</li><li>Imię i nazwisko konsumenta(-ów)</li><li>Adres konsumenta(-ów)</li><li>Podpis konsumenta(-ów), tylko jeżeli formularz jest przesyłany w wersji papierowej</li><li>Data</li></ul><p>(*) Niepotrzebne skreślić.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Dodatkowy zwrot płatności w ciągu 14 dni",
      html: `<p>Niezależnie od ustawowego prawa do odstąpienia od umowy zwracamy każdemu klientowi, także przedsiębiorcy, całą zapłaconą kwotę, jeżeli odstąpi od umowy lub ją wypowie w ciągu 14 dni od pierwszego zakupu subskrypcji LiczMat Pro. Zasada ta dotyczy wyłącznie pierwszego zakupu na danym koncie i nie ma zastosowania do odnowień.</p>`
    },
    {
      id: "pflichten",
      h: "10. Obowiązki klienta",
      html: `<ul><li>Podajesz prawdziwe i kompletne dane oraz dbasz o ich aktualność.</li><li>Zachowujesz hasło w tajemnicy i chronisz dostęp do konta.</li><li>Nie umieszczasz treści bezprawnych w wycenach ani w udostępnianych linkach. Każda osoba znająca udostępniony link do wyceny lub projektu może zobaczyć jego treść.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Zmiany świadczenia",
      html: `<p>Możemy zmienić świadczenie tylko z ważnej przyczyny, na przykład z powodu nowych przepisów, wymogów bezpieczeństwa albo rozwoju technicznego. Zmiana nie powoduje dla Ciebie dodatkowych kosztów. Informujemy o niej jasno i z odpowiednim wyprzedzeniem.</p><p>Jeżeli zmiana ogranicza konsumentowi dostęp lub korzystanie w stopniu większym niż nieznaczny, konsument może nieodpłatnie zakończyć umowę w ciągu 30 dni od otrzymania informacji albo od wprowadzenia zmiany, zależnie od tego, który termin przypada później (§ 327r BGB).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Ustawowe prawa z tytułu wad i braku zgodności",
      html: `<p>Obowiązują ustawowe prawa z tytułu wad i braku zgodności. Do konsumentów stosuje się w szczególności §§ 327 i następne BGB.</p>`
    },
    {
      id: "haftung",
      h: "13. Odpowiedzialność",
      html: `<p>Odpowiadamy bez ograniczeń za działanie umyślne i rażące niedbalstwo, za szkodę na życiu, ciele lub zdrowiu oraz na podstawie niemieckiej ustawy o odpowiedzialności za produkt (Produkthaftungsgesetz).</p><p>W przypadku lekkiego niedbalstwa odpowiadamy wyłącznie za naruszenie istotnych obowiązków umownych. Są to obowiązki, których wykonanie umożliwia prawidłową realizację umowy i na których wykonaniu klient może zwykle polegać, zwane także obowiązkami kardynalnymi. W takim przypadku odpowiedzialność ogranicza się do szkody typowej dla umowy i możliwej do przewidzenia. W pozostałym zakresie odpowiedzialność za lekkie niedbalstwo jest wyłączona.</p><p>Ustawowa odpowiedzialność wynikająca z §§ 327 i następnych BGB pozostaje bez zmian.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Zmiany cen",
      html: `<p>Cena trwającej subskrypcji może się zmienić wyłącznie za Twoją wyraźną zgodą. Informujemy Cię co najmniej 30 dni wcześniej. Bez Twojej zgody subskrypcja jest kontynuowana po dotychczasowej cenie. Każda ze stron może ją zakończyć z końcem opłaconego okresu.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Zmiany regulaminu",
      html: `<p>Zmiany niniejszego regulaminu mają zastosowanie do trwającej umowy wyłącznie za Twoją wyraźną zgodą. Informujemy Cię co najmniej 30 dni wcześniej. Bez Twojej zgody nadal obowiązuje dotychczasowy regulamin. Każda ze stron może zakończyć subskrypcję z końcem opłaconego okresu.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Ochrona danych",
      html: `<p>Informacje o przetwarzaniu danych osobowych znajdziesz w <a href="/polityka-prywatnosci/">polityce prywatności</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Pozasądowe rozstrzyganie sporów konsumenckich",
      html: `<p>Nie jesteśmy gotowi ani zobowiązani do udziału w postępowaniu w sprawie pozasądowego rozstrzygania sporów przed konsumenckim organem pojednawczym (§ 36 VSBG).</p>`
    },
    {
      id: "schluss",
      h: "18. Postanowienia końcowe",
      html: `<p>Obowiązuje prawo niemieckie z wyłączeniem Konwencji Narodów Zjednoczonych o umowach międzynarodowej sprzedaży towarów. W przypadku konsumentów wybór ten nie pozbawia ich ochrony wynikającej z bezwzględnie obowiązujących przepisów państwa ich zwykłego pobytu.</p><p>Dla kupców, osób prawnych prawa publicznego i funduszy specjalnych prawa publicznego sądem właściwym jest sąd siedziby usługodawcy.</p><p>Jeżeli którekolwiek postanowienie umowy jest lub stanie się nieważne, pozostałe postanowienia zachowują ważność.</p><p>Wiążąca jest wersja niemiecka. Tłumaczenia służą wyłącznie celom informacyjnym.</p>`
    }
  ]
};
