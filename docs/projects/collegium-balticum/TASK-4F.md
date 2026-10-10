# Task 4F — stan wykonania

Branch project/collegium-balticum, baza lokalna fd40cf9 (poprzednio aa49906), remote 6f1479c. Nie wykonano push, merge, resetu, wdrożenia ani nowych migracji. Trzy raporty 4E były identyczne z commitem fd40cf9; zachowano PDF/DOCX użytkownika i wcześniejsze artefakty.

Poprawki: piąta kolumna oraz centrowanie miniaturek galerii CB-05, klip zaokrągleń banerów, brakujący link archiwum CB-02, sześć portretów i podpisy CB-08, nadmiarowa linia 11 px CB-10, stabilizacja tabel CB-17 po załadowaniu fontów oraz bezpieczna semantyka opisów hero i stopki. Uniwersalny factory/Figma nie został zmieniony.

21 pełnych zdjęć: **0/21 odzyskanych, BLOCKED**. Dokładna lista i źródłowe href/srcset/ALT w TASK-4E-GALLERY-ORIGINALS.json; hash HTML 1847e29119d348c52040cfc435fa76cef07023003ae123091ec0af030679b6bb jest zweryfikowany. Codespace nie ma dostępu TCP do źródła, istniejący CDN probe zwrócił 404/153 B; nie powtarzano 21 timeoutów. Przygotowano lokalny workflow cb-gallery-originals.yml, walidowany ZIP importer i idempotentny Media Library importer po SHA. Nie udajemy pobrania, importu ani testu pełnych zdjęć; lightbox na autentycznych miniaturach działa.

Po uzyskaniu zgody: push tylko gałęzi projektu uruchomi job pobierający wyłącznie 21 href. Pobierz ZIP artefaktu, rozpakuj zewnętrzny ZIP Actions do cache, następnie:

`node scripts/projects/collegium-balticum/migrate/gallery-originals.js --import PATH/cb-gallery-originals.zip`

`npm run cb:wp -- eval-file /var/www/html/wp-content/themes/mwstudios-wordpress-factory/scripts/projects/collegium-balticum/migrate/gallery-import.php`

Powtórz importer i sprawdź stabilne attachment IDs/liczbę; później CB_ID=CB-05 QA/interakcje/rozmiary obrazu lightbox. Ten test jest zablokowany do prawdziwego pobrania; obecne mapowania 37 dokumentów nie są dotykane.

Raporty: [38 porównań](TASK-4F-VISUAL.md), [WCAG](TASK-4F-WCAG.md), [decyzje PM](TASK-4F-PM-DECISIONS.md), [dowody JSON](TASK-4F-EVIDENCE.json). Wszystkie 19 widoków istnieje, autentyczna treść pozostaje DONE, media CB-05 IN_PROGRESS; VISUAL_QA/WCAG_QA nadal IN_PROGRESS dla wszystkich 19. Żaden widok nie jest deklarowany jako gotowy produkcyjnie.

Końcowe testy: 38/38 renderów, 76/76 szerokości; 99 lokalnych URL HTTP 200; 38 testów reflow/odstępów i 38 tekstu 200%; natywna paginacja/wyszukiwarka, formularz z bezpiecznym sinkiem, menu/Escape/skip/focus, galerie i akordeony. Dokumenty: 37 mapowań, 35 załączników, 43 linki, SHA/MIME/HTTP 200 — sprawdzone istniejącym documents-qa.js, bez ponownego importu. LIVE 3/3, Autopilot 68/68, capture/config/schema + walidacja galerii 6/6; test fontów tabel fast/delayed 1500 ms PASS; logi w task4f/logs/. Build fabryczny i CB przechodzą z trzema znanymi ostrzeżeniami rozmiaru CSS/entrypoint/rekomendacji; nie zmieniono progów ani nie usuwano reguł dla innych widoków. Szczegółowe wyniki należy odczytać razem z logami, nie jako certyfikat WCAG.

Blokery zamknięcia zadania 4: 21 pełnych zdjęć wymagających zatwierdzonego runnera; decyzje palety/formularza/linków; odbiór wizualny 38 par; manualna dostępność PDF/wideo/czytników/zoom oraz właścicielska deklaracja dostępności.

Kod i workflow zapisano lokalnie w commicie `8c68aca`; raporty zapisane w następującym po nim commicie dokumentacyjnym. Aktywny motyw: mwstudios-wordpress-factory; ACF Pro 6.7.0.2; blog_public=0. Istniejący workflow dokumentów 38034776529 SUCCESS; nie uruchomiono nowych workflow.

Główny CSS końcowego buildu CB: 1 041 167 B (gzip 139 037 B), wobec 1 038 200 B po 4E. Przyrost obejmuje aliasy semantyczne oraz scoped korekty layoutu; trzy ostrzeżenia rozmiaru pozostają, nie obniżono limitów. Pełne rozmiary/SHA plików w TASK-4F-EVIDENCE.json.

## Aktualizacja po zatwierdzonym pobraniu galerii

21/21 pełnych oryginałów CB-05 pobrano, zweryfikowano i zaimportowano idempotentnie. Blokada 0/21 opisana powyżej jest historyczna. [Bieżący raport i testy](TASK-4F-GALLERY-COMPLETION.md) oraz [dowody](TASK-4F-GALLERY-EVIDENCE.json). Obrazy CB-05 DONE; VISUAL_QA/WCAG_QA pozostają IN_PROGRESS.
