import {stat,readFile} from 'node:fs/promises';
import path from 'node:path';
import {adminDatabase,operatorFailure} from './operator.mjs';
if(process.argv.length>3||process.argv[2]&&process.argv[2]!=='--apply')throw Error('Usage: npm run api:sync-articles [-- --apply]');
if(process.argv[2]!=='--apply')console.log('Plan only: stage a confirmed published Sanity catalog in batches of 50; atomically activate it and enqueue reconciliation. No files or database were read.');
else try{
 const filename=path.resolve(process.env.DWC_CONTENT_SNAPSHOT||'.migration/content/published.json');
 if((await stat(filename)).size>64*1024*1024)throw Error();
 const snapshot=JSON.parse(await readFile(filename,'utf8'));
 const release=process.env.DWC_SEARCH_RELEASE_ID;
 if(!release||release.length>200||snapshot.schema!==1||snapshot.source!=='sanity'||snapshot.perspective!=='published'||!process.env.SANITY_PROJECT_ID||!process.env.SANITY_DATASET||snapshot.projectId!==process.env.SANITY_PROJECT_ID||snapshot.dataset!==process.env.SANITY_DATASET)throw Error();
 const articles=[],pairs=new Map(),slugs=new Set();
 for(const locale of ['en','es']){
  if(!Array.isArray(snapshot.catalogs?.[locale]))throw Error();
  for(const article of snapshot.catalogs[locale]){
   if(!article||article.locale!==locale||typeof article.id!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(article.id)||typeof article.slug!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(article.slug)||typeof article.title!=='string'||!article.title.trim()||article.title.length>500||typeof article.dek!=='string'||!Array.isArray(article.blocks)||article.blocks.length>200)throw Error();
   if(typeof article.isoDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(article.isoDate)||!Number.isFinite(Date.parse(article.isoDate))||new Date(article.isoDate).toISOString().slice(0,10)!==article.isoDate||article.isoDate>new Date().toISOString().slice(0,10))throw Error();
   if(slugs.has(locale+':'+article.slug))throw Error();slugs.add(locale+':'+article.slug);
   const pair=pairs.get(article.id)||new Map();if(pair.has(locale)||pair.size&&pair.values().next().value!==article.slug)throw Error();pair.set(locale,article.slug);pairs.set(article.id,pair);
   const body=[article.dek,...article.blocks.flatMap(block=>{
    if(block.kind==='section'){if(typeof block.heading!=='string'||typeof block.text!=='string')throw Error();return [block.heading,block.text];}
    if(block.kind==='quote'){if(typeof block.quote!=='string')throw Error();return [block.quote];}
    if(block.kind==='image')return [];throw Error();
   })].join(' ').slice(0,12000);
   articles.push({id:article.id,locale,slug:article.slug,title:article.title,body});
  }
 }
 if(!articles.length&&process.env.DWC_SEARCH_ALLOW_EMPTY!=='true'||articles.length>200000||[...pairs.values()].some(pair=>pair.size!==2))throw Error();
 const sql=adminDatabase(),run=crypto.randomUUID();
 const state=await sql.query('SELECT revision FROM dwc.article_search_state WHERE singleton');
 const revision=state[0]?.revision;if(!Number.isInteger(revision))throw Error();
 const call=(operation,payload)=>sql.query('SELECT dwc.article_search_sync($1,$2,$3::jsonb) AS data',[operation,run,JSON.stringify(payload)]);
 await call('begin',{projectId:snapshot.projectId,dataset:snapshot.dataset,release,count:articles.length});
 for(let offset=0;offset<articles.length;offset+=50)await call('stage',articles.slice(offset,offset+50));
 await call('activate',{revision});
 console.log(`Activated published article-search generation (${articles.length} localized documents). Index processing remains separate.`);
}catch{operatorFailure();}
