import { expect } from "@playwright/test";
import {
  test,
  copyTestFor,
  copyPairPlan,
  type CopyData,
  type CopyNode,
} from "./support/order-copy";
import { deleteOrder, orderRow } from "./support/order";
import { readStructureHistory } from "./support/school-structure";
import { liveOctopusHeaders } from "./support/live-auth";
import { OCTOPUS_BASE_URL } from "./support/environment";
import type { Page } from "@playwright/test";
import { guidedApiStep } from "./support/guided-api-step";

const pairTest = copyTestFor(copyPairPlan("SP", "LO"));
const boundaryTest = copyTestFor({
  nodes: ["SP", "LO", "B", "BSP", "SOLO"],
  relations: [
    ["SP", "LO"],
    ["B", "BSP"],
  ],
});

async function rejectCopyAttempt(data: CopyData, page: Page, sourceId: string, target: CopyNode) {
  const before = await data.snapshot();
  const response = await guidedApiStep(
    "Wyślij próbę kopiowania przez API (zmienia dane na DEV)",
    async () =>
      page.context().request.post(`${OCTOPUS_BASE_URL}/api/SchoolOrder/MakeSchoolOrderCopy`, {
        headers: await liveOctopusHeaders(page),
        data: {
          institutionOrderId: Number(sourceId),
          institutionUnitIdsCopyTo: [data.structure.unit(data.schools[target])],
          createdBy: data.structure.userId,
        },
      }),
  );
  // 401/403 lub 500 nie potwierdzają walidacji reguły kopiowania dla konta uprawnionego.
  await guidedApiStep("Sprawdź odrzucenie operacji i brak zmian w dokumentach", async () => {
    await expect(async () => {
      expect(await data.snapshot(), "Odrzucona próba nie zmienia żadnego dokumentu").toEqual(
        before,
      );
    }).toPass({ timeout: 5000 });
    await data.structure.reject(response);
  });
}

pairTest(
  "ORD-SPEC-35980-05: API odrzuca kopiowanie do tej samej placówki bez zmiany dokumentów @school @order @copy @negative @redmine-35980 @redmine-37218 @step-api",
  async ({ copy: data, page }) => {
    const original = await guidedApiStep(
      "Przygotowanie danych — automatycznie",
      () => data.source("SP"),
      true,
    );
    await test.step("API: próba kopiowania oryginału SP → SP przez konto uprawnione", () =>
      rejectCopyAttempt(data, page, original.id, "SP"));
  },
);

for (const [id, target, title] of [
  ["06", "BSP", "innej struktury"],
  ["07", "SOLO", "placówki poza strukturą"],
] as const) {
  boundaryTest(
    `ORD-SPEC-35980-${id}: API odrzuca kopiowanie do ${title} @school @order @copy @negative @redmine-35980 @redmine-37217 @step-api`,
    async ({ copy: data, page }) => {
      const original = await guidedApiStep(
        "Przygotowanie danych — automatycznie",
        () => data.source("SP"),
        true,
      );
      await test.step(`API: próba ominięcia listy dozwolonych celów, SP → ${target}`, () =>
        rejectCopyAttempt(data, page, original.id, target));
    },
  );
}

test("ORD-SPEC-35980-08: API odrzuca ponowne kopiowanie kopii do trzeciej placówki @school @order @copy @negative @redmine-35980 @step-api", async ({
  copy: data,
  page,
}) => {
  const copyId = await guidedApiStep(
    "Przygotowanie danych — oryginał i pierwsza kopia, automatycznie",
    async () => {
      const original = await data.source("SP");
      return (await makeCopy(data, original.id)).LO!;
    },
    true,
  );
  await test.step("API: kopia LO → TECH, przy poprawnym celu w tej samej strukturze", () =>
    rejectCopyAttempt(data, page, copyId, "TECH"));
});

