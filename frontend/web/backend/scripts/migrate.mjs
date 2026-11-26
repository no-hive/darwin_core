import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {adminDatabase,operatorFailure} from './operator.mjs';
const directory=path.resolve(import.meta.dirname,'../migrations');
const names=(await readdir(directory)).filter(name=>/^\d{3}_[a-z_]+\.sql$/.test(name)).sort();
const migrations=await Promise.all(names.map(async name=>{const query=await readFile(path.join(directory,name),'utf8');return {name,query,hash:createHash('sha256').update(query).digest('hex')};}));
if(process.argv.length>3||process.argv[2]&&process.argv[2]!=='--apply')throw Error('Usage: npm run api:migrate [-- --apply]');
if(process.argv[2]!=='--apply'){
 console.log('Migration plan only; no database connection.');for(const migration of migrations)console.log(`${migration.name} ${migration.hash}`);
}else{
 try{
  const sql=adminDatabase();
  const encoding=await sql.query("SELECT current_setting('server_encoding') AS value");
  if(encoding[0]?.value!=='UTF8')throw Error('UTF8 database required.');
  await sql.query('CREATE SCHEMA IF NOT EXISTS dwc');
  const owners=await sql.query("SELECT nspowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owns FROM pg_namespace WHERE nspname='dwc'");
  if(!owners[0]?.owns)throw Error('Use the existing schema owner for migrations.');
  await sql.query('ALTER DEFAULT PRIVILEGES IN SCHEMA dwc REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC');
  await sql.query('CREATE TABLE IF NOT EXISTS dwc.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  for(const migration of migrations){
   const prior=await sql.query('SELECT checksum FROM dwc.schema_migrations WHERE name=$1',[migration.name]);
   if(prior.length){if(prior[0].checksum!==migration.hash)throw Error('Applied migration checksum changed.');continue;}
   // Each file is exactly one SQL statement (CREATE FUNCTION or DO block).
   // DDL and its receipt commit together; failed/concurrent attempts roll back.
   await sql.transaction([sql.query(migration.query),sql.query('INSERT INTO dwc.schema_migrations(name,checksum) VALUES($1,$2)',[migration.name,migration.hash])]);
   console.log(`Applied ${migration.name}`);
  }
 }catch{operatorFailure();}
}
