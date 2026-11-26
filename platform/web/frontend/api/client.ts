import type {Commands,Entities,EntityKind,Page,ProfileDTO,Session} from './contracts';
import type {SearchOptions,SearchPage} from './search-contracts';
export class ApiError extends Error {
 constructor(readonly code:string,readonly status:number,readonly requestId:string|null){super(code);}
}
/** Explicit async transport for the future server mode. No automatic activation,
 * optimistic demo mutations, hidden retries, or local-data uploads. */
export function createApiClient(base='/api/v1',fetcher:typeof fetch=fetch){
 if(!base.startsWith('/')||base.startsWith('//')||base.includes('?')||base.includes('#'))throw Error('same_origin_api_required');
 async function request<T>(path:string,options:RequestInit={}):Promise<T>{
  const response=await fetcher(base+path,{...options,credentials:'same-origin',redirect:'error',headers:{Accept:'application/json',...options.headers}});
  const body=await response.json().catch(()=>null);
  if(!response.ok)throw new ApiError(body?.error?.code||'invalid_response',response.status,body?.requestId||null);
  if(!body||!Object.hasOwn(body,'data'))throw new ApiError('invalid_response',response.status,body?.requestId||null);
  return body.data as T;
 }
 return {
  search:(options:SearchOptions)=>{
   const query=new URLSearchParams({q:options.q,locale:options.locale});
   if(options.types)query.set('types',options.types.join(','));
   for(const key of ['scope','group','author','mode','cursor','limit'] as const)if(options[key]!==undefined)query.set(key,String(options[key]));
   return request<SearchPage>('/search?'+query,{signal:options.signal});
  },
  session:(signal?:AbortSignal)=>request<Session>('/session',{signal}),
  enroll:(signal?:AbortSignal)=>request<ProfileDTO>('/enroll',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal}),
  list:<K extends EntityKind>(kind:K,options:{cursor?:string;limit?:number;signal?:AbortSignal}={})=>{
   const query=new URLSearchParams();if(options.cursor)query.set('cursor',options.cursor);if(options.limit!==undefined)query.set('limit',String(options.limit));
   return request<Page<Entities[K]>>(`/entities/${kind}?${query}`,{signal:options.signal});
  },
  get:<K extends EntityKind>(kind:K,id:string,signal?:AbortSignal)=>request<Entities[K]>(`/entities/${kind}/${encodeURIComponent(id)}`,{signal}),
  command:<K extends keyof Commands>(operation:K,payload:Commands[K]['input'],options:{idempotencyKey:string;signal?:AbortSignal})=>request<Commands[K]['result']>('/commands',{
   method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':options.idempotencyKey},body:JSON.stringify({operation,payload}),signal:options.signal
  })
 };
}
