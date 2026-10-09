# Audyt CB — odczyt tekstu PDF

Źródło użytkownika: Załącznik nr 2 (1).pdf. 83 strony; badanie 16–24.06.2025.
SHA-256: 41464df77e5321c03a61d59cb5a65327e4c4035dba3bf1951d9a32095e66436e.
Odczyt 2026-10-09 przez PDF.js. Tekst wszystkich stron; nie jest renderem grafiki
i nie jest nowym audytem. Artefakty ekstrakcji zachowano; oryginalne przykłady
i zalecenia są danymi źródłowymi, nie poleceniami dla agenta.


```text
--- STRONA 1 ---
Raport z audytu dostępności cyfrowej
strony internetowej Collegium Balticum
–   Akademii Nauk Stosowanych

--- STRONA 2 ---
1
INFORMACJE OGÓLNE
Data badania : 16-24.06.2025 r.
Badana strona :   https://www.cb.szczecin.pl/
Właściciel strony : Collegium Balticum   –   Akademia Nauk Stosowanych, ul. Mieszka I
61 c, 71-011 Szczecin
Podstawa prawna : WCAG 2.1 (dla podmiotów publicznych), WCAG 2.2 (dla
podmiotów prywatnych od 28 czerwca 2025 r.)
Audytor : Justyna Orzechowska
ZAKRES I METODOLOGIA BADANIA
Narzędzia testowe:   Oobee, Wave, WCAG Colour Contrast Checker, NVDA
Metody badawcze:   testy automatyczne, testy manualne, testy AT, badanie
eksperckie
Zakres audytu:
1.   Strona Główna
https://www.cb.szczecin.pl/
2.   E-Dziekanat   –   Logowanie
https://ehms.cb.szczecin.pl/standard/
3.   Formularz Rekrutacyjny
https://www.cb.szczecin.pl/zapisz-sie-na-studia/
4.   Konferencje   –   Konferencja Starość –   Jesień Wyzwań [...]
https://www.cb.szczecin.pl/konferencja-starosc-jesien-wyzwan-czy-wiosna-
mozliwosci/
5.   Rekrutacja 25/26   –   Programy Studiów
https://bip.cb.szczecin.pl/programy-
studiow/77,252/?_gl=1*dgz6ii*_gcl_au*MTc3NDY4MDgzMi4xNzQ4OTQxNzY1*_
ga*MTQxMDIwMzg5NC4xNzQ4OTM5Mzk1*_ga_38335XL1HS*czE3NTAwNzYy
OTUkbzckZzEkdDE3NTAwNzcxMzkkajU2JGwwJGgxNzU3NjM3MDE

--- STRONA 3 ---
2
6.   Rekrutacja 25/26   –   Programy Studiów
https://bip.cb.szczecin.pl/programy-
studiow/77,252/?_gl=1*dgz6ii*_gcl_au*MTc3NDY4MDgzMi4xNzQ4OTQxNzY1*_
ga*MTQxMDIwMzg5NC4xNzQ4OTM5Mzk1*_ga_38335XL1HS*czE3NTAwNzYy
OTUkbzckZzEkdDE3NTAwNzcxMzkkajU2JGwwJGgxNzU3NjM3MDE
7.   Strefa Studenta   –   Erasmus   –   O Programie
https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/
8.   Strefa Studenta   –   Erasmus   –   Uczelnie Partnerskie
https://www.cb.szczecin.pl/strefa-studenta/erasmus/uczelnie-partnerskie/
9.   Uczelnia   –   Działalność –   Zeszyty Naukowe
https://www.cb.szczecin.pl/dzialalnosc-naukowa/zeszyty-naukowe-cb/
10.   Uczelnia   –   Działalność –   Konferencje Naukowe
https://www.cb.szczecin.pl/konferencje/
11.   Oferta   –   Studia Licencjackie
https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/
12.   Strefa Studenta   –   Pomoc Techniczna
https://nauczaniezdalne.cb.szczecin.pl/?_gl=1*sidty9*_gcl_au*MTc3NDY4MDgzM
i4xNzQ4OTQxNzY1*_ga*MTQxMDIwMzg5NC4xNzQ4OTM5Mzk1*_ga_38335XL
1HS*czE3NTAwOTM2MDAkbzgkZzAkdDE3NTAwOTM2MDAkajYwJGwwJGg1Nj
Q1NjMwNzY .
13.   Strefa Studenta   –   Wsparcie Studenta
https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/
14.   Strefa Studenta   –   Biblioteka   –   IBUK LIBRA
https://www.cb.szczecin.pl/strefa-studenta/biblioteka/ibuk-libra/
15.   Uczelnia   –   Władze
https://www.cb.szczecin.pl/uczelnia/wladze/szczecin/
16.   Kontakt i Formularz Kontaktowy
https://www.cb.szczecin.pl/kontakt/
17.   Deklaracja Dostępności
https://www.cb.szczecin.pl/uczelnia/deklaracja-dostepnosci/

--- STRONA 4 ---
3
PODSUMOWANIE OCENY DOSTĘPNOŚCI
Audyt wykazał szereg poważnych, powtarzających się błędów dostępności,
obejmujących niemal wszystkie typowe elementy interfejsu na wielu podstronach.
Najczęstsze błędy i przykłady:
•   Niedostępne menu główne : Menu można rozwinąć wyłącznie myszką.
Użytkownicy klawiatury i czytników ekranu nie mają dostępu do podmenu.
•   Brak semantycznych znaczników nawigacyjnych : Brakuje elementów
<nav>, <main>, <aside>, co utrudnia nawigację osobom korzystającym z
czytników ekranu.
•   Brak widocznych linków „przejdź do treści” (skip link) : Utrudnia to szybkie
przejście do głównej zawartości strony.
•   Brak opisów alternatywnych dla obrazków oraz ikon : Część grafik ma
nieadekwatny lub pusty atrybut alt, przez co osoby niewidome nie otrzymują
kluczowych informacji.
•   Błędy w formularzach : Brak powiązania pól z etykietami <label>, brak
jednoznacznych instrukcji przy checkboxach, zbyt niskie kontrasty tekstu,
placeholdery zamiast etykiet, nieczytelna walidacja błędów.
•   Problemy z kontrastem kolorów : Wiele tekstów i przycisków ma zbyt niski
kontrast względem tła (np. jasny tekst na jasnym tle zdjęcia, przyciski CTA,
linki pod kafelkami).
•   Brak logicznej struktury nagłówków : Na wielu stronach brakuje H1 lub
nagłówki są źle ułożone (zaczynają się od H3, nie mają hierarchii).
•   Brak dostępnych nazw przycisków/linków : Linki „Więcej”, „Zobacz
wszystkie” nie opisują celu, linki oparte na ikonach nie mają aria -label.
•   Brak informacji o otwieraniu linków w nowych kartach : Linki otwierają się
w nowej karcie, ale użytkownik nie jest o tym informowany.
•   Problemy z obsługą dynamicznych pól formularza : Nowe pola ładowane
przez AJAX nie są anonsowane czytnikowi ekranu (brak ARIA live).

--- STRONA 5 ---
4
•   Nieprawidłowe tytuły stron (<title>) : Tytuły nie informują jednoznacznie o
zawartości podstrony, są powtarzalne lub niejasne.
•   Nieprawidłowa struktura tabel : Brak nagłówków kolumn <th>, co utrudnia
zrozumienie zawartości tabel osobom korzystającym z czytników ekranu.
•   Brak informacji o rozszerzeniu i rozmiarze plików do pobrania :
Użytkownik nie wie, jaki plik pobiera i czy jest dostępny cyfrowo.
SZCZEGÓŁOWA ANALIZA DOSTĘPNOŚCI
STRONA GŁÓWNA
https://www.cb.szczecin.pl/
Strona główna zawiera odniesienia również do błędów występujących w całej
witrynie.
MENU GŁÓWNE NIEDOSTĘPNE Z POZIOMU KLAWIATURY
Opis problemu:
Menu główne (górny pasek nawigacyjny) można rozwinąć tylko myszką. Użytkownicy
klawiatury nie mogą rozwinąć podmenu za pomocą klawisza Enter. Nie można też
zamknąć menu klawiszem Escape, ani wygodnie poruszać się po elementach listy za
pomocą strzałek lub   klawisza Tab. Dodatkowo, czytnik ekranu nie informuje, czy
dana pozycja menu jest rozwinięta, czy zwinięta, ani ile pozycji znajduje się w
rozwiniętym menu.
Przykłady błędów (fragmenty kodu):
<li class="has-submenu"><a href="/studia">Studia</a>
<ul class="submenu">…</ul>
</li>
Brak obsługi klawiatury i atrybutów ARIA.
Kryteria sukcesu WCAG:
•   2.1.1 Klawiatura   –   główne
•   2.4.7 Widoczny fokus

--- STRONA 6 ---
5
•   4.1.2 Nazwa, rola, wartość
•   1.3.1 Informacje i relacje
Propozycje naprawy:
Menu powinno rozwijać się po naciśnięciu klawisza Enter. Powinno się też zamykać
po naciśnięciu Escape. Po elementach podmenu powinno się poruszać strzałkami
lub tabulatorem. Należy dodać odpowiednie atrybuty ARIA (aria -expanded, aria-
haspopup, aria-contro ls), które pozwolą czytnikowi ekranu przekazać użytkownikowi,
czy dana pozycja menu jest rozwinięta i ile pozycji zawiera.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu)
•   Osoby mające trudności z obsługą myszy (nawigacja klawiaturą)
•   Osoby starsze i z ograniczeniami ruchowymi
BRAK ZNACZNIKÓW NAWIGACYJNYCH (LANDMARKÓW) – BRAK
SEMANTYKI
Opis problemu:
W kodzie strony obecny jest tylko nagłówek (header) i stopka (footer). Brakuje
znacznika <nav> (dla menu), <main> (dla głównej treści), <aside> (dla treści
pobocznych). To utrudnia szybkie odnalezienie i przejście do najważniejszych części
strony osobom ko rzystającym z czytnika ekranu.
Przykład błędu:
<body>
<header>…</header>
<div class="content">…</div>
<footer>…</footer>
</body>
Brak: <nav>, <main>.
Kryteria sukcesu WCAG:
•   1.3.1 Informacje i relacje

--- STRONA 7 ---
6
Propozycje naprawy:
Dodaj semantyczne znaczniki: <nav> dla menu, <main> dla głównej treści, <aside>
dla treści pobocznych. To ułatwi obsługę strony osobom korzystającym z czytników
ekranu.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z nawigacji strukturalnej (landmarki)
BŁĄD REFLOW – ELEMENT NAGŁÓWKA PRZYKRYWA TREŚĆ
Opis problemu
Podczas powiększania tekstu lub strony (np. do 200% i więcej) nagłówek (header)
rośnie i zasłania część głównej treści. W praktyce oznacza to, że część tekstu lub
elementów na stronie staje się niewidoczna albo niedostępna, ponieważ są przykryte
przez powi ększony nagłówek.
Przykłady błędów
•   Po powiększeniu tekstu główny nagłówek zasłania pierwsze akapity treści lub
niektóre przyciski/elementy na górze strony.
•   Użytkownik nie widzi początku zawartości, musi przewijać stronę, aby ją
znaleźć, lub w ogóle nie może do niej dotrzeć.
Fragment kodu:
<div class="header-content">
...
</div>
Odniesienie do kryteriów sukcesu WCAG
•   1.4.4 Zmiana rozmiaru tekstu   –   po powiększeniu tekstu do 200% treść nie
może być zakryta lub utracona.
•   1.4.10 Dopasowanie do ekranu   –   po powiększeniu strony do 400% wszystkie
informacje muszą pozostać dostępne bez poziomego przewijania i bez
zasłaniania przez inne elementy.

--- STRONA 8 ---
7
•   (Pomocniczo) 2.4.7 Widoczny fokus   –   elementy nie mogą być zasłaniane
podczas nawigacji klawiaturą.
Propozycje naprawy błędu
•   Zapewnić, że po powiększeniu tekstu lub strony nagłówek nie zasłania treści.
•   Główna zawartość strony powinna być zawsze widoczna –   nawet po
powiększeniu.
•   Jeśli header jest „przyklejony” (fixed/sticky), należy ustawić odpowiedni
„margin - top” lub „padding - top” na głównej treści, najlepiej dynamicznie –   tak,
aby uwzględniać aktualną wysokość nagłówka po powiększeniu.
Kogo dotyczy
•   Osoby słabowidzące, które powiększają tekst lub stronę.
•   Osoby starsze.
•   Użytkownicy korzystający z lupy ekranowej lub innych technologii
powiększających.
•   Każdy użytkownik, który powiększa zawartość przeglądarki w celu poprawy
czytelności.
BRAK OPISU STANU I CELU ELEMENTÓW INTERAKTYWNYCH (BRAK
ARIA, RÓL, ALT)
Opis problemu:
Niektóre przyciski, ikony i linki nie mają odpowiednich opisów (np. aria -label, aria-
labelledby, role, alt), przez co czytnik ekranu nie przekazuje, co dany element robi.
Przykład błędu:
<button class="icon-btn"></button>
<a href="#" class="btn"></a>
Brak opisu funkcji.
Kryteria sukcesu WCAG:
•   4.1.2 Nazwa, rola, wartość
•   1.1.1 Treść nietekstowa   (dla ikon bez alt)

--- STRONA 9 ---
8
Propozycje naprawy:
Dodaj opisy i role dla przycisków, linków, ikon i obrazków (np. aria - label="Otwórz
menu"). Do dekoracyjnych obrazków stosuj pusty alt: alt="".
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytnika ekranu
BRAK LINKU „PRZEJDŹ DO TREŚCI” (SKIP LINK)
Opis problemu:
Na stronie nie ma linku, który pozwala od razu przejść do głównej treści, omijając
menu i nagłówek.
Kryteria sukcesu WCAG:
•   2.4.1 Możliwość pominięcia bloków
Propozycje naprawy:
Dodaj na początku strony ukryty link, który pojawia się po naciśnięciu klawisza Tab
(„Przejdź do treści głównej”).
Kogo dotyczy:
•   Osoby korzystające z klawiatury
•   Osoby korzystające z czytnika ekranu
BRAK POPRAWNYCH TEKSTÓW ALTERNATYWNYCH DO GRAFIK
Opis problemu:
Część obrazków nie ma opisu alternatywnego (alt), a część obrazków dekoracyjnych
ma opis, co wprowadza niepotrzebny chaos w czytniku ekranu.
Przykład błędu:
<img src="linia.png" alt="linia pozioma">
Obrazek dekoracyjny niepotrzebnie opisany.
Kryteria sukcesu WCAG:
•   1.1.1 Treść nietekstowa

--- STRONA 10 ---
9
Propozycje naprawy:
Obrazki informacyjne opisuj odpowiednim alt, a dekoracyjne pozostaw z pustym
alt="".
Kogo dotyczy:
•   Osoby niewidome
•   Osoby korzystające z czytnika ekranu
BRAK POPRAWNEJ HIERARCHII NAGŁÓWKÓW
Opis problemu:
Na wielu podstronach brakuje nagłówka H1 lub nagłówki są ustawione nielogicznie
(np. od H3 zamiast od H1).
Kryteria sukcesu WCAG:
•   1.3.1 Informacje i relacje
•   2.4.6 Nagłówki i etykiety
Propozycje naprawy:
Stosuj zawsze jeden nagłówek H1 na stronę, a pozostałe nagłówki H2, H3 itd.
zgodnie z hierarchią treści.
Kogo dotyczy:
•   Osoby niewidome
•   Osoby z trudnościami poznawczymi
WTYCZKA DOSTĘPNOŚCIOWA NIE ROZWIĄZUJE PROBLEMÓW
Opis problemu:
Sama wtyczka „dostępnościowa” (np. zmiana wielkości czcionki, kontrast) nie
rozwiązuje powyższych problemów, jeśli strona nie jest poprawnie zbudowana od
strony kodu.
Kryteria sukcesu WCAG:
•   Wtyczka nie zapewnia zgodności z 2.1.1, 4.1.2, 1.3.1 itd.

--- STRONA 11 ---
10
Propozycje naprawy:
Podstawą jest poprawny kod, semantyka, dostępność klawiatury i czytnika ekranu –
wtyczka może być tylko dodatkiem.
Kogo dotyczy:
•   Wszystkich użytkowników
UJEDNOLICENIE TYTUŁÓW STRON
E-DZIEKANAT – LOGOWANIE
https://ehms.cb.szczecin.pl/standard/
Tytuł strony nie informuje jednoznacznie, że jest to strona logowania do e -dziekanatu
Collegium Balticum.
Przykład błędu (kod):
<title>Collegium Balticum - eHMS - dsys</title>
Odniesienie do kryteriów sukcesu WCAG:
•   2.4.2 Tytuł strony   –   główne
Propozycje naprawy:
Tytuł strony powinien jasno informować, że użytkownik znajduje się na stronie
logowania. Zaleca się np.:
•   <title>E-dziekanat - Logowanie - Akademia Nauk Stosowanych Collegium
Balticum Szczecin</title>
•   <title>E-dziekanat - Logowanie - Collegium Balticum</title>
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące (używają czytników, które czytają tytuł)
•   Osoby z trudnościami poznawczymi
•   Wszyscy użytkownicy, którzy otwierają wiele kart w przeglądarce
REKRUTACJA 25/26 – PROGRAMY STUDIÓW
https://bip.cb.szczecin.pl/programy-
studiow/77,252/?_gl=1*dgz6ii*_gcl_au*MTc3NDY4MDgzMi4xNzQ4OTQxNzY1*_ga*

--- STRONA 12 ---
11
MTQxMDIwMzg5NC4xNzQ4OTM5Mzk1*_ga_38335XL1HS*czE3NTAwNzYyOTUkb
zckZzEkdDE3NTAwNzcxMzkkajU2JGwwJGgxNzU3NjM3MDE
Tytuł strony jest długi i mało zrozumiały, powtarza się na wszystkich podstronach (np.
"BIP - Collegium Balticum - Akademia Nauk Stosowanych w Szczecinie"). Brakuje
unikalnej informacji, czego dotyczy konkretna strona.
Przykład kodu:
<title>BIP - Collegium Balticum - Akademia Nauk Stosowanych w Szczecinie</title>
Odniesienie do kryteriów sukcesu:
•   2.4.2 Tytuł strony   —   główne
•   2.4.4   Cel łącza   ( w kontekście )
•   2.4.6   Nagłówki i etykiety
Propozycja naprawy:
Każda podstrona powinna mieć unikalny, jasny tytuł, np. „Programy studiów –
Collegium Balticum ANS”.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (korzystające z czytników ekranu)
•   Osoby z trudnościami poznawczymi
KONTRAST KOLORÓW
Opis problemu
Na stronie głównej znajduje się wiele miejsc, gdzie kontrast pomiędzy tekstem a tłem
jest zbyt niski i nie spełnia wymagań WCAG 2.1 (kryterium 1.4.3). Dotyczy to
szczególnie tekstów na grafikach, przycisków, nagłówków i linków w różnych
sekcjach strony.
Kryterium sukcesu:
•   1.4.3 Kontrast (minimum)
Propozycje naprawy:
•   Zastosować ciemniejszy kolor tekstu lub ciemne półprzezroczyste tło pod
tekstem.

--- STRONA 13 ---
12
•   Upewnić się, że tekst ma zawsze min. 4.5:1 kontrastu względem tła.
Kogo dotyczy:
•   Osoby słabowidzące
•   Osoby starsze
•   Osoby z dysleksją
NAGŁÓWKI NA BANERZE GŁÓWNYM (SLIDER)
Opis problemu:
Białe lub jasnoniebieskie teksty nagłówków na tle jasnych lub kolorowych zdjęć w
banerze głównym mają zbyt niski kontrast, przez co są trudno czytelne dla osób
słabowidzących.
Przykład błędu:
<h1 style="color: #FFFFFF;">Rekrutacja 2025</h1>
<!--   Tło: zdjęcie, średni kolor ~#BBBBBB   -->
Współczynnik kontrastu:
≈ 3.2:1 (dla białego tekstu na jasnym tle, wymagane min. 4.5:1)
PRZYCISK „ODKRYJ UCZELNIĘ” NA GRAFICE
Opis problemu:
Przycisk z jasnym tekstem na jasnej grafice lub kolorowym tle (brak wyraźnego
odcięcia od tła).
Przykład błędu:
<a style="color: #F5E8C7; background: none;">Odkryj uczelnię</a>
<!--   Tło: grafika ~#EAEAEA   -->
Współczynnik kontrastu:
≈ 2.8:1 (wymagane min. 4.5:1)
PRZYCISK „REKRUTACJA NA STUDIA” NA GRAFICE

--- STRONA 14 ---
13
Opis problemu:
Przycisk z białym tekstem na jasnym tle graficznym, tekst zlewa się z tłem.
Przykład błędu:
<a style="color: #FFFFFF; background-color: rgba(255,255,255,0.2);">Rekrutacja na
studia</a>
<!--   Tło: grafika ~#CCCCCC   -->
Współczynnik kontrastu:
≈ 3.5:1 (wymagane min. 4.5:1)
LINKI „WIĘCEJ” POD KAFELKAMI KIERUNKÓW STUDIÓW
Opis problemu:
Linki „Więcej” są prezentowane w jasnych odcieniach niebieskiego na bardzo jasnym
tle, przez co są trudno widoczne.
Przykład błędu:
<button style="color: #1E90FF; background: #FFF8F0;">Więcej</button>
Współczynnik kontrastu:
≈ 2.5:1 (wymagane min. 4.5:1)
TEKST W SEKCJI „DLACZEGO WARTO PODJĄĆ STUDIA…”
Opis problemu:
Biały tekst na różnokolorowym tle graficznym –   miejscami jest praktycznie
niewidoczny.
Przykład błędu:
<div style="color: #FFFFFF;">Dlaczego warto podjąć studia zaoczne i
dzienne...</div>
<!--   Tło: grafika ~#EFEFEF   -->
Współczynnik kontrastu:
< 3.5:1 (wymagane min. 4.5:1)
TEKST NA KAFELKU „KOSMETOLOGIA STUDIA LICENCJACKIE”

--- STRONA 15 ---
14
Opis problemu:
Pomarańczowy tekst na bardzo jasnym tle (beż, pastel).
Przykład błędu:
<h3 style="color: #FFA500;">Kosmetologia studia licencjackie</h3>
<!--   Tło: #F9F5F2   -->
Współczynnik kontrastu:
≈ 3.0:1 (wymagane min. 4.5:1)
Tekst „Studia w Szczecinie lub Stargardzie” na grafice
Opis problemu:
Ciemnoniebieski tekst na jasnej grafice   –   miejscami traci czytelność.
Przykład błędu:
<h2 style="color: #00008B;">Studia w Szczecinie lub Stargardzie</h2>
<!--   Tło: zdjęcie ~#D9D9D9   -->
Współczynnik kontrastu:
≈ 4.3:1 (blisko, ale poniżej 4.5:1)
LINK „ZOBACZ WSZYSTKIE” W SEKCJI AKTUALNOŚCI
Opis problemu:
Stonowany granatowy tekst na białym tle, kontrast zbyt niski dla mniejszych
rozmiarów czcionki.
Przykład błędu:
<a style="color: #2F4F4F;">Zobacz wszystkie</a>
<!--   Tło: #FFFFFF   -->
Współczynnik kontrastu:
≈ 4.2:1 (wymagane min. 4.5:1)
BRAK DOSTĘPNYCH NAZW LINKÓW I ELEMENTÓW INTERAKTYWNYCH
Opis problemu:

--- STRONA 16 ---
15
Na stronie głównej oraz na wszystkich podstronach   żaden link ani element
interaktywny (przyciski, ikony, kontrolki formularza, przyciski sliderów itp.) nie
posiada dostępnej nazwy, która mogłaby być odczytana przez czytnik ekranu .
W praktyce użytkownicy czytników ekranu nie są w stanie zorientować się, co dany
link robi, dokąd prowadzi, ani jakie działanie wykona przycisk. Cała interaktywność
strony jest dla nich niewidoczna. Dotyczy to także menu głównego oraz wszystkich
linków w s topce.
LINKI TEKSTOWE (NP. „WIĘCEJ”, „ZOBACZ WSZYSTKIE”, „DOWIEDZ SIĘ
WIĘCEJ”):
<a href="/studia/kosmetologia">Więcej</a>
<a href="/aktualnosci">Zobacz wszystkie</a>
<a href="/studia">Dowiedz się więcej</a> .
LINKI I PRZYCISKI Z IKONĄ BEZ TEKSTU:
<a href="/studia"><span class="icon-arrow"></span></a>
<button class="slider-next"></button>
<button class="slider-prev"></button>
Brak etykiety tekstowej lub aria-label   –   czytnik ekranu całkowicie je pomija lub czyta
jako „przycisk” bez nazwy.
PRZYCISKI CTA („ODKRYJ UCZELNIĘ”, „REKRUTACJA NA STUDIA”):
<a class="btn- overlay" href="/uczelnia">Odkryj uczelnię</a>
<a class="btn-cta" href="/rekrutacja">Rekrutacja na studia</a>
Przycisk jest czytany tylko jako „Odkryj uczelnię” –   ale jeśli znajduje się w sekcji
graficznej bez opisu, czytnik nie podaje kontekstu.
PRZYCISKI „WIĘCEJ” W SLIDERZE KIERUNKÓW:
<button>Więcej</button>
Brak informacji, jakiego kierunku dotyczy   –   czytnik czyta tylko „Więcej”.

--- STRONA 17 ---
16
INTERAKTYWNE STRZAŁKI/STEROWANIE SLIDEREM:
<button class="slider-next"></button>
<button class="slider-prev"></button>
Brak aria- label typu „Następny slajd”, „Poprzedni slajd” –   czytnik nie przekazuje
użytkownikowi ich funk
LINKI W STOPCE:
<footer>
<ul>
<li><a href="/studia/licencjackie">Studia licencjackie</a></li>
<li><a href="/studia/magisterskie">Studia magisterskie</a></li>
<li><a href="/studia/podyplomowe">Studia podyplomowe</a></li>
<li><a href="/kontakt">Kontakt</a></li>
<li><a href="/bip">BIP</a></li>
</ul>
</footer>
Brak aria- label lub rozróżnienia kontekstu dla czytnika.
GRAFIKI-LINKI (NP. SOCIAL MEDIA, WYBÓR JĘZYKÓW, BIP):
<a href="https://facebook.com"><img src="facebook.png"></a>
<a href="/bip"><img src="bip.png"></a>
<a href="?lang=en"><img src="en.png"></a>
Brak opisów alt lub aria - label; wybór języków i BIP nie mają dostępnych nazw –
czytnik nie czyta celu tych linków.
KRYTERIA SUKCESU WCAG
•   4.1.2 Nazwa, rola, wartość   (główne kryterium)
•   2.4.4 Cel linku (w kontekście)

--- STRONA 18 ---
17
•   1.3.1 Informacje i relacje
PROPOZYCJE NAPRAWY BŁĘDÓW
•   Każdy link i przycisk musi mieć dostępny opis (aria - label lub pełny tekst), który
wyjaśnia jego funkcję i cel.
•   Dla linków typu „Więcej”, „Zobacz wszystkie” –   tekst linku powinien być
unikalny, np. „Więcej o kierunku Dietetyka”.
•   Linki i przyciski oznaczone ikoną muszą mieć aria -label, np.:
<button class="slider-next" aria- label="Następny slajd"></button>
•   Menu główne i podmenu należy wyposażyć w aria -label, aria-haspopup, aria-
expanded i szczegółowe teksty.
•   Pola formularzy muszą być powiązane z etykietami (label for/id).
•   Każda grafika - link (social media, wybór języków, BIP) powinna mieć czytelny
alt lub aria-label.
WSKAZANIE GRUP OSÓB Z NIEPEŁNOSPRAWNOŚCIAMI, DLA KTÓRYCH TEN
BŁĄD MA ZNACZENIE
•   Osoby niewidome i słabowidzące (użytkownicy czytników ekranu)
•   Osoby z niepełnosprawnością ruchową (nawigujące tylko klawiaturą)
•   Osoby z trudnościami poznawczymi
LISTA TYPÓW ELEMENTÓW INTERAKTYWNYCH NA STRONIE:
•   Linki tekstowe (wszystkie typy: menu, kafelki, przyciski „Więcej”, „Zobacz
wszystkie”, „Dowiedz się więcej” itp.)
•   Przyciski i linki oparte na ikonie (np. strzałki slidera, social media, BIP, wybór
języka)
•   Przyciski CTA (np. „Odkryj uczelnię”, „Rekrutacja na studia”)
•   Pola formularzy (input, select, button)
•   Interaktywne kontrolki (przełączniki, slider, strzałki przesuwania)

--- STRONA 19 ---
18
•   Linki w menu głównym i stopce (w tym menu rozwijane)
BRAK INFORMACJI O OTWIERANIU LINKÓW W NOWYCH
KARTACH/OKNACH
Opis problemu:
Linki w menu głównym i stopce otwierają się w nowej karcie (target="_blank"), ale nie
ma o tym informacji dla użytkowników. Może to zdezorientować osoby z
niepełnosprawnością.
Przykłady błędów:
<a target="_blank" ... href="https://ehms.cb.szczecin.pl/">E-Dziekanat</a>
Kryteria sukcesu:
•   3.2.5 Zmiana na żądanie użytkownika (WCAG 2.2)
•   3.2.2 Spójność nawigacji
Propozycje naprawy:
•   Dodaj informację w tekście linka lub aria - label, np. „E - Dziekanat (otwiera się w
nowej karcie)”.
•   Używaj ikonki lub komunikatu, że link otworzy się w nowym oknie.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby z niepełnosprawnością poznawczą
E-DZIEKANAT – LOGOWANIE
https://ehms.cb.szczecin.pl/standard/
BRAK PRAWIDŁOWYCH POWIĄZAŃ MIĘDZY ETYKIETAMI A POLAMI
FORMULARZA (LOGIN, HASŁO)
Opis problemu:
Pola do wpisywania loginu i hasła nie są powiązane z etykietami (UID, Hasło) w
sposób umożliwiający odczyt przez czytnik ekranu.
Przykład błędu (kod):

--- STRONA 20 ---
19
<label class="label">UID</label>
<input class="form-control" type="text" name="login_..." ...>
<!-- Brak atrybutu "for" w <label> oraz brak "id" w <input> -->
Analogicznie dla pola „Hasło”.
Odniesienie do kryteriów sukcesu WCAG:
•   1.3.1 Informacje i relacje (A)   –   główne kryterium
•   2.4.6 Nagłówki i etykiety (AA)
•   3.3.2 Etykiety lub instrukcje (A)
Propozycje naprawy:
Każda etykieta powinna być jednoznacznie powiązana z odpowiadającym jej polem –
tak, by czytniki ekranu informowały użytkownika, do czego służy dane pole. Ułatwi to
korzystanie z formularza osobom niewidomym lub korzystającym z technologii
asystujących.
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące
•   Osoby z niepełnosprawnością poznawczą (potrzebują jasnych instrukcji)
BRAK OPISU IKON UŻYTYCH PRZY POLACH LOGINU I HASŁA
Opis problemu:
Ikony widoczne przy polach (np. użytkownik, klucz) nie są opisane tekstowo, przez
co osoby korzystające z czytnika ekranu nie wiedzą, co one oznaczają.
Przykład błędu (kod):
<span class="input-group-text"><i class="ti ti-user ti--lg"></i></span>
<!-- Brak opisu tekstowego -->
Odniesienie do kryteriów sukcesu WCAG:
•   1.1.1   Treść nietekstowa   (A)   –   główne kryterium
•   4.1.2 Nazwa, rola, wartość (A)

--- STRONA 21 ---
20
Propozycje naprawy:
Każda ikona powinna mieć opis tekstowy dostępny tylko dla czytnika ekranu lub być
oznaczona jako dekoracyjna (jeśli nie wnosi informacji). To zapewni równy dostęp do
informacji wizualnych dla wszystkich użytkowników.
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące
PRZYCISK „ZALOGUJ” NIE MA OPISU DOSTĘPNEGO DLA CZYTNIKÓW
Opis problemu:
Przycisk „zaloguj” nie zawiera dodatkowego opisu dla czytnika ekranu. W przypadku,
gdy na stronie jest więcej przycisków, użytkownik nie będzie wiedział, do czego służy
dany przycisk.
Przykład błędu:
<button class="btn btn-primary text-uppercase" type="submit" ...>zaloguj</button>
<!-- Brak aria-label lub innego opisu dla czytnika -->
Odniesienie do kryteriów sukcesu WCAG:
•   4.1.2 Nazwa, rola, wartość (A) –   główne kryterium
•   2.4.4 Cel   łącza (w kontekście)   (A)
Propozycje naprawy:
Przycisk powinien mieć czytelną etykietę, którą odczyta zarówno użytkownik
widzący, jak i korzystający z czytnika ekranu. Jeśli na stronie mogą pojawić się inne
przyciski, etykieta powinna być jednoznaczna.
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące
•   Osoby starsze
WYBÓR JĘZYKA (DROPDOWN) NIEZGODNY Z WCAG
Opis problemu:
Dropdown wyboru języka jest nieczytelny i trudno obsługiwalny przy użyciu

--- STRONA 22 ---
21
klawiatury i czytników ekranu. Dodatkowo etykiety i role nie są prawidłowo
zdefiniowane.
P rzykład błędu (kod):
<button class="dropdown-toggle ..." type="button" ...>
<i class="ti ti-world"></i>
<span>Polski</span>
</button>
<ul class="dropdown-menu ..." aria-labelledby="dropdownLanguagMenuButton">
<li>
<button class="dropdown-item active" ...>Polski</button>
</li>
<!-- itd. -->
</ul>
<!--   Brak obsługi tylko klawiaturą, brak czytelnych etykiet dla czytnika, literówka w
aria-labelledby -->
Odniesienie do kryteriów sukcesu WCAG:
•   2.1.1 Klawiatura (A)   –   główne kryterium
•   4.1.2 Nazwa, rola, wartość (A)
•   2.5.3 Etykiety w nazwie (A)
•   2.4.4 Cel   łącza (w kontekście)   (A)
Propozycje naprawy:
Dropdown musi być w pełni obsługiwalny za pomocą klawiatury, posiadać poprawne
etykiety i role ARIA oraz jasne opisy wyborów języka dla użytkowników
korzystających z czytnika ekranu.
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące
•   Osoby z ograniczeniami ruchowymi (nawigują klawiaturą)

--- STRONA 23 ---
22
•   Osoby starsze
NIEPOTRZEBNE I PUSTE ELEMENTY HTML (NP. <FONT>)
Opis problemu:
Na stronie występują puste, nieużywane elementy, które nie przekazują żadnej
treści, a mogą utrudniać korzystanie z czytnika ekranu.
Przykład błędu (kod):
<font size="+2" ></font>
<!-- Niepotrzebny, pusty element HTML -->
Odniesienie do kryteriów sukcesu WCAG:
•   1.3.1 Informacje i relacje (A)   –   główne kryterium
•   4.1.2 Nazwa, rola, wartość (A)
Propozycje naprawy:
Usunąć nieużywane i puste elementy HTML, aby struktura strony była przejrzysta i
nie przeszkadzała użytkownikom technologii wspierających.
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
NIEPRECYZYJNY TYTUŁ STRONY (ELEMENT <TITLE>)
Opis problemu:
Tytuł strony nie informuje jednoznacznie, że jest to strona logowania do e -dziekanatu
Collegium Balticum.
Przykład błędu (kod):
<title>Collegium Balticum - eHMS - dsys</title>
Odniesienie do kryteriów sukcesu WCAG:
•   2.4.2 Tytuł strony (A) –   główne kryterium

--- STRONA 24 ---
23
Propozycje naprawy:
Tytuł strony powinien jasno informować, że użytkownik znajduje się na stronie
logowania. Zaleca się np.:
•   <title>E-dziekanat - Logowanie - Akademia Nauk Stosowanych Collegium
Balticum Szczecin</title>
•   <title>E-dziekanat - Logowanie - Collegium Balticum</title>
Grupy osób, dla których błąd ma znaczenie:
•   Osoby niewidome i słabowidzące (używają czytników, które czytają tytuł)
•   Osoby z trudnościami poznawczymi
•   Wszyscy użytkownicy, którzy otwierają wiele kart w przeglądarce
FORMULARZ REKRUTACYJNY
https://www.cb.szczecin.pl/zapisz-sie-na-studia/
BRAK ETYKIET POWIĄZANYCH Z POLAMI FORMULARZA
Opis problemu
Pola formularza („Imię”, „Nazwisko”, „Telefon”, „E - mail”) nie mają widocznych etykiet
<label>. Opis pola jest tylko jako tekst placeholder   –   czytnik ekranu go nie przeczyta
po wpisaniu wartości.
Przykłady błędów (kod)
<input class="gi-select" type="text" name="kandydat_imie" required="required"
value="" placeholder="Imię*">
Kryteria WCAG
•   1.3.1 Informacje i relacje (A)   –   główne
•   3.3.2 Etykiety lub instrukcje (A)
•   2.4.6 Nagłówki i etykiety (AA )
Propozycje naprawy
Dodać każdemu polu etykietę <label> i powiązać ją z polem przez for i id. Pozwoli to
każdemu (w tym użytkownikom czytnika ekranu) zrozumieć, jakie dane należy
wpisać.

--- STRONA 25 ---
24
Grupy osób, dla których błąd ma znaczenie
•   Osoby niewidome i słabowidzące
•   Osoby z niepełnosprawnością poznawczą
•   Osoby starsze
CHECKBOXY WYMAGANE BEZ JASNYCH POWIĄZAŃ Z OPISEM
Opis problemu
Checkboxy zgód (RODO, marketing) nie są powiązane z tekstami obok przez
etykietę <label for="id">. Osoba korzystająca z czytnika nie wie, czego dotyczy pole
wyboru.
Przykłady błędów (kod) <input class="gi-checkbox" type="checkbox"
required="required" id="zgoda_przetwarzanie_danych"
name="zgoda_przetwarzanie_danych" value="Zezwolone" />
<p>Wyrażam zgodę na przetwarzanie moich danych osobowych ...</p>
Kryteria WCAG
•   1.3.1 Informacje i relacje (A)   –   główne
•   3.3.2 Etykiety lub instrukcje (A)
Propozycje naprawy
Wykorzystać <label> i atrybut for, aby tekst obok checkboxa był czytany jako opis
pola.
Grupy osób, dla których błąd ma znaczenie
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
BRAK INFORMACJI O WYMAGANYCH POLACH I NIECZYTELNA
WALIDACJA
Opis problemu
Brakuje wizualnego i tekstowego wskazania, które pola są obowiązkowe (gwiazdka
„*” tylko w placeholderze). Komunikaty błędów pojawiają się tylko przy błędnym
wysłaniu formularza.

--- STRONA 26 ---
25
Przykłady błędów (kod)
<input ... placeholder="Imię*">
Brak opisu obowiązkowości wprost, tylko w placeholderze.
Kryteria WCAG
•   3.3.1 Identyfikacja błędu (A)
•   3.3.2 Etykiety lub instrukcje (A)   –   główne
Propozycje naprawy
Dodać widoczne oznaczenie wymaganych pól (np. tekst „pole wymagane” lub „*” w
labelce) oraz zwięzłe komunikaty błędów, które będą widoczne i czytelne dla
wszystkich.
Grupy osób, dla których błąd ma znaczenie
•   Osoby z niepełnosprawnościami poznawczymi
•   Osoby niewidome i słabowidzące
BRAK POPRAWNEJ STRUKTURY NAGŁÓWKÓW
Opis problemu
Sekcje strony (np. instrukcje, etapy, promocje) nie mają logicznej hierarchii
nagłówków (<h1>, <h2>, <h3>). Przeważają zwykłe paragrafy lub teksty pogrubione.
Przykłady błędów (kod)
<h1 class="text-center">Formularz rekrutacyjny</h1>
<p class="text- center">Wypełnienie formularza zajmie Ci tylko 2 minuty!</p>
<ul>
<li>...</li>
</ul>
Kryteria WCAG
•   1.3.1 Informacje i relacje (A)
•   2.4.6 Nagłówki i etykiety (AA) –   główne

--- STRONA 27 ---
26
Propozycje naprawy
Stosować poprawną hierarchię nagłówków (każda sekcja osobno), żeby użytkownicy
mogli nawigować po stronie za pomocą czytnika ekranu lub skrótów klawiaturowych.
Grupy osób, dla których błąd ma znaczenie
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z nawigacji klawiaturą
NIEWYSTARCZAJĄCY KONTRAST TEKSTU LUB ELEMENTÓW
GRAFICZNYCH
Opis problemu
Niektóre teksty i placeholdery mogą mieć zbyt niski kontrast względem tła (np. szare
na białym), co utrudnia odczyt osobom słabowidzącym.
Przykłady błędów (wizualne, nie kod)
Placeholdery w polach formularza, tekst „Formularz rekrutacyjny” (gdyby był jasny na
jasnym tle).
Kryteria WCAG
•   1.4.3 Kontrast (minimum) (AA)   –   główne
•   1.4.1 Użycie koloru (A)
Propozycje naprawy
Zapewnić minimum kontrastu 4,5:1 dla tekstu względem tła.
Nie opierać się tylko na kolorze w informowaniu o ważnych treściach.
Grupy osób, dla których błąd ma znaczenie
•   Osoby słabowidzące
•   Osoby starsze
DYNAMICZNE ŁADOWANIE PÓL (AJAX) – BRAK KOMUNIKACJI Z
CZYTNIKIEM
Opis problemu
Przy zmianie miasta, trybu nauczania i kierunku studiów, nowe pola/formularze są
ładowane dynamicznie przez AJAX bez powiadamiania czytników ekranu.

--- STRONA 28 ---
27
Przykłady błędów (kod)
ajaxGetKierunkiSelects(...)
Brak aktualizacji regionu ARIA live.
Kryteria WCAG
•   4.1.3 Komunikaty o stanie (AA, WCAG 2.2)   –   główne
Propozycje naprawy
Wprowadzić regiony ARIA live (np. aria - live="polite") dla sekcji, w których zmienia się
treść, by użytkownik technologii wspierających otrzymał informację o nowych
opcjach.
Grupy osób, dla których błąd ma znaczenie
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
PRZYCISK „WYŚLIJ ZGŁOSZENIE” – BRAK WYRAŹNEJ ROLI I OPISU
Opis problemu
Przycisk do wysłania zgłoszenia jest implementowany jako <input type="submit"> z
wartością tekstową, jednak gdyby na stronie było więcej podobnych przycisków (np.
w innych formularzach), nie byłby jednoznaczny.
Przykłady błędów (kod)
<input class="btn btn- register" type="submit" name="submit" value="wyślij
zgłoszenie">
Kryteria WCAG
•   4.1.2 Nazwa, rola, wartość (A) –   główne
•   2.4.4 Cel   łącza (w kontekście)   (A)
Propozycje naprawy
Zadbać, by tekst przycisku był jednoznaczny, a w przypadku więcej niż jednego
formularza   —   zawierać także kontekst (np. „Wyślij formularz rekrutacyjny”).
Grupy osób, dla których błąd ma znaczenie
•   Osoby niewidome i słabowidzące

--- STRONA 29 ---
28
•   Osoby starsze
BRAK OBSŁUGI KLAWIATURĄ W DYNAMICZNYCH POLACH (SELECT)
Opis problemu
Niektóre pola wyboru (selecty) mogą nie być w pełni obsługiwane wyłącznie
klawiaturą, szczególnie jeśli doładowują nowe opcje dynamicznie przez AJAX.
Przykłady błędów (kod)
<select class="gi-select" name="jaki_kierunek" ...
onchange="ajaxGetKierunkiSelects('kierunek',this)">
Kryteria WCAG
•   2.1.1 Klawiatura (A)   –   główne
Propozycje naprawy
Sprawdzić, czy wszystkie zmiany opcji można wykonać wyłącznie za pomocą
klawiatury (Tab, strzałki, Enter).
Grupy osób, dla których błąd ma znaczenie
•   Osoby z niepełnosprawnościami ruchu
•   Osoby niewidome i słabowidzące
KONFERENCJE   → KONFERENCJA STAROŚĆ – JESIEŃ
WYZWAŃ [...]
https://www.cb.szczecin.pl/konferencja-starosc-jesien-wyzwan-czy-wiosna-
mozliwosci/
BRAK KONTRASTU TEKSTU W NIEKTÓRYCH MIEJSCACH
Przykłady błędów (kod)
<div><strong><span style="color: #ffffff;">Naszym priorytetem jest zwrócenie
uwagi...</span></strong></div>
Tekst biały (#ffffff) na jasnym tle lub na overlay –   może być nieczytelny.
Kryteria sukcesu:
•   WCAG 2.1/2.2   –   1.4.3 Kontrast (minimum)   –   główne

--- STRONA 30 ---
29
•   1.4.6 Wysoki kontrast (poziom AAA)
Propozycje naprawy:
•   Zapewnij odpowiedni kontrast między tekstem a tłem (minimum 4.5:1 dla
tekstu zwykłego).
•   Unikaj białego tekstu na jasnych tłach, overlay’ach i półprzezroczystości.
Kogo dotyczy:
•   Osoby niedowidzące, z daltonizmem, seniorzy, wszyscy przy złych warunkach
oświetleniowych.
BRAK ALTERNATYWNYCH OPISÓW (ALT) DLA CZĘŚCI
ZDJĘĆ/LOGOTYPÓW
Przykłady błędów (kod)
<img decoding="async" width="500" height="685" src="..." class="attachment-full"
alt="" ...>
<!--   alt pusty, brak opisu treści obrazka   -->
Przykład: niektóre zdjęcia prelegentów, loga sponsorów/organizatorów.
Kryteria sukcesu:
•   WCAG 2.1/2.2   –   1.1.1   Treść nietekstowa –   główne
Propozycje naprawy:
•   Wszystkie obrazy muszą mieć opis w atrybucie alt, np. „Zdjęcie dr Małgorzaty
Kempińskiej”, „Logo ActivLab Pharma”.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące korzystające z czytników ekranu.
NIEPRAWIDŁOWA STRUKTURA NAGŁÓWKÓW (H1 -H6)
Przykłady błędów (kod)
<h1><b>CEL KONFERENCJI:</b></h1>
<!-- potem h2, h3, h4, h3... brak logicznej hierarchii -->

--- STRONA 31 ---
30
Kolejność i hierarchia nagłówków jest zaburzona, nie zachowuje struktury
dokumentu.
Kryteria sukcesu:
•   WCAG 2.1/2.2   –   1.3.1 Informacje i relacje (główne)
•   2.4.6 Nagłówki i etykiety
Propozycje naprawy:
•   Popraw strukturę nagłówków –   jeden <h1> (tytuł strony), podtytuły jako <h2>,
sekcje <h3> itd.
•   Nagłówki powinny logicznie opisywać strukturę strony.
Kogo dotyczy:
•   Osoby niewidome, słabowidzące, osoby z trudnościami poznawczymi i
korzystające z czytników ekranu.
PRZYCISKI I LINKI BEZ WYSTARCZAJĄCEGO OPISU (ETYKIET)
Przykłady błędów (kod)
<a class="elementor-button elementor-button-link elementor-size-lg"
href="https://forms.gle/GwdPAq694t1S6NLh7">
<span class="elementor-button- text">Zapisuję się</span>
</a>
<!-- OK, ale... -->
<img decoding="async" ... class="wp-image-68844" alt="">
<!--   Przycisk „Zapisuję się” OK, ale obrazy - linki i niektóre ikony nie mają opisu   -->
Nie wszystkie przyciski, linki i obrazy- linki są jednoznacznie opisane. Niektóre ikony
mają tylko klasę lub pusty alt.
Kryteria sukcesu:
•   WCAG 2.1/2.2   –   2.4.4 Cel linku (w kontekście) –   główne
•   1.1.1 Tekst alternatywny
•   4.1.2 Nazwa, rola, wartość

--- STRONA 32 ---
31
Propozycje naprawy:
•   Wszystkie linki/przyciski muszą być opisane, żeby osoba z czytnikiem ekranu
wiedziała, gdzie prowadzi dany link lub co robi przycisk.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące.
PROBLEMY Z FORMULARZEM ZAPISU (LINK DO GOOGLE FORMS)
Przykłady błędów (kod)
<a class="elementor-button elementor-button-link elementor-size-lg"
href="https://forms.gle/GwdPAq694t1S6NLh7">
<span class="elementor-button- text">Zapisuję się</span>
</a>
•   Formularz otwiera się w nowym oknie, ale nie informuje o tym użytkownika.
•   Brak jasnej informacji o celu linku   –   np. „Formularz zapisu otwiera się w
nowym oknie”.
Kryteria sukcesu:
•   WCAG 2.1/2.2   –   3.2.2 Podczas wprowadzania danych
•   2.4.4 Cel linku   (w kontekście)
Propozycje naprawy:
•   Dodaj informację, że link otwiera się w nowym oknie/karcie.
•   Upewnij się, że formularz Google Forms jest również dostępny.
Kogo dotyczy:
•   Osoby z niepełnosprawnością wzroku, osoby mniej zaawansowane cyfrowo.
REKRUTACJA 25/26   →   PROGRAMY STUDIÓW
https://bip.cb.szczecin.pl/programy-
studiow/77,252/?_gl=1*dgz6ii*_gcl_au*MTc3NDY4MDgzMi4xNzQ4OTQxNzY1*_ga*
MTQxMDIwMzg5NC4xNzQ4OTM5Mzk1*_ga_38335XL1HS*czE3NTAwNzYyOTUkb
zckZzEkdDE3NTAwNzcxMzkkajU2JGwwJGgxNzU3NjM3MDE

--- STRONA 33 ---
32
BRAK DOSTĘPNOŚCI TREŚCI DLA CZYTNIKA EKRANU
Opis problemu:
Strona w praktyce jest   całkowicie niedostępna dla czytników ekranu   –   użytkownik
korzystający z czytnika (np. osoba niewidoma) nie jest w stanie uzyskać żadnej
informacji o dostępnych linkach, dokumentach, sekcjach. Treść jest „niewidzialna” dla
osób niewidomych.
Przykłady błędów :
•   Linki i treść są niewidoczne/nieczytelne dla czytnika ekranu.
•   Brak logicznej struktury nagłówków.
<p><strong>BEZPIECZEŃSTWO WEWNĘTRZNE –   STUDIA PIERWSZEGO
STOPNIA...</strong></p>
<!--   Brak nagłówków <h2>, <h3> –   tylko pogrubienie -->
<a href="pliki/s172s1701346685.pdf" target="_blank">Informacje ogólne o
kierunku</a>
<!--   Link, który nie jest wykrywany przez czytnik ekranu   -->
Kryteria sukcesu:
•   1.3.1 Informacje i relacje (główne)
•   4.1.2 Nazwa, rola, wartość (główne)
•   2.4.6 Nagłówki i etykiety
•   2.4.10 Sekcja i nagłówki ( AAA)
Propozycje naprawy:
•   Poprawić kod strony, aby linki, teksty i sekcje były widoczne dla czytników
ekranu.
•   Zastosować poprawne znaczniki nagłówków (<h2>, <h3>) zamiast tylko
pogrubienia.
•   Zapewnić, by cała zawartość (linki, dokumenty) była osiągalna i czytelna dla
asystujących technologii.

--- STRONA 34 ---
33
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytnika ekranu
•   Osoby starsze
BRAK STRUKTURY I LOGICZNEGO GRUPOWANIA DOKUMENTÓW
Opis problemu:
Lista dokumentów jest długa i nieczytelna –   brakuje nagłówków oddzielających
sekcje   (np. różne kierunki studiów, lata, rodzaje dokumentów). To utrudnia
zorientowanie się, czego dotyczą dokumenty i poruszanie się po stronie.
Przykłady błędów :
<!--   Wszystkie dokumenty pod jedną sekcją, brak nagłówków, wszystko jako lista   -->
<li><a href="zalacznik/77,252,0,249" target="_blank">PROGRAM STUDIÓW na
kierunku ...</a></li>
Kryteria sukcesu:
•   1.3.1 Informacje i relacje (główne)
•   2.4.6 Nagłówki i etykiety (główne)
•   2.4.10 Sekcja i nagłówki ( AAA)
Propozycje naprawy:
•   Podzielić dokumenty na sekcje (każdy kierunek studiów powinien mieć swój
nagłówek).
•   Każdy rodzaj dokumentu (np. „Program studiów”, „Efekty uczenia się”) także
powinien być pogrupowany.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
•   Wszyscy, którzy korzystają z nawigacji po nagłówkach

--- STRONA 35 ---
34
BRAK INFORMACJI O ROZSZERZENIU I ROZMIARZE PLIKU
Opis problemu:
Przy każdym linku do pobrania dokumentu   brakuje informacji, jaki to format pliku
(np. PDF, DOCX) i ile plik zajmuje (MB/kB) . Użytkownik nie wie, czy otworzy
stronę, czy pobierze plik i jaki program będzie potrzebny.
Przykłady błędów :
<a href="pliki/s172s1701346685.pdf" target="_blank">Informacje ogólne o
kierunku</a>
<!-- Brak (PDF, 1.2 MB) przy linku -->
Kryteria sukcesu:
•   2.4.4 Cel linku (główne)
•   2.4.9 Cel linku ( z samego łącza ) (AAA)
•   3.2.4 Spójność identyfikacji
Propozycje naprawy
•   Przy każdym dokumencie zamieścić informację o rozszerzeniu pliku i jego
rozmiarze, np. (PDF, 1.2 MB).
•   Jeśli dokument wymaga specjalnego programu, także to zaznaczyć.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby starsze
•   Osoby z trudnościami poznawczymi
POWTARZALNOŚĆ LINKÓW – NIEJEDNOZNACZNE ETYKIETY
Opis problemu:
Wiele linków do dokumentów ma taką samą nazwę (np. „Program studiów”), co jest
nieczytelne dla użytkownika czytnika ekranu –   nie wiadomo, do czego prowadzi dany
link.

--- STRONA 36 ---
35
Przykłady błędów :
<a href="...">Program studiów</a>
<a href="...">Program studiów</a>
<!--   Powtarzalność, brak informacji o kierunku, roku, typie dokumentu   -->
Kryteria sukcesu:
•   2.4.4 Cel linku ( w kontekście )   –   główne
•   2.4.9 Cel linku ( z samego łącza ) (AAA)
Propozycje naprawy
•   Każdy link powinien jasno opisywać, do jakiego dokumentu prowadzi (np.
„Program studiów –   Dietetyka I stopnia 2023/2024 (PDF, 1,2 MB)”).
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
•   Osoby starsze
SKIPLINK DO WYSZUKIWARKI NIE DZIAŁA POPRAWNIE
Opis problemu:
Przycisk „przejdź do wyszukiwarki” nie działa –   kliknięcie nie przenosi do pola
wyszukiwania, przez co osoby korzystające z klawiatury mają utrudnioną nawigację.
Przykłady błędów :
<a href="#skip_wyszukiwarka">wyszukiwarka</a>
<!-- Brak poprawnego elementu o id="skip_wyszukiwarka" -->
Kryteria sukcesu:
•   2.4.1   Możliwość pominięcia   bloków )
Propozycje naprawy:

--- STRONA 37 ---
36
•   Naprawić kotwicę –   dodać odpowiedni identyfikator (id) do wyszukiwarki, by
skiplink działał prawidłowo.
Kogo dotyczy:
•   Osoby korzystające wyłącznie z klawiatury
•   Osoby niewidome i słabowidzące
STREFA STUDENTA –> ERASMUS   →   O PROGRAMIE
https://www.cb.szczecin.pl/strefa-studenta/erasmus/o-programie/
BRAK LOGICZNEJ STRUKTURY NAGŁÓWKÓW NA STRONIE
Opis problemu:
Strona nie posiada prawidłowej hierarchii nagłówków. Jest tylko jeden główny
nagłówek <h1>O programie>. Pozostałe sekcje (np. „Erasmus for incoming
students”, „Studenci”, „Pracownicy”) nie mają nagłówków w kodzie, są tylko
pogrubione lub wyodrębnione w tabelach. Utrudnia to nawigację osobom
korzystającym z czytnika ekranu i sprawia, że nie można łatwo przeskakiwać
pomiędzy sekcjami.
Przykłady błędów :
<h1>O programie</h1>
<!-- Brak <h2> dla kolejnych sekcji -->
<div><strong>ERASMUS FOR INCOMING STUDENTS</strong></div>
<table>...</table>
Kryteria sukcesu:
•   1.3.1 Informacje i relacje   –   główne
•   2.4.6 Nagłówki i etykiety
•   2.4.10   Nagłówki sekcj i (AAA)
Propozycje naprawy:

--- STRONA 38 ---
37
•   Wprowadzić nagłówki <h2>, <h3> w miejscach, gdzie zaczynają się nowe
sekcje, np. przed każdą tabelą.
•   Zachować logiczną kolejność nagłówków, aby strona miała czytelną strukturę.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące korzystające z czytników ekranu
•   Osoby z trudnościami poznawczymi
•   Osoby starsze
LINKI DO POBRANIA DOKUMENTÓW SĄ NIEJEDNOZNACZNE I
POWTARZALNE
Opis problemu:
Wszystkie linki do dokumentów w tabelach mają taką samą etykietę („POBIERZ” lub
„Pobierz”), przez co osoba korzystająca z czytnika ekranu nie wie, czego dotyczy
dany link.
Nie ma również informacji o typie i rozmiarze pliku do pobrania.
Przykłady błędów:
<td><a href=".../ECHE_2021_2027_CB.pdf">POBIERZ</a></td>
<td><a href=".../4.-Staff-mobility-agreement-for-training.docx">POBIERZ</a></td>
<!--   Powtarzająca się etykieta, brak informacji o pliku   -->
Kryteria sukcesu:
•   2.4.4 Cel linku ( w kontekście) –   główne
•   2.4.9 Cel linku ( z samego łącza) (AAA)
•   1.3.1 Informacje i relacje
•   4.1.2 Nazwa, rola, wartość
Propozycje naprawy:
•   Zamiast samego „POBIERZ”, opisywać linki w pełni, np. „Pobierz: ECHE –
Erasmus Charter for Higher Education (PDF, 1,2 MB)”.

--- STRONA 39 ---
38
•   Wskazać format i rozmiar pliku (np. PDF, DOCX, 1,2 MB).
•   Każdy link powinien być jednoznacznie opisany, żeby użytkownik wiedział, co
pobiera.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
•   Osoby starsze
BRAK INFORMACJI O DOSTĘPNOŚCI PLIKÓW DO POBRANIA
Opis problemu:
Na stronie nie ma informacji, czy dokumenty do pobrania (PDF, DOCX) są
przygotowane w sposób dostępny cyfrowo –   np. czy pliki PDF mają strukturę,
nagłówki, możliwość czytania przez czytniki ekranu.
Przykłady błędów:
<a href=".../3.-Informacja-o-programie-Erasmus.docx">POBIERZ</a>
<!--   Brak informacji o dostępności pliku   -->
Kryteria sukcesu:
•   1.1.1   Treść nietekstowa –   główne
•   1.3.1 Informacje i relacje
•   4.1.2 Nazwa, rola, wartość
Propozycje naprawy:
•   Udostępniać dokumenty zgodnie ze standardami dostępności (np. PDF/UA).
•   Zamieszczać krótką informację, że plik jest dostępny cyfrowo lub –   jeśli nie –
wskazać alternatywny sposób uzyskania informacji.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytników ekranu

--- STRONA 40 ---
39
OBRAZY BEZ OPISÓW ALTERNATYWNYCH LUB Z NIEADEKWATNYM
OPISEM
Opis problemu:
Na stronie są obrazy (np. baner, logo, grafiki partnerów), które nie mają opisu
alternatywnego (alt="") lub opis jest nieadekwatny. Przez to osoby korzystające z
czytnika ekranu nie otrzymują żadnej informacji o tym, co znajduje się na obrazku.
Przykłady błędów:
<img src=".../erazmus2.jpg" alt="">
<img src=".../logo_klaster.svg" alt="Organizacja IT w województwie
zachodniopomorskim">
Kryteria sukcesu:
•   1.1.1   Treść nietekstowa
Propozycje naprawy:
•   Dodać sensowne opisy alternatywne do wszystkich obrazków, które zawierają
treść lub mają znaczenie informacyjne.
•   Jeśli obraz jest dekoracyjny, użyć pustego alt="".
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
BRAK MOŻLIWOŚCI NAWIGACJI DO GŁÓWNYCH SEKCJI STRONY Z
POZIOMU KLAWIATURY (SKIP LINKI)
Opis problemu:
Nie ma widocznych lub prawidłowo działających skip linków (np. „przejdź do treści
głównej”), co utrudnia szybkie pominięcie menu i przejście do najważniejszych
informacji.
Przykłady błędów:
<!-- Brak skiplinku -->
Odniesienie do kryteriów sukcesu:

--- STRONA 41 ---
40
•   Główne:   2.4.1   Możliwość pominięcia   bloków
Propozycje naprawy:
•   Dodać widoczny po wejściu z klawiatury skiplink, który pozwala szybko przejść
do treści głównej strony.
Kogo dotyczy:
•   Osoby korzystające wyłącznie z klawiatury
•   Osoby niewidome i słabowidzące
NIEPRAWIDŁOWA STRUKTURA TABEL – BRAK NAGŁÓWKÓW KOLUMN
Opis problemu:
Tabele z dokumentami nie posiadają prawidłowych nagłówków kolumn (<th>), przez
co czytniki ekranu nie informują użytkownika o zawartości każdej kolumny. Dla osób
korzystających z czytników ekranu tabele są trudne do zrozumienia.
Przykłady błędów:
<table>
<tr>
<td><strong>Załącznik</strong></td>
<td><strong>Do pobrania</strong></td>
</tr>
<!--   Zamiast <th> użyto <td> i <strong>   -->
Kryteria sukcesu:
•   1.3.1 Informacje i relacje   –   główne
•   4.1.2 Nazwa, rola, wartość
Propozycje naprawy:
•   Zastosować nagłówki tabel (<th>) dla tytułów kolumn i wierszy.
Kogo dotyczy:

--- STRONA 42 ---
41
•   Osoby niewidome i słabowidzące
•   Osoby z trudnościami poznawczymi
KOLORYSTYKA I KONTRAST
Opis problemu:
Niektóre elementy graficzne lub teksty mogą mieć zbyt niski kontrast w stosunku do
tła (np. jasny pomarańczowy tekst na białym tle). Utrudnia to czytanie osobom
słabowidzącym i starszym.
Przykłady błędów :
<span style="color: #ff7b00;"><b>REKRUTACJA 25/26</b></span>
<!--   Pomarańczowy na białym tle   -->
Kryteria sukcesu:
•   1.4.3 Kontrast (minimalny)   –   główne
•   1.4.11 Kontrast elementów nietekstowych
Propozycje naprawy:
•   Zwiększyć kontrast tekstów względem tła, używać wyraźniejszych kolorów
zgodnie z wymaganiami WCAG.
Kogo dotyczy:
•   Osoby słabowidzące
•   Osoby starsze
•   Osoby z dysleksją
NIEPRAWIDŁOWE STREFA STUDENTA   →   ERASMUS   →
UCZELNIE PARTNERSKIE
https://www.cb.szczecin.pl/strefa-studenta/erasmus/uczelnie-partnerskie/
, PUSTE LUB ZBĘDNE ELEMENTY LISTY
Opis problemu:

--- STRONA 43 ---
42
W sekcji „Uczelnie partnerskie” znajdują się puste elementy <li>, które są
odczytywane przez czytniki ekranu jako „pusta pozycja”. Powoduje to dezorientację i
wydłuża czas zapoznania się z listą.
Przykłady błędów:
<ul>
<li>USAK UNIVERSITY, kod uczelni: TR USAK01- Turcja ...</li>
<li></li>
<li>UNIVERSITY OF OSTRAVA, kod uczelni: CZ OSTRAWA02- Czechy ...</li>
<li></li>
<!-- kolejne puste <li> -->
</ul>
Kryteria sukcesu:
•   1.3.1 Informacje i relacje   –   główne
•   1.1.1 Treść nietekstowa
Propozycje naprawy:
•   Usunąć wszystkie puste elementy <li>.Zapewnić, by lista była czytelna
i   zawierała tylko merytoryczne informacje.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytników ekranu
BRAK OPISÓW ALTERNATYWNYCH (ALT)
Opis problemu:
Obraz w sekcji nagłówkowej (banner) nie posiada opisu alternatywnego (atrybut alt
jest pusty). Dla osób niewidomych grafika jest niewidoczna, a jej kontekst nie jest
zrozumiały.
Przykłady błędów:

--- STRONA 44 ---
43
<img fetchpriority="high" decoding="async" src="https://collegiumbalticum.b-
cdn.net/wp-content/uploads/2021/04/erazmus2.jpg" alt="">
Kryteria sukcesu:
•   1.1.1 Treść nietekstowa   –   główne
Propozycje naprawy:
•   Wpisać w atrybut alt zwięzły, opisowy tekst mówiący, co przedstawia grafika,
np. „Uczestnicy programu Erasmus+” lub „Baner programu Erasmus+”.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytników ekranu
NIEWYSTARCZAJĄCE ETYKIETY LINKÓW – BRAK OPISU CELU LINKU
Opis problemu:
Linki do partnerskich uczelni w sekcji listy nie zawsze jasno opisują, dokąd prowadzą
–   użytkownik czytnika ekranu słyszy tylko adres URL, nie wie, jaka uczelnia jest pod
linkiem.
Przykład błędu (kod):
•   <a
href="https://www.usak.edu.tr/Home/Index/Ingilizce">https://www.usak.edu.tr/
Home/Index/Ingilizce</a>
•   <a href="http://www.osu.eu/">http://www.osu.eu/</a>
Linki mają jako tekst tylko adresy, nie są opisane,   nie wiadomo dokąd prowadzą
bez przeczytania otoczenia.
Kryteria sukcesu WCAG:
•   2.4.4 Cel linku ( w kontekście )   –   główne
•   1.3.1 Informacje i relacje
Propozycje naprawy:
•   Zamień tekst linku na   opisową etykietę : np. „Strona USAK UNIVERSITY
(nowe okno)”

--- STRONA 45 ---
44
•   Jeśli otwierają się w nowym oknie, dodaj taką informację w tekście lub
atrybucie aria-label.
Grupy użytkowników:
•   Osoby korzystające z czytników ekranu, osoby z trudnościami poznawczymi,
seniorzy.
ZBYT NISKIE KONTRASTY KOLORYSTYCZNE
Przykład błędu (kod):
•   Elementy pomarańczowe na białym (<span style="color: #ff7b00;">),
jasnoszare fonty na białym lub jasnym tle.
Kryteria sukcesu WCAG:
•   1.4.3 Kontrast (minimum)   –   główne
•   1.4.11 Kontrast elementów nietekstowych
Propozycje naprawy:
•   Sprawdź kontrast tekstu i elementów interaktywnych –   minimum 4.5:1 dla
tekstu zwykłego, 3:1 dla dużych fontów.
•   W razie potrzeby zmodyfikuj kolory tekstu lub tła.
Grupy użytkowników:
•   Osoby słabowidzące, seniorzy, osoby korzystające z ekranów o niskim
kontraście.
UCZELNIA   →   DZIAŁALNOŚĆ   →   ZESZYTY NAUKOWE
https://www.cb.szczecin.pl/dzialalnosc-naukowa/zeszyty-naukowe-cb/
BRAK MOŻLIWOŚCI OBSŁUGI KLAWIATURĄ ZAKŁADEK (TABS)
Opis problemu:
Zakładki „Zeszyty nr 1–14”, „Periodyk popularno - naukowy”, „Książki projektowe” oraz
odpowiadające im obrazy i treści   nie są obsługiwane klawiaturą . Nie można

--- STRONA 46 ---
45
zmienić zakładki za pomocą Tab/Enter/Spacji, co uniemożliwia korzystanie osobom,
które nie używają myszy.
Przykład błędu (kod):
<a class="active" data-index="1">Zeszyty nr 1</a>
<a class="" data-index="2">Zeszyty nr 2</a>
<!-- ... -->
Brak role="tab", tabindex="0", aria- selected, obsługi Enter/Spacji, czytelnej nawigacji.
Kryteria sukcesu:
•   2.1.1 Klawiatura   –   główne
•   2.4.3 Kolejność fokusu
•   4.1.2 Nazwa, rola, wartość
Propozycja naprawy:
•   Zmień sposób działania zakładek, by można było przełączać się między nimi
klawiaturą (Tab przenosi na każdą, Enter/Spacja wybiera).
•   Dodaj odpowiednie atrybuty dostępności (role="tablist", role="tab", aria -
selected, tabindex).
•   Przetestuj przełączanie zakładek samą klawiaturą.
•   Upewnij się, że aktywna treść się zmienia i jest widoczna/ukrywana zgodnie z
wyborem.
Dla kogo problem ma znaczenie:
•   Osoby z niepełnosprawnością ruchu (nieużywające myszy, korzystające tylko
z klawiatury, przełączników, urządzeń alternatywnych)
•   Osoby niewidome i niedowidzące
NIEPRAWIDŁOWA STRUKTURA NAGŁÓWKÓW I SEKCJI
Opis problemu:
Tytuły poszczególnych sekcji (np. „Zeszyty nr 1”, „Książki projektowe”, „Partnerzy

--- STRONA 47 ---
46
Uczelni”) nie zawsze są oznaczone nagłówkami (h2/h3 itd.), przez co struktura
dokumentu jest nieczytelna dla czytników ekranu.
Przykład błędu:
<div class="section-title wow fadeIn">
<div class="container width-2">
<h2></h2>
</div>
</div>
Brak konsekwencji i spójności –   puste nagłówki, teksty nie są zawsze nagłówkami.
Kryteria sukcesu:
•   1.3.1 Informacje i relacje
•   2.4.6 Nagłówki i etykiety
Propozycja naprawy:
•   Użyj odpowiednich nagłówków (h1 dla głównego tytułu, h2 dla sekcji, h3 dla
podsekcji).
•   Uporządkuj strukturę strony, by można było „skanować” treść samymi
nagłówkami.
•   Usuń puste nagłówki.
Dla kogo problem ma znaczenie:
•   Osoby korzystające z czytników ekranu
•   Osoby z trudnościami poznawczymi
BRAK LOGICZNYCH ETYKIET DLA PRZYCISKÓW I ELEMENTÓW
NAWIGACYJNYCH
Opis problemu:
Przyciski (np. w menu, zakładki) nie mają ról ani opisów ułatwiających identyfikację
przez czytnik ekranu.

--- STRONA 48 ---
47
Przykład błędu:
<a class="active" data-index="1">Zeszyty nr 1</a>
Brak role="tab", aria-controls, aria-selected.
Kryteria sukcesu:
•   4.1.2 Nazwa, rola, wartość
Propozycja naprawy:
•   Oznacz wszystkie zakładki i przyciski ich rolą (np. role="tab", role="button"),
nazwą i stanem (aria -selected).
•   Dodaj tekstowe opisy tam, gdzie są tylko ikony lub elementy bez opisu.
Dla kogo problem ma znaczenie:
•   Osoby korzystające z czytników ekranu, niedowidzące, z trudnościami
poznawczymi
BRAK POWIADOMIEŃ I ETYKIET DLA LINKÓW PROWADZĄCYCH POZA
STRONĘ / OTWIERAJĄCYCH NOWE OKNO
Opis problemu:
Niektóre linki otwierają się w nowym oknie, ale nie jest to zapowiedziane w treści
linku ani przez atrybut ARIA.
Przykład błędu:
<a target="_blank" rel="noopener" href="...">Zeszyty naukowe nr 14</a>
Kryteria sukcesu:
•   3.2.5 Zmiana na żądanie użytkownika   (AAA)
•   2.4.4 Cel linku (w kontekście)
Propozycja naprawy:
•   Informuj użytkownika, gdy link otworzy się w nowym oknie (np. w treści:
„(otwiera się w nowym oknie)”).
•   Możesz dodać wizualną ikonę i odpowiedni opis ARIA.

--- STRONA 49 ---
48
Dla kogo problem ma znaczenie:
•   Osoby z niepełnosprawnością wzroku, poznawcze, seniorzy
PROBLEMY Z KONTRASTEM TEKSTU
Opis problemu:
Niektóre teksty na stronie (np. jasnoszare na białym tle lub pomarańczowe napisy)
mogą mieć zbyt niski kontrast, przez co są słabo czytelne.
Przykład błędu:
Brak bezpośredniego fragmentu w kodzie, ale widoczne po stronie.
Kryteria sukcesu:
•   1.4.3 Kontrast (minimum)
•   1.4.11 Kontrast elementów nietekstowych
Propozycja naprawy:
•   Upewnij się, że każdy tekst ma odpowiedni kontrast do tła (minimum 4,5:1 dla
tekstu zwykłego, 3:1 dla dużego).
•   Zmień kolory na ciemniejsze, jeśli obecne są zbyt jasne.
Kogo dotyczy:
•   Osoby słabowidzące, seniorzy, osoby z daltonizmem, korzystający na
słońcu/mobilnie
BRAK JEDNOZNACZNEJ INFORMACJI O JĘZYKU SEKCJI LUB TEKSTU
Opis problemu:
Strona jest po polsku, ale fragmenty (np. nazwy sekcji lub tytuły plików, teksty
przycisków) mogą być po angielsku lub innym języku, bez odpowiedniego
oznaczenia.
Przykład błędu:
Brak lang="en" w elementach typu „E - book”, „GOOD PRACTICES”.
Kryteria sukcesu:
•   3.1.2 Język części

--- STRONA 50 ---
49
Propozycja naprawy:
•   Dodaj odpowiedni atrybut języka do fragmentów tekstu w innym języku (np.
<span lang="en">E-book</span>).
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu, osoby uczące się języka polskiego
UCZELNIA   →   DZIAŁALNOŚĆ –KONFERENCJE NAUKOWE
https://www.cb.szczecin.pl/konferencje/
MULTIMEDIA (FILMY YOUTUBE)
Opis problemu:
•   Brak alternatyw tekstowych do materiałów wideo   (transkrypcje, napisy PL
lub PL-EN, streszczenie).
•   Brak audiodeskrypcji.
Przykłady błędów (fragment kodu):
<iframe title="(Nagranie z Konferencji) Edukacja włączająca..."
src="https://www.youtube.com/embed/GSVjTq8bIk4?feature=oembed&autoplay=1">
</iframe>
<!-- Brak transkrypcji, napisu, audiodeskrypcji -->
Kryteria sukcesu:
•   1.2.2 Napisy rozszerzone (nagranie)
•   1.2.5 Audiodeskrypcja
•   2.2.2 Pauza, zatrzymanie, ukrycie
Propozycje naprawy:
•   Dodaj   transkrypcje tekstowe   pod filmami lub w opisie filmu.
•   Dodaj   napisy   (PL/EN) do materiałów wideo.
•   Wyłącz automatyczne odtwarzanie filmów.

--- STRONA 51 ---
50
•   Rozważ audiodeskrypcję dla kluczowych materiałów.
Kogo dotyczy:
•   Osoby niesłyszące, słabosłyszące.
•   Osoby niewidome (audiodeskrypcja).
•   Osoby nadwrażliwe na dźwięk i osoby z trudnościami poznawczymi.
OFERTA – STUDIA LICENCJACKIE
https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/
NIEWŁAŚCIWE WYKORZYSTANIE NAGŁÓWKÓW
Opis problemu:
Strona używa nagłówków w nieuporządkowany sposób, brakuje logicznej hierarchii
(h1, h2, itd.). Niektóre ważne sekcje (np. opisy kierunków studiów) są w ogóle
pozbawione nagłówków lub są oznaczone jako zwykły tekst, a nie nagłówki.
Przykład kodu:
<h1><span style="color:#ea8314;text-shadow:1px 1px 0 grey;">Studia
licencjackie</span></h1>
<h6><span style="color:#fff;text-shadow:1px 1px 0 grey;">Studia licencjackie z
Pedagogiki, ...</span></h6>
...
<p class="title">Pedagogika   –   studia licencjackie <br /> ( czesne   –   580 zł/msc )</p>
Kryteria sukcesu WCAG:
•   1.3.1 Informacje i relacje   –   główne
•   2.4.6   Nagłówki i etykiety
•   1.3.2   Zrozumiała   kolejność
Propozycje naprawy:
•   Poprawić strukturę nagłówków (h1, h2, h3 itd.) zgodnie z hierarchią treści.

--- STRONA 52 ---
51
•   Każda sekcja (kierunek studiów) powinna być oznaczona jako nagłówek, np.
h2, a szczegóły jako h3.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące korzystające z czytników ekranu, osoby z
trudnościami poznawczymi.
NIEDOSTĘPNE SEKCJE Z INFORMACJAMI O KIERUNKACH STUDIÓW
Opis problemu:
Sekcje z opisami kierunków studiów (np. „Pedagogika –   studia licencjackie”,
„Dietetyka –   studia licencjackie” itd.) są rozbudowanymi elementami, które można
rozwinąć i zwinąć. Niestety, są one realizowane jako zwykłe bloki <div> i <p>, nie są
dostępne z poziomu klawiatury, nie mają też przypisanych ról (np. rola button dla
nagłówka sekcji), ani nie komunikują stanu rozwinięcia/zwinięcia.
Przykład kodu:
<div class="question wow fadeIn">
<p class="title">Pedagogika   –   studia licencjackie <br /> ( czesne   –   580 zł/msc )</p>
<div class="hide">
<div class="text">...</div>
</div>
</div>
Kryteria sukcesu WCAG:
•   2.1.1 Klawiatura (kluczowe)   –   elementy, które zmieniają swój stan, muszą być
obsługiwalne klawiaturą.
•   4.1.2 Nazwa, rola, wartość   –   interaktywne elementy muszą być
rozpoznawalne jako przyciski/rozwijane sekcje przez czytniki ekranu.
•   2.4.7 Widoczny fokus   –   musi być widoczne, który element jest zaznaczony
klawiaturą.
•   1.3.1 Informacje i relacje   –   struktura powinna być zrozumiała i logiczna.

--- STRONA 53 ---
52
Propozycje naprawy:
•   Zamiast zwykłego <p class="title">, nagłówek sekcji powinien być elementem
przycisku (<button>) lub mieć rolę button i atrybuty ARIA (aria -expanded, aria-
controls).
•   Sekcje rozwijane powinny być otwierane i zamykane zarówno myszą, jak i
klawiaturą (Tab + Enter/Spacja).
•   Stan rozwinięcia/zwinięcia (otwarta/zamknięta) powinien być komunikowany
przez aria-expanded="true/false".
•   Każda sekcja powinna mieć widoczny wskaźnik fokusa przy nawigacji
klawiaturą.
Kogo dotyczy:
•   Osoby korzystające z klawiatury (np. osoby z niepełnosprawnością ruchową,
osoby z urazami, osoby starsze).
•   Osoby korzystające z czytników ekranu (np. osoby niewidome, słabowidzące).
•   Osoby z trudnościami poznawczymi (lepsza nawigacja, przewidywalność).
BRAK TEKSTU ALTERNATYWNEGO LUB OPISOWEGO DLA GRAFIK
„PRZYCISKÓW”
Opis problemu:
Przyciski zapisów są graficzne (img z „Zapisz się button”), ale ich tekst alternatywny
jest zbyt ogólny i nie oddaje celu (np. „Zapisz się button”).
Przykład kodu:
<img alt="Zapisz się button" width="261" height="138" nitro -lazy-src="..." class="..."
/>
Kryteria sukcesu WCAG:
•   1.1.1   Treść nietekstowa
•   2.4.4 Cel linku ( w kontekście)
•   4.1.2   Nazwa, rola, wartość

--- STRONA 54 ---
53
Propozycje naprawy:
•   Uzupełnić atrybut alt o opis celu, np. „Zapisz się na studia licencjackie –
przycisk”.
•   Jeśli to element linkujący –   użyć tekstowego przycisku lub zadbać o dobre
połączenie <a> z tekstem.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu, osoby z niską przepustowością
Internetu (obrazy się nie ładują).
NIEPRAWIDŁOWE ZNACZNIKI LIST (NADUŻYCIE <P>, BRAK <UL>/<LI>)
Opis problemu:
Listy specjalizacji, kierunków, itd. są oznaczane jako wiele paragrafów <p>, nie jako
prawdziwe listy (<ul>, <li>).
Przykład kodu:
<p> –   Pedagogika społeczna i wspomagania rodziny...</p>
<p> –   Pedagogika senioralna i opieki nad osobami starszymi...</p>
Kryteria sukcesu WCAG:
•   1.3.1 Informacje i relacje   –   główne
Propozycje naprawy:
•   Zastąpić sekwencje <p> prawdziwymi listami <ul> i <li>.
•   Zachować przejrzystość i semantykę.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu, osoby z trudnościami poznawczymi.
ZBYT NISKI KONTRAST NIEKTÓRYCH TEKSTÓW (NP. NAGŁÓWKI
SLIDERA)

--- STRONA 55 ---
54
Opis problemu:
Niektóre teksty, np. w sliderze („Studia licencjackie” na pomarańczowym tle, teksty z
cieniami na zdjęciach), mogą mieć za niski kontrast w stosunku do tła.
Przykład kodu:
<h1><span style="color:#ea8314;text-shadow:1px 1px 0 grey;">Studia
licencjackie</span></h1>
Kryteria sukcesu WCAG:
•   1.4.3 Kontrast minimalny   –   główne
•   1.4.11   Kontrast elementów nietekstowych
Propozycje naprawy:
•   Zwiększyć kontrast pomiędzy tekstem a tłem zgodnie z wymaganiami WCAG
(min. 4.5:1 dla tekstu, 3:1 dla dużego tekstu).
•   Usunąć efekty tekstu, które pogarszają czytelność.
Kogo dotyczy:
•   Osoby słabowidzące, starsze, użytkownicy ekranów o niskiej jakości.
NIEJASNE ETYKIETY PRZYCISKÓW I LINKÓW (NP. „INNE KIERUNKI”)
Opis problemu:
Niektóre linki lub przyciski są niejasne, np. „Inne kierunki”, „Zapisz się button” –
trudno zrozumieć bez kontekstu, dokąd prowadzą.
Przykład kodu:
<a href="/rekrutacja" title="Studia licencjackie i magisterskie" class="default-button
bigger white tag">
<span>Inne kierunki</span> Rekrutacja
</a>
Kryteria sukcesu WCAG:
•   2.4.4 Cel linku   (w kontekście )

--- STRONA 56 ---
55
•   3.3.2 Etykiety i instrukcje
Propozycje naprawy:
•   Doprecyzować etykiety linków i przycisków, np. „Rekrutacja na inne kierunki
studiów”.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu, osoby z trudnościami poznawczymi.
STREFA STUDENTA – POMOC TECHNICZNA
https://nauczaniezdalne.cb.szczecin.pl/?_gl=1*sidty9*_gcl_au*MTc3NDY4MDgzMi4x
NzQ4OTQxNzY1*_ga*MTQxMDIwMzg5NC4xNzQ4OTM5Mzk1*_ga_38335XL1HS*c
zE3NTAwOTM2MDAkbzgkZzAkdDE3NTAwOTM2MDAkajYwJGwwJGg1NjQ1NjMw
NzY.
BRAK PRAWIDŁOWEJ STRUKTURY NAGŁÓWKÓW
Opis problemu:
Na stronie brakuje logicznej, hierarchicznej struktury nagłówków. Zamiast
konsekwentnie używać znaczników <h1>, <h2>, <h3>, część tytułów (np.
"MOODLE", "MS TEAMS") jest oznaczona jako <h5>, a główny tytuł to <h2>. Brak
nadrzędnego <h1>.
Przykład kodu:
<h2 class="text-center">SYSTEMY ZDALNEGO NAUCZANIA COLLEGIUM
BALTICUM</h2>
...
<h5 class="mt-0 mb-1">MOODLE&nbsp;</h5>
Kryteria sukcesu WCAG:
•   1.3.1 Informacje i relacje -   główne
•   2.4.6 Nagłówki i etykiety
Propozycje naprawy:

--- STRONA 57 ---
56
•   Dodaj jeden, unikatowy nagłówek <h1> na początku strony (np. tytuł strony).
•   Zachowaj hierarchię –   <h2> dla głównych sekcji, <h3> dla podsekcji itp.
•   Używaj nagłówków tylko do oznaczania tytułów sekcji, a nie do stylowania
tekstu.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące korzystające z czytników ekranu (nawigacja
po nagłówkach).
•   Osoby z trudnościami poznawczymi (lepsze zrozumienie struktury strony).
BRAK OPISÓW ALTERNATYWNYCH (ALT) DLA OBRAZÓW
INFORMACYJNYCH
Opis problemu:
Nie wszystkie obrazy mają prawidłowe i informatywne opisy alternatywne.
Przykład:
<img class="d-block w-100" src="../unnamed2.png" alt="First slide">
<img src="../CB_moodle.png" alt="Card image cap" ...>
<img src="../office2.png" alt="Card image cap" ...>
Opisy „First slide” czy „Card image cap” nie są zrozumiałe i nie opisują treści obrazu.
Kryteria sukcesu WCAG:
•   1.1.1 Treść nietekstowa   –   główne
Propozycje naprawy:
•   Nadaj wszystkim obrazom sensowne opisy alternatywne, np. alt="Logo
Moodle", alt="Logo MS Teams", alt="Zdalne nauczanie Collegium Balticum".
•   Jeśli obraz jest czysto dekoracyjny, użyj alt="".
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu).

--- STRONA 58 ---
57
LINKI BEZ OPISOWEGO TEKSTU I POWTARZAJĄCE SIĘ ADRESY JAKO
TEKST LINKU
Opis problemu:
W kilku miejscach adres URL jest używany jako tekst linku lub jako powtarzający się
tekst linku, co utrudnia zrozumienie celu odnośnika.
Przykład:
<p><a href="https://www.cb.szczecin.pl/procedura-oddzyskiwania-
hasla.pdf">alternatywnej procedury</a> odzyskiwania hasła   -&gt;&nbsp;</p>
<p><a href=" https://support.microsoft.com/pl-
pl/teams">https://support.microsoft.com/pl-pl/teams</a></p>
<p><a href=" https://www.microsoft.com/pl-pl/education/remote-learning">
https://www.microsoft.com/pl-pl/education/remote-learning </a> </p>
Takie linki są nieprzyjazne dla czytników ekranu i nie informują o celu.
Kryteria sukcesu WCAG:
•   2.4.4 Cel linku ( w kontekście )
Propozycje naprawy:
•   Tekst linku powinien jasno opisywać jego cel, np. „Instrukcja odzyskiwania
hasła w Moodle (PDF)”, „Pomoc techniczna Microsoft Teams”.
•   Unikaj samych adresów jako tekstu linku.
Kogo ddotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu).
•   Osoby z trudnościami poznawczymi.
BRAK ODPOWIEDNIEGO KONTRASTU TEKSTU (SZCZEGÓLNIE
KOMUNIKATY W KOLORZE)
Opis problemu:
Na stronie znajdują się komunikaty w kolorze czerwonym i pomarańczowym na
białym tle, które mogą mieć za niski kontrast, np.:

--- STRONA 59 ---
58
<p style="color:red;"> <b>UWAGA WAŻNA INFORMACJA!!! </b></p>
<p style="color:orange;">To pierwszy krok w celu uzyskania hasła do konta MS
TEAMS. </p>
Może nie spełniać wymagań kontrastu 4.5:1 dla tekstu zwykłego i 3:1 dla dużego
tekstu.
Kryteria sukcesu WCAG:
•   1.4.3 Kontrast (minimalny)   –   główne
•   1.4.1 Użycie koloru   –   informacje nie mogą być przekazywane wyłącznie
kolorem
Propozycje naprawy:
•   Zapewnij kontrast min. 4.5:1 dla tekstu zwykłego.
•   Nie polegaj tylko na kolorze do przekazywania istotnych informacji   –   dodaj
ikony, ramki lub tekstowe oznaczenia („Uwaga”, „Ważne” itp.).
Kogo dotyczy:
•   Osoby słabowidzące
•   Osoby starsze
BRAK INFORMACJI O JĘZYKU STRONY I JĘZYKU FRAGMENTÓW
Opis problemu:
W nagłówku jest ustawiony język "en", a całość treści jest po polsku. Czytniki ekranu
będą domyślnie czytać wszystko po angielsku.
Przykład kodu:
<html lang="en">
Kryteria sukcesu WCAG:
•   3 .1.1 Język strony
•   3.1.2 Język części
Propozycje naprawy:

--- STRONA 60 ---
59
•   Zmień wartość lang na "pl" w znaczniku <html>.
•   Jeśli pojawią się fragmenty po angielsku, oznacz je np. <span
lang="en">...</span>.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu)
•   Osoby z trudnościami poznawczymi
PROBLEMY SEMANTYCZNE I PUSTE ELEMENTY
Opis problemu:
Na stronie znajdują się puste paragrafy, niewłaściwie użyte <br>, oraz niepotrzebne
znaczniki (np. <p>&nbsp;</p>), co utrudnia nawigację użytkownikom technologii
asystujących.
Przykład kodu:
<p class="card-text">&nbsp;</p>
</br>
Kryteria sukcesu WCAG:
•   1.3.1 Informacje i relacje
•   4.1.1 P oprawność kodu (p arsowanie)
Propozycje naprawy:
•   Usuń puste znaczniki i zbędne przerwy.
•   Do oddzielania sekcji używaj CSS zamiast pustych paragrafów.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu
STREFA STUDENTA   →   WSPARCIE STUDENTA
https://www.cb.szczecin.pl/strefa-studenta/wsparcie-studenta/
NIEWYSTARCZAJĄCE OPISY ALTERNATYWNE DLA OBRAZÓW

--- STRONA 61 ---
60
Opis problemu:
Obraz główny sekcji ma opis alternatywny, ale nie przekazuje istotnej informacji
("Wsparcie Studentów z Niepełnosprawnością"). Jeśli obraz nie zawiera
dodatkowych informacji, można użyć pustego alt. Jeśli jest informacyjny (np. baner z
tekstem), opis powin ien odzwierciedlać zawartość.
Przykład błędu :
<img ... alt="Wsparcie Studentów z Niepełnosprawnością">
•   Jeśli obraz jest dekoracyjny, powinno być alt="".
•   Jeśli informacyjny, alt powinien opisać treść (np. „Baner: Wsparcie dla
studentów z niepełnosprawnościami”).
Kryteria sukcesu:
•   1.1.1 Treść nietekstowa
Propozycje naprawy:
•   Dla dekoracyjnych grafik   –   alt="".
•   Dla banerów z tekstem –   alt musi zawierać tekst z obrazka.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
SEKCJE WSPARCIA – BRAK DOSTĘPNOŚCI Z KLAWIATURY
Opis problemu:
Sekcje wsparcia („FAQ”, np. „Wsparcie dydaktyczne”, „Wsparcie naukowe”, itd.)   nie
są obsługiwane z poziomu klawiatury . Otwieranie i zamykanie sekcji jest możliwe
tylko myszą (kliknięciem), natomiast osoby korzystające wyłącznie z klawiatury nie
mogą rozwinąć tych sekcji (tytuły są zwykłymi paragrafami <p> zamiast przycisków
lub linków).
Przykład błędu :
<p class="title">WSPARCIE DYDAKTYCZNE</p>

--- STRONA 62 ---
61
<div class="hide">...</div>
•   Brak elementu typu <button>, <a>, brak obsługi klawiatury (Tab/Enter/Spacja),
brak semantyki ARIA.
Kryteria WCAG:
•   2.1.1 Klawiatura   –   główne
•   4.1.2 Nazwa, rola, wartość
Propozycje naprawy:
•   Zastąp obecne tytuły sekcji elementami <button>, które kontrolują widoczność
powiązanej sekcji treści.
•   Zapewnij, by po najechaniu klawiszem Tab można było aktywować każdą
sekcję FAQ (Enter/Spacja otwiera/zamyka).
•   Dodaj odpowiednie atrybuty ARIA (aria-expanded, aria-controls), aby
użytkownicy czytników ekranu otrzymywali prawidłową informację o stanie
rozwoju sekcji.
•   Upewnij się, że każda sekcja może być rozwijana i zwijana bez użycia myszy.
Kogo dotyczy:
•   Osoby korzystające tylko z klawiatury
•   Osoby z niepełnosprawnością ruchową
•   Osoby niewidome i słabowidzące (również z czytnikami ekranu)
NIEWYSTARCZAJĄCY KONTRAST TEKSTU I TŁA
Opis problemu:
Niektóre elementy na stronie (np. linki w menu, etykiety, rozwijane sekcje) mogą
mieć niewystarczający kontrast kolorów względem tła, szczególnie na banerach i w
menu nawigacyjnym.
Kryteria sukcesu:
•   1.4.3 Kontrast (minimum)   –   główne

--- STRONA 63 ---
62
•   1.4.11 Kontrast elementów nietekstowych
Propozycje naprawy:
•   Zapewnij minimalny kontrast 4.5:1 dla tekstu i 3:1 dla dużych
tekstów/przycisków.
•   Przetestuj kolory na różnych urządzeniach i trybach wyświetlania.
Kogo dotyczy:
•   Osoby słabowidzące, starsze
TEKSTY LINKÓW I DOSTĘPNOŚĆ LINKÓW E-MAIL
Opis problemu:
Niektóre linki mailowe nie mają opisowego tekstu (np. sam adres e -mail jako tekst
linku). Linki typu „pobierz” nie zawierają informacji o formacie i wielkości pliku.
Przykład błędu :
<a href="https://www.cb.szczecin.pl/wp-content/uploads/2025/04/Procedura-
wsparcia-studentow.pdf">pobierz</a>
<a href="mailto:bos@cb.szczecin.pl">bos@cb.szczecin.pl</a>
Kryteria WCAG:
•   2.4.4 Cel linku ( w kontekście )
Propozycje naprawy:
•   Zmień tekst linków na opisowy, np. „Pobierz procedurę wsparcia studentów
(PDF, 120 kB)”.
•   Dla adresów e -mail   –   dodaj przedrostek, np. „Napisz do Biura Obsługi
Studentów:   bos@cb.szczecin.pl ”.
Kogo dotyczy:
•   Osoby z trudnościami poznawczymi
•   Osoby korzystające z czytników ekranu

--- STRONA 64 ---
63
STREFA STUDENTA   →   BIBLIOTEKA   →   IBUK LIBRA
https://www.cb.szczecin.pl/strefa-studenta/biblioteka/ibuk-libra/
BRAK ODPOWIEDNIEJ STRUKTURY NAGŁÓWKÓW
Opis problemu:
Treść strony nie jest logicznie podzielona na nagłówki (<h2>, <h3> itd.), a główna
część treści zawiera tylko jeden nagłówek <h1>. Pozostałe sekcje są formatowane
pogrubieniem (<strong>) lub zwykłym tekstem, zamiast nagłówków semantycznych.
Przykłady błędów:
<h1>IBUK Libra</h1>
<p><strong>CZYM JEST IBUK LIBRA?</strong></p>
<p><strong>JAK KORZYSTAĆ Z PLATFORMY IBUK LIBRA?</strong></p>
<!-- Zamiast <h2>, <h3> -->
Kryteria sukcesu:
•   1.3.1 Informacje i relacje   –   główne
•   2.4.6 Nagłówki i etykiety
Propozycje naprawy:
•   Zmień sekcje z pogrubieniem na odpowiednie nagłówki HTML (<h2>, <h3>,
itd.), zachowując logiczną hierarchię treści.
•   Upewnij się, że każdy główny dział ma własny nagłówek.
•   Poprawia to czytelność dla wszystkich użytkowników oraz dla czytników
ekranu.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu)
•   Osoby z trudnościami poznawczymi, seniorzy
•   Osoby korzystające z nawigacji nagłówkami

--- STRONA 65 ---
64
NIEPRAWIDŁOWE ALTERNATYWY TEKSTOWE OBRAZÓW
Opis problemu:
Niektóre obrazy mają zbyt ogólne opisy alternatywne (alt) lub ich nie mają, np. logo
IBUK Libra ma alt="Ibuk Libra", a obrazy dekoracyjne mają puste alt.
Przykłady błędów:
<img ... alt="Ibuk Libra" ...>
<img ... alt="" ...>
Kryteria sukcesu:
•   1.1.1 Treść nietekstowa   –   główne
Propozycje naprawy:
•   Wszystkie obrazy istotne dla zrozumienia treści powinny mieć opis
alternatywny, który wyjaśnia, co przedstawiają.
•   Obrazy dekoracyjne powinny mieć pusty atrybut alt (alt=""), ale tylko wtedy,
gdy są faktycznie dekoracją (np. tło, ozdobnik).
•   Logo instytucji powinno mieć alt w stylu: "Logo Collegium Balticum ANS".
Kogo dotyczy:
•   Osoby niewidome i słabowidzące korzystające z czytników ekranu
LINKI I DOKUMENTY PDF – BRAK INFORMACJI O FORMACIE
Opis problemu:
Na stronie znajdują się odnośniki do plików PDF (przewodniki, ulotki), ale nie są one
oznaczone jako PDF i nie podają rozmiaru pliku. Nie wiadomo, że kliknięcie otworzy
plik PDF   –   może to zdezorientować użytkownika.
Przykłady błędów:
<li><a href="https://www.cb.szczecin.pl/wp-content/uploads/2025/01/Przewodnik-
Uzytkownika.pdf">Przewodnik użytkownika</a></li>
Kryteria sukcesu:

--- STRONA 66 ---
65
•   2.4.4 Cel linku (w kontekście)   –   główne
•   3.2.4 Spójn a identyfikacja
•   3.3.2 Etykiety lub instrukcje
Propozycje naprawy:
•   Dodaj informację o formacie i rozmiarze pliku w treści linka, np. „Przewodnik
użytkownika (PDF, 1,2 MB)”.
•   Dodaj atrybut aria- label do linków, by użytkownicy czytników ekranu dostawali
pełną informację.
•   Rozważ opcję informowania użytkownika, że link otwiera się w nowej karcie
(jeśli tak jest).
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu
•   Osoby z niepełnosprawnością poznawczą i seniorzy
UCZELNIA   →   WŁADZE
https://www.cb.szczecin.pl/uczelnia/wladze/szczecin/
OBRAZY BEZ POPRAWNYCH ATRYBUTÓW ALT
Opis problemu:
Wielokrotnie na stronie zdjęcia członków władz i partnerów nie mają prawidłowych
opisów alternatywnych (alt jest pusty lub bardzo lakoniczny). To uniemożliwia
użytkownikom czytników ekranu zrozumienie treści obrazu.
Przykład kodu :
<img width="205" height="308" alt="" ... src="dr-Malgorzata-Hermanowicz-1-scaled-
1.jpg">
<img width="205" height="308" alt="Tatiana Staroń" ... src="tatiana -staron.jpg">
<img alt="" ... src="logo_klaster.svg">
Kryteria sukcesu:

--- STRONA 67 ---
66
•   1.1.1   Treść nietekstowa
•   1.3.1 Informacje i relacje
•   1.3.2   Zrozumiała kolej n ość
•   2.4.4 Cel linku ( w kontekście )
Główne kryterium:   1.1.1
Propozycje naprawy
•   Każdy obraz znaczący (np. zdjęcie osoby, logo partnera) musi mieć   opisowy
atrybut alt , np.
alt="dr Małgorzata Hermanowicz, Rektor Collegium Balticum"
•   Obrazy dekoracyjne, które nie niosą treści (np. tło, ozdobnik), mogą mieć
puste alt="" i być oznaczone jako dekoracyjne (role="presentation").
•   Przy logotypach partnerów dodać krótki opis, np. alt="Logo Microsoft".
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytników ekranu
BRAK ODPOWIEDNIEJ STRUKTURY NAGŁÓWKÓW
Opis problemu:
Na stronie używane są nagłówki (h1, h2, h3, h4), ale ich struktura jest nielogiczna
(np. po h2 następuje kilka h4), zdarzają się miejsca, gdzie nagłówków brak (np.
sekcja "Partnerzy Uczelni" nie jest nagłówkiem, tylko tekstem w <h2> w innym
miejscu).
Przykład kodu :
<h2 style="text- align:center;"><strong>Władze uczelni</strong></h2>
<h3 class="wp-block-heading has-text-align-center" id="h-rektor">Rektor </h3>
...
<h4 class="wp-block-heading has-text-align-center" id="h-prorektor">Prorektor </h4>

--- STRONA 68 ---
67
Kryteria sukcesu:
•   1.3.1 Informacje i relacje   –   główne
•   2.4.6 Nagłówki i etykiety
•   1.3.2   Zrozumiała kolejność
Propozycje naprawy:
•   Popraw hierarchię nagłówków: po h2 powinny być h3 (nie h4), unikaj
przeskakiwania poziomów.
•   Każda sekcja o równym znaczeniu powinna mieć taki sam poziom nagłówka,
np. wszyscy menedżerowie kierunków = h3.
•   Każda sekcja powinna mieć nagłówek, nie tylko ozdobny tekst powiększony.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby korzystające z czytników ekranu
•   Osoby z trudnościami poznawczymi
NIEPOPRAWNE LINKI E-MAIL (ZAGNIEŻDŻONE ZNACZNIKI, PUSTE
LINKI)
Opis problemu:
Część linków e - mail jest zagnieżdżona w znacznikach <mark>, są podwójne lub
puste, np.
<a href="mailto:m.maciejuniec@cb.szczecin.p"></a><mark ...><a
href="mailto:m.maciejuniec@cb.szczecin.pl"></a></mark>
Pojawiają się puste znaczniki <a>, linki nie zawsze są jednorodne.
Kryteria sukcesu:
•   1.3.1 Informacje i relacje   –   główne
•   2.4.4 Cel linku
•   4.1.2 Nazwa, rola, wartość

--- STRONA 69 ---
68
Propozycje naprawy:
•   Linki e- mail powinny być poprawnie osadzone, bez zagnieżdżania w innych
znacznikach.
•   Każdy link musi mieć wyraźną treść (np. adres mailowy) i tylko jeden adres na
jeden link.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu
•   Osoby starsze, mniej obyte z technologią
NIEPRAWIDŁOWE ETYKIETY I IDENTYFIKACJA KONTAKTÓW
TELEFONICZNYCH
Opis problemu:
Numery telefonów są linkami, ale czasem nie mają jednoznacznych etykiet; są np.
tylko liczbami, bez informacji, do kogo należy dany numer.
Przykład:
tel. <a href="tel:914830582">91 48 30 582</a>
Nie w każdym miejscu wiadomo, czy to numer do rektora, menedżera, czy
sekretariatu.
Kryteria sukcesu:
•   2.4.4 Cel linku   (w kontekście –   główne
•   1.3.1 Informacje i relacje
Propozycje naprawy:
•   Dodaj opisy/etykiety przed linkami telefonicznymi, np. „Telefon do Rektora:”.
•   Rozważ użycie atrybutu aria - label lub pełnego opisu linku.
Grupy dotknięte problemem :
•   Osoby niewidome i słabowidzące
•   Osoby starsze, korzystające z czytników

--- STRONA 70 ---
69
PROBLEMY Z KONTRASTEM TEKSTU NA PRZYCISKACH I GRAFIKACH
Opis problemu:
Przyciski "Poznaj skład" oraz podpisy na zdjęciach mogą mieć zbyt niski kontrast,
zwłaszcza na tle obrazów lub w wersji mobilnej.
Kryteria sukcesu:
•   1.4.3 Kontrast minimum   –   główne
•   1.4.11 Kontrast niezbędnych elementów (AA, WCAG 2.1/2.2)
Propozycje naprawy:
•   Zwiększ kontrast tekstu przycisków i podpisów na zdjęciach (np. ciemniejszy
kolor tła, jaśniejsza czcionka).
•   Przetestuj elementy przycisków i podpisów w trybie dużego kontrastu.
Kogo dotyczy:
•   Osoby z osłabionym wzrokiem
•   Osoby starsze
•   Osoby z dysleksją
KONTAKT I FORMULARZ KONTAKTOWY
https://www.cb.szczecin.pl/kontakt/
BRAK PRAWIDŁOWEJ STRUKTURY NAGŁÓWKÓW
Opis problemu:
Strona nie posiada logicznej, hierarchicznej struktury nagłówków (np. <h1>, <h2>,
<h3>). Niektóre tytuły sekcji są stylizowane zwykłymi znacznikami <div> lub <p>,
zamiast semantycznych nagłówków.
Przykład kodu:
<div class="section-title wow fadeIn">
<div class="container width-2">

--- STRONA 71 ---
70
<h2>Skontaktuj się z nami</h2>
</div>
</div>
<!--   Dalej nagłówki są np. <h5>, <strong>, <div>, <p> –   brak ciągłości i hierarchii   -->
Kryteria sukcesu:
•   Główne:   1.3.1 Informacja i struktura (WCAG 2.1 i 2.2)
•   2.4.6 Nagłówki i etykiety
•   2.4.10 Sekcje (WCAG 2.2)
Propozycje naprawy:
•   Nadać logiczną kolejność nagłówków (<h1>, <h2>, <h3> itd.) wszystkim
sekcjom i podsekcjom na stronie.
•   Zamiast <div> lub <p>, tam gdzie jest tytuł sekcji, użyć odpowiedniego
nagłówka.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu)
•   Osoby z trudnościami poznawczymi (łatwiejsze skanowanie treści)
NIEWŁAŚCIWE OPISY I ETYKIETY PRZYCISKÓW/FORMULARZY
Opis problemu:
Formularze kontaktowe mają etykiety tylko jako „placeholder” (tekst w polu), a nie
jako widoczne etykiety powiązane z polem. Poza tym przycisk „Wyślij wiadomość”
nie ma alternatywnego opisu dla czytników ekranu.
Przykład kodu:
<input ... placeholder="Imię" ... />
<input ... placeholder="Nazwisko" ... />
<input ... placeholder="Numer telefonu" ... />
<!--   Brak <label for="..."> powiązanej z polem   -->
Kryteria sukcesu:

--- STRONA 72 ---
71
•   1.3.1 Informacje i relacje   –   główne
•   3.3.2 Etykiety lub instrukcje
•   2.5.3 Etykieta w nazwie
•   4.1.2 Nazwa, rola, wartość
Propozycje naprawy:
•   Każde pole powinno mieć widoczną etykietę powiązaną z polem formularza
(np. <label for="first- name">Imię</label>).
•   „Placeholder” nie może zastępować etykiety.
•   Dodać opisy dla przycisków, tam gdzie są one tylko ikoną lub „inputem”.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące (czytniki ekranu nie odczytują „placeholder”
jako etykiety)
•   Osoby starsze i osoby z trudnościami poznawczymi (nie wiedzą, jakie dane
wpisać)
NIEWYSTARCZAJĄCY KONTRAST TEKSTU I ELEMENTÓW
INTERAKTYWNYCH
Opis Problemu:
Niektóre teksty i linki mają niski kontrast względem tła, np. jasnoszare teksty na
białym tle, pomarańczowe elementy na jasnym tle.
Przykład kodu:
.color: #ff7b00; /* Pomarańczowy tekst na białym tle */
.color: #bdbdbd; /* Jasnoszary tekst na białym tle */
Kryteria sukcesu:
•   1.4.3 Kontrast (minimum)   –   główne
•   1.4.11 Kontrast elementów nietekstowych
Propozycje naprawy:

--- STRONA 73 ---
72
•   Zapewnić współczynnik kontrastu minimum 4,5:1 dla tekstów i linków oraz 3:1
dla elementów graficznych i przycisków.
Kogo dotyczy:
•   Osoby słabowidzące
•   Osoby starsze
•   Użytkownicy mobilni (ekrany w słońcu)
NIEPOPRAWNA NAWIGACJA I PRZEŁĄCZANIE SEKCJI KLAWIATURĄ
Opis problemu:
Nawigacja pomiędzy zakładkami/sekcjami (np. miasta lub działy w kontakcie) jest
realizowana myszą –   osoby korzystające wyłącznie z klawiatury nie mogą w pełni
przełączać się pomiędzy sekcjami.
Przykład kodu:
<div class="box active" data-index-city="1" data-name="szczecin">...</div>
<div class="box" data-index-city="2" data-name="stargard">...</div>
<!--   Brak obsługi przełączania sekcji klawiaturą   -->
Kryteria sukcesu:
•   2.1.1 Klawiatura   –   głó wne
•   2.4.3 Kolejność fokusu
•   2.4.7 Widoczny fokus
Propozycje naprawy:
•   Zapewnić, aby przełączanie sekcji (np. wybór miasta, działu) było możliwe
wyłącznie z użyciem klawiatury.
•   Każdy element przełączający powinien być dostępny za pomocą klawisza Tab
i Enter.
Kogo dotyczy:
•   Osoby niewidome i słabowidzące
•   Osoby z niepełnosprawnością ruchu

--- STRONA 74 ---
73
•   Osoby starsze
ELEMENTY DEKORACYJNE Z NIEPOTRZEBNYMI OPISAMI
Opis problemu:
Niektóre obrazy lub ikony mają niepotrzebny atrybut alt lub nie mają go wcale, np.
dekoracyjne logo lub grafiki, które nie są informacyjne.
Przykład kodu:
<img src="..." alt="Studia: licencjat, magister, inżynier   - pedagogika, dietetyka,
kosmetologia, bezpieczeństwo wewnętrzne">
<!-- lub brak alt przy elementach typowo dekoracyjnych -->
Kryteria sukcesu:
•   1.1.1 Treść nietekstowa
Propozycje naprawy:
•   Wszystkie obrazy dekoracyjne powinny mieć alt="".
•   Informacyjne obrazy muszą mieć opis zgodny z ich funkcją.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu
BRAK INFORMACJI O BŁĘDACH W FORMULARZACH
Opis problemu:
Jeśli użytkownik nie wypełni obowiązkowych pól w formularzu lub poda błędne dane,
nie otrzymuje jasnego komunikatu o błędzie.
Przykład kodu:
<input ... class="wpcf7-form-control wpcf7-text wpcf7-validates-as-required" ... />
<!--   Brak dedykowanego komunikatu błędu   -->
Kryteria sukcesu:
•   3.3.1 Identyfikacja błęd u   –   główne
•   3.3.3 Sugestie korekty błędów
•   3.3.4 Zapobieganie błędom ( prawnym, finansowym, w danych)

--- STRONA 75 ---
74
Propozycje naprawy:
•   Pokazywać jasny komunikat, który pole wymaga poprawy, i podać instrukcję,
jak go poprawić.
•   Komunikat powinien być dostępny także dla czytników ekranu.
Kogo dotyczy:
•   Osoby niewidome, słabowidzące
•   Osoby starsze i z trudnościami poznawczymi
NIEPOPRAWNE ETYKIETY JĘZYKOWE I BRAK OBSŁUGI DLA JĘZYKÓW
OBCYCH
Opis problemu:
Strona główna ma zadeklarowany język polski, ale przełączniki na inne wersje
językowe mogą nie zmieniać atrybutu lang na stronie.
Przykład kodu:
<html lang="pl-PL">
<!--   Przełączenie na UA/EN nie zmienia atrybutu lang   -->
Kryteria sukcesu:
•   3.1.1 Język strony   –   główne
•   3.1.2 Język części
Propozycje naprawy:
•   Każda wersja językowa powinna mieć ustawiony odpowiedni atrybut lang.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu (poprawna wymowa)
•   Osoby mówiące innym językiem
NIEPRAWIDŁOWA SEMANTYKA LIST I TEKSTÓW
Opis problemu:
Instrukcja korzystania z platformy jest częściowo listą numerowaną, ale inne listy (np.

--- STRONA 76 ---
75
lista przewodników) są realizowane różnie –   czasem jako lista, czasem jako tekst.
Nie wszystkie sekcje mają logiczne uporządkowanie.
Przykłady błędów:
•   Brak <ul>/<ol> dla list w sekcji „IBUK Libra –   przewodniki”
Kryteria sukcesu:
•   1.3.1 Informacje i relacje
•   4.1.2 Nazwa, rola, wartość
Propozycje naprawy:
•   Stosuj poprawną semantykę HTML dla wszystkich list (instrukcje jako <ol>,
listy plików jako <ul>).
•   Unikaj stosowania tylko pogrubień lub tekstu do wyodrębniania sekcji –   używaj
odpowiednich znaczników HTML.
Kogo dotyczy:
•   Osoby korzystające z czytników ekranu
•   Osoby z niepełnosprawnością poznawczą
UCZELNIA   →   DEKLARACJA DOSTĘPNOŚCI
https://www.cb.szczecin.pl/uczelnia/deklaracja-dostepnosci/
ANALIZA NAGŁÓWKÓW W DEKLARACJI
Nagłówek   Opis błędu   Czy wymagany?
Deklaracja dostępności   ok   –
poprawny,
obecny
Wymagane   –   zawiera treści z
obowiązującym brzmieniem
Stan dostępności cyfrowej   Brak
nagłówka
Wymagane   –   zawiera treści z
obowiązującym brzmieniem
Niedostępne treści   Brak
nagłówka
Opcjonalne   –   wymagane gdy
strona jest częściowo zgodna lub
niezgodna

--- STRONA 77 ---
76
Nagłówek   Opis błędu   Czy wymagany?
Niezgodność z załącznikiem   Brak
nagłówka
Opcjonalne   –   wymagane gdy
strona jest częściowo zgodna lub
niezgodna
Treści nieobjęte przepisami   Brak
nagłówka
Opcjonalne   –   wymagane w
przypadku wyłączeń ustawowych
Nadmierne koszty   Brak
nagłówka
Opcjonalne   –   wymagane w
przypadku powołania się na
nadmierne koszty
Przygotowanie deklaracji
dostępności
Brak
nagłówka
Wymagane
Udogodnienia, ograniczenia
i inne informacje
Brak
nagłówka
Dobrowolne
Skróty klawiszowe   Brak
nagłówka
Opcjonalne   –   wymagane jeśli są
niestandardowe skróty
Informacje zwrotne i dane
kontaktowe
Brak
nagłówka
Wymagane
Obsługa wniosków i skarg
związanych z dostępnością
Brak
nagłówka
Wymagane
Pozostałe informacje   Brak
nagłówka
Wymagane (tylko tytuł)
Aplikacje mobilne   Brak
nagłówka
Opcjonalne   –   wymagane jeśli
podmiot posiada aplikacje
mobilne
Dostępność
architektoniczna
ok   –
poprawny,
obecny
Wymagane

--- STRONA 78 ---
77
Nagłówek   Opis błędu   Czy wymagany?
Dostępność
komunikacyjno-
informacyjna
Brak
nagłówka
Wymagane
ANALIZA IDENTYFIKATORÓW A11Y-*
Identyfikator   Opis błędu   Opis elementu   Czy
wymagany?
a11y-wstep   Brak elementu
(element wstęp jest
obowiązkowy)
Cała treść oświadczenia
wstępnego
obowiązkowy
a11y-podmiot   Brak elementu   Nazwa podmiotu
publicznego
obowiązkowy
a11y-zakres   Brak elementu   Rodzaj rozwiązania
cyfrowego, którego
dotyczy deklaracja
obowiązkowy
a11y-url   Brak elementu   Adres strony
internetowej lub aplikacji
obowiązkowy
a11y-data-
publikacja
Brak elementu   Data opublikowania
strony / wydania aplikacji
obowiązkowy
a11y-data-
aktualizacja
Brak elementu   Data ostatniej
aktualizacji strony /
aplikacji
obowiązkowy
a11y-status   Brak elementu, brak
statusu deklaracji
zgodności
Treść akapitu ze stanem
zgodności z ustawą
obowiązkowy
a11y-ocena   Brak elementu   Treść o nadmiernych
kosztach (opcjonalny)
opcjonalny
a11y-data-
sporzadzenie
Brak elementu   Data sporządzenia
deklaracji
obowiązkowy

--- STRONA 79 ---
78
Identyfikator   Opis błędu   Opis elementu   Czy
wymagany?
a11y-data-
przeglad
Brak elementu   Data ostatniego
przeglądu deklaracji
opcjonalny*
a11y-kontakt   Brak elementu   Osoba/komórka do
kontaktu w sprawie
dostępności
obowiązkowy
a11y-email   Brak elementu   Adres e-mail do kontaktu
w sprawie dostępności
obowiązkowy
a11y-telefon   Brak elementu   Telefon do kontaktu w
sprawie dostępności
obowiązkowy
a11y-
procedura
Brak elementu   Procedura skargowa   obowiązkowy
a11y-aplikacje   Brak elementu   Informacja o aplikacjach
mobilnych (jeśli dotyczy)
opcjonalny
a11y-
architektura
Brak elementu   Informacja o dostępności
architektonicznej
obowiązkowy
a11y-
architektura-
url
Brak elementu   Adres strony z opisem
dostępności
architektonicznej
opcjonalny
a11y-
komunikacja
Brak elementu   Informacja o dostępności
komunikacyjno-
informacyjnej
obowiązkowy
ANALIZA WYMAGAŃ DOTYCZĄCYCH DAT
Wszystkie daty wymagane przepisami powinny być oznaczone tagiem <time> i mieć
atrybut datetime w odpowiednim formacie (np. 2025-06-24).

--- STRONA 80 ---
79
Identyfikator   Tag
<time>
Format
daty
Atrybut
datetime
Uwagi
a11y-data-publikacja   Brak   Brak   Brak   Brak
elementu
a11y-data-
aktualizacja
Brak   Brak   Brak   Brak
elementu
a11y-data-
sporzadzenie
Brak   Brak   Brak   Brak
elementu
a11y-data-przeglad   Brak   Brak   Brak   Brak
elementu
PODSUMOWANIE I REKOMENDACJE
1.   Deklaracja dostępności posiada bardzo poważne braki formalne i techniczne.
Brakuje:
•   Większości wymaganych nagłówków,
•   Wszystkich wymaganych identyfikatorów a11y -   (brak sekcji, oznaczeń i
atrybutów),
•   Wymaganych dat w strukturze <time datetime="">,
•   Informacji kontaktowych w wymaganej strukturze,
•   Statusu dostępności i informacji o skargach.
2.   Strona nie prezentuje wyraźnej informacji o dostępności (np. „Deklaracja
dostępności” jest schowana głęboko w menu). Dla osób szukających informacji o
wsparciu dostępnościowym wskazane jest, by deklaracja była bardziej widoczna.
PROPOZYCJE NAPRAWY
1.   Dodać link „Deklaracja dostępności” w widocznym miejscu   (np. w stopce,
w nagłówku).
2.   Dodać wszystkie wymagane nagłówki   zgodnie z ustawą oraz wzorem
deklaracji.

--- STRONA 81 ---
80
3.   Uzupełnić wszystkie elementy z identyfikatorami a11y -   (patrz lista
powyżej) –   każdy powinien być czytelnie oznaczony w kodzie HTML.
4.   Wprowadzić wszystkie wymagane daty   –   każda z nich powinna być w tagu
<time>, z poprawnym atrybutem datetime.
5.   Zaktualizować informacje kontaktowe   –   powinny być obecne jako osobne
sekcje/identyfikatory.
6.   Uzupełnić brakujące sekcje   (np. procedura skargowa, status zgodności,
komunikacja).
ZNACZENIE DLA UŻYTKOWNIKÓW
Brak tych elementów:
•   utrudnia użytkownikom (w tym osobom z niepełnosprawnościami) dostęp do
informacji o dostępności strony,
•   uniemożliwia korzystanie z deklaracji przez osoby niewidome, słabowidzące i
korzystające z czytników ekranu,
•   powoduje, że deklaracja nie spełnia wymogów prawnych i może być podstawą
do złożenia skargi .
PODSUMOWANIE BŁĘDÓW I REKOMENDACJE
BŁĘDY NA POZIOMIE DOSTĘPNOŚCI A (WCAG 2.1/2.2)
Najpoważniejsze naruszenia (A):
•   Brak nawigacji klawiaturą (2.1.1)
•   Brak opisów alternatywnych dla obrazów i ikon (1.1.1)
•   Brak czytelnych, powiązanych etykiet formularzy i checkboxów (1.3.1, 3.3.2)
•   Brak wyraźnego wskaźnika fokusu (2.4.7)
•   Brak skip linków (2.4.1)
•   Brak logicznej struktury nagłówków (1.3.1)
•   Nieczytelne, nieunikalne tytuły stron (2.4.2)

--- STRONA 82 ---
81
•   Nieprawidłowe nazwy i role elementów interaktywnych (4.1.2)
Grupy szczególnie narażone : osoby niewidome, słabowidzące, korzystające z
klawiatury i technologii asystujących, osoby starsze, osoby z trudnościami
poznawczymi.
BŁĘDY NA POZIOMIE DOSTĘPNOŚCI AA (WCAG 2.1/2.2)
Najczęstsze naruszenia (AA):
•   Zbyt niski kontrast tekstu i elementów graficznych (1.4.3)
•   Brak informacji o celu linków (2.4.4)
•   Problemy z walidacją formularzy (3.3.1, 3.3.3)
•   Brak regionów ARIA live w dynamicznie ładowanych treściach (4.1.3, WCAG 2.2)
•   Brak jasnego oznaczenia wymaganych pól (3.3.2)
•   Brak logicznego podziału i opisu dokumentów do pobrania (2.4.10, 2.4.9)
REKOMENDACJE
•   Pełna przebudowa menu głównego: obsługa klawiatury i ARIA, role, aria -
expanded/aria-controls.
•   Dodanie semantycznych landmarków: <nav>, <main>, <aside>.
•   Poprawienie kontrastów tekstu i grafik: min. 4,5:1.
•   Dodanie skip linków i widocznych wskaźników fokusu.
•   Pełne etykietowanie i powiązanie pól formularzy: <label for/id>, aria -label.
•   Opisy alternatywne dla wszystkich obrazów i ikon.
•   Logiczna, jednorodna hierarchia nagłówków na każdej podstronie.
•   Każdy link i przycisk z jednoznaczną nazwą i opisem.
•   Informacja o plikach do pobrania (typ, rozmiar, dostępność).
•   Zadbanie o dostępność dynamicznych zmian (ARIA live).
•   Informowanie o otwieraniu linków w nowej karcie.
•   Usunięcie pustych i niepotrzebnych elementów HTML.

--- STRONA 83 ---
82
•   Stworzenie dostępnych, logicznie podzielonych sekcji z dokumentami.
OCENA KOŃCOWA
Strona jest NIEZGODNA z WCAG 2.1/2.2   na poziomie A i AA.
Witryna wymaga głębokiej przebudowy pod kątem dostępności –   obecnie nie
zapewnia równego dostępu do treści osobom z niepełnosprawnościami oraz nie
spełnia wymagań prawnych .   Rekomendowane jest wdrożenie kompleksowych
poprawek   —   dotyczących kodu HTML, stylów, nawigacji oraz treści —   na całej
witrynie.
Jeśli obecna architektura nie pozwala na łatwą i poprawną naprawę wszystkich
błędów, rekomenduje się   stworzenie nowej, od podstaw zaprojektowanej strony ,
zgodnej z WCAG.
.
```
