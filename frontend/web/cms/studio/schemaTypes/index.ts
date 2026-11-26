import {defineArrayMember, defineField, defineType} from 'sanity';

const text = (name: string, title: string, max = 10000) => defineField({name,title,type:'text',rows:4,validation: Rule => Rule.required().max(max)});
const immutable = ({document}: any) => document?.identifiersLocked === true;

const media = defineType({
  name:'dwcMedia',title:'Image',type:'object',fields:[
    defineField({name:'image',title:'Image asset',type:'image',options:{hotspot:true},validation:Rule=>Rule.required()}),
    defineField({name:'alt',title:'Alternative text',type:'string',validation:Rule=>Rule.required().max(1000)}),
    defineField({name:'localFile',title:'Legacy file',type:'string',readOnly:true,hidden:true})
  ]
});
const section = defineType({name:'dwcSection',title:'Text section',type:'object',fields:[
  defineField({name:'heading',type:'string',validation:Rule=>Rule.required().max(500)}),text('text','Paragraph')
],preview:{select:{title:'heading'}}});
const quote = defineType({name:'dwcQuote',title:'Quote',type:'object',fields:[text('quote','Quote')],preview:{select:{title:'quote'}}});
const imageBlock = defineType({name:'dwcImageBlock',title:'Inline image',type:'object',fields:[
  defineField({name:'media',type:'dwcMedia',validation:Rule=>Rule.required()})
],preview:{select:{title:'media.alt',media:'media.image'}}});

const author = defineType({name:'dwcAuthor',title:'Authors',type:'document',fields:[
  defineField({name:'name',type:'string',validation:Rule=>Rule.required().max(200)}),
  defineField({name:'bio',title:'Biography',type:'text',rows:4}),
  defineField({name:'portrait',type:'dwcMedia'})
],preview:{select:{title:'name',media:'portrait.image'}}});
const tag = defineType({name:'dwcTag',title:'Topics',type:'document',fields:[
  defineField({name:'identifiersLocked',title:'Lock stable key',type:'boolean',readOnly:immutable,description:'Lock after assigning the final key; imported topics are already locked.'}),
  defineField({name:'key',title:'Stable key',type:'string',readOnly:immutable,validation:Rule=>Rule.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)}),
  defineField({name:'title',type:'string',validation:Rule=>Rule.required()})
],preview:{select:{title:'title',subtitle:'key'}}});
const article = defineType({name:'dwcArticle',title:'Articles',type:'document',groups:[
  {name:'content',title:'Content',default:true},{name:'settings',title:'Publication'},{name:'seo',title:'SEO'}
],initialValue:()=>({locale:'en',kind:'Article',visibility:'public',section:'science',publishedAt:new Date().toISOString()}),fields:[
  defineField({name:'identifiersLocked',title:'Lock article identity and URL',type:'boolean',group:'settings',readOnly:immutable,description:'Enable once articleId, language and slug are final. Imported documents are already locked. Unlocking requires a deliberate migration.'}),
  defineField({name:'articleId',title:'Translation group ID',description:'Use the same permanent ID in EN and ES. Never change after import.',type:'string',group:'settings',readOnly:immutable,validation:Rule=>Rule.required().regex(/^[a-zA-Z0-9_-]+$/)}),
  defineField({name:'locale',title:'Language',type:'string',group:'settings',options:{list:[{title:'English',value:'en'},{title:'Español',value:'es'}],layout:'radio'},readOnly:immutable,validation:Rule=>Rule.required()}),
  defineField({name:'slug',type:'slug',group:'settings',options:{source:'title',maxLength:160,isUnique:async(value,context)=>{
    const id=(context.document?._id||'').replace(/^drafts\./,'');
    const count=await context.getClient({apiVersion:'2026-03-01'}).fetch('count(*[_type == "dwcArticle" && locale == $locale && slug.current == $slug && !(_id in [$id,$draft])])',{locale:context.document?.locale,slug:value,id,draft:'drafts.'+id});
    return count===0;
  }},readOnly:immutable,description:'EN/ES slugs must match. Route changes need a separate redirect migration.',validation:Rule=>Rule.required()}),
  defineField({name:'kind',title:'Type',type:'string',group:'settings',options:{list:['Article','Guide','News']},validation:Rule=>Rule.required()}),
  defineField({name:'section',title:'Blog section',type:'string',group:'settings',options:{list:['science','tools','blockchain','projects-reviews']},validation:Rule=>Rule.required()}),
  defineField({name:'visibility',type:'string',group:'settings',options:{list:[{title:'Public after publishing',value:'public'},{title:'Hidden from site',value:'hidden'}]},validation:Rule=>Rule.required()}),
  defineField({name:'publishedAt',title:'Publication date',type:'datetime',group:'settings',validation:Rule=>Rule.required()}),
  defineField({name:'displayDate',title:'Display date override',type:'string',group:'settings',description:'Optional; imported display dates are preserved.'}),
  defineField({name:'title',type:'string',group:'content',validation:Rule=>Rule.required().max(500)}),
  defineField({...text('dek','Introduction',3000),group:'content'}),
  defineField({name:'hero',title:'Hero image',type:'dwcMedia',group:'content',validation:Rule=>Rule.required()}),
  defineField({name:'authors',type:'array',group:'content',of:[defineArrayMember({type:'reference',to:[{type:'dwcAuthor'}]})]}),
  defineField({name:'tags',title:'Topics',type:'array',group:'content',of:[defineArrayMember({type:'reference',to:[{type:'dwcTag'}]})],validation:Rule=>Rule.required().min(1).unique()}),
  defineField({name:'blocks',title:'Article body',description:'Stable array keys survive reordering. Preserve keys when editing translations.',type:'array',group:'content',of:[defineArrayMember({type:'dwcSection'}),defineArrayMember({type:'dwcQuote'}),defineArrayMember({type:'dwcImageBlock'})],validation:Rule=>Rule.required().min(1).max(200)}),
  defineField({name:'seo',type:'object',group:'seo',fields:[
    defineField({name:'title',title:'Search title override',type:'string',validation:Rule=>Rule.max(500)}),
    defineField({name:'description',type:'text',rows:3,validation:Rule=>Rule.max(3000)})
  ]})
],preview:{select:{title:'title',locale:'locale',media:'hero.image'},prepare:({title,locale,media})=>({title,subtitle:locale?.toUpperCase(),media})}});

export const schemaTypes = [media,section,quote,imageBlock,author,tag,article];
