import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
const root=process.cwd(),scope=vm.createContext({setImmediate,setTimeout,clearTimeout,Uint8Array,ArrayBuffer,Blob,TextEncoder,TextDecoder});scope.self=scope;
vm.runInContext(readFileSync('src/site/assets/vendor/jszip.min.js','utf8'),scope);const JSZip=scope.JSZip;
let fileSequence=0;
function client(t){
 const worker=new Worker(new URL('./helpers/tools-thread.mjs',import.meta.url),{workerData:{root}}),jobs=new Map();let sequence=0,closed=false;
 worker.on('message',message=>{const job=jobs.get(message.started??message.id);if(!job)return;if(message.started){job.start();return;}jobs.delete(message.id);message.error?job.reject(message.error):job.resolve(message.value);});
 worker.on('error',error=>{for(const job of jobs.values())job.reject(error);jobs.clear();});
 const request=(action,payload)=>{const id=++sequence;let start;const started=new Promise(resolve=>start=resolve);const result=new Promise((resolve,reject)=>{jobs.set(id,{resolve,reject,start});worker.postMessage({id,action,payload});});return {result,started};};
 const close=async()=>{if(closed)return;closed=true;for(const job of jobs.values())job.reject({code:'cancelled'});jobs.clear();await worker.terminate();};t.after(close);
 return {request,close,rpc:(action,payload)=>request(action,payload).result};
}
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const inline=(ref,text)=>`<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
const sheet=body=>`<worksheet xmlns="${NS}"><sheetData>${body}</sheetData></worksheet>`;
async function workbook(xml,{strings,second,utf16=false,store=false,excel1904=false}={}){
 const zip=new JSZip();
 zip.file('xl/workbook.xml',`<workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr date1904="${excel1904?'1':'0'}"/><sheets><sheet name="Primera" sheetId="1" r:id="r1"/>${second?'<sheet name="Second" sheetId="2" r:id="r2"/>':''}</sheets></workbook>`);
 zip.file('xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>${second?'<Relationship Id="r2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>':''}</Relationships>`);
 zip.file('xl/worksheets/sheet1.xml',utf16?new Uint8Array(Buffer.concat([Buffer.from([255,254]),Buffer.from(xml,'utf16le')])):xml);
 if(second)zip.file('xl/worksheets/sheet2.xml',second);
 if(strings)zip.file('xl/sharedStrings.xml',strings);
 return new Uint8Array(await zip.generateAsync({type:'uint8array',compression:store?'STORE':'DEFLATE'}));
}
const load=(worker,bytes,sheetName)=>worker.rpc('file',{file:{fixtureBytes:bytes,name:'fixture.xlsx'},bookId:'fixture-'+(++fileSequence),sheet:sheetName,options:{headerRow:0}});
function central(bytes,name){const b=Buffer.from(bytes);for(let at=0;at+46<b.length;at++){if(b.readUInt32LE(at)!==0x02014b50)continue;const n=b.readUInt16LE(at+28);if(b.subarray(at+46,at+46+n).toString()===name)return at;}throw Error('Missing fixture entry');}
const invalid=code=>error=>error.code===code;

