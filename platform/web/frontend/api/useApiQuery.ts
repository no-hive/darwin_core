import {useEffect,useState} from 'react';
export type QueryState<T>={status:'loading';data:T|null;error:null}|{status:'success';data:T;error:null}|{status:'error';data:T|null;error:Error};
/** Pass a stable useCallback loader. Abort obsolete requests and retain prior
 * data during reloads; never replace a failed server request with demo data. */
export function useApiQuery<T>(load:(signal:AbortSignal)=>Promise<T>){
 const [revision,reload]=useState(0);
 const [state,setState]=useState<QueryState<T>>({status:'loading',data:null,error:null});
 useEffect(()=>{
  const controller=new AbortController();
  setState(previous=>({status:'loading',data:previous.data,error:null}));
  load(controller.signal).then(data=>{if(!controller.signal.aborted)setState({status:'success',data,error:null});},error=>{if(!controller.signal.aborted)setState(previous=>({status:'error',data:previous.data,error:error instanceof Error?error:new Error('request_failed')}));});
  return()=>controller.abort();
 },[load,revision]);
 return {state,reload:()=>reload(value=>value+1)};
}
