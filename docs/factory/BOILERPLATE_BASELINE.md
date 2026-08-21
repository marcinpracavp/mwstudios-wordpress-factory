# Website Factory — Boilerplate Baseline

Audyt wykonano na branchu `website-factory-v1`, na commicie `c3412e4` (`chore: initial clean boilerplate`). Źródłem prawdy był kod i faktyczna konfiguracja repozytorium, nie deklaracje z README. Zakres obejmował cały kod motywu, konfigurację builda, ACF Local JSON, zależności, assety oraz dokumentację. Katalogi zależności `node_modules/` i `vendor/` zostały zinwentaryzowane na poziomie pakietów i sposobu użycia; kod bibliotek zewnętrznych nie był audytowany linia po linii.

Weryfikacja techniczna baseline:

- wszystkie pliki PHP motywu przeszły `php -l` na PHP 8.2.29;
- wszystkie główne pliki `src/js/*.js` przeszły `node --check`;
- wszystkie 7 plików `acf-json/*.json` jest poprawnym JSON-em;
- `npm run build` zakończył się powodzeniem w osobnym katalogu tymczasowym, bez modyfikowania `dist/`;
- build zakończył się 3 ostrzeżeniami wydajności: `build-style.css` 359 KiB, `combined-style.css` 375 KiB i entrypoint `combined` 535 KiB;
- repozytorium było czyste przed utworzeniem tego dokumentu.

## 1. Repository structure

### Faktyczna struktura

| Obszar | Rola obecna | Ocena Factory |
|---|---|---|
| pliki `*.php` w root | klasyczny WordPress template hierarchy i trzy page templates | poprawny kierunek, zawartość w większości demo |
| `functions/` | moduły ładowane bezwarunkowo z `functions.php` | dobra separacja plików, brak separacji core/capabilities |
| `partials/` | header, footer, mobile menu, hero, blog item, `section-image` | jeden generyczny partial, reszta scaffold/demo |
| `src/css/` | SCSS: abstracts, base, layouts, components, pages, utils, vendor | dobra warstwowa struktura, nierówny poziom jakości i importy wszystkiego naraz |
| `src/js/` | główny App, automatycznie importowane moduły, vendored libraries | brak jawnego rejestru modułów i conditional loading |
| `assets/` | źródła obrazów i fontów | oba katalogi są puste poza `.gitkeep` |
| `dist/` | wynik Webpack | poprawnie ignorowany przez Git, obecnie zawiera build developmentowy |
| `acf-json/` | 6 grup pól i 1 definicja options page | użyteczny mechanizm synchronizacji, dane są niekompletne i niespójne z PHP |
| `config/`, `scripts/`, `.env.*`, `dev*.sh` | LocalWP, BrowserSync i watchery | kilka konkurencyjnych ścieżek uruchamiania i stale dane projektowe |
| `vendor/`, `composer.*` | Kint, Twig i polyfille | wersjonowane zależności debugowe, Twig nie jest używany przez motyw |
| `node_modules/`, `npm-shrinkwrap.json` | zależności frontendowe | shrinkwrap daje deterministyczne wersje, `node_modules` poprawnie ignorowany |
| `gulpfile.js` | poprzedni pipeline | martwy legacy: wymaganych pakietów Gulp nie ma w `package.json` |
| dokumenty root | README, Webpack, quickstart i naprawa środowiska | duplikują się, zawierają sprzeczne i nieaktualne informacje |

### Klasyfikacja ogólna

**Rzeczywisty core boilerplate:** klasyczny szkielet motywu, mechanizm modułów `functions/`, enqueue plików z `dist/`, SCSS entrypoint i warstwy, grid/spacing, Webpack 5, ACF Local JSON jako mechanizm, podstawowy header/footer oraz `section-image.php` jako zalążek kontraktowego partiala.

**Opcjonalne capabilities:** blog, Contact Form 7, mobile menu/headroom, AOS, AOE, Swiper, Viewer, TwentyTwenty, popup promocyjny, topbar, Font Awesome, integracja Google Maps, pola na skrypty, Polylang i WooCommerce. Obecnie większość z nich nie jest opcjonalna technicznie: kod lub assety są ładowane bezwarunkowo.

**Demo/legacy:** CPT `services` i `opinions`, taksonomia usług, `template-homepage.php`, pusty hero, modal demonstracyjny, nieużywane style bloga, FullCalendar, vendored kopie bibliotek, Gulp, pliki naprawy `NODE_ENV`, `zshrc-setup.txt`, screenshot błędu Webpack i nazwy obcych projektów (`izolmaster`, `ogarnijto`, `safegold`, `thesigner`).

## 2. WordPress core architecture

### Bootstrap

`functions.php` definiuje `FUNCTIONS_DIR`, ładuje `vendor/autoload.php`, a następnie bezwarunkowo dołącza 16 modułów z `functions/`. Koncepcja mała-funkcja/mały-moduł jest właściwa, ale obecny bootstrap:

