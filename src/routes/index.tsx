import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConsultationDialog } from "@/components/consultation-dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Tag, Upload, BarChart3, Users,
  ArrowRight, Check, X, Star, Zap, Target, Repeat,
  Search, Bell, Inbox,
  MessageSquare, Plus, ChevronDown,
  Sparkles, TrendingUp, Heart, Smartphone, Palette, Headphones, Wrench, Share2,
} from "lucide-react";
import loriLogo from "@/assets/lori-logo.svg";
import { useEffect, useRef, useState } from "react";

/* ──────── shared building blocks for the mockups ──────── */
function MockChrome({ children, breadcrumb }: { children: React.ReactNode; breadcrumb: string[] }) {
  return (
    <div className="relative">
      {/* Soft ambient glow behind the card */}
      <div className="pointer-events-none absolute -inset-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_50%_40%,oklch(0.62_0.21_295/0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -inset-1 rounded-[1.5rem] bg-gradient-to-br from-white/30 via-white/0 to-white/10 opacity-60 blur-md" />
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-[#0a1628] shadow-[0_40px_90px_-25px_rgba(10,22,40,0.55),0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-black/[0.04]">
        {/* Top bar — faithful to the PNG */}
        <div className="flex items-center justify-between border-b border-black/[0.05] bg-white px-5 py-3">
          <div className="flex items-center gap-2">
            <img src={loriLogo} alt="" className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-slate-200 to-slate-100" />
              <span className="text-[11px] text-slate-400">Scaduto</span>
            </div>
            <Bell className="h-3.5 w-3.5 text-slate-500" />
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            </div>
          </div>
        </div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-5 pt-4 text-[11.5px] text-slate-400">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={i === breadcrumb.length - 1 ? "text-slate-500" : ""}>{b}</span>
              {i < breadcrumb.length - 1 && <ChevronDown className="h-3 w-3 -rotate-90 text-slate-300" />}
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

const TAG_STYLES = {
  followup: "border-rose-300/80 bg-rose-50 text-rose-500",
  mail: "border-amber-300/80 bg-amber-50 text-amber-600",
  nuovo: "border-sky-300/80 bg-sky-50 text-sky-600",
  preventivo: "border-violet-300/80 bg-violet-50 text-violet-600",
  trattativa: "border-emerald-300/80 bg-emerald-50 text-emerald-600",
} as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LORI CRM — Il CRM operativo per la Lead Generation su LinkedIn" },
      { name: "description", content: "Stanco di utilizzare excel per la tua Lead generation ma i tool presenti sul mercato sono troppo complessi?" },
      { property: "og:title", content: "LORI CRM — Lead Generation LinkedIn semplice e tracciabile" },
      { property: "og:description", content: "Stanco di utilizzare excel per la tua Lead generation ma i tool presenti sul mercato sono troppo complessi?" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.lori-crm.it/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LORI CRM — Lead Generation LinkedIn semplice e tracciabile" },
      { name: "twitter:description", content: "Stanco di utilizzare excel per la tua Lead generation ma i tool presenti sul mercato sono troppo complessi?" },
    ],
    links: [{ rel: "canonical", href: "https://www.lori-crm.it/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "LORI CRM",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://www.lori-crm.it/",
          description: "CRM operativo per la Lead Generation su LinkedIn, in stile Excel, pensato per freelance e Partite IVA italiane.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          publisher: { "@id": "https://www.lori-crm.it/#organization" },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  useEffect(() => {
    const h = () => setConsultOpen(true);
    const n = () => setNotifyOpen(true);
    window.addEventListener("open-consultation", h);
    window.addEventListener("open-notify", n);
    return () => {
      window.removeEventListener("open-consultation", h);
      window.removeEventListener("open-notify", n);
    };
  }, []);
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <WhatIsLori />
        <WhyUseLori />
        <HowItWorks />
        <Benefits />
        <NumbersSection />
        <ComingSoonApp />
        <Pricing />
        <CustomCRM />
        <FinalCTA />
      </main>
      <SiteFooter />
      <ConsultationDialog open={consultOpen} onOpenChange={setConsultOpen} />
      <ConsultationDialog open={notifyOpen} onOpenChange={setNotifyOpen} mode="notify" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--dark-bg)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,oklch(0.62_0.21_295/0.4),transparent_50%),radial-gradient(circle_at_80%_60%,oklch(0.5_0.2_280/0.3),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-20 sm:pb-24 md:pt-28">
          <h1 className="mx-auto max-w-4xl text-[clamp(2rem,8vw,3.75rem)] font-bold leading-[1.1] tracking-tight">
          Your <span className="italic font-light">Efficient,</span> <span className="italic font-light">Effective</span><br />
          and <span className="italic underline underline-offset-4 bg-primary/30 px-2 rounded-md text-white">easy</span> solution.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] text-white/70 sm:text-base md:text-lg">
          Il CRM operativo per rendere la tua Lead Generation un processo chiaro, tracciabile e replicabile.
        </p>
        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="h-12 w-full rounded-full px-8 text-base shadow-xl shadow-primary/40 sm:w-auto">
            <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer">Registrati gratuitamente <ArrowRight className="h-4 w-4" /></a>
          </Button>
          <a href="#soluzioni" className="text-sm text-white/70 hover:text-white sm:ml-2">Scopri come funziona →</a>
        </div>
        <div className="mx-auto mt-10 max-w-5xl sm:mt-16">
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  const rows = [
    { name: "Marco Campana", company: "Industries SPA", tag: "Preventivo Inviato", style: TAG_STYLES.preventivo, date: "25 mag 2026" },
    { name: "Francesco Stoppa", company: "Techcorp SRL", tag: "Follow Up", style: TAG_STYLES.followup, date: "25 mag 2026" },
    { name: "Mario Rossi", company: "Bizpower", tag: "Trattativa", style: TAG_STYLES.trattativa, date: "25 mag 2026" },
  ];
  return (
    <MockChrome breadcrumb={["Dashboard", "Liste", "Lista Esempio"]}>
      {/* Title + CTA */}
      <div className="flex items-end justify-between gap-4 px-5 pt-3">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold tracking-tight">Lista Esempio</h3>
          <span className="hidden items-center gap-1 text-[11.5px] text-slate-400 sm:inline-flex">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-300 text-[9px]">?</span>
            Assistenza
          </span>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a1628] px-3.5 py-2 text-[12px] font-medium text-white shadow-[0_8px_20px_-6px_rgba(10,22,40,0.45)]">
          <Plus className="h-3.5 w-3.5" /> Inserisci lead
        </button>
      </div>

      {/* Tabs + Metriche */}
      <div className="mt-5 flex items-center justify-between border-b border-black/[0.05] px-5">
        <div className="flex items-end gap-5 text-[12px]">
          {["Foglio 1", "Foglio 2", "Foglio 3", "Foglio 4"].map((t, i) => (
            <button key={t} className={`relative pb-2.5 ${i === 0 ? "font-semibold text-[#0a1628]" : "text-slate-400"}`}>
              {t}
              {i === 0 && <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#0a1628]" />}
            </button>
          ))}
          <button className="pb-2.5 text-slate-400"><Plus className="h-3.5 w-3.5" /></button>
        </div>
        <button className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 shadow-sm">
          <BarChart3 className="h-3 w-3" /> Metriche
        </button>
      </div>

      {/* Table */}
      <div className="px-3 pb-5 pt-4 sm:px-5 sm:pb-6">
        <div className="overflow-hidden rounded-xl border border-black/[0.05] bg-white">
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-black/[0.05] bg-slate-50/60 px-3 py-2.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-400 sm:grid-cols-12 sm:px-4">
            <div className="hidden sm:col-span-1 sm:block"><span className="block h-3 w-3 rounded border border-slate-300" /></div>
            <div className="sm:col-span-3">Nome</div>
            <div className="hidden sm:col-span-2 sm:block">Azienda</div>
            <div className="hidden sm:col-span-2 sm:block">Messaggio</div>
            <div className="text-right sm:col-span-2 sm:text-left">Etichetta</div>
            <div className="hidden text-right sm:col-span-2 sm:block">Data</div>
          </div>
          <div className="divide-y divide-black/[0.04]">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-3 text-[12px] hover:bg-slate-50/40 sm:grid-cols-12 sm:px-4 sm:text-[12.5px]">
                <div className="hidden sm:col-span-1 sm:block"><span className="block h-3 w-3 rounded border border-slate-300" /></div>
                <div className="min-w-0 sm:col-span-3">
                  <div className="truncate font-semibold text-[#0a1628]">{r.name}</div>
                  <div className="truncate text-[11px] text-slate-500 sm:hidden">{r.company}</div>
                </div>
                <div className="hidden text-slate-600 sm:col-span-2 sm:block">{r.company}</div>
                <div className="hidden items-center gap-1 text-slate-400 sm:col-span-2 sm:flex">
                  <span className="truncate">Scrivi messaggio…</span>
                  <Sparkles className="h-3 w-3 text-violet-400" />
                </div>
                <div className="justify-self-end sm:col-span-2 sm:justify-self-auto">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${r.style}`}>
                    {r.tag}
                  </span>
                </div>
                <div className="hidden text-right text-[11.5px] text-slate-500 sm:col-span-2 sm:block">{r.date}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">Precedente</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">Successivo</button>
        </div>
      </div>
    </MockChrome>
  );
}

/* ──────── small mockups for "Why use LORI" cards (light, faithful to PNGs) ──────── */
function MiniCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-xl border border-black/[0.05] bg-white p-3.5 shadow-[0_12px_30px_-12px_rgba(10,22,40,0.18)] ring-1 ring-black/[0.03]">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      {children}
    </div>
  );
}

/* Home — 4 circles "BENVENUTO IN LORI" */
function MockImport() {
  const items = [
    { l: "OPERATORI", filled: false, icon: Users },
    { l: "LISTE", filled: true, icon: CheckCircle2 },
    { l: "LEAD", filled: false, icon: Inbox },
    { l: "ETICHETTE", filled: true, icon: Tag },
  ];
  return (
    <MiniCard>
      <div className="text-center text-[10px] font-bold tracking-[0.18em] text-[#0a1628]">BENVENUTO IN LORI</div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {items.map((it) => (
          <div key={it.l} className="flex flex-col items-center gap-1">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${it.filled ? "bg-[#0a1628] text-white shadow-[0_10px_25px_-6px_rgba(10,22,40,0.5)]" : "border-[1.5px] border-[#0a1628]/85 text-[#0a1628]"}`}>
              <it.icon className="h-5 w-5" />
            </div>
            <span className="text-[8px] font-bold tracking-wider text-[#0a1628]">{it.l}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[9.5px] text-slate-500 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Admin Panel
        </span>
      </div>
    </MiniCard>
  );
}

