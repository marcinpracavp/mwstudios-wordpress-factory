# Decyzje do PM po przygotowaniu komponentów

Status PENDING. Nie wysłano wiadomości do PM; poniżej przygotowany materiał do przekazania. Nie zmieniono treści ani Hx produkcji.

| Decyzja | Potwierdzony fakt | Propozycja / brakujące dowody |
| --- | --- | --- |
| Hx i jeden H1 | Odczyt tekstowy pokazuje H1 na CB-10/13/14/18, wiele H2/H5/H6 i puste nagłówki na części innych stron. CB-03/07 brak dostępu do właściwej treści. | Renderer daje pojedynczy edytowalny H1 i edytowalne H2–H6 sekcji. Przed wypełnieniem porównać pełny DOM źródła oraz zatwierdzić korekty istniejącego Hx; jeszcze nie ma tej decyzji. |
| Kolory/focus/status naboru | Wszystkie referencje PNG produkcji z tego środowiska zablokowane timeoutem. Nie zmierzono faktycznego tła/kontrastu CB. | Komponenty mają neutralny baseline i widoczny focus. To nie jest zatwierdzona paleta CB ani redesign. Dopasować skórkę po referencjach i przedstawić pomiary oraz najmniejsze konieczne zmiany kolorów. |
| Baner i kafel | Kafel dla CB-04/05 oraz baner/accordion dla CB-06/07 są wymagane zleceniem. | Gotowa kompozycja; geometria, proporcje, liczba obrazów i wariant mobile wymagają odczytu przeglądarkowego. Nie potwierdzono wierności 1:1. |
| Formularz | Reużyte istniejące pole kontakt.form. W testowym WP brak wtyczki formularza; jej backend i zgody nie zostały ustalone. | Q-06: wskazać backend, rzeczywiste label/zgody/instrukcje i reguły testowych wysyłek. Bez tego nie potwierdzamy walidacji i obsługi błędów formularza. |
| Status CB-10 | Sortowanie stabilne i tekstowe etykiety działają na jawnych danych QA. | Q-07: źródło wartości i kolejność w grupach nadal wymagają danych. Nie ustalono dat/synchronizacji i nie wypełniono ofert CB. |

Brak dostępu do źródła jest konkretnym ograniczeniem środowiska, nie dowodem globalnej awarii CB. Wszystkie adresy zachowano. Dodatkowe promocje/kadra/sylabusy i Kalasoft pozostają zgodnie z MODULES/OPEN-QUESTIONS; nie wymyślono integracji ani specyfikacji.