- nie rozróżnia core od capability;
- nie sprawdza wymagań pluginów przed uruchomieniem kodu zależnego od ACF;
- ładuje produkcyjnie Kint/Twig tylko po to, by zapewnić helper debugowy `d()` używany w demo;
- używa globalnych, często nieprefiksowanych nazw funkcji (`load_styles`, `asset`, `svg`, `removeStyles`), co zwiększa ryzyko kolizji;
- miesza rejestrację, renderowanie, inline JS i definicje pól ACF w jednym `functions/acf.php`.

### Moduły PHP

| Moduł | Stan faktyczny | Klasyfikacja |
|---|---|---|
| `security.php` | usuwa metadane WP, emoji, resource hints i query strings obcych assetów | core do przeglądu; nazwa sugeruje więcej bezpieczeństwa niż zapewnia |
| `register_styles.php` | ładuje `dist/build-style.css`, dodaje editor stylesheet | core; błędny typ `true` jako lista zależności i statyczna wersja `1.0` |
| `register_scripts.php` | ładuje `build-combined.js` w hooku `wp_footer`, wymaga jQuery, lokalizuje tylko AJAX URL | core do poprawy; niestandardowy hook i brak wersjonowania po zawartości |
| `deregister_*` | usuwa `wp-embed`, block CSS i style CF7 | policy/capability, nie neutralny core |
| `register_post_types.php` | aktywne `services`, `opinions`; zakomentowany `trainer` | projektowe demo/legacy |
| `register_taxonomies.php` | aktywna `kategoria-uslugi` | projektowe demo/legacy |
| `register_custom_strings.php` | wyłącznie zakomentowany przykład Polylang | legacy placeholder |
| `acf.php` | options pages, Google Maps, pola i runtime topbara/popupu | kilka capabilities sklejonych w jeden moduł |
| `register_nav_menus.php` | 5 lokalizacji, w tym `lang` | header/footer core plus opcjonalny ślad Polylang |
| `image_sizes.php` | rozmiar `fullhd` 1920x1080 bez cropa | kandydat core, ale powinien być jawnie konfigurowalny |
| `support.php` | thumbnails, title-tag, upload SVG, wyłączenie komentarzy | policy; SVG bez sanitizacji jest ryzykiem |
| `admin.php` | wyłącza Gutenberg, ukrywa menu, zmienia login | agency defaults/policy, nie neutralny core |
| `utils.php` | sesja PHP, menu, TinyMCE, breadcrumbs | niespójny worek helperów; część legacy |
| `helpers.php` | asset, SVG, ACF link/image, browser detection, debug | wymaga rozdzielenia i hardeningu |
| `optimization.php` | dashicons i emoji | mały core/policy; powiązany callbackami z `security.php` |

### Templates

- `index.php` jest minimalnym fallbackiem, ale nie ma wyspecjalizowanych `page.php`, `single.php`, `archive.php`, `search.php` ani pętli z obsługą braku treści.
- `front-page.php` zawsze przejmuje front page i renderuje pusty `.hero`; pobiera ACF, którego nie używa.
- `template-homepage.php` to jawne demo: inline `margin-top:550px`, przykładowy modal, `d()` i bezwarunkowa iteracja po social media.
- `template-contact.php` jest logicznie uszkodzony: PHP oczekuje `$acf_fields['contact']`, podczas gdy Local JSON definiuje `kontakt`. Sekcja nie zostanie wyrenderowana. Template zakłada CF7 i używa `data-aoe`, którego runtime nie inicjalizuje.
- `template-blog.php` zawiera własne zapytanie i funkcję paginacji wewnątrz template'u, odwołuje się do nieistniejącego `dist/img/pagination-arrow.svg`; powiązane style bloga nie są importowane do builda.
- `404.php` ma inline CSS, brak logicznego H1 oraz nieescape'owany URL.

### Header i footer

Pozytywne elementy: `language_attributes()`, charset, viewport, `wp_head()`, `body_class()`, `wp_footer()`, semantyczne `header/main/footer` i użycie template parts.

Problemy:

- brak `wp_body_open()`;
- twardy `theme-color` i globalnie fixed header;
- `get_fields('options')` jest wywoływane bez guardu, więc ACF jest faktycznym hard dependency;
- pola `skrypty_header`, `skrypty_header_2`, `skrypty_footer` są echo'owane jako surowy kod;
- topbar i popup generują inline JavaScript w PHP, sprzecznie z obecnym `AGENTS.md`;
- część URL-i i danych ACF w partialach nie jest escape'owana;
- stopka zawiera literówkę `Cteated` i branding autora jako treść produkcyjną.

### Helpery i bezpieczeństwo

