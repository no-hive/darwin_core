import {useEffect,useState,useSyncExternalStore,type ComponentType,type MouseEvent} from 'react';
import {MantineProvider,createTheme} from '@mantine/core';
import {createLocalRepository,type AppRepository} from './repository';
import {useAppLocation} from './location';
import type {Bootstrap} from './types';

type RouteView=ComponentType<any>;
type RouteLoader=(route:string)=>Promise<RouteView>;
const theme=createTheme({fontFamily:'Albert Sans, system-ui, sans-serif',headings:{fontFamily:'Albert Sans, system-ui, sans-serif',fontWeight:'600'},primaryColor:'forest',primaryShade:6,autoContrast:true,luminanceThreshold:0.3,black:'#020f08',white:'#efffe8',colors:{forest:['#f5ffd9','#ecffb0','#e3ff86','#dbff5c','#d3ff33','#cdff19','#c7ff00','#b1e300','#9bc700','#85ab00'],dark:['#efffe8','#b6ceba','#83a68d','#326347','#1d5033','#143321','#0b2115','#06190e','#020f08','#010a05']},defaultRadius:'xs',components:{Button:{defaultProps:{size:'sm'}},Modal:{defaultProps:{zIndex:400,portalProps:{target:'#mantine-portal-root'}}},Menu:{defaultProps:{withinPortal:false}}}});
const paletteVariables=()=>({variables:{},light:{},dark:{'--mantine-color-body':'#020f08','--mantine-color-text':'#efffe8','--mantine-color-dimmed':'#83a68d','--mantine-color-anchor':'#c7ff00','--mantine-color-bright':'#efffe8','--mantine-color-border':'#1d5033','--mantine-color-default':'#0b2115','--mantine-color-default-hover':'#143321','--mantine-color-default-color':'#efffe8','--mantine-color-default-border':'#1d5033','--mantine-color-placeholder':'#83a68d'}});

export function ClientApplication({bootstrap,initialView,loadRoute,repository:provided}:{bootstrap:Bootstrap;initialView:RouteView;loadRoute:RouteLoader;repository?:AppRepository}){
 const [repository]=useState(()=>provided||createLocalRepository(bootstrap.seed,bootstrap.locale));
 useSyncExternalStore(repository.subscribe,repository.getSnapshot,repository.getServerSnapshot);
 const {location,navigate}=useAppLocation(`/${bootstrap.locale}/${bootstrap.route}`),locale=bootstrap.locale;
 const route=location.pathname.replace(/^\/(en|es)\//,'');
 const [View,setView]=useState<RouteView>(()=>initialView),[now,setNow]=useState(bootstrap.now);
 useEffect(()=>{try{repository.restore(window.localStorage);}catch{}setNow(new Date().toISOString());},[repository]);
 useEffect(()=>{let active=true;loadRoute(route).then(view=>{if(active)setView(()=>view);});return()=>{active=false;};},[route,loadRoute]);
 useEffect(()=>{
  document.querySelectorAll<HTMLAnchorElement>('.lang-menu a').forEach(link=>{const target=new URL(link.href,window.location.href);target.pathname=`/${target.pathname.split('/')[1]}/${route}`;target.search=location.search;target.hash=location.hash;link.href=target.pathname+target.search+target.hash;});
  document.querySelectorAll<HTMLAnchorElement>('.site-nav>a,.site-nav .nav-trigger,.records-dropdown .nav-menu a').forEach(link=>{
   const path=new URL(link.href,window.location.href).pathname.replace(/^\/(en|es)\//,'');
   let active=path==='app/'?route==='app/':path==='app/groups/'?route.startsWith(path):path==='app/records/'?route.startsWith(path):path==='app/search/'?route==='app/search/'||route.startsWith('app/research/'):path===route;
   if(link.closest('.nav-menu')){active=path==='app/records/new/'&&path===route;link.classList.toggle('current',active);}else link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  document.title=(document.querySelector('.mantine-app h1')?.textContent||'App')+'. Darwin Core Protocol.';
 },[route,location.search,location.hash]);
 const click=(event:MouseEvent)=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if(!link||link.target||link.hasAttribute('download'))return;
  const target=new URL(link.href,window.location.href);if(target.origin!==window.location.origin||!target.pathname.startsWith(`/${locale}/app/`))return;
  event.preventDefault();navigate(target.pathname+target.search+target.hash);if(target.pathname!==location.pathname)window.scrollTo({top:0,behavior:'instant'});
 };
 return <MantineProvider theme={theme} forceColorScheme="dark" cssVariablesResolver={paletteVariables} cssVariablesSelector=".mantine-app" deduplicateCssVariables={false} withGlobalClasses={false} getRootElement={()=>document.querySelector<HTMLElement>('[data-app-react]')||undefined}>
  <div className="mantine-app-content" onClick={click}><View repository={repository} locale={locale} location={location} navigate={navigate} articles={bootstrap.articles||[]} now={now}/><div id="mantine-portal-root"/></div>
 </MantineProvider>;
}
