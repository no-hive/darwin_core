import {build,transform} from 'esbuild';
import postcss from 'postcss';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'.migration/app');
await mkdir(out,{recursive:true});
const common={nodePaths:[path.join(root,'node_modules')],bundle:true,format:'esm',jsx:'automatic',target:'es2022',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'};
await build({...common,entryPoints:[path.join(root,'../app/src/server.tsx')],outfile:path.join(out,'server.mjs'),platform:'node',packages:'external'});
const assets=path.join(out,'assets');await rm(assets,{recursive:true,force:true});await mkdir(assets,{recursive:true});
const client=await build({...common,entryPoints:{connected:path.join(root,'../app/src/client.tsx')},outdir:assets,platform:'browser',minify:true,splitting:true,entryNames:'connected-[hash]',chunkNames:'app-chunk-[hash]',metafile:true});
const entry=Object.entries(client.metafile.outputs).find(([,output])=>output.entryPoint?.endsWith('/app/src/client.tsx'));
if(!entry)throw Error('The application client entry was not emitted.');
const filename=path.basename(entry[0]);
// Scope the library reset/components to App content. The original navigation
// and footer retain their current shared stylesheet and markup.
const componentStyles=['global','default-css-variables','baseline','ActionIcon','Alert','Anchor','Avatar','Badge','Button','Checkbox','Chip','CloseButton','Combobox','Divider','Group','InlineInput','Input','Loader','Menu','Modal','ModalBase','Overlay','Paper','Popover','Progress','Radio','SegmentedControl','SimpleGrid','Slider','Stack','Switch','Table','Tabs','ThemeIcon','Typography','UnstyledButton'];
const scope=postcss.atRule({name:'scope',params:'(.mantine-app)'});
for(const name of componentStyles)scope.append(postcss.parse(await readFile(path.join(root,'node_modules/@mantine/core/styles',`${name}.css`),'utf8')).nodes);
const custom=await readFile(path.join(root,'../app/src/mantine.css'),'utf8');
const css=(await transform(scope.toString()+'\n'+custom,{loader:'css',minify:true,target:'es2022'})).code;
const cssDigest=createHash('sha256').update(css).digest('hex').slice(0,20),cssFile=`mantine-${cssDigest}.css`;
await writeFile(path.join(assets,cssFile),css);
await writeFile(path.join(out,'manifest.json'),JSON.stringify({schema:2,client:`/assets/app/${filename}`,stylesheet:`/assets/app/${cssFile}`})+'\n');
console.log('Built React/TypeScript App client and server renderer. No QA was run.');
