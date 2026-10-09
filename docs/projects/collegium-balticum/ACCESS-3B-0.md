# CB — ponowna weryfikacja dostępu, 3B-0

Data: 2026-10-09, branch project/collegium-balticum, baza 02f7239. Wyłącznie diagnostyka. Motyw, WordPress, adaptery Figma i statusy rejestru nie zostały zmienione. Nie rozpoczęto 3B ani 4.

## Wynik

**TAK: mogę teraz otworzyć URL home przez narzędzia web i odczytać rzeczywistą treść CB. NIE: nie mam w tych narzędziach renderowanego wyglądu ani eksportu raw HTML/screenshotów HTML.** Odczyt przez URL jest ekstrakcją usługową, nie wynikiem wyszukiwarki, ale może korzystać z cache. Etykieta crawled today nie dowodzi świeżego DOM z chwili żądania.

**Częściowe pozyskanie plików jest możliwe:** rzeczywisty JPEG hero pobrany bezpośrednio z publicznego CDN do Codespace, HTTP 200. Obejrzano obraz: kobieta z megafonem na żółto-pomarańczowym tle. Jest powiązany z CB przez link w treści home i nagłówek canonical CDN. Nie jest screenshotem strony ani makietą.

Wybór: **SCENARIUSZ B, dostęp częściowy** — web odczytuje treść, CDN udostępnia sprawdzony plik, a Playwright w Codespace nie dociera do dokumentu głównego. To nie dowodzi globalnej niedostępności witryny. Poprzednie zalecenie ręcznego przygotowania 38 screenshotów było zbyt daleko idące: najpierw należy uruchomić istniejący automatyczny capture w środowisku, w którym zwykły dostęp do CB działa.

## A — dostęp przez narzędzia Codexa

Sprawdzono osobno `web.run open` i `search_service.web_run open`, podając bezpośrednie pięć URL, bez wyszukiwarki. Oba zwróciły treść CB. Są to dwa interfejsy narzędzi web, nie dowód dwóch niezależnych sieci lub dwóch pełnych przeglądarek.

| Końcowy URL raportowany przez web | Tytuł | H1 | 2–3 rzeczywiste fragmenty/nagłówki |
|---|---|---|---|
| https://www.cb.szczecin.pl/ | Studia, Zaoczne, Dzienne - Collegium Balticum Akademia Nauk Stosowanych | Studia zaoczne i dzienne (H1 według ekstrakcji; raw DOM nie uzyskano) | Studia podyplomowe; Kierunki studiów w CB; Wiadomości |
| https://www.cb.szczecin.pl/rekrutacja/ | Studia - Rekrutacja 2026 na studia licencjackie i magisterskie » Collegium Balticum | Niepotwierdzony | VIDEOTEKA; Warunki rekrutacji; Studia pierwszego stopnia |
| https://www.cb.szczecin.pl/dni-otwarte/ | Dni otwarte » 4 marca 2026 - Collegium Balticum | Niepotwierdzony | Zapisy i kontakt; ROK 2024; ROK 2023 |
| https://www.cb.szczecin.pl/kontakt/ | Skontaktuj się z Nami » Collegium Balticum | Niepotwierdzony; widoczny tytuł Skontaktuj się z nami ma H2 w ekstrakcji | Szczecin; Stargard; Biuro Obsługi Studenta |
| https://www.cb.szczecin.pl/tryb-studiow/studia-licencjackie/ | Studia licencjackie :: Studia I stopnia - Szczecin - Stargard - Collegium Balticum | Niepotwierdzony; wstęp H5, wybór kierunku H2 w ekstrakcji | Studia Licencjackie – Wybierz kierunek; Pedagogika – studia licencjackie; Kosmetologia |

