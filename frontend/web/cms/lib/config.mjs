export const SANITY_API_VERSION = '2026-03-01';
export function contentSource() {
  const source = process.env.DWC_CONTENT_SOURCE || 'sanity';
  if (source !== 'sanity') throw Error('Articles are served from Sanity.');
  return source;
}
export function sanityConfig({preview = false} = {}) {
  const projectId = process.env.SANITY_PROJECT_ID || '0ypa3y83';
  const dataset = process.env.SANITY_DATASET || 'production';
  if (!projectId || !/^[a-z0-9]+$/.test(projectId)) throw Error('Set a valid SANITY_PROJECT_ID before enabling Sanity.');
  if (!dataset || !/^[a-zA-Z0-9_-]+$/.test(dataset)) throw Error('Set SANITY_DATASET before enabling Sanity.');
  const token = process.env.SANITY_API_READ_TOKEN;
  if (preview && !token) throw Error('Draft preview requires a server-side SANITY_API_READ_TOKEN.');
  return {projectId, dataset, apiVersion: SANITY_API_VERSION, token, perspective: preview ? 'drafts' : 'published', useCdn: false, maxRetries: 2, timeout: 30000};
}
