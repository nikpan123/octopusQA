import { test, expect } from "./support/shared-school";
import { guidedUiStep } from "./support/guided-ui-step";
import { Octopus } from "./support/octopus";
import { medalInput } from "./support/school-medal";
import {
  schoolSearchForm,
  applySearchCriteria,
  submitSchoolSearch,
  expectEmptySchoolSearch,
} from "./support/school-search-filters";

const cases = [
  {
    id: "MED-BUG-37204-01",
    title: "Medal Brak zwraca szkołę testową",
    medals: ["Brak"],
    included: true,
  },
  {
    id: "MED-BUG-37204-02",
    title: "Brak lub Złoto działa jako OR",
    medals: ["Brak", "Złoto"],
    included: true,
  },
  {
    id: "MED-BUG-37204-03",
    title: "Złoto wyklucza szkołę z medalem Brak",
    medals: ["Złoto"],
    included: false,
  },
  {
    id: "MED-BUG-37204-04",
    title: "wyczyszczenie filtra medalu przywraca szkołę",
    medals: ["Złoto"],
    included: true,
    clear: true,
  },
];

test.describe("Redmine #37204 — filtrowanie po medalu Brak", () => {
  for (const scenario of cases) {
    test(`${scenario.id}: ${scenario.title} @school @medal @regression @redmine-37204 @step-ui`, async ({
      page,
      school,
    }, info) => {
      const schoolId = school.id;
      info.annotations.push({
        type: "Redmine",
        description: "https://redmine.gwo.pl/issues/37204",
      });
      const evidence: Record<string, unknown> = {
        issue: 37204,
        scenario: scenario.id,
        schoolId,
        medals: scenario.medals,
        clear: scenario.clear ?? false,
      };
      try {
        const app = new Octopus(page);
        let target: {
          id: number | string;
          name: string;
          city: string;
          informationAboutMedalCategory?: { medalCategoryName?: string };
        };
        await guidedUiStep(
          "Warunek wstępny: szkoła testowa istnieje, a API i profil pokazują medal Brak",
          async () => {
            const responsePromise = page.waitForResponse((response) => {
              if (response.request().method() !== "GET") return false;
              const url = new URL(response.url());
              if (url.pathname !== "/api/InstitutionBrowser/GetInstitutions") return false;
              try {
                return JSON.parse(url.searchParams.get("filterModel") || "{}")
                  .institutionIds?.map(String)
                  .includes(schoolId);
              } catch {
                return false;
              }
            });
            await app.openPanel("school", schoolId);
            const response = await responsePromise;
            expect(response.ok()).toBe(true);
            const data = await response.json();
            target = data.data?.find(
              (school: { id: number | string }) => String(school.id) === schoolId,
            );
            expect(
              target,
              "Brak szkoły zgłoszenia — nie można potwierdzić reprodukcji",
            ).toBeTruthy();
            evidence.baseline = {
              id: target.id,
              name: target.name,
              city: target.city,
              medal: target.informationAboutMedalCategory?.medalCategoryName,
            };
            expect(target.name.trim()).not.toBe("");
            expect(target.city.trim()).not.toBe("");
            expect(
              target.informationAboutMedalCategory?.medalCategoryName,
              "Zmiana danych szkoły oznacza niespełniony warunek testu",
            ).toBe("Brak");
            await expect(medalInput(page)).toHaveValue("Brak");
          },
        );
        await guidedUiStep(
          "Kontrola bez medalu: nazwa i miejscowość zwracają szkołę zgłoszenia",
          async () => {
            const form = await schoolSearchForm(app);
            await applySearchCriteria(app, form, { name: target.name, city: target.city });
            const result = await submitSchoolSearch(app, form);
            evidence.unfilteredIds = result.ids;
            expect(result.ids).toContain(schoolId);
          },
        );
        await guidedUiStep(
          "Wyszukiwanie według nazwy i miejscowości z wybranym filtrem medalu",
          async () => {
            const form = await schoolSearchForm(app);
            await applySearchCriteria(app, form, {
              name: target.name,
              city: target.city,
              medals: scenario.medals,
            });
            if (scenario.clear) await form.locator('[data-cy="medal-clear"]').click();
            const result = await submitSchoolSearch(app, form);
            evidence.filter = {
              name: result.model.name,
              cityPost: result.model.cityPost,
              medal: result.model.medal,
              institutionIds: result.model.institutionIds,
            };
            evidence.results = result.schools.map((school) => ({
              id: school.id,
              name: school.name,
              medal: school.informationAboutMedalCategory?.medalCategoryName,
            }));
            expect(
              result.model.institutionIds ?? [],
              "Wyszukiwanie musi korzystać z nazwy i miejscowości, bez ograniczenia ID",
            ).toHaveLength(0);
            expect(result.model.medal ?? []).toHaveLength(
              scenario.clear ? 0 : scenario.medals.length,
            );
            if (scenario.included) {
              expect(
                result.ids,
                "Szkoła testowa z medalem Brak powinna występować w wynikach",
              ).toContain(schoolId);
              await expect(
                app
                  .results("school")
                  .locator('[role="gridcell"][col-id="id"]')
                  .filter({ hasText: new RegExp(`^${schoolId}$`) }),
              ).toBeVisible();
            } else {
              expect(result.ids).not.toContain(schoolId);
              if (result.ids.length === 0) await expectEmptySchoolSearch(app);
            }
            if (!scenario.clear) {
              for (const school of result.schools)
                expect(
                  scenario.medals,
                  `Niedozwolony medal w wynikach szkoły ${school.id}`,
                ).toContain(school.informationAboutMedalCategory?.medalCategoryName);
            }
          },
        );
      } finally {
        await info.attach("37204-wyniki.json", {
          body: Buffer.from(JSON.stringify(evidence, null, 2)),
          contentType: "application/json",
        });
        if (!page.isClosed())
          await info.attach("37204-ekran.png", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
      }
    });
  }
});