/* Etichette — colored outlined tags list */
function MockSegment() {
  const tags = [
    { l: "Follow Up", s: TAG_STYLES.followup },
    { l: "Mail", s: TAG_STYLES.mail },
    { l: "Nuovo", s: TAG_STYLES.nuovo },
    { l: "Preventivo Inviato", s: TAG_STYLES.preventivo },
    { l: "Trattativa", s: TAG_STYLES.trattativa },
  ];
  return (
    <MiniCard>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-bold text-[#0a1628]">Etichette</div>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#0a1628] px-2 py-0.5 text-[9px] font-medium text-white">
          <Plus className="h-2.5 w-2.5" /> Registra nuova
        </span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {tags.map((t) => (
          <div key={t.l} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5">
            <span className={`rounded-full border px-2 py-px text-[9.5px] font-semibold ${t.s}`}>{t.l}</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-px text-[8.5px] font-medium text-slate-500">Default</span>
          </div>
        ))}
      </div>
    </MiniCard>
  );
}

/* Lead — full list table */
function MockAnalytics() {
  const rows = [
    { n: "Marco Campana", t: "Preventivo Inviato", s: TAG_STYLES.preventivo },
    { n: "Francesco Stoppa", t: "Follow Up", s: TAG_STYLES.followup },
    { n: "Mario Rossi", t: "Trattativa", s: TAG_STYLES.trattativa },
    { n: "Sofia Marini", t: "Nuovo", s: TAG_STYLES.nuovo },
  ];
  return (
    <MiniCard>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-bold text-[#0a1628]">Tutti i lead</div>
        <span className="text-[9.5px] text-slate-400">7 lead trovati</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex flex-1 items-center gap-1 rounded-md border border-slate-200 px-1.5 py-1">
          <Search className="h-2.5 w-2.5 text-slate-400" />
          <span className="text-[8.5px] text-slate-400">Cerca…</span>
        </div>
        <span className="rounded-md border border-slate-200 px-1.5 py-1 text-[8.5px] text-slate-500">Etichette</span>
      </div>
      <div className="mt-2 space-y-1">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center gap-2 border-b border-slate-100 pb-1 last:border-0">
            <span className="block h-2 w-2 rounded-sm border border-slate-300" />
            <span className="text-[10px] font-semibold text-[#0a1628]">{r.n}</span>
            <span className={`ml-auto rounded-full border px-1.5 py-px text-[8.5px] font-semibold ${r.s}`}>{r.t}</span>
          </div>
        ))}
      </div>
    </MiniCard>
  );
}

