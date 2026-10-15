import { expect, type Locator, type Page } from "@playwright/test";
import { Octopus, typeValue } from "./octopus";
import { schoolPanelTextField } from "./school-add";
import {
  openSchoolSioForm,
  schoolSioInput,
  saveSchoolSioEdit,
  openSchoolEditForm,
  cancelSchoolEdit,
} from "./school-edit";

export type SchoolCategory = "A" | "B" | "C" | "D";
export type CategorySchool = { id: string; name: string };

export function categoryDetails(page: Page) {
  return page
    .getByRole("heading", { name: "Dane podstawowe szkoły", exact: true })
    .locator("xpath=ancestor::*[.//input][1]");
}

export const categoryInput = (page: Page) =>
  schoolPanelTextField(categoryDetails(page), "Kategoria");
export const studentCountInput = (page: Page) =>
  schoolPanelTextField(categoryDetails(page), "Liczba uczniów");

export async function expectNpcSchoolIdentity(app: Octopus) {
  await expect(app.detail("level")).toHaveValue("Szkoła Podstawowa");
  const form = await openSchoolEditForm(app.page);
  const type = schoolPanelTextField(form, "Typ szkoły");
  const level = schoolPanelTextField(form, "Poziom szkoły");
  await expect(type).toBeDisabled();
  await expect(type).toHaveValue("Szkoła NPC");
  await expect(level).toBeDisabled();
  await expect(level).toHaveValue("Szkoła Podstawowa");
  // Otwieramy edycję tylko do odczytu typu, bez zapisu lub zmiany danych.
  await cancelSchoolEdit(form);
}

export async function searchCategorySchools(
  app: Octopus,
  criteria: { id?: string; name?: string },
) {
  await app.openPanel("school");
  const search = await app.openSearch("school");
  // Formularz może pamiętać poprzednie kryteria; każdy test zaczyna od czystego wyszukiwania.
  for (const input of await search
    .locator('input:not([type="checkbox"]):not([readonly]):not([disabled])')
    .all())
    await typeValue(input, "");
  if (criteria.id) await typeValue(app.field(search, "ID szkoły"), criteria.id);
  if (criteria.name) await typeValue(app.field(search, "Nazwa szkoły"), criteria.name);
  const responsePromise = app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === "/api/InstitutionBrowser/GetInstitutions",
  );
  await search.getByRole("button", { name: "Szukaj", exact: true }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  await response.finished();
  await expect(search).toHaveCount(0);
  const results = app.results("school");
  await expect(results.getByRole("gridcell").first()).toBeVisible();
  return results;
}

export async function categoryColumn(results: Locator) {
  const header = results.getByRole("columnheader", { name: "Kategoria", exact: true });
  await expect(header).toHaveCount(1);
  const column = await header.getAttribute("col-id");
  expect(column, "Kolumna Kategoria musi mieć identyfikator AG Grid").toBeTruthy();
  return { header, column: column! };
}

export async function expectCategoryInSearch(
  app: Octopus,
  school: CategorySchool,
  category: SchoolCategory,
) {
  const results = await searchCategorySchools(app, { id: school.id });
  const { column } = await categoryColumn(results);
  const row = results
    .getByRole("row")
    .filter({ has: app.page.getByRole("gridcell", { name: school.id, exact: true }) });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(school.name);
  await expect(row.locator(`[role="gridcell"][col-id="${column}"]`)).toHaveText(category);
}

export async function setStudentCount(app: Octopus, school: CategorySchool, count: string) {
  expect(school.name).toMatch(/^AUTO_CAT_/);
  await app.openPanel("school", school.id);
  await expect(app.detail("name")).toHaveValue(school.name);
  const form = await openSchoolSioForm(app.page);
  const input = schoolSioInput(form, "quantityOfStudents");
  await input.fill(count);
  await input.blur();
  await saveSchoolSioEdit(form);
  // Nie opuszczamy profilu: sprawdzamy automatyczną aktualizację po zapisie SIO.
  // Nawigacja w tym miejscu mogłaby przerwać obsługę odpowiedzi i przeliczenie kategorii.
  await expect(studentCountInput(app.page)).toHaveValue(count);
}

export async function categorySortRows(results: Locator, column: string) {
  return results.locator('[role="row"][row-index]').evaluateAll(
    (elements, categoryColumnId) =>
      elements
        .map((element) => ({
          index: Number(element.getAttribute("row-index")),
          id: element.querySelector('[role="gridcell"][col-id="id"]')?.textContent?.trim() ?? "",
          category:
            Array.from(element.querySelectorAll('[role="gridcell"]'))
              .find((cell) => cell.getAttribute("col-id") === categoryColumnId)
              ?.textContent?.trim() ?? "",
        }))
        .sort((left, right) => left.index - right.index),
    column,
  );
}
