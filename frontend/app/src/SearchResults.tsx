import {Anchor,Text} from '@mantine/core';
import {text} from '../../web/src/site/app/prototype-core.mjs';
import {occurrenceSummary} from '../../web/src/site/app/dwc-occurrence.mjs';
import {Icon,Source,ui} from './ui';
import type {Locale} from './types';

export function SearchResults({items,locale,link}:{items:any[];locale:Locale;link:(type:string,id:string)=>string}){
 const names:Record<string,[string,string]>={profiles:['Profile','Perfil'],records:['Finding','Hallazgo'],groups:['Group','Grupo'],research:['Research','Investigación']};
 const icons:Record<string,string>={profiles:'profile',records:'record',groups:'group',research:'research'};
 return <div className="search-results-table" role="table" aria-label={ui(locale,'Search results','Resultados')}><div className="search-results-heading" role="row"><span>#</span><span>{ui(locale,'Name','Nombre')}</span><span>{ui(locale,'Type','Tipo')}</span><span>{ui(locale,'Details','Detalles')}</span></div>{items.map((item,index)=><Anchor role="row" className="search-result-entry" data-entity={item.entityType} data-id={item.entityId} key={item.entityType+item.entityId} href={link(item.entityType,item.entityId)}><span className="search-result-number">{index+1}</span><span className="search-result-name"><span className="search-result-icon"><Icon name={icons[item.entityType]} size={20}/></span><span><strong><Source>{text(item.title)}</Source></strong><small><Source>{item.entityType==='records'?item.occurrenceID:item.id}</Source></small></span></span><span className="search-result-type">{ui(locale,...names[item.entityType])}</span><Text component="span" className="search-result-detail" size="sm"><Source>{item.entityType==='records'?occurrenceSummary(item):text(item.description)}</Source></Text></Anchor>)}</div>;
}
