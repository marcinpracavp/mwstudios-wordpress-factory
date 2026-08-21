# 🚀 Rozwiązanie problemu z NODE_ENV i Webpack

## Problem
Zmienna `NODE_ENV=production` była ustawiona globalnie w systemie, co blokowało instalację `devDependencies` i prawidłowe działanie Webpack w trybie development.

## Rozwiązanie

### Proste uruchamianie (REKOMENDOWANE):

```bash
# Uruchom webpack z automatycznym czyszczeniem NODE_ENV
./dev.sh

# Uruchom webpack + BrowserSync
./dev-sync.sh

# Lub użyj npm
npm start          # to samo co ./dev.sh
npm run dev        # to samo co ./dev.sh  
npm run dev:sync   # to samo co ./dev-sync.sh
```

### Jeśli masz problem z instalacją pakietów:

```bash
# Napraw środowisko i reinstaluj pakiety
npm run fix-env
```

### Ręczne czyszczenie NODE_ENV:

```bash
# Sprawdź obecną wartość
echo $NODE_ENV

# Wyczyść globalnie (tymczasowo)
unset NODE_ENV

# Lub dodaj do ~/.zshrc aby automatycznie czyścić dla tego projektu:
echo 'if [[ "$PWD" == *"ogarnij-to"* ]]; then export NODE_ENV=development; fi' >> ~/.zshrc
```

## Dostępne komendy:

- `./dev.sh` - Podstawowy webpack watch
- `./dev-sync.sh` - Webpack + BrowserSync
- `npm start` - Alias dla ./dev.sh
- `npm run build` - Build produkcyjny
- `npm run fix-env` - Napraw środowisko

## Pliki konfiguracyjne:

- `.env.development` - Zmienne dla trybu development  
- `.env.production` - Zmienne dla trybu production
- `.env.local` - Lokalne zmienne (dodawane do .gitignore)
- `dev.sh` - Skrypt uruchamiający development
- `dev-sync.sh` - Skrypt z BrowserSync

## Co zostało naprawione:

✅ NODE_ENV jest automatycznie czyszczone  
✅ DevDependencies instalują się poprawnie  
✅ Webpack działa w trybie development  
✅ BrowserSync działa na http://localhost:3050  
✅ Wszystkie pliki JS i SCSS są obserwowane  
✅ FullCalendar i Gilroy są załadowane  

---

**Teraz wystarczy uruchomić `./dev.sh` i wszystko działa!** 🎉
