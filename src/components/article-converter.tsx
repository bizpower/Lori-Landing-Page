import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, FileText, Download, Loader2, X, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "pdf-to-excel" | "excel-to-pdf";
type Status = "idle" | "uploading" | "processing" | "done" | "error";
const MAX_FILE_MB = 15;

export function ArticleConverter() {
  const [mode, setMode] = useState<Mode>("pdf-to-excel");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = mode === "pdf-to-excel"
    ? ".pdf,application/pdf"
    : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const reset = () => {
    setFile(null); setStatus("idle"); setProgress(0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null); setResultName("");
  };

  const switchMode = (m: Mode) => { if (m === mode) return; reset(); setMode(m); };

  const validate = (f: File): boolean => {
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_MB) { toast.error(`File troppo grande. Massimo ${MAX_FILE_MB}MB.`); return false; }
    if (mode === "pdf-to-excel" && !f.name.toLowerCase().endsWith(".pdf")) { toast.error("Carica un file PDF."); return false; }
    if (mode === "excel-to-pdf" && !/\.(xlsx?|xls)$/i.test(f.name)) { toast.error("Carica un file Excel (.xls o .xlsx)."); return false; }
    return true;
  };

  const onSelect = (f: File) => { if (!validate(f)) return; setFile(f); setStatus("idle"); };

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setStatus("uploading"); setProgress(15);
    try {
      await new Promise((r) => setTimeout(r, 250));
      setStatus("processing"); setProgress(45);
      if (mode === "pdf-to-excel") {
        const { convertPdfToXlsx } = await import("@/lib/converters");
        const { blob, name } = await convertPdfToXlsx(file, (p) => setProgress(45 + Math.round(p * 0.5)));
        setResultUrl(URL.createObjectURL(blob)); setResultName(name);
      } else {
        const { convertXlsxToPdf } = await import("@/lib/converters");
        const { blob, name } = await convertXlsxToPdf(file);
        setResultUrl(URL.createObjectURL(blob)); setResultName(name);
      }
      setProgress(100); setStatus("done");
      toast.success("Conversione completata!");
    } catch (e: any) {
      console.error(e); setStatus("error");
      toast.error(e?.message || "Errore durante la conversione.");
    }
  }, [file, mode]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) onSelect(f);
  };

  return (
    <section id="converter" className="not-prose my-10 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-border bg-card/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur md:p-8"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Converter
          </div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Convertitore PDF ⇄ Excel</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Drag &amp; drop il tuo file. Conversione 100% nel browser, nessun upload sui server.
          </p>
          <div className="inline-flex rounded-full border border-border bg-secondary/60 p-1">
            <button onClick={() => switchMode("pdf-to-excel")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${mode === "pdf-to-excel" ? "bg-primary text-white shadow" : "text-muted-foreground"}`}>
              PDF → Excel
            </button>
            <button onClick={() => switchMode("excel-to-pdf")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${mode === "excel-to-pdf" ? "bg-primary text-white shadow" : "text-muted-foreground"}`}>
              Excel → PDF
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !file && inputRef.current?.click()}
          className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragging ? "border-primary bg-primary-soft/60" : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary-soft/30"}`}
        >
          <input ref={inputRef} type="file" accept={accept} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-primary-soft p-4"><Upload className="h-7 w-7 text-primary" /></div>
                <p className="text-base font-medium">Trascina qui il tuo file o clicca per selezionarlo</p>
                <p className="text-xs text-muted-foreground">
                  {mode === "pdf-to-excel" ? "Formato supportato: PDF" : "Formati supportati: XLS, XLSX"} · Max {MAX_FILE_MB}MB
                </p>
              </motion.div>
            ) : (
              <motion.div key="file" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 text-left">
                  {mode === "pdf-to-excel" ? <FileText className="h-8 w-8 text-primary" /> : <FileSpreadsheet className="h-8 w-8 text-emerald-600" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {status === "idle" && (
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Rimuovi">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {(status === "uploading" || status === "processing") && (
                  <div className="w-full max-w-md">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{status === "uploading" ? "Caricamento…" : "Elaborazione AI…"}</p>
                  </div>
                )}
                {status !== "done" && (
                  <Button onClick={(e) => { e.stopPropagation(); handleConvert(); }} disabled={status === "uploading" || status === "processing"} size="lg" className="rounded-full px-6 text-white shadow-lg shadow-primary/30">
                    {status === "uploading" || status === "processing" ? (
                      <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Conversione…</>
                    ) : (
                      <>Converti ora <ArrowRight className="ml-1 h-4 w-4" /></>
                    )}
                  </Button>
                )}
                {status === "done" && resultUrl && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="lg" className="rounded-full px-6 text-white shadow-lg shadow-primary/30">
                      <a href={resultUrl} download={resultName} onClick={(e) => e.stopPropagation()}>
                        <Download className="mr-1 h-4 w-4" /> Scarica {resultName}
                      </a>
                    </Button>
                    <Button onClick={(e) => { e.stopPropagation(); reset(); }} size="lg" variant="outline" className="rounded-full px-6">
                      Nuovo file
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
