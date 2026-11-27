import {expect, test} from './helpers.mjs';

async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
}

for (const route of ['concept', 'community', 'future']) {
  test(`About ${route} keeps a clean navigation gutter`, async ({page}) => {
    await page.goto(`/en/${route}/`);
    await ready(page);
    const geometry = await page.evaluate(() => {
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const visual = document.querySelector('.scroll-visual').getBoundingClientRect();
      return {headerTop: header.top, visualTop: visual.top, visualWidth: visual.width};
    });
    expect(geometry.headerTop).toBe(40);
    expect(geometry.visualTop).toBeGreaterThan(geometry.headerTop);
    expect(geometry.visualWidth).toBeLessThan(700);
    await expect(page).toHaveScreenshot(`${route}-top.png`, {fullPage: false});
  });
}

test('Related articles keep blog-preview media proportions', async ({page}) => {
  await page.goto('/en/blog/gitcoin-public-goods-scientific-infrastructure/');
  await ready(page);
  const related = page.locator('.article-related');
  await related.scrollIntoViewIfNeeded();
  const ratios = await page.locator('.related-media').evaluateAll(items => items.map(item => {
    const bounds = item.getBoundingClientRect();
    return bounds.width / bounds.height;
  }));
  expect(ratios).toHaveLength(2);
  for (const ratio of ratios) expect(ratio).toBeCloseTo(1.5, 3);
});
