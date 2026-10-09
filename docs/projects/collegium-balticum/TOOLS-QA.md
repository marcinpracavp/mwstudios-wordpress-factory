# Zadanie 2 — rzeczywiste wyniki narzędzi LIVE

Data: 2026-10-09. Narzędzia: [RUNNING](../../live-migration/RUNNING.md).
Konfiguracja: [live.json](live.json), wszystkie CB-00–CB-18, dokładne ścieżki
z [PAGES](PAGES.md), siedem viewportów 320/390/768/1024/1280/1440/2048.
`localUrl=http://localhost:8000` pochodzi z opublikowanego portu istniejącego
`.devcontainer/docker-compose.yml`, potwierdzonego HTTP 200.
Nie jest to potwierdzenie istniejącej witryny LocalWP użytkownika; przed jej
użyciem wpisać zweryfikowany adres i nowy reportDir.

## Implementacja i granice etapu

Działa adapter LIVE dla dowolnej domeny z jawnej konfiguracji: capture źródła
oraz lokalnej strony, PNG diff pełnej strony, layout DOM, raport per URL/viewport,
błędy HTTP/screenshot/browser, checkpoint/retry i osobne sześć statusów.
Nie jest to implementacja CB ani automatyczny importer/worker migracji.
Nie utworzono pól ACF, stron CB, nowych partiali ani treści klienta w PHP.

Silnik jest na branchu `feature/live-migration-tools`, baza `e355bcf`,
commit `3583a4d`. W `project/collegium-balticum` cherry-pick `8d1de82`
(z bazy dokumentacji klienta `bb1b4f3`). Branch `autopilot-clean` nadal
`0077847`. Konfiguracja i wyniki klienta są oddzielone od silnika.
Nie wykonano push ani deploymentu. Oryginalne PDF/DOCX są niezmienione i
nieśledzone; nie zostały dodane do commitów.

## Lokalny WordPress

Początkowo `http://wordpress` nie rozwiązywał DNS, WP nie łączył się z DB,
a Docker nie miał uruchomionych kontenerów. Po uzyskaniu dostępu do Docker
uruchomiono istniejący compose pod izolowaną nazwą `factory-live-qa`:
`db`, `wordpress`, `wpcli`, z nowymi wolumenami testowymi bez resetu danych.
Nowa baza nie była zainstalowana; wykonano `wp core install` z URL wynikającym
z portu compose oraz `wp option update blog_public 0`.

Potwierdzono HTTP 200 i rzeczywiste screenshoty WordPressa. Motyw domyślny
WordPress pozostaje aktywny. W środowisku brak ACF Pro; nie pobierano prywatnej
wtyczki, nie zastępowano jej atrapą i nie deklarowano gotowości factory/CB.
Instalacja zgłosiła warning o uprawnieniach katalogu uploads; capture strony
bez dodawania mediów działa. Przed importem mediów rozwiązać uprawnienia
w testowej instalacji. Polecenia uruchomienia w RUNNING.

## Test niezależności od CB: publiczne example.com + WordPress

Wykonano:

`npm run factory:live -- run --config scripts/factory/live/example.json`

| Viewport | HTTP źródła | HTTP WP | Różniące piksele | Visual QA |
| --- | --- | --- | --- | --- |
| desktop | 200 | 200 | 20.17% | BLOCKED |
| mobile | 200 | 200 | 13.32% | BLOCKED |

Powstały prawdziwe referencje, local PNG, diff PNG, layout.json, metrics.json
oraz comparison.json. Różnice są oczekiwane: publiczne example.com i domyślny
WordPress mają różne układy/treści; exit 1 dokumentuje ten wynik. Nie oznacza
awarii capture ani PASS migracji. Referencja desktop zachowana z wcześniejszego
runu; kolejne uruchomienie tworzy nowy local capture i zachowuje źródło.

