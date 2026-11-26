# Article recommendations

Article content lives in `src/content/article-data.json`; `articles.mjs` is a compatibility view. Each article has a `tags` array of language-independent topic IDs. English and Spanish share the same IDs and recommendations; titles, excerpts and links use the current language. Preserve article/block IDs; translations reference those IDs rather than array positions.

The allowed topics are documented in `ARTICLE_TAGS` in `src/lib/article-recommendations.mjs`. Add a topic there before using it. The build rejects missing tags, duplicate tags and unknown IDs to prevent silent spelling mistakes.

The shared article template displays up to three related articles after the article body. Ranking uses the number of unique common tags, descending. A newer publication wins a tie; slug gives a deterministic final tie-break. The current article and articles without common tags are excluded. Topics and scores are internal and are not rendered as reader-facing labels.

To add a new article, assign a few specific topics that reflect its content. Avoid adding a generic tag to every article just to fill the related section. Recommendations update during the normal build; no manually maintained link lists are needed.

Build as needed for publication. Run verification only when explicitly requested by the user; see `REGRESSION_FLOW.md`.
