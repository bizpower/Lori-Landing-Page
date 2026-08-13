
-- Admin-only SELECT policies for contact submissions
CREATE POLICY "admins can view consultations"
ON public.consultations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update consultations"
ON public.consultations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete consultations"
ON public.consultations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can view launch_notifications"
ON public.launch_notifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete launch_notifications"
ON public.launch_notifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten permissive INSERT policies (replace check:true with validated payload)
DROP POLICY IF EXISTS "public can insert consultations" ON public.consultations;
CREATE POLICY "public can insert consultations"
ON public.consultations FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(phone)) BETWEEN 3 AND 40
  AND (company IS NULL OR length(company) <= 200)
  AND slot_at > now()
  AND slot_at < now() + interval '90 days'
);

DROP POLICY IF EXISTS "public can subscribe" ON public.launch_notifications;
CREATE POLICY "public can subscribe"
ON public.launch_notifications FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 1 AND 200
  AND length(btrim(email)) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR length(phone) <= 40)
  AND (company IS NULL OR length(company) <= 200)
);

-- Restrict SECURITY DEFINER function surface: revoke broad EXECUTE, keep only
-- what RLS policies need (authenticated). Anon/public no longer callable.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
