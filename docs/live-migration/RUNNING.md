# LIVE WEBSITE MIGRATION — działające komendy (zadanie 2)

Tryb LIVE jest osobnym adapterem istniejącego Autopilota. Działa przez
`factory:autopilot live` albo skrót `factory:live`. Nie wymaga Figma MCP/node ID.
Dotychczasowe polecenia Figma nie zmieniły działania.

Adapter realizuje capture, analizę layoutu, compare, checkpointy i rejestr QA.
Implementacja PHP/ACF i wprowadzanie treści pozostają pracą agenta zgodnie z
[WORKFLOW](WORKFLOW.md); ten adapter nie jest importerem ani autonomicznym
workerem przebudowującym stronę. Nie uruchamia crawlera, nie klika formularzy,
nie wysyła danych i nie wykonuje zmian na produkcji.

## Wymagania

Zainstalowane zależności repo (`npm install --include=dev`) i Chromium/Chrome/Edge.
Reużywane są `playwright-core`, `qa/browser.js`, `qa/capture.js` oraz
`autopilot/visual.js` (settle i compareImages); brak nowych zależności.

Jeżeli przeglądarki brak:

```bash
node node_modules/playwright-core/cli.js install chromium
# Opcjonalnie istniejąca przeglądarka:
FACTORY_BROWSER_PATH=/absolute/path/to/chrome npm run factory:live -- validate --config path/to/live.json
```

W środowisku sandbox przeglądarka i sieć mogą wymagać eskalacji uprawnień;
nie jest to błąd porównania. Brak przeglądarki/awaria launch jest zapisana w runs
raportu i daje exit 1. Nie powstaje wtedy fikcyjny screenshot.

## Konfiguracja nowego klienta

Skopiuj [example.json](../../scripts/factory/live/example.json) do katalogu
konfiguracji klienta poza silnikiem. Walidacja: [live.schema.json](../../factory/schemas/live.schema.json).
Wymagane: `source: live`, `project`, `sourceUrl`, `localUrl`, `routes`, `viewports`,
`reportDir` w `.factory-cache/` i jawne progi `visual`. `sourceUrl` i `localUrl`
są bazami HTTP(S), mogą mieć podkatalog instalacji; ścieżki tras są dokładne,
względem bazy, zaczynają się `/`. Bez query, fragmentów, credentials i `..`.
ID tras i viewportów oraz ścieżki muszą być unikalne.

`localUrl` jest obowiązkowy. Adapter go nie zgaduje, nie zastępuje zmienną
środowiskową i nie przepisuje lokalnych permalinków na query. Ustal adres z
LocalWP lub rzeczywistego compose/runtime. Dla `.devcontainer/docker-compose.yml`
port opublikowany na hoście to `http://localhost:8000`; wewnątrz sieci compose
serwis to `http://wordpress`. Wybierz adres osiągalny z terminala capture.

Opcjonalne: `locale`, `timeoutMs`, `settleMs`, `ignoreHTTPSErrors` (domyślnie false)
oraz selektory `selectors.sections` i `selectors.containers` dla analizy DOM.
Domyślne selektory obejmują semantyczne sekcje i klasy container; lista próbek
stylów ma limit 500 elementów, obrazy/nagłówki są zbierane osobno. To podstawowa
analiza, nie automatyczne rozpoznanie wszystkich rodzin layoutu.

## Komendy

Uruchamiaj z głównego katalogu repo. Ta sama składnia dla każdego klienta:

```bash
npm run factory:live -- validate --config scripts/factory/live/example.json
npm run factory:autopilot -- live run --config scripts/factory/live/example.json --route home --viewport desktop
npm run factory:live -- capture --config scripts/factory/live/example.json --target reference --route home
npm run factory:live -- capture --config scripts/factory/live/example.json --target local --route home
npm run factory:live -- compare --config scripts/factory/live/example.json --route home
npm run factory:live -- status --config scripts/factory/live/example.json
```

