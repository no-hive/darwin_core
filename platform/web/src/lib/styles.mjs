import {readFile} from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import {transform} from 'esbuild';

// File order is part of the visual contract. Later layers deliberately win.
export const STYLE_LAYERS = [
  ['tokens', ['tokens.css', 'palette.css', 'fonts.css']],
  ['base', ['base.css']],
  ['layout', ['layout.css']],
  ['components', ['components.css']],
  ['pages', ['pages.css', 'prototype.css', 'darwinscan.css', 'profile-directory.css', 'pages/brand-assets.css', 'pages/donate.css']],
  ['utilities', [
    'contracts/visual.css', 'components/navigation-final.css',
    'components/footer-status.css', 'pages/about-layout.css',
    'pages/profile-layout.css', 'pages/tools-viewport.css',
    'contracts/responsive.css', 'pages/community-touch.css',
    'components/navigation-responsive.css', 'contracts/cards-footer.css',
    'pages/about-media.css', 'blog-preview.css', 'concept-mobile.css'
  ]]
];

export async function compileStyles(root) {
  let result = `@layer ${STYLE_LAYERS.map(([name]) => name).join(',')};\n`;
  for (const [layer, files] of STYLE_LAYERS) {
    const chunks = await Promise.all(files.map(async file => {
      const source = path.join(root, 'src/styles', file);
      const css = await readFile(source, 'utf8');
      postcss.parse(css, {from:source});
      return css;
    }));
    result += `@layer ${layer}{\n${chunks.join('\n')}\n}\n`;
  }
  // Whitespace only: preserve selectors, declaration order, values and layers.
  return (await transform(result,{loader:'css',minifyWhitespace:true,minifySyntax:false,minifyIdentifiers:false,target:'esnext',legalComments:'none'})).code;
}