pairTest(
  "ORD-SPEC-35980-09: filtr roku ukrywa i przywraca kopię bez duplikatów, także po odświeżeniu @school @order @copy @filter @redmine-35980",
  async ({ copy: data, page }) => {
    const original = await data.source("SP");
    const copyId = (await makeCopy(data, original.id)).LO!;
    const row = (await data.apis.LO.orders()).find((item) => String(item.id) === copyId)!;
    const ownYear = row.createdAt?.slice(0, 4);
    expect(ownYear, "Kopia ma zapisaną datę utworzenia").toMatch(/^\d{4}$/);
    const panel = await data.panel("LO");
    const year = panel.getByRole("combobox").first();
    await test.step("UI: rok dokumentu pokazuje dokładnie jedną kopię", async () => {
      await year.click();
      await page.getByRole("option", { name: ownYear!, exact: true }).click();
      await expect(orderRow(panel, copyId)).toHaveCount(1);
    });
    await test.step("UI: inny rok ukrywa kopię", async () => {
      await year.click();
      const alternatives = (await page.getByRole("option").allTextContents())
        .map((text) => text.trim())
        .filter((text) => /^\d{4}$/.test(text) && text !== ownYear);
      expect(alternatives.length, "Słownik zawiera rok kontrolny").toBeGreaterThan(0);
      await page.getByRole("option", { name: alternatives[0], exact: true }).click();
      await expect(orderRow(panel, copyId)).toHaveCount(0);
    });
    await test.step("UI: powrót do właściwego roku i odświeżenie nie gubią ani nie powielają kopii", async () => {
      await year.click();
      await page.getByRole("option", { name: ownYear!, exact: true }).click();
      await expect(orderRow(panel, copyId)).toHaveCount(1);
      await page.reload();
      const refreshed = await data.panel("LO");
      await expect(orderRow(refreshed, copyId)).toHaveCount(1);
      expect(
        (await data.apis.LO.orders()).filter((item) => String(item.id) === copyId),
      ).toHaveLength(1);
    });
  },
);

async function makeCopy(data: CopyData, sourceId: string, targets: CopyNode[] = ["LO"]) {
  const before = await data.snapshot();
  await data.save(await data.open("SP", sourceId), "SP", sourceId, targets);
  const result: Partial<Record<CopyNode, string>> = {};
  for (const target of targets) {
    await expect
      .poll(
        async () =>
          (await data.apis[target].orders()).filter(
            (row) => !before[target].some((old) => old.id === row.id),
          ).length,
      )
      .toBe(1);
    const row = (await data.apis[target].orders()).find(
      (row) => !before[target].some((old) => old.id === row.id),
    )!;
    expect(row.isCopied).toBe(true);
    expect(String(row.id)).not.toBe(sourceId);
    result[target] = String(row.id);
  }
  return result;
}

pairTest(
  "ORD-SPEC-35980-10: filtr przedmiotu rozróżnia kopie i nie zmienia dokumentów @school @order @copy @filter @redmine-35980",
  async ({ copy: data }) => {
    const physics = await data.apis.SP.product("F7P", [7]);
    const mathematics = await data.apis.SP.product("4P-2", [4]);
    const physicsSource = await data.apis.SP.save([{ product: physics, quantity: 3 }]);
    const mathSource = await data.apis.SP.save([{ product: mathematics, quantity: 2 }]);
    const physicsCopy = (await makeCopy(data, physicsSource)).LO!;
    const mathCopy = (await makeCopy(data, mathSource)).LO!;
    const before = await data.snapshot();
    const panel = await data.panel("LO");
    const subject = panel.getByRole("textbox", { name: "wpisz", exact: true });
    await test.step("UI: FIZ pokazuje wyłącznie kopię fizyki", async () => {
      await subject.fill("FIZ");
      await expect(orderRow(panel, physicsCopy)).toHaveCount(1);
      await expect(orderRow(panel, mathCopy)).toHaveCount(0);
    });
    await test.step("UI: MAT pokazuje wyłącznie kopię matematyki", async () => {
      await subject.fill("MAT");
      await expect(orderRow(panel, physicsCopy)).toHaveCount(0);
      await expect(orderRow(panel, mathCopy)).toHaveCount(1);
    });
    await test.step("UI: wyczyszczenie filtra przywraca obie kopie bez duplikatów", async () => {
      await subject.fill("");
      await expect(orderRow(panel, physicsCopy)).toHaveCount(1);
      await expect(orderRow(panel, mathCopy)).toHaveCount(1);
      expect(await data.snapshot()).toEqual(before);
    });
  },
);

