import {readdir,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {parseHTML} from 'linkedom';
const ROLLBACK_APP_FILES=['app/app.js','app/prototype-app.js','app/prototype-client.mjs','app/prototype-core.mjs','app/prototype-copy.mjs','app/prototype-render.mjs','app/dwc-occurrence.mjs','app/dwc-views.mjs','app/profile/profile.js'];
async function files(directory){return (await Promise.all((await readdir(directory,{withFileTypes:true})).map(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]))).flat();}
/** Packaging manifest, never regression QA. Only explicitly retired controllers
 * are omitted; uncertain image candidates remain available at their old URLs. */
export async function finalizeDeliveryAssets(root,output,{appRenderer}){
 const all=await files(output),html=await Promise.all(all.filter(file=>file.endsWith('.html')).map(file=>readFile(file,'utf8')));
 const scripts=new Set();for(const markup of html){const {document}=parseHTML(markup);for(const node of document.querySelectorAll('script[src]'))scripts.add(node.getAttribute('src').split(/[?#]/)[0]);}
 const removed=[];
 if(appRenderer==='react')for(const relative of ROLLBACK_APP_FILES){if(scripts.has('/'+relative))throw Error('Active page references a rollback-only App controller: '+relative);await rm(path.join(output,relative),{force:true});removed.push(relative);}
 const shipped=await files(output),sizes=[];let totalBytes=0;
 for(const file of shipped){const bytes=(await readFile(file)).byteLength;totalBytes+=bytes;sizes.push({file:path.relative(output,file).split(path.sep).join('/'),bytes});}
 const manifest={schema:1,appRenderer,totalBytes,fileCount:shipped.length,removedRollbackFiles:removed,pageScripts:[...scripts].sort(),largestFiles:sizes.sort((a,b)=>b.bytes-a.bytes).slice(0,20)};
 await mkdir(path.join(root,'.migration/delivery'),{recursive:true});await writeFile(path.join(root,'.migration/delivery/asset-budget.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(`Prepared asset budget: ${manifest.fileCount} files. Rollback source remains in Git.`);
}
