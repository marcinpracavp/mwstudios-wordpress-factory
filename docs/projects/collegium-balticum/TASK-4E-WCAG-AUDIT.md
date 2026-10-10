# CB — Task 4E: audyt WCAG 2.1 AA

**IN_PROGRESS; brak deklaracji zgodności WCAG.** Axe-core 4.14.0, 19×2 widoki; WCAG 2 A/AA, 2.1 A/AA i osobno best practice. Pełne raporty violations/incomplete/passes: cache `task4e/audit-before.json` i `audit-after.json`. [Evidence](TASK-4E-EVIDENCE.json) zawiera każdy wykryty element, selektor, HTML, kryteria/tagi, pomiary i failureSummary. Liczby poniżej oznaczają wystąpienia węzłów w 38 widokach, nie niezależne błędy projektu.

| Reguła | Przed | Po | Interpretacja |
| --- | --- | --- | --- |
| color-contrast | 794 | 794 | Wystąpienia reguły WCAG; powtarzający się globalny komponent liczony w każdym widoku |
| heading-order | 74 | 74 | Best practice; ocena semantyki, zmiany Hx do PM |
| link-in-text-block | 7 | 7 | Wystąpienia reguły WCAG; powtarzający się globalny komponent liczony w każdym widoku |
| definition-list | 42 | 0 | Wystąpienia reguły WCAG; powtarzający się globalny komponent liczony w każdym widoku |
| link-name | 6 | 0 | Wystąpienia reguły WCAG; powtarzający się globalny komponent liczony w każdym widoku |

Naprawiono 42 wystąpienia błędnej listy definicyjnej galerii (1.3.1) i 6 linków wideo bez nazwy (2.4.4/4.1.2). Dodatkowe poprawki: nazwa dialogu galerii, focus/Escape i powrót do linku, zwijanie podmenu po focusout, biografie prowadzących dostępne na focus i przewijalne z Escape, rozszerzanie hero dla powiększonego tekstu, format/rozmiar/nowa karta w nazwie 43 linków dokumentów, szczegółowe błędy backendu z aria-invalid/aria-describedby i powrotem focusu. Liczba kontrastów może się zmienić wskutek prawidłowych fontów/proporcji; nie zaliczamy tego automatycznie jako naprawy kolorów.

Kontrasty (1.4.3) pozostają nierozwiązane. W3C wymaga [4,5:1 dla zwykłego tekstu i 3:1 dla dużego](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html). Zachowano źródłowe CTA: biały/#ea8314 = 2,708:1 (wcześniejsze 2,71), biały/#00aeef = 2,530:1. Axe wyświetla je skrócone, np. 2,70/2,52. Żadnego z tych wyników nie oznaczono PASS. Dokładna instancja strony i elementu znajduje się w evidence.

| Strony | Tekst / tło | Pomiar axe | Wymagane | Wystąpienia | Propozycja / wpływ / decyzja |
| --- | --- | --- | --- | --- | --- |
| CB-00, CB-01, CB-02, CB-03, CB-04, CB-05, CB-06, CB-07, CB-08, CB-09, CB-10, CB-11, CB-12, CB-13, CB-14, CB-15, CB-16, CB-17, CB-18 | #b1b1b1 / #ffffff | 2.14:1 | 4.5:1 | 190 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-00, CB-01, CB-02, CB-03, CB-04, CB-05, CB-06, CB-07, CB-08, CB-09, CB-10, CB-11, CB-12, CB-13, CB-14, CB-15, CB-16, CB-17, CB-18 | #ff7b00 / #ffffff | 2.59:1 | 4.5:1 | 21 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-00, CB-01, CB-02, CB-03, CB-04, CB-05, CB-06, CB-07, CB-08, CB-09, CB-10, CB-11, CB-12, CB-13, CB-14, CB-15, CB-16, CB-17, CB-18 | #ffffff / #ea8314 | 2.7:1 | 4.5:1 | 31 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-00, CB-02, CB-03 | #818181 / #ffffff | 3.89:1 | 4.5:1 | 41 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-00, CB-01, CB-02, CB-03, CB-04, CB-05, CB-06, CB-07, CB-08, CB-09, CB-10, CB-11, CB-12, CB-13, CB-14, CB-15, CB-16, CB-17, CB-18 | #00aeef / #ffffff | 2.52:1 | 4.5:1 | 284 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-00 | #ffffff / #00aeef | 2.52:1 | 4.5:1 | 6 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-00, CB-01, CB-02, CB-03, CB-04, CB-05, CB-06, CB-07, CB-08, CB-09, CB-10, CB-11, CB-12, CB-13, CB-14, CB-15, CB-16, CB-17, CB-18 | #1881c3 / #ffffff | 4.22:1 | 4.5:1 | 147 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-01 | #718da8 / #ffffff | 3.45:1 | 4.5:1 | 2 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-01, CB-04, CB-10 | #6e9bc5 / #ffffff | 2.93:1 | 4.5:1 | 11 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-01 | #7d7d7d / #f6f5f5 | 3.78:1 | 4.5:1 | 1 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-02, CB-06, CB-07, CB-08, CB-09, CB-11 | #ffffff / #ff7b00 | 2.59:1 | 4.5:1 | 9 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-03 | #919191 / #ffffff | 3.15:1 | 4.5:1 | 2 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-03 | #469acf / #ffffff | 3.09:1 | 4.5:1 | 6 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-03 | #9c9c9c / #ffffff | 2.74:1 | 4.5:1 | 12 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-04, CB-10 | #ff6600 / #ffffff | 2.93:1 | 4.5:1 | 16 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-04, CB-05 | #ffb05c / #ffffff | 1.8:1 | 4.5:1 | 2 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-08 | #7a7a7a / #ffffff | 4.29:1 | 4.5:1 | 8 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-08, CB-09, CB-12 | #8fdbf8 / #ffffff | 1.53:1 | 4.5:1 | 4 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |
| CB-11 | #00aeef / #ffffff | 2.52:1 | 3:1 | 1 | Przyciemnić tekst/tło lub usunąć opacity po akceptacji PM; zmienia kolor źródła |

