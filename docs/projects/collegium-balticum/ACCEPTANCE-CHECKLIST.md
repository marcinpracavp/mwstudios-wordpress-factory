# CB — checklista implementacji i odbioru po analizie załączników

Status wszystkich pozycji: TODO. Przeczytany audyt nie oznacza naprawionej
witryny. Wymagane dowody lokalnego wdrożenia; PAGES nadal ma osobne
TEMPLATE/CONTENT. Odczyt audytu: tekst wszystkich 83 stron PDF, 2026-10-09.
Numer strony w tabeli oznacza stronę pliku PDF (okładka = 1), nie drukowaną
paginację raportu, która jest przesunięta o jedną stronę.

Źródła: [audyt — pełny odczyt tekstowy](sources/AUDIT-TEXT.md),
[checklista DOCX — pełny odczyt](sources/CHECKLIST-TEXT.md),
[ustalenia PM](PM-DECISIONS.md). Uzupełnienia dotyczą braków briefu, a nie
automatycznego rozszerzenia migracji o wszystkie strony badane w audycie.

## Kontrole i dowody

| ID | Wymaganie / brakująca opcja | Źródło | Odbiór / odpowiedzialność |
| --- | --- | --- | --- |
| QA-01 | Menu desktop/mobile i podmenu: Tab, Enter/Spacja, Escape, stan rozwinięcia, focus bez pułapki | PDF 5–6; DOCX 4 | Developer: realna klawiatura i czytnik, poprawne kontrolki; rodzaj nawigacji nie wymusza role=menu. |
| QA-02 | Header/nav/main/footer i aside tylko dla treści pobocznej; skip link działa i przenosi focus | PDF 6–9; DOCX 4 | Developer: landmarki i kolejność czytnika; istniejący element docelowy kotwicy. |
| QA-03 | Sticky header nie zasłania treści ani focusu przy reflow/zoom | PDF 7–8; DOCX 9 | Developer: 320 CSS px, tekst 200%, zoom 400%; bez maskowania overflow. |
| QA-04 | Jeden logiczny H1, edytowalne Hx, brak pustych nagłówków i nagłówków użytych do stylowania | PDF 10, 37–38, 51–52, 61–62, 70–71; DOCX 4–6 | Developer i Virtual; źródłowy Hx + propozycja korekty + decyzja klienta/PM. |
| QA-05 | Unikalny opisowy title; odpowiedni lang strony i treści obcojęzycznej | PDF 11–12, 49–50, 75; DOCX 4 | Developer/SEO/Virtual: title z WP/Yoast; lang w DOM po zmianie języka, bez wymuszania Polylang. |
| QA-06 | Nazwy linków/przycisków, CTA, social i wyboru języka; widoczna etykieta zawarta w dostępnej nazwie | PDF 8–9, 16–18, 71–72; DOCX 7 | Developer: accessibility tree, kontekst „Więcej”; natywne a dla przejścia, button dla działania. |
| QA-07 | Nowa karta zapowiedziana; poprawne pojedyncze mailto/tel z kontekstem osoby/działu | PDF 19, 48, 68–69; DOCX 4 | Developer/Virtual: przegląd href/target i odczyt czytnikiem, bez pustych/zagnieżdżonych linków. |
| QA-08 | Obraz informacyjny korzysta ze źródłowego ALT, dekoracja jawnie alt=""; opcja dekoracyjności modułu | PDF 9–10, 40, 61, 66–67, 74; DOCX 7 | Developer zachowuje biblioteczny ALT; brak/nieadekwatny opis do SEO. Nie zgadywać ALT z nazwy pliku. |
| QA-09 | Formularz kontaktowy: widoczne label, wymagane pola, zgody, instrukcje, błędy powiązane z polem | PDF 71–75; DOCX 5/7 | Developer: klawiatura/czytnik, błędne dane w izolowanym środowisku; placeholder nie zastępuje label. |
| QA-10 | Zmiany dynamiczne/statusy anonsowane bez nieoczekiwanej utraty focusu | PDF 27–29, 82 | Developer: region status/live tylko tam, gdzie potrzebny; test czytnikiem. Przykład rekrutacji w PDF nie włącza Kalasoft do zakresu. |
| QA-11 | Kontakt: miasta i działy przełączane klawiaturą; aktywna zakładka/panel powiązane | PDF 73–74; DOCX 5/7 | Developer: realne taby i logiczny focus; ukryte panele bez fokusowalnych elementów. |
| QA-12 | Accordiony mają przycisk lub natywne details/summary, stan i semantyczną treść | PDF 52–53, 61–62; DOCX 7 | Developer: każdy panel Enter/Spacja, czytnik; reużycie wspólnego modułu. |
| QA-13 | Slidery: statycznie przy jednym obrazie, nazwane sterowanie, brak focusu w nieaktywnych slajdach | DOCX 5/7; PDF 16–18 | Developer: przypadki 0/1/wiele, obsługa klawiaturą, reduced motion; jeśli ruch automatyczny, możliwość pauzy/zatrzymania. |
| QA-14 | Tabele danych: th i powiązanie nagłówków, thead/tbody, opis/caption gdy potrzebny | PDF 41–42; DOCX 7 | Developer/Virtual: czytnik identyfikuje kolumnę/wiersz; lokalny scroll przy potrzebie dwóch wymiarów, nie tabela do layoutu. |
| QA-15 | Dokumenty: nazwa z kontekstem, grupowanie, format i rzeczywisty rozmiar; informacja o nowej karcie | PDF 34–39, 63, 65–66; DOCX 7 | Developer/Virtual: attachment MIME/filesize; dla zewnętrznego pliku ustalić dane, nie wymyślać MB. |
| QA-16 | Stan dostępności dokumentu i alternatywa; brak automatycznej deklaracji „dostępny” | PDF 39 | Właściciel dokumentów/Virtual: dowód kontroli PDF/DOCX, alternatywna treść lub procedura; developer zapewnia prezentację. Remediacja całej biblioteki do osobnego ustalenia. |
| QA-17 | Listy instrukcji/dokumentów/specjalizacji semantyczne; brak pustych li/p i odstępów robionych treścią | PDF 43, 54, 60, 75–76; DOCX 4/7 | Developer/Virtual: ul/ol, HTML validation; nie kopiować błędnego markupu produkcji do nowego motywu. |
| QA-18 | Wideo/iframe: opisowy title, brak autoplay, sterowanie dostępne | PDF 50–51; DOCX 5/6 | Developer: kontrola embed i klawiatury; zewnętrznego kodu nie naprawiamy, ograniczenia raportujemy. |
| QA-19 | Napisy, audiodeskrypcja/alternatywa i transkrypcja stosownie do materiału | PDF 50–51 | Właściciel mediów dostarcza materiały; developer obsługuje ich prezentację. Transkrypcja nie zastępuje automatycznie wymaganych napisów czy audiodeskrypcji. |
| QA-20 | Kontrast faktycznych kolorów/tła, także tekstu na zdjęciach i stanów hover/focus/active | PDF 12–15, 42, 55, 70–73; DOCX 8 | Developer: tekst 4.5:1, duży tekst 3:1, wymagane elementy nietekstowe 3:1; pomiar zamiast kopiowania przybliżeń z PDF. Istotne zmiany do PM. |
| QA-21 | Status rekrutacji i błędy nie są przekazywane wyłącznie kolorem | PDF 27, 58–59; PM 15 lipca | Developer: tekstowe etykiety i kontrast; zamknięta oferta nadal czytelna/klikalna. |
| QA-22 | Responsywność mobile/tablet/Full HD/2K, długie teksty i odstępy tekstu bez utraty treści | DOCX 9; brief | Developer: macierz do 2560 px jako propozycja 2K, 320 CSS px, 200% tekst, 400% zoom; tekst spacing wg 1.4.12. |
| QA-23 | Reduced motion i sterowanie ruchem, brak pułapek klawiatury, treści hover dostępne również po focus | Brief; uzupełnienie WCAG 2.1 AA | Developer: realne interakcje i preferencje użytkownika, nie tylko screenshot przy wyłączonych animacjach. |
| QA-24 | Deklaracja dostępności: widoczny link i prawidłowa struktura treści | PDF 76–81; DOCX 4 | Developer: link w stopce. PM/właściciel treści: stan zgodności, daty, kontakt, skargi, a11y-* i time/datetime wg zatwierdzonego wzoru; zakres tworzenia samej strony do decyzji Q-14. |
| QA-25 | ACF/moduły: hero/WYSIWYG/CTA, 50/50, kafle, lista ikon, taby, galeria, pliki, partnerzy, kontakt | DOCX 6 | Developer: edytowalne dane i warunkowy markup, reużywalne partiale; nie wymagać od Virtual ręcznego HTML dla podstawowych modułów. |
| QA-26 | Dni otwarte/rekrutacja: baner z kaflem, treść, 50/50, wideo i galeria poprzednich lat według faktycznego LIVE | DOCX 6; PM 9 lipca | Developer: ustalić kompozycję na źródle, nie tworzyć osobnego szablonu dla każdego wariantu. |
| QA-27 | Blog: article, semantyczne daty time, paginacja, podpisy grafik, poprzedni/następny wpis | DOCX 5 | Developer: natywny WP i rzeczywisty wpis do testu, archiwum kategorii zgodne ze źródłem. |
| QA-28 | URL/parent/kategorie/Yoast/ALT zachowane; dev nieindeksowany | DOCX 10; PM 8–9 lipca; brief | Developer/SEO/Virtual: eksport/import i porównanie danych, brak obietnicy z samego publicznego HTML. |
| QA-29 | Nabór/sortowanie, dwie grupy promocji, foto/bio kadry, prezentacja sylabusów | PM 15–17 lipca | Odbiór według MODULES po specyfikacji; status treści i wdrożenia pozostaje TODO. |
| QA-30 | Build, PHP lint dla zmian PHP, visual QA pełnej strony, ręczny czytnik i klawiatura, raport i Toggl | DOCX 1/3; brief | Developer: aktualne dowody dla wszystkich obowiązkowych tras; Virtual instrukcja dodawania dostępnych treści. Brak dostępu Toggl nie jest zapisanym czasem. |

