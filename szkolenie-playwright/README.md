# Playwright od podstaw — szkolenie na podstawie Twoich projektów

Poziom: znasz podstawy programowania i testowania, ale dopiero uczysz się pisać automaty.
Cel: samodzielnie napisać, uruchomić i poprawić test interfejsu w Playwright.
Materiał przygotowany 22.10.2026 na podstawie lokalnych projektów Hurtownia, Octopus i KsięgarniaCMS.

## Zacznij tutaj — pierwsze 30 minut

Najprostszy start w Windows: uruchom dwukrotnie **Pierwszy-test.cmd** w tym katalogu. Otworzy przeglądarkę, wykona pierwszy test i pozostawi wynik w oknie. Poniżej jest również wariant pracy z terminala.

1. Otwórz ten katalog w edytorze i terminalu.
2. Uruchom pierwszy test poleceniem poniżej.
3. Przeczytaj lekcje 1–3. Przepisz pierwszy test ręcznie, zamiast tylko kopiować.
4. Zmień oczekiwany nagłówek na błędny, uruchom test i przeczytaj błąd. Potem przywróć poprawny tekst.
5. W pliku `tests/05-twoje-cwiczenia.spec.ts` rozwiąż C1.

W PowerShell:

```powershell
Set-Location 'C:\Users\npanek\Documents\ChatGPT\Octopus\szkolenie-playwright'
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts 01-pierwszy-test.spec.ts --headed
```

Serwer strony ćwiczeniowej uruchomi się i zatrzyma automatycznie. Pierwszy test powinien zakończyć się wynikiem **1 passed**.
Nie musisz wcześniej uruchamiać panelu Hurtowni.

Korzystamy z Playwrighta zainstalowanego w Octopusie. Nie zmieniamy jego zależności ani konfiguracji regresji.
Jeśli brakuje przeglądarki, będąc w katalogu szkolenia, wykonaj:

```powershell
node ..\node_modules\@playwright\test\cli.js install chromium
```

Jeśli brakuje samego `cli.js`, zależności Octopusa nie są zainstalowane. Z katalogu Octopus wykonaj `npm.cmd ci`, a następnie wróć do katalogu szkolenia. Ta czynność wymaga pobrania pakietów. Na komputerze, na którym przygotowano szkolenie, pakiety i przeglądarka były już dostępne.

## Jak korzystać ze szkolenia

Zaplanuj około 10–12 spotkań po 45–60 minut. Tempo dopasuj do ćwiczeń: przechodź dalej, kiedy potrafisz napisać podobny test bez kopiowania.
Każdą lekcję przerabiaj w kolejności: scenariusz po polsku → kod → uruchomienie → celowy błąd → własna zmiana.

| Spotkanie | Temat | Co umiesz na końcu |
| --- | --- | --- |
| 1 | Sens testu i minimum składni | Wskazujesz czynność i sprawdzenie |
| 2 | Pierwszy test | Uruchamiasz jeden test i rozumiesz jego linie |
| 3 | Lokatory | Znajdujesz pole, przycisk, nagłówek i listę |
| 4 | Wyszukiwanie i asercje | Sprawdzasz liczbę i treść wyników |
| 5 | Filtry i przypadki negatywne | Testujesz P0, P1 oraz pusty wynik |
| 6 | Samodzielne ćwiczenia C1–C4 | Piszesz proste testy bez gotowca |
| 7 | Debugowanie | Rozróżniasz zły lokator i błędny wynik |
| 8 | Izolacja i dane | Każdy test działa samodzielnie |
| 9 | Parametryzacja i C5–C6 | Unikasz kopiowania i testujesz klawiaturę |
| 10 | Prosty Page Object | Rozumiesz podział stosowany w CMS |
| 11 | Czytanie własnych projektów | Śledzisz test od scenariusza do asercji |
| 12 | Zadanie końcowe | Piszesz i wyjaśniasz własny zestaw testów |

## 1. Co właściwie sprawdza automat?

Test automatyczny to zapisany scenariusz ze sprawdzeniem oczekiwanego rezultatu.
Samo otwarcie strony i kliknięcie przycisku jeszcze nie dowodzi, że funkcja działa poprawnie.

Przykład z Hurtowni:

> Mając otwarty katalog scenariuszy, wpisuję CART-001. Oczekuję dokładnie jednego wyniku: „Utworzenie i odczyt pustego koszyka”.

Rozpisz to na trzy części:

