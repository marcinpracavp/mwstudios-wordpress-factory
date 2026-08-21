# Slawinsky Theme Documentation

## 🚀 System budowania - Webpack 5

### Migracja z Gulp do Webpack

Motyw został w pełni przeportowany z systemu budowania opartego na Gulp 4 do **Webpack 5**. Nowy system oferuje:

- ⚡ Szybsze budowanie i obserwowanie plików
- 🔄 Hot Module Replacement (HMR)
- 📦 Lepsze zarządzanie zależnościami
- 🌐 Zintegrowany BrowserSync z live reload
- 🎯 Automatyczne obserwowanie plików PHP WordPress

### Konfiguracja środowiska

#### Centralna konfiguracja URL-a

URL strony lokalnej konfiguruje się **tylko w jednym miejscu** w pliku `config/development.js`:

```javascript
module.exports = {
  // 🌍 ZMIEŃ TEN URL NA SWÓJ LOKALNY WORDPRESS
  WORDPRESS_URL: 'http://blueprint.local',
  // ... reszta konfiguracji
}
```

#### Zmienne środowiskowe

Dostępne pliki `.env`:

- `.env.local` - ustawienia lokalne (nie commituj do git)
- `.env.development` - ustawienia development
- `.env.production` - ustawienia produkcji

**Przykład `.env.local`**:
```bash
NODE_ENV=development
WEBPACK_MODE=development
DEBUG=true
BROWSERSYNC_PROXY=http://twoja-domena.local
```

**Ważne**: Webpack automatycznie ładuje odpowiedni plik `.env` na podstawie `NODE_ENV`.

### Komendy NPM

#### Główne komendy developmentowe

```bash
# 🏃‍♂️ Uruchom podstawowy development (tylko webpack watch)
npm start
# lub
npm run dev
# lub bezpośrednio:
./dev.sh

# 🌐 Uruchom development z BrowserSync (live reload)
npm run dev:sync
# lub bezpośrednio:
./dev-sync.sh

# 👀 Tylko obserwowanie zmian webpack bez BrowserSync
npm run dev:watch

# 🔄 Pełny development z obserwowaniem plików PHP
npm run dev:full
```

#### Budowanie produkcyjne

```bash
# 📦 Build produkcyjny
npm run build

# 🔨 Build developmentowy (bez watch)
npm run build:dev

# 🧹 Wyczyść folder dist
npm run clean
```

#### Pomocnicze komendy

```bash
# 🌐 Tylko BrowserSync (bez webpack)
npm run browsersync

# 👁️ Obserwowanie tylko plików PHP
npm run watch:php

# 🛠️ Reset środowiska NODE_ENV
npm run reset-env

# 🔧 Naprawa dependencji
npm run fix-env
```

### Struktura plików

```
├── src/                    # Pliki źródłowe
│   ├── js/
│   │   ├── _app.js         # Główny punkt wejścia JS
│   │   └── lib/
│   │       └── _libraries.js # Biblioteki JS
│   └── css/
│       ├── style.scss      # Główny SCSS
│       └── editor-styles.scss
├── dist/                   # Pliki wygenerowane przez webpack
│   ├── build-style.css     # Główny CSS
│   ├── build-js.js         # Główny JS
│   ├── build-libs.js       # Biblioteki JS
│   ├── build-combined.js   # Połączony JS (libs + main)
│   └── editor-styles.css   # Style edytora
├── assets/                 # Zasoby statyczne
│   ├── img/               # Obrazy (kopiowane do dist/img)
│   └── fonts/             # Czcionki (kopiowane do dist/fonts)
├── scripts/               # Skrypty pomocnicze
│   ├── browsersync.js     # Konfiguracja BrowserSync
│   └── watch-php.js       # Obserwowanie plików PHP
├── config/                # Konfiguracja
│   └── development.js     # Centralna konfiguracja development
├── webpack.config.js      # Konfiguracja webpack
├── package.json          # Zależności i skrypty NPM
├── dev.sh               # Skrypt uruchamiania development
├── dev-sync.sh          # Skrypt development z BrowserSync
└── .env.*              # Zmienne środowiskowe
```

