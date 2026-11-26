import {asOccurrence,occurrenceErrors,occurrenceTitle,occurrenceSummary,OCCURRENCE_KEYS} from './dwc-occurrence.mjs';
export const DEFAULT_GROUP_ID='darwin-core-protocol';
export const STORAGE_KEY='dwc-connected-prototype-v1';
const types=['profiles','records','groups','research'];
// Authored content is independent of interface language, including legacy seeds.
// The optional second argument remains accepted by compatibility renderers.
export function text(value,_interfaceLocale='en'){
 if(typeof value==='string')return value;
 if(!value||typeof value!=='object')return '';
 if(typeof value.original==='string')return value.original;
 if(typeof value.sourceLanguage==='string'&&typeof value[value.sourceLanguage]==='string')return value[value.sourceLanguage];
 return typeof value.en==='string'?value.en:typeof value.es==='string'?value.es:'';
}
export const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Validate new Occurrence input without changing author-entered strings.
export const validFindingFields=input=>occurrenceErrors(input).length===0;
// Read compatibility only; older saved findings are never accepted as new input.
function validLegacyFinding(input){
 for(const [key,max] of Object.entries({title:120,scientificName:120,description:3000,location:200,evidence:1000}))if(typeof input[key]!=='string'||!input[key].trim()||input[key].length>max)return false;
 return typeof input.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(input.date)&&Number.isFinite(Date.parse(input.date))&&new Date(input.date).toISOString().slice(0,10)===input.date;
}
/** @param {(state: unknown) => void} [persist] */
export function createPrototype(seed,raw=null,persist=()=>{}){
 const clone=value=>JSON.parse(JSON.stringify(value));
 const validId=id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id);
 const groupExists=id=>seed.groups.some(g=>g.id===id),profileExists=id=>seed.profiles.some(p=>p.key===id);
 const state={memberships:{},records:[],attachments:{},votes:{},profile:null,activity:[]};
 if(raw?.version===seed.version){
  for(const [id,value] of Object.entries(raw.memberships||{}))if(groupExists(id)&&typeof value==='boolean')state.memberships[id]=value;
  const ids=new Set(seed.records.map(r=>r.id));
  for(const record of Array.isArray(raw.records)?raw.records:[]){
   if(!record||!validId(record.id)||ids.has(record.id)||record.authorId!==seed.currentId)continue;
   const legacy=Object.hasOwn(record,'date');
   if(legacy&&!validLegacyFinding(record))continue;
   const candidate=asOccurrence(record);
   if(!legacy&&occurrenceErrors(candidate,{requireMinimum:false}).length)continue;
   const safe={...candidate,authorId:seed.currentId,status:'review',groupIds:(Array.isArray(record.groupIds)?record.groupIds:[]).filter(groupExists),researchIds:(Array.isArray(record.researchIds)?record.researchIds:[]).filter(id=>seed.research.some(r=>r.id===id))};
   // Only legacy text fields are retained outside the Darwin Core field set.
   safe.legacy=Object.fromEntries(Object.entries(safe.legacy).filter(([key,value])=>['title','evidence'].includes(key)&&typeof value==='string'&&value.length<=10000));
   ids.add(record.id);state.records.push(safe);
  }
  for(const [id,groups] of Object.entries(raw.attachments||{}))if(ids.has(id)&&Array.isArray(groups))state.attachments[id]=groups.filter(groupExists);
  for(const [id,choice] of Object.entries(raw.votes||{}))if(seed.proposals.some(p=>p.id===id&&p.status==='active')&&['for','against','abstain'].includes(choice))state.votes[id]=choice;
  if(raw.profile&&typeof raw.profile.name==='string'&&raw.profile.name.trim()&&raw.profile.name.length<=100&&typeof raw.profile.job==='string'&&raw.profile.job.length<=200&&Array.isArray(raw.profile.scores)&&raw.profile.scores.length===6&&raw.profile.scores.every(n=>Number.isFinite(n)&&n>=1&&n<=10))state.profile={name:raw.profile.name,job:raw.profile.job,month:Number.isInteger(raw.profile.month)&&raw.profile.month>=0&&raw.profile.month<=12?raw.profile.month:0,year:Number.isInteger(raw.profile.year)&&raw.profile.year>=1900&&raw.profile.year<=new Date().getFullYear()?raw.profile.year:0,scores:raw.profile.scores};
 }
 let storageAvailable=true;
 const save=()=>{try{persist({...clone(state),version:seed.version});storageAvailable=true;}catch{storageAvailable=false;}};
 const profiles=()=>seed.profiles.map(p=>p.key===seed.currentId&&state.profile?{...p,...state.profile}:p);
 const profile=id=>profiles().find(p=>p.key===id);
 const groups=()=>seed.groups.map(g=>({...g,members:g.defaultMembership?seed.profiles.map(p=>p.key):state.memberships[g.id]===undefined?[...g.members]:state.memberships[g.id]?[...new Set([...g.members,seed.currentId])]:g.members.filter(id=>id!==seed.currentId)}));
 const member=id=>Boolean(groups().find(g=>g.id===id)?.members.includes(seed.currentId));
 const records=()=>[...seed.records,...state.records].map(raw=>{const r=asOccurrence(raw);return {...r,groupIds:[...new Set([...r.groupIds,...(state.attachments[r.id]||[])])]};});
 const link=(type,id,lang='en')=>type==='profiles'?`/${lang}/app/profile/${id===seed.currentId?'':`?profile=${encodeURIComponent(id)}`}`:type==='groups'?`/${lang}/app/groups/${id}/`:type==='research'?`/${lang}/app/research/${id}/`:seed.records.some(r=>r.id===id)?`/${lang}/app/records/${id}/`:`/${lang}/app/records/view/?record=${encodeURIComponent(id)}`;
 const proposalLink=(p,lang='en')=>`/${lang}/app/groups/${p.groupId}/proposals/${p.id}/`;
 function search({q='',categories=types,scope='all',groupId='',authorId='',lang='en'}={}){
  const query=normalize(q.trim());const requested=categories.filter(t=>types.includes(t));
  const catalog=[...profiles().map(p=>({...p,entityType:'profiles',entityId:p.key,title:p.name,description:p.job,groupIds:groups().filter(g=>g.members.includes(p.key)).map(g=>g.id)})),...records().map(r=>({...r,title:occurrenceTitle(r),description:r.occurrenceRemarks,entityType:'records',entityId:r.id})),...groups().map(g=>({...g,entityType:'groups',entityId:g.id,title:g.name,groupIds:[g.id]})),...seed.research.map(r=>({...r,entityType:'research',entityId:r.id}))];
  return catalog.filter(item=>requested.includes(item.entityType)&&(!groupId||item.groupIds.includes(groupId))&&(!authorId||(item.authorId===authorId||item.memberIds?.includes(authorId)))&&(scope!=='mine'||(item.entityType==='groups'?item.members.includes(seed.currentId):item.entityType==='records'?item.authorId===seed.currentId:item.entityType==='profiles'?item.key===seed.currentId:item.memberIds?.includes(seed.currentId)))&&(scope!=='discover'||item.entityType!=='groups'||!item.members.includes(seed.currentId))&&normalize([text(item.title,lang),text(item.description,lang),item.name,item.id,item.scientificName,...(item.entityType==='records'?OCCURRENCE_KEYS.map(key=>item[key]):[]),item.entityType==='records'?profile(item.authorId)?.name:''].join(' ')).includes(query));
 }
 function join(id){if(!groupExists(id))throw Error('group');state.memberships[id]=true;save();}
 function leave(id){if(!groupExists(id))throw Error('group');if(seed.groups.find(g=>g.id===id)?.defaultMembership)return;state.memberships[id]=false;save();}
 function attach(recordId,groupId){const r=records().find(r=>r.id===recordId);if(!r||r.authorId!==seed.currentId||!member(groupId))throw Error('permission');state.attachments[recordId]=[...new Set([...(state.attachments[recordId]||[]),groupId])];save();}
 function addRecord(input,{candidate=false}={}){
  const {groupId='',researchId=''}=input;
  const errors=occurrenceErrors(input);if(errors.length)throw Error('dwc:'+errors.join(','));
  if(!groupId||!groupExists(groupId)||(!member(groupId)&&!candidate))throw Error('permission');if(researchId&&!seed.research.some(r=>r.id===researchId&&(r.groupIds.some(member)||(candidate&&r.groupIds.includes(groupId)))&&(!groupId||r.groupIds.includes(groupId))))throw Error('research');
  const id='local-'+crypto.randomUUID(),occurrenceID=input.occurrenceID||'urn:uuid:'+crypto.randomUUID();
  if(records().some(record=>record.occurrenceID===occurrenceID))throw Error('dwc:occurrenceID');
  const fields=Object.fromEntries(OCCURRENCE_KEYS.map(key=>[key,input[key]??'']));
  // Alpha test mode is application metadata, separate from scientific evidence.
  state.records.push({...fields,...(input.isTest===true?{isTest:true}:{}),recordedBy:profile(seed.currentId).name,occurrenceID,id,createdAt:new Date().toISOString(),authorId:seed.currentId,groupIds:groupId?[groupId]:[],researchIds:researchId?[researchId]:[],status:'review',legacy:{}});save();return id;
 }
 function vote(id,choice){const p=seed.proposals.find(p=>p.id===id);if(!p||p.status!=='active'||!member(p.groupId)||!['for','against','abstain'].includes(choice))throw Error('permission');state.votes[id]=choice;save();}
 const totals=p=>{const votes={...p.votes,...(state.votes[p.id]?{[seed.currentId]:state.votes[p.id]}:{})};return Object.entries(votes).reduce((out,[id,choice])=>{out[choice]+=1;return out;},{for:0,against:0,abstain:0});};
 function updateProfile(p){if(!p||p.key!==seed.currentId)throw Error('permission');state.profile={name:typeof p.name==='string'&&p.name.trim()&&p.name.length<=100?p.name:profile(seed.currentId).name,job:typeof p.job==='string'&&p.job.length<=200?p.job:profile(seed.currentId).job,month:p.month,year:p.year,scores:p.scores.map(n=>Math.min(10,Math.max(1,Number(n)||1)))};save();}
 function feed(){return [
  ...seed.proposals.map(p=>({id:'proposal-'+p.id,type:'voting',groupId:p.groupId,title:p.title,description:p.description,href:p,status:p.status,sort:60})),
  ...groups().map(g=>({id:'news-'+g.id,type:'news',groupId:g.id,title:g.name,description:g.news,sort:30})),
  ...records().flatMap((r,i)=>r.groupIds.map(id=>({id:`record-${r.id}-${id}`,type:'records',groupId:id,title:occurrenceTitle(r),description:occurrenceSummary(r),recordId:r.id,authorId:r.authorId,sort:40+i}))),
  ...seed.research.flatMap(r=>r.groupIds.map(id=>({id:'research-'+r.id,type:'research',groupId:id,title:r.title,description:r.description,researchId:r.id,sort:20}))),
  ...Object.entries(state.votes).map(([id,choice])=>{const p=seed.proposals.find(p=>p.id===id);return{id:'vote-'+id,type:'voting',groupId:p.groupId,title:p.title,description:'',voteChoice:choice,href:p,sort:100};})
 ].filter(e=>member(e.groupId)).sort((a,b)=>b.sort-a.sort);}
 function activities(id,lang){const result=records().filter(r=>r.authorId===id).map(r=>({type:'records',text:occurrenceTitle(r),href:link('records',r.id,lang)}));for(const p of seed.proposals){const choice=id===seed.currentId?state.votes[p.id]||p.votes[id]:p.votes[id];if(choice)result.push({type:'voting',text:text(p.title,lang),href:proposalLink(p,lang)});}return result;}
 return {seed,state,profiles,profile,groups,member,records,search,link,proposalLink,join,leave,attach,addRecord,vote,totals,updateProfile,feed,activities,reset:()=>{state.memberships={};state.records=[];state.attachments={};state.votes={};state.profile=null;save();},get storageAvailable(){return storageAvailable;}};
}
