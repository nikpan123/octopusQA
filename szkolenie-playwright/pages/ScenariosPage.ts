import type { Page } from '@playwright/test';

// Dopiero po napisaniu prostych testów przenosimy wspólne czynności do klasy.
export class ScenariosPage {
  constructor(private readonly page: Page) {}

  get rows() {
    return this.page.getByRole('list', { name: 'Lista scenariuszy' }).getByRole('listitem');
  }

  async open() { await this.page.goto('/'); }
  async searchFor(text: string) { await this.page.getByLabel('Szukaj przypadku').fill(text); }
}
