# Kopiowanie zamówień w strukturze placówek

Ostateczne sprostowanie użytkownika z 22.10.2026: w tej strukturze można kopiować zamówienia między wszystkimi placówkami, również przez pośrednika oraz między gałęziami. Ograniczenie do relacji bezpośrednich zostało wycofane. Dokument oznacza zamówienie, nie plik załącznika.

## Interpretacja wyników

Raport 5afd052a-f7c5-42a4-a58a-b6bacca16afa: 6 PASS i 6 FAIL. Odmowy ORD-COPY-02, -04, -06, -07, -10 i -12 są niezgodne z ostatecznie potwierdzoną regułą kopiowania w całej strukturze.

Kontrolny przebieg ośmiu testów zakończył się 8 PASS przed otrzymaniem polecenia stop, ale sprawdzał przejściowe, wycofane oczekiwanie odmowy kopiowania pośredniego. Nie jest dowodem poprawności aplikacji według bieżących wymagań. Po ostatnim sprostowaniu nie uruchamiano ponownie testów na DEV. Zachowano diagnostykę błędu biznesowego zwracanego przy HTTP 200.

## Scenariusze i dane

Opisy znajdują się w panelu Scenariusze pod 37160 i ORD-COPY. ID testów pozostają bez zmian. ZS oznacza Zespół Szkół. Struktura testu to ZS → SP → LO oraz ZS → TECH; B z BSP jest osobną strukturą, a SOLO jest placówką samodzielną.

- ORD-COPY-01–12: kopie w każdym kierunku między ZS, SP, LO i TECH, niezależnie od liczby pośredników.
- ORD-COPY-13–14: wykluczenie źródła, innej struktury i placówki samodzielnej.
- ORD-COPY-15–16: zakaz ponownego kopiowania kopii, brak celu i anulowanie.
- ORD-COPY-17: jedna operacja z SP do ZS, LO i TECH; po jednej kopii u każdego odbiorcy.
- ORD-COPY-18–19: placówka bez struktury i konto bez School.EDIT.

Przygotowanie korzysta z własnych dedykowanych szkół i rzeczywistego API. Oryginał zawiera F7P w ilości 3 i 4P-2 w ilości 2. Kopiowanie odbywa się przez UI. Testy kontrolują zgodność produktów i ilości oraz brak zmian pozostałych dokumentów. Sprzątanie usuwa wyłącznie dokumenty i relacje utworzone przez bieżący test. Nie zmienia się ról kont i nie wysyła wiadomości.

## Uruchomienie

```powershell
npx playwright test tests/zamowienia-kopiowanie-struktura.spec.ts --workers=1 --retries=0
```

Jeden worker zapewnia sekwencyjne korzystanie z dedykowanej struktury. Sam katalog scenariuszy nie uruchamia testów ani przygotowania danych.

## Uzupełnienia scenariusza zbiorczego #35980 — 21.10.2026

Scenariusz `ORD-SC-35980-06` obejmuje symbol na liście i w nagłówku rozwiniętych szczegółów, wraz z danymi źródłowymi. Rozszerzone przypadki `ORD-BUG-36289-01–03` sprawdzają SP→LO, Zespół→SP i SP→Zespół. Zakończenie automatyzacji oznacza zakres implementacji, nie wynik wszystkich przyszłych wykonań.

Nowy plik `tests/zamowienia-kopie-zmiana-struktury.spec.ts` rozszerza `ORD-SC-35980-09`:

- `ORD-SPEC-35980-20`: odwrócenie hierarchii usuwa wcześniejszą kopię i zachowuje oryginały;
- `ORD-SPEC-35980-21`: zmiana relacji na Filię usuwa wcześniejszą kopię i zachowuje niezależny dokument;
- `ORD-SPEC-35980-22`: zmiana na wielobudynkowość usuwa kopie, następnie użytkownik tworzy kopię ponownie ręcznie. Weryfikowana jest zgodność treści i brak duplikatu, nie zmiana ID.

Każdy przypadek korzysta z dwóch własnych SP, kopii i niezależnego oryginału o innych ilościach. Nowe kopie wynikające z relacji nie są mylone z oryginałami. Przygotowanie i sprzątanie pozostają w istniejącym mechanizmie własności danych. Zmiana typu relacji nie jest przedstawiana jako test zmiany typu samej szkoły.

