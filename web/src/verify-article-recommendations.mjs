import fs from 'node:fs';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {articles} from './content/articles.mjs';import {localizedArticles} from './content/article-catalog.mjs';
import {recommendArticles,validateArticleTags} from './lib/article-recommendations.mjs';
validateArticleTags(articles);
const current={slug:'current',tags:['habitats','field-notes','field-notes']};
const candidate=(slug,tags,isoDate='2026-01-01')=>({slug,tags,isoDate});
const catalog=[candidate('current',current.tags),candidate('newer',['habitats'],'2026-11-10'),candidate('best',['habitats','field-notes'],'2025-01-01'),candidate('older',['habitats']),candidate('unrelated',['marine'])];
assert.deepEqual(recommendArticles(current,catalog).map(({article})=>article.slug),['best','newer','older'],'Tag overlap takes precedence over date; unrelated and self are excluded');
assert.equal(recommendArticles(current,[candidate('duplicate',['habitats','habitats'])])[0].sharedTags.length,1,'A repeated tag never boosts rank');
assert.equal(recommendArticles(current,catalog,0).length,0);assert.equal(recommendArticles({slug:'empty'},catalog).length,0);
assert.throws(()=>validateArticleTags([candidate('bad',['misspelled'])]),/Unknown article tag/);
assert.throws(()=>validateArticleTags([candidate('bad',[])]),/needs internal tags/);
for(const lang of ['en','es'])for(const article of articles){
 const{document}=parseHTML(fs.readFileSync(`dist/${lang}/blog/${article.slug}/index.html`,'utf8'));
 const section=document.querySelector('.article-related');assert(section,`${lang}/${article.slug} has related articles`);
 assert.equal(section,document.querySelector('main').lastElementChild,'Recommendations are at the bottom of the article page');
 assert.equal(section.querySelector('h2').textContent,lang==='es'?'Artículos relacionados':'Related articles');
 const expected=recommendArticles(article,articles).map(({article})=>article);
 const cards=[...section.querySelectorAll('a.related-card')];assert.equal(cards.length,3);
 assert.deepEqual(cards.map(card=>card.getAttribute('href')),expected.map(item=>`/${lang}/blog/${item.slug}/`));
 const localizedBySlug=new Map(localizedArticles(lang).map(item=>[item.slug,item]));
 for(const [i,item] of expected.entries())assert.equal(cards[i].querySelector('h3').textContent,localizedBySlug.get(item.slug).title);
 assert(!section.querySelector('[data-tag],.article-tags'),'Internal tags do not clutter the article');
}
console.log('OK: internal article taxonomy, overlap-first ranking, unique tags, date tie-breaks, no self/unrelated recommendations, and all 12 localized related sections.');
