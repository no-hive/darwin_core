import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {localizedArticles} from '../content/article-catalog.mjs';
import {DEFAULT_GROUP_ID} from '../site/app/prototype-core.mjs';
import {PROTOTYPE} from '../content/prototype.mjs';

const root=path.resolve(import.meta.dirname,'../..');
let server,manifest;
const safeJSON=value=>JSON.stringify(value).replaceAll('<',String.fromCharCode(92)+'u003c');
export async function prepareReactApp(document,locale,route){
  server??=await import(pathToFileURL(path.join(root,'.migration/app/server.mjs')).href);
  manifest??=JSON.parse(await readFile(path.join(root,'.migration/app/manifest.json'),'utf8'));
  const main=document.querySelector('main');
  const visibleArticleIds=new Set(localizedArticles(locale).map(article=>article.id));
  const articles=localizedArticles('en').filter(article=>visibleArticleIds.has(article.id)).map(({id,slug,title,dek,isoDate,image,alt,tags,groupIds})=>({id,slug,title,dek,isoDate,image,alt,tags,groupIds:[...new Set([DEFAULT_GROUP_ID,...(groupIds||[])])]}));
  const bootstrap={locale,route,now:new Date().toISOString(),articles};
  main.dataset.appReact='';
  main.className='mantine-app';main.setAttribute('data-mantine-color-scheme','dark');
  document.body.classList.add('mantine-app-page');
  const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=manifest.stylesheet;document.head.append(sheet);
  main.innerHTML=server.renderApp({...bootstrap,seed:PROTOTYPE});
  // The React profile owns its toast, so remove only a legacy sibling outside main.
  document.querySelectorAll('body > #profile-toast').forEach(node=>node.remove());
  if(!document.querySelector('#app-prototype-data')){
    const seed=document.createElement('script');seed.type='application/json';seed.id='app-prototype-data';seed.textContent=safeJSON(PROTOTYPE);main.after(seed);
  }
  const data=document.createElement('script');data.type='application/json';data.id='app-react-data';data.textContent=safeJSON(bootstrap);main.after(data);
  for(const script of document.querySelectorAll('script[src]')){
    const src=script.getAttribute('src').split(/[?#]/)[0];
    if(/(?:^|\/)(prototype-app|profile)\.js$/.test(src)||src==='/app/app.js')script.remove();
  }
  const client=document.createElement('script');client.type='module';client.src=manifest.client;document.body.append(client);
}
