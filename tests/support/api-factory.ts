import { expect, type APIRequestContext } from "@playwright/test";

import type { AuthSession } from "../../scripts/auth.mjs";
import type { PerformanceMetrics } from "./performance";

export type TeacherSubjectLevel = {
  subject: string;
  level: string;
};

export type CreateTeacherOptions = {
  firstName?: string;
  lastName: string;
  email: string;
  schoolIds: string[];
  subjectLevels?: TeacherSubjectLevel[];
};

/*
 * =========================================================
 * TWORZENIE SZKOŁY PRZEZ API
 * =========================================================
 *
 * Domyślne wartości typeId/cityId pochodzą z realnego żądania
 * przechwyconego z Network (POST /api/Institution/AddNewInstitution)
 * przy tworzeniu szkoły typu "Szkoła podstawowa" w mieście Gdańsk
 * (80-064) - a więc dokładnie tej kombinacji, której używają domyślne
 * stałe DEFAULT_SCHOOL_TYPE/DEFAULT_CITY/DEFAULT_POSTAL_CODE w
 * support/school-add.ts. Żadna INNA kombinacja typu/miasta nie została
 * potwierdzona - jeśli kiedyś będzie potrzebna szkoła innego typu lub
 * w innym mieście utworzona przez API, trzeba najpierw przechwycić
 * analogiczne żądanie z Network i podać właściwe ID jawnie przez
 * options.typeId/options.cityId, zamiast zgadywać.
 */
const DEFAULT_API_SCHOOL_TYPE_ID = 3; // "Szkoła podstawowa"
const DEFAULT_API_SCHOOL_CITY_ID = 64; // Gdańsk
const DEFAULT_API_SCHOOL_ZIP_CODE = "80-064";
const DEFAULT_API_SCHOOL_CITY = "Gdańsk";

export type CreateSchoolOptions = {
  name?: string;
  number?: string;
  typeId?: number;
  cityId?: number;
  zipCode?: string;
  postName?: string;
  city?: string;
  street?: string;
  fullName?: string;
  email?: string;
  www?: string;
  quantityOfStudents?: string;
  rspo?: string;
  nip?: string;
  regon?: string;
};

type DictionaryEntry = {
  id: number;
  symbol: string;
  description: string;
};

type CreatedTeacher = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type CreatedSchool = {
  id: number;
  name: string;
};

function responseError(method: string, pathname: string, status: number, body: string): Error {
  const diagnostic = body.trim().slice(0, 500);
  return new Error(
    `${method} ${pathname} zwrócił HTTP ${status}${diagnostic ? `: ${diagnostic}` : "."}`,
  );
}

function localStorageValue(authSession: AuthSession, name: string): string {
  const value = authSession.storageState.origins
    .find((entry) => entry.origin === authSession.session.origin)
    ?.localStorage.find((entry) => entry.name === name)?.value;

  if (!value) throw new Error(`Brak ${name} w zapisanej sesji Octopusa.`);

  try {
    return String(JSON.parse(value));
  } catch {
    return value;
  }
}

export class OctopusApiFactory {
  private subjects?: DictionaryEntry[];
  private levels?: DictionaryEntry[];

  constructor(
    private readonly request: APIRequestContext,
    private readonly authSession: AuthSession,
    private readonly metrics: PerformanceMetrics,
  ) {}

  private async get<T>(pathname: string): Promise<T> {
    return this.metrics.measure("api.get", async () => {
      const response = await this.request.get(pathname, {
        headers: {
          Authorization: `Bearer ${localStorageValue(this.authSession, "token")}`,
        },
      });

      this.metrics.increment("api.requests");
      this.metrics.increment(`api.status.${response.status()}`);
      const text = await response.text();
      if (!response.ok()) throw responseError("GET", pathname, response.status(), text);
      return JSON.parse(text) as T;
    });
  }

  private async post<T>(pathname: string, data?: unknown): Promise<T> {
    return this.metrics.measure("api.post", async () => {
      const response = await this.request.post(pathname, {
        data,
        headers: {
          Authorization: `Bearer ${localStorageValue(this.authSession, "token")}`,
        },
      });

      this.metrics.increment("api.requests");
      this.metrics.increment(`api.status.${response.status()}`);
      const text = await response.text();
      if (!response.ok()) throw responseError("POST", pathname, response.status(), text);
      return (text ? JSON.parse(text) : undefined) as T;
    });
  }

