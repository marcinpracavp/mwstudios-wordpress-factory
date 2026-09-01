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

## Globalne zasady MWStudios Website Factory

Poniższe zasady obowiązują każdy projekt Factory, także podczas pracy
`factory:autopilot`.

### Wymagane pluginy

Jeżeli zatwierdzona specyfikacja projektu wymaga funkcji zależnej od pluginu,
agent domyślnie wykrywa jego stan, instaluje go, aktywuje i konfiguruje
minimalnie do potrzeb projektu. Publiczny plugin z wordpress.org nie jest
blockerem tylko dlatego, że nie jest jeszcze zainstalowany. Dla pluginu
komercyjnego wolno użyć wyłącznie istniejącego legalnego pakietu/licencji;
nie wolno obchodzić licencji. Instalacja ma być idempotentna i nie może
usuwać ani resetować innych pluginów.

WooCommerce instaluj wyłącznie dla rzeczywistego ecommerce. Nazwy sekcji
takie jak Products, Bestsellers lub Offer nie są wystarczającym dowodem.

### Header

Domyślny header Factory jest sticky. Figma lub jawna specyfikacja może tę
zasadę nadpisać. Sticky header nie może przykrywać anchor targets, psuć menu
mobilnego, powodować layout shift ani destabilizować screenshotów QA.

### Utilities first i spacing QA

Jeżeli istniejąca utility odpowiada dokładnie wartości wymaganej przez Figma,
markup musi użyć tej klasy. Nie duplikuj w page SCSS wartości dostępnych jako
`pt-*`, `pb-*`, `pl-*`, `pr-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*`, `gap-*`,
`row-gap-*` lub `column-gap-*`.

Figma pozostaje źródłem prawdy. Gdy dokładnej utility nie ma, po ponownej
weryfikacji pomiaru wolno użyć custom value. Nie wybieraj zbliżonej, ale
błędnej utility i nie twórz jednorazowego globalnego tokenu.

`CUSTOM_SPACING_WHERE_UTILITY_EXISTS` jest błędem Factory conventions.

### One page = one style file

Każda podstrona ma jeden główny projektowy plik SCSS w `src/css/pages/`, np.
`homepage.scss`, `about.scss`, `services.scss`, `contact.scss`.

Nie twórz katalogów ani plików SCSS per sekcja strony. Nie łącz też wszystkich
podstron w jeden `project.scss` lub `style.scss`. Globalne tokens, typography,
buttons, forms, header/footer i prawdziwie reużywalne komponenty pozostają w
odpowiednich globalnych warstwach boilerplate.

Source SCSS ma być multiline i zawierać jedną deklarację na linię.

Style file należy do widoku albo rodziny template'ów, nigdy do pojedynczego
database entity lub URL instance. Statyczne strony używają własnych plików,
np. `homepage.scss`, `about.scss`, `services.scss`, `contact.scss`. Natywne
rodziny dynamiczne używają jednego pliku per template family, np.
`shop.scss`, `product.scss`, `product-category.scss`, `cart.scss`,
`checkout.scss`, `account.scss`. `site-map.pages[*].templateIntent`,
`styleFile` i `styleScope` są kontraktem tej relacji. Pliki takie jak
`product-candle-a.scss` są zabronione, gdy korzystają z tego samego PDP
template co inne produkty.

### Content i WordPress

Projektowe treści są zarządzane przez ACF, WordPress lub wybraną natywną
integrację. Widocznego copy nie hardkoduj w template. Fallback copy w rodzaju
`get_field(...) ?: 'tekst projektu'` jest zabronione. Gdy required contentu
brakuje, nie renderuj elementu lub sekcji zgodnie z jej kontraktem.

Projektowe grupy ACF używają natywnego ACF Local JSON w `acf-json/`. Polylang
używa tych samych field names/schema i osobnych wartości stron językowych.

### Mobile i responsive

Jeżeli Figma zawiera finalny mobile design, mobile Figma jest źródłem prawdy
i ma być odwzorowane 1:1 tak samo jak desktop. Jeżeli finalnego mobile design
nie ma, responsive należy wyprowadzić z desktop design bez tworzenia nowej
estetyki i bez pomijania contentu lub sekcji.

