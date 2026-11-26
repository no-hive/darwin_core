importScripts('__TOOLS_CORE__');
let cachedWorkbook=null;
const runtime=()=>{if(!self.DwcToolRuntime)importScripts('__TOOLS_RUNTIME__');return self.DwcToolRuntime;};
async function process(action,payload){
 const C=self.DwcCore;
 if(action==='parse'){
  cachedWorkbook=null;const options=C.importOptions(payload.options);
  const parsed=C.parseCSV(payload.text,payload.delimiter,options);
  return C.fromRecords(parsed.records,{...options,delimiter:parsed.delimiter});
 }
 if(action==='file'){
  const {file,bookId,sheet}=payload,options=C.importOptions(payload.options);
  if(!file||file.size>C.LIMITS.bytes)throw {code:'too_large'};
  if(!/\.(csv|tsv|xlsx)$/i.test(file.name))throw {code:'unsupported_file'};
  if(/\.xlsx$/i.test(file.name)){
   const R=runtime();
   if(!cachedWorkbook||cachedWorkbook.id!==bookId)cachedWorkbook={id:bookId,book:R.openWorkbook(await file.arrayBuffer(),C)};
   const book=cachedWorkbook.book,selected=sheet||book.sheets[0].name;
   return {input:R.readSheet(book,selected,file.name,options,C),workbook:{sheets:book.sheets.map(({name})=>({name})),excel1904:book.excel1904},sheet:selected};
  }
  cachedWorkbook=null;let text;try{text=new TextDecoder(options.encoding||'utf-8',{fatal:true}).decode(await file.arrayBuffer());}catch{throw {code:'decode_error'};}
  const delimiter=options.delimiter||(/\.tsv$/i.test(file.name)?'\t':'');
  const parsed=C.parseCSV(text,delimiter,options);
  return {input:C.fromRecords(parsed.records,{...options,name:file.name,delimiter:parsed.delimiter,source:{encoding:options.encoding||'utf-8'}}),workbook:null,sheet:''};
 }
 if(action==='run'){const result=C.runPipeline(payload.data,payload.steps);result.formulaLikeFields=C.formulaCount(result.data);return result;}
 if(action==='export'){if(['xlsx','bundle'].includes(payload.action)&&!self.JSZip)importScripts('vendor/jszip.min.js');const value=await runtime().createExport(payload,C);if(value.blob.size>C.LIMITS.exportBytes)throw {code:'export_limit'};return value;}
 if(action==='recipe'){
  if(!payload.file||payload.file.size>1024*1024)throw {code:'recipe_invalid'};
  let value;try{value=JSON.parse(await payload.file.text());}catch{throw {code:'recipe_invalid'};}
  return C.validateRecipe(value,payload.headers,payload.mode);
 }
 throw {code:'invalid_config'};
}
self.onmessage=async event=>{
 const {id,action,payload}=event.data||{};
 try{const value=await process(action,payload||{});self.postMessage({id,value});}
 catch(error){self.postMessage({id,error:{code:error.code||'processing_failed',details:error.details||{}}});}
};
