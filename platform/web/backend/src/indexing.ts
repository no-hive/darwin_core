import {connectDatabase} from './database';
export interface IndexTurnOptions {connection:string;maxBatches?:number;batchSize?:number;deadlineMs?:number}
/** One bounded turn. Each SQL call commits projection + acknowledgement together.
 * A lost HTTP response can be retried without acknowledging uncommitted work. */
export async function runIndexTurn({connection,maxBatches=3,batchSize=10,deadlineMs=20000}:IndexTurnOptions){
 if(!Number.isInteger(maxBatches)||maxBatches<1||maxBatches>10||!Number.isInteger(batchSize)||batchSize<1||batchSize>50||!Number.isInteger(deadlineMs)||deadlineMs<1000||deadlineMs>25000)throw Error('invalid_index_limits');
 const sql=connectDatabase(connection),start=performance.now();let batches=0,processed=0,failed=0,claimed=0;
 for(;batches<maxBatches;){
  const remaining=deadlineMs-(performance.now()-start);if(remaining<1000)break;
  const rows=await sql.query('SELECT dwc.index_batch($1) AS data',[batchSize],{fetchOptions:{signal:AbortSignal.timeout(Math.max(1,Math.floor(Math.min(10000,remaining))))}});
  const result=rows[0]?.data;if(!result||!Number.isInteger(result.claimed)||!Number.isInteger(result.processed)||!Number.isInteger(result.failed))throw Error('invalid_index_response');
  batches++;processed+=result.processed;failed+=result.failed;claimed+=result.claimed;
  if(result.claimed<batchSize)break;
 }
 const remaining=deadlineMs-(performance.now()-start);
 if(remaining>=1000)await sql.query('SELECT dwc.index_prune()',[ ],{fetchOptions:{signal:AbortSignal.timeout(Math.max(1,Math.floor(Math.min(10000,remaining))))}});
 return {batches,processed,failed,claimed,elapsedMs:Math.round(performance.now()-start)};
}
