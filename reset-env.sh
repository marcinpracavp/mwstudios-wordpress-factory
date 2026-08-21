#!/bin/bash

# Reset Environment Script
echo "🔄 Resetowanie środowiska deweloperskiego..."

# Wyczyść zmienną NODE_ENV
unset NODE_ENV

# Sprawdź czy plik .env.local istnieje
if [ ! -f ".env.local" ]; then
    echo "📝 Tworzenie .env.local..."
    cat > .env.local << 'EOF'
NODE_ENV=development
WEBPACK_MODE=development
DEBUG=true
BROWSERSYNC_PROXY=http://ogarnijto.local
EOF
fi

# Załaduj zmienne z .env.local (bez komentarzy)
export $(grep -v '^#' .env.local | xargs)

echo "✅ NODE_ENV ustawione na: $NODE_ENV"
echo "📦 Uruchamianie npm run dev:local..."

npm run dev:local
