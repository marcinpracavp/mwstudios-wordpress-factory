# CB — gotowość po naprawie 3A

**Środowisko i działające rodziny szablonów są gotowe do rozpoczęcia zadania 4.** Produkcja pozostaje nieosiągalna z tego Codespace; problem został dokładnie udokumentowany zgodnie z dopuszczonym kryterium zadania 3A. Wierne odwzorowanie designu i porównanie wizualne pozostają BLOCKED do dostarczenia referencji lub przywrócenia połączenia. Nie rozpoczęto masowego tworzenia stron CB. Żadna konkretna strona nie ma CONTENT=DONE ani VISUAL_QA=DONE.

Dowody: [diagnostyka](TASK-3A-DIAGNOSTICS.md), [wszystkie 19 pozycji i sześć statusów](TASK-3A-REGISTER.md), [wyniki i hashe screenshotów](TASK-3A-EVIDENCE.json), [wymagane materiały ręczne](TASK-3A-MANUAL-REFERENCES.md).

## Co naprawiono

- Capture zapisuje etap awarii, wydarzenia DOM/load, konsolę i niezakończone żądania. Odrzuca pusty HTML i strony wyzwania dostępu bez tworzenia fałszywej referencji. Dwa równoległe capture zamiast trzech; historyczne dowody zachowano.
- `template-blog.php` używa wspólnego archiwum/kart. Paginacja respektuje paged/page, ma nazwaną nawigację i czytelne linki; sprawdzono przejście na następną stronę.
- Idempotentny `preview-setup.php` tworzy katalog podglądów, stronę bloga i dane stopki QA, a stronę główną pokazuje przez front-page.php. Zapisuje poprzednie opcje frontu i stopki do ewentualnego przywrócenia. Nie importuje CB i nie duplikuje stron.
- Naprawiono odczyt pustego logo na ekranie logowania; URL jest escapowany, domyślne logo pozostaje dostępne.
- Dodano komendy CB do właściwej instancji Docker oraz właściwy URL developmentu. ACF Pro działa i ma zapisane pola z wersjonowanego JSON. Żadnego sekretu lub pakietu wtyczki nie dodano do repo.

## Podglądy

Port WordPress: **8000**, URL http://localhost:8000. Otwórz przekierowanie portu 8000 w Codespace. Docker obsługuje forwarded host/proto; zachowaj prywatność tego podglądu. Katalog: **http://localhost:8000/?page_id=22**. Homepage: **http://localhost:8000/**. Blog jako strona: **http://localhost:8000/?page_id=21**. Pozostałe odnośniki znajdują się w katalogu i rejestrze.

Wszystkie dane są oznaczone QA. Style to działający baseline factory, nie potwierdzony skin CB. Oryginalne fonty, geometria, media i kolory CB wymagają źródeł. Nie wprowadzono zgadywanego redesignu ani zmian źródłowych Hx.

