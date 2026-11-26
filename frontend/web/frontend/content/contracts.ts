/** Vendor-neutral published content. CMS preview will use a separate boundary. */
export type Locale = 'en' | 'es';
export type ArticleKind = 'Article' | 'Guide' | 'News';

export type ArticleBlock =
  | { kind: 'section'; id: string; heading: string; text: string }
  | { kind: 'quote'; id: string; quote: string }
  | { kind: 'image'; id: string; image: string; alt: string; width?: number; height?: number };

export interface Article {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  kicker?: string;
  coverCaption?: string;
  dek: string;
  type: ArticleKind;
  date: string;
  isoDate: string;
  publishedAt?: string;
  updatedAt?: string;
  tags: string[];
  image: string;
  alt: string;
  width?: number;
  height?: number;
  section?: string;
  availableLocales?: Locale[];
  sources?: Array<{label: string; url: string}>;
  authors?: Array<{id: string; name: string}>;
  seoTitle?: string;
  seoDescription?: string;
  blocks: ArticleBlock[];
  body?: unknown[];
  relatedArticles?: string[];
}

export interface PublishedContentProvider {
  listArticles(locale: Locale): Promise<readonly Article[]>;
  getArticleBySlug(locale: Locale, slug: string): Promise<Article | null>;
}
