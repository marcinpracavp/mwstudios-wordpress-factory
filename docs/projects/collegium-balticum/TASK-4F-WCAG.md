# Task 4F — WCAG 2.1 AA

WCAG_QA = IN_PROGRESS. 38 widoków axe-core, aktywne menu/galeria/biografie i błędy formularza, skip link, Escape/focus oraz reflow 320 px, odstępy tekstu i 200% tekst. To nie jest certyfikat ani zamiennik manualnego audytu.

Pozostało 803 wystąpień WCAG: 796 kontrast (1.4.3), 7 rozróżnianie linków (1.4.1). Heading-order: 42 ostrzeżeń best practice; przed 4F: 74. Baza WCAG 801; zmiana liczby kontrastów wynika m.in. z widocznych dodatkowych podpisów przy prawidłowej siatce kadry, a nie z ukrywania problemów. 4E naprawiło wcześniej 48 wystąpień — nie liczymy ich ponownie jako poprawki 4F. Pełne selektory, HTML i wartości pomiarów każdego naruszenia: TASK-4F-EVIDENCE.json (issues).

Wspólne przyczyny: jasne tokeny nawigacji/języków/stopki, biały tekst CTA orange/cyan, szare zajawki i etykiety, jasne teksty opłat/kadr; dotyczą wielu stron. Stronowe: linki akapitowe CB-03, zmniejszona opacity podpisów źródłowych CB-08 oraz jasne elementy kontaktu. Nie ma 801 niezależnych usterek implementacji.

| Kolor tekstu / tła | Wynik axe | Wymagany | Wystąpienia | Strony |
| --- | --- | --- | --- | --- |
| #b1b1b1 / #ffffff | 2.14:1 | 4.5:1 | 190 | CB-00 desktop, CB-00 mobile, CB-01 desktop, CB-01 mobile, CB-02 desktop, CB-02 mobile, CB-03 desktop, CB-03 mobile, CB-04 desktop, CB-04 mobile, CB-05 desktop, CB-05 mobile, CB-06 desktop, CB-06 mobile, CB-07 desktop, CB-07 mobile, CB-08 desktop, CB-08 mobile, CB-09 desktop, CB-09 mobile, CB-10 desktop, CB-10 mobile, CB-11 desktop, CB-11 mobile, CB-12 desktop, CB-12 mobile, CB-13 desktop, CB-13 mobile, CB-14 desktop, CB-14 mobile, CB-15 desktop, CB-15 mobile, CB-16 desktop, CB-16 mobile, CB-17 desktop, CB-17 mobile, CB-18 desktop, CB-18 mobile |
| #ff7b00 / #ffffff | 2.59:1 | 4.5:1 | 21 | CB-00 desktop, CB-01 desktop, CB-02 desktop, CB-03 desktop, CB-04 desktop, CB-05 desktop, CB-06 desktop, CB-07 desktop, CB-08 desktop, CB-09 desktop, CB-10 desktop, CB-11 desktop, CB-11 mobile, CB-12 desktop, CB-13 desktop, CB-14 desktop, CB-15 desktop, CB-16 desktop, CB-17 desktop, CB-18 desktop |
| #ffffff / #ea8314 | 2.7:1 | 4.5:1 | 31 | CB-00 desktop, CB-01 desktop, CB-02 desktop, CB-03 desktop, CB-04 desktop, CB-04 mobile, CB-05 desktop, CB-06 desktop, CB-07 desktop, CB-08 desktop, CB-09 desktop, CB-09 mobile, CB-10 desktop, CB-10 mobile, CB-11 desktop, CB-12 desktop, CB-13 desktop, CB-14 desktop, CB-15 desktop, CB-16 desktop, CB-17 desktop, CB-18 desktop |
| #818181 / #ffffff | 3.89:1 | 4.5:1 | 41 | CB-00 desktop, CB-00 mobile, CB-02 desktop, CB-02 mobile, CB-03 desktop, CB-03 mobile |
| #00aeef / #ffffff | 2.52:1 | 4.5:1 | 287 | CB-00 desktop, CB-00 mobile, CB-01 desktop, CB-01 mobile, CB-02 desktop, CB-02 mobile, CB-03 desktop, CB-03 mobile, CB-04 desktop, CB-04 mobile, CB-05 desktop, CB-05 mobile, CB-06 desktop, CB-06 mobile, CB-07 desktop, CB-07 mobile, CB-08 desktop, CB-08 mobile, CB-09 desktop, CB-09 mobile, CB-10 desktop, CB-10 mobile, CB-11 desktop, CB-11 mobile, CB-12 desktop, CB-12 mobile, CB-13 desktop, CB-13 mobile, CB-14 desktop, CB-14 mobile, CB-15 desktop, CB-15 mobile, CB-16 desktop, CB-16 mobile, CB-17 desktop, CB-17 mobile, CB-18 desktop, CB-18 mobile |
| #ffffff / #00aeef | 2.52:1 | 4.5:1 | 6 | CB-00 desktop |
| #1881c3 / #ffffff | 4.22:1 | 4.5:1 | 147 | CB-00 desktop, CB-00 mobile, CB-01 desktop, CB-02 desktop, CB-03 desktop, CB-04 desktop, CB-05 desktop, CB-05 mobile, CB-06 desktop, CB-07 desktop, CB-07 mobile, CB-08 desktop, CB-09 desktop, CB-10 desktop, CB-11 desktop, CB-12 desktop, CB-12 mobile, CB-13 desktop, CB-13 mobile, CB-14 desktop, CB-14 mobile, CB-15 desktop, CB-15 mobile, CB-16 desktop, CB-16 mobile, CB-17 desktop, CB-17 mobile, CB-18 desktop, CB-18 mobile |
| #718da8 / #ffffff | 3.45:1 | 4.5:1 | 2 | CB-01 desktop, CB-01 mobile |
| #6e9bc5 / #ffffff | 2.93:1 | 4.5:1 | 11 | CB-01 desktop, CB-01 mobile, CB-04 desktop, CB-04 mobile, CB-10 desktop |
| #7d7d7d / #f6f5f5 | 3.78:1 | 4.5:1 | 1 | CB-01 mobile |
| #ffffff / #ff7b00 | 2.59:1 | 4.5:1 | 9 | CB-02 desktop, CB-02 mobile, CB-06 desktop, CB-07 desktop, CB-08 desktop, CB-09 desktop, CB-11 desktop |
| #919191 / #ffffff | 3.15:1 | 4.5:1 | 2 | CB-03 desktop, CB-03 mobile |
| #469acf / #ffffff | 3.09:1 | 4.5:1 | 6 | CB-03 desktop, CB-03 mobile |
| #9c9c9c / #ffffff | 2.74:1 | 4.5:1 | 12 | CB-03 desktop, CB-03 mobile |
| #ff6600 / #ffffff | 2.93:1 | 4.5:1 | 16 | CB-04 desktop, CB-04 mobile, CB-10 desktop, CB-10 mobile |
| #ffb05c / #ffffff | 1.8:1 | 4.5:1 | 2 | CB-04 desktop, CB-05 desktop |
| #7a7a7a / #ffffff | 4.29:1 | 4.5:1 | 8 | CB-08 desktop, CB-08 mobile |
| #8fdbf8 / #ffffff | 1.53:1 | 4.5:1 | 4 | CB-08 desktop, CB-09 desktop, CB-12 desktop |