- `svg()` pobiera SVG przez URL z wyłączoną walidacją TLS.
- `get_svg_content_by_url()` wczytuje i zwraca surowy SVG bez sanitizacji; samo dopisanie klasy nie zabezpiecza przed skryptami/handlerami.
- globalne dopuszczenie uploadu SVG nie ogranicza roli ani nie sanitizuje pliku.
- `console_log()` może wstrzyknąć nieescape'owane dane do inline JS.
- `detectSafari()` zakłada istnienie `$_SERVER['HTTP_USER_AGENT']`.
- `registerSession()` uruchamia sesję PHP na każdym requestcie frontowym i administracyjnym bez widocznego konsumenta.
- `section-image.php` escape'uje klasy/ID, ale nie escape'uje URL-a tła, tytułu i treści zgodnie z jawnym kontraktem (`esc_url`, `esc_html`/`wp_kses_post`).
- brak jednolitego prefiksu/namespacingu oraz deklarowanych typów/kontraktów helperów.

## 3. Frontend architecture

### SCSS

Główny entrypoint `src/css/style.scss` ładuje kolejno `abstracts`, `vendor`, `utils`, `base`, `layouts`, `components`, `pages` i pełny Font Awesome. Struktura katalogów jest czytelna i nadaje się na bazę Factory, ale importy są monolityczne.

Faktyczny stan:

- wszystkie aktywne komponenty z `_index.scss` trafiają do każdego projektu;
- `layouts/_blog.scss` i `components/_blog-item.scss` istnieją, ale nie są forwardowane, więc template bloga nie otrzymuje tych styli;
- gdyby `_blog-item.scss` został włączony, używa niezdefiniowanego `$gray-3` i nieistniejącego assetu przez błędną ścieżkę `../dist/img/blog-item-decor.png`;
- `base/_select.scss` jest pusty, podobnie jak kilka wrapperów layout/component;
- reset usuwa outline z `:focus` i `:active`, co jest regresją dostępności;
- globalne style formularzy są mocno projektowe: białe pola, duże pill radius, Font Awesome dla checkboxa;
- `editor-styles.scss` ładuje typografię, ale dodaje wszystkim nagłówkom i paragrafom ciemny text shadow; jednocześnie Gutenberg jest wyłączony;
- kod używa zarówno `@use/@forward`, jak i przestarzałego `@import` dla Font Awesome i editor styles.

### JavaScript

`_app.js` importuje SCSS, AOS oraz automatycznie wszystkie pliki `src/js/*.js` przez `require.context`. Osobny `_libraries.js` importuje AOE, Headroom, Viewer, Swiper i TwentyTwenty, po czym wystawia je na `window`.

Konsekwencje:

- nie istnieje jawny rejestr aktywnych modułów ani tree-shaking na poziomie capability;
- AOS jest inicjalizowany na każdej stronie, mimo że markup demo używa `data-aoe`, nie `data-aos`;
- vendored AOE jest bundlowany, ale nie ma wywołania `aoe()`;
- Viewer i Headroom są bundlowane globalnie; inicjalizacja jest warunkowa względem selektora, ale koszt pobrania pozostaje;
- modal, accordion i tabs opierają się na jQuery i nie mają kompletnego modelu dostępności (ARIA, focus, klawiatura);
- counter nie respektuje `prefers-reduced-motion`;
- mobile menu ma hardcoded `/wp-content/themes/izolmaster`, nieistniejący `menu-arrow.svg`, zbędny token `2` w callbacku i duplikuje logikę desktop/mobile w jQuery;
- `init.js` zawiera głównie zakomentowane przykłady Swiper/TwentyTwenty;
- `mouse-move.js` jest helperem demonstracyjnym bez aktywnego użycia;
- automatyczny import powoduje wykonywanie wielu listenerów `DOMContentLoaded`/`ready` niezależnie od potrzeb projektu.

### Biblioteki i CSS vendor

Repo zawiera ręcznie skopiowane AOE, Headroom, Viewer, Swiper i pluginy TwentyTwenty, a równolegle instaluje AOS i Swiper z npm. Swiper JS pochodzi z npm 11.2.10, natomiast główny `build-style.css` zawiera vendored CSS Swiper 11.0.7. CSS npm Swiper trafia do `libs.css`/`combined-style.css`, które nie są enqueue'owane. To tworzy niewidoczną zależność między różnymi wersjami JS i CSS.

### Assety, fonty i SVG

- `assets/img/` i `assets/fonts/` nie zawierają żadnych właściwych assetów.
- W repo nie ma źródłowych SVG; wszystkie referencje do `menu-arrow.svg`, `pagination-arrow.svg`, `swiper-arrow.svg` lub blog decor są brakujące albo zakomentowane.
- Build generuje około 999 KiB fontów Font Awesome, mimo że w kodzie własnym wykorzystywany jest głównie glyph checkmarka.
- Poppins i GeistMono są wskazane jako fonty bazowe, ale nie ma ich plików ani importu webfontów; przeglądarka użyje fallbacków.
- `_fonts.scss` zawiera zakomentowany generator Poppins/Baskervville i historyczny przykład N27, a więc nie definiuje działającej architektury fontów.
- CopyWebpackPlugin kopiuje assety z nazwą `[name][ext]`, spłaszczając podkatalogi i umożliwiając kolizje nazw.
- Komentarz w Webpack mówi o optymalizacji obrazów, ale pipeline wykonuje wyłącznie kopiowanie.

