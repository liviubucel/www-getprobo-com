import {defineArrayMember, defineField, defineType} from 'sanity'
import {localizedRichText, localizedString, localizedText} from './localized'
import {cmsLink, faqItem, featureItem, logoItem, mediaAsset, seo, statItem, tagList, testimonialItem} from './shared'
import {
  comparisonTableSection,
  ctaSection,
  faqSection,
  featureGridSection,
  heroSection,
  logoCloudSection,
  mediaSection,
  pageSections,
  richTextSection,
  statsSection,
  testimonialsSection,
} from './sections'
import {hubArticle, job, legalDocument, navigation, page, siteSettings, story} from './documents'

const richText = defineType({
  name: 'zebrabyteRichText',
  title: 'Rich text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Heading 4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (Rule) => Rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alternative text', type: 'string', validation: (Rule) => Rule.max(180)}),
        defineField({name: 'caption', title: 'Caption', type: 'string'}),
      ],
    }),
  ],
  validation: (Rule) => Rule.required().min(1),
})

const post = defineType({
  name: 'post',
  title: 'Blog article',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().min(8).max(120)}),
    defineField({name: 'slug', title: 'Public slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'excerpt', title: 'Excerpt / meta description', type: 'text', rows: 4, validation: (Rule) => Rule.max(240)}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime', validation: (Rule) => Rule.required()}),
    defineField({name: 'author', title: 'Author', type: 'string', initialValue: 'ZebraByte', validation: (Rule) => Rule.required().max(120)}),
    defineField({name: 'tags', title: 'Tags', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}, validation: (Rule) => Rule.unique()}),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string', validation: (Rule) => Rule.max(180)})],
    }),
    defineField({name: 'body', title: 'Article body', type: 'zebrabyteRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'seo', title: 'Extended SEO', type: 'seo'}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
  ],
  orderings: [{title: 'Published, newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'author', media: 'mainImage'}},
})

export const schemaTypes = [
  richText,
  localizedString,
  localizedText,
  localizedRichText,
  cmsLink,
  seo,
  faqItem,
  mediaAsset,
  statItem,
  featureItem,
  logoItem,
  testimonialItem,
  tagList,
  heroSection,
  richTextSection,
  featureGridSection,
  mediaSection,
  statsSection,
  logoCloudSection,
  testimonialsSection,
  comparisonTableSection,
  faqSection,
  ctaSection,
  pageSections,
  siteSettings,
  navigation,
  page,
  post,
  hubArticle,
  story,
  job,
  legalDocument,
]