Pierwsze wykonanie DEV: `47cb6c25-3bca-4f2b-8df1-3a0b0047292d`: **5 PASS, 1 FAIL**. Przeszły trzy rozszerzone testy prezentacji oraz zmiana hierarchii i zmiana na Filię. Niepowodzenie -22 wynikało z błędnego oczekiwania automatycznego odtworzenia kopii. Użytkownik sprostował: po zmianie relacji kopie są usuwane i trzeba ponownie stworzyć je ręcznie. Test i scenariusz poprawiono zgodnie z tym doprecyzowaniem; wcześniejszy FAIL nie jest zgłaszany jako błąd aplikacji. Starszy raport pozostaje bez zmian.

Ponowne wykonanie poprawionego -22: `ece7edd1-bf42-4343-923f-2a153998c9ef`, **1 PASS**. Usunięcie kopii po edycji, ponowne ręczne skopiowanie, zgodność treści, brak duplikatu oraz zachowanie oryginałów zostały potwierdzone na DEV. Wyniki różnych uruchomień nie są łączone w jeden PASS w UI.

Końcowy wspólny przebieg `ccde40ff-0378-426e-9102-cb684070c327`: **8 PASS, 0 FAIL, 0 SKIP**. Obejmuje -01 i -04, trzy rozszerzone testy #36289 oraz nowe -20/-21/-22. Scenariusze prezentacji i zmian relacji mają dzięki temu wspólny, kompletny zapis powiązanych wykonań. `ORD-SC-35980-06` ma pełną automatyzację; -09 nadal częściową ze względu na pozostałe warianty, nie z powodu wyniku tych ośmiu testów. Aktualny bilans scenariusza zbiorczego: 11 z automatyzacją, 5 częściowych.

Pozostają częściowe zakresy: zawieszenie/zmiana typu szkoły i pełne skutki operacyjne/audyt, kontrolowana synchronizacja historii/faktury/korekty/Softlab (niedostępna na DEV), przygotowanie generowania zleceń gratisów oraz pełne warianty uprawnień. Zastany stan SQL nie zastępuje testu zdarzenia integracyjnego.

## Dalsze uzupełnienie — 21.10.2026

Wyjaśniono później niepowodzenia generowania gratisów -14–17/-33: pole numeru budynku własnej szkoły miało 52 znaki, przekraczając limit 50 w tabeli adresów procedury generującej. Poprawiono przygotowanie na krótki, deterministyczny numer. Szczegóły i aktualny wynik w `kopiowanie-gratisy.md`; historycznych raportów nie przepisano.

Późniejsze sprostowanie użytkownika: sama testowa szkoła nie blokuje zlecenia nietestowego nauczyciela. -31 poprawiono na oczekiwanie obecności zlecenia, bez uruchamiania testu. Jego wcześniejsze FAIL poniżej są historyczne i nie stanowią błędu aplikacji.

Dodano 16 kolejnych przypadków i rozszerzono audyt istniejących testów:

| Testy                 | Zakres                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORD-SPEC-35980-23/-24 | Zawieszenie szkoły, usunięcie kopii, zachowanie obu oryginałów; typ i poziom tylko do odczytu.                                                                                               |
| ORD-SPEC-35980-20–23  | Nowy audyt usunięcia konkretnej kopii z ID, datą i autorem, nie tylko wpis o relacji.                                                                                                        |
| ORD-SPEC-35980-25/-26 | Niezależne przyznanie i odmowa BOK, również po zmianie podstawy kopii i w eksporcie.                                                                                                         |
| ORD-SPEC-35980-27     | Własne lokalne zamówienie pozostaje podstawą po usunięciu źródła i jego kopii.                                                                                                               |
| ORD-SPEC-35980-28/-29 | Izolacja innego przedmiotu i poprzedniego roku w publicznym eksporcie. Starsze potwierdzenie zapisujemy przed nowszym; bieżąca lista Uprawnienia nie służy do odczytu historycznego rekordu. |
| ORD-SPEC-35980-30–32  | Testowy nauczyciel blokuje zlecenie; sama testowa szkoła nie blokuje zlecenia nietestowego nauczyciela.                                                                                      |
| ORD-SPEC-35980-33     | Kontrola dodatnia z rzeczywistym zapisem zamówienia w UI i obiema flagami wyłączonymi.                                                                                                       |
| ORD-DB-06             | Rzeczywisty klucz źródło–kopia w SQL i porównanie niepustej historii tej samej bieżącej pozycji w UI.                                                                                        |
| ORD-DB-07/-08         | Istniejące faktury/korekty i powiązane kopie: bieżące treści, ilości i symbol.                                                                                                               |
| ORD-DB-09/-10         | Istniejące anulowane/usunięte źródła z zachowanym powiązaniem: soft delete kopii i audyt. Brak takiej pary oznacza SKIP.                                                                     |

