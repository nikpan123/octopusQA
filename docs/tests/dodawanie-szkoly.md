# Dodawanie szkoły — plan testów automatycznych

## 1. Cel dokumentu

Dokument opisuje rekomendowaną metodykę oraz zakres testów funkcji dodawania szkoły. Jest planem rozwoju automatyzacji, a nie deklaracją, że wszystkie wymienione scenariusze są już zaimplementowane.

Głównym celem zestawu jest sprawdzenie kontraktu formularza dodawania szkoły przy możliwie krótkim czasie wykonania, pełnej izolacji danych oraz wiarygodnej diagnostyce błędów.

## 2. Stan obecny

Projekt zawiera obecnie dwa przypadki związane bezpośrednio z dodawaniem szkoły:

| Identyfikator | Lokalizacja                              | Obecne sprawdzenie                                                                                       |
| ------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `SCH-01`      | krok w `tests/szkola-nauczyciel.spec.ts` | utworzenie szkoły podstawowej, oznaczenie jej jako Testowy, wyszukanie po nazwie oraz sprawdzenie adresu |
| `SCH-02`      | `tests/walidacja-anulowanie.spec.ts`     | anulowanie kompletnego formularza i potwierdzenie, że szkoła nie powstała                                |

`SCH-01` jest częścią długiego testu smoke obejmującego również nauczyciela, relację i historię zmian. Zapewnia pokrycie procesu end-to-end, ale nie powinien zastępować krótkich, samodzielnych testów kontraktu formularza szkoły.

Aktualny helper `prepareSchool()` korzysta z danych:

- unikalna nazwa `REG_*`,
- typ `Szkoła podstawowa`,
- kod pocztowy `80-064`,
- miejscowość `Gdańsk`,
- unikalny numer budynku.

Szkoły utworzone przez testy nie są obecnie usuwane przez globalny cleanup. Przed dodaniem kolejnych pozytywnych scenariuszy należy rozwiązać ten problem, aby regularna regresja nie zanieczyszczała środowiska.

## 3. Metodyka

### 3.1. Podział odpowiedzialności UI i API

Dodawanie szkoły jest badaną funkcją, dlatego właściwy zapis szkoły musi przechodzić przez UI. API należy wykorzystywać tylko do:

- przygotowania danych niezwiązanych bezpośrednio z formularzem szkoły,
- jednoznacznego potwierdzenia zapisanego rekordu i jego pól,
- sprawdzenia braku rekordu po walidacji lub anulowaniu,
- bezpiecznego cleanupu danych utworzonych przez test.

Nie należy tworzyć szkoły przez API w scenariuszu, którego celem jest sprawdzenie jej dodania przez użytkownika.

### 3.2. Jedna reguła biznesowa na scenariusz

Każdy test powinien mieć jeden główny powód niepowodzenia. Przykładowo test braku nazwy nie powinien jednocześnie sprawdzać niepoprawnego kodu pocztowego. Dzięki temu raport wskazuje konkretną regresję, a scenariusze pozostają krótkie.

Wyjątkiem pozostaje `SCH-01 @smoke`, który celowo weryfikuje pełny przepływ biznesowy.

### 3.3. Dane i izolacja

Każdy pozytywny scenariusz powinien:

1. Generować unikalną nazwę z prefiksem `REG_<run-id>`.
2. Używać unikalnego numeru budynku lub innego pola pomocniczego, jeśli jest potrzebne do uniknięcia kolizji.
3. Zapisać ID szkoły natychmiast po utworzeniu.
4. Oznaczyć rekord jako Testowy, jeśli pozwala na to przepływ aplikacji.
5. Rejestrować wynik i dane potrzebne do diagnostyki w `runs/REG_*.json`.
6. Nie zależeć od szkoły utworzonej przez inny test.

Testy muszą nadawać się do równoległego wykonania przez 2–4 workery. Współdzielona szkoła referencyjna może służyć wyłącznie jako dane wejściowe do testów innych funkcji; nie może być modyfikowana przez zestaw dodawania szkoły.

