import {useEffect,useState} from 'react';
import type {LocationState} from './types';
export function useAppLocation(initialPath:string){
  const [location,setLocation]=useState<LocationState>({pathname:initialPath,search:'',hash:''});
  useEffect(()=>{
    const sync=()=>setLocation({pathname:window.location.pathname,search:window.location.search,hash:window.location.hash});
    sync();window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
    return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);};
  },[]);
  const navigate=(target:string)=>{const url=new URL(target,window.location.href);window.history.pushState(null,'',url.pathname+url.search+url.hash);setLocation({pathname:url.pathname,search:url.search,hash:url.hash});};
  return {location,navigate};
}
