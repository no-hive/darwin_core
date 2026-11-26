import {Inflate} from 'pako';
const MAX_ENTRIES=2000,MAX_EXPANDED=50*1024*1024;
const fail=code=>{throw {code};};
const crcTable=Uint32Array.from({length:256},(_,value)=>{for(let i=0;i<8;i++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
function crcUpdate(crc,bytes){for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return crc;}
function extras(bytes,start,size){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let at=start;
 while(at<start+size){if(at+4>start+size)fail('xlsx_invalid');const id=view.getUint16(at,true),length=view.getUint16(at+2,true);if(id===1)fail('xlsx_invalid');at+=4+length;if(at>start+size)fail('xlsx_invalid');}
}
/** Inspect ZIP metadata and local ranges before invoking any inflater. No entry
 * is extracted to a filesystem and declared sizes are never used as allocations. */
export function inspectZip(buffer,maxBytes){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 if(bytes.length>maxBytes)fail('too_large');if(bytes.length<22)fail('xlsx_invalid');
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0||view.getUint16(end+4,true)||view.getUint16(end+6,true))fail('xlsx_invalid');
 const count=view.getUint16(end+10,true),directorySize=view.getUint32(end+12,true),directory=view.getUint32(end+16,true);
 if(count===65535||directorySize===0xffffffff||directory===0xffffffff||view.getUint16(end+8,true)!==count)fail('xlsx_invalid');
 if(count>MAX_ENTRIES)fail('xlsx_limit');if(!count||directory+directorySize!==end)fail('xlsx_invalid');
 const entries=new Map(),ranges=[];let at=directory,total=0;
 const decoder=new TextDecoder('utf-8',{fatal:true});
 for(let i=0;i<count;i++){
  if(at+46>end||view.getUint32(at,true)!==0x02014b50)fail('xlsx_invalid');
  const version=view.getUint16(at+6,true),flags=view.getUint16(at+8,true),method=view.getUint16(at+10,true),crc=view.getUint32(at+16,true),compressed=view.getUint32(at+20,true),expanded=view.getUint32(at+24,true),nameSize=view.getUint16(at+28,true),extraSize=view.getUint16(at+30,true),commentSize=view.getUint16(at+32,true),disk=view.getUint16(at+34,true),offset=view.getUint32(at+42,true);
  const next=at+46+nameSize+extraSize+commentSize;
  if(next>end||version>=45||disk||flags&~0x080e||![0,8].includes(method)||offset===0xffffffff||compressed===0xffffffff||expanded===0xffffffff)fail('xlsx_invalid');
  let name;try{name=decoder.decode(bytes.subarray(at+46,at+46+nameSize));}catch{fail('xlsx_invalid');}
  if(!name||name.startsWith('/')||name.includes('\\')||name.includes('\0')||name.split('/').some(part=>part==='.'||part==='..')||entries.has(name)||/vbaProject\.bin$/i.test(name))fail('xlsx_invalid');
  total+=expanded;if(total>MAX_EXPANDED)fail('xlsx_limit');
  extras(bytes,at+46+nameSize,extraSize);
  if(offset+30>directory||view.getUint32(offset,true)!==0x04034b50||view.getUint16(offset+6,true)!==flags||view.getUint16(offset+8,true)!==method)fail('xlsx_invalid');
  const localNameSize=view.getUint16(offset+26,true),localExtraSize=view.getUint16(offset+28,true),start=offset+30+localNameSize+localExtraSize,finish=start+compressed;
  if(finish>directory||localNameSize!==nameSize)fail('xlsx_invalid');
  for(let j=0;j<nameSize;j++)if(bytes[offset+30+j]!==bytes[at+46+j])fail('xlsx_invalid');
  extras(bytes,offset+30+localNameSize,localExtraSize);
  if(!(flags&8)&&(view.getUint32(offset+14,true)!==crc||view.getUint32(offset+18,true)!==compressed||view.getUint32(offset+22,true)!==expanded))fail('xlsx_invalid');
  if(method===0&&compressed!==expanded)fail('xlsx_invalid');
  ranges.push([offset,finish]);entries.set(name,{name,method,crc,compressed,expanded,start});at=next;
 }
 if(at!==end)fail('xlsx_invalid');
 ranges.sort((a,b)=>a[0]-b[0]);for(let i=1;i<ranges.length;i++)if(ranges[i][0]<ranges[i-1][1])fail('xlsx_invalid');
 return {entries,
  read(name,onChunk){
   const entry=entries.get(name);if(!entry)fail('xlsx_invalid');let actual=0,crc=0xffffffff;
   const consume=chunk=>{actual+=chunk.length;if(actual>entry.expanded||actual>MAX_EXPANDED)fail('xlsx_limit');crc=crcUpdate(crc,chunk);onChunk(chunk);};
   const input=bytes.subarray(entry.start,entry.start+entry.compressed);
   if(entry.method===0){for(let offset=0;offset<input.length;offset+=65536)consume(input.subarray(offset,offset+65536));}
   else{
    const inflate=new Inflate({raw:true,chunkSize:65536});inflate.onData=consume;
    for(let offset=0;offset<input.length;offset+=65536){if(inflate.ended)fail('xlsx_invalid');if(!inflate.push(input.subarray(offset,offset+65536),offset+65536>=input.length))fail('xlsx_invalid');}
    if(!inflate.ended||inflate.err||inflate.strm.total_in!==entry.compressed)fail('xlsx_invalid');
   }
   if(actual!==entry.expanded||((crc^0xffffffff)>>>0)!==entry.crc)fail('xlsx_invalid');
  }
 };
}
