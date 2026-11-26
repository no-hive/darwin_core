import {OCCURRENCE_KEYS,occurrenceSummary,occurrenceTitle} from './dwc-occurrence.mjs';
import {DWC_COPY} from './dwc-views.mjs';
import {app} from './prototype-client.mjs';
import {renderPrototype,renderContribution,esc} from './prototype-render.mjs';
import {COPY} from './prototype-copy.mjs';
import {text} from './prototype-core.mjs';
const lang=document.documentElement.lang,c=COPY[lang],root=document.getElementById('prototype-root');
const route=()=>location.pathname.replace(/^\/(en|es)\//,''),params=()=>new URL(location.href).searchParams;
function syncLanguages(){document.querySelectorAll('.lang-menu a').forEach(a=>{const target=new URL(a.href,location.href);target.search=location.search;target.hash=location.hash;a.href=target.pathname+target.search+target.hash;});}
function status(message){const node=document.getElementById('prototype-status');node.textContent=message+(app.storageAvailable?'':` ${c.sessionOnly}`);}
function render(){root.innerHTML=renderPrototype(app,route(),params(),lang);document.title=(root.querySelector('h1')?.textContent||'App')+'. Darwin Core Protocol.';document.getElementById('prototype-dialogs').innerHTML=`<dialog class="proto-dialog" id="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">${c.resetConfirm}</h2><p>${c.resetDescription}</p><div class="proto-actions"><button class="proto-button" data-action="close-dialog">${c.cancel}</button><button class="proto-button proto-primary" data-action="confirm-reset">${c.confirmReset}</button></div></dialog>`;syncLanguages();}
function updateParams(values){const url=new URL(location.href);for(const [key,value] of Object.entries(values)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.pushState(null,'',url.pathname+url.search);render();}
function hideSuggestions(){const panel=root.querySelector('#scan-suggestions');if(panel)panel.hidden=true;root.querySelector('[data-scan-query]')?.setAttribute('aria-expanded','false');}
function showSuggestions(input){
 const panel=root.querySelector('#scan-suggestions'),q=input.value.trim();if(!panel)return;if(!q){panel.innerHTML='';hideSuggestions();return;}
 const filters=params(),types=['profiles','records','groups','research'];
 const selected=(filters.get('types')||'').split(',').filter(type=>types.includes(type));
 const matches=app.search({q,categories:selected.length?selected:types,scope:filters.get('scope')==='mine'?'mine':'all',groupId:filters.get('group')||'',authorId:filters.get('author')||'',lang});
 const prefix=q.toLowerCase();
 matches.sort((a,b)=>Number(text(b.title,lang).toLowerCase().startsWith(prefix))-Number(text(a.title,lang).toLowerCase().startsWith(prefix)));
 const items=matches.slice(0,6),categories=types.filter(type=>items.some(item=>item.entityType===type));
 let suggestionIndex=0;
 const widgets=categories.map((type,index)=>{
   const entries=items.filter(item=>item.entityType===type);
   const span=categories.length===1?12:categories.length===3?(index===0?12:index===1?5:7):index%2===0?(index===0?4:7):(index===1?8:5);
   return `<section class="scan-suggestion-widget" data-suggestion-widget="${type}" style="--widget-span:${span}" aria-labelledby="scan-widget-${type}"><header><h2 id="scan-widget-${type}">${c[type]}</h2><span>${entries.length}</span></header><ul>${entries.map(item=>{
     const detail=type==='profiles'?item.id:type==='records'?occurrenceSummary(item):text(item.description,lang);
     const initials=text(item.title,lang).split(/\s+/).slice(0,2).map(word=>word[0]).join('');
     return `<li><a id="scan-suggestion-${suggestionIndex++}" data-suggestion data-suggestion-type="${type}" href="${esc(app.link(type,item.entityId,lang))}">${type==='profiles'?`<span class="scan-suggestion-avatar" aria-hidden="true">${esc(initials)}</span>`:''}<span class="scan-suggestion-copy"><strong data-object-content translate="no">${esc(text(item.title,lang))}</strong><small data-object-content translate="no">${esc(detail)}</small></span><span class="scan-suggestion-arrow" aria-hidden="true">↗</span></a></li>`;
   }).join('')}</ul></section>`;
 }).join('');
 panel.innerHTML=`<p class="scan-suggestions-heading">${c.suggestions}<span role="status" aria-live="polite">${matches.length} ${c.results}</span></p>${items.length?`<div class="scan-suggestion-grid">${widgets}</div><button class="scan-suggestions-all" type="button" data-action="scan-show-all">${c.viewAllResults} (${matches.length}) →</button>`:`<p class="scan-suggestions-empty">${c.empty}</p>`}`;
 panel.hidden=false;input.setAttribute('aria-expanded','true');
}
document.addEventListener('input',event=>{if(event.target.matches('[data-scan-query]'))showSuggestions(event.target);});
document.addEventListener('focusin',event=>{if(event.target.matches('[data-scan-query]')&&event.target.value.trim())showSuggestions(event.target);});
document.addEventListener('keydown',event=>{
 const panel=root.querySelector('#scan-suggestions'),input=root.querySelector('[data-scan-query]');if(!panel||!input||panel.hidden)return;
 const inInput=event.target===input,inPanel=Boolean(event.target.closest('#scan-suggestions'));if(!inInput&&!inPanel)return;
 if(event.key==='Escape'){event.preventDefault();if(inPanel)input.focus();hideSuggestions();return;}
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
  const links=[...panel.querySelectorAll('[data-suggestion]')];if(!links.length)return;event.preventDefault();
  if(inInput){(event.key==='ArrowDown'?links[0]:links.at(-1)).focus();return;}
  const index=links.indexOf(event.target.closest('[data-suggestion]')),next=index+(event.key==='ArrowDown'?1:-1);
  if(next>=0&&next<links.length)links[next].focus();else input.focus();
 }
});
function openContribution(){location.href=`/${lang}/app/records/new/${location.search}`;}
function value(form,name){return form.querySelector(`[name="${name}"]`)?.value||'';}
document.addEventListener('submit',event=>{
 const form=event.target;
 if(form.matches('[data-search-form]')){event.preventDefault();updateParams({q:value(form,'q')});return;}
 if(form.matches('[data-filter-form]')){event.preventDefault();const values={};form.querySelectorAll('[name]').forEach(input=>values[input.name]=input.value);updateParams(values);return;}
 if(form.matches('[data-record-form]')){event.preventDefault();try{const input=Object.fromEntries([...OCCURRENCE_KEYS,'groupId','researchId'].map(key=>[key,value(form,key)]));const id=app.addRecord(input);document.getElementById('contribution-dialog')?.close();history.pushState(null,'',app.link('records',id,lang));render();status(c.saved);}catch(error){form.querySelector('.proto-form-status').textContent=error.message==='permission'?c.permission:error.message.startsWith('dwc:')?DWC_COPY[lang].invalid+': '+error.message.slice(4):c.required;}return;}
 if(form.matches('[data-attach-form]')){event.preventDefault();try{app.attach(value(form,'record'),form.dataset.group);render();status(c.attachedSaved);}catch{status(c.permission);}return;}
 if(form.matches('[data-vote-form]')){event.preventDefault();try{const choice=form.querySelector('input:checked')?.value;app.vote(form.dataset.proposal,choice);render();status(c.voteSaved);}catch{status(c.permission);}}
});
document.addEventListener('change',event=>{
 if(event.target.matches('[data-category]')){const categories=[...root.querySelectorAll('[data-category]:checked')].map(input=>input.dataset.category);updateParams({types:categories.join(','),q:root.querySelector('[data-search-form] [name="q"]')?.value.trim()||''});}
 if(event.target.matches('[data-record-form] [name="groupId"]')){const groupId=event.target.value,select=event.target.form.querySelector('[name="researchId"]');select.innerHTML=`<option value="">${c.none}</option>`+app.seed.research.filter(r=>r.groupIds.some(id=>app.member(id))&&(!groupId||r.groupIds.includes(groupId))).map(r=>`<option value="${r.id}">${esc(occurrenceTitle(r))}</option>`).join('');}
});
document.addEventListener('click',event=>{
 if(!event.target.closest('.scan-search'))hideSuggestions();
 const link=event.target.closest('a'),target=link?new URL(link.getAttribute('href'),location.href):null;if(target&&target.hash==='#contribute'&&target.pathname===location.pathname){event.preventDefault();openContribution();return;}
 const button=event.target.closest('[data-action]');if(!button)return;
 if(button.dataset.action==='scan-show-all'){updateParams({q:root.querySelector('[data-scan-query]').value.trim()});return;}
 if(button.dataset.action==='close-dialog'){button.closest('dialog')?.close();return;}
 if(button.dataset.action==='reset'){document.getElementById('reset-dialog').showModal();return;}
 if(button.dataset.action==='confirm-reset'){app.reset();render();status(c.resetDone);return;}
 if(['join','leave'].includes(button.dataset.action)){try{app[button.dataset.action](button.dataset.group);render();status(c.membershipSaved);}catch{status(c.permission);}}
});
window.addEventListener('popstate',render);render();if(location.hash==='#contribute')openContribution();