## 4. Build system

### Webpack 5

Aktywne entrypointy:

| Entry | Wynik | Faktyczne użycie przez WordPress |
|---|---|---|
| `main` | `build-js.js` + `build-style.css` | ładowany jest tylko CSS |
| `libs` | `build-libs.js` + `libs.css` | nie jest enqueue'owany |
| `combined` | `build-combined.js` + `combined-style.css` | ładowany jest tylko JS |
| `editor-styles` | `editor-styles.js` + `editor-styles.css` | ładowany jest CSS; pusty JS jest odpadem builda |

Build działa, ale architektura generuje duplikaty: `main` i `combined` zawierają App, a `libs` i `combined` zawierają te same biblioteki. `combined-style.css` duplikuje główny CSS i dodaje CSS bibliotek. WordPress składa działającą stronę z CSS entrypointu `main` i JS entrypointu `combined`, co nie jest jednym spójnym grafem entry.

README nie odpowiada konfiguracji:

- nazwy plików nie mają hashy, mimo deklarowanego cache bustingu;
- PHP używa stałej wersji `1.0`, nie `filemtime()` ani manifestu;
- nie ma `CssMinimizerPlugin`; produkcyjny `build-style.css` pozostaje rozwiniętym CSS-em (21 978 linii);
- `postcss.config.js` deklaruje cssnano, lecz loader ma własną listę pluginów zawierającą tylko autoprefixer;
- nie ma image minimizera;
- HMR dla proxowanego WordPressa nie został potwierdzony przez sam build;
- `webpack` jest importowany w konfiguracji, ale nieużywany;
- `output.clean: true` i `CleanWebpackPlugin` dublują odpowiedzialność.

### package.json i skrypty npm

| Skrypt | Ocena |
|---|---|
| `build` | działa na Windows przez `cross-env`; baseline przeszedł z 3 warningami |
| `build:dev` | uruchamia konfigurację zawierającą BrowserSyncPlugin, mimo że to jednorazowy build |
| `dev:watch` | sensowny cross-platformowy watch przez `cross-env` i `npx webpack` |
| `dev`, `start` | wywołują `./dev.sh`; wymagają powłoki bash i nie są natywne dla Windows/LocalWP |
| `dev:sync` | wywołuje bash script, który może sam instalować zależności i modyfikować `package.json` |
| `dev:full` | uruchamia Webpack watch i watcher PHP, ale sam watcher PHP tylko loguje zmiany; nie odświeża przeglądarki |
| `browsersync` | osobny, trzeci wariant BrowserSync |
| `serve` | Webpack Dev Server na hardcoded porcie 3000, nie 3050 jak podaje README |
| `clean` | `rm -rf dist/*`, nie działa w standardowym Windows PowerShell/cmd |
| `reset-env`, `fix-env` | bash-only; wykonują mutacje środowiska lub instalację zależności |

`npm-shrinkwrap.json` w lockfileVersion 3 poprawnie przypina aktywne zależności. Brakuje jednak `engines`, wymagań wersji Node/npm i jednej kanonicznej komendy setup/dev.

### Zależności

- FullCalendar (5 pakietów) jest zainstalowany, ale nigdzie nieimportowany.
- `postcss-cli` nie ma skryptu konsumenckiego.
- Font Awesome, AOS i Swiper są dependencies, chociaż powinny zależeć od wybranych capabilities.
- Gulpfile wymaga 12 pakietów, których nie ma w drzewie npm; nie jest wykonywalny.
- Composer ładuje Kint Twig, co dociąga Kint, Twig i Symfony polyfills. Twig nie renderuje żadnego template'u.
- `vendor/` i `composer.lock` są wersjonowane. `.gitignore` ignoruje nieistniejące `composer-lock.json`, a nie `composer.lock`.

### BrowserSync / LocalWP

Istnieją trzy nakładające się ścieżki: BrowserSyncPlugin w Webpack, `scripts/browsersync.js` oraz Webpack Dev Server. Porty 3000/3001/3050 są opisywane niespójnie. `config/development.js` ma hardcoded `http://safegold.local`, podczas gdy repo znajduje się w witrynie LocalWP `devtest`; `.env.local` ma `http://ogarnijto.local`, lecz `BROWSERSYNC_PROXY` nie steruje konfiguracją. README pokazuje jeszcze `blueprint.local` i inne przykłady.