  private async waitForGet<T>(
    pathname: string,
    isReady: (value: T) => boolean = () => true,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        // Odpowiedzi GET z Octopusa bywają cache'owane przez 10 sekund,
        // łącznie z przejściowym HTTP 500. Unikalny parametr sprawia, że
        // ponowienie naprawdę trafia do aplikacji, a nie do starego cache.
        const separator = pathname.includes("?") ? "&" : "?";
        const value = await this.get<T>(`${pathname}${separator}_e2eAttempt=${attempt}`);
        if (isReady(value)) return value;
      } catch (error) {
        lastError = error;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Dane API nie były gotowe po utworzeniu rekordu: ${pathname}`);
  }

  private async dictionary(
    kind: "subjects" | "levels",
    pathname: string,
  ): Promise<DictionaryEntry[]> {
    const cached = this[kind];
    if (cached) return cached;

    const entries = await this.get<DictionaryEntry[]>(pathname);
    this[kind] = entries;
    return entries;
  }

  private async resolveSubjectLevel({
    subject,
    level,
  }: TeacherSubjectLevel): Promise<{ subjectId: number; levelId: number }> {
    const [subjects, levels] = await Promise.all([
      this.dictionary("subjects", "/api/Dictionary/GetSubjects"),
      this.dictionary("levels", "/api/Dictionary/GetLevels"),
    ]);
    const subjectEntry = subjects.find(
      (entry) => entry.description === subject || entry.symbol === subject,
    );
    const levelEntry = levels.find(
      (entry) => entry.description === level || entry.symbol === level,
    );

    if (!subjectEntry) throw new Error(`Nie znaleziono przedmiotu "${subject}" w słowniku API.`);
    if (!levelEntry) throw new Error(`Nie znaleziono poziomu "${level}" w słowniku API.`);

    return {
      subjectId: subjectEntry.id,
      levelId: levelEntry.id,
    };
  }

  async createTeacher(options: CreateTeacherOptions): Promise<string> {
    return this.metrics.measure("setup.api.teacher", async () => {
      const userId = Number(localStorageValue(this.authSession, "id"));
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error("Sesja Octopusa nie zawiera poprawnego ID użytkownika.");
      }

      const teacherStatus = await Promise.all(
        (options.subjectLevels ?? []).map((entry) => this.resolveSubjectLevel(entry)),
      );
      const createdAt = new Date().toISOString();
      const teacher = await this.post<CreatedTeacher>("/api/Teacher/AddTeacher", {
        lastName: options.lastName,
        firstName: options.firstName ?? "Testowy",
        email: options.email,
        dateOfBirth: null,
        phone: "",
        sourceId: 84,
        createdBy: userId,
        createdAt,
        statusId: 22,
        sex: false,
        rodo: [
          {
            marketing: false,
            email: false,
            call: false,
            rodoSourceId: 84,
          },
        ],
        teacherStatus,
        teacherSchools: options.schoolIds.map((schoolId) => ({
          schoolId: Number(schoolId),
        })),
      });

      const teacherId = String(teacher.id);
      expect(teacherId, "API powinno zwrócić ID utworzonego nauczyciela").toMatch(/^\d+$/);
      expect(teacher.email).toBe(options.email);

      // AddTeacher odpowiada zanim rekord jest zawsze widoczny dla kolejnych
      // endpointów. Bez tej bariery historia i flaga Testowy sporadycznie
      // trafiają na niezatwierdzony jeszcze rekord.
      await this.waitForGet<{ id: number }>(`/api/Teacher/${teacherId}`, (value) =>
        Boolean(value?.id),
      );

      await this.post<void>("/api/TeacherEntryHistory/Add", {
        teacherId: teacher.id,
        createdBy: userId,
        email: "",
        id: -1,
        firstName: "",
        lastName: "",
      });
      await this.post<void>(`/api/Teacher/InsertIntoTestTeachers?teacherId=${teacherId}`, {
        teacherId,
      });
      await this.waitForGet<boolean>(
        `/api/Teacher/GetTeacherIsTested?teacherId=${teacherId}`,
        Boolean,
      );

      return teacherId;
    });
  }

  /*
   * UWAGA: w odróżnieniu od createTeacher() ta metoda NIE oznacza szkoły
   * jako rekord testowy ("Testowy") - odpowiednik InsertIntoTestTeachers
   * dla szkół nie został zweryfikowany w tym repozytorium (żaden test ani
   * plik supportu nie wywołuje go jawnie; support/octopus.ts#markTestRecord
   * przełącza checkbox w UI, a nie woła API bezpośrednio). Jeśli po
   * utworzeniu szkoły przez API potrzebne jest oznaczenie jej jako
   * testowej, najprostszy bezpieczny sposób to otworzenie panelu szkoły
   * i wywołanie Octopus.markTestRecord() - dokładnie tak samo, jak robi
   * to scenario.createSchool() dla szkół tworzonych przez UI.
   */
  async createSchool(options: CreateSchoolOptions = {}): Promise<string> {
    return this.metrics.measure("setup.api.school", async () => {
      const userId = Number(localStorageValue(this.authSession, "id"));
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error("Sesja Octopusa nie zawiera poprawnego ID użytkownika.");
      }

      const createdAt = new Date().toISOString();
      const school = await this.post<CreatedSchool>("/api/Institution/AddNewInstitution", {
        name: options.name ?? `API ${Date.now()} Szkoła testowa`,
        fullName: options.fullName ?? "",
        typeId: options.typeId ?? DEFAULT_API_SCHOOL_TYPE_ID,
        zipCode: options.zipCode ?? DEFAULT_API_SCHOOL_ZIP_CODE,
        postName: options.postName ?? DEFAULT_API_SCHOOL_CITY,
        city: options.city ?? DEFAULT_API_SCHOOL_CITY,
        street: options.street ?? "",
        number: options.number ?? String(Date.now()),
        cityId: options.cityId ?? DEFAULT_API_SCHOOL_CITY_ID,
        quantityOfStudents: options.quantityOfStudents ?? "",
        rspo: options.rspo ?? "",
        nip: options.nip ?? "",
        regon: options.regon ?? "",
        createdBy: userId,
        createdAt,
        email: options.email ?? "",
        www: options.www ?? "",
        institutionPhoneNumbers: [null],
      });

      const schoolId = String(school.id);
      expect(schoolId, "API powinno zwrócić ID utworzonej szkoły").toMatch(/^\d+$/);
      return schoolId;
    });
  }
}
