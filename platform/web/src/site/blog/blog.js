const preview = {
  card: document.querySelector('#featured-preview'),
  image: document.querySelector('#preview-image'),
  title: document.querySelector('#preview-title'),
  excerpt: document.querySelector('#preview-excerpt'),
  tags: document.querySelector('#preview-tags')
};
const rows = [...document.querySelectorAll('.story-row')];

function showStory(row) {
  rows.forEach((item) => item.classList.toggle('selected', item === row));
  preview.image.src = row.dataset.image;
  preview.image.srcset = row.dataset.imageSrcset || '';
  preview.image.sizes = row.dataset.imageSizes || '';
  if(row.dataset.imageWidth){preview.image.width=Number(row.dataset.imageWidth);preview.image.height=Number(row.dataset.imageHeight);}
  preview.image.alt = row.dataset.alt;
  preview.title.textContent = row.dataset.title;
  preview.excerpt.textContent = row.dataset.excerpt;
  preview.tags.textContent = row.dataset.label;
  if (row.dataset.url) {
    preview.card.href = row.dataset.url;
    preview.card.removeAttribute('aria-disabled');
  } else {
    preview.card.removeAttribute('href');
    preview.card.setAttribute('aria-disabled','true');
  }
}

rows.forEach((row) => {
  row.addEventListener('mouseenter', () => showStory(row));
  row.addEventListener('focus', () => showStory(row));
  row.addEventListener('click', (event) => {
    showStory(row);
    if (event.isTrusted && row.dataset.url) window.location.href = row.dataset.url;
  });
});

