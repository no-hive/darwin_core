import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';

const root = new URL('../src/site/assets/', import.meta.url).pathname;
const project = new URL('../', import.meta.url).pathname;
const skip = new Set(['favicon-32.png', 'favicon-96.png', 'apple-touch-icon.png']);
const exceptions = new Set(['community-governance-transparent.png', 'dwc-crab-crystal-tonal-cropped.svg', 'dwc-crab-crystal-tonal.png']);
const walk = async dir => (await Promise.all((await readdir(dir, {withFileTypes:true})).map(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]))).flat();
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const files = async () => (await walk(root)).filter(file => !file.includes('/brand-kit/') && !file.includes('/donate/') && !skip.has(file.split('/').pop()));
const format = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function report(){
  const rows = await Promise.all((await files()).map(async file => ({file:relative(project, file), bytes:(await stat(file)).size, sha:await hash(file)})));
  const duplicates = [...rows.reduce((map, row) => map.set(row.sha, [...(map.get(row.sha) || []), row.file]), new Map()).entries()].filter(([,items]) => items.length > 1);
  console.table(rows.sort((a,b) => b.bytes-a.bytes).slice(0, 30).map(row => ({file:row.file, size:format(row.bytes)})));
  console.log(JSON.stringify({assets:rows.length, total:format(rows.reduce((total,row) => total + row.bytes, 0)), duplicates}, null, 2));
}

async function validate(){
  const oversized = [];
  for(const file of await files()) if((await stat(file)).size > 500 * 1024 && !exceptions.has(file.split('/').pop())) oversized.push(relative(project, file));
  if(oversized.length) throw Error(`Assets above 500 KB require an explicit exception: ${oversized.join(', ')}`);
  console.log('Asset validation passed.');
}

async function optimize(){
  const candidates = (await files()).filter(file => /\.png$/i.test(file) && !/\/(dwc-|brand-|footer-|community-governance-transparent)/.test(file));
  const replacements = [];
  for(const file of candidates){
    const before = (await stat(file)).size;
    if(before < 80 * 1024) continue;
    const output = file.replace(/\.png$/i, '.webp');
    const result = spawnSync('magick', [file, '-quality', '85', '-define', 'webp:method=6', output], {encoding:'utf8'});
    if(result.status !== 0) throw Error(result.stderr || `ImageMagick failed for ${file}`);
    if((await stat(output)).size >= before){await rm(output); continue;}
    replacements.push([relative(project, file), relative(project, output)]);
    await rm(file);
  }
  const sources = (await walk(project)).filter(file => /\.(?:mjs|js|ts|tsx|astro|css|html|json)$/.test(file) && !file.includes('/node_modules/') && !file.includes('/dist/'));
  for(const source of sources){
    let value = await readFile(source, 'utf8'), next = value;
    for(const [from, to] of replacements) next = next.replaceAll(from.replace('src/site/', ''), to.replace('src/site/', '')).replaceAll(from.split('/').pop(), to.split('/').pop());
    if(next !== value) await writeFile(source, next);
  }
  console.log(`Optimized ${replacements.length} PNG illustrations.`);
}

const command = process.argv[2];
if(command === 'report') await report();
else if(command === 'validate') await validate();
else if(command === 'optimize') await optimize();
else throw Error('Use: assets.mjs optimize|validate|report');
