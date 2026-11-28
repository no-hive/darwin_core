export const ctaChevron='<svg class="cta-chevron" viewBox="0 0 40 32" fill="none" aria-hidden="true" focusable="false"><path d="M10 4 28 16 10 28" stroke="currentColor" stroke-width="3" stroke-linejoin="miter"/></svg>';
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function visual(image){
  if(typeof image==='object'){
    const img=`<img src="${esc(image.src)}" alt="${esc(image.alt)}">`;
    if(image.previewLabel)return `<span class="about-governance-preview"><span class="about-governance-art">${img}<span class="governance-preview-label">${esc(image.previewLabel)}</span></span></span>`;
    return image.edgeFade?`<span class="about-image-fade">${img}</span>`:img;
  }
  return `<div class="about-visual-placeholder" role="img" aria-label="${esc(image)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13"/><circle cx="9" cy="10" r="1.5"/><path d="m4 17 5-4 4 3 3-5 4 6"/></svg></div>`;
}
const paragraphs=items=>items.map(text=>`<p>${esc(text)}</p>`).join('');
export const renderVisualSwap=(base,image)=>`<span class="about-visual-stage"><span class="about-swap-layer" data-about-swap-layer="base">${base}</span><span class="about-swap-layer" data-about-swap-layer="next" aria-hidden="true">${visual(image)}</span></span>`;
const mobileVisual=image=>`<figure class="about-mobile-scene">${visual(image)}</figure>`;

function storyActions(lang,copy){
  const actions=[
    [copy.communityAction,'community'],
    [copy.futureAction,'future'],
    [copy.appAction,'app'],
    [copy.blogAction,'blog']
  ];
  return `<div class="about-actions">${actions.filter(([label])=>label).map(([label,page],index)=>`<a class="about-action about-action-${index===0?'primary':'secondary'}" data-cta-image="${page}" href="/${lang}/${page}/"><span class="cta-copy"><strong class="cta-title">${esc(label)}</strong></span>${ctaChevron}</a>`).join('')}</div>`;
}

export function configureAboutSwap(section,from,to,image){
  const figure=section.querySelector('.scroll-visual');
  section.setAttribute('data-about-scene','');
  figure.setAttribute('data-about-visual-swap','');
  figure.innerHTML=renderVisualSwap(figure.innerHTML,image);
  from.setAttribute('data-about-swap-from','');to.setAttribute('data-about-swap-to','');
  to.insertAdjacentHTML('afterend',mobileVisual(image));
}

function story(section,attributes=''){
  const hints=section.explainers||(section.explainer?[section.explainer]:[]);
  const renderedHints=hints.map(hint=>`<details class="concept-explainer"${hint.open?' open':''}><summary><span>${esc(hint.summary)}</span><i aria-hidden="true">+</i></summary><div class="concept-explainer-body" tabindex="0">${paragraphs(hint.paragraphs)}</div></details>`).join('');
  const explanation=hints.length>1?`<div class="story-explainers">${renderedHints}</div>`:renderedHints;
  const followup=section.afterParagraphs?.length?`<div class="about-story-followup" data-about-followup>${paragraphs(section.afterParagraphs)}</div>`:'';
  return `<article class="scroll-copy${followup?' has-followup':''}" data-about-story ${section.majorBreak?'data-about-major-break':''} ${attributes}><h2>${esc(section.heading)}</h2>${paragraphs(section.paragraphs||[section.text])}${explanation}${followup}</article>`;
}

/** Shared Community/Future layout; each swap includes its mobile flow image. */
export function renderAboutStory(lang,copy,groupSizes,swaps={}){
  if(groupSizes.reduce((sum,size)=>sum+size,0)!==copy.sections.length)throw new Error('About story groups must include every section exactly once.');
  let cursor=0;
  const groups=groupSizes.map(size=>{const group=copy.sections.slice(cursor,cursor+size);cursor+=size;return group;});
  return groups.map((sections,index)=>`<section class="scroll-section ${index===1?'image-left':'image-right'}" ${swaps[index]?'data-about-scene':''}>
    <figure class="scroll-visual" ${swaps[index]?'data-about-visual-swap':''}>${swaps[index]?renderVisualSwap(visual(copy.images[index]),swaps[index].image):visual(copy.images[index])}</figure>
    <div class="scroll-content about-modular-content">${sections.map((item,i)=>story(item,swaps[index]?(i===swaps[index].after?'data-about-swap-from':i===swaps[index].after+1?'data-about-swap-to':''):'')+(swaps[index]&&i===swaps[index].after+1?mobileVisual(swaps[index].image):'')).join('')}${index===groups.length-1?storyActions(lang,copy):''}</div>
  </section>`).join('');
}
