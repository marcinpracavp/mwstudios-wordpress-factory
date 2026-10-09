# CB — automatyczny capture poza Codespace, zadanie 3C

Stan 2026-10-09. **Użytkownik zatwierdził push. Gałąź została opublikowana, prawdziwy PoC GitHub-hosted zakończył się sukcesem i oba screenshoty obejrzano. Pełny capture i ograniczone retry zakończono, artefakty pobrano i zweryfikowano (wynik poniżej).** Nie ponowiono diagnostyki TCP CB z Codespace. Nie zmieniono WordPressa, Figma Autopilot, treści ani statusów wcześniejszego rejestru.

## Dostęp GitHub

Remote: https://github.com/marcinpracavp/mwstudios-wordpress-factory. API repozytorium odpowiada 200, raportuje uprawnienie push/admin. API list workflowów, runów i artefaktów odpowiada 200 (wszystkie listy puste). Przed publikacją `project/collegium-balticum` nie istniał zdalnie (404); teraz istnieje i zawiera zatwierdzone zmiany. Ustawienia Actions wymagają dodatkowych uprawnień administracyjnych tokena i zwróciły 403; nie zadeklarowano w związku z tym potwierdzenia konfiguracji runnerów ani prawa dispatch. Zapis workflow przez push zakończył się sukcesem. Po autoryzowanym push Actions rzeczywiście uruchomił runner ubuntu-latest. Ręczny dispatch przez dostępny token zwrócił 403 Resource not accessible by integration; odczyt runów i download artefaktów działa. Token użyty wyłącznie lokalnie, nie jest w logach/commitach/workflow/artefaktach. Dowód: [github-access.json](capture-3c/github-access.json).

## Workflow

Plik `.github/workflows/cb-capture.yml`: ubuntu-latest, Node 22, tylko `contents: read`, brak WordPress/Docker, brak custom secrets. Dwie zależności runtime: Playwright-core 1.55.0 i Ajv 8.17.1 (lockfile zawiera łącznie sześć pakietów z zależnościami transytywnymi). Chromium wraz z bibliotekami systemowymi instaluje oficjalny CLI Playwright. Nie instaluje całego package.json motywu.

`workflow_dispatch` ma tryby home (domyślny), full i retry. W repo nie ma jeszcze workflow na default branch main. GitHub dokumentuje rejestrację ręcznych workflowów i możliwość dispatch przez API po pierwszym runie: [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch). Pierwszy ograniczony bootstrap push uruchomił home na gałęzi projektu, bez merge do main/autopilot-clean. Po potwierdzonym 403 dispatch dodano jawny plik `.github/cb-capture-request.json`: push zmiany workflow lub tego pliku uruchamia wskazany tryb (bez pliku domyślnie home). Full/retry nadal przechodzą świeży home guard. Plik żądania jest wersjonowany i wymaga zwykłego review/commit/autoryzowanego push, bez zwiększania uprawnień tokena.

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

Przygotowany, ale nie uruchomiony przeciw CB: `.factory-cache/live/collegium-balticum/cb-capture-kit.zip`. Nie należy traktować tego jako stwierdzenia, że GitHub Actions nie ma dostępu — GitHub ma potwierdzony dostęp, więc pakiet jest wyłącznie opcją awaryjną. ZIP zawiera tylko capture/config/schemat i minimalny runtime; bez motywu, WordPressa, Dockera, tokenów i node_modules.

Na komputerze z normalnym dostępem i Node 22+ rozpakować, uruchomić **`node capture.cjs`**. Instaluje sześć pakietów runtime, korzysta z wykrytej przeglądarki albo pobiera Chromium, sprawdza home, a potem wykonuje 19 adresów. Generuje jeden `references-<czas>.zip`, importowany powyższą komendą. Na Linuxie bez normalnej przeglądarki mogą być potrzebne standardowe biblioteki Chromium; nie instaluje ich z sudo bez zgody użytkownika. Nie wymaga ręcznych 38 screenshotów.

Ponowne zbudowanie pakietu: `node scripts/projects/collegium-balticum/remote/portable.js`.

## Testy, fakty i brakujące dowody

