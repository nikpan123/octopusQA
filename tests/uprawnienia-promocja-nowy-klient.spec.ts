import { test } from "./support/entitlements";
import { OCTOPUS_ENV } from "./support/environment";
import type { ClassLine } from "./support/order-class";
import {
  preparePromotion,
  previousConfirmation,
  promotionThreshold,
  expectPromotion,
  prepareNewClientHistory,
} from "./support/promotions";

// Osobne szkoły per przypadek: status klienta jest własnością szkoły/przedmiotu,
// a nie świeżo utworzonego nauczyciela. Wszystkie rekordy są bez flagi Testowy.
const cases = [
  {
    id: "01",
    title: "zamówienie klasy 4 na progu rozszerza dostęp do 4–6",
    quantity: 0,
    expected: [4, 5, 6],
  },
  {
    id: "02",
    title: "zamówienie poniżej progu nie uruchamia promocji",
    quantity: -1,
    expected: [],
  },
  {
    id: "03",
    title: "zamówienie powyżej progu rozszerza dostęp do 4–6",
    quantity: 1,
    expected: [4, 5, 6],
  },
  {
    id: "04",
    title: "zamówienia poniżej progu w obu poprzednich latach nie wykluczają nowego klienta",
    quantity: 0,
    expected: [4, 5, 6],
    historical: true,
  },
] as const;

for (const item of cases) {
  test.describe(`Nowy klient — ${item.id}`, () => {
    test.skip(
      "historical" in item && OCTOPUS_ENV !== "dev",
      "NCL-04: zmiana dat własnych zamówień w bazie jest dostępna wyłącznie na DEV.",
    );
    test.use({
      accessTestFlags: { teacher: false, school: false },
      accessSchoolKey: `PROMO_NCL_${item.id}_`,
    });
    test(`NCL-${item.id}: ${item.title} @teacher @entitlement @promotion @new-client`, async ({
      access: data,
    }) => {
      test.setTimeout(240000);
      await preparePromotion(data);
      // Znany nauczyciel, nowy klient-szkoła: debiut nauczyciela nie może
      // zamaskować promocji zamówieniowej, także podczas okna letniego.
      await previousConfirmation(data);
      const record = await test.step("Przygotowanie: aktywne potwierdzenie na bieżący rok", () =>
        data.create());
      const threshold = await promotionThreshold(data, record);
      if ("historical" in item) {
        await prepareNewClientHistory(data);
        await expectPromotion(data, record, []);
      }
      const api = data.orders();
      const product = await api.product("4P-2", [4]);
      await test.step(`Akcja: zakup ${threshold + item.quantity} sztuk przy progu ${threshold}`, () =>
        api.save([{ product, quantity: threshold + item.quantity }]));
      await expectPromotion(data, record, [...item.expected]);
    });
  });
}

for (const [id, title, codes, expected] of [
  ["05", "klasa 7 rozszerza dostęp tylko do 7–8", ["7Pv"], [7, 8]],
  ["06", "zakup w obu zakresach daje sumę 4–8", ["4P-2", "7Pv"], [4, 5, 6, 7, 8]],
] as const) {
  test.describe(`Zakres nowego klienta — ${id}`, () => {
    test.use({
      accessTestFlags: { teacher: false, school: false },
      accessSchoolKey: `PROMO_NCL_${id}_`,
    });
    test(`NCL-${id}: ${title} @teacher @entitlement @promotion @new-client @ranges`, async ({
      access: data,
    }) => {
      test.setTimeout(240000);
      await preparePromotion(data);
      await previousConfirmation(data);
      const record = await data.create();
      const threshold = await promotionThreshold(data, record);
      const api = data.orders();
      const lines: ClassLine[] = [];
      for (const code of codes)
        lines.push({
          product: await api.product(code, [code === "7Pv" ? 7 : 4]),
          quantity: threshold,
        });
      await test.step("Akcja: zapis kwalifikujących zakupów z wybranych zakresów", () =>
        api.save(lines));
      await expectPromotion(data, record, [...expected]);
    });
  });
}

for (const action of ["korekta", "usunięcie"] as const) {
  const id = action === "korekta" ? "07" : "08";
  test.describe(`Wycofanie promocji — ${id}`, () => {
    test.use({
      accessTestFlags: { teacher: false, school: false },
      accessSchoolKey: `PROMO_NCL_${id}_`,
    });
    test(`NCL-${id}: ${action} zakupu odbiera promocję bez pozostawienia klas 5–6 @teacher @entitlement @promotion @new-client @recalculation`, async ({
      access: data,
    }) => {
      test.setTimeout(240000);
      await preparePromotion(data);
      await previousConfirmation(data);
      const record = await data.create();
      const threshold = await promotionThreshold(data, record);
      const api = data.orders();
      const product = await api.product("4P-2", [4]);
      const orderId = await api.save([{ product, quantity: threshold }]);
      await expectPromotion(data, record, [4, 5, 6]);
      await test.step(`Akcja: ${action} własnego kwalifikującego zamówienia`, async () => {
        if (action === "korekta") await api.save([{ product, quantity: threshold - 1 }], orderId);
        else await api.remove(orderId);
      });
      await expectPromotion(data, record, []);
    });
  });
}
