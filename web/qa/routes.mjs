import { readFileSync } from 'node:fs';
import { ROOT } from './artifacts.mjs';
import { SITE } from '../src/config/site.mjs';

// Read the built sitemap: additions/removals are also caught by the artifact guard.
export const routes = [...readFileSync(`${ROOT}/dist/sitemap.xml`, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)]
  .map(match => new URL(match[1]).pathname);
if (!routes.length || new Set(routes).size !== routes.length) throw Error('Invalid QA route inventory');
export const locales = SITE.locales;
export const viewports = [
  { name: 'desktop', width: 1440, height: 1000, touch: false },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'mobile', width: 390, height: 844, touch: true },
  { name: 'touch-landscape', width: 844, height: 390, touch: true }
];
