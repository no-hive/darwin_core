import {hydrateRoot} from 'react-dom/client';
import {Application} from './Application';
import type {Bootstrap} from './types';
const root=document.querySelector<HTMLElement>('main[data-app-react]');
const data=document.getElementById('app-react-data'),seed=document.getElementById('app-prototype-data');
if(root&&data&&seed){
  const bootstrap:Bootstrap={...JSON.parse(data.textContent||'{}'),seed:JSON.parse(seed.textContent||'{}')};
  hydrateRoot(root,<Application bootstrap={bootstrap}/>);
}
