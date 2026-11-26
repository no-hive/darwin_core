import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
// Both page renderers pass the same explicit model through pageMetadata.
export function createOgSpec({title:pageTitle,lang,route,classes=[]}){
 const has=name=>classes.includes(name);
 const [bg,ink,accent]=has('brand-assets-page')?['#101114','#f2f4ed','#627eea']:has('app-page')?['#020f08','#efffe8','#c7ff00']:has('ember-page')?['#1b0b06','#f2dfc7','#ed7b2d']:has('ocean-page')?['#000000','#e1f2ff','#51baff']:has('tool-detail-page')?['#f2f0e9','#292827','#4b4946']:has('tools-page')?['#f2f0e9','#1d282d','#2d5664']:['#08150d','#e3e6d5','#bacb79'];
 let title=pageTitle.replace(/\. Darwin Core Protocol\.$/,'');
 if(title.length>38)title=title.slice(0,35).replace(/\s+\S*$/,'')+'…';
 const id=createHash('sha256').update(JSON.stringify({lang,route,title,bg,ink,accent,v:2})).digest('hex').slice(0,16);
 return {title,bg,ink,accent,file:`/assets/og/${lang}-${id}.png`};
}
export function renderOgImages(specs,root,output){
 const result=spawnSync('python',['src/render-og.py'],{cwd:root,input:JSON.stringify({specs,root,output}),encoding:'utf8'});
 if(result.status!==0)throw new Error(`OG image rendering failed: ${result.stderr}`);
}
