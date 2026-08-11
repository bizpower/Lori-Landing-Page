import { Link } from "@tanstack/react-router";
import { Linkedin, Instagram, Twitter, Lock } from "lucide-react";
import loriLogo from "@/assets/lori-logo.svg";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <img src={loriLogo} alt="LORI" className="h-10 w-10" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Efficient, effective, easy.</p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="mb-3 font-semibold">Navigazione</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li><a href="/#soluzioni" className="hover:text-foreground">Soluzioni</a></li>
              <li><a href="/#dicono" className="hover:text-foreground">Dicono di noi</a></li>
              <li><Link to="/magazine" className="hover:text-foreground">Magazine</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Follow Us</h4>
            <div className="flex gap-3 text-muted-foreground">
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin className="h-5 w-5" /></a>
              <a href="#" aria-label="Instagram" className="hover:text-foreground"><Instagram className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground md:text-right">
          <div className="mb-3 flex md:justify-end">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Lock className="h-3.5 w-3.5" />
              Area Riservata
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 md:justify-end">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground">Terms &amp; Conditions</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground">Cookie Policy</a>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} LORI CRM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
