import {useEffect,useState,useSyncExternalStore,type MouseEvent} from 'react';
import {MantineProvider,createTheme} from '@mantine/core';
import {createLocalRepository,type AppRepository} from './repository';
import {useAppLocation} from './location';
import {MantineWorkspace} from './MantineWorkspace';
import {Profile} from './Profile';
import {SearchWorkspace} from './SearchWorkspace';
import type {Bootstrap} from './types';
const theme=createTheme({fontFamily:'Albert Sans, system-ui, sans-serif',headings:{fontFamily:'Albert Sans, system-ui, sans-serif',fontWeight:'600'},primaryColor:'forest',primaryShade:6,autoContrast:true,luminanceThreshold:0.3,black:'#0d2613',white:'#e8eedb',colors:{forest:['#f4f8df','#e7f0c8','#d9e8ad','#c9dd8d','#b8d36e','#a4c45a','#88b151','#5f8b43','#3e6e35','#1c4f28'],dark:['#e8eedb','#cbd8bc','#a2b48a','#6f925f','#3f6c41','#22622e','#1c4f28','#14351c','#0d2613','#091c0e']},defaultRadius:'xs',components:{Button:{defaultProps:{size:'sm'}},Modal:{defaultProps:{zIndex:400,portalProps:{target:'#mantine-portal-root'}}},Menu:{defaultProps:{withinPortal:false}}}});
const paletteVariables=()=>({variables:{},light:{},dark:{'--mantine-color-body':'#0d2613','--mantine-color-text':'#e8eedb','--mantine-color-dimmed':'#a2b48a','--mantine-color-anchor':'#c3da75','--mantine-color-bright':'#e8eedb','--mantine-color-border':'#1c4f28','--mantine-color-default':'#14351c','--mantine-color-default-hover':'#22622e','--mantine-color-default-color':'#e8eedb','--mantine-color-default-border':'#1c4f28','--mantine-color-placeholder':'#a2b48a'}});

export function Application({bootstrap,repository:provided}:{bootstrap:Bootstrap;repository?:AppRepository}){
 const [repository]=useState(()=>provided||createLocalRepository(bootstrap.seed,bootstrap.locale));
 useSyncExternalStore(repository.subscribe,repository.getSnapshot,repository.getServerSnapshot);
 const {location,navigate}=useAppLocation(`/${bootstrap.locale}/${bootstrap.route}`),locale=bootstrap.locale;
 const route=location.pathname.replace(/^\/(en|es)\//,'');
 const [now,setNow]=useState(bootstrap.now);
 useEffect(()=>{try{repository.restore(window.localStorage);}catch{}setNow(new Date().toISOString());},[repository]);
 useEffect(()=>{
  document.querySelectorAll<HTMLAnchorElement>('.lang-menu a').forEach(link=>{const target=new URL(link.href,window.location.href);target.pathname=`/${target.pathname.split('/')[1]}/${route}`;target.search=location.search;target.hash=location.hash;link.href=target.pathname+target.search+target.hash;});
  // Keep the existing header and its original navigation rules during in-App links.
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
 return <MantineProvider theme={theme} forceColorScheme="dark" cssVariablesResolver={paletteVariables} cssVariablesSelector=".mantine-app" deduplicateCssVariables={false} withGlobalClasses={false} getRootElement={()=>typeof document==='undefined'?undefined:document.querySelector<HTMLElement>('[data-app-react]')||undefined}>
  <div className="mantine-app-content" onClick={click}>
   {route==='app/profile/'?<Profile repository={repository} locale={locale} location={location} navigate={navigate} now={now}/>:route==='app/search/'?<SearchWorkspace repository={repository} locale={locale} location={location} navigate={navigate}/>:<MantineWorkspace repository={repository} locale={locale} location={location} navigate={navigate} articles={bootstrap.articles||[]} now={now}/>}
   <div id="mantine-portal-root"/>

  </div>
 </MantineProvider>;
}