1. **Przygotowanie:** strona otwarta i dane wczytane.
2. **Czynność:** wpisanie ID w wyszukiwarkę.
3. **Sprawdzenie:** właściwa liczba i treść wyników.

To często nazywa się Arrange / Act / Assert. Wystarczy rozumieć te trzy części, bez zapamiętywania skrótu.

W tym szkoleniu testujemy wyszukiwarkę katalogu. Wyświetlenie pozycji „Poprawne logowanie hurtownika” nie sprawdza rzeczywistego logowania hurtownika. Do tego potrzebny jest oddzielny test logowania.

### Gdzie to występuje w Twoich projektach?

| Projekt | Co znalazłem | Wniosek dla nauki |
| --- | --- | --- |
| Hurtownia | `tests/*.test.mjs`, `node:test`, `assert`; API obsługiwane głównie przez `fetch`; pakiet `playwright` | Poznasz różnicę między biblioteką do sterowania przeglądarką a Playwright Test |
| Octopus | `@playwright/test` 1.63.0, testy `.spec.ts`, własne fixtures i pomocnicze funkcje | To dobre miejsce na uruchamianie tego kursu; pełne testy zamówień są dalszym etapem |
| KsięgarniaCMS | `@playwright/test` 1.51.0; katalogi `pages`, `locators`, `assertions`; testy widoków | Na końcu nauczysz się czytać ten podział |

Wersje pochodzą z deklaracji `package.json` odczytanych przy przygotowaniu materiału. Nie trzeba ich teraz ujednolicać.
W Hurtowni `npm test` uruchamia testy Node.js, a w Octopusie `npm test` uruchamia Playwrighta. Ta sama nazwa polecenia może oznaczać co innego.

## 2. Minimum JavaScript/TypeScript potrzebne na start

Plik `.spec.ts` to plik testowy TypeScript. Na początek używamy głównie składni JavaScript; zaawansowanych typów jeszcze nie potrzebujesz.

```ts
const id = 'CART-001';
```

`const` tworzy nazwę dla wartości. Apostrofy otaczają tekst. `id` możesz przekazać do metody zamiast wpisywać tekst ponownie.

```ts
await page.getByLabel('Szukaj przypadku').fill(id);
```

Kropka oznacza odwołanie do metody obiektu. Nawiasy zawierają argumenty: etykietę pola i wpisywaną wartość.
`await` czeka na zakończenie czynności. Używamy go wewnątrz funkcji oznaczonej `async`.
Przeglądarka potrzebuje czasu na nawigację, wpisanie tekstu i obsłużenie zmian.

```ts
{ name: 'Wyczyść filtry', exact: true }
```

To obiekt z opcjami: szukamy dokładnej nazwy. `true` oznacza prawdę.

```ts
['P0', 'P0', 'P0']
```

To tablica trzech wartości. Przyda się do sprawdzenia wszystkich etykiet priorytetów na liście.

Nie musisz opanować całego języka przed pierwszym testem. Wróć do tej lekcji, gdy jakiś zapis będzie niejasny.

## 3. Pierwszy test — linia po linii

Otwórz `tests/01-pierwszy-test.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('01: strona pokazuje nagłówek scenariuszy', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Scenariusze testowe.', exact: true }),
  ).toBeVisible();
});
```

- `import` udostępnia funkcję definiującą test i funkcję sprawdzającą wynik.
- `test('nazwa', ...)` rejestruje jeden przypadek. Nazwa powinna opisywać zachowanie.
- `async ({ page }) => { ... }` to funkcja z krokami testu. Playwright dostarcza `page`, czyli kartę przeglądarki. Zapis `{ page }` wyciąga tę kartę z dostarczonego obiektu.
- `page.goto('/')` otwiera adres wynikający z `baseURL` w konfiguracji szkolenia.
- `getByRole('heading', ...)` wskazuje nagłówek o podanej nazwie.
- `await expect(...).toBeVisible()` sprawdza jego widoczność i przez ograniczony czas ponawia sprawdzenie.

**Ćwiczenie:** zmień nazwę nagłówka na „Nieprawidłowy nagłówek”. Uruchom test i znajdź w błędzie oczekiwanie oraz lokator. Następnie przywróć działający test.
Umiesz tę lekcję, kiedy potrafisz wyjaśnić różnicę między `goto` a `expect`.

## 4. Lokatory — jak wskazać właściwy element

