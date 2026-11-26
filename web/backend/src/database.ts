import {neon} from '@neondatabase/serverless';
import {fail} from './validation';
import type {EntityKind} from '../../frontend/api/contracts';
import type {searchRequest} from './search';
export function connectDatabase(connection:string){
 let url:URL;try{url=new URL(connection);}catch{return fail(503,'api_not_configured');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname.endsWith('.neon.tech')||!url.username||!url.password)fail(503,'api_not_configured');
 return neon(connection);
}
export function database(connection:string){
 const sql=connectDatabase(connection);
 const options=()=>({fetchOptions:{signal:AbortSignal.timeout(10000)}});
 // Every operation is one server-side SQL transaction. No session variables,
 // raw client identifiers or SQL string interpolation are used for authority.
 return {
  async identity(subject:string,name:string|null=null){const rows=await sql.query('SELECT dwc.identity($1,$2) AS data',[subject,name],options());return rows[0]?.data??null;},
  async command(subject:string,key:string,operation:string,payload:Record<string,unknown>){const rows=await sql.query('SELECT dwc.command($1,$2,$3,$4::jsonb) AS data',[subject,key,operation,JSON.stringify(payload)],options());return rows[0]?.data;},
  async page(subject:string,kind:EntityKind,after:string,limit:number,target:string|null=null){return await sql.query('SELECT dwc.page($1,$2,$3,$4,$5) AS data',[subject,kind,after,limit,target],options());},
  async search(subject:string,input:Awaited<ReturnType<typeof searchRequest>>){const p=input.position;return await sql.query('SELECT dwc.search($1,$2,$3,$4::text[],$5,$6,$7,$8,$9,$10,$11,$12) AS data',[subject,input.q,input.locale,input.types,input.scope,input.group,input.author,input.mode,p.score,p.kind,p.id,input.limit+1],options());}
 };
}
