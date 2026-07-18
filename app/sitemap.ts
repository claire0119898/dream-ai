import type { MetadataRoute } from "next";
import { coreDreamKeywords } from "../data/dreamDictionary";
import { absoluteUrl, DICTIONARY_UPDATED_AT, dreamPath } from "../lib/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${DICTIONARY_UPDATED_AT}T00:00:00.000Z`);
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/dictionary"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/today"), lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/contact"), lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
  const dreamPages: MetadataRoute.Sitemap = coreDreamKeywords.map((item) => ({
    url: absoluteUrl(dreamPath(item.keyword)),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));
  return [...staticPages, ...dreamPages];
}
