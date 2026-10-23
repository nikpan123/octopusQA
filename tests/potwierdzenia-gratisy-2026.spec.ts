import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { test as accessTest, type EntitlementData, type AccessClass } from "./support/entitlements";
import { liveOctopusHeaders } from "./support/live-auth";
import matrixSource from "./data/potwierdzenia-gratisy-2026.json" with { type: "json" };
import corrections from "./data/potwierdzenia-gratisy-2026-overrides.json" with { type: "json" };
import { applyConfirmationOverrides } from "../scripts/confirmation-matrix.mjs";
import cases from "./data/potwierdzenia-gratisy-2026-cases.json" with { type: "json" };
import smoke from "./data/gratisy-szybki-test-2026.json" with { type: "json" };
import { matchingConfirmationClasses } from "../scripts/confirmation-classes.mjs";
import { setTestOrderDate } from "../scripts/test-order-date.mjs";
import { recalculateTestGifts } from "../scripts/test-gift-recalculation.mjs";
import { OCTOPUS_ENV } from "./support/environment";
import { categoryDetails } from "./support/school-category";
import { schoolPanelTextField } from "./support/school-add";

const matrix = applyConfirmationOverrides(matrixSource, corrections);
type MatrixRow = (typeof matrix.rows)[number];
type Gift = {
  id: number;
  teacherId: number;
  schoolId: number;
  shippingId: number | null;
  shipmentDate: string | null;
  shippingDate: string | null;
  isShippingInPost: boolean;
  closed: boolean;
  printed: boolean;
  orderItems: Array<{
    orderItemId: number;
    businessCode: string;
    quantity: number;
    unpermittedForShipping: boolean;
    reason: string;
  }>;
};

