
CREATE TABLE public.post_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  opening TEXT NOT NULL,
  body TEXT NOT NULL,
  signature VARCHAR(20) NOT NULL DEFAULT 'LORI Team',
  url VARCHAR(240) NOT NULL UNIQUE,
  img_url VARCHAR(240),
  published_at TIMESTAMPTZ,
  meta_description TEXT,
  status SMALLINT NOT NULL DEFAULT 0,
  post_category_id BIGINT NOT NULL REFERENCES public.post_categories(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX idx_posts_category ON public.posts(post_category_id);
CREATE INDEX idx_posts_url ON public.posts(url);

ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON public.post_categories
  FOR SELECT USING (true);

CREATE POLICY "posts_public_read_published" ON public.posts
  FOR SELECT USING (status = 1);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.post_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed categorie iniziali (come da progetto Bizpower/LORI)
INSERT INTO public.post_categories (name) VALUES
  ('Lead Gen'),
  ('LinkedIn'),
  ('News e novità'),
  ('Prodotti digitali'),
  ('CRM');
