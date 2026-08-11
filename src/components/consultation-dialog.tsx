import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listAvailableSlots, bookConsultation, subscribeLaunchNotification } from "@/lib/blog.functions";
import { CalendarCheck, CheckCircle2, Loader2, BellRing } from "lucide-react";

type Mode = "consultation" | "notify";

export function ConsultationDialog({
  open,
  onOpenChange,
  mode = "consultation",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: Mode;
}) {
  const isNotify = mode === "notify";
  const [slots, setSlots] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDone(false); setError(null); setSelected(null); setSlots(null);
    if (isNotify) return;
    listAvailableSlots().then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [open, isNotify]);

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    (slots ?? []).forEach((iso) => {
      const d = new Date(iso);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(iso);
    });
    return Array.from(map.entries()).slice(0, 7);
  }, [slots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    let res: { ok: boolean; error?: string };
    if (isNotify) {
      res = await subscribeLaunchNotification({ data: { name: form.name, email: form.email, phone: form.phone, company: form.company } });
    } else {
      if (!selected) { setError("Seleziona uno slot disponibile."); setLoading(false); return; }
      res = await bookConsultation({ data: { ...form, slot_at: selected } });
    }
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Errore"); return; }
    setDone(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="mt-4 text-xl font-bold">{isNotify ? "Sei in lista!" : "Richiesta inviata!"}</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {isNotify
                ? "Ti avviseremo via email non appena l'app LORI sarà disponibile su App Store."
                : <>Ti abbiamo prenotato per <strong>{new Date(selected!).toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}</strong>. Ti contatteremo al numero indicato per confermare.</>}
            </p>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Chiudi</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isNotify ? <BellRing className="h-5 w-5 text-primary" /> : <CalendarCheck className="h-5 w-5 text-primary" />}
                {isNotify ? "Avvisami al lancio" : "Prenota una consulenza"}
              </DialogTitle>
              <DialogDescription>
                {isNotify
                  ? "Lascia i tuoi contatti: ti avviseremo appena LORI sarà su App Store."
                  : "Scegli uno slot disponibile (Lun–Ven, 9:00–18:00) e lascia i tuoi contatti."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-5">
              {!isNotify && <div>
                <Label className="mb-2 block">Slot disponibili</Label>
                {slots === null ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carico gli orari…</div>
                ) : grouped.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">Nessuno slot disponibile a breve.</p>
                ) : (
                  <div className="space-y-3">
                    {grouped.map(([day, times]) => (
                      <div key={day}>
                        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {new Date(day).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {times.map((iso) => {
                            const t = new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
                            const active = selected === iso;
                            return (
                              <button key={iso} type="button" onClick={() => setSelected(iso)}
                                className={`rounded-lg border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/60"}`}>
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Nome e cognome *</Label>
                  <Input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Telefono {isNotify ? "" : "*"}</Label>
                  <Input id="c-phone" type="tel" required={!isNotify} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+39 ..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email *</Label>
                  <Input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-company">Azienda</Label>
                  <Input id="c-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={loading || (!isNotify && !selected)} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio…</> : isNotify ? "Avvisami al lancio" : "Conferma prenotazione"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
