# Factory Autopilot — instrukcja obsługi

Ten dokument opisuje obsługę Autopilota od czystego boilerplate'u do
końcowego raportu. Opis architektury i reguł akceptacji znajduje się również
w [`AUTOPILOT.md`](AUTOPILOT.md), a skrócony opis modułów hosta w
[`AUTOPILOT_V2.md`](AUTOPILOT_V2.md).

Dodatkowe źródło LIVE: `npm run factory:autopilot -- live run --config path/to/live.json`.
Konfiguracja, capture, compare i rejestr QA: [LIVE RUNNING](../live-migration/RUNNING.md).
Poniższy pipeline workerów opisuje istniejący tryb Figma.

## 1. Co robi Autopilot

Autopilot:

1. waliduje konfigurację projektu i właściwą instalację WordPressa;
2. wykonuje pełny audyt wszystkich produkcyjnych frame'ów i stanów Figmy;
3. zapisuje lokalny, wersjonowany faktami snapshot źródła;
4. rozpoznaje wspólne struktury oraz delty stanów interaktywnych;
5. zamraża plan architektury przed implementacją;
6. przygotowuje fundament, dane natywne i komponenty współdzielone;
7. implementuje kompletne podstrony jedna po drugiej;
8. buduje popupy, modale, menu i inne stany jako delty stron bazowych;
9. wykonuje full-page QA, diagnozuje błędy i zleca ograniczone naprawy;
10. kończy pracę niezależnym audytem i świeżym pomiarem całej witryny.

Podstawową jednostką implementacji i akceptacji jest kompletna podstrona.
Sekcje pozostają jednostkami danych, ACF, reużycia, pomiaru i naprawy po
nieudanym full-page QA.

## 2. Wymagania przed uruchomieniem

Przed rozpoczęciem upewnij się, że:

- zależności npm są zainstalowane;
- `npm run build` działa;
- właściwa instalacja WordPressa jest uruchomiona;
- adres WordPressa jest dostępny z terminala;
- aktywne są wymagane w projekcie wtyczki;
- ACF Pro jest zainstalowany, jeśli wybrano capability `acf`;
- Codex CLI jest dostępny jako natywny plik wykonywalny;
- Chrome, Edge lub Chromium jest dostępny dla Playwrighta;
- użytkownik ma dostęp do wskazanego pliku Figma przez Figma MCP;
- working tree nie zawiera przypadkowych zmian z innego projektu.

Autopilot nie instaluje licencjonowanego ACF Pro i nie tworzy nowej instalacji
WordPressa. W Codespaces bootstrap może aktywować dostępne publiczne wtyczki,
ale istniejąca instalacja oraz baza danych muszą już działać.

## 3. Pierwsza konfiguracja projektu

Uruchom:

```bash
npm run factory:init
```

Initializer pyta o:

- nazwę i slug projektu;
- nazwę motywu oraz text domain;
- lokalny i opcjonalny produkcyjny URL;
- URL Figmy i opcjonalny startowy node;
- język domyślny oraz wszystkie języki;
- ACF Pro;
- Contact Form 7;
- Polylang;
- WooCommerce;
- Google Maps;
- Swiper;
- AOS;
- Lenis;
- blog;
- topbar;
- popup promocyjny.

Jeżeli `factory/project.json` opisuje już projekt, initializer pozwala:

- edytować obecną konfigurację;
- utworzyć konfigurację projektu ponownie;
- anulować bez zapisywania zmian.

Ponowna konfiguracja nie usuwa bazy WordPressa, assetów ani kodu projektu.
Initializer zapisuje przede wszystkim `factory/project.json` i generuje
`docs/factory/PROJECT_CONTEXT.md`.

Po inicjalizacji uruchom:

```bash
npm run factory:validate
```

Walidator sprawdza manifest projektu, capabilities, języki, konfigurację
Figmy, QA oraz kontrakt release. Nie pobiera danych z Figmy i nie modyfikuje
WordPressa.

Pole Figma jest opcjonalne dla samego boilerplate'u, ale pełny Autopilot
wymaga poprawnego URL-a pliku Figma przed etapem discovery.

Jeżeli `factory/project.json` został świadomie zmieniony ręcznie, odtwórz
czytelny kontekst projektu i ponownie wykonaj walidację:

```bash
npm run factory:context
npm run factory:validate
```

