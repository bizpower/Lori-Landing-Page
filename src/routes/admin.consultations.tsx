import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminCheck, adminListConsultations, adminUpdateConsultation, adminDeleteConsultation } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Trash2, Phone, Mail, Building2, CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/admin/consultations")({
  loader: async () => {
    const { authed } = await adminCheck();
    if (!authed) return { items: [] };
    return adminListConsultations().catch(() => ({ items: [] }));
  },
  component: ConsultationsPage,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Nuova", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confermata", cls: "bg-emerald-100 text-emerald-700" },
  done: { label: "Completata", cls: "bg-slate-200 text-slate-700" },
  cancelled: { label: "Annullata", cls: "bg-rose-100 text-rose-700" },
};

function ConsultationsPage() {
  const { items } = Route.useLoaderData() as { items: any[] };
  const router = useRouter();
  const upcoming = items.filter((i) => new Date(i.slot_at) >= new Date());
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarCheck className="h-6 w-6 text-primary" /> Consulenze</h1>
          <p className="text-sm text-muted-foreground">{items.length} totali · {upcoming.length} in arrivo</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">Nessuna richiesta di consulenza per ora.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((c) => {
            const s = STATUS[c.status] ?? STATUS.new;
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{c.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-primary">
                      {new Date(c.slot_at).toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone className="h-3.5 w-3.5" /> {c.phone}</a>
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-foreground"><Mail className="h-3.5 w-3.5" /> {c.email}</a>
                      {c.company && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {c.company}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={c.status}
                      onChange={async (e) => {
                        await adminUpdateConsultation({ data: { id: c.id, status: e.target.value as any } });
                        router.invalidate();
                      }}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      if (!confirm(`Eliminare la richiesta di ${c.name}?`)) return;
                      await adminDeleteConsultation({ data: { id: c.id } });
                      router.invalidate();
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
