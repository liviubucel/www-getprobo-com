import {defineArrayMember, defineField, defineType} from 'sanity'
import {validateCmsHref, validateHttpsUrl, validatePublicPath} from './policy'

const menuIconOptions = [
  'article',
  'book-open-text',
  'briefcase',
  'clock-counter-clockwise',
  'code',
  'compass',
  'handshake',
  'heart',
  'magnifying-glass',
  'monitor',
  'notepad',
  'paint-brush',
  'quotes',
  'shield-check',
  'sparkle',
  'terminal-window',
  'users-three',
]

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({name: 'siteName', title: 'Site name', type: 'string', initialValue: 'ZebraByte', validation: (Rule) => Rule.required()}),
    defineField({name: 'tagline', title: 'Tagline', type: 'localizedString'}),
    defineField({name: 'defaultSeo', title: 'Default SEO', type: 'seo'}),
    defineField({name: 'primaryEmail', title: 'Primary email', type: 'email'}),
    defineField({name: 'securityEmail', title: 'Security email', type: 'email'}),
    defineField({name: 'supportUrl', title: 'Support URL', type: 'url', validation: (Rule) => Rule.custom(validateHttpsUrl)}),
    defineField({name: 'statusUrl', title: 'Status URL', type: 'url', validation: (Rule) => Rule.custom(validateHttpsUrl)}),
    defineField({name: 'trustCenterUrl', title: 'Trust Center URL', type: 'url', validation: (Rule) => Rule.custom(validateHttpsUrl)}),
    defineField({name: 'socialLinks', title: 'Social links', type: 'array', of: [defineArrayMember({type: 'cmsLink'})]}),
    defineField({name: 'headerPrimaryCta', title: 'Header primary CTA', type: 'cmsLink'}),
    defineField({name: 'mobileSecondaryCta', title: 'Mobile secondary CTA', type: 'cmsLink'}),
    defineField({name: 'footerCopyright', title: 'Footer copyright', type: 'localizedString'}),
    defineField({name: 'footerLegalLine', title: 'Footer company/legal line', type: 'localizedString'}),
    defineField({
      name: 'announcement',
      title: 'Global announcement',
      type: 'object',
      fields: [
        defineField({name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: false}),
        defineField({name: 'message', title: 'Message', type: 'localizedString'}),
        defineField({name: 'link', title: 'Link', type: 'cmsLink'}),
        defineField({name: 'tone', title: 'Tone', type: 'string', options: {list: ['info', 'success', 'warning', 'critical']}, initialValue: 'info'}),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'header',
      title: 'Header mega-menu',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navGroup',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'href', title: 'Direct href', type: 'string', validation: (Rule) => Rule.custom(validateCmsHref)}),
            defineField({name: 'showLabel', title: 'Show group label inside menu', type: 'boolean', initialValue: true}),
            defineField({
              name: 'items',
              title: 'Dropdown items',
              type: 'array',
              validation: (Rule) => Rule.required().min(1),
              of: [
                defineArrayMember({
                  name: 'navItem',
                  type: 'object',
                  fields: [
                    defineField({name: 'label', title: 'Label', type: 'localizedString', validation: (Rule) => Rule.required()}),
                    defineField({name: 'description', title: 'Description', type: 'localizedString', validation: (Rule) => Rule.required()}),
                    defineField({name: 'href', title: 'Destination', type: 'string', validation: (Rule) => Rule.required().custom(validateCmsHref)}),
                    defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: menuIconOptions}, validation: (Rule) => Rule.required()}),
                  ],
                  preview: {select: {title: 'label.ro', subtitle: 'description.ro'}},
                }),
              ],
            }),
            defineField({
              name: 'feature',
              title: 'Feature card',
              type: 'object',
              validation: (Rule) => Rule.required(),
              fields: [
                defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localizedString', validation: (Rule) => Rule.required()}),
                defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
                defineField({name: 'href', title: 'Destination', type: 'string', validation: (Rule) => Rule.required().custom(validateCmsHref)}),
                defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
                defineField({name: 'legacyAssetPath', title: 'Existing site asset path', type: 'string', description: 'Migration fallback only, for assets already in the ZebraByte repository.'}),
                defineField({name: 'alt', title: 'Alternative text', type: 'localizedString', validation: (Rule) => Rule.required()}),
                defineField({name: 'variant', title: 'Visual variant', type: 'string', options: {list: ['product', 'story', 'guide']}, validation: (Rule) => Rule.required()}),
              ],
            }),
          ],
          preview: {select: {title: 'label.ro'}},
        }),
      ],
    }),
    defineField({
      name: 'footerGroups',
      title: 'Footer groups',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerGroup',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'items', title: 'Links', type: 'array', of: [defineArrayMember({type: 'cmsLink'})], validation: (Rule) => Rule.required().min(1)}),
          ],
          preview: {select: {title: 'title.ro'}},
        }),
      ],
    }),
    defineField({name: 'footerLegal', title: 'Footer legal links', type: 'array', of: [defineArrayMember({type: 'cmsLink'})]}),
  ],
})

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({name: 'internalName', title: 'Internal name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'path',
      title: 'Public path',
      type: 'string',
      description: 'Canonical Romanian path. English is rendered under /en automatically. Publishing a page here makes the CMS version authoritative for that route.',
      validation: (Rule) => Rule.required().custom(validatePublicPath),
    }),
    defineField({name: 'pageType', title: 'Page type', type: 'string', options: {list: ['landing', 'product', 'service', 'security', 'compliance', 'company', 'contact', 'legal', 'utility']}, initialValue: 'landing'}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
    defineField({name: 'sections', title: 'Sections', type: 'pageSections', validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'showHeader', title: 'Show site header', type: 'boolean', initialValue: true}),
    defineField({name: 'showFooter', title: 'Show site footer', type: 'boolean', initialValue: true}),
    defineField({name: 'showFooterFrameworks', title: 'Show framework strip above footer', type: 'boolean', initialValue: true}),
    defineField({name: 'hideFromNavigation', title: 'Hide from navigation', type: 'boolean', initialValue: false}),
  ],
  orderings: [{title: 'Path', name: 'pathAsc', by: [{field: 'path', direction: 'asc'}]}],
  preview: {select: {title: 'internalName', subtitle: 'path'}},
})

