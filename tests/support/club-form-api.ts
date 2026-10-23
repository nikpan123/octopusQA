import { entitlementSchoolPattern } from "../../scripts/test-names.mjs";
import { apiStep } from "./api-step";
import { expect, type APIRequestContext } from "@playwright/test";
import type { AuthSession } from "../../scripts/auth.mjs";
import type { PerformanceMetrics } from "./performance";
import { OCTOPUS_ENV } from "./environment";

// Rok aktywny potwierdzony przez użytkownika. Nie wybieramy przyszłego roku
// tylko dlatego, że po dodaniu do słownika pojawi się na pierwszej pozycji.
export const TFL_CURRENT_SCHOOL_YEAR = process.env.OCTOPUS_TFL_CURRENT_SCHOOL_YEAR ?? "2026/2027";

type SchoolYear = { id: number; year: number; description: string };
type Subject = { id: number; symbol: string; description: string };
type ClubClass = {
  class: number;
  className: string;
  scopeId: number;
  schoolId: number;
  levelId: number;
  isOur: boolean;
  isChecked: boolean;
  createdAt?: string;
  createdBy?: number;
  createdByName?: string;
  formClubId?: number;
};
type Publisher = { id: number; symbol: string; name: string; levelId: number };
type Form = {
  id: number;
  createdAt?: string;
  teacherId: number;
  subjectId: number;
  year: number;
  isDel: boolean;
  isOur?: boolean;
  formClubClasses: ClubClass[];
  formClubPublishers: Array<Publisher & { publisherId: number; schoolId: number }>;
};
type Declaration = {
  teacherId: string;
  schoolId: string;
  subjectId: number;
  classes: string[];
  year: SchoolYear;
};

function storageValue(auth: AuthSession, name: string) {
  const raw = auth.storageState.origins
    .find((origin) => origin.origin === auth.session.origin)
    ?.localStorage.find((item) => item.name === name)?.value;
  if (!raw) throw new Error(`Brak ${name} w sesji przygotowania formularzy.`);
  try {
    return String(JSON.parse(raw));
  } catch {
    return raw;
  }
}

function classIdentity(item: ClubClass) {
  return `${item.schoolId}:${item.levelId}:${item.class}:${item.scopeId}:${item.isOur}`;
}

/** Zapis jak w formularzu klubowym Octopusa, nie bezpośrednia zmiana statusów nauczyciela. */
export class ClubFormApi {
  private readonly headers: { Authorization: string };
  private readonly userId: number;
  private userName?: string;
  private readonly owners = new Map<string, Set<string>>();
  private readonly declarations = new Map<string, Declaration>();
  private years?: SchoolYear[];
  private subjects?: Subject[];
  private readonly boxes = new Map<string, ClubClass[]>();
  private readonly publishers = new Map<string, Publisher[]>();

  constructor(
    private readonly request: APIRequestContext,
    auth: AuthSession,
    private readonly metrics: PerformanceMetrics,
    private readonly liveHeaders?: () => Promise<{ Authorization: string }>,
  ) {
    this.headers = {
      Authorization: `Bearer ${storageValue(auth, "token").replace(/^Bearer\s+/i, "")}`,
    };
    this.userId = Number(storageValue(auth, "id"));
    expect(Number.isSafeInteger(this.userId) && this.userId > 0).toBe(true);
  }

  private async requestHeaders() {
    return this.liveHeaders ? this.liveHeaders() : this.headers;
  }

  private async audit() {
    if (!this.userName) {
      const user = await this.get<{ login: string }>(`/api/User/${this.userId}`);
      expect(
        user.login,
        "Dane audytowe powinny zawierać login zalogowanego użytkownika",
      ).toBeTruthy();
      this.userName = user.login;
    }
    return {
      createdAt: new Date().toISOString(),
      createdBy: this.userId,
      createdByName: this.userName,
    };
  }

