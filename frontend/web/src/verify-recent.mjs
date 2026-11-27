import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';import {findingNouns} from './lib/wording.mjs';
const css=fs.readFileSync('dist/style.css','utf8');let count=0;
for(const file of fs.readdirSync('dist',{recursive:true}).filter(file=>/^(en|es)\//.test(file)&&file.endsWith('index.html'))){
 const html=fs.readFileSync(path.join('dist',file),'utf8');if(html.includes('http-equiv="refresh"'))continue;const{document:d}=parseHTML(html);count++;
 const og=d.querySelector('meta[property="og:image"]').content;assert.equal(d.querySelector('meta[name="twitter:image"]').content,og);assert(og.includes('/assets/og/'));const png=fs.readFileSync('dist'+new URL(og).pathname);assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert.equal(d.querySelector('meta[property="og:image:width"]').content,'1200');assert(d.title.endsWith('. Darwin Core Protocol.'));
 const labels=[...d.querySelectorAll('.footer-placeholder')];assert.deepEqual(labels.map(n=>n.textContent),['Twitter (X)','Telegram','Discord']);assert(labels.every(n=>n.tagName==='SPAN'&&!n.closest('a')));
 if(file.includes('/app/')){const nav=d.querySelector('.site-nav'),lang=file.startsWith('es/')?'es':'en';assert.deepEqual([...nav.children].slice(0,5).map(n=>n.querySelector('.nav-trigger')?.textContent||n.textContent),lang==='es'?['Inicio','Buscar','Hallazgos','Grupos','Perfil']:['Main','Search','Findings','Groups','Profile']);assert.equal(nav.querySelectorAll('.records-dropdown .nav-menu a').length,3);}
}
for(const lang of ['en','es']){
 const parse=route=>parseHTML(fs.readFileSync(`dist/${lang}/${route}index.html`,'utf8')).document;
 const concept=parse('');assert(concept.querySelector('.audience-image-placeholder img'));
 const community=parse('deeper/');assert.equal(community.querySelectorAll('.about-inline-image').length,0);assert.deepEqual([...community.querySelectorAll('.about-action')].map(a=>a.getAttribute('href')),[`/${lang}/app/`,`/${lang}/ocean/`]);
 assert(!community.querySelector('.concept-explainer[open]'));
 const home=parse('app/search/');assert(!home.querySelector('.scan-results'));assert(home.querySelector('[data-scan-query]'));
 assert(fs.readFileSync(`dist/${lang}/app/darwinscan/index.html`,'utf8').includes('location.search+location.hash'));
}
assert(css.includes('.tool-detail-page .article-card-image{height:auto;aspect-ratio:4/3;object-fit:cover}'));
for(const verb of ['Record your finding','You can record shared findings','You record an endangered species','a black box that records how'])assert.equal(findingNouns(verb),verb);
assert.equal(findingNouns('Your records and a record.'),'Your findings and a finding.');
console.log(`OK: ${count} OG images and metadata, footer text, App order/dropdown, Search entry, noun/verb wording, Tools image sizing, hover states and Community double CTA.`);
