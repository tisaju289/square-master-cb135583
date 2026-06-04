DROP POLICY IF EXISTS "Anyone can create generated images" ON public.generated_images;

CREATE POLICY "Anyone can create valid generated images"
ON public.generated_images
FOR INSERT
TO anon, authenticated
WITH CHECK (
  key ~ '^[a-zA-Z0-9._-]+$'
  AND content_type LIKE 'image/%'
  AND length(data_base64) <= 30000000
);