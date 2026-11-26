import { readFile } from 'node:fs/promises';
import { test, expect, picture, action } from './helpers.mjs';
import { locales } from '../routes.mjs';

const tools = ['csv-to-darwin-core', 'date-normalizer', 'duplicate-finder', 'data-workflow'];
async function download(page, name) {
  const received = page.waitForEvent('download');
  await action(page, name);
  const file = await received;
  expect(await file.failure()).toBeNull();
  return { name: file.suggestedFilename(), bytes: await readFile(await file.path()) };
}
for (const lang of locales) for (const tool of tools) {
  test(`tool import, process, export and clear ${lang}/${tool}`, async ({ page }) => {
    await page.goto(`/${lang}/tools/${tool}/`);
    await action(page, 'sample');
    await expect(page.locator('.loaded-file')).toContainText('4');
    await action(page, 'run');
    await expect(page.locator('.app-results')).toBeVisible();
    await picture(page, `${lang}-${tool}-results`);
    const csv = await download(page, 'csv');
    expect(csv.bytes.toString('utf8')).toContain('Poa annua');
    const report = JSON.parse((await download(page, 'report')).bytes.toString('utf8'));
    expect(report.summary.inputRows).toBe(4);
    const recipe = await download(page, 'recipe');
    expect(JSON.parse(recipe.bytes.toString('utf8')).format).toBe('dwc-local-recipe');
    const xlsx = await download(page, 'xlsx');
    expect(xlsx.bytes.subarray(0, 2).toString()).toBe('PK');
    expect((await download(page, 'bundle')).bytes.subarray(0, 2).toString()).toBe('PK');
    if (['duplicate-finder', 'data-workflow'].includes(tool)) {
      await action(page, 'keep-first');
      const reduced = JSON.parse((await download(page, 'report')).bytes.toString('utf8'));
      expect(reduced.summary.outputRows).toBe(3);
    }
    await action(page, 'clear');
    await expect(page.locator('.app-results')).toHaveCount(0);
    await page.locator('#data-file').setInputFiles({ name: 'roundtrip.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: xlsx.bytes });
    await expect(page.locator('.loaded-file')).toContainText('4');
    await action(page, 'run');
    await expect(page.locator('.app-results')).toBeVisible();
    await action(page, 'clear');
    await page.locator('#data-file').setInputFiles({ name: 'fixture.csv', mimeType: 'text/csv', buffer: Buffer.from('ID,Species\n1,Poa annua\n2,Bellis perennis') });
    await expect(page.locator('.loaded-file')).toContainText('2');
    await page.locator('#recipe-file').setInputFiles({ name: 'recipe.json', mimeType: 'application/json', buffer: recipe.bytes });
    // Mismatched source headers must be rejected, not silently apply a recipe.
    await expect(page.locator('#app-status')).toHaveClass(/app-alert/);
    await action(page, 'clear');
    await page.locator('#paste-table').fill('ID,Species\n1,"<script>qa</script>"');
    await action(page, 'parse');
    await expect(page.locator('.loaded-file')).toContainText('1');
    await expect(page.locator('#tool-app script')).toHaveCount(0);
  });
}
