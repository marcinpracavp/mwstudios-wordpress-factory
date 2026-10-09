# CB — rejestr po naprawie 3A

Wszystkie 19 pozycji zachowano. TEMPLATE odnosi się do gotowości odwzorowania CB: IN_PROGRESS, ponieważ brak pomiarów produkcji. Rodziny PHP/ACF i ich podglądy działają (DONE w oddzielnych polach JSON). LOCAL_RENDER dotyczy konkretnej strony CB, a nie podglądu QA. CONTENT nie zostało oznaczone jako DONE. WCAG_QA obejmuje testy komponentów, nie pełny audyt strony.

| ID | Produkcyjny URL | Szablon | Podgląd QA (działa) | SOURCE_CAPTURE | TEMPLATE | LOCAL_RENDER | CONTENT | VISUAL_QA | WCAG_QA |
|---|---|---|---|---|---|---|---|---|---|
| CB-00 | https://www.cb.szczecin.pl/ | front-page.php | [QA](http://localhost:8000/) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-01 | https://www.cb.szczecin.pl/kontakt/ | template-contact.php | [QA](http://localhost:8000/?page_id=16) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-02 | https://www.cb.szczecin.pl/category/wpisy/blog-post/ | archive.php | [QA](http://localhost:8000/?cat=2) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-03 | https://www.cb.szczecin.pl/wpisy/blog-post/dietetyka-licencjacka-i-magisterska-czym-roznia-sie-programy-i-perspektywy-zawodowe/ | single.php | [QA](http://localhost:8000/?p=7) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-04 | https://www.cb.szczecin.pl/rekrutacja/ | template-banner-tile.php | [QA](http://localhost:8000/?page_id=13) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-05 | https://www.cb.szczecin.pl/dni-otwarte/ | template-banner-tile.php | [QA](http://localhost:8000/?page_id=13) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-06 | https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/ | template-banner-accordion.php | [QA](http://localhost:8000/?page_id=14) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-07 | https://www.cb.szczecin.pl/tryb-studiow/studia-magisterskie/ | template-banner-accordion.php | [QA](http://localhost:8000/?page_id=14) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-08 | https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/studia-nienauczycielskie/fitodietetyka/ | template-course.php | [QA](http://localhost:8000/?page_id=15) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-09 | https://www.cb.szczecin.pl/tryb-studiow/studia-online/ | template-flexible.php | [QA](http://localhost:8000/?page_id=12) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-10 | https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/ | template-flexible.php | [QA](http://localhost:8000/?page_id=12) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-11 | https://www.cb.szczecin.pl/mediator-sadowy/ | template-course.php | [QA](http://localhost:8000/?page_id=15) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-12 | https://www.cb.szczecin.pl/szkolenia-rad-pedagogicznych/ | template-flexible.php | [QA](http://localhost:8000/?page_id=12) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-13 | https://www.cb.szczecin.pl/przeniesienie-z-innej-uczelni/ | template-basic.php | [QA](http://localhost:8000/?page_id=11) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-14 | https://www.cb.szczecin.pl/reaktywuj-sie-w-prawach-studenta-w-collegium-balticum/ | template-basic.php | [QA](http://localhost:8000/?page_id=11) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-15 | https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/ | template-flexible.php | [QA](http://localhost:8000/?page_id=12) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-16 | https://www.cb.szczecin.pl/strefa-studenta/legitymacja-studencka/ | template-flexible.php | [QA](http://localhost:8000/?page_id=12) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-17 | https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/ | template-flexible.php | [QA](http://localhost:8000/?page_id=12) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |
| CB-18 | https://www.cb.szczecin.pl/strefa-studenta/biblioteka/wypozyczenie-na-zamowienie/ | template-basic.php | [QA](http://localhost:8000/?page_id=11) | BLOCKED | IN_PROGRESS | NOT_STARTED | NOT_STARTED | BLOCKED | IN_PROGRESS |

Dokładne planowane lokalne URL i ścieżki dowodów: [JSON](TASK-3A-REGISTER.json). Żaden produkcyjny slug ani hierarchia nie zostały zmienione.
