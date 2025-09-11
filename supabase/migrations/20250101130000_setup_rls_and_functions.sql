-- Migration: Row Level Security policies and useful functions
-- Created: RLS Policies and Database Functions
-- Rollback: Run rollbacks/20250101130000_rollback_setup_rls_and_functions.sql

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE location ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE file ENABLE ROW LEVEL SECURITY;
ALTER TABLE device ENABLE ROW LEVEL SECURITY;
ALTER TABLE item ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_req ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_review ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
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

-- RLS Policies for location
CREATE POLICY "Users can view locations" ON location
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create locations" ON location
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own locations" ON location
    FOR UPDATE TO authenticated USING (
        id IN (
            SELECT location_id FROM user_locations WHERE user_id = auth.uid()
            UNION
            SELECT location_id FROM item WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for user_locations
CREATE POLICY "Users can view own user_locations"
    ON user_locations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_locations"
    ON user_locations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_locations"
    ON user_locations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_locations"
    ON user_locations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view active categories" ON categories
    FOR SELECT USING (is_active = true);

-- RLS Policies for file
CREATE POLICY "Users can view their own files" ON file
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public files" ON file
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own files" ON file
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own files" ON file
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON file
    FOR DELETE USING (user_id = auth.uid());

-- Add policy to allow service role to manage all files (for admin operations)
CREATE POLICY "Service role can manage all files" ON file
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for device
CREATE POLICY "Users can manage their own devices" ON device
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for items
CREATE POLICY "Anyone can view active items" ON item
    FOR SELECT USING (is_active = true AND status != 'inactive');

CREATE POLICY "Users can create their own items" ON item
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own items" ON item
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own items" ON item
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for booking
CREATE POLICY "Users can view their own bookings" ON booking
    FOR SELECT USING (lender_user_id = auth.uid() OR borrower_user_id = auth.uid());

CREATE POLICY "Users can create bookings" ON booking
    FOR INSERT WITH CHECK (borrower_user_id = auth.uid());

CREATE POLICY "Lenders and borrowers can update bookings" ON booking
    FOR UPDATE USING (lender_user_id = auth.uid() OR borrower_user_id = auth.uid());

-- RLS Policies for payment
CREATE POLICY "Users can view their own payments" ON payment
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create payments" ON payment
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for support_req
CREATE POLICY "Users can manage their own support requests" ON support_req
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for item_views
CREATE POLICY "Users can view their own item views" ON item_view
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can create item views" ON item_view
    FOR INSERT WITH CHECK (true);

-- RLS Policies for item_images
CREATE POLICY "Anyone can view item images" ON item_image
    FOR SELECT USING (true);

CREATE POLICY "Item owners can manage images" ON item_image
    FOR ALL USING (
        item_id IN (SELECT id FROM item WHERE user_id = auth.uid())
    );

-- RLS Policies for user_favorites
CREATE POLICY "Users can manage their own favorites" ON user_favorite
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for item_reviews
CREATE POLICY "Anyone can view reviews" ON item_review
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON item_review
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON item_review
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON item_review
    FOR DELETE USING (user_id = auth.uid());

-- Useful Functions

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10,8), 
    lon1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8), 
    lon2 DECIMAL(11,8)
) RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Function to update item rating when review is added/updated
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE item 
    SET 
        rating_average = (
            SELECT COALESCE(AVG(rating::decimal), 0) 
            FROM item_review 
            WHERE item_id = NEW.item_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM item_review 
            WHERE item_id = NEW.item_id
        )
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user trust score based on ratings
CREATE OR REPLACE FUNCTION update_user_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update lender trust score
    UPDATE users 
    SET trust_score = (
        SELECT COALESCE(AVG(
            CASE 
                WHEN rating_by_borrower IS NOT NULL THEN rating_by_borrower::decimal
                ELSE NULL
            END
        ), 0)
        FROM booking 
        WHERE lender_user_id = NEW.lender_user_id
            AND rating_by_borrower IS NOT NULL
    )
    WHERE id = NEW.lender_user_id;
    
    -- Update borrower trust score
    UPDATE users 
    SET trust_score = (
        SELECT COALESCE(AVG(
            CASE 
                WHEN rating_by_lender IS NOT NULL THEN rating_by_lender::decimal
                ELSE NULL
            END
        ), 0)
        FROM booking 
        WHERE borrower_user_id = NEW.borrower_user_id
            AND rating_by_lender IS NOT NULL
    )
    WHERE id = NEW.borrower_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's default location
