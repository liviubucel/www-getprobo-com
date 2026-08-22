import fs from "node:fs";

export type CmsLocale = "ro" | "en";

type JsonObject = Record<string, any>;

const snapshotUrl = new URL("../../../.sanity-cache/site-content.json", import.meta.url);
let cachedSnapshot: JsonObject | null | undefined;

function normalizePath(value: string): string {
  if (!value || value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function readSnapshot(): JsonObject | null {
  if (cachedSnapshot !== undefined) return cachedSnapshot;
  try {
    cachedSnapshot = JSON.parse(fs.readFileSync(snapshotUrl, "utf8"));
  } catch {
    cachedSnapshot = null;
  }
  return cachedSnapshot;
}

export function getCmsSnapshot(): JsonObject | null {
  return readSnapshot();
}

export function localize<T = string>(value: any, locale: CmsLocale, fallback: T | string = ""): T | string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "object" || Array.isArray(value)) return value as T;
  return (value[locale] ?? value.ro ?? value.en ?? fallback) as T;
}

export function toPublicHref(href: string | undefined, locale: CmsLocale): string {
  const value = String(href ?? "").trim();
  if (!value || locale === "ro" || !value.startsWith("/") || value.startsWith("//")) return value;
  if (value === "/") return "/en";
  if (value === "/en" || value.startsWith("/en/")) return value;
  return `/en${value}`;
}

export function cmsImageUrl(image: any): string | undefined {
  const snapshot = readSnapshot();
  const projectId = snapshot?.source?.projectId;
  const dataset = snapshot?.source?.dataset;
  const ref = image?.asset?._ref;
  if (!projectId || !dataset || typeof ref !== "string" || !ref.startsWith("image-")) return undefined;

  const match = ref.match(/^image-(.+)-(\d+x\d+)-([a-z0-9]+)$/i);
  if (!match) return undefined;
  const [, id, dimensions, format] = match;
  return `https://cdn.sanity.io/images/${encodeURIComponent(projectId)}/${encodeURIComponent(dataset)}/${id}-${dimensions}.${format}?auto=format`;
}

export function getCmsSiteSettings(locale: CmsLocale): JsonObject | null {
  const settings = readSnapshot()?.content?.siteSettings?.[0];
  if (!settings) return null;
  const localizeLink = (link: any) =>
    link
      ? {
          ...link,
          label: localize(link.label, locale),
          href: toPublicHref(link.href, locale),
        }
      : undefined;

  return {
    ...settings,
    tagline: localize(settings.tagline, locale),
    footerCopyright: localize(settings.footerCopyright, locale),
    footerLegalLine: localize(settings.footerLegalLine, locale),
    headerPrimaryCta: localizeLink(settings.headerPrimaryCta),
    mobileSecondaryCta: localizeLink(settings.mobileSecondaryCta),
    socialLinks: (settings.socialLinks ?? []).map(localizeLink),
    announcement: settings.announcement
      ? {
          ...settings.announcement,
          message: localize(settings.announcement.message, locale),
          link: localizeLink(settings.announcement.link),
        }
      : undefined,
  };
}

const allowedMenuIcons = new Set([
  "article",
  "book-open-text",
  "briefcase",
  "clock-counter-clockwise",
  "code",
  "compass",
  "handshake",
  "heart",
  "magnifying-glass",
  "monitor",
  "notepad",
  "paint-brush",
  "quotes",
  "shield-check",
  "sparkle",
  "terminal-window",
  "users-three",
]);

export function getCmsNavigation(locale: CmsLocale): JsonObject | null {
  const navigation = readSnapshot()?.content?.navigation?.[0];
  if (!navigation) return null;

  const groups = (navigation.header ?? []).map((group: any) => ({
    label: localize(group.label, locale),
    href: group.href ? toPublicHref(group.href, locale) : undefined,
    showLabel: group.showLabel !== false,
    items: (group.items ?? []).map((item: any) => ({
      label: localize(item.label, locale),
      description: localize(item.description, locale),
      href: toPublicHref(item.href, locale),
      icon: allowedMenuIcons.has(item.icon) ? item.icon : "compass",
    })),
    feature: {
      eyebrow: localize(group.feature?.eyebrow, locale),
      title: localize(group.feature?.title, locale),
      href: toPublicHref(group.feature?.href, locale),
      asset: cmsImageUrl(group.feature?.image) ?? group.feature?.legacyAssetPath ?? "/og-zebrabyte.svg",
      alt: localize(group.feature?.alt, locale),
      variant: ["product", "story", "guide"].includes(group.feature?.variant)
        ? group.feature.variant
        : "product",
    },
  }));

  const footerGroups = (navigation.footerGroups ?? []).map((group: any) => ({
    label: localize(group.title, locale),
    items: (group.items ?? []).map((item: any) => ({
      label: localize(item.label, locale),
      href: toPublicHref(item.href, locale),
      newTab: Boolean(item.newTab),
    })),
  }));

  return {
    groups,
    footerGroups,
    footerLegal: (navigation.footerLegal ?? []).map((item: any) => ({
      label: localize(item.label, locale),
      href: toPublicHref(item.href, locale),
      newTab: Boolean(item.newTab),
    })),
  };
}