### 3.4. Synchronizacja

Oczekiwania powinny być powiązane ze stanem aplikacji lub odpowiedzią sieciową:

- zapis szkoły — odpowiedź właściwego żądania i przejście na URL z ID,
- wyszukiwanie miejscowości — zakończenie żądania i pojawienie się dokładnego wiersza,
- zamknięcie okna — brak dialogu w DOM,
- zapis adresu — widoczna wartość adresu w formularzu szkoły,
- walidacja — konkretny komunikat oraz pozostanie formularza otwartego.

Nie należy dodawać statycznych opóźnień ani ogólnych oczekiwań na bezczynność całej sieci.

### 3.5. Warstwy weryfikacji

Dla scenariusza pozytywnego rekomendowany jest następujący zakres:

1. UI potwierdza zakończenie zapisu i prezentuje ID.
2. API potwierdza dokładnie jeden rekord oraz wartości zapisanych pól.
3. Ponowne otwarcie panelu potwierdza trwałość danych tylko tam, gdzie jest to celem scenariusza.

Nie każdy test musi ponownie wyszukiwać szkołę, otwierać panel i sprawdzać wszystkie pola. Pełną ścieżkę zachowuje `SCH-01`; krótsze testy sprawdzają tylko własną regułę.

## 4. Warunek rozpoczęcia implementacji: cleanup szkół

Rozbudowę pozytywnych testów należy poprzedzić przygotowaniem kontrolowanego cleanupu szkół. Mechanizm powinien spełniać co najmniej następujące warunki:

- usuwa wyłącznie szkoły utworzone w bieżącym przebiegu,
- wymaga zgodności ID, prefiksu `REG_*` i flagi Testowy,
- nie usuwa szkoły, jeśli powstały przy niej nieoczekiwane zależności,
- pozostawia dane nieudanego testu do diagnostyki,
- zapisuje wynik cleanupu w rejestrze przebiegu,
- potwierdza brak rekordu po operacji,
- nie ponawia automatycznie niepewnej operacji usuwania.

Jeżeli aplikacja nie udostępnia bezpiecznego kontraktu usuwania szkoły, pozytywne przypadki powinny być uruchamiane w kontrolowanym zakresie do czasu uzgodnienia retencji danych. Nie należy kopiować cleanupu nauczycieli bez potwierdzenia kontraktu endpointu dla szkół.

## 5. Rekomendowany zakres pierwszej iteracji

Poniższa numeracja kontynuuje istniejące `SCH-01` i `SCH-02`. Nazwy komunikatów walidacyjnych oraz dokładne zachowanie dla duplikatu trzeba potwierdzić w wymaganiach lub aktualnym kontrakcie aplikacji przed implementacją asercji.

| ID       | Priorytet | Scenariusz                                                       | Najważniejsze sprawdzenie                                                                                    |
| -------- | --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `SCH-03` | P0        | Dodanie szkoły z minimalnym poprawnym zestawem danych            | powstaje jeden rekord; nazwa, typ i adres są zapisane zgodnie z formularzem                                  |
| `SCH-04` | P0        | Próba zapisu bez nazwy                                           | zapis jest zablokowany, formularz pozostaje otwarty, widoczny jest komunikat dla nazwy, rekord nie powstaje  |
| `SCH-05` | P0        | Próba zapisu bez typu szkoły                                     | zapis jest zablokowany, formularz pozostaje otwarty, widoczny jest komunikat dla typu, rekord nie powstaje   |
| `SCH-06` | P0        | Próba zapisu bez adresu                                          | zapis jest zablokowany, formularz pozostaje otwarty, widoczny jest komunikat dla adresu, rekord nie powstaje |
| `SCH-07` | P0        | Wyszukanie i wybranie miejscowości po poprawnym kodzie pocztowym | lista zawiera właściwą miejscowość, a wybór zapisuje oczekiwany kod i miasto w adresie                       |
| `SCH-08` | P0        | Niepoprawny lub nieznany kod pocztowy                            | adresu nie można zatwierdzić; aplikacja pokazuje jednoznaczną informację i nie tworzy szkoły                 |
| `SCH-09` | P1        | Anulowanie okna adresu                                           | dane adresu nie trafiają do formularza szkoły, a zapis szkoły bez wymaganego adresu pozostaje zablokowany    |
| `SCH-10` | P0        | Dwukrotna aktywacja zapisu                                       | powstaje najwyżej jeden rekord i jedno ID; UI nie wysyła dwóch skutecznych zapisów                           |
| `SCH-11` | P0        | Trwałość danych po ponownym otwarciu                             | nazwa, typ i pełny adres są zgodne po odczycie świeżego stanu rekordu                                        |
| `SCH-12` | P1        | Wyszukanie nowej szkoły po nazwie i identyfikacja po ID          | wynik zawiera dokładnie utworzony rekord, bez dopasowania innej szkoły o podobnej nazwie                     |

