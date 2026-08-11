import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import slugify from "slugify";
import { setCookie, deleteCookie } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin.server";
import { createClient } from "@supabase/supabase-js";

let _pub: ReturnType<typeof createClient> | undefined;
function pubClient() {
  if (_pub) return _pub;
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  _pub = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _pub;
}

// ---------- AUTH ----------
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: signIn, error } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error || !signIn.user) return { ok: false as const, error: "Credenziali non valide" };
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", signIn.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return { ok: false as const, error: "Account non autorizzato" };
    setCookie("lori_admin_uid", signIn.user.id, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie("lori_admin_uid", { path: "/" });
  return { ok: true };
});

// ---------- CONSULTATIONS ----------
function generateSlotCandidates(days = 14): string[] {
  const out: string[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;
    for (let h = 9; h < 18; h++) {
      for (const m of [0, 30]) {
        const slot = new Date(day);
        slot.setHours(h, m, 0, 0);
        if (slot.getTime() <= now.getTime() + 60 * 60 * 1000) continue;
        out.push(slot.toISOString());
      }
    }
  }
  return out;
}

export const listAvailableSlots = createServerFn({ method: "GET" }).handler(async () => {
  const candidates = generateSlotCandidates(14);
  const { data } = await supabaseAdmin
    .from("consultations")
    .select("slot_at")
    .gte("slot_at", new Date().toISOString());
  const taken = new Set((data ?? []).map((r: any) => new Date(r.slot_at).toISOString()));
  return { slots: candidates.filter((s) => !taken.has(s)) };
});

export const bookConsultation = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; phone: string; company?: string; slot_at: string }) =>
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().min(5).max(40),
      company: z.string().trim().max(160).optional().or(z.literal("")),
      slot_at: z.string().datetime(),
    }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("consultations").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company || null,
      slot_at: data.slot_at,
    });
    if (error) {
      if ((error as any).code === "23505") return { ok: false as const, error: "Slot già prenotato, scegline un altro." };
      return { ok: false as const, error: "Errore durante la prenotazione. Riprova." };
    }
    return { ok: true as const };
  });

export const adminListConsultations = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin();
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .select("*")
    .order("slot_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { items: data ?? [] };
});

export const adminUpdateConsultation = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; status: string }) =>
    z.object({ id: z.number().int().positive(), status: z.enum(["new", "confirmed", "done", "cancelled"]) }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const { error } = await supabaseAdmin.from("consultations").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteConsultation = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number }) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const { error } = await supabaseAdmin.from("consultations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- LAUNCH NOTIFICATIONS (waitlist) ----------
export const subscribeLaunchNotification = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; phone?: string; company?: string }) =>
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().max(40).optional().or(z.literal("")),
      company: z.string().trim().max(160).optional().or(z.literal("")),
    }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("launch_notifications").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
    });
    if (error) return { ok: false as const, error: "Errore, riprova." };
    return { ok: true as const };
  });

export const adminListLaunchNotifications = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin();
  const { data, error } = await supabaseAdmin
    .from("launch_notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { items: data ?? [] };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  try { await assertAdmin(); return { authed: true }; } catch { return { authed: false }; }
});

// ---------- PUBLIC READS ----------
export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { categoryId?: number | null; page?: number }) =>
    z.object({ categoryId: z.number().int().positive().nullable().optional(), page: z.number().int().min(1).max(500).optional() }).parse(d))
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    const pageSize = 9;
    let q = pubClient()
      .from("posts")
      .select("id,title,opening,url,img_url,published_at,created_at,post_category_id,post_categories(name)", { count: "exact" })
      .eq("status", 1)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (data.categoryId) q = q.eq("post_category_id", data.categoryId);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { posts: rows ?? [], total: count ?? 0, pageSize };
  });

