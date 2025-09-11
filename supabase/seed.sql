-- P2P API Database Seed Data
-- This file contains all initial data for the P2P platform including:
-- - Categories and subcategories
-- - Sample locations across major Indian cities  
-- - Test users with realistic profiles
-- - Sample items across different categories
-- - Mock bookings and reviews for testing

-- =============================================================================
-- CATEGORIES AND SUBCATEGORIES
-- =============================================================================

-- Insert main categories
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

-- =============================================================================
-- SAMPLE LOCATIONS (Major Indian Cities)
-- =============================================================================

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
('Salt Lake', 'Kolkata', 'West Bengal', '700064', 22.5744, 88.4343),
-- Additional locations for better coverage
('Indiranagar', 'Bangalore', 'Karnataka', '560038', 12.9719, 77.6412),
('Karol Bagh', 'New Delhi', 'Delhi', '110005', 28.6519, 77.1909),
('Andheri West', 'Mumbai', 'Maharashtra', '400058', 19.1136, 72.8697),
('Gachibowli', 'Hyderabad', 'Telangana', '500032', 17.4399, 78.3487),
('T Nagar', 'Chennai', 'Tamil Nadu', '600017', 13.0418, 80.2341),
('Wakad', 'Pune', 'Maharashtra', '411057', 18.5975, 73.7898),
('Navrangpura', 'Ahmedabad', 'Gujarat', '380009', 23.0367, 72.5555),
('Ballygunge', 'Kolkata', 'West Bengal', '700019', 22.5268, 88.3610),
('Bandra West', 'Mumbai', 'Maharashtra', '400050', 19.0596, 72.8295),
('Whitefield', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7499);

-- =============================================================================
-- TEST USERS (Realistic Profiles)
-- =============================================================================

