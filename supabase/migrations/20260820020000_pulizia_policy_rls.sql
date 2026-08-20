-- Pulizia delle policy RLS segnalate dal linter di Supabase.
--
-- 1. Policy duplicate. Le migrazioni storiche avevano creato due volte la
--    stessa regola di lettura pubblica (una per nome vecchio, una per nome
--    nuovo): ogni SELECT anonima le valutava entrambe in OR. Resta la seconda.
-- 2. `auth.uid()` nudo dentro una USING viene rivalutato riga per riga.
--    Avvolgerlo in `(select auth.uid())` lo rende un InitPlan calcolato una
--    volta sola. Comportamento identico, costo costante.
-- 3. `admins can view all roles` era ridondante: `admins can manage roles`
--    copre già ALL, quindi anche SELECT, per lo stesso ruolo.

DROP POLICY IF EXISTS "categories_public_read" ON public.post_categories;
DROP POLICY IF EXISTS "posts_public_read_published" ON public.posts;

-- user_roles
DROP POLICY IF EXISTS "users can view own roles" ON public.user_roles;
CREATE POLICY "users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "admins can view all roles" ON public.user_roles;

DROP POLICY IF EXISTS "admins can manage roles" ON public.user_roles;
CREATE POLICY "admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

-- consultations
DROP POLICY IF EXISTS "admins can view consultations" ON public.consultations;
CREATE POLICY "admins can view consultations"
ON public.consultations FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "admins can update consultations" ON public.consultations;
CREATE POLICY "admins can update consultations"
ON public.consultations FOR UPDATE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "admins can delete consultations" ON public.consultations;
CREATE POLICY "admins can delete consultations"
ON public.consultations FOR DELETE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- launch_notifications
DROP POLICY IF EXISTS "admins can view launch_notifications" ON public.launch_notifications;
CREATE POLICY "admins can view launch_notifications"
ON public.launch_notifications FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "admins can delete launch_notifications" ON public.launch_notifications;
CREATE POLICY "admins can delete launch_notifications"
ON public.launch_notifications FOR DELETE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- storage.objects (bucket post-images)
DROP POLICY IF EXISTS "Admins can upload post-images" ON storage.objects;
CREATE POLICY "Admins can upload post-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images' AND public.has_role((SELECT auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can update post-images" ON storage.objects;
CREATE POLICY "Admins can update post-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-images' AND public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (bucket_id = 'post-images' AND public.has_role((SELECT auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can delete post-images" ON storage.objects;
CREATE POLICY "Admins can delete post-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND public.has_role((SELECT auth.uid()), 'admin'));

NOTIFY pgrst, 'reload schema';