export const getFeaturedPost = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pubClient()
    .from("posts")
    .select("id,title,opening,url,img_url,published_at,created_at,post_categories(name)")
    .eq("status", 1)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { post: data };
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(240) }).parse(d))
  .handler(async ({ data }) => {
    const pub = pubClient();
    const { data: post, error } = await pub
      .from("posts")
      .select("id,title,opening,body,signature,url,img_url,published_at,created_at,meta_description,post_category_id,post_categories(name)")
      .eq("url", data.slug)
      .eq("status", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return { post: null, related: [] };
    const { data: related } = await pub
      .from("posts")
      .select("id,title,opening,url,img_url,created_at,post_categories(name)")
      .eq("status", 1)
      .neq("id", (post as any).id)
      .order("created_at", { ascending: false })
      .limit(3);
    return { post, related: related ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pubClient().from("post_categories").select("id,name").order("name");
  if (error) throw new Error(error.message);
  return { categories: data ?? [] };
});

// ---------- ADMIN CRUD ----------
export const adminListPosts = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin();
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id,title,url,status,published_at,created_at,post_category_id")
    .order("created_at", { ascending: false });
  if (error) { console.error("[adminListPosts] error", error); throw new Error(error.message); }
  const { data: cats } = await supabaseAdmin.from("post_categories").select("id,name");
  const catMap = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
  const posts = (data ?? []).map((p: any) => ({ ...p, post_categories: { name: catMap.get(p.post_category_id) ?? "—" } }));
  console.log("[adminListPosts] returned rows:", posts.length);
  return { posts };
});

export const adminGetPost = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number }) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const { data: post, error } = await supabaseAdmin.from("posts").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return { post };
  });