INSERT INTO users (id, full_name, email, phone_number, gender, dob, dob_visibility, trust_score, is_verified, avatar_url, bio, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Aarav Sharma', 'aarav.sharma@email.com', '+91-9876543210', 'male', '1995-03-15', 'public', 4.2, true, 'https://i.pravatar.cc/150?img=1', 'Tech enthusiast and gadget lover. Love sharing my electronics!', true),
('550e8400-e29b-41d4-a716-446655440002', 'Priya Patel', 'priya.patel@email.com', '+91-9876543211', 'female', '1992-07-22', 'friends', 4.5, true, 'https://i.pravatar.cc/150?img=2', 'Interior designer with a passion for beautiful furniture', true),
('550e8400-e29b-41d4-a716-446655440003', 'Rahul Kumar', 'rahul.kumar@email.com', '+91-9876543212', 'male', '1988-11-05', 'private', 3.8, false, 'https://i.pravatar.cc/150?img=3', 'Sports enthusiast and fitness trainer', true),
('550e8400-e29b-41d4-a716-446655440004', 'Anita Singh', 'anita.singh@email.com', '+91-9876543213', 'female', '1990-01-18', 'public', 4.7, true, 'https://i.pravatar.cc/150?img=4', 'Book lover and avid reader. Happy to share my collection!', true),
('550e8400-e29b-41d4-a716-446655440005', 'Vikram Reddy', 'vikram.reddy@email.com', '+91-9876543214', 'male', '1993-09-30', 'friends', 4.1, true, 'https://i.pravatar.cc/150?img=5', 'Photographer and camera gear enthusiast', true),
('550e8400-e29b-41d4-a716-446655440006', 'Sneha Gupta', 'sneha.gupta@email.com', '+91-9876543215', 'female', '1991-06-12', 'public', 4.3, true, 'https://i.pravatar.cc/150?img=6', 'Travel blogger and adventure seeker', true),
('550e8400-e29b-41d4-a716-446655440007', 'Arjun Mehta', 'arjun.mehta@email.com', '+91-9876543216', 'male', '1994-04-25', 'private', 3.9, false, 'https://i.pravatar.cc/150?img=7', 'Music producer and instrument collector', true),
('550e8400-e29b-41d4-a716-446655440008', 'Deepika Joshi', 'deepika.joshi@email.com', '+91-9876543217', 'female', '1989-12-08', 'friends', 4.6, true, 'https://i.pravatar.cc/150?img=8', 'Fashion designer and style consultant', true),
('550e8400-e29b-41d4-a716-446655440009', 'Rohan Das', 'rohan.das@email.com', '+91-9876543218', 'male', '1996-02-14', 'public', 4.0, true, 'https://i.pravatar.cc/150?img=9', 'Gaming enthusiast and tech reviewer', true),
('550e8400-e29b-41d4-a716-446655440010', 'Kavya Nair', 'kavya.nair@email.com', '+91-9876543219', 'female', '1987-08-03', 'private', 4.4, true, 'https://i.pravatar.cc/150?img=10', 'Chef and cooking equipment enthusiast', true),
('550e8400-e29b-41d4-a716-446655440011', 'Siddharth Roy', 'siddharth.roy@email.com', '+91-9876543220', 'male', '1992-10-17', 'friends', 3.7, false, 'https://i.pravatar.cc/150?img=11', 'Automotive enthusiast and bike lover', true),
('550e8400-e29b-41d4-a716-446655440012', 'Ishita Agarwal', 'ishita.agarwal@email.com', '+91-9876543221', 'female', '1994-05-29', 'public', 4.8, true, 'https://i.pravatar.cc/150?img=12', 'Artist and creative tools collector', true),
('550e8400-e29b-41d4-a716-446655440013', 'Karan Malhotra', 'karan.malhotra@email.com', '+91-9876543222', 'male', '1990-07-11', 'private', 4.2, true, 'https://i.pravatar.cc/150?img=13', 'Fitness trainer and gym equipment expert', true),
('550e8400-e29b-41d4-a716-446655440014', 'Riya Sharma', 'riya.sharma@email.com', '+91-9876543223', 'female', '1993-03-26', 'friends', 4.1, true, 'https://i.pravatar.cc/150?img=14', 'Event planner and party supplies expert', true),
('550e8400-e29b-41d4-a716-446655440015', 'Amit Verma', 'amit.verma@email.com', '+91-9876543224', 'male', '1991-11-19', 'public', 3.9, false, 'https://i.pravatar.cc/150?img=15', 'Gardening enthusiast and tool collector', true),
('550e8400-e29b-41d4-a716-446655440016', 'Pooja Bansal', 'pooja.bansal@email.com', '+91-9876543225', 'female', '1988-09-07', 'private', 4.5, true, 'https://i.pravatar.cc/150?img=16', 'Baby products expert and mom blogger', true),
('550e8400-e29b-41d4-a716-446655440017', 'Nikhil Jain', 'nikhil.jain@email.com', '+91-9876543226', 'male', '1995-01-31', 'friends', 4.3, true, 'https://i.pravatar.cc/150?img=17', 'Drone enthusiast and aerial photographer', true),
('550e8400-e29b-41d4-a716-446655440018', 'Shreya Pandey', 'shreya.pandey@email.com', '+91-9876543227', 'female', '1992-06-23', 'public', 4.0, true, 'https://i.pravatar.cc/150?img=18', 'Wedding planner and decoration expert', true),
('550e8400-e29b-41d4-a716-446655440019', 'Varun Khanna', 'varun.khanna@email.com', '+91-9876543228', 'male', '1989-04-16', 'private', 4.6, true, 'https://i.pravatar.cc/150?img=19', 'Home automation and smart device expert', true),
('550e8400-e29b-41d4-a716-446655440020', 'Meera Iyer', 'meera.iyer@email.com', '+91-9876543229', 'female', '1994-12-02', 'friends', 4.4, true, 'https://i.pravatar.cc/150?img=20', 'Yoga instructor and wellness enthusiast', true),
('550e8400-e29b-41d4-a716-446655440021', 'Rajesh Sinha', 'rajesh.sinha@email.com', '+91-9876543230', 'male', '1987-08-20', 'public', 3.8, false, 'https://i.pravatar.cc/150?img=21', 'Car rental and automotive service provider', true),
('550e8400-e29b-41d4-a716-446655440022', 'Nisha Chopra', 'nisha.chopra@email.com', '+91-9876543231', 'female', '1993-10-05', 'private', 4.7, true, 'https://i.pravatar.cc/150?img=22', 'Professional photographer and equipment renter', true),
('550e8400-e29b-41d4-a716-446655440023', 'Akash Gupta', 'akash.gupta@email.com', '+91-9876543232', 'male', '1991-02-28', 'friends', 4.1, true, 'https://i.pravatar.cc/150?img=23', 'Board game enthusiast and collector', true),
('550e8400-e29b-41d4-a716-446655440024', 'Divya Rao', 'divya.rao@email.com', '+91-9876543233', 'female', '1990-07-14', 'public', 4.2, true, 'https://i.pravatar.cc/150?img=24', 'Camping and outdoor gear expert', true),
('550e8400-e29b-41d4-a716-446655440025', 'Sandeep Kumar', 'sandeep.kumar@email.com', '+91-9876543234', 'male', '1988-05-09', 'private', 4.5, true, 'https://i.pravatar.cc/150?img=25', 'Electronics repair and rental specialist', true);

-- =============================================================================
-- USER LOCATIONS (Link users to their locations)
-- =============================================================================

-- Assign default locations to users
INSERT INTO user_locations (user_id, location_id, is_default, label) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM location WHERE city = 'Mumbai' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM location WHERE city = 'Bangalore' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM location WHERE city = 'New Delhi' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM location WHERE city = 'Chennai' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM location WHERE city = 'Hyderabad' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM location WHERE city = 'Pune' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM location WHERE city = 'Kolkata' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM location WHERE city = 'Ahmedabad' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM location WHERE city = 'Chandigarh' LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM location WHERE city = 'Mumbai' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM location WHERE city = 'Bangalore' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440012', (SELECT id FROM location WHERE city = 'New Delhi' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM location WHERE city = 'Chennai' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM location WHERE city = 'Hyderabad' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM location WHERE city = 'Pune' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440016', (SELECT id FROM location WHERE city = 'Kolkata' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440017', (SELECT id FROM location WHERE city = 'Ahmedabad' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440018', (SELECT id FROM location WHERE city = 'Chandigarh' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440019', (SELECT id FROM location WHERE city = 'Mumbai' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440020', (SELECT id FROM location WHERE city = 'Bangalore' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440021', (SELECT id FROM location WHERE city = 'New Delhi' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440022', (SELECT id FROM location WHERE city = 'Chennai' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440023', (SELECT id FROM location WHERE city = 'Hyderabad' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440024', (SELECT id FROM location WHERE city = 'Pune' ORDER BY random() LIMIT 1), true, 'Home'),
('550e8400-e29b-41d4-a716-446655440025', (SELECT id FROM location WHERE city = 'Kolkata' ORDER BY random() LIMIT 1), true, 'Home');

-- =============================================================================
-- SAMPLE FILES (for items)
-- =============================================================================

INSERT INTO file (id, user_id, name, url, file_type, file_size, mime_type, alt_text, is_public, bucket, path, original_name) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'laptop_image_1.jpg', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', 'image', 245632, 'image/jpeg', 'MacBook Pro on wooden desk', true, 'images', '550e8400-e29b-41d4-a716-446655440001/laptop_image_1.jpg', 'laptop_image_1.jpg'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'laptop_image_2.jpg', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800', 'image', 198543, 'image/jpeg', 'Gaming laptop with RGB keyboard', true, 'images', '550e8400-e29b-41d4-a716-446655440001/laptop_image_2.jpg', 'laptop_image_2.jpg'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'sofa_image_1.jpg', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 'image', 387219, 'image/jpeg', 'Modern grey sectional sofa', true, 'images', '550e8400-e29b-41d4-a716-446655440002/sofa_image_1.jpg', 'sofa_image_1.jpg'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'treadmill_1.jpg', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 'image', 456789, 'image/jpeg', 'Professional treadmill in gym', true, 'images', '550e8400-e29b-41d4-a716-446655440003/treadmill_1.jpg', 'treadmill_1.jpg'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'bookshelf_1.jpg', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'image', 325678, 'image/jpeg', 'Wooden bookshelf with books', true, 'images', '550e8400-e29b-41d4-a716-446655440004/bookshelf_1.jpg', 'bookshelf_1.jpg'),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'camera_1.jpg', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800', 'image', 234567, 'image/jpeg', 'Professional DSLR camera', true, 'images', '550e8400-e29b-41d4-a716-446655440005/camera_1.jpg', 'camera_1.jpg'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 'tent_1.jpg', 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800', 'image', 298765, 'image/jpeg', 'Camping tent in mountains', true, 'images', '550e8400-e29b-41d4-a716-446655440006/tent_1.jpg', 'tent_1.jpg'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'guitar_1.jpg', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800', 'image', 189432, 'image/jpeg', 'Acoustic guitar on stand', true, 'images', '550e8400-e29b-41d4-a716-446655440007/guitar_1.jpg', 'guitar_1.jpg'),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', 'dress_1.jpg', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', 'image', 156789, 'image/jpeg', 'Designer evening dress', true, 'images', '550e8400-e29b-41d4-a716-446655440008/dress_1.jpg', 'dress_1.jpg'),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440009', 'gaming_setup.jpg', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800', 'image', 412345, 'image/jpeg', 'Gaming setup with RGB lights', true, 'images', '550e8400-e29b-41d4-a716-446655440009/gaming_setup.jpg', 'gaming_setup.jpg'),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 'kitchen_mixer.jpg', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'image', 267891, 'image/jpeg', 'Professional kitchen mixer', true, 'images', '550e8400-e29b-41d4-a716-446655440010/kitchen_mixer.jpg', 'kitchen_mixer.jpg'),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440011', 'motorcycle_1.jpg', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'image', 345612, 'image/jpeg', 'Sport motorcycle in garage', true, 'images', '550e8400-e29b-41d4-a716-446655440011/motorcycle_1.jpg', 'motorcycle_1.jpg'),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440012', 'art_supplies.jpg', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800', 'image', 198765, 'image/jpeg', 'Professional art supplies set', true, 'images', '550e8400-e29b-41d4-a716-446655440012/art_supplies.jpg', 'art_supplies.jpg'),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440013', 'gym_weights.jpg', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'image', 389456, 'image/jpeg', 'Set of gym dumbbells', true, 'images', '550e8400-e29b-41d4-a716-446655440013/gym_weights.jpg', 'gym_weights.jpg'),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440014', 'party_lights.jpg', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', 'image', 234789, 'image/jpeg', 'LED party lighting setup', true, 'images', '550e8400-e29b-41d4-a716-446655440014/party_lights.jpg', 'party_lights.jpg'),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440015', 'garden_tools.jpg', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', 'image', 276543, 'image/jpeg', 'Professional garden tool set', true, 'images', '550e8400-e29b-41d4-a716-446655440015/garden_tools.jpg', 'garden_tools.jpg'),
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440016', 'baby_stroller.jpg', 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800', 'image', 198234, 'image/jpeg', 'Premium baby stroller', true, 'images', '550e8400-e29b-41d4-a716-446655440016/baby_stroller.jpg', 'baby_stroller.jpg'),
('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440017', 'drone_1.jpg', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800', 'image', 345678, 'image/jpeg', 'Professional photography drone', true, 'images', '550e8400-e29b-41d4-a716-446655440017/drone_1.jpg', 'drone_1.jpg'),
('650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440018', 'wedding_decor.jpg', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', 'image', 312456, 'image/jpeg', 'Wedding decoration setup', true, 'images', '550e8400-e29b-41d4-a716-446655440018/wedding_decor.jpg', 'wedding_decor.jpg'),
('650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440019', 'smart_home.jpg', 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800', 'image', 289765, 'image/jpeg', 'Smart home control panel', true, 'images', '550e8400-e29b-41d4-a716-446655440019/smart_home.jpg', 'smart_home.jpg');

-- =============================================================================
-- SAMPLE ITEMS (Diverse categories and realistic pricing)
-- =============================================================================

INSERT INTO item (id, user_id, title, description, category_id, condition, status, security_amount, rent_price_per_day, location_id, delivery_mode, min_rental_days, max_rental_days, is_negotiable, tags, rating_average, rating_count) VALUES
-- Electronics
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'MacBook Pro 16" M1 Max', 'High-performance laptop perfect for developers, designers, and content creators. Excellent condition with original charger and box.', 
 (SELECT id FROM categories WHERE category_name = 'Laptops & Computers'), 'like_new', 'available', 5000.00, 800.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440001' AND ul.is_default = true), 
 'both', 1, 7, true, ARRAY['macbook', 'laptop', 'apple', 'programming', 'design'], 4.8, 12),

('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009', 'Gaming PC Setup Complete', 'High-end gaming rig with RTX 4080, 32GB RAM, curved monitor, mechanical keyboard, and gaming mouse. Perfect for streaming and gaming.', 
 (SELECT id FROM categories WHERE category_name = 'Gaming Consoles'), 'good', 'available', 8000.00, 1200.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440009' AND ul.is_default = true), 
 'pickup', 2, 14, true, ARRAY['gaming', 'pc', 'rtx', 'streaming', 'esports'], 4.6, 8),

-- Furniture
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Modern Sectional Sofa', 'Comfortable 6-seater sectional sofa in premium fabric. Perfect for large living rooms and gatherings. Recently deep cleaned.', 
 (SELECT id FROM categories WHERE category_name = 'Living Room'), 'good', 'available', 3000.00, 450.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440002' AND ul.is_default = true), 
 'delivery', 3, 30, false, ARRAY['sofa', 'sectional', 'living room', 'furniture'], 4.2, 5),

-- Sports & Fitness
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Professional Treadmill', 'Commercial-grade treadmill with incline, heart rate monitor, and preset programs. Excellent for home workouts.', 
 (SELECT id FROM categories WHERE category_name = 'Gym Equipment'), 'good', 'available', 4000.00, 350.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440003' AND ul.is_default = true), 
 'pickup', 7, 30, true, ARRAY['treadmill', 'fitness', 'cardio', 'gym', 'exercise'], 4.5, 9),

