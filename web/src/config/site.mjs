/** Shared build configuration. Browser code receives only explicit public settings. */
export const SITE = Object.freeze({
  name: 'Darwin Core Protocol',
  origin: 'https://forest-light-study.ustyakin2004.chatgpt.site',
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // This static deployment has no collection API. Enable only with a real endpoint.
  metricsEndpoint: null,
  defaultImage: '/assets/blog-bird.webp',
  faviconVersion: 'crystal-cap-9',
  touchIconVersion: 'green-rounded-crystal-cap-5'
});

/** @type {Record<string, Record<string, string>>} */
export const PAGE_TITLES = {
  en: {'brand-assets/':'Brand Kit','concept/':'Concept','community/':'Community','future/':'Future','tools/':'Tools','app/':'Main','app/records/':'Findings','app/records/new/':'Add a finding','app/records/view/':'Finding','app/search/':'Search','blog/':'Blog','support/':'Donate','app/groups/':'Groups','app/profile/':'Profile'},
  es: {'brand-assets/':'Kit de marca','concept/':'Concepto','community/':'Comunidad','future/':'Futuro','tools/':'Herramientas','app/':'Inicio','app/records/':'Hallazgos','app/records/new/':'Añadir un hallazgo','app/records/view/':'Hallazgo','app/search/':'Buscar','blog/':'Blog','support/':'Donar','app/groups/':'Grupos','app/profile/':'Perfil'}
};

export const PAGE_DESCRIPTIONS = {
  es: {
    'future/':'Explora el futuro de Darwin Core Protocol y de los hallazgos de biodiversidad conectados.',
    'concept/':'El concepto de Darwin Core Protocol: registra hallazgos de biodiversidad, conserva sus pruebas y colabora con la comunidad científica.',
    'community/':'Conoce la comunidad de Darwin Core Protocol y las distintas formas de contribuir al proyecto.',
    'tools/':'Herramientas gratuitas para mapear columnas, normalizar fechas y revisar duplicados en datos Darwin Core.',
    'blog/':'Artículos y notas sobre biodiversidad, datos y Darwin Core Protocol.',
    'support/':'Apoya la ciencia descentralizada con una donación en criptomonedas.',
    'app/':'Noticias, hallazgos, investigaciones y votaciones de tus grupos en Darwin Core Protocol.',
    'app/groups/':'Grupos de trabajo y colaboración de Darwin Core Protocol.',
    'app/profile/':'Perfil del participante, intereses de investigación y actividad en Darwin Core Protocol.'
  }
};
