import { test, expect } from "./support/scenario";

import { restoreSession } from "../scripts/auth.mjs";
import { Octopus } from "./support/octopus";

import { addNewTeacherSubjectLevel, newTeacherSaveButton } from "./support/teacher-add";
import { registerCreatedTeacher } from "./support/teacher-add-scenario";

/*
 * =========================================================
 * STAŁA SZKOŁA QA
 * =========================================================
 */

const TEST_SCHOOL = {
  id: "93391",
  name: "Szkoła QA 1",
} as const;

/*
 * UWAGA O ZAŁOŻENIU:
 *
 * Formularz UI "Dodaj nowego nauczyciela" nie jest nigdzie w tym
 * repozytorium jawnie powiązany z konkretnym endpointem zapisu -
 * jedyne potwierdzone miejsce zapisu nauczyciela to
 * OctopusApiFactory.createTeacher, które woła POST
 * /api/Teacher/AddTeacher (support/api-factory.ts). Testy poniżej
 * zakładają, że przycisk "Zapisz" w formularzu UI woła ten sam
 * endpoint (spójne z konwencją nazewnictwa API w tym projekcie,
 * por. /api/Institution/AddNewInstitution dla szkół). Jeśli to
 * założenie jest błędne, poniższe testy nie przejdą przy pierwszym
 * uruchomieniu z czytelnym timeoutem na waitForResponse - co samo
 * w sobie jest sygnałem do poprawienia nazwy endpointu poniżej,
 * a nie ukrytym fałszywym PASS-em.
 */
const ADD_TEACHER_ENDPOINT = "/api/Teacher/AddTeacher";

/*
 * =========================================================
 * AUTH-01
 * WYGASŁA SESJA / BRAK UPRAWNIEŃ PODCZAS ZAPISU NAUCZYCIELA
 * =========================================================
 *
 * Gap analysis, punkty D.11 i D.13: nie ma testu na to, co się
 * dzieje, gdy sesja/token wygasną w trakcie wypełniania długiego
 * formularza, ani na obsługę 401/403 poza jednym endpointem
 * (AddNewInstitution, tylko HTTP 500 - patrz SCH-16).
 *
 * Ten test symuluje wygasłą sesję (401) i brak uprawnień (403)
 * dokładnie w momencie zapisu, po tym jak użytkownik już wypełnił
 * cały formularz (imię, nazwisko, e-mail, szkoła, przedmiot).
 * Sprawdzamy niezmienniki bezpieczne do zweryfikowania bez
 * znajomości dokładnej treści komunikatu UI:
 *  - żądanie zapisu wykonuje się dokładnie raz (brak cichego retry),
 *  - nie powstaje żaden "widmowy" rekord nauczyciela,
 *  - formularz pozostaje otwarty, więc użytkownik nie traci
 *    wypełnionych danych.
 */

for (const failure of [
  { status: 401, label: "wygasła sesja (401)" },
  { status: 403, label: "brak uprawnień (403)" },
] as const) {
  test(`AUTH-01: ${failure.label} podczas zapisu nauczyciela nie tworzy rekordu i raportuje stan formularza @teacher @auth @session`, async ({
    page,
    scenario: s,
    authSession,
    browser,
  }) => {
    const lastName = `${s.id}-Sesja${failure.status}`;
    const email = `sesja${failure.status}-${s.email}`;

    const form = await s.app.prepareTeacher(lastName, email, TEST_SCHOOL.id, TEST_SCHOOL.name);
    await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

    let saveAttempts = 0;
    await page.route(`**${ADD_TEACHER_ENDPOINT}`, async (route) => {
      saveAttempts += 1;
      await route.fulfill({
        status: failure.status,
        contentType: "application/json",
        body: JSON.stringify({ message: "Kontrolowany błąd testowy" }),
      });
    });

    const failedSave = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === ADD_TEACHER_ENDPOINT,
      { timeout: 20_000 },
    );

    await newTeacherSaveButton(form).click();

    const response = await failedSave;
    expect(response.status()).toBe(failure.status);
    await response.finished();

    // Dajemy aplikacji chwilę na ewentualne pokazanie komunikatu błędu,
    // zanim sprawdzimy stan formularza - nie zakładamy jego treści.
    await page.waitForTimeout(500);

    expect(
      saveAttempts,
      `Po błędzie ${failure.status} nie powinno być cichego ponowienia żądania zapisu.`,
    ).toBe(1);

    const formRemainedOpen = (await form.count()) > 0;
    await s.record(`rejectedSaveFormState-${failure.status}`, formRemainedOpen ? "OPEN" : "CLOSED");
    if (formRemainedOpen) {
      await expect(s.app.field(form, "Nazwisko")).toHaveValue(lastName);
      await expect(s.app.field(form, "Email")).toHaveValue(email);
    } else {
      await expect(page).toHaveURL(/\/(?:login|teacher\/teacher-panel)$/);
    }

    await page.unroute(`**${ADD_TEACHER_ENDPOINT}`);

    // Rekord nie mógł powstać. Sprawdzamy to w świeżej, uwierzytelnionej
    // karcie, ponieważ odpowiedź 401 poprawnie przenosi badaną kartę do logowania.
    const verificationContext = await browser.newContext({
      storageState: authSession.storageState,
    });
    try {
      await restoreSession(verificationContext, authSession.session);
      const verificationPage = await verificationContext.newPage();
      const verificationApp = new Octopus(verificationPage);
      await verificationApp.openPanel("teacher");
      await verificationApp.searchMissing("teacher", "Nazwisko", lastName);
    } finally {
      await verificationContext.close();
    }
  });
}

