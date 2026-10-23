import { expect } from "@playwright/test";
import { test as accessTest, type EntitlementData } from "./support/entitlements";
import { StructureApi } from "./support/school-structure-api";
import { liveOctopusHeaders } from "./support/live-auth";
import { TFL_CURRENT_SCHOOL_YEAR } from "./support/club-form-api";
import {
  openOrders,
  openNewOrderForm,
  addOrderProduct,
  setOrderQuantity,
  saveNewOrder,
} from "./support/order";
import {
  openNewClubForm,
  selectSchool,
  selectSchoolYear,
  ownClass,
  disableTeacherEmail,
  saveClubForm,
  deleteClubConfirmation,
  subjectLevelRow,
} from "./support/club";

// Source: Wymagania biznesowe 26-27.xlsx, "potw sp i sś 2026" F42:F49,
// A88:A97. Scope: creation only, NOT shipping eligibility or block reasons.
// No print/dispatch/status-changing endpoint.
const test = accessTest.extend({
  accessSchoolNamespace: async ({}, use, info) => {
    const run = process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN?.replace(/-/g, "").slice(0, 12);
    if (!run) throw new Error("Brak identyfikatora izolacji testów gratisów kopii.");
    await use(`COPY_GIFT_${run}_P${info.parallelIndex}`);
  },
});

test.use({
  accessTestFlags: { teacher: false, school: false },
  accessTeacherSchools: "target",
  accessSchoolCount: 2,
});

type GiftOrder = {
  id: number;
  teacherId: number;
  schoolId: number;
  subject: string;
  shippingId: number | null;
  shipmentDate: string | null;
  shippingDate: string | null;
  isShippingInPost: boolean;
  printed: boolean;
  closed: boolean;
  orderItems: Array<{
    id: number;
    orderItemId: number;
    businessCode: string;
    quantity: number;
  }>;
};

async function gifts(data: EntitlementData) {
  // The Gratisy view refreshes positions before reading teacher orders.
  // Mirror that supported read workflow; never invoke dispatch or a background job.
  await data.get("/api/TeacherOrder/GetPositions", {
    filterModel: JSON.stringify({
      active: null,
      teacherId: Number(data.teacherId),
      limit: 500,
      page: 1,
      direction: null,
    }),
  });
  const body = await data.get<{ data: GiftOrder[]; metaData: { totalItems: number } }>(
    "/api/TeacherOrder/GetNotDel",
    {
      filterModel: JSON.stringify({ teacherId: Number(data.teacherId), limit: 500, page: 1 }),
    },
  );
  expect(Array.isArray(body.data), "Rzeczywista lista gratisów nauczyciela").toBe(true);
  expect(body.metaData.totalItems, "Nie pomijamy stron listy gratisów").toBeLessThanOrEqual(500);
  for (const order of body.data) {
    expect(order.teacherId, "Lista dotyczy wyłącznie własnego nauczyciela").toBe(
      Number(data.teacherId),
    );
    expect(data.schools.map((s) => Number(s.id))).toContain(order.schoolId);
    expect(order.shippingId, "Test nie może uruchamiać wysyłki").toBeNull();
    expect(order.isShippingInPost).toBe(false);
    expect(order.printed).toBe(false);
    expect(order.closed).toBe(false);
    expect(order.shipmentDate).toBeNull();
    expect(order.shippingDate).toBeNull();
  }
  return body.data;
}

async function createdGiftOrders(data: EntitlementData) {
  return (await gifts(data)).filter(
    (order) =>
      order.schoolId === Number(data.schools[1].id) &&
      order.subject === `Wysyłka potw. FIZ SP ${TFL_CURRENT_SCHOOL_YEAR}`,
  );
}

async function confirmOurTeacher(data: EntitlementData, onCreated: (id: string) => void) {
  const id = String((await data.create("Fizyka", ["7"], data.schools[1])).id);
  onCreated(id); // Also clean up if the subsequent NASZ prerequisite assertion fails.
  const subjects = await data.get<
    Array<{
      subjectSymbol: string;
      levelSymbol: string;
      statusName: string;
      isDel: boolean;
    }>
  >("/api/TeacherSubject/GetTeacherSubjectsCrm", { teacherId: data.teacherId });
  const physics = subjects.filter(
    (row) => row.subjectSymbol === "FIZ" && row.levelSymbol === "SP" && !row.isDel,
  );
  expect(physics, "Jeden aktywny przedmiot Fizyka SP").toHaveLength(1);
  expect(physics[0].statusName, "Po formularzu nauczyciel musi być NASZ").toBe("Nasz");
  return id;
}

