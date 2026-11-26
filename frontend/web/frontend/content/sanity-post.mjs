import {toHTML, uriLooksSafe} from '@portabletext/to-html';
import {createImageUrlBuilder} from '@sanity/image-url';
import hljs from 'highlight.js';

// This query and renderer are prepared for a future Sanity-powered route.
export const SANITY_POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, kicker, subtitle, slug, publishedAt, cover{alt, caption, "asset": asset->{_id, url, "dimensions": metadata.dimensions}}, seoTitle, seoDescription, body[]{..., _type == "articleImage" => {..., "asset": asset->{_id, url, "dimensions": metadata.dimensions}}},
  "relatedArticles": relatedArticles[]->{_id, title, subtitle, slug}
}`;

const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const imageBuilder = createImageUrlBuilder({projectId: '0ypa3y83', dataset: 'production'});

export function imageUrl(image) {
  if (!image?.asset?._ref && !image?.asset?._id) return '';
  try { return imageBuilder.image(image).width(1200).fit('max').auto('format').url(); }
  catch { return ''; }
}

function imageDimensions(image) {
  const dimensions = image?.asset?.dimensions;
  if (!Number.isSafeInteger(dimensions?.width) || !Number.isSafeInteger(dimensions?.height)) return '';
  return ` width="${dimensions.width}" height="${dimensions.height}"`;
}

export function renderBody(body) {
  if (!Array.isArray(body)) return '';
  return toHTML(body, {components: {
    block: {pullquote: ({children}) => `<blockquote class="sanity-pullquote">${children}</blockquote>`},
    marks: {link: ({children, value}) => {
      const href = value?.href || '';
      return uriLooksSafe(href) ? `<a href="${escape(href)}" rel="noopener noreferrer">${children}</a>` : children;
    }},
    types: {
      articleImage: ({value}) => {
        const src = imageUrl(value);
        return src ? `<figure><img src="${escape(src)}" alt="${escape(value.alt)}"${imageDimensions(value)} loading="lazy" decoding="async">${value.caption ? `<figcaption>${escape(value.caption)}</figcaption>` : ''}</figure>` : '';
      },
      separator: () => '<hr>',
      code: ({value}) => {
        const language = typeof value.language === 'string' ? value.language : '';
        const code = typeof value.code === 'string' ? value.code : '';
        const highlighted = language && hljs.getLanguage(language) ? hljs.highlight(code, {language, ignoreIllegals: true}).value : escape(code);
        return `<figure class="sanity-code">${value.filename ? `<figcaption>${escape(value.filename)}</figcaption>` : ''}<pre><code class="hljs">${highlighted}</code></pre></figure>`;
      },
      table: ({value}) => {
        const rows = Array.isArray(value.rows) ? value.rows : [];
        return `<div class="sanity-table"><table><tbody>${rows.map((row) => `<tr>${(Array.isArray(row.cells) ? row.cells : []).map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      },
    },
  }});
}
