(function(){
'use strict';
const C=window.DwcCore;
let root=document.getElementById('tool-app');if(!root)return;
const state={input:null,result:null,steps:[],busy:false,message:'',error:null,page:0,filter:'all',groups:{},sourceFile:null,workbook:null,bookId:null,sheet:'',headerRow:1,delimiter:'',encoding:'utf-8',sample:false,safe:true,mode:root.dataset.mode};
let worker=null,sequence=0,pending=new Map(),loadGeneration=0;
const lang=()=>document.documentElement.lang==='es'?'es':'en';
const t=k=>window.DwcText[lang()][k]||k;
const err=error=>(window.DwcErrors[lang()][error.code]||t('processing_failed'))+(error.details?.step?' · '+t('stepError')+' '+error.details.step:'')+(error.details?.line?' · '+t('row')+' '+error.details.line:'');
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const label=(text,content)=>`<label class="app-field"><span>${esc(text)}</span>${content}</label>`;
const select=(attrs,options,value)=>`<select ${attrs}>${options.map(([v,n])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
const button=(action,text,attrs='')=>`<button type="button" data-action="${action}" ${attrs}>${esc(text)}</button>`;
const jsonClone=o=>JSON.parse(JSON.stringify(o));
function newStep(type){let id;do{id='s'+(++sequence);}while(state.steps.some(step=>step.id===id));return{id,type,config:type==='map'?{mappings:{}}:type==='dates'?{source:'',end:'',format:'auto',excel1904:Boolean(state.input?.source.excel1904),writeMode:'replace',targetName:'eventDate_normalized'}:{columns:[],trim:false,ignoreCase:false,removeRowIds:[]}};}
function initialSteps(){state.steps=state.mode==='workflow'?['map','dates','duplicates'].map(newStep):[newStep(state.mode)];}
initialSteps();
function stopWorker(error){
 const previous=worker;worker=null;previous?.terminate();
 for(const job of pending.values()){clearTimeout(job.timer);job.reject(error);}pending.clear();
}
function rpc(action,payload){
 if(!worker){try{
  const current=new Worker(root.dataset.workerSrc||'/assets/processing-worker.js');worker=current;
  current.onmessage=event=>{if(worker!==current)return;const item=pending.get(event.data.id);if(!item)return;clearTimeout(item.timer);pending.delete(event.data.id);event.data.error?item.reject(event.data.error):item.resolve(event.data.value);};
  current.onerror=()=>{if(worker===current)stopWorker({code:'worker_unavailable'});};
  current.onmessageerror=current.onerror;
 }catch{return Promise.reject({code:'worker_unavailable'});}}
 return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{if(pending.has(id))stopWorker({code:'processing_timeout'});},120000);pending.set(id,{resolve,reject,timer});try{worker.postMessage({id,action,payload});}catch{clearTimeout(timer);pending.delete(id);reject({code:'worker_unavailable'});}});
}
function cancel(renderView=true){loadGeneration++;stopWorker({code:'cancelled'});state.busy=false;state.message='';state.error=null;if(renderView)render();}
function schemaBefore(index){if(!state.input)return[];let d={...state.input,columns:state.input.columns.map(c=>({...c})),rows:[]};for(let i=0;i<index;i++){try{d=C.runPipeline(d,[state.steps[i]]).data;}catch{break;}}return d.columns;}
function defaults(){
 if(!state.input)return;
 state.steps.forEach((s,index)=>{
  const cols=schemaBefore(index);
  if(s.type==='map'&&!Object.keys(s.config.mappings).length)cols.forEach(c=>s.config.mappings[c.id]=C.suggestMapping(c.name)?.target||c.name);
  if(s.type==='dates'&&!cols.some(c=>c.id===s.config.source))s.config.source=cols.find(c=>C.suggestMapping(c.name)?.target==='eventDate')?.id||'';
  if(s.type==='duplicates'&&!s.config.columns.length)s.config.columns=cols.filter(c=>C.suggestMapping(c.name)?.target!=='occurrenceID'&&!/^id$/i.test(c.name)&&!/^original_/.test(c.id)).map(c=>c.id);
 });
}
function invalidate(){state.result=null;state.page=0;state.error=null;state.message='changed';}
function stepUI(step,index){
 const cols=schemaBefore(index),cfg=step.config;const inputNames=cols.map(c=>[c.id,c.name]);
 let out=`<section class="app-step" data-step="${esc(step.id)}"><div class="step-title"><h3>${index+1}. ${esc(t(step.type))}</h3>`;
 if(state.mode==='workflow')out+=`<div class="step-buttons">${button('up','↑',`aria-label="${esc(t('up'))}" ${index===0?'disabled':''}`)}${button('down','↓',`aria-label="${esc(t('down'))}" ${index===state.steps.length-1?'disabled':''}`)}${button('remove-step','×',`aria-label="${esc(t('remove'))}" ${state.steps.length===1?'disabled':''}`)}</div>`;
 out+='</div>';
 if(step.type==='map'){
  out+=`<p class="app-help">${esc(t('terms'))}</p><div class="app-inline">${button('suggest',t('suggest'),'class="app-secondary"')}${button('original-headers',t('unchanged'),'class="app-secondary"')}</div><div class="app-table-scroll"><table><thead><tr><th scope="col">${esc(t('column'))}</th><th scope="col">${esc(t('examples'))}</th><th scope="col">${esc(t('target'))}</th><th scope="col">${esc(t('keep'))}</th></tr></thead><tbody>`;
  cols.forEach(c=>{const mapping=Object.prototype.hasOwnProperty.call(cfg.mappings,c.id)?cfg.mappings[c.id]:c.name;const sourceIndex=state.input.columns.findIndex(s=>s.id===c.id);const values=sourceIndex<0?'—':state.input.rows.slice(0,2).map(r=>r.cells[sourceIndex]).join(' · ');out+=`<tr><th scope="row">${esc(c.name)}</th><td class="sample-cell" title="${esc(values.slice(0,1000))}">${esc(values.slice(0,100))}</td><td><input aria-label="${esc(t('target')+' '+c.name)}" list="dwc-terms" data-mapping="${esc(c.id)}" value="${esc(mapping===null?c.name:mapping)}" ${mapping===null?'disabled':''}></td><td><input type="checkbox" aria-label="${esc(t('keep')+' '+c.name)}" data-keep="${esc(c.id)}" ${mapping!==null?'checked':''}></td></tr>`;});
  out+='</tbody></table></div>';
 }else if(step.type==='dates'){
  out+='<div class="app-fields">'+label(t('dateColumn'),select('data-config="source"',[['',t('notSet')],...inputNames],cfg.source))+label(t('endColumn'),select('data-config="end"',[['',t('none')],...inputNames],cfg.end))+label(t('format'),select('data-config="format"',[['auto',t('auto')],['dmy',t('dmy')],['mdy',t('mdy')],['excel',t('excel')]],cfg.format))+label(t('write'),select('data-config="writeMode"',[['replace',t('replace')],['new',t('newColumn')]],cfg.writeMode));
  if(cfg.format==='excel')out+=label(t('epoch'),select('data-config="excel1904"',[['false','1900'],['true','1904']],String(cfg.excel1904)));
  if(cfg.writeMode==='new')out+=label(t('newName'),`<input data-config="targetName" value="${esc(cfg.targetName)}">`);
  out+=`</div><p class="app-help">${esc(t('dateHelp'))}</p>`;
 }else{
  out+=`<fieldset><legend>${esc(t('compare'))}</legend><div class="app-inline">${button('all-columns',t('all'),'class="app-secondary"')}${button('ignore-ids',t('ignoreIDs'),'class="app-secondary"')}</div><div class="column-checks">`+cols.map(c=>`<label><input type="checkbox" data-compare="${esc(c.id)}" ${cfg.columns.includes(c.id)?'checked':''}>${esc(c.name)}</label>`).join('')+`</div></fieldset><label class="app-check"><input type="checkbox" data-config="trim" ${cfg.trim?'checked':''}>${esc(t('trim'))}</label><label class="app-check"><input type="checkbox" data-config="ignoreCase" ${cfg.ignoreCase?'checked':''}>${esc(t('case'))}</label><p class="app-help">${esc(t('duplicateHelp'))}</p>`;
  if(cfg.removeRowIds?.length)out+=`<p>${esc(t('removed'))}: ${cfg.removeRowIds.length}</p>${button('reset-removals',t('resetRemovals'),'class="app-secondary"')}`;
 }
 return out+'</section>';
}
function preview(data){
 const flagged=new Set(state.result.issues.map(i=>i.rowId));let rows=data.rows;if(state.filter==='issues')rows=rows.filter(r=>flagged.has(r.id));const pages=Math.max(1,Math.ceil(rows.length/25));state.page=Math.min(state.page,pages-1);
 return `<div class="app-result-toolbar">${label(t('show'),select('id="result-filter"',[['all',t('allRows')],['issues',t('flagged')]],state.filter))}<span>${esc(t('page'))} ${state.page+1} / ${pages}</span><div class="app-inline">${button('prev',t('previous'),`class="app-secondary" ${state.page===0?'disabled':''}`)}${button('next',t('next'),`class="app-secondary" ${state.page>=pages-1?'disabled':''}`)}</div></div><div class="app-table-scroll" tabindex="0" role="region" aria-label="${esc(t('table'))}"><table><thead><tr><th scope="col">${esc(t('row'))}</th>${data.columns.map(c=>`<th scope="col">${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rows.slice(state.page*25,state.page*25+25).map(r=>`<tr class="${flagged.has(r.id)?'flagged-row':''}"><th scope="row">${r.id}</th>${r.cells.map(c=>`<td title="${esc(c.slice(0,1000))}">${esc(c.length>160?c.slice(0,160)+'…':c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="app-help">${esc(t('previewLimit'))}</p>`;
}
function duplicateReview(){
 return state.result.steps.filter(s=>s.type==='duplicates').map(step=>{
  if(!step.groups.length)return`<p>${esc(t('noGroups'))}</p>`;
  let index=state.groups[step.id]||0;index=Math.min(index,step.groups.length-1);state.groups[step.id]=index;const group=step.groups[index];
  return `<section class="duplicate-review" data-result-step="${esc(step.id)}"><h3>${esc(t('groups'))} · ${step.groups.length}</h3><p class="app-help">${esc(t('groupNotice'))}</p><div class="app-fields">${label(t('group'),`<input type="number" min="1" max="${step.groups.length}" data-group-index value="${index+1}">`)}${label(t('keeper'),`<input type="number" min="1" data-keeper value="${group.rowIds[0]}">`)}</div><p>${esc(t('row'))}: ${esc(group.rowIds.slice(0,100).join(', '))}${group.rowIds.length>100?' …':''}</p><div class="app-inline">${button('keep-chosen',t('keepChosen'),'class="app-secondary"')}${button('keep-first',t('keepFirst'),'class="app-secondary"')}</div></section>`;
 }).join('');
}
function resultsUI(){
 const r=state.result;if(!r)return'';const risk=Number.isInteger(r.formulaLikeFields)?r.formulaLikeFields>0:r.data.rows.some(row=>row.cells.some(C.formulaRisk))||r.data.columns.some(c=>C.formulaRisk(c.name));
 let out=`<section class="app-results"><h2>${esc(t('result'))}</h2><div class="app-stats"><div><strong>${r.summary.inputRows}</strong><span>${esc(t('inputRows'))}</span></div><div><strong>${r.summary.outputRows}</strong><span>${esc(t('outputRows'))}</span></div><div><strong>${r.summary.changes}</strong><span>${esc(t('changes'))}</span></div><div><strong>${r.summary.issues}</strong><span>${esc(t('issues'))}</span></div></div><p>${esc(r.issues.length?t('processed'):t('noIssues'))}</p>`;
 out+=`<ol class="step-summary">${r.steps.map(s=>`<li><strong>${esc(t(s.type))}</strong> · ${Object.entries(s.summary).map(([k,v])=>esc(t('stat_'+k))+': '+v).join(' · ')}</li>`).join('')}</ol>`;
 out+=duplicateReview()+preview(r.data);
 if(r.issues.length)out+=`<details class="issue-details"><summary>${esc(t('issues'))} (${r.issues.length})</summary><p class="app-help">${esc(t('reportCount'))}</p><div class="app-table-scroll"><table><thead><tr><th>${esc(t('row'))}</th><th>${esc(t('column'))}</th><th>${esc(t('before'))}</th><th>${esc(t('reason'))}</th></tr></thead><tbody>${r.issues.slice(0,100).map(i=>`<tr><td>${esc(i.rowId||'—')}</td><td>${esc(i.column||'—')}</td><td>${esc(i.before||'—')}</td><td>${esc(window.DwcErrors[lang()][i.code]||i.code)}</td></tr>`).join('')}</tbody></table></div></details>`;
 out+=`<div class="app-export">${risk?`<p class="app-alert">${esc(t('risk'))}</p>`:''}<label class="app-check"><input id="safe-csv" type="checkbox" ${state.safe?'checked':''}>${esc(t('exportSafe'))}</label><p class="app-help">${esc(t('exportHelp'))}</p><div class="app-inline">${button('csv',t('download'))}${button('xlsx',t('xlsx'),'class="app-secondary"')}${button('bundle',t('bundle'),'class="app-secondary"')}</div><div class="app-inline">${button('report',t('report'),'class="app-link-button"')}${button('issues',t('issuesCSV'),'class="app-link-button"')}${button('recipe',t('recipe'),'class="app-link-button"')}${button('original',t('downloadOriginal'),'class="app-link-button"')}</div></div></section>`;
 return out;
}
function render(){
 root=document.getElementById('tool-app');if(!root)return;
 const loaded=!!state.input;
 root.innerHTML=`<div class="app-privacy"><span aria-hidden="true">◉</span> ${esc(t('local'))}</div><section class="app-import"><h2>${esc(t('load'))}</h2><div class="file-drop" id="file-drop"><label class="file-pick"><span class="file-arrow" aria-hidden="true">↥</span><strong>${esc(t('drop'))}</strong><span class="app-file-button">${esc(t('file'))}</span><input id="data-file" type="file" accept=".csv,.tsv,.xlsx" ${state.busy?'disabled':''}></label><p class="app-help">${esc(t('limits'))}</p></div><div class="app-fields import-options">${label(t('delimiter'),select('id="input-delimiter"',[['',t('auto')],[',',t('comma')],[';',t('semicolon')],['\t',t('tab')]],state.delimiter))}${label(t('encoding'),select('id="input-encoding"',[['utf-8','UTF-8'],['utf-16le','UTF-16 LE'],['utf-16be','UTF-16 BE'],['windows-1252','Windows-1252']],state.encoding))}${label(t('header'),`<input id="header-row" type="number" min="1" max="20" value="${state.headerRow}">`)}${state.workbook?label(t('sheet'),select('id="workbook-sheet"',state.workbook.sheets.map(s=>[s.name,s.name]),state.sheet)):''}</div><details class="paste-panel"><summary>${esc(t('paste'))}</summary><textarea id="paste-table" rows="5" spellcheck="false" aria-label="${esc(t('paste'))}"></textarea>${button('parse',t('parse'),'class="app-secondary"')}</details><div class="app-inline">${button('sample',t('sample'),'class="app-secondary"')}${loaded?button('clear',t('clear'),'class="app-link-button"'):''}</div>${loaded?`<p class="loaded-file"><strong>${esc(state.input.source.name)}</strong> · ${state.input.rows.length.toLocaleString(lang())} ${esc(t('rows'))} · ${state.input.columns.length} ${esc(t('cols'))}</p>`:''}${state.sample?`<p class="app-help">${esc(t('sampleNotice'))}</p>`:''}${state.input?.warnings?.map(w=>`<p class="app-help">${esc(window.DwcErrors[lang()][w.code]||w.code)}</p>`).join('')||''}${state.workbook?`<p class="app-help">${esc(t('xlsxValues'))}</p>`:''}${state.input?.source.formulaCount?`<p class="app-alert">${esc(t('formulaNotice'))} (${state.input.source.formulaCount})</p>`:''}${state.input?.source.merged?`<p class="app-alert">${esc(t('mergedNotice'))}</p>`:''}</section><div id="app-status" class="app-status ${state.error?'app-alert':''}" role="status" aria-live="polite">${state.error?esc(err(state.error)):state.message?esc(t(state.message)):''}</div>`;
 if(state.busy&&!loaded)root.innerHTML+=button('cancel',t('cancel'),'class="app-secondary"');
 if(loaded){
  root.innerHTML+=`<section class="app-settings"><h2>${esc(t('config'))}</h2>${state.mode==='workflow'?`<p class="app-help">${esc(t('maxSteps'))}</p>`:''}<div class="app-step-list">${state.steps.map(stepUI).join('')}</div>${state.mode==='workflow'?`<div class="app-inline add-steps">${['map','dates','duplicates'].map(type=>button('add-'+type,'+ '+t(type),`class="app-secondary" ${state.steps.length>=8?'disabled':''}`)).join('')}</div>`:''}<datalist id="dwc-terms">${C.TERMS.map(([term])=>`<option value="${esc(term)}">`).join('')}</datalist><div class="app-run-bar">${state.busy?button('cancel',t('cancel'),'class="app-secondary"'):button('run',t('run'))}<span class="app-help">${esc(t('tablePrivacy'))}</span></div><div class="app-inline">${button('recipe',t('recipe'),'class="app-link-button"')}<label class="app-link-button">${esc(t('importRecipe'))}<input id="recipe-file" type="file" accept=".json" hidden></label></div><p class="app-help">${esc(t('recipeHelp'))}</p></section>`;
 }
 root.innerHTML+=resultsUI();
 if(state.busy){root.querySelectorAll('input,select,textarea,button:not([data-action="cancel"])').forEach(e=>e.disabled=true);root.setAttribute('aria-busy','true');}else root.setAttribute('aria-busy','false');
 bindDrop();
}
async function loadText(text,name='pasted-data.csv',sample=false){
 const generation=++loadGeneration;state.busy=true;state.error=null;state.message='loading';render();
 try{const input=await rpc('parse',{text,delimiter:state.delimiter,options:{name,headerRow:state.headerRow-1,source:{encoding:state.encoding}}});if(generation!==loadGeneration)return;state.input=input;state.sample=sample;state.result=null;state.groups={};initialSteps();defaults();state.message='';}catch(e){if(generation===loadGeneration&&e.code!=='cancelled')state.error=e;}finally{if(generation===loadGeneration){state.busy=false;render();}}
}
async function loadFile(file,selectedSheet=''){
 if(!file||state.busy)return;
 if(file.size>C.LIMITS.bytes){state.error={code:'too_large'};render();return;}
 if(!/\.(csv|tsv|xlsx)$/i.test(file.name)){state.error={code:'unsupported_file'};render();return;}
 const generation=++loadGeneration,bookId=state.sourceFile===file&&state.bookId?state.bookId:'book-'+(++sequence);
 state.busy=true;state.error=null;state.message='loading';render();
 try{
  const value=await rpc('file',{file,bookId,sheet:selectedSheet,options:{headerRow:state.headerRow-1,delimiter:state.delimiter,encoding:state.encoding}});
  if(generation!==loadGeneration)return;
  state.sourceFile=file;state.bookId=bookId;state.workbook=value.workbook;state.sheet=value.sheet;state.input=value.input;
  if(/\.tsv$/i.test(file.name)&&!state.delimiter)state.delimiter='\t';
  state.result=null;state.sample=false;state.groups={};initialSteps();defaults();state.message='';
 }catch(error){if(generation===loadGeneration&&error.code!=='cancelled')state.error=error.code?error:{code:'processing_failed'};}
 finally{if(generation===loadGeneration){state.busy=false;render();}}
}
async function run(){
 if(!state.input||state.busy)return;state.busy=true;state.error=null;state.message='running';state.result=null;render();const generation=loadGeneration;
 try{const result=await rpc('run',{data:state.input,steps:state.steps});if(generation!==loadGeneration)return;state.result=result;state.page=0;state.message='processed';window.DwcMetrics?.track('tool_run');}catch(e){if(generation===loadGeneration&&e.code!=='cancelled')state.error=e;}finally{if(generation===loadGeneration){state.busy=false;render();}}
}
function recipe(){const steps=jsonClone(state.steps);steps.forEach(s=>{delete s.config.removeRowIds;});return{format:'dwc-local-recipe',version:1,engine:C.VERSION,inputHeaders:state.input.columns.map(c=>c.name),steps};}
function save(name,content,type='text/plain;charset=utf-8'){
 const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();window.DwcMetrics?.track('result_export');setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function download(action){
 if(!state.input||state.busy||(!['recipe','original'].includes(action)&&!state.result))return;
 const generation=++loadGeneration;
 const input=action==='original'?state.input:{columns:state.input.columns,rows:[],source:state.input.source,warnings:state.input.warnings};
 let result=state.result;
 if(result&&['csv','xlsx'].includes(action))result={data:result.data};
 else if(result&&['report','issues'].includes(action))result={...result,data:{columns:result.data.columns,rows:[],source:result.data.source}};
 const payload=action==='recipe'?{action,recipe:recipe()}:{action,input,result,recipe:recipe(),safe:state.safe,readme:t('scope')+'\n'+t('exportHelp')+'\n'};
 state.busy=true;state.error=null;state.message='running';render();
 try{const value=await rpc('export',payload);if(generation!==loadGeneration)return;save(value.name,value.blob);state.message='done';}
 catch(error){if(generation===loadGeneration&&error.code!=='cancelled')state.error=error.code?error:{code:'processing_failed'};}
 finally{if(generation===loadGeneration){state.busy=false;render();}}
}
async function importRecipe(file){
 if(!state.input||!file||state.busy)return;
 const generation=++loadGeneration;state.busy=true;state.error=null;state.message='loading';render();
 try{
  const steps=await rpc('recipe',{file,headers:state.input.columns.map(c=>c.name),mode:state.mode});if(generation!==loadGeneration)return;
  state.steps=steps.map(s=>{const step=newStep(s.type);step.id=s.id;step.config={...step.config,...s.config,removeRowIds:[]};return step;});invalidate();defaults();
 }catch(error){if(generation===loadGeneration&&error.code!=='cancelled')state.error=error.code?error:{code:'recipe_invalid'};}
 finally{if(generation===loadGeneration){state.busy=false;render();}}
}
function bindDrop(){const zone=root.querySelector('#file-drop');if(!zone)return;zone.addEventListener('dragover',e=>{e.preventDefault();if(!state.busy)zone.classList.add('drag-active');});zone.addEventListener('dragleave',()=>zone.classList.remove('drag-active'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-active');if(!state.busy)loadFile(e.dataTransfer.files[0]);});}
function bindRoot(){
 root.addEventListener('change',async event=>{
  const el=event.target;
  if(el.id==='data-file')return loadFile(el.files[0]);
  if(el.id==='recipe-file')return importRecipe(el.files[0]);
  if(el.id==='result-filter'){state.filter=el.value;state.page=0;return render();}
  if(el.id==='safe-csv'){state.safe=el.checked;return;}
  if(el.id==='workbook-sheet')return loadFile(state.sourceFile,el.value);
  if(['input-delimiter','input-encoding','header-row'].includes(el.id)){
   if(el.id==='input-delimiter')state.delimiter=el.value;
   if(el.id==='input-encoding')state.encoding=el.value;
   if(el.id==='header-row'){const n=Number(el.value);state.headerRow=Number.isInteger(n)?Math.max(1,Math.min(20,n)):1;}
   if(state.sourceFile)return loadFile(state.sourceFile);return;
  }
  const group=el.closest('[data-result-step]');if(group&&el.hasAttribute('data-group-index')){const result=state.result.steps.find(s=>s.id===group.dataset.resultStep);state.groups[result.id]=Math.max(0,Math.min(result.groups.length-1,(+el.value||1)-1));render();return;}
  const stepEl=el.closest('[data-step]');if(!stepEl)return;const step=state.steps.find(s=>s.id===stepEl.dataset.step);if(!step)return;
  if(el.hasAttribute('data-mapping'))step.config.mappings[el.dataset.mapping]=el.value;
  if(el.hasAttribute('data-keep')){const col=schemaBefore(state.steps.indexOf(step)).find(c=>c.id===el.dataset.keep);step.config.mappings[col.id]=el.checked?col.name:null;}
  if(el.hasAttribute('data-compare')){const id=el.dataset.compare;step.config.columns=el.checked?[...new Set([...step.config.columns,id])]:step.config.columns.filter(c=>c!==id);step.config.removeRowIds=[];}
  if(el.hasAttribute('data-config')){const field=el.dataset.config;step.config[field]=el.type==='checkbox'?el.checked:field==='excel1904'?el.value==='true':el.value;if(step.type==='duplicates')step.config.removeRowIds=[];}
  // Any upstream setting change invalidates row-removal decisions in downstream steps.
  state.steps.slice(state.steps.indexOf(step)+1).forEach(s=>{if(s.type==='duplicates')s.config.removeRowIds=[];});
  invalidate();render();
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
  if(state.busy&&action!=='cancel')return;
  if(action==='run')return run();if(action==='cancel')return cancel();
  if(action==='clear'){cancel();state.input=null;state.sourceFile=null;state.workbook=null;state.bookId=null;state.result=null;state.sample=false;initialSteps();render();return;}
  if(action==='sample'){state.sourceFile=null;state.workbook=null;state.headerRow=1;state.delimiter=',';return loadText('Record,Species,Collected,Locality\nDEMO-001,Poa annua,15/06/2025,Madrid\nDEMO-002,Poa annua,15/06/2025,Madrid\nDEMO-003,Bellis perennis,03/04/2025,Madrid\nDEMO-004,Bellis perennis,31/02/2025,Madrid','synthetic-sample.csv',true);}
  if(action==='parse'){const text=root.querySelector('#paste-table').value;state.sourceFile=null;state.workbook=null;return loadText(text);}
  if(['csv','xlsx','report','issues','recipe','bundle','original'].includes(action))return download(action);
  if(action==='prev'){state.page=Math.max(0,state.page-1);render();return;}
  if(action==='next'){state.page++;render();return;}
  if(action.startsWith('add-')){if(state.steps.length<8){state.steps.push(newStep(action.slice(4)));invalidate();defaults();render();}return;}
  const resultEl=el.closest('[data-result-step]');
  if(resultEl){const result=state.result.steps.find(s=>s.id===resultEl.dataset.resultStep);const step=state.steps.find(s=>s.id===result.id);
   if(action==='keep-first')step.config.removeRowIds=result.groups.flatMap(g=>g.rowIds.slice(1));
   if(action==='keep-chosen'){const index=state.groups[result.id]||0;const group=result.groups[index];const keep=+resultEl.querySelector('[data-keeper]').value;if(!group.rowIds.includes(keep)){state.error={code:'keep_one_record'};render();return;}step.config.removeRowIds=[...new Set([...step.config.removeRowIds.filter(id=>!group.rowIds.includes(id)),...group.rowIds.filter(id=>id!==keep)])];}
   return run();
  }
  const container=el.closest('[data-step]');if(!container)return;const index=state.steps.findIndex(s=>s.id===container.dataset.step),step=state.steps[index],cols=schemaBefore(index);
  if(action==='up'&&index>0)[state.steps[index-1],state.steps[index]]=[state.steps[index],state.steps[index-1]];
  if(action==='down'&&index<state.steps.length-1)[state.steps[index+1],state.steps[index]]=[state.steps[index],state.steps[index+1]];
  if(action==='remove-step'&&state.steps.length>1)state.steps.splice(index,1);
  if(action==='suggest')cols.forEach(c=>step.config.mappings[c.id]=C.suggestMapping(c.name)?.target||c.name);
  if(action==='original-headers')cols.forEach(c=>step.config.mappings[c.id]=c.name);
  if(action==='all-columns')step.config.columns=cols.map(c=>c.id);
  if(action==='ignore-ids')step.config.columns=cols.filter(c=>C.suggestMapping(c.name)?.target!=='occurrenceID'&&!/^id$/i.test(c.name)&&!/^original_/.test(c.id)).map(c=>c.id);
  if(action==='reset-removals')step.config.removeRowIds=[];
  if(['up','down','remove-step','all-columns','ignore-ids'].includes(action))state.steps.forEach(s=>{if(s.type==='duplicates')s.config.removeRowIds=[];});
  invalidate();defaults();render();
 });
}
let languageSequence=0;
async function switchLanguage(href,push=true){
 const navigation=++languageSequence;
 try{const response=await fetch(href,{credentials:'same-origin'});if(!response.ok)throw 0;const markup=await response.text();if(navigation!==languageSequence)return;const doc=new DOMParser().parseFromString(markup,'text/html');if(doc.querySelector('#tool-app')?.dataset.mode!==state.mode)throw 0;
  document.documentElement.lang=doc.documentElement.lang;document.title=doc.title;
  document.head.querySelectorAll('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"],script[type="application/ld+json"]').forEach(n=>n.remove());
  doc.head.querySelectorAll('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"],script[type="application/ld+json"]').forEach(n=>document.head.append(document.importNode(n,true)));
  for(const tag of ['header','main','footer']){const old=document.body.querySelector(':scope > '+tag),next=doc.body.querySelector(':scope > '+tag);if(old&&next)old.replaceWith(document.importNode(next,true));}
  if(push)history.pushState(null,'',href);root=document.getElementById('tool-app');bindRoot();render();window.DwcInitializeNavigation?.();try{localStorage.setItem('dwc-language',lang());}catch{}
 }catch{state.error={code:'language_switch'};state.message='';const status=root.querySelector('#app-status');if(status)status.textContent=t('languageFailed');}
}
document.addEventListener('click',event=>{const a=event.target.closest('a[data-language]');if(!a||!root||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();event.stopImmediatePropagation();const target=new URL(a.href,location.href);target.search=location.search;target.hash=location.hash;switchLanguage(target.href);},true);
window.addEventListener('popstate',()=>{if(document.documentElement.lang!==location.pathname.split('/')[1])switchLanguage(location.href,false);});
document.addEventListener('click',event=>{document.querySelectorAll('.language-picker[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.language-picker[open]').forEach(m=>{m.open=false;m.querySelector('summary').focus();});});
window.addEventListener('pagehide',()=>cancel(false));
window.addEventListener('pageshow',event=>{if(event.persisted)render();});
bindRoot();render();
})();
