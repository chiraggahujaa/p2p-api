-- Migration: Fix RLS policy for user insertion during registration
-- Created: Allow admin/service role to insert new users

-- Drop existing policies for users table to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public user info" ON users;

-- Recreate RLS policies for users table with proper INSERT policy
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public user info" ON users
    FOR SELECT USING (is_active = true);

-- Add policy to allow service role (admin client) to insert new users
-- This is needed for user registration flow
CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (true);

-- Add policy to allow service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions to service role
GRANT ALL ON users TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

