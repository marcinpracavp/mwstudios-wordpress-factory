/*
 * 🚀 INSTRUKCJA SZYBKIEJ KONFIGURACJI URL
 * 
 * Zmień wartość WORDPRESS_URL poniżej na adres swojej lokalnej witryny WordPress
 * 
 * Przykłady:
 * - WordPress Local: 'http://nazwa-witryny.local'
 * - MAMP/XAMPP: 'http://localhost:8888/nazwa-folderu' 
 * - Valet: 'http://nazwa-folderu.test'
 * - Docker: 'http://localhost:8080'
 * 
 * Po zmianie tej wartości automatycznie zaktualizują się:
 * ✅ BrowserSync proxy
 * ✅ Webpack BrowserSync Plugin  
 * ✅ Wszystkie skrypty developmentowe
 */

/**
 * Centralna konfiguracja dla środowiska deweloperskiego
 * Edytuj tylko ten plik aby zmienić ustawienia development
 */

module.exports = {
  // 🌍 URL WordPress Local - ZMIEŃ NA SWÓJ LOKALNY ADRES
  WORDPRESS_URL: 'http://safegold.local',
  
  // 🌐 Porty BrowserSync  
  BROWSERSYNC_PORT: 3000,
  BROWSERSYNC_UI_PORT: 3001,
  
  // ⚙️ Porty Webpack Dev Server
  WEBPACK_DEV_PORT: 3050,
  
  // 👁️ Ścieżki do obserwowania
  WATCH_PATHS: {
    php: [
      '*.php',
      'functions/**/*.php',
      'inc/**/*.php',
      'includes/**/*.php', 
      'template-parts/**/*.php',
      'partials/**/*.php',
      'templates/**/*.php',
      'page-templates/**/*.php'
    ],
    assets: [
      'dist/**/*.css',
      'dist/**/*.js'
    ]
  },
  
  // 🎨 Opcje BrowserSync
  BROWSERSYNC_OPTIONS: {
    notify: {
      styles: {
        top: 'auto',
        bottom: '0',
        margin: '0px',
        padding: '5px 10px',
        position: 'fixed',
        fontSize: '10px',
        zIndex: '9999',
        borderRadius: '5px 0px 0px',
        color: 'white',
        backgroundColor: 'rgba(60,197,31,0.498039)'
      }
    },
    open: false,        // Nie otwieraj automatycznie przeglądarki
    logLevel: 'info',   // Poziom logowania  
    logPrefix: 'WP-DEV', // Prefix w logach
    ghostMode: {        // Synchronizacja między przeglądarkami
      clicks: true,
      forms: true,
      scroll: true
    }
  }
};
