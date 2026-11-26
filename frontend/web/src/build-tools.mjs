import {build,transform} from 'esbuild';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'.migration/tools');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const result=await build({entryPoints:[path.join(root,'../tools/src/runtime.js')],nodePaths:[path.join(root,'node_modules')],bundle:true,write:false,platform:'browser',format:'iife',globalName:'DwcToolRuntime',target:'es2022',external:['stream'],minify:true,legalComments:'eof',banner:{js:'/*! pako 3.0.2 + sax 1.6.1: /assets/vendor/tools-runtime-LICENSES.txt */'},logLevel:'info'});
const bytes=result.outputFiles[0].contents,digest=createHash('sha256').update(bytes).digest('hex').slice(0,20),runtime=`tools-runtime-${digest}.js`;
await writeFile(path.join(out,runtime),bytes);
const scripts={};
for(const name of ['processing-core.js','workbench.js','workbench-i18n.js']){
 const source=await readFile(path.join(root,'src/site/assets',name),'utf8');
 const {code}=await transform(source,{target:'es2022',legalComments:'eof',sourcefile:name});
 await writeFile(path.join(out,name),code);scripts[name]=createHash('sha256').update(code).digest('hex').slice(0,20);
}
const core=await readFile(path.join(out,'processing-core.js'),'utf8'),coreHash=scripts['processing-core.js'],coreName=`processing-core-${coreHash}.js`;
await writeFile(path.join(out,coreName),core);
const source=await readFile(path.join(root,'src/site/assets/processing-worker.js'),'utf8');
const {code:worker}=await transform(source.replace('__TOOLS_RUNTIME__',runtime).replace('__TOOLS_CORE__',coreName),{target:'es2022',sourcefile:'processing-worker.js'});
await writeFile(path.join(out,'processing-worker.js'),worker);
await writeFile(path.join(out,'manifest.json'),JSON.stringify({runtime,coreName,scripts,workerHash:createHash('sha256').update(worker).digest('hex').slice(0,20)})+'\n');
console.log('Built local Tools Worker runtime. No QA was run.');
