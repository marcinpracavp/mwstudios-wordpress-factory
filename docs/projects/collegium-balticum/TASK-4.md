# Zadanie 4 — rzeczywista migracja CB do lokalnego WordPressa

Praca na `project/collegium-balticum`, baza `4e283cf`. Nie zmieniono `main` ani `autopilot-clean`, nie wykonano push ani wdrożenia na produkcję. Bieżąca tabela wszystkich adresów: [TASK-4-REGISTER](TASK-4-REGISTER.md); dowody i SHA256: [TASK-4-EVIDENCE](TASK-4-EVIDENCE.json). Wcześniejsze raporty pozostają historią etapów 1–3C.

## Wynik i granice gotowości

W lokalnej bazie istnieje **19/19 wymaganych widoków**: 17 stron, jeden pełny natywny wpis i archiwum natywnej kategorii. Wszystkie otwierają się pod zachowanymi ścieżkami na **http://localhost:8000**. Zawierają autentyczną treść zapisanych referencji, bez fixture. Import przeniósł 93 sekcje, menu i stopkę, teksty, linki, SEO, obrazy, akordeony, zakładki oraz oryginalne osadzenia multimediów.

Aktywny motyw: `mwstudios-wordpress-factory`; ACF Pro `6.7.0.2`; środowisko `local`, język `pl_PL`, indeksowanie wyłączone (`blog_public=0`). Istnieje 316 powiązań źródłowych URL mediów z 259 różnymi załącznikami Media Library. W bibliotece zachowano też wcześniejsze warianty i fixture, których nie używa migracja. Ponowny import zachowuje ID i liczby rekordów: 35 stron, 23 wpisy, 268 załączników, 92 pozycje menu. Nie usuwano wcześniejszych danych.

**To nie jest jeszcze zatwierdzona zgodność 1:1 ani WCAG 2.1 AA.** Powstało 38 lokalnych screenshotów i wykonano 38 porównań z produkcją, lecz pozostają różnice w geometrii, łamaniu tekstu, karuzelach i stopce. VISUAL_QA pozostaje IN_PROGRESS. Kompletność treści oznacza pokrycie całego zapisanego widoku, nie import wszystkich artykułów albo wszystkich podstron witryny.

## Źródło i rzeczywiste dane

Wykorzystano istniejące artefakty 3C, bez ponawiania capture: `b188794e2451ce56` (210 plików), `a58132455f6f7756` (426), `0f72d1ed1fb38100` (227). Zweryfikowano manifesty, pochodzenie i SHA256. 38 referencji pozyskanych; jakość źródła nadal ma 32 widoki bez ostrzeżeń i 6 z udokumentowanymi zastrzeżeniami. Dodatkowe obrazy pochodzą wyłącznie z oryginalnych adresów publicznego CDN zawartych w zamrożonym HTML, z zapisanymi SHA256 i źródłem.

Importer odseparowuje globalne menu/stopkę oraz skrypty śledzące, NitroPack, techniczne nakładki i klony sliderów. Odtwarza strukturę przez wspólne komponenty CB, w ramach dotychczasowych rodzin factory. ACF Local JSON jest wersjonowany; strukturę pól opisuje [TASK-4-FIELDS](TASK-4-FIELDS.md). Sekcje oraz nagłówek/stopka i hero archiwum są edytowalne przez ACF; nawigacja przez natywne menu, a tytuły/daty/zajawki/kategorie wpisów przez natywny edytor WordPressa. Nie zbudowano 19 sztywnych szablonów.

Hierarchia stron zachowana; rodzice pomocniczy służą ścieżkom i nie oznaczają migracji treści spoza zakresu. Natywne archiwum bloga i pełny wpis CB-03 działają. Dodatkowe 18 rekordów zawiera tylko autentyczne zajawki widoczne w referencjach; linki prowadzą do rzeczywistych artykułów źródłowych. Nie udają pełnych lokalnie zmigrowanych artykułów. Paginacja działa na dostępnych natywnych danych, nie odwzorowuje całej bazy produkcyjnego bloga.

SEO źródła jest przechowywane w metadanych WordPressa, w tym kluczach zgodnych z Yoast; fallback motywu renderuje dostępne tytuły/opisy i metadane społecznościowe. Nie zadeklarowano zainstalowanego Yoasta. Oryginalne ALT zachowano; nieliczne opisy funkcjonalnych odnośników galerii oznaczono jako uzupełnienie dostępności do przeglądu SEO.

## Największe poprawki wyglądu i działania

