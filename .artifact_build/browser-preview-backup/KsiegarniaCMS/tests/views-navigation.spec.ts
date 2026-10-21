import {test} from '@playwright/test';
import {checkNavigation} from '../shared/viewSmoke';

test('Widoki: kompletność menu CMS', {tag:'@views'}, async ({page}) => {
  await checkNavigation(page);
});