function normalizeCoverUrl(value?: string | null) {
  if (!value) return null;
  let url = value.trim().replace(/&amp;/g, "&");
  const pastedUrl = url.match(/https?:\/\/[^\s'"<>)]*/i) ?? url.match(/\/\/res\.cloudinary\.com\/[^\s'"<>)]*/i);
  if (pastedUrl) url = pastedUrl[0];
  url = url.replace(/^['"<]+|['">]+$/g, "");
  if (!url) return null;
  if (url.startsWith("//")) url = `https:${url}`;
  url = url.replace(/^http:\/\/res\.cloudinary\.com\//i, "https://res.cloudinary.com/");
  return /^https?:\/\//i.test(url) ? url.replace(/\s+/g, "%20") : null;
}

const PostInput = z.object({
  id: z.number().int().positive().nullable().optional(),
  title: z.string().min(5).max(200),
  opening: z.string().min(10).max(20000),
  body: z.string().min(10).max(80000),
  url: z.string().min(3).max(240).regex(/^[a-z0-9-]+$/),
  meta_description: z.string().max(300).nullable().optional(),
  img_url: z.string().max(5000).nullable().optional(),
  signature: z.string().min(1).max(20),
  post_category_id: z.number().int().positive(),
  status: z.union([z.literal(0), z.literal(1)]),
});

export const adminSavePost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PostInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const payload = {
      title: data.title,
      opening: data.opening,
      body: data.body,
      url: data.url,
      meta_description: data.meta_description ?? null,
      img_url: normalizeCoverUrl(data.img_url),
      signature: data.signature,
      post_category_id: data.post_category_id,
      status: data.status,
      published_at: data.status === 1 ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("posts").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin.from("posts").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number }) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAddCategory = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => z.object({ name: z.string().min(2).max(50) }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const { error } = await supabaseAdmin.from("post_categories").insert({ name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- AI GENERATOR ----------
const AiInput = z.object({
  topic: z.string().min(5).max(500),
  keyword: z.string().min(2).max(200),
  category: z.string().min(1).max(50),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  audience: z.string().max(300).optional().default(""),
});

const AiSchema = {
  name: "create_seo_article",
  description: "Crea un articolo blog SEO ottimizzato in italiano",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", description: "Titolo SEO max 60 caratteri" },
      slug: { type: "string", description: "Slug url-friendly minuscolo, parole separate da -" },
      meta_description: { type: "string", description: "Meta description 130-155 caratteri" },
      opening: { type: "string", description: "Hook iniziale 1-2 frasi (no 'in questo articolo')" },
      body_html: {
        type: "string",
        description:
          "HTML semantico dell'articolo: solo <h2>, <h3>, <p>, <ul><li>, <strong>, <em>, <a href>, <blockquote>, <img src alt>. Niente <h1>, niente <html>/<body>/<script>/<style>. Italiano naturale, ricco e umano.",
      },
    },
    required: ["title", "slug", "meta_description", "opening", "body_html"],
  },
} as const;

function sanitizeHtml(html: string): string {
  let h = html;
  h = h.replace(/<\/?(html|body|head|script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>/gi, "");
  h = h.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "<h2>$1</h2>");
  h = h.replace(/\son\w+="[^"]*"/gi, "");
  h = h.replace(/\son\w+='[^']*'/gi, "");
  h = h.replace(/javascript:/gi, "");
  return h.trim();
}

export const aiGenerateArticle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AiInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY non configurata");

    const system = `Sei un editor senior di un magazine italiano B2B su lead generation, LinkedIn e CRM (LORI CRM).
Scrivi articoli editoriali professionali, naturali, mai "tono AI". Frasi variate, esempi concreti, dati realistici.
Vietato: introduzioni tipo "In questo articolo vedremo", elenchi inutili, ripetizioni.
Struttura HTML: solo <h2>, <h3>, <p>, <ul><li>, <strong>, <em>, <a>, <blockquote>. Mai <h1>.
Lunghezza body: 900-1500 parole. Integra la keyword in modo naturale (densità ~1%).
${data.imageUrl ? `Includi UNA <img src="${data.imageUrl}" alt="..."> contestuale dopo il primo <h2>, con alt descrittivo SEO.` : "Niente <img>."}`;

    const user = `Argomento: ${data.topic}
Keyword target: ${data.keyword}
Categoria: ${data.category}
${data.audience ? `Pubblico: ${data.audience}` : ""}
Genera l'articolo completo.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [{ type: "function", function: AiSchema }],
        tool_choice: { type: "function", function: { name: AiSchema.name } },
      }),
    });
    if (res.status === 429) throw new Error("Limite di utilizzo AI raggiunto. Riprova tra poco.");
    if (res.status === 402) throw new Error("Crediti AI esauriti. Aggiungi credito al workspace Lovable.");
    if (!res.ok) throw new Error(`Gateway AI errore ${res.status}`);
    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!call) throw new Error("Risposta AI non valida");
    const parsed = JSON.parse(call) as {
      title: string; slug: string; meta_description: string; opening: string; body_html: string;
    };
    const slug = slugify(parsed.slug || parsed.title, { lower: true, strict: true }).slice(0, 240);
    let body = sanitizeHtml(parsed.body_html);
    try {
      body = await planAndGenerateInlineImages(body, data.topic, data.keyword, slug);
    } catch (e) {
      console.error("[aiGenerateArticle] inline images failed:", (e as Error).message);
    }
    return {
      title: parsed.title.slice(0, 100),
      slug,
      meta_description: parsed.meta_description.slice(0, 160),
      opening: parsed.opening,
      body,
    };
  });

export const slugifyServer = createServerFn({ method: "POST" })
  .inputValidator((d: { value: string }) => z.object({ value: z.string().min(1).max(240) }).parse(d))
  .handler(async ({ data }) => ({ slug: slugify(data.value, { lower: true, strict: true }).slice(0, 240) }));

// ---------- SEO INTELLIGENCE (AI) ----------

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function callGateway(system: string, user: string, tool: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY non configurata");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [{ type: "function", function: tool }],
      tool_choice: { type: "function", function: { name: tool.name } },
    }),
  });
  if (res.status === 429) throw new Error("Limite AI raggiunto, riprova tra poco");
  if (res.status === 402) throw new Error("Crediti AI esauriti");
  if (!res.ok) throw new Error(`Gateway AI errore ${res.status}`);
  const json = await res.json();
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Risposta AI non valida");
  return JSON.parse(args);
}

/**
 * Highlight selected SEO keywords inside the existing HTML body.
 * Returns updated HTML. Never re-wraps already-highlighted phrases,
 * never touches text inside <h1>-<h6>, <a>, <code>, <pre>.
 */
export const aiSeoHighlight = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string; keyword?: string }) =>
    z.object({ html: z.string().min(20).max(120000), keyword: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const plain = stripTags(data.html).slice(0, 12000);
    const wordCount = plain.split(/\s+/).length;
    const maxHighlights = Math.min(20, Math.max(6, Math.floor(wordCount / 140)));
    const tool = {
      name: "pick_seo_keywords",
      description: "Seleziona le keyword/long-tail più importanti per il SEO dell'articolo",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          primary: {
            type: "array",
            description: `Da 2 a 4 keyword PRIMARIE (la più importante per prima). Devono esistere ESATTAMENTE nel testo (case-insensitive).`,
            items: { type: "string" },
          },
          secondary: {
            type: "array",
            description: `Fino a ${maxHighlights} keyword secondarie/long-tail rilevanti, presenti ESATTAMENTE nel testo.`,
            items: { type: "string" },
          },
        },
        required: ["primary", "secondary"],
      },
    };
    const sys = `Sei un SEO editor. Scegli keyword realmente presenti nel testo, evita stuffing, prediligi frasi distintive (2-4 parole). Niente parole troppo generiche. ${data.keyword ? `Keyword target dichiarata: "${data.keyword}".` : ""}`;
    const picks = await callGateway(sys, plain, tool) as { primary: string[]; secondary: string[] };

    const primary = (picks.primary ?? []).filter(Boolean).slice(0, 4);
    const secondary = (picks.secondary ?? []).filter(Boolean).slice(0, maxHighlights);

    // Apply highlights to body HTML, skipping protected tags.
    let html = data.html;
    // Remove previously generated SEO highlights so we can re-run safely.
    html = html.replace(/<strong class="seo-highlight-(primary|secondary)">([\s\S]*?)<\/strong>/gi, "$2");

    const protectedBlock = /<(h[1-6]|a|code|pre)[^>]*>[\s\S]*?<\/\1>/gi;
    const placeholders: string[] = [];
    html = html.replace(protectedBlock, (m) => {
      placeholders.push(m);
      return `\u0000${placeholders.length - 1}\u0000`;
    });

    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wrap = (term: string, cls: "primary" | "secondary") => {
      const re = new RegExp(`\\b(${escapeRe(term)})\\b(?![^<]*>)`, "i");
      let replaced = false;
      html = html.replace(re, (m) => {
        if (replaced) return m;
        replaced = true;
        return `<strong class="seo-highlight-${cls}">${m}</strong>`;
      });
    };
    primary.forEach((t) => wrap(t, "primary"));
    secondary.forEach((t) => wrap(t, "secondary"));

    html = html.replace(/\u0000(\d+)\u0000/g, (_, i) => placeholders[Number(i)]);
    return { html, primary, secondary };
  });

export const aiGenerateTitle = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string; keyword?: string }) =>
    z.object({ html: z.string().min(20).max(120000), keyword: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const tool = {
      name: "make_title",
      parameters: {
        type: "object", additionalProperties: false,
        properties: { title: { type: "string", description: "Titolo SEO 50-60 caratteri, accattivante, con keyword" } },
        required: ["title"],
      },
    };
    const out = await callGateway(
      `Sei un copywriter SEO. Produci un titolo italiano potente, 50-60 caratteri, naturale.${data.keyword ? ` Keyword: "${data.keyword}".` : ""}`,
      stripTags(data.html).slice(0, 4000),
      tool,
    );
    return { title: String(out.title || "").slice(0, 80) };
  });

export const aiGenerateMeta = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string; keyword?: string }) =>
    z.object({ html: z.string().min(20).max(120000), keyword: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const tool = {
      name: "make_meta",
      parameters: {
        type: "object", additionalProperties: false,
        properties: { meta: { type: "string", description: "Meta description 140-155 caratteri, include keyword, una CTA implicita" } },
        required: ["meta"],
      },
    };
    const out = await callGateway(
      `Sei un SEO copywriter. Scrivi una meta description italiana 140-155 caratteri.${data.keyword ? ` Keyword: "${data.keyword}".` : ""}`,
      stripTags(data.html).slice(0, 4000),
      tool,
    );
    return { meta: String(out.meta || "").slice(0, 160) };
  });

export const aiGenerateFaq = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string; keyword?: string }) =>
    z.object({ html: z.string().min(20).max(120000), keyword: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const tool = {
      name: "make_faq",
      parameters: {
        type: "object", additionalProperties: false,
        properties: {
          items: {
            type: "array",
            description: "4-6 FAQ pertinenti all'articolo",
            items: {
              type: "object", additionalProperties: false,
              properties: { q: { type: "string" }, a: { type: "string" } },
              required: ["q", "a"],
            },
          },
        },
        required: ["items"],
      },
    };
    const out = await callGateway(
      `Sei un SEO editor. Crea FAQ italiane utili (no banalità), risposte 1-3 frasi.${data.keyword ? ` Keyword: "${data.keyword}".` : ""}`,
      stripTags(data.html).slice(0, 6000),
      tool,
    ) as { items: { q: string; a: string }[] };
    const items = (out.items ?? []).slice(0, 8);
    const html =
      `<h2>Domande frequenti</h2>` +
      items.map((i) => `<h3>${escapeHtml(i.q)}</h3><p>${escapeHtml(i.a)}</p>`).join("");
    return { items, html };
  });

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- INLINE AI IMAGES ----------

function countWords(html: string): number {
  return stripTags(html).split(/\s+/).filter(Boolean).length;
}

async function generateImagePng(prompt: string): Promise<Uint8Array> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY non configurata");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (res.status === 429) throw new Error("Limite AI immagini raggiunto");
  if (res.status === 402) throw new Error("Crediti AI esauriti");
  if (!res.ok) throw new Error(`Gateway immagini errore ${res.status}: ${await res.text().catch(() => "")}`);
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Nessuna immagine ricevuta dal gateway");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function uploadInlineImage(slugBase: string, bytes: Uint8Array): Promise<string> {
  const path = `${slugBase}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error } = await supabaseAdmin.storage
    .from("post-images")
    .upload(path, bytes, { contentType: "image/png", upsert: false });
  if (error) throw new Error(`Upload immagine fallito: ${error.message}`);
  // Bucket è privato → servi tramite proxy pubblico stabile
  return `/api/public/post-image/${path}`;
}

function injectImagesAfterH2(html: string, items: { afterIndex: number; url: string; alt: string }[]): string {
  if (items.length === 0) return html;
  // Locate each </h2> position
  const closes: number[] = [];
  const re = /<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) closes.push(m.index + m[0].length);
  if (closes.length === 0) return html + items.map((i) => `<p><img src="${i.url}" alt="${escapeHtml(i.alt)}" /></p>`).join("");

  // Sort descending so insert positions stay valid
  const sorted = [...items].sort((a, b) => b.afterIndex - a.afterIndex);
  let out = html;
  for (const it of sorted) {
    const idx = Math.min(Math.max(0, it.afterIndex), closes.length - 1);
    const pos = closes[idx];
    const tag = `<p><img src="${it.url}" alt="${escapeHtml(it.alt)}" loading="lazy" /></p>`;
    out = out.slice(0, pos) + tag + out.slice(pos);
  }
  return out;
}

async function planAndGenerateInlineImages(html: string, topic: string, keyword: string, slugBase: string): Promise<string> {
  const words = countWords(html);
  const h2Count = (html.match(/<\/h2>/gi) ?? []).length;
  if (h2Count === 0) return html;
  // 1 image per ~450 words, min 1, max 3
  const n = Math.min(3, Math.max(1, Math.floor(words / 450)));
  const tool = {
    name: "plan_inline_images",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        images: {
          type: "array",
          description: `Esattamente ${n} immagini da inserire nell'articolo, una per sezione diversa.`,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              after_h2_index: { type: "integer", description: `Indice 0-based dell'<h2> dopo cui inserire (0..${h2Count - 1}).` },
              prompt: { type: "string", description: "Prompt fotorealistico in inglese, dettagliato, scenario business B2B coerente con il paragrafo. No testo nell'immagine, no loghi, no volti riconoscibili." },
              alt: { type: "string", description: "Alt text SEO in italiano (max 120 caratteri) coerente con la sezione." },
            },
            required: ["after_h2_index", "prompt", "alt"],
          },
        },
      },
      required: ["images"],
    },
  };
  const plain = stripTags(html).slice(0, 8000);
  const plan = await callGateway(
    `Sei un art director per articoli B2B su lead generation e LinkedIn. Pianifica ${n} immagini editoriali coerenti col testo. Stile: fotografico moderno, illuminazione naturale, niente testo nell'immagine.`,
    `Argomento: ${topic}\nKeyword: ${keyword}\n\nArticolo (testo):\n${plain}`,
    tool,
  ) as { images: { after_h2_index: number; prompt: string; alt: string }[] };

  const picks = (plan.images ?? []).slice(0, n);
  const generated: { afterIndex: number; url: string; alt: string }[] = [];
  for (const p of picks) {
    try {
      const bytes = await generateImagePng(p.prompt);
      const url = await uploadInlineImage(slugBase, bytes);
      generated.push({ afterIndex: p.after_h2_index, url, alt: p.alt });
    } catch (e) {
      console.error("[inline image] skip:", (e as Error).message);
    }
  }
  return injectImagesAfterH2(html, generated);
}