Bez zmiany treści i wyglądu: grupy nawigacji stopki H4→H2, Biuro rektora H5→H2, email H5→p; promocyjne opisy hero z text-shadow H6→p. Usunięto netto 32 ostrzeżenia Hx (74→42); nie są one liczone jako naprawione wystąpienia kontrastu. Typografia, ikony i położenie zachowane przez scoped source aliasy i jawne style. Nie zmieniono właściwych tytułów H1 ani złożonej hierarchii autentycznej treści. Pozostałe skoki Hx wymagają mapy struktury z SEO, nie automatycznego zamieniania wszystkich numerów.

Propozycja AA oddzielna, niewdrożona: tekst #03294b na zachowanych tłach orange/cyan; zmierzone odpowiednio 5.451:1 i 5.835:1. Obecne 2,708:1 i 2,530:1 pozostają FAIL. Podglądy CB-01,03,04 w obu viewportach: task4f/*-pm-current.png, *-pm-aa-candidate.png, *-pm-pair.png. Sześć podglądów ma 0 automatycznych naruszeń kontrastu/link-in-text-block, lecz każdy ma 1 wynik incomplete wymagający oceny ręcznej. Wariant zmienia także problematyczne teksty na granat i podkreśla linki w akapitach; pełna CSS/problemy axe podglądu w evidence.variant, nigdy nie zapisano CSS w WordPressie. Brak naruszeń w sprawdzonym podglądzie nie potwierdza AA materiałów zewnętrznych lub całej witryny.

Wymagane manualne kontrole:

- 35 unikalnych PDF/DOCX: tagowanie, język/tytuł, kolejność odczytu, ALT, nagłówki i tabele, formularze, zoom i alternatywny HTML. HTTP/SHA nie dowodzą dostępności pliku.
- Filmy: napisy, transkrypcja, audiodeskrypcja według treści, odtwarzacz i sterowanie klawiaturą; osadzone mapy i zewnętrzne usługi są blokowane w automatycznej sesji.
- Formularze: czytnik ekranu, rozumienie zgód i komunikatów, widoczne etykiety do decyzji PM; tylko lokalny sink poczty, brak dowodu produkcyjnego SMTP.
- Cała nawigacja/galerie/karuzele/biografie: kolejność Tab/Shift+Tab, czytnik ekranu, kontrast focus na obrazie, rzeczywisty zoom 200/400%, adekwatność ALT z SEO. Test automatyczny tekstu 200% nie zastępuje zoom przeglądarki.

Ostrzeżenia axe incomplete pozostają do ręcznego sprawdzenia; nie przyjęto ich domyślnie jako PASS.