export const hubArticle = defineType({
  name: 'hubArticle',
  title: 'HUB / guide',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title.ro', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText', validation: (Rule) => Rule.required()}),
    defineField({name: 'tag', title: 'Card tag', type: 'localizedString'}),
    defineField({name: 'frameworks', title: 'Framework badges', type: 'tagList'}),
    defineField({name: 'body', title: 'Body', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime', validation: (Rule) => Rule.required()}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'slug.current'}},
})

export const story = defineType({
  name: 'story',
  title: 'Story / case study',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title.ro', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'company', title: 'Company / subject', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'industry', title: 'Industry', type: 'localizedString'}),
    defineField({name: 'logo', title: 'Logo', type: 'image'}),
    defineField({name: 'heroMedia', title: 'Hero media', type: 'mediaAsset'}),
    defineField({name: 'impacts', title: 'Impact metrics', type: 'array', of: [defineArrayMember({type: 'statItem'})]}),
    defineField({name: 'body', title: 'Story', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({
      name: 'sourceNote',
      title: 'Internal relationship/provenance note',
      type: 'text',
      rows: 3,
      description: 'Internal evidence for customer/subject claims. Not rendered publicly.',
    }),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'company', media: 'logo'}},
})

export const job = defineType({
  name: 'job',
  title: 'Job',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title.ro', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'location', title: 'Location', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'employmentType', title: 'Employment type', type: 'string', options: {list: ['full-time', 'part-time', 'contract', 'internship']}, validation: (Rule) => Rule.required()}),
    defineField({name: 'remote', title: 'Remote', type: 'boolean', initialValue: false}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({name: 'body', title: 'Job description', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'applyUrl', title: 'Apply URL', type: 'url', validation: (Rule) => Rule.custom(validateHttpsUrl)}),
    defineField({name: 'open', title: 'Open', type: 'boolean', initialValue: true}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'location'}},
})

export const legalDocument = defineType({
  name: 'legalDocument',
  title: 'Legal document',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'path', title: 'Public path', type: 'string', validation: (Rule) => Rule.required().custom(validatePublicPath)}),
    defineField({name: 'body', title: 'Body', type: 'localizedRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'effectiveDate', title: 'Effective date', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({name: 'lastReviewedAt', title: 'Last reviewed', type: 'date'}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {select: {title: 'title.ro', subtitle: 'path'}},
})
