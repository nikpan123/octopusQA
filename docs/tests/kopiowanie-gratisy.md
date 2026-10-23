# Gratisy wynikające z kopii zamówienia

Scenariusz `ORD-SC-35980-13` jest powiązany z ośmioma testami w `tests/zamowienia-kopie-gratisy.spec.ts`. Testowy nauczyciel blokuje generowanie, natomiast sama testowa szkoła nie blokuje zlecenia nietestowego nauczyciela. Zlecenie z blokadami również spełnia dodatnie oczekiwanie. Nie oceniamy kwalifikacji do wysyłki. Implementacja nie oznacza zaliczonego wykonania.

Źródło: przekazany przez użytkownika plik `Wymagania biznesowe 26-27.xlsx`:

- `potw sp i sś 2026`, F42:F49: Fizyka z plusem, klasa 7, produkt F7P (3005), zamówienia 2026/2027 i współczynnik 60% z minimum 5 sztuk;
- `potw sp i sś 2026`, A88:A97: potwierdzenie właściwego roku, przedmiotu i klasy, zakup szkoły, wyzwalanie po zamówieniu lub potwierdzeniu oraz blokady;
- `Blokady automat 26`, B4:B8: brak zamówień, za mała ilość, wcześniejsze otrzymanie produktu i kwalifikująca ilość;
- `kiedy jest wysyłka i czego 26`, A38:I38: mapowanie produktu F7P;
- dokumentacja #35980: kopie podlegają logice gratisów; #35950 i #35990: przeliczenie skutków zmian bez ingerencji w wysłane gratisy.

| Test              | Sprawdzenie                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| ORD-SPEC-35980-14 | Kontrola: oryginalne zamówienie 30 F7P w szkole nauczyciela, potem formularz — powstaje zlecenie FIZ. |
| ORD-SPEC-35980-15 | Kopia 29 F7P, potem formularz — powstaje zlecenie FIZ niezależnie od blokad.                          |
| ORD-SPEC-35980-16 | Kopia 30 F7P, potem formularz — powstaje zlecenie FIZ niezależnie od blokad.                          |
| ORD-SPEC-35980-17 | Kopia 31 F7P, potem formularz — powstaje zlecenie FIZ niezależnie od blokad.                          |
| ORD-SPEC-35980-30 | Testowy nauczyciel, nietestowa szkoła: zlecenie nie powstaje.                                         |
| ORD-SPEC-35980-31 | Nietestowy nauczyciel, testowa szkoła: zlecenie powstaje.                                             |
| ORD-SPEC-35980-32 | Obie flagi Testowy włączone: zlecenie nie powstaje.                                                   |
| ORD-SPEC-35980-33 | Obie flagi wyłączone: kontrola dodatnia z zamówieniem zapisanym przez rzeczywisty formularz UI.       |

Wcześniejsze robocze przypadki -18/-19 dotyczące utraty kwalifikacji nie należą do tego zestawu. Ocena progów, przyczyn blokad, ilości gratisów i skutków usunięcia kopii pozostaje osobnym zakresem; nie jest oznaczana jako pokryta tymi testami. Starsze raporty o szerszym zakresie nie są przepisywane.

## Wyjaśnienie wcześniejszych FAIL — numer budynku

Przyczyną braku zleceń w -14–17/-33 było przygotowanie adresu, nie flaga Testowy. Helper szkół wpisywał do pola numeru budynku `CAT-${definition.key}`. Dla `ENT_UNMARKED_SECOND_COPY_GIFT_<12 znaków>_P0_W0` dawało to 52 znaki. Procedura `SendBookFromFormClubPS` używa tabeli `#tmpAdresy` z `Numer NVARCHAR(50)`; istniejąca testowa szkoła z krótszym kluczem miała 43 znaki. Odczyt SQL potwierdził długości 52/43; definicje procedur jedynie odczytano, nie wykonywano ich ręcznie.

Numer nowych szkół jest teraz stałym 16-znakowym identyfikatorem opartym na skrócie klucza. Pełna identyfikacja i własność pozostają w nazwie szkoły. Nie zmieniano danych istniejących szkół biznesowych, flag, progów ani reguł zgód. Regresja lokalna zabezpiecza długość numeru również dla bardzo długich kluczy. Kontrola -33 zapisuje teraz również potwierdzenie klubowe przez rzeczywisty formularz UI, nie tylko zamówienie. Próby zamiany kolejności formularz/zamówienie oraz zgody E-mail nie usunęły problemu; usunięto tymczasowy przypadek diagnostyczny, bez dodawania tych warunków do właściwych testów.

Poniższe wcześniejsze wyniki FAIL pozostają historyczne; nie stanowią potwierdzenia błędu biznesowego generowania gratisów.

Weryfikacja poprawki DEV: `65811f61-bacc-4e0b-a094-7e1f1a42654f`, **7 PASS, 0 FAIL, 0 SKIP**, sprzątanie zakończone. Przeszły -14–17, -30, -32 i pełny wariant UI -33. Nie uruchamiano ponownie -31 zgodnie z wcześniejszą prośbą użytkownika. Dodatnie przypadki zachowały obie flagi wyłączone i brak zgód E-mail/Marketing; formularze nadal mają `sendEmail: false`. Tym samym skrócenie numeru adresowego, bez dodania zgód ani zmiany oczekiwań, usunęło niepowodzenia. Wspólny helper szkół tworzy odtąd krótkie numery dla nowych rekordów; istniejące rekordy nie są migrowane ani nadpisywane.

