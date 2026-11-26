import {occurrenceTitle} from '../../web/src/site/app/dwc-occurrence.mjs';
import {DEFAULT_GROUP_ID,text} from '../../web/src/site/app/prototype-core.mjs';
import type {Model} from './repository';
import type {FeedArticle} from './types';
export interface FeedEvent {id:string;type:'finding'|'voting'|'article'|'research'|'news';groupIds:string[];date:string;score:number;item:any}
// Ranking is a temporary, transparent activity proxy, not a view/like counter.
export function feedEvents(app:Model,articles:FeedArticle[]):FeedEvent[]{
 const groups=app.groups();
 return [
  ...app.records().map((r:any)=>({id:'finding-'+r.id,type:'finding' as const,groupIds:r.groupIds,date:r.createdAt||r.eventDate?.split('/')[0]||'',score:r.groupIds.length+r.researchIds.length,item:r})),
  ...app.proposals().map((p:any)=>{const totals=app.totals(p);return {id:'voting-'+p.id,type:'voting' as const,groupIds:[p.groupId],date:p.createdAt||'',score:totals.for+totals.against+totals.abstain,item:p};}),
  ...articles.map(a=>({id:'article-'+a.id,type:'article' as const,groupIds:[...new Set([DEFAULT_GROUP_ID,...(a.groupIds||[])])],date:a.isoDate||'',score:0,item:a})),
  ...app.seed.research.map((r:any)=>({id:'research-'+r.id,type:'research' as const,groupIds:r.groupIds,date:r.createdAt||'',score:r.memberIds.length,item:r})),
  ...app.journal.news().map((n:any)=>({id:n.id,type:'news' as const,groupIds:[n.groupId],date:n.createdAt,score:0,item:n})),
  ...groups.filter((g:any)=>text(g.news).trim()).map((g:any)=>({id:'news-'+g.id,type:'news' as const,groupIds:[g.id],date:g.newsAt||'',score:g.members.length,item:g}))
 ];
}
export const findingName=occurrenceTitle;
export function randomSuggestions<T>(matches:T[],limit=3):T[]{
 const sample=[...matches];
 for(let i=sample.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[sample[i],sample[j]]=[sample[j],sample[i]];}
 return sample.slice(0,limit);
}
