import http from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';

if(process.env.SITES_MANAGED_LINUX_CONTAINER==='1')throw Error('Use supported Sites preview/CUA in managed Linux. The portable preview server is disabled here.');
const password=process.env.DWC_PREVIEW_ACCESS_PASSWORD;
if(!password||password.length<24)throw Error('Set DWC_PREVIEW_ACCESS_PASSWORD to a private password of at least 24 characters.');
const hash=value=>createHash('sha256').update(value).digest();
const expected=hash('Basic '+Buffer.from('preview:'+password).toString('base64'));
const root=path.resolve(import.meta.dirname,'../../.migration/preview');
const mime={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
http.createServer(async(request,response)=>{
  response.setHeader('Cache-Control','private, no-store');response.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Referrer-Policy','no-referrer');
  if(!timingSafeEqual(hash(request.headers.authorization||''),expected)){response.writeHead(401,{'WWW-Authenticate':'Basic realm="Private article preview"'}).end('Authentication required');return;}
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    let file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const bytes=await readFile(file);response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});response.end(request.method==='HEAD'?undefined:bytes);
  }catch{response.writeHead(404).end('Article preview not found');}
}).listen(4322,'127.0.0.1',()=>console.log('Private article preview: http://127.0.0.1:4322 — user: preview; password comes from your environment.'));