-- Photography
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Canon EOS R5 with Lenses', 'Professional mirrorless camera with 24-70mm f/2.8L and 85mm f/1.4L lenses. Perfect for weddings, portraits, and commercial photography.', 
 (SELECT id FROM categories WHERE category_name = 'Photography'), 'like_new', 'available', 6000.00, 900.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440005' AND ul.is_default = true), 
 'both', 1, 10, false, ARRAY['camera', 'canon', 'photography', 'wedding', 'lens'], 4.9, 15),

-- Travel & Luggage
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'Premium Camping Tent Set', '4-person waterproof tent with sleeping bags, camping chairs, and portable stove. Complete camping solution for weekend getaways.', 
 (SELECT id FROM categories WHERE category_name = 'Travel & Luggage'), 'good', 'available', 1500.00, 300.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440006' AND ul.is_default = true), 
 'pickup', 2, 14, true, ARRAY['camping', 'tent', 'outdoor', 'adventure', 'hiking'], 4.3, 7),

-- Music Instruments
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'Taylor Acoustic Guitar', 'Beautiful Taylor 814ce acoustic guitar with electronics. Perfect for performances, recording, or learning advanced techniques.', 
 (SELECT id FROM categories WHERE category_name = 'Music Instruments'), 'like_new', 'available', 2000.00, 250.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440007' AND ul.is_default = true), 
 'both', 3, 30, false, ARRAY['guitar', 'acoustic', 'taylor', 'music', 'performance'], 4.7, 6),

