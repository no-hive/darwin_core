import {SITE} from '../config/site.mjs';

export function localizedPath(locale, route = '') {
  if (!SITE.locales.includes(locale)) throw new Error(`Unsupported locale: ${locale}`);
  if (route.startsWith('/') || route.includes('..') || /[?#]/.test(route)) throw new Error(`Expected a relative page route: ${route}`);
  return `/${locale}/${route}`;
}
export const canonicalURL = (locale, route) => SITE.origin + localizedPath(locale, route);
export const articleRoute = slug => `blog/${slug}/`;