test('actual thread: CSV/TSV, shared validation, pipeline and all export formats',async t=>{
 const worker=client(t),input=await worker.rpc('parse',{text:'Record,Species,Collected\n1,Poa annua,15/06/2025\n2,Poa annua,15/06/2025',delimiter:',',options:{headerRow:0,name:'fixture.csv'}});
 const steps=[{id:'s1',type:'dates',config:{source:'c2',format:'dmy'}},{id:'s2',type:'duplicates',config:{columns:['c1'],removeRowIds:[]}}];
 const result=await worker.rpc('run',{data:input,steps});assert.equal(result.data.rows[0].cells[2],'2025-06-15');assert.equal(result.steps[1].groups.length,1);
 assert.deepEqual(await worker.rpc('probe',{}),{zipLoaded:false,runtimeLoaded:false},'CSV processing loads neither ZIP writer nor XLSX parser');
 const recipe={format:'dwc-local-recipe',version:1,engine:result.engine,inputHeaders:input.columns.map(c=>c.name),steps};
 for(const action of ['csv','xlsx','report','issues','recipe','original','bundle']){
  const value=await worker.rpc('export',{action,input,result,recipe,safe:true,readme:'Synthetic test'});assert(value.blob.size>0);assert(value.name);
  if(action==='csv')assert.equal((await worker.rpc('probe',{})).zipLoaded,false,'CSV export does not load ZIP writer');
  if(action==='xlsx')assert.equal((await worker.rpc('probe',{})).zipLoaded,true,'XLSX writer is loaded on demand');
  if(action==='report'){const report=JSON.parse(await value.blob.text());assert.equal(report.summary.inputRows,2);assert.equal(report.export.formulaLikeFields,0);}
  if(action==='xlsx'){const roundtrip=await load(worker,new Uint8Array(await value.blob.arrayBuffer()));assert.deepEqual(roundtrip.input.rows.map(r=>r.cells),result.data.rows.map(r=>r.cells));}
  if(action==='bundle'){const zip=await JSZip.loadAsync(await value.blob.arrayBuffer());assert(zip.file('processing-report.json'));assert(zip.file('review-items.csv'));}
 }
 const tsv=await worker.rpc('file',{file:{fixtureBytes:new TextEncoder().encode('A\tB\n1\t2'),name:'fixture.tsv'},bookId:'tsv',options:{headerRow:0,encoding:'utf-8'}});assert.equal(tsv.input.columns.length,2);
 await assert.rejects(worker.rpc('run',{data:input,steps:[{id:'s1',type:'dates',config:{source:'c2',format:'bogus'}}]}),invalid('invalid_config'));
});
test('XLSX: namespaces, UTF16, rich shared strings, formula cache, booleans, merges, 1904 and sheets',async t=>{
 const worker=client(t),xml=`<worksheet xmlns="${NS}"><sheetData><row r="1">${['A','B','C','D','E'].map((c,i)=>inline(c+'1','Column'+i)).join('')}</row><row r="2"><c r="A2" t="s"><v>0</v></c><c r="B2" t="b"><v>1</v></c><c r="C2"><f>1+2</f><v>3</v></c><c r="D2"><f>1+2</f></c>${inline('E2','x &amp; y')}</row></sheetData><mergeCells><mergeCell ref="A3:B3"/></mergeCells></worksheet>`;
 const bytes=await workbook(xml,{strings:`<sst xmlns="${NS}"><si><r><t>Inés </t></r><r><t>Soler</t></r></si></sst>`,utf16:true,excel1904:true,second:sheet(`<row r="1">${inline('A1','Other')}</row><row r="2">${inline('A2','Second value')}</row>`)});
 const loaded=await load(worker,bytes);assert.deepEqual(loaded.input.rows[0].cells,['Inés Soler','TRUE','3','','x & y']);assert.equal(loaded.input.source.formulaCount,2);assert(loaded.input.source.merged);assert(loaded.input.source.excel1904);assert.equal(loaded.workbook.sheets.length,2);
 const other=await load(worker,bytes,'Second');assert.equal(other.input.rows[0].cells[0],'Second value');
});
test('preflight rejects advertised expansion, CRC corruption, ZIP64, encrypted and duplicate entries',async t=>{
 const worker=client(t),base=await workbook(sheet(`<row r="1">${inline('A1','Header')}</row><row r="2">${inline('A2','value')}</row>`),{store:true});
 const change=mutate=>{const bytes=Buffer.from(base);mutate(bytes,central(bytes,'xl/worksheets/sheet1.xml'));return new Uint8Array(bytes);};
 await assert.rejects(load(worker,change((b,at)=>b.writeUInt32LE(51*1024*1024,at+24))),invalid('xlsx_limit'));
 await assert.rejects(load(worker,change((b,at)=>{const local=b.readUInt32LE(at+42),start=local+30+b.readUInt16LE(local+26)+b.readUInt16LE(local+28);const where=b.indexOf(Buffer.from('value'),start);b[where]=86;})),invalid('xlsx_invalid'));
 await assert.rejects(load(worker,change((b,at)=>b.writeUInt16LE(b.readUInt16LE(at+8)|1,at+8))),invalid('xlsx_invalid'));
 await assert.rejects(load(worker,change(b=>b.writeUInt16LE(65535,b.length-12))),invalid('xlsx_invalid'));
 const duplicate=Buffer.from(await workbook(sheet(`<row r="1">${inline('A1','H')}</row><row r="2">${inline('A2','v')}</row>`),{second:sheet('')}));const second=central(duplicate,'xl/worksheets/sheet2.xml');duplicate[second+46+'xl/worksheets/sheet'.length]=49;
 await assert.rejects(load(worker,new Uint8Array(duplicate)),invalid('xlsx_invalid'));
});
test('streaming guards reject DTD, duplicate cells, huge coordinates and shared-string amplification',async t=>{
 const worker=client(t);
 await assert.rejects(load(worker,await workbook(`<!DOCTYPE worksheet [<!ENTITY bomb "bad">]>`+sheet(`<row r="1">${inline('A1','Header')}</row><row r="2">${inline('A2','&bomb;')}</row>`))),invalid('xlsx_invalid'));
 await assert.rejects(load(worker,await workbook(sheet(`<row r="1">${inline('A1','H')}</row><row r="2">${inline('A2','v')}${inline('A2','other')}</row>`))),invalid('xlsx_invalid'));
 await assert.rejects(load(worker,await workbook(sheet(`<row r="1">${inline('A1','H')}</row><row r="999999">${inline('A999999','v')}</row>`))),invalid('xlsx_limit'));
 const body=`<row r="1">${inline('A1','H')}</row>`+Array.from({length:101},(_,i)=>`<row r="${i+2}"><c r="A${i+2}" t="s"><v>0</v></c></row>`).join('');
 await assert.rejects(load(worker,await workbook(sheet(body),{strings:`<sst xmlns="${NS}"><si><t>${'x'.repeat(512*1024)}</t></si></sst>`})),invalid('xlsx_limit'));
});
test('recipe constraints and pre-allocation column limit preserve valid input',async t=>{
 const worker=client(t),headers=['A','B'];
 const valid={format:'dwc-local-recipe',version:1,inputHeaders:headers,steps:[{id:'s1',type:'map',config:{mappings:{c0:'A',c1:'B'}}}]};
 const recipe=value=>worker.rpc('recipe',{file:{fixtureBytes:new TextEncoder().encode(JSON.stringify(value)),name:'recipe.json'},headers,mode:'workflow'});
 assert.equal((await recipe(valid)).length,1);await assert.rejects(recipe({...valid,inputHeaders:['wrong']}),invalid('recipe_invalid'));
 await assert.rejects(recipe({...valid,steps:[{id:'s1',type:'duplicates',config:{columns:'bad'}}]}),invalid('recipe_invalid'));
 await assert.rejects(worker.rpc('parse',{text:Array(101).fill('H').join(',')+'\n'+Array(101).fill('v').join(','),delimiter:',',options:{headerRow:0}}),invalid('too_many_columns'));
 const data={columns:Array.from({length:100},(_,i)=>({id:'c'+i,name:'C'+i})),rows:[{id:2,cells:Array(100).fill('2025-01-01')}],source:{}};
 await assert.rejects(worker.rpc('run',{data,steps:[{id:'s1',type:'dates',config:{source:'c0'}}]}),invalid('too_many_columns'));
});
test('terminate stops an actual running thread; a new worker accepts the next job',async t=>{
 const worker=client(t),job=worker.request('parse',{text:'H\n"'+'x'.repeat(9*1024*1024)+'"',delimiter:',',options:{headerRow:0}});
 const rejected=assert.rejects(job.result,invalid('cancelled'));await job.started;const start=performance.now();await worker.close();await rejected;assert(performance.now()-start<5000);
 const next=client(t);assert.equal((await next.rpc('parse',{text:'H\nvalue',delimiter:',',options:{headerRow:0}})).rows[0].cells[0],'value');
});
