-- Rollback: Setup comprehensive file storage RLS policies
-- This rollback script reverses migration: 20250101150000_setup_file_storage_policies.sql
-- Usage: ./supabase/scripts/rollback.sh 20250101150000

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sync_file_storage_record ON file;

-- Drop trigger function
DROP FUNCTION IF EXISTS sync_file_storage_record();

-- Revoke execute permissions on helper functions
REVOKE EXECUTE ON FUNCTION generate_user_file_path(UUID, TEXT, TEXT) FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION user_can_access_file(TEXT, TEXT, UUID) FROM authenticated, service_role;

-- Drop helper functions
DROP FUNCTION IF EXISTS generate_user_file_path(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS user_can_access_file(TEXT, TEXT, UUID);

-- Revoke storage permissions
REVOKE ALL ON storage.objects FROM authenticated, service_role;
REVOKE ALL ON storage.buckets FROM authenticated, service_role;

-- Revoke file table permissions
REVOKE ALL ON file FROM authenticated, service_role;

-- Drop all RLS policies for file table
DROP POLICY IF EXISTS "Users can view their own files" ON file;
DROP POLICY IF EXISTS "Users can view public files" ON file;
DROP POLICY IF EXISTS "Users can insert their own files" ON file;
DROP POLICY IF EXISTS "Users can update their own files" ON file;
DROP POLICY IF EXISTS "Users can delete their own files" ON file;
DROP POLICY IF EXISTS "Service role can manage all files" ON file;

-- Drop all storage RLS policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;