Test realnego Chromium na jawnej lokalnej stronie kontrolnej potwierdził: PoC dwóch viewportów, loaded CSS/font/image, eksport HTML/DOM/zasobów i hashy, blokadę batcha na challenge, full batch, retry bez powtarzania udanych danych, import/idempotencję/indeks, odrzucenie niewłaściwego pochodzenia GitHub, zmienionych hashy i uszkodzonego ZIP oraz ZIP64 footer. Test czystej paczki poza repo wykorzystuje wyłącznie przypięte dwie zależności; screenshoty są fixture, **nie referencjami CB**. Walidacja YAML potwierdza minimalne permissions, Ubuntu, manual home default i brak custom secrets. Regresję istniejącego LIVE capture wykonano na lokalnych fixture. Nie uruchamiano build motywu, ponieważ motyw/SCSS/JS nie zmieniły się.

PoC potwierdzony: run `37987108323`, artefakt `11643068023`, import `6b7a9720b599f8a7`. HTTP 200, końcowy URL https://www.cb.szczecin.pl/, tytuł „Studia, Zaoczne, Dzienne - Collegium Balticum Akademia Nauk Stosowanych”, H1 „Studia zaoczne i dzienne”. PNG desktop 1440×5457 (2 946 083 bajty), mobile 390×8475 (1 415 521 bajtów), oba prawdziwe CB, nie CAPTCHA. HTML/DOM/SEO/layout/ALT/linki oraz CSS/fonty/obrazy mają zweryfikowane SHA256 i pochodzenie GitHub repo/run/commit. Pełny capture uruchomiono dopiero po obejrzeniu obu PNG: run `37987295715`.

Wyniki testów i rozmiar/SHA256 pakietu: [verification.json](capture-3c/verification.json). Wykonane komendy: `npm ci --prefix tools/live-capture --ignore-scripts --no-audit --no-fund`, `node --test scripts/projects/collegium-balticum/remote/capture.test.js`, istniejące testy LIVE (3/3), ten sam test capture z rozpakowanej minimalnej paczki (1/1), `node scripts/projects/collegium-balticum/remote/portable.js` oraz kontrole składni Node/YAML. Lokalne screenshoty fixture usunięto wraz z katalogami tymczasowymi; nie umieszczono ich w referencjach CB.

Kod uniwersalnego runtime/bundle jest w commicie `7c48d4e` na gałęzi projektu oraz równoważnym `bbfbc6b` na osobnej gałęzi silnika `feature/live-capture-bundles`. Bazą projektu przed zadaniem 3C był `21fe405`; chroniony `autopilot-clean` pozostał na `0077847`. Nie usunięto starszych branchy ani istniejących zmian użytkownika.

## Odtwarzanie capture bez uprawnienia API dispatch

```bash
node scripts/projects/collegium-balticum/remote/github.js request full
# albo retry tylko nieudanych ID:
node scripts/projects/collegium-balticum/remote/github.js request retry /ścieżka/BUNDLE_ID.import.json
git add .github/cb-capture-request.json
git commit -m "chore(cb): request reference capture"
# Push tylko w zakresie zgody użytkownika:
git push origin project/collegium-balticum
node scripts/projects/collegium-balticum/remote/github.js runs
node scripts/projects/collegium-balticum/remote/github.js download ARTIFACT_ID
```

Pierwsze PoC ujawniły wadliwe karuzele w emulacji wyłącznie wąskiego desktopu (track 30px przy kontenerze 360px), mimo HTTP 200 i załadowanych CSS. Dodano oczekiwanie na rzeczywistą treść NitroPack, sprawdzenie CSS/fontów i geometrii karuzel oraz normalną emulację telefonu (mobilny Android UA/touch/isMobile, deviceScaleFactor 1). Przy wadliwej geometrii próba zwykłego resize 390→391→390 jest logowana; jeśli nie pomaga, BLOCKED i brak full batch. Nie modyfikowano źródłowego DOM/style/plugin API. Emulacja telefonu rozwiązała geometrię karuzel; nie trzeba było wymuszać plugin API. Pełnoekranowy screenshot mobile ujawnia również panel menu pozycjonowany poza zwykłym viewportem — jest to jawna uwaga do jakości referencji fullPage, nie dowód otwartego menu w normalnym widoku telefonu. VISUAL_QA pozostaje NOT_STARTED. Zachowano wszystkie wcześniejsze paczki i raport nieudanego home guard.

