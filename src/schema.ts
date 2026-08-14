import { defineCollection, z } from "astro:content";
import { frameworks } from "./content/frameworks.ts";

export const StorySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  impacts: z
    .array(
      z.object({
        title: z.string(),
        label: z.string(),
      }),
    )
    .min(1),
  // Legacy/upstream Probo stories use full photographic assets. ZebraByte stories
  // may intentionally use the native generated visual fallback instead.
  image: z.string().optional(),
  previewImage: z.string().optional(),
  trailer: z.string().optional(),
  framework: z.enum(frameworks.map((f) => f.label) as any).optional(),
  logo: z.string().optional(),
  logoHeight: z.number().optional(),
  logoLightBg: z.string().optional(),
  invertLogo: z.boolean().optional(),
  logoPosition: z.enum(["top-left", "bottom-left"]).optional(),
  ogImage: z.string().optional(),
  company: z.object({
    name: z.string(),
    url: z.string().url().optional(),
    industry: z.string(),
    type: z.string(),
    about: z.string(),
  }),
});

export type StoryData = z.infer<typeof StorySchema>;
