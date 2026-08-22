import {defineConfig} from 'sanity'
import {defineLocations, presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'yj548pxh'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL || 'https://stag.zebrabyte.ro'

const locations = {
  siteSettings: defineLocations({message: 'Global settings are used across the whole ZebraByte website.', tone: 'caution'}),
  navigation: defineLocations({message: 'Navigation is used across the whole ZebraByte website.', tone: 'caution'}),
  page: defineLocations({
    select: {title: 'internalName', path: 'path'},
    resolve: (doc) => ({locations: doc?.path ? [{title: doc.title || doc.path, href: doc.path}] : []}),
  }),
  post: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'Blog article', href: `/blog/${doc.slug}`}, {title: 'Blog', href: '/blog'}] : []}),
  }),
  hubArticle: defineLocations({
    select: {title: 'title.ro', slug: 'slug.current'},
    resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'HUB guide', href: `/hub/${doc.slug}`}, {title: 'HUB', href: '/hub'}] : []}),
  }),
  story: defineLocations({
    select: {title: 'title.ro', slug: 'slug.current'},
    resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'Story', href: `/stories/${doc.slug}`}, {title: 'Stories', href: '/stories'}] : []}),
  }),
  job: defineLocations({
    select: {title: 'title.ro', slug: 'slug.current'},
    resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'Job', href: `/careers/${doc.slug}`}, {title: 'Careers', href: '/careers'}] : []}),
  }),
  legalDocument: defineLocations({
    select: {title: 'title.ro', path: 'path'},
    resolve: (doc) => ({locations: doc?.path ? [{title: doc.title || 'Legal document', href: doc.path}] : []}),
  }),
}

export default defineConfig({
  name: 'zebrabyte',
  title: 'ZebraByte CMS',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('ZebraByte')
          .items([
            S.listItem().title('Site settings').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.listItem().title('Navigation & footer').child(S.document().schemaType('navigation').documentId('mainNavigation')),
            S.divider(),
            S.documentTypeListItem('page').title('Pages'),
            S.documentTypeListItem('post').title('Blog'),
            S.documentTypeListItem('hubArticle').title('HUB & guides'),
            S.documentTypeListItem('story').title('Stories & case studies'),
            S.documentTypeListItem('job').title('Careers'),
            S.documentTypeListItem('legalDocument').title('Legal'),
          ]),
    }),
    presentationTool({
      previewUrl,
      allowOrigins: ['http://localhost:*', 'https://stag.zebrabyte.ro', 'https://www.zebrabyte.ro'],
      resolve: {locations},
    }),
    visionTool({
      defaultApiVersion: '2026-08-01',
      defaultDataset: dataset,
    }),
  ],
  schema: {types: schemaTypes},
  document: {
    newDocumentOptions: (prev) => prev.filter((item) => !['siteSettings', 'navigation'].includes(item.templateId)),
    actions: (prev, context) =>
      ['siteSettings', 'navigation'].includes(context.schemaType)
        ? prev.filter((action) => !['delete', 'duplicate'].includes(action.action || ''))
        : prev,
  },
})