`docs/factory/PROJECT_CONTEXT.md` jest plikiem generowanym i nie powinien być
edytowany ręcznie.

## 4. Custom instructions

Własne instrukcje umieszcza się w katalogu głównym repozytorium, obok
`package.json`. Obsługiwane są dwa pliki:

```text
custom-instructions.md
custom-instructions.json
```

Można użyć jednego albo obu plików jednocześnie.

### 4.1. Instrukcje Markdown

Cała zawartość `custom-instructions.md` jest przekazywana do każdego zadania.
Ten format jest właściwy dla krótkich zasad obowiązujących przez cały projekt.

Przykład:

```md
# Project rules

- Nie modyfikuj treści prawnych bez zgody.
- Zachowaj istniejący system nazw klas BEM.
- Formularze muszą korzystać z Contact Form 7.
- Nie dodawaj animacji poza elementami wskazanymi w Figma.
```

### 4.2. Instrukcje JSON

`custom-instructions.json` pozwala kierować instrukcje tylko do pasujących
etapów lub typów zadań.

```json
{
  "all": "Zachowaj prefiks acme_ dla pól i funkcji projektu.",
  "discovery": "Nazwy frame'ów z dopiskiem OLD klasyfikuj jako archiwalne.",
  "foundation": "Menu główne ma korzystać z istniejącej lokalizacji primary.",
  "build": "Nie zmieniaj istniejących wpisów redakcyjnych.",
  "correct": "Naprawiaj tylko właściwości wskazane przez aktualny pomiar.",
  "audit": "Sprawdź focus keyboard i reduced motion.",
  "final": "W raporcie wypisz wszystkie nierozwiązane zależności zewnętrzne.",
  "source-extraction": "Eksportuj logotyp wyłącznie jako SVG.",
  "component-build": "Karty produktów mają używać jednego wspólnego partiala.",
  "native-content": "Nie nadpisuj wartości zmienionych ręcznie w WordPressie.",
  "style-fix": "Nie używaj !important.",
  "template-fix": "Zachowaj jeden logiczny H1.",
  "interaction": "Popup musi zamykać się przez Escape.",
  "layout": "Najpierw wykorzystaj istniejące gc-*, gr-* i spacing utilities."
}
```

Najczęściej używane klucze:

- wspólny: `all`;
- etapy: `discovery`, `foundation`, `build`, `correct`, `audit`, `final`;
- typy zadań: `source-extraction`, `component-build`, `native-content`,
  `style-fix`, `template-fix`, `interaction`, `refactor`, `visual-review`,
  `final-polish`, `final-audit`, `state-preparation`;
- klasy diagnostyczne: `css-fix`, `php-fix`, `global-css`, `local-section`,
  `unavailable-state`, `product-import`, `content-import`, `listing-bind`;
- temat fundamentu: `layout`.

Dla pojedynczego zadania Autopilot wybiera `all` oraz wszystkie pasujące
klucze etapu, typu, klasy i tematu. Niepasujące instrukcje nie są ładowane do
kontekstu zadania.

### 4.3. Ograniczenia custom instructions

- Każdy plik może mieć maksymalnie 16 000 bajtów.
- Plik nie może być symlinkiem.
- JSON musi zawierać string albo obiekt; dla czytelności zalecane są stringi.
- Nie zapisuj w instrukcjach tokenów, haseł ani innych sekretów.
- Instrukcje są kopiowane do katalogu runu i mogą pojawić się w task capsule.
- Ustaw instrukcje przed uruchomieniem właściwego runu.
- Nawet zmiana białych znaków zmienia hash instrukcji.
- Zmiana instrukcji w trakcie niedokończonego runu blokuje `resume` błędem
  `CUSTOM_INSTRUCTIONS_CHANGED`.

Jeżeli instrukcje zostały przypadkowo zmienione podczas runu, przywróć ich
dokładną poprzednią zawartość i dopiero wtedy wykonaj `resume`.

Custom instructions uzupełniają zasady Factory. Nie mogą legalizować zmiany
referencji, progów, engine'u, fabrykowania treści ani omijania pomiarów.

## 5. Zalecana sekwencja uruchomienia

```bash
npm run factory:init
npm run factory:validate
npm run factory:autopilot -- plan
npm run factory:autopilot:check
npm run factory:autopilot
```

Znaczenie kroków:

