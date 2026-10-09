# CB — automatyczny capture poza Codespace, zadanie 3C

Stan 2026-10-09. **Kod przygotowany i sprawdzony lokalnie; prawdziwy test GitHub-hosted jeszcze nie został uruchomiony, ponieważ wymaga publikacji gałęzi i workflow. Push wymaga wyraźnej zgody użytkownika zgodnie z zadaniem.** Nie ponowiono diagnostyki TCP CB z Codespace. Nie zmieniono WordPressa, Figma Autopilot, treści ani statusów wcześniejszego rejestru.

## Dostęp GitHub

Remote: https://github.com/marcinpracavp/mwstudios-wordpress-factory. API repozytorium odpowiada 200, raportuje uprawnienie push/admin. API list workflowów, runów i artefaktów odpowiada 200 (wszystkie listy puste). `project/collegium-balticum` nie istnieje zdalnie (404). Ustawienia Actions wymagają dodatkowych uprawnień administracyjnych tokena i zwróciły 403; nie zadeklarowano w związku z tym potwierdzenia konfiguracji runnerów ani prawa dispatch. Nie testowano zapisu workflow przez push. Dostępność faktycznego uruchomienia zostanie zweryfikowana po autoryzowanej publikacji. Token użyty wyłącznie lokalnie, nie jest w logach/commitach/workflow/artefaktach. Dowód: [github-access.json](capture-3c/github-access.json).

## Workflow

Plik `.github/workflows/cb-capture.yml`: ubuntu-latest, Node 22, tylko `contents: read`, brak WordPress/Docker, brak custom secrets. Dwie zależności runtime: Playwright-core 1.55.0 i Ajv 8.17.1 (lockfile zawiera łącznie sześć pakietów z zależnościami transytywnymi). Chromium wraz z bibliotekami systemowymi instaluje oficjalny CLI Playwright. Nie instaluje całego package.json motywu.

`workflow_dispatch` ma tryby home (domyślny), full i retry. W repo nie ma jeszcze workflow na default branch main. GitHub dokumentuje rejestrację ręcznych workflowów i możliwość dispatch przez API po pierwszym runie: [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch). Dlatego dodano ograniczony bootstrap `push`: tylko branch project/collegium-balticum, tylko zmiana tego pliku, tylko test home. Nie wykonuje pełnego batcha i nie wymaga merge do main/autopilot-clean. Zgoda na push tego commita będzie obejmować uruchomienie tego testu home. Jeśli GitHub nie pozwoli na bootstrap/dispatch lub wymaga dodatkowego zakresu tokena, raportujemy dokładny błąd; nie zmieniamy default brancha ani uprawnień samodzielnie.

Przebieg: HTTPS GET z weryfikacją TLS → Playwright → weryfikacja domeny, rzeczywistej treści CB i brak strony weryfikacji → sprawdzenie CSS/fontów/obrazów → dwa screenshoty pełnej wysokości, 1440×900 i 390×844 → zapis HTML i struktur → manifest/hash. **Pełny batch nigdy nie zaczyna się przed sprawdzeniem plików i hashy obu widoków home.** Brak H1 pozostaje rzeczywistą obserwacją, nie jest uzupełniany sztucznym tekstem. HTTP/final URL/redirect/title/H1/asset readiness zapisuje raport. Nie ignoruje TLS i nie obchodzi CAPTCHA; zatrzymuje się przy ekranie ochrony. Sesja nie dopuszcza POST ani innych żądań zapisujących dane.

Runner zachowuje artifact także po błędzie. Nazwa `cb-live-<run_id>-<attempt>`, retencja 30 dni. Wynik i dane stron widoczne również w GitHub job summary. Udane referencje zawierają PNG, rendered.html, dom.json, layout.json, metrics.json, resources.json i źródłowe assety CSS/font/image. Zasoby pobierane są z odpowiedzi już załadowanych przez przeglądarkę, bez drugiego masowego fetch. SHA256 deduplikuje pliki. Każdy asset ma URL, typ, kod HTTP, bajty i hash albo konkretny błąd/limit. Manifest zawiera repo/run/commit i hashe wszystkich plików; nie stanowi podpisu kryptograficznego. Ograniczenia: 25 MiB/asset, 200 MiB zasobów na widok. Missing resource body jest jawnie zapisany; poprawny screenshot nie oznacza kompletnego offline mirror.

## Pełny capture i retry

Po rzeczywistym sukcesie PoC i obejrzeniu screenshotów uruchomić full. Lista pochodzi z istniejącego live.json — wszystkie 19 ID, bez zamiany URL na przykłady. Captury są sekwencyjne, z 0.5 s przerwą między stronami. Zapisują faktyczne przekierowania i URL, także blog/archive/single. Błąd jednej podstrony pozostaje BLOCKED; inne obowiązkowe strony są kontynuowane. Nie wykonuje automatycznych wielokrotnych powtórek.

```bash
# Po pierwszym bootstrapie workflow; wymagane uprawnienie Actions dispatch:
node scripts/projects/collegium-balticum/remote/github.js runs
node scripts/projects/collegium-balticum/remote/github.js dispatch home
# Dopiero po potwierdzonym sukcesie rzeczywistego home:
node scripts/projects/collegium-balticum/remote/github.js dispatch full
# Pobranie konkretnego artefaktu + weryfikacja + import:
node scripts/projects/collegium-balticum/remote/github.js download ARTIFACT_ID
# Retry tylko ID oznaczonych BLOCKED w raporcie importu:
node scripts/projects/collegium-balticum/remote/github.js dispatch retry /ścieżka/BUNDLE_ID.import.json
```

