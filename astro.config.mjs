// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";
import { removeHtmlExtension } from "./vite-plugin-remove-html.mjs";
import { docsSidebar } from "./src/lib/docs-sidebar.ts";
import { generateMarkdown } from "./tools/generateMarkdown";
import { generateSecurityTxt } from "./tools/generateSecurityTxt";

function svelteVirtualCssFallback() {
  const filter = /[?&]svelte&type=style&lang\.css$/;
  /** @param {string} id */
  const load = (id) => {
    if (filter.test(id)) return "";
  };
  return {
    name: "svelte-virtual-css-fallback",
    enforce: "post",
    load,
  };
}

export default defineConfig({
  site: "https://www.zebrabyte.ro",
  compressHTML: true,
  prefetch: false,
  trailingSlash: "never",
  build: {
    format: "file",
  },
  vite: {
    optimizeDeps: {
      exclude: ["svelte-sonner"],
    },
    build: {
      rollupOptions: {
        output: {
          /** @param {string} id */
          manualChunks(id) {
            if (
              id.includes("node_modules/svelte") ||
              id.includes("lib/runes") ||
              id.includes("node_modules/runed")
            ) {
              return "svelte";
            }

            if (id.includes("@splide")) {
              return "splide";
            }

            return null;
          },
        },
      },
    },
    plugins: [svelteVirtualCssFallback(), tailwindcss()],
  },

  integrations: [
    removeHtmlExtension(),
    starlight({
      components: {
        ContentPanel: "./src/components/docs/ContentPanel.astro",
        Footer: "./src/components/docs/Footer.astro",
        Head: "./src/components/docs/Head.astro",
        PageFrame: "./src/components/docs/PageFrame.astro",
        PageTitle: "./src/components/docs/PageTitle.astro",
        Search: "./src/components/docs/Search.astro",
        ThemeSelect: "./src/components/docs/ThemeToggle.astro",
        MobileMenuToggle: "./src/components/docs/MobileMenuToggle.astro",
        Sidebar: "./src/components/docs/Sidebar.astro",
        TwoColumnContent: "./src/components/docs/TwoColumnContent.astro",
        PageSidebar: "./src/components/docs/PageSidebar.astro",
      },
      disable404Route: true,
      title: "ZebraByte Documentation",
      logo: {
        replacesTitle: false,
        src: "./src/assets/zebrabyte-mark.svg",
        alt: "ZebraByte",
      },
      defaultLocale: "root",
      customCss: ["./src/styles/starlight.css"],
      lastUpdated: true,
      pagination: false,
      sidebar: docsSidebar,
    }),
    generateMarkdown(),
    generateSecurityTxt(),
    mdx(),
    svelte(),
    sitemap({
      filter(page) {
        const pathname = new URL(page).pathname.replace(/\/+$/, "") || "/";

        if (pathname.includes("/404")) return false;
        if (pathname.startsWith("/whats-next")) return false;
        if (pathname.startsWith("/feedback")) return false;
        if (pathname.startsWith("/welcome")) return false;
        if (pathname.startsWith("/static")) return false;
        if (pathname.startsWith("/orderform")) return false;
        if (pathname.startsWith("/newsletter/rezultat")) return false;

        const hiddenExact = new Set([
          "/yc",
          "/brand",
          "/download",
          "/careers",
          "/changelog",
          "/products/compliance-portal",
          "/platform-heritage",
          "/platform-customer-archive",
          "/probo-newsletter",
          "/privacy",
          "/cookie-policy",
          "/terms",
        ]);
        if (hiddenExact.has(pathname)) return false;

        // Detailed internal documentation is retained in source, but only the
        // curated ZebraByte documentation landing page is indexed publicly.
        if (pathname.startsWith("/docs/") && pathname !== "/docs") return false;

        if (pathname.startsWith("/blog/")) return false;
        if (pathname.startsWith("/changelog/")) return false;
        if (pathname.startsWith("/hub/")) return false;
        if (pathname.startsWith("/careers/")) return false;

        if (
          pathname.startsWith("/stories/") &&
          !pathname.startsWith("/stories/zebrabyte-")
        )
          return false;

        if (pathname === "/blog/page/1") return false;
        return true;
      },
      serialize(item) {
        if (item.url === "https://www.zebrabyte.ro") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("weekly");
          item.priority = 1.0;
        } else if (item.url === "https://www.zebrabyte.ro/managed-compliance") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("weekly");
          item.priority = 0.9;
        } else if (item.url === "https://www.zebrabyte.ro/cyber-security") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("weekly");
          item.priority = 0.9;
        } else if (item.url === "https://www.zebrabyte.ro/docs") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("monthly");
          item.priority = 0.7;
        } else if (item.url === "https://www.zebrabyte.ro/hub") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("weekly");
          item.priority = 0.8;
        } else if (item.url.includes("/stories")) {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("monthly");
          item.priority = 0.7;
        } else {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ ("monthly");
          item.priority = 0.6;
        }

        return item;
      },
    }),
  ],
});