## Granice i korekty interpretacji PDF

PDF opisuje stan z czerwca 2025, nie dowodzi aktualnych usterek każdego URL.
Audytowana próbka jest szersza i inna od rejestru implementacji. BIP/e-Dziekanat
i nauczanie zdalne pozostają poza zakresem kodu; własne linki/etykiety do nich
podlegają kontroli. Strony wewnętrzne spoza rejestru obsługuje Virtual po ustaleniu
odpowiedzialności, nie automatyczny import 300 stron/1000 wpisów.

Raport miesza poziomy i wersje standardu. Według
[WCAG 2.1 W3C](https://www.w3.org/TR/WCAG21/): 4.1.3 jest już kryterium AA
w 2.1; 2.4.9, 2.4.10 i 3.2.5 są AAA; 2.4.7 jest AA; 3.2.2 dotyczy zmiany po
wprowadzeniu danych, a spójność nawigacji opisuje 3.2.3. Cel projektu pozostaje
2.1 AA; nie przyjmować automatycznie 2.2, AAA ani tez prawnych audytu jako
nowego zobowiązania. Wymagania dodatkowe briefu nadal obowiązują.

Widoczny tekst może już stanowić dostępną nazwę przycisku/linku; brak aria-label
sam w sobie nie dowodzi błędu. Preferować natywny HTML i unikać ARIA
nadpisującego etykietę, zgodnie z [W3C APG](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/).
Nie kopiować hurtowo role/aria z przykładowego kodu PDF. Nie oznaczać logo
dekoracją bez oceny funkcji. Dostępność dokumentu lub filmu wymaga dowodów,
a wyłączenie z prac programistycznych nie oznacza zgodności całej witryny.

Ta lista mapuje przekazane źródła i uzupełnienia; nie zastępuje pełnego audytu
wszystkich mających zastosowanie kryteriów WCAG 2.1 A/AA ani formalnego odbioru.
