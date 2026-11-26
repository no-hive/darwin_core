import { defineConfig } from 'astro/config';
import { SITE } from './src/config/site.mjs';

// Astro owns complete article documents. The build assembler copies them into
// dist/ unchanged; other page families remain on the existing renderer.
export default defineConfig({
  srcDir: './frontend',
  publicDir: './frontend/public',
  outDir: process.env.DWC_BUILD_TARGET === 'preview' ? './.migration/preview' : './.migration/astro',
  cacheDir: './node_modules/.astro',
  output: 'static',
  site: SITE.origin,
  trailingSlash: 'always',
  compressHTML: false,
  build: { format: 'directory' },
  devToolbar: { enabled: false }
});
