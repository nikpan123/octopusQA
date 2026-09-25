import { expect, type Locator, type Page, type Request } from "@playwright/test";

export type CreateSchoolApiOptions = {
  fullName?: string;
  email?: string;
  www?: string;
  regon?: string;
  nip?: string;
  rspo?: number | string;
  quantityOfStudents?: number;
  phoneNumber?: string;
  phoneIsMobile?: boolean;
};

const schoolTypeDictionaries = new Map<string, unknown>();

function normalizeStoredToken(value: string | null) {
  if (!value) return null;

  let token: unknown = value;
  try {
    token = JSON.parse(value);
  } catch {
    // Token może być zapisany jako zwykły string, bez otaczającego JSON-a.
  }

  if (typeof token !== "string") return null;
  return token.replace(/^Bearer\s+/i, "").trim() || null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function createdByFromToken(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload) return 0;

  const candidateKeys = [
    "nameid",
    "nameId",
    "userId",
    "UserId",
    "id",
    "Id",
    "sub",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  ];

  for (const key of candidateKeys) {
    const value = payload[key];
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }

  return 0;
}

function normalizeDictionaryLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pl-PL");
}

function findDictionaryId(value: unknown, expectedLabel: string): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const id = findDictionaryId(item, expectedLabel);
      if (id !== null) return id;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;

  const object = value as Record<string, unknown>;
  const expected = normalizeDictionaryLabel(expectedLabel);
  const labelKeys = ["name", "label", "text", "description", "schoolTypeName", "typeName"];
  const idKeys = ["id", "typeId", "schoolTypeId", "institutionTypeId", "key", "value"];

  const matches = labelKeys.some((key) => {
    const candidate = object[key];
    return typeof candidate === "string" && normalizeDictionaryLabel(candidate) === expected;
  });

  if (matches) {
    for (const key of idKeys) {
      const candidate = object[key];
      const parsed = typeof candidate === "number" ? candidate : Number(candidate);
      if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
    }
  }

  for (const nested of Object.values(object)) {
    const id = findDictionaryId(nested, expectedLabel);
    if (id !== null) return id;
  }

  return null;
}

function positiveId(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && /^\d+$/.test(value) && Number(value) > 0) return value;
  return null;
}

function extractCreatedSchoolId(value: unknown): string | null {
  const direct = positiveId(value);
  if (direct) return direct;
  if (!value || typeof value !== "object") return null;

  const object = value as Record<string, unknown>;
  for (const key of ["id", "institutionId", "institutionUnitId", "schoolId"]) {
    const id = positiveId(object[key]);
    if (id) return id;
  }

  for (const key of ["data", "result", "value"]) {
    const id = extractCreatedSchoolId(object[key]);
    if (id) return id;
  }

  return null;
}

