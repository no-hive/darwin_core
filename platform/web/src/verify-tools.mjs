import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
const read=src=>fs.readFileSync(`dist${src.split(/[?#]/)[0]}`,'utf8');
const dependencies=['/assets/processing-core.js','/assets/workbench-i18n.js','/assets/workbench.js'];
const routes={'csv-to-darwin-core':'map','date-normalizer':'dates','duplicate-finder':'duplicates','data-workflow':'workflow'};
for(const lang of ['en','es'])for(const [route,mode] of Object.entries(routes)){
 const {document,window:domWindow}=parseHTML(read(`/${lang}/tools/${route}/index.html`));
 const scripts=[...document.querySelectorAll('script[src]')].map(n=>n.getAttribute('src').split(/[?#]/)[0]);
 assert.deepEqual(scripts.filter(src=>dependencies.includes(src)),dependencies,`${lang}/${route}: processing dependencies survive the build in order`);
 assert(!scripts.includes('/assets/vendor/jszip.min.js'),'ZIP writer is Worker-only and loads on demand');
 const jobs=[],downloads=[];
 const context=vm.createContext({document,DOMParser,TextEncoder,TextDecoder,Blob,URL:class extends URL{static createObjectURL(blob){downloads.push(blob);return 'blob:demo';}static revokeObjectURL(){}},location:{href:`https://example.test/${lang}/tools/${route}/`},setTimeout:()=>0,clearTimeout:()=>{},setImmediate,Uint8Array,ArrayBuffer,console,addEventListener:()=>{},localStorage:{setItem:()=>{}}});
 context.window=context;context.self=context;
 context.Worker=class{
  constructor(src){
   assert.equal(new URL(src,'https://example.test').pathname,'/assets/processing-worker.js');const owner=this;
   this.scope=vm.createContext({TextEncoder,TextDecoder,Blob,Uint8Array,ArrayBuffer,DataView,URL,setTimeout,clearTimeout,setImmediate,console,postMessage:data=>queueMicrotask(()=>{if(!owner.closed)owner.onmessage?.({data:structuredClone(data)});}),importScripts:src=>vm.runInContext(read('/assets/'+src),this.scope)});
   this.scope.self=this.scope;vm.runInContext(read(src),this.scope);
  }
  postMessage(data){jobs.push(structuredClone(data));queueMicrotask(()=>this.scope.onmessage({data:structuredClone(data)}));}
  terminate(){this.closed=true;}
 };
 for(const src of dependencies)vm.runInContext(read(src),context,{filename:src});
 const root=document.querySelector('#tool-app');
 assert.equal(root.dataset.mode,mode);assert(root.querySelector('#data-file'),'File import renders');assert(root.querySelector('#paste-table'),'Paste area renders');
 const click=async action=>{const button=root.querySelector(`[data-action="${action}"]`);assert(button,`${route}: ${action} is available`);button.click();for(let i=0;i<50;i++){await new Promise(resolve=>setImmediate(resolve));if(root.getAttribute('aria-busy')!=='true')break;}};
 await click('sample');assert.equal(jobs.at(-1).action,'parse');assert(root.querySelector('.loaded-file')?.textContent.includes('4'));
 assert.equal(root.querySelectorAll('.app-step').length,mode==='workflow'?3:1);
 await click('run');assert(root.querySelector('.app-results'),`${lang}/${route}: real processing produces results`);assert(!root.querySelector('#app-status').classList.contains('app-alert'));
 await click('csv');const csv=await downloads.at(-1).text();assert(csv.includes('Poa annua'));assert(csv.includes('DEMO-001'));
 await click('report');const report=JSON.parse(await downloads.at(-1).text());assert.equal(report.summary.inputRows,4);
 if(mode==='map'||mode==='workflow')assert(csv.includes('scientificName'),'Mapping is applied');
 if(mode==='dates'||mode==='workflow'){assert(csv.includes('2025-06-15'),'Valid dates are normalized');assert(report.issues.some(i=>i.code==='ambiguous_date'),'Ambiguous dates stay flagged');}
 if(mode==='duplicates'||mode==='workflow'){
  assert.equal(report.steps.find(s=>s.type==='duplicates').summary.groups,1);
  await click('keep-first');await click('report');assert.equal(JSON.parse(await downloads.at(-1).text()).summary.outputRows,3,'Duplicate removal is explicit and functional');
 }
 await click('recipe');const recipe=JSON.parse(await downloads.at(-1).text());assert.equal(recipe.format,'dwc-local-recipe');
 await click('clear');assert(!root.querySelector('.loaded-file'));assert(!root.querySelector('.app-results'));
 root.querySelector('#paste-table').value='ID,Species\n1,"<script>alert(1)</script>"';await click('parse');assert(!root.querySelector('script'),'Imported table text cannot create executable markup');
 assert.equal(document.querySelectorAll('script[src="/i18n.js"]').length,1,'Only one shared navigation controller');
}
console.log('OK: all eight localized tools boot, import, process, review, export CSV/report/recipe, remove duplicates and clear data.');
