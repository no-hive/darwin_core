import {blankOccurrence} from '../../web/src/site/app/dwc-occurrence.mjs';
import type {PROTOTYPE} from '../../web/src/content/prototype.mjs';
export type Locale = 'en' | 'es';
export type Seed = typeof PROTOTYPE;
export type FindingInput = ReturnType<typeof blankOccurrence> & {groupId:string;researchId:string;isTest?:boolean};

export interface LocationState {pathname:string;search:string;hash:string}
export interface FeedArticle {id:string;slug:string;title:string;dek:string;isoDate:string;image:string;alt:string;width?:number;height?:number;tags:string[];groupIds?:string[]}
export interface Bootstrap {locale:Locale;route:string;seed:Seed;now:string;articles?:FeedArticle[]}

/** Selected local file metadata; preview URLs live only in the current document. */
export interface LocalMaterial {id:string;name:string;size:number;mime:string;previewUrl?:string;primary:boolean}
