/** Occurrence input profile using current TDWG terms (2026-10-13).
 * https://dwc.tdwg.org/terms/ ; https://dwc.tdwg.org/simple/
 * Required fields, sizes and accepted input formats below are application rules,
 * not universal Darwin Core requirements. Authored strings are never translated.
 */
export const DWC_VERSION='2026-10-13';
const field=(key,en,es,section,options={})=>({key,en,es,section,max:512,iri:'http://rs.tdwg.org/dwc/terms/'+key,...options});
export const OCCURRENCE_FIELDS=[
 field('occurrenceID','Occurrence identifier','Identificador de ocurrencia','record',{basic:true,max:2048,hint:['Leave blank to generate a persistent UUID.','Deja vacío para generar un UUID persistente.']}),
 field('basisOfRecord','Basis of record','Naturaleza del registro','record',{basic:true,required:true,values:['HumanObservation','MachineObservation','PreservedSpecimen','FossilSpecimen','LivingSpecimen','MaterialSample','MaterialEntity','MaterialCitation','Occurrence']}),
 field('scientificName','Scientific name','Nombre científico','taxon',{basic:true,required:true,hint:['Use the most precise taxon you can identify. Put the original identification wording in verbatimIdentification.','Usa el taxón más preciso que puedas identificar. Conserva la identificación original en verbatimIdentification.']}),
 field('recordedBy','Recorded by','Registrado por','occurrence',{basic:true,hint:['Recorder names, separated by |. The uploader is not automatically the recorder.','Nombres de quienes registraron el evento, separados por |. No se atribuye automáticamente a quien sube los datos.']}),
 field('eventDate','Event date','Fecha del evento','event',{basic:true,max:128,format:'date',placeholder:'2026-11-15',hint:['ISO 8601 date, local/zoned date-time or full-endpoint interval; partial year/month allowed.','Fecha ISO 8601, fecha-hora local/con zona o intervalo con extremos completos; permite año/mes.']}),
 field('locality','Locality','Localidad','location',{basic:true,max:2000}),
 field('occurrenceRemarks','Occurrence remarks','Observaciones de la ocurrencia','occurrence',{basic:true,type:'textarea',max:10000}),
 field('associatedMedia','Associated media','Medios asociados','occurrence',{basic:true,type:'textarea',max:10000,format:'urls',hint:['Media URLs separated by |. Textual evidence notes belong in remarks or references.','URL de medios separadas por |. Las notas de pruebas pertenecen a observaciones o referencias.']}),
 field('recordedByID','Recorder identifiers','Identificadores de quienes registran','occurrence',{max:4000}),
 field('recordNumber','Record number','Número de registro','occurrence'),
 field('occurrenceStatus','Detection status','Estado de detección','occurrence',{values:['detected','notDetected'],hint:['Detection, not the application review status.','Detección, no el estado de revisión de la aplicación.']}),
 field('individualCount','Individual count','Número de individuos','occurrence',{format:'integer',min:0}),
 field('organismQuantity','Organism quantity','Cantidad de organismos','occurrence'),
 field('organismQuantityType','Organism quantity type','Unidad de cantidad de organismos','occurrence'),
 field('sex','Sex','Sexo','occurrence'),field('lifeStage','Life stage','Etapa vital','occurrence'),
 field('reproductiveCondition','Reproductive condition','Condición reproductiva','occurrence'),field('behavior','Behavior','Comportamiento','occurrence',{max:2000}),
 field('associatedReferences','Associated references','Referencias asociadas','occurrence',{type:'textarea',max:10000}),
 field('eventID','Event identifier','Identificador del evento','event',{max:2048}),
 field('eventTime','Event time','Hora del evento','event',{max:128}),
 field('verbatimEventDate','Original event date','Fecha original del evento','event'),
 field('habitat','Habitat','Hábitat','event',{max:2000}),
 field('samplingProtocol','Sampling protocol','Protocolo de muestreo','event',{max:2000}),
 field('samplingEffort','Sampling effort','Esfuerzo de muestreo','event',{max:2000}),
 field('fieldNotes','Field notes','Notas de campo','event',{type:'textarea',max:10000}),
 field('eventRemarks','Event remarks','Observaciones del evento','event',{type:'textarea',max:10000}),
 field('country','Country','País','location'),field('countryCode','Country code','Código de país','location',{max:2,format:'country',placeholder:'RS / XZ / ZZ'}),
 field('stateProvince','State or province','Estado o provincia','location'),field('county','County','Condado','location'),
 field('waterBody','Water body','Masa de agua','location'),field('verbatimLocality','Original locality','Localidad original','location',{max:2000}),
 field('decimalLatitude','Decimal latitude','Latitud decimal','location',{format:'decimal',min:-90,maxValue:90}),
 field('decimalLongitude','Decimal longitude','Longitud decimal','location',{format:'decimal',min:-180,maxValue:180}),
 field('geodeticDatum','Geodetic datum','Datum geodésico','location',{placeholder:'EPSG:4326',hint:['No datum is assumed automatically.','No se presupone ningún datum.']}),
 field('coordinateUncertaintyInMeters','Coordinate uncertainty (m)','Incertidumbre de coordenadas (m)','location',{format:'decimal',exclusiveMin:0}),
 field('verbatimCoordinates','Original coordinates','Coordenadas originales','location'),
 field('verticalDatum','Vertical datum','Datum vertical','location'),
 field('minimumDepthInMeters','Minimum depth (m)','Profundidad mínima (m)','location',{format:'decimal'}),
 field('maximumDepthInMeters','Maximum depth (m)','Profundidad máxima (m)','location',{format:'decimal'}),
 field('minimumElevationInMeters','Minimum elevation (m)','Elevación mínima (m)','location',{format:'decimal'}),
 field('maximumElevationInMeters','Maximum elevation (m)','Elevación máxima (m)','location',{format:'decimal'}),
 field('verbatimIdentification','Original identification','Identificación original','identification',{max:2000}),
 field('identifiedBy','Identified by','Identificado por','identification'),field('identifiedByID','Identifying agent identifiers','Identificadores de quienes identifican','identification',{max:4000}),
 field('dateIdentified','Identification date','Fecha de identificación','identification',{format:'date',max:128}),
 field('identificationQualifier','Identification qualifier','Calificador de identificación','identification'),
 field('identificationVerificationStatus','Identification verification status','Estado de verificación de la identificación','identification'),
 field('identificationRemarks','Identification remarks','Observaciones de identificación','identification',{type:'textarea',max:10000}),
 field('taxonID','Taxon identifier','Identificador del taxón','taxon',{max:2048}),
 field('taxonRank','Taxon rank','Rango del taxón','taxon'),field('scientificNameAuthorship','Scientific name authorship','Autoría del nombre científico','taxon'),
 ...[['kingdom','Kingdom','Reino'],['phylum','Phylum','Filo'],['class','Class','Clase'],['order','Order','Orden'],['family','Family','Familia'],['genus','Genus','Género'],['specificEpithet','Specific epithet','Epíteto específico'],['infraspecificEpithet','Infraspecific epithet','Epíteto infraespecífico'],['vernacularName','Vernacular name','Nombre vernáculo']].map(([key,en,es])=>field(key,en,es,'taxon')),
 field('institutionCode','Institution code','Código de institución','material'),field('collectionCode','Collection code','Código de colección','material'),field('catalogNumber','Catalog number','Número de catálogo','material'),
 field('informationWithheld','Information withheld','Información retenida','record',{type:'textarea',max:4000}),field('dataGeneralizations','Data generalizations','Generalizaciones de datos','record',{type:'textarea',max:4000})
];
export const OCCURRENCE_KEYS=OCCURRENCE_FIELDS.map(field=>field.key);
export const DWC_SECTIONS=[
 {key:'record',en:'Record',es:'Registro'}, {key:'occurrence',en:'Occurrence',es:'Ocurrencia'},
 {key:'event',en:'Event',es:'Evento'},{key:'location',en:'Location',es:'Ubicación'},
 {key:'identification',en:'Identification',es:'Identificación'},{key:'taxon',en:'Taxon',es:'Taxón'},
 {key:'material',en:'Collection / material',es:'Colección / material'}
];
export const fieldLabel=(field,locale='en')=>field[locale]||field.en;
export const blankOccurrence=()=>Object.fromEntries(OCCURRENCE_KEYS.map(key=>[key,'']));
const scalar=value=>typeof value==='string'?value:typeof value?.original==='string'?value.original:typeof value?.en==='string'?value.en:typeof value?.es==='string'?value.es:'';
/** Read-only compatibility projection: never infer the recorder, basis, media,
 * coordinates, taxonomic rank or verification from application metadata. */