async function expectTestFlags(
  data: EntitlementData,
  expected: { teacher: boolean; school: boolean },
  phase = "Przed formularzem",
  verifyUi = false,
) {
  const actual = {
    teacher: await data.get<boolean>("/api/Teacher/GetTeacherIsTested", {
      teacherId: data.teacherId,
    }),
    school: await data.get<boolean>("/api/School/GetSchoolIsTested", {
      schoolId: data.schools[1].id,
    }),
  };
  await test.info().attach(`Flagi Testowy — ${phase}`, {
    body: JSON.stringify({
      phase,
      teacherId: data.teacherId,
      schoolId: data.schools[1].id,
      expected,
      actual,
    }),
    contentType: "application/json",
  });
  expect(actual, `Rzeczywiste flagi Testowy — ${phase}`).toEqual(expected);
  if (verifyUi) {
    await data.scenario.app.openPanel("teacher", data.teacherId);
    const checkbox = data.page.getByRole("checkbox", { name: "Testowy", exact: true });
    await expect(checkbox).toBeChecked({ checked: expected.teacher });
    await data.page.getByText("Gratisy", { exact: true }).click();
  }
}

for (const [suffix, quantity, mode] of [
  ["14", 30, "original"],
  ["15", 29, "below"],
  ["16", 30, "threshold"],
  ["17", 31, "above"],
] as const) {
  test(`ORD-SPEC-35980-${suffix}: utworzenie zlecenia gratisów FIZ po potwierdzeniu — ${mode}, ${quantity} F7P, bez oceny blokad @school @order @copy @gift @unmarked @redmine-35980`, async ({
    access: data,
    authSession,
  }, info) => {
    test.setTimeout(240000);
    expect(TFL_CURRENT_SCHOOL_YEAR, "Nie wykonujemy reguł arkusza 2026/2027 w innym sezonie").toBe(
      "2026/2027",
    );
    const [sourceSchool, targetSchool] = data.schools;
    const source = data.orders(sourceSchool),
      target = data.orders(targetSchool);
    const structure = new StructureApi(data.page.context().request, authSession);
    await structure.resolve(data.schools);
    for (const school of data.schools)
      expect(structure.edges(await structure.tree(school))).toEqual([]);
    expect(await source.orders(), "Wyłącznie czysta szkoła testowa źródła").toEqual([]);
    expect(await target.orders(), "Wyłącznie czysta szkoła testowa odbiorcy").toEqual([]);
    expect(await gifts(data), "Nowy własny nauczyciel bez poprzednich gratisów").toEqual([]);
    let relation: number | undefined;
    let confirmationId: string | undefined;
    let sourceId: string | undefined;
    let copyId: string | undefined;
    try {
      const product =
        await test.step("Gratisy: przygotowanie szkoły i zamówienia F7P", async () => {
          if (mode !== "original") relation = await structure.seed(sourceSchool, targetSchool, 1);
          const product = await source.product("F7P", [7]);
          expect(product.id, "Pozycja arkusza, nie produkt o podobnym symbolu").toBe(3005);
          sourceId = await (mode === "original" ? target : source).save([{ product, quantity }]);
          return product;
        });
      await test.step("Gratisy: zamówienie szkolne w placówce nauczyciela", async () => {
        if (mode === "original") {
          expect((await target.orders()).some((row) => String(row.id) === sourceId)).toBe(true);
          return;
        }
        const response = await data.page
          .context()
          .request.post("/api/SchoolOrder/MakeSchoolOrderCopy", {
            headers: await liveOctopusHeaders(data.page),
            data: {
              institutionOrderId: Number(sourceId!),
              institutionUnitIdsCopyTo: [structure.unit(targetSchool)],
              createdBy: structure.userId,
            },
          });
        expect(response.ok()).toBe(true);
        let copies: Awaited<ReturnType<typeof target.orders>> = [];
        await expect
          .poll(async () => {
            copies = (await target.orders()).filter((row) => row.isCopied);
            return copies.length;
          })
          .toBe(1);
        const id = String(copies[0].id);
        target.owned.add(id);
        expect(
          copies[0].orderItems.map((item) => ({
            id: item.dictOrderItemId,
            quantity: item.quantity,
          })),
        ).toEqual([{ id: product.id, quantity }]);
        copyId = id;
      });
      await test.step("Gratisy: potwierdzenie NASZ i utworzenie zlecenia bez oceny blokad", async () => {
        await expectTestFlags(data, { teacher: false, school: false });
        confirmationId = await confirmOurTeacher(data, (id) => {
          confirmationId = id;
        });
        await expectTestFlags(data, { teacher: false, school: false }, "Po formularzu", true);
        try {
          await expect
            .poll(async () => (await createdGiftOrders(data)).length, {
              timeout: 15000,
              message:
                "Po formularzu powstaje zlecenie FIZ; blokady nie wpływają na wynik tego testu",
            })
            .toBeGreaterThan(0);
        } finally {
          await expectTestFlags(
            data,
            { teacher: false, school: false },
            "Po oczekiwaniu na zlecenie",
          );
        }
        await info.attach("Utworzone zlecenia gratisów — bez oceny blokad", {
          body: JSON.stringify({
            sourceId,
            copyId,
            quantity,
            orders: (await createdGiftOrders(data)).map((order) => ({
              id: order.id,
              schoolId: order.schoolId,
              subject: order.subject,
            })),
          }),
          contentType: "application/json",
        });
      });
    } finally {
      await test.step("Gratisy: bezpieczne sprzątanie własnych niewysłanych danych", async () => {
        // First remove the generating inputs, then only the unsent orders of this brand-new teacher.
        const errors: unknown[] = [];
        const attempt = async (operation: () => Promise<unknown>) => {
          try {
            await operation();
          } catch (error) {
            errors.push(error);
          }
        };
        await attempt(async () => {
          for (const row of await target.orders())
            if (row.isCopied) {
              target.owned.add(String(row.id));
              await target.remove(String(row.id));
            }
        });
        await attempt(async () => {
          if (sourceId && source.owned.has(sourceId)) await source.remove(sourceId);
          if (sourceId && target.owned.has(sourceId)) await target.remove(sourceId);
        });
        await attempt(async () => {
          if (relation !== undefined) await structure.deactivate(relation);
        });
        await attempt(async () => {
          if (confirmationId) await data.club.remove(data.teacherId, confirmationId);
        });
        await attempt(async () => {
          for (const order of await gifts(data)) {
            const response = await data.page.context().request.delete("/api/TeacherOrder/Delete", {
              headers: await liveOctopusHeaders(data.page),
              params: { teacherOrderId: order.id },
            });
            expect(
              response.ok(),
              "Usunięcie wyłącznie niewysłanego gratisu własnego nauczyciela",
            ).toBe(true);
          }
          await expect.poll(() => gifts(data)).toEqual([]);
        });
        if (errors.length) throw errors[0];
      });
    }
  });
}