To nie jest deterministyczna konfiguracja dla agenta: nie istnieje pojedyncze źródło prawdy generowane przy inicjalizacji projektu ani walidator, który wykryje niedostępny proxy URL lub konflikt portu.

## 5. ACF architecture

ACF Pro jest faktycznym wymaganiem core, nie łagodną opcją. Motyw bez guardów wywołuje `get_field()`/`get_fields()` w headerze, footerze, partialach, adminie i templates. Używane są też funkcje Pro: options pages i repeater.

### Local JSON

| Grupa/page | Pola główne | Lokalizacja | Stan |
|---|---|---|---|
| `Ustawienia globalne` | `logo` image array, `social_media` repeater | Opcje globalne | używana; social markup wymaga lepszego guardu/escaping |
| `Ustawienia globalne - Integracje` | `google_maps_api_key` text | Integracje | capability; klucz trafia do ACF Google Map API |
| `Strona główna` | brak pól | front page | pusty placeholder |
| `Skrypty` | 3 textarea na raw scripts | options page `skrypty` | aktywne i renderowane bez sanitizacji |
| `Kontakt` | `kontakt.form`, relationship do `wpcf7_contact_form`, return object | `template-contact.php` | template oczekuje innej nazwy `contact` |
| `Hero` | pusta grupa `hero` | wszystkie posty | partial jest pusty, a contact template nie ma tej lokalizacji |
| `ui_options_page...` | definicja strony `Skrypty` | child Opcji globalnych | działa tylko przy odpowiednio nowej wersji ACF Pro |

### Pola rejestrowane w PHP

`functions/acf.php` dodatkowo rejestruje w kodzie dwie grupy: `promo_popup` i `topbar`. Oznacza to dwa równoległe źródła schematu: Local JSON i tablice PHP. Brak manifestu wyjaśniającego, dlaczego konkretna grupa należy do jednego mechanizmu.

Problemy deterministyczności:

- brak mapy `field name -> typ -> return format -> konsument PHP`;
- puste aktywne grupy;
- niespójne języki i nazwy (`kontakt` vs `contact`);
- brak walidatora Local JSON względem odwołań `get_field/get_fields` w kodzie;
- brak jawnych wymagań plugin/version dla UI options pages;
- pola capability są zawsze rejestrowane;
- ACF fields, renderowanie i inline behavior znajdują się w jednym pliku;
- brak procedury eksportu/synchronizacji i reguł stabilnych keys dla agenta.

## 6. Existing utilities

### Grid

Grid jest najbardziej wartościowym istniejącym elementem Factory:

- `.grid` rozszerza 14-track layout: 1 zewnętrzna kolumna płynna + 12 kolumn content + 1 zewnętrzna kolumna płynna;
- content width bazuje na `$page-width: 1870px`, gap na `$page-gap: 16px`;
- generowane są `gc-X/Y` od linii 1 do 15 i `gr-X/Y` dla 12 wierszy;
- responsywne warianty są generowane dla `xl`, `lg`, `md`, `sm`, `xs`, `xxs` jako `max-width`;
- breakpointy: 1560, 1200, 992, 768, 576, 480 px;
- dostępne są flex, align i justify utilities;
- gap utilities mają wartości 0-500 co 25, czyli 0-5 rem co 0.25 rem, również dla wszystkich breakpointów.

Wady:

- `grid-template-columns` hardcoduje `repeat(12)` zamiast użyć `$grid-columns`;
- responsive grid/gap wymusza `!important`, mimo reguły AGENTS „unikaj !important”;
- przy `max-width: 768px` główny column gap znika, ale grid nadal zachowuje 14 tracków;
- `.grid-p-50` ustawia `grid-column` dwa razy i finalnie kończy jako `1/2`; druga deklaracja miała prawdopodobnie być `grid-row`;
- nazwa „mediaplex” istnieje tylko w komentarzu, bez formalnej specyfikacji/testu;
- brak testu snapshot/contract dla wygenerowanych klas.

### Spacing

Faktyczne wartości to `30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 210`. README i AGENTS pomijają `210`.

Klasy `mt/mb/ml/mr`, `pt/pb/pl/pr`, `mx/my/px/py`, `m/p` są responsywne wewnętrznie. Nie istnieją breakpoint-specific spacing classes. Skala używa progów xl/md/sm oraz współczynników około 0.8/0.64/0.512, mimo komentarzy mówiących o 75%. Dla 30/40 część progów jest celowo pomijana; dla 50/60 pominięty jest próg sm.

System jest użyteczny, ale powinien mieć maszynowo czytelny katalog wartości i przykładowy output. Obecnie agent musi interpretować generator Sass i rozbieżną dokumentację.

### Typography i inne utilities

