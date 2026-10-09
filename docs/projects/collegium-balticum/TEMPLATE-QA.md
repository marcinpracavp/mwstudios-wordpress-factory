# Wyniki zadania 3 — kod, runtime i ograniczenia

Data: 2026-10-09. Rejestr wszystkich CB-00–CB-18: [tabela i analiza](TEMPLATE-REGISTER.md), [dane](TEMPLATE-REGISTER.json). Pola przedstawiono przed utworzeniem JSON w [ACF-SCHEMA](ACF-SCHEMA.md). Instrukcja edycji: [Virtual](VIRTUAL-TEMPLATES.md).

Zaimplementowano siedem rodzin stron, natywne archive/home/single oraz 13 modułów ACF. Kod jest wykonany i sprawdzony na realnym WordPressie; wygląd 1:1 CB nie jest jeszcze wykonany ani potwierdzony. Wszystkie 38 prób referencji źródła zakończyły się timeoutem nawigacji 15000 ms. Nie powstały PNG produkcji. Częściowy tekst web nie zastępuje geometrii ani stanów interakcji. CB-03 zwraca Internal Error, CB-07 ekran ochrony. Szczegółowe błędy dla każdego URL/viewportu: [REFERENCE-ACCESS](REFERENCE-ACCESS.json).

## Runtime i rzeczywiste rekordy testowe

Izolowany compose `factory-live-qa`, http://localhost:8000. Aktywny motyw factory oraz rzeczywisty ACF Pro 6.7.0.2 dostarczony przez użytkownika. Sześć nowych grup JSON jest ładowanych przez ACF. Reużyto logo, kontakt.form, section-image.php, własny grid/spacing/breakpointy i istniejący build. Naprawiono brak katalogu uploads wyłącznie w tej izolowanej instalacji; zapewniono zapis WP-CLI i serwera. Wtyczki nie dodawano do Git; żadnego klucza licencji nie zapisano w raportach.

`blog_public=0`. `permalink_structure` pozostaje pusty, zgodnie z zastanym stanem. Nie zmieniano slugów/parentów/kategorii istniejących rekordów ani ustawień permalinków. Dane testowe mają prefiks factory-qa, przykładowe adresy i jawne teksty QA. To nie są strony CB. Nie przypisano żadnego wymaganego URL do tych rekordów i nie zastąpiono adresów z briefu.

| Test szablonu | WP ID | Rzeczywisty URL QA |
| --- | --- | --- |
| Home (template-homepage) | 10 | http://localhost:8000/?page_id=10 |
| Basic | 11 | http://localhost:8000/?page_id=11 |
| Flexible / wszystkie moduły | 12 | http://localhost:8000/?page_id=12 |
| Banner + tile | 13 | http://localhost:8000/?page_id=13 |
| Banner + accordion / wiele slajdów | 14 | http://localhost:8000/?page_id=14 |
| Oferta | 15 | http://localhost:8000/?page_id=15 |
| Kontakt / dwa poziomy zakładek | 16 | http://localhost:8000/?page_id=16 |
| Puste dane | 17 | http://localhost:8000/?page_id=17 |
| Jeden obraz — statyczny baner | 18 | http://localhost:8000/?page_id=18 |
| Archiwum testowej kategorii | term:2 | http://localhost:8000/?cat=2 |
| Dynamiczny wpis testowy | 7 | http://localhost:8000/?p=7 |

CONTENT=TODO i TEMPLATE=IN_PROGRESS dla wszystkich CB. Query URLs w powyższej tabeli służą weryfikacji komponentów, nie dowodzą zachowania dokładnych ścieżek SEO CB. Na koniec etapu treści potrzebne będą rzeczywiste rekordy i właściwy routing; ten etap nie zmienił permalinków, nie importował Yoast i nie utworzył stron z wymaganej listy.

## Wykonane kontrole