## Bezpieczeństwo danych

Każdy przypadek używa nowego nauczyciela REG z adresem example.invalid, własnego potwierdzenia z `sendEmail: false` i własnych zamówień. Nauczyciel jest przypisany tylko do szkoły docelowej. Przypadki -14–17/-33 mają obie flagi wyłączone; -31 sprawdza dodatnio samą testową szkołę, a -30/-32 brak zlecenia testowego nauczyciela. Rzeczywiste wartości flag są ponownie czytane przez API tuż przed formularzem. Nie zmieniamy zgód E-mail jako domniemanej reguły generowania.

Późniejsza korekta użytkownika: wcześniejsze FAIL -31 wynikały z błędnego oczekiwania braku zlecenia przy samej testowej szkole, nie z błędu systemu. Poprawiono oczekiwanie i powiązanie kroku; zgodnie z prośbą poprawionego testu nie uruchamiano. Starsze raporty zachowują historyczne wyniki i nie są przepisywane na PASS.

Przygotowanie wymaga pustych szkół i braku wcześniejszych gratisów nauczyciela. Odczyty odpowiadają zakładce Gratisy: GetPositions i GetNotDel. W negatywnych przypadkach brak zlecenia jest obserwowany przez co najmniej 3 sekundy, nie tylko w pierwszym odczycie. Nie są wywoływane drukowanie etykiet, nadawanie, przekazywanie do wysyłki ani ręczna zmiana statusu zlecenia.

Sprzątanie usuwa własną kopię, oryginał, relację i potwierdzenie, a następnie tylko niewysłane zlecenia tego nowego nauczyciela. Kontrola zatrzymuje się, jeżeli zlecenie ma identyfikator wysyłki, datę nadania, wydruk lub zamknięcie. Błędy sprzątania nie są ignorowane.

Wykonanie `19455986-31c9-4149-b693-b459670d6482`: -30 i -32 przeszły; -31 utworzył zlecenie 2170627 dla własnego nauczyciela 535338 i testowej szkoły 94614, więc prawidłowo zakończył się FAIL. Dowód pozostaje w raporcie; po sprzątaniu własne zlecenie jest nieaktywne. -14 nadal nie utworzył zlecenia przy obu flagach wyłączonych. To nie jest powód do odwrócenia oczekiwań. Kontrola -33 porównuje przygotowanie zamówienia w UI z przygotowaniem API, bez zmiany reguły biznesowej.

## Pozostałe luki

Kontrola flag `27b4e3f9-346b-4cc3-8792-cfeb0511b895`: -14 i -33 nadal FAIL z powodu braku zlecenia. API potwierdziło `teacher=false, school=false` przed formularzem, po nim i po oczekiwaniu; dodatkowo UI nauczyciela potwierdziło odznaczony checkbox Testowy. Nauczyciele 535377 i 535378, szkoła 94669. Nie stwierdzono ponownego włączenia flagi. W raporcie są osobne załączniki z wartościami i momentem odczytu. Nie jest to dowód przyczyny braku generowania. Dodano otwarcie nauczyciela i zakładki Gratisy po formularzu; sam odczyt/przygotowanie nadal korzysta z API. Kontrolę UI rozszerzono również na kombinacje flag -30–32, ale tych przypadków w tym przebiegu nie uruchamiano.

Ponowne wykonanie `59f312f2-f25c-4296-8dc2-81c3cb76fafb` potwierdziło: -30 i -32 PASS, -31 FAIL (powstało zlecenie 2170629 dla testowej szkoły 94635). Dodatnie -14–17 oraz kontrola -33 nadal nie utworzyły zlecenia. W -33 zamówienie zapisano przez rzeczywisty formularz UI, a obie flagi Testowy odczytane przed formularzem były wyłączone. Nie jest to jeszcze dowód błędu samego kopiowania: nie działa również kontrola z oryginałem. Należy nadal porównać komplet warunków przygotowania z działającym przykładem użytkownika. Oczekiwania nie zostały odwrócone w celu uzyskania PASS.

Do osobnego pokrycia pozostają kwalifikacja do wysyłki (progi, minimum 5 sztuk, wcześniejsze otrzymanie produktu i inne blokady), skutki zmiany/usunięcia kopii oraz pozostałe produkty i klasy. Wariant już wysłanego gratisu wymaga zastanych, potwierdzonych danych albo kontrolowanego mechanizmu testowego, który nie uruchamia prawdziwej wysyłki. Nie zastępujemy go ręczną zmianą flag w bazie.

Weryfikacja DEV 21.10.2026: przebieg `d1ca8838-d6dd-4440-addf-ef0d31857ba2`, kontrolny -14, zakończył się FAIL: po zapisaniu zamówienia i formularza oraz potwierdzeniu NASZ lista zleceń FIZ pozostaje pusta. Nie jest to błąd asercji blokady ani dowód błędu kopiowania (kontrola używa oryginału). Przygotowanie nadal wymaga porównania z działającym przykładem użytkownika; test nie jest uznany za zaliczony.

Anulowanie/usunięcie w Softlabie i kontrolowana synchronizacja nadal nie są dostępne na DEV. Odczyt istniejącego stanu nie jest dowodem wykonania całego procesu integracyjnego.