for (const [id, flags] of [
  ["30", { teacher: true, school: false }],
  ["31", { teacher: false, school: true }],
  ["32", { teacher: true, school: true }],
] as const) {
  test.describe(`Generowanie a Testowy: nauczyciel=${flags.teacher}, szkoła=${flags.school}`, () => {
    test.use({ accessTestFlags: flags });
    test(`ORD-SPEC-35980-${id}: ${flags.teacher ? "testowy nauczyciel blokuje utworzenie zlecenia gratisów" : "testowa szkoła nie blokuje zlecenia nietestowego nauczyciela"} @school @order @copy @gift ${flags.teacher ? "@negative" : "@positive"} @redmine-35980`, async ({
      access: data,
    }, info) => {
      const target = data.orders(data.schools[1]);
      expect(await target.orders()).toEqual([]);
      expect(await gifts(data)).toEqual([]);
      let confirmationId: string | undefined;
      let orderId: string | undefined;
      try {
        await test.step("Gratisy Testowy: zamówienie F7P i weryfikacja rzeczywistych flag", async () => {
          const product = await target.product("F7P", [7]);
          expect(product.id).toBe(3005);
          orderId = await target.save([{ product, quantity: 30 }]);
          await expectTestFlags(data, flags);
        });
        await test.step("Gratisy Testowy: zapis potwierdzenia NASZ", async () => {
          confirmationId = await confirmOurTeacher(data, (id) => {
            confirmationId = id;
          });
          await expectTestFlags(data, flags, "Po formularzu — wariant flag", true);
        });
        if (!flags.teacher) {
          await test.step("Gratisy Testowy: testowa szkoła nie blokuje utworzenia zlecenia", async () => {
            await expect
              .poll(async () => (await createdGiftOrders(data)).length, { timeout: 15000 })
              .toBeGreaterThan(0);
            await info.attach("Testowa szkoła — zlecenie nietestowego nauczyciela", {
              body: JSON.stringify({
                teacherId: data.teacherId,
                flags,
                orders: (await createdGiftOrders(data)).map(({ id, schoolId, subject }) => ({
                  id,
                  schoolId,
                  subject,
                })),
              }),
              contentType: "application/json",
            });
          });
        } else
          await test.step("Gratisy Testowy: brak utworzonego zlecenia, nie tylko zablokowane pozycje", async () => {
            const until = Date.now() + 3000;
            await expect
              .poll(
                async () => {
                  const found = (await gifts(data)).map((order) => ({
                    id: order.id,
                    subject: order.subject,
                    schoolId: order.schoolId,
                  }));
                  if (found.length)
                    await info.attach("Nieoczekiwane zlecenia dla Testowy", {
                      body: JSON.stringify({ teacherId: data.teacherId, flags, orders: found }),
                      contentType: "application/json",
                    });
                  expect(found, "Testowy ma blokować samo utworzenie zlecenia").toEqual([]);
                  return Date.now() >= until;
                },
                { timeout: 7000, intervals: [250, 500] },
              )
              .toBe(true);
            await info.attach("Testowy — brak generowania", {
              body: JSON.stringify({
                teacherId: data.teacherId,
                schoolId: data.schools[1].id,
                flags,
                orderId,
                confirmationId,
                orders: [],
              }),
              contentType: "application/json",
            });
          });
      } finally {
        await test.step("Gratisy Testowy: sprzątanie własnego przygotowania", async () => {
          if (confirmationId) await data.club.remove(data.teacherId, confirmationId);
          if (orderId && target.owned.has(orderId)) await target.remove(orderId);
          // Preserve report evidence, not an unexpected order in the shipping queue.
          for (const order of await gifts(data)) {
            const response = await data.page.context().request.delete("/api/TeacherOrder/Delete", {
              headers: await liveOctopusHeaders(data.page),
              params: { teacherOrderId: order.id },
            });
            expect(response.ok(), "Sprzątanie wyłącznie własnego niewysłanego zlecenia").toBe(true);
          }
          await expect.poll(() => gifts(data)).toEqual([]);
        });
      }
    });
  });
}

