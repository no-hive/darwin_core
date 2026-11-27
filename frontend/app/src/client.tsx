import {hydrateRoot} from 'react-dom/client';
import {ClientApplication} from './ClientApplication';
import type {Bootstrap} from './types';
const root=document.querySelector<HTMLElement>('main[data-app-react]');
const data=document.getElementById('app-react-data'),seed=document.getElementById('app-prototype-data');
const loadRoute=async(route:string)=>{
  if(route==='app/search/')return (await import('./SearchWorkspace')).SearchWorkspace;
  if(route==='app/profile/')return (await import('./Profile')).Profile;
  return (await import('./MantineWorkspace')).MantineWorkspace;
};
if(root&&data&&seed){
  const bootstrap:Bootstrap={...JSON.parse(data.textContent||'{}'),seed:JSON.parse(seed.textContent||'{}')};
  const initialView=await loadRoute(bootstrap.route);
  hydrateRoot(root,<ClientApplication bootstrap={bootstrap} initialView={initialView} loadRoute={loadRoute}/>);
}
