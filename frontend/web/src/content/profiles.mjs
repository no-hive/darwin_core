import {PROTOTYPE} from './prototype.mjs';
import {createPrototype,text} from '../site/app/prototype-core.mjs';
export const CURRENT_PROFILE_ID=PROTOTYPE.currentId;
export function profileDirectory(lang){const app=createPrototype(PROTOTYPE);return{currentId:CURRENT_PROFILE_ID,profiles:app.profiles().map(p=>({...p,job:text(p.job,lang),activities:app.activities(p.key,lang)}))};}
export {profileCopy} from '../locales/profile.mjs';
