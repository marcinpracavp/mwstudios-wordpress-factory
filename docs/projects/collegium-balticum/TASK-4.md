# Zadanie 4 — rzeczywista migracja CB do lokalnego WordPressa

Praca na `project/collegium-balticum`, baza `4e283cf`. Nie zmieniono `main` ani `autopilot-clean`, nie wdrożono zmian na produkcję. Zgodnie z osobną zgodą użytkownika wypchnięto gałąź projektu do `4100e03` i uruchomiono wyłącznie workflow dokumentów. Bieżąca tabela wszystkich adresów: [TASK-4-REGISTER](TASK-4-REGISTER.md); dowody i SHA256: [TASK-4-EVIDENCE](TASK-4-EVIDENCE.json). Wcześniejsze raporty pozostają historią etapów 1–3C.

## Wynik i granice gotowości

W lokalnej bazie istnieje **19/19 wymaganych widoków**: 17 stron, jeden pełny natywny wpis i archiwum natywnej kategorii. Wszystkie otwierają się pod zachowanymi ścieżkami na **http://localhost:8000**. Zawierają autentyczną treść zapisanych referencji, bez fixture. Import przeniósł 93 sekcje, menu i stopkę, teksty, linki, SEO, obrazy, akordeony, zakładki oraz oryginalne osadzenia multimediów.

Aktywny motyw: `mwstudios-wordpress-factory`; ACF Pro `6.7.0.2`; środowisko `local`, język `pl_PL`, indeksowanie wyłączone (`blog_public=0`). Istnieje 316 powiązań źródłowych URL mediów z 259 różnymi załącznikami Media Library. W bibliotece zachowano też wcześniejsze warianty i fixture, których nie używa migracja. Ponowny import zachowuje ID i liczby rekordów: 35 stron, 23 wpisy, 268 załączników, 92 pozycje menu przed importem dokumentów; po nim 303 załączniki. Nie usuwano wcześniejszych danych.

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

