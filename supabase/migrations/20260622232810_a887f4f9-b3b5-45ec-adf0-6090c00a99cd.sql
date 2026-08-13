
CREATE POLICY "Public read post-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'post-images');
