import {createPrototype,STORAGE_KEY} from '../../web/src/site/app/prototype-core.mjs';
import {createJournalMock,proposalTally,type MockProposal} from './journal-mock';
import type {Seed,Locale,FindingInput,LocalMaterial} from './types';

export type Model = ReturnType<typeof createPrototype> & {journal:ReturnType<typeof createJournalMock>;proposals:()=>MockProposal[]};
export interface AppRepository {
  readonly model: Model;
  subscribe(listener:()=>void):()=>void;
  getSnapshot():number;
  getServerSnapshot():number;
  restore(storage:Storage):void;
  join(id:string):string;
  proposeRules(id:string,draft:Parameters<Model['journal']['proposeRules']>[1],reason:string):string;
  finishProposal(id:string,scenario?:string):void;
  objectFinding(id:string):string;
  confirmFinding(id:string):void;
  endOptimistic(id:string,scenario?:string):void;
  previewVerification(id:string,scenario:string):void;
  acceptDemoInvitation(id:string):void;
  addNews(group:string,title:string,body:string):void;
  leave(id:string):void;
  attach(record:string,group:string):void;
  vote(id:string,choice:string):void;
  addRecord(input:FindingInput,materials?:LocalMaterial[]):string;
  materials(id:string):LocalMaterial[];
  updateProfile(profile:Parameters<Model['updateProfile']>[0]):void;
  reset():void;
}
/** In-memory mock interactions. Legacy browser data is read once, never erased. */
export function createLocalRepository(seed:Seed,locale:Locale):AppRepository {
  let version=0;
  const localMaterials=new Map<string,LocalMaterial[]>();
  const listeners=new Set<()=>void>();
  const persist=(_state:unknown)=>{};
  let base=createPrototype(seed,null,persist);
  const compose=()=>{const journal=createJournalMock(base);return {...base,journal,proposals:journal.proposals,proposalLink:(p:any,lang='en')=>base.seed.proposals.some((old:any)=>old.id===p.id)?base.proposalLink(p,lang):`/${lang}/app/groups/${p.groupId}/?tab=voting&proposal=${encodeURIComponent(p.id)}`,groups:()=>base.groups().map((g:any)=>({...g,rules:journal.rules(g.id).statement})),records:()=>base.records().map((r:any)=>({...r,verification:journal.verification(r)})),totals:(p:any)=>p.policy?proposalTally(p):base.totals(p)};};
  let model:Model=compose();
  const notify=()=>{version++;listeners.forEach(listener=>listener());};
  const change=(operation:()=>void)=>{operation();notify();};
  return {
    get model(){return model;},
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    getSnapshot:()=>version,getServerSnapshot:()=>0,
    restore(nextStorage){
      let raw=null;
      try{raw=JSON.parse(nextStorage.getItem(STORAGE_KEY)||'null');}catch{}
      base=createPrototype(seed,raw,persist);model=compose();
      notify();
    },
    join(id){const result=model.journal.requestJoin(id);notify();return result;},
    proposeRules(id,draft,reason){const result=model.journal.proposeRules(id,draft,reason);notify();return result;},
    finishProposal:(id,scenario)=>change(()=>model.journal.finish(id,scenario)),
    objectFinding(id){const result=model.journal.object(id);notify();return result;},
    confirmFinding:id=>change(()=>model.journal.confirm(id)),
    endOptimistic:(id,scenario)=>change(()=>model.journal.endOptimistic(id,scenario)),
    previewVerification:(id,scenario)=>change(()=>model.journal.previewVerification(id,scenario)),
    acceptDemoInvitation:id=>change(()=>model.journal.invite(id)),
    addNews:(id,title,body)=>change(()=>model.journal.addNews(id,title,body)),
    leave:id=>change(()=>model.leave(id)),
    attach:(record,group)=>change(()=>model.attach(record,group)),vote:(id,choice)=>change(()=>model.journal.vote(id,choice)),
    addRecord(input,materials=[]){const access=model.journal.publishing(input.groupId),r=model.journal.rules(input.groupId);if(!access.allowed)throw Error('permission');if(!r.publishing.basis.includes(input.basisOfRecord))throw Error('dwc:basisOfRecord');if(r.publishing.requireMaterials&&!materials.length&&!input.associatedMedia&&!input.associatedReferences)throw Error('dwc:associatedMedia');if(r.publishing.requireCoordinates&&(!input.decimalLatitude||!input.decimalLongitude))throw Error('dwc:decimalLatitude,decimalLongitude');const id=base.addRecord(input,{candidate:access.candidate});localMaterials.set(id,materials.map(file=>({...file})));model.journal.startVerification(base.records().find((record:any)=>record.id===id));notify();return id;},
    materials:id=>localMaterials.get(id)||[],
    updateProfile:profile=>change(()=>model.updateProfile(profile)),reset:()=>change(()=>{for(const files of localMaterials.values())for(const file of files)if(file.previewUrl)URL.revokeObjectURL(file.previewUrl);localMaterials.clear();base.reset();model=compose();}),
  };
}