**Dokumenty:** pobrano 37/37 oryginalnych adresów, bez błędów, wszystkie HTTP 200. [Workflow 38034776529](https://github.com/marcinpracavp/mwstudios-wordpress-factory/actions/runs/38034776529), artefakt `11664175006` (`cb-documents-38034776529`). SHA256 artefaktu GitHuba, CRC obu ZIP-ów, manifest i wszystkie pliki zweryfikowano. Zaimportowano 35 różnych plików do Media Library — dwa powtórzenia bajtowe współdzielą załączniki. Wszystkie 43 odnośniki na 19 widokach prowadzą lokalnie; rozmiary i SHA256 pobrań HTTP odpowiadają źródłu. Ponowny import zachował 303 załączniki i te same 35 ID. Szczegóły plików, ID i URL: [TASK-4-DOCUMENTS](TASK-4-DOCUMENTS.md). Dostępność treści dokumentów pozostaje do osobnego audytu.

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

Do pełnego zamknięcia zadania pozostają: końcowe dopasowanie i akceptacja rozbieżności desktop/mobile oraz decyzje PM i kontrola dostępności materiałów zewnętrznych. Można oglądać i redagować całą lokalną witrynę; nie oznaczono pełnej gotowości wizualnej ani produkcyjnej.

## Wykonane uzupełnienie dokumentów

Workflow `.github/workflows/cb-documents.yml` pobiera sekwencyjnie dokładnie 37 oryginalnych plików z wersjonowanej listy `documents-source.json`, bez WordPressa, Dockera ani nowego capture stron. Minimalne uprawnienia `contents: read`, Node 22, brak sekretów, manifest SHA256 i jeden ZIP. Weryfikacja TLS pozostaje włączona; błędy HTTP, przekierowania poza dozwolone hosty oraz HTML/ekrany blokady nie są traktowane jako dokumenty. Workflow ma trigger ograniczony do zmiany własnego pliku na gałęzi projektu, aby można go było zarejestrować bez zmian `main`, oraz ręczny dispatch.

Użytkownik udzielił osobnej zgody na push i workflow dokumentów. Uruchomienie zakończyło się sukcesem na commicie `4100e036753aa3690c0352e0f8ff75d493a04ec0`. Zweryfikowany bundle: `.factory-cache/live/collegium-balticum/migration/documents-import/9a7caad37daba912/`; artefakt GitHuba: `.factory-cache/live/collegium-balticum/downloads/documents-38034776529/`. Import oraz jego powtórzenie wykonano po lokalnym backupie SQL. W pierwszej próbie importer nie mógł czytać katalogu utworzonego przez `mkdtemp`; naprawiono uprawnienia wyłącznie publicznego, zweryfikowanego bundle (katalogi 755/pliki 644), a import ponowiono bez zmian sekretów lub backupów.

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

Commity implementacji: `f6c99d8` (47 plików) i `c53c317`; wypchnięte w zatwierdzonej gałęzi wraz z `4100e03` (pochodzenie manifestu i poprawka testu rejestru URL). Dodatkowa kontrola edytora potwierdziła 218 klas `wp-image-ID` odnoszących się wyłącznie do istniejących lokalnych załączników. Poprawiono nadpisaną przez ogólną regułę Gutenberg geometrię kolumn desktop: kierunki rekrutacji stoją obok siebie, zgodnie z referencją (y=837,25 px, wysokość 1039,578125 px). W CB-04 wysokość pełnego desktopu spadła z 8775 do 7883 px przy źródle 7924 px; surowy diff z 16,9% do 10,6%, nadal bez akceptacji 1:1. Kontrola obejmuje wszystkie pięć widoków używających kolumn. Import ZIP dokumentów poprawnie wybiera domyślny katalog cache również bez `--output`; sprawdzono to na testowym manifeście, bez importowania fikcyjnych dokumentów do WordPressa.

Przy kolejnych poprawkach można użyć `CB_ID=CB-04 npm run cb:migrate:qa` oraz `CB_ID=CB-04 npm run cb:migrate:compare`. Oba polecenia aktualizują dowody tylko wskazanego widoku i zachowują pozostałe wyniki; raport nadal wymaga kompletu 38 par z poprawnymi hashami. W tabeli dokumenty bez odnośników oznaczono jako „nie dotyczy”, aby nie sugerować pobrania plików.

Kontrola dokumentów jest powtarzalna: `node scripts/projects/collegium-balticum/migrate/documents-qa.js`. Sprawdza pliki Media Library, SHA256/rozmiar/MIME i HTTP 200 wszystkich 37 dokumentów oraz wszystkie 43 powiązania na 19 widokach. Dowody: cache `qa/documents.json`, wersjonowany `TASK-4-EVIDENCE.json`. Nowe testy silnika: LIVE 3/3, Autopilot 21/21, remote capture 1/1 (wyłącznie fixture silnika), konfiguracja CB 1/1; build PASS z trzema ostrzeżeniami rozmiaru. Początkowe uruchomienie dwóch testów ograniczył sandbox; po uruchomieniu z dostępem do lokalnych subprocessów przeszły. Test konfiguracji poprawiono, by odróżniał tabelę statusów od rejestru rzeczywistych URL.

Importer dokumentów odczytuje surowe ACF (`get_field(..., false)`), aby ponowne zapisanie nie utrwalało dodatkowego formatowania WYSIWYG. Zamienia wyłącznie `href` oraz wartości URL w polach linków, pozostawiając autentyczne etykiety tekstowe. Kontrola idempotencji obejmuje nie tylko liczbę załączników i ID: porównuje też SHA256 treści 18 rekordów strony/wpisu oraz trzech grup opcji, przed i po ponowieniu. Archiwum CB-02 jest natywną kategorią i korzysta z opcji globalnych. Przywrócenie istniejących rekordów importerem źródłowym zachowało 19 ID, wszystkie lokalne dokumenty i liczby rekordów — nie dodano żadnych stron spoza zakresu.

## Kontrola Git przed zatwierdzonym push i importem dokumentów

`git status --short`, `git log -5 --oneline`, `git diff --stat` oraz `git diff --cached --stat` potwierdziły początkowy HEAD `c53c317`, obecność `f6c99d8` i brak zmian śledzonych/staged. Nieśledzone PDF i DOCX użytkownika pozostały poza commitami. Siedem wskazanych plików było zapisanych, bez dodatkowych niezacommitowanych zmian:

| Plik | Ostatni commit przy rozpoczęciu | Dalsze zmiany w tym domknięciu |
| --- | --- | --- |
| `_collegium-balticum.scss` | c53c317 | brak |
| `styles.js` | f6c99d8 | brak |
| `documents.js` | c53c317 | metadane błędów/runnera w 4100e03; odczyt publicznego bundle przez użytkownika kontenera |
| `cb-documents.yml` | f6c99d8 | brak; contents: read, wyłącznie gałąź projektu i dokumenty |
| `report.js` | c53c317 | aktualne liczby rekordów, pochodzenie artefaktu, dowody dokumentów i idempotencji |
| `functions/collegium-balticum.php` | f6c99d8 | brak |
| `extract.js` | f6c99d8 | brak |

Push `git push origin project/collegium-balticum` opublikował `4e283cf..4100e03`. Workflow dokumentów uruchomił się raz przez ograniczony trigger `push`; nie wywołano dodatkowego dispatch ani capture stron. Artefakt z GitHuba ma 15 039 900 B i SHA256 `d23604a599d013f56aa3350b3408a9930d15460af44fbb07a069914b615609d9`, zgodny z `digest` API. Bundle manifest SHA256: `9a7caad37daba912c188ec56950a97bd06a544c3d5cf81d9be5d78da872bd674`. Łączny rozmiar 37 pobrań źródłowych to 18 162 635 B (zawiera dwa powtórzenia bajtowe).

Wykonano `documents.js --import`, `cb:wp -- eval-file .../documents-import.php`, kontrolę `documents-qa.js`, powtórzenie importu, porównanie hashy treści i ID, pełne `cb:migrate:qa`, interakcje oraz `cb:migrate:compare`. Cache, ZIP-y, screenshoty, tymczasowe skrypty i backup SQL nie trafiły do Git. Pozostałe blokery: akceptacja/dalsze dopasowanie wizualne 19 stron, kontrast CTA 2,71:1/2,53:1 i etykiety widoczne do PM, audyt dostępności dokumentów/wideo oraz konfiguracja transportu poczty poza lokalnym backendem testowym. Nie jest to deklaracja WCAG AA ani gotowości produkcyjnej. Brak lokalnych kopii tych 37 dokumentów został rozwiązany.


## Task 4E — bezpieczne poprawki i końcowe dowody

Stan: IN_PROGRESS. Proces został przerwany przez zamknięcie Codespace przed końcowym raportem/commitami. Kod, baza, biblioteka mediów i zweryfikowane referencje przetrwały. Przy wznowieniu uruchomiono istniejące wolumeny, bez importu źródła ani dokumentów. Motyw mwstudios-wordpress-factory, ACF Pro 6.7.0.2, http://localhost:8000, blog_public=0; 37 mapowań dokumentów zachowanych. Zdalny HEAD potwierdzony przez API: 6f1479c. Brak nowszego workflow na tym HEAD; ostatni dokumentowy run 38034776529 zakończony success. Nie wykonano push, merge ani wdrożenia; main/autopilot-clean i pliki użytkownika zachowane.

Poprawiono: źródłowe Poppins 400/600, izolowaną rodzinę CBPoppins, typografię nagłówków/stopki i odstępy liter; source spacery zamiast scalanych marginesów; marginesy obrazów CTA w stopce; zamknięte menu mobile i natywny układ paginacji; źródłowe dekoracyjne linie overlay tile; semantykę galerii i dostępne nazwy wideo; nawigację focus/Escape, biografie, opis linków do plików oraz błędy konkretnych pól formularza. Hero i e-mail stopki dostosowują się do powiększonego tekstu. CTA i wygląd formularza/Hx nie zmienione bez PM.

| ID | Desktop: diff przed → po | Mobile: diff przed → po |
| --- | --- | --- |
| CB-00 | 9.79% → 6.86% | 24.85% → 23.03% |
| CB-01 | 3.42% → 0.25% | 6.71% → 7.86% |
| CB-02 | 5.01% → 1.66% | 17.72% → 21.68% |
| CB-03 | 8.86% → 0.35% | 16.17% → 14.76% |
| CB-04 | 10.59% → 8.06% | 18.95% → 14.49% |
| CB-05 | 12.84% → 11.79% | 14.73% → 12.93% |
| CB-06 | 12.59% → 8.69% | 16.58% → 14.19% |
| CB-07 | 12.72% → 10.31% | 15.18% → 14.27% |
| CB-08 | 14.50% → 13.51% | 23.26% → 14.21% |
| CB-09 | 6.89% → 2.13% | 7.59% → 2.12% |
| CB-10 | 10.90% → 9.20% | 19.22% → 17.42% |
| CB-11 | 19.92% → 17.66% | 15.16% → 10.73% |
| CB-12 | 11.83% → 0.01% | 15.47% → 1.90% |
| CB-13 | 7.79% → 6.62% | 11.95% → 14.58% |
| CB-14 | 7.81% → 5.42% | 9.01% → 13.26% |
| CB-15 | 4.86% → 2.92% | 5.37% → 8.61% |
| CB-16 | 6.66% → 0.27% | 12.06% → 6.80% |
| CB-17 | 5.49% → 4.24% | 11.21% → 6.06% |
| CB-18 | 5.33% → 3.51% | 10.71% → 17.09% |

Procent jest surowym pomiarem, nie progiem akceptacji. Usunięcie błędnego zamkniętego panelu mobile ujawnia treść, którą panel przykrywał w źródłowym screenshot; na części widoków zwiększa diff i wymaga oceny par. Nie maskowano pikseli ani nie usuwano treści. [Wszystkie 38 par, geometria, priorytety i ścieżki](TASK-4E-VISUAL-AUDIT.md).

Regresja po wznowieniu: build i cb:build PASS z trzema ostrzeżeniami rozmiaru; LIVE 3/3, Autopilot 68/68, capture/konfiguracja/content schema 3/3; 38/38 renderów i porównań, 76 testów szerokości (320/768/1024/2048), 38 testów tekstu 200%, reflow 320 i odstępy tekstu bez poziomego overflow; 19 interakcji, 99 lokalnych URL-i HTTP 200; 37 dokumentów/35 załączników/43 linki zweryfikowane. Formularz: nieprawidłowe dane 422, pięć błędów pól, aria-invalid/opis i fokus pierwszego pola; prawidłowy test tylko do lokalnego sinka, bez poczty. Logi są w trwałym cache task4e/test-logs/, nie w /tmp.

Axe: 849 wystąpień reguł WCAG przed, 48 naprawionych, 801 pozostałych (794 kontrast + 7 link-in-text-block), osobno 74 best-practice heading-order. To wystąpienia węzłów w 38 widokach, nie 849 niezależnych błędów. CTA 2,708:1 i 2,530:1 nadal FAIL. Nie deklarujemy AA. [Audyt i selektory](TASK-4E-WCAG-AUDIT.md), [decyzje PM i propozycje kolorów](TASK-4E-PM-DECISIONS.md).

19/19 widoków ma autentyczną treść; 0/19 ma pełny zaakceptowany odbiór visual/WCAG. Pozostały dalsze dopasowanie i odbiór widocznych różnic, decyzje kolorów/etykiet/linków/Hx/deklaracji oraz manualny czytnik, zoom, kontrast na zdjęciach i audyt 35 PDF/DOCX/wideo. CB-05: brak 21 pełnych oryginałów galerii, miniatury autentyczne i działające; MEDIA=IN_PROGRESS. [Manifest do selektywnego pobrania](TASK-4E-GALLERY-ORIGINALS.json), bez konieczności nowego pełnego capture. Nie uruchamiano kolejnego workflow ani migracji dodatkowych stron.

Commit implementacji 4E: `aa49906` (lokalny). Raporty i dowody zapisane osobno; zdalny branch pozostaje na `6f1479c`, bez pushu.

## Aktualizacja 4F

Zakończono możliwe obecnie bezpieczne korekty banerów, archiwum, galerii miniaturek, kadry, tabel i semantyki. Aktualne 38 porównań i wyniki regresji: [TASK-4F](TASK-4F.md), [wizualne](TASK-4F-VISUAL.md), [WCAG](TASK-4F-WCAG.md). Treść 19 widoków pozostaje autentyczna; pełne zdjęcia galerii CB-05 nadal 0/21, wymagają zgody na ograniczony workflow. VISUAL_QA/WCAG_QA pozostają IN_PROGRESS. Bez pushu i wdrożenia. Pozostało 803 wystąpień WCAG (796 kontrastu, 7 linków) i 42 ostrzeżenia Hx; nie liczymy 32 usuniętych ostrzeżeń Hx jako naprawionych naruszeń kontrastu. [Wymagane decyzje](TASK-4F-PM-DECISIONS.md).
