import {ActionIcon,Anchor,Avatar,Badge,Box,Button,Group,Paper,Stack,Text,Title} from '@mantine/core';
import type {ReactNode} from 'react';
import type {Locale} from './types';
export const ui=(locale:Locale,en:string,es:string)=>locale==='es'?es:en;
// The HTML adapter trims class attributes; emit the same value during hydration.
export function Source({children,className=''}:{children:ReactNode;className?:string}){return <span className={('authored '+className).trim()} data-object-content="" translate="no">{children}</span>;}
export function Icon({name,size=18}:{name:string;size?:number}){
 const paths:Record<string,ReactNode>={
  image:<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>,
  link:<><path d="m9 15 6-6M8 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 7l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/></>,
  activity:<><path d="M3 17h3l4-10 4 14 3-9h4"/></>,
  ballot:<><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M8 10 6 4l9-3 3 9M8 15h8m-5-9 2 1 2-3"/></>,
  article:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 11h10M7 15h4M7 18h10"/><path d="M14 14h3v3h-3z"/></>,
  research:<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/></>,
  search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  leaf:<><path d="M20 3C9 2 3 6 4 13c1 7 12 9 16-10Z"/><path d="M4 21c1-8 6-11 11-14"/></>,
  group:<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/></>,
  record:<><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/></>,
  arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,plus:<path d="M12 4v16M4 12h16"/>,
  close:<path d="m6 6 12 12M6 18 18 6"/>,grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  list:<><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/></>,
  pin:<><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  check:<path d="m5 12 4 4L20 5"/>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  profile:<><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></>,
  settings:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>,
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.leaf}</svg>;
}
export function Heading({title,description,action,eyebrow}:{title:ReactNode;description?:ReactNode;action?:ReactNode;eyebrow?:string}){return <Group className="app-page-heading" justify="space-between" align="flex-start" gap="lg"><Box>{eyebrow&&<Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={8}>{eyebrow}</Text>}<Title order={1}>{title}</Title>{description&&<Text c="dimmed" mt={10} maw={700}>{description}</Text>}</Box>{action}</Group>;}
export function Empty({children}:{children:ReactNode}){return <Paper className="app-empty" p="xl" radius="md"><Icon name="leaf" size={28}/><Text c="dimmed" mt="sm">{children}</Text></Paper>;}
export function Banner({kind='information',children,onDismiss}:{kind?:'information'|'action'|'status';children:ReactNode;onDismiss?:()=>void}){return <Paper className="app-banner" data-kind={kind} withBorder p="md"><Group wrap="nowrap" align="flex-start" gap="sm"><span className="app-banner-icon" aria-hidden="true"><Icon name={kind==='status'?'check':kind==='action'?'arrow':'leaf'} size={18}/></span><Box flex={1} miw={0}><Text size="sm">{children}</Text></Box>{onDismiss&&<ActionIcon variant="subtle" aria-label="Dismiss notice" onClick={onDismiss}><Icon name="close" size={16}/></ActionIcon>}</Group></Paper>;}
export function Person({name,id,href}:{name:string;id?:string;href?:string}){return <Group gap="sm" wrap="nowrap"><Avatar color="forest" radius="xl" size="sm">{name.split(/\s+/).slice(0,2).map(s=>s[0]).join('')}</Avatar><Box miw={0}>{href?<Anchor href={href} fw={500}><Source>{name}</Source></Anchor>:<Text size="sm" fw={500}><Source>{name}</Source></Text>}{id&&<Text size="xs" c="dimmed"><Source>{id}</Source></Text>}</Box></Group>;}

/** Test mode does not replace the record's scientific verification status. */
export function FindingModeBadge({isTest,locale}:{isTest?:boolean;locale:Locale}){return isTest?<Badge className="finding-test-badge" variant="outline" color="orange" tt="none">{ui(locale,'Test finding','Hallazgo de prueba')}</Badge>:null;}
