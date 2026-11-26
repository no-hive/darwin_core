import type {Commands,EntityKind} from '../../frontend/api/contracts';
export class HttpError extends Error {constructor(readonly status:number,readonly code:string){super(code);}}
export const fail=(status:number,code:string):never=>{throw new HttpError(status,code);};
export const kinds:EntityKind[]=['profiles','groups','research','findings','proposals','tasks'];
export function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))return fail(400,'invalid_input');return value as Record<string,unknown>;}
function keys(value:Record<string,unknown>,allowed:string[]){if(Object.keys(value).some(key=>!allowed.includes(key)))fail(400,'invalid_input');}
export function id(value:unknown):string{if(typeof value!=='string'||!(/^[a-z0-9-]{1,80}$/).test(value))return fail(400,'invalid_input');return value;}
function string(value:unknown,max:number,empty=false):string{if(typeof value!=='string'||value.length>max||(!empty&&!value.trim()))return fail(400,'invalid_input');return value.trim();}
function integer(value:unknown,min:number,max:number){if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)fail(400,'invalid_input');}
export function command(value:unknown):{operation:keyof Commands;payload:Record<string,unknown>}{
 const body=object(value);keys(body,['operation','payload']);const p=object(body.payload),op=body.operation;
 switch(op){
  case 'join':case 'leave':keys(p,['id']);id(p.id);break;
  case 'finding.attach':keys(p,['id','groupId']);id(p.id);id(p.groupId);break;
  case 'finding.create':{
   keys(p,['title','scientificName','description','date','location','evidence','groupId','researchId','visibility']);
   string(p.title,120);string(p.scientificName,120);string(p.description,3000);string(p.location,200);string(p.evidence,1000);
   if(typeof p.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))||new Date(p.date).toISOString().slice(0,10)!==p.date)fail(400,'invalid_input');
   if(p.groupId!==undefined&&p.groupId!=='')id(p.groupId);if(p.researchId!==undefined&&p.researchId!=='')id(p.researchId);
   if(!['private','group','public'].includes(String(p.visibility)))fail(400,'invalid_input');
   if(p.visibility==='group'&&!p.groupId)fail(400,'invalid_input');break;
  }
  case 'vote':keys(p,['id','choice']);id(p.id);if(!['for','against','abstain'].includes(String(p.choice)))fail(400,'invalid_input');break;
  case 'profile.update':
   keys(p,['name','job','month','year','scores','version']);string(p.name,100);string(p.job,200,true);integer(p.month,0,12);integer(p.year,0,new Date().getFullYear());
   if(p.year!==0&&Number(p.year)<1900)fail(400,'invalid_input');integer(p.version,0,2147483646);
   if(!Array.isArray(p.scores)||p.scores.length!==6||p.scores.some(score=>typeof score!=='number'||!Number.isFinite(score)||score<1||score>10))fail(400,'invalid_input');break;
  case 'task.create':keys(p,['title']);string(p.title,120);break;
  case 'task.advance':keys(p,['id','version']);id(p.id);integer(p.version,0,2147483646);break;
  default:return fail(400,'invalid_operation');
 }
 return {operation:op,payload:p};
}
export async function jsonBody(request:Request):Promise<unknown>{
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')fail(415,'json_required');
 const reader=request.body?.getReader();if(!reader)fail(400,'invalid_json');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>16384){await reader.cancel();fail(413,'body_too_large');}chunks.push(part.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return fail(400,'invalid_json');}
}
export function encodeCursor(kind:EntityKind,last:string){return btoa(JSON.stringify({kind,id:last}));}
export function decodeCursor(kind:EntityKind,cursor:string|null):string{
 if(!cursor)return '';if(cursor.length>300)return fail(400,'invalid_cursor');
 try{const parsed=JSON.parse(atob(cursor));if(parsed.kind!==kind)throw Error();return id(parsed.id);}catch{return fail(400,'invalid_cursor');}
}