| Element | PHP i rendering | SCSS | JS | ACF JSON / dane | Wynik |
|---|---|---|---|---|---|
| Globalny header i menu | header.php, partials/header.php; wszystkie widoki | _factory-content.scss | factory-content.js | istniejące logo options; WP menu header/utility/lang | DONE dla QA; menu klawiaturowe/mobile/Escape |
| Footer | footer.php, partials/footer.php; wszystkie widoki | _factory-content.scss | brak | group_mwf_footer.json | DONE dla QA; kolumny, linki, testowy link deklaracji |
| Homepage | front-page.php, template-homepage.php → factory/page.php | _factory-content.scss | slider/tabs wspólne | group_mwf_page.json | DONE dla rodziny; root sprawdzony |
| Kontakt | template-contact.php → factory/page.php, contact-cities.php, contacts.php | _factory-content.scss | wspólne zagnieżdżone tabs | group_mwf_mwf_contact_cities.json, group_mwf_page.json; istniejące kontakt.form | DONE dla danych kontaktu; backend/formularz Q-06 BLOCKED |
| Blog archive i strona bloga | home.php/archive.php/template-blog.php → factory/archive.php + blog-item.php | _factory-content.scss | brak | native WP posts/categories; tytuł strony edytowalny | DONE dla QA; daty/karty/paginacja |
| Blog single | single.php → the_content/featured image | _factory-content.scss | brak | native WP title/content/thumbnail, istniejąca integracja SEO bez importu metadanych | DONE dla QA; H1, listy, cytat, treść |
| Basic | template-basic.php → factory/page.php | _factory-content.scss | tylko moduły opcjonalne | group_mwf_page.json, group_mwf_mwf_content.json | DONE dla rodziny |
| Flexible | template-flexible.php → factory/page.php/section.php | _factory-content.scss; istniejące grid/spacing | factory-content.js | group_mwf_page.json, 13 layoutów | DONE dla rodziny |
| Banner + overlay | template-banner-tile.php → factory/page.php + hero.php | _factory-content.scss | wspólny slider, gdy wiele obrazów | group_mwf_page.json, group_mwf_mwf_overlay.json | DONE dla rodziny; QA kafla |
| Banner/slider + accordion | template-banner-accordion.php → hero.php/section.php | _factory-content.scss | factory-content.js; native details | group_mwf_page.json | DONE dla rodziny; pojedynczy obraz bez kontrolek |
| Oferta studiów | template-course.php → factory/course.php/page.php | _factory-content.scss | współdzielone moduły | group_mwf_mwf_course.json, group_mwf_page.json | DONE dla rodziny; fakty/CTA |
| WYSIWYG, 50/50, kafle, CTA, accordion, tabs, table, gallery, media, contact, partners, documents, news | factory/section.php; istniejące section-image.php; factory/tabs.php/documents.php/news.php | _factory-content.scss + istniejące section-image/grid/spacing | wspólny factory-content.js | 13 layoutów group_mwf_page.json | DONE dla QA; moduły puste pomijane |

Ścieżki SCSS: `src/css/components/`, JS: `src/js/`, partiale factory: `partials/factory/`, ACF: `acf-json/`. Nie ma dziesięciu dodatkowych osobnych szablonów. CB-09–CB-18 zachowują przypisania do wspólnych rodzin i modułów.

## Testy i screenshoty

- Adapter LIVE: **3/3**, realne lokalne fixture HTTP/Chromium, nie example.com. Testuje również HTTP 404, redirect, challenge, pusty HTML, hanging fetch, diff, repeat/frozen hash.
- Konfiguracja CB **1/1**, schema ACF **1/1**, Autopilot **21/21**, factory validation **FACTORY VALID**.
- Build **exit 0**, Webpack **3 ostrzeżenia** wielkości assetów/entrypoint/performance. Bez ręcznych zmian dist.
- PHP lint **55 plików**, bez błędów. Sprawdzone odpowiedzi/logi WP bez błędów PHP. CSS/JS w podglądach HTTP 200, bez pageerror.
- **38** renderów WP dla rodzin (320/390/1440/2048 + natywne widoki bloga), **7** kontroli interakcji: menu/skip/focus, tabs zagnieżdżone, accordiony klawiaturowe, slider, no-JS, reflow powiększonego tekstu. Nie jest to pełny audyt WCAG.
- **10** dodatkowych renderów: root front-page, strona bloga, hub, archive, single, każdy 390 i 1440; sprawdzono paginację. Brak poziomego overflow w testowanych widokach.
- **47 lokalnych PNG** w `.factory-cache/content-qa/`: 36 rodzin, 10 dodatkowych, 1 text-spacing. Pełna lista z SHA256 w EVIDENCE. Przykłady: `front-page-390.png`, `front-page-1440.png`, `banner-tile-390.png`, `contact-390.png`, `archive-1440.png`, `single-390.png`, `hub-1440.png`.
- **0 produkcyjnych PNG CB**; 38 błędów nawigacji, nie akceptowane screenshoty. HTTP nieosiągnięte. Bez realnych referencji nie wykonano porównania konstrukcji z CB.
- Powtórzony setup zachowuje liczbę stron; posts_per_page przywrócono do 10 po teście paginacji. Struktury permalinków nie zmieniono.

