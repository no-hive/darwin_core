import {readdir,readFile,stat}from'node:fs/promises';
import path from'node:path';
import assert from'node:assert/strict';
import {parseHTML}from'linkedom';
import {localizedArticles} from './content/article-catalog.mjs';
import {appRenderer} from './config/migration.mjs';
import {community} from './content/community.mjs';
import {future} from './content/future.mjs';
import postcss from 'postcss';
import {SITE} from './config/site.mjs';
import {imageDimensions} from './lib/images.mjs';
const root=path.resolve('dist');
const catalogs=Object.fromEntries(SITE.locales.map(locale=>[locale,localizedArticles(locale)]));
async function walk(d){return(await Promise.all((await readdir(d,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]))).flat();}
const files=await walk(root),failures=[],canonicalUrls=[];let pages=0,references=0;
const exists=async p=>{try{await stat(p);return true;}catch{return false;}};
for(const f of files.filter(f=>f.endsWith('.html'))){
 const html=await readFile(f,'utf8'),{document:d}=parseHTML(html),route='/'+path.relative(root,f).replace(/index\.html$/,'');
 assert.equal(d.querySelectorAll('link[rel="canonical"]').length,1,`Single canonical: ${route}`);
 if(d.querySelector('meta[http-equiv="refresh"]')&&d.querySelector('meta[name="robots"]')){const target=d.querySelector('a')?.getAttribute('href')?.split(/[?#]/)[0];assert(target&&await exists(path.join(root,target,'index.html')),`Redirect target: ${route}`);continue;}
 if(!/^\/(en|es)\//.test(route))continue;pages++;
 const lang=route.split('/')[1];
 const article=catalogs[lang].find(item=>route===`/${lang}/blog/${item.slug}/`);
 const availableLocales=article?.availableLocales||SITE.locales;
 assert.equal(d.documentElement.lang,lang,`Document language: ${route}`);
 assert.equal(d.querySelectorAll('h1').length,1,`One semantic main heading: ${route}`);
 assert.equal(d.querySelectorAll('meta[name="description"]').length,1,`Single description: ${route}`);
 assert(d.querySelector('meta[name="description"]').content.trim(),`Nonempty description: ${route}`);
 assert.equal(d.querySelector('link[rel="canonical"]').href,SITE.origin+route,`Canonical URL: ${route}`);
 assert.equal(d.querySelectorAll('meta[name="robots"]').length,0,`Public page remains indexable: ${route}`);
 canonicalUrls.push(SITE.origin+route);
 for(const key of ['title','description','url','image','type','site_name','locale'])assert.equal(d.querySelectorAll(`meta[property="og:${key}"]`).length,1,`Social metadata ${key}: ${route}`);
 assert.equal(d.querySelector('meta[property="og:title"]').content,d.title,`Social title matches: ${route}`);
 assert.equal(d.querySelector('meta[property="og:url"]').content,SITE.origin+route,`Social URL matches: ${route}`);
 assert.equal(d.querySelectorAll('meta[name="twitter:card"]').length,1,`Social card: ${route}`);
 assert(d.querySelector('link[rel="icon"][sizes="96x96"]'),`Search favicon: ${route}`);
 const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);
 assert.equal(ids.length,new Set(ids).size,`Unique element IDs: ${route}`);
 assert.equal(d.querySelectorAll('script[src="/i18n.js"]').length,1,`One navigation script: ${route}`);
 for(const image of d.querySelectorAll('img')){
   assert(Number(image.getAttribute('width'))>0&&Number(image.getAttribute('height'))>0,`Intrinsic image dimensions: ${route}`);
   assert(image.hasAttribute('alt'),`Image alternative: ${route}`);
   const src=image.getAttribute('src');
   if(src.startsWith('/assets/'))assert.deepEqual([Number(image.getAttribute('width')),Number(image.getAttribute('height'))],imageDimensions(await readFile(path.join(root,src))),`Actual image dimensions: ${route}`);
 }
 const structuredItems=[];
 for(const script of d.querySelectorAll('script[type="application/ld+json"]')){
   const data=JSON.parse(script.textContent);
   for(const item of Array.isArray(data)?data:[data]){
     structuredItems.push(item);
     if(item.inLanguage)assert.equal(item.inLanguage,lang,`Structured data language: ${route}`);
     if(item['@type']==='WebPage')assert.equal(item.url,SITE.origin+route,`Structured page URL: ${route}`);
   }
 }
 if(article){
   const posting=structuredItems.find(item=>item['@type']==='BlogPosting');
   assert(posting,`Article structured data: ${route}`);
   assert.equal(posting.url,SITE.origin+route,`Article structured URL: ${route}`);
   assert.equal(posting.mainEntityOfPage?.['@id'],`${SITE.origin+route}#webpage`,`Article main entity: ${route}`);
   assert.equal(posting.datePublished,article.publishedAt||article.isoDate,`Article publication date: ${route}`);
   assert.equal(posting.dateModified,article.updatedAt||article.publishedAt||article.isoDate,`Article modification date: ${route}`);
   assert.equal(posting.image?.[0],article.image,`Article structured image: ${route}`);
   assert.equal(posting.author?.name,SITE.name,`Article publisher: ${route}`);
 }
 for(const alternate of [...availableLocales,'x-default']){
   const locale=alternate==='x-default'?SITE.defaultLocale:alternate;
   const expected=SITE.origin+route.replace(/^\/(en|es)\//,`/${locale}/`);
   assert.equal(d.querySelector(`link[hreflang="${alternate}"]`)?.href,expected,`Language counterpart: ${route}`);
   assert(await exists(path.join(root,new URL(expected).pathname,'index.html')),`Language target exists: ${route}`);
 }
 assert(!/Quiet Light|Ethereum CA|Aztec CA|https:\/\/example\.com/.test(html),`Retired branding: ${route}`);
 assert.equal(d.querySelectorAll('.site-header').length,1,`Shared header: ${route}`);
 assert.equal(d.querySelectorAll('.site-footer').length,1,`Shared footer: ${route}`);
 assert.equal(d.querySelectorAll('.nav-collapse').length,1,`Single controller: ${route}`);
 assert(!d.querySelector('.site-nav.is-collapsed'),`Navigation starts visible: ${route}`);
 assert.equal(d.querySelector('.nav-collapse').getAttribute('aria-expanded'),'true',`Navigation starts expanded: ${route}`);
 assert.equal(d.querySelectorAll('link[hreflang]').length,availableLocales.length+1,`Language alternatives: ${route}`);
 const footer=d.querySelector('.site-footer');
 assert.equal(footer.children.length,5,`Five footer columns: ${route}`);
 assert(footer.firstElementChild.matches('.footer-app-column')&&footer.firstElementChild.querySelector('.footer-mascot'),`Logo occupies the first footer column: ${route}`);
 assert.equal(footer.lastElementChild.querySelector('h2')?.textContent,'App',`App occupies the last footer column: ${route}`);
 assert(!footer.querySelector('.newsletter-signup'),`No footer newsletter: ${route}`);
 for(const n of d.querySelectorAll('[href],[src],[data-image]'))for(const attr of ['href','src','data-image']){const v=n.getAttribute(attr);if(!v||!v.startsWith('/')||v.startsWith('//'))continue;let p=v.split(/[?#]/)[0];if(!path.extname(p))p=path.join(p,'index.html');references++;if(!await exists(path.join(root,p)))failures.push(`${route}: missing ${v}`);}
 // Current public About routes use two sticky groups; image swaps do not add groups.
 if(/\/(concept|community|future)\/$/.test(route)){
   assert.equal(d.querySelectorAll('.scroll-section').length,2,`About story groups: ${route}`);
   assert.equal(d.querySelectorAll('.about-action').length,2,`About actions: ${route}`);
   assert(!d.querySelector('.intro'),`No redundant About title: ${route}`);
 }
 const copy=route.endsWith('/community/')?community[lang]:route.endsWith('/future/')?future[lang]:null;
 if(copy){
   const stories=[...d.querySelectorAll('[data-about-story]')];
   assert.deepEqual(stories.map(node=>node.querySelector('h2')?.textContent),copy.sections.map(item=>item.heading),`About section order: ${route}`);
   stories.forEach((node,index)=>{
     const section=copy.sections[index];
     assert.deepEqual([...node.children].filter(child=>child.localName==='p').map(child=>child.textContent),section.paragraphs||[section.text],`About paragraphs: ${route}, ${index}`);
     const hints=section.explainers||(section.explainer?[section.explainer]:[]);
     const details=[...node.querySelectorAll('.concept-explainer')];
     assert.equal(details.length,hints.length,`About explanations: ${route}, ${index}`);
     hints.forEach((hint,i)=>{
       assert.equal(details[i].querySelector('summary span')?.textContent,hint.summary);
       assert.equal(details[i].hasAttribute('open'),Boolean(hint.open));
       assert.deepEqual([...details[i].querySelectorAll('.concept-explainer-body p')].map(child=>child.textContent),hint.paragraphs);
       assert(!details[i].hasAttribute('name'),'Explanations expand independently');
     });
     assert(!node.querySelector('.about-inline-media'),`About copy does not render a horizontal illustration: ${route}, ${index}`);
   });
   const visuals=[...d.querySelectorAll('.scroll-visual')];
   assert.equal(visuals[0].querySelector('img')?.getAttribute('src'),copy.images[0].src);
   assert.equal(visuals[1].querySelector('img')?.getAttribute('src'),copy.images[1].src);
   assert.equal(visuals[1].querySelector('[data-about-swap-layer="next"] img')?.getAttribute('src'),copy.images[2].src);
   if(copy.beginningImage)assert.equal(visuals[0].querySelector('[data-about-swap-layer="next"] img')?.getAttribute('src'),copy.beginningImage.src);
 }
 if(/\/blog\/$/.test(route)){assert(!d.querySelector('.blog-crumbs'));assert.equal(d.querySelectorAll('.story-row[data-url]').length,catalogs[lang].length);}
 if(/\/blog\/[^/]+\/$/.test(route)){assert(!d.querySelector('.article-back'));assert(!d.querySelector('.article-crumbs'));assert(d.querySelector('.article-body'));}
 if(/\/app\/profile\/$/.test(route)){
   if(appRenderer()==='react'){assert(d.querySelector('main.mantine-app'));assert(d.querySelector('#app-react-data'));assert(d.querySelector('#profile-name'));}
   else {assert(d.querySelector('.profile-column'));assert(!d.querySelector('.profile-head'));}
 }
}
for(const lang of SITE.locales)for(const a of catalogs[lang])assert(await exists(path.join(root,lang,'blog',a.slug,'index.html')));
const css=await readFile(path.join(root,'style.css'),'utf8');assert(css.includes('@layer tokens,base,layout,components,pages,utilities;'));
const parsedCSS=postcss.parse(css);
// Report every forbidden override without stopping the remaining link/font checks.
parsedCSS.walkDecls(declaration=>{if(declaration.important)failures.push(`Important override: ${declaration.parent.selector} / ${declaration.prop}`);});
assert(parsedCSS.nodes.every(node=>node.type==='comment'||node.type==='atrule'&&node.name==='layer'),'All shared CSS stays inside ordered layers');
assert(!files.some(file=>/\.(ttf|otf)$/.test(file)),'Deploy WOFF2 only; keep source font masters out of dist');
for(const f of files.filter(f=>/\/(en|es)\//.test(f)&&f.endsWith('.html'))){const {document}=parseHTML(await readFile(f,'utf8'));if(document.querySelector('meta[http-equiv="refresh"]'))continue;assert(document.title.endsWith('. Darwin Core Protocol.'),`Consistent page title: ${f}`);assert(!/[—–|]\s*Darwin Core Protocol(?: App)?\./.test(document.title),`No legacy brand separator: ${f}`);}
for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)/g)){if(!m[1].startsWith('data:')&&!await exists(path.join(root,m[1])))failures.push(`CSS missing ${m[1]}`);}
for(const f of files.filter(f=>f.endsWith('.woff2')))assert((await stat(f)).size>1000,`Valid font: ${f}`);
const robots=await readFile(path.join(root,'robots.txt'),'utf8');assert.equal(robots,`User-agent: *\nAllow: /\nSitemap: ${SITE.origin}/sitemap.xml\n`,'Production robots policy');
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
assert(sitemapUrls.every(url=>/^https:\/\/[^/]+\/(en|es)\//.test(url)),'Localized sitemap URLs');
assert.equal(new Set(sitemapUrls).size,sitemapUrls.length,'Unique sitemap URLs');
assert.deepEqual(new Set(sitemapUrls),new Set(canonicalUrls),'Sitemap matches public canonical pages');
for(const locale of SITE.locales)for(const tool of ['data-workflow','csv-to-darwin-core','date-normalizer','duplicate-finder'])assert(sitemapUrls.includes(`${SITE.origin}/${locale}/tools/${tool}/`),`Tool indexed in sitemap: ${locale}/${tool}`);
console.log(`Checked ${pages} localized pages and ${references} local references; ${failures.length} findings.`);
assert.equal(failures.length,0,failures.join('\n'));
console.log(`OK: ${pages} localized pages, ${references} local references, ${Object.values(catalogs).reduce((sum,items)=>sum+items.length,0)} localized articles, shared menus, About actions, profile, fonts and SEO.`);
