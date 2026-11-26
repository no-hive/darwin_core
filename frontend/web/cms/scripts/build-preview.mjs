import {spawnSync} from 'node:child_process';
import {cp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {compileStyles} from '../../src/lib/styles.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const env={...process.env,DWC_BUILD_TARGET:'preview',DWC_CONTENT_SOURCE:'sanity',DWC_CONTENT_SNAPSHOT:path.join(root,'.migration/content/drafts.json'),DWC_SOURCE_ROOT:root,ASTRO_TELEMETRY_DISABLED:'1'};
function run(args){const result=spawnSync(process.execPath,args,{cwd:root,env,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error('Private preview build failed. Production output was not touched.');}
run(['cms/scripts/fetch-content.mjs']);
run(['src/build-media.mjs']);
const astro=JSON.parse(await readFile(path.join(root,'node_modules/astro/package.json'),'utf8'));
run([path.join(root,'node_modules/astro',astro.bin.astro),'build']);
const target=path.join(root,'.migration/preview');
await cp(path.join(root,'src/site/assets'),path.join(target,'assets'),{recursive:true,filter:file=>! /\.(ttf|otf)$/.test(file)});
const media=JSON.parse(await readFile(path.join(root,'.migration/media/manifest.json'),'utf8'));
for(const variant of Object.values(media.images).flatMap(image=>image.variants)){
  const {mkdir}=await import('node:fs/promises');await mkdir(path.join(target,'assets/optimized'),{recursive:true});
  await cp(path.join(root,'.migration/media/files',path.basename(variant.src)),path.join(target,'assets/optimized',path.basename(variant.src)));
}
for(const file of ['i18n.js','metrics.js','favicon.ico','favicon.svg'])await cp(path.join(root,'src/site',file),path.join(target,file));
await writeFile(path.join(target,'style.css'),await compileStyles(root));
await writeFile(path.join(target,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log('Private article preview built under .migration/preview. Do not publish this directory.');
