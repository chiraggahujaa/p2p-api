-- Rollback: Remove optimized search function and restore basic radius search
-- This rollback script reverses migration: 20250920120000_add_city_filter_to_radius_function.sql
-- Usage: ./supabase/scripts/rollback.sh 20250920120000

-- Drop the optimized search function
DROP FUNCTION IF EXISTS search_items_optimized(DECIMAL, DECIMAL, INTEGER, UUID, TEXT, DECIMAL, DECIMAL, TEXT, item_condition[], delivery_mode[], TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_items_within_radius(DECIMAL, DECIMAL, INTEGER, UUID, TEXT, DECIMAL, DECIMAL, TEXT, item_condition[], delivery_mode[]);

-- Restore original function without city filter
CREATE OR REPLACE FUNCTION get_items_within_radius(
    user_lat DECIMAL(10,8),
    user_lon DECIMAL(11,8),
    radius_km INTEGER DEFAULT 10,
    category_filter UUID DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    condition_filter item_condition[] DEFAULT NULL,
    delivery_mode_filter delivery_mode[] DEFAULT NULL
)
RETURNS TABLE (
    item_id UUID,
    title VARCHAR(255),
    description TEXT,
    rent_price_per_day DECIMAL(10,2),
    category_name VARCHAR(100),
    distance_km DECIMAL,
    owner_name VARCHAR(255),
    image_url TEXT,
    rating_average DECIMAL(3,2),
    city VARCHAR(100),
    condition item_condition,
    delivery_mode delivery_mode,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        i.description,
        i.rent_price_per_day,
        c.category_name,
        calculate_distance(user_lat, user_lon, l.latitude, l.longitude) as distance_km,
        u.full_name as owner_name,
        COALESCE(
            (SELECT f.url FROM item_image ii
             JOIN file f ON ii.file_id = f.id
             WHERE ii.item_id = i.id AND ii.is_primary = true
             LIMIT 1),
            (SELECT f.url FROM item_image ii
             JOIN file f ON ii.file_id = f.id
             WHERE ii.item_id = i.id
             ORDER BY ii.display_order, ii.created_at
             LIMIT 1)
        ) as image_url,
        i.rating_average,
        l.city,
        i.condition,
        i.delivery_mode,
        i.created_at
    FROM item i
    JOIN location l ON i.location_id = l.id
    JOIN categories c ON i.category_id = c.id
    JOIN users u ON i.user_id = u.id
    WHERE
        i.is_active = true
        AND i.status = 'available'
        -- Only include items within radius (which have lat and long)
        AND (l.latitude IS NULL OR l.longitude IS NULL OR radius_km IS NULL OR calculate_distance(user_lat, user_lon, l.latitude, l.longitude) <= radius_km)
        AND (category_filter IS NULL OR i.category_id = category_filter OR
             i.category_id IN (SELECT id FROM categories WHERE parent_category_id = category_filter))
        AND (price_min IS NULL OR i.rent_price_per_day >= price_min)
        AND (price_max IS NULL OR i.rent_price_per_day <= price_max)
        AND (search_term IS NULL OR
             i.title ILIKE '%' || search_term || '%' OR
             i.description ILIKE '%' || search_term || '%' OR
             c.category_name ILIKE '%' || search_term || '%' OR
             EXISTS (SELECT 1 FROM unnest(i.tags) tag WHERE tag ILIKE '%' || search_term || '%'))
        AND (condition_filter IS NULL OR i.condition = ANY(condition_filter))
        AND (delivery_mode_filter IS NULL OR i.delivery_mode = ANY(delivery_mode_filter) OR i.delivery_mode = 'both')
    ORDER BY distance_km ASC NULLS LAST, i.rating_average DESC, i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_items_within_radius TO authenticated, service_role;