import {defineArrayMember, defineField, defineType} from 'sanity'

const sectionChromeFields = [
  defineField({
    name: 'enabled',
    title: 'Visible',
    type: 'boolean',
    initialValue: true,
    description: 'Disable to keep this section in Studio without rendering it publicly.',
  }),
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
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['default', 'animated', 'split', 'centered', 'product', 'security']}, initialValue: 'default'}),
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'highlight', title: 'Highlighted / second line', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'primaryCta', title: 'Primary CTA', type: 'cmsLink'}),
    defineField({name: 'secondaryCta', title: 'Secondary CTA', type: 'cmsLink'}),
    defineField({name: 'media', title: 'Media', type: 'mediaAsset'}),
    defineField({name: 'badges', title: 'Text badges', type: 'array', of: [defineArrayMember({type: 'localizedString'})]}),
    defineField({name: 'showFrameworkBadges', title: 'Show ZebraByte framework badges', type: 'boolean', initialValue: false}),
    defineField({name: 'showReferenceLogos', title: 'Show reference logo strip', type: 'boolean', initialValue: false}),
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
    defineField({name: 'variant', title: 'Card style', type: 'string', options: {list: ['plain', 'bordered', 'panel', 'icon']}, initialValue: 'plain'}),
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
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['media-left', 'media-right', 'full-width', 'sale-argument']}, initialValue: 'media-right'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'body', title: 'Body', type: 'localizedRichText'}),
    defineField({name: 'media', title: 'Media', type: 'mediaAsset', validation: (Rule) => Rule.required()}),
    defineField({name: 'poster', title: 'Video poster', type: 'image', options: {hotspot: true}}),
    defineField({name: 'cta', title: 'CTA', type: 'cmsLink'}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'variant'}},
})

export const mediaGridSection = defineType({
  name: 'mediaGridSection',
  title: 'Media cards / sale arguments',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'columns', title: 'Columns', type: 'number', options: {list: [2, 3]}, initialValue: 2}),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'mediaGridItem',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'body', title: 'Body', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
            defineField({name: 'media', title: 'Media', type: 'mediaAsset'}),
            defineField({name: 'poster', title: 'Video poster', type: 'image', options: {hotspot: true}}),
            defineField({name: 'link', title: 'Optional link', type: 'cmsLink'}),
          ],
          preview: {select: {title: 'title.ro'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const statsSection = defineType({
  name: 'statsSection',
  title: 'Metrics / stats',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'items', title: 'Statistics', type: 'array', of: [defineArrayMember({type: 'statItem'})], validation: (Rule) => Rule.required().min(1).max(8)}),
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
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
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
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'columns', title: 'Column labels', type: 'array', of: [defineArrayMember({type: 'localizedString'})], validation: (Rule) => Rule.required().min(2).max(6)}),
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

export const cardGridSection = defineType({
  name: 'cardGridSection',
  title: 'Card grid',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['plain', 'bordered', 'subtle', 'link-cards']}, initialValue: 'bordered'}),
    defineField({name: 'columns', title: 'Columns', type: 'number', options: {list: [2, 3, 4]}, initialValue: 3}),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'contentCard',
          type: 'object',
          fields: [
            defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localizedString'}),
            defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'description', title: 'Description', type: 'localizedText'}),
            defineField({name: 'icon', title: 'Icon key', type: 'string'}),
            defineField({name: 'media', title: 'Media', type: 'mediaAsset'}),
            defineField({name: 'link', title: 'Link', type: 'cmsLink'}),
            defineField({name: 'tags', title: 'Tags', type: 'tagList'}),
          ],
          preview: {select: {title: 'title.ro'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const stepsSection = defineType({
  name: 'stepsSection',
  title: 'Steps / process',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'variant', title: 'Variant', type: 'string', options: {list: ['numbered', 'timeline', 'cards']}, initialValue: 'numbered'}),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'stepItem',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'description', title: 'Description', type: 'localizedText', validation: (Rule) => Rule.required()}),
            defineField({name: 'link', title: 'Optional link', type: 'cmsLink'}),
          ],
          preview: {select: {title: 'title.ro'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const pricingSection = defineType({
  name: 'pricingSection',
  title: 'Pricing / plans',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'plans',
      title: 'Plans',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(4),
      of: [
        defineArrayMember({
          name: 'pricingPlan',
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'price', title: 'Price / commercial label', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'description', title: 'Description', type: 'localizedText'}),
            defineField({name: 'features', title: 'Features', type: 'array', of: [defineArrayMember({type: 'localizedString'})]}),
            defineField({name: 'highlighted', title: 'Highlighted', type: 'boolean', initialValue: false}),
            defineField({name: 'cta', title: 'CTA', type: 'cmsLink'}),
          ],
          preview: {select: {title: 'name.ro', subtitle: 'price.ro'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title.ro'}},
})

export const siteBlockSection = defineType({
  name: 'siteBlockSection',
  title: 'ZebraByte interactive block',
  type: 'object',
  fields: [
    ...sectionChromeFields,
    defineField({
      name: 'component',
      title: 'Component',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          {title: 'Compliance journey', value: 'complianceTrack'},
          {title: 'Framework badges', value: 'badges'},
          {title: 'Framework strip', value: 'frameworks'},
          {title: 'Reference logos', value: 'logos'},
          {title: 'Stories / case studies', value: 'stories'},
          {title: 'ZebraByte testimonials', value: 'zebrabyteTestimonials'},
          {title: 'Testimonials', value: 'testimonials'},
          {title: 'Newsletter signup', value: 'newsletter'},
        ],
      },
    }),
    defineField({name: 'title', title: 'Optional section title override', type: 'localizedString'}),
    defineField({name: 'description', title: 'Optional description', type: 'localizedText'}),
    defineField({name: 'constrained', title: 'Constrained layout', type: 'boolean', initialValue: false}),
    defineField({name: 'border', title: 'Show border', type: 'boolean', initialValue: false}),
    defineField({name: 'count', title: 'Desktop item count', type: 'number', validation: (Rule) => Rule.min(1).max(20)}),
    defineField({name: 'countMobile', title: 'Mobile item count', type: 'number', validation: (Rule) => Rule.min(1).max(20)}),
  ],
  preview: {select: {title: 'component', subtitle: 'title.ro'}},
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
    defineArrayMember({type: 'mediaGridSection'}),
    defineArrayMember({type: 'statsSection'}),
    defineArrayMember({type: 'logoCloudSection'}),
    defineArrayMember({type: 'testimonialsSection'}),
    defineArrayMember({type: 'comparisonTableSection'}),
    defineArrayMember({type: 'cardGridSection'}),
    defineArrayMember({type: 'stepsSection'}),
    defineArrayMember({type: 'pricingSection'}),
    defineArrayMember({type: 'faqSection'}),
    defineArrayMember({type: 'ctaSection'}),
    defineArrayMember({type: 'siteBlockSection'}),
  ],
})
