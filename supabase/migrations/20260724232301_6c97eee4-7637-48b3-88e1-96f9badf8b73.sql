CREATE TABLE public.consultations (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  slot_at timestamptz NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.consultations TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.consultations_id_seq TO anon, authenticated;
GRANT ALL ON public.consultations TO service_role;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can insert consultations" ON public.consultations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