- `npm run build`: exit 0, Webpack 5.100.2, trzy ostrzeżenia wielkości zasobów/entrypointów i wydajności; brak błędów kompilacji. Dist wygenerowany wyłącznie Webpackiem, bez edycji ręcznej; nie dodano zależności.
- PHP lint: 34 zmienione/dodane pliki PHP, PASS.
- `node tests/factory/content-schema.test.js`: PASS, unikalne klucze wszystkich pól/layoutów, return format ID/array, istniejące lokalizacje i 13 layoutów; brak danych klienta w schemacie, reużyty wybór formularza.
- `node tests/factory/content-browser.js`: PASS, 38 rzeczywistych renderów (9 wariantów × 4 szerokości + archive/single), 7 kontroli interakcji/reflow. Dodatkowo home przy ustawieniu latest posts i search mają pojedynczy H1. Bez JS treści zakładek i menu są dostępne.
- Szerokości 320/390/1440/2048 px, HTTP 200, jeden H1 i main, ALT obecne na obrazach fixture, 13 niepustych modułów, brak pustej sekcji, brak JS errors i poziomego overflow; sprawdzone nagłówki tabeli oraz open/unknown/closed, tel i mailto.
- Klawiatura: zagnieżdżone zakładki strzałki/Home/End, details Enter/Spacja, menu Enter/Spacja/Escape, skip link przenosi focus na main, slider Enter/strzałka i ukryte nieaktywne slajdy. Przypadki hero 0/1/wiele sprawdzone; 1 obraz bez kontrolek.
- Powiększenie bazowego tekstu 200% i odstępy tekstu przy 320 CSS px: PASS, 0 px overflow. Znaleziony problem z rosnącym gap grida naprawiono istniejącymi `gap-sm-0` i `row-gap-sm-200`; nie maskowano overflow.
- `npm run factory:live:test`: 3/3 PASS po uruchomieniu z dostępem do Chromium. W sandboxie browser launch/test był zablokowany; nie zapisano tego wyniku jako PASS.
- `node docs/projects/collegium-balticum/live-config.test.js`: 1/1 PASS, wszystkie 19 ścieżek i siedem viewportów pozostają w konfiguracji.
- `npm run factory:autopilot:test`: 21/21 PASS, regresja dotychczasowego trybu Figma/factory.
- `npm run factory:validate`: FACTORY VALID. `git diff --check`: PASS.

Wersjonowany wynik renderów i hashe PNG/build: [TEMPLATE-QA-EVIDENCE](TEMPLATE-QA-EVIDENCE.json). PNG/manifest fixture znajdują się w `.factory-cache/content-qa/` (cache ignorowany przez Git). Każdy full-page PNG wskazany w evidence istnieje lokalnie. Ujęcia dodatkowe kontaktu obejrzano ręcznie; to kontrola komponentu na danych QA, nie visual comparison z CB.

## Pozostałe dowody i decyzje

Brak PNG produkcji uniemożliwia porównanie designu, fontów, kolorów, proporcji, mobile i geometrii overlay. Neutralny SCSS komponentów jest baseline, nie zatwierdzoną paletą CB. Materiał do PM: [PM-TEMPLATE-REVIEW](PM-TEMPLATE-REVIEW.md). Nie wysłano wiadomości do PM i nie uzyskano akceptacji Hx/kolorów.

Nie potwierdzono pełnej zgodności WCAG: pozostają rzeczywisty czytnik, desktop zoom 400%, kontrast faktycznego CB i rzeczywiste stany/content/formularz. Formularz korzysta z istniejącego kontakt.form i adaptera aktywnej wtyczki (bez wtyczki nie generuje pustego formularza). Q-06/backend/zgody/błędy nadal wymagają danych; nie wysyłano formularzy ani danych do LIVE. Dokumenty/wideo z QA nie potwierdzają dostępności materiałów klienta.

Źródłowe ALT pozostają w bibliotece; dekoracje mają jawne alt="". Nie wymyślano brakujących ALT ani prywatnych metadanych Yoast. Brakujące opisy kierować do SEO. Nie wdrażano dodatkowych nieustalonych modeli kadry/promocji/sylabusów ani Kalasoft. Nie rejestrowano czasu w Toggl.

## Git i podział kodu

Silnik: branch `feature/factory-content-templates`, baza `3583a4d` (`feature/live-migration-tools`), commity `2741556` i `1672b6c`. Nie zawiera treści, adresów ani rejestru CB. Projekt: branch `project/collegium-balticum`, baza tego etapu `9fe829a`, commit kodu `ccffce3`; jego kod jest identyczny z końcowym kodem brancha silnika. Dokumentacja/adapter capture CB są zapisywane oddzielnym commitem projektu. Chroniony `autopilot-clean` pozostaje `0077847`. Bez push/deploymentu.

Pełna lista zmienionych plików: [TASK-3-FILES](TASK-3-FILES.md). Oryginalne PDF/DOCX użytkownika pozostają nieśledzone i niezmienione.
