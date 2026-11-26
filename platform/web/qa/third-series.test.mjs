import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localizedArticles} from '../src/content/article-catalog.mjs';
import {parseHTML} from 'linkedom';

const en = localizedArticles('en');
const es = localizedArticles('es');
test('published articles have unique routes and Sanity-hosted covers', () => {
  assert.ok(en.length > 0);
  for (const catalog of [en, es]) {
    assert.equal(new Set(catalog.map(article => article.slug)).size, catalog.length);
    for (const article of catalog) {
      assert.ok(article.image.startsWith('https://cdn.sanity.io/'));
      assert.ok(Array.isArray(article.body));
    }
  }
});
test('published articles render their heading, cover and sitemap entry', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const [locale, catalog] of [['en', en], ['es', es]]) for (const article of catalog) {
    const {document} = parseHTML(await readFile(`dist/${locale}/blog/${article.slug}/index.html`, 'utf8'));
    assert.equal(document.querySelector('h1').textContent.trim(), article.title);
    assert.ok(document.querySelector('.article-hero img').getAttribute('src').startsWith('https://cdn.sanity.io/'));
    assert.ok(sitemap.includes(`/${locale}/blog/${article.slug}/`));
  }
});
