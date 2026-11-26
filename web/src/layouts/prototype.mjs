import {PROTOTYPE} from '../content/prototype.mjs';
import {createPrototype} from '../site/app/prototype-core.mjs';
import {renderPrototype} from '../site/app/prototype-render.mjs';
import {COPY} from '../site/app/prototype-copy.mjs';
export function preparePrototype(document,lang,route){
 const c=COPY[lang],data=document.createElement('script');data.type='application/json';data.id='app-prototype-data';data.textContent=JSON.stringify(PROTOTYPE).replaceAll('<','\\u003c');
 const main=document.querySelector('main');main.after(data);
 if(route==='app/profile/')return;
 document.body.classList.add('prototype-page');main.className='prototype-main';main.innerHTML=`<p id="prototype-status" class="proto-status" role="status" aria-live="polite"></p><div id="prototype-root">${renderPrototype(createPrototype(PROTOTYPE),route,new URLSearchParams(),lang)}</div><div id="prototype-dialogs"></div>`;
 document.title=main.querySelector('h1')?.textContent||'Darwin Core Protocol';
 document.querySelector('meta[name="description"]')?.setAttribute('content',main.querySelector('.proto-head p:not(.proto-kicker),.scan-intro')?.textContent||c.scanIntro);
}
export const prototypeRoutes=[
 'app/','app/records/','app/records/new/','app/records/view/','app/groups/','app/search/',
 ...PROTOTYPE.groups.map(g=>`app/groups/${g.id}/`),...PROTOTYPE.records.map(r=>`app/records/${r.id}/`),...PROTOTYPE.research.map(r=>`app/research/${r.id}/`),...PROTOTYPE.proposals.map(p=>`app/groups/${p.groupId}/proposals/${p.id}/`)
];
