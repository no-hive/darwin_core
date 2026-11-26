// Explicit rollback affects the build only; no runtime or user data is reset.
process.env.DWC_ARTICLE_RENDERER = 'legacy';
process.env.DWC_CONTENT_SOURCE = 'local';
process.env.DWC_APP_RENDERER = 'legacy';
await import('./build-site.mjs');
