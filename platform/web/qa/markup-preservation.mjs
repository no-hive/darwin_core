import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import assert from 'node:assert/strict';
const baseline='ec4cf27dc0181a90247279b38c909c69367e2cef';
function visualBody(html){
 const {document}=parseHTML(html);document.querySelectorAll('script').forEach(node=>node.remove());document.querySelectorAll('[data-worker-src]').forEach(node=>node.removeAttribute('data-worker-src'));
 const node=value=>value.nodeType===3?['text',value.nodeValue]:value.nodeType===8?null:[value.localName,[...(value.attributes||[])].map(a=>[a.name,a.value]).sort((a,b)=>a[0].localeCompare(b[0])),[...value.childNodes].map(node).filter(Boolean)];
 return node(document.body);
}
const sitemap=await readFile('dist/sitemap.xml','utf8'),routes=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1]).pathname);
const changed=[];for(const route of routes){const file='dist'+route+'index.html',before=execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}),after=await readFile(file,'utf8');if(JSON.stringify(visualBody(before))!==JSON.stringify(visualBody(after)))changed.push(route);}
const result={baselineCommit:baseline,pages:routes.length,changedVisualDOM:changed,browserVerified:false};await writeFile('qa/results/markup-preservation.json',JSON.stringify(result,null,2)+'\n');assert.deepEqual(changed,[]);console.log(JSON.stringify(result));
