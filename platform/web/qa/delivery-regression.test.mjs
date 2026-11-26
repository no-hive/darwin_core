import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,stat,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {parseHTML} from 'linkedom';
import {encodeSignatureHeader,SIGNATURE_HEADER_NAME} from '@sanity/webhook';
import worker from '../cms/delivery/worker.mjs';

function database(schema){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
  const prepare=(sql,values=[])=>({bind:(...args)=>prepare(sql,args),first:async()=>sqlite.prepare(sql).get(...values)||null,run:async()=>sqlite.prepare(sql).run(...values)});
  return {sqlite,prepare,async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());sqlite.exec('COMMIT');return out;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
}
const secret='fixture-webhook-secret-at-least-32-characters';
const runner='fixture-runner-token-at-least-32-characters';
const base={projectId:'fixtureproject',dataset:'production',documentId:'dwc-article-example-en',documentType:'dwcArticle',revision:'rev-one',operation:'update'};
async function fixture(){return {DELIVERY_DB:database(await readFile('cms/delivery/schema.sql','utf8')),SANITY_PROJECT_ID:base.projectId,SANITY_DATASET:base.dataset,SANITY_WEBHOOK_SECRET:secret,DELIVERY_RUNNER_TOKEN:runner};}
async function event(env,value=base,signature=true){const body=JSON.stringify(value);return worker.fetch(new Request('https://fixture.invalid/webhooks/sanity',{method:'POST',headers:{'content-type':'application/json',[SIGNATURE_HEADER_NAME]:signature?await encodeSignatureHeader(body,Date.now(),secret):'invalid'},body}),env);}
async function job(env,action,input={}){const response=await worker.fetch(new Request('https://fixture.invalid/jobs/'+action,{method:'POST',headers:{authorization:'Bearer '+runner,'content-type':'application/json'},body:JSON.stringify(input)}),env);return {status:response.status,value:await response.json()};}
const due=env=>env.DELIVERY_DB.sqlite.exec('UPDATE refresh_jobs SET run_after=0');

test('signed event validation and durable dedupe',async()=>{
  const env=await fixture();
  assert.equal((await event(env,base,false)).status,401);
  assert.equal((await event(env,{...base,dataset:'wrong'})).status,403);
  assert.equal((await event(env,{...base,documentId:'drafts.example'})).status,200);
  assert.equal((await event(env)).status,202);
  assert.equal((await event(env)).status,202);
  assert.equal(env.DELIVERY_DB.sqlite.prepare('SELECT version FROM refresh_jobs').get().version,1);
  assert.equal(env.DELIVERY_DB.sqlite.prepare('SELECT count(*) AS n FROM content_events').get().n,1);
  env.DELIVERY_DB.sqlite.close();
});
test('lease exclusivity, pending changes during work and stale completion',async()=>{
  const env=await fixture();await event(env);due(env);
  const first=(await job(env,'claim')).value.job;assert(first);
  assert.equal((await job(env,'claim')).value.job,null);
  await event(env,{...base,revision:'rev-two'});
  assert.equal((await job(env,'renew',first)).status,200);
  const done=await job(env,'complete',{...first,deploymentId:'fixture-deployment-one'});
  assert.equal(done.value.status,'pending');
  assert.equal((await job(env,'complete',{...first,deploymentId:'fixture-deployment-one'})).value.duplicate,true);
  due(env);const next=(await job(env,'claim')).value.job;
  assert.equal(next.version,2);
  assert.equal((await job(env,'complete',{...first,deploymentId:'fixture-stale'})).status,409);
  assert.equal((await job(env,'complete',{...next,deploymentId:'fixture-deployment-two'})).value.status,'idle');
  env.DELIVERY_DB.sqlite.close();
});
test('expired leases, retry backoff and new-event recovery after retry limit',async()=>{
  const env=await fixture();await event(env);due(env);
  let first=(await job(env,'claim')).value.job;
  env.DELIVERY_DB.sqlite.exec('UPDATE refresh_jobs SET lease_until=0');
  const second=(await job(env,'claim')).value.job;assert.notEqual(second.leaseToken,first.leaseToken);
  assert.equal((await job(env,'fail',{...first,errorCode:'build_failed'})).status,409);
  assert.equal((await job(env,'fail',{...second,errorCode:'deploy_failed'})).value.status,'pending');
  assert.equal((await job(env,'claim')).value.job,null);
  due(env);env.DELIVERY_DB.sqlite.exec('UPDATE refresh_jobs SET attempts=4');
  first=(await job(env,'claim')).value.job;
  assert.equal((await job(env,'fail',{...first,errorCode:'build_failed'})).value.status,'dead');
  await event(env,{...base,revision:'rev-three'});due(env);
  assert((await job(env,'claim')).value.job);
  env.DELIVERY_DB.sqlite.close();
});
test('responsive assets exist, widths match and inline media remain lazy',async()=>{
  const media=JSON.parse(await readFile('.migration/media/manifest.json','utf8'));
  for(const source of Object.values(media.images))for(const variant of source.variants){
    const file=path.join('dist',variant.src);assert((await stat(file)).size>0);assert(variant.width<=source.width);
  }
  for(const locale of ['en','es']){
    const sitemap=await readFile('dist/sitemap.xml','utf8');
    for(const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)){
      const route=new URL(match[1]).pathname;if(!route.startsWith(`/${locale}/blog/`)||route===`/${locale}/blog/`)continue;
      const {document}=parseHTML(await readFile(path.join('dist',route,'index.html'),'utf8'));
      assert.equal(document.querySelector('.article-hero img').getAttribute('fetchpriority'),'high');
      // Responsive variants belong to editorial imagery, not the shared footer mark.
      for(const img of document.querySelectorAll('article img')){
        assert(img.getAttribute('srcset'));assert(img.getAttribute('sizes'));
        for(const item of img.getAttribute('srcset').split(',')){const [src]=item.trim().split(/\s+/);assert((await stat(path.join('dist',src))).size>0);}
      }
      for(const img of document.querySelectorAll('.article-inline-media img'))assert.equal(img.getAttribute('loading'),'lazy');
    }
    const {document}=parseHTML(await readFile(`dist/${locale}/blog/index.html`,'utf8'));
    assert(document.querySelector('#preview-image').getAttribute('srcset'));
    for(const row of document.querySelectorAll('.story-row'))assert(row.dataset.imageSrcset);
  }
});
test('unchanged image inputs reuse encoded files',async()=>{
  const files=JSON.parse(await readFile('.migration/media/manifest.json','utf8'));
  const before=new Map();for(const image of Object.values(files.images))for(const item of image.variants){const file=path.join('.migration/media/files',path.basename(item.src));before.set(file,(await stat(file)).mtimeMs);}
  const result=spawnSync(process.execPath,['src/build-media.mjs'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  for(const [file,mtime] of before)assert.equal((await stat(file)).mtimeMs,mtime);
});
