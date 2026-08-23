# LORI CRM — Landing Page & Magazine

Landing page pubblica e magazine di LORI CRM, con area riservata per la
redazione degli articoli e la gestione delle consulenze.

**Stack:** TanStack Start (SSR) + React 19 + Tailwind CSS 4 + shadcn/ui + Supabase.
**Deploy:** Vercel (funzione Node `api/index.mjs` che serve il bundle SSR).

Il progetto è autonomo: nessuna dipendenza da Lovable, né in build né a runtime.

## Struttura

| Area | File |
|---|---|
| Landing page | `src/routes/index.tsx` (tutte le sezioni + mockup animati) |
| Magazine | `src/routes/magazine.tsx` (ricerca, filtri categoria, articolo in evidenza, paginazione) |
| Pagina articolo | `src/routes/blog.$slug.tsx` (TOC, barra di lettura, share, FAQ JSON-LD, correlati) |
| Area riservata | `src/routes/admin*.tsx` (login, elenco e editor articoli, consulenze) |
| Shell e SEO | `src/routes/__root.tsx`, `src/routes/sitemap[.]xml.ts`, `public/robots.txt` |
| Header / Footer | `src/components/site-header.tsx`, `site-footer.tsx` |
| Layer server | `src/lib/blog.functions.ts`, `src/lib/admin.server.ts` |
| Client Supabase | `src/integrations/supabase/client.ts` (anon), `client.server.ts` (service role) |
| Proxy immagini | `src/routes/api/public/post-image.$.ts` |
| Design system | `src/styles.css` (token oklch, tipografia fluida, evidenziazione SEO) |
| Schema database | `supabase/migrations/*.sql`, `supabase/config.toml` |

`src/routeTree.gen.ts` è generato dal plugin TanStack Router al primo `npm run dev`
o `npm run build`: non va committato.

### Cosa fa il layer server

`src/lib/blog.functions.ts` raccoglie tutte le server function:

- **Auth admin** — login via Supabase + verifica ruolo in `user_roles`, sessione su cookie `lori_admin_uid` (httpOnly).
- **Consulenze** — generazione slot (lun–ven, 9–18, ogni 30 min, 14 giorni), prenotazione con anti doppia-prenotazione, gestione stati.
- **Waitlist** — iscrizioni `launch_notifications`.
- **Blog pubblico** — elenco post paginato (9 per pagina), articolo in evidenza, articolo per slug + correlati.
- **CRUD admin** — creazione/modifica/eliminazione post e categorie, normalizzazione URL copertina.
- **AI SEO** — generazione articolo completo, titolo, meta description, FAQ, evidenziazione keyword in stile RankMath, suggerimento link interni, generazione e inserimento immagini inline.

## Backend Supabase

La landing usa un progetto Supabase **distinto da quello del CRM**:

| Progetto | Supabase ref |
|---|---|
| Landing / magazine (questo repo) | `kqzwtmesteksllmzdxoo` |
| CRM (`app.lori-crm.it`) | `miqesculjotuintesbiw` — ref storico, non più attivo (non risolve) |

Sono due backend separati: modificare l'uno non ha effetto sull'altro. Articoli del
magazine, consulenze e waitlist vivono in quello della landing. Il ref del CRM qui
sopra è quello storico dell'epoca Lovable e non è più attivo: se serve, va
riletto dal repository del CRM.

Tabelle: `posts`, `post_categories`, `consultations`, `launch_notifications`,
`user_roles`. Le immagini degli articoli stanno nel bucket **privato** `post-images`
e sono servite dal proxy pubblico `/api/public/post-image/*`.

### Accesso all'area riservata

`/admin` autentica contro Supabase Auth e richiede che l'utente abbia una riga in
`user_roles` con `role = 'admin'`:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'indirizzo@esempio.it'
on conflict do nothing;
```

L'utente va creato prima da **Authentication → Users** nella dashboard Supabase.

### Nessuna eredità dal backend Lovable

Il backend precedente della landing era `jmgiupcnsknaxgeegjwf`, provisionato da
Lovable Cloud su un account non accessibile. Quell'host non ha più un record DNS
— `jmgiupcnsknaxgeegjwf.supabase.co` non risolve, come un ref inesistente — e i
suoi dati non sono recuperabili. Il progetto Supabase indicato sopra è quindi
l'unica fonte di verità: nasce vuoto, con le sole categorie di partenza.

Il progetto Lovable `lori-landig-page` punta ancora a quel ref (lo dichiarano
sia il suo `.env` sia il suo `supabase/config.toml`) e va considerato archiviato.

La conferma è arrivata dall'agente Lovable stesso, interrogato dall'interno della
sua infrastruttura: ogni query sul database fallisce con
`SUPABASE_INTERNAL_ERROR / status 544 / Connection terminated due to connection timeout`,
e il ref configurato a runtime resta `jmgiupcnsknaxgeegjwf`. Non esiste quindi un
secondo database a cui i dati siano stati spostati. Articoli, consulenze e
iscrizioni del vecchio magazine non sono recuperabili.

Le immagini di copertina fanno eccezione: erano ospitate su Cloudinary, servizio
esterno, e il database conteneva solo il loro URL. Restano quindi disponibili
nella Media Library di quell'account.

### Nota sulle policy admin lato client

`has_role` è eseguibile solo da `service_role`: le policy RLS che la invocano
(consulenze, waitlist, `user_roles`, upload immagini) non sono quindi operative
per un utente `authenticated` che interroghi il database dal browser. Non
impatta l'applicazione, perché ogni operazione admin passa dal server con la
service role key. Se un domani servissero query admin lato client, va aggiunto
`GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;`.

## Setup

```bash
npm install
cp .env.example .env    # inserisci le chiavi reali
npm run dev
```

### Variabili d'ambiente

| Variabile | Serve a |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | letture pubbliche lato server (magazine, articoli, sitemap) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | client Supabase nel browser |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo server**: area admin, consulenze, upload immagini. Mai esporre al client |
| `AI_GATEWAY_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_MODEL_FAST` | generazione articoli, titoli, meta e FAQ |
| `AI_IMAGE_URL`, `AI_IMAGE_MODEL` | generazione immagini (facoltative) |

URL e publishable key hanno un default nel codice, così le pagine pubbliche
funzionano anche senza `.env`. La service role key non ha default: senza di essa
l'area riservata e le prenotazioni restituiscono errore.

## Deploy su Vercel

`vercel.json` instrada tutte le richieste alla funzione `api/index.mjs`, che
converte la richiesta Node in `Request` Web e la passa al server SSR prodotto da
`npm run build` (`dist/server/server.js`); gli asset statici arrivano da
`dist/client`.

Le variabili d'ambiente vanno impostate nel progetto Vercel: senza
`SUPABASE_SERVICE_ROLE_KEY` la parte pubblica funziona, l'area riservata no.

## Collegamento con il CRM

Le CTA della landing puntano a `https://app.lori-crm.it`. Il codice del CRM è in
un repository separato.
