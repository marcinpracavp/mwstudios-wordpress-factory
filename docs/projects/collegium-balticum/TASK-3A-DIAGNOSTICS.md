# CB — diagnostyka rzeczywistych blokerów, zadanie 3A

Stan potwierdzony 2026-10-09. Szczegóły: [sieć](TASK-3A-NETWORK.json), [38 prób Chromium](REFERENCE-ACCESS-3A.json), [dowody QA](TASK-3A-EVIDENCE.json).

## Połączenie z produkcją

DNS www.cb.szczecin.pl oraz cb.szczecin.pl zwraca 185.41.69.148 (IPv4); zapytania AAAA nie dostarczyły adresu. Cztery osobne próby TCP — oba hosty, porty 80/443 — przekroczyły limit 6000 ms bez zdarzenia connect. Dodatkowy curl IPv4 HTTPS do www: timeout 15002 ms, HTTP 000, DNS 0.000887 s, connect/TLS/first-byte 0, bez przekierowań. Kontrolny HTTPS do wordpress.org: HTTP 200, connect 0.090329 s, TLS 0.200686 s. Ogólne wyjście HTTPS działa.

Awaria z tej instancji Codespace następuje **przed TLS i HTTP**, nie przy oczekiwaniu na zasoby DOM. Nie ustalono, czy ruch blokuje trasa/ACL po stronie środowiska czy serwera. Nie ma podstaw do uznania CB za globalnie niedostępne ani do wskazania konkretnego firewallu. Nie wyłączono walidacji certyfikatów ani nie obchodzono CAPTCHA.

| Warstwa | Potwierdzony wynik |
|---|---|
| DNS | IPv4 działa dla obu hostów; brak adresu AAAA |
| TCP | timeout 80 i 443 dla obu hostów |
| TLS | handshake nie rozpoczął się; certyfikatu nie dało się ocenić |
| HTTP / przekierowania / HTML | nieosiągnięte, nie potwierdzono kodu odpowiedzi ani treści |
| DOM/load | brak wydarzeń w 38 próbach Chromium, etap navigation |
| Fonty / obrazy / zewnętrzne zasoby | nie zostały osiągnięte; nie można przypisać im timeoutu |
| Konsola | brak zarejestrowanych komunikatów; nie dowodzi poprawności JS produkcji |
| Niezakończone żądania | dokument główny właściwego URL, zapisany w pendingRequests |
| www / bez www | oba hosty mają ten sam adres i taki sam wynik TCP |

Ponowiono desktop 1440×900 i mobile 390×844 dla **każdej** pozycji CB-00–CB-18. Dotyczy również home, rekrutacji, dni otwartych, licencjackich i podyplomowych. Limit dwóch równoległych prób, timeout 10 s. Powstało 38 capture.json, **0 produkcyjnych PNG CB**. Każdy rekord podaje ścieżkę cache, etap i czas. Nie zastąpiono ich screenshotami innej witryny. Lista konkretnych materiałów do dostarczenia: [MANUAL-REFERENCES](TASK-3A-MANUAL-REFERENCES.md).

## Naprawy capture

Adapter już używał domcontentloaded, nie networkidle. Dodano diagnostykę etapów, wydarzenia DOM/load, konsolę, pending requests i czas, również przy timeoutach. Widoczne body i niepusta treść są wymagane; wykryta strona wyzwania dostępu/pusty dokument/HTTP >=400 nie dostają referencji PNG. Wspólny settle ogranicza osobno gotowość fontów, przewinięcie lazy load i dekodowanie obrazów. Test realnego Chromium potwierdza, że trwający fetch w tle nie blokuje poprawnej referencji. Nie blokowano zasobów CB na ślepo: brak HTML uniemożliwia ocenę ich znaczenia.

## Środowisko

Compose `.devcontainer/docker-compose.yml`, projekt `factory-live-qa`: wordpress + db + wpcli. Repo jest volume w `/var/www/html/wp-content/themes/mwstudios-wordpress-factory`, osobne trwałe wordpress-data/db-data. Host 8000 → kontener 80. Aktywny stylesheet **mwstudios-wordpress-factory** (Slawinsky Theme), nie motyw domyślny. ACF Pro **6.7.0.2**, aktywny, acf_is_pro()=true; paczka dostarczona przez użytkownika, brak klucza lub paczki w commitach. Realne pola zapisują się i renderują; aktualizacje footer/tabs/flexible używają istniejących kluczy Local JSON.

CSS i JS dist zwracają HTTP 200. Build przechodzi. blog_public=0. Ustawiono wyłącznie jawny homepage QA jako statyczny front, z kopią poprzednich opcji `mwf_qa_original_front_options`. Strony CB nie powstały. Struktura permalinków pozostała pusta — nie zmieniano URL istniejących rekordów; dokładne ścieżki CB będą konfigurowane i sprawdzane przy realizacji zadania 4. Brak CF7/innego backendu formularza pozostaje Q-06, a nie zastępczym formularzem wysyłającym dane.

Usunięto odrębną, starą implementację template-blog.php: wspólny archive partial obsługuje natywne archiwum i WP_Query strony bloga, semantyczne karty oraz nazwaną nawigację paginacji. Obie strony paginacji sprawdzone w przeglądarce. Zabezpieczono login przed pustym logo ACF. Dodano idempotentny setup podglądów/hub/stopki z jednoznacznym QA. Powtórzenie setup nie zwiększa liczby stron. Brak błędów PHP w sprawdzonych logach serwera oraz treści podglądów; lint 55 plików przechodzi.

Wykryto dodatkową niespójność: ogólne zmienne Codespace FACTORY_LOCAL_URL=http://wordpress i FACTORY_WP_ROOT=/wordpress nie wskazują tego samego stosu co localhost:8000. Projektowy adapter `scripts/projects/collegium-balticum/runtime.js` kieruje `cb:wp`/`cb:preview` do wpcli w factory-live-qa, a `cb:dev` przekazuje config.localUrl do istniejącego Webpack/BrowserSync. Nie zmienia uniwersalnego WP-CLI ani konfiguracji Figma. Dzięki temu redaktor/dev może pracować na tej samej instancji co testy; nie należy dla CB uruchamiać ogólnego bootstrapu ustawiającego URL http://wordpress.
