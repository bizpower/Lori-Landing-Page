import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listPublishedPosts } from "@/lib/blog.functions";

const BASE_URL = "https://www.lori-crm.it";

// Limite di sicurezza: 500 pagine da 9 articoli coprono ampiamente il magazine.
const MAX_SITEMAP_PAGES = 500;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/magazine", changefreq: "daily", priority: "0.9" },
        ];

        // `listPublishedPosts` è paginato: senza scorrere tutte le pagine la
        // sitemap conterrebbe solo gli articoli più recenti.
        let postEntries: { path: string; lastmod?: string; priority: string; changefreq: string }[] = [];
        try {
          for (let page = 1; page <= MAX_SITEMAP_PAGES; page++) {
            const { posts, total, pageSize } = await listPublishedPosts({ data: { page } });
            postEntries.push(
              ...(posts ?? []).map((p: any) => ({
                path: `/blog/${p.url}`,
                lastmod: (p.published_at ?? p.created_at) ? new Date(p.published_at ?? p.created_at).toISOString() : undefined,
                changefreq: "monthly",
                priority: "0.7",
              })),
            );
            if (posts.length === 0 || page * pageSize >= total) break;
          }
        } catch (err) {
          console.error("[sitemap] elenco articoli non disponibile", err);
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
