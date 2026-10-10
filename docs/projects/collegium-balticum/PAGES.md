<!-- TASK4_CURRENT -->
# Aktualny stan zadania 4

Wszystkie 19 adresów ma rzeczywiste lokalne dane WordPress; wcześniejsze sekcje tego dokumentu stanowią historię, nie bieżący status. Szczegóły URL, ID, szablonów i braków: [TASK-4-REGISTER](TASK-4-REGISTER.md), dowody: [TASK-4-EVIDENCE](TASK-4-EVIDENCE.json), raport: [TASK-4](TASK-4.md). SOURCE_CAPTURE=DONE oznacza pozyskanie referencji; 6 z 38 widoków nadal ma ostrzeżenia jakości źródła.

| ID | SOURCE_CAPTURE | TEMPLATE | LOCAL_RENDER | CONTENT | VISUAL_QA | WCAG_QA |
| --- | --- | --- | --- | --- | --- | --- |
| CB-00 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-01 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-02 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-03 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-04 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-05 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-06 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-07 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-08 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-09 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-10 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-11 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-12 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-13 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-14 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-15 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-16 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-17 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |
| CB-18 | DONE | DONE | DONE | DONE | IN_PROGRESS | IN_PROGRESS |

Task 4E: [38 porównań przed/po](TASK-4E-VISUAL-AUDIT.md), [WCAG](TASK-4E-WCAG-AUDIT.md), [decyzje PM](TASK-4E-PM-DECISIONS.md). CB-05 MEDIA=IN_PROGRESS: 21 pełnych oryginałów galerii nie ma w cache, powiększenia używają autentycznych miniatur; [manifest](TASK-4E-GALLERY-ORIGINALS.json). VISUAL_QA/WCAG_QA pozostają IN_PROGRESS.

<!-- TASK4_CURRENT_END -->

# Rejestr obowiązkowych widoków CB-00–CB-18

Źródło: https://www.cb.szczecin.pl/. Stan: 2026-10-09, po zadaniu 3/5; ustalenia źródłowe poniżej zawierają historię zadań 1–2.
Rejestr zawiera wszystkie 19 pozycji. Nie istnieje mechanizm wyboru dowolnych 8–12.
Liczba rodzin szablonów nie ogranicza liczby adresów do wdrożenia.

## Dokładne adresy i dwa statusy

Rodziny przypisano po odczycie tekstowym i zgodnie z zadaniem 3. Kod działa na danych QA; geometria i wierność LIVE wymagają referencji. Szczegółowe dowody i ograniczenia są w TEMPLATE-REGISTER oraz TEMPLATE-QA.

| ID | Widok | Wymagany produkcyjny URL | Rola / wdrożony szablon | TEMPLATE | CONTENT | Lokalny URL | WP ID / dowody QA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CB-00 | Strona główna | https://www.cb.szczecin.pl/ | home / front-page.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-01 | Kontakt | https://www.cb.szczecin.pl/kontakt/ | contact / template-contact.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-02 | Archiwum bloga | https://www.cb.szczecin.pl/category/wpisy/blog-post/ | blog-archive / archive.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-03 | Dynamiczny pojedynczy wpis — przykład QA | https://www.cb.szczecin.pl/wpisy/blog-post/dietetyka-licencjacka-i-magisterska-czym-roznia-sie-programy-i-perspektywy-zawodowe/ | blog-single / single.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-04 | Rekrutacja | https://www.cb.szczecin.pl/rekrutacja/ | banner-tile / template-banner-tile.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-05 | Dni otwarte | https://www.cb.szczecin.pl/dni-otwarte/ | banner-tile / template-banner-tile.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-06 | Studia licencjackie | https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/ | banner-accordion / template-banner-accordion.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-07 | Studia magisterskie | https://www.cb.szczecin.pl/tryb-studiow/studia-magisterskie/ | banner-accordion / template-banner-accordion.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-08 | Fitodietetyka | https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/studia-nienauczycielskie/fitodietetyka/ | course / template-course.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-09 | Studia online | https://www.cb.szczecin.pl/tryb-studiow/studia-online/ | flexible / template-flexible.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-10 | Studia podyplomowe | https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/ | flexible / template-flexible.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-11 | Mediator sądowy | https://www.cb.szczecin.pl/mediator-sadowy/ | course / template-course.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-12 | Szkolenia rad pedagogicznych | https://www.cb.szczecin.pl/szkolenia-rad-pedagogicznych/ | flexible / template-flexible.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-13 | Przeniesienie z innej uczelni | https://www.cb.szczecin.pl/przeniesienie-z-innej-uczelni/ | basic / template-basic.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-14 | Reaktywacja praw studenta | https://www.cb.szczecin.pl/reaktywuj-sie-w-prawach-studenta-w-collegium-balticum/ | basic / template-basic.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-15 | Wsparcie studenta | https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/ | flexible / template-flexible.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-16 | Legitymacja studencka | https://www.cb.szczecin.pl/strefa-studenta/legitymacja-studencka/ | flexible / template-flexible.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-17 | Erasmus — o programie | https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/ | flexible / template-flexible.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |
| CB-18 | Biblioteka — wypożyczenie na zamówienie | https://www.cb.szczecin.pl/strefa-studenta/biblioteka/wypozyczenie-na-zamowienie/ | basic / template-basic.php | IN_PROGRESS | TODO | — | [szablon/analiza](TEMPLATE-REGISTER.md), [QA](TEMPLATE-QA.md) |

