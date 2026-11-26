/** API v1 is separate from the browser demo; never send its seed/localStorage
 * automatically. Runtime identity and ownership are assigned by the server. */
export type EntityKind='profiles'|'groups'|'research'|'findings'|'proposals'|'tasks';
export interface ProfileDTO {id:string;handle:string;name:string;job:string;power:number;scores:number[];version:number;month?:number;year?:number;created_at:string}
export interface GroupDTO {id:string;name:string;description:Record<string,string>;rules:Record<string,string>;news:Record<string,string>;member:boolean;memberCount:number}
export interface ResearchDTO {id:string;title:Record<string,string>;description:Record<string,string>}
export interface FindingDTO {id:string;author_id:string;title:string;scientific_name:string;description:string;observed_on:string;location:string;evidence:string;status:'review'|'verified';visibility:'private'|'group'|'public';created_at:string}
export interface ProposalDTO {id:string;group_id:string;title:Record<string,string>;description:Record<string,string>;status:'active'|'executed'|'defeated'|'closed';closes_at:string|null;choice:'for'|'against'|'abstain'|null;totals:Record<'for'|'against'|'abstain',number>}
export interface TaskDTO {id:string;owner_id:string;title:string;status:'next'|'doing'|'review';version:number;created_at:string}
export interface Entities {profiles:ProfileDTO;groups:GroupDTO;research:ResearchDTO;findings:FindingDTO;proposals:ProposalDTO;tasks:TaskDTO}
export interface Page<T> {items:T[];nextCursor:string|null}
export interface Session {authenticated:boolean;profile:ProfileDTO|null}
export interface FindingCreate {title:string;scientificName:string;description:string;date:string;location:string;evidence:string;groupId?:string;researchId?:string;visibility:'private'|'group'|'public'}
export interface ProfileUpdate {name:string;job:string;month:number;year:number;scores:number[];version:number}
export interface Commands {
 join:{input:{id:string};result:{id:string;member:boolean}};
 leave:{input:{id:string};result:{id:string;member:boolean}};
 'finding.create':{input:FindingCreate;result:FindingDTO};
 'finding.attach':{input:{id:string;groupId:string};result:{id:string;groupId:string}};
 vote:{input:{id:string;choice:'for'|'against'|'abstain'};result:{id:string;choice:string;weight:number}};
 'profile.update':{input:ProfileUpdate;result:ProfileDTO};
 'task.create':{input:{title:string};result:TaskDTO};
 'task.advance':{input:{id:string;version:number};result:TaskDTO};
}
