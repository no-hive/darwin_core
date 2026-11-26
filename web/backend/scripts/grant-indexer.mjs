import {adminDatabase,operatorFailure} from './operator.mjs';
const role=process.env.DWC_INDEX_DB_ROLE,apiRole=process.env.DWC_RUNTIME_DB_ROLE;
if(!role||!apiRole||role===apiRole||!/^[a-z][a-z0-9_]{1,62}$/.test(role))throw Error('Set a dedicated DWC_INDEX_DB_ROLE, different from DWC_RUNTIME_DB_ROLE.');
if(process.argv.length>3||process.argv[2]&&process.argv[2]!=='--apply')throw Error('Usage: node backend/scripts/grant-indexer.mjs [--apply]');
if(process.argv[2]!=='--apply')console.log('Plan only: worker-only index_batch/index_prune permissions, no table or search access.');
else try{
 const sql=adminDatabase();
 const rows=await sql.query("SELECT r.rolsuper OR r.rolcreaterole OR r.rolbypassrls OR pg_has_role(r.oid,n.nspowner,'MEMBER') AS unsafe FROM pg_roles r CROSS JOIN pg_namespace n WHERE r.rolname=$1 AND n.nspname='dwc'",[role]);
 if(rows.length!==1||rows[0].unsafe)throw Error();
 const links=await sql.query("SELECT pg_has_role($1,$2,'MEMBER') OR pg_has_role($2,$1,'MEMBER') AS linked",[role,apiRole]);
 if(links[0]?.linked)throw Error();
 const target=`"${role}"`;
 await sql.transaction([
  sql.query(`REVOKE ALL ON SCHEMA dwc FROM ${target}`),sql.query(`REVOKE ALL ON ALL TABLES IN SCHEMA dwc FROM ${target}`),
  sql.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA dwc FROM ${target}`),sql.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA dwc FROM ${target}`),
  sql.query(`GRANT USAGE ON SCHEMA dwc TO ${target}`),sql.query(`GRANT EXECUTE ON FUNCTION dwc.index_batch(integer),dwc.index_prune() TO ${target}`),
  sql.query(`ALTER ROLE ${target} SET statement_timeout='8s'`),sql.query(`ALTER ROLE ${target} SET lock_timeout='2s'`)
 ]);
 console.log('Granted bounded index processing permissions.');
}catch{operatorFailure();}