Raport: `.factory-cache/live/example-migration/REPORT.md`, pełne dane:
`.factory-cache/live/example-migration/summary.json`.
Aktywne artefakty:
- desktop: reference `.factory-cache/live/example-migration/runs/2026-10-09T14-40-28-900Z-53822/home/desktop/reference/full.png`; local `.factory-cache/live/example-migration/runs/2026-10-09T14-48-00-260Z-57131/home/desktop/local/full.png`; diff `.factory-cache/live/example-migration/runs/2026-10-09T14-48-00-260Z-57131/home/desktop/diff.png`.
- mobile: reference `.factory-cache/live/example-migration/runs/2026-10-09T14-48-00-260Z-57131/home/mobile/reference/full.png`; local `.factory-cache/live/example-migration/runs/2026-10-09T14-48-00-260Z-57131/home/mobile/local/full.png`; diff `.factory-cache/live/example-migration/runs/2026-10-09T14-48-00-260Z-57131/home/mobile/diff.png`.

## Test CB i obsługi błędu dostępu

Wykonano:

`npm run factory:autopilot -- live run --config docs/projects/collegium-balticum/live.json --route CB-00 --viewport desktop`

CB-00: nawigacja produkcji przekroczyła 30000 ms, capture BLOCKED, brak
referencyjnego PNG i brak diffu CB. Niezależny GET HEAD curl do home oraz
/kontakt/ również nie połączył się z portem 443 w limicie 10 s. Jest to
ograniczenie dostępu z tej sesji, bez wniosku o globalnej awarii witryny.
Local WordPress: HTTP 200, screenshot DONE. Pozostałe CB-01–CB-18 oraz
nieuruchomione viewporty pozostają w pełnym rejestrze, bez fikcyjnych dowodów.
Wszystkie TEMPLATE, CONTENT i WCAG QA CB pozostają TODO.

Raport: `.factory-cache/live/collegium-balticum/REPORT.md` i summary.json.
Cache jest ignorowany przez Git; ten dokument utrwala fakty wykonania,
nie zastępuje PNG. Referencję CB należy wykonać ponownie z dostępnej sieci.
Nie obniżono progów i nie oznaczono CB-00 jako gotowej.

## Wyniki kontroli

- `npm run factory:live:test`: 3/3 PASS, rzeczywisty Chromium i serwer HTTP;
  walidacja, pełny rejestr w partii, capture/layout, identyczny i zmieniony obraz,
  nierówna wysokość, 404, redirect, brak połączenia, nieudany screenshot, hash
  mismatch, stale build, powtórzenie z zamrożoną referencją, template bez content.
- `node docs/projects/collegium-balticum/live-config.test.js`: 1/1 PASS,
  wszystkie 19 adresów porównane z PAGES, dispatch Autopilota LIVE i viewporty.
- `npm run factory:autopilot:test`: 21/21 PASS dotychczasowych testów.
- `npm run factory:validate`: FACTORY VALID; Figma pozostaje dostępna.
- `npm run build`: exit 0, Webpack 5.100.2; trzy dotychczasowe ostrzeżenia
  rozmiaru assetów/entrypointów i zalecenia wydajności. Bez błędów kompilacji.
- `git diff --check` i sprawdzenie składni nowych modułów JS: PASS.

## Komendy CB do następnych partii i poprawek

```bash
npm run factory:live -- validate --config docs/projects/collegium-balticum/live.json
npm run factory:live -- capture --config docs/projects/collegium-balticum/live.json --target reference --route CB-00,CB-01 --viewport desktop,mobile
npm run factory:live -- capture --config docs/projects/collegium-balticum/live.json --target local --route CB-00,CB-01 --viewport desktop,mobile
npm run factory:live -- compare --config docs/projects/collegium-balticum/live.json --route CB-00,CB-01 --viewport desktop,mobile
npm run factory:live -- run --config docs/projects/collegium-balticum/live.json --route CB-00 --viewport desktop
npm run factory:live -- status --config docs/projects/collegium-balticum/live.json
```

Bez filtrów capture/run obejmuje wszystkie 19 × 7 pozycji; zalecane partie.
Statusy review dla template/content/WCAG nadawać dopiero po rzeczywistej pracy
na konkretnym lokalnym URL i zapisaniu dowodów zgodnie z RUNNING.
