import {build} from 'esbuild';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
await build({entryPoints:[path.join(root,'cms/delivery/worker.mjs')],outfile:path.join(root,'.migration/delivery/worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',logLevel:'info'});
console.log('Delivery Worker bundled only. No service, database or webhook was created.');
