/** A tiny, synchronous document-canvas style before any external resources.
 * Colors match existing section CSS; this is not a loading overlay or a router.
 */
export function initialPaint(route='',classes=[]){
 const has=name=>classes.includes(name);
 let background='#08150d',foreground='#e3e6d5',scheme='dark';
 if(route.startsWith('app/')||has('app-page')){background='#020f08';foreground='#efffe8';}
 else if(route==='brand-assets/'||has('brand-assets-page')){background='#101114';foreground='#f2f4ed';scheme='dark';}
 else if(route==='tools/'||has('tools-page')){background='#fefbf0';foreground='#1d282d';scheme='light';}
 else if(route.startsWith('tools/')||has('tool-detail-page')){background='#f2f0e9';foreground='#292827';scheme='light';}
 else if(route==='future/'||has('ocean-page')){background='#000000';foreground='#e1f2ff';}
 else if(route==='community/'||has('ember-page')){background='#1b0b06';foreground='#f2dfc7';}
 // This first cascade layer lets the existing complete stylesheet win.
 const css=`@layer initial-paint{html{background:${background};color-scheme:${scheme}}body{margin:0;background:${background};color:${foreground}}}@view-transition{navigation:auto}::view-transition-group(root),::view-transition-old(root),::view-transition-new(root){animation:none}::view-transition-image-pair(root){isolation:isolate}::view-transition-old(root),::view-transition-new(root){mix-blend-mode:normal}`;
 return {background,scheme,css};
}
function ctaNavigationHead(route){
 if(!['community/','future/'].includes(route))return '';
 // One-use UI handoff, written by i18n.js only for the two forward About CTAs.
 // Apply before first paint so the full menu never flashes on arrival.
 return `<script id="cta-nav-entry">(()=>{try{const key='dwc-cta-navigation-entry-v1',raw=sessionStorage.getItem(key);sessionStorage.removeItem(key);if(!raw)return;const entry=JSON.parse(raw),age=Date.now()-entry.createdAt;if(entry.path===location.pathname.replace(/\\/?$/,'/')&&age>=0&&age<30000)document.documentElement.setAttribute('data-cta-nav-entry','');}catch{}})();</script><style id="cta-nav-entry-style">html[data-cta-nav-entry] .site-header .site-nav{width:38px;min-width:38px;padding:0}html[data-cta-nav-entry] .site-nav>:not(.nav-collapse):not(.nav-cut-border){display:none}html[data-cta-nav-entry] .site-nav .nav-collapse{font-size:0}html[data-cta-nav-entry] .site-nav .nav-collapse::before{content:'+';font:16px/1 var(--body)}</style>`;
}
export function initialPaintHead(route='',classes=[]){const paint=initialPaint(route,classes);return `<meta name="color-scheme" content="${paint.scheme}"><meta name="theme-color" content="${paint.background}"><style id="initial-paint">${paint.css}</style>${ctaNavigationHead(route)}`;}
export function applyInitialPaint(document,route){
 document.querySelectorAll('#initial-paint,#cta-nav-entry,#cta-nav-entry-style,meta[name="color-scheme"],meta[name="theme-color"]').forEach(node=>node.remove());
 const anchor=document.querySelector('meta[charset]');
 const html=initialPaintHead(route,[...document.body.classList]);
 if(anchor)anchor.insertAdjacentHTML('afterend',html);else document.head.insertAdjacentHTML('afterbegin',html);
}