`run`: zachowuje istniejącą udaną referencję, pobiera brakującą/nieudaną,
zawsze wykonuje świeży local capture, następnie compare. Ponowne `run` po
poprawkach jest retry/resume; pozostałe trasy i viewporty pozostają w rejestrze.
`capture`: domyślnie obie strony; `--target reference|local|both`.
`compare`: tylko zapisane PNG, bez ponownego otwierania stron; weryfikuje hashe
i aktualność implementacji. Wszystkie ID są walidowane, literówka daje błąd.
Filtry `--route id1,id2` i `--viewport desktop,mobile` pozwalają na partie;
brak filtrów oznacza pełną macierz. Nie zmniejszają listy wymaganych stron.

Referencje mają osobne katalogi runu i nie są nadpisywane. Jawny recapture
`--target reference` zmienia aktywną referencję, zachowuje poprzednie pliki i
unieważnia porównanie. Nie używaj go do ukrycia błędu migracji. Zmiana konfiguracji
(w tym progów) wymaga nowego `reportDir`; stare dowody zostają. Przy równoległym
uruchomieniu lock uniemożliwia nadpisanie stanu; po awarii martwy lock jest usuwany.

Capture ma ten sam viewport, DPR=1, locale, UTC i reduced motion po obu stronach.
Czeka na fonty i lazy-loaded obrazy, wraca na początek strony, wyłącza animacje.
Nie zamyka sam banerów cookies i popupów. Referencja przedstawia ich rzeczywisty
początkowy stan; różnice stanu trzeba kontrolować przed uznaniem visual QA.

Exit 0 dla capture oznacza udane wybrane screenshoty; dla run/compare oznacza
PASS wybranej macierzy wizualnej. **Nie oznacza ukończenia migracji ani WCAG.**
HTTP >=400, timeout, TLS, awaria screenshotu, brak PNG/hash mismatch, nieaktualny
build i błędy fontów/obrazów/runtime blokują QA i zostają w JSON. Redirect źródła
jest dokumentowany bez podmiany obowiązkowego URL. Zmiana ścieżki redirectem
lokalnie blokuje `localPage` (np. przekierowanie brakującej strony na home).

## Artefakty i statusy

```text
<reportDir>/state.json                 # checkpoint wszystkich tras/viewportów
<reportDir>/summary.json               # sześć statusów per trasa + pełne dowody
<reportDir>/REPORT.md                  # czytelny raport per URL/viewport
<reportDir>/runs/<run-id>/<route>/<viewport>/
  reference/full.png                  # tylko jeśli capture wykonano w tym runie
  reference/capture.json
  reference/layout.json               # fonty, kolory, kontenery, sekcje, spacing,
  reference/metrics.json              # geometria, obrazki, ALT, Hx, canonical
  local/...                          # analogicznie
  diff.png
  comparison.json
  result.json
```

Raport wskazuje poprzedni run, gdy użyto zamrożonej referencji. Diff porównuje
pełne strony; brakujące obszary przy różnej wysokości są różnicą. Progi są jawne,
bez masek i automatycznego ich obniżania. Zmiany kodu/builda unieważniają lokalne
QA przez fingerprint istniejącego Autopilota; dane zmienione tylko w bazie WP
wymagają ręcznie nowego local capture (hash plików nie wykrywa zmian DB).

Dla każdego URL: `referenceCapture`, `localPage`, `template`, `content`,
`visualQA`, `wcagQA`. Statusy TODO/IN_PROGRESS/BLOCKED/DONE. `ready` wymaga
wszystkich sześciu DONE i dowodów we wszystkich skonfigurowanych viewportach.
`localPage=DONE` dowodzi HTTP i capture pod wymaganą ścieżką; nie dowodzi treści.
`template`, `content`, `wcagQA` nigdy nie przechodzą DONE od samego screenshotu.

