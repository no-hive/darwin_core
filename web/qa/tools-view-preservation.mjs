import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {parseHTML,DOMParser} from 'linkedom';
import assert from 'node:assert/strict';
const baseline='1079879f6c15179102d2f9394c58563a49675745'; // before block 8
const source=(name,old)=>old?execFileSync('git',['show',baseline+':src/site/assets/'+name],{encoding:'utf8'}):fs.readFileSync('src/site/assets/'+name,'utf8');
async function views(lang,route,old){
 const {document,window}=parseHTML(fs.readFileSync(`dist/${lang}/tools/${route}/index.html`,'utf8'));
 const context=vm.createContext({document,DOMParser,TextEncoder,TextDecoder,Blob,URL,Date,JSON,setTimeout:()=>0,clearTimeout:()=>{},console,addEventListener:()=>{},location:{href:`https://example.test/${lang}/tools/${route}/`},localStorage:{setItem:()=>{}}});context.window=context;context.self=context;
 context.Worker=class{
  postMessage({id,action,payload}){queueMicrotask(()=>{try{const C=context.DwcCore;let value;if(action==='parse'){const parsed=C.parseCSV(payload.text,payload.delimiter,payload.options);value=C.fromRecords(parsed.records,{...payload.options,delimiter:parsed.delimiter});}else{value=C.runPipeline(payload.data,payload.steps);if(!old)value.formulaLikeFields=C.formulaCount(value.data);}this.onmessage({data:{id,value}});}catch(error){this.onmessage({data:{id,error:{code:error.code,details:error.details}}});}});}
  terminate(){}
 };
 for(const file of ['processing-core.js','workbench-i18n.js','workbench.js'])vm.runInContext(source(file,old),context);
 const root=document.getElementById('tool-app'),snapshots=[];
 async function click(action){root.querySelector(`[data-action="${action}"]`).click();for(let i=0;i<32;i++)await Promise.resolve();assert.notEqual(root.getAttribute('aria-busy'),'true');snapshots.push(root.innerHTML);}
 await click('sample');await click('run');if(['duplicate-finder','data-workflow'].includes(route))await click('keep-first');return snapshots;
}
let states=0;for(const lang of ['en','es'])for(const route of ['csv-to-darwin-core','date-normalizer','duplicate-finder','data-workflow']){
 const before=await views(lang,route,true),after=await views(lang,route,false);assert.deepEqual(after,before,`${lang}/${route}: sample/result/review markup`);states+=before.length;
}
const result={baselineCommit:baseline,routes:8,states,identical:true,browserVerified:false};fs.writeFileSync('qa/results/tools-view-preservation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