- Oryginalne logo, Poppins i jego grubości, kolory, szerokości kontenerów, bannery, karty i stopka; lokalne pliki fontów wraz z licencją OFL.
- Izolacja CSS do CB bez zmiany relatywnego priorytetu źródłowych reguł: wspólny zakres i zakres konkretnej strony mają identyczną specyficzność. Zachowano różne wersje źródłowego arkusza dla CB-05/CB-18.
- Usunięto kolizje z globalnymi stylami factory: biały tekst w jasnym kontakcie, dodatkowe odstępy formularza, typografię nagłówków, ukrywane grupy pól i wyrównanie placeholderów.
- Uzupełniono utracone puste textarea oraz osiem rzeczywistych YouTube iframe w CB-04/CB-05 z oryginalnych atrybutów Nitro; iframe nie włączają autoplay. Zachowano oryginalną mapę kontaktu.
- Przy jednym zdjęciu renderowany jest statyczny baner. Na stronie głównej dostępna nawigacja slajdów, klawiatura i pager; pierwszy slajd ustalono osobno z DOM desktop/mobile.
- Akordeony bez powielania pytania w odpowiedzi; taby z przypisanymi panelami, menu z poprawnym Escape i podmenu klawiaturowymi. Galerie mają lokalny dialog i powrót fokusu.
- Promocje mobilne na CB-04/CB-06/CB-07 zachowują pionową listę autentycznych kart; powielone klony źródłowego Slick nie są treścią i zostały pominięte.
- Galeria CB-18 zachowuje cztery kolumny desktop i jedną mobile; logo Erasmus zachowuje źródłowe wymiary, zamiast wymiarów pełnego załącznika.

## Świadome odstępstwa i otwarte blokady

CB-08/CB-11: pusty źródłowy src pominięto, bez wymyślania obrazu. CB-17/CB-18: naprawiono zapadniętą geometrię karuzeli desktop, zachowując znaną kolejność DOM. CB-16: usunięto około 5 px overflow mobile. Zamknięte menu mobilne nie generuje panelu poza viewportem; nie skopiowano klonów Slick ani technicznych nakładek. Te różnice wpływają na pełne screenshoty i surowy diff.

**Dokumenty:** zachowano 43 odnośniki do 37 unikalnych PDF/DOC/XLS/ZIP, ale nie pobrano lokalnych kopii. Nie występują w artefaktach, a znany brak połączenia Codespace z hostem CB nie został ponownie diagnozowany. Konkretne URL i opisy: [TASK-4-DOCUMENTS](TASK-4-DOCUMENTS.md). Potrzebny jest jednorazowy zdalny download tej listy oraz import do Media Library; obecne ograniczenie push wymaga osobnej zgody na opublikowanie i uruchomienie rozszerzenia workflow.

**Formularz:** backend lokalny waliduje nonce, wymagane pola, e-mail i zgodę, zapisuje zgłoszenie w lokalnej bazie i zwraca komunikat. Test nie wysłał wiadomości do rzeczywistych odbiorców. Produkcyjny transport poczty i adresaci nie są skonfigurowani; nie deklarujemy wysyłki e-mail. Lokalny komunikat o trybie testowym jest jawny.

**Dostępność:** skip link, focus, programatyczne etykiety, semantyka tabel, menu/accordion/tab/galeria klawiaturowe i reflow sprawdzone w zakresie komponentów. Użytkownik polecił zachować wygląd źródłowych pomarańczowych CTA i formularza; problemy kontrastu i braku widocznych etykiet pozostają do PM. Zewnętrzne filmy/captions, mapa oraz dostępność dokumentów nie zostały zweryfikowane. Nie jest to pełny audyt WCAG ani deklaracja zgodności.

## Testy i dowody

- LIVE adapter: 3/3 PASS; Autopilot: 21/21 PASS; remote capture engine: 1/1 PASS (lokalny fixture wyłącznie silnika); konfiguracja CB: PASS, dokładnie 19 adresów.
- Build: PASS, trzy ostrzeżenia Webpack o rozmiarze/performance assetów; nie aktualizowano zależności ani Browserslist przy okazji migracji.
- PHP lint zmienionych plików i JS syntax: PASS; `git diff --check`: PASS.
- Render: 38/38 HTTP 200, jeden logiczny H1, zero błędów JS, brak uszkodzonych obrazów, brak brakujących bloków treści i iframe według inwentarza źródła.
- Reflow: 76 kontroli na 320/768/1024/2048 px, bez poziomego overflow; dodatkowo desktop 1440 i mobile 390 px.
- Interakcje: menu mobile, podmenu/Escape desktop, accordiony/tabs, slider/pager, galerie, filtr Fitodietetyka; lokalny formularz invalid=422, valid=302 i poprawny submit przez przeglądarkę.
- Porównania: 38 par źródło/lokalna wersja, 38 overlay i 38 diff — 114 obrazów. Pliki źródłowe i lokalne powiązano hashami; raport odrzuca nieaktualne pary. Surowa różnica pikseli (maks. różnica kanału >32) nie jest progiem akceptacji i nie została zamaskowana ani przeskalowana.