1. `factory:init` — zapisuje konfigurację projektu.
2. `factory:validate` — wykonuje walidację offline.
3. `factory:autopilot -- plan` — pokazuje konfigurację modeli, limity i
   kolejność etapów, bez uruchamiania implementacji.
4. `factory:autopilot:check` — dodatkowo sprawdza tożsamość działającej
   instalacji WordPressa; nie zmienia treści witryny.
5. `factory:autopilot` — rozpoczyna nowy run albo zgłasza, że należy wznowić
   istniejący.

`npm run factory:autopilot` bez argumentu oznacza tryb `run`. Równoważna
komenda jawna to:

```bash
npm run factory:autopilot -- run
```

## 6. Komendy Autopilota

### Plan

```bash
npm run factory:autopilot -- plan
```

Pokazuje:

- znaleziony Codex CLI;
- lokalny URL;
- źródło Figma;
- politykę modeli;
- etapy pipeline'u;
- aktualne limity i progi.

Nie uruchamia WordPressa, browser QA ani workerów.

### Check

```bash
npm run factory:autopilot:check
```

Wykonuje plan oraz sprawdza przez WP-CLI, czy `home` aktualnej instalacji ma
ten sam host co skonfigurowany `environment.localUrl`.

### Nowy run

```bash
npm run factory:autopilot
```

lub:

```bash
npm run factory:autopilot -- run
```

Jeżeli istnieje niedokończony run, nowy run nie zostanie utworzony. Należy
użyć `resume`, żeby nie utracić historii i checkpointów.

### Status

```bash
npm run factory:autopilot:status
```

Zwraca m.in.:

- ID runu;
- status;
- aktywne zadanie i model;
- informację, czy proces rzeczywiście działa;
- zgłoszone użycie tokenów;
- liczbę prób;
- ostatni błąd;
- ścieżkę do `REPORT.md`.

### Stop

```bash
npm run factory:autopilot:stop
```

Stop jest kontrolowany i checkpointowany. Trwający worker może dokończyć
bieżącą operację, ale host nie powinien uruchomić następnego etapu. Nie usuwaj
ręcznie locka ani katalogu runu.

### Resume

```bash
npm run factory:autopilot:resume
```

Resume:

- zachowuje ukończone checkpointy;
- odzyskuje poprawnie zapisane wyniki przerwanego workera;
- nie powtarza zakończonej pracy tylko dlatego, że proces hosta przerwano;
- ponownie mierzy wynik tam, gdzie wymagają tego aktualne fingerprinty.

Nie uruchamiaj `run`, gdy komunikat mówi `INTERRUPTED_RUN` albo
`UNFINISHED_RUN`; użyj `resume`.

### Ograniczenie liczby batchy danych

Do kontrolowanego uruchamiania importu natywnych rekordów służy:

```bash
npm run factory:autopilot -- run --native-batch-limit 1
```

oraz przy wznowieniu:

```bash
npm run factory:autopilot -- resume --native-batch-limit 1
```

Wartość musi być dodatnią liczbą całkowitą. Limit dotyczy batchy wykonanych w
danym wywołaniu hosta, więc można kontrolowanie przechodzić przez duży import
za pomocą kolejnych `resume`.

## 7. Ręczne narzędzia Figma

Zwykły pełny run przygotowuje brakujący snapshot automatycznie. Poniższe
komendy służą do ręcznej inspekcji lub przygotowania cache:

```bash
npm run factory:figma:prepare
npm run factory:figma:status
npm run factory:figma:validate
npm run factory:figma:section -- --id hero
```

`factory:figma:prepare` tworzy jedynie szkielet cache. Nie pobiera projektu z
Figmy. Istniejący snapshot jest chroniony. Opcja:

```bash
npm run factory:figma:prepare -- --force
```

usuwa i odtwarza `.factory-cache/figma/latest`. Używaj jej wyłącznie przed
nowym discovery, kiedy świadomie odrzucasz obecny cache. Nie wykonuj `--force`
w trakcie aktywnego runu.

`factory:figma:validate` jest walidacją offline. `factory:figma:status` pokazuje
liczbę stron, sekcji, referencji i brakujących elementów, a
`factory:figma:section` wskazuje pliki i node ID jednej sekcji.