test("ORD-SPEC-35980-33: kontrola dodatnia generowania po zamówieniu zapisanym w UI, obie flagi Testowy wyłączone @school @order @copy @gift @redmine-35980", async ({
  access: data,
}, info) => {
  const target = data.orders(data.schools[1]);
  expect(await target.orders()).toEqual([]);
  expect(await gifts(data)).toEqual([]);
  let confirmationId: string | undefined;
  try {
    await test.step("Gratisy UI: szkolne zamówienie 30 F7P przy wyłączonych flagach Testowy", async () => {
      await expectTestFlags(data, { teacher: false, school: false });
      await data.scenario.app.openPanel("school", data.schools[1].id);
      await openOrders(data.page);
      const form = await openNewOrderForm(data.page);
      await addOrderProduct(form, "F7P");
      await setOrderQuantity(form, "F7P", "30");
      const responsePromise = data.page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/api/SchoolOrder/AddSchoolOrder",
      );
      const id = await saveNewOrder(data.page, form, []);
      target.owned.add(id);
      const body = (await responsePromise).request().postDataJSON() as Record<string, unknown>;
      await info.attach("Przygotowanie zamówienia przez rzeczywiste UI", {
        body: JSON.stringify({ orderId: id, keys: Object.keys(body), body }),
        contentType: "application/json",
      });
    });
    await test.step("Gratisy UI: potwierdzenie NASZ i obecność zlecenia", async () => {
      await expectTestFlags(data, { teacher: false, school: false });
      await data.scenario.app.openPanel("teacher", data.teacherId);
      const { form } = await openNewClubForm(data.page, null);
      await form.getByRole("combobox").first().click();
      await data.page.getByRole("option", { name: "Fizyka", exact: true }).click();
      await selectSchoolYear(form, TFL_CURRENT_SCHOOL_YEAR);
      await selectSchool(form, data.schools[1].name);
      await ownClass(form, "7").check();
      await disableTeacherEmail(form);
      const savedResponse = data.page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/api/TeacherFormClub",
      );
      confirmationId = await saveClubForm(data.page, form, "Fizyka");
      await info.attach("Potwierdzenie zapisane przez rzeczywiste UI", {
        body: JSON.stringify({
          confirmationId,
          body: (await savedResponse).request().postDataJSON(),
        }),
        contentType: "application/json",
      });
      await expect(
        subjectLevelRow(data.page, "Fizyka").getByRole("cell", { name: "Nasz", exact: true }),
      ).toBeVisible();
      await expectTestFlags(data, { teacher: false, school: false }, "Po formularzu UI", true);
      try {
        await expect
          .poll(async () => (await createdGiftOrders(data)).length, { timeout: 15000 })
          .toBeGreaterThan(0);
      } finally {
        await expectTestFlags(
          data,
          { teacher: false, school: false },
          "Po oczekiwaniu UI na zlecenie",
        );
      }
    });
  } finally {
    await test.step("Gratisy UI: sprzątanie własnych niewysłanych danych", async () => {
      if (confirmationId) {
        await data.scenario.app.openPanel("teacher", data.teacherId);
        await deleteClubConfirmation(data.page, confirmationId);
      }
      for (const row of await target.orders()) {
        target.owned.add(String(row.id));
        await target.remove(String(row.id));
      }
      for (const row of await gifts(data)) {
        const response = await data.page.context().request.delete("/api/TeacherOrder/Delete", {
          headers: await liveOctopusHeaders(data.page),
          params: { teacherOrderId: row.id },
        });
        expect(response.ok()).toBe(true);
      }
    });
  }
});
