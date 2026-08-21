#!/bin/bash

echo "🚀 Uruchamianie środowiska deweloperskiego z BrowserSync..."

# Wyczyść NODE_ENV
unset NODE_ENV

# Sprawdź czy webpack jest zainstalowany
if [ ! -f "node_modules/.bin/webpack" ]; then
    echo "📦 Instalowanie devDependencies..."
    npm install --include=dev
fi

# Sprawdź czy concurrently jest zainstalowany
if [ ! -f "node_modules/.bin/concurrently" ]; then
    echo "📦 Instalowanie concurrently..."
    npm install concurrently --save-dev
fi

# Uruchom webpack + browsersync
echo "▶️  Uruchamianie webpack + BrowserSync..."
NODE_ENV=development ./node_modules/.bin/concurrently \
  --kill-others \
  --prefix-colors "cyan,green" \
  --prefix "[{name}]" \
  "NODE_ENV=development ./node_modules/.bin/webpack --mode=development --watch" \
  "NODE_ENV=development node scripts/browsersync.js"
