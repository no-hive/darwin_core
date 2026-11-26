import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {localizedArticles} from './content/article-catalog.mjs';

const root=path.resolve(import.meta.dirname,'..');
const files=[...new Set(['en','es'].flatMap(locale=>localizedArticles(locale).flatMap(article=>[
  article.image,...article.blocks.filter(block=>block.kind==='image').map(block=>block.image)
])).filter(file=>!file.startsWith('https://')))];
if(files.some(file=>!/^[a-zA-Z0-9_-]+\.(png|webp)$/.test(file)))throw Error('Unsupported local media path.');
const result=spawnSync('python',['src/render-media.py'],{cwd:root,input:JSON.stringify({root,files}),encoding:'utf8'});
if(result.error)throw result.error;
if(result.status!==0)throw Error(`Responsive media build failed: ${result.stderr}`);
process.stdout.write(result.stdout);