-- Appliances
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 'KitchenAid Stand Mixer', 'Professional-grade stand mixer with multiple attachments. Perfect for baking, meal prep, and cooking enthusiasts.', 
 (SELECT id FROM categories WHERE category_name = 'Appliances'), 'good', 'available', 800.00, 150.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440010' AND ul.is_default = true), 
 'both', 1, 21, true, ARRAY['mixer', 'kitchen', 'baking', 'cooking', 'appliance'], 4.4, 11),

-- Vehicles
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440011', 'Royal Enfield Classic 350', 'Well-maintained motorcycle perfect for city rides and short trips. All documents, helmet, and safety gear included.', 
 (SELECT id FROM categories WHERE category_name = 'Bikes & Scooters'), 'good', 'available', 5000.00, 600.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440011' AND ul.is_default = true), 
 'pickup', 1, 7, true, ARRAY['motorcycle', 'royal enfield', 'bike', 'transport', 'adventure'], 4.1, 4),

-- Baby & Kids
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440016', 'Premium Baby Stroller', 'High-end baby stroller with car seat adapter, rain cover, and storage basket. Safety certified and regularly sanitized.', 
 (SELECT id FROM categories WHERE category_name = 'Baby & Kids'), 'like_new', 'available', 1000.00, 200.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440016' AND ul.is_default = true), 
 'both', 7, 90, false, ARRAY['stroller', 'baby', 'safety', 'transport', 'infant'], 4.6, 8),

