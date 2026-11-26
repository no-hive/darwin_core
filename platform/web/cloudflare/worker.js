const METRICS = ['page_view','article_read','tool_run','result_export'];
const PUBLIC_KEYS = {page_view:'visits',article_read:'articles',tool_run:'tools',result_export:'exports'};
const json = (value,status=200,headers={}) => new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
const utcDay = date => date.toISOString().slice(0,10);

async function record(request,env){
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(origin&&origin!==url.origin)return json({error:'forbidden_origin'},403);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'unsupported_media_type'},415);
  let body;try{body=await request.json();}catch{return json({error:'invalid_json'},400);}
  if(!body||!METRICS.includes(body.metric))return json({error:'invalid_metric'},400);
  const day=utcDay(new Date());
  await env.METRICS_DB.prepare('INSERT INTO daily_metrics (day, metric, count) VALUES (?1, ?2, 1) ON CONFLICT(day, metric) DO UPDATE SET count = count + 1').bind(day,body.metric).run();
  return new Response(null,{status:204,headers:{'cache-control':'no-store'}});
}

async function readStats(env){
  const today=new Date(),start=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-59));
  const result=await env.METRICS_DB.prepare('SELECT day, metric, count FROM daily_metrics WHERE day >= ?1 ORDER BY day ASC').bind(utcDay(start)).all();
  const days=Array.from({length:60},(_,i)=>{const d=new Date(start);d.setUTCDate(d.getUTCDate()+i);return utcDay(d);});
  const lookup=new Map((result.results||[]).map(row=>[`${row.day}:${row.metric}`,Number(row.count)]));
  const metrics={};
  for(const metric of METRICS){const all=days.map(day=>lookup.get(`${day}:${metric}`)||0),previousSeries=all.slice(0,30),series=all.slice(30);metrics[PUBLIC_KEYS[metric]]={value:series.reduce((a,b)=>a+b,0),previous:previousSeries.reduce((a,b)=>a+b,0),series};}
  return json({generatedAt:new Date().toISOString(),period:{days:30},metrics},200,{'cache-control':'public, max-age=60, stale-while-revalidate=120'});
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/events'&&request.method==='POST')return record(request,env);
  if(url.pathname==='/api/stats'&&request.method==='GET')return readStats(env);
  if(url.pathname.startsWith('/api/'))return json({error:'not_found'},404);
  return env.ASSETS.fetch(request);
}};
