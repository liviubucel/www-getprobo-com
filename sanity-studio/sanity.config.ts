import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'yj548pxh'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'zebrabyte',
  title: 'ZebraByte CMS',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    visionTool({
      defaultApiVersion: '2026-08-01',
      defaultDataset: dataset,
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
