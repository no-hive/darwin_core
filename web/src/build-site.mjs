import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { articleRenderer,appRenderer } from './config/migration.mjs';
import {contentSource} from '../cms/lib/config.mjs';

const root = path.resolve(import.meta.dirname, '..');
const renderer = articleRenderer();
const selectedAppRenderer=appRenderer();
if (process.env.DWC_BUILD_TARGET === 'preview') throw Error('Use cms:preview:build for isolated drafts; production build refuses preview mode.');
const source = contentSource();
if(source==='sanity'&&renderer!=='astro') throw Error('Sanity requires the Astro renderer. Use build:rollback for a local-content rollback.');
const snapshot = path.join(root, '.migration/content/published.json');
function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID || '0ypa3y83', SANITY_DATASET: process.env.SANITY_DATASET || 'production', DWC_ARTICLE_RENDERER: renderer, DWC_APP_RENDERER:selectedAppRenderer, DWC_SOURCE_ROOT: root, DWC_CONTENT_SNAPSHOT: snapshot, ASTRO_TELEMETRY_DISABLED: '1' }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Build failed (${result.status ?? result.signal}): ${args[0]}`);
}

if (source === 'sanity') run(['cms/scripts/fetch-content.mjs']);
if (renderer === 'astro') {
  run(['src/build-media.mjs']);
  const packageRoot = path.join(root, 'node_modules/astro');
  const { bin } = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  run([path.join(packageRoot, bin.astro), 'build']);
}
if(selectedAppRenderer==='react')run(['src/build-app.mjs']);
run(['src/build.mjs']);
run(['cms/scripts/delivery-manifest.mjs']);
console.log(`Article renderer: ${renderer}; all articles (EN/ES). No QA was run by the build.`);
