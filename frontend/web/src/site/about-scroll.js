// Hold each visual until the final reading block has reached its midpoint.
// Only the space after the last block changes; inter-module gaps stay compact.
(() => {
 const sections=[...document.querySelectorAll('.about-scroll-page .scroll-section')];
 if(!sections.length)return;
 const hint=document.querySelector('.concept-explainer summary');
 const placeholder=document.querySelector('.audience-image-placeholder');
 const explainers=[...document.querySelectorAll('.concept-explainer')];
 const entries=sections.map(section=>({
   section,
   visual:section.querySelector('.scroll-visual'),
   content:section.querySelector('.scroll-content'),
   first:section.querySelector('.scroll-content')?.firstElementChild,
   last:[...section.querySelector('.scroll-content').children].filter(child=>!child.matches('.about-mobile-scene')).at(-1)
 }));
 // Center the resting, collapsed reading block. Expanded explanations add
 // space below the summary, without reducing the leading space above it.
 function collapsedHeight(block){
   let height=block.getBoundingClientRect().height;
   for(const body of block.querySelectorAll('.concept-explainer[open] > .concept-explainer-body')){
     // An outer open body already includes any nested disclosure height.
     const outer=body.parentElement.parentElement?.closest('.concept-explainer[open] > .concept-explainer-body');
     if(!outer||!block.contains(outer))height-=body.getBoundingClientRect().height;
   }
   return Math.max(0,height);
 }
 const swaps=entries.filter(entry=>entry.visual?.hasAttribute('data-about-visual-swap')).map(entry=>({
   ...entry,
   from:entry.content.querySelector('[data-about-swap-from]'),
   to:entry.content.querySelector('[data-about-swap-to]'),
   base:entry.visual.querySelector('[data-about-swap-layer="base"]'),
   next:entry.visual.querySelector('[data-about-swap-layer="next"]'),
   enabled:false,ready:false,shown:null
 }));
 let swapFrame=0;
 function syncSwaps(){
   swapFrame=0;
   for(const swap of swaps){
     const communitySwap=document.body.classList.contains('community-page');
     const block=communitySwap?swap.from:swap.to;
     const target=block.getBoundingClientRect();
     const next=swap.enabled&&swap.ready&&target.top+collapsedHeight(block)/2<=innerHeight*(communitySwap?.5:.618);
     if(next===swap.shown)continue;
     swap.shown=next;
     swap.visual.classList.toggle('is-next-visible',next);
     swap.base.setAttribute('aria-hidden',String(next));
     swap.next.setAttribute('aria-hidden',String(!next));
   }
 }
 function measureSwaps(){
   for(const swap of swaps){
     swap.enabled=getComputedStyle(swap.visual).position==='sticky'
       &&getComputedStyle(swap.section).display==='grid';
   }
   syncSwaps();
 }
 function queueSwap(){if(!swapFrame)swapFrame=requestAnimationFrame(syncSwaps);}
 for(const swap of swaps){
   const image=swap.next.querySelector('img');
   const ready=()=>{
     if(!image?.naturalWidth)return;
     const decoded=image.decode?image.decode():Promise.resolve();
     decoded.then(()=>{swap.ready=true;syncSwaps();}).catch(()=>{});
   };
   image?.addEventListener('load',ready,{once:true});
   if(image?.complete)ready();
 }
 if(swaps.length){
   addEventListener('scroll',queueSwap,{passive:true});
   addEventListener('pageshow',measure);
 }
 function measure(){
   // Mobile Concept is an ordinary document, with no sticky reading reserves.
   if(document.body.classList.contains('concept-page')&&typeof matchMedia==='function'&&matchMedia('(max-width: 700px), (max-width: 1000px) and (pointer: coarse)').matches){
     for(const {content} of entries){content.style.removeProperty('--about-release-space');content.style.removeProperty('--about-text-start');content.style.removeProperty('--about-first-block-height');}
     placeholder?.style.removeProperty('--audience-image-height');
     placeholder?.style.removeProperty('--audience-image-width');
     measureSwaps();
     return;
   }
   if(hint&&placeholder){
     // Match the width and closed height of the preceding hint, including
     // both borders. Opening the hint never makes the image slot taller.
     placeholder.style.setProperty('--audience-image-height',`${hint.getBoundingClientRect().height+2}px`);
     placeholder.style.setProperty('--audience-image-width',`${hint.parentElement.getBoundingClientRect().width}px`);
   }
   for(const {section,visual,content,first,last} of entries){
     if(!visual||!first||!last)continue;
     if(getComputedStyle(section).display!=='grid'||getComputedStyle(visual).position!=='sticky'){
       content.style.removeProperty('--about-text-start');content.style.removeProperty('--about-first-block-height');
       content.style.removeProperty('--about-release-space');
       continue;
     }
     const visualHeight=visual.getBoundingClientRect().height;
     // Align the reading block's center with the contained image's center,
     // rather than placing the block's top edge on the image midpoint.
     const firstHeight=collapsedHeight(first);
     content.style.setProperty('--about-first-block-height',`${firstHeight}px`);
     content.style.setProperty('--about-text-start',`${Math.max(0,(visualHeight-firstHeight)/2)}px`);
     const lastHeight=collapsedHeight(last);
     // At the sticky release point the section bottom meets the visual bottom.
     // This reserve puts the last block's center at or above the visual center.
     const reserve=Math.max(0,(visualHeight-lastHeight)/2)+1;
     content.style.setProperty('--about-release-space',`${Math.ceil(reserve)}px`);
   }
   measureSwaps();
 }
 measure();
 addEventListener('resize',measure,{passive:true});
 for(const details of explainers)details.addEventListener('toggle',measure);
 if(typeof ResizeObserver!=='undefined'){
   const observer=new ResizeObserver(measure);
   for(const {visual,first,last} of entries){if(visual)observer.observe(visual);if(first)observer.observe(first);if(last)observer.observe(last);}
   for(const details of explainers)observer.observe(details);
   for(const {from,to} of swaps){observer.observe(from);observer.observe(to);}
 }
 document.fonts?.ready.then(measure);
})();
