import type { CollectionEntry } from "astro:content";

export function getBlogSlug(post: CollectionEntry<"blog">): string {
  const explicitSlug = post.data.slug?.trim();
  if (explicitSlug) return explicitSlug;

  const fallback = post.id.split("/").filter(Boolean).at(-1);
  if (!fallback) throw new Error(`Unable to derive public blog slug for content entry: ${post.id}`);
  return fallback.replace(/\.mdx?$/i, "");
}

export function getBlogHref(post: CollectionEntry<"blog">): string {
  return `/blog/${encodeURIComponent(getBlogSlug(post))}`;
}
