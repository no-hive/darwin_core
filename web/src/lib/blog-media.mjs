import {localImage} from './presentation.mjs';

export async function applyBlogMedia(document, catalog, locale) {
  const preview=document.querySelector('#preview-image');
  if(!preview)return;
  const byURL=new Map(catalog.map(article=>[`/${locale}/blog/${article.slug}/`,article]));
  const sizes='(max-width: 760px) 88vw, 42vw';
  for(const row of document.querySelectorAll('.story-row')){
    const article=byURL.get(row.dataset.url);
    if(!article)continue;
    const image=await localImage(article.image,{width:article.width,height:article.height});
    row.dataset.image=image.src;row.dataset.imageSrcset=image.srcset||'';row.dataset.imageSizes=sizes;
    row.dataset.imageWidth=String(image.width);row.dataset.imageHeight=String(image.height);
  }
  const first=catalog[0];if(!first)return;
  const image=await localImage(first.image,{width:first.width,height:first.height});
  preview.setAttribute('src',image.src);
  if(image.srcset){preview.setAttribute('srcset',image.srcset);preview.setAttribute('sizes',sizes);}
  preview.setAttribute('width',String(image.width));preview.setAttribute('height',String(image.height));
  preview.setAttribute('loading','eager');preview.setAttribute('fetchpriority','high');preview.setAttribute('decoding','async');
}
