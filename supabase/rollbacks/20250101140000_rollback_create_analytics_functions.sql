-- Rollback: Create analytics functions and materialized views
-- This rollback script reverses migration: 20250101140000_create_analytics_functions.sql
-- Usage: ./supabase/scripts/rollback.sh 20250101140000

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_booking_analytics ON booking;

-- Drop all trigger functions
DROP FUNCTION IF EXISTS trigger_record_booking_event();

-- Drop all functions
DROP FUNCTION IF EXISTS record_analytics_event(VARCHAR, UUID, UUID, UUID, UUID, INET, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_item_view_count(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_item_booking_count(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_item_metrics_for_date(DATE);
DROP FUNCTION IF EXISTS get_item_analytics_summary(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS refresh_popular_items();
DROP FUNCTION IF EXISTS get_items_dashboard(UUID[], DATE);

-- Drop all indexes on materialized view
DROP INDEX IF EXISTS idx_popular_items_7d_views;
DROP INDEX IF EXISTS idx_popular_items_7d_category;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS popular_items_7d;