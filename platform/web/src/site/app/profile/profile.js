import {app} from '../prototype-client.mjs';
import {text} from '../prototype-core.mjs';
(() => {
  const es=document.documentElement.lang==='es';
  const AXES=es?['Aves','Océano profundo','Especies desconocidas','Mercados de alimentos','Insectos','Plantas']:['Birds','Deep ocean','Unknown species','Food markets','Insects','Plants'];
  const {profiles:records,currentId,copy}=JSON.parse(document.getElementById('profile-directory-data').textContent);
  const profiles=new Map();
  function refreshProfiles(){profiles.clear();app.profiles().forEach(p=>profiles.set(p.key,{...p,job:text(p.job,es?'es':'en'),activities:app.activities(p.key,es?'es':'en')}));}
  refreshProfiles();
  const months=[copy.notShown,...(es?['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']:['January','February','March','April','May','June','July','August','September','October','November','December'])];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const age=(month,year)=>!month||!year?copy.notShown:new Date().getFullYear()-year-(new Date().getMonth()<month-1?1:0);
  const locationURL=()=>new URL(window.location?.href||`https://example.test/${es?'es':'en'}/app/profile/`);
  const selectedId=()=>locationURL().searchParams.get('profile')||currentId;
  const profileURL=key=>{const url=locationURL();url.search='';url.hash='';if(key!==currentId)url.searchParams.set('profile',key);return url.pathname+url.search;};
  let currentKey=selectedId(),profile=null,draft=null;
  const ownProfile=()=>Boolean(profile&&profile.key===currentId);
  function hideSearch(){$('profile-search-results').hidden=true;$('profile-search').setAttribute('aria-expanded','false');}
  function updateLanguageLinks(){document.querySelectorAll('.lang-menu a[data-language]').forEach(link=>{const url=new URL(link.href,locationURL());url.search='';if(currentKey!==currentId)url.searchParams.set('profile',currentKey);link.setAttribute('href',url.pathname+url.search);});}
  function renderSearch(){
    const normalize=value=>value.toLocaleLowerCase(es?'es':'en').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const query=normalize($('profile-search').value.trim());
    $('profile-global-search').href=`/${es?'es':'en'}/app/search/?${new URLSearchParams({types:'profiles',q:$('profile-search').value.trim()})}`;
    refreshProfiles();
    const matches=app.search({q:query,categories:['profiles'],lang:es?'es':'en'}).map(p=>profiles.get(p.key));
    $('profile-search-results').innerHTML=matches.map(p=>`<li><a href="${profileURL(p.key)}" data-profile-id="${esc(p.key)}"${p.key===currentKey?' aria-current="true"':''}><span class="profile-search-avatar" aria-hidden="true">${esc(p.name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase())}</span><span><strong data-object-content translate="no">${esc(p.name)}</strong><small data-object-content translate="no">${esc(p.id)}</small></span>${p.key===currentId?`<span class="profile-search-you">${copy.you}</span>`:''}</a></li>`).join('');
    $('profile-search-status').textContent=matches.length?`${matches.length} ${copy.matches}`:copy.none;
    $('profile-search-results').hidden=!matches.length;$('profile-search').setAttribute('aria-expanded',String(Boolean(matches.length)));
  }
  function radar(scores){const cx=170,cy=150,r=94,n=AXES.length,point=(i,v)=>{const a=-Math.PI/2+i*Math.PI*2/n;return[cx+Math.cos(a)*r*v/10,cy+Math.sin(a)*r*v/10]};let out='<svg viewBox="0 0 340 300" role="img" aria-label="${copy.radar}">';[3.33,6.66,10].forEach(level=>out+=`<polygon points="${AXES.map((_,i)=>point(i,level).join(',')).join(' ')}" class="radar-ring"/>`);AXES.forEach((label,i)=>{const end=point(i,10),text=point(i,12.2),anchor=text[0]<cx-8?'end':text[0]>cx+8?'start':'middle';out+=`<line x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}" class="radar-axis"/><text x="${text[0]}" y="${text[1]+4}" text-anchor="${anchor}">${label}</text>`});out+=`<polygon points="${scores.map((v,i)=>point(i,v).join(',')).join(' ')}" class="radar-shape"/>`;scores.forEach((v,i)=>{const p=point(i,v);out+=`<circle cx="${p[0]}" cy="${p[1]}" r="3"/>`});return out+'</svg>'}
  function verdict(scores){const top=AXES.map((name,index)=>[name,scores[index]]).sort((a,b)=>b[1]-a[1]);let title=es?'Observador de campo curioso':'Curious field observer',copy=es?'El enfoque toma forma mientras se llena el cuaderno.':'Still finding the focus. The notebook is filling up.';if(top[0][1]>=8&&top[1][1]<6){title=es?`Especialista en ${top[0][0].toLowerCase()}`:`Pure ${top[0][0].toLowerCase()} scientist`;copy=es?'El protocolo tiene un rumbo claro.':'The protocol has a clear direction.'}else if(top[0][1]>=7&&top[1][1]>=7){title=`${es?'Explorador híbrido':'Hybrid explorer'}: ${top[0][0]} × ${top[1][0]}`;copy=es?'Explora más de un hábitat.':'Refuses to pick a single habitat.'}return `<strong>${title}</strong><span>${copy}</span>`}
  function renderView(){
    refreshProfiles();profile=profiles.get(currentKey)||null;draft=null;
    $('profile-editor').hidden=true;$('profile-view').hidden=!profile;$('profile-not-found').hidden=Boolean(profile);
    document.querySelector('[data-action="edit"]').hidden=!ownProfile();
    updateLanguageLinks();if(!profile)return;
    const p=profile;$('profile-avatar').textContent=p.name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();$('profile-name').textContent=p.name;$('protocol-id').textContent=p.id;$('profile-job').textContent=p.job||copy.notShown;$('profile-age').textContent=age(p.month,p.year);$('radar-view').innerHTML=radar(p.scores);$('profile-verdict').innerHTML=verdict(p.scores);
    $('activity-list').innerHTML=p.activities.map(activity=>`<li><span class="activity-type">${activity.type==='records'?(es?'Hallazgo':'Finding'):(es?'Votación':'Voting')}</span><span><a data-object-content translate="no" href="${esc(activity.href)}">${esc(activity.text)} ↗</a></span></li>`).join('');$('activity-list').scrollTop=0;
    const recordLink=$('profile-records-link');recordLink.textContent=`${es?'Hallazgos':'Findings'} (${app.records().filter(r=>r.authorId===p.key).length})`;recordLink.href=`/${es?'es':'en'}/app/records/?${new URLSearchParams({scope:'all',author:p.key})}`;
    $('profile-groups').innerHTML=app.groups().filter(g=>g.members.includes(p.key)).map(g=>`<a href="${app.link('groups',g.id,es?'es':'en')}">${esc(g.name)}</a>`).join(' · ');
  }
  function navigate(key){
    if(!profiles.has(key))return;
    if(key!==currentKey)window.history?.pushState(null,'',profileURL(key));
    currentKey=key;renderView();$('profile-search').value='';hideSearch();$('profile-search-status').textContent=`${copy.viewing}: ${profile.name}`;
  }
  function openEditor(){if(!ownProfile())return;draft=JSON.parse(JSON.stringify(profile));$('edit-name').value=draft.name;$('edit-id').value=draft.id;$('edit-job').value=draft.job;$('edit-month').innerHTML=months.map((name,index)=>`<option value="${index}"${index===draft.month?' selected':''}>${name}</option>`).join('');$('edit-year').innerHTML=[copy.notShown,...Array.from({length:71},(_,i)=>String(2010-i))].map(value=>`<option value="${value===copy.notShown?'':value}"${String(draft.year)===value?' selected':''}>${value}</option>`).join('');$('focus-sliders').innerHTML=AXES.map((axis,index)=>`<label>${axis}<input data-score="${index}" type="range" min="1" max="10" value="${draft.scores[index]}"><output>${draft.scores[index]}</output></label>`).join('');renderDraft();$('profile-view').hidden=true;$('profile-editor').hidden=false;document.querySelector('[data-action="edit"]').hidden=true;hideSearch();window.scrollTo?.({top:0,behavior:'smooth'})}
  function renderDraft(){$('radar-edit').innerHTML=radar(draft.scores);$('editor-verdict').innerHTML=verdict(draft.scores)}
  function closeEditor(){$('profile-editor').hidden=true;$('profile-view').hidden=false;document.querySelector('[data-action="edit"]').hidden=!ownProfile();draft=null}
  function toast(message){const node=$('profile-toast');node.textContent=message;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),1800)}
  document.addEventListener('input',event=>{if(event.target.id==='profile-search'){renderSearch();return;}if(!draft)return;const input=event.target;if(input.id==='edit-name')draft.name=input.value;if(input.id==='edit-job')draft.job=input.value;if(input.dataset.score!==undefined){draft.scores[+input.dataset.score]=+input.value;input.nextElementSibling.textContent=input.value;renderDraft()}});
  document.addEventListener('change',event=>{if(!draft)return;const input=event.target;if(input.id==='edit-month')draft.month=+input.value;if(input.id==='edit-year')draft.year=input.value?+input.value:0});
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-profile-id]');
    if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&(event.button===undefined||event.button===0)){event.preventDefault();navigate(link.dataset.profileId);return;}
    if(!event.target.closest('.profile-directory'))hideSearch();
    const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
    if(action==='edit')openEditor();
    if(action==='cancel'&&draft)closeEditor();
    if(action==='save'&&draft&&ownProfile()){app.updateProfile({...draft,name:draft.name.trim()?draft.name:profile.name,job:draft.job});renderView();toast(copy.saved);}
    if(action==='copy'&&profile){const result=navigator.clipboard?.writeText(profile.id);if(result)result.then(()=>toast(copy.copied),()=>toast(profile.id));else toast(profile.id);}
  });
  $('profile-search').addEventListener('focus',renderSearch);
  $('profile-search').addEventListener('keydown',event=>{if(event.key==='Escape')hideSearch();if(event.key==='ArrowDown'){event.preventDefault();$('profile-search-results').querySelector('a')?.focus();}if(event.key==='Enter'){const first=$('profile-search-results').querySelector('a');if(first){event.preventDefault();navigate(first.dataset.profileId);}}});
  window.addEventListener('popstate',()=>{currentKey=selectedId();renderView();$('profile-search').value='';hideSearch();$('profile-search-status').textContent=profile?`${copy.viewing}: ${profile.name}`:copy.missing;});
  renderView();
})();
