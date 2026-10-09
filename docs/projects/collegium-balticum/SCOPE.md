# Zakres, odpowiedzialność i ryzyka CB

Obowiązują [BRIEF](BRIEF.md), komplet [PAGES](PAGES.md),
[PM-DECISIONS](PM-DECISIONS.md), [MODULES](MODULES.md) i
[ACCEPTANCE-CHECKLIST](ACCEPTANCE-CHECKLIST.md).

## Rozbieżność do decyzji PM

Estymacja: około 8–12 rodzin/wariantów i około 8–12 stron wprowadzanych przez
developera. Lista imienna: 15 podstron + home + kontakt + archiwum + dynamiczny
wpis = 19 pozycji. Wpis to dynamiczny szablon z rekordem do weryfikacji,
archiwum to widok danych; 19 pozycji nie oznacza 19 osobnych plików PHP.
Rozbieżność liczby konkretnych stron względem estymacji pozostaje ryzykiem
nakładu i terminu. Status akceptacji PM: PENDING, bez domniemanej zgody.

PM powinien potwierdzić finansowanie/termin oraz odpowiedzialność za wypełnienie
wszystkich obowiązkowych stron. Do decyzji pełna lista pozostaje obowiązująca;
nie wybierać dowolnych 8–12, nie zamieniać adresów, nie redukować rejestru.
Propozycje zmian zakresu wymagają jawnej decyzji PM, zapisanej z datą i uzasadnieniem.

## Podział pracy

Developer: wspólne elementy, wymagane widoki i wskazane podstrony, ACF Pro/JSON,
reużywalne moduły, importer ograniczony do zakresu, RWD do 2K, WCAG/SEO/QA
i dokumentacja przekazania Virtual. Szacunek 110 h.
Virtual: pozostała migracja na przekazanych szablonach/modułach, około 40 h osobno.
Lista stron spoza rejestru do pracy Virtual wymaga osobnego ustalenia; nie
oznaczać jej jako wykonanej przez developera ani uruchamiać pełnego crawl/importu.
SEO: brakujące ALT i źródła metadanych. PM/klient: zakres, istotne kolory i zmiany Hx.

## Proponowana architektura (przed pełną analizą LIVE)

Home, kontakt, natywne archiwum kategorii i dynamiczny wpis mają osobne role
WordPress. Pozostałe strony mapować na rodziny: hero/WYSIWYG/CTA, modułowe
Flexible Content, banner z kaflem, banner/slider/accordiony i tekst/grafika 50/50.
Kafle, galerie, pliki, media/iframe, taby, tabele, partnerzy i dane kontaktowe
są reużywalnymi modułami według potrzeb, nie osobnymi builderami.
Nie przypisano ostatecznych rodzin stronom bez ich analizy.
Reużyć istniejące `partials/section-image.php`, `hero.php`, `blog-item.php`,
header/footer/menu, globalne opcje i wspólne moduły JS po kontroli semantyki.
Nie zakładać, że istniejące partiale są już zgodne z CB/WCAG.

Promocje/komunikaty: najpierw sprawdzić globalne ustawienia topbar/popup.
PM potwierdził dodatkowe funkcje w 110 h: nabór i sortowanie podyplomowych,
foto/bio kadry, globalne promocje w dwóch grupach oraz nową prezentację sylabusów.
Cel naboru/sortowania jest potwierdzony; model danych i kolejność w grupach
pozostają do ustalenia. Kadra/promocje/sylabusy wymagają szczegółowej specyfikacji,
nie ponownej zgody na sam cel. Nie tworzyć integracji bez danych.
Kalasoft nadal wyłączony, potwierdzone przez użytkownika 2026-10-09.
Niezależne strony wymagane pozostają możliwe do wdrożenia.

## Ryzyka i ograniczenia

| Ryzyko | Stan i działanie |
| --- | --- |
| 8–12 stron vs lista 19 widoków | Decyzja PM oczekiwana; zachować pełny rejestr. |
| Audyt czerwiec 2025 | Odczytano 83 strony dostarczonego PDF; wymagania zapisane w ACCEPTANCE-CHECKLIST. Nie przeprowadzono jeszcze napraw ani bieżącego audytu. |
| Blog a szersze aktualności | Potwierdzone dwa różne archiwa; ustalić podwidoki/kategorie bez zastępowania CB-02. |
| Yoast/ALT/treści prywatne | Wymagają eksportu/dostępu; HTML publiczny nie jest pełnym backupem SEO. |
| LIVE zmienia się podczas implementacji | Zamrozić snapshot z datą i stanami; jawnie raportować zmienne treści. |
| Routing Docker używa URL query | Zapewnić poprawne rewrite i zachowanie zagnieżdżonych permalinków w LIVE. |
| ACF Pro i działające WP | Konfiguracja capability nie dowodzi aktywnej licencjonowanej wtyczki ani dostępnego runtime. |
| Design vs WCAG/Hx | Minimalne poprawki, konsultacje wymagane przez brief i dowody decyzji. |
| Moduły dodatkowe w 110 h | PM potwierdza cele, specyfikacja części niepełna; monitorować ryzyko czasu zamiast wyłączać je z budżetu. |
| Dokumenty/wideo/deklaracja | Przypisać właściciela treści, napisy, dostępne pliki i formalną deklarację; nie obiecywać zgodności całej biblioteki. |
| Języki/formularze | Doprecyzować wtyczki, wersje językowe i testy; Kalasoft wyłączony. |
| Toggl | Brak dostępu i wpisu czasu; ewidencja ręczna przez zespół. |

Wyłączone: Kalasoft, zmiany BIP/e-Dziekanat/e-learning, naprawy zewnętrznych
systemów/embedów, pełne około 300 stron/1000 wpisów, przebudowa factory.
Linki zewnętrzne pozostają. Środowisko dev ma być nieindeksowane.