Automatyczne screenshoty blokują żądania poza localhost, aby wynik był deterministyczny; mapa i YouTube pozostają rzeczywistymi osadzeniami w stronie, ale ich odtwarzanie nie jest dowodem tego testu. Wymiary każdej pary i miary różnicy są w TASK-4-EVIDENCE.json.

## Pliki i uruchomienie

Kod: `scripts/projects/collegium-balticum/migrate/` (extract/media/import/styles/provision/qa/interactions/compare/report), `functions/collegium-balticum.php`, `partials/cb/`, `acf-json/group_cb_source.json`, `acf-json/group_cb_globals.json`, dwa arkusze CB w `src/css/components/`, `src/js/collegium-balticum.js`, `assets/fonts/cb/`. Ograniczone punkty podłączenia: header/footer/functions/single, partiale factory page/archive i główny SCSS; skrypty npm dodano bez nowych zależności. `dist/` powstał wyłącznie przez build.

```sh
# Działający Docker runtime, motyw i legalnie dostarczone ACF Pro wymagane.
npm run cb:wp -- theme list
npm run cb:migrate
npm run cb:migrate:qa
node scripts/projects/collegium-balticum/migrate/interactions.js
npm run cb:migrate:compare
node scripts/projects/collegium-balticum/migrate/report.js
```

Provisioning aktualizuje istniejące rekordy i wykonuje lokalny backup SQL przed importem. Jawne ponowienie przywraca dane z referencji, więc należy je wykonywać świadomie po ręcznych zmianach redakcyjnych. Gdy brakuje cache, trzeba pobrać istniejące artefakty 3C i użyć przygotowanego importu, bez ponownego capture produkcji.

Dowody w `.factory-cache/live/collegium-balticum/migration/`:

- `qa/CB-00-desktop.png` … `qa/CB-18-mobile.png`: 38 pełnych screenshotów oraz osobne PNG viewportów.
- `qa/render.json`, `qa/interactions.json`: render, reflow, treść i interakcje.
- `comparisons/CB-XX-{desktop,mobile}-{pair,overlay,diff}.png`: porównania wszystkich widoków; `comparisons/comparison.json`: miary i SHA256.
- `source.json`, `import-result.json`, `supplemental-assets.json`, `documents.json`: dane, mapowanie ID i pochodzenie zasobów.
- `backup-*.sql`, `before-import.sql`: lokalne backupy, poza Git; screenshoty i duże artefakty również poza Git.

Do pełnego zamknięcia zadania pozostają: lokalne kopie dokumentów, końcowe dopasowanie i akceptacja rozbieżności desktop/mobile oraz decyzje PM i kontrola dostępności materiałów zewnętrznych. Można oglądać i redagować całą lokalną witrynę; nie oznaczono pełnej gotowości wizualnej ani produkcyjnej.

## Przygotowane uzupełnienie dokumentów — jeszcze nie uruchomione

Workflow `.github/workflows/cb-documents.yml` pobiera sekwencyjnie dokładnie 37 oryginalnych plików z wersjonowanej listy `documents-source.json`, bez WordPressa, Dockera ani nowego capture stron. Minimalne uprawnienia `contents: read`, Node 22, brak sekretów, manifest SHA256 i jeden ZIP. Weryfikacja TLS pozostaje włączona; błędy HTTP, przekierowania poza dozwolone hosty oraz HTML/ekrany blokady nie są traktowane jako dokumenty. Workflow ma trigger ograniczony do zmiany własnego pliku na gałęzi projektu, aby można go było zarejestrować bez zmian `main`, oraz ręczny dispatch.

Przed uruchomieniem potrzebna jest **osobna zgoda użytkownika na push**, zgodnie z ochroną projektu w zadaniu 4. Kod istnieje lokalnie, lecz nie deklarujemy pobranych plików. Sprawdzono import manifestu bez pobierania plików oraz odrzucenie ZIP ze zmienionym hashem; importer PHP przeszedł lint. Import prawdziwych dokumentów i ich działanie w Media Library pozostają BLOCKED do otrzymania artefaktu.

