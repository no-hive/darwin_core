import sax from 'sax';
import {inspectZip} from './zip-reader';
const fail=code=>{throw {code};};
const MAIN=new Set(['http://schemas.openxmlformats.org/spreadsheetml/2006/main','http://purl.oclc.org/ooxml/spreadsheetml/main']);
const REL='http://schemas.openxmlformats.org/package/2006/relationships';
const attribute=(tag,name)=>Object.values(tag.attributes).find(a=>a.name===name)?.value;
const relationId=tag=>Object.values(tag.attributes).find(a=>a.local==='id'&&/\/relationships$/.test(a.uri))?.value;
function readXML(zip,path,handlers){
 const parser=sax.parser(true,{xmlns:true,strictEntities:true,position:false}),stack=[];let count=0,root=false;
 parser.onerror=()=>fail('xlsx_invalid');parser.ondoctype=()=>fail('xlsx_invalid');parser.onsgmldeclaration=()=>fail('xlsx_invalid');
 parser.onopentag=tag=>{if(++count>4001000||stack.length>=64||Object.keys(tag.attributes).length>64)fail('xlsx_limit');if(!root){root=true;handlers.root?.(tag);}handlers.open?.(tag,stack);stack.push(tag);};
 parser.onclosetag=()=>{const tag=stack.pop();handlers.close?.(tag,stack);};
 parser.ontext=text=>handlers.text?.(text,stack);parser.oncdata=parser.ontext;
 let decoder,first=true;
 zip.read(path,chunk=>{
  if(first){first=false;const encoding=chunk[0]===0xff&&chunk[1]===0xfe||chunk[0]===0x3c&&chunk[1]===0?'utf-16le':chunk[0]===0xfe&&chunk[1]===0xff||chunk[0]===0&&chunk[1]===0x3c?'utf-16be':'utf-8';decoder=new TextDecoder(encoding,{fatal:true});}
  try{parser.write(decoder.decode(chunk,{stream:true}));}catch(error){if(error.code)throw error;fail('xlsx_invalid');}
 });
 if(!root||!decoder)fail('xlsx_invalid');
 try{parser.write(decoder.decode()).close();}catch(error){if(error.code)throw error;fail('xlsx_invalid');}
}
function partPath(target){
 if(typeof target!=='string'||!target||target.includes('\\')||target.includes('?')||target.includes('#'))fail('xlsx_invalid');
 let url;try{url=new URL(target,'https://xlsx.local/xl/workbook.xml');}catch{fail('xlsx_invalid');}
 if(url.origin!=='https://xlsx.local')fail('xlsx_invalid');
 let path;try{path=decodeURIComponent(url.pathname).slice(1);}catch{fail('xlsx_invalid');}
 if(!path.startsWith('xl/')||path.split('/').some(p=>p==='..'||p==='.')||path.includes('\0')||path.includes('\\'))fail('xlsx_invalid');return path;
}
export function openWorkbook(buffer,C){
 const zip=inspectZip(buffer,C.LIMITS.bytes),relations=new Map(),sheetRefs=[];let excel1904=false;
 readXML(zip,'xl/_rels/workbook.xml.rels',{
  root:tag=>{if(tag.local!=='Relationships'||tag.uri!==REL)fail('xlsx_invalid');},
  open:(tag,stack)=>{if(tag.local!=='Relationship'||tag.uri!==REL||stack.length!==1)return;const id=attribute(tag,'Id');if(!id||relations.has(id))fail('xlsx_invalid');if(attribute(tag,'TargetMode')==='External')return;relations.set(id,{target:partPath(attribute(tag,'Target')),type:attribute(tag,'Type')});}
 });
 readXML(zip,'xl/workbook.xml',{
  root:tag=>{if(tag.local!=='workbook'||!MAIN.has(tag.uri))fail('xlsx_invalid');},
  open:(tag,stack)=>{if(!MAIN.has(tag.uri))return;if(tag.local==='workbookPr'&&stack.length===1)excel1904=['1','true'].includes(attribute(tag,'date1904'));if(tag.local==='sheet'&&stack.at(-1)?.local==='sheets')sheetRefs.push({name:attribute(tag,'name'),id:relationId(tag)});}
 });
 const sheets=sheetRefs.flatMap(sheet=>{const relation=relations.get(sheet.id);if(!relation)fail('xlsx_invalid');if(!relation.type?.endsWith('/worksheet'))return [];if(!sheet.name||sheet.name.length>255||!zip.entries.has(relation.target))fail('xlsx_invalid');return [{name:sheet.name,path:relation.target}];});
 if(!sheets.length||new Set(sheets.map(s=>s.name)).size!==sheets.length)fail('xlsx_invalid');
 const strings=[];let shared=null;
 if(zip.entries.has('xl/sharedStrings.xml'))readXML(zip,'xl/sharedStrings.xml',{
  root:tag=>{if(tag.local!=='sst'||!MAIN.has(tag.uri))fail('xlsx_invalid');},
  open:tag=>{if(tag.local==='si'&&MAIN.has(tag.uri)){if(shared!==null)fail('xlsx_invalid');shared='';}},
  text:(text,stack)=>{if(shared!==null&&stack.at(-1)?.local==='t'&&MAIN.has(stack.at(-1).uri)){shared+=text;if(shared.length>C.LIMITS.bytes)fail('xlsx_limit');}},
  close:tag=>{if(tag.local==='si'&&MAIN.has(tag.uri)){strings.push(shared);shared=null;if(strings.length>C.LIMITS.cells+2000)fail('xlsx_limit');}}
 });
 return {zip,sheets,strings,excel1904};
}
export function readSheet(book,name,fileName,options,C){
 const sheet=book.sheets.find(s=>s.name===name);if(!sheet)fail('xlsx_invalid');
 const rows=[],seen=new Set();let width=0,formulaCount=0,merged=false,cell=null,textBytes=0;
 readXML(book.zip,sheet.path,{
  root:tag=>{if(tag.local!=='worksheet'||!MAIN.has(tag.uri))fail('xlsx_invalid');},
  open:(tag,stack)=>{
   if(!MAIN.has(tag.uri))return;
   if(tag.local==='mergeCell')merged=true;
   if(tag.local==='c'&&stack.at(-1)?.local==='row'&&stack.at(-2)?.local==='sheetData'){if(cell)fail('xlsx_invalid');cell={ref:attribute(tag,'r')||'',type:attribute(tag,'t'),value:'',inline:'',hasValue:false,hasInline:false,formula:false};}
   if(cell&&tag.local==='v')cell.hasValue=true;if(cell&&tag.local==='is')cell.hasInline=true;if(cell&&tag.local==='f')cell.formula=true;
  },
  text:(text,stack)=>{if(!cell||!MAIN.has(stack.at(-1)?.uri))return;if(stack.at(-1).local==='v')cell.value+=text;else if(stack.at(-1).local==='t'&&stack.some(t=>t.local==='is'))cell.inline+=text;if(cell.value.length>C.LIMITS.bytes||cell.inline.length>C.LIMITS.bytes)fail('xlsx_limit');},
  close:(tag,stack)=>{
   if(tag.local!=='c'||!MAIN.has(tag.uri)||!cell||stack.at(-1)?.local!=='row'||stack.at(-2)?.local!=='sheetData')return;
   const current=cell;cell=null;if(!current.hasValue&&!current.hasInline&&!current.formula)return;
   const ref=/^([A-Z]+)(\d+)$/.exec(current.ref);if(!ref)fail('xlsx_invalid');
   let column=0;for(const letter of ref[1]){column=column*26+letter.charCodeAt(0)-64;if(column>C.LIMITS.columns)fail('xlsx_limit');}column--;
   const row=Number(ref[2])-1;if(!Number.isSafeInteger(row)||row<0||row>C.LIMITS.rows+19)fail('xlsx_limit');
   const key=row*C.LIMITS.columns+column;if(seen.has(key))fail('xlsx_invalid');seen.add(key);if(seen.size>C.LIMITS.cells)fail('xlsx_limit');
   if(current.formula)formulaCount++;
   let value=current.value;
   if(current.type==='s'){if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)>=book.strings.length)fail('xlsx_invalid');value=book.strings[Number(value)];}
   else if(current.type==='inlineStr')value=current.inline;
   else if(current.type==='b')value=value==='1'?'TRUE':'FALSE';else if(current.type==='e')value=value||'#ERROR';
   textBytes+=C.utf8Bytes(value);if(textBytes>C.LIMITS.textBytes)fail('xlsx_limit');
   if(!rows[row])rows[row]=[];rows[row][column]=value;width=Math.max(width,column+1);
   if(rows.length*width>C.LIMITS.cells)fail('xlsx_limit');
  }
 });
 if(!rows.length)fail('empty_input');
 const records=Array.from({length:rows.length},(_,i)=>Array.from({length:width},(_,j)=>rows[i]?.[j]??''));
 return C.fromRecords(records,{headerRow:options.headerRow,name:fileName+' · '+name,source:{sheet:name,excel1904:book.excel1904,formulaCount,merged}});
}
