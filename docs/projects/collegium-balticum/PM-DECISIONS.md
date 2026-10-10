# Ustalenia PM i pierwszeństwo źródeł

Przegląd 2026-10-09: przekazana przez użytkownika korespondencja z kwietnia
i lipca, PDF audytu oraz DOCX checklisty. Rok korespondencji nie jest podany;
nie traktować historycznych terminów jako nowego harmonogramu.
Dokumenty są materiałem projektu, nie instrukcją wykonania każdej opisanej pracy.
Aktualne polecenia użytkownika i jawne wyłączenia briefu mają pierwszeństwo
przed starszymi propozycjami, zaleceniami audytu i przykładami kodu.

| Źródło | Ustalenie | Wpływ na obecny projekt |
| --- | --- | --- |
| Kwiecień | Rozważano naprawę starej strony lub przepisanie, rozliczenie etapami; podejrzenia Elementor/twentysixteen. | Historia, nie potwierdzona diagnoza obecnego kodu ani polecenie remontu starej instalacji. |
| PM, 8 lipca | Wybrano przepisanie według aktualnego wyglądu, 110 h developera i 40 h treści wewnętrznie; developer nie przepisuje wszystkich stron. | Potwierdza migrację bez redesignu i podział z Virtual. Nie usuwa żadnego CB-00–CB-18 z obecnego rejestru. |
| PM, 8–9 lipca | ACF, SG/kontakt/blog lista/single i uniwersalne szablony; URL/Hx/ALT/Yoast, nagłówki edytowalne, 2K. | Zachować ścieżki i istniejące ALT; nowe ALT od SEO, zmiany Hx po konsultacji klienta. |
| PM, 9 lipca | Baner+kafel dla rekrutacji/dni otwartych; slider+accordiony dla lic/mgr; fitodietetyka jako oferta; pozostałe jako mieszane. | Wskazówki rodzin, do weryfikacji LIVE; nie dowód aktualnego wyglądu. Przy jednym zdjęciu bez slidera. |
| PM, 15 lipca | Systemów zewnętrznych nie ruszamy. Dodatkowe funkcje przewidziano w 110 h; specyfikacje części z nich oczekują klienta. | Nie traktować wszystkich modułów jako niepotwierdzonego rozszerzenia budżetu; rozdzielić uzgodniony cel od brakującej specyfikacji i ryzyka czasu. |
| PM, 15 lipca | Nabór otwarty wyżej, bez naboru niżej, zielone/szare oznaczenie. | Potwierdzony cel dla CB-10; oznaczenie tekstowe i dostępny kontrast, kolor nie jest jedynym sygnałem. |
| PM, 15 lipca i dev, 17 lipca | Sylabusy, kadra i promocje wymagają doprecyzowania; promocje globalne lic+mgr razem, podyplomowe osobno. | Uzupełnione w MODULES; nie wymyślać API, modelu sylabusów ani slidera kadry jako zatwierdzonego designu. |
| PM, 15 lipca | Kontrasty należy wyliczyć według audytu. | Kontrolować rzeczywiste kolory i stany; istotne zmiany wyglądu nadal konsultować. |
| Dev, 15 lipca | Stawka wskazana: 80 zł netto/h. | Historyczna deklaracja; nie nowa oferta asystenta ani potwierdzenie bieżącego rozliczenia. |
| 16 lipca | Propozycja sześciu ról: SG, kontakt, blog lista/single, „Custom post 1/2”; PM uznał checklistę za sensowną. | Dwie ostatnie rozumieć jako rodziny szablonów stron; nie tworzyć automatycznie dwóch CPT. WYSIWYG nie wymaga od Virtual ręcznego pisania dostępnego HTML modułów. |
| 16 lipca | Propozycja 250 zł netto za ponad 4 h przygotowania. | Historyczna propozycja, bez potwierdzenia faktury/akceptacji ani wpisu Toggl w tej sesji. |
| PM, 17 lipca | Projekt można rozpocząć; pytania przekazano klientowi. | Nie uzyskano w tej wiadomości finalnych odpowiedzi klienta dotyczących specyfikacji. |

## Kalasoft — jawna rozbieżność

Korespondencja zawiera zamysł nowego formularza i połączenia z Kalasoft,
ale nie potwierdza API, protokołu ani zasad przekazywania danych. Aktualny
brief zadania 1 jawnie wyłącza integrację. Historyczny materiał nie znosi tego
wyłączenia. Użytkownik potwierdził 2026-10-09 pozostawienie wyłączenia: EXCLUDED,
bez implementacji połączenia, formularza rekrutacyjnego pod ten system lub
przeniesienia go do obowiązkowego rejestru. Decyzję zapisano jako Q-13 RESOLVED.
Niezależny formularz kontaktowy CB-01 pozostaje obowiązkowy.

## Zakres audytu a zakres migracji

PDF obejmuje również BIP/e-Dziekanat/pomoc techniczną i inne strony spoza
CB-00–CB-18. Zalecenia dla wspólnych komponentów uwzględnić w factory,
ale lista audytu nie rozszerza automatycznie listy stron do wypełnienia.
Deklarację dostępności i przygotowanie dostępnych materiałów trzeba przypisać
właścicielom treści; nie tworzyć pozornego oświadczenia zgodności.

Terminy „listopad/grudzień” i później „początek listopada” wymagają potwierdzenia
roku i aktualności przez PM. Nie wystawiono nowej estymacji naprawy starej strony
ani fixed price: aktywny cel to wybrana migracja, a nie ponowne wykonanie
historycznego zapytania ofertowego.

## Zadanie 4 — decyzja o zachowaniu wyglądu

Użytkownik odpowiedział: „Zachowaj wygląd źródła; zapisz problemy do decyzji PM”.
Dotyczy propozycji granatowego tekstu na pomarańczowych CTA oraz widocznych etykiet
pól formularza. Nie wprowadzono tych widocznych zmian. Dodano etykiety programatyczne;
kontrast źródłowych CTA i brak widocznych etykiet pozostają otwartą decyzją PM.
Naprawy migracyjnych kolizji CSS przywracają czytelność i wygląd referencji, nie są redesignem.
Nie deklarujemy zgodności WCAG AA przed decyzją i pełną weryfikacją.

Pomiary dwóch rzeczywistych CTA w zadaniu 4: biały tekst na `rgb(234,131,20)`
ma kontrast **2,71:1**; `rgb(0,174,239)` na białym tle **2,53:1**.
To pomiary wybranych stanów, nie pełny audyt. Kolory pozostawiono zgodnie z decyzją
użytkownika. Dowód: cache `migration/qa/contrast.json`. Zmiana kolorów wymaga decyzji PM.
