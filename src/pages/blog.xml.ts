import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { getBlogHref } from "../lib/blog";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: "ZebraByte Blog",
    description:
      "Analize și ghiduri ZebraByte despre securitate cibernetică, privacy, conformitate și infrastructură securizată.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: getBlogHref(post),
    })),
  });
}