-- Tools & Equipment
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440015', 'Professional Garden Tool Set', 'Complete gardening toolkit with premium tools, wheelbarrow, and storage shed. Perfect for landscaping projects.', 
 (SELECT id FROM categories WHERE category_name = 'Tools & Equipment'), 'good', 'available', 800.00, 100.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440015' AND ul.is_default = true), 
 'pickup', 3, 30, true, ARRAY['gardening', 'tools', 'landscaping', 'outdoor', 'maintenance'], 4.0, 3),

-- Events & Party
('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440014', 'LED Party Lighting Kit', 'Professional DJ lighting setup with moving heads, lasers, fog machine, and controller. Perfect for parties and events.', 
 (SELECT id FROM categories WHERE category_name = 'Events & Party'), 'good', 'available', 2000.00, 400.00, 
 (SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = '550e8400-e29b-41d4-a716-446655440014' AND ul.is_default = true), 
 'both', 1, 5, false, ARRAY['lighting', 'party', 'dj', 'events', 'wedding'], 4.3, 6);

-- =============================================================================
-- ITEM IMAGES (Link files to items)
-- =============================================================================

INSERT INTO item_image (item_id, file_id, is_primary, display_order) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', true, 1),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', false, 2),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440010', true, 1),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', true, 1),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', true, 1),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440006', true, 1),
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440007', true, 1),
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440008', true, 1),
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440011', true, 1),
('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440012', true, 1),
('750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440017', true, 1),
('750e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440016', true, 1),
('750e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440015', true, 1);