- generator font size tworzy wyłącznie `.text-62`; TinyMCE oferuje nieistniejące `.text-24`, `.text-34`, `.text-60`, `.text-80`, `.text-100`, a blog używa `.text-42`;
- działają weight, alignment, uppercase, family i color helpers;
- istnieje `.l-container` z width 96%, max 1870 px oraz wariantami xxl/xl/full;
- utilities WordPress obsługują klasy alignment, ale wymuszają brak admin-bar offsetu i zmieniają widoczność admin bara;
- brak udokumentowanych utilities dla visibility, screen-reader text, aspect ratios i focus states.

## 7. Existing reusable components

| Element | Możliwość reuse | Warunek |
|---|---|---|
| `partials/section-image.php` | wysoka | dodać ścisły kontrakt, bezpieczny output, semantykę headingu i sprawdzić responsywne klasy |
| `partials/header.php` | średnia | rozdzielić branding/nav/menu capability, escaping i konfigurację fixed/headroom |
| `partials/menu-mobile.php` + JS/SCSS | niska w obecnym stanie | usunąć project ID/path, poprawić a11y, vanilla API i zależność od social fields |
| `partials/footer.php` | niska | to wyłącznie placeholder agency credit |
| `partials/hero.php` | brak | pusty shell zależny od pustej grupy ACF |
| blog template/item | niska | brak assetów/importów, niezdefiniowane tokeny, logika w template |
| accordion | średnia jako pomysł | przygotować semantyczny partial/button, ARIA i niezależny moduł |
| modal demo | niska | brak focus management i semantycznego kontraktu |
| counter | średnia | capability opt-in, reduced motion i format/locale config |
| tabs | niska/średnia | ARIA tabs, keyboard navigation i niezależność od jQuery |
| topbar | średnia | wydzielić schema/render/behavior, przenieść JS z PHP, dodać testy dat/cookies |
| promo popup | średnia | jak wyżej plus focus trap, focus restore i jawny model consent/cookie |
| WPCF7 styles | niska | są projektowe kolorystycznie i ładowane bezwarunkowo |
| Swiper wrapper | średnia jako capability | jedna wersja npm, conditional import i wspólny initializer |

## 8. Existing optional integrations

| Integracja | Obecność w kodzie | Faktyczny status |
|---|---|---|
| ACF / ACF Pro | intensywna | hard dependency core; brak kontroli aktywacji/wersji |
| Contact Form 7 | ACF relationship, shortcode template, SCSS, dequeue plugin CSS | częściowo aktywne, ale template jest zepsuty przez `kontakt/contact` |
| Polylang | menu `lang`, zakomentowany `pll_register_string` | placeholder; brak aktywnego API/guardu |
| WooCommerce | wyłącznie zakomentowany filtr styli | brak integracji, templates, supports i zależności |
| Swiper | npm, vendored CSS/JS, global export, placeholder SCSS | bundlowany zawsze, brak aktywnego slidera |
| AOS | npm import i globalny init | aktywne zawsze; brak markup `data-aos` w audytowanym kodzie |
| AOE | vendored JS/CSS i `data-aoe` w markup | assety aktywne, initializer nieaktywny |
| Headroom | vendored JS i `.js-headroom` | aktywne w każdym projekcie z headerem |
| Viewer | vendored JS/CSS i initializer | bundlowane zawsze, inicjalizacja tylko przy `.viewer-js` |
| TwentyTwenty | dwa vendored skrypty, zakomentowany init, CSS niewłączony | legacy/dormant |
| FullCalendar | dependencies npm | całkowicie nieużywany residue |
| Font Awesome | pełny CSS/fonty, checkbox glyph | aktywne zawsze, nieproporcjonalne do użycia |
| Google Maps ACF | option field i filter API key | małe capability bez komponentu mapy |
| raw scripts | ACF options + output header/body/footer | aktywne capability wysokiego ryzyka |
| BrowserSync | plugin, standalone script i dev server | aktywne narzędzia o niespójnej konfiguracji |

Żadna z integracji nie ma obecnie standardowego lifecycle `enable -> validate requirements -> enqueue/init -> disable without residue`.

## 9. Legacy / demo elements

Do usunięcia lub przeniesienia poza baseline core w późniejszym etapie:

- `gulpfile.js` i wszystkie wzmianki o zakończonej migracji, dopóki plik nadal istnieje;
- `template-homepage.php` z modalem, debugiem i inline style;
- active CPT `services`, `opinions` oraz taksonomia `kategoria-uslugi`;
- zakomentowany CPT `trainer` i Polylang strings;
- puste ACF groups „Strona główna” i „Hero”;
- puste/placeholder style (`select`, footer, main, homepage, button);
- `src/js/init.js`, nieaktywna konfiguracja mouse parallax i przykładowy markup wpisany do plików JS;
- local copies `src/js/lib/swiper.js` i vendored Swiper CSS przy jednoczesnym npm Swiper;
- TwentyTwenty, jeżeli nie zostanie zdefiniowane jako capability;
- FullCalendar packages;
- Twig i Kint w produkcyjnym bootstrapie;
- `BŁĄD WEBPACK NAPRAWA.png`, `NODE_ENV_FIX.md`, `zshrc-setup.txt`, `reset-env.sh` po przygotowaniu jednej poprawnej procedury;
- test comments dopisane do `index.php` i `_variables.scss`;
- obce identyfikatory `izolmaster`, `ogarnijto`, `safegold`, `thesigner`;
- nieistniejące asset references blog/menu/pagination/swiper;
- agency credit i dane Slawinsky jako domyślna treść/metadata tam, gdzie v1 ma być MWStudios Factory.