### Pliki wyjściowe (dist/)

Po uruchomieniu webpack generuje następujące pliki w folderze `dist/`:

```
dist/
├── build-style.css           # Główne style CSS (z src/css/style.scss)
├── build-style.css.map       # Source map dla CSS (development)
├── build-js.js              # Główny JavaScript (z src/js/_app.js)
├── build-js.js.map           # Source map dla JS (development)
├── build-libs.js             # Tylko biblioteki JS (z src/js/lib/_libraries.js)
├── build-combined.js         # Połączony JS: libs + main
├── editor-styles.css         # Style edytora Gutenberg
├── img/                      # Obrazy (skopiowane z assets/img + CSS imports)
│   └── *.{png,jpg,svg,webp}
└── fonts/                    # Czcionki (skopiowane z assets/fonts + CSS imports)
    └── *.{woff,woff2,ttf,otf}
```

**Jak używać w WordPress**:

```php
// W functions.php lub theme
wp_enqueue_style('theme-style', get_template_directory_uri() . '/dist/build-style.css');
wp_enqueue_script('theme-js', get_template_directory_uri() . '/dist/build-js.js');

// Lub używaj combined (libs + main razem)
wp_enqueue_script('theme-combined', get_template_directory_uri() . '/dist/build-combined.js');
```

#### Entry points

Webpack kompiluje następujące entry points:

- `main` → `build-js.js` + `build-style.css`
- `libs` → `build-libs.js`  
- `combined` → `build-combined.js` (libs + main)
- `editor-styles` → `editor-styles.css`

#### Obsługiwane formaty

- **JavaScript**: ES6+ (transpilowane przez Babel)
- **CSS/SCSS**: Nowoczesne @use imports, autoprefixer
- **Obrazy**: PNG, JPG, JPEG, GIF, SVG, WebP
- **Czcionki**: EOT, TTF, OTF, WOFF, WOFF2

#### Live reload i BrowserSync

System automatycznie odświeża stronę przy zmianie:

- ✅ Plików SCSS/CSS
- ✅ Plików JavaScript  
- ✅ Plików PHP WordPress (wszystkie foldery)
- ✅ Plików HTML/template

**Porty**:
- BrowserSync: `http://localhost:3000`
- BrowserSync UI: `http://localhost:3001`
- Webpack Dev Server: `http://localhost:3050`

### Rozwiązywanie problemów

#### Problemy z webpack command

Jeśli webpack nie jest znaleziony, użyj:

```bash
# Zamiast webpack użyj npx
npx webpack --mode=development --watch
```

#### Reset środowiska

```bash
# Wyczyść NODE_ENV i reinstaluj
./reset-env.sh
# lub
npm run reset-env
```

#### Problemy z zależnościami

```bash
# Reinstalacja wszystkich devDependencies
npm run fix-env
```

### Migracja z Gulp

Wszystkie funkcjonalności Gulp zostały przeniesione:

| Gulp Task | Webpack/NPM | Opis |
|-----------|-------------|------|
| `gulp styles` | `webpack` | Kompilacja SCSS → CSS |
| `gulp scripts` | `webpack` | Kompilacja JS |
| `gulp watch` | `webpack --watch` | Obserwowanie zmian |
| `gulp browsersync` | `BrowserSyncPlugin` | Live reload |
| `gulp build` | `npm run build` | Build produkcyjny |

#### Zalety Webpack 5 vs Gulp 4

✅ **Korzyści z migracji**:
- ⚡ **Szybsze budowanie** - HMR, cache, parallel processing
- 📦 **Lepsza obsługa modułów** - ES6, CommonJS, AMD
- 🌳 **Tree shaking** - automatyczne usuwanie nieużywanego kodu
- 🎯 **Code splitting** - automatyczne dzielenie bundli
- 🗺️ **Source maps** - zintegrowane bez dodatkowej konfiguracji
- 🔄 **Hot Module Replacement** - natychmiastowe aplikowanie zmian
- 📱 **Better async handling** - lepsze zarządzanie asynchronicznymi operacjami
- 🛠️ **Lepsze narzędzia dev** - webpack dev server, analyze bundle
- 🏗️ **Modular architecture** - łatwiejsza rozbudowa konfiguracji