Własny nauczyciel odbiorcy jest teraz przypisany wyłącznie do szkoły docelowej (pozostałe testy uprawnień zachowują domyślny wariant dwóch szkół). Flagi Testowy w gratisach są odczytywane ponownie z API przed formularzem. Nie zmieniamy zgód E-mail na podstawie przypuszczenia. Nie wywołujemy wysyłek, drukowania ani synchronizacji, nie zmieniamy statusów SQL. Biznesowy kod błędu formularza jest sprawdzany nawet przy HTTP 200.

Źródła i kopie w testach integracyjnych są łączone przez rzeczywistą tabelę `RelationsCopiedInstitutionsOrders`, nie podobieństwo symbolu. Odczyt jest ograniczony do DEV, stałych SELECT, parametryzowanych identyfikatorów i niewielkiego zbioru kandydatów. Istniejące dane biznesowe nie są modyfikowane.

Przebieg `b644e94c-4c27-494f-a59a-cbec62176042`: **14 PASS, 2 FAIL, 2 SKIP**. Potwierdzono nowe audyty, zawieszenie/readonly, podstawy BOK i lokalnego zamówienia, izolację przedmiotu, historię oraz bieżące FV/KFV. Dwa SKIP dotyczą braku istniejących par anulowanego/usuniętego źródła z zachowanym powiązaniem. -31 ponownie utworzył zlecenie mimo testowej szkoły; niewysłane własne zlecenia są sprzątane, dowód pozostaje w raporcie. -29 początkowo odczytywał poprzedni rok z listy bieżącej; poprawiono go na kontrolę zapisanego formularza i eksportu dla wskazanego roku. Ta ostatnia zmiana oraz nowy -33 wymagają osobnego wykonania.

Końcowy przebieg `59f312f2-f25c-4296-8dc2-81c3cb76fafb`: **7 PASS, 9 FAIL, 0 SKIP**. Obejmuje istniejące -11–17 i nowe -25–33. Przeszły wszystkie -25–29 (w tym poprawiony eksport poprzedniego roku) oraz -30/-32. -31 ponownie utworzył zlecenie mimo testowej szkoły. Dodatnie -14–17 i -33 nie utworzyły zlecenia; także kontrola z zamówieniem zapisanym przez UI wymaga dalszego porównania przygotowania z działającym przykładem. -13 nadal liczy 31 sztuk źródła bez kopii; -11/-12 liczą 62 zamiast 31, a po usunięciu kopii/redukcji źródła odpowiednio 31/58 zamiast 0/29. Raport zawiera też różnicę progu 15/30; bez rozstrzygnięcia reguł agregacji w strukturze nie klasyfikujemy jej jako osobnego błędu. Własne niewysłane zlecenia posprzątano; dowody pozostają w archiwum.

W UI automatyzacja oznacza zaimplementowane kroki, nie ich zaliczenie. Scenariusze dokumentowych skutków struktury, generowania gratisów i obserwowalnych uprawnień mają komplet implementacji w swoim jawnym zakresie. Pozostają dwa scenariusze częściowe: kontrolowane zdarzenie/synchronizacja historii oraz faktura/korekta/anulowanie/usunięcie z przeliczeniami przed/po. DEV nie udostępnia wyzwalacza tych zdarzeń. Nie tworzymy pustych atrap ani nie uznajemy stanu zastanego za dowód przejścia. Wewnętrzne `baseAccess`, `promotionAccess`, `validTo` i kontrola zegara nie są ujawnione przez dostępny kontrakt; testy publicznego wyniku nie są dowodem ich trwałości.
