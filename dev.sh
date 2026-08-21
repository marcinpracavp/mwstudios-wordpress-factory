#!/bin/bash

echo "🚀 Uruchamianie środowiska deweloperskiego..."

# Krok 1: Wyczyść NODE_ENV
echo "🔧 Czyszczenie NODE_ENV..."
unset NODE_ENV

# Krok 2: Sprawdź czy webpack jest zainstalowany
if [ ! -f "node_modules/.bin/webpack" ]; then
    echo "📦 Webpack nie znaleziony. Instalowanie devDependencies..."
    npm install --include=dev
fi

# Krok 3: Uruchom webpack w trybie development
echo "▶️  Uruchamianie webpack..."
NODE_ENV=development ./node_modules/.bin/webpack --mode=development --watch
