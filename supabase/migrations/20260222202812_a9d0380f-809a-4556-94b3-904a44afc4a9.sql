-- Fix: Public Storage Write Access Enables Abuse + Missing comprehensive RLS on storage.objects
-- Bucket: enxoval-images

-- Ensure bucket is public for READ (existing) - no change needed here.

-- Remove overly-permissive policies (if they exist)
DROP POLICY IF EXISTS "Public upload" ON storage.objects;
DROP POLICY IF EXISTS "Public update" ON storage.objects;
DROP POLICY IF EXISTS "Public delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

-- 1) Keep PUBLIC read access for displaying images in the app
CREATE POLICY "Public can read enxoval images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'enxoval-images');

-- 2) Restrict uploads to authenticated users only (and enforce ownership)
CREATE POLICY "Authenticated can upload enxoval images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'enxoval-images'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

-- 3) Restrict updates to owner only
CREATE POLICY "Users can update own enxoval images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'enxoval-images'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'enxoval-images'
  AND owner = auth.uid()
);

-- 4) Restrict deletes to owner only
CREATE POLICY "Users can delete own enxoval images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'enxoval-images'
  AND owner = auth.uid()
);