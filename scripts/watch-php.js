#!/usr/bin/env node

const chokidar = require('chokidar');
const path = require('path');

console.log('🔍 Watching PHP files for changes...');

// Obserwowane pliki PHP WordPress - bardziej konkretne ścieżki
const watchPaths = [
  '.', // Cały obecny katalog (będzie filtrować .php w event handlerach)
];

console.log('📁 Watching current directory for PHP files');

// Inicjalizuj watcher
const watcher = chokidar.watch(watchPaths, {
  ignored: [
    /node_modules/,
    /\.git/,
    /dist/,
    /vendor/,
    /scripts/
  ],
  persistent: true,
  usePolling: true,
  interval: 1000,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  },
  ignoreInitial: false
});

// Event handlers
watcher
  .on('change', (filePath) => {
    if (filePath.endsWith('.php')) {
      console.log(`📝 Changed: ${path.relative(process.cwd(), filePath)}`);
      console.log(`🔄 PHP file modified at ${new Date().toLocaleTimeString()}`);
    }
  })
  .on('add', (filePath) => {
    if (filePath.endsWith('.php')) {
      console.log(`➕ Added: ${path.relative(process.cwd(), filePath)}`);
    }
  })
  .on('unlink', (filePath) => {
    if (filePath.endsWith('.php')) {
      console.log(`🗑️  Removed: ${path.relative(process.cwd(), filePath)}`);
    }
  })
  .on('ready', () => {
    console.log('✅ PHP file watcher ready!');
    const watched = watcher.getWatched();
    console.log(`👀 Watching ${Object.keys(watched).length} directories`);
    console.log('📂 Directories:', Object.keys(watched).join(', '));
  })
  .on('error', (error) => {
    console.error('❌ Watcher error:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping PHP file watcher...');
  watcher.close();
  process.exit(0);
});
