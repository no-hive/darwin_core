import type {Locale} from './types';
export const axes=(es:boolean)=>es?['Aves','Océano profundo','Especies desconocidas','Mercados de alimentos','Insectos','Plantas']:['Birds','Deep ocean','Unknown species','Food markets','Insects','Plants'];
export function Radar({scores,locale,label}:{scores:number[];locale:Locale;label:string}){
  const names=axes(locale==='es'),point=(i:number,value:number)=>{const a=-Math.PI/2+i*Math.PI*2/names.length;return [170+Math.cos(a)*94*value/10,150+Math.sin(a)*94*value/10];};
  return <svg viewBox="0 0 340 300" role="img" aria-label={label}>
    {[3.33,6.66,10].map(level=><polygon key={level} points={names.map((_,i)=>point(i,level).join(',')).join(' ')} className="radar-ring"/>)}
    {names.map((name,i)=>{const end=point(i,10),label=point(i,12.2);return <g key={name}><line x1={170} y1={150} x2={end[0]} y2={end[1]} className="radar-axis"/><text x={label[0]} y={label[1]+4} textAnchor={label[0]<162?'end':label[0]>178?'start':'middle'}>{name}</text></g>;})}
    <polygon points={scores.map((value,i)=>point(i,value).join(',')).join(' ')} className="radar-shape"/>
    {scores.map((value,i)=>{const p=point(i,value);return <circle key={i} cx={p[0]} cy={p[1]} r={3}/>;})}
  </svg>;
}
export function Verdict({scores,locale}:{scores:number[];locale:Locale}){
  const es=locale==='es',top=axes(es).map((name,i)=>({name,value:scores[i]})).sort((a,b)=>b.value-a.value);
  let title=es?'Observador de campo curioso':'Curious field observer',copy=es?'El enfoque toma forma mientras se llena el cuaderno.':'Still finding the focus. The notebook is filling up.';
  if(top[0].value>=8&&top[1].value<6){title=es?`Especialista en ${top[0].name.toLowerCase()}`:`Pure ${top[0].name.toLowerCase()} scientist`;copy=es?'El protocolo tiene un rumbo claro.':'The protocol has a clear direction.';}
  else if(top[0].value>=7&&top[1].value>=7){title=`${es?'Explorador híbrido':'Hybrid explorer'}: ${top[0].name} × ${top[1].name}`;copy=es?'Explora más de un hábitat.':'Refuses to pick a single habitat.';}
  return <><strong>{title}</strong><span>{copy}</span></>;
}
