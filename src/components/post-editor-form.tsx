import { useState, useRef } from "react";
import { TipTapEditor } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Wand2, ImagePlus } from "lucide-react";
import {
  adminSavePost, aiGenerateArticle, slugifyServer, adminAddCategory,
  aiSeoHighlight, aiAddInlineImages,
} from "@/lib/blog.functions";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

type Category = { id: number; name: string };
type InitialPost = {
  id?: number; title?: string; opening?: string; body?: string; url?: string;
  meta_description?: string | null; img_url?: string | null; signature?: string;
  post_category_id?: number; status?: number;
};

function normalizeCoverUrl(value: string) {
  let url = value.trim().replace(/&amp;/g, "&");
  const pastedUrl = url.match(/https?:\/\/[^\s'"<>)]*/i) ?? url.match(/\/\/res\.cloudinary\.com\/[^\s'"<>)]*/i);
  if (pastedUrl) url = pastedUrl[0];
  url = url.replace(/^['"<]+|['">]+$/g, "");
  if (!url) return "";
  if (url.startsWith("//")) url = `https:${url}`;
  url = url.replace(/^http:\/\/res\.cloudinary\.com\//i, "https://res.cloudinary.com/");
  return url.replace(/\s+/g, "%20");
}

export function PostEditorForm({ initial, categories }: { initial?: InitialPost; categories: Category[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.url ?? "");
  const [meta, setMeta] = useState(initial?.meta_description ?? "");
  const [opening, setOpening] = useState(initial?.opening ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [img, setImg] = useState(initial?.img_url ?? "");
  const [signature, setSignature] = useState(initial?.signature ?? "LORI Team");
  const [catId, setCatId] = useState<number>(initial?.post_category_id ?? categories[0]?.id ?? 0);
  const [status, setStatus] = useState<0 | 1>(((initial?.status ?? 0) === 1 ? 1 : 0));
  const [saving, setSaving] = useState(false);
  const [coverStatus, setCoverStatus] = useState<"idle" | "loaded" | "error">("idle");

  // SEO Highlight AI
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const editorApi = useRef<{ setHTML: (html: string) => void } | null>(null);

  // AI
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const coverUrl = normalizeCoverUrl(img);
  const isHttpCover = /^https?:\/\//i.test(coverUrl);
  const isCloudinaryCover = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+/i.test(coverUrl);

  const getCoverForSave = () => {
    if (!coverUrl) return null;
    if (!isHttpCover) {
      toast.error("Inserisci un URL immagine valido (https://...)");
      return undefined;
    }
    if (coverStatus === "error") {
      toast("Anteprima cover non caricata, salvo comunque l'URL", { description: "Controlla che il link sia pubblicamente accessibile." });
    }
    return coverUrl;
  };

  const generate = async () => {
    if (!aiTopic.trim() || !aiKeyword.trim()) { toast.error("Inserisci argomento e keyword"); return; }
    setAiLoading(true);
    try {
      const cat = categories.find(c => c.id === catId)?.name ?? "Lead Gen";
      const res = await aiGenerateArticle({ data: { topic: aiTopic, keyword: aiKeyword, category: cat, imageUrl: isHttpCover ? coverUrl : "", audience: aiAudience } });
      setTitle(res.title); setSlug(res.slug); setMeta(res.meta_description); setOpening(res.opening); setBody(res.body);
      setAiOpen(false); toast.success("Articolo generato");
    } catch (e: any) { toast.error(e.message ?? "Errore generazione"); }
    finally { setAiLoading(false); }
  };

  const save = async (publish: boolean) => {
    setSaving(true);
    try {
      const finalCover = getCoverForSave();
      if (finalCover === undefined) return;
      let finalSlug = slug.trim();
      if (!finalSlug) {
        const r = await slugifyServer({ data: { value: title } }); finalSlug = r.slug;
      }
      if (finalCover) setImg(finalCover);
      const res = await adminSavePost({ data: {
        id: initial?.id ?? null, title, opening, body, url: finalSlug,
        meta_description: meta || null, img_url: finalCover, signature,
        post_category_id: catId, status: publish ? 1 : 0,
      }});
      toast.success(publish ? "Pubblicato" : "Salvato come bozza");
      router.navigate({ to: "/admin/edit/$id", params: { id: String(res.id) } });
    } catch (e: any) { toast.error(e.message ?? "Errore salvataggio"); }
    finally { setSaving(false); }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const finalCover = getCoverForSave();
      if (finalCover === undefined) return;
      let finalSlug = slug.trim();
      if (!finalSlug) {
        const r = await slugifyServer({ data: { value: title } }); finalSlug = r.slug;
      }
      if (finalCover) setImg(finalCover);
      const res = await adminSavePost({ data: {
        id: initial?.id ?? null, title, opening, body, url: finalSlug,
        meta_description: meta || null, img_url: finalCover, signature,
        post_category_id: catId, status,
      }});
      toast.success("Modifiche salvate");
      router.navigate({ to: "/admin/edit/$id", params: { id: String(res.id) } });
    } catch (e: any) { toast.error(e.message ?? "Errore salvataggio"); }
    finally { setSaving(false); }
  };

  const addCategory = async () => {
    const name = window.prompt("Nome nuova categoria"); if (!name) return;
    try { await adminAddCategory({ data: { name } }); toast.success("Categoria aggiunta. Ricarica."); router.invalidate(); }
    catch (e: any) { toast.error(e.message); }
  };

  // ── SEO actions ────────────────────────────────────────────────
  const runHighlight = async () => {
    if (!body || body.length < 50) { toast.error("Scrivi prima il contenuto"); return; }
    setHighlightLoading(true);
    try {
      const res = await aiSeoHighlight({ data: { html: body } });
      setBody(res.html); editorApi.current?.setHTML(res.html);
      toast.success("SEO Highlights applicati");
    } catch (e: any) { toast.error(e.message ?? "Errore"); }
    finally { setHighlightLoading(false); }
  };

  const runInlineImages = async () => {
    if (!body || body.length < 100) { toast.error("Scrivi prima il contenuto"); return; }
    setImgGenLoading(true);
    try {
      const res = await aiAddInlineImages({ data: { html: body, topic: title, keyword: aiKeyword, slug: slug || "post" } });
      setBody(res.html); editorApi.current?.setHTML(res.html);
      toast.success("Immagini AI inserite nell'articolo");
    } catch (e: any) { toast.error(e.message ?? "Errore generazione immagini"); }
    finally { setImgGenLoading(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <Label>Titolo (H1 SEO)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo dell'articolo" className="mt-1.5 text-lg font-semibold" />
          <p className="mt-1 text-xs text-muted-foreground">{title.length}/60 ottimale</p>
        </div>
        <div>
          <Label>Apertura / Hook</Label>
          <Textarea value={opening} onChange={(e) => setOpening(e.target.value)} rows={3} className="mt-1.5" />
        </div>
        <div>
          <Label>Corpo articolo</Label>
          <div className="mt-1.5">
            <TipTapEditor
              value={body}
              onChange={setBody}
              onReady={(api) => { editorApi.current = api; }}
              toolbarExtras={
                <>
                  <button
                    type="button"
                    onClick={runHighlight}
                    disabled={highlightLoading}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
                    title="SEO Highlight AI"
                  >
                    {highlightLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                    SEO Highlight AI
                  </button>
                  <button
                    type="button"
                    onClick={runInlineImages}
                    disabled={imgGenLoading}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-seo-accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                    title="Genera immagini AI nell'articolo"
                  >
                    {imgGenLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    Immagini AI
                  </button>
                </>
              }
            />
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> AI Generator</div>
            <Button size="sm" variant={aiOpen ? "secondary" : "default"} onClick={() => setAiOpen(!aiOpen)}>{aiOpen ? "Chiudi" : "Genera"}</Button>
          </div>
          {aiOpen && (
            <div className="mt-3 space-y-2">
              <Input placeholder="Argomento (es. follow-up LinkedIn B2B)" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
              <Input placeholder="Keyword target (es. lead generation linkedin)" value={aiKeyword} onChange={(e) => setAiKeyword(e.target.value)} />
              <Input placeholder="Pubblico (opz.)" value={aiAudience} onChange={(e) => setAiAudience(e.target.value)} />
              <Button onClick={generate} disabled={aiLoading} className="w-full">
                {aiLoading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Genero…</> : "Genera articolo SEO"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div>
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="auto-dal-titolo" className="mt-1.5" />
          </div>
          <div>
            <Label>Meta description</Label>
            <Textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} className="mt-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">{meta.length}/155</p>
          </div>
          <div>
            <Label>URL immagine cover</Label>
            <Input value={img} onChange={(e) => { setImg(e.target.value); setCoverStatus("idle"); }} placeholder="https://res.cloudinary.com/.../image/upload/..." className="mt-1.5" />
            {coverUrl && !isHttpCover && (
              <p className="mt-1.5 text-xs text-destructive">L'URL deve iniziare con https://</p>
            )}
            {coverUrl && isHttpCover && !isCloudinaryCover && (
              <p className="mt-1.5 text-xs text-muted-foreground">Consigliato: URL Cloudinary. Altri host pubblici sono comunque accettati.</p>
            )}
            {coverUrl && isHttpCover && (
              <div className="mt-2 overflow-hidden rounded-md border border-border">
                {coverStatus !== "error" ? (
                  <img
                    key={coverUrl}
                    src={coverUrl}
                    alt="Anteprima cover"
                    className="aspect-[16/9] w-full object-cover"
                    onLoad={() => setCoverStatus("loaded")}
                    onError={() => setCoverStatus("error")}
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-muted px-4 text-center text-xs text-muted-foreground">
                    Anteprima non disponibile (l'URL verrà comunque salvato)
                  </div>
                )}
                <p className={`px-2 py-1 text-[11px] font-medium ${coverStatus === "error" ? "bg-destructive/10 text-destructive" : "bg-seo-accent-soft text-seo-accent"}`}>
                  {coverStatus === "loaded" ? "✓ Cover selezionata" : coverStatus === "error" ? "Anteprima non disponibile — verifica il link" : "Verifico la cover…"}
                </p>
              </div>
            )}
          </div>
          <div>
            <Label>Firma</Label>
            <Input value={signature} onChange={(e) => setSignature(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Categoria</Label>
              <button type="button" onClick={addCategory} className="text-xs text-primary hover:underline">+ aggiungi</button>
            </div>
            <select value={catId} onChange={(e) => setCatId(Number(e.target.value))} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {initial?.id ? (
            <Button onClick={saveChanges} disabled={saving} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Salvo…</> : "Salva modifiche"}
            </Button>
          ) : null}
          <Button variant={initial?.id ? "outline" : "default"} onClick={() => save(true)} disabled={saving}>
            {status === 1 ? "Pubblica / Aggiorna" : "Pubblica"}
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>Salva bozza</Button>
        </div>
      </aside>
    </div>
  );
}
