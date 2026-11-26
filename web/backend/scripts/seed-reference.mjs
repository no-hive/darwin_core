import {PROTOTYPE} from '../../src/content/prototype.mjs';
import {adminDatabase,operatorFailure} from './operator.mjs';
if(process.argv[2]!=='--apply')console.log('Plan only: 2 groups, 2 research references, 4 synthetic proposals. No profiles, memberships, votes or findings.');
else try{
 const sql=adminDatabase(),queries=[];
 for(const group of PROTOTYPE.groups){queries.push(sql.query('INSERT INTO dwc.groups(id,name,description,rules,news) VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb) ON CONFLICT(id) DO NOTHING',[group.id,group.name,JSON.stringify(group.description),JSON.stringify(group.rules),JSON.stringify(group.news)]));queries.push(sql.query('INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES($1,$2,$3)',['groups',group.id,'search.reindex']));}
 for(const research of PROTOTYPE.research){
  queries.push(sql.query('INSERT INTO dwc.research(id,title,description) VALUES($1,$2::jsonb,$3::jsonb) ON CONFLICT(id) DO NOTHING',[research.id,JSON.stringify(research.title),JSON.stringify(research.description)]));
  for(const group of research.groupIds)queries.push(sql.query('INSERT INTO dwc.research_groups(research_id,group_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[research.id,group]));
  queries.push(sql.query('INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES($1,$2,$3)',['research',research.id,'search.reindex']));
 }
 for(const proposal of PROTOTYPE.proposals){queries.push(sql.query('INSERT INTO dwc.proposals(id,group_id,title,description,status) VALUES($1,$2,$3::jsonb,$4::jsonb,$5) ON CONFLICT(id) DO NOTHING',[proposal.id,proposal.groupId,JSON.stringify(proposal.title),JSON.stringify(proposal.description),proposal.status]));queries.push(sql.query('INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES($1,$2,$3)',['proposals',proposal.id,'search.reindex']));}
 await sql.transaction(queries);console.log('Inserted missing reference content only; existing entities were preserved.');
}catch{operatorFailure();}