## Git

Aktywny branch: **project/collegium-balticum**. Początek naprawy: **7e08de1**, już zawierał **8d1de82**, **9fe829a**, **ccffce3** i wszystkie zmiany zadania 3. **3583a4d** jest obecny na feature/live-migration-tools; klient ma równoważny adapter w 8d1de82 (diff plików adaptera pusty). Nie wykonano destrukcyjnego resetu ani zbędnego merge.

Uniwersalne naprawy: **512af43**, **9fc3acc** na branchu klienta; równoważne cherry-picki **80806b8**, **e3e953e** na **feature/factory-content-templates**. Wspólne pliki porównano bez różnic. Chroniony **autopilot-clean** pozostaje **0077847**. Projektowy runtime, capture i dowody są w osobnym commicie klienta opisanym w końcowym wyniku/git log. Bez push. Dostarczone DOCX i PDF pozostawiono nietknięte i poza commitami.

## Komendy do kontynuacji

```bash
npm run cb:wp -- theme list --status=active
npm run cb:wp -- plugin list --status=active
npm run cb:preview
npm run cb:dev
npm run cb:diagnose
npm run cb:capture
npm run build
npm run factory:live:test
npm run factory:autopilot:test
node --test docs/projects/collegium-balticum/live-config.test.js tests/factory/content-schema.test.js
node tests/factory/content-browser.js
node tests/factory/preview-browser.js
```

`cb:dev` uruchamia istniejący dev:watch i pojedynczy BrowserSync. `cb:preview` wymaga już zainstalowanego ACF Pro oraz noindex WP. Build i capture nie instalują prywatnych wtyczek. Logi kontroli w `.factory-cache/content-qa/task-3a-logs/`, diagnostyczne logi terminala również `/tmp/cb3a-*.log`. Wszystkie screenshoty są lokalnymi artefaktami cache, nie plikami produkcyjnymi ani substytutem referencji CB.

## Działania nadal potrzebne

1. **Do wizualnej implementacji:** dostarczyć 38 PNG z dokładnych URL/viewportów z MANUAL-REFERENCES i oryginalne media/fonty lub przywrócić połączenie Codespace–CB. To blokuje wierne odwzorowanie i VISUAL_QA, nie uruchomienie działającego środowiska.
2. **Do importu i wypełnienia:** eksport stron/wpisów/kategorii/media/ALT/Yoast (Q-04). Brakujące ALT przekazać SEO, nie zgadywać. Przy tworzeniu tras zadania 4 skonfigurować routing z dokładnymi ścieżkami z rejestru i sprawdzić wszystkie 19 URL.
3. **Do formularza kontaktu:** potwierdzić backend, konfigurację zgód/walidacji i testów wysyłek (Q-06). Niezależne podstrony można realizować wcześniej.
4. PM musi zaakceptować istotne korekty kolorów i istniejących Hx (Q-10, PM-TEMPLATE-REVIEW.md). Nie wysłano wiadomości do PM i nie udawano akceptacji. Pozostałe rozszerzenia Q-07/Q-08/Q-09/Q-15 zachowują dotychczasowy status, nie blokują modułów podstawowych.

Zadanie 4 nie zostało rozpoczęte. Gotowość techniczna tego etapu nie oznacza ukończenia wizualnych szablonów CB ani treści.

Smoke developmentu: `npm run cb:dev` uruchomiono; istniejący plugin Webpack wskazał **http://localhost:3050** (nie 3000), proxy **http://localhost:8000**. HTTP 200 z portu 3050 zawierał Factory QA — home i Stopka QA. Watcher następnie zatrzymano, a assety przywrócono przez produkcyjny `npm run build`. Jeśli korzystasz z BrowserSync, przekieruj port 3050; podstawowy WordPress pozostaje na porcie 8000.