CREATE OR REPLACE FUNCTION get_user_default_location(user_uuid UUID)
RETURNS TABLE(
  location_id UUID,
  address_line TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  label VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.address_line,
    l.city,
    l.state,
    l.pincode,
    l.country,
    l.latitude,
    l.longitude,
    ul.label
  FROM user_locations ul
  JOIN location l ON ul.location_id = l.id
  WHERE ul.user_id = user_uuid AND ul.is_default = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user locations with details
CREATE OR REPLACE FUNCTION get_user_locations_with_details(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  location_id UUID,
  address_line TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  label VARCHAR(50),
  is_default BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id,
    l.id,
    l.address_line,
    l.city,
    l.state,
    l.pincode,
    l.country,
    l.latitude,
    l.longitude,
    ul.label,
    ul.is_default,
    ul.created_at,
    ul.updated_at
  FROM user_locations ul
  JOIN location l ON ul.location_id = l.id
  WHERE ul.user_id = user_uuid
  ORDER BY ul.is_default DESC, ul.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get items within radius (FIXED - only returns items with coordinates and within radius)
CREATE OR REPLACE FUNCTION get_items_within_radius(
    user_lat DECIMAL(10,8),
    user_lon DECIMAL(11,8),
    radius_km INTEGER DEFAULT 10,
    category_filter UUID DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    condition_filter TEXT[] DEFAULT NULL,
    delivery_mode_filter TEXT[] DEFAULT NULL
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
    condition VARCHAR(20),
    delivery_mode VARCHAR(20),
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
        -- FIXED: Only include items with actual coordinates
        AND l.latitude IS NOT NULL 
        AND l.longitude IS NOT NULL
        -- FIXED: Only include items within the specified radius
        AND calculate_distance(user_lat, user_lon, l.latitude, l.longitude) <= radius_km
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
    ORDER BY distance_km, i.rating_average DESC, i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_item_rating
    AFTER INSERT OR UPDATE OR DELETE ON item_review
    FOR EACH ROW EXECUTE FUNCTION update_item_rating();

CREATE TRIGGER trigger_update_trust_score
    AFTER UPDATE ON booking
    FOR EACH ROW 
    WHEN (NEW.rating_by_lender IS DISTINCT FROM OLD.rating_by_lender 
          OR NEW.rating_by_borrower IS DISTINCT FROM OLD.rating_by_borrower)
    EXECUTE FUNCTION update_user_trust_score();

-- Create useful views for common queries

-- View for item details with location and category info (RENAMED from v_items_detailed)
CREATE VIEW items_detailed AS
SELECT 
    i.*,
    l.city,
    l.state,
    l.pincode,
    l.latitude,
    l.longitude,
    c.category_name,
    u.full_name as owner_name,
    u.trust_score as owner_trust_score,
    u.avatar_url as owner_avatar,
    (
        SELECT array_agg(f.url ORDER BY ii.display_order, ii.created_at)
        FROM item_image ii
        JOIN file f ON ii.file_id = f.id
        WHERE ii.item_id = i.id
    ) as image_urls_ordered
FROM item i
JOIN location l ON i.location_id = l.id
JOIN categories c ON i.category_id = c.id
JOIN users u ON i.user_id = u.id
WHERE i.is_active = true;

-- View for booking details with user and item info (RENAMED from v_bookings_detailed)
CREATE VIEW bookings_detailed AS
SELECT 
    b.*,
    lender.full_name as lender_name,
    lender.email as lender_email,
    lender.phone_number as lender_phone,
    borrower.full_name as borrower_name,
    borrower.email as borrower_email,
    borrower.phone_number as borrower_phone,
    i.title as item_title,
    i.description as item_description,
    cat.category_name,
    pickup_loc.address_line as pickup_address,
    pickup_loc.city as pickup_city,
    delivery_loc.address_line as delivery_address,
    delivery_loc.city as delivery_city
FROM booking b
JOIN users lender ON b.lender_user_id = lender.id
JOIN users borrower ON b.borrower_user_id = borrower.id
JOIN item i ON b.item_id = i.id
JOIN categories cat ON i.category_id = cat.id
LEFT JOIN location pickup_loc ON b.pickup_location = pickup_loc.id
LEFT JOIN location delivery_loc ON b.delivery_location = delivery_loc.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Grant specific permissions to service role for file table
GRANT ALL ON file TO service_role;

-- Grant necessary permissions to service role for users table
GRANT ALL ON users TO service_role;