Discovery korzysta z Figma MCP. `FIGMA_TOKEN` nie jest podstawowym sposobem
autoryzacji; może zostać użyty przez ograniczony REST fallback do eksportu lub
odzyskania konkretnych node'ów, gdy MCP zwróci problem autoryzacji. Token
ustawiaj tylko jako zmienną środowiskową i nigdy nie zapisuj go w repozytorium.

### Codespaces

Po przygotowaniu kontenera i istniejącej instalacji WordPressa uruchom:

```bash
npm run factory:codespaces:bootstrap
```

Bootstrap działa tylko dla runtime'u `docker`. Sprawdza realne połączenie z
bazą, ustawia lokalne `home` i `siteurl`, aktywuje wybrane publiczne wtyczki i
potwierdza ACF Pro. Nie instaluje WordPressa, nie resetuje bazy i nie pobiera
licencjonowanego ACF Pro.

## 8. Ręczne QA

### Deterministyczny QA z macierzy projektu

```bash
npm run factory:qa
```

Dostępne filtry:

```bash
npm run factory:qa -- --route home
npm run factory:qa -- --viewport desktop
npm run factory:qa -- --lang pl
npm run factory:qa -- --section hero
```

ID pochodzą z `factory/qa.json`. Wyniki trafiają do
`.factory-cache/qa/latest/`.

### Porównanie wizualne Autopilota

Wszystkie trasy i pełna akceptacja:

```bash
npm run factory:qa:visual
```

Jedna trasa:

```bash
npm run factory:qa:visual -- --route home
```

Kontrola page-owned content bez ponownego rozliczania shared chrome:

```bash
npm run factory:qa:visual -- --route home --page-only
```

Tylko źródłowa szerokość desktopowa, bez derived responsive checks:

```bash
npm run factory:qa:visual -- --route home --desktop-only
```

`--page-only` służy do diagnostyki etapu budowy. Nie zastępuje końcowej
akceptacji shared components i całego projektu.

## 9. Narzędzia WordPress

Sprawdzenie wykrytego runtime'u i WP-CLI:

```bash
npm run factory:wp -- --toolchain
```

Wykonanie bezpośredniej komendy WP-CLI w bieżącej instalacji:

```bash
npm run factory:wp -- option get home
npm run factory:wp -- plugin list
```

Resolver nie powinien łączyć się z inną witryną LocalWP. `autopilot:check`
oraz właściwy run dodatkowo sprawdzają zgodność hosta WordPressa.

## 10. Etapy właściwego runu

### Discovery

- inwentaryzuje wszystkie strony i top-level frame'y;
- klasyfikuje podstrony, stany, komponenty i materiały archiwalne;
- zaczyna od pełnej kompozycji każdego frame'u;
- zapisuje pełne referencje 1x;
- dopiero potem utrwala logiczne sekcje i ich dane;
- zapisuje design system, content map, assety i plan implementacji;
- używa Figma Design-to-Code oraz `get_design_context` dla konkretnych
  logicznych sekcji, a nie jako generatora finalnego kodu produkcyjnego.

### Frozen architecture

Przed implementacją powstają:

- `route-blueprints.json`;
- `component-plan.json`;
- `execution-plan.json`;
- `state-plan.json`;
- kompletny snapshot źródła.

Zmiana źródła, progów lub instrukcji unieważnia zależne checkpointy albo
zatrzymuje resume. Worker nie może modyfikować engine'u ani progów.

### Foundation i native content

Autopilot przygotowuje fonty, layout, routing, ACF, dane WordPressa i wybrane
integracje. Importy są dzielone na trwałe batche i muszą być idempotentne.
Ręczne wartości edytora nie powinny być bezwarunkowo nadpisywane.

### Shared components

Header, footer oraz rozpoznane struktury wspólne powstają raz. Różna treść nie
tworzy osobnego komponentu, jeżeli znormalizowana struktura pozostaje taka
sama.

### Canonical routes

Każda podstrona jest implementowana jako kompletna kompozycja. Po próbie
wykonywany jest pełnostronicowy capture. Crop sekcji nie jest końcowym PASS.

### Interaction states

Popup, modal, drawer, otwarte menu, accordion albo aktywny tab są budowane
jako delta strony bazowej. Niezmienione sekcje nie są implementowane ponownie.
Stan musi być odtwarzany przez prawdziwy UI i idempotentny `qa-state.js`.

### Diagnosis i repairs

