# Defekt MED-30 / MED-60 — filtr `Medal = Brak`

## Podsumowanie

Wyszukiwanie szkół z wartością `Medal = Brak` zwraca pustą listę, mimo że w DEV istnieją szkoły bez medalu. Problem jest powtarzalny w interfejsie i w odpowiedzi endpointu wyszukiwarki.

## Środowisko

- środowisko: DEV (`https://octopus.gwodev.pl`),
- data potwierdzenia: 2026-10-12,
- endpoint: `GET /api/InstitutionBrowser/GetInstitutions`,
- szkoła kontrolna: ID `92928`, Szkoła Podstawowa nr 403 w Warszawie.

## Kroki odtworzenia

1. Otworzyć panel szkół.
2. Otworzyć wyszukiwarkę.
3. W polu Medal wybrać `Brak`.
4. Uruchomić wyszukiwanie.

## Rezultat aktualny

- interfejs pokazuje `Brak wyników wyszukiwania` i `Rekordów: 0`,
- żądanie zawiera `filterModel.medal = [null]`,
- endpoint odpowiada HTTP 200 z pustą tablicą danych,
- `MED-30` i `MED-60` kończą się niepowodzeniem.

## Rezultat oczekiwany

Wyniki powinny zawierać co najmniej szkołę `92928`, a każdy zwrócony rekord powinien mieć kategorię medalu `Brak` i pustą listę `subjectNames`.

## Dowody kontrolne

- `MED-19` przechodzi: wyszukanie szkoły `92928` po ID pokazuje w tabeli `Medal = Brak`.
- `MED-43` przechodzi: API i UI dla szkoły `92928` zwracają `Brak` oraz zero przedmiotów medalowych.
- `MED-30` nie przechodzi: filtr w UI zwraca zero rekordów.
- `MED-60` nie przechodzi: odpowiedź API dla filtra medalu zawiera zero szkół.

## Wniosek techniczny

Dane szkoły i wyliczenie medalu są poprawne. Usterka znajduje się w kontrakcie filtra wyszukiwarki: wartość etykiety `Brak` jest serializowana jako `null`, a backend nie zwraca dla niej szkół bez medalu. Z samego repozytorium testowego nie da się rozstrzygnąć, czy naprawa powinna mapować `Brak` na wartość domenową po stronie klienta, czy interpretować `null` jako brak medalu po stronie API.

## Kryteria akceptacji

- filtr `Medal = Brak` zwraca szkoły bez medalu,
- inne kategorie medalu nadal działają bez zmian,
- multiselect zawierający `Brak` działa zgodnie z wybranymi wartościami,
- `MED-30` i `MED-60` przechodzą bez oznaczania ich jako oczekiwane awarie.
