import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'../..'),folder=path.join(root,'.migration/delivery');
const hash=value=>createHash('sha256').update(value).digest('hex');
await mkdir(folder,{recursive:true});
const candidateFile=path.join(folder,'candidate.json');
if(process.argv[2]==='record-publication'){
  const deploymentId=process.env.DWC_PUBLISHED_DEPLOYMENT_ID;
  if(!deploymentId||!/^appgdep_[a-zA-Z0-9]+$/.test(deploymentId))throw Error('Provide the exact successful Sites deployment ID; do not record pending deployments.');
  const candidate=JSON.parse(await readFile(candidateFile,'utf8'));
  // This is a trusted caller receipt, not an independent provider status check.
  await writeFile(path.join(folder,'published.json.tmp'),JSON.stringify({...candidate,deploymentId,recordedAt:new Date().toISOString()})+'\n');
  await rename(path.join(folder,'published.json.tmp'),path.join(folder,'published.json'));
  console.log('Recorded the successful publication manifest. No QA was run.');
}else{
  const routes={};
  async function walk(folder){
    for(const entry of await readdir(folder,{withFileTypes:true})){
      const file=path.join(folder,entry.name);
      if(entry.isDirectory()){await walk(file);continue;}
      const relative=path.relative(path.join(root,'dist'),file).split(path.sep).join('/');
      if(relative.startsWith('assets/optimized/'))continue;
      const route='/'+relative.replace(/index\.html$/,'');
      routes[route]=hash(await readFile(file));
    }
  }
  await walk(path.join(root,'dist'));
  let assets=[];try{assets=(await readdir(path.join(root,'dist/assets/optimized'))).sort();}catch(error){if(error.code!=='ENOENT')throw error;}
  const candidate={schema:1,routes,assets};
  candidate.digest=hash(JSON.stringify(candidate));
  let published=null;try{published=JSON.parse(await readFile(path.join(folder,'published.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const changed=Object.keys(routes).filter(route=>published?.routes[route]!==routes[route]);
  const removed=Object.keys(published?.routes||{}).filter(route=>!Object.hasOwn(routes,route));
  await writeFile(candidateFile,JSON.stringify(candidate,null,2)+'\n');
  await writeFile(path.join(folder,'changes.json'),JSON.stringify({schema:1,digest:candidate.digest,baselineDeployment:published?.deploymentId||null,changed,removed},null,2)+'\n');
  console.log(`Prepared delivery manifest for ${Object.keys(routes).length} routes. Cache invalidation is not executed by a build.`);
}
