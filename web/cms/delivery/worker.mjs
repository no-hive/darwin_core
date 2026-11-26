import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook';

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const seconds=()=>Math.floor(Date.now()/1000);
const digest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
async function equal(a,b){const [x,y]=await Promise.all([digest(a),digest(b)]);let difference=0;for(let i=0;i<x.length;i++)difference|=x[i]^y[i];return difference===0;}
async function body(request){
  if(!request.body)throw Error('body');
  const reader=request.body.getReader(),chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw Error('size');}chunks.push(value);}
  const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
const valid=(value,max=200)=>typeof value==='string'&&value.length>0&&value.length<=max&&/^[a-zA-Z0-9_.:-]+$/.test(value);
async function webhook(request,env){
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'json_required'},415);
  const raw=await body(request);
  if(!(await isValidSignature(raw,request.headers.get(SIGNATURE_HEADER_NAME)||'',env.SANITY_WEBHOOK_SECRET)))return json({error:'invalid_signature'},401);
  const event=JSON.parse(raw);
  if(event.projectId!==env.SANITY_PROJECT_ID||event.dataset!==env.SANITY_DATASET)return json({error:'wrong_source'},403);
  if(!valid(event.documentId)||!valid(event.revision)||!['create','update','delete'].includes(event.operation)||!['dwcArticle','dwcTag','dwcAuthor','sanity.imageAsset'].includes(event.documentType))return json({error:'invalid_event'},400);
  if(/^(drafts|versions)\./.test(event.documentId))return json({ignored:'unpublished'});
  // Dedupe signed fields, not an unsigned idempotency header. Delayed events
  // request a fresh snapshot; their payload never replaces published content.
  const id=[...await digest(JSON.stringify([event.projectId,event.dataset,event.documentId,event.revision,event.operation]))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  const now=seconds();
  await env.DELIVERY_DB.batch([
    env.DELIVERY_DB.prepare('INSERT OR IGNORE INTO content_events(event_id,document_id,revision,operation,received_at) VALUES (?1,?2,?3,?4,?5)').bind(id,event.documentId,event.revision,event.operation,now),
    env.DELIVERY_DB.prepare(`INSERT INTO refresh_jobs(id,version,status,run_after)
      SELECT 'published',1,'pending',?2 FROM content_events WHERE event_id=?1 AND enqueued=0
      ON CONFLICT(id) DO UPDATE SET version=refresh_jobs.version+1,
      run_after=CASE WHEN refresh_jobs.status IN ('idle','dead') OR (refresh_jobs.status='running' AND refresh_jobs.version=refresh_jobs.claimed_version) THEN ?2 ELSE MIN(refresh_jobs.run_after,?2) END,
      status=CASE WHEN refresh_jobs.status IN ('idle','dead') THEN 'pending' ELSE refresh_jobs.status END,
      attempts=CASE WHEN refresh_jobs.status IN ('idle','dead') THEN 0 ELSE refresh_jobs.attempts END`).bind(id,now+10),
    env.DELIVERY_DB.prepare('UPDATE content_events SET enqueued=1 WHERE event_id=?1').bind(id)
  ]);
  return json({accepted:true},202);
}
async function claim(env){
  const now=seconds(),token=crypto.randomUUID();
  await env.DELIVERY_DB.batch([
    env.DELIVERY_DB.prepare("UPDATE refresh_jobs SET status='pending',attempts=0,lease_token=NULL WHERE status='running' AND lease_until<=?1 AND version<>claimed_version").bind(now),
    env.DELIVERY_DB.prepare("UPDATE refresh_jobs SET status='dead',last_error='lease_expired',lease_token=NULL WHERE status='running' AND lease_until<=?1 AND attempts>=5 AND version=claimed_version").bind(now)
  ]);
  const job=await env.DELIVERY_DB.prepare(`UPDATE refresh_jobs SET status='running',claimed_version=version,
    lease_token=?1,lease_until=?2,attempts=attempts+1 WHERE id='published' AND attempts<5 AND
    ((status='pending' AND run_after<=?3) OR (status='running' AND lease_until<=?3))
    RETURNING claimed_version AS version,lease_token AS leaseToken,lease_until AS leaseUntil,attempts`).bind(token,now+900,now).first();
  return json({job:job||null});
}
async function finish(request,env,action){
  const input=JSON.parse(await body(request)),now=seconds();
  if(!valid(input.leaseToken)||!Number.isSafeInteger(input.version)||input.version<1)return json({error:'invalid_lease'},400);
  if(action==='complete'){
    if(!valid(input.deploymentId,300))return json({error:'deployment_required'},400);
    const prior=await env.DELIVERY_DB.prepare("SELECT last_deployment FROM refresh_jobs WHERE id='published'").first();
    if(prior?.last_deployment===input.deploymentId)return json({completed:true,duplicate:true});
  }
  let statement;
  if(action==='renew')statement=env.DELIVERY_DB.prepare(`UPDATE refresh_jobs SET lease_until=?1 WHERE id='published' AND status='running' AND lease_token=?2 AND claimed_version=?3 AND lease_until>?4 RETURNING lease_until AS leaseUntil`).bind(now+900,input.leaseToken,input.version,now);
  else if(action==='complete')statement=env.DELIVERY_DB.prepare(`UPDATE refresh_jobs SET
    status=CASE WHEN version=claimed_version THEN 'idle' ELSE 'pending' END,
    attempts=0,lease_token=NULL,lease_until=0,last_error=NULL,last_deployment=?1
    WHERE id='published' AND status='running' AND lease_token=?2 AND claimed_version=?3 AND lease_until>?4 RETURNING status`).bind(input.deploymentId,input.leaseToken,input.version,now);
  else{
    const code=['build_failed','deploy_failed','cancelled'].includes(input.errorCode)?input.errorCode:'runner_failed';
    statement=env.DELIVERY_DB.prepare(`UPDATE refresh_jobs SET
      status=CASE WHEN version<>claimed_version THEN 'pending' WHEN attempts>=5 THEN 'dead' ELSE 'pending' END,
      run_after=?1+MIN(3600,30*(1<<MIN(attempts,7))),
      attempts=CASE WHEN version<>claimed_version THEN 0 ELSE attempts END,
      lease_token=NULL,lease_until=0,last_error=?2
      WHERE id='published' AND status='running' AND lease_token=?3 AND claimed_version=?4 AND lease_until>?1 RETURNING status`).bind(now,code,input.leaseToken,input.version);
  }
  const result=await statement.first();
  return result?json(result):json({error:'stale_or_expired_lease'},409);
}
export default {
  async fetch(request,env){
    if(!env.DELIVERY_DB||!env.SANITY_PROJECT_ID||!env.SANITY_DATASET||env.SANITY_WEBHOOK_SECRET?.length<32||!env.SANITY_WEBHOOK_SECRET||env.DELIVERY_RUNNER_TOKEN?.length<32||!env.DELIVERY_RUNNER_TOKEN)return json({error:'not_configured'},503);
    const route=new URL(request.url).pathname;
    if(request.method!=='POST')return json({error:'post_required'},405);
    try{
      if(route==='/webhooks/sanity')return await webhook(request,env);
      if(!(await equal(request.headers.get('authorization')||'','Bearer '+env.DELIVERY_RUNNER_TOKEN)))return json({error:'unauthorized'},401);
      if(route==='/jobs/claim')return await claim(env);
      if(['/jobs/renew','/jobs/complete','/jobs/fail'].includes(route))return await finish(request,env,route.split('/').at(-1));
      return json({error:'not_found'},404);
    }catch(error){return json({error:error.message==='size'?'body_too_large':'request_failed'},error.message==='size'?413:error instanceof SyntaxError?400:500);}
  },
  async scheduled(_event,env){
    // Optional deployment-side retention task; no schedule is activated by this repo.
    await env.DELIVERY_DB.prepare('DELETE FROM content_events WHERE received_at<?1 AND enqueued=1').bind(seconds()-30*86400).run();
  }
};
