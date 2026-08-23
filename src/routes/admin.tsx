import { createFileRoute, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminCheck, adminLogin, adminLogout } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut } from "lucide-react";
import loriLogo from "@/assets/lori-logo.svg";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LORI" }, { name: "robots", content: "noindex,nofollow" }] }),
  loader: () => adminCheck(),
  component: AdminLayout,
});

function AdminLayout() {
  const { authed } = Route.useLoaderData();
  const router = useRouter();
  if (!authed) return <LoginGate onSuccess={() => router.invalidate()} />;
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2 font-bold">
              <img src={loriLogo} alt="LORI" className="h-8 w-8" />
              Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/admin" className="text-muted-foreground hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-medium" }}>Articoli</Link>
              <Link to="/admin/new" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Nuovo</Link>
              <Link to="/admin/consultations" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Consulenze</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">← Torna al sito</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await adminLogout(); router.invalidate(); }}>
              <LogOut className="mr-1.5 h-4 w-4" /> Esci
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8"><Outlet /></main>
    </div>
  );
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Link
        to="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Torna al sito
      </Link>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true); setErr(null);
          try {
            const res = await adminLogin({ data: { email, password: pwd } });
            if (!res.ok) setErr(res.error); else onSuccess();
          } catch (e) {
            // Senza questo ramo un errore della server function lascerebbe il
            // bottone bloccato su "Accesso…" senza dire niente all'utente.
            console.error("[admin] login fallito", e);
            setErr("Errore di rete o backend non raggiungibile. Riprova tra poco.");
          } finally {
            setLoading(false);
          }
        }}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-bold">Area amministrazione</h1>
          <p className="text-sm text-muted-foreground">Accedi con il tuo account admin</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pwd">Password</Label>
          <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? "Accesso…" : "Entra"}</Button>
      </form>
    </div>
  );
}
