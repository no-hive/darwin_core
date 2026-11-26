/* Local, deterministic data processing. Shared by browser workers and Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DwcCore=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const VERSION='1.1.0';
const LIMITS=Object.freeze({bytes:10*1024*1024,rows:50000,columns:100,cells:1000000,header:4096,textBytes:50*1024*1024,exportBytes:128*1024*1024});
class DataError extends Error{constructor(code,details={}){super(code);this.code=code;this.details=details;}}
const fail=(code,details)=>{throw new DataError(code,details);};
const copy=d=>({...d,columns:d.columns.map(c=>({...c})),rows:d.rows.map(r=>({id:r.id,cells:r.cells.slice()})),source:{...d.source}});
function checkSize(rows,width){if(width>LIMITS.columns)fail('too_many_columns');if(rows>LIMITS.rows||rows*width>LIMITS.cells)fail('too_many_rows');}
function utf8Bytes(value){let size=0;for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);if(c<128)size++;else if(c<2048)size+=2;else if(c>=0xd800&&c<=0xdbff&&value.charCodeAt(i+1)>=0xdc00&&value.charCodeAt(i+1)<=0xdfff){size+=4;i++;}else size+=3;}return size;}
function importOptions(options={}){
 const h=options.headerRow??0;
 if(!Number.isInteger(h)||h<0||h>19)fail('invalid_config');
 if(options.delimiter!==undefined&&!['',',',';','\t'].includes(options.delimiter))fail('bad_delimiter');
 if(options.encoding!==undefined&&!['utf-8','utf-16le','utf-16be','windows-1252'].includes(options.encoding))fail('decode_error');
 return {...options,headerRow:h};
}
function parseCSV(text,delimiter,options={}){
 if(typeof text!=='string'||!text.trim())fail('empty_input');
 if(new TextEncoder().encode(text).byteLength>LIMITS.bytes)fail('too_large');
 const h=importOptions(options).headerRow;
 text=text.replace(/^\uFEFF/,'');
 if(!delimiter)delimiter=detectDelimiter(text);
 if(![',',';','\t'].includes(delimiter))fail('bad_delimiter');
 const records=[];let row=[],cell='',quoted=false,closed=false,recordStart=true,cells=0;
 const pushCell=()=>{if(row.length>=LIMITS.columns)fail('too_many_columns');row.push(cell);};
 const pushRow=()=>{if(records.length>=LIMITS.rows+h+1)fail('too_many_rows');cells+=row.length;if(cells>LIMITS.cells+(h+1)*LIMITS.columns)fail('too_many_rows');records.push(row);};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(closed&&c!==delimiter&&c!=='\r'&&c!=='\n')fail('invalid_csv',{line:records.length+1});
  if(c==='"'){if(cell!==''||closed)fail('invalid_csv',{line:records.length+1});quoted=true;recordStart=false;}
  else if(c===delimiter){pushCell();cell='';closed=false;recordStart=false;}
  else if(c==='\r'||c==='\n'){
   if(c==='\r'&&text[i+1]==='\n')i++;
   pushCell();if(!recordStart||row.some(x=>x!==''))pushRow();
   row=[];cell='';closed=false;recordStart=true;
  }else{cell+=c;recordStart=false;}
 }
 if(quoted)fail('unclosed_quote');
 if(cell!==''||row.length||closed){pushCell();pushRow();}
 if(!records.length)fail('empty_input');
 return {records,delimiter};
}
function detectDelimiter(text){
 const scores=[',',';','\t'].map(d=>{try{const sample=parseCSV(text.slice(0,65536),d).records.slice(0,12);const lengths=sample.map(r=>r.length);let frequencies=new Map();lengths.forEach(n=>frequencies.set(n,(frequencies.get(n)||0)+1));let best=[1,0];for(const [n,count]of frequencies)if(n>1&&count>best[1])best=[n,count];return {d,score:best[1]*100+Math.min(best[0],99)};}catch{return{d,score:0};}}).sort((a,b)=>b.score-a.score);
 return scores[0].score?scores[0].d:',';
}
function fromRecords(records,options={}){
 const h=importOptions(options).headerRow;if(!Array.isArray(records)||h>=records.length)fail('empty_input');
 const headers=records[h];if(!Array.isArray(headers))fail('invalid_data');if(!headers.length)fail('empty_input');
 if(headers.some(value=>String(value??'').length>LIMITS.header))fail('invalid_data');
 checkSize(records.length-h-1,headers.length);
 const names=headers.map((x,i)=>String(x??'').trim()||`column_${i+1}`);
 const seen=new Map();let warnings=[];
 const used=new Set();const columns=names.map((name,i)=>{let outputName=name,count=1;while(used.has(outputName)){count++;outputName=name+'__'+count;}used.add(outputName);if(outputName!==name)warnings.push({code:'duplicate_header',column:i+1,name});return{id:'c'+i,name:outputName,originalName:String(headers[i]??'')};});
 const rows=[];
 for(let i=h+1;i<records.length;i++){
  const r=records[i];if(!Array.isArray(r)||r.length!==headers.length)fail('ragged_row',{line:i+1,expected:headers.length,actual:r?.length});
  rows.push({id:i+1,cells:r.map(x=>String(x??''))});
 }
 if(!rows.length)fail('no_data_rows');
 return validateData({columns,rows,source:{name:options.name||'pasted-data',delimiter:options.delimiter||',',headerRow:h+1,...options.source},warnings});
}
const TERMS=[
 ['occurrenceID',['record','record id','observation id','registro','id registro']],['scientificName',['species','taxon','species name','especie','nombre cientifico','nombre científico']],['eventDate',['collected','collection date','date collected','fecha','fecha de recoleccion','fecha de recolección']],['verbatimEventDate',[]],['eventID',['event id','evento']],['parentEventID',[]],['basisOfRecord',['record type','tipo de registro']],['recordedBy',['collector','observer','colector','observador']],['identifiedBy',['identified by','determinado por']],['identificationID',[]],['identificationRemarks',[]],['verbatimIdentification',[]],['scientificNameID',[]],['taxonID',[]],['taxonRank',['rank','rango']],['kingdom',['reino']],['phylum',['filo']],['class',['clase']],['order',['orden']],['family',['familia']],['genus',['genero','género']],['specificEpithet',[]],['infraspecificEpithet',[]],['scientificNameAuthorship',[]],['country',['pais','país']],['countryCode',[]],['stateProvince',['province','provincia']],['county',[]],['municipality',['municipio']],['locality',['location description','localidad']],['verbatimLocality',[]],['locationID',['site id','sitio']],['decimalLatitude',['latitude','lat','gps north','latitud']],['decimalLongitude',['longitude','lon','lng','gps east','longitud']],['geodeticDatum',[]],['coordinateUncertaintyInMeters',[]],['verbatimCoordinates',[]],['institutionCode',[]],['collectionCode',[]],['catalogNumber',['catalog number','numero de catalogo','número de catálogo']],['occurrenceStatus',[]],['occurrenceRemarks',['observation notes']],['individualCount',['count','recuento']],['organismQuantity',[]],['organismQuantityType',[]],['sex',['sexo']],['lifeStage',[]],['habitat',['habitat','hábitat']],['samplingProtocol',[]],['samplingEffort',[]],['sampleSizeValue',[]],['sampleSizeUnit',[]],['year',['año','ano']],['month',['mes']],['day',['dia','día']],['eventTime',[]],['datasetID',[]],['datasetName',[]],['associatedMedia',[]],['references',[]],['license',['licencia']],['rightsHolder',[]],['informationWithheld',[]],['dataGeneralizations',[]]
];
const key=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function suggestMapping(name){const exact=TERMS.find(([t])=>key(t)===key(name));if(exact)return{target:exact[0],reason:'term'};const alias=TERMS.find(([,aliases])=>aliases.some(a=>key(a)===key(name)));return alias?{target:alias[0],reason:'alias'}:null;}
function mapColumns(data,config,step){
 const mappings=config.mappings||{};const output=copy(data);const keep=[];let changes=[];
 output.columns.forEach((c,i)=>{const target=Object.prototype.hasOwnProperty.call(mappings,c.id)?mappings[c.id]:c.name;if(target===null)return;if(typeof target!=='string'||!target.trim())fail('empty_target',{column:c.name});if(target.length>LIMITS.header)fail('invalid_config');keep.push(i);if(target!==c.name)changes.push({step,code:'header_mapped',column:c.name,before:c.name,after:target.trim()});c.name=target.trim();});
 if(!keep.length)fail('all_columns_removed');output.columns=keep.map(i=>output.columns[i]);output.rows=output.rows.map(r=>({id:r.id,cells:keep.map(i=>r.cells[i])}));
 const names=output.columns.map(c=>c.name);if(new Set(names).size!==names.length)fail('target_collision');
 return{data:output,issues:[],changes,summary:{mapped:changes.length,excluded:data.columns.length-output.columns.length}};
}
function findDuplicates(data,config,step){
 const ids=config.columns||data.columns.filter(c=>!['occurrenceid','id'].includes(c.name.toLowerCase())).map(c=>c.id);
 if(!ids.length)fail('choose_columns');const indexes=ids.map(id=>data.columns.findIndex(c=>c.id===id));if(indexes.some(i=>i<0))fail('missing_column');
 const groups=new Map();
 data.rows.forEach(r=>{let values=indexes.map(i=>r.cells[i]);if(config.trim)values=values.map(v=>v.trim());if(config.ignoreCase)values=values.map(v=>v.toLowerCase());if(values.every(v=>v===''))return;const hash=JSON.stringify(values);if(!groups.has(hash))groups.set(hash,[]);groups.get(hash).push(r.id);});
 const duplicateGroups=[...groups.values()].filter(g=>g.length>1).map((rowIds,i)=>({id:i+1,rowIds}));
 const candidates=new Set(duplicateGroups.flatMap(g=>g.rowIds));const remove=new Set((config.removeRowIds||[]).filter(id=>candidates.has(id)));
 // Never remove the last member of a candidate group.
 if(duplicateGroups.some(g=>g.rowIds.every(id=>remove.has(id))))fail('keep_one_record');
 const output=copy(data);output.rows=output.rows.filter(r=>!remove.has(r.id));
 const issues=duplicateGroups.flatMap(g=>g.rowIds.map(rowId=>({step,rowId,code:'duplicate_candidate',group:g.id})));
 return{data:output,issues,changes:[...remove].map(rowId=>({step,rowId,code:'row_removed'})),groups:duplicateGroups,summary:{groups:duplicateGroups.length,candidates:candidates.size,removed:remove.size}};
}
const pad=n=>String(n).padStart(2,'0');
const leap=y=>y%4===0&&(y%100!==0||y%400===0);
function dateParts(y,m,d){if(y<1||y>9999||!Number.isInteger(y))return{status:'invalid',code:'invalid_date'};if(m!==undefined&&(m<1||m>12))return{status:'invalid',code:'invalid_date'};const max=m?[31,leap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1]:null;if(d!==undefined&&(d<1||d>max))return{status:'invalid',code:'invalid_date'};return{status:'valid',value:String(y).padStart(4,'0')+(m!==undefined?'-'+pad(m):'')+(d!==undefined?'-'+pad(d):''),precision:d!==undefined?'day':m!==undefined?'month':'year'};}
function parseDate(value,config={}){
 const original=String(value??'');const v=original.trim();if(v==='')return{status:'empty',value:''};
 if(config.format==='excel'){
  if(!/^\d+(\.0+)?$/.test(v))return{status:'invalid',code:'excel_integer_required'};
  const n=Number(v);if(!Number.isSafeInteger(n)||n<0||n>2958465)return{status:'invalid',code:'invalid_date'};
  if(!config.excel1904&&n===60)return{status:'invalid',code:'excel_leap_bug'};
  if(!config.excel1904&&n===0)return{status:'invalid',code:'invalid_date'};
  const t=Date.UTC(config.excel1904?1904:1899,config.excel1904?0:11,config.excel1904?1:31)+(n-(!config.excel1904&&n>60?1:0))*86400000;
  const date=new Date(t);return dateParts(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate());
 }
 if(v.includes('/')){
  if(/^\d{4}(?:-\d{2}(?:-\d{2})?)?\/\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(v)){
   const [a,b]=v.split('/').map(s=>parseDate(s,{format:'auto'}));if(a.status!=='valid'||b.status!=='valid')return{status:'invalid',code:'invalid_interval'};
   if(a.value>b.value)return{status:'invalid',code:'reversed_interval'};
   return{status:'valid',value:a.value+'/'+b.value,precision:'interval'};
  }
 }
 let match;
 if((match=/^(\d{4})([/.])(\d{1,2})\2(\d{1,2})$/.exec(v)))return dateParts(+match[1],+match[3],+match[4]);
 if((match=/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(v)))return dateParts(+match[1],match[2]?+match[2]:undefined,match[3]?+match[3]:undefined);
 if((match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/.exec(v))){
  const d=dateParts(+match[1],+match[2],+match[3]);if(d.status!=='valid'||+match[4]>23||+match[5]>59||+(match[6]||0)>59)return{status:'invalid',code:'invalid_date'};
  const offset=match[7];if(offset&&offset!=='Z'){const hh=+offset.slice(1,3),mm=+offset.slice(4);if(hh>14||mm>59||(hh===14&&mm!==0))return{status:'invalid',code:'invalid_date'};}
  return{status:'valid',value:v,precision:'timestamp'};
 }
 if((match=/^(\d{1,2})([/.\-])(\d{1,2})\2(\d{4})$/.exec(v))){
  let a=+match[1],b=+match[3];const y=+match[4];
  if(config.format==='dmy')return dateParts(y,b,a);if(config.format==='mdy')return dateParts(y,a,b);
  if(a<=12&&b<=12&&a!==b)return{status:'ambiguous',code:'ambiguous_date'};
  if(a>12&&b<=12)return dateParts(y,b,a);if(b>12&&a<=12)return dateParts(y,a,b);
  if(a===b)return dateParts(y,b,a);return{status:'invalid',code:'invalid_date'};
 }
 return{status:'invalid',code:'unsupported_date'};
}
function normalizeDates(data,config,step){
 const index=data.columns.findIndex(c=>c.id===config.source);if(index<0)fail('choose_date_column');
 let end=-1;if(config.end){end=data.columns.findIndex(c=>c.id===config.end);if(end<0||end===index)fail('choose_end_column');}
 checkSize(data.rows.length,data.columns.length+1);
 const output=copy(data),issues=[],changes=[];let target=index,backup=-1;
 const mode=config.writeMode||'replace';
 if(mode==='new'){
  const name=(config.targetName||'eventDate_normalized').trim();if(!name)fail('empty_target');if(data.columns.some(c=>c.name===name))fail('target_collision');
  target=output.columns.length;output.columns.push({id:'date_'+step,name});output.rows.forEach(r=>r.cells.push(''));
 }else{
  let name=data.columns[index].name+'_original';let n=2;while(output.columns.some(c=>c.name===name)){name=data.columns[index].name+'_original_'+n++;}
  backup=output.columns.length;output.columns.push({id:'original_'+step,name});output.rows.forEach(r=>r.cells.push(r.cells[index]));
 }
 let valid=0,empty=0,unresolved=0;
 data.rows.forEach((r,i)=>{
  let result=parseDate(r.cells[index],config);
  if(end>=0){const b=parseDate(r.cells[end],config);if(result.status==='empty'&&b.status==='empty')result={status:'empty',value:''};else if(result.status!=='valid'||b.status!=='valid'||result.precision==='timestamp'||b.precision==='timestamp'||result.precision==='interval'||b.precision==='interval')result={status:'invalid',code:'invalid_interval'};else if(result.value>b.value)result={status:'invalid',code:'reversed_interval'};else result={status:'valid',value:result.value+'/'+b.value,precision:'interval'};}
  if(result.status==='valid'){
   valid++;output.rows[i].cells[target]=result.value;
   if(result.value!==r.cells[index]||mode==='new')changes.push({step,rowId:r.id,column:output.columns[target].name,before:r.cells[index],after:result.value,code:'date_normalized'});
  }else if(result.status==='empty')empty++;
  else{unresolved++;issues.push({step,rowId:r.id,column:data.columns[index].name,before:r.cells[index],code:result.code});}
 });
 checkSize(output.rows.length,output.columns.length);
 return{data:output,issues,changes,summary:{valid,empty,unresolved,changed:changes.length}};
}
function validateData(data){
 if(!data||!Array.isArray(data.columns)||!data.columns.length||!Array.isArray(data.rows))fail('invalid_data');
 checkSize(data.rows.length,data.columns.length);
 for(const column of data.columns)if(!column||typeof column.id!=='string'||!column.id||typeof column.name!=='string'||column.name.length>LIMITS.header)fail('invalid_data');
 if(new Set(data.columns.map(c=>c.id)).size!==data.columns.length)fail('invalid_data');
 let bytes=data.columns.reduce((sum,c)=>sum+utf8Bytes(c.name),0);
 const ids=new Set();for(const row of data.rows){if(!row||!Number.isSafeInteger(row.id)||row.id<1||ids.has(row.id)||!Array.isArray(row.cells)||row.cells.length!==data.columns.length)fail('invalid_data');ids.add(row.id);for(const value of row.cells){if(typeof value!=='string')fail('invalid_data');bytes+=utf8Bytes(value);if(bytes>LIMITS.textBytes)fail('table_text_limit');}}
 return data;
}
function validateSteps(steps){
 if(!Array.isArray(steps)||!steps.length||steps.length>8)fail('invalid_steps');
 const ids=new Set();
 for(const step of steps){
  if(!step||!['map','dates','duplicates'].includes(step.type)||step.id!==undefined&&(typeof step.id!=='string'||!step.id||step.id.length>80||ids.has(step.id))||step.config!==undefined&&(!step.config||typeof step.config!=='object'||Array.isArray(step.config)))fail('invalid_config');if(step.id!==undefined)ids.add(step.id);
  const cfg=step.config||{},allowed={map:['mappings','removeRowIds'],dates:['source','end','format','excel1904','writeMode','targetName','removeRowIds'],duplicates:['columns','trim','ignoreCase','removeRowIds']}[step.type];
  if(Object.keys(cfg).some(k=>!allowed.includes(k)))fail('invalid_config');
  if(cfg.removeRowIds!==undefined&&(!Array.isArray(cfg.removeRowIds)||cfg.removeRowIds.length>LIMITS.rows||cfg.removeRowIds.some(id=>!Number.isSafeInteger(id)||id<1)))fail('invalid_config');
  if(step.type==='map'&&cfg.mappings!==undefined){if(!cfg.mappings||typeof cfg.mappings!=='object'||Array.isArray(cfg.mappings)||Object.keys(cfg.mappings).length>LIMITS.columns||Object.values(cfg.mappings).some(v=>v!==null&&(typeof v!=='string'||v.length>LIMITS.header)))fail('invalid_config');}
  if(step.type==='dates'){
   if(cfg.format!==undefined&&!['auto','dmy','mdy','excel'].includes(cfg.format)||cfg.writeMode!==undefined&&!['replace','new'].includes(cfg.writeMode)||cfg.excel1904!==undefined&&typeof cfg.excel1904!=='boolean')fail('invalid_config');
   for(const key of ['source','end','targetName'])if(cfg[key]!==undefined&&(typeof cfg[key]!=='string'||cfg[key].length>LIMITS.header))fail('invalid_config');
  }
  if(step.type==='duplicates'){
   if(cfg.columns!==undefined&&(!Array.isArray(cfg.columns)||cfg.columns.length>LIMITS.columns||cfg.columns.some(id=>typeof id!=='string')))fail('invalid_config');
   for(const key of ['trim','ignoreCase'])if(cfg[key]!==undefined&&typeof cfg[key]!=='boolean')fail('invalid_config');
  }
 }
 return steps;
}
function validateRecipe(value,headers,mode){
 try{if(!value||value.format!=='dwc-local-recipe'||value.version!==1||JSON.stringify(value.inputHeaders)!==JSON.stringify(headers))fail('recipe_invalid');validateSteps(value.steps);if(value.steps.some(s=>!/^s\d{1,9}$/.test(s.id)||!s.config))fail('recipe_invalid');if(mode!=='workflow'&&(value.steps.length!==1||value.steps[0].type!==mode))fail('recipe_invalid');const steps=JSON.parse(JSON.stringify(value.steps));steps.forEach(s=>{s.config.removeRowIds=[];});return steps;}catch{fail('recipe_invalid');}
}
function runPipeline(input,steps){
 validateData(input);validateSteps(steps);let data=copy(input),issues=[],changes=[],results=[];
 steps.forEach((step,i)=>{
  try{const fn={map:mapColumns,duplicates:findDuplicates,dates:normalizeDates}[step.type];if(!fn)fail('unknown_step');const result=fn(data,step.config||{},step.id||'s'+i);validateData(result.data);results.push({id:step.id,type:step.type,inputColumns:data.columns.map(c=>({...c})),outputColumns:result.data.columns.map(c=>({...c})),issues:result.issues,summary:result.summary,groups:result.groups||[]});data=result.data;issues.push(...result.issues);changes.push(...result.changes);}catch(e){if(e instanceof DataError){e.details={...e.details,step:i+1};}throw e;}
 });
 return{data,issues,changes,steps:results,summary:{inputRows:input.rows.length,outputRows:data.rows.length,changes:changes.length,issues:issues.length},engine:VERSION};
}
function formulaRisk(v){const s=String(v);if(/^[\t\r\n]/.test(s))return true;const trimmed=s.replace(/^ +/,'');return /^[=+@-]/.test(trimmed)&&!/^[-+]?\d+(?:[.,]\d+)?(?:[eE][-+]?\d+)?$/.test(trimmed);}
function formulaCount(data){let count=data.columns.filter(c=>formulaRisk(c.name)).length;for(const row of data.rows)for(const value of row.cells)if(formulaRisk(value))count++;return count;}
function toCSV(data,delimiter=',',safe=false){const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const cell=v=>quote(safe&&formulaRisk(v)?"'"+v:v);return'\uFEFF'+[data.columns.map(c=>c.name).map(cell).join(delimiter),...data.rows.map(r=>r.cells.map(cell).join(delimiter))].join('\r\n');}
return{VERSION,LIMITS,DataError,utf8Bytes,importOptions,validateData,validateSteps,validateRecipe,parseCSV,detectDelimiter,fromRecords,copy,TERMS,suggestMapping,mapColumns,findDuplicates,parseDate,normalizeDates,runPipeline,toCSV,formulaRisk,formulaCount};
});
