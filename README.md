# LORI CRM — Landing Page & Magazine

Landing page pubblica e magazine di LORI CRM, estratti dal progetto Lovable
`lori-landig-page` per poter essere sviluppati e ospitati in autonomia.

**Stack:** TanStack Start (SSR) + React 19 + Tailwind CSS 4 + shadcn/ui + Supabase.

> ⚠️ **Estrazione parziale.** Questo repository contiene la parte pubblica del sito
> (landing, magazine, pagina articolo) e tutto il layer server. Alcuni file non sono
> ancora stati estratti da Lovable: vedi [Stato dell'estrazione](#stato-dellestrazione).
> Allo stato attuale il progetto **non compila** finché non vengono aggiunti i file mancanti.

## Cos'è già qui

| Area | File |
|---|---|
| Landing page completa | `src/routes/index.tsx` (994 righe, tutte le sezioni + mockup animati) |
| Magazine | `src/routes/magazine.tsx` (lista, ricerca, filtri categoria, articolo in evidenza) |
| Pagina articolo | `src/routes/blog.$slug.tsx` (TOC, barra di lettura, share, FAQ JSON-LD, correlati) |
| Shell e SEO | `src/routes/__root.tsx` (meta, Open Graph, Schema.org), `src/router.tsx` |
| Header / Footer | `src/components/site-header.tsx`, `site-footer.tsx` |
| Layer server | `src/lib/blog.functions.ts` (~700 righe), `src/lib/admin.server.ts` |
| Client Supabase | `src/integrations/supabase/client.ts`, `client.server.ts` |
| Design system | `src/styles.css` (token oklch, tipografia fluida, evidenziazione SEO) |
| Config | `package.json`, `vite.config.ts`, `.env.example` |

### Cosa fa il layer server

`src/lib/blog.functions.ts` raccoglie tutte le server function:

- **Auth admin** — login via Supabase + verifica ruolo in `user_roles`, sessione su cookie `lori_admin_uid` (httpOnly).
- **Consulenze** — generazione slot (lun–ven, 9–18, ogni 30 min, 14 giorni), prenotazione con anti doppia-prenotazione, gestione stati.
- **Waitlist** — iscrizioni `launch_notifications`.
- **Blog pubblico** — elenco post paginato, articolo in evidenza, articolo per slug + correlati.
- **CRUD admin** — creazione/modifica/eliminazione post e categorie, normalizzazione URL copertina.
- **AI SEO** — generazione articolo completo, titolo, meta description, FAQ, evidenziazione keyword in stile RankMath, suggerimento link interni, generazione e inserimento immagini inline.

## Stato dell'estrazione

### Da completare

| File | Note |
|---|---|
| `src/routes/admin*.tsx` (5 file) | Area riservata: login, elenco post, editor, consulenze |
| `src/routes/api/public/post-image.$.ts` | Proxy pubblico per le immagini nel bucket privato |
| `src/routes/sitemap[.]xml.ts` | Sitemap dinamica |
| `src/components/consultation-dialog.tsx` | Dialog prenotazione, usato dalla landing |
| `src/components/post-editor-form.tsx`, `tiptap-editor.tsx`, `article-converter.tsx` | Editor articoli e convertitore PDF→Excel |
| `src/components/ui/*.tsx` (45 file) | Componenti shadcn/ui — rigenerabili con `npx shadcn@latest add` |
| `src/integrations/supabase/types.ts`, `auth-attacher.ts`, `auth-middleware.ts` | Tipi del database e middleware auth |
| `src/lib/utils.ts`, `converters.ts` | Utility (`cn`) e conversione documenti |
| `src/hooks/use-mobile.tsx` | Hook breakpoint |
| `supabase/migrations/*.sql` (10 file) + `config.toml` | Schema: posts, post_categories, consultations, launch_notifications, user_roles, storage |
| `tsconfig.json`, `components.json`, `eslint.config.js`, `.prettierrc`, `wrangler.jsonc` | Configurazioni |
| `src/assets/lori-logo.svg`, `public/favicon.svg`, `public/robots.txt` | Asset |

`src/routeTree.gen.ts` è generato automaticamente dal plugin TanStack Router al primo
`npm run dev` — non va estratto.

## Backend Supabase

La landing usa un progetto Supabase **distinto da quello del CRM**:

| Progetto | Supabase ref |
|---|---|
| Landing / magazine (questo repo) | `jmgiupcnsknaxgeegjwf` |
| CRM (`app.lori-crm.it`) | `miqesculjotuintesbiw` |

Sono due database separati: modificare l'uno non ha effetto sull'altro. Gli articoli
del magazine, le consulenze e la waitlist vivono nel primo; utenti e dati CRM nel secondo.

L'area riservata (`/admin`) autentica contro Supabase Auth e richiede una riga in
`user_roles` con `role = 'admin'` per l'utente che accede.

## Setup

```bash
npm install
cp .env.example .env    # inserisci le chiavi reali
npm run dev
```

La build di produzione (`npm run build`) produce un output Cloudflare Workers
(`wrangler.jsonc` è incluso nella configurazione Lovable).

## Dipendenza da Lovable

Il progetto conserva una dipendenza dall'ecosistema Lovable: **`@lovable.dev/vite-tanstack-config`**,
il preset che fornisce l'intera configurazione Vite (TanStack Start, React, Tailwind, adapter
Cloudflare, alias `@`, iniezione delle variabili `VITE_*`). È un pacchetto pubblico su npm,
quindi il progetto compila e gira anche fuori da Lovable senza modifiche.

Per rimuoverlo del tutto va riscritto `vite.config.ts` dichiarando esplicitamente quei plugin.
Non è stato fatto qui per non introdurre una riscrittura non verificabile della build.

Le funzioni AI puntano al gateway `ai.gateway.lovable.dev` tramite `LOVABLE_API_KEY`.
Restano funzionanti finché la chiave è valida; per cambiare provider vanno modificate
le chiamate `fetch` in `src/lib/blog.functions.ts`.

## Collegamento con il CRM

Le CTA della landing puntano a `https://app.lori-crm.it`. Il codice del CRM è in
un repository separato.
