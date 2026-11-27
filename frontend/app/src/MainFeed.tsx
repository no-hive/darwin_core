import {useEffect,useState} from 'react';
import {Anchor,Badge,Box,Checkbox,Chip,Divider,Group,Paper,Stack,Text,ThemeIcon} from '@mantine/core';
import {DEFAULT_GROUP_ID,text} from '../../web/src/site/app/prototype-core.mjs';
import {feedEvents} from './feed';
import {JournalEntry} from './JournalEntry';
import {Empty,Heading,Icon,Source,ui} from './ui';
import type {AppRepository} from './repository';
import type {FeedArticle,Locale} from './types';
const PREFERENCES='dwc-main-feed-preferences-v1';
interface Preferences {hiddenGroups:string[];sort:'latest'|'oldest'|'popular'|'less-popular';period:'all'|'7'|'30'|'90'}
const defaults:Preferences={hiddenGroups:[],sort:'latest',period:'all'};
export function MainFeed({repository,locale,articles,now}:{repository:AppRepository;locale:Locale;articles:FeedArticle[];now:string}){
 const app=repository.model,candidateGroups=new Set(app.records().filter((r:any)=>r.authorId===app.seed.currentId&&app.journal.verification(r).candidate&&app.journal.verification(r).status==='pending_verification').flatMap((r:any)=>r.groupIds)),groups=app.groups().filter((g:any)=>app.member(g.id)||candidateGroups.has(g.id));
 const [preferences,setPreferences]=useState<Preferences>(defaults),[restored,setRestored]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(PREFERENCES)||'null');if(saved)setPreferences({hiddenGroups:[...new Set([...(Array.isArray(saved.hiddenGroups)?saved.hiddenGroups.filter((v:any)=>typeof v==='string'):[]),...(saved.blog===false?[DEFAULT_GROUP_ID]:[])])] as string[],sort:['latest','oldest','popular','less-popular'].includes(saved.sort)?saved.sort:'latest',period:['7','30','90'].includes(saved.period)?saved.period:'all'});}catch{}setRestored(true);},[]);
 useEffect(()=>{if(restored)try{localStorage.setItem(PREFERENCES,JSON.stringify(preferences));}catch{}},[preferences,restored]);
 const change=(values:Partial<Preferences>)=>setPreferences(previous=>({...previous,...values}));
 const selected=groups.filter((g:any)=>!preferences.hiddenGroups.includes(g.id)).map((g:any)=>g.id);
 const nowTime=Date.parse(now),cutoff=preferences.period==='all'?-Infinity:nowTime-Number(preferences.period)*86400000;
 const events=feedEvents(app,articles).filter(event=>{
  const inSource=event.groupIds.some(id=>selected.includes(id));
  if(!inSource)return false;
  if(preferences.period==='all')return true;
  const date=Date.parse(event.date);return Number.isFinite(date)&&date>=cutoff&&date<=nowTime;
 }).sort((a,b)=>{
  const popularity=preferences.sort==='popular'?b.score-a.score:preferences.sort==='less-popular'?a.score-b.score:0;
  if(popularity)return popularity;
  const dateA=Date.parse(a.date),dateB=Date.parse(b.date),knownA=Number.isFinite(dateA),knownB=Number.isFinite(dateB);
  // Undated events stay after dated events in either chronological direction.
  if(knownA!==knownB)return knownA?-1:1;
  return (knownA&&knownB?(preferences.sort==='oldest'?dateA-dateB:dateB-dateA):0)||a.id.localeCompare(b.id);
 });

 return <div className="main-timeline"><Heading title={ui(locale,'Scroll to find where the world needs you','Desplázate para encontrar dónde te necesita el mundo')}/><div className="main-feed-layout">
  <section className="main-timeline-column" aria-label={ui(locale,'Community feed','Actividad de la comunidad')}>
   <Group mb="md" justify="space-between"><Text fw={600}>{ui(locale,'From your community','De tu comunidad')}</Text><Badge variant="light" color="gray">{events.length}</Badge></Group>
   <Stack gap="md" className="main-event-list" aria-live="polite">{events.length?events.map(event=><JournalEntry key={event.id} event={event} repository={repository} locale={locale} minimal/>):<Empty>{ui(locale,'No events for these sources and dates.','No hay eventos para estas fuentes y fechas.')}</Empty>}</Stack>
  </section>
  <aside className="main-feed-sidebar" aria-label={ui(locale,'Groups and feed filters','Grupos y filtros de actividad')}>
   <Paper withBorder radius="lg" className="feed-controls-frame">
    <section className="feed-controls-section" aria-labelledby="feed-groups-heading">
     <Text component="h2" id="feed-groups-heading" fw={600} mb="lg">{ui(locale,'My groups','Mis grupos')}</Text>
     <Stack gap="lg">{groups.map((g:any)=><Group key={g.id} gap="sm" wrap="nowrap" className="feed-group-choice">
      <Checkbox checked={selected.includes(g.id)} onChange={e=>change({hiddenGroups:e.currentTarget.checked?preferences.hiddenGroups.filter(id=>id!==g.id):[...preferences.hiddenGroups,g.id]})} aria-label={`${ui(locale,'Show recommendations from','Mostrar recomendaciones de')} ${g.name}`}/>
      <Box miw={0}><Anchor href={app.link('groups',g.id,locale)} size="sm" fw={500}><Source>{g.name}</Source></Anchor><Text size="xs" c="dimmed">{g.members.length}{!app.member(g.id)?' · '+ui(locale,'Candidate','Candidato'):''} {ui(locale,'participants','participantes')}</Text></Box>
     </Group>)}</Stack>
    </section>
    <Divider/>
    <section className="feed-controls-section" aria-labelledby="feed-filters-heading">
     <Text component="h2" id="feed-filters-heading" fw={600} mb="lg">{ui(locale,'Filters','Filtros')}</Text>
     <Stack gap="xl">
      <Box component="fieldset" className="feed-filter-set"><legend>{ui(locale,'Sort by','Ordenar por')}</legend>
       <Chip.Group value={preferences.sort} onChange={value=>change({sort:value as Preferences['sort']})}><Group gap={8} className="feed-filter-chips"><Chip value="latest" variant="outline" radius="xl">{ui(locale,'Latest','Más recientes')}</Chip><Chip value="oldest" variant="outline" radius="xl">{ui(locale,'Oldest','Más antiguos')}</Chip><Chip value="popular" variant="outline" radius="xl">{ui(locale,'Most popular','Más populares')}</Chip><Chip value="less-popular" variant="outline" radius="xl">{ui(locale,'Less popular','Menos populares')}</Chip></Group></Chip.Group>
      </Box>
      <Box component="fieldset" className="feed-filter-set"><legend>{ui(locale,'Period','Periodo')}</legend>
       <Chip.Group value={preferences.period} onChange={value=>change({period:value as Preferences['period']})}><Group gap={8} className="feed-filter-chips"><Chip value="all" variant="outline" radius="xl">{ui(locale,'All time','Todo el tiempo')}</Chip>{['7','30','90'].map(days=><Chip key={days} value={days} variant="outline" radius="xl">{ui(locale,`${days} days`,`${days} días`)}</Chip>)}</Group></Chip.Group>
      </Box>
     </Stack>
    </section>
   </Paper>
  </aside>
 </div></div>;
}
