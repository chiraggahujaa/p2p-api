-- Rollback: Create popular categories function
-- This rollback script reverses migration: 20250101160000_create_popular_categories_function.sql
-- Usage: ./supabase/scripts/rollback.sh 20250101160000

-- Drop the popular categories function
DROP FUNCTION IF EXISTS get_popular_categories(INTEGER);