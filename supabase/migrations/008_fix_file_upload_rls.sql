-- Fix file upload RLS policy
-- This migration creates a permissive RLS policy for the file table to allow uploads

-- Create policy for file uploads
CREATE POLICY "Allow file uploads" ON file
FOR INSERT WITH CHECK (true);

-- Optionally create policy for file reads (public files + own files)
CREATE POLICY "Allow file reads" ON file
FOR SELECT USING (is_public = true OR auth.uid() = user_id);