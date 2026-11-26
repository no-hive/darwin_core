import { test, expect, picture, action } from './helpers.mjs';
import { locales } from '../routes.mjs';
import { STORAGE_KEY } from '../../src/site/app/prototype-core.mjs';

for (const lang of locales) {
  test(`search suggestions, scope, language and history ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/app/search/`);
    const input = page.locator('[data-scan-query]');
    await input.fill('maya');
    await expect(page.locator('[data-suggestion]')).toHaveCount(2);
    await picture(page, `${lang}-search-suggestions`);
    await input.press('ArrowDown');
    await expect(page.locator('[data-suggestion]').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#scan-suggestions')).toBeHidden();
    await input.fill('ines');
    await action(page, 'scan-show-all');
    await expect(page).toHaveURL(/q=ines/);
    await expect(page.locator('[data-entity="profiles"]')).toHaveCount(1);
    await page.locator('[data-scan-query]').fill('maya');
    await page.locator('[data-search-form]').evaluate(form => form.requestSubmit());
    await expect(page).toHaveURL(/q=maya/);
    await page.goBack();
    await expect(page).toHaveURL(/q=ines/);
    await expect(page.locator('[data-entity="profiles"] h3')).toContainText('Inés');
    const other = lang === 'en' ? 'es' : 'en';
    await page.locator('.lang-trigger').click();
    await page.locator(`.lang-menu a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/app/search/\\?q=ines`));
  });

  test(`groups, vote, storage, leave and reset ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/app/groups/mollusks/`);
    await action(page, 'join');
    await expect(page.locator('[data-action="leave"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-action="leave"]')).toBeVisible();
    await page.goto(`/${lang}/app/groups/mollusks/proposals/specimen-review/`);
    await page.locator('[data-vote-form] [value="for"]').check();
    await page.locator('[data-vote-form]').evaluate(form => form.requestSubmit());
    await expect(page.locator('[data-total="for"]')).toHaveText('22');
    await picture(page, `${lang}-vote-saved`);
    await page.reload();
    await expect(page.locator('[data-vote-form] [value="for"]')).toBeChecked();
    await page.goto(`/${lang}/app/groups/mollusks/`);
    await action(page, 'leave');
    await expect(page.locator('[data-action="join"]')).toBeVisible();
    await action(page, 'reset');
    await expect(page.locator('#reset-dialog')).toBeVisible();
    await picture(page, `${lang}-reset-dialog`, false);
    await action(page, 'confirm-reset');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).records.length, STORAGE_KEY)).toBe(0);
  });

  test(`contribution, attachment and persistence ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/app/records/`);
    await page.locator('a[href$="#contribute"]').first().click();
    await expect(page.locator('#contribution-dialog')).toBeVisible();
    await picture(page, `${lang}-contribution-dialog`, false);
    const form = page.locator('[data-record-form]');
    for (const [name, value] of Object.entries({
      title: 'QA synthetic observation', scientificName: 'Testus example',
      date: '2026-11-14', location: 'QA sector', description: 'Synthetic regression fixture', evidence: 'QA notebook'
    })) await form.locator(`[name="${name}"]`).fill(value);
    await form.locator('[name="groupId"]').selectOption('pacific');
    await form.locator('[name="researchId"]').selectOption('pacific-atlas');
    await form.evaluate(node => node.requestSubmit());
    await expect(page).toHaveURL(/record=local-/);
    await expect(page.locator('h1')).toHaveText('QA synthetic observation');
    await page.reload();
    await expect(page.locator('h1')).toHaveText('QA synthetic observation');
    await page.goto(`/${lang}/app/groups/mollusks/?tab=records`);
    await action(page, 'join');
    await page.locator('[data-attach-form] [name="record"]').selectOption('abyssal-skate');
    await page.locator('[data-attach-form]').evaluate(node => node.requestSubmit());
    await expect(page.locator('[data-entity="records"][data-id="abyssal-skate"]')).toBeVisible();
  });

  test(`profile editing, search, foreign profile and history ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/app/profile/`);
    await action(page, 'edit');
    await picture(page, `${lang}-profile-editor`);
    await page.locator('#edit-name').fill('QA Alan');
    await action(page, 'cancel');
    await expect(page.locator('#profile-name')).toHaveText('Alan Li');
    await action(page, 'edit');
    await page.locator('#edit-name').fill('QA Alan');
    await action(page, 'save');
    await expect(page.locator('#profile-name')).toHaveText('QA Alan');
    await page.reload();
    await expect(page.locator('#profile-name')).toHaveText('QA Alan');
    await page.locator('#profile-search').fill('maya');
    await page.locator('#profile-search-results [data-profile-id="maya"]').click();
    await expect(page.locator('#profile-name')).toHaveText('Maya Rivers');
    await expect(page.locator('[data-action="edit"]')).toBeHidden();
    await picture(page, `${lang}-foreign-profile`);
    await page.goBack();
    await expect(page.locator('#profile-name')).toHaveText('QA Alan');
    await page.goto(`/${lang}/app/profile/?profile=missing`);
    await expect(page.locator('#profile-not-found')).toBeVisible();
  });

  test(`task creation, transitions and reload ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/app/tasks/`);
    await expect(page.locator('.task-card')).toHaveCount(3);
    await page.locator('#task-composer [name="title"]').fill('QA synthetic task');
    await page.locator('#task-composer').evaluate(form => form.requestSubmit());
    const task = page.locator('.task-card').filter({ hasText: 'QA synthetic task' });
    await task.locator('button').click();
    await expect(page.locator('[data-status="doing"] .task-card').filter({ hasText: 'QA synthetic task' })).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-status="doing"] .task-card').filter({ hasText: 'QA synthetic task' })).toHaveCount(1);
    await picture(page, `${lang}-task-created`);
  });
}
