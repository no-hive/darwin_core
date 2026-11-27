import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

export const post = defineType({
  name: 'post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'legacyId', title: 'Translation group', type: 'string', description: 'The same identifier links translations of an article.'}),
    defineField({name: 'locale', title: 'Language', type: 'string', initialValue: 'en', options: {list: [{title: 'English', value: 'en'}, {title: 'Español', value: 'es'}]}, validation: (rule) => rule.required()}),
    defineField({name: 'kind', title: 'Type', type: 'string', initialValue: 'Article', options: {list: ['Article', 'Guide', 'News']}, validation: (rule) => rule.required()}),
    defineField({name: 'section', title: 'Blog section', type: 'string', initialValue: 'science', options: {list: ['science', 'tools', 'blockchain', 'projects-reviews']}, validation: (rule) => rule.required()}),
    defineField({name: 'tags', title: 'Topics', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}, validation: (rule) => rule.required().min(1).unique()}),
    defineField({name: 'displayDate', title: 'Display date override', type: 'string'}),
    defineField({name: 'sortOrder', title: 'Order for articles with the same date', type: 'number', validation: (rule) => rule.integer().min(0)}),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'kicker', type: 'string', description: 'Short label above the title.'}),
    defineField({name: 'subtitle', type: 'text', rows: 3}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title', isUnique: async (slug, context) => {
      const id = (context.document?._id || '').replace(/^drafts\./, '')
      const count = await context.getClient({apiVersion: '2026-11-26'}).fetch('count(*[_type == "post" && locale == $locale && slug.current == $slug && !(_id in [$id, $draft])])', {locale: context.document?.locale, slug, id, draft: `drafts.${id}`})
      return count === 0
    }}, validation: (rule) => rule.required()}),
    defineField({name: 'publishedAt', type: 'datetime', initialValue: () => new Date().toISOString(), validation: (rule) => rule.required()}),
    defineField({name: 'cover', type: 'image', options: {hotspot: true}, validation: (rule) => rule.required(), fields: [
      defineField({name: 'alt', title: 'Alternative text', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'caption', type: 'string'}),
    ]}),
    defineField({name: 'seoTitle', title: 'SEO title', type: 'string'}),
    defineField({name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3}),
    defineField({name: 'sources', type: 'array', of: [defineArrayMember({name: 'source', type: 'object', fields: [defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}), defineField({name: 'url', type: 'url', validation: (rule) => rule.required().uri({scheme: ['http', 'https']})})]})]}),
    defineField({name: 'body', type: 'array', validation: (rule) => rule.required().min(1), of: [
      defineArrayMember({type: 'block', styles: [
        {title: 'Normal', value: 'normal'}, {title: 'Heading 1', value: 'h1'},
        {title: 'Heading 2', value: 'h2'}, {title: 'Heading 3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'}, {title: 'Pull quote', value: 'pullquote'},
      ], lists: [{title: 'Bulleted', value: 'bullet'}, {title: 'Numbered', value: 'number'}],
      marks: {decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}, {title: 'Inline code', value: 'code'}],
        annotations: [{name: 'link', type: 'object', fields: [defineField({name: 'href', type: 'url', validation: (rule) => rule.required().uri({scheme: ['http', 'https', 'mailto']})})]}]},
      }),
      defineArrayMember({type: 'code', options: {withFilename: true}}),
      defineArrayMember({type: 'table'}),
      defineArrayMember({name: 'articleImage', title: 'Image', type: 'image', options: {hotspot: true}, fields: [
        defineField({name: 'alt', title: 'Alternative text', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'caption', type: 'string'}),
      ]}),
      defineArrayMember({name: 'separator', type: 'object', fields: [defineField({name: 'label', type: 'string', hidden: true})], preview: {prepare: () => ({title: 'Separator'})}}),
    ]}),
    defineField({name: 'relatedArticles', description: 'Select and arrange exactly two related articles manually.', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'post'}], options: {filter: ({document}) => ({filter: '_id != $id && _id != $draftId', params: {id: document?._id?.replace(/^drafts\./, '') || '', draftId: document?._id || ''}})}})], validation: (rule) => rule.required().min(2).max(2).unique()}),
  ],
})
