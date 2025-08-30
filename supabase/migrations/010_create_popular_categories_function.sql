-- Migration: Create popular categories function
-- Created: Function to get popular categories based on item count

-- Function to get popular categories based on number of active items
CREATE OR REPLACE FUNCTION get_popular_categories(
    category_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    category_name VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    parent_category_id UUID,
    is_active BOOLEAN,
    sort_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    item_count BIGINT,
    active_item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.category_name,
        c.description,
        c.icon_url,
        c.banner_url,
        c.parent_category_id,
        c.is_active,
        c.sort_order,
        c.created_at,
        c.updated_at,
        COUNT(i.id) as item_count,
        COUNT(i.id) FILTER (WHERE i.is_active = true) as active_item_count
    FROM categories c
    LEFT JOIN item i ON c.id = i.category_id
    WHERE c.is_active = true
    GROUP BY c.id, c.category_name, c.description, c.icon_url, c.banner_url, 
             c.parent_category_id, c.is_active, c.sort_order, c.created_at, c.updated_at
    ORDER BY active_item_count DESC, c.sort_order ASC, c.category_name ASC
    LIMIT category_limit;
END;
$$ LANGUAGE plpgsql;