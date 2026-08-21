# 🚀 Szybki Start - Slawinsky Theme

## Krok 1: Konfiguracja URL

Edytuj plik `config/development.js` i zmień URL na swój lokalny WordPress:

```javascript
module.exports = {
  WORDPRESS_URL: 'http://twoja-domena.local', // 👈 ZMIEŃ TO!
  // ...
}
```

## Krok 2: Instalacja zależności

```bash
npm install
```

## Krok 3: Wybierz tryb development

### Opcja A: Podstawowy development (szybki)
```bash
npm run dev
# lub
./dev.sh
```

### Opcja B: Z BrowserSync (live reload)
```bash
npm run dev:sync  
# lub
./dev-sync.sh
```

## Krok 4: Build produkcyjny

```bash
npm run build
```

## Najważniejsze komendy

```bash
npm run dev        # Development z webpack watch
npm run dev:sync   # Development z BrowserSync live reload  
npm run build      # Build produkcyjny
npm run clean      # Wyczyść folder dist/
```

## Porty

- **WordPress**: `http://twoja-domena.local`
- **BrowserSync**: `http://localhost:3000`
- **BrowserSync UI**: `http://localhost:3001`

## Pliki do edycji

- `src/css/style.scss` - główne style
- `src/js/_app.js` - główny JavaScript
- `config/development.js` - ustawienia development

---

**🆘 Problemy?** Zobacz pełny README.md
