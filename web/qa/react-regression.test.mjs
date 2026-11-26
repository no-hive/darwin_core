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
const React=await import('react');const {hydrateRoot}=await import('react-dom/client');
const {Application,createLocalRepository}=await import('../.migration/qa-react.mjs');
const memory=()=>{const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};};
async function fixture(locale,route,query='',saved){
 const html=await readFile(`dist/${locale}/${route}index.html`,'utf8');
 const dom=new JSDOM(html,{url:`https://example.test/${locale}/${route}${query}`,pretendToBeVisual:true});
 const w=dom.window;globalThis.window=w;globalThis.document=w.document;
 Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
 globalThis.HTMLElement=w.HTMLElement;globalThis.FormData=w.FormData;
 w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(saved)for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,JSON.stringify(value));
 const bootstrap={...JSON.parse(document.getElementById('app-react-data').textContent),seed:JSON.parse(document.getElementById('app-prototype-data').textContent)};
 const repository=createLocalRepository(bootstrap.seed,locale),errors=[],warnings=[];
 const originalError=console.error;console.error=(...args)=>warnings.push(args.map(String).join(' '));
 let root;await React.act(async()=>{root=hydrateRoot(document.querySelector('main'),React.createElement(Application,{bootstrap,repository}),{onRecoverableError:error=>errors.push(error.message)});});
 assert.deepEqual(errors,[],'No recoverable hydration errors');
 const $=selector=>w.document.querySelector(selector);
 const click=async selector=>{assert($(selector),selector);await React.act(async()=>$(selector).click());};
 const input=async(selector,value)=>{const node=$(selector);assert(node,selector);await React.act(async()=>{const proto=node instanceof w.HTMLTextAreaElement?w.HTMLTextAreaElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new w.Event('input',{bubbles:true}));});};
 const change=async(selector,value)=>{await React.act(async()=>{$(selector).value=value;$(selector).dispatchEvent(new w.Event('change',{bubbles:true}));});};
 const submit=async selector=>{await React.act(async()=>$(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true})));};
 const close=async()=>{await React.act(async()=>root.unmount());w.close();console.error=originalError;assert.deepEqual(warnings,[],'React emitted no hydration, key or controlled-field warnings');};
 return {w,$,repository,click,input,change,submit,close,errors};
}

test('repository preserves both keys, permissions, validation, subscriptions and session-only fallback',()=>{
 const storage=memory(),r=createLocalRepository(PROTOTYPE,'en');r.restore(storage);let notifications=0;const off=r.subscribe(()=>notifications++);
 assert.throws(()=>r.vote('specimen-review','for'));r.join('mollusks');r.attach('abyssal-skate','mollusks');r.vote('specimen-review','against');
 assert.throws(()=>r.attach('reef-coral','mollusks'));
 assert.throws(()=>r.addRecord({title:'Invalid'}));
 r.updateProfile({...r.model.profile('alan-li'),name:'Saved Alan'});r.addTask('Persisted task');r.advanceTask(r.tasks[0].id);
 const loaded=createLocalRepository(PROTOTYPE,'es');loaded.restore(storage);
 assert(loaded.model.member('mollusks'));assert.equal(loaded.model.state.votes['specimen-review'],'against');assert.equal(loaded.model.profile('alan-li').name,'Saved Alan');assert.equal(loaded.tasks[0].status,'doing');assert.equal(loaded.tasks[0].title,'Persisted task');assert(notifications>=6);off();
 r.reset();assert.equal(r.model.profile('alan-li').name,'Alan Li');assert.equal(r.tasks[0].title,'Persisted task');
 r.restore({getItem:()=>'{broken',setItem:()=>{throw Error('quota');}});r.join('mollusks');assert(!r.model.storageAvailable);
 storage.setItem('dwc-shared-tasks','[]');loaded.restore(storage);assert.equal(loaded.tasks.length,0);
 const valid={id:'local-date-test',authorId:'alan-li',title:'Calendar sample',scientificName:'Testus example',description:'Example',location:'Test sector',evidence:'Note',date:'2024-02-29',groupIds:[],researchIds:[]};
 for(const date of ['2026-99-99','2026-02-30','2025-02-29']){storage.setItem('dwc-connected-prototype-v1',JSON.stringify({version:PROTOTYPE.version,records:[{...valid,date}]}));loaded.restore(storage);assert.equal(loaded.model.records().length,4,'Invalid persisted dates are ignored');}
 storage.setItem('dwc-connected-prototype-v1',JSON.stringify({version:PROTOTYPE.version,records:[valid]}));loaded.restore(storage);assert.equal(loaded.model.records().length,5,'Valid leap day survives restore');
});