## 10. Problems for Website Factory

### Krytyczne dla deterministycznej pracy agenta

1. **Brak jawnej granicy core/capability/demo.** Samo istnienie pliku często oznacza automatyczny import i aktywację.
2. **Brak source-of-truth manifestu projektu.** Agent nie ma pliku określającego aktywne pluginy, moduły, języki, content types, fonty, breakpoint policy i URL LocalWP.
3. **ACF nie ma spójnego kontraktu.** Dwa mechanizmy rejestracji, puste grupy i udowodniony mismatch `kontakt/contact`.
4. **Dokumentacja nie jest wykonywalną specyfikacją.** README i AGENTS zawierają fakty sprzeczne z kodem.
5. **Automatyczny JS/CSS import.** Factory nie może przewidywalnie generować lekkiego projektu ani stwierdzić, czy capability jest naprawdę nieaktywne.
6. **Brak walidacji referencji.** Nie ma kontroli brakujących assetów, klas utility, ACF names, template locations ani plugin requirements.
7. **Brak testów.** Nie ma PHPUnit, WordPress test suite, Vitest/Jest, lintów, PHPStan/PHPCS, Stylelint, ESLint, smoke testów ani visual regression.

### Istotne problemy jakościowe

- hard dependency ACF bez czytelnego fail-fast/admin notice;
- globalne sesje PHP bez konsumenta;
- raw script injection i surowe SVG;
- brak jednolitego escaping policy w istniejącym kodzie;
- brak `wp_body_open()` i niepełna dostępność interaktywnych komponentów;
- nieprefiksowane funkcje i stałe;
- brak jednego logicznego H1 w scaffoldach;
- build produkuje duże, zdublowane assety i nie realizuje obiecanej optymalizacji;
- konfiguracja dev jest zależna od bash mimo Windows/LocalWP;
- brak automatycznego versioning/cache bustingu;
- brak minimalnej macierzy wspieranych wersji WordPress/PHP/Node/ACF/plugins;
- `.gitignore` jest niepełny i niespójny z repo (`.env.local` tracked, zła nazwa composer lock).

## 11. Elements ready for Factory

Poniższe elementy można zachować jako kierunek v1 bez przebudowywania od zera:

- klasyczny motyw PHP zamiast React/Tailwind;
- podział `functions/`, `partials/`, `src/css`, `src/js`, `assets`, `acf-json`, `dist`;
- Webpack 5 + Babel + Sass + PostCSS + MiniCssExtract + CopyWebpackPlugin;
- `npm-shrinkwrap.json` jako deterministyczny lock;
- główny SCSS oparty o warstwy abstracts/base/layouts/components/pages;
- centralne zmienne, jeden mixin media i ustalony zestaw breakpointów;
- 12-kolumnowy grid z klasami `gc/gr` i responsive variants;
- spacing i gap utilities jako koncepcja generowana z map;
- `.l-container` jako podstawowa prymitywa layoutu;
- ACF Local JSON jako repozytoryjny format schematów;
- `wp_get_attachment_image()` i ACF link/image helpery jako właściwy kierunek API;
- `section-image.php` jako pierwszy kandydat kontraktowego reusable partiala;
- BrowserSync proxy jako oczekiwany UX developmentu;
- wymóg `npm run build` i ograniczonych zmian zapisany w `AGENTS.md`.

„Ready” oznacza tu zachowanie koncepcji i lokalizacji. Nie oznacza, że każdy wymieniony plik jest już wolny od błędów.

## 12. Elements requiring refactor

### Refactor wymagany przed pierwszym projektem Factory

- bootstrap `functions.php`: rejestr core i jawne ładowanie capabilities;
- enqueue: jeden frontend entry, `filemtime()`/manifest, standardowe hooki i poprawne dependency arrays;
- ACF: jeden katalog schematów, kontrakty i validator odwołań;
- header/footer: `wp_body_open`, escaping, brak raw inline behavior i plugin guards;
- helpery SVG/asset/link/image: bezpieczne API zwracające wartości zamiast niejawnego echo;
- JS: jawne importy, moduły inicjalizowane tylko przy istniejącym selektorze i aktywnej capability;
- SCSS: core imports oddzielone od capability imports;
- build: usunięcie dublujących entrypointów, CSS minimization, prawdziwy cache busting i spójny asset manifest;
- LocalWP: jedna cross-platformowa komenda i jeden konfigurowalny URL;
- dostępność: focus styles, menu, modal, tabs, accordion, reduced motion;
- plugin integrations: osobne adaptery z guardami i requirements;
- admin/security policy: wyraźnie konfigurowalne decyzje, a nie bezwarunkowe defaults.

