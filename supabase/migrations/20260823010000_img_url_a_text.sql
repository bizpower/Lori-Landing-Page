-- Il validatore applicativo (PostInput in src/lib/blog.functions.ts) accetta
-- img_url fino a 5000 caratteri, mentre la colonna ne accettava 240: un URL
-- Cloudinary con trasformazioni supera quella soglia senza difficoltà, e il
-- salvataggio falliva a livello di database con un messaggio Postgres grezzo
-- mostrato all'utente nell'editor.
ALTER TABLE public.posts ALTER COLUMN img_url TYPE text;

NOTIFY pgrst, 'reload schema';