  registerTeacher(
    teacherId: string,
    lastName: string,
    schools: Array<{ id: string; name: string }>,
  ) {
    expect(teacherId).toMatch(/^[1-9]\d*$/);
    expect(lastName).toMatch(/^(?:AUTO_[a-f0-9]{12}$|REG_\d+_[a-f0-9]{6} FILTR )/);
    for (const school of schools) {
      expect(school.id).toMatch(/^[1-9]\d*$/);
      expect(school.name).toMatch(/^AUTO_TFL_/);
    }
    this.owners.set(teacherId, new Set(schools.map((school) => school.id)));
  }

  registerEntitlementTeacher(
    teacherId: string,
    lastName: string,
    schools: Array<{ id: string; name: string }>,
  ) {
    // Osobna, wąska ścieżka dla fixture Uprawnień; nie rozszerza właścicieli TFL.
    expect(teacherId).toMatch(/^[1-9]\d*$/);
    expect(lastName).toMatch(/^(?:AUTO_[a-f0-9]{12}|REG_\d+_[a-f0-9]{6})$/);
    expect(schools.length).toBeGreaterThan(0);
    for (const school of schools) {
      expect(school.id).toMatch(/^[1-9]\d*$/);
      expect(school.name).toMatch(entitlementSchoolPattern(OCTOPUS_ENV));
    }
    this.owners.set(teacherId, new Set(schools.map((school) => school.id)));
  }

  private async get<T>(path: string): Promise<T> {
    return this.metrics.measure("setup.api.club.get", async () => {
      const response = await this.request.get(path, { headers: await this.requestHeaders() });
      this.metrics.increment("api.requests");
      this.metrics.increment(`api.status.${response.status()}`);
      expect(response.ok(), `GET ${path.split("?")[0]}: HTTP ${response.status()}`).toBe(true);
      return (await response.json()) as T;
    });
  }

  private async post(path: string, data: unknown) {
    await this.metrics.measure("setup.api.club.post", async () => {
      const response = await this.request.post(path, {
        headers: await this.requestHeaders(),
        data,
      });
      this.metrics.increment("api.requests");
      this.metrics.increment(`api.status.${response.status()}`);
      expect(response.ok(), `POST ${path}: HTTP ${response.status()}`).toBe(true);
      const text = await response.text();
      let result: { codeResult?: number } | undefined;
      try {
        result = JSON.parse(text) as { codeResult?: number };
      } catch {
        /* Empty success is allowed. */
      }
      if (result?.codeResult !== undefined)
        expect([200, 204], `POST ${path}: biznesowy kod odpowiedzi ${result.codeResult}`).toContain(
          result.codeResult,
        );
      // Bez automatycznych powtórzeń POST: nie tworzymy drugiego potwierdzenia po niepewnym zapisie.
    });
  }

  async schoolYears(): Promise<SchoolYear[]> {
    this.years ??= await this.get<SchoolYear[]>("/api/DictSchoolYear/GetSchoolYears");
    expect(this.years.length).toBeGreaterThanOrEqual(2);
    return this.years.map((year) => ({ ...year }));
  }

  createdDeclarations() {
    return [...this.declarations].map(([confirmationId, item]) => ({
      teacherId: item.teacherId,
      confirmationId,
      schoolYear: item.year.description,
    }));
  }

  private async resolveYear(description?: string) {
    const years = await this.schoolYears();
    const requested = description ?? TFL_CURRENT_SCHOOL_YEAR;
    const year = years.find((item) => item.description === requested);
    if (!year) throw new Error(`Rok ${requested} nie występuje w słowniku formularza klubowego.`);
    return year;
  }

  private async resolveSubject(name: string) {
    this.subjects ??= await this.get<Subject[]>("/api/Dictionary/GetSubjects");
    const subject = this.subjects.find((item) => item.description === name || item.symbol === name);
    if (!subject) throw new Error(`Brak przedmiotu ${name} w słowniku formularzy.`);
    return subject.id;
  }

  private async formList(teacherId: string) {
    expect(
      this.owners.has(teacherId),
      "Wolno odczytywać formularze tylko własnego nauczyciela TFL",
    ).toBe(true);
    const forms = await this.get<Form[]>(`/api/TeacherFormClub/${teacherId}`);
    expect(Array.isArray(forms), "Lista formularzy powinna być tablicą").toBe(true);
    return forms;
  }

