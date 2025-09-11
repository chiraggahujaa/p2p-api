-- Migration: Create analytics functions and materialized views
-- Created: Analytics and metrics functions for P2P Platform
-- Rollback: Run rollbacks/20250101140000_rollback_create_analytics_functions.sql

-- Function to record analytics events (event-driven architecture)
CREATE OR REPLACE FUNCTION record_analytics_event(
    p_event_type VARCHAR(50),
    p_item_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_device_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_additional_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO analytics_event (
        event_type, item_id, user_id, session_id, device_id,
        ip_address, user_agent, referrer, additional_data
    ) VALUES (
        p_event_type, p_item_id, p_user_id, p_session_id, p_device_id,
        p_ip_address, p_user_agent, p_referrer, p_additional_data
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time item view count (last 30 days)
CREATE OR REPLACE FUNCTION get_item_view_count(
    p_item_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO view_count
    FROM analytics_event
    WHERE item_id = p_item_id
      AND event_type = 'item_view'
      AND event_timestamp >= NOW() - INTERVAL '1 day' * p_days;
    
    RETURN COALESCE(view_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time item booking count
CREATE OR REPLACE FUNCTION get_item_booking_count(
    p_item_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    booking_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO booking_count
    FROM analytics_event
    WHERE item_id = p_item_id
      AND event_type IN ('booking_created', 'booking_confirmed')
      AND event_timestamp >= NOW() - INTERVAL '1 day' * p_days;
    
    RETURN COALESCE(booking_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update daily item metrics (runs via scheduled job)
CREATE OR REPLACE FUNCTION update_item_metrics_for_date(
    p_target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
)
RETURNS INTEGER AS $$
DECLARE
    processed_items INTEGER := 0;
    item_record RECORD;
BEGIN
    -- Process metrics for each item that had activity on the target date
    FOR item_record IN
        SELECT DISTINCT item_id
        FROM analytics_event
        WHERE event_date = p_target_date
          AND item_id IS NOT NULL
    LOOP
        -- Insert or update metrics for this item and date
        INSERT INTO item_metric (
            item_id,
            metric_date,
            view_count,
            unique_view_count,
            booking_count,
            booking_conversion_rate,
            avg_session_duration
        )
        SELECT
            item_record.item_id,
            p_target_date,
            -- Total views
            COUNT(*) FILTER (WHERE event_type = 'item_view'),
            -- Unique views (distinct users/sessions)
            COUNT(DISTINCT COALESCE(user_id, session_id)) FILTER (WHERE event_type = 'item_view'),
            -- Total bookings
            COUNT(*) FILTER (WHERE event_type IN ('booking_created', 'booking_confirmed')),
            -- Conversion rate (bookings / views)
            CASE 
                WHEN COUNT(*) FILTER (WHERE event_type = 'item_view') > 0 THEN
                    ROUND(
                        COUNT(*) FILTER (WHERE event_type IN ('booking_created', 'booking_confirmed'))::DECIMAL / 
                        COUNT(*) FILTER (WHERE event_type = 'item_view') * 100,
                        4
                    )
                ELSE 0
            END,
            -- Average session duration from additional_data
            COALESCE(
                AVG((additional_data->>'session_duration')::INTEGER) FILTER (WHERE event_type = 'item_view'),
                0
            )::INTEGER
        FROM analytics_event
        WHERE item_id = item_record.item_id
          AND event_date = p_target_date
        ON CONFLICT (item_id, metric_date)
        DO UPDATE SET
            view_count = EXCLUDED.view_count,
            unique_view_count = EXCLUDED.unique_view_count,
            booking_count = EXCLUDED.booking_count,
            booking_conversion_rate = EXCLUDED.booking_conversion_rate,
            avg_session_duration = EXCLUDED.avg_session_duration,
            updated_at = NOW();
        
        processed_items := processed_items + 1;
    END LOOP;
    
    RETURN processed_items;
END;
$$ LANGUAGE plpgsql;

-- Function to get item analytics summary (for dashboards)
CREATE OR REPLACE FUNCTION get_item_analytics_summary(
    p_item_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_views INTEGER,
    unique_views INTEGER,
    total_bookings INTEGER,
    conversion_rate DECIMAL,
    avg_daily_views DECIMAL,
    trend_direction TEXT
) AS $$
DECLARE
    days_in_period INTEGER;
    first_half_views INTEGER;
    second_half_views INTEGER;
BEGIN
    days_in_period := p_end_date - p_start_date + 1;
    
    -- Get aggregated metrics
    SELECT
        COALESCE(SUM(im.view_count), 0)::INTEGER,
        COALESCE(SUM(im.unique_view_count), 0)::INTEGER,
        COALESCE(SUM(im.booking_count), 0)::INTEGER,
        CASE 
            WHEN SUM(im.view_count) > 0 THEN
                ROUND(SUM(im.booking_count)::DECIMAL / SUM(im.view_count) * 100, 2)
            ELSE 0
        END,
        CASE 
            WHEN days_in_period > 0 THEN
                ROUND(SUM(im.view_count)::DECIMAL / days_in_period, 2)
            ELSE 0
        END
    INTO total_views, unique_views, total_bookings, conversion_rate, avg_daily_views
    FROM item_metric im
    WHERE im.item_id = p_item_id
      AND im.metric_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate trend (compare first half vs second half of period)
    IF days_in_period >= 4 THEN
        SELECT COALESCE(SUM(view_count), 0)
        INTO first_half_views
        FROM item_metric
        WHERE item_id = p_item_id
          AND metric_date BETWEEN p_start_date AND p_start_date + (days_in_period / 2);
        
        SELECT COALESCE(SUM(view_count), 0)
        INTO second_half_views
        FROM item_metric
        WHERE item_id = p_item_id
          AND metric_date BETWEEN p_start_date + (days_in_period / 2) + 1 AND p_end_date;
        
        trend_direction := CASE
            WHEN second_half_views > first_half_views * 1.1 THEN 'up'
            WHEN second_half_views < first_half_views * 0.9 THEN 'down'
            ELSE 'stable'
        END;
    ELSE
        trend_direction := 'insufficient_data';
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Materialized view for popular items (refreshed periodically)
CREATE MATERIALIZED VIEW popular_items_7d AS
SELECT
    i.id,
    i.title,
    i.user_id,
    i.category_id,
    i.rent_price_per_day,
    COALESCE(SUM(im.view_count), 0) as total_views,
    COALESCE(SUM(im.booking_count), 0) as total_bookings,
    CASE 
        WHEN SUM(im.view_count) > 0 THEN
            ROUND(SUM(im.booking_count)::DECIMAL / SUM(im.view_count) * 100, 2)
        ELSE 0
    END as conversion_rate,
    i.rating_average,
    i.created_at
FROM item i
LEFT JOIN item_metric im ON i.id = im.item_id 
    AND im.metric_date >= CURRENT_DATE - INTERVAL '7 days'
WHERE i.is_active = true
GROUP BY i.id, i.title, i.user_id, i.category_id, i.rent_price_per_day, i.rating_average, i.created_at
ORDER BY total_views DESC, conversion_rate DESC
LIMIT 1000;

-- Create index on materialized view
CREATE INDEX idx_popular_items_7d_views ON popular_items_7d(total_views DESC);
CREATE INDEX idx_popular_items_7d_category ON popular_items_7d(category_id);

-- Function to refresh popular items view (call this from a scheduled job)
CREATE OR REPLACE FUNCTION refresh_popular_items()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_items_7d;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically record booking events
CREATE OR REPLACE FUNCTION trigger_record_booking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Record booking creation event
    IF TG_OP = 'INSERT' THEN
        PERFORM record_analytics_event(
            'booking_created',
            NEW.item_id,
            NEW.borrower_user_id,
            NULL, -- session_id
            NULL, -- device_id
            NULL, -- ip_address
            NULL, -- user_agent
            NULL, -- referrer
            jsonb_build_object(
                'booking_id', NEW.id,
                'lender_user_id', NEW.lender_user_id,
                'total_amount', NEW.total_amount,
                'booking_status', NEW.booking_status
            )
        );
        RETURN NEW;
    END IF;
    
    -- Record booking status changes
    IF TG_OP = 'UPDATE' AND OLD.booking_status != NEW.booking_status THEN
        PERFORM record_analytics_event(
            'booking_status_changed',
            NEW.item_id,
            NEW.borrower_user_id,
            NULL, -- session_id
            NULL, -- device_id
            NULL, -- ip_address
            NULL, -- user_agent
            NULL, -- referrer
            jsonb_build_object(
                'booking_id', NEW.id,
                'old_status', OLD.booking_status,
                'new_status', NEW.booking_status,
                'lender_user_id', NEW.lender_user_id
            )
        );
        
        -- Record confirmed booking as separate event for conversion tracking
        IF NEW.booking_status = 'confirmed' THEN
            PERFORM record_analytics_event(
                'booking_confirmed',
                NEW.item_id,
                NEW.borrower_user_id,
                NULL, -- session_id
                NULL, -- device_id
                NULL, -- ip_address
                NULL, -- user_agent
                NULL, -- referrer
                jsonb_build_object(
                    'booking_id', NEW.id,
                    'lender_user_id', NEW.lender_user_id,
                    'total_amount', NEW.total_amount
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the booking trigger
CREATE TRIGGER trigger_booking_analytics
    AFTER INSERT OR UPDATE ON booking
    FOR EACH ROW
    EXECUTE FUNCTION trigger_record_booking_event();

-- Function to get dashboard data for multiple items
CREATE OR REPLACE FUNCTION get_items_dashboard(
    p_item_ids UUID[],
    p_start_date DATE
)
RETURNS TABLE (
    item_id UUID,
    total_views INTEGER,
    unique_views INTEGER,
    total_bookings INTEGER,
    avg_conversion_rate DECIMAL,
    title VARCHAR(255),
    rent_price_per_day DECIMAL(10,2),
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        im.item_id,
        SUM(im.view_count)::INTEGER as total_views,
        SUM(im.unique_view_count)::INTEGER as unique_views,
        SUM(im.booking_count)::INTEGER as total_bookings,
        AVG(im.booking_conversion_rate)::DECIMAL as avg_conversion_rate,
        i.title,
        i.rent_price_per_day,
        i.status::TEXT
    FROM item_metric im
    JOIN item i ON im.item_id = i.id
    WHERE im.item_id = ANY(p_item_ids)
      AND im.metric_date >= p_start_date
    GROUP BY im.item_id, i.title, i.rent_price_per_day, i.status
    ORDER BY total_views DESC;
END;
$$ LANGUAGE plpgsql;