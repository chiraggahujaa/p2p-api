-- Setup storage RLS policies
-- This migration configures proper RLS policies for file uploads
-- Note: Storage buckets and RLS enabling should be done via Supabase Dashboard

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view public files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;

-- Create permissive storage RLS policies for now

-- Allow all authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow public access to files in public buckets
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('images', 'videos', 'uploads') OR auth.role() = 'service_role');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.role() = 'service_role'
  );