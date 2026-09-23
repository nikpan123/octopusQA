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
      expect(response.ok(), `GET ${pathname} powinien zakończyć się powodzeniem`).toBeTruthy();
      return (await response.json()) as T;
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
      expect(response.ok(), `POST ${pathname} powinien zakończyć się powodzeniem`).toBeTruthy();

      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    });
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

      return teacherId;
    });
  }
}
