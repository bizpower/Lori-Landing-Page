import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listPublishedPosts } from "@/lib/blog.functions";

const BASE_URL = "https://www.lori-crm.it";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/magazine", changefreq: "daily", priority: "0.9" },
        ];

        let postEntries: { path: string; lastmod?: string; priority: string; changefreq: string }[] = [];
        try {
          const { posts } = await listPublishedPosts({ data: {} });
          postEntries = (posts ?? []).map((p: any) => ({
            path: `/blog/${p.url}`,
            lastmod: (p.published_at ?? p.created_at) ? new Date(p.published_at ?? p.created_at).toISOString() : undefined,
            changefreq: "monthly",
            priority: "0.7",
          }));
        } catch {
          postEntries = [];
        }

        const urls = [...staticEntries, ...postEntries].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            "lastmod" in e && e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            `    <changefreq>${e.changefreq}</changefreq>`,
            `    <priority>${e.priority}</priority>`,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