Inne nierozwiązane: link-in-text-block (1.4.1; 7 wystąpień): link odróżniony samym kolorem, przykład CB-03 #469acf wobec #4f4c4d ma około 2,74:1; proponowane stałe podkreślenie i poprawa kontrastu, widoczna zmiana do PM. Heading-order (74 ostrzeżenia) nie jest samodzielnym automatycznym dowodem naruszenia WCAG: źródłowe H6 opisu hero oraz H4/H5 stopki wymagają oceny 1.3.1/2.4.6 i zatwierdzonej mapy Hx; nie zmieniono struktury bez zgody. Widoczne etykiety formularza: programmatyczne label działają, lecz wymaganie QA-09 i ryzyko 3.3.2 pozostają do decyzji PM; sam brak flagi axe nie zamyka audytu.

Klawiatura: skip link na wszystkich 38 stronach przenosi focus do main-content; menu mobile Enter/Escape i powrót focusu; gallery Enter/Escape i powrót; slider/accordion/taby w pełnych testach interakcji. Testy stanów otwartych menu, dialogów i profilu są osobno w evidence, nie wliczone do statycznej sumy. Brak błędów JS, uszkodzonych obrazów i globalnego overflow w render QA. Weryfikacja reflow przy [320 CSS px](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html) i [odstępów tekstu](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html) obejmuje wszystkie widoki. Text-only 200% to jawny stress test podwojenia obliczonych fontów/interlinii, nie certyfikacja manualnego zoomu. Kandydaci clipped obejmują również przycięte zdjęcia, dekoracyjne square i ukryte overlaye; wymagają interpretacji, nie są automatycznie listą potwierdzonych naruszeń.

Wymagane dowody manualne: czytnik ekranu/kolejność odczytu; focus i kontrast na zdjęciach oraz wyniki axe incomplete; rzeczywisty zoom przeglądarki 200/400%; adekwatność wszystkich ALT (zachowane źródłowe, bez wymyślania opisów); wszystkie 35 unikalnych dokumentów PDF/DOCX (tagowanie, kolejność, tabele, formularze); wideo (napisy, audiodeskrypcja, transkrypcja) i mapa zewnętrzna. Zewnętrzne osadzenia blokowane w lokalnym QA, więc odtwarzanie nie jest potwierdzone.

Formularz: nieprawidłowe dane zwracają 422 i błędy konkretnych pól; natywny frontend waliduje pola. Test prawidłowy zapisuje tylko lokalny sink, bez SMTP i bez kontaktowania pracowników. Produkcyjny transport/odbiorcy wymagają przyszłej jawnej konfiguracji i sandboxu poczty. 37 mapowań, 35 załączników i 43 linki dokumentów przeszły kontrolę integralności/HTTP 200. Nie uruchomiono importu ponownie. Żadna strona nie otrzymała WCAG_QA=DONE.

Aktywne stany menu, dialogów i biografii: 0 dodatkowych wystąpień reguł axe w testowanym zakresie. Liczby domyślnego widoku z tabeli nie są certyfikacją wszystkich stanów ani testem manualnym.
