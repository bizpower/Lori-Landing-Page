-- Export dei dati dal VECCHIO progetto Supabase della landing
-- (ref jmgiupcnsknaxgeegjwf, quello gestito da Lovable) verso il nuovo
-- (ref kqzwtmesteksllmzdxoo).
--
-- COME SI USA
-- 1. Apri il SQL Editor del progetto VECCHIO ed esegui questo file.
-- 2. Copia il contenuto dell'unica cella del risultato.
-- 3. Incollalo nel SQL Editor del progetto NUOVO ed esegui.
--
-- Lo script generato è idempotente: rieseguirlo non duplica nulla, perché
-- salta le righe già presenti (articoli per `url`, categorie per `name`,
-- consulenze per `slot_at`, iscrizioni per email + data).
--
-- Le categorie sono riagganciate PER NOME, non per id: i BIGSERIAL dei due
-- database sono indipendenti e non devono essere forzati.
--
-- SE L'OUTPUT È TROPPO GRANDE per la cella del SQL Editor (articoli lunghi),
-- esegui una sezione alla volta commentando gli altri blocchi `UNION ALL`,
-- oppure esporta le tabelle in CSV dal Table Editor e passami i file.
--
-- ATTENZIONE ALLE IMMAGINI: se `img_url` contiene percorsi tipo
-- `/api/public/post-image/...`, i file stanno nel bucket `post-images` del
-- progetto vecchio e vanno ricaricati a parte in quello nuovo (Storage →
-- post-images), mantenendo lo stesso percorso. Le URL assolute (Cloudinary
-- e simili) continuano invece a funzionare senza interventi.

SELECT string_agg(stmt, E'\n' ORDER BY ord, sub) AS script_da_incollare
FROM (
  -- 1. Categorie
  SELECT 1 AS ord, name AS sub, format(
    'INSERT INTO public.post_categories (name, created_at) SELECT %L, %L::timestamptz WHERE NOT EXISTS (SELECT 1 FROM public.post_categories WHERE name = %L);',
    name, created_at, name
  ) AS stmt
  FROM public.post_categories

  UNION ALL

  -- 2. Articoli (categoria riagganciata per nome)
  SELECT 2, p.url, format(
    'INSERT INTO public.posts (title, opening, body, signature, url, img_url, published_at, meta_description, status, post_category_id, created_at) '
    || 'SELECT %L, %L, %L, %L, %L, %L, %L::timestamptz, %L, %s, (SELECT id FROM public.post_categories WHERE name = %L), %L::timestamptz '
    || 'WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE url = %L);',
    p.title, p.opening, p.body, p.signature, p.url, p.img_url, p.published_at,
    p.meta_description, p.status, c.name, p.created_at, p.url
  )
  FROM public.posts p
  JOIN public.post_categories c ON c.id = p.post_category_id

  UNION ALL

  -- 3. Consulenze prenotate
  SELECT 3, to_char(k.slot_at, 'YYYYMMDDHH24MI'), format(
    'INSERT INTO public.consultations (name, email, phone, company, slot_at, status, created_at) '
    || 'SELECT %L, %L, %L, %L, %L::timestamptz, %L, %L::timestamptz '
    || 'WHERE NOT EXISTS (SELECT 1 FROM public.consultations WHERE slot_at = %L::timestamptz);',
    k.name, k.email, k.phone, k.company, k.slot_at, k.status, k.created_at, k.slot_at
  )
  FROM public.consultations k

  UNION ALL

  -- 4. Iscrizioni al lancio
  SELECT 4, n.email || n.created_at::text, format(
    'INSERT INTO public.launch_notifications (name, email, phone, company, created_at) '
    || 'SELECT %L, %L, %L, %L, %L::timestamptz '
    || 'WHERE NOT EXISTS (SELECT 1 FROM public.launch_notifications WHERE email = %L AND created_at = %L::timestamptz);',
    n.name, n.email, n.phone, n.company, n.created_at, n.email, n.created_at
  )
  FROM public.launch_notifications n
) t;
