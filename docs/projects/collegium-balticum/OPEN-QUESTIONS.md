# Otwarte pytania i decyzje CB

Aktualizacja 2026-10-09 po odczycie załączników i korespondencji PM.
Zamknięte kwestie oznaczono w tabeli; pozostałe wymagają wskazanych danych.
Brak odpowiedzi nie jest zgodą. Niezależną pracę kontynuować.

| ID | Pytanie / wymagane dane | Odpowiedzialny | Wpływ |
| --- | --- | --- | --- |
| Q-01 | Budżet 110 h / 40 h i podział pracy potwierdzone w korespondencji PM. Nadal rozstrzygnąć 15 podstron + widoki względem wcześniejszych 8–12 oraz aktualny termin i rok. | PM | PARTIALLY_RESOLVED; pełny rejestr pozostaje. |
| Q-02 | Dostarczono PDF; odczytano tekst wszystkich 83 stron, badanie 16–24.06.2025. | Użytkownik | RESOLVED dla dostępu do treści, bez deklaracji wykonania napraw. |
| Q-03 | CB-02 to blog `/category/wpisy/blog-post/`; potwierdzić zakres wspólnego archiwum `/category/wpisy/`, aktualności, wydarzeń, wyszukiwania i paginacji. | PM/klient | Architektura zachowuje kategorie; brak zgody na masowy import. |
| Q-04 | Dostarczyć zakres eksportu pages/posts/terms/media oraz danych Yoast/ALT i potwierdzić metodę eksport/import na rzeczywistej instalacji. | Klient/SEO | Metadane prywatne i ręczne overrides; bez dostępu brak obietnicy kompletności. |
| Q-05 | Ustalić języki i tłumaczenia. LIVE ma linki UA/EN, ale factory skonfigurowane tylko PL; potwierdzić użycie Polylang. | PM/klient | Nie instalować ani nie włączać automatycznie Polylang. |
| Q-06 | Potwierdzić formularze kontaktowe, backend/wtyczkę, zgody, walidację i zasady testowych wysyłek. | PM/klient | Nie zakładać CF7 i nie wysyłać danych na produkcję. |
| Q-07 | Cel statusów i sortowania CB-10 potwierdzony przez PM; ustalić źródło statusów, ręczne/daty i kolejność wewnątrz grup. | PM/klient | INCLUDED_NEEDS_DATA; otwarte wyżej, zamknięte niżej, czytelna etykieta. |
| Q-08 | Kadra/foto/bio w 110 h potwierdzone przez PM; ustalić wspólne osoby/relacje, formę prezentacji i przekazać dane. | PM/klient | INCLUDED_NEEDS_SPEC; slider/CPT nie są automatycznie zaakceptowane. |
| Q-09 | Prezentacja sylabusów w 110 h potwierdzona przez PM; dostarczyć format, roczniki, semestry/przedmioty, dane, aktualizację i właściciela. | PM/klient | INCLUDED_NEEDS_SPEC; UAM referencją UI, nie API; zachować linki BIP. |
| Q-10 | PM potwierdza wyliczenie kontrastów i wymagane korekty; ustalić akceptującego istotne zmiany wyglądu/Hx i zapis decyzji. | PM/klient | Pomiar wykonuje dev; konsultacje istniejących Hx/istotnych kolorów nadal wymagane. |
| Q-11 | Potwierdzić lokalny WordPress/URL, działającą bazę, licencjonowany ACF Pro i ochronę/noindex dev. | Developer/PM | Wymagane przed wdrożeniem i rzeczywistym QA, nie do dokumentacji. |
| Q-12 | Zapewnić dostęp/projekt Toggl albo potwierdzić ręczne wpisy czasu przez zespół. | PM | Nie wykonano automatycznej ewidencji. |
| Q-13 | Użytkownik potwierdził 2026-10-09 pozostawienie wyłączenia Kalasoft. | Użytkownik | RESOLVED: EXCLUDED; historyczna korespondencja nie włącza integracji. |
| Q-14 | Kto przygotuje/zweryfikuje treść deklaracji dostępności, daty, status i identyfikatory a11y-* oraz dostępne PDF/DOCX, napisy i audiodeskrypcję? | PM/klient/Virtual | Link w stopce wymagany; dodatkowa strona i remediacja materiałów nie rozszerzają automatycznie rejestru CB. |
| Q-15 | Promocje w 110 h: potwierdzić przypisania grup lic+mgr/podyplomowe, daty, wiele promocji i wyjątki. | PM/klient | INCLUDED_NEEDS_SPEC; dwie grupy globalne, bez zgadywania nadpisania. |

Dokument audytu: https://drive.google.com/file/d/11Hksqz7c0QNmWQG45Anqp_F-b5Ye0VlU/view.
Wyniki prób i fakty środowiska: [REPOSITORY-AUDIT](REPOSITORY-AUDIT.md).
Decyzje dopisywać tutaj z datą, osobą, treścią i wpływem na BRIEF/SCOPE/PAGES.

## Dowody po zadaniu 3

Q-11: izolowany WP http://localhost:8000, noindex blog_public=0, aktywny motyw i dostarczony przez użytkownika ACF Pro 6.7.0.2 potwierdzone runtime. Nie potwierdzono osobnej instalacji LocalWP ani dokładnych lokalnych tras CB; istnieją wyłącznie jawne dane QA. Q-06/Q-07/Q-10 pozostają otwarte; materiał do decyzji: [PM-TEMPLATE-REVIEW](PM-TEMPLATE-REVIEW.md). Wszystkie 38 prób referencji LIVE zablokowane timeoutem; [REFERENCE-ACCESS](REFERENCE-ACCESS.json).

## Dowody po naprawie 3A

Q-11 potwierdzono ponownie: właściwy motyw oraz aktywny ACF Pro 6.7.0.2, podglądy i strona główna QA, CSS/JS HTTP 200. Projektowe komendy cb:wp/cb:dev/cb:preview wskazują tę samą izolowaną instancję factory-live-qa. Wyniki: [TASK-3A-READINESS](TASK-3A-READINESS.md). Dostęp do LIVE pozostaje BLOCKED przed TLS (TCP timeout obu hostów na portach 80/443); potrzebne referencje wszystkich 19 adresów określono w [TASK-3A-MANUAL-REFERENCES](TASK-3A-MANUAL-REFERENCES.md). Q-04/Q-06/Q-10 nie zostały domyślnie zaakceptowane. Pełne sześć statusów: [TASK-3A-REGISTER](TASK-3A-REGISTER.md).
