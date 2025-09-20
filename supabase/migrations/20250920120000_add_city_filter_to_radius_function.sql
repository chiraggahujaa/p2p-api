-- Migration: Enhanced search function with filtering, sorting and pagination
-- Created: Optimized search function with comprehensive filtering, sorting and pagination support
-- Rollback: Run rollbacks/20250920120000_rollback_add_city_filter_to_radius_function.sql

-- Drop existing functions
DROP FUNCTION IF EXISTS get_items_within_radius(DECIMAL, DECIMAL, INTEGER, UUID, DECIMAL, DECIMAL, TEXT, TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS get_items_within_radius(DECIMAL, DECIMAL, INTEGER, UUID, TEXT, DECIMAL, DECIMAL, TEXT, item_condition[], delivery_mode[]);
DROP FUNCTION IF EXISTS search_items_optimized(DECIMAL, DECIMAL, INTEGER, UUID, TEXT, DECIMAL, DECIMAL, TEXT, item_condition[], delivery_mode[], TEXT, INTEGER, INTEGER);

-- Create optimized search function with comprehensive filtering, sorting and pagination
CREATE OR REPLACE FUNCTION search_items_optimized(
    user_lat DECIMAL(10,8) DEFAULT NULL,
    user_lon DECIMAL(11,8) DEFAULT NULL,
    radius_km INTEGER DEFAULT 10,
    category_filter UUID DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    condition_filter item_condition[] DEFAULT NULL,
    delivery_mode_filter delivery_mode[] DEFAULT NULL,
    sort_by TEXT DEFAULT 'newest',
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    item_id UUID,
    title VARCHAR(255),
    description TEXT,
    rent_price_per_day DECIMAL(10,2),
    category_name VARCHAR(100),
    distance_km DECIMAL,
    owner_name VARCHAR(255),
    owner_id UUID,
    owner_avatar_url TEXT,
    owner_trust_score DECIMAL(3,2),
    image_url TEXT,
    rating_average DECIMAL(3,2),
    rating_count INTEGER,
    city VARCHAR(100),
    state VARCHAR(100),
    condition item_condition,
    delivery_mode delivery_mode,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
DECLARE
    distance_expression TEXT;
    order_clause TEXT;
BEGIN
    -- Set distance calculation based on coordinates availability
    IF user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
        distance_expression := 'calculate_distance(' || user_lat || ', ' || user_lon || ', l.latitude, l.longitude)';
    ELSE
        distance_expression := 'NULL::DECIMAL';
    END IF;

    -- Dynamic ORDER BY clause based on sort_by parameter
    CASE sort_by
        WHEN 'priceAsc' THEN
            order_clause := 'i.rent_price_per_day ASC, i.created_at DESC';
        WHEN 'priceDesc' THEN
            order_clause := 'i.rent_price_per_day DESC, i.created_at DESC';
        WHEN 'rating' THEN
            order_clause := 'i.rating_average DESC, i.rating_count DESC, i.created_at DESC';
        WHEN 'popular' THEN
            order_clause := 'i.rating_count DESC, i.rating_average DESC, i.created_at DESC';
        WHEN 'distance' THEN
            IF user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
                order_clause := distance_expression || ' ASC NULLS LAST, i.rating_average DESC';
            ELSE
                order_clause := 'i.created_at DESC, i.rating_average DESC';
            END IF;
        ELSE -- 'newest' or default
            order_clause := 'i.created_at DESC, i.rating_average DESC';
    END CASE;

    RETURN QUERY EXECUTE format('
        WITH filtered_items AS (
            SELECT
                i.id,
                i.title,
                i.description,
                i.rent_price_per_day,
                c.category_name,
                %s as distance_km,
                u.full_name as owner_name,
                u.id as owner_id,
                u.avatar_url as owner_avatar_url,
                u.trust_score as owner_trust_score,
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
                i.rating_count,
                l.city,
                l.state,
                i.condition,
                i.delivery_mode,
                i.created_at,
                COUNT(*) OVER() as total_count
            FROM item i
            JOIN location l ON i.location_id = l.id
            JOIN categories c ON i.category_id = c.id
            JOIN users u ON i.user_id = u.id
            WHERE
                i.is_active = true
                AND i.status = ''available''
                -- Distance filter (only when coordinates provided)
                AND ($1 IS NULL OR $2 IS NULL OR l.latitude IS NULL OR l.longitude IS NULL OR
                     calculate_distance($1, $2, l.latitude, l.longitude) <= $3)
                -- City filter
                AND ($5 IS NULL OR l.city ILIKE ''%%'' || $5 || ''%%'')
                -- Category filter (including subcategories)
                AND ($4 IS NULL OR i.category_id = $4 OR
                     i.category_id IN (SELECT id FROM categories WHERE parent_category_id = $4))
                -- Price filters
                AND ($6 IS NULL OR i.rent_price_per_day >= $6)
                AND ($7 IS NULL OR i.rent_price_per_day <= $7)
                -- Search term filter
                AND ($8 IS NULL OR
                     i.title ILIKE ''%%'' || $8 || ''%%'' OR
                     i.description ILIKE ''%%'' || $8 || ''%%'' OR
                     c.category_name ILIKE ''%%'' || $8 || ''%%'' OR
                     EXISTS (SELECT 1 FROM unnest(i.tags) tag WHERE tag ILIKE ''%%'' || $8 || ''%%''))
                -- Condition filter
                AND ($9 IS NULL OR i.condition = ANY($9))
                -- Delivery mode filter
                AND ($10 IS NULL OR i.delivery_mode = ANY($10) OR i.delivery_mode = ''both'')
            ORDER BY %s
            LIMIT $12 OFFSET $13
        )
        SELECT * FROM filtered_items',
        distance_expression,
        order_clause
    )
    USING user_lat, user_lon, radius_km, category_filter, city_filter, price_min, price_max,
          search_term, condition_filter, delivery_mode_filter, sort_by, page_limit, page_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_items_optimized TO authenticated, service_role;