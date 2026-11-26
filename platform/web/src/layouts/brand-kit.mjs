const base='/assets/brand-kit/';
const name='Darwin Core Protocol';
const core=[
  ['wordmark','2400x400',2400,400,'Project name','Nombre del proyecto'],
  ['lockup','2400x400',2400,400,'Project name + Logo','Nombre del proyecto + Logo'],
  ['mark','1000x1000',1000,1000,'Logo #1','Logo #1'],
  ['framed-mark','1000x1000',1000,1000,'Logo #2','Logo #2']
];
const themes=[
  ['concept','Concept','Concepto','#BACB79','#08150D'],
  ['community','Community','Comunidad','#ED7B2D','#1B0B06'],
  ['future','Future','Futuro','#51BAFF','#000000'],
  ['ethereum','Ethereum','Ethereum','#627EEA','#000000'],
  ['app','App','App','#C7FF00','#020F08']
];
const file=(group,key,size)=>`${base}${group}/darwin-core-protocol-${key}-${size}.png`;
const copyIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
const downloadIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';

/** Every preview uses its real downloadable PNG; both locales share one catalog. */
export function renderBrandKit(locale){
  const es=locale==='es';
  const label=(en,spanish)=>es?spanish:en;
  const actions=(src,title)=>{
    const copy=label(`Copy image: ${title}`,`Copiar imagen: ${title}`);
    const download=label(`Download PNG: ${title}`,`Descargar PNG: ${title}`);
    return `<div class="brand-card-actions"><button class="brand-card-control" type="button" data-brand-copy="${src}" title="${copy}" aria-label="${copy}">${copyIcon}</button><a class="brand-card-control" href="${src}" download title="${download}" aria-label="${download}">${downloadIcon}</a></div>`;
  };
  const coreCards=core.map(([key,size,width,height,en,spanish])=>{
    const title=label(en,spanish),src=file('core',key,size);
    const shape=width===height?'square':'wide';
    return `<figure class="brand-card brand-card--${shape} brand-card--${key}"><div class="brand-preview"><img src="${src}" width="${width}" height="${height}" alt="${title}: ${name}" loading="lazy"></div><figcaption><div><h3>${title}</h3><p>${width} × ${height} · PNG</p></div>${actions(src,title)}</figcaption></figure>`;
  }).join('');
  const socialCards=themes.map(([key],index)=>{
    const title=`Social Media Cover #${index+1}`,src=file('social',key,'1600x900');
    return `<figure class="brand-card"><div class="brand-preview"><img src="${src}" width="1600" height="900" alt="${name} · ${title}" loading="lazy"></div><figcaption><div><h3>${title}</h3><p>1600 × 900 · PNG</p></div>${actions(src,title)}</figcaption></figure>`;
  }).join('');
  const alternativeColors=themes.filter(([key])=>['concept','community','future','app'].includes(key)).map(([,en,spanish,ink])=>`<span class="brand-color-option"><span class="brand-color-chip" style="--brand-swatch:${ink}" aria-hidden="true"></span><span>${label(en,spanish)}<span class="brand-color-code">${ink}</span></span></span>`).join('');
  return `<div class="brand-kit-wrap">
    <header class="brand-kit-intro"><h1>${label('Brand Kit','Kit de marca')}</h1><a class="brand-download-all" href="${base}darwin-core-protocol-brand-kit.zip" download>${label('Download the complete kit','Descargar el kit completo')}<span>ZIP · 9 PNG</span></a></header>
    <div class="brand-kit-section"><div class="brand-core-grid">${coreCards}</div></div>
    <div class="brand-kit-section brand-kit-social"><div class="brand-social-grid">${socialCards}</div></div>
    <section class="brand-guidelines" aria-labelledby="brand-guidelines-title"><div><p class="brand-kicker">${label('Usage recommendations','Recomendaciones de uso')}</p><h2 id="brand-guidelines-title">${label('Be creative.','Sé creativo.')}</h2><p>${label('All PNG materials in this Brand Kit are released under','Todos los materiales PNG de este kit se publican bajo')} <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license">CC BY-NC 4.0</a>. ${label('Share and adapt them for noncommercial purposes with attribution, a license link and an indication of changes.','Puedes compartirlos y adaptarlos para fines no comerciales con atribución, un enlace a la licencia e indicación de los cambios.')}</p></div><dl><div><dt>${label('Brand typeface','Tipografía de marca')}</dt><dd>Cormorant Garamond · 600</dd></div><div><dt>${label('Primary color','Color principal')}</dt><dd><span class="brand-color-chip" aria-hidden="true"></span>#627EEA</dd></div><div><dt>${label('Alternative colors','Colores alternativos')}</dt><dd class="brand-palette">${alternativeColors}</dd></div></dl></section>
    <p class="brand-copy-status" data-brand-copy-status role="status" aria-live="polite" hidden></p>
  </div>`;
}
