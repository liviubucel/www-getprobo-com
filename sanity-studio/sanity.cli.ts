import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'yj548pxh',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // This Studio is intentionally an independent app nested inside the Astro
  // repository. It does not use TypeScript path aliases, so disable Vite's
  // parent tsconfig path discovery; otherwise the isolated Studio build can
  // attempt to resolve the website root's `astro/tsconfigs/strict` without the
  // website dependency tree being installed.
  vite: {
    resolve: {
      tsconfigPaths: false,
    },
  },
})
