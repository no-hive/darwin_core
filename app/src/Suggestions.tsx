import {occurrenceSummary} from '../../web/src/site/app/dwc-occurrence.mjs';
import {text} from '../../web/src/site/app/prototype-core.mjs';
import type {Model} from './repository';
import type {Locale} from './types';
import type {CSSProperties} from 'react';
interface Props {model:Model;locale:Locale;query:string;params:URLSearchParams;copy:Record<string,string>;submit:()=>void}
export function Suggestions({model,locale,query,params,copy:c,submit}:Props){
  const types=['profiles','records','groups','research'],chosen=(params.get('types')||'').split(',').filter(type=>types.includes(type));
  const matches=model.search({q:query,categories:chosen.length?chosen:types,scope:params.get('scope')==='mine'?'mine':'all',groupId:params.get('group')||'',authorId:params.get('author')||'',lang:locale});
  const prefix=query.toLowerCase();
  matches.sort((a:any,b:any)=>Number(text(b.title,locale).toLowerCase().startsWith(prefix))-Number(text(a.title,locale).toLowerCase().startsWith(prefix)));
  const items=matches.slice(0,6),categories=types.filter(type=>items.some((item:any)=>item.entityType===type));let suggestionIndex=0;
  return <><p className="scan-suggestions-heading">{c.suggestions}<span role="status" aria-live="polite">{matches.length} {c.results}</span></p>{items.length?<><div className="scan-suggestion-grid">{categories.map((type,index)=>{
    const entries=items.filter((item:any)=>item.entityType===type);
    const span=categories.length===1?12:categories.length===3?(index===0?12:index===1?5:7):index%2===0?(index===0?4:7):(index===1?8:5);
    return <section key={type} className="scan-suggestion-widget" data-suggestion-widget={type} style={{'--widget-span':span} as CSSProperties} aria-labelledby={`scan-widget-${type}`}><header><h2 id={`scan-widget-${type}`}>{c[type]}</h2><span>{entries.length}</span></header><ul>{entries.map((item:any)=>{
      const detail=type==='profiles'?item.id:type==='records'?occurrenceSummary(item):text(item.description,locale);
      const initials=text(item.title,locale).split(/\s+/).slice(0,2).map((word:string)=>word[0]).join('');
      return <li key={`${type}:${item.entityId}`}><a id={`scan-suggestion-${suggestionIndex++}`} data-suggestion="" data-suggestion-type={type} href={model.link(type,item.entityId,locale)}>{type==='profiles'&&<span className="scan-suggestion-avatar" aria-hidden="true">{initials}</span>}<span className="scan-suggestion-copy"><strong data-object-content="" translate="no">{text(item.title,locale)}</strong><small data-object-content="" translate="no">{detail}</small></span><span className="scan-suggestion-arrow" aria-hidden="true">↗</span></a></li>;
    })}</ul></section>;
  })}</div><button className="scan-suggestions-all" type="button" data-action="scan-show-all" onClick={submit}>{c.viewAllResults} ({matches.length}) →</button></>:<p className="scan-suggestions-empty">{c.empty}</p>}</>;
}
