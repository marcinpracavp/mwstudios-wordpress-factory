# Collegium Balticum — obowiązujący brief migracji

Źródło: [witryna produkcyjna](https://www.cb.szczecin.pl/).
Brief przekazany przez użytkownika w zadaniu 1/5, zapisany 2026-10-09.
Repo: https://github.com/marcinpracavp/mwstudios-wordpress-factory/tree/autopilot-clean.
To bazowy Figma Autopilot z firmowym WordPress factory, nie istniejąca
implementacja CB. Nie wolno odziedziczyć wniosków ani treści wcześniejszego projektu.

## Cel i nowy tryb

Przystosować obecnego Figma Autopilota do uniwersalnej migracji istniejących
witryn produkcyjnych na WordPress factory z odwzorowaniem designu możliwie 1:1.
Zachować działający tryb Figma, architekturę factory, komponenty i ACF.
Proces: LIVE URL → analiza produkcji → identyfikacja szablonów → implementacja
na factory → ACF Pro → porównanie wizualne → poprawki → WCAG/SEO/QA.
CB jest pierwszym projektem; kolejny klient ma podać inny URL i brief,
bez przepisywania silnika. Wspólny workflow: [WORKFLOW](../../live-migration/WORKFLOW.md).

Projekt CB: migracja obecnej witryny na firmowy motyw WordPress z zachowaniem
wyglądu, struktury i funkcjonalności oraz dostosowaniem do WCAG 2.1 AA.
Nie wykonujemy redesignu.

## Zakres obowiązkowy

- Strona główna, kontakt, blog — archiwum/lista oraz dynamiczny pojedynczy wpis.
- Wszystkie 15 konkretnie wskazanych podstron CB, bez zastępowania innymi.
- Uniwersalne szablony i komponenty ACF umożliwiające Virtual przeniesienie reszty.
- Globalny header, nawigacja i footer; responsywność do 2K.
- Poprawki dostępności, zachowanie URL i SEO.

Pełna lista i dokładne adresy CB-00–CB-18 znajdują się w [PAGES](PAGES.md).
Kontakt i archiwum ustalono na podstawie produkcyjnych linków; wpis jest wyłącznie
przykładem weryfikacji dynamicznego szablonu, nie statyczną implementacją jednego artykułu.
Dla każdej pozycji prowadzić dwa oddzielne statusy TEMPLATE i CONTENT.
TEMPLATE=DONE nigdy nie oznacza CONTENT=DONE. Nie oznaczać strony jako gotowej,
dopóki nie istnieje lokalny URL z właściwym układem i treścią oraz dowody kontroli.

Estymacja mówi o około 8–12 szablonach/wariantach i około 8–12 podstronach
wprowadzanych przez developera. Szczegółowy brief wymienia 15 podstron oraz
stronę główną, kontakt i widoki bloga (19 pozycji rejestru). To ryzyko zakresu
do zatwierdzenia PM, nie zgoda na usunięcie adresów. Przygotować architekturę
i rejestr implementacji dla wszystkich pozycji. Nie istnieje zasada wyboru
dowolnych 8–12 stron. Szczegóły: [SCOPE](SCOPE.md).

## Rodziny uniwersalnych układów dla Virtual

1. Hero + WYSIWYG + opcjonalne CTA.
2. Elastyczny szablon modułowy z ACF Flexible Content.
3. Hero/banner z nakładanym kaflem.
4. Banner lub slider + treść + accordiony.
5. Tekst + grafika 50/50, również naprzemiennie.
6. Kafle, galerie, dokumenty, wideo/iframe, zakładki, tabele, partnerzy,
   dane kontaktowe jako moduły elastycznego szablonu, jeżeli potrzebne.

To rodziny układów, nie nakaz osobnego PHP dla każdej odmiany. Wszystkie komponenty
muszą być reużywalne na kolejnych podstronach tworzonych przez Virtual.
Przed nowym partialem sprawdzić `partials/`, szczególnie `section-image.php`,
oraz istniejący grid, spacing, breakpointy i moduły JS. Różnice kolorów,
odstępów lub proporcji najpierw obsługiwać argumentami i klasami.

## Technologia i edycja

Istniejący WordPress factory, ACF Pro, ACF JSON, PHP, CSS/SCSS i JavaScript
zgodne z obecną architekturą. Edytowalne treści, obrazy, linki, nagłówki,
CTA i sekcje. Ustawienia globalne tam, gdzie uzasadnione. Bez pustych sekcji
HTML; optymalizacja obrazów i zasobów; minimalna liczba nowych zależności.
Bez Elementora, React/Tailwind jako finalnej implementacji i alternatywnego
page buildera. Nie edytować ręcznie `dist/`.

Przed nowymi polami ACF przedstawić nazwę pola (label), field name, typ,
wartość zwracaną i lokalizację grupy. Najpierw sprawdzić istniejące `acf-json/`.
PHP: tekst `esc_html`, atrybuty `esc_attr`, URL `esc_url`, WYSIWYG `wp_kses_post`,
obrazy `wp_get_attachment_image`, partiale `get_template_part`.
Bez hardkodowanych upload URL; jeden logiczny H1; treści WYSIWYG zachowują HTML.
Interakcje korzystają ze wspólnych modułów, bez inline JS w PHP; inicjalizacja
sprawdza istnienie elementów. Nie dodawać animacji automatycznie.

## WCAG 2.1 AA

Audyt z czerwca 2025:
[Google Drive](https://drive.google.com/file/d/11Hksqz7c0QNmWQG45Anqp_F-b5Ye0VlU/view).
Próba odczytu 2026-10-09 przez narzędzie web zakończyła się `Internal Error`.
Nie uzyskano treści dokumentu; audyt NIE został przeczytany. Powód dostępu
nie jest potwierdzony. Potrzebny dostęp lub kopia, zapisane w [OPEN-QUESTIONS](OPEN-QUESTIONS.md).

Obowiązuje niezależnie od dostępności audytu:

- Semantyczny HTML, skip link, poprawne landmarki i logiczna hierarchia nagłówków.
- Klawiatura, dostępne menu/podmenu i widoczny focus.
- Etykiety formularzy i komunikaty błędów.
- Dostępne accordiony i slidery; slider wyłączony przy jednym obrazie.
- Poprawne ALT, rozróżnienie dekoracji, czytelne linki, dostępne tabele i pliki.
- Kontrast tekstu zwykłego ≥4.5:1, dużego ≥3:1, wymaganych elementów nietekstowych ≥3:1.
- Reflow przy 320 CSS px, powiększenie tekstu 200%, uwzględnienie zoomu 400%.
- `prefers-reduced-motion`; sticky header nie zasłania treści ani focusu.

Korekty kontrastu mają możliwie najmniej ingerować w design. Istotne zmiany
kolorystyki zgłosić PM do akceptacji. Nie dodawać ARIA, gdy wystarcza natywny HTML.
Nie deklarować pełnej zgodności bez właściwego audytu i dowodów.

## SEO

- Zachować ścieżki URL, hierarchię podstron, strukturę bloga i kategorii.
- Zachować dotychczasowe ALT, jeśli dostępne. Brakujące ALT uzupełnia osoba
  odpowiedzialna za SEO; agent nie wymyśla opisów.
- Zachować metadane Yoast SEO; sprawdzić możliwości eksportu/importu na
  rzeczywistej instalacji, bez obietnicy pełnego odtworzenia z publicznego HTML.
- Zachować istniejącą strukturę Hx, chyba że wymaga korekty dostępności.
  Zmiany istniejącej struktury wymagają konsultacji z klientem/PM; nagłówki edytowalne.
- Nie indeksować środowiska developerskiego.

## Dodatkowe funkcjonalności w architekturze

Globalne promocje/komunikaty używane na wielu podstronach. Status rekrutacji
dla odpowiednich ofert i sortowanie, jeśli potwierdzono zakres. Kadra/biogramy
i relacje z kierunkami, jeśli potwierdzono zakres. Prezentacja sylabusów wymaga
specyfikacji danych — nie wymyślać integracji ani API. Niepotwierdzone moduły
nie blokują implementacji niezależnych obowiązkowych stron.

## Wyłączenia

Nie integrować Kalasoft. Nie modyfikować BIP, e-Dziekanatu ani zewnętrznej
platformy e-learningowej. Nie poprawiać kodu zewnętrznych systemów i embedów,
nad którymi nie mamy kontroli. Zachować istniejące linki do tych systemów.
Nie migrować całych około 300 stron i około 1000 wpisów. Nie budować factory od zera.

## Organizacja i zadanie 1/5

Szacunek: 110 h developmentu i osobno około 40 h Virtual. Czas ewidencjonować
w Toggl; bez dostępu nie twierdzić, że ewidencja jest automatyczna. W tym zadaniu
nie uzyskano dostępu do Toggl i nie zapisano czasu. Sygnalizować przekroczenie zakresu.

Zadanie teraz: sprawdzić strukturę, AGENTS, README i instrukcje Autopilota;
ustalić Figma, factory, ACF, build i środowisko; zachować funkcjonalność;
trwale zapisać pełny brief i rejestr wszystkich adresów; utworzyć instrukcje
LIVE oraz minimalny plan rzeczywistych zmian silnika; zaktualizować AGENTS.
Utworzyć nowe osobne branche Autopilota i CB, nie edytować `autopilot-clean`.
Wykonać zmiany w repo, nie tylko przedstawić plan.

Warunki końcowe zadania 1: pełny brief, CB-00–CB-18, brak dowolnego wyboru
8–12 stron, uniwersalny silnik oddzielony od klienta, wskazane realne pliki
i mechanizmy rozszerzenia, brak destrukcyjnych zmian factory. Raport zawiera
listę zmian, fakty o repo, wyniki Git i następne kroki. To nie jest jeszcze
zlecenie wdrożenia witryny lub całego działającego adaptera LIVE.
