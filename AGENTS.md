# Slawinsky Boilerplate — zasady implementacji MWStudios

## Cel projektu

To jest klasyczny, dedykowany motyw WordPress oparty na PHP, ACF, SCSS,
JavaScript i Webpack 5.

Projekt jest rozwijany lokalnie w LocalWP.

Figma jest źródłem projektu wizualnego, ale kod z Figma nie może być
bezpośrednio kopiowany jako finalny kod produkcyjny.

## Podstawowy stack

- WordPress
- PHP templates
- ACF / ACF Pro
- SCSS
- Vanilla JavaScript
- Webpack 5
- BrowserSync
- opcjonalnie AOS
- opcjonalnie Swiper
- opcjonalnie Contact Form 7
- opcjonalnie WooCommerce
- opcjonalnie Polylang

Nie zakładaj, że Polylang, WooCommerce, AOS, Swiper lub Contact Form 7
są używane. Najpierw sprawdź projekt.

Nie instaluj nowych zależności bez wyraźnej potrzeby.

## Istniejąca struktura

- główny SCSS: src/css/style.scss
- główny JavaScript: src/js/_app.js
- biblioteki JavaScript: src/js/lib/_libraries.js
- partiale PHP: partials/
- assety źródłowe: assets/
- pliki wynikowe Webpack: dist/
- konfiguracja LocalWP: config/development.js
- grupy ACF Local JSON: acf-json/

Nie edytuj ręcznie plików wygenerowanych w dist/.

## Istniejący system layoutu

Projekt posiada własny system grid.

Dostępne są klasy:

- gc-X/Y — zakres kolumn
- gr-X/Y — zakres wierszy
- gc-xs-X/Y
- gc-sm-X/Y
- gc-md-X/Y
- gc-lg-X/Y
- gc-xl-X/Y
- gr-xs-X/Y
- gr-sm-X/Y
- gr-md-X/Y
- gr-lg-X/Y
- gr-xl-X/Y

Dostępne są również:

- align-center
- align-start
- align-end
- justify-center
- justify-start
- justify-end

Przed utworzeniem własnego CSS Grid sprawdź, czy układ można wykonać
istniejącymi klasami gc, gr, align i justify.

## Istniejący system odstępów

Projekt posiada responsywne klasy odstępów.

Dostępne klasy:

- mt-X
- mb-X
- ml-X
- mr-X
- pt-X
- pb-X
- pl-X
- pr-X
- mx-X
- my-X
- px-X
- py-X
- m-X
- p-X

Dostępne wartości:

- 30
- 40
- 50
- 60
- 70
- 80
- 90
- 100
- 110
- 120
- 130
- 140
- 150

Dostępne klasy odstępów między elementami:

- gap-X
- row-gap-X
- column-gap-X
- gap-sm-X
- gap-md-X
- gap-lg-X
- row-gap-sm-X
- row-gap-md-X
- column-gap-sm-X
- column-gap-md-X

Przed zapisaniem margin, padding lub gap w SCSS sprawdź, czy można
wykorzystać istniejącą klasę utility.

Nie twórz duplikatów istniejących klas utility.

## Reużywalne partiale

Przed utworzeniem nowego partiala zawsze sprawdź katalog partials/.

W projekcie istnieje między innymi partial:

- partials/section-image.php

Obsługuje on:

- obraz ACF,
- treść HTML,
- przycisk ACF,
- opcjonalne tło,
- section_id,
- section_class,
- container_class,
- image_class,
- content_class,
- button_class.

Jeżeli sekcja z Figma przedstawia obraz i treść obok siebie, najpierw
spróbuj wykorzystać section-image.php.

Nie twórz nowego partiala tylko dlatego, że sekcja ma inne kolory,
odstępy lub proporcje kolumn. Najpierw sprawdź, czy wystarczy przekazać
inne klasy i argumenty.

Nowy partial można utworzyć, gdy:
- struktura HTML rzeczywiście jest inna,
- sekcja ma inne zachowanie,
- istniejący partial wymagałby wielu wyjątków,
- komponent będzie wykorzystywany ponownie.

## Zasady implementacji Figma

Przed implementacją:

1. pobierz kontekst przez Figma MCP,
2. przeanalizuj strukturę repozytorium,
3. sprawdź istniejące partiale,
4. sprawdź istniejące klasy utility,
5. sprawdź istniejące style i moduły JavaScript,
6. przedstaw krótki plan zmian.

Nie generuj finalnego kodu w React ani Tailwind.

Finalny kod ma być przygotowany jako:
- semantyczny PHP/HTML dla WordPressa,
- SCSS zgodny z istniejącym motywem,
- JavaScript tylko wtedy, gdy sekcja wymaga zachowania interaktywnego.

Nie kopiuj absolutnego pozycjonowania z Figma, jeżeli układ można
odtworzyć przez grid lub flexbox.

Nie przenoś do kodu nazw typu:
- Frame 123
- Group 44
- Rectangle 18

Stosuj nazwy opisujące znaczenie elementu.

## PHP i WordPress

- zwykły tekst: esc_html()
- atrybuty: esc_attr()
- adresy URL: esc_url()
- treść WYSIWYG: wp_kses_post()
- obrazy WordPress: wp_get_attachment_image()
- template parts: get_template_part()

Nie hardkoduj adresów do wp-content/uploads.

Nie używaj esc_html() dla treści pochodzącej z pola WYSIWYG, jeżeli
treść ma zachować znaczniki HTML.

Nie umieszczaj rozbudowanego markupu wielokrotnie w różnych template'ach.
Wspólny markup powinien znaleźć się w partialu.

Strona powinna posiadać jeden logiczny H1.

