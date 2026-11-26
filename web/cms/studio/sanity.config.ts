import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
if (!projectId || !dataset) throw new Error('Configure SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET. No placeholder project is used.');

export default defineConfig({
  name: 'darwin-core', title: 'Darwin Core Protocol — Editorial', projectId, dataset,
  plugins: [structureTool({structure: S => S.list().title('Editorial').items([
    ...['en','es'].map(locale => S.listItem().title(locale === 'en' ? 'Articles — English' : 'Artículos — Español')
      .child(S.documentList().title(locale.toUpperCase()).filter('_type == "dwcArticle" && locale == $locale').params({locale}))),
    S.divider(), S.documentTypeListItem('dwcAuthor'), S.documentTypeListItem('dwcTag')
  ])})],
  schema: {types: schemaTypes}
});