### Refactor możliwy po ustabilizowaniu v1

- optymalizacja obrazów i automatyczne generowanie wariantów;
- bardziej zaawansowany design tokens pipeline z Figma;
- lazy chunks per template/capability;
- WP-CLI factory commands;
- visual regression i snapshoty wygenerowanych utilities;
- automatyczny provisioning ACF/pluginów, dopiero po zatwierdzeniu kontraktów.

## 13. Recommended Factory v1 structure

Rekomendowana ewolucja zachowuje obecną technologię i większość rozpoznawalnych katalogów:

```text
.
├── factory/
│   ├── project.json              # aktywne capabilities, pluginy, locale, fonty, LocalWP URL
│   ├── capabilities.json         # katalog dostępnych modułów i ich requirements
│   └── schemas/                  # maszynowe kontrakty sekcji i ACF
├── functions.php                 # minimalny bootstrap
├── functions/
│   ├── core/
│   │   ├── setup.php
│   │   ├── assets.php
│   │   ├── navigation.php
│   │   ├── images.php
│   │   └── helpers.php
│   ├── integrations/
│   │   ├── acf.php
│   │   ├── cf7.php
│   │   ├── polylang.php
│   │   └── woocommerce.php
│   └── capabilities/
│       ├── blog.php
│       ├── topbar.php
│       └── promo-popup.php
├── partials/
│   ├── global/
│   ├── components/
│   └── sections/
├── templates/
├── acf-json/
├── src/
│   ├── css/
│   │   ├── core/
│   │   ├── components/
│   │   ├── capabilities/
│   │   └── pages/
│   └── js/
│       ├── app.js
│       ├── core/
│       └── capabilities/
├── assets/
│   ├── img/
│   ├── icons/
│   └── fonts/
├── scripts/
│   ├── validate-factory.js
│   ├── validate-acf.js
│   └── validate-assets.js
├── tests/
│   ├── php/
│   ├── js/
│   └── smoke/
└── docs/factory/
```

Minimalny `project.json` powinien jednoznacznie opisać przynajmniej:

- nazwę/slug/text domain/package prefix;
- WordPress URL i porty development;
- wymagane wersje PHP, Node, WordPress i ACF Pro;
- aktywne capabilities i plugin integrations;
- content types/taxonomies;
- menu locations;
- font families i źródła plików;
- design tokens/breakpoints/grid policy;
- dozwolone global fields;
- listę sekcji/partials użytych w projekcie.

Każda capability powinna deklarować własne PHP, SCSS, JS, ACF, assets, requirements i test smoke. Wyłączenie capability musi oznaczać brak jej kodu w runtime i brak jej assetów w bundlu.

## 14. Recommended first implementation steps

1. Zamrozić ten baseline i zdefiniować w krótkim RFC, co dokładnie należy do core v1, a co jest capability.
2. Dodać `factory/project.json` i `factory/capabilities.json` z walidowanym schematem, bez jeszcze automatycznego generowania pól.
3. Przygotować jeden cross-platformowy workflow: `npm ci`, `npm run dev`, `npm run build`, bez skryptów samoistnie instalujących pakiety.
4. Uprościć Webpack do jednego frontend entry i jednego editor CSS entry; dodać manifest/versioning i CSS minimizer.
5. Oddzielić core SCSS/JS od capabilities; usunąć auto-import `require.context` na rzecz jawnego registry.
6. Oczyścić bootstrap PHP z CPT, demo, debug i bezwarunkowych integracji; wprowadzić wspólny prefix/namespace.
7. Ujednolicić ACF: usunąć puste grupy, naprawić `kontakt/contact`, opisać return formats i uruchamiać walidator w buildzie.
8. Utwardzić header/footer/helpery: `wp_body_open`, escaping, bezpieczne SVG, brak inline JS i poprawne plugin guards.
9. Ustabilizować grid, spacing i typography contract; poprawić `.grid-p-50`, brakujące text utilities oraz dokumentację generowanych klas.
10. Dodać minimalną bramkę jakości: PHP lint, ESLint, Stylelint, walidację JSON/ACF/assets oraz smoke build w CI.
11. Dopiero potem przenieść po jednej capability: header/menu, CF7, blog, Swiper, topbar/popup, każdą z osobnym kontraktem i testem.
12. Na końcu zaktualizować `AGENTS.md` tak, aby wskazywał wyłącznie fakty weryfikowane przez skrypty i manifest Factory.

FACTORY BASELINE:

Core cleanliness: 3/10  
Architecture consistency: 4/10  
Automation readiness: 4/10  
Testing readiness: 1/10  
Overall: 3/10
