import {build} from 'esbuild';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
await build({entryPoints:[path.join(root,'backend/src/worker.ts')],outfile:path.join(root,'.migration/api/worker.mjs'),bundle:true,format:'esm',platform:'browser',conditions:['worker','browser'],target:'es2022',minify:true,logLevel:'info'});
await build({entryPoints:[path.join(root,'frontend/api/client.ts')],outfile:path.join(root,'.migration/api/client.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',logLevel:'info'});
for(const [entry,output] of [['indexing.ts','indexing.mjs'],['indexing-worker.ts','indexing-worker.mjs']])await build({entryPoints:[path.join(root,'backend/src',entry)],outfile:path.join(root,'.migration/api',output),bundle:true,format:'esm',platform:'browser',conditions:['worker','browser'],target:'es2022',minify:true,logLevel:'info'});
console.log('Built isolated API, async client and indexing adapters. No SQL, migration, QA, schedule or deployment was executed.');