Pierwsza iteracja powinna objąć wszystkie przypadki P0. `SCH-09` i `SCH-12` można dodać po ustabilizowaniu podstawowego zestawu, ponieważ anulowanie całego formularza jest już pokryte przez `SCH-02`, a wyszukanie szkoły występuje w `SCH-01`.

## 6. Dalsze scenariusze po potwierdzeniu kontraktu biznesowego

### 6.1. Typ szkoły

Pełna lista typów powinna pochodzić z API słownikowego lub wymagań, nie z wartości wpisanych na stałe na podstawie obserwacji UI.

Rekomendowana strategia:

- jeden scenariusz reprezentatywny dla szkoły podstawowej,
- jeden scenariusz reprezentatywny dla szkoły ponadpodstawowej,
- lekki test kontraktu słownika sprawdzający dostępność wszystkich wspieranych wartości,
- bez powielania pełnego procesu dodawania dla każdego typu, jeżeli zachowanie formularza jest identyczne.

### 6.2. Nazwa szkoły

Po ustaleniu reguł walidacji warto rozważyć:

- minimalną i maksymalną dopuszczalną długość,
- spacje na początku i końcu oraz oczekiwaną normalizację,
- polskie znaki, cyfry i typową interpunkcję,
- nazwę przekraczającą limit,
- duplikat nazwy w tej samej miejscowości,
- tę samą nazwę pod innym adresem.

Test duplikatu musi odzwierciedlać rzeczywistą regułę biznesową. Nie należy zakładać, że sama nazwa jest unikalna, dopóki kontrakt tego nie potwierdza.

### 6.3. Adres

Po potwierdzeniu pól i walidacji adresu warto dodać:

- kod z wieloma pasującymi miejscowościami,
- zmianę kodu po wcześniejszym wyborze miejscowości,
- zmianę wybranej miejscowości,
- wymagany numer budynku,
- numer z literą lub separatorem, jeśli jest dozwolony,
- opcjonalny numer lokalu,
- ponowne otwarcie i edycję adresu przed zapisaniem szkoły.

### 6.4. Odporność techniczna

Osobny, niewielki zestaw może sprawdzać:

- błąd odpowiedzi podczas zapisu szkoły,
- błąd lub timeout wyszukiwania miejscowości,
- ponowienie przez użytkownika po kontrolowanym błędzie,
- zachowanie wpisanych danych po błędzie serwera.

Takie przypadki powinny korzystać z przechwycenia ruchu sieciowego i kontrolowanej odpowiedzi. Nie wolno wywoływać rzeczywistej awarii środowiska współdzielonego.

## 7. Ograniczanie redundancji

Zestaw dodawania szkoły nie powinien ponownie sprawdzać funkcji pokrytych w innych obszarach:

- relacji z nauczycielem — `REL-*`,
- zamówień szkoły — `ORD-*`,
- medalowości — `MED-*`,
- pełnego przepływu szkoła–nauczyciel — scenariusz `@smoke`,
- ogólnego braku wyników wyszukiwania — `FIND-04`.

