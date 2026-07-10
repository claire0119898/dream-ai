import type { MetadataRoute } from "next";
import { coreDreamKeywords } from "../data/dreamDictionary";

const siteUrl = "https://dream-ai.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date() },
    { url: `${siteUrl}/dictionary`, lastModified: new Date() },
    { url: `${siteUrl}/today`, lastModified: new Date() },
    { url: `${siteUrl}/about`, lastModified: new Date() },
    { url: `${siteUrl}/privacy`, lastModified: new Date() },
    { url: `${siteUrl}/terms`, lastModified: new Date() },
  ];

  const dreamPages: MetadataRoute.Sitemap = coreDreamKeywords.map((item) => ({
    url: `${siteUrl}/dream/${encodeURIComponent(item.keyword)}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...dreamPages];
}