export function getCmsManagedDocuments(): JsonObject[] {
  const content = readSnapshot()?.content;
  if (!content) return [];

  return [
    ...(content.pages ?? []).map((document: any) => ({...document, _cmsPath: normalizePath(document.path)})),
    ...(content.legalDocuments ?? []).map((document: any) => ({...document, _cmsPath: normalizePath(document.path)})),
    ...(content.hubArticles ?? []).map((document: any) => ({...document, _cmsPath: `/hub/${document.slug}`})),
    ...(content.stories ?? []).map((document: any) => ({...document, _cmsPath: `/stories/${document.slug}`})),
    ...(content.jobs ?? []).map((document: any) => ({...document, _cmsPath: `/careers/${document.slug}`})),
  ];
}

export function getCmsDocumentByPath(pathname: string): JsonObject | null {
  const normalized = normalizePath(pathname.replace(/^\/en(?=\/|$)/, "") || "/");
  return getCmsManagedDocuments().find((document) => document._cmsPath === normalized) ?? null;
}

export function getCmsSeo(document: any, locale: CmsLocale) {
  const seo = document?.seo ?? {};
  return {
    title: localize(seo.title, locale, localize(document?.title, locale, document?.internalName ?? "ZebraByte")),
    description: localize(seo.description, locale, localize(document?.description, locale, "")),
    noIndex: Boolean(seo.noIndex),
    ogImage: cmsImageUrl(seo.image),
    structuredDataType: seo.structuredDataType,
    canonicalPath: seo.canonicalPath || document?._cmsPath || document?.path,
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHref(value: unknown, locale: CmsLocale): string | null {
  const href = String(value ?? "").trim();
  if (!href) return null;
  if (href.startsWith("#") && /^#[a-z0-9-]+$/.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return toPublicHref(href, locale);
  try {
    const url = new URL(href);
    return ["https:", "mailto:", "tel:"].includes(url.protocol) ? href : null;
  } catch {
    return null;
  }
}

function renderSpan(span: any, markDefs: any[], locale: CmsLocale): string {
  let output = escapeHtml(span?.text ?? "");
  for (const mark of span?.marks ?? []) {
    if (mark === "strong") output = `<strong>${output}</strong>`;
    else if (mark === "em") output = `<em>${output}</em>`;
    else if (mark === "code") output = `<code>${output}</code>`;
    else {
      const definition = markDefs.find((item) => item?._key === mark && item?._type === "link");
      const href = safeHref(definition?.href, locale);
      if (href) {
        const external = href.startsWith("https://");
        output = `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer"' : ""}>${output}</a>`;
      }
    }
  }
  return output;
}

export function portableTextToHtml(blocks: any, locale: CmsLocale): string {
  if (!Array.isArray(blocks)) return "";
  let html = "";
  let openList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (openList) html += `</${openList}>`;
    openList = null;
  };

  for (const block of blocks) {
    if (block?._type === "image") {
      closeList();
      const src = cmsImageUrl(block);
      if (!src) continue;
      html += `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt ?? "")}" loading="lazy" decoding="async">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
      continue;
    }
    if (block?._type !== "block") continue;

    const body = (block.children ?? []).map((span: any) => renderSpan(span, block.markDefs ?? [], locale)).join("");
    if (block.listItem) {
      const list = block.listItem === "number" ? "ol" : "ul";
      if (openList !== list) {
        closeList();
        openList = list;
        html += `<${list}>`;
      }
      html += `<li>${body}</li>`;
      continue;
    }

    closeList();
    const tag = ["h2", "h3", "h4", "blockquote"].includes(block.style) ? block.style : "p";
    html += `<${tag}>${body}</${tag}>`;
  }
  closeList();
  return html;
}
