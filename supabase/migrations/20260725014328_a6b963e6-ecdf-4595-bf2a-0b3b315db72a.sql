REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

CREATE POLICY "Admins can upload post-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update post-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete post-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
