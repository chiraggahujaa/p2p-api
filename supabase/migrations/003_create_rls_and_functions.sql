-- Migration: Row Level Security policies and useful functions
-- Created: RLS Policies and Database Functions

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE location ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies for location
CREATE POLICY "Users can view locations" ON location
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create locations" ON location
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own locations" ON location
    FOR UPDATE TO authenticated USING (
        id IN (
            SELECT location_id FROM users WHERE id = auth.uid()
            UNION
            SELECT location_id FROM item WHERE user_id = auth.uid()
        )
    );

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

-- Note: Analytics functions moved to 005_create_analytics_functions.sql
-- Direct counter updates removed in favor of event-driven analytics architecture

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

-- Note: Analytics triggers moved to 005_create_analytics_functions.sql
-- Using event-driven analytics architecture instead of direct counter updates

-- Create useful views for common queries

-- View for item details with location and category info
CREATE VIEW v_items_detailed AS
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

-- View for booking details with user and item info
CREATE VIEW v_bookings_detailed AS
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
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;