Po pobraniu artefaktu `cb-documents-<run_id>`:

```sh
node scripts/projects/collegium-balticum/migrate/documents.js --import /ścieżka/cb-documents.zip
npm run cb:wp -- eval-file /var/www/html/wp-content/themes/mwstudios-wordpress-factory/scripts/projects/collegium-balticum/migrate/documents-import.php
```

Należy zachować aktualny backup lokalnej bazy przed importem. Import aktualizuje te same załączniki po hashach i zamienia odnośniki w ACF/natywnej treści, bez duplikowania stron. Po nim ponowić kontrolę dokumentów, screenshoty oraz porównania. Paginacja `/category/wpisy/blog-post/page/2/` i natywne wyszukiwanie `/?s=dietetyka` odpowiedziały HTTP 200; zapis tekstu wiadomości testowej w lokalnym backendzie został dodatkowo potwierdzony.

Ostatni przebieg provisioning ponownie zachował wszystkie ID i liczby rekordów. Przywrócono źródłowe akapity z twardą spacją wewnątrz treści (ukryte dla czytnika), bez dodawania pustych sekcji, oraz zmierzoną szerokość 536 px kart w obu viewportach. Przewijanie wewnętrzne zachowuje źródłowe kadrowanie; czytelność przy zoomie wymaga dalszej decyzji PM. Szczegółowe aktualne miary wszystkich 38 par: [TASK-4-VISUAL](TASK-4-VISUAL.md). Dopasowanie kontaktu, przepływu logo Erasmus i czterech kolumn galerii biblioteki zostało potwierdzone obrazami; nie jest automatyczną akceptacją wizualną. Zachowano też dokładny źródłowy timestamp publikacji CB-03 (`2026-09-18T10:28:42+00:00`) w WordPressie oraz metadane article; obraz OG wskazuje lokalny załącznik.

Kontrola linków objęła wszystkie 19 widoków: brak pustych `href`, gołych `tel:`/`mailto:`, nieprzemapowanych odnośników do wymaganych lokalnych stron i uszkodzonych obrazów stopki. Puste źródłowe cele potraktowano jako elementy dekoracyjne, bez wymyślania adresów. Wyszukiwanie ma prawidłowy tytuł i styl archiwum; paginacja pochodzi wyłącznie z natywnego zapytania, bez zastępczych linków do nieistniejących stron. Dowody: `qa/links.json`, `qa/blog-seo.json`. Usunięto dublowane znaki Font Awesome nad oryginalnymi ikonami SVG menu/stopki; pozostają autentyczne obrazy CB.

Szerokość 536 px kart pochodzi z obu referencyjnych viewportów i została zachowana także na mobile. Przewijanie klawiaturą/dotykiem pozostaje wewnątrz komponentu, bez poszerzania dokumentu. Źródłowe kadrowanie kart i czytelność przy zoomie wymagają dalszej decyzji dostępności; nie zadeklarowano AA. Skrócono powtarzane zakresy źródłowego CSS bez zmiany specyficzności ani przypisań dla 19 wymaganych widoków.

Media Library: usunięto stare produkcyjne klasy `wp-image-*` na rzecz rzeczywistych lokalnych ID załączników, aby edycja WYSIWYG nie odwoływała się do nieistniejących rekordów źródłowej bazy. Arkusze źródła nie zawierają reguł zależnych od tych liczbowych ID, więc zmiana nie zmienia wyglądu. W CB-11 pominięty pusty baner miał w referencji 272 px desktop i 125 px mobile — wyjaśnia znaczną część różnicy wysokości; nie wymyślono obrazu. Ostatni build zmniejszył wynikowy arkusz główny z około 1,46 do 1,16 MiB, ale jego rozmiar nadal pozostaje ryzykiem wydajności do optymalizacji przed produkcją. Trzy ostrzeżenia Webpack nie są błędami kompilacji.

Historia Git: projekt zawiera `8d1de82` (adapter LIVE) i `9fe829a` (konfiguracja CB). `3583a4d` znajduje się na `feature/live-migration-tools`; jego zmiana jest równoważna `8d1de82`, co potwierdza identyczny `git patch-id --stable` (`426a07bc8a801457e25fc1ad3c112176c83a4d30`). Nie wykonano zbędnego merge/cherry-pick ani resetu. `autopilot-clean` pozostaje na `0077847`, `origin/main` na `519b7d0`.
