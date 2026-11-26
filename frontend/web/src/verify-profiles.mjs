import {createPrototype,text} from './site/app/prototype-core.mjs';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
const script=fs.readFileSync('src/site/app/profile/profile.js','utf8').replace(/^import.*;$/gm,'');
function fixture(lang,query=''){
 const html=fs.readFileSync(`dist/${lang}/app/profile/index.html`,'utf8');
 const controller=html.includes('data-app-react')?'src="/assets/app/connected-':'src="/app/profile/profile.js"';assert(html.indexOf('id="profile-directory-data"')<html.indexOf(controller),'Directory data precede the active profile script');
 const {document,window:domWindow}=parseHTML(html),events={},stack=[`https://example.test/${lang}/app/profile/${query}`];let index=0;
 const window={location:{href:stack[0]},history:{pushState:(_state,_title,url)=>{stack.splice(index+1);stack.push(new URL(url,window.location.href).href);index++;window.location.href=stack[index];}},addEventListener:(type,fn)=>{events[type]=fn;},scrollTo:()=>{}};
 vm.runInNewContext(script,{document,window,URLSearchParams,app:createPrototype(JSON.parse(document.querySelector('#app-prototype-data').textContent)),text,URL,Date,JSON,navigator:{clipboard:{writeText:async()=>{}}},setTimeout:()=>0});
 return {document,window,search:value=>{const field=document.querySelector('#profile-search');field.value=value;field.dispatchEvent(new domWindow.Event('input',{bubbles:true}));},back:()=>{window.location.href=stack[--index];events.popstate();},forward:()=>{window.location.href=stack[++index];events.popstate();},input:(id,value)=>{const field=document.getElementById(id);field.value=value;field.dispatchEvent(new domWindow.Event('input',{bubbles:true}));}};
}
for(const lang of ['en','es']){
 const f=fixture(lang),d=f.document,gear=d.querySelector('[data-action="edit"]');
 assert.equal(d.querySelector('#profile-name').textContent,'Alan Li');assert(!gear.hidden);assert(d.querySelector('#profile-editor').hidden);
 const ownRadar=d.querySelector('#radar-view').innerHTML,ownActivity=d.querySelector('#activity-list').textContent;
 f.search('Maya');assert.equal(d.querySelectorAll('#profile-search-results a').length,1);
 const publicLink=d.querySelector('#profile-search-results a');assert(publicLink.getAttribute('href').endsWith('?profile=maya'));publicLink.click();
 assert.equal(d.querySelector('#profile-name').textContent,'Maya Rivers');assert(gear.hidden);assert(!d.querySelector('#profile-view').hidden);
 assert.notEqual(d.querySelector('#radar-view').innerHTML,ownRadar);assert.notEqual(d.querySelector('#activity-list').textContent,ownActivity);
 assert.equal(d.querySelectorAll('#activity-list a[href*="/records/"]').length,1);
 assert.equal(new URL(f.window.location.href).searchParams.get('profile'),'maya');
 assert([...d.querySelectorAll('.lang-menu a')].every(a=>a.getAttribute('href').includes('?profile=maya')));
 gear.click();assert(d.querySelector('#profile-editor').hidden,'Hidden gear cannot open a visitor editor');d.querySelector('[data-action="save"]').click();assert.equal(d.querySelector('#profile-name').textContent,'Maya Rivers');
 f.back();assert.equal(d.querySelector('#profile-name').textContent,'Alan Li');assert(!gear.hidden);
 f.forward();assert.equal(d.querySelector('#profile-name').textContent,'Maya Rivers');assert(gear.hidden);
 d.querySelector('.profile-home').click();assert.equal(d.querySelector('#profile-name').textContent,'Alan Li');assert(!new URL(f.window.location.href).searchParams.has('profile'));
 gear.click();assert(!d.querySelector('#profile-editor').hidden);f.input('edit-name','Alan Updated');f.input('edit-job','Field scientist');d.querySelector('[data-action="save"]').click();assert.equal(d.querySelector('#profile-name').textContent,'Alan Updated');
 f.search('maya-rivers.darwincore');d.querySelector('#profile-search-results a').click();d.querySelector('.profile-home').click();assert.equal(d.querySelector('#profile-name').textContent,'Alan Updated','Own edits survive browsing other profiles');
 gear.click();f.input('edit-name','Discard this');d.querySelector('[data-action="cancel"]').click();assert.equal(d.querySelector('#profile-name').textContent,'Alan Updated');
 f.search('ines');assert.equal(d.querySelector('#profile-search-results strong').textContent,'Inés Soler','Search tolerates accents');
 f.search('<script>alert(1)</script>');assert(d.querySelector('#profile-search-results').hidden);assert(!d.querySelector('#profile-search-results script'));
 const reloaded=fixture(lang,'?profile=maya');assert.equal(reloaded.document.querySelector('#profile-name').textContent,'Maya Rivers');assert(reloaded.document.querySelector('[data-action="edit"]').hidden);
 const missing=fixture(lang,'?profile=not-a-member');assert(!missing.document.querySelector('#profile-not-found').hidden);assert(missing.document.querySelector('#profile-view').hidden);assert(missing.document.querySelector('[data-action="edit"]').hidden);
 missing.document.querySelector('.profile-home').click();assert(!missing.document.querySelector('#profile-view').hidden);assert.equal(missing.document.querySelector('#profile-name').textContent,'Alan Li');
}
console.log('OK: bilingual profile directory, public deep links, history, per-person radar/activity, owner-only editing and session edits.');