export function asOccurrence(record){
 const out=blankOccurrence();
 for(const key of OCCURRENCE_KEYS)if(typeof record[key]==='string')out[key]=record[key];
 for(const [old,key] of [['date','eventDate'],['location','locality'],['description','occurrenceRemarks']])if(!Object.hasOwn(record,key)&&Object.hasOwn(record,old))out[key]=scalar(record[old]);
 if(!out.occurrenceID&&record.id)out.occurrenceID='https://forest-light-study.ustyakin2004.chatgpt.site/occurrence/'+encodeURIComponent(record.id);
 const legacy={...(record.legacy||{})};
 for(const key of ['title','evidence'])if(typeof record[key]==='string')legacy[key]=record[key];
 const createdAt=typeof record.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(record.createdAt)&&Number.isFinite(Date.parse(record.createdAt))?record.createdAt:'';
 return {...out,...(record.isTest===true?{isTest:true}:{}),...(createdAt?{createdAt}:{}),id:record.id,authorId:record.authorId,groupIds:record.groupIds||[],researchIds:record.researchIds||[],status:record.status||'review',legacy};
}
export const occurrenceTitle=record=>record.scientificName||record.occurrenceID||'';
export const occurrenceSummary=record=>[record.eventDate,record.locality,record.recordedBy].filter(Boolean).join(' · ');
// Deliberate input subset of ISO 8601; a truncated interval end is not accepted.
function dateBounds(value){
 const match=/^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/.exec(value);
 if(!match)return null;
 const [,ys,ms,ds,hs,mins,ss,,zone]=match,y=Number(ys),m=Number(ms||1),d=Number(ds||1);
 if(y<1||m<1||m>12||d<1||d>new Date(Date.UTC(y<100?y+400:y,m,0)).getUTCDate()||Number(hs||0)>23||Number(mins||0)>59||Number(ss||0)>59)return null;
 if(zone&&zone!=='Z'&&(Number(zone.slice(1,3))>14||Number(zone.slice(4))>59||(zone.slice(1,3)==='14'&&zone.slice(4)!=='00')))return null;
 const base=Date.parse(`${ys}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${hs||'00'}:${mins||'00'}:${ss||'00'}${zone||'Z'}`);
 if(!Number.isFinite(base))return null;
 // Compare fractional seconds without discarding precision in interval order.
 const instant=BigInt(base)*1000000n+BigInt((match[7]||'').padEnd(9,'0'));
 return [instant,instant];
}
export function validEventDate(value){const parts=value.split('/');if(parts.length>2)return false;const a=dateBounds(parts[0]),b=parts.length===2?dateBounds(parts[1]):a;return Boolean(a&&b&&(parts.length===1||a[0]<=b[0]));}
export function occurrenceErrors(input,{requireMinimum=true}={}){
 const errors=[];
 if(!input||typeof input!=='object')return ['record'];
 for(const field of OCCURRENCE_FIELDS){
  const value=input[field.key]??'';
  if(typeof value!=='string'||value.length>field.max){errors.push(field.key);continue;}
  if(!value){if(requireMinimum&&field.required)errors.push(field.key);continue;}
  if(!value.trim()){errors.push(field.key);continue;}
  if(field.values&&!field.values.includes(value))errors.push(field.key);
  if(field.format==='date'&&!validEventDate(value))errors.push(field.key);
  if(field.format==='country'&&!/^[A-Z]{2}$/.test(value))errors.push(field.key);
  if(['decimal','integer'].includes(field.format)){
   const n=Number(value),pattern=field.format==='integer'?/^\d+$/:/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
   if(!pattern.test(value)||!Number.isFinite(n)||(field.min!==undefined&&n<field.min)||(field.maxValue!==undefined&&n>field.maxValue)||(field.exclusiveMin!==undefined&&n<=field.exclusiveMin))errors.push(field.key);
  }
  if(field.format==='urls'&&value.split('|').some(item=>{try{return !['https:','http:'].includes(new URL(item.trim()).protocol);}catch{return true;}}))errors.push(field.key);
 }
 const has=key=>typeof input[key]==='string'&&input[key]!=='';
 if(has('decimalLatitude')!==has('decimalLongitude'))errors.push('decimalLatitude','decimalLongitude');
 if(has('decimalLatitude')&&!has('geodeticDatum'))errors.push('geodeticDatum');
 if(has('coordinateUncertaintyInMeters')&&!has('decimalLatitude'))errors.push('coordinateUncertaintyInMeters');
 if(has('organismQuantity')!==has('organismQuantityType'))errors.push('organismQuantity','organismQuantityType');
 for(const [low,high] of [['minimumDepthInMeters','maximumDepthInMeters'],['minimumElevationInMeters','maximumElevationInMeters']])if(has(low)&&has(high)&&Number(input[low])>Number(input[high]))errors.push(low,high);
 return [...new Set(errors)];
}
