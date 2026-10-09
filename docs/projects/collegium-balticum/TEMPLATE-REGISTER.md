# Rejestr szablonów CB — zadanie 3

Stan: kod i ACF wdrożone do izolowanego WP, referencje wizualne BLOCKED. Każdy wymagany URL otwarto przez web i próbowano otworzyć Chromium przy 1440×900 i 390×844, DPR=1. Web dostarcza tekst z cache o różnych datach; nie dowodzi stanu UI, geometrii ani aktualnych redirect/canonical. Wszystkie 38 prób Chromium: timeout 15000 ms, brak PNG. [Dokładne błędy](REFERENCE-ACCESS.json). CB-03: web Internal Error; CB-07: ekran ochronny.

W kolumnie lokalny URL „—” oznacza brak konkretnej strony CB. Planowana baza to http://localhost:8000 z zachowaniem ścieżki źródłowej; nie jest dowodem utworzenia strony. Działające adresy testów są w [QA](TEMPLATE-QA.md), jawnie oznaczone jako fixtures. TEMPLATE=IN_PROGRESS, CONTENT=TODO dla wszystkich pozycji. Schema ACF i runtime nie oznaczają gotowości visual QA.

| ID CB | Produkcyjny URL | Lokalny URL | Szablon | ACF gotowe | Visual reference | Uwagi |
| --- | --- | --- | --- | --- | --- | --- |
| CB-00 | [LIVE](https://www.cb.szczecin.pl/) | — (kolejny etap) | front-page.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: wieloslajdowe komunikaty rekrutacyjne, oferta kierunków, tekst o uczelni, wpisy dzielone na kategorie; wspólne menu i stopka. |
| CB-01 | [LIVE](https://www.cb.szczecin.pl/kontakt/) | — (kolejny etap) | template-contact.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: miasta, działy, osoby, adresy, godziny i dane kontaktowe. Dwa poziomy przełączania miasta/działy wynikają z odczytu i audytu. |
| CB-02 | [LIVE](https://www.cb.szczecin.pl/category/wpisy/blog-post/) | — (kolejny etap) | archive.php | JSON + runtime QA / dane natywne | BLOCKED: timeout desktop/mobile | Tekst: lista datowanych kart, linki kategorii, wyszukiwarka i paginacja. Natywny main query WordPress zachowuje archiwum kategorii. |
| CB-03 | [LIVE](https://www.cb.szczecin.pl/wpisy/blog-post/dietetyka-licencjacka-i-magisterska-czym-roznia-sie-programy-i-perspektywy-zawodowe/) | — (kolejny etap) | single.php | JSON + runtime QA / dane natywne | BLOCKED: timeout desktop/mobile | Narzędzie web zwróciło Internal Error przy dwóch próbach dokładnego URL; aktualna treść i Hx niepotwierdzone. Szablon dynamiczny bez kopiowania artykułu. |
| CB-04 | [LIVE](https://www.cb.szczecin.pl/rekrutacja/) | — (kolejny etap) | template-banner-tile.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: oferta stopni, filmy, warunki i dokumenty rekrutacji, promocje oraz sekcja życia studenckiego. Kafel na banerze wymagany zleceniem; położenie niezweryfikowane. |
| CB-05 | [LIVE](https://www.cb.szczecin.pl/dni-otwarte/) | — (kolejny etap) | template-banner-tile.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: wprowadzenie, harmonogram, kontakt/zapisy i galerie poprzednich lat. Kafel na banerze wymagany zleceniem; układ zdjęć i wideo do referencji. |
| CB-06 | [LIVE](https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/) | — (kolejny etap) | template-banner-accordion.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: wprowadzenie, kierunki i informacje o studiach I stopnia. Banner/accordion wymagane zleceniem. |
| CB-07 | [LIVE](https://www.cb.szczecin.pl/tryb-studiow/studia-magisterskie/) | — (kolejny etap) | template-banner-accordion.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Narzędzie web zwróciło One moment, please… — ochronę dostępu. Rodzina banner/accordion wynika z obowiązkowego zlecenia, nie udanego audytu źródła. |
| CB-08 | [LIVE](https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/studia-nienauczycielskie/fitodietetyka/) | — (kolejny etap) | template-course.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: parametry opłat/czasu, opis, partner kierunku, kierownik i biogramy, cele i efekty kształcenia. Wymaga podsumowania oferty i modułów treści. |
| CB-09 | [LIVE](https://www.cb.szczecin.pl/tryb-studiow/studia-online/) | — (kolejny etap) | template-flexible.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: oferta formuły hybrydowej, link materiału informacyjnego, kierunki i listy zasad/korzyści. |
| CB-10 | [LIVE](https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/) | — (kolejny etap) | template-flexible.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: H1, grafika z wprowadzeniem, długi opis oferty i promocje. Lista ofert: otwarte przed zamkniętymi według wymagań PM. |
| CB-11 | [LIVE](https://www.cb.szczecin.pl/mediator-sadowy/) | — (kolejny etap) | template-course.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: cena kursu, korzyści, cennik, terminarz i program; zgłoszenie mailowe. Reużycie oferty i accordionów. |
| CB-12 | [LIVE](https://www.cb.szczecin.pl/szkolenia-rad-pedagogicznych/) | — (kolejny etap) | template-flexible.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: opis szkoleń, lista tematów, eksperci i kontakt/zapisy. Bio dostępne w zwykłej treści lub 50/50 bez nowego modelu kadry. |
| CB-13 | [LIVE](https://www.cb.szczecin.pl/przeniesienie-z-innej-uczelni/) | — (kolejny etap) | template-basic.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: H1, warunki transferu, podanie, instrukcja formalności i kontakt BOS. WYSIWYG z semantycznymi listami plus pliki/kontakt. |
| CB-14 | [LIVE](https://www.cb.szczecin.pl/reaktywuj-sie-w-prawach-studenta-w-collegium-balticum/) | — (kolejny etap) | template-basic.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: H1, warunki reaktywacji, podanie, opis decyzji/umowy i kontakt. Wspólny basic z opcjonalnymi modułami. |
| CB-15 | [LIVE](https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/) | — (kolejny etap) | template-flexible.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: grafika wsparcia, opis procedury i jej dokument, podstawy i lista kanałów kontaktu. |
| CB-16 | [LIVE](https://www.cb.szczecin.pl/strefa-studenta/legitymacja-studencka/) | — (kolejny etap) | template-flexible.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: grafika legitymacji, sekcje tradycyjnej i elektronicznej, instrukcja i email BOS. |
| CB-17 | [LIVE](https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/) | — (kolejny etap) | template-flexible.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: logo/obraz, opis programu, listy, cztery grupy dokumentów i kontakt. Tabele załączników można oddać modułem documents lub table. |
| CB-18 | [LIVE](https://www.cb.szczecin.pl/strefa-studenta/biblioteka/wypozyczenie-na-zamowienie/) | — (kolejny etap) | template-basic.php | JSON + runtime QA | BLOCKED: timeout desktop/mobile | Tekst: breadcrumb i H1, treść zasad wypożyczeń, kontakt biblioteki oraz partnerzy. Odczyt pochodzi z cache sprzed siedmiu miesięcy. |

## Analiza per URL i ponowne użycie

### CB-00

Źródło: [produkcja](https://www.cb.szczecin.pl/). Tekst: wieloslajdowe komunikaty rekrutacyjne, oferta kierunków, tekst o uczelni, wpisy dzielone na kategorie; wspólne menu i stopka.

Interakcje / weryfikacja: Slider, zakładki wiadomości, linki kierunków. Potwierdzenie stanów/geometrii wymaga przeglądarki.

ACF: mwf_hero, mwf_sections. Moduły: tiles, image_text, news, tabs, partners. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-01

Źródło: [produkcja](https://www.cb.szczecin.pl/kontakt/). Tekst: miasta, działy, osoby, adresy, godziny i dane kontaktowe. Dwa poziomy przełączania miasta/działy wynikają z odczytu i audytu.

Interakcje / weryfikacja: Zakładki miast i działów; tel/mailto; formularz: Q-06 backend i zgody nadal nieustalone.

ACF: mwf_hero, mwf_sections, mwf_contact_cities, kontakt.form (istniejące). Moduły: contact, tabs, media. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-02

Źródło: [produkcja](https://www.cb.szczecin.pl/category/wpisy/blog-post/). Tekst: lista datowanych kart, linki kategorii, wyszukiwarka i paginacja. Natywny main query WordPress zachowuje archiwum kategorii.

Interakcje / weryfikacja: Linki wpisów, kategorie, wyszukiwanie, paginacja.

ACF: Natywne post/term/media/Yoast; bez zbędnych pól. Moduły: natywna pętla WordPress. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-03

Źródło: [produkcja](https://www.cb.szczecin.pl/wpisy/blog-post/dietetyka-licencjacka-i-magisterska-czym-roznia-sie-programy-i-perspektywy-zawodowe/). Narzędzie web zwróciło Internal Error przy dwóch próbach dokładnego URL; aktualna treść i Hx niepotwierdzone. Szablon dynamiczny bez kopiowania artykułu.

Interakcje / weryfikacja: Natywne linki, obrazy, listy/cytaty/Hx, poprzedni/następny wpis; wymagany ponowny odczyt.

ACF: Natywne post/term/media/Yoast; bez zbędnych pól. Moduły: natywna pętla WordPress. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-04

Źródło: [produkcja](https://www.cb.szczecin.pl/rekrutacja/). Tekst: oferta stopni, filmy, warunki i dokumenty rekrutacji, promocje oraz sekcja życia studenckiego. Kafel na banerze wymagany zleceniem; położenie niezweryfikowane.

Interakcje / weryfikacja: Linki rekrutacji i dokumentów, wideo, zakładki; zewnętrzna rekrutacja pozostaje linkiem.

ACF: mwf_hero, mwf_sections, mwf_overlay. Moduły: tiles, media, wysiwyg, cta, documents, tabs, contact. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-05

Źródło: [produkcja](https://www.cb.szczecin.pl/dni-otwarte/). Tekst: wprowadzenie, harmonogram, kontakt/zapisy i galerie poprzednich lat. Kafel na banerze wymagany zleceniem; układ zdjęć i wideo do referencji.

Interakcje / weryfikacja: Link formularza zewnętrznego i galerie; bez wysyłania danych na LIVE.

ACF: mwf_hero, mwf_sections, mwf_overlay. Moduły: wysiwyg, image_text, cta, media, gallery, contact. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-06

Źródło: [produkcja](https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/). Tekst: wprowadzenie, kierunki i informacje o studiach I stopnia. Banner/accordion wymagane zleceniem.

Interakcje / weryfikacja: Natywne details/summary; slider tylko gdy więcej niż jeden slajd; stany LIVE nieodczytane.

ACF: mwf_hero, mwf_sections. Moduły: wysiwyg, accordion, cta, documents. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-07

Źródło: [produkcja](https://www.cb.szczecin.pl/tryb-studiow/studia-magisterskie/). Narzędzie web zwróciło One moment, please… — ochronę dostępu. Rodzina banner/accordion wynika z obowiązkowego zlecenia, nie udanego audytu źródła.

Interakcje / weryfikacja: Do ponownego odczytu; brak potwierdzenia liczby obrazów i paneli.

ACF: mwf_hero, mwf_sections. Moduły: wysiwyg, accordion, cta, documents. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-08

Źródło: [produkcja](https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/studia-nienauczycielskie/fitodietetyka/). Tekst: parametry opłat/czasu, opis, partner kierunku, kierownik i biogramy, cele i efekty kształcenia. Wymaga podsumowania oferty i modułów treści.

Interakcje / weryfikacja: Link zapisu, kontakt kierownika, szczegóły oferty; forma paneli i pozycja zdjęć do referencji.

ACF: mwf_hero, mwf_sections, mwf_course. Moduły: wysiwyg, image_text, accordion, contact, partners, documents. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-09

Źródło: [produkcja](https://www.cb.szczecin.pl/tryb-studiow/studia-online/). Tekst: oferta formuły hybrydowej, link materiału informacyjnego, kierunki i listy zasad/korzyści.

Interakcje / weryfikacja: Linki kierunków, materiał informacyjny; osadzenia i geometria wymagają referencji.

ACF: mwf_hero, mwf_sections. Moduły: wysiwyg, media, cta, tiles. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-10

Źródło: [produkcja](https://www.cb.szczecin.pl/tryb-studiow/studia-podyplomowe/). Tekst: H1, grafika z wprowadzeniem, długi opis oferty i promocje. Lista ofert: otwarte przed zamkniętymi według wymagań PM.

Interakcje / weryfikacja: Status ręczny open/closed lub nieustalony; stabilne sortowanie w module tiles. Źródło statusów do PM.

ACF: mwf_hero, mwf_sections. Moduły: image_text, wysiwyg, tiles, tabs, cta, contact, documents. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-11

Źródło: [produkcja](https://www.cb.szczecin.pl/mediator-sadowy/). Tekst: cena kursu, korzyści, cennik, terminarz i program; zgłoszenie mailowe. Reużycie oferty i accordionów.

Interakcje / weryfikacja: Mailto, pliki/terminarz; daty źródłowe historyczne — nie aktualizować samodzielnie.

ACF: mwf_hero, mwf_sections, mwf_course. Moduły: wysiwyg, accordion, documents, contact, cta. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-12

Źródło: [produkcja](https://www.cb.szczecin.pl/szkolenia-rad-pedagogicznych/). Tekst: opis szkoleń, lista tematów, eksperci i kontakt/zapisy. Bio dostępne w zwykłej treści lub 50/50 bez nowego modelu kadry.

Interakcje / weryfikacja: Kontakt email/tel, CTA; wspólne encje kadry nadal wymagają specyfikacji.

ACF: mwf_hero, mwf_sections. Moduły: wysiwyg, image_text, contact, cta. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-13

Źródło: [produkcja](https://www.cb.szczecin.pl/przeniesienie-z-innej-uczelni/). Tekst: H1, warunki transferu, podanie, instrukcja formalności i kontakt BOS. WYSIWYG z semantycznymi listami plus pliki/kontakt.

Interakcje / weryfikacja: Pobranie podania i email; zachować hierarchię Hx po akceptacji.

ACF: mwf_hero, mwf_sections, mwf_content, mwf_cta. Moduły: documents, contact, cta. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-14

Źródło: [produkcja](https://www.cb.szczecin.pl/reaktywuj-sie-w-prawach-studenta-w-collegium-balticum/). Tekst: H1, warunki reaktywacji, podanie, opis decyzji/umowy i kontakt. Wspólny basic z opcjonalnymi modułami.

Interakcje / weryfikacja: Pobranie dokumentu i email; bez nowego osobnego partiala.

ACF: mwf_hero, mwf_sections, mwf_content, mwf_cta. Moduły: documents, contact, cta. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-15

Źródło: [produkcja](https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/). Tekst: grafika wsparcia, opis procedury i jej dokument, podstawy i lista kanałów kontaktu.

Interakcje / weryfikacja: Dokument procedury i kontakty; źródłowy ALT znany tekstowo, transfer mediów w kolejnym etapie.

ACF: mwf_hero, mwf_sections. Moduły: image_text, wysiwyg, documents, contact. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-16

Źródło: [produkcja](https://www.cb.szczecin.pl/strefa-studenta/legitymacja-studencka/). Tekst: grafika legitymacji, sekcje tradycyjnej i elektronicznej, instrukcja i email BOS.

Interakcje / weryfikacja: Mailto; nie tworzyć formularza wydania legitymacji ani integracji.

ACF: mwf_hero, mwf_sections. Moduły: image_text, wysiwyg, contact, media. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-17

Źródło: [produkcja](https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/). Tekst: logo/obraz, opis programu, listy, cztery grupy dokumentów i kontakt. Tabele załączników można oddać modułem documents lub table.

Interakcje / weryfikacja: Pliki PL/EN, linki partnerskie i kontakt. ALT i metadane dokumentów wymagają źródeł/QA.

ACF: mwf_hero, mwf_sections. Moduły: image_text, wysiwyg, table, documents, contact. Reużycie: grid gc/gr, spacing utilities, shared factory sections, partials/section-image.php. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.

### CB-18

Źródło: [produkcja](https://www.cb.szczecin.pl/strefa-studenta/biblioteka/wypozyczenie-na-zamowienie/). Tekst: breadcrumb i H1, treść zasad wypożyczeń, kontakt biblioteki oraz partnerzy. Odczyt pochodzi z cache sprzed siedmiu miesięcy.

Interakcje / weryfikacja: Mailto i linki partnerów; zachować nadrzędną hierarchię biblioteki.

ACF: mwf_hero, mwf_sections, mwf_content, mwf_cta. Moduły: contact, partners. Reużycie: grid gc/gr, spacing utilities, shared factory sections. Hero/kolory/fonty/RWD/stany wymagają referencji; nie potwierdzono ich na podstawie tekstu.


Aktualne sześć niezależnych statusów po naprawie 3A: [TASK-3A-REGISTER](TASK-3A-REGISTER.md). Historyczne referencje zadania 3 pozostawiono w JSON.
