# Sanity article template

The standalone Studio manages `post` documents in project `0ypa3y83`, dataset `production`. The article body supports paragraphs, H1–H3, bold, italics, inline code, links, numbered and bulleted lists, two quote styles, separators, code blocks, tables and images. Images have one text-column width, alternative text and an optional caption. Related articles are selected and ordered manually.

The site fetches published `post` documents from Sanity when `npm run build` runs in `web/`. The generated site is static: a new build and deployment are required after content changes. No automated build webhook is configured. The build fails rather than falling back to local article content if Sanity is unavailable or required content is invalid. `web/frontend/content/sanity-post.mjs` renders the Portable Text body, and article SEO metadata is rendered by the existing page layout.

To run the Studio locally, install its dependencies and run `npm run dev` in `studio/`. To publish schema changes, run `npx sanity schemas deploy` there; to update the hosted Studio, run `npx sanity deploy --yes --schema-required`.
