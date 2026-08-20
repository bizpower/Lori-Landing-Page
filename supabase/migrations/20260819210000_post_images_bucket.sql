-- Bucket delle immagini degli articoli. Nel progetto Lovable era stato creato
-- dall'interfaccia, quindi non compariva nelle migrazioni: senza questo file lo
-- schema non era riproducibile su un progetto Supabase nuovo.
--
-- Il bucket è privato: le immagini sono servite dal proxy pubblico
-- `/api/public/post-image/*`, che scarica con la service role key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;
