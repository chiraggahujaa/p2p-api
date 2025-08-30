-- Fix file upload RLS policy conflicts
-- This migration fixes conflicting RLS policies for the file table

-- Drop existing conflicting policies for file table
DROP POLICY IF EXISTS "Users can view their own files" ON file;
DROP POLICY IF EXISTS "Users can view public files" ON file;
DROP POLICY IF EXISTS "Users can insert their own files" ON file;
DROP POLICY IF EXISTS "Users can update their own files" ON file;
DROP POLICY IF EXISTS "Users can delete their own files" ON file;
DROP POLICY IF EXISTS "Allow file uploads" ON file;
DROP POLICY IF EXISTS "Allow file reads" ON file;

-- Recreate RLS policies for file table with proper permissions
CREATE POLICY "Users can view their own files" ON file
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public files" ON file
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own files" ON file
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own files" ON file
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON file
    FOR DELETE USING (user_id = auth.uid());

-- Add policy to allow service role to manage all files (for admin operations)
CREATE POLICY "Service role can manage all files" ON file
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions to service role for file table
GRANT ALL ON file TO service_role;