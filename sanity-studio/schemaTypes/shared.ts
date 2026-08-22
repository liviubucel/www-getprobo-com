import {defineArrayMember, defineField, defineType} from 'sanity'

export const cmsLink = defineType({
  name: 'cmsLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'href',
      title: 'Destination',
      type: 'string',
      description: 'Internal path such as /soc2 or a full https:// URL.',
      validation: (Rule) => Rule.required().custom((value) => {
        if (!value) return true
        if (value.startsWith('/') || value.startsWith('#')) return true
        try {
          const url = new URL(value)
          return ['https:', 'mailto:', 'tel:'].includes(url.protocol) || 'Use an internal path or an approved https/mailto/tel URL.'
        } catch {
          return 'Use an internal path or an approved https/mailto/tel URL.'
        }
      }),
    }),
    defineField({name: 'newTab', title: 'Open in new tab', type: 'boolean', initialValue: false}),
    defineField({name: 'style', title: 'Style', type: 'string', options: {list: ['primary', 'secondary', 'text']}, initialValue: 'text'}),
  ],
})

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Meta title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Meta description', type: 'localizedText'}),
    defineField({name: 'image', title: 'Social image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'noIndex', title: 'No index', type: 'boolean', initialValue: false}),
    defineField({name: 'canonicalPath', title: 'Canonical path override', type: 'string'}),
    defineField({name: 'structuredDataType', title: 'Schema.org type', type: 'string', options: {list: ['WebPage', 'Article', 'Service', 'FAQPage', 'AboutPage', 'ContactPage']}}),
  ],
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'object',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {title: 'question.ro'}},
})

export const mediaAsset = defineType({
  name: 'mediaAsset',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'videoUrl', title: 'Video URL', type: 'url', validation: (Rule) => Rule.uri({scheme: ['https']})}),
    defineField({name: 'alt', title: 'Alternative text', type: 'localizedString'}),
    defineField({name: 'caption', title: 'Caption', type: 'localizedString'}),
  ],
})

export const statItem = defineType({
  name: 'statItem',
  title: 'Statistic',
  type: 'object',
  fields: [
    defineField({name: 'value', title: 'Value', type: 'string', validation: (Rule) => Rule.required().max(40)}),
    defineField({name: 'label', title: 'Label', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'detail', title: 'Detail', type: 'localizedString'}),
  ],
})

export const featureItem = defineType({
  name: 'featureItem',
  title: 'Feature',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'localizedText', validation: (Rule) => Rule.required()}),
    defineField({name: 'icon', title: 'Icon key', type: 'string', description: 'Approved icon/component key rendered by the website.'}),
    defineField({name: 'link', title: 'Optional link', type: 'cmsLink'}),
  ],
})

export const logoItem = defineType({
  name: 'logoItem',
  title: 'Logo',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'logo', title: 'Logo', type: 'image', validation: (Rule) => Rule.required()}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.uri({scheme: ['https']})}),
  ],
})

export const testimonialItem = defineType({
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'localizedText', validation: (Rule) => Rule.required()}),
    defineField({name: 'name', title: 'Person', type: 'string'}),
    defineField({name: 'role', title: 'Role', type: 'localizedString'}),
    defineField({name: 'company', title: 'Company', type: 'string'}),
    defineField({name: 'avatar', title: 'Avatar', type: 'image'}),
  ],
})

export const tagList = defineType({
  name: 'tagList',
  title: 'Tags',
  type: 'array',
  of: [defineArrayMember({type: 'string'})],
  options: {layout: 'tags'},
  validation: (Rule) => Rule.unique(),
})