Nieudany full-page capture jest diagnozowany bez modelu. Dopiero diagnoza
tworzy ograniczone zadania typu CSS, PHP, interaction, missing component albo
state preparation. Po naprawach zawsze wykonywane jest nowe porównanie całej
strony.

### Plateau i Sol

Jeżeli seria napraw nie zmieniła fingerprintu implementacji, dla każdej
problematycznej trasy może zostać wykonany jeden route-level full-page polish
przez Sol. Brak postępu po tej próbie kończy się `HUMAN_REVIEW_REQUIRED`.

Oddzielnie, na końcu projektu, wykonywany jest jeden finalny audyt Sol. To dwa
różne, niezależnie ograniczone mechanizmy.

## 11. Modele i limity prób

Routing jest automatyczny:

- Luna — pierwsza próba oraz małe korekty;
- Terra — druga próba, jeśli pierwsza zakończyła się mierzalnym problemem;
- Sol — wyłącznie jednorazowy route polish przy plateau oraz finalny audyt.

Domyślnie pojedyncze zadanie ma dwie zwykłe próby. Kwalifikujący się problem
semantyczny może otrzymać jedną dodatkową, wyraźnie oznaczoną próbę
`source-extraction`, która sprawdza tylko wskazane node'y Figmy. Nie jest to
trzecia ślepa próba CSS.

Awaria capacity lub środowiska nie jest automatycznie uznawana za nieudaną
naprawę wizualną i nie powinna bez potrzeby zużywać budżetu zadania.

## 12. Progi akceptacji

Domyślna polityka:

- maksymalna efektywna różnica pełnej strony: `4%`;
- tolerancja kanału koloru: `24/255`;
- tolerancja geometrii: `2px`;
- responsywne szerokości: `1440`, `1280`, `1024`, `768`, `390`, `375`.

Wynik poniżej 4% nie wystarcza samodzielnie. Wymagane są również:

- kompletna semantyka i wszystkie source nodes;
- właściwa geometria sekcji;
- działające obrazy i fonty;
- brak błędów runtime;
- brak poziomego overflow;
- poprawne stany interaktywne;
- prawdziwe dane natywne i integracje;
- niezależny audyt aktualnych dowodów.

`visualDeferral.maxPageMismatch` o wartości `0.13` nie jest progiem PASS.
Pozwala jedynie przenieść zdrową geometrycznie lokalną różnicę do późniejszego
full-page/final audit, jeśli kolejne różne implementacje nie dają istotnej
poprawy. Końcowy próg nadal wynosi 4%.

## 13. Konfiguracja `factory/autopilot.json`

Najważniejsze pola operatora:

- `stageTimeoutMinutes` — limit czasu pojedynczej sesji;
- `maxRepairPasses` — maksymalna liczba rund naprawczych całej witryny;
- `maxStageAttempts` — standardowy limit prób jednego zadania;
- `taskAttemptOverrides` — wyjątki dla dokładnych ID zadań;
- `maxUncachedTokens` — globalny bezpiecznik runu;
- `toolOutputTokenLimit` — limit outputu narzędzi dla workera;
- `contentBatchSize` — wielkość batcha produktów, od 1 do 12;
- `responsiveWidths` — szerokości health checków;
- `visual` — próg pikseli, tolerancja kanału i geometrii;
- `visualDeferral` — polityka przekazywania plateau do pełnego audytu;
- `taskBudgets` — limity wejścia, wyjścia, kontekstu i prób;
- `figmaMcpUrl` — endpoint Figma MCP;
- `contentPolicy` — zasady importu danych źródłowych;
- `pricing` — wyłącznie konfigurowany szacunek kosztu telemetrycznego.

Nie zmieniaj konfiguracji progów podczas aktywnego runu. Checkpointy i audyt
są związane z dokładną polityką wizualną. `taskAttemptOverrides` powinno być
stosowane wyjątkowo i tylko dla znanego ID z raportu; podniesienie globalnego
limitu prób może zwiększyć koszt bez poprawy diagnozy.

Wartości w `pricing` nie są rachunkiem ani gwarantowaną ceną API. Raport
oznacza brakujące dane kosztowe jako `unknown`, nigdy jako zero.

## 14. Adaptery projektu

Kod specyficzny dla bieżącej witryny znajduje się w
`scripts/factory/project/`:

- `component-registry.json` — mapowanie reużywalnych fragmentów na sekcje i
  pliki;
