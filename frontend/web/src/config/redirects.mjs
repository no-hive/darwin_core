// Explicit entry-point redirects only. Do not generate locale/legacy aliases.
export const REDIRECTS=Object.freeze({
 '/':'/en/concept/',
 '/en/':'/en/concept/'
});

export const PRESERVE_REDIRECT_QUERY=new Set(Object.keys(REDIRECTS));