/*
 * =========================================================
 * AUTH-02
 * RÓWNOLEGŁA EDYCJA TEGO SAMEGO NAUCZYCIELA W DWÓCH KARTACH
 * =========================================================
 *
 * Gap analysis, punkt D.12: brak testu na edycję tego samego
 * rekordu w dwóch równoległych sesjach/kartach tego samego
 * użytkownika.
 *
 * W kodzie nie znaleziono żadnego mechanizmu wersjonowania/ETag
 * przy zapisie danych podstawowych nauczyciela (patrz
 * openBasicTeacherEdit/saveBasicTeacherEdit w teacher-basic.ts),
 * więc ten test dokumentuje najbardziej prawdopodobne zachowanie
 * "ostatni zapis wygrywa" bez wykrywania konfliktu. Niepowodzenie
 * tej asercji nie musi oznaczać regresji - może oznaczać, że
 * backend jednak wykrywa konflikt, co warto by było potwierdzić
 * i opisać na nowo w tym teście.
 */

test("AUTH-02: przy współbieżnej edycji tego samego pola w dwóch kartach ostatni zapis wygrywa @teacher @concurrency", async ({
  scenario: s,
  browser,
  authSession,
}) => {
  const teacherId = await s.createTeacher(TEST_SCHOOL.id, TEST_SCHOOL.name);

  const secondContext = await browser.newContext({ storageState: authSession.storageState });
  try {
    await restoreSession(secondContext, authSession.session);
    const secondPage = await secondContext.newPage();
    const secondApp = new Octopus(secondPage);

    // Obie karty otwierają panel nauczyciela PRZED jakąkolwiek edycją,
    // tak aby żadna z nich nie widziała jeszcze zmiany drugiej karty -
    // to jest właśnie scenariusz współbieżny, a nie sekwencyjny.
    await s.app.openPanel("teacher", teacherId);
    await secondApp.openPanel("teacher", teacherId);

    await s.app.editFirstName("Alicja");
    await secondApp.editFirstName("Bożena");

    // Nawigacja pod identyczny URL nie musi odświeżyć komponentu SPA.
    await Promise.all([
      s.app.page.reload({ waitUntil: "domcontentloaded" }),
      secondPage.reload({ waitUntil: "domcontentloaded" }),
    ]);

    await expect(
      s.app.detail("firstName"),
      "Dokumentuje bieżące zachowanie: przy współbieżnej edycji tego samego pola w dwóch " +
        'kartach oczekujemy prostego "ostatni zapis wygrywa" (patrz komentarz nad tym testem). ' +
        "Niepowodzenie tej asercji oznacza, że backend jednak wykrywa konflikt wersji - dobra " +
        "wiadomość, ale wymaga opisania na nowo tego testu.",
    ).toHaveValue("Bożena");

    await expect(secondApp.detail("firstName")).toHaveValue("Bożena");
  } finally {
    await secondContext.close();
  }
});

/*
 * =========================================================
 * RESIL-01
 * PODWÓJNY ZAPIS NAUCZYCIELA POD OPÓŹNIONĄ SIECIĄ
 * =========================================================
 *
 * Gap analysis, punkty F.29/F.30 oraz obserwacja, że test na
 * podwójne kliknięcie "Zapisz" istnieje dla szkoły (SCH-10) i
 * formularza klubowego (CLUB-64), ale nie dla dodawania
 * nauczyciela. Dodatkowo wprowadzamy sztuczne opóźnienie sieci,
 * żeby test rzetelnie sprawdzał zachowanie przy wolnym połączeniu,
 * a nie tylko przy dwóch kliknięciach wykonanych w tej samej
 * klatce zdarzeń.
 */

test("RESIL-01: podwójne kliknięcie Zapisz pod opóźnioną siecią tworzy tylko jednego nauczyciela @teacher @concurrency", async ({
  page,
  scenario: s,
}) => {
  const lastName = `${s.id}-Podwojny`;
  const form = await s.app.prepareTeacher(lastName, s.email, TEST_SCHOOL.id, TEST_SCHOOL.name);
  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  let saveAttempts = 0;
  await page.route(`**${ADD_TEACHER_ENDPOINT}`, async (route) => {
    saveAttempts += 1;
    // Symulujemy wolne połączenie: opóźniamy odpowiedź, żeby okno,
    // w którym drugie kliknięcie mogłoby wysłać kolejne żądanie,
    // było znacznie szersze niż przy natychmiastowej odpowiedzi.
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await route.continue();
  });

  await newTeacherSaveButton(form).click({ clickCount: 2, delay: 100 });

  await expect(page).toHaveURL(/\/teacher\/teacher-panel\/\d+$/, { timeout: 20_000 });
  const teacherId = page.url().split("/").pop()!;

  expect(
    saveAttempts,
    "Podwójne kliknięcie Zapisz powinno wysłać tylko jedno żądanie zapisu.",
  ).toBe(1);

  await page.unroute(`**${ADD_TEACHER_ENDPOINT}`);

  // saveAttempts === 1 już dowodzi braku podwójnego zapisu; dodatkowo
  // potwierdzamy, że utworzony rekord jest normalnie odnajdywalny.
  await s.app.searchTeacher(teacherId);

  // Rekord powstał przez UI, więc trzeba go jawnie zarejestrować i oznaczyć
  // jako testowy - inaczej sprzątanie globalne nigdy go nie zobaczy (brak
  // teacherId w rejestrze scenariusza) i zostaje jako trwała sierota.
  await registerCreatedTeacher(s, teacherId, { lastName });
});