Dla każdego URL: można zapisać odczytane dane strukturalne, nie HTML strony. Widać tekstowe menu, fragmenty treści i stopkę; nie widać geometrii, kolorów, fontów ani pozycjonowania. Markery obrazów występują w części ekstrakcji; nie są wizualnym podglądem. W rekrutacji pierwsza ekstrakcja zawierała odnośniki do obrazów ofert, późniejsza je pomijała. Dni otwarte mają linki galerii. Nie potwierdzono hero/slidera licencjackich na podstawie obrazu. Screenshot HTML niedostępny we wszystkich pięciu przypadkach.

Świeżość: początkowo home/rekrutacja/kontakt miały crawled today, dni otwarte 2 weeks ago, licencjackie 2 days ago. Kolejne odczyty czterech podstron podały today, ale **dni otwarte zwróciły inny tytuł i program**: początkowo 4 marca i 15 października, później tylko 4 marca. Różniły się także wpisy personelu w kontakcie i liczby linii. Nie potwierdzono, czy przyczyną jest cache, wariant odpowiedzi czy zmiana produkcji. Nie uznajemy tych ekstrakcji za zamrożoną aktualną wersję do porównania 1:1. Próba zwykłego URL home z parametrem cache-busting została odrzucona przez usługę, więc nie udowodniła odczytu bez cache.

Test funkcji screenshot: narzędzie zwróciło komunikat, że screenshot nie jest dostępny dla text/html i obsługiwany jest tylko PDF. Nie ma parametrów viewportu 1440×900 / 390×844 ani sesji pełnej przeglądarki do CSS computed styles w udostępnionym interfejsie. Inwentaryzacja narzędzi nie wykazała innego dostępnego zdalnego browser automation z eksportem plików. Nie wykorzystano Sites/Figma do produkowania zastępczych referencji.

## B — terminal Codespace

Ponowiono cztery żądania curl IPv4: HTTP i HTTPS dla www oraz bez www. Connect timeout 3 s, całkowity 5 s, maksymalnie 3 przekierowania, weryfikacja TLS włączona.

- Oba hosty: DNS A=185.41.69.148; AAAA=ENODATA. Nie ma dostępnego adresu IPv6, IPv4 wskazano jawnie.
- Cztery próby: curl exit 28, po około 3001–3002 ms. HTTP 000, time_connect=0, time_appconnect=0, first byte=0, brak przekierowań. TLS/HTTP/HTML nie zostały osiągnięte, więc nie oceniono certyfikatu ani konfiguracji redirect.
- Kontrolny HTTPS wordpress.org: HTTP/2 200, exit 0.
- Zmienne HTTP_PROXY, HTTPS_PROXY, ALL_PROXY i NO_PROXY, także małymi literami: nieobecne. Nie oznacza to wykluczenia infrastrukturalnego proxy/filtrów poza procesem.
- Publiczny CDN nitrocdn: HTTP/2 200, image/jpeg, 57908 bajtów. Nie cały ruch z Codespace jest zablokowany.

Dokładna przyczyna braku TCP do CB **pozostaje nieznana**. Potwierdzono różnicę osiągalności między usługą web a terminalem, nie właściciela blokady. Możliwa filtracja/trasa/ACL zależna od środowiska jest hipotezą. Nie ma dowodu, że problem wynika z networkidle, błędnego URL, IPv6 lub sprawdzania certyfikatu. Nie obchodzono systemów ochrony ani nie zmieniano konfiguracji proxy.

## C — Playwright Codespace

Jedna nawigacja do https://www.cb.szczecin.pl/, Chromium z istniejącej instalacji, desktop 1440×900, domcontentloaded, timeout 10000 ms, bez ignorowania błędów TLS. Wynik: timeout, etap navigation, około 10798 ms łącznie, brak odpowiedzi HTTP, brak DOM/load i komunikatów konsoli, pending request dokumentu głównego. Końcowy URL przeglądarki about:blank. ERR_ABORTED zapisano przy zamykaniu sesji po timeout, nie jako dowód osobnej przyczyny sieciowej. Nie wykonano dalszych 38 prób. Nie zapisano pustego obrazu ani HTML about:blank.

## Co faktycznie pozyskano