Lokator opisuje, którego elementu szukasz. Jego utworzenie jeszcze nie wykonuje kliknięcia.

| Co chcesz znaleźć | Przykład ze strony ćwiczeniowej |
| --- | --- |
| Pole po etykiecie | `page.getByLabel('Szukaj przypadku')` |
| Przycisk | `page.getByRole('button', { name: 'Wyczyść filtry', exact: true })` |
| Nagłówek | `page.getByRole('heading', { name: 'Scenariusze testowe.', exact: true })` |
| Komunikat/licznik | `page.getByRole('status')` |
| Lista | `page.getByRole('list', { name: 'Lista scenariuszy' })` |
| Pozycje we wskazanej liście | `lista.getByRole('listitem')` |
| Znacznik testowy | `page.getByTestId('priorytet')` |

Zaczynaj od roli i etykiety, jeśli dobrze opisują element. `getByTestId` przydaje się, gdy potrzebujesz stabilnego oznaczenia technicznego. W aplikacji ćwiczeniowej odpowiada mu atrybut `data-testid="priorytet"`.
W Octopusie znajdziesz też `data-cy`. Domyślnie `getByTestId` nie odczytuje `data-cy`; istniejące testy używają np. `locator('[data-cy="rspo-input"]')`.

Unikaj wyboru „trzeciego przycisku na stronie”, jeśli możesz wskazać przycisk po nazwie. Dodanie nowego przycisku zmieni kolejność, ale nie sens nazwy.
`first()` i `nth()` mają zastosowania, lecz nie powinny służyć do ukrywania niejasnego lokatora.

**Ćwiczenie bez pisania testu:** znajdź w `app/index.html` etykietę wyszukiwarki i przycisk resetowania. Dopasuj je do powyższych lokatorów.

## 5. Czynności i asercje — sprawdzaj rezultat

Otwórz `tests/02-wyszukiwanie.spec.ts`. Test 02 sprawdza jedynie wartość pola. Test 03 sprawdza już wynik działania wyszukiwarki:

```ts
await page.getByLabel('Szukaj przypadku').fill('CART-001');

const rows = page.getByRole('list', { name: 'Lista scenariuszy' })
  .getByRole('listitem');

await expect(rows).toHaveCount(1);
await expect(rows).toContainText(['CART-001 — Utworzenie i odczyt pustego koszyka']);
await expect(page.getByRole('status')).toHaveText('1 z 5 scenariuszy');
```

Liczba wyników sama nie wystarcza: jeden wynik może być niewłaściwym scenariuszem. Treść sama też nie zawsze wystarcza: obok poprawnej pozycji mogą pozostać niepasujące wyniki.

Najczęściej używane sprawdzenia:

| Asercja | Co sprawdza |
| --- | --- |
| `toBeVisible()` | Element jest widoczny |
| `toBeHidden()` | Element jest ukryty albo nie występuje w DOM |
| `toHaveText('tekst')` | Oczekiwany tekst; zwykły tekst jest porównywany z normalizacją białych znaków |
| `toContainText('fragment')` | Tekst zawiera fragment |
| `toHaveValue('P0')` | Pole ma wskazaną wartość |
| `toHaveCount(2)` | Lokator wskazuje dwa elementy |
| `toHaveTitle(/Playwright/)` | Tytuł karty pasuje do wzorca |
| `toBeFocused()` | Element ma fokus klawiatury |

Zapis `/Playwright/` oznacza wzorzec tekstu, tutaj szukający tego słowa w tytule.
`toHaveTitle` dotyczy tytułu karty, a `getByRole('heading')` nagłówka wewnątrz strony.

**Teraz wykonaj C1.** Usuń `.fixme` tylko przy C1 i zastąp celowo błędne sprawdzenie własnym. Instrukcje są w pliku ćwiczeń.

## 6. Filtry i przypadki negatywne

Otwórz `tests/03-filtry.spec.ts`. Standardową listę HTML wybierzesz tak:

```ts
await page.getByLabel('Priorytet', { exact: true }).selectOption('P0');
```

To działa z elementem `<select>`. Własny komponent listy, taki jak niektóre filtry Octopusa, może wymagać kliknięcia listy i wybrania elementu o roli `option`.

Strona szkoleniowa ma **5 stałych rekordów**:

| ID | Priorytet |
| --- | --- |
| AUTH-001 | P0 |
| AUTH-002 | P1 |
| AUTH-003 | P1 |
| CART-001 | P0 |
| CART-002 | P0 |

