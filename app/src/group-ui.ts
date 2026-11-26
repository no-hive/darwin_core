import {text} from '../../web/src/site/app/prototype-core.mjs';
import {occurrenceTitle} from '../../web/src/site/app/dwc-occurrence.mjs';
import type {Model} from './repository';
import type {Locale} from './types';
import type {FeedEvent} from './feed';
export const groupTabs=['overview','members','voting','journal','rulesets'] as const;
export type GroupTab=typeof groupTabs[number];
export const tabLabels={en:{overview:'Overview',members:'Members',voting:'Voting',journal:'Journal',rulesets:'Rulesets'},es:{overview:'Resumen',members:'Miembros',voting:'Votaciones',journal:'Revista',rulesets:'Reglas'}};
// Presentation-only statuses for the existing demonstration findings.
const statusFixtures:Record<string,string>={'abyssal-skate':'verified','reef-coral':'verified','nudibranch':'pending_verification','seagrass':'not_verified'};
export const findingDemoStatus=(record:any)=>record.verification?.status||statusFixtures[record.id]||'not_verified';
export const statusLabels={en:{verified:'Verified',pending_verification:'Pending verification',not_verified:'Not verified'},es:{verified:'Verificado',pending_verification:'Pendiente de verificación',not_verified:'Sin verificar'}};
export function newestEvents(events:FeedEvent[]){return [...events].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)||a.id.localeCompare(b.id));}
export function eventHref(app:Model,event:FeedEvent,locale:Locale){
 return event.type==='finding'?app.link('records',event.item.id,locale):event.type==='voting'?app.proposalLink(event.item,locale):event.type==='article'?`/${locale}/blog/${event.item.slug}/`:event.type==='research'?app.link('research',event.item.id,locale):app.link('groups',event.item.groupId||event.item.id,locale);
}
export function eventTitle(event:FeedEvent){return event.type==='finding'?occurrenceTitle(event.item):event.type==='news'?text(event.item.title||event.item.news):text(event.item.title);}
export function calendarDate(value:string,locale:Locale){const date=Date.parse(value);return Number.isFinite(date)?new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(date):'—';}
export function groupAge(value:string,now:string,locale:Locale){
 const start=Date.parse(value),end=Date.parse(now);if(!Number.isFinite(start)||!Number.isFinite(end)||start>end)return '—';
 const days=Math.floor((end-start)/86400000),years=Math.floor(days/365.2425),months=Math.floor(days/30.4375);
 return years?`${years} ${locale==='es'?(years===1?'año':'años'):(years===1?'year':'years')}`:months?`${months} ${locale==='es'?(months===1?'mes':'meses'):(months===1?'month':'months')}`:`${days} ${locale==='es'?'días':'days'}`;
}
export function activityBuckets(events:FeedEvent[],now:string){
 const day=86400000,end=Date.parse(now),start=Math.floor(end/day)*day-29*day;
 const buckets=Array.from({length:30},(_,i)=>({date:new Date(start+i*day).toISOString().slice(0,10),count:0}));
 for(const event of events){if(!['finding','news','article'].includes(event.type))continue;
  // Activity counts publication dates, never an inferred observation date.
  const date=Date.parse(event.type==='finding'?event.item.createdAt||'':event.date);
  if(!Number.isFinite(date)||date>end)continue;const index=Math.floor((date-start)/day);if(index>=0&&index<buckets.length)buckets[index].count++;
 }
 return buckets;
}
