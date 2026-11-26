import {adminDatabase,operatorFailure} from './operator.mjs';
const role=process.env.DWC_RUNTIME_DB_ROLE;
if(!role||!/^[a-z][a-z0-9_]{1,62}$/.test(role))throw Error('Set DWC_RUNTIME_DB_ROLE to a dedicated existing role.');
if(process.argv[2]!=='--apply')console.log('Plan only: grant schema usage and the four API functions to the dedicated runtime role. No database connection.');
else try{
 const sql=adminDatabase();
 const rows=await sql.query(`SELECT r.rolsuper OR r.rolcreaterole OR r.rolbypassrls OR pg_has_role(r.oid,n.nspowner,'MEMBER') AS unsafe FROM pg_roles r CROSS JOIN pg_namespace n WHERE r.rolname=$1 AND n.nspname='dwc'`,[role]);
 if(rows.length!==1||rows[0].unsafe)throw Error('Runtime role must not own or inherit ownership of the schema.');
 const target=`"${role}"`;
 await sql.transaction([
  sql.query(`REVOKE ALL ON SCHEMA dwc FROM ${target}`),
  sql.query(`REVOKE ALL ON ALL TABLES IN SCHEMA dwc FROM ${target}`),
  sql.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA dwc FROM ${target}`),
  sql.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA dwc FROM ${target}`),
  sql.query(`GRANT USAGE ON SCHEMA dwc TO ${target}`),
  sql.query(`GRANT EXECUTE ON FUNCTION dwc.identity(text,text),dwc.command(text,text,text,jsonb),dwc.page(text,text,text,integer,text),dwc.search(text,text,text,text[],text,text,text,text,integer,text,text,integer) TO ${target}`),
  sql.query(`ALTER ROLE ${target} SET statement_timeout='8s'`),
  sql.query(`ALTER ROLE ${target} SET lock_timeout='2s'`)
 ]);
 console.log('Granted API function access. No user data was changed.');
}catch{operatorFailure();}
