const fail=code=>{throw {code};};
const escapeXML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const columnLetter=index=>{let name='';for(let n=index+1;n;n=Math.floor((n-1)/26))name=String.fromCharCode(65+(n-1)%26)+name;return name;};
function budget(C){let used=0;const encoder=new TextEncoder();return value=>{used+=encoder.encode(value).byteLength;if(used>C.LIMITS.exportBytes)fail('export_limit');return value;};}
function csv(data,safe,C,charge){
 const quote=value=>'"'+String(value).replace(/"/g,'""')+'"';
 const cell=value=>quote(safe&&C.formulaRisk(value)?"'"+value:value);
 const parts=[charge('\uFEFF'+data.columns.map(c=>cell(c.name)).join(','))];
 for(const row of data.rows)parts.push(charge('\r\n'+row.cells.map(cell).join(',')));
 return new Blob(parts,{type:'text/csv;charset=utf-8'});
}
function* json(value,depth=0){
 if(depth>32)fail('export_limit');
 if(value===null||typeof value!=='object'){yield JSON.stringify(value)??'null';return;}
 const array=Array.isArray(value),keys=array?value.map((_,i)=>i):Object.keys(value).filter(key=>value[key]!==undefined),indent='  '.repeat(depth),child=indent+'  ';
 yield array?'[':'{';
 for(let i=0;i<keys.length;i++){const key=keys[i];yield (i?',\n':'\n')+child;if(!array)yield JSON.stringify(key)+': ';yield* json(value[key],depth+1);}
 if(keys.length)yield '\n'+indent;yield array?']':'}';
}
function jsonBlob(value,charge){const parts=[];let pending='';for(const piece of json(value)){pending+=charge(piece);if(pending.length>=65536){parts.push(pending);pending='';}}if(pending)parts.push(pending);return new Blob(parts,{type:'application/json'});}
function report(input,result,safe,C){return {engine:C.VERSION,createdAt:new Date().toISOString(),source:input.source,summary:result.summary,steps:result.steps.map(({id,type,summary})=>({id,type,summary})),issues:result.issues,changes:result.changes,importWarnings:input.warnings,export:{spreadsheetSafeCSV:safe,formulaLikeFields:result.formulaLikeFields??formulaCount(result.data,C)}};}
export function formulaCount(data,C){let count=data.columns.filter(c=>C.formulaRisk(c.name)).length;for(const row of data.rows)for(const value of row.cells)if(C.formulaRisk(value))count++;return count;}
function issueTable(result){const fields=['step','rowId','column','code','group','before'];return {columns:fields.map((name,i)=>({id:'i'+i,name})),rows:result.issues.map((issue,index)=>({id:index+1,cells:fields.map(field=>String(issue[field]??''))}))};}
async function xlsx(data,C,charge){
 const zip=new self.JSZip();
 zip.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>');
 zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
 const parts=[charge('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>')];
 function row(cells,index){
  if(cells.some(value=>/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)))fail('processing_failed');
  return charge(`<row r="${index}">`+cells.map((value,j)=>`<c r="${columnLetter(j)}${index}" t="inlineStr"><is><t xml:space="preserve">${escapeXML(value)}</t></is></c>`).join('')+'</row>');
 }
 parts.push(row(data.columns.map(c=>c.name),1));for(let i=0;i<data.rows.length;i++)parts.push(row(data.rows[i].cells,i+2));
 parts.push(charge('</sheetData></worksheet>'));
 // Text bytes rather than Blob/FileReader keep the Worker independent of DOM APIs.
 zip.file('xl/worksheets/sheet1.xml',await new Blob(parts).arrayBuffer());
 return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE',streamFiles:true});
}
export async function createExport(payload,C){
 const {action,input,result,recipe,safe,readme}=payload,charge=budget(C);
 if(action==='recipe')return {name:'darwin-core-recipe.json',blob:jsonBlob(recipe,charge)};
 C.validateData(input);
 if(action==='original')return {name:safe?'original-imported-spreadsheet-safe.csv':'original-imported-table.csv',blob:csv(input,safe,C,charge)};
 if(!result)fail('invalid_data');C.validateData(result.data);
 if(action==='csv')return {name:safe?'result-spreadsheet-safe.csv':'result.csv',blob:csv(result.data,safe,C,charge)};
 if(action==='xlsx')return {name:'result.xlsx',blob:await xlsx(result.data,C,charge)};
 if(action==='report')return {name:'processing-report.json',blob:jsonBlob(report(input,result,safe,C),charge)};
 if(action==='issues')return {name:'review-items.csv',blob:csv(issueTable(result),safe,C,charge)};
 if(action==='bundle'){
  const zip=new self.JSZip();
  for(const [name,blob] of [[safe?'result-spreadsheet-safe.csv':'result.csv',csv(result.data,safe,C,charge)],['processing-report.json',jsonBlob(report(input,result,safe,C),charge)],['recipe.json',jsonBlob(recipe,charge)],['review-items.csv',csv(issueTable(result),safe,C,charge)]])zip.file(name,await blob.arrayBuffer());
  zip.file('README.txt',charge(readme||''));return {name:'darwin-core-results.zip',blob:await zip.generateAsync({type:'blob',compression:'DEFLATE',streamFiles:true})};
 }
 fail('invalid_config');
}