  private async classes(declaration: Declaration, own: boolean, confirmationId?: number) {
    const key = `${declaration.schoolId}:${declaration.subjectId}`;
    let rows = this.boxes.get(key);
    if (!rows) {
      const groups = await this.get<Array<{ schoolId: number; listOfCheckBoxes: ClubClass[] }>>(
        `/api/TeacherFormClub/GetCheckBoxesToFormClub?schoolIds=${declaration.schoolId}&subjectId=${declaration.subjectId}`,
      );
      const group = groups.find((item) => String(item.schoolId) === declaration.schoolId);
      if (!group) throw new Error("Brak klas wskazanej szkoły w danych formularza.");
      rows = group.listOfCheckBoxes;
      this.boxes.set(key, rows);
    }
    const audit = await this.audit();
    const availableRows = rows;
    return declaration.classes.map((className) => {
      const matches = availableRows.filter(
        (item) => item.className === className && item.isOur === own,
      );
      expect(matches, `Jednoznaczna klasa ${className} dla isOur=${own}`).toHaveLength(1);
      const row = matches[0];
      return {
        ...row,
        isChecked: true,
        ...audit,
        ...(confirmationId ? { formClubId: confirmationId } : {}),
      };
    });
  }

  private async foreignPublisher(declaration: Declaration, levelId: number) {
    const key = `${declaration.subjectId}:${levelId}`;
    let rows = this.publishers.get(key);
    if (!rows) {
      rows = await this.get<Publisher[]>(
        `/api/Dictionary/GetPublishersPerSubLev?subjectId=${declaration.subjectId}&levelId=${levelId}`,
      );
      this.publishers.set(key, rows);
    }
    const matches = rows.filter((publisher) => publisher.symbol === "NOWA ERA");
    expect(matches, "Słownik powinien zawierać jedno wydawnictwo NOWA ERA").toHaveLength(1);
    return {
      ...matches[0],
      schoolId: Number(declaration.schoolId),
      publisherId: matches[0].id,
      isChecked: true,
    };
  }

  private async payload(declaration: Declaration, own: boolean, existing?: Form) {
    const classes = await this.classes(declaration, own, existing?.id);
    expect(classes.length).toBeGreaterThan(0);
    const publishers = own ? [] : [await this.foreignPublisher(declaration, classes[0].levelId)];
    return {
      teacherId: Number(declaration.teacherId),
      subjectId: declaration.subjectId,
      year: declaration.year.year,
      ...(await this.audit()),
      formClubClasses: classes,
      formClubPublishers: publishers,
      sendEmail: false,
      ...(existing
        ? { id: existing.id, isDel: existing.isDel, isOur: existing.isOur }
        : { show: true }),
    };
  }

  private matches(form: Form, declaration: Declaration, classes: ClubClass[]) {
    return (
      !form.isDel &&
      form.teacherId === Number(declaration.teacherId) &&
      form.subjectId === declaration.subjectId &&
      form.year === declaration.year.year &&
      JSON.stringify(form.formClubClasses.map(classIdentity).sort()) ===
        JSON.stringify(classes.map(classIdentity).sort())
    );
  }

  async create(
    teacherId: string,
    schoolId: string,
    own: boolean,
    options: { subject?: string; year?: string; classes?: string[] } = {},
  ) {
    return await apiStep(
      "Przygotowanie API: zapis potwierdzenia klubowego i weryfikacja zapisu",
      async () => {
        expect(
          this.owners.get(teacherId)?.has(schoolId),
          "Formularz dotyczy własnego nauczyciela i przypisanej szkoły TFL",
        ).toBe(true);
        const declaration: Declaration = {
          teacherId,
          schoolId,
          subjectId: await this.resolveSubject(options.subject ?? "Matematyka"),
          classes: options.classes ?? ["4"],
          year: await this.resolveYear(options.year),
        };
        const before = new Set((await this.formList(teacherId)).map((form) => form.id));
        const data = await this.payload(declaration, own);
        await this.post("/api/TeacherFormClub", data);
        let saved: Form[] = [];
        await expect
          .poll(
            async () => {
              saved = (await this.formList(teacherId)).filter(
                (form) =>
                  !before.has(form.id) && this.matches(form, declaration, data.formClubClasses),
              );
              return saved.length;
            },
            {
              message: "Nowe potwierdzenie powinno być zapisane raz z właściwymi klasami i rokiem",
            },
          )
          .toBe(1);
        expect(
          Number.isSafeInteger(saved[0].id) && saved[0].id > 0,
          "Zapis powinien zwrócić poprawne ID formularza",
        ).toBe(true);
        const id = String(saved[0].id);
        this.declarations.set(id, declaration);
        this.expectPublishers(saved[0], own, data.formClubPublishers);
        return { teacherId, confirmationId: id, schoolYear: declaration.year.description };
      },
    );
  }

