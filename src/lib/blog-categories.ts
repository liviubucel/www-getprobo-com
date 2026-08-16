import type { CollectionEntry } from "astro:content";

export const blogCategories = [
  {
    slug: "securitate-cibernetica",
    label: "Securitate cibernetică",
    description:
      "Ghiduri și analize despre protecția organizațiilor, identitate, phishing, ransomware și reducerea riscului cibernetic.",
  },
  {
    slug: "brese-incidente",
    label: "Breșe & incidente",
    description:
      "Analize de incidente, vulnerabilități, scurgeri de date și lecții practice desprinse din evenimente de securitate.",
  },
  {
    slug: "gdpr-conformitate",
    label: "GDPR & conformitate",
    description:
      "GDPR, NIS2, cerințe de conformitate, privacy și măsuri tehnice care susțin guvernanța și auditul.",
  },
  {
    slug: "website-infrastructura",
    label: "Website & infrastructură",
    description:
      "WordPress, hosting, SSL/TLS, DNS, cloud și practici pentru site-uri și infrastructură operate în siguranță.",
  },
  {
    slug: "ai-tehnologie",
    label: "AI & tehnologie",
    description:
      "Inteligență artificială, tehnologii emergente și modul în care schimbă securitatea, riscul și operațiunile digitale.",
  },
  {
    slug: "accesibilitate-digitala",
    label: "Accesibilitate digitală",
    description:
      "Accesibilitate web, cerințe pentru servicii digitale și practici pentru experiențe utilizabile de cât mai multe persoane.",
  },
] as const;

export type BlogCategory = (typeof blogCategories)[number];
export type BlogCategorySlug = BlogCategory["slug"];

const fallbackCategory = blogCategories[0];

const categoryRules: Array<{ slug: BlogCategorySlug; pattern: RegExp }> = [
  {
    slug: "accesibilitate-digitala",
    pattern:
      /accesibil|dizabil|wcag|european accessibility act|legea 232|directiva ue 2019\/882|servicii digitale accesibile/i,
  },
  {
    slug: "ai-tehnologie",
    pattern:
      /inteligen[țt]a artificial|\bai\b|\bllm\b|deepfake|machine learning|artificial intelligence|prompt injection|data poisoning/i,
  },
  {
    slug: "brese-incidente",
    pattern:
      /bre[șs][aăe]|incident|scurgere|leak|ransomware|phishing|scam|fraud|vulnerabil|\bcve[- ]?\d|zero[- ]day|malware|compromis|atac cibernetic|cyberattack/i,
  },
  {
    slug: "gdpr-conformitate",
    pattern:
      /\bgdpr\b|\bnis2\b|conformitate|compliance|privacy|confiden[țt]ial|anspdcp|protec[țt]ia datelor|data protection|iso[ /-]?27001|soc ?2|audit|regulament|directiv[ăa]|obliga[țt]i/i,
  },
  {
    slug: "website-infrastructura",
    pattern:
      /wordpress|website|site web|web design|responsive|hosting|cloud|server|infrastructur|certificat ssl|\bssl\b|\btls\b|\bdns\b|domain|domeniu|cdn|firewall|\bwaf\b/i,
  },
];

function searchableText(post: CollectionEntry<"blog">): string {
  return [
    post.data.title,
    post.data.excerpt,
    ...(post.data.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getBlogCategory(post: CollectionEntry<"blog">): BlogCategory {
  const text = searchableText(post);
  for (const rule of categoryRules) {
    if (rule.pattern.test(text)) {
      return blogCategories.find((category) => category.slug === rule.slug) ?? fallbackCategory;
    }
  }
  return fallbackCategory;
}

export function getBlogCategoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find((category) => category.slug === slug);
}

export function getBlogCategoryHref(category: BlogCategory | BlogCategorySlug): string {
  const slug = typeof category === "string" ? category : category.slug;
  return `/blog/categorie/${slug}`;
}