Po rzeczywistej kontroli zapisz dowód w pliku (opis URL, daty, WP ID, kontroli
układu/treści albo ręcznych kryteriów WCAG, wyników i ograniczeń), następnie:

```bash
npm run factory:live -- review --config path/to/live.json --route page-id --check template --evidence path/to/template-review.md
npm run factory:live -- review --config path/to/live.json --route page-id --check content --evidence path/to/content-review.md --wp-id 123
npm run factory:live -- review --config path/to/live.json --route page-id --check wcagQA --evidence path/to/wcag-review.md
```

Review wymaga aktualnych local capture wszystkich viewportów, niepustego pliku,
a content także WP ID/term ID (dla archiwum np. `term:123`). To zapis decyzji
recenzenta, nie automatyczne potwierdzenie prawdziwości pliku. Evidence jest
hashowane i przypisane do screenshotów; zmiana dowodu/implementacji/capture
unieważnia zatwierdzenie. Screening DOM (H1, lang, brak ALT, overflow) jest
podstawowy i nie zastępuje audytu WCAG, klawiatury, kontrastów, zoomu i czytnika.

## Testy i lokalny runtime

```bash
npm run factory:live:test
npm run factory:autopilot:test
npm run factory:validate
npm run build
```

Testy LIVE obejmują walidację, separację sześciu statusów, pełny rejestr w partii,
realny Chromium/HTTP, capture/layout, identyczny i zmieniony obraz, różną wysokość,
404, redirect, brak połączenia, awarię screenshotu, hash mismatch, stale capture,
powtórzenie procesu z zamrożoną referencją i dowód template bez CONTENT=DONE.

Jeżeli LocalWP nie działa, uruchom odpowiednią istniejącą witrynę LocalWP.
Alternatywny istniejący runtime repo (izolowane wolumeny testowe):

```bash
docker compose -p factory-live-qa -f .devcontainer/docker-compose.yml up -d db wordpress wpcli
docker compose -p factory-live-qa -f .devcontainer/docker-compose.yml exec -T wpcli wp core is-installed
```

Tylko w nowej, niezainstalowanej testowej bazie (bez resetu istniejącej):

```bash
docker compose -p factory-live-qa -f .devcontainer/docker-compose.yml exec -T wpcli wp core install --url=http://localhost:8000 --title='Factory LIVE QA' --admin_user=factory-live-qa --admin_email=qa@example.test --skip-email
docker compose -p factory-live-qa -f .devcontainer/docker-compose.yml exec -T wpcli wp option update blog_public 0
```

Przed wdrożeniem factory potrzebny jest dostarczony, licencjonowany ACF Pro.
Capture narzędzi można sprawdzić na działającym WP z motywem domyślnym;
to nie dowodzi wdrożenia factory/CB. Brak ACF Pro nie uzasadnia pozorowania jego
funkcji. Konfiguracja `.devcontainer` montuje repo jako motyw; aktywacja factory
i import danych są kolejnym etapem migracji.

## Diagnostyka capture po naprawie 3A

`capture.json` zapisuje `diagnostics.stage`, oś czasu DOM/load, ostrzeżenia konsoli,
niezakończone żądania i czas całkowity także po błędzie. Nawigacja używa
`domcontentloaded`; nie czeka na `networkidle`. Wspólny `settle()` ogranicza
oczekiwanie na fonty (15 s), lazy scroll (30 s) i dekodowanie obrazów (15 s).
Pusty dokument i rozpoznana strona wyzwania dostępu otrzymują BLOCKED bez PNG.
Nie jest to mechanizm omijania zabezpieczeń. HTTP >=400 również blokuje referencję.
Test integracyjny sprawdza niezakończony fetch w tle: nie blokuje poprawnego DOM.
Brak krytycznych obrazów/fontów nadal wymaga kontroli metrics i bramki visual;
samo powstanie PNG nie oznacza akceptacji wyglądu ani dostępności.