### Zaawansowane funkcje

#### Source Maps
- **Development**: Pełne source maps dla łatwego debugowania
- **Production**: Source maps wyłączone dla wydajności

#### Cache busting
- Webpack automatycznie generuje hashe plików w production
- Brak potrzeby ręcznego cache busting

#### Tree shaking
- Automatyczne usuwanie nieużywanego kodu w production
- Mniejsze rozmiary plików wyjściowych

#### PostCSS + Autoprefixer
- Automatyczne dodawanie vendor prefixes
- Obsługa nowoczesnych CSS features
- Konfiguracja w package.json: `last 2 versions, not dead, > 0.2%`

#### Webpack Dev Server
```bash
npm run serve  # Uruchom webpack dev server na porcie 3050
```

#### Pliki obserwowane przez BrowserSync
```javascript
// Automatycznie odświeżane w przeglądarce:
- dist/**/*.css     // Style CSS
- dist/**/*.js      // JavaScript
- *.php             // Główne pliki PHP
- functions/**/*.php // Funkcje motywu
- template-parts/**/*.php // Części szablonów
- partials/**/*.php // Komponenty
- inc/**/*.php      // Includes
- includes/**/*.php // Includes (alternatywna struktura)
```

#### Optymalizacje produkcyjne
- **CSS**: Minifikacja, usunięcie komentarzy
- **JS**: Minifikacja (Terser), usunięcie console.log
- **Images**: Kopiowanie do odpowiednich folderów
- **Fonts**: Kopiowanie z zachowaniem struktury

---

## 🎯 Szybka konfiguracja - Zmiana URL lokalnego WordPress

### Jedyne miejsce do zmiany URL

Aby zmienić URL swojej lokalnej strony WordPress, edytuj **tylko** plik `config/development.js`:

```javascript
module.exports = {
  // 🌍 ZMIEŃ TYLKO TEN URL
  WORDPRESS_URL: 'http://twoja-domena.local',
  
  // Reszta konfiguracji pozostaje bez zmian
  BROWSERSYNC_PORT: 3000,
  // ...
}
```

Po zmianie URL automatycznie zaktualizują się:
- ✅ BrowserSync proxy (`scripts/browsersync.js`)
- ✅ Webpack BrowserSync Plugin (`webpack.config.js`)  
- ✅ Wszystkie skrypty developmentowe

**Nie musisz** edytować żadnych innych plików! 🎉

### Przykłady popularnych nazw lokalnych

```javascript
// WordPress Local by Flywheel
WORDPRESS_URL: 'http://nazwa-witryny.local',

// MAMP/XAMPP
WORDPRESS_URL: 'http://localhost:8888/nazwa-folderu',

// Valet (macOS)
WORDPRESS_URL: 'http://nazwa-folderu.test',

// Docker  
WORDPRESS_URL: 'http://localhost:8080',
```

---

## Komponenty sekcji (partials)

### Sekcja: section-image.php

#### Opis
Partial umożliwiający dodanie sekcji z obrazkiem po lewej stronie i treścią po prawej. Układ jest w pełni konfigurowalny dzięki opcjom CSS grid.

#### Parametry

| Parametr         | Opis                                    | Wymagany | Domyślny        |
|------------------|----------------------------------------|----------|-----------------|
| `image`          | Tablica z obrazem (format ACF image)    | Tak      | -               |
| `content`        | Zawartość HTML sekcji                   | Tak      | -               |
| `button`         | Tablica z przyciskiem (format ACF link) | Nie      | -               |
| `background`     | Tło sekcji (format ACF image)           | Nie      | -               |
| `section_id`     | ID sekcji                               | Nie      | -               |
| `section_class`  | Dodatkowe klasy dla sekcji              | Nie      | -               |
| `container_class`| Dodatkowe klasy dla kontenera           | Nie      | -               |
| `image_class`    | Klasy dla kolumny obrazka               | Nie      | `gc-2/7`        |
| `content_class`  | Klasy dla kolumny treści                | Nie      | `gc-8/14`       |
| `button_class`   | Klasa przycisku                         | Nie      | `button-primary`|

