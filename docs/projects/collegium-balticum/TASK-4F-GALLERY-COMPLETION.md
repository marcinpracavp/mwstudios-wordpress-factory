# Task 4F — domknięcie pobrania galerii po zgodzie użytkownika

Ten raport zastępuje wcześniejszą blokadę 0/21 zdjęć w raportach 4F. Historyczne pomiary i referencje zachowano. Zatwierdzony push wykonał wyłącznie aktualizację project/collegium-balticum: 6f1479c → d1d514f. Main i autopilot-clean pozostały bez zmian. Workflow uruchomił się automatycznie przez ograniczony trigger push; nie wykonano ponownego capture stron ani pobierania dokumentów. Poprawki i dowody z tego wznowienia zapisujemy lokalnie w kolejnym commicie.

## Rzeczywiste zdjęcia i pochodzenie

[Workflow 38071407938](https://github.com/marcinpracavp/mwstudios-wordpress-factory/actions/runs/38071407938) — SUCCESS, commit d1d514f2dc932a2bbef23386f406a41ca3f6d672. Artefakt cb-gallery-originals-38071407938, ID 11676622807. **21/21 prawdziwych JPEG-ów HTTP 200, 0 błędów**; łącznie 2811389 B. Wymiary: 675×900, 600×900 i 1200×800, zgodne z pełnymi wariantami srcset w źródłowym HTML. Zweryfikowano listę 21 dokładnych href, manifest, SHA-256 wszystkich plików, MIME, geometrię oraz rzeczywiste dekodowanie Chromium. ZIP Actions sprawdzono także względem digest GitHuba; ZIP wewnętrzny — CRC i manifest. Nie zgadywano URL-i.

- [ZIP Actions](/workspace/.factory-cache/live/collegium-balticum/downloads/11676622807.zip), 2493389 B; SHA-256 3354444dd817b218d5fe57bdbe8da1127a8dc0ac8ec2dcdbe24124c877e621f2.
- [ZIP zdjęć](/workspace/.factory-cache/live/collegium-balticum/downloads/11676622807-gallery/cb-gallery-originals.zip).
- [Zweryfikowany manifest](/workspace/.factory-cache/live/collegium-balticum/migration/gallery-originals/f7b72306ca3c587c/manifest.json); SHA-256 f7b72306ca3c587cd0cc8ae5f00d0375dd896e25beaa83ba120e59d1fb35b40e.
- [Pełne dowody](TASK-4F-GALLERY-EVIDENCE.json); [QA runtime](/workspace/.factory-cache/live/collegium-balticum/migration/task4f/gallery-completion/gallery-qa.json). Pliki binarne pozostają w ignorowanym cache.

## WordPress i funkcjonalność

Istniejące zatrzymane kontenery wznowiono przez docker compose up -d db wordpress wpcli, zachowując bazę i Media Library. Motyw mwstudios-wordpress-factory, ACF Pro i lokalny URL localhost:8000 pozostają bez zmian. Importer gallery-import.php uruchomiono dwa razy: 21 mapowań, IDs 1838–1858, liczba załączników 303 → 324 → 324. IDs, hash mapy galerii i hash mapy dokumentów identyczne po obu importach. Oryginały zapisane jako załączniki; 21 href galerii prowadzi do lokalnych pełnych JPEG-ów, miniatury pozostają istniejącymi plikami. Zachowano ALT istniejących załączników; opisowa adekwatność ALT pozostaje do kontroli manualnej.

Test wszystkich 21 plików: lokalny HTTP 200, image/jpeg, identyczne SHA i wymiary. **43 próby lightboxa PASS**: 21 desktop + 21 mobile + 1 przy 320 px; Enter, ArrowRight/ArrowLeft, Escape, powrót fokusu, Tab/Shift+Tab i geometria. Kontrola rzeczywistych screenshotów ujawniła zbyt duży modal oraz przejściowe wyjście fokusu; naprawiono scoped SCSS i handler Tab. Zdjęcie, modal i przyciski mieszczą się teraz w viewportach. Nie zmieniono CTA ani formularza.

- [Desktop lightbox](/workspace/.factory-cache/live/collegium-balticum/migration/task4f/gallery-completion/CB-05-desktop-lightbox.png)
- [Mobile lightbox](/workspace/.factory-cache/live/collegium-balticum/migration/task4f/gallery-completion/CB-05-mobile-lightbox.png)
- [320 px lightbox](/workspace/.factory-cache/live/collegium-balticum/migration/task4f/gallery-completion/CB-05-narrow-lightbox.png)

## Porównanie CB-05 po imporcie

| Widok | Przed pobraniem | Po pobraniu i poprawkach modalu | Obraz strony | Dowody |
| --- | --- | --- | --- | --- |
| desktop | 6.98% | 6.98% | SHA identyczne | [screenshot](/workspace/.factory-cache/live/collegium-balticum/migration/qa/CB-05-desktop.png), [para](/workspace/.factory-cache/live/collegium-balticum/migration/comparisons/CB-05-desktop-pair.png) |
| mobile | 12.32% | 12.32% | SHA identyczne | [screenshot](/workspace/.factory-cache/live/collegium-balticum/migration/qa/CB-05-mobile.png), [para](/workspace/.factory-cache/live/collegium-balticum/migration/comparisons/CB-05-mobile-pair.png) |

Screenshoty pełnej strony identyczne bajtowo; import zmienił tylko cele powiększeń. Nie uznajemy tych procentów za próg akceptacji. Pozostałe 36 screenshotów i pomiarów z ukończonego 4F zachowano; w tym wznowieniu ponowiono dwa widoki CB-05 i osiem kontroli szerokości. Pełne 38 pomiarów pozostaje w TASK-4F-VISUAL.md i comparisons/comparison.json. Wszystkie 19 pozycji rejestru zachowano; obrazy CB-05 DONE, VISUAL_QA i WCAG_QA nadal IN_PROGRESS dla wszystkich.

## Regresja

- Build factory i CB PASS, po trzy dotychczasowe ostrzeżenia rozmiaru assetów.
- LIVE 3/3, Autopilot 68/68, capture 1/1, config/schema 2/2, gallery validator 3/3 PASS.
- Rendering CB-05 desktop/mobile PASS, osiem kontroli szerokości PASS, brak overflow/uszkodzonych obrazów/błędów JS. Zbiorczy zapis zachowuje 38 widoków i 76 kontroli.
- Ponowne interakcje 19 stron PASS; lokalny formularz wyłącznie z bezpiecznym sinkiem.
- 99 lokalnych URL HTTP 200; dokumenty 37 mapowań, 35 unikalnych załączników i 43 linki, SHA/MIME/HTTP 200. Bez ponownego importu dokumentów.
- Powtórny axe CB-05 desktop/mobile oraz keyboard/reflow/spacing PASS w zakresie działania testów; raport nadal ujawnia naruszenia. Globalnie 803 wystąpienia (796 kontrastu, 7 rozróżnienia linków), 42 dotychczasowe ostrzeżenia Hx. To nie jest WCAG PASS.

Logi bieżącej regresji: /workspace/.factory-cache/live/collegium-balticum/migration/task4f/gallery-completion/. Poprzednie pełne testy 4F pozostają w task4f/logs/. Początkowe testy kontrolne wykryły problem geometrii i fokusu; końcowe testy uruchomiono po naprawach.

## Nadal potrzebne do zamknięcia zadania 4

Blokada 21 zdjęć została usunięta. Pozostają dalsze dopasowanie i odbiór wizualny 38 widoków, decyzje PM dotyczące kontrastu CTA 2,71:1 / 2,53:1, pozostałych jasnych tekstów, linków, widocznych etykiet i mapy nagłówków oraz manualne audyty PDF/DOCX, filmów, ALT, czytników i zoomu. Wariant AA pozostaje propozycją, bez wdrożenia. Nie deklarujemy gotowości produkcyjnej.
