import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {PROTOTYPE} from '../src/content/prototype.mjs';

// DOM unit/integration tests, not a browser or screenshot substitute.
await build({stdin:{contents:"export {Application} from './../app/src/Application';export {createLocalRepository} from './../app/src/repository';",resolveDir:process.cwd(),loader:'tsx'},nodePaths:[path.resolve('node_modules')],bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',outfile:'.migration/qa-react.mjs',logLevel:'silent'});
const initial=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://example.test/'});
globalThis.window=initial.window;globalThis.document=window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');const {createRoot}=await import('react-dom/client');
const {Application,createLocalRepository}=await import('../.migration/qa-react.mjs');
const memory=()=>{const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};};
async function fixture(locale,route,query='',saved){
 const html=await readFile(`dist/${locale}/${route}index.html`,'utf8');
 const dom=new JSDOM(html,{url:`https://example.test/${locale}/${route}${query}`,pretendToBeVisual:true});
 const w=dom.window;globalThis.window=w;globalThis.document=w.document;
 Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
 globalThis.HTMLElement=w.HTMLElement;globalThis.Element=w.Element;globalThis.MutationObserver=w.MutationObserver;globalThis.Node=w.Node;globalThis.FormData=w.FormData;globalThis.getComputedStyle=w.getComputedStyle;globalThis.requestAnimationFrame=w.requestAnimationFrame.bind(w);globalThis.cancelAnimationFrame=w.cancelAnimationFrame.bind(w);
 w.document.fonts={addEventListener(){},removeEventListener(){}};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:1280,bottom:800,width:1280,height:800});w.visualViewport={addEventListener(){},removeEventListener(){},width:1280,height:800,offsetLeft:0,offsetTop:0,pageLeft:0,pageTop:0,scale:1};
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
 w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(saved)for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,JSON.stringify(value));
 const bootstrap={...JSON.parse(document.getElementById('app-react-data').textContent),seed:JSON.parse(document.getElementById('app-prototype-data').textContent)};
 const repository=createLocalRepository(bootstrap.seed,locale),errors=[],warnings=[];
 const originalError=console.error;console.error=(...args)=>warnings.push(args.map(String).join(' '));
 let root;await React.act(async()=>{const container=document.querySelector('main');container.innerHTML='';root=createRoot(container);root.render(React.createElement(Application,{bootstrap,repository}));});
 assert.deepEqual(errors,[]);
 const $=selector=>w.document.querySelector(selector);
 const click=async selector=>{assert($(selector),selector);await React.act(async()=>$(selector).click());};
 const input=async(selector,value)=>{const node=$(selector);assert(node,selector);await React.act(async()=>{const proto=node instanceof w.HTMLTextAreaElement?w.HTMLTextAreaElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new w.Event('input',{bubbles:true}));});};
 const change=async(selector,value)=>{await React.act(async()=>{$(selector).value=value;$(selector).dispatchEvent(new w.Event('change',{bubbles:true}));});};
 const submit=async selector=>{await React.act(async()=>$(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true})));};
 const close=async()=>{await React.act(async()=>root.unmount());w.close();console.error=originalError;assert.deepEqual(warnings,[],'React emitted no hydration, key or controlled-field warnings');};
 return {w,$,repository,click,input,change,submit,close,errors};
}


// Active alpha UI tests; this fixture mounts rather than testing SSR hydration.
for(const locale of ['en','es']){
 test(`${locale}: real/test toggle preserves entered fields and scientific validation`,async()=>{
  const f=await fixture(locale,'app/records/new/');try{
   await f.input('#finding-scientificName','Example species');await f.click('input[value="test"]');
   assert(f.$('.finding-test-badge'));assert.equal(f.$('#finding-scientificName').value,'Example species');
   await f.submit('[data-record-form]');assert(f.$('#finding-eventDate input').getAttribute('aria-invalid'));assert.equal(f.repository.model.records().length,4);
   await f.click('input[value="real"]');assert(!f.$('.finding-test-badge'));assert.equal(f.$('#finding-scientificName').value,'Example species');
   assert(!f.$('.finding-location-preview'));assert(f.$('.finding-upload-primary'));
  }finally{await f.close();}
 });
 test(`${locale}: bordered findings table and native whole-tile group links`,async()=>{
  let f=await fixture(locale,'app/records/');try{assert(f.$('table [data-with-column-border]'));assert(f.$('table [data-with-row-border]'));}finally{await f.close();}
  f=await fixture(locale,'app/groups/');try{
   const link=f.$('.group-tile-link');assert(link);assert(link.href.includes('/app/groups/'));
   assert(![...f.w.document.querySelectorAll('.group-tile button')].some(b=>/Leave|Salir/.test(b.textContent)));
  }finally{await f.close();}
 });
 test(`${locale}: group header exposes leave through Actions only`,async()=>{
  const f=await fixture(locale,'app/groups/pacific/');try{
   assert(f.$('.group-header-description'));assert(![...f.w.document.querySelectorAll('button')].some(b=>/^(Leave group|Salir del grupo)$/.test(b.textContent)));
   assert(f.$('.group-page-header button'));await f.click('.group-page-header button');await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,60));});
   assert([...f.w.document.querySelectorAll('[role="menuitem"]')].some(n=>/Leave|Salir/.test(n.textContent)));
  }finally{await f.close();}
 });
}
test('test metadata is separate from Darwin Core scientific fields',async()=>{
 const {asOccurrence,OCCURRENCE_KEYS}=await import('../src/site/app/dwc-occurrence.mjs');const seed=PROTOTYPE.records[0];assert.equal(asOccurrence({...seed,isTest:true}).isTest,true);assert(!('isTest' in asOccurrence(seed)));assert(!OCCURRENCE_KEYS.includes('isTest'));
});
test('real and test submissions share rules and retain distinct labels',async()=>{
 const {blankOccurrence}=await import('../src/site/app/dwc-occurrence.mjs');const r=createLocalRepository(PROTOTYPE,'en');
 const input={...blankOccurrence(),groupId:'darwin-core-protocol',researchId:'',scientificName:'Testus example',basisOfRecord:'HumanObservation',eventDate:'2026-11-25',locality:'Alpha test location',associatedReferences:'https://example.org/evidence'};
 assert.throws(()=>r.addRecord({...input,isTest:true,scientificName:''}));const real=r.addRecord(input),test=r.addRecord({...input,isTest:true});
 assert(!r.model.records().find(item=>item.id===real).isTest);assert.equal(r.model.records().find(item=>item.id===test).isTest,true);
 assert.equal(r.model.journal.verification(r.model.records().find(item=>item.id===real)).status,r.model.journal.verification(r.model.records().find(item=>item.id===test)).status);
});
