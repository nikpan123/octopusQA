import { expect, type Locator, type Page } from '@playwright/test';

// fill wpisuje całość atomowo; End emituje keyup wymagany m.in. przez adres.
// Długie pressSequentially koliduje z automatycznym ustawianiem fokusu dialogu.
export async function typeValue(input: Locator, value: string) {
  await input.fill(value);
  await input.press('End');
  await input.press('Tab');
  await expect(input).toHaveValue(value);
}

export class Octopus {
  constructor(readonly page: Page) {}

  dialog(title: string) {
    return this.page.locator('mat-dialog-container').filter({
      has: this.page.getByRole('heading', { name: title, exact: true }),
    });
  }

  // Etykiety w tej aplikacji nie zawsze są HTML label. Szukamy najbliższego
  // wspólnego kontenera etykiety i pola zamiast używać zmiennych ID mat-input.
  field(scope: Locator, label: string) {
    return scope.getByText(label, { exact: true })
      .locator('xpath=ancestor::*[.//input[not(@type="checkbox")]][1]')
      .locator('input:not([type="checkbox"])');
  }

  detail(id: string) { return this.page.locator(`mat-form-field[id="${id}"] input`); }

  async openPanel(kind: 'teacher' | 'school', id?: string) {
    await this.page.goto(`/${kind}/${kind}-panel${id ? `/${id}` : ''}`);
    await expect(this.page.getByRole('heading', {
      name: kind === 'school' ? 'Dane podstawowe szkoły' : 'Dane podstawowe', exact: true,
    })).toBeVisible();
    if (id) {
      await expect(this.page.locator('.info-row').filter({
        has: this.page.getByText('ID', { exact: true }),
      }).locator('input[type="text"]')).toHaveValue(id);
      await expect(this.page.getByRole('button', { name: 'Edycja danych', exact: true })).toBeVisible();
    }
  }

  async createSchool(name: string, number: string) {
    await this.openPanel('school');
    await this.page.getByRole('button', { name: 'Dodaj', exact: true }).filter({
      has: this.page.getByText('school', { exact: true }),
    }).click();
    const form = this.dialog('Dodaj nową szkołę');
    await typeValue(this.field(form, '* Nazwa'), name);
    await form.getByRole('combobox').click();
    await this.page.getByRole('option', { name: 'Szkoła podstawowa', exact: true }).click();
    await form.getByRole('button', { name: 'Dodaj adres szkoły', exact: true }).click();
    const address = this.dialog('Edycja adresu');
    await typeValue(address.locator('input[id="zip_code_input"]'), '80-064');
    const city = address.getByRole('row').filter({ hasText: '80-064' }).filter({ hasText: 'Gdańsk' });
    await expect(city).toHaveCount(1);
    await city.click();
    await typeValue(address.locator('input[id="number"]'), number);
    await address.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(address).toHaveCount(0);
    await form.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(this.page).toHaveURL(/\/school\/school-panel\/\d+$/);
    const id = this.page.url().split('/').pop()!;
    await expect(this.detail('name')).toHaveValue(name);
    return id;
  }

  async markTestRecord() {
    await this.page.getByRole('checkbox', { name: 'Testowy', exact: true }).check();
    await expect(this.page.getByRole('checkbox', { name: 'Testowy', exact: true })).toBeChecked();
    // Poczekaj na utrwalenie przez UI: odczyt po pełnej nawigacji wykonuje scenariusz.
  }

  async searchSchool(name: string, id: string) {
    await this.page.getByRole('button', { name: 'Szukaj', exact: true }).click();
    const search = this.dialog('Wyszukiwarka szkół');
    await typeValue(this.field(search, 'Nazwa szkoły'), name);
    await search.getByRole('button', { name: 'Szukaj', exact: true }).click();
    await expect(search).toHaveCount(0);
    const row = this.page.getByRole('row').filter({ has: this.page.getByRole('gridcell', { name: id, exact: true }) });
    await expect(row).toHaveCount(1);
    await row.click();
    await expect(this.detail('name')).toHaveValue(name);
    await expect(this.page.getByRole('heading', { name: 'Rekordów: 1', exact: true })).toBeVisible();
  }

  async createTeacher(lastName: string, email: string, schoolId: string, schoolName: string) {
    await this.openPanel('teacher');
    await this.page.getByRole('button', { name: 'Dodaj', exact: true }).click();
    const form = this.dialog('Dodaj nowego nauczyciela');
    await typeValue(this.field(form, '*Nazwisko'), lastName);
    await typeValue(this.field(form, '*Imię'), 'Testowy');
    await typeValue(form.locator('.new-teacher__personal-input').filter({
      has: this.page.getByText('E-mail', { exact: true }),
    }).locator('input'), email);
    await form.getByRole('button', { name: 'Dodaj szkołę', exact: true }).click();
    const schools = this.dialog('Dodaj szkołę - szkoły nauczyciela');
    await typeValue(this.field(schools, 'ID szkoły'), schoolId);
    await schools.getByRole('button', { name: 'Szukaj', exact: true }).click();
    const row = schools.getByRole('row').filter({ hasText: schoolName });
    await expect(row).toHaveCount(1);
    // Pierwsza komórka to akcja „Dodaj” pod nagłówkiem tabeli.
    await row.getByRole('gridcell').first().click();
    await expect(schools.getByRole('row').filter({ hasText: schoolName })).toHaveCount(2);
    await schools.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(schools).toHaveCount(0);
    await expect(form.getByRole('row').filter({ hasText: schoolName })).toHaveCount(1);
    await form.getByRole('button', { name: 'Zapisz', exact: true }).click();
    const warning = this.dialog('Uwaga');
    await expect(warning).toContainText('Nie dodałeś przedmioto-poziomu');
    await warning.getByRole('button', { name: 'Tak', exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(this.page).toHaveURL(/\/teacher\/teacher-panel\/\d+$/);
    const id = this.page.url().split('/').pop()!;
    await expect(this.detail('email')).toHaveValue(email);
    await expect(this.page.getByRole('row').filter({ hasText: schoolName })).toHaveCount(1);
    return id;
  }

  async searchTeacher(id: string) {
    await this.page.getByRole('button', { name: 'Szukaj', exact: true }).click();
    const search = this.dialog('Wyszukiwarka nauczycieli');
    await typeValue(this.field(search, 'ID nauczyciela'), id);
    await search.getByRole('button', { name: 'Szukaj', exact: true }).click();
    await expect(search).toHaveCount(0);
    const row = this.page.getByRole('row').filter({ has: this.page.getByRole('gridcell', { name: id, exact: true }) });
    await expect(row).toHaveCount(1);
    await row.click();
    await expect(this.page.getByRole('heading', { name: 'Rekordów: 1', exact: true })).toBeVisible();
  }

  async editFirstName(value: string) {
    await this.page.getByRole('button', { name: 'Edycja danych', exact: true }).click();
    const form = this.dialog('Edycja danych podstawowych');
    await typeValue(form.locator('input[id="firstName"]'), value);
    await form.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(this.detail('firstName')).toHaveValue('Bożena');
  }
}
