import type {EntityKind,Page} from './contracts';
export type SearchKind=EntityKind|'articles';
export interface SearchOptions {
 q:string;locale:'en'|'es';types?:SearchKind[];scope?:'all'|'mine'|'discover';
 group?:string;author?:string;mode?:'search'|'suggest';cursor?:string;limit?:number;signal?:AbortSignal;
}
export interface SearchHit {kind:SearchKind;id:string;locale:'en'|'es';title:string;summary:string;href:string;score:number}
export type SearchPage=Page<SearchHit>;
