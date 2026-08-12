import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminCheck, adminListPosts, adminDeletePost } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const { authed } = await adminCheck();
    if (!authed) return { posts: [] };
    return adminListPosts().catch(() => ({ posts: [] }));
  },
  component: AdminPosts,
});

function AdminPosts() {
  const { posts } = Route.useLoaderData();
  const router = useRouter();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Articoli</h1>
          <p className="text-sm text-muted-foreground">{posts.length} totali</p>
        </div>
        <Button asChild><Link to="/admin/new"><Plus className="mr-1.5 h-4 w-4" /> Nuovo articolo</Link></Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Titolo</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Stato</th><th className="px-4 py-3">Data</th><th className="px-4 py-3 text-right">Azioni</th></tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nessun articolo. Crea il primo →</td></tr>
            )}
            {posts.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.post_categories?.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {p.status === 1 ? "Pubblicato" : "Bozza"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("it-IT")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === 1 && (
                      <Button asChild variant="ghost" size="icon"><a href={`/blog/${p.url}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                    )}
                    <Button asChild variant="ghost" size="icon"><Link to="/admin/edit/$id" params={{ id: String(p.id) }}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      if (!confirm(`Eliminare "${p.title}"?`)) return;
                      await adminDeletePost({ data: { id: p.id } });
                      router.invalidate();
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
