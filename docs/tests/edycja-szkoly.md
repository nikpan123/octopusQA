# Edycja szkoły — dokumentacja testów automatycznych

## Cel

Zestaw sprawdza edycję istniejącej szkoły przez interfejs użytkownika. Każdy scenariusz tworzy własną szkołę testową przez UI, oznacza ją flagą `Testowy`, a następnie wykonuje edycję na tym rekordzie. Szkoły pozostają w bazie, ponieważ Octopus nie udostępnia operacji ich usuwania.

## Scenariusze

| ID            | Sprawdzenie                                                                |
| ------------- | -------------------------------------------------------------------------- |
| `SCH-EDIT-01` | formularz edycji wczytuje bieżącą nazwę szkoły                             |
| `SCH-EDIT-02` | anulowanie zmiany nazwy nie modyfikuje panelu ani trwałego rekordu         |
| `SCH-EDIT-03` | zapisana zmiana nazwy pozostaje widoczna po ponownym otwarciu szkoły       |
| `SCH-EDIT-04` | osobne edycje WWW i e-maila pozostają widoczne po ponownym otwarciu szkoły |
| `SCH-EDIT-05` | zapisana zmiana nazwy z SIO pozostaje widoczna po ponownym otwarciu szkoły |
| `SCH-EDIT-06` | anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość                 |
| `SCH-EDIT-07` | wyczyszczenie wymaganej nazwy nie pozwala zapisać edycji                   |
| `SCH-EDIT-08` | typ i poziom szkoły są tylko do odczytu w formularzu edycji                |

## Metodyka

- Przygotowanie rekordu oraz badana edycja przechodzą przez UI.
- Dane są unikalne dla scenariusza, dlatego testy mogą działać równolegle.
- Trwałość jest sprawdzana po ponownym pobraniu panelu szkoły, a nie tylko bezpośrednio po zamknięciu dialogu.
- Anulowanie jest sprawdzane zarówno na bieżącym panelu, jak i po ponownym otwarciu rekordu.
- Fixture udostępnia również `createSchoolViaApi()` do szybkiego przygotowania szkoły, gdy formularz dodawania nie jest przedmiotem testu. Obecny zestaw `SCH-EDIT-*` nadal świadomie używa ścieżki UI.
- Domyślne identyfikatory w `createSchoolViaApi()` są potwierdzone wyłącznie dla typu „Szkoła podstawowa” i miasta Gdańsk (80-064). Inny typ lub miasto wymaga jawnych, wcześniej zweryfikowanych `typeId` i `cityId`.

## Uruchomienie

```text
npm test -- tests/szkola-edycja.spec.ts
npm test -- --grep @school-edit
```
