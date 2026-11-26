import {readFile} from 'node:fs/promises';
import path from 'node:path';

const cache=new Map();
export function imageDimensions(bytes){
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  }
  if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){
    const kind=bytes.toString('ascii',12,16);
    if(kind==='VP8X')return [1+bytes.readUIntLE(24,3),1+bytes.readUIntLE(27,3)];
    if(kind==='VP8 ')return [bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff];
    if(kind==='VP8L'){
      const bits=bytes.readUInt32LE(21);
      return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];
    }
  }
  throw new Error('Unsupported local image format; add its dimension reader before use.');
}

export async function applyImageDimensions(document,source){
  await Promise.all([...document.querySelectorAll('img')].map(async image=>{
    const src=image.getAttribute('src');
    if(!src?.startsWith('/assets/'))return;
    const file=path.join(source,src.split(/[?#]/)[0]);
    if(!cache.has(file))cache.set(file,readFile(file).then(imageDimensions));
    const [width,height]=await cache.get(file);
    image.setAttribute('width',String(width));
    image.setAttribute('height',String(height));
  }));
}
