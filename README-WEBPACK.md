# 🚀 Slawinsky WordPress Boilerplate - Webpack Build System

Ten temat WordPress używa **Webpack 5** jako głównego narzędzia do buildowania zamiast Gulp.

## 🛠️ Komendy Development

### Podstawowe komendy:

```bash
# Tryb development z watch mode (podstawowy)
npm run dev

# Tryb development z BrowserSync (zalecany)
npm run dev:sync

# Tryb development z obserwowaniem plików PHP
npm run dev:full

# Serwer development Webpack
npm run serve

# Build produkcyjny
npm run build

# Czyszczenie katalogu dist
npm run clean
```

## 🔧 Tryby Development

### 1. `npm run dev` - Podstawowy tryb
- ✅ Kompilacja SCSS → CSS
- ✅ Transpilacja ES6+ → ES5
- ✅ Watch mode dla plików JS/SCSS
- ✅ LiveReload na porcie 35729

### 2. `npm run dev:sync` - Z BrowserSync (ZALECANY)
- ✅ Wszystko z trybu podstawowego
- ✅ BrowserSync proxy dla WordPress
- ✅ Automatyczne odświeżanie przeglądarki
- ✅ Synchronizacja między urządzeniami
- ✅ Obserwowanie plików PHP
- 🌐 **Local**: http://localhost:3000
- ⚙️ **UI**: http://localhost:3001

### 3. `npm run dev:full` - Z obserwowaniem PHP
- ✅ Wszystko z trybu podstawowego
- ✅ Obserwowanie plików PHP z LiveReload
- ✅ Automatyczne powiadomienia o zmianach

## 📁 Struktura Plików

### Źródła (src):
```
src/
├── css/
│   ├── style.scss          # Główny plik stylów
│   ├── editor-styles.scss  # Style dla edytora Gutenberg
│   ├── abstracts/          # Zmienne, mixiny, funkcje
│   ├── base/               # Reset, typography, base styles
│   ├── components/         # Komponenty (buttons, forms, etc.)
│   ├── layout/             # Layout (header, footer, grid)
│   └── pages/              # Style specyficzne dla stron
└── js/
    ├── _app.js             # Główny plik JavaScript
    └── lib/
        ├── _libraries.js   # Import wszystkich bibliotek
        ├── aoe.js          # AOS animations
        ├── headroom.js     # Headroom.js
        ├── swiper.js       # Swiper slider
        └── viewer.js       # Image viewer
```

### Pliki wyjściowe (dist):
```
dist/
├── build-style.css        # Główne style CSS
├── combined-style.css     # Style + biblioteki razem
├── editor-styles.css      # Style dla edytora WordPress
├── build-js.js           # Główny JavaScript aplikacji
├── build-libs.js         # Biblioteki JavaScript
├── build-combined.js     # JS + biblioteki razem
└── fonts/                # FontAwesome fonty
    ├── fa-solid-900.woff2
    ├── fa-solid-900.ttf
    └── ...
```

## 🎯 Obserwowane Pliki

### Webpack automatycznie obserwuje:
- `src/css/**/*.scss` - Pliki SCSS
- `src/js/**/*.js` - Pliki JavaScript

### BrowserSync dodatkowo obserwuje:
- `*.php` - Główne pliki PHP tematu
- `functions/**/*.php` - Funkcje tematu
- `template-parts/**/*.php` - Części szablonów
- `partials/**/*.php` - Fragmenty szablonów
- `includes/**/*.php` - Pliki include
- `dist/**/*.css` - Skompilowane style
- `dist/**/*.js` - Skompilowane skrypty

## ⚙️ Konfiguracja BrowserSync

Aby BrowserSync działał poprawnie z WordPress Local, zaktualizuj URL w pliku `scripts/browsersync.js`:

```javascript
const WORDPRESS_URL = 'http://twoja-domena.local'; // Zmień na swoją domenę
```

## 🔥 Hot Features

### 🎨 SCSS z nowoczesną składnią:
- `@use` zamiast `@import`
- Automatyczne prefiksy CSS
- Minifikacja w trybie produkcyjnym
- PostCSS processing

### 📱 JavaScript ES6+:
- Babel transpilacja
- Automatyczne łączenie bibliotek
- Tree shaking w produkcji
- Source maps w development

### 🔄 Live Reload:
- Natychmiastowe odświeżanie przy zmianach CSS
- Automatyczne przeładowanie przy zmianach PHP
- Synchronizacja między urządzeniami
- Powiadomienia o zmianach

### 🚀 Optymalizacja:
- Automatyczne kopiowanie fontów
- Obsługa obrazów SVG/PNG/JPG
- Minifikacja w produkcji
- Caching dla szybszych buildów

## 🐛 Troubleshooting

### BrowserSync nie działa:
1. Sprawdź czy WordPress Local uruchomiony
2. Zaktualizuj URL w `scripts/browsersync.js`
3. Sprawdź czy port 3000 nie jest zajęty

### LiveReload nie działa:
1. Sprawdź czy port 35729 nie jest zajęty
2. Użyj `npm run dev:sync` zamiast `npm run dev`

### Błędy kompilacji SCSS:
1. Sprawdź składnię `@use` zamiast `@import`
2. Sprawdź ścieżki w `loadPaths` w webpack.config.js

## 📈 Performance

### Development:
- Szybkie rebuilds dzięki Webpack cache
- Hot Module Replacement dla CSS
- Incremental compilation

### Production:
- Minifikacja CSS i JS
- Tree shaking
- Optymalizacja obrazów
- Gzip-ready assets

---

**🔧 Migracja z Gulp zakończona!** Wszystkie funkcjonalności zostały przeniesione do Webpack z dodatkowymi ulepszeniami.
