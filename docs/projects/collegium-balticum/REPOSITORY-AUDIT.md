# Ustalenia repo i kontrola zadania 1

Data: 2026-10-09. Repo `/workspace`, baza `autopilot-clean`, początkowy commit
`0077847` (`docs(factory): add complete autopilot usage guide`). Początkowe
`git status --short --branch`: czysty working tree, tracking `origin/autopilot-clean`.

## Branche i rozdzielenie

- `feature/live-migration-autopilot` od `autopilot-clean`: wspólne instrukcje
  AGENTS i `docs/live-migration/`, commit `e355bcf`.
- `project/collegium-balticum` od tego wspólnego commita: dokumenty klienta
  w `docs/projects/collegium-balticum/`; aktywny branch końcowy.
- `autopilot-clean` pozostaje na `0077847`. Nie wykonano push ani deploymentu.
  Branch projektu dziedziczy wspólny workflow, bez danych klienta w branchu silnika.

## Fakty o Autopilocie i konfiguracji

Przejrzano AGENTS, README, README-WEBPACK oraz dokumentację `docs/factory/`
dotyczącą Autopilota, użycia, v2, Figma, snapshotów, kontekstu i QA.
`factory/project.json` ma `mode=boilerplate`, neutralny projekt factory,
local/production URL i `figma.url=null`, język PL, capabilities `acf`, `swiper`.
To nie jest CB. `factory/qa.json` ma jedynie home `/`, viewport 1440×900 i 390×844.

`npm run factory:autopilot` uruchamia `scripts/factory/autopilot/run.js`.
Host v2 jest sekwencyjny i checkpointowany: inventory pełnych frame/stanów,
discovery przez Figma MCP, snapshot, zamrożenie planów tras/komponentów,
foundation/import, wspólne komponenty, strony kanoniczne, delty stanów,
full-page porównanie, diagnoza/ograniczone naprawy i niezależny audit.
Snapshot jest na sztywno oparty o `.factory-cache/figma/latest`, z node ID,
referencjami PNG, content-map i pochodzeniem assetów. Cache jest ignorowany w Git.
Runner nie obsługuje jeszcze LIVE; opcjonalny Figma URL w konfiguracji bazowej
nie oznacza, że runner może wykonać discovery bez niego.

`factory/autopilot.json` zawiera visual policy: różnica 0.04, tolerancja kanału
24 i geometrii 2 px, responsive widths 1440/1280/1024/768/390/375 oraz limity prób.
To nie obejmuje jeszcze pełnej macierzy CB 320 CSS px / 200% / 400% / do 2K.
Brak dowodu PASS nigdy nie oznacza akceptacji. Źródła i progi chronione.
Custom instructions są ładowane przez `custom-instructions.js`, hashowane
i ograniczone do 16000 bajtów na plik; zmiana blokuje resume starego runu.
Nowy brief zapisano poza tym limitem, nie w generowanym PROJECT_CONTEXT.

## Factory, ACF i reużycie

Klasyczny motyw PHP. `functions.php` ładuje funkcje motywu i `vendor/autoload.php`;
obecność Twig w vendor nie oznacza przebudowy motywu na nowy framework.
Istnieją `front-page.php`, `index.php`, `template-homepage.php`,
`template-contact.php`, `template-blog.php`; nie ma gotowej implementacji CB.
Partiale: header, footer, menu-mobile, hero, blog-item i section-image.
Section-image przyjmuje obraz, title, HTML, CTA, tło i klasy kolumn/kontenera.
Wymaga kontroli escaping i pustych sekcji podczas późniejszej adaptacji;
obecna możliwość reużycia nie jest dowodem zgodności WCAG.

SCSS: `src/css/style.scss`, layouts/grid/container, abstracts/margins,
variables i mixin `media`. Grid 12 kolumn; breakpointy 480/576/768/992/1200/1560,
page-width 1870 px. Najpierw stosować istniejące gc/gr/align/justify i spacing.
JS: `_app.js` inicjuje AOS, Headroom, Viewer i importuje moduły w katalogu;
istnieją accordion, tabs, modal, menu-mobile, init. `_libraries.js` udostępnia
Swiper i pozostałe biblioteki. AOS jest rzeczywiście importowany mimo braku
capability `aos` w neutralnym manifeście; nie deklarować reduced motion jako gotowe.
Polylang/WooCommerce/CF7 nie są włączone w manifeście; obecne style/pola CF7
nie potwierdzają aktywnej wtyczki.