pairTest(
  "ORD-SPEC-35980-01: kopie dwóch źródeł mają odrębne ID i symbol, a zmiana źródła nie przenika do obcej kopii @school @order @copy @isolation @redmine-35980",
  async ({ copy: data }, info) => {
    const first = await data.source("SP");
    const second = await data.source("SP");
    const a = (await makeCopy(data, first.id)).LO!;
    const b = (await makeCopy(data, second.id)).LO!;
    expect(new Set([first.id, second.id, a, b]).size).toBe(4);
    const source = (await data.apis.SP.orders()).find((row) => String(row.id) === first.id)!;
    const symbol = source.salesOrderSymbol || source.cmsOrderSymbol;
    expect(symbol, "Źródło ma niepusty symbol dokumentu").toBeTruthy();
    const target = await data.panel("LO");
    await test.step("Prezentacja: lista zawiera symbol źródła z oznaczeniem - kopia", async () => {
      await expect(orderRow(target, a)).toContainText(`${symbol} - kopia`);
    });
    const untouched = (await data.apis.LO.orders()).find((row) => String(row.id) === b)!;
    const changed = [{ ...first.lines[0], quantity: 9 }, first.lines[1]];
    await test.step("Powiązanie z jednym źródłem: zmiana pierwszego oryginału aktualizuje tylko jego kopię", async () => {
      await data.apis.SP.save(changed, first.id);
      await expect
        .poll(async () => {
          const row = (await data.apis.LO.orders()).find((item) => String(item.id) === a);
          return row?.orderItems
            .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
            .sort((x, y) => x.id - y.id);
        })
        .toEqual(
          changed
            .map((line) => ({ id: line.product.id, quantity: line.quantity }))
            .sort((x, y) => x.id - y.id),
        );
      expect((await data.apis.LO.orders()).find((row) => String(row.id) === b)).toEqual(untouched);
    });
    await info.attach("35980 — dowód izolacji źródeł", {
      body: JSON.stringify({
        sourceIds: [first.id, second.id],
        copyIds: [a, b],
        symbol,
        note: "Powiązanie sprawdzone behawioralnie przez propagację zmian; bez odczytu klucza obcego w SQL.",
      }),
      contentType: "application/json",
    });
  },
);

pairTest(
  "ORD-SPEC-35980-02: błędną kopię można usunąć i utworzyć ponownie bez zmiany oryginału @school @order @copy @recreate @redmine-35980",
  async ({ copy: data, page }, info) => {
    const original = await data.source("SP");
    const before = (await data.apis.SP.orders()).find((row) => String(row.id) === original.id)!;
    const oldCopy = (await makeCopy(data, original.id)).LO!;
    await test.step("UI: usunięcie wyłącznie własnej kopii", async () => {
      await data.panel("LO");
      expect(await deleteOrder(page, oldCopy)).toBe("DELETED");
      await expect
        .poll(async () => (await data.apis.LO.orders()).some((row) => String(row.id) === oldCopy))
        .toBe(false);
    });
    const newCopy = (await makeCopy(data, original.id)).LO!;
    await test.step("Ponowne kopiowanie: jedna aktywna kopia, własne ID, właściwe pozycje i niezmieniony oryginał", async () => {
      // Specyfikacja wymaga ID odrębnego od źródła, ale nie zabrania reaktywacji logicznie usuniętej kopii.
      expect(newCopy).not.toBe(original.id);
      const rows = await data.apis.LO.orders();
      expect(rows.filter((row) => String(row.id) === newCopy)).toHaveLength(1);
      expect(
        rows
          .find((row) => String(row.id) === newCopy)
          ?.orderItems.map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
          .sort((a, b) => a.id - b.id),
      ).toEqual(
        before.orderItems
          .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
          .sort((a, b) => a.id - b.id),
      );
      expect((await data.apis.SP.orders()).find((row) => String(row.id) === original.id)).toEqual(
        before,
      );
    });
    await info.attach("35980 — ponowne utworzenie kopii", {
      body: JSON.stringify({
        sourceId: original.id,
        oldCopy,
        newCopy,
        reactivated: oldCopy === newCopy,
      }),
      contentType: "application/json",
    });
  },
);

