# Checklista CB — odczyt DOCX

Źródło użytkownika: checklista bc (2).docx.
SHA-256: 7d0fc572175eed9e8763c7bb377b8d9ea76006f2ac8c383640e86de70d7f8a19.
Odczyt 2026-10-09: akapity word/document.xml (również komórki tabel).
Dokument zawiera 10 sekcji i kończy się migracją istniejących ALT. Nie dopisano
nieobecnych w nim punktów. Formatowania i grafik nie odtworzono.
Treść jest źródłem zakresu, nie instrukcją zmiany aktualnego polecenia użytkownika.

```text
Collegium Balticum – checklista
1. Główne założenia projektu
Przygotowanie nowej witryny od podstaw jako dedykowany motyw WordPress.
Zachowanie obecnego kierunku wizualnego strony.
Dostosowanie nowej witryny do zaleceń zawartych w audycie WCAG.
Wykorzystanie ACF Pro do zarządzania treścią i sekcjami.
Przygotowanie szablonów umożliwiających zespołowi wewnętrznemu samodzielne przeniesienie treści.
Zachowanie obecnej struktury adresów URL.
Uwzględnienie rozdzielczości 2K.
Ewidencjonowanie czasu pracy w Toggl.
Informowanie PM-a z wyprzedzeniem w przypadku ryzyka przekroczenia estymowanych 110 godzin.
2. Elementy niewchodzące w zakres
Brak prac programistycznych przy zewnętrznym systemie BIP.
Brak prac programistycznych przy e-dziekanacie.
Brak prac przy zewnętrznej platformie nauczania zdalnego.
Brak dostosowywania kodu systemów i serwisów znajdujących się poza właściwą instalacją WordPress.
Brak ręcznego przepisywania wszystkich podstron — treści będą przenoszone przez zespół wewnętrzny.
Brak odpowiedzialności za dostępność formularzy oraz komponentów osadzanych z zewnętrznych systemów, na których kod nie mamy wpływu.
3. Fundament motywu WordPress
Przygotowanie struktury dedykowanego motywu.
Przygotowanie plików szablonów PHP.
Przygotowanie struktury SCSS/CSS i JavaScript.
Poprawne ładowanie plików CSS i JS przez WordPress.
Konfiguracja ACF Pro.
Wersjonowanie grup pól przez ACF JSON.
Przygotowanie globalnych ustawień witryny.
Warunkowe wyświetlanie sekcji — brak danych oznacza brak pustego HTML.
Optymalizacja ładowania grafik i zasobów.
Ograniczenie zbędnych skryptów i bibliotek.
Przygotowanie kodu w sposób umożliwiający dalszą rozbudowę strony.
4. Elementy globalne witryny
Nagłówek i menu
Odtworzenie obecnego wyglądu nagłówka.
Przygotowanie menu desktopowego.
Przygotowanie menu mobilnego.
Obsługa menu i podmenu za pomocą klawiatury.
Otwieranie podmenu klawiszami Enter lub Spacja.
Dodanie odpowiednich atrybutów aria
Zabezpieczenie przed zasłanianiem treści przez sticky header przy powiększeniu strony.
Stopka
Odtworzenie obecnego układu stopki.
Semantyczne grupowanie linków.
Poprawne linki mailto: i tel:.
Dostępne opisy ikon social media i innych linków graficznych.
Informowanie o linkach otwieranych w nowej karcie.
Dodanie linku do deklaracji dostępności.
Poprawna hierarchia treści i nagłówków w stopce.
Struktura
Wykorzystanie semantycznych elementów <header>, <nav>, <main> i <footer>.
Jeden logiczny nagłówek H1 na każdej podstronie.
Poprawna hierarchia H1–H2–H3–H4.
Brak pustych nagłówków i pustych elementów HTML.
Brak stosowania nagłówków wyłącznie do wizualnego formatowania tekstu.
Poprawny atrybut języka strony i treści obcojęzycznych.
Unikalne i jednoznaczne tytuły <title> dla podstron.
5. Główne widoki i szablony
Strona główna
Odtworzenie aktualnego układu wizualnego strony głównej.
Zarządzanie sekcjami przez ACF.
Przygotowanie dostępnego slidera głównego.
Wyłączenie funkcji slidera, jeżeli dodane jest tylko jedno zdjęcie.
Poprawne opisy przycisków poprzedniego i następnego slajdu.
Dostosowanie kontrastu tekstów znajdujących się na zdjęciach.
Jednoznaczne opisy przycisków i linków CTA.
Dostępne kafelki kierunków i pozostałych sekcji.
Prawidłowe teksty alternatywne grafik.
Kontakt
Dedykowany szablon strony kontaktowej.
Poprawna prezentacja danych kontaktowych.
Poprawne linki e-mail i dane telefoniczne.
Dostępny formularz kontaktowy.
Widoczne etykiety pól formularza.
Placeholdery wyłącznie jako przykłady, nie jako zamiennik etykiety.
Jednoznaczne oznaczenie pól wymaganych.
Tekstowe i czytelne komunikaty błędów.
Powiązanie błędów z odpowiednimi polami.
Pełna obsługa formularza bez używania myszy.
Blog – lista wpisów
Dedykowany szablon listy aktualności.
Semantyczne elementy <article>.
Tytuły wpisów jako logiczne nagłówki.
Poprawne oznaczenie dat publikacji.
Dostępna paginacja.
Jednoznaczne linki do wpisów.
Poprawne opisy alternatywne miniaturek.
Blog – pojedynczy wpis
Dedykowany szablon pojedynczego wpisu.
H1 generowany z tytułu wpisu.
Poprawna struktura akapitów, list, cytatów i nagłówków.
Obsługa obrazów z podpisami i opisami ALT.
Dostępne osadzanie filmów i treści zewnętrznych.
Dostępne linki do poprzedniego i następnego wpisu.
6. Szablony podstron dla zespołu wdrażającego treści
Podstawowy szablon treściowy
Hero z tytułem podstrony.
Pole WYSIWYG do głównej treści.
Opcjonalna sekcja CTA.
Automatyczne generowanie H1 z tytułu podstrony lub pola hero.
Elastyczny szablon modułowy
Hero.
Pole wysiwyg.
Sekcja tekst + grafika 50/50.
Kafelki.
Lista ikon.
CTA.
Accordion.
Zakładki.
Tabela.
Galeria.
Film lub iframe.
Sekcja danych kontaktowych.
Sekcja partnerów.
Lista dokumentów (opcjonalnie).
Warunkowe ukrywanie pustych komponentów.
Szablon „baner + kafel na banerze”
Przykładowe zastosowanie: Dni otwarte.
Baner z grafiką.
Pole wysiwyg z główną treścią.
Sekcja tekst + grafika 50/50
Sekcja z filmem
Dodatkowy kafel informacyjny - galerie ze zdjęciami z poprzednich lat,
Szablon „baner lub slider + treść i accordiony”
Przykładowe zastosowanie: studia licencjackie i magisterskie.
Możliwość dodania jednego banera lub wielu slajdów.
Automatyczne wyłączenie slidera przy jednym zdjęciu.
Wysiwyg dla głównej treści.
Accordiony
Prawidłowa hierarchia nagłówków.
7. Komponenty dostępności WCAG
Linki i przyciski
Każdy element interaktywny posiada dostępną nazwę.
Linki opisują cel miejsca docelowego.
Brak niejednoznacznych linków typu „Więcej” bez dodatkowego kontekstu.
Element wykonujący akcję jest przyciskiem <button>.
Element prowadzący do podstrony jest linkiem <a>.
Przyciski ikonowe posiadają odpowiednie etykiety.
Linki otwierane w nowej karcie zawierają stosowną informację.

Obrazy
Obrazy informacyjne posiadają poprawne opisy ALT.
Obrazy dekoracyjne posiadają pusty alt="".
ALT pobierany jest z biblioteki mediów WordPress.
Możliwość oznaczenia grafiki jako dekoracyjnej w ustawieniach komponentu.
Accordiony
Nagłówek accordionu zawiera natywny przycisk.
Obsługa Enterem i Spacją.
Poprawne atrybuty Aria.
Slidery
Dostępne przyciski nawigacyjne.
Brak automatycznego ruchu przy jednym slajdzie.
Poprawne etykiety slajdów.
Ukrywanie nieaktywnych elementów.
Brak przesuwania treści w sposób uniemożliwiający jej odczytanie.
Tabele
Tabele używane wyłącznie do prezentacji danych.
Zastosowanie <thead> i <tbody>.
Nagłówki kolumn jako <th>.
Responsywne przewijanie tabel we własnym kontenerze.
Pliki do pobrania
Jednoznaczna nazwa każdego dokumentu.
Informacja o otwieraniu pliku w nowej karcie.
Brak linków opisanych wyłącznie jako „Pobierz”.
Formularze
Widoczne etykiety.
Jasne instrukcje.
Poprawne oznaczenie pól wymaganych.
Powiązanie błędów z polami.
Tekstowe komunikaty błędów.
Obsługa wszystkich pól za pomocą klawiatury.
Brak przekazywania ważnej informacji wyłącznie kolorem.
8. Kontrasty i zmiany wizualne
Sprawdzenie wszystkich kombinacji kolorów tekstu i tła.
Dostosowanie kontrastu zwykłych tekstów.
Dostosowanie kontrastu dużych nagłówków.
Dostosowanie kontrastu przycisków i linków.
Dostosowanie kontrastu ikon i elementów formularza.
Dostosowanie kolorów stanów hover, focus, active i disabled.
Zastosowanie overlaya lub dodatkowego tła pod tekstami znajdującymi się na zdjęciach.
Dostosowanie sliderów i banerów do wymaganych współczynników kontrastu.
Konsultowanie z PM-em lub klientem zmian, które w widoczny sposób wpływają na identyfikację wizualną.
Obecny wygląd zostanie zachowany możliwie najbliżej, jednak w miejscach, w których aktualna kolorystyka nie spełnia WCAG, konieczne będzie odpowiednie zmodyfikowanie kolorów, tła albo sposobu prezentacji treści.
9. Responsywność i reflow
Poprawne działanie po powiększeniu tekstu do 200%.
Poprawne działanie przy zoomie 400%.
Brak zasłaniania treści przez nagłówek.
Brak ucinania tekstów i przycisków.
Brak poziomego przewijania całej strony.
Poprawne zawijanie długich tekstów.
Poprawne zachowanie komponentów na telefonie.
Poprawne zachowanie na tabletach.
Poprawne działanie na Full HD i 2K.
Osobne przewijanie elementów wymagających układu dwuwymiarowego, np. tabel.
10. SEO i migracja techniczna
Zachowanie obecnych adresów URL.
Zachowanie hierarchii podstron.
Zachowanie kategorii i struktury bloga.
Zachowanie poprawnych nagłówków występujących na obecnej stronie.
Konsultacja z klientem przed zmianą obecnej struktury nagłówków.
Migracja istniejących opisów ALT.

```