for(const locale of ['en','es']){
 test(`${locale}: hydrate every App route without client recovery`,async()=>{
  const sitemap=await readFile('dist/sitemap.xml','utf8');
  const routes=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1]).pathname).filter(path=>path.startsWith(`/${locale}/app/`)).map(path=>path.slice(4));
  assert(routes.length>=17);
  for(const route of routes){const f=await fixture(locale,route);await f.close();}
 });
 test(`${locale}: live search retains input/focus, scopes categories and supports history`,async()=>{
  const f=await fixture(locale,'app/search/');try{
   const field=f.$('[data-scan-query]');await React.act(async()=>field.focus());await f.input('[data-scan-query]','maya');
   assert.equal(f.$('[data-scan-query]'),field);assert.equal(f.w.document.activeElement,field);assert.equal(f.w.document.querySelectorAll('[data-suggestion]').length,2);assert.equal(f.w.location.search,'');
   await React.act(async()=>field.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})));assert(f.w.document.activeElement.hasAttribute('data-suggestion'));
   await React.act(async()=>f.w.document.activeElement.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert(f.$('#scan-suggestions').hidden);
   await f.input('[data-scan-query]','may');await f.input('[data-scan-query]','maya');await f.click('[data-action="scan-show-all"]');assert.equal(new URL(f.w.location.href).searchParams.get('q'),'maya');assert(f.$('.scan-results'));assert(f.$('#scan-suggestions').hidden);
   await f.click('[data-category="profiles"]');assert.equal(f.w.document.querySelectorAll('[data-entity="records"]').length,0);
   await React.act(async()=>{f.w.history.replaceState(null,'',`/${locale}/app/search/?types=profiles&q=ines`);f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));});assert.equal(f.$('[data-entity="profiles"] h3').textContent,'Inés Soler');
  }finally{await f.close();}
 });
 test(`${locale}: profile deep link, owner permissions, edit/cancel/save and restored data`,async()=>{
  const f=await fixture(locale,'app/profile/','?profile=maya');try{
   assert.equal(f.$('#profile-name').textContent,'Maya Rivers');assert(f.$('[data-action="edit"]').hidden);
   await f.click('.profile-home');await f.click('[data-action="edit"]');await f.input('#edit-name','Changed Alan');await f.click('[data-action="cancel"]');assert.equal(f.$('#profile-name').textContent,'Alan Li');
   await f.click('[data-action="edit"]');await f.input('#edit-name','Saved Alan');await f.click('[data-action="save"]');assert.equal(f.$('#profile-name').textContent,'Saved Alan');
   const saved=JSON.parse(f.w.localStorage.getItem('dwc-connected-prototype-v1'));assert.equal(saved.profile.name,'Saved Alan');
   await React.act(async()=>{saved.profile.name='Updated in another tab';f.w.localStorage.setItem('dwc-connected-prototype-v1',JSON.stringify(saved));f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:'dwc-connected-prototype-v1'}));});assert.equal(f.$('#profile-name').textContent,'Updated in another tab');
   await f.input('#profile-search','ines');assert.equal(f.$('#profile-search-results strong').textContent,'Inés Soler');
   await React.act(async()=>{f.w.history.replaceState(null,'',`/${locale}/app/profile/?profile=not-real`);f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));});assert(!f.$('#profile-not-found').hidden);assert(f.$('#profile-view').hidden);
  }finally{await f.close();}
 });
 test(`${locale}: group join, attach, vote, contribution, reset and tasks`,async()=>{
  let f=await fixture(locale,'app/groups/mollusks/','?tab=records');try{
   await f.click('[data-action="join"]');await f.change('[data-attach-form] [name="record"]','abyssal-skate');await f.submit('[data-attach-form]');assert(f.repository.model.records()[0].groupIds.includes('mollusks'));
   await f.click('[data-action="reset"]');assert(f.$('#reset-dialog').open);await f.click('[data-action="confirm-reset"]');assert(!f.repository.model.member('mollusks'));
  }finally{await f.close();}
  f=await fixture(locale,'app/groups/pacific/proposals/expedition-fund/');try{await f.click('[value="for"]');await f.submit('[data-vote-form]');assert.equal(f.repository.model.state.votes['expedition-fund'],'for');assert.equal(f.$('[data-total="for"]').textContent,'30');}finally{await f.close();}
  f=await fixture(locale,'app/records/new/');try{
   for(const [key,value] of Object.entries({title:'Synthetic sample',scientificName:'Testus example',date:'2026-11-14',location:'Test sector',description:'Synthetic description',evidence:'Test evidence'}))await f.input(`[data-record-form] [name="${key}"]`,value);
   await f.change('[name="groupId"]','pacific');await f.change('[name="researchId"]','pacific-atlas');await f.submit('[data-record-form]');assert.equal(f.repository.model.records().length,5);
   const raw=JSON.parse(f.w.localStorage.getItem('dwc-connected-prototype-v1'));assert.equal(raw.records[0].title,'Synthetic sample');
  }finally{await f.close();}
  f=await fixture(locale,'app/tasks/');try{await f.input('#task-title','New safe <b>task</b>');await f.submit('#task-composer');assert.equal(f.repository.tasks.length,4);assert.equal(f.$('.task-card h3').textContent,'New safe <b>task</b>');assert(!f.$('.task-card h3 b'));await f.click('[data-task]');assert.equal(f.repository.tasks[0].status,'doing');}finally{await f.close();}
 });
}