Dlatego oczekujemy trzech P0, dwóch P1 i zera P2. To uzgodnione dane ćwiczenia, nie liczebność całego katalogu Hurtowni.

W teście negatywnym sprawdzamy poprawną obsługę sytuacji bez wyników. Taki test powinien przechodzić, jeśli aplikacja poprawnie pokazuje pustą listę i komunikat.

**Wykonaj C2–C4.** Zanim napiszesz kod, zapisz po polsku dane wejściowe i oczekiwane ID.

## 7. Czekanie i czytanie błędów

Nie dopisuj nawykowo `waitForTimeout(3000)`. Trzy sekundy mogą być zbyt krótkie na wolnym komputerze, a na szybkim tylko wydłużą test.
Akcje Playwrighta mają własne kontrole gotowości, a asercje dotyczące interfejsu mogą czekać na oczekiwany stan.

```ts
await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
```

Tutaj czekasz na konkretny sygnał wczytania danych. Samo `page.goto('/')` nie gwarantuje zakończenia późniejszego pobierania danych przez JavaScript.

```ts
// Mniej odpowiednie do oczekiwania na zmieniający się interfejs:
expect(await page.getByRole('listitem').count()).toBe(1);

// Asercja ponawia odczyt do uzyskania oczekiwanego stanu lub upływu limitu:
await expect(page.getByRole('listitem')).toHaveCount(1);
```

Zwykłe `expect(wartosc).toBe(...)` jest poprawne dla już obliczonej wartości. Nie ma jednak takiego samego oczekiwania na zmianę strony jak `toHaveCount`.

| Objaw | Co sprawdzić jako pierwsze |
| --- | --- |
| `strict mode violation` | Lokator znalazł kilka elementów; zawęź nazwę lub zakres |
| `Timeout` przy kliknięciu | Czy wskazany element istnieje, jest widoczny i dostępny do kliknięcia? |
| `Expected 1, Received 5` | Czy filtr zadziałał? Czy sprawdzasz właściwą listę? |
| `ERR_CONNECTION_REFUSED` | Czy serwer uruchomił się poprawnie i używasz szkoleniowej konfiguracji? |
| `EADDRINUSE` / zajęty port | Zatrzymaj własny wcześniejszy serwer szkolenia na porcie 18879 |
| `Executable doesn't exist` | Zainstaluj Chromium poleceniem ze wstępu |
| `skipped` przy C1–C6 | `.fixme` celowo wyłącza nierozwiązane ćwiczenie |

Pierwsza nieudana próba nie mówi jeszcze, czy problem leży w aplikacji czy w teście. Przeczytaj oczekiwanie, otrzymany wynik, lokator i ślad wykonania.

**Ćwiczenie:** w teście 03 zmień oczekiwaną liczbę z 1 na 2, uruchom tylko ten test i otwórz raport. Potem cofnij zmianę. Nie zwiększaj limitu czasu, żeby „naprawić” nieprawdziwe oczekiwanie.

