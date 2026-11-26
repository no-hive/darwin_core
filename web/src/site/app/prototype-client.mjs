import {createPrototype,STORAGE_KEY} from './prototype-core.mjs';
const seed=JSON.parse(document.getElementById('app-prototype-data').textContent);
let saved=null;try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY));}catch{}
export const app=createPrototype(seed,saved,state=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state)));
