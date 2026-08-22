import {defineArrayMember, defineField, defineType} from 'sanity'
import {validateCanonicalPath, validateCmsHref, validateHttpsUrl} from './policy'

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
      description: 'Canonical ZebraByte path, anchor, HTTPS URL, mailto address or telephone link.',
      validation: (Rule) => Rule.required().custom(validateCmsHref),
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
    defineField({
      name: 'canonicalPath',
      title: 'Canonical path override',
      type: 'string',
      description: 'Use only when the canonical route differs from this document route. Never enter /en manually.',
      validation: (Rule) => Rule.custom(validateCanonicalPath),
    }),
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
    defineField({
      name: 'videoFile',
      title: 'Uploaded video',
      type: 'file',
      options: {accept: 'video/*'},
      description: 'Preferred for videos managed directly from ZebraByte CMS.',
    }),
    defineField({
      name: 'videoUrl',
      title: 'External / migration video URL',
      type: 'url',
      description: 'HTTPS fallback for existing or externally hosted video. Prefer Uploaded video for new CMS-managed media.',
      validation: (Rule) => Rule.custom(validateHttpsUrl),
    }),
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
    defineField({name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.custom(validateHttpsUrl)}),
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
    defineField({
      name: 'sourceNote',
      title: 'Internal provenance note',
      type: 'text',
      rows: 3,
      description: 'Internal evidence/source for the relationship or quote. Not rendered publicly.',
    }),
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
