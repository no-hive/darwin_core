import {renderBrandKit} from './brand-kit.mjs';
import {prepareBlog} from './blog.mjs';
import {renderDonate} from './donate.mjs';
import {future} from '../content/future.mjs';
import {renderAboutStory,configureAboutSwap} from './about-story.mjs';
import {ctaChevron} from './about-story.mjs';
import {preparePrototype} from './prototype.mjs';
import {profileDirectory,profileCopy} from '../content/profiles.mjs';
import {COPY} from '../locales/site.mjs';
import {aboutEs} from '../locales/about.mjs';
import {conceptIntro} from '../content/concept.mjs';
import {renderCommunity} from './community.mjs';
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
     document.querySelector('.scroll-story').innerHTML=renderAboutStory(lang,future[lang],[2,3],{0:{after:0,image:future[lang].beginningImage},1:{after:1,image:future[lang].images[2]}});
     addAboutSectionDivider(document);
     document.querySelector('.page-transition')?.remove();
     return;
   }
   if(route==='community/'){
     document.body.classList.add('community-page');
     document.querySelector('.scroll-story').innerHTML=renderCommunity(lang);
     addAboutSectionDivider(document);
     document.querySelector('.page-transition')?.remove();
     return;
   }
   if(route==='concept/'){
     const intro=conceptIntro[lang],firstContent=document.querySelector('.scroll-section .scroll-content');
     firstContent.classList.add('concept-intro-content');
     firstContent.innerHTML=`<article class="scroll-copy concept-intro" data-about-story><h2>${intro.heading}</h2>${intro.paragraphs.map(p=>`<p>${p}</p>`).join('')}<details class="concept-explainer"><summary><span>${intro.summary}</span><i aria-hidden="true">+</i></summary><div class="concept-explainer-body" tabindex="0"><p>${intro.explanation}</p></div></details></article>`;
     firstContent.insertAdjacentHTML('beforeend',`<article class="scroll-copy concept-audience" data-about-story><h2>${intro.audienceHeading}</h2><p>${intro.audienceText}</p></article>`);
     const audience=firstContent.querySelector('.concept-audience');
     audience.insertAdjacentHTML('beforebegin',`<article class="scroll-copy concept-issue" data-about-story><h2>${intro.issueHeading}</h2><p>${intro.issueText}</p></article>`);
     configureAboutSwap(firstContent.closest('.scroll-section'),firstContent.querySelector('.concept-issue'),audience,{
       src:'/assets/concept-field-researcher.webp',
       alt:es?'Una persona con auriculares trabaja con equipo electrónico portátil en un bosque de musgo, en un mosaico de caracteres verdes.':'A researcher wearing headphones works with portable electronic equipment in a mossy forest, rendered in green character cells.'
     });
     const secondContent=document.querySelectorAll('.scroll-section .scroll-content')[1];
     secondContent.classList.add('concept-middle-content');
     secondContent.innerHTML=`<article class="scroll-copy concept-record" data-about-story><h2>${intro.recordHeading}</h2></article><article class="scroll-copy concept-privacy" data-about-story><h2>${intro.privacyHeading}</h2><p>${intro.privacyIntro}</p><details class="concept-explainer concept-privacy-example"><summary><span>${intro.privacyExampleSummary}</span><i aria-hidden="true">+</i></summary><div class="concept-explainer-body" tabindex="0">${intro.privacyExampleParagraphs.map(p=>`<p>${p}</p>`).join('')}</div></details></article><article class="scroll-copy concept-process" data-about-story><h2>${intro.processHeading}</h2>${intro.processParagraphs.map(p=>`<p>${p}</p>`).join('')}</article>`;
   }
   const next='community/';
   const label=es?'Leer más sobre la comunidad':'Read more about community';
   const futureLabel=es?'Lee sobre el futuro':'Read about Future';
   const last=[...document.querySelectorAll('[data-about-story]')].at(-1);
   if(last)last.outerHTML=`<div class="about-actions"><a class="about-action about-action-primary" data-cta-image="app" href="/${lang}/app/">${es?'Probar la app':'Try our app'}${ctaChevron}</a><a class="about-action about-action-secondary" href="/${lang}/${next}">${label}${ctaChevron}</a></div>`;
   if(route==='concept/'){
     const actions=document.querySelector('.about-actions');
     actions.parentElement.classList.add('concept-final-content');
     const contribution=conceptIntro[lang];
     actions.insertAdjacentHTML('beforebegin',`<article class="scroll-copy concept-contribution" data-about-story><h2>${contribution.contributionHeading}</h2><p>${contribution.contributionText}</p></article>`);
     actions.innerHTML=`<a class="about-action about-action-primary" data-cta-image="community" href="/${lang}/community/"><span class="cta-copy"><strong class="cta-title">${label}</strong></span>${ctaChevron}</a><a class="about-action about-action-secondary" data-cta-image="future" href="/${lang}/future/"><span class="cta-copy"><strong class="cta-title">${futureLabel}</strong></span>${ctaChevron}</a>`;
     const finalSection=actions.closest('.scroll-section');
     const deer=finalSection.querySelector('.scroll-visual img');
     const deerImage={src:deer.getAttribute('src'),alt:deer.getAttribute('alt')};
     const middle=document.querySelector('.concept-middle-content');
     const contributionBlock=finalSection.querySelector('.concept-contribution');
     middle.append(contributionBlock,actions);
     configureAboutSwap(middle.closest('.scroll-section'),middle.querySelector('.concept-process'),contributionBlock,deerImage);
     finalSection.remove();
     addAboutSectionDivider(document);

   }
   document.querySelector('.page-transition')?.remove();
 }
 if(route==='tools/'){
   document.querySelector('#tools-title').innerHTML=es?'Herramientas gratuitas<br>para trabajar con Darwin Core':'Free tools to facilitate<br>work with Darwin Core';
   document.querySelectorAll('.tool-links h2').forEach((n,i)=>n.textContent=`${i+1} — ${COPY[lang].tools[i+1]}`);
   document.querySelectorAll('.tool-links p').forEach((n,i)=>n.textContent=COPY[lang].toolDescriptions[i]);
 }
 if(route==='blog/'){
   document.querySelector('.blog-crumbs')?.remove();
   prepareBlog(document,articles,lang);
 }
}
