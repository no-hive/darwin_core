import {initialPaint} from './initial-paint.mjs';
import {SITE, PAGE_TITLES, PAGE_DESCRIPTIONS} from '../config/site.mjs';
import {createOgSpec} from './og-images.mjs';
import {canonicalURL} from './routes.mjs';

/**
 * Pure metadata model shared by Astro and the legacy page adapter.
 * @param {{locale:string, route:string, article?:{title:string,dek:string,seoTitle?:string,seoDescription?:string}|null, fallbackTitle?:string, description?:string, classes?:string[]}} options
 */
export function pageMetadata({locale, route, article, fallbackTitle = '', description: sourceDescription, classes = []}) {
  const fallback = fallbackTitle.replace(/Quiet Light/g, SITE.name)
    .replace(/(?:\s*[—–|.-]\s*Darwin Core Protocol(?: App)?\.?)+$/, '').trim();
  const pageTitle = PAGE_TITLES[locale][route] || article?.seoTitle || article?.title || fallback;
  const title = pageTitle.replace(/\.+$/, '') + `. ${SITE.name}.`;
  const description = article?.seoDescription || article?.dek || PAGE_DESCRIPTIONS[locale]?.[route] || sourceDescription || pageTitle;
  const url = canonicalURL(locale, route);
  const spec = createOgSpec({title, lang: locale, route, classes});
  const image = SITE.origin + spec.file;
  const openGraph = {
    type: article ? 'article' : 'website', title, description, url, image,
    site_name: SITE.name, locale: locale === 'es' ? 'es_ES' : 'en_US',
    'image:width': '1200', 'image:height': '630', 'image:type': 'image/png',
    'image:alt': `${spec.title}. ${SITE.name}.`
  };
  const twitter = {card: 'summary_large_image', title, description, image, 'image:alt': `${spec.title}. ${SITE.name}.`};
  const structured = [
    {'@context': 'https://schema.org', '@type': 'WebSite', '@id': canonicalURL(locale, 'concept/') + '#website', name: SITE.name, url: canonicalURL(locale, 'concept/'), inLanguage: locale},
    {'@context': 'https://schema.org', '@type': 'WebPage', '@id': url + '#webpage', name: title, description, url, inLanguage: locale, isPartOf: {'@id': canonicalURL(locale, 'concept/') + '#website'}}
  ];
  const availableLocales = article?.availableLocales || SITE.locales;
  const defaultLocale = availableLocales.includes(SITE.defaultLocale) ? SITE.defaultLocale : availableLocales[0];
  const alternates = [...availableLocales.map(lang => ({lang, href: canonicalURL(lang, route)})), {lang: 'x-default', href: canonicalURL(defaultLocale, route)}];
  return {pageTitle, title, description, url, spec, openGraph, twitter, structured, alternates,paint:initialPaint(route,classes)};
}
