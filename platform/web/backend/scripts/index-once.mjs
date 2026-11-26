// Built job runner; never executed from the site build or a page request.
const apply=process.argv[2]==='--apply';
if(process.argv.length>3||process.argv[2]&&!apply)throw Error('Usage: npm run api:index [-- --apply]');
if(!apply)console.log('Plan only: up to 3 batches of 10 jobs, then bounded retention. No database connection.');
else try{
 const connection=process.env.DWC_INDEX_DATABASE_URL;if(!connection)throw Error();
 const {runIndexTurn}=await import('../../.migration/api/indexing.mjs');
 console.log(JSON.stringify(await runIndexTurn({connection})));
}catch{console.error('Index turn failed; credentials and database details were not logged. Committed batches are retained; unfinished transactions can be retried.');process.exitCode=1;}
