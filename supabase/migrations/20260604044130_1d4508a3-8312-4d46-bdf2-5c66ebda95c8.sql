CREATE TABLE public.generated_images (
  key text PRIMARY KEY,
  content_type text NOT NULL,
  data_base64 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT generated_images_key_format CHECK (key ~ '^[a-zA-Z0-9._-]+$'),
  CONSTRAINT generated_images_content_type_image CHECK (content_type LIKE 'image/%'),
  CONSTRAINT generated_images_data_size CHECK (length(data_base64) <= 30000000)
);

GRANT SELECT, INSERT ON public.generated_images TO anon;
GRANT SELECT, INSERT ON public.generated_images TO authenticated;
GRANT ALL ON public.generated_images TO service_role;

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view generated images"
ON public.generated_images
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can create generated images"
ON public.generated_images
FOR INSERT
TO anon, authenticated
WITH CHECK (true);