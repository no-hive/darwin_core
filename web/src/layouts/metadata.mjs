import {pageMetadata} from '../lib/page-metadata.mjs';
import {SITE} from '../config/site.mjs';

function meta(document, attribute, key, value) {
  document.querySelectorAll(`meta[${attribute}="${key}"]`).forEach(node => node.remove());
  const node = document.createElement('meta');
  node.setAttribute(attribute, key);
  node.content = value;
  document.head.append(node);
}

export function applyMetadata(document, lang, route, articles, ogImages) {
  const article = articles.find(item => route === `blog/${item.slug}/`);
  const model = pageMetadata({locale:lang,route,article,fallbackTitle:document.title,
    description:document.querySelector('meta[name="description"]')?.content,classes:[...document.body.classList]});
  const {pageTitle,description,url,spec}=model;
  document.title=model.title;ogImages.push(spec);
  meta(document, 'name', 'description', description);
  for (const [key, value] of Object.entries(model.openGraph)) meta(document, 'property', `og:${key}`, value);
  for (const [key, value] of Object.entries(model.twitter)) {
    meta(document, 'name', `twitter:${key}`, value);
  }
  const normalize=value=>{
    if(Array.isArray(value))return value.map(normalize);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[
      key,key==='inLanguage'?lang:normalize(item)
    ]));
    if(typeof value!=='string'||!value.startsWith('https://'))return value;
    const sourceURL=new URL(value);
    return ['https://example.com',SITE.origin].includes(sourceURL.origin)
      ?value.replace(sourceURL.origin,SITE.origin).replace(/\/(en|es)\//,`/${lang}/`):value;
  };
  const structured=[...document.querySelectorAll('script[type="application/ld+json"]')];
  if(!structured.length){const node=document.createElement('script');node.type='application/ld+json';document.head.append(node);structured.push(node);}
  for(const node of structured){
    const data=node.textContent?normalize(JSON.parse(node.textContent)):model.structured;
    for(const item of Array.isArray(data)?data:[data])if(item['@type']==='WebPage')Object.assign(item,{name:document.title,description,url});
    node.textContent=JSON.stringify(data).replace(/</g,'\\u003c');
  }
  // Keep the visible heading decisions; provide document structure to assistive tools.
  if (!document.querySelector('h1')) {
    const heading = document.createElement('h1');
    heading.className = 'visually-hidden';
    heading.textContent = pageTitle;
    document.querySelector('main')?.prepend(heading);
  }
  return url;
}
