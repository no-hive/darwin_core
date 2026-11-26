import { locales, routes, viewports } from './routes.mjs';
export const scenarios = [
  ['pages', 'Every sitemap route; fonts/images/HTTP/JS; full-page screenshot'],
  ['stories', 'Concept/Community/Future: three scroll positions, every disclosure, CTA'],
  ['navigation', 'Collapse/expand, dropdown, ArrowDown/Escape, language, touch Concept'],
  ['blog', 'Six articles, selected preview, article/back links, related articles'],
  ['search', 'Live suggestions, keyboard, submitted search, history, language/query'],
  ['groups', 'Join/reload/leave, attach own finding, vote/reload, reset confirmation'],
  ['contribution', 'Dialog, create synthetic finding, group/research, reload'],
  ['profile', 'Edit/cancel/save/reload, search, foreign-profile permissions, back, missing ID'],
  ['tasks', 'Add task, move between lanes, reload'],
  ['tools', 'All four tools in both locales: sample/CSV/paste/XLSX, process, exports, recipe rejection, clear'],
  ['redirects', 'Every configured localized legacy redirect'],
  ['footer', 'Newsletter remains explicitly disconnected; no real email is sent']
];
console.log(JSON.stringify({ locales, routes: routes.length, viewports, pageScreenshots: routes.length * viewports.length,
  scenarios: Object.fromEntries(scenarios), browserStatus: 'PENDING until qa:browser:record and qa:browser pass in a supported browser environment'
}, null, 2));
