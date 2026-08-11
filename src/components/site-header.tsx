import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import loriLogo from "@/assets/lori-logo.svg";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    return () => document.body.classList.remove("no-scroll");
  }, [open]);
  const close = () => setOpen(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link to="/" className="flex items-center font-bold text-lg tracking-tight" aria-label="LORI home" onClick={close}>
          <img src={loriLogo} alt="LORI" className="h-9 w-9 sm:h-10 sm:w-10" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link to="/" className="text-foreground/70 transition-colors hover:text-foreground">Home</Link>
          <a href="/#soluzioni" className="text-foreground/70 transition-colors hover:text-foreground">Soluzioni</a>
          <Link to="/magazine" className="text-foreground/70 transition-colors hover:text-foreground">Magazine</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden rounded-full px-5 shadow-lg shadow-primary/30 md:inline-flex">
            <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer">Registrati gratuitamente</a>
          </Button>
          <Button asChild size="sm" className="rounded-full px-3.5 text-xs shadow-md shadow-primary/30 md:hidden">
            <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer">Registrati</a>
          </Button>
          <button
            type="button"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-foreground/80 active:scale-95 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-x-0 top-14 z-40 origin-top border-b border-border/60 bg-background/95 backdrop-blur-xl transition-all duration-200 ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-base font-medium">
          <Link to="/" onClick={close} className="rounded-xl px-4 py-3 text-foreground/85 active:bg-secondary">Home</Link>
          <a href="/#soluzioni" onClick={close} className="rounded-xl px-4 py-3 text-foreground/85 active:bg-secondary">Soluzioni</a>
          <Link to="/magazine" onClick={close} className="rounded-xl px-4 py-3 text-foreground/85 active:bg-secondary">Magazine</Link>
          <Button asChild className="mt-2 h-12 rounded-full shadow-lg shadow-primary/30">
            <a href="https://app.lori-crm.it" target="_blank" rel="noopener noreferrer" onClick={close}>Registrati gratuitamente</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
