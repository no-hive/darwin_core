import {useEffect,useRef,useState,type FormEvent,type KeyboardEvent,type MouseEvent} from 'react';
import {renderPrototype} from '../../web/src/site/app/prototype-render.mjs';
import {COPY} from '../../web/src/site/app/prototype-copy.mjs';
import {TrustedView} from './TrustedView';
import {Suggestions} from './Suggestions';
import {Contribution} from './Contribution';
import {Modal} from './Modal';
import type {AppRepository} from './repository';
import type {Locale,LocationState} from './types';

interface Props {repository:AppRepository;locale:Locale;location:LocationState;navigate:(url:string)=>void}
export function PrototypeWorkspace({repository,locale,location,navigate}:Props){
  const app=repository.model,c=COPY[locale],route=location.pathname.replace(/^\/(en|es)\//,''),params=new URLSearchParams(location.search);
  const [query,setQuery]=useState(''),[suggest,setSuggest]=useState(false),[reset,setReset]=useState(false),[message,setMessage]=useState('');
  const surface=useRef<HTMLDivElement>(null),searchRoute=route==='app/search/';
  useEffect(()=>{setQuery(new URLSearchParams(location.search).get('q')||'');setSuggest(false);},[location.search,location.pathname]);
  useEffect(()=>{if(location.hash==='#contribute')window.location.replace(`/${locale}/app/records/new/${location.search}`);},[location.hash,location.search,locale]);
  useEffect(()=>{const outside=(event:PointerEvent)=>{if(!(event.target as HTMLElement).closest('.scan-search'))setSuggest(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
  const status=(value:string)=>setMessage(value+(app.storageAvailable?'':` ${c.sessionOnly}`));
  const update=(values:Record<string,string>)=>{const next=new URLSearchParams(location.search);for(const [key,value] of Object.entries(values)){if(value)next.set(key,value);else next.delete(key);}navigate(location.pathname+(next.size?'?'+next:''));setSuggest(false);};
  const submitQuery=()=>update({q:query.trim()});
  const selected=[...new Set((params.get('types')||'').split(',').filter(type=>['profiles','records','groups','research'].includes(type)))];
  const suggestions=searchRoute&&suggest&&query.trim()?<Suggestions model={app} locale={locale} query={query.trim()} params={params} copy={c} submit={submitQuery}/>:null;
  const changeQuery=(value:string)=>{setQuery(value);setSuggest(Boolean(value.trim()));};
  const submit=(event:FormEvent)=>{
    const form=event.target as HTMLFormElement;
    if(form.matches('[data-search-form]')){event.preventDefault();submitQuery();}
    if(form.matches('[data-filter-form]')){event.preventDefault();update(Object.fromEntries(new FormData(form)) as Record<string,string>);}
    if(form.matches('[data-attach-form]')){event.preventDefault();try{repository.attach(String(new FormData(form).get('record')||''),form.dataset.group!);status(c.attachedSaved);}catch{status(c.permission);}}
    if(form.matches('[data-vote-form]')){event.preventDefault();try{repository.vote(form.dataset.proposal!,String(new FormData(form).get('choice')||''));status(c.voteSaved);}catch{status(c.permission);}}
  };
  const click=(event:MouseEvent)=>{
    const target=event.target as HTMLElement;
    if(!target.closest('.scan-search'))setSuggest(false);
    const action=target.closest<HTMLElement>('[data-action]');
    if(action&&['join','leave'].includes(action.dataset.action!)){try{if(action.dataset.action==='join')repository.join(action.dataset.group!);else repository.leave(action.dataset.group!);status(c.membershipSaved);}catch{status(c.permission);}}
  };
  const keyboard=(event:KeyboardEvent)=>{
    if(!suggestions)return;
    const target=event.target as HTMLElement,input=surface.current?.querySelector<HTMLInputElement>('[data-scan-query]');
    const panel=surface.current?.querySelector('#scan-suggestions');
    if(!input||!panel||(target!==input&&!panel.contains(target)))return;
    if(event.key==='Escape'){event.preventDefault();input.focus();setSuggest(false);}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      const links=[...panel.querySelectorAll<HTMLAnchorElement>('[data-suggestion]')];if(!links.length)return;
      event.preventDefault();const index=links.indexOf(target.closest('[data-suggestion]') as HTMLAnchorElement);
      if(target===input)(event.key==='ArrowDown'?links[0]:links.at(-1))?.focus();
      else{const next=index+(event.key==='ArrowDown'?1:-1);(links[next]||input).focus();}
    }
  };
  return <div ref={surface} style={{display:'contents'}} onSubmit={submit} onClick={click} onKeyDown={keyboard} onFocus={event=>{if((event.target as HTMLElement).matches('[data-scan-query]')&&query.trim())setSuggest(true);}}>
    <div className="proto-utilities"><button className="proto-text-button" data-action="reset" onClick={()=>setReset(true)}>{c.reset}</button></div>
    <p id="prototype-status" className="proto-status" role="status" aria-live="polite">{message}</p>
    <div id="prototype-root">{route==='app/records/new/'?<Contribution key={params.get('group')||''} repository={repository} locale={locale} copy={c} initialGroup={params.get('group')||''} close={()=>{window.location.assign(`/${locale}/app/records/`);}} saved={id=>{window.location.assign(app.link('records',id,locale));}}/>:<TrustedView html={renderPrototype(app,route,params,locale)} query={query} setQuery={changeQuery} selected={selected} onCategories={types=>update({types:types.join(','),q:query.trim()})} suggestions={suggestions}/>}</div>
    <div id="prototype-dialogs">
      <Modal id="reset-dialog" titleId="reset-title" open={reset} onClose={()=>setReset(false)}><h2 id="reset-title">{c.resetConfirm}</h2><p>{c.resetDescription}</p><div className="proto-actions"><button className="proto-button" data-action="close-dialog" onClick={()=>setReset(false)}>{c.cancel}</button><button className="proto-button proto-primary" data-action="confirm-reset" onClick={()=>{repository.reset();setReset(false);status(c.resetDone);}}>{c.confirmReset}</button></div></Modal>
    </div>
  </div>;
}
