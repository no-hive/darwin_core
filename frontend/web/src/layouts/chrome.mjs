export const navigation = [
  {key:'about',route:'concept/',en:'About',es:'Acerca de',children:[{route:'concept/',en:'Concept',es:'Concepto'},{route:'community/',en:'Community',es:'Comunidad'},{route:'future/',en:'Future',es:'Futuro'}]},
  {key:'tools',route:'tools/',en:'Tools',es:'Herramientas',width:{es:2}},
  {key:'blog',route:'blog/',en:'Blog',es:'Blog'},
  {key:'donate',route:'support/',en:'Donate',es:'Donar'},
  {key:'app',route:'app/',en:'App',es:'App'}
];
export const appNavigation=[
 {key:'main',route:'app/',en:'Main',es:'Inicio'},
 {key:'search',route:'app/search/',en:'Search',es:'Buscar'},
 {key:'groups',route:'app/groups/',en:'Groups',es:'Grupos'},{key:'profile',route:'app/profile/',en:'Profile',es:'Perfil'},
 {key:'add-finding',route:'app/records/new/',en:'Add + a finding',es:'Añadir + un hallazgo',width:{en:2,es:2}}
];
export function renderHeader(lang,route,availableLocales=['en','es']){
  const app=route.startsWith('app/');
  const items=app?appNavigation:navigation;
  const active=item=>['records','groups'].includes(item.key)?route.startsWith(item.route):item.key==='main'?route==='app/':item.key==='search'?route==='app/search/'||route.startsWith('app/research/'):item.key==='about'?['concept/','community/','future/'].includes(route):item.key==='tools'?route.startsWith('tools/'):item.key==='blog'?route.startsWith('blog/'):route===item.route;
  const link=(item,extra='')=>`<a class="${item.key==='add-finding'?'app-add-finding':extra} ${active(item)?'active':''}" href="/${lang}/${item.route}" ${active(item)?'aria-current="page"':''} ${item.width?.[lang]?`data-nav-width="${item.width[lang]}"`:''}>${item[lang]}</a>`;
  return `<header class="site-header ${app?'app-header':''}"><a class="site-mark" href="/${lang}/concept/" aria-label="Darwin Core Protocol"><span>Darwin Core Protocol</span></a><nav class="site-nav ${app?'app-nav':''}" aria-label="${lang==='es'?'Navegación principal':'Primary navigation'}">${items.map(item=>item.children?`<div class="nav-dropdown${item.key==='records'?' records-dropdown':''}"><a class="nav-trigger ${active(item)?'active':''}" href="/${lang}/${item.route}" aria-expanded="false" aria-controls="${item.key}-menu">${item[lang]}</a><div class="nav-menu" id="${item.key}-menu">${item.children.map(c=>`<a href="/${lang}/${c.route}" class="${c.highlight?'nav-add-finding ':''}${route===c.route?'current':''}" ${route===c.route?'aria-current="page"':''}>${c[lang]}</a>`).join('')}</div></div>`:link(item,app?(item.key==='profile'?'profile-link':'app-section-link'):item.key==='app'?'app-link':'')).join('')}<div class="lang-dropdown"><button class="lang-trigger" type="button" aria-label="${lang==='es'?'Cambiar idioma':'Change language'}" aria-expanded="false" aria-controls="language-menu"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5S14.2 18.2 12 20.5M12 3.5C9.8 5.8 8.7 8.6 8.7 12s1.1 6.2 3.3 8.5"/></svg></button><div class="lang-menu" id="language-menu">${availableLocales.map(locale=>`<a href="/${locale}/${route}" lang="${locale}" hreflang="${locale}" data-language="${locale}" ${lang===locale?'class="active" aria-current="true"':''}>${locale==='es'?'Español':'English'}</a>`).join('')}</div></div><button class="nav-collapse" type="button" aria-expanded="true" aria-label="${lang==='es'?'Alternar navegación':'Toggle navigation'}">−</button><svg class="nav-cut-border" aria-hidden="true"><line vector-effect="non-scaling-stroke"/></svg></nav></header>`;
}
/** Five equal footer columns: logo, About, Tools, Engage and App. */
export function renderFooter(lang){
 const es=lang==='es';
 const section=(title,links,placeholders=[])=>`<section><h2>${title}</h2>${links.map(([label,route])=>`<a href="/${lang}/${route}">${label}</a>`).join('')}${placeholders.map(item=>Array.isArray(item)?`<a href="/${lang}/${item[1]}">${item[0]}</a>`:`<span class="footer-placeholder">${item}</span>`).join('')}</section>`;
 const appLinks=appNavigation.flatMap(item=>item.children
   ? item.children.map(child=>[child[lang],child.route])
   : [[item[lang],item.route]]);
 const appColumn=`<div class="footer-app-column"><img class="footer-mascot" src="/assets/footer-mascot-frame.png" alt="Darwin Core Protocol" width="1200" height="1200" loading="lazy"></div>`;
 const about=section(es?'Acerca de':'About',[
   [es?'Concepto':'Concept','concept/'],
   [es?'Comunidad':'Community','community/'],
   [es?'Futuro':'Future','future/']
 ]);
 const tools=section(es?'Herramientas':'Tools',[
   [es?'Herramientas gratuitas':'Free tools','tools/'],
   [es?'Mapeador de columnas':'Column mapper','tools/csv-to-darwin-core/'],
   [es?'Normalizador de fechas':'Date normalizer','tools/date-normalizer/'],
   [es?'Detector de duplicados':'Duplicate finder','tools/duplicate-finder/'],
   [es?'Flujo de datos':'Data workflow','tools/data-workflow/']
 ]);
 const engage=section(es?'Participar':'Engage',[
   ['Blog','blog/'],[es?'Donar':'Donate','support/']
 ],['Twitter (X)','Telegram',[es?'Kit de marca':'Brand Kit','brand-assets/']]);
 const app=section('App',appLinks);
 return `<footer class="site-footer">${appColumn}${about}${tools}${engage}${app}</footer>`;
}
