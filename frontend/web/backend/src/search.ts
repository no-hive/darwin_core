import {fail} from './validation';
import type {SearchKind,SearchHit} from '../../frontend/api/search-contracts';
const kinds:SearchKind[]=['profiles','groups','research','findings','proposals','tasks','articles'];
const entityId=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(value);
interface Position {score:number;kind:string;id:string}
export async function searchRequest(params:URLSearchParams){
 const allowed=['q','locale','types','scope','group','author','mode','cursor','limit'];
 for(const key of params.keys())if(!allowed.includes(key)||params.getAll(key).length!==1)fail(400,'invalid_search');
 const q=(params.get('q')||'').trim(),locale=params.get('locale')||'en',scope=params.get('scope')||'all',mode=params.get('mode')||'search';
 const types=[...new Set((params.get('types')||'profiles,groups,research,findings').split(','))].sort() as SearchKind[];
 const group=params.get('group')||'',author=params.get('author')||'';
 if(q.length<2||q.length>200||!['en','es'].includes(locale)||!['all','mine','discover'].includes(scope)||!['search','suggest'].includes(mode)
   ||types.length<1||types.length>7||types.some(type=>!kinds.includes(type))||group&&!/^[a-z0-9-]{1,80}$/.test(group)||author&&!/^[a-z0-9-]{1,80}$/.test(author))fail(400,'invalid_search');
 const limit=Number(params.get('limit')||(mode==='suggest'?'6':'50'));
 if(!Number.isInteger(limit)||limit<1||limit>(mode==='suggest'?6:100))fail(400,'invalid_search');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({q,locale,scope,mode,types,group,author})));
 const fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
 const cursor=params.get('cursor');let position:Position={score:-1,kind:'',id:''};
 if(cursor){
  if(cursor.length>1024)fail(400,'invalid_cursor');
  try{const value=JSON.parse(atob(cursor));if(value.v!==1||value.fingerprint!==fingerprint||!Number.isInteger(value.score)||value.score<0||value.score>1000000||!kinds.includes(value.kind)||!entityId(value.id))throw Error();position={score:value.score,kind:value.kind,id:value.id};}catch{fail(400,'invalid_cursor');}
 }
 return {q,locale,scope,mode,types,group,author,limit,fingerprint,position};
}
export function searchCursor(fingerprint:string,last:SearchHit){return btoa(JSON.stringify({v:1,fingerprint,score:last.score,kind:last.kind,id:last.id}));}