export const aiAddInlineImages = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string; topic?: string; keyword?: string; slug?: string }) =>
    z.object({
      html: z.string().min(20).max(120000),
      topic: z.string().max(500).optional().default(""),
      keyword: z.string().max(200).optional().default(""),
      slug: z.string().max(240).optional().default(""),
    }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const slugBase = (data.slug || "post").replace(/[^a-z0-9-]/gi, "-").slice(0, 60) || "post";
    const html = await planAndGenerateInlineImages(data.html, data.topic, data.keyword, slugBase);
    return { html };
  });

export const aiSuggestInternalLinks = createServerFn({ method: "POST" })
  .inputValidator((d: { html: string; excludeId?: number | null }) =>
    z.object({ html: z.string().min(20).max(120000), excludeId: z.number().int().positive().nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    await assertAdmin();
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("id,title,url,opening")
      .eq("status", 1)
      .order("created_at", { ascending: false })
      .limit(40);
    const pool = (posts ?? []).filter((p) => !data.excludeId || p.id !== data.excludeId);
    if (pool.length === 0) return { suggestions: [] as { title: string; url: string; anchor: string }[] };

    const tool = {
      name: "pick_links",
      parameters: {
        type: "object", additionalProperties: false,
        properties: {
          picks: {
            type: "array",
            items: {
              type: "object", additionalProperties: false,
              properties: {
                url: { type: "string", description: "slug url dell'articolo scelto dalla lista" },
                anchor: { type: "string", description: "anchor text breve e naturale, presente o quasi-presente nell'articolo sorgente" },
              },
              required: ["url", "anchor"],
            },
          },
        },
        required: ["picks"],
      },
    };
    const candidates = pool.map((p) => `- ${p.url} | ${p.title} | ${(p.opening || "").slice(0, 140)}`).join("\n");
    const out = await callGateway(
      `Sei un SEO editor. Scegli al massimo 5 articoli realmente pertinenti all'articolo sorgente per internal linking. Solo url dalla lista.`,
      `ARTICOLO SORGENTE:\n${stripTags(data.html).slice(0, 4000)}\n\nCANDIDATI:\n${candidates}`,
      tool,
    ) as { picks: { url: string; anchor: string }[] };

    const byUrl = new Map(pool.map((p) => [p.url, p]));
    const suggestions = (out.picks ?? [])
      .filter((p) => byUrl.has(p.url))
      .slice(0, 5)
      .map((p) => ({ url: p.url, anchor: p.anchor.slice(0, 80), title: byUrl.get(p.url)!.title as string }));
    return { suggestions };
  });
