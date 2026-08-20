import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { listCategories, listPublishedPosts, getFeaturedPost } from "@/lib/blog.functions";

const BASE_URL = "https://www.lori-crm.it";

type MagazineSearch = { page?: number; cat?: number };

export const Route = createFileRoute("/magazine")({
  validateSearch: (search: Record<string, unknown>): MagazineSearch => {
    const page = Number(search.page);
    const cat = Number(search.cat);
    return {
      page: Number.isInteger(page) && page > 1 ? Math.min(page, 500) : undefined,
      cat: Number.isInteger(cat) && cat > 0 ? cat : undefined,
    };
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1, cat: search.cat ?? null }),
  loader: async ({ deps }) => {
    // Se Supabase non risponde il magazine deve degradare a stato vuoto, non
    // restituire un 500: le sezioni statiche della pagina restano leggibili.
    try {
      const [{ categories }, { posts, total, pageSize }, featured] = await Promise.all([
        listCategories(),
        listPublishedPosts({ data: { page: deps.page, categoryId: deps.cat } }),
        // L'articolo in evidenza ha senso solo sulla prima pagina, senza filtri.
        deps.page === 1 && !deps.cat ? getFeaturedPost() : Promise.resolve({ post: null }),
      ]);
      return { categories, posts, total, pageSize, featured: featured.post, page: deps.page, failed: false };
    } catch (err) {
      console.error("[magazine] caricamento fallito", err);
      return { categories: [], posts: [], total: 0, pageSize: 9, featured: null, page: deps.page, failed: true };
    }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page ?? 1;
    const canonical = page > 1 ? `${BASE_URL}/magazine?page=${page}` : `${BASE_URL}/magazine`;
    return {
      meta: [
        { title: "Magazine LORI — Insights su Lead Generation e LinkedIn" },
        { name: "description", content: "Guide, casi studio e approfondimenti su lead generation, CRM e crescita su LinkedIn. Articoli pratici dal team di LORI." },
        { property: "og:title", content: "Magazine LORI — Insights su Lead Generation" },
        { property: "og:description", content: "Guide e casi studio per fare lead generation seria su LinkedIn." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Magazine LORI — Insights su Lead Generation" },
        { name: "twitter:description", content: "Guide e casi studio per fare lead generation seria su LinkedIn." },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Magazine LORI",
            url: `${BASE_URL}/magazine`,
            inLanguage: "it-IT",
            publisher: { "@id": `${BASE_URL}/#organization` },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Magazine", item: `${BASE_URL}/magazine` },
            ],
          }),
        },
      ],
    };
  },
  component: MagazinePage,
});

function MagazinePage() {
  const { categories, posts, featured, total, pageSize, page, failed } = Route.useLoaderData();
  const { cat } = Route.useSearch();
  const [search, setSearch] = useState("");
  const filtered = posts.filter((p: any) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fmt = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[var(--dark-bg)] py-20 text-white md:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_30%,oklch(0.62_0.21_295/0.4),transparent_50%)]" />
          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Blog</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">Magazine &amp; Insights</h1>
            <p className="mx-auto mt-5 max-w-2xl text-white/70 md:text-lg">
              Il CRM operativo per rendere la tua Lead Generation un processo chiaro, tracciabile e replicabile.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cerca articoli" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/magazine"
                search={{}}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!cat ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"}`}
              >
                Tutti
              </Link>
              {categories.map((c: any) => (
                <Link
                  key={c.id}
                  to="/magazine"
                  search={{ cat: c.id }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {failed && (
            <p className="mt-10 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Gli articoli non sono raggiungibili in questo momento. Riprova tra qualche minuto.
            </p>
          )}

          {featured && (
            <article className="mt-10 grid gap-8 rounded-3xl border border-border bg-card p-6 md:grid-cols-2 md:p-8">
              {featured.img_url ? (
                <img src={featured.img_url} alt={featured.title} className="aspect-[4/3] w-full rounded-2xl object-cover" loading="lazy" />
              ) : (
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary-soft via-background to-secondary" />
              )}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{fmt(featured.published_at ?? featured.created_at)}</span>
                  <span className="rounded-full bg-seo-accent-soft px-2.5 py-0.5 font-medium text-seo-accent">{(featured as any).post_categories?.name}</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{featured.title}</h2>
                <p className="mt-3 line-clamp-3 text-muted-foreground">{featured.opening}</p>
                <Link to="/blog/$slug" params={{ slug: featured.url }} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  Leggi articolo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          )}

          <h3 className="mt-14 text-2xl font-bold tracking-tight">Tutti gli articoli</h3>
          {filtered.length === 0 && !failed && (
            <p className="mt-6 text-muted-foreground">
              {search ? "Nessun articolo corrisponde alla ricerca." : "Nessun articolo pubblicato ancora. Torna presto!"}
            </p>
          )}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.filter((p: any) => !featured || p.id !== featured.id).map((a: any) => (
              <Link key={a.id} to="/blog/$slug" params={{ slug: a.url }} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                {a.img_url ? (
                  <img src={a.img_url} alt={a.title} className="aspect-[16/10] w-full rounded-xl object-cover" loading="lazy" />
                ) : (
                  <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-secondary to-primary-soft" />
                )}
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{fmt(a.published_at ?? a.created_at)}</span>
                  <span className="rounded-full bg-seo-accent-soft px-2.5 py-0.5 font-medium text-seo-accent">{a.post_categories?.name}</span>
                </div>
                <h4 className="mt-2 font-semibold tracking-tight group-hover:text-primary">{a.title}</h4>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{a.opening}</p>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginazione articoli">
              <Link
                to="/magazine"
                search={(prev) => ({ ...prev, page: page - 1 > 1 ? page - 1 : undefined })}
                disabled={page <= 1}
                className={`inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-secondary"}`}
              >
                <ArrowLeft className="h-4 w-4" /> Precedente
              </Link>
              <span className="px-3 text-sm text-muted-foreground">
                Pagina {page} di {totalPages}
              </span>
              <Link
                to="/magazine"
                search={(prev) => ({ ...prev, page: page + 1 })}
                disabled={page >= totalPages}
                className={`inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-secondary"}`}
              >
                Successiva <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
