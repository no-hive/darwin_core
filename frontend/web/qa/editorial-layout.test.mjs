import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';

const root = new URL('..', import.meta.url);
const source = file => readFile(new URL(file, root), 'utf8');

test('About desktop keeps the visual frame, gutter, and editorial columns', async () => {
  const [about, pages, navigation] = await Promise.all([
    source('src/styles/pages/about-layout.css'),
    source('src/styles/pages.css'),
    source('src/styles/components/navigation-final.css')
  ]);

  assert.match(about, /body\.about-scroll-page\{display:flow-root\}/);
  assert.match(about, /--about-column-gap:60px/);
  assert.match(about, /scroll-section\.image-left\{grid-template-columns:minmax\(0,1\.618fr\) minmax\(0,1fr\)\}/);
  assert.match(about, /scroll-section\.image-right\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.618fr\)\}/);
  assert.match(pages, /\.about-scroll-page \.scroll-visual\{[^}]*padding:8vh 8vw/);
  assert.doesNotMatch(about, /\.scroll-visual\{padding:0\}/);
  assert.match(navigation, /margin-top:var\(--nav-edge\)/);
  assert.match(navigation, /background:transparent/);
});

test('Related article media uses the same fixed 3:2 surface as blog previews', async () => {
  const [component, pages, preview] = await Promise.all([
    source('frontend/components/RelatedArticles.astro'),
    source('src/styles/pages.css'),
    source('src/styles/blog-preview.css')
  ]);

  assert.match(component, /<span class="related-media"><img/);
  assert.match(pages, /\.related-media\{[^}]*aspect-ratio:3\/2/);
  assert.match(pages, /\.related-media>img\{[^}]*width:100%;height:100%;object-fit:cover/);
  assert.match(preview, /\.blog-page \.featured-card>img\{[^}]*aspect-ratio:3\/2/);
});
