(() => {
  const allowed=new Set(['page_view','article_read','tool_run','result_export']);
  function track(metric){
    if(!allowed.has(metric))return;
    const endpoint=document.body.dataset.metricsEndpoint;
    if(!endpoint)return;
    const body=JSON.stringify({metric});
    try{fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true,credentials:'omit'}).catch(()=>{});}catch(_){/* Metrics never interrupt the visitor experience. */}
  }
  window.DwcMetrics={track};
  track('page_view');
  if(document.body.classList.contains('article-page')){
    let sent=false;
    const onScroll=()=>{const available=document.documentElement.scrollHeight-innerHeight;if(!sent&&available>0&&scrollY/available>=.6){sent=true;track('article_read');removeEventListener('scroll',onScroll);}};
    addEventListener('scroll',onScroll,{passive:true});onScroll();
  }
})();
