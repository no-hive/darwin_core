import {OCCURRENCE_FIELDS,DWC_SECTIONS,fieldLabel,occurrenceTitle} from './dwc-occurrence.mjs';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const content=value=>`<span data-object-content translate="no">${esc(value)}</span>`;
export const DWC_COPY={
 en:{basic:'Finding details',more:'Additional Darwin Core fields',profile:'Darwin Core · Occurrence',intro:'Use the fields you know. Scientific name and basis of record are required by this application; other fields can stay empty.',app:'App connections',appHint:'Groups and research links are application metadata, separate from Darwin Core.',legacy:'Previous finding content',legacyHint:'Preserved from the earlier form; these are not Darwin Core terms.',legacyTitle:'Previous title',legacyEvidence:'Previous evidence notes',missing:'Not provided',choose:'Choose a value',invalid:'Review these fields',saved:'Save finding',source:'Official Darwin Core terms',duplicate:'This occurrenceID already exists.'},
 es:{basic:'Datos del hallazgo',more:'Campos Darwin Core adicionales',profile:'Darwin Core · Occurrence',intro:'Completa los campos que conozcas. Esta aplicación requiere nombre científico y naturaleza del registro; los demás pueden quedar vacíos.',app:'Vínculos de la aplicación',appHint:'Los vínculos con grupos e investigaciones son metadatos de la aplicación, separados de Darwin Core.',legacy:'Contenido anterior del hallazgo',legacyHint:'Conservado del formulario anterior; no son términos Darwin Core.',legacyTitle:'Título anterior',legacyEvidence:'Notas de pruebas anteriores',missing:'No proporcionado',choose:'Elige un valor',invalid:'Revisa estos campos',saved:'Guardar hallazgo',source:'Términos oficiales Darwin Core',duplicate:'Este occurrenceID ya existe.'}
};
export function termMarkup(field,lang){return `${esc(fieldLabel(field,lang))}<a class="dwc-term" href="${field.iri}" target="_blank" rel="noopener noreferrer" translate="no">dwc:${field.key}</a>`;}
function valueMarkup(field,value){
 if(field.key!=='associatedMedia')return content(value);
 return value.split('|').map(item=>{const url=item.trim();try{if(!['https:','http:'].includes(new URL(url).protocol))return content(item);}catch{return content(item);}return `<a data-object-content translate="no" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(item)}</a>`;}).join(' | ');
}
export function renderOccurrenceCard(record,href,lang='en'){
 const c=DWC_COPY[lang],fields=['basisOfRecord','eventDate','locality','recordedBy','occurrenceID'];
 return `<article class="proto-card dwc-card" data-entity="records" data-id="${esc(record.id)}"><div class="proto-card-label"><span class="proto-tag" translate="no">dwc:Occurrence</span></div><h3><a href="${esc(href)}">${content(occurrenceTitle(record))}</a></h3><span class="dwc-term" translate="no">dwc:scientificName</span>${record.occurrenceRemarks?`<p>${content(record.occurrenceRemarks)}</p>`:''}<dl class="dwc-card-facts">${fields.filter(key=>record[key]).map(key=>`<div><dt translate="no">${key}</dt><dd>${content(record[key])}</dd></div>`).join('')}</dl><div class="proto-card-foot"><a class="proto-link" href="${esc(href)}">${lang==='es'?'Abrir':'Open'} ↗</a></div></article>`;
}
export function renderOccurrenceDetail(record,lang='en'){
 const c=DWC_COPY[lang];
 return `<header class="proto-head"><div><p class="proto-kicker" translate="no">dwc:Occurrence</p><h1>${content(occurrenceTitle(record))}</h1><p>${content(record.occurrenceID)}</p></div></header>${DWC_SECTIONS.map(section=>{
 const fields=OCCURRENCE_FIELDS.filter(field=>field.section===section.key&&record[field.key]);
 return fields.length?`<section class="proto-section dwc-section"><h2>${esc(section[lang])}</h2><dl class="proto-facts">${fields.map(field=>`<div><dt>${termMarkup(field,lang)}</dt><dd>${valueMarkup(field,record[field.key])}</dd></div>`).join('')}</dl></section>`:'';
 }).join('')}${Object.values(record.legacy||{}).some(Boolean)?`<details class="dwc-legacy"><summary>${c.legacy}</summary><p class="proto-meta">${c.legacyHint}</p><dl class="proto-facts">${[['title',c.legacyTitle],['evidence',c.legacyEvidence]].filter(([key])=>record.legacy[key]).map(([key,label])=>`<div><dt>${label}</dt><dd>${content(record.legacy[key])}</dd></div>`).join('')}</dl></details>`:''}`;
}
export function renderOccurrenceFormFields(lang='en'){
 const c=DWC_COPY[lang];
 const render=field=>{const attrs=`name="${field.key}" id="finding-${field.key}" translate="no" maxlength="${field.max}"${field.required?' required':''}${field.placeholder?` placeholder="${esc(field.placeholder)}"`:''}`;
 const control=field.values?`<select ${attrs}><option value="">${c.choose}</option>${field.values.map(value=>`<option translate="no" value="${value}">${value}</option>`).join('')}</select>`:field.type==='textarea'?`<textarea ${attrs} rows="3"></textarea>`:`<input ${attrs} type="text"${['decimal','integer'].includes(field.format)?` inputmode="${field.format==='integer'?'numeric':'decimal'}"`:''}>`;
 return `<div class="dwc-field${field.type==='textarea'?' dwc-wide':''}"><label for="finding-${field.key}">${esc(fieldLabel(field,lang))}${field.required?' *':''}</label><a class="dwc-term" href="${field.iri}" target="_blank" rel="noopener noreferrer" translate="no">dwc:${field.key}</a>${control}${field.hint?`<small>${esc(field.hint[lang==='es'?1:0])}</small>`:''}</div>`;};
 return `<p class="proto-meta">${c.intro}</p><fieldset class="dwc-fieldset"><legend>${c.basic}</legend><div class="dwc-fields">${OCCURRENCE_FIELDS.filter(field=>field.basic).map(render).join('')}</div></fieldset>${DWC_SECTIONS.map(section=>{const fields=OCCURRENCE_FIELDS.filter(field=>!field.basic&&field.section===section.key);return `<details class="dwc-form-section"><summary>${esc(section[lang])}</summary><div class="dwc-fields">${fields.map(render).join('')}</div></details>`;}).join('')}`;
}