## 8. Niezależność testów i wspólne przygotowanie

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
});
```

`beforeEach` wykonuje przygotowanie przed każdym testem w swoim zakresie. Playwright standardowo daje testom oddzielne konteksty przeglądarki. Test wyszukiwania nie powinien wymagać wcześniejszego wykonania testu otwarcia strony.
Oddzielna przeglądarka nie usuwa zapisów w bazie wspólnego serwera. Dlatego testy zamówień potrzebują również zasad tworzenia i sprzątania danych.

W Octopusie znajdziesz `withOrderCleanup` i dedykowane przygotowanie szkół. To rozwiązuje trudniejszy problem niż reset lokalnego filtra. Na tym etapie wystarczy rozumieć, po co te mechanizmy istnieją.

**Ćwiczenie:** uruchom test 07 samodzielnie. Ma przejść bez wykonania testów 01–06.

## 9. Kilka danych, ten sam scenariusz

Otwórz `tests/04-dane-i-page-object.spec.ts`:

```ts
for (const id of ['AUTH-001', 'CART-002']) {
  test(`08: szukanie scenariusza ${id}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
    await page.getByLabel('Szukaj przypadku').fill(id);
    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('listitem')).toContainText(id);
  });
}
```

Pętla tworzy dwa osobne testy z różnymi danymi. Zapis w odwrotnych apostrofach pozwala wstawić wartość przez `${id}`.
Nie komplikuj testu pętlą, jeśli sprawdzasz dwa różne zachowania. Parametryzacja pasuje do tej samej reguły z różnymi danymi.

**Wykonaj C5–C6.** Następnie dopisz trzeci identyfikator do powyższej tablicy i sprawdź, czy w raporcie pojawił się osobny test. Po ćwiczeniu możesz go usunąć.

## 10. Page Object — kiedy kod zaczyna się powtarzać

Page Object to obiekt zbierający lokatory i czynności związane z jednym widokiem.
W `pages/ScenariosPage.ts` zobaczysz niewielką klasę z otwieraniem strony, wyszukiwaniem i lokatorem wierszy.
`Page` jest tu typem karty przeglądarki, `string` typem tekstu, a `constructor` przyjmuje kartę podczas tworzenia obiektu.

```ts
const scenarios = new ScenariosPage(page);
await scenarios.open();
await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
await scenarios.searchFor('AUTH-002');
await expect(scenarios.rows).toHaveCount(1);
await expect(scenarios.rows).toContainText('Niepoprawne hasło API');
```

Test nadal pokazuje oczekiwany rezultat. Metody klasy ograniczają powtarzanie sposobu obsługi widoku.
Najpierw napisz kilka zrozumiałych testów bez klasy. Dopiero gdy powtórzenia są wyraźne, przenieś wspólne czynności.

W KsięgarniaCMS podział jest szerszy:

- `pages/products/ProductsPage.ts` — czynności, np. otwarcie filtrów;
- `locators/products/productsLocators.ts` — wskazanie elementów;
- `assertions/products/ProductsAssertions.ts` — grupy sprawdzeń.

To istniejąca konwencja projektu, a nie obowiązkowy podział każdego początkującego testu.

## 11. Przejście z ćwiczeń do Twoich aplikacji

Strona szkoleniowa jest **uproszczonym odpowiednikiem** filtrów Hurtowni. Używa pięciu prawdziwych nazw scenariuszy i podobnych etykiet, ale ma osobny kod HTML i JavaScript. Wynik tych testów potwierdza działanie strony ćwiczeniowej, nie regresję Hurtowni.

### Hurtownia: odczytaj prawdziwy widok

W `C:\Users\npanek\Testy\Hurtownia\dashboard\public\index.html` znajdź sekcję `view-scenarios`.
Są tam rzeczywiste pola „Szukaj przypadku”, „Priorytet” oraz przycisk „Wyczyść filtry”.
W `dashboard/public/scenarios.js` znajdź `renderScenarios` i obsługę `scenario-reset`.

Ważna różnica: prawdziwe wiersze używają `details` i `summary`, a nie `ul` i `li` ze szkolenia. Lokator `getByRole('listitem')` z ćwiczenia nie jest gotowym lokatorem do tego widoku.
Po obejrzeniu aktualnego DOM można zawęzić wyszukiwanie do `#scenario-list` i wskazywać `summary[data-scenario]`.
Nie wpisuj oczekiwania „5 scenariuszy” do testu prawdziwego katalogu.

Zadanie na przeniesienie wiedzy: zapisz ręczny scenariusz wyszukania CART-001, wskaż trzy lokatory i określ oczekiwanie dotyczące ID. Najpierw odczyt i filtrowanie; przyciski uruchamiające zestawy testów to odrębne operacje.

### Octopus: odczytaj jeden fragment istniejącego testu

Otwórz `C:\Users\npanek\Documents\ChatGPT\Octopus\tests\szkola-wyszukiwanie-filtry.spec.ts`.
Zacznij od `SFLT-01`, gdzie sprawdzane są opcje formularza. Wskaż lokator, czynność `click()` i asercję `toHaveText`.
Następnie przejrzyj pętlę tworzącą przypadki kategorii. Rozpoznasz już parametryzację.

Ten plik używa własnego importu z `support/medal-reference-schools` oraz pomocniczych funkcji. Są częścią projektu i mogą przygotowywać dane. Samo uruchomienie wybranego pliku nie oznacza, że pomijasz globalne przygotowanie i sprzątanie.
Na etapie czytania nie musisz go uruchamiać.

### KsięgarniaCMS: widoczność a działanie

Otwórz `C:\Users\npanek\Documents\ChatGPT\KsiegarniaCMS\tests\views-products.spec.ts`.
Krótki test wywołuje `checkView`, więc właściwe sprawdzenia trzeba śledzić również w `shared/viewSmoke.ts`.
Następnie porównaj `ProductsPage` i `ProductsAssertions` z poprzedniej lekcji.

Obecność pola wyszukiwania nie dowodzi, że poprawnie filtruje produkty. Potrzebujesz osobnego scenariusza: wpisanie kodu znanego produktu → wykonanie wyszukiwania → sprawdzenie właściwego wiersza i braku niepasujących wyników.
Dokładne dane oraz lokatory trzeba ustalić z aktualnym widokiem, zamiast zgadywać.

## 12. Zadanie końcowe i kryteria ukończenia

Utwórz własny plik `tests/06-moj-zestaw.spec.ts`. Napisz samodzielnie cztery przypadki:

1. Wyszukanie scenariusza po fragmencie tytułu „pojedynczego produktu”.
2. Wyszukanie `AUTH-` z priorytetem P0: tylko AUTH-001.
3. Wyszukanie `CART-` z priorytetem P1: brak wyników i prawidłowy komunikat.
4. Powrót z pustego wyniku do pełnej listy przyciskiem „Wyczyść filtry”.

Każdy test ma nazwę opisującą zachowanie, własne przygotowanie, czynność oraz sprawdzenie efektu.
Sprawdź nie tylko licznik, lecz także ID lub tekst wyników. Uruchom każdy test osobno, a następnie cały swój plik.
Celowo zmień jedno oczekiwanie i sprawdź, czy test faktycznie przestaje przechodzić. Przywróć poprawną wersję.

Kończysz pierwszy etap, kiedy umiesz wyjaśnić każdy użyty zapis, wybrać jednoznaczny lokator, odczytać błąd i napisać podobny przypadek bez kopiowania.
Kolejny etap: logowanie i sesja, własne fixtures, testy formularzy z danymi, sprzątanie zapisów, a później połączenie Playwrighta z testami API.

## Polecenia do codziennej pracy

Wszystkie polecenia poniżej wykonuj z katalogu `szkolenie-playwright`. Jawna konfiguracja wybiera wyłącznie szkolenie.

```powershell
# Wszystkie gotowe przykłady i status ćwiczeń:
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts

# Jeden plik z widoczną przeglądarką:
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts 02-wyszukiwanie.spec.ts --headed

# Jeden test po fragmencie nazwy:
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts --grep '03:'

# Tylko ćwiczenie C1 (po usunięciu jego .fixme):
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts 05-twoje-cwiczenia.spec.ts --grep 'C1:'

# Inspector do wykonania krok po kroku:
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts 01-pierwszy-test.spec.ts --debug

# Interaktywny panel testów:
node ..\node_modules\@playwright\test\cli.js test --config=playwright.config.ts --ui

# Raport ostatniego uruchomienia:
node ..\node_modules\@playwright\test\cli.js show-report raport
```

Na początku zobaczysz **10 passed, 6 skipped**. Pominięte są wyłącznie zadania oznaczone `test.fixme`. Każde rozwiązane i włączone zadanie zwiększa liczbę wykonanych testów.
Raport znajduje się w `raport/index.html`, a materiały z błędu w `wyniki`. Ślad `trace.zip` obejrzysz przez raport lub poleceniem `show-trace` ze ścieżką do konkretnego pliku.
Kolejne uruchomienie zastępuje lokalne wyniki szkolenia; raport z ważnego błędu zachowaj przed następną próbą.

Do ręcznego obejrzenia strony uruchom `node serwer.mjs`, otwórz `http://127.0.0.1:18879`, a po zakończeniu zatrzymaj serwer przez Ctrl+C. Zatrzymaj go również przed zwykłym uruchomieniem testów, bo konfiguracja uruchamia własny serwer.

## Materiały dodatkowe

- [Ściąga](SCIAGA.md) — krótki zapis najczęstszych czynności i sprawdzeń.
- [Rozwiązania C1–C6](ROZWIAZANIA.md) — otwórz po własnej próbie.
- [Pisanie testów — dokumentacja Playwright](https://playwright.dev/docs/writing-tests).
- [Lokatory](https://playwright.dev/docs/locators).
- [Asercje](https://playwright.dev/docs/test-assertions).
- [Debugowanie](https://playwright.dev/docs/debug).
- [Dobre praktyki](https://playwright.dev/docs/best-practices).

Dokumentacja jest uzupełnieniem lekcji. Zacznij od uruchomienia jednego testu i własnej zmiany w kodzie.
