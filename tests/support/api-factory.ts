import { automaticTeacherName } from "../../scripts/test-names.mjs";
import { apiStep } from "./api-step";
import { expect, type APIRequestContext } from "@playwright/test";

import type { AuthSession } from "../../scripts/auth.mjs";
import type { PerformanceMetrics } from "./performance";

export type TeacherSubjectLevel = {
  subject: string;
  level: string;
};

export type CreateTeacherOptions = {
  testRecord?: boolean;
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

function responseError(method: string, pathname: string, status: number, body: string): Error {
  const diagnostic = body.trim().slice(0, 500);
  return new Error(
    `${method} ${pathname} zwrócił HTTP ${status}${diagnostic ? `: ${diagnostic}` : "."}`,
  );
}

function isOptimisticConcurrencyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("POST /api/TeacherEntryHistory/Add zwrócił HTTP 500") &&
    error.message.includes("optimistic concurrency")
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
    return await apiStep(
      `Przygotowanie API: utwórz nauczyciela, przypisz ${options.schoolIds.length === 1 ? "istniejącą szkołę" : "istniejące szkoły"} i nauczane przedmioty`,
      async () => {
        return this.metrics.measure("setup.api.teacher", async () => {
          if (options.testRecord === false) {
            const runIdentity = options.email
              .replace(/@example\.invalid$/, "")
              .replace(/^reg_/, "REG_");
            expect(runIdentity, "Bez flagi tworzymy wyłącznie własne rekordy regresji").toMatch(
              /^REG_\d+_[a-f0-9]{6}$/,
            );
            expect(options.email).toBe(`${runIdentity.toLowerCase()}@example.invalid`);
            expect([automaticTeacherName(runIdentity), runIdentity]).toContain(options.lastName);
          }
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
            firstName: options.firstName ?? "Auto",
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

          const historyEntry = {
            teacherId: teacher.id,
            createdBy: userId,
            email: "",
            id: -1,
            firstName: "",
            lastName: "",
          };

          for (let attempt = 1; attempt <= 3; attempt += 1) {
            try {
              await this.post<void>("/api/TeacherEntryHistory/Add", historyEntry);
              break;
            } catch (error) {
              if (attempt === 3 || !isOptimisticConcurrencyError(error)) throw error;

              this.metrics.increment("setup.api.teacher-history.retry");
              await new Promise((resolve) => setTimeout(resolve, attempt * 100));
            }
          }
          if (options.testRecord !== false) {
            await this.post<void>(`/api/Teacher/InsertIntoTestTeachers?teacherId=${teacherId}`, {
              teacherId,
            });
          }

          return teacherId;
        });
      },
    );
  }
}
