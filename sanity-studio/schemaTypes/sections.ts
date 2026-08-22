import {defineArrayMember, defineField, defineType} from 'sanity'

const sectionChromeFields = [
  defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localizedString'}),
  defineField({name: 'anchorId', title: 'Anchor ID', type: 'string', validation: (Rule) => Rule.regex(/^[a-z0-9-]*$/)}),
  defineField({name: 'theme', title: 'Theme', type: 'string', options: {list: ['default', 'muted', 'dark', 'brand']}, initialValue: 'default'}),
  defineField({name: 'density', title: 'Spacing', type: 'string', options: {list: ['compact', 'normal', 'roomy']}, initialValue: 'normal'}),
]

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['default', 'split', 'centered', 'product', 'security']}, initialValue: 'default'}),
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'highlight', title: 'Highlighted text', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'primaryCta', title: 'Primary CTA', type: 'cmsLink'}),
    defineField({name: 'secondaryCta', title: 'Secondary CTA', type: 'cmsLink'}),
    defineField({name: 'media', title: 'Media', type: 'mediaAsset'}),
    defineField({name: 'badges', title: 'Badges', type: 'array', of: [defineArrayMember({type: 'localizedString'})]}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'variant'}},
})

export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Rich text',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'body', title: 'Body', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'width', title: 'Content width', type: 'string', options: {list: ['narrow', 'normal', 'wide']}, initialValue: 'normal'}),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const featureGridSection = defineType({
  name: 'featureGridSection',
  title: 'Feature grid',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'columns', title: 'Columns', type: 'number', options: {list: [2, 3, 4]}, initialValue: 3}),
    defineField({name: 'items', title: 'Features', type: 'array', of: [defineArrayMember({type: 'featureItem'})], validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const mediaSection = defineType({
  name: 'mediaSection',
  title: 'Media + text',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['media-left', 'media-right', 'full-width']}, initialValue: 'media-right'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'body', title: 'Body', type: 'localizedRichText'}),
    defineField({name: 'media', title: 'Media', type: 'mediaAsset', validation: (Rule) => Rule.required()}),
    defineField({name: 'cta', title: 'CTA', type: 'cmsLink'}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'variant'}},
})

export const statsSection = defineType({
  name: 'statsSection',
  title: 'Metrics / stats',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'items', title: 'Statistics', type: 'array', of: [defineArrayMember({type: 'statItem'})], validation: (Rule) => Rule.required().min(1).max(6)}),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const logoCloudSection = defineType({
  name: 'logoCloudSection',
  title: 'Logo cloud',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'logos', title: 'Logos', type: 'array', of: [defineArrayMember({type: 'logoItem'})], validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const testimonialsSection = defineType({
  name: 'testimonialsSection',
  title: 'Testimonials',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'items', title: 'Testimonials', type: 'array', of: [defineArrayMember({type: 'testimonialItem'})], validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'items', title: 'Questions', type: 'array', of: [defineArrayMember({type: 'faqItem'})], validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call to action',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['panel', 'banner', 'centered']}, initialValue: 'panel'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'primaryCta', title: 'Primary CTA', type: 'cmsLink', validation: (Rule) => Rule.required()}),
    defineField({name: 'secondaryCta', title: 'Secondary CTA', type: 'cmsLink'}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'variant'}},
})

export const comparisonTableSection = defineType({
  name: 'comparisonTableSection',
  title: 'Comparison table',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'columns', title: 'Column labels', type: 'array', of: [defineArrayMember({type: 'localizedString'})], validation: (Rule) => Rule.required().min(2).max(5)}),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'comparisonRow',
          fields: [
            defineField({name: 'label', title: 'Row label', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'values', title: 'Values', type: 'array', of: [defineArrayMember({type: 'localizedString'})], validation: (Rule) => Rule.required()}),
          ],
          preview: {select: {title: 'label.ro'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const pageSections = defineType({
  name: 'pageSections',
  title: 'Page sections',
  type: 'array',
  of: [
    defineArrayMember({type: 'heroSection'}),
    defineArrayMember({type: 'richTextSection'}),
    defineArrayMember({type: 'featureGridSection'}),
    defineArrayMember({type: 'mediaSection'}),
    defineArrayMember({type: 'statsSection'}),
    defineArrayMember({type: 'logoCloudSection'}),
    defineArrayMember({type: 'testimonialsSection'}),
    defineArrayMember({type: 'comparisonTableSection'}),
    defineArrayMember({type: 'faqSection'}),
    defineArrayMember({type: 'ctaSection'}),
  ],
})
