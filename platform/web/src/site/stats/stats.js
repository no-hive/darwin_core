(() => {
  const DEMO = {
    visits: { value: 4286, previous: 3741, series: [88,102,96,118,124,111,135,142,126,151,148,163,159,172,185,177,196,203,191,218,226,213,238,244,231,259,271,264,286,301] },
    articles: { value: 932, previous: 816, series: [19,22,18,25,27,24,29,31,28,34,30,36,38,35,41,39,43,46,42,48,51,47,54,56,52,59,62,58,64,69] },
    tools: { value: 647, previous: 589, series: [13,15,14,18,16,19,21,20,23,22,25,24,27,29,26,31,30,34,32,36,35,39,37,41,40,44,43,47,46,50] },
    exports: { value: 381, previous: 342, series: [7,9,8,11,10,12,13,12,15,14,16,15,18,17,19,18,21,20,23,22,24,23,26,25,27,26,29,28,30,32] }
  };
  const COPY = {
    en: { live:'Live aggregates', preview:'Preview data · API not connected', versus:'vs previous 30 days', nochange:'No change vs previous 30 days' },
    es: { live:'Datos agregados en vivo', preview:'Datos de muestra · API no conectada', versus:'frente a los 30 días anteriores', nochange:'Sin cambios frente al periodo anterior' }
  };
  const locale = () => document.documentElement.lang === 'es' ? 'es-ES' : 'en-US';
  const points = values => { const max=Math.max(...values,1),min=Math.min(...values),range=Math.max(max-min,1);return values.map((v,i)=>({x:(i/(values.length-1))*360,y:88-((v-min)/range)*76})); };
  const linePath = (values,stepped=false) => { const pts=points(values);return pts.map((p,i)=>i?(stepped?`H ${p.x} V ${p.y}`:`L ${p.x} ${p.y}`):`M ${p.x} ${p.y}`).join(' '); };
  let latest=DEMO,latestLive=false;
  function render(data, live) {
    latest=data;latestLive=live;
    const language=document.documentElement.lang==='es'?'es':'en',copy=COPY[language];
    document.querySelectorAll('.metric-card').forEach(card => {
      const metric=data[card.dataset.metric]; if(!metric)return;
      const values=metric.series?.length>1?metric.series:[0,0],type=card.dataset.chart||'line',path=linePath(values,type==='step');
      card.querySelector('.metric-value').textContent=Number(metric.value||0).toLocaleString(locale());
      const line=card.querySelector('.chart-line'),area=card.querySelector('.chart-area'),bars=card.querySelector('.chart-bars');
      line.setAttribute('d',type==='bars'?'':path);area.setAttribute('d',type==='area'?`${path} L 360 96 L 0 96 Z`:'');bars.innerHTML='';
      if(type==='bars'){const pts=points(values),width=Math.max(3,360/values.length-3);bars.innerHTML=pts.map((p,i)=>`<rect x="${i*(360/values.length)+1.5}" y="${p.y}" width="${width}" height="${96-p.y}" rx="1"></rect>`).join('');}
      const previous=Number(metric.previous||0),current=Number(metric.value||0),change=previous?((current-previous)/previous)*100:0;
      const node=card.querySelector('.metric-change'); node.classList.remove('positive','negative');
      if(Math.abs(change)<.05) node.textContent=copy.nochange;
      else { const up=change>0; node.classList.add(up?'positive':'negative'); node.textContent=`${up?'↑':'↓'} ${Math.abs(change).toFixed(1)}% ${copy.versus}`; }
    });
    const status=document.getElementById('stats-status');if(status){status.className=`stats-status${live?'':' preview'}`;status.innerHTML=`<i aria-hidden="true"></i> ${live?copy.live:copy.preview}`;}
  }
  addEventListener('dwc:language',()=>render(latest,latestLive));
  fetch('/api/stats',{headers:{accept:'application/json'}}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(payload=>render(payload.metrics,true)).catch(()=>render(DEMO,false));
})();
