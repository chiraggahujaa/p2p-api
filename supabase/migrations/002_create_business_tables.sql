-- Migration: Create business logic tables (Items, Bookings, Payments, Support)
-- Created: P2P Platform Business Tables

-- Create ENUM types for business logic
CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
CREATE TYPE item_status AS ENUM ('available', 'booked', 'in_transit', 'delivered', 'returned', 'maintenance', 'inactive');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE delivery_mode AS ENUM ('pickup', 'delivery', 'both', 'none');
CREATE TYPE payment_method AS ENUM ('card', 'upi', 'wallet', 'bank_transfer', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE issue_type AS ENUM ('booking', 'payment', 'item_quality', 'delivery', 'user_behavior', 'technical', 'other');

-- 6. ITEM Table
CREATE TABLE item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id),
    condition item_condition NOT NULL,
    image_urls TEXT[], -- Array of image URLs
    status item_status DEFAULT 'available',
    security_amount DECIMAL(10,2) DEFAULT 0,
    rent_price_per_day DECIMAL(10,2) NOT NULL,
    location_id UUID NOT NULL REFERENCES location(id),
    delivery_mode delivery_mode DEFAULT 'both',
    min_rental_days INTEGER DEFAULT 1,
    max_rental_days INTEGER DEFAULT 30,
    is_negotiable BOOLEAN DEFAULT FALSE,
    tags TEXT[], -- Array of tags for search
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 7. BOOKING Table
CREATE TABLE booking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES item(id),
    lender_user_id UUID NOT NULL REFERENCES users(id),
    borrower_user_id UUID NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    daily_rate DECIMAL(10,2) NOT NULL,
    total_rent DECIMAL(10,2) NOT NULL,
    security_amount DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_rent + COALESCE(security_amount, 0) + COALESCE(platform_fee, 0)) STORED,
    booking_status booking_status DEFAULT 'pending',
    delivery_mode delivery_mode DEFAULT 'none',
    pickup_location UUID REFERENCES location(id),
    delivery_location UUID REFERENCES location(id),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Ratings (filled after booking completion)
    rating_by_lender INTEGER CHECK (rating_by_lender >= 1 AND rating_by_lender <= 5),
    rating_by_borrower INTEGER CHECK (rating_by_borrower >= 1 AND rating_by_borrower <= 5),
    feedback_by_lender TEXT,
    feedback_by_borrower TEXT,
    
    CONSTRAINT check_different_users CHECK (lender_user_id != borrower_user_id),
    CONSTRAINT check_valid_dates CHECK (end_date >= start_date)
);

-- 8. PAYMENT Table
CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES booking(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    transaction_id VARCHAR(255), -- External payment gateway transaction ID
    payment_status payment_status DEFAULT 'pending',
    gateway_response JSONB, -- Store gateway response for debugging
    paid_at TIMESTAMP WITH TIME ZONE,
    refund_id VARCHAR(255),
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10,2),
    platform_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. SUPPORT_REQ Table
CREATE TABLE support_req (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    issue_type issue_type NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    booking_id UUID REFERENCES booking(id), -- Optional reference to booking
    priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 5), -- 1=Highest, 5=Lowest
    status support_status DEFAULT 'open',
    assigned_to UUID, -- Can reference admin users
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ANALYTICS_EVENT Table (Time-series analytics events)
CREATE TABLE analytics_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- 'item_view', 'booking_created', 'booking_confirmed', etc.
    item_id UUID REFERENCES item(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    device_id UUID REFERENCES device(id),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_date DATE DEFAULT CURRENT_DATE, -- For time-based queries, set by trigger
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    additional_data JSONB, -- Flexible data for different event types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ITEM_METRIC Table (Pre-aggregated metrics for fast access)
CREATE TABLE item_metric (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    view_count INTEGER DEFAULT 0,
    unique_view_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    booking_conversion_rate DECIMAL(5,4) DEFAULT 0, -- views to bookings
    avg_session_duration INTEGER DEFAULT 0, -- in seconds
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, metric_date)
);

-- 12. ITEM_VIEW Table (Detailed view tracking - kept for backward compatibility)
CREATE TABLE item_view (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- NULL for anonymous views
    item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    device_id UUID REFERENCES device(id),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER -- in seconds
);