test("ORD-SPEC-35980-03: usunięcie oryginału usuwa jego kopie we wszystkich celach, bez obcych dokumentów @school @order @copy @cascade @redmine-35980", async ({
  copy: data,
}, info) => {
  const original = await data.source("SP");
  const control = await data.source("SP");
  const copies = await makeCopy(data, original.id, ["LO", "TECH"]);
  await makeCopy(data, control.id, ["LO"]);
  const before = await data.snapshot();
  await test.step("Usunięcie własnego oryginału przez API i porównanie wszystkich placówek", async () => {
    await data.apis.SP.remove(original.id);
    for (const node of data.nodes) {
      const removed = [original.id, ...Object.values(copies)];
      await expect
        .poll(() => data.apis[node].orders(), {
          message: `Kaskada w ${node}: znikają tylko oryginał i jego kopie`,
        })
        .toEqual(before[node].filter((row) => !removed.includes(String(row.id))));
    }
  });
  for (const node of ["LO", "TECH"] as const) {
    const panel = await data.panel(node);
    await expect(orderRow(panel, copies[node]!)).toHaveCount(0);
  }
  await info.attach("35980 — kaskada usunięcia", {
    body: JSON.stringify({ originalId: original.id, copies, controlId: control.id }),
    contentType: "application/json",
  });
});

pairTest(
  "ORD-SPEC-35980-04: odłączenie placówki usuwa kopię, zachowuje oryginał i lokalne zamówienie @school @order @copy @structure @redmine-35980",
  async ({ copy: data, scenario }, info) => {
    const original = await data.source("SP");
    const control = await data.source("LO");
    const copyId = (await makeCopy(data, original.id)).LO!;
    const before = await data.snapshot();
    // Po odłączeniu poprawnie zmieniają się metadane relacji placówki, nie treść dokumentów.
    const documents = (rows: typeof before.LO) =>
      rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).filter(([key]) => key !== "institutionAllRelationInformation"),
        ),
      );
    const historyBefore = await readStructureHistory(scenario.app, data.schools.LO);
    await test.step("Usunięcie tylko własnej relacji SP → LO i sprawdzenie skutków", async () => {
      await data.unlink("SP", "LO");
      await expect
        .poll(async () => documents(await data.apis.LO.orders()))
        .toEqual(documents(before.LO.filter((row) => String(row.id) !== copyId)));
      expect(documents(await data.apis.SP.orders())).toEqual(documents(before.SP));
      expect((await data.apis.LO.orders()).some((row) => String(row.id) === control.id)).toBe(true);
    });
    const historyAfter = await readStructureHistory(scenario.app, data.schools.LO);
    await test.step("Audyt: nowy wpis identyfikuje usuniętą kopię i datę, nie tylko zmianę relacji", async () => {
      const old = new Set(historyBefore.data.map((entry) => JSON.stringify(entry)));
      const id = new RegExp(`(?:^|\\D)${copyId}(?:\\D|$)`);
      const events = historyAfter.data.filter((entry) => {
        const text = `${entry.field} ${entry.value}`;
        return (
          !old.has(JSON.stringify(entry)) &&
          id.test(entry.value) &&
          /usun|usuni|delete/i.test(text) &&
          /kopi|dokument|zamów/i.test(text)
        );
      });
      expect(
        events.length,
        `Historia musi zawierać osobny audyt usunięcia kopii ${copyId}`,
      ).toBeGreaterThan(0);
      for (const entry of events) {
        expect(Number.isFinite(Date.parse(entry.date))).toBe(true);
        expect(entry.field.trim()).not.toBe("");
        expect(entry.author.trim()).not.toBe("");
      }
    });
    await info.attach("35980 — odłączenie i historia do oceny", {
      body: JSON.stringify({
        originalId: original.id,
        copyId,
        controlId: control.id,
        historyBefore,
        historyAfter,
        note: "Automat sprawdza skutki odłączenia i nowy wpis o usunięciu kopii z jej ID, datą i autorem. Sam wpis o usunięciu relacji nie wystarcza.",
      }),
      contentType: "application/json",
    });
  },
);
