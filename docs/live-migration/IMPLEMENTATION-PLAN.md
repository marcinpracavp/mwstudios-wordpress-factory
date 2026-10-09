# Minimalny plan rozszerzenia Autopilota

Status: plan zmian kodu po zadaniu 1; poniższe API i ścieżki cache LIVE są
propozycją, nie istniejącą funkcjonalnością. W zadaniu 1 zmieniamy dokumentację
i instrukcje, bez instalowania zależności, migracji danych i zmian silnika Figma.

## Fakty i miejsca zmian

| Mechanizm dziś | Rzeczywiste pliki | Minimalne rozszerzenie |
| --- | --- | --- |
| Konfiguracja zawiera `figma`, tryb boilerplate/project | `factory/project.json`, `factory/schemas/project.schema.json`, `scripts/factory/init-project.js`, `scripts/factory/validate-factory.js`, `scripts/factory/generate-context.js` | Jawne źródło `figma`/`live`, URL, ścieżka briefu i rejestru; brak nowego pola zachowuje Figma. Walidacja warunkowa; nie wkładać LIVE do `figma.url`. |
| Stały snapshot Figma i hashe silnika | `scripts/factory/autopilot/common.js`, `factory/figma.json`, `factory/schemas/figma-snapshot.schema.json`, `factory/schemas/figma-section.schema.json` | Adapter źródła, oddzielny schemat LIVE i cache per projekt/snapshot. Wspólny kontrakt tras/sekcji bez wymyślonych node ID. Fingerprint źródła i dokumentów zakresu. |
| Host uruchamia extraction przez Figma MCP i gate Figma | `scripts/factory/autopilot/run.js`, `gates.js`, `v2-preflight.js`, `discovery-plan.js` w tym samym katalogu | Wybór adaptera przez konfigurację; discovery LIVE dla pełnej wymaganej listy i stanów; brak MCP Figma w LIVE. Zachować retry, stop/resume, zamrożony plan i fail-closed. |
| Prompty i kontekst opierają się na Figma/nodeId | `scripts/factory/autopilot/prompts.js`, `prompt-topics.js`, `source-context.js`, `source-geometry.js`, `task-capsule.js`, `content-batches.js`, `native-batch.js`, `result-evidence.js` | Reguły pochodzenia URL/DOM/asset i projektowy brief; adapter referencji i mapowania pól. Pełny brief nie mieści się automatycznie w custom instructions: loader ma limit 16000 bajtów/pliku. |
| Planowanie struktur i stanów | `scripts/factory/autopilot/structure-analysis.js`, `state-plan.js`, `route-blueprint.js`, `component-plan.js`, `canvas-audit.js` | Reużycie istniejących algorytmów po normalizacji LIVE. Canvas/node-specific checks pozostają Figma-specific. Bramka kompletności obowiązkowych ID, bez limitu stron wynikającego z liczby rodzin. |
| Capture/diff wymaga snapshot gate i referencji Figma | `scripts/factory/autopilot/visual.js`, `visual-ownership.js`, `source-dependencies.js`, `template-evidence.js`, `final-audit.js`, `audit-progress.js`; `scripts/factory/qa/capture.js`, `run-qa.js`, `factory/qa.json` | Źródło referencji z adaptera LIVE; identyczne warunki źródło/lokalnie, osobne wyniki wizualne/WCAG/SEO, udokumentowane wyjątki. Nie obniżać progów. |
| Runtime może tworzyć skeleton i używać URL query | `scripts/factory/autopilot/route-readiness.js` | LIVE wymaga parentów, dokładnych ścieżek i kategorii; sama gotowość runtime nie daje CONTENT=DONE. `ensureReachablePermalinks()` dziś wyłącza pretty permalinks w Docker — wymaga osobnej ścieżki LIVE oraz testów rewrite, bez regresji Figma. |
| Puste adaptery projektu | `scripts/factory/project/import-content.php`, `component-registry.json`, `qa-state.js`, `native-batch.js` | Projektowe mapowanie rodzin, importer natywnych pages/posts/terms/media/ACF i realne stany. Nie hardkodować klienta w silniku. |
| Status hosta nie jest rejestrem konkretnych stron | `scripts/factory/autopilot/task-progress.js`, `template-evidence.js`, `audit-progress.js`, `scripts/factory/qa/report.js` | Oddzielny rejestr TEMPLATE/CONTENT z lokalnym URL, rekordem WP i dowodami; eksport raportu do dokumentacji na żądanie. |

## Kolejność wdrożenia i testów

1. Dodać kontrakt wyboru źródła i adapter; zachować stare konfiguracje Figma.
   Testy walidacji Figma/LIVE, odrzucania braku URL/rejestru i izolacji klientów.
2. Dodać collector LIVE oparty na istniejącym `playwright-core` i capture,
   bez nowych zależności, o ile możliwe. Testować redirect/404, pochodzenie,
   kompletność tras, zamrożenie/hash i bezpieczne resume.
3. Podłączyć wspólny pipeline przez adapter, zachowując kontrakty Figma.
   Testy planów, stanów, braków treści i dowodów. Nie zmieniać tylko nazwy cache:
   istnieje wiele zależności od node ID i schematów Figma.
4. Dodać rejestr gotowości i routing LIVE: testy TEMPLATE≠CONTENT,
   hierarchii, archiwum kategorii, slugów, pretty permalinks i ochrony ręcznych zmian.
5. W osobnym branchu klienta wdrożyć ACF/moduły/treść dopiero po analizie LIVE.
   Uruchomić istniejący suite Autopilota i `npm run build`, a potem rzeczywiste
   visual/WCAG/SEO QA. Nie uruchamiać kosztownego smoke ani automatycznych workerów
   wyłącznie dla zmian dokumentacji.

Nowy klient ma dostarczyć URL, brief, rejestr i ustawienia QA, bez zmian silnika.
Projektowe adaptery nadal mogą być potrzebne dla jego struktur danych.
Trwały brief/rejestr pozostaje poza ignorowanym `.factory-cache`.