#### Przykład użycia

```php
<?php
// Podstawowe użycie
get_template_part('partials/section-image', null, [
    'image' => get_field('obraz_sekcji'),
    'content' => get_field('tresc_sekcji'),
    'button' => get_field('przycisk_sekcji')
]);

// Zaawansowane użycie z wszystkimi parametrami
get_template_part('partials/section-image', null, [
    'image' => get_field('obraz_sekcji'),
    'content' => get_field('tresc_sekcji'),
    'button' => get_field('przycisk_sekcji'),
    'background' => get_field('tlo_sekcji'),
    'section_id' => 'sekcja-o-nas',
    'section_class' => 'pt-120 pb-90',
    'container_class' => 'align-start',
    'image_class' => 'gc-2/6 gr-1/2',
    'content_class' => 'gc-7/13',
    'button_class' => 'button-secondary'
]);

// Użycie z grupą ACF
$hero_section = get_field('hero_section'); // pobranie grupy ACF
if ($hero_section) {
    get_template_part('partials/section-image', null, [
        'image' => $hero_section['image'],
        'content' => $hero_section['content'],
        'button' => $hero_section['button'],
        'section_class' => 'hero-section pt-150 pb-100',
        'image_class' => $hero_section['image_alignment'] == 'narrow' ? 'gc-2/6' : 'gc-2/8',
        'content_class' => $hero_section['image_alignment'] == 'narrow' ? 'gc-7/14' : 'gc-9/14'
    ]);
}
```

## System Grid

### Klasy grid

Możesz użyć klas grid do precyzyjnego kontrolowania układu:

- `gc-X/Y` - definiuje kolumny od X do Y (np. gc-2/7)
- `gr-X/Y` - definiuje wiersze od X do Y (np. gr-1/3)
- `align-center`, `align-start`, `align-end` - wyrównanie pionowe
- `justify-center`, `justify-start`, `justify-end` - wyrównanie poziome

### Responsywne klasy grid

Dostępne są również responsywne wersje klas grid:

- `gc-xs-X/Y`, `gc-sm-X/Y`, `gc-md-X/Y`, `gc-lg-X/Y`, `gc-xl-X/Y`
- `gr-xs-X/Y`, `gr-sm-X/Y`, `gr-md-X/Y`, `gr-lg-X/Y`, `gr-xl-X/Y`

## System odstępów (Spacing)

Możesz używać klas marginesów i paddingów:

- `mt-X`, `mb-X`, `ml-X`, `mr-X` - marginesy (top, bottom, left, right)
- `pt-X`, `pb-X`, `pl-X`, `pr-X` - paddingi 
- `mx-X`, `my-X` - marginesy w osi X (lewo+prawo) lub Y (góra+dół)
- `px-X`, `py-X` - paddingi w osi X lub Y
- `m-X`, `p-X` - marginesy lub paddingi ze wszystkich stron

Gdzie X to wartości: 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150.

Przykład: `mt-120 mb-60` doda margines górny 120px i dolny 60px.

### Klasy odstępów (Gap)

Dostępne są również klasy dla odstępów między elementami w kontenerach flex/grid:

- `gap-X` - odstęp we wszystkich kierunkach 
- `row-gap-X` - odstęp pionowy
- `column-gap-X` - odstęp poziomy

Wartości X to liczby od 0 do 500 co 25, reprezentujące 0rem do 5rem co 0.25rem.
Przykład: `gap-125` to gap: 1.25rem;

Responsywne klasy gap:
- `gap-sm-X`, `gap-md-X`, itd.
- `row-gap-sm-X`, `column-gap-md-X`, itd.