ACF JSON: globalne logo/social_media, integracje/google_maps_api_key,
skrypty, kontakt/form (relationship), hero dla wpisów i pusta grupa front page.
`functions/acf.php` dodaje opcje oraz grupy topbar/popup. Nie ma gotowego
Flexible Content CB. `import-content.php` jest fail-closed stubem rzucającym
`PROJECT_CONTENT_IMPORT_ADAPTER_NOT_CONFIGURED`; component-registry to `[]`.
Nie utworzono ani nie zmieniono pól ACF w zadaniu 1.

## Build i środowisko

Webpack 5: npm build uruchamia produkcyjny webpack przez cross-env;
entry main/libs/combined/editor-styles, źródła SCSS/JS i assets → ignorowane dist.
`config/development.js` obecnie korzysta z `resolveLocalUrl(factory/project.json)`;
`FACTORY_LOCAL_URL` ma pierwszeństwo. README opisuje starszą konfigurację
hardkodowanego URL — w tym miejscu rzeczywisty kod jest źródłem ustaleń.

LocalWP adapter `wp.js` szuka bieżącej witryny i usług przez APPDATA oraz
ścieżki Windows. Docker wspiera Codespaces przez `FACTORY_RUNTIME=docker`,
`FACTORY_WP_ROOT=/wordpress`, `FACTORY_LOCAL_URL=http://wordpress`.
Devcontainer ma app/wordpress/wpcli/MySQL, wolumeny, port 8000 i post-create
z narzędziami, npm i Chromium. Repo jest montowane jako motyw.
Bootstrap wymaga już zainstalowanego WP i bazy; nie tworzy ani nie resetuje ich.
Może aktywować/pobrać publiczne wtyczki, wymaga dostarczonego ACF Pro i zmienia
home/siteurl; dlatego nie uruchomiono go do zadania dokumentacyjnego.

W sesji istnieją node/npm/php/wp/docker, node_modules i `/wordpress/wp-load.php`.
`docker ps` zwrócił brak uprawnień do socketu. `npm run factory:wp -- core is-installed`
zakończył się `spawnSync /usr/local/bin/wp EPERM` (exit 1). Nie potwierdzono
działania WP/bazy, aktywnego motywu, ACF Pro ani możliwości lokalnego visual QA.
Nie ma utworzonych lokalnych stron CB. Nie próbowano resetów ani instalacji.

## Wyniki kontroli

- `npm run factory:validate`: FACTORY VALID, wszystkie kontrole przeszły.
- `npm run factory:autopilot:test`: 21 testów, 21 PASS, 0 FAIL.
- `npm run build`: exit 0, Webpack 5.100.2, trzy ostrzeżenia rozmiaru
  assetów/entrypointów i zalecenia wydajności; brak błędów kompilacji.
- `git diff --check`: bez błędów whitespace; zmiany ograniczone do dokumentów/AGENTS.
- Audyt Drive: Internal Error, treść nieuzyskana. Toggl: brak dostępu i wpisów czasu.
- Zarejestrowano komplet CB-00–CB-18, wszystkie TEMPLATE/CONTENT=TODO.
  Kontakt, blog, szersze archiwum i wpis potwierdzone odczytem web;
  pozostałe adresy pochodzą z briefu i oczekują pełnego discovery.

W trakcie pracy pojawiły się nieśledzone pliki `Załącznik nr 2 (1).pdf` oraz
`checklista bc (2).docx`. Nie dodano ich do commitów, nie zmieniono ani nie
usunięto. Ich zawartości nie analizowano w zadaniu 1; nie utożsamiać ich bez
weryfikacji z audytem Drive. Mogą wymagać osobnego przeglądu w kolejnym zadaniu.

## Następne kroki

Decyzje PM i dostępy według OPEN-QUESTIONS, potem wdrożenie adaptera LIVE
według wspólnego IMPLEMENTATION-PLAN z regresją Figma. Następnie snapshot
wszystkich wymaganych stron, przypisanie rzeczywistych rodzin i przedstawienie
struktury ACF. Dopiero wtedy implementacja CB, import ograniczonej treści,
lokalne URL i visual/WCAG/SEO QA oraz przekazanie modułów Virtual.