## ACF

Najpierw sprawdź istniejące pola i pliki acf-json.

Nie twórz pól ACF automatycznie bez przedstawienia ich struktury.

Przed utworzeniem pól podaj:
- nazwę pola,
- field name,
- typ pola,
- wartość zwracaną,
- lokalizację grupy.

Pola mają być nazwane spójnie i czytelnie.

## SCSS

- najpierw wykorzystuj istniejące klasy utility,
- nie duplikuj grida i systemu spacing,
- nie zapisuj stylów w dist/,
- unikaj !important,
- nie dodawaj globalnego selektora, gdy zmiana dotyczy jednej sekcji,
- zachowuj istniejącą konwencję nazewnictwa projektu,
- wykorzystuj istniejące breakpointy i mixiny,
- nie dodawaj nowego breakpointu bez sprawdzenia obecnych.

SCSS powinien zawierać głównie:
- wygląd charakterystyczny dla komponentu,
- kolory,
- typografię,
- tła,
- dekoracje,
- zachowania responsywne, których nie pokrywają utility classes.

## JavaScript

Nie dodawaj JavaScriptu, jeżeli efekt można wykonać w CSS.

Nie dodawaj skryptów inline do plików PHP.

Przed utworzeniem nowego mechanizmu sprawdź src/js/_app.js i istniejące
moduły.

AOS, sticky header, menu mobilne, accordion, popup i Swiper powinny
korzystać ze wspólnej implementacji, a nie być pisane osobno dla każdej
podstrony.

Kod powinien sprawdzać istnienie elementu przed inicjalizacją.

## Animacje

Nie dodawaj animacji automatycznie do wszystkich elementów.

Najpierw sprawdź, czy projekt korzysta z AOS.

Animacje powinny:
- być subtelne,
- nie zmieniać layoutu,
- respektować prefers-reduced-motion,
- korzystać z istniejącej inicjalizacji AOS.

## Tryb pracy

Dla każdego zadania:

1. przeanalizuj wskazany frame Figma,
2. przeczytaj README i AGENTS.md,
3. sprawdź odpowiednie pliki projektu,
4. wskaż istniejące elementy do ponownego użycia,
5. przedstaw plan,
6. wprowadź ograniczone zmiany,
7. uruchom npm run build,
8. sprawdź błędy kompilacji,
9. podaj listę zmodyfikowanych plików.

Nie zmieniaj plików niezwiązanych z zadaniem.

Nie przebudowuj istniejącej architektury bez wyraźnego polecenia.

Nie twórz nowych systemów utility, gridów, kontenerów ani breakpointów,
jeżeli odpowiednie rozwiązanie istnieje już w projekcie.

## Dodatkowy tryb: LIVE → WordPress factory

Wybierz źródło zgodnie z zadaniem: Figma albo istniejąca witryna LIVE.
W trybie Figma wszystkie dotychczasowe zasady Figma MCP pozostają w mocy.
W trybie LIVE analiza produkcyjnego URL zastępuje analizę frame Figma
w powyższym trybie pracy; nie wymagaj fikcyjnego pliku ani node ID Figma.
Pozostałe zasady PHP, ACF, reużycia, SCSS, JavaScript i build obowiązują w obu trybach.

Przed pracą LIVE przeczytaj `docs/live-migration/WORKFLOW.md`,
`docs/live-migration/IMPLEMENTATION-PLAN.md` oraz dokumenty wybranego projektu
w `docs/projects/<project>/`: BRIEF, PAGES, SCOPE i OPEN-QUESTIONS.
Brak konfiguracji projektu zgłoś; nie zastępuj go domyślnym klientem.
Dokumentacja workflow nie oznacza, że obecny runner obsługuje już LIVE.
Nie uruchamiaj runnera Figma z URL-em produkcyjnej witryny w polu `figma.url`.

- Nie wykonuj redesignu bez zlecenia. Źródło LIVE analizuj tylko do odczytu.
- Zapisz wszystkie wymagane adresy; liczba szablonów nie ogranicza listy stron.
  Nie wybieraj dowolnych 8–12 stron i nie usuwaj adresów z briefu.
- Prowadź osobno TEMPLATE i CONTENT. TEMPLATE=DONE nie implikuje CONTENT=DONE.
  Gotowość wymaga działającego lokalnego URL, właściwego układu, treści i dowodów QA.
- Reużywaj rodziny układów i komponenty factory; wariant treści nie wymaga nowego partiala.
- Przed nowymi polami ACF przedstaw label, field name, typ, return format i lokalizację.
- Zachowuj ścieżki, hierarchię, kategorie, źródłowe ALT i metadane SEO.
  Brakujące ALT skieruj do SEO; nie wymyślaj treści ani nie udawaj importu metadanych.
- Różnice dostępności względem LIVE dokumentuj; wymagane konsultacje kolorów/Hx
  prowadź według briefu. Nie obniżaj progów wizualnych, by ukryć błędy.
- Oddzielaj wymagany zakres od niepotwierdzonych rozszerzeń. Brak danych dla
  modułu dodatkowego nie blokuje niezależnych stron obowiązkowych.
- Uniwersalny silnik nie może zawierać domeny, identyfikatorów ani treści klienta.
  Konfigurację, rejestr i adaptery klienta trzymaj oddzielnie.
- Każdy raport odróżnia fakty potwierdzone, plan i brakujące dowody/dostępy.
  Nie deklaruj przeczytanego audytu, zgodności WCAG ani czasu w Toggl bez dowodów.
- Nie edytuj chronionego brancha bazowego. Używaj osobnego brancha silnika
  i osobnego brancha projektu; raportuj bazę, commity i stan Git.