| Materiał | Wynik |
|---|---|
| Treść, nagłówki | TAK, ekstrakcja web; aktualność konkretnej wersji niegwarantowana |
| Kolejność sekcji | Częściowo: kolejność tekstowa, nie zmierzone prostokąty ani zachowanie |
| Obrazy, URL i ALT | Jeden prawdziwy plik JPEG pobrany; etykieta obrazu dostępna w ekstrakcji, raw ALT niezweryfikowany |
| Menu i stopka | Treść i hierarchia tekstowa; bez wyglądu i interakcji |
| CSS, kolory, fonty, wymiary komponentów | NIE; wyłącznie wymiary pobranego JPEG, nie komponentu |
| Screenshot desktop 1440×900 | NIE |
| Screenshot mobile 390×844 | NIE |
| HTML strony | NIE |
| Dane referencyjne do zapisania | TAK: JSON struktury/obserwacji i JPEG; nie pełna referencja wizualna |

Proof of concept plików:

- `.factory-cache/live/collegium-balticum/access-3b0/rekrutacja-lato-zaoczne-dzienne.jpg` — **57908 bajtów**, **1808×870**, rzeczywisty asset powiązany z CB. Nagłówki HTTP i SHA256 w media-proof.json. Obraz nie jest stroną weryfikacyjną.
- `docs/projects/collegium-balticum/access-3b0/home-structure.json` — **2688 bajtów**, struktura odczytana z ekstrakcji home, jawnie oznaczona jako nie-HTML i bez geometrii.
- Pozostałe dowody oraz rozmiary: [files.json](access-3b0/files.json), [web-results](access-3b0/web-results.json), [network](access-3b0/network.json), [playwright](access-3b0/playwright.json), [environment](access-3b0/environment.json), [media-proof](access-3b0/media-proof.json).

## Rekomendowany następny krok

**Nie rekomenduję teraz pełnej implementacji 3B ani tworzenia lokalnego zastępczego zestawu strony.** Istniejący mechanizm LIVE capture z 3A już obsługuje 19 adresów × desktop/mobile, niską równoległość, kontrolę dokumentu i zapis PNG/layout/metrics. Problemem pozostaje miejsce wykonania capture, a nie brak tego narzędzia.

Najprostsza ścieżka: uruchomić ten sam checkout i istniejący capture na komputerze/runnerze z potwierdzonym zwykłym dostępem do CB. Najpierw jeden proof of concept home: HTML, dwa viewporty i załadowane zasoby; nie zakładać, że działająca przeglądarka użytkownika gwarantuje działanie headless. Jeśli pojawi się CAPTCHA lub strona blokady, zatrzymać próbę, nie obchodzić ochrony. Po potwierdzeniu home uruchomić `npm run cb:capture` w tym środowisku i przekazać jedno archiwum `.factory-cache/live/collegium-balticum/discovery/<run>/` wraz z `REFERENCE-ACCESS-3A.json` do repo/Codespace. Nie wymaga to ręcznego wykonywania 38 PNG. Użytkownik nie musi redagować treści ani tworzyć zastępczego designu.

Jeśli repo/dependencies nie są dostępne lokalnie, potrzebny będzie checkout, Node i `npm ci` oraz normalna przeglądarka wykrywana przez istniejący browser discovery; nie instalowano tego na komputerze użytkownika. Pełny batch nie został uruchomiony w tej diagnozie. Raw HTML i CSS trzeba dodatkowo zapisać z tej samej udanej sesji (np. page.content() i odnośniki do stylesheetów); istniejący batch zapisuje PNG/layout/metrics, nie raw HTML. Bez udanego proof of concept nie deklarujemy tej ścieżki jako potwierdzonego pełnego dostępu.

Alternatywa: administrator rozwiązuje trasę/ACL dla Codespace i powtarzamy jeden test home tutaj. Ręczne screenshoty pozostają dalszą opcją, a nie pierwszym wymaganiem. SOURCE_CAPTURE i VISUAL_QA zachowują dotychczasowe statusy.
