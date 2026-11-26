// Shared navigation controller; translated HTML is rendered at build time.
(function initializeNavigation() {
 window.DwcInitializeNavigation=initializeNavigation;
 window.DwcNavigationCleanup?.();
 const disposers=[];
 const listen=(node,type,callback,options)=>{node.addEventListener(type,callback,options);disposers.push(()=>node.removeEventListener(type,callback,options));};
 const nav=document.querySelector('.site-nav'); if(!nav)return;
 const simpleConceptMobile=()=>document.body.classList.contains('concept-page')&&matchMedia('(max-width: 700px), (max-width: 1000px) and (pointer: coarse)').matches;
 const aboutVisual=document.body.classList.contains('about-scroll-page')?document.querySelector('.scroll-section .scroll-visual'):null;
 const toggle=nav.querySelector('.nav-collapse');
 const tiles=[...nav.children].filter(n=>!n.matches('.nav-collapse,.nav-cut-border'));
 const tileBorderColors=tiles.map(tile=>getComputedStyle(tile.querySelector('.nav-trigger,.lang-trigger')||tile).borderTopColor);
 const border=nav.querySelector('.nav-cut-border');
 // Outline the whole clipped tile as a quadrilateral. The outline is outside
 // the tile's clip-path, so neither end of its sloped edge can be clipped away.
 const outline=document.createElementNS('http://www.w3.org/2000/svg','polygon');
 outline.setAttribute('fill','none');outline.setAttribute('stroke-width','1');
 outline.setAttribute('vector-effect','non-scaling-stroke');border.replaceChildren(outline);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const startsCollapsed=document.documentElement.hasAttribute('data-cta-nav-entry');
 let frame=startsCollapsed?tiles.length:0;
 let target=frame,timer=null,pinned=startsCollapsed;
 window.DwcNavigationCleanup=()=>{clearTimeout(timer);disposers.forEach(fn=>fn());};
 const closeMenus=()=>nav.querySelectorAll('.is-open').forEach(n=>{n.classList.remove('is-open');n.querySelectorAll('.nav-trigger,.lang-trigger,.nav-submenu-toggle').forEach(control=>control.setAttribute('aria-expanded','false'));});
 function draw(){
   nav.classList.toggle('is-collapsed',frame===tiles.length);
   tiles.forEach((tile,i)=>{tile.classList.toggle('nav-folded',i<frame);tile.classList.toggle('nav-fold-cut',frame>0&&i===frame);tile.inert=i<frame;});
   const cut=tiles[frame];
   border.style.display=frame>0&&frame<tiles.length?'block':'none';
   if(cut&&frame>0){
     const rect=cut.getBoundingClientRect(),navRect=nav.getBoundingClientRect(),x=rect.left-navRect.left,y=(rect.top||0)-(navRect.top||0),h=rect.height,w=rect.width,reverse=frame%2===1;
     const inset=.5,slope=18,top=reverse?x+inset:x+slope+inset,bottom=reverse?x+slope+inset:x+inset;
     border.setAttribute('viewBox',`0 0 ${navRect.width} ${navRect.height}`);
     outline.setAttribute('points',`${top},${y+inset} ${x+w-inset},${y+inset} ${x+w-inset},${y+h-inset} ${bottom},${y+h-inset}`);
     const color=tileBorderColors[frame];
     outline.setAttribute('stroke',color);border.style.color=color;
   }
   toggle.textContent=target===tiles.length?'+':'−';toggle.setAttribute('aria-expanded',String(target!==tiles.length));
 }
 function move(collapsed,animate=true){
   if(simpleConceptMobile()){collapsed=false;animate=false;}
   closeMenus();clearTimeout(timer);target=collapsed?tiles.length:0;
   if(!animate||reduced.matches){frame=target;nav.classList.remove('is-animating');draw();return;}
   nav.classList.add('is-animating');
   const step=()=>{frame+=Math.sign(target-frame);draw();if(frame!==target)timer=setTimeout(step,115);else nav.classList.remove('is-animating');};
   if(frame!==target)step();else{draw();nav.classList.remove('is-animating');}
 }
 draw();
 document.documentElement.removeAttribute('data-cta-nav-entry');
 // Only plain, same-tab forward CTA navigation carries the collapsed menu.
 const locale=document.documentElement.lang;
 const currentPath=location.pathname.replace(/\/?$/,'/');
 const nextPath=currentPath===`/${locale}/concept/`?`/${locale}/community/`
   :currentPath===`/${locale}/community/`?`/${locale}/future/`:null;
 if(nextPath)for(const link of document.querySelectorAll('.about-actions a[href]')){
   const destination=new URL(link.href,location.href);
   if(destination.origin!==location.origin||destination.pathname.replace(/\/?$/,'/')!==nextPath)continue;
   listen(link,'click',event=>{
     if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
     try{sessionStorage.setItem('dwc-cta-navigation-entry-v1',JSON.stringify({path:nextPath,createdAt:Date.now()}));}catch{}
   });
 }
 const syncAutoCollapse=()=>{
   if(simpleConceptMobile()){
     if(frame!==0||target!==0)move(false,false);
     return;
   }
   if(pinned)return;
   // Sticky images stay at their CSS top while the text passes. Collapse only
   // when the first image's containing section pushes it above that position.
   const collapsed=aboutVisual
     ?aboutVisual.getBoundingClientRect().top<(parseFloat(getComputedStyle(aboutVisual).top)||0)-.5
     :scrollY>=nav.offsetHeight;
   if(collapsed!==(target===tiles.length))move(collapsed);
 };
 listen(window,'scroll',syncAutoCollapse,{passive:true});
 listen(toggle,'click',()=>{pinned=true;move(target!==tiles.length);});
 listen(window,'resize',()=>{syncAutoCollapse();draw();});
 for(const container of nav.querySelectorAll('.nav-dropdown,.lang-dropdown')){
   const trigger=container.querySelector(':scope > .nav-trigger,:scope > .lang-trigger');
   const controls=[trigger,...container.querySelectorAll('.nav-submenu-toggle')];
   const expanded=value=>controls.forEach(control=>control.setAttribute('aria-expanded',String(value)));
   for(const button of controls.filter(control=>control.tagName==='BUTTON'))listen(button,'click',()=>{const open=!container.classList.contains('is-open');closeMenus();container.classList.toggle('is-open',open);expanded(open);});
   listen(container,'mouseenter',()=>{if(!nav.classList.contains('is-animating')&&matchMedia('(hover:hover)').matches){closeMenus();container.classList.add('is-open');expanded(true);}});
   listen(container,'mouseleave',()=>{container.classList.remove('is-open');expanded(false);});
   listen(trigger,'keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();container.classList.add('is-open');expanded(true);container.querySelector('.nav-menu a,.lang-menu a')?.focus();}});
 }
 listen(document,'click',e=>{if(!e.target.closest('.nav-dropdown,.lang-dropdown'))closeMenus();});
 listen(nav,'keydown',e=>{if(e.key==='Escape'){const trigger=e.target.closest('.nav-dropdown,.lang-dropdown')?.querySelector('.nav-trigger,.lang-trigger');closeMenus();trigger?.focus();}});
 listen(nav,'focusout',()=>setTimeout(()=>{if(!nav.contains(document.activeElement))closeMenus();},0));
 // Keep the original highlighted typing treatment, with readable native text
 // as the CSS fallback until this mirror has been initialized.
 for(const input of document.querySelectorAll('.newsletter-signup input')){
   const wrap=input.closest('.newsletter-input-wrap'),mirror=wrap?.querySelector('.newsletter-mirror');
   if(!mirror)continue;
   const chip=document.createElement('i');mirror.replaceChildren(chip);
   const sync=()=>{chip.textContent=input.value;chip.style.transform=`translateX(${-input.scrollLeft}px)`;};
   sync();wrap.classList.add('newsletter-mirror-ready');
   for(const event of ['input','change','scroll','focus'])listen(input,event,sync);
   listen(window,'pageshow',sync);listen(window,'resize',sync);
 }
 const form=document.querySelector('.newsletter-signup form');if(form)listen(form,'submit',event=>{event.preventDefault();document.querySelector('.newsletter-status').textContent=document.documentElement.lang==='es'?'El boletín aún no está conectado. No se ha enviado el correo.':'The newsletter is not connected yet. Your email has not been sent.';});
})();
