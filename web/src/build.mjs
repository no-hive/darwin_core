import {applyInitialPaint,initialPaintHead} from './lib/initial-paint.mjs';
import {cp,mkdir,readdir,readFile,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {prototypeRoutes} from './layouts/prototype.mjs';
import {REDIRECTS,PRESERVE_REDIRECT_QUERY} from './config/redirects.mjs';
import {applyFindingWording} from './lib/wording.mjs';
import {validateArticleTags} from './lib/article-recommendations.mjs';
import {articles} from './content/articles.mjs';
import {localizedArticles,contentTags} from './content/article-catalog.mjs';
import {articleRenderer,appRenderer} from './config/migration.mjs';
import {prepareReactApp} from './layouts/react-app.mjs';
import {pageMetadata} from './lib/page-metadata.mjs';
import {renderArticle} from './layouts/article.mjs';
import {renderHeader,renderFooter} from './layouts/chrome.mjs';
import {localize,preparePage} from './layouts/localize.mjs';
import {SITE} from './config/site.mjs';
import {renderOgImages} from './lib/og-images.mjs';
import {applyMetadata} from './layouts/metadata.mjs';
import {compileStyles} from './lib/styles.mjs';
import {applyImageDimensions} from './lib/images.mjs';
import {applyBlogMedia} from './lib/blog-media.mjs';
import {finalizeDeliveryAssets} from './lib/delivery-assets.mjs';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'src/site'),output=path.join(root,'dist');
await import('./build-tools.mjs');
const tools=JSON.parse(await readFile(path.join(root,'.migration/tools/manifest.json'),'utf8'));
const {origin,locales}=SITE;
if(process.env.DWC_BUILD_TARGET==='preview')throw Error('Production assembler refuses private draft preview input.');
validateArticleTags(articles,contentTags()||undefined);
const faviconLinks=`<link rel="icon" href="/favicon.ico?v=${SITE.faviconVersion}" sizes="16x16 32x32 48x48 64x64"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=${SITE.faviconVersion}"><link rel="icon" type="image/png" sizes="96x96" href="/assets/favicon-96.png?v=${SITE.faviconVersion}"><link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png?v=${SITE.touchIconVersion}">`;
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const routeOf=f=>f.replace(/index\.html$/,'');
const selectedArticleRenderer=articleRenderer(process.env.DWC_ARTICLE_RENDERER||'legacy');
const selectedAppRenderer=appRenderer(process.env.DWC_APP_RENDERER||'legacy');
function resolveURL(value,relative,lang){
 if(/^(#|mailto:|tel:|data:|https?:|\/\/)/.test(value))return value;
 if(/^\/(en|es)\//.test(value))return value;
 const url=new URL(value,`${origin}/${relative}`);let p=url.pathname.replace(/^\/(en|es)(?=\/|$)/,'');
 if(!/\.[a-z0-9]+$/i.test(p)&&!p.startsWith('/assets/'))p=`/${lang}${p}`;
 return p+url.search+url.hash;
}
async function render(html,relative,lang,localized){
 const route=routeOf(relative),{document}=parseHTML(html);
 const currentArticle=localized.find(article=>route===`blog/${article.slug}/`);
 const availableLocales=currentArticle?.availableLocales||locales;
 document.documentElement.lang=lang;
 document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(n=>n.remove());
 document.head.insertAdjacentHTML('beforeend',faviconLinks);
 document.querySelectorAll('.site-header').forEach(n=>n.remove());
 document.body.insertAdjacentHTML('afterbegin',renderHeader(lang,route,availableLocales));
 document.querySelectorAll('.lang-menu a').forEach(a=>{a.dataset.language=a.getAttribute('lang');});
 document.querySelectorAll('footer').forEach(n=>n.remove());document.body.insertAdjacentHTML('beforeend',renderFooter(lang));
 // Replace only the legacy navigation controllers, never feature dictionaries
 // such as workbench-i18n.js, which must load before the tools initialize.
 document.querySelectorAll('script[src]').forEach(n=>{
   const src=n.getAttribute('src').split(/[?#]/)[0];
   if(/(?:^|\/)i18n\.js$/.test(src)||/(?:^|\/)assets\/site\.js$/.test(src))n.remove();
 });
 document.body.insertAdjacentHTML('beforeend','<script defer src="/i18n.js"></script>');
 if(document.body.classList.contains('about-scroll-page'))document.body.insertAdjacentHTML('beforeend','<script defer src="/about-scroll.js"></script>');
 localize(document,lang);preparePage(document,lang,route,localized);
 const tool=document.getElementById('tool-app');
 if(tool){tool.dataset.workerSrc='/assets/processing-worker.js?v='+tools.workerHash;document.querySelectorAll('script[src]').forEach(script=>{const src=script.getAttribute('src').split('?')[0],name=src.split('/').at(-1);if(src.endsWith('/vendor/jszip.min.js')){script.remove();return;}if(tools.scripts[name])script.setAttribute('src','/assets/'+name+'?v='+tools.scripts[name]);});}
 if(selectedAppRenderer==='react'&&route.startsWith('app/'))await prepareReactApp(document,lang,route);
 applyFindingWording(document,{preserveAppContent:route.startsWith('app/')});
 document.querySelectorAll('link[rel="stylesheet"]').forEach(n=>{if(/(?:^|\/)style\.css(?:\?|$)/.test(n.getAttribute('href')))n.setAttribute('href',`/style.css?v=${styleVersion}`);});
 applyInitialPaint(document,route);
 const url=applyMetadata(document,lang,route,localized,ogImages);
 if(SITE.metricsEndpoint)document.body.dataset.metricsEndpoint=SITE.metricsEndpoint;
 for(const n of document.querySelectorAll('[href],[src],[data-image]'))for(const attr of ['href','src','data-image'])if(n.hasAttribute(attr))n.setAttribute(attr,resolveURL(n.getAttribute(attr),relative,lang));
 try { await applyImageDimensions(document,source); } catch (error) { throw new Error(`Image processing failed for ${lang}/${relative}: ${error.message}`, {cause:error}); }
 if(route==='blog/'&&selectedArticleRenderer==='astro')await applyBlogMedia(document,localized,lang);
 document.querySelectorAll('link[rel="canonical"],link[hreflang],meta[name="robots"]').forEach(n=>n.remove());
 document.head.insertAdjacentHTML('beforeend',`<link rel="canonical" href="${url}">${availableLocales.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin}/${l}/${route}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin}/en/${route}">`);
 let result='<!doctype html>\n'+document.documentElement.outerHTML;
 // App HTML embeds authored object strings and data; never rewrite that payload.
 if(!route.startsWith('app/'))result=result.replaceAll('https://example.com',origin).replaceAll('Quiet Light','Darwin Core Protocol');
 const target=path.join(output,lang,relative);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,result);
 return url;
}
await rm(output,{recursive:true,force:true});
// Source font masters stay in Git; only the WOFF2 assets belong in the deployment.
await cp(source,output,{recursive:true,filter:file=>! /\.(?:ttf|otf)$/.test(file)&&! /\/blog\/[^/]+\/index\.html$/.test(file)});
for(const name of [tools.runtime,tools.coreName,'processing-worker.js',...Object.keys(tools.scripts)])await cp(path.join(root,'.migration/tools',name),path.join(output,'assets',name));
if(selectedAppRenderer==='react')await cp(path.join(root,'.migration/app/assets'),path.join(output,'assets/app'),{recursive:true});
if(selectedArticleRenderer==='astro'){
 const media=JSON.parse(await readFile(path.join(root,'.migration/media/manifest.json'),'utf8'));
 for(const variant of Object.values(media.images).flatMap(image=>image.variants)){
   const target=path.join(output,variant.src);await mkdir(path.dirname(target),{recursive:true});
   await cp(path.join(root,'.migration/media/files',path.basename(variant.src)),target);
 }
}
if(selectedArticleRenderer==='astro'&&(await readdir(path.join(root,'.migration/astro'))).includes('_astro')){
 await cp(path.join(root,'.migration/astro/_astro'),path.join(output,'_astro'),{recursive:true});
}
const stylesheet=await compileStyles(root);
await writeFile(path.join(output,'style.css'),stylesheet);
const styleVersion=createHash('sha256').update(stylesheet).digest('hex').slice(0,12);
const files=(await walk(source)).filter(f=>f.endsWith('.html')&&!/^(en|es)\//.test(path.relative(source,f))&&!/\/blog\/[^/]+\/index\.html$/.test(f));
const urls=[],ogImages=[];
for(const lang of locales){
 const localized=localizedArticles(lang);
 for(const file of files){const relative=path.relative(source,file);urls.push(await render(await readFile(file,'utf8'),relative,lang,localized));}
 for(const file of (await walk(path.join(source,lang))).filter(f=>f.endsWith('.html'))){const relative=path.relative(path.join(source,lang),file);urls.push(await render(await readFile(file,'utf8'),relative,lang,localized));}
 for(const route of prototypeRoutes){if(!files.some(file=>routeOf(path.relative(source,file))===route))urls.push(await render(await readFile(path.join(source,'app/records/index.html'),'utf8'),route+'index.html',lang,localized));}
 for(const article of localized){
   const relative=`blog/${article.slug}/index.html`;
   if(selectedArticleRenderer==='astro'){
     const target=path.join(output,lang,relative);
     await mkdir(path.dirname(target),{recursive:true});
     await cp(path.join(root,'.migration/astro',lang,relative),target);
     const model=pageMetadata({locale:lang,route:routeOf(relative),article,classes:['article-page']});
     urls.push(model.url);ogImages.push(model.spec);
   }else urls.push(await render(renderArticle(article,localized,lang),relative,lang,localized));
 }
}
renderOgImages(ogImages,root,output);
// Remove source-only unlocalized templates while retaining adjacent JS/assets.
// The only entry-point redirects are explicitly listed in config/redirects.mjs.
for(const file of files)await rm(path.join(output,path.relative(source,file)),{force:true});
for(const [from,target] of Object.entries(REDIRECTS)){
 const route=target.replace(/^\/(en|es)\//,''),preserve=PRESERVE_REDIRECT_QUERY.has(from);
 const script=preserve?`<script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script>`:'';
 const file=path.join(output,from.slice(1),'index.html');
 await mkdir(path.dirname(file),{recursive:true});
 await writeFile(file,`<!doctype html><html lang="en"><head><meta charset="utf-8">${initialPaintHead(route)}<meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${origin}${target}"><meta name="robots" content="noindex,follow">${script}</head><body><a href="${target}">Continue</a></body></html>`);
}
await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${urls.length} localized pages from shared layouts.`);
await finalizeDeliveryAssets(root,output,{appRenderer:selectedAppRenderer});