// fill wpisuje całość atomowo; End emituje keyup wymagany m.in. przez adres.
// Dialog może zostać jednokrotnie wyrenderowany ponownie po doczytaniu słowników,
// dlatego ponawiamy całą operację, jeśli aplikacja wyczyściła już wpisaną wartość.
export async function typeValue(input: Locator, value: string) {
  await expect(async () => {
    await input.fill(value);
    await input.press("End");
    await input.press("Tab");
    await expect(input).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
}

export async function waitForOctopusIdle(page: Page, timeout = 20_000): Promise<void> {
  const spinner = page.locator("#spinner.backdrop");

  await spinner
    .waitFor({
      state: "hidden",
      timeout,
    })
    .catch(async () => {
      if (await spinner.isVisible().catch(() => false)) {
        throw new Error("Spinner Octopusa nie zniknął przed wykonaniem akcji");
      }
    });
}

export class Octopus {
  constructor(readonly page: Page) {}

  dialog(title: string) {
    return this.page.locator("mat-dialog-container").filter({
      has: this.page.getByRole("heading", { name: title, exact: true }),
    });
  }

  // Etykiety w tej aplikacji nie zawsze są HTML label. Szukamy najbliższego
  // wspólnego kontenera etykiety i pola zamiast używać zmiennych ID mat-input.
  field(scope: Locator, label: string) {
    return scope
      .getByText(label, { exact: true })
      .locator('xpath=ancestor::*[.//input[not(@type="checkbox")]][1]')
      .locator('input:not([type="checkbox"])');
  }

  detail(id: string) {
    return this.page.locator(`mat-form-field[id="${id}"] input`);
  }

  async openPanel(kind: "teacher" | "school", id?: string) {
    const url = `/${kind}/${kind}-panel${id ? `/${id}` : ""}`;

    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const heading = this.page.getByRole("heading", {
      name: kind === "school" ? "Dane podstawowe szkoły" : "Dane podstawowe",
      exact: true,
    });

    await expect(heading, `Panel ${kind} powinien się załadować`).toBeVisible();

    if (!id) {
      return;
    }

    const idInput = this.page
      .locator(".info-row")
      .filter({
        has: this.page.getByText("ID", {
          exact: true,
        }),
      })
      .locator('input[type="text"]');

    await expect(idInput, `Panel powinien zawierać rekord o ID ${id}`).toHaveValue(id);

    await expect(
      this.page.getByRole("button", {
        name: "Edycja danych",
        exact: true,
      }),
      `Panel rekordu ${id} powinien być gotowy do edycji`,
    ).toBeVisible();
  }

  async prepareSchool(name: string, number: string, schoolType = "Szkoła podstawowa") {
    await this.openPanel("school");
    await this.page
      .getByRole("button", { name: "Dodaj", exact: true })
      .filter({
        has: this.page.getByText("school", { exact: true }),
      })
      .click();
    const form = this.dialog("Dodaj nową szkołę");
    await typeValue(this.field(form, "* Nazwa"), name);
    await form.getByRole("combobox").click();
    await this.page.getByRole("option", { name: schoolType, exact: true }).click();
    await form.getByRole("button", { name: "Dodaj adres szkoły", exact: true }).click();
    const address = this.dialog("Edycja adresu");
    await typeValue(address.locator('input[id="zip_code_input"]'), "80-064");
    const city = address
      .getByRole("row")
      .filter({ hasText: "80-064" })
      .filter({ hasText: "Gdańsk" });
    await expect(city).toHaveCount(1);
    await city.click();
    await typeValue(address.locator('input[id="number"]'), number);
    await address.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(address).toHaveCount(0);
    return form;
  }

  private async octopusAuth() {
    const storageState = await this.page.context().storageState();

    const originState = storageState.origins.find((item) =>
      item.localStorage.some((entry) => entry.name === "token"),
    );

    if (!originState) {
      throw new Error("Nie znaleziono originu Octopusa zawierającego token w storageState.");
    }

    const rawToken =
      originState.localStorage.find((entry) => entry.name === "token")?.value ?? null;

    const token = normalizeStoredToken(rawToken);

    if (!token) {
      throw new Error('Brak poprawnego tokena Octopusa w storageState.localStorage["token"].');
    }

    return {
      origin: originState.origin,
      token,
    };
  }

  private async bearerToken() {
    return (await this.octopusAuth()).token;
  }

  private async schoolTypesDictionary() {
    const { origin, token } = await this.octopusAuth();

    const cached = schoolTypeDictionaries.get(origin);
    if (cached) return cached;

    const endpoint = new URL("/api/Dictionary/GetSchoolTypes", origin).toString();

    const response = await this.page.context().request.get(endpoint, {
      failOnStatusCode: false,
      headers: {
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseText = await response.text();

    expect(
      response.ok(),
      `API GetSchoolTypes zwróciło ${response.status()}: ${responseText.slice(0, 2_000)}`,
    ).toBeTruthy();

    let dictionary: unknown;

    try {
      dictionary = JSON.parse(responseText);
    } catch {
      throw new Error(
        `API GetSchoolTypes nie zwróciło poprawnego JSON: ${responseText.slice(0, 2_000)}`,
      );
    }

    schoolTypeDictionaries.set(origin, dictionary);

    return dictionary;
  }

  private async schoolTypeId(schoolType: string) {
    const dictionary = await this.schoolTypesDictionary();
    const typeId = findDictionaryId(dictionary, schoolType);

    if (typeId === null) {
      throw new Error(`Nie znaleziono typeId dla typu szkoły „${schoolType}” w GetSchoolTypes.`);
    }

    return typeId;
  }

  private async buildSchoolApiPayload(
    name: string,
    number: string,
    schoolType: string,
    options: CreateSchoolApiOptions,
  ) {
    const token = await this.bearerToken();
    const typeId = await this.schoolTypeId(schoolType);
    const createdBy = createdByFromToken(token);

    return {
      name,
      fullName: options.fullName ?? "",
      typeId,
      zipCode: "61-534",
      postName: "Poznań",
      city: "Poznań",
      street: "",
      number,
      cityId: 6,
      quantityOfStudents: options.quantityOfStudents ?? "",
      rspo: options.rspo ?? "",
      nip: options.nip ?? "",
      regon: options.regon ?? "",
      createdBy,
      createdAt: new Date().toISOString(),
      email: options.email ?? "",
      www: options.www ?? "",
      institutionPhoneNumbers:
        options.phoneNumber === undefined
          ? [null]
          : [
              {
                phoneNumber: options.phoneNumber,
                isMobile: options.phoneIsMobile ?? true,
                createdBy,
              },
            ],
    };
  }

  private async findCreatedSchoolIdByName(name: string) {
    await this.openPanel("school");
    const search = await this.openSearch("school");
    await typeValue(this.field(search, "Nazwa szkoły"), name);
    await search.getByRole("button", { name: "Szukaj", exact: true }).click();
    await expect(search).toHaveCount(0);

    const row = this.results("school").getByRole("row").filter({ hasText: name });
    await expect(row, `Powinna istnieć dokładnie jedna szkoła „${name}”`).toHaveCount(1);
    await row.click();
    await expect(this.page).toHaveURL(/\/school\/school-panel\/\d+$/);

    const schoolId = this.page.url().split("/").pop() ?? "";
    expect(schoolId).toMatch(/^\d+$/);
    return schoolId;
  }

  async createSchoolViaApi(
    name: string,
    number: string,
    schoolType = "Szkoła podstawowa",
    options: CreateSchoolApiOptions = {},
  ) {
    const { origin, token } = await this.octopusAuth();

    const payload = await this.buildSchoolApiPayload(name, number, schoolType, options);

    const endpoint = new URL("/api/Institution/AddNewInstitution", origin).toString();

    const response = await this.page.context().request.post(endpoint, {
      data: payload,
      failOnStatusCode: false,
      headers: {
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    expect(
      response.ok(),
      `API AddNewInstitution zwróciło ${response.status()}: ${responseText.slice(0, 2_000)}`,
    ).toBeTruthy();

    let responseJson: unknown = null;

    if (responseText.trim()) {
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = responseText.trim();
      }
    }

    let schoolId = extractCreatedSchoolId(responseJson);

    if (!schoolId) {
      const location = response.headers()["location"];

      const fromLocation = location?.match(/(?:school-panel\/|\/)(\d+)(?:$|[?#])/);

      schoolId = fromLocation?.[1] ?? null;
    }

    if (!schoolId) {
      schoolId = await this.findCreatedSchoolIdByName(name);
    } else {
      await this.openPanel("school", schoolId);
    }

    await expect(this.detail("name")).toHaveValue(name);

    return schoolId;
  }

  async createSchool(
    name: string,
    number: string,
    schoolType = "Szkoła podstawowa",
    options: CreateSchoolApiOptions = {},
  ) {
    return this.createSchoolViaApi(name, number, schoolType, options);
  }

  async markTestRecord() {
    const kind = this.page.url().includes("/teacher/") ? "Teacher" : "School";

    const checkbox = this.page.getByRole("checkbox", {
      name: "Testowy",
      exact: true,
    });

    /*
     * Najpierw czekamy aż Octopus zakończy
     * bieżące ładowanie danych.
     */
    await waitForOctopusIdle(this.page);

    await expect(checkbox).toBeVisible();

    await expect(checkbox).toBeEnabled();

    if (await checkbox.isChecked()) {
      return;
    }

    let saveRequest: Request | undefined;

    const captureSaveRequest = (request: Request) => {
      const pathname = new URL(request.url()).pathname;

      if (
        request.method() === "POST" &&
        pathname.startsWith(`/api/${kind}/`) &&
        pathname.includes("Test")
      ) {
        saveRequest = request;
      }
    };

    this.page.on("request", captureSaveRequest);

    try {
      await expect(async () => {
        await waitForOctopusIdle(this.page);

        /*
         * Stan mógł zmienić się podczas
         * doczytywania panelu.
         */
        if (await checkbox.isChecked()) {
          return;
        }

        /*
         * Używamy click zamiast check.
         *
         * check() dodatkowo sam weryfikuje,
         * czy stan zmienił się natychmiast,
         * co przy Angularze i spinnerze
         * bywa niestabilne.
         */
        await checkbox.click();

        await expect(checkbox).toBeChecked({
          timeout: 2_000,
        });
      }).toPass({
        timeout: 20_000,
        intervals: [100, 250, 500],
      });
    } finally {
      this.page.off("request", captureSaveRequest);
    }

    if (saveRequest) {
      const response = await saveRequest.response();

      expect(response, "Żądanie zapisu flagi Testowy powinno otrzymać odpowiedź").not.toBeNull();

      expect(response!.ok(), "Zapis flagi Testowy musi zakończyć się powodzeniem").toBeTruthy();

      await response!.finished();
    }

    /*
     * Po zapisie również czekamy aż spinner
     * całkowicie zniknie.
     */
    await waitForOctopusIdle(this.page);

    await expect(checkbox).toBeChecked();
  }

  async searchSchool(name: string, id: string, expectedResultCount = 1) {
    // Rozpocznij wyszukiwanie w panelu, jak użytkownik z menu aplikacji.
    // Wejście bezpośrednio na URL z ID uruchamia dodatkowe ładowanie rekordu
    // i tabeli, niezależne od nowego formularza wyszukiwania.
    await this.openPanel("school");
    const search = await this.openSearch("school");
    await typeValue(this.field(search, "Nazwa szkoły"), name);
    await search.getByRole("button", { name: "Szukaj", exact: true }).click();
    await expect(search).toHaveCount(0);
    const row = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("gridcell", { name: id, exact: true }) });
    await expect(row).toHaveCount(1);
    await row.click();
    await expect(this.detail("name")).toHaveValue(name);
    await expect(
      this.page.getByRole("heading", {
        name: `Rekordów: ${expectedResultCount}`,
        exact: true,
      }),
    ).toBeVisible();
  }

  async prepareTeacher(lastName: string, email: string, schoolId?: string, schoolName?: string) {
    // Fixture strony otwiera już pusty panel nauczyciela, aby sprawdzić sesję.
    // Nie pobieramy go ponownie przed każdym formularzem dodawania.
    if (new URL(this.page.url()).pathname !== "/teacher/teacher-panel") {
      await this.openPanel("teacher");
    }
    await this.page.getByRole("button", { name: "Dodaj", exact: true }).click();
    const form = this.dialog("Dodaj nowego nauczyciela");
    await typeValue(this.field(form, "*Nazwisko"), lastName);
    await typeValue(this.field(form, "*Imię"), "Testowy");
    await typeValue(
      form
        .locator(".new-teacher__personal-input")
        .filter({
          has: this.page.getByText("E-mail", { exact: true }),
        })
        .locator("input"),
      email,
    );
    if (schoolId && schoolName) await this.attachSchool(form, schoolId, schoolName);
    return form;
  }

  async attachSchool(form: Locator, schoolId: string, schoolName: string) {
    await form.getByRole("button", { name: "Dodaj szkołę", exact: true }).click();
    const schools = this.dialog("Dodaj szkołę - szkoły nauczyciela");
    await typeValue(this.field(schools, "ID szkoły"), schoolId);
    await schools.getByRole("button", { name: "Szukaj", exact: true }).click();
    const row = schools.getByRole("row").filter({ hasText: schoolName });
    await expect(row).toHaveCount(1);
    // Pierwsza komórka to akcja „Dodaj” pod nagłówkiem tabeli.
    await row.getByRole("gridcell").first().click();
    await expect(schools.getByRole("row").filter({ hasText: schoolName })).toHaveCount(2);
    await schools.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(schools).toHaveCount(0);
    await expect(form.getByRole("row").filter({ hasText: schoolName })).toHaveCount(1);
  }

  async createTeacher(lastName: string, email: string, schoolId: string, schoolName: string) {
    const form = await this.prepareTeacher(lastName, email, schoolId, schoolName);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    const warning = this.dialog("Uwaga");
    await expect(warning).toContainText("Nie dodałeś przedmioto-poziomu");
    await warning.getByRole("button", { name: "Tak", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(this.page).toHaveURL(/\/teacher\/teacher-panel\/\d+$/);
    const id = this.page.url().split("/").pop()!;
    await expect(this.detail("email")).toHaveValue(email);
    await expect(this.page.getByRole("row").filter({ hasText: schoolName })).toHaveCount(1);
    return id;
  }

  async searchTeacher(id: string) {
    await this.openPanel("teacher");
    const search = await this.openSearch("teacher");
    await typeValue(this.field(search, "ID nauczyciela"), id);
    await search.getByRole("button", { name: "Szukaj", exact: true }).click();
    await expect(search).toHaveCount(0);
    const row = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("gridcell", { name: id, exact: true }) });
    await expect(row).toHaveCount(1);
    await row.click();
    await expect(
      this.page.getByRole("heading", { name: "Rekordów: 1", exact: true }),
    ).toBeVisible();
  }

  async schoolTeacherRow(teacherId: string) {
    const teachers = this.page.getByRole("tabpanel", { name: "Nauczyciele", exact: true });
    await expect(
      teachers.getByRole("button", { name: /^Nauczyciele:\s*[1-9]\d*$/ }),
      "Licznik nauczycieli szkoły powinien zakończyć ładowanie",
    ).toBeVisible();
    const showAll = teachers.getByRole("button", { name: "Pokaż wszystkich", exact: true });
    await expect(showAll).toBeVisible();
    await showAll.click();
    const row = teachers
      .getByRole("row")
      .filter({ has: this.page.getByRole("gridcell", { name: teacherId, exact: true }) });
    await expect(async () => {
      await teachers.locator(".ag-body-viewport").evaluate((viewport) => {
        viewport.scrollTop = viewport.scrollHeight;
      });
      await expect(row).toHaveCount(1, { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    return row;
  }

  async editFirstName(value: string) {
    await this.page.getByRole("button", { name: "Edycja danych", exact: true }).click();
    const form = this.dialog("Edycja danych podstawowych");
    await typeValue(form.locator('input[id="firstName"]'), value);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(this.detail("firstName")).toHaveValue("Jan");
  }

  results(kind: "teacher" | "school") {
    return this.page.getByRole("treegrid").filter({
      has: this.page.getByRole("columnheader", {
        name: kind === "teacher" ? "Osoba" : "Nazwa z SIO",
        exact: true,
      }),
    });
  }

  async openSearch(kind: "teacher" | "school") {
    await this.page.getByRole("button", { name: "Szukaj", exact: true }).click();
    const search = this.dialog(
      kind === "teacher" ? "Wyszukiwarka nauczycieli" : "Wyszukiwarka szkół",
    );
    await expect(search).toBeVisible();
    // Formularz ustawia fokus asynchronicznie po otwarciu dialogu.
    await expect(search.locator('input:not([type="checkbox"])').first()).toBeFocused();
    return search;
  }

  async searchMissing(kind: "teacher" | "school", label: string, value: string) {
    // Nie resetuj tu panelu: FIND-04 musi sprawdzać usunięcie poprzedniej listy.
    const search = await this.openSearch(kind);
    // Wyszukiwarka może pamiętać kryteria poprzedniej operacji.
    for (const input of await search
      .locator('input:not([type="checkbox"]):not([readonly]):not([disabled])')
      .all()) {
      await typeValue(input, "");
    }
    await typeValue(this.field(search, label), value);
    await search.getByRole("button", { name: "Szukaj", exact: true }).click();
    const empty = this.page
      .locator("mat-dialog-container")
      .filter({ hasText: "Brak wyników wyszukiwania" });
    await expect(empty).toBeVisible();
    await empty.getByRole("button", { name: "OK", exact: true }).click();
    await expect(empty).toHaveCount(0);
    await expect(this.results(kind).getByRole("gridcell")).toHaveCount(0);
  }
}