function WhatIsLori() {
  const features = [
    { icon: Target, title: "Il CRM pensato per LinkedIn", desc: "Nasce per chi usa LinkedIn ogni giorno per fare lead generation e vuole uno strumento dedicato." },
    { icon: Tag, title: "Tutto tracciabile", desc: "Contatti, messaggi, follow-up e risposte: ogni interazione è organizzata e sotto controllo." },
    { icon: Repeat, title: "Processi replicabili", desc: "Trasforma ciò che funziona in un processo chiaro e riutilizzabile, senza ricominciare da zero." },
  ];
  return (
    <section id="soluzioni" className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cosa è LORI CRM</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Lori CRM - Il primo CRM in stile excel per la tua Lead Generation</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          LORI è un CRM progettato specificamente per chi usa LinkedIn per generare lead. Centralizza contatti, conversazioni e risultati in un unico spazio.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-primary/15 bg-primary-soft/40 p-8 md:p-10">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">Cosa significa LORI</p>
        <p className="mt-3 text-center text-lg font-medium text-foreground md:text-xl">
          <span className="text-primary font-bold">L</span>ead{" "}
          <span className="text-seo-accent font-bold">O</span>perator{" "}
          <span className="text-primary font-bold">R</span>esponsive{" "}
          <span className="text-seo-accent font-bold">I</span>ntegration
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          Un sistema integrato e reattivo che mette l'operatore della lead generation al centro: ogni contatto, ogni messaggio, ogni risultato in un flusso unico.
        </p>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyUseLori() {
  const cards = [
    { icon: Upload, title: "Importa da Sales Navigator", desc: "Collega l'account e importa automaticamente i lead da LinkedIn Sales Navigator.", mock: <MockImport /> },
    { icon: Users, title: "Visualizza e segmenta", desc: "Organizza i tuoi contatti per etichette, batch e fase del funnel.", mock: <MockSegment /> },
    { icon: BarChart3, title: "Monitora ogni batch", desc: "Performance dettagliate per ogni campagna: capisci cosa funziona davvero.", mock: <MockAnalytics /> },
  ];
  return (
    <section className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Perché usare LORI</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              Gestisci i tuoi lead,<br />senza caos.
            </h2>
          </div>
          <p className="text-muted-foreground md:text-lg">
            Lavora con i tuoi contatti LinkedIn come se fossero già nel tuo CRM. Tracciamento, etichette e batch in un'unica vista.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, desc, mock }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-5">{mock}</div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return _HowItWorks();
}

function OnboardingMock() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--dark-surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-[10px] font-bold text-white">L</div>
            <span className="text-sm font-semibold text-white">Onboarding</span>
          </div>
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/45">3 / 3 completati</span>
        </div>

        <div className="px-5 pt-5">
          <div className="flex items-center justify-between text-[11px] text-white/55">
            <span>Configurazione account</span>
            <span className="text-emerald-300">100%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-emerald-400" />
          </div>
        </div>

        <div className="space-y-2.5 p-5">
          {[
            { t: "Account registrato", s: "marco@lori.app · piano Go", done: true, icon: CheckCircle2 },
            { t: "Importata prima lista", s: "248 lead · Sales Navigator", done: true, icon: Upload },
            { t: "Gestisci, organizza, monitora", s: "Pipeline pronta · batch attivo", done: true, icon: Sparkles },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.done ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25" : "bg-white/5 text-white/40"}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{s.t}</div>
                <div className="truncate text-[11px] text-white/45">{s.s}</div>
              </div>
              <div className="text-[10px] text-white/30">{i + 1}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] bg-white/[0.015] px-5 py-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10.5px] font-medium text-primary-foreground ring-1 ring-inset ring-primary/30">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Collegamento 70%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Risposta positiva 50%
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-white/40">
            <MessageSquare className="h-3 w-3" /> 12 nuove
          </span>
        </div>
      </div>
    </div>
  );
}

function _HowItWorks() {
  const steps = [
    "Registrati su LORI CRM.",
    "Importa la tua prima lista da Sales Navigator.",
    "Goditi il tempo libero rimanente.",
  ];
  return (
    <section className="bg-[var(--dark-bg)] py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
        <OnboardingMock />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Come funziona LORI</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Pochi e semplici step</h2>
          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {i + 1}
                </span>
                <span className="pt-1.5 text-white/85">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const con = [
    "Tutti i contatti e le interazioni in un unico sistema, sempre aggiornato.",
    "Ogni attività, dai messaggi ai follow-up, è monitorata in modo chiaro.",
    "Risultati misurabili per migliorare strategie e messaggi nel tempo.",
  ];
  const senza = [
    "Lead e conversazioni distribuiti tra chat, file e tool non integrati.",
    "Difficile capire a che punto si trova ogni lead e quali attività svolte.",
    "Gestione manuale che richiede tempo e aumenta gli errori.",
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Maggiori benefici</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
          Il modo più semplice per gestire la Lead Generation su LinkedIn.
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-primary bg-primary-soft/40 p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <Zap className="h-3 w-3" /> Con LORI
          </span>
          <h3 className="mt-4 text-xl font-semibold">I vantaggi di una gestione strutturata</h3>
          <ul className="mt-5 space-y-3">
            {con.map((c) => (
              <li key={c} className="flex gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Senza LORI
          </span>
          <h3 className="mt-4 text-xl font-semibold">Gestione manuale e frammentata</h3>
          <ul className="mt-5 space-y-3">
            {senza.map((c) => (
              <li key={c} className="flex gap-3 text-sm text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function useCountUp(target: number, durationMs = 1600) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs]);
  return { ref, value };
}

function NumbersSection() {
  const { ref, value } = useCountUp(45);
  const badges = [
    { icon: TrendingUp, title: "In crescita costante", desc: "Nuovi professionisti entrano ogni settimana." },
    { icon: Heart, title: "Feedback positivi", desc: "La community usa LORI ogni giorno e ci guida nel miglioramento." },
    { icon: Sparkles, title: "Prodotto in evoluzione", desc: "Nuove feature rilasciate costantemente, ascoltando gli utenti." },
  ];
  return (
    <section id="numeri" className="bg-[var(--dark-bg)] py-24 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">La community cresce</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Sempre più professionisti scelgono LORI</h2>
        </div>
        <div ref={ref} className="mt-14 flex flex-col items-center text-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl [background:radial-gradient(circle_at_50%_50%,oklch(0.62_0.21_295/0.45),transparent_60%)]" />
            <div className="text-[clamp(4rem,15vw,8rem)] font-bold leading-none tracking-tight text-white">
              {value}
            </div>
          </div>
          <p className="mt-3 text-base text-white/70 sm:text-lg">
            professionisti hanno già scelto <span className="font-semibold text-white">LORI</span>
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {badges.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/65">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
            <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer">
              Unisciti alla community <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function IPhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-16 -z-10 rounded-[4rem] bg-[radial-gradient(55%_55%_at_50%_45%,oklch(0.62_0.21_265/0.45),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -inset-16 -z-10 rounded-[4rem] bg-[radial-gradient(40%_40%_at_70%_80%,oklch(0.72_0.19_45/0.28),transparent_70%)] blur-3xl" />

      {/* Titanium frame */}
      <div
        className="relative aspect-[9/19.5] rounded-[3rem] p-[4px] shadow-[0_50px_120px_-30px_rgba(6,14,32,0.75),0_20px_40px_-20px_rgba(6,14,32,0.55)]"
        style={{
          background:
            "linear-gradient(150deg,#3a3f4a 0%,#1c1f26 25%,#0d0f14 50%,#1c1f26 75%,#3a3f4a 100%)",
        }}
      >
        <div className="absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-white/15" />
        <div className="absolute inset-[3px] rounded-[2.85rem] ring-1 ring-inset ring-black/40" />

        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[92px] h-8 w-[3px] rounded-l bg-gradient-to-b from-[#2a2e37] to-[#0b0d12]" />
        <div className="absolute -left-[3px] top-[140px] h-14 w-[3px] rounded-l bg-gradient-to-b from-[#2a2e37] to-[#0b0d12]" />
        <div className="absolute -left-[3px] top-[220px] h-14 w-[3px] rounded-l bg-gradient-to-b from-[#2a2e37] to-[#0b0d12]" />
        <div className="absolute -right-[3px] top-[160px] h-20 w-[3px] rounded-r bg-gradient-to-b from-[#2a2e37] to-[#0b0d12]" />

        {/* Screen */}
        <div className="relative h-full overflow-hidden rounded-[2.7rem] bg-black">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2.7rem] bg-gradient-to-b from-[#f4f6fb] via-[#eef1f7] to-[#e6ebf3]">
            {/* Screen sheen */}
            <div className="pointer-events-none absolute inset-0 z-30 rounded-[2.7rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_0%,transparent_25%,transparent_75%,rgba(255,255,255,0.15)_100%)] mix-blend-overlay" />
            {/* Dynamic island */}
            <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-[26px] w-[95px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#1a1d24] ring-1 ring-white/10" />
            </div>

            {/* iOS status bar */}
            <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[11px] font-semibold text-black">
              <span className="tracking-tight">9:41</span>
              <span className="opacity-0">·</span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 18 10" className="h-2.5 w-3.5 fill-black"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
                <svg viewBox="0 0 16 12" className="h-2.5 w-3 fill-black"><path d="M8 2c2 0 3.8.7 5.2 2l1-1a8.5 8.5 0 0 0-12.4 0l1 1A7 7 0 0 1 8 2Zm0 3.5c1.1 0 2.1.4 2.8 1.1l1-1a5.5 5.5 0 0 0-7.6 0l1 1A4 4 0 0 1 8 5.5ZM8 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
                <span className="ml-0.5 inline-flex h-2.5 items-center rounded-[3px] border border-black/80 px-[3px] text-[7px] font-bold leading-none">
                  <span className="inline-block h-1.5 w-3 rounded-[1px] bg-black" />
                </span>
              </span>
            </div>

            {/* App Store nav */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="flex items-center text-[12px] font-medium text-[#0071e3]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M15 6l-6 6 6 6"/></svg>
                Cerca
              </span>
              <Share2 className="h-4 w-4 text-[#0071e3]" />
            </div>

            {/* App hero */}
            <div className="flex items-start gap-3 px-4 pt-2">
              <div
                className="relative grid h-[76px] w-[76px] shrink-0 place-items-center rounded-[18px] shadow-[0_10px_25px_-8px_rgba(10,22,40,0.55)] ring-1 ring-black/10"
                style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a2f52 55%,#2a4680 100%)" }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
                <img src={loriLogo} alt="LORI" className="relative h-12 w-12 drop-shadow-md" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[15px] font-semibold text-[#0a1628]">LORI CRM</h4>
                <p className="truncate text-[10px] text-slate-500">CRM in stile Excel per lead</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#0071e3] px-4 py-[4px] text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">Ottieni</span>
                  <Share2 className="h-4 w-4 text-[#0071e3]" />
                </div>
                <p className="mt-1 text-[8px] uppercase tracking-wider text-slate-400">Acquisti in-app</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="mx-4 mt-3 grid grid-cols-4 divide-x divide-black/10 rounded-xl border border-black/5 bg-white/70 py-2 text-center text-[9px] text-slate-500 backdrop-blur">
              <div>
                <div className="text-[11px] font-bold text-slate-800">4.8</div>
                <div className="text-[8px]">★★★★★</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800">#12</div>
                <div className="text-[8px]">Business</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800">4+</div>
                <div className="text-[8px]">Età</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800">IT</div>
                <div className="text-[8px]">Lingua</div>
              </div>
            </div>

            {/* Anteprima */}
            <div className="mt-3 flex-1 px-4 pb-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0a1628]">Anteprima</span>
                <span className="text-[9px] text-slate-400">v1.0</span>
              </div>
              <div className="flex gap-2">
                {/* Screenshot 1 — dark lead app */}
                <div
                  className="relative h-[150px] flex-1 overflow-hidden rounded-[12px] ring-1 ring-black/10 shadow-[0_10px_25px_-12px_rgba(10,22,40,0.6)]"
                  style={{ background: "linear-gradient(160deg,#0a1628 0%,#132444 60%,#1a2f52 100%)" }}
                >
                  <div className="flex items-center justify-between px-1.5 pt-1.5">
                    <div className="flex items-center gap-1">
                      <img src={loriLogo} alt="" className="h-3 w-3" />
                      <span className="text-[7px] font-bold text-white">Lead</span>
                    </div>
                    <span className="rounded-full bg-[#f5871f] px-1 py-[1px] text-[6px] font-semibold text-white">+12</span>
                  </div>
                  <div className="mt-1.5 space-y-1 px-1.5">
                    {[
                      { n: "Marco C.", t: "Nuovo", c: "bg-emerald-400" },
                      { n: "Francesco S.", t: "Follow", c: "bg-sky-400" },
                      { n: "Mario R.", t: "Prev.", c: "bg-amber-400" },
                      { n: "Luca B.", t: "Nuovo", c: "bg-emerald-400" },
                    ].map((r) => (
                      <div key={r.n} className="flex items-center justify-between rounded-md bg-white/10 px-1.5 py-1 backdrop-blur-sm ring-1 ring-white/5">
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${r.c}`} />
                          <span className="text-[6px] font-medium text-white">{r.n}</span>
                        </div>
                        <span className="text-[5px] text-white/60">{r.t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-[#f5871f] py-1 text-center text-[6px] font-bold text-white shadow">
                    + Nuovo lead
                  </div>
                </div>

                {/* Screenshot 2 — dashboard chart */}
                <div className="relative h-[150px] flex-1 overflow-hidden rounded-[12px] bg-white ring-1 ring-black/10 shadow-[0_10px_25px_-12px_rgba(10,22,40,0.35)]">
                  <div className="flex items-center justify-between px-1.5 pt-1.5">
                    <span className="text-[7px] font-bold text-[#0a1628]">Dashboard</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-1 px-1.5">
                    <div className="text-[11px] font-bold text-[#0a1628] leading-none">€24.8k</div>
                    <div className="text-[6px] text-emerald-600">+18.4% ▲</div>
                  </div>
                  {/* Chart */}
                  <svg viewBox="0 0 100 40" className="mt-1 h-12 w-full px-1">
                    <defs>
                      <linearGradient id="ph-g" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,30 L15,22 L30,26 L45,14 L60,18 L75,8 L100,12 L100,40 L0,40 Z" fill="url(#ph-g)" />
                    <path d="M0,30 L15,22 L30,26 L45,14 L60,18 L75,8 L100,12" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-1 space-y-0.5 px-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[6px] text-slate-500">Conversione</span>
                      <span className="text-[6px] font-semibold text-slate-700">32%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100">
                      <div className="h-full w-1/3 rounded-full bg-[#f5871f]" />
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[6px] text-slate-500">Pipeline</span>
                      <span className="text-[6px] font-semibold text-slate-700">68%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100">
                      <div className="h-full w-2/3 rounded-full bg-[#0071e3]" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1.5 right-1.5 flex gap-1">
                    <span className="flex-1 rounded bg-emerald-100 py-0.5 text-center text-[5px] font-semibold text-emerald-700">Nuovo</span>
                    <span className="flex-1 rounded bg-sky-100 py-0.5 text-center text-[5px] font-semibold text-sky-700">Follow</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Home indicator */}
            <div className="pb-2">
              <div className="mx-auto h-[4px] w-28 rounded-full bg-black/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoonApp() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">In arrivo</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            LORI presto su <span className="text-primary">App Store</span>
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground md:text-lg">
            Stiamo portando LORI sul tuo smartphone. Gestisci lead, etichette e follow-up ovunque tu sia, con la stessa esperienza fluida che trovi sul web.
          </p>
          <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              Presto disponibile su App Store
            </p>
            <Button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-notify"))}
              className="rounded-full"
            >
              Avvisami al lancio <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Notifiche push sui nuovi lead</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Etichette e follow-up con un tap</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Sincronizzazione in tempo reale con il web</li>
          </ul>
        </div>
        <div className="order-first md:order-last">
          <IPhoneMock />
        </div>
      </div>
    </section>
  );
}

function CustomCRM() {
  const points = [
    { icon: Wrench, title: "Costruito sui tuoi processi", desc: "Ogni flusso disegnato sul modo in cui il tuo team lavora davvero." },
    { icon: Palette, title: "Logo e colori del tuo brand", desc: "Un gestionale che sembra fatto in casa: identità visiva 100% tua." },
    { icon: Headphones, title: "Onboarding e supporto dedicato", desc: "Ti affianchiamo dalla progettazione al go-live e oltre." },
  ];
  return (
    <section className="relative overflow-hidden bg-[var(--dark-bg)] py-24 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_30%,oklch(0.62_0.21_295/0.35),transparent_55%),radial-gradient(circle_at_80%_70%,oklch(0.5_0.2_280/0.25),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Vuoi sviluppare il tuo CRM personalizzato?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Oltre a LORI, progettiamo e sviluppiamo gestionali personalizzati costruiti sulle esigenze specifiche del tuo business e del tuo team.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {points.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground ring-1 ring-inset ring-primary-foreground/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/65">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-7 shadow-xl shadow-primary/40">
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-consultation"))} className="inline-flex items-center gap-2">
              Richiedi una consulenza <ArrowRight className="h-4 w-4" />
            </button>
          </Button>
          <a href="#registrati" className="text-sm text-white/70 hover:text-white">oppure parliamone →</a>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Free", tag: "Perfetto per iniziare", price: "€0", per: "/ 1 mese free",
      features: ["Accesso al CRM base", "Voucher per estrazione CRM for life", "Community access"],
      cta: "Inizia gratis", featured: false,
    },
    {
      name: "Go", tag: "Per professionisti", price: "€1,99", per: "/ 3 mesi",
      old: "€3,99", features: ["Accesso completo al CRM", "Tutte le funzionalità", "Supporto prioritario"],
      cta: "Scegli Go", featured: true, badge: "Più popolare",
    },
    {
      name: "Custom", tag: "Per grandi team", price: "€8,99", per: "/ mese",
      features: ["Tutto del piano Go", "Logo e colori del tuo brand", "Onboarding dedicato"],
      cta: "Contattaci", featured: false,
    },
  ];
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10 [background-image:radial-gradient(oklch(0.62_0.21_295/0.15)_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Le nostre proposte</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Scegli il piano perfetto per te</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Prezzi trasparenti e flessibili. Tutti i piani includono 14 giorni di prova gratuita.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl border bg-card p-8 transition-all ${p.featured ? "border-primary shadow-2xl shadow-primary/20 md:-translate-y-4" : "border-border"}`}>
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  {p.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tag}</p>
              <div className="mt-5 flex items-baseline gap-2">
                {p.old && <span className="text-sm text-muted-foreground line-through">{p.old}</span>}
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className={`mt-7 w-full rounded-full ${p.featured ? "" : "bg-foreground hover:bg-foreground/90"}`}>
                <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer">{p.cta}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="registrati" className="bg-[var(--dark-bg)] py-24 text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Pronto a portare LORI nel tuo team?</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Crea il tuo account in meno di un minuto e inizia a centralizzare la tua lead generation su LinkedIn.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full px-8 shadow-lg shadow-primary/40">
          <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer">
            Registrati gratuitamente <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}