Minimalna matryca responsive QA to szerokość desktop Figma oraz 1440, 1280,
1024, 768, 390 i 375 px. Sprawdzaj layout, kompletność contentu, visibility,
spacing, wrapping, image crop, navigation, sticky header, buttons, forms,
cards, sliders, footer i overflow.

### Topologia, site map i QA routes

`factory:init` nie wymaga od operatora znajomości topologii. Domyślne
`topology: auto` jest rozwiązywane po pełnym discovery do `onepage`,
`multipage` albo `hybrid` w zwalidowanym
`.factory-cache/figma/latest/site-map.json`.

Figma PAGE jest kontenerem pliku projektowego, a nie automatycznie stroną
WWW. Realne strony, routes, kolejność sekcji, języki, capabilities i mobile
source są odkrywane z final production frames oraz konfiguracji projektu.
QA route matrix wynika deterministycznie z site map i zachowuje jawne routes
manualne.

### ACF Pro

Klucz ACF Pro jest poprawnie skonfigurowany przez boilerplate. Nie pytaj o
klucz, nie generuj go i nie obchodź licencji. Użyj lub aktywuj istniejący
plugin. Faktyczny brak binary/package jest osobnym problemem technicznym;
license key nie jest human blockerem.

### STATUS, importer i functional evidence

`docs/factory/project/STATUS.md` jest kontraktem wznowienia per realna strona
i sekcja. Fresh implementer kontynuuje wyłącznie nieukończony zakres.

Seeded project content otrzymuje deterministyczny, idempotentny importer oraz
`CONTENT_IMPORT_PLAN.md`; importer nie czyści bazy i nie modyfikuje unrelated
content. Interakcje istniejące w projekcie muszą mieć realne dowody z
deklaratywnych recipes Playwright. Passive screenshot nie potwierdza menu,
formularza, slidera, language switch ani ecommerce action.

Jeżeli importer jest wymagany do osiągnięcia finalnego stanu, jego samo
utworzenie nie kończy zadania. Implementer tworzy/aktualizuje importer,
waliduje statycznie, wykonuje go przez rozwiązaną natywną toolchain LocalWP
PHP/WP-CLI, weryfikuje wynikowy stan WordPressa, wykonuje go drugi raz i
weryfikuje brak duplikatów, zanim rozpocznie visual/browser QA. Weryfikacja
obejmuje tylko rzeczywiście wymagane elementy: strony i templates, front page,
ACF/options, menu i locations, Polylang, media, repeaters/groups, linki,
WooCommerce i form relationships. Nie resetuj bazy ani unrelated content.
Gdy finalny content już istnieje i importer nie jest potrzebny, nie twórz go.

Przed finalnym browser QA implementation konfiguruje natywny runtime WordPress
odkryty w site-map/capabilities: `show_on_front`, `page_on_front`, posts page,
page templates, menu locations, permalinks/rewrite, Polylang i canonical home
routing, wymagane strony WooCommerce, relacje backendu formularzy oraz global
options. Używaj WordPress APIs, WP-CLI lub plugin-native APIs; nie stosuj
`index.php` hacks ani ręcznych redirectów, jeśli natywna konfiguracja rozwiązuje
problem.

Functional QA obejmuje lekki, deterministyczny baseline semantyki: dokładnie
jeden logiczny H1 na stronę, właściwy button/link, sensowne nazwy form,
alt intent obrazów, stan menu mobilnego, keyboard/state dla istniejących
accordionów/tabs oraz zachowany focus w istniejących menu/modalach. Dekoracyjne
SVG/ikony nie mogą tworzyć szumu accessibility. Recipes sprawdzają tylko
komponenty istniejące w projekcie.

### Autopilot safety

Wynik tekstowy agenta nie jest bramką. O przejściu etapu decydują rzeczywiste
komendy, exit code i artefakty Factory. Każdy główny etap agenta działa w
świeżej sesji; FINAL_REVIEWER jest clean-room i nie dziedziczy rozmowy
implementera.

Autopilot nie wykonuje automatycznie `git commit`, `git push`, force checkout,
`git reset --hard`, deploy ani produkcyjnych zmian. Po limicie prób zapisuje
stan `blocked` z dokładnym etapem i pozostałymi problemami.
