import {renderBrandKit} from './brand-kit.mjs';
import {prepareBlog} from './blog.mjs';
import {renderDonate} from './donate.mjs';
import {future} from '../content/future.mjs';
import {aboutCopy} from '../content/about-copy.mjs';
import {community} from '../content/community.mjs';
import {renderAboutStory} from './about-story.mjs';
import {preparePrototype} from './prototype.mjs';
import {profileDirectory,profileCopy} from '../content/profiles.mjs';
import {COPY} from '../locales/site.mjs';
import {aboutEs} from '../locales/about.mjs';
const pairs={...aboutEs};
function collect(a,b){if(typeof a==='string'&&typeof b==='string')pairs[a]=b;else if(a&&b&&typeof a==='object')for(const k of Object.keys(a))collect(a[k],b[k]);}
collect(COPY.en,COPY.es);
function addAboutSectionDivider(document){
 document.querySelector('.scroll-story > .scroll-section')?.insertAdjacentHTML('afterend','<hr class="about-section-divider">');
}
const toolArticleSlugs={
 'tools/csv-to-darwin-core/':['prepare-biodiversity-csv-darwin-core','darwin-core-archive-explained'],
 'tools/date-normalizer/':['darwin-core-event-date-format','coordinate-uncertainty-biodiversity-data'],
 'tools/duplicate-finder/':['biodiversity-data-deduplication','match-scientific-names-biodiversity-data'],
 'tools/data-workflow/':['what-is-darwin-core-standard','darwin-core-archive-explained']
};
const articleKinds={en:{Article:'Article',Guide:'Guide',News:'News'},es:{Article:'Artículo',Guide:'Guía',News:'Noticias'}};
const esc=value=>String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function prepareToolRelatedArticles(document,lang,route,articles){
 const slugs=toolArticleSlugs[route];
 if(!slugs)return;
 const related=slugs.map(slug=>articles.find(article=>article.slug===slug)).filter(Boolean);
 for(const article of articles)if(related.length<2&&!related.includes(article))related.push(article);
 if(related.length!==2)throw Error(`Tool related articles missing for ${route}`);
 const heading=[...document.querySelectorAll('.section-head')].find(node=>/Related Blog Materials|Materiales relacionados del blog/.test(node.textContent));
 const grid=heading?.nextElementSibling;
 if(!heading||!grid?.classList.contains('grid'))throw Error(`Tool related article container missing for ${route}`);
 const title=heading.querySelector('h2')?.textContent.trim()||'Related Blog Materials';
 const cards=related.map(article=>`<a class="related-card" href="/${lang}/blog/${esc(article.slug)}/"><span class="related-media"><img src="${esc(article.image)}" width="${esc(article.width)}" height="${esc(article.height)}" alt="${esc(article.alt)}" loading="lazy"></span><div class="related-copy"><span class="related-kind">${esc(articleKinds[lang][article.type]||article.type)}</span><h3>${esc(article.title)}</h3><p>${esc(article.dek)}</p></div></a>`).join('');
 heading.insertAdjacentHTML('beforebegin',`<section class="article-related tool-related" aria-labelledby="tool-related-heading"><h2 id="tool-related-heading">${esc(title)}</h2><div class="related-grid">${cards}</div></section>`);
 heading.remove();grid.remove();
}
Object.assign(pairs,{'Recent activity':'Actividad reciente','Occupation':'Ocupación','Age':'Edad','Copy':'Copiar','Edit profile':'Editar perfil','Name':'Nombre','Protocol name':'Nombre del protocolo','Birth month':'Mes de nacimiento','Birth year':'Año de nacimiento','Cancel':'Cancelar','Save changes':'Guardar cambios','Shared<br><em>work.</em>':'Trabajo<br><em>compartido.</em>','Keep the next actions, open questions, and review work visible to the people moving the protocol forward.':'Mantén visibles las próximas acciones, preguntas y revisiones para las personas que desarrollan el protocolo.','New task':'Nueva tarea','Add task':'Añadir tarea','Describe the next action':'Describe la próxima acción','Focus':'Enfoque','open tasks':'tareas abiertas','Review':'Revisión','waiting for input':'esperando aportaciones','Method':'Método','Local':'Local','stored in this browser':'guardado en este navegador','Next':'Pendiente','In progress':'En curso'});
export function localize(document,lang){
 if(lang!=='es')return;
 // Replace the smallest complete matching fragments, leaving data and markup intact.
 const nodes=[...document.querySelectorAll('body *')].reverse();
 for(const node of nodes){if(['SCRIPT','STYLE','SVG','PATH'].includes(node.tagName)||node.closest('[data-object-content],[translate="no"]'))continue;const source=node.innerHTML.trim();if(pairs[source])node.innerHTML=pairs[source];for(const attr of ['placeholder','title','aria-label']){const value=node.getAttribute(attr);if(pairs[value])node.setAttribute(attr,pairs[value]);}}
}
export function preparePage(document,lang,route,articles){
 if(route==='brand-assets/'){
   document.querySelector('main').innerHTML=renderBrandKit(lang);
   const script=document.createElement('script');script.defer=true;script.src='/brand-kit.js';document.body.append(script);
   return;
 }
 const es=lang==='es';
 if(route==='support/'){
   document.querySelector('main').outerHTML=renderDonate(lang);
   return;
 }
 if(route==='app/profile/'){
   const c=profileCopy[lang],directory=profileDirectory(lang);
   document.querySelector('.profile-main').insertAdjacentHTML('afterbegin',`<section class="profile-directory" aria-labelledby="profile-directory-title"><div class="profile-directory-heading"><h2 id="profile-directory-title">${c.find}</h2><p>${c.catalog}</p></div><div class="profile-directory-controls"><label><span class="visually-hidden">${c.search}</span><input id="profile-search" type="search" autocomplete="off" placeholder="${c.placeholder}" aria-controls="profile-search-results" aria-expanded="false"></label><a class="profile-home" href="/${lang}/app/profile/" data-profile-id="${directory.currentId}">${c.own}</a></div><p class="profile-directory-status" id="profile-search-status" role="status" aria-live="polite"></p><ul id="profile-search-results" class="profile-search-results" aria-label="${c.find}" hidden></ul></section><p id="profile-not-found" class="profile-not-found" role="status" hidden>${c.missing}</p>`);
   document.querySelector('.profile-directory').insertAdjacentHTML('beforeend',`<a id="profile-global-search" class="profile-directory-scan" href="/${lang}/app/search/?types=profiles">${es?'Buscar en la búsqueda global':'Open global search'} ↗</a>`);
   document.querySelector('.identity-copy').insertAdjacentHTML('beforeend','<div class="profile-connections"><a id="profile-records-link"></a><div id="profile-groups"></div></div>');
   const data=document.createElement('script');data.type='application/json';data.id='profile-directory-data';data.textContent=JSON.stringify({...directory,copy:c}).replaceAll('<','\\u003c');document.querySelector('.profile-main').after(data);
 }
 if(route.startsWith('app/')){preparePrototype(document,lang,route);if(route!=='app/profile/')return;}
 if(route.startsWith('tools/'))prepareToolRelatedArticles(document,lang,route,articles);
 if(['concept/','community/','future/'].includes(route)){
   document.querySelector('.intro')?.remove();
   if(route==='future/'){
     document.body.classList.add('future-page');
     document.querySelector('.scroll-story').innerHTML=renderAboutStory(lang,{...future[lang],sections:aboutCopy[lang].future},[2,2],{0:{after:0,image:future[lang].beginningImage},1:{after:0,image:future[lang].images[2]}});
     addAboutSectionDivider(document);
     document.querySelector('.page-transition')?.remove();
     return;
   }
   if(route==='community/'){
     document.body.classList.add('community-page');
     document.querySelector('.scroll-story').innerHTML=renderAboutStory(lang,{...community[lang],sections:aboutCopy[lang].community},[2,3],{1:{after:1,image:community[lang].images[2]}});
     addAboutSectionDivider(document);
     document.querySelector('.page-transition')?.remove();
     return;
   }
   if(route==='concept/'){
     const es=lang==='es';
     const images=[{src:'/assets/fern.webp',alt:es?'Un helecho desplegándose en un mosaico de caracteres verdes.':'An unfurling fern in pale green characters against deep forest-green shadows.'},{src:'/assets/frog-woodland.webp',alt:es?'Una rana sobre el musgo de un bosque, representada con caracteres.':'A frog resting on moss in a tall green woodland, rendered in tiny characters.'},{src:'/assets/blog-deer.webp',alt:es?'Un ciervo en un bosque tranquilo, representado con caracteres.':'A deer in a quiet woodland, rendered in character cells.'}];
     const copy={sections:aboutCopy[lang].concept,images,communityAction:es?'Leer más sobre la comunidad':'Read more about community',futureAction:es?'Lee sobre el futuro':'Read about Future'};
     document.querySelector('.scroll-story').innerHTML=renderAboutStory(lang,copy,[2,5],{0:{after:0,image:{src:'/assets/concept-field-researcher.webp',alt:es?'Una persona investigadora trabaja en un bosque de musgo.':'A researcher works in a mossy forest, rendered in green character cells.'}},1:{after:2,image:images[2]}});
     addAboutSectionDivider(document);
     document.querySelector('.page-transition')?.remove();
     return;
   }
 }
 if(route==='tools/'){
   document.querySelector('#tools-title').innerHTML=es?'Herramientas gratuitas<br>para trabajar con Darwin Core':'Free tools to facilitate<br>work with Darwin Core';
   document.querySelectorAll('.tool-links h2').forEach((n,i)=>n.textContent=`${i+1} — ${COPY[lang].tools[i+1]}`);
   document.querySelectorAll('.tool-links p').forEach((n,i)=>n.textContent=COPY[lang].toolDescriptions[i]);
 }
 if(route==='blog/'){
   document.querySelector('.blog-crumbs')?.remove();
   if(es)document.querySelector('#writing-title').textContent='Todo lo que querías saber sobre la ciencia descentralizada';
   prepareBlog(document,articles,lang);
 }
}