-- Additional utility tables

-- 13. ITEM_IMAGE Table (Better than array approach)
CREATE TABLE item_image (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, file_id)
);

-- 14. USER_FAVORITE Table
CREATE TABLE user_favorite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 15. ITEM_REVIEW Table (separate from booking ratings)
CREATE TABLE item_review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES booking(id), -- Link to actual booking
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- TRUE if from actual booking
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, booking_id) -- Prevent duplicate reviews per booking
);

-- Create comprehensive indexes
CREATE INDEX idx_item_user ON item(user_id);
CREATE INDEX idx_item_category ON item(category_id);
CREATE INDEX idx_item_location ON item(location_id);
CREATE INDEX idx_item_status ON item(status);
CREATE INDEX idx_item_price ON item(rent_price_per_day);
CREATE INDEX idx_item_rating ON item(rating_average);
CREATE INDEX idx_item_created ON item(created_at);
CREATE INDEX idx_item_active ON item(is_active);

CREATE INDEX idx_booking_item ON booking(item_id);
CREATE INDEX idx_booking_lender ON booking(lender_user_id);
CREATE INDEX idx_booking_borrower ON booking(borrower_user_id);
CREATE INDEX idx_booking_status ON booking(booking_status);
CREATE INDEX idx_booking_dates ON booking(start_date, end_date);
CREATE INDEX idx_booking_created ON booking(created_at);

CREATE INDEX idx_payment_booking ON payment(booking_id);
CREATE INDEX idx_payment_user ON payment(user_id);
CREATE INDEX idx_payment_status ON payment(payment_status);
CREATE INDEX idx_payment_date ON payment(paid_at);

CREATE INDEX idx_support_user ON support_req(user_id);
CREATE INDEX idx_support_status ON support_req(status);
CREATE INDEX idx_support_type ON support_req(issue_type);
CREATE INDEX idx_support_created ON support_req(created_at);

-- Analytics events indexes (optimized for time-series queries)
CREATE INDEX idx_analytics_event_item_time ON analytics_event(item_id, event_timestamp);
CREATE INDEX idx_analytics_event_type_time ON analytics_event(event_type, event_timestamp);
CREATE INDEX idx_analytics_event_user_time ON analytics_event(user_id, event_timestamp);
CREATE INDEX idx_analytics_event_date ON analytics_event(event_date);

-- Item metrics indexes (for fast dashboard queries)
CREATE INDEX idx_item_metric_item_date ON item_metric(item_id, metric_date);
CREATE INDEX idx_item_metric_date ON item_metric(metric_date);
CREATE INDEX idx_item_metric_views ON item_metric(view_count);
CREATE INDEX idx_item_metric_bookings ON item_metric(booking_count);

CREATE INDEX idx_item_view_item ON item_view(item_id);
CREATE INDEX idx_item_view_user ON item_view(user_id);
CREATE INDEX idx_item_view_date ON item_view(viewed_at);

CREATE INDEX idx_item_image_item ON item_image(item_id);
CREATE INDEX idx_item_image_primary ON item_image(item_id, is_primary);

CREATE INDEX idx_user_favorite_user ON user_favorite(user_id);
CREATE INDEX idx_user_favorite_item ON user_favorite(item_id);

CREATE INDEX idx_item_review_item ON item_review(item_id);
CREATE INDEX idx_item_review_user ON item_review(user_id);
CREATE INDEX idx_item_review_rating ON item_review(rating);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_item_updated_at 
    BEFORE UPDATE ON item 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_updated_at 
    BEFORE UPDATE ON booking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_updated_at 
    BEFORE UPDATE ON payment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_updated_at 
    BEFORE UPDATE ON support_req 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_review_updated_at 
    BEFORE UPDATE ON item_review 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_metric_updated_at 
    BEFORE UPDATE ON item_metric 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to set event_date from event_timestamp
CREATE OR REPLACE FUNCTION set_analytics_event_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.event_date := NEW.event_timestamp::date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to analytics_event table
CREATE TRIGGER set_analytics_event_date_trigger
    BEFORE INSERT OR UPDATE ON analytics_event
    FOR EACH ROW EXECUTE FUNCTION set_analytics_event_date();