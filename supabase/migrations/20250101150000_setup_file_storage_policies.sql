-- Migration: Setup comprehensive file storage RLS policies
-- Created: Consolidated file upload and storage policies with maximum user access
-- Rollback: Run rollbacks/20250101150000_rollback_setup_file_storage_policies.sql

-- Drop existing storage policies if they exist (cleanup from any previous attempts)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view public files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;

-- Create comprehensive and user-friendly storage RLS policies

-- 1. Allow all authenticated users to upload files to any bucket
-- This gives maximum flexibility for file uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT 
  TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

-- 2. Allow public read access to files in public buckets
-- This enables easy sharing of images, videos, and documents
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT 
  TO public, authenticated, anon, service_role
  USING (
    bucket_id IN ('images', 'videos', 'uploads', 'documents', 'avatars', 'public') OR
    auth.role() = 'service_role'
  );

-- 3. Allow users to read their own private files
-- Users can access files they've uploaded even in private buckets
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = (storage.foldername(name))[1] OR
    owner = auth.uid() OR
    auth.role() = 'service_role'
  );

-- 4. Allow users to update their own files
-- Users can replace or modify files they own
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE
  TO authenticated, service_role
  USING (
    auth.uid()::text = (storage.foldername(name))[1] OR
    owner = auth.uid() OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid()::text = (storage.foldername(name))[1] OR
    owner = auth.uid() OR
    auth.role() = 'service_role'
  );

-- 5. Allow users to delete their own files
-- Users can remove files they've uploaded
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE 
  TO authenticated, service_role
  USING (
    auth.uid()::text = (storage.foldername(name))[1] OR
    owner = auth.uid() OR
    auth.role() = 'service_role'
  );

-- 6. Service role has full access (for admin operations and API management)
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Additional RLS policies for file table (database records)
-- These were consolidated from multiple migration files

-- Remove any conflicting file table policies first
DROP POLICY IF EXISTS "Users can view their own files" ON file;
DROP POLICY IF EXISTS "Users can view public files" ON file;
DROP POLICY IF EXISTS "Users can insert their own files" ON file;
DROP POLICY IF EXISTS "Users can update their own files" ON file;
DROP POLICY IF EXISTS "Users can delete their own files" ON file;
DROP POLICY IF EXISTS "Allow file uploads" ON file;
DROP POLICY IF EXISTS "Allow file reads" ON file;
DROP POLICY IF EXISTS "Service role can manage all files" ON file;

-- Recreate comprehensive RLS policies for file table
CREATE POLICY "Users can view their own files" ON file
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public files" ON file
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own files" ON file
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own files" ON file
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON file
    FOR DELETE USING (user_id = auth.uid());

-- Service role can manage all file records (for admin operations)
CREATE POLICY "Service role can manage all files" ON file
    FOR ALL 
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Grant storage permissions to roles
GRANT ALL ON storage.objects TO authenticated, service_role;
GRANT ALL ON storage.buckets TO authenticated, service_role;

-- Grant file table permissions
GRANT ALL ON file TO authenticated, service_role;

-- Create a helper function to organize file paths by user
CREATE OR REPLACE FUNCTION generate_user_file_path(
    user_id UUID,
    file_name TEXT,
    bucket_name TEXT DEFAULT 'uploads'
)
RETURNS TEXT AS $$
BEGIN
    -- Generate a user-organized path: bucket/user_id/filename
    RETURN user_id::TEXT || '/' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can access file
CREATE OR REPLACE FUNCTION user_can_access_file(
    file_path TEXT,
    bucket_name TEXT,
    requesting_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if file is in public bucket
    IF bucket_name IN ('images', 'videos', 'uploads', 'documents', 'avatars', 'public') THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user owns the file (path starts with user_id)
    IF file_path LIKE requesting_user_id::TEXT || '/%' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if file record exists and is public
    IF EXISTS (
        SELECT 1 FROM file 
        WHERE path = file_path 
        AND bucket = bucket_name 
        AND is_public = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to ensure file storage consistency
CREATE OR REPLACE FUNCTION sync_file_storage_record()
RETURNS TRIGGER AS $$
BEGIN
    -- When a file record is inserted, ensure storage path is set
    IF NEW.path IS NULL AND NEW.bucket IS NOT NULL THEN
        NEW.path := generate_user_file_path(NEW.user_id, NEW.name, NEW.bucket);
    END IF;
    
    -- Set default bucket if not provided
    IF NEW.bucket IS NULL THEN
        NEW.bucket := 'uploads';
        NEW.path := generate_user_file_path(NEW.user_id, NEW.name, 'uploads');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ensure file storage consistency
CREATE TRIGGER trigger_sync_file_storage_record
    BEFORE INSERT OR UPDATE ON file
    FOR EACH ROW
    EXECUTE FUNCTION sync_file_storage_record();

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION generate_user_file_path(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION user_can_access_file(TEXT, TEXT, UUID) TO authenticated, service_role;