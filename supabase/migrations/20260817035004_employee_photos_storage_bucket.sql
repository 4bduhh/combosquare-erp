-- Employee Photos Storage Bucket
-- Creates a private storage bucket for employee profile pictures.
-- Files are scoped per-user so one admin cannot access another's photos.
-- Bucket is private; images served via signed URLs from the frontend.

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'employee-photos',
  'employee-photos',
  false,
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- SELECT: users can read their own files
DROP POLICY IF EXISTS "read_own_employee_photos" ON storage.objects;
CREATE POLICY "read_own_employee_photos" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT: users can upload to their own folder
DROP POLICY IF EXISTS "insert_own_employee_photos" ON storage.objects;
CREATE POLICY "insert_own_employee_photos" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: users can update their own files
DROP POLICY IF EXISTS "update_own_employee_photos" ON storage.objects;
CREATE POLICY "update_own_employee_photos" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: users can delete their own files
DROP POLICY IF EXISTS "delete_own_employee_photos" ON storage.objects;
CREATE POLICY "delete_own_employee_photos" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
