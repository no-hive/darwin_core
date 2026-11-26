import {runIndexTurn} from './indexing';
interface Env {DWC_INDEXING_ENABLED?:string;DWC_INDEX_DATABASE_URL?:string}
interface Context {waitUntil(promise:Promise<unknown>):void}
export default {
 fetch(){return new Response('Not found',{status:404});},
 scheduled(_event:unknown,env:Env,ctx:Context){
  if(env.DWC_INDEXING_ENABLED!=='true'||!env.DWC_INDEX_DATABASE_URL)return;
  const requestId=crypto.randomUUID();
  ctx.waitUntil(runIndexTurn({connection:env.DWC_INDEX_DATABASE_URL}).then(summary=>{
   console.log(JSON.stringify({event:'index_turn',requestId,...summary}));
  },()=>{console.error(JSON.stringify({event:'index_turn_failed',requestId}));}));
 }
};