W teście dodawania wystarczy potwierdzić, że szkoła została zapisana poprawnie. Zachowanie modułów zależnych powinno pozostać w ich własnych specyfikacjach.

## 8. Organizacja plików i tagów

Rekomendowana docelowa struktura:

```text
tests/szkola-dodawanie.spec.ts
tests/support/school-add.ts
docs/tests/dodawanie-szkoly.md
```

Proponowane tagi:

| Tag           | Przeznaczenie                           |
| ------------- | --------------------------------------- |
| `@school`     | wszystkie testy szkoły                  |
| `@school-add` | funkcja dodawania szkoły                |
| `@positive`   | poprawny zapis                          |
| `@validation` | walidacje formularza                    |
| `@address`    | wyszukiwanie i zapis adresu             |
| `@duplicate`  | zachowanie dla potencjalnych duplikatów |
| `@cancel`     | anulowanie operacji                     |

Helper domenowy powinien oddzielać czynności od asercji scenariusza. Może obsługiwać otwarcie formularza, wypełnienie sekcji adresowej i odczyt ID, ale nie powinien ukrywać decyzji biznesowej testu ani automatycznie wypełniać pola, którego brak jest przedmiotem walidacji.

## 9. Pomiar czasu i kryteria jakości

Nowy zestaw powinien korzystać z istniejącego raportowania czasu fixture/setup/test/cleanup. Dla tagu `@school-add` należy obserwować co najmniej:

- p50 i p95 całego testu,
- czas wyszukiwania miejscowości,
- czas zapisu szkoły,
- czas weryfikacji API,
- czas cleanupu,
- liczbę żądań i odpowiedzi 4xx/5xx,
- stabilność przy dwóch workerach oraz kontrolnie przy czterech.

Proponowane kryteria przyjęcia pierwszej iteracji:

1. Wszystkie testy przechodzą w trzech kolejnych przebiegach na dwóch workerach.
2. Brak statycznych oczekiwań czasowych.
3. Każdy utworzony rekord ma zapisane ID i status cleanupu.
4. Nieudany test pozostawia wystarczające dane do diagnostyki.
5. Wzrost p95 regularnej regresji jest zmierzony i zaakceptowany.
6. Próba na czterech workerach nie powoduje duplikatów ani błędów współbieżności; jeżeli powoduje, profil pozostaje eksperymentalny.

## 10. Kolejność wdrożenia

1. Potwierdzić kontrakt API zapisu, odczytu i usuwania szkoły.
2. Dodać bezpieczny rejestr oraz cleanup szkół.
3. Wydzielić helper formularza bez ukrytych asercji biznesowych.
4. Zaimplementować przypadki P0: `SCH-03`–`SCH-08`, `SCH-10` i `SCH-11`.
5. Uruchomić serię pomiarową na dwóch workerach i przeanalizować p50/p95.
6. Dodać `SCH-09` i `SCH-12`, jeśli wnoszą wartość ponad `SCH-01`, `SCH-02` i `FIND-04`.
7. Dopiero po potwierdzeniu reguł biznesowych rozszerzyć macierz nazw, typów, adresów i duplikatów.
8. Zaktualizować indeks scenariuszy po faktycznym dodaniu testów.

## 11. Definicja ukończenia scenariusza

Scenariusz dodawania szkoły jest gotowy, gdy:

- ma jednoznaczny cel i oczekiwany wynik,
- używa własnych, unikalnych danych,
- nie zależy od kolejności testów,
- oczekuje na stan aplikacji lub odpowiedź sieciową,
- potwierdza utworzenie albo brak rekordu,
- zapisuje dane diagnostyczne,
- ma bezpieczną strategię cleanupu,
- działa niezależnie oraz w regularnej regresji równoległej,
- jego zakres jest opisany w tym dokumencie i w generowanym indeksie po implementacji.
