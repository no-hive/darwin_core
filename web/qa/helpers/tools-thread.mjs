import {parentPort,workerData} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {File} from 'node:buffer';
const directory=path.join(workerData.root,'dist/assets');
const scope=vm.createContext({TextEncoder,TextDecoder,Blob,File,ArrayBuffer,Uint8Array,DataView,URL,setTimeout,clearTimeout,setImmediate,console,postMessage:value=>parentPort.postMessage(value)});
scope.self=scope;
scope.importScripts=name=>vm.runInContext(readFileSync(path.join(directory,name),'utf8'),scope,{filename:name});
vm.runInContext(readFileSync(path.join(directory,'processing-worker.js'),'utf8'),scope);
parentPort.on('message',message=>{
 if(message.action==='probe'){parentPort.postMessage({id:message.id,value:{zipLoaded:Boolean(scope.JSZip),runtimeLoaded:Boolean(scope.DwcToolRuntime)}});return;}
 if(message.payload?.file?.fixtureBytes){const value=message.payload.file;message.payload.file=new File([value.fixtureBytes],value.name);}
 parentPort.postMessage({started:message.id});scope.onmessage({data:message});
});
