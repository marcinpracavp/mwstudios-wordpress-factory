#!/usr/bin/env node

const browserSync = require('browser-sync').create();
const chokidar = require('chokidar');
const path = require('path');
const config = require('../config/development');

// Konfiguracja z centralnego pliku config/development.js
const WORDPRESS_URL = config.WORDPRESS_URL;

console.log('🌐 Starting BrowserSync for WordPress development...');
console.log(`📍 WordPress URL: ${WORDPRESS_URL}`);

// Inicjalizuj BrowserSync
browserSync.init({
  proxy: WORDPRESS_URL,
  port: config.BROWSERSYNC_PORT,
  ui: {
    port: config.BROWSERSYNC_UI_PORT
  },
  files: [
    ...config.WATCH_PATHS.assets,
    ...config.WATCH_PATHS.php
  ],
  watchOptions: {
    ignoreInitial: true,
    ignored: [
      'node_modules/**',
      '.git/**',
      'vendor/**'
    ]
  },
  // Opcje reloadowania
  reloadOnRestart: true,
  ...config.BROWSERSYNC_OPTIONS,
  // Wstrzykiwanie skryptów
  snippetOptions: {
    rule: {
      match: /<\/body>/i,
      fn: function (snippet, match) {
        return snippet + match;
      }
    }
  }
});

console.log('✅ BrowserSync started!');
console.log(`🔗 Local: http://localhost:${config.BROWSERSYNC_PORT}`);
console.log(`⚙️  UI: http://localhost:${config.BROWSERSYNC_UI_PORT}`);
console.log('🔍 Watching files for changes...');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping BrowserSync...');
  browserSync.exit();
  process.exit(0);
});
