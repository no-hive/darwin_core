import {neon,neonConfig} from '@neondatabase/serverless';
const fetchDatabase=globalThis.fetch.bind(globalThis);
// Operator CLIs can run longer than one request. The timeout starts afresh for
// each HTTP operation, including transaction batches, rather than at login time.
neonConfig.fetchFunction=(input,init)=>fetchDatabase(input,{...init,signal:init?.signal??AbortSignal.timeout(30000)});
export function adminDatabase(){
 const connection=process.env.DWC_MIGRATION_DATABASE_URL;if(!connection)throw Error('Set DWC_MIGRATION_DATABASE_URL securely.');
 let url;try{url=new URL(connection);}catch{throw Error('Invalid migration database configuration.');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname.endsWith('.neon.tech')||!url.username||!url.password)throw Error('Use the selected Neon PostgreSQL database.');
 return neon(connection);
}
export function operatorFailure(){console.error('Database operation failed. Check the selected database, permissions and migration state. Connection details were not logged.');process.exitCode=1;}
