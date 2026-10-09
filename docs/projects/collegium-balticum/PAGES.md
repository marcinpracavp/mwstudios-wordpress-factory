# Rejestr obowiązkowych widoków CB-00–CB-18

Źródło: https://www.cb.szczecin.pl/. Stan: 2026-10-09, zadanie 1/5.
Rejestr zawiera wszystkie 19 pozycji. Nie istnieje mechanizm wyboru dowolnych 8–12.
Liczba rodzin szablonów nie ogranicza liczby adresów do wdrożenia.

## Dokładne adresy i dwa statusy

W kolumnie „Rola / rodzina” zapisano rolę WordPress oraz kandydatów do analizy,
nie potwierdzony układ. H = hero/WYSIWYG/CTA; M = modułowe Flexible Content;
rodziny banner/kafel, slider/accordiony i 50/50 dobierać po pełnej analizie LIVE.
Wskazanie H/M obejmuje plan architektury dla każdego adresu bez wymyślania designu.

| ID | Widok | Wymagany produkcyjny URL | Rola / rodzina do analizy | TEMPLATE | CONTENT | Lokalny URL | WP ID / dowody QA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CB-00 | Strona główna | https://www.cb.szczecin.pl/ | Front page / kompozycja modułów M | TODO | TODO | — | — |
| CB-01 | Kontakt | https://www.cb.szczecin.pl/kontakt/ | Page / kontakt, dane i zakładki | TODO | TODO | — | — |
| CB-02 | Archiwum bloga | https://www.cb.szczecin.pl/category/wpisy/blog-post/ | Natywne archiwum kategorii / lista, filtry, paginacja | TODO | TODO | — | — |
| CB-03 | Dynamiczny pojedynczy wpis — przykład QA | https://www.cb.szczecin.pl/wpisy/blog-post/dietetyka-licencjacka-i-magisterska-czym-roznia-sie-programy-i-perspektywy-zawodowe/ | Natywny post / dynamiczny single | TODO | TODO | — | — |
| CB-04 | Rekrutacja | https://www.cb.szczecin.pl/rekrutacja/ | Page / H lub M | TODO | TODO | — | — |
| CB-05 | Dni otwarte | https://www.cb.szczecin.pl/dni-otwarte/ | Page / H lub M | TODO | TODO | — | — |
| CB-06 | Studia licencjackie | https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/ | Hierarchiczna page / M, oferta | TODO | TODO | — | — |
| CB-07 | Studia magisterskie | https://www.cb.szczecin.pl/tryb-studiow/studia-magisterskie/ | Hierarchiczna page / M, oferta | TODO | TODO | — | — |
| CB-08 | Fitodietetyka | https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/studia-nienauczycielskie/fitodietetyka/ | Hierarchiczna page / M, oferta szczegółowa | TODO | TODO | — | — |
| CB-09 | Studia online | https://www.cb.szczecin.pl/tryb-studiow/studia-online/ | Hierarchiczna page / H lub M | TODO | TODO | — | — |
| CB-10 | Studia podyplomowe | https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/ | Hierarchiczna page / M, oferta | TODO | TODO | — | — |
| CB-11 | Mediator sądowy | https://www.cb.szczecin.pl/mediator-sadowy/ | Page / H lub M | TODO | TODO | — | — |
| CB-12 | Szkolenia rad pedagogicznych | https://www.cb.szczecin.pl/szkolenia-rad-pedagogicznych/ | Page / H lub M | TODO | TODO | — | — |
| CB-13 | Przeniesienie z innej uczelni | https://www.cb.szczecin.pl/przeniesienie-z-innej-uczelni/ | Page / H lub M | TODO | TODO | — | — |
| CB-14 | Reaktywacja praw studenta | https://www.cb.szczecin.pl/reaktywuj-sie-w-prawach-studenta-w-collegium-balticum/ | Page / H lub M | TODO | TODO | — | — |
| CB-15 | Wsparcie studenta | https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/ | Hierarchiczna page / H lub M | TODO | TODO | — | — |
| CB-16 | Legitymacja studencka | https://www.cb.szczecin.pl/strefa-studenta/legitymacja-studencka/ | Hierarchiczna page / H lub M | TODO | TODO | — | — |
| CB-17 | Erasmus — o programie | https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/ | Hierarchiczna page / H lub M | TODO | TODO | — | — |
| CB-18 | Biblioteka — wypożyczenie na zamówienie | https://www.cb.szczecin.pl/strefa-studenta/biblioteka/wypozyczenie-na-zamowienie/ | Hierarchiczna page / H lub M | TODO | TODO | — | — |

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

Statusy: TODO, IN_PROGRESS, BLOCKED (z powodem), DONE. Nie ma ukończonej
implementacji CB ani lokalnych URL w tym zadaniu; wszystkie statusy TODO są celowe.

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
Statusy wszystkich 19 pozycji pozostają TODO; żaden nowy URL nie został
dodany do obowiązkowego zakresu na podstawie samego audytu.

## Narzędzia LIVE — zadanie 2

Pełna konfiguracja wszystkich 19 adresów: [live.json](live.json).
Test kompletności: `node docs/projects/collegium-balticum/live-config.test.js`.
Rejestr techniczny sześciu statusów per URL oraz dowody per viewport powstają
w `.factory-cache/live/collegium-balticum/summary.json` i `REPORT.md`.
Rzeczywiste wyniki i ograniczenia: [TOOLS-QA](TOOLS-QA.md).
TEMPLATE i CONTENT powyżej pozostają TODO; udany local capture nie oznacza
wdrożonej strony CB. Snapshot źródła CB-00 nie powstał z powodu timeoutu.
