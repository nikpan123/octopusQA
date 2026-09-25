# Edycja szkoły — dokumentacja testów automatycznych

## 1. Cel sekcji

Zestaw `SCH-EDIT-*` sprawdza edycję istniejącej szkoły przez interfejs użytkownika: wczytanie danych, zapis i anulowanie zmian, normalizację wartości, czyszczenie pól opcjonalnych, trwałość danych oraz pola tylko do odczytu.

Przygotowanie szkoły nie jest częścią badanego przepływu, dlatego rekord wejściowy powstaje przez API. UI pozostaje warstwą testowaną dla właściwej edycji.

## 2. Pliki

```text
tests/szkola-edycja.spec.ts
tests/support/school-edit.ts
tests/support/school-add.ts
tests/support/octopus.ts
tests/support/scenario.ts
```

## 3. Przygotowanie danych i podział UI/API

Helper `createSchoolForEdit()` wywołuje `app.createSchool(...)`, czyli przygotowuje własną, unikalną szkołę przez API, następnie oznacza rekord flagą `Testowy` i zapisuje jego ID do danych scenariusza. Samo otwieranie formularzy edycji, zmiana pól, zapis i anulowanie odbywają się przez UI.

Po utworzeniu szkoły helper odczytuje faktyczny adres z panelu:

```ts
const schoolAddress = await scenario.app.detail("address").inputValue();
await scenario.record("schoolAddress", schoolAddress);
```

Nie ma zależności od stałych `API_SCHOOL_CITY` ani `API_SCHOOL_POSTAL_CODE`. Dzięki temu setup pozostaje zgodny z faktycznym payloadem helpera API niezależnie od używanego miasta testowego.

Każdy scenariusz tworzy własny rekord, więc plik może działać równolegle. Szkoły pozostają w bazie, ponieważ Octopus nie udostępnia operacji ich usuwania.

## 4. Zakres SCH-EDIT-01–SCH-EDIT-17

`SCH-EDIT-16` jest testem parametryzowanym dla siedmiu typów szkół. Oznacza to **17 logicznych identyfikatorów**, ale **23 wykonywane testy Playwright**.

| ID | Sprawdzenie |
| --- | --- |
| `SCH-EDIT-01` | formularz edycji wczytuje bieżącą nazwę szkoły |
| `SCH-EDIT-02` | anulowanie zmiany nazwy nie modyfikuje trwałego rekordu |
| `SCH-EDIT-03` | zapisana zmiana nazwy pozostaje po ponownym otwarciu szkoły |
| `SCH-EDIT-04` | osobne edycje WWW i e-maila są trwałe |
| `SCH-EDIT-05` | zmiana nazwy z SIO jest trwała |
| `SCH-EDIT-06` | anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość |
| `SCH-EDIT-07` | pusta wymagana nazwa blokuje zapis |
| `SCH-EDIT-08` | typ i poziom szkoły podstawowej są tylko do odczytu |
| `SCH-EDIT-09` | anulowanie edycji WWW zachowuje poprzednią wartość |
| `SCH-EDIT-10` | WWW można wyczyścić, a pusta wartość pozostaje trwała |
| `SCH-EDIT-11` | e-mail można wyczyścić, a pusta wartość pozostaje trwała |
| `SCH-EDIT-12` | e-mail z wielkimi literami jest normalizowany do małych liter po edycji |
| `SCH-EDIT-13` | nazwa z polskimi znakami i interpunkcją jest trwała |
| `SCH-EDIT-14` | spacje na początku i końcu nazwy są usuwane po zapisie |
| `SCH-EDIT-15` | nazwę z SIO można wyczyścić |
| `SCH-EDIT-16` | typ i poziom są readonly dla siedmiu typów: Szkoła podstawowa, Liceum, Technikum, Placówka doskonalenia nauczycieli, Zespół szkół, Szkoła NPC i Przedszkole |
| `SCH-EDIT-17` | kolejne edycje nazwy, nazwy SIO, WWW i e-maila nie nadpisują wcześniejszych zmian |

## 5. Reguły weryfikacji

- Trwałość zmian jest sprawdzana po ponownym otwarciu panelu szkoły, a nie tylko bezpośrednio po zamknięciu dialogu.
- Anulowanie musi zachować wartość zarówno na bieżącym panelu, jak i po ponownym odczycie rekordu.
- Pola opcjonalne `WWW`, `E-Mail` i `Nazwa z SIO` mogą zostać wyczyszczone, jeśli aktualny kontrakt aplikacji na to pozwala.
- Nazwa szkoły pozostaje wymagana.
- Normalizacja nazwy i e-maila jest sprawdzana na zapisanym rekordzie.
- Typ i wynikający z niego poziom są danymi tylko do odczytu podczas edycji.
- Kolejne zapisy różnych pól nie mogą przywracać starszych wartości pozostałych pól.

## 6. Obecne luki do dalszego pokrycia

Na podstawie aktualnych helperów nie dodano jeszcze scenariuszy wymagających osobnych, potwierdzonych przepływów UI lub endpointów dla:

- edycji adresu istniejącej szkoły,
- edycji telefonu i przełączania komórka/stacjonarny,
- edycji liczby uczniów,
- edycji RSPO, REGON i NIP,
- błędu 5xx podczas zapisu edycji,
- dwóch szybkich kliknięć `Zapisz` w edycji,
- historii zmian szkoły.

Te obszary należy dopisać po potwierdzeniu selektorów, komunikatów i requestów używanych przez konkretne formularze edycji; dokumentacja nie zakłada ich zachowania na podstawie formularza dodawania.

## 7. Retencja

Szkoły używane przez testy edycji otrzymują unikalne dane i flagę `Testowy`. Ich ID oraz rzeczywisty adres są zapisywane w `runs/REG_*.json`. Rekordy nie są automatycznie usuwane, ponieważ nie ma potwierdzonego endpointu cleanupu szkół.

## 8. Uruchamianie

```text
npx playwright test tests/szkola-edycja.spec.ts
npx playwright test --grep @school-edit
```