- `import-content.php` — idempotentny importer treści źródłowej;
- `native-batch.js` — read-only probe rekordów WordPress/WooCommerce;
- `commerce-probe.php` — read-only weryfikacja danych handlowych;
- `qa-state.js` — przygotowanie prawdziwych stanów przeglądarki.

Czysty Autopilot dostarcza adaptery fail-closed. Są celowo niegotowe do
konkretnego projektu, dopóki frozen snapshot nie określi wymaganych danych.
Brak adaptera nie może zostać uznany za PASS.

`qa-state.js` powinien wykonywać dostępne, idempotentne akcje na prawdziwych
kontrolkach. Nie wolno tworzyć fikcyjnych zamówień, płatności, historii konta
ani wstrzykiwać DOM tylko na potrzeby screenshota.

## 15. Zmienne środowiskowe

Obsługiwane ustawienia operatorskie:

- `FACTORY_LOCAL_URL` — tymczasowo nadpisuje lokalny URL projektu;
- `FACTORY_RUNTIME` — `localwp` albo `docker`;
- `FACTORY_WP_ROOT` — jawny root WordPressa;
- `FACTORY_WP_CLI_PATH` — jawny WP-CLI lub `wp-cli.phar`;
- `FACTORY_PHP_PATH` — jawny PHP dla LocalWP;
- `FACTORY_CODEX_PATH` — natywny plik wykonywalny Codex CLI;
- `FACTORY_BROWSER_PATH` — Chrome, Edge lub Chromium dla browser QA;
- `FIGMA_TOKEN` — opcjonalny fallback dla ograniczonych eksportów REST.

Nie commituj sekretów ani lokalnych ścieżek użytkownika. Najpierw preferuj
normalną konfigurację projektu i automatyczne wykrywanie narzędzi.

## 16. Pliki wynikowe i raporty

Wszystkie generowane dowody pozostają w `.factory-cache/`, który jest
ignorowany przez Git i nie powinien trafiać do eksportu witryny.

Najważniejsze lokalizacje:

```text
.factory-cache/
  figma/latest/                 frozen snapshot źródła
  qa/latest/                    ręczne browser QA
  autopilot/current-v2.json     wskaźnik bieżącego runu
  autopilot/latest-visual.json  wskaźnik ostatniego pomiaru
  autopilot/runs/<run-id>/      kompletny run
```

W katalogu runu znajdują się m.in.:

- `state.json` — stan maszyny i checkpointy;
- `REPORT.md` — skrót operatorski;
- `custom-instructions.json` — snapshot użytych instrukcji;
- `route-blueprints.json`;
- `component-plan.json`;
- `execution-plan.json`;
- `diagnostics-<round>.json`;
- `usage.jsonl` i `usage-summary.json`;
- comparison folders z reference/render/diff;
- `audit-progress/` z atomowymi checkpointami audytu;
- `final-review-packet.json`;
- `final-sol.json`.

Każda próba ma własny katalog zawierający zwykle:

- `task-capsule.json`;
- `prompt.md`;
- `launch.json`;
- `events.jsonl`;
- `stderr.log`;
- `execution.json`;
- `result.json`;
- dowody, build logi i pomiary właściwe dla zadania.

Git nie zawiera bazy danych WordPressa. Migrację bazy i uploads wykonuje się
osobnym narzędziem, np. WP All-in-One Migration. `.factory-cache` nie jest
częścią paczki witryny.

## 17. Znaczenie statusów

- `running` — host lub worker wykonuje pracę;
- `paused` — run zatrzymał się na błędzie, brakującym źródle, limicie albo
  wymaganej decyzji;
- `stopped` — zapisano kontrolowane żądanie zatrzymania bez aktywnego workera;
- `complete` — wszystkie automatyczne warunki zostały spełnione i raport jest
  gotowy do przeglądu człowieka.

`complete` oznacza `READY FOR HUMAN REVIEW`, a nie automatyczny deployment na
produkcję.

## 18. Najczęstsze błędy

### `CODEX_UNAVAILABLE`

Codex CLI nie został odnaleziony. Ustaw `FACTORY_CODEX_PATH` na natywny plik
wykonywalny i ponów `plan`.

### `SITE_MISMATCH` lub `SITE_IDENTITY_MISMATCH`

WP-CLI wskazuje inną witrynę niż `environment.localUrl`. Uruchom właściwy site
w LocalWP albo popraw konfigurację. Nie omijaj tej kontroli.

