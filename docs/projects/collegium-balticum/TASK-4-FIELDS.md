# Pola migracji CB — struktura przed implementacją

Pola dotyczą wyłącznie stron oznaczonych identyfikatorem CB i natywnych wpisów CB. Istniejące grupy factory pozostają dostępne.

| Label | Field name | Typ / return format | Lokalizacja |
| --- | --- | --- | --- |
| Sekcje Collegium Balticum | cb_sections | flexible_content / tablica; treść, baner, karty, accordion, zakładki | strony i wpisy CB |
| Nazwa sekcji | label | text / string | każdy layout |
| Treść | body | wysiwyg / HTML | treść i zakładki; zachowane struktury źródłowe |
| Układ źródłowy | variant | text / string, techniczny readonly | każdy layout |
| Odstęp po sekcji | space_after | number / px | każdy layout |
| Slajdy / pytania | items | repeater / tablica | baner / accordion |
| Treść slajdu / odpowiedź | body | wysiwyg / HTML | items |
| Nagłówek pytania | title | text / string | accordion items |
| Grupy kart | groups | repeater / tablica | carousel |
| Karty | items | repeater / tablica | groups; WYSIWYG zachowuje zdjęcia z Media Library |
| Obraz / odnośnik | image / link | image / ID; link / array | slajdy i karty, opcjonalnie przy edycji |
| Nagłówek / stopka | cb_header / cb_footer | wysiwyg / HTML | opcje CB, dane pochodzące z capture |

WYSIWYG zawiera obrazy zaimportowane do biblioteki mediów. Elementy interaktywne renderuje wspólny komponent, nie skrypty źródłowe. Struktura kategorii i wpisy są natywnymi danymi WordPress. Status treści wymaga osobnej weryfikacji po imporcie.

Doprecyzowanie po porównaniu: `cb_leading_space` — „Odstęp przed pierwszą sekcją”, number, px 0–200, grupa stron/wpisów CB; zachowuje rzeczywiste spacery poprzedzające pierwszy blok bez tworzenia pustych sekcji. `initial_desktop/mobile` — number, pierwszy slajd wynikający z pozycji obrazu w referencyjnym DOM. Nagłówki pytań mają typ WYSIWYG, aby redaktor nie edytował ręcznie HTML.

Istniejąca grupa `cb_sections` ma również lokalizację `acf-options-opcje-globalne`: sekcje nagłówkowe archiwum bloga są edytowalne w opcjach globalnych. Karty, tytuły wpisów, daty i kategorie pozostają natywnymi danymi WordPress.

„Otwarty przy wejściu” / `initially_open` / true_false, boolean / pozycja akordeonu. Import ustala wartość na podstawie rzeczywistej widoczności obrazów w zapisanym DOM, a nie fikcyjnej zawartości.