GitHub retry wykonuje świeży home guard i oba widoki wskazanych nieudanych stron. Nie powtarza pozostałych udanych podstron. Lokalny runner z `--mode retry --previous <zweryfikowany-katalog>` pomija również udane viewporty i wykorzystuje sprawdzony proof home z poprzedniej paczki. Przy braku błędów nie wykonuje ponownych capture.

## Import

Pobrany ZIP jest w `.factory-cache/live/collegium-balticum/downloads/`; zaakceptowana paczka w `imports/<manifest-hash>/`. Import sprawdza schemat, config hash, domenę, CB ID/URL/viewport, wymagane pliki, PNG o właściwej szerokości, HTML, rozmiary i SHA256. Dla pobrania przez API weryfikuje repo/run/commit względem metadanych artefaktu GitHub. Hashy nie traktuje jako samodzielnego dowodu pochodzenia; kontrola treści oraz obejrzenie rzeczywistych PNG nadal są potrzebne.

Dekoder ZIP obsługuje store/deflate i ZIP64 footer GitHub, odrzuca traversal, symlinki, różne nazwy local/central, CRC mismatch i przekroczenia limitów. Najpierw weryfikuje i dopiero tworzy docelowy katalog. Ponowny import tej samej paczki jest idempotentny. Poprzednie raporty/referencje zostają. Obok paczek są `<id>.import.json` oraz `references-index.json`, które mapują wszystkie CB-00–CB-18 i zachowują historię; SOURCE_CAPTURE=DONE wyłącznie przy dwóch zweryfikowanych rzeczywistych widokach. VISUAL_QA/CONTENT pozostają NOT_STARTED. Wcześniejszego rejestru zadania 3A nie nadpisuje.

ZIP można także pobrać z GitHub UI i zaimportować:

```bash
node scripts/projects/collegium-balticum/remote/import.js /ścieżka/cb-live.zip
```

Ta ścieżka sprawdza hashe i deklarowane pochodzenie paczki, ale nie potwierdza pochodzenia przez API artefaktu. Dla GitHub preferowany jest download helper.

## Samodzielny pakiet awaryjny

Przygotowany, ale nie uruchomiony przeciw CB: `.factory-cache/live/collegium-balticum/cb-capture-kit.zip`. Nie należy traktować tego jako stwierdzenia, że GitHub Actions nie ma dostępu — tego jeszcze nie sprawdzono. ZIP zawiera tylko capture/config/schemat i minimalny runtime; bez motywu, WordPressa, Dockera, tokenów i node_modules.

Na komputerze z normalnym dostępem i Node 22+ rozpakować, uruchomić **`node capture.cjs`**. Instaluje sześć pakietów runtime, korzysta z wykrytej przeglądarki albo pobiera Chromium, sprawdza home, a potem wykonuje 19 adresów. Generuje jeden `references-<czas>.zip`, importowany powyższą komendą. Na Linuxie bez normalnej przeglądarki mogą być potrzebne standardowe biblioteki Chromium; nie instaluje ich z sudo bez zgody użytkownika. Nie wymaga ręcznych 38 screenshotów.

Ponowne zbudowanie pakietu: `node scripts/projects/collegium-balticum/remote/portable.js`.

## Testy, fakty i brakujące dowody

Test realnego Chromium na jawnej lokalnej stronie kontrolnej potwierdził: PoC dwóch viewportów, loaded CSS/font/image, eksport HTML/DOM/zasobów i hashy, blokadę batcha na challenge, full batch, retry bez powtarzania udanych danych, import/idempotencję/indeks, odrzucenie niewłaściwego pochodzenia GitHub, zmienionych hashy i uszkodzonego ZIP oraz ZIP64 footer. Test czystej paczki poza repo wykorzystuje wyłącznie przypięte dwie zależności; screenshoty są fixture, **nie referencjami CB**. Walidacja YAML potwierdza minimalne permissions, Ubuntu, manual home default i brak custom secrets. Regresję istniejącego LIVE capture wykonano na lokalnych fixture. Nie uruchamiano build motywu, ponieważ motyw/SCSS/JS nie zmieniły się.

Brakujące dowody: run GitHub-hosted, rzeczywisty HTTP/DOM CB z runnera, dwa rzeczywiste PNG home, pełne 38 referencji, rzeczywisty import artefaktu. Wszystkie są NOT_STARTED/BLOCKED przez brak autoryzowanego push. Po zgodzie użytkownika wykonać zwykły push tylko gałęzi project/collegium-balticum, obserwować pierwszy home run, pobrać artefakt i obejrzeć PNG. Pełny capture dopiero po jego sukcesie. Nie wykonano żadnego push ani zmiany remote.

Wyniki testów i rozmiar/SHA256 pakietu: [verification.json](capture-3c/verification.json). Wykonane komendy: `npm ci --prefix tools/live-capture --ignore-scripts --no-audit --no-fund`, `node --test scripts/projects/collegium-balticum/remote/capture.test.js`, istniejące testy LIVE (3/3), ten sam test capture z rozpakowanej minimalnej paczki (1/1), `node scripts/projects/collegium-balticum/remote/portable.js` oraz kontrole składni Node/YAML. Lokalne screenshoty fixture usunięto wraz z katalogami tymczasowymi; nie umieszczono ich w referencjach CB.

Kod uniwersalnego runtime/bundle jest w commicie `7c48d4e` na gałęzi projektu oraz równoważnym `bbfbc6b` na osobnej gałęzi silnika `feature/live-capture-bundles`. Bazą projektu przed zadaniem 3C był `21fe405`; chroniony `autopilot-clean` pozostał na `0077847`. Nie usunięto starszych branchy ani istniejących zmian użytkownika.
