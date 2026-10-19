import { test } from "./support/entitlements";
import {
  afterDebutWindow,
  debutWindow,
  promotionCalendarYear,
  preparePromotion,
  previousConfirmation,
  promotionThreshold,
  expectPromotion,
} from "./support/promotions";

for (const [id, subject, declared, expected, scope] of [
  ["01", "Matematyka", ["4"], [4, 5, 6, 7, 8], 4],
  ["02", "Fizyka", ["7"], [7, 8], 4],
  ["03", "Fizyka", ["7 TNŚ"], [7, 8], 18],
] as const) {
  test.describe(`Debiut — deklaracja ${id}`, () => {
    test.skip(
      !debutWindow,
      "Wymagane rzeczywiste okno otwarcia formularzy–30 września i OCTOPUS_CLUB_FORMS_OPEN_DATE",
    );
    test.use({
      accessTestFlags: { teacher: false, school: false },
      accessSchoolKey: `PROMO_DEB_${id}_`,
    });
    test(`DEB-${id}: pierwsze potwierdzenie ${subject} ${declared} daje pełny zakres właściwej serii bez zamówień @teacher @entitlement @promotion @debut @seasonal`, async ({
      access: data,
    }) => {
      test.setTimeout(240000);
      await preparePromotion(data);
      const record =
        await test.step("Akcja: pierwsze aktywne potwierdzenie naszego wydawnictwa", () =>
          data.create(subject, [...declared]));
      await expectPromotion(data, record, [...expected], scope);
    });
  });
}

test.describe("Debiut — poprzednio obcy", () => {
  test.skip(!debutWindow, "Wymagany rzeczywisty okres debiutu i data otwarcia formularzy");
  test.use({
    accessTestFlags: { teacher: false, school: false },
    accessSchoolKey: "PROMO_DEB_04_",
  });
  test("DEB-04: poprzedni rok obcy i obecny nasz uruchamiają debiut bez zakupów @teacher @entitlement @promotion @debut @seasonal", async ({
    access: data,
  }) => {
    test.setTimeout(240000);
    await preparePromotion(data);
    await previousConfirmation(data, false);
    const record = await data.create();
    await expectPromotion(data, record, [4, 5, 6, 7, 8]);
  });
});

test.describe("Debiut — niezależność przedmiotów", () => {
  test.skip(!debutWindow, "Wymagany rzeczywisty okres debiutu i data otwarcia formularzy");
  test.use({
    accessTestFlags: { teacher: false, school: false },
    accessSchoolKey: "PROMO_DEB_07_",
  });
  test("DEB-07: znany nauczyciel matematyki może debiutować z fizyki @teacher @entitlement @promotion @debut @isolation @seasonal", async ({
    access: data,
  }) => {
    test.setTimeout(240000);
    await preparePromotion(data);
    await previousConfirmation(data);
    const math = await data.create();
    await expectPromotion(data, math, []);
    const physics = await data.create("Fizyka", ["7"]);
    await expectPromotion(data, physics, [7, 8]);
  });
});

test.describe("Debiut — powrót do kwalifikacji zamówieniowej", () => {
  test.skip(!afterDebutWindow, "Przypadek wymaga rzeczywistej daty od 1 października");
  test.use({
    accessTestFlags: { teacher: false, school: false },
    accessSchoolKey: "PROMO_DEB_08_",
  });
  test("DEB-08: po 30 września zakup klasy 4 daje zakres zamówieniowy 4–6 zamiast debiutu 4–8 @teacher @entitlement @promotion @debut @seasonal", async ({
    access: data,
  }) => {
    test.setTimeout(240000);
    await preparePromotion(data);
    const record = await data.create();
    await expectPromotion(data, record, []);
    const threshold = await promotionThreshold(data, record);
    const api = data.orders();
    const product = await api.product("4P-2", [4]);
    await test.step("Akcja: kwalifikujące zamówienie po zakończeniu okresu debiutu", () =>
      api.save([{ product, quantity: threshold }]));
    await expectPromotion(data, record, [4, 5, 6]);
  });
});

test.describe("Debiut — rozpoznawanie per przedmiot", () => {
  test.skip(!debutWindow, "Wymagany rzeczywisty okres debiutu i data otwarcia formularzy");
  test.use({
    accessTestFlags: { teacher: false, school: false },
    accessSchoolKey: "PROMO_DEB_05_",
  });
  test("DEB-05: wcześniejsze nasze potwierdzenie matematyki wyklucza debiut z matematyki @teacher @entitlement @promotion @debut @negative @seasonal", async ({
    access: data,
  }) => {
    test.setTimeout(240000);
    await preparePromotion(data);
    await previousConfirmation(data);
    const record = await data.create();
    await expectPromotion(data, record, []);
  });
});

test.describe("Debiut — wygaśnięcie okresu", () => {
  test.skip(
    !afterDebutWindow,
    `Przypadek przeznaczony na 1 października–31 grudnia ${promotionCalendarYear}`,
  );
  test.use({
    accessTestFlags: { teacher: false, school: false },
    accessSchoolKey: "PROMO_DEB_06_",
  });
  test("DEB-06: od 1 października pierwsze potwierdzenie bez zamówień nie daje promocji debiutu @teacher @entitlement @promotion @debut @negative @seasonal", async ({
    access: data,
  }) => {
    test.setTimeout(240000);
    await preparePromotion(data);
    const record = await data.create();
    await expectPromotion(data, record, []);
  });
});
