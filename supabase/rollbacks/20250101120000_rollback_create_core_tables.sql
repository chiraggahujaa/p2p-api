-- Rollback: Create core tables (Users, Categories, Locations, Files, Devices, User Locations)
-- This rollback script reverses migration: 20250101120000_create_core_tables.sql
-- Usage: ./supabase/scripts/rollback.sh 20250101120000

-- Drop all triggers first
DROP TRIGGER IF EXISTS trigger_ensure_single_default_location ON user_locations;
DROP TRIGGER IF EXISTS set_analytics_event_date_trigger ON analytics_event;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_location_updated_at ON location;
DROP TRIGGER IF EXISTS update_user_locations_updated_at ON user_locations;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_item_updated_at ON item;
DROP TRIGGER IF EXISTS update_booking_updated_at ON booking;
DROP TRIGGER IF EXISTS update_payment_updated_at ON payment;
DROP TRIGGER IF EXISTS update_support_updated_at ON support_req;
DROP TRIGGER IF EXISTS update_item_review_updated_at ON item_review;
DROP TRIGGER IF EXISTS update_item_metric_updated_at ON item_metric;

-- Drop all trigger functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS ensure_single_default_location();
DROP FUNCTION IF EXISTS set_analytics_event_date();

-- Drop all indexes
DROP INDEX IF EXISTS idx_location_city_state;
DROP INDEX IF EXISTS idx_location_pincode;
DROP INDEX IF EXISTS idx_location_coordinates;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_trust_score;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_user_locations_user_id;
DROP INDEX IF EXISTS idx_user_locations_location_id;
DROP INDEX IF EXISTS idx_user_locations_default;
DROP INDEX IF EXISTS idx_categories_parent;
DROP INDEX IF EXISTS idx_categories_active;
DROP INDEX IF EXISTS idx_file_user;
DROP INDEX IF EXISTS idx_file_type;
DROP INDEX IF EXISTS idx_file_uploaded;
DROP INDEX IF EXISTS idx_file_bucket;
DROP INDEX IF EXISTS idx_file_path;
DROP INDEX IF EXISTS idx_device_user;
DROP INDEX IF EXISTS idx_device_active;
DROP INDEX IF EXISTS idx_device_last_login;
DROP INDEX IF EXISTS idx_item_user;
DROP INDEX IF EXISTS idx_item_category;
DROP INDEX IF EXISTS idx_item_location;
DROP INDEX IF EXISTS idx_item_status;
DROP INDEX IF EXISTS idx_item_price;
DROP INDEX IF EXISTS idx_item_rating;
DROP INDEX IF EXISTS idx_item_created;
DROP INDEX IF EXISTS idx_item_active;
DROP INDEX IF EXISTS idx_booking_item;
DROP INDEX IF EXISTS idx_booking_lender;
DROP INDEX IF EXISTS idx_booking_borrower;
DROP INDEX IF EXISTS idx_booking_status;
DROP INDEX IF EXISTS idx_booking_dates;
DROP INDEX IF EXISTS idx_booking_created;
DROP INDEX IF EXISTS idx_payment_booking;
DROP INDEX IF EXISTS idx_payment_user;
DROP INDEX IF EXISTS idx_payment_status;
DROP INDEX IF EXISTS idx_payment_date;
DROP INDEX IF EXISTS idx_support_user;
DROP INDEX IF EXISTS idx_support_status;
DROP INDEX IF EXISTS idx_support_type;
DROP INDEX IF EXISTS idx_support_created;
DROP INDEX IF EXISTS idx_analytics_event_item_time;
DROP INDEX IF EXISTS idx_analytics_event_type_time;
DROP INDEX IF EXISTS idx_analytics_event_user_time;
DROP INDEX IF EXISTS idx_analytics_event_date;
DROP INDEX IF EXISTS idx_item_metric_item_date;
DROP INDEX IF EXISTS idx_item_metric_date;
DROP INDEX IF EXISTS idx_item_metric_views;
DROP INDEX IF EXISTS idx_item_metric_bookings;
DROP INDEX IF EXISTS idx_item_view_item;
DROP INDEX IF EXISTS idx_item_view_user;
DROP INDEX IF EXISTS idx_item_view_date;
DROP INDEX IF EXISTS idx_item_image_item;
DROP INDEX IF EXISTS idx_item_image_primary;
DROP INDEX IF EXISTS idx_user_favorite_user;
DROP INDEX IF EXISTS idx_user_favorite_item;
DROP INDEX IF EXISTS idx_item_review_item;
DROP INDEX IF EXISTS idx_item_review_user;
DROP INDEX IF EXISTS idx_item_review_rating;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS item_review CASCADE;
DROP TABLE IF EXISTS user_favorite CASCADE;
DROP TABLE IF EXISTS item_image CASCADE;
DROP TABLE IF EXISTS item_view CASCADE;
DROP TABLE IF EXISTS item_metric CASCADE;
DROP TABLE IF EXISTS analytics_event CASCADE;
DROP TABLE IF EXISTS support_req CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS item CASCADE;
DROP TABLE IF EXISTS device CASCADE;
DROP TABLE IF EXISTS file CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS location CASCADE;

-- Drop all ENUM types
DROP TYPE IF EXISTS user_gender CASCADE;
DROP TYPE IF EXISTS user_dob_visibility CASCADE;
DROP TYPE IF EXISTS file_type CASCADE;
DROP TYPE IF EXISTS device_type CASCADE;
DROP TYPE IF EXISTS item_condition CASCADE;
DROP TYPE IF EXISTS item_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS delivery_mode CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS support_status CASCADE;
DROP TYPE IF EXISTS issue_type CASCADE;

-- Drop extensions (only if no other objects depend on them)
-- Note: We don't drop extensions as they might be used by other parts of the system
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "postgis";