## Końcowy wynik zadania 3C

**19/19 adresów HTTP 200; 38/38 rzeczywistych PNG pełnej wysokości o szerokości 1440/390px; 38/38 HTML, DOM, metadanych i zapisów zasobów dostępne w Codespace.** Blog archive i wskazany pojedynczy wpis działają pod adresami z konfiguracji, bez przekierowania. Hashe i pochodzenie GitHub sprawdzono. Wszystkie wcześniejsze referencje zachowano.

- PoC obejrzany przed full: [37987108323](https://github.com/marcinpracavp/mwstudios-wordpress-factory/actions/runs/37987108323), artefakt `11643068023`, status success.
- Pełny batch: [37987295715](https://github.com/marcinpracavp/mwstudios-wordpress-factory/actions/runs/37987295715), artefakt `11643652991` (37 841 415 bajtów), import `a58132455f6f7756`.
- Retry problematycznych stron i szerokości CB-16: [37988098797](https://github.com/marcinpracavp/mwstudios-wordpress-factory/actions/runs/37988098797), artefakt `11643164053`, import `0f72d1ed1fb38100`.
- Końcowa ocena geometrii po settle: [37988497301](https://github.com/marcinpracavp/mwstudios-wordpress-factory/actions/runs/37988497301), artefakt `11643004742` (21 509 874 bajty), import `b188794e2451ce56`.

Pełny batch/retry mają outcome failure, ponieważ quality gate zachowuje BLOCKED przy wadach źródła. Nie jest to błąd dostępu ani brak artefaktu: finalnie **32 widoki DONE, 6 BLOCKED, wszystkie z prawdziwymi plikami**. CB-08 i CB-11 mają pusty źródłowy src obrazu w obu viewportach; CB-17 i CB-18 mają desktopowy track karuzeli szerokości 0px (kontener 1410px, wysokość 56px) również w chwili screenshotu. Ich referencje są dostępne, ostrzeżenia jawne, brakujące grafiki nie zostały wymyślone. Ostatecznie karuzele CB-03 i CB-08 miały poprawną geometrię po settle — wcześniejsza ocena przed settle była zbyt wczesna i została poprawiona.

Rejestr wszystkich ID z odnośnikami do rzeczywistych screenshotów: [REFERENCES.md](capture-3c/REFERENCES.md). Każda pozycja ma desktop i mobile; szczegółowe HTML/DOM/zasoby/SEO/ALT/fonty/kolory/wymiary i SHA256 są wskazane w [references-evidence.json](capture-3c/references-evidence.json). Większość plików pochodzi z pełnego batcha, uzupełnienia z retry; nie trzeba ponownie pobierać udanych stron.

Pozyskanie materiałów nie wymaga już ręcznych 38 screenshotów, nowego tokena ani instalacji na komputerze użytkownika. Można przejść do pracy na rzeczywistych referencjach; ostrzeżenia czterech stron trzeba rozstrzygnąć podczas dalszej implementacji/QA. Pusty src nie daje podstaw do wyboru zastępczej grafiki bez materiału lub decyzji PM. FullPage mobile odsłania poza viewportem panel menu i ma jawnie opisaną ograniczoną przydatność w tym fragmencie. Nie zmieniono motywu, URL-i, CONTENT ani VISUAL_QA; nie uruchomiono zadania 4.

Zmiany 3C obejmują wyłącznie minimalny uniwersalny runtime/ZIP, workflow i plik żądania, klientowe skrypty remote oraz tę dokumentację/dowody. Commity projektu od `7c48d4e` do `4503d67` zachowują historię poprawek. Uniwersalne poprawki: `7c48d4e`/`08a8cf1`; równoważne na `feature/live-capture-bundles`: `bbfbc6b`/`4c47f68`. Gałąź robocza `project/collegium-balticum` jest zdalnie opublikowana. Main i autopilot-clean nie były modyfikowane.
