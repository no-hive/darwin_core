import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {compileStyles} from './styles.mjs';
import {imageDimensions} from './images.mjs';

// Build-time filesystem access must use the source root, not the location of
// Astro's bundled prerender chunks under .migration/astro/.prerender/.
const root = path.resolve(process.env.DWC_SOURCE_ROOT || process.cwd());
let styleURL;
const images = new Map();
let mediaManifest;
async function responsiveManifest(){
  mediaManifest??=readFile(path.join(root,'.migration/media/manifest.json'),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return {images:{}};throw error;});
  return mediaManifest;
}
export function stylesheetURL() {
  styleURL ??= compileStyles(root).then(css => '/style.css?v=' + createHash('sha256').update(css).digest('hex').slice(0,12));
  return styleURL;
}
export async function localImage(file, dimensions = {}) {
  if (file.startsWith('https://')) {
    const url = new URL(file);
    if (url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/')) throw Error('Unsupported external content image.');
    const {width,height} = dimensions;
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw Error('External image requires dimensions.');
    const widths=[...new Set([480,768,1200,1600].map(size=>Math.min(size,width)))];
    const variant=size=>{const target=new URL(url);target.searchParams.set('w',String(size));target.searchParams.set('fit','max');target.searchParams.set('auto','format');return target.href;};
    return {src:variant(Math.min(width,1200)),width,height,srcset:widths.map(size=>`${variant(size)} ${size}w`).join(', ')};
  }
  const assets = path.join(root, 'src/site/assets');
  const target = path.resolve(assets, file);
  if (!target.startsWith(assets + path.sep)) throw new Error(`Invalid content image: ${file}`);
  if (!images.has(file)) images.set(file, readFile(target).then(imageDimensions));
  const [width,height] = await images.get(file);
  const entry=(await responsiveManifest()).images[file];
  return {src: '/assets/' + file, width, height,...(entry?{srcset:entry.variants.map(variant=>`${variant.src} ${variant.width}w`).join(', ')}:{})};
}
