CREATE TABLE public.launch_notifications (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.launch_notifications TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.launch_notifications_id_seq TO anon, authenticated;
GRANT ALL ON public.launch_notifications TO service_role;
GRANT ALL ON SEQUENCE public.launch_notifications_id_seq TO service_role;
ALTER TABLE public.launch_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can subscribe" ON public.launch_notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
