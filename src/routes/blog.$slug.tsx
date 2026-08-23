import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPostBySlug } from "@/lib/blog.functions";
import { ArrowLeft, ArrowRight, Linkedin, Twitter, Facebook, Link2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArticleConverter } from "@/components/article-converter";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { post, related } = await getPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post, related };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.post) return { meta: [{ title: "Articolo non trovato — LORI Magazine" }, { name: "robots", content: "noindex,follow" }] };
    const p = loaderData.post as any;
    const desc = (p.meta_description || p.opening || "").slice(0, 160);
    const url = `https://www.lori-crm.it/blog/${params.slug}`;
    const date = new Date(p.published_at ?? p.created_at).toISOString();
    const articleLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: desc,
      image: p.img_url ? [p.img_url] : undefined,
      datePublished: date,
      dateModified: date,
      inLanguage: "it-IT",
      author: { "@type": "Organization", name: p.signature || "LORI Team" },
      publisher: {
        "@type": "Organization",
        name: "LORI CRM",
        logo: { "@type": "ImageObject", url: "https://www.lori-crm.it/favicon.svg" },
      },
      articleSection: p.post_categories?.name,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    };
    // og:image deve essere assoluto: le copertine servite dal progetto hanno un
    // percorso relativo, che i crawler dei social non sanno risolvere.
    const ogImage = p.img_url
      ? (/^https?:\/\//i.test(p.img_url) ? p.img_url : `https://www.lori-crm.it${p.img_url}`)
      : null;
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.lori-crm.it/" },
        { "@type": "ListItem", position: 2, name: "Magazine", item: "https://www.lori-crm.it/magazine" },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    };
    return {
      meta: [
        { title: `${p.title} | LORI Magazine` },
        { name: "description", content: desc },
        { property: "og:title", content: p.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: date },
        { property: "article:modified_time", content: date },
        ...(ogImage ? [{ property: "og:image", content: ogImage }, { name: "twitter:image", content: ogImage }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: p.title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(articleLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      ],
    };
  },
  component: PostPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Articolo non trovato</h1>
        <Link to="/magazine" className="mt-4 inline-block text-primary hover:underline">← Torna al magazine</Link>
      </div>
    </div>
  ),
});

function PostPage() {
  const { post, related } = Route.useLoaderData() as any;
  const date = new Date(post.published_at ?? post.created_at);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState<{ id: string; text: string; level: 2 | 3 }[]>([]);
  const [coverFailed, setCoverFailed] = useState(false);
  const readingMinutes = useMemo(() => {
    const text = (post.body || "").replace(/<[^>]+>/g, " ");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }, [post.body]);

  // Build TOC + slug-ify heading ids after render
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const items: { id: string; text: string; level: 2 | 3 }[] = [];
    const seen = new Set<string>();
    root.querySelectorAll("h2, h3").forEach((h) => {
      const text = (h.textContent || "").trim();
      if (!text) return;
      let id = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
      let unique = id, n = 1;
      while (seen.has(unique)) unique = `${id}-${++n}`;
      seen.add(unique);
      h.id = unique;
      items.push({ id: unique, text, level: h.tagName === "H2" ? 2 : 3 });
    });
    setToc(items);
  }, [post.body]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current; if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const height = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(window.scrollY - top, 0), Math.max(height, 1));
      setProgress(Math.min(100, (scrolled / Math.max(height, 1)) * 100));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Detect FAQ block → JSON-LD FAQPage
  const faqEntities = useMemo(() => {
    const html: string = post.body || "";
    const faqIdx = html.search(/<h2[^>]*>\s*(domande frequenti|faq|frequently asked questions)/i);
    if (faqIdx === -1) return [];
    const slice = html.slice(faqIdx);
    const pairs: { q: string; a: string }[] = [];
    const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(slice))) {
      pairs.push({
        q: m[1].replace(/<[^>]+>/g, "").trim(),
        a: m[2].replace(/<[^>]+>/g, "").trim(),
      });
    }
    return pairs;
  }, [post.body]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://www.lori-crm.it/blog/${post.url}`;
  const shareText = encodeURIComponent(post.title);

  const faqLd = faqEntities.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntities.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="reading-progress" style={{ width: `${progress}%` }} aria-hidden />
      <SiteHeader />
      <main>
        {post.img_url && !coverFailed ? (
          <div className="relative h-64 w-full overflow-hidden md:h-[480px]">
            <img
              src={post.img_url}
              alt={post.title}
              className="h-full w-full object-cover"
              onError={() => setCoverFailed(true)}
            />
          </div>
        ) : (
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-background to-seo-accent/20 md:h-64" aria-hidden />
        )}
        <article ref={articleRef} className="mx-auto max-w-3xl px-6 py-14">
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/magazine" className="hover:text-foreground">Magazine</Link>
            <span>/</span>
            <span className="line-clamp-1 text-foreground">{post.title}</span>
          </nav>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-seo-accent-soft px-2.5 py-0.5 font-medium text-seo-accent">{post.post_categories?.name}</span>
            <span className="text-muted-foreground">{date.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
            <span className="text-muted-foreground">· {readingMinutes} min di lettura</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.opening}</p>

          {toc.length >= 3 && (
            <nav aria-label="Indice" className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">In questo articolo</div>
              <ol className="space-y-1">
                {toc.map((t) => (
                  <li key={t.id} className={t.level === 3 ? "ml-4" : ""}>
                    <a href={`#${t.id}`} className="text-foreground/80 hover:text-primary">{t.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {post.url === "convertire-pdf-in-excel" && <ArticleConverter />}

          <div className="prose prose-slate mt-10 max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-blockquote:text-foreground/80 prose-h1:text-3xl prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-img:rounded-xl" dangerouslySetInnerHTML={{ __html: post.body }} />
          <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">— {post.signature}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Condividi:</span>
            <a target="_blank" rel="noopener" aria-label="LinkedIn"
               href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
               className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-primary hover:text-primary">
              <Linkedin className="h-4 w-4" />
            </a>
            <a target="_blank" rel="noopener" aria-label="X / Twitter"
               href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`}
               className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-primary hover:text-primary">
              <Twitter className="h-4 w-4" />
            </a>
            <a target="_blank" rel="noopener" aria-label="Facebook"
               href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
               className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-primary hover:text-primary">
              <Facebook className="h-4 w-4" />
            </a>
            <button type="button" aria-label="Copia link"
              onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success("Link copiato"); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-primary hover:text-primary">
              <Link2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-12 rounded-2xl border border-primary/30 bg-primary-soft/40 p-6 text-center md:p-8">
            <h3 className="text-xl font-bold md:text-2xl">Lori CRM - più di un excel</h3>
            <p className="mt-2 text-muted-foreground">Inizia gratis con LORI: il CRM operativo per la tua lead generation.</p>
            <a
              href="https://app.lori-crm.it"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            >
              Registrati gratuitamente <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-20">
            <h2 className="text-2xl font-bold tracking-tight">Continua a leggere</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a: any) => (
                <Link key={a.id} to="/blog/$slug" params={{ slug: a.url }} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40">
                  {a.img_url && <img src={a.img_url} alt={a.title} className="aspect-[16/10] w-full rounded-xl object-cover" loading="lazy" />}
                  <p className="mt-3 text-xs text-primary">{a.post_categories?.name}</p>
                  <h4 className="mt-1 font-semibold group-hover:text-primary">{a.title}</h4>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/magazine" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Tutti gli articoli
              </Link>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
    </div>
  );
}