### `AUTOPILOT_ALREADY_RUNNING`

Istnieje żywy host albo worker. Sprawdź `factory:autopilot:status`; nie uruchamiaj
drugiej instancji.

### `INTERRUPTED_RUN` lub `UNFINISHED_RUN`

Historia istnieje i musi zostać wznowiona:

```bash
npm run factory:autopilot:resume
```

### `CUSTOM_INSTRUCTIONS_CHANGED`

Instrukcje różnią się od snapshotu runu. Przywróć dokładną zawartość używaną
na starcie. Nie próbuj podmieniać instrukcji w połowie procesu.

### `PROJECT_CHANGED`

`factory/project.json` zmienił się od rozpoczęcia runu. Przywróć konfigurację
albo zakończ pracę jako osobny, świadomie rozpoczęty projekt.

### `SNAPSHOT_INCOMPLETE`

Snapshot nie spełnia kontraktu. Sprawdź:

```bash
npm run factory:figma:status
npm run factory:figma:validate
```

Nie oznaczaj manifestu jako complete ręcznie bez wymaganych assetów i
referencji.

### Figma MCP `AuthRequired`

Najpierw napraw połączenie Figma MCP. Jeśli środowisko posiada `FIGMA_TOKEN`,
Autopilot może użyć ograniczonego fallbacku wyłącznie dla konkretnych
brakujących node'ów. Nie uruchamia ponownie audytu całego pliku.

### `SOURCE_INPUT_REQUIRED`

Brakuje prawdziwych danych biznesowych lub źródłowych. Otwórz `REPORT.md` i
wskazany `.source-dependency.json`. Autopilot nie może zastąpić brakującego
zamówienia, konta, płatności albo nieistniejącej treści danymi testowymi.

### `STATE_UNAVAILABLE_AFTER_PREPARATION`

Stan nadal nie jest dostępny po jednej kontrolowanej próbie przygotowania.
Napraw sesję, dane albo prawdziwy mechanizm UI. Nie jest uruchamiana ślepa
druga próba CSS.

### `TOKEN_BUDGET_REACHED` lub `TASK_*_BUDGET_REACHED`

Run albo zadanie osiągnęło bezpiecznik kosztu/kontekstu. Sprawdź
`usage-summary.json`, zakres task capsule i raport. Nie zwiększaj limitu bez
ustalenia, dlaczego zadanie nie kończy się w obecnym zakresie.

### `HUMAN_REVIEW_REQUIRED`

Ograniczone naprawy i dozwolony route-level Sol polish nie dały dalszego
postępu albo problem nie może zostać bezpiecznie rozstrzygnięty automatycznie.
Dowody są zachowane i są właściwym punktem startu ręcznej korekty.

### `FINAL_MANUAL_REVIEW_REQUIRED` lub `FINAL_MEASURED_CHECKS_FAILED`

Finalny audyt znalazł problem większy niż dozwolona mała korekta albo świeży
pomiar nie przeszedł warunków akceptacji. Status READY nie zostaje nadany.

## 19. Weryfikacja zmian w samym Autopilocie

Po zmianie engine'u lub jego dokumentowanych kontraktów uruchom:

```bash
npm run factory:autopilot:test
npm run factory:validate
npm run build
```

Opcjonalny test smoke:

```bash
npm run factory:autopilot:smoke
```

Smoke używa syntetycznego fixture, browsera i modeli. Może zużywać capacity i
tokeny. Potwierdza działanie mechanizmu, ale nie jest akceptacją produkcyjnej
witryny.

## 20. Zalecenia operatorskie

- Dodaj custom instructions przed startem runu.
- Nie zmieniaj Figmy, konfiguracji progów ani projektu podczas aktywnego runu.
- Używaj `status`, `stop` i `resume`; nie kasuj checkpointów ręcznie.
- Nie traktuj lokalnego cropa sekcji jako zaliczenia strony.
- Czytaj `REPORT.md` oraz wskazane dowody zamiast całych logów historycznych.
- Nie podnoś limitów prób, zanim nie zostanie ustalony konkretny blocker.
- Brak danych traktuj jako zależność do rozwiązania, nigdy jako zgodę na
  fikcyjny content.
- Po statusie complete wykonaj przegląd człowieka, backup/migrację WordPressa
  oraz standardowy proces release.
