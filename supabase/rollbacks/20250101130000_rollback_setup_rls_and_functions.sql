-- Rollback: Row Level Security policies and useful functions
-- This rollback script reverses migration: 20250101130000_setup_rls_and_functions.sql
-- Usage: ./supabase/scripts/rollback.sh 20250101130000

-- Drop all views
DROP VIEW IF EXISTS items_detailed CASCADE;
DROP VIEW IF EXISTS bookings_detailed CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_update_item_rating ON item_review;
DROP TRIGGER IF EXISTS trigger_update_trust_score ON booking;

-- Drop all functions
DROP FUNCTION IF EXISTS calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS update_item_rating();
DROP FUNCTION IF EXISTS update_user_trust_score();
DROP FUNCTION IF EXISTS get_user_default_location(UUID);
DROP FUNCTION IF EXISTS get_user_locations_with_details(UUID);
DROP FUNCTION IF EXISTS get_items_within_radius(DECIMAL, DECIMAL, INTEGER, UUID, DECIMAL, DECIMAL, TEXT, TEXT[], TEXT[]);

-- Revoke all permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated, service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated, service_role;
REVOKE USAGE ON SCHEMA public FROM authenticated, anon, service_role;
REVOKE ALL ON file FROM service_role;
REVOKE ALL ON users FROM service_role;

-- Drop all RLS policies for item_review
DROP POLICY IF EXISTS "Anyone can view reviews" ON item_review;
DROP POLICY IF EXISTS "Users can create reviews" ON item_review;
DROP POLICY IF EXISTS "Users can update their own reviews" ON item_review;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON item_review;

-- Drop all RLS policies for user_favorite
DROP POLICY IF EXISTS "Users can manage their own favorites" ON user_favorite;

-- Drop all RLS policies for item_image
DROP POLICY IF EXISTS "Anyone can view item images" ON item_image;
DROP POLICY IF EXISTS "Item owners can manage images" ON item_image;

-- Drop all RLS policies for item_view
DROP POLICY IF EXISTS "Users can view their own item views" ON item_view;
DROP POLICY IF EXISTS "Anyone can create item views" ON item_view;

-- Drop all RLS policies for support_req
DROP POLICY IF EXISTS "Users can manage their own support requests" ON support_req;

-- Drop all RLS policies for payment
DROP POLICY IF EXISTS "Users can view their own payments" ON payment;
DROP POLICY IF EXISTS "Users can create payments" ON payment;

-- Drop all RLS policies for booking
DROP POLICY IF EXISTS "Users can view their own bookings" ON booking;
DROP POLICY IF EXISTS "Users can create bookings" ON booking;
DROP POLICY IF EXISTS "Lenders and borrowers can update bookings" ON booking;

-- Drop all RLS policies for item
DROP POLICY IF EXISTS "Anyone can view active items" ON item;
DROP POLICY IF EXISTS "Users can create their own items" ON item;
DROP POLICY IF EXISTS "Users can update their own items" ON item;
DROP POLICY IF EXISTS "Users can delete their own items" ON item;

-- Drop all RLS policies for device
DROP POLICY IF EXISTS "Users can manage their own devices" ON device;

-- Drop all RLS policies for file
DROP POLICY IF EXISTS "Users can view their own files" ON file;
DROP POLICY IF EXISTS "Users can view public files" ON file;
DROP POLICY IF EXISTS "Users can insert their own files" ON file;
DROP POLICY IF EXISTS "Users can update their own files" ON file;
DROP POLICY IF EXISTS "Users can delete their own files" ON file;
DROP POLICY IF EXISTS "Service role can manage all files" ON file;

-- Drop all RLS policies for categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;

-- Drop all RLS policies for user_locations
DROP POLICY IF EXISTS "Users can view own user_locations" ON user_locations;
DROP POLICY IF EXISTS "Users can insert own user_locations" ON user_locations;
DROP POLICY IF EXISTS "Users can update own user_locations" ON user_locations;
DROP POLICY IF EXISTS "Users can delete own user_locations" ON user_locations;

-- Drop all RLS policies for location
DROP POLICY IF EXISTS "Users can view locations" ON location;
DROP POLICY IF EXISTS "Users can create locations" ON location;
DROP POLICY IF EXISTS "Users can update their own locations" ON location;

-- Drop all RLS policies for users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public user info" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS item_review DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_favorite DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item_image DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item_view DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_req DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS device DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS file DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;