-- =============================================================================
-- SAMPLE BOOKINGS (Realistic booking scenarios)
-- =============================================================================

INSERT INTO booking (id, item_id, lender_user_id, borrower_user_id, start_date, end_date, daily_rate, total_rent, security_amount, platform_fee, booking_status, delivery_mode, confirmed_at, rating_by_lender, rating_by_borrower, feedback_by_lender, feedback_by_borrower) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 
 '2024-11-01', '2024-11-05', 800.00, 3200.00, 5000.00, 160.00, 'completed', 'delivery', 
 '2024-10-28 10:30:00+00', 5, 5, 'Excellent renter! Took great care of the MacBook.', 'Amazing laptop! Perfect for my design work.'),

('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440022', 
 '2024-11-10', '2024-11-12', 900.00, 1800.00, 6000.00, 90.00, 'completed', 'pickup', 
 '2024-11-08 14:15:00+00', 4, 5, 'Professional photographer, handled equipment perfectly.', 'Top-quality camera gear! Great for my wedding shoot.'),

('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', 
 '2024-11-15', '2024-11-22', 450.00, 3150.00, 3000.00, 157.50, 'in_progress', 'delivery', 
 '2024-11-12 09:45:00+00', null, null, null, null),

('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440024', 
 '2024-12-01', '2024-12-03', 300.00, 600.00, 1500.00, 30.00, 'confirmed', 'pickup', 
 '2024-11-28 16:20:00+00', null, null, null, null);

