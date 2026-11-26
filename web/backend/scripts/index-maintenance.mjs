import {adminDatabase,operatorFailure} from './operator.mjs';
const [operation,argument,confirmation,...extra]=process.argv.slice(2);
if(!['status','rebuild','retry'].includes(operation)||extra.length||operation==='status'&&(argument&&argument!=='--apply'||confirmation!==undefined)||operation!=='status'&&confirmation&&confirmation!=='--apply')throw Error('Usage: api:index:maintenance status --apply | rebuild KIND --apply | retry ID,ID --apply');
const kinds=['profiles','groups','research','findings','proposals','tasks','articles'];
if(operation==='rebuild'&&!kinds.includes(argument))throw Error('Choose one supported entity kind.');
const ids=operation==='retry'?argument?.split(','):null;
if(operation==='retry'&&(!ids?.length||ids.length>100||ids.some(id=>!/^\d{1,19}$/.test(id)||BigInt(id)>9223372036854775807n)))throw Error('Choose up to 100 numeric job IDs.');
const apply=operation==='status'?argument==='--apply':confirmation==='--apply';
if(!apply)console.log('Plan only. Add --apply for the selected database operation; no connection was made.');
else try{const sql=adminDatabase();const rows=await sql.query('SELECT dwc.index_maintenance($1,$2,$3::bigint[]) AS data',[operation,operation==='rebuild'?argument:null,ids]);console.log(JSON.stringify(rows[0].data));}catch{operatorFailure();}