// Reuse the existing gift-copy scenario's real API workflow. No sending/printing endpoints.
const runNamespace = `POTW26_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const smokeIds = new Set(smoke.testIds);
const test = accessTest.extend({
  accessSchoolNamespace: async ({}, use, info) => {
    await use(`${runNamespace}_P${info.parallelIndex}`);
  },
});

async function gifts(data: EntitlementData): Promise<Gift[]> {
  await data.get("/api/TeacherOrder/GetPositions", {
    filterModel: JSON.stringify({
      teacherId: Number(data.teacherId),
      active: null,
      page: 1,
      limit: 500,
      direction: null,
    }),
  });
  const body = await data.get<{ data: Gift[]; metaData: { totalItems: number } }>(
    "/api/TeacherOrder/GetNotDel",
    {
      filterModel: JSON.stringify({ teacherId: Number(data.teacherId), page: 1, limit: 500 }),
    },
  );
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.metaData.totalItems).toBeLessThanOrEqual(500);
  for (const gift of body.data) {
    expect(gift.teacherId, "Odczyt wyłącznie nowego nauczyciela testu").toBe(
      Number(data.teacherId),
    );
    expect(data.schools.map((s) => Number(s.id))).toContain(gift.schoolId);
    expect(gift.shippingId, "Gratis pozostaje niewysłany").toBeNull();
    expect(gift.shipmentDate).toBeNull();
    expect(gift.shippingDate).toBeNull();
    expect(gift.isShippingInPost).toBe(false);
    expect(gift.printed).toBe(false);
    expect(gift.closed).toBe(false);
  }
  return body.data;
}

async function confirmation(data: EntitlementData, row: MatrixRow, own: boolean, year: string) {
  const subjects = await data.get<Array<{ id: number; description: string }>>(
    "/api/Dictionary/GetSubjects",
  );
  const subject = subjects.filter((s) => s.description === row.subject);
  expect(subject, `Przedmiot ${row.subject} w słowniku`).toHaveLength(1);
  const school = data.schools[0];
  const groups = await data.get<Array<{ schoolId: number; listOfCheckBoxes: AccessClass[] }>>(
    "/api/TeacherFormClub/GetCheckBoxesToFormClub",
    { schoolIds: school.id, subjectId: subject[0].id },
  );
  const boxes = groups.find((g) => g.schoolId === Number(school.id))?.listOfCheckBoxes ?? [];
  const matching = matchingConfirmationClasses(boxes, row, own);
  expect(
    matching,
    `Jednoznaczna klasa ${row.classLevel}, seria ${row.series}, zakres ${row.scope}, NASZ=${own}; dostępne: ${boxes.map((b) => `${b.className}/${b.isOur}`).join(", ")}`,
  ).toHaveLength(1);
  await data.scenario.record("confirmationClassName", matching[0].className);
  return data.club.create(data.teacherId, school.id, own, {
    subject: row.subject,
    year,
    classes: [matching[0].className],
  });
}

async function cleanup(data: EntitlementData) {
  const errors: unknown[] = [];
  const attempt = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
    } catch (error) {
      errors.push(error);
    }
  };
  for (const form of data.club.createdDeclarations()) {
    await attempt(() => data.club.remove(data.teacherId, form.confirmationId));
  }
  await attempt(() => data.finish());
  await attempt(async () => {
    for (const gift of await gifts(data)) {
      // gifts() verifies ownership and unsent state before DELETE.
      const response = await data.page.context().request.delete("/api/TeacherOrder/Delete", {
        headers: await liveOctopusHeaders(data.page),
        params: { teacherOrderId: gift.id },
      });
      expect(response.ok(), `Usunięcie własnego niewysłanego gratisu ${gift.id}`).toBe(true);
    }
    await expect.poll(() => gifts(data)).toEqual([]);
  });
  if (errors.length)
    throw new AggregateError(errors, "Sprzątanie pakietu potwierdzeń nie zakończyło się w całości");
}

test.describe("Potwierdzenia SP i SŚ 2026 — pełna macierz Excela", () => {
  test.describe.configure({ mode: "parallel" });
  for (const c of cases) {
    const row = matrix.rows.find((r) => r.key === c.rowKey)!;
    test.describe(c.id, () => {
      test.skip(
        OCTOPUS_ENV !== "dev",
        "Zmiana dat własnych zamówień w bazie jest skonfigurowana dla DEV / GWO_CRMDEV.",
      );
      test.use({
        accessTestFlags: { teacher: c.variant === "TEST_TEACHER", school: false },
        accessCleanupUnmarkedTeacher: true,
        accessTeacherSchools: "target",
        accessSchoolCount: 1,
        accessSchoolKey: `${row.level === "SP" ? "SP" : "TECH"}_${c.students ?? "MISSING"}_`,
        accessStudentCount: c.students,
        accessSchoolType: row.level === "SP" ? "Szkoła podstawowa" : "Technikum",
        accessSubjectLevels: [
          {
            subject: row.subject,
            level: row.level === "SP" ? "Szkoła Podstawowa" : "Szkoła Średnia",
          },
        ],
      });
      test(`${c.id}: ${c.title} @gift @potw26${smokeIds.has(c.id) ? " @gift-smoke" : ""}`, async ({
        access: data,
      }, info) => {
        test.setTimeout(240000);
        const api = data.orders(data.schools[0]);
        try {
          await test.step(c.stepTitles.prepare, async () => {
            await data.scenario.app.openPanel("school", api.school.id);
            if (row.level === "SP") {
              await expect(
                schoolPanelTextField(categoryDetails(data.page), "Próg"),
                "Pole Próg określa liczbę podręczników; nie naliczamy z niego ponownie 60%",
              ).toHaveValue(String(c.schoolThreshold));
            }
            expect(await api.orders(), "Brak obcych lub pozostałych zamówień").toEqual([]);
            expect(await gifts(data), "Nowy nauczyciel bez wcześniejszych gratisów").toEqual([]);
            expect(
              await data.get<boolean>("/api/Teacher/GetTeacherIsTested", {
                teacherId: data.teacherId,
              }),
            ).toBe(c.variant === "TEST_TEACHER");
            expect(
              await data.get<boolean>("/api/School/GetSchoolIsTested", {
                schoolId: data.schools[0].id,
              }),
            ).toBe(false);
            await info.attach("Reguła i dane z Excela", {
              body: JSON.stringify({
                row,
                case: c,
                teacherId: data.teacherId,
                schoolId: api.school.id,
                sourceHash: matrix.sha256,
                corrections: matrix.corrections,
              }),
              contentType: "application/json",
            });
          });
          if (c.variant === "NO_ORDER") {
            await test.step(c.stepTitles.order, async () => {
              expect(
                await api.orders(),
                "Szkoła pozostaje bez zamówień przed dodaniem potwierdzenia",
              ).toEqual([]);
            });
          } else {
            const products = (await api.catalog({ title: row.orderCode })).filter(
              (p) => p.businessCode === row.orderCode && !p.isDel,
            );
            expect(products, `Dokładny produkt wejściowy ${row.orderCode}`).toHaveLength(1);
            expect(
              products[0].classes,
              "Podręcznik odpowiada klasie produktu wskazanej w danych testu",
            ).toContain(row.orderClassLevel ?? row.classLevel);
            // Noon keeps the day stable across Warsaw/UTC conversions; dates are never replaced with today.
            const id = await test.step(c.stepTitles.order, () =>
              api.save([{ product: products[0], quantity: c.quantity }]),
            );
            expect(api.owned.has(id)).toBe(true);
            await test.step(c.stepTitles.date, async () => {
              const saved = await setTestOrderDate({
                orderId: id,
                schoolId: api.school.id,
                userId: data.userId,
                schoolName: api.school.name,
                date: c.date,
              });
              await data.scenario.record(`orderDate_${id}`, JSON.stringify(saved));
              await info.attach("Data zamówienia zmieniona w bazie", {
                body: JSON.stringify(saved),
                contentType: "application/json",
              });
              await expect
                .poll(
                  async () =>
                    (await api.orders()).find((o) => String(o.id) === id)?.createdAt?.slice(0, 10),
                  { message: "Data z bazy widoczna przez API przed sprawdzeniem gratisów" },
                )
                .toBe(c.date);
              const recalculated = await recalculateTestGifts({
                action: "School",
                schoolId: api.school.id,
                schoolName: api.school.name,
                teacherId: data.teacherId,
                userId: data.userId,
                orderId: id,
              });
              await info.attach(
                "EXEC RecalculateSchoolClassDigitalAccessesBasedOnSchoolId — po zmianie daty",
                {
                  body: JSON.stringify(recalculated),
                  contentType: "application/json",
                },
              );
            });
          }
          await test.step(c.stepTitles.confirm, async () => {
            const form = await confirmation(
              data,
              row,
              c.variant !== "FOREIGN",
              c.variant === "OLD_CONFIRM" ? "2025/2026" : matrix.confirmationYear,
            );
            expect(
              data.club
                .createdDeclarations()
                .some(
                  (item) =>
                    item.confirmationId === form.confirmationId &&
                    item.teacherId === data.teacherId,
                ),
            ).toBe(true);
            const recalculated = await recalculateTestGifts({
              action: "Form",
              schoolId: api.school.id,
              schoolName: api.school.name,
              teacherId: data.teacherId,
              userId: data.userId,
              formId: form.confirmationId,
            });
            await info.attach("EXEC SendBookFromFormClubPSChangesStates — po zapisie formularza", {
              body: JSON.stringify(recalculated),
              contentType: "application/json",
            });
          });
          await test.step(c.stepTitles.view, async () => {
            expect(
              await data.get<boolean>("/api/Teacher/GetTeacherIsTested", {
                teacherId: data.teacherId,
              }),
              "Flaga Testowy nauczyciela włączona tylko w wariancie badającym tę blokadę",
            ).toBe(c.variant === "TEST_TEACHER");
            expect(
              await data.get<boolean>("/api/School/GetSchoolIsTested", {
                schoolId: api.school.id,
              }),
              "Szkoła pozostaje bez flagi Testowy",
            ).toBe(false);
            await data.scenario.app.openPanel("teacher", data.teacherId);
            await data.page.getByText("Gratisy", { exact: true }).click();
          });
          await test.step(c.stepTitles.compare, async () => {
            const result = await gifts(data);
            await info.attach("Gratisy po przeliczeniu", {
              body: JSON.stringify(result),
              contentType: "application/json",
            });
            if (!c.giftExpected) {
              expect(
                result,
                "Nauczyciel obcy, z flagą Testowy lub bez potwierdzenia na bieżący rok nie ma żadnego wpisu w Gratisach, także z blokadą",
              ).toEqual([]);
            } else {
              const target = result
                .filter((g) => g.schoolId === Number(api.school.id))
                .flatMap((g) => g.orderItems)
                .filter((i) => i.orderItemId === row.giftId && i.businessCode === row.giftCode);
              expect(
                target.map((i) => ({
                  quantity: i.quantity,
                  blocked: i.unpermittedForShipping,
                  reason: i.reason,
                })),
                "Gratis i stan blokady są dostępne od razu po dodaniu potwierdzenia",
              ).toEqual([
                {
                  quantity: 1,
                  blocked: !c.eligible,
                  reason: c.blockReason ?? expect.stringMatching(/\S/),
                },
              ]);
            }
            await info.attach("Zakładka Gratisy", {
              body: await data.page.screenshot(),
              contentType: "image/png",
            });
          });
        } finally {
          await test.step(c.stepTitles.cleanup, () => cleanup(data));
        }
      });
    });
  }
});
