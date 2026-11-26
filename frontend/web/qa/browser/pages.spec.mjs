import { test, expect, picture, ready } from './helpers.mjs';
import { routes, locales } from '../routes.mjs';
import { REDIRECTS } from '../../src/config/redirects.mjs';

for (const route of routes) {
  test(`page ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    await ready(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.site-header')).toHaveCount(1);
    await expect(page.locator('.site-footer')).toHaveCount(1);
    const lang = route.split('/')[1];
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    expect(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await picture(page, route.slice(1).replaceAll('/', '--') || 'root');
  });
}

for (const lang of locales) {
  for (const story of ['', 'deeper/', 'ocean/']) {
    test(`reading, disclosures and scroll ${lang}/${story}`, async ({ page }) => {
      await page.goto(`/${lang}/${story}`);
      await ready(page);
      const sections = page.locator('.scroll-section');
      await expect(sections).toHaveCount(3);
      // Viewport snapshots protect sticky positions, which a full-page image cannot establish.
      for (let index = 0; index < 3; index++) {
        await sections.nth(index).scrollIntoViewIfNeeded();
        await picture(page, `${lang}-${story.replaceAll('/', '') || 'concept'}-section-${index}`, false);
      }
      const disclosures = page.locator('.concept-explainer');
      for (let index = 0; index < await disclosures.count(); index++) {
        const details = disclosures.nth(index);
        await details.locator('summary').click();
        await expect(details).toHaveAttribute('open', '');
        await expect(details.locator('.concept-explainer-body')).toBeVisible();
        await picture(page, `${lang}-${story.replaceAll('/', '') || 'concept'}-hint-${index}`, false);
        await details.locator('summary').click();
        await expect(details).not.toHaveAttribute('open', '');
      }
      await expect(page.locator('.about-actions a').first()).toHaveAttribute('href', `/${lang}/app/`);
    });
  }

  test(`navigation, language, keyboard and footer ${lang}`, async ({ page }, testInfo) => {
    await page.goto(`/${lang}/tools/`);
    await ready(page);
    const trigger = page.locator('.nav-dropdown > .nav-trigger').first();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.nav-dropdown.is-open')).toBeVisible();
    await picture(page, `${lang}-navigation-open`, false);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await page.locator('.nav-collapse').click();
    await expect(page.locator('.site-nav')).toHaveClass(/is-collapsed/);
    await page.locator('.nav-collapse').click();
    await expect(page.locator('.site-nav')).not.toHaveClass(/is-collapsed/);
    const other = lang === 'en' ? 'es' : 'en';
    await page.locator('.lang-trigger').click();
    await page.locator(`.lang-menu a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/tools/$`));
    await expect(page.locator('html')).toHaveAttribute('lang', other);
    await page.locator('.newsletter-signup input').fill('qa@example.invalid');
    await page.locator('.newsletter-signup button').click();
    await expect(page.locator('.newsletter-status')).toContainText(other === 'en' ? 'not connected' : 'no está conectado');
    await page.goto(`/${lang}/`);
    if (testInfo.project.name !== 'desktop') {
      await page.evaluate(() => scrollTo(0, 1200));
      await ready(page);
      await expect(page.locator('.site-nav')).not.toHaveClass(/is-collapsed/);
    }
  });

  test(`blog preview and article navigation ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/blog/`);
    const rows = page.locator('.story-row');
    await expect(rows).toHaveCount(6);
    const row = rows.nth(1);
    const href = await row.getAttribute('data-url');
    await row.focus();
    await expect(page.locator('#featured-preview')).toHaveAttribute('href', href);
    await picture(page, `${lang}-blog-selected`);
    await page.locator('#featured-preview').click();
    await expect(page).toHaveURL(new RegExp(href + '$'));
    await expect(page.locator('.article-body')).toBeVisible();
    await expect(page.locator('.related-card')).not.toHaveCount(0);
    await page.locator('.article-back').click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/blog/$`));
  });

  for (const [from, to] of Object.entries(REDIRECTS)) {
    test(`legacy redirect ${lang}/${from}`, async ({ page }) => {
      await page.goto(`/${lang}/${from}`);
      await expect(page).toHaveURL(`http://127.0.0.1:4173/${lang}/${to}`);
    });
  }
}