## Pochodzenie adresów i granice weryfikacji

CB-00: [produkcja](https://www.cb.szczecin.pl/) odczytana narzędziem web 2026-10-09.
CB-01: link „Kontakty” w stopce prowadzi do `/kontakt`, odczyt przekierował do
[/kontakt/](https://www.cb.szczecin.pl/kontakt/).
CB-02: pozycja „Blog” w nawigacji prowadzi do
[/category/wpisy/blog-post/](https://www.cb.szczecin.pl/category/wpisy/blog-post/).
Na stronie występuje również szersze archiwum
[/category/wpisy/](https://www.cb.szczecin.pl/category/wpisy/), do którego kieruje
„Zobacz wszystkie”. Nie zastępuje ono CB-02; zakres podwidoków do decyzji PM (Q-03).
CB-03: istniejący wpis znaleziony w sekcji Blog na stronie głównej i odczytany
pod podanym dokładnym URL. Służy wyłącznie QA dynamicznego szablonu wszystkich
właściwych wpisów; nie hardkodować jego treści w PHP i nie migrować całego bloga.

CB-04–CB-18: dokładne ścieżki przekazane przez użytkownika. W zadaniu 1 nie
wykonano pełnego audytu HTTP, designu ani treści każdej z tych stron.
Nie deklarować tych stron jako zweryfikowanych wizualnie. W discovery dopisać
obserwowane HTTP/redirect/canonical i referencje, zachowując wymagane adresy;
rozbieżności zgłosić PM zamiast zamieniać stronę.
Odczyty web mogą korzystać z indeksowanego cache — nie są zamrożonym screenshotem LIVE.

## Zasady aktualizacji

Statusy: TODO, IN_PROGRESS, BLOCKED (z powodem), DONE. Kod rodzin wdrożono; TEMPLATE=IN_PROGRESS do QA rzeczywistych stron, CONTENT=TODO. Lokalnych stron CB jeszcze nie utworzono.

- TEMPLATE: działa szablon odpowiadający układowi, sprawdzony na rzeczywistym
  lokalnym URL z właściwą treścią. Samo przypisanie rodziny lub plik PHP nie wystarcza.
- CONTENT: konkretna strona lub wpis utworzony i wypełniony w WP; archiwum ma
  prawidłową kategorię i rzeczywiste dane. Wymagane ID rekordu/terminu, lokalny
  URL z zachowaną ścieżką, potwierdzenie treści oraz dowody QA.
- TEMPLATE=DONE nie oznacza CONTENT=DONE. Nie kopiować statusu z innej strony
  tylko dlatego, że korzysta z tej samej rodziny.
- Dowody powinny wskazywać aktualny snapshot, build, capture/diff, kontrolę
  treści, interakcji, RWD, WCAG i SEO. Brak dowodów nie jest PASS.

Globalny header/menu/footer kontrolować na całym rejestrze. Rozbudowa hierarchii
parentów i kategorii jest elementem zachowania URL, nie zgodą na migrację treści
wszystkich nieobjętych zakresem stron nadrzędnych.

## Uzupełnienie po korespondencji PM i audycie

PM 9 lipca wskazał CB-04/05 jako baner z kaflem, CB-06/07 jako banner/slider
z accordionami, CB-08 jako ofertę podyplomową, a CB-09–CB-18 jako układy
mieszane. To wskazówki do discovery, nie potwierdzony aktualny układ.
CB-10 ma dodatkowe wymaganie otwartego naboru na początku listy i tekstowych
statusów; szczegóły w MODULES. Audyt PDF wskazuje bezpośrednio CB-00, CB-01,
CB-06, CB-15 i CB-17, a pozostałym pomaga przez wymagania wspólne.
Po zadaniu 3 TEMPLATE=IN_PROGRESS, CONTENT=TODO dla wszystkich 19 pozycji; żaden nowy URL nie został dodany do obowiązkowego zakresu na podstawie samego audytu.

## Narzędzia LIVE — zadanie 2

Pełna konfiguracja wszystkich 19 adresów: [live.json](live.json).
Test kompletności: `node docs/projects/collegium-balticum/live-config.test.js`.
Rejestr techniczny sześciu statusów per URL oraz dowody per viewport powstają
w `.factory-cache/live/collegium-balticum/summary.json` i `REPORT.md`.
Rzeczywiste wyniki i ograniczenia: [TOOLS-QA](TOOLS-QA.md).
TEMPLATE i CONTENT powyżej pozostają TODO; udany local capture nie oznacza
wdrożonej strony CB. Snapshot źródła CB-00 nie powstał z powodu timeoutu.

## Zadanie 3 — szablony i discovery

Wszystkie 19 pozycji mają przypisany szablon/moduły w [TEMPLATE-REGISTER](TEMPLATE-REGISTER.md) oraz [JSON](TEMPLATE-REGISTER.json). Zmiana TEMPLATE na IN_PROGRESS oznacza zaimplementowany kod i testy na jawnych fixtures, a nie ukończone QA konkretnej strony. CONTENT pozostaje TODO. Wszystkie 38 prób screenshotu źródła zakończyły się timeoutem; [błędy per URL](REFERENCE-ACCESS.json). Nie potwierdzono geometrii, interakcji produkcyjnych ani wyglądu 1:1.
