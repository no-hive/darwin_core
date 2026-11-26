import {createPrototype,text} from './site/app/prototype-core.mjs';
import fs from'node:fs';import vm from'node:vm';import assert from'node:assert/strict';import{parseHTML}from'linkedom';
const script=fs.readFileSync('dist/i18n.js','utf8');
function fixture(route,height=62,viewportWidth=1280,coarsePointer=false){
 const{document,window}=parseHTML(fs.readFileSync('dist'+route+'index.html','utf8'));const nav=document.querySelector('.site-nav');let timers=[],id=0;const listeners={};
 const tiles=[...nav.children].filter(n=>!n.matches('.nav-collapse,.nav-cut-border'));const widths=tiles.map(n=>n.dataset.navWidth==='2'?216:108);let left=0;const boxes=widths.map(width=>{const rect={height,left,width,top:0};left+=width;return rect;});if(route.includes('/app/')&&viewportWidth<=600)boxes.forEach((box,i)=>Object.assign(box,{height:47,left:(i%3)*108,top:Math.floor(i/3)*47}));const rect={height:route.includes('/app/')&&viewportWidth<=600?94:height,left:0,top:0,width:left+38};nav.getBoundingClientRect=()=>rect;Object.defineProperty(nav,'offsetHeight',{value:height});tiles.forEach((n,i)=>n.getBoundingClientRect=()=>boxes[i]);
 const context={document,window,location:{pathname:route},matchMedia:query=>({matches:query==='(hover:hover)'||query.includes('max-width: 700px')&&(viewportWidth<=700||viewportWidth<=1000&&coarsePointer)}),getComputedStyle:()=>({borderTopColor:'rgb(100,100,100)',top:'105px'}),setTimeout:f=>{timers.push({id:++id,f});return id;},clearTimeout:i=>{timers=timers.filter(t=>t.id!==i);},addEventListener:(name,f)=>{listeners[name]=f;},scrollY:0};
 const visual=document.querySelector('.scroll-section .scroll-visual');if(visual)visual.getBoundingClientRect=()=>({top:105-Math.max(0,context.scrollY-300)});
 context.window={addEventListener:(name,f)=>{listeners[name]=f;},removeEventListener:()=>{}};
 vm.createContext(context);vm.runInContext(script,context);
 return{document,nav,tiles,context,setWidth:width=>{viewportWidth=width;listeners.resize();},scroll:y=>{context.scrollY=y;listeners.scroll();},next:()=>{const t=timers.shift();t?.f();return !!t;},flush:()=>{let n=0;while(timers.length){assert(n++<100);timers.shift().f();}}};
}
for(const height of [52,62])for(const route of ['/en/tools/','/es/tools/','/en/tools/date-normalizer/']){
 const f=fixture(route,height);f.scroll(100);let frames=0;
 const verifyOutline=()=>{const cut=f.nav.querySelector('.nav-fold-cut:not(.nav-folded)');assert(cut,'Clipped frontier exists');assert.equal(f.nav.querySelector('.nav-cut-border').style.display,'block','Border exists on every intermediate frame');const polygon=f.nav.querySelector('.nav-cut-border polygon');assert(polygon.getAttribute('stroke'));const points=polygon.getAttribute('points').split(' ').map(p=>p.split(',').map(Number));assert.equal(points.length,4,'Every cut has a closed quadrilateral outline');const box=cut.getBoundingClientRect();const index=f.tiles.indexOf(cut);assert.equal(Math.sign(points[3][0]-points[0][0]),index%2===1?1:-1,'Slopes alternate');assert.equal(points[0][1],.5);assert.equal(points[3][1],height-.5);assert.equal(points[1][0],box.left+box.width-.5);assert.equal(Math.abs(points[3][0]-points[0][0]),18);};
 while(!f.nav.classList.contains('is-collapsed')){verifyOutline();frames++;assert(f.next());}
 assert.equal(frames,f.tiles.length-1);f.scroll(0);while(f.nav.querySelector('.nav-fold-cut')){verifyOutline();assert(f.next());}f.flush();assert(!f.nav.classList.contains('is-collapsed'));assert(!f.nav.querySelector('.nav-fold-cut,.nav-folded'));
 f.scroll(100);f.flush();f.nav.querySelector('.nav-collapse').click();f.flush();f.scroll(400);f.flush();assert(!f.nav.classList.contains('is-collapsed'),'Manual opening pins navigation');
 const trigger=f.nav.querySelector('.lang-trigger');trigger.click();assert.equal(trigger.getAttribute('aria-expanded'),'true');
}
const blog=fixture('/en/blog/');assert(!blog.nav.classList.contains('is-collapsed'));
for(const lang of ['en','es'])for(const width of [320,375,390,430,700,844,932]){
 const f=fixture(`/${lang}/`,48,width,true);
 f.scroll(1200);f.flush();
 assert(!f.nav.classList.contains('is-collapsed'),'Mobile Concept keeps its navigation visible');
 assert(!f.nav.classList.contains('is-animating'),'Mobile Concept has no folding animation');
 f.nav.querySelector('.lang-trigger').click();assert(f.nav.querySelector('.lang-dropdown').classList.contains('is-open'),'Touch language selection works');
 f.nav.querySelector('.nav-collapse').click();f.flush();assert(!f.nav.classList.contains('is-collapsed'),'Hidden desktop controls cannot collapse the mobile navigation');
}
for(const lang of ['en','es']){
 const f=fixture(`/${lang}/`);f.scroll(500);assert(f.nav.classList.contains('is-animating'));
 f.setWidth(390);f.flush();assert(!f.nav.classList.contains('is-collapsed'));assert(!f.nav.querySelector('.nav-folded,.nav-fold-cut'),'Entering mobile mode clears interrupted frames');
 f.setWidth(1280);f.flush();assert(f.nav.classList.contains('is-collapsed'),'Desktop behavior returns after leaving mobile mode');
}
{
 const f=fixture('/en/');let focused=false;
 const first=f.nav.querySelector('.nav-menu a');first.focus=()=>{focused=true;};
 const event=new f.document.defaultView.Event('keydown',{bubbles:true,cancelable:true});
 event.key='ArrowDown';f.nav.querySelector('.nav-trigger').dispatchEvent(event);
 assert(focused,'ArrowDown focuses the first submenu item, not the About trigger');
}
for(const file of fs.readdirSync('dist',{recursive:true}).filter(file=>/^(en|es)\//.test(file)&&file.endsWith('/index.html'))){
 if(fs.readFileSync('dist/'+file,'utf8').includes('http-equiv="refresh"'))continue;
 const route='/'+file.replace(/index\.html$/,'');const f=fixture(route);assert(!f.nav.classList.contains('is-collapsed'),`Navigation stays visible after initialization: ${route}`);assert.equal(f.nav.querySelector('.nav-collapse').getAttribute('aria-expanded'),'true');
}
for(const route of ['/en/','/es/tools/']){
 const f=fixture(route);const about=f.nav.querySelector('.nav-trigger');assert.equal(about.tagName,'A');assert.equal(about.getAttribute('href'),route.startsWith('/es/')?'/es/':'/en/');
 f.scroll(400);assert(f.nav.querySelector('.nav-fold-cut'));f.nav.querySelector('.nav-collapse').click();assert(!f.nav.classList.contains('is-collapsed'));assert(!f.nav.classList.contains('is-animating'));assert(!f.nav.querySelector('.nav-fold-cut'));f.flush();assert(!f.nav.classList.contains('is-collapsed'),'Interrupted auto-fold cannot continue after a manual click');
 f.nav.querySelector('.nav-collapse').click();assert(f.nav.classList.contains('is-animating'),'Manual closing on the main site is animated');f.flush();assert(f.nav.classList.contains('is-collapsed'));f.nav.querySelector('.nav-collapse').click();assert(f.nav.classList.contains('is-animating'),'Manual opening on the main site is animated');f.flush();assert(!f.nav.classList.contains('is-collapsed'));
}
for(const lang of ['en','es'])for(const page of ['','deeper/','ocean/']){
 const f=fixture(`/${lang}/${page}`);
 f.scroll(100);f.flush();assert(!f.nav.classList.contains('is-collapsed'),'About remains open after the old navigation-height threshold');
 f.scroll(300);f.flush();assert(!f.nav.classList.contains('is-collapsed'),'About remains open while its image is sticky');
 f.scroll(302);assert(f.nav.classList.contains('is-animating'),'About starts folding when its image moves upward');f.flush();assert(f.nav.classList.contains('is-collapsed'));
 f.scroll(300);f.flush();assert(!f.nav.classList.contains('is-collapsed'),'About unfolds when the image returns to its sticky position');
 f.scroll(500);f.flush();f.nav.querySelector('.nav-collapse').click();f.flush();f.scroll(900);f.flush();assert(!f.nav.classList.contains('is-collapsed'),'Manual opening still pins the About menu');
}
for(const lang of ['en','es'])for(const page of ['','profile/','records/','groups/','search/']){
 const f=fixture(`/${lang}/app/${page}`);assert(!f.nav.classList.contains('is-collapsed'),'App starts expanded');
 assert.equal(f.nav.querySelectorAll('a.app-section-link').length,3);
 f.scroll(900);assert(f.nav.classList.contains('is-animating'),'App auto-fold is animated');assert(f.nav.querySelector('.nav-fold-cut'));f.flush();assert(f.nav.classList.contains('is-collapsed'));
 f.scroll(0);assert(f.nav.classList.contains('is-animating'),'Reverse auto-unfold is animated');f.flush();assert(!f.nav.classList.contains('is-collapsed'));
 f.nav.querySelector('.nav-collapse').click();assert(f.nav.classList.contains('is-animating'));f.flush();assert(f.nav.classList.contains('is-collapsed'));
 f.nav.querySelector('.nav-collapse').click();assert(f.nav.classList.contains('is-animating'));f.flush();f.scroll(1200);f.flush();assert(!f.nav.classList.contains('is-collapsed'),'Manual opening pins App navigation');
 const dropdown=f.nav.querySelector('.records-dropdown');assert.equal(dropdown.querySelectorAll('.nav-menu a').length,3);assert(!dropdown.querySelector('.nav-submenu-toggle'),'Findings has no separate arrow');const event=new f.document.defaultView.Event('keydown',{bubbles:true,cancelable:true});event.key='ArrowDown';dropdown.querySelector('.nav-menu a').focus=()=>{};dropdown.querySelector('.nav-trigger').dispatchEvent(event);assert(dropdown.classList.contains('is-open'));
}
for(const lang of ['en','es'])for(const width of [390,1280]){
 const f=fixture(`/${lang}/app/records/`,62,width);const menu=f.nav.querySelector('.records-dropdown');menu.dispatchEvent(new f.document.defaultView.Event('mouseenter'));assert(menu.classList.contains('is-open'),'Findings opens on hover');
 f.scroll(900);let frames=0;while(!f.nav.classList.contains('is-collapsed')){const cut=f.nav.querySelector('.nav-fold-cut');assert(cut);const box=cut.getBoundingClientRect(),points=f.nav.querySelector('.nav-cut-border polygon').getAttribute('points').split(' ').map(point=>point.split(',').map(Number));assert.equal(points[0][1],box.top+.5);assert.equal(points[3][1],box.top+box.height-.5);assert.equal(f.nav.querySelector('.nav-cut-border polygon').getAttribute('stroke-width'),'1');frames++;assert(f.next());}assert(frames>2);
}
assert.equal(blog.nav.querySelector('.nav-cut-border polygon').getAttribute('stroke-width'),'1','Outline matches the ordinary 1px navigation border');
assert.equal(blog.nav.querySelector('.nav-cut-border polygon').getAttribute('vector-effect'),'non-scaling-stroke','Outline width stays constant at every size');
for(const lang of['en','es']){
 const{document,window}=parseHTML(fs.readFileSync(`dist/${lang}/app/profile/index.html`,'utf8'));const context={document,window,URLSearchParams,app:createPrototype(JSON.parse(document.querySelector('#app-prototype-data').textContent)),text,URL,Date,JSON,navigator:{clipboard:{writeText:async()=>{}}},setTimeout:()=>0};window.scrollTo=()=>{};vm.createContext(context);vm.runInContext(fs.readFileSync('src/site/app/profile/profile.js','utf8').replace(/^import.*;$/gm,''),context);assert(document.querySelector('#radar-view svg'));assert.equal(document.querySelectorAll('#activity-list a[href*="/records/"]').length,1);document.querySelector('[data-action="edit"]').click();assert.equal(document.querySelector('#profile-editor').hidden,false);document.querySelector('[data-action="cancel"]').click();assert.equal(document.querySelector('#profile-view').hidden,false);
}
for(const lang of ['en','es'])for(const page of ['','deeper/','ocean/']){
 const{document}=parseHTML(fs.readFileSync(`dist/${lang}/${page}index.html`,'utf8'));let visualHeight=650,textHeight=180,nextTop=900,summaryBottom=700;const listeners={};
 for(const summary of document.querySelectorAll('.concept-explainer summary')){summary.getBoundingClientRect=()=>({height:64,bottom:summaryBottom});summary.parentElement.getBoundingClientRect=()=>({width:340});}
 for(const body of document.querySelectorAll('.concept-explainer-body'))body.getBoundingClientRect=()=>({height:120});
 for(const group of document.querySelectorAll('.story-explainers'))group.getBoundingClientRect=()=>({bottom:summaryBottom});
 for(const section of document.querySelectorAll('.scroll-section')){section.querySelector('.scroll-visual').getBoundingClientRect=()=>({height:visualHeight});const first=section.querySelector('.scroll-content').firstElementChild;first.getBoundingClientRect=()=>({height:textHeight+first.querySelectorAll('.concept-explainer[open] .concept-explainer-body').length*120});const last=[...section.querySelector('.scroll-content').children].at(-1);last.getBoundingClientRect=()=>({height:textHeight,top:nextTop});}
 const context={document,Math,addEventListener:(name,fn)=>{listeners[name]=fn;}};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/about-scroll.js','utf8'),context);
 if(page)for(const content of document.querySelectorAll('.scroll-content'))assert.equal(content.style.getPropertyValue('--about-first-block-height'),'180px','Centering uses actual first block height');
 const placeholder=document.querySelector('.audience-image-placeholder');if(placeholder){assert(!document.querySelector('.audience-professions'));assert.equal(placeholder.style.getPropertyValue('--audience-image-height'),'66px','Image slot matches closed hint height');assert.equal(placeholder.style.getPropertyValue('--audience-image-width'),'340px','Image slot matches hint width');}
 for(const details of document.querySelectorAll('.concept-explainer')){
   const content=details.closest('.scroll-content');const reserve=content.style.getPropertyValue('--about-release-space');const inset=content.style.getPropertyValue('--about-first-block-height');
   assert(!details.hasAttribute('open'),'Hints start closed');
   details.setAttribute('open','');details.dispatchEvent(new document.defaultView.Event('toggle'));
   assert.equal(content.style.getPropertyValue('--about-first-block-height'),inset,'Opening adds content below without changing the leading inset');
   assert.equal(content.style.getPropertyValue('--about-release-space'),reserve,'Image release stays stable when measured content height is unchanged');
   assert.equal(details.querySelector('.concept-explainer-body').getAttribute('tabindex'),'0','Hint content is keyboard-focusable');
   details.removeAttribute('open');details.dispatchEvent(new document.defaultView.Event('toggle'));
   assert.equal(content.style.getPropertyValue('--about-first-block-height'),inset,'Closing also preserves the leading inset');
 }
 nextTop=780;listeners.resize();
 for(const [v,t]of [[650,180],[280,100],[650,800]]){
   visualHeight=v;textHeight=t;listeners.resize();
   for(const content of document.querySelectorAll('.scroll-content')){const reserve=parseFloat(content.style.getPropertyValue('--about-release-space'));assert(reserve>=0);assert(textHeight/2+reserve>=visualHeight/2,'At release, the last text center has reached the image center');}
 }
}
assert.match(fs.readFileSync('dist/style.css','utf8'),/\.concept-explainer-body\{position:static;max-height:none;overflow:visible;/,'Hints expand in document flow without overlay or inner scrolling');
console.log('OK: navigation animation and App modes, profile editor, About image release and expanding in-flow hints.');
