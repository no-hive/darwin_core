import {database} from './database';
import {HttpError,command,decodeCursor,encodeCursor,fail,id,jsonBody,kinds,object} from './validation';
import type {EntityKind} from '../../frontend/api/contracts';
import {searchRequest,searchCursor} from './search';
import type {SearchHit} from '../../frontend/api/search-contracts';
export interface ApiEnv {DWC_API_ENABLED?:string;DWC_DATABASE_URL?:string;DWC_SITE_ORIGIN?:string}
/** Run only behind Sites dispatch, which owns authenticated identity headers.
 * Do not expose this module as an independent, header-trusting public Worker. */
export async function handleApi(request:Request,env:ApiEnv):Promise<Response>{
 const requestId=crypto.randomUUID();
 const response=(status:number,body:unknown)=>new Response(JSON.stringify({...object(body),requestId}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie, OAI-Sites-Authorization','X-Request-ID':requestId}});
 try{
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/v1/'))return response(404,{error:{code:'not_found'}});
  if(env.DWC_API_ENABLED!=='true'||!env.DWC_DATABASE_URL||!env.DWC_SITE_ORIGIN)fail(503,'api_not_configured');
  const origin=new URL(env.DWC_SITE_ORIGIN);
  if(origin.protocol!=='https:'||origin.origin!==env.DWC_SITE_ORIGIN||url.origin!==origin.origin)fail(503,'api_not_configured');
  if(request.method!=='GET'&&request.method!=='POST')fail(405,'method_not_allowed');
  const subject=request.headers.get('oai-authenticated-user-id');
  if(url.pathname==='/api/v1/session'&&request.method==='GET'&&!subject)return response(200,{data:{authenticated:false,profile:null}});
  if(!subject||subject.length>200)fail(401,'unauthenticated');
  if(request.method==='POST'){
   if(request.headers.get('origin')!==origin.origin||request.headers.get('sec-fetch-site')==='cross-site')fail(403,'origin_denied');
  }
  const db=database(env.DWC_DATABASE_URL);
  if(url.pathname==='/api/v1/search'&&request.method==='GET'){
   const input=await searchRequest(url.searchParams),rows=await db.search(subject,input);
   const items=rows.map(row=>row.data) as SearchHit[],more=items.length>input.limit;if(more)items.pop();
   return response(200,{data:{items,nextCursor:more?searchCursor(input.fingerprint,items.at(-1)!):null}});
  }
  if(url.pathname==='/api/v1/session'&&request.method==='GET')return response(200,{data:{authenticated:true,profile:await db.identity(subject)}});
  if(url.pathname==='/api/v1/enroll'&&request.method==='POST'){
   if(Object.keys(object(await jsonBody(request))).length)fail(400,'invalid_input');
   let name=request.headers.get('oai-authenticated-user-full-name')||'Researcher';
   if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')try{name=decodeURIComponent(name);}catch{name='Researcher';}
   return response(200,{data:await db.identity(subject,name.slice(0,100))});
  }
  if(url.pathname==='/api/v1/commands'&&request.method==='POST'){
   const key=request.headers.get('idempotency-key');if(!key||!/^[a-zA-Z0-9-]{16,80}$/.test(key))fail(400,'idempotency_key_required');
   const {operation,payload}=command(await jsonBody(request));
   return response(200,{data:await db.command(subject,key,operation,payload)});
  }
  const match=url.pathname.match(/^\/api\/v1\/entities\/([a-z]+)(?:\/([a-z0-9-]{1,80}))?\/?$/);
  if(match&&request.method==='GET'){
   const kind=match[1] as EntityKind;if(!kinds.includes(kind))fail(404,'not_found');
   if([...url.searchParams.keys()].some(key=>!['limit','cursor'].includes(key)))fail(400,'invalid_input');
   const limit=Number(url.searchParams.get('limit')||'50');if(!Number.isInteger(limit)||limit<1||limit>100)fail(400,'invalid_input');
   const after=decodeCursor(kind,url.searchParams.get('cursor'));
   if(match[2]&&(after||url.searchParams.has('limit')))fail(400,'invalid_input');
   const rows=await db.page(subject,kind,after,match[2]?1:limit+1,match[2]?id(match[2]):null);
   const items=rows.map(row=>row.data);
   if(match[2]){if(!items.length)fail(404,'not_found');return response(200,{data:items[0]});}
   const more=items.length>limit;if(more)items.pop();
   return response(200,{data:{items,nextCursor:more?encodeCursor(kind,items.at(-1).id):null}});
  }
  return response(404,{error:{code:'not_found'}});
 }catch(error){
  if(error instanceof HttpError)return response(error.status,{error:{code:error.code}});
  const known:Record<string,number>={unauthenticated:401,enrollment_required:403,forbidden:403,not_found:404,proposal_closed:409,version_conflict:409,idempotency_conflict:409,invalid_input:400,invalid_operation:400,query_too_broad:400};
  if(error instanceof Error&&Object.hasOwn(known,error.message))return response(known[error.message],{error:{code:error.message}});
  const sqlState=typeof error==='object'&&error!==null&&'code' in error?String(error.code):'';
  if(['23502','23514','22P02','22007','22008'].includes(sqlState))return response(400,{error:{code:'invalid_input'}});
  // No connection strings, SQL/payloads or upstream error messages in logs.
  console.error(JSON.stringify({requestId,event:'api_database_unavailable'}));
  return response(503,{error:{code:'temporarily_unavailable'}});
 }
}
export default {fetch:handleApi};
