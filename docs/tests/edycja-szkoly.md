# Edycja szkoły — dokumentacja testów automatycznych

## 1. Cel sekcji

Zestaw `SCH-EDIT-*` sprawdza edycję istniejącej szkoły przez interfejs użytkownika: dane podstawowe, adres, telefon, dane SIO, historię, zapis i anulowanie zmian, trwałość oraz odporność zapisu na kontrolowane błędy sieciowe.

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

## 4. Zakres SCH-EDIT-01–SCH-EDIT-24

Zestaw zawiera **27 logicznych identyfikatorów** (`SCH-EDIT-01`–`SCH-EDIT-24`, w tym warianty `10A`, `11A` i `11B`). `SCH-EDIT-16` jest parametryzowany dla siedmiu typów szkół, dlatego plik wykonuje łącznie **33 testy Playwright**.

| ID             | Sprawdzenie                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SCH-EDIT-01`  | formularz edycji wczytuje bieżącą nazwę szkoły                                                                                                              |
| `SCH-EDIT-02`  | anulowanie zmiany nazwy nie modyfikuje trwałego rekordu                                                                                                     |
| `SCH-EDIT-03`  | zapisana zmiana nazwy pozostaje po ponownym otwarciu szkoły                                                                                                 |
| `SCH-EDIT-04`  | osobne edycje WWW i e-maila są trwałe                                                                                                                       |
| `SCH-EDIT-05`  | zmiana nazwy z SIO jest trwała                                                                                                                              |
| `SCH-EDIT-06`  | anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość                                                                                                  |
| `SCH-EDIT-07`  | pusta wymagana nazwa blokuje zapis                                                                                                                          |
| `SCH-EDIT-08`  | typ i poziom szkoły podstawowej są tylko do odczytu                                                                                                         |
| `SCH-EDIT-09`  | anulowanie edycji WWW zachowuje poprzednią wartość                                                                                                          |
| `SCH-EDIT-10`  | WWW można wyczyścić, a pusta wartość pozostaje trwała                                                                                                       |
| `SCH-EDIT-10A` | rezygnacja z usunięcia WWW zachowuje poprzedni adres                                                                                                        |
| `SCH-EDIT-11`  | e-mail można wyczyścić, a pusta wartość pozostaje trwała                                                                                                    |
| `SCH-EDIT-11A` | anulowanie edycji e-maila zachowuje poprzedni adres                                                                                                         |
| `SCH-EDIT-11B` | rezygnacja z usunięcia e-maila zachowuje poprzedni adres                                                                                                    |
| `SCH-EDIT-12`  | e-mail z wielkimi literami jest normalizowany do małych liter po edycji                                                                                     |
| `SCH-EDIT-13`  | nazwa z polskimi znakami i interpunkcją jest trwała                                                                                                         |
| `SCH-EDIT-14`  | spacje na początku i końcu nazwy są usuwane po zapisie                                                                                                      |
| `SCH-EDIT-15`  | nazwę z SIO można wyczyścić                                                                                                                                 |
| `SCH-EDIT-16`  | typ i poziom są readonly dla siedmiu typów: Szkoła podstawowa, Liceum, Technikum, Placówka doskonalenia nauczycieli, Zespół szkół, Szkoła NPC i Przedszkole |
| `SCH-EDIT-17`  | kolejne edycje nazwy, nazwy SIO, WWW i e-maila nie nadpisują wcześniejszych zmian                                                                           |
| `SCH-EDIT-18`  | zmiana adresu przez osobny dialog jest trwała po ponownym otwarciu szkoły                                                                                   |
| `SCH-EDIT-19`  | zmiana liczby uczniów, RSPO, REGON i NIP w Akcji SIO jest trwała                                                                                            |
| `SCH-EDIT-20`  | można dodać drugi telefon stacjonarny po przełączeniu typu numeru                                                                                           |
| `SCH-EDIT-21`  | zmiana nazwy tworzy kompletny wpis historii: pole, wartość, autor, źródło i data                                                                            |
| `SCH-EDIT-22`  | kontrolowana odpowiedź HTTP 422 nie utrwala zmiany nazwy                                                                                                    |
| `SCH-EDIT-23`  | kontrolowana odpowiedź HTTP 500 nie utrwala zmiany nazwy                                                                                                    |
| `SCH-EDIT-24`  | kontrolowany timeout sieci nie utrwala zmiany nazwy                                                                                                         |

## 5. Reguły weryfikacji

- Trwałość zmian jest sprawdzana po ponownym otwarciu panelu szkoły, a nie tylko bezpośrednio po zamknięciu dialogu.
- Anulowanie musi zachować wartość zarówno na bieżącym panelu, jak i po ponownym odczycie rekordu.
- Pola opcjonalne `WWW`, `E-Mail` i `Nazwa z SIO` mogą zostać wyczyszczone, jeśli aktualny kontrakt aplikacji na to pozwala.
- Nazwa szkoły pozostaje wymagana.
- Normalizacja nazwy i e-maila jest sprawdzana na zapisanym rekordzie.
- Typ i wynikający z niego poziom są danymi tylko do odczytu podczas edycji.
- Kolejne zapisy różnych pól nie mogą przywracać starszych wartości pozostałych pól.
- Nieudany zapis danych podstawowych po 422, 500 lub timeout nie może zmienić rekordu w bazie.
- Historia zapisu musi pozwalać powiązać zmienione pole i wartość z autorem, źródłem i datą.

## 6. Obecne luki do dalszego pokrycia

Najważniejsze pola edycji i macierz 422/500/timeout są już chronione. Do dalszego pokrycia pozostają:

- usuwanie oraz zastępowanie istniejącego telefonu, w tym zmiana stacjonarny ↔ komórkowy;
- walidacje graniczne liczby uczniów, RSPO, REGON i NIP podczas edycji;
- dwa szybkie kliknięcia `Zapisz` w edycji;
- ponowienie zapisu po błędzie;
- konflikt równoczesnej edycji;
- role i uprawnienia do poszczególnych działań.

## 7. Retencja

Szkoły używane przez testy edycji otrzymują unikalne dane i flagę `Testowy`. Ich ID oraz rzeczywisty adres są zapisywane w `runs/REG_*.json`. Rekordy nie są automatycznie usuwane, ponieważ nie ma potwierdzonego endpointu cleanupu szkół.

## 8. Uruchamianie

```text
npx playwright test tests/szkola-edycja.spec.ts
npx playwright test --grep @school-edit
```
