import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import postcss from 'postcss';

const html=fs.readFileSync('dist/en/app/tasks/index.html','utf8');
const app=fs.readFileSync('src/site/app/app.js','utf8');
function loadTasks(saved){
  const {document}=parseHTML(html);
  vm.runInNewContext(app,{document,localStorage:{getItem:()=>JSON.stringify(saved),setItem:()=>{}}});
  return document;
}
for(const saved of [null,{},[null],[7],[{id:'x',title:'Broken',status:'unknown',owner:'Test'}],
  [{id:'duplicate',title:'A',status:'next',owner:'Test'},{id:'duplicate',title:'B',status:'next',owner:'Test'}]]){
  const document=loadTasks(saved);
  assert.equal(document.querySelectorAll('.task-card').length,3,'Malformed persisted tasks fall back safely');
}
assert.equal(loadTasks([]).querySelectorAll('.task-card').length,0,'An empty saved board stays empty');
const hostile=loadTasks([{id:'x',title:'<img src=x onerror=alert(1)>',status:'next',owner:'<script>alert(1)</script>'}]);
assert.equal(hostile.querySelectorAll('.task-card img,.task-card script').length,0,'Task text cannot become markup');
assert.equal(hostile.querySelector('.task-card h3').textContent,'<img src=x onerror=alert(1)>');

const metrics=fs.readFileSync('dist/metrics.js','utf8');
for(const enabled of [false,true]){
  const {document}=parseHTML(html);let requests=0;
  if(enabled)document.body.dataset.metricsEndpoint='/configured-test-endpoint';
  vm.runInNewContext(metrics,{document,window:{},fetch:url=>{assert.equal(url,'/configured-test-endpoint');requests++;return Promise.resolve({});}});
  assert.equal(requests,enabled?1:0,'Analytics sends only to an explicitly configured endpoint');
}
for(const file of fs.readdirSync('src/site',{recursive:true}).filter(file=>file.endsWith('.js'))){
  execFileSync(process.execPath,['--check',`src/site/${file}`],{stdio:'pipe'});
}
// Mobile layout rules must never leak into desktop or other pages.
const mobile=postcss.parse(fs.readFileSync('src/styles/concept-mobile.css','utf8'));
assert(mobile.nodes.every(node=>node.type==='comment'||node.type==='atrule'&&node.name==='media'&&node.params==='(max-width:700px), (max-width:1000px) and (pointer:coarse)'));
mobile.walkRules(rule=>assert(rule.selectors.every(selector=>selector.includes('.concept-page')),'Mobile layout is scoped to Concept'));
for(const lang of ['en','es']){
 const {document}=parseHTML(fs.readFileSync(`dist/${lang}/index.html`,'utf8'));
 let width=390;const listeners={};
 // Reading geometry should not be requested at all in the static mobile mode.
 document.querySelectorAll('.scroll-visual,.scroll-copy,.concept-explainer summary').forEach(node=>{
   node.getBoundingClientRect=()=>{throw new Error('Mobile Concept must not measure sticky reading geometry');};
 });
 document.querySelectorAll('.scroll-content').forEach(node=>node.style.setProperty('--about-release-space','240px'));
 const banner=document.querySelector('.audience-image-placeholder');banner.style.setProperty('--audience-image-width','500px');banner.style.setProperty('--audience-image-height','66px');
 vm.runInNewContext(fs.readFileSync('dist/about-scroll.js','utf8'),{document,Math,matchMedia:()=>({matches:width<=700}),addEventListener:(name,fn)=>{listeners[name]=fn;}});
 for(const node of document.querySelectorAll('.scroll-content'))assert.equal(node.style.getPropertyValue('--about-release-space')||'','');
 assert.equal(banner.style.getPropertyValue('--audience-image-width')||'','');
 listeners.resize();
 const event=new document.defaultView.Event('toggle');document.querySelector('.concept-explainer').dispatchEvent(event);
 for(const section of document.querySelectorAll('.scroll-section')){
   section.querySelector('.scroll-visual').getBoundingClientRect=()=>({height:600});
   [...section.querySelector('.scroll-content').children].at(-1).getBoundingClientRect=()=>({height:200,top:900});
 }
 for(const summary of document.querySelectorAll('.concept-explainer summary')){
   summary.getBoundingClientRect=()=>({height:64,bottom:700});
   summary.parentElement.getBoundingClientRect=()=>({width:340});
 }
 width=1280;listeners.resize();
 for(const node of document.querySelectorAll('.scroll-content'))assert.equal(node.style.getPropertyValue('--about-release-space'),'201px','Desktop reading reserves return after resizing');
 assert.equal(banner.style.getPropertyValue('--audience-image-width'),'340px','Desktop banner sizing returns after resizing');
}
console.log('OK: persisted task types, safe task text, analytics, script syntax and isolated static mobile Concept.');
