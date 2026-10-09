# Przekazanie szablonów dla Virtual

Kod jest gotowy do wprowadzania danych na działającym WP z ACF Pro. Układ 1:1 CB wymaga jeszcze dostępnych referencji LIVE i dopasowania wyglądu; nie używaj fixtures jako treści klienta. Kompletny plan 19 tras: [rejestr](TEMPLATE-REGISTER.md). Nie twórz dodatkowego partiala dla odmiany tekstu, koloru lub obrazu.

## Wybór szablonu

| Rodzina | Szablon / rola | Edycja |
| --- | --- | --- |
| Home | front-page.php / template-homepage.php | Hero i Flexible Content; właściwą stronę ustawić jako statyczną główną dopiero w etapie treści. |
| Kontakt | template-contact.php | Miasta → działy → kontakty; dodatkowe sekcje; reużyty wybór formularza kontakt.form. |
| Basic | template-basic.php | Hero, WYSIWYG, opcjonalne CTA i sekcje. |
| Flexible | template-flexible.php | Hero i dowolna uporządkowana kompozycja dostępnych modułów. |
| Baner z kaflem | template-banner-tile.php | Hero, grupa kafla, dalsze sekcje. |
| Baner z accordionami | template-banner-accordion.php | Hero, opis i moduły accordion w potrzebnej kolejności. |
| Oferta / szkolenie | template-course.php | Hero, podsumowanie parametrów/opłat i sekcje szczegółów. |
| Blog archive/single | archive.php, home.php, single.php | Natywne kategorie, wpisy, treść, media i daty. Nie wybierać szablonu strony dla kategorii. |

## Moduły

Treść (WYSIWYG); obraz/tekst 50/50 (reużyty section-image.php); kafle/oferty; CTA; accordion; zakładki; tabela; galeria; wideo/iframe; kontakt; partnerzy; dokumenty; wpisy z kategoriami. Markup wszystkich modułów: partials/factory/, wspólne zachowania: src/js/factory-content.js. Pełne pola i typy: [ACF-SCHEMA](ACF-SCHEMA.md).

- Slider: zero slajdów = sam tytuł/wprowadzenie; jeden = statyczny baner, bez kontrolek; wiele = ręczne przyciski i strzałki na kontrolkach, bez autoplay. Każdy nieaktywny slajd ukryty. Bez JS cała treść pozostaje czytelna.
- Obraz/tekst wymaga obu elementów; pusty moduł nie tworzy sekcji. W galerii każdy podpis edytowalny. Wariant dekoracyjny jawnie daje alt="" bez zmiany ALT w bibliotece.
- Accordion: natywne details/summary, Enter/Spacja; treść WYSIWYG zachowuje listy i HTML. Zakładki: Tab do aktywnej, strzałki/Home/End zmieniają panel; kontakt ma dwa poziomy miasto/dział.
- Kafle ofert: status open/closed albo nieustalony. Ustalony status wyświetla etykietę tekstową. Opcja sortowania daje open → nieustalone → closed i zachowuje kolejność w każdej grupie; nigdy nie zgaduje dat. Zamknięty kierunek nadal ma link.
- Tabele: edytowalny opis/caption, kolumny i wiersze. Pierwsza kolumna może być nagłówkiem wiersza. Nagłówki są powiązane przez scope/headers/ID. Liczba komórek powinna odpowiadać kolumnom. Scroll dotyczy tylko tabeli.
- Dokument: nazwa i lokalny załącznik albo link zewnętrzny. Format/rozmiar załącznika z faktycznego pliku. Zewnętrzne metadane wpisuj tylko ze sprawdzonych danych. „Zweryfikowany” wybieraj wyłącznie po kontroli właściciela dokumentu; sam upload nie dowodzi dostępności. Dodaj alternatywny dostęp, gdy wymagany.
- Media: opisowy tytuł i HTTPS do osadzenia; nie wklejaj skryptów/HTML. Dodaj dostarczoną transkrypcję i wersje dostępne. Brak materiałów do właściciela; transkrypcja nie zastępuje wszystkich wymagań dotyczących napisów/audiodeskrypcji.
- Kontakt: jawne pola telefonów i emaili dają pojedyncze poprawne tel/mailto. Nie wklejaj zagnieżdżonych linków do tych pól. Godziny mogą być WYSIWYG. Formularz wymaga ustalonego backendu Q-06; motyw korzysta z istniejącego kontakt.form i adaptera, bez atrap wysyłki.

## Elementy globalne i treść

Logo pochodzi z istniejących opcji. Nawigacja z menu WP: header, utility, lang, footer oraz archive (kategorie przy liście wpisów). Linki języków nie tworzą automatycznie tłumaczeń. Kolumny stopki, dane i link deklaracji są w nowych opcjach factory. Nie wklejaj fikcyjnej deklaracji zgodności.

Tytuł H1 edytowalny w hero (puste = tytuł WP), nagłówki sekcji i poziomy H2–H6 edytowalne. W treści nie dodawaj drugiego H1. Przy imporcie porównaj źródłowe Hx i uzyskaj decyzje opisane w [PM-REVIEW](PM-TEMPLATE-REVIEW.md). Brakujące ALT kieruj do SEO. Nie zmieniaj ścieżek, parentów, kategorii ani Yoast; ten etap niczego z Yoast nie importował.

W następnym etapie utwórz każdą stronę z rejestru, zachowaj wskazany slug i parentów, wybierz rodzinę i wprowadź rzeczywistą treść/media/metadane. Dopiero po działającym dokładnym URL, kontroli treści i QA aktualizuj CONTENT. Dane QA mają osobne ID i adresy query; nie używać ich do odbioru tras CB. Środowisko developerskie ma pozostać nieindeksowane.
