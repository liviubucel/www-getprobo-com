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
      editLink: {
        baseUrl:
          "https://github.com/liviubucel/www-getprobo-com/edit/zebrabyte-repositioning/src/content/docs/docs/",
      },
      social: [
        {
          icon: "github",
          label: "ZebraByte website source",
          href: "https://github.com/liviubucel/www-getprobo-com",
        },
        {
          icon: "github",
          label: "Upstream Probo project",
          href: "https://github.com/getprobo/probo",
        },
        {
          icon: "discord",
          label: "Upstream Probo Discord",
          href: "https://discord.com/invite/8qfdJYfvpY",
        },
      ],
      sidebar: docsSidebar,
    }),
    generateMarkdown(),
    generateSecurityTxt(),
    mdx(),
    svelte(),
    sitemap({
      filter(page) {
        const pathname = new URL(page).pathname.replace(/\/+$/, "") || "/";

        if (pathname === "/yc") return false;
        if (pathname.includes("/404")) return false;
        if (pathname.startsWith("/whats-next")) return false;
        if (pathname.startsWith("/feedback")) return false;
        if (pathname.startsWith("/welcome")) return false;
        if (pathname.startsWith("/static")) return false;
        if (pathname.startsWith("/orderform")) return false;
        if (pathname.startsWith("/newsletter/rezultat")) return false;

        // Preserved upstream Probo archives remain accessible but are deliberately
        // excluded from ZebraByte's sitemap to avoid duplicate or misleading SEO.
        if (pathname === "/products/compliance-portal") return false;
        if (pathname.startsWith("/blog/")) return false;
        if (pathname.startsWith("/changelog/")) return false;
        if (pathname.startsWith("/hub/")) return false;
        if (
          pathname.startsWith("/stories/") &&
          !pathname.startsWith("/stories/zebrabyte-")
        )
          return false;
        if (
          pathname.startsWith("/careers/") &&
          !pathname.startsWith("/careers/zebrabyte-")
        )
          return false;

        // Redirect/temporary legal routes are not useful sitemap targets.
        if (
          pathname === "/privacy" ||
          pathname === "/cookie-policy" ||
          pathname === "/terms"
        )
          return false;

        if (pathname === "/blog/page/1") return false;
        return true;
      },
      serialize(item) {
        if (item.url === "https://www.zebrabyte.ro") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "weekly"
          );
          item.priority = 1.0;
        } else if (item.url === "https://www.zebrabyte.ro/docs") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "weekly"
          );
          item.priority = 0.9;
        } else if (item.url === "https://www.zebrabyte.ro/hub") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "weekly"
          );
          item.priority = 0.8;
        } else if (
          item.url.includes("/docs/deployment/configuration") ||
          item.url.includes("/docs/deployment/self-hosting")
        ) {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "monthly"
          );
          item.priority = 0.8;
        } else if (item.url.includes("/docs")) {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "monthly"
          );
          item.priority = 0.7;
        } else if (item.url === "https://www.zebrabyte.ro/changelog") {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "weekly"
          );
          item.priority = 0.6;
        } else if (item.url.includes("/stories")) {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "monthly"
          );
          item.priority = 0.7;
        } else if (item.url.includes("/about")) {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "monthly"
          );
          item.priority = 0.6;
        } else {
          item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (
            "monthly"
          );
          item.priority = 0.5;
        }

        return item;
      },
    }),
  ],
});
