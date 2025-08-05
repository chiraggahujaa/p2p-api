-- Migration: Seed data for initial setup
-- Created: Initial seed data for categories and test data

-- Insert default categories
INSERT INTO categories (category_name, description, sort_order) VALUES
('Electronics', 'Electronic devices and gadgets', 1),
('Furniture', 'Home and office furniture', 2),
('Appliances', 'Home appliances and kitchen equipment', 3),
('Sports & Fitness', 'Sports equipment and fitness gear', 4),
('Books & Media', 'Books, movies, music and educational materials', 5),
('Tools & Equipment', 'Tools, machinery and equipment', 6),
('Clothing & Accessories', 'Clothing, shoes and accessories', 7),
('Vehicles', 'Cars, bikes, scooters and other vehicles', 8),
('Gaming', 'Gaming consoles, games and accessories', 9),
('Photography', 'Cameras, lenses and photography equipment', 10),
('Music Instruments', 'Musical instruments and equipment', 11),
('Baby & Kids', 'Baby gear, toys and kids items', 12),
('Home & Garden', 'Home decor, gardening tools and supplies', 13),
('Travel & Luggage', 'Travel gear, luggage and camping equipment', 14),
('Events & Party', 'Event supplies, party equipment and decorations', 15);

-- Insert subcategories for Electronics
INSERT INTO categories (category_name, description, parent_category_id, sort_order) VALUES
('Laptops & Computers', 'Laptops, desktops and computer accessories', 
    (SELECT id FROM categories WHERE category_name = 'Electronics'), 1),
('Mobile & Tablets', 'Smartphones, tablets and mobile accessories', 
    (SELECT id FROM categories WHERE category_name = 'Electronics'), 2),
('Audio & Video', 'Speakers, headphones, TVs and audio equipment', 
    (SELECT id FROM categories WHERE category_name = 'Electronics'), 3),
('Gaming Consoles', 'PlayStation, Xbox, Nintendo and gaming accessories', 
    (SELECT id FROM categories WHERE category_name = 'Electronics'), 4);

-- Insert subcategories for Furniture
INSERT INTO categories (category_name, description, parent_category_id, sort_order) VALUES
('Living Room', 'Sofas, coffee tables, TV stands and living room furniture', 
    (SELECT id FROM categories WHERE category_name = 'Furniture'), 1),
('Bedroom', 'Beds, mattresses, wardrobes and bedroom furniture', 
    (SELECT id FROM categories WHERE category_name = 'Furniture'), 2),
('Office Furniture', 'Desks, chairs, cabinets and office equipment', 
    (SELECT id FROM categories WHERE category_name = 'Furniture'), 3),
('Dining', 'Dining tables, chairs and dining room furniture', 
    (SELECT id FROM categories WHERE category_name = 'Furniture'), 4);

-- Insert subcategories for Vehicles
INSERT INTO categories (category_name, description, parent_category_id, sort_order) VALUES
('Cars', 'Cars for rent and ride sharing', 
    (SELECT id FROM categories WHERE category_name = 'Vehicles'), 1),
('Bikes & Scooters', 'Motorcycles, scooters and electric bikes', 
    (SELECT id FROM categories WHERE category_name = 'Vehicles'), 2),
('Bicycles', 'Bicycles, mountain bikes and cycling gear', 
    (SELECT id FROM categories WHERE category_name = 'Vehicles'), 3);

-- Insert subcategories for Sports & Fitness
INSERT INTO categories (category_name, description, parent_category_id, sort_order) VALUES
('Gym Equipment', 'Weights, treadmills and fitness machines', 
    (SELECT id FROM categories WHERE category_name = 'Sports & Fitness'), 1),
('Outdoor Sports', 'Cricket, football, tennis and outdoor sports gear', 
    (SELECT id FROM categories WHERE category_name = 'Sports & Fitness'), 2),
('Water Sports', 'Swimming, surfing and water sports equipment', 
    (SELECT id FROM categories WHERE category_name = 'Sports & Fitness'), 3);

-- Create some sample locations (major Indian cities)
INSERT INTO location (address_line, city, state, pincode, latitude, longitude) VALUES
('MG Road', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946),
('Connaught Place', 'New Delhi', 'Delhi', '110001', 28.6139, 77.2090),
('Marine Drive', 'Mumbai', 'Maharashtra', '400020', 18.9220, 72.8347),
('Park Street', 'Kolkata', 'West Bengal', '700016', 22.5526, 88.3639),
('Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 13.0843, 80.2705),
('Sector 17', 'Chandigarh', 'Punjab', '160017', 30.7333, 76.7794),
('Banjara Hills', 'Hyderabad', 'Telangana', '500034', 17.4065, 78.4772),
('Koregaon Park', 'Pune', 'Maharashtra', '411001', 18.5362, 73.8969),
('Satellite', 'Ahmedabad', 'Gujarat', '380015', 23.0225, 72.5714),
('Salt Lake', 'Kolkata', 'West Bengal', '700064', 22.5744, 88.4343);

-- Create functions for common operations

-- Function to get items within radius
CREATE OR REPLACE FUNCTION get_items_within_radius(
    user_lat DECIMAL(10,8),
    user_lon DECIMAL(11,8),
    radius_km INTEGER DEFAULT 10,
    category_filter UUID DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    search_term TEXT DEFAULT NULL
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
    city VARCHAR(100)
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
        l.city
    FROM item i
    JOIN location l ON i.location_id = l.id
    JOIN categories c ON i.category_id = c.id
    JOIN users u ON i.user_id = u.id
    WHERE 
        i.is_active = true 
        AND i.status = 'available'
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
    ORDER BY distance_km, i.rating_average DESC, i.created_at DESC;
END;
$$ LANGUAGE plpgsql;