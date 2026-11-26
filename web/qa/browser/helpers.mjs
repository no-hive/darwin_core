import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  health: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(`JS: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`Console: ${message.text()}`); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
    await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
    // Each test gets a fresh browser context; never use a signed-in user profile.
    await use();
    expect(errors, 'No runtime, console or HTTP errors').toEqual([]);
  }, { auto: true }]
});
export { expect };
export async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  await page.waitForFunction(() => !document.querySelector('.site-nav.is-animating'));
}
export async function picture(page, name, fullPage = true) {
  await ready(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage });
}
export async function action(page, name) {
  await page.locator(`[data-action="${name}"]`).click();
}
