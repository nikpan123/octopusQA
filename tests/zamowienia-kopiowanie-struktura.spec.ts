import { expect } from "@playwright/test";
import {
  test,
  copyTestFor,
  copyPairPlan,
  ISOLATION_COPY_PLAN,
  STANDALONE_COPY_PLAN,
  copyTargetRow,
  expectCopy,
  type CopyNode,
} from "./support/order-copy";
import { orderRow } from "./support/order";
import { openOrders } from "./support/order";
import { noSchoolEditSession } from "../scripts/no-school-edit-auth.mjs";
import { restoreSession } from "../scripts/auth.mjs";
import { liveOctopusHeaders } from "./support/live-auth";

const directions: Array<[CopyNode, CopyNode]> = [
  ["A", "SP"],
  ["A", "LO"],
  ["A", "TECH"],
  ["LO", "A"],
  ["LO", "SP"],
  ["LO", "TECH"],
  ["TECH", "LO"],
  ["SP", "A"],
  ["SP", "LO"],
  ["SP", "TECH"],
  ["TECH", "A"],
  ["TECH", "SP"],
];
const pairTest = copyTestFor(copyPairPlan("SP", "LO"));
const isolationTest = copyTestFor(ISOLATION_COPY_PLAN);
const standaloneTest = copyTestFor(STANDALONE_COPY_PLAN);
test.describe("Kopiowanie dokumentów w strukturze — Redmine 37160", () => {
  test.beforeEach(async ({}, info) => {
    test.setTimeout(240000);
    info.annotations.push(
      { type: "redmine", description: "37160" },
      { type: "scenario", description: info.title.split(":")[0] },
    );
  });
  for (const [index, [source, target]] of directions.entries()) {
    test(`ORD-COPY-${String(index + 1).padStart(2, "0")}: ${source} → ${target}, kopia w tej samej strukturze @school @order @copy @redmine-37160`, async ({
      copy: data,
    }) => {
      const { id } = await data.source(source);
      const before = await data.snapshot();
      const dialog =
        await test.step("UI: otwarcie kopiowania i pełny zbiór trzech pozostałych placówek struktury A", () =>
          data.open(source, id));
      await test.step("UI: lista celów zawiera wyłącznie trzy pozostałe placówki struktury A", async () => {
        for (const node of ["A", "SP", "LO", "TECH"] as CopyNode[])
          await expect(copyTargetRow(dialog, data.schools[node])).toHaveCount(
            node === source ? 0 : 1,
          );
      });
      await data.save(dialog, source, id, [target]);
      await expectCopy(data, before, source, id, [target]);
      const added = (await data.apis[target].orders()).find(
        (row) => !before[target].some((old) => old.id === row.id),
      )!;
      await test.step("UI: kopia jest widoczna w placówce docelowej po ponownym wejściu", async () =>
        expect(orderRow(await data.panel(target), String(added.id))).toBeVisible());
    });
  }
  for (const [id, forbidden] of [
    ["13", ["SP"]],
    ["14", ["B", "BSP", "SOLO"]],
  ] as const) {
    const caseTest = id === "14" ? isolationTest : pairTest;
    caseTest(
      `ORD-COPY-${id}: ${id === "13" ? "placówka źródłowa" : "inna struktura i placówka samodzielna"} jest niedostępna jako cel @school @order @copy @negative @redmine-37160`,
      async ({ copy: data }) => {
        const source = await data.source("SP");
        const before = await data.snapshot();
        const dialog = await test.step("UI: otwarcie listy celów oryginału SP", () =>
          data.open("SP", source.id));
        await test.step("UI: lista zawiera cel kontrolny i wyklucza niedozwolone placówki", async () => {
          await expect(
            copyTargetRow(dialog, data.schools.LO),
            "Istnieje poprawny cel kontrolny",
          ).toHaveCount(1);
          for (const node of forbidden)
            await expect(copyTargetRow(dialog, data.schools[node])).toHaveCount(0);
        });
        await test.step("UI: anulowanie kopiowania pozostawia wszystkie dokumenty bez zmian", async () => {
          await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
          expect(await data.snapshot()).toEqual(before);
        });
      },
    );
  }
  pairTest(
    "ORD-COPY-15: dokument będący kopią nie może być kopiowany dalej @school @order @copy @negative @redmine-37160",
    async ({ copy: data }) => {
      const { id } = await data.source("SP");
      const before = await data.snapshot();
      await data.save(await data.open("SP", id), "SP", id, ["LO"]);
      await expectCopy(data, before, "SP", id, ["LO"]);
      const copy = (await data.apis.LO.orders()).find(
        (row) => !before.LO.some((old) => old.id === row.id),
      )!;
      const panel =
        await test.step("UI: otwarcie odbiorcy i zaznaczenie utworzonej kopii", async () => {
          const panel = await data.panel("LO");
          await orderRow(panel, String(copy.id)).click();
          return panel;
        });
      await test.step("UI: zaznaczona kopia ma zablokowany przycisk Kopiuj", async () => {
        await expect(panel.getByRole("button", { name: "Kopiuj", exact: true })).toBeDisabled();
      });
    },
  );
  pairTest(
    "ORD-COPY-16: pusty wybór blokuje zapis, anulowanie wybranego celu niczego nie kopiuje @school @order @copy @cancel @redmine-37160",
    async ({ copy: data }) => {
      const { id } = await data.source("SP");
      const before = await data.snapshot();
      const dialog = await test.step("UI: otwarcie kopiowania bez zaznaczonego celu", () =>
        data.open("SP", id));
      await test.step("UI: pusty wybór blokuje Zapisz", async () => {
        await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeDisabled();
      });
      await test.step("UI: dodanie celu odblokowuje Zapisz, ale operacja zostaje anulowana", async () => {
        await copyTargetRow(dialog, data.schools.LO).getByRole("gridcell").first().click();
        await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeEnabled();
        await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
      });
      await test.step("API: po anulowaniu wszystkie dokumenty pozostają bez zmian", async () => {
        expect(await data.snapshot()).toEqual(before);
      });
    },
  );
  test("ORD-COPY-17: jednoczesna kopia do trzech placówek nie tworzy duplikatów @school @order @copy @multiple @redmine-37160", async ({
    copy: data,
  }) => {
    const { id } = await data.source("SP");
    const before = await data.snapshot();
    await data.save(await data.open("SP", id), "SP", id, ["A", "LO", "TECH"]);
    await expectCopy(data, before, "SP", id, ["A", "LO", "TECH"]);
  });
  standaloneTest(
    "ORD-COPY-18: placówka bez struktury nie ma funkcji kopiowania @school @order @copy @negative @redmine-37160",
    async ({ copy: data }) => {
      const { id } = await data.source("SOLO");
      const panel = await test.step("UI: otwarcie oryginału placówki samodzielnej", async () => {
        const panel = await data.panel("SOLO");
        await orderRow(panel, id).click();
        return panel;
      });
      await test.step("UI: placówka samodzielna nie ma przycisku Kopiuj", async () => {
        await expect(panel.getByRole("button", { name: "Kopiuj", exact: true })).toHaveCount(0);
      });
    },
  );
  pairTest(
    "ORD-COPY-19: konto bez prawa edycji szkoły nie może kopiować dokumentów @school @order @copy @permissions @redmine-37160",
    async ({ copy: data, browser }) => {
      const account =
        await test.step("Logowanie osobnego konta bez School.EDIT, bez zastępowania sesji głównej", () =>
          noSchoolEditSession());
      expect(account.userId, "Konto ograniczone musi być inne niż konto przygotowania").not.toBe(
        data.structure.userId,
      );
      const { id } = await data.source("SP");
      const before = await data.snapshot();
      const allowed = await data.open("SP", id);
      await allowed.getByRole("button", { name: "Anuluj", exact: true }).click();
      const context = await browser.newContext({ storageState: account.storageState });
      try {
        await restoreSession(context, account.session);
        const page = await context.newPage();
        // Konto tylko do odczytu nie ma przycisku „Edycja danych”.
        const panel =
          await test.step("UI: konto ograniczone odczytuje oryginał we właściwej placówce", async () => {
            await page.goto(`/school/school-panel/${data.schools.SP.id}`, {
              waitUntil: "domcontentloaded",
            });
            await expect(
              page.getByRole("heading", { name: "Dane podstawowe szkoły", exact: true }),
            ).toBeVisible();
            await expect(
              page
                .locator(".info-row")
                .filter({ has: page.getByText("ID", { exact: true }) })
                .locator('input[type="text"]'),
              "Konto ograniczone odczytuje właściwą szkołę bez wymagania prawa edycji",
            ).toHaveValue(data.schools.SP.id);
            const panel = await openOrders(page);
            const row = orderRow(panel, id);
            await expect(
              row,
              "Ograniczone konto musi móc odczytać przygotowany oryginał",
            ).toBeVisible();
            await row.click();
            return panel;
          });
        const copy = panel.getByRole("button", { name: "Kopiuj", exact: true });
        await test.step("UI: konto ograniczone nie może uruchomić kopiowania oryginału", async () => {
          if (await copy.isVisible()) await expect(copy).toBeDisabled();
          else await expect(copy).toBeHidden();
        });
        await test.step("API: serwer odrzuca kopiowanie przez zalogowane konto ograniczone kodem 403", async () => {
          const response = await context.request.post(
            new URL("/api/SchoolOrder/MakeSchoolOrderCopy", page.url()).href,
            {
              headers: await liveOctopusHeaders(page),
              data: {
                institutionOrderId: Number(id),
                institutionUnitIdsCopyTo: [data.structure.unit(data.schools.LO)],
                createdBy: account.userId,
              },
            },
          );
          expect(
            response.status(),
            "Odmowa uprawnień, nie błąd logowania, walidacji ani serwera",
          ).toBe(403);
        });
        expect(
          await data.snapshot(),
          "Odrzucona próba nie tworzy kopii ani nie zmienia oryginału",
        ).toEqual(before);
      } finally {
        await context.close();
      }
    },
  );
});