  private expectPublishers(
    form: Form,
    own: boolean,
    publishers: Array<{ publisherId: number; schoolId: number }>,
  ) {
    const identity = (items: Array<{ publisherId: number; schoolId: number }>) =>
      items.map((item) => `${item.schoolId}:${item.publisherId}`).sort();
    expect(identity(form.formClubPublishers)).toEqual(own ? [] : identity(publishers));
  }

  private ownedDeclaration(teacherId: string, confirmationId: string) {
    const declaration = this.declarations.get(confirmationId);
    if (!declaration || declaration.teacherId !== teacherId)
      throw new Error("Formularz nie został utworzony przez bieżący scenariusz TFL.");
    return declaration;
  }

  async change(teacherId: string, confirmationId: string, own: boolean) {
    return await apiStep("API: zmiana wydawnictwa w potwierdzeniu", async () => {
      const declaration = this.ownedDeclaration(teacherId, confirmationId);
      const form = (await this.formList(teacherId)).find(
        (item) => String(item.id) === confirmationId,
      );
      if (!form || form.isDel) throw new Error("Brak aktywnego własnego formularza do edycji.");
      const data = await this.payload(declaration, own, form);
      await this.post("/api/TeacherFormClub", data);
      let saved: Form | undefined;
      await expect
        .poll(
          async () => {
            saved = (await this.formList(teacherId)).find(
              (item) => String(item.id) === confirmationId,
            );
            return saved ? this.matches(saved, declaration, data.formClubClasses) : false;
          },
          { message: "Edycja powinna zachować ID formularza i zapisać nową deklarację" },
        )
        .toBe(true);
      if (!saved) throw new Error("Brak zapisanego formularza po edycji.");
      this.expectPublishers(saved, own, data.formClubPublishers);
    });
  }

  async remove(teacherId: string, confirmationId: string) {
    return await apiStep("API: usunięcie potwierdzenia klubowego i weryfikacja stanu", async () => {
      this.ownedDeclaration(teacherId, confirmationId);
      await this.post("/api/TeacherFormClub/DelOrGetBackFormClub", {
        formClubId: Number(confirmationId),
        isDel: true,
        createdBy: this.userId,
      });
      await expect
        .poll(
          async () => {
            const form = (await this.formList(teacherId)).find(
              (item) => String(item.id) === confirmationId,
            );
            return form?.isDel;
          },
          { message: "Usunięcie formularza przez API powinno zapisać soft delete" },
        )
        .toBe(true);
    });
  }

  async restore(teacherId: string, confirmationId: string) {
    return await apiStep("API: przywrócenie potwierdzenia i sprawdzenie stanu", async () => {
      this.ownedDeclaration(teacherId, confirmationId);
      const form = (await this.formList(teacherId)).find(
        (item) => String(item.id) === confirmationId,
      );
      expect(form?.isDel, "Przywracamy wyłącznie własne usunięte potwierdzenie").toBe(true);
      await this.post("/api/TeacherFormClub/DelOrGetBackFormClub", {
        formClubId: Number(confirmationId),
        isDel: false,
        createdBy: this.userId,
      });
      await expect
        .poll(
          async () =>
            (await this.formList(teacherId)).find((item) => String(item.id) === confirmationId)
              ?.isDel,
        )
        .toBe(false);
    });
  }
}
