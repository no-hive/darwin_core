const sections = [
  {id:'science',en:'Science',es:'Ciencia'},
  {id:'tools',en:'Tools',es:'Herramientas'},
  {id:'blockchain',en:'Blockchain',es:'Blockchain'},
  {id:'projects-reviews',en:'Projects Reviews',es:'Reseñas de proyectos'}
];

// Both local and CMS content use the actual locale catalog, never row indexes.
export function prepareBlog(document, catalog, locale) {
  const index = document.querySelector('#writing-list');
  document.querySelectorAll('.blog-section').forEach(section => section.remove());
  const labels = locale === 'es' ? {Article:'Artículo',Guide:'Guía',News:'Noticias'} : {Article:'Article',Guide:'Guide',News:'News'};
  for (const section of sections) {
    const articles = catalog.filter(article => article.section === section.id);
    if (!articles.length) continue;
    const node = document.createElement('section'); node.className = 'blog-section';
    const heading = document.createElement('h2'); heading.dataset.blogSection = section.id; heading.textContent = section[locale];
    const list = document.createElement('div'); list.className = 'story-list';
    for (const article of articles) {
      const row = document.createElement('button'); row.type = 'button';
      row.className = 'story-row' + (article.id === catalog[0]?.id ? ' selected' : '');
      Object.assign(row.dataset, {tags:article.type.toLowerCase(),label:labels[article.type],url:`/${locale}/blog/${article.slug}/`,image:article.image.startsWith('https://')?article.image:`/assets/${article.image}`,alt:article.alt,title:article.title,excerpt:article.dek});
      const title = document.createElement('span'); title.textContent = article.title;
      const kind = document.createElement('small'); kind.textContent = labels[article.type];
      const date = document.createElement('time'); date.dateTime = article.isoDate; date.setAttribute('datetime',article.isoDate); date.textContent = article.date;
      row.append(title,kind,date); list.append(row);
    }
    node.append(heading,list); index.append(node);
  }
  const first = catalog[0], preview = document.querySelector('#featured-preview');
  if (!first) { preview?.parentElement.setAttribute('hidden',''); return; }
  preview.setAttribute('href',`/${locale}/blog/${first.slug}/`);
  for (const [selector,value] of [['#preview-title',first.title],['#preview-excerpt',first.dek],['#preview-tags',labels[first.type]]]) document.querySelector(selector).textContent = value;
  const image = document.querySelector('#preview-image'); image.src = first.image.startsWith('https://')?first.image:`/assets/${first.image}`; image.alt = first.alt;
  if (first.width) { image.setAttribute('width',String(first.width)); image.setAttribute('height',String(first.height)); }
}
