# Moduły CB — cele, brakujące opcje i propozycje ACF

Podstawa: [PM-DECISIONS](PM-DECISIONS.md), [BRIEF](BRIEF.md),
[checklista QA](ACCEPTANCE-CHECKLIST.md). Status dotyczy specyfikacji;
żaden moduł nie został wdrożony w tym zadaniu. Poniższe pola są propozycją
do przeglądu przed utworzeniem ACF JSON, nie istniejącymi polami w motywie.
Nie uruchamiać importera i nie dodawać CPT bez analizy LIVE/danych.

## Moduły biznesowe w estymacji PM

| Moduł | Zakres / status | Zachowanie i brakujące dane |
| --- | --- | --- |
| Rekrutacja i lista podyplomowych | INCLUDED; cel potwierdzony, szczegóły danych do ustalenia | CB-10: otwarte oferty przed zamkniętymi, jawna etykieta statusu, zielony/szary po pomiarze kontrastu. Zamknięte oferty nadal czytelne i klikalne. Status nie blokuje dostępu do opisu. Ustalić źródło statusu i kolejność w grupach; bez domniemanych dat otwarcia/automatycznej synchronizacji. |
| Kadra na kierunkach | INCLUDED_NEEDS_SPEC | Zdjęcie i bio w zwykłej treści, nie tylko overlay na fotografii. Reużywalne osoby/relacje z kierunkami po ustaleniu danych. Slider był propozycją, nie zatwierdzoną formą; jeśli wybrany, podlega pełnym testom slidera. |
| Promocje globalne | INCLUDED_NEEDS_SPEC | Dwie niezależne grupy treści: licencjackie+magisterskie oraz podyplomowe. Aktualizacja źródła globalnego ma zmieniać powiązane oferty bez kopiowania tekstów. Ustalić przypisanie kierunków, daty, wiele promocji i ewentualne wyjątki; nie wymyślać reguł nadpisania. Topbar/popup nie zastępuje automatycznie sekcji promocji kierunku. |
| Sylabusy i programy | INCLUDED_NEEDS_SPEC | Cel prezentacyjny wg referencji UAM. Ustalić strukturę danych, roczniki, semestry/przedmioty, formaty plików, aktualizację i właściciela. Nie zakładać importu z UAM, Kalasoft ani API. Zachować obecne linki BIP. |
| Formularz ↔ Kalasoft | EXCLUDED; potwierdzenie użytkownika 2026-10-09, Q-13 RESOLVED | Aktualny brief wyłącza integrację. Specyfikacja/dostępy nie zostały przekazane; bez wykonywania połączeń lub wysyłania danych. |

Referencje odczytane 2026-10-09: [UAM — program z listami semestrów i zajęć](https://sylabus.amu.edu.pl/pl/19/4/7/12/137#nav-tab-info),
[obecna strona programów CB](https://www.cb.szczecin.pl/uczelnia/programy-studiow-i-sylabusy/).
To kontekst prezentacji, nie zatwierdzona specyfikacja danych lub dodatkowa pozycja CB.

## Propozycja pól ACF do przeglądu

Przed finalizacją porównać istniejące `acf-json/` i `functions/acf.php`.
Nazwy poniżej mogą wymagać dostosowania do wybranego modelu ofert/osób.
Lokalizacje warunkowe nie oznaczają zgody na tworzenie nowych typów wpisów.

| Nazwa pola | Field name | Typ | Wartość zwracana | Proponowana lokalizacja grupy |
| --- | --- | --- | --- | --- |
| Status rekrutacji | cb_admission_status | select | string: open/closed; brak wartości = nieustalony, nie zgadywać | Grupa oferty na stronach kierunków podyplomowych po ustaleniu modelu |
| Promocje licencjackie i magisterskie | cb_promotions_degree | WYSIWYG | string HTML | Osobna grupa CB w istniejących globalnych opcjach |
| Promocje podyplomowe | cb_promotions_postgraduate | WYSIWYG | string HTML | Ta sama grupa globalna, osobna zakładka |
| Grupa promocji oferty | cb_promotion_group | select | string: degree/postgraduate/none | Grupa oferty; jawne przypisanie bez zgadywania po URL |
| Imię i nazwisko osoby | cb_staff_name | text | string | Grupa osoby; lokalizacja po decyzji wspólna encja czy repeater |
| Zdjęcie osoby | cb_staff_photo | image | attachment ID | Ta sama grupa osoby |
| Biogram | cb_staff_bio | WYSIWYG | string HTML | Ta sama grupa osoby |
| Osoby na kierunku | cb_course_staff | relationship | array post IDs | Grupa oferty, tylko jeśli wybrano wspólne encje osób |
| Grafika dekoracyjna | cb_image_decorative | true_false | boolean | Moduły Flexible Content zawierające obrazy; nie nadpisuje ALT w bibliotece |
| Lista dokumentów | cb_documents | repeater | array wierszy | Moduł dokumentów Flexible Content |
| Nazwa dokumentu | cb_document_title | text | string | Wiersz cb_documents |
| Plik dokumentu | cb_document_file | file | attachment ID | Wiersz cb_documents; MIME i rozmiar z rzeczywistego pliku |
| Stan dostępności dokumentu | cb_document_accessibility | select | string: unverified/verified/alternative_required | Wiersz cb_documents; verified tylko z dowodem kontroli pliku |
| Alternatywny dostęp do treści | cb_document_alternative | link | array URL/title/target | Wiersz cb_documents, gdy wymagana alternatywa |
| Tytuł wideo/iframe | cb_embed_title | text | string | Moduł mediów Flexible Content |
| Transkrypcja | cb_media_transcript | WYSIWYG | string HTML | Moduł mediów; treść od właściciela materiału |
| Materiał z napisami/audiodeskrypcją | cb_media_accessible_version | link | array URL/title/target | Moduł mediów, gdy dotyczy; sam link nie dowodzi spełnienia kryteriów |

Schema sylabusów nie powstaje przed otrzymaniem specyfikacji. Dla plików
zewnętrznych MIME/rozmiar mogą być nieznane: zgłosić brak danych, nie wymyślać
metadanych i nie wyświetlać „dostępny” bez dowodów. Brak danych sekcji → brak HTML.
Lista ikon, galerie poprzednich lat, partnerzy, taby i kontakt pozostają modułami
istniejącej rodziny Flexible Content; ich pola ustalić z rzeczywistą kompozycją LIVE.

## Warunki akceptacji biznesowej

Rekrutacja: po zmianie statusu oferta trafia do właściwej grupy; etykieta jest
czytelna bez koloru, a źródłowy URL nie zmienia się. Promocje: zmiana globalnej
treści degree aktualizuje lic/mgr i nie zmienia podyplomowych, oraz odwrotnie;
test na rzeczywistych powiązanych stronach. Kadra: bio dostępne bez hover,
klawiaturą i z czytnika, relacja nie duplikuje treści. Sylabusy: odbiór dopiero
po specyfikacji i kontroli rzeczywistych danych/dokumentów, bez fałszywych integracji.