-- =============================================================================
-- SAMPLE ITEM REVIEWS
-- =============================================================================

INSERT INTO item_review (item_id, user_id, booking_id, rating, review_text, is_verified, helpful_count) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', '850e8400-e29b-41d4-a716-446655440001', 5, 'Incredible MacBook! Lightning fast performance, perfect for video editing and design work. Owner was very helpful and responsive.', true, 3),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440022', '850e8400-e29b-41d4-a716-446655440002', 5, 'Professional grade camera equipment in pristine condition. Amazing image quality and all accessories included. Highly recommended!', true, 5),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440020', null, 4, 'Very comfortable sofa, perfect for hosting guests. Clean and well-maintained. Would rent again for special occasions.', false, 2),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440013', null, 5, 'Excellent treadmill! Quiet operation, sturdy build, and all features work perfectly. Great for daily workouts.', false, 4),
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440019', null, 5, 'Beautiful guitar with amazing sound quality. Perfect for recording and performances. Owner takes great care of instruments.', false, 1);

-- =============================================================================
-- USER FAVORITES (Some users liking items)
-- =============================================================================

INSERT INTO user_favorite (user_id, item_id) VALUES
('550e8400-e29b-41d4-a716-446655440020', '750e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440018', '750e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440013', '750e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440021', '750e8400-e29b-41d4-a716-446655440009'),
('550e8400-e29b-41d4-a716-446655440017', '750e8400-e29b-41d4-a716-446655440006'),
('550e8400-e29b-41d4-a716-446655440019', '750e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440025', '750e8400-e29b-41d4-a716-446655440008'),
('550e8400-e29b-41d4-a716-446655440014', '750e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440011', '750e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440023', '750e8400-e29b-41d4-a716-446655440003');

-- =============================================================================
-- SAMPLE ANALYTICS EVENTS (Mock user interactions)
-- =============================================================================

INSERT INTO analytics_event (event_type, item_id, user_id, session_id, ip_address, user_agent, additional_data, event_timestamp) VALUES
-- Recent item views
('item_view', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', uuid_generate_v4(), '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"session_duration": 120}', NOW() - INTERVAL '1 hour'),
('item_view', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440018', uuid_generate_v4(), '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', '{"session_duration": 85}', NOW() - INTERVAL '2 hours'),
('item_view', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440022', uuid_generate_v4(), '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"session_duration": 200}', NOW() - INTERVAL '3 hours'),
('item_view', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', uuid_generate_v4(), '192.168.1.103', 'Mozilla/5.0 (Android 11; Mobile)', '{"session_duration": 90}', NOW() - INTERVAL '4 hours'),
('item_view', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', uuid_generate_v4(), '192.168.1.104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"session_duration": 150}', NOW() - INTERVAL '5 hours');

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
DECLARE
    category_count INTEGER;
    user_count INTEGER;
    item_count INTEGER;
    booking_count INTEGER;
    location_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM categories;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO item_count FROM item;
    SELECT COUNT(*) INTO booking_count FROM booking;
    SELECT COUNT(*) INTO location_count FROM location;
    
    RAISE NOTICE '=== P2P API Database Seeded Successfully ===';
    RAISE NOTICE 'Categories created: %', category_count;
    RAISE NOTICE 'Users created: %', user_count;
    RAISE NOTICE 'Locations created: %', location_count;
    RAISE NOTICE 'Items created: %', item_count;
    RAISE NOTICE 'Bookings created: %', booking_count;
    RAISE NOTICE '============================================';
END $$;